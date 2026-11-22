// Calculus in Pictures · Lesson 5 · The Big Connection
import { r, num } from '../../../kit.js';
import { polyTex, polyExpr, derive } from '../helpers.js';

// A tap being turned up and down: flow rate in litres per minute over six minutes.
const TAP = {
  type: 'area-accumulator', fn: '10 + 5*sin(x)', x: [0, 6], y: [0, 16], xStep: 1, yStep: 4, ay: [0, 70], ayStep: 20,
  labels: { f: 'flow rate (litres per minute)', A: 'water so far, A (litres)' },
  words: { area: 'water so far', height: 'flow rate now', slope: 'slope of $A$', heightTag: 'flow rate', slopeTag: 'slope' },
};

export default {
  id: 'fundamental-theorem',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'An obvious question',
      text: `
        A tap is filling a bath. At this moment, water is flowing in at
        **12 litres per minute**.

        **How fast is the amount of water in the bath growing, right now?**
      `,
      columns: 1,
      options: [
        { text: '12 litres per minute', correct: true },
        { text: 'It depends on how much water is already in the bath' },
        { text: 'It depends on how long the tap has been running' },
        { text: 'There is no way to tell without a formula' },
      ],
      explain: `
        12 litres per minute. It sounds too obvious to be worth saying.

        But look at what you used. The water in the bath is a **running
        total**, and the rate at which a running total grows is simply
        whatever is being added to it right now. That one idea ties this
        whole course together. Time to see it in a picture.
      `,
    },
    {
      id: 'accumulate',
      type: 'interact',
      graded: false,
      title: 'Watch a total pile up',
      text: `
        The tap is turned up, then down, then up again. The top graph shows
        the flow rate. The [shaded area]{.green} is the water that has run in
        so far, and the lower graph keeps a record of it.

        **Drag the edge slowly all the way to the right.** Keep an eye on the
        two [orange]{.orange} numbers.
      `,
      widget: { ...TAP, start: 0.5, alt: 'Top: a wavy flow-rate curve with the area under it shaded up to a movable edge. Bottom: a graph of the area so far.' },
      check: (s) => s.done || 'Keep going: drag the edge all the way to the right-hand side.',
      solution: { x: 6, swept: true },
      explain: `
        Where the flow is strong, the total climbs steeply. Where the flow
        is weak, the total still climbs, but gently.

        And the two orange numbers never disagree. At every moment, **the
        slope of the total equals the height of the flow-rate curve**.
      `,
    },
    {
      id: 'why',
      type: 'info',
      title: 'Why it has to be true',
      text: r`
        Call the curve $f$ and the area so far $A(x)$. Now push the edge a
        tiny step to the right, by $h$.

        The area gains one [thin strip]{.orange}. The strip is about $f(x)$
        tall and $h$ wide, so $A$ grows by about $f(x) \times h$. Divide
        the growth by the step $h$ and you have the rate of growth: about
        $f(x)$. The thinner the strip, the less "about" there is in it.

        :::key The fundamental theorem of calculus
        If $A(x)$ is the area under a curve $f$ from a fixed start up to $x$, then

        $$ A'(x) = f(x) $$

        The rate at which area piles up is the height of the curve.
        :::

        It works for any curve you can draw without lifting your pen.
      `,
      figure: { ...TAP, start: 2.5, slice: 0.5, static: true, alt: 'The flow-rate curve with the area shaded up to x = 2.5, and the next thin strip outlined: about as tall as the curve at x and one small step wide.' },
    },
    {
      id: 'fastest-growth',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const whyRise = 'A flow rate that is *climbing* fast is not the same as a flow rate that is *high*. The water rises fastest when the most water per minute is coming in.';
        const whyFull = 'How much water is already in the bath does not matter. What matters is how much is flowing in at that moment.';
        const whyLow = 'That is when the amount of water is growing most *slowly*.';
        const item = rng.pick([
          {
            fn: '10 + 5*sin(x)', shape: 'rises to a peak after about 1.6 minutes, falls to a low point at about 4.7 minutes, then rises again',
            options: [
              { text: 'At about 1.6 min, when the flow rate is at its highest', correct: true },
              { text: 'At the very start, when the flow rate is climbing fastest', why: whyRise },
              { text: 'At 6 min, when the bath holds the most water', why: whyFull },
              { text: 'At about 4.7 min, when the flow rate is at its lowest', why: whyLow },
            ],
          },
          {
            fn: '10 - 5*sin(x)', shape: 'falls to a low point after about 1.6 minutes, rises to a peak at about 4.7 minutes, then falls again',
            options: [
              { text: 'At about 4.7 min, when the flow rate is at its highest', correct: true },
              { text: 'At about 3.1 min, when the flow rate is climbing fastest', why: whyRise },
              { text: 'At 6 min, when the bath holds the most water', why: whyFull },
              { text: 'At about 1.6 min, when the flow rate is at its lowest', why: whyLow },
            ],
          },
          {
            fn: '10 + 5*cos(x - 3)', shape: 'starts low, rises to a peak at 3 minutes, then falls back again',
            options: [
              { text: 'At 3 min, when the flow rate is at its highest', correct: true },
              { text: 'At about 1.4 min, when the flow rate is climbing fastest', why: whyRise },
              { text: 'At 6 min, when the bath holds the most water', why: whyFull },
              { text: 'At the very start, when the flow rate is at its lowest', why: whyLow },
            ],
          },
        ]);
        return {
          options: item.options,
          figure: {
            type: 'plot', x: [0, 6.9], y: [0, 18], xStep: 1, yStep: 5, xLabel: 'time (min)', yLabel: 'flow rate (litres/min)',
            fns: [{ expr: item.fn, from: 0, to: 6, color: 'blue' }],
            alt: `A graph of flow rate against time over six minutes. The flow rate ${item.shape}.`,
          },
        };
      },
      text: 'The graph shows how fast water flows into a bath over six minutes. **When is the amount of water in the bath growing fastest?**',
      columns: 1,
      hints: ['The flow rate is the number of litres added each minute. When is that number biggest?'],
      explain: `
        The amount of water grows at the flow rate: that is all a flow rate
        is. So it grows fastest when the flow rate is **highest** — not when
        the flow rate is changing fastest, and not when the bath is fullest.
      `,
    },
    {
      id: 'triangle-check',
      type: 'expr',
      title: 'Check it by hand',
      text: r`
        Test the theorem on a case you can work out yourself. Take
        $f(x) = x$, a straight line through the origin. The area under it
        from 0 to $x$ is a triangle, and a triangle's area is
        ½ × base × height.

        **Write a formula for that area, $A(x)$.** You can drag the edge to
        check a few values.
      `,
      figure: {
        type: 'area-accumulator', fn: 'x', x: [0, 4], y: [0, 4], xStep: 1, yStep: 1, ay: [0, 8], ayStep: 2, snap: 0.5, start: 2, digits: 3,
        labels: { f: 'f(x) = x', A: 'area so far, A(x)' },
        alt: 'Top: the line y = x with the triangle under it shaded up to a movable edge. Bottom: a graph of the area so far.',
      },
      answer: 'x^2/2',
      vars: ['x'],
      prefix: r`$A(x) =$`,
      wrong: [
        ['x^2', r`That is base × height: the area of a whole square. The triangle is half of it.`],
        ['x/2', r`The triangle has base $x$ *and* height $x$. Its area is ½ × base × height.`],
        ['x', r`That is the height of the line, $f(x)$. The area is ½ × base × height.`],
        ['2x', r`Try $x = 2$: the triangle has base 2 and height 2, so its area is 2, not 4.`],
      ],
      hints: [
        r`The shaded region is a triangle with base $x$ and height $x$.`,
        'Area of a triangle = ½ × base × height.',
      ],
      explain: r`
        Base $x$, height $x$: $A(x) = \tfrac12 x^2$.

        Now differentiate it with the power rule: $\tfrac12 \times 2x = x$.
        You are back at $f(x) = x$, exactly as the theorem promised.
      `,
    },
    {
      id: 'undo',
      type: 'multi',
      title: 'Running it backwards',
      text: r`
        So the area function is always something whose derivative is the
        curve you started with. To find areas, you need to run
        differentiation **backwards**.

        A function whose derivative is $f$ is called an **antiderivative**
        of $f$. Try to find some: differentiate each function below.
        **Which of them have $2x$ as their derivative?**
      `,
      options: [
        { text: r`$x^2$`, correct: true },
        { text: r`$x^2 + 5$`, correct: true },
        { text: r`$x^2 - 3$`, correct: true },
        { text: r`$2$`, why: r`$2$ is the derivative *of* $2x$. You want to go the other way: functions whose derivative *is* $2x$.` },
        { text: r`$2x^2$`, why: r`The derivative of $2x^2$ is $4x$: twice too big.` },
      ],
      hints: [
        r`Differentiate each option and see which ones give $2x$.`,
        r`Remember what happens to a constant that is added on.`,
      ],
      explain: r`
        All three versions of $x^2$ work. An added constant slides a graph
        up or down without changing any slope, so it vanishes when you
        differentiate. So $2x$ has not one antiderivative but a whole
        family of them.
      `,
    },
    {
      id: 'reverse-rule',
      type: 'info',
      title: 'The power rule in reverse',
      text: r`
        To differentiate a power you multiply by the power, then lower it
        by one. To undo that, do the opposite steps in the opposite order:
        **raise the power by one, then divide by the new power.**

        | $f(x)$ | $1$ | $x$ | $x^2$ | $x^3$ |
        |:--|:-:|:-:|:-:|:-:|
        | an antiderivative $F(x)$ | $x$ | $\tfrac12 x^2$ | $\tfrac13 x^3$ | $\tfrac14 x^4$ |

        Numbers in front stay where they are, and sums are handled one term
        at a time, as before. Any constant may be added on the end: that is
        the family you have just met.

        :::example
        An antiderivative of $10x^4 + 6x - 7$:

        - $10x^4$ becomes $10 \times \tfrac15 x^5 = 2x^5$
        - $6x$ becomes $6 \times \tfrac12 x^2 = 3x^2$
        - $-7$ becomes $-7x$

        So $F(x) = 2x^5 + 3x^2 - 7x$. To check, differentiate it: you get
        the starting expression back.
        :::
      `,
    },
    {
      id: 'one-line',
      type: 'numeric',
      title: 'One line instead of sixty rectangles',
      text: r`
        Back to the car from the last lesson, with speed $t^2$ m/s. Let
        $A(t)$ be the area under its speed graph from 0 to $t$.

        - The theorem says $A'(t) = t^2$, so $A$ is an antiderivative of $t^2$.
        - No time, no area: $A(0) = 0$.

        The antiderivative of $t^2$ that is zero at $t = 0$ is $\tfrac13 t^3$.
        **So what is the area from 0 to 3?**
      `,
      answer: 9,
      unit: 'm',
      wrong: [
        [27, r`$3^3 = 27$ is right, but the antiderivative is $\tfrac13 t^3$: divide by 3.`],
        [6, r`$2t$ is the *derivative* of $t^2$. For an area you need the antiderivative, $\tfrac13 t^3$.`],
        [3, r`Put $t = 3$ into $\tfrac13 t^3$: that is $\tfrac13 \times 27$.`],
      ],
      hints: [r`Put $t = 3$ into $\tfrac13 t^3$.`],
      explain: r`
        $A(3) = \tfrac13 \times 3^3 = 9$ m. Sixty rectangles only trapped
        this number between 8.776 and 9.226. The antiderivative lands on it exactly.
      `,
    },
    {
      id: 'teach-area-formula',
      type: 'info',
      title: 'Areas from antiderivatives',
      text: r`
        That area started at 0. Between any two edges $a$ and $b$, take the
        area up to $b$ and remove the part before $a$.

        :::key
        If $F$ is any antiderivative of $f$, the area under $f$ from $a$ to $b$ is

        $$ \int_a^b f(x)\,dx = F(b) - F(a) $$
        :::

        :::example
        The area under $y = 9x^2$ between $x = 1$ and $x = 2$:

        1. Find an antiderivative: $F(x) = 3x^3$
        2. Subtract: $F(2) - F(1) = 24 - 3 = 21$

        Any antiderivative will do: an added constant would cancel in the subtraction.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 3.2], y: [0, 44], xStep: 1, yStep: 10,
        fns: [{ expr: '9x^2', color: 'blue' }],
        areas: [{ fn: 0, from: 1, to: 2, color: 'green' }],
        labels: [{ x: 1.5, y: 8, text: 'area 21', color: 'green', dx: 0, dy: 5, anchor: 'middle' }],
        alt: 'The curve y equals 9 x squared, with the region under it shaded between x = 1 and x = 2. The shaded area is 21.',
      },
    },
    {
      id: 'exact-area',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.int(1, 4);
        const j = rng.pick([1, 2]);
        const c = rng.int(1, 5);
        const item = rng.pick([
          { fTex: `${2 * k}x`, FTex: `${k === 1 ? '' : k}x^2`, fn: `${2 * k}*x`, f: (x) => 2 * k * x, F: (x) => k * x * x, bounds: [[0, 2], [0, 3], [1, 3], [1, 4], [2, 4]] },
          { fTex: `${3 * j}x^2`, FTex: `${j === 1 ? '' : j}x^3`, fn: `${3 * j}*x^2`, f: (x) => 3 * j * x * x, F: (x) => j * x * x * x, bounds: [[0, 2], [1, 2], [1, 3], [0, 3]] },
          { fTex: '4x^3', FTex: 'x^4', fn: '4*x^3', f: (x) => 4 * x * x * x, F: (x) => x * x * x * x, bounds: [[0, 2], [1, 2], [0, 3]] },
          { fTex: `2x + ${c}`, FTex: `x^2 + ${c === 1 ? '' : c}x`, fn: `2*x + ${c}`, f: (x) => 2 * x + c, F: (x) => x * x + c * x, bounds: [[0, 3], [1, 3], [0, 4], [2, 4], [1, 5]], sum: true },
          { fTex: 'x^2', FTex: r`\tfrac13 x^3`, fn: 'x^2', f: (x) => x * x, F: (x) => (x * x * x) / 3, bounds: [[0, 3], [3, 6], [0, 6]] },
        ]);
        const [a, b] = rng.pick(item.bounds);
        const Fa = item.F(a);
        const Fb = item.F(b);
        const answer = Fb - Fa;
        const top = item.f(b);
        return {
          text: r`
            Use an antiderivative to find the exact area under $y = ${item.fTex}$ between $x = ${a}$ and $x = ${b}$.

            $$ \int_{${a}}^{${b}} ${item.sum ? `(${item.fTex})` : item.fTex}\,dx $$
          `,
          figure: {
            type: 'plot', x: [0, b + 1], y: [0, top * 1.15], xStep: 1,
            fns: [{ expr: item.fn, color: 'blue' }],
            areas: [{ fn: 0, from: a, to: b, color: 'green' }],
            alt: `The curve y = ${item.fTex.replace(/\^/g, ' to the power ')} with the region under it shaded between x = ${a} and x = ${b}.`,
          },
          answer,
          wrong: [
            [Fb, r`That is $F(${b})$: the area all the way from 0. Subtract $F(${a})$ to remove the part before $x = ${a}$.`],
            [top - item.f(a), r`Those are *heights* of the curve. Use the antiderivative $F(x) = ${item.FTex}$, not $f$ itself.`],
            [top * (b - a), `That is a rectangle as tall as the curve's right-hand end. The region under the curve is smaller.`],
            [Fb + Fa, r`Subtract, do not add: the area from ${a} to ${b} is $F(${b}) - F(${a})$.`],
          ],
          hints: [
            r`First find an antiderivative: a function $F$ whose derivative is $${item.fTex}$.`,
            r`$F(x) = ${item.FTex}$. The area is $F(${b}) - F(${a})$.`,
          ],
          explain: r`
            An antiderivative of $${item.fTex}$ is $F(x) = ${item.FTex}$.

            $$ F(${b}) - F(${a}) = ${num(Fb)} - ${num(Fa)} = ${num(answer)} $$
          `,
        };
      },
    },
    {
      id: 'antiderivative',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['cubic', 'quartic', 'quadratic']);
        let F;                                 // chosen first, so every coefficient comes out whole
        if (kind === 'cubic') F = [[rng.int(1, 4), 3], [rng.nonzero(-5, 5), 2]];
        else if (kind === 'quartic') F = [[rng.int(1, 3), 4], [rng.nonzero(-9, 9), 1]];
        else F = [[rng.int(2, 6), 2], [rng.nonzero(-9, 9), 1]];
        const f = derive(F);
        return {
          text: r`
            Find the antiderivative $F$ of

            $$ f(x) = ${polyTex(f)} $$

            that has $F(0) = 0$.
          `,
          prefix: r`$F(x) =$`,
          answer: polyExpr(F),
          vars: ['x'],
          wrong: [
            [polyExpr(derive(f)), 'You differentiated. Go the other way: which function has this as its *derivative*?'],
            [polyExpr(f.map(([c, p]) => [c, p + 1])), 'You raised each power by one. Now divide each term by its new power.'],
            [`${polyExpr(F)} + 1`, r`The powers are right, but check the condition $F(0) = 0$: there must be no constant added on.`],
          ],
          hints: [
            'For each term: raise the power by one, then divide by the new power.',
            r`The first term, $${polyTex([f[0]])}$, becomes $${polyTex([F[0]])}$. Check it by differentiating.`,
          ],
          explain: r`
            Raise each power by one and divide by the new power:
            ${f.map((term, i) => r`$${polyTex([term])}$ becomes $${polyTex([F[i]])}$`).join(', ')}.

            So $F(x) = ${polyTex(F)}$. Check: its derivative is $${polyTex(f)}$, and $F(0) = 0$.
          `,
        };
      },
    },
    {
      id: 'distance',
      type: 'numeric',
      title: 'Close the loop',
      text: r`
        In Lesson 1 a car's distance was $d = 2t^2$ metres, and you teased
        its speed out one tiny stretch at a time. The power rule does it in
        one step: its speed is $v = 4t$ m/s.

        Now run it backwards. Knowing only the speed, $v = 4t$, **how far does
        the car travel between $t = 0$ and $t = 5$ s?**
      `,
      figure: {
        type: 'plot', x: [0, 6.8], y: [0, 26], xStep: 1, yStep: 5, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        fns: [{ expr: '4x', from: 0, to: 6, color: 'blue' }],
        areas: [{ fn: 0, from: 0, to: 5, color: 'green' }],
        alt: 'A speed–time graph: a straight line through the origin reaching 20 metres per second at 5 seconds. The triangle under it from 0 to 5 seconds is shaded.',
      },
      answer: 50,
      unit: 'm',
      wrong: [
        [20, 'That is the speed at 5 s. The distance is the *area* under the speed graph up to there.'],
        [100, '20 m/s × 5 s would be the distance at top speed all the way. The car started from rest.'],
        [4, r`4 is the derivative of $4t$. To get distance from speed you need the antiderivative.`],
      ],
      hints: [
        r`Distance is the area under the speed graph. Find an antiderivative of $4t$.`,
        r`An antiderivative of $4t$ is $2t^2$. Work out $2 \times 5^2 - 2 \times 0^2$.`,
      ],
      explain: r`
        An antiderivative of $4t$ is $2t^2$, so the distance is
        $2 \times 5^2 - 0 = 50$ m. (The triangle agrees: $\tfrac12 \times 5 \times 20 = 50$.)

        And $2t^2$ is exactly the distance formula the car started with.
        **Differentiate distance and you get speed. Integrate speed and you
        get distance back.**
      `,
    },
    {
      id: 'reversing',
      type: 'choice',
      stretch: true,
      title: 'Below the axis',
      text: r`
        A car rolls forward, slowing down. After 3 seconds it stops, and
        then it **reverses**: its velocity (speed with a direction) turns
        negative, and the graph dips below the axis.

        The theorem has not changed: the slope of the running total still
        equals the height of the curve. **So what must the lower graph do
        after the 3-second mark?** Decide first, then drag to check.
      `,
      figure: {
        type: 'area-accumulator', fn: '3 - x', x: [0, 6], y: [-3, 3], xStep: 1, yStep: 1, ay: [0, 5], ayStep: 1, start: 1,
        labels: { f: 'velocity (m/s)', A: 'running total of area (m)' },
        words: { area: 'area so far', height: 'velocity now', slope: 'slope of the total', heightTag: 'velocity', slopeTag: 'slope' },
        alt: 'Top: a velocity line falling from 3 metres per second, through zero at 3 seconds, to minus 3 at 6 seconds, with a movable edge. Bottom: a graph of the running total of area.',
      },
      columns: 1,
      options: [
        { text: 'It turns round and heads downhill', correct: true },
        { text: 'It keeps climbing, but more slowly', why: r`That is what it does *before* $t = 3$, while the velocity is positive but shrinking. After $t = 3$ the height of the curve is negative.` },
        { text: 'It stays level', why: r`Level means a slope of zero. That happens only at the instant $t = 3$, when the velocity is exactly zero.` },
        { text: 'It drops straight to zero', why: 'The slope is negative, but not a cliff: the total falls at exactly the rate the velocity graph shows.' },
      ],
      explain: r`
        After $t = 3$ the curve's height is negative, so the slope of the
        total is negative: it runs downhill. **Area below the axis counts
        as negative.**

        For the car that makes perfect sense. The total is its distance
        from the start, and reversing undoes distance. By $t = 6$ s the area
        above the axis and the area below cancel: the car is back where it began.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend who has seen slopes and areas, but not this lesson, asks:

        > "What do tangent lines have to do with areas?"

        How would you explain the connection?
      `,
      model: `
        Take the area under a curve from a fixed start up to a movable edge,
        and ask how fast that area grows as the edge moves. Moving the edge
        a tiny step adds a thin strip as tall as the curve, so the area
        grows at a rate equal to the curve's height. In other words, the
        **slope** of the area function is the original curve. So finding an
        area means finding a function with a known slope: differentiation
        run backwards. That is why slopes and areas undo each other.
      `,
    },
  ],
  recap: [
    'Let $A(x)$ be the area under $f$ up to $x$. Then $A\'(x) = f(x)$: area piles up at a rate equal to the height of the curve.',
    'An **antiderivative** of $f$ is a function $F$ with $F\' = f$. For powers: raise the power by one, then divide by the new power.',
    'The area under $f$ from $a$ to $b$ is $F(b) - F(a)$: exact, with no rectangles.',
    'Differentiation and integration undo each other: distance ⇄ speed, running total ⇄ rate.',
  ],
  next: 'That is the heart of calculus: slopes, areas, and the bridge between them. Next: two places where it earns its keep.',
};
