// Linear Algebra: Vectors & Matrices · Lesson 1 · Arrows With a Purpose
import { r, num } from '../../../kit.js';
import { vec, par, vecBlanks } from '../helpers.js';

// The two arrows of most pictures, in the colours they are drawn in: U and V inside a formula, Uw and Vw in a sentence.
const U = r`\blue{\mathbf{u}}`;
const V = r`\orange{\mathbf{v}}`;
const Uw = `$${U}$`;
const Vw = `$${V}$`;

/** Right-angled triangles with whole-number sides, for arrows whose length comes out whole. */
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];

export default {
  id: 'vectors',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two legs of a journey',
      text: `
        A delivery drone flies **4 km east and 1 km north**, drops a parcel, then flies
        **1 km east and 3 km north**.

        A second drone leaves from the same spot and flies the same two legs **in the opposite order**.

        **Where does the second drone end up?**
      `,
      shuffle: false,
      options: [
        { text: 'In exactly the same place as the first', correct: true },
        { text: 'Further north than the first' },
        { text: 'Further east than the first' },
        { text: 'You cannot tell without a map' },
      ],
      explain: `
        Both drones finish 5 km east and 4 km north of the start.

        Each leg is a **move**: so far across, so far up. This lesson is about moves like that:
        how to add them, how to stretch them, and how two of them are enough to get anywhere.
      `,
    },
    {
      id: 'teach-vector',
      type: 'info',
      title: 'A move, drawn and written',
      text: r`
        A **vector** is a move: so far across, so far up. Draw it as an arrow. Write it as two
        numbers in a column, with the across number on top:

        $$ \begin{pmatrix} 3 \\ 2 \end{pmatrix} \;\; \text{means 3 to the right, 2 up} $$

        A negative number means the other way: **left** for the top number, **down** for the
        bottom one.

        In this course an arrow usually starts at the **origin**, the point where the two axes
        cross. Its tip then sits at the point whose coordinates are the two numbers.

        Drag the tip and watch the column change.
      `,
      figure: {
        type: 'vector-plane', x: [-6, 6], y: [-6, 6],
        vectors: [{ id: 'v', x: 3, y: 2, drag: true, legs: true }],
        line: 'vector',
        alt: 'A grid with one arrow from the origin, 3 across and 2 up. Dotted legs show how far across and how far up it goes, and the same two numbers are written as a column under the picture. The tip can be dragged.',
      },
    },
    {
      id: 'draw',
      type: 'interact',
      title: 'Draw one',
      text: r`
        The top number is the move across. The bottom number is the move up.

        **Drag the tip so that the arrow shows** $\;\begin{pmatrix} -4 \\ 3 \end{pmatrix}.$
      `,
      widget: {
        type: 'vector-plane', x: [-6, 6], y: [-6, 6],
        vectors: [{ id: 'v', x: 3, y: 2, drag: true, legs: true, label: false }],
        line: false,
        alt: 'A grid with one arrow from the origin. Its tip can be dragged. Dotted legs show how far across and how far up it goes.',
      },
      check: (s) => {
        const { x, y } = s.v;
        if (x === -4 && y === 3) return true;
        if (x === 4 && y === 3) return 'That arrow goes 4 to the **right**. The top number is −4, so it should go left.';
        if (x === -4 && y === -3) return 'That arrow goes 3 **down**. The bottom number is +3, so it should go up.';
        if (x === 3 && y === -4) return 'Top and bottom are the wrong way round. The top number is the move across; the bottom number is the move up.';
        return `This arrow goes ${num(x)} across and ${num(y)} up. You need −4 across and 3 up.`;
      },
      solution: { v: { x: -4, y: 3 } },
      explain: r`
        Four to the left, three up: the minus sign belongs to the move across.

        A vector is only the move itself, so the same arrow could start anywhere. Started at the
        origin, its tip sits at the point $(-4, 3)$.
      `,
    },
    {
      id: 'tip-to-tail',
      type: 'interact',
      title: 'One move after another',
      text: r`
        To do the move ${Uw} and then the move ${Vw}, start the second arrow where the first one
        ends: **tip to tail**. The dashed arrow is ${Vw}, carried to the tip of ${Uw}.

        **Drag the green arrow so that it does both moves in one go.**
      `,
      widget: {
        type: 'vector-plane', x: [-1, 7], y: [-1, 7],
        vectors: [
          { id: 'u', x: 4, y: 1, color: 'blue' },
          { id: 'v', x: 1, y: 3, color: 'orange' },
          { id: 'w', x: 2, y: 0, color: 'green', drag: true, label: false },
        ],
        sum: { of: ['u', 'v'], show: false, routes: 'one' },
        line: false,
        alt: 'A blue arrow u, 4 across and 1 up, and an orange arrow v, 1 across and 3 up. A dashed copy of v starts at the tip of u. A green arrow from the origin can be dragged.',
      },
      check: (s) => {
        const { x, y } = s.w;
        if (x === s.sum.x && y === s.sum.y) return true;
        if (x === s.u.x && y === s.u.y) return 'That is the blue move on its own. Carry on along the dashed orange arrow.';
        if (x === s.v.x && y === s.v.y) return 'That is the orange move on its own. Its dashed copy starts at the tip of the blue arrow: follow that one.';
        return 'The green arrow should end exactly where the dashed arrow ends.';
      },
      solution: { w: { x: 5, y: 4 } },
      explain: r`
        $$ ${U} + ${V} = ${vec(4, 1)} + ${vec(1, 3)} = ${vec(5, 4)} $$

        Four across and then one more across makes 5. One up and then three more up makes 4.
        To add two vectors, **add the top numbers and add the bottom numbers**.
      `,
    },
    {
      id: 'order',
      type: 'interact',
      graded: false,
      title: 'Does the order matter?',
      text: r`
        Now both routes are drawn: ${Uw} then ${Vw}, and ${Vw} then ${Uw}.

        **Drag the blue and orange tips until the green sum lands on the star.** On the way,
        watch whether the two routes ever end in different places.
      `,
      widget: {
        type: 'vector-plane', x: [-3, 7], y: [-2, 8],
        vectors: [
          { id: 'u', x: 3, y: 1, color: 'blue', drag: true },
          { id: 'v', x: 1, y: 2, color: 'orange', drag: true },
        ],
        sum: { of: ['u', 'v'], routes: 'both' },
        target: { x: 2, y: 5 },
        alt: 'Two arrows u and v that can be dragged, the parallelogram they make, and a green arrow for their sum. A star marks the point 2 across, 5 up.',
      },
      check: (s) => {
        const zero = (p) => p.x === 0 && p.y === 0;
        if (s.hit && (zero(s.u) || zero(s.v))) return 'One arrow has shrunk to nothing. Use two real moves.';
        if (s.hit) return true;
        return `The sum ends at (${num(s.sum.x)}, ${num(s.sum.y)}). The star is at (2, 5).`;
      },
      solution: { u: { x: 3, y: 1 }, v: { x: -1, y: 4 } },
      explain: r`
        The two routes are opposite sides of a parallelogram, so they always meet at the same corner.
        In numbers it is no surprise either: $3 + 1 = 1 + 3$.

        $$ ${U} + ${V} = ${V} + ${U} $$

        That is why the two drones had to end in the same place.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Adding vectors',
      text: r`
        Vectors get bold letters: $\mathbf{u}$, $\mathbf{v}$. One move and then another is their **sum**.

        :::key
        Add vectors tip to tail. In numbers, add row by row:
        $$ \begin{pmatrix} a \\ b \end{pmatrix} + \begin{pmatrix} c \\ d \end{pmatrix} = \begin{pmatrix} a + c \\ b + d \end{pmatrix} $$
        :::

        :::example
        $$ ${U} + ${V} = ${vec(7, -2)} + ${vec(-3, 8)} = ${vec(4, 6)} $$

        Top row: $7 + (-3) = 4$. Bottom row: $-2 + 8 = 6$.
        :::
      `,
      figure: {
        type: 'vector-plane', x: [-4, 8], y: [-3, 9], static: true, line: false,
        vectors: [{ id: 'u', x: 7, y: -2, color: 'blue' }, { id: 'v', x: -3, y: 8, color: 'orange' }],
        sum: { of: ['u', 'v'], routes: 'one' },
        alt: 'A blue arrow u, 7 across and 2 down, and an orange arrow v, 3 to the left and 8 up. A dashed copy of v starts at the tip of u and ends at the point 4 across, 6 up. A green arrow from the origin to that point is the sum.',
      },
    },
    {
      id: 'add-vectors',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = rng.nonzero(-6, 6);
        const b = rng.nonzero(-6, 6);
        const c = rng.nonzero(-6, 6);
        const d = rng.nonzero(-6, 6);
        return {
          text: r`**Add the two vectors.** $$ ${vec(a, b)} + ${vec(c, d)} $$`,
          template: vecBlanks(a + c, b + d),
          hints: ['Add the two top numbers to get the top number. Then do the same with the bottom numbers.'],
          explain: r`Top: $${num(a)} + ${par(c)} = ${num(a + c)}$. Bottom: $${num(b)} + ${par(d)} = ${num(b + d)}$. So the sum is $${vec(a + c, b + d)}.$`,
        };
      },
    },
    {
      id: 'scale',
      type: 'interact',
      title: 'Stretching a move',
      text: r`
        Multiplying a vector by a number stretches it. $2\mathbf{v}$ is the move $\mathbf{v}$ done twice,
        and $\tfrac{1}{2}\mathbf{v}$ is half of it.

        Here $\mathbf{v} = ${vec(2, 1)}.$

        **Find the number that puts the green arrow on the star.**
      `,
      widget: {
        type: 'vector-plane', x: [-7, 7], y: [-7, 7],
        vectors: [{ id: 'v', x: 2, y: 1, color: 'blue' }],
        combo: { of: ['v'], a: { min: -3, max: 3, step: 0.5, value: 1, label: r`multiply $\mathbf{v}$ by` } },
        target: { x: -4, y: -2 },
        alt: 'The arrow v, 2 across and 1 up, and a green arrow that is a multiple of v, set with a slider. A star marks the point 4 to the left and 2 down.',
      },
      check: (s) => {
        if (s.a === -2) return true;
        if (s.a === 2) return 'That is the right length, but it points the opposite way from the star. What kind of number would turn the arrow round?';
        if (s.a === 0) return 'Zero times any vector is no move at all. The star is on the far side of the origin.';
        if (s.a > 0) return 'A positive number keeps the arrow pointing the same way as **v**. The star is on the other side of the origin.';
        return s.a > -2 ? 'Right direction. The arrow is still too short.' : 'Right direction. The arrow is now too long.';
      },
      solution: { a: -2 },
      explain: r`
        $$ -2\,\mathbf{v} = -2 \times ${vec(2, 1)} = ${vec(-4, -2)} $$

        Multiply both numbers by $-2$. A **negative** number turns the arrow round to point the opposite way.
      `,
    },
    {
      id: 'teach-scalar',
      type: 'info',
      title: 'Scalars',
      text: r`
        The number that multiplies a vector is called a **scalar**, because it scales the arrow.

        :::key
        Multiply **both** numbers by the scalar: $\;k\begin{pmatrix} a \\ b \end{pmatrix} = \begin{pmatrix} ka \\ kb \end{pmatrix}$
        :::

        :::example
        $$ -5\,${vec(2, -1)} = ${vec(-10, 5)} $$

        Top: $-5 \times 2 = -10$. Bottom: $-5 \times (-1) = 5$. The scalar is negative, so the
        arrow turns round, and it is 5 times as long.
        :::

        $-\mathbf{v}$ is short for $-1 \times \mathbf{v}$: the same arrow, turned round.
      `,
      figure: {
        type: 'vector-plane', x: [-11, 4], y: [-5, 10], static: true, line: false,
        vectors: [{ id: 'v', x: 2, y: -1, color: 'blue' }],
        combo: { of: ['v'], a: { min: -5, max: 5, step: 1, value: -5 } },
        alt: 'A short blue arrow v, 2 across and 1 down, and a green arrow five times as long that points the opposite way: 10 to the left and 5 up.',
      },
    },
    {
      id: 'scale-vector',
      type: 'fill',
      gen: (rng) => {
        const k = rng.pick([-4, -3, -2, 2, 3, 4, 5]);
        const x = rng.nonzero(-5, 5);
        const y = rng.intExcept(-5, 5, [0, x]);
        return {
          text: r`**Work out** $\;${k}\,${vec(x, y)}.$`,
          template: vecBlanks(k * x, k * y),
          hints: [`Multiply the top number by ${num(k)}, then the bottom number by ${num(k)}.`],
          explain: r`Top: $${k} \times ${par(x)} = ${num(k * x)}$. Bottom: $${k} \times ${par(y)} = ${num(k * y)}$. ${k < 0 ? 'The scalar is negative, so the arrow also turns round.' : `The arrow keeps its direction and becomes ${k} times as long.`}`,
        };
      },
    },
    {
      id: 'reach',
      type: 'interact',
      title: 'Two moves, any destination',
      text: r`
        You are allowed only two moves:
        $$ ${U} = ${vec(2, 1)} \qquad ${V} = ${vec(-1, 1)} $$
        But you may use each one as often as you like, forwards or backwards.

        **Set $a$ and $b$ so that $\;a\,${U} + b\,${V}\;$ lands on the star.**
      `,
      widget: {
        type: 'vector-plane', x: [-3, 7], y: [-2, 8],
        vectors: [{ id: 'u', x: 2, y: 1, color: 'blue' }, { id: 'v', x: -1, y: 1, color: 'orange' }],
        combo: { of: ['u', 'v'], a: { min: -3, max: 3, step: 1, value: 1 }, b: { min: -3, max: 3, step: 1, value: 1 } },
        target: { x: 4, y: 5 },
        alt: 'Two fixed arrows: u, 2 across and 1 up, and v, 1 to the left and 1 up. Two sliders choose how many of each to chain together. A star marks the point 4 across, 5 up.',
      },
      check: (s) => {
        if (s.hit) return true;
        if (s.a === 3) return 'Three lots of **u** is right. Now change only $b$.';
        if (s.b === 2) return 'Two lots of **v** is right. Now change only $a$.';
        return `You are at (${num(s.point.x)}, ${num(s.point.y)}). The star is at (4, 5). Change one slider at a time and watch which way the end point moves.`;
      },
      solution: { a: 3, b: 2 },
      hints: [r`Each step of $a$ moves the end point 2 across and 1 up. Each step of $b$ moves it 1 to the left and 1 up.`],
      explain: r`
        $$ \begin{aligned} 3\,${U} + 2\,${V} &= ${vec(6, 3)} + ${vec(-2, 2)} \\[4pt] &= ${vec(4, 5)} \end{aligned} $$

        Three lots of ${Uw}, then two lots of ${Vw}. With these two arrows every point of the plane
        can be reached, and in only one way.
      `,
    },
    {
      id: 'same-line',
      type: 'choice',
      title: 'When two moves are not enough',
      text: r`
        Two new moves:
        $$ ${U} = ${vec(2, 1)} \qquad ${V} = ${vec(4, 2)} $$
        Try the sliders, and try to reach the star.

        **Which points can $\;a\,${U} + b\,${V}\;$ reach?**
      `,
      figure: {
        type: 'vector-plane', x: [-8, 8], y: [-8, 8],
        vectors: [{ id: 'u', x: 2, y: 1, color: 'blue' }, { id: 'v', x: 4, y: 2, color: 'orange' }],
        combo: { of: ['u', 'v'], a: { min: -2, max: 2, step: 0.5, value: 1 }, b: { min: -1.5, max: 1.5, step: 0.5, value: 0.5 } },
        target: { x: 2, y: 4 },
        alt: 'Two arrows along the same line: u, 2 across and 1 up, and v, 4 across and 2 up. Two sliders choose how many of each to chain together. A star sits off that line.',
      },
      options: [
        { text: 'Only the points on one line through the origin', correct: true },
        { text: 'Every point of the plane', why: 'Try for the star: whatever the sliders say, the end point stays on the line through the blue arrow.' },
        { text: 'Only points with whole-number coordinates', why: r`Half steps land between the grid points: $a = \tfrac{1}{2},\ b = 0$ ends at $(1, \tfrac{1}{2})$. What restricts the end point is the direction.` },
        { text: 'Only the points between the two arrow tips', why: 'Larger numbers go past the tips, and negative ones go back through the origin to the other side.' },
      ],
      explain: r`
        Here ${Vw} is just $2\,${U}$, so it offers no new direction. Every combination is a multiple of ${Uw} again:
        $$ a\,${U} + b\,${V} = (a + 2b)\,${U} $$

        Two arrows along **different** lines reach the whole plane. Two arrows along the **same** line reach only that line.
      `,
    },
    {
      id: 'teach-combination',
      type: 'info',
      title: 'Combinations',
      text: r`
        An expression like $a\,\mathbf{u} + b\,\mathbf{v}$ is called a **combination** of $\mathbf{u}$
        and $\mathbf{v}$: some of one move, then some of the other.

        To work one out in numbers, **scale each vector first**. Then add or subtract row by row.

        :::example
        $$ \begin{aligned} & 2\,\blue{${vec(4, -1)}} - 3\,\orange{${vec(1, 2)}} \\[4pt] &= ${vec(8, -2)} - ${vec(3, 6)} = ${vec(5, -8)} \end{aligned} $$

        - Top row: $8 - 3 = 5$
        - Bottom row: $-2 - 6 = -8$
        :::

        In the picture: two blue steps forwards, then three orange steps **backwards**.
      `,
      figure: {
        type: 'vector-plane', x: [-2, 10], y: [-9, 3], static: true, line: false,
        vectors: [{ id: 'u', x: 4, y: -1, color: 'blue' }, { id: 'v', x: 1, y: 2, color: 'orange' }],
        combo: { of: ['u', 'v'], a: { min: -3, max: 3, step: 1, value: 2 }, b: { min: -3, max: 3, step: 1, value: -3 } },
        alt: 'A blue arrow u, 4 across and 1 down, and an orange arrow v, 1 across and 2 up. A chain of two blue arrows followed by three orange arrows pointing backwards ends at the point 5 across, 8 down, where a green arrow from the origin also ends.',
      },
    },
    {
      id: 'combine',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 4);
        const b = rng.pick([-3, -2, 2, 3]);
        const u = { x: rng.nonzero(-3, 3), y: rng.nonzero(-3, 3) };
        const v = { x: rng.nonzero(-3, 3), y: rng.nonzero(-3, 3) };
        const top = a * u.x + b * v.x;
        const bottom = a * u.y + b * v.y;
        const sign = b < 0 ? '-' : '+';
        return {
          text: r`**Work out this combination.** $$ ${a}\,${vec(u.x, u.y)} ${sign} ${Math.abs(b)}\,${vec(v.x, v.y)} $$`,
          template: vecBlanks(top, bottom),
          hints: [
            'Scale each vector first. Then combine the results row by row.',
            r`$${a}\,${vec(u.x, u.y)} = ${vec(a * u.x, a * u.y)}$ and $${Math.abs(b)}\,${vec(v.x, v.y)} = ${vec(Math.abs(b) * v.x, Math.abs(b) * v.y)}$.`,
          ],
          explain: r`
            Scale first: $${vec(a * u.x, a * u.y)} ${sign} ${vec(Math.abs(b) * v.x, Math.abs(b) * v.y)}$.
            Then row by row: top $${num(a * u.x)} ${sign} ${par(Math.abs(b) * v.x)} = ${num(top)}$, bottom $${num(a * u.y)} ${sign} ${par(Math.abs(b) * v.y)} = ${num(bottom)}$.
          `,
        };
      },
    },
    {
      id: 'teach-length',
      type: 'info',
      title: 'The length of an arrow',
      text: r`
        An arrow and its two dotted legs make a right-angled triangle, and the arrow is the
        long side. So Pythagoras, from Geometry, gives its length. The length of
        $\mathbf{v}$ is written $|\mathbf{v}|$.

        :::key
        For $\mathbf{v} = \begin{pmatrix} x \\ y \end{pmatrix}$: $\quad |\mathbf{v}| = \sqrt{x^2 + y^2}$
        :::

        :::example
        The arrow in the picture goes 12 to the left and 16 up.

        1. Square both numbers: $(-12)^2 = 144$ and $16^2 = 256$.
        2. Add: $144 + 256 = 400$.
        3. Take the square root: $\sqrt{400} = 20$.

        The minus sign makes no difference, because squaring removes it.
        :::
      `,
      figure: {
        type: 'vector-plane', x: [-17, 2], y: [-2, 17], static: true, line: false, ticks: false,
        vectors: [{ id: 'v', x: -12, y: 16, legs: true }],
        alt: 'An arrow from the origin that goes 12 to the left and 16 up, drawn with dotted legs that make a right-angled triangle.',
      },
    },
    {
      id: 'length',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [p, q, hyp] = rng.pick(TRIPLES);
        const [ax, ay] = rng.bool() ? [p, q] : [q, p];
        const x = ax * rng.sign();
        const y = ay * rng.sign();
        // a square window around the quarter of the plane that the arrow is in
        const size = Math.max(ax, ay) + 1;
        const window = (v) => (v < 0 ? [-size, 2] : [-2, size]);
        return {
          title: 'How long is an arrow?',
          text: r`
            The arrow $\mathbf{v} = ${vec(x, y)}$ is the long side of a right-angled triangle. Its two short
            sides are the move across and the move up or down.

            **How long is the arrow?**
          `,
          figure: {
            type: 'vector-plane', x: window(x), y: window(y), static: true, line: false, ticks: false,
            vectors: [{ id: 'v', x, y, legs: true }],
            alt: `An arrow from the origin that goes ${num(x)} across and ${num(y)} up, drawn with dotted legs that make a right-angled triangle.`,
          },
          answer: hyp,
          wrong: [
            [ax + ay, 'That is the distance along the two dotted legs. The arrow is the direct route, so use Pythagoras.'],
            [ax * ax + ay * ay, 'That is the **square** of the length. Take the square root.'],
          ],
          hints: [
            r`Pythagoras: $\text{length}^2 = ${par(x)}^2 + ${par(y)}^2$.`,
            r`$${par(x)}^2 + ${par(y)}^2 = ${ax * ax} + ${ay * ay} = ${hyp * hyp}$. Which number squared gives ${hyp * hyp}?`,
          ],
          explain: r`
            By Pythagoras, $\sqrt{${par(x)}^2 + ${par(y)}^2} = \sqrt{${ax * ax} + ${ay * ay}} = \sqrt{${hyp * hyp}} = ${hyp}$.
            A minus sign makes no difference, because squaring removes it.

            The length of $\mathbf{v}$ is written $|\mathbf{v}|$, and for any vector $|\mathbf{v}| = \sqrt{x^2 + y^2}$.
          `,
        };
      },
    },
    {
      id: 'example-find-combo',
      type: 'info',
      title: 'Which combination gets there?',
      text: r`
        Sometimes the destination is known and the numbers $a$ and $b$ are not. Then each row
        of the vectors gives an ordinary equation.

        :::example
        $$ a\,${vec(1, 1)} + b\,${vec(1, -1)} = ${vec(9, 5)} $$

        1. Top row: $a + b = 9$.
        2. Bottom row: $a - b = 5$.
        3. Add the two equations, and $b$ drops out: $2a = 14$, so $a = 7$.
        4. Back to the top row: $7 + b = 9$, so $b = 2.$
        :::

        Two equations with two unknowns are a **system**, like the crossing lines in Algebra.
      `,
    },
    {
      id: 'find-combo',
      type: 'fill',
      stretch: true,
      gen: (rng) => {
        const a = rng.int(1, 6);
        const b = rng.intExcept(-4, 5, [0, a]);
        const p = a + b;
        const q = a - b;
        return {
          title: 'Working backwards',
          text: r`
            This time the destination is known and the numbers are not.

            **Find $a$ and $b$.**
            $$ a\,${vec(1, 1)} + b\,${vec(1, -1)} = ${vec(p, q)} $$
          `,
          template: r`$a =$ [[${a}]] and $b =$ [[${b}]]`,
          hints: [
            r`Read it row by row. Top row: $a + b = ${num(p)}$. Bottom row: $a - b = ${num(q)}$.`,
            r`Add the two equations and $b$ drops out: $2a = ${num(p + q)}$.`,
          ],
          explain: r`
            Row by row this is two equations: $a + b = ${num(p)}$ and $a - b = ${num(q)}$.
            Adding them gives $2a = ${num(p + q)}$, so $a = ${a}$, and then $b = ${num(p)} - ${a} = ${num(b)}$.

            Finding a combination means solving a system of two equations. That link comes back
            later in this course.
          `,
        };
      },
    },
    {
      id: 'match-ops',
      type: 'match',
      text: r`
        Take $\mathbf{u} = ${vec(2, 1)}$ and $\mathbf{v} = ${vec(1, -3)}$.

        **Match each expression with its result.**
      `,
      pairs: [
        [r`$\mathbf{u} + \mathbf{v}$`, r`$${vec(3, -2)}$`],
        [r`$2\,\mathbf{u}$`, r`$${vec(4, 2)}$`],
        [r`$-\mathbf{v}$`, r`$${vec(-1, 3)}$`],
        [r`$\mathbf{u} + 2\,\mathbf{v}$`, r`$${vec(4, -5)}$`],
      ],
      explain: r`
        Row by row every time: $\mathbf{u} + \mathbf{v}$ adds the rows, $2\mathbf{u}$ doubles each number,
        $-\mathbf{v}$ flips both signs, and $\mathbf{u} + 2\mathbf{v} = ${vec(2, 1)} + ${vec(2, -6)}$.

        Here everything happens on a flat page, so two numbers are enough. The same rules work
        for three numbers (a move in space) or for a thousand (a long list of data). Only the
        pictures get harder.
      `,
    },
  ],
  recap: [
    'A vector is a move. Draw it as an arrow; write it as a column, with the move across on top.',
    'Add vectors tip to tail. In numbers, add row by row, and the order does not matter.',
    'A scalar stretches a vector: multiply both numbers by it. A negative scalar also turns the arrow round.',
    r`Two arrows along different lines reach every point as a combination $a\,\mathbf{u} + b\,\mathbf{v}$. The length of an arrow is $\sqrt{x^2 + y^2}$.`,
  ],
  next: 'Next: one number that tells you how much two arrows agree.',
};
