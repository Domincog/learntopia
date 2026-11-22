// Linear Algebra: Vectors & Matrices · Lesson 2 · How Much Do They Agree?
import { r, num, round } from '../../../kit.js';
import { vec, col, par, dot } from '../helpers.js';

const U = r`\blue{\mathbf{u}}`;
const V = r`\orange{\mathbf{v}}`;
const Uw = `$${U}$`;
const Vw = `$${V}$`;

/** u · v written out: "3 × (-1) + 1 × 3". */
const working = (u, v) => r`${num(u.x)} \times ${par(v.x)} + ${par(u.y)} \times ${par(v.y)}`;
const signWord = (d) => (d > 0 ? 'positive' : d < 0 ? 'negative' : 'zero');
const KINDS = ['Less than 90°', 'Exactly 90°', 'More than 90°'];
const kindOf = (d) => (d > 0 ? 0 : d === 0 ? 1 : 2);

export default {
  id: 'dot-product',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A strange recipe',
      text: r`
        A recipe that turns two vectors into **one number**: multiply the top numbers, multiply
        the bottom numbers, and add the two results.

        For the [blue]{.blue} and [orange]{.orange} arrows in the picture it gives
        $$ \blue{3} \times \orange{(-2)} + \blue{1} \times \orange{6} = 0 $$

        **What do you think? Two arrows whose recipe gives 0 are always…**
      `,
      figure: {
        type: 'vector-plane', x: [-7, 7], y: [-7, 7], static: true, line: false,
        vectors: [{ id: 'u', x: 3, y: 1, color: 'blue' }, { id: 'v', x: -2, y: 6, color: 'orange' }],
        alt: 'Two arrows from the origin: a blue one 3 across and 1 up, and an orange one 2 to the left and 6 up.',
      },
      options: [
        { text: 'at right angles', correct: true },
        { text: 'equally long' },
        { text: 'exact opposites' },
        { text: 'nothing special' },
      ],
      explain: `
        They are at right angles, and it is no coincidence.

        The recipe is called the **dot product**. The number it gives measures how much two
        arrows agree about direction, and this lesson is about learning to read it.
      `,
    },
    {
      id: 'teach-dot',
      type: 'info',
      title: 'The dot product',
      text: r`
        The recipe is the **dot product** of two vectors, written with a dot between them.
        Multiply top by top, bottom by bottom, and add:

        $$ \begin{pmatrix} a \\ b \end{pmatrix} \cdot \begin{pmatrix} c \\ d \end{pmatrix} = ac + bd $$

        The answer is a single **number**, not a vector.

        :::example
        $$ \begin{aligned} ${vec(7, -2)} \cdot ${vec(3, 4)} &= 7 \times 3 + (-2) \times 4 \\[4pt] &= 21 - 8 = 13 \end{aligned} $$
        :::

        The order makes no difference: $\mathbf{u} \cdot \mathbf{v}$ and $\mathbf{v} \cdot \mathbf{u}$
        multiply the same pairs of numbers.
      `,
    },
    {
      id: 'compute',
      type: 'fill',
      title: 'Try the recipe',
      text: r`
        **Work out this dot product**, one piece at a time.
        $$ ${vec(2, 3)} \cdot ${vec(4, -1)} $$
      `,
      template: r`
        Top times top: [[8]]

        Bottom times bottom: [[-3]]

        The dot product: [[5]]
      `,
      hints: [r`The tops are 2 and 4. The bottoms are 3 and $-1$.`],
      explain: r`$2 \times 4 = 8$ and $3 \times (-1) = -3$, and together $8 + (-3) = 5$.`,
    },
    {
      id: 'find-zero',
      type: 'interact',
      title: 'Hunt for zero',
      text: r`
        The arrow ${Uw} is fixed. Drag the tip of ${Vw} around and watch the dot product change.

        **Find a ${Vw}, not the zero vector, for which $\;${U} \cdot ${V} = 0$.**
      `,
      widget: {
        type: 'vector-plane', x: [-6, 6], y: [-6, 6],
        vectors: [{ id: 'u', x: 4, y: 2, color: 'blue' }, { id: 'v', x: 2, y: 3, color: 'orange', drag: true }],
        pair: ['u', 'v'], show: ['dot', 'angle'], line: 'dot',
        alt: 'A fixed blue arrow u, 4 across and 2 up, and an orange arrow v whose tip can be dragged. The dot product and the angle between them are shown.',
      },
      check: (s) => {
        if (s.v.x === 0 && s.v.y === 0) return 'That is the zero vector. An arrow with no length has no direction: pull it away from the origin.';
        if (s.dot === 0) return true;
        return s.dot > 0
          ? `The dot product is ${num(s.dot)}: still positive. Swing **v** further away from **u**.`
          : `The dot product is ${num(s.dot)}: negative now. You have swung past the spot, so come back towards **u**.`;
      },
      solution: { v: { x: -1, y: 2 } },
      hints: ['Start with **v** on top of **u**, then swing it away slowly. The number shrinks. Where does it reach zero?'],
      explain: r`
        Every answer, such as $${vec(-1, 2)}$ or $${vec(2, -4)}$, is at a **right angle** to ${Uw}:
        $$ 4 \times (-1) + 2 \times 2 = 0 $$

        A dot product of zero means the two arrows are **perpendicular**.
      `,
    },
    {
      id: 'swing',
      type: 'interact',
      title: 'All the way round',
      text: r`
        Now ${Vw} keeps its length, 3, and can only turn. ${Uw} is 4 long and stays put.

        **Turn ${Vw} to where the dot product is as large as it can be.** Go right round first and
        watch the number.
      `,
      widget: {
        type: 'vector-plane', x: [-5, 5], y: [-5, 5],
        vectors: [{ id: 'u', x: 4, y: 0, color: 'blue' }, { id: 'v', x: 0, y: 3, color: 'orange', drag: true, circle: 3, snapDeg: 15 }],
        pair: ['u', 'v'], show: ['dot', 'angle'], line: false,
        alt: 'A fixed blue arrow u pointing 4 to the right, and an orange arrow v of length 3 that can be turned about the origin. The dot product and the angle between them are shown.',
      },
      check: (s) => {
        if (s.angle === 0) return true;
        if (s.angle === 180) return 'That is the most **negative** the number gets: the arrows point in opposite directions. Now find the largest value.';
        if (s.dot === 0) return 'At a right angle the dot product is exactly 0. Turn **v** towards **u**.';
        return s.dot > 0
          ? `The dot product is ${num(round(s.dot, 2))}. It can still grow: turn **v** closer to **u**.`
          : `The dot product is ${num(round(s.dot, 2))}, which is negative: **v** is leaning against **u**. Turn it round towards **u**.`;
      },
      solution: { v: { x: 3, y: 0 } },
      explain: r`
        The dot product is largest, $4 \times 3 = 12$, when the arrows point the **same way**.
        It falls to 0 at a right angle, and reaches its most negative value, $-12$, when they point
        in **opposite** directions.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'A measure of agreement',
      text: r`
        The dot product compares directions.

        | The two arrows | Angle | $\mathbf{u} \cdot \mathbf{v}$ |
        |---|---|---|
        | lean the same way | under 90° | positive |
        | are perpendicular | 90° | zero |
        | lean against each other | over 90° | negative |

        :::key
        $\mathbf{u} \cdot \mathbf{v}$ is one number that says how much two arrows agree.
        :::

        :::example
        For the arrows in the picture: $\;7 \times (-2) + 1 \times 6 = -8$. That is negative, so
        the angle between them is more than 90°. No measuring needed.
        :::
      `,
      figure: {
        type: 'vector-plane', x: [-4, 8], y: [-3, 9], static: true, line: false,
        vectors: [{ id: 'u', x: 7, y: 1, color: 'blue' }, { id: 'v', x: -2, y: 6, color: 'orange' }],
        pair: ['u', 'v'], show: ['dot', 'angle'],
        alt: 'A blue arrow u, 7 across and 1 up, and an orange arrow v, 2 to the left and 6 up. The angle between them is a little more than a right angle, and their dot product is minus 8.',
      },
    },
    {
      id: 'angle-kind',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const want = rng.int(0, 2);
        let u;
        let v;
        if (want === 1) {
          const p = rng.nonzero(-4, 4);
          const q = rng.intExcept(-4, 4, [0]);
          const m = rng.pick([-2, -1, 1, 2]);
          u = { x: p, y: q };
          v = { x: -q * m, y: p * m };
        } else {
          do {
            u = { x: rng.nonzero(-5, 5), y: rng.nonzero(-5, 5) };
            v = { x: rng.nonzero(-5, 5), y: rng.nonzero(-5, 5) };
          } while (kindOf(dot(u, v)) !== want);
        }
        const d = dot(u, v);
        const means = ['a positive dot product means less than 90°', 'a dot product of zero means exactly 90°', 'a negative dot product means more than 90°'][want];
        return {
          text: r`
            No drawing needed: let the dot product decide.

            **What kind of angle is there between** $\;${vec(u.x, u.y)}\;$ **and** $\;${vec(v.x, v.y)}\,$**?**
          `,
          shuffle: false,
          options: KINDS.map((text, i) => (i === want
            ? { text, correct: true }
            : { text, why: `The dot product is ${num(d)}, and ${means}.` })),
          hints: ['Multiply top by top and bottom by bottom, then add. Only the sign of the answer matters here.'],
          explain: r`$${working(u, v)} = ${num(d)}$, which is ${signWord(d)}. So the angle is ${KINDS[want].toLowerCase()}.`,
        };
      },
    },
    {
      id: 'shadow',
      type: 'interact',
      title: 'The shadow',
      text: r`
        Here is what the number measures. Imagine light falling straight onto the line of ${Uw}.
        Then ${Vw} casts a [shadow]{.violet} on that line, and

        $$ ${U} \cdot ${V} = \text{length of } ${U} \times \text{shadow} $$

        (A shadow that points backwards counts as negative.)

        **Find a ${Vw}, other than ${Uw} itself, whose shadow is exactly as long as ${Uw}.**
      `,
      widget: {
        type: 'vector-plane', x: [-6, 6], y: [-6, 6],
        vectors: [{ id: 'u', x: 4, y: 2, color: 'blue' }, { id: 'v', x: 1, y: 3, color: 'orange', drag: true }],
        pair: ['u', 'v'], show: ['len0', 'shadow', 'dot'], shadow: true, line: false,
        alt: 'A fixed blue arrow u, 4 across and 2 up, and an orange arrow v that can be dragged. A violet bar on the line of u shows the shadow of v.',
      },
      check: (s) => {
        if (s.v.x === 4 && s.v.y === 2) return 'That is **u** itself. Find a different arrow that casts the same shadow.';
        if (s.dot === 20) return true;
        if (s.v.x === 0 && s.v.y === 0) return 'The zero vector casts no shadow at all. Pull it away from the origin.';
        if (s.dot === 0) return '**v** is at a right angle to **u**, so it casts no shadow on that line. Lean it towards **u**.';
        if (s.dot < 0) return 'The shadow points backwards, away from **u**. Bring **v** round to the side that **u** is on.';
        return s.dot < 20
          ? `The shadow is ${num(round(s.shadow, 2))} long and **u** is 4.47 long. Make the shadow longer.`
          : `The shadow is ${num(round(s.shadow, 2))} long and **u** is 4.47 long. Make the shadow shorter.`;
      },
      solution: { v: { x: 3, y: 4 } },
      hints: ['The dashed line from the tip of **v** drops straight onto the line of **u**. It has to land on the tip of **u**.'],
      explain: r`
        $${vec(3, 4)}$, $${vec(5, 0)}$, $${vec(6, -2)}$ and $${vec(2, 6)}$ all work. They sit on one line at right
        angles to ${Uw}, so they all cast the same shadow, and each has $\;${U} \cdot ${V} = 20$.

        Only the part of ${Vw} that runs **along** ${Uw} counts. The part that runs across it adds nothing.
      `,
    },
    {
      id: 'cosine',
      type: 'info',
      title: 'The same thing with an angle in it',
      text: r`
        How long is the shadow? That depends on the length of $\mathbf{v}$ and on the angle $\theta$
        between the arrows:

        $$ \text{shadow} = |\mathbf{v}| \cos\theta $$

        $\cos\theta$, the **cosine** of the angle, is a number between $-1$ and 1 that depends only on
        the angle. Turn the arrow and watch it: 1 when the arrows point the same way, 0 at a right
        angle, $-1$ when they are opposite.

        :::key
        $$ \mathbf{u} \cdot \mathbf{v} = |\mathbf{u}|\,|\mathbf{v}| \cos\theta $$
        :::

        That the recipe and the shadow always give the same number is taken on trust here. You
        will not need to work out a cosine yourself: the figure reads it out.
      `,
      figure: {
        type: 'vector-plane', x: [-5, 5], y: [-5, 5],
        vectors: [{ id: 'u', x: 4, y: 0, color: 'blue' }, { id: 'v', x: 1.5, y: 2.598076211, color: 'orange', drag: true, circle: 3, snapDeg: 15 }],
        pair: ['u', 'v'], show: ['angle', 'cos', 'dot'], shadow: true, line: false,
        alt: 'A fixed blue arrow u of length 4 and an orange arrow v of length 3 that can be turned. The angle, its cosine and the dot product are shown, with the shadow of v on the line of u.',
      },
    },
    {
      id: 'dot-compute',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const u = { x: rng.nonzero(-6, 6), y: rng.nonzero(-6, 6) };
        const v = { x: rng.nonzero(-6, 6), y: rng.intExcept(-6, 6, [0]) };
        const d = dot(u, v);
        return {
          text: r`**Work out the dot product.** $$ ${vec(u.x, u.y)} \cdot ${vec(v.x, v.y)} $$`,
          answer: d,
          wrong: [
            [u.x * v.y + u.y * v.x, r`That is $${num(u.x)} \times ${par(v.y)} + ${par(u.y)} \times ${par(v.x)}$: each top number times the *other* vector's bottom number. Pair top with top and bottom with bottom.`],
            [u.x + u.y + v.x + v.y, 'That is all four numbers added up. Multiply top by top and bottom by bottom first, then add the two products.'],
            [u.x * v.x - u.y * v.y, r`That is $${num(u.x * v.x)} - ${par(u.y * v.y)}$. The two products are **added**, not subtracted.`],
          ],
          hints: [r`Top times top is $${num(u.x)} \times ${par(v.x)}$. Bottom times bottom is $${num(u.y)} \times ${par(v.y)}$.`],
          explain: r`$${working(u, v)} = ${num(u.x * v.x)} + ${par(u.y * v.y)} = ${num(d)}$. It is ${signWord(d)}, so the angle between the arrows is ${KINDS[kindOf(d)].toLowerCase()}.`,
        };
      },
    },
    {
      id: 'example-perpendicular',
      type: 'info',
      title: 'A missing number',
      text: r`
        Perpendicular means a dot product of 0. So "make these two arrows perpendicular" is
        an equation in disguise.

        :::example
        Which number $t$ makes $${vec(6, 4)}$ and $${vec(2, 't')}$ perpendicular?

        1. The dot product must be 0: $\;6 \times 2 + 4 \times t = 0$.
        2. The first product is 12, so $4 \times t$ has to be $-12$.
        3. That makes $t = -3$.

        Check: $6 \times 2 + 4 \times (-3) = 12 - 12 = 0$.
        :::
      `,
      figure: {
        type: 'vector-plane', x: [-2, 8], y: [-5, 5], static: true, line: false,
        vectors: [{ id: 'u', x: 6, y: 4, color: 'blue' }, { id: 'v', x: 2, y: -3, color: 'orange' }],
        pair: ['u', 'v'], show: ['dot', 'angle'],
        alt: 'A blue arrow u, 6 across and 4 up, and an orange arrow v, 2 across and 3 down. They meet at a right angle, and their dot product is 0.',
      },
    },
    {
      id: 'make-perpendicular',
      type: 'numeric',
      gen: (rng) => {
        const p = rng.nonzero(-4, 4);
        const q = rng.pick([-3, -2, -1, 1, 2, 3]);
        const m = rng.pick([-2, -1, 1, 2]);
        const c = q * m;
        const t = -p * m;
        return {
          title: 'Made to measure',
          text: r`
            **Which number $t$ makes these two vectors perpendicular?**
            $$ ${vec(p, q)} \quad\text{and}\quad ${vec(c, 't')} $$
          `,
          answer: t,
          prefix: '$t =$',
          wrong: [
            [-t, r`With $t = ${num(-t)}$ the dot product is $${num(p * c)} + ${par(-q * t)} = ${num(p * c - q * t)}$, not 0. The second product has to cancel the first.`],
          ],
          hints: [
            r`Perpendicular means the dot product is 0: $\;${num(p)} \times ${par(c)} + ${par(q)} \times t = 0$.`,
            r`The first product is $${num(p * c)}$, so $${par(q)} \times t$ has to be $${num(-p * c)}$.`,
          ],
          explain: r`The dot product must be 0: $\;${num(p)} \times ${par(c)} + ${par(q)} \times t = 0$. The first product is $${num(p * c)}$, so $${par(q)} \times t$ must be $${num(-p * c)}$, which makes $t = ${num(t)}$.`,
        };
      },
    },
    {
      id: 'taste',
      type: 'interact',
      title: 'Arrows of taste',
      text: `
        A film site asks everyone to rate two kinds of film from −3 (cannot stand) to 3 (love):
        **action** across, **romance** up. Each person's taste is then a vector.

        [Ana]{.blue} loves action and quite likes romance. [Ben]{.orange} loves romance and dislikes action.

        **Drag your own arrow to a taste that agrees with Ana (positive dot product) but disagrees with Ben (negative).**
      `,
      widget: {
        type: 'vector-plane', x: [-3.6, 3.6], y: [-3.6, 3.6], xLabel: 'action', yLabel: 'romance',
        vectors: [
          { id: 'A', x: 3, y: 1, color: 'blue', label: 'Ana' },
          { id: 'B', x: -1, y: 3, color: 'orange', label: 'Ben' },
          { id: 'Y', x: -1, y: -2, color: 'green', label: 'you', drag: true },
        ],
        dots: [['Y', 'A'], ['Y', 'B']], line: false,
        alt: 'Three arrows of taste on axes for action and romance. Ana is 3 across and 1 up. Ben is 1 to the left and 3 up. Your own arrow can be dragged, and its dot products with Ana and with Ben are shown.',
      },
      check: (s) => {
        const a = dot(s.Y, s.A);
        const b = dot(s.Y, s.B);
        if (s.Y.x === 0 && s.Y.y === 0) return 'An arrow of no length is a person with no opinions. Give yourself some taste.';
        if (a > 0 && b < 0) return true;
        if (a > 0) return `You agree with Ana. But your dot product with Ben is ${num(b)}, which is not negative. Ben loves romance and dislikes action: move away from that.`;
        if (b < 0) return `You disagree with Ben. But your dot product with Ana is ${num(a)}, which is not positive. Ana loves action: move to the right.`;
        return `With Ana you score ${num(a)} and with Ben ${num(b)}. You need a positive number with Ana and a negative one with Ben.`;
      },
      solution: { Y: { x: 2, y: -1 } },
      explain: r`
        For example $${vec(2, -1)}$: with Ana that gives $3 \times 2 + 1 \times (-1) = 5$, and with Ben
        $(-1) \times 2 + 3 \times (-1) = -5$.

        Many sites that recommend films, songs or products work like this. They describe every
        person and every item by a vector, with far more than two numbers, and use dot products
        to predict who will like what.
      `,
    },
    {
      id: 'teach-similarity',
      type: 'info',
      title: 'Loud and quiet raters',
      text: r`
        Some people rate everything strongly, others mildly. To compare the **direction** of two
        tastes and ignore how loud they are, divide the dot product by both lengths. What is left
        is the cosine from before:

        $$ \cos\theta = \frac{\mathbf{u} \cdot \mathbf{v}}{|\mathbf{u}|\,|\mathbf{v}|} $$

        It is called the **cosine similarity**: 1 when two arrows point the same way, 0 at a
        right angle, $-1$ when they point opposite ways.

        Drag your arrow along one direction, in and out. The dot product changes. The
        similarity does not.
      `,
      figure: {
        type: 'vector-plane', x: [-3.6, 3.6], y: [-3.6, 3.6], xLabel: 'action', yLabel: 'romance',
        vectors: [
          { id: 'A', x: 3, y: 1, color: 'blue', label: 'Ana' },
          { id: 'Y', x: 1, y: 1, color: 'green', label: 'you', drag: true },
        ],
        pair: ['A', 'Y'], show: ['dot', 'cos'], cosLabel: 'similarity', line: false,
        alt: 'Two arrows of taste on axes for action and romance. Ana is 3 across and 1 up. Your own arrow can be dragged. The dot product of the two arrows and their cosine similarity are shown.',
      },
    },
    {
      id: 'direction-only',
      type: 'choice',
      title: 'Same direction?',
      text: r`
        The cosine similarity of two tastes is their dot product divided by both lengths. It
        measures direction only.

        Ana's taste is $${vec(3, 1)}.$

        **Whose taste has cosine similarity exactly 1 with Ana's?**
      `,
      options: [
        { text: r`Cy: $${vec(6, 2)}$`, correct: true },
        { text: r`Dee: $${vec(1, 3)}$`, why: r`The same two numbers, but in the other places. That arrow points in a different direction, so the cosine is less than 1.` },
        { text: r`Eli: $${vec(-3, -1)}$`, why: r`That arrow points exactly the opposite way. Its cosine similarity with Ana is $-1$.` },
        { text: r`Flo: $${vec(-1, 3)}$`, why: r`$3 \times (-1) + 1 \times 3 = 0$: that arrow is at a right angle to Ana's, so the cosine is 0.` },
      ],
      hints: ['The cosine is 1 only when the angle is zero: the two arrows point the same way.'],
      explain: r`
        Cy's arrow is Ana's doubled: the same direction, so the angle is 0 and the cosine is 1.
        Cy just rates everything twice as strongly.

        Language models store each word as a vector with hundreds or thousands of numbers, and compare words
        in this way. Words used in similar ways get arrows that point in similar directions.
      `,
    },
    {
      id: 'most-similar',
      type: 'choice',
      stretch: true,
      gen: (rng) => {
        const names = ['Noor', 'Otto', 'Pia'];
        const rate = () => [rng.int(-2, 2), rng.int(-2, 2), rng.int(-2, 2)];
        const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
        let mia;
        let others;
        let scores;
        let best;
        do {
          mia = rate();
          others = names.map(rate);
          scores = others.map((o) => dot3(mia, o));
          best = Math.max(...scores);
        } while (mia.filter((v) => v !== 0).length < 2 || scores.filter((v) => v === best).length !== 1 || best <= 0
          || others.some((o) => o.every((v) => v === 0)));
        const winner = scores.indexOf(best);
        const row = (name, vals) => `| ${name} | ${vals.map((v) => `$${num(v)}$`).join(' | ')} |`;
        const sum = (o) => r`${mia.map((v, i) => `${par(v)} \\times ${par(o[i])}`).join(' + ')}`;
        return {
          title: 'Three numbers each',
          text: r`
            Nothing changes with longer vectors: multiply matching entries and add. The lists
            $3, -1, 2$ and $1, 3, 3$ give $\;3 \times 1 + (-1) \times 3 + 2 \times 3 = 6$.

            Here four people have rated **three** films from $-2$ to 2.

            | | Film 1 | Film 2 | Film 3 |
            |---|:--:|:--:|:--:|
            ${row('**Mia**', mia)}
            ${names.map((n, i) => row(n, others[i])).join('\n            ')}

            **Whose taste has the largest dot product with Mia's?**
          `,
          shuffle: false,
          options: names.map((n, i) => (i === winner
            ? { text: n, correct: true }
            : { text: n, why: `${n} scores ${num(scores[i])} with Mia. ${names[winner]} scores ${num(best)}, which is higher.` })),
          hints: [r`For ${names[0]}: $${sum(others[0])}$. Do the same for the other two.`],
          explain: r`
            Mia with ${names[0]}: $${num(scores[0])}$. With ${names[1]}: $${num(scores[1])}$. With ${names[2]}: $${num(scores[2])}$.
            The largest is ${names[winner]}'s: $${sum(others[winner])} = ${num(best)}$.

            A vector with three numbers is $${col(mia[0], mia[1], mia[2])}$, an arrow in space. With
            a hundred numbers nobody can draw the arrow, but the dot product works just the same.
          `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true** of the dot product?',
      options: [
        { text: 'If two vectors are perpendicular, their dot product is 0', correct: true },
        { text: 'The dot product of two vectors is a single number, not a vector', correct: true },
        { text: 'A negative dot product means the angle between the arrows is more than 90°', correct: true },
        { text: 'The dot product is largest when the two arrows are perpendicular', why: 'At a right angle it is exactly 0. For arrows of fixed length it is largest when they point the same way.' },
        { text: r`$\mathbf{u} \cdot \mathbf{v}$ and $\mathbf{v} \cdot \mathbf{u}$ can be different numbers`, why: r`$ac + bd$ and $ca + db$ are always equal, so the order never matters.` },
      ],
      explain: 'The dot product is one number that measures agreement: positive when two arrows lean the same way, zero when they are perpendicular, negative when they lean against each other.',
    },
  ],
  recap: [
    r`The dot product multiplies matching entries and adds: $\begin{pmatrix} a \\ b \end{pmatrix} \cdot \begin{pmatrix} c \\ d \end{pmatrix} = ac + bd$. The result is a number.`,
    'Positive: the arrows lean the same way. Zero: they are perpendicular. Negative: they lean against each other.',
    r`It equals the length of one arrow times the shadow of the other on it: $\mathbf{u} \cdot \mathbf{v} = |\mathbf{u}|\,|\mathbf{v}| \cos\theta$.`,
    'With longer vectors it measures how similar two lists of numbers are: two tastes, or two words.',
  ],
  next: 'Next: a grid of four numbers that moves every point of the plane at once.',
};
