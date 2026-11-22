// How AI Learns · Lesson 3 · Learning Is Rolling Downhill
import { r, num } from '../../../kit.js';
import { deliveryLab } from '../helpers.js';

/** A tidy one-weight error valley: lowest at weight 4. */
const valley = (extra = {}) => ({
  type: 'descent-lab',
  curve: '(w - 4)^2',
  x: [0, 8], y: [0, 16], yStep: 4,
  start: 1.5,
  ...extra,
});

/** A bumpy landscape: a shallow valley on the left, a hump, and a deeper valley on the right. */
const TWO_VALLEYS = {
  type: 'descent-lab',
  curve: '0.1(w - 1.5)^2 (w - 6)^2 + 0.3(6 - w) + 0.8',
  x: [0, 7.5], y: [0, 11], yStep: 2,
};

export default {
  id: 'learning-by-descent',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Lost in the fog',
      text: `
        You are on a hillside in thick fog and want to get down to the valley floor.
        You can see your own feet and nothing else.

        **What do you do?**
      `,
      options: [
        { text: 'Feel which way the ground slopes, take a step downhill, and repeat', correct: true },
        { text: 'Pick a direction and walk in a straight line' },
        { text: 'Jump to random spots and hope one is lower' },
        { text: 'Wait until the fog lifts and you can see the whole valley' },
      ],
      explain: `
        Feel the slope, step downhill, repeat. You never need to see the whole landscape.

        Nearly every modern AI system gets its weights by doing exactly this.
        First question, though: where is the hill?
      `,
    },
    {
      id: 'trace-the-valley',
      type: 'interact',
      graded: false,
      title: 'Where is the hill?',
      text: r`
        Remember the one-knob delivery model, $\text{minutes} = \blue{w} \times \text{km}$?
        Every setting of the knob gives the model some error.

        **Move the knob slowly from one end to the other.** Each setting drops a dot on the lower chart:
        across is the knob, up is the error.

        :::note
        From here on, “error” means: square each miss, then take the average. Squaring makes big misses count extra.
        :::
      `,
      widget: deliveryLab({
        b: false,
        w: { min: 2.5, max: 5, step: 0.25, value: 2.5, label: 'knob $w$' },
        error: 'squared', chart: 'valley',
        alt: 'The delivery data with a one-knob line, and below it a chart of the error for every knob setting tried.',
      }),
      check: (s) => s.visited.length >= 8 || 'Keep going. Try more settings, right across the range, to see the whole shape.',
      solution: { w: 3.75, visited: [2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5] },
      explain: r`
        The dots trace out a valley. Its lowest point, at $w = 3.75$, is the best setting of the knob.

        **Finding good weights means finding the bottom of the error valley.**
        You found it by trying every setting. With billions of weights that is hopeless, and that is where the fog walk comes in.
      `,
    },
    {
      id: 'walk-down',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Walk downhill',
      text: `
        Here is the error valley of some model with a single weight. The ball marks the weight it has now.

        The [purple line]{.violet} shows the slope under the ball. The [dashed circle]{.green} shows where one step will take it.

        **Press “Take a step” until the ball comes to rest at the bottom.** Keep an eye on the size of the steps.
      `,
      widget: valley({ rate: 0.25, alt: 'A ball on the left slope of a U-shaped error curve.' }),
      check: (s) => s.settled || 'The ball is still on the slope. Keep stepping.',
      solution: { steps: 6 },
      explain: `
        Every step went downhill, and the steps shrank as the ground flattened: long strides on the steep part,
        tiny ones near the bottom.

        Nobody told the ball where the bottom was. It only ever used the slope right under it.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Gradient descent',
      text: r`
        What you just ran is called **gradient descent**. *Gradient* is another word for slope. One step is:

        $$ \begin{aligned} & \text{new weight} = \text{old weight} \\ & \quad - \green{\text{learning rate}} \times \violet{\text{slope}} \end{aligned} $$

        - The [slope]{.violet} says which way is uphill, and how steep. The minus sign turns the step downhill.
        - The [learning rate]{.green} is a number *you* choose. It scales every step.

        Steep ground gives a big step. On flat ground the slope is close to 0, so the steps fade away.
        That is why the ball came to rest.
      `,
    },
    {
      id: 'example-one-step',
      type: 'info',
      title: 'One step, worked out',
      text: r`
        :::example The ball’s first step
        The weight is 1.5. The slope there is −5. The learning rate is 0.25.

        $1.5 - 0.25 \times (-5) = 1.5 + 1.25 = 2.75$

        Taking away a negative number adds. The weight goes **up**: to the right, which is downhill here.
        :::

        On the far side of the valley the slope is positive. At a weight of 6 it is +4:

        $6 - 0.25 \times 4 = 6 - 1 = 5$

        The weight goes **down**: to the left, and downhill again.

        Press “Take a step” and compare the line under the chart with the first sum.
      `,
      figure: valley({ rate: 0.25, alt: 'The valley again, with the ball at its starting weight of 1.5 on the left slope. The rule under the chart reads: next weight = 1.5 − 0.25 × (−5) = 2.75.' }),
    },
    {
      id: 'one-step',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const rate = rng.pick([0.1, 0.2, 0.5]);
        const slope = rng.pick([-8, -6, -4, -2, 2, 4, 6, 8]);
        const w = rng.int(2, 9);
        const answer = Math.round((w - rate * slope) * 100) / 100;
        const step = Math.round(rate * Math.abs(slope) * 100) / 100;
        const shown = `${slope < 0 ? '−' : ''}${Math.abs(slope)}`;
        return {
          text: r`
            A weight is at **${w}**. The slope of the error there is **${shown}**. The learning rate is **${rate}**.

            **Where is the weight after one step of gradient descent?**

            $$ \begin{aligned} & \text{new weight} = \text{old weight} \\ & \quad - \text{learning rate} \times \text{slope} \end{aligned} $$
          `,
          answer,
          tolerance: 0.001,
          wrong: [
            [Math.round((w + rate * slope) * 100) / 100, `That step went *uphill*. The slope is ${slope > 0 ? 'positive, so the weight must go down' : 'negative, so the weight must go up'}: subtract learning rate × slope.`],
            [w - slope, `You took away the whole slope. Scale it by the learning rate first: ${rate} × ${shown}.`],
            [Math.round(rate * slope * 100) / 100, 'That is learning rate × slope: the size of the step. Now take it away from the old weight.'],
          ],
          hints: [
            r`First the size of the step: $${rate} \times ${num(slope)}$.`,
            `The slope is ${slope > 0 ? 'positive (uphill to the right), so the weight moves left: it gets smaller' : 'negative (downhill to the right), so the weight moves right: it gets bigger'}.`,
          ],
          explain: r`$${w} - ${rate} \times (${num(slope)}) = ${w} ${slope > 0 ? '-' : '+'} ${step} = ${answer}$. The weight moves ${slope > 0 ? 'down' : 'up'}, because that is the downhill direction.`,
        };
      },
    },
    {
      id: 'bigger-rate',
      type: 'choice',
      mode: 'predict',
      text: `
        With a learning rate of 0.25 the ball needed six steps.

        **What do you expect if the learning rate is about four times larger?**
      `,
      figure: valley({ rate: 0.25, static: true, preview: false, rule: false, alt: 'The same valley with the ball back at its starting point on the left slope.' }),
      options: [
        { text: 'It leaps right across the valley and lands on the far slope', correct: true },
        { text: 'It reaches the bottom in about a quarter of the steps' },
        { text: 'Nothing changes: the slope decides where the ball goes' },
        { text: 'It rolls back uphill' },
      ],
      explain: `
        A big learning rate means big steps. Too big, and a step overshoots the bottom and lands on the opposite slope,
        sometimes higher than where it started.

        See for yourself.
      `,
    },
    {
      id: 'choose-rate',
      type: 'interact',
      attempts: 8,
      title: 'Find a good learning rate',
      text: `
        Now the learning rate is yours. Try the two extremes first: the smallest rate, then the largest.
        Move the slider and watch where the dashed circle goes.

        **Then find a rate that brings the ball to rest at the bottom in 4 steps or fewer.**
      `,
      widget: valley({ rate: { min: 0.05, max: 1.1, step: 0.05, value: 0.05 }, alt: 'The valley with a slider for the learning rate.' }),
      check: (s) => {
        if (s.settled && s.steps <= 4) return true;
        if (s.escaped) return 'That rate is too large: every bounce lands higher than the last, until the ball flies off the chart. Go back to the start and lower the rate.';
        if (s.settled) return `It came to rest, but it took ${s.steps} steps. Go back to the start and try a ${s.crossings > 0 ? 'smaller' : 'larger'} rate.`;
        if (s.steps === 0) return 'Choose a rate, then press “Take a step”.';
        if (s.crossings > 0) return 'The ball is leaping from one side to the other. Go back to the start and try a smaller rate.';
        return s.steps >= 4
          ? 'Four steps gone and still on the slope: this rate is too small. Go back to the start and raise it.'
          : 'Not at the bottom yet. Keep stepping, or go back to the start and change the rate.';
      },
      solution: { rate: 0.5, steps: 1 },
      hints: [
        'With the smallest rate the ball crawls. With the largest it overshoots and bounces ever higher.',
        'Somewhere in between, a single step lands close to the bottom. Watch the dashed circle as you move the slider.',
        'A rate of 0.5 lands exactly on the bottom of this valley.',
      ],
      explain: `
        A rate of 0.5 lands on the bottom of this valley in a single step, and the rates near it get there within four.

        (This tidy valley has one perfect rate. Real landscapes have no such thing, so people try a few.)
      `,
    },
    {
      id: 'teach-learning-rate',
      type: 'info',
      title: 'Too small, too large',
      text: `
        The height of the ball is the model’s error. So the learning rate shows in the way the error behaves from step to step.

        | Learning rate | The steps | The error |
        |---------------|-----------|-----------|
        | too small | tiny: the ball crawls | falls, but very slowly |
        | too large | leap across the valley | jumps up and down, or grows |
        | good | a few reach the bottom | falls fast, then settles |

        The picture shows a rate of 1.05: every leap lands higher than the last.

        A good rate is as large as it can be without bouncing. Choosing it is one of the first decisions in training any model.
      `,
      figure: valley({
        rate: 1.05, steps: 4, static: true,
        alt: 'The valley with a learning rate of 1.05. The trail of the ball leaps from one slope to the other four times, each landing higher than the one before.',
      }),
    },
    {
      id: 'rate-symptoms',
      type: 'bucket',
      review: true,
      text: 'A model is being trained by gradient descent, and something is off with the learning rate. **Sort the symptoms.**',
      buckets: ['Rate too small', 'Rate too large'],
      items: [
        { text: 'The error falls, but painfully slowly', bucket: 0, why: 'Tiny steps in the right direction: that is a rate that is too small.' },
        { text: 'After 1,000 steps the weights have barely moved', bucket: 0, why: 'Steps are learning rate × slope. If they are this tiny, the rate is too small.' },
        { text: 'It would get there, given ten times as long', bucket: 0, why: 'Right direction, steps too short: the rate is too small.' },
        { text: 'The error jumps up and down from step to step', bucket: 1, why: 'Jumping about means overshooting: each step leaps across the valley.' },
        { text: 'The error grows with every step', bucket: 1, why: 'Each step lands higher on the far slope than before. The rate is far too large.' },
        { text: 'A weight leaps back and forth across the valley', bucket: 1, why: 'Leaping across is overshooting: the steps are too long.' },
      ],
      explain: 'Too small: slow but steady. Too large: bouncing, or an error that grows. A good rate is as large as it can be without bouncing.',
    },
    {
      id: 'train-the-line',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Two weights at once',
      text: r`
        Back to the delivery model with both knobs, $\blue{w}$ and $\orange{b}$, both starting at 0.
        This time you do not touch them.

        Each step works out the slope of the error for **both** weights and nudges both downhill.

        **Train until the error is below 1.**
      `,
      widget: deliveryLab({
        w: { value: 0 }, b: { value: 0 },
        error: 'squared', chart: 'history', train: { rate: 0.1, burst: 10 },
        alt: 'The delivery data with a line that starts flat at zero, and a chart of the error after each training step.',
      }),
      check: (s) => {
        if (s.error < 1) return true;
        return s.steps === 0 ? 'Press “Take 1 step” a few times and watch the line.' : `The error is ${s.error} after ${s.steps} steps. Keep training.`;
      },
      solution: { steps: 30 },
      explain: r`
        The line swung into place by itself and stopped close to $w = 3$, $b = 5$:
        the answer you found by hand two lessons ago.

        The lower chart is what people watch while a model trains: the error drops fast, then levels off.
        Nothing in this procedure knows anything about deliveries. It only follows the slope.

        (Behind the scenes the distances were rescaled first. That standard trick makes the valley rounder, so the steps head straight for the bottom.)
      `,
    },
    {
      id: 'teach-training',
      type: 'info',
      title: 'What one round does',
      text: r`
        What you just watched is called **training**. The examples the model learns from, here the eight deliveries, are its **training data**.

        Each press of “Take 1 step” was one round:

        1. **Predict.** The line, with the $\blue{w}$ and $\orange{b}$ it had, predicted all eight deliveries.
        2. **Measure.** The eight misses were squared and averaged into one number, the error.
        3. **Find the slopes.** One for $\blue{w}$ and one for $\orange{b}$.
        4. **Nudge.** Each weight took its own small step downhill.

        The next press started again from the new weights.

        :::key
        Nobody steers. The slope decides which way each weight moves. People choose the recipe, the data and the learning rate.
        :::
      `,
    },
    {
      id: 'training-loop',
      type: 'order',
      review: true,
      title: 'The training loop',
      text: `
        The examples a model learns from are its **training data**. Running gradient descent on them is called **training**.

        Put one round of training in order.
      `,
      items: [
        'Use the current weights to predict every training example',
        'Measure the error: how far are the predictions from the true answers?',
        'Work out the slope of the error for each weight',
        'Move each weight a small step downhill',
        'Start the next round with the new weights',
      ],
      labels: ['First', 'Last'],
      explain: `
        Predict, measure, find the slopes, nudge, repeat: thousands or millions of times. That loop is what “training a model” means.

        A large model has billions of weights, so its landscape has billions of directions. Each weight still gets the same
        treatment: a small step against its own slope. Real systems add refinements (for instance, they estimate the slopes
        from a small random batch of examples at a time), but the loop is the same.
      `,
    },
    {
      id: 'two-valleys',
      type: 'interact',
      stretch: true,
      attempts: 8,
      title: 'Where you start matters',
      text: `
        Real error landscapes are bumpy. This one has two valleys.

        **Press “Roll” and see where the ball comes to rest.** Then drag the ball to a new starting point,
        and **find a start from which it ends up in the deeper valley.**
      `,
      widget: {
        ...TWO_VALLEYS,
        start: 0.5, rate: 0.1, drag: true, snap: 0.25, roll: true,
        alt: 'An error curve with a shallow valley on the left, a hump in the middle and a deeper valley on the right.',
      },
      check: (s) => {
        if (s.settled && s.deepest) return true;
        if (s.settled) return 'The ball has come to rest, but look to the right: there is a deeper valley. Rolling downhill can never climb over the hump in between. Drag the ball to a different start.';
        if (s.escaped) return 'The ball left the chart. Go back to the start.';
        return 'Press “Roll” and let the ball come to rest.';
      },
      solution: { start: 4.5, steps: 20 },
      hints: [
        'From the left, the ball rolls into the first dip and stays there: the slope is zero, so the steps stop.',
        'Which way does the ground slope just to the right of the hump? Start the ball there.',
      ],
      explain: `
        Just to the right of the hump the ground slopes down towards the deeper valley, so a ball that starts there rolls into it.
        From the left it can never get over the hump: every step goes downhill.
      `,
    },
    {
      id: 'teach-low-point',
      type: 'info',
      title: 'A low point, not always the lowest',
      text: `
        The ball only ever feels the slope right under it. It has no map of the landscape.
        So it comes to rest in the first valley it rolls into, even when a deeper one lies beyond the hump.

        :::key
        Gradient descent finds *a* low point, not necessarily *the* lowest. Where it ends up depends on where it starts.
        :::

        This is one reason why two training runs of the same model can end with different weights.

        For very large models this matters less than you might fear: in practice, the low points that training reaches are usually good enough.
      `,
      figure: {
        ...TWO_VALLEYS,
        start: 0.5, rate: 0.1, steps: 40, static: true,
        alt: 'The landscape with two valleys. The ball started on the far left and has come to rest in the shallow left-hand valley. The deeper valley lies to the right, beyond a hump.',
      },
    },
    {
      id: 'descent-facts',
      type: 'multi',
      review: true,
      text: 'Which of these are true of training by gradient descent?',
      options: [
        { text: 'It needs only the slope at the current weights, not a map of the whole landscape', correct: true },
        { text: 'With a fixed learning rate, the steps shrink as the slope flattens', correct: true },
        { text: 'A larger learning rate always means faster learning', why: 'Only up to a point. Too large, and the steps overshoot: the error bounces about or even grows.' },
        { text: 'It always finds the weights with the lowest possible error', why: 'It finds a low point downhill from where it started. That may or may not be the lowest one.' },
        { text: 'A person decides which way each weight should move', why: 'The slope decides. People choose the recipe, the data and the learning rate.' },
      ],
      explain: 'Slope under your feet, step downhill, repeat. No map and no guarantee of the very lowest point, yet it is how the weights of nearly all modern AI systems are set.',
    },
  ],
  recap: [
    'Every setting of the weights has an error. Training means searching that landscape for a low point.',
    '**Gradient descent**: move each weight a small step against its slope. Repeat many times.',
    'The **learning rate** scales the steps. Too small crawls; too large overshoots and can blow up.',
    'Descent finds a low point, not necessarily the lowest. The examples it learns from are the **training data**.',
  ],
  next: 'Next: what a single neuron cannot do, and how layers of neurons can.',
};
