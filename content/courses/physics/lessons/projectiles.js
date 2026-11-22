// Physics: Motion & Forces · Lesson 4 · Aim High
import { r, num } from '../../../kit.js';
import { G, aAn } from '../helpers.js';

const CLIFF = { type: 'projectile', height: 20, angle: 0, world: [56, 24] };

export default {
  id: 'projectiles',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Dropped or fired?',
      text: `
        Two balls sit at the edge of a 20 m cliff. At the same instant, the teal
        one is simply **dropped** and the orange one is **fired sideways** at
        15 m/s.

        Ignore the air. Which ball hits the ground first?
      `,
      figure: { ...CLIFF, speed: 15, dropBall: true, static: true, show: 'start', alt: 'A cliff 20 metres high with two balls at its edge, ready to be released.' },
      shuffle: false,
      options: [
        { text: 'The dropped ball: it has less far to go' },
        { text: 'The fired ball: it is moving faster' },
        { text: 'They land at the same moment', correct: true },
      ],
      explain: 'They land together, every time. Firing a ball sideways does nothing to how fast it falls. Test it on the next screen.',
    },
    {
      id: 'duel',
      type: 'interact',
      graded: false,
      title: 'Run the experiment',
      text: `
        **Fire and drop.** Ghost images show both balls every half second, and
        the dotted lines join images taken at the same moment.

        Then change the firing speed and try again. Run it for at least **two
        different speeds**.
      `,
      widget: { ...CLIFF, speed: 10, speedRange: [5, 25, 5], dropBall: true },
      check: (s) => {
        const speeds = new Set(s.shots.map((shot) => shot.speed));
        if (speeds.size >= 2) return true;
        if (speeds.size === 1) return 'Now change the speed and fire again. Does a faster ball stay in the air any longer?';
        return 'Press **Fire and drop** to run the experiment.';
      },
      solution: { speed: 20, shots: [{ speed: 10 }, { speed: 20 }] },
      explain: `
        At every moment the two balls are at exactly the **same height**. Both
        take 2 s to fall the 20 m, whatever the firing speed.

        A faster shot lands further out. It does not stay up any longer.
      `,
    },
    {
      id: 'gaps',
      type: 'fill',
      text: `
        Here is one shot again, photographed four times a second. The
        [blue dots]{.blue} on the ground are the ball's shadow from above; the
        [violet dots]{.violet} on the cliff face are its shadow from the side.

        Look at the gaps between the dots.
      `,
      figure: { type: 'projectile', height: 20, angle: 0, speed: 15, world: [40, 24], strobe: 0.25, shadows: true, static: true, alt: 'A ball fired sideways from a 20 metre cliff, with strobe images. Its shadows on the ground are evenly spaced. Its shadows on the cliff face are close together at the top and further and further apart lower down.' },
      template: 'Sideways, the gaps are [[growing|*all equal|shrinking]]. Downwards, the gaps are [[*growing|all equal|shrinking]].',
      explain: `
        Sideways the ball covers the same distance in every time step: a
        **steady velocity**. Downwards it covers more and more: it is
        **accelerating**, exactly like a ball that was simply dropped.
      `,
    },
    {
      id: 'two-motions',
      type: 'info',
      title: 'Two motions, one ball',
      text: r`
        A ball in flight is doing two things at once, and neither one affects
        the other.

        - **Sideways:** nothing pushes it (we are ignoring the air), so by
          Newton's first law its sideways velocity never changes.
        - **Up and down:** gravity pulls it, so it gains 10 m/s of downward
          speed every second, exactly as if it had no sideways motion.

        :::key
        The fall decides **how long** the ball is in the air.
        The sideways speed decides **how far** it gets in that time.
        :::
      `,
    },
    {
      id: 'faster-shot',
      type: 'multi',
      review: true,
      text: 'A ball is fired **horizontally** from a cliff. Then it is fired again from the same spot, twice as fast. Ignoring the air, what is true of the second shot?',
      options: [
        { text: 'It lands twice as far from the cliff', correct: true },
        { text: 'It is in the air for just as long as the first', correct: true },
        { text: 'It stays in the air for longer', why: 'The time in the air is set by the fall alone, and the cliff is no higher than before.' },
        { text: 'It reaches the ground sooner', why: 'Sideways speed does not help it fall. The fall takes exactly as long as before.' },
      ],
      explain: 'The fall is untouched by the sideways speed, so the time in the air is the same. In that same time, twice the sideways speed covers twice the distance.',
    },
    {
      id: 'example-tower',
      type: 'info',
      title: 'Two questions, two motions',
      text: r`
        To follow a ball that leaves an edge sideways, take the two motions
        one at a time: first the fall, then the sideways trip.

        :::example
        A ball is thrown sideways at 9 m/s from a tower 45 m high.

        1. **How long is it in the air?** Only the fall decides. A dropped
           object falls 5 m in 1 s, 20 m in 2 s, 45 m in 3 s. So: 3 s.
        2. **How far out does it land?** Sideways it keeps its 9 m/s for
           those 3 s: $9 \times 3 = 27$ m.
        :::

        The sideways speed was not needed for step 1 at all.
      `,
      figure: { type: 'projectile', height: 45, angle: 0, speed: 9, world: [100, 52], strobe: 1, static: true, alt: 'A ball thrown sideways from a tower 45 metres high, shown once every second. It lands 27 metres out after 3 seconds.' },
    },
    {
      id: 'fall-time',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { ts: [1, 2], vs: [2, 3, 4], say: (hh, vv) => `A marble rolls off ${aAn(hh)} ${hh} m high ledge, moving sideways at ${vv} m/s.` },
          { ts: [2, 3, 4], vs: [8, 12, 15], say: (hh, vv) => `A stone is thrown horizontally at ${vv} m/s from a cliff ${hh} m high.` },
          { ts: [1, 2], vs: [12, 15, 16], say: (hh, vv) => `A ball is kicked horizontally at ${vv} m/s off ${aAn(hh)} ${hh} m high wall.` },
        ]);
        const t = rng.pick(scene.ts);
        const height = 5 * t * t;
        const v = rng.pick(scene.vs);
        const c = scene.say(height, v);
        return {
          text: r`${c} **How long is it in the air?** (Take $g = 10 \text{ m/s}^2$ and ignore the air.)

A dropped object falls 5 m in 1 s, 20 m in 2 s, 45 m in 3 s and 80 m in 4 s.`,
          answer: t,
          unit: 's',
          wrong: [
            [height / v, 'That treats the height as a sideways distance. The sideways speed has no say in the fall. How long does a *dropped* object take to fall that far?'],
            [height / G, 'That would be right for falling at a steady 10 m/s. But the ball speeds up as it falls.'],
          ],
          hints: [
            'The sideways speed does not matter here. Only the fall decides the time.',
            `Find ${height} m in the list of falling distances.`,
          ],
          explain: r`The time in the air depends only on the fall: ${height} m takes ${t} s, because $\tfrac{1}{2} \times 10 \times ${t}^2 = ${height}$. The sideways speed of ${v} m/s changes nothing.`,
        };
      },
    },
    {
      id: 'how-far-out',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { ts: [2, 3, 4], vs: [6, 8, 12, 14], say: (hh, vv) => `A delivery drone flying level at ${vv} m/s, ${hh} m above a field, lets go of a parcel.`, ask: 'How far forward does the parcel travel before it lands?' },
          { ts: [1, 2], vs: [2, 3, 4, 6], say: (hh, vv) => `A ball rolls off the flat roof of ${aAn(hh)} ${hh} m high building at ${vv} m/s, moving horizontally.`, ask: 'How far from the foot of the wall does it land?' },
          { ts: [1, 2], vs: [2, 3, 4, 6], say: (hh, vv) => `A swimmer runs horizontally off a rock ${hh} m above the sea at ${vv} m/s.`, ask: 'How far out from the rock does the swimmer hit the water?' },
        ]);
        const t = rng.pick(scene.ts);
        const height = 5 * t * t;
        const v = rng.pick(scene.vs.filter((vv) => vv * t !== height));
        return {
          text: r`${scene.say(height, v)} A fall of ${height} m takes ${t} s. **${scene.ask}** (Ignore the air.)`,
          answer: v * t,
          unit: 'm',
          wrong: [
            [height, 'That is the height of the fall. How far does it move *sideways* in that time?'],
            [v * height, `The sideways motion lasts only as long as the fall: ${t} s, not ${height}.`],
          ],
          hints: ['Sideways, the velocity stays the same for the whole flight.', `Distance = speed × time, with ${t} s in the air.`],
          explain: r`The sideways velocity stays at ${v} m/s for the ${t} s of the fall: $${v} \times ${t} = ${v * t}$ m.`,
        };
      },
    },
    {
      id: 'cliff-target',
      type: 'interact',
      title: 'Hit the flag',
      text: `
        Back on the 20 m cliff, where every flight lasts 2 s. A flag stands
        30 m out from the launch point.

        **Choose the firing speed that lands the ball on the flag.**
      `,
      widget: { ...CLIFF, speed: 5, speedRange: [5, 25, 5], target: { x: 30, width: 3 } },
      check: (s) => {
        if (!s.launched) return 'Press **Launch** to test your speed.';
        if (s.hit) return true;
        return s.miss === 'short'
          ? `Too short: it lands ${num(s.range, 1)} m out. In its 2 s of flight the ball has to cover 30 m sideways.`
          : `Too long: it lands ${num(s.range, 1)} m out. In its 2 s of flight the ball should cover only 30 m sideways.`;
      },
      solution: { speed: 15 },
      hints: ['The ball is in the air for 2 s, whatever you choose.', 'Which steady speed covers 30 m in 2 s?'],
      explain: r`The fall takes 2 s. To cover 30 m sideways in that time: $\frac{30}{2} = 15$ m/s.`,
    },
    {
      id: 'max-range',
      type: 'interact',
      attempts: 8,
      title: 'Aim high, or aim low?',
      text: `
        Now a launcher on level ground. The speed is fixed at 20 m/s; only the
        **angle** is yours. Aim higher, and more of that speed goes into
        climbing and less into moving sideways.

        **Find the angle that throws the ball furthest.** Earlier shots stay
        on screen so you can compare.
      `,
      widget: { type: 'projectile', angle: 20, speed: 20, angleRange: [10, 80, 5], world: [46, 22], keep: 5 },
      check: (s) => {
        if (!s.launched) return 'Press **Launch** to test this angle.';
        if (s.angle === 45) return true;
        if (s.best && s.best.range > s.range + 1e-6) return `This shot reaches ${num(s.range, 1)} m, but your ${s.best.angle}° shot went further: ${num(s.best.range, 1)} m. Keep searching near your best.`;
        return s.angle < 45
          ? `${num(s.range, 1)} m. A low shot is fast sideways but comes down too soon. Try aiming higher.`
          : `${num(s.range, 1)} m. A steep shot stays up for a long time but hardly moves sideways. Try aiming lower.`;
      },
      solution: { angle: 45 },
      hints: ['Try a low angle, a steep one and something in between. Which lands furthest?', 'The best angle is exactly half-way between flat and straight up.'],
      explain: `
        **45°** wins, with 40 m: exactly half-way between flat and straight up.

        (On level ground and with no air. Real throws with air resistance do
        best a little flatter.)
      `,
    },
    {
      id: 'same-range',
      type: 'interact',
      attempts: 6,
      title: 'Two ways to the same spot',
      text: `
        The dashed path is a shot at **30°**. It lands 34.6 m away, where the
        flag is.

        **Find a different angle that lands on the same flag**, at the same
        speed of 20 m/s.
      `,
      widget: {
        type: 'projectile', angle: 45, speed: 20, angleRange: [10, 80, 5], world: [46, 22], keep: 2,
        ghosts: [{ angle: 30, speed: 20, label: '30°' }], target: { x: 34.6, width: 2 },
      },
      check: (s) => {
        if (!s.launched) return 'Press **Launch** to test this angle.';
        if (s.angle === 30) return 'That is the same 30° shot again. Find a *different* angle that reaches the flag.';
        if (s.hit) return true;
        if (s.angle === 45) return 'At 45° the ball flies its furthest and overshoots. Which other angle gives up just as much range as 30° does?';
        return s.miss === 'short' ? `Too short by ${num(-s.error, 1)} m.` : `Too long by ${num(s.error, 1)} m.`;
      },
      solution: { angle: 60 },
      hints: ['30° is 15° below the best angle of 45°. Try the same distance on the other side.'],
      explain: `
        **60°** lands on exactly the same spot. The 30° shot is low and quick;
        the 60° shot goes high and takes longer, but covers the same ground.
      `,
    },
    {
      id: 'teach-angles',
      type: 'info',
      title: 'Choosing the angle',
      text: r`
        Your two experiments, as rules for level ground with no air:

        - A **flat** shot is fast sideways but comes down too soon. A
          **steep** shot stays up for a long time but hardly moves sideways.
          **45°** is the best compromise and gives the greatest range.
        - Two angles equally far either side of 45° land on the same spot.
          Such a pair always adds up to **90°**.

        :::example
        30° and 60° are both 15° away from 45°, and $30 + 60 = 90$.

        The partner of a 5° shot is $90 - 5 = 85°$.
        :::
      `,
      figure: {
        type: 'projectile', angle: 45, speed: 20, world: [46, 22], strobe: 0, static: true,
        ghosts: [{ angle: 30, speed: 20, label: '30°' }, { angle: 60, speed: 20, label: '60°' }],
        alt: 'Three paths from the same launcher at the same speed. The 45 degree shot lands furthest, 40 metres away. The 30 degree and 60 degree shots, drawn dashed, both land on one spot a little short of that.',
      },
    },
    {
      id: 'pairs',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.pick([10, 15, 20, 25, 35, 40, 50, 55, 65, 70, 75, 80]);
        const thing = rng.pick(['A water jet', 'A ball', 'A stone from a catapult', 'A firework shell']);
        return {
          text: `${thing} launched at **${a}°** above level ground lands at a certain spot. With the same launch speed and no air, which *other* angle lands on that same spot?`,
          answer: 90 - a,
          unit: '°',
          wrong: [[45, '45° gives the greatest range of all, so it lands further away.'], [2 * a, 'Doubling does not work. Think of the two angles as equally far either side of 45°.']],
          hints: ['The two angles sit equally far either side of 45°.', 'Together they make 90°.'],
          explain: r`The two angles add up to 90°: $90 - ${a} = ${90 - a}$. One is ${Math.abs(45 - a)}° below 45°, the other ${Math.abs(45 - a)}° above it.`,
        };
      },
    },
    {
      id: 'example-up-and-over',
      type: 'info',
      title: 'Up and over',
      text: r`
        A ball launched upwards still makes two separate motions. Its
        **upward** speed sets the time in the air: gravity takes away 10 m/s
        of it every second until the ball stops rising, and coming down takes
        just as long.

        :::example
        A ball leaves the ground moving 5 m/s sideways and 30 m/s upwards.

        1. Rising: $\frac{30}{10} = 3$ s. Coming down: another 3 s. That is
           6 s in the air.
        2. Sideways: $5 \times 6 = 30$ m.
        :::
      `,
      figure: { type: 'projectile', angle: 80.54, speed: 30.414, world: [100, 52], strobe: 1, static: true, alt: 'A ball launched steeply from level ground, shown once every second. It climbs for 3 seconds, to 45 metres, comes down for another 3 seconds and lands 30 metres away.' },
    },
    {
      id: 'kick',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const vy = rng.pick([10, 15, 20]);
        const vx = rng.pick([6, 8, 10, 12, 14]);
        const up = vy / G;
        const total = 2 * up;
        return {
          text: r`
            A football is kicked from level ground. As it leaves the boot it is
            moving **${vx} m/s sideways** and **${vy} m/s upwards**.

            How far away does it land? (Take $g = 10 \text{ m/s}^2$ and ignore the air.)
          `,
          answer: vx * total,
          unit: 'm',
          wrong: [
            [vx * up, `That is how far it has gone when it reaches the top, after ${num(up)} s. It still has to come down.`],
            [vx * vy, 'The two speeds are not multiplied together. First find how long the ball is in the air.'],
          ],
          hints: [
            'Start with the up-and-down motion: it loses 10 m/s of upward speed every second. How long until it stops rising?',
            `It rises for ${num(up)} s, and coming down takes just as long.`,
            `So it is in the air for ${num(total)} s, moving sideways at ${vx} m/s all the while.`,
          ],
          explain: r`Upwards: ${vy} m/s is lost at 10 m/s each second, so the ball rises for ${num(up)} s and falls for another ${num(up)} s: ${num(total)} s in the air. Sideways: $${vx} \times ${num(total)} = ${num(vx * total)}$ m.`,
        };
      },
    },
    {
      id: 'sort',
      type: 'bucket',
      text: 'A ball is flying through the air (no air resistance). Sort each statement by the part of its motion it describes.',
      buckets: ['Sideways motion', 'Up-and-down motion'],
      items: [
        ['Velocity stays the same', 0],
        ['No force acts in this direction', 0],
        ['Strobe gaps are all equal', 0],
        ['Decides how far the ball gets', 0],
        ['Gravity acts in this direction', 1],
        [r`Accelerates at $10 \text{ m/s}^2$`, 1],
        ['Decides how long the ball stays up', 1],
      ],
      explain: 'Sideways: no force, so steady velocity. Up and down: gravity, so a steady acceleration. The two never interfere.',
    },
  ],
  recap: [
    'A projectile makes two motions at once that do not affect each other.',
    '**Sideways:** no force (ignoring air), so the velocity stays constant.',
    r`**Up and down:** free fall at $g = 10 \text{ m/s}^2$. The fall alone sets the time in the air.`,
    'On level ground 45° gives the greatest range, and two angles that add up to 90° land on the same spot.',
  ],
  next: 'Next: a quantity that never gets used up, only passed along.',
};
