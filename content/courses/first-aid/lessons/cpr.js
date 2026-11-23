// First Aid: When Minutes Matter · Lesson 2 · Hands on the Chest
//
// Driving question: a heart has stopped and the ambulance is minutes away. What can two hands do?
// Sources: the table at the head of ../helpers.js (ERC 2025 Adult BLS, AHA 2025 Part 7, ILCOR 2025).
//
// Every step is tone: 'sober'.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/first-aid/index.js';
import { anchorPoint } from '../../../../src/widgets/body-map.js';
import { CPR, ARREST_MODEL, CHAIN, AED_STEPS, ARREST_OR_ATTACK, WORRIES } from '../helpers.js';

const CENTRE = anchorPoint('body', 'chest-centre');      // where the hands go, in the figure's coordinates
const HANDS_CM = 4;                                       // how close the marker has to be, in centimetres
const BONE_CM = 2;                                        // and how far from the midline at most: the breastbone is about 4 cm wide
const SIDEWAYS = BONE_CM * 5;                             // the same in the figure's units (5 units are 1 cm: docs/BODY.md)

const [RATE_LO, RATE_HI] = CPR.rate;
const [DEPTH_LO, DEPTH_HI] = CPR.depthCm;
const TRAINEES = ['Kofi', 'Mei', 'Ingrid', 'Rafael', 'Amara', 'Tomás', 'Priya', 'Olu'];

/** Counting windows and paces for the "is this pace in the band?" practice: every count comes out whole. */
const PACE_WINDOWS = [
  { seconds: 10, slow: [72, 78, 84, 90], ok: [102, 108, 114, 120], fast: [132, 138, 144, 150] },
  { seconds: 15, slow: [76, 80, 84, 88, 92], ok: [100, 104, 108, 112, 116, 120], fast: [128, 132, 136, 140] },
  { seconds: 20, slow: [75, 81, 84, 90], ok: [102, 105, 111, 114, 117], fast: [129, 135, 141, 147] },
  { seconds: 30, slow: [74, 82, 86, 92], ok: [100, 106, 110, 118], fast: [128, 134, 142, 146] },
];
const PACE_OPTIONS = { slow: `Too slow: under ${RATE_LO} a minute`, ok: `Inside the band: ${RATE_LO} to ${RATE_HI} a minute`, fast: `Too fast: over ${RATE_HI} a minute` };

/** The parts of the technique labelled on the photo of `teach-compressions`: the position of the hands, the arms and the knees. */
const COMPRESSION_SPOTS = [
  { id: 'hands', x: 0.165, y: 0.6, r: 0.075, label: 'Hands on the centre of the chest' },
  { id: 'arms', x: 0.25, y: 0.3, r: 0.06, label: 'Arms straight' },
  { id: 'knees', x: 0.62, y: 0.84, r: 0.07, label: 'Kneeling beside them' },
];

/** Where the two pads of a defibrillator go: shown large on the teaching screen, small beside the ordering step. */
const PADS = {
  type: 'body-map', view: 'chest', static: true, show: ['ribs', 'breastbone', 'heart'], ghost: ['ribs'], zoom: false, maxWidth: 220,
  markers: [
    { at: 'right-upper-chest', label: 'Pad', shape: 'square', size: 'l', color: 'blue', labelPos: 'left' },
    { at: 'left-side-chest', label: 'Pad', shape: 'square', size: 'l', color: 'blue', labelPos: 'right' },
  ],
  alt: 'The chest of a figure facing you, with two defibrillator pads marked: one high on the person\'s right, just below the collarbone, and one on the person\'s left side, below the armpit. The heart lies between them.',
};

/** A short name for each hesitation of the WORRIES table, for the teaching screen that comes before the practice. */
const WORRY_TOPICS = { rib: 'A cracked rib', gasp: 'Gasps', untrained: 'No training', aed: 'The defibrillator', beating: 'A heart that may still be beating' };
const worry = (id) => WORRIES.find((w) => w.id === id);

const rhythmCheck = (s) => {
  if (!s.done) return `Keep going: ${s.taps} of 30 so far.`;
  if (s.rate == null) return 'Press "Start again" and tap the round through.';
  if (s.rate < RATE_LO) return `That round came out at about ${s.rate} a minute, a little under the band. Press "Start again" and go slightly faster.`;
  if (s.rate > RATE_HI) return `That round came out at about ${s.rate} a minute, a little over the band. Press "Start again" and ease off slightly.`;
  return true;
};

const steps = [
  {
    id: 'hook',
    type: 'slider',
    mode: 'predict',
    title: 'One minute',
    text: `
      A woman's heart suddenly stops while she is waiting for a train. People see her fall.

      **For each minute that passes with no chest compressions and no defibrillator, by roughly
      how many percent does her chance of survival fall?**
    `,
    min: 1, max: 30, step: 1, start: 1, answer: 10, tolerance: 3, unit: '%',
    explain: `
      **About 7 to 10% a minute**, on the American Heart Association's figures. After ten minutes
      with no help, very little chance is left, and an ambulance often takes most of that time.

      So the people on the platform decide most of what happens. This lesson asks: **what can
      two hands do in those minutes?**
    `,
  },
  {
    id: 'clock',
    type: 'interact',
    graded: false,
    title: 'Buying time',
    text: `
      Here is that rule of thumb as a model. The line shows how much of her starting chance is
      left, minute by minute. The [shock]{.orange} from a defibrillator is what can restart a
      normal rhythm. In this example the ambulance brings one at minute 8.

      **Change what the bystanders do until at least 75 of every 100 chances are left when the
      first shock comes.**
    `,
    widget: {
      type: 'rescue-clock', cprOn: false, cpr: 4, shock: 8, ems: 8, ...ARREST_MODEL,
      alt: 'A graph of the chance left, from 100 down to 0, against minutes since a collapse. A dashed line shows the chance with no help falling to zero by minute ten.',
    },
    check: (s) => {
      if (s.chance >= 75) return true;
      if (!s.cprOn) return 'Nobody is giving compressions yet. Switch them on and watch the slope of the line.';
      if (s.cpr >= s.shock) return 'In this setting the shock comes before any compressions start. Begin the compressions earlier.';
      if (s.cpr > 1) return `Every minute before compressions start costs about ${ARREST_MODEL.lossNoCpr} points. Start them sooner.`;
      return 'Compressions slow the loss but do not stop it. Could someone fetch a public defibrillator before the ambulance comes?';
    },
    solution: { cprOn: true, cpr: 1, shock: 4 },
    explain: `
      **Compressions buy time; the shock uses it.** Pushing on the chest moves a little blood
      to the brain and heart, so the chance drains two to three times more slowly. An early shock
      from a public defibrillator ends the wait.

      The model is a simplification. It fits a collapse that someone saw, with a rhythm a shock
      can correct. Real chances are lower and vary widely, and its straight lines are a rule of
      thumb, not a countdown: there is no minute after which compressions stop being worth
      starting.
    `,
  },
  {
    id: 'teach-chain',
    type: 'info',
    title: 'The chain of survival',
    text: `
      Survival from a cardiac arrest depends on a chain of actions, each one buying time
      for the next. It is called the **chain of survival**:

${CHAIN.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      The first three links are in the hands of whoever is there, and a chain is only as strong
      as its weakest link: the best hospital can do little for a brain that went ten minutes
      without blood.
    `,
  },
  {
    id: 'chain',
    type: 'order',
    review: true,
    title: 'The chain of survival',
    text: `
      Survival from a cardiac arrest depends on a chain of actions, each one buying time
      for the next.

      **Put the links in order.**
    `,
    items: CHAIN,
    labels: ['First', 'Last'],
    explain: `
      **Call, push, shock**, then professional care. The first three links are in the hands of
      whoever is there.
    `,
  },
  {
    id: 'teach-arrest-attack',
    type: 'info',
    title: 'Two different emergencies',
    text: `
      The first link is to recognise a cardiac arrest. "Cardiac arrest" and "heart attack" are
      often used as if they meant the same thing. They do not, and the first aid differs.

      - A **cardiac arrest** is the pump stopping: no response, no normal breathing. It needs
        chest compressions and a defibrillator at once.
      - A **heart attack** is a supply problem: an artery of the heart is blocked. The heart is
        still beating, the person is usually awake, and they need an ambulance (lesson 3).

      A heart attack can turn into a cardiac arrest, which is one reason never to wait and see.
    `,
  },
  {
    id: 'arrest-or-attack',
    type: 'bucket',
    title: 'Arrest or attack?',
    text: `
      One of these is the pump stopping, the other a blocked supply line.

      **Sort each statement.**
    `,
    buckets: ['Cardiac arrest', 'Heart attack'],
    items: ARREST_OR_ATTACK,
    explain: `
      A **cardiac arrest** is the pump stopping; a **heart attack** is a supply problem, with the
      heart still beating. The first calls for CPR at once, the second for an ambulance.
    `,
  },
  {
    id: 'teach-compressions',
    type: 'info',
    title: 'Push hard, push fast',
    text: `
      The second link is yours too. An adult is unresponsive and not breathing normally, and
      help has been called:

      1. Kneel beside them.
      2. Put the heel of one hand on the **centre of the chest** and your other hand on top.
      3. With straight arms, push down **${DEPTH_LO} to ${DEPTH_HI} cm**, at a pace of **${RATE_LO} to ${RATE_HI}** pushes a minute.
      4. After every push, let the chest **come all the way back up**.

      The centre of the chest means the lower half of the breastbone: pressing there squeezes
      the heart against the spine.

      **Everyone: compressions.** People who are trained and willing add rescue breaths, in
      cycles of ${CPR.ratio[0]} compressions and ${CPR.ratio[1]} breaths. Someone untrained keeps pushing without a break.
    `,
    figure: photo(MEDIA['cpr-compressions'], {
      alt: 'Someone in a camouflage uniform kneels on a carpet beside a training manikin, with the face out of the picture. The arms are straight, and the two hands, one on top of the other with the fingers interlocked, press on the centre of the manikin\'s chest.',
      caption: 'Chest compressions on a training manikin',
      mode: 'label',
      hotspots: COMPRESSION_SPOTS,
    }),
  },
  {
    id: 'hands',
    type: 'interact',
    title: 'Where the hands go',
    text: `
      On a real chest the bones are hidden; this drawing shows what lies beneath the hands.
      The figure is facing you. The breastbone runs down the middle of the chest, and the heart
      lies behind its lower half.

      **Put the marker where the heel of your hand goes for chest compressions.** On the
      breastbone, within ${HANDS_CM} cm of the spot, counts.
    `,
    widget: {
      type: 'body-map', view: 'torso', mode: 'place', show: ['ribs', 'breastbone', 'heart'], ghost: ['ribs'],
      pin: { label: 'Hands', color: 'red', start: [200, 440] }, target: 'chest-centre',
      alt: 'The chest and abdomen of a figure facing you, with the ribs faintly shown, the breastbone down the middle and the heart behind it. A marker can be placed anywhere on the figure.',
    },
    check: (s) => {
      if (!s.placed) return 'Move the marker onto the figure first.';
      if (s.distance <= HANDS_CM && Math.abs(s.at[0] - CENTRE[0]) <= SIDEWAYS) return true;
      if (s.distance <= HANDS_CM) return 'Nearly: that is the right height, but beside the breastbone, over the ribs. Come onto the midline.';
      if (s.region === 'abdomen' || s.region === 'pelvis') return 'Too low: that is the abdomen. Compressions go on the breastbone.';
      if (s.region === 'neck' || s.region === 'head') return 'Too high. Compressions go on the chest, on the lower half of the breastbone.';
      if (s.region !== 'chest') return 'That is off the chest. Aim for its centre, on the breastbone.';
      if (Math.abs(s.at[0] - CENTRE[0]) > Math.abs(s.at[1] - CENTRE[1])) return 'That is over the ribs, to one side. Come to the midline, onto the breastbone.';
      return s.at[1] < CENTRE[1] ? 'A little too high. Aim for the lower half of the breastbone, in the centre of the chest.' : 'A little too low. Stay on the breastbone, in the centre of the chest.';
    },
    solution: { at: 'chest-centre' },
    hints: ['Find the breastbone, the flat bone in the middle. The spot is on its lower half.'],
    explain: `
      **The centre of the chest: the lower half of the breastbone.** Pressing there squeezes the
      heart against the spine. Too low, and the push lands on the stomach; off to one side, and
      it lands on ribs with no heart beneath them.
    `,
  },
  {
    id: 'how',
    type: 'fill',
    review: true,
    title: 'Push hard, push fast',
    text: `
      An adult is unresponsive and not breathing normally. Help has been called.
      **Complete the instructions for chest compressions.**
    `,
    template: `
      Kneel beside them. Put the heel of one hand on the [[left side|*centre|top]] of the chest and your other hand on top.

      With straight arms, push down [[1 to 2|10 to 12|*${DEPTH_LO} to ${DEPTH_HI}]] cm, at a pace of [[*${RATE_LO} to ${RATE_HI}|30 to 40|200 to 220]] pushes a minute.

      After every push, let the chest [[stay pressed down|*come all the way back up]].
    `,
    explain: `
      **Centre of the chest, ${DEPTH_LO} to ${DEPTH_HI} cm deep, ${RATE_LO} to ${RATE_HI} a minute, full release.** The heart
      sits between the breastbone and the spine: each push squeezes blood out, and each release
      lets it refill. That takes real force on a firm surface, and it is tiring. If someone
      else can take over, swap about every ${CPR.swapMinutes} minutes, with as short a pause as possible.
    `,
  },
  {
    id: 'rhythm',
    type: 'interact',
    graded: false,
    title: 'Find the pace',
    text: `
      ${RATE_LO} to ${RATE_HI} a minute is nearly two pushes a second: faster than most people expect.

      **Tap the pad in time with the lamp for 30 compressions.** A tap, a click, or the Space
      or Enter key all count.

      This trains your sense of the pace only. Depth and hand position are learned on a manikin.
    `,
    widget: {
      type: 'cpr-rhythm', bpm: 110, target: CPR.rate, count: 30, guide: 'on',
      alt: 'A pace trainer: a lamp that blinks 110 times a minute, a pad to tap, and a gauge that shows your pace against the band from 100 to 120 a minute.',
    },
    check: rhythmCheck,
    solution: { taps: 30, rate: 110 },
    explain: `
      Thirty compressions at this pace take about 16 seconds. Many instructors suggest keeping
      a song with the right beat in your head: *Stayin' Alive* by the Bee Gees, at a little over
      100 beats a minute, is the classic choice.
    `,
  },
  {
    id: 'rate-check',
    type: 'choice',
    title: 'Check the pace',
    gen: (rng) => {
      const win = rng.pick(PACE_WINDOWS);
      const kind = rng.pick(['slow', 'ok', 'ok', 'fast']);
      const rate = rng.pick(win[kind]);
      const count = (rate * win.seconds) / 60;
      const who = rng.pick(TRAINEES);
      return {
        text: `
          In a first-aid class, ${who} practises on a manikin. The instructor counts
          **${count} compressions in ${win.seconds} seconds**.

          To turn a count into a pace, scale it up to a minute. For example, 9 compressions
          in 6 seconds would be 9 × 10 = 90 a minute, because there are 10 lots of 6 seconds
          in a minute.

          **How does that pace compare with the guideline band?**
        `,
        options: ['slow', 'ok', 'fast'].map((key) => ({ text: PACE_OPTIONS[key], correct: key === kind })),
        shuffle: false,
        columns: 1,
        hints: [`There are ${60 / win.seconds} lots of ${win.seconds} seconds in a minute.`],
        explain: `
          ${count} compressions in ${win.seconds} seconds is ${count} × ${60 / win.seconds} = **${rate} a minute**.
          The band is ${RATE_LO} to ${RATE_HI}. ${kind === 'slow' ? 'Too slow, and too little blood reaches the brain.' : kind === 'fast' ? 'Too fast, and the pushes tend to become too shallow.' : 'That is inside it.'}
        `,
      };
    },
  },
  {
    id: 'breaths',
    type: 'choice',
    title: 'What about rescue breaths?',
    text: `
      Nadia has never taken a first-aid class. A man has collapsed in a car park: he is
      unresponsive and not breathing normally. She has called the emergency number.

      **What do the guidelines ask of her?**
    `,
    options: [
      { text: 'Chest compressions without stopping, coached by the call-taker', correct: true },
      { text: 'Nothing more: untrained people should wait for the ambulance', why: 'Waiting is the one choice that is certain to cost him. Compressions from an untrained person are far better than none.' },
      { text: 'Mouth-to-mouth breaths first, because compressions are useless without them', why: 'For the first minutes his blood still carries oxygen. What is missing is something to move it.' },
    ],
    columns: 1,
    explain: `
      **Everyone: compressions.** Nadia is untrained, so she keeps pushing without a break. The
      cycles of ${CPR.ratio[0]} compressions and ${CPR.ratio[1]} breaths are for people who are trained and willing.

      Breaths matter more for children and after drowning, where lack of oxygen is usually the
      cause. That is taught, with practice, in a class.
    `,
  },
  {
    id: 'aed',
    type: 'interact',
    title: 'The box on the wall',
    text: `
      In many cardiac arrests the heart has not gone still: its electrical rhythm has turned
      to chaos, and the muscle only quivers. An **automated external defibrillator (AED)** can
      stop that chaos with one electric shock, so that a normal rhythm can restart.

      It is built for people who have never seen one. It **talks you through every step**, and
      it gives a shock **only if a shock is needed**. A green sign with a white heart and a
      lightning flash marks a defibrillator in many countries.

      Someone shouts, "Fetch the defibrillator!" **Tap it in the picture.**
    `,
    widget: photo(MEDIA['aed-cabinet'], {
      alt: 'A white wall in a shopping centre. On the left, two red signs above a round metal hose reel on a stand. On the right, two green signs, each with a white heart crossed by a lightning flash and the letters DAE, above a small green and white cabinet with a clear door.',
      caption: 'A shopping centre in Almada, Portugal',
      hotspots: [
        { id: 'fire', x: 0.325, y: 0.235, r: 0.09, label: 'Fire-equipment signs', alt: 'two red signs with white drawings' },
        { id: 'sign', x: 0.755, y: 0.245, r: 0.085, label: 'Defibrillator sign', alt: 'two green signs with a white heart and a flash' },
        { id: 'hose', x: 0.235, y: 0.66, r: 0.15, label: 'Fire hose reel', alt: 'a round metal reel on a stand' },
        { id: 'cabinet', x: 0.757, y: 0.595, r: 0.115, label: 'Defibrillator, in its cabinet', alt: 'a small green and white cabinet with a clear door' },
      ],
    }),
    check: (s) => s.picked === 'cabinet'
      || (s.picked === 'sign' ? 'That is the sign that shows where it is. The defibrillator itself is in the cabinet underneath.'
        : s.picked === 'hose' || s.picked === 'fire' ? 'Red marks fire equipment: the hose reel and its signs. The defibrillator\'s sign is green.'
          : 'Tap one of the numbered rings.'),
    solution: { picked: 'cabinet' },
    explain: `
      **The cabinet under the green signs.** The letters on the sign change with the language:
      DAE here, AED in English.

      Defibrillators hang in stations, airports, gyms, schools and shopping centres. The
      emergency call-taker can often say where the nearest one is.
    `,
  },
  {
    id: 'teach-aed',
    type: 'info',
    title: 'Using a defibrillator',
    text: `
      Someone runs up with a defibrillator while you are giving compressions. The voice of
      the machine leads, and the steps are these:

${AED_STEPS.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      The pads go where the drawing shows, so that the heart lies between them. Nobody touches
      the person while the machine checks the heart or gives a shock.
    `,
    figure: { ...PADS, maxWidth: 300 },
  },
  {
    id: 'aed-order',
    type: 'order',
    review: true,
    title: 'Using a defibrillator',
    text: `
      Someone runs up with a defibrillator while you are giving compressions. The drawing
      shows where its two pads go.

      **Put the steps in order.**
    `,
    items: AED_STEPS,
    labels: ['First', 'Last'],
    figure: PADS,
    explain: `
      **Switch on, pads on, stand clear, shock, push again.** The voice of the machine leads.
      The pads go where the drawing shows, so that the heart lies between them. Nobody touches
      the person while the machine checks the heart or gives a shock. With two rescuers, one
      keeps up the compressions while the other sticks on the pads. Afterwards,
      compressions restart at once, shock or no shock, until the machine checks again or
      the person starts to breathe normally.
    `,
  },
  {
    id: 'solo',
    type: 'interact',
    graded: false,
    stretch: true,
    title: 'Without the lamp',
    text: `
      In a real emergency no lamp will blink. This time it **goes out after 8 taps**.

      **Keep the same pace on your own until you reach 30.** The gauge will show how you did.
    `,
    widget: {
      type: 'cpr-rhythm', bpm: 110, target: CPR.rate, count: 30, guide: 'fade', fadeAfter: 8,
      alt: 'A pace trainer whose lamp blinks 110 times a minute for the first eight taps and then goes out, a pad to tap, and a gauge that shows your pace against the band from 100 to 120 a minute.',
    },
    check: rhythmCheck,
    solution: { taps: 30, rate: 112 },
    explain: `
      Most people drift once the beat is gone, usually towards too slow as they tire. On a real
      call, the call-taker can count the pace aloud with you over the speaker.
    `,
  },
  {
    id: 'teach-worries',
    type: 'info',
    title: 'What holds people back',
    text: `
      Five worries hold bystanders back. For someone who is unresponsive and not breathing
      normally, the guidelines answer each of them:

      - **${WORRY_TOPICS.rib}.** ${worry('rib').why}
      - **${WORRY_TOPICS.gasp}.** ${worry('gasp').wrong[0][1]}
      - **${WORRY_TOPICS.untrained}.** ${worry('untrained').why}
      - **${WORRY_TOPICS.aed}.** ${worry('aed').why}
      - **${WORRY_TOPICS.beating}.** ${worry('beating').why} ${worry('beating').wrong[1][1]}
    `,
  },
  {
    id: 'worries',
    type: 'choice',
    review: true,
    title: 'A bystander hesitates',
    gen: (rng) => {
      const w = rng.pick(WORRIES);
      return {
        text: `
          An adult has collapsed, is unresponsive and is not breathing normally. Help has been
          called. A bystander hesitates:

          > "${w.worry}"

          **Which reply is accurate?**
        `,
        options: [
          { text: w.right, correct: true },
          ...w.wrong.map(([text, why]) => ({ text, why })),
        ],
        columns: 1,
        explain: `
          ${w.why}

          The guidelines put it plainly: for someone who is unresponsive and not breathing
          normally, **doing something is far safer than doing nothing**.
        `,
      };
    },
  },
  {
    id: 'try',
    type: 'info',
    title: 'Children, and this week',
    text: `
      This lesson described adults. For **children and babies** the method is adapted: gentler
      pushes, and breaths matter more. A class teaches it. If the adult method is all you know,
      use it: call, and push on the centre of the chest. That is far better than doing nothing.

      **Something to try this week, if you like:** notice where the nearest defibrillator is to
      your home, your work or your usual shop. Some countries have maps or apps that list them.

      And if this lesson made you want to feel what ${DEPTH_LO} cm of chest compression is like, that
      is exactly what a first-aid class is for.
    `,
  },
];

/** Every step of this course speaks of people in danger: plain feedback, no cheering. */
const sober = (list) => list.map((step) => ({ ...step, tone: 'sober' }));

export default {
  id: 'cpr',
  steps: sober(steps),
  recap: [
    '**Cardiac arrest** means unresponsive and not breathing normally. Each minute without help costs roughly a tenth of the chance of survival.',
    `**Call, push, shock.** Compressions in the centre of the chest, ${DEPTH_LO} to ${DEPTH_HI} cm deep, ${RATE_LO} to ${RATE_HI} a minute, letting the chest come back up.`,
    'A **defibrillator** talks you through its use and shocks only a heart that needs it.',
    'Untrained hands are far better than no hands. The skill itself is learned in a class, on a manikin.',
  ],
  next: 'Next: two emergencies in which the person is usually still awake, and the clock is running just as fast: heart attack and stroke.',
};
