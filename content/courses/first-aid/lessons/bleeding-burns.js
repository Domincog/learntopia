// First Aid: When Minutes Matter · Lesson 5 · Bleeding, Burns and Breaks
//
// Driving question: for the injuries you can see, what should your hands do, and what should they leave alone?
// Sources: the "lesson 5" table in ../helpers.js (ERC 2025 First Aid, AHA/ARC 2024 First Aid, NHS,
// British Burn Association, St John Ambulance, Stop the Bleed, Concussion in Sport Group 2022).
//
// Every step is tone: 'sober'. No picture or drawing in this lesson shows an injury.
import { BURN_COOL_MINUTES, NOSE_PINCH_MINUTES, TOURNIQUET_ABOVE_CM, PRESS_MODEL_MINUTES, BLEED_ACTIONS, BLEED_CASES, BURN_LEVELS, BURN_CASES } from '../helpers.js';

const COOL = BURN_COOL_MINUTES.usual;

// The example on the teaching screen `tourniquet`: a wound on the thigh, and the band 6 cm above it
// (5 units of the drawing are 1 cm: docs/BODY.md). The graded step that follows has its wound on the lower leg.
const TEACH_WOUND = [244, 580];
const TEACH_BAND = [247, 548];

/** The nosebleed first aid, sentence by sentence: listed in `teach-object-nose`, completed in `nosebleed`. */
const NOSE_LEAN = 'so that the blood runs out of the nose and is not swallowed';
const NOSE_PINCH = 'of the nose, just above the nostrils';
const NOSE_HOLD = 'without letting go to check, breathing through the mouth';
const NOSE_TIME = `${NOSE_PINCH_MINUTES[0]} to ${NOSE_PINCH_MINUTES[1]} minutes`;

const steps = [
  {
    id: 'hook',
    type: 'choice',
    mode: 'predict',
    title: 'The kettle slips',
    text: `
      Boiling water splashes over Nadia's forearm. The skin turns red at once, and she is in
      a lot of pain. People in the kitchen call out advice.

      **Which of these is the first aid that guidelines recommend?**
    `,
    options: [
      { text: 'Hold ice against it' },
      { text: 'Rub in butter or toothpaste' },
      { text: `Hold it under cool running water for ${COOL} minutes`, correct: true },
      { text: 'Wrap it tightly in a dry bandage' },
    ],
    shuffle: false,
    columns: 1,
    explain: `
      **Cool running water, for ${COOL} minutes.** Burned skin goes on cooking after the heat
      source is gone; running water carries that heat away. Ice can damage the skin further, and
      butter or toothpaste hold the heat in.

      This lesson is about the injuries you can see. It asks: **what should your hands do, and
      what should they leave alone?**
    `,
  },
  {
    id: 'press',
    type: 'interact',
    graded: false,
    title: 'Press on it',
    text: `
      Start with bleeding, because heavy bleeding can kill within minutes. The first aid is
      simple: **press hard, directly on the wound**, with a clean cloth or a bare hand.

      Try it on this model, in which a second stands for a minute. **Press the pad on the wound
      and get the bleeding to stop.** See what happens if you lift the pad to look.
    `,
    widget: {
      type: 'press-hold', need: PRESS_MODEL_MINUTES,
      alt: 'A drawing of a forearm with a wound marked on it, a pad that can be pressed onto the wound or lifted off, a gauge of how heavy the bleeding is, and a clock in minutes.',
    },
    check: (s) => {
      if (s.controlled) return true;
      if (!s.pressing && s.lifts === 0) return 'Press the pad onto the wound first.';
      if (!s.pressing) return 'With the pad lifted, nothing is holding the cut vessels shut. Press again, and this time keep pressing.';
      return `Keep pressing: ${s.held} ${s.held === 1 ? 'minute' : 'minutes'} of unbroken pressure so far.`;
    },
    solution: { controlled: true, lifts: 0, minutes: PRESS_MODEL_MINUTES },
    explain: `
      **Pressure closes the cut vessels so that a clot can form, and a clot needs time.**
      Lifting the pad to check tears the young clot away. So: press, have the emergency number
      called, and keep pressing until help takes over.

      The model's ten minutes are an illustration. Real bleeding can take longer, and the worst
      bleeding needs more than pressure.
    `,
  },
  {
    id: 'tourniquet',
    type: 'info',
    title: 'When pressure is not enough',
    text: `
      Occasionally an arm or a leg bleeds so heavily that firm pressure cannot control it.
      For that, guidelines now recommend a **tourniquet**: a band that is tightened round the
      limb, usually by twisting a rod, until the bleeding stops.

      - It goes **${TOURNIQUET_ABOVE_CM[0]} to ${TOURNIQUET_ABOVE_CM[1]} cm above the wound**, between the wound and the heart, and never over a joint.
      - It is tightened until the bleeding stops. That hurts, and it is meant to be that tight.
      - Note the **time** it went on, and leave it on for the ambulance crew.

      Where a tourniquet cannot go, such as the groin or the armpit, the wound is packed with
      gauze and pressed on. Both skills are taught in short bleeding-control classes.
    `,
    figure: {
      type: 'body-map', view: 'leg', static: true, show: ['femur', 'kneecap', 'tibia', 'fibula'], zoom: false,
      markers: [
        { at: TEACH_WOUND, label: 'Wound', shape: 'cross', color: 'red', size: 'l', labelPos: 'right' },
        { at: TEACH_BAND, label: 'Tourniquet', shape: 'square', color: 'blue', size: 'l', labelPos: 'right' },
      ],
      alt: 'The legs of a figure facing you, with the bones shown. A cross marks a wound on the middle of one thigh. A square marks the tourniquet on the same thigh, a few centimetres above the wound, between the wound and the hip.',
    },
  },
  {
    id: 'tourniquet-where',
    type: 'interact',
    title: 'Where the band goes',
    text: `
      A deep wound on Viktor's lower leg, marked with a cross, is bleeding in spurts, and
      firm pressure has not controlled it. Help has been called, and a tourniquet is to hand.

      **Tap the place where the tourniquet goes.**
    `,
    widget: {
      type: 'body-map', view: 'leg', mode: 'pickMarker', show: ['femur', 'kneecap', 'tibia', 'fibula'],
      markerLabels: 'after', answer: 'above',
      markers: [
        { at: [236, 772], label: 'Wound', shape: 'cross', color: 'red', size: 'l' },
        { id: 'high', at: [252, 492], label: 'High on the thigh' },
        { id: 'joint', at: [238, 636], label: 'On the knee' },
        { id: 'above', at: [237, 738], label: 'Just above the wound' },
        { id: 'below', at: [235, 822], label: 'Below the wound' },
      ],
      zoom: false,
      alt: 'The legs of a figure facing you, with the bones shown. A cross marks a wound low on one shin. Four lettered points lie on the same leg: high on the thigh, on the knee, a few centimetres above the wound, and below the wound near the ankle.',
    },
    check: (s) => s.picked === 'above'
      || (s.picked === 'high' ? 'A band there would stop the bleeding too, and some courses teach it for a wound that cannot be found. This wound is in plain sight, so the guidelines place the band closer to it, which spares more of the leg.'
        : s.picked === 'joint' ? 'Not over a joint: the band cannot squeeze the vessels shut there.'
          : s.picked === 'below' ? 'That is beyond the wound. Blood comes from the heart, so it would reach the wound before it reached the band.'
            : 'Tap one of the four points on the leg.'),
    solution: { picked: 'above' },
    explain: `
      **A few centimetres above the wound, on the heart's side of it, and never over a joint.**
      If the wound were just below the knee, the band would go above the knee.

      A manufactured tourniquet works far better than a belt or a scarf, which often cannot be
      made tight enough. If there is none, keep pressing as hard as you can.
    `,
  },
  {
    id: 'teach-object-nose',
    type: 'info',
    title: 'Two special cases',
    text: `
      **Something is stuck in the wound.** Leave the object in place and press firmly on either
      side of it. The object may be plugging the vessel it cut, and pulling it out can turn a
      slow bleed into a fast one. Removing it is a job for a hospital.

      **A nosebleed.** Nosebleeds are common and usually harmless, and the traditional advice
      (head back) is the wrong way round.

      1. Sit down and lean forward, ${NOSE_LEAN}.
      2. Pinch the soft part ${NOSE_PINCH}.
      3. Hold the pinch for ${NOSE_TIME} ${NOSE_HOLD}.
    `,
  },
  {
    id: 'nosebleed',
    type: 'fill',
    title: 'A nosebleed',
    text: `
      Sam, 11, has a nosebleed that started while he was reading. He is otherwise well.
      **Complete the first aid.**
    `,
    template: `
      Sit down and lean [[back|*forward]], ${NOSE_LEAN}.

      Pinch the [[*soft part|bony bridge]] ${NOSE_PINCH}.

      Hold the pinch for [[10 to 15 seconds|*${NOSE_TIME}]] ${NOSE_HOLD}.
    `,
    explain: `
      **Forward, soft part, ${NOSE_TIME}.** Swallowed blood irritates the stomach and
      can cause vomiting. As with any bleeding, letting go to look restarts it.

      Get medical help if it will not stop (advice on how long to keep pinching first ranges
      from 15 to 30 minutes), if it is very heavy, if it followed a blow to the head, or if the
      person takes blood-thinning medicine.
    `,
  },
  {
    id: 'bleed-what',
    type: 'choice',
    review: true,
    title: 'Four kinds of bleeding',
    gen: (rng) => {
      const c = rng.pick(BLEED_CASES);
      return {
        text: `
          ${c.story}

          **What do you do?**
        `,
        options: Object.keys(BLEED_ACTIONS).map((key) => ({ text: BLEED_ACTIONS[key], correct: key === c.action })),
        shuffle: false,
        columns: 1,
        hints: ['Is anything stuck in the wound? Has firm pressure already failed on a limb? Is it a nosebleed?'],
        explain: `
          ${c.why}

          ${c.action === 'nose'
    ? 'A nosebleed that will not stop needs medical help: advice on how long to keep pinching first ranges from 15 to 30 minutes.'
    : 'Wear gloves if there are some, and help the person to lie down: someone who has lost blood may faint.'}
        `,
      };
    },
  },
  {
    id: 'teach-burns',
    type: 'info',
    title: 'Cool, then cover',
    text: `
      Back to Nadia's scald. **Cool the burn, warm the person.**

      - **Cool** it under cool running water for ${COOL} minutes. Some guidelines accept ${BURN_COOL_MINUTES.minimum} minutes
        as a minimum. No ice, and no butter, oil or toothpaste: ice can damage the skin
        further, and the others hold the heat in.
      - Take off rings or a watch near the burn: jewellery comes off before the area swells.
      - **Cover** it loosely with cling film or a clean, non-fluffy cloth, and keep the rest of
        the person warm.
      - **Leave** blisters alone: an unbroken blister is a sterile cover. Leave clothing that
        has stuck to the burn too: cool through the clothing and leave it for a professional.
    `,
  },
  {
    id: 'burn-sort',
    type: 'bucket',
    review: true,
    title: 'Cool, then cover',
    text: `
      Back to Nadia's scald. **Sort what helps a burn from what harms it.**
    `,
    buckets: ['Do', 'Do not'],
    items: [
      { text: `Hold it under cool running water for ${COOL} minutes`, bucket: 0 },
      { text: 'Take off rings or a watch near the burn', bucket: 0 },
      { text: 'Cover it loosely with cling film or a clean, non-fluffy cloth', bucket: 0 },
      { text: 'Keep the rest of the person warm', bucket: 0 },
      { text: 'Put ice or iced water on it', bucket: 1, why: 'Ice can damage skin that is already injured, and chills the person.' },
      { text: 'Smear on butter, oil or toothpaste', bucket: 1, why: 'They hold the heat in, and have to be cleaned off before the burn can be treated.' },
      { text: 'Burst the blisters', bucket: 1, why: 'An unbroken blister is a sterile cover. Opening it lets infection in.' },
      { text: 'Pull off clothing that has stuck to the burn', bucket: 1, why: 'That tears the skin away with it. Cool through the clothing and leave it for a professional.' },
    ],
    explain: `
      **Cool the burn, warm the person.** Running water is best for a full ${COOL} minutes, and still
      worth starting up to three hours later. Some guidelines accept ${BURN_COOL_MINUTES.minimum} minutes as a minimum.
      Jewellery comes off before the area swells. Cling film, laid on in a strip and not wound
      round, keeps the burn clean and can be seen through.
    `,
  },
  {
    id: 'teach-burn-help',
    type: 'info',
    title: 'Does it need to be seen?',
    text: `
      After cooling and covering, a small, shallow burn can usually be looked after at home.
      A burn needs medical help if it is:

      - **bigger than the person's hand**
      - **deep**: white or charred skin with little pain, because the nerve endings
        themselves are damaged
      - on the **face, hands, feet, joints or genitals**
      - **chemical or electrical**
      - on a **young child**

      If you are unsure, have it looked at.
    `,
  },
  {
    id: 'burn-level',
    type: 'choice',
    title: 'Home, or medical help?',
    gen: (rng) => {
      const c = rng.pick(BURN_CASES);
      return {
        text: `
          ${c.story}

          **After first aid, what next?**
        `,
        options: Object.keys(BURN_LEVELS).map((key) => ({ text: BURN_LEVELS[key], correct: key === c.level })),
        shuffle: false,
        columns: 1,
        hints: ['Think about four things: how big, how deep, where on the body, and who.'],
        explain: `
          ${c.why}

          If you are unsure, have it looked at.
        `,
      };
    },
  },
  {
    id: 'teach-breaks',
    type: 'info',
    title: 'Keep it still',
    text: `
      After a fall, a limb is swollen, bent where it should be straight, and very painful to
      move: a broken bone is likely. **Support it, pad it, leave it as it is.**

      - Moving broken bone ends can damage the vessels and nerves beside them.
      - Only an X-ray can tell whether it is broken. Testing adds pain and risks more damage.
      - No food or drink: an anaesthetic may be needed within hours, which is safer on an
        empty stomach.

      Someone with a broken collarbone, forearm or hand can usually sit up and travel with the
      arm supported. For a suspected break of the **back, hip or thigh**, do not move them: call
      the emergency number.
    `,
    figure: {
      type: 'body-map', view: 'body', static: true, show: ['skeleton'], zoom: false,
      markers: [
        { at: 'lumbar-spine', label: 'Back', color: 'red', labelPos: 'left' },
        { at: 'hip-joint:right', label: 'Hip', color: 'red', labelPos: 'left' },
        { at: 'femur:right', label: 'Thigh', color: 'red', labelPos: 'left' },
      ],
      alt: 'A skeleton facing you, with three places marked in red: the lower spine, a hip joint and a thigh bone. A suspected break in any of them means "do not move them: call the emergency number".',
    },
  },
  {
    id: 'breaks',
    type: 'bucket',
    title: 'A bent forearm',
    text: `
      Kofi has fallen from a bicycle. His forearm is swollen, bent where it should be straight,
      and very painful to move. A broken bone is likely.

      **Sort the first aid.**
    `,
    buckets: ['Do', 'Do not'],
    items: [
      { text: 'Support the arm in the position you found it', bucket: 0 },
      { text: 'Pad around it with a folded jumper or towel', bucket: 0 },
      { text: 'Cover any open wound with a clean dressing', bucket: 0 },
      { text: 'Straighten the arm so that it looks normal', bucket: 1, why: 'Moving broken bone ends can damage the vessels and nerves beside them.' },
      { text: 'Ask him to move it, to test whether it is broken', bucket: 1, why: 'Only an X-ray can tell. Testing adds pain and risks more damage.' },
      { text: 'Give him something to eat and drink', bucket: 1, why: 'He may need an anaesthetic within hours, which is safer on an empty stomach.' },
    ],
    explain: `
      **Support it, pad it, leave it as it is.** An arm injury like this goes to hospital.
      Call the emergency number for a suspected break of the thigh, hip or back, for a bone
      showing through the skin, or if the limb beyond the injury is cold, pale or numb.
    `,
  },
  {
    id: 'breaks-call',
    type: 'interact',
    title: 'Which breaks cannot travel?',
    text: `
      Kofi can sit in a car and be driven to hospital with his arm supported. For some
      suspected breaks that would be dangerous: the person should stay where they are until
      an ambulance crew moves them.

      **Tap the three places where a suspected break means "do not move them: call the
      emergency number".**
    `,
    widget: {
      type: 'body-map', view: 'body', mode: 'pickMarkers', show: ['skeleton'], max: 3, markerLabels: 'after',
      answer: ['b-back', 'b-hip', 'b-thigh'],
      markers: [
        { id: 'b-collar', at: 'collarbone:right', label: 'Collarbone' },
        { id: 'b-forearm', at: 'radius:right', label: 'Forearm' },
        { id: 'b-hand', at: 'hand-bones:right', label: 'Hand' },
        { id: 'b-back', at: 'lumbar-spine', label: 'Back' },
        { id: 'b-hip', at: 'hip-joint:left', label: 'Hip' },
        { id: 'b-thigh', at: 'femur:left', label: 'Thigh' },
      ],
      zoom: false,
      alt: 'A skeleton facing you, with six lettered points: on a collarbone, a forearm, a hand, the lower spine, a hip joint and a thigh bone.',
    },
    check: (s) => {
      const arm = s.picked.filter((id) => ['b-collar', 'b-forearm', 'b-hand'].includes(id)).length;
      if (s.picked.join() === 'b-back,b-hip,b-thigh') return true;
      if (s.count < 3) return `Choose three places: ${3 - s.count} to go.`;
      return arm === 1 ? 'Two of those are right. Someone with a broken collarbone, forearm or hand can usually sit up and travel with the arm supported.'
        : 'With a broken collarbone, forearm or hand a person can usually sit up and travel, the arm supported. Which breaks make any movement risky?';
    },
    solution: { picked: ['b-back', 'b-hip', 'b-thigh'] },
    hints: ['Think of the bones that carry the body\'s weight, and of the one that protects the spinal cord.'],
    explain: `
      **The back or neck, the hip, and the thigh.** A broken spine can injure the spinal cord if
      it is moved. The hip and the thigh bone are the largest bones in the body, with large
      blood vessels beside them: a broken thigh can bleed a litre or more into the leg, unseen.

      Call as well for any break with bone showing through the skin, or with a cold, pale or
      numb limb beyond it.

      After a fall from a height, a road crash or a dive into shallow water, pain in the neck or
      back, tingling, numbness or weakness mean: **assume the spine is injured and keep the
      person still**.
    `,
  },
  {
    id: 'spine',
    type: 'choice',
    review: true,
    title: 'Do not move them',
    text: `
      Henrik has fallen three metres from a ladder. He is awake and breathing normally. He
      says his neck hurts and his hands are tingling. Nothing nearby endangers him.

      **What do you do?**
    `,
    options: [
      { text: 'Call the emergency number, tell him to keep still, and steady his head in the position you found it', correct: true },
      { text: 'Help him to sit up against the wall so that he is more comfortable', why: 'Neck pain and tingling after a fall suggest an injured spine. Moving him could damage the spinal cord.' },
      { text: 'Roll him into the recovery position, to be on the safe side', why: 'He is awake and breathing normally, so his airway is safe. The risk now is movement.' },
      { text: 'Walk him slowly to a car and drive to hospital', why: 'Standing and walking load the spine. He should stay exactly where he is until the ambulance crew move him.' },
    ],
    columns: 1,
    explain: `
      After a fall from a height, a road crash or a dive into shallow water, pain in the neck or
      back, tingling, numbness or weakness mean: **assume the spine is injured and keep the
      person still**. Kneel behind the head and hold it steady with a hand on each side.

      Move them only if they are in danger. And if they stop breathing normally, breathing comes
      first: CPR, as in lesson 2.
    `,
  },
  {
    id: 'sprain',
    type: 'choice',
    title: 'A twisted ankle',
    text: `
      Mei twists her ankle on a kerb. It swells and aches, but it looks its normal shape and
      she can put a little weight on it.

      The old rule "rest, ice, compression, elevation" is giving way to shorter rest and earlier
      movement. Cold eases pain; whether it speeds healing is uncertain, and experts disagree.

      **Which advice fits current guidance best?**
    `,
    options: [
      { text: 'Protect it at first, use a wrapped cold pack for the pain, then start moving it gently as the pain allows', correct: true },
      { text: 'Keep it completely still for two weeks', why: 'Long rest slows recovery: joints and ligaments heal better with early, gentle movement.' },
      { text: 'Soak it in a hot bath and massage it firmly straight away', why: 'Heat and massage in the first days tend to increase swelling.' },
      { text: 'Run on it to loosen it up', why: 'Loading an injured ligament hard, straight away, risks making the tear worse.' },
    ],
    columns: 1,
    explain: `
      **Protect, then move.** A cold pack goes in a cloth, for no more than about 20 minutes at
      a time.

      If she cannot put any weight on it, or it looks misshapen, treat it as a possible break.
    `,
  },
  {
    id: 'teach-head',
    type: 'info',
    title: 'A blow to the head',
    text: `
      Most bumps on the head are minor. A few are followed by bleeding or swelling inside the
      skull, which can show itself hours later. After a blow to the head, these mean
      **emergency care now**:

      - being knocked out, even briefly
      - vomiting more than once
      - becoming more and more drowsy or confused
      - clear fluid running from the nose or an ear
      - a seizure, a headache that keeps getting worse, weakness or numbness, slurred speech,
        or trouble seeing

      Signs can appear late, so someone should **watch the person for 24 to 48 hours**.
    `,
  },
  {
    id: 'head',
    type: 'multi',
    title: 'Which signs?',
    text: `
      **After a blow to the head, which of these mean "emergency care now"? Select all
      that apply.**
    `,
    options: [
      { text: 'They were knocked out, even briefly', correct: true },
      { text: 'They vomit more than once', correct: true },
      { text: 'They become more and more drowsy or confused', correct: true },
      { text: 'Clear fluid runs from the nose or an ear', correct: true },
      { text: 'A small bump, a short cry, and then straight back to normal', why: 'That is the usual, minor kind. Keep an eye on them for the next day or two all the same.' },
    ],
    columns: 1,
    explain: `
      Call the emergency number if the person cannot be woken, is getting drowsier, has a
      seizure, or if you are in any doubt; otherwise go straight to an emergency department,
      without letting them drive. Signs can appear late, so someone should **watch the person
      for 24 to 48 hours**.

      After any suspected concussion in sport: **off the field, and no return to play that day**.
      "If in doubt, sit them out."
    `,
  },
  {
    id: 'try',
    type: 'info',
    title: 'This week',
    text: `
      Three verbs cover most of this lesson: **press** on bleeding, **cool** a burn, **keep
      still** a suspected break. And three things to leave alone: an object stuck in a wound,
      a blister, and a bent limb.

      **Something to try this week, if you like:** look at what is in the first-aid kit at home
      or at work, or in the car. Is there something to press on a wound with, and something
      clean to cover a burn? The next lesson ends with a short list of what a home kit holds.
    `,
  },
];

/** Every step of this course speaks of people in danger: plain feedback, no cheering. */
const sober = (list) => list.map((step) => ({ ...step, tone: 'sober' }));

export default {
  id: 'bleeding-burns',
  steps: sober(steps),
  recap: [
    '**Bleeding:** have help called, press hard and directly on the wound, and do not lift to look. Leave an embedded object in place. A tourniquet is for a limb that pressure cannot control.',
    `**Burns:** cool running water for ${COOL} minutes, then cover loosely. No ice, no butter, no burst blisters.`,
    '**Breaks:** support the limb as you found it; do not straighten it. Suspected spinal injury: keep the person still.',
    '**Head injury:** watch for 24 to 48 hours; being knocked out, repeated vomiting or growing drowsiness mean emergency care now.',
  ],
  next: 'Last: the emergencies that come without an injury. Fainting, seizures, low blood sugar, heat and cold, poisoning, and a person in crisis.',
};
