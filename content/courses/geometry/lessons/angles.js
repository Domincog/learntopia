// Geometry: Shape & Space · Lesson 1 · Angles Everywhere
import { r, near, angleDeg, dist } from '../../../kit.js';
import { pol, deg, onArc, raysFigure, crossFigure, parallelsFigure } from '../helpers.js';

// Fixed points of the two "swing a ray" explorations (maths units).
const LINE_O = { x: 5, y: 1.1 };
const LINE_B = { x: 9.2, y: 1.1 };
const CROSS_O = { x: 5, y: 2.6 };
const CROSS_B = { x: 8.6, y: 2.6 };
// The "slide a parallel line" exploration.
const SLIDE_X = { x: 3.4, y: 1.3 };

const CORNER_NAMES = { UR: 'upper right', UL: 'upper left', LL: 'lower left', LR: 'lower right' };

// Quarter turn, half turn, full turn: the three landmark angles (a static picture).
const TURNS = {
  type: 'svg', viewBox: '0 0 480 178', maxWidth: 560,
  alt: 'Three turns drawn as a blue arm swinging away from a black one. A quarter turn is labelled 90 degrees and has a small square in its corner. A half turn is labelled 180 degrees: the two arms make a straight line. A full turn is labelled 360 degrees: the arm comes all the way round.',
  content:
    // arcs that show the turning
    '<g class="stroke-orange fill-none" stroke-width="3" stroke-linecap="round">' +
    '<path d="M112 100 A32 32 0 0 0 80 68"/>' +
    '<path d="M272 100 A32 32 0 0 0 208 100"/>' +
    '<path d="M432 100 A32 32 0 1 0 430.1 111"/>' +
    '</g>' +
    '<g class="fill-orange">' +
    '<polygon points="82,61 82,75 71,68"/>' +
    '<polygon points="201,98 215,98 208,109"/>' +
    '<polygon points="436.7,112.2 423.5,109.8 431.8,101.2"/>' +
    '</g>' +
    // the arm that stays put, and the arm that has turned
    '<g class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round">' +
    '<path d="M80 100 H146"/><path d="M240 100 H306"/><path d="M400 100 H466"/>' +
    '<path stroke-width="2" d="M92 100 v-12 h-12"/>' +
    '</g>' +
    '<g class="stroke-blue fill-none" stroke-width="4" stroke-linecap="round">' +
    '<path d="M80 100 V34"/><path d="M240 100 H174"/><path d="M400 96 H466"/>' +
    '</g>' +
    '<g class="fill-ink"><circle cx="80" cy="100" r="4.5"/><circle cx="240" cy="100" r="4.5"/><circle cx="400" cy="100" r="4.5"/></g>' +
    '<text class="fig-label-lg" x="100" y="146" text-anchor="middle">90°</text>' +
    '<text class="fig-label-lg" x="240" y="146" text-anchor="middle">180°</text>' +
    '<text class="fig-label-lg" x="416" y="146" text-anchor="middle">360°</text>' +
    '<text class="fig-label-sm" x="100" y="170" text-anchor="middle">quarter turn</text>' +
    '<text class="fig-label-sm" x="240" y="170" text-anchor="middle">half turn</text>' +
    '<text class="fig-label-sm" x="416" y="170" text-anchor="middle">full turn</text>',
};

export default {
  id: 'angles',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'One measurement, four angles',
      text: `
        Two straight roads cross. A surveyor measures **one** of the four angles between them: 50°.

        How many of the other three does she still have to measure?
      `,
      figure: crossFigure({
        a: 50, labels: ['50°', '?', '?', '?'], colors: ['orange', 'gray', 'gray', 'gray'], radii: [48, 26, 26, 26],
        alt: 'Two straight lines crossing. One of the four angles is marked 50 degrees, the other three are marked with question marks.',
      }),
      shuffle: false,
      options: [
        { text: 'All three' },
        { text: 'Two of them' },
        { text: 'Just one more' },
        { text: 'None — one angle fixes the rest', correct: true },
      ],
      explain: `
        None. Once a single angle is known, the other three have no freedom left:
        they must be 130°, 50° and 130°.

        This lesson is about why.
      `,
    },
    {
      id: 'teach-degrees',
      type: 'info',
      title: 'An angle measures a turn',
      text: `
        Where two straight lines meet, the **angle** between them says how far you would
        have to turn to swing from one line to the other. Turns are measured in **degrees**, written °.

        - A full turn, all the way round, is **360°**.
        - Half a turn is **180°**.
        - A quarter turn is **90°**, called a **right angle**: the corner of a book.
          Diagrams mark it with a small square.

        So the surveyor's 50° is a little more than half a right angle.
      `,
      figure: TURNS,
    },
    {
      id: 'explore-line',
      type: 'interact',
      graded: false,
      title: 'A ray on a straight line',
      text: `
        A ray stands on a straight line and splits it into two angles.

        **Drag P** to swing the ray until the [orange]{.orange} angle on the right is exactly 60°.
        Keep an eye on the [green]{.green} one on the left as you go.
      `,
      widget: {
        type: 'geo', x: [0, 10], y: [0, 4.8], height: 290,
        alt: 'A straight line with a ray from its midpoint O to a draggable point P. The two angles beside the ray are labelled in degrees.',
        points: {
          A: { x: 0.8, y: 1.1, hidden: true },
          B: { ...LINE_B, hidden: true },
          O: { ...LINE_O, label: false },
          P: { ...pol(LINE_O, 3.2, 130), drag: true, color: 'blue', constrain: onArc(LINE_O, 3.2) },
        },
        shapes: [
          { kind: 'segment', pts: ['A', 'B'] },
          { kind: 'segment', pts: ['O', 'P'], color: 'blue' },
          { kind: 'angle', pts: ['B', 'O', 'P'], label: 'deg', color: 'orange', r: 44 },
          { kind: 'angle', pts: ['P', 'O', 'A'], label: 'deg', color: 'green', r: 44 },
        ],
        readouts: [{ label: 'orange + green', value: (g) => g.angle('B', 'O', 'P') + g.angle('P', 'O', 'A'), digits: 0, unit: '°' }],
      },
      check: (s) => {
        const orange = angleDeg(LINE_B, LINE_O, s.P);
        if (near(orange, 60, 0.6)) return true;
        if (near(orange, 120, 0.6)) return 'That makes the *green* angle 60°. Swing P over to the other side.';
        return `The orange angle is ${Math.round(orange)}°. Drag P until it reads 60°.`;
      },
      solution: { P: pol(LINE_O, 3.2, 60) },
      explain: `
        At 60° orange, green is forced to be 120°. Whatever one angle gains, the
        other loses: together they always fill the straight line.
      `,
    },
    {
      id: 'half-turn',
      type: 'info',
      title: 'A straight line is half a turn',
      text: r`
        Half a turn leaves you facing the opposite way, so a straight line **is** half a turn.
        The angles along one side of it have exactly 180° to share: whatever one gains, another loses.

        :::key
        Angles on a straight line add up to **180°**.
        :::

        :::example
        Three angles share this line: 40°, 115° and one unknown. Take the known ones from 180°.
        $$${deg(180)} - ${deg(40)} - ${deg(115)} = ${deg(25)}$$
        :::

        With only two angles there is one subtraction: beside 85° sits $${deg(180)} - ${deg(85)} = ${deg(95)}$.
      `,
      figure: raysFigure({
        rays: [0, { deg: 40, len: 3.1 }, { deg: 155, len: 3.1 }, 180],
        arcs: [
          { between: [0, 1], label: '40°', color: 'orange' },
          { between: [1, 2], label: '115°', color: 'orange' },
          { between: [2, 3], label: '?', color: 'green' },
        ],
        height: 230,
        alt: 'A straight line with two rays standing on it, making three angles. Two are 40 and 115 degrees, the third is marked with a question mark.',
      }),
    },
    {
      id: 'line-missing',
      type: 'numeric',
      review: true,
      unit: '°',
      gen: (rng) => {
        if (rng.bool(0.55)) {
          const a = rng.bool() ? rng.int(25, 80) : rng.int(100, 155); // never close to a right angle
          const knownFirst = rng.bool();
          const known = knownFirst ? a : 180 - a;
          const answer = 180 - known;
          const wrong = [
            [360 - known, 'A straight line is half a turn: 180°. A full turn would be 360°.'],
            [known, 'The two angles are only equal when both are 90°. Here one is clearly wider.'],
          ];
          if (known < 90) wrong.push([90 - known, 'These two share a straight line (180°), not a right angle (90°).']);
          return {
            text: 'The two angles sit on a straight line. **Find the angle marked ?**',
            figure: raysFigure({
              rays: [0, { deg: a, len: 3.1 }, 180],
              arcs: [
                { between: [0, 1], label: knownFirst ? `${a}°` : '?', color: knownFirst ? 'orange' : 'green' },
                { between: [1, 2], label: knownFirst ? '?' : `${180 - a}°`, color: knownFirst ? 'green' : 'orange' },
              ],
              alt: `A straight line with a ray standing on it. One angle is ${known} degrees, the other is marked with a question mark.`,
            }),
            answer,
            wrong,
            hints: ['Together the two angles make a straight line. How many degrees is that?', r`Work out $${deg(180)} - ${deg(known)}$.`],
            explain: r`The two angles share a straight line: $${deg(180)} - ${deg(known)} = ${deg(answer)}$.`,
          };
        }
        const a = rng.int(30, 70);
        const b = rng.int(40, 75);
        const c = 180 - a - b;
        const all = [a, b, c];
        const hide = rng.int(0, 2);
        const shown = all.filter((_, i) => i !== hide);
        return {
          text: 'Three angles sit on a straight line. **Find the angle marked ?**',
          figure: raysFigure({
            rays: [0, { deg: a, len: 3.1 }, { deg: a + b, len: 3.1 }, 180],
            arcs: all.map((v, i) => ({ between: [i, i + 1], label: i === hide ? '?' : `${v}°`, color: i === hide ? 'green' : 'orange' })),
            alt: `A straight line with two rays standing on it, making three angles. Two are ${shown[0]} and ${shown[1]} degrees, the third is marked with a question mark.`,
          }),
          answer: all[hide],
          wrong: [
            [180 - shown[0], 'You subtracted only one of the angles. Take both away from 180°.'],
            [180 - shown[1], 'You subtracted only one of the angles. Take both away from 180°.'],
            [shown[0] + shown[1], 'That is the two known angles added together. The missing one is what is left of 180°.'],
            [360 - shown[0] - shown[1], 'A straight line is 180°, not 360°.'],
          ],
          hints: ['All three angles together make the straight line: 180°.', r`Work out $${deg(180)} - ${deg(shown[0])} - ${deg(shown[1])}$.`],
          explain: r`The three angles share $${deg(180)}$: $${deg(180)} - ${deg(shown[0])} - ${deg(shown[1])} = ${deg(all[hide])}$.`,
        };
      },
    },
    {
      id: 'explore-cross',
      type: 'interact',
      title: 'Now cross two lines',
      text: `
        Two straight lines cross at O, making four angles.

        **Drag P** to turn the blue line until the [orange]{.orange} angle next to B is 70°.
        Then read all four.
      `,
      widget: {
        type: 'geo', x: [0, 10], y: [0, 5.2], height: 310,
        alt: 'Two straight lines crossing at O. Dragging point P turns one of the lines. All four angles are labelled in degrees.',
        points: {
          A: { x: 1.4, y: 2.6, hidden: true },
          B: { ...CROSS_B, r: 3 },
          O: { ...CROSS_O, label: false },
          P: { ...pol(CROSS_O, 2.3, 125), drag: true, color: 'blue', constrain: onArc(CROSS_O, 2.3, 20, 160) },
          Q: { derive: (P) => ({ x: 2 * CROSS_O.x - P.P.x, y: 2 * CROSS_O.y - P.P.y }), hidden: true },
        },
        shapes: [
          { kind: 'segment', pts: ['A', 'B'] },
          { kind: 'segment', pts: ['P', 'Q'], color: 'blue' },
          { kind: 'angle', pts: ['B', 'O', 'P'], label: 'deg', color: 'orange', r: 34 },
          { kind: 'angle', pts: ['P', 'O', 'A'], label: 'deg', color: 'green', r: 34 },
          { kind: 'angle', pts: ['A', 'O', 'Q'], label: 'deg', color: 'orange', r: 34 },
          { kind: 'angle', pts: ['Q', 'O', 'B'], label: 'deg', color: 'green', r: 34 },
        ],
      },
      check: (s) => {
        const orange = angleDeg(CROSS_B, CROSS_O, s.P);
        if (near(orange, 70, 0.6)) return true;
        if (near(orange, 110, 0.6)) return 'Now the *green* angles are 70°. The orange angle is the one between OB and OP.';
        return `The orange angle next to B is ${Math.round(orange)}°. Keep turning until it reads 70°.`;
      },
      solution: { P: pol(CROSS_O, 2.3, 70) },
      hints: ['The orange angle is the one between the line to B and the line to P.'],
      explain: `
        70°, 110°, 70°, 110°. The angles **across** from each other stayed equal
        the whole time you were dragging, and each pair of neighbours kept adding up to 180°.
      `,
    },
    {
      id: 'why-opposite',
      type: 'fill',
      title: 'Why opposite angles must match',
      text: 'Here are three of the four angles where two straight lines cross. Complete the argument.',
      figure: crossFigure({
        a: 55, labels: ['a', 'b', 'c', null], colors: ['orange', 'green', 'orange', 'green'],
        alt: 'Two crossing lines. Going round the crossing point, three of the angles are labelled a, b and c. Angles a and c are opposite each other, with b between them.',
      }),
      template: r`
        $a$ and $b$ sit side by side on a straight line, so $a + b =$ [[180]]°.

        $b$ and $c$ sit side by side on the *other* straight line, so $b + c =$ [[180]]°.

        Take $b$ away from each total and the same amount is left, so $a$ [[is bigger than|*is equal to|is smaller than]] $c$.
      `,
      explain: r`
        Both $a$ and $c$ are "what is left of $${deg(180)}$ after $b$", so they have to be the same size,
        however the two lines cross.
      `,
    },
    {
      id: 'teach-opposite',
      type: 'info',
      title: 'Vertically opposite angles',
      text: r`
        Angles that face each other across a crossing are called **vertically opposite angles**.
        You have just shown why they must match.

        :::key
        Vertically opposite angles are **equal**.
        :::

        :::example
        One angle at this crossing is 80°.

        - $y$ is vertically opposite it, so $y = ${deg(80)}$.
        - $x$ is its neighbour on the line: $x = ${deg(180)} - ${deg(80)} = ${deg(100)}$.
        - $z$ is vertically opposite $x$, so $z = ${deg(100)}$.
        :::

        One measurement gives all four: the surveyor's puzzle is solved.
      `,
      figure: crossFigure({
        a: 80, labels: ['80°', 'x', 'y', 'z'], colors: ['orange', 'green', 'violet', 'green'], height: 260,
        alt: 'Two crossing lines. One angle is 80 degrees. Going round the crossing point, the next angles are labelled x, y and z, so y is opposite the known angle.',
      }),
    },
    {
      id: 'cross-practice',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = rng.bool() ? rng.int(25, 78) : rng.int(102, 155); // clearly not a right angle
        return {
          text: `Two straight lines cross. One of the angles is **${a}°**. Fill in the other three.`,
          figure: crossFigure({
            a, labels: [`${a}°`, 'x', 'y', 'z'], colors: ['orange', 'green', 'violet', 'green'],
            alt: `Two crossing lines. One angle is ${a} degrees. Going round the crossing point, the next angles are labelled x, y and z, so y is opposite the known angle.`,
          }),
          template: r`
            $x =$ [[${180 - a}]]°

            $y =$ [[${a}]]°

            $z =$ [[${180 - a}]]°
          `,
          hints: [
            r`$y$ is directly across from the ${a}° angle.`,
            r`$x$ and $z$ each sit on a straight line with the ${a}° angle.`,
          ],
          explain: r`
            $y$ is vertically opposite ${a}°, so $y = ${deg(a)}$.
            $x$ and $z$ each share a straight line with it: $${deg(180)} - ${deg(a)} = ${deg(180 - a)}$.
          `,
        };
      },
    },
    {
      id: 'full-turn',
      type: 'numeric',
      text: `
        Two straight lines cross and make four angles.

        Whatever the lines look like, what do **all four angles add up to**?
      `,
      answer: 360,
      unit: '°',
      wrong: [
        [180, 'That is one straight line: the two angles on one side. Add the two on the other side as well.'],
        [720, 'Each angle belongs to only one half. Two halves of 180° each.'],
      ],
      hints: ['The two angles above one of the lines make a straight line. So do the two below it.'],
      explain: r`
        Two straight lines' worth: $${deg(180)} + ${deg(180)} = ${deg(360)}$, a full turn.
      `,
    },
    {
      id: 'teach-around-point',
      type: 'info',
      title: 'All the way round',
      text: r`
        The four angles at a crossing make a full turn. So do any angles that go
        **all the way round a point**, however many there are.

        :::key
        Angles around a point add up to **360°**.
        :::

        :::example
        Three angles meet at this point: 90°, 150° and one unknown. Take the known ones from 360°.
        $$${deg(360)} - ${deg(90)} - ${deg(150)} = ${deg(120)}$$
        :::
      `,
      figure: raysFigure({
        rays: [0, 90, 240], origin: [5, 2.7], len: 2.3, x: [1.5, 8.5], y: [0.3, 5.1], height: 270,
        arcs: [
          { between: [0, 1], label: '90°', color: 'orange', r: 30 },
          { between: [1, 2], label: '150°', color: 'orange', r: 30 },
          { between: [2, 0], label: '?', color: 'green', r: 30 },
        ],
        alt: 'Three rays from one point. The angles between them are 90 degrees, 150 degrees and one marked with a question mark.',
      }),
    },
    {
      id: 'around-point',
      type: 'numeric',
      review: true,
      unit: '°',
      gen: (rng) => {
        const four = rng.bool();
        let parts;
        if (four) {
          const a = rng.int(70, 100);
          const b = rng.int(70, 100);
          const c = rng.int(70, 100);
          parts = [a, b, c, 360 - a - b - c];
        } else {
          const a = rng.int(100, 140);
          const b = rng.int(100, 140);
          parts = [a, b, 360 - a - b];
        }
        const n = parts.length;
        const hide = rng.int(0, n - 1);
        const start = rng.int(0, 7) * 10;
        const rays = [];
        let dir = start;
        for (const p of parts) { rays.push(dir); dir += p; }
        const known = parts.filter((_, i) => i !== hide);
        const sum = known.reduce((t, v) => t + v, 0);
        return {
          text: `${four ? 'Four' : 'Three'} angles go all the way round a point. **Find the angle marked ?**`,
          figure: raysFigure({
            rays, origin: [5, 2.7], len: 2.3, x: [1.5, 8.5], y: [0.3, 5.1], height: 310,
            arcs: parts.map((v, i) => ({ between: [i, (i + 1) % n], label: i === hide ? '?' : `${v}°`, color: i === hide ? 'green' : 'orange', r: 30 })),
            alt: `${four ? 'Four' : 'Three'} rays from one point. The angles between them are ${known.join(', ')} degrees and one marked with a question mark.`,
          }),
          answer: parts[hide],
          wrong: [
            [180 - sum, 'These angles go all the way round the point, not just along a straight line.'],
            [sum, 'That is the total of the angles you know. The missing one is what is left of 360°.'],
          ],
          hints: ['All the way round a point is a full turn: 360°.', r`Add the angles you know, then subtract from $${deg(360)}$.`],
          explain: r`Around a point the angles total $${deg(360)}$: $${deg(360)} - ${known.map(deg).join(' - ')} = ${deg(parts[hide])}$.`,
        };
      },
    },
    {
      id: 'parallel-slide',
      type: 'interact',
      graded: false,
      title: 'Slide without turning',
      text: `
        The two blue lines are **parallel**: they run in exactly the same direction and never meet.
        A third line cuts across both.

        **Drag D** down the crossing line until the upper blue line lands on the lower one.
        Watch the angle at D on the way.
      `,
      widget: {
        type: 'geo', x: [0, 10], y: [0, 6], height: 330,
        alt: 'Two parallel horizontal lines crossed by a slanted line. Point D, where the slanted line meets the upper parallel, can be dragged along the slanted line. The angle at each crossing is labelled.',
        points: {
          La: { x: 0.5, y: SLIDE_X.y, hidden: true },
          Lb: { x: 9.5, y: SLIDE_X.y, hidden: true },
          X: { ...SLIDE_X, label: false },
          S: { ...pol(SLIDE_X, 4.3, 60), hidden: true },
          T: { ...pol(SLIDE_X, 5.1, 60), hidden: true },
          T0: { ...pol(SLIDE_X, 1.1, 240), hidden: true },
          D: {
            ...pol(SLIDE_X, 3.6, 60), drag: true, color: 'blue', segment: ['X', 'S'], dx: -38,
            constrain: (p) => (Math.hypot(p.x - SLIDE_X.x, p.y - SLIDE_X.y) < 0.22 ? { ...SLIDE_X } : p),
          },
          Ua: { derive: (P) => ({ x: 0.5, y: P.D.y }), hidden: true },
          Ub: { derive: (P) => ({ x: 9.5, y: P.D.y }), hidden: true },
        },
        shapes: [
          { kind: 'segment', pts: ['La', 'Lb'], color: 'blue' },
          { kind: 'segment', pts: ['Ua', 'Ub'], color: 'blue' },
          { kind: 'segment', pts: ['T0', 'T'] },
          { kind: 'angle', pts: ['Lb', 'X', 'T'], label: 'deg', color: 'orange', r: 34 },
          { kind: 'angle', pts: ['Ub', 'D', 'T'], label: 'deg', color: 'orange', r: 34 },
        ],
      },
      check: (s) => dist(s.D, SLIDE_X) < 0.25 || 'Keep sliding D down the crossing line until the two blue lines sit on top of each other.',
      solution: { D: { ...SLIDE_X } },
      explain: `
        The angle at D read 60° all the way down, and at the bottom it landed exactly
        on the other 60°. Sliding a line **without turning it** cannot change the angle
        it makes with the line it slides along.
      `,
    },
    {
      id: 'teach-corresponding',
      type: 'info',
      title: 'Corresponding angles',
      text: r`
        Angles in the **same position** at two crossings on parallel lines are called
        **corresponding angles**: here, the two upper-right corners. One is a slid copy of the other.

        :::key
        Corresponding angles on parallel lines are **equal**.
        :::

        :::example
        Find the angle marked **?**

        1. The upper-right angle at the top crossing **corresponds** to the 72°, so it is 72° too.
        2. The **?** is its neighbour on the line: $${deg(180)} - ${deg(72)} = ${deg(108)}$.
        :::
      `,
      figure: parallelsFigure({
        a: 72, height: 280,
        marks: [
          { at: 'bottom', pos: 'UR', label: '72°' },
          { at: 'top', pos: 'UR', label: '72°' },
          { at: 'top', pos: 'UL', label: '?', color: 'green' },
        ],
        alt: 'Two parallel lines crossed by a third line. The upper-right angle is 72 degrees at both crossings. At the upper crossing the upper-left angle, next to it on the parallel line, is marked with a question mark.',
      }),
    },
    {
      id: 'parallel-find',
      type: 'numeric',
      stretch: true,
      unit: '°',
      gen: (rng) => {
        const a = rng.pick([40, 45, 50, 55, 65, 70, 75, 105, 110, 115, 125, 130, 135]);
        const pos = rng.pick(['LL', 'LR', 'UL']);
        const answer = pos === 'LL' ? a : 180 - a;
        const steps = {
          LL: r`Slide the upper line down onto the lower one: the upper-right angle at the top crossing is also $${deg(a)}$. The **?** is vertically opposite that angle, so it is $${deg(a)}$ too.`,
          LR: r`The upper-right angle at the top crossing corresponds to the $${deg(a)}$, so it is $${deg(a)}$ as well. The **?** is next to it on the crossing line, which is straight: $${deg(180)} - ${deg(a)} = ${deg(180 - a)}$.`,
          UL: r`The upper-right angle at the top crossing corresponds to the $${deg(a)}$, so it is $${deg(a)}$ as well. The **?** is next to it on the upper blue line: $${deg(180)} - ${deg(a)} = ${deg(180 - a)}$.`,
        };
        return {
          text: 'The two blue lines are parallel. **Find the angle marked ?**',
          figure: parallelsFigure({
            a,
            marks: [{ at: 'bottom', pos: 'UR', label: `${a}°` }, { at: 'top', pos, label: '?', color: 'green' }],
            alt: `Two parallel lines crossed by a third line. At the lower crossing the upper-right angle is ${a} degrees. At the upper crossing the ${CORNER_NAMES[pos]} angle is marked with a question mark.`,
          }),
          answer,
          wrong: [[180 - answer, pos === 'LL'
            ? 'Not quite. Find the angle that corresponds to the known one first, then look for a vertically opposite pair.'
            : 'That is the corresponding angle, in the upper-right corner of the top crossing. The ? is its neighbour.']],
          hints: [
            `Start with the angle in the **same position** at the top crossing (its upper-right corner). How big is it?`,
            'Now relate that angle to the ?: are they vertically opposite, or neighbours on a straight line?',
          ],
          explain: steps[pos],
        };
      },
    },
    {
      id: 'mixed',
      type: 'match',
      review: true,
      gen: (rng) => {
        const a = rng.int(35, 80);
        const b = rng.int(82, 98);
        let p;
        let q;
        let last;
        do {
          p = rng.pick([100, 110, 120, 130]);
          q = rng.pick([95, 105, 115, 125]);
          last = 360 - p - q;
        } while (last === 180 - a);
        return {
          text: rng.pick([
            'Three rules, mixed up. Match each description with the size of the angle.',
            'Which rule fits which angle? Match each description with its size.',
            'Use everything from this lesson: match each description with the size of the angle.',
          ]),
          pairs: [
            [`The neighbour of ${a}° on a straight line`, `${180 - a}°`],
            [`Vertically opposite ${a}°`, `${a}°`],
            [`Completes a full turn with ${p}° and ${q}°`, `${last}°`],
            [`Corresponds to ${b}° on a parallel line`, `${b}°`],
          ],
          explain: r`
            Neighbours on a straight line share $${deg(180)}$. Vertically opposite angles and corresponding angles are equal.
            Angles around a point share $${deg(360)}$: $${deg(360)} - ${deg(p)} - ${deg(q)} = ${deg(last)}$.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend measures the four angles where two straight lines cross and writes down, going round the point:

        **50°, 130°, 55°, 125°**

        Without measuring anything yourself, how do you know there is a mistake?
      `,
      model: `
        The first and third angles are vertically opposite, so they should be equal, but 50° is not 55°.
        You can also check neighbours: 130° and 55° sit together on a straight line, yet they add up to 185° instead of 180°.

        (The total, 360°, happens to be right. One check is not always enough.)
      `,
    },
  ],
  recap: [
    'Angles on a straight line add up to **180°**; angles around a point add up to **360°**.',
    'Where two lines cross, **vertically opposite** angles are equal.',
    'Sliding a line without turning it keeps its angles: **corresponding angles** on parallel lines are equal.',
    'One known angle is often enough to work out all the others.',
  ],
  next: 'Next: tear the corners off a triangle and see what they add up to.',
};
