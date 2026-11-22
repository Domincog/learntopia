// Algebra Foundations · Lesson 7 · Where Lines Meet
import { r, linear, term } from '../../../kit.js';
import { CENTRED, lineExpr, point } from '../helpers.js';

/** The two phone plans of this lesson: A is 2x + 10 (blue), B is 4x (orange). They cost the same at 5 GB. */
const plans = (extra = {}) => ({
  type: 'plot', x: [0, 10], y: [0, 42], xStep: 1, yStep: 5, xLabel: 'data (GB)', yLabel: 'cost ($)',
  fns: [{ expr: '2x + 10', color: 'blue' }, { expr: '4x', color: 'orange' }],
  ...extra,
  labels: [
    { x: 9, y: 28, text: 'plan A', color: 'blue', dy: 26, anchor: 'middle' },
    { x: 9, y: 36, text: 'plan B', color: 'orange', dx: -14, dy: -8, anchor: 'end' },
    ...(extra.labels || []),
  ],
});

/**
 * "When are they equal?" stories. One side starts ahead by `lead` but changes
 * more slowly; the other starts at `start` and gains `gap` more per step, so
 * they are level after lead ÷ gap steps.
 */
const RACES = [
  {
    numbers: (rng) => ({ start: 0, slow: rng.int(3, 6), gap: rng.int(1, 4), steps: rng.int(3, 8) }),
    text: ({ ahead, slow, fast }) => r`Gym A charges a joining fee of **\$${ahead}**, then **\$${slow} per visit**. Gym B has no joining fee, but charges **\$${fast} per visit**.`,
    ask: 'After how many visits have you paid the same total at both gyms?',
    unit: 'visits',
    one: 'visit',
  },
  {
    numbers: (rng) => ({ start: rng.int(2, 12), slow: rng.int(2, 5), gap: rng.int(1, 4), steps: rng.int(3, 8) }),
    text: ({ ahead, start, slow, fast }) => `Ava has **${ahead} coins** and saves **${slow} more every week**. Ben has only **${start} coins**, but saves **${fast} every week**.`,
    ask: 'After how many weeks do they have the same number of coins?',
    unit: 'weeks',
    one: 'week',
  },
  {
    numbers: (rng) => ({ start: rng.int(2, 10), slow: rng.int(1, 3), gap: rng.int(2, 5), steps: rng.int(3, 8) }),
    text: ({ ahead, start, slow, fast }) => `A fern is **${ahead} cm** tall and grows **${slow} cm a week**. A bamboo shoot is just **${start} cm** tall, but grows **${fast} cm a week**.`,
    ask: 'After how many weeks are the two plants the same height?',
    unit: 'weeks',
    one: 'week',
  },
  {
    numbers: (rng) => ({ start: rng.int(2, 4), slow: rng.int(1, 2), gap: rng.int(1, 2), steps: rng.int(3, 6) }),
    text: ({ ahead, start, slow, fast }) => r`Taxi A charges **\$${ahead}** to get in and **\$${slow} per kilometre**. Taxi B charges only **\$${start}** to get in, but **\$${fast} per kilometre**.`,
    ask: 'For what distance do the two taxis cost exactly the same?',
    unit: 'km',
    one: 'kilometre',
  },
];

export default {
  id: 'systems',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Which plan would you pick?',
      text: r`
        Two phone plans:

        - **Plan A:** \$10 a month, plus \$2 for every gigabyte of data.
        - **Plan B:** no monthly fee, but \$4 for every gigabyte.

        **Which plan is cheaper?**
      `,
      shuffle: false,
      options: [
        { text: 'Plan A, always' },
        { text: 'Plan B, always' },
        { text: 'It depends on how much data you use', correct: true },
      ],
      explain: r`
        It depends. With 1 GB, plan B costs \$4 and plan A costs \$12. With 10 GB, plan B costs \$40 and plan A only \$30.

        Somewhere in between, the two plans cost exactly the same. Finding that point is what this lesson is about.
      `,
    },
    {
      id: 'teach-two-lines',
      type: 'info',
      title: 'Two plans, two lines',
      text: r`
        Each plan is a start plus a steady rate, so each one is a line $y = mx + b.$ Here $x$ is the data used, in gigabytes, and $y$ is the cost in dollars.

        - [Plan A]{.blue} starts at \$10 and adds \$2 per gigabyte: $\;y = 2x + 10$
        - [Plan B]{.orange} starts at \$0 and adds \$4 per gigabyte: $\;y = 4x$

        On the graph, the height of a line above an amount of data is what that plan costs. Where a line is **lower**, its plan is cheaper.
      `,
      figure: plans({
        alt: 'Plan A, y = 2x + 10, and plan B, y = 4x, drawn as lines on a graph of cost against data. Plan A starts at 10 and climbs gently. Plan B starts at 0 and climbs twice as steeply, and the two lines cross.',
      }),
    },
    {
      id: 'find-crossing',
      type: 'interact',
      title: 'Where do they agree?',
      text: r`
        Here are both plans as lines. [Plan A]{.blue} is $\;y = 2x + 10\;$ and [plan B]{.orange} is $\;y = 4x.$

        **Drag the blue point to the amount of data for which both plans cost the same.**
      `,
      widget: plans({
        points: [
          { id: 'P', x: 2, on: 0, drag: 'x', snap: 1, color: 'blue' },
          { id: 'Q', x: 'Px', on: 1, color: 'orange' },
        ],
        vlines: [{ x: 'Px', dashed: true, color: 'gray' }],
        readouts: [
          { label: 'data (GB)', expr: 'Px', digits: 0 },
          { label: 'plan A (\\$)', expr: 'f0(Px)', digits: 0, color: 'blue' },
          { label: 'plan B (\\$)', expr: 'f1(Px)', digits: 0, color: 'orange' },
        ],
      }),
      check: (s) => s.P.x === 5 || (s.P.x < 5
        ? 'Here plan B is still the cheaper one. Keep going to the right.'
        : 'Now plan A is the cheaper one. You have gone past the crossing.'),
      solution: { P: { x: 5 } },
      explain: r`
        At 5 GB both plans cost \$20. On the graph that is the point $(5, 20){:}$ the only point that lies on **both** lines.

        To the left of it plan B is cheaper. To the right, plan A is.
      `,
    },
    {
      id: 'system',
      type: 'info',
      title: 'One point, two rules',
      text: r`
        Two equations that have to be true together are called a **system**:

        $$ \begin{aligned} y &= 2x + 10 \\ y &= 4x \end{aligned} $$

        A **solution** of the system is a pair $(x, y)$ that makes *both* equations true at once. Here it is $(5, 20){:}$ $\;\mathord{2 \times 5 + 10 = 20}\;$ and $\;\mathord{4 \times 5 = 20}.$

        :::key
        Every point on a line makes that line's equation true. The crossing point is on both lines, so it makes both true.
        :::

        Read a crossing point off the axes: straight down for $x,$ straight across for $y.$ Left of 0 and below 0, the numbers are negative.
      `,
      figure: plans({
        points: [{ x: 5, y: 20, color: 'ink' }],
        segments: [
          { from: [5, 20], to: [5, 0], color: 'gray', dashed: true },
          { from: [5, 20], to: [0, 20], color: 'gray', dashed: true },
        ],
        labels: [{ x: 5, y: 20, text: '(5, 20)', dx: -12, dy: -14, anchor: 'end' }],
        alt: 'The two plans as lines that cross at the point (5, 20). Dashed guides lead from the crossing point down to 5 on the x-axis and across to 20 on the y-axis.',
      }),
    },
    {
      id: 'read-crossing',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const x0 = rng.int(-3, 3);
        const y0 = rng.int(-2, 2);
        const up = rng.pick([1, 2, 3]);
        const down = rng.pick([-1, -2]);
        const [m1, m2] = rng.bool() ? [up, down] : [down, up];
        const b1 = y0 - m1 * x0;
        const b2 = y0 - m2 * x0;
        return {
          text: r`Here is the system $\;y = ${linear(m1, b1)}\;$ ([blue]{.blue}) and $\;y = ${linear(m2, b2)}\;$ ([orange]{.orange}), drawn as two lines. **Read its solution off the graph.**`,
          figure: {
            type: 'plot', ...CENTRED,
            fns: [{ expr: lineExpr(m1, b1), color: 'blue' }, { expr: lineExpr(m2, b2), color: 'orange' }],
            alt: `The lines y = ${linear(m1, b1)} and y = ${linear(m2, b2)} drawn on a grid. They cross at a single grid point.`,
          },
          template: r`$x =$ [[${x0}]] and $y =$ [[${y0}]]`,
          hints: ['Find the one point that sits on both lines, then read its position on each axis.'],
          explain: r`Both lines pass through $${point(x0, y0)}.$ The equations agree: the blue line is $\;y = ${linear(m1, b1)},$ the orange one is $\;y = ${linear(m2, b2)},$ and at $x = ${x0}$ both give $y = ${y0}.$`,
        };
      },
    },
    {
      id: 'on-both',
      type: 'choice',
      text: r`Which point is a solution of this system? $$ \begin{aligned} y &= 2x + 1 \\ y &= -x + 7 \end{aligned} $$`,
      options: [
        { text: r`$(2, 5)$`, correct: true },
        { text: r`$(1, 3)$`, why: r`It fits the first equation, since $2 \times 1 + 1 = 3.$ But the second gives $-1 + 7 = 6,$ not 3.` },
        { text: r`$(3, 4)$`, why: r`It fits the second equation, since $-3 + 7 = 4.$ But the first gives $2 \times 3 + 1 = 7,$ not 4.` },
        { text: r`$(0, 1)$`, why: r`It fits the first equation only. The second gives $-0 + 7 = 7,$ not 1.` },
      ],
      hints: ['A solution has to make **both** equations true. Test each point in both.'],
      explain: r`Only $(2, 5)$ lies on both lines: $2 \times 2 + 1 = 5$ and $-2 + 7 = 5.$ A point that fits just one equation is on one line, not at the crossing.`,
    },
    {
      id: 'example-set-equal',
      type: 'info',
      title: 'Without the graph',
      text: r`
        At the crossing point both lines have the **same** $y.$ So the two expressions for $y$ must be equal there, and that gives an equation with only $x$ in it.

        :::example
        Solve the system $\;\mathord{y = 7x + 2}\;$ and $\;\mathord{y = 4x + 32}.$

        | Line | Why |
        |---|---|
        | $\mathord{7x + 2 = 4x + 32}$ | both sides are $y$ |
        | $\mathord{3x + 2 = 32}$ | subtract $4x$ |
        | $\mathord{x = 10}$ | subtract 2, divide by 3 |
        | $\mathord{y = 7 \times 10 + 2 = 72}$ | use either equation |

        Check with the other equation: $\;\mathord{4 \times 10 + 32 = 72}$ ✓
        :::
      `,
    },
    {
      id: 'set-equal',
      type: 'fill',
      title: 'The phone plans, by algebra',
      text: r`
        At the crossing point, both phone plans have the **same** $y.$ So set their two expressions equal:

        $$ 2x + 10 = 4x $$

        That is an equation with $x$ on both sides, and you know how to solve those.
      `,
      template: r`
        1. Subtract $2x$ from both sides.
        2. That leaves $\;10 =$ [[2]]$x$
        3. So $\;x =$ [[5]]
        4. Plan B then gives $\;y =$ [[20]]
      `,
      explain: r`Setting the expressions equal finds the $x$ where the lines agree. Either equation then gives the $y{:}$ plan B says $4 \times 5 = 20,$ and plan A says $2 \times 5 + 10 = 20$ as well.`,
    },
    {
      id: 'solve-system',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const x = rng.int(2, 6);
        const m2 = rng.int(1, 3);
        const k = rng.int(1, 3);
        const m1 = m2 + k;
        const b1 = rng.int(1, 6);
        const b2 = b1 + k * x;                // so that m1·x + b1 = m2·x + b2
        const y = m1 * x + b1;
        const collect = k === 1
          ? r`Subtract $${term(m2)}$ from both sides: $\;x + ${b1} = ${b2},$ so $x = ${x}.$`
          : r`Subtract $${term(m2)}$ from both sides: $\;${k}x + ${b1} = ${b2},$ so $${k}x = ${k * x}$ and $x = ${x}.$`;
        return {
          text: r`Solve this system by setting the two expressions equal. $$ \begin{aligned} y &= ${linear(m1, b1)} \\ y &= ${linear(m2, b2)} \end{aligned} $$`,
          template: r`$x =$ [[${x}]] and $y =$ [[${y}]]`,
          hints: [
            r`Both right-hand sides are equal to $y,$ so they are equal to each other: $\;${linear(m1, b1)} = ${linear(m2, b2)}.$`,
            r`Subtract $${term(m2)}$ from both sides, then solve what is left. Do not forget to work out $y$ too.`,
          ],
          explain: r`Set them equal: $\;${linear(m1, b1)} = ${linear(m2, b2)}.$ ${collect} Then $y = ${m1} \times ${x} + ${b1} = ${y}.$ Check with the other equation: $${m2} \times ${x} + ${b2} = ${y}$ ✓`,
        };
      },
    },
    {
      id: 'meeting-point',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const race = rng.pick(RACES);
        const { start, slow, gap, steps: t } = race.numbers(rng);
        const lead = gap * t;
        const ahead = start + lead;
        const fast = slow + gap;
        const left = linear(slow, ahead);
        const right = linear(fast, start);
        const collect = `${start === 0
          ? r`Subtract $${term(slow)}$ from both sides`
          : r`Subtract $${term(slow)}$ and then ${start} from both sides`}: ${gap === 1 ? r`$\;x = ${t}.$` : r`$\;${lead} = ${gap}x,$ so $x = ${t}.$`}`;
        return {
          text: `${race.text({ ahead, start, slow, fast })}\n\n**${race.ask}**`,
          answer: t,
          unit: race.unit,
          wrong: [
            [lead, `That is the head start, ${lead}. But the gap closes by ${gap} with every ${race.one}. How many does it take?`],
            [ahead / fast, r`Both sides keep changing. Write an expression for each one and set them equal.`],
          ],
          hints: [
            r`Call the number of ${race.unit} $x.$ One side is $\;${left},$ the other is $\;${right}.$`,
            r`Set them equal, then collect the $x\text{'s}$ on one side: $\;${left} = ${right}$`,
          ],
          explain: r`Set the two expressions equal: $\;${left} = ${right}.$ ${collect} Another way to see it: the gap starts at ${lead} and closes by ${gap} with every ${race.one}.`,
        };
      },
    },
    {
      id: 'after-crossing',
      type: 'choice',
      text: r`Plan A costs $\;y = 2x + 10\;$ and plan B costs $\;y = 4x.$ They are level at 5 GB. **If you use more than 5 GB a month, which plan is cheaper?**`,
      figure: plans({
        points: [{ x: 5, y: 20, color: 'ink' }],
        labels: [{ x: 5, y: 20, text: '(5, 20)', dx: -12, dy: -14, anchor: 'end' }],
        alt: 'Plan A, y = 2x + 10, and plan B, y = 4x, drawn as lines on a graph of cost against data. Plan A starts at 10 and climbs gently. Plan B starts at 0 and climbs twice as steeply. They cross at the point (5, 20).',
      }),
      options: [
        { text: 'Plan A', correct: true, why: r`To the right of the crossing, A is the lower line. It climbs only \$2 per gigabyte.` },
        { text: 'Plan B', why: r`B was cheaper *before* the crossing. But it climbs \$4 per gigabyte, twice as fast as A, so beyond 5 GB it is the higher line.` },
        { text: 'They cost the same from there on', why: 'Two lines with different slopes meet at one point only, then move apart again.' },
      ],
      hints: ['Cheaper means lower on the graph. Look to the right of the crossing point: which line is underneath?'],
      explain: 'At the crossing, the cheaper plan switches. In the long run the line with the **smaller slope** wins, because it grows more slowly.',
    },
    {
      id: 'never-meet',
      type: 'interact',
      stretch: true,
      title: 'Lines that never meet',
      text: r`
        The [orange]{.orange} line is fixed. You control the slope $m$ of the [blue]{.blue} one:

        $$ \begin{aligned} \orange{y} &\orange{{}= 2x - 3} \\ \blue{y} &\blue{{}= mx + 2} \end{aligned} $$

        Most slopes make the two lines cross somewhere. **Find a slope for which they never meet.**
      `,
      widget: {
        type: 'plot', x: [-8, 8], y: [-6, 10], xStep: 2, yStep: 2,
        params: { m: { min: -3, max: 3, step: 0.5, value: -1, label: 'slope $m$', color: 'blue' } },
        fns: [{ expr: '2x - 3', color: 'orange' }, { expr: 'm*x + 2', color: 'blue' }],
        points: [{ x: '5/(2 - m)', y: '10/(2 - m) - 3', color: 'ink' }],
        readouts: [{ label: 'they cross at $x$ =', expr: '5/(2 - m)', digits: 2 }],
      },
      check: (s) => {
        if (s.m === 2) return true;
        if (Math.abs(s.m - 2) <= 0.5) return 'Very close. The crossing point has run off the screen, but the lines still meet far away. Match the orange slope exactly.';
        return 'They still cross. Watch the crossing point as you bring your slope closer to that of the orange line.';
      },
      solution: { m: 2 },
      hints: [
        'Lines that never meet are called parallel. What do parallel lines have in common?',
        'Give the blue line exactly the same slope as the orange one.',
      ],
      explain: r`
        With the same slope the blue line stays exactly 5 above the orange one and never touches it.
      `,
    },
    {
      id: 'teach-parallel',
      type: 'info',
      title: 'Same slope, no crossing',
      text: r`
        Lines with the same slope are **parallel**: they climb at the same rate, so the gap between them, here 5, never closes. The system has **no solution**.

        The algebra agrees. Setting the expressions equal gives $\mathord{2x + 2 = 2x - 3}.$ Subtract $2x$ from both sides and you are left with $2 = -3,$ which is never true. You met that once before, on a scale that would not balance.

        :::key
        **Different slopes:** the lines cross exactly once. **The same slope, different intercepts:** parallel lines, no solution.
        :::

        The slope is the number multiplying $x.$ In $y = x$ it is 1, and in $y = 4$ it is 0.
      `,
      figure: {
        type: 'plot', x: [-8, 8], y: [-6, 10], xStep: 2, yStep: 2,
        fns: [{ expr: '2x - 3', color: 'orange' }, { expr: '2x + 2', color: 'blue' }],
        segments: [{ from: [2, 1], to: [2, 6], color: 'gray', dashed: true }],
        labels: [
          { x: 2, y: 3.5, text: '5', dx: 9, dy: 5 },
        ],
        alt: 'The parallel lines y = 2x - 3 and y = 2x + 2. A dashed vertical segment between them, labelled 5, shows that the upper line is always 5 above the lower one.',
      },
    },
    {
      id: 'never-cross',
      type: 'multi',
      review: true,
      text: 'No graph this time. **Which of these pairs of lines never meet?**',
      options: [
        { text: r`$y = 2x + 1\;$ and $\;y = 2x + 5$`, correct: true },
        { text: r`$y = 3x\;$ and $\;y = x + 4$`, why: r`The slopes are 3 and 1. Different slopes always cross somewhere: here at $(2, 6).$` },
        { text: r`$y = -x + 6\;$ and $\;y = x$`, why: r`The slopes are $-1$ and 1. They are different, so the lines cross: at $(3, 3).$` },
        { text: r`$y = 5x - 1\;$ and $\;y = 5x + 1$`, correct: true },
        { text: r`$y = 4\;$ and $\;y = x$`, why: r`A flat line (slope 0) and a climbing line (slope 1) have different slopes. They cross at $(4, 4).$` },
      ],
      hints: ['Compare the slopes: the numbers that multiply $x.$'],
      explain: 'Different slopes: the lines must cross, exactly once. The same slope with different intercepts: parallel lines, and a system with no solution.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'In your own words: why does setting the two expressions equal to each other find the point where the lines cross?',
      model: r`
        At the crossing point, both lines have the same height $y$ above the same $x.$ Each expression *is* the height of its line. So "the same height" means "the two expressions are equal", and solving that equation gives the $x$ where it happens.

        It is the balance again: two sides that must weigh the same.
      `,
    },
  ],
  recap: [
    'A system is two equations that must be true together.',
    'Its solution is the point where the two lines cross: the one point on both.',
    'Without a graph: set the two expressions equal, solve for $x,$ then work out $y.$',
    'Same slope, different intercepts: parallel lines and no solution.',
  ],
  next: 'Next: lines are only the beginning. What happens to the graph when the rule multiplies $x$ by itself?',
};
