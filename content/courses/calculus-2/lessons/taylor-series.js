// Calculus II: The Toolkit · Lesson 6 · Polynomials That Pretend
import { r, num } from '../../../kit.js';
import { factorial, piAxis } from '../helpers.js';

const PI = Math.PI;

/**
 * Taylor polynomials as plot expressions with the degree n as a slider. The plot has no "sum up to n",
 * so every term is written out and switched on by step(n − k), which is 1 when n ≥ k and 0 otherwise.
 */
const upTo = (max, term) => Array.from({ length: max + 1 }, (_, k) => term(k)).filter(Boolean).join(' + ');
const EXP_POLY = upTo(8, (k) => (k === 0 ? '1' : `step(n - ${k})*x^${k}/${factorial(k)}`));
const SIN_POLY = upTo(13, (k) => (k % 2 === 0 ? '' : k === 1 ? 'x' : `(${k % 4 === 1 ? '' : '-'}1)*step(n - ${k})*x^${k}/${factorial(k)}`));
const GEO_POLY = upTo(10, (k) => (k === 0 ? '1' : `step(n - ${k})*x^${k}`));

/** Value at x of the Taylor polynomial of degree n for e^x, and for sin x. */
export const expTaylor = (n, x) => { let total = 0; for (let k = 0; k <= n; k++) total += x ** k / factorial(k); return total; };
export const sinTaylor = (n, x) => { let total = 0; for (let k = 1; k <= n; k += 2) total += (k % 4 === 1 ? 1 : -1) * x ** k / factorial(k); return total; };

/** The largest distance between sin x and its Taylor polynomial of degree n for x between 0 and π. */
export function sineGap(n) {
  let worst = 0;
  for (let i = 0; i <= 400; i++) { const x = (PI * i) / 400; worst = Math.max(worst, Math.abs(Math.sin(x) - sinTaylor(n, x))); }
  return worst;
}

/** "1 + x + x²/2 + x³/6" as TeX, up to degree n. */
const expPolyTex = (n) => ['1', 'x', ...Array.from({ length: Math.max(0, n - 1) }, (_, i) => `\\dfrac{x^${i + 2}}{${factorial(i + 2)}}`)].slice(0, n + 1).join(' + ');

export default {
  id: 'taylor-series',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A parabola in disguise',
      text: r`
        The [blue]{.blue} curve is $\cos x$. The [orange]{.orange} dashed curve is a plain
        parabola, $1 - \frac{x^2}{2}$. Near $x = 0$ they are hard to tell apart.

        **How far apart do you think they are at $x = 0.5$?**
      `,
      figure: {
        type: 'plot', x: [-3.4, 3.4], y: [-1.5, 1.5], xStep: 1, yStep: 0.5,
        fns: [{ expr: 'cos(x)', color: 'blue' }, { expr: '1 - x^2/2', color: 'orange', dashed: true }],
        alt: 'The cosine curve and a downward parabola with the same top at (0, 1). Between about minus 1 and 1 the two curves lie almost on top of each other; further out the parabola falls away below the cosine.',
      },
      shuffle: false,
      options: [
        { text: 'About 0.1' },
        { text: 'About 0.03' },
        { text: 'Less than 0.003', correct: true },
      ],
      explain: r`
        $\cos 0.5 = 0.87758\ldots$ and $1 - \frac{0.25}{2} = 0.875$. They differ by less than 0.003.

        A parabola needs nothing but multiplying and adding, yet near 0 it does the job of a
        cosine. This lesson shows where that parabola comes from, and how to build a polynomial
        stand-in for any smooth curve, as accurate as you like.
      `,
    },
    {
      id: 'teach-imitate',
      type: 'info',
      title: 'Agree at one point',
      text: r`
        That parabola was built to agree with $\cos x$ at one point, $\mathord{x = 0}$. This is the plan
        for the whole lesson: pick a point, and make a polynomial agree with the curve there,
        one feature at a time. First the value, then the slope.

        A straight line $a_0 + a_1x$ has the value $a_0$ at $x = 0$, and its slope is $a_1$.

        :::example
        Imitate $f(x) = e^{2x}$ near $x = 0$ with a line.

        1. Value: $f(0) = e^0 = 1$, so $a_0 = 1$.
        2. Slope: by the chain rule $f'(x) = 2e^{2x}$, so $f'(0) = 2$ and $a_1 = 2$.

        The line is $1 + 2x$: the [orange]{.orange} tangent at 0.
        :::
      `,
      figure: {
        type: 'plot', x: [-1.5, 1.5], y: [-1, 5], xStep: 0.5, yStep: 1,
        fns: [{ expr: 'exp(2*x)', color: 'blue' }, { expr: '1 + 2*x', color: 'orange' }],
        points: [{ x: 0, y: 1, color: 'blue' }],
        alt: 'The curve y = e to the 2x, which passes through (0, 1), and the straight line 1 + 2x. The line touches the curve at (0, 1) and stays close to it nearby; further away the curve bends up and away from the line.',
      },
    },
    {
      id: 'tangent',
      type: 'interact',
      title: 'Start with a line',
      text: r`
        Take $f(x) = e^x$, which is its own derivative (*Calculus in Pictures*), and try to
        imitate it near $x = 0$ with a straight line $a_0 + a_1x$.

        **Give the line the same value as the curve at $x = 0$, and the same slope there.**
      `,
      widget: {
        type: 'plot', x: [-2, 2], y: [-1, 5], xStep: 1, yStep: 1,
        params: {
          a0: { min: 0, max: 2, step: 0.25, value: 2, label: 'value at 0: $a_0$', color: 'orange' },
          a1: { min: -1, max: 2, step: 0.25, value: 0, label: 'slope: $a_1$', color: 'orange' },
        },
        fns: [{ expr: 'exp(x)', color: 'blue' }, { expr: 'a0 + a1*x', color: 'orange' }],
        points: [{ x: 0, y: 1, color: 'blue' }],
        alt: 'The curve y = e to the x, which passes through (0, 1), and a straight line. Sliders set the height of the line at x = 0 and its slope.',
      },
      check: (s) => {
        if (s.a0 === 1 && s.a1 === 1) return true;
        if (s.a0 !== 1) return `Your line passes through (0, ${num(s.a0)}), but the curve passes through (0, 1). Fix the height first.`;
        return s.a1 < 1
          ? `The height is right. But your line has slope ${num(s.a1)}, and the curve is steeper than that at 0: the line cuts through it.`
          : `The height is right. But your line has slope ${num(s.a1)}, and the curve is less steep than that at 0: the line cuts through it.`;
      },
      solution: { a0: 1, a1: 1 },
      hints: [r`$e^0 = 1$. And $e^x$ is its own derivative, so its slope at 0 is also 1.`],
      explain: r`
        $1 + x$ is the tangent line at 0: the same value as $e^x$ there (1) and the same slope
        (also 1, because $e^x$ is its own derivative).

        No straight line does better near 0. But a line cannot bend, and the curve bends away from it on both sides.
      `,
    },
    {
      id: 'bend',
      type: 'interact',
      title: 'Now match the bend',
      text: r`
        Add a term $a_2x^2$. It leaves the value and the slope at 0 alone, but it bends the line into a parabola.

        How much bend is right? The **second derivative** from Lesson 3 measures how fast the slope is changing.
        For $e^x$ it is $e^x$ again, so at 0 it is 1. For $1 + x + a_2x^2$ it is $2a_2$.

        **Slide $a_2$ until the two second derivatives agree.**
      `,
      widget: {
        type: 'plot', x: [-2, 2], y: [-1, 5], xStep: 1, yStep: 1,
        params: { a2: { min: 0, max: 1, step: 0.1, value: 0, label: '$a_2$', color: 'orange' } },
        fns: [{ expr: 'exp(x)', color: 'blue' }, { expr: '1 + x + a2*x^2', color: 'orange' }],
        points: [{ x: 0, y: 1, color: 'blue' }],
        readouts: [
          { label: 'second derivative of $e^x$ at 0', expr: '1', digits: 1, color: 'blue' },
          { label: 'of your polynomial', expr: '2*a2', digits: 1, color: 'orange' },
        ],
        alt: 'The curve y = e to the x and the polynomial 1 + x + a2 x squared, which starts as the tangent line and bends upwards as a2 grows. Readouts compare the second derivatives of the two at x = 0.',
      },
      check: (s) => {
        if (Math.abs(s.a2 - 0.5) < 1e-9) return true;
        return s.a2 < 0.5
          ? `The second derivative of your polynomial is ${num(2 * s.a2, 1)}, and that of the curve is 1. Your polynomial does not bend enough.`
          : `The second derivative of your polynomial is ${num(2 * s.a2, 1)}, and that of the curve is 1. Your polynomial bends too much.`;
      },
      solution: { a2: 0.5 },
      explain: r`
        $a_2 = \frac12$, not 1. Differentiating $x^2$ twice gives 2, so the coefficient has to be
        *half* the second derivative you are aiming for.

        The parabola $1 + x + \frac{x^2}{2}$ stays with $e^x$ well beyond the point where the tangent line gave up.
      `,
    },
    {
      id: 'factorials',
      type: 'fill',
      title: 'The pattern in the coefficients',
      text: r`
        Go one step further. Differentiate $a_3x^3$ three times:
        $\;a_3x^3 \to 3a_3x^2 \to 6a_3x \to 6a_3$.

        To match the third derivative of $e^x$ at 0, which is 1, you need $6a_3 = 1$. That 6 is
        $3 \times 2 \times 1$. Products like this are called **factorials**:
        $\;n! = n \times (n - 1) \times \dots \times 2 \times 1$.
      `,
      template: r`
        $3! =$ [[6]], so $a_3 = \frac16$.

        $4! =$ [[24]], so the coefficient of $x^4$ is 1 divided by [[24]].

        $5! =$ [[120]]
      `,
      hints: [r`$4! = 4 \times 3 \times 2 \times 1$. And $5!$ is 5 times that.`],
      explain: r`
        Differentiate $x^n$ all the way down and the powers pile up in front as
        $n \times (n-1) \times \dots \times 1 = n!$. To end with the right $n$th derivative, the
        coefficient of $x^n$ must be that derivative **divided by $n!$**.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Taylor polynomials',
      text: r`
        The polynomial that matches a function's value and its first $n$ derivatives at $x = 0$
        is called its **Taylor polynomial** of degree $n$:

        :::key
        $$ \begin{aligned} &f(0) + f'(0)\,x + \frac{f''(0)}{2!}\,x^2 \\[4pt] &+ \frac{f'''(0)}{3!}\,x^3 + \dots + \frac{f^{(n)}(0)}{n!}\,x^n \end{aligned} $$
        :::

        Here $f''$, $f'''$ and $f^{(n)}$ are the second, third and $n$th derivatives. Value,
        slope, bend, and so on: each new term matches one more derivative, and leaves the
        earlier ones untouched.

        For $e^x$ every derivative at 0 is 1, so the pattern is as simple as it could be:

        $$ e^x \approx 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots $$
      `,
    },
    {
      id: 'degree',
      type: 'interact',
      title: 'One term at a time',
      text: r`
        Here is $e^x$ with its Taylor polynomial of degree $n$. Each step of the slider adds one more term.

        Near 0 the fit is soon perfect to the eye. Further out it takes longer.
        **Find the lowest degree for which the polynomial is within 0.01 of $e^x$ at $x = 2$.**
      `,
      widget: {
        type: 'plot', x: [-3, 3], y: [-2, 12], xStep: 1, yStep: 2,
        params: { n: { min: 0, max: 8, step: 1, value: 1, label: 'degree $n$', color: 'orange' } },
        fns: [{ expr: 'exp(x)', color: 'blue' }, { expr: EXP_POLY, color: 'orange' }],
        vlines: [{ x: 2, dashed: true }],
        readouts: [
          { label: 'polynomial at $x = 2$', expr: 'f1(2)', digits: 4, color: 'orange' },
          { label: '$e^2$', expr: 'f0(2)', digits: 4, color: 'blue' },
          { label: 'gap', expr: 'f0(2) - f1(2)', digits: 4 },
        ],
        alt: 'The curve y = e to the x and its Taylor polynomial, whose degree is set by a slider. A dashed line marks x = 2, and readouts compare the two values there.',
      },
      check: (s) => {
        const gap = Math.exp(2) - expTaylor(s.n, 2);
        if (s.n === 7) return true;
        return s.n < 7
          ? `At degree ${s.n} the polynomial is still ${num(gap, 4)} short of e² at x = 2. Add more terms.`
          : `At degree ${s.n} the gap is ${num(gap, 4)}, which is within 0.01. But a lower degree already manages that.`;
      },
      solution: { n: 7 },
      explain: r`
        Degree 7: $\;1 + 2 + 2 + 1.333 + 0.667 + 0.267 + 0.089 + 0.025 \approx 7.381$, against $e^2 \approx 7.389$.

        After the first three, each term is smaller than the one before, because the factorial underneath grows so fast.
        That is why a handful of terms is enough.
      `,
    },
    {
      id: 'example-estimate',
      type: 'info',
      title: 'Putting a polynomial to work',
      text: r`
        A Taylor polynomial turns a hard function into plain arithmetic: put the number in,
        one term at a time, and add.

        :::example
        Estimate $e^{0.2}$ with the polynomial of degree 3, $\;1 + x + \dfrac{x^2}{2} + \dfrac{x^3}{6}$.

        1. Put in $\mathord{x = 0.2}$. The terms are $1$ and $0.2$, then $\mathord{\dfrac{0.04}{2} = 0.02}$ and $\mathord{\dfrac{0.008}{6} \approx 0.0013}$.
        2. Add them: $\mathord{1 + 0.2 + 0.02 + 0.0013} \approx 1.221$.
        :::

        A calculator gives $e^{0.2} \approx 1.2214$. Four easy terms, and the estimate is right to three decimal places.

        Two things to watch: every power is divided by its factorial, and a negative $x$
        makes the odd powers negative.
      `,
    },
    {
      id: 'estimate-exp',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const x = rng.pick([1, 0.5, -1, 2]);
        const n = rng.pick([2, 3, 4]);
        const answer = expTaylor(n, x);
        const exact = Math.exp(x);
        const noFactorials = Array.from({ length: n + 1 }, (_, k) => x ** k).reduce((a, b) => a + b, 0);
        const target = x === 1 ? 'e' : `e^{${num(x)}}`;
        return {
          text: r`
            The Taylor polynomial of degree ${n} for $e^x$ is

            $$ ${expPolyTex(n)} $$

            **Use it to estimate $${target}$.** Round to 3 decimal places.
          `,
          answer: Math.round(answer * 1000) / 1000,
          tolerance: 0.0006,
          wrong: [
            [noFactorials, r`That adds the plain powers of $x$. Each power must be divided by its factorial: $x^2$ by 2, $x^3$ by 6, and so on.`],
            // only when the true value is clearly different from what the polynomial gives
            ...(Math.abs(exact - answer) > 0.002 ? [[Math.round(exact * 1000) / 1000, r`That is the true value of $${target}$ from a calculator. The question asks what the polynomial gives.`]] : []),
          ],
          hints: [
            r`Put $x = ${num(x)}$ into the polynomial, one term at a time.`,
            `The terms are ${Array.from({ length: n + 1 }, (_, k) => num(x ** k / factorial(k), 4)).join(', ')}. Add them up.`,
          ],
          explain: r`
            With $x = ${num(x)}$ the terms are $${Array.from({ length: n + 1 }, (_, k) => num(x ** k / factorial(k), 4)).map((t, i) => (i && t.startsWith('-') ? `(${t})` : t)).join(' + ')} \approx ${num(answer, 3)}$.

            The true value is $${target} \approx ${num(exact, 4)}$, so the estimate is off by about ${num(Math.abs(exact - answer), 4)}.
          `,
        };
      },
    },
    {
      id: 'example-cosine',
      type: 'info',
      title: 'Build one from its derivatives',
      text: r`
        To build a Taylor polynomial for a new function, list its derivatives, work each one
        out at 0, and divide by the factorials.

        :::example
        $f(x) = \cos x$, up to degree 2.

        | | | at $x = 0$ |
        |:--:|:--:|:--:|
        | $f$ | $\cos x$ | $1$ |
        | $f'$ | $-\sin x$ | $0$ |
        | $f''$ | $-\cos x$ | $-1$ |

        The polynomial is $\;1 + 0 \cdot x + \dfrac{-1}{2!}\,x^2$, which is $\;1 - \dfrac{x^2}{2}$.
        :::

        That is the parabola from the opening question. It was no lucky guess: it has the
        value, the slope and the bend of $\cos x$ at 0.
      `,
    },
    {
      id: 'sine-coeffs',
      type: 'fill',
      title: 'Now a wave',
      text: r`
        Build the Taylor polynomial of $f(x) = \sin x$. You know its derivatives go round in a
        cycle: $\;\sin x \to \cos x \to -\sin x \to -\cos x \to \sin x$.
      `,
      template: r`
        At $x = 0$: $\;f(0) =$ [[0]], $\;f'(0) =$ [[1]], $\;f''(0) =$ [[0]], $\;f'''(0) =$ [[-1]].

        So up to degree 3 the polynomial is $x\,-\,x^3$ divided by [[6]].
      `,
      hints: [r`$\sin 0 = 0$ and $\cos 0 = 1$.`, r`The coefficient of $x^3$ is $f'''(0)$ divided by $3!$.`],
      explain: r`
        $\sin 0 = 0$, $\cos 0 = 1$, $-\sin 0 = 0$, $-\cos 0 = -1$, and then the cycle repeats.
        Only the odd powers survive, with alternating signs:

        $$ \sin x \approx x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!} + \dots $$

        Its first term alone is the $\sin x \approx x$ you met in *Trigonometry*.
      `,
    },
    {
      id: 'sin-estimate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const x = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
        const cube = Math.round(x ** 3 * 1e6) / 1e6;
        const answer = x - cube / 6;
        const exact = Math.sin(x);
        // the error is tiny for the smallest angle: six decimals would print it as 0
        const error = Math.abs(exact - answer) < 5e-7 ? Math.abs(exact - answer).toFixed(8) : num(Math.abs(exact - answer), 6);
        return {
          text: r`
            Near 0, $\;\sin x \approx x - \dfrac{x^3}{6}$ (with $x$ in radians).

            For example, $\sin 0.7 \approx \mathord{0.7 - \dfrac{0.343}{6}}$, which is about $0.6428$.

            **Use this to estimate $\sin ${x}$.** Round to 4 decimal places.
          `,
          answer: Math.round(answer * 1e4) / 1e4,
          tolerance: 0.00004,
          wrong: [
            [x, r`That is the first term only. Now subtract $\dfrac{x^3}{6}$.`],
            [Math.round((x - cube / 3) * 1e4) / 1e4, r`The $x^3$ term is divided by $3! = 6$, not by 3.`],
            [Math.round((x + cube / 6) * 1e4) / 1e4, r`The $x^3$ term is subtracted: the signs in the sine series alternate.`],
          ],
          hints: [
            r`$${x}^3 = ${num(cube, 6)}$.`,
            r`$\dfrac{${num(cube, 6)}}{6} \approx ${num(cube / 6, 6)}$. Subtract that from ${x}.`,
          ],
          explain: r`
            $${x} - \dfrac{${num(cube, 6)}}{6} \approx ${num(answer, 6)}$, which rounds to ${num(Math.round(answer * 1e4) / 1e4, 4)}.

            A calculator gives $\sin ${x} \approx ${num(exact, 6)}$. Two terms, and the error is only about ${error}.
          `,
        };
      },
    },
    {
      id: 'reach',
      type: 'interact',
      title: 'How far does it reach?',
      text: r`
        Here is $\sin x$ with its Taylor polynomials. Only odd degrees appear, because the even terms are zero.

        Each polynomial follows the wave for a while, then breaks away.
        **Find the lowest degree that stays within 0.1 of $\sin x$ all the way from 0 to $\pi$.**
      `,
      widget: {
        type: 'plot', x: [-7, 7], y: [-3, 3], xStep: PI, yStep: 1, ...piAxis([[-2], [-1], [0], [1], [2]], -3),
        params: { n: { min: 1, max: 13, step: 2, value: 1, label: 'degree $n$', color: 'orange' } },
        fns: [{ expr: 'sin(x)', color: 'blue' }, { expr: SIN_POLY, color: 'orange' }],
        vlines: [{ x: PI, dashed: true }],
        readouts: [{ label: 'largest gap between 0 and π', value: (s) => sineGap(s.n), digits: 5 }],
        alt: 'The sine wave and one of its Taylor polynomials, whose degree is set by a slider. The polynomial follows the wave near 0 and then shoots away from it. A dashed line marks x = pi.',
      },
      check: (s) => {
        if (s.n === 7) return true;
        return s.n < 7
          ? `At degree ${s.n} the polynomial strays ${num(sineGap(s.n), 2)} from the sine curve before x = π. It needs more terms.`
          : `Degree ${s.n} stays within 0.1 as well: its largest gap is ${num(sineGap(s.n), 5)}. But a lower degree already manages it.`;
      },
      solution: { n: 7 },
      explain: r`
        Degree 7 is the first to hold on as far as $\pi$. But look further out: every one of these
        polynomials eventually shoots off, upwards or downwards. A polynomial cannot go on waving for ever.

        Each extra term pushes the break-away point further out. For $\sin x$, $\cos x$ and $e^x$
        it can be pushed as far as you like (a fact we state without proof).
      `,
    },
    {
      id: 'cos-series',
      type: 'expr',
      title: 'Cosine for free',
      text: r`
        $\cos x$ is the derivative of $\sin x$. So differentiate the polynomial for sine, one
        term at a time, with the power rule from *Calculus in Pictures*. A number underneath stays where it is.

        **Differentiate** $\;x - \dfrac{x^3}{6} + \dfrac{x^5}{120}$.
      `,
      answer: '1 - x^2/2 + x^4/24',
      vars: ['x'],
      wrong: [
        ['1 - x^2/6 + x^4/120', r`Bring each power down as well: $\dfrac{x^3}{6}$ gives $\dfrac{3x^2}{6} = \dfrac{x^2}{2}$.`],
        ['x^2/2 - x^4/24 + x^6/720', 'That is an antiderivative. Go the other way: lower each power by one.'],
        ['-x^2/2 + x^4/24', r`The first term, $x$, has derivative 1. Do not lose it.`],
      ],
      hints: [r`Power rule on each term: $\dfrac{x^3}{6}$ becomes $\dfrac{3x^2}{6}$, and $\dfrac{x^5}{120}$ becomes $\dfrac{5x^4}{120}$.`],
      explain: r`
        $1 - \dfrac{x^2}{2} + \dfrac{x^4}{24}$: the parabola from the first screen, with its next term. These are the
        opening terms of

        $$ \cos x \approx 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \frac{x^6}{6!} + \dots $$

        The polynomials inherit the calculus of the functions they imitate. Differentiate the
        polynomial for $e^x$ term by term and you get the same polynomial back, one term shorter.
      `,
    },
    {
      id: 'geometric',
      type: 'choice',
      stretch: true,
      title: 'A warning',
      text: r`
        For $f(x) = \dfrac{1}{1 - x}$ every Taylor coefficient works out to be 1, so its Taylor
        polynomials are $\;1 + x + x^2 + \dots + x^n$.

        Raise the degree, and drag the point to compare the two values at different $x$.
        **For which $x$ do the polynomials close in on the function?**
      `,
      figure: {
        type: 'plot', x: [-2.5, 3], y: [-6, 8], xStep: 1, yStep: 2,
        params: { n: { min: 1, max: 10, step: 1, value: 2, label: 'degree $n$', color: 'orange' } },
        fns: [{ expr: '1/(1 - x)', color: 'blue' }, { expr: GEO_POLY, color: 'orange' }],
        points: [{ id: 'P', x: 0.5, on: 1, drag: 'x', snap: 0.25, xMin: -2, xMax: 2.5, color: 'orange' }],
        readouts: [
          { label: '$x$', expr: 'Px', digits: 2 },
          { label: 'polynomial', expr: 'f1(Px)', digits: 3, color: 'orange' },
          { label: '$\\frac{1}{1 - x}$', expr: 'f0(Px)', digits: 3, color: 'blue' },
        ],
        alt: 'The curve y = 1 over (1 minus x), which shoots up to infinity just left of x = 1 and comes back from minus infinity just right of it, with one of its Taylor polynomials. A slider sets the degree, and a point can be dragged along the polynomial to compare values.',
      },
      columns: 1,
      options: [
        { text: r`Only for $x$ between $-1$ and $1$`, correct: true },
        { text: r`For every $x$, just as for $e^x$`, why: r`Try $x = 2$. The function is $-1$ there, but the polynomials give $1 + 2 + 4 + 8 + \dots$, which runs away.` },
        { text: r`For every $x$ less than 1`, why: r`Try $x = -1.5$. The sums are $1,\; -0.5,\; 1.75,\; -1.625, \dots$: they swing wider and wider instead of settling down.` },
        { text: r`Only at $x = 0$`, why: r`Try $x = 0.5$. The sums $1,\; 1.5,\; 1.75,\; 1.875, \dots$ close in on 2, which is exactly $\frac{1}{1 - 0.5}$.` },
      ],
      explain: r`
        Only for $-1 < x < 1$. At $x = 0.5$ the sums $1,\; 1.5,\; 1.75,\; 1.875, \dots$ close in on 2.
        At $x = 2$ they explode, while the function itself sits calmly at $-1$.

        So more terms do **not** always mean a better fit everywhere.
      `,
    },
    {
      id: 'teach-series',
      type: 'info',
      title: 'From polynomial to series',
      text: r`
        Carried on for ever, a Taylor polynomial becomes a **Taylor series**. The dots at the
        end of one mean "and so on, without end".

        Two things to keep straight:

        - No polynomial of any degree is *exactly* $e^x$, $\sin x$ or $\cos x$. Each one stops
          somewhere and leaves a gap. For these three functions, more terms shrink the gap
          to as little as you like, at every $x$.
        - That does not happen for every function. The series of $\dfrac{1}{1 - x}$, which is
          $\mathord{1 + x + x^2 + \dots}$, closes in on the function only for $x$ between $-1$ and $1$.

        :::key
        A function need not equal its Taylor series at every $x$.
        :::
      `,
    },
    {
      id: 'match-series',
      type: 'match',
      review: true,
      text: 'Carried on for ever, a Taylor polynomial is called a Taylor series. **Match each function with the start of its Taylor series at 0.**',
      pairs: [
        [r`$e^x$`, r`$1 + x + \dfrac{x^2}{2!} + \dfrac{x^3}{3!} + \dots$`],
        [r`$\sin x$`, r`$x - \dfrac{x^3}{3!} + \dfrac{x^5}{5!} - \dots$`],
        [r`$\cos x$`, r`$1 - \dfrac{x^2}{2!} + \dfrac{x^4}{4!} - \dots$`],
        [r`$\dfrac{1}{1 - x}$`, r`$1 + x + x^2 + x^3 + \dots$`],
      ],
      hints: [r`Put $x = 0$ into each series: which functions are 1 at 0, and which is 0? Then look at the slope at 0.`],
      explain: r`
        $e^x$ has every power, each divided by its factorial. Sine keeps the odd powers and cosine
        the even ones, with alternating signs. And $\frac{1}{1 - x}$ has every power with no factorials at all.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: r`The Taylor polynomial of degree $n$ matches the function's value and its first $n$ derivatives at $x = 0$`, correct: true },
        { text: r`The coefficient of $x^n$ is the $n$th derivative at 0, divided by $n!$`, correct: true },
        { text: r`For small $x$ in radians, $\sin x \approx x - \dfrac{x^3}{6}$`, correct: true },
        { text: 'Adding more terms improves the fit at every $x$, for every function', why: r`Not for $\frac{1}{1 - x}$ at $x = 2$: there, more terms make things worse.` },
        { text: r`With a high enough degree, a Taylor polynomial of $e^x$ is exactly equal to $e^x$`, why: r`Never exactly: $e^x$ is not a polynomial. The gap can be made as small as you like, but each polynomial stops somewhere.` },
      ],
      explain: r`
        This is why the idea matters. A computer's arithmetic comes down to adding and multiplying,
        and a polynomial needs nothing else. When a calculator or a computer works out $\sin x$
        or $e^x$, it works in this spirit: often with a polynomial approximation built on
        a similar idea, tuned to be accurate across a whole interval.
      `,
    },
  ],
  recap: [
    'A **Taylor polynomial** imitates a function near a point by matching its value, its slope, its bend and so on.',
    r`The coefficient of $x^n$ is $\dfrac{f^{(n)}(0)}{n!}$, where $n! = n \times (n-1) \times \dots \times 1$.`,
    r`$e^x = 1 + x + \frac{x^2}{2!} + \dots$, $\;\sin x = x - \frac{x^3}{3!} + \dots$, $\;\cos x = 1 - \frac{x^2}{2!} + \dots$, for every $x$.`,
    r`A function need not equal its series everywhere: $\frac{1}{1-x} = 1 + x + x^2 + \dots$ only for $|x| < 1$.`,
  ],
  next: 'That completes the toolkit: the chain and product rules, the calculus of waves, substitution, differential equations and Taylor polynomials. With these you can read most of the mathematics that science is written in.',
};
