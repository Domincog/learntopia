// Algebra Foundations · Lesson 8 · The Curve y = x²
import { r, num, signed } from '../../../kit.js';
import { BOWL } from '../helpers.js';

export default {
  id: 'parabolas',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Twice as wide',
      text: `
        A square patio that is **3 tiles wide** needs 9 tiles.

        You decide to make it twice as wide: **6 tiles**. How many tiles does it need now?
      `,
      shuffle: false,
      options: [
        { text: '18' },
        { text: '27' },
        { text: '36', correct: true },
      ],
      explain: r`
        $6 \times 6 = 36$: four times as many, not twice as many.

        On a straight line, doubling $x$ would double the part that grows. Here the amount depends on $x$ **times itself**, and that changes everything about the graph. It is no longer a line.
      `,
    },
    {
      id: 'teach-square',
      type: 'info',
      title: 'Squaring a number',
      text: r`
        The patio rule multiplies the width by itself. That is written with a small raised 2, and read as $x$ **squared**:

        $$ x^2 = x \times x $$

        | $x$ | 3 | 6 | 10 | $-2$ |
        |:--|--:|--:|--:|--:|
        | $x^2$ | 9 | 36 | 100 | 4 |

        Squaring is not doubling: $6^2$ is $\mathord{6 \times 6 = 36},$ not 12. And a negative number has a **positive** square, because a negative times a negative is positive:

        $$ (-2)^2 = (-2) \times (-2) = 4 $$
      `,
    },
    {
      id: 'table',
      type: 'fill',
      title: 'Watch the steps',
      text: r`
        The rule for the tiles is $y = x^2$: multiply $x$ by itself.

        Complete the table. The bottom row shows **how much $y$ grew** since the column before.
      `,
      template: r`
        | $x$ | 1 | 2 | 3 | 4 | 5 |
        |:--|--:|--:|--:|--:|--:|
        | $y = x^2$ | 1 | 4 | 9 | [[16]] | [[25]] |
        | growth | | +3 | +5 | + [[7]] | + [[9]] |
      `,
      hints: [r`$4^2$ means $4 \times 4$.`, 'For the bottom row, subtract: how far is it from 9 to 16?'],
      explain: r`
        The growth itself grows: $+3, +5, +7, +9$. On a line it would be the same every time. That constant step was the slope.

        A rule with an $x^2$ in it is called **quadratic**. Its rate of change keeps changing, and that is what bends its graph.
      `,
    },
    {
      id: 'negative',
      type: 'numeric',
      text: r`
        A patio cannot be $-3$ tiles wide, but the rule $y = x^2$ accepts any number.

        **What is $y$ when $x = -3$?**
      `,
      answer: 9,
      prefix: '$y =$',
      wrong: [
        [-9, r`A negative times a negative is positive: $(-3) \times (-3) = +9$.`],
        [-6, r`That is $-3$ doubled. Squaring means multiplying the number by itself.`],
        [6, r`That is $3 + 3$. Squaring means $(-3) \times (-3)$.`],
      ],
      explain: r`
        $(-3)^2 = (-3) \times (-3) = 9$, the same as $3^2$.

        A number and its opposite always have the same square. On the graph, the left half will be a mirror image of the right half.
      `,
    },
    {
      id: 'shape',
      type: 'info',
      title: 'The parabola',
      text: r`
        Plot $y = x^2$ for negative and positive $x$ and you get this curve. It is called a **parabola**.

        - It is **symmetric**: the left side mirrors the right.
        - It has a turning point, the **vertex**. Here that is the lowest point, at $(0, 0)$.
        - It gets steeper and steeper as you move away from the vertex. Those are the growing steps from your table.

        A ball in the air, the main cable of a suspension bridge weighed down by its roadway and the dish of a radio telescope all follow this shape, exactly or very nearly.
      `,
      figure: {
        type: 'plot', x: [-4, 4], y: [-2, 10], yStep: 2,
        fns: [{ expr: 'x^2', color: 'blue' }],
        points: [-3, -2, -1, 0, 1, 2, 3].map((x) => ({ x, y: x * x, color: x === 0 ? 'orange' : 'blue' })),
        labels: [{ x: 0, y: 0, text: 'vertex', color: 'orange', dx: 12, dy: 40 }],
        alt: 'The curve y = x squared: a bowl shape, symmetric about the y-axis, with its lowest point at the origin and passing through (1, 1), (2, 4) and (3, 9) on both sides.',
      },
    },
    {
      id: 'stretch-a',
      type: 'interact',
      title: 'Wide, narrow, upside down',
      text: r`
        Put a number in front of the square: $\;y = \blue{a}x^2$.

        Try the slider, including negative values. Then **make the curve pass through the orange dot.**
      `,
      widget: {
        type: 'plot', ...BOWL,
        params: { a: { min: -2, max: 2, step: 0.25, value: 1, label: '$a$', color: 'blue' } },
        fns: [
          { expr: 'x^2', color: 'gray', dashed: true, width: 2 },
          { expr: 'a*x^2', color: 'blue' },
        ],
        points: [{ x: 2, y: 2, color: 'orange' }],
        alt: 'A parabola with an adjustable number a in front of x squared, the curve y = x squared dashed for comparison, and an orange dot at (2, 2).',
      },
      check: (s) => {
        if (s.a === 0.5) return true;
        if (s.a === 0) return r`With $a = 0$ the square disappears and only the flat line $y = 0$ is left.`;
        if (s.a < 0) return r`The curve opens downwards now, and the dot is above the axis. You need a positive $a$.`;
        return s.a > 0.5
          ? r`Too narrow: at $x = 2$ the curve is already above the dot.`
          : r`Too wide: at $x = 2$ the curve is still below the dot.`;
      },
      solution: { a: 0.5 },
      hints: [r`The dot is at $x = 2$. There $x^2 = 4$, but the dot is only 2 high.`],
      explain: r`
        At $x = 2$ the square is 4 and the dot is at height 2, so $a = \tfrac{1}{2}$.
      `,
    },
    {
      id: 'teach-a',
      type: 'info',
      title: 'What the number in front does',
      text: r`
        In $y = ax^2$ every height of $y = x^2$ is multiplied by $a$.

        | $a$ | The curve |
        |---|---|
        | larger than 1 | a [narrower]{.blue} bowl |
        | between 0 and 1 | a [wider]{.green} bowl |
        | negative | turned over: a [hill]{.orange} |

        On a hill the vertex is the **highest** point.

        :::key
        Only the sign of the number **in front of $x^2$** decides which way a parabola opens. A number added at the end, as in $y = x^2 - 5$, just slides the whole curve up or down.
        :::
      `,
      figure: {
        type: 'plot', ...BOWL,
        fns: [
          { expr: 'x^2', color: 'gray', dashed: true, width: 2 },
          { expr: '3*x^2', color: 'blue' },
          { expr: '0.25*x^2', color: 'green' },
          { expr: '-x^2', color: 'orange' },
        ],
        labels: [
          { x: 0.95, y: 9.2, text: 'a = 3', color: 'blue', anchor: 'middle' },
          { x: -2.4, y: 9.2, text: 'a = 1', color: 'gray', anchor: 'middle' },
          { x: 5, y: 6.25, text: 'a = ¼', color: 'green', dx: 6, dy: 24 },
          { x: 1.5, y: -2.25, text: 'a = −1', color: 'orange', dx: 12, dy: 5 },
        ],
        alt: 'Four parabolas with their vertex at the origin. With a = 3 the bowl is narrow, with a = 1 it is the dashed curve y = x squared, with a = one quarter it is wide, and with a = minus 1 it is turned over into a hill.',
      },
    },
    {
      id: 'which-way',
      type: 'choice',
      review: true,
      text: 'Which of these parabolas opens **downwards**, like a hill?',
      options: [
        { text: r`$y = -2x^2$`, correct: true },
        { text: r`$y = 0.5x^2$`, why: r`0.5 is positive, so this is a bowl. It is just a wide one.` },
        { text: r`$y = x^2 - 5$`, why: r`The $-5$ slides the whole curve down by 5. The number in front of $x^2$ is still $+1$, so it opens upwards.` },
        { text: r`$y = 3x^2$`, why: 'A narrow bowl, but a bowl.' },
      ],
      explain: r`Only the sign of the number **in front of $x^2$** decides the direction. Negative: a hill. Positive: a bowl.`,
    },
    {
      id: 'move-it',
      type: 'interact',
      title: 'Move the vertex',
      text: r`
        Now slide the bowl around without changing its shape:

        $$ y = (x - \blue{h})^2 + \orange{k} $$

        **Move the vertex onto the orange dot at $(3, -2)$.**
      `,
      widget: {
        type: 'plot', ...BOWL,
        params: {
          h: { min: -4, max: 4, step: 1, value: 0, label: '$h$', color: 'blue' },
          k: { min: -3, max: 5, step: 1, value: 0, label: '$k$', color: 'orange' },
        },
        fns: [{ expr: '(x - h)^2 + k', color: 'blue' }],
        points: [{ x: 3, y: -2, color: 'orange' }],
        alt: 'A parabola that can be slid sideways with h and up or down with k, and an orange dot at (3, -2).',
      },
      check: (s) => {
        if (s.h === 3 && s.k === -2) return true;
        if (s.h === -3) return r`The bowl went left. Try the other direction with $h$.`;
        if (s.h !== 3) return r`Use $h$ first: slide the bowl sideways until its lowest point is above or below the dot.`;
        return s.k > -2 ? 'The vertex is right above the dot. Bring it down.' : 'A little too low. Bring the vertex up to the dot.';
      },
      solution: { h: 3, k: -2 },
      explain: r`
        With $h = 3$ and $k = -2$ the rule reads $y = (x - 3)^2 - 2$. The bowl has moved 3 to the right and 2 down, and its shape has not changed.
      `,
    },
    {
      id: 'teach-vertex',
      type: 'info',
      title: 'The vertex is in the equation',
      text: r`
        Look at $y = (x - 3)^2 - 2$. A square is never negative, so the curve is lowest where the square is **zero**: at $x = 3$. All that is left there is $y = -2$.

        :::key
        $y = (x - h)^2 + k$ has its vertex at $(h, k)$: the $x$ that makes the bracket zero, and the number outside it.
        :::

        :::example
        $y = (x + 9)^2 - 10$. The bracket is zero when $x = -9$, and then $\mathord{y = 0 - 10 = -10}$. Vertex: $\mathord{(-9, -10)}$.
        :::

        Mind the sign: $x \mathbin{-} 3$ moved the curve to the **right**, and $x + 9$ moves it to the left.
      `,
      figure: {
        type: 'plot', ...BOWL,
        fns: [
          { expr: 'x^2', color: 'gray', dashed: true, width: 2 },
          { expr: '(x - 3)^2 - 2', color: 'blue' },
        ],
        points: [{ x: 3, y: -2, color: 'orange' }],
        labels: [
          { x: 3, y: -2, text: 'vertex (3, −2)', color: 'orange', dx: 12, dy: 18 },
        ],
        alt: 'The dashed curve y = x squared and the same bowl moved 3 to the right and 2 down. Its vertex is marked at (3, -2).',
      },
    },
    {
      id: 'sign-trap',
      type: 'choice',
      text: r`Where is the vertex of $\;y = (x + 4)^2 + 1\,$?`,
      options: [
        { text: r`$(-4,\ 1)$`, correct: true },
        { text: r`$(4,\ 1)$`, why: r`At $x = 4$ the bracket is $8$, not $0$. The bracket is zero at $x = -4$.` },
        { text: r`$(1,\ 4)$`, why: r`The number inside the bracket belongs to $x$. The number outside is the height $y$.` },
        { text: r`$(-4,\ -1)$`, why: r`The $+1$ outside the bracket lifts the curve **up** by 1. Only the number inside the bracket has its sign flipped.` },
      ],
      hints: [r`For which $x$ is the bracket $x + 4$ equal to zero?`],
      explain: r`The square is smallest when $x + 4 = 0$, so at $x = -4$. There $y = 0 + 1 = 1$. The vertex is $(-4, 1)$.`,
    },
    {
      id: 'lowest',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const h = rng.intExcept(-6, 6, [0]);
        const k = rng.intExcept(-7, 7, [0, h, -h]);
        const inside = `x ${signed(-h)}`;
        return {
          text: r`
            $$ y = (${inside})^2 ${signed(k)} $$

            Where is the lowest point of this curve?
          `,
          template: r`It is at $x =$ [[${h}]], and there $y =$ [[${k}]].`,
          hints: [r`A square is never negative. For which $x$ is $(${inside})^2$ equal to zero?`],
          explain: r`$(${inside})^2$ is zero when $x = ${num(h)}$, and it cannot go below zero. All that is left then is $y = ${num(k)}$. The vertex is $(${num(h)},\ ${num(k)})$.`,
        };
      },
    },
    {
      id: 'crossings',
      type: 'interact',
      title: 'Where it meets the axis',
      text: r`
        This is $\;y = x^2 - 4$.

        **Drag P and Q onto the two places where the curve crosses the $x$-axis.**
      `,
      widget: {
        type: 'plot', x: [-6, 6], y: [-5, 9],
        fns: [{ expr: 'x^2 - 4', color: 'blue' }],
        points: [
          { id: 'P', x: -5, y: 0, drag: 'x', snap: 1, color: 'orange', label: 'P' },
          { id: 'Q', x: 5, y: 0, drag: 'x', snap: 1, color: 'violet', label: 'Q' },
        ],
        alt: 'The parabola y = x squared minus 4, with two draggable points P and Q on the x-axis.',
      },
      check: (s) => {
        const xs = [s.P.x, s.Q.x].sort((a, b) => a - b);
        if (xs[0] === -2 && xs[1] === 2) return true;
        if (xs[0] === xs[1]) return 'P and Q are on the same spot. The curve crosses the axis in two different places.';
        if (xs.includes(2) || xs.includes(-2)) return 'One of them is right. The curve is symmetric: where is the mirror image of that crossing?';
        return r`On the $x$-axis, $y = 0$. So you are looking for the numbers with $x^2 - 4 = 0$.`;
      },
      solution: { P: { x: -2, y: 0 }, Q: { x: 2, y: 0 } },
      explain: r`
        The curve crosses at $x = -2$ and at $x = 2$. A sloping line crosses the $x$-axis once. A parabola can cross it twice.
      `,
    },
    {
      id: 'teach-roots',
      type: 'info',
      title: 'Roots',
      text: r`
        The places where a curve meets the $x$-axis are called its **roots**. On the $x$-axis $y = 0$, so the roots of $y = x^2 - 4$ are the numbers with $x^2 = 4$. **Two** numbers have the square 4: $2$ and $-2$.

        :::example
        Solve $\;x^2 = 400$. $\;\mathord{20 \times 20 = 400}$, and $\mathord{(-20) \times (-20) = 400}$ as well. So $x = 20$ or $\mathord{x = -20}$.
        :::

        A parabola is symmetric, so its vertex lies **halfway between** its two roots: here halfway between $-2$ and $2$, at $x = 0$.
      `,
      figure: {
        type: 'plot', x: [-6, 6], y: [-5, 9],
        fns: [{ expr: 'x^2 - 4', color: 'blue' }],
        points: [{ x: -2, y: 0, color: 'orange' }, { x: 2, y: 0, color: 'orange' }, { x: 0, y: -4, color: 'violet' }],
        labels: [
          { x: -2, y: 0, text: 'root', color: 'orange', dx: -12, dy: -10, anchor: 'end' },
          { x: 2, y: 0, text: 'root', color: 'orange', dx: 12, dy: -10 },
          { x: 0, y: -4, text: 'vertex', color: 'violet', dx: 14, dy: 16 },
        ],
        alt: 'The parabola y = x squared minus 4. Its two roots are marked on the x-axis at -2 and 2, and its vertex at (0, -4) lies halfway between them.',
      },
    },
    {
      id: 'two-solutions',
      type: 'multi',
      review: true,
      gen: (rng) => {
        const n = rng.int(4, 12);
        const sq = n * n;
        return {
          text: r`Which values of $x$ solve $\;x^2 = ${sq}\,$? Select **all** of them.`,
          options: [
            { text: `$${n}$`, correct: true },
            { text: `$-${n}$`, correct: true },
            { text: `$${num(sq / 2)}$`, why: `That is half of ${sq}. Squaring is not doubling, so undoing it is not halving.` },
            { text: `$${sq}$`, why: r`$${sq}^2$ is far larger than ${sq}.` },
          ],
          explain: r`$${n} \times ${n} = ${sq}$ and $(-${n}) \times (-${n}) = ${sq}$. An equation with a square in it usually has **two** solutions, one for each side of the parabola.`,
        };
      },
    },
    {
      id: 'teach-how-many',
      type: 'info',
      title: 'How many roots?',
      text: r`
        A parabola does not have to cross the $x$-axis twice. It depends on where its vertex is and which way it opens.

        | A bowl with its vertex | meets the $x$-axis |
        |---|---|
        | [below]{.blue} the axis | twice |
        | exactly [on]{.green} the axis | once, at the vertex |
        | [above]{.orange} the axis | never |

        A hill is the other way up. With its top **above** the axis it comes down through the axis twice. With its top below, it never reaches it.

        In $y = x^2 + 3$ there is no bracket, so the vertex is at $\mathord{(0, 3)}$.
      `,
      figure: {
        type: 'plot', x: [-7.5, 7.5], y: [-4, 6],
        fns: [
          { expr: '(x + 4.5)^2 - 3', color: 'blue', from: -6.8, to: -2.2 },
          { expr: 'x^2', color: 'green', from: -1.7, to: 1.7 },
          { expr: '(x - 4.5)^2 + 2', color: 'orange', from: 3, to: 6 },
        ],
        labels: [
          { x: -4.5, y: -4, text: 'twice', color: 'blue', dy: -6, anchor: 'middle' },
          { x: 0, y: -1, text: 'once', color: 'green', dx: 12, dy: 5 },
          { x: 4.5, y: 1, text: 'never', color: 'orange', dy: 5, anchor: 'middle' },
        ],
        alt: 'Three bowl-shaped parabolas side by side. The first has its vertex below the x-axis and crosses the axis twice. The second has its vertex on the axis and touches it once. The third has its vertex above the axis and never meets it.',
      },
    },
    {
      id: 'how-many',
      type: 'bucket',
      title: 'Two, one or none',
      text: r`How many times does each curve meet the $x$-axis? Picture where its vertex is and which way it opens.`,
      buckets: ['Twice', 'Once', 'Never'],
      items: [
        { text: r`$y = x^2 - 9$`, bucket: 0, why: r`A bowl with its vertex at $(0, -9)$, below the axis. It crosses at $x = 3$ and $x = -3$.` },
        { text: r`$y = -x^2 + 4$`, bucket: 0, why: r`A hill with its top at $(0, 4)$, above the axis. It comes down through the axis on both sides.` },
        { text: r`$y = x^2$`, bucket: 1, why: r`Its vertex sits exactly on the axis, at $(0, 0)$, and the rest is above it.` },
        { text: r`$y = (x - 2)^2$`, bucket: 1, why: r`The same bowl moved 2 to the right. It touches the axis only at its vertex, $(2, 0)$.` },
        { text: r`$y = x^2 + 3$`, bucket: 2, why: r`A bowl with its vertex at $(0, 3)$. It starts above the axis and only goes up.` },
        { text: r`$y = -x^2 - 1$`, bucket: 2, why: r`A hill whose top is at $(0, -1)$, already below the axis.` },
      ],
      explain: r`
        A parabola can cross the $x$-axis twice, touch it once at its vertex, or miss it completely.

        In equation terms: $x^2 = 9$ has two solutions, $x^2 = 0$ has one, and $x^2 = -3$ has none, because no number on the number line has a negative square.
      `,
    },
    {
      id: 'ball',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const T = rng.pick([2, 3, 4]);
        const mid = T / 2;
        const top = 5 * mid * (T - mid);
        return {
          title: 'Halfway there',
          text: r`
            A ball is kicked from the ground. After $t$ seconds its height in metres is

            $$ h = 5t\,(${T} - t) $$

            It is on the ground at $t = 0$ and lands again at $t = ${T}$. **How high is it at its highest point?**
          `,
          answer: top,
          unit: 'm',
          wrong: [
            [0, r`That is its height when it lands. The highest point comes earlier.`],
            [5 * T, r`Find the time of the highest point first, then put that time into the rule.`],
            [mid, r`That is the *time* of the highest point. Put it into the rule to get the height.`],
          ].filter(([v]) => v !== top),
          hints: [
            'A parabola is symmetric. Its highest point is exactly halfway between the two roots.',
            r`Halfway between $t = 0$ and $t = ${T}$ is $t = ${num(mid)}$. Put that into the rule.`,
          ],
          explain: r`
            The roots are $t = 0$ and $t = ${T}$, and the vertex lies halfway between them, at $t = ${num(mid)}$:

            $$ h = 5 \times ${num(mid)} \times (${T} - ${num(mid)}) = ${num(top)} \text{ m} $$

            The ball spends as long going up as coming down.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A line and a parabola both turn an $x$ into a $y$.

        **In your own words: what is the main difference in the way they change?**
      `,
      model: `
        A line changes by the same amount for every step in $x$. That amount is its slope.

        A parabola's change is itself changing. A bowl falls more and more slowly, stops for an instant at the vertex, then climbs faster and faster.

        That is why a line can cross a given height only once, while a parabola can cross it twice (once on the way down, once on the way up) or miss it altogether.
      `,
    },
  ],
  recap: [
    'A quadratic rule has an $x^2$ in it. Its graph is a parabola, and its rate of change keeps changing.',
    'In $y = (x - h)^2 + k$ the vertex is at $(h, k)$. A negative number in front of the square turns the bowl into a hill.',
    'The roots are where the curve crosses the $x$-axis. There can be two, one or none.',
    'A parabola is symmetric: the vertex lies halfway between the roots.',
  ],
  next: 'Next: the roots of a quadratic are hidden inside its formula. Factoring gets them out.',
};
