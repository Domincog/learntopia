// Physics II: Orbits & Waves · Lesson 3 · Swings and Springs
import { r, num } from '../../../kit.js';
import { G } from '../helpers.js';

// A 1 m pendulum released at 10°: period 1.99 s (2π√(L/g) with g = 10 m/s²). At 10° every length on the
// sliders below swings with the period the small-swing formula gives, to the two decimals shown.
const PEND = { type: 'pendulum-lab', length: 1, mass: 1, angle: 10 };
// 0.4 kg on a 10 N/m spring: period 2π√(0.4/10) = 1.26 s.
const SPRING = { type: 'pendulum-lab', mode: 'spring', mass: 0.4, stiffness: 10, pull: 4 };

const round2 = (v) => Math.round(v * 100) / 100;

export default {
  id: 'oscillations',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three ideas',
      text: `
        Three children want their swing to take **longer** for each trip
        there and back.

        - Ada swings **higher**, through a bigger arc.
        - Ben puts on a **heavy** backpack.
        - Cleo makes the ropes **longer**.

        Whose idea works?
      `,
      shuffle: false,
      options: [
        { text: 'Ada: swing higher' },
        { text: 'Ben: add weight' },
        { text: 'Cleo: longer ropes', correct: true },
        { text: 'All three' },
      ],
      explain: 'Only Cleo\'s makes a real difference. A swing is a pendulum, and the next two screens let you test all three ideas yourself.',
    },
    {
      id: 'pendulum-test',
      type: 'interact',
      graded: false,
      title: "Ada's and Ben's ideas",
      text: `
        This pendulum is 1 m long. **Release it** and read its **period**: the
        time for one full swing, there and back.

        Then change the **mass** and release it again. Then change the
        **release angle**.
      `,
      widget: { ...PEND, massRange: [0.5, 2, 0.5], angleRange: [5, 40, 5], alt: 'A pendulum 1 metre long beside a graph of its position against time. Sliders set the mass of the bob and the release angle.' },
      check: (s) => {
        const masses = new Set(s.history.map((run) => run.mass));
        const angles = new Set(s.history.map((run) => run.angle));
        if (masses.size >= 2 && angles.size >= 2) return true;
        if (!s.history.length) return 'Press **Release** to time the first swing.';
        if (masses.size < 2) return 'Now change the mass and release it again. Does the period change?';
        return 'Now change the release angle and release it again.';
      },
      solution: { mass: 2, angle: 30, history: [{ mass: 1, angle: 10 }, { mass: 2, angle: 10 }, { mass: 2, angle: 30 }] },
      explain: `
        **Mass:** no effect at all. With 0.5 kg or with 2 kg, the period is
        1.99 s. Heavy and light things fall together, and a pendulum is a
        kind of falling.

        **Angle:** hardly any. From 5° to 20° the period only creeps from
        1.99 s to 2.00 s, and even at 40° it is 2.05 s.
      `,
    },
    {
      id: 'length-test',
      type: 'interact',
      attempts: 6,
      title: "Cleo's idea",
      text: `
        Now the string. At **0.2 m** this pendulum takes **0.89 s** for each
        swing.

        **Find the length that makes each swing take twice as long: 1.78 s.**
      `,
      widget: { ...PEND, length: 0.2, lengthRange: [0.2, 1, 0.2], alt: 'A pendulum beside a graph of its position against time. A slider sets its length.' },
      check: (s) => {
        if (!s.ran) return 'Press **Release** to time this length.';
        if (s.length === 0.8) return true;
        const T = num(s.period, 2);
        if (s.length === 0.4) return `Twice the length gives ${T} s. Longer than 0.89 s, but well short of double.`;
        return s.length < 0.8
          ? `At ${num(s.length)} m the period is ${T} s. It has to be longer still.`
          : `At ${num(s.length)} m the period is ${T} s: more than 1.78 s. Shorten it.`;
      },
      solution: { length: 0.8 },
      hints: ['Doubling the length is not enough. Keep going.'],
      explain: `
        It takes **four times** the length, 0.8 m, to double the period.

        | Length (m) | 0.2 | 0.4 | 0.6 | 0.8 | 1 |
        |------|:---:|:---:|:---:|:---:|:---:|
        | Period (s) | 0.89 | 1.26 | 1.54 | 1.78 | 1.99 |

        Doubling the length was not enough.
      `,
    },
    {
      id: 'teach-root',
      type: 'info',
      title: 'What sets the period',
      text: r`
        Three experiments, one answer.

        - **Mass:** no effect. Heavy and light bobs swing together.
        - **Angle:** hardly any, as long as the swing is small.
        - **Length:** the one thing that counts. Four times the length gives
          twice the period, and a quarter of the length gives half. The
          period goes with the **square root** of the length.

        :::example
        A pendulum has a period of 1.5 s. Its string is made **sixteen**
        times as long.

        1. $\sqrt{16} = 4$, so the period is 4 times as long.
        2. $1.5 \times 4 = 6$ s.

        With a heavier bob on the old string, it would still be 1.5 s.
        :::
      `,
      figure: {
        type: 'plot', height: 280, x: [0, 1], y: [0, 2.4], xStep: 0.2, yStep: 0.4, xLabel: 'length (m)', yLabel: 'period (s)',
        fns: [{ expr: '2*pi*sqrt(x/10)', color: 'blue' }],
        points: [{ id: 'A', x: 0.2, on: 0, color: 'orange' }, { id: 'B', x: 0.8, on: 0, color: 'orange' }],
        alt: 'A graph of the period of a pendulum against its length. The curve rises steeply at first and then flattens. Two points are marked: 0.89 seconds at 0.2 metres, and 1.78 seconds, twice as long, at 0.8 metres.',
      },
    },
    {
      id: 'pendulum-ratio',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const T = rng.pick([1.2, 1.6, 2, 2.4, 3]);
        const c = rng.pick([
          { kind: 'length', mult: 2, say: 'Its string is replaced by one **four times as long**.', slip: 4, why: 'The period goes with the square root of the length: four times the length only doubles it.' },
          { kind: 'length', mult: 3, say: 'Its string is replaced by one **nine times as long**.', slip: 9, why: 'The period goes with the square root of the length: nine times the length triples it.' },
          { kind: 'length', mult: 0.5, say: 'Its string is shortened to **a quarter** of its length.', slip: 0.25, why: 'The period goes with the square root of the length: a quarter of the length halves it.' },
          { kind: 'mass', mult: 1, say: 'Its bob is swapped for one **three times as heavy**, on the same string.', slip: 3, why: 'The mass of the bob makes no difference to the period.' },
          { kind: 'mass', mult: 1, say: 'Its bob is swapped for one **half as heavy**, on the same string.', slip: 0.5, why: 'The mass of the bob makes no difference to the period.' },
        ]);
        const answer = round2(T * c.mult);
        const wrong = [[round2(T * c.slip), c.why]];
        if (c.kind === 'length') wrong.push([T, 'The length is the one thing that does change the period.']);
        return {
          text: `A pendulum takes **${T} s** for each full swing. ${c.say} It still swings through a small angle.\n\n**What is its period now?**`,
          answer,
          unit: 's',
          wrong,
          hints: c.kind === 'length'
            ? [r`In $T = 2\pi\sqrt{\frac{L}{g}}$ the length sits under a square root.`, `The square root of ${c.slip === 0.25 ? 'a quarter is a half' : `${c.slip} is ${c.mult}`}.`]
            : ['Look at the formula for the period of a pendulum. Which quantities are in it?'],
          explain: c.kind === 'length'
            ? r`The period goes with the square root of the length, and $\sqrt{${c.slip === 0.25 ? r`\tfrac{1}{4}` : c.slip}} = ${c.slip === 0.25 ? r`\tfrac{1}{2}` : c.mult}$. So the new period is $${T} \times ${c.mult} = ${num(answer)}$ s.`
            : `The period of a pendulum does not depend on the mass of its bob at all, so it is still ${T} s.`,
        };
      },
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The pendulum formula',
      text: r`
        For a pendulum of length $L$ (in metres) the period $T$, in seconds,
        is

        $$ T = 2\pi\sqrt{\frac{L}{g}} $$

        No mass in it, and no angle. With $L = 1$ m and $g = 10 \text{ m/s}^2$
        it gives $2\pi\sqrt{0.1} \approx 1.99$ s, as you measured. Gravity is
        under the root too: where $g$ is weaker, the period is longer.

        :::example
        A rope 4.9 m long. Take $\pi = 3.14$.

        1. The fraction: $\frac{4.9}{10} = 0.49$.
        2. Its square root: 0.7, because $0.7 \times 0.7 = 0.49$.
        3. $T = 2 \times 3.14 \times 0.7 \approx 4.40$ s.
        :::

        The formula is for **small swings**. Wide ones take a little longer,
        as you saw.
      `,
    },
    {
      id: 'formula-use',
      type: 'numeric',
      gen: (rng) => {
        const [L, scene] = rng.pick([
          [0.4, 'A lamp hangs from the ceiling on a cord **0.4 m** long'],
          [0.9, 'A bird feeder hangs from a branch on a wire **0.9 m** long'],
          [1.6, 'A child sits on a rope swing **1.6 m** long'],
          [2.5, 'A playground swing has chains **2.5 m** long'],
          [3.6, 'A tyre hangs from a tree on **3.6 m** of rope'],
          [10, 'A crane holds its load on **10 m** of cable'],
        ]);
        const root = Math.sqrt(L / G);
        const T = round2(2 * 3.14 * root);
        const wrong = [[round2(root), r`That is $\sqrt{\frac{L}{g}}$. It still has to be multiplied by $2\pi$.`]];
        if (L !== 10) wrong.push([round2((2 * 3.14 * L) / G), r`Take the square root of $\frac{L}{g}$ before multiplying by $2\pi$.`]);
        return {
          text: r`
            ${scene}, and swings gently.

            Use $T = 2\pi\sqrt{\frac{L}{g}}$ with $g = 10 \text{ m/s}^2$ to find the
            period. Take $\pi = 3.14$ and round to two decimal places.
          `,
          answer: T,
          tolerance: 0.011,
          unit: 's',
          wrong,
          hints: [
            r`First the fraction: $\frac{L}{g} = \frac{${L}}{10} = ${num(L / G)}$. Its square root is ${num(root)}.`,
            r`Then $T = 2 \times 3.14 \times ${num(root)}$.`,
          ],
          explain: r`$\sqrt{\frac{${L}}{10}} = \sqrt{${num(L / G)}} = ${num(root)}$, so $T = 2 \times 3.14 \times ${num(root)} \approx ${num(T)}$ s.`,
        };
      },
    },
    {
      id: 'spring-test',
      type: 'interact',
      attempts: 8,
      title: 'A mass on a spring',
      text: `
        Another back-and-forth: a mass bobbing on a spring. A **stiffer**
        spring pulls back with more newtons for each metre of stretch.

        With 0.4 kg on a 10 N/m spring, the period is **1.26 s**.
        **Find a setting that halves it: 0.63 s.** Try every slider.
      `,
      widget: { ...SPRING, massRange: [0.1, 0.4, 0.1], stiffnessRange: [10, 40, 10], pullRange: [2, 8, 2], alt: 'A mass hanging on a spring beside a graph of its position against time. Sliders set the mass, the stiffness of the spring and how far the mass is pulled down before release.' },
      check: (s) => {
        if (!s.ran) return 'Press **Release** to time this setting.';
        const T = num(s.period, 2);
        if (Math.abs(s.period - 0.6283) < 0.002) return true;
        if (s.mass === 0.4 && s.stiffness === 10) {
          return s.pull !== 4
            ? `${s.pull > 4 ? 'Pulled down further, it has further to go but also moves faster' : 'Pulled down less far, it has less far to go but also moves more slowly'}: the period is still ${T} s. Change something else.`
            : 'That is the starting point: 1.26 s. Change a slider, then release it again.';
        }
        return s.period > 0.6283
          ? `That gives ${T} s: not quick enough yet. Less mass or a stiffer spring speeds it up.`
          : `That gives ${T} s: too quick now.`;
      },
      solution: { mass: 0.4, stiffness: 40 },
      hints: [
        'How far you pull it down changes nothing. That leaves the mass and the spring.',
        'Halving the period takes a big change: think of the pendulum, where it took four times the length to double it.',
      ],
      explain: `
        The two simplest ways: a spring **four times as stiff** (40 N/m), or
        **a quarter of the mass** (0.1 kg). (Half the mass on a spring twice
        as stiff works as well.)

        How far you pulled it down made no difference at all.
      `,
    },
    {
      id: 'spring-rule',
      type: 'info',
      title: "The spring's rhythm",
      text: r`
        For a mass $m$ (in kg) on a spring of stiffness $k$ (in newtons per
        metre):

        $$ T = 2\pi\sqrt{\frac{m}{k}} $$

        Check: 0.4 kg on 10 N/m gives $2\pi\sqrt{0.04} = 2\pi \times 0.2 \approx 1.26$ s.

        - More mass is harder to accelerate: a **longer** period.
        - A stiffer spring pulls back harder: a **shorter** period.
        - The **amplitude**, the size of the swing, is in neither formula. A
          bigger swing has further to go but moves faster, and the two
          cancel. That steadiness is why pendulums and springs were used to
          run clocks.

        :::example
        A mass bobs with a period of 0.9 s. On a spring **nine** times as
        stiff: $\sqrt{9} = 3$, and stiffer means quicker, so
        $0.9 \div 3 = 0.3$ s. With sixteen times the mass instead:
        $0.9 \times \sqrt{16} = 3.6$ s.
        :::
      `,
    },
    {
      id: 'spring-ratio',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { mult: 2, ts: [0.6, 0.8, 1.2, 1.8], say: 'The mass is replaced by one **four times as heavy**, on the same spring.', slip: 4, why: 'The period goes with the square root of the mass: four times the mass only doubles it.', because: r`$\sqrt{4} = 2$, and more mass means a longer period` },
          { mult: 3, ts: [0.6, 0.8, 1.2], say: 'The mass is replaced by one **nine times as heavy**, on the same spring.', slip: 9, why: 'The period goes with the square root of the mass: nine times the mass triples it.', because: r`$\sqrt{9} = 3$, and more mass means a longer period` },
          { mult: 0.5, ts: [0.6, 0.8, 1.2, 1.8, 2.4], say: 'The spring is replaced by one **four times as stiff**, with the same mass.', slip: 2, why: 'A stiffer spring pulls back harder, so the motion is quicker: the period gets shorter, not longer.', because: r`$\sqrt{4} = 2$, and a stiffer spring means a shorter period` },
          { mult: 1, ts: [0.6, 0.8, 1.2, 1.8, 2.4], say: 'It is stopped, pulled down **twice as far** as before, and let go again.', slip: 2, why: 'A bigger bounce has further to go but moves faster. For a spring the two effects cancel exactly.', because: 'a bigger bounce has further to go, but it moves faster' },
        ]);
        const T = rng.pick(c.ts);
        const answer = round2(T * c.mult);
        const wrong = [[round2(T * c.slip), c.why]];
        if (c.mult === 0.5) wrong.push([round2(T / 4), 'The period goes with the square root: four times the stiffness halves it.']);
        if (c.mult !== 1) wrong.push([T, 'Mass and stiffness are exactly the two things that set the period.']);
        return {
          text: `A mass bobs on a spring with a period of **${T} s**. ${c.say}\n\n**What is the period now?**`,
          answer,
          unit: 's',
          wrong,
          hints: [r`$T = 2\pi\sqrt{\frac{m}{k}}$: what does the change do to the fraction under the square root?`],
          explain: c.mult === 1
            ? `The period of a mass on a spring does not depend on the amplitude: ${c.because}. It is still ${T} s.`
            : r`In $T = 2\pi\sqrt{\frac{m}{k}}$, ${c.because}. The new period is $${T} \times ${c.mult} = ${num(answer)}$ s.`,
        };
      },
    },
    {
      id: 'energy-swap',
      type: 'choice',
      title: 'Where the energy goes',
      text: `
        Back to the pendulum, released from 30°. The bars show its
        [kinetic]{.green} and [potential]{.blue} energy, as in
        *Energy Never Disappears*.

        **Drag the time slider** and watch them. Where is the kinetic energy
        greatest?
      `,
      figure: { ...PEND, angle: 30, bars: true, scrub: true, window: 4, alt: 'A pendulum with bars for its kinetic, potential and total energy. A time slider moves it through its swing.' },
      options: [
        { text: 'At the lowest point, in the middle of the swing', correct: true },
        { text: 'At the two ends of the swing', why: 'At each end the bob stops for an instant: no speed, so no kinetic energy. It is at its highest there, so the energy is all potential.' },
        { text: 'Half-way between the middle and an end', why: 'There it has some of each. The kinetic bar is longest where the bob is lowest.' },
        { text: 'It is the same everywhere', why: 'That is the *total*. The kinetic bar grows and shrinks twice in every swing.' },
      ],
      explain: `
        At the ends the bob is highest and for an instant at rest: all
        **potential**. Through the middle it is lowest and fastest: all
        **kinetic**. The total never changes, just as on the smooth track.

        An oscillation is energy passed back and forth between two stores.
        For a mass on a spring, they are the moving mass and the stretched
        spring.
      `,
    },
    {
      id: 'teach-graph',
      type: 'info',
      title: 'Reading the wave',
      text: r`
        The graph beside the pendulum was a position–time graph, as in
        *Motion & Forces*. Anything that swings draws a smooth wave.

        - **Period** $T$: the time from one peak to the **next peak**.
        - **Frequency** $f$: the number of swings each second,
          $f = \frac{1}{T}$, measured in **hertz** (Hz). A period of 0.5 s
          means 2 swings a second: 2 Hz.

        :::example
        Here the peaks are at 0 s and 0.2 s, so $T = 0.2$ s. Then
        $f = \frac{1}{0.2} = 5$ Hz: five swings every second.
        :::

        The height of a peak, here 3 cm, is the amplitude.
      `,
      figure: {
        type: 'plot', height: 280, x: [0, 0.6], y: [-6, 6], xStep: 0.1, yStep: 2, xLabel: 'time (s)', yLabel: 'position (cm)',
        fns: [{ expr: '3*cos(2*pi*x/0.2)', color: 'blue' }],
        vlines: [{ x: 0.2, dashed: true }, { x: 0.4, dashed: true }],
        labels: [{ x: 0.1, y: -4.8, text: 'one period' }],
        alt: 'A smooth wave-shaped graph of position against time. It starts at a peak of 3 centimetres at time zero; the next peaks, marked with dashed lines, come 0.2 s and 0.4 s after the start.',
      },
    },
    {
      id: 'read-graph',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const what = rng.pick(['pendulum', 'mass on a spring', 'child on a swing', 'buoy bobbing on a lake']);
        const ask = rng.bool(0.6) ? 'period' : 'frequency';
        const [T, xStep, xMax] = rng.pick(ask === 'period'
          ? [[0.4, 0.2, 1.2], [0.8, 0.2, 2], [1, 0.5, 3], [1.5, 0.5, 4], [2, 1, 6], [2.5, 0.5, 6], [4, 1, 10]]
          : [[0.4, 0.2, 1.2], [0.5, 0.25, 1.5], [2, 1, 6], [2.5, 0.5, 6], [4, 1, 10]]);
        const A = rng.pick([2, 3, 4, 5].filter((v) => v !== T && v !== T / 2));   // so that the amplitude cannot be mistaken for a time on the other axis
        const f = 1 / T;
        return {
          text: ask === 'period'
            ? `This is the position–time graph of a ${what}: a smooth, repeating wave.\n\n**What is the period of the motion?**`
            : `This is the position–time graph of a ${what}: a smooth, repeating wave.\n\n**What is its frequency?** (Find the period first.)`,
          figure: {
            type: 'plot', height: 300, x: [0, xMax], y: [-6, 6], xStep, yStep: 2, xLabel: 'time (s)', yLabel: 'position (cm)',
            fns: [{ expr: `${A}*cos(2*pi*x/${T})`, color: 'blue' }],
            alt: `A smooth wave-shaped graph of position against time. It starts at a peak of ${A} centimetres at time zero; the next peaks come ${num(T)} s and ${num(2 * T)} s after the start.`,
          },
          answer: ask === 'period' ? T : f,
          unit: ask === 'period' ? 's' : 'Hz',
          wrong: ask === 'period'
            ? [[T / 2, 'That is the time from a peak to the next dip: only half a swing. A full period runs from one peak to the next peak.'], [A, 'That is the amplitude, read off the upright axis. The period is a time: read it along the bottom.']]
            : [[T, 'That is the period, in seconds. The frequency is how many of those fit into one second.'], [2 / T, 'Measure a full period, from one peak to the next peak, not from a peak to a dip.']],
          hints: ask === 'period'
            ? ['Find two neighbouring peaks and read off their times.']
            : ['Find two neighbouring peaks and read off the time between them: that is the period.', r`Then $f = \frac{1}{T}$.`],
          explain: ask === 'period'
            ? `One peak is at 0 s and the next at ${num(T)} s, so one full swing takes ${num(T)} s.`
            : r`The peaks are ${num(T)} s apart, so $T = ${num(T)}$ s and $f = \frac{1}{${num(T)}} = ${num(f)}$ Hz.`,
        };
      },
    },
    {
      id: 'other-world',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const T = rng.pick([1.2, 2, 2.4, 3]);
        const w = rng.pick([
          { place: 'the Moon, where $g$ is $1.6 \\text{ m/s}^2$', gNew: 1.6, mult: 2.5, weaker: true },
          { place: 'a small imaginary planet where $g$ is $2.5 \\text{ m/s}^2$', gNew: 2.5, mult: 2, weaker: true },
          { place: 'a huge imaginary planet where $g$ is $40 \\text{ m/s}^2$', gNew: 40, mult: 0.5, weaker: false },
        ]);
        const ratio = w.weaker ? G / w.gNew : w.gNew / G;
        const answer = round2(T * w.mult);
        return {
          text: `
            On Earth, a pendulum takes **${T} s** for each small swing. It is
            taken to ${w.place}. (On Earth, take $g = 10 \\text{ m/s}^2$.)

            **What is its period there?** For comparison: gravity 9 times
            weaker would make the period $\\sqrt{9} = 3$ times longer.
          `,
          answer,
          unit: 's',
          wrong: [
            [round2(w.weaker ? T * ratio : T / ratio), `Gravity is ${num(ratio)} times ${w.weaker ? 'weaker' : 'stronger'}, but the period goes with the square root of that.`],
            [T, 'Gravity is what pulls the bob back towards the middle. Change it, and the timing changes.'],
            [round2(T / w.mult), w.weaker ? 'Weaker gravity pulls the bob back more gently, so each swing takes longer, not less long.' : 'Stronger gravity pulls the bob back harder, so each swing takes less long, not longer.'],
          ],
          hints: [
            r`In $T = 2\pi\sqrt{\frac{L}{g}}$ only $g$ changes.`,
            `Gravity there is ${num(ratio)} times ${w.weaker ? 'weaker' : 'stronger'}. The square root of ${num(ratio)} is ${num(Math.sqrt(ratio))}.`,
          ],
          explain: r`Gravity there is $\frac{${w.weaker ? G : w.gNew}}{${w.weaker ? w.gNew : G}} = ${num(ratio)}$ times ${w.weaker ? 'weaker' : 'stronger'}, so $\frac{L}{g}$ is ${num(ratio)} times ${w.weaker ? 'bigger' : 'smaller'} and its square root ${num(Math.sqrt(ratio))} times ${w.weaker ? 'bigger' : 'smaller'}. The period is $${T} ${w.weaker ? r`\times` : r`\div`} ${num(Math.sqrt(ratio))} = ${num(answer)}$ s.`,
        };
      },
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'What does each change do to the **period**? (All swings are small.)',
      buckets: ['Longer period', 'Shorter period', 'No change'],
      items: [
        { text: 'A pendulum: longer string', bucket: 0 },
        { text: 'A spring: heavier mass', bucket: 0, why: 'More mass is harder to accelerate, so each bounce takes longer.' },
        { text: 'A pendulum: taken to the Moon', bucket: 0, why: 'Weaker gravity pulls the bob back more gently, so each swing takes longer.' },
        { text: 'A spring: stiffer spring', bucket: 1, why: 'A stiffer spring pulls back harder, so each bounce is over sooner.' },
        { text: 'A pendulum: shorter string', bucket: 1 },
        { text: 'A pendulum: heavier bob', bucket: 2, why: 'The mass of the bob does not appear in the pendulum formula. Heavy and light bobs swing together.' },
        { text: 'A spring: pulled further before release', bucket: 2, why: 'Further to go, but faster on the way: the period of a spring does not depend on the amplitude.' },
      ],
      explain: r`Pendulum: $T = 2\pi\sqrt{\frac{L}{g}}$, so only length and gravity count. Spring: $T = 2\pi\sqrt{\frac{m}{k}}$, so only mass and stiffness count. The size of the swing is in neither.`,
    },
  ],
  recap: [
    r`The **period** $T$ is the time for one full swing. The **frequency** $f = \frac{1}{T}$ counts swings per second, in hertz.`,
    r`Pendulum, small swings: $T = 2\pi\sqrt{\frac{L}{g}}$. Four times the length, twice the period. The mass does not matter.`,
    r`Mass on a spring: $T = 2\pi\sqrt{\frac{m}{k}}$. More mass is slower, a stiffer spring is quicker.`,
    'The amplitude hardly matters. Energy swaps between kinetic and potential, and the position–time graph is a smooth wave.',
  ],
  next: 'Next: join a row of oscillators together, and the motion starts to travel.',
};
