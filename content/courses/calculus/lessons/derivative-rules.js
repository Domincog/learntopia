// Calculus in Pictures · Lesson 3 · Spotting the Pattern
import { r, num } from '../../../kit.js';
import { polyTex, polyExpr, derive, evalPoly, table } from '../helpers.js';

const XS = ['−2', '−1', '0', '1', '2', '3'];

/** "3(2)^{2} - 4(2) + 1": a polynomial with a number put in for x, as TeX. */
const plugIn = (terms, x) => terms.map(([c, p], i) => {
  const size = Math.abs(c);
  const body = p === 0 ? num(size) : `${size === 1 ? '' : num(size)}(${num(x)})${p === 1 ? '' : `^{${p}}`}`;
  if (i === 0) return c < 0 ? `-${body}` : body;
  return c < 0 ? ` - ${body}` : ` + ${body}`;
}).join('');

export default {
  id: 'derivative-rules',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A slope without a ruler',
      text: r`
        The curve $y = x^2$ gets steeper as $x$ grows. In the last lesson you
        would have dragged a tangent along it to find out how steep.

        This time, take a guess. **What is the slope of $y = x^2$ at $x = 3$?**
      `,
      figure: {
        type: 'plot', x: [-1, 4.5], y: [-1, 13], xStep: 1, yStep: 2,
        fns: [{ expr: 'x^2', color: 'blue' }],
        tangents: [{ fn: 0, at: 3, color: 'orange' }],
        alt: 'The parabola y equals x squared, with its tangent line drawn at the point (3, 9).',
      },
      min: 0,
      max: 12,
      step: 1,
      start: 0,
      answer: 6,
      prefix: 'slope',
      directional: false,
      explain: r`
        It is **6**. Not the height of the curve there (9), and not $x$
        itself (3), but *double* $x$.

        A coincidence? Measure a few more slopes and see.
      `,
    },
    {
      id: 'measure-square',
      type: 'interact',
      graded: false,
      title: 'Collect some slopes',
      text: r`
        Here is $y = x^2$ in the slope machine. The point snaps to whole
        numbers, and the slope at $x = 0$ is already in the table.

        **Measure the slope at every other $x$ in the table**, from $-2$ to $3$.
      `,
      widget: {
        type: 'slope-tracer', fn: 'x^2', x: [-3, 3], y: [-1, 9], yStep: 2, dy: [-6, 6], dyStep: 2,
        snap: 1, start: 0, targets: [-2, -1, 0, 1, 2, 3], table: true,
        labels: { f: 'y = x²', d: 'its slope at each x' },
        alt: 'Top: the parabola y equals x squared with a movable tangent. Bottom: a graph of the slopes measured so far.',
      },
      check: (s) => s.done || 'Some boxes in the table are still empty. Move the point to every whole number from −2 to 3.',
      solution: { x: 3, done: true },
      explain: r`
        $-4,\ -2,\ 0,\ 2,\ 4,\ 6$. In the lower panel the dots line up
        perfectly. There is a rule hiding in there.
      `,
    },
    {
      id: 'formula-square',
      type: 'expr',
      text: [
        r`Here are the slopes you measured on $y = x^2$.`,
        table(['$x$', ...XS], [['slope', '−4', '−2', '0', '2', '4', '6']]),
        r`**Write a formula for the slope at any $x$.**`,
      ].join('\n\n'),
      answer: '2x',
      vars: ['x'],
      prefix: 'slope $=$',
      wrong: [
        ['x^2', r`That is the *height* of the curve at $x$. Compare with the table: at $x = 3$ the height is 9 but the slope is 6.`],
        ['x', r`Compare with the table: at $x = 3$ the slope is 6, not 3.`],
        ['x + 1', r`That fits $x = 1$. But try $x = 3$: the slope there is 6, not 4.`],
        ['2', r`That is the slope at $x = 1$ only. The slope changes with $x$, so the formula needs an $x$ in it.`],
      ],
      hints: [r`Compare each slope with its $x$. What do you do to $x$ to get the slope?`],
      explain: r`
        Each slope is twice its $x$: the slope of $x^2$ is $2x$.

        That is no accident, and Lesson 1 shows why. The average slope of
        $x^2$ from $x$ to $x + h$ is

        $$ \frac{(x+h)^2 - x^2}{h} = \frac{2xh + h^2}{h} $$

        $$ = 2x + h $$

        Shrink the gap $h$ toward zero and what is left is $2x$.
      `,
    },
    {
      id: 'measure-cube',
      type: 'interact',
      graded: false,
      title: 'A steeper curve',
      text: r`Now try $y = x^3$. **Measure its slope at the same six places.**`,
      widget: {
        type: 'slope-tracer', fn: 'x^3', x: [-3, 3], y: [-30, 30], yStep: 10, dy: [-4, 30], dyStep: 10,
        snap: 1, start: 0, targets: [-2, -1, 0, 1, 2, 3], table: true,
        labels: { f: 'y = x³', d: 'its slope at each x' },
        alt: 'Top: the curve y equals x cubed with a movable tangent. Bottom: a graph of the slopes measured so far.',
      },
      check: (s) => s.done || 'Some boxes in the table are still empty. Move the point to every whole number from −2 to 3.',
      solution: { x: 3, done: true },
      explain: r`
        $12,\ 3,\ 0,\ 3,\ 12,\ 27$. This time the dots do not make a line:
        they make a U shape. And no slope is negative, because $x^3$ never
        runs downhill.
      `,
    },
    {
      id: 'formula-cube',
      type: 'choice',
      text: [
        r`Here are the slopes you measured on $y = x^3$.`,
        table(['$x$', ...XS], [['slope', '12', '3', '0', '3', '12', '27']]),
        'Which formula fits **all six** of them?',
      ].join('\n\n'),
      options: [
        { text: r`$3x^2$`, correct: true },
        { text: r`$x^3$`, why: r`That gives the *heights*: $-8, -1, 0, 1, 8, 27$. Only two of them agree with the slopes.` },
        { text: r`$9x - 6$`, why: r`It fits at $x = 1$ and $x = 2$. But at $x = 3$ it gives 21, and at $x = 0$ it gives $-6$.` },
        { text: r`$3x$`, why: r`It fits at $x = 0$ and $x = 1$. But at $x = 2$ it gives 6, where the slope is 12.` },
      ],
      hints: [
        r`The slopes at $x = 2$ and $x = -2$ are equal. Which of the formulas give the same value for $x$ and for $-x$?`,
        r`Divide every slope by 3: you get $4, 1, 0, 1, 4, 9$.`,
      ],
      explain: r`
        Divide every slope by 3 and you get $4, 1, 0, 1, 4, 9$: the squares
        of $x$. So the slope of $x^3$ is $3x^2$.
      `,
    },
    {
      id: 'pattern',
      type: 'fill',
      title: 'Spot the pattern',
      text: [
        'Put your two discoveries side by side.',
        table(['curve', 'slope at $x$'], [['$x^2$', '$2x$'], ['$x^3$', '$3x^2$']]),
        'Now follow the pattern one step further.',
      ].join('\n\n'),
      template: r`The slope of $x^4$ at $x$ is [[4]] $\times\ x$ to the power [[3]].`,
      hints: [
        r`In each row, compare the power in the curve with the number in front of its slope.`,
        r`$x^2$ gives $2x^1$ and $x^3$ gives $3x^2$: the power moves to the front, and a power one lower is left behind.`,
      ],
      explain: r`
        The old power comes down in front, and the power itself drops by
        one: $x^4$ gives $4x^3$.

        A measurement backs it up: at $x = 2$ the slope of $x^4$ is $32$,
        and $4 \times 2^3 = 32$.
      `,
    },
    {
      id: 'power-rule',
      type: 'info',
      title: 'The power rule',
      text: r`
        $$ f(x) = x^n \;\;\Rightarrow\;\; f'(x) = n\,x^{n-1} $$

        **Bring the power down in front, then lower the power by one.**

        - $x^5$ becomes $5x^4$
        - $x^2$ becomes $2x^1$, which is $2x$
        - $x$ is $x^1$, so it becomes $1x^0 = 1$: the line $y = x$ climbs 1 for every 1 across

        You found this rule by spotting a pattern, and a pattern is not a
        proof. But the shrinking-gap argument that explained $2x$ can be
        carried out for every whole-number power, and it always gives this rule.

        :::note Two ways to write a derivative
        $f'(x)$ is read "f prime of x". You will also meet $\dfrac{dy}{dx}$,
        read "dee y by dee x". It is a reminder of where a derivative comes
        from: a small change in $y$, divided by the small change in $x$ that
        caused it, as that change shrinks toward nothing. If $y = x^3$, then
        $\dfrac{dy}{dx} = 3x^2$.
        :::
      `,
    },
    {
      id: 'shift',
      type: 'choice',
      title: 'Sliding a curve up and down',
      text: r`
        The blue curve is $y = x^2 + c$. **Slide $c$** to move it up and
        down, and watch the tangent at $x = 1$.

        What happens to the slope there?
      `,
      figure: {
        type: 'plot', x: [-3, 3], y: [-2, 10], xStep: 1, yStep: 2,
        params: { c: { min: -1, max: 4, step: 0.5, value: 0, label: 'shift $c$', color: 'blue' } },
        fns: [{ expr: 'x^2 + c', color: 'blue' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        readouts: [{ label: 'height of the point', expr: 'f0(1)', color: 'blue' }, { label: 'slope at the point', expr: 'd0(1)', color: 'orange' }],
        alt: 'The parabola y equals x squared plus c, with its tangent at x = 1. A slider moves the whole curve up and down.',
      },
      columns: 1,
      options: [
        { text: 'It stays exactly the same', correct: true },
        { text: 'It grows as the curve moves up', why: 'Watch the slope readout while you slide. The tangent rides up and down with the curve, but it never tilts.' },
        { text: r`It changes by $c$`, why: r`The *height* changes by $c$. The slope readout does not move at all.` },
      ],
      explain: r`
        Moving a curve up or down changes its height everywhere and its
        steepness nowhere. The tangent rides along with the curve and never
        tilts: the slope readout stays at 2.
      `,
    },
    {
      id: 'scale',
      type: 'choice',
      title: 'Stretching a curve',
      text: r`
        Now the curve is $y = k\,x^2$: the same parabola, stretched to $k$
        times its height. **Slide $k$** and watch the slope at $x = 1$.

        What does the stretch do to the slope?
      `,
      figure: {
        type: 'plot', x: [-3, 3], y: [-1, 11], xStep: 1, yStep: 2,
        params: { k: { min: 0.5, max: 3, step: 0.5, value: 1, label: 'stretch $k$', color: 'blue' } },
        fns: [{ expr: 'k*x^2', color: 'blue' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        readouts: [{ label: 'slope at the point', expr: 'd0(1)', color: 'orange' }],
        alt: 'The parabola y equals k times x squared, with its tangent at x = 1. A slider stretches the curve vertically.',
      },
      columns: 1,
      options: [
        { text: r`It multiplies the slope by $k$ as well`, correct: true },
        { text: 'Nothing: the slope stays at 2', why: 'Watch the readout while you slide: the tangent tilts as the curve stretches.' },
        { text: r`It adds $k$ to the slope`, why: r`Try $k = 3$: the slope is 6, not $2 + 3 = 5$. The stretch multiplies.` },
      ],
      explain: r`
        Stretch a curve to $k$ times its height and every rise becomes $k$
        times bigger over the same run. So the slope is multiplied by $k$
        as well: with $k = 3$ the readout shows $3 \times 2 = 6$.
      `,
    },
    {
      id: 'teach-term-by-term',
      type: 'info',
      title: 'Three small rules',
      text: r`
        Finding a derivative is called **differentiating**. Your two
        experiments, and one more fact, let you differentiate whole expressions.

        | Rule | Example |
        |:--|:--|
        | A constant added on **disappears** | $x^2 + 5 \;\to\; 2x$ |
        | A number in front **stays in front** | $5x^3 \;\to\; 15x^2$ |
        | **Slopes add**: take one term at a time | $x^3 + x \;\to\; 3x^2 + 1$ |

        :::example
        Differentiate $f(x) = 2x^5 - 3x^2 + 9x - 4$.

        - $2x^5$ gives $2 \times 5x^4 = 10x^4$
        - $-3x^2$ gives $-3 \times 2x = -6x$
        - $9x$ gives $9$, because $x$ gives $1$
        - $-4$ is a constant: it gives nothing

        So $f'(x) = 10x^4 - 6x + 9$.
        :::
      `,
    },
    {
      id: 'sum',
      type: 'fill',
      title: 'One term at a time',
      text: r`
        Your turn. Differentiate this one term at a time, and fill in the
        numbers.

        $$ f(x) = 4x^3 + 5x^2 - 7x + 2 $$
      `,
      template: r`$f'(x) =$ [[12]] $x^2\ +$ [[10]] $x\ -$ [[7]]`,
      hints: [r`Start with $4x^3$: bring the 3 down to multiply the 4, then lower the power to 2.`],
      explain: r`
        $4x^3$ gives $12x^2$. $\;5x^2$ gives $10x$. $\;-7x$ gives $-7$. The
        constant $2$ contributes nothing.

        So $f'(x) = 12x^2 + 10x - 7$.
      `,
    },
    {
      id: 'differentiate',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['quadratic', 'cubic', 'power', 'mixed']);
        let terms;
        if (kind === 'quadratic') terms = [[rng.int(2, 6), 2], [rng.nonzero(-9, 9), 1], [rng.nonzero(-9, 9), 0]];
        else if (kind === 'cubic') terms = [[rng.int(1, 4), 3], [rng.nonzero(-6, 6), 2], [rng.nonzero(-9, 9), 0]];
        else if (kind === 'power') terms = [[1, rng.int(4, 6)], [rng.nonzero(-8, 8), 1]];
        else terms = [[rng.int(2, 5), 3], [rng.nonzero(-9, 9), 1], [rng.nonzero(-9, 9), 0]];
        const d = derive(terms);
        const constant = terms.find(([, p]) => p === 0);
        const powers = terms.filter(([, p]) => p > 0);
        const wrong = [
          [polyExpr(powers.map(([c, p]) => [c * p, p])), 'You brought each power down in front. Now also lower each power by one.'],
          [polyExpr(powers.map(([c, p]) => [c, p - 1])), 'You lowered each power by one. The old power must also come down in front and multiply.'],
        ];
        if (constant) wrong.unshift([`${polyExpr(d)} + (${constant[0]})`, 'A constant term only slides the graph up or down. It adds nothing to the slope, so it disappears.']);
        const [c0, p0] = terms[0];
        return {
          text: r`Differentiate: $$ f(x) = ${polyTex(terms)} $$`,
          prefix: r`$f'(x) =$`,
          answer: polyExpr(d),
          vars: ['x'],
          wrong,
          hints: [
            'Take one term at a time: bring its power down in front, then lower the power by one.',
            r`The first term, $${polyTex([[c0, p0]])}$, becomes $${polyTex([[c0 * p0, p0 - 1]])}$.`,
          ],
          explain: r`
            Term by term: ${terms.map(([c, p]) => r`$${polyTex([[c, p]])}$ gives $${p === 0 ? '0' : polyTex([[c * p, p - 1]])}$`).join(', ')}.

            So $f'(x) = ${polyTex(d)}$.
          `,
        };
      },
    },
    {
      id: 'example-slope-at',
      type: 'info',
      title: 'From a formula to a slope',
      text: r`
        A derivative is a formula for the slope at *every* $x$. To get the
        slope at one point, differentiate first, then put that $x$ in.

        :::example
        How steep is $y = 8x - 2x^2$ at $x = 1$?

        1. Differentiate: $\;\dfrac{dy}{dx} = 8 - 4x$
        2. Put in $x = 1$: $\;8 - 4(1) = 4$

        The slope there is 4: the slope of the orange tangent.
        :::

        Putting $x = 1$ into $y$ itself gives 6. That is the *height* of
        the curve there, not its slope.
      `,
      figure: {
        type: 'plot', x: [-1, 5], y: [-2, 10], xStep: 1, yStep: 2,
        fns: [{ expr: '8x - 2x^2', color: 'blue' }],
        tangents: [{ fn: 0, at: 1, color: 'orange' }],
        points: [{ x: 1, on: 0, color: 'orange' }],
        labels: [{ x: 1, y: 6, text: 'height 6, slope 4', color: 'orange', dx: 14, dy: 22, anchor: 'start' }],
        alt: 'The hill-shaped curve y equals 8x minus 2x squared, with its tangent line drawn at the point (1, 6). The tangent climbs 4 for every 1 across.',
      },
    },
    {
      id: 'slope-at',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const cubic = rng.bool(0.4);
        const terms = cubic
          ? [[1, 3], [rng.nonzero(-9, 9), 1]]
          : [[rng.int(1, 4), 2], [rng.nonzero(-8, 8), 1], [rng.nonzero(-5, 5), 0]];
        const x = cubic ? rng.pick([-2, -1, 1, 2, 3]) : rng.nonzero(-3, 4);
        const d = derive(terms);
        const answer = evalPoly(d, x);
        return {
          text: r`
            What is the slope of the curve

            $$ y = ${polyTex(terms)} $$

            at the point where $x = ${x}$?
          `,
          answer,
          wrong: [
            [evalPoly(terms, x), r`That is the *height* of the curve at $x = ${x}$. For the slope, differentiate first, then put in $x = ${x}$.`],
            [evalPoly(d, -x), r`Check the sign of $x$: the point is at $x = ${x}$.`],
          ],
          hints: [
            'The slope at a point is the value of the derivative there. So differentiate first.',
            r`$\dfrac{dy}{dx} = ${polyTex(d)}$. Now put in $x = ${x}$.`,
          ],
          explain: r`
            Differentiate: $\dfrac{dy}{dx} = ${polyTex(d)}$.

            At $x = ${x}$ that is $${plugIn(d, x)} = ${num(answer)}$.
          `,
        };
      },
    },
    {
      id: 'example-level-point',
      type: 'info',
      title: 'Where is the top?',
      text: r`
        Now run the same idea the other way. At the top of a hill or the
        bottom of a valley the tangent is level, so the derivative is
        **zero** there. Set the derivative equal to zero and solve.

        :::example
        Where is the top of the hill $y = 8x - 2x^2$?

        1. Differentiate: $\;\dfrac{dy}{dx} = 8 - 4x$
        2. Set it to zero: $\;8 - 4x = 0$, so $4x = 8$ and $x = 2$

        The top is at $x = 2$, where the height is $8(2) - 2(2)^2 = 8$.
        :::
      `,
      figure: {
        type: 'plot', x: [-1, 5], y: [-2, 10], xStep: 1, yStep: 2,
        fns: [{ expr: '8x - 2x^2', color: 'blue' }],
        tangents: [{ fn: 0, at: 2, color: 'orange' }],
        points: [{ x: 2, on: 0, color: 'orange' }],
        vlines: [{ x: 2, dashed: true }],
        labels: [{ x: 2, y: 8, text: 'level: slope 0', color: 'orange', dx: 12, dy: -9, anchor: 'start' }],
        alt: 'The same hill-shaped curve with a level tangent line touching its highest point, (2, 8).',
      },
    },
    {
      id: 'zero-slope',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        const kind = rng.pick(['valley', 'hill', 'ball']);
        if (kind === 'ball') {
          const v = rng.pick([10, 20, 30]);
          return {
            text: r`
              A ball is launched straight up. After $t$ seconds its height is
              $h = ${v}t - 5t^2$ metres.

              **After how many seconds is it at its highest?** (At the very
              top, the slope of the height graph is zero.)
            `,
            answer: v / 10,
            prefix: '$t =$',
            unit: 's',
            wrong: [
              [v / 5, r`That is when the ball lands again: $h = 0$. The top comes when the *slope* of $h$ is zero.`],
              [v, r`${v} is the slope at $t = 0$. You need the time at which the slope has dropped to zero.`],
            ],
            hints: [
              'Differentiate the height. Then ask: at what time is that derivative zero?',
              r`The slope of the height graph is $${v} - 10t$. Solve $${v} - 10t = 0$.`,
            ],
            explain: r`
              The slope of the height graph is $${v} - 10t$. It is zero when
              $10t = ${v}$, so $t = ${v / 10}$ s.

              Before that the slope is positive (still rising); after it,
              negative (falling).
            `,
          };
        }
        const p = rng.nonzero(-5, 6);
        const c = rng.int(-6, 9);
        const valley = kind === 'valley';
        const terms = valley ? [[1, 2], [-2 * p, 1], [c, 0]] : [[-1, 2], [2 * p, 1], [c, 0]];
        const d = derive(terms);
        return {
          text: r`
            The curve $y = ${polyTex(terms)}$ is ${valley ? 'a valley' : 'a hill'}.

            **At what $x$ is its ${valley ? 'lowest' : 'highest'} point?** (At the
            ${valley ? 'bottom of a valley' : 'top of a hill'}, the slope is zero.)
          `,
          answer: p,
          prefix: '$x =$',
          wrong: [
            [-p, r`Check the sign when you solve $${polyTex(d)} = 0$.`],
            [2 * p, r`Almost: you still need to divide by 2 when solving $${polyTex(d)} = 0$.`],
            [evalPoly(terms, p), r`That is the *height* of the ${valley ? 'lowest' : 'highest'} point. The question asks for its $x$.`],
          ],
          hints: [
            r`Differentiate first. Then ask: for which $x$ is the derivative zero?`,
            r`$\dfrac{dy}{dx} = ${polyTex(d)}$. Solve $${polyTex(d)} = 0$.`,
          ],
          explain: r`
            $\dfrac{dy}{dx} = ${polyTex(d)}$, which is zero when $x = ${p}$.

            That is where the tangent is level: the ${valley ? 'bottom of the valley' : 'top of the hill'}.
            No graph needed.
          `,
        };
      },
    },
  ],
  recap: [
    '**Power rule:** the derivative of $x^n$ is $n\\,x^{n-1}$. Bring the power down, then lower it by one.',
    'A constant added on disappears. A number multiplying a term stays in front.',
    'Differentiate a sum one term at a time: $4x^3 - 7x + 2$ gives $12x^2 - 7$.',
    'The derivative is written $f\'(x)$ or $\\dfrac{dy}{dx}$. Put in an $x$ to get the slope at that point.',
  ],
  next: 'Next: the opposite question. Not "how fast is it changing?" but "how much has piled up?"',
};
