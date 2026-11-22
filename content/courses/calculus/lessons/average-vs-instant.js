// Calculus in Pictures · Lesson 1 · How Fast, Right Now?
import { r, num } from '../../../kit.js';
import { table } from '../helpers.js';

// The trip used all through this lesson: a car pulls away, d = 2t² metres after t seconds.
// Its speed at time t is 4t m/s, so at t = 5 s it is doing 20 m/s = 72 km/h.
const TRIP = { type: 'speed-trip', fn: '2t^2', t: [0, 6], d: [0, 80], dStep: 10 };

// A snapshot of the car, frozen, next to its speedometer.
const PHOTO = [
  '<g transform="rotate(-4 95 76)">',
  '<rect class="fill-surface stroke-ink" stroke-width="2.5" x="14" y="14" width="164" height="124" rx="7"/>',
  '<rect class="fill-blue-soft" x="24" y="24" width="144" height="58"/>',
  '<rect class="fill-gray-soft" x="24" y="82" width="144" height="26"/>',
  '<path class="stroke-surface fill-none" stroke-width="2.5" stroke-dasharray="12 10" d="M28 96 H166"/>',
  '<path class="fill-red stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M56 88 V77 Q56 73 60 72 L74 70 L84 58 H112 L123 70 L134 72 Q138 73 138 77 V88 Z"/>',
  '<path class="fill-surface stroke-ink" stroke-width="2" stroke-linejoin="round" d="M80 69 L87 61 H97 V69 Z M101 69 V61 H110 L117 69 Z"/>',
  '<circle class="fill-ink" cx="76" cy="89" r="8"/><circle class="fill-surface" cx="76" cy="89" r="3"/>',
  '<circle class="fill-ink" cx="119" cy="89" r="8"/><circle class="fill-surface" cx="119" cy="89" r="3"/>',
  '<text class="fig-label-sm text-muted" x="96" y="127" text-anchor="middle">0 m in 0 s</text>',
  '</g>',
  '<path class="stroke-yellow fill-none" stroke-width="3" stroke-linecap="round" d="M186 18 L196 8 M192 30 L206 26 M176 10 L180 0"/>',
  '<path class="fill-surface stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M214 112 A56 56 0 0 1 326 112 Z"/>',
  '<path class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" d="M222 112 H231 M318 112 H309 M229.4 84 L237.2 88.5 M310.6 84 L302.8 88.5 M250 63.5 L254.5 71.3 M290 63.5 L285.5 71.3 M270 56 V65"/>',
  '<line class="stroke-red" stroke-width="3.5" stroke-linecap="round" x1="270" y1="110" x2="296" y2="76"/>',
  '<circle class="fill-ink" cx="270" cy="110" r="6"/>',
  '<text class="fig-label" x="270" y="136" text-anchor="middle">72 km/h</text>',
].join('');

export default {
  id: 'average-vs-instant',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Frozen in a photo',
      text: `
        A speed camera flashes. In the photo the car is frozen: in that single
        instant it covers **0 metres in 0 seconds**.

        Yet at that very instant the driver's speedometer read **72 km/h**.

        What is that number actually telling you?
      `,
      figure: { type: 'svg', viewBox: '0 0 340 150', maxWidth: 400, content: PHOTO, alt: 'A snapshot of a car, frozen in mid-journey, captioned "0 m in 0 s". Beside it, a speedometer reading 72 kilometres per hour.' },
      columns: 1,
      options: [
        { text: 'The car\'s average speed since it set off' },
        { text: 'How far the car would go in the next hour if it kept moving exactly as it is at this instant', correct: true },
        { text: 'How far the car travelled during the last hour' },
        { text: 'Nothing real: at a single instant there is no such thing as speed' },
      ],
      explain: `
        A speed "right now" describes how the car is moving at this instant:
        hold it steady for an hour and you would cover 72 km.

        But there is a real puzzle here. Speed is distance ÷ time, and a single
        instant gives 0 ÷ 0, which means nothing at all. Getting around that
        puzzle is one of the things calculus was invented for. Start with
        the kind of speed that *is* easy.
      `,
    },
    {
      id: 'watch',
      type: 'interact',
      graded: false,
      title: 'A six-second trip',
      text: `
        A car pulls away from a junction. The road runs up the left edge, and
        the graph records **how far the car has gone** at each moment.

        **Press Play** and watch the car and the graph together.
      `,
      widget: { ...TRIP, markers: false, alt: 'A road with a car at its start, beside a distance–time graph that curves upward more and more steeply.' },
      check: (s) => s.played || 'Press **Play the trip** to send the car on its way.',
      solution: { played: true },
      explain: `
        The car starts gently and keeps getting faster: in each second it
        covers more road than in the second before.

        On the graph that shows up as a curve that gets **steeper**. A steep
        graph means a fast car.
      `,
    },
    {
      id: 'measure',
      type: 'interact',
      title: 'Measure a stretch',
      text: `
        Two markers, [A]{.orange} and [B]{.violet}, pick out a stretch of the trip. For
        that stretch you can read off the [distance covered]{.red}, the
        [time taken]{.green} and the **average speed**: the distance covered
        divided by the time taken.

        **Find a stretch exactly 1 second long with an average speed of 10 m/s.**
      `,
      widget: { ...TRIP, a: 4, b: 6, play: false, alt: 'The distance–time graph with two draggable markers A and B.' },
      check: (s) => {
        if (s.dt !== 1) return 'Keep A and B exactly 1 second apart.';
        if (s.avg === 10) return true;
        return s.avg < 10
          ? 'Too slow. The car is faster later in the trip: slide both markers to the right.'
          : 'Too fast. Slide both markers to the left, where the car is slower.';
      },
      solution: { a: 2, b: 3 },
      hints: [
        'Average speed is distance covered ÷ time taken. Over 1 second, the car has to cover exactly 10 m.',
        'Try the third second of the trip: from 2 s to 3 s.',
      ],
      explain: r`
        Between 2 s and 3 s the car goes from 8 m to 18 m:

        $$ \text{average speed} = \frac{\red{10\ \text{m}}}{\green{1\ \text{s}}} = 10\ \text{m/s} $$

        Look at the triangle in the picture. The distance is its [rise]{.red},
        the time is its [run]{.green}. Distance ÷ time is rise ÷ run: the
        **slope** of the violet line.
      `,
    },
    {
      id: 'secant',
      type: 'info',
      title: 'Average speed is a slope',
      text: r`
        The straight line through two points of a curve is called a
        **secant line**.

        **Average speed** = [distance covered]{.red} ÷ [time taken]{.green}
        = [rise]{.red} ÷ [run]{.green}.

        :::key
        The average speed over a stretch is the slope of the secant line
        through its two end points on the distance–time graph.
        :::

        :::example
        From 1 s to 4 s the car goes from 2 m to 32 m. Subtract to get the
        distance covered and the time taken, then divide:

        $$ \frac{32 - 2}{4 - 1} = \frac{\red{30\ \text{m}}}{\green{3\ \text{s}}} = 10\ \text{m/s} $$
        :::
      `,
      figure: { ...TRIP, static: true, a: 1, b: 4, alt: 'The graph with a secant line through the points at 1 second and 4 seconds: rise 30 metres, run 3 seconds, slope 10 metres per second.' },
    },
    {
      id: 'avg-from-table',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { who: 'A cyclist', short: 'the cyclist', dt: 10, lo: 4, hi: 11 },
          { who: 'A train pulling out of a station', short: 'the train', dt: 10, lo: 6, hi: 22 },
          { who: 'A runner', short: 'the runner', dt: 5, lo: 3, hi: 8 },
          { who: 'A delivery drone', short: 'the drone', dt: 4, lo: 5, hi: 14 },
        ]);
        const n = rng.pick([2, 3]);                       // the stretch spans n rows of the table
        const i = rng.int(0, 4 - n);
        const v = rng.int(scene.lo + 2, scene.hi - 2);    // the answer, chosen first
        const e = rng.int(1, 2);
        const inside = n === 2 ? [v - e, v + e] : [v - e, v, v + e];
        const speeds = [0, 1, 2, 3].map((k) => (k >= i && k < i + n ? inside[k - i] : rng.int(scene.lo, scene.hi)));
        const times = [0, 1, 2, 3, 4].map((k) => k * scene.dt);
        const dist = [0];
        for (let k = 0; k < 4; k++) dist.push(dist[k] + speeds[k] * scene.dt);
        const t1 = times[i];
        const t2 = times[i + n];
        const d1 = dist[i];
        const d2 = dist[i + n];
        return {
          text: [
            `${scene.who} is timed along a straight track.`,
            table(['time (s)', 'distance (m)'], times.map((t, k) => [t, dist[k]])),
            `What was ${scene.short}'s **average speed** between $t = ${t1}$ s and $t = ${t2}$ s?`,
          ].join('\n\n'),
          answer: v,
          unit: 'm/s',
          wrong: [
            [d2 / t2, `That divides the whole distance by the whole time since the start. Use only the stretch from ${t1} s to ${t2} s.`],
            [d2 - d1, `That is the distance covered during the stretch. Now divide by the time it took: ${t2 - t1} s.`],
            [d2 / (t2 - t1), `Use the distance covered *during* the stretch, $${d2} - ${d1}$, not the total distance so far.`],
          ],
          hints: [
            'Average speed = distance covered ÷ time taken, both measured over the stretch you are asked about.',
            r`Distance covered: $${d2} - ${d1} = ${d2 - d1}$ m. Time taken: $${t2} - ${t1} = ${t2 - t1}$ s.`,
          ],
          explain: r`
            Distance covered ÷ time taken:

            $$ \frac{${d2} - ${d1}}{${t2} - ${t1}} = \frac{${d2 - d1}}{${t2 - t1}} = ${v}\ \text{m/s} $$
          `,
        };
      },
    },
    {
      id: 'teach-rate-of-change',
      type: 'info',
      title: 'Not only cars',
      text: r`
        Litres in a tank, degrees on a thermometer, centimetres on a growing
        plant: whenever something changes, *change in the quantity ÷ time
        taken* is its **average rate of change**. On a graph it is still
        rise ÷ run between two points.

        :::example
        A barrel leaks. From P to Q the water goes from 60 litres to
        28 litres, between minute 2 and minute 6:

        $$ \frac{28 - 60}{6 - 2} = \frac{-32}{4} = -8 $$

        That is $-8$ litres per minute. The graph goes *down*, so the change
        is negative, and so is the rate.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 10.4], y: [0, 88], xStep: 2, yStep: 20, xLabel: 'time (min)', yLabel: 'water (litres)',
        fns: [{ expr: '64 - x^2', from: 0, to: 8, color: 'blue' }],
        secants: [{ fn: 0, from: 2, to: 6, color: 'violet' }],
        points: [
          { x: 2, on: 0, label: 'P', coords: true, color: 'orange' },
          { x: 6, on: 0, label: 'Q', coords: true, color: 'orange' },
        ],
        alt: 'A falling curve showing the water left in a leaking barrel. Point P is at (2, 60) and point Q is at (6, 28). A straight line passes through both, sloping downward.',
      },
    },
    {
      id: 'avg-from-graph',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          {
            what: 'the temperature of a mug of tea cooling on a cold windowsill', thing: 'temperature',
            fn: '0.125x^2 - 4.5x + 80', f: (t) => 0.125 * t * t - 4.5 * t + 80,
            x: [0, 17.5], y: [0, 90], xStep: 4, yStep: 20, xLabel: 'time (min)', yLabel: 'temperature (°C)', unit: '°C per minute',
            pairs: [[4, 8], [4, 12], [8, 12], [8, 16], [4, 16], [12, 16]],
          },
          {
            what: 'the water in a tank while the tap is opened wider and wider', thing: 'amount of water',
            fn: 'x^2 + 2x', f: (t) => t * t + 2 * t,
            x: [0, 6.6], y: [0, 55], xStep: 1, yStep: 10, xLabel: 'time (min)', yLabel: 'water (litres)', unit: 'litres per minute',
            pairs: [[0, 2], [1, 3], [2, 4], [1, 4], [2, 5], [3, 5], [2, 6], [4, 6]],
          },
          {
            what: 'the height of a seedling over six weeks', thing: 'height',
            fn: '12x - x^2', f: (t) => 12 * t - t * t,
            x: [0, 6.6], y: [0, 42], xStep: 1, yStep: 10, xLabel: 'time (weeks)', yLabel: 'height (cm)', unit: 'cm per week',
            pairs: [[0, 2], [1, 3], [0, 4], [2, 4], [1, 5], [3, 5], [2, 6], [4, 6]],
          },
          {
            what: 'the height of a ball thrown straight up', thing: 'height',
            fn: '20x - 5x^2', f: (t) => 20 * t - 5 * t * t,
            x: [0, 4.4], y: [0, 24], xStep: 1, yStep: 5, xLabel: 'time (s)', yLabel: 'height (m)', unit: 'm/s',
            pairs: [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4], [1, 4], [0, 3]],
          },
        ]);
        const [x1, x2] = rng.pick(scene.pairs);
        const y1 = scene.f(x1);
        const y2 = scene.f(x2);
        const answer = (y2 - y1) / (x2 - x1);
        const falling = answer < 0;
        return {
          text: `
            The graph shows ${scene.what}.

            What is the **average rate of change** of the ${scene.thing} between P and Q?
          `,
          figure: {
            type: 'plot', x: scene.x, y: scene.y, xStep: scene.xStep, yStep: scene.yStep, xLabel: scene.xLabel, yLabel: scene.yLabel,
            fns: [{ expr: scene.fn, color: 'blue' }],
            secants: [{ fn: 0, from: x1, to: x2, color: 'violet' }],
            points: [
              { x: x1, on: 0, label: 'P', coords: true, color: 'orange' },
              { x: x2, on: 0, label: 'Q', coords: true, color: 'orange' },
            ],
            alt: `A curve showing ${scene.what}. Point P is at (${num(x1)}, ${num(y1)}) and point Q is at (${num(x2)}, ${num(y2)}). A straight line passes through both.`,
          },
          answer,
          unit: scene.unit,
          wrong: [
            [-answer, falling
              ? 'Check the sign. From P to Q the graph goes *down*, so the change — and the rate — is negative.'
              : 'Check the sign. From P to Q the graph goes *up*, so the change is positive.'],
            [y2 - y1, `That is how much the ${scene.thing} changed. Divide by the time it took.`],
            [(x2 - x1) / (y2 - y1), 'That is run ÷ rise. A rate of change is rise ÷ run: change in the quantity ÷ time taken.'],
          ],
          hints: [
            'It is the slope of the line through P and Q: rise ÷ run.',
            r`Rise: $${num(y2)} - ${num(y1)} = ${num(y2 - y1)}$. Run: $${num(x2)} - ${num(x1)} = ${num(x2 - x1)}$.`,
          ],
          explain: r`
            Change in ${scene.thing} ÷ time taken:

            $$ \frac{${num(y2)} - ${num(y1)}}{${num(x2)} - ${num(x1)}} = \frac{${num(y2 - y1)}}{${num(x2 - x1)}} = ${num(answer)} $$

            That is ${num(answer)} ${scene.unit}: the slope of the violet secant line.${falling ? ' The minus sign says the quantity is going *down*.' : ''}
          `,
        };
      },
    },
    {
      id: 'puzzle',
      type: 'choice',
      title: 'Now the hard question',
      text: r`
        Back to the car, $d = 2t^2$ metres after $t$ seconds. How fast is it
        going at **exactly** $t = 5$ s?

        Try the average-speed recipe on the "stretch" that starts at 5 s and
        ends at 5 s. What comes out?
      `,
      figure: { ...TRIP, markers: false, static: true, time: 5, alt: 'The distance–time graph of the car, frozen at 5 seconds: the car is 50 metres along the road.' },
      columns: 1,
      options: [
        { text: r`$0 \div 0$, which has no value`, correct: true },
        { text: '0 m/s', why: r`The car covers 0 m, but in 0 s. $0 \div 0$ is not 0: dividing by zero gives no answer at all.` },
        { text: '10 m/s', why: 'That is 50 m ÷ 5 s: the average over the first five seconds, most of which the car spent going slower.' },
        { text: '50 m/s', why: '50 m is how far the car has gone by then, not how fast it is going.' },
      ],
      explain: `
        One instant has no distance and no duration, so the recipe has nothing
        to work with.

        The way out is to sneak up on it: use a short stretch that starts at
        5 s, and then make it shorter, and shorter.
      `,
    },
    {
      id: 'shrink',
      type: 'interact',
      title: 'Sneak up on it',
      text: `
        Marker [A]{.orange} is pinned at **5 s**. Marker [B]{.violet} sits a small gap later.

        **Shrink the gap, step by step, all the way down to 0.01 s.** Watch what
        the average speed does in the table.
      `,
      widget: { ...TRIP, mode: 'gap', a: 5, gaps: [1, 0.5, 0.1, 0.01], alt: 'The distance–time graph with marker A fixed at 5 seconds and marker B a chosen gap later.' },
      check: (s) => {
        if (s.triedAll) return true;
        return s.smallest > 0.01
          ? 'Keep shrinking: tap the next smaller gap.'
          : 'Fill in the whole table: one of the gaps has not been tried yet.';
      },
      solution: { tried: [1, 0.5, 0.1, 0.01], gap: 0.01 },
      hints: ['Tap each gap button in turn: 0.5 s, then 0.1 s, then 0.01 s.'],
      explain: `
        22, then 21, then 20.2, then 20.02. Each smaller gap changes the
        average by less than the one before. The averages are not wandering:
        they are **closing in on one number**.

        In the magnifier, A and B are still two separate moments. But the
        piece of curve between them is now almost perfectly straight.
      `,
    },
    {
      id: 'limit-value',
      type: 'numeric',
      text: [
        'Here is what you found, next to the same experiment run on the stretch just **before** 5 s.',
        table(['gap', 'just before 5 s', 'just after 5 s'], [
          ['1 s', '18 m/s', '22 m/s'],
          ['0.1 s', '19.8 m/s', '20.2 m/s'],
          ['0.01 s', '19.98 m/s', '20.02 m/s'],
          ['0.001 s', '19.998 m/s', '20.002 m/s'],
        ]),
        'Both columns are squeezing toward the same number. **What is it?**',
      ].join('\n\n'),
      answer: 20,
      unit: 'm/s',
      wrong: [
        [20.002, 'That is still an average over a thousandth of a second. Which number is it closing in on?'],
        [19.998, 'That is still an average over a thousandth of a second. Which number is it closing in on?'],
        [0, 'The *gap* is heading for 0. The average speed is not: look where its values are heading.'],
      ],
      hints: ['One column climbs toward it, the other falls toward it. The number is trapped in between.'],
      explain: `
        From before, the averages climb toward 20, and from after they fall
        toward it. The one number they both close in on is **20 m/s**.

        Multiply by 3.6 to change units: 20 m/s is **72 km/h**, the
        speedometer reading in the photo.
      `,
    },
    {
      id: 'instant',
      type: 'info',
      title: 'Speed at an instant',
      text: `
        You never did divide 0 by 0. You asked a better question:

        > As the stretch around this moment shrinks, what do the average speeds settle on?

        :::key
        The **instantaneous speed** at a moment is the number that the average
        speeds approach as the stretch around that moment shrinks toward nothing.
        That number is called the **limit** of the averages.
        :::

        :::example
        Just after 5 s the car's averages ran 22, 20.2, 20.02, 20.002 m/s.
        They never reach 20, but they get as close to it as you like. Their
        limit is 20 m/s: the car's speed at exactly 5 s.
        :::

        That is what a speedometer shows, and what "72 km/h in the photo"
        means. For anything else that changes, the same number is its
        **instantaneous rate of change**: how fast it is changing *right now*.
      `,
    },
    {
      id: 'settle',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { intro: 'A stone is dropped from a cliff. After $t$ seconds it has fallen about $5t^2$ metres.', k: 5, times: [1, 2, 3], it: 'the stone' },
          { intro: 'A cyclist rolls down a long ramp. After $t$ seconds she has travelled $t^2$ metres.', k: 1, times: [2, 3, 4, 5], it: 'the cyclist' },
          { intro: 'A rocket sled fires its engine. After $t$ seconds it has travelled $3t^2$ metres.', k: 3, times: [1, 2, 3, 4], it: 'the sled' },
          { intro: 'A tram pulls away from a stop. After $t$ seconds it has travelled $0.5t^2$ metres.', k: 0.5, times: [4, 6, 8], it: 'the tram' },
        ]);
        const a = rng.pick(scene.times);
        const answer = 2 * scene.k * a;
        const avg = (h) => num(answer + scene.k * h, 6);
        return {
          text: [
            `${scene.intro} Its average speed has been worked out over shorter and shorter stretches that start at $t = ${a}$ s.`,
            table(['stretch', 'average speed'], [1, 0.1, 0.01, 0.001].map((h) => [`${a} s to ${num(a + h)} s`, `${avg(h)} m/s`])),
            `What is the **instantaneous speed** of ${scene.it} at $t = ${a}$ s?`,
          ].join('\n\n'),
          answer,
          unit: 'm/s',
          wrong: [
            [answer + scene.k, 'That is the average over a whole second. The averages keep changing as the stretch shrinks: where are they heading?'],
            [answer + scene.k * 0.001, 'Close: that is still an average, over a thousandth of a second. Which number is it closing in on?'],
          ],
          hints: ['Read down the table. The averages change by less and less: which number are they closing in on?'],
          explain: `As the stretch shrinks, the average speeds close in on **${num(answer)} m/s**. That limit is the speed at the instant $t = ${a}$ s.`,
        };
      },
    },
    {
      id: 'find-moment',
      type: 'numeric',
      stretch: true,
      title: 'Hunt for a speed',
      text: `
        Now marker [A]{.orange} can be dragged, and the gap after it is a tiny
        0.001 s. So the reading is practically the car's speed *at* A.

        **At what moment is the car doing 12 m/s?**
      `,
      figure: { ...TRIP, mode: 'gap', a: 1, gaps: [0.001], gap: 0.001, dragA: true, snap: 0.5, table: false, lens: false, alt: 'The distance–time graph with a draggable marker A. A readout gives the average speed over the thousandth of a second after A.' },
      answer: 3,
      prefix: '$t =$',
      unit: 's',
      wrong: [
        [12, 'That is the speed you are hunting for. The question is *when* the car reaches it.'],
        [18, 'That is how far the car has gone when it reaches 12 m/s. The question is *when* that happens.'],
      ],
      hints: [
        'Drag A along the curve (or tap the graph) and watch the average speed. Is 12 m/s earlier or later than where you are?',
        'At 2 s the reading is about 8 m/s. At 4 s it is about 16 m/s.',
      ],
      explain: `
        At A = 3 s the reading is 12.002 m/s, closing in on **12 m/s**.

        Slide A along and a pattern appears: about 4, 8, 12, 16, 20 m/s at
        1, 2, 3, 4, 5 s. The car's speed is itself changing steadily. Lesson 3
        shows where that pattern comes from.
      `,
    },
    {
      id: 'avg-or-instant',
      type: 'bucket',
      review: true,
      text: 'An average over a stretch, or a value at one instant? Sort them.',
      buckets: ['Average over a stretch', 'At one instant'],
      items: [
        { text: 'A train covers 300 km in 2 hours', bucket: 0, why: '300 km in 2 hours describes a whole stretch of the journey: an average of 150 km/h.' },
        { text: 'The needle on a speedometer', bucket: 1, why: 'A speedometer shows the speed right now, not over the trip so far.' },
        { text: 'The slope of the line through two points on a distance–time graph', bucket: 0, why: 'Two points mark out a stretch. The slope between them is the average speed over it.' },
        { text: 'Total distance ÷ total time', bucket: 0, why: 'Dividing a total distance by a total time always gives an average.' },
        { text: 'What the averages close in on as the stretch shrinks to nothing', bucket: 1, why: 'That limit is exactly how the speed at one instant is defined.' },
        { text: 'How fast a diver is moving at the moment she hits the water', bucket: 1, why: 'One moment, one speed: the instantaneous speed at impact.' },
      ],
      explain: `
        An average always needs a stretch: two moments, and what happened
        between them. An instantaneous rate belongs to one moment, and is what
        the averages approach as the stretch shrinks.
      `,
    },
  ],
  recap: [
    'Average speed over a stretch = distance covered ÷ time taken = the **slope of the secant line** through two points of the distance–time graph.',
    'A single instant gives 0 ÷ 0, so the recipe cannot be used directly.',
    'Shrink the stretch instead: the average speeds close in on one number, the **instantaneous speed**.',
    'The same idea gives the rate of change *right now* of anything that changes.',
  ],
  next: 'Next: turn "the rate right now" into a picture — the slope of a curve at a single point.',
};
