// First Aid: When Minutes Matter · Lesson 1 · Stop, Look, Call
//
// Driving question: what should the first person on the scene do, and in what order?
// Sources for every action and number: see the table at the head of ../helpers.js
// (ERC 2025, AHA 2025, AHA/ARC 2024 First Aid, NHS, St John Ambulance, British Red Cross).
//
// Every step is tone: 'sober' (set step by step; see `sober` at the foot of the file).
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/first-aid/index.js';
import { CPR, EMERGENCY_NUMBERS, FIRST_STEPS, RECOVERY_STEPS, DECISIONS, CHECK_CASES } from '../helpers.js';

const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

/** The three things a ten-second look can show. `said` is what the right answer is called on the two buttons. */
const BREATHING = [
  { pattern: 'normal', rates: [12, 14, 15, 16, 18, 20], answer: 'normal' },
  { pattern: 'gasping', gasps: [[1.4, 7.9], [3.1], [0.9, 6.2], [5.4]], answer: 'abnormal' },
  { pattern: 'none', answer: 'abnormal' },
];
const PEOPLE = ['Mei', 'Olu', 'Ingrid', 'Rafael', 'Amara', 'Tomás', 'Priya', 'Kofi'];

/** The three features of the recovery position marked on the picture: tapped in `recovery-why`, labelled in `teach-recovery`. */
const RECOVERY_SPOTS = [
  { id: 'knee', x: 0.27, y: 0.6, r: 0.09, label: 'Upper knee bent forward', alt: 'a bent knee resting on the floor' },
  { id: 'arm', x: 0.77, y: 0.86, r: 0.06, label: 'Lower arm out in front', alt: 'a hand and forearm lying on the floor' },
  { id: 'head', x: 0.9, y: 0.56, r: 0.075, label: 'Head tilted back, mouth downward', alt: 'the head, resting on a hand' },
];
/** The same three names, short enough to stand side by side on a phone when all are shown at once. */
const RECOVERY_SHORT = { knee: 'Knee bent', arm: 'Arm out', head: 'Head tilted back' };

const steps = [
  {
    id: 'hook',
    type: 'slider',
    mode: 'predict',
    title: 'The minutes before help arrives',
    text: `
      Someone's life is in immediate danger, a call is made, and an ambulance is sent at
      the highest priority.

      **In England in 2026, about how many minutes did such an ambulance take to arrive,
      on average?**
    `,
    min: 1, max: 30, step: 1, start: 1, answer: 8, tolerance: 2, unit: 'minutes',
    explain: `
      **About 8 minutes**, against a target of 7. Other countries report similar figures
      for cities, and longer ones in the countryside.

      For those minutes, the only help is whoever happens to be there. This lesson asks:
      **what should that person do first, and in what order?**
    `,
  },
  {
    id: 'about',
    type: 'info',
    title: 'What this course can and cannot do',
    text: `
      > **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.

      These six lessons give you **knowledge**: what to look for, what to do first, and why.
      They cannot give you the **skill**. Pressing hard enough on a chest or rolling a person
      onto their side is learned with your hands, in a first-aid class. Think of this course
      as the reading before the class.

      One rule runs through all of it: **get help on the way early**. Calling the emergency
      number is never the wrong thing to have done.
    `,
    cta: 'Understood',
  },
  {
    id: 'teach-first-steps',
    type: 'info',
    title: 'The first minute, step by step',
    text: `
      You are alone, with a mobile phone, and an adult collapses in front of you. The
      guidelines of 2025 give the first steps in this order:

${FIRST_STEPS.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      **Danger, response, call, breathing, then act.** Older leaflets put the call one step
      later. The point is the same: the call must not wait.

      The next screens take these steps one at a time.
    `,
  },
  {
    id: 'danger',
    type: 'bucket',
    title: 'Stop and look',
    text: `
      Whatever hurt the person on the ground may still be there. A rescuer who is hurt
      helps nobody, and becomes a second person for the ambulance crew to treat. Traffic,
      electricity, gas, fire and deep water injure rescuers every year.

      **Take a few seconds to look. Which of these can you walk straight up to?**
    `,
    buckets: ['Go to them', 'Deal with the danger first, or keep back and call'],
    items: [
      { text: 'A colleague slumped over her desk in a quiet office', bucket: 0 },
      { text: 'A cyclist lying in a lane of moving traffic', bucket: 1, why: 'Traffic has to be stopped or warned first, or there will soon be two casualties.' },
      { text: 'A man on the grass in a park, nothing unusual near him', bucket: 0 },
      { text: 'A woman on the floor of a room that smells strongly of gas', bucket: 1, why: 'Gas can overcome you too, and a spark can ignite it. Get out, and call from outside.' },
      { text: 'A man lying across a fallen power cable', bucket: 1, why: 'He may be live, and so may the ground around him. Keep well back and call.' },
      { text: 'A neighbour on her kitchen floor; the cooker is off and the floor is dry', bucket: 0 },
      { text: 'A swimmer face-down in a fast, deep river', bucket: 1, why: 'People who jump in to help can drown too. Call, and reach or throw something that floats.' },
    ],
    explain: `
      If you cannot make the scene safe, **keep back and call**: that is first aid too. If it is
      safe, go to them.
    `,
  },
  {
    id: 'response',
    type: 'choice',
    title: 'Are they responsive?',
    text: `
      Mei is lying still at a bus stop. You have looked around: there is no danger.

      **How do you find out whether she is responsive?**
    `,
    options: [
      { text: 'Kneel beside her, tap her shoulders firmly and ask loudly, "Are you all right?"', correct: true },
      { text: 'Turn her head quickly from side to side', why: 'If she has hurt her neck, that could do harm. Shoulders and a loud voice are enough.' },
      { text: 'Feel her wrist for a pulse for a full minute', why: 'Guidelines no longer ask bystanders to look for a pulse: it is easy to get wrong, and it costs a minute she may not have.' },
      { text: 'Wait a few minutes to see whether she comes round by herself', why: 'If her heart has stopped, each minute of waiting costs a large part of her chance.' },
    ],
    columns: 1,
    explain: `
      **Touch and talk.** Tap or gently shake the shoulders and speak loudly. Any answer, any
      movement, any opening of the eyes counts as a response. No reaction at all means she is
      **unresponsive**, and the next move is to call for help.
    `,
  },
  {
    id: 'breath-explore',
    type: 'interact',
    graded: false,
    title: 'Is she breathing normally?',
    text: `
      Mei does not respond. You call the emergency number and put the phone on speaker.
      The call-taker's next question will be: **is she breathing normally?**

      Tilt her head back gently, one hand on the forehead and two fingers under the chin,
      then **look, listen and feel for up to ${CPR.breathCheckSeconds} seconds**.

      **Watch each of the three patterns** you might find.
    `,
    widget: {
      type: 'breath-check', compare: ['normal', 'gasping', 'none'],
      alt: 'A person lying on their back, seen from the side, with a strip chart of chest movement over ten seconds. Three patterns can be played: normal breathing, gasping and no breathing.',
    },
    check: (s) => s.seenCount >= 3 || `Watch all three patterns: ${3 - s.seenCount} to go.`,
    solution: { seen: ['normal', 'gasping', 'none'] },
    explain: `
      Normal breathing is **regular and quiet**: two or three breaths in ten seconds.

      **Gasping is not breathing.** In the first minutes after a heart stops, many people give
      slow, noisy, irregular gasps. Bystanders often take them for a sign of life, and lose
      time. If you are not sure, treat it as *not* breathing normally.
    `,
  },
  {
    id: 'breath-check',
    type: 'interact',
    review: true,
    title: 'Ten seconds',
    gen: (rng) => {
      const kind = rng.pick(BREATHING);
      const who = rng.pick(PEOPLE);
      const widget = {
        type: 'breath-check', pattern: kind.pattern,
        alt: `${who} lying on their back, seen from the side, with a strip chart that records chest movement during a ten-second check.`,
      };
      if (kind.rates) widget.rate = rng.pick(kind.rates);
      if (kind.gasps) widget.gasps = rng.pick(kind.gasps);
      const wrongNote = kind.pattern === 'normal'
        ? 'On this strip the chest rose and fell evenly, with no long pauses. That is normal breathing.'
        : kind.pattern === 'gasping'
          ? 'A sudden gasp followed by a long stillness is not normal breathing, even though the chest moved.'
          : 'The chest did not move at all in the ten seconds.';
      return {
        text: `
          ${who} has collapsed and does not respond to your voice or your touch. Help has been
          called. You tilt the head back to open the airway.

          **Watch the chest for ${CPR.breathCheckSeconds} seconds, then say what you saw.**
        `,
        widget,
        check: (s) => {
          if (!s.watched) return 'Watch the full ten seconds first.';
          if (!s.answer) return 'Choose one of the two answers under the strip.';
          return s.answer === kind.answer || wrongNote;
        },
        solution: { watched: true, answer: kind.answer },
        hints: ['Normal breathing is regular: two or three even breaths in ten seconds.', 'One or two sudden gasps with long gaps between them do not count as breathing.'],
        explain: kind.pattern === 'normal'
          ? `Regular, even breaths: ${who} is **breathing normally**. Unresponsive but breathing normally means the recovery position, and watching that the breathing continues.`
          : kind.pattern === 'gasping'
            ? `Isolated gasps with long stillness between them: ${who} is **not breathing normally**. With no response as well, this is treated as a cardiac arrest: chest compressions start now.`
            : `No movement in ten seconds: ${who} is **not breathing**. With no response as well, this is a cardiac arrest: chest compressions start now.`,
      };
    },
  },
  {
    id: 'order',
    type: 'order',
    review: true,
    title: 'The first minute',
    text: `
      You are alone, with a mobile phone, and an adult collapses in front of you.

      **Put the first steps in order.**
    `,
    items: FIRST_STEPS,
    labels: ['First', 'Then'],
    explain: `
      **Danger, response, call, breathing, then act.** The European guidelines of 2025, like
      the American ones, say to call as soon as someone is unresponsive, and to check breathing
      with the call-taker listening on speaker. Older leaflets put the call one step later. The
      point is the same: the call must not wait.

      With other people around, share the work: one calls, one fetches a defibrillator.
    `,
  },
  {
    id: 'numbers-map',
    type: 'info',
    title: 'Which number?',
    text: `
      Emergency numbers differ around the world. **112** works in every country of the European
      Union and in many others. **911** covers most of North America, and the United Kingdom
      uses **999**.

      The map shows a few examples: tap a country to see its name. When you travel, look up the
      number before you need it. Many phones also connect 112 or 911 to the local service
      wherever you are, but do not count on it.
    `,
    figure: {
      type: 'world-map',
      regions: [
        { ids: EU, color: 'blue', label: '112 (European Union)' },
        { ids: ['US', 'CA', 'MX'], color: 'orange', label: '911' },
        { ids: ['GB'], color: 'red', label: '999' },
        { ids: ['AU'], color: 'green', label: '000' },
        { ids: ['NZ'], color: 'teal', label: '111' },
        { ids: ['JP'], color: 'violet', label: '119' },
        { ids: ['BR'], color: 'pink', label: '192 (ambulance)' },
        { ids: ['IN'], color: 'blue', label: '112 (India)' },
        { ids: ['CN'], color: 'yellow', label: '120 (ambulance)' },
      ],
      alt: 'A world map with example emergency numbers: the countries of the European Union use 112; the United States, Canada and Mexico use 911; the United Kingdom 999; Australia 000; New Zealand 111; Japan 119; Brazil 192 for an ambulance; India 112; China 120 for an ambulance.',
    },
  },
  {
    id: 'numbers',
    type: 'match',
    graded: false,
    title: 'Practice: who calls what?',
    gen: (rng) => {
      const rows = rng.sample(EMERGENCY_NUMBERS, 4);
      const places = rows.map((row) => rng.pick(row.places));
      const pairs = rows.map((row, i) => [cap(places[i]), row.number]);
      return {
        text: `
          A quick practice round, not a test. **Match each place with the number that reaches
          an ambulance there.**
        `,
        pairs,
        explain: `
          ${rows.map((row, i) => `**${row.number}** in ${places[i]}${row.note ? ` (${row.note})` : ''}`).join('; ')}.

          The one that matters most is the number where *you* are.
        `,
      };
    },
  },
  {
    id: 'teach-call',
    type: 'info',
    title: 'What the call-taker needs',
    text: `
      The call connects. Call-takers follow a script that gets help moving within seconds.
      They need three things from you:

      - **Where** you are, exactly: an address, or landmarks nearby. Location comes first
        because help cannot be sent without it.
      - **What** has happened, in a few words. You do not need a diagnosis. "Collapsed and
        not responding" is enough to send help.
      - **How the person is:** whether they are responsive and breathing.

      Then stay on the line, with the phone on speaker. Help is already on its way while you
      talk, and the call-taker can coach you through first aid until it arrives.
    `,
  },
  {
    id: 'call',
    type: 'multi',
    title: 'On the line',
    text: `
      You have reached the emergency number, and the call-taker starts to ask questions.

      **Which of these help them most? Select all that apply.**
    `,
    options: [
      { text: 'Exactly where you are: an address, or landmarks nearby', correct: true },
      { text: 'What has happened, in a few words', correct: true },
      { text: 'Whether the person is responsive and breathing', correct: true },
      { text: 'Staying on the line, with the phone on speaker', correct: true },
      { text: 'Hanging up quickly, to keep the line free', why: 'Stay on the line. Help is already on its way while you talk, and the call-taker can coach you through first aid until it arrives.' },
      { text: 'Waiting until you are sure what is wrong before you call', why: 'You do not need a diagnosis. "Collapsed and not responding" is enough to send help.' },
    ],
    columns: 1,
    explain: `
      **Where, what, and how the person is.** Then stay on the line, hands free: the call-taker
      will tell you what to do next and may be able to tell you where the nearest defibrillator is.
    `,
  },
  {
    id: 'recovery-why',
    type: 'interact',
    title: 'Unresponsive, but breathing',
    text: `
      Ingrid does not respond, but she is breathing normally and shows no sign of injury.
      On her back, her slack tongue or any vomit could block her airway. So first aid turns
      her onto her side, in the **recovery position**. The picture shows it on a
      computer-drawn figure.

      Two features of the position stop her rolling over. A third keeps her airway open.
      **Tap the one that keeps the airway open.**
    `,
    widget: photo(MEDIA['recovery-position'], {
      alt: 'A computer-drawn figure of a grey-haired person in a shirt and jeans, lying on one side on a wooden floor. The lower arm is stretched out in front, the upper hand is tucked under the cheek, the upper knee is bent forward onto the floor, and the head is tilted back with the mouth turned towards the floor.',
      caption: 'One version of the recovery position',
      creditLabel: 'Image',
      hotspots: RECOVERY_SPOTS,
    }),
    check: (s) => s.picked === 'head'
      || (s.picked === 'knee' ? 'The bent knee props her up, so that she cannot roll onto her face. The airway is kept open further up.'
        : s.picked === 'arm' ? 'The outstretched arm steadies her. The airway is kept open by something else.'
          : 'Tap one of the numbered rings.'),
    solution: { picked: 'head' },
    explain: `
      **The head, tilted back, with the mouth turned towards the floor.** An unresponsive
      person's muscles go slack, the tongue included. On the side, the tongue falls forward and
      fluid drains out of the mouth.

      The position is only for someone who is **breathing normally**. If the breathing stops or
      turns to gasps, roll them onto their back and start compressions. If a serious injury to
      the neck or back is likely, tell the call-taker before moving them.
    `,
  },
  {
    id: 'teach-recovery',
    type: 'info',
    title: 'Onto the side',
    text: `
      There are several versions of the recovery position, and a class is the place to
      practise one. This is the version taught by the NHS and St John Ambulance:

${RECOVERY_STEPS.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      The near arm keeps her from rolling too far, the hand cushions her cheek, and the bent knee
      is the lever that turns her and then props her.
    `,
    figure: photo(MEDIA['recovery-position'], {
      alt: 'A computer-drawn figure of a grey-haired person in a shirt and jeans, lying on one side on a wooden floor. The lower arm is stretched out in front, the upper hand is tucked under the cheek, the upper knee is bent forward onto the floor, and the head is tilted back with the mouth turned towards the floor.',
      caption: 'Where the six moves end: one version of the recovery position',
      creditLabel: 'Image',
      mode: 'label',
      hotspots: RECOVERY_SPOTS.map((spot) => ({ ...spot, label: RECOVERY_SHORT[spot.id] })),
    }),
  },
  {
    id: 'recovery-order',
    type: 'order',
    title: 'Onto the side, in order',
    text: `
      Ingrid is unresponsive and breathing normally, and you are kneeling beside her.

      **Put the moves of the recovery position in order**, in the version taught by the NHS
      and St John Ambulance.
    `,
    items: RECOVERY_STEPS,
    labels: ['Start', 'Finish'],
    explain: `
      The last move matters most: **head tilted back, breathing checked again and again** until
      help arrives.
    `,
  },
  {
    id: 'teach-paths',
    type: 'info',
    title: 'Two checks, three paths',
    text: `
      Two questions decide what you do. Is the person responsive? If not, are they
      breathing normally?

      - **Responsive:** ${lower(DECISIONS.responsive.label)}.
      - **Unresponsive, breathing normally:** ${lower(DECISIONS.recovery.label)}.
      - **Unresponsive, not breathing normally:** ${lower(DECISIONS.cpr.label)}.

      If you are not sure the breathing is normal, treat it as not normal: that is the third
      path too.
    `,
  },
  {
    id: 'decide',
    type: 'choice',
    review: true,
    title: 'Two checks, three paths',
    gen: (rng) => {
      const c = rng.pick(CHECK_CASES);
      const she = c.who;
      return {
        text: `
          You find ${she} ${c.where}. There is no danger. ${she} ${c.finding}.

          **What do you do?**
        `,
        options: Object.keys(DECISIONS).map((key) => ({ text: DECISIONS[key].label, correct: key === c.decision })),
        columns: 1,
        shuffle: false,
        hints: ['Two questions decide it. Is the person responsive? If not, are they breathing normally?'],
        explain: `
          ${c.why}

          - **Responsive:** ${DECISIONS.responsive.short}.
          - **Unresponsive, breathing normally:** ${DECISIONS.recovery.short}.
          - **Unresponsive, not breathing normally, or you cannot tell:** ${DECISIONS.cpr.short}.
        `,
      };
    },
  },
  {
    id: 'after',
    type: 'info',
    title: 'Afterwards, and this week',
    text: `
      Many countries have "Good Samaritan" laws that protect people who give first aid in good
      faith, and some make helping a duty. The details differ from place to place. Everywhere, the
      least you can do, calling for help, is always open to you.

      Helping in an emergency can shake you for days, however it ended. That is a normal
      reaction. Talking it through helps, and a doctor can help if it does not fade.

      **Something to try this week, if you like:** find out the emergency number where you live,
      and think about how you would describe where you are right now.
    `,
  },
];

function cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
function lower(text) { return text.charAt(0).toLowerCase() + text.slice(1); }

/** Every step of this course speaks of people in danger: plain feedback, no cheering. */
const sober = (list) => list.map((step) => ({ ...step, tone: 'sober' }));

export default {
  id: 'first-steps',
  steps: sober(steps),
  recap: [
    '**Danger first:** a few seconds to look, because a hurt rescuer helps nobody.',
    '**Response, then call:** tap and shout; if there is no response, call the emergency number and put the phone on speaker.',
    '**Breathing, ten seconds at most:** gasping is not normal breathing, and if in doubt it counts as not breathing.',
    'Unresponsive but breathing normally: **recovery position**. Not breathing normally: **chest compressions**, the subject of the next lesson.',
  ],
  next: 'Next: the heart has stopped, the ambulance is eight minutes away, and you have two hands. What can they do?',
};
