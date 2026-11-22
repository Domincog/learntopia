// Data & Statistics · Lesson 1 · The Middle of the Data
import { r, num, sum, median } from '../../../kit.js';
import { WORDS, listOf, thousands } from '../helpers.js';

export default {
  id: 'center',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A billionaire walks into a café',
      text: r`
        Nine people are sitting in a café. Each of them earns about \$40,000 a year.

        Then someone who earns **\$1 billion** a year walks in and orders a coffee.
        What is the *average* income in the café now?
      `,
      shuffle: false,
      options: [
        { text: r`About \$40,000` },
        { text: r`About \$400,000` },
        { text: r`About \$100 million`, correct: true },
        { text: r`About \$1 billion` },
      ],
      explain: r`
        Add up all ten incomes and share the total out equally. The nine regulars add only \$360,000
        to the billionaire's \$1,000,000,000, so the total is just over \$1 billion.
        Shared among ten people, that is **about \$100 million each**.

        On paper, the "average" customer is now a multimillionaire. Nobody in the room earns anything like that.

        This lesson is about where that number comes from, and about a second kind of average that is much harder to fool.
      `,
    },
    {
      id: 'balance',
      type: 'interact',
      graded: false,
      title: 'Find the balance point',
      text: `
        Forget money for a moment. Five equal weights sit on a ruler at **1, 2, 3, 4 and 10**.

        **Drag the orange pivot** until the ruler balances. The two numbers underneath add up how far
        the weights on each side are from the pivot.
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 10, values: [1, 2, 3, 4, 10], fulcrum: 7, rows: 2, readouts: ['left', 'right'],
        alt: 'Five weights on a ruler at 1, 2, 3, 4 and 10, with a movable pivot underneath.',
      },
      check: (s) => s.balanced || (s.fulcrum < s.mean
        ? 'The right side is still heavier. Slide the pivot to the right.'
        : 'Now the left side is heavier. Slide the pivot to the left.'),
      solution: { fulcrum: 4 },
      explain: r`
        It balances at **4**. Not at 3, the middle weight: the lone weight out at 10 has a lot of leverage.

        That weight is 6 steps from the pivot, which exactly matches the three weights on the left: $3 + 2 + 1 = 6$ steps in total.
        (The weight at 4 sits on the pivot and pulls neither way.)
      `,
    },
    {
      id: 'mean-idea',
      type: 'info',
      title: 'The mean is the balance point',
      text: r`
        Now do some arithmetic with the same five numbers. Add them up, then share the total equally:

        $$ \frac{1 + 2 + 3 + 4 + 10}{5} = \frac{20}{5} = 4 $$

        That is the **mean**, and it is exactly where the ruler balanced. This is no accident:
        the distances to the left of the mean always add up to the same as the distances to the right.

        :::key
        **Mean** = the total, shared out equally. Add up the values and divide by how many there are.
        It is the balance point of the data.
        :::
      `,
    },
    {
      id: 'mean-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { who: 'friends counted the messages they sent yesterday', unit: 'messages' },
          { who: 'mornings in a row, a café sold this many pastries', unit: 'pastries', days: true },
          { who: 'evenings in a row, a reader logged the pages she read', unit: 'pages', days: true },
          { who: 'players noted how many goals they scored this season', unit: 'goals' },
        ]);
        const n = rng.pick([4, 5, 5, 6]);
        const m = rng.int(6, 15);
        let values = null;
        for (let tries = 0; tries < 60 && !values; tries++) {
          const first = Array.from({ length: n - 1 }, () => m + rng.int(-5, 5));
          const last = m * n - sum(first);
          if (last >= 1 && Math.abs(last - m) <= 6) values = rng.shuffle([...first, last]);
        }
        if (!values) values = rng.shuffle([m - 3, m + 3, m - 1, m + 1, m, m].slice(0, n));
        const total = sum(values);
        const med = median(values);
        return {
          text: scene.days
            ? `On ${WORDS[n].toLowerCase()} ${scene.who}: **${listOf(values)}**. What is the **mean**?`
            : `${WORDS[n]} ${scene.who}: **${listOf(values)}**. What is the **mean**?`,
          answer: m,
          unit: scene.unit,
          wrong: [
            [total, `That is the total. The mean shares it out equally: divide by ${n}.`],
            [med, 'That is the middle value when you sort them. For the mean, add everything up and divide by the count.'],
          ],
          feedback: (v) => (Math.abs(v - total / (n - 1)) < 0.06 ? `Count again: there are ${n} values, so divide by ${n}.` : null),
          hints: ['Add up all the values first.', `The total is ${total}. Share it equally among ${n}.`],
          explain: r`Total: $${values.join(' + ')} = ${total}$. Shared out among ${n}: $${total} \div ${n} = ${m}$.`,
        };
      },
    },
    {
      id: 'teach-total',
      type: 'info',
      title: 'Mean and total: two views of one thing',
      text: r`
        The mean is the total shared out equally. Turn that around and you get **total = mean × count**.

        So if you know where a ruler balances, you know what its weights must add up to.

        :::example
        Four weights balance at **6**. Three of them sit at 3, 5 and 8. Where is the fourth?

        1. The total must be $4 \times 6 = 24$.
        2. The three you know add up to $3 + 5 + 8 = 16$.
        3. So the fourth sits at $24 - 16 = 8$.
        :::
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 10, values: [3, 5, 8, 8], drag: false, fulcrum: { at: 6, fixed: true }, rows: 2,
        alt: 'A level ruler with its pivot at 6 and four weights on it: one at 3, one at 5 and two at 8.',
        caption: 'Weights at 3, 5, 8 and 8: a total of 24, so the ruler balances at 24 ÷ 4 = 6.',
      },
    },
    {
      id: 'missing-weight',
      type: 'interact',
      title: 'One weight left to place',
      text: `
        This time the pivot is fixed at **5**. Four weights are fixed too, at 3, 4, 5 and 6.

        **Drag the orange weight** to the one spot where the ruler balances.
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 10, values: [3, 4, 5, 6, 1], drag: [4], fulcrum: { at: 5, fixed: true }, rows: 2,
        alt: 'A ruler with a fixed pivot at 5, fixed weights at 3, 4, 5 and 6, and one movable orange weight.',
      },
      check: (s) => s.balanced || (s.mean < 5
        ? 'Still tipping to the left. The orange weight needs more leverage on the right.'
        : 'Too far: now the right side is heavier.'),
      solution: { values: [3, 4, 5, 6, 7] },
      hints: [
        'The ruler balances at the mean. So the five positions must have a mean of 5. What must they add up to?',
        'Five values with a mean of 5 add up to 25. The four fixed weights already make 18.',
      ],
      explain: r`
        A mean of 5 across five weights needs a total of $5 \times 5 = 25$.
        The fixed weights add up to $3 + 4 + 5 + 6 = 18$, so the last one must sit at $25 - 18 = 7$.

        Any other spot gives a different total, and the ruler tips.
      `,
    },
    {
      id: 'drag-rich',
      type: 'interact',
      graded: false,
      title: 'Back to the café',
      text: `
        Here are five customers, placed by yearly income in **thousands of dollars**.
        The [pivot]{.orange} under the ruler marks the mean. The [flag]{.violet} on top marks the **median**: the customer in the middle.

        The ruler is too short for a billionaire, so settle for this: **drag the orange customer all the way to the right** and watch both markers.
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 200, step: 10, major: 20, values: [20, 30, 40, 50, 60], drag: [4], rows: 2,
        alt: 'Five incomes on a ruler from 0 to 200 thousand dollars, at 20, 30, 40, 50 and 60. The largest can be dragged.',
      },
      check: (s) => s.max >= 200 || 'Further! Drag the orange dot right to the end of the ruler, at 200.',
      solution: { values: [20, 30, 40, 50, 200] },
      explain: `
        The mean chased the rich customer, from 40 all the way up to 68. The median did not move at all: it is still 40.

        The median only asks *who is in the middle*. Making the richest person richer does not change that.
      `,
    },
    {
      id: 'median-idea',
      type: 'info',
      title: 'The median: the one in the middle',
      text: r`
        To find the **median**, line the values up in order and take the middle one. Half of the data lies below it, half above.

        $$ 20,\; 30,\; \violet{40},\; 50,\; 200 $$

        The median is 40. With an even number of values, two share the middle, and the median is halfway between them:

        $$ 20,\; 30,\; \violet{40},\; \violet{50},\; 60,\; 200 $$

        Here the median is 45.

        :::example
        A list rarely arrives in order. Take 9, 2, 12, 3, 7. **Sort first:** 2, 3, 7, 9, 12.
        The middle one, with two values on each side, is **7**. (The 12 in the middle of the unsorted list is not the median.)
        :::
      `,
    },
    {
      id: 'median-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([5, 6, 7]);
        const scene = rng.pick([
          { what: 'The ages of the people at a family dinner', lo: 4, hi: 80 },
          { what: 'Minutes that a group of runners took for the same lap', lo: 8, hi: 30 },
          { what: 'Marks out of 50 on a quiz', lo: 12, hi: 50 },
          { what: 'The number of books each person in a reading club owns', lo: 5, hi: 95 },
        ]);
        let values = rng.sample(Array.from({ length: scene.hi - scene.lo + 1 }, (_, i) => scene.lo + i), n);
        const sorted = values.slice().sort((a, b) => a - b);
        const answer = median(values);
        // make sure the list as written does not already have the median in the middle
        for (let tries = 0; tries < 20 && n % 2 === 1 && values[(n - 1) / 2] === answer; tries++) values = rng.shuffle(values);
        const even = n % 2 === 0;
        const lo = sorted[n / 2 - 1];
        const hi = sorted[n / 2];
        const m = sum(values) / n;
        return {
          text: `${scene.what}: **${listOf(values)}**. What is the **median**?${even ? ' (If two values share the middle, give the number halfway between them.)' : ''}`,
          answer,
          wrong: [
            ...(even
              ? [[lo, `There are ${n} values, so two share the middle: ${lo} and ${hi}. Give the number halfway between them.`],
                [hi, `There are ${n} values, so two share the middle: ${lo} and ${hi}. Give the number halfway between them.`]]
              : [[values[(n - 1) / 2], 'That is the middle of the list as it is written. Sort the values first.']]),
          ],
          feedback: (v) => (Math.abs(v - m) < 0.06 && Math.abs(m - answer) > 0.06 ? 'That is the mean. For the median, sort the values and find the middle.' : null),
          hints: ['Put the values in order, smallest first.', `Sorted: ${listOf(sorted)}. Now find the middle.`],
          explain: even
            ? r`Sorted: ${listOf(sorted)}. The two middle values are ${lo} and ${hi}, so the median is $\frac{${lo} + ${hi}}{2} = ${num(answer)}$.`
            : `Sorted: ${listOf(sorted)}. The middle one, with ${(n - 1) / 2} values on each side, is **${answer}**.`,
        };
      },
    },
    {
      id: 'teach-typical',
      type: 'info',
      title: 'Which average should you quote?',
      text: r`
        The mean and the median are both called *averages*. They part company when there is an **outlier**: a value far away from all the others, like the rich customer.

        :::example
        Five incomes, in thousands: 20, 30, 40, 50, 60. The mean is 40 and so is the median. Then the 60 becomes **200**.

        - The total rises by 140, so the mean rises by $140 \div 5 = 28$, to **68**.
        - The middle value has not changed: the median is still **40**.
        :::

        :::key
        Every value pulls on the **mean**. An outlier cannot drag the **median** away.
        So for lopsided data, such as incomes or house prices, the median describes a typical value better.
        :::
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 200, step: 10, major: 20, values: [20, 30, 40, 50, 200], drag: false, rows: 2,
        alt: 'Five incomes on a ruler: 20, 30, 40, 50 and, far to the right, 200. The pivot marking the mean is at 68; the flag marking the median is at 40.',
        caption: 'One outlier at 200. The pivot (mean) sits at 68, above four of the five customers. The flag (median) stays at 40.',
      },
    },
    {
      id: 'which-average',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { intro: 'Seven houses on one street were sold last year. Their prices, in thousands of dollars', what: 'what a typical house on this street sold for', unit: 10, lo: 18, hi: 34, top: [130, 260] },
          { intro: 'Seven people work at a small company. Their yearly pay, in thousands of dollars', what: 'what a typical person at this company earns', unit: 2, lo: 14, hi: 24, top: [140, 220] },
          { intro: 'Seven classmates compare how many followers they have online', what: 'how many followers a typical classmate has', unit: 50, lo: 3, hi: 9, top: [400, 1200] },
        ]);
        let base;
        let big;
        let meanValue;
        for (let tries = 0; tries < 80; tries++) {
          base = rng.sample(Array.from({ length: scene.hi - scene.lo + 1 }, (_, i) => (scene.lo + i) * scene.unit), 6).sort((a, b) => a - b);
          meanValue = scene.unit * Math.round((sum(base) + scene.unit * rng.int(scene.top[0], scene.top[1])) / (7 * scene.unit));
          big = 7 * meanValue - sum(base);
          if (big > 3 * base[5] && meanValue > base[5]) break;
        }
        const med = base[3];
        const midrange = (base[0] + big) / 2;
        const values = rng.shuffle([...base, big]);
        const options = [
          { text: thousands(med), correct: true },
          { text: thousands(meanValue), why: `${thousands(meanValue)} is the mean. The sum is right, but six of the seven values are below it: one extreme value has dragged it away from where the data sits.` },
          { text: thousands(big), why: 'That is the one exception, not a typical case.' },
        ];
        if (![med, meanValue, big].includes(midrange)) {
          options.push({ text: thousands(midrange), why: 'That is halfway between the smallest and the largest value. It ignores everything in between.' });
        }
        return {
          text: `${scene.intro}: **${values.map(thousands).join(' · ')}**.\n\nWhich single number best describes ${scene.what}?`,
          options,
          hints: ['Six of the values are close together and one is far away. Which kind of average ignores how far away it is?'],
          explain: `
            Sorted, the middle (4th) value is **${thousands(med)}**: the median. That is what a typical case looks like here.

            The mean is ${thousands(meanValue)}, pulled far up by the single value of ${thousands(big)}. For lopsided data such as prices and incomes, the median is the fairer summary.
          `,
        };
      },
    },
    {
      id: 'outlier-effect',
      type: 'fill',
      gen: (rng) => {
        const m = rng.pick([35, 40, 45, 50]);
        const k = rng.pick([20, 30, 50, 90]);
        const top = m + 10 + 5 * k;
        return {
          text: `
            Five people work in a small office. Their yearly pay, in thousands of dollars:
            **${m - 10}, ${m - 5}, ${m}, ${m + 5}, ${m + 10}**. So the mean is ${m} and the median is ${m}.

            The best-paid person becomes the boss, and their pay jumps from ${m + 10} to **${top}**. What happens to the two averages?
          `,
          template: `The mean [[stays the same|*goes up|goes down]], from ${m} to [[${m + k}]]. The median [[*stays the same|goes up|goes down]]: it is now [[${m}]].`,
          hints: [`The total rises by ${top - (m + 10)}. Shared among five people, how much is that each?`],
          explain: r`
            The total rises by $${top} - ${m + 10} = ${5 * k}$, so the mean rises by $${5 * k} \div 5 = ${k}$, to ${m + k}.
            The middle person is the same as before, so the median is still ${m}.
          `,
        };
      },
    },
    {
      id: 'pull-apart',
      type: 'interact',
      attempts: 6,
      stretch: true,
      title: 'Pull them apart',
      text: `
        Right now the mean and the median of these five dots are both 3.

        **Move the dots so that the median stays at 3 but the mean becomes 5.**
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 10, values: [1, 2, 3, 4, 5], rows: 3,
        alt: 'Five draggable dots on a ruler from 0 to 10, starting at 1, 2, 3, 4 and 5.',
      },
      check: (s) => {
        if (s.median !== 3) return `The median is now ${num(s.median)}. The middle dot of the five must stay at 3.`;
        if (s.mean < 5) return `Median 3, mean ${num(s.mean)}. Push the mean up without touching the middle: which dots can go right without changing who is in the middle?`;
        if (s.mean > 5) return `Median 3, but the mean is ${num(s.mean)}: a little too high now.`;
        return true;
      },
      solution: { values: [1, 2, 3, 9, 10] },
      hints: [
        'The two dots to the right of the middle can go as far right as you like. The median will not notice.',
        'A mean of 5 needs a total of 25. The dots start with a total of 15, so they must gain 10 between them.',
      ],
      explain: `
        One way: 1, 2, 3, **9, 10**. The middle dot is still at 3, but the total is now 25, so the mean is 5.

        Only the mean feels *how far* the top values are from the rest. A long tail on one side pulls the mean away from the median, just like this.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think back to the café.

        In your own words: **why did the billionaire change the mean income so much, but not the median?**
      `,
      model: `
        The mean shares out the *total*, and the billionaire adds an enormous amount to the total, so everybody's "share" shoots up.

        The median only looks at who stands in the middle when people line up by income. One extra person at the far end hardly shifts the middle, however rich they are.
      `,
    },
  ],
  recap: [
    'The **mean** is the total shared out equally. It is the balance point of the data.',
    'The **median** is the middle value once the data is sorted.',
    'One extreme value can drag the mean a long way. The median barely notices.',
    'For lopsided data, such as incomes or house prices, the median describes a typical value better.',
  ],
  next: 'Next: two data sets can share the same mean and still be nothing alike.',
};
