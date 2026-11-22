// First Aid: When Minutes Matter · Lesson 6 · Fainting, Seizures, Heat and Cold
//
// Driving question: when someone is suddenly "not right" and there is no injury to see, what helps,
// and which well-meant actions do harm?
// Sources: the "lesson 6" table in ../helpers.js (ERC 2025 First Aid, AHA/ARC 2024 First Aid, AHA 2025,
// NHS, St John Ambulance, epilepsy and diabetes charities, WHO).
//
// Every step is tone: 'sober'. The step on a mental-health crisis follows safe-messaging rules:
// no method, no detail, help works, and the pointers to help are given.
import {
  CORE_TEMP, SUGAR_GRAMS, SUGAR_WAIT_MINUTES, SEIZURE_CALL_MINUTES, HEAT_EXHAUSTION_MINUTES, COOLING, SUGAR_STEPS,
  SEIZURE_OPTIONS, SEIZURE_CASES, HEAT_OPTIONS, HEAT_CASES, EVERYDAY_OPTIONS, EVERYDAY_CASES, CRISIS_LINES, CRISIS_DIRECTORY, KIT, listOf, cap,
} from '../helpers.js';

const BATH_FLOOR = COOLING.aim - 0.5;      // the bath line is drawn down to this temperature
const BATH_MINUTES = (COOLING.start - COOLING.aim) / COOLING.immersion;

/** The first aid named in an answer option such as "Heatstroke: call the emergency number now, …": the part after the colon. */
const after = (option) => option.slice(option.indexOf(': ') + 2);
/** Where to find help in a crisis, as one sentence in the explanation of `crisis`. The teaching screen sets the same lines, from the same constants, one to a line. */
const CRISIS_HELP = `Crisis lines answer day and night: ${listOf(CRISIS_LINES.map((c) => `in ${c.place}, ${c.contact}`))}; ${CRISIS_DIRECTORY} lists services in other countries.`;

const steps = [
  {
    id: 'hook',
    type: 'choice',
    mode: 'predict',
    title: 'The spoon',
    text: `
      In an office a man suddenly stiffens, falls, and begins to jerk all over. Someone shouts:
      "Put a spoon between his teeth, or he will swallow his tongue!"

      **What should the people around him do?**
    `,
    options: [
      { text: 'Put a spoon or a wallet between his teeth' },
      { text: 'Hold his arms and legs down until it stops' },
      { text: 'Cushion his head, move hard things away, and time it', correct: true },
      { text: 'Splash water on his face to bring him round' },
    ],
    shuffle: false,
    columns: 1,
    explain: `
      **Protect, do not interfere.** Nobody can swallow their tongue, and things pushed into the
      mouth break teeth and block the airway. Holding a person down can injure them. Cushion
      the head, clear a space, note the time, and when the jerking stops turn him onto his
      side in the recovery position.

      This last lesson is about emergencies with no injury to see. It asks: **what helps, and
      which well-meant actions do harm?**
    `,
  },
  {
    id: 'teach-seizure',
    type: 'info',
    title: 'Does a seizure need an ambulance?',
    text: `
      The head is cushioned and the time is noted. Whether to call depends on the seizure and
      on the person.

      A short seizure in someone known to have epilepsy, with no injury and a normal recovery,
      usually needs no ambulance: stay with them until they are fully recovered.

      Call the emergency number if:

      - the seizure lasts **more than ${SEIZURE_CALL_MINUTES} minutes**, or another follows
      - it is the person's **first**
      - it happened in water
      - they are hurt or pregnant
      - they do not come round within about ten minutes

      If you do not know whether the person has had seizures before, or you are in any doubt, call.
    `,
  },
  {
    id: 'seizure-call',
    type: 'choice',
    review: true,
    title: 'Call, or stay?',
    gen: (rng) => {
      const c = rng.pick(SEIZURE_CASES);
      return {
        text: `
          ${c.story}

          **What now?**
        `,
        options: [
          { text: SEIZURE_OPTIONS.call, correct: c.call },
          { text: SEIZURE_OPTIONS.stay, correct: !c.call },
        ],
        shuffle: false,
        columns: 1,
        hints: [`How long did it last? Longer than ${SEIZURE_CALL_MINUTES} minutes is one reason to call. There are others: a first seizure, a repeat, water, injury, pregnancy, a slow recovery.`],
        explain: `
          ${c.why}

          Call if a seizure lasts **more than ${SEIZURE_CALL_MINUTES} minutes**, if another follows, if it is the
          person's **first**, if it happened in water, if they are hurt or pregnant, or if they do
          not come round within about ten minutes. If you do not know whether the person has had
          seizures before, or you are in any doubt, call.
        `,
      };
    },
  },
  {
    id: 'teach-faint',
    type: 'info',
    title: 'A faint',
    text: `
      A faint is a brief blackout caused by a short drop in the blood supply to the brain:
      after standing a long time in the heat, at the sight of blood, with pain or fright.

      **Flat, legs up.** Lay the person on their back and raise their legs above the level of
      the heart. Gravity brings blood from the legs back to the heart and brain.

      They should come round within a minute or two. If they do not, treat them as
      unresponsive: check their breathing and call the emergency number. Call too if the
      person has chest pain or a pounding heart, was hurt in the fall, fainted during
      exercise, or has a seizure.
    `,
  },
  {
    id: 'faint',
    type: 'fill',
    title: 'Flat, legs up',
    text: `
      In a hot, crowded train Emil turns pale, says he feels dizzy, and slides to the floor.
      **Complete the first aid for a faint.**
    `,
    template: `
      Lay the person on their [[side|*back|front]] and raise their [[head|arms|*legs]] above the level of the heart.

      They should come round within [[*a minute or two|half an hour|a few hours]].

      If they do not, treat them as unresponsive: check their breathing and call the emergency number.
    `,
    explain: `
      **Flat, legs up.** Afterwards they should sit up slowly. Someone who only *feels* faint should sit or lie down at once;
      crossing the legs and tensing the leg and buttock muscles can stop the faint coming.

      Call the emergency number if the person does not wake within a minute or two, has chest
      pain or a pounding heart, was hurt in the fall, fainted during exercise, or has a seizure.
    `,
  },
  {
    id: 'teach-sugar',
    type: 'info',
    title: 'Low blood sugar',
    text: `
      People with diabetes who use insulin, or certain tablets, can run short of glucose:
      shaky, sweaty, pale, confused, sometimes seeming drunk or bad-tempered. The first aid,
      in order:

${SUGAR_STEPS.map((item, i) => `      ${i + 1}. ${item}`).join('\n')}

      **Sugar that acts fast, then food that lasts.** If the person cannot swallow safely, or
      becomes unresponsive, **nothing goes in the mouth**: call the emergency number and use
      the recovery position. Call too if sugar does not help.
    `,
  },
  {
    id: 'sugar',
    type: 'order',
    review: true,
    title: 'Sugar first, food after',
    text: `
      People with diabetes who use insulin, or certain tablets, can run short of glucose:
      shaky, sweaty, pale, confused, sometimes seeming drunk or bad-tempered.

      Leila is in that state, but awake. **Put the first aid in order.**
    `,
    items: SUGAR_STEPS,
    labels: ['First', 'Last'],
    explain: `
      **Sugar that acts fast, then food that lasts.** About ${SUGAR_GRAMS[0]} to ${SUGAR_GRAMS[1]} grams of glucose is
      the usual amount: four or five glucose tablets, or a small glass of fruit juice or of a
      soft drink that is *not* sugar-free. It works within ${SUGAR_WAIT_MINUTES[0]} to ${SUGAR_WAIT_MINUTES[1]} minutes.

      If she cannot swallow safely, or becomes unresponsive, **nothing goes in the mouth**:
      call the emergency number and use the recovery position. Call too if sugar does not help.
    `,
  },
  {
    id: 'band',
    type: 'interact',
    graded: false,
    title: 'A narrow band',
    text: `
      The body holds its core temperature within about a degree of **37 °C**. The first aid for
      heat and for cold starts with how little room there is on either side.

      **Drag the blue marker to the temperature below which a person has hypothermia, and the
      red marker to the temperature from which heatstroke is diagnosed.** Whole degrees; try
      as often as you like.
    `,
    widget: {
      type: 'number-line', min: 30, max: 44, step: 1, tick: 1, major: 1,
      points: [
        { id: 'cold', value: 31, color: 'blue', label: 'hypothermia', showValue: false },
        { id: 'hot', value: 43, color: 'red', label: 'heatstroke', showValue: false },
      ],
      marks: [{ value: 37, label: 'normal', color: 'green' }],
      ranges: [{ from: 'cold', to: 'hot', color: 'green' }],
      alt: 'A number line of body temperature from 30 to 44 degrees Celsius, with normal marked at 37 and two markers to drag: a blue one for the start of hypothermia and a red one for the start of heatstroke.',
    },
    check: (s) => {
      if (s.cold === CORE_TEMP.hypothermiaBelow && s.hot === CORE_TEMP.heatstrokeFrom) return true;
      if (s.cold > CORE_TEMP.hypothermiaBelow) return `Hypothermia begins lower than ${s.cold} °C, though not by much.`;
      if (s.cold < CORE_TEMP.hypothermiaBelow) return `Hypothermia begins higher than ${s.cold} °C: closer to normal than most people expect.`;
      return s.hot > CORE_TEMP.heatstrokeFrom ? `Heatstroke begins lower than ${s.hot} °C.` : `Heatstroke begins higher than ${s.hot} °C: below that, a hot person is more often feverish or exhausted by heat.`;
    },
    solution: { cold: CORE_TEMP.hypothermiaBelow, hot: CORE_TEMP.heatstrokeFrom },
    hints: ['Hypothermia begins only two degrees below normal.', 'Heatstroke begins about three degrees above normal.'],
    explain: `
      **Below ${CORE_TEMP.hypothermiaBelow} °C is hypothermia; about ${CORE_TEMP.heatstrokeFrom} °C or more, with confusion or collapse, is
      heatstroke.** Only five degrees separate two life-threatening states.
    `,
  },
  {
    id: 'teach-heat-cold',
    type: 'info',
    title: 'Too hot, too cold',
    text: `
      A bystander has no way to measure core temperature, so first aid goes by what the person
      is like. For both extremes the alarm sign is a brain that is no longer working properly.

      - **Heat exhaustion** leaves the mind clear: ${after(HEAT_OPTIONS.exhaustion)}. It
        should ease within about ${HEAT_EXHAUSTION_MINUTES} minutes; if it does not, call.
      - **Heatstroke** shows in the brain: confusion, odd behaviour, collapse, a seizure.
        ${cap(after(HEAT_OPTIONS.stroke))}.
      - **Hypothermia** shows as hard shivering, clumsiness and slurred words. The first aid
        is ${after(EVERYDAY_OPTIONS.cold)}. No hot bath, no hard
        rubbing and no alcohol: fast warming and rough handling can upset the heart, and
        alcohol makes the body lose heat faster.
    `,
  },
  {
    id: 'heat-which',
    type: 'choice',
    review: true,
    title: 'Exhausted by heat, or heatstroke?',
    gen: (rng) => {
      const c = rng.pick(HEAT_CASES);
      return {
        text: `
          ${c.story}

          **What is this, and what do you do?**
        `,
        options: Object.keys(HEAT_OPTIONS).map((key) => ({ text: HEAT_OPTIONS[key], correct: key === c.kind })),
        shuffle: false,
        columns: 1,
        hints: ['One question separates the two: is the person still thinking and behaving normally?'],
        explain: `
          ${c.why}

          **Heat exhaustion** leaves the mind clear and should ease within about
          ${HEAT_EXHAUSTION_MINUTES} minutes of rest, cooling and drinking. **Heatstroke** shows in the brain:
          confusion, odd behaviour, collapse, a seizure. It is an emergency, and summers with
          dangerous heat are becoming more frequent as the climate warms.
        `,
      };
    },
  },
  {
    id: 'cooling',
    type: 'info',
    title: 'Cool first',
    text: `
      In heatstroke the damage grows with every minute the body stays too hot, so cooling
      starts **before** the ambulance arrives. How it is done matters a great deal.

      The graph shows a person at ${COOLING.start} °C, cooled in three ways. The rates are rough
      figures of the kind sports-medicine studies report; real ones vary a good deal.
      **Move the slider** and compare the three lines against the aim of about ${COOLING.aim} °C.

      If no bath, pool or stream is to hand, use what there is: cold wet sheets and
      towels, changed often, with constant fanning.
    `,
    figure: {
      type: 'plot',
      x: [0, 30], y: [37, 42], xStep: 5, yStep: 1,
      xLabel: 'minutes of cooling', yLabel: 'core temperature, °C',
      params: { t: { min: 0, max: 30, step: 5, value: 0, label: 'Minutes', color: 'orange' } },
      fns: [
        { expr: `max(${BATH_FLOOR}, ${COOLING.start} - ${COOLING.immersion}*x)`, color: 'blue', to: (COOLING.start - BATH_FLOOR) / COOLING.immersion },
        { expr: `${COOLING.start} - ${COOLING.sprayFan}*x`, color: 'teal' },
        { expr: `${COOLING.start} - ${COOLING.shade}*x`, color: 'gray' },
      ],
      hlines: [{ y: COOLING.aim, dashed: true }],
      vlines: [{ x: 't', dashed: true }],
      labels: [
        { x: 6, y: 38.45, text: 'cold-water bath' },
        { x: 13.5, y: 40.6, text: 'wet skin and a fan' },
        { x: 23, y: 41.2, text: 'shade only' },
      ],
      readouts: [
        { label: 'Bath', expr: `max(${BATH_FLOOR}, ${COOLING.start} - ${COOLING.immersion}*t)`, digits: 1, unit: '°C' },
        { label: 'Wet skin and fan', expr: `${COOLING.start} - ${COOLING.sprayFan}*t`, digits: 1, unit: '°C' },
        { label: 'Shade only', expr: `${COOLING.start} - ${COOLING.shade}*t`, digits: 1, unit: '°C' },
      ],
      alt: `Three falling lines from ${COOLING.start} degrees Celsius over thirty minutes of cooling. A cold-water bath reaches ${COOLING.aim} degrees in about ${Math.round(BATH_MINUTES)} minutes; wet skin with a fan reaches about ${(COOLING.start - COOLING.sprayFan * 30).toFixed(1)} degrees after thirty minutes; shade alone has barely fallen.`,
    },
  },
  {
    id: 'cold',
    type: 'bucket',
    title: 'Too cold',
    text: `
      A walker has been out in cold rain for hours. He is shivering hard, clumsy, and slurring
      his words: **hypothermia**. Help has been called.

      **Sort what helps from what harms.**
    `,
    buckets: ['Do', 'Do not'],
    items: [
      { text: 'Get him into shelter, out of the wind and the wet', bucket: 0 },
      { text: 'Swap wet clothes for dry layers and blankets, head included', bucket: 0 },
      { text: 'Give a warm, sweet drink if he is fully awake', bucket: 0 },
      { text: 'Put him in a hot bath', bucket: 1, why: 'Fast warming of the skin sends cold blood from the limbs back to the heart, and can upset its rhythm.' },
      { text: 'Rub his arms and legs hard', bucket: 1, why: 'Rough handling of a very cold person can disturb the heart. Move him gently.' },
      { text: 'Give him a drink of spirits to warm him up', bucket: 1, why: 'Alcohol widens the vessels of the skin: he feels warmer and loses heat faster.' },
    ],
    explain: `
      **Shelter, dry, insulate, and warm gradually.** Handle the person gently and keep them
      lying down if you can. Shivering that *stops* without the person getting warmer is a bad
      sign, not a good one.

      Hypothermia is not only for mountains: older people in cold homes, and anyone
      who has fallen and lain on a floor for hours, are at risk.
    `,
  },
  {
    id: 'teach-poison',
    type: 'info',
    title: 'Something swallowed',
    text: `
      **Call first; nothing by mouth; keep the container.** Many countries have a poison line
      staffed day and night, for example 1-800-222-1222 in the United States and 13 11 26 in
      Australia; in the United Kingdom the health advice line 111 does that job. If the person
      is unresponsive, having a seizure or struggling to breathe, use the emergency number.

      - Do not wait for symptoms: some poisons do their damage silently for hours before
        any symptom shows.
      - Do not make the person vomit: vomit can be breathed into the lungs, and anything
        corrosive burns a second time on the way up.
      - Nothing by mouth unless the poison centre says so.
    `,
  },
  {
    id: 'poison',
    type: 'bucket',
    title: 'An open packet',
    text: `
      A three-year-old is found with an open packet of her grandmother's tablets. Some may be
      missing, and she seems perfectly well.

      **Sort the first aid.**
    `,
    buckets: ['Do', 'Do not'],
    items: [
      { text: 'Call a poison centre or the emergency number straight away', bucket: 0 },
      { text: 'Keep the packet, to say exactly what it was', bucket: 0 },
      { text: 'Take away any tablets still in her mouth or hands', bucket: 0 },
      { text: 'Make her vomit', bucket: 1, why: 'Vomit can be breathed into the lungs, and anything corrosive burns a second time on the way up.' },
      { text: 'Give milk or salt water to "neutralise" it', bucket: 1, why: 'Nothing by mouth unless the poison centre says so. Salt water is itself dangerous for a child.' },
      { text: 'Wait to see whether symptoms appear', bucket: 1, why: 'Some poisons do their damage silently for hours before any symptom shows.' },
    ],
    explain: `
      **Call first; nothing by mouth; keep the container.** She seems well, and that changes
      nothing: the call comes before any symptom.

      A chemical on the skin or in the eyes is rinsed with plenty of running water.
    `,
  },
  {
    id: 'overdose-breath',
    type: 'interact',
    title: 'Ten seconds again',
    text: `
      Arlo is found slumped on a sofa, and does not respond to voice or touch. Strong
      painkillers of the opioid family lie beside him. The emergency number has been called.

      **Watch his chest for ten seconds, as in lesson 1, and say what you saw.** Normal
      breathing gives two or three full breaths in ten seconds.
    `,
    widget: {
      type: 'breath-check', pattern: 'slow', slowAt: 2,
      alt: 'Arlo lying on his back, seen from the side, with a strip chart that records chest movement during a ten-second check.',
    },
    check: (s) => {
      if (!s.watched) return 'Watch the full ten seconds first.';
      if (!s.answer) return 'Choose one of the two answers under the strip.';
      return s.answer === 'abnormal' || 'One shallow breath in ten seconds is far too little: normal breathing gives two or three full ones.';
    },
    solution: { watched: true, answer: 'abnormal' },
    explain: `
      **Slow, shallow breathing is not normal breathing.** Opioids (morphine, heroin, fentanyl,
      strong prescription painkillers) switch off the drive to breathe. The signs of an overdose
      are unresponsiveness, slow or absent breathing, very small pupils and blue lips.

      Unresponsive and not breathing normally means CPR, here with rescue breaths if you are
      trained, because lack of oxygen is the problem.
    `,
  },
  {
    id: 'naloxone',
    type: 'fill',
    title: 'The antidote',
    text: `
      For opioids there is an antidote that bystanders can give: **naloxone**. It blocks the
      opioid for a while. In many countries it is sold or handed out as a nasal spray, and
      current guidelines encourage bystanders to give it.

      **Complete the sentences.**
    `,
    template: `
      Naloxone [[speeds up the opioid|*blocks the opioid for a while|removes the opioid from the body]].

      It is given [[*as soon as possible|only once the ambulance has come]], and does no harm if the person turns out not to have taken an opioid.

      Afterwards the person [[can be left to sleep it off|*still needs an ambulance]], because the naloxone can wear off before the opioid does.
    `,
    explain: `
      **Call, give naloxone if there is some, support the breathing, and stay.** It does not
      replace CPR: for someone who is not breathing normally, CPR must not wait for the spray. A person who wakes after
      naloxone can slip back into the overdose when it wears off, so they must not be left alone.

      Where naloxone can be had differs from country to country.
    `,
  },
  {
    id: 'teach-crisis',
    type: 'info',
    title: 'A different kind of emergency',
    text: `
      Not every emergency is physical. Someone may tell you that they cannot see a way forward
      and have been thinking about ending their life. **Stay, listen, ask, and get help.**

      - Stay with them, listen, and take it seriously.
      - You can ask directly, "Are you thinking about suicide?" Asking does not make it more
        likely, and being able to say it aloud to someone is often a relief.
      - This is not a secret to carry alone: they need more help than one friend can give.
        Crisis lines answer day and night:
${CRISIS_LINES.map((c) => `          - in ${c.place}, ${c.contact}`).join('\n')}
          - ${CRISIS_DIRECTORY} lists services in other countries
      - If their life is in immediate danger, call the emergency number and stay with them.

      With help, people get through times like this, and most go on to recover.
    `,
  },
  {
    id: 'crisis',
    type: 'choice',
    title: 'A friend tells you',
    text: `
      Late one evening a friend, Jonas, tells you that he cannot see a way forward and has
      been thinking about ending his life.

      **Which response helps most?**
    `,
    options: [
      { text: 'Stay with him, listen, take it seriously, and help him reach a crisis line or the emergency number', correct: true },
      { text: 'Change the subject quickly, so as not to put ideas into his head', why: 'Talking about suicide openly does not plant the idea. Being able to say it aloud to someone is often a relief.' },
      { text: 'Promise to keep it a secret between the two of you', why: 'This is not a secret to carry alone. He needs more help than one friend can give.' },
      { text: 'Remind him that other people have far worse problems', why: 'That tells him his pain does not count, and it ends the conversation.' },
    ],
    columns: 1,
    explain: `
      **Stay, listen, ask, and get help.** ${CRISIS_HELP} If his life is in immediate danger, call
      the emergency number and stay with him.

      With help, people get through times like this, and most go on to recover.
    `,
  },
  {
    id: 'which',
    type: 'choice',
    review: true,
    title: 'Which emergency?',
    gen: (rng) => {
      const c = rng.pick(EVERYDAY_CASES);
      return {
        text: `
          ${c.story}

          **What is this most likely to be, and what is the first aid?**
        `,
        options: Object.keys(EVERYDAY_OPTIONS).map((key) => ({ text: EVERYDAY_OPTIONS[key], correct: key === c.kind })),
        shuffle: false,
        columns: 1,
        hints: ['What came just before: standing in the heat, a missed meal, hours of cold? And what is the body doing now?'],
        explain: `
          ${c.why}

          In every one of these, if the person does not respond and is not breathing normally,
          the first aid is the same as in lesson 2: call, and start chest compressions.
        `,
      };
    },
  },
  {
    id: 'kit',
    type: 'info',
    title: 'A kit, and a class',
    text: `
      A basic home first-aid kit holds ${listOf(KIT)}. Add the emergency
      numbers for where you live, and any emergency medicine your household has been prescribed.

      **Something to do this week, if you like:** look for a first-aid class near you. The Red
      Cross or Red Crescent, St John Ambulance, heart foundations and many workplaces run them,
      often in a single day.

      This course has given you the knowledge: what to look for, what to do first, and why. A class
      puts it into your hands, on a manikin, with someone to correct you. Together they make a
      person who can act when minutes matter.
    `,
  },
];

/** Every step of this course speaks of people in danger: plain feedback, no cheering. */
const sober = (list) => list.map((step) => ({ ...step, tone: 'sober' }));

export default {
  id: 'everyday-emergencies',
  steps: sober(steps),
  recap: [
    '**Seizure:** protect the head, time it, nothing in the mouth, recovery position afterwards. **Faint:** flat on the back, legs raised.',
    '**Low blood sugar:** fast sugar if they are awake and can swallow; nothing by mouth if they are not.',
    '**Heatstroke** (hot and confused) and **hypothermia** (cold, clumsy, muddled) are emergencies: call, then cool fast, or warm gradually.',
    'Reading is not the same as practising. **A hands-on first-aid class is where this knowledge becomes a skill.**',
  ],
  next: 'This is the end of the Health & the Body path. You have followed fuel, air and blood round the body; met the systems that control and defend it; and looked at what food, movement, sleep and everyday medicine do for it. First aid is where that knowledge meets the moment it is needed. The best next step is not another lesson: it is a class where you can practise.',
};
