// Algebra II: Functions & Growth · Lesson 2 · Shift, Stretch, Flip
import { r, num, signed } from '../../../kit.js';
import { SQUARE } from '../helpers.js';

/** The three basic shapes used in this lesson, with the name of their special point. */
const SHAPES = [
  { key: 'abs', name: r`|x|`, special: 'corner', ask: 'Where is the **corner** of this V?', moved: (h, k) => r`|x ${signed(-h)}| ${signed(k)}` },
  { key: 'sqrt', name: r`\sqrt{x}`, special: 'starting point', ask: 'Where does this curve **start**?', moved: (h, k) => r`\sqrt{x ${signed(-h)}} ${signed(k)}` },
  { key: 'square', name: r`x^2`, special: 'vertex', ask: 'Where is the **vertex** of this parabola?', moved: (h, k) => r`(x ${signed(-h)})^2 ${signed(k)}` },
];

export default {
  id: 'transformations',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'An old trick on a new curve',
      text: r`
        In Algebra Foundations you slid a parabola around: $y = (x - 3)^2 + 2$ has its vertex at $(3, 2)$.

        Here is a different function, $y = \sqrt{x}$. It starts at $(0, 0)$. **Which formula gives the same curve starting at the orange dot, $(3, 2)$?**
      `,
      figure: {
        type: 'plot', x: [-1, 9], y: [-1, 5],
        fns: [{ expr: 'sqrt(x)', from: 0, color: 'blue' }],
        points: [{ x: 0, y: 0, color: 'blue' }, { x: 3, y: 2, color: 'orange' }],
        alt: 'The curve y = square root of x, rising from the origin and flattening out. An orange dot marks the point (3, 2).',
      },
      shuffle: false,
      options: [
        { text: r`$y = \sqrt{x - 3} + 2$`, correct: true },
        { text: r`$y = \sqrt{x + 3} + 2$` },
        { text: r`$y = \sqrt{x} - 3 + 2$` },
        { text: r`$y = 3\sqrt{x} + 2$` },
      ],
      explain: r`
        The first one: the same pattern as for the parabola.

        That is not a coincidence. The trick has nothing to do with squares or square roots. It works on **every** function, and this lesson shows why. Along the way you will meet two more ways to change a graph: stretching and flipping.
      `,
    },
    {
      id: 'absolute-value',
      type: 'info',
      title: 'A shape to practise on',
      text: r`
        The **absolute value** $|x|$ is the distance of $x$ from zero. A distance is never negative, so it throws the minus sign away: $|{-3}| = 3$, and $|3| = 3$ too.

        Plot $y = |x|$ and you get a **V** with its corner at $(0, 0)$: the heights come down to zero and go straight back up.

        The corner makes it easy to see where the graph has gone when you change the formula.
      `,
      figure: {
        type: 'plot', ...SQUARE,
        fns: [{ expr: 'abs(x)', color: 'blue' }],
        segments: [
          { from: [-3, 0], to: [-3, 3], color: 'orange', dashed: true },
          { from: [3, 0], to: [3, 3], color: 'orange', dashed: true },
        ],
        points: [{ x: -3, y: 3, color: 'orange' }, { x: 3, y: 3, color: 'orange' }, { x: 0, y: 0, color: 'blue' }],
        labels: [
          { x: -3, y: 3, text: '|−3| = 3', color: 'orange', dx: 14, dy: 5 },
          { x: 3, y: 3, text: '|3| = 3', color: 'orange', dx: -14, dy: 5, anchor: 'end' },
          { x: 0, y: -1, text: 'corner', color: 'blue', dx: 10, dy: 5 },
        ],
        alt: 'The graph of y = absolute value of x: a V with its corner at the origin. The points (-3, 3) and (3, 3) are marked: both inputs are at distance 3 from zero.',
      },
    },
    {
      id: 'meet-v',
      type: 'fill',
      title: 'Its table',
      text: r`
        $|x|$ is the distance of $x$ from zero. **Complete the table of $y = |x|$.**
      `,
      template: r`
        | $x$ | $-3$ | $-2$ | $-1$ | $0$ | $1$ | $2$ |
        |:--|--:|--:|--:|--:|--:|--:|
        | $\lvert x \rvert$ | [[3]] | 2 | [[1]] | [[0]] | 1 | [[2]] |
      `,
      explain: r`
        $3, 2, 1, 0, 1, 2$: down to zero and straight back up. Those are the two arms of the V, and the 0 in the middle is its corner.
      `,
    },
    {
      id: 'slide',
      type: 'interact',
      title: 'Slide the V',
      text: r`
        Two sliders, in the same places as for the parabola:

        $$ y = |x - \blue{h}| + \orange{k} $$

        **Put the corner of the V on the orange dot at $(2, -3)$.**
      `,
      widget: {
        type: 'plot', ...SQUARE,
        params: {
          h: { min: -4, max: 4, step: 1, value: 0, label: '$h$', color: 'blue' },
          k: { min: -3, max: 3, step: 1, value: 0, label: '$k$', color: 'orange' },
        },
        fns: [
          { expr: 'abs(x)', color: 'gray', dashed: true, width: 2 },
          { expr: 'abs(x - h) + k', color: 'blue' },
        ],
        points: [{ x: 2, y: -3, color: 'orange' }],
        alt: 'A V-shaped graph that can be moved sideways with a slider h and up or down with a slider k. The original V is dashed, and an orange dot marks the point (2, -3).',
      },
      check: (s) => {
        if (s.h === 2 && s.k === -3) return true;
        if (s.h === -2) return r`The V went **left**: with $h = -2$ the formula reads $|x + 2|$. Send it the other way.`;
        if (s.h !== 2) return r`Use $h$ first: slide the V sideways until its corner is straight above or below the dot.`;
        return s.k > -3 ? 'The corner is straight above the dot. Bring it down.' : 'The corner is below the dot. Bring it up.';
      },
      solution: { h: 2, k: -3 },
      explain: r`
        $y = |x - 2| - 3$. The corner sits at $(h, k)$, exactly as the vertex of the parabola did.

        The $-3$ does what it says: every output is 3 less, so the graph is 3 lower. The 2 looks wrong at first: the formula says $x$ **minus** 2 and the graph went to the **right**.
      `,
    },
    {
      id: 'why-right',
      type: 'fill',
      title: 'Why minus goes right',
      text: r`
        Feed the same inputs to the old machine and to the new one.
      `,
      template: r`
        | $x$ | $0$ | $1$ | $2$ | $3$ | $4$ |
        |:--|--:|--:|--:|--:|--:|
        | $\lvert x \rvert$ | 0 | 1 | 2 | 3 | 4 |
        | $\lvert x - 2 \rvert$ | 2 | [[1]] | [[0]] | [[1]] | [[2]] |

        The output 0, the corner, has moved from $x = 0$ to $x =$ [[2]].
      `,
      hints: [r`For $x = 1$: first $1 - 2 = -1$, then the distance of $-1$ from zero.`],
      explain: r`
        The new machine subtracts 2 **before** it does anything else. So it needs an input that is 2 larger to do what the old machine did: $|x - 2|$ does at $x = 2$ what $|x|$ did at $x = 0$.

        Every feature of the graph turns up 2 units later, and "later" on the $x$-axis is to the right.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Inside and outside',
      text: r`
        Nothing in that argument used the V. It works for any function $f$.

        :::key
        **Outside** the function: $\;y = f(x) + k\;$ moves the graph **up** by $k$.

        **Inside**, next to $x$: $\;y = f(x - h)\;$ moves it **right** by $h$.
        :::

        A change outside acts on the output, and does what it says. A change inside acts on the input, and works backwards: $x - 3$ moves the graph right, $x + 3$ moves it left.

        The picture shows $\sqrt{x}$ and $\sqrt{x - 3} + 2$: the answer to the opening question.
      `,
      figure: {
        type: 'plot', x: [-1, 9], y: [-1, 5],
        fns: [
          { expr: 'sqrt(x)', from: 0, color: 'gray', dashed: true, width: 2.5 },
          { expr: 'sqrt(x - 3) + 2', from: 3, color: 'blue' },
        ],
        segments: [
          { from: [0, 0], to: [3, 0], color: 'orange', width: 3.5 },
          { from: [3, 0], to: [3, 2], color: 'violet', width: 3.5 },
        ],
        points: [{ x: 0, y: 0, color: 'gray' }, { x: 3, y: 2, color: 'blue' }],
        labels: [
          { x: 1.5, y: 0, text: '3 right', color: 'orange', dy: -12, anchor: 'middle' },
          { x: 3, y: 1, text: '2 up', color: 'violet', dx: 10, dy: 5 },
        ],
        alt: 'The square root curve drawn dashed from the origin, and a copy of it starting at (3, 2). Arrows show the move: 3 to the right, then 2 up.',
      },
    },
    {
      id: 'special-point',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const shape = rng.pick(SHAPES);
        const h = rng.nonzero(-6, 6);
        const k = rng.intExcept(-6, 6, [0, h, -h]);
        const inside = `x ${signed(-h)}`;
        return {
          text: r`
            $$ y = ${shape.moved(h, k)} $$

            The graph of $y = ${shape.name}$ has its ${shape.special} at $(0, 0)$. ${shape.ask}
          `,
          template: r`At $x =$ [[${h}]] and $y =$ [[${k}]].`,
          hints: [
            r`The ${shape.special} is where the inside, $${inside}$, equals zero.`,
            r`$${inside} = 0$ when $x = ${num(h)}$. The $${signed(k)}$ outside then moves the graph ${k > 0 ? 'up' : 'down'}.`,
          ],
          explain: r`The inside, $${inside}$, is zero at $x = ${num(h)}$: that is ${Math.abs(h)} to the ${h > 0 ? 'right' : 'left'}. The $${signed(k)}$ outside moves the graph ${Math.abs(k)} ${k > 0 ? 'up' : 'down'}. So the ${shape.special} is at $(${num(h)},\ ${num(k)})$.`,
        };
      },
    },
    {
      id: 'teach-stretch',
      type: 'info',
      title: 'Multiply the output',
      text: r`
        So far you have added. Now **multiply** the output by a number $a$:

        $$ y = a \cdot f(x) $$

        Every height is multiplied by $a$, so the graph **stretches** away from the $x$-axis: [$y = 2\,|x|$]{.blue} is twice as tall as $y = |x|$ everywhere. When $a$ is between $-1$ and $1$, the graph is squashed towards the axis instead.

        A negative $a$ also **flips** the graph over the $x$-axis, because every output changes sign: [$y = -|x|$]{.orange} is the V upside down. It is the same thing $a$ did in $y = ax^2$.
      `,
      figure: {
        type: 'plot', ...SQUARE,
        fns: [
          { expr: 'abs(x)', color: 'gray', dashed: true, width: 2.5 },
          { expr: '2*abs(x)', color: 'blue' },
          { expr: '-abs(x)', color: 'orange' },
        ],
        segments: [{ from: [1.5, 1.5], to: [1.5, 3], color: 'blue', dashed: true }, { from: [1.5, 1.5], to: [1.5, -1.5], color: 'orange', dashed: true }],
        points: [{ x: 1.5, y: 1.5, color: 'gray' }, { x: 1.5, y: 3, color: 'blue' }, { x: 1.5, y: -1.5, color: 'orange' }],
        labels: [
          { x: 1.5, y: 3, text: '× 2', color: 'blue', dx: 12, dy: 5 },
          { x: 1.5, y: -1.5, text: '× (−1)', color: 'orange', dx: 12, dy: 5 },
          { x: -5.6, y: 3.2, text: 'y = |x|', color: 'gray', anchor: 'start' },
        ],
        alt: 'Three V shapes with their corner at the origin: the plain V dashed in grey, a V twice as steep in blue, and an upside-down V in orange. At x = 1.5 the heights are 1.5, 3 and -1.5.',
      },
    },
    {
      id: 'stretch-flip',
      type: 'interact',
      title: 'Taller, flatter, upside down',
      text: r`
        Your turn to choose the number:

        $$ y = \blue{a}\,|x| $$

        Try the slider, negative values included. **Make the V pass through both orange dots.**
      `,
      widget: {
        type: 'plot', ...SQUARE,
        params: { a: { min: -3, max: 3, step: 0.5, value: 1, label: '$a$', color: 'blue' } },
        fns: [
          { expr: 'abs(x)', color: 'gray', dashed: true, width: 2 },
          { expr: 'a*abs(x)', color: 'blue' },
        ],
        points: [{ x: 2, y: -3, color: 'orange' }, { x: -2, y: -3, color: 'orange' }],
        alt: 'A V-shaped graph with its corner at the origin and a slider a that makes it steeper, flatter or turns it upside down. Orange dots mark (2, -3) and (-2, -3).',
      },
      check: (s) => {
        if (s.a === -1.5) return true;
        if (s.a === 0) return r`With $a = 0$ every output is 0: the V has been squashed into a flat line.`;
        if (s.a > 0) return 'This V opens upwards, and the dots are below the axis. Try a negative number.';
        return s.a < -1.5
          ? r`Too steep: at $x = 2$ the V is already below the dot.`
          : r`Too flat: at $x = 2$ the V has not come down to the dot yet.`;
      },
      solution: { a: -1.5 },
      hints: [r`At $x = 2$ the plain V has the height 2. The dot is at height $-3$. What must you multiply 2 by?`],
      explain: r`
        $y = -1.5\,|x|$, since $-1.5 \times 2 = -3$.

        The minus sign flips the V over the $x$-axis, and the 1.5 makes every height one and a half times as large.
      `,
    },
    {
      id: 'teach-mirror',
      type: 'info',
      title: 'Two mirrors',
      text: r`
        A minus sign can stand in two places.

        :::key
        **Outside**: $\;y = -f(x)\;$ changes the sign of every **output**. It swaps up with down.

        **Inside**: $\;y = f(-x)\;$ changes the sign of every **input**. It swaps left with right.
        :::

        The grey curve is $f(x) = (x - 2)^2$. [$-f(x)$]{.orange} hangs upside down below it. [$f(-x)$]{.blue} does at $x = -2$ what $f$ did at $x = 2$: it is the mirror image of $f$ in the $y$-axis.
      `,
      figure: {
        type: 'plot', ...SQUARE,
        fns: [
          { expr: '(x - 2)^2', color: 'gray', dashed: true, width: 2.5 },
          { expr: '-(x - 2)^2', color: 'orange' },
          { expr: '(-x - 2)^2', color: 'blue' },
        ],
        points: [{ x: 2, y: 0, color: 'gray' }, { x: -2, y: 0, color: 'blue' }],
        labels: [
          { x: 2, y: 3.3, text: 'f(x)', color: 'gray', anchor: 'middle' },
          { x: -2, y: 3.3, text: 'f(−x)', color: 'blue', anchor: 'middle' },
          { x: 2, y: -3.4, text: '−f(x)', color: 'orange', anchor: 'middle' },
        ],
        alt: 'A grey dashed parabola with its vertex at (2, 0), opening upwards. An orange copy with the same vertex opens downwards. A blue copy opening upwards has its vertex at (-2, 0), the mirror image in the y-axis.',
      },
    },
    {
      id: 'mirror',
      type: 'interact',
      title: 'The other mirror',
      text: r`
        The top graph is $y = \sqrt{x}$. Now put a minus sign **inside**, next to $x$.

        **Tap the graph of $y = \sqrt{-x}$.**
      `,
      widget: {
        type: 'graph-pick', x: [-6, 6], y: [-4, 4], yStep: 2, xStep: 2,
        given: { expr: 'sqrt(x)', color: 'blue', label: 'y = √x' },
        options: [
          { expr: '-sqrt(x)', alt: 'a curve from the origin going down and to the right' },
          { expr: 'sqrt(-x)', alt: 'a curve from the origin going up and to the left' },
          { expr: '-sqrt(-x)', alt: 'a curve from the origin going down and to the left' },
          { expr: 'sqrt(x) - 3', alt: 'the same curve as on top, moved down by 3' },
        ],
        alt: 'The graph of the square root of x on top, and four candidate graphs below it, lettered A to D.',
      },
      check: (s) => {
        if (s.picked === 1) return true;
        if (s.picked === 0) return r`Graph A is $y = -\sqrt{x}$: the **outputs** changed sign, so it hangs below the axis. In $\sqrt{-x}$ it is the input that changes sign.`;
        if (s.picked === 2) return r`Graph C has been flipped both ways: it is $y = -\sqrt{-x}$. Here only the input changes sign.`;
        if (s.picked === 3) return r`Graph D is $y = \sqrt{x} - 3$: moved down, not mirrored.`;
        return false;
      },
      solution: { picked: 1 },
      hints: [r`Try an input: at $x = -4$ you get $\sqrt{-(-4)} = \sqrt{4} = 2$. So the point $(-4, 2)$ must be on the graph.`],
      explain: r`
        $\sqrt{-x}$ needs $-x$ to be zero or positive, so it lives on the **left**: for example $\sqrt{-(-4)} = 2$. It is the mirror image of $\sqrt{x}$ in the $y$-axis.

        The minus sign is inside, so it is the inputs that changed sign: left and right have swapped, and nothing has moved up or down.
      `,
    },
    {
      id: 'write-formula',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const dx = rng.nonzero(-7, 7);
        const dy = rng.intExcept(-7, 7, [0, dx, -dx]);
        const across = `${Math.abs(dx)} to the ${dx > 0 ? 'right' : 'left'}`;
        const up = `${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}`;
        const sign = (positive) => (positive ? '[[*+|−]]' : '[[+|*−]]');
        return {
          text: r`
            The graph of $y = f(x)$ is moved **${across}** and **${up}**.

            **Complete the formula of the new graph.**
          `,
          template: r`$y = f(x$ ${sign(dx < 0)} [[${Math.abs(dx)}]] $)$ ${sign(dy > 0)} [[${Math.abs(dy)}]]`,
          hints: [
            'The sideways move goes inside the brackets, next to $x$. The up-or-down move goes outside.',
            `Inside works backwards: to move ${dx > 0 ? 'right' : 'left'}, you ${dx > 0 ? 'subtract' : 'add'}.`,
          ],
          explain: r`$y = f(x ${signed(-dx)}) ${signed(dy)}$. Inside, moving ${dx > 0 ? 'right' : 'left'} by ${Math.abs(dx)} means $x ${signed(-dx)}$: the sign is the opposite of what you might expect. Outside, ${up} is simply $${signed(dy)}$.`,
        };
      },
    },
    {
      id: 'domain',
      type: 'choice',
      title: 'The domain moves too',
      text: r`
        $\sqrt{x}$ accepts only inputs that are zero or positive.

        **Which inputs does $\;y = \sqrt{x - 3} + 2\;$ accept?**
      `,
      options: [
        { text: 'Only 3 and larger numbers', correct: true },
        { text: r`Only $-3$ and larger numbers`, why: r`Try $x = -3$: the inside is $-3 - 3 = -6$, and $\sqrt{-6}$ has no value on the number line.` },
        { text: 'Only 2 and larger numbers', why: r`The $+2$ is outside the root. It lifts the graph; it does not change which inputs are allowed. Try $x = 2$: the inside is $-1$.` },
        { text: 'Every number', why: r`The square root is still there, and it still refuses negative numbers. Try $x = 0$: the inside is $-3$.` },
      ],
      explain: r`
        What is under the root must be zero or positive: $x - 3$ is zero at $x = 3$ and positive beyond it.

        The graph moved 3 to the right, and its domain moved with it.
      `,
    },
    {
      id: 'match',
      type: 'match',
      review: true,
      text: r`Match each formula with what it does to the graph of $y = f(x)$.`,
      pairs: [
        [r`$y = f(x) + 3$`, 'Moves it 3 up'],
        [r`$y = f(x + 3)$`, 'Moves it 3 to the left'],
        [r`$y = 3f(x)$`, 'Makes it 3 times as tall'],
        [r`$y = -f(x)$`, 'Turns it upside down'],
        [r`$y = f(-x)$`, 'Mirrors it left to right'],
      ],
      hints: ['Is the change inside the brackets (it acts on the input, sideways) or outside (it acts on the output, up and down)?'],
      explain: r`
        Outside changes act on the output: $+3$ lifts, $\times 3$ stretches upwards, a minus sign flips top to bottom.

        Inside changes act on the input and so work sideways: $x + 3$ shifts **left**, and $-x$ mirrors left to right.
      `,
    },
    {
      id: 'point-moves',
      type: 'fill',
      stretch: true,
      gen: (rng) => {
        const p = rng.nonzero(-5, 5);
        const q = rng.intExcept(-6, 6, [0, p]);
        const h = rng.nonzero(-4, 4);
        const k = rng.nonzero(-5, 5);
        const kind = rng.pick(['shift', 'flip', 'double']);
        let formula; let x; let y; let why;
        if (kind === 'shift') {
          formula = r`f(x ${signed(-h)}) ${signed(k)}`;
          x = p + h; y = q + k;
          why = r`Put $x = ${num(x)}$ into the new formula: $f(${num(x)} ${signed(-h)}) ${signed(k)} = f(${num(p)}) ${signed(k)} = ${num(q)} ${signed(k)} = ${num(y)}$.`;
        } else if (kind === 'flip') {
          formula = r`-f(x ${signed(-h)})`;
          x = p + h; y = -q;
          why = r`Put $x = ${num(x)}$ into the new formula: $-f(${num(x)} ${signed(-h)}) = -f(${num(p)}) = ${num(y)}$.`;
        } else {
          formula = r`2f(x) ${signed(k)}`;
          x = p; y = 2 * q + k;
          why = r`Put $x = ${num(x)}$ into the new formula: $2f(${num(p)}) ${signed(k)} = 2 \times ${q < 0 ? `(${num(q)})` : num(q)} ${signed(k)} = ${num(y)}$.`;
        }
        return {
          title: 'Without knowing the function',
          text: r`
            The point $(${num(p)},\ ${num(q)})$ lies on the graph of $y = f(x)$. That is all you know about $f$.

            **Which point must lie on the graph of $\;y = ${formula}\,$?**
          `,
          template: r`The point $($ [[${x}]] $,$ [[${y}]] $)$`,
          hints: [
            r`You know one fact: $f(${num(p)}) = ${num(q)}$. Which $x$ makes the new formula use exactly that fact?`,
            kind === 'double' ? r`Use $x = ${num(p)}$, then work out the output.` : r`You need the inside, $x ${signed(-h)}$, to equal $${num(p)}$. So $x = ${num(x)}$.`,
          ],
          explain: r`${why} The move is the same for every point of the graph, whatever $f$ is.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A friend says: "$y = f(x + 2)$ has a plus in it, so the graph moves 2 to the right."

        **How would you convince them that it moves left?**
      `,
      model: r`
        Ask where the new graph does what the old one did at $x = 0$. The new machine adds 2 to its input before doing anything else, so it reaches "inside equals 0" already at $x = -2$.

        For example, the corner of $y = |x|$ is at $x = 0$, and the corner of $y = |x + 2|$ is where $x + 2 = 0$, at $x = -2$. Every feature of the graph turns up 2 units earlier: 2 to the left.
      `,
    },
  ],
  recap: [
    'Outside the function: $f(x) + k$ moves the graph up by $k$. Inside: $f(x - h)$ moves it **right** by $h$.',
    'Inside changes act on the input and work backwards: $x - 3$ goes right, $x + 3$ goes left.',
    '$a \\cdot f(x)$ stretches the graph away from the $x$-axis; a negative $a$ also flips it upside down.',
    '$-f(x)$ swaps up and down. $f(-x)$ swaps left and right.',
  ],
  next: 'Next: what changes when the equals sign in an equation becomes "less than"?',
};
