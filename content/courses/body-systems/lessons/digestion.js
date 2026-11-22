// The Body I: Fuel, Air and Blood · Lesson 5 · From Plate to Bloodstream
//
// Driving question: food is made of molecules far too big to enter your blood. So how does a meal get in?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-systems/index.js';
import { GUT_PATH, GUT, NUTRIENTS, ENZYME_PAIRS, VILLI_SUMS, say } from '../helpers.js';
import { inWords } from '../../../../src/widgets/gut-journey.js';

const GUT_ALT = 'A diagram of the digestive tube: mouth, oesophagus, stomach, a long folded small intestine and a wider large intestine, with the liver and the pancreas beside the start of the small intestine. A marker shows where the meal is. Five bars show how much of the starch, protein and fat has been broken down, how much of the nutrients has been absorbed and how much water has been taken back.';

const VILLI = photo(MEDIA.villi, {
  alt: 'A thin slice of the lining of the small intestine under a microscope, stained pink and purple. Long finger-shaped projections stand side by side, pointing up into an empty space, with short pits between their bases.',
  caption: 'The lining of the small intestine under a microscope. The fingers pointing upward are villi.',
  creditLabel: 'Micrograph',
});

// A piece of a starch chain, and the same sugar units after the enzymes have cut the links.
const CUT = {
  type: 'svg', viewBox: '0 0 340 118', maxWidth: 440,
  content: [
    '<path class="stroke-ink fill-none" stroke-width="2.5" d="M22 44 H140"/>',
    '<g class="fill-orange-soft stroke-ink" stroke-width="2.5">',
    '<circle cx="22" cy="44" r="11"/><circle cx="46" cy="44" r="11"/><circle cx="70" cy="44" r="11"/><circle cx="94" cy="44" r="11"/><circle cx="118" cy="44" r="11"/><circle cx="142" cy="44" r="11"/>',
    '<circle cx="232" cy="26" r="11"/><circle cx="268" cy="36" r="11"/><circle cx="304" cy="24" r="11"/><circle cx="244" cy="60" r="11"/><circle cx="282" cy="66" r="11"/><circle cx="316" cy="56" r="11"/>',
    '</g>',
    '<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M166 44 H204 M194 34 L206 44 L194 54"/>',
    '<text class="fig-label" x="82" y="96" text-anchor="middle">Part of a starch chain</text>',
    '<text class="fig-label" x="274" y="104" text-anchor="middle">Sugars</text>',
    '<text class="fig-label" x="186" y="24" text-anchor="middle">enzymes</text>',
  ].join(''),
  alt: 'On the left, part of a starch molecule drawn as a chain of six beads joined in a row. An arrow marked "enzymes" points to the right, where the same six beads lie apart: single sugars.',
};

// What happens in each room of the tube, in the order of GUT_PATH (the facts are those of the simulator's notes).
const ROOM_NOTES = [
  'teeth grind the food, and an enzyme in saliva starts on the starch.',
  'a wave of muscle squeezes each mouthful down in about ten seconds.',
  'acid kills most germs, and an enzyme starts on the protein.',
  'bile from the liver and enzymes from the pancreas finish the cutting, and nearly everything useful is absorbed.',
  'water and salts are taken back. Trillions of bacteria ferment part of the fibre and make some vitamins, such as vitamin K.',
];

// Where each enzyme of ENZYME_PAIRS works.
const ENZYME_WHERE = { Amylase: 'saliva, pancreatic juice', Pepsin: 'stomach', Lipase: 'small intestine', Lactase: 'lining of the small intestine' };

export default {
  id: 'digestion',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A change of taste',
      text: `
        Plain bread is mostly **starch**, which has almost no taste. If a piece of bread
        is chewed for a minute or two without swallowing, its taste slowly changes.

        **What do you think it starts to taste of?**
      `,
      options: [
        { text: 'Slightly sweet', correct: true },
        { text: 'Slightly sour' },
        { text: 'Slightly salty' },
        { text: 'Nothing changes' },
      ],
      explain: `
        **Slightly sweet.** A starch molecule is a chain of thousands of sugar units.
        Saliva contains an **enzyme**, a molecule that speeds up one chemical job, which cuts
        the chains into sugars. You can taste the result.

        That is digestion in miniature. Food molecules are far too big to pass into your
        blood. **So how does a meal get in?** By being cut small first.
      `,
    },
    {
      id: 'teach-molecules',
      type: 'info',
      title: 'Cut small first',
      text: [
        'Three kinds of large molecule supply nearly all the energy and building material in food. Each is built from small units, and each is cut into its own units before it can be absorbed.',
        '',
        ...NUTRIENTS.map((n) => `- **${n.name}**, as in ${n.food}, is cut into **${n.units.toLowerCase()}**.`),
        '',
        'The cutting is done by **enzymes**: molecules that each speed up one chemical job. Vitamins need no cutting. They are small molecules already, and are absorbed as they are.',
      ].join('\n'),
      figure: CUT,
    },
    {
      id: 'small-molecules',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const right = rng.pick(NUTRIENTS);
        const others = NUTRIENTS.filter((n) => n.id !== right.id);
        return {
          text: `
            Three kinds of large molecule supply nearly all the energy and building material
            in food: **starch**, **protein** and **fat**. Each is cut into its own small units
            before it can be absorbed.

            **${right.name}**, as in ${right.food}, is cut into…
          `,
          options: rng.shuffle([
            { text: right.units, correct: true },
            ...others.map((n) => ({ text: n.units, why: `${n.units} are what ${n.name.toLowerCase()} is cut into.` })),
            { text: 'Vitamins', why: 'Vitamins are small molecules that are already in the food. They are absorbed as they are, not made by cutting.' },
          ]),
          shuffle: false,
          explain: `
            **${right.name} → ${right.short}.** The cutting is done by enzymes: ${right.enzyme.toLowerCase()}, working in the ${right.where}.
            Starch gives sugars, protein gives amino acids and fat gives fatty acids.
          `,
        };
      },
    },
    {
      id: 'journey',
      type: 'interact',
      graded: false,
      title: 'Follow a meal',
      text: `
        Here is the whole digestive tube, straightened out a little (it is not to scale).
        The red marker is a meal.

        **Move the clock and follow the meal to the far end.** At each stop, read what
        happens and watch the bars.
      `,
      widget: { type: 'gut-journey', alt: GUT_ALT },
      check: (s) => s.seenAll || `You have followed the meal through ${s.seen.length} of the 8 stops. Keep moving the clock to the end.`,
      solution: { stop: 8, seenAll: true },
      explain: `
        Each food molecule meets its enzymes at a different place. And notice **where** the
        green bar grows: almost nothing is absorbed before the small intestine, and almost
        nothing is left to absorb after it.
      `,
    },
    {
      id: 'teach-tube',
      type: 'info',
      title: 'Five rooms',
      text: [
        `The meal you followed went through one tube about ${GUT.length} metres long, with five rooms along it.`,
        '',
        ...GUT_PATH.map((room, i) => `- **${room}**: ${ROOM_NOTES[i]}`),
      ].join('\n'),
      figure: {
        type: 'body-map', view: 'torso', show: ['digestive'],
        labels: [{ id: 'food-pipe', text: 'Oesophagus' }, 'stomach', 'small-intestine', 'large-intestine', 'liver', 'pancreas'],
        alt: 'The digestive organs in the trunk, seen from the front, with their names. The oesophagus runs down into the stomach on the person\'s left. The coiled small intestine fills the middle of the abdomen and the large intestine frames it. The liver lies on the person\'s right and the pancreas behind the stomach.',
      },
    },
    {
      id: 'tube-order',
      type: 'order',
      review: true,
      title: 'One long tube',
      text: `
        The gut is a single tube about ${GUT.length} metres long, with different rooms along it.

        **Put them in the order that food passes through them.**
      `,
      items: GUT_PATH,
      labels: ['Food goes in', 'Remains go out'],
      explain: `
        **Mouth → oesophagus → stomach → small intestine → large intestine.** The "small"
        intestine is the narrower one, but it is by far the longer: about two thirds of the
        whole tube.

        Strictly speaking, food in the gut is still outside the body. It is only "in" once
        it has crossed the gut wall.
      `,
    },
    {
      id: 'swallow',
      type: 'choice',
      title: 'Two pipes, one entrance',
      text: `
        At the back of the throat the path for air and the path for food cross. The
        windpipe opens just in front of the oesophagus (the food pipe), and just above
        its opening stands a small flap, the **epiglottis**.

        Now and then a mouthful "goes down the wrong way" and sets off a fit of coughing.
        **What normally keeps food out of the windpipe when you swallow?**
      `,
      figure: {
        type: 'body-map', view: 'head', show: ['nose', 'mouth', 'tongue', 'throat', 'epiglottis', 'voice-box', 'windpipe', 'food-pipe'],
        labels: ['windpipe', 'food-pipe', 'throat', 'epiglottis'],
        alt: 'The head and neck cut open down the middle and seen from the side. The nose and the mouth both lead back into the throat. Below the throat two tubes run down the neck: the windpipe in front and the food pipe behind it. A small flap, the epiglottis, stands just above the opening of the windpipe.',
      },
      options: [
        { text: 'A flap folds over the top of the windpipe, and breathing pauses', correct: true },
        { text: 'Food is too heavy to turn into the windpipe', why: 'Weight has nothing to do with it: swallowing works lying down, and even upside down.' },
        { text: 'The windpipe lies behind the oesophagus, out of the way', why: 'It is the other way round: the windpipe is in front, so every mouthful has to pass over its opening.' },
      ],
      explain: `
        As you swallow, the voice box rises and a flap called the **epiglottis** folds
        down over the windpipe. For that second you cannot breathe. Then a wave of muscle,
        **peristalsis**, squeezes the mouthful down, which is why astronauts can eat without gravity.

        When the timing fails, food "goes down the wrong way" and you cough hard to clear it.
        (Someone who is choking and cannot cough, speak or breathe needs help at once: see *First Aid*.)
      `,
    },
    {
      id: 'stomach',
      type: 'fill',
      title: 'An acid bath',
      text: `
        The stomach stores a meal, churns it into a mush and releases it a little at a
        time over two to five hours.

        **Complete the description.** (The note under the drawing will help.)
      `,
      figure: { type: 'gut-journey', stop: 2, bars: false, static: true, alt: 'The digestive tube with the meal in the stomach.' },
      template: 'The stomach makes strong [[bile|*acid|saliva]], which kills most germs, and the enzyme pepsin, which starts cutting [[starch|fat|*protein]]. Its own wall is protected by a coat of [[*mucus|muscle|enzymes]].',
      explain: `
        **Acid**, **protein**, **mucus**. Stomach acid is strong enough to attack the stomach
        itself, which is made of protein too. A layer of mucus keeps the acid off the wall, and
        the cells of the lining are replaced every few days.
      `,
    },
    {
      id: 'teach-enzymes',
      type: 'info',
      title: 'One enzyme, one job',
      text: [
        'Each enzyme fits one kind of molecule, like a key in a lock. Many are named after what they cut, with the ending "-ase".',
        '',
        '| Enzyme | Cuts | Works in |',
        '|---|---|---|',
        ...ENZYME_PAIRS.map(([enzyme, cuts]) => `| **${enzyme}** | ${cuts} | ${ENZYME_WHERE[enzyme]} |`),
        '',
        'Lipase comes from the pancreas, and it needs help: **bile** from the liver first breaks the fat into tiny droplets.',
      ].join('\n'),
      figure: {
        type: 'body-map', view: 'torso', show: ['digestive'],
        groups: [{ ids: ['liver', 'pancreas'], color: 'orange', label: 'Send their juices into the small intestine' }],
        labels: ['liver', 'pancreas', 'stomach', 'small-intestine'],
        alt: 'The digestive organs in the trunk, seen from the front. The liver, on the person\'s right, and the pancreas, behind the stomach, are highlighted: both send their juices into the first part of the small intestine.',
      },
    },
    {
      id: 'enzymes',
      type: 'match',
      review: true,
      title: 'One enzyme, one job',
      text: `
        Each enzyme fits one kind of molecule, like a key in a lock. Many are named
        after what they cut, with the ending "-ase".

        **Match each enzyme to the molecule it cuts.**
      `,
      pairs: ENZYME_PAIRS,
      explain: `
        **Amylase** (in saliva and in pancreatic juice) cuts starch. **Pepsin** (in the
        stomach) cuts protein. **Lipase** (from the pancreas) cuts fat, after **bile** from the
        liver has broken the fat into tiny droplets. **Lactase** (on the lining of the small
        intestine) cuts milk sugar.
      `,
    },
    {
      id: 'where-absorbed',
      type: 'interact',
      title: 'Where does it get in?',
      text: `
        Digestion is only half the story. The small units still have to cross the gut wall
        into the body.

        **Stop the clock at the first moment when nearly all the nutrients have been
        absorbed.** Where is the meal?
      `,
      widget: { type: 'gut-journey', alt: GUT_ALT },
      check: (s) => {
        if (s.stop === 5) return true;
        if (s.absorbed < 91) return `After ${s.time === 'first bite' ? 'the first bite' : s.time}, the share of the nutrients that has been absorbed is: ${inWords(s.absorbed)}. Move the clock on.`;
        return 'By now it is all over. Go back to the **first** stop where the green bar says "nearly all".';
      },
      solution: { stop: 5 },
      hints: ['Watch the bar "nutrients absorbed".'],
      explain: `
        At the **end of the small intestine**, about eight hours after the meal. The stomach
        absorbs almost nothing, and the large intestine mostly takes back water.

        Nearly everything you get from food crosses the wall of the small intestine. What
        makes that one stretch of tube so good at it?
      `,
    },
    {
      id: 'villi-area',
      type: 'numeric',
      gen: (rng) => {
        const [smooth, factor] = rng.pick(VILLI_SUMS);
        const answer = Math.round(smooth * factor * 10) / 10;
        return {
          text: `
            The photograph shows a thin slice of the lining of the small intestine. It is covered
            with millions of tiny fingers, the **villi**, each about a millimetre tall and each with
            its own blood supply.

            As a smooth pipe, one person's small intestine would have an inner surface of about
            **${say(smooth)} m²**. Folds, villi and microvilli make the real surface about **${factor} times** larger.
            **How large is it?**
          `,
          figure: VILLI,
          answer,
          unit: 'm²',
          wrong: [
            [Math.round((smooth + factor) * 100) / 100, '"Times larger" means multiply, not add.'],
            [Math.round((factor / smooth) * 10) / 10, 'Multiply the smooth surface by the factor; do not divide.'],
          ],
          hints: [`"${factor} times larger" means: multiply ${say(smooth)} m² by ${factor}.`],
          explain: `
            ${say(smooth)} × ${factor} = **${say(answer)} m²**: the floor of a large room, from a tube you could hold in
            two hands. Measurements put the absorbing surface of the small intestine at about ${GUT.surface} m²
            (older books say "a tennis court", which turned out to be too generous).

            It is the lungs' trick again: a **huge, thin surface** with blood just behind it.
          `,
        };
      },
    },
    {
      id: 'liver-first',
      type: 'interact',
      title: 'First stop for the blood',
      text: `
        Blood leaving the small intestine is loaded with sugars and amino acids. It does
        not go straight back to the heart: a special vein carries it to the **liver** first.

        The figure is facing you, and this time it has no names. **Tap the organ that
        receives the blood from the gut first.**
      `,
      widget: {
        type: 'body-map', view: 'torso', mode: 'pick', show: ['digestive', 'heart', 'lungs'], pickable: ['liver', 'stomach', 'heart', 'lungs', 'small-intestine', 'large-intestine'], answer: 'liver',
        alt: 'The organs of the chest and abdomen, without names.',
      },
      check: (s) => {
        if (s.picked === 'liver') return true;
        if (!s.picked) return 'Tap an organ in the figure.';
        if (s.picked === 'heart' || s.picked === 'left-lung' || s.picked === 'right-lung') return `That is ${s.nameThe}. All blood gets there in the end, but blood from the gut is piped to another organ first: the large one in the upper right of the abdomen.`;
        if (s.picked === 'stomach') return 'That is the stomach, which is upstream of the small intestine. The blood flows on to the large organ on the other side of the abdomen.';
        return `That is ${s.nameThe}: part of the gut itself. The blood that drains it flows on to the large organ in the upper right of the abdomen.`;
      },
      solution: { picked: 'liver' },
      hints: ['It is the largest organ inside the body, in the upper right of the abdomen: on your left in the figure.'],
      explain: `
        The **liver**, the body's chemical works. It stores spare sugar, processes amino
        acids, and breaks down alcohol, medicines and many poisons before they reach the rest
        of the body.

        (Most of the fat takes a side road through the lymph vessels and joins the blood later.)
      `,
    },
    {
      id: 'large',
      type: 'multi',
      review: true,
      title: 'The last metre and a half',
      text: `
        What reaches the **large intestine** is mostly water and **fibre**, the parts of plants
        that our own enzymes cannot cut.

        **What happens there?** Choose all that apply.
      `,
      options: [
        { text: 'Water and salts are taken back into the body', correct: true },
        { text: 'Trillions of bacteria ferment part of the fibre', correct: true },
        { text: 'Bacteria make some vitamins, such as vitamin K', correct: true },
        { text: 'Most of the meal\'s nutrients are absorbed', why: 'That happened earlier, in the small intestine.' },
        { text: 'Acid is added to kill the bacteria', why: 'Acid belongs to the stomach. The large intestine depends on its bacteria.' },
      ],
      explain: `
        Each day about ${GUT.fluidPerDay} litres of fluid enter the gut, most of it your own digestive
        juices. The small intestine takes back the bulk and the large intestine most of the
        rest, leaving about a tenth of a litre.

        Your gut bacteria, roughly as many as you have cells, live mostly here. They feed on
        fibre, and what they make from it feeds the cells of the gut wall.
      `,
    },
    {
      id: 'transit',
      type: 'fill',
      title: 'How long does it take?',
      text: `
        People often guess that a meal is "gone" in a few hours. Use the clock to check.

        **Complete the sentence with typical times.**
      `,
      figure: { type: 'gut-journey', alt: GUT_ALT },
      template: 'A meal spends a few [[seconds|minutes|*hours]] in the stomach, a few [[minutes|*hours|days]] in the small intestine, and [[a few minutes|about an hour|*a day or more]] in the large intestine.',
      explain: `
        Typically ${GUT.stomachHours[0]} to ${GUT.stomachHours[1]} hours in the stomach, ${GUT.smallHours[0]} to ${GUT.smallHours[1]} hours in the small intestine and
        anything from ${GUT.largeHours[0]} hours to more than two days in the large intestine. From mouth to
        exit, **one to three days** is usual.

        The range between healthy people is wide. A lasting change in your own
        pattern is worth mentioning to a doctor.
      `,
    },
    {
      id: 'intolerance',
      type: 'choice',
      title: 'When an enzyme is missing',
      text: `
        Babies make plenty of **lactase**, the enzyme that cuts milk sugar. About two
        thirds of the world's adults make much less of it, which is entirely normal.

        **What happens when such a person drinks a large glass of milk?**
      `,
      options: [
        { text: 'The uncut milk sugar reaches the large intestine, where bacteria ferment it', correct: true },
        { text: 'The milk sugar is absorbed whole and poisons the blood', why: 'Uncut, the sugar is too big to be absorbed at all. It stays in the gut.' },
        { text: 'The immune system attacks the milk, as in an allergy', why: 'That would be a milk allergy, a different and rarer condition. This is a missing enzyme, not an immune reaction.' },
      ],
      explain: `
        Fermentation makes gas, and the sugar holds water in the gut: bloating, cramps
        and diarrhoea. This is **lactose intolerance**. It is uncomfortable, not dangerous,
        and many people who have it can still manage small amounts.

        **Coeliac disease** is different: in about 1 person in 100, gluten (a protein in wheat,
        barley and rye) triggers the immune system to damage the villi. It needs a proper
        diagnosis, and doctors ask people to be tested *before* cutting out gluten.
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        An invitation: the next time your stomach rumbles, listen. That is peristalsis,
        the same wave of muscle that carries every mouthful, pushing fluid and gas along
        the tube. It is louder when the gut is empty, because there is less to muffle it.

        You might also notice how long a big meal keeps you feeling full: that is partly
        your stomach handing it on a little at a time.
      `,
    },
  ],
  recap: [
    'Digestion **cuts big molecules small**: starch into sugars, protein into amino acids, fat into fatty acids. Enzymes do the cutting, each fitting one kind of molecule.',
    '**Mouth → oesophagus → stomach → small intestine → large intestine.** A flap, the epiglottis, keeps food out of the windpipe, and waves of muscle move it along.',
    'Nearly all absorption happens in the **small intestine**, across about 30 m² of villi. The blood from the gut goes to the **liver** first.',
    'The large intestine takes back water and houses the gut bacteria. The whole trip usually takes one to three days.',
  ],
  next: 'Next: the fuel has arrived and so has the oxygen. What do your cells actually do with them?',
};
