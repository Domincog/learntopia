// The Body I: Fuel, Air and Blood · Lesson 7 · Keeping the Balance
//
// Driving question: the world outside keeps changing. How does the body keep the world inside so steady?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-systems/index.js';
import { BALANCE, TEMP_RESPONSES, ADH_LOOP, STEADY, PEOPLE, grouped, say } from '../helpers.js';

const LOOP_ALT = 'A graph of core body temperature over one hour after a person steps out into the cold, with the healthy range from 36.5 to 37.5 degrees marked. Sliders set how strongly the body responds and how long the response takes to act.';
const WATER_ALT = 'Two bars for one day: water coming in (drinks and food, and water made by the cells) and water going out (breath, skin and stool; sweat; urine). Above them, how much the kidneys filter and take back, the level of the hormone ADH and the colour of the urine. Sliders set the water taken in and the sweat lost.';

const LOOP_FIGURE = {
  type: 'svg', viewBox: '0 0 560 216', maxWidth: 560,
  content: [
    '<g class="stroke-ink" stroke-width="2.5">',
    '<rect class="fill-yellow-soft" x="190" y="6" width="180" height="46" rx="12"/>',
    '<rect class="fill-blue-soft" x="376" y="86" width="176" height="46" rx="12"/>',
    '<rect class="fill-green-soft" x="190" y="164" width="180" height="46" rx="12"/>',
    '<rect class="fill-pink-soft" x="8" y="86" width="176" height="46" rx="12"/>',
    '</g>',
    '<g class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M374 30 Q452 34 462 80"/><path d="M452 70 L462 82 L472 70"/>',
    '<path d="M462 138 Q452 184 376 188"/><path d="M388 179 L374 188 L388 197"/>',
    '<path d="M186 188 Q108 184 98 138"/><path d="M88 150 L98 136 L108 150"/>',
    '<path d="M98 80 Q108 34 184 30"/><path d="M172 21 L186 30 L172 39"/>',
    '</g>',
    '<text class="fig-label" x="280" y="26" text-anchor="middle">1. Something changes</text>',
    '<text class="fig-label-sm" x="280" y="43" text-anchor="middle">core temperature drops</text>',
    '<text class="fig-label" x="464" y="106" text-anchor="middle">2. Sensors notice</text>',
    '<text class="fig-label-sm" x="464" y="123" text-anchor="middle">in the skin and the brain</text>',
    '<text class="fig-label" x="280" y="184" text-anchor="middle">3. Control centre</text>',
    '<text class="fig-label-sm" x="280" y="201" text-anchor="middle">compares with the set point</text>',
    '<text class="fig-label" x="96" y="106" text-anchor="middle">4. Effectors act</text>',
    '<text class="fig-label-sm" x="96" y="123" text-anchor="middle">shivering pushes it back</text>',
    '<text class="fig-label-sm text-muted" x="280" y="112" text-anchor="middle">the response opposes the change</text>',
  ].join(''),
  alt: 'A loop of four boxes joined by arrows. One: something changes (core temperature drops). Two: sensors in the skin and the brain notice. Three: a control centre compares with the set point. Four: effectors act (shivering pushes the temperature back), which leads round to box one again.',
};

export default {
  id: 'kidneys-balance',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Winter and summer',
      text: `
        One person spends an hour outdoors on a winter day at **−10 °C**, well wrapped up,
        and another hour on a summer day at **+35 °C**. The air around them differs by 45 degrees.

        **By how much does the temperature deep inside their body differ?**
      `,
      shuffle: false,
      options: [
        { text: 'By less than 1 °C', correct: true },
        { text: 'By about 5 °C' },
        { text: 'By about 15 °C' },
        { text: 'By the full 45 °C' },
      ],
      explain: `
        **By less than a degree.** A healthy body holds its core at about ${BALANCE.coreTemp[0]} to ${BALANCE.coreTemp[1]} °C
        whatever the weather. If cold or heat pushes it a few degrees either way, that is a
        medical emergency.

        And temperature is only one of many things it holds this still. **How does the body
        keep its inside so steady, when the outside never is?**
      `,
    },
    {
      id: 'thermostat-explore',
      type: 'interact',
      graded: false,
      title: 'Out into the cold',
      text: `
        Someone steps out into the cold, and their body starts to lose heat faster than it
        makes it. The body can push back by **shivering**, which makes heat.

        **Press Run with no response at all.** Then try a weak, a medium and a strong
        response, and compare the curves. (The cooling is speeded up, so that an hour is enough.)
      `,
      widget: { type: 'feedback-loop', scenario: 'cold', gain: 0, delay: 0, controls: ['gain'], alt: LOOP_ALT },
      check: (s) => {
        const gains = new Set(s.tried.map((t) => t.gain));
        if (gains.has(0) && gains.size >= 3) return true;
        if (!s.runs) return 'Press **Run** to see what happens with no response.';
        if (!gains.has(0)) return 'Also run it once with the response set to "none", to see what the response is for.';
        return `You have run ${gains.size} of the 4 strengths. Try another, then press Run.`;
      },
      solution: { gain: 2, delay: 0, tried: [{ gain: 0, delay: 0 }, { gain: 1, delay: 0 }] },
      explain: `
        With no response the temperature just keeps falling. With a response that **grows as
        the temperature falls**, the fall slows and stops: the further from 37 °C, the harder the
        body pushes back.

        Notice that in this model it never quite returns to 37 °C. A small error has to remain,
        to keep the response switched on.
      `,
    },
    {
      id: 'loop',
      type: 'info',
      title: 'Negative feedback',
      text: `
        What you just ran is the most important control trick in the body.
        A change is **sensed**, a **control centre** compares it with a **set point**, and
        **effectors** push the other way. The result is fed back to the sensors, so the loop
        corrects itself.

        Because the response always *opposes* the change, it is called **negative feedback**.
        Keeping the inside of the body steady in this way is called **homeostasis**.

        For temperature the control centre is the **hypothalamus**, a small region at the base
        of the brain. A room thermostat works on the same plan.
      `,
      figure: LOOP_FIGURE,
    },
    {
      id: 'tune',
      type: 'interact',
      title: 'More is not always better',
      text: `
        Real responses take time: a signal has to travel, and muscles have to warm up. In this
        run the response acts **5 minutes late**.

        **Choose the strength that keeps the temperature inside the healthy range and lets it
        settle.**
      `,
      widget: { type: 'feedback-loop', scenario: 'cold', gain: 1, delay: 5, controls: ['gain'], alt: LOOP_ALT },
      check: (s) => {
        if (!s.ran) return 'Press **Run** to try this strength.';
        if (s.inRange && s.settled) return true;
        if (s.gain === 0) return `With no response the temperature drifts down to ${s.final} °C.`;
        if (!s.inRange) return `It levels off at ${s.final} °C, below the healthy range. This response is too weak.`;
        return `It stays in range but keeps swinging, between ${s.lowest} and ${s.highest} °C. Acting on news that is 5 minutes old, a response this strong overshoots every time.`;
      },
      solution: { gain: 2 },
      hints: ['Too weak, and the temperature settles outside the range. What goes wrong when it is too strong?'],
      explain: `
        The **medium** response. The weak one settles too low. The strong one overshoots,
        because it is reacting to where the temperature *was* five minutes ago, and so it swings
        back and forth.

        You know this from a shower with a slow tap: turn it too far, wait, too hot, turn it
        back too far. Feedback loops in the body are tuned to their own delays.
      `,
    },
    {
      id: 'teach-effectors',
      type: 'info',
      title: 'What the thermostat can do',
      text: [
        'The hypothalamus has several effectors to call on, and most of them are in the skin.',
        '',
        ...['Body too hot', 'Body too cold'].map((state, k) => `- **${state}**: ${TEMP_RESPONSES.filter((r) => r.kind === k).map((r) => r.text.charAt(0).toLowerCase() + r.text.slice(1)).join('; ')}.`),
        '',
        'Sweat cools the skin as it evaporates. Wider skin vessels bring warm blood to the surface, where its heat can escape, and narrower ones keep it in. Shivering is muscle working for the sake of its by-product, heat. Goosebumps trap a layer of air in furry animals. In humans they are a leftover with little effect.',
      ].join('\n'),
      figure: {
        type: 'body-map', view: 'skin', labels: ['sweat-gland', 'skin-vessels', 'hair'],
        alt: 'A block of skin cut through, showing its layers. A coiled sweat gland opens onto the surface, small blood vessels run through the inner layer, and a hair grows out of its follicle.',
      },
    },
    {
      id: 'effectors',
      type: 'bucket',
      review: true,
      title: 'The body\'s thermostat at work',
      text: `
        The body's thermostat, the hypothalamus in the brain, has several responses to call
        on, some for a body that is too hot and some for one that is too cold.

        **Sort the responses.**
      `,
      buckets: ['Body too hot', 'Body too cold'],
      items: TEMP_RESPONSES.map((r) => ({ text: r.text, bucket: r.kind, why: r.why })),
      explain: `
        **Too hot:** sweat cools the skin as it evaporates, and widened skin vessels carry heat
        to the surface. **Too cold:** shivering makes heat, and narrowed skin vessels keep it in.
        Behaviour counts too: shade, clothes, a warm drink.

        In a **fever** the set point itself is turned up, usually to help fight an infection.
        That is why someone whose temperature is rising to ${BALANCE.fever + 1} °C feels cold and shivers.
      `,
    },
    {
      id: 'head-myth',
      type: 'choice',
      title: 'Hats and heads',
      text: `
        "You lose most of your body heat through your head, so always wear a hat."

        The saying is usually traced to US military trials in the 1950s. Volunteers in the
        cold wore warm suits that left only the head bare, and most of the heat they lost
        left through the head. The head is about a tenth of the body's surface.

        **Is the first half of the saying true?**
      `,
      options: [
        { text: 'No: the head loses about a tenth of the heat, in line with its share of the skin', correct: true },
        { text: 'Yes: the head has far more blood vessels than the rest of the body', why: 'The scalp has a good blood supply, but measurements show that the head loses heat roughly in proportion to its area, like any other bare skin.' },
        { text: 'Yes: heat rises, so it leaves through the top of the body', why: 'Warm air rises. Heat leaving a body does not travel up through it to the top.' },
      ],
      explain: `
        In those trials the head was the only bare skin, so of course most of the heat left
        there. Measured fairly, the head loses about a tenth of the body's heat, like any
        other tenth of the skin.

        A hat is still a good idea in the cold. So is covering any other bare skin.
      `,
    },
    {
      id: 'teach-kidneys',
      type: 'info',
      title: 'The chief chemists',
      text: `
        Temperature is one thing held steady. The make-up of the blood is another, and
        that is the work of the **kidneys**. They sit high at the back of the abdomen, one
        on each side of the spine, partly tucked under the lowest ribs. (The figure is
        seen **from behind**.)

        Each kidney holds about a million tiny units, and each unit works in two steps.

        1. A **filter**, a knot of capillaries, lets water and small molecules through and
           holds back blood cells and proteins.
        2. A long, fine tube **takes back** what the body wants to keep: nearly all the
           water, the sugar and most of the salt.

        What is left is urine. By taking back a little more or a little less, the kidneys
        hold the body's water and salt steady.
      `,
      figure: {
        type: 'body-map', view: 'back-torso', show: ['spine', 'ribs', 'pelvis', 'kidneys'], labels: ['kidneys', 'ribs', { id: 'thoracic-spine', text: 'Spine' }],
        alt: 'The trunk seen from behind, with the spine, the ribs and the pelvis. The two kidneys lie high in the back of the abdomen, one on each side of the spine, partly covered by the lowest ribs.',
      },
    },
    {
      id: 'kidney-where',
      type: 'interact',
      title: 'Higher than you think',
      text: `
        Here is the trunk **from behind** again, this time without the kidneys.

        **Put the marker where one of the kidneys is.** Within 4 cm counts.
      `,
      widget: {
        type: 'body-map', view: 'back-torso', mode: 'place', show: ['spine', 'ribs', 'pelvis'],
        pin: { label: 'Kidney', color: 'violet' },
        targets: [{ id: 'left', at: 'left-kidney', label: 'the left kidney' }, { id: 'right', at: 'right-kidney', label: 'the right kidney' }],
        alt: 'The trunk seen from behind, with the spine, the ribs and the pelvis. A marker can be moved to any place on it.',
      },
      check: (s) => {
        if (!s.placed) return 'Move the marker first.';
        if (s.distance <= 4) return true;
        return `That is about ${Math.round(s.distance)} cm from the nearest kidney. The kidneys lie higher than most people expect: on either side of the spine, partly tucked under the lowest ribs.`;
      },
      solution: { at: 'left-kidney' },
      hints: ['They are not down in the pelvis. Look on either side of the spine, at the level of the lowest ribs.'],
      explain: `
        The kidneys sit **high at the back of the abdomen**, one on each side of the spine,
        partly shielded by the lowest ribs. Each is about the size of a fist, and together they
        receive about a fifth of all the blood the heart pumps.
      `,
    },
    {
      id: 'filter-day',
      type: 'numeric',
      gen: (rng) => {
        const rate = rng.pick([100, 110, 120, 125]);
        const answer = (rate * 1440) / 1000;
        const [name, their] = rng.pick(PEOPLE);
        return {
          text: `
            The filters of the kidneys let water and small molecules through, and hold back
            blood cells and proteins.

            ${name}'s kidneys filter **${rate} mL** of fluid out of ${their} blood every minute.
            **How many litres is that in a day?** (A day has 1,440 minutes. At 10 mL a minute it
            would be 10 × 1,440 = 14,400 mL, which is 14.4 litres.)
          `,
          answer,
          unit: 'litres',
          wrong: [
            [rate * 1440, 'That is the answer in millilitres. Divide by 1,000 for litres.'],
            [(rate * 60) / 1000, 'That is the amount filtered in one hour. A day has 1,440 minutes.'],
          ],
          hints: [`${rate} mL × 1,440 minutes = ${grouped(rate * 1440)} mL.`, 'Divide the millilitres by 1,000 to get litres.'],
          explain: `
            ${rate} × 1,440 = ${grouped(rate * 1440)} mL, which is **${say(answer)} litres a day** (typical values run from about
            130 to ${BALANCE.filterPerDay} litres, and fall with age). Yet the blood holds only about ${BALANCE.plasma} litres of
            liquid. The kidneys filter all of it dozens of times a day.

            Nobody passes that much urine, so nearly all of it must be taken back.
          `,
        };
      },
    },
    {
      id: 'water',
      type: 'interact',
      title: 'Balancing the books',
      text: `
        Nearly all the filtered water is **taken back**, and what is left is urine. By
        taking back a little more or a little less, the kidneys balance the day's water.

        Make it a hot working day: **set the sweat to 2 litres. Then find the smallest
        "water in" at which the body does not run short.**
      `,
      widget: { type: 'water-balance', intake: 2.5, sweat: 0.2, alt: WATER_ALT },
      check: (s) => {
        if (s.sweat !== 2) return 'First set the sweat to 2.0 litres.';
        if (!s.balanced) return `With ${s.intake.toFixed(1)} litres coming in, the body is short by ${s.short.toFixed(1)} litres a day, although the kidneys have already cut the urine to the least they can make.`;
        if (s.intake > 3.5) return `That balances, with ${s.urine.toFixed(1)} litres of urine to spare. Find the smallest amount that still balances.`;
        return true;
      },
      solution: { sweat: 2, intake: 3.5 },
      hints: ['Watch the urine. The kidneys cannot make less than about half a litre a day.'],
      explain: `
        At **3.5 litres** the books just balance: the kidneys make less than a litre of dark,
        concentrated urine and take back about 99.5% of what they filter. Below that, even
        the minimum of urine is more than the body can afford.

        This is a model of what kidneys do, not a guide to how much to drink: needs differ
        widely, and for most healthy people **thirst** is a reliable signal.
      `,
    },
    {
      id: 'adh',
      type: 'order',
      review: true,
      title: 'The water loop',
      text: `
        The kidneys do not decide by themselves how much water to take back. They take
        their orders from a feedback loop. Its messenger is a hormone, **ADH**, which
        tells the kidneys to take back more water.

        **Put the loop in order.**
      `,
      items: ADH_LOOP,
      labels: ['The change', 'The correction'],
      explain: `
        Sensors in the hypothalamus notice that the blood is getting more concentrated. They
        make you **thirsty**, and they have the pituitary gland just beneath them release
        **ADH**, a hormone that tells the kidneys to take back more water.

        Drink a lot, and the loop runs the other way: less ADH, and more, paler urine.
      `,
    },
    {
      id: 'taken-back',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const filtered = rng.pick([150, 160, 170, 180]);
        const urine = rng.pick([1, 1.5, 2]);
        const answer = filtered - urine;
        return {
          text: `
            In one day a person's kidneys filter **${filtered} litres** of fluid out of the blood and
            produce **${say(urine)} ${urine === 1 ? 'litre' : 'litres'}** of urine.

            **How many litres did the kidneys take back into the blood?**
          `,
          answer,
          unit: 'litres',
          wrong: [
            [filtered + urine, 'The urine is the part that was *not* taken back: subtract it from what was filtered.'],
            [urine, 'That is the urine: the part that left the body. The question asks for the part that was taken back.'],
          ],
          hints: ['What is filtered either leaves as urine or is taken back.'],
          explain: `
            ${filtered} − ${say(urine)} = **${say(answer)} litres** taken back: about ${say((answer / filtered) * 100, 1)}% of what was filtered.
            Filtering everything and then taking back what is wanted lets the kidneys get rid of
            wastes, and of substances the body has never met before, without needing a special pump for each.
          `,
        };
      },
    },
    {
      id: 'steady',
      type: 'match',
      review: true,
      title: 'One idea, many loops',
      text: `
        Temperature and water are two examples. The body runs dozens of such loops, and
        you have met several in this course. Blood sugar is one more: it is held by two
        hormones from the pancreas, insulin and glucagon.

        **Match each thing that is held steady to what adjusts it.**
      `,
      pairs: STEADY,
      explain: `
        Every one is a negative feedback loop: a sensor, a set point and an effector that
        pushes back. The kidneys also hold **salt** and **potassium** steady by changing how much
        leaves in the urine, and **blood sugar** is held by two hormones from the pancreas (a
        story for *The Body II*).
      `,
    },
    {
      id: 'dialysis',
      type: 'choice',
      tone: 'sober',
      title: 'Standing in for a kidney',
      text: `
        When both kidneys fail, a person can be kept alive by a machine like this one.
        Several times a week they sit beside it for some hours, while their blood is led
        through it a little at a time and returned.

        **What must the machine do to stand in for the kidneys?**
      `,
      figure: photo(MEDIA['dialysis-machine'], {
        alt: 'A white machine about as tall as a seated person, with a screen, pumps and coiled tubes on its front, standing beside a padded reclining chair in a tiled room.',
        caption: 'A dialysis machine and the chair used during treatment',
        maxWidth: 460,
      }),
      options: [
        { text: 'Take wastes and spare water out of the blood', correct: true },
        { text: 'Pump the blood round the body', why: 'The person\'s own heart still does that. The machine borrows only a small stream of blood at a time.' },
        { text: 'Add oxygen to the blood', why: 'That is the work of the lungs, which are unaffected.' },
      ],
      explain: `
        In **dialysis** the blood flows along a thin membrane with a cleaning fluid on its
        other side. Wastes cross by diffusion, and gentle pressure draws off spare water. It takes about four hours,
        typically three times a week, and it does only part of what kidneys do. A transplanted
        kidney does all of it.

        A healthy person can give away one kidney and live well, because two kidneys have
        far more capacity than the body needs. The same reserve lets kidney disease advance
        for years without symptoms: it affects at least one adult in ten, and a simple blood or
        urine test finds it.
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        An invitation: your kidneys report on their work several times a day. Pale, straw-coloured
        urine means they have water to spare. Darker yellow means they are saving it, as they
        usually are first thing in the morning.

        It is a rough guide only: some foods, vitamins and medicines change the colour too.
        Red, pink or brown urine with no obvious cause (such as beetroot) should be checked by a
        doctor promptly, even if it happens only once and does not hurt. Passing far more or far
        less than usual for days is worth mentioning too.

        And that completes the circle: fuel, air, blood, and the balance that keeps all thirty
        trillion cells in steady surroundings.
      `,
    },
  ],
  recap: [
    '**Homeostasis** keeps the inside of the body steady. Its main tool is **negative feedback**: a sensor, a set point, and an effector that opposes the change.',
    'Core temperature is held near 37 °C by the hypothalamus through sweating, shivering and blood flow in the skin. In a fever the set point is raised.',
    'The kidneys filter about 180 litres a day and take back about 99%, leaving 1 to 2 litres of urine. The hormone **ADH** tells them how much water to save.',
    'Kidneys have a big reserve: a person can live well with one. The same feedback idea steadies salt, blood sugar and carbon dioxide.',
  ],
  next: 'You have followed fuel, air and blood to every cell. In *The Body II: Control, Defence and Movement*, meet the systems that run the show: nerves, hormones, immunity, muscle and bone.',
};
