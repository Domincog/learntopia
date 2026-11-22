// Inside Neural Networks · Lesson 4 · The Art of Training
import { r, num } from '../../../kit.js';
import { show, PLANTS, RATES, BATCHES, LAB, lab } from '../helpers.js';

const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Three finished runs as small pictures: the same network, all 12 plants per step, three learning rates. */
const picture = (rate, alt) => ({ type: 'loss-curves', rate, batch: 12, validation: false, fit: false, static: true, alt });

export default {
  id: 'training-in-practice',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A million examples',
      text: `
        In *How AI Learns*, one round of training predicted **every** training example, measured the
        error, and only then moved the weights one small step.

        Now the data set has a million examples. A tempting shortcut: pick 100 of them at random,
        work out the gradients from those alone, and step. That is 10,000 times less work per step.

        **What do you expect from the shortcut?**
      `,
      options: [
        { text: 'Each step is based on a rougher estimate, so the path downhill is jittery, but it still leads downhill', correct: true },
        { text: 'Nothing changes: 100 examples give exactly the same gradients as a million' },
        { text: 'It cannot work: gradients from 100 examples point in a random direction' },
      ],
      explain: `
        Jittery, but downhill. A hundred examples give a rough estimate of the gradient, a bit
        different every time, and right on average.

        Nearly every network is trained this way. First, see why the estimate is "right on average".
      `,
    },
    {
      id: 'teach-batch-gradient',
      type: 'info',
      title: 'One gradient per example',
      text: r`
        In "Passing the Blame Backwards", backpropagation gave each weight a gradient for **one**
        training example. A training set has many examples, and each gives the weight a gradient
        of its own. Some say "go up", others "go down".

        The gradient for a group of examples is the **average** of their gradients.

        :::example Three examples give one weight the gradients 10, −4 and 6
        1. All three: $\;(10 - 4 + 6) \div 3 = 4$. This is the gradient a full step would use.
        2. Only the first two: $\;(10 - 4) \div 2 = 3$. Not 4, but close, for two thirds of the work.
        :::

        An average over some of the examples is an **estimate** of the average over all of them.
      `,
    },
    {
      id: 'batch-by-hand',
      type: 'fill',
      title: 'An average, and an estimate of it',
      text: r`
        Watch one weight of another network. There are four training examples, and for each of them backpropagation
        gives this weight a gradient:

        | example | 1 | 2 | 3 | 4 |
        |---|:-:|:-:|:-:|:-:|
        | gradient | 8 | −2 | 4 | −2 |

        The gradient for a group of examples is the **average** of their gradients.
      `,
      template: `
        All four examples: [[2]]

        Only the first two: [[3]]

        Only the last two: [[1]]
      `,
      hints: ['Add the gradients in the group and divide by how many there are.'],
      explain: r`
        All four: $(8 - 2 + 4 - 2) \div 4 = 2$. The first two: $(8 - 2) \div 2 = 3$. The last two: $(4 - 2) \div 2 = 1$.

        Each small group gives an estimate of the true value, 2: one too high, one too low. A step
        taken with either estimate still moves the weight the right way, at half the cost.
      `,
    },
    {
      id: 'lab-batch',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Smooth or jagged',
      text: `
        A real network, small enough to train in your browser: 1 input, 20 hidden ReLU units, 1 output.
        The tomato plants are back, a noisier dozen this time, and the network predicts the harvest from the water.

        The chart shows the training loss after every **epoch**: one pass through all 12 plants.
        The dotted line is a goal, a loss of ${num(LAB.goal)}.

        **Press “Train” with the batch size at 12** (every step uses all the plants). **Then set it to 2 and train again.**
      `,
      widget: lab({
        rate: 0.01, batch: { values: BATCHES, value: 12 }, goal: LAB.goal, validation: false,
        alt: 'A chart of training loss against epochs with a goal line, and next to it twelve training plants with the curve the network predicts. A slider sets the batch size.',
      }),
      check: (s) => {
        if (s.runs === 0) return 'Press “Train” to run 300 epochs with all 12 plants in every step.';
        if (!s.history.some((run) => run.batch === 12)) return 'Also train once with the batch size at 12, so that you have something to compare with.';
        if (!s.history.some((run) => run.batch < 12)) return 'Now move the batch size down to 2 and press “Train” again. The first run stays on the chart in grey.';
        return true;
      },
      solution: { runs: [{ batch: 12 }, { batch: 2 }] },
      explain: `
        With all 12 plants in every step the curve is perfectly smooth, and it crosses the goal at epoch ${LAB.reach[0.01]}.

        With batches of 2 the curve is jagged: every step follows just two plants, and the next step two others.
        But there are now six steps in each epoch instead of one, and the loss is under the goal after about 30 epochs.

        An epoch costs the same arithmetic either way: 12 plants' worth of gradients. So the jagged run got there
        with about a sixth of the work.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Batches and epochs',
      text: r`
        - A **batch** (or *mini-batch*) is the handful of examples used for one step. Their gradients are averaged. The **batch size** is how many examples that is: 2, 32, 512…
        - An **epoch** is one pass through the whole training set, in batches. The examples are usually shuffled before each epoch.
        - Gradient descent on random batches is called **stochastic gradient descent** (*stochastic* means "involving chance").

        :::example Counting steps: 12 plants, batches of 2, 300 epochs
        One epoch is $12 \div 2 = 6$ batches, so 6 steps. Over 300 epochs that makes $\mathord{6 \times 300 = 1{,}800}$ steps.
        :::

        :::key
        Small batches: rougher steps, but many more of them for the same work.
        :::

        In practice the batch size is chosen to suit the hardware. The rough steps are not a
        flaw to be put up with: a little noise often helps a network find weights that work better on new data.
      `,
    },
    {
      id: 'epoch-count',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const batch = rng.pick([20, 25, 50, 100]);
        const perEpoch = rng.pick([12, 30, 40, 60, 120]);
        const examples = batch * perEpoch;
        const epochs = rng.int(3, 9);
        const answer = perEpoch * epochs;
        return {
          text: `
            A training set has **${fmtInt(examples)} examples**. Training uses batches of **${batch}** and runs for **${epochs} epochs**.

            **How many steps does gradient descent take altogether?** (An epoch is one pass through all the examples. There is one step per batch.)
          `,
          answer,
          unit: 'steps',
          wrong: [
            [perEpoch, `That is one epoch: ${fmtInt(examples)} ÷ ${batch} batches. Training runs for ${epochs} epochs.`],
            [examples * epochs, 'That is how many examples are processed. A step uses a whole batch of them.'],
            [epochs, 'There is not one step per epoch but one step per batch, and an epoch has many batches.'],
          ],
          hints: [`How many batches of ${batch} make up ${fmtInt(examples)} examples? That is the number of steps in one epoch.`],
          explain: r`One epoch is $${examples} \div ${batch} = ${perEpoch}$ batches, so ${perEpoch} steps. Over ${epochs} epochs that makes $${perEpoch} \times ${epochs} = ${answer}$ steps.`,
        };
      },
    },
    {
      id: 'lab-rate',
      stretch: true,
      type: 'interact',
      attempts: 8,
      title: 'The training lab',
      text: `
        The same network. Now the **learning rate** is yours, and the batch size too.

        Leave the batch size at 12 to begin with, and try the smallest and the largest rate, to see what trouble looks like.

        **Then find settings that take the training loss below the goal in fewer than 50 epochs,
        without the loss ever shooting far above where it started.**
      `,
      widget: lab({
        rate: { values: RATES, value: 0.002 }, batch: { values: BATCHES, value: 12 }, goal: LAB.goal, validation: false,
        alt: 'A chart of training loss against epochs with a goal line, and the plants with the curve the network predicts. Sliders set the learning rate and the batch size.',
      }),
      check: (s) => {
        if (!s.ran) return s.runs === 0 ? 'Choose a learning rate and press “Train”.' : 'You have changed the settings. Press “Train” to see what they do.';
        if (s.diverged) return `At a rate of ${show(s.rate, 3)} the steps were so large that the loss blew up. Try a much smaller rate.`;
        if (s.spiked) return `On the way, the loss shot up to ${show(s.peak, 0)}: steps this large leap right across the valley. Try a smaller rate.`;
        if (s.reached == null) {
          return s.lateBumps >= 10
            ? `After 300 epochs the training loss is still ${show(s.finalTrain)}, and the curve is jumping up and down to the very end. Steps this rough do not settle. Try a smaller rate.`
            : `After 300 epochs the training loss is still ${show(s.finalTrain)}. The curve is heading the right way, but too slowly. Try a larger rate.`;
        }
        if (s.reached >= 50) {
          // progress per epoch is roughly the rate times the number of steps in an epoch
          return s.rate * (PLANTS / s.batch) < 0.04
            ? `It got below the goal, but only at epoch ${s.reached}. Larger steps would get there sooner: raise the rate.`
            : `It got below the goal only at epoch ${s.reached}, after a great deal of jumping about. Steps this rough waste time. Try a smaller rate.`;
        }
        return true;
      },
      solution: { rate: 0.05, batch: 12, run: true },
      hints: [
        'With all 12 plants in every step, the two smallest rates never reach the goal in 300 epochs, and the largest ones overshoot.',
        'Work upwards from the small end until the goal is reached before epoch 50. Stop before the loss starts leaping.',
      ],
      explain: `
        With all 12 plants in every step, a rate of 0.05 gets under the goal by epoch ${LAB.reach[0.05]}. At 0.01 it takes until epoch ${LAB.reach[0.01]}, and at 0.002 it is nowhere near after 300 epochs.
        At 0.1 the loss leaps to more than 50 before it recovers, and at 0.5 it blows up within a few epochs.
        Even 0.05 is close to the edge: look for the bump in its curve a little after epoch 100.

        Smaller batches shift the whole range: with batches of 2 a rate of 0.01 is already enough, because every epoch then has six steps.

        This is the lesson of the ball in the valley from *How AI Learns*, on a real network: too small crawls, too large overshoots,
        and the good range in between has to be found by trying.
      `,
    },
    {
      id: 'teach-curve-shapes',
      type: 'info',
      title: 'The shape gives the rate away',
      text: `
        You do not need the numbers to judge a learning rate. The shape of the training curve
        gives it away, as the ball in the valley did in *How AI Learns*.

        | Learning rate | The training curve |
        |---|---|
        | too small | smooth and slow: still falling when training ends |
        | too large | leaps far above where it started, or blows up |
        | about right | drops fast, then levels off |

        The pictures show two runs of the lab's network, with all 12 plants in every step. First a
        rate of 0.005: it crawls. Then a rate of 0.5: the loss leaves the chart at once, and training
        has to be stopped.
      `,
      figure: [
        picture(0.005, 'A training curve at a learning rate of 0.005. It falls smoothly and slowly and is still coming down after 300 epochs.'),
        picture(0.5, 'A training curve at a learning rate of 0.5. It shoots straight off the top of the chart within the first few epochs, and there the run ends.'),
      ],
    },
    {
      id: 'read-curves',
      type: 'choice',
      title: 'Read the shape',
      text: `
        Three training runs of that network, each with a different learning rate. No numbers this time, only shapes.

        **In which run was the learning rate too large?**
      `,
      shuffle: false,
      options: [
        { text: '', figure: picture(0.002, 'A training curve that falls smoothly and slowly and is still well above zero after 300 epochs.') },
        { text: '', figure: picture(0.02, 'A training curve that drops quickly at first and then levels off close to zero.') },
        { text: '', correct: true, figure: picture(0.2, 'A training curve that shoots straight off the top of the chart, comes back and then stays stuck at a high loss.') },
      ],
      explain: `
        Run **C**. Its loss leaves the chart at once, and when it comes back it is stuck far above the others:
        the huge early steps threw the weights somewhere bad.

        Run A is the opposite case: smooth, steady and much too slow. Run B drops fast and levels off: that is the shape to look for.
      `,
    },
    {
      id: 'validation',
      type: 'interact',
      attempts: 6,
      title: 'When to stop',
      text: `
        A low training loss is not the aim. The aim is to do well on plants the network has **not** trained on.

        So 12 more plants were kept aside: the **validation** data ([diamonds]{.orange}). *How AI Learns*
        called them fresh data. The network never trains on them. It is only scored on them, after every epoch.

        Slide the epoch marker and watch both curves, and the network's prediction on the right.
        **Put the marker where you would stop training.**
      `,
      widget: lab({
        rate: LAB.stop.rate, batch: 12, run: true, stop: true,
        alt: 'Training loss and validation loss against epochs. The training loss keeps falling. The validation loss falls, reaches a lowest point and climbs again. A slider moves a marker along the epochs, and a second panel shows the plants with the network’s curve at that epoch.',
      }),
      check: (s) => {
        if (s.valAt <= s.bestVal * 1.05) return true;
        if (s.epoch < s.bestEpoch) return `At epoch ${s.epoch} the validation loss is ${show(s.valAt)} and still falling. Stopping here would be too early: go further.`;
        return `At epoch ${s.epoch} the validation loss is ${show(s.valAt)}: it has been lower than that. The training loss is still falling here, but only because the network is bending towards its 12 training plants. Go back.`;
      },
      solution: { epoch: LAB.stop.bestEpoch },
      hints: ['Follow the dashed curve. Where is it lowest?'],
      explain: `
        The validation loss is lowest around epoch ${LAB.stop.bestEpoch}, at ${show(LAB.stop.bestVal)}. After that the training loss keeps falling,
        from ${show(LAB.stop.trainAtBest)} to ${show(LAB.stop.finalTrain)}, while the validation loss doubles to ${show(LAB.stop.finalVal)}. On the right you can see why:
        the curve starts to twist towards individual training plants.
      `,
    },
    {
      id: 'teach-early-stopping',
      type: 'info',
      title: 'Early stopping',
      text: `
        After its best epoch the network went on getting better at its 12 training plants and worse
        at the others. That widening gap is **overfitting**, the trouble *How AI Learns* showed with
        fresh data, caught here in the act.

        **Early stopping** is the remedy: save the weights as training goes, and keep those from the
        epoch with the lowest **validation** loss.

        :::example Weights saved every 100 epochs
        | epoch | training loss | validation loss |
        |:-:|:-:|:-:|
        | 100 | 0.50 | 0.55 |
        | 200 | 0.31 | 0.40 |
        | 300 | 0.20 | 0.47 |
        | 400 | 0.12 | 0.60 |

        Keep epoch **200**: its validation loss, 0.40, is the lowest. Epoch 400 has the lowest
        training loss, but that only measures the examples the network trained on.
        :::
      `,
    },
    {
      id: 'early-stop-gen',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const best = rng.int(2, 4);                       // index of the checkpoint with the lowest validation loss
        const epochs = [10, 20, 30, 40, 50, 60];
        const cents = (v) => (v / 100).toFixed(2);
        const train = [];
        let t = rng.int(88, 99);
        for (let i = 0; i < 6; i++) { train.push(t); t -= rng.int(8, 14); }
        const val = new Array(6).fill(0);
        val[best] = rng.int(38, 46);
        for (let i = best - 1; i >= 0; i--) val[i] = val[i + 1] + rng.int(6, 12);
        for (let i = best + 1; i < 6; i++) val[i] = val[i - 1] + rng.int(4, 9);
        const row = (name, values) => `| ${name} | ${values.map(cents).join(' | ')} |`;
        return {
          text: `
            A network's weights are saved every 10 epochs, together with both losses.
            The validation loss is measured on examples the network does not train on.

            | epoch | ${epochs.join(' | ')} |
            |---|:-:|:-:|:-:|:-:|:-:|:-:|
            ${row('training loss', train)}
            ${row('validation loss', val)}

            **Which epoch's weights should be kept?**
          `,
          answer: epochs[best],
          prefix: 'epoch',
          wrong: [
            [60, `Epoch 60 has the lowest training loss, but the validation loss has been rising since epoch ${epochs[best]}. From there on, the network is fitting quirks of its training examples.`],
          ],
          hints: ['The network will be used on data it has not seen. Which of the two rows measures that?'],
          explain: `The validation loss is lowest at epoch ${epochs[best]} (${cents(val[best])}). After that it rises to ${cents(val[5])} while the training loss keeps falling to ${cents(train[5])}: overfitting. Early stopping keeps the weights from epoch ${epochs[best]}.`,
        };
      },
    },
    {
      id: 'lab-schedule',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Fast start, calm finish',
      text: `
        One learning rate for the whole run is a compromise. A large rate is good at the start, when
        there is far to go. Near the bottom it keeps the weights bouncing about.

        Here the batch size is 4 and the rate 0.02. **Train once as it is. Then switch on “Halve the rate every 50 epochs” and train again.**
        Compare the second half of the two curves.
      `,
      widget: lab({
        rate: 0.02, batch: 4, decay: 'toggle', goal: LAB.goal, validation: false, fit: false,
        alt: 'A chart of training loss against epochs. A button switches a schedule on and off that halves the learning rate every 50 epochs.',
      }),
      check: (s) => {
        if (s.runs === 0) return 'Press “Train” first, with the schedule switched off.';
        if (!s.history.some((run) => !run.decay)) return 'Also train once with the schedule switched off, for comparison.';
        if (!s.history.some((run) => run.decay)) return 'Now press the button that halves the rate every 50 epochs, and train again.';
        return true;
      },
      solution: { runs: [{ decay: false }, { decay: true }] },
      explain: `
        Both runs dive under the goal equally fast: for the first 50 epochs they are the same run.
        With a constant rate the loss then goes on jumping up and down to the very end. With the rate
        halved again and again, the jumps die away and the curve settles.

        A plan for changing the learning rate during training is called a **schedule**. Large steps first,
        smaller ones later: almost every big training run uses some version of that.
      `,
    },
    {
      id: 'diagnose',
      type: 'bucket',
      review: true,
      text: 'A network is being trained, and something is not right. **Match each symptom to its most likely cause.**',
      buckets: ['Learning rate too small', 'Learning rate too large', 'Overfitting'],
      items: [
        { text: 'Both losses fall smoothly, and are still falling steadily when training ends', bucket: 0, why: 'Smooth and unfinished: the steps are in the right direction but too short. A larger rate (or more epochs) is needed.' },
        { text: 'After thousands of steps the weights have barely moved', bucket: 0, why: 'A step is the learning rate times the gradient. Steps this tiny mean the rate is too small.' },
        { text: 'In the first few epochs the training loss leaps far above where it started', bucket: 1, why: 'Leaping upwards means overshooting: each step lands higher on the far side of the valley.' },
        { text: 'The loss becomes too large to be a number, and training stops', bucket: 1, why: 'The loss has blown up: every step overshot by more than the one before.' },
        { text: 'Training loss keeps falling while validation loss climbs', bucket: 2, why: 'The network is still getting better at its training examples and worse at everything else: overfitting.' },
        { text: 'Training loss 0.02, validation loss 0.90', bucket: 2, why: 'A tiny loss on the training data and a large one on unseen data is the signature of overfitting.' },
        { text: 'The predictions pass through every training example and swing wildly in between', bucket: 2, why: 'The network has bent itself around the individual examples instead of following the pattern behind them.' },
      ],
      explain: 'Too small: smooth, slow, unfinished. Too large: leaps upwards, or blows up. Overfitting: the training loss looks excellent while the validation loss gets worse.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are true of training a network in practice?',
      options: [
        { text: 'A step on a small batch uses a rough estimate of the gradient, and costs far less than a step on the whole training set', correct: true },
        { text: 'An epoch is one pass through the whole training set', correct: true },
        { text: 'The weights to keep are those with the lowest validation loss, not the lowest training loss', correct: true },
        { text: 'The training loss going down proves the network is getting better at new examples', why: 'It only proves the network is getting better at its training examples. Once it overfits, the two part ways, and only the validation loss shows it.' },
        { text: 'The network should also be trained on the validation data, so that no examples are wasted', why: 'Then nothing unseen would be left to judge it by. The whole value of validation data is that the network never trains on them.' },
      ],
      explain: 'Small batches trade smooth steps for many cheap ones. An epoch is one pass through the data. And only data the network has not trained on can say when to stop.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend shows you a training run: “Look, the loss went down the whole time. It must be a good model.”

        **Which two questions would you ask before agreeing?**
      `,
      model: `
        First: *which* loss? A falling training loss only shows that the network fits the examples it was trained on.
        I would ask to see the validation loss, measured on examples kept out of training. If that one turned upwards
        while the training loss kept falling, the network was overfitting and should have been stopped earlier.

        Second: had the curve levelled off? If the loss was still falling steadily at the end, training was not finished:
        the learning rate may have been too small, or there were too few epochs.
      `,
    },
  ],
  recap: [
    'Networks are trained on **mini-batches**: each step averages the gradients of a few examples. The steps are rougher, and there are many more of them for the same work. One pass through the data is an **epoch**.',
    'The learning rate shows in the loss curve: too small is smooth and slow, too large leaps upwards or blows up. A **schedule** lowers the rate as training goes on.',
    '**Validation** data are never trained on. Training loss falling while validation loss rises is overfitting.',
    '**Early stopping**: keep the weights from the epoch with the lowest validation loss.',
  ],
  next: 'Next: all of this works on numbers. How do you feed a network words?',
};
