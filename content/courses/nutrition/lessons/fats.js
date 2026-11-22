// Food and Nutrition · Lesson 3 · The Truth About Fat
//
// Driving question: why did "eat less fat" turn out to be the wrong advice, and what replaced it?
import { FAT_PROFILES, FAT_LIMITS, SWAPS, COCHRANE_SATFAT, FATTY_ACIDS } from '../helpers.js';

/** A temperature with a proper minus sign. */
const degrees = (v) => (v < 0 ? `−${-v}` : String(v));
const SOLID = FAT_PROFILES.filter((f) => f.solid);
const LIQUID = FAT_PROFILES.filter((f) => !f.solid);
// Reference intake for saturates printed on European labels: 20 g a day (EU Regulation 1169/2011, Annex XIII).
const SATURATES_RI = 20;

// Portions with the grams of saturates their labels might show (typical products; `g` lists believable values).
const SAT_FOODS = [
  { name: 'a slice of cheddar', portion: '30 g', g: [6, 7] },
  { name: 'a croissant', portion: '60 g', g: [6, 7, 8] },
  { name: 'a pot of yogurt', portion: '125 g', g: [1, 2, 3] },
  { name: 'a cereal bar', portion: '30 g', g: [1, 2, 3] },
  { name: 'a serving of ice cream', portion: '70 g', g: [4, 5, 6] },
  { name: 'a sausage roll', portion: '100 g', g: [8, 9, 11, 12] },
  { name: 'a handful of mixed nuts', portion: '30 g', g: [2, 3] },
  { name: 'a pat of butter', portion: '10 g', g: [5] },
];

/** "coconut oil, butter, palm oil and lard", from the table of fats. */
const namesOf = (rows) => {
  const names = rows.map((f) => f.name.replace(' (canola)', '').toLowerCase());
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

// How cholesterol travels: the liver on the left, the tissues on the right, one parcel going each way.
const CARRIERS_SVG =
  '<text class="fig-label" x="200" y="26" text-anchor="middle">LDL carries cholesterol out</text>' +
  '<rect class="fill-orange-soft stroke-ink" stroke-width="2.5" x="8" y="48" width="108" height="92" rx="12"/>' +
  '<text class="fig-label" x="62" y="99" text-anchor="middle">Liver</text>' +
  '<rect class="fill-red-soft stroke-ink" stroke-width="2.5" x="284" y="48" width="108" height="92" rx="12"/>' +
  '<text class="fig-label" x="338" y="90" text-anchor="middle">Tissues and</text><text class="fig-label" x="338" y="108" text-anchor="middle">artery walls</text>' +
  '<line x1="122" y1="72" x2="268" y2="72" class="stroke-ink" stroke-width="3" stroke-linecap="round"/><polygon points="278,72 264,64 264,80" class="fill-ink"/>' +
  '<circle cx="176" cy="72" r="19" class="fill-yellow stroke-ink" stroke-width="2.5"/><text class="fig-label" x="176" y="77" text-anchor="middle">LDL</text>' +
  '<line x1="278" y1="116" x2="132" y2="116" class="stroke-ink" stroke-width="3" stroke-linecap="round"/><polygon points="122,116 136,108 136,124" class="fill-ink"/>' +
  '<circle cx="224" cy="116" r="19" class="fill-teal stroke-ink" stroke-width="2.5"/><text class="fig-label" x="224" y="121" text-anchor="middle">HDL</text>' +
  '<text class="fig-label" x="200" y="170" text-anchor="middle">HDL brings spare cholesterol back</text>';

export default {
  id: 'fats',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The low-fat experiment',
      text: `
        For a generation, the advice in many countries was simple: **eat
        less fat**. In the 1990s a huge American trial put it to the test.
        Nearly 49,000 women were followed for eight years; at random, some
        were coached to eat a low-fat diet, with more grains, fruit and
        vegetables.

        **What happened to their heart attacks and strokes?**
      `,
      options: [
        { text: 'They fell by about half' },
        { text: 'They fell by about a fifth' },
        { text: 'There was no real difference', correct: true },
        { text: 'They rose' },
      ],
      explain: `
        **No real difference** (Women's Health Initiative, 2006). Cutting
        fat as a whole did not protect the heart.

        That result did not show that fat is irrelevant. It showed that
        "fat" is too crude a word. Fats differ, and to see how, you need to
        look at one molecule.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Take a fat molecule apart',
      text: `
        Fats and oils are made of **fatty acids**: chains of carbon atoms
        (black) carrying hydrogen atoms (small circles). This one has
        18 carbons, each holding as many hydrogens as it can.

        **Tap a dashed ring** to turn that bond into a double bond. Try
        one, two and three. Watch the shape, the hydrogens and the melting
        point.
      `,
      widget: { type: 'fatty-acid', doubles: [], alt: 'A chain of 18 carbon atoms with hydrogen atoms attached and an acid group at one end. Three bonds can be switched between single and double. A temperature scale shows the melting point.' },
      check: (s) => s.tried >= 3 || 'Keep going: try a chain with one double bond, then two, then three.',
      solution: { doubles: [9, 12], tried: 3 },
      explain: `
        Each double bond removes two hydrogens and puts a **kink** in the
        chain.

        Straight chains pack side by side like pencils in a box, so the fat
        is **solid** in a room: it melts at ${FATTY_ACIDS.stearic.melt} °C.
        Kinked chains cannot pack, so the fat stays **liquid**: one kink
        brings the melting point down to ${FATTY_ACIDS.oleic.melt} °C, two
        to ${degrees(FATTY_ACIDS.linoleic.melt)} °C.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Saturated and unsaturated',
      text: `
        - **Saturated**: no double bonds. The chain is "saturated" with
          hydrogen. Plenty in butter, cheese, fatty meat, coconut and palm oil.
        - **Monounsaturated**: one double bond. Olive and rapeseed oil,
          avocados, many nuts.
        - **Polyunsaturated**: two or more. Sunflower oil, walnuts, seeds,
          oily fish such as salmon.

        Polyunsaturated fats come in two families, named by counting carbons
        from the far end (the **omega** end) to the first double bond:
        **omega-6** and **omega-3**. In the picture the first double bond
        comes after carbon 6, so this is an omega-6. The body cannot make
        either family from scratch, so one fatty acid of each is
        **essential**: it must be eaten.

        Fat does other jobs too. Every cell membrane is built from it, and
        vitamins A, D, E and K can only be absorbed along with it.
      `,
      figure: { type: 'fatty-acid', doubles: FATTY_ACIDS.linoleic.doubles, static: true, alt: 'Linoleic acid: a chain of 18 carbon atoms with two double bonds, each putting a kink in the chain. Small numbers count the carbons from the omega end: the first double bond comes after carbon 6, so it is an omega-6 fatty acid.' },
    },
    {
      id: 'build-omega3',
      type: 'interact',
      review: true,
      title: 'Count from the omega end',
      text: `
        Flaxseed, walnuts and oily fish are known for their **omega-3** fats.

        **Build an omega-3 fatty acid:** one whose first double bond,
        counting from the omega end, comes after the third carbon.
      `,
      widget: { type: 'fatty-acid', doubles: [9], alt: 'A chain of 18 carbon atoms with an acid end and an omega end. Three bonds can be switched between single and double. Small numbers count the carbons from the omega end to the first double bond.' },
      check: (s) => {
        if (s.count === 0) return 'This chain is saturated: it has no double bond at all. Tap a dashed ring.';
        if (s.omega === 3) return true;
        return `Counting from the omega end, the first double bond here comes after carbon ${s.omega}: this is an omega-${s.omega} fatty acid. Add a double bond nearer the omega end.`;
      },
      solution: { doubles: [9, 12, 15] },
      hints: ['The small numbers count carbons from the omega end. They stop at the first double bond.', 'Switch on the ring nearest the omega end.'],
      explain: `
        A double bond after the third carbon from the omega end makes an
        omega-3. With all three double bonds this is **alpha-linolenic
        acid**, the essential omega-3 of plants. The body can turn a little
        of it into the longer omega-3 fats found ready-made in oily fish.
      `,
    },
    {
      id: 'teach-mixtures',
      type: 'info',
      title: 'Real fats are mixtures',
      text: `
        No food contains just one fatty acid. Every fat and oil is a
        mixture, and the mix decides how it behaves in a kitchen.

        Straight saturated chains pack together, so a fat that is rich in
        them **sets**: ${namesOf(SOLID)} are solid or semi-solid at room
        temperature (20 °C).

        Kinked unsaturated chains cannot pack, so a fat made mostly of them
        **pours**: ${namesOf(LIQUID)}.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 20, unit: '%', yLabel: 'saturated, % of the fatty acids',
        data: FAT_PROFILES.map((f) => ({ label: f.name.replace(' (canola)', '').replace(' ', '\n'), value: f.sat, color: f.solid ? 'red' : 'gray' })),
        alt: `Bar chart of the share of saturated fatty acids in seven fats. ${FAT_PROFILES.map((f) => `${f.name}: ${f.sat}%, ${f.solid ? 'solid or semi-solid' : 'liquid'} at 20 °C`).join('. ')}.`,
        caption: `Saturated share of the fatty acids. The ${SOLID.length} on the left set at 20 °C; the ${LIQUID.length} on the right pour.`,
      },
    },
    {
      id: 'solid-or-liquid',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const solid = rng.pick(SOLID);
        const liquids = rng.sample(LIQUID, 2);
        const trio = rng.shuffle([solid, ...liquids]);
        return {
          text: `
            Real fats are mixtures. The bars show what the fatty acids in
            three of them are made of.

            Two of these pour at room temperature (20 °C). One is solid or
            semi-solid. **Which one?**
          `,
          figure: {
            type: 'bars', yMax: 100, yStep: 20, unit: '%', yLabel: '% of the fatty acids',
            categories: trio.map((f) => f.name.replace(' (canola)', '')),
            series: [
              { name: 'Saturated', color: 'red', values: trio.map((f) => f.sat) },
              { name: 'Monounsaturated', color: 'yellow', values: trio.map((f) => f.mono) },
              { name: 'Polyunsaturated', color: 'teal', values: trio.map((f) => f.poly) },
            ],
            alt: `Bar chart of three fats. ${trio.map((f) => `${f.name}: ${f.sat}% saturated, ${f.mono}% monounsaturated, ${f.poly}% polyunsaturated`).join('. ')}.`,
          },
          shuffle: false,
          options: trio.map((f) => (f === solid
            ? { text: f.name, correct: true }
            : { text: f.name, why: `Only ${f.sat}% of its fatty acids are saturated. Most of its chains are kinked, so they cannot pack together: it pours.` })),
          hints: ['Which kind of chain is straight enough to pack into a solid?'],
          explain: `**${solid.name}**: ${solid.sat}% of its fatty acids are saturated, against ${liquids[0].sat}% and ${liquids[1].sat}% for the other two. Straight saturated chains pack together, so it sets. The more unsaturated a fat, the more easily it pours.`,
        };
      },
    },
    {
      id: 'trans',
      type: 'interact',
      title: 'Straightening the kink',
      text: `
        A century ago, industry found a way to make cheap liquid oils solid
        and long-lasting, for margarine, frying fat and biscuits:
        **partial hydrogenation**. A side effect is that some double bonds
        are left twisted into a different form, called **trans**.

        This is oleic acid from olive oil. **Turn its double bond to trans.**
      `,
      widget: { type: 'fatty-acid', doubles: [9], sites: [9], transSwitch: true, alt: 'Oleic acid: a chain of 18 carbon atoms with one double bond that kinks the chain. A switch turns the double bond between its cis and trans forms.' },
      check: (s) => {
        if (s.count === 0) return 'The double bond has gone: this is now a saturated fat. Tap the ring to put it back, then use the switch.';
        return s.trans || 'Use the switch under the molecule to turn the bond.';
      },
      solution: { doubles: [9], trans: true },
      explain: `
        Same atoms, different shape: the chain is straight again, and the
        melting point jumps from ${FATTY_ACIDS.oleic.melt} °C to
        ${FATTY_ACIDS.elaidic.melt} °C.

        **Industrial trans fat** turned out to be the most harmful fat in
        the food supply, raising the risk of heart disease even in small
        amounts. The evidence is strong. Denmark restricted it in 2003, and
        since 2018 the World Health Organization has campaigned to remove it
        everywhere; by 2025 about 60 countries had done so.
      `,
    },
    {
      id: 'teach-carriers',
      type: 'info',
      title: 'How fat travels',
      text: `
        Fat and cholesterol do not dissolve in blood, so the body ships
        them in tiny protein-coated parcels called **lipoproteins**.
        Two matter most here.

        **LDL** parcels carry cholesterol out from the liver. If too many
        circulate, some lodge in artery walls and start the build-up behind
        most heart attacks.

        **HDL** parcels collect spare cholesterol and return it to the
        liver.

        The cholesterol inside is the same substance in both. Only the
        parcel differs.
      `,
      figure: { type: 'svg', viewBox: '0 0 400 184', maxWidth: 440, content: CARRIERS_SVG, alt: 'Two boxes: the liver on the left, the tissues and artery walls on the right. An arrow from the liver to the tissues carries a parcel marked LDL: it takes cholesterol out. An arrow back to the liver carries a parcel marked HDL: it brings spare cholesterol back.' },
    },
    {
      id: 'carriers',
      type: 'fill',
      title: 'How fat travels',
      text: `
        Cholesterol travels in the blood in two kinds of parcel, LDL and
        HDL.

        **Complete the summary.**
      `,
      template: 'LDL carries cholesterol [[back to the liver|*out to the body\'s tissues|into the gut]]. HDL carries it [[*back to the liver|into artery walls|out to the muscles]]. The cholesterol inside the two is [[different|*the same substance]].',
      explain: `
        "Bad" and "good" cholesterol are the same cholesterol in two
        carriers. The nicknames are only half right: a high **LDL** level
        really does cause artery disease, but medicines that raise HDL have
        not prevented heart attacks.

        What LDL means for risk is taken up in *Know Your Numbers*, in
        Staying Well.
      `,
    },
    {
      id: 'swap',
      type: 'interact',
      mode: 'predict',
      title: 'It depends what replaces it',
      text: `
        Saturated fat raises LDL. So does eating less of it help? Two big
        American studies followed about 127,000 people for over 24 years
        and compared diets in which a little saturated fat (5% of energy)
        was replaced by something else.

        The bars start at 100: **no change in heart disease**. Drag each
        to show the risk you would expect after the swap.
      `,
      widget: {
        type: 'bars', adjust: true, step: 5, yMax: 120, yStep: 20, yLabel: 'heart disease risk (no swap = 100)',
        data: SWAPS.map((sw, i) => ({ label: sw.name.replace(' fat', '\nfat').replace(' and ', '\nand '), value: 100, color: ['teal', 'yellow', 'orange', 'gray'][i] })),
        alt: 'Four adjustable bars, all starting at 100: saturated fat replaced by polyunsaturated fat, by monounsaturated fat, by whole grains, and by refined starch and sugar.',
      },
      check: (s) => s.values[0][0] < 100 && s.values[0][3] >= 95,
      solution: { values: [SWAPS.map((sw) => 100 + sw.change)] },
      explain: `
        | Saturated fat replaced by | Heart disease risk |
        |---|:-:|
        | polyunsaturated fat | 25% lower |
        | monounsaturated fat | 15% lower |
        | whole grains | 9% lower |
        | refined starch and sugar | no change |

        This explains the low-fat experiment. People who cut fat mostly ate
        more refined carbohydrate instead, and many "low-fat" products of
        the time replaced their fat with sugar and starch.
      `,
    },
    {
      id: 'teach-trials',
      type: 'info',
      title: 'From observing to testing',
      text: `
        The bars show what the two studies found. But they **observed**
        people who chose their own diets, and people who eat differently
        also live differently. Such figures can mislead.

        A **randomised trial** removes that doubt: chance decides who
        changes their diet.

        A Cochrane review (${COCHRANE_SATFAT.year}) pooled the trials in
        which people were assigned to eat less saturated fat for at least
        two years. Heart attacks, strokes and other cardiovascular events
        fell by about ${COCHRANE_SATFAT.events}% in the latest edition of the
        review, and by 21% in the edition before it. Deaths from all causes
        changed little or not at all. The reviewers graded this as
        moderate-quality evidence.
      `,
      figure: {
        type: 'bars', yMax: 120, yStep: 20, yLabel: 'heart disease risk (no swap = 100)',
        data: SWAPS.map((sw, i) => ({ label: sw.name.replace(' fat', '\nfat').replace(' and ', '\nand '), value: 100 + sw.change, color: ['teal', 'yellow', 'orange', 'gray'][i] })),
        alt: `Bar chart of heart disease risk after replacing a little saturated fat, with no swap set at 100: ${SWAPS.map((sw) => `${sw.name} ${100 + sw.change}`).join(', ')}.`,
        caption: 'Observed risk after each swap. Li et al., 2015.',
      },
    },
    {
      id: 'how-sure',
      type: 'choice',
      title: 'How sure is this?',
      text: `
        Those figures come from observing people, which can mislead. So
        researchers also pooled the **randomised trials** in which people
        were assigned to eat less saturated fat for two years or more
        (Cochrane review, ${COCHRANE_SATFAT.year}).

        **Which summary fits what they found?**
      `,
      options: [
        { text: 'About a sixth to a fifth fewer heart attacks and strokes; little or no effect on overall deaths', correct: true },
        { text: 'No effect of any kind', why: 'There was an effect: about 17 to 21% fewer cardiovascular events, and larger where blood cholesterol fell further.' },
        { text: 'Deaths from all causes were halved', why: 'The trials found little or no effect on deaths from all causes, and a moderate reduction in heart attacks and strokes.' },
        { text: 'Saturated fat turned out to protect the heart', why: 'No. Eating less of it lowered cardiovascular events in the pooled trials.' },
      ],
      columns: 1,
      explain: `
        A moderate benefit, graded as moderate-quality evidence. It agrees
        with the observational studies and with what is known about LDL.

        So the mainstream position is: keep saturated fat to no more than
        about ${FAT_LIMITS.saturatedPct}% of energy (WHO, 2023), and let
        unsaturated fats or whole grains take its place. Scientists still
        argue about the size of the effect, and whether the saturated fat in
        foods such as yogurt and cheese acts differently.
      `,
    },
    {
      id: 'saturates-ri',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const item = rng.pick(SAT_FOODS);
        const g = rng.pick(item.g);
        const answer = (g * 100) / SATURATES_RI;
        return {
          text: `
            European labels compare a portion with a **reference intake** for
            an average adult: for saturates, **${SATURATES_RI} g a day**.

            The label of ${item.name} (${item.portion}) says it contains
            **${g} g of saturates**. **What percentage of the reference intake is that?**

            For example, 10 g would be 10 ÷ ${SATURATES_RI} = 0.5, which is 50%.
          `,
          answer,
          unit: '%',
          wrong: [
            [g, `That is the grams. As a share of ${SATURATES_RI} g it is ${g} ÷ ${SATURATES_RI}.`],
            [SATURATES_RI - g, `That is how many grams are left of the ${SATURATES_RI} g. The question asks for the share this portion supplies.`],
          ],
          hints: [`Divide ${g} by ${SATURATES_RI}, then turn the fraction into a percentage.`, `Each gram is 5% of ${SATURATES_RI} g.`],
          explain: `${g} ÷ ${SATURATES_RI} = ${Math.round((g * 100) / SATURATES_RI) / 100}, which is **${answer}%**. The reference is a yardstick for comparing products, drawn for an average adult; it is not a personal target.`,
        };
      },
    },
    {
      id: 'eggs',
      type: 'choice',
      title: 'What about eggs?',
      text: `
        One egg contains about 185 mg of **cholesterol**, and for decades
        people were told to limit eggs for that reason. But the liver makes
        most of the cholesterol in the body, and it makes less when more
        arrives in food.

        **For most people, what raises the LDL cholesterol in their blood more?**
      `,
      options: [
        { text: 'The saturated and trans fat they eat', correct: true },
        { text: 'The cholesterol they eat', why: 'Less than was once thought. The liver makes most of the body\'s cholesterol and makes less when more arrives in food.' },
        { text: 'The total amount of fat they eat', why: 'The kind of fat matters far more than the total. Unsaturated fats lower LDL when they replace saturated fat.' },
      ],
      columns: 1,
      explain: `
        Because the liver adjusts its output to what arrives in food,
        **cholesterol in food matters less than once thought**, while
        saturated and trans fat push LDL up. The United States dropped its
        300 mg daily limit in 2015. In large studies, up to an egg a day is
        not linked to more heart disease in the general population.

        People respond differently, and those with diabetes or an inherited
        high cholesterol are usually given individual advice.
      `,
    },
    {
      id: 'sort-fats',
      type: 'bucket',
      review: true,
      text: 'Put it together. **Sort each food by the kind of fat that dominates in it.**',
      buckets: ['Mostly saturated', 'Mostly unsaturated'],
      items: [
        { text: 'Butter', bucket: 0 },
        { text: 'Coconut oil', bucket: 0, why: 'A plant oil, but more than four fifths of its fatty acids are saturated. That is why it is solid in a cool room.' },
        { text: 'Cheddar cheese', bucket: 0, why: 'Milk fat is about two thirds saturated, in cheese as in butter.' },
        { text: 'Palm oil', bucket: 0, why: 'About half saturated, and semi-solid at room temperature: the most saturated of the common cooking oils after coconut.' },
        { text: 'Olive oil', bucket: 1 },
        { text: 'Walnuts', bucket: 1 },
        { text: 'Salmon', bucket: 1, why: 'Oily fish are rich in long omega-3 fats, which are polyunsaturated.' },
        { text: 'Sunflower oil', bucket: 1 },
      ],
      explain: 'A useful rule of thumb: fats that are **solid** at room temperature are rich in saturated fat, and those that **pour** are mostly unsaturated. Coconut and palm oil are plant oils, yet they follow the rule: both are highly saturated, and both set in a cool room. (Meat fats such as beef fat and lard sit in between: solid, but only about 40 to 50% saturated.)',
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice',
      text: `
        Nutrition science took a wrong turn on fat, and then corrected
        itself with trials. That is how it is supposed to work, and it is a
        good reason to prefer a body of evidence to a single headline.

        If you are curious this week, look at the fats in your own kitchen.
        Which are solid at room temperature, and which pour? You now know
        what that says about the molecules inside.
      `,
      cta: 'Done',
    },
  ],
  recap: [
    'Fats are built from fatty acids. **Saturated** chains are straight and pack into solids; each double bond of an **unsaturated** chain adds a kink, so oils pour.',
    'Two polyunsaturated families, **omega-3** and **omega-6**, are essential: the body cannot make them. Fat also carries vitamins A, D, E and K.',
    'Industrial **trans fat** is clearly harmful and is being removed from food worldwide.',
    'Replacing saturated fat with **unsaturated fat** lowers LDL and heart disease; replacing it with refined starch and sugar does not. Total fat was the wrong target.',
  ],
  next: 'Next: protein. Twenty building blocks, nine you must eat, and how much a body really needs.',
};
