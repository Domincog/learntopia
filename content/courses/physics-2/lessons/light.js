// Physics II: Orbits & Waves · Lesson 6 · Light as a Wave
import { r, num } from '../../../kit.js';
import { LIGHT, grouped, groupedTex, prism, dopplerRings, shallowPool, rayNormal } from '../helpers.js';

// Speeds of light used by the light-ray widget and quoted in the questions (km/s, rounded).
const SPEED = { air: 300000, water: 225000, glass: 200000, diamond: 124000 };
const RAY = { type: 'light-ray', mode: 'refract', medium: 'water', angle: 40 };
const WAYS = ['Towards the normal', 'Away from the normal', 'It does not bend'];

export default {
  id: 'light',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The coin in the pool',
      text: `
        A coin lies on the bottom of a swimming pool. You stand at the edge
        and look down at it, at a slant.

        **Where does the coin appear to be?**
      `,
      shuffle: false,
      options: [
        { text: 'Exactly where it really is' },
        { text: 'Deeper than it really is' },
        { text: 'Shallower than it really is', correct: true },
      ],
      explain: `
        Shallower. A pool always looks less deep than it is, and a straw in a
        glass of water seems to bend at the surface.

        Light changes direction where water meets air. To see why, start with
        the simplest thing light does at a surface.
      `,
    },
    {
      id: 'teach-ray',
      type: 'info',
      title: 'Rays and the normal',
      text: `
        Light travels in straight lines. A **ray** is a line drawn to show
        the way it goes.

        To say how a ray meets a surface, draw the **normal**: the line at
        right angles to the surface, at the point where the ray hits. Angles
        are measured from the normal, not from the surface.

        In the picture the [ray]{.red} arrives at [40°]{.violet} from the
        normal. A ray that comes straight down the normal arrives at 0°.
      `,
      figure: rayNormal({ alt: 'A ray of light comes down at a slant and meets a flat surface. A dashed line, the normal, stands at right angles to the surface at the point where the ray hits. The angle between the ray and the normal is marked: 40 degrees.' }),
    },
    {
      id: 'mirror',
      type: 'interact',
      attempts: 6,
      title: 'Off a mirror',
      text: `
        A ray of light hits a mirror. The dashed line at right angles to the
        mirror is called the **normal**, and angles are measured from it.

        **Drag the light source, or use the slider, until the reflected ray
        hits the detector.**
      `,
      widget: { type: 'light-ray', mode: 'mirror', angle: 60, angleRange: [10, 80, 5], target: { incidence: 35 }, alt: 'A ray of light strikes a mirror and bounces off. A detector waits on the far side of the normal.' },
      check: (s) => {
        if (s.hit) return true;
        return `The ray arrives at ${s.angle}° and leaves at ${s.out}°. The detector sits 35° from the normal, so the ray has to come in ${s.angle > 35 ? 'closer to the normal' : 'further from the normal'}.`;
      },
      solution: { angle: 35 },
      explain: `
        The ray leaves at the angle it arrived at, on the other side of the
        normal: **35° in, 35° out**. This is the law of **reflection**.

        A ball bouncing off a wall does much the same. The next thing light
        does, a ball cannot copy.
      `,
    },
    {
      id: 'into-water',
      type: 'choice',
      title: 'Into water',
      text: `
        Off the mirror, the ray left at the angle it came in at. That is the
        law of **reflection**.

        Now the ray goes from air into water. (A little of it reflects as
        well; follow the part that goes in.)

        **Try several angles.** What does the ray do as it enters the water?
      `,
      figure: { ...RAY, angleRange: [0, 80, 10], alt: 'A ray of light passes from air into water and changes direction at the surface. Readouts give its angle from the normal in the air and in the water.' },
      options: [
        { text: 'It bends towards the normal', correct: true },
        { text: 'It bends away from the normal', why: 'Compare the two readouts: the angle in the water is always the smaller one.' },
        { text: 'It goes straight on', why: 'Only at 0°, straight down along the normal. At every other angle the ray has a kink at the surface.' },
        { text: 'It all bounces off, as from a mirror', why: 'Some light does reflect from water, but most of it goes in, and that part changes direction.' },
      ],
      explain: `
        The ray **bends towards the normal**. Only a ray along the normal
        itself, at 0°, goes straight on.

        | Angle in air | 0° | 20° | 40° | 60° | 80° |
        |------|:---:|:---:|:---:|:---:|:---:|
        | Angle in water | 0° | 14.9° | 28.8° | 40.5° | 47.6° |
      `,
    },
    {
      id: 'why-bend',
      type: 'info',
      title: 'Why it bends',
      text: `
        This change of direction, where light passes from one material into
        another, is called **refraction**.

        Light is a wave, and in water it travels more slowly than in air:
        about 225,000 km/s instead of 300,000 km/s. The lines in the picture
        are its crests.

        Where a crest meets the water at a slant, one end goes in first and
        slows down, while the other end is still racing ahead in the air. So
        the crest swings round, and the beam heads off closer to the normal.

        A marching band crossing from pavement into mud at a slant does the
        same: each row wheels round as it slows.
      `,
      figure: { ...RAY, angle: 50, fronts: true, angleRange: [0, 70, 10], alt: 'A wide beam of light drawn as a series of wave crests. The crests are closer together in the water than in the air, and the beam is tilted closer to the normal there.' },
    },
    {
      id: 'teach-bend-rule',
      type: 'info',
      title: 'Slower or faster',
      text: `
        Which way a ray bends depends only on what happens to its speed.

        - It **slows down**, as from air into water: it bends **towards**
          the normal.
        - It **speeds up**, as from water into air: the same path backwards.
          It bends **away from** the normal. Try it in the picture.
        - It meets the surface **head-on**, along the normal: every part of
          a crest crosses at the same moment, so nothing turns. It goes
          straight on, at 0°.

        :::example
        A ray passes at a slant from a material where light travels at
        150,000 km/s into one where it travels at 250,000 km/s. It speeds
        up, so it bends away from the normal.
        :::
      `,
      figure: { ...RAY, from: 'below', angle: 30, angleRange: [0, 40, 10], alt: 'A ray of light rises through water and passes out into the air, bending away from the normal at the surface. A slider sets its angle in the water; readouts give the angle on each side.' },
    },
    {
      id: 'which-way',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [from, to] = rng.sample(['air', 'water', 'glass', 'diamond'], 2);
        const headOn = rng.bool(0.2);
        const slows = SPEED[to] < SPEED[from];
        const right = headOn ? 2 : (slows ? 0 : 1);
        const speeds = `from ${grouped(SPEED[from])} km/s to ${grouped(SPEED[to])} km/s`;
        const why = (i) => {
          if (headOn) return 'Bending happens because one end of each crest crosses before the other. A ray along the normal meets the surface squarely: every part of a crest crosses at the same moment, so nothing turns.';
          if (i === 2) return `Its speed changes, ${speeds}, and it meets the surface at a slant. That always bends it.`;
          return slows
            ? `Away from the normal is what happens when light speeds up. Here it slows down, ${speeds}.`
            : `Towards the normal is what happens when light slows down. Here it speeds up, ${speeds}.`;
        };
        return {
          text: `
            Light travels at **${grouped(SPEED[from])} km/s** in ${from} and at
            **${grouped(SPEED[to])} km/s** in ${to}. A ray passes from ${from} into
            ${to}, meeting the surface ${headOn ? '**head-on, along the normal**' : '**at a slant**'}.

            Which way does it bend?
          `,
          shuffle: false,
          options: WAYS.map((text, i) => (i === right ? { text, correct: true } : { text, why: why(i) })),
          explain: headOn
            ? `Along the normal the ray does not bend at all, whatever the two speeds are. It simply ${slows ? 'slows down' : 'speeds up'} and carries straight on.`
            : `Going from ${from} into ${to} the light ${slows ? 'slows down' : 'speeds up'}, ${speeds}. ${slows ? 'Slowing down bends it **towards** the normal.' : 'Speeding up bends it **away from** the normal.'}`,
        };
      },
    },
    {
      id: 'coin',
      type: 'interact',
      attempts: 8,
      title: 'Hit the coin',
      text: `
        A coin lies under water. The dashed line runs straight from the coin
        through the point where your ray enters the water.

        **Aim the ray so that it hits the coin.**
      `,
      widget: { ...RAY, angle: 20, angleRange: [0, 80, 5], target: { incidence: 50 }, aim: true, alt: 'A ray of light passes from air into water, where a coin lies. A dashed straight line runs from the coin up through the point where the ray enters.' },
      check: (s) => {
        if (s.hit) return true;
        if (s.angle === 35) return 'Aimed straight along the dashed line, the ray bends at the surface and passes on the steep side of the coin. Come in flatter.';
        return s.out < 35.07
          ? `In the water the ray runs ${num(s.out, 1)}° from the normal, but the coin lies at 35.1°. Come in flatter, further from the normal.`
          : `In the water the ray runs ${num(s.out, 1)}° from the normal, but the coin lies at 35.1°. Too flat: come in closer to the normal.`;
      },
      solution: { angle: 50 },
      hints: ['The ray will bend towards the normal as it goes in. So where must it come from?'],
      explain: `
        The ray has to come in at **50°**, well to the flat side of the dashed
        line, to end up at 35.1° in the water.

        Light coming *from* the coin follows the same path backwards. It
        speeds up as it leaves the water, and bends **away** from the normal.
      `,
    },
    {
      id: 'pool',
      type: 'choice',
      review: true,
      title: 'The pool, explained',
      text: `
        Light from a coin under water bends away from the normal as it comes
        out into the air, and then reaches an eye. The brain takes it for
        granted that light has travelled in a straight line.

        **So where does the coin seem to be?**
      `,
      figure: shallowPool({ alt: 'A coin on the bottom of a pool. A ray from the coin rises to the surface, bends away from the normal and reaches an eye above the water. A dashed line extends the last part of the ray straight back into the water; it passes above the coin.' }),
      options: [
        { text: 'On the dashed line: higher up than it really is', correct: true },
        { text: 'Exactly where it really is', why: 'That would need the light to reach the eye in one straight line from the coin. It has a kink at the surface.' },
        { text: 'Deeper than it really is', why: 'Follow the last, straight part of the ray backwards. It passes above the coin, not below it.' },
      ],
      explain: `
        The eye traces the arriving ray straight back and sees the coin on the
        dashed line: **shallower** than it is.

        A straw standing in a glass of water looks bent at the surface for the
        same reason. The part under water seems to be somewhere it is not.
      `,
    },
    {
      id: 'colour',
      type: 'info',
      title: 'Colour is frequency',
      text: r`
        Light waves are tiny and fast. Their wavelengths run from about 700
        billionths of a metre (red) down to about 400 billionths (violet).

        What we see as **colour** is the **frequency** of the light. Red has
        the lowest frequency we can see, then come orange, yellow, green and
        blue, up to violet with the highest. **White light** is a mixture of
        them all.

        In empty space every colour travels at the same speed, the greatest
        speed there is: about **300,000 km/s** (more exactly 299,792 km/s).
        Unlike sound, light needs no medium.

        :::note
        In some experiments light also behaves like a stream of particles.
        That side of its story is beyond this course.
        :::
      `,
    },
    {
      id: 'prism',
      type: 'order',
      title: 'A prism',
      text: `
        A narrow beam of white light passes through a glass prism and comes
        out as a fan of colours: a **spectrum**. Spreading light out by
        colour like this is called **dispersion**.

        The more a material slows light down, the more it bends it.
        **Put these colours in order of how much the glass slows them down,
        least first.**
      `,
      figure: prism({ maxWidth: 380, alt: 'A beam of white light enters a triangular glass prism and leaves as a fan of colours. From the top of the fan to the bottom: red, orange, yellow, green, blue, violet. Red is turned the least and violet the most.' }),
      items: ['Red', 'Yellow', 'Blue', 'Violet'],
      labels: ['Slowed least', 'Slowed most'],
      hints: ['Which colour in the picture has been turned furthest from the direction of the white beam?'],
      explain: `
        Violet is bent the most, so the glass slows it the most; red is slowed
        the least. Because each colour is slowed by a slightly different
        amount, white light fans out. (The fan is drawn wider than life.)

        A **rainbow** is the same thing done by raindrops: sunlight is
        refracted on its way into each drop, reflected at the back, and
        refracted again on its way out.
      `,
    },
    {
      id: 'light-time',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.pick([
          { d: 150000000, say: 'The Sun is about **150,000,000 km** from the Earth. How long does sunlight take to get here?', after: 'More than 8 minutes: you see the Sun as it was then.' },
          { d: 384000, say: 'The Moon is about **384,000 km** from the Earth. How long does moonlight take to reach us?', after: 'A little over a second.' },
          { d: 36000, say: 'A television satellite is about **36,000 km** above the ground. How long does its signal take to come down? (Radio signals travel at the speed of light.)', after: 'About an eighth of a second.' },
          { d: 1500000, say: 'A space telescope sits **1,500,000 km** from the Earth. How long do its radio signals take to reach us? (Radio signals travel at the speed of light.)', after: '' },
          { d: 90000000, say: 'A rover on Mars sends a radio signal when Mars is **90,000,000 km** from the Earth. How long does the signal take? (Radio signals travel at the speed of light.)', after: 'That is 5 minutes, so nobody can steer a Mars rover by joystick.' },
          { d: 750000000, say: 'A probe near Jupiter sends a radio signal when it is **750,000,000 km** from the Earth. How long does the signal take? (Radio signals travel at the speed of light.)', after: 'That is more than 40 minutes.' },
        ]);
        const t = c.d / LIGHT;
        return {
          text: `Light travels through space at 300,000 km/s. So 600,000 km takes it 600,000 ÷ 300,000 = 2 s.\n\n${c.say}`,
          answer: t,
          unit: 's',
          wrong: [[LIGHT / c.d, 'That is upside down: time = distance ÷ speed.']],
          hints: ['Time = distance ÷ speed.', 'Cancel the same number of zeros from the distance and from 300,000 before you divide.'],
          explain: r`Time $= \frac{\text{distance}}{\text{speed}} = \frac{${groupedTex(c.d)}}{${groupedTex(LIGHT)}} = ${num(t)}$ s. ${c.after}`,
        };
      },
    },
    {
      id: 'doppler-predict',
      type: 'choice',
      mode: 'predict',
      title: 'The passing siren',
      text: `
        An ambulance drives past you with its siren on. The siren itself
        sounds the same note the whole time.

        **What do you hear as it passes?**
      `,
      shuffle: false,
      options: [
        { text: 'The same note throughout, only louder and then quieter' },
        { text: 'A higher note as it comes, dropping to a lower note as it goes', correct: true },
        { text: 'A lower note as it comes, rising to a higher note as it goes' },
      ],
      explain: 'The note drops as the ambulance passes: higher while it is coming towards you, lower once it is moving away. The next picture shows why.',
    },
    {
      id: 'teach-doppler',
      type: 'info',
      title: 'Squeezed and stretched',
      text: `
        A siren sends out crests of sound in all directions. Each one spreads
        from where it was sent, at the speed of sound. A moving siren chases
        the crests ahead of it and runs away from those behind.

        - **Ahead**, the crests are squeezed together. More arrive each
          second: a higher frequency, so a higher note.
        - **Behind**, they are stretched apart. Fewer arrive each second: a
          lower note.

        This is the **Doppler effect**. It works for light too: the light
        of distant galaxies arrives shifted towards the red, the
        low-frequency end, because they are moving away from us.
      `,
      figure: dopplerRings({ moving: 0.5, alt: 'A dot moving to the right, with four circles round it, the crests it has sent out. The circles are bunched together on the right, ahead of the dot, and spread apart on the left, behind it.' }),
    },
    {
      id: 'doppler',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const src = rng.pick([
          { name: 'an ambulance with its siren on', its: 'the driver hears' },
          { name: 'a train sounding its horn', its: 'the train driver hears' },
          { name: 'a motorbike', its: 'its rider hears' },
        ]);
        const ahead = rng.bool(0.5);
        return {
          text: `
            The dot is ${src.name}, moving to the **right**. The circles are
            the crests of the sound it has sent out, each spreading from where
            it was sent.

            A listener stands ${ahead ? '**ahead** of it, on the right' : '**behind** it, on the left'}. Compared with the note ${src.its}, what does the listener hear?
          `,
          figure: dopplerRings({ moving: 0.5, alt: 'A dot moving to the right, with four circles round it. The circles are bunched together on the right, ahead of the dot, and spread apart on the left, behind it.' }),
          shuffle: false,
          options: [
            ahead ? { text: 'A higher note', correct: true } : { text: 'A higher note', why: 'Behind the source the crests are spread out, so fewer of them reach the listener each second.' },
            { text: 'The same note', why: 'The crests are not evenly spaced any more. Count how closely they arrive on the listener\'s side.' },
            ahead ? { text: 'A lower note', why: 'Ahead of the source the crests are squeezed together, so more of them reach the listener each second.' } : { text: 'A lower note', correct: true },
          ],
          explain: ahead
            ? 'Ahead of a moving source the crests are squeezed together. They still travel at the speed of sound, so more of them arrive each second: a higher frequency, a **higher note**. This is the **Doppler effect**. It works for light as well: the light of distant galaxies arrives shifted towards the red, the low-frequency end, because they are moving away from us.'
            : 'Behind a moving source the crests are stretched apart. They still travel at the speed of sound, so fewer of them arrive each second: a lower frequency, a **lower note**. This is the **Doppler effect**. It works for light as well: the light of distant galaxies arrives shifted towards the red, the low-frequency end, because they are moving away from us.',
        };
      },
    },
    {
      id: 'match',
      type: 'match',
      text: 'Four things light does. Match each name to what lies behind it.',
      pairs: [
        ['Reflection', 'Angle in equals angle out'],
        ['Refraction', 'A change of speed bends the ray'],
        ['Dispersion', 'Each colour is slowed differently'],
        ['The Doppler effect', 'A moving source shifts the frequency'],
      ],
      explain: 'Each of them is something a wave does. Mirrors, lenses, rainbows and the changing note of a siren all follow from light and sound being waves.',
    },
  ],
  recap: [
    'Light is a wave. At a mirror, angle in = angle out, both measured from the normal.',
    'Where its speed changes, light bends (**refraction**): towards the normal when it slows down, away when it speeds up.',
    'Colour is frequency. White light is a mixture, and a prism or a raindrop spreads it out because each colour is slowed by a different amount.',
    'In empty space light travels at about 300,000 km/s. A moving source shifts the frequency of its waves: the Doppler effect.',
  ],
  next: 'That is the course. A puck on a string, the Moon, a swing, a guitar string and a rainbow: circles and waves, and a handful of ideas that explain all of them. Keep predicting before you look.',
};
