// How AI Learns · Lesson 1 · Prediction Machines
import { r } from '../../../kit.js';
import { BATTERY, deliveryLab } from '../helpers.js';

/** Three little worlds for "recipe" questions: a weight, a head start and an input, in sensible ranges. */
const SCENES = [
  {
    intro: 'A delivery app predicts how long an order will take from the distance',
    output: 'minutes', input: 'km', unit: 'min',
    w: [2, 5], b: [3, 9], x: [3, 12],
    ask: (x) => `for an order ${x} km away`,
    perUnit: 'Each extra kilometre adds', zero: 'An order from 0 km away would take', every: 'Every order takes',
  },
  {
    intro: 'A gardener predicts the height of a sunflower from its age',
    output: 'height', input: 'weeks', unit: 'cm',
    w: [4, 9], b: [2, 8], x: [3, 10],
    ask: (x) => `for a sunflower that is ${x} weeks old`,
    perUnit: 'Each extra week adds', zero: 'A sunflower aged 0 weeks would measure', every: 'Every sunflower measures',
  },
  {
    intro: 'A kiosk predicts how many ice-cream cones it will sell from the temperature',
    output: 'cones', input: 'degrees', unit: 'cones',
    w: [6, 12], b: [10, 30], x: [15, 30],
    ask: (x) => `for a day of ${x} °C`,
    perUnit: 'Each extra degree adds', zero: 'At 0 °C it would sell', every: 'Every day it sells',
  },
];

/**
 * The worked example for the average miss: three orders [km, minutes taken]. The model 3 × km + 5 predicts
 * 41, 47 and 53 minutes, so the misses are 3, 4 and 2. (The practice step only ever predicts 14 to 38 minutes.)
 */
const EXAMPLE_ORDERS = [[12, 44], [14, 43], [16, 55]];

const recipe = (s, w, b) => r`$$ \text{${s.output}} = \blue{${w}} \times \text{${s.input}} + \orange{${b}} $$`;

export default {
  id: 'prediction-machines',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How long will it take?',
      text: `
        A food-delivery app has logged eight past orders: how far each one went and how many minutes it took.

        A new order comes in from **6 km** away. **How many minutes would you tell the customer?**
      `,
      figure: deliveryLab({
        line: false, probe: 6,
        alt: 'Eight dots rising from about 9 minutes at 1 km to 32 minutes at 9 km. A dashed line marks 6 km, where there is no dot.',
      }),
      min: 0, max: 40, step: 1, start: 0, answer: 23, tolerance: 3, unit: 'min',
      explain: `
        The dots point to about **23 minutes**.

        Nobody handed you a formula. You looked at examples, saw a trend and stretched it to a case
        you had never seen. That is the whole job of a prediction machine, and in this lesson you build one.
      `,
    },
    {
      id: 'one-knob',
      type: 'interact',
      graded: false,
      title: 'A recipe with one knob',
      text: r`
        Here is about the simplest recipe a machine could use:

        $$ \text{minutes} = \blue{w} \times \text{km} $$

        The number $w$ is a knob. Each [red bar]{.red} shows how far one prediction misses the real time.

        **Turn the knob until the average miss is as small as you can make it.**
      `,
      widget: deliveryLab({
        b: false,
        w: { min: 0, max: 6, step: 0.25, value: 1, label: 'knob $w$' },
        alt: 'The eight deliveries with the line minutes = w times km.',
      }),
      check: (s) => {
        if (s.w === 3.75) return true;
        if (s.error <= 2.65) return 'Close. Nudge the knob one notch and watch the readout: about 2.3 is possible.';
        return s.w < 3.75
          ? 'The line is too flat: it predicts far too few minutes for the long trips. Turn the knob up.'
          : 'The line is too steep: it predicts far too many minutes for the long trips. Turn the knob down.';
      },
      solution: { w: 3.75 },
      explain: r`
        The best this recipe can do is $w = 3.75$, with an average miss of about 2.3 minutes.

        Look at the red bars: the short trips are still under-predicted while the long ones are
        over-predicted. One knob cannot fix both ends at once.
      `,
    },
    {
      id: 'two-knobs',
      type: 'interact',
      title: 'Add a second knob',
      text: r`
        Even a 1 km order takes a while: the food has to be packed and picked up first.
        So give the recipe a head start:

        $$ \text{minutes} = \blue{w} \times \text{km} + \orange{b} $$

        **Tune both knobs until the average miss is 1 minute or less.**
      `,
      widget: deliveryLab({
        w: { min: 0, max: 6, step: 0.25, value: 3.75, label: 'knob $w$' },
        b: { min: 0, max: 12, step: 1, value: 0, label: 'knob $b$' },
        alt: 'The eight deliveries with the line minutes = w times km plus b.',
      }),
      check: (s) => {
        if (s.error <= 1) return true;
        if (s.tilt > 0.3) return 'Too steep: the line climbs faster than the dots. Lower $w$ (and raise $b$ if the whole line then sits too low).';
        if (s.tilt < -0.3) return 'Too flat: the dots climb faster than the line. Raise $w$.';
        return s.over > 0
          ? 'The tilt is about right, but the whole line sits too high. Lower $b$.'
          : 'The tilt is about right, but the whole line sits too low. Raise $b$.';
      },
      solution: { w: 3, b: 5 },
      hints: [
        'Look at the short trips on the left: the line passes below them. Raising $b$ lifts the whole line.',
        'Once it is lifted, the line overshoots the long trips. Lower $w$ to tilt it back down.',
        'Try $w = 3$ and $b = 5$.',
      ],
      explain: r`
        With $w = 3$ and $b = 5$ the recipe reads: *5 minutes to get going, then 3 minutes for every kilometre*.
        The average miss drops below a minute.

        It will never reach zero. Real deliveries hit red lights and slow lifts, and no line passes through every dot.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'You just built a model',
      text: r`
        A **model** is a recipe with adjustable numbers. It turns an input into a prediction.

        $$ \text{minutes} = \blue{w} \times \text{km} + \orange{b} $$

        - The **input** (or *feature*) is what the model is told: the distance.
        - The **prediction** (or *output*) is what it answers: the minutes.
        - The **weights** are the adjustable numbers, $\blue{w}$ and $\orange{b}$.
        - The **error** says how far the predictions miss the real examples.

        :::key
        The model does not keep the eight orders. It keeps two numbers.
        Every prediction is the recipe, worked out with those numbers.
        :::

        Our model has 2 weights. The models behind modern AI systems use the same idea with millions or billions of them.
      `,
    },
    {
      id: 'example-use-recipe',
      type: 'info',
      title: 'Using the recipe',
      text: r`
        Once the weights are set, a prediction is plain arithmetic. Take the delivery model with $\blue{w} = 3$ and $\orange{b} = 5$.

        :::example An order from 2 km away
        Put 2 in place of “km”. Multiply first, then add:

        $\blue{3} \times 2 + \orange{5} = 6 + 5 = 11$ minutes.
        :::

        Each weight has its own job.

        - $\orange{b} = 5$ is the prediction for 0 km: the head start.
        - $\blue{w} = 3$ is what **each extra kilometre adds**. For 3 km the model says 14 minutes: one kilometre more, 3 minutes more.
      `,
      figure: deliveryLab({
        static: true, misses: false, probe: 2,
        w: { value: 3 }, b: { value: 5 },
        alt: 'The eight deliveries with the line minutes = 3 times km plus 5. A marker at 2 km sits on the line at 11 minutes.',
      }),
    },
    {
      id: 'use-recipe',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const s = rng.pick(SCENES);
        const w = rng.int(s.w[0], s.w[1]);
        const b = rng.int(s.b[0], s.b[1]);
        const x = rng.int(s.x[0], s.x[1]);
        const answer = w * x + b;
        return {
          text: `${s.intro}:\n\n${recipe(s, w, b)}\n\n**What does it predict ${s.ask(x)}?**`,
          answer,
          unit: s.unit,
          wrong: [
            [(w + b) * x, `Only the input is multiplied by the weight ${w}. Multiply first, then add ${b}.`],
            [w * x, `That is ${w} × ${x}. The recipe also adds ${b}.`],
            [w + x + b, `The weight *multiplies* the input: ${w} × ${x}, not ${w} + ${x}.`],
          ],
          hints: [`Put ${x} in place of “${s.input}”.`, r`$${w} \times ${x} = ${w * x}$. Now add ${b}.`],
          explain: r`$${w} \times ${x} + ${b} = ${w * x} + ${b} = ${answer}$. A model with fixed weights is just arithmetic.`,
        };
      },
    },
    {
      id: 'read-weight',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const s = rng.pick(SCENES);
        const w = rng.int(s.w[0], s.w[1]);
        const b = rng.intExcept(s.b[0], s.b[1], [w]);
        return {
          text: `${s.intro}:\n\n${recipe(s, w, b)}\n\n**What does the weight ${w} tell you?**`,
          options: [
            { text: `${s.perUnit} ${w} ${s.unit} to the prediction`, correct: true },
            { text: `${s.zero} ${w} ${s.unit}`, why: `That is the job of the other weight: with an input of 0, the recipe gives ${b}.` },
            { text: `${s.every} ${w} ${s.unit}`, why: `The ${w} is multiplied by the input, so its effect grows as the input grows.` },
            { text: `The predictions are off by ${w} ${s.unit} on average`, why: 'A recipe says nothing about its own error. Error only shows up when you compare predictions with real examples.' },
          ],
          explain: `The weight ${w} multiplies the input, so every extra unit of input changes the prediction by ${w}. The other weight, ${b}, is what is left when the input is 0.`,
        };
      },
    },
    {
      id: 'teach-error',
      type: 'info',
      title: 'One number for “how wrong?”',
      text: r`
        The **error** of a model is one number that says how far its predictions miss. Ours is the **average miss**, the average length of the [red bars]{.red}:

        1. For each example, find the gap between predicted and actual. Too high or too low, a miss is a distance, so drop the sign.
        2. Average the gaps.

        :::example Three orders
        | Predicted | Actual | Miss |
        |----------:|-------:|-----:|
        | 41 min | 44 min | 3 |
        | 47 min | 43 min | 4 |
        | 53 min | 55 min | 2 |

        Average miss: $\frac{3 + 4 + 2}{3} = 3$ minutes.
        :::
      `,
      figure: {
        type: 'fit-line',
        static: true,
        points: EXAMPLE_ORDERS,
        x: [10, 18], y: [30, 60], xStep: 2, yStep: 10,
        xLabel: 'distance (km)', yLabel: 'minutes',
        names: { input: 'km', output: 'minutes' },
        unit: 'min',
        w: { value: 3 }, b: { value: 5 },
        alt: 'Three orders at 12, 14 and 16 km. The line predicts 41, 47 and 53 minutes; the real times were 44, 43 and 55. Red bars of length 3, 4 and 2 join each dot to the line.',
      },
    },
    {
      id: 'average-miss',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const avg = rng.int(2, 5);
        let misses;
        let guard = 0;
        do {
          const m1 = rng.int(0, 2 * avg);
          const m2 = rng.int(1, 2 * avg);
          misses = [m1, m2, 3 * avg - m1 - m2];
        } while ((misses[2] < 1 || misses[2] > 9 || misses[0] === misses[1]) && guard++ < 200);
        if (guard >= 200) misses = [avg - 1, avg + 2, avg - 1];
        const signs = rng.shuffle([1, -1, rng.sign()]);
        const predicted = misses.map(() => rng.int(14, 38));
        const actual = predicted.map((p, i) => p + signs[i] * misses[i]);
        const total = 3 * avg;
        const signedAvg = (signs[0] * misses[0] + signs[1] * misses[1] + signs[2] * misses[2]) / 3;
        const rows = predicted.map((p, i) => `| ${'ABC'[i]} | ${p} min | ${actual[i]} min |`).join('\n');
        return {
          text: `A delivery model made three predictions. Then the real times came in.\n\n| Order | Predicted | Actual |\n|:-----:|----------:|-------:|\n${rows}\n\n**What was its average miss?**`,
          answer: avg,
          unit: 'min',
          wrong: [
            [total, `That is the total of the three misses. Divide it by 3.`],
            [Math.abs(signedAvg), 'Too high by 3 and too low by 3 do not cancel out: both predictions missed by 3. Drop the signs before you average.'],
            [signedAvg, 'A miss is a distance, so it is never negative. Drop the signs before you average.'],
          ],
          hints: ['For each order, find the gap between predicted and actual. Ignore which one is bigger.', `The three misses are ${misses.join(', ')}. Now average them.`],
          explain: r`The misses are ${misses.join(', ')} minutes. Their average is $\frac{${misses.join(' + ')}}{3} = ${avg}$ minutes. One number for “how wrong is this model?” is exactly what we need to compare one setting of the weights with another.`,
        };
      },
    },
    {
      id: 'teach-machine-learning',
      type: 'info',
      title: 'Who sets the numbers?',
      text: `
        Most software follows **rules that a person wrote down**. A parking meter is told: one coin buys 30 minutes. It needs no examples.

        Rules work when a person can spell out every case. Often nobody can. What rule says whether a scribbled shape is a 4 or a 9, in everybody’s handwriting?

        Then we do what you did with the deliveries: a person chooses the recipe, and the weights are **found from examples**. That is what **machine learning** means.

        :::key
        To tell the two apart, ask: did somebody type the rule in, or was it worked out from examples?
        :::
      `,
    },
    {
      id: 'rules-or-examples',
      type: 'bucket',
      text: `
        A rule that a person wrote down, or numbers found from examples?

        **Sort these.**
      `,
      buckets: ['Rules written by a person', 'Learned from examples'],
      items: [
        { text: 'A thermostat: “below 19 °C, heating on”', bucket: 0, why: 'Somebody typed in that 19. Nothing was worked out from examples.' },
        { text: 'A calculator adding two numbers', bucket: 0, why: 'The rules of addition were programmed in. A calculator never needs examples.' },
        { text: 'A lift obeying its buttons', bucket: 0, why: 'A fixed rule: button 3 means floor 3.' },
        { text: 'A spam filter that learns from marked junk', bucket: 1, why: 'Each message you mark is a new example. The filter adjusts its numbers to fit them.' },
        { text: 'A keyboard suggesting your next word', bucket: 1, why: 'Nobody wrote a rule for every phrase. The suggestions come from patterns in a great deal of text.' },
        { text: 'An app naming a bird from a photo', bucket: 1, why: 'No person could write rules for every bird in every pose and light. It is tuned on many labelled photos.' },
        { text: 'The delivery model you just tuned', bucket: 1, why: 'Its two weights were set to fit eight examples.' },
      ],
      explain: `
        The thermostat, the calculator and the lift do what somebody typed in. Nobody can write down how to spot a robin
        in every possible photo, or which word you will want next, so those numbers are found from examples.
      `,
    },
    {
      id: 'downhill-data',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'Now the dots go down',
      text: `
        Different data: how much charge a phone has left after some hours of use.
        Same recipe, two knobs.

        **Tune the model until its average miss is 2.5 points or less.**
      `,
      widget: {
        type: 'fit-line',
        points: BATTERY,
        x: [0, 8], y: [0, 120], yStep: 20,
        xLabel: 'hours of use', yLabel: 'charge left (%)',
        names: { input: 'hours', output: 'charge' },
        unit: 'points',
        w: { min: -20, max: 10, step: 1, value: 5, label: 'knob $w$' },
        b: { min: 40, max: 120, step: 2, value: 60, label: 'knob $b$' },
        alt: 'Eight dots falling from 94 percent at half an hour to 13 percent at 7 hours, with an adjustable line.',
      },
      check: (s) => {
        if (s.error <= 2.5) return true;
        if (s.w >= 0) return 'Your line climbs, but the dots fall: more hours, less charge. What kind of $w$ makes a line slope downwards?';
        if (s.tilt > 0.7) return 'The line does not fall fast enough. Make $w$ more negative.';
        if (s.tilt < -0.7) return 'The line falls too fast. Bring $w$ back towards zero a little.';
        return s.over > 0 ? 'The slope is about right, but the whole line sits too high. Lower $b$.' : 'The slope is about right, but the whole line sits too low. Raise $b$.';
      },
      solution: { w: -12, b: 98 },
      hints: [
        'The charge goes down as the hours go up. A weight can be below zero.',
        'Where would the line start at 0 hours? Just under 100. That is $b$.',
        'Try $w = -12$ and $b = 98$.',
      ],
      explain: r`
        $w = -12$ and $b = 98$: the phone starts nearly full and loses about 12 points an hour.

        **A negative weight means: more of this input, less of the output.**
      `,
    },
    {
      id: 'teach-far-from-examples',
      type: 'info',
      title: 'A model answers anything',
      text: r`
        The battery examples run from half an hour to 7 hours of use. Now ask the model, with $w = -12$ and $b = 98$, about **12 hours**:

        $$ -12 \times 12 + 98 = -46 $$

        Minus 46 points of charge. No phone can do that, but the recipe does not notice. It answers *any* input in the same matter-of-fact way, whether or not it has seen anything like it.

        :::key
        Near its examples, a prediction is backed by evidence. Far from them the line simply carries on, and nobody has checked that the pattern does.
        :::
      `,
      figure: {
        type: 'fit-line',
        static: true, misses: false, probe: 12,
        points: BATTERY,
        x: [0, 14], y: [-60, 120], xStep: 2, yStep: 20,
        xLabel: 'hours of use', yLabel: 'charge left (%)',
        names: { input: 'hours', output: 'charge' },
        unit: 'points',
        w: { value: -12, step: 1 }, b: { value: 98 },
        alt: 'The eight battery readings, all between half an hour and 7 hours, with the line charge = −12 times hours plus 98. The line carries on below zero: at 12 hours it reads −46 points.',
      },
    },
    {
      id: 'far-from-examples',
      type: 'choice',
      text: r`
        The delivery model was tuned on trips of 1 to 9 km. Now someone asks it about a **60 km** delivery.
        It answers without hesitation: $3 \times 60 + 5 = 185$ minutes.

        **How far should you trust that?**
      `,
      options: [
        { text: 'Less than its other predictions: it never saw an example anywhere near 60 km', correct: true },
        { text: 'Just as much: it is the same recipe with the same weights', why: 'Same recipe, yes. But the weights were only ever checked against short trips. Nobody knows whether the straight-line pattern carries on that far.' },
        { text: 'More: with bigger numbers the pattern is clearer', why: 'The pattern was found between 1 and 9 km. Beyond that there is no evidence either way.' },
        { text: 'Not at all: a model cannot handle inputs it has not seen', why: 'It can, and that is the point of it: 6 km was new too. What matters is how far the new input is from the examples.' },
      ],
      explain: `
        185 minutes is not absurd, as minus 46 points of charge was. That is what makes it risky: nothing warns you.
        A 60 km trip might use a motorway, or might not be offered at all. The model cannot know.

        Predictions far from the examples deserve extra doubt. This idea returns in the last lesson.
      `,
    },
    {
      id: 'vocabulary',
      type: 'match',
      review: true,
      text: 'Match each word with what it means for a model.',
      pairs: [
        ['Input (feature)', 'What the model is told'],
        ['Prediction (output)', 'What the model answers'],
        ['Weight', 'An adjustable number in the recipe'],
        ['Error', 'How far predictions miss real examples'],
      ],
      explain: 'Input in, prediction out, weights in between, and the error to tell you how well the weights are set.',
    },
  ],
  recap: [
    'A **model** is a recipe with adjustable numbers, called **weights**, that turns an input into a prediction.',
    'The **error** measures how far its predictions miss real examples. Better weights mean a smaller error.',
    'In machine learning, people choose the recipe; the weights are found from examples.',
    'A model answers any input with the same confidence. Far from its examples, trust it less.',
  ],
  next: 'Next: a model that answers yes or no — a single artificial neuron.',
};
