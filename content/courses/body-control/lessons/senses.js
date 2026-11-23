// The Body II: Control, Defence and Movement · Lesson 2 · Windows on the World
//
// Driving question: each eye has a patch with no light sensors at all. Why do you never see the hole?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-control/index.js';
import { EYE, SOUNDS, TWO_POINT, EAR_PATH, SIGHT_CASES, SENSE_NAMES, SENSE_SCENES, BLIND_SPOT_FIGURE, CONTRAST_FIGURE, grouped } from '../helpers.js';

const millions = (n) => `${Math.round(n / 1e6)} million`;

/** The parts of the ear named on the drawing in `teach-ear`, in the words of its text. */
const EAR_SPOTS = [
  { id: 'canal', x: 0.21, y: 0.7, r: 0.07, label: 'Ear canal', alt: 'the tube leading in from outside' },
  { id: 'eardrum', x: 0.447, y: 0.7, r: 0.06, label: 'Eardrum', alt: 'a thin oval membrane across the end of the tube' },
  { id: 'bones', x: 0.467, y: 0.44, r: 0.055, label: 'Three tiny bones', alt: 'a chain of three tiny bones behind the membrane' },
  { id: 'balance', x: 0.6, y: 0.24, r: 0.07, label: 'Balance organs', alt: 'three looped tubes' },
  { id: 'cochlea', x: 0.7, y: 0.63, r: 0.08, label: 'Cochlea', alt: 'a snail-shaped coil' },
  { id: 'nerve', x: 0.853, y: 0.53, r: 0.06, label: 'Hearing nerve', alt: 'nerve fibres leaving towards the brain' },
];

export default {
  id: 'senses',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A hole you have never noticed',
      text: `
        An experiment, if you can do it where you are. **Cover your left
        eye.** Look straight at the **cross** with your right eye, from
        about an arm's length. Keep staring at the cross and move slowly
        closer.

        **What do you expect to happen to the dot?**
      `,
      figure: BLIND_SPOT_FIGURE,
      shuffle: false,
      options: [
        { text: 'Nothing: it stays in view the whole time' },
        { text: 'At one distance it turns into a black hole' },
        { text: 'At one distance it vanishes, and the gap looks like plain background', correct: true },
      ],
      explain: `
        At one distance (between three and four times the gap between
        cross and dot) the dot **disappears**, and where it was you see
        unbroken background. Move a little closer or further and it is back.

        You have found your **blind spot**. There is one in each eye, and it
        has been there all your life.
      `,
    },
    {
      id: 'teach-eye',
      type: 'info',
      title: 'How an eye is built',
      text: `
        Every sense starts with **receptors**: cells that turn one kind of
        event in the world into nerve impulses. The eye's receptors line
        its back wall.

        - The clear **cornea** at the front does most of the bending of
          the light. The **lens** behind it fine-tunes the focus.
        - The image falls on the **retina**, a sheet of receptors.
          **Cones** give colour and sharp detail in good light; **rods**
          take over in dim light.
        - The nerve fibres from all those receptors, and the retina's
          blood vessels, leave the eye **at one place**.
      `,
      figure: { type: 'eye-focus', eye: 0, distance: 6, lensRange: null, static: true, alt: 'An eye seen from the side. Rays of light from far away pass through the curved cornea at the front and the lens just behind it, and meet at a point on the retina, the back wall of the eye.' },
    },
    {
      id: 'fundus',
      type: 'interact',
      title: 'Looking for the hole',
      text: `
        This is the back of a healthy right eye, photographed through the
        pupil. The whole orange surface is the **retina**, the sheet of
        light sensors.

        One place on it has **no sensors at all**, because that is where
        every nerve fibre and blood vessel leaves the eye. **Tap it.**
      `,
      widget: photo(MEDIA.fundus, {
        alt: 'The inside back surface of an eye: an orange-red disc. To one side is a bright yellowish round patch from which dark red blood vessels branch out across the disc; towards the centre is a darker, vessel-free smudge.',
        caption: 'The retina of a right eye',
        hotspots: [
          { id: 'disc', x: 0.82, y: 0.49, r: 0.075, label: 'Optic disc: the blind spot', alt: 'a bright round patch where the blood vessels meet' },
          { id: 'macula', x: 0.5, y: 0.5, r: 0.075, label: 'Macula: sharpest vision', alt: 'a darker patch with no large vessels, in the centre' },
          { id: 'vessel', x: 0.49, y: 0.235, r: 0.06, label: 'A blood vessel', alt: 'a dark red branching line' },
          { id: 'plain', x: 0.2, y: 0.6, r: 0.06, label: 'Ordinary retina', alt: 'a plain orange stretch near the edge' },
        ],
      }),
      check: (s) => s.picked === 'disc'
        || (s.picked === 'macula' ? 'That darker patch is the opposite: the spot with the most tightly packed sensors, used for sharp central vision. Look for where the vessels all meet.' : s.picked === 'vessel' ? 'That is one of the blood vessels. Follow them back to where they all enter the eye.' : s.picked === 'plain' ? 'That is ordinary working retina, full of sensors. Look for the place where the vessels all meet.' : false),
      solution: { picked: 'disc' },
      hints: ['Everything that leaves the eye leaves at one place. Follow the blood vessels.'],
      explain: `
        The bright patch is the **optic disc**, where about a million nerve
        fibres gather into the optic nerve. No room for sensors there: hence
        the blind spot. The darker patch is the **macula**, where vision is
        sharpest.

        So there really is a hole in the picture. The question for this
        lesson: **why do you never see it?**
      `,
    },
    {
      id: 'focus-near',
      type: 'interact',
      title: 'Getting the picture sharp',
      text: `
        Sensors are no use without a sharp image. The curved **cornea** and
        the **lens** bend light so that it meets at a point. Here the eye is
        looking at something far away, and the rays meet on the retina.
        Light from something near spreads out more, so it needs more
        bending.

        **Bring the object in to 25 cm.** Then change the eye's lens until
        the image is sharp again.
      `,
      widget: { type: 'eye-focus', eye: 0, distance: 6, distanceSlider: true, lensRange: [0, 4, 1], alt: 'An eye seen from the side, with rays of light passing through the cornea and lens and meeting near the retina. Sliders move the object and change the shape of the lens.' },
      check: (s) => {
        if (s.distance > 0.25) return s.sharp ? 'Sharp, but the object is not at 25 cm yet. Move it all the way in.' : 'Move the object all the way in to 25 cm first.';
        if (s.sharp) return true;
        return s.where === 'behind' ? 'The rays would meet behind the retina: the lens is still too weak for something this close. Make it fatter.' : 'Now the rays meet in front of the retina.';
      },
      solution: { distance: 0.25, lens: 4 },
      hints: ['More bending takes a stronger lens. Try the second slider.'],
      explain: `
        A ring of muscle lets the lens spring into a **fatter** shape:
        more power for near, less for far. You do it without thinking,
        thousands of times a day.
      `,
    },
    {
      id: 'eye-parts',
      type: 'fill',
      title: 'The eye, front to back',
      text: 'Follow a ray of light into the eye. **Choose the right word for each gap.**',
      template: `
        Light first crosses the clear [[lens|*cornea|retina]], which does most of the bending.
        The [[*lens|pupil|optic nerve]] fine-tunes the focus.
        The image falls on the [[cornea|iris|*retina]].
        There, [[rods|*cones]] give colour and sharp detail in good light, and [[*rods|cones]] take over in dim light.
      `,
      explain: `
        Each retina has about **${millions(EYE.cones)} cones**, packed most tightly at the
        macula, and about **${millions(EYE.rods)} rods**, which are far more sensitive
        but see no colour. That is why a dim room looks grey, and why a faint
        star is easier to see when you look slightly to one side of it.
      `,
    },
    {
      id: 'short-sight',
      type: 'interact',
      title: 'When the eye is the wrong length',
      text: `
        This eyeball is a little **too long**. Light from far away comes to
        a focus **in front of** the retina, so distant things are blurred.
        This is **short sight**.

        A spectacle lens shifts the focus. A **minus** lens, thinner in
        the middle, spreads the rays a little; a **plus** lens, fatter in
        the middle, bends them together more.

        **Find the spectacle lens that makes the distant view sharp.**
      `,
      widget: { type: 'eye-focus', eye: 2, distance: 6, glassesRange: [-4, 4, 1], alt: 'A long eyeball seen from the side. Rays from far away meet in front of the retina. A slider puts a spectacle lens of adjustable power in front of the eye.' },
      check: (s) => {
        if (s.sharp) return true;
        if (s.glasses > 0) return 'That lens is fatter in the middle. It bends the rays together even more, so they meet still further forward. Try the other direction.';
        if (s.glasses === 0) return 'Slide the spectacle lens to try a power.';
        return s.where === 'front' ? 'Better: the focus has moved back, but it is still in front of the retina.' : 'Too strong: now the rays would meet behind the retina.';
      },
      solution: { glasses: -2 },
      hints: ['The eye bends the light too much for its length. The lens has to spread the rays a little first.'],
      explain: `
        A **minus lens** spreads the rays slightly before they reach the
        eye, and the focus moves back onto the retina.

        Short sight is not a disease. It is a mismatch between the length
        of the eyeball and its focusing power, often of less than a
        millimetre.
      `,
    },
    {
      id: 'teach-long-sight',
      type: 'info',
      title: 'The opposite mismatch',
      text: `
        **Long sight** is the reverse. The eyeball is a little too short
        for its focusing power, so the focus falls **behind** the retina.
        Near things blur most, because their light needs the most bending.

        A **plus lens**, fatter in the middle, adds the missing bending
        and brings the focus forward onto the retina.

        Age does something similar to almost everyone. The eye's own lens
        stiffens, and from the mid-forties it can no longer fatten enough
        for near work. Reading glasses are plus lenses.
      `,
      figure: { type: 'eye-focus', eye: -2, distance: 0.5, lensRange: null, static: true, alt: 'A short eyeball seen from the side, looking at a near object. The rays have not yet met when they reach the retina: their focus would lie behind it, and the image is blurred.' },
    },
    {
      id: 'lens-sign',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(SIGHT_CASES);
        const where = { front: 'In front of the retina', behind: 'Behind the retina' };
        const kind = { minus: 'a minus lens (thinner in the middle)', plus: 'a plus lens (fatter in the middle)' };
        const options = [];
        for (const f of ['front', 'behind']) for (const l of ['minus', 'plus']) {
          const right = f === c.focus && l === c.lens;
          options.push({
            text: `${where[f]}; ${kind[l]}`,
            correct: right,
            why: right ? undefined : f !== c.focus
              ? `Blurred ${c.light} objects mean the light from them comes to a focus ${c.focus === 'front' ? 'too early, in front of the retina' : 'too late: it would meet behind the retina'}.`
              : `The focus is ${c.focus === 'front' ? 'too far forward, so the rays need spreading: a minus lens' : 'too far back, so the rays need extra bending: a plus lens'}.`,
          });
        }
        return {
          text: `
            ${c.who}

            **Without glasses, where does light from ${c.light} objects come to a
            focus, and which lens would correct it?**
          `,
          options,
          columns: 1,
          explain: `
            This is ${c.name}: ${c.why}. The focus falls ${c.focus === 'front' ? 'in front of' : 'behind'}
            the retina, and ${kind[c.lens]} moves it ${c.focus === 'front' ? 'back' : 'forward'} onto it.
            Only an eye test can say what a particular pair of eyes needs.
          `,
        };
      },
    },
    {
      id: 'teach-ear',
      type: 'info',
      title: 'From air to nerve',
      text: `
        Sound is a vibration of the air. The ear turns it into impulses in
        five stages:

        1. Sound waves travel down the ear canal and make the **eardrum**
           vibrate.
        2. **Three tiny bones**, the smallest in the body, work as levers
           and pass the vibration on.
        3. They set the fluid inside the snail-shaped **cochlea** rippling.
        4. The ripples bend **hair cells**, the ear's receptors, which fire.
        5. The **hearing nerve** carries the impulses to the brain.

        Beside the cochlea sit three fluid-filled loops with hair cells of
        their own. They sense the turning of your head: they are your
        **balance organs**.
      `,
      figure: photo(MEDIA.ear, {
        alt: 'A cut-away drawing of the inside of the ear, outside on the left: a tube running inwards to a thin green oval membrane, a chain of three tiny bones behind it, then a snail-shaped coil beside three looped tubes, with nerve fibres leaving on the right.',
        caption: 'Inside the ear, cut open: outside is on the left',
        mode: 'label',
        hotspots: EAR_SPOTS,
      }),
    },
    {
      id: 'ear-path',
      type: 'order',
      review: true,
      title: 'From air to nerve',
      text: `
        Sound is a vibration of the air. The ear has to turn it into
        nerve impulses. **Put the stages in order.**
      `,
      items: EAR_PATH,
      labels: ['First', 'Last'],
      explain: `
        Eardrum, bones, fluid, hair cells, nerve: movement is handed on
        until it becomes impulses.

        One cochlea holds about ${grouped(EYE.hairCells)} **hair cells**, and they sort
        sound by pitch: high notes near the entrance, low notes deep
        inside.
      `,
    },
    {
      id: 'decibels',
      type: 'numeric',
      review: true,
      title: 'How loud is loud?',
      gen: (rng) => {
        let a;
        let b;
        do { [a, b] = rng.sample(SOUNDS, 2); if (a[1] > b[1]) [a, b] = [b, a]; } while (b[1] - a[1] > 40 || b[1] === a[1]);
        const diff = b[1] - a[1];
        const steps = diff / 10;
        const answer = 10 ** steps;
        return {
          text: `
            Loudness is measured in **decibels (dB)**. The scale is
            stretched: every extra **10 dB** means **10 times** as much
            sound energy reaching the ear each second. So 50 dB more is
            five steps: 10 × 10 × 10 × 10 × 10 = 100,000 times.

            Typical levels: ${a[0]}, about **${a[1]} dB**; ${b[0]}, about **${b[1]} dB**.
            **How many times more sound energy does the louder one deliver?**
          `,
          answer,
          unit: 'times',
          wrong: [
            [diff, 'That is the difference in decibels. Each 10 dB step multiplies the energy by 10.'],
            ...(steps > 1 ? [[steps, `That is the number of 10 dB steps. Each step multiplies the energy by 10, so the answer is ${steps} tens multiplied together.`]] : []),
            ...(steps > 1 ? [[10 * steps, 'The steps multiply, they do not add: 10 × 10, not 10 + 10.']] : []),
          ].filter(([v], i, all) => v !== answer && all.findIndex(([w]) => w === v) === i),
          hints: [`The difference is ${diff} dB. How many steps of 10 dB is that?`, `${steps} step${steps === 1 ? '' : 's'}: multiply by 10 ${['', 'once', 'twice', 'three times', 'four times'][steps]}.`],
          explain: `
            ${b[1]} − ${a[1]} = ${diff} dB, which is ${steps} step${steps === 1 ? '' : 's'} of 10 dB:
            ${Array.from({ length: steps }, () => '10').join(' × ')} = **${grouped(answer)} times** the energy.

            Hair cells are delicate, and in humans they **do not grow back**.
            Long or repeated loud sound wears them out for good, which is why
            hearing protection matters (more in *Staying Well*).
          `,
        };
      },
    },
    {
      id: 'two-point',
      type: 'interact',
      mode: 'predict',
      title: 'One point or two?',
      text: `
        Touch someone's skin gently with **two points** at once (the ends of
        a bent paper clip will do) and, if the points are close together,
        it feels like **one**.

        How far apart must the points be to feel like two? **Drag the bars
        to show your guess** for each place.
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 50, yStep: 10, unit: ' mm', yLabel: 'gap needed to feel two points',
        data: TWO_POINT.map(([place], i) => ({ label: place, value: 20, color: ['orange', 'teal', 'violet'][i] })),
        alt: 'Three adjustable bars, for the fingertip, the palm and the forearm, on a scale from 0 to 50 millimetres.',
      },
      check: (s) => s.values[0][0] < s.values[0][1] && s.values[0][1] < s.values[0][2],
      solution: { values: [TWO_POINT.map(([, mm]) => mm)] },
      explain: `
        Typical values: **fingertip about ${TWO_POINT[0][1]} mm, palm about ${TWO_POINT[1][1]} mm,
        forearm about ${TWO_POINT[2][1]} mm**. On the forearm, two points 3 cm apart
        can feel like one.

        Fingertips are crowded with touch receptors, and a large share of
        the brain's touch area is given over to them. Skin is not one
        sense organ but a patchwork, finest where you explore the world.
      `,
    },
    {
      id: 'tastes',
      type: 'multi',
      title: 'Tongue and nose',
      text: `
        Taste buds detect just five **basic tastes**: sweet, sour, salty,
        bitter and umami (savoury). Everything else in a flavour reaches
        you through other receptors.

        **Which of these do the taste buds detect?**
      `,
      options: [
        { text: 'Sour', correct: true },
        { text: 'Umami (savoury)', correct: true },
        { text: 'Bitter', correct: true },
        { text: 'The burn of chilli', why: 'Chilli sets off heat and pain receptors, not taste buds. That is why it "burns" on skin and in the eyes too.' },
        { text: 'Strawberry', why: 'The flavour of strawberry is mostly smell: scent molecules reaching the nose from the back of the mouth.' },
      ],
      explain: `
        Sour, bitter and umami are three of the five. Every part of the
        tongue that has taste buds can detect all five:
        the school-book "tongue map" with a zone for each taste is a
        myth that grew out of a misread experiment from 1901.

        Most of what we call flavour is **smell**. The nose has about
        ${EYE.smellReceptorTypes} kinds of receptor against the tongue's handful, which is why
        food seems bland during a blocked-nose cold.
      `,
    },
    {
      id: 'teach-hidden-senses',
      type: 'info',
      title: 'The senses nobody counts',
      text: `
        Sight, hearing, smell, taste, touch. The body has more senses than
        those five, each with receptors of its own. Here are three of them,
        with touch beside them for comparison.

        | Sense | What its receptors report |
        |---|---|
        | **Balance**: organs in the inner ear | the turning and tilting of the head, and speeding up or slowing down |
        | **Body position**: sensors in muscles and joints | how stretched each muscle is and how bent each joint is |
        | **Pain**: pain receptors | damage or the threat of it: strong pressure, heat, cuts |
        | **Touch**: receptors in the skin | contact, texture and pressure on the skin |
      `,
      figure: {
        type: 'body-map', view: 'body', show: [], zoom: false,
        markers: [
          { at: 'ear', color: 'violet' },
          { at: 'elbow-joint:left', color: 'teal' },
          { at: 'knee-joint:left', color: 'teal' },
          { at: 'fingertip:right', color: 'orange' },
        ],
        labels: [
          { at: [241, 91], text: 'Balance: the inner ear', column: 'right' },
          { at: [313, 344], text: 'Body position: muscles and joints', column: 'right' },
          { at: [45, 554], text: 'Touch and pain: the skin', column: 'left' },
        ],
        alt: 'The outline of a body facing the viewer, with points marked at one ear, at an elbow and a knee, and at a fingertip.',
      },
    },
    {
      id: 'hidden-senses',
      type: 'choice',
      review: true,
      title: 'More than five',
      gen: (rng) => {
        const [scene, sense] = rng.pick(SENSE_SCENES);
        const whyNot = {
          balance: 'The balance organs report the turning and tilting of the head, and speeding up or slowing down.',
          position: 'Position sensors report how stretched each muscle is and how bent each joint is.',
          pain: 'Pain receptors answer to damage or the threat of it: strong pressure, heat, cuts.',
          touch: 'Touch receptors report contact, texture and pressure on the skin.',
        };
        return {
          text: `
            "Five senses" undercounts. Here is an everyday moment:

            *${scene}*

            **Which sense is mainly responsible?**
          `,
          options: Object.entries(SENSE_NAMES).map(([key, name]) => ({ text: name, correct: key === sense, why: key === sense ? undefined : `${whyNot[key]} That is not what is being used here.` })),
          columns: 1,
          explain: `
            ${whyNot[sense]}

            The sense of body position (**proprioception**) works so quietly
            that most people never learn its name. And **pain** is
            protection, not a fault: the rare people born unable to feel it
            are injured again and again without noticing.
          `,
        };
      },
    },
    {
      id: 'illusion',
      type: 'info',
      title: 'Seeing is guessing',
      text: `
        Look at the two small squares. **Which one is the lighter grey?**

        To most people the one on the dark side looks lighter. They are
        **exactly the same grey**.

        The brain does not report the light that reaches the eye. It
        reports its **best guess about the world**, and it judges each
        patch against its surroundings.

        That is also the answer to the blind spot. The brain receives no
        signal from that patch, so it fills in what is most likely there:
        more of the background. **Perception is built in the brain**, from
        impulses that the senses supply.
      `,
      figure: CONTRAST_FIGURE,
    },
    {
      id: 'receptors',
      type: 'match',
      title: 'Turning the world into impulses',
      text: `
        Every sense in this lesson begins the same way: with **receptors**
        that turn one kind of event into nerve impulses.

        **Match each event to the receptors that detect it.**
      `,
      pairs: [
        ['A candle flame across the room', 'Rods and cones in the retina'],
        ['A whispered word', 'Hair cells in the inner ear'],
        ['The scent of an orange being peeled', 'Smell receptors high in the nose'],
        ['Salt dissolving on the tongue', 'Taste buds'],
        ['A coin pressed into the palm', 'Touch receptors'],
      ],
      explain: `
        Each receptor answers to its own kind of stimulus (light, sound,
        chemicals, pressure), and each sends the same thing to the brain:
        impulses. The brain knows a signal means "light" only because of
        **which fibre** it arrives on.
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        A few gentle things to try, if you feel like it:

        - **The other blind spot.** Cover your right eye, look at the dot,
          and find the distance at which the cross goes.
        - **Pupils.** In a mirror, watch your pupils as you turn towards a
          bright window and away again. (Never look at the Sun.)
        - **Balance.** Stand on one leg next to something you can hold,
          then close your eyes. Notice how much your balance was borrowing
          from your eyes.

        A sudden loss or change of sight or hearing is different: it
        needs medical help the same day, not waiting to see if it passes.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    '**Receptors** turn light, sound, chemicals and pressure into nerve impulses; the brain tells them apart by the fibre they arrive on.',
    'The cornea and lens focus light on the **retina**. A focus in front of it is short sight (minus lens); behind it, long sight (plus lens).',
    'The ear passes vibration from eardrum to tiny bones to the fluid of the **cochlea**, where hair cells fire. They do not grow back.',
    'The brain builds what you perceive from these signals, filling gaps such as the **blind spot** with its best guess.',
  ],
  next: 'Next: not every message travels by nerve. Some are posted into the blood, and reach every cell in the body.',
};
