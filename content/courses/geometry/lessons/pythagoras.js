// Geometry: Shape & Space · Lesson 4 · Squares on the Sides
import { r, num, round } from '../../../kit.js';
import { rightTriangleFigure } from '../helpers.js';

const TRIPLES = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17],
  [12, 16, 20], [7, 24, 25], [10, 24, 26], [20, 21, 29], [15, 20, 25],
];
// [foot, reach, ladder] in metres: Pythagorean triples scaled down
const LADDERS = [[0.7, 2.4, 2.5], [2.5, 6, 6.5], [1.5, 3.6, 3.9], [1, 2.4, 2.6], [0.9, 4, 4.1], [2, 4.8, 5.2], [1.4, 4.8, 5]];
// [name, width, height] in cm
const SCREENS = [['phone', 7, 15], ['tablet', 24, 16], ['laptop', 31, 19], ['monitor', 53, 30], ['television', 110, 62]];
const RIGHT_SETS = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29]];
const NOT_RIGHT_SETS = [[4, 5, 6], [5, 6, 8], [2, 3, 4], [6, 7, 9], [8, 9, 12], [5, 10, 12], [7, 10, 12], [4, 6, 7]];

const WALK = {
  type: 'svg', viewBox: '0 0 360 232', maxWidth: 380,
  alt: 'A walk seen from above: 3 km east, then 4 km north, turning through a right angle. A dashed straight line joins the start to the finish and is marked with a question mark.',
  content:
    '<path class="stroke-ink fill-none" stroke-width="2.5" stroke-dasharray="7 7" stroke-linecap="round" d="M80 196 L200 36"/>' +
    '<path class="stroke-blue fill-none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M80 196 H200 V36"/>' +
    '<path class="stroke-ink fill-none" stroke-width="2" d="M186 196 v-14 h14"/>' +
    '<circle class="fill-orange stroke-ink" stroke-width="2.5" cx="80" cy="196" r="8"/>' +
    '<circle class="fill-green stroke-ink" stroke-width="2.5" cx="200" cy="36" r="8"/>' +
    '<text class="fig-label" x="140" y="220" text-anchor="middle">3 km</text>' +
    '<text class="fig-label" x="214" y="121" text-anchor="start">4 km</text>' +
    '<text class="fig-label-lg" x="120" y="106" text-anchor="middle">?</text>' +
    '<text class="fig-label-sm" x="64" y="182" text-anchor="end">start</text>' +
    '<text class="fig-label-sm" x="216" y="32" text-anchor="start">finish</text>',
};

function ladderFigure(foot, reach, ladder) {
  const k = 150 / Math.max(foot, reach);
  const fx = 262 - Math.max(56, foot * k);
  const ty = 204 - reach * k;
  const mx = (fx + 262) / 2;
  const my = (204 + ty) / 2;
  return {
    type: 'svg', viewBox: '0 0 360 236', maxWidth: 380,
    alt: `A ladder ${ladder} m long leaning against a vertical wall. Its foot is ${foot} m from the wall. The height it reaches up the wall is marked with a question mark.`,
    content:
      '<rect class="fill-gray-soft stroke-ink" stroke-width="2.5" x="262" y="24" width="26" height="180"/>' +
      '<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" d="M40 204 H330"/>' +
      `<path class="stroke-orange fill-none" stroke-width="7" stroke-linecap="round" d="M${fx} 204 L262 ${ty}"/>` +
      '<path class="stroke-ink fill-none" stroke-width="2" d="M250 204 v-12 h12"/>' +
      `<text class="fig-label" x="${mx - 12}" y="${my - 8}" text-anchor="end">${ladder} m</text>` +
      `<text class="fig-label" x="${mx}" y="224" text-anchor="middle">${foot} m</text>` +
      `<path class="stroke-ink fill-none" stroke-width="2" stroke-dasharray="5 5" d="M304 204 V${ty}"/>` +
      `<path class="stroke-ink fill-none" stroke-width="2" stroke-linecap="round" d="M298 204 h12 M298 ${ty} h12"/>` +
      `<text class="fig-label-lg" x="324" y="${my + 6}" text-anchor="middle">?</text>`,
  };
}

function screenFigure(name, w, h) {
  const k = Math.min(210 / w, 140 / h);
  const pw = w * k;
  const ph = h * k;
  const x0 = 164 - pw / 2;
  const y0 = 96 - ph / 2;
  return {
    type: 'svg', viewBox: '0 0 360 212', maxWidth: 380,
    alt: `A ${name} screen ${w} cm wide and ${h} cm tall, with a dashed diagonal marked with a question mark.`,
    content:
      `<rect class="fill-blue-soft stroke-ink" stroke-width="3" x="${x0}" y="${y0}" width="${pw}" height="${ph}" rx="8"/>` +
      `<path class="stroke-ink fill-none" stroke-width="2.5" stroke-dasharray="7 6" stroke-linecap="round" d="M${x0 + 4} ${y0 + ph - 4} L${x0 + pw - 4} ${y0 + 4}"/>` +
      `<text class="fig-label" x="164" y="${y0 + ph + 20}" text-anchor="middle">${w} cm</text>` +
      `<text class="fig-label" x="${x0 + pw + 12}" y="${96 + 5}" text-anchor="start">${h} cm</text>` +
      `<text class="fig-label-lg" x="${164 - 14}" y="${96 - 8}" text-anchor="middle">?</text>`,
  };
}

const SQUARES = {
  type: 'geo', x: [-4.6, 8.6], y: [-4.6, 8.6], height: 500, grid: true, gridStep: 1,
  alt: 'A right-angled triangle on a grid with a square built on each of its three sides. The area of each square is written inside it. Corners A and B can be dragged to change the two shorter sides.',
  points: {
    C: { x: 0, y: 0, label: false },
    A: { x: 2, y: 0, drag: true, snap: 1, lockY: true, color: 'orange', constrain: (p) => ({ x: Math.max(1, Math.min(4, p.x)), y: 0 }) },
    B: { x: 0, y: 2, drag: true, snap: 1, lockX: true, color: 'violet', constrain: (p) => ({ x: 0, y: Math.max(1, Math.min(4, p.y)) }) },
  },
  shapes: [
    { kind: 'square', pts: ['C', 'A'], color: 'orange', label: 'area' },
    { kind: 'square', pts: ['B', 'C'], color: 'violet', label: 'area' },
    { kind: 'square', pts: ['A', 'B'], color: 'green', label: 'area' },
    { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },
    { kind: 'right', pts: ['A', 'C', 'B'], size: 12 },
  ],
};

export default {
  id: 'pythagoras',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'The shortcut home',
      text: `
        You walk 3\u00A0km east, then turn and walk 4\u00A0km north.

        In a straight line, **how far are you from where you started?**
      `,
      figure: WALK,
      min: 3, max: 8, step: 0.5, start: 3, answer: 5, tolerance: 0, unit: 'km',
      explain: `
        Exactly 5\u00A0km. Not 7\u00A0km (that is how far you walked), and not something you
        could get by adding or subtracting 3 and 4.

        The three sides of a right-angled triangle are tied together by a hidden rule. Time to find it.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'A square on every side',
      text: `
        A right-angled triangle, with a square built on each side. The number inside each square is its **area**.

        **Drag A and B** to change the triangle. Make the two smaller squares **9** and **16**, then look at the big one.
      `,
      widget: SQUARES,
      check: (s) => {
        const legs = [s.A.x, s.B.y].sort((p, q) => p - q);
        if (legs[0] === 3 && legs[1] === 4) return true;
        return `The two smaller squares are ${s.A.x * s.A.x} and ${s.B.y * s.B.y} right now. Drag A and B until they read 9 and 16.`;
      },
      solution: { A: { x: 4, y: 0 }, B: { x: 0, y: 3 } },
      hints: ['A square of area 9 has sides of 3. A square of area 16 has sides of 4.'],
      explain: `
        9 and 16 on the two shorter sides, **25** on the longest. And 9 + 16 = 25.

        That is the 3 km, 4 km, 5 km walk: a square of area 25 has sides of 5. But is it a coincidence?
      `,
    },
    {
      id: 'pattern',
      type: 'choice',
      text: `
        Three rules all fit the squares 9, 16 and 25. Only one survives when you change the triangle.

        **Drag A and B, test them, and pick the rule that is always true.**
      `,
      figure: SQUARES,
      options: [
        { text: 'The two smaller squares add up to the biggest square', correct: true },
        { text: 'The biggest square is 9 more than the middle one', why: 'True for 9, 16 and 25. Now try sides of 2 and 2: the squares are 4, 4 and 8.' },
        { text: 'The three squares always add up to 50', why: 'True for 9 + 16 + 25. Drag a corner and watch the total change.' },
      ],
      hints: ['Try a few different triangles and write down the three areas each time.'],
      explain: `
        Whatever right-angled triangle you make, [orange]{.orange} + [violet]{.violet} = [green]{.green}:

        | Smaller squares | Biggest square |
        |:---------------:|:--------------:|
        | 1 and 1 | 2 |
        | 4 and 9 | 13 |
        | 9 and 16 | 25 |
        | 16 and 16 | 32 |
      `,
    },
    {
      id: 'theorem',
      type: 'info',
      title: "Pythagoras' theorem",
      text: r`
        The longest side of a right-angled triangle, the one facing the right angle, is called the
        **hypotenuse**. Call it $c$, and call the two shorter sides $a$ and $b$.

        A square with side $a$ has area $a \times a$, written $a^2$ ("$a$ squared"). So the pattern you found says:

        :::key
        $$a^2 + b^2 = c^2$$
        :::

        The rule is named after Pythagoras, who lived about 2,500 years ago, although
        Babylonian scribes were already using it a thousand years before him.
      `,
      figure: rightTriangleFigure({
        a: 4, b: 3, labels: ['a', 'b', 'c'], height: 230,
        alt: 'A right-angled triangle. The two sides that meet at the right angle are labelled a and b, and the longest side, opposite the right angle, is labelled c.',
      }),
    },
    {
      id: 'proof',
      type: 'interact',
      title: 'Why it can never fail',
      text: r`
        Checking examples is not the same as knowing *why*. Here is why.

        Four copies of one right-angled triangle sit in a square frame.
        The part they leave uncovered is a tilted square on the hypotenuse: area $c^2$.

        **Drag the slider** to slide three of the triangles, and watch the uncovered part.
      `,
      widget: {
        type: 'pythagoras-proof', a: 3, b: 4,
        alt: 'A square frame containing four copies of a right-angled triangle with sides 3, 4 and 5.',
      },
      check: (s) => s.done || (s.t > 0 ? 'Keep sliding until all three triangles have moved.' : 'Drag the slider to start moving the triangles.'),
      solution: { t: 1 },
      explain: r`
        The frame did not change. The four triangles did not change. So the uncovered area cannot have changed either.

        Before, it was one square: $c^2$. Afterwards, it is two squares: $a^2$ and $b^2$.

        $$a^2 + b^2 = c^2$$
      `,
    },
    {
      id: 'proof-logic',
      type: 'choice',
      text: 'That sliding picture used a triangle with sides 3, 4 and 5. **Why does it settle the question for every right-angled triangle?**',
      options: [
        { text: 'The same slide works for any two short sides: the frame and the triangles never change, so the uncovered area cannot change', correct: true },
        { text: 'Because 9 + 16 = 25', why: 'That checks one triangle. A check is not a reason, and it says nothing about a triangle with sides 2 and 7.' },
        { text: 'The triangles shrink a little as they slide, making room for the two squares', why: 'Nothing is resized. They are the same four triangles, only moved.' },
        { text: 'It does not: you would have to test every triangle separately', why: 'Nothing in the argument depends on the numbers 3 and 4. Any two lengths would slide the same way.' },
      ],
      columns: 1,
      explain: r`
        Nothing in the argument used the numbers. For any short sides $a$ and $b$, four triangles fit
        a frame of side $a + b$, and the uncovered area is $c^2$ in one arrangement and $a^2 + b^2$ in the other.
      `,
    },
    {
      id: 'example-hypotenuse',
      type: 'info',
      title: 'Worked example: the longest side',
      text: r`
        To find a hypotenuse, add the two squares, then undo the squaring.
        The **square root** $\sqrt{2500}$ means the number whose square is 2500.

        :::example
        The two shorter sides are 30 cm and 40 cm.

        1. Square them: $30^2 = 900$ and $40^2 = 1600$.
        2. Add: $900 + 1600 = 2500$. That is $c^2$.
        3. Take the square root: $c = \sqrt{2500} = 50$ cm, because $50 \times 50 = 2500$.
        :::

        A quick check: the hypotenuse is the longest side, but shorter than $30 + 40$.
      `,
      figure: rightTriangleFigure({
        a: 40, b: 30, labels: ['40 cm', '30 cm', '?'], height: 240,
        alt: 'A right-angled triangle. The two sides that meet at the right angle are 40 cm and 30 cm. The longest side is marked with a question mark.',
      }),
    },
    {
      id: 'hypotenuse',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [p, q, c] = rng.pick(TRIPLES);
        const [a, b] = rng.bool() ? [p, q] : [q, p];
        const u = rng.pick(['cm', 'm', 'mm']);
        return {
          text: 'Find the length of the **longest side** of this right-angled triangle.',
          figure: rightTriangleFigure({
            a, b, labels: [`${a} ${u}`, `${b} ${u}`, '?'], flip: rng.bool(),
            alt: `A right-angled triangle. The two sides that meet at the right angle are ${a} ${u} and ${b} ${u}. The longest side is marked with a question mark.`,
          }),
          answer: c,
          unit: u,
          wrong: [
            [a + b, `Adding the sides gives the distance round the corner. Add their **squares**: $${a}^2 + ${b}^2$.`],
            [a * a + b * b, r`That is $c^2$, the area of the square on the longest side. Take its square root to get the side.`],
          ],
          hints: [
            r`Square the two shorter sides and add: that gives $c^2$.`,
            `$${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}$. Which number, squared, makes ${c * c}?`,
          ],
          explain: `$c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}$, so $c = \\sqrt{${c * c}} = ${c}$ ${u}.`,
        };
      },
    },
    {
      id: 'example-leg',
      type: 'info',
      title: 'Worked example: a shorter side',
      text: r`
        When the hypotenuse is one of the sides you know, the missing square is what is left over:
        **subtract** instead of adding.

        :::example
        The hypotenuse is 41 m and one shorter side is 40 m.

        1. Square both: $41^2 = 1681$ and $40^2 = 1600$.
        2. Subtract: $1681 - 1600 = 81$. That is the square on the missing side.
        3. Take the square root: $\sqrt{81} = 9$ m, because $9 \times 9 = 81$.
        :::

        The answer must come out shorter than the hypotenuse. If it does not, you added.
      `,
      figure: rightTriangleFigure({
        a: 40, b: 9, labels: ['40 m', '?', '41 m'], height: 240,
        alt: 'A right-angled triangle. The longest side is 41 m and one of the shorter sides is 40 m. The other shorter side is marked with a question mark.',
      }),
    },
    {
      id: 'leg',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [p, q, c] = rng.pick(TRIPLES);
        const [known, missing] = rng.bool() ? [p, q] : [q, p];
        const u = rng.pick(['cm', 'm', 'mm']);
        const horizontalKnown = rng.bool();
        const tooBig = Math.hypot(c, known);
        return {
          text: 'The longest side of this right-angled triangle is known. Find the side marked **?**',
          figure: rightTriangleFigure({
            a: horizontalKnown ? known : missing, b: horizontalKnown ? missing : known,
            labels: horizontalKnown ? [`${known} ${u}`, '?', `${c} ${u}`] : ['?', `${known} ${u}`, `${c} ${u}`],
            flip: rng.bool(),
            alt: `A right-angled triangle. The longest side is ${c} ${u} and one of the shorter sides is ${known} ${u}. The other shorter side is marked with a question mark.`,
          }),
          answer: missing,
          unit: u,
          wrong: [
            [c - known, `Subtract the **squares**, not the sides: $${c}^2 - ${known}^2$.`],
            [c * c - known * known, 'That is the square of the missing side. Take its square root.'],
          ],
          feedback: (v) => (Math.abs(v - tooBig) < 0.06
            ? `You added the squares. But ${c} ${u} is already the longest side, so the missing side must be shorter: subtract instead.`
            : v >= c ? `The hypotenuse, ${c} ${u}, is the longest side. The missing side has to be shorter than that.` : null),
          hints: [
            r`$a^2 + b^2 = c^2$, and here you know $c$. So the missing square is $c^2$ minus the square you know.`,
            `$${c}^2 - ${known}^2 = ${c * c} - ${known * known} = ${missing * missing}$. Now take the square root.`,
          ],
          explain: `The squares on the two shorter sides add up to $${c}^2 = ${c * c}$. So the missing square is $${c * c} - ${known * known} = ${missing * missing}$, and the side is $\\sqrt{${missing * missing}} = ${missing}$ ${u}.`,
        };
      },
    },
    {
      id: 'in-the-world',
      type: 'numeric',
      title: 'Out in the world',
      gen: (rng) => {
        if (rng.bool()) {
          const [name, w, h] = rng.pick(SCREENS);
          const d = Math.hypot(w, h);
          const answer = round(d, 1);
          return {
            text: `
              Screen sizes are measured along the **diagonal**.

              A ${name} screen is ${w} cm wide and ${h} cm tall. How long is its diagonal?
              Give your answer to 1 decimal place. (This square root is not a whole number: use a calculator.)
            `,
            figure: screenFigure(name, w, h),
            answer,
            tolerance: 0.06,
            unit: 'cm',
            feedback: (v) => (Math.abs(v - (w + h)) < 0.01 ? 'That adds the two sides. Add their squares, then take the square root.'
              : Math.abs(v - (w * w + h * h)) < 0.5 ? 'That is the diagonal squared. Take the square root.' : null),
            hints: [
              'The width, the height and the diagonal make a right-angled triangle. Which one is the hypotenuse?',
              `$${w}^2 + ${h}^2 = ${w * w + h * h}$. Use a calculator for the square root.`,
            ],
            explain: `The diagonal is the hypotenuse: $\\sqrt{${w}^2 + ${h}^2} = \\sqrt{${w * w + h * h}} \\approx ${num(answer)}$ cm.`,
          };
        }
        const [foot, reach, ladder] = rng.pick(LADDERS);
        const tooBig = Math.hypot(ladder, foot);
        return {
          text: `
            A ladder ${ladder} m long leans against a wall. Its foot is ${foot} m from the wall.

            **How high up the wall does it reach?** (A calculator helps with the squares.)
          `,
          figure: ladderFigure(foot, reach, ladder),
          answer: reach,
          tolerance: 0.011,
          unit: 'm',
          feedback: (v) => (Math.abs(v - tooBig) < 0.06 ? 'You added the squares. But the ladder is the hypotenuse here: it is already the longest side.'
            : Math.abs(v - (ladder - foot)) < 0.011 ? 'Subtract the squares, not the lengths.' : null),
          hints: [
            'The ladder, the wall and the ground make a right-angled triangle. Which side is the hypotenuse?',
            `The ladder is the hypotenuse, so the missing square is $${ladder}^2 - ${foot}^2 = ${num(ladder * ladder)} - ${num(foot * foot)}$.`,
          ],
          explain: `The ladder is the hypotenuse: $${ladder}^2 - ${foot}^2 = ${num(ladder * ladder)} - ${num(foot * foot)} = ${num(reach * reach)}$, and $\\sqrt{${num(reach * reach)}} = ${reach}$ m.`,
        };
      },
    },
    {
      id: 'converse',
      type: 'bucket',
      stretch: true,
      review: true,
      gen: (rng) => {
        const item = ([a, b, c], bucket) => ({
          text: `${a}, ${b}, ${c}`,
          bucket,
          why: bucket === 0
            ? `Check it: ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}, and ${c}² = ${c * c} as well. It has a right angle.`
            : `Check it: ${a}² + ${b}² = ${a * a + b * b}, but ${c}² = ${c * c}. Not equal, so no right angle.`,
        });
        const story = rng.pick([
          'A carpenter measures the three sides of six triangular frames.',
          'Six triangles are described only by the lengths of their sides.',
          'A surveyor writes down the side lengths of six triangular plots.',
        ]);
        return {
          text: `
            The theorem also works backwards. If $a^2 + b^2 = c^2$ for the three sides of a triangle
            ($c$ being the longest), the triangle **must** have a right angle. If not, it cannot.

            ${story} **Which have a right angle?**
          `,
          items: [...rng.sample(RIGHT_SETS, 3).map((set) => item(set, 0)), ...rng.sample(NOT_RIGHT_SETS, 3).map((set) => item(set, 1))],
        };
      },
      buckets: ['Has a right angle', 'No right angle'],
      explain: r`
        Square the two shorter sides, add, and compare with the square of the longest side.
        Equal means a right angle; anything else means there is none.

        Builders use this to make corners square: measure 3 along one edge, 4 along the other, and adjust until the diagonal is exactly 5.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        Think back to the four triangles sliding around inside the square frame.

        In your own words: how does that picture show that $a^2 + b^2 = c^2$?
      `,
      model: r`
        The frame and the four triangles stay the same, so the area left uncovered must stay the same too.

        In the first arrangement the uncovered part is one square on the hypotenuse: $c^2$.
        After sliding, it is two squares, one on each shorter side: $a^2 + b^2$.
        The same area written two ways, so they are equal.
      `,
    },
  ],
  recap: [
    'In a right-angled triangle, the squares on the two shorter sides add up to the square on the longest: $a^2 + b^2 = c^2$.',
    'Four triangles sliding inside a square frame show why it has to be true.',
    'Longest side: add the squares, then take the square root. Shorter side: subtract the squares first.',
    'It works backwards too: if $a^2 + b^2 = c^2$, the triangle has a right angle.',
  ],
  next: 'Next: roll a wheel along a ruler and meet the most famous number in mathematics.',
};
