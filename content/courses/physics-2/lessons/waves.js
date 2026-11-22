// Physics II: Orbits & Waves · Lesson 4 · A Disturbance That Travels
import { r, num } from '../../../kit.js';
import { SOUND } from '../helpers.js';

// The rope in this lesson carries waves at 4 m/s, whatever the hand does.
const ROPE = { type: 'rope-wave', speed: 4, freq: 1, amp: 20 };

export default {
  id: 'waves',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The ribbon',
      text: `
        A long rope lies stretched out on smooth ice. You flick one end, and a
        hump runs along the rope to the far end.

        Half-way along, a ribbon is tied to the rope. **Where is the ribbon
        after the hump has gone past?**
      `,
      shuffle: false,
      options: [
        { text: 'Carried along to the far end' },
        { text: 'Moved part of the way along' },
        { text: 'Exactly where it started', correct: true },
      ],
      explain: 'Exactly where it was. The hump travels the whole length of the rope. The ribbon only goes up and comes back down. Watch it happen.',
    },
    {
      id: 'teach-pulse',
      type: 'info',
      title: 'What travels',
      text: `
        **Send a pulse** and keep your eye on one spot of the rope, say the
        6 m mark. The hump runs the whole length of the rope, to the flag.
        The rope at your spot only goes up and comes back down. What travels
        is a **shape**, not rope.

        A single hump like this is a **pulse**. Shake the end steadily and
        you send a whole train of them: a **wave**. Its high points are
        called **crests** and its low points **troughs**.
      `,
      figure: { type: 'rope-wave', wave: 'pulse', speed: 4, amp: 20, flick: 0.5, alt: 'A rope above a ruler marked in metres, with a flag at its far end, 12 metres from the hand. A button sends a single hump along the rope to the flag.' },
    },
    {
      id: 'watch-bead',
      type: 'choice',
      title: 'Watch one piece of rope',
      text: `
        A hand shakes the end of a rope steadily, and waves run along it. An
        [orange bead]{.orange} is fixed to the rope, 6 m from the hand.

        **Watch the bead, not the waves.** How does it move?
      `,
      figure: { ...ROPE, freqRange: [0.5, 2, 0.5], bead: 6, alt: 'A hand shaking one end of a long rope. Waves travel along the rope to the right. An orange bead on the rope moves along a short dotted track that runs straight up and down.' },
      options: [
        { text: 'Straight up and down, staying 6 m from the hand', correct: true },
        { text: 'Along the rope, riding on a crest', why: 'Follow the bead itself. Crest after crest passes through it, but it never leaves its dotted track.' },
        { text: 'Round and round in a circle', why: 'It only moves along its dotted track, and that runs straight up and down.' },
        { text: 'It does not move at all', why: 'It rises and falls once for every wave that passes.' },
      ],
      explain: `
        Every piece of the rope only moves **up and down**, copying what the
        hand did a moment earlier. What travels along is the *pattern*: the
        disturbance, and the energy that goes with it.

        No rope is delivered to the far end.
      `,
    },
    {
      id: 'slinky',
      type: 'choice',
      title: 'Push and pull',
      text: `
        Now a long, soft spring. The hand pushes and pulls **along** its
        length, and bands of squeezed coils travel down it.

        One coil is painted [orange]{.orange}. How does it move?
      `,
      figure: { type: 'rope-wave', kind: 'longitudinal', speed: 4, freq: 1, bead: 6, alt: 'A long spring drawn as a row of coils. Bands where the coils are squeezed together travel to the right. One orange coil shifts a little to the left and right about a mark beneath it.' },
      options: [
        { text: 'To and fro along the spring, about one spot', correct: true },
        { text: 'Up and down, across the spring', why: 'That is what a rope does. Here nothing moves across the spring: the coils only shift along it.' },
        { text: 'Steadily along the spring, with the squeezed bands', why: 'The squeezed bands travel. The orange coil only shifts a little to and fro about the dotted mark beneath it.' },
      ],
      explain: `
        Each coil moves to and fro **along** the line the wave travels on,
        about its own spot. The squeeze travels; the coils stay at home.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'What a wave is',
      text: `
        A **wave** is a disturbance that travels through a material, the
        **medium**, and carries energy with it. The medium stays where it is.
        There are two kinds.

        - **Transverse**: each part moves *across* the direction the wave
          travels in. The rope did that: up and down, while the wave ran
          along.
        - **Longitudinal**: each part moves to and fro *along* the direction
          of travel. The spring did that.

        **Sound** is a longitudinal wave: squeezes of air spreading out from
        whatever is vibrating.
      `,
      figure: [
        { ...ROPE, static: true, bead: 6, alt: 'A frozen wave on a rope. An orange bead on the rope sits on a short dotted track that runs up and down, across the rope.' },
        { type: 'rope-wave', kind: 'longitudinal', speed: 4, freq: 1, bead: 6, static: true, alt: 'A long spring drawn as a row of coils, with bands where the coils are squeezed together. An orange coil sits on a mark; it shifts along the spring.' },
      ],
    },
    {
      id: 'teach-measure',
      type: 'info',
      title: 'Measuring a wave',
      text: r`
        Three things to measure on a wave:

        - **Amplitude**: how far each part moves from its resting place.
        - **Wavelength** $\lambda$ (the Greek letter lambda): the distance from
          one crest to the next. Here it is 4 m: neighbouring crests are at
          3 m and 7 m, and $7 - 3 = 4$.
        - **Frequency** $f$: how many waves the source sends out each second,
          in hertz (Hz), as for a pendulum. One wave every 2 s is 0.5 Hz.
          Every part of the rope swings at that frequency.
      `,
      figure: { ...ROPE, static: true, crestAt: 3, bead: false, alt: 'A frozen wave on a rope above a ruler marked in metres. Crests are marked at 3, 7 and 11 metres: one wavelength, 4 metres, apart.' },
    },
    {
      id: 'measure-wavelength',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const lambda = rng.pick([2, 3, 4, 5, 6]);
        const first = rng.pick([0, 1, 2].filter((c) => c < lambda && c !== lambda / 2));
        const medium = rng.pick(['a rope', 'a long rope', 'a washing line', 'a stretched cord']);
        const crests = [];
        for (let x = first; x <= 12; x += lambda) crests.push(x);
        const wrong = [[lambda / 2, 'That is the distance from a crest to the next trough: half a wavelength.'], [12, 'That is the length of the ruler. The wavelength is the distance between two neighbouring crests.']];
        if (first > 0) wrong.push([first, `That is where the first crest happens to be. The wavelength is the distance from that crest to the next one, at ${first + lambda} m.`]);
        return {
          text: `A wave is travelling along ${medium}. In this frozen picture each crest is marked, and the ruler is in metres.\n\n**What is the wavelength?**`,
          figure: { type: 'rope-wave', static: true, speed: lambda, freq: 1, amp: 20, crestAt: first, bead: false, alt: `A frozen wave on a rope above a ruler. Crests are marked at ${crests.join(', ')} metres.` },
          answer: lambda,
          unit: 'm',
          wrong,
          hints: ['The wavelength is the distance from one crest to the next. Read two neighbouring crests off the ruler.'],
          explain: `Neighbouring crests are at ${crests[0]} m and ${crests[1]} m, so the wavelength is ${crests[1]} − ${crests[0]} = ${lambda} m.`,
        };
      },
    },
    {
      id: 'discover',
      type: 'interact',
      attempts: 8,
      title: 'Shake faster',
      text: `
        Back to the first rope. **Change how fast the hand shakes**, and
        press Freeze to measure the wavelength each time.

        **Find the frequency that makes the wavelength exactly 1 m.**
      `,
      widget: { ...ROPE, freqRange: [1, 8, 1], bead: false, alt: 'A hand shaking a rope above a ruler marked in metres. A slider sets how many times a second the hand shakes.' },
      check: (s) => {
        if (s.wavelength === 1) return true;
        return s.wavelength > 1
          ? `At ${num(s.freq)} Hz the crests are ${num(s.wavelength, 2)} m apart. Shorter waves need faster shaking.`
          : `At ${num(s.freq)} Hz the crests are only ${num(s.wavelength, 2)} m apart: too short. Shake more slowly.`;
      },
      solution: { freq: 4, frozen: true },
      hints: ['Start at 1 Hz, freeze, and read the wavelength off the ruler. Then try 2 Hz.'],
      explain: `
        At 4 Hz the crests are 1 m apart.

        | Frequency (Hz) | 1 | 2 | 4 | 8 |
        |------|:---:|:---:|:---:|:---:|
        | Wavelength (m) | 4 | 2 | 1 | 0.5 |

        Double the frequency and the wavelength halves. Shaking faster does
        not push the waves along any faster. It only packs them closer.
      `,
    },
    {
      id: 'wave-speed',
      type: 'fill',
      title: 'Frequency × wavelength',
      text: r`
        From the last experiment:

        | Frequency $f$ (Hz) | 1 | 2 | 4 | 8 |
        |------|:---:|:---:|:---:|:---:|
        | Wavelength $\lambda$ (m) | 4 | 2 | 1 | 0.5 |

        Each second the hand makes $f$ new waves, and each one is $\lambda$
        long. So every second the wave moves on by $f \times \lambda$ metres.
      `,
      template: 'On this rope, frequency × wavelength always comes to [[4]] m/s. That is the [[amplitude|*speed|period]] of the wave.',
      explain: r`
        $$ v = f \times \lambda $$

        Wave speed = frequency × wavelength. On this rope it is 4 m/s at
        every frequency you tried.
      `,
    },
    {
      id: 'teach-wave-equation',
      type: 'info',
      title: 'The wave equation',
      text: r`
        $$ v = f \times \lambda $$

        Wave speed = frequency × wavelength. Hertz times metres gives metres
        per second. Shaking faster does not push the waves along any faster:
        it only packs them closer.

        Know any two of the three, and you can find the third.

        :::example
        Waves on a lake: 3 Hz, with a wavelength of 4 m.

        - **Speed:** $v = 3 \times 4 = 12$ m/s.
        - **Wavelength:** $\lambda = \frac{v}{f} = \frac{12}{3} = 4$ m.
        - **Frequency:** $f = \frac{v}{\lambda} = \frac{12}{4} = 3$ Hz.
        :::
      `,
    },
    {
      id: 'wave-equation',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { name: 'Waves on a rope', it: 'they', cases: [[6, 2, 3], [6, 4, 1.5], [8, 2, 4], [10, 5, 2], [9, 6, 1.5]] },
          { name: 'Ripples on a pond', it: 'they', cases: [[0.5, 2, 0.25], [0.6, 3, 0.2], [0.4, 4, 0.1], [0.6, 4, 0.15]] },
          { name: 'Waves on a long spring', it: 'they', cases: [[3, 2, 1.5], [5, 2, 2.5], [6, 3, 2], [2, 4, 0.5]] },
          { name: 'Sound waves in air', it: 'they', cases: [[SOUND, 170, 2], [SOUND, 340, 1], [SOUND, 680, 0.5], [SOUND, 85, 4], [SOUND, 1700, 0.2]] },
        ]);
        const [v, f, lambda] = rng.pick(scene.cases);
        const ask = rng.pick(['v', 'f', 'lambda']);
        const hints = [r`$v = f \times \lambda$: speed = frequency × wavelength.`];
        if (ask === 'v') {
          return {
            text: `${scene.name} have a frequency of **${f} Hz** and a wavelength of **${num(lambda)} m**. How fast do ${scene.it} travel?`,
            answer: v,
            unit: 'm/s',
            wrong: [[f / lambda, 'Multiply: every second, $f$ waves pass, each $\\lambda$ long.'], [lambda / f, 'Multiply the two: speed = frequency × wavelength.']],
            hints,
            explain: r`$v = f \times \lambda = ${f} \times ${num(lambda)} = ${num(v)}$ m/s.`,
          };
        }
        if (ask === 'lambda') {
          return {
            text: `${scene.name} travel at **${num(v)} m/s** and have a frequency of **${f} Hz**. What is their wavelength?`,
            answer: lambda,
            unit: 'm',
            wrong: [[v * f, 'Multiplying makes it enormous. A higher frequency packs the waves closer together: divide the speed by the frequency.'], [f / v, 'That is upside down: wavelength = speed ÷ frequency.']],
            hints: [...hints, r`Rearranged: $\lambda = \frac{v}{f}$.`],
            explain: r`$\lambda = \frac{v}{f} = \frac{${num(v)}}{${f}} = ${num(lambda)}$ m.`,
          };
        }
        return {
          text: `${scene.name} travel at **${num(v)} m/s** and have a wavelength of **${num(lambda)} m**. What is their frequency?`,
          answer: f,
          unit: 'Hz',
          wrong: [[v * lambda, 'Multiplying is the wrong way round here: divide the speed by the wavelength.'], [lambda / v, 'That is upside down. (It is the period, in seconds.) Frequency = speed ÷ wavelength.']],
          hints: [...hints, r`Rearranged: $f = \frac{v}{\lambda}$.`],
          explain: r`$f = \frac{v}{\lambda} = \frac{${num(v)}}{${num(lambda)}} = ${f}$ Hz.`,
        };
      },
    },
    {
      id: 'medium-predict',
      type: 'choice',
      mode: 'predict',
      title: 'Getting there sooner',
      text: `
        You flick a rope, and the pulse takes 3 s to reach a flag 12 m away.
        You want the next pulse to get there **sooner**.

        What will work?
      `,
      shuffle: false,
      options: [
        { text: 'A bigger flick' },
        { text: 'A quicker, sharper flick' },
        { text: 'A tighter rope', correct: true },
        { text: 'Any of these' },
      ],
      explain: 'Only the tighter rope. Test all three on the next screen.',
    },
    {
      id: 'medium-test',
      type: 'interact',
      attempts: 8,
      title: 'Race to the flag',
      text: `
        **Send a pulse** and time it to the flag, 12 m away. On this rope it
        takes 3 s.

        **Find a way to make the pulse arrive in 2 s.** Try each control.
      `,
      widget: { type: 'rope-wave', wave: 'pulse', speed: 4, amp: 20, flick: 0.5, ampRange: [10, 30, 10], flickRange: [0.25, 0.75, 0.25], ropes: [2, 4, 6], alt: 'A rope with a flag 12 metres from the hand. Sliders set the size of the flick and how long it takes; buttons swap the rope for a looser or a tighter one. A stopwatch times the pulse to the flag.' },
      check: (s) => {
        if (!s.sent) return 'Press **Send a pulse** to time this setting.';
        if (s.travelTime === 2) return true;
        if (s.speed === 2) return 'On the loose rope the pulse takes 6 s: even longer. Try the other rope.';
        return s.amp !== 20 || s.flick !== 0.5
          ? 'Still 3 s. The flick decides the shape of the pulse, not how fast it travels. Try another rope.'
          : 'That is the 3 s you started with. Change something and send another pulse.';
      },
      solution: { speed: 6 },
      hints: ['Compare the stopwatch after a small flick and after a big one.', 'Nothing the hand does changes the time. What else is there?'],
      explain: `
        A bigger flick makes a taller pulse, and a quicker flick a narrower
        one. Both still take 3 s. Only the **tight rope** is faster: 12 m in
        2 s is 6 m/s.
      `,
    },
    {
      id: 'sound',
      type: 'info',
      title: 'The medium sets the speed',
      text: `
        :::key
        The speed of a wave is set by the **medium** it travels through, not
        by the source that made it.
        :::

        For **sound**, a longitudinal wave, the medium is usually the air.

        - In air it travels at about **340 m/s**. (That is at 15 °C. It is a
          little faster in warm air and slower in cold: 331 m/s at 0 °C.)
        - It needs a medium. Through empty space, no sound can travel.
        - **Pitch** is frequency: a low hum is around 100 Hz, a shrill
          whistle a few thousand.
        - **Loudness** goes with amplitude.

        High notes and low notes, loud and soft, all travel at the same speed.
        Otherwise music heard from the back of a hall would arrive scrambled.
      `,
    },
    {
      id: 'example-echo',
      type: 'info',
      title: 'Timing a sound',
      text: r`
        The speed of sound is fixed, so a travel time tells you a distance.
        From *Motion & Forces*: distance = speed × time, and time =
        distance ÷ speed.

        :::example
        A starting pistol fires 510 m away. The bang reaches you after
        $\frac{510}{340} = 1.5$ s.
        :::

        An **echo** is sound that has bounced off something and come back.
        It has made the trip twice.

        :::example
        You shout across a valley and hear the echo 0.5 s later.

        1. The sound travelled $340 \times 0.5 = 170$ m.
        2. That is there **and back**: the far side is $170 \div 2 = 85$ m
           away.
        :::
      `,
    },
    {
      id: 'thunder',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['thunder', 'echo', 'delay']);
        if (kind === 'thunder') {
          const t = rng.pick([2, 3, 4, 5, 6, 8, 10]);
          return {
            text: `You see a flash of lightning and hear its thunder **${t} s** later. Sound travels at ${SOUND} m/s in air, and the light arrives almost at once.\n\n**How far away did the lightning strike?**`,
            answer: SOUND * t,
            unit: 'm',
            wrong: [[SOUND / t, 'Divide and the storm would seem closer the longer you wait. Distance = speed × time.']],
            hints: ['The sound has been travelling for the whole of the wait.', 'Distance = speed × time.'],
            explain: r`The sound travelled for ${t} s at ${SOUND} m/s: $${SOUND} \times ${t} = ${SOUND * t}$ m${SOUND * t >= 1000 ? `, about ${num((SOUND * t) / 1000, 1)} km` : ''}. A handy rule: every 3 s of waiting is about 1 km.`,
          };
        }
        if (kind === 'echo') {
          const t = rng.pick([1, 2, 3, 4]);
          return {
            text: `You clap your hands facing a cliff and hear the echo **${t} s** later. Sound travels at ${SOUND} m/s in air.\n\n**How far away is the cliff?**`,
            answer: (SOUND * t) / 2,
            unit: 'm',
            wrong: [[SOUND * t, 'That is how far the sound travelled altogether: to the cliff **and back**. The cliff is half as far away.']],
            hints: ['An echo has made the trip twice: there and back.'],
            explain: r`In ${t} s the sound travels $${SOUND} \times ${t} = ${SOUND * t}$ m. That is the trip to the cliff and back, so the cliff is $${SOUND * t} \div 2 = ${(SOUND * t) / 2}$ m away.`,
          };
        }
        const t = rng.pick([0.5, 2, 3, 5]);
        const d = SOUND * t;
        return {
          text: `A firework bursts **${d} m** away from you. Sound travels at ${SOUND} m/s in air, and the light arrives almost at once.\n\n**How long after the flash do you hear the bang?**`,
          answer: t,
          unit: 's',
          wrong: [[d * SOUND, 'Multiplying makes it far too long. How many lots of 340 m fit into the distance?']],
          hints: ['Time = distance ÷ speed.'],
          explain: r`Time $= \frac{\text{distance}}{\text{speed}} = \frac{${d}}{${SOUND}} = ${num(t)}$ s.`,
        };
      },
    },
    {
      id: 'crossing',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const [lambda, f, L] = rng.pick([[2, 0.5, 20], [2, 0.5, 25], [4, 0.5, 30], [4, 0.5, 50], [3, 0.5, 30], [1.5, 2, 30], [0.5, 2, 25], [1.5, 2, 45]]);
        const v = f * lambda;
        const t = L / v;
        const bobs = f === 0.5 ? 'once every 2 s' : 'twice every second';
        return {
          text: `
            A wave machine sends waves down a pool **${L} m** long. Their
            crests are **${num(lambda)} m** apart, and a ball floating in the pool
            bobs up and down **${bobs}**.

            How long does one crest take to travel the length of the pool?
          `,
          answer: t,
          unit: 's',
          wrong: [
            [L / lambda, 'That is how many wavelengths fit along the pool. You need the speed first: frequency × wavelength.'],
            [v, 'That is the speed of the waves, in m/s. Now find the time for the whole pool.'],
          ],
          hints: [
            `The ball bobs ${bobs}, so the frequency is ${num(f)} Hz.`,
            r`Speed: $v = f \times \lambda = ${num(f)} \times ${num(lambda)} = ${num(v)}$ m/s.`,
            'Time = distance ÷ speed.',
          ],
          explain: r`The frequency is ${num(f)} Hz, so $v = f \times \lambda = ${num(f)} \times ${num(lambda)} = ${num(v)}$ m/s. The pool is ${L} m long: $\frac{${L}}{${num(v)}} = ${num(t)}$ s. The ball, meanwhile, stays where it is.`,
        };
      },
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'Which way do the parts of the medium move, compared with the direction the wave travels in?',
      buckets: ['Across it: transverse', 'Along it: longitudinal'],
      items: [
        { text: 'A wave on a shaken rope', bucket: 0 },
        { text: 'A plucked guitar string', bucket: 0, why: 'Each bit of the string moves from side to side, while the wave runs along the string.' },
        { text: 'A wiggle sent down a washing line', bucket: 0 },
        { text: 'Sound in air', bucket: 1, why: 'The air is squeezed and stretched along the direction the sound travels in.' },
        { text: 'A push-pull wave on a long spring', bucket: 1 },
        { text: 'Sound under water', bucket: 1, why: 'Sound in water is the same kind of wave as in air: squeezes that travel along.' },
        { text: 'The jolt down a line of wagons when the first is bumped', bucket: 1, why: 'Each wagon is shoved along the track and passes the shove on: the motion is along the direction of travel.' },
      ],
      explain: 'In a transverse wave the medium moves across the direction of travel, like a rope. In a longitudinal wave it moves to and fro along it, like a spring being pushed and pulled, or the air carrying a sound.',
    },
  ],
  recap: [
    'A wave carries a disturbance, and energy, from place to place. The medium does not travel: each part only moves to and fro about its own spot.',
    '**Transverse**: the parts move across the direction of travel (a rope). **Longitudinal**: along it (a spring, sound).',
    r`Wave speed = frequency × wavelength: $v = f\lambda$.`,
    'The speed is set by the medium, not by the source. Sound in air travels at about 340 m/s.',
  ],
  next: 'Next: what happens when two waves arrive in the same place at the same time?',
};
