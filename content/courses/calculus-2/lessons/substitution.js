// Calculus II: The Toolkit · Lesson 4 · Undoing the Chain Rule
import { r, num, frac } from '../../../kit.js';
import { code } from '../helpers.js';

/** "Which substitution?" Each integrand has an inside function standing next to its own derivative. */
const INSIDES = [
  {
    tex: r`3x^2\,(x^3 + 5)^4`, u: r`x^3 + 5`, after: r`u^4`,
    wrong: [
      [r`3x^2`, r`$3x^2$ is the *derivative* of the inside. It is the part that turns into $du$. The inside itself is $x^3 + 5$.`],
      [r`x^2`, r`Then $du = 2x\,dx$, and that is not what stands next to the bracket. Look for the function that is *inside* another one.`],
    ],
  },
  {
    tex: r`2x\,e^{x^2}`, u: r`x^2`, after: r`e^u`,
    wrong: [
      [r`2x`, r`$2x$ is the *derivative* of the inside. It is the part that turns into $du$. The inside itself is the exponent, $x^2$.`],
      [r`e^x`, r`There is no $e^x$ in this integral. The exponent is $x^2$, and that is the inside.`],
    ],
  },
  {
    tex: r`\cos x\,\sin^4 x`, u: r`\sin x`, after: r`u^4`, note: r`Here $\sin^4 x$ is shorthand for $(\sin x)^4$, as in *Trigonometry*.`,
    wrong: [
      [r`\cos x`, r`$\cos x$ is the *derivative* of the inside. It is the part that turns into $du$. The inside is the thing raised to the fourth power, $\sin x$.`],
      [r`x^4`, r`There is no $x^4$ here. The fourth power is applied to $\sin x$, so $\sin x$ is the inside.`],
    ],
  },
  {
    tex: r`2x\cos(x^2)`, u: r`x^2`, after: r`\cos u`,
    wrong: [
      [r`2x`, r`$2x$ is the *derivative* of the inside. It is the part that turns into $du$. The inside itself is $x^2$.`],
      [r`\cos x`, r`There is no $\cos x$ in this integral. The cosine is of $x^2$, and that is the inside.`],
    ],
  },
  {
    tex: r`(2x + 3)(x^2 + 3x)^5`, u: r`x^2 + 3x`, after: r`u^5`,
    wrong: [
      [r`2x + 3`, r`$2x + 3$ is the *derivative* of the inside. It is the part that turns into $du$. The inside is the thing raised to the fifth power.`],
      [r`x^2`, r`Then $du = 2x\,dx$, but what stands in front of the bracket is $2x + 3$. That is the derivative of the whole of $x^2 + 3x$.`],
    ],
  },
];

/**
 * Integrands that came straight from the chain rule, with the antiderivative that is pinned down by its value at 0.
 * `split` is what you get by integrating the two factors separately (a common slip).
 */
const REVERSED = [
  ...[1, 2, 3].flatMap((c) => [2, 3].map((n) => ({
    fTex: `${2 * (n + 1)}x\\,(x^2 + ${c})^{${n}}`, F: `(x^2 + ${c})^${n + 1}`, FTex: `(x^2 + ${c})^{${n + 1}}`, at0: `${c ** (n + 1)}`,
    uTex: `x^2 + ${c}`, duTex: '2x', outer: `${n + 1}u^{${n}}`, outerF: `u^{${n + 1}}`,
    split: `${n + 1}*x^2*(x^2 + ${c})^${n + 1}/${n + 1}`,
  }))),
  ...[2, 3].map((k) => ({
    fTex: `${k}x${k === 2 ? '' : '^2'}\\cos(x^${k})`, F: `sin(x^${k})`, FTex: `\\sin(x^${k})`, at0: '0',
    uTex: `x^${k}`, duTex: `${k}x${k === 2 ? '' : '^2'}`, outer: '\\cos u', outerF: '\\sin u',
    split: `x^${k}*sin(x^${k})`,
  })),
  ...[2, 3].map((k) => ({
    fTex: `${k}x${k === 2 ? '' : '^2'}\\,e^{x^${k}}`, F: `e^(x^${k})`, FTex: `e^{x^${k}}`, at0: '1',
    uTex: `x^${k}`, duTex: `${k}x${k === 2 ? '' : '^2'}`, outer: 'e^u', outerF: 'e^u',
    split: `x^${k}*e^(x^${k})`,
  })),
  ...[2, 3, 4].map((n) => ({
    fTex: `${n + 1}\\sin^${n} x\\,\\cos x`, F: `sin(x)^${n + 1}`, FTex: `\\sin^${n + 1} x`, at0: '0',
    uTex: '\\sin x', duTex: '\\cos x', outer: `${n + 1}u^{${n}}`, outerF: `u^{${n + 1}}`,
    split: `sin(x)^${n + 1}*sin(x)`,
  })),
];

/**
 * Integrands that are short of a constant factor: the antiderivative is `top` divided by `den`.
 * `inU` is the integrand after the substitution, `mid` its antiderivative in u, `check` the derivative of the answer.
 */
const SHORT = [
  ...[1, 2, 3, 5].flatMap((a) => [2, 3, 4].map((n) => ({
    fTex: `x\\,(x^2 + ${a})^{${n}}`, top: `(x^2 + ${a})^{${n + 1}}`, den: 2 * (n + 1), uTex: `x^2 + ${a}`, du: '2x', have: 'x', part: '\\tfrac12',
    inU: `\\tfrac12 u^{${n}}`, mid: `\\tfrac12 \\cdot \\dfrac{u^{${n + 1}}}{${n + 1}}`,
    check: `\\dfrac{${n + 1}(x^2 + ${a})^{${n}} \\times 2x}{${2 * (n + 1)}} = x\\,(x^2 + ${a})^{${n}}`,
  }))),
  ...[1, 2, 4].flatMap((a) => [2, 3].map((n) => ({
    fTex: `x^2\\,(x^3 + ${a})^{${n}}`, top: `(x^3 + ${a})^{${n + 1}}`, den: 3 * (n + 1), uTex: `x^3 + ${a}`, du: '3x^2', have: 'x^2', part: '\\tfrac13',
    inU: `\\tfrac13 u^{${n}}`, mid: `\\tfrac13 \\cdot \\dfrac{u^{${n + 1}}}{${n + 1}}`,
    check: `\\dfrac{${n + 1}(x^3 + ${a})^{${n}} \\times 3x^2}{${3 * (n + 1)}} = x^2\\,(x^3 + ${a})^{${n}}`,
  }))),
  ...[2, 3, 4, 5].map((k) => ({
    fTex: `\\cos(${k}x)`, top: `\\sin(${k}x)`, den: k, uTex: `${k}x`, du: `${k}`, have: '', part: `\\tfrac1${k}`,
    inU: `\\tfrac1${k}\\cos u`, mid: `\\tfrac1${k}\\sin u`, check: `\\dfrac{\\cos(${k}x) \\times ${k}}{${k}} = \\cos(${k}x)`,
  })),
  ...[2, 3, 4, 5].map((k) => ({
    fTex: `e^{${k}x}`, top: `e^{${k}x}`, den: k, uTex: `${k}x`, du: `${k}`, have: '', part: `\\tfrac1${k}`,
    inU: `\\tfrac1${k}e^u`, mid: `\\tfrac1${k}e^u`, check: `\\dfrac{e^{${k}x} \\times ${k}}{${k}} = e^{${k}x}`,
  })),
];

/** Definite integrals of g'(x)·g(x)^n with tidy answers, and with the two classic slips giving different numbers. */
const DEFINITE = [];
for (const fam of [
  { g: (x, c) => x * x + c, gTex: (c) => `x^2 + ${c}`, dTex: '2x', cs: [1, 2, 3] },
  { g: (x, c) => x * x * x + c, gTex: (c) => `x^3 + ${c}`, dTex: '3x^2', cs: [1, 2] },
]) {
  for (const c of fam.cs) for (const n of [1, 2, 3]) for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    const lo = fam.g(a, c);
    const hi = fam.g(b, c);
    const answer = (hi ** (n + 1) - lo ** (n + 1)) / (n + 1);
    const oldLimits = (b ** (n + 1) - a ** (n + 1)) / (n + 1);
    const topOnly = hi ** (n + 1) / (n + 1);
    const tidy = Number.isInteger(answer * 4) && answer <= 700;
    if (tidy && new Set([answer, oldLimits, topOnly].map((v) => v.toFixed(6))).size === 3) {
      DEFINITE.push({ gTex: fam.gTex(c), dTex: fam.dTex, n, a, b, lo, hi, answer, oldLimits, topOnly });
    }
  }
}

export default {
  id: 'substitution',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Which one is easy?',
      text: r`
        An integral sign without limits asks for an **antiderivative**: a function whose
        derivative is the thing under the sign.

        Here are two such integrals. One can be finished in a single line. For the other you
        would have to multiply out the bracket first.

        **Which do you think is the one-liner?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: r`$\displaystyle\int (x^2 + 1)^3\,dx$` },
        { text: r`$\displaystyle\int 2x\,(x^2 + 1)^3\,dx$`, correct: true },
      ],
      explain: r`
        The second one, even though it looks more complicated.

        The extra factor $2x$ is the derivative of the inside, $x^2 + 1$. That is exactly the
        mark the chain rule leaves behind when it differentiates something, so this integrand
        is a derivative waiting to be recognised. By the end of the lesson you will do it in your head.
      `,
    },
    {
      id: 'teach-backwards',
      type: 'info',
      title: 'Integrals without limits',
      text: r`
        In *Calculus in Pictures* an antiderivative was the key to every exact area. An
        integral sign without limits is the way to write "find an antiderivative":

        :::key
        $$ \int f(x)\,dx = F(x) + C $$

        means that $F$ is an antiderivative of $f$: $\;F'(x) = f(x)$.
        :::

        :::example
        $\displaystyle\int 3x^2\,dx = x^3 + C$, because $x^3$ has derivative $3x^2$.
        :::

        The $+\,C$ stands for any constant: adding a number changes no slope, so a whole
        family of functions has this derivative.

        Every rule for differentiating can be read backwards like this. Now for the **chain rule**.
      `,
    },
    {
      id: 'forward',
      type: 'expr',
      title: 'Forwards first',
      text: r`
        Before running the chain rule backwards, run it forwards once more. The recipe from
        Lesson 1: differentiate the outside with the inside left alone, then multiply by the
        derivative of the inside.

        **Differentiate $\;y = (x^2 + 1)^4$.**
      `,
      prefix: r`$\dfrac{dy}{dx} =$`,
      answer: '8*x*(x^2 + 1)^3',
      display: '8x(x^2 + 1)^3',
      vars: ['x'],
      wrong: [
        ['4*(x^2 + 1)^3', r`That is the outside alone. Multiply by the derivative of the inside, $2x$.`],
        ['4*(2*x)^3', r`Leave the inside as it is while you differentiate the outside, then multiply by $2x$.`],
      ],
      hints: [r`Outside: $u^4$ gives $4u^3$. Inside: $x^2 + 1$ gives $2x$.`],
      explain: r`
        $4(x^2 + 1)^3 \times 2x = 8x\,(x^2 + 1)^3$.

        Look at the shape of the result: the inside, $x^2 + 1$, is still there, and next to it
        stands its own derivative (times a number). Remember that shape.
      `,
    },
    {
      id: 'reverse',
      type: 'choice',
      title: 'Now backwards',
      text: r`
        You have just shown that $(x^2 + 1)^4$ has derivative $8x\,(x^2 + 1)^3$.

        **So which of these has derivative $2x\,(x^2 + 1)^3$,** a quarter as much?
      `,
      columns: 1,
      options: [
        { text: r`$\tfrac14 (x^2 + 1)^4$`, correct: true },
        { text: r`$(x^2 + 1)^4$`, why: r`Its derivative is $8x\,(x^2 + 1)^3$: four times too big.` },
        { text: r`$x^2 \cdot \tfrac14 (x^2 + 1)^4$`, why: r`That integrates the two factors separately. Differentiate it to check: the product rule gives two terms, not $2x\,(x^2 + 1)^3$.` },
        { text: r`$6x\,(x^2 + 1)^2$`, why: r`That differentiates the bracket again. You are looking for the function this *came from*.` },
      ],
      hints: ['A quarter of the derivative comes from a quarter of the function.'],
      explain: r`
        Check by differentiating: $\tfrac14 \times 4(x^2 + 1)^3 \times 2x = 2x\,(x^2 + 1)^3$. So

        $$ \begin{aligned} &\int 2x\,(x^2 + 1)^3\,dx \\[4pt] &= \tfrac14 (x^2 + 1)^4 + C \end{aligned} $$

        That is the "one-liner" from the start, with its $+\,C$ for the whole family.
      `,
    },
    {
      id: 'tune',
      type: 'interact',
      title: 'Guess, differentiate, adjust',
      text: r`
        Try $\displaystyle\int x\,(x^2 + 1)^2\,dx$. The inside is $x^2 + 1$, so a sensible guess is
        $F(x) = \dfrac{(x^2 + 1)^3}{n}$ for some number $n$.

        The [blue]{.blue} curve is your guess, the [orange]{.orange} curve is its **slope**, and the dashed curve is the integrand.

        **Choose $n$ so that the slope of your guess lands exactly on the integrand.**
      `,
      widget: {
        type: 'plot', x: [-1.2, 1.2], y: [-8, 10], xStep: 0.5, yStep: 2,
        params: { n: { min: 1, max: 9, step: 1, value: 2, label: 'divide by $n$', color: 'blue' } },
        fns: [
          { expr: '(x^2 + 1)^3 / n', color: 'blue' },
          { expr: 'x*(x^2 + 1)^2', color: 'gray', dashed: true },
          { expr: 'd0(x)', color: 'orange' },
        ],
        readouts: [
          { label: 'slope of your guess at $x = 1$', expr: 'd0(1)', digits: 2, color: 'orange' },
          { label: 'integrand at $x = 1$', expr: 'f1(1)', digits: 2 },
        ],
        alt: 'Three curves: your guess, a U-shaped curve that gets flatter as n grows; its slope, drawn in orange; and the integrand, drawn dashed. A slider sets n.',
      },
      check: (s) => {
        if (s.n === 6) return true;
        return s.n < 6
          ? `With n = ${s.n} the slope of your guess at x = 1 is ${num(24 / s.n, 2)}, but the integrand there is 4. The guess is too steep: divide by more.`
          : `With n = ${s.n} the slope of your guess at x = 1 is ${num(24 / s.n, 2)}, but the integrand there is 4. Now the guess is too flat: divide by less.`;
      },
      solution: { n: 6 },
      hints: [r`Differentiate the guess: $\dfrac{3(x^2 + 1)^2 \times 2x}{n}$. Which $n$ leaves exactly $x\,(x^2 + 1)^2$?`],
      explain: r`
        $n = 6$: the derivative of $\dfrac{(x^2 + 1)^3}{6}$ is $\dfrac{3(x^2 + 1)^2 \times 2x}{6} = x\,(x^2 + 1)^2$.

        Guess, differentiate, adjust the constant. However you find an antiderivative, you can
        always **check it by differentiating**. Make that a habit.
      `,
    },
    {
      id: 'pattern',
      type: 'info',
      title: 'Substitution',
      text: r`
        The shape to look for is **an inside function standing next to its own derivative**:

        $$ \int f\big(g(x)\big)\,g'(x)\,dx $$

        The bookkeeping is called **substitution**. Give the inside a name, $u = g(x)$. Then
        $\dfrac{du}{dx} = g'(x)$, which is written $du = g'(x)\,dx$, and everything turns into $u$:

        :::example
        $\displaystyle\int 2x\,(x^2 + 1)^3\,dx \qquad u = x^2 + 1, \quad du = 2x\,dx$

        $\displaystyle = \int u^3\,du = \tfrac14 u^4 + C = \tfrac14 (x^2 + 1)^4 + C$
        :::

        Three moves: **name the inside**, **integrate in $u$**, **put the inside back**.
      `,
    },
    {
      id: 'choose-u',
      type: 'choice',
      gen: (rng) => {
        const item = rng.pick(INSIDES);
        return {
          text: r`**Which substitution turns this into a one-line integral?** $$ \int ${item.tex}\,dx $$` + (item.note ? `\n\n${item.note}` : ''),
          options: [
            { text: `$u = ${item.u}$`, correct: true },
            ...item.wrong.map(([u, why]) => ({ text: `$u = ${u}$`, why })),
          ],
          hints: ['Look for a function sitting inside another one, whose derivative is also there as a factor.'],
          explain: r`With $u = ${item.u}$ the other factor is exactly $\dfrac{du}{dx}$, so the integral becomes $\displaystyle\int ${item.after}\,du$.`,
        };
      },
    },
    {
      id: 'do-sub',
      type: 'fill',
      title: 'One from start to finish',
      text: r`
        Work through $\displaystyle\int 2x\cos(x^2)\,dx$.

        You will need the last lesson, read backwards: $\sin u$ has derivative $\cos u$, and $\cos u$ has derivative $-\sin u$.
      `,
      template: r`
        Name the inside: $u =$ [[*x²|2x|cos x]], so that $du =$ [[x² dx|*2x dx|cos x dx]].

        Integrate in $u$: $\;\displaystyle\int \cos u\,du =$ [[*sin u|−sin u|cos u]] $+\,C$.

        Put the inside back: [[sin(2x)|*sin(x²)|cos(x²)]] $+\,C$.

        Check by differentiating: the chain rule gives $\cos(x^2) \times$ [[2]] $x$.
      `,
      hints: [r`Which function has derivative $\cos u$? Sine goes to cosine, so an antiderivative of $\cos u$ is $\sin u$.`],
      explain: r`
        $u = x^2$, $du = 2x\,dx$, and $\displaystyle\int \cos u\,du = \sin u + C = \sin(x^2) + C$.

        The check: differentiating $\sin(x^2)$ gives $\cos(x^2) \times 2x$, which is the integrand.
      `,
    },
    {
      id: 'example-condition',
      type: 'info',
      title: 'A number in front, and a condition',
      text: r`
        A number in front of the integrand goes along into the integral in $u$. And when you
        are told one value of $F$, as in *Calculus in Pictures*, it fixes the constant.

        :::example
        Find the antiderivative $F$ of $f(x) = \mathord{6x\,(x^2 + 5)^2}$ that has $\mathord{F(0) = 125}$.

        1. Name the inside: $u = x^2 + 5$, so $\mathord{du = 2x\,dx}$.
        2. Rewrite: $6x\,dx = \mathord{3 \times 2x\,dx} = 3\,du$, so the integral is $\displaystyle\int 3u^2\,du$.
        3. Integrate in $u$: $u^3 + C$.
        4. Put the inside back: $F(x) = \mathord{(x^2 + 5)^3 + C}$.
        5. Use the condition: $F(0) = \mathord{125 + C}$ must be 125, so $\mathord{C = 0}$.
        :::

        The inside can be a sine as well. In $6\sin^5 x\,\cos x$ take $u = \sin x$, so $du = \cos x\,dx$:
        the integral is $\displaystyle\int 6u^5\,du = u^6 + C$, which is $\sin^6 x + C$.
        And when the outside is $e^u$, remember that $e^u$ is its own antiderivative.
      `,
    },
    {
      id: 'antiderivative',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const item = rng.pick(REVERSED);
        return {
          text: r`
            Find the antiderivative $F$ of

            $$ f(x) = ${item.fTex} $$

            that has $F(0) = ${item.at0}$. The condition fixes the constant, so your answer has no $+\,C$.

            Type functions with brackets, like ${code('sin(x^2)')} or ${code('e^(x^2)')}.
          `,
          prefix: r`$F(x) =$`,
          answer: item.F,
          vars: ['x'],
          wrong: [
            [item.split, r`That integrates the two factors separately, which does not work. Differentiate your answer to see: the product rule gives two terms.`],
            [`${item.F} + 1`, r`The shape is right. Now check the condition: $F(0)$ must be $${item.at0}$.`],
            [`${item.F} - 1`, r`The shape is right. Now check the condition: $F(0)$ must be $${item.at0}$.`],
          ],
          hints: [
            r`Look for the inside: $u = ${item.uTex}$. Its derivative, $${item.duTex}$, is there as a factor.`,
            r`In terms of $u$ the integral is $\displaystyle\int ${item.outer}\,du = ${item.outerF} + C$. Now put the inside back.`,
          ],
          explain: r`
            With $u = ${item.uTex}$ and $du = ${item.duTex}\,dx$ the integral becomes $\displaystyle\int ${item.outer}\,du = ${item.outerF} + C$.

            So $F(x) = ${item.FTex} + C$, and $F(0) = ${item.at0}$ needs $C = 0$: $\;F(x) = ${item.FTex}$.
            Check by differentiating: the chain rule gives back $${item.fTex}$.
          `,
        };
      },
    },
    {
      id: 'example-missing-factor',
      type: 'info',
      title: 'Supply a number, pay it back',
      text: r`
        Often the derivative of the inside is there only up to a constant factor. A number
        can be supplied and paid back.

        :::example
        $\displaystyle\int x\,(x^2 + 9)^5\,dx$

        1. Inside: $u = x^2 + 9$, so $du = 2x\,dx$.
        2. The integrand offers only $x\,dx$. That is half of $du$: $\;x\,dx = \tfrac12\,du$.
        3. Integrate in $u$: $\displaystyle\int \tfrac12 u^5\,du = \mathord{\tfrac12 \cdot \dfrac{u^6}{6} + C}$, which is $\mathord{\dfrac{u^6}{12} + C}$.
        4. Put the inside back: $\dfrac{(x^2 + 9)^6}{12} + C$.
        :::

        In the same way $\displaystyle\int e^{7x}\,dx = \dfrac{e^{7x}}{7} + C$: with $u = 7x$, $\,dx$ is $\tfrac17\,du$.

        Only a *number* can be supplied like this. A missing *function of $x$* cannot:
        $\displaystyle\int (x^2 + 9)^5\,dx$ has no $x$ to turn into $du$, so substitution does not help there.
      `,
    },
    {
      id: 'factor',
      type: 'fill',
      review: true,
      title: 'When a number is missing',
      gen: (rng) => {
        const item = rng.pick(SHORT);
        return {
          text: r`
            Often the derivative of the inside is there only up to a constant factor. That is
            no obstacle: a number can be supplied and paid back.

            Here $u = ${item.uTex}$ has $du = ${item.du}\,dx$. The integrand only offers $${item.have ? `${item.have}\\,` : ''}dx$, which is $${item.part}\,du$.
          `,
          template: r`$\displaystyle\int ${item.fTex}\,dx \;=\; ${item.top} \;\div$ [[${item.den}]] $\;+\;C$`,
          hints: [
            r`In terms of $u$ the integral is $\displaystyle\int ${item.inU}\,du$.`,
            'Whatever number you choose, you can test it: differentiate your answer and see whether the integrand comes back.',
          ],
          explain: r`
            $\displaystyle\int ${item.fTex}\,dx = \int ${item.inU}\,du = ${item.mid} + C = \dfrac{${item.top}}{${item.den}} + C$.

            Check by differentiating: $\;${item.check}$.
          `,
        };
      },
    },
    {
      id: 'limits',
      type: 'fill',
      title: 'Limits change too',
      text: r`
        A definite integral gives an area, and substitution turns it into a *different* region
        with the *same* area. Here $u = x^2 + 1$.

        The [blue]{.blue} region is under $2x\,(x^2 + 1)^3$, with $x$ from 0 to $b$. The
        [orange]{.orange} one is under $u^3$, with $u$ from 1 to $b^2 + 1$. **Slide $b$ and compare the areas.**

        (A reminder from *Calculus in Pictures*: the area from $a$ to $b$ is $F(b) - F(a)$, where $F$ is an antiderivative.)
      `,
      figure: {
        type: 'plot', x: [0, 2.4], y: [0, 17], xStep: 0.5, yStep: 4,
        params: { b: { min: 0, max: 1, step: 0.1, value: 0.5, label: 'upper limit $b$', color: 'blue' } },
        fns: [{ expr: '2x*(x^2 + 1)^3', from: 0, to: 1, color: 'blue' }, { expr: 'x^3', from: 1, to: 2.2, color: 'orange' }],
        areas: [{ fn: 0, from: 0, to: 'b', color: 'blue' }, { fn: 1, from: 1, to: 'b^2 + 1', color: 'orange' }],
        readouts: [
          { label: 'blue area', expr: 'I0(0, b)', digits: 3, color: 'blue' },
          { label: 'orange area', expr: 'I1(1, b^2 + 1)', digits: 3, color: 'orange' },
        ],
        alt: 'Two curves on the same axes. A steep blue curve from 0 to 1 with the region under it shaded as far as b, and an orange curve from 1 to 2.2 with the region under it shaded from 1 to b squared plus 1. Readouts show that the two shaded areas are equal.',
      },
      template: r`
        When $x = 0$, $u =$ [[1]]. When $x = 1$, $u =$ [[2]]. So

        $\displaystyle\int_0^1 2x\,(x^2 + 1)^3\,dx = \int_1^2 u^3\,du =$ [[3.75]]
      `,
      hints: [
        r`Put each limit for $x$ into $u = x^2 + 1$.`,
        r`An antiderivative of $u^3$ is $\dfrac{u^4}{4}$, so the integral is $\dfrac{2^4}{4} - \dfrac{1^4}{4}$.`,
      ],
      explain: r`
        $u$ runs from $0^2 + 1 = 1$ to $1^2 + 1 = 2$, and $\dfrac{16}{4} - \dfrac14 = 3.75$.
        The two shaded regions have different shapes and different widths, but always the same area.
      `,
    },
    {
      id: 'example-limits',
      type: 'info',
      title: 'Change the limits with the variable',
      text: r`
        The two regions had the same area because the limits moved along with the variable.
        That is the rule for every definite integral:
        **when you change the variable, change the limits with it.**

        :::example
        $\displaystyle\int_1^2 2x\,(x^2 - 1)^2\,dx$

        1. Inside: $u = x^2 - 1$, so $du = 2x\,dx$ and the integrand becomes $u^2$.
        2. New limits: when $x = 1$, $u = 0$. When $x = 2$, $u = 3$.
        3. $\displaystyle\int_0^3 u^2\,du = \dfrac{3^3}{3} - \dfrac{0^3}{3} = 9$.
        :::

        Line 3 is the rule from *Calculus in Pictures*: take an antiderivative, here $\dfrac{u^3}{3}$,
        at the upper limit, and subtract its value at the lower limit.
      `,
    },
    {
      id: 'definite',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const q = rng.pick(DEFINITE);
        const power = q.n === 1 ? '' : `^{${q.n}}`;
        const uPower = q.n === 1 ? 'u' : `u^{${q.n}}`;
        return {
          text: r`
            Use the substitution $u = ${q.gTex}$ to work out

            $$ \int_{${q.a}}^{${q.b}} ${q.dTex}\,(${q.gTex})${power}\,dx $$
          `,
          answer: q.answer,
          wrong: [
            [q.oldLimits, r`You changed the variable but kept the old limits. When $x$ runs from ${q.a} to ${q.b}, $u$ runs from ${q.lo} to ${q.hi}.`],
            [q.topOnly, r`That is the value at the upper limit only. Subtract the value at the lower limit, $u = ${q.lo}$.`],
          ],
          hints: [
            r`$du = ${q.dTex}\,dx$, so the integral is $\displaystyle\int ${uPower}\,du$. What are the limits for $u$?`,
            r`$u$ runs from ${q.lo} to ${q.hi}, and an antiderivative of $${uPower}$ is $\dfrac{u^{${q.n + 1}}}{${q.n + 1}}$.`,
          ],
          explain: r`
            $u = ${q.gTex}$, $du = ${q.dTex}\,dx$. When $x = ${q.a}$, $u = ${q.lo}$; when $x = ${q.b}$, $u = ${q.hi}$.

            $$ \int_{${q.lo}}^{${q.hi}} ${uPower}\,du = \frac{${q.hi}^{${q.n + 1}}}{${q.n + 1}} - \frac{${q.lo}^{${q.n + 1}}}{${q.n + 1}} = ${num(q.answer)} $$
          `,
        };
      },
    },
    {
      id: 'old-limits',
      type: 'choice',
      title: 'Find the slip',
      text: r`
        A student writes:

        $$ \int_0^1 2x\,(x^2 + 1)^3\,dx = \int_0^1 u^3\,du = \tfrac14 $$

        You know the true value is 3.75. **What went wrong?**
      `,
      columns: 1,
      options: [
        { text: r`The limits were not changed: $u$ runs from 1 to 2, not from 0 to 1`, correct: true },
        { text: r`$u = x^2 + 1$ is the wrong substitution for this integral`, why: r`It fits perfectly: $2x$ is the derivative of $x^2 + 1$.` },
        { text: r`$u^3$ was integrated wrongly`, why: r`$\dfrac{u^4}{4}$ is right, and from 0 to 1 it does give $\tfrac14$. The trouble is "from 0 to 1".` },
        { text: r`The $+\,C$ was left out`, why: 'In a definite integral the constant cancels in the subtraction, so it is never needed.' },
      ],
      explain: r`
        The limits 0 and 1 are values of $x$. In an integral over $u$ they must be values of $u$: 1 and 2.

        There is a second safe route: put the inside back *before* using the limits.
        $\tfrac14 (x^2 + 1)^4$ is $\tfrac{16}{4}$ at $x = 1$ and $\tfrac14$ at $x = 0$, and
        $\tfrac{16}{4} - \tfrac14 = 3.75$ as well.
      `,
    },
    {
      id: 'ready-or-not',
      type: 'bucket',
      review: true,
      title: 'Does it fit?',
      text: r`
        For each integral, look for an inside function and its derivative. A missing *number*
        can be supplied and paid back. A missing *function of $x$* cannot.

        **Does substitution work?**
      `,
      buckets: ['Yes, as it stands', 'Yes, after supplying a constant', 'No: the derivative is not there'],
      items: [
        { text: r`$\displaystyle\int 2x\,e^{x^2}\,dx$`, bucket: 0, why: r`$u = x^2$, and $2x$ is exactly its derivative.` },
        { text: r`$\displaystyle\int x\,e^{x^2}\,dx$`, bucket: 1, why: r`$u = x^2$ needs $2x$. There is an $x$, so only the factor 2 is missing: the answer is $\tfrac12 e^{x^2} + C$.` },
        { text: r`$\displaystyle\int e^{x^2}\,dx$`, bucket: 2, why: r`With no factor of $x$ there is nothing to become $du$. In fact this integral cannot be written with the functions you know at all.` },
        { text: r`$\displaystyle\int 3x^2 (x^3 + 1)^5\,dx$`, bucket: 0, why: r`$u = x^3 + 1$, and $3x^2$ is exactly its derivative.` },
        { text: r`$\displaystyle\int x^2 (x^3 + 1)^5\,dx$`, bucket: 1, why: r`$u = x^3 + 1$ needs $3x^2$. There is an $x^2$, so only the factor 3 is missing.` },
        { text: r`$\displaystyle\int x\,(x^3 + 1)^5\,dx$`, bucket: 2, why: r`$u = x^3 + 1$ needs $3x^2$, and $x$ is not a constant times $x^2$. (This one has to be multiplied out instead.)` },
        { text: r`$\displaystyle\int \cos(5x)\,dx$`, bucket: 1, why: r`$u = 5x$ needs a 5, and a missing number can always be supplied: the answer is $\tfrac15\sin(5x) + C$.` },
      ],
      explain: 'A missing *number* can be supplied and divided out again. A missing *function of x* cannot: constants pass through an integral, but functions do not.',
    },
    {
      id: 'trig-definite',
      type: 'numeric',
      stretch: true,
      title: 'A wave inside a power',
      gen: (rng) => {
        const n = rng.pick([1, 2, 3, 4, 7, 9]);
        const sinPower = n === 1 ? r`\sin x` : `\\sin^{${n}} x`;
        const uPower = n === 1 ? 'u' : `u^{${n}}`;
        const old = (Math.PI / 2) ** (n + 1) / (n + 1);
        return {
          text: r`
            Work out

            $$ \int_0^{\pi/2} ${sinPower}\,\cos x\,dx $$

            ${n === 1 ? '' : `Here $${sinPower}$ is shorthand for $(\\sin x)^{${n}}$. `}Give an exact fraction or a decimal.
          `,
          answer: 1 / (n + 1),
          tolerance: 0.005,
          wrong: [
            [old, r`You kept the limits for $x$. With $u = \sin x$, the limits become $\sin 0 = 0$ and $\sin\frac{\pi}{2} = 1$.`],
            [1, r`An antiderivative of $${uPower}$ is $\dfrac{u^{${n + 1}}}{${n + 1}}$: do not forget to divide by ${n + 1}.`],
          ],
          hints: [
            r`The inside is $u = \sin x$, and its derivative $\cos x$ is standing right next to it.`,
            r`When $x = 0$, $u = 0$. When $x = \frac{\pi}{2}$, $u = 1$. So you need $\displaystyle\int_0^1 ${uPower}\,du$.`,
          ],
          explain: r`
            $u = \sin x$, $du = \cos x\,dx$, and the limits $x = 0, \frac{\pi}{2}$ become $u = 0, 1$:

            $$ \int_0^1 ${uPower}\,du = \frac{1^{${n + 1}}}{${n + 1}} - 0 = ${frac(1, n + 1)} $$
          `,
        };
      },
    },
  ],
  recap: [
    r`Look for **an inside function next to its own derivative**: $\displaystyle\int f\big(g(x)\big)\,g'(x)\,dx$.`,
    r`Name the inside $u$, write $du = g'(x)\,dx$, integrate in $u$, then put the inside back.`,
    'A missing constant factor can be supplied and divided out. A missing function of $x$ cannot.',
    'In a definite integral, change the limits along with the variable. And always check an antiderivative by differentiating it.',
  ],
  next: 'Next: equations that tell you the slope instead of the value, and how to follow them step by step.',
};
