// Physics: Motion & Forces · Lesson 1 · Where and How Fast
import { r } from '../../../kit.js';
import { graphPanels } from '../helpers.js';

const TARGET = [2, 0, 3, -4];

export default {
  id: 'position-and-velocity',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Read the picture',
      text: `
        A cyclist rides along a **flat, straight** road. A tracker records where
        she is every second and draws this graph.

        What did she do?
      `,
      figure: {
        type: 'motion-graph', static: true, duration: 8, stage: 4, track: 24, xStep: 4, velocities: [5, -5],
        alt: 'A position–time graph shaped like a hill: the line climbs steadily from 0 to 20 metres in 4 seconds, then falls steadily back to 0 by 8 seconds.',
      },
      options: [
        { text: 'Rode up a hill, then down the other side' },
        { text: 'Rode away, then turned round and rode back', correct: true },
        { text: 'Sped up, then slowed down' },
      ],
      explain: `
        She rode away and came back. Her distance from the start
        grows to 20 m and then shrinks back to 0.

        The road was flat the whole time. The hill is in the graph, not in
        the road.
      `,
    },
    {
      id: 'teach-position',
      type: 'info',
      title: 'What the graph shows',
      text: `
        A position–time graph is **not a picture of the road**. Its height is
        the cyclist's **position**: how far along the road she is, measured
        from the start, in metres.

        To read it, pick a time along the bottom and go up to the line. At 2 s
        she is 10 m from the start, at 4 s she is 20 m away, at 8 s she is back
        at 0 m.

        - Line **climbing**: the position grows. She is moving away.
        - Line **flat**: the position stays the same. She is standing still.
        - Line **falling**: the position shrinks. She is coming back.
      `,
      figure: {
        type: 'motion-graph', static: true, duration: 8, stage: 4, track: 24, xStep: 4, velocities: [5, -5],
        points: [{ t: 2, x: 10, label: '(2 s, 10 m)' }, { t: 4, x: 20, label: '(4 s, 20 m)' }, { t: 8, x: 0, label: '(8 s, 0 m)' }],
        alt: 'The cyclist\'s position–time graph again, with three points marked: 10 metres at 2 seconds, 20 metres at 4 seconds and 0 metres at 8 seconds.',
      },
    },
    {
      id: 'drive',
      type: 'interact',
      graded: false,
      title: 'Drive the cart',
      text: `
        This cart obeys you. Its trip has four stages of 2 seconds each.

        **Give each stage a velocity, then press Go.** The velocity is how many
        metres the cart moves each second. Make one stage go forwards (+), one
        stand still (0) and one come back (−), and watch what the graph does
        each time.
      `,
      widget: { type: 'motion-graph', duration: 8, stage: 2, track: 12, vRange: [-3, 3] },
      check: (s) => {
        if (s.crashed) return 'The cart runs off the end of the track. Choose velocities that keep it between 0 and 12 m.';
        if (!s.velocities.some((v) => v > 0)) return 'No stage moves forwards yet. Give one of them a positive velocity.';
        if (!s.velocities.some((v) => v < 0)) return 'No stage comes back yet. Give a later stage a negative velocity.';
        if (!s.velocities.some((v) => v === 0)) return 'Let the cart stand still for one stage: velocity 0.';
        if (!s.played) return 'Now press **Go** and watch the graph being drawn.';
        return true;
      },
      solution: { velocities: [3, 0, -2, 1] },
      explain: `
        Forwards: the line **climbs**. Standing still: the line is **flat**.
        Coming back: the line **falls**.

        Did you notice what a bigger velocity does? The line gets steeper.
      `,
    },
    {
      id: 'slope',
      type: 'info',
      title: 'Slope is velocity',
      text: r`
        The faster something moves, the steeper its line. **Velocity** puts a
        number on that: how fast the position changes, and which way.

        $$ v = \frac{\text{change in position}}{\text{time taken}} $$

        :::example
        Take two points on the line: (1 s, 3 m) and (4 s, 9 m).

        - Change in position: $9 - 3 = 6$ m
        - Time taken: $4 - 1 = 3$ s

        The position climbs [6 m]{.red} in [3 s]{.green}. So
        $\mathord{v = \frac{6}{3} = 2}$ metres per second, written **2 m/s**.
        :::
      `,
      figure: {
        type: 'motion-graph', static: true, duration: 5, stage: 5, track: 12, start: 1, velocities: [2],
        triangle: { from: [1, 3], to: [4, 9] }, points: [{ t: 1, x: 3, label: '(1 s, 3 m)' }, { t: 4, x: 9, label: '(4 s, 9 m)' }],
        alt: 'A straight line on a position–time graph through 3 metres at 1 second and 9 metres at 4 seconds. Between the two marked points it runs 3 seconds across and rises 6 metres.',
      },
    },
    {
      id: 'read-velocity',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick([
          'a delivery robot rolling down a corridor',
          'a tram on a straight track',
          'a dog trotting along a straight path',
          'a skater gliding along a frozen canal',
        ]);
        const v = rng.int(1, 5);
        const s0 = rng.pick([0, 2, 4]);
        const t0 = rng.int(0, 2);
        const t1 = rng.int(t0 + 2, 6);
        const x0 = s0 + v * t0;
        const x1 = s0 + v * t1;
        const top = s0 + 6 * v;
        const track = top <= 12 ? 12 : top <= 20 ? 20 : top <= 30 ? 30 : 40;
        const dx = x1 - x0;
        const dt = t1 - t0;
        return {
          text: `This is the position–time graph of ${who}. **What velocity does it show?**`,
          figure: {
            type: 'motion-graph', static: true, duration: 6, stage: 6, track, xStep: track <= 12 ? 2 : track <= 20 ? 4 : track <= 30 ? 5 : 10,
            start: s0, velocities: [v],
            points: [{ t: t0, x: x0, label: `(${t0} s, ${x0} m)` }, { t: t1, x: x1, label: `(${t1} s, ${x1} m)` }],
            alt: `A straight rising line on a position–time graph. It passes through ${x0} metres at ${t0} seconds and ${x1} metres at ${t1} seconds.`,
          },
          answer: v,
          unit: 'm/s',
          wrong: [
            [dx, 'That is how far the position changed. Now divide by how long that took.'],
            [x1 / t1, 'That divides one position by one time. Use the *change* in position and the *change* in time between the two points.'],
            [dt / dx, 'That is upside down. Velocity is metres per second, so the change in position goes on top.'],
          ],
          hints: [
            'Use the two marked points. How far did the position change between them? How much time went by?',
            r`Rise: $${x1} - ${x0} = ${dx}$ m. Run: $${t1} - ${t0} = ${dt}$ s. Divide rise by run.`,
          ],
          explain: r`The position changes by $${x1} - ${x0} = ${dx}$ m in $${t1} - ${t0} = ${dt}$ s, so $v = \frac{${dx}}{${dt}} = ${v}$ m/s.`,
        };
      },
    },
    {
      id: 'example-negative',
      type: 'info',
      title: 'Coming back: a negative velocity',
      text: r`
        A falling line has a **negative** velocity. Take the change in position
        as *end − start*, and the sign looks after itself.

        :::example
        A cart is at the 11 m mark at 1 s, and at the 3 m mark at 5 s.

        - Change in position: $3 - 11 = -8$ m
        - Time taken: $5 - 1 = 4$ s

        So $v = \frac{-8}{4} = -2$ m/s. The minus sign says the cart is
        moving back towards 0.
        :::
      `,
      figure: {
        type: 'motion-graph', static: true, duration: 6, stage: 6, track: 14, xStep: 2, start: 13, velocities: [-2],
        triangle: { from: [1, 11], to: [5, 3] }, points: [{ t: 1, x: 11, label: '(1 s, 11 m)', above: true }, { t: 5, x: 3, label: '(5 s, 3 m)', above: false }],
        alt: 'A straight falling line on a position–time graph through 11 metres at 1 second and 3 metres at 5 seconds. Between the two marked points it runs 4 seconds across and drops 8 metres.',
      },
    },
    {
      id: 'match-target',
      type: 'interact',
      title: 'Match the graph',
      text: `
        The dashed line is a trip somebody else made.

        **Set the four velocities so that your cart draws the same graph.**
        Press Go to test your settings.
      `,
      widget: { type: 'motion-graph', duration: 8, stage: 2, track: 12, vRange: [-4, 4], target: TARGET },
      check: (s) => {
        if (s.match) return true;
        const i = s.firstWrong;
        const v = s.velocities[i];
        const want = TARGET[i];
        const when = `From ${2 * i} s to ${2 * i + 2} s`;
        if (want === 0) return `${when} the dashed line is flat, so the cart should stand still.`;
        if (v === 0) return `${when} the dashed line is not flat, so the cart must be moving.`;
        if (Math.sign(v) !== Math.sign(want)) {
          return want < 0
            ? `${when} the dashed line falls. The cart is coming back, so its velocity is negative.`
            : `${when} the dashed line climbs. The cart is moving forwards there.`;
        }
        if (Math.abs(v) === 2 * Math.abs(want)) return `${when} your cart goes twice as far as the target. Each stage lasts **2** seconds, so divide the change in position by 2.`;
        return Math.abs(v) > Math.abs(want)
          ? `${when} your line is too steep: the cart is too fast.`
          : `${when} your line is not steep enough: the cart is too slow.`;
      },
      solution: { velocities: TARGET },
      hints: [
        'Take one stage at a time. By how many metres does the dashed line rise or fall during those 2 seconds?',
        'In the first stage the line rises 4 m in 2 s. That is 2 m/s.',
        'The last stage falls from 10 m to 2 m: a change of −8 m in 2 s.',
      ],
      explain: r`
        Stage by stage: $+4$ m in 2 s is $2$ m/s. Flat is $0$. Then $+6$ m in 2 s is
        $3$ m/s, and $-8$ m in 2 s is $-4$ m/s.

        Each time, velocity = change in position ÷ time taken.
      `,
    },
    {
      id: 'moving-back',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { thing: 'tram', place: 'track', speeds: [3, 4, 5, 6] },
          { thing: 'swimmer', place: 'pool lane', speeds: [1, 2] },
          { thing: 'delivery robot', place: 'corridor', speeds: [1, 2, 3] },
          { thing: 'toy train', place: 'track', speeds: [1, 2] },
        ]);
        const speed = rng.pick(c.speeds);
        const dt = rng.int(2, 5);
        const t0 = rng.int(1, 4);
        const x1 = rng.int(1, 6) * 2;
        const x0 = x1 + speed * dt;
        return {
          text: `
            At $t = ${t0}$ s a ${c.thing} is at the **${x0} m** mark of a straight ${c.place}.
            At $t = ${t0 + dt}$ s the ${c.thing} is at the **${x1} m** mark.

            What is the ${c.thing}'s velocity? (Moving away from the 0 m mark counts as positive.)
          `,
          answer: -speed,
          unit: 'm/s',
          wrong: [
            [speed, 'The size is right. But the position is *shrinking*: it is heading back towards 0, so the velocity is negative.'],
            [x1 - x0, 'That is the change in position. Divide it by the time taken.'],
            [x0 - x1, 'That is how far it moved. Divide by the time taken, and mind the direction.'],
          ],
          hints: [
            r`Change in position = where it ends − where it starts: $${x1} - ${x0}$.`,
            r`That is $${x1 - x0}$ m in ${dt} s.`,
          ],
          explain: r`The position changes by $${x1} - ${x0} = ${x1 - x0}$ m in ${dt} s, so $v = \frac{${x1 - x0}}{${dt}} = ${-speed}$ m/s. The minus sign says it is moving back towards 0. On a graph, this line would slope **down**.`,
        };
      },
    },
    {
      id: 'teach-speed',
      type: 'info',
      title: 'Speed: the size of the velocity',
      text: r`
        **Speed** is the size of the velocity, without the direction.
        Velocities of $+3$ m/s and $-3$ m/s are the same speed, 3 m/s, in
        opposite directions.

        On the graph, speed is the **steepness** of the line, whichever way it
        tilts.

        :::example
        Stage A climbs 2 m in 2 s: velocity $+1$ m/s, speed 1 m/s.

        Stage B falls 6 m in 2 s: velocity $-3$ m/s, speed 3 m/s.

        B is the faster stage, although its velocity is negative.
        :::
      `,
      figure: {
        type: 'motion-graph', static: true, duration: 4, stage: 2, track: 8, xStep: 2, start: 4, velocities: [1, -3], stageLabels: ['A', 'B'],
        alt: 'A position–time graph in two 2-second stages. In stage A the line climbs gently from 4 metres to 6 metres. In stage B it falls steeply from 6 metres to 0.',
      },
    },
    {
      id: 'fastest-stage',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const trip = rng.pick([
          { start: 0, v: [3, 0, 1, -4] },
          { start: 0, v: [1, 3, -4, 0] },
          { start: 0, v: [2, 1, 0, -3] },
          { start: 2, v: [3, -4, 0, 2] },
          { start: 10, v: [-4, 0, 1, 2] },
          { start: 0, v: [4, 0, -2, 1] },
          { start: 2, v: [1, -2, 0, 4] },
          { start: 4, v: [-2, 4, 0, -1] },
        ]);
        const thing = rng.pick(['cart', 'robot', 'toy train', 'tram']);
        const letters = ['A', 'B', 'C', 'D'];
        const speeds = trip.v.map(Math.abs);
        const fastest = speeds.indexOf(Math.max(...speeds));
        const bestClimb = trip.v.indexOf(Math.max(...trip.v));
        const pos = [trip.start];
        trip.v.forEach((v, i) => pos.push(pos[i] + 2 * v));
        const highest = pos.indexOf(Math.max(...pos));
        const options = letters.map((letter, i) => {
          const v = trip.v[i];
          if (i === fastest) return { text: `Stage ${letter}`, correct: true, why: `${letter} is the steepest part of the graph: ${Math.abs(v) * 2} m in 2 s.` };
          let why = `In stage ${letter} the line is gentler than in stage ${letters[fastest]}.`;
          if (v === 0) why = `In stage ${letter} the line is flat. The position is not changing: the ${thing} is standing still.`;
          else if (i === bestClimb) why = `${letter} is the steepest *climb*, at ${v} m/s. But one stage is steeper still, going the other way.`;
          else if (i === highest - 1 && v > 0) why = `Stage ${letter} reaches the highest *position*, but the line is gentle there. Height shows where the ${thing} is, not how fast it goes.`;
          return { text: `Stage ${letter}`, why };
        });
        return {
          text: `A ${thing} makes a trip in four stages. **In which stage is it moving fastest?**`,
          figure: {
            type: 'motion-graph', static: true, duration: 8, stage: 2, track: 12, start: trip.start, velocities: trip.v, stageLabels: letters,
            alt: `A position–time graph in four 2-second stages. The position goes ${pos.map((p) => `${p} m`).join(', then ')}.`,
          },
          options,
          explain: trip.v[fastest] < 0
            ? r`Speed is the *steepness* of the line, whichever way it tilts. Stage ${letters[fastest]} is the steepest: a velocity of $${trip.v[fastest]}$ m/s, which is a speed of ${speeds[fastest]} m/s. **Speed** is the size of the velocity; the sign only tells you the direction.`
            : `Speed is the *steepness* of the line, whichever way it tilts. Stage ${letters[fastest]} is the steepest, at ${speeds[fastest]} m/s. A falling line can be just as fast as a climbing one: **speed** is the size of the velocity, and the sign only tells you the direction.`,
        };
      },
      shuffle: false,
      hints: ['Fast means the position changes a lot in a short time. Which piece of the line is steepest? The direction of the tilt does not matter.'],
    },
    {
      id: 'example-distance',
      type: 'info',
      title: 'Speed, distance and time',
      text: r`
        At a steady speed, three quantities are tied together:

        $$ \text{speed} = \frac{\text{distance}}{\text{time}} $$

        Know any two and you can work out the third.

        :::example
        A ferry crosses a harbour at a steady 7 m/s.

        - **Distance = speed × time.** In 12 s it covers $7 \times 12 = 84$ m.
        - **Time = distance ÷ speed.** To cover 35 m it needs $\frac{35}{7} = 5$ s.
        - **Speed = distance ÷ time.** 84 m in 12 s is $\frac{84}{12} = 7$ m/s.
        :::
      `,
    },
    {
      id: 'speed-time-distance',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { who: 'A sprinter', verb: 'runs', gerund: 'running', vs: [8, 9, 10], ts: [5, 6, 8, 10] },
          { who: 'A cyclist', verb: 'rides', gerund: 'riding', vs: [4, 5, 6, 8], ts: [10, 20, 30, 40] },
          { who: 'A hiker', verb: 'walks', gerund: 'walking', vs: [1, 2], ts: [30, 45, 60, 90] },
          { who: 'A high-speed train', verb: 'travels', gerund: 'travelling', vs: [50, 60, 70, 80], ts: [10, 20, 30] },
          { who: 'A city bus', verb: 'drives', gerund: 'driving', vs: [10, 12, 15], ts: [10, 20, 30] },
        ]);
        const v = rng.pick(c.vs);
        const t = rng.pick(c.ts);
        const d = v * t;
        const kind = rng.pick(['distance', 'time', 'speed']);
        if (kind === 'distance') {
          return {
            text: `${c.who} ${c.verb} at a steady **${v} m/s** for **${t} s**. What distance does that cover?`,
            answer: d,
            unit: 'm',
            wrong: [[v + t, 'Speed and time are multiplied, not added.'], [t / v, 'Dividing gives a tiny number. Every second adds another ' + v + ' m.']],
            hints: [`Every second adds ${v} m. There are ${t} seconds.`],
            explain: r`Distance = speed × time: $${v} \times ${t} = ${d}$ m.`,
          };
        }
        if (kind === 'time') {
          return {
            text: `${c.who} ${c.verb} at a steady **${v} m/s**. How long does a distance of **${d} m** take?`,
            answer: t,
            unit: 's',
            wrong: [[d * v, `Multiplying gives far too much. Ask: how many lots of ${v} m fit into ${d} m?`]],
            hints: [`Each second covers ${v} m. How many seconds make ${d} m?`],
            explain: r`Time = distance ÷ speed: $\frac{${d}}{${v}} = ${t}$ s.`,
          };
        }
        return {
          text: `${c.who} covers **${d} m** in **${t} s**, ${c.gerund} at a steady speed. What is that speed?`,
          answer: v,
          unit: 'm/s',
          wrong: [[t / d, 'That is seconds per metre. Speed is metres per second: distance on top.']],
          hints: ['Speed is how many metres are covered in each second.'],
          explain: r`Speed = distance ÷ time: $\frac{${d}}{${t}} = ${v}$ m/s.`,
        };
      },
    },
    {
      id: 'story',
      type: 'choice',
      text: `
        Maya walks slowly to the postbox, stops to post a letter, then **runs**
        back home. Position is measured from her front door.

        Which graph tells her story?
      `,
      figure: graphPanels([
        { label: 'A', pts: [[0, 0], [2, 9], [4, 9], [8, 0]] },
        { label: 'B', pts: [[0, 0], [4, 5], [6, 5], [8, 11.5]] },
        { label: 'C', pts: [[0, 0], [4, 9], [6, 9], [8, 0]] },
        { label: 'D', pts: [[0, 0], [5, 9], [8, 0]] },
      ], { alt: 'Four small position–time graphs. A: steep climb, flat, gentle fall to zero. B: gentle climb, flat, steep climb. C: gentle climb, flat, steep fall to zero. D: gentle climb then steep fall with no flat part.' }),
      shuffle: false,
      options: [
        { text: 'A', why: 'A climbs steeply and comes down gently: that is running there and strolling back.' },
        { text: 'B', why: 'B ends with a steep *climb*. Maya would be running further away from home, not back to it.' },
        { text: 'C', correct: true },
        { text: 'D', why: 'D never goes flat, so Maya never stops at the postbox.' },
      ],
      hints: ['Three parts: slow away, stopped, fast back. What does each one look like as a line?'],
      explain: `
        A gentle climb (walking away), a flat stretch (posting the letter), then a
        steep fall back to 0 (running home). Steep means fast; *falling* means
        coming back.
      `,
    },
    {
      id: 'delivery',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'Special delivery',
      text: `
        No target line this time, only orders:

        - reach the **10 m** mark at exactly **4 s**
        - wait there for **2 s**
        - be back at **0 m** when the clock shows **8 s**
      `,
      widget: { type: 'motion-graph', duration: 8, stage: 2, track: 12, vRange: [-5, 5] },
      check: (s) => {
        const at4 = s.positions[2];
        const at8 = s.positions[4];
        if (s.crashed) return 'The cart runs off the end of the track. Keep it between 0 and 12 m.';
        if (at4 < 10) return `After 4 s your cart has only reached ${at4} m. It has 10 m to cover in the first two stages.`;
        if (at4 > 10) return `After 4 s your cart is at ${at4} m: past the 10 m mark.`;
        if (s.velocities[2] !== 0) return 'From 4 s to 6 s the cart should wait: velocity 0.';
        if (at8 !== 0) return `At 8 s the cart is still ${at8} m from home. It has 10 m to cover in the last 2 s, and it must head *back*.`;
        return true;
      },
      solution: { velocities: [3, 2, 0, -5] },
      hints: [
        'The first two stages together must cover 10 m. Each stage lasts 2 s.',
        'The trip home is 10 m in a single 2-second stage. What velocity is that, and with which sign?',
      ],
      explain: r`
        One way: $3$ m/s then $2$ m/s covers $6 + 4 = 10$ m in 4 s. Wait with $0$ m/s.
        Then $-10$ m in 2 s needs $v = \frac{-10}{2} = -5$ m/s.

        Any two first velocities that add up to 5 work. Either way the *average*
        velocity over those 4 s is $\frac{10}{4} = 2.5$ m/s.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      text: 'Sort each clue by what the object is doing.',
      buckets: ['Moving forwards', 'Standing still', 'Moving back'],
      items: [
        ['The line climbs steeply', 0],
        ['The line is flat', 1],
        ['The line falls gently', 2],
        [r`$v = -3$ m/s`, 2],
        ['Position stays at 7 m', 1],
        ['Position goes from 2 m to 9 m', 0],
        ['The slope is zero', 1],
      ],
      explain: 'A climbing line is a positive velocity: forwards. A flat line is zero velocity: at rest. A falling line is a negative velocity: coming back.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend looks at a hill-shaped position–time graph and says:
        "Easy. It went up a hill and came down again."

        **What would you say to put them right?**
      `,
      model: `
        The graph is not a picture of the path. Its height is the **position**: how
        far along the track the object is at each moment. A line that climbs and
        then falls means the position grew and then shrank, so the object moved
        away and came back. How *steep* the line is tells you how fast.
      `,
    },
  ],
  recap: [
    'A position–time graph shows *where* something is at each moment. It is not a picture of the path.',
    'The slope of the line is the **velocity**: change in position ÷ time taken.',
    'Steeper means faster. Flat means at rest. A falling line means moving back: a negative velocity.',
    'Speed is the size of the velocity, and distance = speed × time.',
  ],
  next: 'Next: what does motion look like when the speed itself keeps changing?',
};
