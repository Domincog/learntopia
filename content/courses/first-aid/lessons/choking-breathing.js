// First Aid: When Minutes Matter · Lesson 4 · When Someone Cannot Breathe
//
// Driving question: three emergencies can close off a person's breathing within minutes. How do you
// tell them apart, and what is the specific first action for each?
// Sources: the "lesson 4" table in ../helpers.js (ERC 2025 First Aid, AHA 2025, AHA/ARC 2024 First Aid,
// RCUK 2025, national asthma and allergy bodies).
//
// Every step is tone: 'sober'.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/first-aid/index.js';
import { CHOKING_STEPS, BACK_BLOWS, ABDOMINAL_THRUSTS, CHOKING_ACTIONS, CHOKING_CASES, SECOND_DOSE_MINUTES, BREATHING_ACTIONS, BREATHING_CASES } from '../helpers.js';

const BLOW_CM = 5;     // how close the marker has to be to the spot between the shoulder blades, in centimetres
const INJECTOR_GRADED = [268, 536];              // the outer mid-thigh point of `injector-site`, on the person's left thigh

const steps = [
  {
    id: 'hook',
    type: 'choice',
    mode: 'predict',
    title: 'At the next table',
    text: `
      In a café a man starts coughing violently over his food. He is red in the face, his eyes
      are streaming, and between coughs he waves a hand to say he is all right.

      **What is the most helpful thing a bystander can do first?**
    `,
    options: [
      { text: 'Encourage him to keep coughing, and stay close', correct: true },
      { text: 'Hit him hard between the shoulder blades' },
      { text: 'Stand behind him and squeeze his abdomen' },
      { text: 'Give him a glass of water to wash it down' },
    ],
    columns: 1,
    explain: `
      **Let him cough.** A strong cough means air is moving, and it clears an airway better
      than any helper can. Back blows and abdominal thrusts are for the moment the cough *fails*.

      Choking is one of three emergencies that can close off a person's breathing in minutes.
      This lesson asks: **how do you tell them apart, and what is the first action for each?**
    `,
  },
  {
    id: 'teach-choke-signs',
    type: 'info',
    title: 'Is air still moving?',
    text: `
      Everything about choking turns on one question: can the person still move air?
      Ask them, "Are you choking?"

      - **Speech and a strong cough need air**, so someone who can do either is still breathing
        past the blockage. Air is moving: the choking is **mild**.
      - Silence is the danger sign: no voice, no cough, no breath. The airway is blocked: the
        choking is **severe**.
    `,
  },
  {
    id: 'mild-severe',
    type: 'bucket',
    title: 'Mild or severe?',
    text: `
      You ask, "Are you choking?" **Sort the signs** by what they tell you.
    `,
    buckets: ['Air is moving: mild', 'Airway blocked: severe'],
    items: [
      { text: 'Coughs loudly and forcefully', bucket: 0 },
      { text: 'Answers, "Yes, I\'m choking"', bucket: 0 },
      { text: 'Breathes in noisily between coughs', bucket: 0 },
      { text: 'Cannot speak; only nods', bucket: 1 },
      { text: 'Tries to cough but no sound comes out', bucket: 1 },
      { text: 'Clutches the throat as the lips turn blue', bucket: 1 },
    ],
    explain: `
      A voice, a strong cough or noisy breathing all need air. Silence is the danger sign.
    `,
  },
  {
    id: 'teach-choke-steps',
    type: 'info',
    title: 'When the cough fails',
    text: `
      Back blows and abdominal thrusts are for the moment the cough fails. For an adult, or
      a child over one year old, the first aid goes in this order, from mild to worst case:

${CHOKING_STEPS.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      European guidelines say "up to ${BACK_BLOWS}" of each, American ones "${BACK_BLOWS} and ${ABDOMINAL_THRUSTS}": check after every blow whether the
      blockage has cleared. Babies under one need a different method (back blows and chest
      thrusts, never abdominal thrusts), taught in classes.
    `,
  },
  {
    id: 'choke-order',
    type: 'order',
    review: true,
    title: 'From mild to worst case',
    text: `
      An adult, or a child over one year old, is choking.
      **Put the first aid in order, from mild to worst case.**
    `,
    items: CHOKING_STEPS,
    labels: ['First', 'Worst case'],
    explain: `
      **Cough, back blows, abdominal thrusts, and CPR if they collapse.** Back blows are given
      with the heel of the hand between the shoulder blades, with the person leaning well
      forward. For abdominal thrusts, a fist goes just above the navel and is pulled sharply
      inwards and upwards.

      European guidelines say "up to ${BACK_BLOWS}" of each, American ones "${BACK_BLOWS} and ${ABDOMINAL_THRUSTS}": check after every blow whether the
      blockage has cleared. Do not feel blindly in the mouth with a finger: that can push the
      object deeper. Babies under one need a different method (back blows and chest thrusts,
      never abdominal thrusts), taught in classes.
    `,
  },
  {
    id: 'teach-choke-where',
    type: 'info',
    title: 'Where the hands go',
    text: `
      **Back blows** are given with the heel of the hand between the shoulder blades, with the
      person leaning well forward, so that anything dislodged falls out of the mouth.

      For **abdominal thrusts** you stand behind the person and reach round with both arms. A
      fist goes in the midline, just above the navel and well below the breastbone, and is
      pulled sharply inwards and upwards. The drawing, from a first-aid manual, shows that spot
      on the left and the grip from behind on the right.

      Late in pregnancy, or when you cannot reach round the person, the thrusts are given on the
      breastbone. In Australia and New Zealand chest thrusts are taught for everyone.
    `,
    figure: photo(MEDIA['abdominal-thrusts'], {
      alt: 'Two line drawings. On the left, the ribcage from the front, with a green oval in the midline above the navel and below the lower tip of the breastbone. On the right, a man stands behind another man who leans slightly forward, reaches round his waist and holds one fist in the other hand against the upper abdomen; a green arrow points inwards and upwards.',
      caption: 'Abdominal thrusts: the spot, and the grip from behind',
    }),
  },
  {
    id: 'blows-where',
    type: 'interact',
    title: 'Where back blows land',
    text: `
      Ines cannot speak or cough. You support her chest with one hand and lean her well
      forward, so that anything dislodged falls out of the mouth. This figure is seen
      **from behind**.

      **Put the marker where the heel of your other hand strikes.** Within ${BLOW_CM} cm counts.
    `,
    widget: {
      type: 'body-map', view: 'back-torso', mode: 'place', show: ['shoulder-blade', 'spine', 'ribs'], ghost: ['ribs'],
      pin: { label: 'Back blow', color: 'red', start: [200, 450] }, target: 'between-shoulder-blades',
      alt: 'The back of a figure, seen from behind, with the spine, the two shoulder blades and the ribs faintly shown. A marker can be placed anywhere on the back.',
    },
    check: (s) => {
      if (!s.placed) return 'Move the marker onto the back first.';
      if (s.distance <= BLOW_CM) return true;
      if (s.region === 'lower-back' || s.region === 'buttocks') return 'Too low: that is the lower back. Back blows land higher, between the shoulder blades.';
      if (s.region === 'neck' || s.region === 'head') return 'Too high: never strike the neck or the head. Aim between the shoulder blades.';
      if (s.region === 'upper-back') return 'Close. Come to the middle of the upper back, between the two shoulder blades.';
      return 'That is off the back. Aim for the middle of the upper back, between the shoulder blades.';
    },
    solution: { at: 'between-shoulder-blades' },
    explain: `
      **Between the shoulder blades**, with the heel of the hand: up to ${BACK_BLOWS} sharp blows, checking
      after each whether the blockage has come out. Leaning the person forward matters as much
      as the blow.
    `,
  },
  {
    id: 'thrusts-where',
    type: 'interact',
    title: 'Where abdominal thrusts go',
    text: `
      Five back blows have not cleared it. You stand behind Ines and reach round her with both
      arms. The figure now **faces you**.

      **Tap the point where your fist goes for an abdominal thrust.**
    `,
    widget: {
      type: 'body-map', view: 'torso', mode: 'pickMarker', show: ['ribs', 'breastbone', 'diaphragm', 'lungs'], ghost: ['ribs'],
      markerLabels: 'after', answer: 'upper',
      markers: [
        { id: 'chest', at: 'chest-centre', label: 'Breastbone' },
        { id: 'upper', at: 'upper-abdomen', label: 'Just above the navel' },
        { id: 'lower', at: 'lower-abdomen', label: 'Lower abdomen' },
        { id: 'side', at: 'left-side-chest', label: 'Ribs at the side' },
      ],
      zoom: false,
      alt: 'The chest and abdomen of a figure facing you, showing the lungs, the diaphragm beneath them, the breastbone and the ribs, with four lettered points: one on the breastbone, one in the midline between breastbone and navel, one low in the abdomen and one on the ribs at the side.',
    },
    check: (s) => s.picked === 'upper'
      || (s.picked === 'chest' ? 'That is the breastbone: the place for chest compressions. The fist for an abdominal thrust goes lower, in the soft part below the ribs.'
        : s.picked === 'lower' ? 'Too low: a thrust there pushes on the bowel and the bladder, not up under the diaphragm.'
          : s.picked === 'side' ? 'That is on the ribs. A thrust there cannot push the diaphragm up, and could break a rib.'
            : 'Tap one of the four points.'),
    solution: { picked: 'upper' },
    explain: `
      **In the midline, just above the navel and well below the breastbone.** A sharp pull inwards
      and upwards drives the diaphragm up against the lungs, and the air squeezed out of them
      acts like a cough from below.

      Late in pregnancy, or when you cannot reach round the person, the thrusts are given on the
      breastbone. In Australia and New Zealand chest thrusts are taught for everyone.
    `,
  },
  {
    id: 'choke-who',
    type: 'choice',
    title: 'Three people choking',
    gen: (rng) => {
      const c = rng.pick(CHOKING_CASES);
      return {
        text: `
          ${c.who} ${c.story}

          **What do you do?**
        `,
        options: Object.keys(CHOKING_ACTIONS).map((key) => ({ text: CHOKING_ACTIONS[key], correct: key === c.action })),
        shuffle: false,
        columns: 1,
        hints: ['Can the person cough or speak? Are they responsive?'],
        explain: `
          ${c.why}

          Anyone who has been given abdominal thrusts should be checked by a health professional
          afterwards, even if they feel fine: the thrusts can cause injuries inside. And if you
          are in any doubt about how well a choking person is breathing, have the emergency
          number called.
        `,
      };
    },
  },
  {
    id: 'ana-what',
    type: 'info',
    title: 'An allergy that takes over the whole body',
    text: `
      **Anaphylaxis** is a severe allergic reaction. Within minutes of a sting, a food or a
      medicine, the immune system's alarm chemicals flood the body: the airways swell and
      narrow, and blood vessels widen and leak, so the blood pressure falls.

      **Adrenaline** (also called epinephrine) reverses both. People at risk carry it in an
      **auto-injector** like the one in the picture, which gives one measured dose through
      a spring-loaded needle.

      You recognise anaphylaxis by what it threatens: the **airway** (a swollen tongue, a hoarse
      voice), the **breathing** (wheezing, a struggle to breathe) or the **circulation**
      (feeling faint, pale and clammy).
    `,
    figure: photo(MEDIA['auto-injector'], {
      alt: 'A pen-shaped device about the length of a hand, lying on its side: a yellow cap at one end, a white printed label along the barrel with a small clear window in the middle, and a black tip at the other end.',
      caption: 'One brand of adrenaline auto-injector. Others are laid out differently: follow the label',
      mode: 'label',
      hotspots: [
        { id: 'cap', x: 0.065, y: 0.47, r: 0.07, label: 'Safety cap: pulled off first' },
        { id: 'window', x: 0.54, y: 0.44, r: 0.05, label: 'Window: shows the medicine' },
        { id: 'tip', x: 0.915, y: 0.47, r: 0.07, label: 'Needle end: against the thigh' },
      ],
    }),
  },
  {
    id: 'ana-signs',
    type: 'multi',
    title: 'Recognising it',
    text: `
      A few itchy bumps or a runny nose are an ordinary allergy. Anaphylaxis comes on fast and
      threatens the **airway**, the **breathing** or the **circulation**.

      **Which of these, starting minutes after a bee sting, point to anaphylaxis? Select all
      that apply.**
    `,
    options: [
      { text: 'A swollen tongue and a hoarse voice', correct: true },
      { text: 'Wheezing and a struggle to breathe', correct: true },
      { text: 'Feeling faint, pale and clammy', correct: true },
      { text: 'A small red, sore lump where the sting went in, and nothing else', why: 'A local reaction at the sting is normal. Anaphylaxis affects the airway, the breathing or the circulation.' },
    ],
    columns: 1,
    explain: `
      **Sudden, and affecting airway, breathing or circulation.** There is often a rash or
      flushed, swollen skin as well, but not always, so do not wait for one.

      If in doubt, treat it as anaphylaxis: adrenaline given when it was not needed does far
      less harm than adrenaline given too late.
    `,
  },
  {
    id: 'teach-ana-aid',
    type: 'info',
    title: 'What to do',
    text: `
      Someone is having a severe allergic reaction and has an adrenaline auto-injector:

      - Have the emergency number called, with the word "anaphylaxis", and use the
        auto-injector **straight away**. The injection must not wait for the call to finish:
        with two people, one does each.
      - It is pressed into the **outer middle of the thigh**, halfway between hip and knee
        (the green area in the picture), and works through clothing.
      - Help the person to **lie down with the legs raised**; someone who is struggling to
        breathe may need to sit up.
      - If they are no better after about **${SECOND_DOSE_MINUTES} minutes**, a second auto-injector can be used.
        Bodies differ on whether a second dose comes after 5 minutes or somewhat later (5 to 15
        minutes on some labels).

      Brands differ in colour and in details. Every device prints its steps on the label.
    `,
    figure: photo(MEDIA['adrenaline-site'], {
      alt: 'A drawing of the muscles of the front of a thigh, with a grid that divides it into thirds from hip to knee and into an inner and an outer half. The outer half of the middle third is shaded green and labelled "Outer middle third of thigh"; the long muscle beneath it is labelled "Vastus lateralis".',
      caption: 'Where an auto-injector is pressed in',
    }),
  },
  {
    id: 'injector-site',
    type: 'interact',
    review: true,
    title: 'Where the injection goes',
    text: `
      Hana has been stung by a wasp. Her tongue is swelling and she feels faint. She hands you
      her adrenaline auto-injector.

      **Tap the place where an auto-injector is used.**
    `,
    widget: {
      type: 'body-map', view: 'body', bounds: [96, 230, 380, 690], mode: 'pickMarker', show: ['quadriceps'], ghost: ['quadriceps'],
      markerLabels: 'after', answer: 'outer',
      markers: [
        { id: 'arm', at: 'upper-arm:left', label: 'Upper arm' },
        { id: 'belly', at: 'lower-abdomen', label: 'Abdomen' },
        { id: 'inner', at: [226, 540], label: 'Inner thigh' },
        { id: 'outer', at: INJECTOR_GRADED, label: 'Outer mid-thigh' },
      ],
      zoom: false,
      alt: 'A figure facing you, from the chest to below the knees, with four lettered points: one on the upper arm, one low on the abdomen, one on the inner side of a thigh and one on the outer side of the same thigh, halfway between hip and knee.',
    },
    check: (s) => s.picked === 'outer'
      || (s.picked === 'arm' ? 'Many vaccines go into the upper arm, but an auto-injector does not: the muscle there is smaller.'
        : s.picked === 'belly' ? 'Not the abdomen. The medicine has to go into a large muscle.'
          : s.picked === 'inner' ? 'Right limb, wrong side: large blood vessels and nerves run down the inner thigh. Use the outer side.'
            : 'Tap one of the four points.'),
    solution: { picked: 'outer' },
    explain: `
      **The outer side of the thigh, halfway between hip and knee.** The muscle there is large
      and absorbs the adrenaline quickly, and no large vessel or nerve is in the way. The
      injection goes straight through clothing; there is no need to undress the person.
    `,
  },
  {
    id: 'ana-fill',
    type: 'fill',
    review: true,
    title: 'What to do',
    text: `
      Someone is having a severe allergic reaction and has an adrenaline auto-injector.
      **Complete the first aid.**
    `,
    template: `
      Have the emergency number called, with the word "anaphylaxis", and use the auto-injector straight away.

      It is pressed into the [[inner|*outer|back of the]] middle of the thigh, and works through clothing.

      Help the person to [[stand up and walk about|sit on a high stool|*lie down with the legs raised]]; someone who is struggling to breathe may need to sit up.

      If they are no better after about [[*${SECOND_DOSE_MINUTES} minutes|an hour|10 seconds]], a second auto-injector can be used.
    `,
    explain: `
      **Call, outer thigh at once, lie down.** The injection must not wait for the call to
      finish: with two people, one does each. The big muscle on the outside of the thigh
      absorbs the medicine quickly, and no large blood vessel or nerve lies in the way. Lying down with the
      legs raised keeps blood flowing to the heart and brain: standing up suddenly can make a
      person collapse.

      They need hospital even if they recover, because the reaction can return. Antihistamine
      tablets do not treat anaphylaxis and must never delay the adrenaline. Bodies differ on
      small points, such as whether a second dose comes after 5 minutes or somewhat later
      (5 to 15 minutes on some labels).
    `,
  },
  {
    id: 'teach-asthma',
    type: 'info',
    title: 'An asthma attack',
    text: `
      In **asthma** the small airways of the lungs tighten, swell and fill with mucus, so
      breathing out becomes slow, wheezy work. People with asthma usually carry a **reliever
      inhaler** that relaxes the airways within minutes.

      **Upright, reliever, calm, and a low threshold for calling.**

      - Upright, the chest and the diaphragm have room to work. Lying flat makes breathing harder.
      - A spacer (a tube that holds the puff) gets more medicine into the lungs.
      - An attack can worsen quickly, so someone needs to be there to see it and to call.
      - Call at once if the person has no inhaler, cannot finish a sentence, is getting worse,
        or their lips look blue.
    `,
    figure: photo(MEDIA['asthma-airways'], {
      alt: 'Two labelled drawings of a small airway that branches into air sacs, with bands of muscle wrapped round it. "Before an asthma episode" the airway is wide open. "After an asthma episode" the muscles around the airway contract, the airways swell and fill with mucus, and the passage for air is much narrower.',
      caption: 'Small airways, before and after an asthma attack starts',
    }),
  },
  {
    id: 'asthma',
    type: 'bucket',
    title: 'What helps?',
    text: `
      Lucía, 15, has asthma and is having an attack.
      **Sort what helps from what does not.**
    `,
    buckets: ['Helps', 'Does not help'],
    items: [
      { text: 'Sitting upright, leaning slightly forward', bucket: 0 },
      { text: 'Her own reliever inhaler, through a spacer if she has one', bucket: 0 },
      { text: 'Staying with her and speaking calmly', bucket: 0 },
      { text: 'Calling the emergency number if the inhaler is not helping', bucket: 0 },
      { text: 'Lying her flat on her back', bucket: 1, why: 'Lying flat makes breathing harder. Upright, the chest and the diaphragm have room to work.' },
      { text: 'Breathing into a paper bag', bucket: 1, why: 'That is an old remedy for over-breathing, not for asthma, and it cuts down the oxygen she gets.' },
      { text: 'Leaving her alone to rest', bucket: 1, why: 'An attack can worsen quickly. Someone needs to be there to see it and to call.' },
    ],
    explain: `
      **Upright, reliever, calm, and a low threshold for calling.**

      How many puffs, and how often, depends on the country and on her own action plan: British
      advice is one puff every 30 to 60 seconds, up to ten; Australian advice is four puffs, then
      a four-minute wait.
    `,
  },
  {
    id: 'drowning',
    type: 'choice',
    title: 'Pulled from the water',
    text: `
      A boy is lifted out of a swimming pool, unresponsive and not breathing normally.
      The emergency number has been called. After drowning the heart stops because the body
      has run out of oxygen.

      **How does this differ from the cardiac arrest of lesson 2?**
    `,
    options: [
      { text: 'Rescue breaths matter more here, because the cause is a lack of oxygen', correct: true },
      { text: 'The water must be drained from his lungs before anything else', why: 'Trying to drain water wastes time and does not help. What he needs is air and compressions.' },
      { text: 'CPR is pointless after drowning', why: 'People, children especially, have recovered after long CPR following drowning. It is very much worth doing.' },
    ],
    columns: 1,
    explain: `
      After drowning the heart stops because the body has run out of **oxygen**, so guidelines
      ask trained rescuers to give rescue breaths as well as compressions. If you have not been
      trained, follow the call-taker: compressions alone are still far better than nothing.

      And before any of that: **do not jump in** unless you are trained to. Reach with a pole, or
      throw something that floats.
    `,
  },
  {
    id: 'which',
    type: 'choice',
    review: true,
    title: 'Which emergency?',
    gen: (rng) => {
      const c = rng.pick(BREATHING_CASES);
      return {
        text: `
          ${c.story}

          **What is happening, and what is the first aid?**
        `,
        options: Object.keys(BREATHING_ACTIONS).map((key) => ({ text: BREATHING_ACTIONS[key], correct: key === c.kind })),
        shuffle: false,
        columns: 1,
        hints: ['Look at how it began: while eating? after a sting, a food or a medicine? in someone known to have asthma?'],
        explain: `
          ${c.why}

          - **Choking:** sudden and silent, usually while eating.
          - **Anaphylaxis:** minutes after a trigger, with swelling, wheeze or faintness, often a rash.
          - **Asthma:** wheeze and breathlessness in someone with asthma.
        `,
      };
    },
  },
  {
    id: 'try',
    type: 'info',
    title: 'This week',
    text: `
      Each of the three has one specific first action: **back blows** for a blocked airway,
      **adrenaline** for anaphylaxis, the **reliever inhaler** for asthma. In all three, call
      early if it is not clearly getting better.

      **Something to try this week, if you like:** if someone close to you carries an
      auto-injector or an inhaler, ask them to show you where they keep it and how it works.
      Most people are glad to be asked, and many auto-injector brands offer a practice pen
      with no needle.
    `,
  },
];

/** Every step of this course speaks of people in danger: plain feedback, no cheering. */
const sober = (list) => list.map((step) => ({ ...step, tone: 'sober' }));

export default {
  id: 'choking-breathing',
  steps: sober(steps),
  recap: [
    '**Choking:** if they can cough, let them cough. If they cannot cough or speak: back blows, then abdominal thrusts, and CPR if they become unresponsive.',
    '**Anaphylaxis:** have help called and give the adrenaline auto-injector into the outer thigh at once; lie them down with the legs raised.',
    '**Asthma attack:** sit upright, use their own reliever inhaler, and call if it is not helping.',
    'In all three, the call goes out early: these emergencies can worsen within minutes.',
  ],
  next: 'Next: injuries you can see. What to do about serious bleeding, burns, and bones that may be broken.',
};
