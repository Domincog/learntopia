// Geometry: Shape & Space · Lesson 2 · The Triangle Secret
import { r } from '../../../kit.js';
import { deg, triangleFigure } from '../helpers.js';

const THREE_TRIANGLES = {
  type: 'svg', viewBox: '0 0 520 200', maxWidth: 520,
  alt: 'Three triangles: A is tall and thin, B is wide and flat, C is small with three equal sides.',
  content:
    '<g class="fill-blue-soft stroke-blue" stroke-width="3" stroke-linejoin="round">' +
    '<polygon points="40,160 96,160 68,18"/>' +
    '<polygon points="150,160 392,160 236,104"/>' +
    '<polygon points="432,160 492,160 462,108"/>' +
    '</g>' +
    '<text class="fig-label-lg" x="68" y="190" text-anchor="middle">A</text>' +
    '<text class="fig-label-lg" x="271" y="190" text-anchor="middle">B</text>' +
    '<text class="fig-label-lg" x="462" y="190" text-anchor="middle">C</text>',
};

const QUADRILATERAL = {
  type: 'geo', x: [0, 10], y: [0, 5.2], height: 270,
  alt: 'A four-sided shape with a dashed diagonal that splits it into two triangles.',
  points: {
    P: { x: 1.6, y: 0.9, hidden: true }, Q: { x: 8.6, y: 1.4, hidden: true },
    R: { x: 7.2, y: 4.5, hidden: true }, S: { x: 2.9, y: 3.9, hidden: true },
  },
  shapes: [
    { kind: 'polygon', pts: ['P', 'Q', 'R', 'S'], color: 'blue' },
    { kind: 'segment', pts: ['P', 'R'], color: 'orange', dashed: true },
  ],
};

// Angle sets for the "can this triangle exist?" sort.
const REAL = [
  [60, 60, 60], [90, 45, 45], [120, 30, 30], [100, 50, 30], [80, 70, 30],
  [35, 65, 80], [90, 60, 30], [20, 20, 140], [75, 75, 30], [1, 1, 178],
];
const IMPOSSIBLE = [
  [90, 90, 10], [100, 50, 40], [60, 60, 70], [80, 70, 20], [120, 40, 30],
  [90, 45, 35], [100, 90, 10], [70, 60, 40], [60, 50, 60], [110, 80, 10],
];

export default {
  id: 'triangle-sum',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three very different triangles',
      text: `
        Imagine measuring the three corner angles of each triangle and adding them up.

        **Which triangle gets the biggest total?**
      `,
      figure: THREE_TRIANGLES,
      shuffle: false,
      options: [
        { text: 'A, the tall thin one' },
        { text: 'B, the wide flat one' },
        { text: 'C, the small one' },
        { text: 'They all get the same total', correct: true },
      ],
      explain: `
        It is a three-way tie. Thin, flat, tiny or huge: the angles of every triangle
        add up to exactly the same number.

        Find out what that number is, then see why it can never change.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Try to break it',
      text: `
        **Drag the corners** to reshape the triangle. Each corner shows its angle,
        and the readout underneath adds the three together.

        Try to make that sum change. To finish, open one corner wider than 120°.
      `,
      widget: { type: 'corner-tear', tear: false, alt: 'A triangle with draggable corners A, B and C.' },
      check: (s) => {
        if (s.largest >= 120) return true;
        if (!s.moved) return 'Drag one of the coloured corners to reshape the triangle.';
        return `The widest corner is ${s.largest}° so far. Flatten the triangle until one corner passes 120°.`;
      },
      solution: { A: { x: 1, y: 1.5 }, B: { x: 9, y: 1.5 }, C: { x: 5, y: 3.4 } },
      explain: `
        You can open one angle as wide as you like, but the other two shrink to pay for it.
        The total never moves from **180°**.
      `,
    },
    {
      id: 'tear',
      type: 'interact',
      title: 'Tear off the corners',
      text: `
        Why 180°? Tear the corners off and put them side by side.

        **Drag the slider** to send the corners at A and B up to C.
        Then reshape the triangle and see if they still fit.
      `,
      widget: { type: 'corner-tear', alt: 'A triangle with draggable corners. A slider moves the corners at A and B up to C.' },
      check: (s) => s.joined || (s.t > 0
        ? 'Nearly. Push the slider all the way so the three corners meet at C.'
        : 'Drag the slider to move the corners at A and B up to C.'),
      solution: { t: 1 },
      explain: `
        Side by side, the three corners fill a **straight line** exactly: no gap, no overlap.
        And a straight line is 180°.

        It works for every shape you drag the triangle into.
      `,
    },
    {
      id: 'why',
      type: 'info',
      title: 'Why they always fit',
      text: `
        Each travelling corner made **half a turn** on its way up. After half a turn an edge
        points the opposite way, so it is still parallel to where it started.

        That puts the two edges that lay along AB on one straight line through C,
        **parallel to AB**, with corner C filling the space between.

        :::key
        The three angles of any triangle add up to **180°**.
        :::
      `,
      figure: {
        type: 'corner-tear', points: [[1.8, 1.4], [8.6, 1.4], [5.8, 5.2]], drag: false, tear: false, t: 1, readouts: false,
        alt: 'A triangle with all three corner pieces sitting together at the top corner, along a dashed straight line parallel to the base.',
      },
    },
    {
      id: 'example-missing',
      type: 'info',
      title: 'Two angles fix the third',
      text: r`
        Know two angles of a triangle and the third has no freedom left:
        it is whatever remains of 180°.

        :::example
        Two angles of this triangle are 25° and 100°. Take both from 180°.
        $$${deg(180)} - ${deg(25)} - ${deg(100)} = ${deg(55)}$$
        Check by adding all three: $${deg(25)} + ${deg(100)} + ${deg(55)} = ${deg(180)}$.
        :::

        A right angle counts as 90°, even when the picture shows only its small square.
      `,
      figure: triangleFigure({
        angles: [25, 100, 55], labels: ['25°', '100°', '?'], colors: ['orange', 'orange', 'green'], height: 250,
        alt: 'A triangle with angles of 25 and 100 degrees. The third angle is marked with a question mark.',
      }),
    },
    {
      id: 'missing',
      type: 'numeric',
      review: true,
      unit: '°',
      gen: (rng) => {
        const a = rng.int(30, 80);
        const b = rng.int(30, Math.min(80, 150 - a));
        const all = [a, b, 180 - a - b];
        const hide = rng.int(0, 2);
        const known = all.filter((_, i) => i !== hide);
        return {
          text: 'Two angles of this triangle are known. **Find the angle marked ?**',
          figure: triangleFigure({
            angles: all,
            labels: all.map((v, i) => (i === hide ? '?' : `${v}°`)),
            colors: all.map((_, i) => (i === hide ? 'green' : 'orange')),
            alt: `A triangle with angles of ${known[0]} and ${known[1]} degrees. The third angle is marked with a question mark.`,
          }),
          answer: all[hide],
          wrong: [
            [known[0] + known[1], 'That is the two known angles added together. The third angle is what is left of 180°.'],
            [360 - known[0] - known[1], 'The angles of a triangle total 180°, not 360°.'],
            [180 - known[0], 'You took away only one angle. Subtract both known angles from 180°.'],
            [180 - known[1], 'You took away only one angle. Subtract both known angles from 180°.'],
          ],
          hints: ['All three angles together make 180°.', r`Work out $${deg(180)} - ${deg(known[0])} - ${deg(known[1])}$.`],
          explain: r`The three angles total $${deg(180)}$, so the missing one is $${deg(180)} - ${deg(known[0])} - ${deg(known[1])} = ${deg(all[hide])}$.`,
        };
      },
    },
    {
      id: 'right-triangle',
      type: 'numeric',
      unit: '°',
      gen: (rng) => {
        const p = rng.intExcept(20, 70, [45]);
        const q = 90 - p;
        const showP = rng.bool();
        const known = showP ? p : q;
        const answer = 90 - known;
        return {
          text: 'This triangle has a right angle (the small square marks 90°). **Find the angle marked ?**',
          figure: triangleFigure({
            angles: [90, p, q],
            labels: ['right', showP ? `${p}°` : '?', showP ? '?' : `${q}°`],
            colors: ['orange', showP ? 'orange' : 'green', showP ? 'green' : 'orange'],
            alt: `A right-angled triangle. One of the other angles is ${known} degrees and the last is marked with a question mark.`,
          }),
          answer,
          wrong: [
            [180 - known, 'Do not forget the right angle: it uses up 90° of the 180°.'],
            [90 + known, 'The three angles total 180°. Subtract both the 90° and the known angle.'],
          ],
          hints: ['The right angle takes 90° of the total. How much is left for the other two?'],
          explain: r`The right angle uses $${deg(90)}$, which leaves $${deg(90)}$ for the other two angles to share: $${deg(90)} - ${deg(known)} = ${deg(answer)}$.`,
        };
      },
    },
    {
      id: 'teach-isosceles',
      type: 'info',
      title: 'Equal sides, equal angles',
      text: r`
        A triangle with two equal sides is called **isosceles**. The two angles that face
        the equal sides are equal too, so a single known angle is enough.

        :::example
        **Top angle known: 140°.** The two equal angles share what is left:
        $${deg(180)} - ${deg(140)} = ${deg(40)}$, so each is $${deg(40)} \div 2 = ${deg(20)}$.

        **Bottom angle known: 20°.** The other bottom angle is 20° as well, so the top is
        $${deg(180)} - ${deg(20)} - ${deg(20)} = ${deg(140)}$.
        :::
      `,
      figure: triangleFigure({
        angles: [20, 20, 140], labels: ['20°', '20°', '140°'], colors: ['green', 'green', 'orange'], sides: [null, '10 cm', '10 cm'], height: 250,
        alt: 'An isosceles triangle with two equal sides of 10 cm. The angle between the equal sides is 140 degrees and the two base angles are 20 degrees each.',
      }),
    },
    {
      id: 'isosceles',
      type: 'numeric',
      review: true,
      unit: '°',
      gen: (rng) => {
        const side = `${rng.int(4, 9)} cm`;
        if (rng.bool()) {
          const top = rng.int(10, 65) * 2; // even, so the base angles are whole numbers
          const base = (180 - top) / 2;
          return {
            text: r`
              Two sides of this triangle are equal, so the two angles at the bottom are equal too.

              **Find $x$.**
            `,
            figure: triangleFigure({
              angles: [base, base, top], labels: ['x', 'x', `${top}°`], colors: ['green', 'green', 'orange'], sides: [null, side, side],
              alt: `An isosceles triangle with two equal sides of ${side}. The angle between the equal sides is ${top} degrees and the two base angles are both marked x.`,
            }),
            prefix: '$x =$',
            answer: base,
            wrong: [
              [180 - top, r`That is what the two $x$ angles share. They are equal, so halve it.`],
              [top, 'Only the two bottom angles are equal. The top one is different.'],
            ],
            hints: [r`First find what is left of $${deg(180)}$ after the $${deg(top)}$ angle.`, r`The two $x$ angles share that amount equally.`],
            explain: r`The two equal angles share $${deg(180)} - ${deg(top)} = ${deg(180 - top)}$, so each is $${deg(180 - top)} \div 2 = ${deg(base)}$.`,
          };
        }
        const base = rng.intExcept(25, 80, [60]);
        const top = 180 - 2 * base;
        return {
          text: 'Two sides of this triangle are equal, so the two angles at the bottom are equal too. **Find the angle marked ?**',
          figure: triangleFigure({
            angles: [base, base, top], labels: [`${base}°`, null, '?'], colors: ['orange', 'orange', 'green'], sides: [null, side, side],
            alt: `An isosceles triangle with two equal sides of ${side}. One base angle is ${base} degrees. The angle between the equal sides is marked with a question mark.`,
          }),
          answer: top,
          wrong: [
            [180 - base, `There are **two** base angles of ${base}°, one at each end. Subtract both.`],
            [base, 'The equal angles are the two at the bottom, opposite the equal sides.'],
          ],
          hints: ['The unmarked bottom angle is the same size as the marked one.', r`Work out $${deg(180)} - ${deg(base)} - ${deg(base)}$.`],
          explain: r`Both base angles are $${deg(base)}$, so the top angle is $${deg(180)} - 2 \times ${deg(base)} = ${deg(top)}$.`,
        };
      },
    },
    {
      id: 'possible',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const item = (set, bucket) => {
          const total = set[0] + set[1] + set[2];
          let why;
          if (bucket === 1) why = set[0] === 90 && set[1] === 90
            ? 'Two right angles already use up the whole 180°, leaving nothing for a third corner.'
            : `Add them up: ${set[0]} + ${set[1]} + ${set[2]} = ${total}, not 180.`;
          else why = set[0] === 1
            ? '1 + 1 + 178 = 180, so it does exist: an extremely flat sliver of a triangle.'
            : `${set[0]} + ${set[1]} + ${set[2]} is exactly 180, so this triangle can be drawn.`;
          return { text: `${set[0]}°, ${set[1]}°, ${set[2]}°`, bucket, why };
        };
        const story = rng.pick([
          'Someone claims to have measured the angles of these six triangles.',
          'A drawing app lists the angles of six triangles, but some entries are typing mistakes.',
          'Six triangles are described only by their angles.',
        ]);
        return {
          text: `${story} **Which could be real, and which are impossible?**`,
          items: [...rng.sample(REAL, 3).map((set) => item(set, 0)), ...rng.sample(IMPOSSIBLE, 3).map((set) => item(set, 1))],
        };
      },
      buckets: ['Could be real', 'Impossible'],
      explain: 'Add the three angles. Exactly 180° is the only total a triangle can have: no more and no less.',
    },
    {
      id: 'special',
      type: 'fill',
      title: 'Two famous triangles',
      text: 'The 180° rule pins some triangles down completely.',
      template: `
        An **equilateral** triangle has three equal sides, and so three equal angles: each one is [[60]]°.

        A right-angled triangle with two equal sides has angles of 90°, [[45]]° and [[45]]°.
      `,
      hints: ['Equilateral: share 180° equally among three angles.', 'Right-angled with two equal sides: the right angle takes 90°, and the other two share the rest equally.'],
      explain: r`$${deg(180)} \div 3 = ${deg(60)}$. And once the right angle has taken $${deg(90)}$, the two equal angles share the other $${deg(90)}$: $${deg(45)}$ each.`,
    },
    {
      id: 'quadrilateral',
      type: 'numeric',
      title: 'Four corners',
      text: `
        Any four-sided shape can be cut into **two triangles** by a diagonal.

        So what do the four angles of a four-sided shape add up to?
      `,
      figure: QUADRILATERAL,
      answer: 360,
      unit: '°',
      wrong: [
        [180, 'That is one triangle. The diagonal makes two.'],
        [720, 'Two triangles, each worth 180°.'],
        [90, 'Think about the total for one triangle, then count the triangles.'],
      ],
      hints: ['Each triangle contributes 180°, and together their angles make up the four corners.'],
      explain: r`
        The two triangles' angles together make up exactly the four corners: $${deg(180)} + ${deg(180)} = ${deg(360)}$.

        A square agrees: four right angles, $4 \times ${deg(90)} = ${deg(360)}$.
      `,
    },
    {
      id: 'exterior',
      type: 'numeric',
      stretch: true,
      unit: '°',
      gen: (rng) => {
        const a = rng.int(35, 75);
        const b = rng.int(35, Math.min(75, 145 - a));
        const c = 180 - a - b;
        return {
          text: `
            Side BC has been extended past C to a point D, so B, C and D lie on one straight line.
            Remember: angles on a straight line add up to 180°.

            **Find the outside angle marked ?**
          `,
          figure: triangleFigure({
            angles: [a, b, c], labels: [`${a}°`, `${b}°`, null], letters: true, extend: 1.6, outside: '?',
            alt: `Triangle ABC with angle A equal to ${a} degrees and angle B equal to ${b} degrees. Side BC continues past C to D, and the angle between CA and CD is marked with a question mark.`,
          }),
          answer: a + b,
          wrong: [
            [c, 'That is the angle *inside* the triangle at C. The ? is its neighbour on the straight line BCD.'],
            [180 - a, 'Use both known angles to find the inside angle at C first.'],
            [180 - b, 'Use both known angles to find the inside angle at C first.'],
          ],
          hints: [
            'First find the angle inside the triangle at C.',
            'That inside angle and the ? sit side by side on the straight line BCD.',
          ],
          explain: r`
            Inside angle at C: $${deg(180)} - ${deg(a)} - ${deg(b)} = ${deg(c)}$.
            On the straight line BCD: $${deg(180)} - ${deg(c)} = ${deg(a + b)}$.

            Notice that $${deg(a + b)} = ${deg(a)} + ${deg(b)}$. An outside angle of a triangle always equals the two far inside angles added together.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        An angle bigger than 90° is called **obtuse**.

        In your own words: why can a triangle never have two obtuse angles?
      `,
      model: `
        Two angles that are each bigger than 90° already add up to more than 180°.
        But all *three* angles of a triangle total exactly 180°, so there would be less than nothing left for the third corner.

        The same argument rules out two right angles. A triangle has room for at most one angle of 90° or more.
      `,
    },
  ],
  recap: [
    'The three angles of **any** triangle add up to 180°.',
    'Torn off and put together, the corners fill a straight line.',
    'Know two angles and the third is forced: subtract from 180°.',
    'Equal sides face equal angles; an equilateral triangle is 60°, 60°, 60°.',
  ],
  next: 'Next: find areas with nothing but scissors and a rectangle.',
};
