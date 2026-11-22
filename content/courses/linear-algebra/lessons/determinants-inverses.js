// Linear Algebra: Vectors & Matrices · Lesson 5 · Squash, Flip, Undo
import { r, num, term } from '../../../kit.js';
import { vec, mat, cmat, par, apply, det, matrixBlanks, SHEAR, IDENTITY } from '../helpers.js';

/** The area picture: the unit square with a small F on it, and the shape the matrix turns it into. */
const areaLab = (extra = {}) => ({
  type: 'matrix-grid', range: 4, fit: 'unit', square: true,
  alt: 'A grid with the unit square, a small letter F inside it, and a blue and an orange arrow. The matrix turns the square into a yellow parallelogram spanned by the two arrows.',
  ...extra,
});

/** "which arrow does the matrix send where?": drag v on the grid and watch Av. */
const probe = (extra = {}) => ({
  type: 'eigen-spin', mode: 'free', snap: 1, line: false,
  alt: 'A violet arrow v whose tip can be dragged on the grid, and a green arrow showing where the matrix sends it.',
  ...extra,
});

const is = (s, m) => s.a === m[0][0] && s.b === m[0][1] && s.c === m[1][0] && s.d === m[1][1];

/** A matrix with whole-number entries whose determinant is 1 or −1, so that its inverse has whole numbers too. */
function unitMatrix(rng) {
  let m;
  do {
    m = [[rng.nonzero(-3, 4), rng.nonzero(-3, 4)], [rng.nonzero(-3, 3), rng.nonzero(-3, 4)]];
  } while (Math.abs(det(m)) !== 1);
  return m;
}
/** The inverse, by the 2 × 2 formula. */
const inverse = (m) => { const d = det(m); return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]]; };
/** "2x - y" for one row of a system. */
const row = (a, b) => `${term(a, 'x')} ${b < 0 ? '-' : '+'} ${term(Math.abs(b), 'y')}`;
/** The matrix of the two worked examples (inverse, then a system). Its 5 is outside what unitMatrix can draw. */
const EX = [[5, 2], [3, 1]];

export default {
  id: 'determinants-inverses',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How much bigger?',
      text: r`
        The matrix $${cmat([[3, 1], [1, 2]])}$ turns the dashed unit square, of area 1, into the
        [yellow]{.yellow} parallelogram.

        **Estimate the area of the parallelogram**, in grid squares.
      `,
      figure: areaLab({ range: 5, matrix: [[3, 1], [1, 2]], static: true, showMatrix: false }),
      min: 1, max: 10, step: 1, answer: 5, tolerance: 0, start: 1, directional: false,
      explain: r`
        The area is exactly **5**. And every square of the grid, wherever it was, has become a
        parallelogram of area 5.

        That 5 can be read straight off the matrix: $3 \times 2 - 1 \times 1 = 5$. This lesson
        is about that number, and about what it says when it is negative or zero.
      `,
    },
    {
      id: 'teach-area',
      type: 'info',
      title: 'Where the unit square lands',
      text: r`
        The dashed **unit square** has area 1. A matrix sends it to the [yellow]{.yellow}
        parallelogram on its two arrows.

        Here the matrix is $${cmat([[3, 1], [0, 2]])}.$ The parallelogram has base 3 and height 2,
        so its area is base times height: 6.

        Every other square of the grid is changed in exactly the same way. So this matrix
        multiplies **every** area by 6, the little F included.
      `,
      figure: areaLab({
        range: 5, matrix: [[3, 1], [0, 2]], static: true, readouts: ['area'],
        alt: 'A grid moved by a matrix. The blue arrow ends at 3 across. The orange arrow ends at 1 across, 2 up. The dashed unit square has become a yellow parallelogram with base 3 and height 2, and the small letter F inside it has grown with it.',
      }),
    },
    {
      id: 'squash',
      type: 'interact',
      title: 'Make it vanish',
      text: `
        Drag the two arrows. The readout shows the area of the [yellow]{.yellow} shape: the place
        where the unit square lands.

        **Make that area exactly 0, without putting either arrow at the origin.**
      `,
      widget: areaLab({ readouts: ['area'] }),
      check: (s) => {
        if ((s.a === 0 && s.c === 0) || (s.b === 0 && s.d === 0)) return 'An arrow of no length does flatten everything, but that is too easy. Use two real arrows.';
        if (s.flat) return true;
        return `The area is ${num(s.area)}. Bring the two arrows closer to one and the same line.`;
      },
      solution: { a: 2, b: 1, c: 2, d: 1 },
      explain: `
        The area is 0 exactly when the two arrows lie along **one line**. Then the whole plane
        is squashed onto that line: the grid collapses, and the F is flattened with it.
      `,
    },
    {
      id: 'flip',
      type: 'interact',
      title: 'The other side',
      text: `
        Now watch the little F as well as the area. The machine starts with area 2.

        **Keep the area at 2, but turn the F into a mirror image.**
      `,
      widget: areaLab({ matrix: [[2, 0], [0, 1]], readouts: ['area', 'facing'] }),
      check: (s) => {
        if (s.flipped && s.area === 2) return true;
        if (s.flat) return 'The two arrows are on one line now: the F is flat and the area is 0. Keep going, across to the other side.';
        if (s.flipped) return `The F is a mirror image, but the area is now ${num(s.area)}. Bring it back to 2.`;
        return 'The F is still the right way round. Swing the orange arrow across the line of the blue one, to its other side.';
      },
      solution: { a: 2, b: 0, c: 0, d: -1 },
      explain: r`
        The F flips at the moment the orange arrow crosses the line of the blue one, which is
        also the moment the area passes through 0.

        One number records both facts: the area, with a **minus sign** when shapes are mirrored.
        For $${cmat([[2, 0], [0, -1]])}$ that number is $-2$.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The determinant',
      text: r`
        That number is the **determinant** of the matrix:

        $$ \det\begin{pmatrix} \blue{a} & \orange{b} \\ \blue{c} & \orange{d} \end{pmatrix} = \blue{a}\orange{d} - \orange{b}\blue{c} $$

        :::key
        The determinant is the factor by which the matrix multiplies **every** area.
        Negative: shapes are mirrored as well. Zero: the plane is squashed onto a line (or, for the matrix of all zeros, onto a single point).
        :::

        Why $ad - bc$ gives exactly that area is taken on trust here. Test it: drag the arrows
        and compare the readout with your own calculation.
      `,
      figure: areaLab({ range: 5, matrix: [[3, 1], [1, 2]], readouts: ['area', 'det'] }),
    },
    {
      id: 'example-determinant',
      type: 'info',
      title: 'Working one out',
      text: r`
        Multiply along the two diagonals, then subtract the second product from the first.

        :::example
        $$ \begin{aligned} \det${cmat([[-5, 1], [2, 1]])} &= (-5) \times 1 - 1 \times 2 \\[4pt] &= -5 - 2 = -7 \end{aligned} $$
        :::

        Read the answer in two parts. Its **size**, 7, is the factor for every area. Its
        **minus sign** says that shapes come out mirrored.

        The picture agrees: the yellow shape has area 7, and the little F is a mirror image.
      `,
      figure: areaLab({
        range: 6, matrix: [[-5, 1], [2, 1]], static: true, readouts: ['area', 'facing', 'det'],
        alt: 'A grid moved by a matrix. The blue arrow ends at 5 to the left, 2 up. The orange arrow ends at 1 across, 1 up. The unit square has become a long yellow parallelogram of area 7, and the small letter F on it is a mirror image.',
      }),
    },
    {
      id: 'determinant',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let m;
        do {
          m = [[rng.int(-4, 5), rng.int(-4, 5)], [rng.int(-4, 5), rng.int(-4, 5)]];
        } while (m.flat().filter((v) => v === 0).length > 1);
        const [[a, b], [c, d]] = m;
        return {
          text: r`**Work out the determinant.** $$ \det${mat(m)} $$`,
          answer: a * d - b * c,
          wrong: [
            [a * d + b * c, r`That is $${num(a * d)} + ${par(b * c)}$. The second product is **subtracted**: $ad - bc$.`],
            [b * c - a * d, r`That is $bc - ad$, the two products the wrong way round. Start with the diagonal from top left to bottom right.`],
            [a * b - c * d, r`That multiplies along the rows: $${num(a)} \times ${par(b)}$ and $${num(c)} \times ${par(d)}$. Multiply along the two diagonals instead.`],
          ],
          hints: [r`Multiply along the two diagonals: $${num(a)} \times ${par(d)}$ and $${num(b)} \times ${par(c)}$. Then subtract the second from the first.`],
          explain: r`$ad - bc = ${num(a)} \times ${par(d)} - ${par(b)} \times ${par(c)} = ${num(a * d)} - ${par(b * c)} = ${num(a * d - b * c)}$.`,
        };
      },
    },
    {
      id: 'what-it-does',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['plus', 'minus', 'zero']);
        let m;
        do {
          m = [[rng.nonzero(-3, 4), rng.nonzero(-3, 4)], [rng.nonzero(-3, 4), rng.nonzero(-3, 4)]];
        } while ((kind === 'zero') !== (det(m) === 0) || (kind === 'plus' && det(m) < 0) || (kind === 'minus' && det(m) > 0) || Math.abs(det(m)) > 9);
        const [[a, b], [c, d]] = m;
        const D = det(m);
        const working = r`$${num(a)} \times ${par(d)} - ${par(b)} \times ${par(c)} = ${num(D)}$`;
        // with determinant 0 the tempting wrong number comes from adding the two products
        const k = D === 0 ? Math.abs(a * d + b * c) : Math.abs(D);
        const said = D === 0
          ? `The determinant is ${working}, not ${k}: the two products are subtracted, not added.`
          : null;
        return {
          text: r`
            A shape of area 1 goes through this matrix:
            $$ ${mat(m)} $$
            **What comes out?**
          `,
          shuffle: false,
          options: [
            { text: `Area ${k}, the right way round`, correct: D > 0, why: said || 'The determinant is negative here, and a negative determinant means shapes are mirrored.' },
            { text: `Area ${k}, mirrored`, correct: D < 0, why: said || 'The determinant is positive here, and a positive determinant means nothing is mirrored.' },
            { text: 'Squashed onto a line: area 0', correct: D === 0, why: `The determinant is ${num(D)}, not 0, so nothing is squashed flat.` },
          ].map((o) => (o.correct ? { text: o.text, correct: true } : { text: o.text, why: o.why })),
          hints: ['Work out the determinant first. Its size is the new area, and its sign says whether the shape is mirrored.'],
          explain: D === 0
            ? r`The determinant is ${working}. The two columns lie along one line, so every shape is squashed onto that line.`
            : r`The determinant is ${working}. Areas are multiplied by ${Math.abs(D)}, and because the determinant is ${D > 0 ? 'positive nothing is mirrored' : 'negative the shape comes out mirrored'}.`,
        };
      },
    },
    {
      id: 'undo',
      type: 'interact',
      title: 'Putting it back',
      text: r`
        The shear $S = ${mat(SHEAR)}$ has already leaned the F over. Whatever matrix you set acts
        **after** the shear. A grey copy stays behind to show where the shear left the F.

        **Set your matrix so that the F is back where it started**, on the dashed outline.
      `,
      widget: {
        type: 'matrix-grid', range: 4, pre: SHEAR, target: IDENTITY,
        alt: 'A grey letter F that a shear has leaned to the right, a dashed outline of the upright F, and a blue and an orange arrow that set a second matrix, applied after the shear.',
      },
      check: (s) => {
        if (s.match) return true;
        if (is(s, IDENTITY)) return 'Your matrix is the identity, so the F is exactly where the shear left it, on the grey shape. Lean it back the other way.';
        if (is(s, SHEAR)) return 'That shears the F a second time in the same direction. Lean it the other way instead.';
        if (s.flat) return 'Your matrix has squashed the F flat. Pull the two arrows apart again.';
        if (s.flipped) return 'Your matrix turns the F into a mirror image. Undoing a shear needs no flip.';
        return 'The shear slid the top of the F to the right. Your matrix has to slide the top back to the left and leave the blue arrow where it is.';
      },
      solution: { a: 1, b: -1, c: 0, d: 1 },
      explain: r`
        $$ ${cmat([[1, -1], [0, 1]])} $$

        It leans everything back by the same amount: the top slides one step to the left again,
        and the blue arrow stays where it is.
      `,
    },
    {
      id: 'no-undo',
      type: 'choice',
      title: 'No way back',
      text: r`
        This matrix has determinant 0, so it squashes the plane onto a line:
        $$ A = ${mat([[1, 2], [1, 2]])} $$

        Drag $\violet{\mathbf{v}}$ around and watch where it is sent. Try $${vec(2, 0)}$ and $${vec(0, 1)}.$

        **Could any matrix undo this move?**
      `,
      figure: probe({ matrix: [[1, 2], [1, 2]], x: [-6, 6], y: [-6, 6], v: { x: 1, y: 0 }, trace: true }),
      options: [
        { text: 'No: different arrows land on the same spot, and nothing can send that spot back to both', correct: true },
        { text: 'Yes: a matrix that stretches the line back out into the plane', why: r`A matrix sends each point to **one** point. The point $(2, 2)$ would have to go back to $(2, 0)$ and to $(0, 1)$ at once.` },
        { text: 'Yes: applying the same matrix a second time', why: 'A second go keeps everything on the same line. Nothing comes back.' },
      ],
      explain: r`
        $${vec(2, 0)}$ and $${vec(0, 1)}$ both land on $${vec(2, 2)}$. Once two arrows have been merged,
        no machine can tell them apart again. That is what a determinant of 0 does.
      `,
    },
    {
      id: 'formula',
      type: 'info',
      title: 'The inverse',
      text: r`
        A matrix that undoes $A$ is called the **inverse** of $A$, written $A^{-1}$. Doing one
        after the other changes nothing: $A^{-1}A = I$.

        :::key
        A matrix has an inverse exactly when its determinant is **not zero**.
        :::

        For a $\mathord{2 \times 2}$ matrix the inverse can be written down directly:

        $$ \begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix} $$

        **Swap** $a$ and $d$. **Change the signs** of $b$ and $c$. **Divide** everything by the
        determinant. With determinant 0 you would have to divide by zero: the formula breaks
        down exactly when there is no inverse.
      `,
    },
    {
      id: 'example-inverse',
      type: 'info',
      title: 'The formula at work',
      text: r`
        For the shear, the determinant is 1, and the formula gives $${mat([[1, -1], [0, 1]])}$: the
        matrix you found by hand. Now one where the dividing matters.

        :::example
        $$ A = ${mat(EX)} $$

        1. Determinant: $5 \times 1 - 2 \times 3 = -1$.
        2. Swap $a$ and $d$, change the signs of $b$ and $c$: $\;${mat([[1, -2], [-3, 5]])}$
        3. Divide every entry by $-1$, which flips every sign: $\;A^{-1} = ${mat(inverse(EX))}$

        Check with the first column of $A$: $\;A^{-1}${vec(5, 3)} = ${vec(1, 0)}$, as it must be.
        :::
      `,
    },
    {
      id: 'inverse',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const m = unitMatrix(rng);
        const [[a, b], [c, d]] = m;
        const D = det(m);
        const inv = inverse(m);
        return {
          text: r`**Find the inverse of** $$ A = ${mat(m)} $$`,
          template: matrixBlanks(inv, '$A^{-1}$'),
          hints: [
            r`First the determinant: $${num(a)} \times ${par(d)} - ${par(b)} \times ${par(c)}$.`,
            r`The determinant is $${num(D)}$. Now swap the two entries on the main diagonal and change the signs of the other two: $${mat([[d, -b], [-c, a]])}.$ ${D === 1 ? 'Dividing by 1 changes nothing.' : 'Then divide every entry by $-1$.'}`,
          ],
          explain: r`
            The determinant is $${num(a * d)} - ${par(b * c)} = ${num(D)}$. Swapping and changing signs gives $${mat([[d, -b], [-c, a]])}$${D === 1 ? ', and dividing by 1 leaves it as it is' : r`, and dividing by $-1$ flips every sign: $${mat(inv)}$`}.

            Check with the first column: $A^{-1}${vec(a, c)} = ${vec(1, 0)}$, as it must be.
          `,
        };
      },
    },
    {
      id: 'solve-drag',
      type: 'interact',
      title: 'Which arrow lands on the target?',
      text: r`
        A system of two equations is a matrix question in disguise. The system
        $$ \begin{aligned} 2x + y &= 5 \\ x + y &= 3 \end{aligned} $$
        says the same as
        $$ ${mat([[2, 1], [1, 1]])}\begin{pmatrix} x \\ y \end{pmatrix} = ${vec(5, 3)} $$
        Solving it means finding the arrow that the matrix sends to the star.

        **Drag $\violet{\mathbf{v}}$ until $\green{A\mathbf{v}}$ lands on the star.**
      `,
      widget: probe({ matrix: [[2, 1], [1, 1]], x: [-1, 7], y: [-1, 7], v: { x: 1, y: 0 }, target: { x: 5, y: 3 } }),
      check: (s) => s.hit || `Your arrow is sent to (${num(s.image.x)}, ${num(s.image.y)}). The star is at (5, 3).`,
      solution: { v: { x: 2, y: 1 } },
      hints: ['Each step of **v** to the right moves the green arrow 2 across and 1 up: the first column. Each step up moves it 1 across and 1 up: the second column.'],
      explain: r`
        $\mathbf{v} = ${vec(2, 1)}$: indeed $2 \times 2 + 1 = 5$ and $2 + 1 = 3$. So $x = 2$ and $y = 1$.

        In Algebra the solution of a system was the point where two lines cross. Here the
        same pair of numbers is the one arrow that the matrix sends to the target.
      `,
    },
    {
      id: 'example-solve',
      type: 'info',
      title: 'Solving by undoing',
      text: r`
        Dragging found the arrow. An inverse works it out: if $A$ sends the unknown arrow
        $\mathbf{v}$ to the target $\mathbf{t}$, then $A^{-1}$ sends the target back.

        :::example
        $$ \begin{aligned} 5x + 2y &= 9 \\ 3x + y &= 5 \end{aligned} $$

        1. Read off the matrix and the target: $\;A = ${mat(EX)}$, $\;\mathbf{t} = ${vec(9, 5)}$
        2. Find the inverse, as before: $\;A^{-1} = ${mat(inverse(EX))}$
        3. Apply it to the target: $\;A^{-1}\mathbf{t} = ${mat(inverse(EX))}${vec(9, 5)} = ${vec(1, 2)}$

        So $x = 1$ and $y = 2$. Check: $5 \times 1 + 2 \times 2 = 9$ and $3 \times 1 + 2 = 5$.
        :::
      `,
    },
    {
      id: 'solve-system',
      type: 'fill',
      stretch: true,
      gen: (rng) => {
        const m = unitMatrix(rng);
        const [[a, b], [c, d]] = m;
        const sol = { x: rng.nonzero(-3, 4), y: rng.nonzero(-3, 4) };
        const t = apply(m, sol);
        const inv = inverse(m);
        return {
          title: 'Solving by undoing',
          text: r`
            If $A$ sends the unknown arrow $\mathbf{v}$ to the target $\mathbf{t}$, then $A^{-1}$ sends the target back:
            $$ A\mathbf{v} = \mathbf{t} \quad\text{means}\quad \mathbf{v} = A^{-1}\mathbf{t} $$

            **Solve this system that way.**
            $$ \begin{aligned} ${row(a, b)} &= ${num(t.x)} \\ ${row(c, d)} &= ${num(t.y)} \end{aligned} $$
          `,
          template: r`$x =$ [[${sol.x}]] and $y =$ [[${sol.y}]]`,
          hints: [
            r`The matrix is $A = ${mat(m)}$ and the target is $\mathbf{t} = ${vec(t.x, t.y)}.$ Find $A^{-1}$ first.`,
            r`The determinant is $${num(det(m))}$, so $A^{-1} = ${mat(inv)}.$ Now work out $A^{-1}\mathbf{t}$.`,
          ],
          explain: r`
            Here $A = ${mat(m)}$ with determinant $${num(det(m))}$, so $A^{-1} = ${mat(inv)}.$ Then $A^{-1}\mathbf{t}$ is

            $$ ${mat(inv)}${vec(t.x, t.y)} = ${vec(sol.x, sol.y)} $$

            Check in the first equation: $${num(a)} \times ${par(sol.x)} + ${par(b)} \times ${par(sol.y)} = ${num(t.x)}$.
          `,
        };
      },
    },
    {
      id: 'parallel',
      type: 'choice',
      title: 'Parallel lines, seen again',
      text: r`
        In Algebra, a system whose two lines were parallel had no solution. Here is one:

        $$ \begin{aligned} x + 2y &= 4 \\ 2x + 4y &= 3 \end{aligned} \qquad A = ${mat([[1, 2], [2, 4]])} $$

        Drag $\violet{\mathbf{v}}$ and try to make $\green{A\mathbf{v}}$ reach the star.

        **Why is there no solution?**
      `,
      figure: probe({ matrix: [[1, 2], [2, 4]], x: [-6, 6], y: [-6, 6], v: { x: 1, y: 0 }, target: { x: 4, y: 3 }, trace: true }),
      options: [
        { text: 'The matrix squashes the plane onto a line, and the star is not on that line', correct: true },
        { text: 'The matrix sends every arrow to the origin', why: r`Not every arrow: $${vec(1, 0)}$ is sent to $${vec(1, 2)}$. Everything lands on one line, but not on one point.` },
        { text: 'The star could only be reached with fractions', why: r`Fractions would not help: every arrow at all lands on the line through $${vec(1, 2)}$, and the star is off that line.` },
      ],
      explain: r`
        $\det A = 1 \times 4 - 2 \times 2 = 0$. Every arrow lands on the line through $${vec(1, 2)}$,
        and the target $${vec(4, 3)}$ is not on it. So no arrow is sent there.

        Parallel lines in Algebra and a determinant of zero here are two pictures of the same fact.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      title: 'Can it be undone?',
      text: 'Work out each determinant, then **sort the matrices**.',
      buckets: ['Has an inverse', 'Has no inverse'],
      items: [
        { text: `$${mat([[2, 0], [0, 3]])}$`, bucket: 0, why: r`The determinant is $2 \times 3 - 0 \times 0 = 6$, which is not zero.` },
        { text: `$${mat([[1, 1], [1, 1]])}$`, bucket: 1, why: r`The determinant is $1 \times 1 - 1 \times 1 = 0$. Both columns are the same arrow.` },
        { text: `$${mat([[0, -1], [1, 0]])}$`, bucket: 0, why: r`The determinant is $0 \times 0 - (-1) \times 1 = 1$. A quarter turn is undone by a quarter turn the other way.` },
        { text: `$${mat([[2, 4], [1, 2]])}$`, bucket: 1, why: r`The determinant is $2 \times 2 - 4 \times 1 = 0$. The second column is twice the first.` },
        { text: `$${mat([[1, 2], [3, 4]])}$`, bucket: 0, why: r`The determinant is $1 \times 4 - 2 \times 3 = -2$. Negative is fine: it only has to be different from zero.` },
        { text: `$${mat([[3, 0], [0, 0]])}$`, bucket: 1, why: r`The determinant is $3 \times 0 - 0 \times 0 = 0$. The second column has no length at all.` },
      ],
      explain: 'A matrix can be undone exactly when its determinant is not zero. A determinant of zero means the two columns lie along one line, and the plane has been squashed flat.',
    },
  ],
  recap: [
    r`The determinant $ad - bc$ is the factor by which a matrix multiplies every area.`,
    'A negative determinant means shapes come out mirrored. A determinant of zero means the plane is squashed flat: onto a line, or even a point.',
    r`A matrix has an inverse exactly when its determinant is not zero: swap $a$ and $d$, change the signs of $b$ and $c$, divide by the determinant.`,
    r`Solving a system means finding the arrow that a matrix sends to a target: $\mathbf{v} = A^{-1}\mathbf{t}$.`,
  ],
  next: 'Next: the few special arrows that a matrix cannot knock off course.',
};
