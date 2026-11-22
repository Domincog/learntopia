// Trigonometry: Circles & Waves · Lesson 6 · Triangles Without a Right Angle
import { r, num, angleDeg, dist } from '../../../kit.js';
import { sind, cosd, fixed, tabled, roundTo, trigTable, keyFor, D2R } from '../helpers.js';

const polar = (centre, radius, deg) => ({ x: centre.x + radius * cosd(deg), y: centre.y + radius * sind(deg) });

/**
 * Keeps a dragged point on a circle around `centre`, at a whole multiple of `step`
 * degrees between `lo` and `hi` (measured counter-clockwise from "east").
 */
const onArc = (centre, radius, lo, hi, step) => (p) => {
  let deg = Math.atan2(p.y - centre.y, p.x - centre.x) / D2R;
  if (deg < -90) deg += 360;
  deg = Math.min(hi, Math.max(lo, Math.round(deg / step) * step));
  return polar(centre, radius, deg);
};

/* ----------------------------------------------------------- the hinge */
const HINGE = { C: { x: 5, y: 1.5 }, A: { x: 8, y: 1.5 }, a: 4, b: 3 };
const hingeAngle = (s) => Math.round(angleDeg(HINGE.A, HINGE.C, s.B));
const hingeWidget = (start, alt) => ({
  type: 'geo', x: [0, 12], y: [0, 8],
  points: {
    C: { ...HINGE.C },
    A: { ...HINGE.A },
    B: { ...polar(HINGE.C, HINGE.a, start), drag: true, color: 'orange', constrain: onArc(HINGE.C, HINGE.a, 20, 160, 5) },
  },
  shapes: [
    { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },
    { kind: 'angle', pts: ['A', 'C', 'B'], label: 'deg', color: 'yellow' },
    { kind: 'segment', pts: ['C', 'B'], label: 'a = 4', offset: 30 },
    { kind: 'segment', pts: ['C', 'A'], label: 'b = 3' },
    { kind: 'segment', pts: ['A', 'B'], color: 'orange', label: (g) => `c = ${num(g.dist('A', 'B'), 2)}`, offset: 40 },
  ],
  readouts: [
    { label: '$c^2$', value: (g) => g.dist('A', 'B') ** 2, digits: 1, color: 'orange' },
    { label: '$a^2 + b^2$', value: () => 25, digits: 0 },
  ],
  alt,
});

/* ------------------------------------------------ the law of sines explorer */
const BASE = { A: { x: 1.5, y: 1 }, B: { x: 9.5, y: 1 } };
const anglesOf = (C) => [angleDeg(BASE.B, BASE.A, C), angleDeg(BASE.A, BASE.B, C), angleDeg(BASE.A, C, BASE.B)];

/* -------------------------------------------------------- triangulation */
const COAST = { A: { x: 2.5, y: 1 }, B: { x: 9.5, y: 1 }, reach: 3 };
const sightAngles = (s) => ({ atA: Math.round(angleDeg(COAST.B, COAST.A, s.P)), atB: Math.round(angleDeg(COAST.A, COAST.B, s.Q)) });
/** Where the two lines of sight cross, or null when they do not meet out at sea. */
function crossing(P) {
  const { A, B } = COAST;
  const d1 = { x: P.P.x - A.x, y: P.P.y - A.y };
  const d2 = { x: P.Q.x - B.x, y: P.Q.y - B.y };
  const den = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((B.x - A.x) * d2.y - (B.y - A.y) * d2.x) / den;
  const u = ((B.x - A.x) * d1.y - (B.y - A.y) * d1.x) / den;
  return t > 0 && u > 0 ? { x: A.x + t * d1.x, y: A.y + t * d1.y } : null;
}

/**
 * A triangle drawn to scale. Corner C is at the bottom left, A along the base, B above.
 * `sides` are the labels of a (BC), b (CA) and c (AB); `angles` the labels at A, B and C ('' for none).
 */
function triFigure({ a, b, C, sides = {}, angles = {}, names = ['A', 'B', 'C'], alt }) {
  const pc = { x: 0, y: 0 };
  const pa = { x: b, y: 0 };
  const pb = { x: a * cosd(C), y: a * sind(C) };
  const xs = [pc.x, pa.x, pb.x];
  const ys = [pc.y, pa.y, pb.y];
  const span = Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * 1.47);
  const m = span * 0.14;
  const shapes = [{ kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' }];
  if (angles.A) shapes.push({ kind: 'angle', pts: ['B', 'A', 'C'], label: angles.A, color: 'yellow' });
  if (angles.B) shapes.push({ kind: 'angle', pts: ['A', 'B', 'C'], label: angles.B, color: 'yellow' });
  if (angles.C) shapes.push({ kind: 'angle', pts: ['A', 'C', 'B'], label: angles.C, color: 'yellow' });
  if (sides.a) shapes.push({ kind: 'segment', pts: ['B', 'C'], label: sides.a, width: 0.01 });
  if (sides.b) shapes.push({ kind: 'segment', pts: ['C', 'A'], label: sides.b, width: 0.01 });
  if (sides.c) shapes.push({ kind: 'segment', pts: ['A', 'B'], label: sides.c, width: 0.01 });
  return {
    type: 'geo', height: 340,
    x: [Math.min(...xs) - m, Math.max(...xs) + m], y: [Math.min(...ys) - m, Math.max(...ys) + m],
    points: { A: { ...pa, label: names[0] }, B: { ...pb, label: names[1] }, C: { ...pc, label: names[2] } },
    shapes, alt,
  };
}

/** The height of a triangle splits it into two right-angled triangles that share that height. */
const HEIGHT = {
  type: 'svg', viewBox: '0 0 340 214', maxWidth: 420,
  alt: 'A triangle with corners A at the bottom left, B at the bottom right and C at the top. Side b runs from A to C, side a from B to C, and side c along the bottom. A dashed height h drops from C straight down to the bottom side, splitting the triangle into two right-angled triangles.',
  content:
    '<polygon class="fill-blue-soft stroke-ink" stroke-width="3" stroke-linejoin="round" points="40,176 300,176 130,36"/>' +
    '<path class="stroke-orange fill-none" stroke-width="3" stroke-dasharray="6 5" d="M130 36 V176"/>' +
    '<path class="fill-none stroke-ink" stroke-width="2" d="M130 164 h12 v12"/>' +
    '<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M40 176 h30 A30 30 0 0 0 56.2 150.8 Z"/>' +
    '<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M300 176 h-30 A30 30 0 0 1 276.8 157 Z"/>' +
    '<text class="fig-label fig-math" x="26" y="184" text-anchor="middle">A</text>' +
    '<text class="fig-label fig-math" x="314" y="184" text-anchor="middle">B</text>' +
    '<text class="fig-label fig-math" x="130" y="26" text-anchor="middle">C</text>' +
    '<text class="fig-label fig-math" x="72" y="100" text-anchor="end">b</text>' +
    '<text class="fig-label fig-math" x="226" y="98" text-anchor="start">a</text>' +
    '<text class="fig-label fig-math" x="186" y="198" text-anchor="middle">c</text>' +
    '<text class="fig-label fig-math text-orange" x="140" y="118" text-anchor="start">h</text>',
};

/** Whole-number triangles whose angle opposite c is 60°, 90° or 120°: [a, b, c, C]. */
const TIDY = [
  [3, 8, 7, 60], [5, 8, 7, 60], [7, 15, 13, 60], [8, 15, 13, 60],
  [3, 4, 5, 90], [5, 12, 13, 90], [6, 8, 10, 90], [8, 15, 17, 90],
  [3, 5, 7, 120], [7, 8, 13, 120], [5, 16, 19, 120], [6, 10, 14, 120],
];

const SIGHTINGS = [
  { text: (d, a, b) => `Two coastguard stations, A and B, are **${d} km** apart on a straight coast. A ship is seen from A at **${a}°** to the coast and from B at **${b}°** to the coast.`, ask: 'How far is the ship from station A?', thing: 'ship', unit: 'km' },
  { text: (d, a, b) => `Two fire lookout towers, A and B, are **${d} km** apart. Smoke is seen from A at **${a}°** to the line joining the towers, and from B at **${b}°** to it.`, ask: 'How far is the fire from tower A?', thing: 'fire', unit: 'km' },
  { text: (d, a, b) => `Surveyors mark out a baseline AB, **${d} km** long. A mountain peak is sighted from A at **${a}°** to the baseline and from B at **${b}°** to it.`, ask: 'How far is the peak from A, measured in a straight line on the map?', thing: 'peak', unit: 'km' },
];

export default {
  id: 'any-triangle',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Does Pythagoras still work?',
      text: r`
        Two sides of a triangle are 5 and 8 long, and the angle between them is 60°.

        A friend finds the third side with Pythagoras: $\sqrt{5^2 + 8^2} = \sqrt{89} \approx 9.4$.

        **Is that right?**
      `,
      figure: triFigure({
        a: 5, b: 8, C: 60, sides: { a: '5', b: '8', c: '?' }, angles: { C: '60°' }, names: ['', '', ''],
        alt: 'A triangle drawn to scale, with sides of 5 and 8 meeting at an angle of 60 degrees. The third side is marked with a question mark.',
      }),
      shuffle: false,
      options: [
        { text: 'Yes: Pythagoras works in every triangle' },
        { text: 'No: the third side is shorter than 9.4', correct: true },
        { text: 'No: the third side is longer than 9.4' },
      ],
      explain: `
        It is shorter: exactly **7**, as it happens.

        Pythagoras needs a right angle. At 60° the two sides are folded closer together than at
        90°, so their far ends are nearer to each other. This lesson finds what to use instead.
      `,
    },
    {
      id: 'name-parts',
      type: 'info',
      title: 'Letters for sides and angles',
      text: r`
        In this lesson the corners of a triangle are $A$, $B$ and $C$, and each side takes the small letter of the corner it **faces**:
        side $c$ faces angle $C$. So $C$ is the angle **between** the sides $a$ and $b$.

        When $C$ is a right angle, $c$ is the hypotenuse and Pythagoras holds:
        $$ c^2 = a^2 + b^2 $$

        One thing to bring back from the unit circle: between 90° and 180° the cosine is **negative**.

        | $C$ | 60° | 90° | 120° |
        |:--|:--:|:--:|:--:|
        | $\cos C$ | ${[60, 90, 120].map((deg) => `$${num(roundTo(cosd(deg), 3))}$`).join(' | ')} |
      `,
      figure: triFigure({
        a: 5, b: 8, C: 60, sides: { a: 'a', b: 'b', c: 'c' }, angles: { A: 'A', B: 'B', C: 'C' }, names: ['', '', ''],
        alt: 'A triangle with its angles marked A, B and C. Side a is opposite angle A, side b is opposite angle B and side c is opposite angle C, so sides a and b meet at the corner C.',
      }),
    },
    {
      id: 'hinge',
      type: 'interact',
      title: 'A hinge',
      text: r`
        Two rods, $a = 4$ and $b = 3$, are hinged at $C$. The third side, $c$, closes the triangle.

        **Open or close the hinge until $c^2$ is exactly $a^2 + b^2 = 25$.**
      `,
      widget: hingeWidget(50, 'Two rods of length 4 and 3 hinged at the corner C. The end of the longer rod can be dragged to open or close the hinge, and the square of the third side is shown.'),
      check: (s) => {
        const deg = hingeAngle(s);
        const c2 = num(dist(HINGE.A, s.B) ** 2, 1);
        if (deg === 90) return true;
        return deg < 90
          ? `At ${deg}° the third side is too short: c² is ${c2}, less than 25. Open the hinge.`
          : `At ${deg}° the third side is too long: c² is ${c2}, more than 25. Close the hinge a little.`;
      },
      solution: { B: polar(HINGE.C, HINGE.a, 90) },
      explain: r`
        At exactly **90°** it is the 3-4-5 triangle, and $c^2 = a^2 + b^2$. That is Pythagoras.

        Close the hinge and $c^2$ drops below 25. Open it past 90° and $c^2$ climbs above 25.
      `,
    },
    {
      id: 'correction',
      type: 'fill',
      title: 'Off by how much?',
      text: r`Away from 90°, $c^2$ misses 25. Use the hinge to measure by how much.`,
      figure: hingeWidget(90, 'Two rods of length 4 and 3 hinged at the corner C. The end of the longer rod can be dragged to open or close the hinge, and the square of the third side is shown.'),
      template: r`
        At $C = 60^\circ$: $\;c^2 =$ [[13]]

        That is [[12]] **less** than 25.

        At $C = 120^\circ$: $\;c^2 =$ [[37]]

        That is [[12]] **more** than 25.
      `,
      tolerance: 0.05,
      hints: ['Drag the orange point until the angle at C reads 60°, then read the orange readout.'],
      explain: r`
        The gap is 12 both times. Now compare: $2ab = 2 \times 4 \times 3 = 24$, and
        $\cos 60^\circ = \frac{1}{2}$ while $\cos 120^\circ = -\frac{1}{2}$.

        So the gap is $2ab\cos C$. At 60° it takes 12 away. At 120° the cosine is negative, and taking away $-12$ adds 12.
      `,
    },
    {
      id: 'law-cos',
      type: 'info',
      title: 'The law of cosines',
      text: r`
        :::key
        In any triangle, if $C$ is the angle between the sides $a$ and $b$, the third side $c$ satisfies
        $$ c^2 = a^2 + b^2 - 2ab\cos C $$
        :::

        It is Pythagoras with a correction term.

        - At $C = 90^\circ$, $\cos C = 0$ and the correction vanishes: plain Pythagoras.
        - Below 90° the cosine is positive, so $c^2$ is smaller.
        - Above 90° the cosine is negative, so $c^2$ is larger.

        Where does it come from? Drop a height onto side $b$ and use Pythagoras in the two right-angled
        triangles it makes. A few lines of algebra then give the formula. Here that algebra is taken on trust.
      `,
    },
    {
      id: 'example-cos-side',
      type: 'info',
      title: 'The law at work',
      text: r`
        :::example
        Sides $a = 20$ and $b = 15$ meet at $C = 115^\circ$, and $\cos 115^\circ \approx ${fixed(cosd(115))}$. Find $c$.

        1. $c^2 = 20^2 + 15^2 - 2 \times 20 \times 15 \times (${fixed(cosd(115))})$
        2. $c^2 \approx 625 + ${num(roundTo(-600 * tabled(cosd(115)), 1))} = ${num(roundTo(625 - 600 * tabled(cosd(115)), 1))}$. Taking away a negative number **adds**.
        3. $c = \sqrt{${num(roundTo(625 - 600 * tabled(cosd(115)), 1))}} \approx ${roundTo(Math.sqrt(625 - 600 * tabled(cosd(115))), 1).toFixed(1)}$
        :::

        A check: Pythagoras alone would give $\sqrt{625} = 25$. The angle is above 90°, so $c$ has to be longer than that, and it is.
      `,
      figure: triFigure({
        a: 20, b: 15, C: 115, sides: { a: '20', b: '15', c: '?' }, angles: { C: 'deg' },
        alt: 'A triangle drawn to scale. Sides of length 20 and 15 meet at the corner C, at an angle of 115 degrees. The third side is marked with a question mark.',
      }),
    },
    {
      id: 'cos-side',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        for (let attempt = 0; attempt < 60; attempt++) {
          const C = rng.pick([35, 40, 50, 60, 70, 75, 100, 110, 120, 130, 135]);
          const a = rng.int(4, 12);
          const b = rng.intExcept(4, 12, [a]);
          const cosC = cosd(C);
          const square = a * a + b * b - 2 * a * b * cosC;
          const viaTable = a * a + b * b - 2 * a * b * tabled(cosC);
          const key = keyFor(Math.sqrt(square), [Math.sqrt(viaTable), Math.sqrt(roundTo(viaTable, 1)), Math.sqrt(roundTo(viaTable, 0)), Math.sqrt(roundTo(square, 1))], 1);
          const pythagoras = Math.sqrt(a * a + b * b);
          const flipped = Math.sqrt(a * a + b * b + 2 * a * b * cosC);
          if ([pythagoras, flipped, square].some((v) => Math.abs(v - key.answer) < 4 * key.tolerance + 0.1) || key.tolerance > 0.12) continue;
          // the explanation takes the square root of the table-based c²: it has to round to the same answer
          if (roundTo(Math.sqrt(roundTo(viaTable, 3)), 1) !== key.answer) continue;
          const correction = roundTo(2 * a * b * tabled(cosC), 3);
          return {
            text: r`A triangle has sides $a = ${a}$ and $b = ${b}$, and the angle between them is $C = ${C}^\circ$. You may use $\cos ${C}^\circ \approx ${fixed(cosC)}$. **Find the third side $c$.** Round to 1 decimal place.`,
            figure: triFigure({
              a, b, C, sides: { a: String(a), b: String(b), c: '?' }, angles: { C: 'deg' },
              alt: `A triangle drawn to scale. Sides of length ${a} and ${b} meet at the corner C, at an angle of ${C} degrees. The third side is marked with a question mark.`,
            }),
            ...key,
            prefix: '$c =$',
            wrong: [
              [roundTo(pythagoras, 1), r`That is $\sqrt{a^2 + b^2}$, which is Pythagoras. It only works when $C$ is 90°. Take away the correction $2ab\cos C$ before the square root.`],
              [roundTo(flipped, 1), C < 90
                ? r`You added the correction. For an angle below 90°, $c$ must be **shorter** than Pythagoras gives: subtract $2ab\cos C$.`
                : r`Check the sign. $\cos ${C}^\circ$ is negative, so subtracting $2ab\cos C$ **adds** to $c^2$: the third side must be longer than Pythagoras gives.`],
              [roundTo(square, 1), r`That is $c^2$. Take the square root to get $c$.`],
            ],
            hints: [
              r`$c^2 = a^2 + b^2 - 2ab\cos C = ${a}^2 + ${b}^2 - 2 \times ${a} \times ${b} \times (${fixed(cosC)})$`,
              r`$c^2 \approx ${a * a + b * b} ${correction < 0 ? '+' : '-'} ${num(Math.abs(correction), 3)} = ${num(roundTo(viaTable, 3), 3)}$. Now take the square root.`,
            ],
            explain: r`$c^2 = ${a}^2 + ${b}^2 - 2 \times ${a} \times ${b} \times (${fixed(cosC)}) \approx ${a * a + b * b} ${correction < 0 ? '+' : '-'} ${num(Math.abs(correction), 3)} = ${num(roundTo(viaTable, 3), 3)}$, so $c \approx ${key.display}$. ${C < 90 ? 'The angle is below 90°, so the side is shorter than Pythagoras would give' : 'The angle is above 90°, so the side is longer than Pythagoras would give'} ($\sqrt{${a * a + b * b}} \approx ${num(pythagoras, 1)}$).`,
          };
        }
        throw new Error('no clean variant found');
      },
    },
    {
      id: 'example-cos-angle',
      type: 'info',
      title: 'The same law finds an angle',
      text: r`
        When all three sides are known, solve the law for $\cos C$: add $2ab\cos C$ to both sides, take away $c^2$, and divide by $2ab$.

        $$ \cos C = \frac{a^2 + b^2 - c^2}{2ab} $$

        :::example
        A triangle has sides $a = 9$, $b = 15$ and $c = 21$.

        $$ \begin{aligned} \cos C &= \frac{9^2 + 15^2 - 21^2}{2 \times 9 \times 15} \\[4pt] &= \frac{81 + 225 - 441}{270} \\[4pt] &= \frac{-135}{270} = -0.5 \end{aligned} $$

        A negative cosine means an angle above 90°: $C = 120^\circ$.
        :::
      `,
      figure: triFigure({
        a: 9, b: 15, C: 120, sides: { a: '9', b: '15', c: '21' }, angles: { C: '?' },
        alt: 'A triangle drawn to scale with sides of length 9, 15 and 21. The angle facing the longest side, at the corner C, is marked with a question mark.',
      }),
    },
    {
      id: 'cos-angle',
      type: 'numeric',
      review: true,
      title: 'From three sides to an angle',
      gen: (rng) => {
        const [a, b, c, C] = rng.pick(TIDY);
        const top = a * a + b * b - c * c;
        const cosC = top / (2 * a * b);
        return {
          text: r`
            Rearranged for the angle, the law of cosines reads $\;\cos C = \dfrac{a^2 + b^2 - c^2}{2ab}$.

            A triangle has sides $a = ${a}$, $b = ${b}$ and $c = ${c}$. **How big is the angle $C$, the one facing the side $c$?**

            You know these: $\cos 60^\circ = 0.5$, $\;\cos 90^\circ = 0$, $\;\cos 120^\circ = -0.5$.
          `,
          answer: C,
          prefix: '$C =$',
          unit: '°',
          wrong: [[180 - C, C === 60
            ? r`$\cos C$ comes out as $+0.5$. A positive cosine means an angle below 90°.`
            : r`$\cos C$ comes out as $-0.5$. A negative cosine means an angle above 90°.`]].filter(([v]) => v !== C),
          hints: [
            r`$\cos C = \dfrac{${a}^2 + ${b}^2 - ${c}^2}{2 \times ${a} \times ${b}} = \dfrac{${a * a} + ${b * b} - ${c * c}}{${2 * a * b}}$`,
            r`That is $\dfrac{${top}}{${2 * a * b}} = ${num(cosC)}$. Which angle has that cosine?`,
          ],
          explain: r`$\cos C = \dfrac{${a * a} + ${b * b} - ${c * c}}{2 \times ${a} \times ${b}} = \dfrac{${top}}{${2 * a * b}} = ${num(cosC)}$, so $C = ${C}^\circ$.${C === 90 ? r` Here $a^2 + b^2 = c^2$ exactly: a right-angled triangle.` : ''}`,
        };
      },
    },
    {
      id: 'explore-sines',
      type: 'interact',
      graded: false,
      title: 'A second pattern',
      text: r`
        Name each side with the small letter of the angle it **faces**: side $a$ faces angle $A$, and so on.
        The readouts divide each side by the sine of the angle facing it.

        **Drag $C$ to make a triangle with an angle bigger than 90°**, and watch the three readouts on the way.
      `,
      widget: {
        type: 'geo', x: [0, 12], y: [0, 8],
        points: {
          A: { ...BASE.A },
          B: { ...BASE.B },
          C: { x: 6, y: 5.5, drag: true, snap: 0.5, color: 'orange', constrain: (p) => ({ x: Math.min(11.5, Math.max(0.5, p.x)), y: Math.min(7.5, Math.max(2, p.y)) }) },
        },
        shapes: [
          { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },
          { kind: 'angle', pts: ['B', 'A', 'C'], label: 'deg', color: 'yellow' },
          { kind: 'angle', pts: ['A', 'B', 'C'], label: 'deg', color: 'yellow' },
          { kind: 'angle', pts: ['A', 'C', 'B'], label: 'deg', color: 'yellow' },
          { kind: 'segment', pts: ['B', 'C'], label: 'a', width: 0.01 },
          { kind: 'segment', pts: ['A', 'C'], label: 'b', width: 0.01 },
          { kind: 'segment', pts: ['A', 'B'], label: 'c', width: 0.01 },
        ],
        readouts: [
          { label: r`$a \div \sin A$`, value: (g) => g.dist('B', 'C') / sind(g.angle('B', 'A', 'C')), digits: 2 },
          { label: r`$b \div \sin B$`, value: (g) => g.dist('A', 'C') / sind(g.angle('A', 'B', 'C')), digits: 2 },
          { label: r`$c \div \sin C$`, value: (g) => g.dist('A', 'B') / sind(g.angle('A', 'C', 'B')), digits: 2 },
        ],
        alt: 'A triangle A B C whose top corner C can be dragged. Each angle is shown, and three readouts give each side divided by the sine of the angle facing it.',
      },
      check: (s) => Math.max(...anglesOf(s.C)) > 90.01 || 'No angle is bigger than 90° yet. Pull C sideways, out past one end of the bottom side, or down towards it.',
      solution: { C: { x: 11, y: 4 } },
      explain: r`
        Whatever shape you make, the three readouts agree:
        $$ \frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} $$
        A bigger angle always faces a longer side, and the sine keeps the two exactly in step.
      `,
    },
    {
      id: 'derive',
      type: 'fill',
      title: 'Why the ratios agree',
      text: r`Drop a height $h$ from $C$. It splits the triangle into two right-angled triangles, and $h$ is a side of **both**.`,
      figure: HEIGHT,
      template: r`
        In the left-hand triangle, $\sin A = h \div$ [[a|*b|c]], so $h = b\sin A$.

        In the right-hand triangle, $\sin B = h \div$ [[*a|b|c]], so $h = a\sin B$.

        It is the same height, so $b\sin A = a\sin B$. Divide both sides by $\sin A \sin B$, and $a \div \sin A = b \div \sin$ [[A|*B|C]].
      `,
      hints: ['In each small triangle, h is the side opposite the marked angle. Which side is the hypotenuse?'],
      explain: r`
        In each right-angled triangle $h$ is the opposite side and the sloping side is the hypotenuse:
        $h = b\sin A$ on the left, $h = a\sin B$ on the right. Setting them equal and dividing gives
        $\dfrac{a}{\sin A} = \dfrac{b}{\sin B}$. Dropping the height from another corner brings in $c$ and $C$ the same way.
      `,
    },
    {
      id: 'law-sin',
      type: 'info',
      title: 'The law of sines',
      text: r`
        :::key
        In any triangle, each side divided by the sine of the angle facing it gives the same number:
        $$ \frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} $$
        :::

        Use it when you know a **matched pair**, a side and the angle facing it, and one more angle.
        Two angles are as good as three, because the three add up to 180°.

        :::warn A caution
        $\sin\theta = \sin(180^\circ - \theta)$, so a sine cannot tell an acute angle from an obtuse one.
        When this law is used to find an *angle*, two different triangles can sometimes fit the same
        measurements. Here it is only used to find sides, where there is no such doubt.
        :::
      `,
    },
    {
      id: 'triangulate',
      type: 'interact',
      title: 'Where is the ship?',
      text: `
        Two coastguard stations, A and B, are 7 km apart on a straight coast. Each measures the angle
        between the coast and its line of sight to a ship: **50° at A** and **70° at B**.

        **Aim the two lines of sight.** The ship is where they cross.
      `,
      widget: {
        type: 'geo', x: [0, 12], y: [0, 8],
        points: {
          A: { ...COAST.A },
          B: { ...COAST.B },
          P: { ...polar(COAST.A, COAST.reach, 90), drag: true, label: false, color: 'orange', constrain: onArc(COAST.A, COAST.reach, 20, 160, 5) },
          Q: { ...polar(COAST.B, COAST.reach, 90), drag: true, label: false, color: 'violet', constrain: onArc(COAST.B, COAST.reach, 20, 160, 5) },
          // (named with a text shape: geo cannot place the label of a derived point while that point does not exist)
          S: { derive: crossing, label: false, color: 'red', r: 7 },
        },
        shapes: [
          { kind: 'segment', pts: ['A', 'B'], label: '7 km' },
          { kind: 'ray', pts: ['A', 'P'], color: 'orange', dashed: true },
          { kind: 'ray', pts: ['B', 'Q'], color: 'violet', dashed: true },
          { kind: 'angle', pts: ['B', 'A', 'P'], label: 'deg', color: 'orange' },
          { kind: 'angle', pts: ['A', 'B', 'Q'], label: 'deg', color: 'violet' },
          { kind: 'text', at: 'S', text: 'ship', dx: 30, dy: -2, color: 'red' },
        ],
        alt: 'A straight coast with stations A and B, 7 kilometres apart. From each station a line of sight points out to sea; its direction can be changed by dragging a point. Where the two lines cross, a dot marks the ship.',
      },
      check: (s) => {
        const { atA, atB } = sightAngles(s);
        if (atA === 50 && atB === 70) return true;
        if (atA !== 50 && atB !== 70) return `The angles are ${atA}° at A and ${atB}° at B. They should be 50° and 70°.`;
        return atA !== 50 ? `The line from B is right. The angle at A is ${atA}°, and it should be 50°.` : `The line from A is right. The angle at B is ${atB}°, and it should be 70°.`;
      },
      solution: { P: polar(COAST.A, COAST.reach, 50), Q: polar(COAST.B, COAST.reach, 110) },
      explain: `
        Two angles and one measured distance fix the position of the ship. Nobody had to go out to it.
        This is **triangulation**, and before satellites whole countries were mapped this way: one
        carefully measured baseline, and after that nothing but angles.
      `,
    },
    {
      id: 'example-ship',
      type: 'info',
      title: 'From two angles to a distance',
      text: r`
        The law of sines turns those measurements into a distance.

        :::example
        How far is the ship from station A? Use $\sin 70^\circ \approx ${fixed(sind(70))}$ and $\sin 60^\circ \approx ${fixed(sind(60))}$.

        1. Angle at the ship: $180^\circ - 50^\circ - 70^\circ = 60^\circ$. It faces the 7 km baseline: a **matched pair**.
        2. The side from A to the ship faces the angle at **B**, 70°.
        3. $\dfrac{\text{distance}}{\sin 70^\circ} = \dfrac{7}{\sin 60^\circ}$
        4. Multiply both sides by $\sin 70^\circ$: the distance is $\dfrac{7 \times ${fixed(sind(70))}}{${fixed(sind(60))}} \approx ${roundTo((7 * tabled(sind(70))) / tabled(sind(60)), 1)}$ km.
        :::
      `,
      figure: triFigure({
        a: (7 * sind(70)) / sind(60), b: 7, C: 50, names: ['B', 'ship', 'A'], sides: { a: '?', b: '7 km' }, angles: { C: '50°', A: '70°', B: '60°' },
        alt: 'A triangle drawn to scale. Its bottom side A B is 7 kilometres long. The angle at A is 50 degrees, the angle at B is 70 degrees and the angle at the ship, the third corner, is 60 degrees. The side from A to the ship is marked with a question mark.',
      }),
    },
    {
      id: 'sin-side',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        for (let attempt = 0; attempt < 80; attempt++) {
          const A = rng.pick([30, 35, 40, 45, 50, 55, 60, 70, 80, 100, 110]);
          const B = rng.pick([25, 35, 40, 45, 50, 55, 65, 75].filter((v) => v !== A && v + A <= 150));
          const a = rng.pick([6, 8, 10, 12, 15, 20]);
          const exact = (a * sind(B)) / sind(A);
          const sA = tabled(sind(A));
          const sB = tabled(sind(B));
          const key = keyFor(exact, [
            (a * sB) / sA, roundTo(a / sA, 2) * sB, roundTo(a / sA, 1) * sB, roundTo(a * sB, 1) / sA, roundTo(a * sB, 2) / sA, a * roundTo(sB / sA, 3),
            roundTo(a / sind(A), 1) * sind(B), roundTo(a * sind(B), 1) / sind(A),     // the same two short cuts on a calculator
          ], 1);
          const swapped = (a * sind(A)) / sind(B);
          // the slips (wrong pairing, or half of the calculation left out) must not land on the answer
          if ([swapped, a / sind(A), a * sind(B), a].some((v) => Math.abs(v - key.answer) < 4 * key.tolerance + 0.1) || key.tolerance > 0.15) continue;
          // nor may the angles used without their sines, half of the calculation with the wrong angle, or a calculator
          // left in radian mode (with the minus sign dropped) pass as the answer, rounded or not
          if ([(a * B) / A, a / sind(B), a * sind(A), Math.abs((a * Math.sin(B)) / Math.sin(A))].some((v) => Math.abs(v - key.answer) <= key.tolerance + 0.05)) continue;
          // the explanation works with the table values: they have to round to the same answer as the calculator's
          if (roundTo((a * sB) / sA, 1) !== key.answer) continue;
          const b = (a * sind(B)) / sind(A);
          const C = 180 - A - B;
          return {
            text: `In triangle ABC, angle $A = ${A}^\\circ$, angle $B = ${B}^\\circ$, and the side facing $A$ is $a = ${a}$.\n\n${trigTable([A, B], ['sin'])}\n\n**Find $b$, the side facing angle $B$.** Round to 1 decimal place.`,
            figure: triFigure({
              a, b, C, sides: { a: `a = ${a}`, b: 'b = ?' }, angles: { A: `${A}°`, B: `${B}°` },
              alt: `Triangle A B C drawn to scale. The angle at A is ${A} degrees and the angle at B is ${B} degrees. The side facing A is ${a} long, and the side facing B is marked with a question mark.`,
            }),
            ...key,
            prefix: '$b =$',
            wrong: [[roundTo(swapped, 1), r`That pairs each side with the wrong angle. $b$ goes with $\sin B$ and $a$ with $\sin A$: $\dfrac{b}{\sin B} = \dfrac{a}{\sin A}$.`]],
            hints: [
              r`You know a matched pair: $a = ${a}$ faces $A = ${A}^\circ$. Write $\dfrac{b}{\sin ${B}^\circ} = \dfrac{${a}}{\sin ${A}^\circ}$.`,
              r`Multiply both sides by $\sin ${B}^\circ$: $\;b = \dfrac{${a} \times ${fixed(sind(B))}}{${fixed(sind(A))}}$.`,
            ],
            explain: r`$\dfrac{b}{\sin ${B}^\circ} = \dfrac{${a}}{\sin ${A}^\circ}$, so $b = \dfrac{${a} \times \sin ${B}^\circ}{\sin ${A}^\circ} \approx \dfrac{${a} \times ${fixed(sind(B))}}{${fixed(sind(A))}} \approx ${key.display}$. ${B > A ? 'Angle $B$ is the bigger angle, so $b$ is the longer side' : 'Angle $B$ is the smaller angle, so $b$ is the shorter side'}.`,
          };
        }
        throw new Error('no clean variant found');
      },
    },
    {
      id: 'ship-distance',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        for (let attempt = 0; attempt < 80; attempt++) {
          const story = rng.pick(SIGHTINGS);
          const atA = rng.pick([35, 40, 50, 55, 65, 75]);
          const atB = rng.pick([30, 45, 60, 70, 80].filter((v) => v !== atA && v + atA <= 140));
          const far = 180 - atA - atB;
          if (far === atA || far === atB) continue;      // keep the three angles different, so the table has three rows
          const d = rng.pick([5, 6, 8, 10, 12]);
          const exact = (d * sind(atB)) / sind(far);
          const sB = tabled(sind(atB));
          const sF = tabled(sind(far));
          const key = keyFor(exact, [
            (d * sB) / sF, roundTo(d / sF, 2) * sB, roundTo(d / sF, 1) * sB, roundTo(d * sB, 1) / sF, roundTo(d * sB, 2) / sF, d * roundTo(sB / sF, 3),
            roundTo(d / sind(far), 1) * sind(atB), roundTo(d * sind(atB), 1) / sind(far),     // the same two short cuts on a calculator
          ], 1);
          const fromB = (d * sind(atA)) / sind(far);
          const wrongPair = (d * sind(atB)) / sind(atA);
          if ([fromB, wrongPair, d].some((v) => Math.abs(v - key.answer) < 4 * key.tolerance + 0.1) || key.tolerance > 0.15) continue;
          // half of the calculation (which is nearly right when the far angle is close to 90°), the pair turned
          // round, or the angles used without their sines: none of these may pass as the answer, rounded or not
          const others = [d * sind(atB), d / sind(far), d * sind(atB) * sind(far), (d * sind(atA)) / sind(atB), (d * atB) / far];
          if (others.some((v) => Math.abs(v - key.answer) <= key.tolerance + 0.05)) continue;
          const b = (d * sind(atB)) / sind(far);
          return {
            text: `${story.text(d, atA, atB)}\n\n${trigTable([atA, atB, far].sort((u, v) => u - v), ['sin'])}\n\n**${story.ask}** Round to 1 decimal place.`,
            figure: triFigure({
              a: b, b: d, C: atA, names: ['B', story.thing, 'A'], sides: { a: '?', b: `${d} km` }, angles: { C: `${atA}°`, A: `${atB}°` },
              alt: `A triangle drawn to scale. Its bottom side A B is ${d} kilometres long. The angle at A is ${atA} degrees and the angle at B is ${atB} degrees. The third corner is the ${story.thing}, and the side from A to it is marked with a question mark.`,
            }),
            ...key,
            unit: story.unit,
            wrong: [
              [roundTo(fromB, 1), `That is the distance from B. The side from A to the ${story.thing} faces the angle at B, so it goes with sin ${atB}°.`],
              [roundTo(wrongPair, 1), `The ${d} km baseline faces the angle at the ${story.thing}, not the angle at A. Find that third angle first.`],
            ],
            hints: [
              `Find the third angle first, the one at the ${story.thing}: the three angles add up to 180°.`,
              r`The angle at the ${story.thing} is ${far}°, and it faces the ${d} km baseline: a matched pair. The side you want faces the ${atB}° angle.`,
              r`$\dfrac{?}{\sin ${atB}^\circ} = \dfrac{${d}}{\sin ${far}^\circ}$`,
            ],
            explain: r`The angle at the ${story.thing} is $180^\circ - ${atA}^\circ - ${atB}^\circ = ${far}^\circ$, and it faces the ${d} km baseline. The side from A faces the ${atB}° angle at B. So the distance is $\dfrac{${d} \times \sin ${atB}^\circ}{\sin ${far}^\circ} \approx \dfrac{${d} \times ${fixed(sind(atB))}}{${fixed(sind(far))}} \approx ${key.display}$ km.`,
          };
        }
        throw new Error('no clean variant found');
      },
    },
    {
      id: 'which-law',
      type: 'bucket',
      review: true,
      text: 'A triangle has no right angle. **Which law gets you started?**',
      buckets: ['Law of sines', 'Law of cosines'],
      items: [
        { text: 'Two sides and the angle between them are known. Find the third side.', bucket: 1, why: 'No side is paired with a known angle facing it, so the law of sines cannot start. The law of cosines is built for exactly this.' },
        { text: 'All three sides are known. Find an angle.', bucket: 1, why: 'With no angle known at all, only the law of cosines (rearranged for cos C) can start.' },
        { text: 'Two angles and a side facing one of them are known. Find the side facing the other.', bucket: 0, why: 'A side and the angle facing it make a matched pair: the law of sines.' },
        { text: 'A baseline and the angles at both of its ends are known. Find the distance to the far corner.', bucket: 0, why: 'The two angles give the third, which faces the baseline: a matched pair, so the law of sines.' },
        { text: 'Sides of 5 and 7 enclose an angle of 100°. Find the third side.', bucket: 1, why: 'Two sides and the angle between them: the law of cosines.' },
        { text: 'Angles of 40° and 60° are known, and the side facing the 40° angle is 9. Find the side facing the 60° angle.', bucket: 0, why: 'The side 9 and the 40° angle are a matched pair: the law of sines.' },
      ],
      explain: 'The law of sines needs a **matched pair**: a side and the angle facing it (two known angles always lead to one, because they give the third). With two sides and the angle between them, or with three sides, there is no pair to start from, and the law of cosines does the job.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        The law of cosines, $c^2 = a^2 + b^2 - 2ab\cos C$, is sometimes called "Pythagoras for every triangle".

        **In your own words: what does the extra term do, and why does it disappear in a right-angled triangle?**
      `,
      model: r`
        The term $2ab\cos C$ corrects Pythagoras for the angle between the two sides. When that angle
        is smaller than 90° the sides are folded together, the third side is shorter, and the term takes
        something away. When the angle is bigger than 90° the cosine is negative, so the term adds something on.

        At exactly 90° the cosine is 0. The correction is zero, and what is left is $c^2 = a^2 + b^2$.
      `,
    },
  ],
  recap: [
    r`**Law of cosines:** $c^2 = a^2 + b^2 - 2ab\cos C$. It is Pythagoras with a correction, and at 90° the correction is zero.`,
    r`**Law of sines:** $\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$. Each side is paired with the angle facing it.`,
    'Two sides and the angle between them, or three sides: cosines. A side with the angle facing it, plus another angle: sines.',
    'A baseline and two angles locate a point you cannot reach. That is triangulation.',
  ],
  next: 'That completes Trigonometry: Circles & Waves. One fact about similar triangles took you to the unit circle, to radians and waves, and back to triangles of every shape. Your review queue will keep it fresh.',
};
