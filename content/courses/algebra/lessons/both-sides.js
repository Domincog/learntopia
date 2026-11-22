// Algebra Foundations · Lesson 3 · Unknowns on Both Sides
import { r, term } from '../../../kit.js';

export default {
  id: 'both-sides',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Boxes on both pans',
      text: 'This scale is balanced. Every yellow weight is 1 kg, and all the mystery boxes weigh the same. **How heavy is one box?**',
      figure: {
        type: 'balance', static: true, equation: false, xValue: 4,
        left: { x: 3, ones: 2 }, right: { x: 1, ones: 10 },
        alt: 'A balanced scale. Left pan: three mystery boxes and two 1 kg weights. Right pan: one mystery box and ten 1 kg weights.',
      },
      shuffle: false,
      options: [
        { text: '2 kg' },
        { text: '4 kg', correct: true },
        { text: '8 kg' },
        { text: 'It is impossible to tell' },
      ],
      explain: r`
        4 kg. Lift one box off **each** pan and the scale stays level. Now 2 boxes and 2 kg balance 10 kg, so the 2 boxes weigh 8 kg.

        An unknown on both sides is not a dead end. You are allowed to take it away from both.
      `,
    },
    {
      id: 'teach-read-scale',
      type: 'info',
      title: 'The same scale, in symbols',
      text: r`
        Here is that scale written as an equation. Three boxes are $3x$. One box on its own is just $x$, which means $1x$.

        $$ \blue{3x + 2} = \orange{x + 10} $$

        All the boxes weigh the same. So lifting **one box off each pan** takes the same amount from both sides, exactly like taking one weight off each pan. The scale stays level.
      `,
      figure: {
        type: 'balance', static: true, xValue: 4,
        left: { x: 3, ones: 2 }, right: { x: 1, ones: 10 },
        alt: 'A balanced scale. Left pan: three mystery boxes and two 1 kg weights. Right pan: one mystery box and ten 1 kg weights. Underneath, the equation 3x + 2 = x + 10.',
      },
    },
    {
      id: 'take-boxes',
      type: 'interact',
      title: 'A new move',
      text: r`
        Here is that scale again. In symbols:

        $$ 3x + 2 = x + 10 $$

        There is a new button: **Take a box from each side**. Use the moves to get **one box alone** on its pan.
      `,
      widget: { type: 'balance', xValue: 4, left: { x: 3, ones: 2 }, right: { x: 1, ones: 10 }, ops: ['subx', 'sub1', 'div'] },
      check: (s) => {
        if (s.solved) return true;
        if (s.left.x > 0 && s.right.x > 0) return 'There are still boxes on both pans. Take one from each side.';
        if (s.left.ones > 0 && s.right.ones > 0) return 'Good: the boxes are all on one pan now. Next, clear the loose weights away from them.';
        return 'More than one box is left. Split each side into equal groups.';
      },
      solution: { left: { x: 1, ones: 0 }, right: { x: 0, ones: 4 } },
      hints: [
        'Start with the new button: take a box from each side.',
        r`Now it reads $2x + 2 = 10,$ a two-step equation. Take away the loose weights, then split.`,
      ],
      explain: r`
        Taking a box from each side keeps the balance, exactly like taking a weight from each side:

        $$ \begin{aligned} 3x + 2 &= x + 10 \\ 2x + 2 &= 10 \\ 2x &= 8 \\ x &= 4 \end{aligned} $$

        Once all the boxes were on one pan, it was a two-step equation again.
      `,
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Collect the unknowns on one side',
      text: r`
        A box is just a number you do not know yet. Whatever it is, it is the **same** number on both pans, so removing it from both keeps the scale level.

        In symbols, "take a box from each side" is **subtract $x$ from both sides**:

        $$ \begin{aligned} 3x + 2 &= x + 10 \\ 3x \blue{{}- x} + 2 &= x \blue{{}- x} + 10 \\ 2x + 2 &= 10 \end{aligned} $$

        Count $x\text{'s}$ the way you count boxes: $\;\mathord{3x - x = 2x},$ and $\;\mathord{7x - 2x = 5x}.$

        :::key
        When $x$ appears on both sides, subtract the smaller pile of $x\text{'s}$ from **both** sides. What is left is an equation you already know how to solve.
        :::
      `,
    },
    {
      id: 'subtract-x',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.int(2, 4);            // x's on the right
        const k = rng.int(2, 4);            // how many more on the left
        const a = c + k;
        const b = rng.int(1, 9);
        const x = rng.int(2, 6);
        const d = k * x + b;
        return {
          text: r`You subtract $${c}x$ from **both sides** of $$ ${a}x + ${b} = ${c}x + ${d} $$ What is left?`,
          options: [
            { text: r`$${k}x + ${b} = ${d}$`, correct: true },
            { text: r`$${k}x + ${b} = ${c}x + ${d}$`, why: r`That takes $${c}x$ from the left side only. The right side still has its $${c}x,$ so the scale would tip.` },
            { text: r`$${a + c}x + ${b} = ${d}$`, why: r`That *adds* the $x\text{'s}$ together. Taking $${c}x$ away from $${a}x$ leaves $${k}x.$` },
            { text: r`$${k}x + ${b} = ${d - c}$`, why: r`The $${c}x$ on the right is gone, but the plain number ${d} should not change. $${c}x$ is ${c} boxes, not the number ${c}.` },
          ],
          hints: [r`Do it one side at a time. What is $${a}x - ${c}x{?}$ And what is left of $${c}x + ${d}$ once the $${c}x$ has gone?`],
          explain: r`On the left, $${a}x - ${c}x = ${k}x.$ On the right, $${c}x - ${c}x$ leaves nothing, so only the ${d} remains: $\;${k}x + ${b} = ${d}.$`,
        };
      },
    },
    {
      id: 'example-both',
      type: 'info',
      title: 'From start to finish',
      text: r`
        :::example
        Solve $\;9x + 20 = 6x + 50.$ The smaller pile of $x\text{'s}$ is $6x,$ so that is the one to clear.

        | Equation | Move |
        |---|---|
        | $\mathord{9x + 20 = 6x + 50}$ | |
        | $\mathord{3x + 20 = 50}$ | subtract $6x$ |
        | $\mathord{3x = 30}$ | subtract 20 |
        | $\mathord{x = 10}$ | divide by 3 |
        :::

        Then check, by putting 10 in place of $x$ on **each** side. Left: $\;\mathord{9 \times 10 + 20 = 110}.$ Right: $\;\mathord{6 \times 10 + 50 = 110}.$ The two sides agree ✓
      `,
    },
    {
      id: 'solve-both',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const x = rng.int(2, 9);
        const c = rng.int(1, 4);
        const k = rng.int(2, 5);
        const a = c + k;
        const b = rng.int(1, 12);
        const d = k * x + b;
        const cx = term(c);
        return {
          text: r`Solve for $x{:}$ $$ ${a}x + ${b} = ${cx} + ${d} $$`,
          prefix: '$x =$',
          answer: x,
          wrong: [
            [(d - b) / a, r`It looks as if the $${cx}$ on the right was simply dropped. Subtract it from **both** sides: the left then has $${k}x,$ not $${a}x.$`],
            [(d - b) / (a + c), r`Clearing $${cx}$ from the right means *subtracting* it from both sides. That leaves $${k}x$ on the left, not $${a + c}x.$`],
            [(d + b) / k, `To clear the $+ ${b},$ subtract ${b} from both sides.`],
            [d - b, r`That is $${k}x.$ Divide by ${k} to finish.`],
          ],
          hints: [
            r`Take $${cx}$ away from both sides first.`,
            r`That leaves $${k}x + ${b} = ${d}.$ Now undo the $+ ${b},$ then the $\times ${k}.$`,
          ],
          explain: r`Subtract $${cx}$ from both sides: $${k}x + ${b} = ${d}.$ Subtract ${b}: $${k}x = ${k * x}.$ Divide by ${k}: $x = ${x}.$ Check: both sides come to ${a * x + b} ✓`,
        };
      },
    },
    {
      id: 'smaller-pile',
      type: 'fill',
      title: 'Which pile to clear?',
      text: r`In $\;2x + 9 = 5x\;$ the **smaller** pile of $x\text{'s}$ is on the left. Clear that one and no negative numbers appear:`,
      template: r`
        1. Subtract [[2]]$x$ from both sides.
        2. That leaves $\;9 =$ [[3]]$x$
        3. So $\;x =$ [[3]]
      `,
      explain: r`$2x + 9 = 5x \;\longrightarrow\; 9 = 3x \;\longrightarrow\; x = 3.$ It does not matter that $x$ ends up on the right: $9 = 3x$ says the same thing as $3x = 9.$`,
    },
    {
      id: 'check-both',
      type: 'fill',
      title: 'Trust, but check',
      gen: (rng) => {
        const x = rng.int(2, 6);
        const c = rng.int(1, 3);
        const a = c + rng.int(1, 3);
        const b = rng.int(1, 9);
        const d = (a - c) * x + b;          // a·x + b = c·x + d is true at x
        const off = rng.bool(0.5);
        const t = off ? x + rng.pick([-1, 1]) : x;
        const left = a * t + b;
        const right = c * t + d;
        return {
          text: r`A solution has to make **both sides equal**. Test whether $x = ${t}$ is a solution of $$ ${a}x + ${b} = ${term(c)} + ${d} $$`,
          template: r`
            - Left side: $\;${a} \times ${t} + ${b} =$ [[${left}]]
            - Right side: $\;${c} \times ${t} + ${d} =$ [[${right}]]
            - So $x = ${t}$ [[${off ? 'is|*is not' : '*is|is not'}]] a solution.
          `,
          explain: off
            ? r`The sides come to ${left} and ${right}. They differ, so the scale would tip: $x = ${t}$ is not a solution. (The real one is $x = ${x},$ where both sides are ${a * x + b}.)`
            : r`Both sides come to ${left}, so the scale balances at $x = ${t}.$ Checking takes ten seconds and catches most slips.`,
        };
      },
    },
    {
      id: 'solve-minus',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const x = rng.int(3, 9);
        const c = rng.int(1, 4);
        const k = rng.int(2, 4);
        const a = c + k;
        const b = rng.int(1, Math.min(9, k * x - 1));
        const d = k * x - b;
        const cx = term(c);
        return {
          text: r`A scale cannot show "minus ${b}", but the moves still work. Solve for $x{:}$ $$ ${a}x - ${b} = ${cx} + ${d} $$`,
          prefix: '$x =$',
          answer: x,
          wrong: [
            [(d - b) / k, `It looks as if ${b} was subtracted. To undo "minus ${b}", add ${b} to both sides.`],
            [(d + b) / a, r`The $${cx}$ on the right cannot just be dropped. Subtract it from both sides first: the left then has $${k}x.$`],
            [d + b, r`That is $${k}x.$ Divide by ${k} to finish.`],
          ],
          hints: [
            r`Collect the $x\text{'s}$ first: subtract $${cx}$ from both sides.`,
            r`That leaves $${k}x - ${b} = ${d}.$ Add ${b} to both sides, then divide by ${k}.`,
          ],
          explain: r`Subtract $${cx}$ from both sides: $${k}x - ${b} = ${d}.$ Add ${b}: $${k}x = ${k * x}.$ Divide by ${k}: $x = ${x}.$ Check: both sides come to ${a * x - b} ✓`,
        };
      },
    },
    {
      id: 'never-level',
      type: 'interact',
      graded: false,
      title: 'A scale that will not settle',
      text: r`
        Someone claims that some box weight makes this equation true:

        $$ 2x + 3 = 2x + 5 $$

        The scale disagrees: it tips. Could a different box weight fix it? **Take the boxes off both sides** and see what is left.
      `,
      widget: { type: 'balance', xValue: 3, left: { x: 2, ones: 3 }, right: { x: 2, ones: 5 }, ops: ['subx'] },
      check: (s) => (s.left.x === 0 && s.right.x === 0) || 'There are still boxes on the pans. Take one from each side.',
      solution: { left: { x: 0, ones: 3 }, right: { x: 0, ones: 5 } },
      explain: r`
        With the boxes gone, 3 weights face 5 weights. The boxes were never the problem: whatever they weigh, the right pan carries 2 kg more.
      `,
    },
    {
      id: 'teach-no-solution',
      type: 'info',
      title: 'When every x cancels',
      text: r`
        That scale had the **same number of boxes** on both pans. Subtracting $2x$ from both sides removes every $x{:}$

        $$ 2x + 3 = 2x + 5 \;\longrightarrow\; 3 = 5 $$

        $3 = 5$ is never true, so no value of $x$ works. The equation has **no solution**.

        :::key
        The same number of $x\text{'s}$ on both sides, with different numbers left over: **no solution**. Different numbers of $x\text{'s}{:}$ **exactly one solution**.
        :::

        That one solution may be zero:

        $$ 6x = 2x \;\longrightarrow\; 4x = 0 \;\longrightarrow\; x = 0 $$
      `,
    },
    {
      id: 'how-many-solutions',
      type: 'bucket',
      stretch: true,
      review: true,
      text: r`Subtract the $x\text{'s}$ from both sides in your head, then sort. **Does each equation have a solution?**`,
      buckets: ['Exactly one solution', 'No solution'],
      items: [
        { text: r`$5x = 3x + 8$`, bucket: 0, why: r`Look again at $5x = 3x + 8.$ Subtract $3x$ and you get $2x = 8,$ so $x = 4$ works.` },
        { text: r`$2x = 2x + 6$`, bucket: 1, why: r`Look again at $2x = 2x + 6.$ Subtract $2x$ and you get $0 = 6,$ which is never true.` },
        { text: r`$3x = x$`, bucket: 0, why: r`Look again at $3x = x.$ Subtract $x$ and you get $2x = 0,$ so $x = 0.$ Zero is a perfectly good solution.` },
        { text: r`$x + 7 = x$`, bucket: 1, why: r`Look again at $x + 7 = x.$ Subtract $x$ and you get $7 = 0,$ which is never true.` },
        { text: r`$4x = x + 9$`, bucket: 0, why: r`Look again at $4x = x + 9.$ Subtract $x$ and you get $3x = 9,$ so $x = 3$ works.` },
        { text: r`$3x + 1 = 3x$`, bucket: 1, why: r`Look again at $3x + 1 = 3x.$ Subtract $3x$ and you get $1 = 0,$ which is never true.` },
      ],
      hints: [
        r`For each equation, compare the piles: how many $x\text{'s}$ are on the left, and how many on the right?`,
        r`If the piles are equal, the $x\text{'s}$ cancel completely. Is the statement that is left true or false?`,
      ],
      explain: r`If both sides have the **same number of $x\text{'s}$** but different numbers left over, the $x\text{'s}$ cancel and leave something false, such as $0 = 6.$ If the piles of $x\text{'s}$ differ, there is exactly one solution, and it may well be 0.`,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`You do not know what $x$ is. So why are you allowed to subtract $x$ from both sides of an equation?`,
      model: r`
        Because $x$ stands for **one particular number**, even though you do not know it yet. Taking the same number away from both sides keeps them equal, just as lifting the same box off both pans keeps a scale level.

        You do not need to know what the box weighs to know that the balance survives.
      `,
    },
  ],
  recap: [
    'An $x$ can be taken away from both sides, just like a weight.',
    r`Clear the smaller pile of $x\text{'s},$ then solve the two-step equation that is left.`,
    'Check by working out both sides with your answer: they must match.',
    r`If the $x\text{'s}$ cancel and leave something false, such as $3 = 5,$ there is no solution.`,
  ],
  next: 'Next: where do expressions like $2n + 1$ come from? From patterns that grow.',
};
