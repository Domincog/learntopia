// Calculus in Pictures · Lesson 4 · Adding Up Slices
import { r, num, sum, round } from '../../../kit.js';
import { table } from '../helpers.js';

// The curved speed graph used through this lesson: v = t² m/s for 0 ≤ t ≤ 3.
// Left total with n rectangles: 9 − 13.5/n + 4.5/n². Right total: the left total + 27/n. True area: 9.
const AXES = { x: [0, 3.8], y: [0, 10], xStep: 1, yStep: 2, xLabel: 'time (s)', yLabel: 'speed (m/s)' };
const CURVE = [{ expr: 'x^2', from: 0, to: 3, color: 'blue' }];

export default {
  id: 'area-under-curves',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Where is the distance hiding?',
      text: `
        A car cruises at a steady **20 m/s** for **4 seconds**. Distance is
        speed × time, so it covers 80 m. Easy.

        Here is its speed–time graph. **Where in the picture can you see the 80?**
      `,
      figure: {
        type: 'plot', x: [0, 6], y: [0, 26], xStep: 1, yStep: 5, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        fns: [{ expr: '20', from: 0, to: 4, color: 'blue' }],
        segments: [{ from: [4, 0], to: [4, 20], color: 'gray', dashed: true }],
        alt: 'A speed–time graph: a level line at 20 metres per second from 0 to 4 seconds.',
      },
      columns: 1,
      options: [
        { text: 'In the height of the line' },
        { text: 'In the length of the line' },
        { text: 'In the area of the rectangle under the line', correct: true },
        { text: 'In the slope of the line' },
      ],
      explain: `
        The rectangle under the line is 4 s wide and 20 m/s tall.
        Width × height = 4 × 20 = 80: exactly time × speed.

        Even the units agree: seconds × metres per second = metres. On a
        speed–time graph, **distance is area**.
      `,
    },
    {
      id: 'teach-area-shapes',
      type: 'info',
      title: 'Distance is area',
      text: r`
        A steady speed gives a rectangle: its width is the time, its height
        is the speed. The same works when the speed changes (the reason is
        coming up). A speed that climbs steadily from zero gives a
        **triangle**: half of the rectangle drawn round it.

        :::key
        Area of a triangle $= \tfrac12 \times \text{base} \times \text{height}$
        :::

        :::example
        A cyclist speeds up steadily from 0 to 12 m/s in 6 seconds. The
        triangle under the graph has base 6 and height 12:

        $$ \tfrac12 \times 6 \times 12 = 36\ \text{m} $$
        :::
      `,
      figure: {
        type: 'plot', x: [0, 8], y: [0, 15], xStep: 1, yStep: 3, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        fns: [{ expr: '2x', from: 0, to: 6, color: 'blue' }],
        areas: [{ fn: 0, from: 0, to: 6, color: 'blue' }],
        segments: [
          { from: [0, 12], to: [6, 12], color: 'gray', dashed: true },
          { from: [6, 0], to: [6, 12], color: 'gray', dashed: true },
        ],
        labels: [
          { x: 3, y: 0, text: 'base 6 s', dx: 0, dy: -10, anchor: 'middle' },
          { x: 6, y: 6, text: 'height 12 m/s', dx: 10, dy: 5, anchor: 'start' },
        ],
        alt: 'A speed–time graph: a straight line rising from 0 to 12 metres per second over 6 seconds. The triangle under it is shaded, and a dashed outline shows the rectangle it is half of.',
      },
    },
    {
      id: 'triangle',
      type: 'numeric',
      text: `
        A second car speeds up steadily from 0 to 20 m/s during the same
        4 seconds.

        If distance is still the area under the graph, **how far does this car go?**
      `,
      figure: {
        type: 'plot', x: [0, 6], y: [0, 26], xStep: 1, yStep: 5, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        fns: [{ expr: '5x', from: 0, to: 4, color: 'blue' }],
        areas: [{ fn: 0, from: 0, to: 4, color: 'blue' }],
        alt: 'A speed–time graph: a straight line rising from 0 to 20 metres per second over 4 seconds. The triangle under it is shaded.',
      },
      answer: 40,
      unit: 'm',
      wrong: [
        [80, 'That is the whole 4 × 20 rectangle: the distance at a steady 20 m/s. This car was slower than that until the very last instant.'],
        [20, '20 m/s is the final speed. The distance is the *area* of the shaded triangle.'],
      ],
      hints: ['The shaded region is a triangle. Its area is ½ × base × height.'],
      explain: r`
        $\tfrac12 \times 4 \times 20 = 40$ m: half of the first car's 80 m.

        That makes sense. Speeding up steadily from 0 to 20 m/s, the car
        averages 10 m/s, and $10 \times 4 = 40$.
      `,
    },
    {
      id: 'example-split',
      type: 'info',
      title: 'Split the shape',
      text: r`
        Most speed graphs made of straight pieces are neither one rectangle
        nor one triangle. Cut the region under the graph into shapes you
        know, then add their areas.

        :::example
        A bus speeds up steadily from 3 m/s to 9 m/s over 4 seconds.

        - Rectangle underneath: $4 \times 3 = 12$
        - Triangle on top: $\tfrac12 \times 4 \times 6 = 12$. Its height is the speed *gained*, $9 - 3$.

        Distance: $12 + 12 = 24$ m.
        :::

        A graph with one level piece and one sloping piece works the same
        way: a rectangle beside a triangle.
      `,
      figure: {
        type: 'plot', x: [0, 5.6], y: [0, 11], xStep: 1, yStep: 3, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        fns: [{ expr: '3 + 1.5x', from: 0, to: 4, color: 'blue' }],
        areas: [{ fn: 0, from: 0, to: 4, color: 'blue' }],
        segments: [
          { from: [0, 3], to: [4, 3], color: 'ink', dashed: true },
          { from: [4, 0], to: [4, 9], color: 'gray', dashed: true },
        ],
        labels: [
          { x: 2, y: 1.5, text: 'rectangle 4 × 3', dx: 0, dy: 5, anchor: 'middle' },
          { x: 2.9, y: 4.6, text: 'triangle', dx: 0, dy: 5, anchor: 'middle' },
          { x: 4, y: 6, text: 'gain 6', dx: 10, dy: 5, anchor: 'start' },
        ],
        alt: 'A speed–time graph: a straight line rising from 3 to 9 metres per second over 4 seconds. A dashed level line at 3 metres per second splits the shaded region under it into a rectangle, 4 wide and 3 tall, with a triangle on top, 4 wide and 6 tall.',
      },
    },
    {
      id: 'straight-pieces',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(['A tram', 'A cyclist', 'A delivery van', 'A scooter']);
        const it = who.replace(/^A /, 'the ');
        const kind = rng.pick(['ramp', 'cruise-brake', 'start-cruise']);
        const v = rng.pick([6, 8, 10, 12, 14, 16]);
        const axes = { xStep: 2, yStep: 4, xLabel: 'time (s)', yLabel: 'speed (m/s)' };
        if (kind === 'ramp') {
          const u = rng.pick([2, 4].filter((s) => s < v));
          const T = rng.pick([4, 5, 6, 8, 10]);
          const answer = (T * (u + v)) / 2;
          return {
            text: `${who} speeds up steadily from ${u} m/s to ${v} m/s over ${T} seconds. **How far does it travel in that time?**`,
            figure: {
              type: 'plot', x: [0, Math.ceil(T * 1.3)], y: [0, v + 4], ...axes,
              fns: [{ expr: `${u} + ${(v - u) / T}*x`, from: 0, to: T, color: 'blue' }],
              areas: [{ fn: 0, from: 0, to: T, color: 'blue' }],
              alt: `A speed–time graph: a straight line rising from ${u} to ${v} metres per second over ${T} seconds, with the region under it shaded.`,
            },
            answer,
            unit: 'm',
            wrong: [
              [v * T, `That is the distance at ${v} m/s the whole time. But ${it} only reaches that speed at the very end.`],
              [((v - u) * T) / 2, 'That is only the triangle on top. Add the rectangle underneath it.'],
              [u * T, `That is only the rectangle at the bottom (${u} m/s the whole time). Add the triangle on top.`],
            ],
            hints: [
              'Distance is the area under the graph. Split the shaded shape into a rectangle and a triangle.',
              r`Rectangle: $${T} \times ${u}$. Triangle: $\tfrac12 \times ${T} \times ${v - u}$.`,
            ],
            explain: r`
              Rectangle: $${T} \times ${u} = ${T * u}$. Triangle on top:
              $\tfrac12 \times ${T} \times ${v - u} = ${num(((v - u) * T) / 2)}$.

              Total area: **${num(answer)} m**.
            `,
          };
        }
        const T1 = rng.int(3, 8);
        const T2 = rng.pick([2, 3, 4, 5, 6]);
        const brake = kind === 'cruise-brake';
        const answer = brake ? v * T1 + (v * T2) / 2 : (v * T1) / 2 + v * T2;
        const end = T1 + T2;
        const fns = brake
          ? [{ expr: `${v}`, from: 0, to: T1, color: 'blue' }, { expr: `${v} - ${v / T2}*(x - ${T1})`, from: T1, to: end, color: 'blue' }]
          : [{ expr: `${v / T1}*x`, from: 0, to: T1, color: 'blue' }, { expr: `${v}`, from: T1, to: end, color: 'blue' }];
        const tri = brake ? T2 : T1;
        const rect = brake ? T1 : T2;
        return {
          text: brake
            ? `${who} cruises at ${v} m/s for ${T1} seconds, then brakes steadily to a stop over the next ${T2} seconds. **How far does it travel altogether?**`
            : `${who} sets off from rest, speeds up steadily to ${v} m/s over ${T1} seconds, then holds that speed for another ${T2} seconds. **How far does it travel altogether?**`,
          figure: {
            type: 'plot', x: [0, Math.ceil(end * 1.3)], y: [0, v + 4], ...axes,
            fns,
            areas: [{ fn: 0, from: 0, to: T1, color: 'blue' }, { fn: 1, from: T1, to: end, color: 'blue' }],
            alt: brake
              ? `A speed–time graph: level at ${v} metres per second for ${T1} seconds, then falling in a straight line to zero over the next ${T2} seconds. The region under it is shaded.`
              : `A speed–time graph: rising in a straight line from zero to ${v} metres per second over ${T1} seconds, then level for ${T2} seconds. The region under it is shaded.`,
          },
          answer,
          unit: 'm',
          wrong: [
            [v * end, `That treats ${it} as doing ${v} m/s the whole time. While it is ${brake ? 'braking' : 'speeding up'} it covers only half as much: a triangle, not a rectangle.`],
            [v * rect, `That is only the rectangle: the steady part. Add the triangle for the part where ${it} is ${brake ? 'braking' : 'speeding up'}.`],
          ],
          hints: [
            'Distance is the area under the graph. Split the shaded shape into a rectangle and a triangle.',
            r`Rectangle: $${rect} \times ${v}$. Triangle: $\tfrac12 \times ${tri} \times ${v}$.`,
          ],
          explain: r`
            Rectangle (steady part): $${rect} \times ${v} = ${rect * v}$.
            Triangle: $\tfrac12 \times ${tri} \times ${v} = ${num((tri * v) / 2)}$.

            Total area: **${num(answer)} m**.
          `,
        };
      },
    },
    {
      id: 'why-area',
      type: 'info',
      title: 'Why area?',
      text: `
        Chop the trip into short slices of time. During one short slice the
        speed hardly changes, so the distance covered in it is about
        *speed × time*: the [height × width]{.orange} of one thin rectangle.

        Add up the slices and you have the whole distance, and the whole area.

        :::key
        On a speed–time graph, the **distance travelled** is the
        **area under the graph**.
        :::

        Try it on the car that sped up from 0 to 20 m/s in 4 seconds.
        **Add more slices**: the rectangles hug the line more closely, and
        their total closes in on 40.
      `,
      figure: {
        type: 'plot', x: [0, 4.6], y: [0, 24], xStep: 1, yStep: 5, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        params: { n: { min: 2, max: 40, step: 1, value: 4, label: 'slices', color: 'orange' } },
        fns: [{ expr: '5x', from: 0, to: 4, color: 'blue' }],
        riemann: [{ fn: 0, from: 0, to: 4, n: 'n', mode: 'left', color: 'orange' }],
        readouts: [{ label: 'total area of the rectangles', expr: 'R0()', color: 'orange' }, { label: 'area of the triangle', expr: '40' }],
        alt: 'The rising speed line with thin rectangles drawn under it. A slider sets how many rectangles there are.',
      },
    },
    {
      id: 'left-sum',
      type: 'interact',
      graded: false,
      title: 'A curved speed graph',
      text: r`
        This driver presses the pedal harder and harder: after $t$ seconds
        the speed is $t^2$ m/s. The region under the curve is no rectangle
        and no triangle.

        So cover it with rectangles, each as tall as the curve at its **left**
        edge. **Raise the number of rectangles to at least 30** and watch the total.
      `,
      widget: {
        type: 'plot', ...AXES,
        params: { n: { min: 3, max: 60, step: 1, value: 3, label: 'rectangles', color: 'orange' } },
        fns: CURVE,
        riemann: [{ fn: 0, from: 0, to: 3, n: 'n', mode: 'left', color: 'orange' }],
        readouts: [{ label: 'total area of the rectangles', expr: 'R0()', digits: 3, color: 'orange' }],
        alt: 'A speed–time graph curving upward from 0 to 9 metres per second in 3 seconds, with rectangles drawn under it. A slider sets how many rectangles there are.',
      },
      check: (s) => s.n >= 30 || 'Add more rectangles: push the slider to 30 or beyond.',
      solution: { n: 60 },
      explain: `
        Three rectangles total 5. Thirty total 8.555, and sixty total 8.776.
        The total keeps growing, but ever more slowly, as if it were heading
        for a ceiling.

        Every one of these rectangles fits *under* the curve. So the total is
        always a little too small: an **under-estimate** of the distance.
      `,
    },
    {
      id: 'example-rectangles',
      type: 'info',
      title: 'Rectangles from a table',
      text: r`
        The same estimate works from a few readings of the speed. Each slice
        of time gets one rectangle: as wide as the slice, as tall as a speed
        from the table.

        | time (s) | 0 | 3 | 6 | 9 | 12 |
        |:--|--:|--:|--:|--:|--:|
        | speed (m/s) | 1 | 2 | 5 | 10 | 17 |

        :::example
        Four slices, each 3 s wide. With the speed at the **start** of each
        slice, as in the picture:

        $$ 3 \times (1 + 2 + 5 + 10) = 54\ \text{m} $$

        With the speed at the **end** of each slice, the heights are 2, 5,
        10 and 17, and the total is $3 \times 34 = 102$ m.
        :::

        Five readings, four rectangles: each estimate leaves one reading out.
      `,
      figure: {
        type: 'plot', x: [0, 14.5], y: [0, 19], xStep: 3, yStep: 5, xLabel: 'time (s)', yLabel: 'speed (m/s)',
        fns: [{ expr: '1 + x^2/9', from: 0, to: 12, color: 'blue' }],
        riemann: [{ fn: 0, from: 0, to: 12, n: 4, mode: 'left', color: 'orange' }],
        points: [0, 3, 6, 9, 12].map((x) => ({ x, on: 0, color: 'ink' })),
        alt: 'A rising speed–time curve through the five readings in the table. Four rectangles stand under it, each 3 seconds wide and as tall as the speed at the start of its slice: 1, 2, 5 and 10 metres per second.',
      },
    },
    {
      id: 'table-estimate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(['A motorboat', 'A tram', 'A cyclist', 'A cargo drone']);
        const dt = rng.pick([2, 5, 10]);
        const speeds = [rng.int(0, 3)];
        for (let k = 0; k < 4; k++) speeds.push(speeds[k] + rng.int(1, 4));
        const left = rng.bool();
        const used = left ? speeds.slice(0, 4) : speeds.slice(1);
        const other = left ? speeds.slice(1) : speeds.slice(0, 4);
        const answer = dt * sum(used);
        return {
          text: [
            `${who} is speeding up. Its speed is logged every ${dt} seconds.`,
            table(['time (s)', 'speed (m/s)'], speeds.map((v, k) => [k * dt, v])),
            `Estimate how far it travels in these ${4 * dt} seconds. Use **four rectangles**, each as tall as the speed at the **${left ? 'start' : 'end'}** of its ${dt}-second slice.`,
          ].join('\n\n'),
          answer,
          unit: 'm',
          wrong: [
            [dt * sum(other), `That uses the speed at the ${left ? 'end' : 'start'} of each slice. The question asks for the ${left ? 'start' : 'end'}.`],
            [sum(used), `You added the four speeds. Each rectangle's area is speed × time, and every slice lasts ${dt} s.`],
            [dt * sum(speeds), 'That uses all five readings. Four slices need four rectangles.'],
          ],
          hints: [
            `The four slices run from 0 to ${dt} s, ${dt} to ${2 * dt} s, ${2 * dt} to ${3 * dt} s and ${3 * dt} to ${4 * dt} s. Take the speed at the ${left ? 'start' : 'end'} of each.`,
            r`Heights: $${used.join(', ')}$ m/s. Each rectangle is ${dt} s wide.`,
          ],
          explain: r`
            The four heights are $${used.join(', ')}$ m/s, and each rectangle is ${dt} s wide:

            $$ ${dt} \times (${used.join(' + ')}) = ${answer}\ \text{m} $$

            The speed is rising, so ${left ? 'each rectangle sits below the true graph: this is an under-estimate.' : 'each rectangle pokes above the true graph: this is an over-estimate.'}
          `,
        };
      },
    },
    {
      id: 'right-edge',
      type: 'choice',
      text: `
        Left-edge rectangles all sat under the rising curve, so their total
        came out too small.

        Now build each rectangle up to the height of the curve at its
        **right** edge instead. For this rising curve, the new total is…
      `,
      figure: {
        type: 'plot', ...AXES,
        fns: CURVE,
        riemann: [{ fn: 0, from: 0, to: 3, n: 6, mode: 'right', color: 'violet' }],
        alt: 'The curved speed graph with six rectangles, each as tall as the curve at its right-hand edge. The top-left corner of every rectangle sticks out above the curve.',
      },
      options: [
        { text: 'Too big', correct: true },
        { text: 'Too small', why: 'Look at the top of each rectangle: its left-hand corner pokes out *above* the curve.' },
        { text: 'Exactly right', why: 'Each rectangle pokes out above the curve at its top-left corner, so extra area is being counted.' },
      ],
      explain: `
        On a rising curve, the right edge is the highest point of each slice.
        Every rectangle pokes out above the curve: an **over-estimate**.
      `,
    },
    {
      id: 'teach-under-over',
      type: 'info',
      title: 'Trapped between two totals',
      text: `
        The two kinds of rectangle err in opposite directions. Which is
        which depends on the way the curve is heading.

        | Curve | Left-edge total | Right-edge total |
        |:--|:--|:--|
        | rising | too small | too big |
        | falling | too big | too small |

        On a **falling** curve the left edge is the *highest* point of each
        slice, so left-edge rectangles poke out above the curve, as in the
        picture.

        :::key
        Either way, the true area is trapped **between** the two totals. And
        cutting every rectangle into thinner ones moves both totals closer to it.
        :::
      `,
      figure: {
        type: 'plot', ...AXES,
        fns: [{ expr: '9 - x^2', from: 0, to: 3, color: 'blue' }],
        riemann: [{ fn: 0, from: 0, to: 3, n: 6, mode: 'left', color: 'orange' }],
        alt: 'A speed–time graph that falls from 9 metres per second to zero in 3 seconds, with six rectangles, each as tall as the curve at its left-hand edge. The top-right corner of every rectangle sticks out above the curve.',
      },
    },
    {
      id: 'squeeze',
      type: 'interact',
      title: 'Close the trap',
      text: `
        Here are both sets of rectangles at once: the [left-edge]{.orange}
        ones under the curve, and on top of them the extra slivers of the
        [right-edge]{.violet} ones.

        **Add rectangles until the two totals are less than 0.5 apart.**
      `,
      widget: {
        type: 'plot', ...AXES,
        params: { n: { min: 3, max: 100, step: 1, value: 6, label: 'rectangles', color: 'orange' } },
        fns: CURVE,
        riemann: [
          { fn: 0, from: 0, to: 3, n: 'n', mode: 'right', color: 'violet' },
          { fn: 0, from: 0, to: 3, n: 'n', mode: 'left', color: 'orange' },
        ],
        readouts: [
          { label: 'under-estimate', expr: 'R1()', digits: 3, color: 'orange' },
          { label: 'over-estimate', expr: 'R0()', digits: 3, color: 'violet' },
          { label: 'gap', expr: 'R0() - R1()', digits: 3 },
        ],
        alt: 'The curved speed graph with left-edge rectangles under it and right-edge rectangles over it. A slider sets how many rectangles there are.',
      },
      check: (s) => 27 / s.n < 0.5 || `The two totals are still ${num(27 / s.n, 2)} apart. Add more rectangles.`,
      solution: { n: 60 },
      hints: ['Every time you double the number of rectangles, the gap halves. Keep sliding to the right.'],
      explain: `
        With 60 rectangles the true area is trapped between 8.776 and 9.226.
        With 100, between 8.865 and 9.135.

        The trap can be made as tight as you like, and it always closes on
        the same number: **9**. The car travels exactly 9 m.
      `,
    },
    {
      id: 'integral',
      type: 'info',
      title: 'The integral',
      text: r`
        The exact area under a curve, the number that the rectangle totals
        close in on, is called the **integral**. It has its own notation:

        $$ \int_0^3 t^2\,dt = 9 $$

        Read it piece by piece:

        - $\int$ is a stretched **S**, for "sum"
        - $t^2\,dt$ is the area of one very thin rectangle: height $t^2$ times a tiny width $dt$
        - the $0$ and the $3$ say where the area starts and stops

        :::key
        For a curve above the axis, the **integral** from $a$ to $b$ is the
        area under it between $a$ and $b$: the number that rectangle totals
        approach as the rectangles get thinner.
        :::
      `,
    },
    {
      id: 'integral-geometry',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.pick([1, 2, 3]);
        const c = rng.int(1, 4);
        const b = rng.pick([2, 4, 6]);
        const top = m * b + c;
        const answer = (m * b * b) / 2 + c * b;
        const line = `${m === 1 ? '' : m}x + ${c}`;
        return {
          text: r`
            This integral is the area under the line $y = ${line}$ from $x = 0$ to $x = ${b}$. No rectangles needed: **find it with geometry.**

            $$ \int_0^{${b}} (${line})\,dx $$
          `,
          figure: {
            type: 'plot', x: [0, b + 1], y: [0, top + 3], xStep: 1, yStep: top > 12 ? 5 : 2,
            fns: [{ expr: `${m}*x + ${c}`, from: 0, to: b, color: 'blue' }],
            areas: [{ fn: 0, from: 0, to: b, color: 'blue' }],
            alt: `The line y = ${line} from x = 0, where its height is ${c}, to x = ${b}, where its height is ${top}. The region under it is shaded.`,
          },
          answer,
          wrong: [
            [top * b, `That is a rectangle as tall as the line's highest point, ${top}. The shaded region is smaller: a rectangle with a triangle on top.`],
            [(m * b * b) / 2, 'That is the triangle alone. Add the rectangle underneath it.'],
            [top, `${top} is the height of the line at the right-hand end. The integral is the whole shaded *area*.`],
          ],
          hints: [
            `Split the region into a rectangle of height ${c} and a triangle on top of it.`,
            r`Rectangle: $${b} \times ${c}$. Triangle: $\tfrac12 \times ${b} \times ${m * b}$.`,
          ],
          explain: r`
            Rectangle: $${b} \times ${c} = ${b * c}$. Triangle on top:
            $\tfrac12 \times ${b} \times ${m * b} = ${(m * b * b) / 2}$.

            So the integral is $${b * c} + ${(m * b * b) / 2} = ${answer}$.
          `,
        };
      },
    },
    {
      id: 'gap',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const T = rng.pick([4, 5, 6, 8, 10]);
        const w = rng.pick([0.5, 0.25, 0.2, 0.1]);
        const n = Math.round(T / w);
        const u = rng.pick([0, 2, 4, 5]);
        const climb = rng.pick([8, 10, 12, 16, 20]);
        const answer = round(climb * w, 4);
        return {
          title: 'Why the trap always closes',
          text: `
            Look at the [violet slivers]{.violet}: the difference between
            the right-edge and left-edge totals. Slide them all sideways
            into one column and they stack into a single rectangle, **one
            slice wide** and **as tall as the curve's whole climb**.

            Another car's speed climbs from ${u} m/s to ${u + climb} m/s over
            ${T} seconds. With **${n} rectangles**, how far apart are its
            left-edge and right-edge totals?
          `,
          figure: {
            type: 'plot', ...AXES,
            fns: CURVE,
            riemann: [
              { fn: 0, from: 0, to: 3, n: 6, mode: 'right', color: 'violet' },
              { fn: 0, from: 0, to: 3, n: 6, mode: 'left', color: 'orange' },
            ],
            alt: 'The curved speed graph with six left-edge rectangles under it. Above each one, a violet sliver shows how much taller the right-edge rectangle is.',
          },
          answer,
          unit: 'm',
          wrong: [
            [climb * T, `That is the climb times the *whole* ${T} seconds. The stacked slivers are only one slice wide.`],
            [w, 'That is the width of one slice. Multiply it by the height of the stack: the total climb in speed.'],
            [climb / n, `Close. The width of one slice is ${T} s ÷ ${n}, not 1 ÷ ${n}.`],
          ],
          hints: [
            `How wide is one slice? ${T} seconds shared among ${n} rectangles.`,
            `One slice is ${num(w)} s wide. The stack is as tall as the whole climb: ${climb} m/s.`,
          ],
          explain: r`
            One slice is $${T} \div ${n} = ${num(w)}$ s wide, and the slivers
            stack to the full climb of ${climb} m/s. So the totals differ by
            $${climb} \times ${num(w)} = ${num(answer)}$ m.

            Use twice as many rectangles and that gap halves. It can be made
            as small as you like, which is why the trap always closes.
          `,
        };
      },
    },
    {
      id: 'order-estimates',
      type: 'order',
      review: true,
      gen: (rng) => {
        const rising = rng.bool();
        const [few, many] = rng.pick([[4, 40], [5, 50], [6, 60], [10, 100]]);
        const graph = rng.pick(['a speed–time graph', 'a flow-rate graph', 'a curve']);
        const low = rising ? 'Left-edge' : 'Right-edge';      // the edge that sits under the curve
        const high = rising ? 'Right-edge' : 'Left-edge';
        return {
          text: `
            The area under ${graph} that **${rising ? 'rises' : 'falls'} all the way** is
            estimated four times with rectangles.

            Put the four estimates and the true area in order, **smallest first**.
          `,
          items: [
            `${low} rectangles, ${few} of them`,
            `${low} rectangles, ${many} of them`,
            'The true area',
            `${high} rectangles, ${many} of them`,
            `${high} rectangles, ${few} of them`,
          ],
          labels: ['Smallest', 'Largest'],
          hints: [
            `On a ${rising ? 'rising' : 'falling'} curve, which edge of each slice is its lowest point? Rectangles built to that height sit under the curve.`,
            'Under-estimates go below the true area, over-estimates above it. Within each pair, the estimate with more rectangles is the closer one.',
          ],
          explain: `
            On a ${rising ? 'rising' : 'falling'} curve the ${low.toLowerCase()} of each slice is its
            lowest point, so ${low.toLowerCase()} rectangles sit under the curve and
            their totals are too small. ${high} rectangles poke above it, so
            their totals are too big.

            And cutting every rectangle into ten thinner ones can only move a
            total closer to the true area, from whichever side it started.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        In your own words: why does the rectangle total get closer to the
        true area as the rectangles get thinner?
      `,
      model: `
        Each rectangle pretends that the speed stays fixed during its slice
        of time. The thinner the slice, the less the speed really changes
        within it, so the less that pretence costs. Added together, the
        errors are the small corners between the rectangles and the curve.
        On a rising or falling curve, all those corners fit into a single
        column only one slice wide, and that column shrinks to nothing as
        the slices get thinner.
      `,
    },
  ],
  recap: [
    'On a speed–time graph, **distance travelled is the area under the graph**.',
    'Straight graphs give rectangles and triangles. For a curve, cover the area with thin rectangles and add them up.',
    'On a rising curve, left-edge rectangles under-estimate and right-edge rectangles over-estimate. The true area is trapped between them.',
    'The number the totals close in on is the **integral**, written $\\int_a^b f(x)\\,dx$.',
  ],
  next: 'Next: the shortcut. Why the area under $t^2$ from 0 to 3 is exactly 9, in one line.',
};
