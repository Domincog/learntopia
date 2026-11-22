// Algebra Foundations · Lesson 1 · Keeping the Balance
import { r } from '../../../kit.js';

export default {
  id: 'keeping-the-balance',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'What is in the box?',
      text: 'This scale is perfectly balanced. Every yellow weight is 1 kg. **How heavy is the mystery box?**',
      figure: {
        type: 'balance', static: true, equation: false, xValue: 5,
        left: { x: 1, ones: 2 }, right: { x: 0, ones: 7 },
        alt: 'A balanced scale. Left pan: one mystery box and two 1 kg weights. Right pan: seven 1 kg weights.',
      },
      options: [
        { text: '2 kg' },
        { text: '5 kg', correct: true },
        { text: '7 kg' },
        { text: '9 kg' },
      ],
      explain: r`
        The box and 2 kg together balance 7 kg, so the box must be $7 - 2 = 5$ kg.

        You just solved an equation. The rest of this lesson is about *why* that worked.
      `,
    },
    {
      id: 'find-by-trial',
      type: 'interact',
      graded: false,
      title: 'Weigh it',
      text: 'Here is a different box. **Add weights to the right pan until the scale is level.**',
      widget: {
        type: 'balance', mode: 'free', xValue: 4, equation: false,
        left: { x: 1, ones: 0 }, right: { x: 0, ones: 1 }, edit: { right: ['ones'] },
      },
      check: (s) => s.balanced || (s.right.ones < 4 ? 'The box is still heavier. Keep adding.' : 'Too much — the right pan is heavier now.'),
      solution: { left: { x: 1, ones: 0 }, right: { x: 0, ones: 4 } },
      explain: r`
        Level means **equal**: the box weighs exactly as much as 4 weights.
        In symbols, with $x$ standing for the box: $x = 4$.
      `,
    },
    {
      id: 'idea',
      type: 'info',
      title: 'An equation is a balanced scale',
      text: r`
        The equals sign does not mean "here comes the answer". It means
        **the two sides weigh the same**.

        $$ \blue{x + 3} = \orange{8} $$

        Read it as: *a box and 3 weights* balance *8 weights*.

        :::key
        You may do anything you like to a balanced scale —
        **as long as you do the same thing to both sides.**
        :::
      `,
    },
    {
      id: 'isolate-sub',
      type: 'interact',
      title: 'Get the box alone',
      text: r`Here is $x + 3 = 8$ on the scale. **Remove weights from both sides** until the box sits alone on its pan.`,
      widget: { type: 'balance', xValue: 5, left: { x: 1, ones: 3 }, right: { x: 0, ones: 8 }, ops: ['sub1'] },
      check: (s) => s.solved || (s.left.ones > 0 ? 'The box still has company on its pan.' : false),
      solution: { left: { x: 1, ones: 0 }, right: { x: 0, ones: 5 } },
      hints: ['Each press takes one weight from *each* pan, so the scale stays level.', 'The box has 3 weights next to it. Take away all 3.'],
      explain: r`
        Three weights came off **each** side, and the scale stayed level the whole time:

        $$ x + 3 = 8 \quad\longrightarrow\quad x = 5 $$
      `,
    },
    {
      id: 'teach-undo-add',
      type: 'info',
      title: 'Undo what was done to x',
      text: r`
        The letter $x$ stands for a number you do not know yet: the weight of the box. **Solving** the equation means finding that number, the **solution**.

        Taking 3 weights off each pan *undid* the $+3$ that kept the box company. Without a scale you do the same in writing: to undo a "plus", **subtract**, on both sides.

        :::example
        Solve $\;x + 20 = 50$.

        | Line | Why |
        |---|---|
        | $\mathord{x + 20 = 50}$ | the equation |
        | $\mathord{x = 50 - 20}$ | subtract 20 from both sides |
        | $\mathord{x = 30}$ | $x$ is alone |

        Check: $30 + 20 = 50$ ✓
        :::
      `,
    },
    {
      id: 'which-move',
      type: 'choice',
      text: r`To get $x$ alone in $\;x + 6 = 15$, what should you do to **both sides**?`,
      options: [
        { text: 'Subtract 6', correct: true, why: r`That removes the $+6$ and leaves $x = 9$.` },
        { text: 'Add 6', why: r`That gives $x + 12 = 21$ — still balanced, but $x$ now has even more company.` },
        { text: 'Subtract 15', why: r`That empties the right side: $x - 9 = 0$. True, but not simpler.` },
        { text: 'Divide by 6', why: r`Division undoes multiplication. Here 6 is being *added* to $x$.` },
      ],
      explain: r`To undo "plus 6", subtract 6 — from both sides. $x + 6 - 6 = 15 - 6$, so $x = 9$.`,
    },
    {
      id: 'solve-add',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const x = rng.int(3, 19);
        const a = rng.int(2, 15);
        return {
          text: r`Solve for $x$: $$ x + ${a} = ${x + a} $$`,
          prefix: '$x =$',
          answer: x,
          wrong: [
            [x + a + a, `You added ${a}. To undo "plus ${a}", subtract it from both sides.`],
            [x + a, r`That is the whole right side. Take ${a} away from it.`],
          ],
          hints: [`What undoes "plus ${a}"?`, r`Subtract ${a} from both sides: $x = ${x + a} - ${a}$.`],
          explain: r`Subtract ${a} from both sides: $x = ${x + a} - ${a} = ${x}$. Check: $${x} + ${a} = ${x + a}$ ✓`,
        };
      },
    },
    {
      id: 'isolate-div',
      type: 'interact',
      title: 'Three boxes, one question',
      text: r`Now the scale shows $3x = 12$: three identical boxes balance 12 weights. **Find the weight of one box.**`,
      widget: { type: 'balance', xValue: 4, left: { x: 3, ones: 0 }, right: { x: 0, ones: 12 }, ops: ['sub1', 'div'] },
      check: (s) => s.solved || 'There is still more than one box on the pan.',
      solution: { left: { x: 1, ones: 0 }, right: { x: 0, ones: 4 } },
      hints: ['There is nothing to take away this time. Could you *share out* each side instead?', 'Split each side into 3 equal groups and keep one group.'],
      explain: r`
        Sharing each side into 3 equal groups keeps the balance:

        $$ 3x = 12 \quad\longrightarrow\quad x = 4 $$
      `,
    },
    {
      id: 'teach-undo-times',
      type: 'info',
      title: 'Times is undone by dividing',
      text: r`
        A number written right in front of a letter is **multiplied** by it: $3x$ means $3 \times x$, three boxes.

        Sharing each pan into 3 equal groups was a division by 3, and it undid the "times 3". To undo a "times", **divide** both sides.

        :::example
        Solve $\;10x = 70$.

        | Line | Why |
        |---|---|
        | $\mathord{10x = 70}$ | ten boxes weigh 70 |
        | $\mathord{x = 70 \div 10}$ | divide both sides by 10 |
        | $\mathord{x = 7}$ | one box |

        Check: $10 \times 7 = 70$ ✓
        :::
      `,
    },
    {
      id: 'solve-mul',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 9);
        const x = rng.int(2, 12);
        return {
          text: r`Solve for $x$: $$ ${a}x = ${a * x} $$`,
          prefix: '$x =$',
          answer: x,
          wrong: [
            [a * x - a, r`$${a}x$ means ${a} *times* $x$, so undo it by dividing, not subtracting.`],
            [a * x * a, `You multiplied. To undo "times ${a}", divide both sides by ${a}.`],
          ],
          hints: [r`$${a}x$ means ${a} boxes. How do you find one box?`, r`Divide both sides by ${a}: $x = ${a * x} \div ${a}$.`],
          explain: r`Divide both sides by ${a}: $x = ${a * x} \div ${a} = ${x}$. Check: $${a} \times ${x} = ${a * x}$ ✓`,
        };
      },
    },
    {
      id: 'legal-moves',
      type: 'multi',
      review: true,
      text: 'A scale is balanced. **Which of these moves are guaranteed to keep it balanced?**',
      options: [
        { text: 'Take 2 weights off each pan', correct: true },
        { text: 'Double what is on each pan', correct: true },
        { text: 'Take 2 weights off the left pan only', why: 'One side just got lighter and the other did not. It tips.' },
        { text: 'Add 1 to the left pan and take 1 off the right', why: 'Those are *different* moves: the left gains while the right loses.' },
        { text: 'Split each pan into 3 equal groups and keep one group from each', correct: true },
      ],
      explain: 'Same move, both sides: add, subtract, multiply or divide. Anything one-sided — or different on each side — breaks the balance.',
    },
    {
      id: 'teach-opposites',
      type: 'info',
      title: 'Every operation has an opposite',
      text: r`
        An equation can also take something away from $x$, or divide it. The idea stays the same: undo it with the **opposite** move, on both sides.

        | Done to $x$ | Written | Undo it |
        |---|:-:|---|
        | add 7 | $x + 7$ | subtract 7 |
        | subtract 7 | $x - 7$ | add 7 |
        | multiply by 7 | $7x$ | divide by 7 |
        | divide by 7 | $\dfrac{x}{7}$ | multiply by 7 |

        The fraction $\frac{x}{7}$ is another way of writing $x \div 7$.

        :::example
        Solve $\;\mathord{\frac{x}{10} = 4}$. Here $x$ is divided by 10, so multiply both sides by 10: $\;\mathord{x = 4 \times 10 = 40}$. Check: $\mathord{\frac{40}{10} = 4}$ ✓
        :::
      `,
    },
    {
      id: 'beyond-scale',
      type: 'fill',
      title: 'Beyond the scale',
      text: r`A real scale cannot show "minus 4" — but the rule still works. To undo a subtraction, **add**. Complete the solution of $\;x - 4 = 9$:`,
      template: r`Add [[4]] to both sides, so $x =$ [[13]].`,
      explain: r`$x - 4 + 4 = 9 + 4$, so $x = 13$. Check: $13 - 4 = 9$ ✓`,
    },
    {
      id: 'match-moves',
      type: 'match',
      text: 'Match each equation with the move that gets $x$ alone.',
      pairs: [
        [r`$x + 5 = 20$`, 'Subtract 5'],
        [r`$5x = 20$`, 'Divide by 5'],
        [r`$x - 5 = 20$`, 'Add 5'],
        [r`$\frac{x}{5} = 20$`, 'Multiply by 5'],
      ],
      explain: 'Every operation has an opposite that undoes it: add ↔ subtract, multiply ↔ divide.',
    },
    {
      id: 'mixed',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        const kind = rng.pick(['sub', 'div']);
        const a = rng.int(2, 9);
        if (kind === 'sub') {
          const x = rng.int(a + 2, 30);
          return {
            text: r`One step, your choice of move. Solve: $$ x - ${a} = ${x - a} $$`,
            prefix: '$x =$',
            answer: x,
            wrong: [[x - a - a, `You subtracted ${a} again. To undo "minus ${a}", add ${a}.`]],
            hints: [`What undoes "minus ${a}"?`],
            explain: r`Add ${a} to both sides: $x = ${x - a} + ${a} = ${x}$.`,
          };
        }
        const q = rng.int(2, 12);
        return {
          text: r`One step, your choice of move. Solve: $$ \frac{x}{${a}} = ${q} $$`,
          prefix: '$x =$',
          answer: a * q,
          wrong: [[q / a, `You divided. $x$ is already being divided by ${a}; undo that by multiplying.`], [q + a, 'Undo a division with a multiplication, not an addition.']],
          hints: [r`$\frac{x}{${a}}$ means $x$ shared into ${a} equal parts, each worth ${q}.`],
          explain: r`Multiply both sides by ${a}: $x = ${q} \times ${a} = ${a * q}$.`,
        };
      },
    },
  ],
  recap: [
    'An equation says two things weigh the same.',
    'Any move keeps it true **if you make it on both sides**.',
    'To get $x$ alone, undo what is being done to it: add ↔ subtract, multiply ↔ divide.',
    'Always check by putting your answer back into the equation.',
  ],
  next: 'Next: what if the box is wrapped in *two* operations at once?',
};
