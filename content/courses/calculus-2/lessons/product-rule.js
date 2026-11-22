// Calculus II: The Toolkit · Lesson 2 · Two Things Changing at Once
import { r, num } from '../../../kit.js';
import { coef, cx, lin, bracketNeg, code, table } from '../helpers.js';

/** A rectangle 5 by 4 whose width grows at 2 per second and whose height grows at 3 per second. */
const RECT = {
  type: 'product-rect', f: '5 + 2*x', g: '4 + 3*x', at: 0, steps: [1, 0.5, 0.25, 0.1, 0.01],
  names: { f: 'width', g: 'height', x: 't' },
};

/**
 * Quotients c·x / (x + a) and a point x = p where the slope c·a / (p + a)² is a tidy decimal,
 * and where the three tempting wrong answers are all different from it and from each other.
 */
export const QUOTIENTS = [];
for (const c of [1, 2, 3]) for (const a of [1, 2, 3, 4, 5]) for (const p of [-2, -1, 1, 2, 3]) {
  if (p + a <= 0) continue;
  const slope = (c * a) / (p + a) ** 2;
  const values = [slope, c, (c * p) / (p + a), (c * a) / (p + a)];
  const tidy = Math.abs(slope * 1000 - Math.round(slope * 1000)) < 1e-9;
  if (tidy && new Set(values.map((v) => v.toFixed(6))).size === 4) QUOTIENTS.push({ c, a, p, slope });
}

export default {
  id: 'product-rule',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A rectangle that grows both ways',
      text: `
        A rectangle on a screen is **5 cm wide** and **4 cm tall**. Its width is growing at
        2 cm per second, and its height at 3 cm per second.

        **How fast is its area growing at this moment?**
      `,
      shuffle: false,
      options: [
        { text: '5 cm² per second (2 + 3)' },
        { text: '6 cm² per second (2 × 3)' },
        { text: '23 cm² per second', correct: true },
      ],
      explain: `
        23 cm² per second.

        The two tempting answers use only the rates, 2 and 3. But the same growth of the sides
        adds far more area to a big rectangle than to a small one, so the sizes 5 and 4 have
        to come into it somehow. A picture shows how.
      `,
    },
    {
      id: 'teach-gain',
      type: 'info',
      title: 'Measure it over a short step',
      text: r`
        In *Calculus in Pictures* you found a rate at an instant in two moves: divide the
        change over a short step by the length of the step, then let the step shrink.

        Do that for the area, starting with a step of 1 second. The width grows from 5 to 7
        and the height from 4 to 7.

        :::example
        Area now: $5 \times 4 = 20$. One second later: $7 \times 7 = 49$.

        Gain ÷ step: $\dfrac{49 - 20}{1} = 29$ cm² per second, **on average** over that second.
        :::

        The picture shows where the 29 comes from: a [strip on the right]{.orange}, a
        [strip on top]{.violet} and a [corner]{.green} where they meet.
      `,
      figure: { ...RECT, static: true, alt: 'A rectangle 5 wide and 4 tall, with what it gains in one second: a strip on the right, 2 wide and 4 tall; a strip on top, 5 wide and 3 tall; and a corner, 2 by 3, where they meet. A bar splits the gain of 29 into 8 from the right strip, 15 from the top strip and 6 from the corner.' },
    },
    {
      id: 'strips',
      type: 'interact',
      title: 'Two strips and a corner',
      text: r`
        Here is the rectangle again, and what it gains over the next $h$ seconds: a
        [strip on the right]{.orange}, a [strip on top]{.violet} and a small [corner]{.green}.

        Over a whole second it gains 29 cm². But you want the rate *at this moment*, so the
        step has to shrink.

        **Shrink the step to 0.01.** Watch the bar: which of its three parts fades away?
      `,
      widget: { ...RECT, alt: 'A rectangle 5 wide and 4 tall, with the strip it gains on the right, the strip it gains on top and the corner where they meet. A slider sets the size of the time step. A bar shows the area gained divided by the step, split into the three parts.' },
      check: (s) => s.h <= 0.01 || `With a step of ${num(s.h)} the area gained ÷ step is ${num(s.rate)}, and the corner still supplies ${num(s.corner / s.h)} of that. Shrink the step further.`,
      solution: { h: 0.01 },
      explain: r`
        Divided by the step, the right strip always supplies 8 and the top strip always 15.
        The corner supplies $6h$: first 6, then 3, 1.5, 0.6 and 0.06.

        So as the step shrinks, the rate closes in on $8 + 15 = 23$ cm² per second. The corner
        is real, but it shrinks faster than the step does, and at an instant it counts for nothing.
      `,
    },
    {
      id: 'pieces',
      type: 'fill',
      title: 'Why the corner vanishes',
      text: r`
        Do the same with letters. In a short time $h$ the width grows by $2h$ and the height by $3h$.
        The rectangle is 5 wide and 4 tall.
      `,
      template: r`
        Right strip: $4 \times 2h =$ [[8]] $h$. $\quad$ Top strip: $5 \times 3h =$ [[15]] $h$. $\quad$ Corner: $2h \times 3h =$ [[6]] $h^2$.

        Divide the total by $h$: the area grows at $\;8 + 15\; +$ [[6]] $h\;$ cm² per second, on average over the step.

        As $h$ shrinks to nothing, that settles at exactly [[23]].
      `,
      hints: [r`The corner is $2h$ wide and $3h$ tall. Dividing $6h^2$ by $h$ still leaves one $h$.`],
      explain: r`
        Each strip is one side times the *growth of the other side*: one small factor. The corner
        is growth times growth: two small factors. After dividing by $h$ the corner still has
        one of them left, so it shrinks to nothing.

        What remains is $\;4 \times 2 + 5 \times 3 = 23$.
      `,
    },
    {
      id: 'rule',
      type: 'info',
      title: 'The product rule',
      text: r`
        Call the width $f$ and the height $g$. The area is the product $f \cdot g$, and it grows by two strips:

        :::key
        $$ (f \cdot g)' = \orange{f' \cdot g} + \violet{f \cdot g'} $$

        **The rate of each factor, times the other factor as it is now. Then add.**
        :::

        - $\orange{f' \cdot g}$ is the strip on the right: how fast the width grows, times the height.
        - $\violet{f \cdot g'}$ is the strip on top: the width, times how fast the height grows.

        There is no $f' \cdot g'$ term. That would be the corner, and the corner vanishes.

        :::example
        At some $x$, $f = 10$ and $g = 7$, with slopes $f' = 3$ and $g' = -2$. Then the product has slope
        $\;3 \times 7 + 10 \times (-2) = 21 - 20 = 1$.
        :::
      `,
    },
    {
      id: 'not-product',
      type: 'choice',
      title: 'The "obvious" rule',
      text: r`
        It would be simpler if the derivative of a product were just the product of the
        derivatives. Test both ideas on $x \cdot x$. You already know the answer: $x^2$ has derivative $2x$.

        **Which rule gives $2x$?**
      `,
      figure: {
        type: 'product-rect', f: 'x', g: 'x', at: 3, xRange: [1, 4], xStep: 0.5, steps: [1, 0.5, 0.1, 0.01], h: 0.5, names: { f: 'x', g: 'x', x: 'x', shape: 'square' }, bar: false, readouts: ['rate'],
        alt: 'A square of side x with the strip it gains on the right, the strip it gains on top and a small corner. Sliders set x and the size of the step.',
      },
      columns: 1,
      options: [
        { text: r`The product rule: $\;1 \cdot x + x \cdot 1$`, correct: true },
        { text: r`The product of the derivatives: $\;1 \times 1$`, why: r`That gives 1, the same slope everywhere. But $x^2$ gets steeper as $x$ grows: its slope is $2x$.` },
        { text: 'Both rules give the same result here', why: r`$1 \times 1 = 1$, but $1 \cdot x + x \cdot 1 = 2x$. They agree only at $x = \frac12$.` },
      ],
      explain: r`
        $1 \cdot x + x \cdot 1 = 2x$, as it should be. The product of the derivatives gives 1, which is wrong.

        The picture also shows where the 2 in the power rule comes from: a growing square gains
        **two** strips, each $x$ long.
      `,
    },
    {
      id: 'from-table',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let f; let g; let df; let dg; let answer;
        do {
          f = rng.nonzero(-5, 6); g = rng.nonzero(-5, 6); df = rng.nonzero(-4, 5); dg = rng.nonzero(-4, 5);
          answer = df * g + f * dg;
        } while ([df * dg, f * g, df + dg, df * g - f * dg].includes(answer) || new Set([df * dg, f * g, df + dg, df * g - f * dg]).size < 4);
        const x = rng.int(1, 4);
        return {
          text: [
            r`All you know about two functions $f$ and $g$ is their value and their slope at $x = ${x}$:`,
            table(['', `value at $x = ${x}$`, `slope at $x = ${x}$`], [['$f$', `$${f}$`, `$${df}$`], ['$g$', `$${g}$`, `$${dg}$`]]),
            r`**What is the slope of the product $f \cdot g$ at $x = ${x}$?**`,
          ].join('\n\n'),
          answer,
          wrong: [
            [df * dg, r`That multiplies the two slopes. A product grows by two strips: $f' \cdot g + f \cdot g'$.`],
            [f * g, r`That is the value of the product, $f \cdot g$. The question asks how fast it is changing.`],
            [df + dg, r`That adds the two slopes, which is the rule for $f + g$. For a product, each slope is multiplied by the *other* function's value first.`],
            [df * g - f * dg, r`Almost: the two strips are added, not subtracted.`],
          ],
          hints: [
            r`$(f \cdot g)' = f' \cdot g + f \cdot g'$: each slope times the other function's value.`,
            r`$f' \cdot g = ${df} \times ${bracketNeg(g)}$ and $f \cdot g' = ${f} \times ${bracketNeg(dg)}$.`,
          ],
          explain: r`$f' \cdot g + f \cdot g' = ${df} \times ${bracketNeg(g)} + ${bracketNeg(f)} \times ${bracketNeg(dg)} = ${df * g} ${f * dg < 0 ? '-' : '+'} ${Math.abs(f * dg)} = ${answer}$.`,
        };
      },
    },
    {
      id: 'example-product',
      type: 'info',
      title: 'The rule at work on a formula',
      text: r`
        With formulas the rule works in the same way: name the two factors, differentiate
        each one, then add the two strips.

        :::example
        Differentiate $y = (x^2 + 1)\,e^x$.

        1. Name the factors: $f = x^2 + 1$ and $g = e^x$.
        2. Differentiate each: $f' = 2x$, and $g' = e^x$, because $e^x$ is its own derivative (*Calculus in Pictures*).
        3. Add the two strips: $y' = \mathord{f' \cdot g} + \mathord{f \cdot g'}$, which is $\mathord{2x\,e^x} + \mathord{(x^2 + 1)\,e^x}$.
        4. Tidy up if you like: $y' = \mathord{(x^2 + 2x + 1)}\,e^x$.
        :::

        Here $y'$ is short for $\dfrac{dy}{dx}$. Nobody could multiply this product out first:
        that is when the product rule earns its keep.
      `,
    },
    {
      id: 'guided',
      type: 'fill',
      title: 'Test the rule where you can check it',
      text: r`
        Take $y = (2x + 1)(x^2 + 3)$, with $f = 2x + 1$ and $g = x^2 + 3$.
      `,
      template: r`
        $f' =$ [[2]] and $g' =$ [[2]] $x$, so the product rule gives $\;y' = 2(x^2 + 3) + (2x + 1) \cdot 2x$.

        Collect the terms: $\;y' =$ [[6]] $x^2 +$ [[2]] $x + 6$.

        **Check.** Multiplied out first, $y = 2x^3 + x^2 + 6x + 3$, and the power rule gives $y' =$ [[6]] $x^2 + 2x + 6$.
      `,
      hints: [r`$2(x^2 + 3) = 2x^2 + 6$ and $(2x + 1) \cdot 2x = 4x^2 + 2x$. Add them.`],
      explain: r`
        $2(x^2 + 3) + (2x + 1) \cdot 2x = 2x^2 + 6 + 4x^2 + 2x = 6x^2 + 2x + 6$, the same as the
        long way round. Next come products that cannot be multiplied out at all, such as $x^2 e^x$.
      `,
    },
    {
      id: 'product-expr',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const typing = `Type $e^x$ as ${code('e^x')}. Any correct form is accepted.`;
        if (rng.bool(0.6)) {
          const n = rng.int(1, 4);
          const fTex = n === 1 ? 'x' : `x^{${n}}`;
          const dTex = n === 1 ? '1' : n === 2 ? '2x' : `${n}x^{${n - 1}}`;
          const fTyped = n === 1 ? 'x' : `x^${n}`;
          const dTyped = n === 1 ? '1' : `${n}*x^${n - 1}`;
          return {
            text: r`Differentiate with the product rule: $$ y = ${fTex}\,e^x $$` + `\n\n${typing}`,
            prefix: r`$\dfrac{dy}{dx} =$`,
            answer: `${dTyped}*e^x + ${fTyped}*e^x`,
            display: n === 1 ? 'e^x + x*e^x' : `${n === 2 ? '2x' : `${n}x^${n - 1}`}*e^x + x^${n}*e^x`,
            vars: ['x'],
            wrong: [
              [`${dTyped}*e^x`, r`That is $f' \cdot g$: one of the two strips (and also what multiplying the two derivatives would give). Add the other strip, $f \cdot g' = ${fTex}\,e^x$.`],
              [`${fTyped}*e^x`, r`That is $f \cdot g'$: one of the two strips. Add the other one, $f' \cdot g$, where $f' = ${dTex}$.`],
              [`x^${n + 1}*e^(x - 1) + ${dTyped}*e^x`, r`The power rule does not apply to $e^x$: its variable is in the exponent, and $e^x$ is its own derivative.`],
            ],
            hints: [
              r`$f = ${fTex}$ and $g = e^x$. You need $f' \cdot g + f \cdot g'$.`,
              r`$f' = ${dTex}$ and $g' = e^x$.`,
            ],
            explain: r`
              $f = ${fTex}$ has $f' = ${dTex}$, and $g = e^x$ has $g' = e^x$.

              $$ \begin{aligned} \frac{dy}{dx} &= ${n === 1 ? '' : dTex}\,e^x + ${fTex}\,e^x \\[4pt] &= (${n === 1 ? '1 + x' : `${dTex} + ${fTex}`})\,e^x \end{aligned} $$
            `,
          };
        }
        const a = rng.int(2, 5);
        const b = rng.nonzero(-6, 6);
        const fTex = lin(a, b);
        return {
          text: r`Differentiate with the product rule: $$ y = (${fTex})\,e^x $$` + `\n\n${typing}`,
          prefix: r`$\dfrac{dy}{dx} =$`,
          answer: `${a}*e^x + (${a}*x + ${b})*e^x`,
          display: `${a}*e^x + (${fTex})*e^x`,
          vars: ['x'],
          wrong: [
            [`${a}*e^x`, r`That is $f' \cdot g$: one of the two strips (and also what multiplying the two derivatives would give). Add the other strip, $f \cdot g' = (${fTex})\,e^x$.`],
            [`(${a}*x + ${b})*e^x`, r`That is $f \cdot g'$: one of the two strips. Add the other one, $f' \cdot g = ${a}e^x$.`],
          ],
          hints: [
            r`$f = ${fTex}$ and $g = e^x$. You need $f' \cdot g + f \cdot g'$.`,
            r`$f' = ${a}$ and $g' = e^x$.`,
          ],
          explain: r`
            $f = ${fTex}$ has $f' = ${a}$, and $g = e^x$ has $g' = e^x$.

            $$ \begin{aligned} \frac{dy}{dx} &= ${a}e^x + (${fTex})\,e^x \\[4pt] &= (${lin(a, a + b)})\,e^x \end{aligned} $$
          `,
        };
      },
    },
    {
      id: 'example-peak',
      type: 'info',
      title: 'Two rules in one problem',
      text: r`
        Sometimes one factor of a product is a chain. Then the chain rule from the last lesson
        differentiates that factor, and the product rule puts the strips together.

        :::example
        Where is the peak of $y = x\,e^{-5x}$?

        1. Factors: $f = x$, so $f' = 1$. And $g = e^{-5x}$, so by the chain rule $g' = -5e^{-5x}$.
        2. Product rule: $y' = \mathord{1 \cdot e^{-5x}} + \mathord{x \cdot (-5)e^{-5x}}$. Take out $e^{-5x}$: $\;y' = \mathord{(1 - 5x)}\,e^{-5x}$.
        3. At a peak the slope is zero (*Calculus in Pictures*). An exponential is never zero, so the bracket must be: $\mathord{1 - 5x = 0}$, and $x = 0.2$.
        :::

        An inside can be a fraction of $x$ as well: $e^{-x/5}$ has derivative $-\tfrac15 e^{-x/5}$.
      `,
      figure: {
        type: 'plot', x: [0, 1], y: [0, 0.1], xStep: 0.2, yStep: 0.02,
        fns: [{ expr: 'x*exp(-5*x)', color: 'blue' }],
        points: [{ x: 0.2, on: 0, color: 'orange' }],
        tangents: [{ fn: 0, at: 0.2, color: 'orange' }],
        alt: 'A curve that starts at the origin, rises to a single peak at x = 0.2 and then falls back towards the axis. The tangent at the peak is level.',
      },
    },
    {
      id: 'peak',
      type: 'numeric',
      title: 'Find the peak',
      gen: (rng) => {
        const k = rng.pick([1, 2, 3, 4]);
        const up = k === 1 ? '-x' : `-x/${k}`;
        const inner = k === 1 ? '-1' : r`-\tfrac{1}{${k}}`;
        const bracket = k === 1 ? '1 - x' : r`1 - \tfrac{x}{${k}}`;
        return {
          text: r`
            The curve $\;y = x\,e^{${up}}\;$ rises, peaks and fades away. At the peak its slope is zero.

            **At which $x$ is the peak?** Work it out with the product rule (and the chain rule for $e^{${up}}$), then check by dragging the point.
          `,
          figure: {
            type: 'plot', x: [0, 4 * k], y: [0, 0.5 * k], xStep: k, yStep: k === 3 ? 0.3 : 0.1 * k,
            fns: [{ expr: `x*exp(-x/${k})`, color: 'blue' }],
            points: [{ id: 'P', x: k / 4, on: 0, drag: 'x', snap: k / 4, color: 'orange' }],
            tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
            readouts: [{ label: '$x$', expr: 'Px', digits: 2 }, { label: 'slope', expr: 'd0(Px)', digits: 3, color: 'orange' }],
            alt: `A curve that starts at the origin, rises to a single peak and then falls back towards the axis. A point with its tangent can be dragged along it, and a readout gives the slope.`,
          },
          answer: k,
          prefix: '$x =$',
          wrong: [
            [0, r`At $x = 0$ the curve is on the axis and climbing: its slope there is 1, not 0.`],
            ...(k === 1 ? [] : [[1 / k, r`Check the last step: $${bracket} = 0$ means $\dfrac{x}{${k}} = 1$.`]]),
          ],
          hints: [
            r`$f = x$ and $g = e^{${up}}$. By the chain rule, $g' = ${inner}\,e^{${up}}$.`,
            r`$y' = e^{${up}} + x \cdot \left(${inner}\right) e^{${up}} = \left(${bracket}\right) e^{${up}}$. An exponential is never zero, so the bracket must be.`,
          ],
          explain: r`
            $$ \begin{aligned} y' &= 1 \cdot e^{${up}} + x \cdot \left(${inner}\right) e^{${up}} \\[4pt] &= \left(${bracket}\right) e^{${up}} \end{aligned} $$

            $e^{${up}}$ is never zero, so the slope is zero only when $${bracket} = 0$: at $x = ${k}$.
            The product rule, the chain rule and "slope zero at the top" from *Calculus in Pictures*, all in one problem.
          `,
        };
      },
    },
    {
      id: 'quotient',
      type: 'info',
      title: 'Dividing needs nothing new',
      text: r`
        A quotient is a product in disguise: $\;\dfrac{f}{g} = f \cdot g^{-1}$.

        The chain rule handles $g^{-1}$. The power rule works for negative powers too (on trust
        again), so $u^{-1}$ has derivative $-u^{-2}$, and $g^{-1}$ has derivative $-g^{-2} \cdot g'$.
        Now the product rule:

        $$ \left(f \cdot g^{-1}\right)' = f' \cdot g^{-1} - f \cdot g^{-2} g' $$

        Put both terms over $g^2$ and you have the **quotient rule**:

        :::key
        $$ \left(\frac{f}{g}\right)' = \frac{f' \cdot g - f \cdot g'}{g^2} $$

        wherever $g \neq 0$.
        :::

        Mind the minus sign, and that it is $f'g$ that comes first.
      `,
    },
    {
      id: 'example-quotient',
      type: 'info',
      title: 'The quotient rule at work',
      text: r`
        Call the top $f$ and the bottom $g$, differentiate each, and fill in the rule.

        :::example
        Find the slope of $y = \dfrac{4x}{x + 6}$ at $x = 2$.

        1. Top and bottom: $f = 4x$, so $f' = 4$. And $g = x + 6$, so $g' = 1$.
        2. Quotient rule: $y' = \dfrac{4(x + 6) - 4x \cdot 1}{(x + 6)^2} = \dfrac{24}{(x + 6)^2}$.
        3. Now put in $x = 2$: $\dfrac{24}{8^2} = \dfrac{24}{64} = 0.375$.
        :::

        Differentiate first, then put the number in. Putting $x = 2$ into $y$ itself gives
        $\dfrac{8}{8} = 1$: the *height* of the curve there, not its slope.
      `,
    },
    {
      id: 'quotient-use',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const { c, a, p, slope } = rng.pick(QUOTIENTS);
        const top = cx(c);
        const at = p < 0 ? `(${p})` : `${p}`;
        return {
          text: r`
            Use the quotient rule to find the slope of

            $$ y = \frac{${top}}{x + ${a}} $$

            at the point where $x = ${p}$.
          `,
          answer: slope,
          wrong: [
            [c, r`That divides the two derivatives: $${c} \div 1$. A quotient needs $\dfrac{f'g - fg'}{g^2}$.`],
            [(c * p) / (p + a), r`That is the height of the curve at $x = ${p}$. Differentiate first.`],
            [(c * a) / (p + a), r`The top is right. The bottom of the quotient rule is $g^2$: square $x + ${a}$.`],
          ],
          hints: [
            r`$f = ${top}$ and $g = x + ${a}$, so $f' = ${c}$ and $g' = 1$.`,
            r`$f'g - fg' = ${c === 1 ? '' : c}(x + ${a}) - ${top} = ${c * a}$. So $y' = \dfrac{${c * a}}{(x + ${a})^2}$.`,
          ],
          explain: r`
            $f = ${top}$, $f' = ${c}$, $g = x + ${a}$, $g' = 1$.

            $$ y' = \frac{${c === 1 ? '' : c}(x + ${a}) - ${top}}{(x + ${a})^2} = \frac{${c * a}}{(x + ${a})^2} $$

            At $x = ${p}$ that is $\dfrac{${c * a}}{(${at} + ${a})^2} = \dfrac{${c * a}}{${(p + a) ** 2}} = ${num(slope)}$.
          `,
        };
      },
    },
    {
      id: 'which-rule',
      type: 'bucket',
      review: true,
      title: 'Which tool?',
      text: `
        Before differentiating, look at how the function is built. A function *inside* a function
        calls for the chain rule. Two functions of $x$ *multiplied* call for the product rule.
        Terms that are only added, or a number in front, need neither.

        **Which rule does each of these call for?**
      `,
      buckets: ['Chain rule', 'Product rule', 'Neither: term by term'],
      items: [
        { text: r`$(x^2 + 1)^5$`, bucket: 0, why: r`A function inside a function: $x^2 + 1$ inside a fifth power.` },
        { text: r`$x^2 \cdot e^x$`, bucket: 1, why: r`Two functions of $x$ multiplied together.` },
        { text: r`$x^3 + e^x$`, bucket: 2, why: 'A sum: differentiate each term on its own.' },
        { text: r`$e^{3x}$`, bucket: 0, why: r`$3x$ sits inside the exponential.` },
        { text: r`$(2x + 1)\,e^x$`, bucket: 1, why: r`$2x + 1$ multiplied by $e^x$.` },
        { text: r`$5x^4$`, bucket: 2, why: r`A number times a power. The 5 just stays in front: $20x^3$.` },
        { text: r`$\sqrt{x^2 + 9}$`, bucket: 0, why: r`$x^2 + 9$ sits inside the square root.` },
      ],
      explain: 'A function *inside* a function: chain rule. Two functions *multiplied*: product rule. Terms that are only added, or a number in front: the rules from the first course are enough.',
    },
    {
      id: 'both-rules',
      type: 'expr',
      stretch: true,
      title: 'Both rules at once',
      gen: (rng) => {
        if (rng.bool(0.5)) {
          const k = rng.pick([2, 3, 4, -1, -2]);
          const up = cx(k);
          return {
            text: r`This one needs the product rule, and the chain rule inside it. Differentiate: $$ y = x\,e^{${up}} $$` + `\n\nType the exponent in brackets, like ${code('e^(2x)')}.`,
            prefix: r`$\dfrac{dy}{dx} =$`,
            answer: `e^(${k}*x) + ${k}*x*e^(${k}*x)`,
            display: `e^(${up}) ${k < 0 ? '-' : '+'} ${cx(Math.abs(k))}*e^(${up})`,
            vars: ['x'],
            wrong: [
              [`e^(${k}*x) + x*e^(${k}*x)`, r`The second strip is $f \cdot g'$, and $g = e^{${up}}$ needs the chain rule: $g' = ${coef(k)}e^{${up}}$, not $e^{${up}}$.`],
              [`${k}*e^(${k}*x)`, r`That is $f' \cdot g'$, the product of the derivatives. You need $f' \cdot g + f \cdot g'$.`],
              [`${k}*x*e^(${k}*x)`, r`That is $f \cdot g'$ alone. Add the other strip, $f' \cdot g = e^{${up}}$.`],
              // an exponent typed without brackets is read only as far as its first number: e^2x is e²·x
              ...(k === -1 ? [] : [[`e^${up} ${k < 0 ? '-' : '+'} ${cx(Math.abs(k))}e^${up}`, `Look at the preview under the box: the exponent was cut short. Type the exponent in brackets, like ${code('e^(2x)')}.`]]),
            ],
            hints: [
              r`$f = x$ and $g = e^{${up}}$. First find $g'$ with the chain rule.`,
              r`$f' = 1$ and $g' = ${coef(k)}e^{${up}}$. Now $f' \cdot g + f \cdot g'$.`,
            ],
            explain: r`
              $f = x$ has $f' = 1$. By the chain rule $g = e^{${up}}$ has $g' = ${coef(k)}e^{${up}}$.

              $$ \begin{aligned} \frac{dy}{dx} &= e^{${up}} + x \cdot ${bracketNeg(k)}e^{${up}} \\[4pt] &= (${lin(k, 1)})\,e^{${up}} \end{aligned} $$
            `,
          };
        }
        const a = rng.int(2, 4);
        const b = rng.int(1, 5);
        const n = rng.int(2, 4);
        const inside = `${a}x + ${b}`;
        const low = n - 1 === 1 ? '' : `^{${n - 1}}`;
        return {
          text: r`This one needs the product rule, and the chain rule inside it. Differentiate: $$ y = x\,(${inside})^{${n}} $$` + '\n\nYou do not need to multiply anything out.',
          prefix: r`$\dfrac{dy}{dx} =$`,
          answer: `(${a}*x + ${b})^${n} + ${n * a}*x*(${a}*x + ${b})^${n - 1}`,
          display: `(${inside})^${n} + ${n * a}x(${inside})^${n - 1}`,
          vars: ['x'],
          wrong: [
            [`(${a}*x + ${b})^${n} + ${n}*x*(${a}*x + ${b})^${n - 1}`, r`The second strip is $f \cdot g'$, and $g = (${inside})^{${n}}$ needs the chain rule: do not forget to multiply by the derivative of the inside, ${a}.`],
            [`${n * a}*(${a}*x + ${b})^${n - 1}`, r`That is $f' \cdot g'$, the product of the derivatives. You need $f' \cdot g + f \cdot g'$.`],
            [`${n * a}*x*(${a}*x + ${b})^${n - 1}`, r`That is $f \cdot g'$ alone. Add the other strip, $f' \cdot g = (${inside})^{${n}}$.`],
          ],
          hints: [
            r`$f = x$ and $g = (${inside})^{${n}}$. First find $g'$ with the chain rule.`,
            r`$f' = 1$ and $g' = ${n}(${inside})${low} \times ${a} = ${n * a}(${inside})${low}$. Now $f' \cdot g + f \cdot g'$.`,
          ],
          explain: r`
            $f = x$ has $f' = 1$. By the chain rule $g = (${inside})^{${n}}$ has $g' = ${n * a}(${inside})${low}$.

            $$ \frac{dy}{dx} = (${inside})^{${n}} + ${n * a}x\,(${inside})${low} $$
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: *"The derivative of a sum is the sum of the derivatives. So the derivative
        of a product must be the product of the derivatives."*

        **Use a growing rectangle to explain what really happens.**
      `,
      model: `
        Think of the product as the area of a rectangle whose sides are the two functions. When
        both sides grow a little, the area gains two thin strips: one is the growth of the
        width times the height, the other is the width times the growth of the height. So the
        area grows at "rate of the first × the second, plus the first × rate of the second".

        The product of the two rates is only the tiny corner where the strips meet. It is small
        times small, so it shrinks to nothing compared with the strips. The friend's rule keeps
        the one part that vanishes and throws away the two that matter.
      `,
    },
  ],
  recap: [
    r`**Product rule:** $(f \cdot g)' = f' \cdot g + f \cdot g'$. The rate of each factor times the other factor, added.`,
    'The picture: a growing rectangle gains two strips. The corner between them is small × small, and vanishes.',
    r`The derivative of a product is **not** the product of the derivatives: for $x \cdot x$ that would give 1 instead of $2x$.`,
    r`**Quotient rule:** $\left(\dfrac{f}{g}\right)' = \dfrac{f'g - fg'}{g^2}$, which is the product rule and the chain rule applied to $f \cdot g^{-1}$.`,
  ],
  next: 'Next: the slope of a wave. What is the derivative of sine?',
};
