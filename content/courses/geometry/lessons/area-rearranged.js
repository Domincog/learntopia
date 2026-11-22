// Geometry: Shape & Space · Lesson 3 · Cut and Rearrange
import { r, near, polygonArea, num } from '../../../kit.js';
import { gridFigure } from '../helpers.js';

const GRID_COLS = 8;
const GRID_ROWS = 5;

/** Do the painted cells of the warm-up grid form one solid rectangle? */
function paintedRectangle(on) {
  if (!on.length) return null;
  const rows = on.map((i) => Math.floor(i / GRID_COLS));
  const cols = on.map((i) => i % GRID_COLS);
  const tall = Math.max(...rows) - Math.min(...rows) + 1;
  const wide = Math.max(...cols) - Math.min(...cols) + 1;
  return tall * wide === on.length ? { tall, wide } : null;
}

// The fixed base of the "drag the top corner" triangle.
const TRI_A = { x: 2, y: 1 };
const TRI_B = { x: 8, y: 1 };

export default {
  id: 'area-rearranged',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Upright or leaning?',
      text: `
        Both shapes are 6 squares wide along the bottom and 4 squares tall. Shape B leans.

        **Which one covers more of the grid?**
      `,
      figure: gridFigure({
        cols: 18, rows: 6,
        shapes: [
          { pts: [[1, 1], [7, 1], [7, 5], [1, 5]], color: 'blue' },
          { pts: [[9, 1], [15, 1], [17, 5], [11, 5]], color: 'orange' },
        ],
        labels: [{ at: [4, 3], text: 'A', size: 'lg' }, { at: [13, 3], text: 'B', size: 'lg' }],
        alt: 'A grid of squares with two shapes. A is a rectangle 6 squares wide and 4 tall. B is a parallelogram with the same bottom edge length and height, leaning to the right.',
      }),
      shuffle: false,
      options: [
        { text: 'A, the upright one' },
        { text: 'B, the leaning one' },
        { text: 'They cover exactly the same amount', correct: true },
      ],
      explain: `
        Exactly the same: 24 squares each.

        Counting B directly is awkward, because its slanted sides slice through the squares.
        There is a much neater way to see it, and it works for far more than this one shape.
      `,
    },
    {
      id: 'count',
      type: 'interact',
      graded: false,
      title: 'Area means counting squares',
      text: `
        The **area** of a shape is the number of unit squares it covers.

        **Paint a rectangle that covers exactly 12 squares.** Tap the cells, or drag across them.
      `,
      widget: { type: 'grid', rows: GRID_ROWS, cols: GRID_COLS, cell: 46, colors: ['blue'], counter: 'Squares painted', alt: 'A grid of 5 rows and 8 columns of cells that can be painted.' },
      check: (s) => {
        const rect = paintedRectangle(s.on);
        if (rect && s.count === 12) return true;
        if (s.count < 12) return `You have painted ${s.count}. Keep going until you reach 12.`;
        if (s.count > 12) return `That is ${s.count} squares. Un-paint some until 12 are left.`;
        return 'Twelve squares, but not a rectangle yet. Every row needs the same number of squares, with no gaps.';
      },
      solution: { on: [10, 11, 12, 13, 18, 19, 20, 21, 26, 27, 28, 29] },
      explain: r`
        Whether you made 3 rows of 4, 2 rows of 6 or 4 rows of 3, nobody needs to count a rectangle one square at a time:
        multiply the number of rows by the number in each row.

        That is all $\text{area} = \text{width} \times \text{height}$ means.
      `,
    },
    {
      id: 'cut-slide',
      type: 'interact',
      title: 'A rectangle in disguise',
      text: `
        This parallelogram is 6 squares along the bottom and 4 squares tall, but its slanted
        sides cut through the squares, so they are hard to count.

        **Drag the [orange]{.orange} triangle** by its dot (or use the slider) from the left end to the right end.
      `,
      widget: {
        type: 'area-cut', shape: 'parallelogram', base: 6, height: 4, lean: 2, labels: false,
        alt: 'A parallelogram on a grid. A triangle is cut off its left end by a dashed vertical line.',
      },
      check: (s) => s.done || (s.t > 0 ? 'Keep going: slide the triangle all the way to the right-hand end.' : 'Drag the dot on the orange triangle, or the slider, to move it.'),
      solution: { t: 1 },
      explain: `
        Nothing was added and nothing was thrown away, so the area did not change.
        But now it is a rectangle, and rectangles are easy: 4 rows of 6.

        The parallelogram covers **24 squares**.
      `,
    },
    {
      id: 'base-height',
      type: 'info',
      title: 'Base times height',
      text: `
        The rectangle you made is exactly as wide as the parallelogram's **base**, and as tall as its
        **height**: the distance *straight up* from the base to the opposite side.

        :::key
        Area of a parallelogram = base × height
        :::

        The slanted side is **not** the height. It is longer, and the area does not depend on it.
      `,
      figure: {
        type: 'area-cut', shape: 'parallelogram', base: 6, height: 4, lean: 3, cut: false, slider: false, grid: false,
        labels: { base: 'base', height: 'height', side: 'slanted side' }, height_px: 250,
        alt: 'A parallelogram. Its bottom edge is labelled base. A dashed vertical line from the top edge straight down to the base is labelled height. The slanted left edge is labelled slanted side.',
      },
    },
    {
      id: 'example-parallelogram',
      type: 'info',
      title: 'Worked example: a parallelogram',
      text: `
        Pick out the base and the height, multiply them, and leave the slanted side alone.

        :::example
        1. The base is 20 m. The height is the dashed line: 15 m.
        2. Base × height: $20 \\times 15 = 300$ m².

        The slanted side, 17 m, is never used.
        :::

        The answer is in **m²**, square metres: the number of squares 1 m on each side that fit inside.
        Lengths in cm give an area in cm².
      `,
      figure: {
        type: 'area-cut', shape: 'parallelogram', base: 20, height: 15, lean: 8, cut: false, slider: false, grid: false,
        labels: { base: '20 m', height: '15 m', side: '17 m' }, height_px: 250,
        alt: 'A parallelogram with a base of 20 m, a slanted side of 17 m and a height of 15 m, shown by a dashed line at right angles to the base.',
      },
    },
    {
      id: 'parallelogram-area',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [h, lean, side] = rng.pick([[4, 3, 5], [3, 4, 5], [8, 6, 10], [6, 8, 10], [12, 5, 13]]);
        const b = lean + rng.intExcept(2, 7, [h - lean, side - lean]); // base differs from the height and the slanted side
        const u = rng.pick(['cm', 'm', 'mm']);
        return {
          text: 'Find the **area** of this parallelogram.',
          figure: {
            type: 'area-cut', shape: 'parallelogram', base: b, height: h, lean, cut: false, slider: false, grid: false,
            labels: { base: `${b} ${u}`, height: `${h} ${u}`, side: `${side} ${u}` }, height_px: 260,
            alt: `A parallelogram with a base of ${b} ${u}, a slanted side of ${side} ${u} and a height of ${h} ${u}, shown by a dashed line at right angles to the base.`,
          },
          answer: b * h,
          unit: `${u}²`,
          wrong: [
            [b * side, `That multiplies the base by the slanted side. The height is the dashed line, straight up from the base: ${h} ${u}.`],
            [2 * (b + side), 'That is the distance around the edge (the perimeter). Area counts the squares inside.'],
            [(b * h) / 2, 'Halving is for triangles. A parallelogram rearranges into a whole rectangle.'],
          ],
          hints: ['Which two measurements would the rearranged rectangle have?', `Base × height: $${b} \\times ${h}$.`],
          explain: `Base × height $= ${b} \\times ${h} = ${b * h}$ ${u}². The slanted side of ${side} ${u} is not needed.`,
        };
      },
    },
    {
      id: 'lean',
      type: 'multi',
      title: 'Lean it further',
      text: `
        **Drag the slider** to make this parallelogram lean more and more.

        Which of these measurements **change** as it leans?
      `,
      figure: {
        type: 'area-cut', shape: 'parallelogram', base: 5, height: 4, lean: 1, cut: false, slider: false,
        leanSlider: true, maxLean: 5, readouts: ['side', 'perimeter'],
        alt: 'A parallelogram on a grid with base 5 and height 4. A slider changes how far it leans; readouts show the length of the slanted side and the perimeter.',
      },
      options: [
        { text: 'The length of the slanted sides', correct: true },
        { text: 'The perimeter (the distance all the way round)', correct: true },
        { text: 'The height', why: 'The top edge slides sideways but stays 4 squares above the base. The height is measured straight up, not along the slant.' },
        { text: 'The area', why: 'It looks different, but area is base × height, and neither of those changes: still 5 × 4.' },
      ],
      hints: ['The readouts under the figure track two of these for you.', 'Which two measurements decide the area? Do they change while you drag?'],
      explain: r`
        Leaning stretches the slanted sides, so the perimeter grows. But the base is still 5 and
        the height is still 4, so the area is still $5 \times 4 = 20$ squares. Each row of the shape just slides sideways.

        Perimeter and area are different things: one can change while the other stays put.
      `,
    },
    {
      id: 'triangle-double',
      type: 'interact',
      title: 'Half a parallelogram',
      text: `
        Now a triangle, 6 squares along the base and 4 squares tall.

        Make a copy and turn it round: **drag the [orange]{.orange} dot** (or the slider) to swing
        the copy half a turn about the middle of the right-hand side.
      `,
      widget: {
        type: 'area-cut', shape: 'triangle', base: 6, height: 4, lean: 2,
        alt: 'A triangle on a grid with base 6 and height 4. A slider turns a copy of it about the midpoint of its right-hand side.',
      },
      check: (s) => s.done || (s.t > 0 ? 'Keep turning: the copy needs a full half turn.' : 'Drag the orange dot, or the slider, to swing the copy out from under the triangle.'),
      solution: { t: 1 },
      explain: r`
        Two identical triangles make a parallelogram with the same base and the same height.
        Its area is $6 \times 4 = 24$ squares, so one triangle is half of that: **12 squares**.
      `,
    },
    {
      id: 'teach-triangle-area',
      type: 'info',
      title: 'Half of base times height',
      text: r`
        Every triangle is half of a parallelogram with the same base and the same height.
        As before, the **height** is measured straight up from the base to the top corner, never along a side.

        :::key
        Area of a triangle = $\frac{1}{2}$ × base × height
        :::

        :::example
        Base 14 cm, height 5 cm. Multiply, then halve:
        $14 \times 5 = 70$, and half of 70 is 35.

        Area $= \frac{1}{2} \times 14 \times 5 = 35$ cm².
        :::
      `,
      figure: {
        // drawn at half size (7 by 2.5 squares) so that the picture is not tiny; the labels carry the real measurements
        type: 'area-cut', shape: 'triangle', base: 7, height: 2.5, lean: 2, slider: false, grid: false,
        labels: { base: '14 cm', height: '5 cm' }, height_px: 240,
        alt: 'A triangle with a base of 14 cm and a height of 5 cm, shown by a dashed line from the top corner at right angles to the base.',
      },
    },
    {
      id: 'triangle-area',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let b;
        let h;
        do { b = rng.int(4, 12); h = rng.int(3, 10); } while ((b * h) % 2 !== 0 || b === h || h > b + 3);
        const lean = rng.int(1, b - 1);
        const u = rng.pick(['cm', 'm', 'mm']);
        return {
          text: 'Find the **area** of this triangle.',
          figure: {
            type: 'area-cut', shape: 'triangle', base: b, height: h, lean, slider: false, grid: false,
            labels: { base: `${b} ${u}`, height: `${h} ${u}` }, height_px: 250,
            alt: `A triangle with a base of ${b} ${u} and a height of ${h} ${u}, shown by a dashed line from the top corner at right angles to the base.`,
          },
          answer: (b * h) / 2,
          unit: `${u}²`,
          wrong: [
            [b * h, 'That is the whole parallelogram made by two of these triangles. One triangle is half of it.'],
            [b + h, 'Multiply base by height, then halve.'],
            [(b + h) / 2, 'Multiply base by height, then halve.'],
          ],
          hints: ['Two copies of this triangle make a parallelogram. What is its area?', `Half of $${b} \\times ${h}$.`],
          explain: `Half of base × height: $\\frac{1}{2} \\times ${b} \\times ${h} = ${num((b * h) / 2)}$ ${u}².`,
        };
      },
    },
    {
      id: 'apex',
      type: 'interact',
      title: 'Same base, same height',
      text: `
        The base AB of this triangle is fixed: 6 units long.

        **Drag C** to make a triangle with an area of exactly **15** square units.
      `,
      widget: {
        type: 'geo', x: [0, 10], y: [0, 7], grid: true, gridStep: 1,
        alt: 'A triangle on a grid. Its base AB is 6 units long and fixed. The top corner C can be dragged to any grid point.',
        points: {
          A: { ...TRI_A }, B: { ...TRI_B },
          C: { x: 4, y: 4, drag: true, snap: 1, color: 'orange', constrain: (p) => ({ x: p.x, y: Math.max(2, p.y) }) },
          F: { derive: (P) => ({ x: P.C.x, y: 1 }), hidden: true },
        },
        shapes: [
          { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },
          { kind: 'segment', pts: ['C', 'F'], dashed: true },
          { kind: 'right', pts: ['C', 'F', 'B'], size: 12 },
        ],
        readouts: [
          { label: 'base', value: () => 6, digits: 0 },
          { label: 'height', value: (g) => g.P.C.y - 1, digits: 0 },
        ],
      },
      check: (s) => {
        const area = polygonArea([TRI_A, TRI_B, s.C]);
        if (near(area, 15, 0.01)) return true;
        const h = s.C.y - 1;
        return `That triangle has height ${h}, so its area is ½ × 6 × ${h} = ${num(area)}. You need 15.`;
      },
      solution: { C: { x: 5, y: 6 } },
      hints: ['Area = ½ × base × height, and the base is 6. What height gives 15?', 'Half of 6 is 3, and 3 × 5 = 15. Put C five squares above the base.'],
      explain: r`
        C has to be 5 units above the base: $\frac{1}{2} \times 6 \times 5 = 15$.

        But it can be **anywhere** at that height, even far off to one side. Sliding the top corner
        sideways changes the triangle's shape, not its base or its height, so not its area.
      `,
    },
    {
      id: 'trapezium',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const top = rng.int(2, 4);
        const b = top + rng.int(3, 5);
        const h = 4;
        const lean = rng.int(1, 2);
        return {
          text: `
            A **trapezium** (called a trapezoid in North America) has one pair of parallel sides.

            Turn the copy (drag its dot, or the slider) to see what two of them make. Then find the **area of one trapezium**, in squares.
          `,
          figure: {
            type: 'area-cut', shape: 'trapezium', base: b, top, height: h, lean,
            alt: `A trapezium on a grid. Its parallel sides are ${b} and ${top} squares long and it is ${h} squares tall. A slider turns a copy of it about the midpoint of its right-hand side.`,
          },
          answer: ((b + top) * h) / 2,
          unit: 'squares',
          wrong: [
            [(b + top) * h, 'That is the whole parallelogram, made of *two* trapeziums. Halve it.'],
            [b * h, `Only the bottom side is ${b} long. Two copies make a parallelogram whose base is ${b} + ${top}.`],
            [(b * h) / 2, `Two copies make a parallelogram whose base is ${b} + ${top}, not ${b}.`],
          ],
          hints: [
            'Swing the copy all the way round. How long is the base of the big parallelogram?',
            `Its base is $${b} + ${top} = ${b + top}$ and its height is ${h}. One trapezium is half of it.`,
          ],
          explain: `
            Two copies make a parallelogram with base $${b} + ${top} = ${b + top}$ and height ${h}: $${b + top} \\times ${h} = ${(b + top) * h}$ squares.
            One trapezium is half: **${num(((b + top) * h) / 2)} squares**.

            In words: half the sum of the parallel sides, times the height.
          `,
        };
      },
    },
    {
      id: 'compare',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const b = rng.int(4, 10);
        const h = rng.int(3, 8);
        const kind = rng.pick(['equal', 'equal', 'parallelogram', 'triangle']);
        let tb = b;
        let th = h;
        if (kind === 'equal') { if (rng.bool()) th = 2 * h; else tb = 2 * b; }
        else if (kind === 'parallelogram') { if (rng.bool()) th = h + rng.int(1, h - 1); else tb = b + rng.int(1, b - 1); }
        else { tb = 2 * b + rng.int(1, 3); }
        const pArea = b * h;
        const tArea = (tb * th) / 2;
        const sums = `Parallelogram: $${b} \\times ${h} = ${pArea}$ cm². Triangle: $\\frac{1}{2} \\times ${tb} \\times ${th} = ${num(tArea)}$ cm².`;
        return {
          text: `
            A parallelogram has base ${b} cm and height ${h} cm.
            A triangle has base ${tb} cm and height ${th} cm.

            **Which has the larger area?**
          `,
          options: [
            { text: 'The parallelogram', correct: kind === 'parallelogram', why: kind === 'parallelogram' ? undefined : `Work both out. ${sums}` },
            { text: 'The triangle', correct: kind === 'triangle', why: kind === 'triangle' ? undefined : `Remember to halve for the triangle. ${sums}` },
            { text: 'They are exactly equal', correct: kind === 'equal', why: kind === 'equal' ? undefined : `Not quite equal. ${sums}` },
          ],
          explain: `${sums} A triangle is half of the parallelogram with the same base and height.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A parallelogram and a rectangle have the same base and the same height.

        Without using a formula, how would you convince a friend that their areas must be equal?
      `,
      model: `
        Cut off the triangle that sticks out at one end of the parallelogram and slide it to the other end.
        Nothing is added and nothing is lost, and the pieces now make exactly the rectangle.

        Same pieces, so the same area.
      `,
    },
  ],
  recap: [
    'Area counts unit squares. Cutting a shape up and rearranging the pieces does not change it.',
    'A parallelogram rearranges into a rectangle: area = **base × height**.',
    'The height is measured straight up from the base, never along a slanted side.',
    'Two copies of a triangle make a parallelogram: area = **½ × base × height**.',
  ],
  next: 'Next: the most famous theorem in geometry, proved by sliding four triangles.',
};
