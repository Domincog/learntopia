// Algebra II: Functions & Growth · Lesson 4 · The Rules of Powers
import { r, num } from '../../../kit.js';

export default {
  id: 'exponents',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A power of nothing',
      text: r`
        $2^3 = 8$, $\;2^2 = 4$, $\;2^1 = 2$.

        **What should $2^0$ be?**
      `,
      shuffle: false,
      options: [
        { text: '0' },
        { text: '1', correct: true },
        { text: '2' },
        { text: 'It has no meaning' },
      ],
      explain: r`
        It is 1. Nobody simply decided that: the rules for powers leave no other choice.

        By the end of this lesson you will be able to say why, and you will also know what $2^{-1}$ and $9^{1/2}$ have to mean.
      `,
    },
    {
      id: 'count-factors',
      type: 'info',
      title: 'An exponent counts factors',
      text: r`
        $x^5$ is short for five $x$'s multiplied together. The 5 is the **exponent**: it counts the factors. The $x$ underneath is the **base**. A bare $x$ is $x^1$.

        Multiply two powers and the factors simply line up. In the picture, $x^2 \cdot x^3$ has two factors and three more: five in all.

        :::key
        To **multiply** powers of the same base, **add** the exponents: $\;x^m \cdot x^n = x^{m+n}$
        :::
      `,
      figure: {
        type: 'power-factors', op: 'times', m: 2, n: 3, rule: true, static: true,
        alt: 'Two groups of tiles in a row, each tile marked x: a group of two and a group of three, five tiles in all. Underneath: x squared times x cubed equals x to the power 2 + 3, which is x to the power 5.',
      },
    },
    {
      id: 'product',
      type: 'interact',
      title: 'Count the factors',
      text: r`
        Below, two powers of $x$ are multiplied, and every factor is written out.

        **Set the sliders so that the product is $x^7$**, without using a single $x$ on its own.
      `,
      widget: {
        type: 'power-factors', op: 'times', m: 2, n: 2, rule: 'short',
        alt: 'Two groups of tiles in a row, each tile marked x. Sliders set how many tiles each group has.',
      },
      check: (s) => {
        if (s.exponent === 7 && s.m > 1 && s.n > 1) return true;
        if (s.exponent === 7) return r`That is $x^7$, but one of the two powers is a single $x$. Find another pair.`;
        return r`That makes ${s.exponent} factors in all, which is $x^{${s.exponent}}$. You need 7.`;
      },
      solution: { m: 3, n: 4 },
      explain: r`
        $x^3 \cdot x^4 = x^7$, and $x^2 \cdot x^5$ works too. Three factors and four more make seven: the exponents add.
      `,
    },
    {
      id: 'multiply',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const b = rng.pick(['x', 'a', 'y', '2', '3', '10']);
        const m = rng.int(2, 9);
        const n = rng.intExcept(2, 9, [m]);
        const lone = rng.bool(0.35);
        const product = lone ? r`${b}^{${m}} \cdot ${b} \cdot ${b}^{${n}}` : r`${b}^{${m}} \cdot ${b}^{${n}}`;
        const total = m + n + (lone ? 1 : 0);
        return {
          text: r`
            Write the product as a single power of $${b}$.

            $$ ${product} $$
          `,
          template: r`It is $${b}$ to the power [[${total}]].`,
          hints: [lone ? r`A bare $${b}$ is one factor: it is $${b}^1$.` : 'How many factors are there in all?'],
          explain: lone
            ? r`${m} factors, one more, and ${n} more: $${product} = ${b}^{${m} + 1 + ${n}} = ${b}^{${total}}$. A bare $${b}$ counts as $${b}^1$.`
            : r`${m} factors and ${n} more: $${product} = ${b}^{${m} + ${n}} = ${b}^{${total}}$.`,
        };
      },
    },
    {
      id: 'divide-rule',
      type: 'info',
      title: 'Now divide',
      text: r`
        Here is a fraction with $x$'s above and below the bar. Each $x$ below **cancels** one above, because $\frac{x}{x} = 1$.

        In the picture, two of the five on top are cancelled, and $5 - 2 = 3$ are left.

        :::key
        To **divide** powers of the same base, **subtract** the exponents: $\;\dfrac{x^m}{x^n} = x^{m-n}$
        :::

        This needs $x \ne 0$, because nothing can be divided by zero.
      `,
      figure: {
        type: 'power-factors', op: 'over', m: 5, n: 2, rule: true, static: true,
        alt: 'A fraction made of tiles marked x: five above the bar and two below. Two pairs, one tile above and one below, are struck out, and three tiles are left on top. Underneath: x to the power 5 over x squared equals x to the power 5 - 2, which is x cubed.',
      },
    },
    {
      id: 'quotient',
      type: 'interact',
      title: 'Cancel some yourself',
      text: r`
        The same kind of fraction, with sliders. Each $x$ below the bar cancels one above.

        **Build a fraction that leaves exactly $x^4$ after cancelling**, with at least two $x$'s below the bar.
      `,
      widget: {
        type: 'power-factors', op: 'over', m: 3, n: 1, rule: 'short',
        alt: 'A fraction made of tiles marked x: some above the bar, some below. Sliders set how many. Pairs of tiles, one above and one below, are struck out.',
      },
      check: (s) => {
        if (s.top === 4 && s.n >= 2) return true;
        if (s.top === 4) return r`That leaves $x^4$, but only one $x$ is cancelled. Put at least two below the bar.`;
        if (s.top > 0) return `After cancelling, ${s.top} ${s.top === 1 ? 'factor is' : 'factors are'} left on top. You need 4.`;
        return 'Nothing is left on top. You need 4 factors left there after cancelling.';
      },
      solution: { m: 6, n: 2 },
      explain: r`
        $\dfrac{x^6}{x^2} = x^4$: two of the six were cancelled, and $6 - 2 = 4$ are left.
      `,
    },
    {
      id: 'zero-negative',
      type: 'interact',
      title: 'Past the edge',
      text: r`
        Right now top and bottom are equal. Everything cancels and the fraction is worth 1, while the rule says $x^{3-3} = x^0$. So $x^0$ has to be 1.

        Go one step further. **Build a fraction for which the rule gives a negative exponent**, and compare the rule with what is left in the picture.
      `,
      widget: {
        type: 'power-factors', op: 'over', m: 3, n: 3,
        alt: 'A fraction made of tiles marked x, three above the bar and three below, all struck out in pairs. Sliders change how many there are.',
      },
      check: (s) => {
        if (s.exponent < 0) return true;
        if (s.exponent === 0) return r`Top and bottom are equal, so the rule gives $x^0$. Put more factors below the bar than above it.`;
        return 'There are more factors above the bar, so the exponent is positive. Put more of them below.';
      },
      solution: { m: 2, n: 5 },
      explain: r`
        With 2 on top and 5 below, the rule says $x^{2-5} = x^{-3}$ and the picture shows $\dfrac{1}{x^3}$. If the rule is to keep working, those must be the same thing.
      `,
    },
    {
      id: 'zero-and-negative',
      type: 'info',
      title: 'Zero and negative exponents',
      text: r`
        If the division rule is to keep working, two new meanings are forced, for every $x$ except 0:

        :::key
        $x^0 = 1\;$ and $\;x^{-n} = \dfrac{1}{x^n}$
        :::

        Numbers tell the same story. Each step to the right lowers the exponent by 1 and **halves** the value, and the pattern has no reason to stop at $2^1$:

        | power | $2^3$ | $2^2$ | $2^1$ | $2^0$ | $2^{-1}$ | $2^{-2}$ |
        |:--|--:|--:|--:|--:|--:|--:|
        | value | $8$ | $4$ | $2$ | $1$ | $\tfrac12$ | $\tfrac14$ |

        A negative exponent does not make anything negative. It says "divide by":

        $$ 4^{-3} = \dfrac{1}{4^3} = \dfrac{1}{64} $$
      `,
    },
    {
      id: 'negative',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [b, n] = rng.pick([[2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [4, 2], [5, 2], [6, 2], [10, 2], [10, 3]]);
        const p = b ** n;
        return {
          text: r`What is $${b}^{-${n}}$?`,
          options: [
            { text: r`$\dfrac{1}{${p}}$`, correct: true },
            { text: `$-${p}$`, why: 'A negative exponent does not make the result negative. It means "one divided by".' },
            { text: `$-${b * n}$`, why: r`That is $${b} \times (-${n})$. An exponent is not a factor.` },
            { text: r`$\dfrac{1}{${b * n}}$`, why: r`The "one divided by" is right. But $${b}^{${n}}$ is $${p}$, not $${b} \times ${n}$.` },
          ],
          explain: r`$${b}^{-${n}} = \dfrac{1}{${b}^{${n}}} = \dfrac{1}{${p}}$. The minus sign in the exponent sends the power under the fraction bar.`,
        };
      },
    },
    {
      id: 'power-rule',
      type: 'info',
      title: 'A power of a power',
      text: r`
        $(x^4)^2$ means two copies of $x^4$ multiplied together. Two groups of four make eight factors: $x^8$.

        :::key
        To raise a power to a power, **multiply** the exponents: $\;(x^m)^n = x^{mn}$
        :::

        In a longer expression, use one rule at a time.

        :::example
        $\dfrac{(x^7)^2}{x^9} = \dfrac{x^{14}}{x^9} = x^{14-9} = x^5$

        First the power of a power: $7 \times 2$. Then the division: $14 - 9$.
        :::
      `,
      figure: {
        type: 'power-factors', op: 'power', m: 4, n: 2, rule: true, static: true,
        alt: 'Two groups of four tiles each, every tile marked x: eight tiles in all. Underneath: x to the power 4, squared, equals x to the power 4 times 2, which is x to the power 8.',
      },
    },
    {
      id: 'power-of-power',
      type: 'fill',
      title: 'Groups of factors',
      text: r`
        $(x^2)^3$ means three copies of $x^2$ multiplied together. Move the sliders to see other cases written out, then complete the lines.
      `,
      figure: {
        type: 'power-factors', op: 'power', m: 2, n: 3, rule: false,
        alt: 'Three groups of two tiles each, every tile marked x. Sliders change the size and the number of the groups.',
      },
      template: r`
        $(x^2)^3$ is $x$ to the power [[6]].

        $(x^4)^3$ is $x$ to the power [[12]].

        $(x^5)^{10}$ is $x$ to the power [[50]].
      `,
      hints: ['The last one is too big for the sliders. What did you do with the two numbers in the first two lines?'],
      explain: r`
        Three groups of two make six factors, and three groups of four make twelve. Ten groups of five are too many to draw, but the rule still counts them: $(x^5)^{10} = x^{50}$.
      `,
    },
    {
      id: 'simplify',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['times-over', 'power-over', 'power-times']);
        const a = rng.int(2, 6);
        const b = rng.int(2, 4);
        let expr; let e; let steps; let hint;
        if (kind === 'times-over') {
          const c = rng.intExcept(2, a + b + 3, [a + b]);
          expr = r`\dfrac{x^{${a}} \cdot x^{${b}}}{x^{${c}}}`;
          e = a + b - c;
          steps = r`\dfrac{x^{${a + b}}}{x^{${c}}} = x^{${a + b} - ${c}}`;
          hint = r`Multiply first: add the exponents on top. Then divide: subtract the exponent below.`;
        } else if (kind === 'power-over') {
          const c = rng.intExcept(2, a * b + 3, [a * b]);
          expr = r`\dfrac{(x^{${a}})^{${b}}}{x^{${c}}}`;
          e = a * b - c;
          steps = r`\dfrac{x^{${a * b}}}{x^{${c}}} = x^{${a * b} - ${c}}`;
          hint = r`Start with the power of a power: multiply ${a} by ${b}. Then divide: subtract the exponent below.`;
        } else {
          const c = rng.int(2, 6);
          expr = r`(x^{${a}})^{${b}} \cdot x^{${c}}`;
          e = a * b + c;
          steps = r`x^{${a * b}} \cdot x^{${c}} = x^{${a * b} + ${c}}`;
          hint = r`Start with the power of a power: multiply ${a} by ${b}. Then multiply the powers: add the exponents.`;
        }
        return {
          text: r`
            Write as a single power of $x$.

            $$ ${expr} $$
          `,
          template: r`It is $x$ to the power [[${e}]].`,
          hints: [hint],
          explain: r`$${expr} = ${steps} = x^{${e}}$${e < 0 ? r`, which is the same as $\dfrac{1}{${e === -1 ? 'x' : `x^{${-e}}`}}$` : e === 1 ? r`, which is just $x$` : ''}.`,
        };
      },
    },
    {
      id: 'match-root',
      type: 'interact',
      title: 'An exponent that is not a whole number',
      text: r`
        So far an exponent counted factors, forwards or backwards. What could an exponent of one half mean?

        The dashed curve is $y = \sqrt{x}$. **Slide the exponent $p$ until the blue curve $y = x^p$ lies exactly on it.**
      `,
      widget: {
        type: 'plot', x: [0, 10], y: [0, 6], xStep: 1, yStep: 1,
        params: { p: { min: 0, max: 2, step: 0.25, value: 2, label: 'exponent $p$', color: 'blue' } },
        fns: [
          { expr: 'x^p', color: 'blue' },
          { expr: 'sqrt(x)', color: 'orange', dashed: true, width: 3 },
        ],
        alt: 'The square root curve drawn dashed, and a blue curve y = x to the power p. A slider changes p from 0 to 2.',
      },
      check: (s) => {
        if (s.p === 0.5) return true;
        if (s.p === 0) return r`$x^0$ is 1 for every positive $x$: a flat line. Raise the exponent a little.`;
        if (s.p === 1) return r`$x^1$ is just $x$: a straight line, and the root curve is not straight. Try a smaller exponent.`;
        return s.p > 0.5
          ? r`Beyond $x = 1$ the blue curve is above the dashed one. Try a smaller exponent.`
          : r`Beyond $x = 1$ the blue curve is below the dashed one. Try a slightly larger exponent.`;
      },
      solution: { p: 0.5 },
      explain: r`
        With $p = \tfrac12$ the two curves agree everywhere, not only at a few points. That is no accident.
      `,
    },
    {
      id: 'half-is-root',
      type: 'info',
      title: 'One half means square root',
      text: r`
        The curves matched because $x^{1/2}$ **is** the square root of $x$. The power rule shows why:

        $$ \left(x^{1/2}\right)^2 = x^{\frac12 \times 2} = x^1 = x $$

        So $x^{1/2}$ is a number whose square is $x$, and that is what a square root is. Like $\sqrt{x}$ it needs $x \ge 0$, and it means the root that is not negative.

        :::example
        $400^{1/2} = \sqrt{400} = 20$, because $20^2 = 400$. The exponent does not halve the number: half of 400 would be 200.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 10], y: [0, 6], xStep: 1, yStep: 1,
        fns: [{ expr: 'x^0.5', color: 'blue' }],
        segments: [
          { from: [4, 0], to: [4, 2], color: 'orange', dashed: true }, { from: [4, 2], to: [0, 2], color: 'orange', dashed: true },
          { from: [9, 0], to: [9, 3], color: 'orange', dashed: true }, { from: [9, 3], to: [0, 3], color: 'orange', dashed: true },
        ],
        points: [{ x: 4, y: 2, color: 'orange' }, { x: 9, y: 3, color: 'orange' }],
        labels: [
          { x: 4, y: 2, text: '2 × 2 = 4', color: 'orange', dx: 6, dy: 22 },
          { x: 9, y: 3, text: '3 × 3 = 9', color: 'orange', dx: -6, dy: -12, anchor: 'end' },
          { x: 6.2, y: 4.6, text: 'y = √x', color: 'blue' },
        ],
        alt: 'The curve y = x to the power one half, which is the square root curve. Two points are marked: at x = 4 the height is 2, and at x = 9 the height is 3.',
      },
    },
    {
      id: 'half-power',
      type: 'choice',
      gen: (rng) => {
        const n = rng.int(3, 12);
        const sq = n * n;
        return {
          text: r`What is $${sq}^{1/2}$?`,
          options: [
            { text: `$${n}$`, correct: true },
            { text: `$${num(sq / 2)}$`, why: `That is half of ${sq}. The exponent one half does not halve the number: it asks for the number whose square is ${sq}.` },
            { text: r`$\dfrac{1}{${sq}}$`, why: r`That is $${sq}^{-1}$. A negative exponent means "one divided by"; the exponent $\frac12$ means "square root".` },
            { text: `$-${n}$`, why: r`$(-${n})^2$ is ${sq} too, but the power $\frac12$, like the root sign, means the root that is not negative.` },
          ],
          explain: r`$${sq}^{1/2} = \sqrt{${sq}} = ${n}$, because $${n}^2 = ${sq}$.`,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: r`Which of these are true for **every** positive number $x$? Select all of them.`,
      options: [
        { text: r`$x^2 \cdot x^3 = x^5$`, correct: true },
        { text: r`$(x^2)^3 = x^5$`, why: r`A power of a power **multiplies** the exponents: $(x^2)^3 = x^6$.` },
        { text: r`$x^0 = 0$`, why: r`$x^0 = 1$. Think of $\frac{x^3}{x^3}$: everything cancels and 1 is left.` },
        { text: r`$x^{-1} = \dfrac{1}{x}$`, correct: true },
        { text: r`$x^2 + x^3 = x^5$`, why: r`The rules are about multiplying powers, not adding them. Test $x = 2$: $4 + 8 = 12$, but $2^5 = 32$.` },
        { text: r`$x^{1/2} = \sqrt{x}$`, correct: true },
      ],
      explain: r`Multiplying adds the exponents, a power of a power multiplies them, $x^0$ is 1, a negative exponent means "one over", and the exponent $\frac12$ is the square root. There is no rule for **adding** powers.`,
    },
    {
      id: 'cube-root',
      type: 'numeric',
      plain: true,
      stretch: true,
      gen: (rng) => {
        const n = rng.pick([2, 3, 4, 5, 10]);
        const cube = n ** 3;
        const wrong = [[cube / 3, `That is a third of ${cube}. The exponent does not divide the number: you need the number that gives ${cube} when it is used as a factor three times.`]];
        const root = Math.round(Math.sqrt(cube));
        if (root * root === cube) wrong.push([root, r`That is the square root: $${root}^2 = ${cube}$. Here the number has to be used **three** times.`]);
        return {
          title: 'One third',
          text: r`
            The argument works for other fractions too. Whatever $x^{1/3}$ is, three of them multiplied together must give

            $$ \left(x^{1/3}\right)^3 = x^{\frac13 \times 3} = x $$

            **What is $${cube}^{1/3}$?**
          `,
          answer: n,
          wrong,
          hints: [`Which number, multiplied by itself and then by itself again, gives ${cube}?`],
          explain: r`$${n} \times ${n} \times ${n} = ${cube}$, so $${cube}^{1/3} = ${n}$. This is called the **cube root** of ${cube}.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        Someone insists that $x^0$ ought to be 0, "because there are no factors at all".

        **How would you answer?**
      `,
      model: r`
        Use the division rule. $\dfrac{x^3}{x^3}$ is a number divided by itself, which is 1, and the rule says it is $x^{3-3} = x^0$. So $x^0 = 1$.

        Or walk down the pattern $x^3, x^2, x^1$: each step divides by $x$, and one more step from $x^1$ gives $x \div x = 1$.

        "No factors" means that nothing has been multiplied in yet, and for multiplying, the starting point is 1, not 0.
      `,
    },
  ],
  recap: [
    'Multiplying powers of the same base **adds** the exponents; dividing **subtracts** them; a power of a power **multiplies** them.',
    '$x^0 = 1$, and a negative exponent means "one over": $x^{-n} = \\dfrac{1}{x^n}$ (for $x \\ne 0$).',
    '$x^{1/2}$ is the square root of $x$, because squaring it must give $x^1$.',
    'These rules are for multiplying and dividing. There is no shortcut for $x^2 + x^3$.',
  ],
  next: 'Next: put the variable in the exponent, and you get growth that doubles and doubles again.',
};
