// The Secret Life of Numbers · Lesson 3 · Euclid's Shortcut
import { r, plural, gcd, lcm } from '../../../kit.js';
import { factorsOf, euclid, divisionTex, listAnd } from '../helpers.js';

/** Pairs with no common factor, chosen so that Euclid's algorithm takes two to four lines. */
const COPRIME = [[7, 3], [8, 3], [5, 3], [7, 5], [9, 4], [11, 4], [7, 4], [8, 5], [13, 5], [10, 3], [11, 3], [9, 7], [12, 5], [11, 8]];
/** Fractions in lowest terms. */
const REDUCED = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 7], [4, 7], [3, 8], [5, 8], [4, 9], [7, 9], [5, 12], [7, 12]];
/** Pairs that share a factor without one dividing the other: good for "when do they meet again?". */
const MEETING = [[4, 6], [6, 8], [6, 9], [8, 12], [9, 12], [10, 15], [12, 18], [12, 16], [10, 25], [15, 20], [6, 10], [9, 15], [14, 21], [8, 20]];

const linesList = (steps) => steps.map((st) => `- $${divisionTex(st)}$`).join('\n');

export default {
  id: 'gcd-euclid',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'The biggest tile',
      text: `
        A wall panel is **48 cm wide and 18 cm tall**. You want to cover it with identical **square** tiles: no cutting, no gaps.

        How long is the side of the **largest** tile that works? Take a guess.
      `,
      figure: {
        type: 'euclid-rect', mode: 'cut', a: 48, b: 18, unit: 'cm', static: true,
        alt: 'A rectangle 48 centimetres wide and 18 centimetres tall, drawn on a grid of 1 centimetre squares.',
      },
      min: 1, max: 18, step: 1, answer: 6, tolerance: 0, start: 1, unit: 'cm',
      explain: `
        The largest tile that fits is **6 cm**: 8 tiles across and 3 down.

        A 9 cm tile fits the height but not the width; so does an 18 cm one. How would you find the answer without guessing? That is what this lesson builds up to.
      `,
    },
    {
      id: 'tiles',
      type: 'interact',
      graded: false,
      title: 'Which tiles fit?',
      text: `
        Here is the panel. The slider changes the size of the tiles.

        6 cm tiles fit, and they are the largest that do. **Find every other tile size that fits exactly.**
      `,
      widget: { type: 'euclid-rect', mode: 'tile', a: 48, b: 18, unit: 'cm', tile: 6 },
      check: (s) => {
        if (s.complete) return true;
        const missing = s.common.filter((d) => !s.found.includes(d));
        if (s.found.length <= 1) return 'Move the slider. A tile size fits when no red gap is left.';
        if (missing.length === 1) return `One more to find. ${missing[0] === 1 ? 'Think small.' : 'Try every size from 1 to 18.'}`;
        return `You have found ${plural(s.found.length, 'size')} so far, and there are more. Try every tile side from 1 to 18.`;
      },
      solution: { tile: 1, found: [1, 2, 3, 6] },
      attempts: 6,
      hints: ['A tile fits when its side divides the width *and* the height.'],
      explain: `
        Four sizes fit: **1, 2, 3 and 6 cm**. Each of them divides both 48 and 18.

        A 9 cm tile divides 18 but not 48, so it leaves a gap along the width.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Greatest common divisor',
      text: r`
        A number that divides both 48 and 18 is a **common divisor** (or common factor) of the two. You just found them all:

        $$ 1, \quad 2, \quad 3, \quad 6 $$

        The largest is called the **greatest common divisor**, written **gcd**:

        $$ \gcd(48, 18) = 6 $$

        It is the side of the largest square tile that tiles a 48 × 18 rectangle.
      `,
    },
    {
      id: 'by-listing',
      type: 'numeric',
      gen: (rng) => {
        let a = 0;
        let b = 0;
        let g = 1;
        for (let guard = 0; guard < 100; guard++) {
          g = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
          const [x, y] = rng.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [3, 7]]);
          a = g * x;
          b = g * y;
          if (b <= 72) break;
        }
        const common = factorsOf(a).filter((d) => b % d === 0);
        return {
          text: r`
            Here are all the factors of two numbers.

            - **${a}:** ${factorsOf(a).join(', ')}
            - **${b}:** ${factorsOf(b).join(', ')}

            What is $\gcd(${a}, ${b})$?
          `,
          answer: g,
          wrong: [
            [1, '1 is a common divisor of every pair of numbers. Here there are bigger ones.'],
            [a, `${a} divides itself, but it does not divide ${b} exactly. The gcd has to divide both.`],
            [b, `${b} is the biggest factor of ${b}, but it is not a factor of ${a}.`],
          ],
          feedback: (v) => (Number.isInteger(v) && v > 0 && a % v === 0 && b % v === 0
            ? `${v} does divide both numbers, but a bigger number does too.`
            : `Look for numbers that appear in **both** lists. ${v} does not.`),
          hints: ['Find the numbers that appear in both lists. Then take the biggest.'],
          explain: `The numbers in both lists are ${listAnd(common)}. The greatest is **${g}**.`,
        };
      },
    },
    {
      id: 'cut',
      type: 'interact',
      title: "Euclid's shortcut",
      text: `
        Listing factors gets slow when the numbers are big. Around 300 BC, Euclid wrote down a method that needs no lists at all.

        Back to the 48 × 18 panel. **Cut off the biggest square you can, again and again, until nothing is left.** Keep an eye on the last square.
      `,
      widget: { type: 'euclid-rect', mode: 'cut', a: 48, b: 18 },
      check: (s) => s.done || `A ${s.remaining.w} × ${s.remaining.h} piece is still uncut. Keep going until nothing is left.`,
      solution: { done: true },
      attempts: 6,
      hints: ['Press the button, or tap the dashed piece. The biggest square is always as wide as the shorter side.'],
      explain: `
        The last square is **6 × 6**: the gcd, found without any guessing.

        Why does it work? A tile that fits the whole panel also fits each square you cut off, so it must fit the piece that is left. And a tile that fits the leftover piece fits the whole panel too.
        So every leftover piece has exactly the same fitting tiles as the panel. The final piece is a 6 × 6 square, and the biggest tile that fits a square is the square itself.
      `,
    },
    {
      id: 'bridge',
      type: 'fill',
      title: 'From squares to remainders',
      text: r`
        Cutting squares is division in disguise. From a strip 48 long you cut **two** squares of side 18, and 12 was left over:

        $$ 48 = 2 \times 18 + 12 $$

        The leftover piece measured 18 by 12. Carry on, in numbers only:
      `,
      template: r`
        $18 =$ [[1]] $\times\; 12 \;+$ [[6]]

        $12 =$ [[2]] $\times\; 6 \;+$ [[0]]
      `,
      hints: ['How many 12s fit into 18? What is left over?', 'The leftover from the first line (6) becomes the number you divide by in the second line.'],
      explain: `
        Each line divides by the remainder of the line before. When a remainder of **0** turns up, you stop:
        the number you just divided by, 6, is the gcd.
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: "Euclid's algorithm",
      text: r`
        That is the whole method.

        1. Divide the bigger number by the smaller one.
        2. Keep the **smaller number** and the **remainder**. Throw the bigger number away.
        3. Repeat until the remainder is 0. The last number you divided by is the gcd.

        | Division | Remainder |
        |----------|:---------:|
        | $48 = 2 \times 18 + 12$ | 12 |
        | $18 = 1 \times 12 + 6$ | 6 |
        | $12 = 2 \times 6 + 0$ | 0 |

        It is one of the oldest algorithms still in everyday use. Computers run it constantly, for instance whenever they simplify a fraction.
      `,
    },
    {
      id: 'order-lines',
      type: 'order',
      text: r`Put the lines of Euclid's algorithm for $\gcd(84, 30)$ in the right order.`,
      items: [
        r`$84 = 2 \times 30 + 24$`,
        r`$30 = 1 \times 24 + 6$`,
        r`$24 = 4 \times 6 + 0$`,
        r`So $\gcd(84, 30) = 6$`,
      ],
      labels: ['First', 'Last'],
      explain: 'Each line starts with the number the previous line divided by, and divides it by the previous remainder: 84 and 30, then 30 and 24, then 24 and 6.',
    },
    {
      id: 'euclid-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let a = 0;
        let b = 0;
        let g = 1;
        for (let guard = 0; guard < 100; guard++) {
          g = rng.pick([3, 4, 6, 7, 8, 9, 12, 14, 15, 18, 21]);
          const [x, y] = rng.pick(COPRIME);
          a = g * x;
          b = g * y;
          if (a <= 260 && !(a === 48 && b === 18)) break; // 48 and 18 are the lesson's worked example
        }
        const { steps } = euclid(a, b);
        return {
          text: r`Use Euclid's algorithm to find $\gcd(${a}, ${b})$.`,
          answer: g,
          wrong: [
            [steps[0].r, `${steps[0].r} is only the first remainder. Keep dividing until the remainder is 0.`],
            [1, 'The remainder never gets down to 1 here. Check each division again.'],
            [b, `${b} does not divide ${a} exactly, so it cannot be the gcd.`],
          ],
          feedback: (v) => (Number.isInteger(v) && v > 1 && a % v === 0 && b % v === 0 ? `${v} divides both numbers, but it is not the greatest number that does. Carry the algorithm through to remainder 0.` : null),
          hints: [
            `Divide ${a} by ${b}. What is the remainder?`,
            `$${divisionTex(steps[0])}$. Now divide ${steps[0].b} by ${steps[0].r}.`,
          ],
          // (built line by line: the list must start in column 0 to be read as a list)
          explain: [linesList(steps), '', `The remainder is 0, so the last number divided by is the gcd: **${g}**.`].join('\n'),
        };
      },
    },
    {
      id: 'example-fraction',
      type: 'info',
      title: 'What the gcd is for: fractions',
      text: r`
        A fraction keeps its value when the top and the bottom are divided by the same number. Divide both by their **gcd** and the fraction is simplified completely, in one move.

        :::example Simplify $\frac{20}{35}$
        Euclid's algorithm on 35 and 20:

        - $35 = 1 \times 20 + 15$
        - $20 = 1 \times 15 + 5$
        - $15 = 3 \times 5 + 0$

        So $\gcd(20, 35) = 5$. Divide the top and the bottom by 5:

        $$ \frac{20}{35} = \frac{20 \div 5}{35 \div 5} = \frac{4}{7} $$
        :::

        Nothing bigger than 1 divides both 4 and 7, so the fraction cannot be simplified any further.
      `,
    },
    {
      id: 'fraction',
      type: 'fill',
      review: true,
      title: 'Simplify in one move',
      gen: (rng) => {
        const [p, q] = rng.pick(REDUCED);
        const g = rng.pick([6, 8, 9, 12, 14, 15, 16, 18, 21, 24]);
        const n = p * g;
        const d = q * g;
        const { steps } = euclid(d, n);
        return {
          text: r`
            Dividing the top and bottom of a fraction by their gcd simplifies it completely, in one move.

            Simplify $\dfrac{${n}}{${d}}$.
          `,
          template: r`
            $\gcd(${n}, ${d}) =$ [[${g}]]

            $\dfrac{${n}}{${d}} =$ [[${p}]] / [[${q}]]
          `,
          hints: [`Run Euclid's algorithm on ${d} and ${n}. Start by dividing ${d} by ${n}.`, `The gcd is ${g}. Divide ${n} and ${d} by it.`],
          explain: [
            linesList(steps),
            '',
            `So the gcd is ${g}. Divide the top and the bottom by it:`,
            '',
            r`$$ \frac{${n}}{${d}} = \frac{${n} \div ${g}}{${d} \div ${g}} = \frac{${p}}{${q}} $$`,
            '',
            `Nothing bigger than 1 divides both ${p} and ${q}, so the fraction cannot be simplified any further.`,
          ].join('\n'),
        };
      },
    },
    {
      id: 'teach-lcm',
      type: 'info',
      title: 'The least common multiple',
      text: r`
        The gcd has a twin. A **common multiple** of two numbers is a number that both of them divide. The smallest one is their **least common multiple**, or **lcm**.

        :::example Two bells
        Two bells ring at the same moment. One rings every 4 minutes, the other every 10. When do they next ring together?

        At a common multiple of 4 and 10. Go through the multiples of 10 until 4 divides one:
        10 (no), **20** (yes, $20 = 4 \times 5$).

        So $\text{lcm}(4, 10) = 20$: they ring together again after 20 minutes.
        :::

        The gcd gives a shortcut: $\text{lcm} = 4 \times 10 \div \gcd(4, 10) = 40 \div 2 = 20$. Multiplying 4 by 10 counts their shared factor 2 twice, and dividing by the gcd takes one copy out again.
      `,
    },
    {
      id: 'meet-again',
      type: 'numeric',
      review: true,
      title: 'Meeting again',
      gen: (rng) => {
        const [a, b] = rng.pick(MEETING);
        const g = gcd(a, b);
        const m = lcm(a, b);
        const scene = rng.pick([
          { text: `Two lighthouses flash at the same moment. One flashes every **${a} seconds**, the other every **${b} seconds**.`, ask: 'After how many seconds do they next flash together?', unit: 'seconds' },
          { text: `Two buses leave the station together. One line runs every **${a} minutes**, the other every **${b} minutes**.`, ask: 'After how many minutes do two buses next leave together?', unit: 'minutes' },
          { text: `Two runners set off together from the start line. One takes **${a} minutes** per lap, the other **${b} minutes**.`, ask: 'After how many minutes are they next at the start line together?', unit: 'minutes' },
        ]);
        const multiples = [1, 2, 3, 4, 5, 6].map((k) => k * b).filter((v) => v <= m);
        return {
          text: `${scene.text}\n\n${scene.ask}`,
          answer: m,
          unit: scene.unit,
          wrong: [
            [a * b, `They do meet after ${a * b} ${scene.unit}, but that is not the *first* time.`],
            [g, `${g} is the greatest common divisor. This time you need a common *multiple*: a number both ${a} and ${b} divide.`],
            [a + b, 'Adding does not help here. You need the first number that is a multiple of both.'],
          ],
          hints: [
            `They meet at numbers that are multiples of both ${a} and ${b}.`,
            `List the multiples of ${b}: ${[1, 2, 3, 4].map((k) => k * b).join(', ')} … Which is the first one that ${a} divides?`,
          ],
          explain: r`
            Go through the multiples of ${b}: ${multiples.join(', ')}. The first one that ${a} divides is **${m}**, the **least common multiple** (lcm) of ${a} and ${b}.

            The gcd gives a shortcut:

            $$ \text{lcm} = \frac{${a} \times ${b}}{\gcd(${a}, ${b})} = \frac{${a * b}}{${g}} = ${m} $$
          `,
        };
      },
    },
    {
      id: 'neighbours',
      type: 'choice',
      stretch: true,
      text: r`No calculator needed. What is $\gcd(1{,}000{,}000,\ 1{,}000{,}001)$?`,
      shuffle: false,
      options: [
        { text: '1', correct: true },
        { text: '2', why: 'Two neighbouring numbers cannot both be even.' },
        { text: '1,000', why: '1,000 divides 1,000,000, but it leaves remainder 1 when it divides 1,000,001.' },
        { text: 'It cannot be found without a computer', why: "One line of Euclid's algorithm settles it: divide the bigger number by the smaller and look at the remainder." },
      ],
      hints: ["Write the first line of Euclid's algorithm. How many times does 1,000,000 go into 1,000,001, and what is left?"],
      explain: r`
        $1{,}000{,}001 = 1 \times 1{,}000{,}000 + 1$, and 1 divides everything, so the gcd is **1**.

        The same happens for any two neighbours: they never share a factor bigger than 1.
        That is the engine behind Euclid's "multiply the primes and add 1" argument in the last lesson: the new number is a neighbour of the product, so it shares none of its prime factors.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        You cut squares off a rectangle until nothing was left.

        **In your own words: why is the side of the last square the greatest common divisor?**
      `,
      model: `
        A square tile that fits the whole rectangle also fits every square I cut off, so it fits whatever is left over.
        It works the other way round too, so each leftover piece has exactly the same fitting tiles as the rectangle I started with.
        The last piece is itself a square, and the biggest tile that fits a square is that square. So its side is the biggest tile for the original rectangle: the gcd.
      `,
    },
  ],
  recap: [
    'The **gcd** of two numbers is the largest number that divides both: the side of the biggest square tile for an $a \\times b$ rectangle.',
    "**Euclid's algorithm:** divide, keep the smaller number and the remainder, repeat. When the remainder is 0, the last divisor is the gcd.",
    'Dividing the top and bottom of a fraction by their gcd simplifies it in one step.',
    'The least common multiple follows from the gcd: $\\text{lcm} = a \\times b \\div \\gcd(a, b)$.',
  ],
  next: 'Next: what happens to arithmetic when numbers go round in circles.',
};
