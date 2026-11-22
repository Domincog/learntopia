// Staying Well: Prevention and Everyday Medicine · Lesson 4 · Teeth, Skin, Eyes and Ears
//
// Driving question: which parts of you cannot repair themselves, and what wears them out?
// Sources for the facts are noted in ../helpers.js.
import { r, num } from '../../../kit.js';
import { TEETH, UV_BANDS, UV_NEED, UV_PROTECT_FROM, uvBand, MYOPIA_TRIAL, NOISE, safeMinutes, ROAD, duration } from '../helpers.js';

const DAY = { type: 'acid-day', meals: [8, 13, 19], snacks: [10, 11.5, 15, 17, 21] };

/** The UV index scale as a coloured bar, with a pointer at one value (no pointer when `index` is null). */
function uvScale(index) {
  const x0 = 20;
  const w = 25;                                     // px per index step; the bar covers 0 to 12
  const band = index == null ? null : uvBand(index);
  let content = '';
  for (const b of UV_BANDS) {
    const left = x0 + b.from * w;
    const right = x0 + (Math.min(b.to, 12) + 1) * w;
    content += `<rect class="fill-${b.color} stroke-ink" stroke-width="2" x="${left}" y="52" width="${right - left}" height="30"/>`;
    content += `<text class="fig-label-sm" x="${(left + right) / 2}" y="100" text-anchor="middle">${b.name}</text>`;
  }
  for (let i = 0; i <= 10; i++) content += `<text class="fig-label-sm" style="fill:#1D1B26" x="${x0 + i * w + w / 2}" y="72" text-anchor="middle">${i}</text>`;
  content += `<text class="fig-label-sm" style="fill:#1D1B26" x="${x0 + 12 * w}" y="72" text-anchor="middle">11+</text>`;
  if (index != null) {
    const px = index >= 11 ? x0 + 12 * w : x0 + index * w + w / 2;
    content += `<path class="fill-ink" d="M${px - 8} 30 L${px + 8} 30 L${px} 46 Z"/>`;
    content += `<text class="fig-label" x="${px}" y="22" text-anchor="middle">UV ${index}</text>`;
  }
  return {
    type: 'svg', viewBox: index == null ? '0 42 365 66' : '0 0 365 108', maxWidth: 520, content,
    alt: `The UV index scale as a bar from 0 to 11 and above, in five bands: low for 0 to 2, moderate for 3 to 5, high for 6 and 7, very high for 8 to 10, extreme from 11.${index == null ? '' : ` A pointer marks ${index}, in the ${band.name} band.`}`,
  };
}

/** The index values that call for one level of protection, in words: "3 to 7", "8 and above". */
function uvRange(need) {
  const bands = UV_BANDS.filter((b) => b.need === need);
  const last = bands[bands.length - 1];
  return last === UV_BANDS[UV_BANDS.length - 1] ? `${bands[0].from} and above` : `${bands[0].from} to ${last.to}`;
}

const UV_SCENES = [
  [0, 'the hour after sunset in Nairobi'], [1, 'a winter afternoon in Oslo'], [2, 'an overcast autumn morning in London'],
  [3, 'a spring day in Paris'], [4, 'a hazy autumn morning in Delhi'], [5, 'a May afternoon in Toronto'],
  [6, 'a ski slope in the Alps in April'], [7, 'a June noon in Berlin'],
  [8, 'a summer noon in Rome'], [9, 'a midsummer noon in Madrid'], [10, 'a summer noon in Cairo'],
  [11, 'noon in Singapore'], [12, 'a January noon on a beach in Queensland'],
];

const SOUNDS = ['a rock concert', 'a nightclub', 'a football stadium', 'a busy bar with live music', 'a workshop with power tools', 'headphones turned up on a noisy train'];

export default {
  id: 'everyday-care',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Ten sweets',
      text: `
        Two friends each eat the same ten sweets every day.

        **Ana** eats all ten in one go, straight after lunch. **Ben** eats one an hour, from morning till evening.

        **Whose teeth come off worse?**
      `,
      shuffle: false,
      options: [
        { text: 'Ana\'s: ten at once is a bigger hit' },
        { text: 'Ben\'s: little and often is worse', correct: true },
        { text: 'The same: it is the same amount of sugar' },
      ],
      explain: `
        **Ben's**, by a long way. For teeth it is not only *how much* sugar that counts, but *how often*.

        To see why, you can watch what a tooth goes through in a day. Teeth turn out to share something with skin, eyes and ears: each has a part that does not grow back, and small daily habits decide how long it lasts.
      `,
    },
    {
      id: 'acid-explore',
      type: 'interact',
      graded: false,
      title: 'A day in the life of a tooth',
      text: `
        Bacteria living in the film on your teeth (plaque) turn sugar into **acid** within minutes. Below a pH of about ${TEETH.criticalPh}, the acid dissolves minerals out of the enamel. Saliva takes most of an hour to put things right.

        Here is Dana's day: three meals ([blue squares]{.blue}) and five sugary snacks or drinks ([pink dots]{.pink}). **Drag one of the snacks onto a mealtime** and watch the curve.
      `,
      widget: { ...DAY, alt: 'A graph of acidity at the tooth surface from 7 in the morning to 11 at night. It dips sharply after each of three meals and five sugary snacks, and recovers slowly each time. The snacks can be dragged along the day.' },
      check: (s) => s.withMeals >= 1 || 'Drag a pink dot left or right until it sits directly under one of the blue squares.',
      solution: { snacks: [8, 11.5, 15, 17, 21] },
      explain: `
        Each time sugar arrives, the pH plunges and the enamel is under attack for 20 to 30 minutes. At the start, eight sittings made eight attacks.

        A snack eaten **with** a meal adds almost nothing: the meal has already set off an attack, and the two merge into one. Between attacks, saliva neutralises the acid and puts minerals back.
      `,
    },
    {
      id: 'acid-fix',
      type: 'interact',
      attempts: 6,
      title: 'Same sugar, kinder day',
      text: `
        Dana's teeth spend about three hours of this day under acid attack.

        **Without taking away a single snack, bring the time under attack below 100 minutes.**
      `,
      widget: { ...DAY, alt: 'A graph of acidity at the tooth surface through a day, with three fixed meals and five sugary snacks that can be dragged along the day. Readouts count the acid attacks and the minutes under attack.' },
      check: (s) => {
        if (s.minutes < 100) return true;
        if (s.between === 5) return 'No snack shares a mealtime yet, so each sitting between meals sets off an attack. Try moving the snacks onto the mealtimes.';
        return `${s.minutes} minutes. ${s.between} of the snacks still ${s.between === 1 ? 'falls' : 'fall'} between meals, where sugar starts an attack that no meal had started already.`;
      },
      solution: { snacks: [8, 8, 13, 13, 19] },
      hints: ['An attack that has already started costs nothing extra. Where in the day are attacks happening anyway?', 'Put every pink dot directly under a blue square.'],
      explain: `
        With every snack moved to a mealtime, eight attacks become three, and three hours shrink to about an hour and a half, on exactly the same sugar.

        This is a simplified model: real mouths vary, and the **amount** of sugar matters as well. But dentists' advice follows this curve: keep sugary food and drink to mealtimes, and drink water between.
      `,
    },
    {
      id: 'teach-teeth',
      type: 'info',
      title: 'Plaque, sugar, fluoride',
      text: `
        Enamel is the hardest substance in the body, and once a cavity has formed it never grows back. Three things decide the fate of a tooth.

        - **Plaque**, the film of bacteria. Brushing clears it, and cleaning between the teeth reaches where a brush cannot.
        - **Sugar**: how much, and how often. Every sitting between meals starts a new acid attack; the picture shows the day you just rearranged.
        - **Fluoride**, in toothpaste. It hardens enamel against acid and helps saliva rebuild it.

        Saliva is the natural defence, and it slows right down in sleep. Whatever is on the teeth at bedtime has hours to work.
      `,
      figure: { ...DAY, snacks: [8, 8, 13, 13, 19], static: true, alt: 'A graph of acidity at the tooth surface through a day in which all five sugary snacks are eaten with the three meals. The curve dips below the critical line only three times, after breakfast, lunch and the evening meal, and recovers each time.' },
    },
    {
      id: 'teeth-care',
      type: 'bucket',
      review: true,
      title: 'Friends and enemies of enamel',
      text: 'Enamel is the hardest substance in the body, and once a cavity has formed it never grows back. **Sort these habits.**',
      buckets: ['Protects teeth', 'Wears them down'],
      items: [
        { text: 'Brushing twice a day with fluoride toothpaste', bucket: 0, why: 'Brushing clears plaque, and fluoride hardens enamel against acid and helps saliva rebuild it.' },
        { text: 'Cleaning between the teeth', bucket: 0, why: 'A brush cannot reach between teeth, where plaque causes both decay and gum disease.' },
        { text: 'Keeping sweet things to mealtimes', bucket: 0, why: 'Fewer sittings mean fewer acid attacks.' },
        { text: 'Sipping a sugary drink all afternoon', bucket: 1, why: 'Every sip restarts the acid attack, so the enamel never gets its recovery time.' },
        { text: 'A bottle of juice in bed for a toddler', bucket: 1, why: 'Sugar bathes the teeth for hours while saliva, the natural defence, slows right down in sleep.' },
        { text: 'Skipping the brush at night', bucket: 1, why: 'Plaque left on overnight has hours to work, with little saliva to oppose it.' },
      ],
      explain: `
        Brushing and cleaning between the teeth clear the **plaque**, **sugar** does least harm at mealtimes, and **fluoride** tips the balance back towards repair.

        The same plaque, left along the gum line, inflames the gums. Gums that bleed when brushed are an early sign of gum disease, and a reason to see a dentist.
      `,
    },
    {
      id: 'teach-uv',
      type: 'info',
      title: 'The UV index',
      text: `
        Sunlight carries invisible **ultraviolet (UV)** rays, which damage the DNA of skin cells. Weather services report their strength as the **UV index**, and the World Health Organization's scale says what each level calls for.

        | UV index | What it calls for |
        |---|---|
        | ${uvRange('none')} | ${UV_NEED.none} |
        | ${uvRange('protect')} | ${UV_NEED.protect} |
        | ${uvRange('extra')} | ${UV_NEED.extra} |

        The index depends on the height of the sun, not on how warm it feels. It can be high on a cool, breezy day, in thin cloud, or on snow.
      `,
      figure: uvScale(null),
    },
    {
      id: 'uv-index',
      type: 'choice',
      review: true,
      title: 'Reading the UV index',
      shuffle: false,
      gen: (rng) => {
        const [index, scene] = rng.pick(UV_SCENES);
        const band = uvBand(index);
        return {
          text: `
            Sunlight carries invisible **ultraviolet (UV)** rays, which damage the DNA of skin cells. Weather services report their strength as the **UV index**.

            The forecast for ${scene} gives a UV index of **${index}**. **What does the World Health Organization's scale call for?**
          `,
          figure: uvScale(index),
          columns: 1,
          options: ['none', 'protect', 'extra'].map((need) => ({ text: UV_NEED[need], correct: need === band.need })),
          hints: [`Protection starts at ${UV_PROTECT_FROM}. Extra protection starts at 8.`],
          explain: `
            ${index} is in the **${band.name}** band. ${band.need === 'none' ? `Below ${UV_PROTECT_FROM}, most people need no protection.` : band.need === 'protect' ? `From ${UV_PROTECT_FROM} upwards the skin needs protecting: shade when the sun is highest, clothing and a hat first, and sunscreen on what is left uncovered.` : 'From 8 upwards unprotected skin can burn in minutes, and the advice is to keep out of the midday sun altogether.'}

            The index depends on the height of the sun, not on how warm it feels: it can be high on a cool, breezy day, in thin cloud, or on snow.
          `,
        };
      },
    },
    {
      id: 'teach-sun',
      type: 'info',
      title: 'What the sun does to skin',
      text: `
        UV damage adds up over a lifetime: sunburn, wrinkles and, years later, skin cancer. Four facts that surprise people:

        - **Cloud is no shield.** Thin cloud lets most UV through.
        - **Darker skin is not immune.** Melanin, its pigment, absorbs UV and lowers the risk, but does not remove it.
        - **A tan is damage.** It gives roughly the protection of a factor 3 sunscreen, and it is itself a sign that DNA has been damaged.
        - **Sunscreen is the back-up.** No sunscreen blocks everything, and most people put on far less than the tests use. Shade and clothing come first.
      `,
    },
    {
      id: 'sun-facts',
      type: 'multi',
      title: 'Sun sense',
      text: 'UV damage adds up over a lifetime: sunburn, wrinkles and, years later, skin cancer. **Which of these statements are true?** Choose all that apply.',
      columns: 1,
      options: [
        { text: 'You can burn on a cloudy day', correct: true },
        { text: 'People with dark skin can get skin cancer too', correct: true },
        { text: 'Sunburns in childhood raise the risk of skin cancer decades later', correct: true },
        { text: 'A tan protects the skin about as well as a good sunscreen', why: 'A tan gives roughly the protection of a factor 3 sunscreen, and it is itself a sign that DNA has been damaged.' },
        { text: 'Sunscreen with a high factor means you can stay out all day', why: 'No sunscreen blocks everything, and most people put on far less than the tests use. It is the back-up for shade and clothing, not a replacement.' },
      ],
      explain: `
        Cloud, darker skin and a tan all leave the skin open to damage, and damage done early in life is still there decades later. Skin cancers in darker skin are often found late.

        The sun is not an enemy: skin makes **vitamin D** in sunlight. A short spell outdoors with some skin uncovered is enough for most people in summer. In winter far from the equator it may not be, and advice on supplements differs between countries.
      `,
    },
    {
      id: 'moles',
      type: 'choice',
      tone: 'sober',
      title: 'Knowing your own skin',
      text: `
        Most moles are harmless and stay the same for years. Skin cancers caught early are among the most curable of all cancers, so it pays to notice change.

        **Which of these most deserves to be shown to a doctor soon?**
      `,
      columns: 1,
      options: [
        { text: 'A mole that has changed its shape and colour over the last two months', correct: true },
        { text: 'A small, round, evenly brown mole that has looked the same for ten years', why: 'Symmetrical, one colour, unchanging: this is what an ordinary mole looks like.' },
        { text: 'Several small moles on one arm that all look alike', why: 'Moles that resemble one another are usually fine. The one to notice is the one that looks different from the rest, or changes.' },
        { text: 'Freckles that get darker every summer and fade every winter', why: 'Freckles respond to sunlight and fade again. That is their normal behaviour.' },
      ],
      explain: `
        **Change** is the most important sign. Doctors teach an "ABCDE" checklist for moles:

        - **A**symmetry: the two halves do not match
        - **B**order: ragged or blurred edges
        - **C**olour: uneven, with several shades
        - **D**iameter: wider than about 6 mm
        - **E**volving: changing in size, shape or colour

        None of these proves anything by itself. Each is a reason to have a mole looked at, and so is a sore that does not heal.
      `,
    },
    {
      id: 'teach-eyes',
      type: 'info',
      title: 'Eyes and daylight',
      text: `
        Short-sightedness is rising fast among children across the world. In a short-sighted eye the eyeball has grown slightly too long, and it does not shrink back.

        One habit has been put to the test. In a trial in Chinese primary schools, some schools added ${MYOPIA_TRIAL.minutes} minutes outdoors to every school day. Over ${MYOPIA_TRIAL.years} years, about ${MYOPIA_TRIAL.outdoors} in 100 of their children became short-sighted, against about ${MYOPIA_TRIAL.usual} in 100 in the other schools.

        Bright daylight seems to slow the lengthening of the growing eye.
      `,
      figure: {
        type: 'bars', yMax: 50, yStep: 10, yLabel: 'per 100 children',
        data: [
          { label: 'usual school day', value: MYOPIA_TRIAL.usual, color: 'gray' },
          { label: `${MYOPIA_TRIAL.minutes} minutes more outdoors`, value: MYOPIA_TRIAL.outdoors, color: 'green' },
        ],
        alt: `A bar chart of children who became short-sighted over ${MYOPIA_TRIAL.years} years: about ${MYOPIA_TRIAL.usual} in 100 in schools with the usual day, and about ${MYOPIA_TRIAL.outdoors} in 100 in schools with ${MYOPIA_TRIAL.minutes} extra minutes outdoors.`,
      },
    },
    {
      id: 'eyes',
      type: 'choice',
      title: 'Eyes',
      text: `
        In a short-sighted eye the eyeball has grown slightly too long, and it does not shrink back. People recommend all sorts of habits for children's eyes.

        **Which habit has the best evidence for protecting children against short-sightedness?**
      `,
      columns: 1,
      options: [
        { text: 'Spending more time outdoors in daylight', correct: true },
        { text: 'Eating plenty of carrots', why: 'Carrots supply vitamin A, and a lack of it does harm sight. But extra vitamin A does nothing for an eye that already has enough, and nothing for short-sightedness.' },
        { text: 'Never reading in dim light', why: 'Reading in poor light is tiring, and the eyes feel strained, but it has not been shown to damage them.' },
        { text: 'Doing eye exercises every day', why: 'Exercises do not change the length of the eyeball, which is what makes an eye short-sighted.' },
      ],
      explain: `
        Time outdoors is the one with a trial behind it: ${MYOPIA_TRIAL.minutes} extra minutes a day cut new cases from about ${MYOPIA_TRIAL.usual} to about ${MYOPIA_TRIAL.outdoors} in 100. The other three are often said, and none has been shown to prevent short-sightedness.

        For screens, the "20-20-20" habit (every 20 minutes, look 20 feet away, about 6 metres, for 20 seconds) is sensible for tired eyes, though the evidence for it is thin. Regular eye tests matter more: they catch conditions such as glaucoma before any sight is lost.
      `,
    },
    {
      id: 'loud',
      type: 'interact',
      attempts: 6,
      title: 'How loud, for how long?',
      text: `
        Deep in each inner ear, about 15,000 **hair cells** turn sound into nerve signals. Loud sound wears them out, and they are never replaced.

        Loudness is measured in **decibels (dB)**. A widely used workplace limit is ${NOISE.refDb} dB, about as loud as heavy traffic, for ${NOISE.refHours} hours a day. **Raise the level until the safe time is only 15 minutes.**
      `,
      widget: {
        type: 'plot', height: 300, x: [82, 106], y: [0, 17], xStep: 3, yStep: 4, xLabel: 'loudness (dB)', yLabel: 'safe hours a day',
        params: { L: { min: 82, max: 106, step: 3, value: 85, label: 'loudness (dB)', color: 'orange' } },
        fns: [{ expr: '8/2^((x-85)/3)', color: 'blue' }],
        points: [{ id: 'P', x: 'L', on: 0, color: 'orange' }],
        readouts: [{ label: 'safe time (minutes a day)', expr: '480/2^((L-85)/3)', digits: 1 }],
        alt: 'A curve of safe listening time against loudness. It falls from 16 hours a day at 82 decibels to 8 hours at 85, 4 hours at 88 and 2 hours at 91, halving with every 3 decibels, down to a few minutes at 106. A slider moves a point along it.',
      },
      check: (s) => {
        if (s.L === 100) return true;
        const mins = safeMinutes(s.L);
        return `At ${s.L} dB the safe time is ${duration(mins)}. ${mins > 15 ? 'Go louder.' : 'That is past it: come back down.'}`;
      },
      solution: { L: 100 },
      hints: ['Each step of the slider adds 3 dB. Watch what one step does to the safe time.'],
      explain: `
        At **100 dB**, the level of a loud concert or of headphones turned right up, the day's allowance is gone in 15 minutes. Every step of the slider halved the safe time.
      `,
    },
    {
      id: 'teach-decibels',
      type: 'info',
      title: 'Three decibels, half the time',
      text: `
        Every **${NOISE.exchangeDb} dB** more **halves** the safe time: ${NOISE.refHours} hours, 4, 2, 1, half an hour, 15 minutes. Decibels are not like centimetres: ${NOISE.exchangeDb} dB more means twice the sound energy reaching the hair cells.

        :::example Worked example: how long is 106 dB safe?
        1. How far above ${NOISE.refDb} dB is it? 106 − ${NOISE.refDb} = 21 dB.
        2. How many steps of ${NOISE.exchangeDb} dB is that? 21 ÷ ${NOISE.exchangeDb} = 7 steps.
        3. Halve ${NOISE.refHours} hours, which is ${NOISE.refHours * 60} minutes, seven times: 240, 120, 60, 30, 15, 7.5, **3.75 minutes**.
        :::

        Counting the steps first is the whole method. Taking an hour off for each step would be a different, and wrong, rule.
      `,
    },
    {
      id: 'listen-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const db = rng.pick([88, 91, 94, 97, 100, 103]);
        const steps = (db - NOISE.refDb) / NOISE.exchangeDb;
        const answer = safeMinutes(db);
        const where = rng.pick(SOUNDS);
        return {
          text: `
            A common rule for protecting hearing: **${NOISE.refDb} dB** is safe for **${NOISE.refHours} hours** a day, and every **${NOISE.exchangeDb} dB** more halves the time.

            A phone app measures **${db} dB** at ${where}. **For how many minutes a day is that level safe?**
          `,
          answer,
          unit: 'minutes',
          wrong: [
            [NOISE.refHours * 60 - steps * 60, `That takes an hour off for each ${NOISE.exchangeDb} dB. The rule is to **halve** the time, ${steps === 1 ? 'once' : `${steps} times over`}.`],
            ...(steps > 1 ? [[(NOISE.refHours * 60) / steps, `${db} dB is ${steps} steps of ${NOISE.exchangeDb} dB above ${NOISE.refDb}. Halve the time once for each step: that divides it by $2^{${steps}} = ${2 ** steps}$, not by ${steps}.`]] : []),
            [answer / 60, 'That is the time in hours. The question asks for minutes.'],
          ],
          hints: [
            `${db} dB is ${db - NOISE.refDb} dB above ${NOISE.refDb} dB: ${steps} step${steps === 1 ? '' : 's'} of ${NOISE.exchangeDb} dB.`,
            `Start from ${NOISE.refHours} hours, which is ${NOISE.refHours * 60} minutes, and halve it ${steps === 1 ? 'once' : `${steps} times`}.`,
          ],
          explain: r`${db} dB is ${steps} step${steps === 1 ? '' : 's'} of ${NOISE.exchangeDb} dB above ${NOISE.refDb}, so the ${NOISE.refHours * 60} minutes are halved ${steps === 1 ? 'once' : `${steps} times`}: $${NOISE.refHours * 60} \div ${2 ** steps} = ${num(answer)}$ minutes. For leisure listening the World Health Organization's advice is stricter still: ${NOISE.whoDb} dB for ${NOISE.whoHoursPerWeek} hours a week. Ringing ears or muffled hearing after noise are a warning that hair cells have been overworked.`,
        };
      },
    },
    {
      id: 'belts',
      type: 'slider',
      mode: 'predict',
      tone: 'sober',
      title: 'The plainest prevention of all',
      text: `
        One more part that does not grow back: the brain. The simplest protection ever invented for it is a strap of webbing.

        **By about how much does wearing a seat belt cut the risk of dying in a crash, for someone in the front of a car?**
      `,
      min: 0, max: 100, step: 5, answer: 50, tolerance: 5, start: 0, unit: '%',
      explain: `
        By **${ROAD.beltLow} to ${ROAD.beltHigh}%**: close to half. Few things in medicine do as much for so little effort.

        Helmets do the same job on two wheels. For motorcyclists, a helmet cuts the risk of death by about ${ROAD.helmetDeath}% and of head injury by about ${ROAD.helmetHead}%.
      `,
    },
    {
      id: 'grows-back',
      type: 'bucket',
      review: true,
      title: 'What the body can replace',
      text: 'The body repairs a great deal: skin renews itself all the time, bone is living tissue that knits itself together, and the bone marrow replaces lost blood cells. That makes the exceptions worth knowing. **Which of these can it replace or rebuild?**',
      buckets: ['Grows back', 'Gone for good'],
      items: [
        { text: 'Skin after a graze', bucket: 0, why: 'Skin renews itself all the time, and a shallow wound heals within days.' },
        { text: 'A broken bone', bucket: 0, why: 'Bone is living tissue that knits itself together over weeks.' },
        { text: 'Blood given by a donor', bucket: 0, why: 'The bone marrow replaces donated red cells within a few weeks.' },
        { text: 'Tooth enamel lost to a cavity', bucket: 1, why: 'No living cells remain in enamel to rebuild it. A dentist can fill a cavity, but the enamel is gone.' },
        { text: 'Hair cells of the inner ear', bucket: 1, why: 'In humans, hair cells destroyed by noise are not replaced, so the hearing loss is permanent.' },
        { text: 'An adult tooth', bucket: 1, why: 'There is no third set.' },
      ],
      explain: `
        Skin, bone and blood renew themselves. Enamel, the hair cells of the ear and adult teeth do not, and neither does an eyeball that has grown too long.

        That is why the habits in this lesson are small and daily. They protect the parts that cannot be repaired afterwards.
      `,
    },
    {
      id: 'try-it',
      type: 'info',
      title: 'Something to try this week',
      text: `
        Two things that take a minute each, if you would like to try them:

        - Look up **today's UV index** where you live. Most weather apps and websites show it.
        - If you use headphones, find the **volume or hearing setting** on your phone. Many phones can show how loud you have been listening, and can cap the level.

        :::tip
        A rough test with no app: if you have to raise your voice to talk to someone an arm's length away, the place is loud enough to harm hearing over time.
        :::
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    `Plaque bacteria turn sugar into acid, and below about pH ${TEETH.criticalPh} the acid dissolves enamel. How **often** you have sugar matters as well as how much: keep it to mealtimes, and brush twice a day with fluoride toothpaste.`,
    `From a **UV index of ${UV_PROTECT_FROM}**, skin needs protection: shade, clothing, a hat, sunscreen. A mole that changes deserves a doctor's look.`,
    `Hair cells in the ear do not regrow. ${NOISE.refDb} dB is safe for ${NOISE.refHours} hours a day, and every ${NOISE.exchangeDb} dB more halves the time.`,
    'Daylight outdoors protects children\'s eyes; seat belts and helmets protect the brain. Small habits guard the parts that cannot be replaced.',
  ],
  next: 'Next: a handful of numbers, measured in minutes, that predict the diseases most people will meet.',
};
