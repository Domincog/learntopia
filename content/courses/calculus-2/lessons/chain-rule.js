// Calculus II: The Toolkit · Lesson 1 · Functions Inside Functions
import { r, num } from '../../../kit.js';
import { cx, lin, bracketNeg, code } from '../helpers.js';

/** Pedals drive the wheel, the wheel drives the bike: a chain of two constant rates. */
const BIKE = {
  type: 'rate-chain', inner: 'k*x', outer: '2*u', x: [0, 4], u: [0, 20], y: [0, 40], start: 1, snap: 0.5,
  names: ['pedal turns', 'wheel turns', 'distance'], symbols: ['p', 'w', 'd'], units: ['', '', 'm'],
  rates: ['wheel turns per pedal turn', 'metres per wheel turn', 'metres per pedal turn'],
  k: { min: 1, max: 5, step: 0.5, value: 3, label: 'gear', color: 'blue' },
};

/** A square whose side grows steadily: the second link's rate depends on how big the square already is. */
const SQUARE = {
  type: 'rate-chain', inner: '3*x', outer: 'u^2', x: [0, 4], u: [0, 12], y: [0, 144], start: 1, snap: 0.5,
  names: ['time', 'side', 'area'], symbols: ['t', 's', 'A'], units: ['s', 'cm', 'cm²'],
  rates: ['cm of side per second', 'cm² of area per cm of side', 'cm² of area per second'],
};

/** Right-angled triangles with whole sides whose ratios are tidy decimals: [x, the number under the root with x², the root]. */
const TRIPLES = [[3, 16, 5], [4, 9, 5], [6, 64, 10], [8, 36, 10], [7, 576, 25], [24, 49, 25], [15, 400, 25], [20, 225, 25]];

export default {
  id: 'chain-rule',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Pedals, wheel, road',
      text: `
        You are riding a bike in a middle gear. One turn of the pedals turns the back wheel
        **3 times**, and each turn of the wheel carries the bike about **2 metres** along the road.

        **How far does one turn of the pedals carry you?**
      `,
      shuffle: false,
      options: [
        { text: '5 metres' },
        { text: '6 metres', correct: true },
        { text: '1.5 metres' },
      ],
      explain: r`
        6 metres: three turns of the wheel, at 2 metres each.

        The pedals drive the wheel and the wheel drives the bike. That is a chain with two links,
        and you just **multiplied** the rates of the links: $3 \times 2$. This lesson is about
        rates of change along a chain, and it ends with a rule that lets you differentiate
        functions the power rule cannot reach.
      `,
    },
    {
      id: 'teach-chain',
      type: 'info',
      title: 'Rates along a chain',
      text: r`
        A **rate** says how much one quantity changes for each unit of another. In
        *Calculus in Pictures* that was a slope: the derivative.

        The bike is a chain of two rates, one on each arrow:

        - [pedal turns]{.orange} to [wheel turns]{.blue}: **3** wheel turns per pedal turn
        - [wheel turns]{.blue} to [distance]{.green}: **2** metres per wheel turn

        Follow one turn of the pedals down the chain: 3 turns of the wheel, so $3 \times 2 = 6$ metres.
        The rate of the whole chain, 6 metres per pedal turn, is the **product** of the rates of its links.
      `,
      figure: { ...BIKE, static: true, alt: 'Three tracks, one below the other: 1 turn of the pedals, 3 turns of the back wheel and 6 metres of distance. The arrow from pedals to wheel is labelled times 3, and the arrow from wheel to distance is labelled times 2. The readouts give the three rates: 3, 2 and 6.' },
    },
    {
      id: 'gears',
      type: 'interact',
      title: 'Change gear',
      text: `
        Here is the same chain: [pedal turns]{.orange}, [wheel turns]{.blue}, [distance]{.green}.
        Each arrow is labelled with a rate: how much the quantity below changes for each unit of the one above.

        Drag the pedals to see the chain move. Then **change gear until one turn of the pedals
        carries the bike 8 metres.**
      `,
      widget: { ...BIKE, alt: 'Three tracks, one below the other: turns of the pedals, turns of the back wheel and distance along the road. An arrow from each marker to the next is labelled with its rate. A slider changes the gear.' },
      check: (s) => {
        if (Math.abs(s.total - 8) < 1e-6) return true;
        const now = `In this gear one turn of the pedals carries the bike ${num(s.total)} m: ${s.inner === 1 ? '1 wheel turn of 2 m' : `${num(s.inner)} wheel turns of 2 m each`}.`;
        return s.total < 8 ? `${now} You need a higher gear.` : `${now} You need a lower gear.`;
      },
      solution: { k: 4 },
      hints: ['The wheel always covers 2 metres per turn. How many wheel turns per pedal turn would make 8 metres?'],
      explain: r`
        In this gear the wheel turns 4 times for each turn of the pedals, and $4 \times 2 = 8$.

        Whatever the gear: **metres per pedal turn = wheel turns per pedal turn × metres per wheel turn.**
      `,
    },
    {
      id: 'square',
      type: 'fill',
      title: 'A link whose rate changes',
      text: r`
        A square picture on a screen is being enlarged. Its [side]{.blue} grows steadily, $s = 3t$ cm
        after $t$ seconds, and its [area]{.green} is $A = s^2$.

        This time the rate of the second link changes as the square grows.
        **Move the time and read the rates.**
      `,
      figure: { ...SQUARE, alt: 'Three tracks: time, the side of a square and its area. An arrow from each marker to the next is labelled with its rate. The time can be dragged.' },
      template: r`
        At $t = 2$ the two links have rates [[3]] and [[12]], and the area grows at [[36]] cm² per second.

        At $t = 3$ the links have rates 3 and 18, and the area grows at [[54]] cm² per second.

        So the rate of the whole chain is the link rates [[added|*multiplied]].
      `,
      hints: ['Drag the orange marker to $t = 2$. The two link rates are on the arrows, and all three rates are in the readouts.'],
      explain: r`
        $3 \times 12 = 36$ and $3 \times 18 = 54$. The second link's rate is $2s$ (the power rule
        for $s^2$), so it depends on how big the square already is. But at every moment the rate
        of the whole chain is still the product of the rates of its links.

        A check: $A = (3t)^2 = 9t^2$, so $\dfrac{dA}{dt} = 18t$, which is 36 at $t = 2$.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'The chain rule',
      text: r`
        :::key
        If $y$ depends on $u$, and $u$ depends on $x$, then

        $$ \frac{dy}{dx} = \frac{dy}{du} \times \frac{du}{dx} $$

        **Rates along a chain multiply.**
        :::

        The reason is the one you used on the bike. Nudge $x$ a little. Then $u$ moves
        $\frac{du}{dx}$ times as far, and $y$ moves $\frac{dy}{du}$ times as far as $u$ did.

        Written like this, the two $du$ look as if they cancel. They are not really fractions,
        but the rule they suggest is true. (A watertight proof needs more care than this
        sketch, and we take it on trust.)
      `,
    },
    {
      id: 'teach-inside-outside',
      type: 'info',
      title: 'Chains hide in formulas',
      text: r`
        To work out $(7x + 2)^3$ for some $x$, you first find $7x + 2$, then cube it. That is a chain.

        - The **inside** is what you work out first: $u = 7x + 2$.
        - The **outside** is what is then done to it: $y = u^3$.

        An inside is not always in brackets. In $e^{5x}$ it is the exponent, $u = 5x$. In
        $\sqrt{x + 4}$ it is what stands under the root.

        :::example
        Differentiate $y = (7x + 2)^3$.

        1. Name the inside: $u = 7x + 2$, so $\mathord{y = u^3}$.
        2. Rate of the outside, by the power rule: $\dfrac{dy}{du} = 3u^2$.
        3. Rate of the inside, the slope of a line: $\dfrac{du}{dx} = 7$.
        4. Multiply, and put the inside back: $\dfrac{dy}{dx} = 3u^2 \times 7 = 21(7x + 2)^2$.
        :::
      `,
    },
    {
      id: 'inside-outside',
      type: 'match',
      title: 'Spot the chain',
      text: r`
        The **inside** of a chain is the part you would work out first. The **outside** is what is then done to it.

        **Match each function with its inside.**
      `,
      pairs: [
        [r`$(3x + 1)^2$`, r`$u = 3x + 1$`],
        [r`$e^{2x}$`, r`$u = 2x$`],
        [r`$\sqrt{x^2 + 9}$`, r`$u = x^2 + 9$`],
        [r`$(e^x)^3$`, r`$u = e^x$`],
      ],
      explain: r`
        The outsides are: square it, $e^u$, $\sqrt{u}$ and cube it. In the last one the
        exponential is the *inside*: $e^x$ is worked out first and then cubed.
      `,
    },
    {
      id: 'two-ways',
      type: 'fill',
      title: 'Test the rule where you can check it',
      text: r`
        $y = (3x + 1)^2$ is a chain, but it can also be differentiated the old way: multiply
        it out, then use the power rule from *Calculus in Pictures* on each term. Do both and compare.
      `,
      template: r`
        **Multiplied out:** $y = 9x^2 + 6x + 1$, so $\dfrac{dy}{dx} =$ [[18]] $x\ +$ [[6]].

        **As a chain:** $y = u^2$ with $u = 3x + 1$, so $\dfrac{dy}{du} = 2u$ and $\dfrac{du}{dx} =$ [[3]].

        Multiply the two rates: $2u \times 3 = 6(3x + 1) =$ [[18]] $x\ +$ [[6]].
      `,
      hints: [r`Power rule on each term of $9x^2 + 6x + 1$. And $u = 3x + 1$ is a straight line: what is its slope?`],
      explain: r`
        Both routes give $18x + 6$. The chain-rule route never needed the brackets multiplied
        out. For $(3x + 1)^2$ that saves little. For $(3x + 1)^{10}$ it saves a page.
      `,
    },
    {
      id: 'measure',
      type: 'choice',
      title: 'Let the graph referee',
      text: r`
        Here are three attempts at the derivative of $y = (x^2 + 1)^2$. Only one is right.

        **Drag the point to $x = 1$, read the measured slope there, and pick the formula that agrees with it.**
      `,
      figure: {
        type: 'plot', x: [-2, 2], y: [0, 12], xStep: 1, yStep: 2,
        fns: [{ expr: '(x^2 + 1)^2', color: 'blue' }],
        points: [{ id: 'P', x: -1, on: 0, drag: 'x', snap: 0.25, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [{ label: '$x$', expr: 'Px', digits: 2 }, { label: 'measured slope', expr: 'd0(Px)', digits: 2, color: 'orange' }],
        alt: 'The curve y equals (x squared plus 1) squared: a steep-sided valley with its lowest point at height 1. A point with its tangent line can be dragged along it, and a readout gives the slope.',
      },
      columns: 1,
      options: [
        { text: r`$2(x^2 + 1) \times 2x$`, correct: true },
        { text: r`$2(x^2 + 1)$`, why: r`At $x = 1$ that gives 4, but the measured slope is 8. This is the rate of the outside, $2u$, on its own. The inside is changing as well, at rate $2x$, and that factor is missing.` },
        { text: r`$(2x)^2$`, why: r`At $x = 1$ that gives 4, but the measured slope is 8. This differentiates the inside and then squares the result. The outside has to be differentiated too.` },
      ],
      hints: [r`Put $x = 1$ into each formula and compare with the orange readout.`],
      explain: r`
        At $x = 1$ the tangent has slope 8, and only $2(x^2 + 1) \times 2x$ gives
        $2 \times 2 \times 2 = 8$: the rate of the outside, $2u$, times the rate of the inside, $2x$.

        The answer $2(x^2 + 1)$ is the most common slip with the chain rule:
        **forgetting to multiply by the derivative of the inside.**
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: 'The rule as a recipe',
      text: r`
        For a function inside a function, $y = f(g(x))$:

        1. Differentiate the **outside**, leaving the inside exactly as it is.
        2. Multiply by the derivative of the **inside**.

        $$ \frac{d}{dx}\,f\big(g(x)\big) = f'\big(g(x)\big) \times g'(x) $$

        | function | outside, inside untouched | × inside |
        |:---:|:---:|:---:|
        | $(x^2 + 9)^7$ | $7(x^2 + 9)^6$ | $2x$ |
        | $(5 - 9x)^8$ | $8(5 - 9x)^7$ | $-9$ |
        | $e^{7x}$ | $e^{7x}$ | $7$ |

        Multiply along each row: $(x^2 + 9)^7$ has derivative $\mathord{7(x^2 + 9)^6} \times 2x$, which is $\mathord{14x(x^2 + 9)^6}$.
        In the second row the inside slopes downhill, so its factor is negative: $\mathord{-72(5 - 9x)^7}$.
      `,
    },
    {
      id: 'power-chain',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const n = rng.int(3, 6);
        if (rng.bool(0.4)) {
          const c = rng.int(1, 6);
          const inside = `x^2 + ${c}`;
          return {
            text: r`Differentiate with the chain rule: $$ y = (${inside})^{${n}} $$`,
            prefix: r`$\dfrac{dy}{dx} =$`,
            answer: `${2 * n}*x*(${inside})^${n - 1}`,
            display: `${2 * n}x(${inside})^${n - 1}`,
            vars: ['x'],
            wrong: [
              [`${n}*(${inside})^${n - 1}`, r`That is the derivative of the outside alone. The inside, $${inside}$, is changing too: multiply by its derivative, $2x$.`],
              [`${n}*(2*x)^${n - 1}`, r`You differentiated the inside in place. Leave the inside as it is while you differentiate the outside, then multiply by $2x$.`],
              [`${2 * n}*x*(${inside})^${n}`, r`The outside is $u^{${n}}$, and its derivative is $${n}u^{${n - 1}}$: the power drops by one.`],
            ],
            hints: [
              r`Call the inside $u = ${inside}$. The outside is $u^{${n}}$, whose derivative is $${n}u^{${n - 1}}$.`,
              r`Outside: $${n}(${inside})^{${n - 1}}$. The inside has derivative $2x$. Multiply them.`,
            ],
            explain: r`
              Outside: $u^{${n}}$ gives $${n}u^{${n - 1}}$. Inside: $u = ${inside}$ gives $2x$.

              $$ \begin{aligned} \frac{dy}{dx} &= ${n}(${inside})^{${n - 1}} \times 2x \\[4pt] &= ${2 * n}x(${inside})^{${n - 1}} \end{aligned} $$
            `,
          };
        }
        const a = rng.pick([2, 3, 4, 5, -1, -2, -3]);
        const b = a < 0 ? rng.int(1, 7) : rng.nonzero(-7, 7);
        const inside = lin(a, b);
        return {
          text: r`Differentiate with the chain rule: $$ y = (${inside})^{${n}} $$`,
          prefix: r`$\dfrac{dy}{dx} =$`,
          answer: `${n * a}*(${inside})^${n - 1}`,
          display: `${n * a}(${inside})^${n - 1}`,
          vars: ['x'],
          wrong: [
            [`${n}*(${inside})^${n - 1}`, r`That is the derivative of the outside alone. The inside, $${inside}$, is changing too: multiply by its derivative, $${a}$.`],
            [`${n}*(${a})^${n - 1}`, r`You differentiated the inside in place. Leave the inside as it is while you differentiate the outside, then multiply by $${a}$.`],
            [`${n * a}*(${inside})^${n}`, r`The outside is $u^{${n}}$, and its derivative is $${n}u^{${n - 1}}$: the power drops by one.`],
          ],
          hints: [
            r`Call the inside $u = ${inside}$. The outside is $u^{${n}}$, whose derivative is $${n}u^{${n - 1}}$.`,
            r`Outside: $${n}(${inside})^{${n - 1}}$. The inside is a straight line with slope $${a}$. Multiply them.`,
          ],
          explain: r`
            Outside: $u^{${n}}$ gives $${n}u^{${n - 1}}$. Inside: $u = ${inside}$ gives $${a}$.

            $$ \begin{aligned} \frac{dy}{dx} &= ${n}(${inside})^{${n - 1}} \times ${bracketNeg(a)} \\[4pt] &= ${n * a}(${inside})^{${n - 1}} \end{aligned} $$
          `,
        };
      },
    },
    {
      id: 'example-exp',
      type: 'info',
      title: 'When the outside is e',
      text: r`
        $e^u$ is its own derivative. So when the outside is an exponential, step 1 changes
        nothing: the exponential stays exactly as it is, and all the work is in the inside.

        :::example
        Differentiate $y = e^{x^3}$.

        1. The inside is the exponent: $u = x^3$.
        2. Outside: $e^u$ gives $e^u$, so it stays $e^{x^3}$.
        3. Inside: $x^3$ gives $3x^2$.
        4. Multiply: $\dfrac{dy}{dx} = 3x^2\,e^{x^3}$.
        :::

        This is an old friend. In *Calculus in Pictures* you measured that the slope of
        $e^{kx}$ is $k$ times its height. That was the chain rule all along: the inside
        $u = kx$ changes at rate $k$. So $e^{-6x}$ has derivative $-6e^{-6x}$.
      `,
    },
    {
      id: 'exp-chain',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const typing = `Type the whole exponent in brackets, like ${code('e^(2x)')}.`;
        // an exponent typed without brackets is read only as far as its first number or letter: e^2x is e²·x
        const cut = `Look at the preview under the box: the exponent was cut short. ${typing}`;
        if (rng.bool(0.35)) {
          const k = rng.pick([1, 2, 3, -1, -2]);
          const up = `${cx(k)}^2`;                   // the exponent, as TeX and as typed text
          return {
            text: r`Differentiate: $$ y = e^{${up}} $$` + `\n\n${typing}`,
            prefix: r`$\dfrac{dy}{dx} =$`,
            answer: `${2 * k}*x*e^(${k}*x^2)`,
            display: `${cx(2 * k)}e^(${up})`,
            vars: ['x'],
            wrong: [
              [`e^(${k}*x^2)`, r`$e^u$ is its own derivative, so the outside gives $e^{${up}}$ again. Now multiply by the derivative of the inside, $${cx(2 * k)}$.`],
              [`e^(${2 * k}*x)`, r`You differentiated the inside in place. Keep the exponent as it is, and multiply the whole thing by its derivative, $${cx(2 * k)}$.`],
              [`${k}*x^2*e^(${k}*x^2 - 1)`, r`That is the power rule, which is for $x^n$ with the variable at the bottom. Here the variable is in the exponent: $e^u$ is its own derivative.`],
              ...(Math.abs(k) > 1 ? [[`${cx(2 * k)}e^${up}`, cut]] : []),
            ],
            hints: [
              r`The inside is the exponent, $u = ${up}$. The outside is $e^u$, which is its own derivative.`,
              r`Outside: $e^{${up}}$, unchanged. Inside: $${up}$ has derivative $${cx(2 * k)}$. Multiply them.`,
            ],
            explain: r`
              Outside: $e^u$ gives $e^u$. Inside: $u = ${up}$ gives $${cx(2 * k)}$.

              $$ \begin{aligned} \frac{dy}{dx} &= e^{${up}} \times ${k < 0 ? `(${cx(2 * k)})` : cx(2 * k)} \\[4pt] &= ${cx(2 * k)}\,e^{${up}} \end{aligned} $$
            `,
          };
        }
        const k = rng.pick([2, 3, 4, 5, -1, -2, -3]);
        const b = rng.bool(0.5) ? 0 : rng.int(1, 5);
        const up = b ? `${cx(k)} + ${b}` : cx(k);
        const typed = b ? `${k}*x + ${b}` : `${k}*x`;
        const wrong = [
          [`e^(${typed})`, r`$e^u$ is its own derivative, so the outside gives $e^{${up}}$ again. Now multiply by the derivative of the inside, $${k}$.`],
          [`(${typed})*e^(${typed} - 1)`, r`That is the power rule, which is for $x^n$ with the variable at the bottom. Here the variable is in the exponent: $e^u$ is its own derivative.`],
        ];
        if (!b) wrong.push([`${k}*(e^${bracketNeg(k)})*x`, `Look at the preview under the box: that was read as a power of $e$ times $x$. ${typing}`]);
        else wrong.push([`${k === -1 ? '-' : k}e^${cx(k)} + ${b}`, cut]);
        return {
          text: r`Differentiate: $$ y = e^{${up}} $$` + `\n\n${typing}`,
          prefix: r`$\dfrac{dy}{dx} =$`,
          answer: `${k}*e^(${typed})`,
          display: `${k === -1 ? '-' : k}e^(${up})`,
          vars: ['x'],
          wrong,
          hints: [
            r`The inside is the exponent, $u = ${up}$. The outside is $e^u$, which is its own derivative.`,
            r`Outside: $e^{${up}}$, unchanged. The inside has derivative $${k}$. Multiply them.`,
          ],
          explain: r`
            Outside: $e^u$ gives $e^u$. Inside: $u = ${up}$ gives $${k}$.

            $$ \begin{aligned} \frac{dy}{dx} &= e^{${up}} \times ${bracketNeg(k)} \\[4pt] &= ${k === -1 ? '-' : k}e^{${up}} \end{aligned} $$
          `,
        };
      },
    },
    {
      id: 'teach-root',
      type: 'info',
      title: 'Roots are powers too',
      text: r`
        In *Functions* you saw that a power of one half is a square root: $\sqrt{u} = u^{1/2}$.
        The power rule works for fractional powers as well (we take that on trust), so for $u > 0$

        $$ \frac{d}{du}\sqrt{u} = \tfrac12\,u^{-1/2} = \frac{1}{2\sqrt{u}} $$

        :::example
        Find the slope of $y = \sqrt{6x + 4}$ at $x = 2$.

        1. Inside: $u = 6x + 4$. At $x = 2$ it is $u = 16$, so $\sqrt{u} = 4$.
        2. Rate of the outside: $\dfrac{1}{2\sqrt{u}}$, which here is $\dfrac18$.
        3. Rate of the inside: $6$.
        4. Multiply the two rates: $\dfrac18 \times 6 = 0.75$.
        :::
      `,
    },
    {
      id: 'root',
      type: 'fill',
      title: 'A slope under a root',
      gen: (rng) => {
        const [size, c, root] = rng.pick(TRIPLES);
        const x = rng.bool(0.3) ? -size : size;
        const answer = x / root;
        return {
          text: r`
            The derivative of $\sqrt{u}$ is $\dfrac{1}{2\sqrt{u}}$, for $u > 0$.

            **Find the slope of $\;y = \sqrt{x^2 + ${c}}\;$ at $x = ${x}$.** (The inside is never negative, so this root exists for every $x$.)
          `,
          template: r`
            Inside: $u = x^2 + ${c}$. At $x = ${x}$ it is $u =$ [[${size * size + c}]], so $\sqrt{u} =$ [[${root}]].

            The outside changes at rate $\dfrac{1}{2\sqrt{u}}$, which here is 1 divided by [[${2 * root}]]. The inside changes at rate $2x =$ [[${2 * x}]].

            Slope of the curve (the product of the two rates): [[${num(answer)}]]
          `,
          hints: [
            r`$u = ${x < 0 ? `(${x})` : x}^2 + ${c}$. Its square root is a whole number.`,
            r`Multiply the two rates: $\dfrac{1}{${2 * root}} \times ${bracketNeg(2 * x)}$.`,
          ],
          explain: r`
            At $x = ${x}$: $u = ${size * size} + ${c} = ${size * size + c}$ and $\sqrt{u} = ${root}$.

            $$ \begin{aligned} \frac{dy}{dx} &= \frac{1}{2\sqrt{u}} \times 2x \\[4pt] &= \frac{1}{${2 * root}} \times ${bracketNeg(2 * x)} = ${num(answer)} \end{aligned} $$

            In general the derivative of $\sqrt{x^2 + ${c}}$ is $\dfrac{x}{\sqrt{x^2 + ${c}}}$.
          `,
        };
      },
    },
    {
      id: 'sort-slips',
      type: 'bucket',
      review: true,
      title: 'Right, or missing a factor?',
      text: 'Each line claims to be a derivative. **Sort them:** which are correct, and which have lost the derivative of the inside?',
      buckets: ['Correct', 'The inside factor is missing'],
      items: [
        { text: r`$(2x + 5)^3 \;\to\; 6(2x + 5)^2$`, bucket: 0 },
        { text: r`$(x^2 + 1)^4 \;\to\; 4(x^2 + 1)^3$`, bucket: 1, why: r`The inside $x^2 + 1$ has derivative $2x$, so the answer is $8x(x^2 + 1)^3$.` },
        { text: r`$e^{3x} \;\to\; 3e^{3x}$`, bucket: 0 },
        { text: r`$e^{x^2} \;\to\; e^{x^2}$`, bucket: 1, why: r`The inside $x^2$ has derivative $2x$, so the answer is $2x\,e^{x^2}$.` },
        { text: r`$(x + 7)^5 \;\to\; 5(x + 7)^4$`, bucket: 0, why: r`The inside $x + 7$ has derivative 1, and multiplying by 1 changes nothing. This one is complete.` },
        { text: r`$(1 - x)^2 \;\to\; 2(1 - x)$`, bucket: 1, why: r`The inside $1 - x$ has derivative $-1$, so the answer is $-2(1 - x)$. A factor of $-1$ is easy to lose.` },
      ],
      explain: r`
        Every time: differentiate the outside, then ask "what is the derivative of the inside?"
        and multiply by it, even when it is only $-1$. When it is 1, as for $x + 7$, nothing changes.
      `,
    },
    {
      id: 'balloon',
      type: 'numeric',
      stretch: true,
      title: 'Back to linked rates',
      gen: (rng) => {
        const radius = rng.pick([2, 3, 5, 10]);
        const rate = rng.pick([0.5, 2, 3]);
        const perCm = 4 * radius * radius;
        const answer = perCm * rate;
        return {
          text: r`
            A round balloon of radius $r$ cm has volume $V = \tfrac43\pi r^3$, so by the power rule
            $\dfrac{dV}{dr} = 4\pi r^2$.

            Air is pumped in so that the radius grows at **${num(rate)} cm per second**.
            **How fast is the volume growing at the moment when $r = ${radius}$ cm?**

            Type the number that goes in front of $\pi$.
          `,
          answer,
          unit: r`$\pi$ cm³ per second`,
          wrong: [
            [perCm, r`$${perCm}\pi$ is $\dfrac{dV}{dr}$: cm³ of volume per cm of radius. The radius itself is growing at ${num(rate)} cm each second, so multiply by ${num(rate)}.`],
            [perCm + rate, 'Rates along a chain multiply. They are not added.'],
            [answer * Math.PI, r`The $\pi$ is already written after the box. Type only the number in front of it.`],
          ],
          hints: [
            r`The chain is time $\to$ radius $\to$ volume. You need $\dfrac{dV}{dt} = \dfrac{dV}{dr} \times \dfrac{dr}{dt}$.`,
            r`At $r = ${radius}$, $\dfrac{dV}{dr} = 4\pi \times ${radius}^2 = ${perCm}\pi$.`,
          ],
          explain: r`
            $$ \begin{aligned} \frac{dV}{dt} &= \frac{dV}{dr} \times \frac{dr}{dt} \\[4pt] &= 4\pi \times ${radius}^2 \times ${num(rate)} \\[4pt] &= ${num(answer)}\pi \approx ${num(answer * Math.PI, 0)} \end{aligned} $$

            That is about ${num(answer * Math.PI, 0)} cm³ per second.

            The radius grows at a steady rate, but the volume does not: the bigger the balloon,
            the more air each extra centimetre of radius takes.
          `,
        };
      },
    },
  ],
  recap: [
    r`**Rates along a chain multiply:** $\dfrac{dy}{dx} = \dfrac{dy}{du} \times \dfrac{du}{dx}$.`,
    'For a function inside a function: differentiate the outside with the inside left alone, then multiply by the derivative of the inside.',
    r`$(5x - 2)^4 \to 4(5x - 2)^3 \times 5$, $\;e^{2x} \to e^{2x} \times 2$, $\;\sqrt{u} \to \dfrac{1}{2\sqrt{u}} \times \dfrac{du}{dx}$.`,
    'The classic slip is to stop after the outside. Always ask what the inside is doing.',
  ],
  next: 'Next: two things multiplied together, both changing at once. A growing rectangle shows what happens.',
};
