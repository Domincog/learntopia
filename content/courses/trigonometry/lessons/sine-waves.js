// Trigonometry: Circles & Waves · Lesson 5 · Waves from a Wheel
import { r, num } from '../../../kit.js';
import { fracText, piTex } from '../helpers.js';

const PI = Math.PI;

/** A small graph without numbers, for the answer options of the opening question. */
const thumb = (expr, alt) => ({
  type: 'plot', x: [0, 12.566], y: [-1.6, 1.6], xStep: 3.1416, yStep: 1, tickLabels: false, height: 240,
  fns: [{ expr, color: 'blue' }], alt,
});

/**
 * Hours of daylight in London (latitude 51.5° N) on the 21st of each month, from
 * 21 December to the next 21 December. Worked out from the sun's declination
 * with the standard sunrise equation (sunrise and sunset as published: upper limb,
 * standard refraction), averaged over the four years of a leap cycle and rounded
 * to 0.1 h. Published sunrise and sunset tables agree: 7 h 50 min and 16 h 38 min
 * at the solstices, about 15 h 56 min on 21 July, 12 h 16 min on 21 September and
 * 10 h 20 min on 21 October.
 */
export const DAYLIGHT = [7.8, 8.6, 10.4, 12.2, 14.3, 15.9, 16.6, 15.9, 14.3, 12.3, 10.3, 8.6, 7.8];

/** How far a wave D + A·sin(2π(x − C)/12) is from the daylight dots (root mean square error, in hours). */
export function daylightMiss({ D, A, C }) {
  let total = 0;
  DAYLIGHT.forEach((hours, month) => { total += (D + A * Math.sin((2 * PI * (month - C)) / 12) - hours) ** 2; });
  return Math.sqrt(total / DAYLIGHT.length);
}

/** Speeds B whose period 2π/B is a tidy fraction of π: [B as TeX inside the sine, numerator, denominator of the period ÷ π]. */
const SPEEDS = [
  { tex: '2x', n: 1, d: 1, B: 2 }, { tex: '4x', n: 1, d: 2, B: 4 }, { tex: '3x', n: 2, d: 3, B: 3 }, { tex: '6x', n: 1, d: 3, B: 6 },
  { tex: '8x', n: 1, d: 4, B: 8 }, { tex: '5x', n: 2, d: 5, B: 5 },
  { tex: r`\tfrac{1}{2}x`, n: 4, d: 1, B: 1 / 2 }, { tex: r`\tfrac{1}{3}x`, n: 6, d: 1, B: 1 / 3 }, { tex: r`\tfrac{1}{4}x`, n: 8, d: 1, B: 1 / 4 },
];

/** Things that swing between a highest and a lowest value: [midline, amplitude] pairs for each. */
const SWINGS = [
  { text: (hi, lo) => `In a harbour the water is **${hi} m** deep at high tide and **${lo} m** deep at low tide.`, pairs: [[3, 1], [3.5, 1.5], [4, 2.5], [4.5, 2], [5, 1.5], [6, 2.5]], unit: 'm' },
  { text: (hi, lo) => `Over a day, the temperature in a greenhouse swings between a high of **${hi} °C** and a low of **${lo} °C**.`, pairs: [[18, 4], [20, 5], [21, 7], [22, 6], [24, 7.5], [19, 3.5]], unit: '°C' },
  { text: (hi, lo) => `A seat on a big wheel is **${hi} m** above the ground at the top and **${lo} m** at the bottom.`, pairs: [[12, 10], [15, 13], [20, 18], [26, 24], [32, 30], [11, 9.5]], unit: 'm' },
  { text: (hi, lo) => `In one city the longest day of the year has **${hi} hours** of daylight and the shortest has **${lo} hours**.`, pairs: [[12, 2], [12, 3.5], [12.5, 4.5], [12, 5], [12.5, 6], [12, 6.5]], unit: 'hours' },
];

/** The standard tuning note (A above middle C, 440 Hz by international standard) and the As around it: each octave doubles the frequency. */
const NOTES = [
  { hz: 440, name: 'The A above middle C, the standard note for tuning instruments,' },
  { hz: 220, name: 'The A one octave below the standard tuning note' },
  { hz: 110, name: 'The A two octaves below the standard tuning note' },
  { hz: 880, name: 'The A one octave above the standard tuning note' },
];

export default {
  id: 'sine-waves',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Up and down, round and round',
      text: `
        A point walks round a circle at a steady pace. You note its **height** above the centre,
        and plot that height against the angle it has turned through.

        **What will the graph look like?**
      `,
      shuffle: false,
      options: [
        { text: 'A zigzag', figure: thumb('(2/pi)*asin(sin(x))', 'A zigzag made of straight lines, going up and down twice.') },
        { text: 'A row of half-circles', figure: thumb('sqrt(1 - (mod(x, pi)*2/pi - 1)^2) * sign(sin(x))', 'A row of half-circles, alternately above and below the axis.') },
        { text: 'A smooth wave', correct: true, figure: thumb('sin(x)', 'A smooth wave going up and down twice.') },
      ],
      explain: `
        A smooth wave.

        Near the top and the bottom of the circle the point is travelling sideways, so its height
        hardly changes: the wave is flat there. Halfway up it is travelling straight up or down, so
        that is where the wave is steepest.
      `,
    },
    {
      id: 'unroll',
      type: 'interact',
      graded: false,
      title: 'Unroll the circle',
      text: r`
        The [green]{.green} point walks round the unit circle. Its [height]{.orange} is carried
        across to the graph and plotted above $x$, the angle turned so far, in radians.

        **Send the point once round the circle** and watch the wave being drawn. Press Play, or drag the slider.
      `,
      widget: {
        type: 'wave-maker', turns: 2, deg: 0, step: 15,
        alt: 'A point on a circle of radius 1, and next to it a graph of the height of the point against the angle it has turned through.',
      },
      check: (s) => s.traced >= 360 || 'Keep going: the point has not been all the way round the circle yet.',
      solution: { deg: 360 },
      explain: r`
        This curve is the graph of $y = \sin x$: the **sine wave**.

        Nothing new has been calculated. The height of the point *is* $\sin x$, by the unit-circle
        definition. The graph only spreads those heights out along an axis. On its second lap the
        point repeats itself exactly, and so does the wave.
      `,
    },
    {
      id: 'landmarks',
      type: 'fill',
      title: 'Landmarks',
      text: r`Use the wheel to find the landmarks of $y = \sin x$ during its first turn. The angle $x$ is in radians.`,
      figure: {
        type: 'wave-maker', turns: 1, deg: 30, step: 15, play: false,
        alt: 'A point on a circle of radius 1, and a graph of its height over one full turn. A slider moves the point.',
      },
      template: r`
        The wave is highest at $x = \frac{\pi}{2}$, where $\sin x =$ [[1]].

        It is first back on the axis at $x =$ [[π/2|*π|2π]].

        It is lowest at $x =$ [[π|*3π/2|2π]], where $\sin x =$ [[-1]].

        One full cycle is complete at $x =$ [[π|*2π|4π]].
      `,
      hints: ['Move the point to the very top of the wheel. How far has it turned, and how high is it?'],
      explain: r`
        $\sin 0 = 0$, $\;\sin\frac{\pi}{2} = 1$, $\;\sin\pi = 0$, $\;\sin\frac{3\pi}{2} = -1$, $\;\sin 2\pi = 0$.

        These are the right, top, left and bottom of the unit circle (0°, 90°, 180°, 270°), written in radians.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Two words for any wave',
      text: r`
        - The **period** is the length of one complete cycle, measured along the $x$-axis. For $y = \sin x$ it is $2\pi$: one turn of the wheel.
        - The **amplitude** is how far the wave rises above its middle line. For $y = \sin x$ it is 1: the radius of the wheel.

        Because the wheel is back where it started after every full turn,
        $$ \sin(x + 2\pi) = \sin x \quad \text{for every } x. $$
      `,
    },
    {
      id: 'wheel',
      type: 'interact',
      title: 'A different wheel',
      text: `
        What happens to the wave if the wheel is bigger, or turns faster?

        **Change the wheel until its wave lies exactly on the dashed one.** You can drag the green point to watch the wheel turn.
      `,
      widget: {
        type: 'wave-maker', turns: 1, deg: 45, step: 15, A: 1, B: 1, aRange: [0.5, 2.5], aStep: 0.5, bRange: [0.5, 3], bStep: 0.5, target: { A: 2, B: 3 },
        alt: 'A wheel and the wave made by a point on its rim. Sliders set the radius of the wheel and how fast it turns. A dashed target wave is taller than the starting wave and has three cycles.',
      },
      check: (s) => {
        if (s.A === 2 && s.B === 3) return true;
        if (s.A !== 2 && s.B !== 3) return `Your wave is ${s.A < 2 ? 'not tall enough' : 'too tall'}, and it has ${s.B < 3 ? 'too few' : 'too many'} cycles. Start with the height: that is the radius of the wheel.`;
        if (s.A !== 2) return s.A < 2 ? 'The cycles line up, but your wave is not tall enough. A bigger wheel lifts the point higher.' : 'The cycles line up, but your wave is too tall. Use a smaller wheel.';
        return s.B < 3 ? 'The height is right, but the dashed wave fits in more cycles. Make the wheel turn faster.' : 'The height is right, but the dashed wave has fewer cycles. Slow the wheel down.';
      },
      solution: { A: 2, B: 3 },
      explain: r`
        The dashed wave is $y = 2\sin(3x)$: a wheel of radius 2, turning 3 times as fast.
      `,
    },
    {
      id: 'amp-period',
      type: 'info',
      title: 'Amplitude and period',
      text: r`
        Your wave was $y = 2\sin(3x)$. The wheel of radius 2 lifts the point 2 high. Turning 3 times as fast fits 3 cycles into $2\pi$, so each is $\frac{2\pi}{3}$ long.

        :::key
        For $\;y = A\sin(Bx)\;$ with positive $A$ and $B$, the **amplitude** is $A$ and the **period** is $\dfrac{2\pi}{B}$.
        :::

        :::example
        $y = 6\sin(10x)$ has amplitude 6 and period $\dfrac{2\pi}{10} = \dfrac{\pi}{5}$.

        $y = 0.8\sin\!\left(\tfrac{1}{5}x\right)$ has amplitude 0.8 and period $2\pi \div \tfrac{1}{5} = 10\pi$. A $B$ smaller than 1 stretches the wave out.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 6.2832], y: [-2.6, 3.2], xStep: 1.0472, yStep: 1, tickLabels: false, height: 300,
        fns: [{ expr: '2*sin(3*x)', color: 'blue' }],
        segments: [
          { from: [0.5236, 0], to: [0.5236, 2], color: 'orange' },
          { from: [0.5236, 2.45], to: [2.618, 2.45], color: 'violet' },
        ],
        labels: [
          { x: 0.5236, y: 1, text: 'amplitude 2', anchor: 'start', dx: 8, dy: 5 },
          { x: 1.5708, y: 2.45, text: 'period 2π/3', anchor: 'middle', dy: -8 },
          { x: 6.2832, y: 0, text: '2π', anchor: 'middle', dy: 20 },
          { x: 0, y: 2, text: '2', anchor: 'end', dx: -8, dy: 5 },
          { x: 0, y: -2, text: '−2', anchor: 'end', dx: -8, dy: 5 },
        ],
        alt: 'The wave y equals 2 sine 3x from 0 to 2 pi. It rises to 2 and falls to minus 2, and three full cycles fit in. One marker shows the amplitude, 2, from the axis up to a peak. Another shows one period, 2 pi over 3, from one peak to the next.',
      },
    },
    {
      id: 'period',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const A = rng.pick([2, 3, 4, 5, 0.5, 1.5]);
        const speed = rng.pick(SPEEDS);
        const period = piTex(speed.n, speed.d);
        const bTex = speed.B >= 1 ? String(speed.B) : `\\tfrac{1}{${Math.round(1 / speed.B)}}`;
        return {
          text: r`A wave has the equation $\;y = ${num(A)}\sin\!\left(${speed.tex}\right)$, with $x$ in radians.`,
          template: r`
            Its amplitude is [[${num(A)}]].

            Its period is [[${fracText(speed.n, speed.d)}]] $\times\ \pi$.
          `,
          hints: [
            r`For $y = A\sin(Bx)$ the amplitude is $A$ and the period is $\dfrac{2\pi}{B}$.`,
            r`Here $B = ${bTex}$, so the period is $2\pi \div ${bTex}$.`,
          ],
          explain: r`The number in front is the amplitude: ${num(A)}. The number multiplying $x$ is $B = ${bTex}$, so the period is $\dfrac{2\pi}{B} = 2\pi \div ${bTex} = ${period}$.`,
        };
      },
    },
    {
      id: 'daylight',
      type: 'interact',
      title: 'A year of daylight',
      text: `
        The dots show the hours of daylight in London on the 21st of each month, from one December to the next.

        They rise and fall like a wave. But this wave swings around 12 hours, not around 0, and it does not start in the middle.

        **Fit the wave to the dots.** Its period is already set to 12 months.
      `,
      widget: {
        type: 'plot', x: [0, 12], y: [6, 18], xStep: 1, yStep: 2, xLabel: 'months after 21 December', yLabel: 'hours of daylight',
        params: {
          D: { min: 9, max: 15, step: 0.5, value: 10.5, label: 'midline $D$', color: 'blue' },
          A: { min: 1, max: 7, step: 0.5, value: 2, label: 'amplitude $A$', color: 'orange' },
          C: { min: 0, max: 6, step: 0.5, value: 0, label: 'shift $C$', color: 'green' },
        },
        fns: [{ expr: 'D + A*sin(2*pi*(x - C)/12)', color: 'blue' }],
        hlines: [{ y: 'D', dashed: true }],
        points: DAYLIGHT.map((hours, month) => ({ x: month, y: hours, color: 'orange' })),
        alt: 'Thirteen dots showing hours of daylight month by month: lowest, about 8 hours, in December, highest, about 16 and a half hours, in June. A wave with sliders for its midline, amplitude and shift is to be fitted to them.',
      },
      check: (s) => {
        if (daylightMiss(s) <= 0.4) return true;
        if (s.C !== 3) {
          return s.C < 3
            ? `Your wave reaches its peak at month ${num(s.C + 3)}. The longest day is at month 6, in June: slide the wave to the right.`
            : `Your wave reaches its peak at month ${num(s.C + 3)}. The longest day is at month 6, in June: slide the wave to the left.`;
        }
        if (s.D < 12) return `The middle line of your wave is at ${num(s.D)} hours. The dots swing between 7.8 and 16.6 hours, so their middle is higher than that.`;
        if (s.D > 12.5) return `The middle line of your wave is at ${num(s.D)} hours. The dots swing between 7.8 and 16.6 hours, so their middle is lower than that.`;
        return s.A < 4
          ? `Your wave swings only ${num(s.A)} hours above and below its middle line. The dots go further than that.`
          : `Your wave swings ${num(s.A)} hours above and below its middle line. That overshoots the dots.`;
      },
      solution: { D: 12, A: 4.5, C: 3 },
      hints: [
        'Start with the dashed middle line: put it halfway between the lowest dot and the highest dot.',
        'Then make the wave tall enough, and last of all slide it sideways until the peaks line up.',
      ],
      explain: r`
        A good fit is $\;y = 12 + 4.5\sin\!\left(\frac{2\pi}{12}(x - 3)\right)$.

        The wave swings about a **midline** near 12 hours, with an amplitude of about 4.5 hours, and it
        is **shifted** 3 months to the right: it climbs through the midline in March, not in December.

        The fit is close but not perfect. Real daylight does not follow an exact sine wave, though at
        London's latitude it stays within about 40 minutes of this one.
      `,
    },
    {
      id: 'general-form',
      type: 'info',
      title: 'Four dials',
      text: r`
        Every wave of this shape can be written

        $$ y = \orange{A}\sin\!\big(\violet{B}(x - \green{C})\big) + \blue{D} $$

        - $\blue{D}$ is the **midline**: the wave swings about the line $y = D$.
        - $\orange{A}$ is the **amplitude**: the peaks are $A$ above the midline, the troughs $A$ below.
        - $\violet{B}$ sets the **period**, which is $\frac{2\pi}{B}$. For a period of 12 months, $B = \frac{2\pi}{12}$.
        - $\green{C}$ is the **shift**: the wave climbs through its midline at $x = C$ instead of at $x = 0$.
      `,
    },
    {
      id: 'read-wave',
      type: 'info',
      title: 'Reading a wave',
      text: r`
        Three measurements are enough to write a wave down.

        :::example
        A buoy bobs between **5 m** and **1 m** above the sea bed. One full bob takes **10 s**, and at $t = 0$ it is on its way up through the middle.

        1. **Midline**: $D = \frac{5 + 1}{2} = 3$, halfway between the extremes.
        2. **Amplitude**: $A = \frac{5 - 1}{2} = 2$, half the distance between them.
        3. **Period** 10 s, so $B = \frac{2\pi}{10}$. It starts on the midline, going up: no shift.

        $h = 3 + 2\sin\!\left(\tfrac{2\pi}{10}\,t\right)$, the general form with the midline written first.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 20], y: [0, 6], xStep: 2.5, yStep: 1, xLabel: 't (seconds)', yLabel: 'height (m)', height: 300,
        fns: [{ expr: '3 + 2*sin(2*pi*x/10)', color: 'blue' }],
        hlines: [{ y: 3, dashed: true }],
        alt: 'A wave that swings between 1 metre and 5 metres about a dashed middle line at 3 metres. It starts on the middle line going up, and repeats every 10 seconds.',
      },
    },
    {
      id: 'from-extremes',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const story = rng.pick(SWINGS);
        const [mid, amp] = rng.pick(story.pairs);
        const hi = mid + amp;
        const lo = mid - amp;
        return {
          text: r`${story.text(num(hi), num(lo))} It is modelled by a sine wave $\;y = A\sin\!\big(B(x - C)\big) + D$.`,
          template: r`
            The midline is $D =$ [[${num(mid)}]]

            The amplitude is $A =$ [[${num(amp)}]]
          `,
          hints: [
            'The midline is halfway between the highest and the lowest value: add them and halve.',
            'The amplitude is the distance from the midline up to the highest value.',
          ],
          explain: r`The midline is halfway between the extremes: $D = \dfrac{${num(hi)} + ${num(lo)}}{2} = ${num(mid)}$. The amplitude is half the distance between them: $A = \dfrac{${num(hi)} - ${num(lo)}}{2} = ${num(amp)}$.`,
        };
      },
    },
    {
      id: 'read-formula',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [D, A] = rng.pick([[15, 5], [15, 10], [20, 5], [20, 10], [20, 15], [25, 10], [25, 15]]);
        const T = rng.pick([20, 40, 60, 80]);
        const inside = r`\left(\tfrac{2\pi}{${T}}\,t\right)`;
        return {
          text: r`The graph shows the height $h$ of a seat on a big wheel, in metres, $t$ seconds after it passes the level of the hub on its way up. **Which formula describes it?**`,
          figure: {
            type: 'plot', x: [0, 2 * T], y: [0, D + A + 5], xStep: T / 4, yStep: 5, xLabel: 't (seconds)', yLabel: 'height (m)',
            fns: [{ expr: `${D} + ${A}*sin(2*pi*x/${T})`, color: 'blue' }],
            hlines: [{ y: D, dashed: true }],
            alt: `A wave that swings between ${D - A} metres and ${D + A} metres about a middle line at ${D} metres, and repeats every ${T} seconds.`,
          },
          columns: 1,
          options: [
            { text: `$h = ${D} + ${A}\\sin${inside}$`, correct: true },
            { text: `$h = ${A} + ${D}\\sin${inside}$`, why: `That wave would swing about the line $h = ${A}$ and reach ${A + D} m. The graph swings about $h = ${D}$.` },
            { text: `$h = ${D} + ${2 * A}\\sin${inside}$`, why: `The amplitude is measured from the midline to a peak, not from a trough to a peak. From ${D} m up to ${D + A} m is ${A} m.` },
            { text: `$h = ${D} + ${A}\\sin(${T}\\,t)$`, why: `The number multiplying $t$ is not the period. It is $2\\pi$ divided by the period, and the period here is ${T} s.` },
          ],
          hints: ['Read three things off the graph: the middle line, how far the peaks are above it, and how long one full cycle takes.'],
          explain: r`The wave swings about $h = ${D}$: that is $D$. Its peaks are at ${D + A}, which is ${A} above the midline: that is $A$. One cycle takes ${T} s, so $B = \dfrac{2\pi}{${T}}$. It starts on the midline going up, so there is no shift.`,
        };
      },
    },
    {
      id: 'cos-shift',
      type: 'interact',
      stretch: true,
      title: 'The other coordinate',
      text: r`
        The point on the wheel also has an $x$-coordinate, its cosine. Plotted against the angle it gives
        the **dashed** curve, $y = \cos x$, which starts at 1 instead of 0.

        **Slide the solid sine wave sideways until it lies exactly on the dashed curve.**
      `,
      widget: {
        type: 'plot', x: [-3.1416, 9.4248], y: [-1.5, 1.5], xStep: 1.5708, yStep: 0.5, tickLabels: false,
        params: { k: { min: -2, max: 2, step: 1, value: 0, label: 'shift to the left, in quarter turns', color: 'blue' } },
        fns: [{ expr: 'cos(x)', color: 'gray', dashed: true }, { expr: 'sin(x + k*pi/2)', color: 'blue' }],
        labels: [
          { x: -3.1416, y: 0, text: '−π', anchor: 'middle', dy: 20 }, { x: 3.1416, y: 0, text: 'π', anchor: 'middle', dy: 20 },
          { x: 6.2832, y: 0, text: '2π', anchor: 'middle', dy: 20 }, { x: 0, y: 1, text: '1', anchor: 'end', dx: -8, dy: 5 }, { x: 0, y: -1, text: '−1', anchor: 'end', dx: -8, dy: 5 },
        ],
        alt: 'A dashed cosine wave, which starts at height 1, and a solid sine wave, which starts at height 0. A slider moves the sine wave sideways a quarter turn at a time.',
      },
      check: (s) => {
        if (s.k === 1) return true;
        if (s.k === 0) return 'That is still the plain sine wave. It passes through 0 where the dashed curve is at its peak.';
        if (s.k === -1) return 'Now the solid wave is the dashed one upside down: it dips where the other peaks. Shift it the other way.';
        return 'Half a turn is too far: that turns the sine wave upside down, and it still does not match.';
      },
      solution: { k: 1 },
      explain: r`
        A shift of one quarter turn to the left does it:
        $$ \cos x = \sin\!\left(x + \tfrac{\pi}{2}\right) $$
        The cosine wave is the sine wave, a quarter of a period ahead. On the wheel that is plain to
        see: the point's $x$-coordinate now is what its height will be a quarter turn later.
      `,
    },
    {
      id: 'sound-waves',
      type: 'info',
      title: 'Sound is a wave',
      text: r`
        Sound is a wave of air pressure, and a pure musical note is a sine wave. The pressure swings above and below the pressure of the still air, which is the wave's midline.

        - A **louder** note has bigger swings: a larger amplitude.
        - A **higher** note has more cycles each second. The number of cycles per second is the **frequency**, in hertz (Hz). More cycles in a second leaves less time for each: a shorter period.

        :::example
        The [blue]{.blue} note has a frequency of 200 Hz: 200 cycles every second. So one cycle lasts $\frac{1}{200}$ of a second. In milliseconds: $1000 \div 200 = 5$.

        The [orange]{.orange} note is louder and higher.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 10], y: [-3, 2.5], xStep: 1, yStep: 1, yLabel: 'pressure', height: 300,
        fns: [{ expr: 'sin(2*pi*x/5)', color: 'blue' }, { expr: '2*sin(2*pi*x/2.5)', color: 'orange' }],
        labels: [{ x: 10, y: -3, text: 'time (milliseconds)', anchor: 'end', dy: -8 }],
        alt: 'Two pressure waves over 10 milliseconds. The blue one swings between minus 1 and 1 and completes a cycle every 5 milliseconds. The orange one swings twice as far and completes a cycle every 2.5 milliseconds.',
      },
    },
    {
      id: 'sound',
      type: 'numeric',
      title: 'A wave you can hear',
      gen: (rng) => {
        const note = rng.pick(NOTES);
        const ms = 1000 / note.hz;
        return {
          text: `
            The **frequency** of a note is its number of cycles per second, measured in hertz (Hz).

            ${note.name} has a frequency of **${note.hz} Hz**.

            **How long does one cycle last, in milliseconds?** Round to 2 decimals. (1 second = 1000 milliseconds)
          `,
          answer: Math.round(ms * 100) / 100,
          tolerance: 0.006,
          unit: 'ms',
          wrong: [[note.hz / 1000, `That divides ${note.hz} by 1000. You want the time for one cycle: 1000 ms shared between ${note.hz} cycles.`]],
          hints: [`${note.hz} cycles fit into one second. So one cycle takes 1 ÷ ${note.hz} of a second.`],
          explain: r`There are ${note.hz} cycles in each second, so one cycle lasts $\dfrac{1}{${note.hz}}$ s $= \dfrac{1000}{${note.hz}}$ ms $\approx ${num(ms, 2)}$ ms. Period and frequency are each one divided by the other. A note one octave higher has twice the frequency, and half the period.`,
        };
      },
    },
    {
      id: 'sound-match',
      type: 'match',
      review: true,
      text: r`A pure note is a pressure wave $\;p = A\sin\!\big(B(t - C)\big) + D$, where $t$ is time. **Match each change in the sound to the change in the wave.**`,
      pairs: [
        ['The same note, played louder', r`A larger amplitude $A$`],
        ['A higher note', r`A shorter period (a larger $B$)`],
        ['The same note, started a moment later', r`A larger shift $C$`],
        ['The same note, on a day when the air pressure is higher', r`A higher midline $D$`],
      ],
      explain: 'Loudness is amplitude: bigger swings in pressure. Pitch is frequency: more cycles per second, so a shorter period. Starting later slides the whole wave along the time axis. And the wave swings about the pressure of the still air, which is its midline.',
    },
  ],
  recap: [
    r`Plot the height of a point walking round the unit circle against the angle turned, and you get the sine wave $y = \sin x$.`,
    r`In $y = A\sin(Bx)$ the amplitude is $A$ (the radius of the wheel) and the period is $\frac{2\pi}{B}$ (how long one turn takes).`,
    r`$y = A\sin\big(B(x - C)\big) + D$ shifts the wave $C$ to the right and lifts its midline to $D$.`,
    'Midline: halfway between the highest and lowest values. Amplitude: half the distance between them.',
  ],
  next: 'Next: back to triangles, this time without a right angle anywhere.',
};
