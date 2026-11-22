// Algebra Foundations · Lesson 2 · Undoing Operations
import { r } from '../../../kit.js';

export default {
  id: 'undoing-operations',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Run it backwards',
      text: 'This machine **doubles** whatever goes in, then **adds 3**. Today, 11 came out. **What number went in?**',
      figure: {
        type: 'op-machine', mode: 'undo', ops: ['*2', '+3'], input: 4, static: true,
        alt: 'A chain of two machines. An unknown number x goes in, is multiplied by 2, then has 3 added, and 11 comes out.',
      },
      shuffle: false,
      options: [
        { text: '4', correct: true },
        { text: '7' },
        { text: '16' },
        { text: '25' },
      ],
      explain: r`
        It was 4. Check it forwards: $4 \times 2 = 8,$ then $8 + 3 = 11.$

        To find it you probably went *backwards*: take off the 3, then halve. This lesson is about why that order matters.
      `,
    },
    {
      id: 'feed-it',
      type: 'interact',
      graded: false,
      title: 'Feed the machine',
      text: `
        A new machine. It **multiplies by 3**, then **subtracts 2**.

        Move the slider and watch the number change at each stage. **Find the input that makes 19 come out.**
      `,
      widget: { type: 'op-machine', mode: 'run', ops: ['*3', '-2'], input: 2, min: 0, max: 10, target: 19 },
      check: (s) => s.hit || (s.output < 19
        ? `${s.input} goes in, ${s.output} comes out. Too small: feed it something bigger.`
        : `${s.input} goes in, ${s.output} comes out. Too big: try a smaller number.`),
      solution: { input: 7 },
      explain: r`
        7 works: $7 \times 3 = 21,$ then $21 - 2 = 19.$

        Hunting with a slider is fine for small numbers. But look at the middle window: just before the last machine, the number was 21. Knowing the *last* thing the machine did is the key to going straight back.
      `,
    },
    {
      id: 'work-back',
      type: 'interact',
      title: 'Now go backwards',
      text: r`
        This machine **multiplies by 4**, then **adds 5**, and 29 comes out. The input is hidden.

        Start from 29 and **undo the machine, one move at a time**, until you are back at $x.$
      `,
      widget: { type: 'op-machine', mode: 'undo', ops: ['*4', '+5'], input: 6 },
      check: (s) => {
        if (s.solved) return true;
        if (!s.done) return 'Keep going: make one move for each machine.';
        if (s.moves[0] === '/4') return 'You divided first. But adding 5 was the *last* thing the machine did, so it is the first thing to undo.';
        if (s.moves.includes('+5') || s.moves.includes('*4')) return 'One of your moves repeats what the machine did instead of undoing it. To undo "add 5", subtract 5. To undo "multiply by 4", divide by 4.';
        return 'Look at the test under the machine: your number does not come out as 29. Press Reset and try different moves.';
      },
      solution: { moves: ['-5', '/4'] },
      hints: [
        'What was the very last thing the machine did to the number? Undo that first.',
        'The last machine added 5, so start with "− 5". That takes 29 back to 24.',
      ],
      explain: r`
        The machine did $\times 4$ and then $+ 5.$ Going back, you undo the $+5$ first and the $\times 4$ second:

        $$ 29 \;\xrightarrow{\;-5\;}\; 24 \;\xrightarrow{\;\div 4\;}\; 6 $$

        Dividing first gives $29 \div 4 - 5 = 2.25$ instead, and feeding 2.25 into the machine does not give 29.
      `,
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Last on, first off',
      text: r`
        The first machine was an equation in disguise. "Double a number, add 3, get 11" is

        $$ 2x + 3 = 11 $$

        Solving it means running the machine backwards. Like socks and shoes, the **last** thing put on is the **first** to come off:

        | Equation | Move, on both sides |
        |---|---|
        | $2x + 3 = 11$ | |
        | $2x = 8$ | [subtract 3]{.orange} |
        | $x = 4$ | [divide by 2]{.orange} |

        :::key
        Undo the operations **in reverse order**: last on, first off.
        :::
      `,
      figure: {
        type: 'op-machine', mode: 'undo', ops: ['*2', '+3'], input: 4, undo: ['-3', '/2'], exprs: true, static: true,
        alt: 'Top row: x is multiplied by 2 to make 2x, then 3 is added to make 2x + 3, which equals 11. Bottom row, running backwards: 11 minus 3 is 8, and 8 divided by 2 is 4.',
      },
    },
    {
      id: 'scale-two-step',
      type: 'interact',
      title: 'The scale agrees',
      text: r`
        Here is $\;3x + 2 = 14\;$ on the scale from the last lesson. **Get one box alone on its pan.**

        Notice which button you cannot press at the start.
      `,
      widget: { type: 'balance', xValue: 4, left: { x: 3, ones: 2 }, right: { x: 0, ones: 14 }, ops: ['sub1', 'div'] },
      check: (s) => s.solved || (s.left.ones > 0
        ? 'The boxes still have loose weights next to them. Take those away first.'
        : 'Now 3 boxes balance 12 weights. Split each side into 3 equal groups.'),
      solution: { left: { x: 1, ones: 0 }, right: { x: 0, ones: 4 } },
      hints: [
        'Take 1 from each side until the 2 loose weights are gone.',
        'Three boxes now balance 12 weights. Split each side into 3 equal groups.',
      ],
      explain: r`
        While loose weights sat next to the boxes, the left pan could not be shared into 3 equal groups, so the Split button stayed grey. The scale made you subtract first:

        $$ \begin{aligned} 3x + 2 &= 14 \\ 3x &= 12 \\ x &= 4 \end{aligned} $$
      `,
    },
    {
      id: 'example-two-step',
      type: 'info',
      title: 'Write it down, line by line',
      text: r`
        Without a machine or a scale, write one line for each move. Each line is the whole equation after the move.

        :::example
        Solve $\;10x - 6 = 64$. Here $x$ was multiplied by 10, and then 6 was subtracted. The subtracting came last, so it is undone first.

        | Equation | Move, on both sides |
        |---|---|
        | $\mathord{10x - 6 = 64}$ | |
        | $\mathord{10x = 70}$ | add 6, to undo the $-6$ |
        | $\mathord{x = 7}$ | divide by 10 |

        Check: $10 \times 7 - 6 = 64$ ✓
        :::
      `,
    },
    {
      id: 'order-steps',
      type: 'order',
      text: r`Put the solution of $\;5x - 4 = 21\;$ in order, from the first line to the last.`,
      items: [
        r`$5x - 4 = 21$`,
        'Add 4 to both sides',
        r`$5x = 25$`,
        'Divide both sides by 5',
        r`$x = 5$`,
      ],
      labels: ['Start', 'Finish'],
      hints: [
        r`$x$ was multiplied by 5 first, and then 4 was subtracted. Which of those is undone first?`,
        'After each move comes the equation that the move produces.',
      ],
      explain: r`Subtracting 4 was the last thing done to $x,$ so it is undone first, by adding 4. Then the $\times 5$ is undone by dividing by 5.`,
    },
    {
      id: 'solve-two-step',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 9);
        const x = rng.int(2, 12);
        const b = rng.int(1, 15);
        const c = a * x + b;
        return {
          text: r`Solve for $x{:}$ $$ ${a}x + ${b} = ${c} $$`,
          prefix: '$x =$',
          answer: x,
          wrong: [
            [c / a - b, `It looks as if ${c} was divided by ${a} before the ${b} came off. The $+ ${b}$ was the last thing done to $x,$ so undo it first.`],
            [c - b, r`That is $${a}x,$ not $x.$ One more move: divide by ${a}.`],
            [(c + b) / a, `You added ${b}. To undo "plus ${b}", subtract ${b}.`],
            [c / a, `Do not forget the $+ ${b}.$ Take it off both sides before you divide.`],
          ],
          hints: [
            r`What was done to $x$ last: the $\times ${a}$ or the $+ ${b}?$ Undo that one first.`,
            r`Subtract ${b} from both sides: $${a}x = ${c - b}.$ Now divide by ${a}.`,
          ],
          explain: r`Subtract ${b} from both sides: $${a}x = ${c - b}.$ Divide both sides by ${a}: $x = ${x}.$ Check: $${a} \times ${x} + ${b} = ${c}$ ✓`,
        };
      },
    },
    {
      id: 'teach-divided',
      type: 'info',
      title: 'When x was divided',
      text: r`
        A fraction bar is a division. In $\;\frac{x}{10} - 4 = 2\;$ the number $x$ was **divided by 10** first, and then 4 was subtracted. The rule does not change: last on, first off.

        :::example
        | Equation | Move, on both sides |
        |---|---|
        | $\mathord{\dfrac{x}{10} - 4 = 2}$ | |
        | $\mathord{\dfrac{x}{10} = 6}$ | add 4 |
        | $\mathord{x = 60}$ | multiply by 10 |

        Check: $60 \div 10 - 4 = 2$ ✓
        :::
      `,
      figure: {
        type: 'op-machine', mode: 'undo', ops: ['/10', '-4'], input: 60, undo: ['+4', '*10'], exprs: true, static: true,
        alt: 'Top row: x is divided by 10, then 4 is subtracted, and 2 comes out. Bottom row, running backwards: 2 plus 4 is 6, and 6 times 10 is 60.',
      },
    },
    {
      id: 'divide-form',
      type: 'fill',
      title: 'Your turn',
      text: r`In $\;\dfrac{x}{4} + 2 = 5\;$ the number $x$ was **divided by 4**, and then **2 was added**. Undo that in reverse order:`,
      template: r`
        1. Subtract [[2]] from both sides: $\;\dfrac{x}{4} =$ [[3]]
        2. Multiply both sides by [[4]]: $\;x =$ [[12]]
      `,
      explain: r`$\frac{x}{4} + 2 = 5 \;\longrightarrow\; \frac{x}{4} = 3 \;\longrightarrow\; x = 12.$ Check: $12 \div 4 + 2 = 5$ ✓`,
    },
    {
      id: 'solve-divided',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 6);
        const q = rng.int(3, 9);            // the value of x / a
        const b = rng.int(1, 9);
        const minus = b < q && rng.bool(0.4);
        const c = minus ? q - b : q + b;
        const x = a * q;
        const sign = minus ? '-' : '+';
        const undo = minus ? 'Add' : 'Subtract';
        return {
          text: r`Solve for $x{:}$ $$ \frac{x}{${a}} ${sign} ${b} = ${c} $$`,
          prefix: '$x =$',
          answer: x,
          wrong: [
            [minus ? c * a + b : c * a - b, `It looks as if you multiplied by ${a} first. The $${sign} ${b}$ was the last thing done to $x,$ so undo it before you multiply.`],
            [q, r`That is $\frac{x}{${a}}.$ One more move: multiply by ${a}.`],
            [c * a, `Do not forget the $${sign} ${b}.$ Undo it on both sides before you multiply.`],
            [minus ? (c - b) * a : (c + b) * a, minus ? `To undo "minus ${b}", add ${b}.` : `To undo "plus ${b}", subtract ${b}.`],
          ],
          hints: [
            r`$x$ was divided by ${a} first, and then came the $${sign} ${b}.$ Undo the last one first.`,
            r`${undo} ${b} on both sides: $\frac{x}{${a}} = ${q}.$ Now multiply by ${a}.`,
          ],
          explain: r`${undo} ${b} on both sides: $\frac{x}{${a}} = ${q}.$ Multiply both sides by ${a}: $x = ${x}.$ Check: $${x} \div ${a} ${sign} ${b} = ${c}$ ✓`,
        };
      },
    },
    {
      id: 'brackets',
      type: 'interact',
      stretch: true,
      title: 'A different order',
      text: r`
        In $\;3(x + 2) = 21\;$ the brackets say the adding happens **first**: add 2, and only then multiply by 3. Here is that machine.

        **Work back from 21 to find $x.$**
      `,
      widget: { type: 'op-machine', mode: 'undo', ops: ['+2', '*3'], input: 5, exprs: true },
      check: (s) => {
        if (s.solved) return true;
        if (!s.done) return 'Make one move for each machine.';
        if (s.moves[0] === '-2') return 'You subtracted first, as in the earlier problems. But this machine multiplied *last*, so the multiplying is the first thing to undo.';
        return 'Look at the test under the machine: that number does not come out as 21. Which machine acted last?';
      },
      solution: { moves: ['/3', '-2'] },
      hints: [
        'Read the machine from right to left. What was the last thing it did?',
        'It multiplied by 3 last. So divide by 3 first: 21 ÷ 3 = 7.',
      ],
      explain: r`
        The rule is not "always subtract first". It is **last on, first off**, and here the last operation was $\times 3{:}$

        $$ \begin{aligned} 3(x + 2) &= 21 \\ x + 2 &= 7 \\ x &= 5 \end{aligned} $$
      `,
    },
    {
      id: 'teach-order',
      type: 'info',
      title: 'Read the order off the equation',
      text: r`
        A number in front of a bracket multiplies **everything inside**, so the bracket is worked out first. Before you solve, say what happened to $x$, in order. Whatever came last is undone first.

        | Equation | Done last, so undo first |
        |---|---|
        | $\mathord{7x + 10 = 80}$ | the $+ 10$: subtract 10 |
        | $\mathord{7x - 10 = 60}$ | the $- 10$: add 10 |
        | $\mathord{\dfrac{x}{7} + 10 = 12}$ | the $+ 10$: subtract 10 |
        | $\mathord{7(x + 10) = 84}$ | the $\times 7$: divide by 7 |

        The last one, in full: dividing by 7 leaves $\mathord{x + 10 = 12}$, and subtracting 10 leaves $x = 2$.
      `,
    },
    {
      id: 'first-undo',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 6);
        const b = rng.intExcept(2, 9, [a]);
        const x = rng.int(2, 8);
        const form = rng.pick(['plus', 'minus', 'divided', 'brackets']);
        const options = {
          add: { text: `Add ${b}` },
          sub: { text: `Subtract ${b}` },
          mul: { text: `Multiply by ${a}` },
          div: { text: `Divide by ${a}` },
        };
        let tex;
        let right;
        let explain;
        if (form === 'plus') {
          tex = `${a}x + ${b} = ${a * x + b}`;
          right = 'sub';
          options.div.why = `The $+ ${b}$ was added after the multiplying, so it comes off first. Dividing now would have to divide the ${b} as well.`;
          options.add.why = `That makes the extra ${b} bigger. To undo "plus ${b}", subtract.`;
          options.mul.why = `That repeats what was done to $x$ instead of undoing it.`;
          explain = r`$x$ was multiplied by ${a}, then ${b} was added. Last on, first off: subtract ${b} first, then divide by ${a}.`;
        } else if (form === 'minus') {
          tex = `${a}x - ${b} = ${a * x - b}`;
          right = 'add';
          options.div.why = `The $- ${b}$ happened after the multiplying, so it is undone first. Dividing now would have to divide the ${b} as well.`;
          options.sub.why = `That takes away ${b} a second time. To undo "minus ${b}", add.`;
          options.mul.why = `That repeats what was done to $x$ instead of undoing it.`;
          explain = r`$x$ was multiplied by ${a}, then ${b} was subtracted. Last on, first off: add ${b} first, then divide by ${a}.`;
        } else if (form === 'divided') {
          tex = `\\frac{x}{${a}} + ${b} = ${x + b}`;
          right = 'sub';
          options.mul.why = `Multiplying comes second. The $+ ${b}$ was the last thing done, so it comes off first.`;
          options.add.why = `That makes the extra ${b} bigger. To undo "plus ${b}", subtract.`;
          options.div.why = `$x$ has already been divided by ${a}. Dividing again does not undo anything.`;
          explain = r`$x$ was divided by ${a}, then ${b} was added. Last on, first off: subtract ${b} first, then multiply by ${a}.`;
        } else {
          tex = `${a}(x + ${b}) = ${a * (x + b)}`;
          right = 'div';
          options.sub.why = `Inside the brackets, the $+ ${b}$ happened *first*. The $\\times ${a}$ came last, so it is the first to be undone.`;
          options.add.why = `Adding ${b} does not undo anything here.`;
          options.mul.why = `That repeats the last operation instead of undoing it.`;
          explain = r`The brackets mean ${b} was added first and the result was multiplied by ${a}. Last on, first off: divide by ${a} first, then subtract ${b}.`;
        }
        options[right].correct = true;
        return {
          text: r`You want to solve this equation by undoing its operations in reverse order. $$ ${tex} $$ Which move comes **first**?`,
          options: [options.add, options.sub, options.mul, options.div],
          hints: [r`Start from $x$ and say what happens to it, in order. The operation you say **last** is the one to undo first.`],
          explain,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        Sam solves $\;2x + 6 = 14\;$ like this:

        1. Divide by 2: $\;x + 6 = 7$
        2. Subtract 6: $\;x = 1$

        But $2 \times 1 + 6$ is 8, not 14. **What went wrong, and how would you fix it?**
      `,
      model: r`
        In line 1, Sam halved the $2x$ and the 14 but left the 6 alone. Dividing a side by 2 has to halve *everything* on it, which would give $x + 3 = 7.$

        The safer route is last on, first off: subtract 6 first to get $2x = 8,$ then divide by 2 to get $x = 4.$
      `,
    },
  ],
  recap: [
    'A two-step equation is a number wrapped in two operations.',
    'Undo them in reverse order: **last on, first off**.',
    'In $ax + b = c,$ take off the $b$ first, then divide by $a.$ Brackets change the order.',
    'Feed your answer forwards through the equation to check it.',
  ],
  next: 'Next: what if the unknown shows up on *both* sides of the equals sign?',
};
