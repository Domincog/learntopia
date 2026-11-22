// Trigonometry: Circles & Waves · Lesson 3 · Around the Circle
import { r, num, frac } from '../../../kit.js';

/** A unit square cut along its diagonal: the lower half is a 45-45-90 triangle. */
const HALF_SQUARE = {
  type: 'svg', viewBox: '0 0 300 226', maxWidth: 400,
  alt: 'A square with sides of length 1, cut in two by a diagonal. The lower half is shaded: a right-angled triangle with two sides of length 1 and a 45 degree angle at the bottom left.',
  content:
    '<path class="fill-none stroke-ink-3" stroke-width="2" stroke-dasharray="6 5" d="M70 190 V30 H230"/>' +
    '<polygon class="fill-blue-soft stroke-ink" stroke-width="3" stroke-linejoin="round" points="70,190 230,190 230,30"/>' +
    '<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M70 190 h32 A32 32 0 0 0 92.6 167.4 Z"/>' +
    '<path class="fill-none stroke-ink" stroke-width="2" d="M218 190 v-12 h12"/>' +
    '<text class="fig-label" x="150" y="210" text-anchor="middle">1</text>' +
    '<text class="fig-label" x="244" y="115" text-anchor="start">1</text>' +
    '<text class="fig-label-lg" x="132" y="98" text-anchor="end">?</text>' +
    '<text class="fig-label-sm" x="122" y="180" text-anchor="middle">45°</text>',
};

/** An equilateral triangle of side 2 cut down the middle: the left half is a 30-60-90 triangle. */
const HALF_TRIANGLE = {
  type: 'svg', viewBox: '0 0 300 232', maxWidth: 400,
  alt: 'An equilateral triangle with sides of length 2, cut in two by its height. The left half is shaded: a right-angled triangle with hypotenuse 2, a base of 1, a 60 degree angle at the bottom left and a 30 degree angle at the top. Its height is marked h.',
  content:
    '<path class="fill-none stroke-ink-3" stroke-width="2" stroke-dasharray="6 5" d="M150 26.8 L250 200 H150"/>' +
    '<polygon class="fill-blue-soft stroke-ink" stroke-width="3" stroke-linejoin="round" points="50,200 150,200 150,26.8"/>' +
    '<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M50 200 h30 A30 30 0 0 0 65 174 Z"/>' +
    '<path class="fill-teal stroke-ink" stroke-width="2" stroke-linejoin="round" d="M150 26.8 v28 A28 28 0 0 1 136 51.05 Z"/>' +
    '<path class="fill-none stroke-ink" stroke-width="2" d="M138 200 v-12 h12"/>' +
    '<text class="fig-label" x="86" y="108" text-anchor="end">2</text>' +
    '<text class="fig-label" x="100" y="220" text-anchor="middle">1</text>' +
    '<text class="fig-label" x="160" y="125" text-anchor="start" font-style="italic">h</text>' +
    '<text class="fig-label-sm" x="98" y="188" text-anchor="middle">60°</text>' +
    '<text class="fig-label-sm" x="136" y="90" text-anchor="middle">30°</text>',
};

/** Both triangles with every side filled in: the half-square (1, 1, √2) and the half-triangle (1, √3, 2). */
const EXACT_TRIANGLES = {
  type: 'svg', viewBox: '0 0 440 204', maxWidth: 460,
  alt: 'Two right-angled triangles. The first is half a square: two sides of length 1, a longest side of length root 2, and a 45 degree angle. The second is half an equilateral triangle: a short side of length 1 next to a 60 degree angle, a height of root 3, a longest side of length 2, and a 30 degree angle at the top.',
  content:
    '<polygon class="fill-blue-soft stroke-ink" stroke-width="3" stroke-linejoin="round" points="30,170 150,170 150,50"/>' +
    '<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M30 170 h28 A28 28 0 0 0 49.8 150.2 Z"/>' +
    '<path class="fill-none stroke-ink" stroke-width="2" d="M138 170 v-12 h12"/>' +
    '<text class="fig-label" x="90" y="192" text-anchor="middle">1</text>' +
    '<text class="fig-label" x="160" y="116" text-anchor="start">1</text>' +
    '<text class="fig-label" x="80" y="98" text-anchor="end">√2</text>' +
    '<text class="fig-label-sm" x="80" y="162" text-anchor="middle">45°</text>' +
    '<polygon class="fill-blue-soft stroke-ink" stroke-width="3" stroke-linejoin="round" points="260,170 340,170 340,31.4"/>' +
    '<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M260 170 h24 A24 24 0 0 0 272 149.2 Z"/>' +
    '<path class="fill-teal stroke-ink" stroke-width="2" stroke-linejoin="round" d="M340 31.4 v28 A28 28 0 0 1 326 55.65 Z"/>' +
    '<path class="fill-none stroke-ink" stroke-width="2" d="M328 170 v-12 h12"/>' +
    '<text class="fig-label" x="300" y="192" text-anchor="middle">1</text>' +
    '<text class="fig-label" x="350" y="108" text-anchor="start">√3</text>' +
    '<text class="fig-label" x="288" y="96" text-anchor="end">2</text>' +
    '<text class="fig-label-sm" x="304" y="160" text-anchor="middle">60°</text>' +
    '<text class="fig-label-sm" x="326" y="84" text-anchor="middle">30°</text>',
};

const QUARTERS = [
  { lo: 0, hi: 90, where: 'to the right of the centre and above it', name: 'upper right', cos: '>', sin: '>' },
  { lo: 90, hi: 180, where: 'to the left of the centre and above it', name: 'upper left', cos: '<', sin: '>' },
  { lo: 180, hi: 270, where: 'to the left of the centre and below it', name: 'lower left', cos: '<', sin: '<' },
  { lo: 270, hi: 360, where: 'to the right of the centre and below it', name: 'lower right', cos: '>', sin: '<' },
];

/** The three exact values, each with a sentence that is true whichever question it turns up in. */
const EXACT = {
  half: { tex: r`\dfrac{1}{2}`, why: r`$\frac{1}{2}$ is $\sin 30^\circ$ and $\cos 60^\circ$: the shortest side of the half-triangle over its hypotenuse.` },
  root2: { tex: r`\dfrac{\sqrt{2}}{2}`, why: r`$\frac{\sqrt{2}}{2}$ belongs to 45°, where sine and cosine are equal.` },
  root3: { tex: r`\dfrac{\sqrt{3}}{2}`, why: r`$\frac{\sqrt{3}}{2}$ is $\sin 60^\circ$ and $\cos 30^\circ$: the height of the half-triangle over its hypotenuse.` },
};
const EXACT_OF = { sin: { 30: 'half', 45: 'root2', 60: 'root3' }, cos: { 30: 'root3', 45: 'root2', 60: 'half' } };

/** [smaller leg, larger leg, hypotenuse] */
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

export default {
  id: 'unit-circle',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Past the top',
      text: r`
        A wheel of radius 1 m turns counter-clockwise. A dot on its rim starts level with the hub, on the right.

        After a turn of 30° the dot is **0.5 m** above the level of the hub, because $\sin 30^\circ = 0.5$.

        **How far above the level of the hub is the dot after a turn of 150°?**
      `,
      figure: {
        type: 'unit-circle', static: true, deg: 30, readouts: [], marks: [0, 90, 180, 270],
        alt: 'A circle of radius 1 with a dot on its rim, turned 30 degrees up from the right-hand side.',
      },
      shuffle: false,
      options: [
        { text: '0.5 m, the same as at 30°', correct: true },
        { text: '2.5 m, five times as high' },
        { text: 'It is 0.5 m below the hub' },
        { text: 'Trigonometry cannot say: no triangle has a 150° angle and a right angle' },
      ],
      explain: r`
        **0.5 m again.** At 150° the dot is on the left of the wheel, 30° short of a half turn, and
        exactly as high as it was at 30°.

        A calculator agrees: $\sin 150^\circ = 0.5$. Yet no right-angled triangle has room for a
        150° angle. In this lesson sine and cosine leave the triangle behind.
      `,
    },
    {
      id: 'circle-triangle',
      type: 'info',
      title: 'Put the triangle in a circle',
      text: r`
        Draw a circle of **radius 1** around the origin and put a point on it. The angle $\theta$ says how far
        the point has turned, **counter-clockwise** from the positive $x$-axis.

        Drop a line from the point straight down to the $x$-axis, and a right-angled triangle appears, with $\theta$ at the centre:

        - its hypotenuse is the [radius]{.violet}, which is 1 long
        - its [blue]{.blue} side lies along the $x$-axis and ends at the point's $x$-coordinate
        - its [orange]{.orange} side is as tall as the point's $y$-coordinate
      `,
      figure: {
        type: 'unit-circle', static: true, deg: 50, names: 'xy', readouts: [], marks: [0, 90, 180, 270],
        alt: 'A circle of radius 1 around the origin, with a point on it 50 degrees up from the positive x-axis. The radius to the point, a horizontal side along the x-axis and a vertical side up to the point form a right-angled triangle.',
      },
    },
    {
      id: 'coords',
      type: 'choice',
      title: 'A triangle inside a circle',
      text: r`
        This circle has radius 1. The [radius]{.violet} to the point is the hypotenuse of a
        right-angled triangle with a [blue]{.blue} and an [orange]{.orange} side.

        From the last lesson: $\sin 35^\circ \approx 0.574$ and $\cos 35^\circ \approx 0.819$.

        **Set the angle to 35°. Where does $\sin 35^\circ$ show up?**
      `,
      figure: {
        type: 'unit-circle', deg: 20, min: 0, max: 90, step: 5, names: 'xy',
        alt: 'A circle of radius 1. A point can be moved along the first quarter of the circle, and its x and y coordinates are shown.',
      },
      options: [
        { text: r`It is the point's $y$-coordinate: its height`, correct: true },
        { text: r`It is the point's $x$-coordinate`, why: r`At 35° the $x$-coordinate is 0.819. That is the cosine: the adjacent side over a hypotenuse of 1.` },
        { text: 'It is the length of the radius', why: 'The radius is 1 at every angle. It is the hypotenuse.' },
      ],
      columns: 1,
      explain: r`
        The hypotenuse is 1, so opposite ÷ hypotenuse is just the opposite side:
        $\sin\theta = \dfrac{y}{1} = y$. In the same way $\cos\theta = \dfrac{x}{1} = x$.

        On this circle, the point at angle $\theta$ is simply $(\cos\theta,\ \sin\theta)$.
      `,
    },
    {
      id: 'define',
      type: 'info',
      title: 'A definition that never runs out',
      text: r`
        So far that is a fact about angles between 0° and 90°. Mathematicians turned it round and
        made it the **definition** of sine and cosine, for every angle.

        :::key
        Take the **unit circle**: radius 1, centre at the origin. Turn a point through the angle
        $\theta$, counter-clockwise, starting from $(1, 0)$. Then
        $$ \cos\theta = x \qquad \sin\theta = y $$
        :::

        Below 90° this agrees with the triangle ratios. Past 90° no right-angled triangle has that
        angle, but the point is still there, and it still has coordinates.
      `,
    },
    {
      id: 'past-90',
      type: 'interact',
      title: 'Answer the wheel question',
      text: `
        Now the point can go all the way round.

        **Find the angle between 90° and 180° at which the sine is exactly 0.5.**
      `,
      widget: {
        type: 'unit-circle', deg: 30, step: 5, marks: [0, 90, 180, 270],
        alt: 'A circle of radius 1. A point can be moved all the way round it; its angle, cosine and sine are shown.',
      },
      check: (s) => {
        if (s.deg === 150) return true;
        if (s.deg === 30) return 'That is the angle you already knew. Look for a second point at the same height, on the left half of the circle.';
        if (s.deg < 90 || s.deg > 180) return 'Stay between 90° and 180°: the upper left quarter of the circle.';
        return s.sin > 0.5
          ? `At ${s.deg}° the sine is ${num(s.sin, 3)}: the point is too high. Keep turning.`
          : `At ${s.deg}° the sine is ${num(s.sin, 3)}: the point is too low. Turn back a little.`;
      },
      solution: { deg: 150 },
      hints: ['The sine is the height of the point. At 30° the height is 0.5. Where on the left half of the circle is the point at that same height?'],
      explain: r`
        At **150°** the point is exactly as high as it was at 30°, so $\sin 150^\circ = 0.5$ too.
        That settles the wheel question.
      `,
    },
    {
      id: 'axis',
      type: 'fill',
      title: 'Top, left, bottom',
      text: 'Use the circle to read off the values when the point sits on an axis.',
      figure: {
        type: 'unit-circle', deg: 60, step: 15, marks: [0, 90, 180, 270],
        alt: 'A circle of radius 1. A point can be moved all the way round it; its angle, cosine and sine are shown.',
      },
      template: r`
        $\sin 90^\circ =$ [[1]] $\qquad \cos 90^\circ =$ [[0]]

        $\cos 180^\circ =$ [[-1]] $\qquad \sin 270^\circ =$ [[-1]]
      `,
      hints: ['At 90° the point is at the very top of the circle. What are its coordinates?'],
      explain: r`
        At 90° the point is at the top, $(0, 1)$. At 180° it is at $(-1, 0)$, and at 270° at $(0, -1)$.
        After 360° it is back at $(1, 0)$ and everything repeats.

        Sine and cosine never leave the range from $-1$ to $1$.
      `,
    },
    {
      id: 'quarters',
      type: 'info',
      title: 'The quarter decides the sign',
      text: r`
        Those axis points cut the circle into four quarters. Cosine is the $x$-coordinate and sine is the
        $y$-coordinate, so the quarter the point is in fixes both signs: left of the $y$-axis the cosine is negative, below the $x$-axis the sine is negative.

        | Angle | Quarter | $\cos\theta$ | $\sin\theta$ |
        |:--|:--|:--:|:--:|
        ${QUARTERS.map((q) => `| ${q.lo}° to ${q.hi}° | ${q.name} | $${q.cos} 0$ | $${q.sin} 0$ |`).join('\n        ')}

        :::example
        The point at 150° is the **mirror image**, in the $y$-axis, of the point at 30°. Same height, opposite side:
        $\sin 150^\circ = \sin 30^\circ = 0.5$, but $\cos 150^\circ = -\cos 30^\circ \approx -0.866$.
        :::
      `,
      figure: {
        type: 'unit-circle', static: true, deg: 150, marks: [0, 90, 180, 270],
        alt: 'A circle of radius 1 with a point at 150 degrees, in the upper left quarter. Its vertical side reaches up to a height of 0.5, and its horizontal side runs to the left of the centre, to minus 0.866.',
      },
    },
    {
      id: 'signs',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const deg = rng.pick([20, 35, 50, 70, 100, 115, 130, 160, 200, 215, 250, 260, 290, 305, 320, 340]);
        const here = QUARTERS[Math.floor(deg / 90)];
        return {
          text: r`A point on the unit circle is turned through $\theta = ${deg}^\circ$, counter-clockwise from the positive $x$-axis. **What are the signs of $\cos\theta$ and $\sin\theta$?**`,
          shuffle: false,
          columns: 1,
          options: QUARTERS.map((q) => (q === here
            ? { text: r`$\cos\theta ${q.cos} 0$ and $\sin\theta ${q.sin} 0$`, correct: true }
            : { text: r`$\cos\theta ${q.cos} 0$ and $\sin\theta ${q.sin} 0$`, why: `That is how it is between ${q.lo}° and ${q.hi}°, where the point is ${q.where}. At ${deg}° the point is ${here.where}.` })),
          hints: ['Sketch the circle. The quarter turns are at 90°, 180° and 270°. Which quarter is the point in?'],
          explain: r`${deg}° lies between ${here.lo}° and ${here.hi}°, so the point is in the ${here.name} quarter of the circle: ${here.where}. Its $x$-coordinate is ${here.cos === '>' ? 'positive' : 'negative'} and its $y$-coordinate is ${here.sin === '>' ? 'positive' : 'negative'}, so $\cos\theta ${here.cos} 0$ and $\sin\theta ${here.sin} 0$.`,
        };
      },
    },
    {
      id: 'half-square',
      type: 'fill',
      title: 'An exact value: 45°',
      text: 'A few angles have values you can work out exactly. Cut a square of side 1 along its diagonal. Each half is a right-angled triangle with two 45° angles.',
      figure: HALF_SQUARE,
      template: r`
        By Pythagoras, diagonal² $= 1^2 + 1^2 =$ [[2]]

        So the diagonal is $\sqrt{2} \approx 1.414$, and to 3 decimals

        $\sin 45^\circ = 1 \div 1.414 \approx$ [[0.707]]
      `,
      tolerance: 0.001,
      explain: r`
        $\sin 45^\circ = \dfrac{1}{\sqrt{2}} \approx 0.707$. The two shorter sides are equal, so
        $\cos 45^\circ$ is the same number.
      `,
    },
    {
      id: 'half-triangle',
      type: 'fill',
      title: 'Exact values: 30° and 60°',
      text: 'Cut an equilateral triangle of side 2 down the middle. Each half has angles of 30°, 60° and 90°, a hypotenuse of 2 and a shortest side of 1. Pythagoras gives its height $h$.',
      figure: HALF_TRIANGLE,
      template: r`
        $h^2 = 2^2 - 1^2 =$ [[3]], so $h = \sqrt{3} \approx 1.732$.

        $\sin 30^\circ = 1 \div 2 =$ [[0.5]]

        $\sin 60^\circ = 1.732 \div 2 \approx$ [[0.866]]
      `,
      tolerance: 0.001,
      hints: ['The side opposite the 30° angle is the short one, of length 1. The side opposite the 60° angle is the height.'],
      explain: r`
        The short side faces the 30° angle and the height faces the 60° angle, so
        $\sin 30^\circ = \dfrac{1}{2}$ and $\sin 60^\circ = \dfrac{\sqrt{3}}{2} \approx 0.866$.
      `,
    },
    {
      id: 'exact-values',
      type: 'info',
      title: 'Three angles with exact values',
      text: r`
        Those two triangles give the sine and cosine of 30°, 45° and 60° **exactly**: each is a side divided by the hypotenuse.

        | Angle | 30° | 45° | 60° |
        |:--|:--:|:--:|:--:|
        ${['sin', 'cos'].map((fn) => `| $\\${fn}$ | ${[30, 45, 60].map((deg) => `$${EXACT[EXACT_OF[fn][deg]].tex}$`).join(' | ')} |`).join('\n        ')}

        - $\frac{1}{\sqrt{2}}$ is usually written $\frac{\sqrt{2}}{2}$. It is the same number.
        - The cosines are the sines in reverse order: the side **opposite** the 30° angle is **adjacent** to the 60° angle.

        :::tip A pattern worth keeping
        The sines of 0°, 30°, 45°, 60°, 90° are $\;\frac{\sqrt{0}}{2},\ \frac{\sqrt{1}}{2},\ \frac{\sqrt{2}}{2},\ \frac{\sqrt{3}}{2},\ \frac{\sqrt{4}}{2}$.
        :::
      `,
      figure: EXACT_TRIANGLES,
    },
    {
      id: 'exact',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const fn = rng.pick(['sin', 'cos']);
        const angle = rng.pick([30, 45, 60]);
        const right = EXACT_OF[fn][angle];
        const tex = fn === 'sin' ? r`\sin` : r`\cos`;
        const side = fn === 'sin' ? 'opposite' : 'adjacent to';
        const from = angle === 45
          ? r`In half a square (sides 1, 1, $\sqrt{2}$) both shorter sides are 1, so the ratio is $\frac{1}{\sqrt{2}} = \frac{\sqrt{2}}{2}$`
          : r`In half an equilateral triangle (sides 1, $\sqrt{3}$, 2) the side ${side} the ${angle}° angle is ${right === 'half' ? '1' : r`$\sqrt{3}$`}, and the hypotenuse is 2`;
        return {
          text: r`What is the **exact** value of $${tex} ${angle}^\circ$?`,
          shuffle: false,
          options: Object.keys(EXACT).map((key) => (key === right
            ? { text: `$${EXACT[key].tex}$`, correct: true }
            : { text: `$${EXACT[key].tex}$`, why: EXACT[key].why })),
          hints: ['Picture the half-square (sides 1, 1, √2) or the half-triangle (sides 1, √3, 2). The smallest angle faces the shortest side.'],
          explain: r`${from}. So $${tex} ${angle}^\circ = ${EXACT[right].tex}$.`,
        };
      },
    },
    {
      id: 'find-240',
      type: 'interact',
      stretch: true,
      title: 'Hunt for an angle',
      text: r`
        You know that $\cos 60^\circ = \frac{1}{2}$.

        **Find the angle at which the cosine is $-\frac{1}{2}$ and the sine is negative as well.**
      `,
      widget: {
        type: 'unit-circle', deg: 60, step: 15, exact: true, marks: [0, 90, 180, 270],
        alt: 'A circle of radius 1. A point can be moved round it in steps of 15 degrees; its angle, cosine and sine are shown, with exact values where they exist.',
      },
      check: (s) => {
        if (s.deg === 240) return true;
        if (s.deg === 120) return 'The cosine is −1/2 here, but the point is above the x-axis, so the sine is positive. Look below the axis.';
        if (s.deg === 60 || s.deg === 300) return 'Here the cosine is +1/2: the point is to the right of the centre. You need it half a unit to the left.';
        if (s.cos >= 0) return 'The cosine is the x-coordinate. For a negative cosine the point has to be to the left of the y-axis.';
        if (s.sin >= 0) return 'The sine is the y-coordinate. For a negative sine the point has to be below the x-axis.';
        return `Right quarter of the circle. But here the cosine is ${num(s.cos, 3)}, and you need −0.5.`;
      },
      solution: { deg: 240 },
      hints: ['Negative cosine: left of the y-axis. Negative sine: below the x-axis. Which quarter is that?', 'In that quarter, look for the point whose triangle with the x-axis is the familiar 60° one.'],
      explain: r`
        **240°**, which is $180^\circ + 60^\circ$. The point is straight across the circle from the
        60° point, so both coordinates change sign: $\left(-\frac{1}{2},\ -\frac{\sqrt{3}}{2}\right)$.

        The triangle it makes with the $x$-axis is the same 60° triangle as before. Only the signs are new.
      `,
    },
    {
      id: 'identity',
      type: 'numeric',
      title: 'Pythagoras on the circle',
      text: r`
        The readouts now show the **squares** of the two coordinates. Move the point to a few
        places, in any quarter of the circle.

        **What do $x^2$ and $y^2$ always add up to?**
      `,
      figure: {
        type: 'unit-circle', deg: 50, step: 5, names: 'xy', readouts: ['angle', 'cos2', 'sin2'],
        alt: 'A circle of radius 1. A point can be moved all the way round it, and the squares of its x and y coordinates are shown.',
      },
      answer: 1,
      hints: ['Add the two readouts at one position, then move the point and add again.'],
      explain: r`
        Always **1**, in every quarter. That is no accident: the two legs and the radius form a right-angled triangle.
      `,
    },
    {
      id: 'pythagoras-identity',
      type: 'info',
      title: 'One coordinate gives the other',
      text: r`
        The legs are $x$ and $y$ and the hypotenuse is 1, so by Pythagoras $x^2 + y^2 = 1^2$. In the language of this lesson:

        :::key
        $$ \sin^2\theta + \cos^2\theta = 1 $$
        :::

        Here $\sin^2\theta$ is shorthand for $(\sin\theta)^2$. It holds for every angle, because squares do not care about signs.

        :::example
        $\sin\theta = \frac{9}{41}$, and $\theta$ is between 90° and 180°. Find $\cos\theta$.

        1. Square the sine: $\left(\frac{9}{41}\right)^2 = \frac{81}{1681}$
        2. The squares add up to 1: $\cos^2\theta = 1 - \frac{81}{1681} = \frac{1600}{1681}$
        3. Take the square root: $\cos\theta$ is $\frac{40}{41}$ or $-\frac{40}{41}$.
        4. Between 90° and 180° the point is to the left of the $y$-axis, so $\cos\theta = -\frac{40}{41}$.
        :::
      `,
    },
    {
      id: 'other-coordinate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [p, q, c] = rng.pick(TRIPLES);
        const [a, b] = rng.bool() ? [p, q] : [q, p];
        const second = rng.bool();
        const range = second ? 'between 90° and 180°' : 'between 0° and 90°';
        const sign = second ? -1 : 1;
        return {
          text: r`For an angle $\theta$ **${range}**, $\sin\theta = ${frac(a, c, { dfrac: true })}$. **What is $\cos\theta$?** Give a fraction.`,
          answer: `${sign * b}/${c}`,
          display: `${sign * b}/${c}`,
          prefix: r`$\cos\theta =$`,
          tolerance: 0.002,
          wrong: [
            [-sign * b / c, second
              ? 'The size is right. But between 90° and 180° the point is to the left of the y-axis, so the cosine is negative.'
              : 'The size is right. But between 0° and 90° the point is to the right of the y-axis, so the cosine is positive.'],
            [1 - a / c, r`$\sin\theta + \cos\theta$ is not 1. It is the **squares** that add up to 1.`],
            [a / c, r`That is the sine again. Use $\sin^2\theta + \cos^2\theta = 1$ to find the other coordinate.`],
          ],
          hints: [
            r`$\sin^2\theta + \cos^2\theta = 1$, so $\cos^2\theta = 1 - \left(${frac(a, c)}\right)^2 = ${frac(c * c - a * a, c * c)}$.`,
            r`So $\cos\theta$ is $${frac(b, c)}$ or $-${frac(b, c)}$. Which side of the $y$-axis is the point on?`,
          ],
          explain: r`$\cos^2\theta = 1 - \left(${frac(a, c)}\right)^2 = 1 - ${frac(a * a, c * c)} = ${frac(b * b, c * c)}$, so $\cos\theta = \pm${frac(b, c)}$. ${second ? 'Between 90° and 180° the point is to the left of the $y$-axis, so the cosine is negative' : 'Between 0° and 90° the point is to the right of the $y$-axis, so the cosine is positive'}: $\cos\theta = ${frac(sign * b, c)}$.`,
        };
      },
    },
    {
      id: 'mirror',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const small = rng.pick([10, 20, 25, 35, 40, 55, 70]);
        const big = 180 - small;
        const fn = rng.pick(['sin', 'cos']);
        const options = fn === 'sin'
          ? [
            { text: r`$\sin ${small}^\circ$`, correct: true },
            { text: r`$-\sin ${small}^\circ$`, why: `At ${big}° the point is above the x-axis, so its sine is positive.` },
            { text: r`$\cos ${small}^\circ$`, why: `That is the x-coordinate of the point at ${small}°. The mirror image keeps the height, which is the sine.` },
            { text: r`$-\cos ${small}^\circ$`, why: `That is the cosine of ${big}°, its x-coordinate. The sine is the height.` },
          ]
          : [
            { text: r`$-\cos ${small}^\circ$`, correct: true },
            { text: r`$\cos ${small}^\circ$`, why: `At ${big}° the point is to the left of the y-axis, so its cosine is negative.` },
            { text: r`$\sin ${small}^\circ$`, why: `That is the sine of ${big}°, its height. The cosine is the x-coordinate.` },
            { text: r`$-\sin ${small}^\circ$`, why: 'The mirror image keeps the height and reverses the x-coordinate. Sine and cosine do not change places.' },
          ];
        return {
          text: r`On the unit circle, the point at ${big}° is the mirror image, in the $y$-axis, of the point at ${small}°. **Which of these is equal to $${fn === 'sin' ? r`\sin` : r`\cos`} ${big}^\circ$?**`,
          options,
          explain: r`${big}° is ${small}° short of a half turn, so its point is the mirror image of the ${small}° point: the same height, and the opposite $x$-coordinate. So $\sin ${big}^\circ = \sin ${small}^\circ$ and $\cos ${big}^\circ = -\cos ${small}^\circ$.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A friend says: "$\sin 150^\circ$ makes no sense. You cannot have a 150° angle in a right-angled triangle."

        **What do you tell them?**
      `,
      model: r`
        They are right about the triangle: its other two angles have to share 90°. But sine is not
        tied to triangles any more. It is defined on the unit circle: turn a point through the angle,
        and its height is the sine, its $x$-coordinate the cosine.

        At 150° the point is exactly as high as at 30°, so $\sin 150^\circ = 0.5$. For angles below
        90° this definition gives the same numbers as opposite ÷ hypotenuse, so nothing old has been lost.
      `,
    },
  ],
  recap: [
    r`On the unit circle, the point at angle $\theta$ is $(\cos\theta, \sin\theta)$. That defines sine and cosine for every angle.`,
    'The signs follow the quarter of the circle: the cosine is negative on the left, the sine is negative below.',
    r`Exact values: $\sin 30^\circ = \frac{1}{2}$, $\sin 45^\circ = \frac{\sqrt{2}}{2}$, $\sin 60^\circ = \frac{\sqrt{3}}{2}$. The cosines are the same numbers in reverse order.`,
    r`$\sin^2\theta + \cos^2\theta = 1$: Pythagoras on a circle of radius 1.`,
  ],
  next: 'Next: degrees are a human invention. The circle has its own way of measuring an angle.',
};
