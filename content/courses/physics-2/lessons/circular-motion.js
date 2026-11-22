// Physics II: Orbits & Waves · Lesson 1 · Turning Without Speeding Up
import { r, num } from '../../../kit.js';
import { aAn } from '../helpers.js';

/** "A" or "An" at the start of a sentence, before a number. */
const AAn = (n) => (aAn(n) === 'an' ? 'An' : 'A');

// A 2 kg puck on a 1 m string at 2 m/s: the string pulls with 2 × 2² ÷ 1 = 8 N.
const PUCK = { type: 'whirl-ball', speed: 2, radius: 1, mass: 2 };

const WAYS = ['Up the screen', 'Down the screen', 'To the left', 'To the right'];
const PLACES = { 0: 'to the right of the peg', 90: 'above the peg', 180: 'to the left of the peg', 270: 'below the peg' };
/** Index into WAYS of the direction from the puck to the peg, for a puck at `angle` (degrees anticlockwise from "east"). */
const inward = (angle) => ({ 0: 2, 90: 1, 180: 3, 270: 0 }[angle]);
/** Index into WAYS of the direction the puck is moving. dir 1: anticlockwise, -1: clockwise. */
const heading = (angle, dir) => {
  const anti = { 0: 0, 90: 2, 180: 1, 270: 3 }[angle];
  return dir === 1 ? anti : [1, 0, 3, 2][anti];
};
const OPPOSITE = [1, 0, 3, 2];

export default {
  id: 'circular-motion',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Round and round',
      text: `
        A puck on a string glides round a peg on smooth ice, at a steady
        **2 m/s**. You are looking down from above. No friction, no air.

        In *Motion & Forces*, a steady speed meant balanced forces.
        **Is there a net force on this puck?**
      `,
      figure: { ...PUCK, static: true, arrows: false, alt: 'Seen from above: a puck on a string, circling a peg anticlockwise.' },
      shuffle: false,
      options: [
        { text: 'No: its speed is steady, so the forces balance' },
        { text: 'Yes: outwards, away from the peg' },
        { text: 'Yes: inwards, towards the peg', correct: true },
        { text: 'Yes: forwards, along its path' },
      ],
      explain: `
        There is a net force, and it points **inwards**. The rule from
        *Motion & Forces* was: no net force means steady speed **in a straight
        line**. This puck keeps its speed but not its direction.

        To see what the force is doing, take it away.
      `,
    },
    {
      id: 'cut-predict',
      type: 'choice',
      mode: 'predict',
      title: 'Snip',
      text: `
        The puck is going round anticlockwise. At the moment shown, the string
        is **cut**.

        Which path does the puck take?
      `,
      figure: { ...PUCK, static: true, paths: true, angle: 90, alt: 'The puck at the top of its circle, with three dashed paths. A goes straight up, away from the peg. B goes straight to the left, along the tangent. C carries on curving round in a widening spiral.' },
      shuffle: false,
      options: [
        { text: 'Straight out, directly away from the peg' },
        { text: 'Straight on, in the direction it was heading', correct: true },
        { text: 'Still curving, in a widening spiral' },
      ],
      explain: 'Path B: straight on. Many people expect it to fly outwards, or to keep some of its curve. Try it on the next screen.',
    },
    {
      id: 'cut-run',
      type: 'interact',
      graded: false,
      title: 'Run the experiment',
      text: `
        **Cut the string.** Then tie it back on and cut it again, at a
        different point of the circle.

        The pale images are taken at equal time steps. Look at their spacing.
      `,
      widget: { ...PUCK, readouts: ['force'], alt: 'A puck on a string, circling a peg, with a button that cuts the string.' },
      check: (s) => {
        if (s.cuts >= 2) return true;
        if (s.cuts === 1) return 'Tie it back on and cut it once more, somewhere else on the circle. Does it ever head outwards?';
        return 'Press **Cut the string**.';
      },
      solution: { cuts: 2 },
      explain: `
        Wherever you cut, the puck goes straight on, and the pale images are
        evenly spaced: its speed stays the same. It never heads outwards.
      `,
    },
    {
      id: 'teach-tangent',
      type: 'info',
      title: 'No force, no turning',
      text: `
        Wherever the string is cut, the puck leaves along the **tangent**:
        the straight line that touches the circle at that point. It goes
        straight on, the way it was heading at that instant, at the same
        speed.

        Nothing throws it outwards. With no string there is no force on it,
        and by Newton's first law it then moves in a straight line at a
        steady speed.

        :::example Which way?
        A puck circling **clockwise** is cut loose at the bottom of its
        circle. A moment later it would have been a little further left. So
        it was heading left, and it moves off **to the left**.
        :::
      `,
      figure: { ...PUCK, static: true, show: 'cut', angle: 270, dir: -1, alt: 'The puck at the bottom of its clockwise circle, at the instant the string is cut. Its velocity arrow points to the left, along the line that touches the circle there.' },
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Changing direction is accelerating',
      text: `
        Velocity is speed **and direction**. The puck's speed stays at 2 m/s,
        but its direction never stops changing. So its velocity is changing:
        it is **accelerating**, and that needs a net force.

        - The [velocity]{.blue} points along the circle.
        - The [force]{.red} points at the centre, at right angles to the
          velocity. It turns the puck without making it faster or slower.

        :::key
        Moving in a circle at a steady speed needs a net force towards the
        centre: the **centripetal** ("centre-seeking") force.
        :::
      `,
      figure: { ...PUCK, cut: false, readouts: [], alt: 'The circling puck with two arrows: its velocity along the circle and the force of the string towards the peg.' },
    },
    {
      id: 'direction',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const angle = rng.pick([0, 90, 180, 270]);
        const dir = rng.pick([1, -1]);
        const ask = rng.pick(['force', 'cut']);
        const sense = dir === 1 ? 'anticlockwise' : 'clockwise';
        const fIdx = inward(angle);
        const vIdx = heading(angle, dir);
        const right = ask === 'force' ? fIdx : vIdx;
        const why = (i) => {
          if (ask === 'force') {
            if (i === OPPOSITE[fIdx]) return 'That is directly away from the peg. Nothing pulls the puck that way: a string can only pull towards the peg.';
            if (i === vIdx) return 'That is the way the puck is moving. The force is at right angles to that: it points along the string.';
            return 'That is opposite to the way the puck is moving. A force like that would slow it down, but its speed is steady.';
          }
          if (i === fIdx) return 'That is the direction of the string\'s pull. Once the string is cut there is no pull, and the puck keeps the velocity it had.';
          if (i === OPPOSITE[fIdx]) return 'Nothing pushes it directly away from the peg. It keeps the velocity it had, and that points along the circle.';
          return `That is where it would go if it were circling ${dir === 1 ? 'clockwise' : 'anticlockwise'}.`;
        };
        return {
          text: ask === 'force'
            ? `Seen from above: a puck on a string circles a peg **${sense}** on smooth ice, at a steady speed. Right now it is ${PLACES[angle]}.\n\n**Which way does the net force on the puck point?**`
            : `Seen from above: a puck on a string circles a peg **${sense}** on smooth ice. Right now it is ${PLACES[angle]}, and at this instant the string snaps.\n\n**Which way does the puck move off?**`,
          figure: { ...PUCK, static: true, arrows: false, angle, dir, alt: `A puck on a string, ${PLACES[angle]}. A grey arrow shows that it is going round ${sense}.` },
          shuffle: false,
          options: WAYS.map((text, i) => (i === right ? { text, correct: true } : { text, why: why(i) })),
          explain: ask === 'force'
            ? `The only force along the ice is the pull of the string, and a string pulls towards the peg. The puck is ${PLACES[angle]}, so the force points ${WAYS[fIdx].toLowerCase()}: towards the centre, whichever way it is circling.`
            : `With the string gone there is no force, so the puck keeps the velocity it had: along the tangent. Going ${sense} and ${PLACES[angle]}, that is ${WAYS[vIdx].toLowerCase()}.`,
        };
      },
    },
    {
      id: 'speed-force',
      type: 'interact',
      attempts: 6,
      title: 'How hard must the string pull?',
      text: `
        This 2 kg puck circles on a 1 m string. At 2 m/s the string pulls with
        **8 N**.

        **Change the speed until the string has to pull four times as hard:
        32 N.**
      `,
      widget: { ...PUCK, speedRange: [1, 6, 1], cut: false, readouts: ['force'], alt: 'The circling puck with a speed slider and a readout of the pull of the string.' },
      check: (s) => {
        if (s.force === 32) return true;
        return s.force < 32
          ? `At ${s.speed} m/s the string pulls with ${num(s.force, 1)} N. It takes more speed to need 32 N.`
          : `At ${s.speed} m/s the string pulls with ${num(s.force, 1)} N: more than 32 N. Slow down.`;
      },
      solution: { speed: 4 },
      hints: ['Go up one step at a time and compare each reading with the 8 N you started from.'],
      explain: `
        Only **twice** the speed, 4 m/s, already takes four times the pull.

        | Speed (m/s) | 1 | 2 | 3 | 4 | 5 | 6 |
        |------|:---:|:---:|:---:|:---:|:---:|:---:|
        | Pull (N) | 2 | 8 | 18 | 32 | 50 | 72 |

        Double the speed: 4 times the force. Triple it: 9 times. The force
        goes with the **square** of the speed.
      `,
    },
    {
      id: 'radius-force',
      type: 'fill',
      title: 'Tight turns',
      text: `
        Now the speed stays at 4 m/s and you change the **radius** of the
        circle.

        **Slide it from 1 m to 2 m** and read the pull of the string each
        time.
      `,
      figure: { ...PUCK, speed: 4, radiusRange: [0.5, 2, 0.5], cut: false, readouts: ['force'], alt: 'The circling puck with a radius slider and a readout of the pull of the string.' },
      template: 'At 1 m the string pulls with [[32]] N. At 2 m it pulls with [[16]] N. So at the same speed, doubling the radius [[doubles|*halves|quarters]] the force.',
      hints: ['The readout under the picture shows the pull for the radius the slider is set to.'],
      explain: `
        From 32 N at 1 m to 16 N at 2 m: double the radius, **half** the force.
        A wider circle is a gentler turn. And a tighter one needs more: 64 N
        at 0.5 m.

        Fast and tight is the demanding combination, as every driver knows.
      `,
    },
    {
      id: 'formula',
      type: 'info',
      title: 'One rule for both experiments',
      text: r`
        Both experiments fit one rule. An object moving at speed $v$ (in m/s)
        round a circle of radius $r$ (in m) accelerates towards the centre
        with

        $$ a = \frac{v^2}{r} $$

        measured in $\text{m/s}^2$. The speed is **squared**: twice the speed,
        four times as much. The radius **divides**: twice the radius, half as
        much.

        :::example
        A runner rounds a curve of radius 40 m at a steady 6 m/s.

        1. Square the speed: $6^2 = 36$.
        2. Divide by the radius: $\frac{36}{40} = 0.9 \text{ m/s}^2$, towards
           the centre.
        :::
      `,
      figure: { ...PUCK, speedRange: [1, 6, 1], radiusRange: [0.5, 2, 0.5], cut: false, readouts: ['accel'], alt: 'The circling puck with sliders for its speed and the radius of its circle, and a readout of its acceleration towards the centre.' },
    },
    {
      id: 'find-accel',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { cases: [[10, 20], [10, 25], [12, 36], [15, 45], [8, 32]], say: (v, rad) => `A car drives round a roundabout of radius **${rad} m** at a steady **${v} m/s**.` },
          { cases: [[10, 25], [12, 24], [15, 25], [10, 50]], say: (v, rad) => `A cyclist rides round the banked end of a track, a curve of radius **${rad} m**, at a steady **${v} m/s**.` },
          { cases: [[2, 2], [2, 0.8], [3, 3], [3, 4.5]], say: (v, rad) => `A child sits **${rad} m** from the centre of a playground roundabout and moves at a steady **${v} m/s**.` },
          { cases: [[100, 2000], [120, 3600], [200, 8000], [150, 4500]], say: (v, rad) => `An aircraft flies a level turn of radius **${rad} m** at a steady **${v} m/s**.` },
          { cases: [[6, 18], [8, 32], [6, 36], [9, 27]], say: (v, rad) => `A speed skater rounds a curve of radius **${rad} m** at a steady **${v} m/s**.` },
        ]);
        const [v, rad] = rng.pick(scene.cases);
        const a = (v * v) / rad;
        return {
          text: `${scene.say(v, rad)} What is the acceleration towards the centre of the circle?`,
          answer: a,
          unit: 'm/s²',
          wrong: [
            [v / rad, 'The speed has to be squared before you divide by the radius.'],
            [v * v, 'That is $v^2$. Now divide it by the radius.'],
            [0, 'The speed is steady, but the direction keeps changing. That is an acceleration too.'],
          ],
          hints: [r`$a = \frac{v^2}{r}$. Square the speed first.`],
          explain: r`$a = \frac{v^2}{r} = \frac{${v}^2}{${num(rad)}} = \frac{${v * v}}{${num(rad)}} = ${num(a)} \text{ m/s}^2$, towards the centre.`,
        };
      },
    },
    {
      id: 'teach-force',
      type: 'info',
      title: 'From acceleration to force',
      text: r`
        Newton's second law, from *Motion & Forces*: net force = mass ×
        acceleration, $F = ma$. Here the acceleration is $\frac{v^2}{r}$, so
        the net force towards the centre is

        $$ F = \frac{m\,v^2}{r} $$

        with $m$ in kg and $F$ in newtons (N).

        :::example
        The 2 kg puck at 4 m/s on its 1 m string:
        $F = \frac{2 \times 4^2}{1} = 32$ N. That is what the readout showed.
        :::

        Centripetal force is not a new kind of force. It is a **job**, done by
        whatever force points at the centre: the string for the puck,
        friction for a car on a bend, gravity for the Moon.
      `,
    },
    {
      id: 'find-force',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { ms: [800, 1000, 1200], cases: [[10, 50], [20, 100], [10, 25], [20, 80], [15, 45]], say: (m, v, rad) => `${AAn(m)} **${m} kg** car takes a bend of radius **${rad} m** at a steady **${v} m/s**.`, by: 'Friction between the tyres and the road has to supply it.' },
          { ms: [0.5, 2], cases: [[4, 0.8], [6, 1.2], [3, 0.75], [3, 1.5]], say: (m, v, rad) => `${AAn(m)} **${m} kg** stone is whirled on a string in a circle of radius **${rad} m** on smooth ice, at a steady **${v} m/s**.`, by: 'The string has to supply it.' },
          { ms: [30, 40, 50], cases: [[5, 5], [6, 4], [4, 8], [6, 9]], say: (m, v, rad) => `${AAn(m)} **${m} kg** child rides a fairground carousel, **${rad} m** from its centre, at a steady **${v} m/s**.`, by: 'The seat has to supply it.' },
        ]);
        const m = rng.pick(scene.ms);
        const [v, rad] = rng.pick(scene.cases);
        const a = (v * v) / rad;
        const F = m * a;
        return {
          text: `${scene.say(num(m), v, num(rad))} How big is the net force towards the centre?`,
          answer: F,
          unit: 'N',
          wrong: [
            [(m * v) / rad, 'The speed has to be squared.'],
            [m * v * v, r`That is $m \times v^2$. It still has to be divided by the radius.`],
            [a, r`That is the acceleration, $\frac{v^2}{r}$, in m/s². Multiply by the mass to get the force.`],
          ],
          hints: [r`$F = \frac{m\,v^2}{r}$`, r`The acceleration is $\frac{${v}^2}{${num(rad)}} = ${num(a)} \text{ m/s}^2$. Now use $F = ma$.`],
          explain: r`$F = \frac{m\,v^2}{r} = \frac{${num(m)} \times ${v}^2}{${num(rad)}} = ${num(m)} \times ${num(a)} = ${num(F)}$ N, towards the centre. ${scene.by}`,
        };
      },
    },
    {
      id: 'ice',
      type: 'choice',
      title: 'Black ice',
      text: `
        A car takes a bend at a steady speed. The only sideways force on it is
        the friction between its tyres and the road.

        **Press "Hit an ice patch"**: the friction drops to nothing. Which way
        does the car go?
      `,
      figure: { type: 'whirl-ball', body: 'car', speed: 15, radius: 45, mass: 1000, timeScale: 3, readouts: [], alt: 'A car on a circular road, seen from above, with an arrow for the friction that points to the centre of the bend. A button removes the friction.' },
      options: [
        { text: 'Straight on, along the tangent', correct: true },
        { text: 'Outwards, directly away from the centre of the bend', why: 'Nothing pushes it outwards. With no sideways force it keeps the velocity it had, and that points along the road.' },
        { text: 'On round the bend, only wider', why: 'To keep turning at all it would need *some* force towards the centre. On perfect ice there is none.' },
        { text: 'It stops', why: 'Nothing slows it down either: there is no friction.' },
      ],
      explain: `
        No friction means no centripetal force, so the car does what the puck
        did: it keeps its velocity and leaves along the tangent.

        On a real icy road a little friction remains. The car still curves,
        but not tightly enough to follow the bend.
      `,
    },
    {
      id: 'passenger',
      type: 'choice',
      review: true,
      text: `
        You are a passenger in a car that turns sharply **left**. You feel
        pressed against the right-hand door.

        **What is really happening?**
      `,
      options: [
        { text: 'Your body tends to carry straight on while the car turns; the door pushes you inwards, round the bend', correct: true },
        { text: 'A centrifugal force pushes you outwards, against the door', why: 'It feels like that from inside the car, but no object is there to push you outwards. Seen from the roadside you are simply going straight on, until the door makes you turn.' },
        { text: 'The door pulls you towards it', why: 'A door can only push. And it pushes you to the left, towards the centre of the bend.' },
        { text: 'Friction with the seat drags you to the right', why: 'Friction with the seat acts to the left: it tries to take you round with the car. When it is not enough, you slide across until the door helps.' },
      ],
      explain: `
        Seen from above, the car turns left and at first you do not: you carry
        on straight, like the puck after the cut. Then the seat and the door
        push you **towards the centre** of the bend. That inward push is the
        centripetal force.

        The "force that throws you outwards" is your own inertia.
      `,
    },
    {
      id: 'example-max-speed',
      type: 'info',
      title: 'How fast is too fast?',
      text: r`
        Friction can only pull so hard. The faster a car takes a bend, the
        more force the turn demands. At the highest safe speed, the demand
        $\frac{m\,v^2}{r}$ is exactly the most the tyres can give.

        :::example
        A 900 kg car, a bend of radius 36 m, and tyres that give at most
        3600 N of sideways friction.

        1. Demand = supply: $\frac{900 \times v^2}{36} = 3600$.
        2. Get $v^2$ alone: $v^2 = \frac{3600 \times 36}{900} = 144$.
        3. Which number squared gives 144? $v = 12$ m/s.
        :::
      `,
      figure: { type: 'whirl-ball', body: 'car', speed: 12, radius: 36, mass: 900, static: true, arrows: 'force', alt: 'A car on a circular road, seen from above. An arrow for the friction on its tyres points from the car to the centre of the bend.' },
    },
    {
      id: 'max-speed',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const [m, v, rad, road] = rng.pick([
          [1000, 10, 50, 'snowy'], [1000, 20, 100, 'wet'], [1000, 15, 45, 'wet'], [1200, 10, 40, 'snowy'],
          [800, 20, 80, 'wet'], [1500, 10, 25, 'wet'], [1200, 15, 90, 'snowy'], [800, 10, 20, 'wet'],
        ]);
        const F = (m * v * v) / rad;
        return {
          text: `
            On a ${road} road, the tyres of ${aAn(m)} **${m} kg** car can supply at most
            **${F} N** of sideways friction. The car comes to a bend of radius
            **${rad} m**.

            What is the highest speed at which it can follow the bend?
          `,
          answer: v,
          unit: 'm/s',
          wrong: [
            [v * v, 'That is $v^2$. Take the square root to get the speed.'],
            [F / m, r`That is the greatest sideways acceleration, in m/s². Set it equal to $\frac{v^2}{r}$.`],
          ],
          hints: [
            r`At the highest speed, the force the bend demands, $\frac{m\,v^2}{r}$, is exactly the most the tyres can give.`,
            r`So $v^2 = \frac{F \times r}{m} = \frac{${F} \times ${rad}}{${m}} = ${v * v}$. Which number squared gives that?`,
          ],
          explain: r`The bend demands $\frac{m\,v^2}{r}$, and the tyres can give ${F} N at most. So $v^2 = \frac{${F} \times ${rad}}{${m}} = ${v * v}$ and $v = ${v}$ m/s. Any faster and the car runs wide.`,
        };
      },
    },
    {
      id: 'match',
      type: 'match',
      text: 'Each of these moves in a circle. Match it to the force that points at the centre and does the turning.',
      pairs: [
        ['A puck whirled on a string', 'The pull of the string'],
        ['A car on a level bend', 'Friction from the road'],
        ['The Moon circling the Earth', 'Gravity'],
        ['Wet clothes in a spinning drum', 'The push of the drum wall'],
      ],
      explain: `
        In each case an ordinary force points at the centre. Take it away and
        the object goes straight on.

        That is how a spin-dryer works. The drum wall pushes the clothes
        round. Where there is a hole, nothing pushes the water round, so the
        water leaves along the tangent.
      `,
    },
  ],
  recap: [
    'Moving in a circle at steady speed is still accelerating: the direction of the velocity keeps changing.',
    'That takes a net force towards the centre, the **centripetal** force. Remove it and the object leaves along the tangent.',
    r`Its size: $a = \frac{v^2}{r}$ and $F = \frac{m\,v^2}{r}$. Double the speed: four times the force. Double the radius: half.`,
    'Nothing pushes outwards. The pull you feel in a turning car is your own inertia.',
  ],
  next: 'Next: the biggest circle you know. What holds the Moon on its path, and why do astronauts float?',
};
