// Algebra II: Functions & Growth · Lesson 6 · Undoing a Power
import { r, num } from '../../../kit.js';
import { commas, texCommas } from '../helpers.js';

/** x → [2 to the power] → 2ˣ → [log₂] → x: a power and its logarithm undo each other. */
const slot = (x, inner) => `<rect class="fill-surface stroke-ink" stroke-width="2.5" x="${x}" y="24" width="72" height="50" rx="11"/>${inner}`;
const pill = (x, w, label) => `<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="${x}" y="26" width="${w}" height="46" rx="23"/><text class="fig-label" x="${x + w / 2}" y="54" text-anchor="middle">${label}</text>`;
const arrow = (x1, x2) => `<path class="fill-none stroke-ink" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M${x1} 49 H${x2} M${x2 - 7} 43.5 L${x2} 49 L${x2 - 7} 54.5"/>`;
const UNDO = {
  type: 'svg', viewBox: '0 0 584 98', maxWidth: 584,
  alt: 'A chain of two machines. A number x goes into the machine "2 to the power", which turns it into 2 to the power x. That goes into the machine "log base 2", and x comes out again.',
  content:
    slot(6, '<text class="fig-label-lg fig-math" style="font-size:26px" x="42" y="57" text-anchor="middle">x</text>') +
    arrow(84, 108) + pill(112, 138, '2 to the power') + arrow(254, 280) +
    slot(286, '<text class="fig-label-lg" x="317" y="59" text-anchor="middle">2<tspan class="fig-math" dy="-10" font-size="19">x</tspan></text>') +
    arrow(364, 390) + pill(394, 78, 'log₂') + arrow(476, 500) +
    slot(506, '<text class="fig-label-lg fig-math" style="font-size:26px" x="542" y="57" text-anchor="middle">x</text>') +
    '<text class="fig-label-sm" x="42" y="16" text-anchor="middle">in</text><text class="fig-label-sm" x="542" y="16" text-anchor="middle">out</text>',
};

export default {
  id: 'logarithms',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How many doublings?',
      text: `
        Start with 1 and keep doubling: 2, 4, 8, 16 …

        **How many doublings does it take to get past one million?** Make a guess.
      `,
      min: 0, max: 200, step: 1, start: 100, answer: 20,
      explain: r`
        Only 20: $\;2^{20} = 1{,}048{,}576$.

        "Which exponent do I need?" is a question that comes up all the time: how many folds, how many years, how many half-lives. It has its own name. The exponent that turns 2 into a given number is called the **logarithm** of that number.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The logarithm',
      text: r`
        :::key
        $\log_b x$ is the answer to the question: **$b$ to what power gives $x$?**
        :::

        The small number $b$ is the **base**. In this lesson it is always 2 or 10.

        | Logarithm | Because |
        |---|---|
        | $\log_2 8 = 3$ | $2^3 = 8$ |
        | $\log_{10} 1000 = 3$ | $10^3 = 1000$ |
        | $\log_2 \tfrac{1}{16} = -4$ | $2^{-4} = \tfrac{1}{16}$ |
        | $\log_{10} 1 = 0$ | $10^0 = 1$ |

        Each row is one fact, read in two directions:

        $$ b^{\,y} = x \qquad\Longleftrightarrow\qquad \log_b x = y $$
      `,
    },
    {
      id: 'find-power',
      type: 'interact',
      title: 'Read the curve backwards',
      text: r`
        This is $y = 2^x$. Going from $x$ up to the curve answers "what is 2 to this power?"

        Now go the other way, to find $\log_2 6$: 2 to what power gives 6? **Drag the point until its height is 6.**
      `,
      widget: {
        type: 'plot', x: [-1, 4], y: [-1, 10], xStep: 1, yStep: 2,
        fns: [{ expr: '2^x', color: 'blue' }],
        hlines: [{ y: 6, color: 'orange', dashed: true }],
        points: [{ id: 'P', x: 1, on: 0, drag: 'x', snap: 0.05, color: 'orange' }],
        segments: [{ from: 'P', to: ['Px', 0], color: 'orange', dashed: true }],
        readouts: [
          { label: 'power $x$', expr: 'Px', digits: 2, color: 'orange' },
          { label: '$2^x$', expr: 'f0(Px)', digits: 2, color: 'blue' },
        ],
        alt: 'The curve y = 2 to the power x, with a point that can be dragged along it. A dashed line marks the height 6. Readouts show the power and the value.',
      },
      check: (s) => {
        if (Math.abs(s.P.x - 2.585) <= 0.04) return true;
        return s.P.y < 6
          ? r`$2^{${num(s.P.x, 2)}}$ is about ${num(s.P.y, 2)}: too low. Move to the right.`
          : r`$2^{${num(s.P.x, 2)}}$ is about ${num(s.P.y, 2)}: too high. Move to the left.`;
      },
      solution: { P: { x: 2.6 } },
      explain: r`
        About 2.58. No whole number works, since $2^2 = 4$ and $2^3 = 8$, but the curve has no gaps, so somewhere in between there is a power that gives exactly 6.

        That power is the **logarithm of 6 to base 2**: $\;\log_2 6 \approx 2.58$. A logarithm does not have to be a whole number.

        (That $2^x$ makes sense for every $x$, not only for whole numbers and simple fractions, is something we are taking on trust here.)
      `,
    },
    {
      id: 'evaluate',
      type: 'numeric',
      plain: true,
      review: true,
      gen: (rng) => {
        const b = rng.pick([2, 10]);
        const e = b === 2 ? rng.int(-3, 8) : rng.int(-3, 5);
        const size = b ** Math.abs(e);
        const x = e >= 0 ? texCommas(size) : b === 2 ? r`\tfrac{1}{${size}}` : num(1 / size, 6);
        const wrong = [];
        let hint;
        if (e > 0) {
          wrong.push([size / b, r`$\log_{${b}} ${x}$ is not $${x} \div ${b}$. Ask instead: ${b} to what power gives ${commas(size)}?`]);
          hint = e === 1 ? r`$${b}^1 = ${b}$.` : r`Count the factors: $${x} = ${Array(e).fill(b).join(r` \times `)}$.`;
        } else if (e === 0) {
          wrong.push([1, r`$${b}^1$ is ${b}, not 1. Which power of ${b} gives 1?`]);
          hint = 'Any number (except 0) to the power 0 is 1.';
        } else {
          wrong.push([-e, r`Right size, wrong sign: $${b}^{${-e}} = ${texCommas(size)}$. You need one divided by that.`]);
          wrong.push([-size, 'The logarithm is an exponent. Think of negative exponents: they mean "one divided by".']);
          hint = r`$${x}$ is 1 divided by $${b}^{${-e}}$. Which exponent means "one divided by"?`;
        }
        return {
          text: r`**What is $\;\log_{${b}} ${x}\,$?**`,
          answer: e,
          wrong,
          hints: [`Ask: ${b} to what power gives this number?`, hint],
          explain: r`$${b}^{${e}} = ${x}$, so $\log_{${b}} ${x} = ${e}$.`,
        };
      },
    },
    {
      id: 'undo',
      type: 'fill',
      title: 'Each undoes the other',
      text: r`
        "Raise 2 to the power" and "take $\log_2$" are opposite machines. Send a number through both and it comes back unchanged.
      `,
      figure: UNDO,
      template: r`
        $\log_2\!\left(2^{9}\right) =$ [[9]]

        $\log_{10}\!\left(10^{-4}\right) =$ [[-4]]

        $10^{\,\log_{10} 500} =$ [[500]]
      `,
      hints: [r`The first one asks: 2 to what power gives $2^9$? The answer is in the question.`, r`$\log_{10} 500$ is, by definition, the power that turns 10 into 500. The third line raises 10 to exactly that power.`],
      explain: r`
        $\log_2(2^9)$ asks "2 to what power gives $2^9$?", and the answer is 9. In the last line, $\log_{10} 500$ is the power that turns 10 into 500, so raising 10 to it gives 500.

        Subtracting undoes adding, dividing undoes multiplying, and a logarithm undoes a power.
      `,
    },
    {
      id: 'impossible',
      type: 'choice',
      title: 'Not every number has one',
      text: r`
        The curve $y = 2^x$ stays above the axis: a power of 2 is positive, whatever the exponent.

        **Which of these has no value** among the numbers on the number line?
      `,
      options: [
        { text: r`$\log_2 (-4)$`, correct: true },
        { text: r`$\log_2 \frac14$`, why: r`That is $-2$, because $2^{-2} = \frac14$. A negative **answer** is fine.` },
        { text: r`$\log_2 1$`, why: r`That is 0, because $2^0 = 1$.` },
        { text: r`$\log_2 2$`, why: r`That is 1, because $2^1 = 2$.` },
      ],
      explain: r`
        Powers of 2 are always positive: $2^3 = 8$, $\;2^0 = 1$, $\;2^{-3} = \frac18$. No exponent makes $2^x$ equal to $-4$, or to 0.

        So only **positive** numbers have logarithms. The logarithm itself can be any number: negative, zero or positive.
      `,
    },
    {
      id: 'slide',
      type: 'interact',
      title: 'Multiply by sliding',
      text: r`
        Both scales carry the powers of 2 at equal distances, so each step to the right doubles. The upper strip slides.

        **Use it to work out $8 \times 16$:** put the strip's 1 above 8, then read the number under the strip's 16.
      `,
      widget: {
        type: 'slide-rule', base: 2, steps: 8, shift: 2, read: 3,
        alt: 'Two identical scales marked 1, 2, 4, 8 and so on up to 256. The upper one can be slid to the right. A frame marks where its 1 sits, and another marks the number being read.',
      },
      check: (s) => {
        const pair = [s.a, s.b].sort((u, v) => u - v);
        if (pair[0] === 8 && pair[1] === 16) return true;
        if (!s.onScale) return r`The strip's ${s.b} has slid past the end of the fixed scale. For $8 \times 16$, put the strip's 1 above 8 and read under its 16.`;
        return r`Right now the rule shows $${s.a} \times ${s.b} = ${s.product}$. For $8 \times 16$, put the strip's 1 above 8 and read under its 16.`;
      },
      solution: { shift: 3, read: 4 },
      explain: r`
        $8 \times 16 = 128$, and you never multiplied. Sliding the strip **adds lengths**: 3 steps for the 8, plus 4 steps for the 16, makes 7 steps, and 7 steps along the scale is $2^7 = 128$.

        This is a **slide rule**. John Napier published the first tables of logarithms in 1614, the slide rule followed in the 1620s, and engineers went on using it until pocket calculators replaced it in the 1970s.
      `,
    },
    {
      id: 'log-rules',
      type: 'info',
      title: 'Two rules from the slide rule',
      text: r`
        On the slide rule, the number of steps to a number is its logarithm: 3 steps to 8, 4 steps to 16, and $3 + 4 = 7$ steps to $8 \times 16$.

        :::key
        **Product rule:** $\;\log_b (x \cdot y) = \log_b x + \log_b y$

        **Power rule:** $\;\log_b\!\left(x^n\right) = n \cdot \log_b x$
        :::

        The power rule is the product rule used $n$ times: $x^n$ is $x$ used as a factor $n$ times.

        :::example
        $200{,}000 = 100{,}000 \times 2$. With $\log_{10} 100{,}000 = 5$ and $\log_{10} 2 \approx 0.301$, add: $\;\log_{10} 200{,}000 \approx 5 + 0.301 = 5.301$.
        :::
      `,
      figure: {
        type: 'slide-rule', base: 2, steps: 8, shift: 3, read: 4, static: true,
        alt: 'The slide rule with the strip moved 3 steps to the right, so that its 1 sits above 8. Under the strip mark 16, 4 steps further on, the fixed scale reads 128: 3 steps + 4 steps = 7 steps.',
      },
    },
    {
      id: 'product-rule',
      type: 'numeric',
      plain: true,
      review: true,
      gen: (rng) => {
        const rule = r`The logarithm of a product is the **sum** of the logarithms: $\;\log_b (x \cdot y) = \log_b x + \log_b y$.`;
        if (rng.bool()) {
          const m = rng.int(2, 6);
          const n = rng.intExcept(2, 6, [m]);
          const [x, y] = [2 ** m, 2 ** n];
          return {
            title: 'Multiplying becomes adding',
            text: r`
              ${rule}

              You are told that $\log_2 ${x} = ${m}$ and $\log_2 ${y} = ${n}$. **What is $\log_2 (${x} \times ${y})$?**
            `,
            answer: m + n,
            wrong: [[m * n, r`The logarithms are **added**, not multiplied: ${m} + ${n}.`]],
            hints: ['Add the two logarithms you were given.'],
            explain: r`$\log_2 (${x} \times ${y}) = ${m} + ${n} = ${m + n}$. Check: $${x} \times ${y} = ${texCommas(x * y)} = 2^{${m + n}}$. It is the rule $2^m \cdot 2^n = 2^{m+n}$ read backwards.`,
          };
        }
        const [d, L] = rng.pick([[2, 0.301], [3, 0.477], [5, 0.699], [7, 0.845]]);
        const k = rng.int(1, 4);
        const big = d * 10 ** k;
        return {
          title: 'Multiplying becomes adding',
          text: r`
            ${rule}

            You are told that $\log_{10} ${d} \approx ${L}$. **What is $\log_{10} ${texCommas(big)}$, to three decimal places?**
          `,
          answer: k + L,
          tolerance: 0.0006,
          wrong: [[k * L, r`The logarithms are **added**: $\log_{10} ${texCommas(10 ** k)} + \log_{10} ${d} = ${k} + ${L}$.`]],
          hints: [
            r`Split the number into a product: $${texCommas(big)} = ${texCommas(10 ** k)} \times ${d}$.`,
            r`$\log_{10} ${texCommas(10 ** k)} = ${k}$, because $10^{${k}} = ${texCommas(10 ** k)}$. Now add.`,
          ],
          explain: r`$${texCommas(big)} = ${texCommas(10 ** k)} \times ${d}$, so $\log_{10} ${texCommas(big)} = \log_{10} ${texCommas(10 ** k)} + \log_{10} ${d} \approx ${k} + ${L} = ${num(k + L)}$.`,
        };
      },
    },
    {
      id: 'power-rule',
      type: 'numeric',
      plain: true,
      gen: (rng) => {
        const [b, x, L] = rng.pick([[2, 4, 2], [2, 8, 3], [2, 16, 4], [2, 32, 5], [10, 100, 2], [10, 1000, 3]]);
        const n = rng.int(3, 9);
        return {
          title: 'Powers come down',
          text: r`
            $${x}^{${n}}$ is $${x}$ used as a factor ${n} times, so by the product rule its logarithm is $\log_{${b}} ${x}$ added up ${n} times.

            You are told that $\log_{${b}} ${x} = ${L}$. **What is $\log_{${b}}\!\left(${x}^{${n}}\right)$?**
          `,
          answer: n * L,
          wrong: [[n + L, `Adding ${L} up ${n} times gives ${n} × ${L}, not ${n} + ${L}.`]],
          hints: [`${L} + ${L} + … (${n} times) is ${n} × ${L}.`],
          explain: r`
            $\log_{${b}}\!\left(${x}^{${n}}\right) = ${n} \times \log_{${b}} ${x} = ${n} \times ${L} = ${n * L}$.

            That is the power rule at work: the exponent comes down in front. Check: $${x}^{${n}} = \left(${b}^{${L}}\right)^{${n}} = ${b}^{${n * L}}$.
          `,
        };
      },
    },
    {
      id: 'example-exponent',
      type: 'info',
      title: 'Worked example: solving for an exponent',
      text: r`
        When the unknown sits in the exponent, get the power alone first. Then the question is "to what power?", and that is a logarithm.

        :::example
        Solve $6 \cdot 2^{\,x} = 96$.

        | Line | Why |
        |---|---|
        | $2^{\,x} = 16$ | divide both sides by 6 |
        | $x = \log_2 16$ | 2 to what power gives 16? |
        | $x = 4$ | because $2^4 = 16$ |
        :::

        Check: $6 \times 2^4 = 6 \times 16 = 96$.
      `,
    },
    {
      id: 'solve',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const b = rng.pick([2, 10]);
        const e = b === 2 ? rng.int(3, 7) : rng.int(2, 5);
        const c = rng.pick([1, 1, 3, 5, 7]);
        const power = b ** e;
        const rhs = c * power;
        const equation = c === 1 ? r`${b}^{\,x} = ${texCommas(rhs)}` : r`${c} \cdot ${b}^{\,x} = ${texCommas(rhs)}`;
        return {
          title: 'An unknown in the exponent',
          text: r`
            **Solve for $x$.**

            $$ ${equation} $$
          `,
          answer: e,
          prefix: '$x =$',
          wrong: [[rhs / (c * b), r`$${b}^{\,x}$ is not $${b} \times x$. ${c === 1 ? 'Ask' : `After dividing by ${c}, ask`}: ${b} to what power gives ${commas(power)}?`]],
          hints: c === 1
            ? [r`This is exactly the question a logarithm answers: $x = \log_{${b}} ${texCommas(power)}$.`, `${b} to what power gives ${commas(power)}? Count the factors.`]
            : [r`First get the power alone: divide both sides by ${c}. That gives $${b}^{\,x} = ${texCommas(power)}$.`, r`Now $x = \log_{${b}} ${texCommas(power)}$: ${b} to what power gives ${commas(power)}?`],
          explain: c === 1
            ? r`$x = \log_{${b}} ${texCommas(power)} = ${e}$, because $${b}^{${e}} = ${texCommas(power)}$.`
            : r`Divide by ${c}: $\;${b}^{\,x} = ${texCommas(power)}$. Then $x = \log_{${b}} ${texCommas(power)} = ${e}$, because $${b}^{${e}} = ${texCommas(power)}$.`,
        };
      },
    },
    {
      id: 'log-scale',
      type: 'interact',
      title: 'A ruler for giant ranges',
      text: `
        On this number line every step to the right **multiplies by 10**, just as every step on the slide rule doubled. It runs from 1 to a million.

        **Where does 1,000 belong? Drag the marker there.**
      `,
      widget: {
        type: 'number-line', min: 0, max: 6, step: 1, major: 1, tick: 1,
        format: (v) => commas(Math.round(10 ** v)),
        points: [{ id: 'p', value: 0, color: 'orange' }],
        alt: 'A number line whose marks read 1, 10, 100, 1,000 and so on up to 1,000,000, equally spaced. A marker can be dragged along it.',
      },
      check: (s) => {
        if (s.p === 3) return true;
        return `The marker is on ${commas(Math.round(10 ** s.p))}. ${s.p < 3 ? 'Each step to the right multiplies by 10: keep going.' : 'That is too far: each step to the left divides by 10.'}`;
      },
      solution: { p: 3 },
      explain: r`
        Right in the **middle**. On an ordinary ruler from 1 to a million, 1,000 would be squeezed against the left-hand end, a thousandth of the way along.

        On a **logarithmic scale** the position of a number is its logarithm: $\log_{10} 1000 = 3$ is halfway to $\log_{10} 1{,}000{,}000 = 6$. Such scales are used whenever the numbers range from tiny to enormous.
      `,
    },
    {
      id: 'quake',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const low = rng.int(3, 5);
        const diff = rng.int(2, 4);
        const high = low + diff;
        const times = 10 ** diff;
        return {
          title: 'Earthquakes',
          text: `
            The magnitude of an earthquake is a logarithmic scale: with each whole step up, the shaking recorded by a seismograph is **10 times** as large.

            **How many times as large is the recorded shaking in a magnitude ${high} earthquake as in a magnitude ${low}?**
          `,
          answer: times,
          unit: 'times',
          wrong: [
            [diff, `The scale counts **powers** of ten. ${diff} steps means multiplying by 10, ${diff} times over.`],
            [10 * diff, 'Each step multiplies by 10. The steps multiply together; they do not add.'],
          ],
          hints: [`From ${low} to ${high} is ${diff} steps on the scale, and each step is a factor of 10.`],
          explain: r`${diff} steps on the scale: $10^{${diff}} = ${texCommas(times)}$ times the shaking. (The energy released grows even faster: about 32 times with every step.)`,
        };
      },
    },
    {
      id: 'direct',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const k = rng.int(3, 7);
        const target = 10 ** k;
        const x = k / Math.log10(2);
        const lo = Math.floor(x);
        return {
          title: 'No more trial and error',
          text: r`
            In the last lesson you hunted for an exponent by trying one after another. Now do it directly. To solve

            $$ 2^{\,x} = ${texCommas(target)} $$

            take $\log_{10}$ of both sides. The power rule brings $x$ down: $\;x \cdot \log_{10} 2 = \log_{10} ${texCommas(target)}$.

            Use $\log_{10} 2 \approx 0.301$. **What is $x$, to one decimal place?**
          `,
          answer: x,
          tolerance: 0.05,
          display: num(x, 1),
          prefix: '$x \\approx$',
          wrong: [[k * 0.301, r`You multiplied by 0.301. The equation says $x \times 0.301 = ${k}$, so **divide**: $x = ${k} \div 0.301$.`]],
          hints: [
            r`$\log_{10} ${texCommas(target)} = ${k}$, because $10^{${k}} = ${texCommas(target)}$.`,
            r`So $x \times 0.301 = ${k}$. Divide ${k} by 0.301.`,
          ],
          explain: r`
            $x = ${k} \div 0.301 \approx ${num(k / 0.301, 1)}$.

            It fits: $2^{${lo}} = ${texCommas(2 ** lo)}$ is below ${commas(target)} and $2^{${lo + 1}} = ${texCommas(2 ** (lo + 1))}$ is above it. Any equation with the unknown in the exponent can be solved this way.
          `,
        };
      },
    },
    {
      id: 'backwards',
      type: 'match',
      title: 'The same facts, read backwards',
      text: 'Every fact about powers is also a fact about logarithms. **Match each one with its other half.**',
      pairs: [
        [r`$2^5 = 32$`, r`$\log_2 32 = 5$`],
        [r`$10^{-2} = 0.01$`, r`$\log_{10} 0.01 = -2$`],
        [r`$2^0 = 1$`, r`$\log_2 1 = 0$`],
        [r`$2^3 \cdot 2^4 = 2^7$`, r`$\log_2 8 + \log_2 16 = \log_2 128$`],
        [r`$(2^3)^4 = 2^{12}$`, r`$4 \times \log_2 8 = \log_2 (8^4)$`],
      ],
      hints: [r`A logarithm is an exponent. Look for the same exponents on both sides: for example, $\log_2 8$ is 3 and $\log_2 16$ is 4.`],
      explain: r`
        In $b^y = x$ the exponent is $y$, and in $\log_b x = y$ the same $y$ is the answer: **a logarithm is an exponent**.

        So the rules of logarithms are the rules of exponents seen from the other side. Multiplying powers adds exponents, which is the product rule. A power of a power multiplies exponents, which is the power rule.
      `,
    },
  ],
  recap: [
    '$\\log_b x$ answers the question "$b$ to what power gives $x$?" A logarithm is an exponent.',
    'Logarithms undo powers: $\\log_b(b^x) = x$. Only positive numbers have a logarithm.',
    'Product rule: $\\log_b(xy) = \\log_b x + \\log_b y$. Power rule: $\\log_b(x^n) = n \\log_b x$.',
    'On a logarithmic scale, equal steps multiply. That is how earthquake magnitudes work.',
  ],
  next: 'Next: back to the parabola, to find a formula that solves every quadratic equation.',
};
