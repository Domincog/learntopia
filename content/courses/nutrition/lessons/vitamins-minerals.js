// Food and Nutrition · Lesson 5 · Small Amounts, Big Jobs
//
// Driving question: if a few thousandths of a gram of a vitamin can save a life, why is more not better?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/nutrition/index.js';
import { DEFICIENCY, VITAMIN_HISTORY, ANAEMIA, FOLIC_ACID_UG, NRV, VITAMIN_A, VITAMIN_C_COLDS, grouped } from '../helpers.js';

// A schematic dose-response curve: harm from too little on the left, from too much on the right.
// x is the daily intake as a multiple of the recommended amount.
const RISK = '100*exp(-5*x) + 100/(1 + exp(-1.6*(x - 7.5)))';
const amount = (v) => (v >= 1000 ? grouped(v) : String(v));
const riskAt = (x) => 100 * Math.exp(-5 * x) + 100 / (1 + Math.exp(-1.6 * (x - 7.5)));

// Supplement labels for the percentage practice: a dose per tablet in the unit of the label reference.
const TABLETS = [
  { key: 'c', doses: [40, 60, 200, 500, 1000] },
  { key: 'd', doses: [5, 10, 25] },
  { key: 'iron', doses: [7, 14, 21] },
  { key: 'zinc', doses: [5, 15, 25] },
  { key: 'folic', doses: [200, 400] },
  { key: 'b12', doses: [2.5, 10, 25] },
  { key: 'calcium', doses: [200, 400, 600] },
];

export default {
  id: 'vitamins-minerals',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      tone: 'sober',
      title: 'Twelve sailors',
      text: `
        May 1747, on board HMS *Salisbury*. Scurvy is killing more sailors
        than battle does: their gums bleed, old wounds reopen, and they die.

        The ship's surgeon, James Lind, takes twelve men with scurvy and
        gives each pair a different remedy for a fortnight.
        **Which pair do you think recovered?**
      `,
      options: [
        { text: 'A quart of cider a day' },
        { text: 'Vinegar, three times a day' },
        { text: 'Half a pint of sea water a day' },
        { text: 'Two oranges and a lemon a day', correct: true },
      ],
      explain: `
        The oranges and lemons. After six days one of the two was fit for
        duty, and the other was nursing the rest.

        It is often called the first controlled trial in medicine. Lind had
        no idea *why* it worked: nothing in the fruit could be seen, tasted
        or weighed. Finding out took another 180 years.
      `,
    },
    {
      id: 'history',
      type: 'interact',
      graded: false,
      title: 'Diseases of something missing',
      text: `
        Doctors of the time looked for causes that were *present*: bad air,
        germs, poisons. The idea that a disease could come from something
        **absent** was slow to arrive.

        **Tap at least three events** to follow it.
      `,
      widget: {
        type: 'timeline', from: 1740, to: 2010, step: 50, mode: 'explore', showYears: true,
        events: VITAMIN_HISTORY.map((ev, i) => ({ id: ev.id, year: ev.year, label: ev.label, short: ev.short, note: ev.note, color: ['orange', 'teal', 'violet', 'blue', 'green'][i] })),
        alt: `A timeline from 1740 to 2010 with five events: ${VITAMIN_HISTORY.map((ev) => `${ev.label}, ${ev.year}`).join('; ')}.`,
      },
      check: (s) => s.seenCount >= 3 || 'Tap a few more events on the line.',
      solution: { seen: ['lind', 'eijkman', 'funk'] },
      explain: `
        Scurvy, beriberi and rickets each turned out to be caused by the
        lack of one substance, needed in tiny amounts; in 1912 Casimir Funk
        named such substances "vitamines". Goitre proved to be the same
        story with a mineral, iodine. Once the cause was known, prevention
        could be built into everyday food: iodine in salt, folic acid in
        flour.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Vitamins and minerals',
      text: `
        A **vitamin** is a carbon-based substance that the body needs in
        small amounts and cannot make, or cannot make enough of. Humans need
        thirteen: A, C, D, E, K and eight B vitamins.

        **Minerals** are chemical elements the body needs: calcium and
        phosphorus for bone, iron for haemoglobin, iodine for thyroid
        hormone, zinc, and others. (Sodium and potassium are in the next
        lesson.)

        The amounts are tiny. About 10 **milligrams** (mg, thousandths of a
        gram) of vitamin C a day is enough to prevent scurvy. Vitamin B12 is
        measured in **micrograms** (µg, millionths of a gram): a lifetime's
        supply would weigh less than a paperclip.
      `,
    },
    {
      id: 'teach-deficiency',
      type: 'info',
      tone: 'sober',
      title: 'Six nutrients, six illnesses',
      text: `
        Each of these nutrients was discovered through the illness that
        appears without it.

        ${DEFICIENCY.map((row) => `- **${row.nutrient}**: ${row.disease} (${row.sign})`).join('\n        ')}

        Four are vitamins. Iodine and iron are minerals.
      `,
    },
    {
      id: 'deficiency',
      type: 'match',
      review: true,
      text: 'Each of these nutrients was discovered through the illness that appears without it. **Match each to its sign.**',
      gen: (rng) => ({
        pairs: rng.sample(DEFICIENCY, 4).map((row) => [row.nutrient, `${row.disease}: ${row.sign}`]),
      }),
      explain: `
        ${DEFICIENCY.map((row) => `**${row.nutrient}**: ${row.disease}`).join('. ')}.

        Severe deficiencies like these are rare where food is plentiful and
        varied. Milder shortfalls are not, as you will see.
      `,
    },
    {
      id: 'soluble',
      type: 'bucket',
      review: true,
      title: 'Two kinds of vitamin',
      text: `
        Vitamins **A, D, E and K** dissolve in fat, so the body absorbs and
        stores them along with fat. Vitamin **C** and the **B vitamins**
        dissolve in water, and the kidneys filter out most of a surplus.

        Think about what follows from that. **Sort the statements.**
      `,
      buckets: ['Fat-soluble (A, D, E, K)', 'Water-soluble (C and the B group)'],
      items: [
        { text: 'Stored in the liver and in body fat', bucket: 0 },
        { text: 'Absorbed along with the fat in a meal', bucket: 0 },
        { text: 'Can build up to harmful levels if far too much is taken', bucket: 0, why: 'What is stored can accumulate. Vitamins A and D are the ones most likely to cause harm in excess.' },
        { text: 'A surplus is mostly passed out in the urine', bucket: 1 },
        { text: 'Easily lost into cooking water', bucket: 1, why: 'They dissolve in water, so boiling vegetables for a long time washes some out.' },
        { text: 'Mostly needs topping up regularly', bucket: 1, why: 'Little is stored, with one exception: the liver holds several years\' worth of B12.' },
      ],
      explain: `
        Fat-soluble vitamins travel and are stored with fat, so a store can
        last for months, and can also overfill. Water-soluble vitamins are
        mostly not stored: a surplus is filtered out by the kidneys.
      `,
    },
    {
      id: 'dose',
      type: 'interact',
      title: 'Is more better?',
      text: `
        If a little of a vitamin is vital, a lot must be better still. Or is it?

        This curve is a sketch of how the chance of harm depends on how
        much of a nutrient someone takes in. An intake of 1 is the
        recommended amount. **Slide the intake** along the whole curve, then
        **leave it anywhere in the range where harm is least likely.**
      `,
      widget: {
        type: 'plot', height: 300, x: [0, 10], y: [0, 110], xStep: 1, yStep: 20, tickLabels: 'x',
        xLabel: 'intake (× recommended)', yLabel: 'chance of harm',
        params: { a: { min: 0, max: 10, step: 0.25, value: 0, label: 'intake', color: 'orange' } },
        fns: [{ expr: RISK, color: 'red' }],
        points: [{ id: 'T', x: 'a', on: 0, color: 'orange' }],
        vlines: [{ x: 'a', color: 'gray', dashed: true }],
        labels: [{ x: 1.2, y: 96, text: 'too little' }, { x: 8.1, y: 30, text: 'too much' }],
        alt: 'A U-shaped curve of the chance of harm against daily intake. Harm is very likely at zero intake, falls to almost nothing by the recommended amount, stays near zero up to about five times that amount, then rises steeply.',
      },
      check: (s) => {
        if (riskAt(s.a) < 2) return true;
        return s.a < 1
          ? 'Here the body is not getting enough: this is the deficiency side. Move to where the curve lies flat on the floor.'
          : 'This far up, the excess itself starts to do harm. Move back to where the curve lies flat on the floor.';
      },
      solution: { a: 2 },
      hints: ['Look for the long flat stretch at the bottom of the curve.'],
      explain: `
        The curve is a **U with a flat floor**. Too little causes
        deficiency. From the recommended amount upwards there is a wide
        range in which nothing further is gained. Far above it, harm begins.

        How wide the floor is depends on the nutrient. For vitamin A it is
        narrow: the upper safe level for adults
        (${grouped(VITAMIN_A.upperUg)} µg a day) is only about four times the
        recommended amount.
      `,
    },
    {
      id: 'teach-excess',
      type: 'info',
      tone: 'sober',
      title: 'Where the floor ends',
      text: `
        The flat floor has an end. Far above the recommended amount, a
        nutrient can do harm:

        - In two large trials (1994 and 1996) in smokers and other people at
          high risk, **beta-carotene** pills (in one trial with vitamin A)
          raised the rate of lung cancer, by 18% and 28%.
        - **Iron** tablets can poison a small child who swallows a handful.
        - High doses of **vitamin A** in pregnancy can harm the developing
          baby.

        A "natural" source is no protection: natural and synthetic forms
        are the same molecules. Polar explorers have been poisoned by the
        vitamin A in polar bear liver.
      `,
      figure: {
        type: 'plot', height: 260, x: [0, 10], y: [0, 110], xStep: 1, yStep: 20, tickLabels: 'x',
        xLabel: 'intake (× recommended)', yLabel: 'chance of harm',
        fns: [{ expr: RISK, color: 'red' }],
        labels: [{ x: 1.2, y: 96, text: 'too little' }, { x: 3.2, y: 14, text: 'enough' }, { x: 8.1, y: 30, text: 'too much' }],
        alt: 'The U-shaped curve again: the chance of harm is high with too little of a nutrient, almost nothing from the recommended amount up to about five times that amount, and rises steeply with too much.',
      },
    },
    {
      id: 'excess',
      type: 'multi',
      review: true,
      tone: 'sober',
      title: 'More is not better',
      text: '**Which of these are true?**',
      options: [
        { text: 'In two large trials, beta-carotene pills raised the rate of lung cancer in smokers', correct: true },
        { text: 'Iron tablets can poison a small child who swallows a handful', correct: true },
        { text: 'High doses of vitamin A in pregnancy can harm the developing baby', correct: true },
        { text: 'A vitamin from a natural source cannot be overdosed', why: 'Natural and synthetic forms are the same molecules. Polar explorers have been poisoned by the vitamin A in polar bear liver.' },
        { text: 'Extra vitamin C is stored up for the winter', why: 'Vitamin C is water-soluble. Beyond what the tissues can hold, the kidneys pass the surplus into the urine.' },
      ],
      explain: `
        The beta-carotene trials (1994 and 1996) expected to prevent cancer
        and found 18% and 28% **more** lung cancer among the smokers and
        other high-risk people who took part. That result
        changed how supplements are judged: a nutrient that is good in food
        is not automatically good as a pill.

        Supplements belong out of children's reach, like medicines.
      `,
    },
    {
      id: 'nrv-percent',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const tab = rng.pick(TABLETS);
        const ref = NRV[tab.key];
        const dose = rng.pick(tab.doses);
        const answer = Math.round((dose / ref.amount) * 100 * 1000) / 1000;
        const times = dose / ref.amount;
        const upside = Math.round((ref.amount / dose) * 100 * 1000) / 1000;
        const wrong = [];
        if (upside !== answer) wrong.push([upside, 'That is the reference as a share of the tablet. Divide the tablet\'s amount by the reference.']);
        if (times !== answer && times !== upside) wrong.push([times, 'That is how many times the reference the tablet holds. As a percentage it is 100 times that number.']);
        return {
          text: `
            European supplement labels give each dose as a percentage of a
            daily **reference value** for adults. For ${ref.name} the
            reference is **${ref.amount} ${ref.unit}**.

            One tablet contains **${amount(dose)} ${ref.unit}** of ${ref.name}.
            **What percentage of the reference value is that?**

            (A dose of 30 against a reference of 20 would be
            30 ÷ 20 = 1.5, which is 150%.)
          `,
          answer,
          unit: '%',
          wrong,
          hints: [`Divide ${amount(dose)} by ${ref.amount}.`, 'Then multiply by 100 to get a percentage.'],
          explain: `${amount(dose)} ÷ ${ref.amount} = ${Math.round(times * 1000) / 1000}, which is **${grouped(answer)}%**. ${times > 3 ? 'Doses many times the reference are common on shop shelves. For most nutrients the surplus does no good; for a few it can do harm.' : times >= 1 ? 'A varied diet usually supplies the reference amount too, so a tablet like this adds to it.' : 'The rest would be expected to come from food.'}`,
        };
      },
    },
    {
      id: 'teach-who-needs',
      type: 'info',
      title: 'For particular people',
      text: `
        Health services do recommend supplements, for particular people at
        particular times.

        - **Folic acid** (${FOLIC_ACID_UG} µg a day) before conception and
          in early pregnancy greatly lowers the risk of neural tube defects
          such as spina bifida.
        - **Vitamin B12** is made only by microbes and reaches us through
          animal foods, so people who eat none are advised to use fortified
          foods or a supplement.
        - **Vitamin D** is made in skin by sunlight; several northern
          countries advise a supplement in winter.
        - **Iron** is prescribed for people diagnosed with iron-deficiency
          anaemia.

        Details differ by country and by person: a pharmacist or doctor can
        say what applies to you.
      `,
    },
    {
      id: 'who-needs',
      type: 'match',
      title: 'Who is advised to take a supplement?',
      text: `
        Health services do recommend supplements, for particular people at
        particular times. **Match each situation to the supplement that
        mainstream guidance most often advises.**
      `,
      pairs: [
        ['Planning a pregnancy, and in its first 12 weeks', 'Folic acid'],
        ['Eating no animal foods at all', 'Vitamin B12'],
        ['Getting very little sunlight on the skin', 'Vitamin D'],
        ['Diagnosed with iron-deficiency anaemia', 'Iron, as prescribed'],
      ],
      explain: `
        Each supplement fills one known gap: folic acid for the first weeks
        of a pregnancy, B12 where no animal foods are eaten, vitamin D
        where the skin sees little sun, iron where anaemia has been found.

        Details differ by country and by person: a pharmacist or doctor can
        say what applies to you.
      `,
    },
    {
      id: 'teach-tested',
      type: 'info',
      title: 'Tested in healthy people',
      text: `
        What about everyone else? Many healthy, well-fed adults take
        supplements as insurance, and that idea has been tested.

        **Multivitamins.** Large trials followed tens of thousands of adults
        for years. They found no clear protection against heart disease or
        cancer (US Preventive Services Task Force, 2022). Ordinary doses
        appeared safe.

        **Vitamin C and colds.** In ${VITAMIN_C_COLDS.trials} trials with
        more than ${grouped(Math.floor(VITAMIN_C_COLDS.people / 1000) * 1000)}
        people, those who took vitamin C every day caught just as many
        colds. Their colds were about ${VITAMIN_C_COLDS.shorterAdultsPct}%
        shorter in adults: about half a day off a week-long cold.
      `,
    },
    {
      id: 'multivitamin',
      type: 'choice',
      text: `
        What about everyone else? Many healthy, well-fed adults take a daily
        multivitamin as insurance. Large trials have followed tens of
        thousands of them for years.

        **What did the trials find about heart disease and cancer?**
      `,
      options: [
        { text: 'No clear protection against either', correct: true },
        { text: 'About a third fewer heart attacks', why: 'No such effect appeared. The independent US task force that reviewed the trials in 2022 found the evidence insufficient to recommend multivitamins for this purpose.' },
        { text: 'Protection, but only at very high doses', why: 'High doses did not help, and for beta-carotene and vitamin E the reviewers advised against taking them for prevention.' },
        { text: 'Serious harm from ordinary multivitamins', why: 'Ordinary-dose multivitamins appeared safe in the trials. They simply did not prevent these diseases.' },
      ],
      columns: 1,
      explain: `
        **No clear benefit**, for people who are already adequately fed
        (US Preventive Services Task Force, 2022). An ordinary multivitamin
        appears harmless, and for someone whose diet is very limited it may
        fill real gaps. But it does not make up for the fibre, the
        unsaturated fats and the thousands of other substances in food.
      `,
    },
    {
      id: 'colds',
      type: 'choice',
      title: 'Vitamin C and colds',
      text: `
        A famous claim: vitamin C prevents colds. It has been tested in
        ${VITAMIN_C_COLDS.trials} trials with more than
        ${grouped(Math.floor(VITAMIN_C_COLDS.people / 1000) * 1000)} people, who took
        vitamin C or a dummy pill every day.

        **What happened?**
      `,
      options: [
        { text: 'Just as many colds; each lasted slightly less long', correct: true },
        { text: 'About half as many colds', why: 'Only in a few small trials of people under extreme physical strain, such as marathon runners. In the general population the number of colds did not change.' },
        { text: 'No colds at all in the vitamin C groups', why: 'The vitamin C groups caught colds as often as everyone else.' },
        { text: 'More colds with vitamin C', why: 'The number of colds was the same in both groups.' },
      ],
      columns: 1,
      explain: `
        People taking vitamin C every day caught **just as many colds**,
        and their colds were only a little shorter. Taking it once a cold
        has started showed no consistent effect.

        A fair summary: a small real effect on duration, none on
        prevention. That is how a good review speaks, in sizes and not just
        in yes or no.
      `,
    },
    {
      id: 'world',
      type: 'interact',
      mode: 'predict',
      tone: 'sober',
      title: 'Still with us',
      text: `
        Scurvy is rare now. But the commonest deficiency in the world is not.
        **Anaemia**, too little haemoglobin, most often from lack of iron,
        leaves people tired and breathless (*What Blood Carries*, in The
        Body I).

        **Drag the bars**: what share of the world's women aged 15 to 49,
        and of children under five, do you think have anaemia?
      `,
      widget: {
        type: 'bars', adjust: true, step: 5, yMax: 60, yStep: 10, unit: '%', yLabel: 'with anaemia (world)',
        data: [{ label: 'Women aged\n15 to 49', value: 5, color: 'red' }, { label: 'Children\nunder five', value: 5, color: 'orange' }],
        alt: 'Two adjustable bars for the share of women aged 15 to 49 and of children under five worldwide who have anaemia.',
      },
      check: (s) => s.values[0][0] >= 20 && s.values[0][1] >= 25,
      solution: { values: [[ANAEMIA.womenPct, ANAEMIA.childrenPct]] },
      explain: `
        About **${ANAEMIA.womenPct}%** of women and **${ANAEMIA.childrenPct}%**
        of young children (WHO): about half a billion women and 270 million
        children.

        Others still matter too. Lack of **iodine** in pregnancy harms a
        baby's developing brain; lack of **vitamin A** is a leading cause of
        preventable blindness in children. The cheapest remedies ever found
        are public ones: **iodised salt**, now used by most of the world's
        households, and vitamins added to flour.
      `,
    },
    {
      id: 'salt-pack',
      type: 'interact',
      title: 'Hidden in plain sight',
      text: `
        This pack of table salt was bought in Germany. Two things have been
        added to it for public health. In German, *Jod* means iodine and
        *Fluorid* means fluoride.

        **Tap the part of the pack that tells you it protects against goitre.**
      `,
      widget: photo(MEDIA['iodised-salt'], {
        alt: 'A yellow cardboard pack of table salt. From top to bottom: a red band with the maker\'s name, large blue words in a white diamond, a small green flag with a plus sign and one word, and a drawing of snowy mountains.',
        caption: 'Iodised, fluoridated table salt from Germany',
        maxWidth: 380,
        hotspots: [
          { id: 'brand', x: 0.484, y: 0.245, r: 0.09, label: 'The maker\'s name', alt: 'white writing on a red band' },
          { id: 'jod', x: 0.484, y: 0.455, r: 0.16, label: 'JodSalz: iodised salt', alt: 'large blue words in a white diamond' },
          { id: 'fluorid', x: 0.344, y: 0.652, r: 0.09, label: '+Fluorid: fluoride added', alt: 'a small green flag with a plus sign' },
          { id: 'mountain', x: 0.5, y: 0.83, r: 0.1, label: 'Decoration', alt: 'a drawing of snowy mountains' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'jod') return true;
        if (s.picked === 'fluorid') return 'Fluoride is the other addition, and it is there for teeth. Goitre comes from a lack of a different element.';
        if (s.picked === 'brand') return 'That is the maker\'s name. Look for the word that names the added nutrient.';
        return s.picked === 'mountain' ? 'The mountains are decoration. Look for the word that names the added nutrient.' : false;
      },
      solution: { picked: 'jod' },
      explain: `
        *JodSalz*: **iodised salt**. The thyroid gland in the neck needs
        iodine to make its hormone; without enough, it swells into a goitre.
        Inland and mountain regions, far from the sea, were once the worst
        affected, which is why Switzerland led the way in 1922.

        The fluoride is a second public-health addition, for teeth
        (*Teeth, Skin, Eyes and Ears*, in Staying Well).
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice',
      text: `
        If there is a packet of salt, flour or breakfast cereal in your
        kitchen, you might read its small print for words like "iodised",
        "fortified" or "with added folic acid". Public health is hiding in
        plain sight there.

        :::note
        Before starting a supplement, especially in pregnancy, alongside
        medicines, or for a child, it is worth asking a pharmacist or
        doctor. More is not better, and some supplements interact with
        medicines.
        :::
      `,
      cta: 'Done',
    },
  ],
  recap: [
    '**Vitamins** and **minerals** are needed in milligrams or micrograms, and each was discovered through the disease that appears without it.',
    'Fat-soluble vitamins (A, D, E, K) are stored and can build up; water-soluble ones (C and the B group) are mostly not stored.',
    'Risk is a **U with a flat floor**: too little harms, enough is enough, and far too much harms again.',
    'Supplements are advised for particular people (folic acid around pregnancy, B12 for vegans, vitamin D with little sun). For well-fed adults, multivitamins have not been shown to prevent disease.',
  ],
  next: 'Next: water and salt. How much you really need to drink, and what sodium does to blood pressure.',
};
