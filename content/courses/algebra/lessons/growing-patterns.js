// Algebra Foundations · Lesson 4 · Growing Patterns
import { r } from '../../../kit.js';

export default {
  id: 'growing-patterns',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Skip ahead',
      text: 'Here are the first three steps of a pattern made of tiles. **How many tiles will step 10 have?**',
      figure: {
        type: 'tile-pattern', shape: 'L', steps: [1, 2, 3], ask: 10, color: 'plain',
        alt: 'Three L-shaped figures made of square tiles. Step 1 has 3 tiles, step 2 has 5 tiles and step 3 has 7 tiles. A question mark stands for step 10.',
      },
      shuffle: false,
      options: [
        { text: '20' },
        { text: '21', correct: true },
        { text: '23' },
        { text: '30' },
      ],
      explain: `
        Step 10 has 21 tiles. You could count on in twos: 3, 5, 7, 9 … all the way to step 10.

        But there is a way to jump straight there, and it works just as well for step 1000. It starts with *seeing* how the pattern is built.
      `,
    },
    {
      id: 'teach-growing',
      type: 'info',
      title: 'How a pattern grows',
      text: `
        In a **growing pattern** each step is built from the step before it. To see how, compare neighbours.

        These steps have 3, 5 and 7 tiles. From each step to the next, **2 tiles** are added, one at the tip of each arm. The tiles that are new in a step are marked.

        This pattern adds the same amount every time. That steadiness is what will let you jump ahead.
      `,
      figure: {
        type: 'tile-pattern', shape: 'L', steps: [1, 2, 3], color: 'new',
        alt: 'Steps 1, 2 and 3 of the L-shaped tile pattern, with 3, 5 and 7 tiles. In every step the two tiles that were added last carry a plus sign: one at the tip of each arm.',
      },
    },
    {
      id: 'build-next',
      type: 'interact',
      title: 'Build the next one',
      text: 'Below is **step 3**. Tap empty spots to add tiles and turn it into **step 4**.',
      figure: {
        type: 'tile-pattern', shape: 'L', steps: [1, 2, 3], color: 'plain', cell: 22,
        alt: 'Steps 1, 2 and 3 of the L-shaped tile pattern, with 3, 5 and 7 tiles.',
      },
      widget: { type: 'tile-pattern', shape: 'L', n: 3, mode: 'build' },
      check: (s) => {
        if (s.complete) return true;
        if (s.added.length < 2) return 'Step 4 needs more tiles than that. Compare steps 1, 2 and 3: how many are added each time?';
        if (s.added.length > 2) return 'Too many. Each step adds the same number of tiles as the step before it did.';
        return 'Right number of tiles, but the shape is off. Each arm of the L grows by one tile, at its tip.';
      },
      solution: { added: [[0, -4], [4, 0]] },
      hints: [
        'From step 2 to step 3, each arm of the L got one tile longer.',
        'Add one tile on top of the upright arm and one at the end of the flat arm.',
      ],
      explain: 'Each step adds **2 tiles**, one at the tip of each arm. Nothing else changes.',
    },
    {
      id: 'see-parts',
      type: 'interact',
      graded: false,
      title: 'What stays, what grows',
      text: `
        The same pattern, now with a slider. One tile is marked with a dot: it is there in every step. The other tiles belong to the two growing arms.

        **Slide to the step that has exactly 13 tiles.**
      `,
      widget: { type: 'tile-pattern', shape: 'L', n: 2, min: 1, max: 8 },
      check: (s) => s.total === 13 || (s.total < 13
        ? `Step ${s.n} has ${s.total} tiles. You need more.`
        : `Step ${s.n} has ${s.total} tiles. That is too many.`),
      solution: { n: 6 },
      explain: r`
        Step 6: the corner tile, plus two arms of 6 tiles each. $2 \times 6 + 1 = 13.$

        Did you notice? Each arm is exactly as long as the step number. So there is no need to count on: step 10 has $2 \times 10 + 1 = 21$ tiles.
      `,
    },
    {
      id: 'rule',
      type: 'info',
      title: 'A rule for every step',
      text: r`
        Call the step number $n.$ Each of the two arms has $n$ tiles, and the corner tile is always there:

        $$ \text{tiles} = \blue{2n} + \orange{1} $$

        Writing $2n$ is short for $2 \times n.$ The letter $n$ is a **variable**: it stands for whichever step you choose. And $2n + 1$ is an **expression**, a recipe for turning a step number into a tile count.

        :::key
        The amount [added each step]{.blue} multiplies $n.$ The part that is [always there]{.orange} gets added on.
        :::

        :::example
        Step 40: put 40 in place of $n.$ Multiply first, then add: $\mathord{2 \times 40 + 1} = 81$ tiles.
        :::
      `,
      figure: {
        type: 'tile-pattern', shape: 'L', n: 4, min: 1, max: 6, rule: true,
        alt: 'The L-shaped pattern with a step slider. At step 4 there is one corner tile and two arms of four tiles: 2 times 4, plus 1.',
      },
    },
    {
      id: 'use-rule',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 6);
        const b = rng.int(1, 9);
        const n = rng.pick([10, 12, 15, 20, 25, 30, 50, 100]);
        const thing = rng.pick(['tiles', 'matchsticks', 'beads', 'dots']);
        return {
          text: r`A pattern has $\;${a}n + ${b}\;$ ${thing} in step $n.$ **How many ${thing} are in step ${n}?**`,
          answer: a * n + b,
          unit: thing,
          wrong: [
            [(a + b) * n, r`Multiply first, then add: work out $${a} \times ${n},$ and only then add the ${b}.`],
            [a + n + b, r`$${a}n$ means $${a} \times n,$ not $${a} + n.$`],
            [Number(`${a}${n}`) + b, r`$${a}n$ means ${a} *times* $n.$ Here that is $${a} \times ${n} = ${a * n},$ not the digits ${a} and ${n} written side by side.`],
            [a * n, `That is the growing part. Do not forget the ${b} that are always there.`],
          ],
          hints: [r`Put ${n} in place of $n{:}$ $\;${a} \times ${n} + ${b}.$`],
          explain: r`Replace $n$ with ${n}: $\;${a} \times ${n} + ${b} = ${a * n} + ${b} = ${a * n + b}.$`,
        };
      },
    },
    {
      id: 'plus-rule',
      type: 'fill',
      title: 'Your turn to find the rule',
      text: 'A new pattern, all in one colour this time. Move the slider and look for what stays and what grows. **Complete the rule for step $n.$**',
      figure: {
        type: 'tile-pattern', shape: 'plus', n: 1, min: 1, max: 4, color: 'plain', cell: 26,
        alt: 'A plus-shaped tile pattern with a step slider. Step 1 has 5 tiles, step 2 has 9, step 3 has 13 and step 4 has 17.',
      },
      template: r`tiles $=$ [[4]]$n \;+$ [[1]]`,
      hints: [
        'Slide from one step to the next. How many tiles are added each time?',
        'There are four arms, each $n$ tiles long, around one tile in the middle.',
      ],
      explain: r`Four arms of $n$ tiles make $4n,$ and the middle tile is always there: $4n + 1.$ Check step 3: $4 \times 3 + 1 = 13$ ✓`,
    },
    {
      id: 'step-zero',
      type: 'numeric',
      title: 'Step zero',
      text: r`
        This pattern follows the rule $\;3n + 2.$ Its slider goes all the way down to **step 0**, before any growing has happened.

        **How many tiles does step 0 have?**
      `,
      figure: {
        type: 'tile-pattern', shape: 'row', grow: 3, start: 2, n: 3, min: 0, max: 6, counts: false,
        alt: 'A tile pattern with a step slider that starts at 0. Two marked tiles stay in place while columns of three tiles are added, one column per step.',
      },
      answer: 2,
      unit: 'tiles',
      wrong: [
        [0, 'Slide down to step 0 and look again: the growing columns are gone, but something is left.'],
        [5, r`That is step 1. At step 0, $n = 0,$ so the rule gives $3 \times 0 + 2.$`],
        [3, 'Three is how many are added per step. What is left when none have been added yet?'],
      ],
      explain: r`At step 0 nothing has been added yet: $3 \times 0 + 2 = 2.$ Only the fixed part is left.`,
    },
    {
      id: 'teach-table-rule',
      type: 'info',
      title: 'From a list of counts to a rule',
      text: r`
        What you saw at step 0 is true of every rule: **the number added on is the count at step 0**, before anything has grown. So a rule can be read off a table in two moves.

        :::example
        | Step $n$ | 1 | 2 | 3 | 4 |
        |---|---|---|---|---|
        | Count | 13 | 23 | 33 | 43 |

        1. The count goes up by **10** each step, so the rule starts with $10n.$
        2. Step back from step 1 to step 0: $\;\mathord{13 - 10 = 3}.$ That is the number added on.

        Rule: $\;10n + 3.$ Check step 4: $\;\mathord{10 \times 4 + 3 = 43}$ ✓
        :::
      `,
    },
    {
      id: 'table-rule',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 6);
        const b = rng.intExcept(2, 9, [a]);
        const row = [1, 2, 3, 4].map((n) => a * n + b);
        return {
          text: r`
            Which rule fits this table?

            | Step $n$ | 1 | 2 | 3 | 4 |
            |---|---|---|---|---|
            | Count | ${row.join(' | ')} |
          `,
          options: [
            { text: r`$${a}n + ${b}$`, correct: true },
            { text: r`$${a}n + ${a + b}$`, why: r`The table does start at ${a + b}. But put $n = 1$ into this rule and you get ${2 * a + b}. The number added on is the count at step 0, one step *before* the table starts.` },
            { text: r`$${b}n + ${a}$`, why: r`The count goes up by ${a} each step, so ${a} is the number that multiplies $n.$` },
            { text: r`$n + ${a}$`, why: r`"Add ${a} each time" tells you how to get from one step to the next. But this rule gives ${1 + a} for step 1, not ${a + b}.` },
          ],
          hints: [
            r`How much does the count go up from one step to the next? That number multiplies $n.$`,
            `Step back from step 1 to step 0 by taking the growth away once: ${a + b} − ${a}.`,
          ],
          explain: r`The count grows by ${a} each step, so the rule starts with $${a}n.$ Step 0 would have $${a + b} - ${a} = ${b},$ so the rule is $${a}n + ${b}.$ Check step 4: $${a} \times 4 + ${b} = ${4 * a + b}$ ✓`,
        };
      },
    },
    {
      id: 'picture-rule',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 4);
        const b = rng.intExcept(1, 4, [a]);
        const counts = [1, 2, 3].map((n) => a * n + b);
        return {
          text: r`Here are steps 1, 2 and 3 of a tile pattern. **Write an expression for the number of tiles in step $n.$**`,
          figure: {
            type: 'tile-pattern', shape: 'row', grow: a, start: b, steps: [1, 2, 3], color: 'plain',
            alt: `Three steps of a tile pattern with ${counts.join(', ')} tiles. Each step has one more column of ${a} tiles than the step before, next to a column of ${b} that never changes.`,
          },
          answer: `${a}n + ${b}`,
          vars: ['n'],
          prefix: 'tiles $=$',
          placeholder: 'expression in n',
          wrong: [
            [`${a}n`, `That counts the columns that are added. Look at the left-hand end: ${b === 1 ? 'one tile is' : `${b} tiles are`} there in every step.`],
            [`${a}n + ${a + b}`, `Step 1 does have ${a + b} tiles. But ${a} of those are already the first added column. The part that never changes is smaller.`],
            [`${b}n + ${a}`, `Check step 2: that would give ${2 * b + a}, but the picture shows ${2 * a + b}. Which number is added at every step?`],
            [`n + ${a}`, `Adding ${a} once is not enough: ${a} tiles are added at *every* step, so ${a} has to multiply $n.$`],
            [`${a + b}n`, `That fits step 1 only. Step 2 has ${2 * a + b} tiles, not ${2 * (a + b)}.`],
          ],
          hints: [
            `Count the tiles: ${counts.join(', ')}. How many are added from one step to the next?`,
            `Each step adds one column of ${a}. The column on the far left never changes.`,
          ],
          explain: r`Each step adds a column of ${a}, so the growing part is $${a}n.$ The ${b === 1 ? 'single tile' : `${b} tiles`} on the left ${b === 1 ? 'is' : 'are'} always there: $${a}n + ${b}.$ Check step 3: $${a} \times 3 + ${b} = ${3 * a + b}$ ✓`,
        };
      },
    },
    {
      id: 'teach-backwards',
      type: 'info',
      title: 'A rule runs both ways',
      text: r`
        A rule takes you from a step to its count. It also takes you back. If you know the count, the rule becomes an **equation** for $n,$ and you solve it as in the last lessons.

        :::example
        The L pattern has $2n + 1$ tiles in step $n.$ Which step has 201 tiles?

        | Equation | Move, on both sides |
        |---|---|
        | $\mathord{2n + 1 = 201}$ | |
        | $\mathord{2n = 200}$ | subtract 1 |
        | $\mathord{n = 100}$ | divide by 2 |

        Step 100. Check: $\;\mathord{2 \times 100 + 1 = 201}$ ✓
        :::
      `,
    },
    {
      id: 'which-step',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(6, 20);
        const sticks = 3 * n + 1;
        return {
          text: r`
            A row of $n$ squares takes $\;3n + 1\;$ matchsticks: one to start, then three more for each square.

            You have **${sticks} matchsticks**. How many squares can you build in a row, using all of them?
          `,
          figure: {
            type: 'tile-pattern', shape: 'sticks', steps: [1, 2, 3],
            alt: 'Rows of one, two and three squares made of matchsticks, using 4, 7 and 10 matchsticks. One marked matchstick on the far left is there in every row.',
          },
          answer: n,
          unit: 'squares',
          wrong: [
            [3 * sticks + 1, `That treats ${sticks} as the number of squares. Here ${sticks} is the number of matchsticks, and you are looking for $n.$`],
            [sticks - 1, r`That is $3n,$ the matchsticks left after the first one. Share them out, three per square.`],
          ],
          feedback: (v) => (Math.abs(v - sticks / 3) < 0.01 ? 'Take the starting matchstick away before you divide by 3.' : Math.abs(v - sticks / 4) < 0.01 ? 'Neighbouring squares share a side, so each new square costs only 3 matchsticks, not 4.' : null),
          hints: [
            r`You need the step $n$ for which $\;3n + 1 = ${sticks}.$ That is a two-step equation.`,
            r`Last on, first off: subtract 1, then divide by 3.`,
          ],
          explain: r`Solve $\;3n + 1 = ${sticks}.$ Subtracting 1 gives $3n = ${sticks - 1},$ and dividing by 3 gives $n = ${n}.$ A rule works in both directions: from the step to the count, and back again.`,
        };
      },
    },
    {
      id: 'border',
      type: 'expr',
      stretch: true,
      title: 'Tiles around a pool',
      text: r`
        A square pool is $n$ tiles wide. It gets a border of tiles, one tile thick. Try a few pool sizes with the slider.

        **Write an expression for the number of border tiles.** There is more than one way to see it, and every correct way is accepted.
      `,
      figure: {
        type: 'tile-pattern', shape: 'border', n: 2, min: 1, max: 5, cell: 32, color: 'plain', sliderLabel: 'pool size $n$',
        alt: 'A square pool surrounded by a border of square tiles, with a slider for the size of the pool. A pool 1 wide needs 8 tiles, 2 wide needs 12 and 3 wide needs 16.',
      },
      answer: '4n + 4',
      vars: ['n'],
      prefix: 'tiles $=$',
      placeholder: 'expression in n',
      wrong: [
        ['4n', 'That counts the four sides next to the pool. Look at the corners: they are not part of any of those sides.'],
        ['4(n + 2)', r`One whole edge of the border is $n + 2$ tiles long. But four of those count every corner tile twice.`],
        ['(n + 2)^2', 'That is the whole big square, pool included. Take the pool away.'],
        ['4n + 8', 'Check a pool 1 wide: that would give 12 tiles, but the picture shows 8.'],
        ['8n', 'That fits a pool 1 wide, but a pool 2 wide needs 12 tiles, not 16. How many are added each time the pool grows?'],
        ['n^2', 'That is the pool itself. The question is about the tiles around it.'],
      ],
      hints: [
        'Use the slider to count a few: 8, 12, 16 … How many tiles are added each time the pool gets one wider?',
        r`One way to see it: four sides of $n$ tiles, plus the four corners.`,
      ],
      explain: r`
        Three ways of seeing it, all equal:

        | How you count | Expression |
        |---|---|
        | Four sides of $n$ tiles, plus four corners | $4n + 4$ |
        | Four strips of $n + 1$ tiles: a side and one corner each | $4(n + 1)$ |
        | The big square minus the pool | $\mathord{(n + 2)^2 - n^2}$ |

        Different ways of counting give different-looking expressions for the same number. Much of algebra is about moving between such forms.
      `,
    },
    {
      id: 'match-rules',
      type: 'match',
      text: 'Each list gives steps 1, 2, 3 and 4 of a pattern. Match it with its rule.',
      pairs: [
        ['5, 7, 9, 11, …', r`$2n + 3$`],
        ['5, 8, 11, 14, …', r`$3n + 2$`],
        ['5, 10, 15, 20, …', r`$5n$`],
        ['5, 6, 7, 8, …', r`$n + 4$`],
      ],
      explain: r`All four start at 5, so the first number alone tells you little. The **jump** between neighbours is the number in front of $n.$ Stepping back to step 0 gives the number that is added on.`,
    },
  ],
  recap: [
    'A pattern that grows by the same amount each step has a rule of the form "growth × $n$ + fixed part".',
    'The number in front of $n$ is how much is added per step.',
    'The number added on is what the pattern would have at step 0.',
    'With a rule you can jump to any step, or work back from a count to its step.',
  ],
  next: 'Next: that "amount added per step" gets a name of its own, and a picture.',
};
