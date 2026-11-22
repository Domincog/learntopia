// Linear Algebra: Vectors & Matrices · Lesson 3 · Machines That Move Space
import { r, num } from '../../../kit.js';
import { vec, mat, cmat, par, lin, cols, apply, det, sameMatrix, matrixBlanks, TURN, SHEAR } from '../helpers.js';

/** The machine of the opening question. It is the worked example of "A matrix", so "read-matrix" never asks for it. */
const CLUES = [[2, -1], [1, 1]];

// The two basis arrows in their colours: E1t and E2t inside a formula, E1 and E2 in a sentence.
const E1t = r`\blue{\begin{pmatrix} 1 \\ 0 \end{pmatrix}}`;
const E2t = r`\orange{\begin{pmatrix} 0 \\ 1 \end{pmatrix}}`;
const E1 = `$${E1t}$`;
const E2 = `$${E2t}$`;

/** The steerable machine: two arrows to drag, a grid and a letter F that follow. */
const machine = (extra = {}) => ({
  type: 'matrix-grid', range: 4,
  alt: 'A grid with a letter F on it, a blue arrow that starts at 1 across and an orange arrow that starts at 1 up. Dragging the arrow tips moves the whole grid and the F with it.',
  ...extra,
});

/** A small read-only picture of what a matrix does to the F, for answer options. */
const picture = (matrix, alt) => ({ type: 'matrix-grid', range: 3, matrix, static: true, showMatrix: false, alt });

const is = (s, m) => s.a === m[0][0] && s.b === m[0][1] && s.c === m[1][0] && s.d === m[1][1];

export default {
  id: 'matrices-transform',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two clues',
      text: r`
        A machine moves every point of the plane. It leaves the origin where it is and keeps grid
        lines straight, parallel and evenly spaced. You are given just two clues about it:

        $$ ${E1t} \;\text{lands on}\; \blue{${vec(2, 1)}} $$
        $$ ${E2t} \;\text{lands on}\; \orange{${vec(-1, 1)}} $$

        **Is that enough to know where the machine sends** $\;${vec(2, 3)}\,$**?**
      `,
      shuffle: false,
      options: [
        { text: 'Yes: there is only one place it can go', correct: true },
        { text: 'No: you would need a third clue' },
        { text: 'No: every point needs a clue of its own' },
      ],
      explain: r`
        Yes. The arrow $${vec(2, 3)}$ is 2 lots of ${E1} plus 3 lots of ${E2}. If the grid stays even,
        it has to land on 2 lots of the new blue arrow plus 3 lots of the new orange one:

        $$ 2\,\blue{${vec(2, 1)}} + 3\,\orange{${vec(-1, 1)}} = ${vec(1, 5)} $$

        Two arrows decide everything. Time to steer such a machine yourself.
      `,
    },
    {
      id: 'teach-machine',
      type: 'info',
      title: 'The machine, drawn',
      text: r`
        Here is the machine from the two clues. The blue arrow is marked 1st, the orange one 2nd.

        $$ ${E1t} \;\text{has landed on}\; \blue{${vec(2, 1)}} $$
        $$ ${E2t} \;\text{has landed on}\; \orange{${vec(-1, 1)}} $$

        The grid has moved with the two arrows, and a letter F rides along on it. The thin
        outline shows where the F started.

        Every point keeps its place **on the grid**. A point that was 2 blue steps and 3 orange
        steps from the origin still is. Only the steps have changed.
      `,
      figure: {
        type: 'matrix-grid', range: 4, matrix: [[2, -1], [1, 1]], static: true, showMatrix: false,
        alt: 'A grid that has been moved by a machine, with a letter F on it. The blue arrow ends at 2 across, 1 up. The orange arrow ends at 1 to the left, 1 up. The F is turned and enlarged, and a thin outline shows where it started.',
      },
    },
    {
      id: 'explore',
      type: 'interact',
      title: 'A machine you can steer',
      text: r`
        Now the machine is back at the start: the blue arrow is ${E1} and the orange arrow is
        ${E2}. Drag their tips. The whole grid follows, and the F with it.

        **Make the F exactly twice as big, still the right way up.**
      `,
      widget: machine(),
      check: (s) => {
        if (is(s, [[2, 0], [0, 2]])) return true;
        if (s.flat) return 'The F has been squashed flat. Pull the two arrows apart again.';
        if (s.b !== 0 || s.c !== 0) return 'The F is leaning or turned. Keep the blue arrow along the horizontal axis and the orange one along the vertical axis.';
        if (s.a < 0 && s.d < 0) return 'Both arrows point backwards, so the F is upside down. Point the blue arrow to the right and the orange arrow up.';
        if (s.flipped) return 'The F is a mirror image now. Point the blue arrow to the right and the orange arrow up.';
        if (s.a === 2) return 'The F is twice as wide, but not twice as tall. Make the orange arrow 2 long as well.';
        if (s.d === 2) return 'The F is twice as tall, but not twice as wide. Make the blue arrow 2 long as well.';
        return `Widths are now multiplied by ${num(s.a)} and heights by ${num(s.d)}. Both should be multiplied by 2.`;
      },
      solution: { a: 2, b: 0, c: 0, d: 2 },
      explain: r`
        The blue arrow now ends at $${vec(2, 0)}$ and the orange one at $${vec(0, 2)}$. Every square
        of the grid has doubled in both directions, and the F with it.
      `,
    },
    {
      id: 'mirror',
      type: 'interact',
      title: 'Through the looking glass',
      text: `
        The machine is back at the start.

        **Turn the F into its mirror image: flipped left to right, the same size.**
      `,
      widget: machine({ readouts: ['facing'] }),
      check: (s) => {
        if (is(s, [[-1, 0], [0, 1]])) return true;
        if (s.flat) return 'The F has been squashed flat. Pull the two arrows apart again.';
        if (is(s, [[1, 0], [0, -1]])) return 'That flips the F top to bottom. Flip it left to right instead: which arrow has to change for that?';
        if (is(s, [[-1, 0], [0, -1]])) return 'Both arrows point backwards now. That is a half turn: the F is upside down, but you could still read it by turning the page. Flip only one arrow.';
        if (is(s, [[0, 1], [1, 0]])) return 'That F is a mirror image, but it has also been tipped onto its side. Keep the orange arrow pointing straight up.';
        if (!s.flipped) return 'This F is not a mirror image: turn the page and you could read it normally. One arrow has to cross to the other side.';
        return 'That is a mirror image, but not a plain left-to-right flip of the same size. Leave the orange arrow where it started and move only the blue one.';
      },
      solution: { a: -1, b: 0, c: 0, d: 1 },
      explain: r`
        Only the blue arrow changed: from ${E1} to $\blue{${vec(-1, 0)}}$. Everything that was on the
        right is now on the left, and the orange arrow did not have to move at all.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'A matrix',
      text: r`
        Where the two arrows land describes the machine completely. Write the two landing places
        side by side, as columns:

        $$ ${cmat([[2, -1], [1, 1]])} $$

        This grid of numbers is a **matrix**. Its [first column]{.blue} says where ${E1} lands, and
        its [second column]{.orange} says where ${E2} lands.

        :::key
        A matrix is a rule that moves every point of the plane: a **transformation**. The
        origin stays put and grid lines stay straight, parallel and evenly spaced. Read a
        matrix **column by column**.
        :::

        ${E1} and ${E2} are called the **basis arrows**.
      `,
      figure: {
        type: 'matrix-grid', range: 4, matrix: [[2, -1], [1, 1]], static: true,
        alt: 'The grid after the matrix with columns 2, 1 and minus 1, 1 has acted. The blue arrow ends at 2 across, 1 up. The orange arrow ends at 1 to the left, 1 up. The F is turned and enlarged.',
      },
    },
    {
      id: 'read-matrix',
      type: 'fill',
      review: true,
      gen: (rng) => {
        let m;
        do {
          m = [[rng.int(-2, 3), rng.int(-3, 3)], [rng.int(-3, 3), rng.int(-2, 3)]];
        } while (det(m) === 0 || sameMatrix(m, CLUES) || (m[0][0] === 1 && m[1][0] === 0) || (m[0][1] === 0 && m[1][1] === 1)
          || (m[0][0] === m[0][1] && m[1][0] === m[1][1]) || Math.abs(m[0][0]) + Math.abs(m[1][0]) < 2 || Math.abs(m[0][1]) + Math.abs(m[1][1]) < 2);
        const name = rng.pick(['A', 'B', 'M', 'P', 'T']);
        return {
          text: r`
            The [blue arrow]{.blue} (1st) shows where a matrix $${name}$ sends ${E1}. The
            [orange arrow]{.orange} (2nd) shows where it sends ${E2}.

            **Write down the matrix $${name}$.**
          `,
          figure: {
            type: 'matrix-grid', range: 4, matrix: m, static: true, shape: 'none', showMatrix: false,
            alt: `A grid moved by a matrix. The blue arrow ends at ${num(m[0][0])} across and ${num(m[1][0])} up. The orange arrow ends at ${num(m[0][1])} across and ${num(m[1][1])} up.`,
          },
          template: matrixBlanks(m, `$${name}$`),
          hints: [
            'The first column is where the blue arrow ends: its move across goes in the top row, its move up in the bottom row.',
            `The blue arrow ends at (${num(m[0][0])}, ${num(m[1][0])}). Write those two numbers down the first column, then do the same with the orange arrow.`,
          ],
          explain: r`The blue arrow ends at $\blue{${vec(m[0][0], m[1][0])}}$ and the orange one at $\orange{${vec(m[0][1], m[1][1])}}$. Side by side as columns: $${cmat(m)}.$`,
        };
      },
    },
    {
      id: 'turn',
      type: 'interact',
      title: 'A quarter turn',
      text: `
        **Give the F a quarter turn anticlockwise** (to the left), without changing its size.
      `,
      widget: machine(),
      check: (s) => {
        if (is(s, TURN)) return true;
        if (is(s, [[1, 0], [0, 1]])) return 'Nothing has moved yet. Start with the blue arrow: after a quarter turn to the left it points straight up.';
        if (s.flat) return 'The F has been squashed flat. Pull the two arrows apart again.';
        if (is(s, [[0, 1], [-1, 0]])) return 'That is a quarter turn **clockwise**. Go the other way round.';
        if (is(s, [[-1, 0], [0, -1]])) return 'That is a half turn. Stop halfway.';
        if (s.flipped) return 'This F is a mirror image. In a turn both arrows swing the same way round, and the orange arrow stays a quarter turn ahead of the blue one.';
        if (s.a === 0 && s.c === 1) return 'The blue arrow is right: it points straight up. The orange arrow was pointing up, so after the same quarter turn it points to the left.';
        return 'After a quarter turn to the left, the blue arrow points straight up. Put its tip at (0, 1) first.';
      },
      solution: { a: 0, b: -1, c: 1, d: 0 },
      explain: r`
        The blue arrow swings from ${E1} up to $\blue{${vec(0, 1)}}$, and the orange one from ${E2} round to
        $\orange{${vec(-1, 0)}}$. The matrix of a quarter turn anticlockwise is

        $$ ${cmat(TURN)} $$

        Both arrows keep their length and stay at right angles, so nothing is stretched.
      `,
    },
    {
      id: 'shear',
      type: 'choice',
      title: 'A new kind of move',
      text: r`
        This matrix leaves the blue arrow alone and tips the orange one over:

        $$ ${cmat(SHEAR)} $$

        **Which picture shows what it does to the F?**
      `,
      options: [
        { figure: picture(SHEAR, 'The F leans to the right. The blue arrow is 1 across; the orange arrow ends 1 across and 1 up.'), correct: true },
        { figure: picture([[1, 0], [1, 1]], 'The F is sheared upwards. The blue arrow ends 1 across and 1 up; the orange arrow is 1 up.'), why: 'Here the blue arrow has moved to (1, 1) and the orange one has stayed. The first column of the matrix says the blue arrow stays at (1, 0).' },
        { figure: picture([[2, 0], [0, 1]], 'The F is stretched sideways. The blue arrow is 2 across; the orange arrow is 1 up.'), why: 'This F is stretched sideways: the blue arrow ends at (2, 0). In the matrix the blue arrow does not move.' },
        { figure: picture([[1, -1], [0, 1]], 'The F leans to the left. The blue arrow is 1 across; the orange arrow ends 1 to the left and 1 up.'), why: 'This F leans the other way: the orange arrow ends at (−1, 1). The second column of the matrix is (1, 1).' },
      ],
      explain: r`
        The orange arrow tips over from ${E2} to $\orange{${vec(1, 1)}}$ while the blue arrow stays. Every
        row of the grid slides sideways, and higher rows slide further, like the top of a pack of
        cards being pushed. This move is called a **shear**.
      `,
    },
    {
      id: 'mat-vec',
      type: 'interact',
      title: 'Where does a point go?',
      text: r`
        The matrix $${cmat([[1, -1], [1, 1]])}$ sends the basis arrows to $\blue{${vec(1, 1)}}$ and
        $\orange{${vec(-1, 1)}}.$

        Before the move, the point $(3, 2)$ was reached by **3** blue steps and **2** orange steps.
        It still is.

        **Take 3 of the new blue arrow and 2 of the new orange arrow to see where it lands.**
      `,
      widget: {
        type: 'vector-plane', x: [-4, 6], y: [-2, 8],
        vectors: [{ id: 'p', x: 1, y: 1, color: 'blue', label: false }, { id: 'q', x: -1, y: 1, color: 'orange', label: false }],
        combo: {
          of: ['p', 'q'],
          a: { min: 0, max: 4, step: 1, value: 1, label: 'lots of the blue column' },
          b: { min: 0, max: 4, step: 1, value: 1, label: 'lots of the orange column' },
        },
        alt: 'A blue arrow, 1 across and 1 up, and an orange arrow, 1 to the left and 1 up. Two sliders choose how many of each to chain together.',
      },
      check: (s) => (s.a === 3 && s.b === 2) || `That is ${num(s.a)} of the blue arrow and ${num(s.b)} of the orange one. The point (3, 2) needs 3 and 2.`,
      solution: { a: 3, b: 2 },
      explain: r`
        $$ \begin{aligned} & ${mat([[1, -1], [1, 1]])}${vec(3, 2)} \\[4pt] &= 3\,\blue{${vec(1, 1)}} + 2\,\orange{${vec(-1, 1)}} = ${vec(1, 5)} \end{aligned} $$

        That is what **a matrix times a vector** means. The top number of the vector counts
        first columns, and the bottom number counts second columns.
      `,
    },
    {
      id: 'rule',
      type: 'info',
      title: 'Matrix times vector',
      text: r`
        Each number in a matrix is an **entry**. With two rows (across) and two columns (down)
        it is called a $\mathord{2 \times 2}$ matrix. The matrix is written on the left, and
        the vector it acts on to its right.

        :::key
        $$ \begin{aligned} \begin{pmatrix} \blue{a} & \orange{b} \\ \blue{c} & \orange{d} \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} &= x\,\blue{\begin{pmatrix} a \\ c \end{pmatrix}} + y\,\orange{\begin{pmatrix} b \\ d \end{pmatrix}} \\[4pt] &= \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix} \end{aligned} $$
        :::

        Look at the top entry, $ax + by$. It is the **dot product** of the top row of the matrix
        with the vector. The bottom entry is the dot product with the bottom row. Both ways of
        reading the product give the same two numbers.
      `,
    },
    {
      id: 'example-apply',
      type: 'info',
      title: 'Both readings, one example',
      text: r`
        :::example
        $$ \begin{aligned} & ${cmat([[2, 1], [1, -2]])}${vec(5, -2)} \\[4pt] &= 5\,\blue{${vec(2, 1)}} - 2\,\orange{${vec(1, -2)}} \\[4pt] &= ${vec(10, 5)} + ${vec(-2, 4)} = ${vec(8, 9)} \end{aligned} $$
        :::

        **By columns:** 5 lots of the first column and $-2$ lots of the second. In the picture
        that is five blue steps, then two orange steps backwards.

        **By rows** the same two numbers come out:

        - top: $2 \times 5 + 1 \times (-2) = 8$
        - bottom: $1 \times 5 + (-2) \times (-2) = 9$
      `,
      figure: {
        type: 'vector-plane', x: [-2, 12], y: [-3, 11], static: true, line: false,
        vectors: [{ id: 'p', x: 2, y: 1, color: 'blue', label: false }, { id: 'q', x: 1, y: -2, color: 'orange', label: false }],
        combo: { of: ['p', 'q'], a: { min: 0, max: 5, step: 1, value: 5 }, b: { min: -3, max: 3, step: 1, value: -2 } },
        alt: 'A blue arrow, 2 across and 1 up, and an orange arrow, 1 across and 2 down. A chain of five blue arrows followed by two orange arrows pointing backwards ends at the point 8 across, 9 up, where a green arrow from the origin also ends.',
      },
    },
    {
      id: 'apply-matrix',
      type: 'fill',
      review: true,
      gen: (rng) => {
        let m;
        do {
          m = [[rng.int(-3, 3), rng.int(-3, 3)], [rng.int(-3, 3), rng.int(-3, 3)]];
        } while (m.flat().filter((v) => v === 0).length > 1 || det(m) === 0);
        const v = { x: rng.int(2, 4), y: rng.pick([-3, -2, 2, 3]) };
        const out = apply(m, v);
        return {
          text: r`**Work out** $$ ${mat(m)}${vec(v.x, v.y)} $$`,
          template: `Top number: [[${num(out.x)}]]\n\nBottom number: [[${num(out.y)}]]`,
          hints: [
            r`Take ${v.x} lots of the first column and $${num(v.y)}$ lots of the second: $\;${lin(v.x, cols(m)[0], v.y, cols(m)[1])}.$`,
            r`That is $${vec(v.x * m[0][0], v.x * m[1][0])} + ${vec(v.y * m[0][1], v.y * m[1][1])}$.`,
          ],
          explain: r`
            $${lin(v.x, cols(m)[0], v.y, cols(m)[1])} = ${vec(v.x * m[0][0], v.x * m[1][0])} + ${vec(v.y * m[0][1], v.y * m[1][1])} = ${vec(out.x, out.y)}.$

            Row by row it is the same: top $${num(m[0][0])} \times ${v.x} + ${par(m[0][1])} \times ${par(v.y)} = ${num(out.x)}$, bottom $${num(m[1][0])} \times ${v.x} + ${par(m[1][1])} \times ${par(v.y)} = ${num(out.y)}$.
          `,
        };
      },
    },
    {
      id: 'catalogue',
      type: 'match',
      title: 'A small catalogue',
      text: `
        **Match each matrix with what it does to the plane.** Read the columns: where does each
        basis arrow go?
      `,
      pairs: [
        [`$${mat([[2, 0], [0, 2]])}$`, 'Makes everything twice as big'],
        [`$${mat([[3, 0], [0, 1]])}$`, 'Stretches sideways only'],
        [`$${mat([[1, 0], [0, -1]])}$`, 'Flips top to bottom'],
        [`$${mat(TURN)}$`, 'Quarter turn anticlockwise'],
        [`$${mat(SHEAR)}$`, 'Shear: the top slides to the right'],
      ],
      explain: r`
        Each one can be read off its columns. For instance $${mat([[1, 0], [0, -1]])}$ leaves ${E1} alone
        and sends ${E2} to $${vec(0, -1)}$: up becomes down.
      `,
    },
    {
      id: 'no-slide',
      type: 'choice',
      review: true,
      text: r`
        A $2 \times 2$ matrix moves every point of the plane.

        **Which of these moves can no $2 \times 2$ matrix make?**
      `,
      options: [
        { text: 'Slide every point 2 to the right', correct: true },
        { text: 'Turn the plane a quarter turn about the origin', why: r`$${mat(TURN)}$ does exactly that.` },
        { text: 'Flip the plane left to right', why: r`$${mat([[-1, 0], [0, 1]])}$ does that: the first basis arrow turns round and the second stays.` },
        { text: 'Squash the whole plane onto a single line', why: r`That is possible. If both columns lie along one line, as in $${mat([[1, 2], [1, 2]])}$, every point lands on that line.` },
      ],
      hints: [r`Where does a matrix send the point $(0, 0)$? It is 0 of the first column plus 0 of the second.`],
      explain: r`
        Whatever its columns are, a matrix sends $${vec(0, 0)}$ to 0 lots of the first column plus 0 lots
        of the second, which is $${vec(0, 0)}$ again. The origin never moves, so no matrix can slide
        the whole plane sideways.
      `,
    },
    {
      id: 'mystery',
      type: 'interact',
      stretch: true,
      title: 'Reverse engineering',
      text: `
        The dashed outline shows where a mystery matrix puts the F.

        **Find the matrix.**
      `,
      widget: machine({ target: [[1, -1], [1, 1]] }),
      check: (s) => {
        if (s.match) return true;
        if (s.flat) return 'The F has been squashed flat. Pull the two arrows apart again.';
        if (s.flipped) return 'Your F is a mirror image of the outline. In the outline the orange arrow is a quarter turn anticlockwise from the blue one.';
        if (s.a === 1 && s.c === 1) return 'The blue arrow is right: the bars of the F run the right way. Now line the stem up, using the orange arrow.';
        if (s.b === -1 && s.d === 1) return 'The orange arrow is right: the stem of the F lies on the outline. The blue arrow sets the direction of the two bars.';
        return 'Start with the stem of the F. It runs along the orange arrow and is twice as long as it.';
      },
      solution: { a: 1, b: -1, c: 1, d: 1 },
      hints: [
        'The stem of the F is 2 lots of the orange arrow. The top of the dashed stem is at (−2, 2), so where must the orange arrow end?',
        'The bars of the F run along the blue arrow. In the outline they point up and to the right.',
      ],
      explain: r`
        $$ ${cmat([[1, -1], [1, 1]])} $$

        The blue arrow goes to $\blue{${vec(1, 1)}}$ and the orange one to $\orange{${vec(-1, 1)}}$: an
        eighth of a turn and an enlargement in one move. Any picture of where the two basis
        arrows land is a matrix, and any matrix is such a picture.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: *"To describe a machine that moves the whole plane, you would have to list
        where every single point goes."*

        **What would you tell them, for the machines in this lesson?**
      `,
      model: r`
        Two arrows are enough. Every point is reached by some number of steps along ${E1} and some
        number along ${E2}. Because the machine keeps the grid straight and evenly spaced, the point
        is reached by the same numbers of steps along the two *moved* arrows.

        So the two columns of the matrix, four numbers in all, fix where every point goes:
        $x$ of the first column plus $y$ of the second.
      `,
    },
  ],
  recap: [
    'A matrix is a rule that moves every point of the plane, keeping the origin fixed and the grid straight and even.',
    r`Its first column is where $\begin{pmatrix} 1 \\ 0 \end{pmatrix}$ lands; its second column is where $\begin{pmatrix} 0 \\ 1 \end{pmatrix}$ lands.`,
    r`Matrix times vector: $x$ lots of the first column plus $y$ lots of the second.`,
    'Scalings, stretches, flips, turns and shears are all matrices. A slide is not: the origin never moves.',
  ],
  next: 'Next: what happens when one machine feeds into another, and why the order matters.',
};
