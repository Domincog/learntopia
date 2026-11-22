// Inside Neural Networks · Lesson 2 · Scoring a Guess
import { r, num } from '../../../kit.js';
import { show, roundTo, softmax, crossEntropy, AFTER_THE, AFTER_THE_SCORES } from '../helpers.js';

/** Powers of e as the lesson quotes them (2 decimals). */
const E_TABLE = [1, 2.72, 7.39, 20.09];
/** The table of powers, indented to match the text it is placed in. */
const table = (pad) => [
  '| Score | 0 | 1 | 2 | 3 |',
  '|---|:-:|:-:|:-:|:-:|',
  '| $e^{\\text{score}}$ | 1 | 2.72 | 7.39 | 20.09 |',
].join(`\n${' '.repeat(pad)}`);

const CLASS_SETS = [
  { what: 'A photo classifier', names: ['cat', 'dog', 'fox'] },
  { what: 'A weather model', names: ['rain', 'sun', 'snow'] },
  { what: 'An email sorter', names: ['spam', 'work', 'family'] },
  { what: 'A fruit sorter', names: ['ripe', 'unripe', 'rotten'] },
];

const LN2 = 0.693;

export default {
  id: 'scores-to-probabilities',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three scores, one photo',
      text: r`
        A network is given a photo and has to label it **cat**, **dog** or **fox**. Its last layer has
        one neuron for each answer, and each puts out a score (weights · inputs + bias, with no bend):

        | cat | dog | fox |
        |:-:|:-:|:-:|
        | 2 | 1 | −1 |

        We would rather have probabilities: positive numbers that add up to 1.
        **Which recipe would give sensible ones?**
      `,
      columns: 1,
      options: [
        { text: 'Divide each score by the sum of the three scores' },
        { text: 'Give 1 to the highest score and 0 to the others' },
        { text: 'Raise 2 to the power of each score, then divide each result by their total', correct: true },
      ],
      explain: r`
        Dividing by the sum, $2 + 1 - 1 = 2$, gives fox a "probability" of $-0.5$: nonsense.
        All-or-nothing throws away the fact that dog was not far behind.

        Powers fix both problems. A power of 2 is always positive, even for a negative score
        ($2^{-1} = 0.5$), and a higher score always gives a larger number.
      `,
    },
    {
      id: 'teach-recipe',
      type: 'info',
      title: 'From scores to shares',
      text: r`
        Here is that recipe at work. A **probability** must be positive, and the probabilities of
        all the possible answers must add up to 1. From any list of scores, three steps get there.

        :::example Scores: rain 2, sun 2, snow 1
        1. Raise 2 to the power of each score: $\;2^2 = 4$, $\;2^2 = 4$, $\;2^1 = 2$.
        2. Add them up: $\;4 + 4 + 2 = 10$.
        3. Divide each by the total: $\;\frac{4}{10} = 0.4$, $\;\frac{4}{10} = 0.4$, $\;\frac{2}{10} = 0.2$.
        :::

        The three shares are positive and add up to 1. The picture shows the same working, one row for each answer.
        A negative score is no trouble: $2^{-1} = 0.5$, small but still positive.
      `,
      figure: {
        type: 'softmax-bars', classes: ['rain', 'sun', 'snow'], scores: [2, 2, 1], base: 2, static: true,
        alt: 'Three rows, for rain, sun and snow. Rain: score 2, 2 to that power is 4, share 0.4. Sun: score 2, power 4, share 0.4. Snow: score 1, power 2, share 0.2.',
      },
    },
    {
      id: 'by-hand',
      type: 'fill',
      title: 'Do one by hand',
      text: r`
        Your turn, with friendlier scores for the photo: **cat 2, dog 1, fox 1**.

        Step one: raise 2 to the power of each score. Step two: divide each result by the total.
      `,
      template: r`
        | | cat | dog | fox | total |
        |---|:-:|:-:|:-:|:-:|
        | score | 2 | 1 | 1 | |
        | $2^{\text{score}}$ | [[4]] | [[2]] | [[2]] | [[8]] |
        | share of the total | [[0.5]] | [[0.25]] | [[0.25]] | 1 |
      `,
      hints: [r`$2^2 = 4$ and $2^1 = 2$.`, 'A share is that number divided by the total: 4 out of 8, for instance.'],
      explain: r`
        $2^2 = 4$, $2^1 = 2$, $2^1 = 2$: a total of 8. The shares are $\frac{4}{8}$, $\frac{2}{8}$ and $\frac{2}{8}$:
        **0.5, 0.25 and 0.25**. All positive, and they add up to 1.
      `,
    },
    {
      id: 'eighty',
      type: 'interact',
      attempts: 6,
      title: 'Aim for 0.8',
      text: `
        The same recipe, live. Each row shows a score, 2 to that power, and its share of the total.

        **Set the three scores so that “cat” gets a probability of exactly 0.8.**
      `,
      widget: {
        type: 'softmax-bars', classes: ['cat', 'dog', 'fox'], scores: [2, 1, 1], base: 2, sliders: [0, 1, 2], range: { min: -3, max: 5, step: 1 },
        alt: 'Three rows, for cat, dog and fox. Each shows its score, 2 to the power of the score, and a bar for its share of the total.',
      },
      check: (s) => {
        const p = s.probs[0];
        if (Math.abs(p - 0.8) < 1e-9) return true;
        if (s.scores[1] !== s.scores[2]) return `Cat has ${show(p, 3)}. With different scores for dog and fox, no whole-number score for cat lands exactly on 0.8. Give dog and fox the same score first.`;
        return p < 0.8
          ? `Cat has ${show(p, 3)}: not enough. Widen the gap between cat's score and the other two.`
          : `Cat has ${show(p, 3)}: too much. Narrow the gap between cat's score and the other two.`;
      },
      solution: { scores: [3, 0, 0] },
      hints: [
        '0.8 is 8 out of 10. Which powers of 2 could give 8 for cat and 2 for the other two together?',
        'Dog and fox need 1 each: that is a score of 0. Cat needs 8: a score of 3.',
      ],
      explain: r`
        Scores 3, 0, 0 give $8, 1, 1$: cat has $\frac{8}{10}$. But so do 4, 1, 1 (that is $\frac{16}{20}$) and
        2, −1, −1.

        Whichever you found, cat's score is **3 above** the others. Only the gaps between the scores
        matter, not the scores themselves.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Softmax',
      text: r`
        This recipe is called **softmax**: "soft", because the winner does not take everything. It
        just gets the most. Real networks use one different ingredient: instead of 2 they raise the
        number $e \approx 2.718$ to each score. (That choice makes the slopes that training needs
        come out simplest. Everything you have seen works the same way.)

        $$ \text{probability} = \frac{e^{\text{score}}}{\text{total}} $$

        where the total adds up $e^{\text{score}}$ over all the classes.

        :::example Two classes, with scores 1 and 0
        $e^1 \approx 2.72$ and $e^0 = 1$, so the total is 3.72. The probabilities are
        $2.72 \div 3.72 \approx 0.73$ and $1 \div 3.72 \approx 0.27$.
        :::

        :::key
        Softmax turns any list of scores into probabilities: all positive, adding up to 1, the
        highest score getting the largest share. Only the **gaps** between the scores matter:
        3, 0, 0 and 4, 1, 1 give the same shares.
        :::
      `,
    },
    {
      id: 'with-e',
      type: 'fill',
      title: 'The same with e',
      text: r`
        Now the real thing. The scores are **cat 2, dog 1, fox 0**, and here are the powers of $e$
        you need, rounded to 2 decimal places:

        ${table(8)}

        **Fill in the total and the three probabilities, to 2 decimal places.**
      `,
      template: r`
        Total: $7.39 + 2.72 + 1 =$ [[11.11]]

        cat: [[0.67]] $\quad$ dog: [[0.24]] $\quad$ fox: [[0.09]]
      `,
      tolerance: 0.006,
      hints: ['Each probability is that class’s power of e divided by the total: for cat, 7.39 ÷ 11.11.'],
      explain: r`
        The total is $11.11$. Then $7.39 \div 11.11 \approx 0.67$, $\;2.72 \div 11.11 \approx 0.24$ and
        $1 \div 11.11 \approx 0.09$.

        With base 2 these scores would have given 0.57, 0.29 and 0.14. The larger base spreads the
        same scores further apart.
      `,
    },
    {
      id: 'softmax-gen',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const set = rng.pick(CLASS_SETS);
        let scores;
        do { scores = [rng.int(0, 3), rng.int(0, 3), rng.int(0, 3)]; } while (new Set(scores).size === 1);
        const which = rng.int(0, 2);
        const powers = scores.map((v) => E_TABLE[v]);
        const total = roundTo(powers.reduce((t, v) => t + v, 0), 2);
        const answer = roundTo(softmax(scores)[which], 2);
        const sumScores = scores[0] + scores[1] + scores[2];
        const slips = [
          [roundTo(scores[which] / sumScores, 2), 'That divides the raw scores. Raise $e$ to each score first (the table does it for you), then take the share of the total.'],
          [0.33, 'The three classes are not equally likely: their scores differ.'],
        ].filter(([v]) => Math.abs(v - answer) > 0.025);
        return {
          text: r`
            ${set.what} gives these scores:

            | ${set.names.join(' | ')} |
            |:-:|:-:|:-:|
            | ${scores.join(' | ')} |

            Softmax turns them into probabilities. Powers of $e$, to 2 decimal places:

            ${table(12)}

            **What is the probability of “${set.names[which]}”?** Give 2 decimal places.
          `,
          answer,
          tolerance: 0.01,
          wrong: slips,
          hints: [
            `Look up $e^{\\text{score}}$ for all three scores and add them: that is the total.`,
            r`The total is $${powers.map((v) => num(v)).join(' + ')} = ${num(total)}$. Now divide the number for “${set.names[which]}” by it.`,
          ],
          explain: r`The powers are $${powers.map((v) => num(v)).join(',\ ')}$, with a total of $${num(total)}$. So the probability of “${set.names[which]}” is $${num(powers[which])} \div ${num(total)} \approx ${num(answer)}$.`,
        };
      },
    },
    {
      id: 'shift',
      type: 'choice',
      gen: (rng) => {
        const scores = rng.shuffle(rng.pick([[3, 1, 0], [4, 2, 1], [2, 0, -1], [5, 2, 2], [1, 0, -2]]));
        const up = rng.bool();
        const k = rng.pick([2, 3, 5, 10]);
        const after = scores.map((v) => (up ? v + k : v - k));
        return {
          title: 'Raise them all',
          text: `
            A classifier's scores for three classes are **${scores.map((v) => show(v)).join(', ')}**.

            Then a change inside the network ${up ? 'adds' : 'takes'} ${k} ${up ? 'to' : 'from'} **every** score: they become ${after.map((v) => show(v)).join(', ')}.

            **What happens to the three probabilities?**
          `,
          options: [
            { text: 'Nothing: they stay exactly as they were', correct: true },
            { text: up ? 'All three go up' : 'All three go down', why: 'They cannot all move the same way: the three probabilities always add up to 1.' },
            { text: 'The largest one grows and the others shrink', why: 'That is what happens when the gaps between the scores widen. Here every gap is the same as before.' },
            { text: 'They move closer to one third each', why: 'That is what happens when the gaps between the scores shrink. Here every gap is the same as before.' },
          ],
          hints: ['Softmax only cares about the gaps between the scores. Have any gaps changed?'],
          explain: r`
            ${up ? 'Adding' : 'Taking away'} ${k} ${up ? 'multiplies' : 'divides'} every power by the same number, $e^{${k}}$. It appears in each
            numerator and in the total, so it cancels.

            Softmax listens to the **differences** between scores. A score of ${show(after[0])} means nothing by itself.
          `,
        };
      },
    },
    {
      id: 'temperature',
      type: 'interact',
      attempts: 6,
      title: 'Turn the temperature',
      text: `
        Adding to every score does nothing. **Dividing** every score by the same number does a great deal.
        That number is called the **temperature**, $T$.

        These are scores for the word after “the” in the toy language model of *How AI Learns*.
        At $T = 1$ you get the familiar chances: cat 0.4, dog 0.3, mat 0.2, rug 0.1.

        Slide $T$ right down and watch “cat”. Then **find a temperature at which “rug” gets at least 0.2.**
      `,
      widget: {
        type: 'softmax-bars', classes: AFTER_THE.map(([word]) => word), scores: AFTER_THE_SCORES, base: 'e',
        temperature: { min: 0.2, max: 5, step: 0.2, value: 1 },
        alt: 'Four rows, for the words cat, dog, mat and rug. Each shows its score divided by the temperature, e to that power, and a bar for its share. A slider sets the temperature.',
      },
      check: (s) => {
        const rug = s.probs[3];
        // judged on the two decimals the bars show, so that a displayed "0.2" is never refused
        if (Math.round(rug * 100) >= 20) return true;
        if (s.temperature < 1) return `At a temperature of ${show(s.temperature)}, “rug” is down to ${show(rug, 3)}: low temperatures favour the front-runner. Go the other way, above 1.`;
        return `At a temperature of ${show(s.temperature)}, “rug” has ${show(rug, 3)}. Higher temperatures even things out more: keep going.`;
      },
      solution: { temperature: 4 },
      hints: ['A temperature above 1 shrinks every score, and so every gap between scores. Smaller gaps mean more even shares.'],
      explain: r`
        At $T = 4$ “rug” is up to 0.2, and with ever higher temperatures all four head for 0.25.
        At $T = 0.2$ “cat” takes 0.79, and as $T$ approaches 0 it takes everything.

        Through all of it, the order of the four words never changed.
      `,
    },
    {
      id: 'teach-temperature',
      type: 'info',
      title: 'What the temperature does',
      text: r`
        Softmax listens to the gaps between the scores, and dividing every score by $T$ changes every gap.

        :::example Two scores, 4 and 2, worked with powers of 2
        | $T$ | scores ÷ $T$ | powers | shares |
        |:-:|:-:|:-:|:-:|
        | 1 | 4, 2 | 16, 4 | 0.8, 0.2 |
        | 2 | 2, 1 | 4, 2 | 0.67, 0.33 |
        | 0.5 | 8, 4 | 256, 16 | 0.94, 0.06 |
        :::

        - **Above 1** the gaps shrink, so the shares even out.
        - **Below 1** the gaps stretch, so the leader pulls further ahead.
        - Dividing by a positive number never changes which score is highest.

        This is the “randomness” slider of *How AI Learns*, and the temperature setting of a
        chatbot: **one number that divides the scores before softmax**.
      `,
    },
    {
      id: 'temperature-effects',
      type: 'fill',
      review: true,
      text: `
        A language model divides every score by a temperature before softmax turns the scores into probabilities.

        **Complete the three statements.**
      `,
      template: `
        A temperature **above 1** makes the probabilities [[*more even|more lopsided|exactly as before]].

        A temperature **below 1** makes them [[more even|*more lopsided|exactly as before]].

        Whatever the temperature, the most likely token [[*stays the most likely|can be overtaken]].
      `,
      explain: 'Softmax responds to the gaps between scores. Dividing by a number above 1 shrinks every gap, so the shares even out. Dividing by a number below 1 stretches every gap, so the leader pulls further ahead. Dividing by a positive number never changes which score is highest.',
    },
    {
      id: 'loss-explore',
      type: 'interact',
      attempts: 6,
      title: 'How wrong was that?',
      text: r`
        To train a network you need **one number** that says how bad a prediction was.

        This photo really is a cat. Under the bars is the usual measure, the **loss**: it looks only
        at the probability the network gave to the right answer.

        First make the loss smaller than 0.1. Then do the opposite:
        **make the network confidently wrong, with a loss above 5.**
      `,
      widget: {
        type: 'softmax-bars', classes: ['cat', 'dog', 'fox'], scores: [0, 0, 0], base: 'e', sliders: [0, 1], range: { min: -4, max: 6, step: 0.5 }, target: 0,
        alt: 'Three rows for cat, dog and fox, with cat marked as the right answer. Sliders set the scores for cat and dog, and the loss is shown under the bars.',
      },
      check: (s) => {
        if (s.loss > 5) return true;
        if (s.loss < 0.1) return `That is the confident-and-right corner: a loss of only ${show(s.loss)}. Now the opposite: push a wrong answer's score far above cat's.`;
        return `The loss is ${show(s.loss)}: cat still has a probability of ${show(s.probs[0], 4)}. For a loss above 5 that has to fall below 0.0067. Lower cat's score and raise dog's.`;
      },
      solution: { scores: [-4, 6, 0] },
      hints: ['The loss only looks at cat’s share. To make it tiny, the other shares have to swallow nearly everything.'],
      explain: r`
        With three equal scores, cat gets $\frac{1}{3}$ and the loss is about 1.1. Confident and right:
        close to 0. Confident and **wrong**: 5, 8, 10… there is no upper limit.

        The loss does not just count mistakes. It asks **how much probability the right answer got**,
        and it comes down hard on a network that put nearly all of it on a wrong one.
      `,
    },
    {
      id: 'loss-name',
      type: 'info',
      title: 'Cross-entropy',
      text: r`
        The measure is called **cross-entropy loss**:

        $$ \text{loss} = -\ln(p) $$

        Here $p$ is the probability given to the right answer, and $\ln$ is the **natural
        logarithm**: $\ln(p)$ answers "to what power must $e$ be raised to give $p$?" For a
        probability below 1 that power is negative, and the minus sign makes the loss positive.

        Drag the point. A probability of 1 costs **0**, a probability of 0.5 costs **0.69**, and
        every further halving costs another 0.69.

        :::example A probability of 1/64, about 0.016
        $1 \to \frac{1}{2} \to \frac{1}{4} \to \frac{1}{8} \to \frac{1}{16} \to \frac{1}{32} \to \frac{1}{64}$
        is six halvings, so the loss is $6 \times 0.693 \approx 4.16$.
        :::

        This is the "error" in the training loop of *How AI Learns*: "the lower its chance, the
        bigger the error".
      `,
      figure: {
        type: 'plot', x: [0, 1], y: [0, 5], xStep: 0.25, yStep: 1, xLabel: 'probability of the right answer', yLabel: 'loss',
        fns: [{ expr: '-ln(x)', color: 'green', from: 0.004, to: 1 }],
        points: [{ id: 'P', x: 0.5, on: 0, drag: 'x', snap: 0.01, color: 'orange' }],
        readouts: [{ label: 'probability', expr: 'Px', digits: 2 }, { label: 'loss', expr: 'f0(Px)', digits: 2, color: 'green' }],
        alt: 'The loss plotted against the probability given to the right answer. It is zero at a probability of 1 and climbs ever more steeply as the probability approaches zero. A point can be dragged along the curve.',
      },
    },
    {
      id: 'loss-halving',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.int(2, 5);
        const p = 1 / 2 ** k;
        const answer = roundTo(crossEntropy(p), 2);
        const scene = rng.pick([
          'A network that reads handwritten digits is shown a 7.',
          'A language model is shown a sentence with its last word hidden.',
          'A network that sorts photos is shown a picture of a fox.',
        ]);
        return {
          text: r`
            ${scene} It gives the right answer a probability of **${num(p, 5)}**.

            The cross-entropy loss for a probability of 0.5 is $-\ln(0.5) \approx ${LN2}$, and each
            further halving of the probability adds another ${LN2}.

            **What is the loss here?** Give 2 decimal places.
          `,
          answer,
          tolerance: 0.03,
          wrong: [
            [roundTo(1 - p, 2), 'That is the probability it gave to all the wrong answers together. The loss is minus the natural logarithm of the probability of the right one.'],
            [roundTo((k - 1) * LN2, 2), `Count the halvings from 1, not from 0.5: 1 → 0.5 is the first of ${k}.`],
          ],
          hints: [
            `How many times must 1 be halved to reach ${num(p, 5)}?`,
            r`$${num(p, 5)} = 1 \div 2^{${k}}$: that is ${k} halvings, so the loss is $${k} \times ${LN2}$.`,
          ],
          explain: r`$${num(p, 5)}$ is 1 halved ${k} times. Each halving adds ${LN2}, so the loss is $${k} \times ${LN2} \approx ${num(answer)}$. (Directly: $-\ln(${num(p, 5)}) = ${num(crossEntropy(p), 3)}$.)`,
        };
      },
    },
    {
      id: 'why-not-squared',
      stretch: true,
      type: 'choice',
      title: 'Why not squared error?',
      text: r`
        The delivery-time model was trained on **squared error**: the miss, squared. For a
        classifier the miss would be $1 - p$, where $p$ is the probability given to the right answer.

        | $p$ | squared error $(1 - p)^2$ | cross-entropy $-\ln p$ |
        |:-:|:-:|:-:|
        | 0.5 | 0.25 | 0.69 |
        | 0.1 | 0.81 | 2.30 |
        | 0.001 | 0.998 | 6.91 |

        **What do the last two rows show?**
      `,
      columns: 1,
      options: [
        { text: 'Squared error hardly tells “wrong” from “confidently, badly wrong”. Cross-entropy charges three times as much for the second', correct: true },
        { text: 'The two measures always agree on which prediction is worse, so it makes no difference which one is used', why: 'They do agree on the order. But training follows the size of the loss and its slope, and those differ a great deal: 0.81 against 0.998, and 2.30 against 6.91.' },
        { text: 'Squared error punishes confident mistakes harder, because it squares them', why: 'Look at the last row: the squared error is stuck just below 1, its ceiling. Cross-entropy has reached 6.91 and keeps climbing.' },
      ],
      explain: r`
        Squared error on a probability can never exceed 1, so, plotted against the scores, its curve goes flat exactly where the
        network is most wrong, and a flat curve gives gradient descent almost no slope to follow.
        Cross-entropy has no ceiling: the worse the mistake, the stronger the push.

        That, in one sentence, is why classifiers and language models are trained with
        cross-entropy and not with squared error.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'A network with a softmax output is trained with cross-entropy loss. **Which statements are true?**',
      options: [
        { text: 'The probabilities it puts out are all positive and add up to 1', correct: true },
        { text: 'Adding the same number to every score leaves the probabilities unchanged', correct: true },
        { text: 'The loss for one example depends only on the probability given to the right answer', correct: true },
        { text: 'A negative score gives a negative probability', why: 'e raised to a negative power is small but still positive: e⁻¹ is about 0.37.' },
        { text: 'The loss can never be larger than 1', why: 'That is squared error on a probability. Cross-entropy is −ln(p), which grows without limit as p approaches 0.' },
      ],
      explain: 'Softmax: raise e to each score and take shares, so everything is positive and sums to 1, and only the gaps between scores count. Cross-entropy: minus the natural logarithm of the right answer’s share, from 0 (certain and right) upwards without limit.',
    },
  ],
  recap: [
    '**Softmax** turns scores into probabilities: raise e to each score, then divide by the total. The results are positive and add up to 1.',
    'Only the gaps between scores matter. Adding the same amount to every score changes nothing.',
    'Dividing the scores by a **temperature** evens the probabilities out (above 1) or sharpens them (below 1).',
    '**Cross-entropy loss** is −ln(probability of the right answer): near 0 when confident and right, large without limit when confident and wrong.',
  ],
  next: 'Next: the loss is one number at the far end of the network. How does every weight find out which way to move?',
};
