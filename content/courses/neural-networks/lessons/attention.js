// Inside Neural Networks · Lesson 6 · What to Look At
import { r, num } from '../../../kit.js';
import { show, pair, roundTo, dot, softmax, THE, RIVER, MONEY, BANK, attention, attentionFigure } from '../helpers.js';

const vecTex = (v) => r`\begin{pmatrix} ${num(v[0])} \\ ${num(v[1])} \end{pmatrix}`;

// "the river bank", worked by hand with powers of 2
const TOKENS = [THE, RIVER, BANK];
const VECS = TOKENS.map((t) => t.v);
const HAND = attention(VECS, 2);            // scores [1, 2, 2] for bank, weights [0.2, 0.4, 0.4], new bank (0.5, 1.3)
const BANK_SCORES = HAND.scores[2];
const BANK_WEIGHTS = HAND.weights[2];
const BANK_NEW = HAND.out[2].map((v) => roundTo(v, 4));
// the same with real softmax (base e), and with "money" in place of "river"
const REAL_RIVER = attention(VECS).out[2];
const REAL_MONEY = attention([THE.v, MONEY.v, BANK.v]).out[2];
const REAL_WEIGHTS = attention(VECS).weights[2];

const AXES = ['money', 'water'];
const bankFigure = (extra = {}) => attentionFigure(TOKENS, { axes: AXES, window: { x: [-0.5, 2.5], y: [-0.5, 2.5] }, focus: 2, ...extra });

// the worked example on the first teaching screen: two tokens, powers of 2
const EX_IT = { text: 'it', v: [1, 0] };
const EX_TROPHY = { text: 'trophy', v: [3, 1] };   // scores 1 and 3, weights 0.2 and 0.8, new "it" (2.6, 0.8): the course test re-derives them

// "dog … ball … it": the learner steers "it"
const DOG = { text: 'dog', v: [2, 0] };
const BALL = { text: 'ball', v: [0, 2] };
const IT = { text: 'it', v: [1, 1] };

/** Vectors whose dot product with (1, 1) is 0, 1, 2 or 3. */
const BY_SCORE = {
  0: [[1, -1], [-1, 1], [2, -2]],
  1: [[1, 0], [0, 1], [2, -1], [-1, 2]],
  2: [[1, 1], [2, 0], [0, 2], [3, -1]],
  3: [[2, 1], [1, 2], [3, 0], [0, 3]],
};
/** Score triples for which powers of 2 give weights with at most two decimals. */
const CLEAN_SCORES = [[1, 1, 2], [0, 0, 1], [1, 2, 2], [0, 1, 1], [2, 2, 3], [0, 0, 3]];
const SENTENCES = [['she', 'fed', 'ducks'], ['rain', 'fell', 'fast'], ['old', 'stone', 'bridge'], ['we', 'sold', 'apples']];

export default {
  id: 'attention',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'What is “it”?',
      text: `
        Read this once, at normal speed:

        > The trophy did not fit in the suitcase because **it** was too big.

        **What was too big?**
      `,
      shuffle: false,
      options: [
        { text: 'The trophy', correct: true },
        { text: 'The suitcase' },
      ],
      explain: `
        The trophy. Now change one word: “… because it was too **small**.” Suddenly “it” is the suitcase.

        You settled what “it” meant by looking at the other words. The last lesson gave every token one fixed
        vector, the same in every sentence. On its own, that cannot work: “it” needs to pick up something
        from “trophy” or from “suitcase”, depending on the rest. The mechanism that lets it do so is called **attention**.
      `,
    },
    {
      id: 'teach-three-steps',
      type: 'info',
      title: 'Score, weigh, mix',
      text: r`
        Attention gives a token a new vector that depends on the tokens around it. It takes three
        steps, and you know the tools for all of them.

        :::example Two tokens with made-up vectors: it = (1, 0), trophy = (3, 1)
        1. **Score.** "it" scores every token, itself included, by a dot product with its own vector: it · it $= 1$ and it · trophy $= 1 \times 3 + 0 \times 1 = 3$.
        2. **Weigh.** Softmax turns the scores into weights that add up to 1. With powers of 2: $\;2^1 = 2$ and $2^3 = 8$, total 10. Weights: 0.2 and 0.8.
        3. **Mix.** The new vector is the weighted average: $\;0.2 \times (1, 0) + 0.8 \times (3, 1) = (2.6,\ 0.8)$.
        :::

        "it" went in as $(1, 0)$ and comes out as $(2.6, 0.8)$, the dashed arrow: mostly "trophy".
      `,
      figure: attentionFigure([EX_IT, EX_TROPHY], {
        base: 2, focus: 0, static: true, window: { x: [-0.5, 3.5], y: [-1, 2] },
        alt: 'Arrows for two tokens: it, along the axis to (1, 0), and trophy, to (3, 1). A dashed arrow to (2.6, 0.8), close to trophy, is the new vector of it. A grid shows the weights: it gives 0.2 to itself and 0.8 to trophy; trophy gives 0.01 to it and 0.99 to itself.',
      }),
    },
    {
      id: 'scores',
      type: 'fill',
      title: 'Step 1: score',
      text: r`
        Your turn, with a smaller puzzle: *bank*. In "the river bank" it is land beside water. In
        "the money bank" it is a business.

        Three tokens with hand-made vectors. Across: how much a word has to do with **money**.
        Up: how much with **water**. "bank" starts out undecided, halfway between.

        **First, "bank" scores every token, itself included, by a dot product with its own vector** $${vecTex(BANK.v)}.$
      `,
      figure: {
        type: 'vector-plane', x: [-1, 3], y: [-1, 3], static: true, line: false, xLabel: 'money', yLabel: 'water',
        vectors: [
          { id: 'r', x: RIVER.v[0], y: RIVER.v[1], color: 'orange', label: 'river' },
          { id: 'b', x: BANK.v[0], y: BANK.v[1], color: 'teal', label: 'bank' },
          { id: 't', x: THE.v[0], y: THE.v[1], color: 'blue', label: 'the' },
        ],
        alt: 'Three arrows from the origin on axes named money and water: the, a short arrow to (0.5, 0.5); river, straight up to (0, 2); and bank, to (1, 1).',
      },
      template: r`
        bank · the $= 1 \times 0.5 + 1 \times 0.5 =$ [[${BANK_SCORES[0]}]]

        bank · river $= 1 \times 0 + 1 \times 2 =$ [[${BANK_SCORES[1]}]]

        bank · bank $= 1 \times 1 + 1 \times 1 =$ [[${BANK_SCORES[2]}]]
      `,
      explain: `
        The scores are ${BANK_SCORES.join(', ')}. A dot product measures how much two vectors agree, and it grows with their lengths too.
        Here the long arrow of “river” scores as high as “bank” itself, and the short arrow of “the” scores lower.
      `,
    },
    {
      id: 'weights',
      type: 'fill',
      title: 'Step 2: weigh',
      text: r`
        Scores of ${BANK_SCORES.join(', ')} for *the*, *river* and *bank*. Next they are turned into
        **weights** that add up to 1. You know the tool: softmax.

        By hand, use powers of 2 as in "Scoring a Guess": raise 2 to each score, then take each share of the total.
      `,
      template: r`
        | | the | river | bank | total |
        |---|:-:|:-:|:-:|:-:|
        | score | ${BANK_SCORES[0]} | ${BANK_SCORES[1]} | ${BANK_SCORES[2]} | |
        | $2^{\text{score}}$ | [[2]] | [[4]] | [[4]] | [[10]] |
        | weight | [[${BANK_WEIGHTS[0]}]] | [[${BANK_WEIGHTS[1]}]] | [[${BANK_WEIGHTS[2]}]] | 1 |
      `,
      hints: ['A weight is that token’s power of 2 divided by the total: 2 out of 10, for instance.'],
      explain: r`
        $2^1 = 2$, $2^2 = 4$, $2^2 = 4$: a total of 10. So the weights are **${BANK_WEIGHTS.join(', ')}**.

        These weights say how much of each token "bank" is going to take in.
      `,
    },
    {
      id: 'average',
      type: 'fill',
      title: 'Step 3: mix',
      text: r`
        Last step. The new vector for "bank" is the **weighted average** of all three vectors:

        $$ ${num(BANK_WEIGHTS[0])}\,${vecTex(THE.v)} + ${num(BANK_WEIGHTS[1])}\,${vecTex(RIVER.v)} + ${num(BANK_WEIGHTS[2])}\,${vecTex(BANK.v)} $$

        **Work out its two numbers.**
      `,
      template: r`
        Money: $0.2 \times 0.5 + 0.4 \times 0 + 0.4 \times 1 =$ [[${BANK_NEW[0]}]]

        Water: $0.2 \times 0.5 + 0.4 \times 2 + 0.4 \times 1 =$ [[${BANK_NEW[1]}]]
      `,
      tolerance: 0.001,
      explain: `
        Money: 0.1 + 0 + 0.4 = ${show(BANK_NEW[0])}. Water: 0.1 + 0.8 + 0.4 = ${show(BANK_NEW[1])}.

        “bank” went in as ${pair(BANK.v)} and comes out as ${pair(BANK_NEW)}: less money, more water.
        It has taken in something of “river”. The new vector no longer stands for the word alone, but for **the word in this sentence**.
      `,
    },
    {
      id: 'swap',
      type: 'interact',
      graded: false,
      title: 'Change the company it keeps',
      text: `
        Here the same three steps are done for every token at once, with real softmax (base e instead of 2).
        The grid shows the weights: each **row** is a token looking, each **column** a token being looked at.
        The dashed arrow is the new vector of the row in the dark frame.

        **Swap “river” for “money” and watch what becomes of “bank”.** Swap back and forth a few times.
      `,
      widget: bankFigure({
        swap: { index: 1, options: [RIVER, MONEY] },
        alt: 'On the left, arrows for the tokens the, river and bank, and a dashed arrow for the new vector of bank. On the right, a three by three grid of attention weights.',
      }),
      check: (s) => s.seen.length >= 2 || 'Press the swap button under the picture.',
      solution: { option: 1, seen: [0, 1] },
      explain: `
        Next to “river”, the new “bank” is ${pair(REAL_RIVER)}: mostly water. Next to “money” it is ${pair(REAL_MONEY)}: mostly money.

        Same token, same starting vector, different neighbours, different result.
        (With base e the weights for “bank” are ${REAL_WEIGHTS.map((w) => show(w)).join(', ')} instead of your ${BANK_WEIGHTS.join(', ')}: a little sharper, the same idea.)
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Attention',
      text: `
        That is one step of **attention** (in full: *self-attention*, because the tokens of a text attend to one another).

        1. **Score.** Each token scores every token by a dot product of their vectors.
        2. **Weigh.** Softmax turns each token's scores into weights that add up to 1.
        3. **Mix.** The token's new vector is the weighted average of all the vectors.

        :::key
        Attention lets every token take in information from the others, and most from those that match it best.
        :::

        Nothing in it is new to you: dot products from *Linear Algebra*, softmax from "Scoring a Guess",
        and an average. And all of it has slopes, so backpropagation can pass gradients straight through it.
      `,
    },
    {
      id: 'mix-gen',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const weights = rng.shuffle(rng.pick([[0.5, 0.25, 0.25], [0.6, 0.2, 0.2], [0.1, 0.2, 0.7], [0.5, 0.3, 0.2], [0.1, 0.3, 0.6]]));
        const names = rng.pick(SENTENCES);
        let vectors;
        let answer;
        let plain;
        const k = rng.int(0, 1);
        do {
          vectors = names.map(() => [rng.int(-2, 4), rng.int(-2, 4)]);
          answer = roundTo(weights.reduce((t, w, j) => t + w * vectors[j][k], 0), 4);
          plain = roundTo((vectors[0][k] + vectors[1][k] + vectors[2][k]) / 3, 4);
        } while (new Set(vectors.map((v) => v[k])).size < 3 || Math.abs(plain - answer) < 0.01);
        const who = rng.int(0, 2);
        const favourite = weights.indexOf(Math.max(...weights));
        const sum = weights.map((w, j) => `${num(w)} \\times ${vectors[j][k] < 0 ? `(${num(vectors[j][k])})` : num(vectors[j][k])}`).join(' + ');
        return {
          text: r`
            Three tokens have these vectors:

            | ${names.join(' | ')} |
            |:-:|:-:|:-:|
            | ${vectors.map((v) => `$${vecTex(v)}$`).join(' | ')} |

            In one step of attention, the token "${names[who]}" gives them the weights **${weights.map((w) => num(w)).join(', ')}**, in that order.
            Its new vector is the weighted average of the three vectors.

            **What is the ${k === 0 ? 'top' : 'bottom'} number of the new vector for "${names[who]}"?**
          `,
          answer,
          tolerance: 0.001,
          wrong: [
            [plain, 'That is the plain average. The three tokens do not count equally: multiply each number by its weight, then add.'],
            [vectors[favourite][k], `That is the number of “${names[favourite]}” alone, the token with the largest weight. The new vector is a blend of all three.`],
          ],
          hints: [`Take the ${k === 0 ? 'top' : 'bottom'} number of each vector, multiply it by that token’s weight, and add the three results.`],
          explain: r`The weighted average of the ${k === 0 ? 'top' : 'bottom'} numbers: $${sum} = ${num(answer)}$.`,
        };
      },
    },
    {
      id: 'weight-gen',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scores = rng.shuffle(rng.pick(CLEAN_SCORES));
        const names = rng.pick(SENTENCES);
        const vectors = scores.map((sc) => rng.pick(BY_SCORE[sc]));
        const who = rng.int(0, 2);
        const powers = scores.map((sc) => 2 ** sc);
        const total = powers.reduce((t, v) => t + v, 0);
        const answer = powers[who] / total;
        const slips = [
          [scores[who] / (scores[0] + scores[1] + scores[2]), 'That is the share of the raw scores. Softmax comes first: raise 2 to the power of each score, then take the share.'],
          [powers[who], `That is 2 to the power of the score. Divide it by the total of all three powers, ${total}.`],
        ].filter(([v]) => Number.isFinite(v) && Math.abs(v - answer) > 0.003);
        return {
          text: r`
            A token with the vector $${vecTex([1, 1])}$ looks at three tokens:

            | ${names.join(' | ')} |
            |:-:|:-:|:-:|
            | ${vectors.map((v) => `$${vecTex(v)}$`).join(' | ')} |

            It scores each by a dot product, and turns the scores into weights with softmax. Use **powers of 2**:
            raise 2 to each score, then take each share of the total.

            **What weight does it give to "${names[who]}"?**
          `,
          answer,
          tolerance: 0.001,
          wrong: slips,
          hints: [
            r`The scores are the dot products with $${vecTex([1, 1])}$: add the two numbers of each vector. They are ${scores.join(', ')}.`,
            r`The powers of 2 are ${powers.join(', ')}, with a total of ${total}.`,
          ],
          explain: r`Scores: ${scores.join(', ')}. Powers of 2: ${powers.join(', ')}, total ${total}. So "${names[who]}" gets $${powers[who]} \div ${total} = ${num(answer)}$.`,
        };
      },
    },
    {
      id: 'steer',
      stretch: true,
      type: 'interact',
      attempts: 8,
      title: 'Steer it',
      text: `
        > The **dog** dropped the **ball** because **it** was tired.

        Three of its tokens, with made-up vectors. At the moment “it” spreads its weight evenly: one third each.
        In a real model, training would move these vectors. Here, you do it.

        **Drag the arrow for “it” until “it” gives at least 0.6 of its weight to “dog”.**
      `,
      widget: attentionFigure([DOG, BALL, IT], {
        drag: [2], focus: 2, snap: 0.5, range: 3, window: { x: [-1, 3], y: [-2, 3] },
        alt: 'Arrows for the tokens dog, ball and it; the arrow for it can be dragged. A grid shows the attention weights, with the row for it in a frame.',
      }),
      check: (s) => {
        const [toDog, toBall, toSelf] = s.weights[2];
        if (toDog >= 0.6) return true;
        if (toSelf > toDog && toSelf > toBall) return `“it” now gives more weight to itself (${show(toSelf)}) than to any other token: a long arrow has a large dot product with itself. Try a shorter arrow that still points towards “dog”.`;
        if (toBall >= toDog) return `“it” gives ${show(toDog)} to “dog” and ${show(toBall)} to “ball”: no preference for “dog”. Turn its arrow towards “dog”.`;
        return `“it” gives ${show(toDog)} to “dog”: more than to “ball”, but not yet 0.6. Point its arrow squarely at “dog”, and keep it short.`;
      },
      solution: { vectors: [DOG.v, BALL.v, [1, 0]] },
      hints: [
        'The score for “dog” is the dot product of the two arrows. It is largest when “it” points the same way as “dog”.',
        'An arrow that leans towards “ball” as well raises the score for “ball”. Lay it flat along “dog”.',
      ],
      explain: `
        With “it” at ${pair([1, 0])} the scores are 2 for “dog”, 0 for “ball” and 1 for itself, and softmax gives “dog” ${show(softmax([2, 0, 1])[0])} of the weight.
        The new vector for “it” is then mostly “dog”: the token has picked up what it refers to.

        You were doing by hand what training does: nudging vectors until the attention pattern is useful.
        Nobody tells the model that “it” means the dog. Patterns like that pay off in better predictions, so gradient descent finds them.
      `,
    },
    {
      id: 'stacking',
      type: 'info',
      title: 'Stack it: the transformer',
      text: `
        One step of attention mixes each token with its neighbours once. Real models repeat it many times.

        - **Layers.** The new vectors go through attention again, and again. Early layers can link neighbouring words. Later layers work on vectors that already carry context.
        - **Heads.** Each layer runs several attention steps side by side, each with its own weights, so that one can follow what “it” refers to while another follows something else.

        A network built from such layers is a **transformer**. The design comes from a 2017 paper by eight
        researchers working at Google, with the confident title *Attention Is All You Need*.
        Today's large language models are built on this design.

        On scale: your examples had three tokens and vectors of two numbers. A large model reads thousands of tokens at once,
        gives each a vector of hundreds or thousands of numbers, and has **billions** of weights. Every one of them was set
        by the loop you know: predict, measure the loss, backpropagate, step.
      `,
    },
    {
      id: 'teach-pipeline',
      type: 'info',
      title: 'From text to the next token',
      text: `
        Every part now has its place. Follow one token being predicted, for a text that so far reads “the river”.

        1. **Tokens.** The text is split into tokens: *the*, *river*.
        2. **Embeddings.** Each token is swapped for its vector, looked up in the embedding table.
        3. **Attention layers.** The vectors pass through the layers, and each takes in its context.
        4. **Scores.** A last layer turns the vector of the final token into one score for every token in the vocabulary, the model's whole list of tokens. With made-up numbers: *bank* 3, *boat* 2, *cheese* −1, and so on.
        5. **Softmax** turns those scores into probabilities.
        6. **Pick.** One token is picked by those chances, say *bank*. It is added to the text, and everything runs again on “the river bank”.
      `,
    },
    {
      id: 'pipeline',
      type: 'order',
      review: true,
      title: 'Back to the next word',
      text: `
        *How AI Learns* said that a language model gives every possible next token a chance. You can now say how.

        **Put the steps of predicting one token in order.**
      `,
      items: [
        'Split the text so far into tokens',
        'Look up the embedding of each token',
        'Attention layers: each vector takes in the context',
        'The last token’s vector gives a score to every token in the vocabulary',
        'Softmax turns the scores into probabilities',
        'Pick a token, add it to the text, start again',
      ],
      labels: ['First', 'Last'],
      explain: `
        Tokens, embeddings, attention, scores, softmax, pick. The temperature divides the scores just before softmax.

        Training runs the same pipeline on real text with the next token hidden. The loss is the cross-entropy of
        the token that really came next. Backpropagation carries it back through every layer to every weight, embeddings included,
        and gradient descent takes a step, one mini-batch at a time. That is the whole machine.
      `,
    },
    {
      id: 'teach-left-out',
      type: 'info',
      title: 'What a real transformer adds',
      text: `
        The attention you worked through is simplified, not false. A real transformer adds four parts.

        - **Positional information.** A weighted average never asks where a token stood: “dog bites man” and “man bites dog” would come out the same. So real models add positional information to the vectors.
        - **Query, key and value weights.** Your scores compared the vectors themselves, so a token favoured tokens like itself. A real head first multiplies the vectors by learned matrices: one for the token doing the scoring (the query), one for the token being scored (the key), one for what gets mixed in (the value). So “it” can give its weight to “trophy”, a word nothing like “it”.
        - **Normalisation** rescales the vectors between steps, so the numbers stay in a steady range.
        - **Feed-forward layers**, small networks with a bend as in the first lesson, process each vector after the mixing.
      `,
    },
    {
      id: 'left-out',
      type: 'match',
      title: 'What this picture leaves out',
      text: `
        Four parts that the simplified picture left out. You should at least know their names.

        **Match each part with what it is for.**
      `,
      pairs: [
        ['Positional information', 'Tells the model the order of the tokens'],
        ['Query, key and value weights', 'Let a token look for something unlike itself'],
        ['Normalisation', 'Keeps numbers in a steady range across layers'],
        ['Feed-forward layers', 'A small network with a bend, applied to each vector'],
      ],
      explain: `
        Positional information supplies the order that a weighted average ignores. Query, key and value weights
        let “it” give its weight to “trophy”, a word nothing like itself. Normalisation keeps the numbers steady from layer to layer,
        and feed-forward layers bring the bend of the first lesson back in.

        None of this changes the three steps you did by hand: score, weigh, mix.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are true of **attention** as you have worked it out here?',
      options: [
        { text: 'Each token scores the tokens of the text by dot products of their vectors', correct: true },
        { text: 'Softmax turns each token’s scores into weights that add up to 1', correct: true },
        { text: 'A token’s new vector is a weighted average, so it depends on which other tokens are present', correct: true },
        { text: 'Each token simply copies the vector of the single token it matches best', why: 'It takes a weighted average of all the vectors. The best match counts most, but the others contribute too.' },
        { text: 'The attention weights are written by programmers for each sentence', why: 'They are worked out afresh for every text from the vectors, and the vectors (with the other weights) come from training.' },
      ],
      explain: 'Score by dot product, weigh by softmax, mix by weighted average. Because the weights depend on the other tokens, the same word comes out differently in different company.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        You have now seen every main part: bends, softmax, loss, backpropagation, training, embeddings, attention.

        **Explain to a friend, in four or five sentences, what happens inside a language model between reading your question and writing one token of its answer.**
      `,
      model: `
        The text is cut into tokens, and each token is swapped for its embedding: a list of numbers learned in training.
        Then come many layers of attention. In each, every token's vector scores the others, and takes in a weighted mix of them,
        so that each vector comes to stand for its token *in this context*. Between the mixing steps, small networks with a bend work on each vector.

        At the end, the last vector is turned into a score for every token in the vocabulary. Softmax turns the scores into
        probabilities, one token is picked, and the whole thing runs again for the next one.

        All the numbers involved, billions of them, were set by gradient descent, using gradients from backpropagation, to make the text that really came next more probable.
        Nothing in the machine checks whether a sentence is true.
      `,
    },
  ],
  recap: [
    'One fixed vector per token is not enough: what a word means depends on the words around it.',
    '**Attention**: each token scores every token by a dot product, softmax turns the scores into weights, and the token’s new vector is the weighted average of all the vectors.',
    'Stacked in many layers, with several heads in each, attention makes a **transformer** (2017), the design behind today’s large language models.',
    'The picture here is simplified: real transformers add positional information, separate query, key and value weights, normalisation and feed-forward layers.',
  ],
  next: 'That is the inside of the machine: a bend between layers, scores turned into probabilities, a loss, gradients passed backwards, training in batches, words as vectors, and attention to tie them together. Each part is arithmetic you have now done by hand.',
};
