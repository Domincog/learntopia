// Algebra II: Functions & Growth · Lesson 1 · Function Machines
import { r, num, signed, linear } from '../../../kit.js';

/** A number as it is written when it replaces x: negative numbers get brackets. */
const put = (k) => (k < 0 ? `(${k})` : `${k}`);

/** Small graphs for the "is it a function?" question. All share one window. */
const mini = (fns, alt) => ({ type: 'plot', width: 340, height: 340, x: [-4, 4], y: [-4, 4], tickLabels: false, fns: fns.map((f) => ({ color: 'blue', width: 4.5, ...f })), alt });

export default {
  id: 'function-machines',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A machine you can rely on',
      text: `
        Two number machines.

        - **Machine A** answers with the **square** of the number you give it.
        - **Machine B** answers with **a number whose square is the one you gave it**.

        Today you give both machines the number 9. Tomorrow you do it again. **Which machine might give a different answer tomorrow?**
      `,
      shuffle: false,
      options: [
        { text: 'Machine A' },
        { text: 'Machine B', correct: true },
        { text: 'Both' },
        { text: 'Neither' },
      ],
      explain: r`
        Machine A has no choice: 9 goes in, 81 comes out, every time.

        Machine B does have a choice. Both $3$ and $-3$ have the square 9, so it could say 3 today and $-3$ tomorrow.

        A machine like A, where the input settles the output completely, is what mathematics calls a **function**. This lesson is about reading and writing them.
      `,
    },
    {
      id: 'notation',
      type: 'info',
      title: 'Naming the machine',
      text: r`
        In Algebra Foundations you fed numbers to machines like this one. A **function** is a machine that gives **exactly one output for each input**. Give this one a name, $f$, and write its rule like this:

        $$ f(x) = 2x + 1 $$

        - $f$ is the name of the machine.
        - $x$ stands for whatever goes in.
        - $f(x)$, read "$f$ of $x$", is what comes out.

        To work out $f(4)$, put 4 wherever the rule has an $x$: $\;f(4) = 2 \times 4 + 1 = 9$.

        :::warn
        $f(4)$ does **not** mean $f$ times 4. The brackets hold the input.
        :::
      `,
      figure: {
        type: 'op-machine', mode: 'run', ops: ['*2', '+1'], input: 4, exprs: true, static: true,
        alt: 'The machine f with the input 4: 4 is doubled to 8, then 1 is added to make 9.',
      },
    },
    {
      id: 'feed',
      type: 'interact',
      title: 'Meet f',
      text: r`
        Here is the machine $f$ again, now with a slider on its input. $f(x) = 2x + 1$: it doubles whatever goes in, then adds 1.

        **Find the input that makes 13 come out.**
      `,
      widget: {
        type: 'op-machine', mode: 'run', ops: ['*2', '+1'], input: 2, min: -4, max: 10, target: 13, exprs: true,
        alt: 'A machine that multiplies its input by 2 and then adds 1. A slider sets the input.',
      },
      check: (s) => s.hit || (s.output < 13
        ? `${s.input} goes in and ${s.output} comes out. Too small: try a larger input.`
        : `${s.input} goes in and ${s.output} comes out. Too big: try a smaller input.`),
      solution: { input: 6 },
      explain: r`
        $6 \to 12 \to 13$. In symbols:

        $$ f(6) = 13 $$

        Read it "$f$ of 6 is 13". However often you feed this machine a 6, out comes 13: one input, one output.
      `,
    },
    {
      id: 'example-evaluate',
      type: 'info',
      title: 'Worked example: a negative input',
      text: r`
        A rule may use $x$ more than once, and the input may be negative. Replace **every** $x$, and keep a negative input in brackets.

        :::example
        $p(x) = x^2 - 6x$. Find $p(-2)$.

        | Line | Why |
        |---|---|
        | $p(-2) = (-2)^2 - 6 \times (-2)$ | every $x$ becomes $(-2)$ |
        | $= 4 + 12$ | a negative times a negative is positive |
        | $= 16$ | |
        :::

        The brackets matter: $(-2)^2 = 4$, while $-2^2$ means $-(2 \times 2) = -4$.
      `,
    },
    {
      id: 'evaluate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(['f', 'g', 'h']);
        const k = rng.intExcept(-5, 6, [0, 1]);
        const kind = rng.pick(['line', 'square', 'mixed']);
        let rule; let value; let working; let wrong;
        if (kind === 'line') {
          const a = rng.sign() * rng.int(2, 6);
          const b = rng.nonzero(-9, 9);
          rule = linear(a, b);
          value = a * k + b;
          working = r`${a} \times ${put(k)} ${signed(b)} = ${a * k} ${signed(b)}`;
          wrong = [
            [a * k, r`That is $${a} \times ${put(k)}$. The rule also says $${signed(b)}$.`],
            [a + k + b, r`$${a}x$ means $${a}$ **times** $x$, so start with $${a} \times ${put(k)}$.`],
          ];
        } else if (kind === 'square') {
          const c = rng.nonzero(-9, 9);
          rule = `x^2 ${signed(c)}`;
          value = k * k + c;
          working = r`${put(k)}^2 ${signed(c)} = ${k * k} ${signed(c)}`;
          wrong = [[2 * k + c, r`$x^2$ means $x$ times itself, not 2 times $x$: $${put(k)}^2 = ${k * k}$.`]];
          if (k < 0) wrong.push([-k * k + c, r`A negative number times itself is positive: $${put(k)}^2 = ${k * k}$.`]);
        } else {
          const a = rng.int(2, 5);
          rule = `x^2 - ${a}x`;
          value = k * k - a * k;
          working = r`${put(k)}^2 - ${a} \times ${put(k)} = ${k * k} ${signed(-a * k)}`;
          wrong = [[k * k + a * k, r`Check the sign of the second part: $-${a} \times ${put(k)} = ${num(-a * k)}$.`]];
          if (k < 0) wrong.push([-k * k - a * k, r`A negative number times itself is positive: $${put(k)}^2 = ${k * k}$.`]);
        }
        return {
          text: r`
            $$ ${name}(x) = ${rule} $$

            **What is $${name}(${k})$?**
          `,
          answer: value,
          prefix: `$${name}(${k}) =$`,
          wrong,
          hints: [r`Replace every $x$ in the rule by $${k}$${k < 0 ? ', and keep the brackets around it' : ''}.`],
          explain: r`Put $${k}$ in place of $x$: $\;${name}(${k}) = ${working} = ${num(value)}$.`,
        };
      },
    },
    {
      id: 'example-expression',
      type: 'info',
      title: 'Worked example: an expression goes in',
      text: r`
        The input does not have to be a plain number. Whatever stands in the brackets of $h(\;)$ replaces $x$ **as one whole thing**, so it keeps brackets of its own.

        :::example
        $h(x) = 7x - 2$. Find $h(a + 5)$.

        | Line | Why |
        |---|---|
        | $h(a + 5) = 7(a + 5) - 2$ | $x$ becomes $(a + 5)$ |
        | $= 7a + 35 - 2$ | multiply out the bracket |
        | $= 7a + 33$ | collect the numbers |
        :::

        Without the brackets the 5 would miss its "times 7".
      `,
    },
    {
      id: 'plug-expression',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const m = rng.int(2, 6);
        const shift = rng.int(1, 4);
        const c = rng.intExcept(-9, 9, [0, -m * shift]);
        const answer = linear(m, m * shift + c, 'a');
        return {
          title: 'Any input at all',
          text: r`
            The input does not have to be a plain number.

            $$ f(x) = ${linear(m, c)} $$

            **What is $f(a + ${shift})$?** Give your answer without brackets.
          `,
          answer,
          vars: ['a'],
          prefix: `$f(a + ${shift}) =$`,
          placeholder: 'an expression in a',
          expanded: 'That still has brackets in it. Multiply out the bracket and collect the numbers.',
          wrong: [
            [linear(m, c + shift, 'a'), r`That is $f(a) + ${shift}$: the ${shift} was added at the end. Here the **whole** input $a + ${shift}$ goes where $x$ was, so the ${shift} gets multiplied by ${m} as well.`],
            [linear(m, c, 'a'), r`That is $f(a)$. The input here is $a + ${shift}$.`],
          ],
          hints: [
            r`Write $(a + ${shift})$, with brackets, wherever the rule has $x$: $\;${m}(a + ${shift}) ${signed(c)}$.`,
            r`Multiply out: $${m}(a + ${shift}) = ${m}a + ${m * shift}$.`,
          ],
          explain: r`
            $f(a + ${shift}) = ${m}(a + ${shift}) ${signed(c)} = ${m}a + ${m * shift} ${signed(c)} = ${answer}$.

            Whatever stands in the brackets of $f(\;)$ replaces $x$ as one whole thing.
          `,
        };
      },
    },
    {
      id: 'three-views',
      type: 'info',
      title: 'Rule, table, graph',
      text: r`
        One function can be shown in three ways. Take the **rule** $f(x) = x^2$. A **table** lists a few inputs with their outputs:

        | Input $x$ | $-2$ | $-1$ | $0$ | $1$ | $2$ |
        |---|---|---|---|---|---|
        | Output $f(x)$ | $4$ | $1$ | $0$ | $1$ | $4$ |

        A **graph** turns each pair into a point: the input says how far across, the output says how high.

        To read a graph, go the same way: for $f(-2)$, go across to $-2$, then up to the curve. It is at height 4, so $f(-2) = 4$. **Drag the point** to read other inputs.
      `,
      figure: {
        type: 'plot', x: [-4, 4], y: [-2, 6],
        fns: [{ expr: 'x^2', color: 'blue' }],
        points: [
          ...[-1, 0, 1, 2].map((x) => ({ x, y: x * x, color: 'gray', r: 5 })),
          { id: 'P', x: -2, on: 0, drag: 'x', snap: 1, color: 'orange', coords: true },
        ],
        segments: [
          { from: ['Px', '0'], to: 'P', color: 'orange', dashed: true },
          { from: 'P', to: ['0', 'Py'], color: 'orange', dashed: true },
        ],
        alt: 'The graph of f(x) = x squared, a U-shaped curve through (-2, 4), (-1, 1), (0, 0), (1, 1) and (2, 4). A point can be dragged along the curve; dashed lines join it to its input on the x-axis and its output on the y-axis.',
      },
    },
    {
      id: 'plot-it',
      type: 'interact',
      title: 'From rule to picture',
      text: r`
        Now you make the graph. Each point stands for one input: how far across it is. Its height must be the output.

        $$ g(x) = x^2 - 3 $$

        **Drag each point up or down to the height that the rule gives for its input.**
      `,
      widget: {
        type: 'plot', x: [-4, 4], y: [-4, 4],
        points: [-2, -1, 0, 1, 2].map((x, i) => ({ id: 'ABCDE'[i], x, y: 0, drag: 'y', snap: 1, color: 'orange' })),
        alt: 'A coordinate grid with five draggable points at x = -2, -1, 0, 1 and 2. Each can be moved up or down.',
      },
      check: (s) => {
        const ids = ['A', 'B', 'C', 'D', 'E'];
        const off = ids.filter((id) => s[id].y !== s[id].x * s[id].x - 3);
        if (!off.length) return true;
        if (off.length === 5 && ids.every((id) => s[id].y === 0)) return 'Each point stands for one input. Work out the output for that input and drag the point to that height.';
        const x = s[off[0]].x;
        return r`Look at the point at $x = ${x}$. The rule gives $g(${x}) = ${put(x)}^2 - 3$. Is the point at that height?`;
      },
      solution: { A: { x: -2, y: 1 }, B: { x: -1, y: -2 }, C: { x: 0, y: -3 }, D: { x: 1, y: -2 }, E: { x: 2, y: 1 } },
      hints: [r`Start in the middle: $g(0) = 0^2 - 3 = -3$, so the point at $x = 0$ belongs at height $-3$.`],
      explain: r`
        The outputs are $1, -2, -3, -2, 1$. Those five points are five rows of a table.

        Put in every input in between and the points merge into a curve: the parabola you know, moved down by 3. A **rule**, a **table** and a **graph** are three views of the same function.
      `,
    },
    {
      id: 'read-graph',
      type: 'numeric',
      gen: (rng) => {
        const curve = rng.pick([
          { expr: 'x^2/2 - 3', f: (x) => x * x / 2 - 3, xs: [-2, 0, 2] },
          { expr: '3 - abs(x - 1)', f: (x) => 3 - Math.abs(x - 1), xs: [-3, -2, -1, 0, 2, 3, 4] },
          { expr: 'x^2 - 2x - 2', f: (x) => x * x - 2 * x - 2, xs: [-1, 0, 1, 2, 3] },
          { expr: 'abs(x + 1) - 3', f: (x) => Math.abs(x + 1) - 3, xs: [-4, -3, -2, 0, 1, 2, 3] },
          { expr: '4 - x^2/2', f: (x) => 4 - x * x / 2, xs: [-4, -2, 0, 2, 4] },
        ]);
        const k = rng.pick(curve.xs);
        const value = curve.f(k);
        const start = rng.pick(curve.xs.filter((x) => x !== k));
        return {
          title: 'From picture to output',
          text: r`
            This is the graph of a function $h$. Its rule is not given: the graph is all you need.

            **Find $h(${k})$.** You can drag the point along the curve.
          `,
          figure: {
            type: 'plot', x: [-5, 5], y: [-5, 5],
            fns: [{ expr: curve.expr, color: 'blue' }],
            points: [{ id: 'P', x: start, on: 0, drag: 'x', snap: 1, color: 'orange', coords: true }],
            alt: 'The graph of a function h on a grid from -5 to 5 in both directions, with a point that can be dragged along it. The coordinates of the point are shown.',
          },
          answer: value,
          prefix: `$h(${k}) =$`,
          wrong: [[k, 'That is the input. The output is the **height** of the curve at that input.']],
          hints: [r`Go along the $x$-axis to $${k}$, then straight up or down until you meet the curve. How high is it there?`],
          explain: r`At $x = ${k}$ the curve is at height $${num(value)}$, so $h(${k}) = ${num(value)}$. On a graph, the input is read across and the output is read up.`,
        };
      },
    },
    {
      id: 'which-table',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const base = rng.int(1, 4);
        const ins = [base, base + 1, base + 2, base + 3];
        const add = rng.int(2, 6);
        const same = rng.int(3, 9);
        // three machines: one honest, one that repeats an output, one that gives two outputs for one input
        const honest = ins.map((x) => [x, x + add]);
        const repeats = ins.map((x, i) => [x, i === 1 || i === 2 ? same : same + (i === 0 ? -2 : 3)]);
        const twice = ins[rng.int(1, 2)];
        const broken = [[ins[0], ins[0] * 2], [twice, twice * 2], [twice, twice * 2 + 1], [ins[3], ins[3] * 2]];
        const kinds = rng.shuffle([
          { rows: honest, why: 'Every input appears once, with one output. That is a function.' },
          { rows: repeats, why: `Two different inputs may share an output: both ${ins[1]} and ${ins[2]} give ${same} here. The rule is only that one input never gets two outputs.` },
          { rows: broken, correct: true },
        ]);
        const list = (rows) => rows.map(([x, y]) => `${x} → ${y}`).join(', ');
        return {
          title: 'Not every machine is a function',
          text: `
            A function never gives two different outputs for the same input. Each line shows what went into a machine and what came out.

            - **Machine A:** ${list(kinds[0].rows)}
            - **Machine B:** ${list(kinds[1].rows)}
            - **Machine C:** ${list(kinds[2].rows)}

            **Which machine is not a function?**
          `,
          shuffle: false,
          options: kinds.map((kind, i) => ({ text: `Machine ${'ABC'[i]}`, correct: !!kind.correct, why: kind.why })),
          hints: ['Look for an input that appears twice.'],
          explain: `The input ${twice} went in twice and came out once as ${twice * 2} and once as ${twice * 2 + 1}. One input with two different outputs: that machine is not a function. Sharing an output between inputs is allowed.`,
        };
      },
    },
    {
      id: 'vertical-line',
      type: 'interact',
      title: 'One input, how many outputs?',
      text: r`
        On a graph, the outputs for an input are the points straight above or below it.

        This curve is Machine B from the start: for each $x$ it shows **every** number whose square is $x$. **Drag the dashed line to an input that has two outputs.**
      `,
      widget: {
        type: 'plot', x: [-3, 9], y: [-4, 4],
        fns: [{ expr: 'sqrt(x)', from: 0, color: 'blue' }, { expr: '-sqrt(x)', from: 0, color: 'blue' }],
        points: [
          { id: 'P', x: -2, y: 0, drag: 'x', snap: 1, color: 'orange' },
          { x: 'Px', on: 0, color: 'orange', r: 7 },
          { x: 'Px', on: 1, color: 'orange', r: 7 },
        ],
        vlines: [{ x: 'Px', color: 'orange', dashed: true }],
        readouts: [{ label: 'outputs at this input', value: (st) => (st.P.x > 0 ? 2 : st.P.x === 0 ? 1 : 0), digits: 0 }],
        alt: 'A curve shaped like a parabola lying on its side, opening to the right from the origin. A vertical dashed line can be dragged left and right, and the places where it meets the curve are marked.',
      },
      check: (s) => {
        if (s.P.x > 0) return true;
        if (s.P.x === 0) return 'At 0 the line meets the curve once: the only number whose square is 0 is 0 itself. Move the line further.';
        return 'Here the line misses the curve: no number on the number line has a negative square, so this input has no output at all. Try the other side.';
      },
      solution: { P: { x: 4, y: 0 } },
      explain: r`
        For any positive input the line meets the curve twice: at $x = 4$, at $2$ and at $-2$. One input, two outputs, so this curve is not the graph of a function.
      `,
    },
    {
      id: 'vertical-line-test',
      type: 'info',
      title: 'The vertical line test',
      text: r`
        What you just did works on any graph.

        :::key
        **Vertical line test.** If some vertical line meets a graph more than once, the graph is not a function.
        :::

        Keep only the [upper half]{.blue} of the curve and the test is passed: every vertical line now meets it once at most. That half has a name, the **square root**: $\sqrt{x}$ is the number, zero or positive, whose square is $x$. So $\sqrt{4}$ means $2$, never $-2$.
      `,
      figure: {
        type: 'plot', x: [-3, 9], y: [-4, 4],
        fns: [{ expr: 'sqrt(x)', from: 0, color: 'blue' }, { expr: '-sqrt(x)', from: 0, color: 'gray', dashed: true }],
        points: [{ x: 4, y: 2, color: 'orange', r: 7 }],
        vlines: [{ x: 4, color: 'orange', dashed: true }],
        labels: [{ x: 6.6, y: 3.3, text: 'y = √x', color: 'blue' }],
        alt: 'The sideways parabola again. Its upper half, the graph of the square root of x, is drawn in blue; the lower half is dashed and grey. A vertical line at x = 4 meets the blue half once, at height 2.',
      },
    },
    {
      id: 'graphs',
      type: 'multi',
      review: true,
      title: 'Use the test',
      text: 'Imagine a vertical line sweeping across each graph. **Select every graph that is a function.**',
      shuffle: false,
      options: [
        { text: '', figure: mini([{ expr: 'x^2 - 2' }], 'A U-shaped parabola'), correct: true },
        { text: '', figure: mini([{ expr: 'sqrt(9 - x^2)', from: -3, to: 3 }, { expr: '-sqrt(9 - x^2)', from: -3, to: 3 }], 'A circle around the origin'), why: 'A vertical line through the inside of the circle meets it twice: once on top, once below.' },
        { text: '', figure: mini([{ expr: 'x^3/4 - x' }], 'A curve that rises, dips and rises again from left to right'), correct: true },
        { text: '', figure: mini([{ expr: 'x', from: 0 }, { expr: '-x', from: 0 }], 'A V lying on its side, with its corner at the origin and opening to the right'), why: 'This V lies on its side. Any vertical line to the right of the corner meets both arms.' },
      ],
      hints: ['A graph may go up and down as much as it likes. What it may not do is pass twice over the same input.'],
      explain: 'The parabola and the wavy curve are functions: every vertical line meets them once. The circle and the sideways V are not: lines through them meet the graph twice.',
    },
    {
      id: 'domain',
      type: 'bucket',
      title: 'Which inputs make sense?',
      text: r`
        Some machines refuse some inputs. Nothing can be divided by zero, and $\sqrt{x}$ has no answer on the number line when $x$ is negative.

        **Sort the functions by the inputs they accept.**
      `,
      buckets: ['Every number', 'Every number but one', 'Only zero and positive numbers'],
      items: [
        { text: r`$f(x) = 5x - 2$`, bucket: 0, why: 'Any number can be multiplied by 5 and have 2 taken away.' },
        { text: r`$g(x) = x^2 + 1$`, bucket: 0, why: 'Any number can be squared, negative ones included.' },
        { text: r`$h(x) = \dfrac{1}{x}$`, bucket: 1, why: 'Only 0 is refused: you cannot divide by zero.' },
        { text: r`$k(x) = \dfrac{6}{x - 3}$`, bucket: 1, why: r`At $x = 3$ the bottom is zero. Every other input is fine, including 0.` },
        { text: r`$s(x) = \sqrt{x}$`, bucket: 2, why: 'A square root needs a number that is zero or positive.' },
        { text: r`$t(x) = 2\sqrt{x} + 1$`, bucket: 2, why: r`The first thing this machine does is take $\sqrt{x}$, so it has the same limits.` },
      ],
      explain: r`
        The set of inputs a function accepts is called its **domain**. For most rules it is every number. Watch out for two things: an $x$ on the bottom of a fraction, and an $x$ under a square root.
      `,
    },
    {
      id: 'meaning',
      type: 'choice',
      gen: (rng) => {
        const p = rng.int(2, 6);
        const q = rng.intExcept(8, 30, [p * 2, p * 3, p * 4, p * 5]);
        const story = rng.pick([
          { name: 'h', letter: 't', about: r`A ball is thrown into the air. $h(t)$ is its height in metres $t$ seconds after the throw.`, right: `After ${p} seconds the ball is ${q} metres high`, swapped: `After ${q} seconds the ball is ${p} metres high`, other: `The ball is in the air for ${p} seconds`, input: 'the time' },
          { name: 'C', letter: 'd', about: r`A courier charges by distance. $C(d)$ is the cost in coins of sending a parcel $d$ kilometres.`, right: `Sending a parcel ${p} kilometres costs ${q} coins`, swapped: `Sending a parcel ${q} kilometres costs ${p} coins`, other: `Each kilometre costs ${p} coins`, input: 'the distance' },
          { name: 'T', letter: 'n', about: r`A weather station records the temperature. $T(n)$ is the temperature in degrees Celsius $n$ hours after midnight.`, right: `${p} hours after midnight it is ${q} °C`, swapped: `${q} hours after midnight it is ${p} °C`, other: `The temperature rises by ${p} °C every hour`, input: 'the time' },
        ]);
        return {
          text: r`
            ${story.about}

            **What does $${story.name}(${p}) = ${q}$ say?**
          `,
          options: [
            { text: story.right, correct: true },
            { text: story.swapped, why: `The number in the brackets is the input, and here the input is ${story.input}.` },
            { text: `$${story.name}$ times ${p} is ${q}`, why: `The brackets do not mean "times". They hold the input of the function $${story.name}$.` },
            { text: story.other, why: `The statement is about one input, ${p}, and its output, ${q}. It says nothing more general than that.` },
          ],
          explain: r`$${story.name}(${p}) = ${q}$ pairs one input with its output: the input ${p} goes in the brackets, and the output ${q} stands after the equals sign.`,
        };
      },
    },
    {
      id: 'twice',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const a = rng.int(2, 4);
        const k = rng.int(1, 4);
        const b = rng.intExcept(-5, 5, [0, k - a * k]);   // not 0, and f(k) is not k itself
        const once = a * k + b;
        const value = a * once + b;
        return {
          title: 'Feed it its own output',
          text: r`
            $$ f(x) = ${linear(a, b)} $$

            The output of a function is a number, so it can go straight back in as an input. **What is $f(f(${k}))$?**
          `,
          answer: value,
          wrong: [
            [once, r`That is $f(${k})$. Now feed that number into $f$ once more.`],
            [2 * once, r`$f(f(${k}))$ is not twice $f(${k})$. Work from the inside out: find $f(${k})$, then put that number into the rule.`],
          ],
          hints: [
            r`Start with the inner one: $f(${k}) = ${a} \times ${k} ${signed(b)}$.`,
            r`$f(${k}) = ${num(once)}$. So you need $f(${num(once)})$.`,
          ],
          explain: r`Inside first: $f(${k}) = ${num(once)}$. Then $f(${num(once)}) = ${a} \times ${put(once)} ${signed(b)} = ${num(value)}$.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A circle is a perfectly good curve, and yet it is not the graph of a function.

        **In your own words: why not? And how could you cut it into pieces that are?**
      `,
      model: `
        A function gives exactly one output for each input. On a circle, a vertical line through almost any input meets the curve twice, once at the top and once at the bottom, so that input would have two outputs.

        Cut the circle along its horizontal middle line. The upper half and the lower half each pass the vertical line test, so each half is the graph of a function.
      `,
    },
  ],
  recap: [
    'A function gives **exactly one output for each input**. $f(3)$ means: put 3 into the rule called $f$.',
    'A rule, a table and a graph are three views of the same function.',
    'Vertical line test: if a vertical line can meet a graph twice, the graph is not a function.',
    'The domain is the set of inputs that make sense: no dividing by zero, no square roots of negative numbers.',
  ],
  next: 'Next: change a formula a little, and its whole graph slides, stretches or flips.',
};
