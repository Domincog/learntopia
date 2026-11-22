// Physics: Motion & Forces · Lesson 5 · Energy Never Disappears
import { r, num } from '../../../kit.js';
import { G, aAn } from '../helpers.js';

const TRACK = { type: 'energy-track', track: [[0, 11], [8, 0], [16, 6], [24, 0], [30, 2]], mass: 2 };

export default {
  id: 'energy',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Over the hill?',
      text: `
        A ball is let go, from rest, **5 m** up a perfectly smooth track. Ahead
        of it is a hill **6 m** high.

        It will pick up a lot of speed on the way down. Is that enough to
        carry it over the hill?
      `,
      figure: { ...TRACK, start: 5, static: true, show: 'start', bars: false, alt: 'A track that drops from the left into a valley, rises over a hill 6 metres high, dips again and ends at a flag. A ball waits on the left slope, 5 metres up.' },
      shuffle: false,
      options: [
        { text: 'Yes: by the bottom it is moving fast enough' },
        { text: 'Only if it is heavy enough' },
        { text: 'No: it cannot get higher than where it started', correct: true },
      ],
      explain: 'It cannot. The ball climbs back to 5 m and not a millimetre more, however fast it is going at the bottom.',
    },
    {
      id: 'teach-same-height',
      type: 'info',
      title: 'Never higher than the start',
      text: `
        On a smooth track the ball climbs back to exactly the height it was
        released from, and no higher. From 5 m it turns round where the dashed
        line meets the hill, short of the 6 m top.

        What the ball keeps is its **energy**. It holds it in two forms:

        - **Potential energy** is stored by height: the higher, the more.
        - **Kinetic energy** is the energy of motion: the faster, the more.

        Rolling down trades potential energy for kinetic. Climbing trades it
        back, and it never gets back more than it started with.
      `,
      figure: { ...TRACK, start: 5, static: true, show: 'start', bars: false, alt: 'The track with its 6 metre hill and the ball waiting 5 metres up the first slope. A dashed line marks that release height. It crosses the hill below the top.' },
    },
    {
      id: 'lowest-start',
      type: 'interact',
      attempts: 8,
      title: 'How high is high enough?',
      text: `
        The dashed line marks the height the ball is released from.

        **Find the lowest release height that gets the ball over the 6 m hill
        and on to the flag.** Press Release to test each one.
      `,
      widget: { ...TRACK, start: 5, startRange: [1, 10, 1], bars: false },
      check: (s) => {
        if (!s.ran) return 'Press **Release** to test this height.';
        if (s.finished && s.start === 7) return true;
        if (s.finished) return `From ${s.start} m it makes it, with energy to spare. Could a lower release still get over?`;
        if (s.start === 6) return 'From exactly 6 m it creeps up to the very top of the hill and arrives with nothing left, so it slides back. It needs a little more.';
        return `From ${s.start} m the ball climbs back to ${s.start} m and no higher. The hill is 6 m.`;
      },
      solution: { start: 7 },
      hints: ['Watch where the ball turns round on the hill, and compare that with the dashed line.'],
      explain: `
        The ball always climbs back to the height it started from, never above
        the dashed line. To clear a 6 m hill it has to start from **more than
        6 m**.

        Next, watch the energy being traded.
      `,
    },
    {
      id: 'watch-bars',
      type: 'choice',
      text: `
        The bars track the ball's two kinds of energy as it moves, in joules
        (J), the unit of energy. **Release the ball and watch them.**

        Where on the track is the [kinetic]{.green} bar longest?
      `,
      figure: { ...TRACK, start: 5, alt: 'The same track with a ball released from 5 metres. Bars show its kinetic, potential and total energy.' },
      options: [
        { text: 'At the bottom of the valley', correct: true },
        { text: 'At the release point', why: 'There the ball is at rest: no speed, so no kinetic energy at all. Everything is in the potential bar.' },
        { text: 'Where it turns round on the hill', why: 'At a turning point the ball is momentarily at rest, so its kinetic energy is zero.' },
        { text: 'It never changes', why: 'It is the *total* bar that never changes. The kinetic bar grows and shrinks.' },
      ],
      explain: `
        As the ball drops, the [potential]{.blue} bar shrinks and the
        [kinetic]{.green} bar grows by exactly the same amount. At the bottom
        it is all kinetic; climbing again, it is traded back. The **total**
        never moves.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Potential energy',
      text: r`
        Energy is measured in **joules** (J).

        **Gravitational potential energy** belongs to height. Lifting a mass
        $m$ (in kg) to a height $h$ (in m) stores

        $$ E_p = m \, g \, h $$

        with $g = 10 \text{ m/s}^2$, the same $g$ as in free fall.

        :::example
        The 2 kg ball waits 5 m above the valley floor:

        $E_p = 2 \times 10 \times 5 = 100$ J.
        :::

        Twice the height, or twice the mass, stores twice the energy.
      `,
      figure: { ...TRACK, start: 5, static: true, show: 'start', alt: 'The 2 kilogram ball at rest, 5 metres up the first slope. The bars show 100 joules of potential energy and no kinetic energy.' },
    },
    {
      id: 'potential',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { thing: 'book', ms: [1, 2], hs: [1, 1.5, 2], where: 'lies on a shelf', above: 'above the floor', ref: 'the floor' },
          { thing: 'climber', ms: [50, 60, 70], hs: [20, 30, 40], where: 'rests on a ledge', above: 'above the ground', ref: 'the ground' },
          { thing: 'flowerpot', ms: [2, 3, 4], hs: [3, 6, 9], where: 'stands on a window ledge', above: 'above the street', ref: 'the street' },
          { thing: 'roller-coaster car', ms: [400, 500, 600], hs: [20, 30, 40], where: 'waits at the top of the first hill', above: 'above the ground', ref: 'the ground' },
        ]);
        const m = rng.pick(c.ms);
        const hh = rng.pick(c.hs);
        const E = m * G * hh;
        return {
          text: r`A **${m} kg** ${c.thing} ${c.where}, **${num(hh)} m** ${c.above}. How much gravitational potential energy does the ${c.thing} have, measured from ${c.ref}? (Take $g = 10 \text{ m/s}^2$.)`,
          answer: E,
          unit: 'J',
          wrong: [[m * hh, r`That leaves out $g$. Each kilogram is pulled with 10 N, so $E_p = m \times g \times h$.`], [m * G, 'That is its weight in newtons. Multiply by the height to get the energy.']],
          hints: [r`$E_p = m \, g \, h$`],
          explain: r`$E_p = m \, g \, h = ${m} \times 10 \times ${num(hh)} = ${num(E)}$ J.`,
        };
      },
    },
    {
      id: 'teach-kinetic',
      type: 'info',
      title: 'Kinetic energy',
      text: r`
        **Kinetic energy** belongs to motion. A mass $m$ moving at speed $v$
        has

        $$ E_k = \tfrac{1}{2} \, m \, v^2 $$

        Square the speed first. Then multiply by the mass, and halve.

        :::example
        At the bottom of the valley the 2 kg ball is moving at 10 m/s.

        1. Square the speed: $10^2 = 100$.
        2. $E_k = \tfrac{1}{2} \times 2 \times 100 = 100$ J.
        :::

        That is the same 100 J the ball had as potential energy at the top,
        and it is no accident.
      `,
    },
    {
      id: 'kinetic',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { ms: [4, 6], vs: [3, 4, 5], say: (mm, vv) => `A **${mm} kg** sledge slides across the snow at **${vv} m/s**.` },
          { ms: [60, 80], vs: [5, 8, 10], say: (mm, vv) => `A sprinter with a mass of **${mm} kg** runs at **${vv} m/s**.` },
          { ms: [80, 100], vs: [4, 6, 10], say: (mm, vv) => `A cyclist and bike with a total mass of **${mm} kg** travel at **${vv} m/s**.` },
          { ms: [0.4], vs: [10, 20, 30], say: (mm, vv) => `A **${mm} kg** football flies at **${vv} m/s**.` },
          { ms: [1000], vs: [10, 20, 30], say: (mm, vv) => `A small car with a mass of **${mm} kg** drives at **${vv} m/s**.` },
        ]);
        const m = rng.pick(c.ms);
        const v = rng.pick(c.vs);
        const E = 0.5 * m * v * v;
        return {
          text: `${c.say(num(m), v)} How much kinetic energy is that?`,
          answer: E,
          unit: 'J',
          wrong: [
            [m * v * v, r`Nearly: do not forget the $\tfrac{1}{2}$ at the front.`],
            [0.5 * m * v, 'The speed has to be squared.'],
            [m * v, r`Kinetic energy is $\tfrac{1}{2} m v^2$: half the mass times the speed *squared*.`],
          ],
          hints: [r`$E_k = \tfrac{1}{2} \, m \, v^2$. Square the speed first.`],
          explain: r`$E_k = \tfrac{1}{2} \, m \, v^2 = \tfrac{1}{2} \times ${num(m)} \times ${v}^2 = \tfrac{1}{2} \times ${num(m)} \times ${v * v} = ${num(E)}$ J.`,
        };
      },
    },
    {
      id: 'teach-total',
      type: 'info',
      title: 'The total stays the same',
      text: r`
        :::key
        Without friction, $E_p + E_k$ stays the same all the way along the
        track. Energy is not used up. It only changes form.
        :::

        So if you know the total and one part, you know the other part.

        :::example
        The ball starts at rest with 100 J, all of it potential. Part-way
        down, its potential energy is 30 J.

        Kinetic energy = total − potential. So it is $100 - 30 = 70$ J.
        :::

        At the bottom no potential energy is left, so all 100 J is kinetic.
      `,
    },
    {
      id: 'bookkeeping',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const total = rng.pick([80, 100, 120, 150, 200, 240]);
        const pe = rng.pick([0.2, 0.25, 0.4, 0.5, 0.75]) * total;
        const c = rng.pick([
          { who: 'A skateboarder', where: 'at the top of a smooth ramp', later: 'Part-way down' },
          { who: 'A marble', where: 'at the top of a smooth bowl', later: 'Part-way down' },
          { who: 'A sledge', where: 'at the top of an icy slope', later: 'Lower down the slope' },
        ]);
        return {
          text: `${c.who} starts from rest ${c.where} with **${total} J** of potential energy. There is no friction. ${c.later}, the potential energy is **${pe} J**. How much kinetic energy is there at that moment?`,
          answer: total - pe,
          unit: 'J',
          wrong: [[pe, 'That is what is still stored as potential energy. The rest has changed form.'], [total, 'That is the total. Some of it is still potential energy.'], [total + pe, 'Energy has not been added. The total is still what it was at the start.']],
          hints: ['At the start all the energy is potential, so you know the total.', 'Total = potential + kinetic, and the total does not change.'],
          explain: r`The total stays at ${total} J. If ${pe} J is still potential, the rest is kinetic: $${total} - ${pe} = ${total - pe}$ J.`,
        };
      },
    },
    {
      id: 'friction',
      type: 'interact',
      attempts: 8,
      title: 'Now with friction',
      text: `
        Real tracks rub. **Switch friction on** and release the ball again: a
        new bar shows the energy that has turned into heat.

        With friction, 7 m is no longer enough. **Find the lowest release
        height that still reaches the flag.**
      `,
      widget: { ...TRACK, start: 7, startRange: [1, 10, 1], frictionToggle: true, mu: 0.2 },
      check: (s) => {
        if (!s.friction) return 'Switch to **With friction** first.';
        if (!s.ran) return 'Press **Release** to test this height.';
        if (s.finished && s.start === 9) return true;
        if (s.finished) return `From ${s.start} m it gets there. Could a lower release still make it?`;
        return `From ${s.start} m it only climbs to ${num(s.climbHeight, 1)} m on the hill. Too much of its energy has turned into heat on the way.`;
      },
      solution: { start: 9, friction: true },
      hints: ['Watch the red "energy left" line. The ball can only climb as high as that line, and it keeps sinking.'],
      explain: `
        With friction the ball needs a head start: 9 m instead of 7 m. Part
        of its energy turns into heat on the way, and that part cannot lift
        it over the hill.
      `,
    },
    {
      id: 'teach-heat',
      type: 'info',
      title: 'Where friction puts the energy',
      text: r`
        Friction does not destroy energy. It turns kinetic energy into
        **heat** (thermal energy), a little with every metre travelled. The
        ball and the track end up very slightly warmer.

        Count the heat in, and the total is still the same:

        $$ E_p + E_k + \text{heat} = \text{total} $$

        But heat cannot lift the ball again. With friction, the part of the
        energy that can still carry it uphill keeps shrinking.
      `,
      figure: { ...TRACK, start: 9, friction: true, static: true, show: 'end', alt: 'The ball released from 9 metres with friction switched on, at the end of its run by the flag. A red bar shows the part of its energy that has turned into heat; the total bar is unchanged.' },
    },
    {
      id: 'coaster',
      type: 'choice',
      review: true,
      text: 'A roller-coaster train is hauled to the top of the first hill and then let go. It has no engine. **Why is the first hill always the tallest of the ride?**',
      options: [
        { text: 'The train never has more energy than at the top of the first hill, and friction keeps turning some of it into heat', correct: true },
        { text: 'Later hills are steeper, so they have to be shorter', why: 'Steepness is not the limit. What matters is height: the train cannot climb higher than its energy allows.' },
        { text: 'The train gets heavier as it goes round', why: 'Its mass does not change. And mass would not matter anyway: heavy and light trains reach the same heights.' },
        { text: 'It is only a tradition; any hill could be the tallest', why: 'With no engine, a later hill taller than the first could never be climbed.' },
      ],
      explain: 'At the top of the first hill the train has all the energy it will ever have, stored as potential energy. Every later hill has to be lower than that, and lower still because friction and air resistance keep taking a share.',
    },
    {
      id: 'heavier',
      type: 'choice',
      text: `
        Does a heavier ball behave differently? **Try a few masses**, with no
        friction, and watch the bars and the speed.

        What changes when the ball is heavier?
      `,
      figure: { ...TRACK, start: 8, massRange: [1, 5, 1], alt: 'The track with a mass slider from 1 to 5 kilograms.' },
      options: [
        { text: 'Its energies are bigger, but its speeds and heights are the same', correct: true },
        { text: 'It goes faster at the bottom', why: 'Check the speed readout at the bottom of the valley for two different masses. It is the same.' },
        { text: 'It cannot climb as high', why: 'A heavier ball needs more energy to climb, but it also has more, in exactly the same proportion.' },
        { text: 'Nothing changes at all', why: 'Look at the numbers on the bars: they grow with the mass.' },
      ],
      explain: `
        Double the mass and both kinds of energy double. The heavier ball has
        more energy to spend, but it also needs more to climb and to get
        moving, in exactly the same proportion. The same thing happened with
        the falling balls.
      `,
    },
    {
      id: 'teach-speed',
      type: 'info',
      title: 'Speed from height',
      text: r`
        With no friction, all the potential energy at the top has become
        kinetic energy at the bottom:

        $$ m \, g \, h = \tfrac{1}{2} \, m \, v^2 $$

        The mass $m$ multiplies both sides, so it cancels. Double what is
        left and $\mathord{v^2 = 2 \, g \, h}$: the speed depends only on the
        drop.

        :::example
        A sledge starts from rest and slides down an icy slope that drops
        2.45 m.

        1. $v^2 = 2 \times 10 \times 2.45 = 49$
        2. Which number squared gives 49? $v = 7$ m/s.
        :::
      `,
    },
    {
      id: 'speed-at-bottom',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        // heights chosen so that 2·g·h is a perfect square
        const scene = rng.pick([
          { hs: [20, 45, 80], say: (x) => `A roller-coaster car starts from rest at the top of ${aAn(x)} ${x} m drop.`, ask: 'How fast is the car moving at the bottom?' },
          { hs: [20, 45], say: (x) => `A skier starts from rest at the top of a slope and descends ${x} m in height.`, ask: 'How fast is the skier moving at the bottom?' },
          { hs: [3.2, 5, 7.2], say: (x) => `A child starts from rest at the top of a water slide and comes down ${x} m in height.`, ask: 'How fast is the child moving at the bottom?' },
          { hs: [0.8, 1.25, 1.8], say: (x) => `A swing is pulled back until the seat is ${x} m higher than its lowest point, and let go.`, ask: 'How fast is the seat moving at its lowest point?' },
          { hs: [1.25, 1.8, 3.2], say: (x) => `A skateboarder rolls from rest down a ramp ${x} m high.`, ask: 'How fast is the skateboarder moving at the bottom?' },
        ]);
        const hh = rng.pick(scene.hs);
        const v = Math.round(Math.sqrt(2 * G * hh));
        const c = scene.say(num(hh));
        return {
          text: r`${c} Ignore friction and air. **${scene.ask}** (Take $g = 10 \text{ m/s}^2$.)`,
          answer: v,
          unit: 'm/s',
          wrong: [[2 * G * hh, 'That is $v^2$. Take the square root to get the speed.'], [G * hh, r`That is $g \times h$, the energy per kilogram. Set it equal to $\tfrac{1}{2} v^2$.`]],
          hints: [
            'All the potential energy at the top becomes kinetic energy at the bottom.',
            r`$m g h = \tfrac{1}{2} m v^2$. The mass cancels, leaving $v^2 = 2 g h$.`,
            r`$v^2 = 2 \times 10 \times ${num(hh)} = ${num(2 * G * hh)}$. Which number squared gives that?`,
          ],
          explain: r`$m g h = \tfrac{1}{2} m v^2$, so $v^2 = 2 g h = 2 \times 10 \times ${num(hh)} = ${num(2 * G * hh)}$ and $v = ${v}$ m/s. The mass never mattered.`,
        };
      },
    },
    {
      id: 'match',
      type: 'match',
      text: 'A ball rolls back and forth in a smooth valley, then friction is switched on and it slowly comes to rest. Match each moment to where the energy is.',
      pairs: [
        ['Held at the top, about to be let go', 'All potential'],
        ['Racing through the lowest point', 'All kinetic'],
        ['Half-way up the far side, still moving', 'Part kinetic, part potential'],
        ['At rest at the bottom, a while later', 'All turned to heat'],
      ],
      explain: 'Height stores potential energy, speed carries kinetic energy, and friction turns both into heat. Add the three together and the total is the same at every moment.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A dropped ball bounces a little lower each time and finally lies still.
        A friend says: "Its energy got used up."

        **How would you put that more accurately?**
      `,
      model: `
        The energy has not gone anywhere; it has changed form. Each bounce and
        each trip through the air turns some of the ball's kinetic and potential
        energy into **heat** (and a little sound): the ball, the floor and the
        air end up very slightly warmer. The total is exactly what it was at the
        start. What has shrunk is the part that can still lift the ball.
      `,
    },
  ],
  recap: [
    r`**Potential energy** $E_p = m g h$ belongs to height. **Kinetic energy** $E_k = \tfrac{1}{2} m v^2$ belongs to motion.`,
    'Without friction their sum stays constant: going down trades height for speed, going up trades it back.',
    'So nothing climbs higher than it started without extra energy.',
    'Friction does not destroy energy. It turns it into heat, which cannot lift the ball again.',
  ],
  next: 'Next: one more quantity that survives, even in a crash.',
};
