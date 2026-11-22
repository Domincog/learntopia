// Geometry: Shape & Space · Lesson 6 · Zoom In, Zoom Out
import { r, num } from '../../../kit.js';
import { gridFigure } from '../helpers.js';

const PHOTOS = {
  type: 'svg', viewBox: '0 0 400 210', maxWidth: 400,
  alt: 'A small square photo of a mountain and a sun, next to an enlargement that is twice as wide and twice as tall.',
  content:
    // the same little picture twice: once at size 1, once at size 2
    [[40, 110, 1], [160, 30, 2]].map(([x, y, k]) =>
      `<g transform="translate(${x} ${y}) scale(${k})">` +
      '<rect class="fill-blue-soft" x="0" y="0" width="80" height="80" rx="3"/>' +
      '<circle class="fill-yellow" cx="58" cy="22" r="9"/>' +
      '<path class="fill-green" d="M4 76 L30 34 L46 56 L56 44 L76 76 Z"/>' +
      `<rect class="stroke-ink fill-none" stroke-width="${3 / k}" x="0" y="0" width="80" height="80" rx="3"/>` +
      '</g>').join('') +
    '<text class="fig-label-sm" x="80" y="205" text-anchor="middle">original</text>' +
    '<text class="fig-label-sm" x="240" y="205" text-anchor="middle">twice as wide, twice as tall</text>',
};

/** Two similar right-angled triangles side by side; the big one is `k` times the small one. */
function similarTriangles({ a, b, k, u, labels }) {
  const unit = Math.min(300 / (a * (1 + k)), 130 / (b * k));
  const w1 = a * unit;
  const h1 = b * unit;
  const w2 = w1 * k;
  const h2 = h1 * k;
  const gap = 70;
  const x1 = (420 - (w1 + gap + w2)) / 2 + 14;
  const x2 = x1 + w1 + gap;
  const base = 158;
  const tri = (x, w, h) => `<polygon class="fill-blue-soft stroke-blue" stroke-width="3" stroke-linejoin="round" points="${x},${base} ${x + w},${base} ${x},${base - h}"/>` +
    `<path class="stroke-ink fill-none" stroke-width="2" d="M${x + 11} ${base} v-11 h-11"/>`;
  return {
    type: 'svg', viewBox: '0 0 420 190', maxWidth: 440,
    alt: `Two right-angled triangles with the same shape. The small one has a base of ${a} ${u} and a height of ${b} ${u}. The large one has a base of ${num(a * k)} ${u} and its height is marked with a question mark.`,
    content:
      tri(x1, w1, h1) + tri(x2, w2, h2) +
      `<text class="fig-label" x="${x1 + w1 / 2}" y="${base + 20}" text-anchor="middle">${labels[0]}</text>` +
      `<text class="fig-label" x="${x1 - 8}" y="${base - h1 / 2 + 5}" text-anchor="end">${labels[1]}</text>` +
      `<text class="fig-label" x="${x2 + w2 / 2}" y="${base + 20}" text-anchor="middle">${labels[2]}</text>` +
      `<text class="fig-label-lg" x="${x2 - 10}" y="${base - h2 / 2 + 6}" text-anchor="end">${labels[3]}</text>`,
  };
}

function shadowFigure({ pole, poleShadow, treeShadow }) {
  return {
    type: 'svg', viewBox: '0 0 420 196', maxWidth: 440,
    alt: `A short pole ${pole} m tall casting a shadow ${poleShadow} m long, and a tree casting a shadow ${treeShadow} m long. Sunlight slants down at the same angle over the top of each. The height of the tree is marked with a question mark.`,
    content:
      '<circle class="fill-yellow stroke-ink" stroke-width="2.5" cx="118" cy="26" r="13"/>' +
      '<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" d="M14 160 H406"/>' +
      // shadows
      '<path class="stroke-gray fill-none" stroke-width="7" stroke-linecap="round" d="M48 160 H99 M224 160 H369"/>' +
      // sun rays over the tops
      '<path class="stroke-orange fill-none" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round" d="M44 116 L99 160 M219 40 L369 160"/>' +
      // pole
      '<path class="stroke-ink fill-none" stroke-width="6" stroke-linecap="round" d="M44 160 V118"/>' +
      // tree
      '<path class="stroke-ink fill-none" stroke-width="7" stroke-linecap="round" d="M219 160 V96"/>' +
      '<path class="fill-green stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M219 40 L250 104 H188 Z"/>' +
      `<text class="fig-label" x="34" y="143" text-anchor="end">${pole} m</text>` +
      `<text class="fig-label" x="72" y="181" text-anchor="middle">${poleShadow} m</text>` +
      `<text class="fig-label" x="296" y="181" text-anchor="middle">${treeShadow} m</text>` +
      '<text class="fig-label-lg" x="176" y="108" text-anchor="end">?</text>',
  };
}

export default {
  id: 'similarity',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Twice as big?',
      text: `
        A square photo is enlarged until it is **twice as wide and twice as tall**.

        How many copies of the original photo would it take to cover the enlargement?
      `,
      figure: PHOTOS,
      shuffle: false,
      options: [
        { text: '2' },
        { text: '3' },
        { text: '4', correct: true },
        { text: '8' },
      ],
      explain: `
        Four. Two fit side by side along the bottom, and a second row of two fits above them.

        "Twice as big" is a slippery phrase: the photo is twice as *wide*, but it has four times the *area*.
        This lesson is about that gap, and it explains why giants exist only in stories.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Zoom in',
      text: `
        The copy on the right is the shape on the left, enlarged. The **scale factor** says how many
        times longer every length becomes.

        **Find the scale factor that makes the area exactly 4 times as big.**
      `,
      widget: { type: 'scale-shape', shape: 'L', k: 1, alt: 'An L-shape made of 3 unit squares, and an enlarged copy whose scale factor is set with a slider.' },
      check: (s) => {
        if (s.k === 2) return true;
        if (s.k === 4) return 'A scale factor of 4 makes every length 4 times as long. But look at the area: it is 16 times as big. Try a smaller scale factor.';
        if (s.k === 1) return 'At a scale factor of 1 the copy is the same size as the original. Drag the slider.';
        return `With a scale factor of ${s.k} the area is ${s.areaFactor} times as big. You are looking for 4 times.`;
      },
      solution: { k: 2 },
      explain: `
        A scale factor of just **2** already makes the area 4 times as big: every unit square of the
        original turns into a 2 × 2 block of four squares.
      `,
    },
    {
      id: 'count-three',
      type: 'numeric',
      text: `
        The original shape covers **3** unit squares.

        Set the scale factor to **3**. How many unit squares does the enlarged copy cover?
      `,
      figure: { type: 'scale-shape', shape: 'L', k: 1, readouts: ['lengths'], alt: 'An L-shape made of 3 unit squares, and an enlarged copy whose scale factor is set with a slider.' },
      answer: 27,
      unit: 'squares',
      wrong: [
        [9, 'That is 3 × 3: one block, or the area multiplied by only 3. Each of the 3 squares has become a whole block of 9.'],
        [12, 'That is the copy at a scale factor of 2. Move the slider to 3.'],
        [6, 'Enlarging multiplies. Look at the orange block: one square has become 3 × 3 = 9 squares.'],
      ],
      hints: ['Look at the orange block. How many unit squares did one square of the original turn into?', 'Each of the 3 squares becomes a 3 × 3 block of 9.'],
      explain: r`Each of the 3 squares becomes a $3 \times 3$ block of 9 squares: $3 \times 9 = 27$. The lengths were multiplied by 3, but the area by 9.`,
    },
    {
      id: 'pattern',
      type: 'choice',
      text: r`A scale factor of $k$ multiplies every **length** by $k$. What does it multiply the **area** by?`,
      options: [
        { text: r`$k^2$ (that is, $k \times k$)`, correct: true },
        { text: r`$2k$`, why: r`That fits $k = 2$ (both give 4), but for $k = 3$ the area was multiplied by 9, not 6.` },
        { text: r`$k$, the same as the lengths`, why: 'At a scale factor of 3 the lengths tripled, but 3 squares became 27.' },
        { text: r`$k + 2$`, why: r`That fits $k = 2$, but for $k = 3$ the area was multiplied by 9, not 5.` },
      ],
      explain: r`
        Every unit square becomes a block $k$ squares wide and $k$ squares tall: $k \times k = k^2$ squares.
      `,
    },
    {
      id: 'teach-scale-rule',
      type: 'info',
      title: 'Lengths × k, areas × k²',
      text: r`
        At a scale factor of 3 the lengths are multiplied by 3, but the area by $3 \times 3 = 9$.

        :::key
        Scale factor $k$: every length × $k$, every area × $k^2$.
        :::

        :::example
        A drawing 3 cm wide covers 5 cm². It is enlarged to 18 cm wide.

        1. Scale factor, from the two widths: $18 \div 3 = 6$.
        2. Square it for the area: $6 \times 6 = 36$.
        3. New area: $5 \times 36 = 180$ cm².
        :::
      `,
      figure: {
        type: 'scale-shape', shape: 'L', k: 3, slider: false, readouts: ['lengths', 'area'],
        alt: 'An L-shape made of 3 unit squares, and a copy enlarged with a scale factor of 3. Every unit square of the original has become a block of 3 by 3 squares.',
      },
    },
    {
      id: 'area-scaling',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.pick([2, 3, 4, 5]);
        // [width in cm, area in cm²] pairs that could really belong together
        const story = rng.pick([
          { thing: 'logo', needs: 'ink', sizes: [[2, 3], [3, 6], [4, 10]], unit: 'cm' },
          { thing: 'sticker', needs: 'vinyl', sizes: [[4, 12], [5, 20], [6, 30]], unit: 'cm' },
          { thing: 'photo', needs: 'photo paper', sizes: [[10, 80], [12, 96], [15, 150]], unit: 'cm' },
          { thing: 'stencil', needs: 'card', sizes: [[8, 40], [10, 60], [20, 240]], unit: 'cm' },
        ]);
        const [w, area] = rng.pick(story.sizes);
        return {
          text: `
            A ${story.thing} is ${w} ${story.unit} wide and covers ${area} ${story.unit}² of ${story.needs}.

            It is enlarged, keeping its shape, until it is **${w * k} ${story.unit} wide**. What area does it cover now?
          `,
          answer: area * k * k,
          unit: `${story.unit}²`,
          wrong: [
            [area * k, `That multiplies the area by ${k}, as if it were a length. An area is multiplied by ${k} × ${k}.`],
            [area + (w * k - w), 'Enlarging multiplies. Find the scale factor first.'],
            [w * k * w * k, `That treats the ${story.thing} as a square. Scale the area you were given instead.`],
          ],
          hints: [
            `The width went from ${w} to ${w * k}. What is the scale factor?`,
            `The scale factor is ${k}, so the area is multiplied by $${k}^2 = ${k * k}$.`,
          ],
          explain: `The scale factor is $${w * k} \\div ${w} = ${k}$, so the area is multiplied by $${k}^2 = ${k * k}$: $${area} \\times ${k * k} = ${area * k * k}$ ${story.unit}².`,
        };
      },
    },
    {
      id: 'teach-similar',
      type: 'info',
      title: 'Similar shapes',
      text: r`
        Two shapes are **similar** when one is an exact enlargement of the other: the same angles,
        and **every** length multiplied by the same scale factor. So one pair of matching sides
        gives the scale factor, and the scale factor gives every other side.

        :::example
        The bases match: 7 cm became 21 cm.

        1. Scale factor, large ÷ small: $21 \div 7 = 3$.
        2. The height is multiplied by it too: $4 \times 3 = 12$ cm.
        :::

        A scale factor need not be a whole number: from 10 cm to 15 cm it is $15 \div 10 = 1.5$.
      `,
      figure: similarTriangles({ a: 7, b: 4, k: 3, u: 'cm', labels: ['7 cm', '4 cm', '21 cm', '?'] }),
    },
    {
      id: 'missing-side',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [a, b] = rng.pick([[3, 2], [4, 3], [5, 2], [5, 3], [6, 4], [4, 5], [3, 4]]);
        const k = rng.pick([2, 3, 4, 1.5, 2.5]);
        const u = rng.pick(['cm', 'm', 'mm']);
        const big = a * k;
        const answer = b * k;
        return {
          text: 'These two triangles are **similar**: the large one is an exact enlargement of the small one. Find the side marked **?**',
          figure: similarTriangles({ a, b, k, u, labels: [`${a} ${u}`, `${b} ${u}`, `${num(big)} ${u}`, '?'] }),
          answer,
          unit: u,
          wrong: [
            [b + (big - a), `Enlarging **multiplies** every side by the same number. It does not add the same amount (${num(big - a)}) to each side.`],
            [big, 'That is the base of the large triangle. The ? is its height.'],
          ],
          hints: [
            `Compare the two bases first: ${a} ${u} became ${num(big)} ${u}. What is the scale factor?`,
            `The scale factor is $${num(big)} \\div ${a} = ${num(k)}$. Multiply the small height by it.`,
          ],
          explain: `The scale factor is $${num(big)} \\div ${a} = ${num(k)}$. Every length is multiplied by it, so the height is $${b} \\times ${num(k)} = ${num(answer)}$ ${u}.`,
        };
      },
    },
    {
      id: 'shadows',
      type: 'numeric',
      title: 'Measure a tree without climbing it',
      gen: (rng) => {
        const pole = rng.pick([1, 2, 3]);
        const ratio = rng.pick([0.5, 1.5, 2]);         // shadow length ÷ height at this time of day
        const times = rng.pick([3, 4, 5, 6]);          // how many times taller the tree is
        const tree = pole * times;
        const poleShadow = pole * ratio;
        const treeShadow = tree * ratio;
        return {
          text: `
            On a sunny day, a ${pole} m pole casts a shadow ${num(poleShadow)} m long.
            At the same moment a tree casts a shadow ${num(treeShadow)} m long.

            The sunlight slants at the same angle over both, so the pole and the tree make **similar** triangles with their shadows.

            **How tall is the tree?** (The picture is not drawn to scale.)
          `,
          figure: shadowFigure({ pole, poleShadow: num(poleShadow), treeShadow: num(treeShadow) }),
          answer: tree,
          unit: 'm',
          wrong: [
            [pole + (treeShadow - poleShadow), 'The tree is not taller by the *difference* in the shadows. Its shadow is so-many **times** as long, and so is its height.'],
            [treeShadow, 'That is the length of the shadow. The height changes by the same scale factor as the shadow does.'],
          ],
          hints: [
            'The sun shines on both at the same angle, so the pole and the tree make similar triangles with their shadows.',
            `The tree's shadow is $${num(treeShadow)} \\div ${num(poleShadow)} = ${times}$ times as long as the pole's.`,
          ],
          explain: `
            One scale factor fits both sides of similar triangles.
            The tree's shadow is $${num(treeShadow)} \\div ${num(poleShadow)} = ${times}$ times as long, so the tree is ${times} times as tall: $${times} \\times ${pole} = ${tree}$ m.

            The Greek thinker Thales is said to have measured the height of a pyramid this way, about 2,600 years ago.
          `,
        };
      },
    },
    {
      id: 'teach-same-shape',
      type: 'info',
      title: 'Multiply, never add',
      text: `
        To test whether two rectangles are similar, look for **one** number that multiplies both sides.
        Start from a 2 × 4 rectangle:

        | New | What happened | Similar? |
        |---|---|---|
        | 6 × 12 | both sides × 3 | yes |
        | 5 × 10 | both sides × 2.5 | yes |
        | 1 × 2 | both sides × 0.5 | yes |
        | 5 × 7 | 3 added to each | no |
        | 2 × 8 | one side doubled | no |

        Adding the same amount to each side makes a rectangle squarer, so its shape changes.
        A scale factor below 1 shrinks a shape and keeps it similar.
      `,
      figure: gridFigure({
        cols: 17, rows: 7,
        shapes: [
          { pts: [[1, 1], [5, 1], [5, 3], [1, 3]], color: 'blue' },
          { pts: [[6, 1], [8, 1], [8, 2], [6, 2]], color: 'green' },
          { pts: [[9, 1], [16, 1], [16, 6], [9, 6]], color: 'orange' },
        ],
        labels: [
          { at: [3, 2], text: '2 × 4' }, { at: [7, 1.5], text: '1 × 2', size: 'sm' }, { at: [12.5, 3.5], text: '5 × 7' },
          { at: [3, 0.5], text: 'start', size: 'sm' }, { at: [7, 0.5], text: '× 0.5', size: 'sm' }, { at: [12.5, 0.5], text: '+ 3: squarer', size: 'sm' },
        ],
        alt: 'Three rectangles on a grid. The first is 2 squares tall and 4 wide. The second, 1 by 2, is the same shape at half the size. The third, 5 by 7, was made by adding 3 to each side and is visibly squarer.',
      }),
    },
    {
      id: 'similar-or-not',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const [a, b] = rng.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]);
        const name = `${a} × ${b}`;
        const yes = rng.sample([2, 3, 10, 0.5, 1.5], 3).map((k) => ({
          text: `${num(a * k)} × ${num(b * k)}`, bucket: 0,
          why: `Both sides of the ${name} rectangle were multiplied by ${num(k)}, so it is the same shape.`,
        }));
        const no = rng.sample([
          { text: `${a + 1} × ${b + 1}`, why: `Adding 1 to both sides changes the shape. ${a} to ${a + 1} and ${b} to ${b + 1} are not the same multiplication.` },
          { text: `${a + 3} × ${b + 3}`, why: 'Adding the same amount to both sides makes a rectangle squarer. Similar shapes are made by multiplying.' },
          { text: `${2 * a} × ${b}`, why: 'Only one side was doubled, so the rectangle was stretched, not enlarged.' },
          { text: `${a} × ${2 * b}`, why: 'Only one side was doubled, so the rectangle was stretched, not enlarged.' },
          { text: `${3 * a} × ${2 * b}`, why: 'One side was multiplied by 3 and the other by 2. An enlargement uses the same scale factor for both.' },
        ], 3).map((it) => ({ ...it, bucket: 1 }));
        return {
          text: `Which of these rectangles are **similar** to a ${name} rectangle (the same shape, at a different size)?`,
          buckets: [`Similar to ${name}`, 'Not similar'],
          items: [...yes, ...no],
        };
      },
      explain: 'A similar shape comes from **multiplying** every length by one scale factor. Adding the same amount to each side, or stretching one direction only, changes the shape.',
    },
    {
      id: 'cube',
      type: 'interact',
      title: 'Now in three dimensions',
      text: `
        A solid has length, width *and* height, and all three are scaled.

        **Find the scale factor at which the big cube is made of exactly 27 unit cubes.**
      `,
      widget: { type: 'scale-shape', shape: 'cube', k: 1, readouts: ['lengths', 'faces', 'cubes'], alt: 'A unit cube and an enlarged copy built from unit cubes. A slider sets the scale factor.' },
      check: (s) => {
        if (s.k === 3) return true;
        if (s.k === 1) return 'At a scale factor of 1 the copy is a single unit cube. Drag the slider.';
        return `At a scale factor of ${s.k} the big cube holds ${s.cubes} unit cubes. You are looking for 27.`;
      },
      solution: { k: 3 },
      hints: ['How many unit cubes are in one layer? How many layers are there?'],
      explain: r`
        Three layers, each of $3 \times 3$ cubes: $3 \times 3 \times 3 = 27$.
      `,
    },
    {
      id: 'teach-volume',
      type: 'info',
      title: 'Lengths, areas, volumes',
      text: r`
        A flat shape grows in two directions, a solid in three. So the scale factor is used once for a
        length, twice for an area and three times for a **volume** (the space a solid fills):
        $k \times k \times k$, written $k^3$.

        :::key
        Scale factor $k$: lengths × $k$, areas × $k^2$, volumes × $k^3$.
        :::

        :::example
        A model boat is rebuilt in the same material with a scale factor of 6.

        - Its length and its height: 6 times as much.
        - The paint to cover it is an area: $6 \times 6 = 36$ times as much.
        - Its weight goes with its volume: $6 \times 6 \times 6 = 216$ times as much.
        :::
      `,
      figure: {
        type: 'scale-shape', shape: 'cube', k: 2, slider: false, readouts: ['lengths', 'faces', 'cubes'],
        alt: 'A unit cube and a copy enlarged with a scale factor of 2, built from 2 by 2 by 2, that is 8, unit cubes.',
      },
    },
    {
      id: 'giant',
      type: 'fill',
      stretch: true,
      title: 'Why there are no giants',
      gen: (rng) => {
        const k = rng.pick([2, 3, 5, 10]);
        return {
          text: `
            A storybook giant is shaped exactly like a person, only **${k} times as tall**.

            His weight depends on his *volume*. The strength of his leg bones depends on the *area* of a slice through them.
          `,
          template: `
            His weight is [[${k * k * k}]] times a person's.

            His leg bones are only [[${k * k}]] times as strong.

            So each square centimetre of bone has to carry [[${k}]] times the usual load.
          `,
          hints: [
            'Weight goes with volume: scale factor × scale factor × scale factor.',
            'Strength goes with area: scale factor × scale factor. Then divide the weight by the strength.',
          ],
          explain: `
            Volume grows as $${k}^3 = ${k * k * k}$, but area only as $${k}^2 = ${k * k}$, so every bit of bone carries $${k * k * k} \\div ${k * k} = ${k}$ times the load.

            A person scaled up far enough could not even stand. It is why an elephant's legs are so much
            thicker for its size than a deer's, and one reason you will never meet an ant the size of a horse.
            Galileo spelled out this argument in 1638.
          `,
        };
      },
    },
    {
      id: 'statue',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const k = rng.pick([2, 3, 4, 5, 10]);
        const story = rng.pick([
          { maker: 'A sculptor', small: 'model', big: 'statue', cover: 'paint needed to cover it', fill: 'weight (it is made of the same stone)' },
          { maker: 'A baker', small: 'test cake', big: 'showpiece cake', cover: 'icing needed to cover it', fill: 'weight (it is the same recipe)' },
          { maker: 'A toy company', small: 'toy building brick', big: 'display brick', cover: 'paint needed to cover it', fill: 'amount of plastic in it (it is solid)' },
        ]);
        return {
          text: `${story.maker} makes a ${story.big} with exactly the same shape as a ${story.small}, but **${k} times as tall**. Compared with the ${story.small}:`,
          template: `
            its width is × [[${k}]],

            the ${story.cover} is × [[${k * k}]],

            and its ${story.fill} is × [[${k * k * k}]].
          `,
          explain: `Width is a length: × ${k}. Covering it is an area: × $${k}^2 = ${k * k}$. What fills it is a volume: × $${k}^3 = ${k * k * k}$.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A 40 cm pizza is twice as wide as a 20 cm pizza.

        In your own words: why is it **four** times as much pizza, and not just twice as much?
      `,
      model: `
        Making the pizza twice as wide stretches it in *both* directions, across and up-and-down.
        Every little square of the small pizza becomes a 2 × 2 block of four squares in the big one.

        Lengths are multiplied by the scale factor, 2. Areas are multiplied by the scale factor twice: 2 × 2 = 4.
      `,
    },
  ],
  recap: [
    'Similar shapes are exact enlargements of each other: same angles, every length multiplied by one scale factor $k$.',
    'Lengths × $k$, areas × $k^2$, volumes × $k^3$.',
    'To enlarge, multiply. Adding the same amount to every side changes the shape.',
    'Similar triangles let you measure things you cannot reach, like the height of a tree from its shadow.',
  ],
  next: 'That is the end of Geometry: Shape & Space. Your review queue will keep these ideas fresh.',
};
