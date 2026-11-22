// Calculus in Pictures · Lesson 7 · The Curve That Is Its Own Slope
import { r } from '../../../kit.js';
import { table } from '../helpers.js';

/** £1 at 100% a year, paid in n equal parts. */
const compound = (n) => Math.pow(1 + 1 / n, n);
const COMPOUND_ROWS = [
  ['once a year', 1], ['twice a year', 2], ['every three months', 4], ['every month', 12],
  ['every week', 52], ['every day', 365], ['every hour', 8760],
].map(([label, n]) => [label, String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','), `£${compound(n).toFixed(4)}`]);

const E = Math.E;

export default {
  id: 'own-slope',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The weed on the pond',
      text: `
        A water weed doubles the area it covers **every day**. It starts as a small patch, and on
        day 30 it covers the whole pond.

        **On which day does it spread over the most new water?**
      `,
      shuffle: false,
      options: [
        { text: 'On the first day, when it has the most room' },
        { text: 'Around day 15, halfway through' },
        { text: 'On the last day', correct: true },
      ],
      explain: `
        On the last day. On day 29 the pond was only half covered, so on day 30 the weed took
        the whole other half: as much new water as in all the days before put together.

        The more there is, the faster it grows. This lesson is about curves that behave like that.
      `,
    },
    {
      id: 'teach-doubling-curve',
      type: 'info',
      title: 'A curve that doubles',
      text: r`
        Doubling at every step is the rule $y = 2^x$. The variable sits in the **exponent**, so
        curves like this are called **exponential**. Each step of 1 to the right doubles the height,
        and each step to the left halves it.

        | $x$ | $-1$ | $0$ | $1$ | $2$ | $3$ | $4$ |
        |:--|--:|--:|--:|--:|--:|--:|
        | $2^x$ | $\tfrac12$ | $1$ | $2$ | $4$ | $8$ | $16$ |

        Because every step *multiplies*, what the curve gains depends on what is already
        there: from $x = 0$ to $1$ it gains 1, from $x = 3$ to $4$ it gains 8. That is
        growth **in proportion to its size**.
      `,
      figure: {
        type: 'plot', x: [-2, 4.6], y: [0, 18], xStep: 1, yStep: 2,
        fns: [{ expr: '2^x', color: 'blue' }],
        points: [0, 1, 2, 3, 4].map((x) => ({ x, on: 0, color: 'orange' })),
        labels: [0, 1, 2, 3, 4].map((x) => ({ x, y: 2 ** x, text: String(2 ** x), color: 'orange', dx: 12, dy: 20, anchor: 'start' })),
        alt: 'The curve y equals 2 to the power x. Marked points show its height at x = 0, 1, 2, 3 and 4: the heights are 1, 2, 4, 8 and 16, doubling at every step.',
      },
    },
    {
      id: 'ratio',
      type: 'choice',
      title: 'Slope against height',
      text: r`
        Here is $y = 2^x$: it doubles every time $x$ goes up by 1.

        **Drag the point along the curve** and compare its two numbers, the height and the slope.
        What do you notice about **slope ÷ height**?
      `,
      figure: {
        type: 'plot', x: [-2, 4], y: [0, 16], xStep: 1, yStep: 2,
        fns: [{ expr: '2^x', color: 'blue' }],
        points: [{ id: 'P', x: 0, on: 0, drag: 'x', snap: 0.5, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [
          { label: 'height', expr: 'f0(Px)', digits: 2, color: 'blue' },
          { label: 'slope', expr: 'd0(Px)', digits: 2, color: 'orange' },
          { label: 'slope ÷ height', expr: 'd0(Px) / f0(Px)', digits: 2 },
        ],
        alt: 'The curve y equals 2 to the power x, which gets steeper and steeper. A point with its tangent can be dragged along it. Readouts show the height, the slope and the slope divided by the height.',
      },
      options: [
        { text: 'It stays the same everywhere: about 0.69', correct: true },
        { text: 'It grows as the curve gets steeper', why: 'The slope grows, but so does the height, and exactly in step. Drag the point again and watch the third number.' },
        { text: 'It is always exactly 1', why: 'Close, but look at the third number: it is about 0.69, wherever the point is.' },
      ],
      explain: r`
        Wherever you look, the slope of $2^x$ is about **0.69 times its height**. Twice as high
        means twice as steep.

        That is what "growing in proportion to its size" looks like on a graph.
      `,
    },
    {
      id: 'find-e',
      type: 'interact',
      title: 'Hunting for a special base',
      text: r`
        Every curve $y = b^x$ has this property, each with its own number: for $2^x$ the slope
        is about 0.69 of the height, for $3^x$ it is about 1.10 of the height.

        Somewhere between 2 and 3 there must be a base for which the slope **equals** the height.
        **Slide $b$ until slope ÷ height is as close to 1 as you can get it.**
      `,
      widget: {
        type: 'plot', x: [-2, 3], y: [0, 16], xStep: 1, yStep: 2,
        params: { b: { min: 2, max: 3.2, step: 0.05, value: 2, label: 'base $b$', color: 'blue' } },
        fns: [{ expr: 'b^x', color: 'blue' }],
        points: [{ x: 1, on: 0, color: 'orange' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        readouts: [
          { label: 'height at x = 1', expr: 'f0(1)', digits: 2, color: 'blue' },
          { label: 'slope at x = 1', expr: 'd0(1)', digits: 2, color: 'orange' },
          { label: 'slope ÷ height', expr: 'd0(1) / f0(1)', digits: 3 },
        ],
        alt: 'The curve y equals b to the power x, with a slider for the base b. Readouts show the height and the slope at x = 1, and the slope divided by the height.',
      },
      check: (s) => {
        if (s.b >= 2.695 && s.b <= 2.755) return true;
        return s.b < 2.7
          ? 'The slope is still smaller than the height. Try a larger base.'
          : 'Now the slope is larger than the height. Try a smaller base.';
      },
      solution: { b: 2.7 },
      explain: r`
        The magic base lies between 2.70 and 2.75. With a finer slider you would close in on
        $$ e = 2.71828\ldots $$
      `,
    },
    {
      id: 'e',
      type: 'info',
      title: 'The number e',
      text: r`
        That base has a name: **$e$**, about 2.718. Like $\pi$, its digits never end and never
        repeat, and like $\pi$ it turns up all over mathematics.

        What makes it special is the property you just found:

        :::key
        The curve $y = e^x$ is its own derivative. At every point, its slope equals its height.
        :::

        Differentiate $x^3$ and you get something new, $3x^2$. Differentiate $e^x$ and you get
        $e^x$ back, unchanged. No other curve does that (apart from multiples of it, like $5e^x$).
      `,
      figure: {
        type: 'plot', x: [-2, 3], y: [0, 16], xStep: 1, yStep: 2,
        fns: [{ expr: 'exp(x)', color: 'blue' }],
        points: [{ id: 'P', x: 1, on: 0, drag: 'x', snap: 0.25, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [
          { label: 'height', expr: 'f0(Px)', digits: 2, color: 'blue' },
          { label: 'slope', expr: 'd0(Px)', digits: 2, color: 'orange' },
        ],
        alt: 'The curve y equals e to the power x with a draggable point. The height and the slope readouts always show the same number.',
      },
    },
    {
      id: 'slope-of-e',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const x = rng.pick([0, 1, 2, 3]);
        const height = Math.exp(x);
        const shown = x === 0 ? '1' : height.toFixed(2);
        return {
          text: r`
            At $x = ${x}$ the curve $y = e^x$ has height ${x === 0 ? 'exactly' : 'about'} **${shown}**.

            **What is its slope there?**
          `,
          answer: Number(shown),
          tolerance: 0.01,
          wrong: [
            [x, r`That is the value of $x$. The slope of $e^x$ equals its *height*.`],
            [Number((x * Math.exp(x - 1)).toFixed(2)), r`That is the power rule, but the power rule is for $x^n$, where the variable is at the bottom. Here $x$ is in the exponent.`],
          ].filter(([v], i, all) => Math.abs(v - Number(shown)) > 0.02 && all.findIndex(([u]) => u === v) === i),
          hints: [r`$e^x$ is its own derivative.`],
          explain: r`The slope of $e^x$ always equals its height, so here it is ${shown} as well.`,
        };
      },
    },
    {
      id: 'interest',
      type: 'numeric',
      title: 'Where e comes from',
      text: r`
        The number $e$ was first pinned down in a question about money.

        A very generous bank pays **100% interest a year**. Leave £1 for a year and you have £2.
        But suppose the interest is paid in two halves: 50% after six months, and another 50%
        on *whatever you then have*. That gives $1.5 \times 1.5 = £2.25$.

        **What do you have after a year if it is paid in four quarters of 25%?**
      `,
      answer: 2.44,
      tolerance: 0.01,
      prefix: '£',
      wrong: [
        [2, 'That is the total when the interest is paid once. Paid in parts, each payment earns interest on the ones before.'],
        [2.25, 'That is for two payments of 50%. With four payments of 25% you multiply by 1.25 four times.'],
        [5, r`That multiplies 1.25 by 4. Each quarter *multiplies* your money by 1.25: $1.25^4$.`],
      ],
      hints: [r`Each quarter multiplies your money by 1.25. So work out $1.25^4$, or $1.5625^2$.`],
      explain: r`$1.25^4 = 1.5625^2 \approx £2.44$. Splitting the same interest into more payments gives more, because every payment earns interest on the earlier ones.`,
    },
    {
      id: 'limit',
      type: 'choice',
      text: `
        Split the year into $n$ parts and you end the year with $(1 + \\tfrac{1}{n})^n$ pounds:

        ${table(['interest paid', '$n$', 'after one year'], COMPOUND_ROWS)}

        **What happens if the bank pays more and more often, every minute, every second?**
      `.replace(/^ {8}/gm, ''),
      options: [
        { text: 'The total creeps up towards a limit, about £2.718', correct: true },
        { text: 'The total grows without limit: pay often enough and you are a millionaire', why: 'Look at how little the last rows of the table add. Each step gives less than the one before.' },
        { text: 'The total reaches exactly £3', why: 'It never gets that far. The table is already crawling at 2.718.' },
      ],
      explain: r`
        The total closes in on $e = 2.71828\ldots$ and never passes it. Interest that is added
        continuously, in proportion to what is there at each instant, is growth along $e^x$.

        This is how Jacob Bernoulli came across the number in 1683.
      `,
    },
    {
      id: 'rate',
      type: 'fill',
      title: 'Faster, slower, backwards',
      text: r`
        Put a number $k$ in the exponent and you get $y = e^{kx}$. **Slide $k$** and watch
        slope ÷ height.
      `,
      figure: {
        type: 'plot', x: [-3, 3], y: [0, 10], xStep: 1, yStep: 2,
        params: { k: { min: -1.5, max: 1.5, step: 0.25, value: 1, label: 'rate $k$', color: 'violet' } },
        fns: [{ expr: 'exp(k*x)', color: 'violet' }],
        points: [{ x: 1, on: 0, color: 'orange' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        readouts: [
          { label: 'height at x = 1', expr: 'f0(1)', digits: 2, color: 'violet' },
          { label: 'slope at x = 1', expr: 'd0(1)', digits: 2, color: 'orange' },
          { label: 'slope ÷ height', expr: 'd0(1) / f0(1)', digits: 2 },
        ],
        alt: 'The curve y equals e to the power k x, with a slider for the rate k. Positive rates give a rising curve, negative rates a falling one. Readouts show the height, the slope and their ratio at x = 1.',
      },
      template: r`
        For $y = e^{0.5x}$ the slope is [[0.5]] times the height.

        For $y = e^{-x}$ the slope is [[-1]] times the height, so the curve is [[rising|*falling]].

        In general, the slope of $e^{kx}$ is [[*k|x|e]] times its height.
      `,
      explain: r`
        Whatever $k$ you set, the third readout shows $k$ itself: the slope of $e^{kx}$ is
        $k$ times its height. With $k = -1$ that slope is negative, so the curve falls.
      `,
    },
    {
      id: 'teach-growth-decay',
      type: 'info',
      title: 'Growth and decay',
      text: r`
        :::key
        The derivative of $e^{kx}$ is $k\,e^{kx}$: the slope is always $k$ times the height.
        :::

        A positive $k$ is **growth**: the more there is, the faster it grows. A negative $k$
        is **decay**: the less there is left, the more slowly it shrinks.

        Either way, each step changes the amount by a fixed **fraction of its size**: a
        town that grows by 2% a year, a ball that loses a third of its bounce every time.

        Compare a tank filling at 5 litres a minute. It gains the **same amount** every
        minute, whatever it already holds, and its graph is a straight line.
      `,
      figure: {
        type: 'plot', x: [-3, 3], y: [0, 5], xStep: 1, yStep: 1,
        fns: [{ expr: 'exp(0.5x)', color: 'violet' }, { expr: 'exp(-0.5x)', color: 'teal' }],
        labels: [
          { x: 2.2, y: 3, text: 'k = 0.5: growth', color: 'violet', dx: -12, dy: -6, anchor: 'end' },
          { x: -2.2, y: 3, text: 'k = −0.5: decay', color: 'teal', dx: 12, dy: -6, anchor: 'start' },
        ],
        alt: 'Two curves. One, labelled k = 0.5, rises from left to right ever more steeply: growth. The other, labelled k = −0.5, is its mirror image and falls ever more gently towards zero: decay.',
      },
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'Which of these change by the **same amount** each time, and which change **in proportion** to their size?',
      buckets: ['Same amount each time', 'In proportion to its size'],
      items: [
        { text: 'A candle that burns down 2 cm every hour', bucket: 0 },
        { text: 'A taxi fare that adds £1.50 for every kilometre', bucket: 0 },
        { text: 'A bath filling at 12 litres a minute', bucket: 0 },
        { text: 'Savings that earn 4% interest a year', bucket: 1, why: 'Four per cent of a bigger balance is more money: the growth depends on the size.' },
        { text: 'Bacteria that double every 20 minutes', bucket: 1 },
        { text: 'A rumour that every hearer passes on to two more people', bucket: 1 },
        { text: 'A hot drink that loses a tenth of its extra warmth each minute', bucket: 1, why: 'A tenth of what is left: as the drink cools, it cools more slowly. That is decay in proportion to size.' },
      ],
      explain: 'The first group are straight lines: a constant slope. The second group are exponential curves: a slope that is a fixed fraction of the height.',
    },
    {
      id: 'teach-rule-of-70',
      type: 'info',
      title: 'How long until it doubles?',
      text: r`
        Anything that grows by a fixed percentage doubles again and again, always in the same
        time: its **doubling time**. There is a handy rule for it.

        :::key
        Doubling time $\approx$ 70 ÷ the percentage growth
        :::

        :::example
        A forest grows by 3.5% a year. $70 \div 3.5 = 20$, so it doubles in about 20 years,
        and doubles again in the next 20.
        :::

        The 70 comes from $e$. Growth at a continuous rate $k$ doubles when $e^{kt} = 2$,
        which is when $kt \approx 0.69$: the same 0.69 you measured on $2^x$. As a percentage
        that is 69, and 70 is easier to divide.
      `,
      figure: {
        type: 'plot', x: [0, 70], y: [0, 9], xStep: 20, yStep: 2, xLabel: 'years', yLabel: 'size of the forest',
        fns: [{ expr: '2^(x/20)', from: 0, to: 64, color: 'green' }],
        points: [0, 20, 40, 60].map((x) => ({ x, on: 0, color: 'orange' })),
        labels: [0, 20, 40, 60].map((x) => ({ x, y: 2 ** (x / 20), text: `×${2 ** (x / 20)}`, color: 'orange', dx: 10, dy: 18, anchor: 'start' })),
        vlines: [20, 40, 60].map((x) => ({ x, dashed: true })),
        alt: 'A growth curve over 60 years. Marked points show the forest at its starting size, then twice that size after 20 years, four times after 40 years and eight times after 60 years.',
      },
    },
    {
      id: 'doubling',
      type: 'numeric',
      review: true,
      title: 'The rule of 70',
      gen: (rng) => {
        const rate = rng.pick([2, 5, 7, 10, 14]);
        const what = rng.pick([
          { thing: 'A savings account', verb: 'grows', noun: 'the money in it' },
          { thing: 'The population of a city', verb: 'grows', noun: 'the population' },
          { thing: 'The number of users of an app', verb: 'grows', noun: 'the number of users' },
          { thing: 'The price of a basket of shopping', verb: 'rises', noun: 'the price' },
        ]);
        const answer = 70 / rate;
        return {
          text: r`
            Anything that grows by a fixed percentage doubles again and again, always in the same
            time. A handy rule: **divide 70 by the percentage** to get the doubling time.

            ${what.thing} ${what.verb} by **${rate}% a year**. About how many years does it take for
            ${what.noun} to double?
          `,
          answer,
          tolerance: 0.6,
          unit: 'years',
          wrong: [
            [100 / rate, `That would be right if the growth were added once and never earned growth of its own. Because it compounds, doubling comes sooner: use 70, not 100.`],
            [rate, `That is the percentage itself. Divide 70 by it.`],
          ].filter(([v], i, all) => Math.abs(v - answer) > 0.7 && all.findIndex(([u]) => u === v) === i),
          hints: [`70 ÷ ${rate}`],
          explain: r`$70 \div ${rate} = ${answer}$ years. The 70 comes from $e$: growth at a continuous rate $k$ doubles when $e^{kt} = 2$, which is when $kt \approx 0.69$.`,
        };
      },
    },
    {
      id: 'area',
      type: 'numeric',
      stretch: true,
      title: 'Backwards, too',
      text: r`
        If differentiating $e^x$ gives $e^x$, then running it backwards does too: $e^x$ is its
        own antiderivative. And Lesson 5 showed what an antiderivative $F$ is good for: the
        area under a curve from $a$ to $b$ is $F(b) - F(a)$.

        **Use that to find the area under $y = e^x$ from $x = 0$ to $x = 1$.**
        Take $e \approx 2.718$, and remember that $e^0 = 1$.
      `,
      figure: {
        type: 'plot', x: [-1, 2], y: [0, 5], xStep: 1, yStep: 1,
        fns: [{ expr: 'exp(x)', color: 'blue' }],
        areas: [{ fn: 0, from: 0, to: 1, color: 'blue' }],
        alt: 'The curve y equals e to the power x, with the area under it shaded between x = 0 and x = 1.',
      },
      answer: Number((E - 1).toFixed(3)),
      tolerance: 0.01,
      wrong: [
        [Number(E.toFixed(3)), r`That is $F(1)$ alone. The area from 0 to 1 is $F(1) - F(0)$, and $F(0) = e^0 = 1$.`],
        [1, r`The curve is higher than 1 the whole way across, so the area must be more than 1.`],
      ],
      hints: [r`The area is $F(1) - F(0)$ with $F(x) = e^x$.`, r`$e^1 = e$ and $e^0 = 1$.`],
      explain: r`The area is $e^1 - e^0 = e - 1 \approx 1.718$. The fundamental theorem from earlier in the course, with the easiest antiderivative there is.`,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: r`The slope of $y = e^x$ at any point equals its height there`, correct: true },
        { text: 'Something that grows by 5% a year doubles in about 14 years', correct: true },
        { text: r`The slope of $y = e^{-x}$ is negative everywhere`, correct: true },
        { text: r`The derivative of $e^x$ is $x\,e^{x-1}$`, why: r`That is the power rule, which is for $x^n$. In $e^x$ the variable is the exponent, and the derivative is $e^x$ itself.` },
        { text: 'Interest added more and more often makes the total grow without limit', why: r`With 100% a year the total closes in on $e$, about 2.718 times what you started with, and never passes it.` },
      ],
      explain: r`One curve, $e^x$, describes everything that changes in proportion to its own size: savings, populations, cooling drinks, radioactive atoms.`,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: *"Three per cent growth a year sounds tiny. It can hardly matter."*

        **What would you tell them?**
      `,
      model: `
        Three per cent a year means doubling roughly every 23 years (70 ÷ 3). Over a lifetime of
        70 years that is three doublings: eight times as much.

        Growth in proportion looks slow for a long time and then does not, because every increase
        is added to the amount that the next increase is a percentage of.
      `,
    },
  ],
  recap: [
    'Things that grow in proportion to their size follow curves like $b^x$: the slope is a fixed fraction of the height.',
    'For the base $e \\approx 2.718$ that fraction is exactly 1: $e^x$ is its own derivative.',
    'The derivative of $e^{kx}$ is $k\\,e^{kx}$. Positive $k$ is growth, negative $k$ is decay.',
    'Rule of 70: growth of $r$% a year doubles in about $70 \\div r$ years.',
  ],
  next: 'That is the end of the course: slopes, areas, the bridge between them, and two of the places they are used.',
};
