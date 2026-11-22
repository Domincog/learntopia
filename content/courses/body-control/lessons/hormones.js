// The Body II: Control, Defence and Movement · Lesson 3 · Chemical Messengers
//
// Driving question: a meal pours sugar into your blood, yet two hours later the level is back where it began. Who is steering?
import { GLUCOSE, GLUCOSE_LOOP, GLANDS, GLUCOSE_READINGS, THYROID_CASES, tidyNum } from '../helpers.js';

const LOOP = { type: 'glucose-loop' };
const ALT = 'Two graphs over five hours with a meal after half an hour: blood glucose above, insulin below.';

export default {
  id: 'hormones',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A teaspoon to run on',
      text: `
        Glucose, a simple sugar, is the fuel your brain runs on, and your
        blood delivers it. An adult has about ${GLUCOSE.bloodLitres} litres of blood.

        **How many grams of glucose are dissolved in all of that blood
        between meals?** (A teaspoon of sugar is about 5 g.)
      `,
      min: 0, max: 100, step: 5, start: 50, answer: GLUCOSE.gramsInBlood, tolerance: 5, unit: 'g',
      explain: `
        About **${GLUCOSE.gramsInBlood} grams: one teaspoon**, in the whole bloodstream.

        One slice of bread delivers about ${GLUCOSE.breadGrams} g of glucose, three times
        that. If nothing cleared it away, every meal would send the level
        soaring. Yet in a healthy body it rises by only about half, and then
        returns.
        Something is steering.
      `,
    },
    {
      id: 'meal-normal',
      type: 'interact',
      graded: false,
      title: 'Watch a meal go by',
      text: `
        The blue line is **glucose** in the blood of a healthy adult. The
        violet line is **insulin**, a substance the pancreas releases into
        the blood.

        **Press Eat a meal** and watch the two lines. Which one moves
        first?
      `,
      widget: { ...LOOP, conditions: ['normal'], alt: ALT },
      check: (s) => s.ran || 'Press **Eat a meal** and watch both lines.',
      solution: { condition: 'normal' },
      explain: `
        Glucose rises first. Insulin follows it up within minutes, and as
        insulin climbs, glucose turns round and falls. Then insulin falls
        too. About two hours after the meal, both are back where they began.

        The level is measured in **mmol/L** in most countries and in
        **mg/dL** in some (the right-hand scale): ${GLUCOSE.fasting} mmol/L is ${GLUCOSE.fasting * GLUCOSE.mgPerMmol} mg/dL.

        This is a simplified model. Real curves depend on the meal, the
        person and even the time of day.
      `,
    },
    {
      id: 'teach-insulin',
      type: 'info',
      title: 'A messenger in the blood',
      text: `
        What you just watched is run by a **hormone**: a chemical
        messenger that a **gland** releases into the blood. Here the gland
        is the **pancreas**, and the hormone is **insulin**.

        Read the two curves again:

        - When blood glucose [rises]{.blue}, the pancreas detects it and
          releases [insulin]{.violet}.
        - Insulin reaches the whole body in the blood. It makes muscle,
          fat and liver cells **take glucose in**.
        - So the glucose in the blood falls, and the pancreas releases
          less insulin again.
      `,
      figure: { ...LOOP, condition: 'normal', static: true, alt: 'The finished graphs for a healthy adult. After the meal the glucose line rises by about half and is back at its starting level about two hours later. The insulin line rises just after the glucose line and falls back just after it.' },
    },
    {
      id: 'loop-order',
      type: 'order',
      review: true,
      title: 'The loop',
      text: `
        Insulin is a **hormone**: a chemical messenger carried in the blood.
        Together, glucose and insulin form a loop that corrects itself.
        **Put its steps in order, starting with the meal.**
      `,
      items: GLUCOSE_LOOP,
      labels: ['First', 'Last'],
      explain: `
        A rise causes a response that undoes the rise. That is **negative
        feedback**, the thermostat principle you met in *The Body I*. The
        signal here is not a nerve impulse but a hormone, and the "heater
        switch" is in the pancreas.
      `,
    },
    {
      id: 'teach-two-services',
      type: 'info',
      title: 'Two message services',
      text: `
        The body has two ways of sending orders.

        [**Nerves**]{.yellow} work like a phone call. The signal runs
        along a fibre to one exact place, arrives within a few hundredths
        of a second, and its effect is over almost at once.

        [**Hormones**]{.red} work like a broadcast. The blood carries them
        to the whole body, they take from seconds to hours to act, and
        their effects can last hours, days or longer. A hormone reaches
        every cell, but only cells that carry its matching **receptor**
        respond.
      `,
      figure: {
        type: 'body-map', view: 'body', zoom: false, show: ['brain', 'spinal-cord', 'nerves', 'heart', 'arteries', 'veins'],
        groups: [
          { ids: ['brain', 'spinal-cord', 'nerves'], color: 'yellow', label: 'Nerves: a line to one place' },
          { ids: ['heart', 'arteries', 'veins'], color: 'red', label: 'Blood: reaches every cell' },
        ],
        alt: 'A whole body facing the viewer with two networks drawn in it: the brain, spinal cord and main nerves in one colour, and the heart and main blood vessels in another. Both reach into the arms and legs.',
      },
    },
    {
      id: 'nerve-or-hormone',
      type: 'bucket',
      title: 'Which service?',
      text: '**Which message service is mainly at work in each of these?**',
      buckets: ['Nerve signal', 'Hormone'],
      items: [
        { text: 'Snatching a hand away from a hot pan', bucket: 0 },
        { text: 'Tapping a pad the moment it changes colour', bucket: 0 },
        { text: 'Blinking as something flies towards your eye', bucket: 0 },
        { text: 'Blood glucose settling over the two hours after a meal', bucket: 1 },
        { text: 'A child growing taller, year after year', bucket: 1, why: 'Growth is slow, body-wide and long-lasting: the work of a hormone, not of a signal that is over at once.' },
        { text: 'A body changing through puberty over several years', bucket: 1 },
        { text: 'A pounding heart that lingers for minutes after a fright', bucket: 1, why: 'The jump itself is nerves. The pounding that lingers is adrenaline, a hormone, still in the blood until it is cleared.' },
      ],
      explain: `
        Speed and precision are the work of nerves. Slow, body-wide
        adjustments are the work of hormones: growth, blood glucose, the
        daily rhythm and puberty are all run by them.
      `,
    },
    {
      id: 'no-insulin',
      type: 'interact',
      tone: 'sober',
      title: 'Break the loop',
      text: `
        What is insulin actually worth? **Choose the body that makes no
        insulin, and give it the same meal.**

        The dashed grey line keeps the healthy run for comparison.
      `,
      widget: { ...LOOP, conditions: ['normal', 'none'], condition: 'normal', alt: ALT },
      check: (s) => {
        if (s.condition !== 'none') return s.ran ? 'That is the healthy run. Now choose **No insulin made** and run the meal again.' : 'Choose **No insulin made**, then press **Eat a meal**.';
        return s.ran || 'Now press **Eat a meal**.';
      },
      solution: { condition: 'none', runs: [{ condition: 'normal' }] },
      explain: `
        Without insulin, glucose starts far too high, climbs higher, and
        does not come back. Cells sit in a bath of fuel that they cannot
        take in. Above about ${GLUCOSE.kidneyThreshold} mmol/L the kidneys lose glucose into the
        urine, and water follows it.

        This is untreated **type 1 diabetes**: the immune system has
        destroyed the insulin-making cells of the pancreas. Nothing the
        person ate or did causes it.

        :::warn
        Great thirst, passing a lot of urine, tiredness and unexplained
        weight loss, coming on over days or weeks, need a doctor
        **urgently**, the same day. In a child especially, do not wait.
        If vomiting, stomach pain, fast deep breathing or drowsiness
        join them, it is an emergency: call your emergency number.
        :::
      `,
    },
    {
      id: 'treat',
      type: 'interact',
      tone: 'sober',
      title: 'Toronto, 1922',
      text: `
        Until the 1920s, nobody with that curve lived long. Then a team in
        Toronto (Banting, Best, Collip and Macleod) purified insulin from
        animal pancreases, and in January ${GLUCOSE.firstInsulin} a 14-year-old boy,
        Leonard Thompson, became the first person treated with it.

        **Do what they did: give insulin by injection, and run the meal.**
      `,
      widget: { ...LOOP, conditions: ['none'], condition: 'none', treatToggle: true, alt: ALT },
      check: (s) => {
        if (!s.treated) return s.ran ? 'That is the untreated run. Tick **give insulin by injection** and run the meal again.' : 'Tick **give insulin by injection** first.';
        return s.ran || 'Now press **Eat a meal**.';
      },
      solution: { condition: 'none', treated: true, runs: [{ condition: 'none', treated: false }] },
      explain: `
        With insulin supplied from outside, the curve looks nearly healthy
        again. Leonard Thompson lived; so, since then, have millions of
        people with type 1 diabetes.

        The hard part is matching the dose to each meal, by hand, for
        life: too little and glucose runs high; too much and it falls too
        low, which is dangerous and needs sugar at once. Sensors and pumps
        now help, and a person's doses are worked out with their diabetes
        team.
      `,
    },
    {
      id: 'teach-glucagon',
      type: 'info',
      title: 'The other direction',
      text: `
        Blood glucose can also drift too **low**, between meals and
        overnight. For that the pancreas makes a second hormone, with the
        opposite effect.

        | Hormone | When glucose is | What it does |
        |---|---|---|
        | **Insulin** | rising | makes cells take glucose in, so the level falls |
        | **Glucagon** | falling | makes the liver release stored glucose, so the level rises |

        The **liver** holds that store (as glycogen) and can make more.
        The pancreas only sends the signals.
      `,
      figure: {
        type: 'body-map', view: 'torso', show: ['liver', 'pancreas', 'stomach'], zoom: false,
        groups: [{ ids: ['pancreas'], color: 'violet' }, { ids: ['liver'], color: 'orange' }],
        labels: [{ id: 'pancreas', text: 'Pancreas: makes insulin and glucagon' }, { id: 'liver', text: 'Liver: stores glucose' }],
        legend: false,
        alt: 'The chest and abdomen of a body facing the viewer. The liver, high on the person\'s right, and the pancreas, lying across the upper abdomen behind the stomach, are highlighted and named.',
      },
    },
    {
      id: 'glucagon',
      type: 'choice',
      review: true,
      title: 'The other direction',
      text: `
        It is mid-afternoon, a person has not eaten since breakfast, and
        their blood glucose is starting to drift **below** its usual level.
        **What does a healthy pancreas do?**
      `,
      options: [
        { text: 'Releases glucagon, which makes the liver release stored glucose', correct: true },
        { text: 'Releases more insulin, to make cells work harder', why: 'Insulin moves glucose out of the blood. More of it would push a low level lower still.' },
        { text: 'Nothing: only eating can raise blood glucose', why: 'The liver holds a store of glucose (as glycogen) for exactly this, and can make more. That is how the level holds overnight.' },
        { text: 'Releases glucose that it has stored itself', why: 'The pancreas sends the signal. The store is in the liver.' },
      ],
      explain: `
        The level is falling, so the signal needed is **glucagon**, and
        the liver's store does the rest. Between them, insulin and
        glucagon hold the level near ${GLUCOSE.fasting} mmol/L, through feasts and
        through a night's sleep.
      `,
    },
    {
      id: 'resistant',
      type: 'interact',
      title: 'A quieter problem',
      text: `
        A different fault. In this body the pancreas works, but muscle, fat
        and liver cells **respond only weakly** to insulin.

        **Run the meal for the healthy body, then for this one.** Compare
        the two insulin peaks.
      `,
      widget: { ...LOOP, conditions: ['normal', 'resistant'], condition: 'normal', alt: ALT },
      check: (s) => {
        const seen = (k) => s.seen.includes(k);
        if (seen('normal') && seen('resistant')) return true;
        if (!s.runs.length) return 'Press **Eat a meal** for the healthy body first.';
        return seen('normal') ? 'Now choose **Cells respond weakly** and run the meal again.' : 'Now run the meal for the healthy body too, so that you can compare.';
      },
      solution: { condition: 'resistant', runs: [{ condition: 'normal' }, { condition: 'resistant' }] },
      explain: `
        The pancreas shouts louder: insulin peaks at nearly twice the
        healthy level, and still glucose runs higher for longer. This is
        **insulin resistance**. For years the extra insulin can hide it;
        if the pancreas can no longer keep up, glucose stays high:
        **type 2 diabetes**. It is much the commoner type: over ${GLUCOSE.type2Share}% of
        people with diabetes have it.

        Genes, age, body weight, activity, sleep and the conditions people
        live in all shape the risk. It is common, it can go unnoticed for
        years, and it is treatable. (Risk and prevention: *Staying Well*.)
      `,
    },
    {
      id: 'type-sort',
      type: 'bucket',
      review: true,
      title: 'Two conditions, one name',
      text: `
        More than half a billion adults live with diabetes. **Which type
        does each statement describe?**
      `,
      buckets: ['Type 1', 'Type 2', 'Both'],
      items: [
        { text: 'The immune system has destroyed the insulin-making cells', bucket: 0 },
        { text: 'Insulin from outside is needed from the start', bucket: 0 },
        { text: 'Cells respond weakly to insulin', bucket: 1 },
        { text: `About nine in ten people with diabetes have it`, bucket: 1 },
        { text: 'Often develops slowly, with no symptoms for years', bucket: 1, why: 'Type 1 usually shows itself within weeks. Type 2 can go unnoticed for years, which is why blood tests matter.' },
        { text: 'Untreated, blood glucose runs too high', bucket: 2 },
        { text: 'People who have it can live long, full lives', bucket: 2, why: 'With treatment and support, this is true of both types.' },
      ],
      explain: `
        **Type 1**: no insulin, because the cells that make it are gone.
        It often starts in childhood or youth but can begin at any age.
        **Type 2**: insulin is made but does not work well enough.
        Neither is a verdict on anyone's character, and neither is caused
        simply by "eating sugar".
      `,
    },
    {
      id: 'units',
      type: 'numeric',
      review: true,
      title: 'Two sets of units',
      gen: (rng) => {
        const mmol = rng.pick(GLUCOSE_READINGS);
        const mg = Math.round(mmol * GLUCOSE.mgPerMmol);
        const toMg = rng.bool();
        const who = rng.pick(['Dana', 'Ravi', 'Mei', 'Tomás', 'Amara']);
        return toMg
          ? {
            text: `
              ${who}'s glucose meter shows **${tidyNum(mmol)} mmol/L**. A friend in
              another country uses a meter that reads in **mg/dL**.

              1 mmol/L of glucose is ${GLUCOSE.mgPerMmol} mg/dL, so 9 mmol/L would be
              9 × ${GLUCOSE.mgPerMmol} = ${9 * GLUCOSE.mgPerMmol} mg/dL. **What would the friend's meter
              show for the same blood?**
            `,
            answer: mg,
            unit: 'mg/dL',
            wrong: [[Math.round((mmol / GLUCOSE.mgPerMmol) * 100) / 100, `Going from mmol/L to mg/dL the number gets bigger: multiply by ${GLUCOSE.mgPerMmol}.`]],
            hints: [`Multiply by ${GLUCOSE.mgPerMmol}.`],
            explain: `${tidyNum(mmol)} × ${GLUCOSE.mgPerMmol} = **${mg} mg/dL**. Same blood, same glucose, different units.`,
          }
          : {
            text: `
              ${who} reads an article that mentions a blood glucose of
              **${mg} mg/dL**, but ${who}'s own country uses **mmol/L**.

              1 mmol/L of glucose is ${GLUCOSE.mgPerMmol} mg/dL, so ${9 * GLUCOSE.mgPerMmol} mg/dL would be
              ${9 * GLUCOSE.mgPerMmol} ÷ ${GLUCOSE.mgPerMmol} = 9 mmol/L. **What is ${mg} mg/dL in mmol/L?**
            `,
            answer: mmol,
            unit: 'mmol/L',
            wrong: [[mg * GLUCOSE.mgPerMmol, `Going from mg/dL to mmol/L the number gets smaller: divide by ${GLUCOSE.mgPerMmol}.`]],
            hints: [`Divide by ${GLUCOSE.mgPerMmol}.`],
            explain: `${mg} ÷ ${GLUCOSE.mgPerMmol} = **${tidyNum(mmol)} mmol/L**. Same blood, same glucose, different units.`,
          };
      },
    },
    {
      id: 'glands-map',
      type: 'interact',
      graded: false,
      title: 'Where the glands are',
      text: `
        The pancreas is one of several glands that work this way. Three
        of them are in the neck and trunk. (The figure faces you, so its
        left side is on your right.)

        **Tap each of the three** and read what it makes.
      `,
      widget: { type: 'body-map', view: 'body', bounds: [100, 120, 300, 460], mode: 'explore', show: ['thyroid', 'adrenals', 'pancreas', 'kidneys'], pickable: ['thyroid', 'adrenals', 'pancreas'], dim: false, zoom: false, alt: 'The neck and trunk of a body facing the viewer, with a butterfly-shaped gland at the front of the neck, a long gland lying across the upper abdomen, and a small cap-shaped gland on top of each kidney.' },
      check: (s) => s.seenCount >= 3 || 'Tap all three glands: one in the neck, one across the upper abdomen, and the pair on top of the kidneys.',
      solution: { seen: ['thyroid', 'pancreas', 'adrenals'] },
      explain: `
        The **thyroid** wraps round the front of the windpipe. The
        **adrenal glands** sit like caps on the kidneys ("ad-renal":
        beside the kidney). The **pancreas** lies deep behind the stomach,
        which is why it took so long to work out what it does.
      `,
    },
    {
      id: 'teach-glands',
      type: 'info',
      title: 'Five glands',
      text: `
        Two more glands sit inside the head. The **pituitary** hangs just
        under the brain. The **pineal gland** lies deep inside the brain
        (it is not drawn here).

        | Gland | Its hormones | What they do |
        |---|---|---|
        ${['pituitary', 'pineal', 'thyroid', 'adrenals', 'pancreas'].map((id) => `| **${GLANDS[id][0]}** | ${GLANDS[id][1]} | ${GLANDS[id][2]} |`).join('\n        ')}
      `,
      figure: {
        type: 'body-map', view: 'head', show: ['skull', 'cerebrum', 'cerebellum', 'brainstem', 'spinal-cord', 'pituitary', 'thyroid'],
        groups: [{ ids: ['pituitary', 'thyroid'], color: 'violet' }], legend: false,
        labels: ['pituitary', 'thyroid'],
        alt: 'A head and neck seen from the side and cut open down the middle. A small gland hanging from the underside of the brain and a gland at the front of the neck are highlighted and named: the pituitary and the thyroid.',
      },
    },
    {
      id: 'glands',
      type: 'match',
      title: 'The other glands',
      text: `
        **Match each gland to what its hormones do.**
      `,
      pairs: ['pituitary', 'thyroid', 'adrenals', 'pancreas', 'pineal'].map((id) => [GLANDS[id][0], GLANDS[id][2]]),
      explain: `
        The thyroid is the body's pace-setter. The adrenals work on two
        timescales: adrenaline within seconds of a fright, cortisol over
        the following minutes and hours. Melatonin, the signal of night,
        is followed up in *Sleep, Stress and Mental Health*.

        The ovaries and testes are glands too; their hormones come later
        in this course.
      `,
    },
    {
      id: 'thyroid-loop',
      type: 'choice',
      stretch: true,
      title: 'The same trick, one level up',
      gen: (rng) => {
        const c = rng.pick(THYROID_CASES);
        const who = rng.pick(['a 40-year-old teacher', 'a 55-year-old bus driver', 'a 30-year-old nurse', 'a 62-year-old gardener']);
        const why = {
          High: 'A high TSH is the pituitary calling for more thyroid hormone. It does that when the level in the blood is low.',
          Low: 'A low TSH means the pituitary has stopped calling for thyroid hormone. It does that when there is already too much.',
          'Unchanged': 'The pituitary measures thyroid hormone all the time and adjusts its signal: that is the feedback loop.',
        };
        return {
          text: `
            The thyroid has a boss. The pituitary releases a hormone called
            **TSH** that tells the thyroid to work, and it releases **less**
            TSH when it senses plenty of thyroid hormone in the blood.

            In ${who}, ${c.story}. The pituitary is healthy.
            **What would a blood test show for TSH?**
          `,
          shuffle: false,
          options: ['High', 'Low', 'Unchanged'].map((t) => ({ text: t, correct: t === c.tsh, why: t === c.tsh ? undefined : why[t] })),
          explain: `
            Thyroid hormone is ${c.hormone}, so the pituitary turns its signal
            ${c.tsh === 'High' ? 'up' : 'down'}: **TSH is ${c.tsh.toLowerCase()}**. Negative feedback again, with one
            gland regulating another. Doctors use exactly this: TSH is
            usually the first blood test for a thyroid problem. (A person
            with ${c.hormone === 'low' ? 'an underactive' : 'an overactive'} thyroid may feel ${c.effect}.)
          `,
        };
      },
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        You can feel the difference between the two message services.

        Next time something startles you (a slammed door, a near miss),
        notice the **two waves**. First the jump itself, over in a
        fraction of a second: that is nerves. Then the pounding heart and
        shaky hands that arrive a moment later and **linger for minutes**
        after you know you are safe: that is adrenaline, still in your
        blood until it is cleared.

        Nothing to do about it. It is simply a hormone, taking its time.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    '**Hormones** are chemical messengers released by glands into the blood: slower than nerves, longer-lasting, and read only by cells with the right receptor.',
    'Blood glucose is held steady by **negative feedback**: insulin lowers it after a meal, glucagon raises it between meals.',
    '**Type 1 diabetes**: no insulin is made. **Type 2**: cells respond weakly to it. Neither is anyone\'s fault, and both can be treated.',
    'Other glands work the same way: the pituitary and thyroid form a feedback loop that sets the body\'s pace.',
  ],
  next: 'Next: the body is under constant attack by microbes. Meet the defence system that learns every enemy it has ever fought.',
};
