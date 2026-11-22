// Calculus in Pictures · Lesson 2 · The Slope Machine
import { r, num } from '../../../kit.js';

// The microscope used at the start: y = x² around the point (1, 1), where the slope is 2.
const ZOOM = { type: 'curve-zoom', fn: 'x^2', at: 1, x: [-3.5, 5.5] };

// A curve with one hill and one valley. Its slope at x is x² − 1: zero at x = −1 and x = 1.
const WAVE = 'x^3/3 - x';

export default {
  id: 'the-derivative',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Under the microscope',
      text: r`
        A straight line has one slope. A curve bends all the time, so what
        could "its slope" even mean?

        Here is the curve $y = x^2$ with one point marked. Imagine zooming in
        on that point: ×10, then ×100, then ×1000.

        **What will the piece of curve around the point look like?**
      `,
      figure: { ...ZOOM, height: 380, static: true, alt: 'The parabola y equals x squared, with the point (1, 1) marked on it.' },
      columns: 1,
      options: [
        { text: 'More and more sharply bent' },
        { text: 'Just as curved as it looks now' },
        { text: 'More and more like a straight line', correct: true },
      ],
      explain: `
        Zoom in far enough on any smooth curve and it looks straight. The
        Earth plays the same trick: it is round, yet the ground under your
        feet looks flat. See for yourself.
      `,
    },
    {
      id: 'zoom',
      type: 'interact',
      graded: false,
      title: 'Zoom in',
      text: `
        **Slide the zoom up to at least ×100.**

        Keep an eye on the numbers along the edges. They show how small a
        piece of the curve you are looking at.
      `,
      widget: { ...ZOOM, alt: 'A microscope view of the parabola around the point (1, 1), with a zoom slider.' },
      check: (s) => s.zoom >= 100 || 'Keep going: zoom in to ×100 or more.',
      solution: { zoom: 1000 },
      explain: `
        By ×100 the piece of curve around the point looks like a straight
        line. By ×1000 you could lay a ruler along it.

        Zooming did not straighten anything or change how steep it is. It
        only showed you a smaller and smaller piece. And a straight piece has
        a slope you can measure.
      `,
    },
    {
      id: 'zoom-slope',
      type: 'numeric',
      text: `
        Here is the view at ×100. The curve passes through the orange point,
        (1, 1), and looks perfectly straight.

        **For every 1 square it moves to the right, how many squares does it climb?**
      `,
      figure: { ...ZOOM, zoom: 100, static: true, alt: 'The parabola magnified 100 times around (1, 1). It looks like a straight line passing through the grid corners (0.98, 0.96), (1, 1) and (1.02, 1.04).' },
      answer: 2,
      tolerance: 0.1,
      wrong: [
        [0.5, 'That is squares across for each square up. Slope is the other way round: up ÷ across.'],
        [1, 'Follow the line from the orange point to the next corner of the grid that it passes through. It is one square across, but more than one up.'],
      ],
      hints: [
        'Start at the orange point, (1, 1). Follow the line up and to the right until it next passes through a corner of the grid.',
        'It passes through the corner at (1.02, 1.04): one square across, and how many up?',
      ],
      explain: r`
        From $(1, 1)$ the line climbs to $(1.02,\ 1.04)$, as near as the eye
        can tell: $0.02$ across and $0.04$ up.

        $$ \text{slope} = \frac{0.04}{0.02} = 2 $$

        Zoom in further and the reading only gets closer to 2. So the curve
        $y = x^2$ has slope **2** at the point where $x = 1$. One point, one slope.
      `,
    },
    {
      id: 'tangent',
      type: 'info',
      title: 'The tangent line',
      text: `
        The straight line that a curve turns into under the microscope has a
        name: the **tangent line** at that point. It touches the curve there
        and heads in exactly the curve's direction.

        :::key
        The **slope of a curve at a point** is the slope of its tangent line there.
        :::

        This is also where the shrinking stretches of Lesson 1 were heading.
        **Slide the gap toward zero** and watch the [secant]{.violet} swing
        onto the [tangent]{.orange}.
      `,
      figure: {
        type: 'plot', x: [-1, 4], y: [-1, 10], xStep: 1, yStep: 2,
        params: { h: { min: 0.05, max: 2, step: 0.05, value: 2, label: 'gap', color: 'violet' } },
        fns: [{ expr: 'x^2', color: 'blue' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        secants: [{ fn: 0, from: 1, to: '1 + h', color: 'violet' }],
        readouts: [
          { label: 'slope of the secant', expr: '(f0(1 + h) - f0(1)) / h', color: 'violet' },
          { label: 'slope of the tangent', expr: 'd0(1)', color: 'orange' },
        ],
        alt: 'The parabola y equals x squared with its tangent at x = 1 and a secant from x = 1 to a second point. A slider shrinks the gap between the two points.',
      },
    },
    {
      id: 'zero-slope',
      type: 'interact',
      title: 'Hunt for level ground',
      text: `
        The orange line is the tangent at the point, and the readout shows
        its slope.

        **Drag the point to a place where the slope is exactly 0.**
      `,
      widget: {
        type: 'plot', x: [-3, 3], y: [-3, 3], xStep: 1, yStep: 1,
        fns: [{ expr: WAVE, color: 'blue' }],
        points: [{ id: 'P', x: -2, on: 0, drag: 'x', snap: 0.25, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [{ label: 'slope at the point', expr: 'd0(Px)', color: 'orange' }],
        alt: 'A curve that climbs to a hilltop, falls into a valley and climbs again, with a draggable point and its tangent line.',
      },
      check: (s) => {
        const slope = s.P.x * s.P.x - 1;
        if (Math.abs(slope) < 1e-6) return true;
        return slope > 0
          ? 'The curve is climbing here, so the slope is positive. Look for a spot where the tangent is perfectly level.'
          : 'The curve is heading downhill here, so the slope is negative. Look for a spot where the tangent is perfectly level.';
      },
      solution: { P: { x: -1 } },
      hints: [
        'A slope of 0 means the tangent is perfectly level: neither climbing nor falling.',
        'Try the very top of the hill, or the very bottom of the dip.',
      ],
      explain: r`
        There are two such places: the **top of the hill** ($x = -1$) and the
        **bottom of the valley** ($x = 1$). At both, the tangent is level.
      `,
    },
    {
      id: 'teach-slope-signs',
      type: 'info',
      title: 'Uphill, level, downhill',
      text: r`
        Read a curve from left to right, like a sentence. The **sign** of its
        slope says which way it is heading, and the four tangents in the
        picture show every case.

        | Point | The curve is… | Its slope is… |
        |:--|:--|:--|
        | A | climbing | positive |
        | B | level, on a hilltop | zero |
        | C | falling | negative |
        | D | level, on a valley floor | zero |

        The steeper the climb or the fall, the further the slope is from zero.
      `,
      figure: {
        type: 'plot', x: [-4.6, 4.6], y: [-3.2, 3.2], tickLabels: false,
        fns: [{ expr: 'x^3/12 - x', color: 'blue' }],
        tangents: [-3.5, -2, 0, 2].map((at) => ({ fn: 0, at, color: 'orange' })),
        points: [-3.5, -2, 0, 2].map((x) => ({ x, on: 0, color: 'orange' })),
        labels: [
          { x: -3.5, y: -0.07, text: 'A', dx: -12, dy: -10, anchor: 'end' },
          { x: -2, y: 1.33, text: 'B', dx: 0, dy: -14, anchor: 'middle' },
          { x: 0, y: 0, text: 'C', dx: 12, dy: -10, anchor: 'start' },
          { x: 2, y: -1.33, text: 'D', dx: 0, dy: 26, anchor: 'middle' },
        ],
        alt: 'A curve that climbs to a hilltop, falls into a valley and climbs again. Tangent lines are drawn at four points: A, where the curve is climbing and the tangent tilts upward; B, the hilltop, where the tangent is level; C, where the curve is falling and the tangent tilts downward; and D, the valley floor, where the tangent is level again.',
      },
    },
    {
      id: 'signs',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const flip = rng.bool();
        const scene = rng.pick(['the height of a roller-coaster track', 'the height of a hiking trail', 'the water level in a harbour', 'the temperature in a greenhouse']);
        const sign = flip ? -1 : 1;
        const f = (x) => sign * ((x * x * x) / 3 - x);
        const slope = (x) => sign * (x * x - 1);
        const xs = [-2, -1, -0.3, 0.5, 1, 2];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const place = (x) => {
          const m = slope(x);
          if (Math.abs(m) < 1e-9) return f(x) > 0 ? { dx: 0, dy: -14, anchor: 'middle' } : { dx: 0, dy: 26, anchor: 'middle' };
          return m > 0 ? { dx: -11, dy: -9, anchor: 'end' } : { dx: 11, dy: -9, anchor: 'start' };
        };
        return {
          text: `The curve shows ${scene}. **Sort the six marked points by the slope of the curve at each one.**`,
          figure: {
            type: 'plot', x: [-2.7, 2.7], y: [-2, 2], tickLabels: false,
            fns: [{ expr: flip ? 'x - x^3/3' : WAVE, color: 'blue' }],
            points: xs.map((x) => ({ x, on: 0, color: 'orange' })),
            labels: xs.map((x, i) => ({ x, y: f(x), text: letters[i], ...place(x) })),
            alt: `A wavy curve with six marked points. ${xs.map((x, i) => `${letters[i]} is where the curve is ${Math.abs(slope(x)) < 1e-9 ? (f(x) > 0 ? 'at the top of a hill' : 'at the bottom of a valley') : slope(x) > 0 ? 'climbing' : 'falling'}`).join('; ')}.`,
          },
          buckets: ['Slope is positive', 'Slope is zero', 'Slope is negative'],
          items: xs.map((x, i) => {
            const m = slope(x);
            if (Math.abs(m) < 1e-9) return { text: letters[i], bucket: 1, why: `At ${letters[i]} the curve is at the ${f(x) > 0 ? 'top of a hill' : 'bottom of a valley'}: for an instant it is level, so the slope is zero.` };
            return m > 0
              ? { text: letters[i], bucket: 0, why: `At ${letters[i]} the curve is climbing as you move to the right: a positive slope.` }
              : { text: letters[i], bucket: 2, why: `At ${letters[i]} the curve is heading downhill as you move to the right: a negative slope.` };
          }),
        };
      },
      explain: `
        Read a curve from left to right, like a sentence. Climbing means a
        positive slope, falling means a negative slope, and the level spots
        at the top of a hill or the bottom of a valley have slope zero.
      `,
    },
    {
      id: 'example-tangent-slope',
      type: 'info',
      title: 'Putting a number on it',
      text: r`
        A tangent is a straight line, so its slope is measured like the slope
        of any line: take two points **on the tangent** and divide the rise
        by the run.

        :::example
        The orange tangent touches the curve at P (3, 5) and also passes
        through R (1, −1). From R to P:

        $$ \frac{\text{rise}}{\text{run}} = \frac{5 - (-1)}{3 - 1} = \frac{6}{2} = 3 $$

        So the slope of the curve at P is 3.
        :::

        The second point has to be on the tangent. A second point on the
        *curve* would give a secant, and only an average.
      `,
      figure: {
        type: 'plot', x: [-4, 6], y: [-3, 9], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2/2 + 0.5', color: 'blue' }],
        tangents: [{ fn: 0, at: 3, color: 'orange' }],
        segments: [
          { from: [1, -1], to: [3, -1], color: 'green', dashed: true },
          { from: [3, -1], to: [3, 5], color: 'red', dashed: true },
        ],
        points: [{ x: 3, y: 5, color: 'orange' }, { x: 1, y: -1, color: 'ink' }],
        labels: [
          { x: 3, y: 5, text: 'P (3, 5)', color: 'orange', dx: -10, dy: -9, anchor: 'end' },
          { x: 1, y: -1, text: 'R (1, −1)', dx: -10, dy: 5, anchor: 'end' },
          { x: 2, y: -1, text: 'run 2', color: 'green', dx: 0, dy: 20, anchor: 'middle' },
          { x: 3, y: 2, text: 'rise 6', color: 'red', dx: 10, dy: 5, anchor: 'start' },
        ],
        alt: 'A curve with its tangent line at the point P (3, 5). The tangent also passes through R (1, −1). A dashed triangle between R and P shows a run of 2 and a rise of 6.',
      },
    },
    {
      id: 'read-slope',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const flip = rng.bool();
        const a = rng.pick([-4, -2, 2, 4]);
        const f = (x) => (flip ? 6 - (x * x) / 4 : (x * x) / 4);
        const m = ((flip ? -1 : 1) * a) / 2;
        const P = { x: a, y: f(a) };
        const step = [2, -2, 1, -1].find((d) => Math.abs(a + d) <= 6 && P.y + m * d >= -1 && P.y + m * d <= 7);
        const R = { x: a + step, y: P.y + m * step };
        const [lo, hi] = P.x < R.x ? [P, R] : [R, P];
        const pretty = (v) => String(v).replace('-', '−');
        // labels go on the side of the tangent that the curve is not on
        const side = flip
          ? (m > 0 ? { dx: -10, dy: -9, anchor: 'end' } : { dx: 10, dy: -9, anchor: 'start' })
          : (m > 0 ? { dx: 10, dy: 21, anchor: 'start' } : { dx: -10, dy: 21, anchor: 'end' });
        return {
          text: `
            The orange line is the **tangent** to the curve at P. It also
            passes through R.

            **What is the slope of the curve at P?**
          `,
          figure: {
            type: 'plot', x: [-7, 7], y: [-2, 8], xStep: 2, yStep: 2,
            fns: [{ expr: flip ? '6 - x^2/4' : 'x^2/4', color: 'blue' }],
            tangents: [{ fn: 0, at: a, color: 'orange' }],
            points: [{ x: P.x, y: P.y, color: 'orange' }, { x: R.x, y: R.y, color: 'ink' }],
            labels: [
              { x: P.x, y: P.y, text: `P (${pretty(P.x)}, ${pretty(P.y)})`, color: 'orange', ...side },
              { x: R.x, y: R.y, text: `R (${pretty(R.x)}, ${pretty(R.y)})`, ...side },
            ],
            alt: `A curve with its tangent line at the point P (${P.x}, ${P.y}). The tangent also passes through R (${R.x}, ${R.y}).`,
          },
          answer: m,
          wrong: [
            [-m, m < 0 ? 'Check the sign: from left to right the tangent goes *down*, so its slope is negative.' : 'Check the sign: from left to right the tangent goes *up*, so its slope is positive.'],
            [1 / m, 'That is run ÷ rise. Slope is rise ÷ run.'],
            [P.y / P.x, 'That divides P\'s height by its x. The slope comes from the tangent line: rise ÷ run between P and R.'],
          ],
          hints: [
            'The slope of the curve at P is the slope of its tangent line. Use the two points you know on that line.',
            r`From $(${lo.x}, ${lo.y})$ to $(${hi.x}, ${hi.y})$: rise $${num(hi.y - lo.y)}$, run $${num(hi.x - lo.x)}$.`,
          ],
          explain: r`
            The slope of the curve at P is the slope of the tangent there.
            Between $(${lo.x}, ${lo.y})$ and $(${hi.x}, ${hi.y})$:

            $$ \frac{\text{rise}}{\text{run}} = \frac{${num(hi.y - lo.y)}}{${num(hi.x - lo.x)}} = ${num(m)} $$
          `,
        };
      },
    },
    {
      id: 'teach-function',
      type: 'info',
      title: 'A name for the rule',
      text: r`
        So far a curve has come with an equation such as $y = x^2$. From here
        on, the rule that makes the curve gets a name of its own, usually
        $f$. Such a rule is called a **function**: put in an $x$, and exactly
        one number comes out.

        That number is written $f(x)$, read "f of x". It is the height of
        the graph above $x$.

        :::example
        If $f(x) = x^2$, then $f(3) = 3^2 = 9$: at $x = 3$ the graph is 9 high.
        :::

        **Drag the point** and watch $f(x)$ change with $x$.
      `,
      figure: {
        type: 'plot', x: [-4, 4], y: [-1, 11], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2', color: 'blue' }],
        points: [{ id: 'P', x: 3, on: 0, drag: 'x', snap: 0.5, color: 'orange' }],
        segments: [{ from: ['Px', 0], to: 'P', color: 'orange', dashed: true }],
        readouts: [
          { label: 'x', expr: 'Px', digits: 1 },
          { label: 'f(x)', expr: 'f0(Px)', digits: 2, color: 'orange' },
        ],
        alt: 'The graph of f(x) equals x squared with a draggable point on it. A dashed line shows the height of the point above the x-axis, and readouts give x and f(x).',
      },
    },
    {
      id: 'tracer',
      type: 'interact',
      graded: false,
      title: 'Record every slope',
      text: `
        One slope at a time is slow. This machine records them all.

        **Drag the point slowly from the far left to the far right.** Under
        each $x$, the lower panel plots the slope of the curve at that $x$.
      `,
      widget: {
        type: 'slope-tracer', fn: WAVE, x: [-2.5, 2.5], y: [-3, 3], dy: [-2, 6], dyStep: 2, start: -2.4,
        labels: { f: 'the curve', d: 'its slope at each x' },
        alt: 'Top: a curve with a hill and a valley, with a movable tangent. Bottom: a graph that records the slope at each x.',
      },
      check: (s) => s.done || 'Keep going: sweep the point across the whole curve, from one edge to the other.',
      solution: { x: 2.5, traced: true },
      explain: `
        The slopes you recorded make a curve of their own.

        It sits at **zero** exactly under the hilltop and the valley floor. It
        dips **below zero** where the first curve runs downhill. And it climbs
        **high** where the first curve is steep.
      `,
    },
    {
      id: 'derivative',
      type: 'info',
      title: 'The derivative',
      text: r`
        That lower curve is a function in its own right: give it an $x$, and
        it tells you the slope of the original curve at that $x$.

        :::key
        The **derivative** of $f$, written $f'$ ("f prime"), is the function
        whose value at each $x$ is the slope of $f$ there. So $f'(x)$ is the
        slope of $f$ at $x$: how fast $f$ is changing there.
        :::

        In the picture $f'(1) = 0$, because $f$ is level at $x = 1$.
        Read $f'$ like a gauge:

        - $f' > 0$: $f$ is climbing
        - $f' = 0$: $f$ is level, as at a peak or a valley
        - $f' < 0$: $f$ is falling
        - the further $f'$ is from zero, the steeper $f$ is
      `,
      figure: {
        type: 'slope-tracer', fn: WAVE, x: [-2.5, 2.5], y: [-3, 3], dy: [-2, 6], dyStep: 2, start: 1, reveal: true, static: true,
        labels: { f: 'f', d: 'its derivative f′' },
        alt: 'Top: the curve f with a hill at x = −1 and a valley at x = 1. Bottom: its derivative, a U-shaped curve that crosses zero at x = −1 and x = 1.',
      },
    },
    {
      id: 'match-derivative',
      type: 'interact',
      review: true,
      attempts: 2,
      gen: (rng) => {
        const backwards = 'That graph is positive where $f$ is falling and negative where $f$ is climbing: exactly the wrong way round.';
        const same = 'That is the graph of $f$ again. The derivative shows the *slope* of $f$, not its height.';
        const flat = 'A level derivative means the same slope everywhere, which would make $f$ a straight line. But $f$ bends.';
        const once = 'A straight line crosses zero only once. But $f$ is level twice, at its peak and at its valley, so its derivative must be zero twice.';
        const item = rng.pick([
          {
            shape: 'a valley', f: 'x^2/2 - 2',
            options: [['x', 'a straight line rising through the origin'], ['-x', 'a straight line falling through the origin', backwards], ['x^2/2 - 2', 'a valley-shaped curve', same], ['1.5', 'a level line above the axis', flat]],
          },
          {
            shape: 'a hill', f: '2 - x^2/2',
            options: [['-x', 'a straight line falling through the origin'], ['x', 'a straight line rising through the origin', backwards], ['2 - x^2/2', 'a hill-shaped curve', same], ['-1.5', 'a level line below the axis', flat]],
          },
          {
            shape: 'a wave that climbs, dips, then climbs again', f: 'x^3/3 - x',
            options: [['x^2 - 1', 'a U-shaped curve, below the axis between x = −1 and x = 1'], ['1 - x^2', 'an upside-down U, above the axis between x = −1 and x = 1', backwards], ['x^3/3 - x', 'a wave that climbs, dips, then climbs again', same], ['x', 'a straight line rising through the origin', once]],
          },
          {
            shape: 'a wave that falls, rises, then falls again', f: 'x - x^3/3',
            options: [['1 - x^2', 'an upside-down U, above the axis between x = −1 and x = 1'], ['x^2 - 1', 'a U-shaped curve, below the axis between x = −1 and x = 1', backwards], ['x - x^3/3', 'a wave that falls, rises, then falls again', same], ['-x', 'a straight line falling through the origin', once]],
          },
        ]);
        const order = rng.shuffle([0, 1, 2, 3]);       // option 0 is the right one
        const shown = order.map((k) => item.options[k]);
        const right = order.indexOf(0);
        return {
          text: `The blue graph is a function $f$: ${item.shape}. **Tap the orange graph that shows its derivative $f'$.**`,
          widget: {
            type: 'graph-pick', x: [-3, 3], y: [-4, 4], xStep: 1, yStep: 2,
            given: { expr: item.f, color: 'blue', label: 'f' },
            options: shown.map(([expr, alt]) => ({ expr, alt })),
            alt: `The graph of f, ${item.shape}, above four candidate graphs labelled A to D.`,
          },
          check: (s) => {
            if (s.picked === right) return true;
            return s.picked == null ? 'Tap one of the four orange graphs.' : shown[s.picked][2];
          },
          solution: { picked: right },
          hints: [
            'Find where $f$ is level (a peak or a valley). Its derivative must be zero at exactly those $x$ values.',
            'Then look at a stretch where $f$ is climbing. There the derivative must be above the axis.',
          ],
        };
      },
      explain: `
        Match the landmarks. Where $f$ is level, $f'$ is zero. Where $f$
        climbs, $f'$ is above the axis. Where $f$ falls, $f'$ is below it.
        Only one graph gets all three right.
      `,
    },
    {
      id: 'teach-sign-change',
      type: 'info',
      title: 'Reading the gauge backwards',
      text: r`
        The gauge works in both directions: from $f'$ alone you can tell what
        $f$ is doing.

        | $f'$ is… | so $f$… |
        |:--|:--|
        | $+$, then zero, then $-$ | climbs to a **peak**, then falls |
        | $-$, then zero, then $+$ | falls into a **valley**, then climbs |
        | one positive number everywhere | is a straight line sloping up |
        | positive and growing | climbs, steeper and steeper |

        :::example
        Here $f'$ is the line in the lower panel. It is positive left of
        $x = 2$, zero at $x = 2$ and negative after it. So $f$ climbs, is
        level at $x = 2$, then falls: a hill with its top at $x = 2$.
        :::
      `,
      figure: {
        type: 'slope-tracer', fn: '3 - (x - 2)^2/2', x: [-1, 5], y: [-2, 4], yStep: 1, dy: [-3, 3], dyStep: 1, start: 2, reveal: true, static: true,
        labels: { f: 'f', d: 'its derivative f′' },
        alt: 'Top: the curve f, a hill with its top at x = 2. Bottom: its derivative, a straight line that falls from left to right and crosses zero at x = 2.',
      },
    },
    {
      id: 'reverse',
      type: 'interact',
      stretch: true,
      attempts: 2,
      title: 'Run it backwards',
      text: r`
        This time the orange graph on top is a **derivative**, $f'$: not $f$ itself.

        **Tap the blue graph that could be $f$.**
      `,
      widget: {
        type: 'graph-pick', x: [-3, 5], y: [-4, 4], xStep: 1, yStep: 2,
        given: { expr: 'x - 1', color: 'orange', label: 'f′' },
        optionColor: 'blue',
        options: [
          { expr: '2 - (x - 1)^2/2', alt: 'a hill with its highest point at x = 1' },
          { expr: '(x + 1)^2/2 - 2', alt: 'a valley with its lowest point at x = −1' },
          { expr: '(x - 1)^2/2 - 2', alt: 'a valley with its lowest point at x = 1' },
          { expr: 'x - 1', alt: 'a straight line rising through (1, 0)' },
        ],
        alt: 'The graph of a derivative: a straight line rising from left to right and crossing zero at x = 1. Below it, four candidate graphs labelled A to D.',
      },
      check: (s) => {
        if (s.picked === 2) return true;
        return [
          'A hill climbs first and falls afterwards. Its derivative would be positive on the left and negative on the right: the opposite of this one.',
          r`Right shape, wrong place. That valley is level at $x = -1$, but the derivative on top is zero at $x = 1$.`,
          null,
          'That is the same graph again. A straight line has one slope everywhere, so its derivative would be a level line.',
        ][s.picked] || 'Tap one of the four blue graphs.';
      },
      solution: { picked: 2 },
      hints: [
        r`Read the derivative from left to right. Left of $x = 1$ it is negative. What is $f$ doing there?`,
        r`$f$ falls until $x = 1$, is level at $x = 1$, then climbs. What shape is that?`,
      ],
      explain: r`
        Left of $x = 1$ the derivative is negative, so $f$ is falling. At
        $x = 1$ it is zero, so $f$ is level. After that it is positive, so $f$
        climbs.

        Falling, level, climbing: a **valley** with its floor at $x = 1$.
      `,
    },
    {
      id: 'features',
      type: 'match',
      review: true,
      text: r`Match each description of a function $f$ with what its derivative $f'$ must be doing.`,
      pairs: [
        [r`$f$ reaches a peak`, r`$f'$ switches from $+$ to $-$`],
        [r`$f$ reaches the bottom of a valley`, r`$f'$ switches from $-$ to $+$`],
        [r`$f$ is a straight line sloping upward`, r`$f'$ is a positive constant`],
        [r`$f$ climbs, getting steeper and steeper`, r`$f'$ is positive and growing`],
      ],
      explain: `
        The derivative reports the slope. At a peak, $f$ stops climbing and
        starts falling, so the slope switches from positive to negative; at
        the bottom of a valley it is the other way round. A straight line
        has one slope everywhere. And "steeper and steeper" means the slope
        itself is growing.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend objects:

        > "A curve can't have a slope at a single point. You need two points to measure a slope."

        What would you tell them?
      `,
      model: `
        Two points give the slope of a **secant**: an average over a stretch.
        Slide the second point toward the first and those slopes settle on
        one number. That number is the slope of the **tangent**, the straight
        line the curve turns into when you zoom in on the point. So a single
        point does have a slope: the one that all the nearby two-point
        slopes are closing in on.
      `,
    },
  ],
  recap: [
    'Zoom in on a smooth curve and it looks straight. That straight line is the **tangent**, and its slope is the slope of the curve at that point.',
    'Climbing: positive slope. Level, as at a peak or a valley: zero. Falling: negative.',
    'Record the slope at every $x$ and you get a new function, the **derivative** $f\'$.',
    '$f\'$ tells you how $f$ is changing, not how high it is.',
  ],
  next: 'Next: measuring slopes one at a time is slow. Is there a formula hiding in them?',
};
