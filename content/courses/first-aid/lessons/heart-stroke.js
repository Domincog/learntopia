// First Aid: When Minutes Matter · Lesson 3 · Heart Attack and Stroke
//
// Driving question: how do you recognise a heart attack or a stroke soon enough for treatment to work?
// Sources: the "lesson 3" table in ../helpers.js (ERC 2025 First Aid, AHA/ARC 2024 First Aid, NHS,
// AHA/ASA, British Heart Foundation, Saver 2006).
//
// Every step is tone: 'sober'.
import { ASPIRIN_MG, NEURONS_PER_MINUTE_MILLION as LOST, STROKE_WINDOW_HOURS, FAST, EMERGENCIES, EMERGENCY_CASES, FAST_PEOPLE } from '../helpers.js';

const SIGN_SETS = [
  { face: true, arms: false, speech: false }, { face: false, arms: true, speech: false }, { face: false, arms: false, speech: true },
  { face: true, arms: true, speech: false }, { face: true, arms: false, speech: true }, { face: false, arms: true, speech: true },
  { face: true, arms: true, speech: true },
];
const MISSED = {
  face: 'Look at the mouth again: one corner did not rise with the other.',
  arms: 'Compare the two arms: one of them has sunk.',
  speech: 'Read what was said against what was asked for.',
};
const EXTRA = {
  face: 'The smile is even: both corners of the mouth rose.',
  arms: 'Both arms stayed up at the same height.',
  speech: 'The sentence came back clear and in order.',
};
const KEYS = ['face', 'arms', 'speech'];

/** First aid for a suspected heart attack in someone who is awake, in order: shown in `teach-attack-aid`, ordered in `heart-actions`. */
const HEART_ACTIONS = [
  'Call the emergency number',
  'Help her sit down, supported, and rest',
  'Offer aspirin to chew, if she is not allergic and the call-taker agrees',
  'Stay with her and watch her breathing until help arrives',
];

/** A check for a fast-check step: all three checks made, and exactly the signs that are there ticked. */
const fastCheck = (signs) => (s) => {
  if (!s.allTested) return `Make all three checks first: ${3 - s.testedCount} to go.`;
  const off = KEYS.filter((k) => !!s.marked[k] !== !!signs[k]);
  if (!off.length) return true;
  return signs[off[0]] ? MISSED[off[0]] : EXTRA[off[0]];
};
const fastSolution = (signs) => ({ tested: KEYS, marked: { face: !!signs.face, arms: !!signs.arms, speech: !!signs.speech } });
const signWords = (signs) => KEYS.filter((k) => signs[k]).map((k) => ({ face: 'the face', arms: 'an arm', speech: 'the speech' })[k]);

const steps = [
  {
    id: 'hook',
    type: 'choice',
    mode: 'predict',
    title: 'Two people at one table',
    text: `
      At a family lunch two people feel unwell. **Jorge**, 58, presses a hand to his chest and
      says it feels as if a weight is sitting on it. **Elena**, 67, has no chest pain: she is
      short of breath and nauseous, with an ache in her jaw and upper back.

      **Which of them could be having a heart attack?**
    `,
    options: [
      { text: 'Only Jorge' },
      { text: 'Only Elena' },
      { text: 'Both of them', correct: true },
      { text: 'Neither: a heart attack makes people collapse' },
    ],
    shuffle: false,
    explain: `
      **Both.** Chest pain or pressure is the commonest sign in everyone, but a heart attack can
      also show itself as breathlessness, nausea, sweating, or an ache in the jaw, back or arm.
      That quieter picture is commoner in women, in older people and in people with diabetes.

      This lesson asks: **how do you recognise a heart attack or a stroke soon enough for
      treatment to work?**
    `,
  },
  {
    id: 'attack-what',
    type: 'interact',
    graded: false,
    title: 'A blocked supply line',
    text: `
      The heart muscle has its own small arteries. In a **heart attack** one of them is suddenly
      blocked, usually by a clot, and the muscle beyond the blockage starts to die. The heart
      keeps beating, and the person is usually **awake**.

      The discomfort is not always felt where the heart is, and it can come with breathlessness,
      nausea, a cold sweat or light-headedness. **Tap each of the four marked places** to read
      how a heart attack can feel there.
    `,
    widget: {
      type: 'body-map', view: 'body', bounds: [70, 24, 330, 470], mode: 'explore', show: ['heart'],
      groups: [{ ids: ['heart'], color: 'red', label: 'The heart' }],
      markers: [
        { id: 'pain-chest', at: 'chest-centre', label: 'Chest', color: 'orange', note: 'The commonest sign: pressure, tightness, heaviness or pain in the centre of the chest, lasting more than a few minutes or coming and going.' },
        { id: 'pain-arm', at: 'upper-arm:left', label: 'Arm', color: 'orange', note: 'Pain or heaviness can spread into one arm or both. The left arm is the more usual.' },
        { id: 'pain-jaw', at: 'chin', label: 'Jaw and neck', color: 'orange', labelPos: 'left', note: 'An ache in the jaw, the neck or the throat, sometimes taken for toothache. Pain can also be felt in the back, between the shoulder blades.' },
        { id: 'pain-abdomen', at: 'upper-abdomen', label: 'Upper abdomen', color: 'orange', note: 'Discomfort high in the abdomen, with nausea, is easily taken for indigestion.' },
      ],
      pickable: ['pain-chest', 'pain-arm', 'pain-jaw', 'pain-abdomen'],
      zoom: false,
      alt: 'The upper half of a figure facing you, with the heart highlighted in the chest and four marked places where the discomfort of a heart attack can be felt: the centre of the chest, the left arm, the jaw and neck, and the upper abdomen.',
    },
    check: (s) => s.seenCount >= 4 || `Tap the other marked places too: ${4 - s.seenCount} to go.`,
    solution: { seen: ['pain-chest', 'pain-arm', 'pain-jaw', 'pain-abdomen'] },
    explain: `
      Because the person is awake and the pain may be mild or in an odd place, people talk
      themselves out of calling: "It is probably indigestion."

      Hospitals can reopen the artery, and the sooner they do, the more muscle is saved.
      **So the first aid is mostly one thing: the call.**
    `,
  },
  {
    id: 'signs',
    type: 'multi',
    title: 'What a heart attack can look like',
    text: `
      **Which of these can be signs of a heart attack? Select all that apply.**
    `,
    options: [
      { text: 'Pressure, tightness or pain in the chest that lasts more than a few minutes', correct: true },
      { text: 'Pain that spreads to an arm, the neck, the jaw or the back', correct: true },
      { text: 'A cold sweat, with nausea or light-headedness', correct: true },
      { text: 'Shortness of breath, with or without chest discomfort', correct: true },
      { text: 'One side of the face suddenly drooping', why: 'A drooping face points to a stroke: also an emergency, with its own check, later in this lesson.' },
    ],
    columns: 1,
    explain: `
      A heart attack does not have to look like the films. The pain can be mild, can come and go,
      and may be described as pressure or heaviness, not pain. If the signs fit,
      **treat it as a heart attack and call**. Being wrong costs an ambulance journey; waiting
      can cost heart muscle.
    `,
  },
  {
    id: 'teach-attack-aid',
    type: 'info',
    title: 'While the ambulance is coming',
    text: `
      Marta, 61, has the signs of a heart attack. She is awake and talking. The first aid,
      in order:

${HEART_ACTIONS.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      **Call first, then rest.** Sitting half upright with the knees bent eases the work of the
      heart. Stay: if she becomes unresponsive and stops breathing normally, it has become a
      cardiac arrest, and compressions start.
    `,
  },
  {
    id: 'heart-actions',
    type: 'order',
    review: true,
    title: 'In order',
    text: `
      Marta, 61, has had a heavy tightness across her chest for fifteen minutes. She is awake
      and talking. **Put the first aid in order.**
    `,
    items: HEART_ACTIONS,
    labels: ['First', 'Then'],
    explain: `
      **Call first, then rest.** Sitting half upright with the knees bent eases the work of the
      heart. If she has her own heart medicine, such as a spray for angina, help her take it. Stay:
      if she becomes unresponsive and stops breathing normally, it has become a cardiac arrest,
      and compressions start.

      Do not drive her to hospital yourself: an ambulance crew begins treatment on arrival.
    `,
  },
  {
    id: 'teach-aspirin',
    type: 'info',
    title: 'About the aspirin',
    text: `
      Aspirin makes blood platelets less sticky, which slows the growth of the clot in the
      artery. It slows the clot; it does not remove it. The artery still has to be reopened
      in hospital.

      - It is for an **adult** who is awake. Aspirin is not for children, nor for anyone
        allergic to it or told by a doctor not to take it.
      - It is **chewed**, so that it works faster.
      - The **call comes first**. If you are unsure, leave it out, and never let a search for
        a tablet hold up the call: the call matters far more than the tablet.
    `,
  },
  {
    id: 'aspirin',
    type: 'choice',
    title: 'Aspirin: who, how, when',
    text: `
      **Which statement matches current first-aid guidelines for a suspected heart attack?**
    `,
    options: [
      { text: 'An adult who is awake, is not allergic to it and has not been told to avoid it can be encouraged to chew one while help is on the way', correct: true },
      { text: 'If the pain eases after an aspirin, the ambulance can be cancelled', why: 'Aspirin slows the clot; it does not remove it. The artery still has to be reopened in hospital.' },
      { text: 'It should be swallowed whole with plenty of water, so that it works gently', why: 'It is chewed precisely so that it works faster.' },
      { text: 'It is worth giving in any sudden illness, a suspected stroke included', why: 'Some strokes are bleeds, and aspirin could make a bleed worse. In a suspected stroke, nothing is given by mouth.' },
    ],
    columns: 1,
    explain: `
      **Chewed, by an adult, with the call already made.** The guidelines differ on the dose:
      European ones say ${ASPIRIN_MG.erc} mg, American ones ${ASPIRIN_MG.ahaArc[0]} to ${ASPIRIN_MG.ahaArc[1]} mg. The call-taker
      will tell you what applies where you are.
    `,
  },
  {
    id: 'stroke-what',
    type: 'info',
    title: 'The same event, in the brain',
    text: `
      A **stroke** is a sudden loss of blood supply to part of the brain. Most are caused by
      a clot blocking an artery; the rest by a burst vessel that bleeds. From outside you cannot
      tell which.

      Brain cells die fast. In a typical large stroke, about **${LOST} million nerve cells are
      lost every minute** until the blood flow returns. Clot-dissolving medicine is usually given only
      within about ${STROKE_WINDOW_HOURS} hours of the first symptom, and works better the earlier it is given.

      **Move the slider** to see what waiting costs, on that average figure.
    `,
    figure: {
      type: 'plot',
      x: [0, 120], y: [0, 240], xStep: 30, yStep: 60,
      xLabel: 'minutes without treatment', yLabel: 'million nerve cells lost',
      params: { t: { min: 0, max: 120, step: 10, value: 30, label: 'Minutes of delay', color: 'orange' } },
      fns: [{ expr: `${LOST}*x`, color: 'gray' }],
      points: [{ id: 'N', x: 't', on: 0, color: 'orange' }],
      vlines: [{ x: 't', dashed: true }],
      readouts: [{ label: 'Nerve cells lost, millions', expr: `${LOST}*t`, digits: 0 }],
      alt: 'A straight line rising from zero: nerve cells lost, in millions, against minutes without treatment, at 1.9 million a minute. A slider moves a point along the line.',
    },
  },
  {
    id: 'neurons',
    type: 'numeric',
    title: 'Time is brain',
    gen: (rng) => {
      const minutes = rng.pick([10, 20, 30, 40, 50, 60]);
      const wait = rng.pick([
        `A family decides to wait and see whether the symptoms pass. They call ${minutes} minutes later than they could have.`,
        `A man with stroke symptoms lies down to "sleep it off". His wife calls the emergency number ${minutes} minutes later.`,
        `Instead of calling, a neighbour drives a woman with stroke symptoms to a clinic that cannot treat strokes. That costs ${minutes} minutes.`,
      ]);
      const answer = Math.round(LOST * minutes * 10) / 10;
      return {
        text: `
          In a typical large stroke, about **${LOST} million** nerve cells are lost each minute
          until the blood flow is restored.

          ${wait}

          **About how many million nerve cells does that delay cost?**
        `,
        answer,
        unit: 'million',
        tolerance: 0.5,
        wrong: [
          [LOST, `That is the loss in one minute. The delay was ${minutes} minutes.`],
          [minutes, `That is the number of minutes. Each of them costs about ${LOST} million cells.`],
        ],
        hints: [`Multiply the loss per minute by the number of minutes: ${LOST} × ${minutes}.`],
        explain: `
          ${LOST} million × ${minutes} minutes = **${answer} million nerve cells**. The brain has tens of billions,
          so a person can lose many and recover, but each one that is lost stays lost. With a
          stroke, the only fast thing to do is the call.
        `,
      };
    },
  },
  {
    id: 'fast-explore',
    type: 'interact',
    graded: false,
    title: 'Three quick checks',
    text: `
      Rosa, 49, suddenly "feels strange" while cooking. You cannot see inside her head, but
      you can ask her to do three things.

      **Make each check, look at the drawing, and tick every sign you find.**
    `,
    widget: {
      type: 'fast-check', name: 'Rosa', signs: { face: true, arms: false, speech: 'slurred' }, side: 'right',
      alt: 'A line drawing of Rosa, facing you, on whom three checks can be made: a smile, both arms raised, and a sentence repeated.',
    },
    check: fastCheck({ face: true, arms: false, speech: true }),
    solution: fastSolution({ face: true, arms: false, speech: true }),
    explain: `
      Rosa's smile rises on one side only and her words are slurred; her arms are steady.
      **One sign is enough to call.** Two leave no doubt.

      A drawing leaves a lot out. Sudden confusion, loss of balance, loss of sight or a severe
      headache with no cause can be a stroke too.
    `,
  },
  {
    id: 'teach-fast',
    type: 'info',
    title: 'FAST',
    text: `
      The three checks and what to do next are remembered with one word: **FAST**.

${FAST.map((row) => `      - **${row.letter} · ${row.word}.** ${row.check}`).join('\n')}

      **One sign is enough to call.** "Time" has two meanings: call *now*, and note *when* the
      symptoms began, because the hospital's choice of treatment depends on it.
    `,
  },
  {
    id: 'fast-letters',
    type: 'match',
    review: true,
    title: 'Four letters',
    text: `
      The three checks and what to do next are remembered with one word: **FAST**.
      **Match each letter with what it stands for.**
    `,
    pairs: FAST.map((row) => [`**${row.letter}** · ${row.word}`, row.check]),
    explain: `
      **Face, Arms, Speech, Time.** "Time" has two meanings: call *now*, and note *when* the
      symptoms began, because the hospital's choice of treatment depends on it.

      Some services teach **BE-FAST**, which adds sudden loss of **B**alance and of sight (**E**yes).
      Both are in use; either gets the call made.
    `,
  },
  {
    id: 'fast-find',
    type: 'interact',
    review: true,
    title: 'Make the checks',
    gen: (rng) => {
      const set = rng.pick(SIGN_SETS);
      const name = rng.pick(FAST_PEOPLE);
      const signs = { face: set.face, arms: set.arms, speech: set.speech ? rng.pick(['slurred', 'jumbled']) : false };
      const found = signWords(set);
      return {
        text: `
          ${name} was fine a few minutes ago and now seems suddenly unwell.

          **Make the three FAST checks and tick every sign you find.**
        `,
        widget: {
          type: 'fast-check', name, signs, side: rng.pick(['left', 'right']),
          alt: `A line drawing of ${name}, facing you, on whom three checks can be made: a smile, both arms raised, and a sentence repeated.`,
        },
        check: fastCheck(set),
        solution: fastSolution(set),
        hints: ['A sign is present when the two sides differ: one corner of the mouth, one arm.', 'For speech, compare the words in the bubble with the sentence that was asked for.'],
        explain: `
          The checks show a problem with **${found.join(found.length === 2 ? ' and ' : ', ')}**. ${found.length === 1 ? 'One sign is enough.' : 'Any one of them would be enough.'}
          The **T** comes next: call the emergency number and note the time the symptoms began.
        `,
      };
    },
  },
  {
    id: 'teach-stroke-wait',
    type: 'info',
    title: 'While you wait',
    text: `
      The call has been made. Until the ambulance comes:

      - **Nothing by mouth: no food, no drink, no medicine.** A stroke can weaken swallowing,
        so food and drink can end up in the lungs. If the stroke is a bleed, aspirin could make
        it worse, and only a scan can tell.
      - The useful things are the time the symptoms started, company, and what you can tell
        the crew.
      - **Symptoms that pass still need the call.** They may have been a "mini-stroke", and
        the risk of a full stroke is highest in the next hours and days.
    `,
  },
  {
    id: 'stroke-donts',
    type: 'bucket',
    title: 'Do, and do not',
    text: `
      Daniel, 71, has a drooping mouth and slurred speech. The ambulance is on its way.
      **Sort what to do from what not to do.**
    `,
    buckets: ['Do', 'Do not'],
    items: [
      { text: 'Note the time his symptoms started', bucket: 0 },
      { text: 'Help him into a comfortable position and stay with him', bucket: 0 },
      { text: 'Tell the crew which medicines he takes, if you know', bucket: 0 },
      { text: 'Give him a glass of water', bucket: 1, why: 'A stroke can weaken swallowing, so food and drink can end up in the lungs.' },
      { text: 'Give him an aspirin, just in case', bucket: 1, why: 'If the stroke is a bleed, aspirin could make it worse. Only a scan can tell.' },
      { text: 'Let him go to bed and see how he is in the morning', bucket: 1, why: 'The treatments work only in the first hours.' },
    ],
    explain: `
      **Nothing by mouth: no food, no drink, no medicine.** If he becomes unresponsive but keeps
      breathing normally, the recovery position protects his airway.
    `,
  },
  {
    id: 'tia',
    type: 'choice',
    title: 'It went away',
    text: `
      For ten minutes Yusuf's speech was jumbled and his right hand would not grip. Now
      everything is back to normal, and he wants to get on with his day.

      **What should happen?**
    `,
    options: [
      { text: 'Call the emergency number now, even though he feels well', correct: true },
      { text: 'Carry on, and call only if the symptoms come back', why: 'Symptoms that pass are a warning: the risk of a full stroke is highest in the next hours and days.' },
      { text: 'Mention it to his doctor at the next routine appointment', why: 'That could be weeks away. The danger is in the coming hours and days.' },
    ],
    columns: 1,
    explain: `
      Stroke symptoms that disappear may have been a **transient ischaemic attack**, a
      "mini-stroke": usually a small clot that cleared by itself. It is a warning that a full stroke may
      follow soon, and urgent treatment lowers that risk. **Passing symptoms still need
      emergency assessment.**
    `,
  },
  {
    id: 'which',
    type: 'choice',
    review: true,
    title: 'Which emergency?',
    gen: (rng) => {
      const c = rng.pick(EMERGENCY_CASES);
      return {
        text: `
          ${c.who} ${c.story}.

          **What is this, and what do you do?**
        `,
        options: Object.keys(EMERGENCIES).map((key) => ({ text: EMERGENCIES[key], correct: key === c.kind })),
        shuffle: false,
        columns: 1,
        hints: ['Is the person responsive and breathing normally? If so: is the trouble in the chest, or in the face, arms and speech?'],
        explain: `
          ${c.why}

          All three answers begin the same way, with the call.
        `,
      };
    },
  },
  {
    id: 'try',
    type: 'info',
    title: 'This week',
    text: `
      For both emergencies in this lesson, the most useful first aid is to recognise it and
      call without delay. People lose most time by hoping it will pass, or by not wanting to
      make a fuss.

      **Something to try this week, if you like:** teach one other person what the four letters
      of FAST stand for. Explaining it is the best way to make sure you remember it yourself, and
      now two people know.
    `,
  },
];

/** Every step of this course speaks of people in danger: plain feedback, no cheering. */
const sober = (list) => list.map((step) => ({ ...step, tone: 'sober' }));

export default {
  id: 'heart-stroke',
  steps: sober(steps),
  recap: [
    'A **heart attack** is a blocked artery of the heart. The person is usually awake; the signs can be chest pressure, pain spreading to arm, jaw or back, breathlessness, sweating or nausea.',
    'First aid for it: **call**, rest, aspirin to chew for an adult if suitable, and stay with them.',
    'A **stroke** is checked with **FAST**: Face, Arms, Speech, Time. One sign is enough to call; note when it began.',
    'In a suspected stroke give **nothing by mouth**, and treat symptoms that pass as an emergency all the same.',
  ],
  next: 'Next: three emergencies of the airway and the lungs, each with a specific first action: choking, severe allergy and asthma.',
};
