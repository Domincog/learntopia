// How AI Learns · Lesson 4 · Why Layers Matter
import { r } from '../../../kit.js';
import { plantNeuron, plantNet, netCorrect } from '../helpers.js';

/** Where the two hidden neurons sit once the band is fenced in. */
const A_LOW = { w1: -1, w2: 1, b: 2 };    // fires above the lower line: water > sunlight − 2
const B_HIGH = { w1: 1, w2: -1, b: 2 };   // fires below the upper line: water < sunlight + 2

const NETWORK_DIAGRAM = {
  type: 'svg',
  viewBox: '0 0 360 192',
  maxWidth: 440,
  alt: 'A small network. Two inputs, sunlight and water, each feed two hidden neurons, A and B. Both hidden neurons feed one output neuron.',
  content: `
    <g class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M106 76 H160 M154 71 L160 76 L154 81"/>
      <path d="M106 146 H160 M154 141 L160 146 L154 151"/>
      <path d="M106 82 L162 136 M154 135 L162 136 L161 128"/>
      <path d="M106 140 L162 86 M161 94 L162 86 L154 87"/>
      <path d="M214 84 L278 104 M271 97 L278 104 L269 107"/>
      <path d="M214 138 L278 118 M269 115 L278 118 L271 125"/>
    </g>
    <g class="stroke-ink" stroke-width="2.5">
      <rect class="fill-blue-soft" x="10" y="58" width="96" height="36" rx="10"/>
      <rect class="fill-blue-soft" x="10" y="128" width="96" height="36" rx="10"/>
      <circle class="fill-violet-soft" cx="188" cy="76" r="25"/>
      <circle class="fill-teal-soft" cx="188" cy="146" r="25"/>
      <circle class="fill-pink-soft" cx="304" cy="111" r="25"/>
    </g>
    <text class="fig-label" x="58" y="81" text-anchor="middle">sunlight</text>
    <text class="fig-label" x="58" y="151" text-anchor="middle">water</text>
    <text class="fig-label-lg text-violet" x="188" y="83" text-anchor="middle">A</text>
    <text class="fig-label-lg text-teal" x="188" y="153" text-anchor="middle">B</text>
    <text class="fig-label text-pink" x="304" y="116" text-anchor="middle">out</text>
    <text class="fig-label-sm text-muted" x="58" y="26" text-anchor="middle">INPUTS</text>
    <text class="fig-label-sm text-muted" x="188" y="26" text-anchor="middle">HIDDEN LAYER</text>
    <text class="fig-label-sm text-muted" x="304" y="26" text-anchor="middle">OUTPUT</text>
    <text class="fig-label-sm text-muted" x="304" y="158" text-anchor="middle">thrives?</text>
  `,
};

const LAYERS_DIAGRAM = {
  type: 'svg',
  viewBox: '0 0 372 164',
  maxWidth: 460,
  alt: 'Three pictures in a row. First layer: one straight border with one side shaded. Next layer: the band between two borders shaded. Deeper layers: an irregular closed shape shaded.',
  content: `
    <g class="stroke-none fill-orange-soft">
      <path d="M12 104 L108 56 V130 H12 Z"/>
      <path d="M138 92 L234 44 V72 L138 120 Z"/>
      <path d="M286 52 L318 44 L346 62 L332 84 L350 108 L310 120 L280 96 Z"/>
    </g>
    <g class="stroke-ink fill-none" stroke-width="2.5" stroke-linejoin="round">
      <rect x="12" y="34" width="96" height="96" rx="8"/>
      <rect x="138" y="34" width="96" height="96" rx="8"/>
      <rect x="264" y="34" width="96" height="96" rx="8"/>
    </g>
    <g class="stroke-ink fill-none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 104 L108 56"/>
      <path d="M138 92 L234 44 M138 120 L234 72"/>
      <path d="M286 52 L318 44 L346 62 L332 84 L350 108 L310 120 L280 96 Z"/>
    </g>
    <g class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M113 82 H133 M127 77 L133 82 L127 87"/>
      <path d="M239 82 H259 M253 77 L259 82 L253 87"/>
    </g>
    <text class="fig-label" x="60" y="22" text-anchor="middle">borders</text>
    <text class="fig-label" x="186" y="22" text-anchor="middle">regions</text>
    <text class="fig-label" x="312" y="22" text-anchor="middle">shapes</text>
    <text class="fig-label text-muted" x="60" y="152" text-anchor="middle">first layer</text>
    <text class="fig-label text-muted" x="186" y="152" text-anchor="middle">next layer</text>
    <text class="fig-label text-muted" x="312" y="152" text-anchor="middle">deeper layers</text>
  `,
};

export default {
  id: 'layers',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A plant puzzle',
      text: `
        A garden centre notes how much **sunlight** and **water** each plant gets, and whether it thrives (circles) or struggles (squares).

        Too little water for its light, and a plant dries out. Too much, and it rots.

        **Could a single neuron sort these plants correctly?**
      `,
      figure: plantNeuron({
        line: false,
        alt: 'Sixteen plants plotted by sunlight and water. Thriving plants lie in a diagonal band from bottom left to top right. Struggling plants are in the top left corner and in the bottom right corner.',
      }),
      shuffle: false,
      options: [
        { text: 'Yes, with the right weights' },
        { text: 'Only with a very large bias' },
        { text: 'No, whatever the weights', correct: true },
      ],
      explain: 'Do not take anybody’s word for it. Try.',
    },
    {
      id: 'try-one',
      type: 'interact',
      graded: false,
      attempts: 5,
      title: 'One neuron against the plants',
      text: `
        One neuron and its three knobs, as before. The striped area is where it says “thrives”.

        **Sort as many plants correctly as you can.**
      `,
      widget: plantNeuron({
        w1: { value: 1 }, w2: { value: 0 }, b: { value: -5 },
        alt: 'The sixteen plants with the border of a single neuron.',
      }),
      check: (s) => s.best >= 12 || `Your best so far is ${s.best} of 16. Keep experimenting: 12 is possible.`,
      solution: { w1: -2, w2: 2, b: 4 },
      explain: `
        12 of 16 is the limit, and it is not your fault. No setting of the three knobs does better.
      `,
    },
    {
      id: 'teach-band',
      type: 'info',
      title: 'Why 12 is the limit',
      text: `
        Look at where the plants are. The thriving ones lie in a **band** through the middle,
        with struggling plants on **both** sides of it.

        A neuron draws one straight border and says “thrives” on one side of it.
        Here it fences off the strugglers at the bottom right. The four at the top left are then on the “thrives” side, and wrong.

        Turn the border to catch those four instead, and the bottom-right group is wrong. One border cannot do both jobs.
      `,
      figure: plantNeuron({
        w1: { value: -2 }, w2: { value: 2 }, b: { value: 4 }, lock: ['w1', 'w2', 'b'],
        alt: 'The sixteen plants with one border running below the band of thriving plants. The four struggling plants at the bottom right are fenced off. The four at the top left are on the “thrives” side: 12 of 16 are sorted correctly.',
      }),
    },
    {
      id: 'what-is-missing',
      type: 'choice',
      text: 'What would it take to separate the thriving plants from the rest?',
      options: [
        { text: 'Two straight borders, with the thriving plants in between', correct: true },
        { text: 'One border at exactly the right angle', why: 'You have just tried the angles. Whatever the angle, one border leaves strugglers on the “thrives” side.' },
        { text: 'Much bigger weights', why: 'Scaling the weights and the bias together does not move the border at all. The trouble is its shape, not its strength.' },
        { text: 'More example plants', why: 'More plants would fill in the same pattern: a band with strugglers on both sides. The data are not the problem.' },
      ],
      explain: `
        Two borders: one below the band and one above it. A neuron can only draw one.

        So use **two neurons**, and a third to combine what they say.
      `,
    },
    {
      id: 'second-border',
      type: 'interact',
      attempts: 6,
      title: 'Two neurons, two borders',
      text: `
        Here is a tiny **network**. Neuron [A]{.violet} is already in place: it **fires**, which means it says “yes”, for every plant above its line.
        (Each arrow points to the side where that neuron fires.)

        A third neuron gives the final answer. It says “thrives” only where **both A and B fire**.

        **Tune neuron [B]{.teal} until all 16 plants are sorted correctly.**
      `,
      widget: plantNet({
        A: A_LOW, B: { w1: 1, w2: 0, b: -5 }, out: { a: 1, b: 1, c: -1.5 }, edit: ['B'],
        alt: 'The plants with two lines: neuron A below the band of thriving plants, and neuron B, which can be adjusted.',
      }),
      check: (s) => {
        if (s.solved) return true;
        const flipped = { w1: -s.B.w1, w2: -s.B.w2, b: -s.B.b };
        if (netCorrect(s.A, flipped, s.out) === 16) return 'B’s line is in a good place, but B fires on the wrong side of it: its arrow should point *into* the band. Flip the signs of all three of its numbers.';
        if (s.B.w2 >= 0) return 'B has to rule out plants with too much water for their light: the squares at the top left. So more water must push B’s score *down*. Give water a negative weight.';
        if (s.B.w1 <= 0) return 'A plant in strong light can take more water, so more sunlight should push B’s score *up*. Give sunlight a positive weight.';
        return 'Both weights push the right way. Now adjust the bias (and the balance of the two weights) until B’s line runs between the circles and the squares at the top left.';
      },
      solution: { B: B_HIGH },
      hints: [
        'A already deals with the squares at the bottom right. B has to rule out the squares at the top left.',
        'B should fire *below* a line that runs between the band and the top-left squares. That takes weights of opposite sign: sunlight positive, water negative.',
        'Try weights 1 and −1 with a bias of 2.',
      ],
      explain: `
        A fires above the lower line. B fires below the upper line. Only the plants in between make **both** fire, and those are exactly the thriving ones.

        Two straight borders have fenced in a region that no single neuron could.
      `,
    },
    {
      id: 'output-neuron',
      type: 'interact',
      attempts: 6,
      title: 'The neuron that combines',
      text: r`
        The third neuron is an ordinary neuron too. Its inputs are not sunlight and water, though.
        They are the **outputs of A and B**: 1 if that neuron fired, 0 if it did not.

        We have reset it to weights 1 and 1 and a bias of −0.5. When only A fires, its score is
        $1 \times 1 + 1 \times 0 - 0.5 = 0.5$. That is above 0, so it says “thrives” if *either* A or B fires, which is everywhere.

        **Adjust its numbers so that it fires only when both do.**
      `,
      widget: plantNet({
        A: A_LOW, B: B_HIGH, out: { a: 1, b: 1, c: -0.5 }, edit: ['out'],
        alt: 'The plants with both lines in place. The output neuron can be adjusted.',
      }),
      check: (s) => {
        if (s.solved) return true;
        if (s.fires.neither) return 'It fires even when neither A nor B does: the bias alone is above 0. Lower the bias.';
        if (!s.fires.both) return 'Now it stays off even when both fire. With A = 1 and B = 1 the score is the two weights plus the bias. That must come out above 0.';
        return 'It still fires when only one of them does. With A = 1 and B = 0 the score is the weight on A plus the bias. That must not be above 0 (and the same goes for B alone).';
      },
      solution: { out: { a: 1, b: 1, c: -1.5 } },
      hints: [
        'A and B are each 0 or 1. With both on, the score is 1 + 1 + bias. With only one on, it is 1 + bias.',
        'You need 2 + bias to be above 0, but 1 + bias not to be.',
        'A bias of −1.5 does it. So does −1.',
      ],
      explain: r`
        With weights 1 and 1 and a bias of −1.5: one firing neuron gives $1 - 1.5 = -0.5$ (no), two give $2 - 1.5 = 0.5$ (yes).

        The arithmetic is the same as ever. The only new thing is **where the inputs come from**.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Layers',
      text: `
        Neurons that feed other neurons are arranged in **layers**. A and B form a **hidden layer**:
        hidden, because their outputs are neither the inputs nor the final answer.
        Stack layers like this and you have a **neural network**.

        Every neuron has **one weight for each of its inputs, plus one bias**. In the picture, each arrow carries one weight.

        :::example Counting the plant network
        - A has 2 inputs: 2 weights + 1 bias = 3 numbers. B likewise: 3.
        - The output neuron takes A and B: 2 weights + 1 bias = 3.
        - Altogether: 3 + 3 + 3 = **9** adjustable numbers.
        :::
      `,
      figure: NETWORK_DIAGRAM,
    },
    {
      id: 'count-weights',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(2, 5);
        // never 2 inputs with 2 hidden neurons: that is the plant network, counted as the worked example just before
        const hidden = rng.int(n === 2 ? 3 : 2, 6);
        const answer = hidden * (n + 1) + hidden + 1;
        return {
          text: `
            Every neuron has **one weight for each of its inputs, plus one bias**.

            A network has **${n} inputs**, one hidden layer of **${hidden} neurons**, and **1 output neuron** that takes the outputs of all the hidden neurons.

            **How many adjustable numbers does it have altogether?**
          `,
          answer,
          wrong: [
            [hidden * (n + 1), `That covers the hidden layer: ${hidden} neurons with ${n} weights and a bias each. The output neuron has ${hidden} weights and a bias of its own.`],
            [hidden * (n + 1) + hidden, 'Nearly. The output neuron has a bias too.'],
            // with 2 inputs and 3 hidden neurons (or 3 and 2) these two slips give the same number, so one message has to fit both
            ...(n + hidden + 1 === hidden * n
              ? [[hidden * n, `Not all of them yet. Each of the ${hidden} hidden neurons has ${n} weights **and** a bias, and the output neuron has ${hidden} weights and a bias of its own.`]]
              : [
                [n + hidden + 1, 'That counts the inputs and the neurons. Count the numbers *inside* the neurons: a weight per input, plus a bias.'],
                [hidden * n, `Those are the weights of the hidden layer. Add its ${hidden} biases, then the output neuron’s ${hidden} weights and its bias.`],
              ]),
          ],
          hints: [
            `Start with one hidden neuron: ${n} weights and 1 bias, so ${n + 1} numbers.`,
            `Hidden layer: ${hidden} × ${n + 1} = ${hidden * (n + 1)}. Output neuron: ${hidden} weights + 1 bias.`,
          ],
          explain: r`Hidden layer: $${hidden} \times (${n} + 1) = ${hidden * (n + 1)}$. Output neuron: $${hidden} + 1 = ${hidden + 1}$. Altogether **${answer}**. The plant network had $2 \times 3 + 3 = 9$. Widen the layers and add more of them, and the count climbs fast: large language models have billions.`,
        };
      },
    },
    {
      id: 'watch-it-learn',
      type: 'interact',
      graded: false,
      title: 'Let the machine find them',
      text: `
        You set those nine numbers by hand. Could gradient descent find them?

        Here is the same network with a fresh start: two lines in useless places.

        **Press “Train” and watch.**
      `,
      widget: plantNet({
        train: true,
        alt: 'The plant network before training: neuron A is a vertical line and neuron B a horizontal line through the middle.',
      }),
      check: (s) => (s.trained && s.solved) || (s.steps === 0 ? 'Press “Train”.' : 'Let the training run to the end.'),
      solution: { trained: true },
      explain: `
        A few hundred small downhill steps, and the two lines swing round to fence in the band.
        Nobody told the network “one border below, one above”. It followed the slope of the error.

        Its nine numbers are not the ones you chose, and that is fine: many different settings solve the same task.

        One change was needed. A sharp on/off switch has no slope to follow, so these neurons switch on *gradually* as their score rises.
        Real networks do something similar, for the same reason.
      `,
    },
    {
      id: 'teach-deeper-layers',
      type: 'info',
      title: 'Layer upon layer',
      text: `
        Each layer works with what the layer before it produced.
        The first draws straight borders. The next combines borders into regions.
        Further layers can combine regions into shapes as intricate as you like.

        :::key
        Simple pieces, combined layer upon layer, make complicated shapes.
        :::

        Nobody programs what each layer should look for. Like the two lines you just watched swing into place,
        it emerges during training, because it helps to bring the error down.
      `,
      figure: LAYERS_DIAGRAM,
    },
    {
      id: 'edges-to-objects',
      type: 'order',
      title: 'From edges to objects',
      text: `
        Researchers have looked inside networks that recognise photos, to see what the neurons in each layer respond to.
        A typical finding: the deeper the layer, the more complex the pattern.

        **Put these in order, from the first layer to the last.**
      `,
      items: [
        'Edges and patches of colour',
        'Corners, curves and simple textures',
        'Parts, such as an eye or a wheel',
        'Whole objects, such as a face or a car',
      ],
      labels: ['First layer', 'Last layer'],
      explain: `
        Each layer builds on the one before: edges combine into corners and textures, those into parts, and parts into objects.

        This picture is tidier than the truth. Real networks are messier, and many of their neurons respond to mixtures that have no neat name.
      `,
    },
    {
      id: 'why-layers',
      type: 'choice',
      review: true,
      text: `
        A single neuron cannot pick out a group of points that has the other group on **both** sides of it.
        A network with a hidden layer can.

        **Why?**
      `,
      options: [
        { text: 'Each hidden neuron draws its own border, and the output neuron combines them into a region', correct: true },
        { text: 'It has more weights, and more weights are always better', why: 'More weights only help when they are arranged so that neurons can build on one another. And “always better” is wrong, as the last lesson of this course shows.' },
        { text: 'Its neurons use a more powerful kind of arithmetic', why: 'Every neuron in it still does the same thing: a weighted sum and a threshold.' },
        { text: 'It stores each training example separately', why: 'A network keeps weights, not examples. The plant network had nine numbers for sixteen plants.' },
      ],
      explain: 'One neuron, one straight border. A hidden layer supplies several borders, and the next neuron turns them into a region: “above this line *and* below that one”.',
    },
    {
      id: 'one-or-many',
      type: 'bucket',
      review: true,
      text: `
        A neuron takes two numbers as inputs. Which of these jobs can **one neuron** do, and which need a **hidden layer**?

        Ask yourself: would one straight border do? For example, “yes if the second input is below 4” takes one level border.
        “Yes if it is below 2 or above 8” takes two.
      `,
      buckets: ['One neuron is enough', 'Needs a hidden layer'],
      items: [
        { text: '“Yes” if the two inputs add up to more than 10', bucket: 0, why: 'A sum above a limit is exactly what a neuron works out: weights 1 and 1, bias −10. One border.' },
        { text: '“Yes” if the first input is above 5', bucket: 0, why: 'One upright border at 5, with a weight of 0 on the second input.' },
        { text: '“Yes” if the first input is larger than the second', bucket: 0, why: 'First minus second above 0: weights 1 and −1. One diagonal border.' },
        { text: '“Yes” if the first input is between 3 and 7', bucket: 1, why: '“Between” means two borders: one at 3 and one at 7.' },
        { text: '“Yes” if the inputs are within 2 of each other', bucket: 1, why: 'That is a diagonal band, like the thriving plants: two borders.' },
        { text: '“Yes” if exactly one of the inputs is above 5', bucket: 1, why: 'The “yes” corners are top left and bottom right, with “no” corners between them. No single line separates those.' },
      ],
      explain: `
        “More than” and “larger than” each need one border. “Between”, “within” and “exactly one” need two,
        and so at least two hidden neurons.
      `,
    },
  ],
  recap: [
    'One neuron draws one straight border. Some patterns, like a band with the other group on both sides, need more.',
    'In a **hidden layer**, each neuron draws its own border. The next neuron combines them into a region.',
    'Deeper layers build complex patterns out of simpler ones. In image networks: edges, then parts, then objects.',
    'All the weights of a network are found the same way: by gradient descent.',
  ],
  next: 'Next: point this machinery at language, and predict the next word.',
};
