// Probability II: Random Variables · Lesson 4 · Why the Bell Appears
import { r, num } from '../../../kit.js';
import { commas, slips } from '../helpers.js';

const LOADED = [4, 1, 0, 0, 1, 4];        // a die that lands on 1 or 6 most of the time, and never on 3 or 4

/** Share of a normal curve within z SDs of its mean, in per cent, for the settings the band slider offers. */
const INSIDE = { 0.5: 38.3, 1: 68.3, 1.5: 86.6, 2: 95.4, 2.5: 98.8, 3: 99.7 };

/** Labels under the curve: the mean, and whole numbers of SDs either side of it. */
const SD_MARKS = [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ x: k, y: -0.045, anchor: 'middle', text: k === 0 ? 'mean' : `${k > 0 ? '+' : '−'}${Math.abs(k)} SD` }));

export default {
  id: 'normal-curve',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Thirty crooked dice',
      text: `
        This die is loaded. It lands on 1 or 6 most of the time, and never on 3 or 4.

        You roll **30 of these dice** and add them up. **What will a chart of the possible totals look like?**
      `,
      figure: {
        type: 'dice-sum-lab', static: true, weights: LOADED, n: 1, noun: ['loaded die', 'loaded dice'], meanLabel: 'expected value',
        alt: 'The chances of the faces of a loaded die: tall bars at 1 and 6, short bars at 2 and 5, nothing at 3 and 4.',
      },
      shuffle: false,
      options: [
        { text: 'Two humps, one low and one high, like the die itself' },
        { text: 'One hump in the middle, shaped like a bell', correct: true },
        { text: 'Roughly flat: all totals about equally likely' },
      ],
      explain: `
        One hump, in the middle, shaped like a bell. The lopsided shape of the single die disappears
        completely once enough of them are added together.

        Start with honest dice and watch it happen.
      `,
    },
    {
      id: 'add-dice',
      type: 'interact',
      graded: false,
      title: 'One die, two dice, ten dice',
      text: `
        The chart shows the exact chance of every total. With one fair die it is flat: six equal bars.
        The dashed line marks the **mean**, which is another name for the expected value.

        **Add dice one at a time, up to at least 10,** and watch the shape change.
      `,
      widget: {
        type: 'dice-sum-lab', n: 1, nRange: [1, 30], die: false,
        alt: 'A bar chart of the chance of each total when fair dice are added up, with a slider for the number of dice.',
      },
      check: (s) => s.n >= 10 || `${s.n} ${s.n === 1 ? 'die' : 'dice'} so far. Go up to at least 10.`,
      solution: { n: 10 },
      explain: `
        One die: flat. Two dice: the triangle you know from the 36 outcomes, peaking at 7. Three dice:
        the corners round off. By ten dice the chart is a bell.

        The reason is counting. A middle total can be made in a huge number of ways. An extreme
        total needs almost every die to show the same thing.
      `,
    },
    {
      id: 'load-dice',
      type: 'interact',
      title: 'Now cheat',
      text: `
        Does the bell depend on the dice being fair? **Load the die any way you like** by tapping the
        bars of the small chart. Make it as lopsided as you dare, but leave at least two faces possible.

        **Then add up 30 of your dice.** The orange line is a bell curve with the same centre and width.
      `,
      widget: {
        type: 'dice-sum-lab', n: 1, nRange: [1, 30], edit: true, curve: true,
        alt: 'A bar chart of the chance of each total of the dice, a small chart for loading one die, and a slider for the number of dice.',
      },
      check: (s) => {
        if (s.faces < 2) return 'A die that always shows the same face has no chance left in it: there is nothing to add up. Give at least two faces some weight.';
        if (s.flat) return 'This is still a fair die. Tap the bars of the small chart to load it.';
        if (s.n < 30) return `Your die is loaded. Now add dice: ${s.n} so far, go to 30.`;
        return true;
      },
      solution: { weights: LOADED, n: 30 },
      hints: ['Tap a bar in the small "one die" chart to change that face\'s weight. Then move the slider to 30.'],
      explain: `
        A bell again. Its centre and its width depend on how you loaded the die. Its *shape* does not.

        With few dice your loading still shows through, and a very lopsided die needs more dice before
        the bars hug the orange line. But they get there.
      `,
    },
    {
      id: 'clt',
      type: 'info',
      title: 'The central limit theorem',
      text: `
        What you just saw is one of the most remarkable facts in mathematics.

        :::key
        Add up many **independent** random quantities, none of which dominates the rest, and the total
        follows, very nearly, a bell-shaped curve: the **normal curve**. The shape of the individual pieces hardly matters.
        :::

        This is the **central limit theorem**. Its proof is beyond this course, so the charts are your
        evidence. It explains why bells turn up everywhere. A person's height, the error in a careful
        measurement, the number of heads in 1000 flips: each is, at least roughly, the sum of many small, separate effects.

        A normal curve is fixed by two numbers: its mean and its standard deviation. So the next question
        is how those two behave when you add things up.
      `,
    },
    {
      id: 'double-sd',
      type: 'interact',
      title: 'How fast does the wobble grow?',
      text: `
        One fair die has a standard deviation of **1.71**. Adding dice makes the total wobble more.

        **How many dice does it take for the total to have exactly twice that SD: 3.42?**
      `,
      widget: {
        type: 'dice-sum-lab', n: 1, nRange: [1, 12], die: false, readouts: ['sd'],
        alt: 'A bar chart of the chance of each total of fair dice, with the standard deviation of the total and a slider for the number of dice.',
      },
      check: (s) => {
        if (s.n === 4) return true;
        if (s.n === 1) return 'That is a single die: SD 1.71. Add dice until the SD of the total reaches 3.42.';
        if (s.n === 2) return 'Two dice: the SD is 2.42. That is about 1.41 times the SD of one die, not double. Keep adding.';
        if (s.n === 3) return 'Three dice: the SD is 2.96. Not double yet.';
        return `${s.n} dice: the SD is ${num(s.sd, 2)}, which is more than 3.42.`;
      },
      solution: { n: 4 },
      hints: ['Watch the "SD of the total" readout as you move the slider.'],
      explain: `
        Four dice, not two. A second die adds less wobble than the first one had, because two
        independent dice often pull in opposite directions.
      `,
    },
    {
      id: 'teach-root-n',
      type: 'info',
      title: 'The square-root rule',
      text: r`
        Why four? The dice are independent, so their **variances** add, as in the last lesson: $n$ dice
        have $n$ times the variance of one. Take the square root:

        :::key
        $$ \text{SD of the total} = \sqrt{n} \times \text{SD of one} $$
        :::

        To double the SD you need $2^2 = 4$ dice. To triple it, 9. A hundred dice wobble only 10 times as much as one.

        :::example
        **36 parcels** are weighed together. Each has an SD of 4 g, independently of the others.

        - SD of the total: $\sqrt{36} \times 4 = 24$ g. Not 144 g: independent parcels partly cancel.

        **256 coin flips**, each worth 0 or 1 head, with variance $\frac{1}{4}$.

        - Variance of the number of heads: $256 \times \frac{1}{4} = 64$. Its SD: $\sqrt{64} = 8$ heads.
        :::
      `,
    },
    {
      id: 'sd-total',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([4, 9, 16, 25, 100]);
        const sd = rng.pick([2, 3, 5, 10]);
        const root = Math.sqrt(n);
        const story = rng.pick([
          { text: `A café's takings on a single day have a standard deviation of **${sd} coins**. Different days are independent of each other.\n\n**What is the standard deviation of the total takings over ${n} days?**`, unit: 'coins', one: 'one day', parts: 'days' },
          { text: `A machine fills bags of flour. The weight of a bag has a standard deviation of **${sd} g**, and the bags are independent of each other.\n\n**What is the standard deviation of the total weight of ${n} bags?**`, unit: 'g', one: 'one bag', parts: 'bags' },
          { text: `A robot takes ${n} steps. The length of each step has a standard deviation of **${sd} mm**, independently of the other steps.\n\n**What is the standard deviation of the total distance covered?**`, unit: 'mm', one: 'one step', parts: 'steps' },
        ]);
        const answer = root * sd;
        return {
          text: story.text,
          answer,
          unit: story.unit,
          wrong: slips(answer, [
            [n * sd, `That adds the ${n} standard deviations. It would be right if all the ${story.parts} moved together. Independent ${story.parts} partly cancel: add the variances instead.`],
            [sd, `That is the SD of ${story.one}. The total of ${n} wobbles more.`],
            [sd / root, `That is the SD of the *average*. The total is ${n} times the average, and its SD grows.`],
          ]),
          hints: [
            'For independent parts the variances add, so the SD of the total grows like the square root of the number of parts.',
            r`$\sqrt{${n}} = ${root}$. Multiply the SD of ${story.one} by that.`,
          ],
          explain: r`The ${story.parts} are independent, so the variances add: the SD of the total is $\sqrt{${n}} \times ${sd} = ${root} \times ${sd} = ${answer}$ ${story.unit}. Not $${n} \times ${sd} = ${n * sd}$: independent ${story.parts} partly cancel.`,
        };
      },
    },
    {
      id: 'average',
      type: 'interact',
      title: 'The average calms down',
      text: `
        This chart shows the **average** of the dice: the total divided by the number of dice. Its
        standard deviation shrinks as dice are added.

        **Find the smallest number of dice for which the SD of the average is below 0.5.**
      `,
      widget: {
        type: 'dice-sum-lab', n: 1, nRange: [1, 30], view: 'average', die: false, readouts: ['sd'],
        alt: 'A bar chart of the chance of each possible average of fair dice, with its standard deviation and a slider for the number of dice.',
      },
      check: (s) => {
        if (s.sd >= 0.5) return `${s.n} ${s.n === 1 ? 'die' : 'dice'}: the SD of the average is ${num(s.sd, 2)}. Not below 0.5 yet.`;
        if (s.n > 12) return `${s.n} dice: the SD of the average is ${num(s.sd, 2)}, which is below 0.5. But fewer dice will do: find the smallest number.`;
        return true;
      },
      solution: { n: 12 },
      hints: ['Move the slider one step at a time and watch the "SD of the average" readout cross 0.5.'],
      explain: r`
        Twelve dice: $1.71 \div \sqrt{12} \approx 0.49$. Eleven are not quite enough.
      `,
    },
    {
      id: 'teach-average',
      type: 'info',
      title: 'An average wobbles less',
      text: r`
        The average is the total divided by $n$, so its SD is the SD of the total divided by $n$:

        $$ \frac{\sqrt{n} \times \text{SD of one}}{n} = \frac{\text{SD of one}}{\sqrt{n}} $$

        :::example
        A lab weighs the same sample again and again. A single weighing has an SD of 10 mg.

        - The average of **25** weighings: $\mathord{10 \div \sqrt{25} = 2}$ mg.
        - The average of **100** weighings: $\mathord{10 \div \sqrt{100} = 1}$ mg.
        :::

        This is the law of large numbers from the first course, with a speed limit: to halve the
        wobble of an average, you need **four times** as many pieces.
      `,
    },
    {
      id: 'four-times',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const f = rng.pick([2, 3, 4, 5, 10]);
        const scene = rng.pick([
          { n0: rng.pick([100, 400, 500]), text: (n0) => `A poll asks **${n0} people**, chosen at random and independently of each other. Its result wobbles from one poll to the next, and the pollster wants the standard deviation of the result to be **${f} times smaller**.\n\n**How many people must be asked?**`, unit: 'people' },
          { n0: rng.pick([6, 8, 12]), text: (n0) => `A lab reports the average of **${n0} independent measurements**. It wants the standard deviation of that average to be **${f} times smaller**.\n\n**How many measurements must it average?**`, unit: 'measurements' },
        ]);
        const n0 = scene.n0;
        const answer = n0 * f * f;
        return {
          text: scene.text(n0),
          answer,
          unit: scene.unit,
          wrong: slips(answer, [
            [n0 * f, `With ${f} times as many, the SD shrinks only by a factor of $\\sqrt{${f}}$. What must the square root be to give ${f}?`],
            [f * f, `That is the right factor. Now multiply the ${n0} ${scene.unit} by it.`],
          ]),
          hints: [
            'The SD of an average shrinks like 1 divided by the square root of the number of pieces.',
            `To divide the SD by ${f}, the square root of the number must grow ${f} times. So the number itself must grow ${f} × ${f} times.`,
          ],
          explain: r`The SD of an average is proportional to $\dfrac{1}{\sqrt{n}}$. To make it ${f} times smaller, $\sqrt{n}$ must be ${f} times larger, so $n$ must be $${f}^2 = ${f * f}$ times larger: $${n0} \times ${f * f} = ${commas(answer)}$ ${scene.unit}.`,
        };
      },
    },
    {
      id: 'rule',
      type: 'interact',
      title: 'Reading a normal curve',
      text: `
        On a normal curve, distance from the mean is counted in standard deviations. The shaded band
        reaches the same number of SDs either side of the mean.

        **Widen the band until it covers about 95% of the area under the curve.**
      `,
      widget: {
        type: 'plot', x: [-4, 4], y: [-0.07, 0.45], xStep: 1, yStep: 0.1, height: 300, tickLabels: false,
        params: { z: { min: 0.5, max: 3, step: 0.5, value: 0.5, label: 'SDs either side', color: 'orange' } },
        fns: [{ expr: 'exp(-x^2/2)/sqrt(2*pi)', color: 'blue' }],
        areas: [{ fn: 0, from: '-z', to: 'z', color: 'orange' }],
        labels: SD_MARKS,
        readouts: [{ label: 'inside the band', expr: '100*I0(-z, z)', digits: 1, unit: '%' }],
        alt: 'A normal curve centred on 0, with a shaded band of adjustable width around the centre and a readout of the share of the area inside it.',
      },
      check: (s) => {
        if (s.z === 2) return true;
        return `A band of ${num(s.z)} ${s.z === 1 ? 'SD' : 'SDs'} either side holds ${INSIDE[s.z]}% of the area. ${s.z < 2 ? 'Make it wider.' : 'That is more than asked for: make it narrower.'}`;
      },
      solution: { z: 2 },
      hints: ['Move the slider and watch the "inside the band" readout.'],
      explain: `
        Two SDs either side. One SD either side holds only about two thirds of the area, and by three
        SDs almost nothing is left outside.
      `,
    },
    {
      id: 'teach-z',
      type: 'info',
      title: 'Three numbers and a z-score',
      text: r`
        The same three numbers hold for every normal curve, whatever its mean and SD: about **68%** of
        the area lies within 1 SD of the mean, about **95%** within 2 SDs, and about **99.7%** within 3 SDs.

        The number of SDs between a value and the mean is called its **z-score**:
        $$ z = \frac{\text{value} - \text{mean}}{\text{SD}} $$

        :::example
        A factory's batteries last 40 hours on average, with an SD of 5 hours, on a normal curve.

        - 50 hours: $z = \frac{50 - 40}{5} = 2$
        - 32.5 hours: $z = \frac{32.5 - 40}{5} = -1.5$, below the mean
        - 2 SDs are 10 hours, so about 95% last 30 to 50 hours.
        :::
      `,
      figure: {
        type: 'plot', x: [-4, 4], y: [-0.07, 0.45], xStep: 1, yStep: 0.1, height: 300, tickLabels: false,
        fns: [{ expr: 'exp(-x^2/2)/sqrt(2*pi)', color: 'blue' }],
        areas: [{ fn: 0, from: -2, to: 2, color: 'orange' }, { fn: 0, from: -1, to: 1, color: 'blue' }],
        labels: [...SD_MARKS, { x: 0, y: 0.15, anchor: 'middle', text: '68%' }, { x: 2.6, y: 0.12, anchor: 'middle', text: '95% out to here' }],
        alt: 'A normal curve. The area within 1 SD of the mean is shaded in one colour and holds 68%; the wider area within 2 SDs is shaded in another and holds 95%.',
      },
    },
    {
      id: 'z-score',
      type: 'numeric',
      review: true,
      keyboard: 'full',
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'The heights of the adults in a town', mean: 170, sd: 8, unit: 'cm', thing: 'a height of' },
          { what: 'The weights of the bags of rice from a filling machine', mean: 500, sd: 4, unit: 'g', thing: 'a bag of' },
          { what: 'The scores in a large exam', mean: 60, sd: 12, unit: 'points', thing: 'a score of' },
          { what: 'The weights of the apples from an orchard', mean: 150, sd: 20, unit: 'g', thing: 'an apple of' },
        ]);
        const z = rng.pick([-2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]);
        const x = scene.mean + z * scene.sd;
        return {
          text: `
            ${scene.what} follow a normal curve closely, with a mean of **${scene.mean} ${scene.unit}** and a
            standard deviation of **${scene.sd} ${scene.unit}**.

            **What is the z-score of ${scene.thing} ${x} ${scene.unit}?**
          `,
          answer: z,
          wrong: slips(z, [
            [-z, `Check the sign: ${x} is ${z > 0 ? 'above' : 'below'} the mean, so its z-score is ${z > 0 ? 'positive' : 'negative'}.`],
            [x - scene.mean, `That is the distance from the mean in ${scene.unit}. A z-score counts that distance in SDs: divide by ${scene.sd}.`],
            [x / scene.sd, `Measure from the mean first: subtract ${scene.mean}, and then divide by the SD.`],
          ]),
          hints: [
            `How far is ${x} from the mean of ${scene.mean}? Is it above or below?`,
            `The distance is ${Math.abs(x - scene.mean)} ${scene.unit}. How many SDs of ${scene.sd} ${scene.unit} is that?`,
          ],
          explain: r`$z = \dfrac{${x} - ${scene.mean}}{${scene.sd}} = \dfrac{${num(x - scene.mean)}}{${scene.sd}} = ${num(z)}$: ${num(Math.abs(z))} ${Math.abs(z) === 1 ? 'SD' : 'SDs'} ${z > 0 ? 'above' : 'below'} the mean.`,
        };
      },
    },
    {
      id: 'coin-range',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const n = rng.pick([100, 400, 900, 1600, 2500, 10000]);
        const root = Math.sqrt(n);
        const mean = n / 2;
        const sd = root / 2;
        return {
          text: r`
            A fair coin is flipped **${commas(n)} times**. The number of heads is the sum of ${commas(n)} independent
            flips, each worth 0 or 1, with expected value $\frac{1}{2}$ and variance $\frac{1}{4}$. So the number
            of heads follows a normal curve very closely.

            **Complete the description.** On a normal curve, about 95% of the area lies within 2 SDs of the mean.
          `,
          template: `Mean: [[${mean}]] heads. Standard deviation: [[${sd}]] heads. About 95% of the time, the number of heads is between [[${mean - 2 * sd}]] and [[${mean + 2 * sd}]].`,
          hints: [
            r`Expected values add: the mean is $${n} \times \frac{1}{2}$. Variances add too, because the flips are independent: $${n} \times \frac{1}{4} = ${n / 4}$.`,
            r`The SD is $\sqrt{${n / 4}} = ${sd}$. Go two SDs either side of the mean.`,
          ],
          explain: r`
            Mean: $${n} \times \frac{1}{2} = ${mean}$. Variance: $${n} \times \frac{1}{4} = ${n / 4}$, so the SD is
            $\sqrt{${n / 4}} = ${sd}$. Two SDs either side: from $${mean} - ${2 * sd} = ${mean - 2 * sd}$ to
            $${mean} + ${2 * sd} = ${mean + 2 * sd}$.
          `,
        };
      },
    },
    {
      id: 'copy-dice',
      type: 'interact',
      graded: false,
      title: 'Break the theorem',
      text: `
        The theorem asks for **independent** pieces. Here are 30 fair dice and their bell.

        **Flip the switch so that all 30 dice copy the first one**, and see what is left of the bell.
      `,
      widget: {
        type: 'dice-sum-lab', n: 30, linkToggle: true, curve: true, die: false, readouts: ['sd'],
        alt: 'A bar chart of the chance of each total of 30 dice, with a switch that makes every die copy the first one.',
      },
      check: (s) => s.linked || 'Press "All copy the first" under the chart.',
      solution: { linked: true },
      explain: `
        The bell is gone. Thirty copies of one die can only total 30, 60, 90, 120, 150 or 180, each as
        likely as the next. And the SD has jumped from 9.4 to 51: with nothing to cancel, it grows like
        the number of dice, not like its square root.

        Real effects are often partly dependent, like houses on the same flood plain or share prices
        in a panic. Extreme totals are then far more common than a bell curve predicts.
      `,
    },
    {
      id: 'bell-or-not',
      type: 'bucket',
      review: true,
      text: `
        The central limit theorem needs **many** pieces that are **independent**, with **no single piece dominating**.

        **Where should you expect a bell-shaped distribution?**
      `,
      buckets: ['Expect a bell', 'Do not count on one'],
      items: [
        { text: 'The total of 50 rolls of a die', bucket: 0, why: 'Fifty independent pieces of similar size: just what the theorem needs.' },
        { text: 'The number of heads in 400 flips of a coin', bucket: 0, why: 'A sum of 400 independent flips, each worth 0 or 1.' },
        { text: 'The average of 30 independent weighings of the same object', bucket: 0, why: 'An average is a total divided by a fixed number, so it has the same shape as the total.' },
        { text: 'The total prize money won by 1,000 lottery players', bucket: 1, why: 'One jackpot can outweigh all the other prizes put together. A single piece dominates.' },
        { text: 'The total flood damage to 1,000 houses on the same river', bucket: 1, why: 'The houses flood together or not at all: the pieces are far from independent.' },
        { text: 'The result of one roll of one die', bucket: 1, why: 'Nothing has been added up. One die is flat, not bell-shaped.' },
      ],
      explain: `
        Many pieces, independent of each other, none of them dominant: then a bell. Take away any one
        of the three conditions and the theorem makes no promise.
      `,
    },
  ],
  recap: [
    'Add up many independent random quantities, none dominating, and the total follows a **normal curve**: the central limit theorem.',
    'The SD of a total grows like $\\sqrt{n}$. The SD of an average shrinks like $1/\\sqrt{n}$.',
    'A **z-score** counts SDs from the mean. About 68%, 95% and 99.7% of a normal curve lie within 1, 2 and 3 SDs.',
    'Dependent pieces, or one piece that dominates, break the theorem. Check before you trust the bell.',
  ],
  next: 'Next: stop counting successes and start counting the wait. How long until the first six, the full set, the shared birthday?',
};
