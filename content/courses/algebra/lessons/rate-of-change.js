// Algebra Foundations · Lesson 5 · Rate of Change
import { r, frac, num } from '../../../kit.js';
import { QUADRANT, point } from '../helpers.js';

/** Two points, a line segment between them, and the dashed run and rise. A is fixed at (ax, ay); B is dragged. */
const riseRunPlot = (ax, ay, bx, by, slopeLabel) => ({
  type: 'plot', ...QUADRANT,
  points: [
    { id: 'A', x: ax, y: ay, color: 'orange' },
    { id: 'B', x: bx, y: by, drag: 'xy', snap: 1, color: 'violet', label: 'B', coords: true },
  ],
  labels: [{ x: ax, y: ay, text: 'A', color: 'orange', dx: -12, dy: 5, anchor: 'end' }],   // to the left, clear of every line
  segments: [
    { from: 'A', to: 'B', color: 'ink' },
    { from: 'A', to: ['Bx', ay], color: 'green', dashed: true },
    { from: ['Bx', ay], to: 'B', color: 'red', dashed: true },
  ],
  readouts: [
    { label: 'run', expr: `Bx - ${ax}`, color: 'green', digits: 0 },
    { label: 'rise', expr: `By - ${ay}`, color: 'red', digits: 0 },
    { label: slopeLabel, expr: `(By - ${ay})/(Bx - ${ax})`, digits: 2 },
  ],
});

export default {
  id: 'rate-of-change',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Which is faster?',
      text: `
        Two phones are charging.

        - Phone A goes from **20% to 50%** in 30 minutes.
        - Phone B goes from **60% to 80%** in 10 minutes.

        **Which phone is charging faster?**
      `,
      shuffle: false,
      options: [
        { text: 'Phone A' },
        { text: 'Phone B', correct: true },
        { text: 'They charge equally fast' },
      ],
      explain: r`
        Phone B. It gained less in total (20 points against 30), but it did so in a third of the time.

        A gains $30 \div 30 = 1$ point per minute. B gains $20 \div 10 = 2$ points per minute. "How fast" is about the change **per minute**, not the total change.
      `,
    },
    {
      id: 'teach-rate',
      type: 'info',
      title: 'A rate is change per one',
      text: r`
        Phone B gained 20 points in 10 minutes. Shared out evenly, that is $20 \div 10 = 2$ points for **each** minute. A number of this kind, "so much per one", is a **rate**.

        A table gives a rate in the same way: divide the change in one row by the change in the other.

        :::example
        | Seconds | 0 | 10 | 20 | 30 |
        |---|---|---|---|---|
        | Distance cycled (m) | 5 | 75 | 145 | 215 |

        Every 10 seconds add 70 metres. For a single second that is $70 \div 10 = 7$ metres per second.
        :::
      `,
    },
    {
      id: 'per-one',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { x: 'Minutes', one: 'minute', y: 'Litres in the tank', q: 'How many litres are added **each minute**?', unit: 'litres per minute' },
          { x: 'Hours', one: 'hour', y: 'Distance travelled by a river barge (km)', q: 'How many kilometres does the barge travel **each hour**?', unit: 'km per hour' },
          { x: 'Weeks', one: 'week', y: 'Height of the plant (cm)', q: 'How many centimetres does the plant grow **each week**?', unit: 'cm per week' },
          { x: 'Days', one: 'day', y: 'Pages of the story written so far', q: 'How many pages are written **each day**?', unit: 'pages per day' },
        ]);
        const step = rng.pick([2, 3, 4, 5]);
        const m = rng.int(2, 6);
        const b = rng.int(1, 10);
        const xs = [0, 1, 2, 3].map((i) => i * step);
        const ys = xs.map((x) => m * x + b);
        return {
          text: `
            The numbers in this table change at a steady rate.

            | ${scene.x} | ${xs.join(' | ')} |
            |---|---|---|---|---|
            | ${scene.y} | ${ys.join(' | ')} |

            ${scene.q}
          `,
          answer: m,
          unit: scene.unit,
          wrong: [
            [m * step, `That is the change over ${step} ${scene.x.toLowerCase()}. Share it out: how much is that for a single ${scene.one}?`],
            [b, `That is the starting value. The question is how fast it *changes*.`],
          ],
          hints: [
            `From one column to the next, the top row goes up by ${step} and the bottom row goes up by ${m * step}.`,
            `Divide the change in the bottom row by the change in the top row: ${m * step} ÷ ${step}.`,
          ],
          explain: r`Every jump of ${step} in the top row adds ${m * step} to the bottom row. For a single ${scene.one} that is $${m * step} \div ${step} = ${m}.$`,
        };
      },
    },
    {
      id: 'teach-graph',
      type: 'info',
      title: 'From a table to a graph',
      text: r`
        A pair of numbers can be drawn as a **point**. $(2, 5)$ means: start where the two thick lines cross, then go 2 across and 5 up. The first number is called $x$ and the second $y.$ They are the point's **coordinates**.

        The thick line across is the **$x$-axis**. The upright one is the **$y$-axis**.

        | $x$ | 0 | 1 | 2 | 3 |
        |---|---|---|---|---|
        | $y$ | 1 | 3 | 5 | 7 |

        Each column of this table is one point. A steady rate, here 2 per step, puts the points on a **straight line**. Between two points, the [run]{.green} is how far you go across and the [rise]{.red} is how far you go up.
      `,
      figure: {
        type: 'plot', ...QUADRANT,
        fns: [{ expr: '2x + 1', color: 'blue' }],
        points: [{ x: 0, y: 1, color: 'orange' }, { x: 1, y: 3, color: 'orange' }, { x: 2, y: 5, color: 'orange' }, { x: 3, y: 7, color: 'orange' }],
        segments: [
          { from: [1, 3], to: [2, 3], color: 'green', dashed: true },
          { from: [2, 3], to: [2, 5], color: 'red', dashed: true },
        ],
        labels: [
          { x: 2, y: 5, text: '(2, 5)', dx: -12, dy: -6, anchor: 'end' },
          { x: 1.5, y: 3, text: 'run 1', color: 'green', dy: 22, anchor: 'middle' },
          { x: 2, y: 4, text: 'rise 2', color: 'red', dx: 12, dy: 5 },
        ],
        alt: 'A grid with the points (0, 1), (1, 3), (2, 5) and (3, 7), all on one straight line. Between (1, 3) and (2, 5) a dashed horizontal segment of length 1 is labelled run and a dashed vertical segment of length 2 is labelled rise.',
      },
    },
    {
      id: 'make-slope',
      type: 'interact',
      title: 'Steepness you can drag',
      text: r`
        On a graph, a steady rate is a straight line. The [run]{.green} is how far the line goes across. The [rise]{.red} is how far it goes up.

        **Drag point B so that the line climbs 2 for every 1 across.**
      `,
      widget: riseRunPlot(1, 1, 6, 2, 'rise ÷ run'),
      check: (s) => {
        const run = s.B.x - 1;
        const rise = s.B.y - 1;
        if (run <= 0) return 'Put B to the right of A, so that there is a run to measure.';
        if (rise === 2 * run) return true;
        if (rise <= 0) return 'The line has to climb: B must be higher than A.';
        return rise > 2 * run
          ? 'Too steep: that climbs more than 2 for each step across.'
          : 'Not steep enough: it should climb 2 for each step across.';
      },
      solution: { B: { x: 3, y: 5 } },
      hints: [
        'Start simple: from A go 1 step across and 2 steps up.',
        'B at (2, 3) works. So does (3, 5): twice as far across, twice as far up.',
      ],
      explain: r`
        Any point whose rise is twice its run will do: $(2, 3),$ $(3, 5),$ $(4, 7).$ They all lie on one straight line, because $\frac{2}{1} = \frac{4}{2} = \frac{6}{3} = 2.$

        That shared number is the steepness of the line.
      `,
    },
    {
      id: 'slope',
      type: 'info',
      title: 'Slope: the rate of a line',
      text: r`
        The **slope** of a line says how much $y$ changes each time $x$ goes up by 1. To measure it, take any two points on the line and divide:

        $$ \text{slope} = \frac{\red{\text{rise}}}{\green{\text{run}}} = \frac{\text{change in } y}{\text{change in } x} $$

        The line below passes through $(2, 2)$ and $(6, 4).$ Its rise is 2 and its run is 4, so its slope is $\frac{2}{4} = \frac{1}{2}{:}$ half a step up for every step across.

        :::note
        You have met a slope already. The tile pattern $2n + 1$ gained 2 tiles per step. That 2 was its rate of change.
        :::
      `,
      figure: {
        type: 'plot', ...QUADRANT,
        fns: [{ expr: '0.5x + 1', color: 'blue' }],
        points: [{ x: 2, y: 2, color: 'orange' }, { x: 6, y: 4, color: 'orange' }],
        segments: [
          { from: [2, 2], to: [6, 2], color: 'green', dashed: true },
          { from: [6, 2], to: [6, 4], color: 'red', dashed: true },
        ],
        labels: [
          { x: 2, y: 2, text: '(2, 2)', dx: -10, dy: -12, anchor: 'end' },
          { x: 6, y: 4, text: '(6, 4)', dx: -10, dy: -12, anchor: 'end' },
          { x: 4, y: 2, text: 'run 4', color: 'green', dy: 22, anchor: 'middle' },
          { x: 6, y: 3, text: 'rise 2', color: 'red', dx: 12, dy: 5 },
        ],
        alt: 'A line through the points (2, 2) and (6, 4). A dashed horizontal segment of length 4 is labelled run, and a dashed vertical segment of length 2 is labelled rise.',
      },
    },
    {
      id: 'downhill',
      type: 'interact',
      title: 'Going down',
      text: r`
        Not every line climbs. **Drag B so that the slope is $-1$**: the line should *drop* 1 for every 1 across.
      `,
      widget: riseRunPlot(1, 6, 5, 6, 'slope'),
      check: (s) => {
        const run = s.B.x - 1;
        const rise = s.B.y - 6;
        if (run <= 0) return 'Keep B to the right of A.';
        if (rise === -run) return true;
        if (rise > 0) return 'That line climbs, so its slope is positive. Move B *below* the level of A.';
        if (rise === 0) return 'Flat: the rise is 0, so the slope is 0. Lower B.';
        return -rise > run
          ? 'It falls more than 1 for each step across: too steep.'
          : 'It falls less than 1 for each step across: not steep enough.';
      },
      solution: { B: { x: 4, y: 3 } },
      hints: [
        'Going down means the rise is negative. Try 1 step across and 1 step down from A.',
        'B at (2, 5) works, and so does (4, 3).',
      ],
      explain: r`
        Moving to the right, the line loses height, so its rise is negative: for example $\frac{-3}{3} = -1.$
      `,
    },
    {
      id: 'teach-sign',
      type: 'info',
      title: 'What the sign says',
      text: r`
        A **negative slope** just means that $y$ goes down as $x$ goes up. And when B sat level with A, the rise was 0, which makes the slope 0: a flat line.

        | Slope | Moving to the right, the line |
        |---|---|
        | positive | [climbs]{.blue} |
        | zero | [stays level]{.gray} |
        | negative | [falls]{.orange} |

        :::key
        The **sign** of a slope gives the direction. Its **size** gives the steepness: a line of slope $-4$ falls faster than a line of slope $1$ climbs.
        :::
      `,
      figure: {
        type: 'plot', ...QUADRANT,
        fns: [
          { expr: 'x + 1', color: 'blue', from: 0, to: 3 },
          { expr: '3', color: 'gray', from: 4, to: 7 },
          { expr: '-2*(x - 8) + 6', color: 'orange', from: 8, to: 10.5 },
        ],
        labels: [
          { x: 1.5, y: 0, text: 'slope 1', color: 'blue', dy: -6, anchor: 'middle' },
          { x: 5.5, y: 0, text: 'slope 0', color: 'gray', dy: -6, anchor: 'middle' },
          { x: 9.25, y: 0, text: 'slope −2', color: 'orange', dy: -6, anchor: 'middle' },
        ],
        alt: 'Three short lines side by side. The first climbs 1 for each step across and is labelled slope 1. The second is level and is labelled slope 0. The third falls 2 for each step across and is labelled slope minus 2.',
      },
    },
    {
      id: 'sign-sort',
      type: 'bucket',
      review: true,
      text: 'Imagine a graph of each of these against time. **Would the line slope up, stay flat, or slope down?**',
      buckets: ['Positive slope', 'Zero slope', 'Negative slope'],
      items: [
        { text: 'Water level in a filling bath', bucket: 0, why: 'In a filling bath the water level rises as time passes, so the slope is positive.' },
        { text: 'Height of a burning candle', bucket: 2, why: 'A burning candle gets shorter as time passes: a negative slope.' },
        { text: 'Height of a book on a shelf', bucket: 1, why: 'The book on the shelf does not move. No change means a flat line, slope 0.' },
        { text: 'Distance walked so far', bucket: 0, why: 'The distance walked so far only grows as time passes: a positive slope.' },
        { text: 'Fuel left during a long drive', bucket: 2, why: 'The fuel that is left goes down as the car drives: a negative slope.' },
        { text: 'Temperature of a fridge kept at 4 °C', bucket: 1, why: 'A fridge that holds its temperature is not changing: slope 0.' },
      ],
      explain: 'Going up as time passes: positive. Going down: negative. Not changing at all: zero, a flat line.',
    },
    {
      id: 'example-two-points',
      type: 'info',
      title: 'Slope without a picture',
      text: r`
        You do not need a graph to find a slope: the coordinates of two points are enough. Subtract in the same order both times, **second point minus first**.

        :::example
        A line passes through $(3, 20)$ and $(8, 5).$

        | | Working |
        |---|---|
        | rise: the change in $y$ | $5 - 20 = -15$ |
        | run: the change in $x$ | $8 - 3 = 5$ |
        | slope: rise ÷ run | $\frac{-15}{5} = -3$ |

        The rise is negative, so the line falls: 3 down for every step across.
        :::
      `,
    },
    {
      id: 'two-points',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
        const run = rng.int(2, 4);
        const rise = m * run;
        const x1 = rng.int(0, 4);
        const y1 = m > 0 ? rng.int(0, 5) : -rise + rng.int(0, 5);
        const x2 = x1 + run;
        const y2 = y1 + rise;
        return {
          text: r`A line passes through $${point(x1, y1)}$ and $${point(x2, y2)}.$ **What is its slope?**`,
          answer: m,
          wrong: [
            [-m, m > 0
              ? 'From the first point to the second, $y$ goes up. A climbing line has a positive slope.'
              : `From the first point to the second, $y$ goes *down* by ${-rise}. A falling line has a negative slope.`],
            [run / rise, 'That is run ÷ rise. The change in $y$ goes on top.'],
            [rise, `That is the rise, the change in $y.$ Divide it by the run, ${run}.`],
            [run, `That is the run, the change in $x.$ Slope is the rise divided by the run.`],
          ],
          hints: [
            r`Rise: $${y2} - ${y1} = ${rise}.$ Run: $${x2} - ${x1} = ${run}.$`,
            r`Slope is rise ÷ run: $\;${rise} \div ${run}.$`,
          ],
          explain: r`Rise $= ${y2} - ${y1} = ${rise}$ and run $= ${x2} - ${x1} = ${run},$ so the slope is $\frac{${rise}}{${run}} = ${m}.$`,
        };
      },
    },
    {
      id: 'read-slope',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [rise, run] = rng.pick([[1, 2], [-1, 2], [3, 2], [-3, 2], [2, 1], [-2, 1], [1, 1], [-1, 1], [3, 1]]);
        const m = rise / run;
        const y1 = rise > 0 ? rng.int(0, 7 - 2 * rise) : rng.int(-2 * rise, 7);
        const x2 = 1 + 2 * run;
        const y2 = y1 + 2 * rise;
        return {
          text: 'The two dots sit exactly on grid points. **What is the slope of this line?** A fraction such as 3/2 is fine.',
          figure: {
            type: 'plot', ...QUADRANT,
            fns: [{ expr: `(${m})*(x - 1) + ${y1}`, color: 'blue' }],
            points: [{ x: 1, y: y1, color: 'orange' }, { x: x2, y: y2, color: 'orange' }],
            alt: `A straight line on a grid, with dots marked at ${point(1, y1)} and ${point(x2, y2)}.`,
          },
          answer: m,
          wrong: [
            [-m, m > 0 ? 'The line climbs from left to right, so its slope is positive.' : 'The line falls from left to right, so its slope is negative.'],
            [run / rise, 'That is run ÷ rise. The change in $y$ goes on top.'],
            [2 * rise, `That is the rise between the dots. Divide it by the run between them, ${2 * run}.`],
          ],
          hints: [
            `From the left dot to the right dot: how far across, and how far ${rise > 0 ? 'up' : 'down'}?`,
            `It goes ${2 * run} across and ${Math.abs(2 * rise)} ${rise > 0 ? 'up' : 'down'}. Divide the rise by the run${rise < 0 ? ', and remember that going down counts as negative' : ''}.`,
          ],
          explain: r`Between the dots the line goes ${2 * run} across and ${Math.abs(2 * rise)} ${rise > 0 ? 'up' : 'down'}: slope $= \frac{${2 * rise}}{${2 * run}} = ${frac(rise, run)}${Number.isInteger(m) ? '.$' : `$ (or ${num(m)}).`}`,
        };
      },
    },
    {
      id: 'steeper',
      type: 'choice',
      text: r`Line P has slope $2.$ Line Q has slope $-3.$ **Which line is steeper?**`,
      options: [
        { text: 'Line Q', correct: true, why: 'Q changes by 3 for each step across, P only by 2. The minus sign just says that Q heads downhill.' },
        { text: 'Line P', why: r`Careful: $-3$ is a smaller *number* than 2, but steepness is about how much the line changes per step, in either direction. Q changes by 3 each step.` },
        { text: 'They are equally steep', why: 'P changes by 2 per step and Q by 3 per step, so one of them is steeper.' },
      ],
      hints: ['Picture walking along each line. Uphill or downhill does not matter here: on which one does your height change more with every step?'],
      explain: r`The **sign** of a slope gives the direction: up or down. Its **size** gives the steepness. Falling 3 per step is steeper than climbing 2 per step.`,
    },
    {
      id: 'predict-y',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const m = rng.pick([2, 3, 4, -2, -3]);
        const x1 = rng.int(1, 4);
        const run = rng.int(3, 6);
        const y1 = m > 0 ? rng.int(1, 9) : rng.int(20, 30);
        const x2 = x1 + run;
        const y2 = y1 + m * run;
        return {
          text: r`A line has slope $${m}$ and passes through $${point(x1, y1)}.$ **What is $y$ on this line when $x$ is ${x2}?**`,
          prefix: '$y =$',
          answer: y2,
          wrong: [
            [y1 + m, `That is one step along. From $x = ${x1}$ to $x = ${x2}$ is ${run} steps.`],
            [m * x2, `The slope gives the *change* in $y,$ not $y$ itself. Start from the point you know, $${point(x1, y1)},$ and move ${run} steps.`],
            [y1 + run, `Each step across changes $y$ by the slope, ${m}, not by 1.`],
            [y1 - m * run, m > 0 ? 'A positive slope means $y$ goes up as $x$ goes up.' : 'A negative slope means $y$ goes down as $x$ goes up.'],
          ],
          hints: [
            `How many steps across is it from $x = ${x1}$ to $x = ${x2}?$`,
            r`Each step changes $y$ by ${m}, so over ${run} steps $y$ changes by $${run} \times ${m < 0 ? `(${m})` : m} = ${m * run}.$`,
          ],
          explain: r`From $x = ${x1}$ to $x = ${x2}$ is ${run} steps, and each step changes $y$ by ${m}. So $y = ${y1} ${m < 0 ? '-' : '+'} ${Math.abs(m * run)} = ${y2}.$ A slope lets you predict any point on the line from a single known one.`,
        };
      },
    },
    {
      id: 'match-slopes',
      type: 'match',
      text: 'Match each slope with what the line does.',
      pairs: [
        [r`Slope $3$`, 'Up 3 for each step across'],
        [r`Slope $-3$`, 'Down 3 for each step across'],
        [r`Slope $\frac{1}{3}$`, 'Up 1 for every 3 steps across'],
        [r`Slope $0$`, 'Flat: no change at all'],
      ],
      explain: r`Read a slope as "how much $y$ changes for every single step that $x$ takes". A fraction such as $\frac{1}{3}$ is a gentle climb: a third of a step up for each step across.`,
    },
  ],
  recap: [
    'A rate says how much one quantity changes for each 1 step of another.',
    r`Slope $= \dfrac{\text{rise}}{\text{run}}{:}$ the change in $y$ divided by the change in $x.$`,
    'Positive slopes climb, negative slopes fall, and a slope of 0 is flat.',
    'The size of a slope is its steepness. The sign is its direction.',
  ],
  next: 'Next: give a slope a starting point and you can write the equation of any line.',
};
