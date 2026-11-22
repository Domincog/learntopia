// Physics II: Orbits & Waves · Lesson 2 · Falling Around the Earth
import { r, num } from '../../../kit.js';
import { G, EARTH_RADIUS, grouped, groupedTex, curveDrop, liftScale } from '../helpers.js';

// Newton's mountain: 882 km high, on an Earth of radius 6400 km with g = 10 m/s² at the ground.
// From its top a ball needs 7.5 km/s to circle the planet; just above the ground it would need 8 km/s.
const CANNON = { type: 'orbit-cannon', speed: 3 };

/** Landing distances are quoted to the nearest 10 km, as the widget shows them. */
const km10 = (v) => grouped(Math.round(v / 10) * 10);

export default {
  id: 'gravity-orbits',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: "Newton's cannon",
      text: `
        A faster sideways throw lands further away. That was on flat ground,
        but the Earth is round.

        Isaac Newton imagined a cannon on a mountain so high that it stands
        above the air. It fires horizontally, faster and faster. Two shots are
        drawn already.

        **What happens as the speed keeps going up?**
      `,
      figure: { ...CANNON, static: true, show: 'start', ghosts: [3, 5], alt: 'The Earth with a very high mountain on top and a cannon on its peak. Two dashed paths curve from the cannon down to the ground: a slow shot lands close to the mountain, a faster one further round the Earth.' },
      shuffle: false,
      options: [
        { text: 'It always lands, only further and further away' },
        { text: 'At some speed it never lands: it keeps going round the Earth', correct: true },
        { text: 'At some speed it leaves in a straight line, out into space' },
      ],
      explain: `
        Fast enough, and the ball never comes down. Newton's drawing of this
        was published in 1728, long before anyone could try it.

        You can. First, a look at what the cannon does.
      `,
    },
    {
      id: 'teach-cannon',
      type: 'info',
      title: 'A throw on a round planet',
      text: `
        In *Motion & Forces*, a ball fired sideways did two things at once:
        it kept its sideways speed, and it fell. A faster shot fell just the
        same, but landed further off.

        On a round planet there is a twist. While the ball falls, the ground
        curves away beneath it. So a faster shot lands further **round** the
        planet.

        Speeds here are in kilometres per second. The solid path is a shot
        at 5 km/s: it covers 5 km every second, and still comes down, about
        3,000 km from the mountain.
      `,
      figure: { ...CANNON, speed: 5, static: true, show: 'end', ghosts: [3], alt: 'The Earth with a cannon on a very high mountain. A dashed path, the slower shot, lands close to the mountain. A solid path, the shot at 5 kilometres per second, curves further round the Earth before it reaches the ground.' },
    },
    {
      id: 'cannon',
      type: 'interact',
      attempts: 8,
      title: 'Faster, faster',
      text: `
        The mountain here is absurdly high: about 880 km. There is no air, and
        gravity is the only force on the ball.

        **Fire the cannon. Then find the lowest speed on the slider at which
        the ball never comes down.**
      `,
      widget: { ...CANNON, speedRange: [1, 8, 0.5], alt: 'The Earth with a cannon on a very high mountain. A slider sets the launch speed.' },
      check: (s) => {
        if (!s.launched) return 'Press **Fire** to test this speed.';
        if (s.lands) return `At ${num(s.speed)} km/s the ball comes down ${km10(s.distance)} km from the foot of the mountain. It needs to go faster.`;
        if (s.speed === 7.5) return true;
        return `At ${num(s.speed)} km/s it never lands, but it swings out to ${km10(s.highest)} km above the ground before coming back. Can a slower shot stay up too?`;
      },
      solution: { speed: 7.5 },
      hints: [
        'Watch the landing point move round the planet as the speed goes up.',
        'At 7 km/s the ball gets about a quarter of the way round. Go one step faster.',
      ],
      explain: `
        At **7.5 km/s** the ball never gets any closer to the ground. It
        circles the planet and comes back to the cannon after 102 minutes,
        still doing 7.5 km/s, ready to go round again.

        A faster shot stays up as well, on a stretched loop.
      `,
    },
    {
      id: 'falling',
      type: 'info',
      title: 'Falling without landing',
      text: r`
        A path that goes round a planet without ever landing is an **orbit**.

        The ball in orbit has not escaped gravity. Gravity is the **only**
        force on it, and it is falling the whole time. But it moves sideways
        so fast that the ground curves away beneath it as quickly as it
        falls. Above the air nothing slows it down, so it needs no engine.

        Near the ground the numbers are these. In one second a ball falls
        [5 m]{.red} (as before, $g = 10 \text{ m/s}^2$ and no air). And over
        8 km, the round Earth's surface drops away by [5 m]{.blue}. So a ball
        that covers 8 km every second stays just as high above the ground.
      `,
      figure: curveDrop({ alt: 'A ball starts moving level. One second later it is 8 kilometres further on and has fallen 5 metres below its starting line. Over the same 8 kilometres the curved ground has also dropped away by 5 metres. Not to scale.' }),
    },
    {
      id: 'eight',
      type: 'fill',
      title: 'The same answer from circles',
      text: r`
        An orbit is circular motion, and the centripetal force is gravity.
        Just above the ground, the acceleration towards the centre is
        $g = 10 \text{ m/s}^2$ and the radius of the circle is the Earth's:
        6,400 km, which is 6,400,000 m.

        Put that into $a = \frac{v^2}{r}$:
      `,
      template: r`$v^2 = g \times r = 10 \times 6{,}400{,}000 =$ [[640,000|6,400,000|*64,000,000]], so $v =$ [[800|*8,000|80,000]] m/s. That is [[8]] km every second.`,
      hints: [r`Multiplying by 10 adds one zero. Then find the number that, multiplied by itself, gives $v^2$.`],
      explain: r`
        $8{,}000 \times 8{,}000 = 64{,}000{,}000$, so $v = 8{,}000$ m/s: about
        **8 km/s**, the same as before. (With the measured values,
        $g = 9.8 \text{ m/s}^2$ and $r = 6{,}370$ km, it comes to 7.9 km/s.)

        The cannon needed only 7.5 km/s. It stood 880 km up, and up there
        gravity is weaker.
      `,
    },
    {
      id: 'teach-orbit-speed',
      type: 'info',
      title: 'Orbital speed',
      text: r`
        In a low circular orbit gravity is the centripetal force, so the
        acceleration towards the centre, $\frac{v^2}{r}$, is simply $g$. That
        gives

        $$ v^2 = g \times r $$

        Put $r$ in metres (1 km is 1000 m) and $g$ in $\text{m/s}^2$, and $v$
        comes out in m/s. The rule works on any world, with that world's own
        $g$ and radius.

        :::example
        A small airless moon has a radius of 900 km, which is 900,000 m. At
        its surface $g = 0.9 \text{ m/s}^2$.

        1. $v^2 = 0.9 \times 900{,}000 = 810{,}000$
        2. Which number squared gives 810,000? $900 \times 900$. So
           $v = 900$ m/s.
        :::
      `,
    },
    {
      id: 'orbit-speed',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        // worlds made of rock like the Earth's: gravity at the surface goes with the radius
        const [rad, g, v] = rng.pick([[1600, 2.5, 2000], [2400, 3.75, 3000], [3200, 5, 4000], [4000, 6.25, 5000], [4800, 7.5, 6000], [5600, 8.75, 7000]]);
        const kind = rng.pick(rad <= 1600 ? ['moon', 'dwarf planet'] : ['moon', 'rocky planet']);
        const craft = rng.pick(['a satellite', 'a space probe', 'a small spacecraft']);
        return {
          text: r`
            An airless ${kind} has a radius of **${grouped(rad)} km**, which is
            ${grouped(rad * 1000)} m. At its surface, falling things accelerate at
            **$${g} \text{ m/s}^2$**.

            How fast must ${craft} go to stay in a circular orbit just above the
            surface?
          `,
          answer: v,
          unit: 'm/s',
          wrong: [
            [g * rad * 1000, 'That is $v^2$. Take the square root to get the speed.'],
            [v / 1000, 'That is the speed in km/s. The box asks for m/s.'],
            [g * rad, 'Use the radius in metres, and remember that $g \\times r$ is $v^2$, not $v$.'],
          ],
          hints: [
            r`In a low orbit, gravity alone provides the centripetal acceleration: $\frac{v^2}{r} = g$.`,
            r`$v^2 = g \times r = ${g} \times ${groupedTex(rad * 1000)} = ${groupedTex(v * v)}$. Which number squared gives that?`,
          ],
          explain: r`$\frac{v^2}{r} = g$, so $v^2 = g \times r = ${g} \times ${groupedTex(rad * 1000)} = ${groupedTex(v * v)}$ and $v = ${groupedTex(v)}$ m/s. That is ${v / 1000} km/s: a smaller world with weaker gravity can be circled more slowly than the Earth.`,
        };
      },
    },
    {
      id: 'inverse-square',
      type: 'interact',
      attempts: 6,
      title: 'Further from the Earth',
      text: `
        Gravity weakens as you move away. Distances count from the **centre**
        of the Earth: on the ground you are already 1 Earth radius (6,400 km)
        from it, and each kilogram is pulled with 10 N.

        **Drag the 1 kg probe outwards until the pull on it has dropped to a
        quarter of that: 2.5 N.**
      `,
      widget: { type: 'gravity-probe', distance: 1, max: 6, step: 0.5, alt: 'The Earth with a one-kilogram probe that can be dragged away from it along a scale marked in Earth radii from the centre. An arrow and a readout show the pull of gravity on the probe.' },
      check: (s) => {
        const d = s.distance;
        const pull = num(G / (d * d), d > 3 ? 3 : 2);        // as the widget shows it: 0.625 N, but 4.44 N
        if (d === 2) return true;
        if (d === 4) return `At 4 Earth radii the pull is ${pull} N: a sixteenth of 10 N, not a quarter. Come back in.`;
        return d < 2
          ? `At ${num(d)} Earth ${d === 1 ? 'radius' : 'radii'} the pull on the kilogram is still ${pull} N. Go further out.`
          : `At ${num(d)} Earth radii the pull is down to ${pull} N: less than a quarter of 10 N. Come back in.`;
      },
      solution: { distance: 2, visited: [1, 1.5, 2] },
      hints: ['A quarter of 10 N is 2.5 N. Watch the red readout while you drag.'],
      explain: `
        **Twice** as far from the centre, and the pull is down to a quarter.
        Three times as far: a ninth (1.11 N). Four times: a sixteenth.

        It fades quickly, but it never reaches zero.
      `,
    },
    {
      id: 'law',
      type: 'info',
      title: 'The inverse-square law',
      text: r`
        Gravity weakens with the **square** of the distance from the centre:

        | Distance from the centre (Earth radii) | 1 | 2 | 3 | 4 | 10 |
        |------|:---:|:---:|:---:|:---:|:---:|
        | Times weaker than at the ground | 1 | 4 | 9 | 16 | 100 |
        | Pull on each kilogram (N) | 10 | 2.5 | 1.11 | 0.625 | 0.1 |

        :::key
        Go $n$ times as far from the centre, and gravity is $n^2$ times
        weaker.
        :::

        :::example
        A probe weighs 750 N on the ground. What does it weigh 25,600 km
        **above the ground**?

        1. Count from the centre: 6,400 + 25,600 = 32,000 km. That is 5
           Earth radii.
        2. $5^2 = 25$ times weaker: $\frac{750}{25} = 30$ N.
        :::
      `,
    },
    {
      id: 'weaker',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const byHeight = rng.bool(0.4);
        const k = byHeight ? rng.pick([2, 3, 4]) : rng.pick([2, 3, 4, 5, 10]);
        // the weight that is left; when the height is given, chosen so that the slip "measured from the ground" is a round number too
        const a = rng.pick(byHeight
          ? { 2: [50, 120, 200, 450], 3: [20, 40, 100], 4: [9, 18, 45] }[k]
          : { 2: [50, 120, 200, 450], 3: [20, 50, 100], 4: [10, 25, 50], 5: [4, 8, 20, 40], 10: [2, 5, 8, 12] }[k]);
        const W = a * k * k;
        const thing = rng.pick(['a space probe', 'a satellite', 'a crate of supplies']);
        const height = (k - 1) * EARTH_RADIUS;
        const where = byHeight
          ? `**${grouped(height)} km above the ground**? (The Earth's radius is 6,400 km.)`
          : `**${k} Earth radii from the centre of the Earth**?`;
        const wrong = [[W / k, `Gravity does not fall in step with the distance, but with its square: ${k} times as far means ${k * k} times weaker.`]];
        if (byHeight && k > 2) wrong.push([W / ((k - 1) * (k - 1)), `Count the distance from the **centre** of the Earth, not from the ground: ${grouped(height)} km up is ${k} Earth radii from the centre.`]);
        if (byHeight && k === 2) wrong.push([W, 'Up there it is twice as far from the centre of the Earth as on the ground, so gravity is weaker.']);
        return {
          text: `On the launch pad, ${thing} weighs **${W} N**. How much does it weigh when it is ${where}`,
          answer: a,
          unit: 'N',
          wrong,
          hints: byHeight
            ? [`First find the distance from the centre: the Earth's radius plus the height is ${grouped(EARTH_RADIUS)} + ${grouped(height)} = ${grouped(k * EARTH_RADIUS)} km.`, `That is ${k} Earth radii, so gravity is ${k * k} times weaker.`]
            : [`${k} times as far from the centre: gravity is ${k} × ${k} times weaker.`],
          explain: byHeight
            ? r`${grouped(height)} km above the ground is ${grouped(k * EARTH_RADIUS)} km from the centre: ${k} Earth radii. So gravity is $${k}^2 = ${k * k}$ times weaker: $\frac{${W}}{${k * k}} = ${a}$ N.`
            : r`${k} times as far from the centre means $${k}^2 = ${k * k}$ times weaker: $\frac{${W}}{${k * k}} = ${a}$ N.`,
        };
      },
    },
    {
      id: 'iss',
      type: 'slider',
      mode: 'predict',
      title: 'Floating',
      text: `
        Astronauts on the International Space Station float about freely. The
        station orbits about 400 km above the ground.

        **How strong do you think gravity is up there, compared with the
        ground?**
      `,
      min: 0, max: 100, step: 5, start: 50, answer: 90, tolerance: 5, unit: '%',
      explain: r`
        About **90%**. The station is 6,800 km from the centre instead of
        6,400 km, and $\left(\frac{6400}{6800}\right)^2 \approx 0.89$.

        An astronaut who weighs 700 N on the ground still weighs about 620 N
        up there. So why does she float?
      `,
    },
    {
      id: 'teach-free-fall',
      type: 'info',
      title: 'What weight feels like',
      text: `
        You never feel gravity itself. What you feel as your weight is the
        floor pushing up on you.

        Stand on a bathroom scale in a lift, and it shows your weight. Now
        imagine the cable snaps. You, the scale and the lift all fall
        together. Nothing presses on the scale, and it reads **zero**.

        That is **free fall**, as for the dropped balls in *Motion & Forces*:
        gravity is the only force. Your weight is still there. The push of
        the floor is gone.
      `,
      figure: liftScale({ alt: 'Two lifts, each with a person standing on a bathroom scale. In the first the cable holds, the floor pushes up on the person and the scale reads 700 newtons. In the second the cable has snapped, the lift, the scale and the person all fall together, and the scale reads zero.' }),
    },
    {
      id: 'floating',
      type: 'choice',
      review: true,
      text: `
        At the height of the International Space Station, gravity is still
        about 90% as strong as on the ground.

        **Why do the astronauts inside float?**
      `,
      options: [
        { text: 'They are falling around the Earth together with the station, so nothing presses them against its floor', correct: true },
        { text: 'There is no gravity in space', why: 'At that height gravity is still about 90% as strong as on the ground. It is what holds the station in its orbit.' },
        { text: 'An outward centrifugal force cancels gravity', why: 'No outward force acts on them. Gravity is the only force, and nothing cancels it: it is exactly what bends their path into a circle.' },
        { text: 'They are too far from the Earth to have weight', why: 'They are only about 400 km up, a sixteenth of the Earth\'s radius. Their weight is nearly what it is on the ground.' },
      ],
      explain: `
        The station and everyone in it are in **free fall**: they are Newton's
        cannonball, falling around the Earth. Gravity still pulls on them,
        but the floor falls just as fast as they do, so it never pushes up on
        them.

        It is like a lift whose cable has snapped, all the way round the
        Earth.
      `,
    },
    {
      id: 'higher-slower',
      type: 'fill',
      title: 'Higher and slower',
      text: `
        Real orbits round the Earth. (The Earth itself turns once a day.)

        | | Distance from the centre | Speed | One lap |
        |------|------:|------:|------:|
        | Space Station | 6,800 km | 7.7 km/s | 93 min |
        | GPS satellites | 26,600 km | 3.9 km/s | 12 h |
        | TV satellites | 42,200 km | 3.1 km/s | 1 day |
        | The Moon | 384,000 km | 1.0 km/s | 27.3 days |
      `,
      template: 'The higher the orbit, the [[faster|*slower]] the satellite moves, and the [[*longer|shorter]] each lap takes. Seen from the turning Earth, a satellite whose lap takes one day seems to [[*hang still in the sky|cross the sky once a day]].',
      explain: `
        Further out, gravity is weaker and bends the path more gently, so a
        lower speed is enough. The circle is longer too.

        At 42,200 km from the centre one lap takes exactly as long as the
        Earth takes to turn once (23 h 56 min). A satellite there, above the
        equator, stays over the same spot: it is **geostationary**, and a dish
        on a roof can point at it without ever moving.
      `,
    },
    {
      id: 'moon-test',
      type: 'fill',
      stretch: true,
      title: "Newton's test",
      text: r`
        Newton's bold idea was that one force reaches from the apple on its
        tree all the way to the Moon, and holds it in its orbit. He could
        check.

        The Moon is 60 Earth radii from the Earth's centre. It moves at
        1,020 m/s round a circle of radius 384,000,000 m. (For the last
        blank: $1020^2$ is a little over a million.)
      `,
      template: r`Out there, gravity should be $60^2 =$ [[3600]] times weaker than at the ground: $10 \div 3600 \approx 0.0028 \text{ m/s}^2$. The Moon's own acceleration towards the Earth is $\frac{v^2}{r} = \frac{1020^2}{384{,}000{,}000} \approx$ [[0.27|0.027|*0.0027]] $\text{m/s}^2$.`,
      hints: [
        'Sixty times as far: weaker by sixty squared.',
        r`$1020^2$ is about a million. A million divided by 384 million is about $\frac{1}{384}$.`,
      ],
      explain: r`
        $1020^2 = 1{,}040{,}400$, and dividing by $384{,}000{,}000$ gives
        $0.0027 \text{ m/s}^2$. The two numbers agree as closely as our
        rounded $g$ allows.

        The Moon is falling around the Earth, held by the same gravity that
        pulls an apple down, only 3,600 times weaker.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'A satellite circles the Earth in a steady, circular orbit, above the air. Sort the statements.',
      buckets: ['True', 'False'],
      items: [
        { text: 'Gravity is the only force on it', bucket: 0 },
        { text: 'It is falling towards the Earth the whole time', bucket: 0, why: 'It falls all the time. It just never gets closer, because the ground curves away as fast as it falls.' },
        { text: 'Its speed stays the same', bucket: 0 },
        { text: 'Its acceleration points at the centre of the Earth', bucket: 0, why: 'Circular motion means an acceleration towards the centre, and gravity pulls exactly that way.' },
        { text: 'It needs its engine running to keep going', bucket: 1, why: 'Above the air nothing slows it down, so it keeps its speed without any push, as Newton\'s first law says.' },
        { text: 'There is no gravity at its height', bucket: 1, why: 'Gravity is weaker up there, but far from zero. Without it the satellite would leave along the tangent.' },
        { text: 'An outward force balances gravity', bucket: 1, why: 'If the forces balanced, it would move in a straight line. Gravity is unbalanced, and that is why the path curves.' },
      ],
      explain: 'An orbit is circular motion with gravity as the centripetal force, and nothing else: no engine, no outward force. The satellite falls the whole time and never lands.',
    },
  ],
  recap: [
    'An orbit is free fall: the satellite keeps falling, but the ground curves away beneath it just as fast.',
    r`Gravity supplies the centripetal force. Just above the Earth, $\frac{v^2}{r} = g$ gives a speed of about 8 km/s.`,
    'Gravity weakens with the square of the distance from the centre: twice as far, a quarter of the pull. Higher orbits are slower and take longer.',
    'Astronauts float because they fall together with their ship, not because gravity is missing.',
  ],
  next: 'Next: motion that comes back the way it went. What sets the rhythm of a swing?',
};
