// Trigonometry: Circles & Waves · Lesson 4 · A Better Way to Measure Angles
import { r, num, gcd } from '../../../kit.js';
import { piTex, fracText, keyFor, roundTo } from '../helpers.js';

/** Angles that are tidy fractions of a half turn. */
const DEGREES = [10, 15, 20, 30, 36, 40, 45, 60, 72, 75, 90, 105, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330];
/** [n, d] for the angle nπ/d. */
const PI_FRACTIONS = [[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [11, 6], [2, 5], [3, 5], [1, 10], [1, 12], [5, 12]];

/** Things that turn through an angle given in radians. `r` values and angles are chosen so that r × angle is tidy. */
const ARCS = [
  {
    radii: [0.5, 1, 1.5, 2, 2.5], angles: [0.2, 0.3, 0.4, 0.6], unit: 'm',
    text: (rad, a) => `A pendulum **${rad} m** long swings through an angle of **${a} radians**.`,
    ask: 'How long is the arc traced by its tip?',
  },
  {
    radii: [0.3, 0.4, 0.5, 0.6], angles: [2, 3, 4, 5, 10], unit: 'm',
    text: (rad, a) => `A wheel of radius **${rad} m** rolls along the ground, turning through **${a} radians**.`,
    ask: 'How far does it roll? (A rolling wheel covers the same distance as the arc that touches the ground.)',
  },
  {
    radii: [0.7, 0.8, 0.9], angles: [0.5, 1, 1.5], unit: 'm',
    text: (rad, a) => `A door **${rad} m** wide swings open through **${a} ${a === 1 ? 'radian' : 'radians'}**.`,
    ask: 'How far does the outer edge of the door travel?',
  },
  {
    radii: [40, 45, 50, 60], angles: [1.5, 2, 2.5], unit: 'cm',
    text: (rad, a) => `A windscreen wiper **${rad} cm** long sweeps through **${a} radians**.`,
    ask: 'How far does its tip travel in one sweep?',
  },
];

/** Things whose angle is given in degrees, so that it has to be converted first. */
const SLICES = [
  { radii: [12, 15, 18, 20], degrees: [30, 45, 60, 90], unit: 'cm', places: 1, text: (rad, d) => `A slice of pizza is cut from a pizza of radius **${rad} cm**. The angle at its tip is **${d}°**.`, ask: 'How long is the curved crust?' },
  { radii: [200, 300, 400, 500], degrees: [30, 45, 60], unit: 'm', places: 0, text: (rad, d) => `A railway line curves along an arc of a circle of radius **${rad} m**, and turns the train through **${d}°**.`, ask: 'How long is the curved stretch of track?' },
  { radii: [20, 25, 30, 40], degrees: [30, 45, 60, 120], unit: 'm', places: 1, text: (rad, d) => `A big wheel at a fair has radius **${rad} m**. It turns through **${d}°**.`, ask: 'How far does a seat on its rim travel?' },
];

export default {
  id: 'radians',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A piece of string',
      text: `
        Cut a piece of string exactly as long as the [radius]{.orange} of this circle. Then lay it
        along the **edge** of the circle, starting on the right.

        **Guess the angle that the string spans at the centre.**
      `,
      figure: {
        type: 'radian-wrap', static: true, arc: 0, readouts: [],
        alt: 'A circle with its radius drawn from the centre to the right-hand edge.',
      },
      min: 10, max: 120, step: 5, start: 10, answer: 55, tolerance: 10, unit: '°',
      explain: `
        About **57.3°**: a little less than 60°.

        (A *straight* stick as long as the radius would span exactly 60°, because it would make an
        equilateral triangle with two radii. The string bends along the edge, so it does not reach quite as far.)
      `,
    },
    {
      id: 'arc-idea',
      type: 'info',
      title: 'Measure an angle by its arc',
      text: `
        An angle at the centre of a circle cuts off a piece of the circle's edge. That piece is called an **arc**.
        Open the angle wider and the arc gets longer, so the arc can measure the angle.

        A big circle has longer arcs than a small one, though. To be fair to both, count the arc in
        **radius-lengths**: how many times the [radius]{.orange} of that same circle fits along it. That is what the string did.

        In the picture the arc is half a radius-length long.
      `,
      figure: {
        type: 'radian-wrap', static: true, arc: 0.5, readouts: ['ratio'],
        alt: 'A circle with its radius drawn, and an arc half as long as the radius laid along its edge. Two radii mark the angle that the arc spans at the centre.',
      },
    },
    {
      id: 'wrap',
      type: 'interact',
      title: 'One radius-length of arc',
      text: `
        Here is the string, lying along the edge.

        **Make the arc exactly 1 radius long. Then change the size of the circle** and watch what happens to the angle.
      `,
      widget: {
        type: 'radian-wrap', arc: 0.4, r: 2, rRange: [1, 3], rStep: 0.5, readouts: ['ratio', 'deg'],
        alt: 'A circle with an arc laid along its edge. One slider sets how many radius-lengths long the arc is, and another changes the size of the circle.',
      },
      check: (s) => {
        if (s.arc !== 1) return `The arc is ${num(s.arc, 2)} radius-lengths long. Make it exactly 1.`;
        if (s.sizesTried < 2) return 'That is one radius-length of arc. Now move the "size of the circle" slider and watch the angle.';
        return true;
      },
      solution: { arc: 1, r: 3, sizes: [2, 3] },
      explain: `
        **57.3°**, whatever the size. All circles are similar: enlarge one, and its radius and its arc
        grow by the same scale factor.

        So "one radius-length of arc" picks out one particular angle. That makes it a natural unit for measuring angles.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'The radian',
      text: r`
        An angle of **one radian** is the angle at the centre of a circle that cuts off an arc exactly as long as the radius.

        Any angle can be measured the same way: count how many radius-lengths of arc it cuts off.

        :::key
        $$ \text{angle in radians} = \frac{\text{arc length}}{\text{radius}} $$
        :::

        One radian is about 57.3°. Splitting a turn into 360 degrees was a human choice. The radian comes from the circle itself.
      `,
    },
    {
      id: 'full-turn',
      type: 'interact',
      title: 'All the way round',
      text: `
        Keep laying radius-lengths along the edge. Each colour is one radius-length.

        **Take the arc all the way round the circle.** How many radius-lengths does it take?
      `,
      widget: {
        type: 'radian-wrap', arc: 1, readouts: ['ratio', 'deg'],
        alt: 'A circle with an arc laid along its edge in pieces, each one radius long. A slider sets the length of the arc.',
      },
      check: (s) => s.full || `The arc spans ${num(s.deg, 1)}° so far. Keep going until it closes the circle.`,
      solution: { arc: 6.283 },
      explain: r`
        Six radius-lengths and a bit more: **6.28**, on a circle of any size.
      `,
    },
    {
      id: 'full-turn-rule',
      type: 'info',
      title: 'Why 6.28?',
      text: r`
        You have met that number. The circumference of a circle is $2\pi$ times its radius, so it is $2\pi$ radius-lengths long, and $2\pi \approx 6.283$.

        :::key
        A full turn, 360°, is $2\pi$ radians.
        :::

        So angles in radians are usually written as multiples of $\pi$, and any part of a turn is the same part of $2\pi$.

        :::example
        Three quarters of a turn is 270°. In radians it is three quarters of $2\pi$:
        $$ \tfrac{3}{4} \times 2\pi = \frac{3\pi}{2} \approx 4.71 $$
        :::
      `,
      figure: {
        type: 'radian-wrap', static: true, arc: 6.283, readouts: ['ratio', 'deg'],
        alt: 'A circle with an arc laid all the way round its edge in pieces, each one radius long: six whole pieces and a short seventh one.',
      },
    },
    {
      id: 'turns',
      type: 'fill',
      title: 'Half turns and quarter turns',
      text: r`A full turn, 360°, is $2\pi$ radians. Use the circle to check the others.`,
      figure: {
        type: 'radian-wrap', arc: 2, readouts: ['ratio', 'deg'],
        alt: 'A circle with an arc laid along its edge. A slider sets the length of the arc in radius-lengths, and the angle is shown in degrees.',
      },
      template: r`
        A half turn, 180°, is $\pi$ radians, which is about [[3.14]] (to 2 decimals).

        A quarter turn, 90°, is $\pi \div$ [[2]] radians, which is about [[1.57]].
      `,
      tolerance: 0.005,
      hints: ['Slide the arc until the angle reads exactly 180°, and read off arc ÷ radius.'],
      explain: r`
        Half of the circumference is $\pi r$, so a half turn is $\pi \approx 3.14$ radians. Halve it again:
        a right angle is $\frac{\pi}{2} \approx 1.57$ radians.

        Worth knowing by heart: $360^\circ = 2\pi$, $\;180^\circ = \pi$, $\;90^\circ = \frac{\pi}{2}$.
      `,
    },
    {
      id: 'pi-steps',
      type: 'interact',
      title: 'Think in fractions of π',
      text: r`
        The most useful angles are simple fractions of a half turn, so in radians they are fractions of $\pi$.
        This dial moves in steps of 15° but names every angle in radians.

        **Set the angle to 60°.**
      `,
      widget: {
        type: 'radian-wrap', mode: 'pi', deg: 135, readouts: ['rad'],
        alt: 'A circle with an adjustable angle at its centre. The angle moves in steps and is named in radians, as a multiple of pi.',
      },
      check: (s) => {
        if (s.deg === 60) return true;
        return s.deg < 60
          ? `That angle is only ${s.deg}°. Open it further.`
          : `That angle is ${s.deg}°. Close it up.`;
      },
      solution: { deg: 60 },
      hints: [r`180° is $\pi$ radians. What fraction of 180° is 60°?`],
      explain: r`
        60° is a third of 180°, so it is $\frac{\pi}{3}$ radians. In the same way
        $30^\circ = \frac{\pi}{6}$, $\;45^\circ = \frac{\pi}{4}\;$ and $\;90^\circ = \frac{\pi}{2}$.
      `,
    },
    {
      id: 'convert',
      type: 'info',
      title: 'Converting',
      text: r`
        Everything follows from one fact:

        :::key
        $$ 180^\circ = \pi \text{ radians} $$
        :::

        So one degree is $\frac{\pi}{180}$ radians. **Degrees to radians: multiply by $\frac{\pi}{180}$**, then simplify the fraction.

        :::example
        $$ \begin{aligned} 80^\circ &= 80 \times \frac{\pi}{180} = \frac{80}{180} \times \pi \\[4pt] &= \frac{4}{9} \times \pi \text{ radians} \end{aligned} $$

        80 and 180 can both be divided by 20. The answer is usually written $\frac{4\pi}{9}$.
        :::
      `,
    },
    {
      id: 'deg-to-rad',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const deg = rng.pick(DEGREES);
        const g = gcd(deg, 180);
        return {
          text: r`Write **${deg}°** in radians, as a fraction of $\pi$.`,
          template: r`$${deg}^\circ =$ [[${fracText(deg, 180)}]] $\times\ \pi$ radians`,
          hints: [
            r`180° is $\pi$ radians, so multiply by $\dfrac{\pi}{180}$: the fraction you need is $\dfrac{${deg}}{180}$, simplified.`,
            `${deg} and 180 can both be divided by ${g}.`,
          ],
          explain: r`$${deg}^\circ = ${deg} \times \dfrac{\pi}{180} = ${piTex(deg, 180)}$ radians: divide ${deg} and 180 by ${g}.`,
        };
      },
    },
    {
      id: 'convert-back',
      type: 'info',
      title: 'And back to degrees',
      text: r`
        Read the fact the other way: $\pi$ radians is 180°. **Radians to degrees: multiply by $\frac{180}{\pi}$.**

        :::example
        With a $\pi$ in the angle, that simply swaps the $\pi$ for 180°: $\;\dfrac{4\pi}{5} = \dfrac{4 \times 180^\circ}{5} = 144^\circ$

        Without one, use $\pi \approx 3.1416$: $\;4 \text{ radians} = 4 \times \dfrac{180^\circ}{\pi} \approx 229.2^\circ$
        :::

        From here on, an angle written **without** a degree sign is in radians. Calculators have a
        DEG / RAD switch for the same reason: $\sin 30^\circ = 0.5$, but $\sin 30 \approx -0.988$.
      `,
    },
    {
      id: 'rad-to-deg',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        if (rng.bool(0.7)) {
          const [n, d] = rng.pick(PI_FRACTIONS);
          const deg = (180 * n) / d;
          return {
            text: r`Convert $${piTex(n, d)}$ radians to degrees.`,
            answer: deg,
            unit: '°',
            feedback: (v) => (Math.abs(v - (n / d) * Math.PI) < 0.02 ? 'That is the same angle as a decimal number of radians. To get degrees, swap the π for 180°.' : null),
            hints: [r`$\pi$ radians is 180°. Replace $\pi$ by 180° and work out the fraction.`],
            explain: r`$\pi$ radians is 180°, so $${piTex(n, d)} = \dfrac{${n === 1 ? '' : `${n} \\times `}180^\circ}{${d}} = ${deg}^\circ$.`,
          };
        }
        const rad = rng.pick([0.5, 1, 1.5, 2, 2.5, 3]);
        const exact = (rad * 180) / Math.PI;
        const answer = Math.round(exact);
        return {
          text: `Convert **${rad} ${rad === 1 ? 'radian' : 'radians'}** to degrees. Round to the nearest degree. (π ≈ 3.1416)`,
          answer,
          tolerance: 0.5,
          unit: '°',
          feedback: (v) => (v < 10 ? 'One radian alone is about 57°. To go from radians to degrees, multiply by 180 ÷ π.' : null),
          hints: [r`Multiply by $\dfrac{180}{\pi}$.`],
          explain: r`$${rad} \times \dfrac{180^\circ}{\pi} \approx ${num(exact, 2)}^\circ$, which is ${answer}° to the nearest degree. A quick check: one radian is about 57°.`,
        };
      },
    },
    {
      id: 'arc-rule',
      type: 'info',
      title: 'From the angle back to the arc',
      text: r`
        An angle in radians is arc ÷ radius. Multiply both sides by the radius, and the arc is radius × angle:

        :::key
        $$ s = r\theta $$
        :::

        Here $s$ is the length of the arc, $r$ the radius and $\theta$ the angle.

        :::example
        A circle has a radius of 3 m. An angle of 2 radians at its centre cuts off two radius-lengths of arc.

        $s = 3 \times 2 = 6$ m
        :::

        The formula only works with the angle **in radians**. An angle in degrees has to be converted first.
      `,
      figure: {
        type: 'radian-wrap', static: true, arc: 2, r: 3, readouts: ['lengths', 'rad'], unit: 'm',
        alt: 'A circle of radius 3 metres with an arc two radius-lengths long laid along its edge. The arc is 6 metres long and spans an angle of 2 radians.',
      },
    },
    {
      id: 'arc-length',
      type: 'numeric',
      review: true,
      title: 'Arc length',
      gen: (rng) => {
        const story = rng.pick(ARCS);
        const rad = rng.pick(story.radii);
        const angle = rng.pick(story.angles);
        const answer = roundTo(rad * angle, 4);
        return {
          text: r`
            An angle in radians is arc ÷ radius, so the arc is radius × angle: $\;s = r\theta$.

            ${story.text(num(rad), angle)} **${story.ask}**
          `,
          answer,
          unit: story.unit,
          tolerance: 0.005,
          wrong: [
            [angle / rad, 'That divides the angle by the radius. The arc is the radius **times** the angle.'],
            [rad / angle, 'That divides the radius by the angle. The arc is the radius **times** the angle.'],
          ],
          hints: [r`$s = r\theta$ with $r = ${num(rad)}$ and $\theta = ${angle}$. The angle is already in radians.`],
          explain: r`$s = r\theta = ${num(rad)} \times ${angle} = ${num(answer)}$ ${story.unit}. No $\pi$ and no 360 in sight: that is what measuring in radians buys you.`,
        };
      },
    },
    {
      id: 'arc-degrees',
      type: 'numeric',
      stretch: true,
      title: 'When the angle comes in degrees',
      gen: (rng) => {
        const story = rng.pick(SLICES);
        const rad = rng.pick(story.radii);
        const deg = rng.pick(story.degrees);
        const g = gcd(deg, 180);
        const exact = (rad * deg * Math.PI) / 180;
        // other honest routes: π taken as 3.14 or 3.142, the angle rounded to 3 decimals before multiplying,
        // or the right fraction of a circumference that was rounded to 1 decimal
        const key = keyFor(exact, [
          (rad * deg * 3.14) / 180, (rad * deg * 3.142) / 180, rad * roundTo((deg * Math.PI) / 180, 3), rad * roundTo((deg * 3.14) / 180, 3),
          (roundTo(2 * Math.PI * rad, 1) * deg) / 360,
        ], story.places);
        return {
          text: `${story.text(rad, deg)}\n\n**${story.ask}** ${story.places ? 'Round to 1 decimal place.' : 'Round to the nearest metre.'}`,
          ...key,
          unit: story.unit,
          wrong: [
            [rad * deg, r`That multiplies the radius by the angle in **degrees**. $s = r\theta$ only works when $\theta$ is in radians: convert first.`],
          ],
          hints: [
            r`$s = r\theta$ needs the angle in radians. Convert ${deg}° first.`,
            r`$${deg}^\circ = ${piTex(deg, 180)} \approx ${num((deg * Math.PI) / 180, 3)}$ radians.`,
          ],
          explain: r`First convert: $${deg}^\circ = ${piTex(deg, 180)}$ radians. Then $s = r\theta = ${rad} \times ${piTex(deg / g, 180 / g)} \approx ${key.display}$ ${story.unit}.`,
        };
      },
    },
    {
      id: 'why-radians',
      type: 'choice',
      title: 'Why bother?',
      text: r`
        One honest reason: formulas get simpler. You have just used $s = r\theta$. Here is another.

        The curve is $y = \sin x$ with $x$ in **radians**. The dashed line is $y = x$. Drag the point towards 0 and compare the two readouts.

        **For small angles in radians, $\sin x$ is very close to…**
      `,
      figure: {
        type: 'plot', x: [0, 1.6], y: [0, 1.2], xStep: 0.2, yStep: 0.2,
        fns: [{ expr: 'sin(x)', color: 'blue' }, { expr: 'x', color: 'gray', dashed: true }],
        points: [{ id: 'P', x: 1, on: 0, drag: 'x', snap: 0.05, color: 'orange' }],
        readouts: [{ label: '$x$', expr: 'Px', digits: 2 }, { label: '$\\sin x$', expr: 'f0(Px)', digits: 4, color: 'blue' }],
        alt: 'The graph of sine x for x from 0 to 1.6 radians, with the straight line y equals x. Near zero the two almost coincide. A point can be dragged along the sine curve.',
      },
      options: [
        { text: r`$x$ itself`, correct: true },
        { text: r`$x^2$`, why: r`At $x = 0.2$, $x^2$ is 0.04, but $\sin 0.2 \approx 0.199$.` },
        { text: r`$\dfrac{x}{2}$`, why: r`At $x = 0.2$ that would be 0.1, but $\sin 0.2 \approx 0.199$.` },
        { text: '1', why: r`$\sin x$ only reaches 1 at a quarter turn, $x = \frac{\pi}{2} \approx 1.57$. Near 0 it is near 0.` },
      ],
      explain: r`
        $\sin 0.1 \approx 0.0998$ and $\sin 0.2 \approx 0.1987$: for small angles, $\sin x \approx x$.

        On the unit circle, the angle in radians *is* the length of the arc, and for a small angle the
        height of the point is almost the same as that short arc. It only works in radians: in degrees,
        $\sin 1^\circ \approx 0.01745$, nowhere near 1. This is why calculus measures angles in radians.
      `,
    },
    {
      id: 'order',
      type: 'order',
      review: true,
      text: 'Put these angles in order, smallest first. Watch the units.',
      items: ['45°', '1 radian', r`$\dfrac{\pi}{2}$ radians`, '100°', r`$\pi$ radians`],
      labels: ['Smallest', 'Largest'],
      hints: ['Turn them all into degrees. One radian is about 57°.'],
      explain: r`In degrees they are 45°, about 57.3°, 90°, 100° and 180°. A radian is a big unit: just over 6 of them make a full turn.`,
    },
  ],
  recap: [
    'An angle in radians is the arc it cuts off divided by the radius. One radian is about 57.3°.',
    r`A full turn is $2\pi$ radians, because the circumference is $2\pi$ radius-lengths. So $180^\circ = \pi$.`,
    r`To convert, multiply by $\frac{\pi}{180}$ (degrees to radians) or by $\frac{180}{\pi}$ (radians to degrees).`,
    r`With the angle in radians, arc length is simply $s = r\theta$.`,
  ],
  next: 'Next: let the point keep walking round the circle, and plot its height. A wave appears.',
};
