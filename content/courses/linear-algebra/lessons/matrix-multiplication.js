// Linear Algebra: Vectors & Matrices · Lesson 4 · One Move After Another
import { r } from '../../../kit.js';
import { vec, mat, cmat, lin, cols, mul, sameMatrix, matrixBlanks, TURN, SHEAR, IDENTITY } from '../helpers.js';

// Convention in every step: AB means "first B, then A". The matrix next to the vector acts first.
const SHEAR_THEN_TURN = mul(TURN, SHEAR);   // TS = [[0, -1], [1, 1]]
const TURN_THEN_SHEAR = mul(SHEAR, TURN);   // ST = [[1, -1], [1, 0]]
// The worked example of "A product without a picture". The 3 and the 4 are outside what "multiply" and "which-product" can draw.
const EX_A = [[1, 3], [2, -1]];
const EX_B = [[4, -1], [1, 2]];
const WIDE = [[2, 0], [0, 1]];
const TALL = [[1, 0], [0, 2]];

const MOVES = [
  { id: 'turn', label: 'Turn', matrix: TURN },
  { id: 'shear', label: 'Shear', matrix: SHEAR },
];
const is = (s, m) => s.a === m[0][0] && s.b === m[0][1] && s.c === m[1][0] && s.d === m[1][1];

/** Pairs of moves that give different results in the two orders, for "which product means…". */
const NAMED = {
  turn: 'a quarter turn',
  shear: 'a shear',
  flip: 'a flip',
  stretch: 'a sideways stretch',
};
const ORDER_PAIRS = [['turn', 'shear'], ['turn', 'flip'], ['shear', 'flip'], ['turn', 'stretch'], ['shear', 'stretch']];

export default {
  id: 'matrix-multiplication',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Socks and shoes',
      text: `
        Socks first and then shoes is not the same as shoes first and then socks. Other pairs of
        actions, like putting on a hat and a scarf, do not care about their order.

        Take two moves of the plane: a **quarter turn** anticlockwise, and a **shear** that slides
        the top of everything to the right.

        **Does it matter which of the two you do first?**
      `,
      shuffle: false,
      options: [
        { text: 'No: the result is the same either way' },
        { text: 'Yes: the two orders give different results', correct: true },
      ],
      explain: `
        It matters, and you are about to see how. Doing one move after another is the most
        important thing you can do with matrices, and it comes with one trap: the order.
      `,
    },
    {
      id: 'teach-two-moves',
      type: 'info',
      title: 'Two moves, two matrices',
      text: r`
        Both moves come from the last lesson. Each has its matrix, and the columns of the
        matrix say where the two basis arrows land.

        - **Turn**, a quarter turn anticlockwise: $\;T = ${cmat(TURN)}$
        - **Shear**, which slides the top to the right: $\;S = ${cmat(SHEAR)}$

        Press a button to watch its move. Then press **Start again** and try the other one.
      `,
      figure: {
        type: 'matrix-grid', range: 4, moves: MOVES, maxMoves: 1,
        alt: 'A letter F on a grid with a blue and an orange arrow, and two buttons: Turn, which gives the F a quarter turn anticlockwise, and Shear, which slides its top to the right.',
      },
    },
    {
      id: 'try-both',
      type: 'interact',
      title: 'Try both orders',
      text: `
        The same two buttons. **Turn** gives the F a quarter turn anticlockwise. **Shear** slides
        its top to the right. Each press acts on the F as it is at that moment.

        **Use each button exactly once so that the F lands on the dashed outline.**
      `,
      widget: {
        type: 'matrix-grid', range: 4, moves: MOVES, maxMoves: 4, target: SHEAR_THEN_TURN,
        alt: 'A letter F on a grid, a dashed outline of a turned and sheared F, and two buttons: Turn and Shear.',
      },
      check: (s) => {
        const done = s.applied.join(',');
        if (done === 'shear,turn') return true;
        if (done === '') return 'Press one of the two buttons to begin.';
        if (done === 'turn,shear') return 'This F is not on the outline: you turned first and sheared second. Press "Start again" and try the other order.';
        if (s.applied.length === 1) return 'One move so far. Now press the other button.';
        return 'Use each button exactly once. Press "Start again" and have another go.';
      },
      solution: { applied: ['shear', 'turn'] },
      explain: r`
        **Shear, then turn** lands on the outline. **Turn, then shear** does not: it leaves the F
        lying along the horizontal axis instead.

        For these two moves the order matters, just as it does for socks and shoes.
      `,
    },
    {
      id: 'one-matrix',
      type: 'interact',
      title: 'One machine for the whole job',
      text: `
        "Shear, then turn" took the F to the outline in two steps. A single matrix can do it in one.

        **Drag the two arrows to find that matrix.**
      `,
      widget: {
        type: 'matrix-grid', range: 4, target: SHEAR_THEN_TURN,
        alt: 'A letter F on a grid with a blue and an orange arrow whose tips can be dragged, and a dashed outline of a turned and sheared F.',
      },
      check: (s) => {
        if (s.match) return true;
        if (s.flat) return 'The F has been squashed flat. Pull the two arrows apart again.';
        if (s.flipped) return 'Your F is a mirror image of the outline. Follow each basis arrow through the shear and then the turn.';
        if (s.a === 0 && s.c === 1) return 'The blue arrow is right: the shear left it at (1, 0) and the turn swung it up to (0, 1). Now follow the orange arrow through both moves.';
        if (s.b === -1 && s.d === 1) return 'The orange arrow is right. Now the blue one: the shear leaves it at (1, 0). Where does the quarter turn take it from there?';
        return 'Follow one basis arrow at a time. The shear leaves the blue arrow at (1, 0). Where does the quarter turn take it from there?';
      },
      solution: { a: 0, b: -1, c: 1, d: 1 },
      hints: ['The shear moves the orange arrow from (0, 1) to (1, 1). The quarter turn then swings (1, 1) round to (−1, 1).'],
      explain: r`
        Follow each basis arrow through both moves:

        $$ \blue{${vec(1, 0)}} \xrightarrow{\text{shear}} \blue{${vec(1, 0)}} \xrightarrow{\text{turn}} \blue{${vec(0, 1)}} $$
        $$ \orange{${vec(0, 1)}} \xrightarrow{\text{shear}} \orange{${vec(1, 1)}} \xrightarrow{\text{turn}} \orange{${vec(-1, 1)}} $$

        So the single matrix is $${cmat(SHEAR_THEN_TURN)}.$ Two moves in a row are one move of the same kind.
      `,
    },
    {
      id: 'product',
      type: 'info',
      title: 'The product of two matrices',
      text: r`
        Doing one transformation and then another is again a transformation. Its matrix is called
        the **product** of the two matrices.

        Call the turn $T$ and the shear $S$. The matrix you just found is written

        $$ \begin{aligned} TS &= ${mat(TURN)}${mat(SHEAR)} \\[4pt] &= ${mat(SHEAR_THEN_TURN)} \end{aligned} $$

        :::key
        The columns of a product are where the two basis arrows end up after **both** moves.
        :::

        Look at the order in which $TS$ is written: the shear was done first, and yet $S$ stands
        on the right. That needs a careful look.
      `,
    },
    {
      id: 'teach-right-to-left',
      type: 'info',
      title: 'Read it from right to left',
      text: r`
        A matrix acts on the vector written to its **right**. So in $\;T\,S\,\mathbf{v}\;$ the shear
        $S$ stands next to the vector and reaches it first. Then $T$ acts on the result:
        $$ TS\,\mathbf{v} = T(S\,\mathbf{v}) $$

        :::key
        $AB$ means: **first** $B$, **then** $A$. Read a product from right to left.
        :::

        It is like writing shoes(socks(foot)): the socks stand next to the foot, and go on first.
      `,
    },
    {
      id: 'right-to-left',
      type: 'choice',
      title: 'Which way round?',
      text: r`
        $TS$ means "first the shear $S$, then the turn $T$": the matrix next to the vector
        acts first.

        **Which product means "first the turn $T$, then the shear $S$"?**
      `,
      shuffle: false,
      options: [
        { text: '$TS$', why: r`In $TS$ the shear $S$ stands next to the vector, so the shear acts first.` },
        { text: '$ST$', correct: true },
        { text: 'Either: they are the same matrix', why: 'You saw on the F that the two orders end in different places. So the two products are different matrices.' },
      ],
      explain: r`
        "First turn, then shear" is $ST$: the turn $T$ is written on the right, next to the vector,
        because it acts first. $\;ST\,\mathbf{v} = S(T\,\mathbf{v})$.

        That one is $${mat(TURN_THEN_SHEAR)}$, which is not the same as $TS = ${mat(SHEAR_THEN_TURN)}.$
      `,
    },
    {
      id: 'example-product',
      type: 'info',
      title: 'A product without a picture',
      text: r`
        Follow each basis arrow: $B$ sends it to one of its own columns, and then $A$ acts on
        that column.

        :::key
        The first column of $AB$ is $A$ times the first column of $B$. The second column of
        $AB$ is $A$ times the second column of $B$.
        :::

        :::example
        $$ A = ${mat(EX_A)} \quad B = ${mat(EX_B)} $$

        1. First column: $\;A\,${vec(4, 1)} = ${lin(4, cols(EX_A)[0], 1, cols(EX_A)[1])} = ${vec(7, 7)}$
        2. Second column: $\;A\,${vec(-1, 2)} = ${lin(-1, cols(EX_A)[0], 2, cols(EX_A)[1])} = ${vec(5, -4)}$
        3. Side by side: $\;AB = ${mat(mul(EX_A, EX_B))}$
        :::
      `,
    },
    {
      id: 'columns',
      type: 'fill',
      title: 'Column by column',
      text: r`
        **Now you.** Each column of $AB$ is $A$ times a column of $B$.

        $$ A = ${mat([[1, 2], [0, 1]])} \quad B = ${mat([[3, 1], [1, -1]])} $$
      `,
      template: r`
        First column of $AB$: $\;A\,${vec(3, 1)}$ has top [[5]] and bottom [[1]].

        Second column of $AB$: $\;A\,${vec(1, -1)}$ has top [[-1]] and bottom [[-1]].
      `,
      hints: [
        r`$A\,${vec(3, 1)}$ is 3 lots of the first column of $A$ plus 1 lot of its second: $\;${lin(3, [1, 0], 1, [2, 1])}.$`,
        r`$A\,${vec(1, -1)}$ is the first column of $A$ minus its second: $\;${lin(1, [1, 0], -1, [2, 1])}.$`,
      ],
      explain: r`
        $A\,${vec(3, 1)} = ${lin(3, [1, 0], 1, [2, 1])} = ${vec(5, 1)}$ and $A\,${vec(1, -1)} = ${lin(1, [1, 0], -1, [2, 1])} = ${vec(-1, -1)}.$

        Put the two results side by side: $AB = ${mat([[5, -1], [1, -1]])}.$
      `,
    },
    {
      id: 'multiply',
      type: 'fill',
      review: true,
      gen: (rng) => {
        let A;
        let B;
        do {
          A = [[rng.int(-2, 3), rng.int(-2, 2)], [rng.int(-2, 2), rng.int(-1, 3)]];
          B = [[rng.int(-1, 3), rng.int(-2, 2)], [rng.int(-2, 2), rng.int(-2, 3)]];
        } while (A.flat().filter((v) => v === 0).length > 1 || B.flat().filter((v) => v === 0).length > 1
          || sameMatrix(A, IDENTITY) || sameMatrix(B, IDENTITY) || sameMatrix(mul(A, B), mul(B, A)));
        const AB = mul(A, B);
        const [a1, a2] = cols(A);
        const [b1, b2] = cols(B);
        return {
          text: r`
            **Work out the product $AB$,** one column at a time.
            $$ \begin{aligned} A &= ${mat(A)} \\[4pt] B &= ${mat(B)} \end{aligned} $$
          `,
          template: matrixBlanks(AB, '$AB$'),
          hints: [
            r`First column: $A$ times the first column of $B$. That is $\;${lin(b1[0], a1, b1[1], a2)}.$`,
            r`Second column: $A$ times the second column of $B$. That is $\;${lin(b2[0], a1, b2[1], a2)}.$`,
          ],
          explain: r`
            First column: $A\,${vec(b1[0], b1[1])} = ${lin(b1[0], a1, b1[1], a2)} = ${vec(AB[0][0], AB[1][0])}.$

            Second column: $A\,${vec(b2[0], b2[1])} = ${lin(b2[0], a1, b2[1], a2)} = ${vec(AB[0][1], AB[1][1])}.$

            Side by side: $AB = ${mat(AB)}.$
          `,
        };
      },
    },
    {
      id: 'which-order',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [p, q] = rng.sample(['A', 'B', 'M', 'N', 'P', 'Q'], 2);
        const [k1, k2] = rng.shuffle(rng.pick(ORDER_PAIRS));
        // p is the matrix of move k1, q the matrix of move k2
        const pFirst = rng.bool();
        const [firstKind, secondKind] = pFirst ? [k1, k2] : [k2, k1];
        const [firstLetter, secondLetter] = pFirst ? [p, q] : [q, p];
        const right = `$${secondLetter}${firstLetter}$`;
        const wrongWay = `$${firstLetter}${secondLetter}$`;
        return {
          text: r`
            $${p}$ is the matrix of ${NAMED[k1]}, and $${q}$ is the matrix of ${NAMED[k2]}.

            **Which product is the matrix of "first ${NAMED[firstKind].replace(/^a /, 'the ')}, then ${NAMED[secondKind].replace(/^a /, 'the ')}"?**
          `,
          options: [
            { text: right, correct: true },
            { text: wrongWay, why: r`In ${wrongWay} the matrix $${secondLetter}$ stands on the right, next to the vector, so it would act first. But $${secondLetter}$ is the move that should come second.` },
            { text: `$${p} + ${q}$`, why: 'Adding the two matrices does something else. One move after another is a product.' },
          ],
          hints: ['The matrix that acts first is written on the right, next to the vector.'],
          explain: r`The move that comes first is written on the **right**, next to the vector it acts on. Here $${firstLetter}$ acts first and $${secondLetter}$ second, so the product is ${right}: $\;${secondLetter}${firstLetter}\,\mathbf{v} = ${secondLetter}(${firstLetter}\,\mathbf{v})$.`,
        };
      },
    },
    {
      id: 'identity',
      type: 'interact',
      title: 'The matrix that does nothing',
      text: `
        Someone has left this machine in a strange state.

        **Set it to the matrix that leaves the F exactly where it started**, on the dashed outline.
      `,
      widget: {
        type: 'matrix-grid', range: 4, matrix: [[2, 1], [0, -1]], target: IDENTITY, ghost: false,
        alt: 'A letter F that has been stretched, sheared and flipped by a matrix, and a dashed outline of the F in its original place.',
      },
      check: (s) => {
        if (s.match) return true;
        if (s.flat) return 'The F has been squashed flat. Pull the two arrows apart again.';
        if (s.flipped) return 'The F is still a mirror image. Put each arrow back where a basis arrow starts: the blue one at (1, 0), the orange one at (0, 1).';
        return 'Put each arrow back where a basis arrow starts: the blue one at (1, 0) and the orange one at (0, 1).';
      },
      solution: { a: 1, b: 0, c: 0, d: 1 },
      explain: r`
        $$ ${cmat(IDENTITY)} $$

        Each arrow is back where a basis arrow starts, so every point is back where it began.
      `,
    },
    {
      id: 'teach-identity',
      type: 'info',
      title: 'The identity matrix',
      text: r`
        The matrix that does nothing has a name: the **identity matrix**, written $I$.

        $$ I = ${cmat(IDENTITY)} $$

        Each basis arrow lands on itself, so nothing moves. Among matrices, $I$ plays the part
        that 1 plays among numbers.

        :::key
        $AI = A$ and $IA = A$ for every matrix $A$.
        :::

        Doing nothing before a move, or after it, leaves just the move.
      `,
    },
    {
      id: 'commute',
      type: 'choice',
      title: 'Does the order always matter?',
      text: `
        Two different buttons this time. **Wider** doubles every width. **Taller** doubles every height.

        Try them in both orders. **What do you find?**
      `,
      figure: {
        type: 'matrix-grid', range: 5, maxMoves: 2,
        moves: [{ id: 'wide', label: 'Wider', matrix: WIDE }, { id: 'tall', label: 'Taller', matrix: TALL }],
        alt: 'A letter F on a grid and two buttons: Wider, which doubles every width, and Taller, which doubles every height.',
      },
      options: [
        { text: 'Both orders give the same result', correct: true },
        { text: 'The two orders give different results, as before', why: 'Press "Start again" and compare once more. Wider-then-taller and taller-then-wider both end with the F twice as wide and twice as tall.' },
        { text: 'The second move undoes the first', why: 'Nothing is undone: at the end the F is both wider and taller than it was.' },
      ],
      explain: r`
        $$ ${mat(WIDE)}${mat(TALL)} = ${mat(mul(WIDE, TALL))} $$
        $$ ${mat(TALL)}${mat(WIDE)} = ${mat(mul(TALL, WIDE))} $$

        Some pairs of matrices can be swapped. Most cannot. So the safe rule is:
        **never swap the order of a product unless you have checked.** In general $AB \ne BA$.
      `,
    },
    {
      id: 'which-product',
      type: 'choice',
      gen: (rng) => {
        const had = (A, B) => A.map((row, i) => row.map((v, j) => v * B[i][j]));
        const add = (A, B) => A.map((row, i) => row.map((v, j) => v + B[i][j]));
        let A;
        let B;
        let all;
        do {
          A = [[rng.int(-1, 2), rng.int(-1, 2)], [rng.int(-1, 2), rng.int(-1, 2)]];
          B = [[rng.int(-1, 2), rng.int(-1, 2)], [rng.int(-1, 2), rng.int(-1, 2)]];
          all = [mul(A, B), mul(B, A), had(A, B), add(A, B)];
        } while (A.flat().filter((v) => v === 0).length > 1 || B.flat().filter((v) => v === 0).length > 1
          || all.some((m, i) => all.some((n, j) => j > i && sameMatrix(m, n))));
        const [AB, BA, entrywise, sum] = all;
        const [a1, a2] = cols(A);
        const [b1, b2] = cols(B);
        return {
          text: r`
            $$ \begin{aligned} A &= ${mat(A)} \\[4pt] B &= ${mat(B)} \end{aligned} $$

            **Which matrix is the product $AB$?**
          `,
          options: [
            { text: `$${mat(AB)}$`, correct: true },
            { text: `$${mat(BA)}$`, why: r`That is $BA$: $B$ acting on the columns of $A$. In $AB$ it is $A$ that acts on the columns of $B$.` },
            { text: `$${mat(entrywise)}$`, why: r`That multiplies the entries in matching positions. A product is built column by column: $A$ times each column of $B$.` },
            { text: `$${mat(sum)}$`, why: r`That is $A + B$, the entries added. One move after another is not a sum.` },
          ],
          hints: [r`The first column of $AB$ is $A$ times the first column of $B$: $\;${lin(b1[0], a1, b1[1], a2)}.$`],
          explain: r`
            First column: $A\,${vec(b1[0], b1[1])} = ${vec(AB[0][0], AB[1][0])}$. Second column: $A\,${vec(b2[0], b2[1])} = ${vec(AB[0][1], AB[1][1])}$. So $AB = ${mat(AB)}.$

            The other order gives $BA = ${mat(BA)}$, a different matrix.
          `,
        };
      },
    },
    {
      id: 'powers',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const n = rng.int(5, 20);
        return {
          title: 'The same move, again and again',
          text: r`
            $S = ${mat(SHEAR)}$ is the shear. $S^2$ means $SS$: shear, then shear again. Press the
            button a few times and watch the orange arrow and the matrix.

            **What is the top-right entry of $S^{${n}}$?**
          `,
          figure: {
            type: 'matrix-grid', range: 4, maxMoves: 3, fit: 'unit',
            moves: [{ id: 'shear', label: 'Shear', matrix: SHEAR }],
            alt: 'A small letter F on a grid and one button, Shear, that slides the top row one step to the right each time it is pressed.',
          },
          answer: n,
          wrong: [
            [1, r`That is the entry of $S$ itself. Each further shear slides the orange arrow one more step to the right.`],
            [2 * n, r`Each shear adds 1 to that entry; it does not add 2. After ${n} shears the orange arrow has moved ${n} steps.`],
          ],
          hints: [
            r`After one shear the orange arrow is at $${vec(1, 1)}$, after two at $${vec(2, 1)}$, after three at $${vec(3, 1)}$.`,
            'The orange arrow is the second column of the matrix. Where is it after that many shears?',
          ],
          explain: r`
            Every shear slides the tip of the orange arrow one more step to the right and leaves
            the blue arrow alone. After ${n} shears the orange arrow ends at $${vec(n, 1)}$, so

            $$ S^{${n}} = ${mat([[1, n], [0, 1]])} $$

            Thinking about what the move does saved ${n - 1} matrix multiplications.
          `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true** for $2 \\times 2$ matrices $A$ and $B$?',
      options: [
        { text: r`$AB$ means: first apply $B$, then apply $A$`, correct: true },
        { text: r`The first column of $AB$ is $A$ times the first column of $B$`, correct: true },
        { text: r`$AI = A$ and $IA = A$, where $I$ is the identity matrix`, correct: true },
        { text: r`$AB$ and $BA$ are always the same matrix`, why: 'A turn and a shear give different results in the two orders. A few special pairs can be swapped, but most cannot.' },
        { text: 'To multiply two matrices, multiply the entries in matching positions', why: r`That does not describe one move after another. Work column by column: $A$ times each column of $B$.` },
      ],
      explain: r`A product is one move after another, read from right to left, and worked out column by column. The identity changes nothing, and the order of a product matters in general.`,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        $T$ is written first in $TS$, and yet the shear $S$ is the move that happens first.

        **How would you explain that to someone who finds it backwards?**
      `,
      model: r`
        A matrix acts on whatever is written to its right. In $TS\,\mathbf{v}$ the vector meets $S$
        first, because $S$ is next to it: $TS\,\mathbf{v} = T(S\,\mathbf{v})$. Only then does $T$ act
        on the result.

        So a product is read from right to left, in the order the vector meets the matrices.
        It is the same with shoes(socks(foot)): the socks are written second and put on first.
      `,
    },
  ],
  recap: [
    'Doing one transformation after another is again a transformation. Its matrix is the product.',
    r`$AB$ means **first $B$, then $A$**: the matrix next to the vector acts first.`,
    r`Work a product out column by column: each column of $AB$ is $A$ times a column of $B$.`,
    r`The order matters: in general $AB \ne BA$. The identity $I$ changes nothing: $AI = IA = A$.`,
  ],
  next: 'Next: a single number that tells you whether a move can be undone.',
};
