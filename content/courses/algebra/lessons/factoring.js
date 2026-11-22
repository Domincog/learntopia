// Algebra Foundations · Lesson 9 · Rectangles and Roots
import { r, num, term } from '../../../kit.js';
import { quad, bracket, factorPairs } from '../helpers.js';

export default {
  id: 'factoring',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A square of a sum',
      text: r`
        Go with your first instinct.

        **Which of these is the same as $(x + 3)^2$?**
      `,
      shuffle: false,
      options: [
        { text: r`$x^2 + 9$` },
        { text: r`$x^2 + 6x + 9$`, correct: true },
        { text: r`$2x + 6$` },
      ],
      explain: r`
        Test it with $x = 1$: $\;(1 + 3)^2 = 16$. But $1^2 + 9$ is only 10. The middle answer gives $1 + 6 + 9 = 16$.

        Squaring each part separately is one of the most common slips in algebra. Where do the extra $6x$ come from? A picture makes it hard to forget.
      `,
    },
    {
      id: 'teach-area',
      type: 'info',
      title: 'A product is an area',
      text: r`
        Two brackets written side by side are **multiplied**. And a product of two lengths is the area of a rectangle.

        So $(x + 2)(x + 3)$ is the area of a rectangle $x + 2$ wide and $x + 3$ tall. Cut each side into its two pieces, and the area falls into **four parts**:

        | Part | Area |
        |---|---|
        | the big square | $x \times x = x^2$ |
        | the strip on the right | $2 \times x = 2x$ |
        | the strip underneath | $x \times 3 = 3x$ |
        | the corner | $2 \times 3 = 6$ |
      `,
      figure: { type: 'area-model', a: 2, b: 3, total: false, static: true, alt: 'A rectangle x + 2 wide and x + 3 tall, cut into four parts: a square x squared, a strip 2x on the right, a strip 3x underneath and a corner of 6.' },
    },
    {
      id: 'square',
      type: 'interact',
      title: 'Four parts',
      text: r`
        Here is that rectangle, $x + 2$ wide and $x + 3$ tall, with a slider for each side.

        **Turn it into a square with sides $x + 3$,** then look at the four parts.
      `,
      widget: { type: 'area-model', a: 2, b: 3 },
      check: (s) => (s.a === 3 && s.b === 3) || r`Both sides should be $x + 3$. Set both sliders to 3.`,
      solution: { a: 3, b: 3 },
      explain: r`
        Four parts: the big square $x^2$, **two** strips of $3x$, and a corner of 9.

        $$ (x + 3)^2 = x^2 + 3x + 3x + 9 $$

        $$ = x^2 + 6x + 9 $$

        The answer $x^2 + 9$ counts the two squares and forgets the two strips.
      `,
    },
    {
      id: 'expanding',
      type: 'info',
      title: 'Every part meets every part',
      text: r`
        Multiplying two brackets means multiplying each part of one by each part of the other:

        $$ (x + \orange{a})(x + \violet{b}) = x^2 + \orange{a}x + \violet{b}x + \orange{a}\violet{b} $$

        The two strips can be collected, because both are a number of $x$'s: $\;\mathord{\orange{a}x + \violet{b}x = (\orange{a} + \violet{b})\,x}$.

        This is called **expanding**. The parts that are added are the **terms**: the middle term carries the ==sum== of $a$ and $b$, and the last term is their ==product==.

        :::example
        $(x + 10)(x + 20) = x^2 + 30x + 200$, because $\mathord{10 + 20 = 30}$ and $\mathord{10 \times 20 = 200}$.
        :::
      `,
      figure: { type: 'area-model', a: 4, b: 2, static: true, alt: 'A rectangle x + 4 wide and x + 2 tall, cut into x squared, 4x, 2x and 8.' },
    },
    {
      id: 'expand',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const a = rng.int(1, 9);
        const b = rng.intExcept(1, 9, [a]);
        return {
          text: r`**Expand** $\;${bracket(a)}${bracket(b)}$.`,
          answer: quad(a + b, a * b),
          vars: ['x'],
          expanded: true,
          placeholder: 'x^2 + …',
          wrong: [
            [quad(0, a * b), r`You have the square and the corner. The two strips, $${term(a)}$ and $${term(b)}$, are missing.`],
            [quad(a * b, a + b), r`The other way round: the strips **add** (${a} + ${b}) and the corner **multiplies** (${a} × ${b}).`],
            [`2*x + ${a + b}`, 'That adds the two brackets. They are multiplied.'],
          ],
          hints: [
            r`Four parts: $x \times x$, then $x \times ${b}$, then $${a} \times x$, then $${a} \times ${b}$.`,
            r`Collect the two middle parts: $${term(b)} + ${term(a)}$.`,
          ],
          explain: r`$${bracket(a)}${bracket(b)} = x^2 + ${term(b)} + ${term(a)} + ${a * b} = ${quad(a + b, a * b)}$. Sum ${a + b} in the middle, product ${a * b} at the end.`,
        };
      },
    },
    {
      id: 'expand-signs',
      type: 'expr',
      gen: (rng) => {
        const a = rng.int(1, 8);
        const b = rng.intExcept(1, 8, [a]);
        const sum = b - a;
        const product = -a * b;
        return {
          title: 'Mind the signs',
          text: r`
            The pattern works with subtraction too: read $x - 10$ as $x + (-10)$.

            :::example
            In $\mathord{(x - 10)(x + 3)}$ the two numbers are $-10$ and $3$. Their sum is $-7$ and their product is $-30$, so it expands to $\mathord{x^2 - 7x - 30}$.
            :::

            **Expand** $\;${bracket(-a)}${bracket(b)}$.
          `,
          answer: quad(sum, product),
          vars: ['x'],
          expanded: true,
          placeholder: 'x^2 + …',
          wrong: [
            [quad(sum, -product), r`Check the last term: $(-${a}) \times ${b}$ is negative.`],
            [quad(a + b, product), r`Check the middle term: the two numbers are $-${a}$ and $${b}$, and their sum is $${num(sum)}$.`],
            [quad(-sum, product), r`The sign of the middle term is the wrong way round: $-${a} + ${b} = ${num(sum)}$.`],
            [quad(0, product), 'The two middle parts are missing.'],
          ],
          hints: [
            r`The two numbers are $-${a}$ and $${b}$. What is their sum? What is their product?`,
            r`Sum: $-${a} + ${b} = ${num(sum)}$. Product: $-${a} \times ${b} = ${num(product)}$.`,
          ],
          explain: r`Sum: $-${a} + ${b} = ${num(sum)}$. Product: $(-${a}) \times ${b} = ${num(product)}$. So $${bracket(-a)}${bracket(b)} = ${quad(sum, product)}$.`,
        };
      },
    },
    {
      id: 'factor-puzzle',
      type: 'interact',
      title: 'Now backwards',
      text: r`
        This time you know the area and want the sides.

        The rectangle should have the area $\;x^2 + 7x + 12$. **Find its two sides.**
      `,
      widget: { type: 'area-model', a: 1, b: 1, target: [7, 12] },
      check: (s) => {
        if (s.sum === 7 && s.product === 12) return true;
        if (s.sum === 7) return `There are 7 strips, as needed. But the corner holds ${s.product}, not 12. Keep the total at 7 and split it differently.`;
        if (s.product === 12) return `The corner holds 12, as needed. But there are ${s.sum} strips, not 7.`;
        return 'You need 7 strips in total and 12 small squares in the corner.';
      },
      solution: { a: 3, b: 4 },
      hints: ['Which two numbers add up to 7 and multiply to 12?'],
      explain: r`
        $x^2 + 7x + 12 = (x + 3)(x + 4)$, because $3 + 4 = 7$ and $3 \times 4 = 12$.
      `,
    },
    {
      id: 'teach-factoring',
      type: 'info',
      title: 'Factoring: expanding in reverse',
      text: r`
        An expression with an $x^2$ in it, such as $x^2 + 7x + 12$, is called a **quadratic**. Writing it as a product of brackets is called **factoring**. It is always the same puzzle: find two numbers with the right **product** (the last term) and the right **sum** (the number in the middle term).

        :::example
        Factor $\;x^2 + 12x + 20$.

        1. Start with the product. The pairs that multiply to 20 are $\;1 \times 20$, $\;2 \times 10\;$ and $\;4 \times 5$.
        2. Which pair adds up to 12? Only $\;2 + 10$.

        So $\;\mathord{x^2 + 12x + 20} = \mathord{(x + 2)(x + 10)}$. Expand it again to check.
        :::
      `,
    },
    {
      id: 'factor',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = rng.int(1, 7);
        const b = rng.int(a + 1, 9);
        const sum = a + b;
        const product = a * b;
        const pairs = factorPairs(product).map(([p, q]) => `$${p} \\times ${q}$`).join(', ');
        return {
          text: r`**Factor** $\;${quad(sum, product)}$. Put the smaller number first.`,
          template: r`$${quad(sum, product)} = (x\,+$ [[${a}]] $)(x\,+$ [[${b}]] $)$`,
          hints: [
            `Start with the product. Which pairs of whole numbers multiply to ${product}?`,
            `The pairs are ${pairs}. Which pair adds up to ${sum}?`,
          ],
          explain: r`You need two numbers with product ${product} and sum ${sum}. The pairs with product ${product} are ${pairs}. Only ${a} and ${b} add up to ${sum}, so $${quad(sum, product)} = ${bracket(a)}${bracket(b)}$.`,
        };
      },
    },
    {
      id: 'teach-factor-signs',
      type: 'info',
      title: 'When minus signs come in',
      text: r`
        The two numbers may be negative. The puzzle is the same: the right product and the right sum.

        | Quadratic | Factored |
        |---|---|
        | $\mathord{x^2 + 12x + 20}$ | $\mathord{(x + 2)(x + 10)}$ |
        | $\mathord{x^2 - 12x + 20}$ | $\mathord{(x - 2)(x - 10)}$ |
        | $\mathord{x^2 - 8x - 20}$ | $\mathord{(x + 2)(x - 10)}$ |
        | $\mathord{x^2 + 8x - 20}$ | $\mathord{(x - 2)(x + 10)}$ |

        - A **positive** last term: the two numbers have the same sign, the sign of the middle term.
        - A **negative** last term: different signs. Ignore the signs for a moment: the larger number is the one that takes the sign of the middle term.
      `,
    },
    {
      id: 'factor-signs',
      type: 'choice',
      gen: (rng) => {
        const a = rng.int(2, 7);
        const b = rng.int(1, a - 1);
        // (x - a)(x + b): the sum b - a is negative, the product -ab is negative
        const sum = b - a;
        const product = -a * b;
        return {
          text: r`
            A negative last term means the two numbers have **different signs**.

            Which is the factored form of $\;${quad(sum, product)}\,$?
          `,
          options: [
            { text: `$${bracket(-a)}${bracket(b)}$`, correct: true },
            { text: `$${bracket(a)}${bracket(-b)}$`, why: r`The product is right, but the sum is $${a} - ${b} = +${a - b}$. The middle term needs $${num(sum)}$.` },
            { text: `$${bracket(-a)}${bracket(-b)}$`, why: r`Two negatives multiply to a positive: the last term would be $+${a * b}$.` },
            { text: `$${bracket(a)}${bracket(b)}$`, why: r`Both the middle and the last term would be positive.` },
          ],
          hints: [`Two numbers with product ${num(product)} and sum ${num(sum)}. The larger one must carry the minus sign.`],
          explain: r`$-${a} + ${b} = ${num(sum)}$ and $(-${a}) \times ${b} = ${num(product)}$, so the factors are $${bracket(-a)}${bracket(b)}$. The sign of the middle term tells you which number is negative: the larger one.`,
        };
      },
    },
    {
      id: 'zero-product',
      type: 'choice',
      title: 'The special number',
      text: r`
        Two numbers are multiplied and the result is **zero**:

        $$ A \times B = 0 $$

        What can you be sure of?
      `,
      options: [
        { text: 'At least one of them is zero', correct: true },
        { text: 'Both of them are zero', why: r`One is enough: $0 \times 7 = 0$.` },
        { text: 'They are opposites, like 3 and −3', why: r`$3 \times (-3) = -9$, not zero. Opposites **add** to zero.` },
        { text: 'Nothing at all', why: 'Zero is special: a product can only be zero if one of its factors is zero.' },
      ],
      explain: r`
        A product is zero only when one of its factors is zero. Two numbers that are both different from zero never multiply to zero.
      `,
    },
    {
      id: 'teach-zero-product',
      type: 'info',
      title: 'Zero splits an equation in two',
      text: r`
        "If a product is zero, one of its factors is zero" is the **zero-product property**. No other number does this: if $A \times B = 12$, the pair could be 1 and 12, or 3 and 4, or 24 and one half.

        It turns a factored equation into two small ones.

        :::example
        Solve $\;x^2 - 12x + 20 = 0$.

        1. Factor. $-2$ and $-10$ have the product 20 and the sum $-12$, so $\;\mathord{(x - 2)(x - 10) = 0}$.
        2. One bracket must be zero. $\;\mathord{x - 2 = 0}$ gives $x = 2$, and $\;\mathord{x - 10 = 0}$ gives $x = 10$.
        :::

        Mind the signs: the bracket $(x - 2)$ gives the solution $+2$.
      `,
    },
    {
      id: 'solve-factored',
      type: 'multi',
      text: r`
        $$ (x - 2)(x + 5) = 0 $$

        Which values of $x$ make this true? Select **all** of them.
      `,
      options: [
        { text: r`$x = 2$`, correct: true },
        { text: r`$x = -5$`, correct: true },
        { text: r`$x = -2$`, why: r`Then the brackets are $-4$ and $3$, and their product is $-12$.` },
        { text: r`$x = 5$`, why: r`Then the brackets are $3$ and $10$, and their product is 30.` },
        { text: r`$x = 0$`, why: r`Then the brackets are $-2$ and $5$, and their product is $-10$.` },
      ],
      hints: ['The product is zero when one of the brackets is zero. Take the brackets one at a time.'],
      explain: r`
        Either $x - 2 = 0$, which gives $x = 2$, or $x + 5 = 0$, which gives $x = -5$. The sign flips each time: $(x + 5)$ gives $-5$.
      `,
    },
    {
      id: 'roots-graph',
      type: 'interact',
      title: 'Roots in plain sight',
      text: r`
        Here is the graph of

        $$ y = (x - \blue{p})(x - \orange{q}) $$

        **Make the curve cross the $x$-axis at $-1$ and at $3$.**
      `,
      widget: {
        type: 'plot', x: [-6, 6], y: [-6, 8],
        params: {
          p: { min: -4, max: 4, step: 1, value: -3, label: '$p$', color: 'blue' },
          q: { min: -4, max: 4, step: 1, value: 0, label: '$q$', color: 'orange' },
        },
        fns: [{ expr: '(x - p)*(x - q)', color: 'blue' }],
        points: [{ x: -1, y: 0, color: 'orange' }, { x: 3, y: 0, color: 'orange' }],
        alt: 'A parabola y = (x - p)(x - q) with sliders for p and q, and orange dots on the x-axis at -1 and 3.',
      },
      check: (s) => {
        const set = [s.p, s.q].sort((a, b) => a - b);
        if (set[0] === -1 && set[1] === 3) return true;
        if (s.p === s.q) return r`With $p = q$ the curve only touches the axis once. You need two different crossings.`;
        if (set.includes(-1) || set.includes(3)) return 'One crossing is caught. The curve crosses exactly where a bracket is zero: set the other slider to the other crossing.';
        return r`The curve crosses the axis at $x = p$ and at $x = q$. Watch the crossings while you move one slider.`;
      },
      solution: { p: -1, q: 3 },
      explain: r`
        $y = (x + 1)(x - 3)$. On the $x$-axis $y = 0$, and the product is zero exactly where one bracket is zero: at $x = -1$ and at $x = 3$.

        The factored form shows the roots directly. And as in the last lesson, the vertex lies halfway between them, at $x = 1$.
      `,
    },
    {
      id: 'solve',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const r1 = rng.intExcept(-7, 5, [0]);
        const r2 = rng.intExcept(r1 + 1, 8, [0, -r1]);
        const sum = -(r1 + r2);
        const product = r1 * r2;
        return {
          text: r`
            **Solve by factoring:**

            $$ ${quad(sum, product)} = 0 $$
          `,
          template: r`The smaller solution is $x =$ [[${r1}]] and the larger one is $x =$ [[${r2}]].`,
          hints: [
            `Find two numbers with product ${num(product)} and sum ${num(sum)}.`,
            r`They are $${num(-r1)}$ and $${num(-r2)}$, so the equation is $${bracket(-r1)}${bracket(-r2)} = 0$.`,
            'Now set each bracket equal to zero.',
          ],
          explain: r`
            $${num(-r1)}$ and $${num(-r2)}$ have the product $${num(product)}$ and the sum $${num(sum)}$, so

            $$ ${quad(sum, product)} = ${bracket(-r1)}${bracket(-r2)} $$

            The product is zero when $x = ${num(r1)}$ or $x = ${num(r2)}$.
          `,
        };
      },
    },
    {
      id: 'example-zero-side',
      type: 'info',
      title: 'First get a zero',
      text: r`
        The zero-product property needs a **zero**. If an equation has something else on one side, bring everything to the other side before you factor.

        :::example
        Solve $\;x(x + 3) = 130$. Multiplying out the left side gives $x \times x$ and $x \times 3$. For the factoring, $13$ and $-10$ have the product $-130$ and the sum 3.

        | Line | Why |
        |---|---|
        | $\mathord{x^2 + 3x = 130}$ | multiply out |
        | $\mathord{x^2 + 3x - 130 = 0}$ | subtract 130 |
        | $\mathord{(x + 13)(x - 10) = 0}$ | factor |
        | $x = -13$ or $x = 10$ | a bracket is zero |
        :::

        When $x$ stands for something real, such as a length, keep only the solution that makes sense.
      `,
    },
    {
      id: 'garden',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const w = rng.int(3, 9);
        const d = rng.int(1, 6);
        const area = w * (w + d);
        return {
          title: 'A real one',
          text: r`
            A rectangular garden is **${d} m longer than it is wide**. Its area is **${area} m²**.

            **How wide is it?**
          `,
          answer: w,
          unit: 'm',
          wrong: [
            [w + d, 'That is the length. The question asks for the width.'],
            [-(w + d), 'That number does solve the equation, but a width cannot be negative. Take the other solution.'],
          ],
          hints: [
            r`Call the width $x$. Then the length is $x + ${d}$, and the area gives $\;x(x + ${d}) = ${area}$.`,
            r`Expand and bring everything to one side: $\;${quad(d, -area)} = 0$.`,
            `Two numbers with product ${num(-area)} and sum ${d}: try ${w + d} and ${num(-w)}.`,
          ],
          explain: r`
            Width $x$, length $x + ${d}$:

            $$ x(x + ${d}) = ${area} $$

            $$ ${quad(d, -area)} = 0 $$

            $$ ${bracket(w + d)}${bracket(-w)} = 0 $$

            The solutions are $x = ${w}$ and $x = ${num(-(w + d))}$. Only the positive one can be a width: **${w} m** (and ${w} × ${w + d} = ${area}).
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        To solve $\;x^2 + 5x = 6\;$ by factoring, the first move is to rewrite it as $\;x^2 + 5x - 6 = 0$.

        **Why does one side have to be zero?**
      `,
      model: r`
        Because zero is the only product that tells you something about its factors: if a product is zero, one of the factors must be zero.

        If two brackets multiplied to 6, they could be 1 and 6, or 2 and 3, or 12 and one half, and there would be no way to pin $x$ down. With zero on one side, each bracket gives one small equation: here $(x + 6)(x - 1) = 0$, so $x = -6$ or $x = 1$.
      `,
    },
  ],
  recap: [
    'Expanding: $(x + a)(x + b) = x^2 + (a + b)x + ab$. Every part meets every part.',
    'Factoring runs that backwards: find two numbers with the right sum and the right product.',
    'If a product is zero, one of its factors is zero. So $(x - p)(x - q) = 0$ means $x = p$ or $x = q$.',
    'Get zero on one side before you factor.',
  ],
  next: 'That completes Algebra Foundations: from one box on a scale to the roots of a parabola. The idea underneath never changed: keep both sides equal.',
};
