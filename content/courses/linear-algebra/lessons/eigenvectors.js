// Linear Algebra: Vectors & Matrices · Lesson 6 · The Directions That Stay Put
import { r, num } from '../../../kit.js';
import { vec, mat, par, apply, det, mul, TURN } from '../helpers.js';

const A = [[2, 1], [1, 2]];          // eigenvalue 3 along (1, 1), eigenvalue 1 along (1, -1)
const D = [[2, 0], [0, -1]];         // diagonal: eigenvalue 2 along (1, 0), eigenvalue -1 along (0, 1)
const GROW = [[1, 0.5], [0.5, 1]];   // eigenvalue 1.5 along (1, 1), eigenvalue 0.5 along (1, -1)
const BIKES = [[0.5, 0.25], [0.5, 0.75]];   // columns add up to 1: eigenvalue 1 along (1, 2), eigenvalue 0.25 along (1, -1)
const EX = [[1, 4], [1, -2]];        // the worked example: eigenvalue 2 along (4, 1), which eigenMatrix cannot draw; eigenvalue -3 along (1, -1)

const near = (a, b) => Math.abs(a - b) < 1e-6;
/** Where the test arrow starts: 75° from the horizontal, well away from every eigen-direction used here. */
const STEEP = { x: 0.258819, y: 0.965926 };

/** Turn a test arrow and watch where the matrix sends it. */
const spinner = (matrix, extra = {}) => ({
  type: 'eigen-spin', matrix, readouts: ['verdict'],
  alt: 'A violet test arrow v that can be turned about the origin, a dashed line through it, and a green arrow showing where the matrix sends it.',
  ...extra,
});

/**
 * A matrix with whole-number entries and two known eigen-directions:
 * A = P · diag(l1, l2) · P⁻¹, where P has determinant 1 or −1 and its columns are the eigenvectors.
 */
function eigenMatrix(rng) {
  for (;;) {
    const P = [[rng.int(-2, 3), rng.int(-2, 3)], [rng.int(-2, 3), rng.int(-2, 3)]];
    const dp = det(P);
    if (Math.abs(dp) !== 1) continue;
    const [l1, l2] = rng.sample([-2, -1, 2, 3, 4], 2);
    const Pinv = [[P[1][1] / dp, -P[0][1] / dp], [-P[1][0] / dp, P[0][0] / dp]];
    const M = mul(mul(P, [[l1, 0], [0, l2]]), Pinv).map((row) => row.map((v) => (Object.is(v, -0) ? 0 : v)));
    if (M.flat().some((v) => Math.abs(v) > 6) || M[0][1] === 0 || M[1][0] === 0) continue;
    return { M, vectors: [{ x: P[0][0], y: P[1][0] }, { x: P[0][1], y: P[1][1] }], values: [l1, l2] };
  }
}
const parallel = (p, q) => p.x * q.y - p.y * q.x === 0;

const FRACTION = { 2: 'half', 3: 'a third', 4: 'a quarter', 5: 'a fifth' };
const PLACES = [
  { things: 'shared bikes', a: 'North station', b: 'South station', every: 'day', verb: 'end the day at' },
  { things: 'rental cars', a: 'the airport', b: 'the city office', every: 'week', verb: 'are returned to' },
  { things: 'library books', a: 'the east branch', b: 'the west branch', every: 'month', verb: 'are handed back at' },
];

export default {
  id: 'eigenvectors',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Knocked off course',
      text: r`
        The matrix $A = ${mat(A)}$ moves every arrow. In the picture it has sent the violet arrow
        to the green one, knocking it off its own dashed line.

        Turn the arrow to any other direction and the same thing happens. Or does it?

        **On how many lines through the origin does an arrow stay on its own line?**
      `,
      figure: spinner(A, { static: true, readouts: [], formula: false, v: STEEP, alt: 'A violet arrow pointing steeply up, with a dashed line through it, and a longer green arrow that leans further to the right: where the matrix has sent it.' }),
      shuffle: false,
      options: [
        { text: 'None' },
        { text: 'Two', correct: true },
        { text: 'Every line' },
      ],
      explain: `
        Two. Nearly every arrow is knocked off its line, but this matrix has exactly two
        lines along which an arrow keeps its direction.

        Those few directions turn out to explain everything the matrix does, above all when
        it is applied again and again.
      `,
    },
    {
      id: 'teach-off-line',
      type: 'info',
      title: 'On its line, or off it',
      text: r`
        The violet arrow is a test arrow $\violet{\mathbf{v}}$. The green arrow is
        $\green{A\mathbf{v}}$: where the matrix sends it. The dashed line is the line through
        $\violet{\mathbf{v}}$.

        Here $\mathbf{v} = ${vec(1, 0)}$, and the matrix sends it to its first column:

        $$ ${mat(A)}${vec(1, 0)} = ${vec(2, 1)} $$

        The green arrow does not lie on the dashed line: this arrow has been knocked
        **off its line**. An arrow stays **on its line** when the matrix sends it to a
        multiple of itself.
      `,
      figure: spinner(A, {
        static: true, v: { x: 1, y: 0 }, formula: false, showMatrix: false,
        alt: 'A violet arrow pointing 1 to the right, with a dashed line through it along the horizontal axis, and a green arrow that ends at 2 across, 1 up: where the matrix has sent it, off the dashed line.',
      }),
    },
    {
      id: 'spin',
      type: 'interact',
      title: 'A direction that holds',
      text: r`
        Now turn the violet arrow $\violet{\mathbf{v}}$ yourself, and watch the green arrow
        $\green{A\mathbf{v}}$ and the dashed line.

        **Find a direction in which $\green{A\mathbf{v}}$ lies on the line of $\violet{\mathbf{v}}$.**
      `,
      widget: spinner(A, { v: STEEP }),
      check: (s) => s.aligned || 'The green arrow is still off the dashed line. Keep turning, and watch the gap between them close.',
      solution: { v: { x: 1, y: 1 } },
      explain: r`
        This matrix has two such lines. One runs halfway between the axes, along $${vec(1, 1)}$. There
        the green arrow lies along the violet one and is three times as long:

        $$ ${mat(A)}${vec(1, 1)} = ${vec(3, 3)} = 3\,${vec(1, 1)} $$

        In that direction the matrix does nothing more than multiply by 3. The other line comes
        up in a moment.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Eigenvectors and eigenvalues',
      text: r`
        :::key
        An **eigenvector** of a matrix $A$ is an arrow $\mathbf{v}$, not the zero vector, that $A$ keeps
        on its own line:
        $$ A\mathbf{v} = \lambda\,\mathbf{v} $$
        The number $\lambda$ (the Greek letter lambda) is its **eigenvalue**: the factor by which
        the arrow is stretched.
        :::

        For $A = ${mat(A)}$ the arrow $${vec(1, 1)}$ is an eigenvector with eigenvalue 3. Any other
        arrow on the same line, such as $${vec(2, 2)}$ or $${vec(-1, -1)}$, is an eigenvector too:
        what matters is the line.

        *Eigen* is a German word meaning "own". These are the matrix's own directions.
      `,
    },
    {
      id: 'second',
      type: 'interact',
      title: 'The other one',
      text: r`
        The matrix $A = ${mat(A)}$ has two eigen-directions. One has eigenvalue 3. The other has
        eigenvalue 1, so in that direction the arrow is not changed at all.

        **Find the direction with eigenvalue 1.**
      `,
      widget: spinner(A, { v: STEEP }),
      check: (s) => {
        if (s.aligned && near(s.factor, 1)) return true;
        if (s.aligned) return 'That is the direction with eigenvalue 3: here the green arrow is 3 times the violet one. The direction with eigenvalue 1 is somewhere else on the circle.';
        return 'The green arrow is off the dashed line here. Keep turning.';
      },
      solution: { v: { x: 1, y: -1 } },
      hints: ['When the eigenvalue is 1, the green arrow lies exactly on top of the violet one.'],
      explain: r`
        In the direction of $${vec(1, -1)}$, or the opposite arrow $${vec(-1, 1)}$:

        $$ ${mat(A)}${vec(1, -1)} = ${vec(1, -1)} $$

        So the matrix stretches by 3 along one line and leaves the line at right angles to it
        alone. That is a complete description of what $A$ does.
      `,
    },
    {
      id: 'example-eigen-check',
      type: 'info',
      title: 'Testing an arrow',
      text: r`
        To test an arrow, multiply it by the matrix. Then compare.

        :::example
        $$ A = ${mat(EX)} \qquad \mathbf{v} = ${vec(4, 1)} $$

        1. Multiply. Top: $1 \times 4 + 4 \times 1 = 8$. Bottom: $1 \times 4 + (-2) \times 1 = 2$.
        2. Compare: $\;A\mathbf{v} = ${vec(8, 2)} = 2 \times ${vec(4, 1)}$

        A multiple of $\mathbf{v}$: an eigenvector, with eigenvalue 2.
        :::

        An arrow that does not come out as a multiple of itself is not an eigenvector. An
        eigenvalue may be **negative**: the arrow then points the opposite way, still on its line.
      `,
      figure: {
        type: 'eigen-spin', matrix: EX, mode: 'free', static: true, x: [-2, 9], y: [-4, 7], v: { x: 4, y: 1 },
        readouts: ['verdict'], formula: false, showMatrix: false,
        alt: 'A violet arrow v, 4 across and 1 up, with a dashed line through it, and a green arrow twice as long that lies on the same dashed line: where the matrix has sent it.',
      },
    },
    {
      id: 'eigen-check',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const { M, vectors, values } = eigenMatrix(rng);
        const i = rng.int(0, 1);
        const v = vectors[i];
        const lambda = values[i];
        const out = apply(M, v);
        return {
          text: r`
            **Check that $\mathbf{v}$ is an eigenvector of $A$, and find its eigenvalue.**
            $$ A = ${mat(M)} \qquad \mathbf{v} = ${vec(v.x, v.y)} $$
          `,
          template: r`
            $A\mathbf{v}$ has top number [[${num(out.x)}]] and bottom number [[${num(out.y)}]].

            That is [[${num(lambda)}]] times $\mathbf{v}$.
          `,
          hints: [
            r`Top number: $${num(M[0][0])} \times ${par(v.x)} + ${par(M[0][1])} \times ${par(v.y)}$. Bottom number: $${num(M[1][0])} \times ${par(v.x)} + ${par(M[1][1])} \times ${par(v.y)}$.`,
            r`$A\mathbf{v} = ${vec(out.x, out.y)}$. By what number do you multiply $${vec(v.x, v.y)}$ to get that?`,
          ],
          explain: r`$A\mathbf{v} = ${vec(out.x, out.y)} = ${num(lambda)} \times ${vec(v.x, v.y)}$. The arrow stays on its own line, so it is an eigenvector, and its eigenvalue is $${num(lambda)}$${lambda < 0 ? ': the arrow is flipped to point the opposite way' : ''}.`,
        };
      },
    },
    {
      id: 'spot-eigenvector',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const { M, vectors, values } = eigenMatrix(rng);
        const i = rng.int(0, 1);
        const v = vectors[i];
        const pool = [];
        for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (x !== 0 || y !== 0) pool.push({ x, y });
        const wrong = [];
        for (const w of rng.shuffle(pool)) {
          if (vectors.some((p) => parallel(p, w)) || wrong.some((p) => parallel(p, w))) continue;
          wrong.push(w);
          if (wrong.length === 3) break;
        }
        const out = apply(M, v);
        return {
          text: r`
            $$ A = ${mat(M)} $$
            **Which of these arrows is an eigenvector of $A$?**
          `,
          options: [
            { text: `$${vec(v.x, v.y)}$`, correct: true },
            ...wrong.map((w) => {
              const to = apply(M, w);
              return { text: `$${vec(w.x, w.y)}$`, why: r`$A$ sends it to $${vec(to.x, to.y)}$, which is not a multiple of $${vec(w.x, w.y)}$: the arrow is knocked off its line.` };
            }),
          ],
          hints: [r`Multiply each arrow by $A$. An eigenvector comes out as a multiple of itself.`],
          explain: r`$A\,${vec(v.x, v.y)} = ${vec(out.x, out.y)} = ${num(values[i])} \times ${vec(v.x, v.y)}$: this arrow stays on its own line, with eigenvalue $${num(values[i])}$. Each of the other three is sent off its line.`,
        };
      },
    },
    {
      id: 'diagonal',
      type: 'interact',
      title: 'The easy case, and a flip',
      text: r`
        A matrix with zeros away from the main diagonal is easy to read:

        $$ D = ${mat(D)} $$

        **Find an eigenvector of $D$ whose eigenvalue is negative.** The arrow is flipped to
        point the opposite way, but it still lies on its own line.
      `,
      widget: spinner(D, { x: [-3, 3], y: [-3, 3], v: { x: 1, y: 1 } }),
      check: (s) => {
        if (s.aligned && s.factor < 0) return true;
        if (s.aligned) return 'Here the green arrow is 2 times the violet one: an eigenvector, but with the positive eigenvalue 2. Look for the direction in which the arrow is flipped.';
        return 'The green arrow is off the dashed line here. Try the directions of the two axes.';
      },
      solution: { v: { x: 0, y: 1 } },
      explain: r`
        Straight up (or straight down): $\;D\,${vec(0, 1)} = ${vec(0, -1)} = -1 \times ${vec(0, 1)}$. A negative
        eigenvalue turns the arrow round, yet it stays on its own line, so it counts.

        For a **diagonal** matrix the two basis arrows are eigenvectors, and the eigenvalues
        are the numbers on the diagonal: here 2 and $-1$.
      `,
    },
    {
      id: 'rotation',
      type: 'choice',
      title: 'A matrix with none',
      text: r`
        This is the quarter turn you have met before:

        $$ T = ${mat(TURN)} $$

        Turn $\violet{\mathbf{v}}$ all the way round. **How many eigen-directions does $T$ have?**
      `,
      figure: spinner(TURN, { x: [-2, 2], y: [-2, 2], v: STEEP }),
      shuffle: false,
      options: [
        { text: 'None', correct: true },
        { text: 'Two', why: 'Wherever the violet arrow points, the green one is at a right angle to it. It never lies on the dashed line.' },
        { text: 'Every direction', why: 'Then the green arrow would always lie on the dashed line. Here it is always at a right angle to it.' },
      ],
      explain: r`
        A quarter turn sends every arrow to one at right angles to it, so no arrow stays on its
        own line. $T$ has no eigenvectors in the plane.

        Not every matrix has them. (With a wider kind of number, the complex numbers, even a
        turn has eigenvalues, but that is a story for another course.)
      `,
    },
    {
      id: 'repeat',
      type: 'interact',
      graded: false,
      title: 'Again and again',
      text: r`
        A new matrix, with its two eigen-directions drawn as dotted lines:

        $$ B = ${mat(GROW)} $$

        Along one line its eigenvalue is 1.5, along the other 0.5.

        **Drag the violet start arrow anywhere, then apply $B$ at least four times.** Where does the trail head?
      `,
      widget: {
        type: 'eigen-spin', matrix: GROW, mode: 'free', snap: 1, x: [-6, 6], y: [-6, 6], v: { x: -2, y: 3 },
        line: false, lines: [[1, 1], [1, -1]], iterate: { label: 'Apply B again', max: 6 }, names: ['start', ''],
        alt: 'A violet start arrow that can be dragged, two dotted lines through the origin, and a button that applies the matrix again and again, leaving a trail of green points.',
      },
      check: (s) => s.steps >= 4 || `Applied ${s.steps} ${s.steps === 1 ? 'time' : 'times'} so far. Keep pressing the button.`,
      solution: { steps: 4 },
      explain: r`
        Any start arrow is a combination of the two eigen-directions, as in the first lesson.
        Each press multiplies the part along $${vec(1, 1)}$ by 1.5 and the part along $${vec(1, -1)}$ by 0.5.
        After a few presses the second part has all but vanished.

        :::key
        Applied again and again, a matrix like this pulls almost every arrow towards the
        eigen-direction whose eigenvalue is **largest in size**.
        :::

        The only exceptions are arrows that start exactly on the other dotted line.
      `,
    },
    {
      id: 'bikes',
      type: 'fill',
      title: 'Where do the bikes end up?',
      text: r`
        A town has 120 shared bikes and two stations. Every day **half** of the bikes at North
        end the day at South, and **a quarter** of the bikes at South end the day at North.
        So each day multiplies the pair of numbers by a matrix:

        $$ \begin{pmatrix} \tfrac{1}{2} & \tfrac{1}{4} \\[5pt] \tfrac{1}{2} & \tfrac{3}{4} \end{pmatrix}\begin{pmatrix} \text{North} \\ \text{South} \end{pmatrix} $$

        On day 0 all 120 bikes are at North. **Press "Next day" until the numbers stop changing.**
      `,
      figure: {
        type: 'eigen-spin', matrix: BIKES, mode: 'free', drag: false, x: [0, 120], y: [0, 120], gridStep: 20, tickStep: 20,
        xLabel: 'bikes at North', yLabel: 'bikes at South', v: { x: 120, y: 0 }, line: false, names: ['', ''],
        iterate: { label: 'Next day', max: 10, unit: 'day' }, parts: ['North', 'South'], formula: false,
        alt: 'A chart with the number of bikes at North across and the number at South up. A button moves on one day at a time and leaves a trail of points.',
      },
      template: 'In the end there are [[40]] bikes at North and [[80]] at South.',
      hints: ['Keep pressing "Next day". After about five days the two numbers, rounded to whole bikes, no longer move.'],
      explain: r`
        With 40 at North and 80 at South, 20 bikes go each way every day, so nothing changes:

        $$ \begin{pmatrix} \tfrac{1}{2} & \tfrac{1}{4} \\[5pt] \tfrac{1}{2} & \tfrac{3}{4} \end{pmatrix}${vec(40, 80)} = ${vec(40, 80)} $$

        That settled state is an eigenvector with eigenvalue 1. The other eigenvalue of this
        matrix is $\tfrac{1}{4}$, so everything else about the starting position dies away fast.

        Google's PageRank ranks web pages on the same principle: importance flows along links,
        again and again, until it settles. The settled scores are an eigenvector with eigenvalue 1.
      `,
    },
    {
      id: 'example-settled',
      type: 'info',
      title: 'Settled, without the button',
      text: `
        Why 40 and 80? **Settled** means that every day as many bikes leave North as arrive there.

        :::example
        1. Leaving North each day: **half** of its bikes. Arriving: **a quarter** of South's.
        2. The two are equal with 2 bikes at North for every 4 at South: half of 2 is 1, and a quarter of 4 is 1. So the numbers are in the ratio 2 to 4.
        3. Together that is $2 + 4 = 6$ parts for 120 bikes, so one part is 20 bikes.
        4. North has $2 \\times 20 = 40$ and South has $4 \\times 20 = 80$.
        :::

        The matrix sends that pair of numbers to itself. So the settled state is an
        eigenvector with eigenvalue 1, and it can be found without the matrix at all.
      `,
    },
    {
      id: 'steady-state',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const place = rng.pick(PLACES);
        const [m, n] = rng.sample([2, 3, 4, 5], 2);   // 1/m of A's stock moves to B, 1/n of B's stock moves to A
        let t = rng.pick([10, 12, 20, 30]);            // how many move each way once things have settled
        if (m === 2 && n === 4 && t === 20) t = 30;    // never the worked example before it: 120 in all, half one way and a quarter back
        const total = (m + n) * t;
        const atA = m * t;
        const atB = n * t;
        return {
          title: 'Settled',
          text: `
            A firm has **${total} ${place.things}**, kept at ${place.a} and at ${place.b}.
            Every ${place.every}, **${FRACTION[m]}** of those at ${place.a} ${place.verb} ${place.b}, and
            **${FRACTION[n]}** of those at ${place.b} ${place.verb} ${place.a}.

            After many ${place.every}s the numbers settle. **How many are then at ${place.a}?**
          `,
          answer: atA,
          wrong: [
            [atB, `That is the number at ${place.b}. The question asks about ${place.a}.`],
            [total / 2, `An equal split does not stay equal: ${FRACTION[m]} of ${total / 2} would leave ${place.a} and ${FRACTION[n]} of ${total / 2} would arrive, and those are different amounts.`],
          ],
          hints: [
            `Settled means that as many leave ${place.a} as arrive there: ${FRACTION[m]} of the first number equals ${FRACTION[n]} of the second.`,
            `So the two numbers are in the ratio ${m} to ${n}, and together they make ${total}.`,
          ],
          explain: `
            Once things have settled, as many leave ${place.a} as arrive: ${FRACTION[m]} of its number
            equals ${FRACTION[n]} of the number at ${place.b}. So the two numbers are in the ratio ${m} to ${n}.
            Out of ${total} that is **${atA}** and ${atB}, and then ${t} move each way every ${place.every}.

            The settled numbers form an eigenvector with eigenvalue 1: the matrix sends them to themselves.
          `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'An eigenvector of a matrix is a non-zero arrow that the matrix keeps on its own line', correct: true },
        { text: r`If $A\mathbf{v} = 3\mathbf{v}$ and $\mathbf{v}$ is not the zero vector, then $\mathbf{v}$ is an eigenvector with eigenvalue 3`, correct: true },
        { text: 'An eigenvalue can be negative: the arrow is then flipped, but stays on its line', correct: true },
        { text: r`Every $2 \times 2$ matrix has two eigen-directions in the plane`, why: 'A quarter turn has none: it knocks every arrow off its line.' },
        { text: 'A matrix never changes its eigenvectors', why: 'It may stretch, shrink or flip them. What it does not change is the line they lie on.' },
      ],
      explain: r`$A\mathbf{v} = \lambda\mathbf{v}$: an eigenvector keeps its line, and the eigenvalue $\lambda$ says how it is stretched, shrunk or flipped along that line. Some matrices, such as a quarter turn, have no such arrows at all.`,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        The matrix $A = ${mat(A)}$ multiplies by 3 along $${vec(1, 1)}$ and by 1 along $${vec(1, -1)}.$

        **Why does knowing this make it easy to say what $A$ applied ten times does to an arrow?**
      `,
      model: r`
        Write the arrow as a combination of the two eigenvectors: so much of $${vec(1, 1)}$ plus so
        much of $${vec(1, -1)}$. Every time $A$ is applied, the first part is multiplied by 3 and the
        second part by 1.

        After ten applications the first part has grown by a factor of $3^{10}$, which is
        59 049, and the second has not changed. No matrix multiplication is needed, and the
        result points almost exactly along $${vec(1, 1)}$.
      `,
    },
  ],
  recap: [
    r`An eigenvector of $A$ is an arrow that $A$ keeps on its own line: $A\mathbf{v} = \lambda\mathbf{v}$. The eigenvalue $\lambda$ is the stretch factor.`,
    'A diagonal matrix has the basis arrows as eigenvectors and its diagonal entries as eigenvalues. A quarter turn has no eigenvectors in the plane.',
    'Applied again and again, a matrix with two eigen-directions pulls almost every arrow towards the one whose eigenvalue is largest in size.',
    'A state that a matrix leaves unchanged is an eigenvector with eigenvalue 1: the settled numbers of bikes, or the ranking of web pages.',
  ],
  next: 'That completes the course: arrows, the dot product, matrices as machines, products, determinants and eigenvectors. Every one of them returns, with far more than two numbers, in data science and in neural networks.',
};
