// Staying Well: Prevention and Everyday Medicine · Lesson 5 · Know Your Numbers
//
// Driving question: which few measurements predict the diseases most people will meet, and what do they mean?
// Every calculation is for an example person. Thresholds that differ between guidelines are shown, never graded.
// Sources for the facts are noted in ../helpers.js.
import { r, num } from '../../../kit.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/staying-well/index.js';
import { PEOPLE, NCD, HYPERTENSION, BP_GUIDELINES, UNITS, DIABETES, BMI_BANDS, bmi, RESTING_HR, RISK_MODEL } from '../helpers.js';

// The middle stage of atherosclerosis in a published illustration: an artery of the heart, enlarged and cut
// open, narrowed by fatty plaque. The rings name the parts the teaching screen talks about.
const ARTERY_SPOTS = [
  { id: 'plaque', x: 0.53, y: 0.67, r: 0.05, label: 'Fatty plaque in the wall', alt: 'the thick yellow layer between the lining and the outer wall' },
  { id: 'channel', x: 0.82, y: 0.3, r: 0.05, label: 'Narrowed channel', alt: 'the narrow passage where the red blood cells flow' },
  { id: 'heart', x: 0.322, y: 0.605, r: 0.05, label: 'Artery on the heart', alt: 'a dashed circle on the surface of the heart' },
];

/** The two guidelines' bands for the upper (systolic) number, as two bars over one axis. */
const BP_BARS = (() => {
  const lo = 110;
  const hi = 150;
  const x = (v) => 20 + (Math.min(Math.max(v, lo), hi) - lo) * 9.9;
  let content = '';
  [BP_GUIDELINES.us, BP_GUIDELINES.europe].forEach((g, row) => {
    const y = 28 + row * 82;
    content += `<text class="fig-label" x="20" y="${y - 9}">${g.name}</text>`;
    for (const b of g.bands) {
      content += `<rect class="fill-${b.color} stroke-ink" stroke-width="2" x="${x(b.from)}" y="${y}" width="${x(b.to) - x(b.from)}" height="34"/>`;
      content += `<text class="fig-label" style="fill:#1D1B26" x="${(x(b.from) + x(b.to)) / 2}" y="${y + 22}" text-anchor="middle">${b.name}</text>`;
    }
  });
  for (const v of [120, 130, 140]) content += `<text class="fig-label" x="${x(v)}" y="192" text-anchor="middle">${v}</text><line class="stroke-ink" stroke-width="2" x1="${x(v)}" x2="${x(v)}" y1="168" y2="175"/>`;
  content += `<text class="fig-label-sm text-muted" x="218" y="212" text-anchor="middle">upper number (mmHg)</text>`;
  return {
    type: 'svg', viewBox: '0 0 436 218', maxWidth: 560, content,
    alt: 'Two bars compare how two guidelines label the upper blood-pressure number. The United States guideline calls it normal below 120, elevated from 120, high (stage 1) from 130 and high (stage 2) from 140. The European guideline calls it not elevated below 120, elevated from 120 and high from 140.',
  };
})();

// Pressure in an artery over four heartbeats, as a simplified sketch: it swings between the two numbers of a reading of 120/80.
const PULSE = {
  type: 'plot', height: 260, x: [0, 4], y: [60, 140], xStep: 1, yStep: 20, xLabel: 'seconds', yLabel: 'pressure (mmHg)', tickLabels: true,
  fns: [{ expr: '100 + 20*sin(2*pi*x)', color: 'red' }],
  hlines: [{ y: 120, dashed: true }, { y: 80, dashed: true }],
  labels: [{ x: 1.6, y: 129, text: 'upper number: the heart contracts' }, { x: 1.6, y: 70, text: 'lower number: the heart rests' }],
  alt: 'A simplified sketch of the pressure in an artery over four heartbeats. It rises to 120 millimetres of mercury each time the heart contracts and falls back to 80 while the heart rests between beats.',
};

const READINGS = [126, 131, 128, 134, 129, 127, 133, 158];

const RISK = {
  type: 'risk-array', n: 100, base: RISK_MODEL.base, factors: RISK_MODEL.factors,
  words: { people: 'people like Sam', without: 'With none of these', with: 'With the ones switched on', base: 'affected either way', extra: 'affected because of them', rest: 'not affected' },
};

const UNIT_CASES = [
  // [what, mmol/L, factor]
  ['cholesterol', 2, UNITS.cholesterol], ['cholesterol', 3, UNITS.cholesterol], ['cholesterol', 4, UNITS.cholesterol], ['cholesterol', 5, UNITS.cholesterol], ['cholesterol', 6, UNITS.cholesterol],
  ['glucose', 4, UNITS.glucose], ['glucose', 5, UNITS.glucose], ['glucose', 6, UNITS.glucose], ['glucose', 7, UNITS.glucose], ['glucose', 10, UNITS.glucose],
];
const PLACES_MMOL = ['Canada', 'Britain', 'Australia', 'Sweden'];
const PLACES_MGDL = ['the United States', 'Germany', 'Japan', 'Brazil'];

// [height in metres, weight in kg]: example adults
const BODIES = [[1.5, 54], [1.6, 64], [1.6, 77], [1.65, 60], [1.7, 65], [1.7, 78], [1.75, 70], [1.8, 81], [1.8, 68], [1.9, 90], [1.85, 80]];

export default {
  id: 'know-your-numbers',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      tone: 'sober',
      title: 'What people die of',
      text: `
        Germs once caused most deaths. The last three lessons were about how that changed.

        Today, **out of every 10 deaths in the world, how many are caused by diseases that are not infections**: heart disease, stroke, cancer, diabetes and long-term lung disease?
      `,
      min: 0, max: 10, step: 1, answer: 7, tolerance: 1, start: 0, unit: 'in 10',
      explain: `
        About **7 in 10**: at least ${NCD.deathsMillions} million deaths in ${NCD.year}, or ${NCD.sharePct}% of all deaths not caused by the pandemic.

        These diseases build up silently over decades. But a few simple measurements can see them coming, years ahead. This lesson is about those numbers: what they measure, and what they can and cannot tell you.
      `,
    },
    {
      id: 'teach-artery',
      type: 'info',
      tone: 'sober',
      title: 'Inside an artery',
      text: `
        Most heart attacks and strokes are the last step of one slow process, called **atherosclerosis**. The picture shows its middle stage, in an artery of the heart.

        - **LDL cholesterol**, carried in the blood, seeps into the wall of an artery.
        - Over decades, a fatty **plaque** builds up in the wall. The channel narrows, and nothing is felt.
        - One day the surface of the plaque tears. A **blood clot** forms on the tear, as it would on a wound, and the clot blocks the artery.
      `,
      figure: photo(MEDIA['artery-plaque'], {
        alt: 'A heart with a dashed circle on one of the arteries on its surface. Beside it, that artery is shown enlarged and cut open: a thick yellow layer of fatty plaque lines its wall on both sides, and red blood cells squeeze through the narrowed channel in the middle.',
        caption: 'An artery of the heart, narrowed by plaque',
        mode: 'label',
        hotspots: ARTERY_SPOTS,
      }),
    },
    {
      id: 'artery',
      type: 'order',
      tone: 'sober',
      title: 'Inside an artery',
      text: 'Most heart attacks and strokes are the last step of one slow process, called **atherosclerosis**. **Put the steps in order.**',
      items: [
        'LDL cholesterol seeps into the artery wall',
        'Over decades, a fatty plaque builds up in the wall',
        'The surface of the plaque tears',
        'A blood clot forms on the tear',
        'The clot blocks the artery',
      ],
      labels: ['First', 'Last'],
      explain: `
        Beyond the block, tissue is starved of oxygen. In the heart that is a **heart attack**; in the brain it is the commonest kind of **stroke**. Both are emergencies. Chest pain or pressure that does not pass, or a face that suddenly droops, an arm that goes weak or speech that slurs: call your emergency number at once. *First Aid* teaches the signs.

        For decades before that, nothing is felt. What can be measured is whatever speeds the process up: the **pressure** on the artery wall, the **LDL cholesterol** that feeds the plaque, the **glucose** that damages the lining, and tobacco smoke.
      `,
    },
    {
      id: 'teach-bp',
      type: 'info',
      title: 'Two numbers',
      text: `
        A blood-pressure reading such as **120/80** gives the pressure in the arteries at two moments of every heartbeat. You met them in *The Body I*.

        - The first, higher number (**systolic**) is the peak, when the heart contracts and pushes blood out.
        - The second (**diastolic**) is the lowest point, when the heart rests between beats.

        Both are measured in millimetres of mercury (mmHg). Artery walls that live under high pressure for years stiffen and scar, and plaque grows faster in them.
      `,
      figure: PULSE,
    },
    {
      id: 'bp-meaning',
      type: 'fill',
      review: true,
      title: 'Two numbers',
      text: 'A blood-pressure reading has two numbers, such as **120/80**, measured in millimetres of mercury (mmHg). You met them in *The Body I*.',
      template: `
        The first, higher number is the pressure in the arteries when the heart [[rests between beats|*contracts|fills with blood]].

        The second is the pressure when the heart [[*rests between beats|contracts|beats fastest]].

        Pressure that stays high for years matters because it [[makes the blood thicker|slows the heart down|*damages the artery walls]].
      `,
      explain: `
        Each heartbeat sends a pulse of pressure through the arteries (the upper, **systolic** number), which falls back between beats (the lower, **diastolic** number).

        Artery walls under constantly high pressure stiffen and scar, and plaque grows faster in them. High blood pressure is the biggest single risk factor for stroke, and one of the biggest for heart attack, kidney failure and dementia.
      `,
    },
    {
      id: 'bp-readings',
      type: 'choice',
      title: 'One reading is not a diagnosis',
      text: `
        Kenji measures his blood pressure at home. The blue dots are the upper number on seven quiet mornings. The [orange]{.orange} dot is a reading he took just after running for a bus.

        **Drag the orange dot** and watch the mean. Then: **which number best describes Kenji's blood pressure?**
      `,
      figure: {
        type: 'dot-plot', min: 120, max: 160, step: 2, major: 10, values: READINGS, drag: [7], show: ['mean'], unit: 'mmHg', digits: 0,
        alt: 'A dot plot of eight blood-pressure readings. Seven lie between 126 and 134. One, in orange, is far to the right at 158 and can be dragged. A marker shows the mean of all eight.',
      },
      columns: 1,
      options: [
        { text: 'About 130: the average of the readings taken at rest', correct: true },
        { text: '158: the highest reading is the one that counts', why: 'Blood pressure rises with effort, stress, caffeine and even talking, and falls again. A reading taken after a sprint says little about the pressure his arteries live with.' },
        { text: '126: the lowest reading is his true pressure', why: 'The lowest reading is as much a matter of chance as the highest. The average of many resting readings is steadier than either.' },
        { text: 'None: it changes too much to measure', why: 'It does vary from minute to minute, which is exactly why several readings are averaged. The average is quite stable.' },
      ],
      explain: `
        Blood pressure is judged on the **average of repeated readings at rest**, often taken at home over a week. One high reading is a reason to measure again, not a verdict.

        The exception: a very high reading (about 180/120 or more) together with chest pain, breathlessness, a severe headache, confusion, weakness or a sudden change in sight or speech is an emergency. Call your emergency number.

        Technique matters too: sitting quietly for five minutes first, back supported, feet flat, the arm resting at heart level, a cuff of the right size, and no talking.
      `,
    },
    {
      id: 'bp-high',
      type: 'info',
      title: 'What counts as high?',
      text: `
        Risk rises steadily with pressure, with no sharp edge, so where to draw the line is a judgement. Expert bodies draw it in different places:

        - **Europe**, and most of the world: **${BP_GUIDELINES.europe.highFrom.join('/')}** or above
        - **United States**: **${BP_GUIDELINES.us.highFrom.join('/')}** or above

        All of them agree that around 120/80 or below is where arteries fare best, and that the higher the average, the more there is to gain from lowering it.

        :::note The silent one
        High blood pressure usually causes no symptoms at all. About ${HYPERTENSION.peopleBillions} billion people have it, and many do not know. The only way to find out is to measure.
        :::
      `,
      figure: BP_BARS,
    },
    {
      id: 'teach-blood-tests',
      type: 'info',
      title: 'Two numbers from a blood sample',
      text: `
        A blood test adds two more numbers. **LDL cholesterol** is the cholesterol that ends up in artery walls. **Blood glucose** is the sugar dissolved in the blood, usually measured after a night without food.

        Laboratories report both in one of two units, depending on the country.

        | | 1 mmol/L is about |
        |---|---|
        | LDL cholesterol | ${UNITS.cholesterol} mg/dL |
        | Glucose | ${UNITS.glucose} mg/dL |

        :::example Worked example: a glucose result of 8 mmol/L
        - To mg/dL, **multiply**: 8 × ${UNITS.glucose} = **${8 * UNITS.glucose} mg/dL**.
        - Back to mmol/L, **divide**: ${8 * UNITS.glucose} ÷ ${UNITS.glucose} = **8 mmol/L**.

        The value in mg/dL is always the bigger number.
        :::
      `,
    },
    {
      id: 'units',
      type: 'numeric',
      review: true,
      title: 'Blood tests in two languages',
      gen: (rng) => {
        const [what, mmol, factor] = rng.pick(UNIT_CASES);
        const mgdl = mmol * factor;
        const toMg = rng.bool(0.6);
        const who = rng.pick(PEOPLE);
        const intro = what === 'cholesterol'
          ? '**LDL cholesterol** is the cholesterol that ends up in artery walls: the lower, the better.'
          : '**Blood glucose** is the sugar dissolved in the blood, usually measured after a night without food.';
        const rule = `1 mmol/L of ${what} is about ${factor} mg/dL`;
        return {
          text: toMg
            ? `${intro} Laboratories report it in two units, and ${rule}.\n\n${who}'s result from a laboratory in ${rng.pick(PLACES_MMOL)} is **${mmol} mmol/L**. **What would a laboratory that uses mg/dL print?**`
            : `${intro} Laboratories report it in two units, and ${rule}.\n\n${who}'s result from a laboratory in ${rng.pick(PLACES_MGDL)} is **${mgdl} mg/dL**. **What is that in mmol/L?**`,
          answer: toMg ? mgdl : mmol,
          unit: toMg ? 'mg/dL' : 'mmol/L',
          tolerance: toMg ? 0.5 : 0.05,
          wrong: toMg
            ? [[Math.round((mmol / factor) * 1000) / 1000, `That divides by ${factor}. A value in mg/dL is the bigger number: multiply.`]]
            : [[mgdl * factor, `That multiplies by ${factor}. A value in mmol/L is the smaller number: divide.`]],
          hints: [toMg ? `Each mmol/L is worth ${factor} mg/dL.` : `Every ${factor} mg/dL make 1 mmol/L.`],
          explain: toMg
            ? r`$${mmol} \times ${factor} = ${mgdl}$ mg/dL. The two numbers describe the same blood. ${what === 'glucose' ? `(For glucose, a fasting value of ${DIABETES.fastingMmol} mmol/L, which is ${DIABETES.fastingMgDl} mg/dL, or more on two occasions is one of the ways diabetes is diagnosed.)` : 'Which LDL level calls for treatment depends on a person\'s overall risk, so there is no single cut-off.'}`
            : r`$${mgdl} \div ${factor} = ${mmol}$ mmol/L. The two numbers describe the same blood. ${what === 'glucose' ? `(For glucose, a fasting value of ${DIABETES.fastingMgDl} mg/dL, which is ${DIABETES.fastingMmol} mmol/L, or more on two occasions is one of the ways diabetes is diagnosed.)` : 'Which LDL level calls for treatment depends on a person\'s overall risk, so there is no single cut-off.'}`,
        };
      },
    },
    {
      id: 'hba1c',
      type: 'choice',
      title: 'A three-month memory',
      text: `
        Blood glucose swings through the day: up after meals, down between. For **type 2 diabetes**, which can go unnoticed for years, doctors often use a different test, **HbA1c**.

        Glucose sticks to haemoglobin, the red protein in red blood cells, and stays stuck for the life of the cell: about three to four months. HbA1c measures how much haemoglobin is coated.

        **What does HbA1c tell a doctor that one glucose reading cannot?**
      `,
      columns: 1,
      options: [
        { text: 'The average glucose level over the last two to three months', correct: true },
        { text: 'The exact glucose level at this moment', why: 'That is what a single glucose reading gives. HbA1c changes slowly, over weeks.' },
        { text: 'How much sugar the person ate yesterday', why: 'One day barely moves it: the coating builds up over the whole life of each red cell.' },
        { text: 'How much insulin the pancreas is making', why: 'It measures the result, glucose in the blood, and not the insulin. Insulin can be measured, but by a different test.' },
      ],
      explain: `
        Each red cell keeps a running record of the glucose it has been bathed in, so HbA1c is an **average over about three months**, with no need to fast.

        Diabetes is diagnosed at an HbA1c of ${DIABETES.hba1cPct}% (${DIABETES.hba1cMmolMol} mmol/mol) or above. Slightly raised levels below that are a warning that often can be turned back. Type 2 diabetes has many causes, genes and age among them, and it is nobody's fault.
      `,
    },
    {
      id: 'bmi',
      type: 'numeric',
      title: 'A number for populations',
      gen: (rng) => {
        const [height, weight] = rng.pick(BODIES);
        const answer = Math.round(bmi(weight, height) * 10) / 10;
        return {
          text: r`
            The **body mass index (BMI)** compares weight with height: $\text{BMI} = \dfrac{\text{weight in kg}}{(\text{height in m})^2}$.

            Health agencies use it to track whole populations. A worked example, for a height of 2 m and a weight of 88 kg: 2 × 2 = 4, and 88 ÷ 4 = 22.

            An example adult is **${num(height)} m** tall and weighs **${weight} kg**. **What is this person's BMI?** Round to one decimal place.
          `,
          answer,
          tolerance: 0.051,
          wrong: [
            [Math.round((weight / height) * 10) / 10, 'That divides by the height once. Square the height first.'],
            [Math.round(weight / (height * 2) * 10) / 10, 'Squaring means multiplying the height by itself, not by 2.'],
          ],
          hints: [r`First the height squared: $${num(height)} \times ${num(height)} = ${num(height * height, 4)}$.`, `Then ${weight} ÷ ${num(height * height, 4)}.`],
          explain: r`
            $${num(height)}^2 = ${num(height * height, 4)}$, and $${weight} \div ${num(height * height, 4)} \approx ${num(answer, 1)}$.

            Health agencies use BMI to track whole **populations**: across millions of people, risks of diabetes and heart disease climb as it rises above about ${BMI_BANDS[1]}, and also when it falls below about ${BMI_BANDS[0]}. For one person it is only a rough first look. It cannot tell muscle from fat, or say where fat is carried, and its bands fit some ethnic groups poorly. That is why waist size is often measured as well: fat around the organs matters most.
          `,
        };
      },
    },
    {
      id: 'risk-explore',
      type: 'interact',
      graded: false,
      title: 'How risks combine',
      text: `
        Doctors do not judge each number alone. They combine them into one figure: the chance of a heart attack or stroke in the next **ten years**.

        Sam is 55. Of 100 people like Sam with none of the risk factors below, about ${RISK_MODEL.base} would have one in that time. **Switch the factors on one at a time, then two or more together.**
      `,
      widget: { ...RISK, alt: 'One hundred dots stand for 100 people like Sam. Four switches turn risk factors on and off, and the number of people affected within ten years changes.' },
      check: (s) => s.on.length >= 2 || (s.on.length === 1 ? 'Now switch on a second factor as well, and compare.' : 'Tap one of the factors above the dots.'),
      solution: { on: ['smoking', 'bp'] },
      explain: `
        Risk factors **multiply**. Smoking alone doubles Sam's risk from 4 to 8 in 100. High blood pressure on top doubles it again, to 16. All four together make it 48.
      `,
    },
    {
      id: 'teach-risk',
      type: 'info',
      title: 'Multiply up, divide down',
      text: `
        Each factor in this model is a multiplier: ${RISK_MODEL.factors.map((f) => `${f.id === 'smoking' ? 'smoking' : f.label[0].toLowerCase() + f.label.slice(1)} ×${num(f.mult)}`).join(', ')}. Risks that multiply on the way up **divide** on the way down: dealing with a factor takes its multiplier away.

        :::example Worked example: all four factors, 48 in 100
        - Blood pressure brought down by treatment: 48 ÷ 2 = **24** in 100.
        - Smoking stopped as well: 24 ÷ 2 = **12** in 100.
        :::

        This is a teaching model with rounded numbers. Real calculators, built from the records of millions of people, work in a similar way, and also count things nobody can change: age, sex and family history.
      `,
      figure: { ...RISK, factors: RISK_MODEL.factors.map((f) => ({ ...f, on: true })), static: true, sentence: false, alt: 'One hundred dots stand for 100 people like Sam with all four risk factors: smoking, high blood pressure, high LDL cholesterol and diabetes. 48 of them are marked as affected within ten years, against 4 with none of the factors.' },
    },
    {
      id: 'risk-cut',
      type: 'interact',
      title: 'Turning it down',
      text: `
        Jo is the same age as Sam, smokes, and has high blood pressure and high LDL cholesterol: about 24 in 100 people like Jo would have a heart attack or stroke within ten years.

        Each of the three can be changed: by stopping smoking, and by treatment. **Find a way to bring the figure down to 8 in 100 or fewer.**
      `,
      widget: {
        ...RISK, factors: RISK_MODEL.factors.filter((f) => f.id !== 'diabetes').map((f) => ({ ...f, on: true })),
        words: { ...RISK.words, people: 'people like Jo' },
        alt: 'One hundred dots stand for 100 people like Jo. Three switches, all on at the start, stand for smoking, high blood pressure and high LDL cholesterol.',
      },
      check: (s) => {
        if (s.withCount <= 8) return true;
        return `${s.withCount} in 100 now. ${s.on.length === 3 ? 'Switch a factor off to see what dealing with it would do.' : 'One change helps. A second multiplies the gain.'}`;
      },
      solution: { on: ['ldl'] },
      hints: ['Switching a factor off stands for dealing with it. How many do you need to switch off?'],
      explain: `
        Dealing with any **two** of the three does it: from 24 in 100 down to 8 or 6. Because risks multiply, so do the gains.

        And the higher the starting risk, the more each change is worth. Halving a risk of 24 in 100 spares 12 people; halving a risk of 4 in 100 spares 2.
      `,
    },
    {
      id: 'risk-meaning',
      type: 'numeric',
      review: true,
      title: 'A probability, not a verdict',
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const [p, n] = rng.pick([[5, 20], [5, 200], [8, 50], [10, 50], [10, 200], [15, 20], [15, 200], [20, 50], [20, 200], [4, 50], [12, 50], [30, 20]]);
        const hit = (p * n) / 100;
        const askNot = rng.bool(0.4);
        return {
          text: `
            A risk calculator gives ${who} a ten-year risk of heart attack or stroke of **${p}%**. A percentage is a count out of 100: a risk of 25% would mean 25 in every 100 people, or 10 in a group of 40.

            Picture **${n}** people who match ${who} on everything the calculator knows. **About how many of them would be expected ${askNot ? '*not* to have' : 'to have'} a heart attack or stroke in the next ten years?**
          `,
          answer: askNot ? n - hit : hit,
          unit: 'people',
          wrong: [
            askNot ? [hit, 'That is how many *would* be expected to have one. The question asks about the others.'] : [n - hit, 'That is how many would *not*. The question asks about the ones who would.'],
            ...(p !== hit && p !== n - hit ? [[p, `${p}% means ${p} in every 100. This group has ${n} people.`]] : []),
          ],
          hints: [`${p}% means ${p} out of every 100.`, `${p}% of ${n} is ${n} × ${p} ÷ 100.`],
          explain: `${p}% of ${n} is **${hit}**, so ${n - hit} of the ${n} would not. The calculator cannot say which group ${who} belongs to. A risk is a statement about many people alike, which is what makes it useful for deciding whether a change or a treatment is worth it.`,
        };
      },
    },
    {
      id: 'changeable',
      type: 'bucket',
      review: true,
      title: 'What can be changed',
      text: 'These all raise the risk of heart disease and stroke. **Which can be changed (by a person, by treatment or by a whole society), and which can nobody change?**',
      buckets: ['Can be changed', 'Cannot be changed'],
      items: [
        { text: 'Smoking', bucket: 0 },
        { text: 'High blood pressure', bucket: 0, why: 'It responds to less salt, more activity, less alcohol and, where needed, medicines that are among the best tested there are.' },
        { text: 'High LDL cholesterol', bucket: 0, why: 'Diet shifts it somewhat, and medicines such as statins lower it a great deal.' },
        { text: 'Too little physical activity', bucket: 0 },
        { text: 'Polluted air', bucket: 0, why: 'It can be changed, though mostly by cities and governments, not by one person.' },
        { text: 'Getting older', bucket: 1, why: 'Age is the strongest risk factor of all, and the one nobody can alter.' },
        { text: 'A parent who had a heart attack young', bucket: 1, why: 'Family history cannot be changed. It is worth knowing, because it is a reason to check the other numbers earlier.' },
      ],
      explain: `
        The changeable list is the long one: tobacco, blood pressure, LDL cholesterol, blood glucose, inactivity, diet, alcohol and air pollution.

        "Can be changed" does not mean "easy" or "your fault". Income, work, housing and the air of the city you live in shape these numbers as much as personal choices do, and for many people medicines are part of the answer.
      `,
    },
    {
      id: 'try-it',
      type: 'info',
      title: 'Something to try this week',
      text: `
        One number you can find in a minute, if you like: your **resting pulse**. Sit quietly for a few minutes, rest two fingertips on the inside of your wrist below the thumb, as in the picture, and count the beats for 30 seconds. Double it.

        For adults at rest, ${RESTING_HR[0]} to ${RESTING_HR[1]} beats a minute is typical, and fit people are often lower. It varies from day to day, and nobody needs to write it down.

        :::note Check-ups
        A routine check-up usually covers blood pressure, a blood test for cholesterol and glucose, weight and waist, and questions about smoking and family history. Who is invited, and how often, differs between countries. Many pharmacies will measure blood pressure on the spot.
        :::
      `,
      figure: photo(MEDIA['pulse-wrist'], {
        alt: 'Two hands. One is held palm up; the tips of the index and middle fingers of the other rest on the inside of its wrist, just below the base of the thumb. Underneath is the title "On the Wrist".',
        caption: 'Feeling for the pulse at the wrist',
      }),
      cta: 'Finish',
    },
  ],
  recap: [
    'Most deaths today come from diseases that build silently for decades. Heart attacks and strokes start with plaque in artery walls.',
    `**Blood pressure**: two numbers, judged on the average of resting readings. What counts as high differs (${BP_GUIDELINES.europe.highFrom.join('/')} in Europe, ${BP_GUIDELINES.us.highFrom.join('/')} in the United States), and it usually causes no symptoms.`,
    '**LDL cholesterol** feeds the plaque; **HbA1c** is a three-month average of blood glucose; **BMI** is a rough guide made for populations.',
    'Risk factors multiply, so dealing with two or three brings the risk down fast. A ten-year risk is a probability about many people alike, not a verdict on one.',
  ],
  next: 'Next: looking for disease in people who feel perfectly well. It sounds like pure gain, and it is not that simple.',
};
