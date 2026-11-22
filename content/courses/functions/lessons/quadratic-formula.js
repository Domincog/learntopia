// Algebra II: Functions & Growth · Lesson 7 · The Formula for Any Quadratic
import { r, num, signed, frac, gcd } from '../../../kit.js';
import { quadratic } from '../helpers.js';

/** A number as it is written inside a product: negative numbers get brackets. */
const put = (k) => (k < 0 ? `(${k})` : `${k}`);
/** A reduced fraction the way a learner types it: slash(6, 4) -> "3/2", slash(-4, 2) -> "-2". */
const slash = (n, d) => { const g = gcd(n, d) || 1; const [p, q] = d < 0 ? [-n / g, -d / g] : [n / g, d / g]; return q === 1 ? `${p}` : `${p}/${q}`; };

export default {
  id: 'quadratic-formula',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The one that will not factor',
      text: r`
        Factoring solved $x^2 + 6x + 5 = 0$: the numbers 1 and 5 have the sum 6 and the product 5. Now change one number:

        $$ x^2 + 6x + 4 = 0 $$

        No two whole numbers have the sum 6 and the product 4. **So what about solutions?**
      `,
      figure: {
        type: 'plot', x: [-8, 2], y: [-6, 6], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2 + 6x + 4', color: 'blue' }],
        alt: 'The parabola y = x squared plus 6x plus 4. Its lowest point is at (-3, -5), and it crosses the x-axis twice, between -6 and -5 and between -1 and 0.',
      },
      shuffle: false,
      options: [
        { text: 'There are none' },
        { text: 'There are two, but they are not whole numbers', correct: true },
        { text: 'There is exactly one' },
      ],
      explain: r`
        The graph crosses the $x$-axis twice, near $-5.2$ and near $-0.8$. The solutions are there. Factoring with whole numbers just cannot reach them.

        This lesson builds a method that solves **every** quadratic equation, and then packs it into one formula.
      `,
    },
    {
      id: 'undo-a-square',
      type: 'info',
      title: 'A quadratic you can already solve',
      text: r`
        When $x$ appears only inside one square, you can undo the square. Just remember that **two** numbers have the same square: $5^2 = 25$ and $(-5)^2 = 25$.

        :::example
        Solve $(x + 2)^2 = 25$.

        | Line | Why |
        |---|---|
        | $x + 2 = 5\;$ or $\;x + 2 = -5$ | both have the square 25 |
        | $x = 3\;$ or $\;x = -7$ | subtract 2 |
        :::

        So here is the plan for a stubborn quadratic: rewrite it until $x$ sits inside a single square. That is called **completing the square**.
      `,
    },
    {
      id: 'undo-square',
      type: 'fill',
      title: 'Undo a square',
      text: r`
        Solve this one the same way. Remember that two numbers have the square 9.

        $$ (x - 1)^2 = 9 $$
      `,
      template: r`
        Either $x - 1 =$ [[3]] or $x - 1 =$ [[-3]] (the positive one first).

        So $x =$ [[4]] or $x =$ [[-2]].
      `,
      explain: r`
        $x - 1$ is a number whose square is 9, so it is $3$ or $-3$. Adding 1 gives $x = 4$ or $x = -2$.
      `,
    },
    {
      id: 'complete',
      type: 'interact',
      title: 'Build the square',
      text: r`
        As a picture, $x^2 + 6x$ is a square of side $x$ next to a rectangle that is 6 wide and $x$ tall.

        **Cut the rectangle in half, then add unit squares until the whole shape is one perfect square.**
      `,
      widget: {
        type: 'complete-square', b: 6,
        alt: 'A square of side x next to a rectangle 6 wide and x tall. A button cuts the rectangle into two strips and moves one below the square; a slider adds unit squares to the corner that is left empty.',
      },
      check: (s) => {
        if (s.complete) return true;
        if (!s.split) return 'First cut the rectangle in half, so that one of the strips can move underneath the square.';
        if (s.extra > 0) return `${s.extra} too many. Only the squares that fit inside the corner belong to the big square.`;
        const missing = s.needed - s.added;
        return `The corner still has ${missing} empty ${missing === 1 ? 'place' : 'places'}. Keep adding.`;
      },
      solution: { split: true, added: 9 },
      explain: r`
        Each strip is 3 wide, so the missing corner is 3 by 3: it takes **9** unit squares.

        $$ x^2 + 6x + 9 = (x + 3)^2 $$

        Half of 6 is 3, and 3 squared is 9.
      `,
    },
    {
      id: 'halve-then-square',
      type: 'info',
      title: 'Halve, then square',
      text: r`
        The picture gives a recipe that needs no picture. To turn $x^2 + bx$ into a perfect square, **halve** the number in front of $x$, then **square** it, and add the result.

        :::example
        $x^2 + 20x$: half of 20 is 10, and $10^2 = 100$.

        $$ x^2 + 20x + 100 = (x + 10)^2 $$

        $x^2 - 20x$: half of $-20$ is $-10$, and $(-10)^2 = 100$ again.

        $$ x^2 - 20x + 100 = (x - 10)^2 $$
        :::

        With a minus sign the number added is still positive, because a square is never negative. Multiply out the bracket to check.
      `,
    },
    {
      id: 'complete-practice',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const half = rng.int(1, 9);
        const b = 2 * half;
        const minus = rng.bool();
        const sg = minus ? '-' : '+';
        return {
          text: r`
            **Complete the square.**

            Which number has to be added to $\;x^2 ${sg} ${b}x\;$, and which square do you get?
          `,
          template: r`$x^2 ${sg} ${b}x\; +$ [[${half * half}]] $= (x ${sg}$ [[${half}]] $)^2$`,
          hints: [`Halve the ${b}. Then square the result.`],
          explain: r`Half of ${b} is ${half}, and $${half}^2 = ${half * half}$. Multiply out to check: $(x ${sg} ${half})^2 = x^2 ${sg} ${b}x + ${half * half}$.${minus ? ' The number added is positive even here: a square is never negative.' : ''}`,
        };
      },
    },
    {
      id: 'solve-by-completing',
      type: 'fill',
      title: 'Now the stubborn one',
      text: r`
        Back to $x^2 + 6x + 4 = 0$. Move the 4 across: $\;x^2 + 6x = -4$.

        Now complete the square. Whatever you add on the left must be added on the right as well.
      `,
      template: r`
        Add [[9]] to both sides: $\;(x + 3)^2 =$ [[5]]

        So $x + 3 = \sqrt{5}$ or $x + 3 = -\sqrt{5}$, which gives $\;x =$ [[-3]] $\pm\, \sqrt{5}$.
      `,
      hints: [r`The left side becomes $(x + 3)^2$ when 9 is added. On the right, $-4 + 9$.`],
      explain: r`
        $x = -3 + \sqrt5 \approx -0.76$ and $x = -3 - \sqrt5 \approx -5.24$: the two crossings on the opening graph. The sign $\pm$, "plus or minus", writes both solutions in one line.

        You have met this shape before. $y = (x + 3)^2 - 5$ is the vertex form: the vertex is at $(-3, -5)$, and the two roots lie $\sqrt5$ to either side of it.
      `,
    },
    {
      id: 'derive',
      type: 'order',
      title: 'Once, with letters',
      text: r`
        Do the same steps with letters in place of the numbers, and every quadratic equation is solved at once. The five moves:

        1. Divide by $a$ and move $c$ across.
        2. Complete the square.
        3. Write the right-hand side as one fraction.
        4. Take the square root, with both signs.
        5. Get $x$ alone.

        **Put the lines in order.**
      `,
      items: [
        r`$ax^2 + bx + c = 0$`,
        r`$x^2 + \dfrac{b}{a}x = -\dfrac{c}{a}$`,
        r`$\left(x + \dfrac{b}{2a}\right)^2 = \dfrac{b^2}{4a^2} - \dfrac{c}{a}$`,
        r`$\left(x + \dfrac{b}{2a}\right)^2 = \dfrac{b^2 - 4ac}{4a^2}$`,
        r`$x + \dfrac{b}{2a} = \pm\dfrac{\sqrt{b^2 - 4ac}}{2a}$`,
        r`$x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`,
      ],
      labels: ['Start', 'Finish'],
      hints: [
        r`First make $x^2$ stand alone: divide everything by $a$, and move the constant to the right.`,
        r`Then complete the square. Half of $\frac{b}{a}$ is $\frac{b}{2a}$, and its square is $\frac{b^2}{4a^2}$.`,
        'Then tidy the right-hand side into one fraction, take the square root of both sides, and get $x$ alone.',
      ],
      explain: r`
        The square is completed by adding $\left(\frac{b}{2a}\right)^2$ to both sides: half of $\frac{b}{a}$, squared. In the last move, $\frac{b}{2a}$ is subtracted from both sides.

        Nobody does this twice. The last line is the result, and it is worth knowing by heart.
      `,
    },
    {
      id: 'formula',
      type: 'info',
      title: 'The quadratic formula',
      text: r`
        :::key
        If $\;ax^2 + bx + c = 0\;$ and $a$ is not zero, then
        $$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$
        :::

        - $a$, $b$ and $c$ are the three numbers in the equation, **with their signs**.
        - $\pm$ gives two solutions: one with plus, one with minus.
        - It works whether the quadratic factors or not.

        Try it on an old friend, $x^2 + 6x + 5 = 0$, where $a = 1$, $b = 6$, $c = 5$:

        $$ x = \frac{-6 \pm \sqrt{36 - 20}}{2} = \frac{-6 \pm 4}{2} $$

        That is $x = -1$ or $x = -5$, just as factoring said.
      `,
    },
    {
      id: 'abc',
      type: 'fill',
      gen: (rng) => {
        const a = rng.pick([1, 2, 3, 4, 5, -1, -2]);
        const b = rng.nonzero(-9, 9);
        const c = rng.nonzero(-9, 9);
        const D = b * b - 4 * a * c;
        return {
          title: 'Read off the three numbers',
          text: r`
            $$ ${quadratic(a, b, c)} = 0 $$

            Read off $a$, $b$ and $c$, signs included. Then work out the number that goes under the square root.
          `,
          template: r`
            $a =$ [[${a}]], $\;b =$ [[${b}]], $\;c =$ [[${c}]]

            $b^2 - 4ac =$ [[${D}]]
          `,
          hints: [
            r`$b^2$ is positive whatever the sign of $b$: $\;${put(b)}^2 = ${b * b}$.`,
            r`$4ac = 4 \times ${put(a)} \times ${put(c)} = ${num(4 * a * c)}$.${a * c < 0 ? ' Subtracting a negative number adds.' : ''}`,
          ],
          explain: r`$a = ${a}$, $b = ${b}$, $c = ${c}$. Then $b^2 - 4ac = ${put(b)}^2 - 4 \times ${put(a)} \times ${put(c)} = ${b * b} ${signed(-4 * a * c)} = ${num(D)}$.`,
        };
      },
    },
    {
      id: 'example-formula',
      type: 'info',
      title: 'Worked example: the formula at work',
      text: r`
        The same four moves solve every quadratic: read off, discriminant, formula, tidy.

        :::example
        Solve $6x^2 + x - 2 = 0$.

        | Line | Why |
        |---|---|
        | $a = 6$, $\;b = 1$, $\;c = -2$ | signs included |
        | $b^2 - 4ac = 1 + 48 = 49$ | minus a negative adds |
        | $x = \dfrac{-1 \pm 7}{12}$ | $\sqrt{49} = 7$, $\;2a = 12$ |
        | $x = \dfrac{6}{12} = \dfrac12$ | with plus |
        | $x = \dfrac{-8}{12} = -\dfrac23$ | with minus |
        :::
      `,
    },
    {
      id: 'use-formula',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = rng.pick([2, 3, 4, 5]);
        const r1 = rng.nonzero(-5, 5);
        let k = rng.nonzero(-9, 9);
        while (gcd(k, a) !== 1) k = rng.nonzero(-9, 9);
        // (x - r1)(ax - k) = ax² - (k + a·r1)x + k·r1, with the roots r1 and k/a
        const b = -(k + a * r1);
        const c = k * r1;
        const D = b * b - 4 * a * c;
        const root = Math.round(Math.sqrt(D));
        const lo = slash(-b - root, 2 * a);
        const hi = slash(-b + root, 2 * a);
        return {
          text: r`
            **Solve with the quadratic formula.**

            $$ ${quadratic(a, b, c)} = 0 $$

            Type a fraction with a slash, like 3/2.
          `,
          template: r`The smaller solution is $x =$ [[${lo}]] and the larger one is $x =$ [[${hi}]].`,
          hints: [
            r`Here $a = ${a}$, $b = ${b}$ and $c = ${c}$. Start with $b^2 - 4ac$.`,
            r`$b^2 - 4ac = ${num(D)}$, and $\sqrt{${D}} = ${root}$. So $x = \dfrac{${num(-b)} \pm ${root}}{${2 * a}}$.`,
          ],
          explain: r`
            $b^2 - 4ac = ${b * b} ${signed(-4 * a * c)} = ${D}$, and $\sqrt{${D}} = ${root}$:

            $$ x = \frac{${num(-b)} \pm ${root}}{${2 * a}} $$

            With the minus sign, $x = \frac{${num(-b - root)}}{${2 * a}} = ${frac(-b - root, 2 * a)}$. With the plus sign, $x = \frac{${num(-b + root)}}{${2 * a}} = ${frac(-b + root, 2 * a)}$.
          `,
        };
      },
    },
    {
      id: 'set-up',
      type: 'choice',
      review: true,
      gen: (rng) => {
        let a; let b; let c; let D; let slip;
        do {
          a = rng.pick([1, 1, 2, 3]);
          b = rng.nonzero(-9, 9);
          c = rng.nonzero(-7, 7);
          D = b * b - 4 * a * c;
          slip = b * b + 4 * a * c;       // the discriminant with the sign of 4ac wrong
        } while (D <= 0 || slip <= 0 || Number.isInteger(Math.sqrt(D)));
        const lo = (-b - Math.sqrt(D)) / (2 * a);
        const hi = (-b + Math.sqrt(D)) / (2 * a);
        return {
          title: 'Roots that are not whole',
          text: r`
            $$ ${quadratic(a, b, c)} = 0 $$

            **Which line is the quadratic formula with the right numbers put in?**
          `,
          columns: 1,
          options: [
            { text: r`$x = \dfrac{${num(-b)} \pm \sqrt{${D}}}{${2 * a}}$`, correct: true },
            { text: r`$x = \dfrac{${num(b)} \pm \sqrt{${D}}}{${2 * a}}$`, why: r`The formula starts with $-b$. Here $b = ${b}$, so $-b = ${num(-b)}$.` },
            { text: r`$x = \dfrac{${num(-b)} \pm \sqrt{${slip}}}{${2 * a}}$`, why: r`Under the root goes $b^2 - 4ac = ${b * b} - ${put(4 * a * c)} = ${D}$. Watch the signs.` },
            { text: r`$x = ${num(-b)} \pm \dfrac{\sqrt{${D}}}{${2 * a}}$`, why: r`The whole top, the $-b$ included, is divided by $2a$.` },
          ],
          hints: [r`$a = ${a}$, $b = ${b}$, $c = ${c}$. Work out $-b$, then $b^2 - 4ac$, then $2a$.`],
          explain: r`With $a = ${a}$, $b = ${b}$ and $c = ${c}$: $\;-b = ${num(-b)}$, $\;b^2 - 4ac = ${b * b} ${signed(-4 * a * c)} = ${D}$ and $2a = ${2 * a}$. Since ${D} is not a perfect square, the solutions are not whole numbers or fractions: they are about $${num(lo, 2)}$ and $${num(hi, 2)}$.`,
        };
      },
    },
    {
      id: 'discriminant',
      type: 'interact',
      title: 'How many solutions?',
      text: r`
        The number under the root, $b^2 - 4ac$, has a name: the **discriminant**. This is $\;y = x^2 + 4x + \orange{c}$.

        **Slide $c$ until the parabola just touches the $x$-axis**, and keep an eye on the discriminant.
      `,
      widget: {
        type: 'plot', x: [-7, 3], y: [-5, 8], xStep: 1, yStep: 2,
        params: { c: { min: -1, max: 8, step: 1, value: 1, label: '$c$', color: 'orange' } },
        fns: [{ expr: 'x^2 + 4x + c', color: 'blue' }],
        readouts: [{ label: 'discriminant $b^2 - 4ac$', expr: '16 - 4c', digits: 0, color: 'orange' }],
        alt: 'The parabola y = x squared plus 4x plus c. A slider for c moves it up and down, and a readout shows the discriminant 16 minus 4c.',
      },
      check: (s) => {
        if (s.c === 4) return true;
        const D = 16 - 4 * s.c;
        return s.c < 4
          ? `The parabola crosses the axis twice, and the discriminant is ${D}: positive. Raise the curve.`
          : `The parabola floats above the axis and never meets it, and the discriminant is $${D}$: negative. Lower the curve.`;
      },
      solution: { c: 4 },
      explain: r`
        At $c = 4$ the discriminant is $16 - 16 = 0$, and the curve touches the axis at one point. Below that it crossed the axis twice, and above it the curve missed the axis altogether.
      `,
    },
    {
      id: 'count-solutions',
      type: 'info',
      title: 'The discriminant counts the solutions',
      text: r`
        The formula adds and subtracts $\sqrt{b^2 - 4ac}$, so the sign of the discriminant decides how many solutions there are.

        | Discriminant | Solutions | The parabola |
        |---|---|---|
        | [positive]{.orange} | two: one with plus, one with minus | crosses the axis twice |
        | [zero]{.blue} | one: plus 0 and minus 0 agree | touches the axis |
        | [negative]{.violet} | none: no square root on the number line | misses the axis |

        :::example
        $5x^2 + 2x + 1 = 0$ has $b^2 - 4ac = 4 - 20 = -16$. Negative: no solution.
        :::
      `,
      figure: {
        type: 'plot', x: [-7, 3], y: [-5, 8], xStep: 1, yStep: 2,
        fns: [
          { expr: 'x^2 + 4x + 1', color: 'orange' },
          { expr: 'x^2 + 4x + 4', color: 'blue' },
          { expr: 'x^2 + 4x + 7', color: 'violet' },
        ],
        labels: [
          { x: -2, y: -3, text: '12: two', color: 'orange', anchor: 'middle', dy: 24 },
          { x: -2, y: -1.5, text: '0: one', color: 'blue', anchor: 'middle', dy: 5 },
          { x: -2, y: 1.8, text: '−12: none', color: 'violet', anchor: 'middle', dy: 5 },
        ],
        alt: 'Three parabolas of the same shape, one above the other, each labelled with its discriminant. The lowest, with discriminant 12, crosses the x-axis twice. The middle one, with discriminant 0, touches the axis at one point. The highest, with discriminant -12, stays above the axis.',
      },
    },
    {
      id: 'how-many',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['two', 'one', 'none']);
        let a; let b; let c;
        if (kind === 'one') {
          const p = rng.int(1, 3);
          const q = rng.nonzero(-5, 5);
          [a, b, c] = [p * p, 2 * p * q, q * q];
        } else {
          do {
            a = rng.int(1, 4);
            b = rng.nonzero(-9, 9);
            c = rng.nonzero(-9, 9);
          } while (kind === 'two' ? b * b - 4 * a * c <= 0 : b * b - 4 * a * c >= 0);
        }
        const D = b * b - 4 * a * c;
        const rule = D > 0 ? 'A positive discriminant gives two solutions: one with plus the root, one with minus.'
          : D === 0 ? 'When the discriminant is zero, plus and minus give the same answer: one solution.'
            : 'A negative number has no square root on the number line, so there is no solution.';
        const why = `Work out the discriminant: it is $${D}$. ${rule}`;
        return {
          title: 'Count before you solve',
          text: r`
            **How many solutions does this equation have** on the number line?

            $$ ${quadratic(a, b, c)} = 0 $$
          `,
          shuffle: false,
          options: [
            { text: 'Two', correct: kind === 'two', why: kind === 'two' ? undefined : why },
            { text: 'One', correct: kind === 'one', why: kind === 'one' ? undefined : why },
            { text: 'None', correct: kind === 'none', why: kind === 'none' ? undefined : why },
          ],
          hints: [r`You only need the **sign** of $b^2 - 4ac$.`],
          explain: r`$b^2 - 4ac = ${put(b)}^2 - 4 \times ${a} \times ${put(c)} = ${b * b} ${signed(-4 * a * c)} = ${num(D)}$. ${rule}`,
        };
      },
    },
    {
      id: 'balcony',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const v = rng.pick([5, 10, 15, 20]);
        const h0 = rng.pick([2, 3, 4, 6, 8]);
        const D = v * v + 20 * h0;
        const t = (v + Math.sqrt(D)) / 10;
        const other = (v - Math.sqrt(D)) / 10;
        return {
          title: 'A throw from a balcony',
          text: r`
            A ball is thrown upwards from a balcony. After $t$ seconds its height above the ground, in metres, is

            $$ h = ${quadratic(-5, v, h0, 't')} $$

            **After how many seconds does it hit the ground?** Give the time to one decimal place.
          `,
          answer: t,
          tolerance: 0.05,
          display: num(t, 1),
          unit: 's',
          wrong: [
            [other, 'That solution is negative: a time before the throw. Take the other one.'],
            [v / 5, `That is when the ball is back at the height of the balcony. It still has ${h0} m to fall.`],
          ],
          hints: [
            r`On the ground $h = 0$. That is a quadratic equation in $t$, with $a = -5$, $b = ${v}$ and $c = ${h0}$.`,
            r`$b^2 - 4ac = ${v * v} + ${20 * h0} = ${D}$, so $t = \dfrac{-${v} \pm \sqrt{${D}}}{-10}$.`,
            `No calculator to hand? You can type the calculation itself as your answer: (${v} + sqrt(${D}))/10`,
          ],
          explain: r`
            Set $h = 0$ and use the formula with $a = -5$, $b = ${v}$, $c = ${h0}$:

            $$ t = \frac{-${v} \pm \sqrt{${D}}}{-10} $$

            The two solutions are $t \approx ${num(other, 2)}$ and $t \approx ${num(t, 2)}$. A negative time lies before the throw, so the ball lands after about **${num(t, 1)} seconds**.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        The formula can be split into two parts:

        $$ x = -\frac{b}{2a} \;\pm\; \frac{\sqrt{b^2 - 4ac}}{2a} $$

        **What does each part tell you about the parabola $y = ax^2 + bx + c$?**
      `,
      model: r`
        The first part, $-\frac{b}{2a}$, is the middle: the $x$ of the vertex, where the parabola's line of symmetry is.

        The second part is how far the two roots lie from that middle, the same distance to the left and to the right, because a parabola is symmetric.

        If the discriminant is zero the distance is zero, and the two roots merge at the vertex. If it is negative there is no such distance: the parabola never reaches the axis.
      `,
    },
  ],
  recap: [
    'Completing the square: $x^2 + bx$ becomes a perfect square when you add $\\left(\\frac{b}{2}\\right)^2$. Halve, then square.',
    'The quadratic formula solves every equation $ax^2 + bx + c = 0$: $\\;x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.',
    'The discriminant $b^2 - 4ac$ counts the solutions: positive, two; zero, one; negative, none.',
    'Factoring is quicker when it works. The formula works always.',
  ],
  next: 'That completes Algebra II: Functions & Growth. You can read a function as a rule, a table or a graph, move its graph around, tell adding from multiplying, undo a power with a logarithm, and solve any quadratic. Calculus picks up from here: it asks how fast a function is changing.',
};
