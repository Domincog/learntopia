// Physics: Motion & Forces · Lesson 6 · Collisions
import { r, num } from '../../../kit.js';
import { aAn } from '../helpers.js';

const LAB = { type: 'collision-lab', m1: 3, v1: 4, m2: 1, v2: 0, mode: 'sticky' };

export default {
  id: 'momentum',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'After the bump',
      text: `
        Cart A has a mass of 3 kg and rolls at 4 m/s towards cart B, which has
        a mass of 1 kg and is standing still. When they meet they **stick
        together**.

        How fast does the pair move afterwards?
      `,
      figure: { ...LAB, static: true, show: 'start', bars: false, alt: 'Cart A, 3 kilograms, moving right at 4 metres per second towards cart B, 1 kilogram, at rest.' },
      shuffle: false,
      options: [
        { text: '4 m/s: A just carries B along' },
        { text: '3 m/s', correct: true },
        { text: '2 m/s: half-way between 4 and 0' },
        { text: '1 m/s' },
      ],
      explain: 'The pair moves off at 3 m/s: slower than A was, but not half as fast. Run the collision on the next screen and look for what stays the same.',
    },
    {
      id: 'sticky-lab',
      type: 'interact',
      graded: false,
      title: 'Look for what survives',
      text: `
        **Press Go.** The bars show each cart's *mass × velocity*, before and
        after the collision.

        Then make cart B heavier and run it again, at least twice more. Keep an
        eye on the **Total** row.
      `,
      widget: { ...LAB, m2Range: [1, 6, 1] },
      check: (s) => {
        const tried = new Set(s.history.map((run) => run.m2));
        if (tried.size >= 3) return true;
        if (!tried.size) return 'Press **Go** to run the collision.';
        return `Change the mass of B and run it again (${tried.size} of 3 different masses so far). What happens to the Total row each time?`;
      },
      solution: { m2: 5, history: [{ m2: 1 }, { m2: 3 }, { m2: 5 }] },
      explain: `
        The heavier B is, the slower the pair moves off. But in every run the
        **Total** is 12 before and 12 after.

        Cart A loses some of its *mass × velocity*, and cart B gains exactly
        that much.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Momentum',
      text: r`
        Mass × velocity is called **momentum**:

        $$ p = m \times v $$

        It is measured in $\text{kg·m/s}$, and like velocity it has a direction:
        here, positive to the right and negative to the left.

        :::example
        Cart A, 3 kg, moving right at 4 m/s, has
        $\mathord{p = 3 \times 4 = 12}$ kg·m/s: the 12 in the Total row.

        A 2 kg cart moving **left** at 6 m/s has
        $\mathord{p = 2 \times (-6) = -12}$ kg·m/s.
        :::
      `,
    },
    {
      id: 'find-momentum',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { thing: 'bowling ball', m: [5, 6, 7], v: [4, 5, 8] },
          { thing: 'football', m: [0.4, 0.5], v: [10, 20, 30] },
          { thing: 'ice skater', m: [50, 60, 70], v: [3, 5, 8] },
          { thing: 'car', m: [1000, 1200, 1500], v: [10, 20, 30] },
          { thing: 'railway wagon', m: [20000, 30000], v: [1, 2, 3] },
        ]);
        const m = rng.pick(c.m);
        const v = rng.pick(c.v);
        const left = rng.bool(0.4);
        const p = m * v * (left ? -1 : 1);
        return {
          text: `A **${num(m)} kg** ${c.thing} is moving to the **${left ? 'left' : 'right'}** at **${v} m/s**. Taking right as positive, what is its momentum?`,
          answer: p,
          unit: 'kg·m/s',
          wrong: [
            [-p, left ? 'The size is right. But it is moving left, and left is the negative direction here.' : 'It is moving right, which is the positive direction.'],
            [m + v, 'Momentum is mass *times* velocity.'],
            [0.5 * m * v * v, 'That is the kinetic energy. Momentum is simply mass × velocity.'],
          ],
          hints: [r`$p = m \times v$, with a minus sign if it is moving left.`],
          explain: r`$p = m \times v = ${num(m)} \times ${left ? `(-${v})` : v} = ${num(p)}$ kg·m/s.${left ? ' Negative, because it is moving left.' : ''}`,
        };
      },
    },
    {
      id: 'teach-conserved',
      type: 'info',
      title: 'Momentum is conserved',
      text: r`
        :::key
        In any collision, the **total momentum** of the things colliding is
        the same afterwards as it was before, as long as nothing outside
        pushes on them. Momentum is **conserved**.
        :::

        When two things stick together, that total is shared by their
        combined mass.

        :::example
        A 6 kg trolley rolls at 5 m/s into a 4 kg trolley at rest. They stick.

        1. Before: $6 \times 5 = 30$ kg·m/s. The trolley at rest has none.
        2. After: $6 + 4 = 10$ kg share that same 30 kg·m/s.
        3. Speed: $\frac{30}{10} = 3$ m/s.
        :::
      `,
      figure: { type: 'collision-lab', m1: 6, v1: 5, m2: 4, v2: 0, mode: 'sticky', static: true, show: 'end', alt: 'A 6 kilogram cart and a 4 kilogram cart moving off together at 3 metres per second after colliding. The momentum bars show a total of 30 before the collision and 30 after it.' },
    },
    {
      id: 'share-it',
      type: 'interact',
      attempts: 6,
      title: 'Share it out',
      text: `
        Cart A (3 kg) arrives at 4 m/s again and sticks to cart B.

        **Choose the mass of B so that the pair moves off at exactly 2 m/s.**
      `,
      widget: { ...LAB, m2: 1, m2Range: [1, 6, 1] },
      check: (s) => {
        if (!s.ran) return 'Press **Go** to test this mass.';
        if (s.u1 === 2) return true;
        const total = s.m1 + s.m2;
        return s.u1 > 2
          ? `Too fast: the pair moves at ${num(s.u1, 2)} m/s. The same 12 kg·m/s is being shared by only ${total} kg.`
          : `Too slow: the pair moves at ${num(s.u1, 2)} m/s. The 12 kg·m/s is being shared by ${total} kg.`;
      },
      solution: { m2: 3 },
      hints: [
        'The total momentum is 12 kg·m/s before, so it is 12 kg·m/s after.',
        'Afterwards the two carts are one object. What total mass moves at 2 m/s with a momentum of 12 kg·m/s?',
      ],
      explain: r`
        The total momentum is $3 \times 4 = 12$ kg·m/s, before and after. At
        2 m/s, a momentum of 12 needs a total mass of $\frac{12}{2} = 6$ kg, so
        B must be $6 - 3 = 3$ kg.
      `,
    },
    {
      id: 'sticky-speed',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { unit: 10, sizes: [1, 2, 3, 4, 5], maxV: 6, say: (x, vv, y) => `A loaded trolley with a mass of **${x} kg** rolls at **${vv} m/s** into an empty trolley with a mass of **${y} kg** that is standing still. They lock together.` },
          { unit: 10000, sizes: [1, 2, 3, 4, 5], maxV: 6, say: (x, vv, y) => `A railway wagon with a mass of **${x} kg** rolls at **${vv} m/s** into a stationary wagon with a mass of **${y} kg**. They couple together.` },
          { unit: 20, sizes: [2, 3, 4], maxV: 8, say: (x, vv, y) => `An ice skater with a mass of **${x} kg** glides at **${vv} m/s** into a friend with a mass of **${y} kg**, who is standing still. They hold on to each other.` },
          { unit: 1, sizes: [1, 2, 3, 4, 5], maxV: 12, say: (x, vv, y) => `A lump of clay with a mass of **${x} kg**, moving at **${vv} m/s**, hits a **${y} kg** lump that is at rest. They stick together.` },
        ]);
        // work backwards from a whole-number answer; unequal masses, so "half the speed" is never right
        const combos = [];
        for (const a of scene.sizes) for (const b of scene.sizes) for (let vAfter = 1; vAfter <= 4; vAfter++) {
          const vBefore = ((a + b) * vAfter) / a;
          if (a !== b && Number.isInteger(vBefore) && vBefore <= scene.maxV) combos.push([a, b, vAfter, vBefore]);
        }
        const [a, b, v, v1] = rng.pick(combos);
        const m1 = a * scene.unit;
        const m2 = b * scene.unit;
        return {
          text: `${scene.say(num(m1), v1, num(m2))} How fast do they move afterwards? (Ignore friction.)`,
          answer: v,
          unit: 'm/s',
          wrong: [
            [v1 / 2, 'It is not simply half the speed. Share the *momentum* out over the total mass.'],
            [v1, 'The same momentum now has to move more mass, so the speed must drop.'],
            [(m1 * v1) / m2, 'Afterwards both masses move together. Divide by the total mass, not just the second one.'],
          ],
          hints: [
            r`Momentum before: $${num(m1)} \times ${v1}$. Nothing else is moving.`,
            `Afterwards that same momentum belongs to ${num(m1 + m2)} kg moving as one.`,
          ],
          explain: r`Before: $${num(m1)} \times ${v1} = ${num(m1 * v1)}$ kg·m/s. After, the combined mass is $${num(m1)} + ${num(m2)} = ${num(m1 + m2)}$ kg, so $v = \frac{${num(m1 * v1)}}{${num(m1 + m2)}} = ${v}$ m/s.`,
        };
      },
    },
    {
      id: 'head-on',
      type: 'interact',
      attempts: 6,
      title: 'Head-on',
      text: `
        Now B is moving too. Cart A (2 kg) rolls right at 3 m/s. Cart B has a
        mass of 3 kg.

        **Choose B's velocity so that the two carts stop dead when they
        stick together.**
      `,
      widget: { type: 'collision-lab', m1: 2, v1: 3, m2: 3, v2: 0, mode: 'sticky', v2Range: [-4, 2, 1] },
      check: (s) => {
        if (!s.ran) return 'Press **Go** to test this velocity.';
        if (s.together && s.u1 === 0) return true;
        if (!s.collides) return 'B is running away from A just as fast as A is chasing it, so they never meet. Send B *towards* A.';
        if (s.v2 >= 0) return `The pair still drifts right at ${num(s.u1, 2)} m/s. To cancel A's momentum, B has to come the other way: give it a negative velocity.`;
        return s.pBefore > 0
          ? `Not enough: the total momentum is still ${num(s.pBefore)} kg·m/s to the right, so the pair drifts right.`
          : `Too much: the total momentum is now ${num(-s.pBefore)} kg·m/s to the left, so the pair drifts left.`;
      },
      solution: { v2: -2 },
      hints: [
        'If the pair ends up at rest, the total momentum afterwards is zero. So it must be zero before as well.',
        r`A has $2 \times 3 = +6$ kg·m/s. B must bring exactly $-6$ kg·m/s.`,
      ],
      explain: r`
        A carries $2 \times 3 = +6$ kg·m/s. B carries $3 \times (-2) = -6$ kg·m/s.
        The total is **zero**, before and after, so the pair ends up at rest.

        Momentum has a direction, and opposite momenta cancel.
      `,
    },
    {
      id: 'bounce-predict',
      type: 'choice',
      mode: 'predict',
      title: 'Now they bounce',
      text: `
        Swap the sticky pads for springy bumpers, so the carts bounce apart
        without losing any kinetic energy.

        Cart A rolls at 4 m/s into an **identical** cart B, which is at rest.
        What happens?
      `,
      options: [
        { text: 'A stops dead and B moves off at 4 m/s', correct: true },
        { text: 'Both move on together at 2 m/s' },
        { text: 'A bounces back at 4 m/s and B stays put' },
        { text: 'A slows to 2 m/s and B moves off at 2 m/s' },
      ],
      explain: 'A stops dead and hands **all** its momentum to B. You may have seen this in a row of swinging steel balls, or when one coin slides into another.',
    },
    {
      id: 'bounce-lab',
      type: 'interact',
      graded: false,
      title: 'Heavy and light',
      text: `
        Run the identical carts first. Then try it with **A heavier than B**,
        and with **A lighter than B**.

        Each time, check the Total row, and the kinetic energy row too.
      `,
      widget: { type: 'collision-lab', m1: 2, v1: 4, m2: 2, v2: 0, mode: 'bouncy', m1Range: [1, 6, 1], m2Range: [1, 6, 1], energy: true },
      check: (s) => {
        const heavier = s.history.some((run) => run.m1 > run.m2);
        const lighter = s.history.some((run) => run.m1 < run.m2);
        if (heavier && lighter) return true;
        if (!s.history.length) return 'Press **Go** to run the collision.';
        if (!heavier) return 'Now make A **heavier** than B and run it.';
        return 'Now make A **lighter** than B and run it.';
      },
      solution: { m1: 1, m2: 4, history: [{ m1: 2, m2: 2 }, { m1: 5, m2: 2 }, { m1: 1, m2: 4 }] },
      explain: `
        Equal carts swap velocities. A heavy cart ploughs on and sends the
        light one flying ahead. A light cart bounces **back** off a heavy one.

        The results look completely different, yet the total momentum is the
        same before and after every single time.
      `,
    },
    {
      id: 'teach-sticky-bouncy',
      type: 'info',
      title: 'Sticky or bouncy',
      text: r`
        The two kinds of collision differ in what happens to the kinetic
        energy, and agree about the momentum.

        - **Sticky:** the carts lock together, and some of the kinetic
          energy turns into heat and sound.
        - **Perfectly bouncy:** the carts spring apart, and the total kinetic
          energy is the same afterwards.
        - **Both:** the total momentum does not change. Whatever momentum
          one cart loses, the other gains.

        :::example
        The first collision of this lesson, 3 kg at 4 m/s sticking to 1 kg:
        the momentum is 12 kg·m/s before and after, but the kinetic energy
        drops from 24 J to 18 J.
        :::
      `,
      figure: { ...LAB, energy: true, static: true, show: 'end', alt: 'The 3 kilogram and 1 kilogram carts moving off together at 3 metres per second. The momentum total is 12 before and after; the kinetic energy row shows 24 joules before and 18 joules after.' },
    },
    {
      id: 'always-true',
      type: 'multi',
      review: true,
      text: 'Two carts collide on a frictionless track. Which of these are true for **every** such collision, sticky or bouncy?',
      options: [
        { text: 'The total momentum afterwards equals the total momentum before', correct: true },
        { text: 'Whatever momentum one cart loses, the other gains', correct: true },
        { text: 'The total kinetic energy afterwards equals the total before', why: 'Only in a perfectly bouncy collision. When carts stick, some kinetic energy turns into heat and sound, yet momentum is still conserved.' },
        { text: 'Both carts end up moving in the same direction', why: 'Not always: a light cart can bounce back off a heavy one, and head-on carts can stop dead.' },
        { text: 'The heavier cart ends up with the greater speed', why: 'Not so. When they stick, both end up with the same speed. And when a heavy cart bounces a light one away, it is the light one that shoots off faster.' },
      ],
      explain: 'Momentum is conserved in every collision. Kinetic energy is not: in a sticky collision part of it becomes heat. That is what makes momentum such a dependable tool for crashes.',
    },
    {
      id: 'spread-the-stop',
      type: 'info',
      title: 'Why soft landings are safer',
      text: r`
        To stop a moving passenger, their momentum must be taken away. A force
        does that, and the longer it acts, the more momentum it removes:

        :::key
        Force × time = change in momentum
        :::

        :::example
        A 2 kg ball arrives at 6 m/s and is caught. Momentum to remove:
        $2 \times 6 = 12$ kg·m/s.

        - Stiff hands, 0.1 s: $\frac{12}{0.1} = 120$ N of force.
        - Hands that give, 0.5 s: $\frac{12}{0.5} = 24$ N.
        :::

        The change in momentum is fixed by the crash. So if the stop can be
        made to **take longer**, the force needed is **smaller**. That is the
        whole job of crumple zones, airbags, seat belts that stretch, cycle
        helmets and bending your knees when you land.
      `,
    },
    {
      id: 'stop-force',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        const m = rng.pick([60, 70, 80]);
        const v = rng.pick([10, 15, 20]);
        const perSecond = rng.pick([10, 5]);         // the stop takes 1/10 s or 1/5 s (0.5 s would mean metres of travel inside the car)
        const t = 1 / perSecond;
        const p = m * v;
        const F = p * perSecond;
        const hard = p * 100;
        return {
          text: `In a crash test ${aAn(m)} **${m} kg** dummy is moving at **${v} m/s** when the car hits a wall. The seat belt and airbag bring it to rest in **${t} s**. What average force do they put on the dummy?`,
          answer: F,
          unit: 'N',
          wrong: [
            [p, 'That is the momentum that has to be removed. Divide it by the time the stop takes.'],
            [p * t, 'Multiplying by the time goes the wrong way: a longer stop needs *less* force. Divide instead.'],
          ],
          hints: [
            r`Change in momentum: $${m} \times ${v} = ${num(p)}$ kg·m/s.`,
            'Force = change in momentum ÷ time.',
          ],
          explain: r`Momentum to remove: $${m} \times ${v} = ${num(p)}$ kg·m/s. Force $= \frac{${num(p)}}{${t}} = ${num(F)}$ N. Stopped by a hard dashboard in 0.01 s, the same dummy would feel $\frac{${num(p)}}{0.01} = ${num(hard)}$ N: ${num(hard / F)} times as much.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Modern cars are built so that the front **crumples** in a crash,
        instead of staying rigid.

        **Explain why a car that crumples protects the people inside better.**
      `,
      model: `
        In a crash, the passengers' momentum has to drop to zero whatever the
        car is made of. A rigid car stops almost instantly, so that change in
        momentum happens in a very short time and needs a huge force. A front
        that crumples makes the stop last longer. Force × time is the same, so
        with more time the force on the passengers is much smaller.
      `,
    },
  ],
  recap: [
    r`**Momentum** is mass × velocity, $p = m v$, and it has a direction.`,
    'In every collision the total momentum before equals the total momentum after.',
    'Sticky collisions lose kinetic energy to heat; perfectly bouncy ones keep it. Momentum is conserved in both.',
    'Force × time = change in momentum, so a longer stop means a smaller force.',
  ],
  next: 'That completes the course: motion, forces, energy and momentum. The ideas will keep coming back in your reviews.',
};
