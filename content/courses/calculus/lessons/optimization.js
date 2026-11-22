// Calculus in Pictures · Lesson 6 · Finding the Best
import { r } from '../../../kit.js';

/** The pen as a picture: the plot's own axes are two of its sides. */
const PEN = {
  type: 'plot', width: 446, height: 440, x: [0, 10], y: [0, 10], xStep: 1, yStep: 1, xLabel: 'metres',
  params: { w: { min: 0.5, max: 9.5, step: 0.5, value: 2, label: 'width $w$', color: 'green' } },
  fns: [{ expr: '10 - w', from: 0, to: 'w', color: 'green' }],
  areas: [{ fn: 0, from: 0, to: 'w', color: 'green' }],
  segments: [{ from: ['w', 0], to: ['w', '10 - w'], color: 'green' }],
  readouts: [
    { label: 'width', expr: 'w', digits: 1 },
    { label: 'length', expr: '10 - w', digits: 1 },
    { label: 'area', expr: 'w*(10 - w)', digits: 2, color: 'green' },
  ],
  alt: 'A rectangular pen drawn on a grid. A slider changes its width, and the length changes so that the fence stays 20 metres long.',
};

/** A square sheet with a small square marked in each corner, and the fold lines dashed. */
const SHEET = {
  type: 'svg', viewBox: '0 0 300 250', maxWidth: 300,
  alt: 'A square sheet of card, 12 centimetres on each side. A small square of side x is marked in each corner. Dashed lines show where the sides fold up.',
  content:
    '<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="50" y="20" width="200" height="200" rx="2"/>' +
    [[50, 20], [210, 20], [50, 180], [210, 180]].map(([x, y]) => `<rect class="fill-orange-soft stroke-orange" stroke-width="2.5" x="${x}" y="${y}" width="40" height="40"/>`).join('') +
    '<path class="fill-none stroke-ink" stroke-width="2" stroke-dasharray="6 5" d="M90 60 H210 V180 H90 Z"/>' +
    '<text class="fig-label text-orange" x="70" y="46" text-anchor="middle">x</text>' +
    '<text class="fig-label text-orange" x="36" y="46" text-anchor="middle">x</text>' +
    '<text class="fig-label" x="150" y="125" text-anchor="middle">base</text>' +
    '<text class="fig-label-sm" x="150" y="242" text-anchor="middle">12 cm</text>' +
    '<text class="fig-label-sm" x="272" y="125" text-anchor="middle">12 cm</text>',
};

export default {
  id: 'optimization',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The same fence, a different field',
      text: `
        A farmer has **20 metres** of fence and wants a rectangular pen for her sheep.
        She can make it long and thin or short and wide: the fence is used up either way.

        **Which pen gives the sheep the most room?**
      `,
      shuffle: false,
      options: [
        { text: 'A long, thin pen: 9 m by 1 m' },
        { text: 'A square pen: 5 m by 5 m', correct: true },
        { text: 'It makes no difference: 20 m of fence always encloses the same area' },
      ],
      explain: r`
        The square: $5 \times 5 = 25$ square metres. The 9-by-1 pen has exactly the same fence
        around it and only 9 square metres inside.

        Same fence, very different areas. This lesson is about finding the best choice without
        having to try them all.
      `,
    },
    {
      id: 'teach-pen-formula',
      type: 'info',
      title: 'One number decides the pen',
      text: r`
        Call the width of the pen $w$. The 20 m of fence goes round all four sides, so one
        width and one length together use half of it: 10 m. That fixes the length at $10 - w$.

        So the whole pen hangs on one number, and its area has a formula:

        $$ A = w \times (10 - w) $$

        | width $w$ | length $10 - w$ | area $A$ |
        |---:|---:|---:|
        | 1 | 9 | 9 |
        | 2 | 8 | 16 |
        | 3 | 7 | 21 |

        The picture shows the pen in the last row.
      `,
      figure: {
        type: 'plot', width: 446, height: 400, x: [0, 10], y: [0, 9], xStep: 1, yStep: 1, xLabel: 'metres',
        fns: [{ expr: '7', from: 0, to: 3, color: 'green' }],
        areas: [{ fn: 0, from: 0, to: 3, color: 'green' }],
        segments: [{ from: [3, 0], to: [3, 7], color: 'green' }],
        labels: [
          { x: 1.5, y: 7, text: 'width 3', dx: 0, dy: -10, anchor: 'middle' },
          { x: 3, y: 3.5, text: 'length 10 − 3 = 7', dx: 10, dy: 5, anchor: 'start' },
          { x: 1.5, y: 3.5, text: 'area 21', color: 'green', dx: 0, dy: 5, anchor: 'middle' },
        ],
        alt: 'A rectangular pen drawn on a grid: 3 metres wide and 7 metres long, with an area of 21 square metres.',
      },
    },
    {
      id: 'pen',
      type: 'interact',
      title: 'Try every pen',
      text: r`
        Here is the pen with a slider for its width $w$. Its length follows by itself:
        $10 - w$.

        **Slide $w$ until the area is as large as you can make it.**
      `,
      widget: PEN,
      check: (s) => {
        if (s.w === 5) return true;
        return s.w < 5
          ? 'The area is still growing as the pen gets wider. Keep going.'
          : 'Too wide: the pen now loses more area by getting shorter than it gains by getting wider.';
      },
      solution: { w: 5 },
      hints: ['Watch the green "area" number while you slide. Where does it stop going up?'],
      explain: r`
        At $w = 5$ the area is $25$, and a step in either direction makes it smaller.

        Notice *how* it changed on the way. Far from the best width, each step made a big
        difference. Close to it, the area hardly moved at all. That is the clue.
      `,
    },
    {
      id: 'hill',
      type: 'interact',
      title: 'The area as a curve',
      text: r`
        Plot the area against the width and you get a curve:
        $$ A = w(10 - w) = 10w - w^2 $$

        **Drag the point to the very top of the hill**, and keep an eye on the slope of the tangent.
      `,
      widget: {
        type: 'plot', x: [0, 10], y: [0, 30], xStep: 1, yStep: 5, xLabel: 'width w', yLabel: 'area',
        fns: [{ expr: '10x - x^2', color: 'green' }],
        points: [{ id: 'P', x: 2, on: 0, drag: 'x', snap: 0.5, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [
          { label: 'area', expr: 'f0(Px)', digits: 2, color: 'green' },
          { label: 'slope', expr: 'd0(Px)', digits: 1, color: 'orange' },
        ],
        alt: 'The curve of area against width: a hill that rises from zero, peaks in the middle and falls back to zero. A point with its tangent line can be dragged along it.',
      },
      check: (s) => {
        if (s.P.x === 5) return true;
        return s.P.x < 5
          ? 'Still climbing: the slope is positive here. Keep going to the right.'
          : 'You are over the top: the slope is negative here. Come back to the left.';
      },
      solution: { P: { x: 5 } },
      explain: r`
        On the way up the slope is positive. On the way down it is negative. At the top it has
        to pass through **zero**: for an instant the tangent is perfectly level.
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: 'Where the slope is zero',
      text: r`
        That turns "find the best" into something you can calculate.

        :::key
        At the top of a hill or the bottom of a valley on a smooth curve, the slope is zero.
        :::

        So, to find the best value of something:

        1. **Write a formula** for the thing you care about.
        2. **Differentiate** it.
        3. **Set the derivative to zero** and solve.

        No sliding, no guessing, and it works when the answer is not a round number.
        It is called **optimisation**, and it is one of the first things calculus was used for.
      `,
    },
    {
      id: 'example-recipe',
      type: 'info',
      title: 'The recipe at work',
      text: r`
        Here is the whole recipe, run once on a problem that is not the pen.

        :::example
        A café sells soup at $p$ pounds a bowl, and its daily profit in pounds is
        $P = 36p - 3p^2 - 60$. Which price is best?

        1. **Formula:** already given.
        2. **Differentiate:** $\;P'(p) = 36 - 6p$
        3. **Set to zero:** $\;36 - 6p = 0$, so $6p = 36$ and $p = 6$

        At £6 the profit is $36(6) - 3(6)^2 - 60 = 48$ pounds: the top of the hill.
        :::

        The letters change from problem to problem. The three steps do not.
      `,
      figure: {
        type: 'plot', x: [0, 12], y: [-70, 70], xStep: 2, yStep: 20, xLabel: 'price p (£)', yLabel: 'profit P (£)',
        fns: [{ expr: '36x - 3x^2 - 60', color: 'green' }],
        tangents: [{ fn: 0, at: 6, color: 'orange' }],
        points: [{ x: 6, on: 0, color: 'orange' }],
        labels: [{ x: 6, y: 48, text: 'slope 0: profit 48', color: 'orange', dx: 0, dy: -14, anchor: 'middle' }],
        alt: 'The profit plotted against the price: a hill that starts below zero, peaks at a price of 6 pounds with a profit of 48 pounds, and falls again. A level tangent line touches the top.',
      },
    },
    {
      id: 'solve-pen',
      type: 'fill',
      title: 'The pen, by calculation',
      text: r`Run the recipe on the pen, where $A = 10w - w^2$.`,
      template: r`
        The derivative is $A'(w) =$ [[10]] $-$ [[2]] $w$.

        It is zero when $w =$ [[5]].

        The largest area is therefore [[25]] square metres.
      `,
      hints: [r`Power rule, one term at a time: $10w$ gives $10$, and $w^2$ gives $2w$.`],
      explain: r`$A'(w) = 10 - 2w$, which is zero when $2w = 10$, so $w = 5$ and $A = 5 \times 5 = 25$. The same answer as the slider, without the slider.`,
    },
    {
      id: 'best-value',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        if (rng.bool()) {
          // a field against a river: x(L - 2x)
          const fence = rng.pick([40, 60, 80, 100, 120]);
          const best = fence / 4;
          return {
            text: r`
              A field is fenced on three sides; the fourth side is a river. There are
              **${fence} metres** of fence. If the two sides that run away from the river are
              $x$ metres each, the area is
              $$ A = x(${fence} - 2x) = ${fence}x - 2x^2 $$
              **Which $x$ gives the largest field?**
            `,
            answer: best,
            prefix: '$x =$',
            unit: 'm',
            wrong: [
              [fence / 2, r`At $x = ${fence / 2}$ the whole fence is used on the two sides and nothing is left for the third: the area is zero. Set the derivative to zero instead.`],
              [fence / 3, 'Three equal sides is a natural guess, but the river side costs no fence. Differentiate and see.'],
            ],
            hints: [r`Differentiate: $A' = ${fence} - 4x$. When is that zero?`],
            explain: r`$A'(x) = ${fence} - 4x$, which is zero when $x = ${best}$. The side along the river is then $${fence} - 2 \times ${best} = ${fence / 2}$ m: twice as long as the other two.`,
          };
        }
        // profit against price: -a p^2 + b p - c
        const a = rng.pick([2, 5, 10]);
        const best = rng.int(3, 9);
        const b = 2 * a * best;
        const c = a * rng.int(2, 8);
        return {
          text: r`
            A market stall works out that if it charges $p$ pounds for a pie, its daily profit
            in pounds will be
            $$ P = -${a}p^2 + ${b}p - ${c} $$
            **Which price gives the largest profit?**
          `,
          answer: best,
          prefix: '$p =$',
          unit: 'pounds',
          wrong: [
            [2 * best, r`Check the derivative: $-${a}p^2$ gives $-${2 * a}p$, not $-${a}p$.`],
            [b, r`${b} is the slope at $p = 0$. You want the price at which the slope has fallen to zero.`],
          ],
          hints: [r`Differentiate: $P' = -${2 * a}p + ${b}$. When is that zero?`],
          explain: r`$P'(p) = -${2 * a}p + ${b}$, which is zero when $p = ${best}$. Charge less and too little comes in per pie; charge more and too few people buy.`,
        };
      },
    },
    {
      id: 'valley',
      type: 'choice',
      title: 'Level is not always the top',
      text: r`
        Here is $f(x) = x^2 - 6x + 11$. Its derivative is $2x - 6$, which is zero at $x = 3$.

        **What is special about the curve at $x = 3$?**
      `,
      figure: {
        type: 'plot', x: [-1, 7], y: [0, 12], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2 - 6x + 11', color: 'blue' }],
        points: [{ x: 3, on: 0, color: 'orange' }],
        tangents: [{ fn: 0, at: 3, color: 'orange' }],
        alt: 'A U-shaped curve. Its lowest point is at x = 3, where a level tangent line touches it.',
      },
      options: [
        { text: 'It is the lowest point of the curve', correct: true },
        { text: 'It is the highest point of the curve', why: 'Look at the picture: the curve rises on both sides of this point.' },
        { text: 'The curve crosses the x-axis there', why: r`The curve never reaches the axis. At $x = 3$ its height is $9 - 18 + 11 = 2$.` },
      ],
      explain: r`
        A level tangent marks the bottom of a **valley** as well as the top of a hill. Setting the
        derivative to zero finds both, and it does not tell you which one you have found.
      `,
    },
    {
      id: 'hill-or-valley',
      type: 'fill',
      title: 'Telling them apart',
      text: r`
        To tell a hilltop from a valley without a picture, check the slope a little to each side.
        Take $f(x) = x^2 - 6x + 11$ again, with $f'(x) = 2x - 6$.
      `,
      template: r`
        Just to the left, $f'(2) =$ [[-2]], so the curve is going [[*downhill|uphill]].

        Just to the right, $f'(4) =$ [[2]], so the curve is going [[downhill|*uphill]].

        Down and then up: $x = 3$ is the [[top of a hill|*bottom of a valley]].
      `,
      explain: r`
        $f'(2) = 4 - 6 = -2$ and $f'(4) = 8 - 6 = 2$. Downhill, level, uphill: a valley.
        The other way round, uphill then downhill, is a hilltop.
      `,
    },
    {
      id: 'box-setup',
      type: 'choice',
      mode: 'predict',
      title: 'A box from one sheet',
      text: r`
        Cut a square of side $x$ from each corner of a 12 cm square of card, then fold up the
        four sides. You get an open box: $x$ deep, on a base that is $12 - 2x$ each way.

        A small cut gives a wide, shallow tray. A big cut gives a tall, narrow tube.
        **Which of these two boxes holds more?**
      `,
      figure: SHEET,
      shuffle: false,
      options: [
        { text: 'A 1 cm cut: a tray 10 by 10 by 1' },
        { text: 'A 3 cm cut: a box 6 by 6 by 3', correct: true },
        { text: 'They hold exactly the same' },
      ],
      explain: r`
        The tray holds $10 \times 10 \times 1 = 100\ \text{cm}^3$. The deeper box holds
        $6 \times 6 \times 3 = 108\ \text{cm}^3$. Close, and neither is the best possible.
      `,
    },
    {
      id: 'box',
      type: 'interact',
      stretch: true,
      title: 'The biggest box',
      text: r`
        In general the box is $x$ deep on a base of $12 - 2x$ by $12 - 2x$, so its volume is
        $$ V = x(12 - 2x)^2 $$
        **Find the cut that gives the largest volume.**
      `,
      widget: {
        type: 'plot', x: [0, 6], y: [0, 140], xStep: 1, yStep: 20, yLabel: 'volume',
        fns: [{ expr: 'x*(12 - 2x)^2', color: 'blue' }],
        // the curve runs along the axis near x = 6, so the axis name sits a little higher than usual
        labels: [{ x: 6, y: 30, text: 'cut x (cm)', anchor: 'end', color: 'gray', dx: -4 }],
        points: [{ id: 'P', x: 4, on: 0, drag: 'x', snap: 0.25, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [
          { label: 'cut', expr: 'Px', digits: 2, unit: 'cm' },
          { label: 'volume', expr: 'f0(Px)', digits: 1, color: 'blue' },
          { label: 'slope', expr: 'd0(Px)', digits: 1, color: 'orange' },
        ],
        alt: 'The volume of the box plotted against the size of the cut: it rises to a peak and falls back to zero when the cut reaches 6 centimetres. A point with its tangent can be dragged along the curve.',
      },
      check: (s) => {
        if (s.P.x === 2) return true;
        if (s.P.x >= 6) return 'The tangent is level here too, but the volume is zero: a 6 cm cut leaves no base at all. Try a much smaller cut.';
        if (s.P.x > 2) return 'The slope is negative here: the volume is already falling. Try a smaller cut.';
        return 'The slope is positive here: a slightly bigger cut would still add volume.';
      },
      solution: { P: { x: 2 } },
      hints: ['You are looking for the place where the tangent is level, so the slope reads 0.'],
      explain: r`
        A cut of 2 cm gives a box that is 8 by 8 by 2: a volume of $128\ \text{cm}^3$. The best
        box is neither the tray nor the tube, and nothing about the number 2 was obvious in advance.
      `,
    },
    {
      id: 'box-check',
      type: 'fill',
      title: 'The box, by calculation',
      text: r`
        Multiplied out, the volume is $V = 4x^3 - 48x^2 + 144x$.
      `,
      template: r`
        $V'(x) =$ [[12]] $x^2 -$ [[96]] $x + 144$, which factorises as $12(x - 2)(x - 6)$.

        So the slope is zero at $x =$ [[2]] and at $x =$ [[6]] (smaller one first).

        A cut of 6 cm leaves no base at all, so the best cut is [[2]] cm.
      `,
      hints: [r`Power rule on each term: $4x^3$ gives $12x^2$, and $48x^2$ gives $96x$.`],
      explain: r`
        $V' = 12x^2 - 96x + 144 = 12(x - 2)(x - 6)$. Two places have a level tangent. At $x = 6$
        the volume is zero: that is the *worst* box, the bottom of a valley. Always look at what
        each answer means.
      `,
    },
    {
      id: 'edges',
      type: 'choice',
      title: 'Check the edges',
      text: r`
        Sometimes only part of a curve is allowed. Take $f(x) = x^2 - 2x$, but only for $x$
        from 0 to 4. Its derivative, $2x - 2$, is zero at $x = 1$.

        **Where on that stretch is $f$ largest?**
      `,
      figure: {
        type: 'plot', x: [-1, 5], y: [-2, 9], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2 - 2x', from: 0, to: 4, color: 'blue' }],
        points: [{ x: 0, on: 0, color: 'ink' }, { x: 1, on: 0, color: 'orange' }, { x: 4, on: 0, color: 'ink' }],
        vlines: [{ x: 0, dashed: true }, { x: 4, dashed: true }],
        alt: 'A piece of a U-shaped curve from x = 0 to x = 4. It dips to its lowest point at x = 1 and is highest at the right-hand end, x = 4.',
      },
      options: [
        { text: r`At $x = 4$, the right-hand edge`, correct: true },
        { text: r`At $x = 1$, where the slope is zero`, why: r`That is the lowest point: $f(1) = -1$. A level tangent can mark a valley.` },
        { text: r`At $x = 0$, the left-hand edge`, why: r`$f(0) = 0$, but $f(4) = 16 - 8 = 8$ is larger.` },
        { text: r`At $x = 2$, in the middle`, why: r`$f(2) = 0$. The curve is still climbing there.` },
      ],
      explain: r`
        $f(4) = 8$ is the largest value, and the slope there is not zero at all: the curve is still
        climbing when the allowed stretch runs out.
      `,
    },
    {
      id: 'teach-full-check',
      type: 'info',
      title: 'The full check',
      text: r`
        A derivative of zero tells you where a curve is **level**. That is where to look, not
        what you will find there.

        | The slope goes… | so the level spot is… |
        |:--|:--|
        | from $+$ to $-$ | a hilltop |
        | from $-$ to $+$ | a valley floor |

        And when only a stretch of the curve is allowed, the largest value may sit at one of
        its **ends**, where the slope need not be zero at all. The picture shows the stretch
        you have just looked at.

        :::key
        To find the largest or the smallest value, compare the places where the slope is
        zero **and the two ends**.
        :::
      `,
      figure: {
        type: 'plot', x: [-1, 5], y: [-2, 9], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2 - 2x', from: 0, to: 4, color: 'blue' }],
        points: [{ x: 0, on: 0, color: 'ink' }, { x: 1, on: 0, color: 'orange' }, { x: 4, on: 0, color: 'ink' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        vlines: [{ x: 0, dashed: true }, { x: 4, dashed: true }],
        labels: [
          { x: 1, y: -1, text: 'slope 0: the lowest point', color: 'orange', dx: 12, dy: 22, anchor: 'start' },
          { x: 4, y: 8, text: 'largest: an end', dx: -12, dy: 0, anchor: 'end' },
          { x: 0, y: 0, text: 'an end', dx: -10, dy: -10, anchor: 'end' },
        ],
        alt: 'The piece of the U-shaped curve from x = 0 to x = 4 again. Its lowest point, at x = 1, has a level tangent and is labelled "slope 0: the lowest point". Its highest point is the right-hand end, at x = 4, labelled "largest: an end".',
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'At the top of a smooth hill, the slope of the curve is zero', correct: true },
        { text: 'A slope of zero can also mark the bottom of a valley', correct: true },
        { text: 'On a limited stretch of a curve, the largest value can be at one of the ends', correct: true },
        { text: 'Wherever the slope is zero, the curve is at its highest', why: 'It may be at its lowest instead. Check the slope on either side, or look at the values.' },
        { text: 'The largest value of a curve is where its slope is largest', why: 'Where the slope is largest the curve is climbing fastest. The top comes later, when the slope has fallen to zero.' },
      ],
      explain: 'Slope zero tells you where to look. What you find there, and whether an edge beats it, still has to be checked.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of something in everyday life where **more is better up to a point, and then worse**:
        the speed you drive at, the amount of salt in a soup, the hours you practise in a day.

        **Describe it as a curve.** What is on each axis, and what is true at the best point?
      `,
      model: `
        For example: fuel used per kilometre against speed. Very slow driving wastes fuel, very
        fast driving wastes more, and somewhere in between is a speed that uses the least.

        On a graph that is a valley, and at its lowest point the curve is level: a tiny change of
        speed makes almost no difference. That flatness near the best point is exactly what a
        derivative of zero means.
      `,
    },
  ],
  recap: [
    'At the top of a hill or the bottom of a valley on a smooth curve, the slope is zero.',
    'To optimise: write a formula, differentiate it, set the derivative to zero and solve.',
    'Slope zero marks valleys as well as hilltops. Check the slope on either side to tell which.',
    'When only part of a curve is allowed, compare with the two ends as well.',
  ],
  next: 'Next: a curve whose slope is always equal to its own height.',
};
