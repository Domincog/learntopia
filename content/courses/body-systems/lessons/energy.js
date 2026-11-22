// The Body I: Fuel, Air and Blood · Lesson 6 · Burning Fuel
//
// Driving question: the fuel has reached your cells, and so has the oxygen. What do the cells do with
// them, and where does the stuff of the fuel go?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-systems/index.js';
import { ENERGY, ORGAN_SHARES, LABEL_ENERGY, LABEL_FOODS, OXYGEN_FACTS, PEOPLE, grouped } from '../helpers.js';

const FUEL_ALT = 'A bar divided into four supply routes for muscle energy: the ready store, sugar without oxygen, sugar with oxygen and fat with oxygen. Two gauges show how much of the body\'s sugar store and fat store is left. Sliders set the effort, from rest to an all-out sprint, and the time since the start, from five seconds to three hours.';

// What goes into a cell and what comes out of it: the reaction of respiration as a picture.
const RESPIRATION = {
  type: 'svg', viewBox: '0 0 340 262', maxWidth: 440,
  content: [
    '<g class="stroke-ink" stroke-width="2.5">',
    '<rect class="fill-orange-soft" x="8" y="8" width="152" height="52" rx="12"/>',
    '<rect class="fill-red-soft" x="180" y="8" width="152" height="52" rx="12"/>',
    '<rect class="fill-yellow-soft" x="60" y="104" width="220" height="56" rx="14"/>',
    '<rect class="fill-blue-soft" x="8" y="204" width="152" height="52" rx="12"/>',
    '<rect class="fill-teal-soft" x="180" y="204" width="152" height="52" rx="12"/>',
    '</g>',
    '<g class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M84 64 L122 98 M108 96 L123 99 L120 84"/>',
    '<path d="M256 64 L218 98 M220 84 L217 99 L232 96"/>',
    '<path d="M122 164 L84 198 M86 184 L83 199 L98 196"/>',
    '<path d="M218 164 L256 198 M242 196 L257 199 L254 184"/>',
    '</g>',
    '<text class="fig-label" x="84" y="30" text-anchor="middle">Sugar</text>',
    '<text class="fig-label" x="84" y="49" text-anchor="middle">from the gut</text>',
    '<text class="fig-label" x="256" y="30" text-anchor="middle">Oxygen</text>',
    '<text class="fig-label" x="256" y="49" text-anchor="middle">from the lungs</text>',
    '<text class="fig-label" x="170" y="128" text-anchor="middle">A cell</text>',
    '<text class="fig-label" x="170" y="147" text-anchor="middle">keeps the energy</text>',
    '<text class="fig-label" x="84" y="226" text-anchor="middle">Carbon dioxide</text>',
    '<text class="fig-label" x="84" y="245" text-anchor="middle">breathed out</text>',
    '<text class="fig-label" x="256" y="236" text-anchor="middle">Water</text>',
  ].join(''),
  alt: 'A diagram of respiration. Two boxes at the top, sugar from the gut and oxygen from the lungs, lead by arrows into a box in the middle: a cell, which keeps the energy. From it, arrows lead down to two boxes: carbon dioxide, which is breathed out, and water.',
};

export default {
  id: 'energy',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Where does it go?',
      text: `
        Over some months, a person's body uses up **10 kilograms** of its stored fat. The
        fat is gone, but matter cannot simply vanish.

        **In what form does most of those 10 kilograms leave the body?**
      `,
      options: [
        { text: 'As heat and energy' },
        { text: 'In urine and sweat' },
        { text: 'In the breath, as carbon dioxide', correct: true },
        { text: 'It is turned into muscle' },
      ],
      explain: `
        **In the breath.** Of 10 kg of fat, about ${(ENERGY.fatAsCO2 / 10).toFixed(1)} kg leaves through the lungs as
        carbon dioxide and about ${(ENERGY.fatAsWater / 10).toFixed(1)} kg as water. The sum was published in 2014, and
        most of the doctors who were asked got it wrong.

        Energy is not a substance, so fat cannot "turn into" it. To see where the atoms go,
        look at what a cell does with its fuel.
      `,
    },
    {
      id: 'teach-respiration',
      type: 'info',
      title: 'Burning without a flame',
      text: `
        Blood brings every cell **sugar** from the gut and **oxygen** from the lungs.
        The cell takes the sugar apart with the oxygen, a little at a time, and keeps
        the **energy** that is set free.

        What is left of the sugar's atoms is **carbon dioxide** and **water**. The blood
        carries them away, and the carbon dioxide is breathed out.

        This is **respiration**, and it is why you have lungs and a heart at all. Fat is
        burned in the same way: its carbon atoms leave as carbon dioxide.
      `,
      figure: RESPIRATION,
    },
    {
      id: 'equation',
      type: 'fill',
      review: true,
      title: 'The reaction that runs you',
      text: `
        You already know both ends of it. Blood brings your cells **sugar** from the gut and
        **oxygen** from the lungs, and carries away what you breathe out.

        **Complete the reaction that every cell runs.**
      `,
      template: 'sugar + [[nitrogen|*oxygen|water]] → [[oxygen|lactate|*carbon dioxide]] + water + [[*energy|protein|fat]]',
      explain: `
        **Sugar + oxygen → carbon dioxide + water + energy.** This is **respiration**, and
        it is why you have lungs and a heart at all: to bring in the oxygen and take away the
        carbon dioxide.

        Fat is burned in the same way. Its carbon atoms leave as carbon dioxide: the answer
        to the puzzle of the vanishing fat.
      `,
    },
    {
      id: 'find-mito',
      type: 'interact',
      graded: false,
      title: 'Inside the cell',
      text: `
        Here is one cell, cut open and greatly simplified.

        **Tap its parts and read about them, until you find the ones where fuel is
        burned with oxygen.**
      `,
      widget: {
        type: 'body-map', view: 'cell', mode: 'explore',
        notes: { mitochondria: 'Mitochondria are the cell\'s power stations: here fuel is burned with oxygen, and the energy is used to make ATP.' },
        alt: 'A cell cut open, showing its membrane, its nucleus and several kinds of smaller parts.',
      },
      check: (s) => s.seen.includes('mitochondria') || (s.seenCount ? 'Not found yet. Keep tapping the smaller parts inside the cell.' : 'Tap a part of the cell.'),
      solution: { seen: ['nucleus', 'mitochondria'] },
      explain: `
        The **mitochondria**. A cell that works hard, such as a heart muscle cell, holds
        thousands of them.
      `,
    },
    {
      id: 'teach-atp',
      type: 'info',
      title: 'Energy in small change',
      text: `
        Mitochondria do not hand out energy loose. They use it to charge up a small
        carrier molecule called **ATP**, which every part of the cell accepts, like a
        coin that fits every machine.

        A cell spends an ATP molecule within minutes of making it, and the spent
        molecule goes straight back to a mitochondrion to be recharged.

        So ATP is spending money, not savings. The savings are kept as sugar and fat.
      `,
      figure: {
        type: 'body-map', view: 'cell',
        groups: [{ ids: ['mitochondria'], color: 'orange', label: 'Mitochondria: fuel is burned with oxygen, and ATP is recharged' }],
        labels: ['mitochondria', 'nucleus', 'cell-membrane'],
        alt: 'A cell cut open, with its membrane, its nucleus and several kinds of smaller parts. The mitochondria, small oval bodies scattered through the cell, are highlighted.',
      },
    },
    {
      id: 'mitochondria',
      type: 'choice',
      title: 'The real thing',
      text: `
        Here are two real mitochondria, photographed with an electron microscope. Each is
        about half a thousandth of a millimetre across.

        The machinery that makes ATP sits on the **inner membrane**, which shows as dark lines
        crossing the inside. **Why is that membrane folded back and forth?**
      `,
      figure: photo(MEDIA.mitochondria, {
        alt: 'An electron microscope picture of two oval bodies lying in a grainy background. Each has a dark outer edge, and its inside is crossed by several dark lines running from side to side.',
        caption: 'Mitochondria in a cell from a mammal\'s lung',
        creditLabel: 'Micrograph',
        maxWidth: 480,
      }),
      options: [
        { text: 'Folding packs a much larger working surface into a small space', correct: true },
        { text: 'The folds stir the contents, like paddles', why: 'The folds do not move. They matter because of their area: the ATP-making machinery is built into the membrane itself.' },
        { text: 'The folds are fuel waiting to be burned', why: 'The fuel arrives dissolved, from outside. The folds are the workbench, not the wood.' },
      ],
      explain: `
        More membrane means more room for the machinery, and so more ATP. It is the third
        time this course has met the trick: the air sacs of the lungs, the villi of the gut,
        and now the folds inside a mitochondrion all pack **a large surface into a small space**.
      `,
    },
    {
      id: 'atp',
      type: 'choice',
      title: 'Round and round',
      text: `
        An adult's body holds only about a tenth of a kilogram of ATP at any moment. But
        each molecule is spent and recharged hundreds of times a day.

        **Roughly how much ATP does the body make in one day?**
      `,
      shuffle: false,
      options: [
        { text: 'About a teaspoonful', why: 'That is less than the body holds at one moment, and the whole stock is remade hundreds of times a day.' },
        { text: 'About a cupful', why: 'That is nearer to the amount in the body at one moment. Each molecule is recharged hundreds of times in a day.' },
        { text: 'About 5 kilograms', why: 'A tenth of a kilogram recharged 50 times would make 5 kg. It is recharged hundreds of times.' },
        { text: 'Roughly their own body weight', correct: true },
      ],
      explain: `
        A tenth of a kilogram, recharged hundreds of times, comes to tens of kilograms:
        roughly **their own body weight**, every day. The same small stock of molecules
        goes round and round.
      `,
    },
    {
      id: 'explore-fuel',
      type: 'interact',
      graded: false,
      title: 'Four ways to pay',
      text: `
        Muscles have four ways of keeping their ATP topped up. Which one pays depends on
        how hard you work and for how long.

        **Try at least six different settings**: easy and hard, short and long.
        Watch the bar and the two store gauges.
      `,
      widget: { type: 'fuel-mix', effort: 0, stop: 3, alt: FUEL_ALT },
      check: (s) => s.visited >= 6 || `You have looked at ${s.visited} ${s.visited === 1 ? 'setting' : 'settings'}. Try ${6 - s.visited} more.`,
      solution: { effort: 3, stop: 4, visited: 6 },
      explain: `
        At rest and at easy efforts, **fat** and **sugar** are burned with oxygen. A sudden
        hard effort is too fast for that: first a small **ready store** in the muscle pays,
        then sugar is split **without oxygen**.

        The model shows typical shares. Real ones vary with fitness and with the last meal.
      `,
    },
    {
      id: 'sprint-route',
      type: 'interact',
      title: 'No time for oxygen',
      text: `
        Burning fuel with oxygen yields the most ATP, but oxygen has to be delivered, and
        delivery takes time to speed up.

        **Find a setting at which "sugar without oxygen" is the biggest supplier.**
      `,
      widget: { type: 'fuel-mix', effort: 2, stop: 3, alt: FUEL_ALT },
      check: (s) => {
        if (s.main === 'noOxygen') return true;
        if (!s.sustainable) return 'Nobody can keep this up for so long, so the model shows what the effort falls back to. Try a much shorter time.';
        if (s.effort < 4) return `During ${s.effort === 0 ? 'rest' : `${s.effortName === 'easy walk' ? 'an' : 'a'} ${s.effortName}`} the route without oxygen supplies ${s.mix.noOxygen}% after ${s.time}. It only leads when the demand is far beyond what oxygen can deliver. Raise the effort.`;
        return s.stop === 0
          ? 'Five seconds into a sprint, the ready store is still paying. Wait a little longer.'
          : 'By now oxygen delivery has caught up, and burning sugar with oxygen leads. Look at an earlier moment.';
      },
      solution: { effort: 4, stop: 1 },
      hints: ['It needs a very hard effort.', 'The ready store lasts about ten seconds. What takes over next, before oxygen delivery has caught up?'],
      explain: `
        About **30 seconds into an all-out sprint**. The ready store is spent, the heart and
        lungs have not caught up, and the muscles split sugar without oxygen. It is fast, but
        it yields only ${ENERGY.atpWithoutOxygen} ATP from a sugar molecule that could give about ${ENERGY.atpWithOxygen} with
        oxygen, and it leaves **lactate** behind.
      `,
    },
    {
      id: 'teach-routes',
      type: 'info',
      title: 'Two ways to take sugar apart',
      text: [
        'You have now seen both ways of getting energy out of fuel.',
        '',
        ...['With oxygen', 'Without oxygen'].map((route, k) => `- **${route}**, ${k === 0 ? 'in the mitochondria' : 'in the rest of the cell'}: ${OXYGEN_FACTS.filter((f) => f.kind === k).map((f) => f.text.charAt(0).toLowerCase() + f.text.slice(1)).join('; ')}.`),
        '',
        'With oxygen the fuel is taken apart completely, but oxygen has to be delivered, and delivery takes time to speed up. Without oxygen the sugar is only half taken apart: instant, but wasteful, and only for a minute or so. The half-used sugar is **lactate**.',
      ].join('\n'),
      figure: { type: 'fuel-mix', effort: 4, stop: 1, gauges: false, static: true, alt: 'A bar divided into four supply routes for muscle energy, thirty seconds into an all-out sprint: the ready store is nearly spent, sugar split without oxygen supplies the largest share, and sugar and fat burned with oxygen supply the rest.' },
    },
    {
      id: 'lactate',
      type: 'choice',
      title: 'The lactate story',
      text: `
        **Lactate** (often called lactic acid) has a bad reputation. Here is the evidence.

        - The lactate left from a sugar molecule still holds most of its energy: only ${ENERGY.atpWithoutOxygen} of about ${ENERGY.atpWithOxygen} ATP have been taken out.
        - Within about an hour of hard exercise, the lactate in the blood is back to its resting level.
        - Very little of it is lost in the urine.

        **Which statement fits the evidence?**
      `,
      options: [
        { text: 'It is a fuel: heart and muscles burn it with oxygen within the hour', correct: true },
        { text: 'It stays in the muscles and causes the soreness felt a day or two later', why: 'A long-lived myth. Lactate is cleared within about an hour. Soreness a day or two after unfamiliar exercise comes from tiny strains in the muscle fibres and their repair.' },
        { text: 'It is a poison that the kidneys must remove', why: 'Very little is lost in urine. Lactate is still rich in energy, and the body uses it.' },
      ],
      explain: `
        Lactate is **half-used sugar**, and far too valuable to waste. The heart and resting
        muscles burn it with oxygen, and the liver turns some of it back into sugar. That is
        where it goes within the hour.

        (What does cause next-day soreness is covered in *Movement and Fitness*.)
      `,
    },
    {
      id: 'fat-far',
      type: 'interact',
      title: 'The big store and the fast store',
      text: `
        The body keeps two fuel stores: a small one of sugar, packed as **glycogen** in the
        muscles and the liver, and a large one of **fat**.

        **Find a setting at which someone has been moving for at least an hour and fat
        supplies most of the energy.**
      `,
      widget: { type: 'fuel-mix', effort: 3, stop: 2, alt: FUEL_ALT },
      check: (s) => {
        if (s.seconds < 3600) return 'Move the time to an hour or more.';
        if (s.effort === 0) return 'That is rest. Choose an effort at which the person is moving.';
        if (!s.sustainable) return 'This effort cannot be kept up for so long: the model shows what it falls back to. Choose an effort that can really be held for hours.';
        if (s.main === 'fat') return true;
        return `In ${s.effortName === 'easy walk' ? 'an' : 'a'} ${s.effortName}, sugar still supplies most of the energy after ${s.time}, and only ${s.glycogenLeft}% of the sugar store is left. Ease off.`;
      },
      solution: { effort: 2, stop: 5 },
      hints: ['Fat can only be burned with oxygen, and only at a modest rate.'],
      explain: `
        A walk or a steady jog. **Fat** is a huge store, enough for weeks, but it can only be
        burned slowly. **Glycogen** is fast but small: a hard run can empty it in two to three
        hours, which runners call "hitting the wall".

        So the body burns a mix, and shifts it with the pace. That is ordinary physiology, not
        a recipe: no setting on this model is "better" than another.
      `,
    },
    {
      id: 'aerobic-vs',
      type: 'bucket',
      review: true,
      title: 'With oxygen, or without',
      text: `
        Two ways of getting energy out of fuel: **with oxygen**, in the mitochondria, and
        **without oxygen**, in the rest of the cell.

        **Which does each line describe?**
      `,
      buckets: ['With oxygen', 'Without oxygen'],
      items: OXYGEN_FACTS.map((f) => ({ text: f.text, bucket: f.kind, why: f.why })),
      explain: `
        **With oxygen:** slow to get going, but it takes the fuel apart completely, down to
        carbon dioxide and water, and it can burn fat as well as sugar.
        **Without oxygen:** instant and powerful, but wasteful, sugar only, and only for a minute or so.
      `,
    },
    {
      id: 'bmr-predict',
      type: 'interact',
      mode: 'predict',
      title: 'The cost of doing nothing',
      text: `
        Even lying still, your body uses energy: about as much as an old-fashioned light bulb,
        around ${ENERGY.restingWatts} watts. Most of the energy people use in a day is spent this way.

        **Drag the bars to show what share of that resting energy you think each of these uses.**
      `,
      widget: {
        type: 'bars', adjust: true, step: 5, yMax: 40, yStep: 10, unit: '%', yLabel: 'share of resting energy',
        data: [
          { label: 'Brain', value: 10, color: 'violet' },
          { label: 'Liver', value: 10, color: 'orange' },
          { label: 'Resting\nmuscles', value: 10, color: 'pink' },
          { label: 'Heart', value: 10, color: 'red' },
          { label: 'Kidneys', value: 10, color: 'teal' },
        ],
        alt: 'Five adjustable bars for the share of the body\'s resting energy used by the brain, the liver, the resting muscles, the heart and the kidneys.',
      },
      check: (s) => s.values[0][0] === 20 && s.values[0][1] === 20 && s.values[0][2] === 20 && s.values[0][3] === 10 && s.values[0][4] === 10,
      solution: { values: [[20, 20, 20, 10, 10]] },
      explain: `
        Roughly: **brain 20%, liver 20%, resting muscles 20%, heart 10%, kidneys 10%**, and
        everything else the remaining fifth.

        The brain is about ${ENERGY.brainMassShare}% of the body's weight and takes a fifth of the energy. The heart and the
        kidneys together weigh less than a kilogram and take another fifth. Muscle, about 40% of
        the body, is cheap while it rests.
      `,
    },
    {
      id: 'organ-power',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const o = rng.pick(ORGAN_SHARES);
        const [name, their] = rng.pick(PEOPLE);
        const watts = rng.pick([60, 70, 80, 90, 100]);
        const answer = (watts * o.share) / 100;
        const many = o.organ === 'kidneys' || o.organ === 'resting muscles';
        return {
          text: `
            Lying still, ${name}'s body uses energy at a rate of **${watts} watts**. The ${o.organ} ${many ? 'use' : 'uses'} about
            **${o.share}%** of the body's resting energy, although ${many ? 'they make' : 'it makes'} up ${o.mass} of the body's weight.

            **How many watts ${many ? 'do' : 'does'} ${their} ${o.organ} use?**
            (For example, 30% of 50 watts would be 50 × 30 ÷ 100 = 15 watts.)
          `,
          answer,
          unit: 'watts',
          wrong: [
            [watts - o.share, `Take ${o.share}% of ${watts}: do not subtract ${o.share}.`],
            [watts * o.share, `For ${o.share}%, multiply by ${o.share} and then divide by 100.`],
          ],
          hints: [`${o.share}% means ${o.share} out of every 100.`, `${watts} × ${o.share} ÷ 100.`],
          explain: `
            ${o.share}% of ${watts} watts is ${watts} × ${o.share} ÷ 100 = **${answer} watts**. Almost all of the energy your
            organs use ends up as **heat**. That is what keeps you at about 37 °C, and why you are
            warm to the touch.
          `,
        };
      },
    },
    {
      id: 'kj-kcal',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const { food, kcal: fits } = rng.pick(LABEL_FOODS);
        const [kj, kcal] = rng.pick(LABEL_ENERGY.filter((pair) => fits.includes(pair[1])));
        const toKcal = rng.bool(0.5);
        return {
          text: toKcal
            ? `
              Food labels give energy in **kilojoules** (kJ), in **kilocalories** (kcal, the "calories" of
              everyday speech), or both. One kilocalorie is about ${ENERGY.kjPerKcal} kilojoules,
              so 10 kcal is about 42 kJ, and 84 kJ is about 20 kcal.

              The label on ${food} says **${grouped(kj)} kJ**. **How many kilocalories is that?**
            `
            : `
              Food labels give energy in **kilojoules** (kJ), in **kilocalories** (kcal, the "calories" of
              everyday speech), or both. One kilocalorie is about ${ENERGY.kjPerKcal} kilojoules,
              so 10 kcal is about 42 kJ, and 84 kJ is about 20 kcal.

              The label on ${food} says **${kcal} kcal**. **How many kilojoules is that?**
            `,
          answer: toKcal ? kcal : kj,
          unit: toKcal ? 'kcal' : 'kJ',
          wrong: toKcal
            ? [[Math.round(kj * ENERGY.kjPerKcal), `A kilocalorie is the bigger unit, so the number of kilocalories is smaller. Divide by ${ENERGY.kjPerKcal}.`]]
            : [[Math.round((kcal / ENERGY.kjPerKcal) * 10) / 10, `A kilojoule is the smaller unit, so the number of kilojoules is bigger. Multiply by ${ENERGY.kjPerKcal}.`]],
          hints: [toKcal ? `Each kilocalorie is ${ENERGY.kjPerKcal} kJ, so divide the kilojoules by ${ENERGY.kjPerKcal}.` : `Each kilocalorie is ${ENERGY.kjPerKcal} kJ, so multiply the kilocalories by ${ENERGY.kjPerKcal}.`],
          explain: toKcal
            ? `${grouped(kj)} ÷ ${ENERGY.kjPerKcal} = **${kcal} kcal**. Both units measure the same thing: the energy your cells can release from the food by respiration.`
            : `${kcal} × ${ENERGY.kjPerKcal} = **${grouped(kj)} kJ**. Both units measure the same thing: the energy your cells can release from the food by respiration.`,
        };
      },
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        An invitation: the next time you hurry up a flight of stairs, notice the order of
        events. Your legs are ready at once, on stored ATP. A few seconds later your breathing and
        your pulse climb, as your heart and lungs catch up with the demand for oxygen. And you feel
        warmer: respiration's by-product.

        Every part of this course is in that one staircase: fuel, air, blood, and cells that
        burn the one with the other.
      `,
    },
  ],
  recap: [
    '**Sugar + oxygen → carbon dioxide + water + energy.** Respiration happens in the mitochondria and is the reason for lungs and heart.',
    'Cells run on **ATP**, recharged constantly. With oxygen a glucose gives about 30 ATP; without oxygen only 2, plus lactate, which is a fuel and not a poison.',
    'Sugar is stored as **glycogen** (small, fast) and fuel is stored as **fat** (large, slow). When fat is used, most of its mass is breathed out as carbon dioxide.',
    'At rest the brain, the liver and the muscles each use about a fifth of your energy, and nearly all of it ends as body heat. Energy is measured in kJ or kcal (1 kcal ≈ 4.2 kJ).',
  ],
  next: 'Next: thirty trillion cells need steady surroundings. How does the body hold its temperature, water and salt so still?',
};
