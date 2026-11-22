// Food and Nutrition · Lesson 1 · What Food Is For
//
// Driving question: what does a calorie on a label actually count, and what does it leave out?
import { foods, food, kcalOf, grams, KCAL_PER_G, SATIETY, THERMIC, grouped } from '../helpers.js';

const EXPLORE = foods('oil', 'almonds', 'cheese', 'white', 'lentils', 'potato', 'apple', 'broccoli');
// The worked example before the label arithmetic: a real food whose grams no generated product can have.
const CHEESE = food('cheese');

// Invented products for the label arithmetic: grams per 100 g within believable ranges (never more than 97 g
// together, so that some water is left), no fibre to keep the sum short.
const PRODUCTS = [
  { name: 'a plain yogurt', c: [4, 7], p: [3, 6], f: [1, 4] },
  { name: 'a soft cheese', c: [1, 3], p: [8, 14], f: [10, 25] },
  { name: 'a rice pudding', c: [14, 20], p: [2, 4], f: [1, 4] },
  { name: 'a cream cracker', c: [60, 66], p: [8, 11], f: [10, 16] },
  { name: 'a nut butter', c: [8, 14], p: [20, 28], f: [45, 55] },
  { name: 'a bean stew', c: [8, 14], p: [5, 8], f: [1, 5] },
  { name: 'a shortbread biscuit', c: [55, 60], p: [5, 6], f: [25, 30] },
  { name: 'a fish finger', c: [14, 20], p: [11, 15], f: [7, 11] },
];
const SOURCE_NAMES = { carb: 'Carbohydrate', protein: 'Protein', fat: 'Fat' };

export default {
  id: 'energy-balance',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Same weight, different fuel',
      text: `
        Put 100 grams of **apple** on one plate and 100 grams of **olive oil**
        in a cup beside it. Same weight.

        The apple carries about 50 kilocalories of energy.
        **How much does the olive oil carry?**
      `,
      shuffle: false,
      options: [
        { text: 'About the same' },
        { text: 'About 3 times as much' },
        { text: 'About 8 times as much' },
        { text: 'About 18 times as much', correct: true },
      ],
      explain: `
        About **18 times** as much: roughly 900 kilocalories against 50.

        Nothing mysterious is going on. The two foods are simply made of
        different things, and this lesson is about what those things are,
        what your body does with them, and what the number on a label
        really counts.
      `,
    },
    {
      id: 'teach-jobs',
      type: 'info',
      title: 'Three jobs',
      text: `
        > **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.

        Food does three jobs for a body, and water carries them all.

        - **Fuel**: energy to run every cell. Mostly carbohydrate and fat.
        - **Building material** for growth and repair. Mostly protein, with
          some minerals.
        - **Regulators**: tiny amounts that make the chemistry work. These
          are the vitamins and minerals.

        Carbohydrate, fat and protein are needed in grams, so they are called
        **macronutrients**. Vitamins and minerals are needed in thousandths or
        millionths of a gram: **micronutrients**.
      `,
    },
    {
      id: 'three-jobs',
      type: 'match',
      title: 'Three jobs',
      text: `
        **Match each job to what mostly does it.**
      `,
      pairs: [
        ['Fuel: energy to run every cell', 'carbohydrate and fat'],
        ['Building material for growth and repair', 'protein (and some minerals)'],
        ['Regulators: tiny amounts that make the chemistry work', 'vitamins and minerals'],
        ['The liquid everything happens in', 'water'],
      ],
      explain: `
        **Fuel, building material, regulators**, all carried in water. The
        jobs overlap: protein can be burned as fuel, and fat is also built
        into the membrane of every cell.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Take eight foods apart',
      text: `
        Here are 100 grams of eight foods. The top bar shows what each is
        **made of**. The bottom bar shows the **energy** those grams carry.

        **Look at at least four foods**, including the one you expect to have
        the most energy and the one you expect to have the least.
      `,
      widget: { type: 'food-makeup', foods: EXPLORE, food: 'white', alt: 'Two bars for 100 grams of a food: what it is made of by weight, and where its energy comes from. Buttons switch between eight foods.' },
      check: (s) => s.seenCount >= 4 || `You have looked at ${s.seenCount} so far. Try a few more, such as the oil and the apple.`,
      solution: { seen: ['white', 'oil', 'apple', 'lentils'] },
      explain: `
        Two things decide the length of the energy bar.

        **Water** weighs something and carries no energy. An apple or a
        boiled potato is mostly water, so its energy bar is short.

        **Fat** carries more energy in each gram than anything else. Oil is
        all fat and no water: the longest bar there can be.
      `,
    },
    {
      id: 'energy-per-gram',
      type: 'fill',
      review: true,
      text: `
        Read the table under the bars: it works for any food.

        **How much energy does one gram of each nutrient carry?**
      `,
      figure: { type: 'food-makeup', foods: [food('almonds')], static: true, alt: 'Almonds, per 100 grams: water 4 g, carbohydrate 9 g, fibre 12 g, protein 21 g, fat 50 g. A table gives the energy per gram of each: water 0, carbohydrate 4, fibre 2, protein 4, fat 9 kilocalories.' },
      template: 'Carbohydrate: [[4]] kcal per gram. Protein: [[4]] kcal per gram. Fat: [[9]] kcal per gram. Water: [[0]] kcal per gram.',
      explain: `
        **4, 4, 9 and 0.** Gram for gram, fat carries more than twice the
        energy of carbohydrate or protein, and water carries none. Fibre
        gives about 2, because gut bacteria can break down only part of it.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'What a calorie is',
      text: `
        The "calorie" on a food label is a **kilocalorie** (kcal): the energy
        that warms one litre of water by 1 °C. Many countries print
        **kilojoules** (kJ) as well, or instead: 1 kcal is about 4.2 kJ.

        | In one gram | kcal | kJ |
        |---|:-:|:-:|
        | Carbohydrate | 4 | 17 |
        | Protein | 4 | 17 |
        | Fat | 9 | 37 |
        | Alcohol | 7 | 29 |

        Alcohol carries energy, but the body has no need for it, so it is
        not counted as a nutrient.

        How much energy a food packs into each gram is its **energy
        density**. Water and fibre lower it. Fat raises it.
      `,
    },
    {
      id: 'example-label',
      type: 'info',
      title: 'From grams to energy',
      text: `
        A label lists grams, and the energy follows from them. Take
        ${CHEESE.name.toLowerCase()}: 100 g contains ${grams(CHEESE.carb)} of
        carbohydrate, ${CHEESE.protein} g of protein and ${CHEESE.fat} g of fat.
        Most of the rest is water.

        :::example Worked example
        Multiply each nutrient's grams by its energy per gram, then add.

        - Carbohydrate: ${CHEESE.carb} × 4 = ${4 * CHEESE.carb} kcal
        - Protein: ${CHEESE.protein} × 4 = ${4 * CHEESE.protein} kcal
        - Fat: ${CHEESE.fat} × 9 = ${9 * CHEESE.fat} kcal

        Together: ${4 * CHEESE.carb} + ${4 * CHEESE.protein} + ${9 * CHEESE.fat} = **${kcalOf(CHEESE)} kcal**.
        :::

        The three lines also show where the energy comes from. Here most of
        it comes from fat, although fat is only a third of the weight.
      `,
      figure: { type: 'food-makeup', foods: [CHEESE], static: true, alt: `${CHEESE.name}, per 100 grams: water ${CHEESE.water} g, carbohydrate ${CHEESE.carb} g, protein ${CHEESE.protein} g, fat ${CHEESE.fat} g. A table multiplies each by its energy per gram: carbohydrate ${4 * CHEESE.carb}, protein ${4 * CHEESE.protein} and fat ${9 * CHEESE.fat} kilocalories, ${kcalOf(CHEESE)} in all.` },
    },
    {
      id: 'label-energy',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const item = rng.pick(PRODUCTS);
        const c = rng.int(item.c[0], item.c[1]);
        const p = rng.int(item.p[0], item.p[1]);
        const f = rng.int(item.f[0], item.f[1]);
        const answer = KCAL_PER_G.carb * c + KCAL_PER_G.protein * p + KCAL_PER_G.fat * f;
        return {
          text: `
            The label of ${item.name} says that 100 g contains
            **${c} g of carbohydrate**, **${p} g of protein** and
            **${f} g of fat** (the rest is water).

            **How much energy is in that 100 g?** Use 4, 4 and 9 kcal per gram.
          `,
          answer,
          unit: 'kcal',
          wrong: [
            [4 * (c + p + f), 'That counts 4 kcal for every gram. A gram of fat carries 9.'],
            [c + p + f, 'That adds up the grams. Each gram of carbohydrate or protein carries 4 kcal, and each gram of fat 9.'],
            [9 * (c + p + f), 'Only fat carries 9 kcal per gram. Carbohydrate and protein carry 4.'],
          ],
          hints: [
            `Carbohydrate: ${c} × 4. Protein: ${p} × 4. Fat: ${f} × 9.`,
            `${4 * c} + ${4 * p} + ${9 * f}`,
          ],
          explain: `Carbohydrate ${c} × 4 = ${4 * c}, protein ${p} × 4 = ${4 * p}, fat ${f} × 9 = ${9 * f}. Together: ${4 * c} + ${4 * p} + ${9 * f} = **${grouped(answer)} kcal** in 100 g.`,
        };
      },
    },
    {
      id: 'build',
      type: 'interact',
      title: 'A little fat goes a long way',
      text: `
        Now you set the grams. Water fills whatever is left of the 100 g.

        **Build a food in which more than half of the energy comes from fat,
        although fat is less than a third of its weight.**
      `,
      widget: { type: 'food-makeup', build: true, step: 5, grams: { carb: 40, fibre: 5, protein: 10, fat: 5 }, alt: 'Two bars for 100 grams of a food you build with four sliders: carbohydrate, fibre, protein and fat. Water fills the rest.' },
      check: (s) => {
        if (s.kcal === 0) return 'This food has no energy at all yet. Add some carbohydrate, protein or fat.';
        if (s.grams.fat >= 100 / 3) return `Fat is ${s.grams.fat} g of the 100 g: that is a third of the weight or more. Use less fat, and look at the other sliders.`;
        if (9 * s.grams.fat * 2 > s.kcal) return true;         // more than half of the energy, worked out exactly
        return `Fat supplies ${s.share.fat}% of the energy so far: not more than half. Make the fat's share bigger, or the others' smaller.`;
      },
      solution: { grams: { carb: 20, fibre: 5, protein: 10, fat: 20 } },
      hints: ['Each gram of fat counts 9, each gram of carbohydrate or protein only 4.', 'Try 20 g of fat with 20 g of carbohydrate and 10 g of protein.'],
      explain: `
        One recipe: 20 g of fat, 20 g of carbohydrate, 10 g of protein and
        5 g of fibre. Fat is a fifth of the weight, yet it supplies
        180 of the 310 kcal: 58%.

        Many everyday foods are like this: cheese, pastry, chocolate,
        sausages. It is plain arithmetic, not a verdict on any of them.
      `,
    },
    {
      id: 'top-source',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        // work backwards from which nutrient should win, and keep the two leaders well apart
        let c; let p; let f; let e; let order;
        do {
          c = rng.int(2, 14) * 5;
          p = rng.int(1, 6) * 5;
          f = rng.int(1, 8) * 5;
          e = { carb: 4 * c, protein: 4 * p, fat: 9 * f };
          order = Object.keys(e).sort((a, b) => e[b] - e[a]);
        } while (c + p + f > 95 || e[order[0]] - e[order[1]] < 30);
        const top = order[0];
        const what = rng.pick(['a snack bar', 'a ready meal', 'a breakfast cereal', 'a filled pastry', 'a dip', 'a sandwich filling']);
        const whyNot = (key) => (key === 'fat'
          ? `Fat: ${f} × 9 = ${9 * f} kcal, less than the ${e[top]} kcal from ${SOURCE_NAMES[top].toLowerCase()}.`
          : `${SOURCE_NAMES[key]}: ${key === 'carb' ? c : p} × 4 = ${e[key]} kcal, less than the ${e[top]} kcal from ${SOURCE_NAMES[top].toLowerCase()}.${key === 'carb' && c > f && top === 'fat' ? ' There are more grams of it, but each gram of fat counts for more than twice as much.' : ''}`);
        return {
          text: `
            In 100 g of ${what} there are **${c} g of carbohydrate**,
            **${p} g of protein** and **${f} g of fat**.

            **Which of the three supplies the most energy?**
          `,
          options: ['carb', 'protein', 'fat'].map((key) => (key === top
            ? { text: SOURCE_NAMES[key], correct: true }
            : { text: SOURCE_NAMES[key], why: whyNot(key) })),
          hints: ['Multiply the grams by 4, 4 and 9 before you compare.'],
          explain: `Carbohydrate ${c} × 4 = ${4 * c} kcal, protein ${p} × 4 = ${4 * p} kcal, fat ${f} × 9 = ${9 * f} kcal. The most comes from **${SOURCE_NAMES[top].toLowerCase()}**.`,
        };
      },
    },
    {
      id: 'teach-spending',
      type: 'info',
      title: 'Where the energy goes',
      text: `
        Labels compare a food with a reference adult who uses about
        2,000 kcal (8,400 kJ) a day. Real people differ widely: roughly
        1,600 to 3,000 kcal, depending on body size, age, sex and activity.

        A body spends its energy in three ways:

        - **Staying alive at rest**: heart, brain, liver, kidneys and keeping
          warm. For most people this is the biggest share by far, about
          60 to 70% (*Burning Fuel*, in The Body I).
        - **Moving**: roughly 15 to 30%. This share varies most from person
          to person.
        - **Digesting and processing food**: about 10%.
      `,
    },
    {
      id: 'spending',
      type: 'interact',
      title: 'Where the energy goes',
      text: `
        A body spends its energy in three ways: staying alive at rest,
        moving, and digesting food.

        **Drag the bars** to show roughly what share of a typical day's
        energy goes to each.
      `,
      widget: {
        type: 'bars', adjust: true, step: 5, yMax: 100, yStep: 20, unit: '%', yLabel: 'share of the day\'s energy',
        data: [
          { label: 'Staying alive\nat rest', value: 35, color: 'blue' },
          { label: 'Moving', value: 35, color: 'orange' },
          { label: 'Digesting\nfood', value: 30, color: 'green' },
        ],
        alt: 'Three adjustable bars for the share of daily energy spent on staying alive at rest, on moving, and on digesting food.',
      },
      check: (s) => s.values[0][0] > s.values[0][1] && s.values[0][0] > s.values[0][2],
      solution: { values: [[65, 25, 10]] },
      hints: ['One of the three takes well over half of the total.'],
      explain: `
        Simply staying alive takes the biggest share: about **60 to 70%**.
        Moving takes roughly 15 to 30%, and digesting and processing food
        about 10%. So most of a day's energy is spent without a single
        step being taken.
      `,
    },
    {
      id: 'fullness',
      type: 'choice',
      mode: 'predict',
      title: 'Is a calorie a calorie?',
      text: `
        In a laboratory burner, 240 kcal of croissant and 240 kcal of boiled
        potato release exactly the same heat. A calorie is a calorie.

        Researchers in Sydney fed volunteers 240 kcal portions of 38 foods
        and asked, over the next two hours, how full they felt.
        **Which do you think came out as most filling?**
      `,
      options: [
        { text: 'Boiled potatoes', correct: true },
        { text: 'Croissants' },
        { text: 'A chocolate bar' },
        { text: 'They were all about equal' },
      ],
      explain: `
        Boiled potatoes, by a wide margin, and croissants came last. The
        potato portion was large, watery and bulky; the croissant portion
        was small and rich in fat.

        This was one small study (Holt and colleagues, 1995), so the exact
        scores matter less than the pattern: **the same energy can leave you
        feeling very different.**
      `,
    },
    {
      id: 'kitchen',
      type: 'info',
      title: 'True in the burner, incomplete in the kitchen',
      text: `
        Energy is energy. But a body is not a burner, and three things
        differ between foods with the same label energy:

        - **Fullness.** Foods with more water, fibre and protein tend to fill
          people up for longer (the bars show the Sydney scores).
        - **Cost of processing.** Digesting protein uses up
          ${THERMIC.protein[0]} to ${THERMIC.protein[1]}% of its energy;
          for fat it is ${THERMIC.fat[0]} to ${THERMIC.fat[1]}%.
        - **What gets absorbed.** From whole almonds the body extracts about
          a quarter less energy than the label says, because some fat stays
          locked inside the nut's cell walls.

        So the label is a good estimate of what a food *contains*, and a
        rougher guide to what it *does*.
      `,
      figure: {
        type: 'bars', yMax: 350, yStep: 50, unit: '', yLabel: 'fullness score (white bread = 100)',
        data: SATIETY.map((row, i) => ({ label: row.food.replace(' ', '\n'), value: row.score, color: i < 2 ? 'gray' : i === 2 ? 'orange' : 'green' })),
        alt: `Bar chart of fullness scores for equal-energy portions, with white bread set at 100: ${SATIETY.map((row) => `${row.food.toLowerCase()} ${row.score}`).join(', ')}.`,
        caption: 'Fullness after 240 kcal portions. Holt et al., 1995.',
      },
    },
    {
      id: 'same-energy',
      type: 'multi',
      review: true,
      text: `
        Two snacks carry the same energy on their labels: a bowl of lentil
        soup and a small pastry.

        **Which statements are well supported?**
      `,
      options: [
        { text: 'Burned in a laboratory, they would release the same heat', correct: true },
        { text: 'The soup is likely to keep a person full for longer', correct: true },
        { text: 'The soup weighs more, because water and fibre carry little or no energy', correct: true },
        { text: 'The body will absorb and use exactly the same energy from each', why: 'Not exactly. The cost of digesting protein is higher than that of fat, and not everything in a fibrous food is absorbed.' },
        { text: 'The pastry carries more energy because it tastes richer', why: 'The question says their energy is the same. Richness comes from fat, which packs that energy into fewer grams.' },
      ],
      explain: `
        Same energy on the label, different weight, different fullness and
        slightly different amounts absorbed. That is why this course looks at
        *what food is made of*, and not only at how much energy it carries.
      `,
    },
    {
      id: 'teach-weight',
      type: 'info',
      title: 'More than willpower',
      text: `
        Over months and years, body weight reflects the balance between
        energy eaten and energy used. But that balance is not set by
        conscious choice alone. Research points to several influences:

        - **Genes.** Twin and family studies suggest that 40 to 70% of the
          differences in body weight between people are inherited.
        - **Hormones.** Leptin (from fat tissue) and ghrelin (from the
          stomach) signal fullness and hunger to the brain.
        - **Sleep.** Short sleep raises appetite.
        - **Surroundings.** Income, and the food on sale nearby: its price,
          portion sizes and advertising.

        Some medicines and medical conditions matter too.
      `,
    },
    {
      id: 'weight',
      type: 'multi',
      title: 'More than willpower',
      text: `
        Over months and years, body weight reflects the balance between
        energy eaten and energy used. But that balance is not set by
        conscious choice alone.

        **Which of these does research show to influence appetite and body
        weight?**
      `,
      options: [
        { text: 'Genes', correct: true },
        { text: 'Hormones that signal hunger and fullness to the brain', correct: true },
        { text: 'How much sleep a person gets', correct: true },
        { text: 'The food around them: price, portion sizes, advertising', correct: true },
        { text: 'Strength of character', why: 'There is no evidence that people with a higher weight have less willpower. Appetite is regulated largely below the level of conscious choice.' },
      ],
      explain: `
        Genes, hormones, sleep and surroundings all shape appetite, largely
        below the level of conscious choice.

        None of this is a matter of virtue. Bodies defend their weight, and
        people live in very different food environments.
      `,
    },
    {
      id: 'notice',
      type: 'reflect',
      title: 'Something to notice',
      text: `
        Next time a packaged food is in your hand, you might turn it over
        and find the energy per 100 g. No need to judge it or add anything up.

        **What two things would you look at to explain why that number is
        high or low?**
      `,
      model: `
        How much of the food is **water** (and fibre), which carry little or
        no energy, and how much is **fat**, which carries 9 kcal in every
        gram against 4 for carbohydrate and protein. A watery food such as
        soup or fruit has a low number; a dry or fatty one such as crackers,
        nuts or cheese has a high one.
      `,
    },
  ],
  recap: [
    'Food does three jobs: **fuel** (mostly carbohydrate and fat), **building material** (protein) and **regulators** (vitamins and minerals), all carried in water.',
    'Per gram, carbohydrate and protein carry about **4 kcal**, fat **9**, alcohol 7 and water none. 1 kcal is about 4.2 kJ.',
    'A label counts the energy a food contains. Fullness, the cost of digestion and how much is absorbed differ between foods with the same number.',
    'Energy needs vary widely between people, and body weight is regulated by genes, hormones, sleep and surroundings as well as by choice.',
  ],
  next: 'Next: carbohydrates. Why an apple and a spoonful of sugar are not the same thing to your blood.',
};
