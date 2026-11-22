// How AI Learns · Lesson 2 · One Neuron
import { r } from '../../../kit.js';
import { MANGOES, PLUMS, SOUR_MANGOES, MESSY_MANGOES, fruitLab } from '../helpers.js';

const SWAPPED = 'Your border is in the right place, but its sides are the wrong way round: the neuron says “ripe” exactly where it should say “unripe”. Flip the signs of the weights and the bias.';

export default {
  id: 'a-single-neuron',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Ripe or not?',
      text: `
        A farm measures two things about every mango: how **sweet** it is and how **soft** it is.
        The circles turned out to be ripe. The squares were not.

        A new mango arrives: the pink diamond. **Ripe or unripe?**
      `,
      figure: fruitLab(MANGOES, {
        line: false, probe: { x: 7.5, y: 5 },
        alt: 'Sixteen mangoes plotted by sweetness and softness. Ripe ones sit towards the top right, unripe ones towards the bottom left. A new mango sits at sweetness 7.5, softness 5.',
      }),
      shuffle: false,
      options: [
        { text: 'Ripe', correct: true },
        { text: 'Unripe' },
        { text: 'There is no way to tell' },
      ],
      explain: `
        It sits among the ripe ones, so: probably ripe.

        To decide, you pictured a border between the two groups and checked which side the newcomer was on.
        The basic building block of modern AI decides in the same way: **a border, and a side**.
      `,
    },
    {
      id: 'slide-the-border',
      type: 'interact',
      graded: false,
      title: 'Slide the border',
      text: r`
        Meet a **neuron**. It gives every mango a score,

        $$ \begin{aligned} \text{score} = {} & 1 \times \text{sweetness} \\ & + 1 \times \text{softness} + \text{bias} \end{aligned} $$

        and says “ripe” when the score is above 0. The striped area is where it says “ripe”.

        Right now the bias is 0, so every mango scores above 0. **Lower the bias until all 16 are sorted correctly.**
      `,
      widget: fruitLab(MANGOES, {
        w1: { value: 1 }, w2: { value: 1 }, b: { value: 0 }, lock: ['w1', 'w2'],
        alt: 'The sixteen mangoes and the border of a neuron with weights 1 and 1.',
      }),
      check: (s) => {
        if (s.separated) return true;
        return s.b > -8
          ? 'Some unripe mangoes still score above 0. Lower the bias further.'
          : 'Too far: now some ripe mangoes score below 0. Raise the bias a little.';
      },
      solution: { b: -10 },
      explain: `
        With a bias of −10, the neuron says “ripe” only when sweetness plus softness comes to more than 10.

        Notice what the bias did: it **slid** the border across the picture without turning it.
      `,
    },
    {
      id: 'plums',
      type: 'interact',
      attempts: 6,
      title: 'A different fruit',
      text: `
        These are plums. Look where the ripe ones are now.

        The neuron still has the numbers that worked for mangoes, and it gets three plums wrong.
        **Change the weights and the bias until all 16 are right.**
      `,
      widget: fruitLab(PLUMS, {
        w1: { value: 1 }, w2: { value: 1 }, b: { value: -10 },
        alt: 'Sixteen plums. Ripe ones are on the right, unripe ones on the left, at every height.',
      }),
      check: (s) => {
        if (s.separated) return true;
        if (s.swapped) return SWAPPED;
        if (s.w2 !== 0) return 'The border is still tilted. Look at the plums: does softness tell ripe from unripe at all? Try another weight on softness.';
        if (s.w1 <= 0) return 'With that weight on sweetness, a sweeter plum does not score higher. Make it positive.';
        return 'The border stands upright now. Slide it with the bias until it sits between the two groups.';
      },
      solution: { w1: 1, w2: 0, b: -5 },
      hints: [
        'Ripe plums are on the right and unripe ones on the left, whether they are soft or firm. So the border has to stand upright.',
        'A weight of 0 makes the neuron ignore that input. Set the weight on softness to 0.',
        'Now the score is just sweetness + bias. A bias of −5 puts the border at sweetness 5.',
      ],
      explain: `
        For plums, softness tells you nothing. The working neuron has a weight of **0** on it, and the border stands upright.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Inside the neuron',
      text: `
        An **artificial neuron** does two small things.

        1. **Weighted sum.** Multiply each input by its weight, add them up, then add one more number, the **bias**.
        2. **Threshold.** If the total is above 0, answer “yes”. Otherwise answer “no”.

        :::example Weights 4 and −3, bias 5, inputs 2 and 3
        score = 4 × 2 − 3 × 3 + 5 = 8 − 9 + 5 = **4**. That is above 0, so the neuron says “yes”.
        :::

        A weight of 0 wipes its input out of the sum. That is how your plum neuron ignored softness.

        Drag the pink diamond around and watch the sum being worked out.
      `,
      figure: fruitLab(MANGOES, {
        w1: { value: 1 }, w2: { value: 1 }, b: { value: -10 }, lock: ['w1', 'w2', 'b'],
        probe: { x: 6, y: 7, drag: true },
        alt: 'The mango neuron with weights 1 and 1 and bias −10, and a test point that can be dragged.',
        caption: 'The name comes from a loose comparison with brain cells. Do not read much into it: an artificial neuron is exactly this bit of arithmetic.',
      }),
    },
    {
      id: 'work-the-sum',
      type: 'fill',
      review: true,
      gen: (rng) => {
        let w1; let w2; let b; let x1; let x2; let score;
        let guard = 0;
        do {
          w1 = rng.int(1, 3);
          w2 = rng.pick([-2, -1, 1, 2]);
          b = rng.intExcept(-9, 4, [0]);
          x1 = rng.int(1, 6);
          x2 = rng.int(1, 6);
          score = w1 * x1 + w2 * x2 + b;
        } while ((score === 0 || Math.abs(score) > 9) && guard++ < 200);
        const sign = (v) => (v < 0 ? '−' : '+');
        const sum = `${w1} × ${x1} ${sign(w2)} ${Math.abs(w2)} × ${x2} ${sign(b)} ${Math.abs(b)}`;
        return {
          text: `
            A neuron has weights **${w1}** and **${w2 < 0 ? '−' : ''}${Math.abs(w2)}** and a bias of **${b < 0 ? '−' : ''}${Math.abs(b)}**.
            Its two inputs are **${x1}** and **${x2}**. It says “yes” when the score is above 0.

            Work out what it does.
          `,
          template: `score = ${sum} = [[${score}]], so the neuron says [[${score > 0 ? '*yes|no' : 'yes|*no'}]].`,
          explain: `${w1} × ${x1} = ${w1 * x1}, and ${w2 < 0 ? '−' : ''}${Math.abs(w2)} × ${x2} = ${w2 * x2 < 0 ? '−' : ''}${Math.abs(w2 * x2)}. Together with the bias: ${score < 0 ? '−' : ''}${Math.abs(score)}. That is ${score > 0 ? 'above 0, so the answer is “yes”' : 'not above 0, so the answer is “no”'}.`,
        };
      },
    },
    {
      id: 'sourness',
      type: 'interact',
      attempts: 6,
      title: 'An input that counts against',
      text: `
        Mangoes again, with a new measurement: **sourness** instead of softness.
        A ripe mango is sweet and *not* sour.

        **Tune the neuron to sort all 16.**
      `,
      widget: fruitLab(SOUR_MANGOES, {
        yLabel: 'sourness',
        w1: { value: 1 }, w2: { value: 1 }, b: { value: -8 },
        alt: 'Sixteen mangoes plotted by sweetness and sourness. Ripe ones sit at the bottom right: sweet and not sour.',
      }),
      check: (s) => {
        if (s.separated) return true;
        if (s.swapped) return SWAPPED;
        if (s.w2 >= 0) return 'With that weight on sourness, a sourer mango never scores lower. Sourness should push the score *down*.';
        if (s.w1 <= 0) return 'Sweetness should push the score up. Give it a positive weight.';
        return 'Both inputs now push the right way. Adjust the bias (and the balance of the two weights) until the border passes between the groups.';
      },
      solution: { w1: 1, w2: -1, b: 0 },
      hints: [
        'Ask which way each input pushes. More sweetness: more likely ripe. More sourness: less likely ripe.',
        'Give sourness a negative weight, for example −1.',
        'Try weights 1 and −1 with a bias of 0. The score is then sweetness minus sourness.',
      ],
      explain: `
        The score is now *sweetness − sourness*: ripe when a mango is sweeter than it is sour.
        The negative weight makes sourness count *against* ripeness.
      `,
    },
    {
      id: 'teach-weights',
      type: 'info',
      title: 'What a weight says',
      text: `
        You have now met three kinds of weight. Each says something about its input.

        | Weight | What it says | You saw it on |
        |:------:|--------------|---------------|
        | positive | pushes towards “yes” | sweetness |
        | negative | pushes towards “no” | sourness |
        | 0 | ignored | softness of plums |

        The **sign** says which way the input pushes. The **size** says how hard.
        Read a weight as “what one more of this input does to the score”.

        :::example Water the plant?
        A neuron has a weight of **+2** on *days since watering* and **−5** on *rain today (1 or 0)*.
        Each dry day adds 2 to the score. Rain takes 5 off: that cancels more than two dry days.
        :::
      `,
    },
    {
      id: 'read-weights',
      type: 'choice',
      review: true,
      text: `
        A neuron flags emails as spam. It says “spam” when its score is above 0. After tuning, its weights are:

        | Input | Weight |
        |-------|-------:|
        | number of links | +2 |
        | number of exclamation marks | +0.5 |
        | sender is in your contacts (1 or 0) | −4 |

        **Which statement fits these weights?**
      `,
      options: [
        { text: 'Coming from a contact lowers the score by 4: a strong push towards “not spam”', correct: true },
        { text: 'One extra exclamation mark raises the score more than one extra link', why: 'Each exclamation mark adds 0.5 to the score. Each link adds 2.' },
        { text: 'The more links, the less likely the neuron is to say “spam”', why: 'The weight on links is positive: every link pushes the score up, towards “spam”.' },
        { text: 'The neuron ignores who the sender is', why: 'An ignored input has a weight of 0. This one has −4, the largest weight in the table.' },
      ],
      explain: `
        Read each weight as “what one more of this input does to the score”. Links: +2 each. Exclamation marks: +0.5 each.
        A known sender: −4, enough to cancel two links.
      `,
    },
    {
      id: 'teach-border',
      type: 'info',
      title: 'What moves the border',
      text: `
        On the graph, the three numbers place the border.

        - The **weights** tilt it.
        - The **bias** slides it without turning it. Raise the bias and more points get a “yes”.

        Only the *balance* of the three matters. **Try it:** set both weights to 2 and the bias to −20.
        Every score doubles, but a score above 0 stays above 0. The border does not move.
      `,
      figure: fruitLab(MANGOES, {
        w1: { value: 1 }, w2: { value: 1 }, b: { value: -10 },
        alt: 'The sixteen mangoes and a neuron with weights 1 and 1 and bias −10, all three adjustable. Its border sorts all sixteen.',
      }),
    },
    {
      id: 'knobs',
      type: 'match',
      text: 'Match each change to what it does to a neuron.',
      pairs: [
        ['Raise the bias', 'The border slides: more points get a “yes”'],
        ['Set a weight to 0', 'That input is ignored'],
        ['Flip the sign of a weight', 'That input now pushes the other way'],
        ['Double both weights and the bias', 'Nothing: same border, same answers'],
      ],
      explain: `
        The bias slides, a weight of 0 switches its input off, and a flipped sign turns a push into a pull.
        Doubling everything changes no answer: for the border, only the *balance* between the numbers matters.
      `,
    },
    {
      id: 'odd-one-out',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'Real data are messy',
      text: `
        One more batch of mangoes, measured by sweetness and softness again.

        **Sort as many as you can.** Is 16 out of 16 possible?
      `,
      widget: fruitLab(MESSY_MANGOES, {
        w1: { value: 1 }, w2: { value: 0 }, b: { value: -5 },
        alt: 'Sixteen mangoes. One ripe mango sits deep among the unripe ones.',
      }),
      check: (s) => {
        if (s.correct >= 15) return true;
        if (s.swapped) return SWAPPED;
        return `That sorts ${s.correct} of 16. A single border can do better: 15 is possible.`;
      },
      solution: { w1: 1, w2: 1, b: -10 },
      hints: [
        'Start from what worked for the first batch: both weights 1, bias −10.',
        'One ripe mango sits in the middle of the unripe ones. No straight border can fetch it without losing others.',
      ],
      explain: `
        15 of 16 is the best any straight border can do. One ripe mango sits deep among the unripe ones:
        perhaps it was mislabelled, perhaps it is just an odd mango.
      `,
    },
    {
      id: 'teach-one-border',
      type: 'info',
      title: 'One neuron, one straight border',
      text: `
        Whatever its weights, a neuron’s border is a **straight line**: a weighted sum cannot bend.
        So the odd mango stays on the wrong side, and 15 of 16 is the best one neuron can do.
        (Curves and corners take several neurons working together.)

        That is no disgrace. Real data always contain cases like this. A good model gets *most* cases right.
        It does not twist itself to fit every exception.

        :::key
        A neuron stores no examples. All it keeps is its weights and its bias: here, three numbers for sixteen mangoes.
        :::
      `,
      figure: fruitLab(MESSY_MANGOES, {
        w1: { value: 1 }, w2: { value: 1 }, b: { value: -10 }, lock: ['w1', 'w2', 'b'],
        alt: 'The messy batch with the border of a neuron with weights 1 and 1 and bias −10. Fifteen mangoes are on the right side. One ripe mango sits among the unripe ones, on the wrong side.',
      }),
    },
    {
      id: 'neuron-facts',
      type: 'multi',
      review: true,
      text: 'Which of these are true of a single artificial neuron with two inputs?',
      options: [
        { text: 'It multiplies each input by a weight, adds the results and adds a bias', correct: true },
        { text: 'On a graph of its two inputs, it says “yes” on one side of a straight line', correct: true },
        { text: 'An input with a weight of 0 has no effect on its answer', correct: true },
        { text: 'It compares a new case with the most similar example it has stored', why: 'A neuron stores no examples at all. It has its weights and its bias, nothing else.' },
        { text: 'With well-chosen weights its border can be curved', why: 'A weighted sum always gives a straight border. Curves and corners need several neurons working together.' },
      ],
      explain: `
        Weighted sum, then threshold: a straight border with a “yes” side. That is all one neuron can do.
        What many of them can do together is the subject of the lesson after next.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        In your own words: **what does one artificial neuron do with its inputs, and what do its weights mean?**
      `,
      model: `
        It multiplies each input by a weight, adds everything up together with a bias, and answers “yes” if the total is above zero.

        Each weight says how much its input counts, and in which direction: positive pushes towards “yes”, negative towards “no”, zero means “ignore”.
        The bias shifts the cut-off. On a graph, all of this is one straight border with a “yes” side.
      `,
    },
  ],
  recap: [
    'A neuron works out a **weighted sum** of its inputs plus a **bias**, and says “yes” when the total is above 0.',
    'On a graph that is a straight border. The weights tilt it, the bias slides it.',
    'A weight’s size says how much its input counts; its sign says which way it pushes.',
    'We simplified: the artificial neurons in today’s networks respond gradually instead of switching sharply, and usually have far more than two inputs. The weighted sum is the same.',
  ],
  next: 'Next: how a machine finds good weights without anyone turning the knobs.',
};
