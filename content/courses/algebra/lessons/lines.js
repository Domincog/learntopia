// Algebra Foundations · Lesson 6 · The Line y = mx + b
import { r, linear, term } from '../../../kit.js';
import { CENTRED, TALL, lineExpr, point, upDown } from '../helpers.js';

/** The two sliders. Before the names "slope" and "intercept" are introduced they are just called m and b. */
const sliders = (m, b, named = false) => ({
  m: { min: -3, max: 3, step: 0.5, value: m, label: named ? 'slope $m$' : '$m$', color: 'blue' },
  b: { min: -4, max: 5, step: 1, value: b, label: named ? 'intercept $b$' : '$b$', color: 'orange' },
});

/** Stories for "a fixed start plus a steady rate". `rate` and `start` are drawn so that they never coincide. */
const STORIES = [
  {
    id: 'taxi',
    numbers: (rng) => { const rate = rng.int(2, 4); return { rate, start: rng.intExcept(3, 8, [rate]) }; },
    setup: ({ rate, start }) => r`A taxi charges **\$${start}** just for getting in, plus **\$${rate} for every kilometre**.`,
    ask: r`Write the cost $y,$ in dollars, of a ride of $x$ kilometres.`,
    once: 'The charge for getting in is paid once per ride, not once per kilometre.',
    reverse: (y) => ({ text: r`A ride cost **\$${y}**. How many kilometres was it?`, unit: 'km' }),
  },
  {
    id: 'plant',
    numbers: (rng) => { const rate = rng.int(2, 5); return { rate, start: rng.intExcept(6, 15, [rate]) }; },
    setup: ({ rate, start }) => `A seedling is **${start} cm** tall and grows **${rate} cm every week**.`,
    ask: r`Write its height $y,$ in centimetres, after $x$ weeks.`,
    once: 'The starting height is counted once, not once per week.',
    reverse: (y) => ({ text: `After how many weeks is it **${y} cm** tall?`, unit: 'weeks' }),
  },
  {
    id: 'tank',
    numbers: (rng) => { const rate = rng.int(3, 9); return { rate, start: rng.intExcept(10, 30, [rate]) }; },
    setup: ({ rate, start }) => `A tank holds **${start} litres** of water. A tap adds **${rate} litres every minute**.`,
    ask: r`Write the amount of water $y,$ in litres, after $x$ minutes.`,
    once: 'The water already in the tank is counted once, not once per minute.',
    reverse: (y) => ({ text: `After how many minutes does the tank hold **${y} litres**?`, unit: 'minutes' }),
  },
  {
    id: 'savings',
    numbers: (rng) => { const rate = rng.int(3, 9); return { rate, start: rng.intExcept(10, 40, [rate]) }; },
    setup: ({ rate, start }) => `A jar holds **${start} coins**. Every week, **${rate} more coins** go in.`,
    ask: r`Write the number of coins $y$ in the jar after $x$ weeks.`,
    once: 'The coins already in the jar are counted once, not once per week.',
    reverse: (y) => ({ text: `After how many weeks does the jar hold **${y} coins**?`, unit: 'weeks' }),
  },
];

export default {
  id: 'lines',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Twice as far, twice the price?',
      text: r`
        A taxi charges **\$4** just for getting in, plus **\$2 for every kilometre**.

        A 5 km ride costs \$14. **What does a 10 km ride cost?**
      `,
      shuffle: false,
      options: [
        { text: r`\$20` },
        { text: r`\$24`, correct: true },
        { text: r`\$28` },
      ],
      explain: r`
        \$24, not \$28. Doubling the distance doubles the per-kilometre part, from \$10 to \$20. But the \$4 for getting in is paid only once.

        A fixed start plus a steady rate: that combination describes every straight line you will meet in this lesson.
      `,
    },
    {
      id: 'steer',
      type: 'interact',
      graded: false,
      title: 'Two sliders, every line',
      text: r`
        This line is controlled by two numbers, $m$ and $b.$ Play with both sliders and watch what each one does.

        **Then steer the line through both orange dots.**
      `,
      widget: {
        type: 'plot', ...TALL,
        params: sliders(0.5, -2),
        fns: [{ expr: 'm*x + b', color: 'blue' }],
        points: [{ x: 0, y: 1, color: 'orange' }, { x: 2, y: 5, color: 'orange' }],
      },
      check: (s) => {
        if (s.m === 2 && s.b === 1) return true;
        if (s.b !== 1) return 'Use the $b$ slider first: move the line up or down until it passes through the dot on the $y$-axis.';
        return s.m < 2
          ? 'The first dot is caught. Now tilt the line more steeply to reach the second one.'
          : 'A little too steep for the second dot.';
      },
      solution: { m: 2, b: 1 },
      explain: r`
        $b$ slides the whole line up and down. It is where the line crosses the $y$-axis: here, at 1.

        $m$ tilts the line around that crossing point. It is the slope: from $(0, 1)$ to $(2, 5)$ the line rises 4 over a run of 2, so $m = 2.$
      `,
    },
    {
      id: 'what-b-does',
      type: 'choice',
      text: r`You change **only $b$**, from 1 to 4, and leave $m$ alone. What happens to the line?`,
      options: [
        { text: 'It slides up 3, keeping the same steepness', correct: true },
        { text: 'It gets steeper', why: r`Steepness is the job of $m.$ Changing $b$ alone leaves the tilt exactly as it was.` },
        { text: 'It slides 3 to the right', why: r`$b$ is added to $y,$ so every point moves **up**, not sideways.` },
        { text: 'It turns to slope downwards', why: r`The direction comes from the sign of $m.$ $b$ only moves the line up or down.` },
      ],
      explain: r`Adding 3 to $b$ adds 3 to every $y$-value, so the whole line moves up 3. Its slope is untouched.`,
    },
    {
      id: 'equation',
      type: 'info',
      title: 'y = mx + b',
      text: r`
        Every straight line, except a vertical one, has an equation of this form:

        $$ y = \blue{m}x + \orange{b} $$

        - $\orange{b}$ is the **$y$-intercept**: the value of $y$ when $x = 0,$ where the line crosses the $y$-axis.
        - $\blue{m}$ is the **slope**: how much $y$ changes each time $x$ goes up by 1.

        For the taxi, $y = 2x + 4{:}$ start at \$4, then add \$2 for each kilometre.

        :::note
        You have seen this shape before. The tile pattern $2n + 1$ had a part that grows and a part that is always there. A line is the same idea, drawn.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 10], y: [0, 24], xStep: 1, yStep: 4, xLabel: 'distance (km)', yLabel: 'cost ($)',
        fns: [{ expr: '2x + 4', color: 'blue' }],
        points: [{ x: 0, y: 4, color: 'orange' }],
        segments: [
          { from: [5, 14], to: [6, 14], color: 'green', dashed: true },
          { from: [6, 14], to: [6, 16], color: 'red', dashed: true },
        ],
        labels: [
          { x: 0, y: 4, text: 'starts at 4', color: 'orange', dx: 14, dy: 20 },
          { x: 6, y: 15, text: '+2 per km', color: 'red', dx: 12, dy: 6 },
        ],
        alt: 'The line y = 2x + 4 on a graph of cost against distance. It starts at 4 on the vertical axis and rises by 2 for every kilometre.',
      },
    },
    {
      id: 'match-line',
      type: 'interact',
      title: 'Hit the target',
      text: r`Set $m$ and $b$ so that your blue line lies exactly on the dashed one.`,
      widget: {
        type: 'plot', ...TALL,
        params: sliders(1, 0, true),
        fns: [{ expr: '-0.5x + 3', color: 'gray', dashed: true }, { expr: 'm*x + b', color: 'blue' }],
      },
      check: (s) => {
        if (s.m === -0.5 && s.b === 3) return true;
        if (s.b !== 3) return 'Start with $b.$ Where does the dashed line cross the $y$-axis?';
        if (s.m > 0) return 'Your line climbs, but the dashed one falls. Its slope must be negative.';
        if (s.m === 0) return 'Flat. The dashed line falls gently to the right: a small negative slope.';
        return 'Too steep. The dashed line drops only 1 for every 2 steps across.';
      },
      solution: { m: -0.5, b: 3 },
      hints: [
        r`The dashed line crosses the $y$-axis at 3. That gives you $b.$`,
        r`From $(0, 3)$ to $(2, 2)$ it goes 2 across and 1 down: a slope of $-\frac{1}{2}.$`,
      ],
      explain: r`The dashed line crosses the $y$-axis at 3, so $b = 3.$ It drops 1 for every 2 across, so $m = -\frac{1}{2}.$ Its equation is $\;y = -\frac{1}{2}x + 3.$`,
    },
    {
      id: 'example-read-line',
      type: 'info',
      title: 'Reading an equation off a graph',
      text: r`
        Two readings give the whole equation.

        :::example
        1. **Where does the line cross the $y$-axis?** At $-4,$ so $\mathord{b = -4}.$
        2. **From there, go 1 step to the right.** The line is now [3 higher]{.red}, so $m = 3.$

        In $y = mx + b$ that makes $\;\mathord{y = 3x + (-4)},$ which is written $\;\mathord{y = 3x - 4}.$
        :::

        A falling line has a negative $m.$ A slope of $1$ or $-1$ is written without the 1, as in $\;\mathord{y = -x + 2}.$ And a flat line has slope 0, so its $x$ disappears: $\;y = 3.$
      `,
      figure: {
        type: 'plot', x: [-6, 6], y: [-6, 2],
        fns: [{ expr: '3x - 4', color: 'blue' }],
        points: [{ x: 0, y: -4, color: 'orange' }],
        segments: [
          { from: [0, -4], to: [1, -4], color: 'green', dashed: true },
          { from: [1, -4], to: [1, -1], color: 'red', dashed: true },
        ],
        labels: [
          { x: 0, y: -4, text: 'crosses at −4', color: 'orange', dx: -14, dy: 26, anchor: 'end' },
          { x: 1, y: -2.5, text: '1 across, 3 up', color: 'red', dx: 12, dy: 5 },
        ],
        alt: 'The line y = 3x - 4 on a grid. It crosses the y-axis at minus 4. From that point, one step to the right and three steps up leads back onto the line.',
      },
    },
    {
      id: 'read-line',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const m = rng.pick([-3, -2, -1, 1, 2, 3]);
        const b = rng.intExcept(-3, 3, [0, m, -m]);
        return {
          text: 'Write the equation of this line.',
          figure: {
            type: 'plot', ...CENTRED,
            fns: [{ expr: lineExpr(m, b), color: 'blue' }],
            alt: `A straight line on a grid. It crosses the y-axis at ${b} and goes ${upDown(m)} for each step to the right.`,
          },
          answer: linear(m, b),
          vars: ['x'],
          prefix: '$y =$',
          placeholder: 'expression in x',
          wrong: [
            [linear(b, m), r`The two numbers are swapped. The number multiplying $x$ is the slope. The number on its own is where the line crosses the $y$-axis.`],
            [linear(-m, b), m > 0
              ? 'Your line would fall from left to right. This one climbs, so its slope is positive.'
              : 'Your line would climb from left to right. This one falls, so its slope is negative.'],
            [linear(m, -b), r`The slope is right. Look again at where the line crosses the $y$-axis: is it above zero or below?`],
            [term(m), r`The slope is right. But this line does not pass through $(0, 0){:}$ add the place where it crosses the $y$-axis.`],
          ],
          hints: [
            r`Where does the line cross the $y$-axis? That number is $b.$`,
            r`From that crossing point, go 1 step to the right. How far up or down must you go to meet the line again? That is $m.$`,
          ],
          explain: r`The line crosses the $y$-axis at ${b}, so $b = ${b}.$ For each step to the right it goes ${upDown(m)}, so $m = ${m}.$ Equation: $\;y = ${linear(m, b)}.$`,
        };
      },
    },
    {
      id: 'teach-story',
      type: 'info',
      title: 'A story is a line too',
      text: r`
        A fixed start plus a steady rate gives $\mathord{y = mx + b}$ straight away: the **rate** is $m$ and the **start** is $b.$

        :::example
        A pool holds 200 litres. A hose adds 50 litres every minute.

        - After $x$ minutes it holds $\;\mathord{y = 50x + 200}\;$ litres.
        - When does it hold 500 litres? Put 500 in place of $y$ and solve: $\;\mathord{50x + 200 = 500},$ so $\mathord{50x = 300}$ and $\mathord{x = 6}$ minutes.
        :::

        The equation works in both directions: from $x$ to $y,$ and from $y$ back to $x.$
      `,
    },
    {
      id: 'story-equation',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const story = rng.pick(STORIES);
        const { rate, start } = story.numbers(rng);
        return {
          text: `${story.setup({ rate, start })}\n\n**${story.ask}**`,
          answer: `${rate}x + ${start}`,
          vars: ['x'],
          prefix: '$y =$',
          placeholder: 'expression in x',
          wrong: [
            [`${start}x + ${rate}`, r`The two numbers are swapped. The amount that is added again and again multiplies $x.$ The starting amount stands on its own.`],
            [`${rate + start}x`, story.once],
            [`${rate}x`, `That is the part that grows. Do not forget the ${start} at the start.`],
            [`${rate} + ${start}`, r`Where is $x?$ The answer has to change when $x$ changes.`],
          ],
          hints: [
            r`What is $y$ when $x = 0?$ That is $b,$ the number that stands on its own.`,
            r`By how much does $y$ go up each time $x$ goes up by 1? That is $m,$ the number multiplying $x.$`,
          ],
          explain: r`The start is ${start}, so $b = ${start}.$ The rate is ${rate} per step, so $m = ${rate}.$ That gives $\;y = ${rate}x + ${start}.$`,
        };
      },
    },
    {
      id: 'story-backwards',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick(STORIES);
        const { rate, start } = story.numbers(rng);
        const x = rng.int(4, 12);
        const y = rate * x + start;
        const q = story.reverse(y);
        return {
          text: `${story.setup({ rate, start })}\n\n${q.text}`,
          answer: x,
          unit: q.unit,
          wrong: [
            [y - start, r`That is the part that grew, $${rate}x.$ Divide it by ${rate} to get $x.$`],
            [rate * y + start, `Here ${y} is the total, not the number of steps. You are looking for the $x$ that *gives* ${y}.`],
            [y / rate, `Take the starting ${start} away before you divide by ${rate}.`],
          ],
          hints: [
            r`The equation is $\;y = ${rate}x + ${start}.$ You know that $y = ${y}.$`,
            r`Solve $\;${rate}x + ${start} = ${y}{:}$ subtract ${start}, then divide by ${rate}.`,
          ],
          explain: r`Solve $\;${rate}x + ${start} = ${y}.$ Subtract ${start}: $${rate}x = ${y - start}.$ Divide by ${rate}: $x = ${x}.$ An equation of a line can be read forwards or solved backwards.`,
        };
      },
    },
    {
      id: 'example-draw',
      type: 'info',
      title: 'From an equation to its line',
      text: r`
        Two points fix a straight line, and the equation hands you both.

        :::example
        Draw $\;y = 3x - 1.$

        1. **Start at the intercept.** $b = -1,$ so the line crosses the $y$-axis at $(0, -1).$
        2. **Step with the slope.** $m = 3$ means [1 across]{.green}, [3 up]{.red}. That lands on $(1, 2).$
        3. Draw the line through the two points.
        :::

        With a negative slope you step **down** instead: for $m = -3,$ 1 across and 3 down.
      `,
      figure: {
        type: 'plot', ...TALL,
        fns: [{ expr: '3x - 1', color: 'blue' }],
        points: [{ x: 0, y: -1, color: 'orange' }, { x: 1, y: 2, color: 'violet' }],
        segments: [
          { from: [0, -1], to: [1, -1], color: 'green', dashed: true },
          { from: [1, -1], to: [1, 2], color: 'red', dashed: true },
        ],
        labels: [
          { x: 0, y: -1, text: '(0, −1)', color: 'orange', dx: -14, dy: 26, anchor: 'end' },
          { x: 1, y: 2, text: '(1, 2)', color: 'violet', dx: 12, dy: 5 },
        ],
        alt: 'The line y = 3x - 1 on a grid, with the points (0, -1) and (1, 2) marked. A dashed step of 1 across and 3 up leads from the first point to the second.',
      },
    },
    {
      id: 'draw-line',
      type: 'interact',
      title: 'Draw it yourself',
      text: r`
        Draw the line $\;y = -2x + 4.$

        Put point **P** where the line crosses the $y$-axis. Then use the slope to place **Q** somewhere else on the line.
      `,
      widget: {
        type: 'plot', ...TALL,
        fns: [{ expr: 'Py + (Qy - Py)/(Qx - Px)*(x - Px)', color: 'blue' }],
        points: [
          // the starting line falls gently, which keeps both coordinate labels clear of it
          { id: 'P', x: 0, y: 1, drag: 'y', snap: 1, color: 'orange', label: 'P', coords: true },
          { id: 'Q', x: 4, y: 0, drag: 'xy', snap: 1, color: 'violet', label: 'Q', coords: true },
        ],
      },
      check: (s) => {
        const onLine = (p) => p.y === -2 * p.x + 4;
        if (s.Q.x === 0) return 'Move Q off the $y$-axis, so that the two points pin down a line.';
        if (onLine(s.P) && onLine(s.Q)) return true;
        if (!onLine(s.P)) return 'P should mark the $y$-intercept: the value of $y$ when $x = 0.$';
        const slope = (s.Q.y - s.P.y) / (s.Q.x - s.P.x);
        if (slope > 0) return 'Your line climbs. A slope of $-2$ goes *down* 2 for each step to the right.';
        if (slope === 0) return 'Your line is flat. A slope of $-2$ goes down 2 for each step to the right.';
        return slope < -2
          ? 'P is right, but the line is too steep. It should go down just 2 for each step to the right.'
          : 'P is right, but the line is not steep enough. It should go down 2 for each step to the right.';
      },
      solution: { P: { x: 0, y: 4 }, Q: { x: 2, y: 0 } },
      hints: [
        r`When $x = 0,$ $y = -2 \times 0 + 4 = 4.$ So P belongs at $(0, 4).$`,
        r`From $(0, 4)$ go 1 step right and 2 steps down, to $(1, 2).$ Any point you reach by repeating that move will do.`,
      ],
      explain: r`Start at the intercept, $(0, 4).$ The slope $-2$ says "1 across, 2 down", which leads to $(1, 2),$ then $(2, 0),$ then $(3, -2).$ Two points are enough to fix a straight line.`,
    },
    {
      id: 'example-through',
      type: 'info',
      title: 'When neither point is the intercept',
      text: r`
        Two points still give the whole equation. Find the slope first, then walk back to the $y$-axis.

        :::example
        A line passes through $(2, 7)$ and $(4, 17).$

        1. **Slope.** The rise is $17 - 7 = 10$ and the run is $4 - 2 = 2,$ so $m = 10 \div 2 = 5.$
        2. **Intercept.** From $(2, 7)$ it is 2 steps to the left to reach $x = 0.$ Each step to the left lowers $y$ by 5, so $\;\mathord{b = 7 - 10 = -3}.$

        Equation: $\;y = 5x - 3.$ Check with the other point: $\;\mathord{5 \times 4 - 3 = 17}$ ✓
        :::
      `,
    },
    {
      id: 'through-two-points',
      type: 'expr',
      stretch: true,
      gen: (rng) => {
        const m = rng.pick([-2, -1, 2, 3, 4]);
        const b = rng.intExcept(-4, 6, [0, m]);
        const x1 = rng.int(1, 3);
        const x2 = x1 + rng.int(1, 3);
        const y1 = m * x1 + b;
        const y2 = m * x2 + b;
        return {
          text: r`A line passes through $${point(x1, y1)}$ and $${point(x2, y2)}.$ Neither point is on the $y$-axis. **Write the equation of the line.**`,
          answer: linear(m, b),
          vars: ['x'],
          prefix: '$y =$',
          placeholder: 'expression in x',
          wrong: [
            [linear(m, y1), r`The slope is right. But ${y1} is the value of $y$ at $x = ${x1},$ not at $x = 0.$ Walk back ${x1} ${x1 === 1 ? 'step' : 'steps'} from there.`],
            [linear(m, y2), r`The slope is right. But ${y2} is the value of $y$ at $x = ${x2},$ not at $x = 0.$`],
            [term(m), r`The slope is right. Now find $b{:}$ what is $y$ when $x = 0?$`],
          ],
          hints: [
            'First the slope: the rise divided by the run between the two points.',
            r`Then walk back from $${point(x1, y1)}$ to $x = 0.$ Each step to the left ${m > 0 ? 'lowers' : 'raises'} $y$ by ${Math.abs(m)}.`,
            r`Or put a point into $\;y = ${m}x + b\;$ and solve for $b{:}$ $\;${y1} = ${m} \times ${x1} + b.$`,
          ],
          explain: r`Slope: $\frac{${y2} - ${y1 < 0 ? `(${y1})` : y1}}{${x2} - ${x1}} = ${m}.$ Then use one point to find $b{:}$ $\;${y1} = ${m} \times ${x1} + b,$ so $b = ${b}.$ Equation: $\;y = ${linear(m, b)}.$`,
        };
      },
    },
    {
      id: 'match-stories',
      type: 'match',
      review: true,
      text: 'Match each equation with its story.',
      pairs: [
        [r`$y = 3x + 2$`, 'Starts at 2, goes up 3 each step'],
        [r`$y = 2x + 3$`, 'Starts at 3, goes up 2 each step'],
        [r`$y = -2x + 3$`, 'Starts at 3, goes down 2 each step'],
        [r`$y = 3$`, 'Stays at 3 the whole time'],
      ],
      explain: r`In $y = mx + b,$ the number on its own is the start, and the number multiplying $x$ is the change per step. With no $x$ at all, nothing changes: a flat line.`,
    },
  ],
  recap: [
    'Every straight line that is not vertical can be written $y = mx + b.$',
    '$b$ is the $y$-intercept: the value of $y$ when $x = 0,$ the starting amount.',
    '$m$ is the slope: the change in $y$ for each 1 step of $x.$',
    'A fixed start plus a steady rate always makes a straight line.',
  ],
  next: 'Next: two lines on one graph. Where they cross, two stories agree.',
};
