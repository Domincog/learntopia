// Food and Nutrition · Lesson 6 · Water, Salt and What to Drink
//
// Driving question: how much do you really need to drink, and why does salt matter to blood pressure?
import { WATER, WATER_BALANCE, SALT, SODIUM_SOURCES, SALT_FOODS, CAFFEINE, CAFFEINE_DRINKS, PEOPLE, dp1, grouped } from '../helpers.js';

const litres = (mL) => mL / 1000;
const IN = WATER_BALANCE.in;
const OUT = WATER_BALANCE.out;
// Fuller names for the rows of the water-in table on the teaching screen.
const IN_NAMES = { Drinks: 'Drinks', Food: 'Water in food', 'Made in cells': 'Made inside the cells' };
// Short labels for the caffeine chart, and a drink's caffeine by id.
const CAFFEINE_LABELS = { filter: 'Filter\ncoffee', espresso: 'Espresso', energy: 'Energy\ndrink', tea: 'Black\ntea', cola: 'Cola' };
const caffeineOf = (id) => CAFFEINE_DRINKS.find((d) => d.id === id).mg;

// Change in average systolic blood pressure when a population's salt intake changes, relative to about 11 g a day
// (the world average). Slopes from the pooled trials of He, Li & MacGregor (Cochrane review, BMJ 2013): 4.4 g less
// salt a day lowered systolic pressure by 5.4 mmHg in people with high blood pressure and by 2.4 mmHg in others.
const WORLD_SALT = 11;
const SLOPE_HIGH = 1.2;
const SLOPE_OTHER = 0.55;

const LUIS_DAY = ['bread', 'ham', 'cheese', 'soup', 'pizza', 'crisps'];
const saltItem = (id) => SALT_FOODS.find((f) => f.id === id);
const LUIS_TOTAL = Math.round(LUIS_DAY.reduce((t, id) => t + saltItem(id).g, 0) * 10) / 10;

const SODIUM_LABELS = [200, 400, 480, 600, 800, 920, 1200, 1600];
const SODIUM_FOODS = ['a tin of soup', 'a burger', 'a ready meal', 'a packet of noodles', 'a deli sandwich', 'a slice of pizza', 'a pot of instant ramen'];

export default {
  id: 'water-salt',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Eight glasses',
      text: `
        "Drink eight glasses of water a day." Almost everyone has heard it.

        **Where do you think the rule comes from?**
      `,
      options: [
        { text: 'A 1945 recommendation, minus its second sentence', correct: true },
        { text: 'A large trial comparing six, eight and ten glasses' },
        { text: 'Measurements of how much water the kidneys use' },
        { text: 'A long-term study of people who drank more or less' },
      ],
      columns: 1,
      explain: `
        Most likely the first. In 1945 a US nutrition board suggested about
        2.5 litres of water a day for adults, and went on: *"Most of this
        quantity is contained in prepared foods."* The second sentence was
        forgotten.

        A physiologist who went looking for the evidence behind "8 × 8" in
        2002 found none. The body's real water budget looks different.
      `,
    },
    {
      id: 'teach-budget',
      type: 'info',
      title: 'The water budget',
      text: `
        An adult at rest in mild weather takes in about **2.5 litres** of
        water a day, and loses the same amount.

        | Water in | mL a day |
        |---|:-:|
        ${IN.map((row) => `| ${IN_NAMES[row.name]} | ${grouped(row.mL)} |`).join('\n        ')}

        Fruit, vegetables, soup, rice and bread are all partly water, and
        cells make a little water whenever they burn fuel (*Burning Fuel*,
        in The Body I).

        The bars show where the same 2.5 litres go.
      `,
      figure: {
        type: 'bars', yMax: 2, yStep: 0.5, unit: 'L', digits: 1, yLabel: 'water out, litres a day',
        data: OUT.map((row, i) => ({ label: row.name.replace(' and ', '\nand '), value: litres(row.mL), color: ['yellow', 'orange', 'teal', 'gray'][i] })),
        alt: `Bar chart of the water an adult at rest loses in a day: ${OUT.map((row) => `${row.name.toLowerCase()} ${litres(row.mL)} litres`).join(', ')}.`,
        caption: 'Water out: typical values for an adult at rest. Heat and exercise shift them a great deal.',
      },
    },
    {
      id: 'sources',
      type: 'interact',
      title: 'Water in',
      text: `
        An adult at rest in mild weather takes in about **2.5 litres** of
        water a day. It arrives by three routes.

        **Drag the bars** to show roughly how many litres come from each.
      `,
      widget: {
        type: 'bars', adjust: true, step: 0.1, yMax: 2.5, yStep: 0.5, unit: 'L', digits: 1, yLabel: 'litres a day',
        data: [
          { label: 'Drinks', value: 1, color: 'blue' },
          { label: 'Water\nin food', value: 1, color: 'green' },
          { label: 'Made inside\nthe cells', value: 1, color: 'gray' },
        ],
        alt: 'Three adjustable bars for the litres of water a day that come from drinks, from the water in food, and from water made inside the cells.',
      },
      check: (s) => s.values[0][0] > s.values[0][1] && s.values[0][1] > s.values[0][2],
      solution: { values: [IN.map((row) => litres(row.mL))] },
      hints: ['Drinks supply the most, and the cells the least.'],
      explain: `
        Roughly **${litres(IN[0].mL)} L from drinks, ${litres(IN[1].mL)} L from
        food and ${litres(IN[2].mL)} L made in the cells**. So about
        two fifths of the day's water does not come out of a glass at all.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'How much is enough?',
      text: `
        Expert bodies set an "adequate intake" for **total** water, from
        drinks and food together:

        | | Women | Men |
        |---|:-:|:-:|
        | European Food Safety Authority | ${WATER.efsa.women.toFixed(1)} L | ${WATER.efsa.men} L |
        | US National Academies | ${WATER.us.women} L | ${WATER.us.men} L |

        They differ because they are based on what healthy people in each
        place typically drink, and because nobody needs an exact amount.
        Need rises with heat, exercise, fever, pregnancy and breastfeeding.

        The fine control is automatic. When the blood becomes slightly too
        concentrated, the brain makes you **thirsty** and tells the kidneys
        to save water (*Keeping the Balance*, in The Body I). For most
        healthy adults, thirst is a good guide. It is less reliable in old
        age and in young children.
      `,
    },
    {
      id: 'teach-limits',
      type: 'info',
      title: 'What counts, and what is too much',
      text: `
        **All drinks count**, and so does the water inside food. Milk, tea,
        coffee and soup hydrate too: the kidneys do not check where water
        came from. Caffeine makes the kidneys pass a little more water, but
        in regular drinkers the effect is small. In a controlled trial,
        moderate amounts of coffee hydrated as well as water.

        **More is not better.** The kidneys can clear only about a litre an
        hour, and less during hard exercise. Drinking far more than that
        dilutes the sodium in the blood. This is rare, but dangerous.
      `,
    },
    {
      id: 'water-truths',
      type: 'multi',
      review: true,
      text: '**Which of these statements about water are true?**',
      options: [
        { text: 'Tea and coffee count towards fluid intake', correct: true },
        { text: 'Food supplies about a fifth to a third of the water people take in', correct: true },
        { text: 'For most healthy adults, drinking when thirsty is enough', correct: true },
        { text: 'Only plain water hydrates', why: 'Milk, tea, coffee, soup and the water inside food all count. The kidneys do not check where water came from.' },
        { text: 'It is impossible to drink too much water', why: 'Drinking far more than the kidneys can pass out dilutes the blood. That is rare, but dangerous.' },
      ],
      explain: `
        Caffeine makes the kidneys pass a little more water, but in regular
        drinkers the effect is small: in a controlled trial, moderate
        amounts of coffee hydrated as well as water.

        Pale straw-coloured urine is a sign of being well supplied. It does
        not need to be colourless.
      `,
    },
    {
      id: 'too-much',
      type: 'choice',
      tone: 'sober',
      title: 'Too much of a good thing',
      text: `
        A recreational runner in a marathon drinks at every water station,
        far more than she is sweating out, because she has been told to
        "stay ahead of thirst".

        **What is the danger?**
      `,
      options: [
        { text: 'The sodium in her blood becomes too dilute', correct: true },
        { text: 'Her blood becomes too salty', why: 'The other way round. The extra water dilutes the sodium in her blood.' },
        { text: 'Her stomach cannot absorb the water', why: 'Water is absorbed easily. The trouble starts when more is absorbed than the kidneys can remove.' },
        { text: 'None: extra water is simply passed out', why: 'Usually it is, but the kidneys can clear only about a litre an hour, and less during hard exercise.' },
      ],
      columns: 1,
      explain: `
        When blood sodium is diluted (**hyponatraemia**), water moves into
        cells and they swell. In the brain that causes headache, confusion
        and seizures, and it can kill. In one study of Boston Marathon
        finishers, about one in eight had low blood sodium.

        Sports medicine guidance is now: drink to thirst. Confusion or a
        seizure after long exercise is an emergency: call your emergency
        number.
      `,
    },
    {
      id: 'pressure',
      type: 'interact',
      title: 'Salt and pressure',
      text: `
        Table salt is sodium chloride. **Sodium** holds water in the blood:
        more sodium, more fluid in the vessels, more pressure on their walls.

        The lines sum up trials in which people ate less salt for at least
        four weeks. They show the average change in the upper
        blood-pressure number, starting from the world's average intake of
        about ${WORLD_SALT} g of salt a day.

        **Bring salt down to the WHO's limit of ${SALT.whoMaxG} g.**
      `,
      widget: {
        type: 'plot', height: 300, x: [2, 14], y: [-12, 6], xStep: 1, yStep: 2,
        yLabel: 'change in blood pressure (mmHg)',
        params: { s: { min: 3, max: 14, step: 0.5, value: WORLD_SALT, label: 'salt eaten a day', color: 'orange', unit: 'g' } },
        fns: [
          { expr: `${SLOPE_HIGH}*(x - ${WORLD_SALT})`, color: 'red' },
          { expr: `${SLOPE_OTHER}*(x - ${WORLD_SALT})`, color: 'blue', dashed: true },
        ],
        points: [{ id: 'H', x: 's', on: 0, color: 'red' }, { id: 'N', x: 's', on: 1, color: 'blue' }],
        vlines: [{ x: 's', color: 'gray', dashed: true }],
        labels: [{ x: 6.4, y: -9.6, text: 'people with high blood pressure', color: 'red' }, { x: 2.4, y: -6.4, text: 'everyone else', color: 'blue' }, { x: 11.4, y: -11.2, text: 'salt, g a day' }],
        readouts: [
          { label: 'with high blood pressure', expr: 'f0(s)', digits: 1, unit: 'mmHg', color: 'red' },
          { label: 'everyone else', expr: 'f1(s)', digits: 1, unit: 'mmHg', color: 'blue' },
        ],
        alt: 'Two straight lines showing how average blood pressure changes with daily salt intake, starting from 11 grams a day. The line for people with high blood pressure is steeper than the line for everyone else. A slider sets the salt intake.',
      },
      check: (s) => {
        if (Math.abs(s.s - SALT.whoMaxG) < 0.01) return true;
        return s.s > SALT.whoMaxG ? `That is ${dp1(s.s)} g a day. The WHO's limit is lower.` : `That is ${dp1(s.s)} g a day: below the WHO's limit of ${SALT.whoMaxG} g. Slide back up to it.`;
      },
      solution: { s: SALT.whoMaxG },
      explain: `
        From ${WORLD_SALT} g to ${SALT.whoMaxG} g, pressure falls by about
        **7 mmHg** in people with high blood pressure and about **3 mmHg** in
        everyone else, on average.

        That sounds small. Across a whole population it is not: each 5 mmHg
        is worth roughly a tenth fewer strokes and heart attacks. This is
        strong evidence, from many trials. People do differ in how strongly
        they respond.
      `,
    },
    {
      id: 'sodium-salt',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const mg = rng.pick(SODIUM_LABELS);
        const what = rng.pick(SODIUM_FOODS);
        const answer = (mg * 25) / 10000;
        return {
          text: `
            Some labels list **sodium**, others **salt**. Salt is only 40%
            sodium by weight, so: salt = sodium × 2.5.

            A label in the United States says ${what} contains
            **${mg >= 1000 ? `${Math.floor(mg / 1000)},${String(mg % 1000).padStart(3, '0')}` : mg} mg of sodium**.
            **How many grams of salt is that?**

            For example, 300 mg of sodium is 0.3 g, and 0.3 × 2.5 = 0.75 g of salt.
          `,
          answer,
          unit: 'g of salt',
          wrong: [
            [mg / 1000, 'That is the sodium, in grams. Salt weighs 2.5 times as much as the sodium in it.'],
            [(mg * 2.5), 'That is the salt in milligrams. There are 1,000 mg in a gram.'],
            [mg / 2500, 'That divides by 2.5. The salt weighs more than its sodium: multiply.'],
          ],
          hints: [`First turn milligrams into grams: ${mg} mg = ${mg / 1000} g of sodium.`, 'Then multiply by 2.5.'],
          explain: `${mg} mg = ${mg / 1000} g of sodium, and ${mg / 1000} × 2.5 = **${answer} g of salt**. The WHO's limit of ${SALT.whoMaxG} g of salt a day is the same as ${SALT.sodiumMaxG} g (2,000 mg) of sodium.`,
        };
      },
    },
    {
      id: 'salt-sources',
      type: 'interact',
      mode: 'predict',
      title: 'Where the salt comes from',
      text: `
        The WHO advises adults to stay **under ${SALT.whoMaxG} g of salt a
        day**: about a level teaspoon. The world average is more than
        twice that.

        Researchers in the United States traced every milligram of sodium
        that 450 adults ate. **Drag the bars** to show where you think it
        came from.
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 100, yStep: 20, unit: '%', yLabel: '% of the sodium eaten',
        data: SODIUM_SOURCES.map((src, i) => ({ label: src.name, value: 25, color: ['orange', 'green', 'teal', 'violet'][i] })),
        alt: 'Four adjustable bars for the share of sodium that comes from processed and restaurant food, from sodium naturally in foods, from salt added in home cooking, and from salt added at the table.',
      },
      check: (s) => s.values[0][0] > 50,
      solution: { values: [SODIUM_SOURCES.map((src) => src.pct)] },
      explain: `
        | Source | Share |
        |---|:-:|
        | Processed and restaurant food | ${SODIUM_SOURCES[0].pct}% |
        | Naturally in foods | ${SODIUM_SOURCES[1].pct}% |
        | Added in home cooking | ${SODIUM_SOURCES[2].pct}% |
        | Added at the table | ${SODIUM_SOURCES[3].pct}% |

        The salt shaker is a minor player there. Most salt is already in
        food when it is bought: bread, cheese, cured meat, sauces, ready
        meals. In countries such as China and Japan, more comes from salt
        and soy sauce added in the kitchen.
      `,
    },
    {
      id: 'salt-day',
      type: 'interact',
      title: 'It adds up',
      text: `
        Luis never adds salt to anything. Today he ate two slices of
        **bread** with **ham** and **cheese**, a bowl of tinned **soup**,
        half a frozen **pizza** and a small bag of **crisps**.

        **Tap those six foods** and watch the total.
      `,
      widget: {
        type: 'serving-tally', what: 'salt', unit: 'g', decimals: 1, target: SALT.whoMaxG, targetLabel: 'WHO limit', scaleMax: 10,
        items: SALT_FOODS.map((f) => ({ id: f.id, name: f.name, amount: f.g })),
        alt: 'A bar that adds up the salt in the foods chosen, with a dashed line at 5 grams. Buttons add ten everyday foods.',
      },
      check: (s) => {
        const missing = LUIS_DAY.filter((id) => !s.picked.includes(id));
        const extra = s.picked.filter((id) => !LUIS_DAY.includes(id));
        if (extra.length) return `Luis did not eat ${saltItem(extra[0]).name} today. Tap it again to take it out.`;
        if (missing.length) return `Not everything is in yet: add ${saltItem(missing[0]).name}.`;
        return true;
      },
      solution: { picked: LUIS_DAY },
      explain: `
        **${LUIS_TOTAL} g** of salt, well past the ${SALT.whoMaxG} g line,
        without a salt shaker in sight. None of these foods tastes
        especially salty, which is the point: salt in bread, cheese and
        sauces goes unnoticed.

        This is why countries that have lowered salt intake did it mainly
        by getting manufacturers to put less in.
      `,
    },
    {
      id: 'teach-potassium',
      type: 'info',
      title: 'The counterweight',
      text: `
        **Potassium**, plentiful in fruit, vegetables, beans, potatoes and
        milk, works against sodium: it helps the kidneys pass sodium out and
        relaxes vessel walls.

        A large trial put this to the test (SSaSS, 2021). In 600 villages in
        China, 21,000 older people at high risk were followed for five
        years. Half the villages were given a salt substitute in which a
        quarter of the sodium chloride was replaced by potassium chloride.

        In those villages strokes fell by about 14% and deaths by about
        12%. People with kidney disease had been excluded, because extra
        potassium can harm them.
      `,
    },
    {
      id: 'potassium',
      type: 'choice',
      title: 'The counterweight',
      text: `
        In 600 villages in China, 21,000 older people at high risk were
        followed for five years. Half the villages were given a salt
        substitute in which a quarter of the sodium chloride was replaced by
        potassium chloride.

        **What happened in the villages that used the substitute?**
      `,
      options: [
        { text: 'Fewer strokes and fewer deaths', correct: true },
        { text: 'No difference at all', why: 'There was a clear difference: strokes fell by about 14% and deaths by about 12%.' },
        { text: 'Blood pressure fell, but strokes did not', why: 'Both fell. Strokes were about 14% less common in the villages using the substitute.' },
        { text: 'More heart problems from the potassium', why: 'No increase in harm from high potassium was seen in this trial, although people with kidney disease had been excluded.' },
      ],
      columns: 1,
      explain: `
        **About 14% fewer strokes and 12% fewer deaths** (the SSaSS trial,
        2021). Less sodium and more potassium, with nothing else changed.

        In 2025 the WHO suggested such substitutes for general household
        use. One caution: people with kidney disease, or on certain
        blood-pressure medicines, can be harmed by extra potassium and
        should ask a doctor first.
      `,
    },
    {
      id: 'teach-sweeteners',
      type: 'info',
      title: 'What is in the glass',
      text: `
        Water is the default drink in every national guide; unsweetened tea,
        coffee and milk are generally fine. The firmest finding concerns
        **sugary drinks**: strong evidence links them to weight gain, type 2
        diabetes and tooth decay.

        On **sweeteners** the evidence is thinner.

        - **Weight: mixed.** Short trials show a small benefit; long-term
          studies do not. In 2023 the WHO advised against relying on
          sweeteners for weight control, while calling the evidence low in
          certainty.
        - **Cancer: weak.** In 2023 one WHO agency rated aspartame
          "possibly" cancer-causing on limited evidence. The WHO and FAO
          committee that sets safe intakes reviewed the same studies and
          kept its daily limit unchanged.
      `,
    },
    {
      id: 'drinks',
      type: 'bucket',
      review: true,
      title: 'What is in the glass',
      text: 'Claims about drinks differ greatly in how well they are supported. **Sort them.**',
      // Two groups on purpose: whether a weakly supported claim is "uncertain" or "not supported" is a matter of
      // judgement, and a graded step must not mark a defensible answer wrong. The `why` lines say which is which.
      buckets: ['Strong evidence', 'Weak, mixed or no evidence'],
      items: [
        { text: 'Sugary drinks raise the risk of weight gain, type 2 diabetes and tooth decay', bucket: 0 },
        { text: 'More salt means higher blood pressure across a population', bucket: 0 },
        { text: 'Drinks with sweeteners in place of sugar help to control body weight in the long run', bucket: 1, why: 'Mixed. Short trials show a small benefit; long-term studies do not. In 2023 the WHO advised against relying on sweeteners for weight control, while calling the evidence low in certainty.' },
        { text: 'Sweeteners at ordinary intakes cause cancer', bucket: 1, why: 'Weak. In 2023 one WHO agency rated aspartame "possibly" cancer-causing on limited evidence; the WHO and FAO committee that sets safe intakes reviewed the same studies and kept its daily limit unchanged. Not shown, and not entirely ruled out.' },
        { text: 'A glass of fruit juice is as good as the whole fruit', bucket: 1, why: 'Not supported. Juice has lost most of the fibre, and its sugars count as free sugars. Many guides suggest keeping it to a small glass a day.' },
        { text: 'Everyone needs eight glasses of plain water a day', bucket: 1, why: 'No evidence. No study supports the figure. Needs vary, and food and other drinks count.' },
      ],
      explain: `
        Water is the default drink in every national guide; unsweetened tea,
        coffee and milk are generally fine. The firmest finding concerns
        **sugary drinks**. On sweeteners, honest answers still include
        "nobody knows yet".

        Alcohol supplies energy (7 kcal per gram) but nothing the body
        needs: see *Alcohol, Tobacco and Other Drugs*, in Staying Well.
      `,
    },
    {
      id: 'teach-caffeine',
      type: 'info',
      title: 'Caffeine',
      text: `
        Coffee, tea, cola and energy drinks contain **caffeine**. The bars
        show typical amounts in one serving. Real cups vary a great deal.

        The European Food Safety Authority found that up to about
        **${CAFFEINE.adultDayMg} mg a day** raises no safety concern for most
        healthy adults, and ${CAFFEINE.pregnancyDayMg} mg a day in pregnancy.

        :::example Adding up drinks
        Two mugs of black tea and one espresso hold
        2 × ${caffeineOf('tea')} + ${caffeineOf('espresso')} = ${2 * caffeineOf('tea') + caffeineOf('espresso')} mg.
        :::
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 20, unit: 'mg', yLabel: 'caffeine in one serving (mg)',
        data: CAFFEINE_DRINKS.map((d) => ({ label: CAFFEINE_LABELS[d.id], value: d.mg, color: 'orange' })),
        alt: `Bar chart of the caffeine in typical servings: ${CAFFEINE_DRINKS.map((d) => `${d.name}, ${d.mg} mg`).join('; ')}.`,
        caption: 'Typical amounts (EFSA, 2015).',
      },
    },
    {
      id: 'caffeine',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const picks = rng.sample(CAFFEINE_DRINKS, 3).map((d) => ({ ...d, n: rng.int(1, 2) }));
        const total = picks.reduce((t, d) => t + d.n * d.mg, 0);
        const words = (d) => (d.n === 1 ? d.name : `two ${d.name.replace(/^an? /, '').replace(/^(mug|can|espresso)/, (m) => (m === 'espresso' ? 'espressos' : `${m}s`))}`);
        return {
          text: `
            For most healthy adults, up to about **${CAFFEINE.adultDayMg} mg of
            caffeine a day** raises no safety concern (${CAFFEINE.pregnancyDayMg} mg
            in pregnancy). Typical amounts: ${picks.map((d) => `${d.name}, ${d.mg} mg`).join('; ')}.

            Today ${who} had ${words(picks[0])}, ${words(picks[1])} and ${words(picks[2])}.
            **How much caffeine is that?**
          `,
          answer: total,
          unit: 'mg',
          wrong: picks.some((d) => d.n > 1) ? [[picks.reduce((t, d) => t + d.mg, 0), 'That counts one of each. Some of them were drunk twice.']] : [],
          hints: [picks.map((d) => (d.n > 1 ? `${d.n} × ${d.mg}` : `${d.mg}`)).join(' + ')],
          explain: `${picks.map((d) => (d.n > 1 ? `${d.n} × ${d.mg}` : `${d.mg}`)).join(' + ')} = **${total} mg**, ${total > CAFFEINE.adultDayMg ? `above the ${CAFFEINE.adultDayMg} mg guide` : `within the ${CAFFEINE.adultDayMg} mg guide`}. Real cups vary a great deal, and so do people: caffeine late in the day can spoil sleep at much lower amounts (*Sleeping Well*, in Sleep, Stress and Mental Health).`,
        };
      },
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice',
      text: `
        If you are curious, compare the **salt per 100 g** on two versions
        of something you often buy: two breads, two soups, two sauces. The
        range between brands is often twofold or more.

        :::note
        Advice on fluids and salt is different for some people, such as
        those with heart or kidney disease, and for babies. Their doctor's
        guidance comes first.
        :::
      `,
      cta: 'Done',
    },
  ],
  recap: [
    'An adult turns over about **2.5 litres** of water a day. Food and all drinks count, and for most healthy adults thirst is a good guide; "eight glasses" has no evidence behind it.',
    'Drinking far more than the kidneys can clear dilutes blood sodium, which is dangerous.',
    '**Sodium** holds water in the blood and raises blood pressure. The WHO limit is under **5 g of salt** (2 g of sodium) a day; most of it comes ready-added in bought food.',
    'Potassium from fruit, vegetables and pulses works the other way. Among drinks, the strongest evidence of harm concerns sugary ones.',
  ],
  next: 'Next: putting it together. What the healthiest ways of eating have in common, and how to read a label and a headline.',
};
