// Physics: Motion & Forces · Lesson 2 · Speeding Up
import { r, near } from '../../../kit.js';
import { G } from '../helpers.js';

const RAMP = { type: 'ramp-roll', scene: 'ramp', a: 2, duration: 4, length: 17 };

export default {
  id: 'acceleration',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'Where will it be?',
      text: `
        A ball is let go at the top of a long ramp. One second later it has
        rolled **1 m**.

        **Where will it be after 2, 3 and 4 seconds?** Drag the three flags to
        your guesses. Then press Check to let the ball roll.
      `,
      widget: { ...RAMP, given: [1], predict: [2, 3, 4], guesses: [6.5, 11.5, 14], button: false },
      check: (s) => near(s.guesses[0], 4, 0.5) && near(s.guesses[1], 9, 1) && near(s.guesses[2], 16, 1),
      solution: { ran: true },
      explain: `
        The ball does **not** cover 1 m every second. After 4 s it is already
        16 m down the ramp. The next screen shows why.
      `,
    },
    {
      id: 'teach-faster',
      type: 'info',
      title: 'Faster every second',
      text: `
        The ball keeps getting faster, so each second it covers more ground
        than in the second before: 1 m, then 3 m, then 5 m, then 7 m. Counted from the top, that puts it at 1, 4, 9 and 16 m.

        Galileo found this pattern about four hundred years ago, rolling a
        bronze ball down a grooved ramp.

        Distances that grow unevenly are awkward to work with. The ball's
        **speed** turns out to be much simpler.
      `,
      figure: { ...RAMP, static: true, alt: 'The ball at the bottom of the ramp. Markers show where it was after 1, 2, 3 and 4 seconds: at 1, 4, 9 and 16 metres. The gaps between the markers grow: 1, 3, 5 and 7 metres.' },
    },
    {
      id: 'gain',
      type: 'numeric',
      text: `
        A speed gun clocks the ball each time it passes a marker:

        | Time (s) | 0 | 1 | 2 | 3 | 4 |
        |------|:---:|:---:|:---:|:---:|:---:|
        | Speed (m/s) | 0 | 2 | 4 | 6 | 8 |

        **How much speed does the ball gain every second?**
      `,
      figure: { ...RAMP, static: true, alt: 'The ball at the bottom of the ramp. Markers show where it was after 1, 2, 3 and 4 seconds: at 1, 4, 9 and 16 metres.' },
      answer: 2,
      unit: 'm/s',
      wrong: [[8, 'That is the speed it has *reached* after 4 s. How much is added in each single second?']],
      hints: ['Compare neighbours in the table: from 2 m/s to 4 m/s, from 4 m/s to 6 m/s…'],
      explain: 'Every second adds another 2 m/s: 0, 2, 4, 6, 8. The distances grow unevenly, but the speed grows in perfectly even steps.',
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Acceleration',
      text: r`
        That steady gain has a name. **Acceleration** is how fast the velocity
        changes:

        $$ a = \frac{\text{change in velocity}}{\text{time taken}} $$

        The ball gains 2 m/s every second, so its acceleration is 2 metres per
        second, *per second*: $2 \text{ m/s}^2$. Plot its velocity against
        time and a steady acceleration draws a straight line.

        :::example
        A bus speeds up from 5 m/s to 20 m/s in 6 s.

        - Change in velocity: $20 - 5 = 15$ m/s
        - Time taken: 6 s

        So $a = \frac{15}{6} = 2.5 \text{ m/s}^2$.
        :::
      `,
      figure: {
        type: 'ramp-roll', scene: 'none', static: true, a: 2, v0: 0, duration: 4, vMax: 10,
        points: [{ t: 1, v: 2 }, { t: 2, v: 4 }, { t: 3, v: 6 }, { t: 4, v: 8, label: '8 m/s after 4 s', above: true }],
        alt: 'A velocity–time graph: a straight line from 0 up to 8 metres per second at 4 seconds, rising 2 metres per second every second.',
      },
    },
    {
      id: 'speed-up',
      type: 'interact',
      title: 'Hit the target',
      text: `
        This car starts from rest.

        **Choose the acceleration that takes it to 12 m/s in exactly 4 s.**
        Press Go to test each choice.
      `,
      widget: { type: 'ramp-roll', scene: 'road', v0: 0, a: 1, aRange: [0, 5, 1], duration: 4, length: 60, graph: true, vMax: 20, target: { t: 4, v: 12 } },
      check: (s) => {
        if (!s.ran) return 'Press **Go** to test your choice.';
        if (s.vEnd === 12) return true;
        if (s.a === 0) return 'With zero acceleration the velocity never changes. The car stays at rest.';
        return s.vEnd < 12
          ? `After 4 s the car is only doing ${s.vEnd} m/s. It has to gain speed faster.`
          : `After 4 s the car is doing ${s.vEnd} m/s: too fast.`;
      },
      solution: { a: 3 },
      hints: ['The car must gain 12 m/s, and it has 4 seconds to do it. How much is that per second?'],
      explain: r`Gaining 12 m/s in 4 s means gaining $\frac{12}{4} = 3$ m/s every second: $a = 3 \text{ m/s}^2$. The graph is a straight line with slope 3.`,
    },
    {
      id: 'brake',
      type: 'interact',
      title: 'Now stop it',
      text: `
        This time the car is already doing **12 m/s**.

        **Choose the acceleration that brings it to rest in exactly 4 s.**
      `,
      widget: { type: 'ramp-roll', scene: 'road', v0: 12, a: 0, aRange: [-5, 5, 1], duration: 4, length: 60, graph: true, vMax: 20, target: { t: 4, v: 0 } },
      check: (s) => {
        if (!s.ran) return 'Press **Go** to test your choice.';
        if (s.a === -3) return true;
        if (s.a > 0) return 'The car got faster. To slow it down, the acceleration must act against the motion: make it negative.';
        if (s.a === 0) return 'With zero acceleration the velocity does not change at all. The car is still doing 12 m/s.';
        if (s.a > -3) return `Too gentle: after 4 s the car is still doing ${s.vEnd} m/s.`;
        return `Too hard: the car is already at rest after ${s.stopTime} s.`;
      },
      solution: { a: -3 },
      hints: [
        'Slowing down means the velocity gets *smaller* each second. Which sign does that need?',
        'The car must lose 12 m/s in 4 s.',
      ],
      explain: r`
        Losing 12 m/s in 4 s means the velocity changes by $-3$ m/s every second:
        $a = -3 \text{ m/s}^2$.

        Slowing down is acceleration too, with the opposite sign.
      `,
    },
    {
      id: 'teach-vt-graph',
      type: 'info',
      title: 'Reading a velocity–time graph',
      text: r`
        On this kind of graph the height is the **velocity**, and the slope is
        the **acceleration**.

        - Line **climbing**: speeding up. Positive acceleration.
        - Line **falling**: slowing down. Negative acceleration.
        - Line **flat**: the velocity is not changing. Zero acceleration and a
          steady speed. It is at rest only if the line sits at 0.

        :::example
        The line runs from (0 s, 18 m/s) to (6 s, 6 m/s).

        - Change in velocity: $6 - 18 = -12$ m/s
        - Time taken: 6 s

        So $a = \frac{-12}{6} = -2 \text{ m/s}^2$.
        :::
      `,
      figure: {
        type: 'ramp-roll', scene: 'none', static: true, a: -2, v0: 18, duration: 6, length: 80, vMax: 20,
        points: [{ t: 0, v: 18, label: '(0 s, 18 m/s)', above: true }, { t: 6, v: 6, label: '(6 s, 6 m/s)', above: false }],
        alt: 'A velocity–time graph: a straight line falling from 18 metres per second at 0 seconds to 6 metres per second at 6 seconds.',
      },
    },
    {
      id: 'read-vt',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const slowing = rng.bool(0.5);
        const mag = rng.int(1, 4);
        const T = rng.pick([3, 4, 5]);
        const low = rng.pick([0, 2, 4]);
        const v0 = slowing ? low + mag * T : low;
        const v1 = slowing ? low : low + mag * T;
        const a = slowing ? -mag : mag;
        const vMax = Math.max(v0, v1) <= 10 ? 10 : Math.max(v0, v1) <= 16 ? 16 : 24;
        return {
          text: `This is the velocity–time graph of a ${rng.pick(['bus', 'scooter', 'lorry', 'motorbike'])} on a straight road. **What is its acceleration?**`,
          figure: {
            type: 'ramp-roll', scene: 'none', static: true, a, v0, duration: T, vMax,
            points: [{ t: 0, v: v0, label: `(0 s, ${v0} m/s)`, above: !slowing ? v0 > vMax * 0.3 : false }, { t: T, v: v1, label: `(${T} s, ${v1} m/s)`, above: slowing ? true : undefined }],
            alt: `A straight line on a velocity–time graph from ${v0} metres per second at 0 seconds to ${v1} metres per second at ${T} seconds.`,
          },
          answer: a,
          unit: 'm/s²',
          wrong: [
            [-a, slowing ? 'The size is right, but the velocity is *falling*. That makes the acceleration negative.' : 'The velocity is rising, so the acceleration is positive.'],
            [v1 - v0, 'That is the whole change in velocity. Divide it by the time it took.'],
            [v1 / T, 'Use the *change* in velocity, not just the final velocity.'],
          ],
          hints: [
            'Acceleration is the slope: change in velocity ÷ time taken.',
            r`The velocity changes by $${v1} - ${v0} = ${v1 - v0}$ m/s in ${T} s.`,
          ],
          explain: r`The velocity changes by $${v1} - ${v0} = ${v1 - v0}$ m/s in ${T} s, so $a = \frac{${v1 - v0}}{${T}} = ${a} \text{ m/s}^2$.${slowing ? ' Negative: it is slowing down.' : ''}`,
        };
      },
    },
    {
      id: 'flat-line',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const v = rng.pick([4, 6, 8, 12]);
        return {
          text: 'Careful, this is a **velocity**–time graph. What is the object doing?',
          figure: {
            type: 'ramp-roll', scene: 'none', static: true, a: 0, v0: v, duration: 5, vMax: v <= 8 ? 10 : 16,
            alt: `A flat horizontal line on a velocity–time graph at ${v} metres per second.`,
          },
          options: [
            { text: `Moving at a steady ${v} m/s`, correct: true },
            { text: 'Standing still', why: `A flat line means "no change". On this graph the thing that is not changing is the *velocity*, and it is ${v} m/s, not zero.` },
            { text: 'Speeding up steadily', why: 'Speeding up would make the velocity line climb. This one stays level.' },
            { text: 'Slowing down', why: 'Slowing down would make the velocity line fall towards zero.' },
          ],
          explain: `The velocity stays at ${v} m/s the whole time: steady motion, zero acceleration. Only on a *position*–time graph does a flat line mean "at rest".`,
        };
      },
    },
    {
      id: 'example-v-at',
      type: 'info',
      title: 'Starting from rest',
      text: r`
        Start from rest, and every second adds the same amount of velocity.
        So after a time $t$ the velocity is

        $$ v = a \times t $$

        :::example
        A motorbike sets off from rest at $6 \text{ m/s}^2$.

        - **Speed reached:** $6 \times 5 = 30$ m/s after 5 s.
        - **Time needed:** $\frac{18}{6} = 3$ s to reach 18 m/s.
        - **Acceleration:** $\frac{30}{5} = 6 \text{ m/s}^2$, from the 30 m/s
          gained in 5 s.
        :::
      `,
    },
    {
      id: 'v-equals-at',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { who: 'A sprinter', as: [3, 4], ts: [2, 3] },
          { who: 'A car', as: [2, 3, 4], ts: [3, 4, 5, 6] },
          { who: 'A train', as: [0.5, 1], ts: [20, 30, 40] },
          { who: 'A cyclist', as: [1, 2], ts: [3, 4, 5] },
          { who: 'A rocket', as: [20, 30, 40], ts: [3, 4, 5] },
          { who: 'A cheetah', as: [8, 9], ts: [2, 3] },
        ]);
        const a = rng.pick(c.as);
        const t = rng.pick(c.ts);
        const v = a * t;
        const kind = rng.pick(['v', 'a', 't']);
        if (kind === 'v') {
          return {
            text: r`${c.who} starts from rest and accelerates steadily at **$${a} \text{ m/s}^2$** for **${t} s**. What speed does that give?`,
            answer: v,
            unit: 'm/s',
            wrong: [[a + t, 'Each second *adds* the same amount again, so multiply rather than add.'], [v / 2, 'That is the *average* speed during the run. What speed has it reached at the end?']],
            hints: [`Every second adds ${a} m/s. There are ${t} seconds.`],
            explain: r`Each second adds ${a} m/s, so after ${t} s: $v = a \times t = ${a} \times ${t} = ${v}$ m/s.`,
          };
        }
        if (kind === 'a') {
          return {
            text: `${c.who} starts from rest and reaches **${v} m/s** in **${t} s**, speeding up steadily. What is the acceleration?`,
            answer: a,
            unit: 'm/s²',
            wrong: [[v * t, 'Multiplying makes it far too big. How much speed is gained in *each* second?'], [t / v, 'That is upside down: acceleration is change in velocity ÷ time.']],
            hints: [`It gains ${v} m/s in ${t} s. Share that out evenly over the seconds.`],
            explain: r`$a = \frac{\text{change in velocity}}{\text{time}} = \frac{${v}}{${t}} = ${a} \text{ m/s}^2$.`,
          };
        }
        return {
          text: r`${c.who} starts from rest and accelerates steadily at **$${a} \text{ m/s}^2$**. How long does it take to reach **${v} m/s**?`,
          answer: t,
          unit: 's',
          wrong: [[v * a, `Multiplying makes it far too big. How many lots of ${a} m/s fit into ${v} m/s?`]],
          hints: [`Each second adds ${a} m/s. How many seconds until that makes ${v} m/s?`],
          explain: r`$t = \frac{\text{change in velocity}}{a} = \frac{${v}}{${a}} = ${t}$ s.`,
        };
      },
    },
    {
      id: 'fall-predict',
      type: 'choice',
      mode: 'predict',
      title: 'Heavy against light',
      text: `
        A bowling ball (6 kg) and a tennis ball (60 g) are held side by side,
        20 m above the ground, and let go at the same moment.

        Imagine there is **no air** to get in the way. Which one lands first?
      `,
      shuffle: false,
      options: [
        { text: 'The bowling ball, by a long way' },
        { text: 'The bowling ball, but only just' },
        { text: 'They land together', correct: true },
        { text: 'The tennis ball' },
      ],
      explain: 'They land at exactly the same moment, even though one is a hundred times heavier. Try it yourself on the next screen.',
    },
    {
      id: 'drop',
      type: 'interact',
      graded: false,
      title: 'Drop them',
      text: `
        **Press Drop** and watch the two balls fall with no air. Ghost images
        show where each ball is every half second.

        Then switch the air on and drop them again.
      `,
      widget: { type: 'drop-tower', height: 20, objects: ['bowling', 'tennis'], air: false },
      check: (s) => (s.vacuumRuns >= 1 ? true : 'Switch to **No air** and press Drop.'),
      solution: { air: false, dropped: true },
      explain: `
        With no air they fall side by side all the way down. Each second, **both**
        gain the same speed.

        With air, the tennis ball lags a little: air resistance matters more for
        things that are light for their size, which is why a feather drifts.
        In 1971 the astronaut David Scott dropped a hammer and a feather on the
        airless Moon. They hit the dust together.
      `,
    },
    {
      id: 'free-fall',
      type: 'info',
      title: 'Free fall',
      text: r`
        Near the Earth's surface, everything that falls freely has the same
        acceleration: about $9.8 \text{ m/s}^2$, called $g$. In this course we
        round it to $g = 10 \text{ m/s}^2$ and ignore the air.

        So a dropped object gains **10 m/s every second**. After $t$ seconds
        its speed is $\mathord{v = g \times t}$:

        | Time falling (s) | 0 | 1 | 2 | 3 |
        |------|:---:|:---:|:---:|:---:|
        | Speed (m/s) | 0 | 10 | 20 | 30 |
        | Distance fallen (m) | 0 | 5 | 20 | 45 |

        The distances are 5 m times 1, 4, 9: the same pattern as the ball on
        the ramp.
      `,
    },
    {
      id: 'fall-speed',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { thing: 'A stone', place: 'dropped from a high bridge', longest: 4 },
          { thing: 'A coin', place: 'dropped down a deep, dry well', longest: 3 },
          { thing: 'A pine cone', place: 'that falls from the top of a tall tree', longest: 2 },
          { thing: 'A pebble', place: 'dropped from a high sea cliff', longest: 5 },
        ]);
        const t = rng.int(1, c.longest);
        const v = G * t;
        if (rng.bool(0.6)) {
          return {
            text: r`${c.thing} ${c.place} falls for **${t} s**. How fast is it moving at that moment? (Take $g = 10 \text{ m/s}^2$ and ignore the air.)`,
            answer: v,
            unit: 'm/s',
            wrong: [[5 * t * t, 'That is how *far* it has fallen. How much speed does it gain each second?'], [t, 'Each second adds 10 m/s, not 1 m/s.']],
            hints: ['A falling object gains 10 m/s every second.'],
            explain: r`It gains 10 m/s each second: $v = g \times t = 10 \times ${t} = ${v}$ m/s.`,
          };
        }
        return {
          text: r`${c.thing} ${c.place} starts from rest. How long does it take to reach **${v} m/s**? (Take $g = 10 \text{ m/s}^2$ and ignore the air.)`,
          answer: t,
          unit: 's',
          wrong: [[v * G, 'Multiplying makes it far too long. How many lots of 10 m/s fit into the speed?']],
          hints: ['A falling object gains 10 m/s every second.'],
          explain: r`Each second adds 10 m/s, so reaching ${v} m/s takes $\frac{${v}}{10} = ${t}$ s.`,
        };
      },
    },
    {
      id: 'example-fall-distance',
      type: 'info',
      title: 'How far has it fallen?',
      text: r`
        A falling object has no single speed, so use its **average** speed.
        When the speed climbs evenly from 0, the average is half the final
        speed.

        :::example
        A stone falls for 5 s.

        1. Final speed: $10 \times 5 = 50$ m/s.
        2. Average speed: half of that, 25 m/s.
        3. Distance: $25 \times 5 = 125$ m. That is average speed × time.
        :::

        The table's distances come from the same steps. In symbols:
        $d = \tfrac{1}{2} g t^2$.
      `,
      figure: {
        type: 'ramp-roll', scene: 'none', static: true, a: 10, v0: 0, duration: 5, length: 130, vMax: 60,
        points: [{ t: 2.5, v: 25, label: 'average: 25 m/s', above: false }, { t: 5, v: 50, label: '50 m/s after 5 s', above: true }],
        alt: 'A velocity–time graph of a falling stone: a straight line from 0 up to 50 metres per second at 5 seconds. Half-way along, at 2.5 seconds, it passes 25 metres per second, the average speed.',
      },
    },
    {
      id: 'how-far',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const t = rng.pick([1, 3, 4]);          // not 2 s: there the speed and the distance happen to share a number
        const v = G * t;
        const d = 5 * t * t;
        const c = rng.pick([
          `A stone dropped into a dry well hits the bottom after **${t} s**. How deep is the well?`,
          `A spanner slips from a crane and hits the ground **${t} s** later. How high up was it?`,
          `A pebble dropped from a cliff top lands on the beach **${t} s** later. How high is the cliff?`,
        ]);
        return {
          text: r`${c} (Take $g = 10 \text{ m/s}^2$ and ignore the air.)`,
          answer: d,
          unit: 'm',
          wrong: [
            [v * t, `That would be right if it had moved at ${v} m/s the whole time. But it started from rest.`],
            [v, 'That is the speed it reaches, in m/s. How far has it travelled by then?'],
          ],
          hints: [
            `It starts at 0 m/s and ends at ${v} m/s, speeding up evenly.`,
            `Speeding up evenly from 0 to ${v} m/s, its *average* speed is ${v / 2} m/s. Distance = average speed × time.`,
          ],
          explain: r`The speed climbs evenly from 0 to ${v} m/s, so the average speed is ${v / 2} m/s. Distance $= ${v / 2} \times ${t} = ${d}$ m. In symbols: $d = \tfrac{1}{2} g t^2$.`,
        };
      },
    },
  ],
  recap: [
    '**Acceleration** is how fast the velocity changes: change in velocity ÷ time, in m/s².',
    'On a velocity–time graph it is the slope. Slowing down is a negative slope.',
    'Starting from rest with steady acceleration, $v = at$ and the distances grow like 1, 4, 9, 16.',
    'Without air, everything falls with the same acceleration: about 10 m/s², whatever its mass.',
  ],
  next: 'Next: what makes a velocity change in the first place?',
};
