// The Body I: Fuel, Air and Blood · Lesson 1 · Thirty Trillion Cells
//
// Driving question: how do thirty trillion cells, most of them buried deep inside you, all stay alive?
import { CELL_SIZES, SYSTEMS, LEVELS, ORGANS, systemById, grouped, say } from '../helpers.js';
import { structureInfo } from '../../../../src/widgets/body-map.js';

const CELLS_SVG = [
  // red blood cell (top left)
  '<g transform="translate(10 0)">',
  '<ellipse class="fill-red-soft stroke-ink" stroke-width="2.5" cx="78" cy="38" rx="46" ry="25"/>',
  '<ellipse class="fill-red" opacity="0.45" cx="78" cy="38" rx="21" ry="10"/>',
  '<text class="fig-label" x="78" y="90" text-anchor="middle">Red blood cell</text>',
  '</g>',
  // neuron (top right)
  '<g transform="translate(16 0)">',
  '<g class="stroke-ink fill-none" stroke-width="2.5" stroke-linecap="round">',
  '<path d="M186 38 L168 20 M186 38 L160 38 M186 38 L168 58 M168 20 L157 17 M168 20 L165 9 M168 58 L157 65"/>',
  '<path d="M198 38 C232 30 262 48 296 40 M296 40 L311 29 M296 40 L313 42 M296 40 L308 54"/>',
  '</g>',
  '<circle class="fill-violet-soft stroke-ink" stroke-width="2.5" cx="190" cy="38" r="13"/>',
  '<circle class="fill-violet" cx="190" cy="38" r="4.5"/>',
  '<text class="fig-label" x="236" y="90" text-anchor="middle">Nerve cell</text>',
  '</g>',
  // muscle fibre (bottom left)
  '<g transform="translate(-319 100)">',
  '<rect class="fill-pink-soft stroke-ink" stroke-width="2.5" x="340" y="21" width="134" height="34" rx="17"/>',
  '<path class="stroke-pink fill-none" stroke-width="2" d="M362 24v28M374 22v32M386 22v32M398 22v32M410 22v32M422 22v32M434 22v32M446 22v32M458 24v28"/>',
  '<text class="fig-label" x="407" y="90" text-anchor="middle">Muscle fibre</text>',
  '</g>',
  // skin surface cells (bottom right)
  '<g transform="translate(-313 100)">',
  '<g class="fill-yellow-soft stroke-ink" stroke-width="2.5">',
  '<rect x="506" y="14" width="52" height="13" rx="6"/><rect x="562" y="14" width="52" height="13" rx="6"/>',
  '<rect x="534" y="31" width="52" height="13" rx="6"/><rect x="590" y="31" width="38" height="13" rx="6"/>',
  '<rect x="506" y="48" width="52" height="13" rx="6"/><rect x="562" y="48" width="52" height="13" rx="6"/>',
  '</g>',
  '<text class="fig-label" x="565" y="90" text-anchor="middle">Skin surface cells</text>',
  '</g>',
].join('');

const CELLS_FIGURE = {
  type: 'svg', viewBox: '0 0 340 198', maxWidth: 340,
  content: CELLS_SVG,
  alt: 'Four kinds of cell, not to scale. A red blood cell: a disc with a dimple in the middle. A nerve cell: a small body with short branches and one very long, thin fibre. A muscle fibre: a long striped cylinder. Skin surface cells: flat tiles stacked in overlapping layers.',
};

// The four systems this course follows, and the seven it leaves to The Body II. Both teaching screens are
// written from the SYSTEMS table, which is also what the generated question "which-system" draws from.
const SUPPLY = ['respiratory', 'digestive', 'circulatory', 'urinary'];
const systemLine = (sy) => `- **${sy.name}** (${sy.organs.join(', ')}): ${sy.job}`;

export default {
  id: 'cells-to-systems',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Count yourself',
      text: `
        You are built from living units far too small to see, called
        **cells**. Each one is alive in its own right.

        **Roughly how many of your own cells make up an adult body?**
      `,
      shuffle: false,
      options: [
        { text: 'About 30 million' },
        { text: 'About 30 billion' },
        { text: 'About 30 trillion', correct: true },
        { text: 'About 30 quadrillion' },
      ],
      explain: `
        About **30 trillion**: 30,000,000,000,000. Careful counts published since 2013
        land between 30 and 37 trillion for an adult, depending on body size
        and on how the counting is done.

        That is several thousand cells for every person on Earth, and every one of them
        has to be kept alive.
      `,
    },
    {
      id: 'city',
      type: 'info',
      title: 'A city with no shops',
      text: `
        Most of those cells are buried deep inside you. They will never touch
        air, food or water directly. Yet every one of them needs supplies,
        every minute, for as long as you live.

        **How do thirty trillion cells all stay alive?** That question runs
        through this whole course.

        > **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.
      `,
    },
    {
      id: 'teach-shapes',
      type: 'info',
      title: 'Shaped for the job',
      text: `
        Cells are not all alike. You have a few hundred kinds, and the shape of
        each fits its work. Here are four (not drawn to scale).

        - **Red blood cell**: a bendy disc that folds to pass through the narrowest
          vessels. It has given up its **nucleus**, the control centre of a cell, to
          make room for its oxygen carrier. (The darker middle in the picture is a
          dimple in the disc, not a nucleus.)
        - **Nerve cell**: one thin fibre, up to a metre long, that can carry a signal
          from the base of the spine to a toe.
        - **Muscle fibre**: packed with threads that slide past each other to shorten it.
        - **Skin surface cells**: flat, tough tiles that overlap like a roof.
      `,
      figure: CELLS_FIGURE,
    },
    {
      id: 'shapes',
      type: 'match',
      title: 'Shape follows job',
      text: `
        **Match each cell to the way its shape fits its job.**
      `,
      figure: { ...CELLS_FIGURE, maxWidth: 270 },
      pairs: [
        ['Red blood cell', 'Bendy disc with no nucleus'],
        ['Nerve cell', 'One fibre up to a metre long'],
        ['Muscle fibre', 'Packed with sliding threads'],
        ['Skin surface cell', 'Flat, tough, overlapping tiles'],
      ],
      explain: `
        **Shape follows job.** The disc folds through the narrowest vessels, the fibre
        spans the distance its signal has to travel, the threads slide to shorten the
        muscle, and the tiles make a tough, layered roof.
      `,
    },
    {
      id: 'how-small',
      type: 'numeric',
      gen: (rng) => {
        const c = rng.pick(CELL_SIZES);
        const span = rng.pick(c.spans);
        const answer = (span * 1000) / c.um;
        const wrong = [[span * 1000 * c.um, `That multiplies. You are asking how many lengths of ${c.um} µm fit into ${grouped(span * 1000)} µm: divide.`]];
        if (span !== 1) wrong.push([1000 / c.um, `That is how many fit across 1 mm. The gap here is ${say(span)} mm.`]);
        return {
          text: `
            Cells are measured in **micrometres** (µm). A micrometre is a
            thousandth of a millimetre: 1 mm = 1,000 µm. So cells 10 µm wide would
            line up 300 to every 3 mm: 3 mm is 3,000 µm, and 3,000 ÷ 10 = 300.

            ${c.a} is about **${c.um} µm** ${c.measure}. **How many of them, lined up in a row, would stretch ${say(span)} mm?**
          `,
          answer,
          unit: 'in a row',
          wrong,
          hints: [
            `First turn the millimetres into micrometres: ${say(span)} mm = ${grouped(span * 1000)} µm.`,
            `Then divide by the size of one cell: ${grouped(span * 1000)} ÷ ${c.um}.`,
          ],
          explain: `${say(span)} mm is ${grouped(span * 1000)} µm, and ${grouped(span * 1000)} ÷ ${c.um} = **${grouped(answer)}**. Sizes like these are typical values: real cells vary.`,
        };
      },
    },
    {
      id: 'teach-needs',
      type: 'info',
      title: 'What every cell needs',
      text: `
        Whatever its shape, every cell needs the same five things: **oxygen**,
        **fuel**, **water**, a way to get rid of its **wastes**, and **steady
        surroundings** (not too hot, too salty or too acidic).

        The body keeps a reserve of the first three, but the reserves are far
        from equal.

        | Supply | The reserve lasts |
        |---|---|
        | Fuel | weeks |
        | Water | days |
        | Oxygen | a few minutes |

        Fuel is stored as fat, and as a starch-like reserve in liver and muscle.
        More than half of the body is water. Of oxygen it holds only a few minutes' worth.
      `,
    },
    {
      id: 'needs',
      type: 'choice',
      title: 'The one that cannot wait',
      text: `
        Your heart and lungs never take a break, while a meal or a drink can
        wait for hours.

        **Which supply to the cells can never pause, because the body stores the least of it?**
      `,
      options: [
        { text: 'Oxygen', correct: true },
        { text: 'Fuel', why: 'The body stores fuel as fat and as a starch-like reserve in liver and muscle: enough for weeks.' },
        { text: 'Water', why: 'More than half of your body is water. A shortage becomes dangerous over days, not minutes.' },
      ],
      explain: `
        **Oxygen.** With only a few minutes' worth in reserve, the delivery has to run
        without a break: brain cells begin to suffer after a few minutes without it.
        A water shortage takes days to become dangerous, a fuel shortage weeks.
      `,
    },
    {
      id: 'levels',
      type: 'order',
      review: true,
      title: 'Teams of teams',
      text: `
        No cell could supply itself, so cells work in teams. Cells of one
        kind form a **tissue**. Several tissues build an **organ**. Organs that share
        a job make up a **system**.

        **Put these in order, from smallest to largest.**
      `,
      items: LEVELS.map((l) => l.example),
      labels: ['Smallest', 'Largest'],
      explain: `
        **Cell → tissue → organ → system → whole body.** Heart muscle cells
        form heart muscle tissue. That tissue, with valves, vessels and nerves, makes the heart.
        The heart, the blood vessels and the blood form the circulatory system.
      `,
    },
    {
      id: 'teach-supply',
      type: 'info',
      title: 'Four supply lines',
      text: [
        'Textbooks usually count **eleven organ systems**. Four of them are the supply lines that this course follows.',
        '',
        ...SUPPLY.map((id) => systemLine(systemById(id))),
        '',
        'The figure is **facing you**, so the person\'s right side is on your left. The liver and the large intestine belong to the digestive system too. The kidneys lie at the back, hidden here behind the intestines.',
      ].join('\n'),
      figure: {
        type: 'body-map', view: 'torso',
        labels: ['heart', { id: 'right-lung', text: 'Lungs' }, 'liver', 'stomach', 'small-intestine', 'large-intestine', 'bladder'],
        alt: 'The organs of the chest and abdomen, with seven of them named. The heart lies in the middle of the chest between the two lungs. Below them, the liver is on the person\'s right and the stomach on the person\'s left. The small intestine is coiled in the middle of the abdomen with the large intestine framing it, and the bladder lies low in the pelvis.',
      },
    },
    {
      id: 'find-organ',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const organ = rng.pick(ORGANS);
        return {
          text: `
            This figure is facing you, so the person's right side is on your left.

            **Tap ${organ.ids.length > 1 ? `one of the ${organ.name}` : `the ${organ.name}`}.**
          `,
          widget: {
            type: 'body-map', view: 'torso', mode: 'pick', pickable: ORGANS.flatMap((o) => o.ids), answer: organ.ids[0],
            alt: 'The organs of the chest and abdomen, without names.',
          },
          check: (s) => {
            if (organ.ids.includes(s.picked)) return true;
            if (!s.picked) return 'Tap an organ in the figure.';
            return `That is ${s.nameThe}. The ${organ.name} ${organ.verb} ${organ.where}.`;
          },
          solution: { picked: organ.ids[0] },
          hints: [`The ${organ.name} ${organ.verb} ${organ.where}.`],
          explain: `The ${organ.name} ${organ.verb} ${organ.where}.`,
        };
      },
    },
    {
      id: 'systems-map',
      type: 'interact',
      graded: false,
      title: 'Eleven systems',
      text: `
        Now see all eleven systems on one body. This figure is **facing you** too,
        so the person's left side is on your right.

        Switch layers on and off with the buttons, and **tap at least six parts from at
        least three different systems** to read what each one does.
      `,
      widget: {
        type: 'body-map', view: 'body', mode: 'explore', show: ['organs'], toggles: true,
        alt: 'The human body seen from the front, with its main organs. Buttons switch the skeleton, the muscles and the other organ systems on and off.',
      },
      check: (s) => {
        const systems = new Set(s.seen.map((id) => (structureInfo(id) || {}).system).filter(Boolean));
        if (s.seenCount >= 6 && systems.size >= 3) return true;
        if (s.seenCount < 6) return `You have looked at ${s.seenCount} ${s.seenCount === 1 ? 'part' : 'parts'} so far. Tap ${6 - s.seenCount} more.`;
        return 'Now switch on another layer with the buttons, and tap a part of a different system.';
      },
      solution: { seen: ['heart', 'left-lung', 'stomach', 'liver', 'right-kidney', 'brain'] },
      explain: `
        The **respiratory** system loads oxygen, the **digestive** system loads fuel, the
        **circulatory** system delivers both to every cell, and the **urinary** system
        cleans the blood: the four supply lines.

        The layers you switched on belong to the other seven systems. The next screen
        names them.
      `,
    },
    {
      id: 'teach-rest',
      type: 'info',
      title: 'The other seven',
      text: [
        'The other seven systems move, protect, control and reproduce the body. They are the subject of *The Body II*.',
        '',
        ...SYSTEMS.filter((sy) => !SUPPLY.includes(sy.id)).map(systemLine),
      ].join('\n'),
    },
    {
      id: 'which-system',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const right = rng.pick(SYSTEMS);
        const others = rng.sample(SYSTEMS.filter((sy) => sy.id !== right.id), 3);
        const byOrgan = rng.bool(0.5);
        const organ = rng.pick(right.organs);
        const plural = /s$/.test(organ) && !['biceps', 'uterus'].includes(organ);
        return {
          text: byOrgan
            ? `The **${organ}** ${plural ? 'belong' : 'belongs'} to one of the body's eleven organ systems. **Which one?**`
            : `One of the body's eleven organ systems ${right.id === 'muscles' ? 'has this job: to' : 'has this job: it'} **${right.job}**. **Which one?**`,
          options: rng.shuffle([
            { text: right.name, correct: true },
            ...others.map((sy) => ({ text: sy.name, why: `The ${sy.name.toLowerCase()} ${sy.job}. Examples: the ${sy.organs.join(' and the ')}.` })),
          ]),
          shuffle: false,
          explain: `The **${right.name.toLowerCase()}** ${right.job}. Examples: the ${right.organs.join(' and the ')}.`,
        };
      },
    },
    {
      id: 'seven-years',
      type: 'choice',
      mode: 'predict',
      title: 'A new you every seven years?',
      text: `
        A popular saying: *"Your body replaces all of its cells every seven years, so you
        are literally a new person."*

        **What do you think?**
      `,
      shuffle: false,
      options: [
        { text: 'True: every cell is swapped within about seven years' },
        { text: 'Partly: some cells last days, others a lifetime', correct: true },
        { text: 'False: the cells you are born with are the cells you keep' },
      ],
      explain: `
        Partly. Some tissues are renewed within days and others never. There is no
        single schedule, and "seven years" is not the average of anything.
        The next screen lets you run the clock yourself.
      `,
    },
    {
      id: 'clock',
      type: 'interact',
      title: 'Run the clock',
      text: `
        Each bar shows how many of a tissue's cells are still **the very same
        cells** as when the clock started.

        **Move time forward, and stop at the first setting where not one of
        the original red blood cells is left.**
      `,
      widget: { type: 'cell-turnover', alt: 'Seven bars, one for each kind of cell, showing what share of the cells are still the original ones. A slider moves time forward from now to fifty years.' },
      check: (s) => {
        if (s.label === '4 months') return true;
        if (s.original.red > 0) return s.stop === 0 ? 'Drag the slider to let time pass.' : `After ${s.label}, ${s.original.red}% of the red cells are still the original ones. Keep going.`;
        return `After ${s.label} they are long gone. Go back to the **first** setting where the red bar is empty.`;
      },
      solution: { stop: 5 },
      hints: ['Watch the red bar. A red blood cell lasts about 120 days.'],
      explain: `
        A red blood cell lasts about **120 days**, so after four months every one
        has been replaced. The gut lining went within a week, the skin surface within
        about a month.

        Now look at the bottom rows: they have hardly moved.
      `,
    },
    {
      id: 'seven-check',
      type: 'multi',
      review: true,
      title: 'Seven years on',
      text: `
        Set the clock to **7 years**.

        **In which of these are most of the cells still the ones that were
        there at the start?** Choose all that apply.
      `,
      figure: { type: 'cell-turnover', stop: 0, alt: 'Seven bars, one for each kind of cell, showing what share of the cells are still the original ones. A slider moves time forward from now to fifty years.' },
      options: [
        { text: 'The neurons of the brain\'s cortex', correct: true },
        { text: 'Heart muscle', correct: true },
        { text: 'The core of the lens of the eye', correct: true },
        { text: 'Red blood cells', why: 'A red blood cell lasts about 120 days. After seven years they have been replaced about twenty times over.' },
        { text: 'The lining of the gut', why: 'Gut lining cells last only a few days: the fastest turnover in the body.' },
      ],
      explain: `
        The neurons of your cortex and the core of your lens are as old as you
        are. Heart muscle is renewed by about 1% a year at most. Fat cells sit in between:
        about half are swapped in seven years.

        So the saying is a **myth**. You are a mixture of cells of very different
        ages, and that is one reason why a damaged gut lining heals in days, while
        damage to the brain or the heart heals poorly.
      `,
    },
    {
      id: 'why-blood',
      type: 'reflect',
      text: `
        Think of one muscle cell deep in your thigh.

        **In your own words: why does it depend on your lungs, your gut, your blood
        and your kidneys, even though it touches none of them?**
      `,
      model: `
        The cell needs oxygen, fuel and water all the time, and it must get rid of its
        wastes, but it is far from the air and from food. The lungs load oxygen into the
        blood, the gut loads fuel, and the blood carries both to the cell and carries its
        wastes away. The lungs breathe out the carbon dioxide and the kidneys clear the
        rest. If the oxygen stops, the cell is in trouble within minutes. The other links can
        pause for longer, but none of them can stop for good.
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        An invitation, if you like: look at the back of your hand. Every cell you can
        see on its surface will be gone within about a month, replaced from below.

        If you happen to have a small scratch or a paper cut, glance at it once a day
        and watch the repair: new cells are closing the gap while you get on
        with other things.

        :::note
        The numbers in this lesson are typical values. Bodies differ, and so do
        the estimates: that is why you saw "about" so often.
        :::
      `,
    },
  ],
  recap: [
    'An adult body has roughly **30 to 37 trillion** cells of a few hundred kinds, each shaped for its job.',
    'Every cell needs **oxygen, fuel, water, waste removal and steady surroundings**. Oxygen is the one that cannot wait.',
    '**Cell → tissue → organ → system → body.** The circulatory, respiratory, digestive and urinary systems are the supply lines.',
    'Cells are replaced at very different rates: gut lining in days, red cells in about 120 days, cortex neurons never. "A new body every seven years" is a myth.',
  ],
  next: 'Next: the pump that drives the whole supply network. Why does your heart have two sides?',
};
