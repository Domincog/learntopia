// Food and Nutrition · Lesson 2 · Sugar, Starch and Fibre
//
// Driving question: why are an apple and a spoonful of sugar not the same thing to your blood?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/nutrition/index.js';
import { GI, giFoods, FIBRE, FIBRE_FOODS, FREE_SUGARS, FREE_SUGAR_ITEMS, TEASPOON_SUGAR_G, PEOPLE, dp1 } from '../helpers.js';

const SAME_CARBS = giFoods(['glucose', 'potato', 'white', 'wholemeal', 'sugar', 'spaghetti', 'apple', 'lentils', 'chickpeas']);
const REAL_FOODS = giFoods(['potato', 'white', 'rice', 'sugar', 'spaghetti', 'apple', 'lentils', 'chickpeas']);
const SERVINGS = giFoods(['watermelon', 'rice', 'cola', 'white', 'apple', 'lentils'], { servings: true });
// Seven servings from the fibre table, with short labels for the bar chart on the teaching screen.
const FIBRE_LABELS = { lentils: 'Lentil\nsoup', beans: 'Baked\nbeans', wholemeal: 'Wholemeal\nbread', apple: 'Apple', oats: 'Porridge', white: 'White\nbread', rice: 'White\nrice' };
const FIBRE_CHART = Object.keys(FIBRE_LABELS).map((id) => ({ ...FIBRE_FOODS.find((f) => f.id === id), label: FIBRE_LABELS[id] }));

// One sugar unit drawn as a hexagon.
const hex = (cx, cy, r, cls) => {
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push(`${(cx + r * Math.cos((Math.PI / 3) * i)).toFixed(1)},${(cy + r * Math.sin((Math.PI / 3) * i)).toFixed(1)}`);
  return `<polygon points="${pts.join(' ')}" class="${cls} stroke-ink" stroke-width="2.5" stroke-linejoin="round"/>`;
};
const link = (x1, x2, y, cls = 'stroke-ink') => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" class="${cls}" stroke-width="3" stroke-linecap="round"/>`;
// A chain of units. With `zig`, every second unit sits lower: the different kind of link that makes fibre.
const chain = (x0, y, n, cls, zig = 0) => {
  let out = '';
  for (let i = 1; i < n; i++) out += `<line x1="${x0 + (i - 1) * 38}" y1="${y + ((i - 1) % 2 ? zig : -zig)}" x2="${x0 + i * 38}" y2="${y + (i % 2 ? zig : -zig)}" class="stroke-ink" stroke-width="3" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) out += hex(x0 + i * 38, y + (i % 2 ? zig : -zig), 13, cls);
  return out;
};
const FAMILY_SVG =
  '<text class="fig-label" x="10" y="24">Sugars: one or two units</text>' +
  hex(40, 58, 15, 'fill-orange') + '<text class="fig-label-sm" x="40" y="92" text-anchor="middle">glucose</text>' +
  hex(120, 58, 15, 'fill-pink') + '<text class="fig-label-sm" x="120" y="92" text-anchor="middle">fructose</text>' +
  link(213, 229, 58) + hex(200, 58, 15, 'fill-orange') + hex(242, 58, 15, 'fill-pink') + '<text class="fig-label-sm" x="221" y="92" text-anchor="middle">table sugar (sucrose)</text>' +
  link(353, 369, 58) + hex(340, 58, 15, 'fill-orange') + hex(382, 58, 15, 'fill-yellow') + '<text class="fig-label-sm" x="361" y="92" text-anchor="middle">milk sugar (lactose)</text>' +
  '<text class="fig-label" x="10" y="128">Starch: hundreds of glucose units in a chain</text>' +
  chain(40, 156, 10, 'fill-orange') + '<text class="fig-label" x="410" y="161">…</text>' +
  '<text class="fig-label" x="10" y="206">Fibre: chains that human enzymes cannot cut</text>' +
  chain(40, 236, 10, 'fill-green', 7) + '<text class="fig-label" x="410" y="241">…</text>';

// A published cut-away diagram of a wheat kernel, its parts named in the picture itself (Wikimedia Commons; the
// nutrition table beside it in the original file is cropped away). The teaching screen and the question after it
// show the same picture. The square box leaves a band beside the tall picture for the enlarge button, which would
// otherwise cover the diagram's own title in its bottom corner.
const kernelFigure = () => photo(MEDIA['wheat-kernel'], {
  alt: 'A wheat kernel drawn cut open lengthwise. A thin golden-brown outer layer, labelled bran, wraps a large pale inside, labelled endosperm. A small reddish-brown part at the base, labelled germ, lies against the outer layer, and a tuft of fine hairs at the top is labelled brush.',
  caption: 'A wheat kernel, cut open. The brush is a tuft of hairs.',
  aspect: '1:1',
  fit: 'contain',
});

export default {
  id: 'carbohydrates',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Bread against sugar',
      text: `
        Two volunteers each eat 50 grams of carbohydrate. One gets it as
        slices of **white bread**, the other as **table sugar** dissolved in
        water.

        **Whose blood glucose ("blood sugar") rises higher over the next two hours?**
      `,
      options: [
        { text: 'The one who ate the bread', correct: true },
        { text: 'The one who drank the sugar' },
        { text: 'Both the same' },
      ],
      explain: `
        On average, the bread. It surprises most people.

        Starch is glucose in long chains, and the starch of white bread is
        cut into glucose within minutes. Table sugar is only half glucose;
        its other half, fructose, hardly raises blood glucose at all.

        That does not make sugar harmless, as you will see. It does show
        that sugar and starch are closer relatives than their names suggest.
      `,
    },
    {
      id: 'family',
      type: 'info',
      title: 'One family',
      text: `
        **Carbohydrates** are built from small sugar units.

        - **Sugars** are single units or pairs. They taste sweet.
        - **Starch** is a chain of hundreds of glucose units. Plants store
          energy this way in grains, potatoes and pulses.
        - **Fibre** is also made of chains, joined in ways the enzymes of the
          human gut cannot cut.

        Digestion takes sugars and starch apart into single units, which
        cross into the blood, mostly as **glucose** (*From Plate to
        Bloodstream*, in The Body I). Fibre travels on, uncut.
      `,
      figure: { type: 'svg', viewBox: '0 0 440 262', maxWidth: 500, content: FAMILY_SVG, alt: 'Sugar units drawn as hexagons. Sugars: glucose and fructose are single units; table sugar is one glucose joined to one fructose; milk sugar is glucose joined to another unit. Starch: a long chain of glucose units. Fibre: another long chain, which human enzymes cannot cut.' },
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Same carbohydrate, different curves',
      text: `
        Each food here supplies the **same 50 g of carbohydrate**: about
        three slices of bread, or three apples. The graph shows blood
        glucose over the next two hours.

        **Draw at least four foods.** Start by testing the bread against the
        sugar. Which food comes closest to pure glucose? Which rises least?
      `,
      widget: { type: 'glucose-curve', foods: SAME_CARBS, shown: ['glucose'], max: 2, alt: 'A graph of blood glucose over two hours after eating. Buttons choose which foods to draw, two at a time.' },
      check: (s) => s.seenCount >= 4 || `You have drawn ${s.seenCount} so far. Try some more: potato, lentils, an apple.`,
      solution: { seen: ['glucose', 'white', 'sugar', 'lentils'] },
      explain: `
        Before eating, blood glucose sits at about 4 to 5.5 mmol/L
        (70 to 100 mg/dL). Then:

        - **Potato and bread** come close to pure glucose: a high, early peak.
        - **Table sugar** peaks a little lower than bread.
        - **Apple, lentils and chickpeas** give low, late humps.

        Wholemeal bread behaves almost exactly like white. Hold that thought.
      `,
    },
    {
      id: 'extremes',
      type: 'interact',
      title: 'Highest and lowest',
      text: `
        Eight real foods, again with 50 g of carbohydrate each.

        **Leave two curves on the graph: the food with the highest peak and
        the food with the lowest.**
      `,
      widget: { type: 'glucose-curve', foods: REAL_FOODS, shown: ['white'], max: 2, alt: 'A graph of blood glucose over two hours after eating. Buttons choose which of eight foods to draw, two at a time.' },
      check: (s) => {
        if (s.shown.length < 2) return 'Leave two curves on the graph.';
        const has = (id) => s.shown.includes(id);
        if (has('potato') && has('chickpeas')) return true;
        if (!has('potato') && !has('chickpeas')) return `Neither is an extreme yet. ${GI[s.highest].name} peaks at ${s.peak[s.highest]} mmol/L: one food goes higher, and one stays lower than ${GI[s.lowest].name}.`;
        return has('potato')
          ? `Boiled potato is the highest. But one food stays lower than ${GI[s.lowest].name.toLowerCase()}, which peaks at ${s.peak[s.lowest]} mmol/L.`
          : `Chickpeas are the lowest. But one food goes higher than ${GI[s.highest].name.toLowerCase()}, which peaks at ${s.peak[s.highest]} mmol/L.`;
      },
      solution: { shown: ['potato', 'chickpeas'] },
      hints: ['Try each button in turn and read the peak under the graph.', 'The highest is a soft, starchy vegetable. The lowest is a pulse.'],
      explain: `
        **Boiled potato** peaks highest and soonest; **chickpeas** lowest and
        latest.

        Soft, cooked starch is taken apart almost at once. In a chickpea the
        starch sits inside intact cells, wrapped in fibre and protein, and
        the enzymes reach it slowly.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The glycaemic index',
      text: `
        The **glycaemic index (GI)** scores a food by the size of its
        two-hour glucose curve, compared with pure glucose at 100. Potato
        scores about ${GI.potato.gi}, white bread ${GI.white.gi}, table sugar
        ${GI.sugar.gi}, spaghetti ${GI.spaghetti.gi}, apple ${GI.apple.gi},
        lentils ${GI.lentils.gi}.

        What slows a food down: **intact structure** (whole grains, beans,
        whole fruit), **fibre**, and fat or protein eaten with it.

        :::warn A rough guide
        The scores are averages. The same food gives different curves in
        different people, and a mixed meal behaves differently from its
        parts. A low score is not a health rating: chocolate and ice cream
        score low, because fat slows them.
        :::
      `,
    },
    {
      id: 'servings',
      type: 'choice',
      title: 'How much matters too',
      text: `
        A GI test uses 50 g of carbohydrate from every food. Real servings
        differ. These buttons use **everyday servings**.

        Watermelon's GI (${GI.watermelon.gi}) is higher than white rice's
        (${GI.rice.gi}). **Draw both.** Why is the watermelon curve so much
        flatter?
      `,
      figure: { type: 'glucose-curve', foods: SERVINGS, shown: ['watermelon'], max: 2, alt: 'A graph of blood glucose over two hours after eating everyday servings. Buttons choose which foods to draw. A slice of watermelon holds 11 grams of carbohydrate and a bowl of white rice 50 grams.' },
      options: [
        { text: `A slice holds only ${GI.watermelon.carbs} g of carbohydrate; the bowl of rice holds ${GI.rice.carbs} g`, correct: true },
        { text: 'Fruit sugar never reaches the blood', why: 'It does. Watermelon contains glucose as well as fructose, which is why its GI is high.' },
        { text: 'Watermelon is full of fibre', why: 'It has very little fibre. It is mostly water.' },
        { text: 'The GI of watermelon must be wrong', why: 'The score is right, but it describes 50 g of carbohydrate, which would be more than half a kilogram of watermelon.' },
      ],
      columns: 1,
      explain: `
        The curve depends on **how fast** (the GI) and on **how much**
        carbohydrate is eaten. A slice of watermelon is mostly water and
        holds little carbohydrate, so its curve barely lifts.

        This is the main reason a GI table on its own can mislead.
      `,
    },
    {
      id: 'teach-grain',
      type: 'info',
      title: 'Whole and refined',
      text: `
        A grain of wheat has three parts, and a mill can separate them.

        - **Bran**: the brown outer layers, with most of the fibre, B
          vitamins and minerals.
        - **Endosperm**: the seed's food store, starch and some protein.
        - **Germ**: the small part at the base that would sprout, with
          oils, vitamin E and B vitamins.

        **Whole grains** (brown rice, oats, whole wheat) and **wholemeal**
        flour keep all three parts. **Refined** grains have lost the brown
        outer layers and the part that would sprout. What is left is pale,
        soft and almost all starch. White flour is made this way.
      `,
      figure: kernelFigure(),
    },
    {
      id: 'grain',
      type: 'choice',
      title: 'Whole and refined',
      text: `
        A grain of wheat has three parts. To make **white flour**, the mill
        sieves two of them away.

        **Which part does white flour keep?**
      `,
      figure: kernelFigure(),
      hints: ['The bran is the brown outer layers; the germ is the part that would sprout.'],
      options: [
        { text: 'The endosperm', correct: true },
        { text: 'The bran', why: 'The bran is the brown outer part that is sieved out. It holds most of the fibre.' },
        { text: 'The germ', why: 'The germ is removed too. Its oils would make the flour go rancid sooner.' },
      ],
      explain: `
        White flour is the starchy **endosperm** alone: the bran and the
        germ, with most of the fibre, have been sieved out.

        Whole grains do not always flatten the glucose curve: finely milled
        wholemeal bread scores about the same as white. What they reliably
        add is fibre and micronutrients.
      `,
    },
    {
      id: 'fibre-guess',
      type: 'slider',
      mode: 'predict',
      title: 'The carbohydrate you cannot digest',
      text: `
        The World Health Organization recommends that adults eat **at least
        ${FIBRE.who} g of fibre a day**. The United Kingdom advises
        ${FIBRE.uk} g.

        **What do you think adults in the UK and the United States actually
        eat, on average?**
      `,
      min: 0, max: 40, step: 1, answer: 18, tolerance: 2, unit: 'g a day', start: 30,
      explain: `
        About **16 to 20 g**: roughly two thirds of the lower of the two
        recommendations.
        The next screen shows why the gap matters.
      `,
    },
    {
      id: 'teach-fibre',
      type: 'info',
      title: 'What fibre does',
      text: `
        Fibre matters because of what happens after the small intestine.
        Bacteria in the large intestine ferment it into substances that
        nourish the gut lining.

        - **Soluble** fibre (oats, beans, apples) forms a gel that slows
          digestion and lowers cholesterol.
        - **Insoluble** fibre (bran, vegetable skins) adds bulk and keeps
          things moving.

        A 2019 review for the WHO pooled 185 long-term studies and 58
        trials. The people who ate the most fibre had about **15 to 30%
        lower** rates of heart disease, stroke, type 2 diabetes and bowel
        cancer than those who ate the least. Most of this evidence is
        observational, but the trials agree, and the authors graded the
        certainty as moderate.
      `,
      figure: {
        type: 'bars', yMax: 10, yStep: 2, unit: 'g', yLabel: 'fibre in one serving (g)',
        data: FIBRE_CHART.map((it) => ({ label: it.label, value: it.g, color: it.g >= 4 ? 'green' : 'gray' })),
        alt: `Bar chart of the fibre in everyday servings: ${FIBRE_CHART.map((it) => `${it.name}, ${it.g} g`).join('; ')}.`,
        caption: 'Fibre in everyday servings (label values, rounded).',
      },
    },
    {
      id: 'fibre-evidence',
      type: 'choice',
      text: `
        A 2019 review for the WHO pooled 185 long-term studies and 58
        trials. It compared the people who ate the **most** fibre with those
        who ate the **least**.

        **What did it find?**
      `,
      options: [
        { text: 'About 15 to 30% lower rates of heart disease, stroke, type 2 diabetes and bowel cancer', correct: true },
        { text: 'No difference once other habits were taken into account', why: 'A difference remained after adjusting for other habits, and the trials on body weight, cholesterol and blood pressure pointed the same way.' },
        { text: 'Fibre halved the death rate', why: 'The differences were real but more modest: about 15 to 30%.' },
        { text: 'High-fibre eaters had more bowel disease', why: 'The opposite: bowel cancer was less common among people who ate more fibre.' },
      ],
      columns: 1,
      explain: `
        **15 to 30% lower** rates of early death and of several major
        diseases, with the clearest benefit at 25 to 29 g a day or more.

        People who eat more fibre differ in other ways too, which is why
        observational evidence alone would not settle it. Here the trials
        point the same way, and a certainty graded as moderate is good for
        nutrition.
      `,
    },
    {
      id: 'fibre-day',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const items = rng.sample(FIBRE_FOODS, 3);
        const total = items.reduce((t, it) => t + it.g, 0);
        const answer = FIBRE.who - total;
        const list = items.map((it) => `${it.name} (${it.g} g)`);
        return {
          text: `
            The fibre in what ${who} ate today came from ${list[0]},
            ${list[1]} and ${list[2]}.

            **How many more grams would bring the day's total to the WHO's
            ${FIBRE.who} g?**
          `,
          answer,
          unit: 'g',
          wrong: [[total, `That is the total so far. The question asks how far it is from ${FIBRE.who} g.`]],
          hints: [`Add up the three: ${items.map((it) => it.g).join(' + ')}.`, `Then take the total away from ${FIBRE.who}.`],
          explain: `${items.map((it) => it.g).join(' + ')} = ${total} g so far, and ${FIBRE.who} − ${total} = **${answer} g** to go. Pulses, whole grains, nuts, fruit and vegetables are where fibre is found; ${rng.pick(['a bowl of lentil soup or half a tin of beans adds about 8 g', 'two slices of wholemeal bread add about 5 g', 'an apple or a bowl of porridge adds about 4 g'])}.`,
        };
      },
    },
    {
      id: 'teach-free-sugars',
      type: 'info',
      title: 'Free sugars',
      text: `
        The sugars with the best evidence of harm (tooth decay, weight gain,
        type 2 diabetes) are **free sugars**. The WHO counts as free:

        - sugar **added** by a manufacturer, a cook or the person eating,
          as in sweets and sugary drinks;
        - the sugar in **honey**, **syrups** and **fruit juice**. Juicing
          frees the sugar from the fruit's cells and removes most of the
          fibre.

        **Not free:** the sugar inside whole fruit and vegetables, and
        lactose, the sugar naturally in milk and plain yogurt. Whole fruit
        is not the problem: its sugar comes packed with water and fibre,
        and studies consistently link eating whole fruit to better health.

        The WHO recommends keeping free sugars **below
        ${FREE_SUGARS.strongPct}% of energy**, and suggests that below
        ${FREE_SUGARS.conditionalPct}% would be better still.
      `,
    },
    {
      id: 'free-sugars',
      type: 'bucket',
      review: true,
      title: 'Free sugars',
      text: `
        The sugars with the best evidence of harm (tooth decay, weight gain,
        type 2 diabetes) are **free sugars**: those added to food and drink,
        and those already freed from the plant's cells in honey, syrups and
        fruit juice. The sugar inside whole fruit and vegetables, and the
        lactose naturally in milk, are not free sugars.

        **Sort these.**
      `,
      buckets: ['Free sugars', 'Not free sugars'],
      gen: (rng) => ({
        items: rng.shuffle([
          ...rng.sample(FREE_SUGAR_ITEMS.free, 3).map((it) => ({ text: it.text, bucket: 0, why: it.why })),
          ...rng.sample(FREE_SUGAR_ITEMS.intact, 3).map((it) => ({ text: it.text, bucket: 1, why: it.why })),
        ]),
      }),
      explain: `
        Added sugars, honey, syrups and juice are **free**. The sugar inside
        whole fruit and vegetables, and the lactose in plain milk, are not.

        The WHO recommends keeping free sugars **below
        ${FREE_SUGARS.strongPct}% of energy**, and suggests that below
        ${FREE_SUGARS.conditionalPct}% would be better still.
      `,
    },
    {
      id: 'drink-sugar',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const per = rng.pick([4.5, 6, 8, 9, 10.6, 11, 12]);
        const [vol, pack] = rng.pick([[250, 'small can'], [330, 'can'], [500, 'bottle']]);
        const exact = (per * vol) / 100;
        const shown = Math.round(exact);
        const spoons = Math.round(exact / TEASPOON_SUGAR_G);
        return {
          text: `
            The label of a fizzy drink says **${dp1(per)} g of sugars per
            100 mL**. It comes in a **${vol} mL** ${pack}.

            **How much sugar is in the whole ${pack}?** Round to the nearest gram.

            For example, 7 g per 100 mL in a 200 mL carton would be
            7 × 2 = 14 g.
          `,
          answer: exact,
          tolerance: 0.5,
          display: String(shown),
          unit: 'g',
          wrong: [
            [per, `That is the sugar in 100 mL. The ${pack} holds ${vol} mL.`],
            [per * vol, 'The label counts sugar per 100 mL, so divide the volume by 100 first.'],
          ],
          hints: [`${vol} mL is ${dp1(vol / 100)} lots of 100 mL.`, `${dp1(per)} × ${dp1(vol / 100)}`],
          explain: `${dp1(per)} × ${dp1(vol / 100)} = ${dp1(exact)}, so about **${shown} g**: roughly ${spoons} level teaspoons. For an adult using 2,000 kcal a day, the WHO's 10% limit on free sugars works out at about 50 g a day, and the 5% suggestion at about 25 g.`,
        };
      },
    },
    {
      id: 'teach-claims',
      type: 'info',
      title: 'Three claims, tested',
      text: `
        Carbohydrates attract strong opinions. Three popular claims have
        been tested, and have not held up.

        - **"Sugar makes children hyperactive."** A pooled analysis of 23
          controlled experiments, in which neither parents nor children knew
          who had been given sugar, found no effect on behaviour.
        - **"Carbohydrates are fattening in themselves."** Many long-lived
          populations eat mostly carbohydrate, and diets high in whole
          grains, pulses and fruit are linked to less weight gain, not more.
        - **"Honey and brown sugar are far better for you than white
          sugar."** All three are free sugars and behave much alike in the
          body.
      `,
    },
    {
      id: 'myths',
      type: 'bucket',
      review: true,
      title: 'What the evidence says',
      text: 'Carbohydrates attract strong opinions. **Sort these claims** by how well the evidence supports them.',
      buckets: ['Well supported', 'Not supported'],
      items: [
        { text: 'Sugary drinks are linked to weight gain, type 2 diabetes and tooth decay', bucket: 0 },
        { text: 'People who eat more fibre have less heart disease and bowel cancer', bucket: 0 },
        { text: 'Eating whole fruit is linked to better health, despite its sugar', bucket: 0 },
        { text: 'Sugar makes children hyperactive', bucket: 1, why: 'A pooled analysis of 23 controlled experiments, in which neither parents nor children knew who had been given sugar, found no effect on behaviour. Parents who were told their child had eaten sugar rated the child as more active, even when the drink was sugar-free.' },
        { text: 'Carbohydrates are fattening in themselves', bucket: 1, why: 'Many long-lived populations eat mostly carbohydrate. Diets high in whole grains, pulses and fruit are linked to less weight gain, not more. Which carbohydrates, and how much food overall, matters more.' },
        { text: 'Honey and brown sugar are far better for you than white sugar', bucket: 1, why: 'All three are free sugars and behave much alike in the body. The traces of minerals in honey and brown sugar are too small to matter.' },
      ],
      explain: `
        The solid findings are about **kinds** of carbohydrate: more fibre,
        whole grains, pulses and whole fruit; fewer sugary drinks. Claims
        that carbohydrate as a whole is harmful, or that sugar changes
        children's behaviour, have not held up when tested.
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice',
      text: `
        If you like, pick up one drink or breakfast cereal this week and
        read two lines of its label: **"of which sugars"** per 100 g or
        100 mL, and **fibre**.

        Just look. You will soon see how far products that sit side by side
        on a shelf can differ.

        :::note
        People with diabetes are given individual guidance on carbohydrate
        by their care team; a general lesson cannot replace it.
        :::
      `,
      cta: 'Done',
    },
  ],
  recap: [
    'Sugars, starch and fibre are one family: sugar units alone, in pairs, or in chains. Sugars and starch are digested to glucose; fibre is not.',
    'How high blood glucose rises depends on **how fast** a food is digested (its glycaemic index) and **how much** carbohydrate is eaten. Intact structure and fibre slow it down.',
    'Most adults eat too little **fibre**: the WHO advises at least 25 g a day. More fibre goes with less heart disease, type 2 diabetes and bowel cancer.',
    '**Free sugars** (added sugar, honey, syrups, juice) are the ones to keep below 10% of energy. The sugar inside whole fruit is not the problem.',
  ],
  next: 'Next: fat. Which kinds do what, and how the advice came to change.',
};
