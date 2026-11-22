// Calculus II: The Toolkit · Lesson 3 · The Slope of a Wave
import { r, num } from '../../../kit.js';
import { code, piFrac, piAxis, bottomAxis } from '../helpers.js';

const PI = Math.PI;

/** x as a multiple of π/2, for a readout: 1.5708 -> "π/2". */
const quarterTurns = (x) => ['0', 'π/2', 'π', '3π/2', '2π'][Math.round(x / (PI / 2))] || num(x, 2);

/** Angles (as [n, d] for nπ/d) where the slope of sine, cos x, is 0, ±0.5 or ±1; and the same for the slope of cosine, −sin x. */
const SINE_AT = [[0, 1], [1, 3], [1, 2], [2, 3], [1, 1], [4, 3], [3, 2], [5, 3], [2, 1]];
const COSINE_AT = [[0, 1], [1, 6], [1, 2], [5, 6], [1, 1], [7, 6], [3, 2], [11, 6]];
/** Round to the nearest half, which removes the float fuzz from values such as cos(π/3). */
const half = (v) => { const out = Math.round(v * 2) / 2; return Object.is(out, -0) ? 0 : out; };

/** One cycle of a wave, with the x-axis marked in quarter turns along the bottom edge. */
const WAVE_AXES = { x: [-0.5, 6.8], y: [-1.5, 1.5], xStep: PI / 2, yStep: 0.5, ...piAxis([[0], [1, 2], [1], [3, 2], [2]], -1.5) };

export default {
  id: 'trig-derivatives',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How steep is a wave?',
      text: r`
        This is $y = \sin x$, with $x$ in radians. It is at its steepest where it climbs
        through the axis.

        **Guess its slope at $x = 0$.**
      `,
      figure: {
        type: 'plot', ...WAVE_AXES, x: [-3.4, 6.8], ...piAxis([[-1], [-1, 2], [0], [1, 2], [1], [3, 2], [2]], -1.5),
        fns: [{ expr: 'sin(x)', color: 'blue' }],
        points: [{ x: 0, y: 0, color: 'orange' }],
        alt: 'The sine wave, crossing the origin on its way up. The horizontal axis is marked in multiples of pi.',
      },
      min: 0, max: 3, step: 0.25, start: 0, answer: 1,
      prefix: 'slope',
      directional: false,
      explain: r`
        Exactly **1**.

        You have met the reason. In *Trigonometry* you saw that for small angles in radians
        $\sin x \approx x$: near 0 the wave hugs the line $y = x$, and that line has slope 1.

        That settles one point of the wave. What about all the others?
      `,
    },
    {
      id: 'trace',
      type: 'interact',
      graded: false,
      title: 'Record every slope',
      text: r`
        Here is the slope machine from *Calculus in Pictures*, loaded with $y = \sin x$.
        The lower panel records the slope at every $x$ you visit.

        **Sweep the point along the whole wave.** Does the curve it draws look familiar?
      `,
      widget: {
        type: 'slope-tracer', fn: 'sin(x)', x: [0, 6.4], y: [-1.5, 1.5], dy: [-1.5, 1.5], xStep: 1, yStep: 0.5, dyStep: 0.5, start: 0.1,
        labels: { f: 'y = sin x', d: 'its slope at each x' },
        alt: 'Top: one cycle of the sine wave with a movable tangent. Bottom: a record of the slopes measured so far.',
      },
      check: (s) => s.done || 'Keep going: sweep the point all the way from the left-hand end of the wave to the right-hand end.',
      solution: { x: 6.2, traced: true },
      explain: r`
        The slope starts at 1, drops to 0 at the crest, reaches $-1$ where the wave dives
        through the axis, and comes back up through 0 in the trough.

        The record is a wave as well: the same height and the same period as the sine wave,
        but starting from its peak.
      `,
    },
    {
      id: 'recognise',
      type: 'fill',
      title: 'Name that curve',
      text: r`
        Take four careful readings. The point snaps to quarter turns.

        Then compare them with what you know from the unit circle in *Trigonometry*: at
        $0, \frac{\pi}{2}, \pi, \frac{3\pi}{2}$ the values of $\sin x$ are $0, 1, 0, -1$, and those of $\cos x$ are $1, 0, -1, 0$.
      `,
      figure: {
        type: 'plot', ...WAVE_AXES,
        fns: [{ expr: 'sin(x)', color: 'blue' }],
        points: [{ id: 'P', x: 0, on: 0, drag: 'x', snap: PI / 2, xMin: 0, xMax: 2 * PI, color: 'orange' }],
        tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
        readouts: [{ label: '$x$', value: (s) => quarterTurns(s.P.x) }, { label: 'slope of $\\sin x$', expr: 'd0(Px)', digits: 2, color: 'orange' }],
        alt: 'One cycle of the sine wave, with the horizontal axis marked in multiples of pi. A point with its tangent line can be moved to each quarter turn, and a readout gives the slope.',
      },
      template: r`
        The slope of $\sin x$ is [[1]] at $x = 0$, then [[0]] at $x = \frac{\pi}{2}$, then [[-1]] at $x = \pi$, then [[0]] at $x = \frac{3\pi}{2}$.

        Those are the values of [[sin x|*cos x|−sin x|−cos x]] at the same four places.
      `,
      hints: [r`Which of the four starts at 1 when $x = 0$? Think of the unit circle: the point starts at $(1, 0)$.`],
      explain: r`
        $\cos 0 = 1$, $\;\cos\frac{\pi}{2} = 0$, $\;\cos\pi = -1$, $\;\cos\frac{3\pi}{2} = 0$.
        The curve you traced is the cosine wave:

        $$ \text{the slope of } \sin x \text{ is } \cos x $$

        Four readings do not prove that, of course. The circle that sine came from shows *why* it is true.
      `,
    },
    {
      id: 'circle',
      type: 'interact',
      title: 'Back to the circle',
      text: r`
        In *Trigonometry*, $\sin\theta$ was the **height** of a point walking round the unit circle. So its slope
        asks: how fast is that height changing as the point walks?

        With $\theta$ in radians the point covers 1 unit of arc per unit of angle, so its
        [velocity arrow]{.green} has length 1. The arrow's dashed [upward part]{.blue} is the rate at which the height changes.

        **Move the point to a place where its height is rising at exactly 0.5.**
      `,
      widget: {
        type: 'circle-velocity', deg: 0, step: 15,
        alt: 'A point on the unit circle with its radius and, at right angles to the radius, a velocity arrow of length 1. Dashed lines split the arrow into a sideways part and an upward part.',
      },
      check: (s) => {
        if (s.vy === 0.5) return true;
        if (s.vy < 0) return `Here the arrow points downwards: the height is falling, at ${num(-s.vy, 2)}. Try the right-hand half of the circle, where the point is on its way up.`;
        if (s.vy === 0) return 'Here the arrow points straight sideways: for an instant the height is not changing at all.';
        return s.vy > 0.5
          ? `Here the height is rising at ${num(s.vy, 2)}, which is more than 0.5. Find a place where the arrow points less steeply upwards.`
          : `Here the height is rising at only ${num(s.vy, 2)}. Find a place where the arrow points more steeply upwards.`;
      },
      solution: { deg: 60 },
      hints: ['Watch the blue readout, "height is changing at", while you move the point.'],
      explain: r`
        At $\theta = \frac{\pi}{3}$ the height is rising at 0.5, and the point's $x$-coordinate,
        $\cos\theta$, is 0.5 as well. (The same happens at $\frac{5\pi}{3}$.)

        That is no accident. The [dashed blue]{.blue} line is always exactly as long as the
        [solid blue]{.blue} one.
      `,
    },
    {
      id: 'why',
      type: 'info',
      title: 'A triangle turned on its side',
      text: r`
        The velocity arrow is the radius turned through a right angle. So the dashed triangle
        on the arrow is the triangle under the radius, turned through a right angle as well.

        - Its upward side is the old horizontal side: [$\cos\theta$]{.blue}.
        - Its sideways side is the old vertical side, now pointing backwards: [$-\sin\theta$]{.orange}.

        :::key
        $$ \begin{aligned} \frac{d}{d\theta}\sin\theta &= \cos\theta \\[4pt] \frac{d}{d\theta}\cos\theta &= -\sin\theta \end{aligned} $$
        :::

        The height changes at $\cos\theta$. The $x$-coordinate changes at $-\sin\theta$.
      `,
      figure: {
        type: 'circle-velocity', deg: 30, static: true, readouts: [],
        alt: 'The unit circle with a point at 30 degrees. Under the radius is a triangle with a horizontal side of 0.87 and a vertical side of 0.5. On the velocity arrow is the same triangle turned through a right angle: 0.5 sideways, pointing backwards, and 0.87 upwards.',
      },
    },
    {
      id: 'cos-sign',
      type: 'choice',
      title: 'Where the minus sign comes from',
      text: r`
        The $x$-coordinate of the point is $\cos\theta$, and it changes at the rate $-\sin\theta$.

        **Where on the circle is the $x$-coordinate getting smaller?** Walk the point round and watch the orange readout.
      `,
      figure: {
        type: 'circle-velocity', deg: 45, step: 15, readouts: ['angle', 'across', 'sideways'],
        alt: 'A point on the unit circle with its velocity arrow. Readouts give the angle, the x-coordinate of the point and the rate at which the x-coordinate is changing.',
      },
      columns: 1,
      options: [
        { text: r`All along the upper half, from $\theta = 0$ to $\theta = \pi$`, correct: true },
        { text: 'All along the right-hand half', why: r`On the lower right the point is heading right again: its $x$-coordinate is growing there.` },
        { text: r`Only in the first quarter, from $0$ to $\frac{\pi}{2}$`, why: r`It keeps moving left in the second quarter too, all the way to $\theta = \pi$.` },
        { text: 'Everywhere on the circle', why: r`On the lower half the point travels from left to right, so its $x$-coordinate grows.` },
      ],
      explain: r`
        A point walking counter-clockwise travels **right to left** across the top of the circle,
        so its $x$-coordinate falls there. That is where $\sin\theta$ is positive, which makes
        $-\sin\theta$ negative. Along the bottom it travels back to the right.
      `,
    },
    {
      id: 'example-slope-at-angle',
      type: 'info',
      title: 'A slope at one point of the wave',
      text: r`
        For the slope at one point of a wave, put that $x$ into the derivative.

        :::example
        How steep is $y = \sin x$ at $x = \frac{\pi}{6}$? The derivative is $\cos x$, and
        $\cos\frac{\pi}{6} \approx 0.87$: the slope of the orange tangent.

        And $y = \cos x$ at $x = \frac{\pi}{4}$? The derivative is $-\sin x$, so the slope is
        $-\sin\frac{\pi}{4} \approx -0.71$: downhill.
        :::

        The values are the ones from *Trigonometry*. Past a quarter turn the same sizes come
        back, with the sign of the quarter you are in.

        | $x$ | $0$ | $\pi/6$ | $\pi/3$ | $\pi/2$ |
        |:---:|:---:|:---:|:---:|:---:|
        | $\sin x$ | 0 | 0.5 | 0.87 | 1 |
        | $\cos x$ | 1 | 0.87 | 0.5 | 0 |
      `,
      figure: {
        type: 'plot', ...WAVE_AXES,
        fns: [{ expr: 'sin(x)', color: 'blue' }],
        points: [{ x: PI / 6, on: 0, color: 'orange' }],
        tangents: [{ fn: 0, at: PI / 6, color: 'orange' }],
        alt: 'One cycle of the sine wave, with the horizontal axis marked in multiples of pi. The tangent at x = pi over 6, a third of the way up to the first crest, climbs a little less steeply than the wave does at 0.',
      },
    },
    {
      id: 'values',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const sine = rng.bool();
        const [n, d] = rng.pick(sine ? SINE_AT : COSINE_AT);
        const x = (n * PI) / d;
        const at = piFrac(n, d);
        const fn = sine ? 'sin' : 'cos';
        const answer = half(sine ? Math.cos(x) : -Math.sin(x));
        const fnTex = sine ? r`\sin` : r`\cos`;
        const height = half(sine ? Math.sin(x) : Math.cos(x));
        const heightIsTidy = Math.abs(height - (sine ? Math.sin(x) : Math.cos(x))) < 1e-9;
        const wrong = [];
        if (sine) {
          wrong.push([-answer, r`Check the sign: the derivative of $\sin x$ is $+\cos x$. The minus sign belongs to the derivative of cosine.`]);
          if (heightIsTidy) wrong.push([height, r`That is $\sin ${at}$, the height of the curve there. Its slope is given by the derivative, $\cos x$.`]);
        } else {
          wrong.push([-answer, r`Check the sign: the derivative of $\cos x$ is **minus** $\sin x$.`]);
          if (heightIsTidy) wrong.push([height, r`That is $\cos ${at}$, the height of the curve there. Its slope is given by the derivative, $-\sin x$.`]);
        }
        return {
          text: r`**What is the slope of $\;y = ${fnTex} x\;$ at $\;x = ${at}$?** ($x$ is in radians.)`,
          figure: {
            type: 'plot', ...WAVE_AXES,
            fns: [{ expr: `${fn}(x)`, color: 'blue' }],
            points: [{ x, on: 0, color: 'orange' }],
            alt: `The graph of ${sine ? 'sine' : 'cosine'} x over one cycle, with the point at x = ${n === 0 ? '0' : `${n === 1 ? '' : `${n} `}pi${d === 1 ? '' : ` over ${d}`}`} marked.`,
          },
          answer,
          wrong,
          hints: [
            sine ? r`The slope of $\sin x$ at any $x$ is $\cos x$.` : r`The slope of $\cos x$ at any $x$ is $-\sin x$.`,
            sine ? r`$\cos ${at} = ${num(half(Math.cos(x)))}$.` : r`$\sin ${at} = ${num(half(Math.sin(x)))}$. Do not forget the minus sign.`,
          ],
          explain: sine
            ? r`The derivative of $\sin x$ is $\cos x$, and $\cos ${at} = ${num(answer)}$.`
            : r`The derivative of $\cos x$ is $-\sin x$, and $\sin ${at} = ${num(half(Math.sin(x)))}$, so the slope is $${num(answer)}$.`,
        };
      },
    },
    {
      id: 'example-chain-wave',
      type: 'info',
      title: 'A wave with something inside',
      text: r`
        Sine and cosine can be the outside of a chain. The recipe from Lesson 1 does not change:
        differentiate the outside with the inside left alone, then multiply by the derivative of the inside.

        :::example
        Differentiate $y = \sin(7x)$.

        1. Inside: $u = 7x$, which has derivative 7.
        2. Outside: $\sin u$ gives $\cos u$, so $\cos(7x)$.
        3. Multiply: $\dfrac{dy}{dx} = 7\cos(7x)$.
        :::

        :::example
        Differentiate $y = \cos(x^3)$.

        1. Inside: $u = x^3$, which has derivative $3x^2$.
        2. Outside: $\cos u$ gives $-\sin u$, so $-\sin(x^3)$.
        3. Multiply: $\dfrac{dy}{dx} = -3x^2\sin(x^3)$.
        :::
      `,
    },
    {
      id: 'degrees',
      type: 'choice',
      title: 'Why calculus insists on radians',
      text: r`
        Suppose the angle were measured in **degrees**. One cycle now takes 360 units instead
        of 6.28, and the tangent at 0 needs a run of about 57 to climb by 1: its slope is not 1 but about 0.0175.

        In *Trigonometry*, 180° was $\pi$ radians. So $x$ degrees is $x$ times a fixed number
        of radians, and this curve is a sine wave with something inside.

        **Where does the number 0.0175 come from?**
      `,
      figure: {
        type: 'plot', x: [-90, 450], y: [-1.5, 1.5], xStep: 90, yStep: 0.5, ...bottomAxis([0, 90, 180, 270, 360].map((d) => [d, `${d}°`]), -1.5),
        fns: [{ expr: 'sind(x)', color: 'blue' }],
        tangents: [{ fn: 0, at: 0, color: 'orange' }],
        readouts: [{ label: 'slope at 0', expr: 'd0(0)', digits: 4, color: 'orange' }],
        alt: 'The sine wave drawn against an angle in degrees, from minus 90 to 450. Its tangent at 0 is very shallow: the slope there is 0.0175.',
      },
      columns: 1,
      options: [
        { text: r`It is $\frac{\pi}{180}$: the size of one degree, in radians`, correct: true },
        { text: r`It is $\frac{1}{360}$: one over a full turn`, why: r`$\frac{1}{360} \approx 0.0028$, which is much smaller than the readout.` },
        { text: r`It is $\frac{1}{90}$: one over a quarter turn`, why: r`$\frac{1}{90} \approx 0.0111$. Close, but the readout says 0.0175.` },
      ],
      hints: [r`$x$ degrees is $\frac{\pi}{180}x$ radians, so this curve is $\sin\!\left(\frac{\pi}{180}x\right)$. The chain rule multiplies the slope by the rate of the inside.`],
      explain: r`
        In degrees the curve is $\sin\!\left(\frac{\pi}{180}x\right)$, a chain with inside
        $\frac{\pi}{180}x$. The chain rule gives its derivative: $\frac{\pi}{180}\cos\!\left(\frac{\pi}{180}x\right)$,
        which at 0 is $\frac{\pi}{180} \approx 0.01745$.

        In degrees, every derivative of a sine or cosine would drag that awkward factor along.
        In radians the factor is exactly 1. That is the promise *Trigonometry* made: calculus
        measures angles in radians, and from here on so do we.
      `,
    },
    {
      id: 'chain',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const sine = rng.bool();
        const typing = `Type the functions with brackets, like ${code(sine ? 'cos(2x)' : 'sin(2x)')}.`;
        const outer = sine ? r`\sin` : r`\cos`;
        const dOuter = sine ? r`\cos` : r`-\sin`;
        const d = sine ? 'cos' : 'sin';
        const sign = sine ? 1 : -1;
        if (rng.bool(0.35)) {
          return {
            text: r`Differentiate: $$ y = ${outer}(x^2) $$` + `\n\n${typing}`,
            prefix: r`$\dfrac{dy}{dx} =$`,
            answer: `${2 * sign}*x*${d}(x^2)`,
            display: `${sine ? '' : '-'}2x*${d}(x^2)`,
            vars: ['x'],
            wrong: [
              [`${sign}*${d}(x^2)`, r`That is the derivative of the outside alone. The inside, $x^2$, is changing too: multiply by its derivative, $2x$.`],
              [`${sign}*${d}(2*x)`, r`You differentiated the inside in place. Leave the inside as $x^2$, and multiply the whole thing by its derivative, $2x$.`],
              [`${-2 * sign}*x*${d}(x^2)`, sine ? r`Check the sign: the derivative of sine is $+\cos$.` : r`Check the sign: the derivative of cosine is **minus** sine.`],
            ],
            hints: [
              r`The inside is $u = x^2$. The outside is $${outer} u$, with derivative $${dOuter} u$.`,
              r`Outside: $${dOuter}(x^2)$. Inside: $2x$. Multiply them.`,
            ],
            explain: r`
              Outside: $${outer} u$ gives $${dOuter} u$. Inside: $u = x^2$ gives $2x$.

              $$ \begin{aligned} \frac{dy}{dx} &= ${dOuter}(x^2) \times 2x \\[4pt] &= ${sine ? '' : '-'}2x${sine ? r`\cos` : r`\sin`}(x^2) \end{aligned} $$
            `,
          };
        }
        const k = rng.pick([2, 3, 4, 5, 10]);
        return {
          text: r`Differentiate: $$ y = ${outer}(${k}x) $$` + `\n\n${typing}`,
          prefix: r`$\dfrac{dy}{dx} =$`,
          answer: `${sign * k}*${d}(${k}*x)`,
          display: `${sign * k}${d}(${k}x)`,
          vars: ['x'],
          wrong: [
            [`${sign}*${d}(${k}*x)`, r`That is the derivative of the outside alone. The inside, $${k}x$, is changing too: multiply by its derivative, ${k}.`],
            [`${-sign * k}*${d}(${k}*x)`, sine ? r`Check the sign: the derivative of sine is $+\cos$.` : r`Check the sign: the derivative of cosine is **minus** sine.`],
            [`${sign * k}*${d}(x)`, r`Leave the inside as it is: the answer still has $${k}x$ inside the function.`],
          ],
          hints: [
            r`The inside is $u = ${k}x$. The outside is $${outer} u$, with derivative $${dOuter} u$.`,
            r`Outside: $${dOuter}(${k}x)$. Inside: ${k}. Multiply them.`,
          ],
          explain: r`
            Outside: $${outer} u$ gives $${dOuter} u$. Inside: $u = ${k}x$ gives ${k}.

            $$ \begin{aligned} \frac{dy}{dx} &= ${dOuter}(${k}x) \times ${k} \\[4pt] &= ${sign * k}${sine ? r`\cos` : r`\sin`}(${k}x) \end{aligned} $$

            A wave squeezed to ${k} times the frequency is ${k} times as steep.
          `,
        };
      },
    },
    {
      id: 'cycle',
      type: 'fill',
      title: 'Keep going',
      text: r`
        Differentiate $\sin x$, then differentiate the result, and again, and again.
        A minus sign in front simply stays in front, like any number in front in *Calculus in Pictures*.
      `,
      template: r`
        $\sin x \;\to\; \cos x \;\to\;$ [[sin x|cos x|*−sin x|−cos x]] $\;\to\;$ [[sin x|cos x|−sin x|*−cos x]] $\;\to\;$ [[*sin x|cos x|−sin x|−cos x]]

        After [[4]] derivatives sine is back where it started. And after two it has become [[*minus|plus]] itself.
      `,
      hints: [r`The derivative of $\cos x$ is $-\sin x$. A minus sign in front simply stays in front.`],
      explain: r`
        $\sin x \to \cos x \to -\sin x \to -\cos x \to \sin x$: a cycle of four.
        Two steps along it, every one of the four has turned into minus itself.
      `,
    },
    {
      id: 'teach-second-derivative',
      type: 'info',
      title: 'The second derivative',
      text: r`
        The derivative of a derivative is called the **second derivative**, written $y''$.
        It measures how fast the *slope* is changing.

        For $y = \sin x$ you have just found it: $y' = \cos x$, then $y'' = -\sin x$. In short, $y'' = -y$.

        For something that moves, both derivatives have names:

        | | what it measures |
        |:--|:--|
        | **position** $y$ | where it is |
        | **velocity** $y'$ | how fast the position changes |
        | **acceleration** $y''$ | how fast the velocity changes |

        :::example
        A position of $t^3$ gives a velocity of $3t^2$ and an acceleration of $6t$.
        :::

        The harder something is pushed or pulled, the larger its acceleration.
      `,
    },
    {
      id: 'spring',
      type: 'choice',
      title: 'The signature of a swing',
      text: r`
        A weight bobs up and down on a spring. In suitable units its position is $\sin t$, so
        its acceleration, the second derivative, is $-\sin t$: always *minus the position*.

        That is how a spring behaves: the further the weight is from the middle, the harder
        it is pulled back. The graph shows its [position]{.blue} and its [acceleration]{.red}.

        **When is the weight being pulled back hardest?**
      `,
      figure: {
        type: 'plot', x: [0, 13], y: [-1.5, 1.5], xStep: PI, yStep: 0.5, xLabel: 't', ...piAxis([[1], [2], [3], [4]], -1.5),
        fns: [{ expr: 'sin(x)', color: 'blue' }, { expr: '-sin(x)', color: 'red', dashed: true }],
        points: [{ id: 'P', x: 1, on: 0, drag: 'x', snap: 0.1, color: 'blue' }],
        segments: [{ from: 'P', to: ['Px', '-sin(Px)'], color: 'red', dashed: true }],
        readouts: [{ label: 'position', expr: 'f0(Px)', digits: 2, color: 'blue' }, { label: 'acceleration', expr: 'f1(Px)', digits: 2, color: 'red' }],
        alt: 'Two waves over two cycles: the position of the weight, a sine wave, and its acceleration, the same wave upside down. A point can be dragged along the position wave, and readouts give both values.',
      },
      columns: 1,
      options: [
        { text: 'At the top and the bottom of its swing, where it is furthest from the middle', correct: true },
        { text: 'As it passes through the middle', why: 'In the middle the position is 0, so the acceleration is 0 too. The weight is moving fastest there, but for that instant there is no net pull on it.' },
        { text: 'The pull is the same the whole time', why: 'Drag the point: the acceleration swings between −1 and 1. It is always the position with its sign flipped.' },
      ],
      explain: r`
        The acceleration is largest where the position is largest, and it always points back
        towards the middle. That pull overshoots, and (with no friction to stop it) the weight swings to and fro for ever.

        $y'' = -y$ is the signature of oscillation. Whenever something is pulled back in proportion
        to how far it has strayed, sines and cosines appear.
      `,
    },
    {
      id: 'product',
      type: 'expr',
      stretch: true,
      title: 'Mix the rules',
      gen: (rng) => {
        const sine = rng.bool();
        const g = sine ? r`\sin x` : r`\cos x`;
        const dg = sine ? r`\cos x` : r`-\sin x`;
        const gT = sine ? 'sin(x)' : 'cos(x)';
        const dT = sine ? 'cos(x)' : '(-sin(x))';
        const typing = `Type the functions with brackets: ${code('sin(x)')}, ${code('cos(x)')}.`;
        const pick = rng.pick(['x', 'x^2', 'e^x']);
        const f = { x: { tex: 'x', d: '1', typed: 'x', dTyped: '1' }, 'x^2': { tex: 'x^2', d: '2x', typed: 'x^2', dTyped: '2*x' }, 'e^x': { tex: 'e^x', d: 'e^x', typed: 'e^x', dTyped: 'e^x' } }[pick];
        const first = f.d === '1' ? g : `${f.d}${sine ? r`\sin x` : r`\cos x`}`;
        const second = sine ? `+ ${f.tex}\\cos x` : `- ${f.tex}\\sin x`;
        return {
          text: r`A product, so it needs the product rule from the last lesson, $(f \cdot g)' = f' \cdot g + f \cdot g'$. Differentiate: $$ y = ${f.tex}\,${g} $$` + `\n\n${typing}`,
          prefix: r`$\dfrac{dy}{dx} =$`,
          answer: `${f.dTyped}*${gT} + ${f.typed}*${dT}`,
          display: `${f.dTyped === '1' ? '' : `${f.dTyped.replace('*', '')}*`}${gT} ${sine ? '+' : '-'} ${f.typed}*${sine ? 'cos(x)' : 'sin(x)'}`,
          vars: ['x'],
          wrong: [
            // for e^x the product of the derivatives and f·g' are the same thing, so only the second message is listed
            ...(pick === 'e^x' ? [] : [[`${f.dTyped}*${dT}`, r`That is the product of the two derivatives. A product grows by two strips: $f' \cdot g + f \cdot g'$.`]]),
            [`${f.typed}*${dT}`, r`That is $f \cdot g'$ alone. Add the other strip, $f' \cdot g$, where $f' = ${f.d}$.`],
            [`${f.dTyped}*${gT} - ${f.typed}*${dT}`, sine ? r`Check the sign of the second strip: the derivative of $\sin x$ is $+\cos x$.` : r`Check the sign of the second strip: the derivative of $\cos x$ is $-\sin x$.`],
          ],
          hints: [
            r`$f = ${f.tex}$ and $g = ${g}$. You need $f' \cdot g + f \cdot g'$.`,
            r`$f' = ${f.d}$ and $g' = ${dg}$.`,
          ],
          explain: r`
            $f = ${f.tex}$ has $f' = ${f.d}$, and $g = ${g}$ has $g' = ${dg}$.

            $$ \frac{dy}{dx} = ${first} ${second} $$
          `,
        };
      },
    },
    {
      id: 'match',
      type: 'match',
      review: true,
      text: 'Match each function with its derivative.',
      pairs: [
        [r`$\sin x$`, r`$\cos x$`],
        [r`$\cos x$`, r`$-\sin x$`],
        [r`$-\sin x$`, r`$-\cos x$`],
        [r`$\sin 2x$`, r`$2\cos 2x$`],
        [r`$\cos 2x$`, r`$-2\sin 2x$`],
      ],
      explain: r`
        Sine goes to cosine. Cosine goes to *minus* sine. A minus sign in front stays in front,
        and an inside of $2x$ contributes a factor of 2 by the chain rule.
      `,
    },
  ],
  recap: [
    r`With $x$ in radians: $\dfrac{d}{dx}\sin x = \cos x$ and $\dfrac{d}{dx}\cos x = -\sin x$.`,
    'On the unit circle the velocity of the walking point is at right angles to the radius, so its triangle is the position triangle turned through a quarter turn.',
    r`In degrees every slope would carry a factor $\frac{\pi}{180}$. Radians make that factor 1.`,
    r`Differentiate sine twice and you get minus sine: $y'' = -y$, the signature of anything that oscillates.`,
  ],
  next: 'Next: run the chain rule backwards, and integrate functions that the power rule alone could never handle.',
};
