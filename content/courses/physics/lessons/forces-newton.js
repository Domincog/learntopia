// Physics: Motion & Forces · Lesson 3 · Pushes and Pulls
import { r } from '../../../kit.js';
import { forceDiagram, G } from '../helpers.js';

export default {
  id: 'forces-newton',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'After the shove',
      text: `
        You give a block a shove across a frozen lake and let go. Imagine the
        ice is **perfectly** slippery: no friction at all, and no air.

        Nothing is pushing the block any more. What happens to its speed?
      `,
      shuffle: false,
      options: [
        { text: 'It gradually slows down and stops' },
        { text: 'It stays exactly the same' },
        { text: 'It keeps increasing' },
      ],
      answer: 1,
      explain: 'It never changes. With nothing pushing forwards **and nothing pushing back**, the block glides on at the same speed for as long as the ice lasts. See for yourself on the next screen.',
    },
    {
      id: 'ice',
      type: 'interact',
      graded: false,
      title: 'Less and less friction',
      text: `
        A 2 kg block has been shoved and is sliding at 6 m/s. The only force
        along the ice is friction.

        **Press Go. Then turn the friction down, step by step, all the way to
        zero**, running it again each time.
      `,
      widget: {
        type: 'force-cart', body: 'block', mass: 2, v0: 6, push: 0, friction: 3, frictionRange: [0, 4, 1],
        duration: 6, length: 40, vMax: 8,
      },
      check: (s) => {
        if (s.friction > 0) return 'Turn the friction all the way down to 0 N and run it again.';
        if (!s.ran) return 'Press **Go** to see what the block does with no friction.';
        return true;
      },
      solution: { friction: 0 },
      explain: `
        The less friction, the further the block glides. With none at all, the
        velocity line is perfectly flat: the block never slows down.

        Nothing is pushing it along. Nothing needs to.
      `,
    },
    {
      id: 'first-law',
      type: 'info',
      title: "Newton's first law",
      text: `
        An object keeps its velocity, both speed *and* direction, unless a
        **net force** acts on it: a push or a pull that nothing else cancels.

        - At rest, it stays at rest.
        - Moving, it keeps moving in a straight line at the same speed.

        Things on Earth slow down because friction and air resistance are
        **forces**, not because motion "runs out". Take those forces away and
        the motion simply continues.
      `,
    },
    {
      id: 'teach-net-force',
      type: 'info',
      title: 'Forces add up',
      text: r`
        A **force** is a push or a pull with a direction. It is measured in
        **newtons** (N): holding up a small apple takes about 1 N.

        What changes a velocity is the **net force**: forces in the same
        direction add, opposite ones subtract.

        :::example
        A dog pulls a sledge with 70 N. Its owner helps with 20 N. Friction
        pulls back with 30 N.

        - Forwards: $70 + 20 = 90$ N
        - Net force: $90 - 30 = 60$ N, forwards
        :::

        If the forces cancel exactly, the net force is zero. They are
        **balanced**, and the velocity does not change.
      `,
      figure: forceDiagram([{ n: 70, dir: 'right', label: 'dog' }, { n: 20, dir: 'right', label: 'owner' }, { n: 30, dir: 'left', label: 'friction' }], { alt: 'A sledge pulled to the right with 70 newtons and 20 newtons, with 30 newtons of friction to the left.' }),
    },
    {
      id: 'net-force',
      type: 'fill',
      title: 'Adding forces',
      gen: (rng) => {
        const scene = rng.pick(['crate', 'tug', 'car']);
        if (scene === 'crate') {
          const push = rng.int(5, 12) * 5;
          const friction = rng.int(2, push / 5 - 2) * 5;
          return {
            text: `
              The **net force** is what is left when you add the forces up, with
              opposite directions cancelling.

              You push a crate with ${push} N. Friction pushes back with ${friction} N.
            `,
            figure: forceDiagram([{ n: push, dir: 'right', label: 'push' }, { n: friction, dir: 'left', label: 'friction' }], { alt: `A crate with a ${push} newton push to the right and ${friction} newtons of friction to the left.` }),
            template: `Net force: [[${push - friction}]] N to the [[left|*right]].`,
            explain: r`The two forces pull in opposite directions, so subtract: $${push} - ${friction} = ${push - friction}$ N, in the direction of the bigger one.`,
          };
        }
        if (scene === 'tug') {
          const left = rng.int(8, 12) * 50;
          const right = left - rng.int(1, 3) * 50;
          return {
            text: `
              The **net force** is what is left when you add the forces up, with
              opposite directions cancelling.

              In a tug of war, one team pulls the rope left with ${left} N. The other pulls right with ${right} N.
            `,
            figure: forceDiagram([{ n: right, dir: 'right', label: 'team B' }, { n: left, dir: 'left', label: 'team A' }], { alt: `A block pulled left with ${left} newtons and right with ${right} newtons.` }),
            template: `Net force: [[${left - right}]] N to the [[*left|right]].`,
            explain: r`Opposite directions, so subtract: $${left} - ${right} = ${left - right}$ N, towards the stronger team.`,
          };
        }
        const a = rng.int(4, 6) * 50;
        const b = rng.int(3, 5) * 50;
        const friction = rng.int(4, 6) * 50;
        const net = a + b - friction;
        return {
          text: `
            The **net force** is what is left when you add the forces up, with
            opposite directions cancelling.

            Two friends push a broken-down car with ${a} N and ${b} N. Friction pushes back with ${friction} N.
          `,
          figure: forceDiagram([{ n: a, dir: 'right', label: 'push' }, { n: b, dir: 'right', label: 'push' }, { n: friction, dir: 'left', label: 'friction' }], { alt: `A car pushed to the right with ${a} and ${b} newtons, with ${friction} newtons of friction to the left.` }),
          template: `Net force: [[${net}]] N to the [[left|*right]].`,
          explain: r`Forces in the same direction add: $${a} + ${b} = ${a + b}$ N forwards. Friction takes away ${friction} N, leaving $${a + b} - ${friction} = ${net}$ N forwards.`,
        };
      },
    },
    {
      id: 'balance',
      type: 'interact',
      title: 'Keep it steady',
      text: `
        This crate is already sliding at **4 m/s**. Friction pulls back on it
        with 3 N.

        **Choose the push that keeps it moving at a steady 4 m/s.** Press Go to
        test each choice.
      `,
      widget: {
        type: 'force-cart', body: 'crate', mass: 2, v0: 4, friction: 3, push: 0, pushRange: [0, 8, 1],
        duration: 5, length: 60, vMax: 16,
      },
      check: (s) => {
        if (!s.ran) return 'Press **Go** to test your choice.';
        if (s.steady) return true;
        if (s.push > s.friction) return `The crate speeds up: your push is bigger than the friction, so ${s.net} N of net force is left over. A steady speed needs **zero** net force.`;
        if (s.push === 0) return 'With no push, friction is the only force. It slows the crate until it stops.';
        return 'The crate slows down: friction is bigger than your push, so the net force points backwards.';
      },
      solution: { push: 3 },
      hints: [
        'A steady velocity means no acceleration. What must the net force be then?',
        'The push has to cancel the 3 N of friction exactly.',
      ],
      explain: `
        A push of 3 N exactly cancels the 3 N of friction. The net force is
        zero, so the velocity does not change: the crate carries on at 4 m/s.

        Balanced forces do not mean "at rest". They mean **no change in velocity**.
      `,
    },
    {
      id: 'steady',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { text: `A skydiver with her parachute open drifts down at a **steady** ${rng.pick([5, 6, 7])} m/s. Gravity pulls her down with ${rng.pick([600, 700, 800])} N.`, ask: 'How big is the air resistance pushing up on her?', other: 'gravity', extra: 'she would be falling faster and faster', less: 'she would be slowing down' },
          { text: `A car cruises along a straight motorway at a **steady** ${rng.pick([25, 30])} m/s. Its engine drives it forwards with ${rng.pick([800, 900, 1000])} N.`, ask: 'How big are friction and air resistance together, pushing back on it?', other: 'the driving force', extra: 'the car would be speeding up', less: 'the car would be slowing down' },
          { text: `A cyclist rides along a flat road at a **steady** ${rng.pick([7, 8, 9])} m/s, driving the bike forwards with ${rng.pick([30, 40, 50])} N.`, ask: 'How big are friction and air resistance together, pushing back on her?', other: 'the driving force', extra: 'she would be speeding up', less: 'she would be slowing down' },
        ]);
        const n = Number(/(\d+) N/.exec(c.text)[1]);
        return {
          text: `${c.text}\n\n${c.ask}`,
          options: [
            { text: `Exactly ${n} N`, correct: true },
            { text: `Less than ${n} N`, why: `Then ${c.other} would win and there would be a net force in the direction of motion: ${c.extra}. But the speed is steady.` },
            { text: `More than ${n} N`, why: `Then the net force would point against the motion and ${c.less}. But the speed is steady.` },
            { text: 'Zero', why: 'Then nothing would balance the other force, and the speed would keep changing.' },
          ],
          explain: `Steady speed in a straight line means zero net force, so the two forces must cancel exactly: ${n} N each way. A force is needed to *change* a velocity, not to keep one.`,
        };
      },
    },
    {
      id: 'two-ways',
      type: 'interact',
      attempts: 6,
      title: 'What sets the acceleration?',
      text: r`
        Now a cart on a smooth track, starting from rest. You choose the push
        and the mass.

        **Find two different combinations that both give an acceleration of
        exactly $3 \text{ m/s}^2$.** Each run is added to the list below.
      `,
      widget: {
        type: 'force-cart', body: 'cart', mass: 1, push: 2, pushRange: [1, 12, 1], massRange: [1, 6, 1],
        duration: 4, length: 100, vMax: 24, log: true,
      },
      check: (s) => {
        const hits = new Set(s.history.filter((run) => run.a === 3).map((run) => `${run.push}/${run.mass}`));
        if (hits.size >= 2) return true;
        const last = s.history[s.history.length - 1];
        if (!last) return 'Press **Go** to measure the acceleration.';
        if (hits.size === 1 && last.a === 3) return 'That is one way. Now find a *different* push and mass that give the same 3 m/s².';
        if (last.a > 3) return `That run gave ${last.a} m/s²: too much. Push less hard, or add mass.`;
        return `That run gave ${last.a} m/s²: too little. Push harder, or take some mass off.`;
      },
      solution: { push: 9, mass: 3, history: [{ push: 6, mass: 2 }, { push: 9, mass: 3 }] },
      hints: [
        'Start with 6 N on 2 kg and read the acceleration.',
        'Now make the cart heavier. What happens to the acceleration, and how could a bigger push make up for it?',
      ],
      explain: r`
        Every winning pair has the same ratio: 3 N on 1 kg, 6 N on 2 kg, 9 N on
        3 kg, 12 N on 4 kg. Each time, push ÷ mass $= 3$.

        Doubling the push doubles the acceleration. Doubling the mass halves it.
      `,
    },
    {
      id: 'second-law',
      type: 'info',
      title: "Newton's second law",
      text: r`
        That ratio is the rule for all motion:

        $$ a = \frac{F_{\text{net}}}{m} \qquad \text{or} \qquad F_{\text{net}} = m \times a $$

        $F_{\text{net}}$ is the net force in newtons, $a$ the acceleration in
        $\text{m/s}^2$, and $m$ the **mass** in kilograms: how hard the object
        is to speed up or slow down.

        :::example
        A net force of 60 N acts on a 15 kg sledge.

        - **Acceleration:** $a = \frac{60}{15} = 4 \text{ m/s}^2$.
        - **Force:** $15 \times 2 = 30$ N would give it a gentler
          $2 \text{ m/s}^2$.
        - **Mass:** $\frac{60}{4} = 15$ kg is what 60 N speeds up at
          $4 \text{ m/s}^2$.
        :::

        One newton is the net force that gives 1 kg an acceleration of
        $1 \text{ m/s}^2$.
      `,
    },
    {
      id: 'f-equals-ma',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { thing: 'a shopping trolley', ms: [10, 20, 25], as: [1, 2, 3] },
          { thing: 'a small car', ms: [800, 1000, 1200], as: [2, 3, 4] },
          { thing: 'a loaded sledge', ms: [30, 40, 50], as: [1, 2] },
          { thing: 'a rider and bicycle', ms: [70, 80, 90], as: [1, 2] },
          { thing: 'a motorbike and rider', ms: [200, 250, 300], as: [3, 4, 5] },
        ]);
        const m = rng.pick(c.ms);
        const a = rng.pick(c.as);
        const F = m * a;
        const kind = rng.pick(['a', 'F', 'm']);
        if (kind === 'a') {
          return {
            text: r`A net force of **${F} N** acts on ${c.thing} with a mass of **${m} kg**. What is the acceleration?`,
            answer: a,
            unit: 'm/s²',
            wrong: [[F * m, 'Multiplying gives something enormous. More mass means *less* acceleration, so divide by the mass.'], [m / F, 'That is upside down: acceleration is net force ÷ mass.']],
            hints: [r`$a = \frac{F_{\text{net}}}{m}$`],
            explain: r`$a = \frac{F_{\text{net}}}{m} = \frac{${F}}{${m}} = ${a} \text{ m/s}^2$.`,
          };
        }
        if (kind === 'F') {
          return {
            text: r`What net force is needed to give ${c.thing} with a mass of **${m} kg** an acceleration of **$${a} \text{ m/s}^2$**?`,
            answer: F,
            unit: 'N',
            wrong: [[m / a, 'Dividing would mean heavier things need *less* force. They need more: multiply.'], [m + a, 'Mass and acceleration are multiplied, not added.']],
            hints: [r`$F_{\text{net}} = m \times a$`],
            explain: r`$F_{\text{net}} = m \times a = ${m} \times ${a} = ${F}$ N.`,
          };
        }
        return {
          text: r`A net force of **${F} N** gives ${c.thing} an acceleration of **$${a} \text{ m/s}^2$**. What is the mass?`,
          answer: m,
          unit: 'kg',
          wrong: [[F * a, 'Multiplying makes it far too big. Rearrange $F = ma$ to get the mass alone.']],
          hints: [r`From $F_{\text{net}} = m \times a$: divide the force by the acceleration.`],
          explain: r`$m = \frac{F_{\text{net}}}{a} = \frac{${F}}{${a}} = ${m}$ kg.`,
        };
      },
    },
    {
      id: 'example-friction',
      type: 'info',
      title: 'Several forces? Net force first',
      text: r`
        The $F$ in the rule is the **net** force. When more than one force
        acts, work out the net force first, then divide by the mass.

        :::example
        A 15 kg sledge is pulled with 80 N. Friction pulls back with 20 N.

        1. Net force: $80 - 20 = 60$ N.
        2. Acceleration: $a = \frac{60}{15} = 4 \text{ m/s}^2$.
        :::

        Dividing the 80 N pull by the mass would give too big an answer:
        friction cancels 20 N of it.
      `,
      figure: forceDiagram([{ n: 80, dir: 'right', label: 'pull' }, { n: 20, dir: 'left', label: 'friction' }], { mass: '15 kg', alt: 'A 15 kilogram sledge with an 80 newton pull to the right and 20 newtons of friction to the left.' }),
    },
    {
      id: 'with-friction',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        // pick numbers for which the three classic slips all give different answers
        let m;
        let a;
        let friction;
        let push;
        for (let tries = 0; tries < 40; tries++) {
          m = rng.pick([2, 4, 5, 10]);
          a = rng.int(1, 4);
          friction = rng.int(1, 5) * (m >= 5 ? 5 : 2);
          push = m * a + friction;
          if (new Set([a, push / m, (push + friction) / m, push - friction]).size === 4) break;
        }
        return {
          text: r`A **${m} kg** crate is pushed across a floor with **${push} N**. Friction pushes back with **${friction} N**. What is the crate's acceleration?`,
          figure: forceDiagram([{ n: push, dir: 'right', label: 'push' }, { n: friction, dir: 'left', label: 'friction' }], { mass: `${m} kg`, alt: `A ${m} kilogram crate with a ${push} newton push to the right and ${friction} newtons of friction to the left.` }),
          answer: a,
          unit: 'm/s²',
          wrong: [
            [push / m, 'That uses the push alone. It is the **net** force that sets the acceleration: take the friction off first.'],
            [(push + friction) / m, 'Friction acts *against* the push, so subtract it rather than adding.'],
            [push - friction, `That is the net force, in newtons. Now divide by the ${m} kg.`],
          ],
          hints: ['First find the net force.', r`Net force $= ${push} - ${friction} = ${push - friction}$ N. Now use $a = \frac{F_{\text{net}}}{m}$.`],
          explain: r`Net force $= ${push} - ${friction} = ${push - friction}$ N. Then $a = \frac{${push - friction}}{${m}} = ${a} \text{ m/s}^2$.`,
        };
      },
    },
    {
      id: 'teach-weight',
      type: 'info',
      title: 'Mass and weight',
      text: r`
        Everyday speech mixes these two up. Physics keeps them apart.

        - **Mass**, in kilograms, says how hard an object is to speed up or
          slow down.
        - **Weight** is a force, in newtons: the pull of gravity on the
          object. Near the Earth's surface, gravity pulls on every kilogram
          with about ${G} N.

        :::example
        A 50 kg rider: weight $= 50 \times ${G} = 500$ N.

        A 0.1 kg apple: weight $= 0.1 \times ${G} = 1$ N.
        :::

        So heavier things *are* pulled harder. Why, then, did the bowling
        ball not win the race in the last lesson?
      `,
    },
    {
      id: 'falling-together',
      type: 'fill',
      stretch: true,
      title: 'Back to the falling balls',
      gen: (rng) => {
        const [heavy, light] = rng.pick([
          [{ name: 'bowling ball', m: 6 }, { name: 'football', m: 0.4 }],
          [{ name: 'brick', m: 3 }, { name: 'apple', m: 0.2 }],
          [{ name: 'dumbbell', m: 10 }, { name: 'orange', m: 0.2 }],
        ]);
        const ratio = Math.round(heavy.m / light.m);
        return {
          text: r`
            Gravity pulls on every kilogram with about ${G} N. That pull is an
            object's **weight**.

            A ${heavy.m} kg ${heavy.name} and a ${light.m} kg ${light.name} are dropped, with no air in the way.
            Weight is the only force on each. Fill in the blanks.
          `,
          template: `- The ${heavy.name}: weight [[${heavy.m * G}]] N, so its acceleration is [[${G}]] m/s².\n- The ${light.name}: weight [[${light.m * G}]] N, so its acceleration is [[${G}]] m/s².`,
          hints: [
            `Weight = mass × ${G} N for every kilogram.`,
            r`Then $a = \frac{F_{\text{net}}}{m}$, with the weight as the net force.`,
          ],
          explain: r`$\frac{${heavy.m * G}}{${heavy.m}} = ${G}$ and $\frac{${light.m * G}}{${light.m}} = ${G}$. The ${heavy.name} is pulled ${ratio} times harder, but it is also ${ratio} times harder to accelerate. The two effects cancel exactly, which is why everything falls together.`,
        };
      },
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'Is there a net force on it? Sort each situation.',
      buckets: ['Net force is zero', 'Net force is not zero'],
      items: [
        { text: 'A book lying on a table', bucket: 0 },
        { text: 'A car cruising at a steady 30 m/s on a straight road', bucket: 0, why: 'Steady speed in a straight line: the driving force and the resistance cancel.' },
        { text: 'A block gliding across frictionless ice', bucket: 0, why: 'No forces along the ice at all, and its velocity never changes.' },
        { text: 'A lift rising at constant speed', bucket: 0, why: 'Constant speed: the cable pulls up exactly as hard as gravity pulls down.' },
        { text: 'A sprinter speeding up at the start of a race', bucket: 1 },
        { text: 'A cyclist braking for a red light', bucket: 1, why: 'Slowing down is a change in velocity, so there must be a net force (backwards).' },
        { text: 'A stone just after it is dropped', bucket: 1, why: 'It is speeding up, pulled by its weight.' },
      ],
      explain: 'Zero net force means the velocity is not changing: at rest **or** moving steadily in a straight line. Speeding up and slowing down both need a net force.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        On a flat road you have to keep pedalling just to hold a steady speed.
        A friend says that proves moving things need a force to keep them going.

        **How would you answer?**
      `,
      model: `
        Pedalling is not what keeps the bike moving. It is what **cancels**
        friction and air resistance, which are pushing backwards the whole time.
        At a steady speed the forward force and the backward forces are equal, so
        the net force is zero, exactly as Newton's first law says. Stop
        pedalling and the backward forces are left unbalanced: *that* net force
        is what slows you down.
      `,
    },
  ],
  recap: [
    '**First law:** with no net force, velocity does not change. Rest stays rest; motion stays the same motion.',
    'The **net force** is the sum of all the forces, with opposite directions cancelling.',
    'Balanced forces mean steady velocity, not necessarily rest.',
    r`**Second law:** $a = \frac{F_{\text{net}}}{m}$. More force, more acceleration; more mass, less.`,
  ],
  next: 'Next: launch something sideways and see two motions happen at once.',
};
