// Geometry: Shape & Space · Lesson 5 · What Pi Really Is
import { r, num, round } from '../../../kit.js';
import { circleFigure } from '../helpers.js';

const PI = 3.14; // the value learners are told to use
/** Accept answers worked out with 3.14 or with a calculator's π key, rounded sensibly. */
const tolerance = (withRoughPi, withTruePi) => Math.abs(round(withTruePi, 1) - round(withRoughPi, 1)) + 0.06;

const CAN = {
  type: 'svg', viewBox: '0 0 380 244', maxWidth: 380,
  alt: 'A tall can holding exactly three tennis balls stacked on top of each other. Its height and the distance around its lid are marked.',
  content:
    '<rect class="fill-blue-soft" opacity="0.5" x="150" y="24" width="68" height="192"/>' +
    '<g class="fill-yellow stroke-ink" stroke-width="2.5"><circle cx="184" cy="56" r="32"/><circle cx="184" cy="120" r="32"/><circle cx="184" cy="184" r="32"/></g>' +
    '<g class="stroke-surface fill-none" stroke-width="2.5" stroke-linecap="round"><path d="M160 42 q24 18 48 0"/><path d="M160 106 q24 18 48 0"/><path d="M160 170 q24 18 48 0"/></g>' +
    '<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" d="M150 24 V216 a34 9 0 0 0 68 0 V24"/>' +
    '<ellipse class="stroke-orange fill-none" stroke-width="5" cx="184" cy="24" rx="34" ry="9"/>' +
    '<path class="stroke-blue fill-none" stroke-width="3" stroke-linecap="round" d="M246 24 V216 M239 24 h14 M239 216 h14"/>' +
    // (inline fills: the shared .text-{hue} classes lose to .fig-label, which is declared after them)
    '<text class="fig-label" style="fill:var(--blue-text)" x="262" y="125" text-anchor="start">height</text>' +
    '<text class="fig-label" style="fill:var(--orange-text)" x="136" y="20" text-anchor="end">around the lid</text>',
};

// The three lengths of a circle, labelled (a static picture).
const PARTS = {
  type: 'svg', viewBox: '0 0 400 226', maxWidth: 460,
  alt: 'A circle with its centre marked. A line from the centre to the edge is labelled radius. A line straight across through the centre is labelled diameter. The edge itself, all the way round, is labelled circumference.',
  content:
    '<circle class="fill-blue-soft stroke-orange" stroke-width="5" cx="200" cy="128" r="84"/>' +
    '<path class="stroke-teal fill-none" stroke-width="4" stroke-linecap="round" d="M116 128 H284"/>' +
    '<path class="stroke-violet fill-none" stroke-width="4" stroke-linecap="round" d="M200 128 L248.2 59.2"/>' +
    '<circle class="fill-ink" cx="200" cy="128" r="5"/>' +
    '<text class="fig-label" style="fill:var(--orange-text)" x="200" y="26" text-anchor="middle">circumference</text>' +
    '<text class="fig-label" style="fill:var(--violet-text)" x="216" y="88" text-anchor="end">radius</text>' +
    '<text class="fig-label" style="fill:var(--teal-text)" x="200" y="152" text-anchor="middle">diameter</text>' +
    '<text class="fig-label-sm" x="192" y="118" text-anchor="end">centre</text>',
};

const circumferenceStories = [
  { thing: 'bicycle wheel', sizes: [50, 60, 65, 70], u: 'cm', ask: 'How far does it roll in one full turn?' },
  { thing: 'round table', sizes: [80, 90, 110, 120], u: 'cm', ask: 'How long is its edge, all the way round?' },
  { thing: 'trampoline', sizes: [3, 4, 5], u: 'm', ask: 'How long is the padding that runs all the way round its edge?' },
  { thing: 'pizza', sizes: [20, 25, 30, 35], u: 'cm', ask: 'How long is its crust, all the way round?' },
  { thing: 'circular pond', sizes: [6, 8, 12, 15], u: 'm', ask: 'How long is a walk all the way round its edge?' },
];

const radiusStories = [
  { setup: (v) => `The minute hand of a clock is ${v} cm long.`, ask: 'How far does its tip travel in one hour?', sizes: [8, 10, 12, 15], u: 'cm' },
  { setup: (v) => `A horse on a fairground roundabout is ${v} m from the centre.`, ask: 'How far does it travel in one full turn?', sizes: [3, 4, 5, 6], u: 'm' },
  { setup: (v) => `A sprinkler throws water ${v} m in every direction.`, ask: 'How long is the edge of the circle it waters?', sizes: [4, 5, 7, 9], u: 'm' },
  { setup: (v) => `You draw a circle with compasses opened to ${v} cm.`, ask: 'How long is the line you have drawn?', sizes: [4, 5, 6, 9], u: 'cm' },
];

const reverseStories = [
  { text: (c) => `A tape measure wrapped once round a tree trunk reads ${c} cm. **How thick is the trunk?**`, sizes: [30, 40, 50, 60, 80], u: 'cm' },
  { text: (c) => `A ribbon ${c} cm long fits exactly once round a cake tin. **How wide is the tin?**`, sizes: [15, 20, 25, 30], u: 'cm' },
  { text: (c) => `One lap of a circular running track is ${c} m. **How far is it straight across the middle of the circle?**`, sizes: [100, 150, 200], u: 'm' },
  { text: (c) => `A wheel rolls ${c} cm in one full turn. **What is its diameter?**`, sizes: [35, 45, 55, 70], u: 'cm' },
];

// (no radius of 2 anywhere: there πr² and 2πr are the same number, so a mix-up could not be caught)
const areaStories = [
  { setup: (v) => `A sprinkler waters everything within ${v} m of it.`, ask: 'What area of lawn does it water?', sizes: [3, 4, 5, 6, 8], u: 'm' },
  { setup: (v) => `A circular rug has a radius of ${v} m.`, ask: 'What area of floor does it cover?', sizes: [1, 1.5, 2.5, 3], u: 'm' },
  { setup: (v) => `A round pond has a radius of ${v} m.`, ask: 'What is the area of its surface?', sizes: [3, 4, 5, 7, 9], u: 'm' },
  { setup: (v) => `A circular pizza has a radius of ${v} cm.`, ask: 'What is its area?', sizes: [10, 12, 15, 18], u: 'cm' },
];

export default {
  id: 'circles-pi',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A can of tennis balls',
      text: `
        A can holds exactly three tennis balls, stacked.

        **Which is longer: the [height]{.blue} of the can, or the distance [around its lid]{.orange}?**
      `,
      figure: CAN,
      shuffle: false,
      options: [
        { text: 'The height of the can' },
        { text: 'The distance around the lid', correct: true },
        { text: 'They are exactly equal' },
      ],
      explain: `
        Around the lid is longer, although the can looks much taller than it is wide.

        The height is 3 ball-widths. The distance around is a little *more* than 3 ball-widths.
        That "little more than 3" is the most famous number in mathematics.
      `,
    },
    {
      id: 'teach-circle-parts',
      type: 'info',
      title: 'The words for a circle',
      text: `
        Every point on a circle is the same distance from its **centre**. Three lengths describe it:

        - the [radius]{.violet}: from the centre to the edge;
        - the [diameter]{.teal}: straight across, through the centre. It is two radii end to end, so **twice the radius**;
        - the [circumference]{.orange}: the distance all the way round the edge.

        On the can, the lid is one ball-width across: that is its diameter. The orange line round it is its circumference.
      `,
      figure: PARTS,
    },
    {
      id: 'roll',
      type: 'interact',
      title: 'Roll it out',
      text: `
        The rim of this wheel is covered in wet paint.

        **Roll it exactly one full turn** (drag the wheel, or use the slider) and see how long a trail it leaves.
        Then change its **diameter**, the distance straight across it, and roll again.
      `,
      widget: { type: 'pi-roll', d: 2, alt: 'A wheel standing on a ruler. Its diameter can be changed and it can be rolled along the ruler.' },
      check: (s) => {
        if (s.sizes.length >= 2) return true;
        if (s.sizes.length === 1) return s.rolled
          ? 'One wheel done. Now change the diameter and roll that wheel a full turn too.'
          : 'Roll this wheel all the way: one full turn.';
        return 'Roll the wheel one full turn: keep going until the paint mark is back on the ground.';
      },
      solution: { d: 3, turns: 1, sizes: [2, 3] },
      hints: ['Push the "Roll" slider all the way to the right. Then move the "Diameter" slider and roll again.'],
      explain: `
        A wheel 1 unit across rolls 3.14 units. A wheel 2 across rolls 6.28. A wheel 3 across rolls 9.42.

        Different distances, but always the same number of diameters: **three and a bit**.
        Every circle, big or small, is a little more than three diameters around.
      `,
    },
    {
      id: 'pi',
      type: 'info',
      title: 'Meet π',
      text: r`
        Divide the **circumference** of *any* circle by its diameter and you get the same number
        every time. It is written with the Greek letter $\pi$ ("pi"):

        $$\pi = 3.14159\ldots$$

        Its digits go on for ever with no repeating pattern, so we round it. In this course, use $\pi \approx 3.14$.

        :::key
        circumference = $\pi$ × diameter
        :::

        :::example
        A plate is 9 cm across. $3.14 \times 9 = 28.26$, so its circumference is about 28.3 cm.
        :::
      `,
      figure: circleFigure({ show: 'diameter', label: '9 cm', alt: 'A circle with a line straight across it through the centre, labelled 9 cm.' }),
    },
    {
      id: 'order',
      type: 'order',
      text: 'These five lengths all belong to the same circle. **Put them in order, shortest first.**',
      items: ['Its radius (centre to edge)', 'Its diameter', 'Three diameters laid end to end', 'Its circumference', 'Four diameters laid end to end'],
      labels: ['Shortest', 'Longest'],
      hints: ['The circumference is π diameters long. Which two whole numbers is π between?'],
      explain: r`
        The radius is half the diameter. The circumference is $\pi \approx 3.14$ diameters:
        longer than three of them, shorter than four.
      `,
    },
    {
      id: 'circumference',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick(circumferenceStories);
        const d = rng.pick(story.sizes);
        const answer = round(PI * d, 1);
        return {
          text: r`
            A ${story.thing} is ${d} ${story.u} across. ${story.ask}

            Use $\pi \approx 3.14$, and round to 1 decimal place if you need to.
          `,
          figure: circleFigure({ show: 'diameter', label: `${d} ${story.u}`, alt: `A circle with a line straight across it through the centre, labelled ${d} ${story.u}.` }),
          answer,
          tolerance: tolerance(PI * d, Math.PI * d),
          unit: story.u,
          wrong: [
            [3 * d, 'Three diameters is close, but a circle is three diameters *and a bit* around. Multiply by 3.14.'],
            [2 * PI * d, r`That doubles the diameter first. "Across" is already the diameter, so it is just $\pi \times ${d}$.`],
            [(PI * d) / 2, r`That halves it. The circumference is $\pi$ times the whole distance across.`],
          ],
          hints: ['The distance around is π times the distance across.', `$3.14 \\times ${d}$`],
          explain: `Circumference $= \\pi \\times$ diameter $\\approx 3.14 \\times ${d} = ${num(PI * d, 2)}$ ${story.u}.`,
        };
      },
    },
    {
      id: 'teach-radius',
      type: 'info',
      title: 'When you know the radius',
      text: r`
        Many circles are measured from the centre: the length of a clock hand, the reach of a sprinkler.
        That length is the radius. **Double it** to get the diameter, then multiply by $\pi$ as before.

        :::example
        A circle has a radius of 20 cm.

        1. The diameter is twice the radius: $2 \times 20 = 40$ cm.
        2. The circumference is $\pi$ × diameter: $3.14 \times 40 = 125.6$ cm.
        :::

        In symbols, with $r$ for the radius and $C$ for the circumference: $C = 2 \pi r$.
      `,
      figure: circleFigure({ show: 'radius', label: '20 cm', alt: 'A circle with a line from its centre to its edge, labelled 20 cm.' }),
    },
    {
      id: 'from-radius',
      type: 'numeric',
      title: 'From the centre out',
      gen: (rng) => {
        const story = rng.pick(radiusStories);
        const rad = rng.pick(story.sizes);
        const answer = round(2 * PI * rad, 1);
        return {
          text: r`
            The **radius** of a circle is the distance from its centre to its edge: half the diameter.

            ${story.setup(rad)} ${story.ask}

            Use $\pi \approx 3.14$, and round to 1 decimal place if you need to.
          `,
          figure: circleFigure({ show: 'radius', label: `${rad} ${story.u}`, alt: `A circle with a line from its centre to its edge, labelled ${rad} ${story.u}.` }),
          answer,
          tolerance: tolerance(2 * PI * rad, 2 * Math.PI * rad),
          unit: story.u,
          wrong: [
            [PI * rad, r`That is $\pi$ × radius. The circumference is $\pi$ × **diameter**, and the diameter is twice the radius.`],
            [PI * rad * rad, 'That squares the radius. Double it instead, to get the diameter.'],
          ],
          hints: [`The radius is ${rad} ${story.u}, so how far is it straight across the circle?`, `The diameter is ${num(2 * rad)} ${story.u}. Now multiply by 3.14.`],
          explain: r`The diameter is $2 \times ${rad} = ${num(2 * rad)}$ ${story.u}, so the circumference is $3.14 \times ${num(2 * rad)} = ${num(2 * PI * rad, 2)}$ ${story.u}.`,
        };
      },
    },
    {
      id: 'reverse',
      type: 'numeric',
      title: 'Run it backwards',
      gen: (rng) => {
        const story = rng.pick(reverseStories);
        const d = rng.pick(story.sizes);
        const c = num(PI * d, 1);
        return {
          text: r`
            ${story.text(c)}

            Circumference $= \pi \times$ diameter, so the rule runs backwards too: diameter $=$ circumference $\div \pi$.
            Use $\pi \approx 3.14$.
          `,
          answer: d,
          tolerance: 0.3,
          unit: story.u,
          wrong: [
            [PI * PI * d, 'Multiplying by π makes the distance even longer. The diameter is the *short* one: about a third of the way round.'],
            [d / 2, 'That is the radius. The question asks for the full distance across.'],
          ],
          hints: [r`Circumference $= \pi \times$ diameter. You know the circumference this time.`, `Undo the "× 3.14": work out $${c} \\div 3.14$.`],
          explain: `Circumference $= 3.14 \\times$ diameter, so diameter $= ${c} \\div 3.14 = ${d}$ ${story.u}.`,
        };
      },
    },
    {
      id: 'tube',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const n = rng.pick([2, 3, 3, 4]);
        const [ball, d] = rng.pick([['table-tennis balls', 4], ['tennis balls', 6.7], ['golf balls', 4.3], ['cricket balls', 7.2]]);
        const height = n * d;
        const around = PI * d;
        const sums = `Height: $${n} \\times ${d} = ${num(height, 2)}$ cm. Around: $3.14 \\times ${d} \\approx ${num(around, 2)}$ cm.`;
        return {
          text: `
            A tube holds exactly **${n}** ${ball} in a single stack, with no room to spare. Each ball is ${d} cm across.

            **Which is longer: the height of the tube, or the distance around it?**
          `,
          options: [
            { text: 'The height of the tube', correct: n > 3, why: n > 3 ? undefined : `The height is only ${n} ball-widths, and the distance around is more than 3 ball-widths. ${sums}` },
            { text: 'The distance around the tube', correct: n <= 3, why: n <= 3 ? undefined : `The distance around is about 3.14 ball-widths, but this tube is ${n} ball-widths tall. ${sums}` },
            { text: 'They are exactly equal', why: `The distance around is π ball-widths, which is never a whole number of them. ${sums}` },
          ],
          explain: `The tube is ${n} ball-widths tall, and π ≈ 3.14 ball-widths around. ${sums}`,
        };
      },
    },
    {
      id: 'wedges',
      type: 'interact',
      title: 'How much space is inside?',
      text: `
        Now for the **area** of a circle. Slice it like a pizza and lay the slices in a row,
        pointing up and down in turn.

        **Drag "Rearrange" all the way**, then raise the number of wedges to **24 or more**.
      `,
      widget: { type: 'circle-wedges', n: 8, alt: 'A circle cut into wedges. Sliders rearrange the wedges into a row and change how many wedges there are.' },
      check: (s) => {
        if (s.flat && s.n >= 24) return true;
        if (!s.flat) return 'Drag "Rearrange" all the way to the right, so the wedges lie in a row.';
        return `${s.n} wedges still make a bumpy shape. Raise the number of wedges to 24 or more.`;
      },
      solution: { n: 36, t: 1 },
      explain: `
        With more and more wedges, the bumps flatten out and the row closes in on a **rectangle**.

        Nothing was thrown away, so the area of the circle is the area of that rectangle.
      `,
    },
    {
      id: 'rectangle',
      type: 'fill',
      title: 'Measure the rectangle',
      text: r`Here are 36 wedges of a circle. Its radius is $r$, so its whole circumference is $2 \pi r$ long.`,
      figure: {
        type: 'circle-wedges', n: 36, t: 1, slider: false, countSlider: false,
        alt: 'Thirty-six thin wedges of a circle laid in a row, pointing up and down in turn. The row is almost a rectangle. Its top edge is made of the orange half of the rim and its bottom edge of the blue half.',
      },
      template: r`
        Each wedge reaches from the centre of the circle to its edge, so the rectangle is as tall as the [[diameter|*radius|circumference]].

        Its bottom edge is the blue half of the rim, so it is as wide as [[all|*half|a quarter]] of the circumference: $\pi r$.

        Width × height $= \pi r \times r$, which is written [[2πr|*πr²|πd]].
      `,
      hints: ['Height: how long is one wedge from its point to its curved edge?', 'Width: the rim was shared between the top edge and the bottom edge.'],
      explain: r`
        The rectangle is $r$ tall and $\pi r$ wide, so its area is $\pi r \times r = \pi r^2$.
      `,
    },
    {
      id: 'teach-circle-area',
      type: 'info',
      title: 'The area of a circle',
      text: r`
        No wedge was thrown away, so the circle has the same area as that rectangle.

        :::key
        Area of a circle $= \pi r^2$ (π × radius × radius)
        :::

        :::example
        A round table top has a radius of 30 cm.

        1. Square the radius first: $30 \times 30 = 900$.
        2. Then multiply by $\pi$: $3.14 \times 900 = 2826$ cm².
        :::

        Keep the two formulas apart: $2 \pi r$ is the distance **around**, $\pi r^2$ is the space **inside**.
        Given a diameter, halve it first.
      `,
      figure: circleFigure({ show: 'radius', label: '30 cm', alt: 'A circle with a line from its centre to its edge, labelled 30 cm.' }),
    },
    {
      id: 'area',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick(areaStories);
        const rad = rng.pick(story.sizes);
        const exact = PI * rad * rad;
        return {
          text: r`
            ${story.setup(rad)} ${story.ask}

            Use $\pi \approx 3.14$, and round to 1 decimal place if you need to.
          `,
          figure: circleFigure({ show: 'radius', label: `${rad} ${story.u}`, alt: `A circle with a line from its centre to its edge, labelled ${rad} ${story.u}.` }),
          answer: round(exact, 1),
          tolerance: tolerance(exact, Math.PI * rad * rad),
          unit: `${story.u}²`,
          wrong: [
            [2 * PI * rad, r`That is the circumference, $2 \pi r$: the distance around. The area is $\pi \times r \times r$.`],
            [PI * rad, 'Multiply π by the radius **twice**: π × r × r.'],
            [PI * PI * rad * rad, 'Square only the radius, then multiply by π once.'],
            [PI * 4 * rad * rad, 'That used the diameter. The formula needs the radius.'],
          ],
          hints: [r`Area $= \pi \times r \times r$.`, `$3.14 \\times ${rad} \\times ${rad}$`],
          explain: `Area $= \\pi r^2 \\approx 3.14 \\times ${rad} \\times ${rad} = ${num(exact, 4)}$ ${story.u}².`,
        };
      },
    },
    {
      id: 'pizza',
      type: 'choice',
      stretch: true,
      shuffle: false,
      gen: (rng) => {
        const [big, small] = rng.pick([[30, 20], [40, 30], [36, 24], [35, 25], [45, 30], [28, 20]]);
        const one = PI * (big / 2) ** 2;
        const two = 2 * PI * (small / 2) ** 2;
        const sums = `One ${big} cm pizza: $3.14 \\times ${num(big / 2)}^2 \\approx ${num(one, 0)}$ cm². Two ${small} cm pizzas: $2 \\times 3.14 \\times ${num(small / 2)}^2 \\approx ${num(two, 0)}$ cm².`;
        return {
          text: `
            Pizzas are sold by their **diameter**. For the same price you can have one ${big} cm pizza or two ${small} cm pizzas.

            **Which choice gives you more pizza?**
          `,
          options: [
            { text: `One ${big} cm pizza`, correct: one > two, why: one > two ? undefined : `Work out both areas, using the radius. ${sums}` },
            { text: `Two ${small} cm pizzas`, correct: two > one, why: two > one ? undefined : `Two sounds like more, but area depends on the radius *squared*. ${sums}` },
            { text: 'Exactly the same amount', why: `Compare the areas, not the diameters. ${sums}` },
          ],
          hints: ['The amount of pizza is its area. Halve each diameter to get the radius first.'],
          explain: `${sums} Because the radius is squared, a slightly wider pizza is a lot more pizza.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A friend says: "$\pi$ is just a number you have to memorise, 3.14."

        What would you tell them $\pi$ actually **measures**?
      `,
      model: r`
        $\pi$ is how many diameters fit around a circle. Roll any wheel one full turn and it travels
        its own width a little more than three times: about 3.14 times, whatever its size.

        So $\pi$ is not an arbitrary number to memorise. It is something you could measure with a wheel and a ruler.
      `,
    },
  ],
  recap: [
    'Every circle is the same number of diameters around: **π ≈ 3.14**.',
    'Circumference = π × diameter (or 2 × π × radius).',
    'Sliced into wedges, a circle rearranges into a rectangle r tall and πr wide.',
    'Area of a circle = π × r × r.',
  ],
  next: 'Next: what happens to lengths, areas and giants when everything is scaled up.',
};
