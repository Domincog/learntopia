// Food and Nutrition · Lesson 4 · Building Blocks
//
// Driving question: how much protein does a body really need, and can plants supply it?
import { foods, FOODS, PROTEIN_REF, PROTEIN_INTAKE_US, PROTEIN_SERVINGS, ESSENTIAL_AMINO_ACIDS, AMINO_ACIDS_TOTAL, PEOPLE } from '../helpers.js';

const PROTEIN_FOODS = foods('chicken', 'egg', 'cheese', 'milk', 'lentils', 'tofu', 'peanuts', 'almonds', 'wholemeal', 'rice');
const PLANT = ['lentils', 'tofu', 'peanuts', 'almonds', 'wholemeal', 'rice'];
const ANIMAL_SERVINGS = ['chicken', 'salmon', 'eggs', 'yogurt', 'milk', 'cheese'];
const TALLY_TAGS = { plant: { name: 'plant foods', color: 'green' }, animal: { name: 'animal foods', color: 'violet' } };
const tallyItems = (ids) => ids.map((id) => {
  const it = PROTEIN_SERVINGS.find((sv) => sv.id === id);
  return { id, name: it.name, amount: it.g, tag: ANIMAL_SERVINGS.includes(id) ? 'animal' : 'plant' };
});
const DAY_ITEMS = tallyItems(['lentils', 'tofu', 'chickpeas', 'peanuts', 'bread', 'oats', 'rice', 'chicken', 'eggs', 'milk']);
const AMARA = { kg: 70, ref: 56 };
// body-map ids: the organs that deal with the nitrogen of surplus amino acids, and the ones offered to choose from
const UREA_ORGANS = ['left-kidney', 'liver', 'right-kidney'];
const UREA_PICKABLE = ['right-lung', 'left-lung', 'heart', 'liver', 'right-kidney', 'left-kidney', 'bladder'];
/** A serving's name without its portion size: 'a salmon fillet (120 g)' -> 'a salmon fillet'. */
const plain = (name) => name.replace(/ \(.*\)$/, '');

// Twenty amino acids as beads: the nine essential ones filled.
const AMINO_SVG = (() => {
  let out = '';
  for (let i = 0; i < AMINO_ACIDS_TOTAL; i++) {
    const x = 34 + (i % 10) * 44;
    const y = i < 10 ? 46 : 96;
    const essential = i < ESSENTIAL_AMINO_ACIDS.length;
    if (i % 10) out += `<line x1="${x - 44 + 15}" x2="${x - 15}" y1="${y}" y2="${y}" class="stroke-ink" stroke-width="3" stroke-linecap="round"/>`;
    out += `<circle cx="${x}" cy="${y}" r="15" class="${essential ? 'fill-violet' : 'fill-gray-soft'} stroke-ink" stroke-width="2.5"/>`;
    if (essential) out += `<text x="${x}" y="${y + 5}" text-anchor="middle" class="fig-label" style="fill:#1D1B26">E</text>`;
  }
  out += '<circle cx="34" cy="150" r="9" class="fill-violet stroke-ink" stroke-width="2"/><text class="fig-label-sm" x="50" y="154">9 essential: must come from food</text>';
  out += '<circle cx="270" cy="150" r="9" class="fill-gray-soft stroke-ink" stroke-width="2"/><text class="fig-label-sm" x="286" y="154">11 the body can make itself</text>';
  return out;
})();

// Schematic: how a grain and a pulse cover each other's short amino acid. No scale: the dashed line is "what the body needs".
const COMPLEMENT_SVG = (() => {
  const base = 190;
  const need = 110;
  const bar = (x, hgt, cls) => `<rect x="${x}" y="${base - hgt}" width="34" height="${hgt}" rx="5" class="${cls} stroke-ink" stroke-width="2.5"/>`;
  const group = (x, name, lys, met) => bar(x, lys, 'fill-orange') + bar(x + 42, met, 'fill-teal') +
    `<text class="fig-label" x="${x + 38}" y="${base + 22}" text-anchor="middle">${name}</text>`;
  return `<line x1="20" x2="470" y1="${base}" y2="${base}" class="stroke-ink" stroke-width="2.5" stroke-linecap="round"/>` +
    group(50, 'Grain', 48, 128) + group(200, 'Pulse', 124, 70) + group(350, 'Both', 86, 99) +
    `<line x1="20" x2="470" y1="${need}" y2="${need}" class="stroke-ink" stroke-width="2" stroke-dasharray="6 5"/>` +
    // the name of the dashed line sits in the key: beside the line itself it ran across the top of a bar
    '<rect x="60" y="14" width="14" height="14" rx="3" class="fill-orange stroke-ink" stroke-width="2"/><text class="fig-label-sm" x="80" y="26">lysine</text>' +
    '<rect x="150" y="14" width="14" height="14" rx="3" class="fill-teal stroke-ink" stroke-width="2"/><text class="fig-label-sm" x="170" y="26">methionine</text>' +
    '<line x1="268" x2="296" y1="21" y2="21" class="stroke-ink" stroke-width="2" stroke-dasharray="6 5"/><text class="fig-label-sm" x="304" y="26">what the body needs</text>';
})();

export default {
  id: 'protein',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'Enough protein?',
      text: `
        Protein shakes, protein bars, protein yogurt: a visitor from another
        planet might conclude that humans are running short.

        The grey bars show a long-standing **reference intake** for two
        example adults: 60 g a day for a 75 kg man, 48 g for a 60 kg woman.
        **Drag the orange bars** to show what you think men and women in the
        United States actually eat, on average.
      `,
      widget: {
        type: 'bars', yMax: 140, yStep: 20, unit: 'g', step: 5, yLabel: 'protein per day (g)',
        categories: ['Men', 'Women'],
        series: [
          { name: 'Reference intake', color: 'gray', values: [60, 48] },
          { name: 'Average eaten', color: 'orange', values: [60, 50] },
        ],
        adjust: [1],
        alt: 'Bar chart. Grey bars: a reference protein intake of 60 grams a day for a 75 kilogram man and 48 grams for a 60 kilogram woman. Orange bars, adjustable: your estimate of the average eaten.',
      },
      check: (s) => s.values[1][0] > 60 && s.values[1][1] > 48,
      solution: { values: [[60, 48], [100, 65]] },
      explain: `
        About **${PROTEIN_INTAKE_US.men} g** a day for men and
        **${PROTEIN_INTAKE_US.women} g** for women (US national survey).
        Other rich countries are similar.

        So most people there already eat well above the reference, without
        trying. To see what the reference means, start with what protein is.
      `,
    },
    {
      id: 'teach-builds',
      type: 'info',
      title: 'What protein builds',
      text: `
        Carbohydrate and fat are mainly fuel. Protein is mainly
        **material**: proteins are the body's working parts.

        - **muscle** fibres
        - **enzymes**, such as the ones that digest your food
        - **antibodies**, which stick to germs
        - **haemoglobin**, which carries oxygen in red blood cells
        - many hormones, the collagen in skin and bone, the keratin of hair
          and nails

        Every one of them is a chain of smaller units called **amino
        acids**, folded into a particular shape.

        The energy store under the skin is not protein. It is fat.
      `,
    },
    {
      id: 'builds',
      type: 'multi',
      title: 'What protein builds',
      text: `
        Carbohydrate and fat are mainly fuel. Protein is mainly **material**.

        **Which of these are made of protein?**
      `,
      options: [
        { text: 'Muscle fibres', correct: true },
        { text: 'The enzymes that digest your food', correct: true },
        { text: 'Antibodies that stick to germs', correct: true },
        { text: 'Haemoglobin, which carries oxygen in red blood cells', correct: true },
        { text: 'The energy store under the skin', why: 'That store is fat, not protein. The body has no dedicated store of spare protein at all.' },
      ],
      explain: `
        All but the last. Muscle, enzymes, antibodies and haemoglobin are
        proteins, each a folded chain of **amino acids**. The store under
        the skin is fat, and the body has no dedicated store of spare
        protein at all.
      `,
    },
    {
      id: 'amino',
      type: 'info',
      title: 'Twenty letters',
      text: `
        There are **${AMINO_ACIDS_TOTAL} amino acids**, and every protein in
        every living thing is spelled out of them, like words from an
        alphabet.

        Digestion takes the proteins in food apart into single amino acids
        (*From Plate to Bloodstream*, in The Body I). Your cells then spell
        out their own proteins from the pool.

        Your body can make **eleven** of the twenty from other materials.
        The other **${ESSENTIAL_AMINO_ACIDS.length}** it cannot make: they are
        the **essential amino acids**, and they have to arrive in food.
      `,
      figure: { type: 'svg', viewBox: '0 0 460 172', maxWidth: 500, content: AMINO_SVG, alt: 'Twenty beads on two strings, one bead for each amino acid. Nine are marked E for essential: they must come from food. The other eleven can be made by the body.' },
    },
    {
      id: 'explore',
      type: 'interact',
      title: 'Where the protein is',
      text: `
        Ten foods, 100 g of each. Protein is the violet part.

        **Find a plant food with more protein in 100 g than a boiled egg.**
        Leave it on screen.
      `,
      widget: { type: 'food-makeup', foods: PROTEIN_FOODS, food: 'egg', alt: 'Two bars for 100 grams of a food: what it is made of by weight, and where its energy comes from. Buttons switch between ten foods.' },
      check: (s) => {
        if (!s.food || s.food === 'egg') return 'Choose another food and compare its protein with the 13 g in a boiled egg.';
        if (!PLANT.includes(s.food)) return `${FOODS[s.food].name} comes from an animal. Look among the plant foods.`;
        if (s.grams.protein > FOODS.egg.protein) return true;
        return `${FOODS[s.food].name} has ${s.grams.protein} g of protein in 100 g; a boiled egg has ${FOODS.egg.protein} g. Try a drier plant food.`;
      },
      solution: { food: 'peanuts' },
      hints: ['Water dilutes everything else. Which plant foods here hold very little water?'],
      explain: `
        **Peanuts** (${FOODS.peanuts.protein} g) and **almonds**
        (${FOODS.almonds.protein} g) both beat the egg
        (${FOODS.egg.protein} g), and firm tofu equals it.

        Boiled lentils look modest at ${FOODS.lentils.protein} g only
        because they are 70% water: a bowl of them still supplies nearly as
        much protein as three eggs. Protein is spread through many foods, plant
        and animal.
      `,
    },
    {
      id: 'teach-complement',
      type: 'info',
      title: 'Complete and complementary',
      text: `
        Animal foods, soya and quinoa supply all nine essential amino acids
        in roughly the proportions the body uses. Most plant foods run a
        little short of one. **Grains** are low in lysine; **pulses** (beans,
        lentils, chickpeas) are low in methionine.

        Eaten together, each covers the other's gap, as the sketch shows:
        rice and beans, dal and roti, hummus and bread.

        The body draws on a pool of amino acids that lasts through the day,
        so the two do not have to arrive at the same meal.
      `,
      figure: { type: 'svg', viewBox: '0 0 490 222', maxWidth: 500, content: COMPLEMENT_SVG, alt: 'A sketch with three pairs of bars and a dashed line for what the body needs. Grain: lysine below the line, methionine well above. Pulse: lysine well above, methionine below. Both together: lysine and methionine near or above the line.' },
    },
    {
      id: 'complement',
      type: 'choice',
      title: 'Complete and complementary',
      text: `
        **Grains** are low in the amino acid lysine; **pulses** (beans,
        lentils, chickpeas) are low in methionine. The sketch shows what
        each supplies, and what both supply together.

        **What does that mean for someone who eats little or no animal
        food?**
      `,
      figure: { type: 'svg', viewBox: '0 0 490 222', maxWidth: 500, content: COMPLEMENT_SVG, alt: 'A sketch with three pairs of bars and a dashed line for what the body needs. Grain: lysine below the line, methionine well above. Pulse: lysine well above, methionine below. Both together: lysine and methionine near or above the line.' },
      options: [
        { text: 'Eating a mix of plant foods over the day covers all nine', correct: true },
        { text: 'Grain and pulse must be eaten in the same mouthful to count', why: 'That was once taught, but the body pools amino acids over many hours. A varied day is enough.' },
        { text: 'They cannot get enough of the essential amino acids', why: 'They can. What one plant food lacks, another supplies, and soya and quinoa are complete on their own.' },
        { text: 'They need an amino acid supplement', why: 'A mixed diet of ordinary plant foods supplies them all, provided enough food is eaten.' },
      ],
      columns: 1,
      explain: `
        What one plant food lacks, another supplies, and the pairing does
        not have to happen at one meal: a varied day is enough.

        Dietetic associations agree that well-planned vegetarian and vegan
        diets supply enough protein. (They do need a source of vitamin B12:
        next lesson.)
      `,
    },
    {
      id: 'needs',
      type: 'info',
      title: 'How much?',
      text: `
        For healthy adults, the long-standing reference is about
        **${PROTEIN_REF.rda} g of protein per kilogram of body weight a
        day** (WHO and European values: ${PROTEIN_REF.who}). It is set to
        cover the needs of nearly everyone, not just the average person.

        Needs per kilogram are higher for:

        - children and teenagers, who are growing
        - pregnancy and breastfeeding
        - people over about 65: many experts suggest
          ${PROTEIN_REF.olderLow.toFixed(1)} to ${PROTEIN_REF.olderHigh}
        - athletes in heavy training: ${PROTEIN_REF.athleteLow} to
          ${PROTEIN_REF.athleteHigh.toFixed(1)}

        :::note Authorities differ
        The United States' dietary guidelines for 2025 to 2030 (published
        in January 2026) suggest ${PROTEIN_REF.dga2026Low} to
        ${PROTEIN_REF.dga2026High} g per kg, a rise that many nutrition
        scientists questioned. People with kidney
        disease are given different advice, often to eat *less* protein:
        that is a matter for their care team.
        :::
      `,
    },
    {
      id: 'reference-intake',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const kg = rng.int(10, 19) * 5;
        const answer = (kg * 8) / 10;
        return {
          text: `
            ${who} is a healthy adult who weighs **${kg} kg**.

            Using the reference of **${PROTEIN_REF.rda} g of protein per
            kilogram of body weight a day**, how much protein is that?

            For example, for an adult of 62 kg it would be 62 × 0.8 = 49.6 g a day.
          `,
          answer,
          unit: 'g a day',
          wrong: [
            [kg, 'That is one gram for every kilogram. The reference is 0.8 g per kilogram.'],
            [Math.round((kg / 0.8) * 100) / 100, 'That divides by 0.8. Multiply: each kilogram needs 0.8 g.'],
            [kg * 8, 'Check the decimal point: 0.8 g per kilogram, not 8.'],
          ],
          hints: [`Multiply the weight by ${PROTEIN_REF.rda}.`, `${kg} × 0.8 is the same as ${kg} × 8 ÷ 10.`],
          explain: `${kg} × ${PROTEIN_REF.rda} = **${answer} g a day**. That is a reference for a healthy adult, not a personal prescription: age, pregnancy, training and illness all shift it.`,
        };
      },
    },
    {
      id: 'plant-day',
      type: 'interact',
      title: 'A day from plants',
      text: `
        Amara weighs ${AMARA.kg} kg, so her reference intake is
        ${AMARA.kg} × ${PROTEIN_REF.rda} = **${AMARA.ref} g** of protein a day.

        Tap servings to put them into her day.
        **Reach the line using plant foods only.**
      `,
      widget: {
        type: 'serving-tally', what: 'protein', unit: 'g', target: AMARA.ref, targetLabel: 'Amara\'s reference', scaleMax: 100,
        tags: TALLY_TAGS, items: DAY_ITEMS,
        alt: 'A bar that adds up the protein in the servings chosen for Amara\'s day, with a dashed line at 56 grams. Buttons add servings of ten foods.',
      },
      check: (s) => {
        if (s.count === 0) return 'Tap a serving to add it to the day.';
        if (s.byTag.animal > 0) return `That day includes ${s.byTag.animal} g of protein from animal foods. Take those out and see whether plants can do it alone.`;
        if (s.reached) return true;
        return `${s.total} g so far, all from plants: ${AMARA.ref - s.total} g short of the line. Add another serving.`;
      },
      solution: { picked: ['lentils', 'tofu', 'bread', 'peanuts', 'oats'] },
      hints: ['Lentils, tofu and chickpeas are the big contributors among the plant foods.'],
      explain: `
        It takes four or five ordinary servings: for example a bowl of
        lentils (18 g), a block of tofu (20 g), two slices of wholemeal
        bread (8 g), a handful of peanuts (8 g) and a bowl of porridge (5 g)
        make 59 g.

        With animal foods it is quicker still, which is why most people
        pass the line without noticing.
      `,
    },
    {
      id: 'above-reference',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const kg = rng.int(11, 18) * 5;
        const ref = (kg * 8) / 10;
        let items; let total;
        do {
          items = rng.sample(PROTEIN_SERVINGS, 4);
          total = items.reduce((t, it) => t + it.g, 0);
        } while (total - ref < 4 || total - ref > 50);
        return {
          text: `
            ${who} weighs ${kg} kg, so the reference intake is
            ${kg} × ${PROTEIN_REF.rda} = **${ref} g** of protein a day.

            Yesterday the protein in ${who}'s meals came mainly from
            ${items.slice(0, 3).map((it) => `${plain(it.name)} (${it.g} g)`).join(', ')}
            and ${plain(items[3].name)} (${items[3].g} g).

            **How many grams above the reference is that?**
          `,
          answer: total - ref,
          unit: 'g',
          wrong: [[total, `That is the day's total. The question asks how far it is above ${ref} g.`]],
          hints: [`First add up the four: ${items.map((it) => it.g).join(' + ')}.`, `Then take away ${ref}.`],
          explain: `${items.map((it) => it.g).join(' + ')} = ${total} g, and ${total} − ${ref} = **${total - ref} g** above the reference, from four items alone. This is typical: an ordinary mixed diet supplies more protein than the reference without any special effort.`,
        };
      },
    },
    {
      id: 'teach-spare',
      type: 'info',
      title: 'No protein store',
      text: `
        Spare carbohydrate can be stored as glycogen, and spare fat as body
        fat. There is **no store for spare protein**.

        Amino acids the body has no immediate use for go to the liver. It
        strips off their nitrogen, which leaves as **urea** in the urine
        (*Keeping the Balance*, in The Body I). What remains is used for
        energy or turned into glucose or fat.

        So protein eaten beyond need is simply an expensive fuel. Timing
        matters little too: when trials on training are pooled, the total
        protein eaten over the day explains the results. A narrow "window"
        after exercise does not.
      `,
    },
    {
      id: 'spare',
      type: 'choice',
      review: true,
      title: 'No protein store',
      text: `
        Spare carbohydrate can be stored as glycogen, and spare fat as body
        fat. There is **no store for spare protein**.

        **What happens to amino acids the body has no immediate use for?**
      `,
      options: [
        { text: 'They are burned as fuel or converted, and their nitrogen leaves in the urine', correct: true },
        { text: 'They are stored in the muscles until needed', why: 'Muscle is working tissue, not a storeroom. It grows in response to use, not to extra protein alone.' },
        { text: 'They pass straight through the gut unabsorbed', why: 'Protein is digested and absorbed very efficiently. The surplus is dealt with after absorption, mainly in the liver.' },
        { text: 'They build up in the blood', why: 'The liver removes them. Their nitrogen is turned into urea, which the kidneys excrete.' },
      ],
      columns: 1,
      explain: `
        The liver strips off the nitrogen, which leaves as **urea** in the
        urine. What remains is used for energy or turned into glucose or
        fat.

        For healthy people that is harmless; it is also why supplements are
        rarely needed.
      `,
    },
    {
      id: 'nitrogen-route',
      type: 'interact',
      title: 'Where the surplus goes',
      text: `
        The figure is facing you. One organ takes the nitrogen off surplus
        amino acids and makes **urea**. Two others filter the urea out of
        the blood.

        **Tap all three.**
      `,
      widget: {
        type: 'body-map', view: 'torso', mode: 'pickMany', max: 3,
        show: UREA_PICKABLE, focus: ['kidneys'],
        pickable: UREA_PICKABLE, answer: UREA_ORGANS,
        alt: 'The chest and abdomen of a figure facing you, with seven organs drawn without names: two in the chest, one large and two smaller ones in the upper abdomen, and one low in the pelvis.',
      },
      check: (s) => {
        const right = s.picked.filter((id) => UREA_ORGANS.includes(id)).length;
        const wrong = s.picked.filter((id) => !UREA_ORGANS.includes(id));
        if (wrong.includes('bladder')) return 'One of those is the bladder, which only stores urine. Look for the organ that makes urea and the pair that filter it out.';
        if (wrong.length) return `${right === 0 ? 'None' : right === 1 ? 'One' : 'Two'} of those ${right === 1 ? 'is' : 'are'} right. The organ that makes urea is the largest in the abdomen; the two filters sit behind it and beside it, one on each side. (The heart and lungs are in the chest.)`;
        if (s.count < 3) return `${s.count === 0 ? 'Nothing is chosen yet' : s.count === 1 ? 'One right so far' : 'Two right so far'}. There are three: one large organ and a pair.`;
        return true;
      },
      solution: { picked: UREA_ORGANS },
      hints: ['The largest organ of the abdomen does the chemistry.', 'The filters are a pair, towards the back, one on each side of the spine.'],
      explain: `
        The **liver** makes urea; the two **kidneys** filter it into the
        urine, which the bladder then stores.

        Healthy kidneys handle the urea from a high-protein diet without
        trouble. When kidneys are diseased, the load matters, which is why
        advice on protein changes then.
      `,
    },
    {
      id: 'myths',
      type: 'bucket',
      review: true,
      title: 'Claims about protein',
      text: '**Sort these claims** by how well the evidence supports them.',
      buckets: ['Well supported', 'Myth or overstated'],
      items: [
        { text: 'Pulses, tofu, nuts and grains together can cover protein needs', bucket: 0 },
        { text: 'People over 65 may need somewhat more protein per kilogram', bucket: 0, why: 'Ageing muscle responds less readily to protein, so many expert groups suggest 1.0 to 1.2 g per kg for healthy older adults.' },
        { text: 'People with kidney disease are often advised differently about protein', bucket: 0 },
        { text: 'Protein must be eaten within 30 minutes of exercise or the session is wasted', bucket: 1, why: 'When trials are pooled, the total protein eaten over the day explains the results; a narrow "window" after training does not.' },
        { text: 'Most healthy adults need protein shakes or bars', bucket: 1, why: 'Average intakes in rich countries are already well above the reference. Supplements are food in a more expensive form.' },
        { text: 'Plant proteins must be combined at every single meal', bucket: 1, why: 'The body pools amino acids over the day. A varied diet covers all nine essential ones.' },
      ],
      explain: `
        Protein matters, and some groups do need more: growing children,
        pregnant women, older adults, athletes. But for most healthy adults
        eating ordinary food, shortage is not the problem that marketing
        suggests.
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice',
      text: `
        Next time you see "high protein" on a packet, you might compare it
        with an ordinary food: a pot of plain yogurt, a tin of beans, an
        egg. Sometimes the difference is real. Often it is small, and paid
        for.

        :::note
        Someone who is unwell, eating very little, or managing a condition
        such as kidney disease should get advice on protein from a doctor or
        dietitian, not from a label.
        :::
      `,
      cta: 'Done',
    },
  ],
  recap: [
    'Proteins are chains of **20 amino acids**. Nine are **essential**: the body cannot make them, so food must supply them.',
    'Animal foods, soya and quinoa are complete; other plant foods cover one another\'s gaps over the day. Plant-based diets can supply enough.',
    'The adult reference is about **0.8 g per kg** of body weight a day, with more for growth, pregnancy, older age and heavy training. Most people in rich countries eat more than that.',
    'There is no store for spare protein: the surplus is used as fuel and its nitrogen leaves as urea.',
  ],
  next: 'Next: the nutrients measured in thousandths of a gram. From scurvy to iron and vitamin D.',
};
