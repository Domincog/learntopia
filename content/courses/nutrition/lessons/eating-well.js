// Food and Nutrition · Lesson 7 · Putting a Plate Together
//
// Driving question: with so much conflicting advice, what do the best-tested ways of eating have in common,
// and how can you check a food claim yourself?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/nutrition/index.js';
import { LABELS, label, TRAFFIC, trafficBand, PLATE, NOVA_TRIAL, PROCESSED_MEAT, PATTERN_PLENTY, PATTERN_LITTLE, dp1 } from '../helpers.js';

// An invented product for the worked example on comparing labels: not one of the sample labels the
// generated questions draw from, so the example can never be the question that follows.
const EXAMPLE_BAR = { id: 'example-bar', name: 'Fruit and nut bar', serving: 40, unit: 'g', fat: 14, saturates: 2.5, carb: 52, sugars: 30, fibre: 6, protein: 9, salt: 0.1, ingredients: ['dates', 'almonds', 'oat flakes', 'raisins', 'honey'] };
const EXAMPLE_OTHER = { sugars: 9, serving: 25 };            // a second bar, per serving

const PLATE_GROUPS = [
  { id: 'veg', name: 'Vegetables and fruit', color: 'green' },
  { id: 'grain', name: 'Whole grains', color: 'yellow' },
  { id: 'protein', name: 'Protein foods', color: 'violet' },
];

const NUTRIENT_WORDS = { fat: 'fat', saturates: 'saturates', sugars: 'sugars', salt: 'salt', fibre: 'fibre', protein: 'protein' };
const BAND_TEXT = { low: 'Green (low)', medium: 'Amber (medium)', high: 'Red (high)' };
const serve = (per100, serving) => Math.round(((per100 * serving) / 100) * 10) / 10;

// Every pair of sample labels that can be compared fairly on one nutrient: both servings hold at least 1 g of it,
// and gram for gram one product has at least a quarter more than the other.
const COMPARE = [];
for (const key of ['sugars', 'fibre', 'fat', 'protein']) {
  const ids = Object.keys(LABELS);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = LABELS[ids[i]];
      const b = LABELS[ids[j]];
      if (a.serving === b.serving) continue;
      if (serve(a[key], a.serving) < 1 || serve(b[key], b.serving) < 1) continue;
      const [hi, lo] = a[key] > b[key] ? [a[key], b[key]] : [b[key], a[key]];
      if (hi < lo * 1.25) continue;
      // keep the instructive cases: the product with less per serving has more gram for gram
      const [sa, sb] = [serve(a[key], a.serving), serve(b[key], b.serving)];
      if (Math.abs(sa - sb) < 0.5) continue;
      const more100 = a[key] > b[key] ? 0 : 1;
      const moreServing = sa > sb ? 0 : 1;
      if (more100 !== moreServing) COMPARE.push({ key, ids: [ids[i], ids[j]] });
    }
  }
}

export default {
  id: 'eating-well',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A diet on trial',
      text: `
        Most diet advice rests on watching what people choose to eat. A
        Spanish study did something harder: it assigned 7,447 people at high
        risk of heart disease, at random, to different diets for about five
        years.

        Two groups were coached to eat a **Mediterranean diet** and given
        free olive oil or nuts. The third was advised to cut down on fat.
        **How did heart attacks and strokes compare?**
      `,
      options: [
        { text: 'About 30% fewer in the Mediterranean groups', correct: true },
        { text: 'No difference' },
        { text: 'About 30% fewer in the low-fat group' },
        { text: 'Nine in ten prevented by the Mediterranean diet' },
      ],
      columns: 1,
      explain: `
        **About 30% fewer** (the PREDIMED trial). In 2018 the paper was
        withdrawn because some sites had not assigned people properly at
        random; reanalysed without them, the result stood.

        One trial does not settle a question. But this one agrees with
        decades of other evidence, and the interesting thing is what that
        evidence has in common.
      `,
    },
    {
      id: 'teach-patterns',
      type: 'info',
      title: 'Different plates, one outline',
      text: `
        The ways of eating with the best evidence look different on the
        plate: the **Mediterranean** diet, the **DASH** diet designed to
        lower blood pressure, traditional **Japanese** and **Nordic** food.
        The details differ (olive oil in one, rapeseed oil or oily fish in
        another), but the outline is the same.

        - **Plenty of:** ${PATTERN_PLENTY.join('; ')}.
        - **Only a little:** ${PATTERN_LITTLE.join('; ')}. (Processed meat
          means bacon, ham, sausages and the like.)

        In short: mostly plants, mostly unprocessed, unsaturated fats,
        little salt and free sugar. Nothing is forbidden, and no single
        food makes or breaks a diet.
      `,
    },
    {
      id: 'patterns',
      type: 'bucket',
      review: true,
      title: 'What the patterns share',
      text: `
        The ways of eating with the best evidence look different on the
        plate: the **Mediterranean** diet, the **DASH** diet designed to
        lower blood pressure, traditional **Japanese** and **Nordic** food.

        From what you have learned in this course, **sort the foods**: which
        do you expect all of them to have plenty of, and which only a little?
      `,
      buckets: ['Plenty', 'Only a little'],
      items: [
        { text: 'Vegetables and fruit', bucket: 0 },
        { text: 'Beans, lentils and other pulses', bucket: 0 },
        { text: 'Whole grains', bucket: 0 },
        { text: 'Nuts, seeds, and fish or plant oils', bucket: 0, why: 'These supply unsaturated fat, the kind that lowers LDL when it replaces saturated fat.' },
        { text: 'Processed meat', bucket: 1, why: 'Bacon, ham and sausages are high in salt and saturated fat, and are linked to bowel cancer.' },
        { text: 'Sugary drinks', bucket: 1 },
        { text: 'Refined grains and sweets', bucket: 1 },
        { text: 'Heavily salted foods', bucket: 1, why: 'Sodium raises blood pressure. Traditional Japanese food is the exception here: it is salty, and Japan has worked for decades to bring its salt intake down.' },
      ],
      explain: `
        The details differ (olive oil in one, rapeseed oil or oily fish in
        another) but the outline is the same: **mostly plants, mostly
        unprocessed, unsaturated fats, little salt and free sugar**. In a
        trial, the DASH diet lowered blood pressure by about 5 mmHg within
        eight weeks.

        Nothing on the list is forbidden, and no single food makes or
        breaks a diet. Patterns matter, over years.
      `,
    },
    {
      id: 'teach-plate',
      type: 'info',
      title: 'A plate in three parts',
      text: `
        Many countries sum their advice up as a picture of a plate. Canada's
        food guide and the Harvard "Healthy Eating Plate" happen to divide
        it in the same proportions:

        - **half** vegetables and fruit
        - **a quarter** whole grains: brown rice, wholemeal bread or
          chapati, oats, maize (corn)
        - **a quarter** protein foods: pulses such as beans and lentils,
          fish, eggs, nuts, meat

        Water is the drink beside it. The plate describes proportions, not
        particular dishes, so any cuisine can fill it.
      `,
    },
    {
      id: 'plate',
      type: 'interact',
      title: 'Draw the plate',
      text: `
        Canada's food guide and the Harvard "Healthy Eating Plate" divide a
        plate in the same proportions.

        This plate is empty, and cut into eight slices. **Share them out**
        as those two guides do.
      `,
      hints: ['Half of eight slices is four. A quarter is two.'],
      widget: { type: 'plate-builder', groups: PLATE_GROUPS, slices: 8, parts: { veg: 0, grain: 0, protein: 0 }, alt: 'A plate cut into eight slices, to share between vegetables and fruit, whole grains and protein foods.' },
      check: (s) => s.parts.veg === PLATE.veg && s.parts.grain === PLATE.grain && s.parts.protein === PLATE.protein,
      solution: { parts: PLATE },
      explain: `
        **Half** vegetables and fruit, a **quarter** whole grains, a
        **quarter** protein foods (pulses, fish, eggs, nuts, meat), with
        water to drink.

        Other guides draw it differently. The UK's shows a whole day's food
        with about a third vegetables and fruit and a third starchy foods;
        Japan uses a spinning top, China a pagoda. In 2026 the United States
        introduced a new pyramid that gives more room to protein foods, a
        change that divided nutrition scientists. All of them still
        agree on plenty of vegetables.
      `,
    },
    {
      id: 'cuisines',
      type: 'bucket',
      title: 'Any cuisine will do',
      text: `
        The plate describes proportions, not particular dishes. **Sort these
        foods** from kitchens around the world into its three parts.
      `,
      buckets: ['Vegetables and fruit', 'Grains', 'Protein foods'],
      items: [
        { text: 'Stir-fried greens', bucket: 0 },
        { text: 'Tomato and cucumber salad', bucket: 0 },
        { text: 'Brown rice', bucket: 1 },
        { text: 'Wholewheat chapati', bucket: 1 },
        { text: 'Corn tortillas', bucket: 1, why: 'Maize is a grain, and tortillas made from the whole kernel count as a whole-grain food.' },
        { text: 'Dal (spiced lentils)', bucket: 2, why: 'Lentils are pulses. Food guides count pulses among the protein foods.' },
        { text: 'Black beans', bucket: 2, why: 'Beans are pulses. Food guides count pulses among the protein foods.' },
        { text: 'Grilled sardines', bucket: 2 },
      ],
      explain: `
        Dal with chapati and greens; black beans with tortillas and salad;
        sardines with rice and vegetables. Each fills the plate in the same
        proportions with completely different food.

        Eating is also culture, pleasure and company. A way of eating that
        ignores those rarely lasts.
      `,
    },
    {
      id: 'set-meal',
      type: 'interact',
      title: 'Read a real meal',
      text: `
        This is a set meal from a Japanese restaurant: several small dishes
        instead of one big one, and not a drop of olive oil.

        In *The Truth About Fat* you met the omega-3 fats, found in
        flaxseed, walnuts and oily fish.
        **Tap the dish that supplies most of the meal's omega-3 fat.**
      `,
      widget: photo(MEDIA.teishoku, {
        alt: 'A tray with seven small dishes: a bowl of soup, a small dish of pink pickles, a bowl of shredded salad with cucumber and tomato, a bowl of white rice, a bowl holding a pale block under strips of dark seaweed, a plate of browned strips of meat with onions, and a plate of sliced raw red and orange fish with three small rolls.',
        caption: 'A Japanese set meal (*teishoku*)',
        maxWidth: 560,
        hotspots: [
          { id: 'soup', x: 0.275, y: 0.2, r: 0.085, label: 'Miso soup', alt: 'a bowl of cloudy soup' },
          { id: 'salad', x: 0.577, y: 0.27, r: 0.11, label: 'Salad', alt: 'a bowl of shredded salad' },
          { id: 'rice', x: 0.84, y: 0.24, r: 0.11, label: 'Rice', alt: 'a bowl of white grains' },
          { id: 'tofu', x: 0.19, y: 0.455, r: 0.09, label: 'Tofu', alt: 'a pale block under strips of dark seaweed' },
          { id: 'meat', x: 0.265, y: 0.72, r: 0.12, label: 'Beef with onions', alt: 'browned strips with onions on a lettuce leaf' },
          { id: 'fish', x: 0.74, y: 0.64, r: 0.12, label: 'Raw salmon and tuna', alt: 'slices of raw red and orange fish' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'fish') return true;
        if (s.picked === 'tofu') return 'Tofu is a soya food: complete protein and a little plant omega-3. Another dish supplies far more.';
        if (s.picked === 'rice') return 'Rice is the starch of the meal. It contains almost no fat.';
        if (s.picked === 'meat') return 'Beef supplies protein and mostly saturated and monounsaturated fat, with very little omega-3.';
        if (s.picked === 'soup') return 'Miso soup is made from fermented soya beans. It is low in fat (and quite salty).';
        return s.picked === 'salad' ? 'The salad supplies fibre and vitamins. Its dressing adds a little fat, but another dish supplies far more omega-3.' : false;
      },
      solution: { picked: 'fish' },
      hints: ['The long omega-3 fats come ready-made in one kind of animal food.'],
      explain: `
        The **salmon and tuna**. Around them: rice for starch, tofu and miso
        from soya beans, vegetables raw and pickled, a small portion of
        meat. It is the same outline as before, reached by another route.

        People in Japan live longer than almost anyone. Their traditional
        food is one likely reason among several, and its weak point is salt.
      `,
    },
    {
      id: 'upf',
      type: 'choice',
      mode: 'predict',
      title: 'Ultra-processed food',
      text: `
        Much modern food is **ultra-processed**: made in factories largely
        from refined ingredients and additives, such as soft drinks, packet
        snacks, many breakfast cereals and ready meals.

        In ${NOVA_TRIAL.year}, US researchers housed ${NOVA_TRIAL.people}
        adults in a clinic for a month. For ${NOVA_TRIAL.weeks} weeks each,
        they were offered an ultra-processed menu and an unprocessed one,
        matched for energy, sugar, fat, fibre and salt, and could eat as
        much as they liked. **What happened?**
      `,
      options: [
        { text: `They ate about ${NOVA_TRIAL.extraKcal} kcal a day more on the ultra-processed menu`, correct: true },
        { text: 'They ate the same amount on both menus', why: 'That is what the matched menus might suggest, but intake differed sharply: about 500 kcal a day more on the ultra-processed menu.' },
        { text: 'They ate more on the unprocessed menu', why: 'The other way round. On the unprocessed menu they ate less and lost a little weight.' },
        { text: 'They disliked the ultra-processed food and ate little of it', why: 'They rated the two menus as about equally pleasant, and ate more of the ultra-processed one.' },
      ],
      columns: 1,
      explain: `
        About **${NOVA_TRIAL.extraKcal} kcal a day more**, without feeling
        any fuller, and they gained nearly a kilogram in two weeks.

        Why is not yet known. Softer texture and faster eating are
        suspects. It was one small, short trial; most other evidence is
        observational; and the category is very broad (a wholemeal
        supermarket loaf and a fizzy drink both fall in it). Scientists
        disagree about whether the processing itself is the cause.
      `,
    },
    {
      id: 'ingredients',
      type: 'interact',
      title: 'Read the small print',
      text: `
        Labels are the one source of food information that is required by
        law. Start with the ingredients: in most countries they must be
        listed **in descending order of weight**.

        **Tap the ingredient there is most of in this cereal bar.**
      `,
      widget: { type: 'food-label', product: label('bar'), mode: 'pick', pickable: 'ingredients', columns: ['100'], rows: ['energy', 'carb', 'sugars', 'fibre'], alt: 'The label of a chocolate cereal bar, with part of its nutrition table and its list of seven ingredients, beginning with glucose syrup.' },
      check: (s) => {
        if (s.picked == null) return 'Tap one of the ingredients.';
        if (s.index === 0) return true;
        return `That is ingredient number ${s.index + 1} in the list. The list runs from most to least: look at the beginning.`;
      },
      solution: { picked: 'ingredient:0' },
      explain: `
        **Glucose syrup** comes first, so there is more of it than of the
        oats (22%) the bar is named after.

        Sugar also appears twice more, as "sugar" and inside the chocolate.
        Splitting one kind of ingredient between several names moves each
        further down the list: the "of which sugars" line in the table
        (${dp1(LABELS.bar.sugars)} g per 100 g) adds them back together.
      `,
    },
    {
      id: 'us-label',
      type: 'interact',
      title: 'Per serving',
      text: `
        This is the standard label of the United States. Everything on it is
        counted **per serving**, and set against a "daily value" for an
        adult who uses 2,000 kcal a day.

        Under rules set in 2016 it must separate the sugars added in manufacture
        from those naturally present. **Tap the line that shows the added sugars.**
      `,
      widget: photo(MEDIA['us-label'], {
        alt: 'A black and white Nutrition Facts label. It lists 8 servings per container, a serving size of two thirds of a cup (55 grams), 230 calories per serving, and then lines for fat, cholesterol, sodium, carbohydrate, fibre, sugars, protein, vitamin D, calcium, iron and potassium, each with a percentage of the daily value.',
        caption: 'The US Nutrition Facts label (official sample)',
        creditLabel: 'Image',
        maxWidth: 400,
        hotspots: [
          { id: 'serving', x: 0.23, y: 0.13, r: 0.06, label: 'Serving size', alt: 'the second line from the top' },
          { id: 'calories', x: 0.25, y: 0.24, r: 0.06, label: 'Energy per serving', alt: 'the line in the largest type' },
          { id: 'sodium', x: 0.14, y: 0.498, r: 0.055, label: 'Sodium', alt: 'a line in bold type in the middle of the table' },
          { id: 'fibre', x: 0.3, y: 0.578, r: 0.055, label: 'Fibre', alt: 'an indented line under total carbohydrate' },
          { id: 'added', x: 0.56, y: 0.658, r: 0.055, label: 'Added sugars', alt: 'the most deeply indented line of the table' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'added') return true;
        if (s.picked === 'serving') return 'That line says how big a serving is: worth reading first, but it is not about sugar.';
        if (s.picked === 'calories') return 'That is the energy in one serving. The sugars are further down.';
        if (s.picked === 'fibre') return 'Close: fibre is a carbohydrate too. The sugars come just below it.';
        return s.picked ? 'Look under "Total Carbohydrate": the sugars are listed there, and one line is indented further than the rest.' : false;
      },
      solution: { picked: 'added' },
      explain: `
        "Includes 10 g Added Sugars", 20% of the daily value: the US sets
        that value at 50 g, the same 10% of energy that the WHO uses for
        free sugars.

        Notice the catch in a per-serving label. This pack calls 55 g a
        serving and holds eight of them; another brand may choose 30 g.
        Their numbers cannot be compared directly.
      `,
    },
    {
      id: 'teach-per-100',
      type: 'info',
      title: 'Per serving, per 100 g',
      text: `
        The manufacturer decides how big a "serving" is, so two per-serving
        figures cannot be compared directly. **Per 100 g** puts every
        product on the same scale.

        :::example Worked example
        This bar lists ${dp1(serve(EXAMPLE_BAR.sugars, EXAMPLE_BAR.serving))} g of sugars in a ${EXAMPLE_BAR.serving} g serving.
        In 100 g: ${dp1(serve(EXAMPLE_BAR.sugars, EXAMPLE_BAR.serving))} ÷ ${EXAMPLE_BAR.serving} × 100 = **${EXAMPLE_BAR.sugars} g**.

        Another bar lists ${EXAMPLE_OTHER.sugars} g in a ${EXAMPLE_OTHER.serving} g serving.
        In 100 g: ${EXAMPLE_OTHER.sugars} ÷ ${EXAMPLE_OTHER.serving} × 100 = **${(EXAMPLE_OTHER.sugars / EXAMPLE_OTHER.serving) * 100} g**.
        :::

        The second bar has less sugar in a serving, but more gram for gram.
      `,
      figure: { type: 'food-label', product: EXAMPLE_BAR, columns: ['serving', '100'], rows: ['fat', 'sugars', 'fibre', 'protein'], ingredients: false, alt: `Label of a fruit and nut bar with two columns. Per ${EXAMPLE_BAR.serving} gram serving: fat ${dp1(serve(EXAMPLE_BAR.fat, EXAMPLE_BAR.serving))} g, sugars ${dp1(serve(EXAMPLE_BAR.sugars, EXAMPLE_BAR.serving))} g, fibre ${dp1(serve(EXAMPLE_BAR.fibre, EXAMPLE_BAR.serving))} g, protein ${dp1(serve(EXAMPLE_BAR.protein, EXAMPLE_BAR.serving))} g. Per 100 grams: fat ${EXAMPLE_BAR.fat} g, sugars ${EXAMPLE_BAR.sugars} g, fibre ${EXAMPLE_BAR.fibre} g, protein ${EXAMPLE_BAR.protein} g.` },
    },
    {
      id: 'fair-compare',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const pick = rng.pick(COMPARE);
        const ids = rng.bool() ? pick.ids : [pick.ids[1], pick.ids[0]];
        const [a, b] = ids.map((id) => LABELS[id]);
        const key = pick.key;
        const word = NUTRIENT_WORDS[key];
        const more = a[key] > b[key] ? 0 : 1;
        const prods = [a, b];
        const line = (p) => `${p.name}: ${dp1(serve(p[key], p.serving))} g in a ${p.serving} g serving is ${dp1(p[key])} g per 100 g`;
        return {
          text: `
            Some labels give amounts only **per serving**, and the
            manufacturer decides how big a serving is.

            **Gram for gram, which of these two has more ${word}?**
          `,
          figure: ids.map((id) => ({ type: 'food-label', product: label(id), columns: ['serving'], rows: ['fat', 'sugars', 'fibre', 'protein'], ingredients: false, alt: `Label of ${LABELS[id].name}, per ${LABELS[id].serving} gram serving: fat ${dp1(serve(LABELS[id].fat, LABELS[id].serving))} g, sugars ${dp1(serve(LABELS[id].sugars, LABELS[id].serving))} g, fibre ${dp1(serve(LABELS[id].fibre, LABELS[id].serving))} g, protein ${dp1(serve(LABELS[id].protein, LABELS[id].serving))} g.` })),
          options: prods.map((p, i) => (i === more
            ? { text: p.name, correct: true }
            : { text: p.name, why: `Its serving holds more ${word} only because the serving is bigger (${p.serving} g against ${prods[more].serving} g). Per 100 g it has ${dp1(p[key])} g, against ${dp1(prods[more][key])} g.` })),
          hints: ['Work out how much there would be in 100 g of each: divide by the serving size, then multiply by 100.'],
          explain: `${line(a)}. ${line(b)}. So **${prods[more].name}** has more ${word} gram for gram, although its serving holds less. This is why the "per 100 g" column, where a label has one, is the fair way to compare.`,
        };
      },
    },
    {
      id: 'traffic',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const id = rng.pick(Object.keys(LABELS));
        const key = rng.pick(Object.keys(TRAFFIC));
        const p = LABELS[id];
        const band = trafficBand(key, p[key]);
        const t = TRAFFIC[key];
        const why = {
          low: `Green means ${dp1(t.low)} g or less per 100 g. This product has ${dp1(p[key])} g.`,
          medium: `Amber is for amounts above ${dp1(t.low)} g and up to ${dp1(t.high)} g per 100 g. This product has ${dp1(p[key])} g.`,
          high: `Red means more than ${dp1(t.high)} g per 100 g. This product has ${dp1(p[key])} g.`,
        };
        return {
          text: `
            Front-of-pack schemes turn the table into a signal. They differ
            by country: letters, stars, warning signs. The UK's voluntary
            "traffic lights" mark ${NUTRIENT_WORDS[key]} as **green (low)** at
            ${dp1(t.low)} g or less per 100 g, and **red (high)** above
            ${dp1(t.high)} g. In between is amber.

            **Which colour does this product get for ${NUTRIENT_WORDS[key]}?**
          `,
          figure: { type: 'food-label', product: label(id), columns: ['100'], rows: ['fat', 'saturates', 'sugars', 'salt'], ingredients: false, alt: `Label of ${p.name}, per 100 grams: fat ${dp1(p.fat)} g, of which saturates ${dp1(p.saturates)} g, sugars ${dp1(p.sugars)} g, salt ${dp1(p.salt)} g.` },
          options: ['low', 'medium', 'high'].map((b) => (b === band ? { text: BAND_TEXT[b], correct: true } : { text: BAND_TEXT[b], why: why[b] })),
          hints: [`Find the ${NUTRIENT_WORDS[key]} line and compare it with ${dp1(t.low)} and ${dp1(t.high)}.`],
          explain: `The label shows ${dp1(p[key])} g of ${NUTRIENT_WORDS[key]} per 100 g. ${band === 'low' ? `That is no more than ${dp1(t.low)} g` : band === 'high' ? `That is above ${dp1(t.high)} g` : `That lies between ${dp1(t.low)} g and ${dp1(t.high)} g`}: **${BAND_TEXT[band].toLowerCase()}**. A colour describes one nutrient in one product. It is a quick comparison, not a verdict on the food.`,
        };
      },
    },
    {
      id: 'teach-risk',
      type: 'info',
      title: 'Relative and absolute',
      text: `
        A change in risk can be reported in two ways, and both are true.

        - **Relative**: how much bigger the risk became. "50% higher."
        - **Absolute**: how many extra people are affected. "5 more in
          every 100."

        :::example Worked example (invented numbers)
        An illness affects 10 people in 100. With some habit, it affects
        15 in 100.

        - Relative: 15 ÷ 10 = 1.5, a rise of 50%.
        - Absolute: 15 − 10 = 5 extra cases in every 100 people.
        :::

        A percentage on its own hides whether the starting risk was large
        or tiny. The absolute numbers show it.
      `,
      figure: {
        type: 'risk-array', n: 100, base: 10, rr: 1.5, static: true,
        words: { without: 'Without the habit', with: 'With the habit' },
        alt: 'Two crowds of 100 dots. Without the habit, 10 are affected. With it, 15 are affected: 5 more in every 100, which is 50% more.',
      },
    },
    {
      id: 'headline',
      type: 'choice',
      title: 'Read the headline',
      text: `
        In 2015 the WHO's cancer agency concluded that processed meat causes
        bowel cancer: each 50 g eaten daily raises the risk by about
        **${PROCESSED_MEAT.relativePct}%**.

        In the UK, about ${PROCESSED_MEAT.per1000Low} in 1,000 people who eat
        the least processed meat develop bowel cancer in their lifetime,
        and about ${PROCESSED_MEAT.per1000High} in 1,000 of those who eat the
        most. **Which headline tells readers the most?**
      `,
      options: [
        { text: `"About 1 extra case in every 100 people over a lifetime"`, correct: true },
        { text: `"Bacon raises cancer risk by ${PROCESSED_MEAT.relativePct}%"`, why: 'True, but a percentage on its own hides whether the starting risk was large or tiny. Here it means 66 instead of 56 in 1,000.' },
        { text: '"Processed meat as dangerous as smoking"', why: 'Both are in the agency\'s top category, but that category grades how sure the evidence is, not how big the risk is. Smoking is far more dangerous.' },
        { text: `"${PROCESSED_MEAT.relativePct} in 100 bacon eaters will get cancer"`, why: 'That misreads a relative rise as an absolute risk. The rise is from about 56 to about 66 in 1,000.' },
      ],
      columns: 1,
      explain: `
        ${PROCESSED_MEAT.per1000High} − ${PROCESSED_MEAT.per1000Low} =
        ${PROCESSED_MEAT.per1000High - PROCESSED_MEAT.per1000Low} extra
        cases in 1,000: **about 1 in 100**. The finding is real, and worth
        knowing; the size is modest.

        Two questions sort most food headlines. **Compared with what, in
        absolute numbers?** And **was it a trial, or did researchers only
        observe** people who differ in many ways? *Is That Really True?*, in
        Staying Well, gives you the full toolkit.
      `,
    },
    {
      id: 'teach-fads',
      type: 'info',
      title: 'Evidence or marketing?',
      text: `
        Advice that rests on evidence tends to sound modest. It says that
        findings are uncertain and may change, and it looks much like what
        national food guides already advise.

        A diet that rests on marketing sounds different. Four reliable
        signs:

        - it promises fast, dramatic results;
        - it bans whole groups of foods for everyone;
        - its proof is testimonials and before-and-after stories, not
          studies;
        - its promoters sell the supplements or products it requires.

        Words such as "detox", "cleanse" and "superfood" belong on the same
        list.
      `,
    },
    {
      id: 'red-flags',
      type: 'multi',
      review: true,
      title: 'Spot the fad',
      text: 'New diets appear every year. **Which of these are warning signs that a diet rests on marketing and not on evidence?**',
      options: [
        { text: 'It promises fast, dramatic results', correct: true },
        { text: 'It bans whole groups of foods for everyone', correct: true },
        { text: 'Its proof is testimonials and before-and-after stories', correct: true },
        { text: 'Its promoters sell the supplements or products it requires', correct: true },
        { text: 'It says that findings are uncertain and may change', why: 'That is what honest science sounds like. Certainty about everything is the warning sign.' },
        { text: 'It looks much like what national food guides already advise', why: 'Agreement with a large body of evidence is a good sign, even if it is not exciting.' },
      ],
      explain: `
        Quick fixes, forbidden foods, stories instead of studies, and
        something to sell: four reliable signs. Words such as "detox",
        "cleanse" and "superfood" belong on the same list.

        Some people do need to avoid particular foods, for instance with
        coeliac disease or an allergy. That is a matter of diagnosis, with
        a doctor or dietitian, not of fashion.
      `,
    },
    {
      id: 'table',
      type: 'info',
      tone: 'sober',
      title: 'Back to the table',
      text: `
        After seven lessons, the well-established part of nutrition fits in
        a few lines: mostly plants, plenty of fibre, unsaturated fats, not
        much salt or free sugar, enough of everything and not too much of
        anything. The rest is detail, and a good deal of it is still
        uncertain.

        If you would like one thing to try this week, make it a pleasant
        one: add a vegetable or a pulse to a meal you already like, or eat
        with someone.

        :::note
        If thoughts about food, eating or body shape are causing you
        distress, that deserves care, and help works. A doctor is a good
        first step, and so is telling someone you trust. Many countries
        have an eating-disorder helpline: Beat in the UK (0808 801 0677),
        ANAD in the United States (1 888 375 7767), Butterfly in Australia
        (1800 33 4673). Elsewhere, findahelpline.com lists services by country.
        :::
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'The best-tested eating patterns share an outline: **mostly plants and minimally processed foods, unsaturated fats, little salt and free sugar**. Many cuisines fit it.',
    'A common plate model: **half vegetables and fruit, a quarter whole grains, a quarter protein foods**.',
    'On a label, ingredients run from most to least, and **per 100 g** is the fair way to compare products.',
    'Judge a headline by its **absolute numbers** and by whether it rests on a trial or on observation. Fast results, banned foods and things to buy are signs of a fad.',
  ],
  next: 'That completes Food and Nutrition. Food is one half of the energy equation; the next course, Movement and Fitness, is about the other: what regular activity does for almost every organ, and how much is enough.',
};
