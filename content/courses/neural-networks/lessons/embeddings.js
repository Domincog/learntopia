// Inside Neural Networks · Lesson 5 · Meaning as Coordinates
import { r, num } from '../../../kit.js';
import { show, pair, WORD_MAP, GROUPS, vecOf, groupOf, dot, dist, cosine, nearestWord, wordMap } from '../helpers.js';

const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const vecTex = (v) => r`\begin{pmatrix} ${num(v[0])} \\ ${num(v[1])} \end{pmatrix}`;
const KINDS = ['an animal', 'a person', 'a food'];

/** Vectors of length 5 with whole-number entries: every cosine between two of them is a round number. */
const LENGTH_FIVE = [[3, 4], [4, 3], [5, 0], [0, 5], [-3, 4], [-4, 3], [3, -4], [4, -3], [-5, 0], [0, -5], [-3, -4], [-4, -3]];

const CAT = vecOf('cat');
const DOG = vecOf('dog');
const BREAD = vecOf('bread');
const KITTEN = vecOf('kitten');
const MAN = vecOf('man');
const WOMAN = vecOf('woman');
const KING = vecOf('king');
const add = (a, b, c) => [c[0] - a[0] + b[0], c[1] - a[1] + b[1]];   // c − a + b
const QUEEN_SPOT = add(MAN, WOMAN, KING);
const PUPPY_SPOT = add(CAT, KITTEN, DOG);
const ODD_SPOT = add(vecOf('apple'), vecOf('pear'), BREAD);
const WITH_TIGER = [...WORD_MAP, { text: 'tiger', at: [0, 0], group: 0 }];

export default {
  id: 'embeddings',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Words into numbers',
      text: `
        Everything so far ran on numbers: scores, weights, gradients. A language model has to start from **words**.

        The simplest fix: number the dictionary. *aardvark* is 1, … *cat* is 1,834, *catalogue* is 1,835, … *kitten* is 6,412.

        **What goes wrong if a network is fed these numbers?**
      `,
      options: [
        { text: 'The numbers make “cat” nearly the same as “catalogue”, and nothing like “kitten”', correct: true },
        { text: 'Nothing: any way of numbering the words is as good as any other' },
        { text: 'Networks cannot work with numbers in the thousands' },
      ],
      explain: `
        A network treats nearby numbers alike: a weighted sum barely changes when its input goes from 1,834 to 1,835.
        So a numbering by alphabet tells it that *cat* and *catalogue* are almost the same thing.

        What we want is the opposite: words that are **used alike** should get numbers that are alike.
        One number per word is not enough room for that. So give each word several.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Embeddings',
      text: r`
        The list of numbers that stands for a word is called its **embedding**. It is a vector, in
        the sense of *Linear Algebra*. Here every word has **two** numbers, so it is a point on a
        map: cat is $${pair(CAT).replace('−', '-')}$, that is 3 across and 4 up. These twelve were placed by hand, for this lesson.

        How alike two words are can now be measured, as a distance. From cat $(3, 4)$ to dog
        $(4, 3)$ it is 1 across and 1 down: $\sqrt{1^2 + 1^2} \approx ${num(dist(CAT, DOG), 2)}$, the length of that step.

        :::key
        An embedding gives every word a position. Words used in similar ways get positions close together.
        :::

        Real models use hundreds or thousands of numbers per word instead of two. Nobody can draw
        such a map, but distances and dot products are worked out exactly as on this one.
      `,
      figure: wordMap({
        select: 'cat', static: true,
        alt: 'A map with twelve words as points. Four animals sit at the top right, four people at the top left and four foods at the bottom. The word cat is selected, and lines link it to its three closest words: dog, kitten and puppy.',
      }),
    },
    {
      id: 'explore-map',
      type: 'interact',
      attempts: 6,
      title: 'A map of words',
      text: `
        The same map, and now it is yours to probe.

        Tap a word, and the map lists the three words closest to it, with their distances.

        **Find the word whose closest neighbour is “queen”, and leave it selected.**
      `,
      widget: wordMap({
        select: 'cat',
        alt: 'A map with twelve words as points. Four animals sit at the top right, four people at the top left and four foods at the bottom.',
      }),
      check: (s) => {
        if (!s.selected) return 'Tap a word to select it.';
        if (s.selected === 'queen') return 'That is “queen” itself. Which *other* word has “queen” as its closest neighbour?';
        if (s.neighbours[0].word === 'queen') return true;
        return `The word closest to “${s.selected}” is “${s.neighbours[0].word}”, not “queen”. Try the words near “queen”.`;
      },
      solution: { selected: 'king' },
      explain: `
        “king”: its closest word is “queen”, 2 away. (The closest word to “woman” is “man”.)

        Look at the whole map. Animals sit together, people sit together, food sits together.
        Spelling plays no part: “cat” is a long way from “cheese”.

        Two numbers leave room for little more than "animal or not" and "person or not". That is why real models use so many.
      `,
    },
    {
      id: 'dot-by-hand',
      type: 'fill',
      title: 'How alike are two words?',
      text: r`
        In *Linear Algebra* the **dot product** measured how much two vectors agree: multiply
        matching entries and add. It does the same job for words. For king $(-2, 3)$ and queen
        $(-2, 5)$, for instance: $\;(-2) \times (-2) + 3 \times 5 = ${dot(KING, vecOf('queen'))}$.

        | cat | dog | bread |
        |:-:|:-:|:-:|
        | $${vecTex(CAT)}$ | $${vecTex(DOG)}$ | $${vecTex(BREAD)}$ |
      `,
      template: r`
        cat · dog $=$ [[${dot(CAT, DOG)}]]

        cat · bread $=$ [[${dot(CAT, BREAD)}]]
      `,
      hints: [r`cat · dog $= 3 \times 4 + 4 \times 3$.`, r`cat · bread $= 3 \times 2 + 4 \times (-4)$.`],
      explain: r`
        cat · dog $= 3 \times 4 + 4 \times 3 = ${dot(CAT, DOG)}$: large and positive, because the two arrows point almost the same way.

        cat · bread $= 3 \times 2 + 4 \times (-4) = ${num(dot(CAT, BREAD))}$: negative, because they point away from each other.
      `,
    },
    {
      id: 'teach-cosine',
      type: 'info',
      title: 'Direction only',
      text: r`
        A dot product also grows when the vectors are simply long: double both, and it is four
        times as large, though they agree no better than before. To compare **directions only**,
        divide the dot product by both lengths. The result is the **cosine similarity**.

        :::example The arrows u = (3, 4) and v = (8, 6)
        1. Dot product: $\;3 \times 8 + 4 \times 6 = 48$.
        2. Lengths, as in *Linear Algebra*: $\;\sqrt{3^2 + 4^2} = 5$ and $\sqrt{8^2 + 6^2} = 10$.
        3. Cosine similarity: $\;48 \div (5 \times 10) = 0.96$.
        :::

        The result always lies between −1 and 1: **1** when the arrows point the same way,
        **0** when they are at right angles, **−1** when they point in opposite directions.
        Here it is close to 1.
      `,
      figure: {
        type: 'vector-plane', x: [-1, 9], y: [-1, 7], static: true, line: false,
        vectors: [{ id: 'u', x: 3, y: 4, color: 'blue', label: 'u' }, { id: 'v', x: 8, y: 6, color: 'orange', label: 'v' }],
        pair: ['u', 'v'], show: ['dot', 'lengths', 'cos'], cosLabel: 'cosine similarity',
        alt: 'Two arrows from the origin that point almost the same way: a blue one, u, to (3, 4), of length 5, and a longer orange one, v, to (8, 6), of length 10. Their dot product is 48 and their cosine similarity is 0.96.',
      },
    },
    {
      id: 'cosine-gen',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.pick(LENGTH_FIVE);
        let b;
        do { b = rng.pick(LENGTH_FIVE); } while (b[0] === a[0] && b[1] === a[1]);
        const d = dot(a, b);
        const answer = d / 25;
        return {
          text: r`
            The dot product also grows when the vectors are simply long. To compare **directions
            only**, divide it by both lengths. The result is the **cosine similarity**: 1 for the same
            direction, 0 for a right angle, −1 for opposite directions.

            Two words have these embeddings, each of length 5:

            $$ ${vecTex(a)} \quad\text{and}\quad ${vecTex(b)} $$

            **What is their cosine similarity?**
          `,
          answer,
          tolerance: 0.005,
          wrong: [
            [d, 'That is the dot product. Divide it by both lengths: by 5, and by 5 again.'],
            [d / 5, 'You divided by one length. Both vectors have length 5, so divide by 5 twice.'],
          ],
          hints: [
            r`First the dot product: $${num(a[0])} \times ${b[0] < 0 ? `(${num(b[0])})` : num(b[0])} + ${a[1] < 0 ? `(${num(a[1])})` : num(a[1])} \times ${b[1] < 0 ? `(${num(b[1])})` : num(b[1])}$.`,
            r`It is $${num(d)}$. Now divide by $5 \times 5 = 25$.`,
          ],
          explain: r`The dot product is $${num(a[0] * b[0])} + ${a[1] * b[1] < 0 ? `(${num(a[1] * b[1])})` : num(a[1] * b[1])} = ${num(d)}$. Dividing by both lengths: $${num(d)} \div (5 \times 5) = ${num(answer)}$.${answer === 0 ? ' The two arrows are at right angles.' : answer === -1 ? ' The two arrows point in exactly opposite directions.' : ''}`,
        };
      },
    },
    {
      id: 'cosine-map',
      type: 'choice',
      title: 'Distance or direction',
      text: `
        The map now measures by **cosine similarity**: only the direction of each arrow from the centre counts, not its length.

        Measured by distance, the word closest to “kitten” was “puppy”. **Tap “kitten”. Which word is most similar to it by cosine?**
      `,
      figure: wordMap({
        select: 'cat', measure: 'cosine', arrows: true,
        alt: 'The map of twelve words. The selected word and its three most similar words are drawn as arrows from the centre, and their cosine similarities are listed.',
      }),
      options: [
        { text: 'cat', correct: true },
        { text: 'puppy', why: `“puppy” is the closest in distance. By cosine it scores ${show(cosine(KITTEN, vecOf('puppy')))}, just behind another word.` },
        { text: 'dog', why: `“dog” scores ${show(cosine(KITTEN, DOG))} with “kitten”: high, but not the highest.` },
        { text: 'queen', why: `“queen” points in quite a different direction: its cosine with “kitten” is only ${show(cosine(KITTEN, vecOf('queen')))}.` },
      ],
      explain: `
        “cat”. The arrow for kitten ${pair(KITTEN)} points in almost exactly the same direction as the arrow for cat ${pair(CAT)}: it is just longer.
        Cosine ignores the length, so the two come out as good as identical.

        Both measures are in use. Either way the idea is the same: **alike in use, alike in numbers**.
      `,
    },
    {
      id: 'place-word',
      type: 'interact',
      attempts: 6,
      title: 'A new word',
      text: `
        A new word turns up: **tiger**. It has not been given a place yet, so it sits in the middle.

        **Drag “tiger” to a spot where its three closest words are all animals.**
      `,
      widget: wordMap({
        words: WITH_TIGER, drag: ['tiger'], select: 'tiger',
        alt: 'The map of twelve words with a thirteenth, tiger, in the centre. It can be dragged, and its three closest words are listed.',
      }),
      check: (s) => {
        if (s.selected !== 'tiger') return 'Tap or drag “tiger”, so that the map lists its neighbours.';
        const odd = s.neighbours.find((n) => groupOf(n.word) !== 0);
        if (!odd) return true;
        return `One of the three closest words to “tiger” is now “${odd.word}”, and that is ${KINDS[groupOf(odd.word)]}. Move it further into the animals’ corner.`;
      },
      solution: { selected: 'tiger', positions: { tiger: [3, 5] } },
      explain: `
        You placed it by what you know about tigers. Training has no such knowledge. All it has is text,
        and in text “tiger” turns up in the same kinds of sentence as “cat” and “dog”: it *prowls*, *sleeps*, *is fed*.

        Words that are followed and surrounded by similar words get pushed towards similar positions.
        That is all "similar meaning" amounts to here.
      `,
    },
    {
      id: 'teach-table',
      type: 'info',
      title: 'A table of weights',
      text: r`
        In a real model nobody places the words. **The embeddings are weights**, like every other
        number in the network. They form a table with one row for every token and one column for
        every number in an embedding:

        | token | 1st number | 2nd number |
        |---|:-:|:-:|
        | cat | ${num(CAT[0])} | ${num(CAT[1])} |
        | dog | ${num(DOG[0])} | ${num(DOG[1])} |
        | kitten | ${num(KITTEN[0])} | ${num(KITTEN[1])} |
        | … | … | … |

        For this lesson's map the table has 12 rows and 2 columns: $12 \times 2 = 24$ weights.

        To read a token, the network looks up its row and feeds it to the first layer. Before
        training, the rows are random numbers. Then backpropagation gives every number in the table a
        gradient, and gradient descent nudges it, step after step. Nobody decides what any direction means.
      `,
    },
    {
      id: 'learned',
      type: 'choice',
      title: 'Who writes the numbers?',
      text: `
        A real model has an embedding for each of many thousands of tokens, each with hundreds of numbers.

        **Where do all those numbers come from?**
      `,
      options: [
        { text: 'They start out random and are adjusted by gradient descent, like every other weight in the network', correct: true },
        { text: 'Linguists place each word by hand, as on this map', why: 'This map was made by hand, for teaching. With tens of thousands of tokens and hundreds of numbers each, nobody could do that, and nobody does.' },
        { text: 'They are worked out from the spelling of each word', why: 'Spelling says little about use: “cat” and “catalogue” share letters, not meaning. The numbers come from training.' },
        { text: 'They are copied from dictionary definitions', why: 'No dictionary is involved. The model learns only from which tokens appear in which surroundings.' },
      ],
      explain: `
        The embeddings **are weights**: a table with one row per token, random at first, then nudged by gradient descent
        like every other weight in the network.

        Nobody decides what any direction means, and most directions have no tidy name. And because the numbers
        come from text, they pick up its patterns, skews included, as you saw in *How AI Learns*.

        (Strictly, each row belongs to a token, which may be a piece of a word.)
      `,
    },
    {
      id: 'table-size',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const tokens = rng.pick([20000, 30000, 40000, 50000]);
        const size = rng.pick([100, 200, 300, 500]);
        const answer = tokens * size;
        return {
          text: `
            An embedding table has one row for every token and one column for every number in an embedding.

            A model has **${fmtInt(tokens)} tokens**, and each embedding is a list of **${size} numbers**.

            **How many weights does the embedding table hold?**
          `,
          answer,
          wrong: [
            [tokens + size, 'Every one of the tokens has its own full list of numbers, so the two counts multiply.'],
            [tokens, `That is one number per token. Each token has ${size} of them.`],
          ],
          hints: [`${fmtInt(tokens)} rows with ${size} numbers in each.`],
          explain: r`$${fmtInt(tokens).replace(/,/g, '{,}')} \times ${size} = ${fmtInt(answer).replace(/,/g, '{,}')}$ weights, all of them set by training, before the network proper has even begun.`,
        };
      },
    },
    {
      id: 'analogy-by-hand',
      type: 'fill',
      title: 'Directions that mean something',
      text: r`
        Positions are not the whole story. The **step** from one word to another is a vector too:
        subtract, entry by entry. From cat $(3, 4)$ to dog $(4, 3)$ it is $(4 - 3,\ 3 - 4) = (1, -1)$.

        Now look at the arrow from "man" to "woman".

        | man | woman | king |
        |:-:|:-:|:-:|
        | $${vecTex(MAN)}$ | $${vecTex(WOMAN)}$ | $${vecTex(KING)}$ |

        **Work out the step from man to woman. Then take the same step starting from king.**
      `,
      figure: wordMap({
        select: false, static: true, line: false, offset: { from: 'man', to: 'woman' },
        alt: 'The map of twelve words with an arrow from man to woman.',
      }),
      template: r`
        woman − man $=$ ( [[${WOMAN[0] - MAN[0]}]] , [[${WOMAN[1] - MAN[1]}]] )

        king − man + woman $=$ ( [[${QUEEN_SPOT[0]}]] , [[${QUEEN_SPOT[1]}]] )
      `,
      hints: ['Subtract entry by entry: the first numbers, then the second numbers.', 'Add the step you found to king, entry by entry.'],
      explain: `
        The step from man to woman is ${pair([WOMAN[0] - MAN[0], WOMAN[1] - MAN[1]])}: two up. From king ${pair(KING)} that leads to ${pair(QUEEN_SPOT)},
        and that is exactly where “${nearestWord(QUEEN_SPOT)}” sits.

        On this map one **direction** stands for the difference between the two words of each pair. A direction can carry meaning.
      `,
    },
    {
      id: 'analogy-map',
      stretch: true,
      type: 'interact',
      attempts: 6,
      title: 'The same step, somewhere else',
      text: `
        The arrow now runs from “cat” to “kitten”: roughly, *the young one*.

        **Take the same step from “dog”: drag the square to dog − cat + kitten.**
      `,
      widget: wordMap({
        select: false, offset: { from: 'cat', to: 'kitten' }, probe: { at: [0, 0] },
        alt: 'The map of twelve words with an arrow from cat to kitten, and a square that can be dragged. The word nearest to the square is named.',
      }),
      check: (s) => {
        const [x, y] = s.probe;
        if (x === PUPPY_SPOT[0] && y === PUPPY_SPOT[1]) return true;
        if (x === KITTEN[0] && y === KITTEN[1]) return 'That is cat plus the step: the tip of the arrow. Take the same step again, starting from “dog”.';
        if (x === DOG[0] && y === DOG[1]) return `That is “dog” itself. Now add the step from cat to kitten: ${pair([KITTEN[0] - CAT[0], KITTEN[1] - CAT[1]])}.`;
        return `The square is at ${pair([x, y])}. The step from cat to kitten is ${pair([KITTEN[0] - CAT[0], KITTEN[1] - CAT[1]])}, and “dog” is at ${pair(DOG)}.`;
      },
      solution: { probe: PUPPY_SPOT },
      hints: [`The step is kitten − cat = ${pair([KITTEN[0] - CAT[0], KITTEN[1] - CAT[1]])}.`, `Add it to dog: ${pair(DOG)} plus ${pair([KITTEN[0] - CAT[0], KITTEN[1] - CAT[1]])}.`],
      explain: `
        ${pair(DOG)} plus ${pair([KITTEN[0] - CAT[0], KITTEN[1] - CAT[1]])} is ${pair(PUPPY_SPOT)}, and there sits “${nearestWord(PUPPY_SPOT)}”.

        On this map the same step means the same thing wherever it starts: from the grown animal to its young.
      `,
    },
    {
      id: 'teach-trained',
      type: 'info',
      title: 'In trained embeddings',
      text: `
        On this map the steps work exactly, because the map was made that way. The surprise is that
        something like them turns up in embeddings that nobody arranged.

        “king − man + woman ≈ queen” became famous in 2013, when researchers at Google found steps like this
        in embeddings that their **word2vec** method had learned from text.

        :::key
        The sign ≈ says *near*, not *on*. In trained embeddings the sum lands near “queen”.
        Word arithmetic worked for many pairs in the 2013 tests and failed for many others.
        It is a tendency, not a law.
        :::

        And the arithmetic never refuses: it can be done with any three words, sensible or not.
      `,
      figure: wordMap({
        select: false, static: true, line: false, offset: { from: 'man', to: 'woman', at: 'king', copy: true },
        alt: 'The map of twelve words with an arrow from man to woman, and the same arrow drawn again starting at king. It ends on queen.',
      }),
    },
    {
      id: 'caveat',
      type: 'choice',
      title: 'Not so neat',
      text: `
        The arithmetic can be done with any three words, sensible or not.
        “apple is to pear as bread is to … ?” has no good answer. The sum bread − apple + pear still lands
        somewhere: at ${pair(ODD_SPOT)}, the pink dot.

        **Which word is nearest to that point?**
      `,
      figure: wordMap({
        select: false, static: true, line: false, offset: { from: 'apple', to: 'pear', at: 'bread', copy: true }, probe: { at: ODD_SPOT },
        alt: 'The map of twelve words with an arrow from apple to pear, the same arrow drawn again starting at bread, and a pink dot where it ends.',
      }),
      options: [
        { text: 'bread', correct: true },
        { text: 'cheese', why: `“cheese” is ${show(dist(ODD_SPOT, vecOf('cheese')))} away from the dot. Another word is closer.` },
        { text: 'pear', why: `“pear” is ${show(dist(ODD_SPOT, vecOf('pear')))} away from the dot, a long way off.` },
        { text: 'None: the sum has no answer', why: 'Some word is always nearest. The arithmetic cannot say “that question makes no sense”.' },
      ],
      explain: `
        “bread”, ${show(dist(ODD_SPOT, BREAD))} away: one of the three words in the question. The sum always lands somewhere, and some word is always nearest.

        Trained embeddings behave like this too. The usual test of the famous sum does not allow the answer to be
        one of the three words asked about. Without that rule, the nearest word is often “king” itself.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about **embeddings** are accurate?',
      options: [
        { text: 'Each token gets a vector, and tokens used in similar ways end up with similar vectors', correct: true },
        { text: 'The numbers in the vectors are weights: they start random and are set by training', correct: true },
        { text: 'How alike two embeddings are can be measured with a dot product or a cosine', correct: true },
        { text: 'Every number in an embedding stands for a property a person chose, such as “is an animal”', why: 'Nobody chooses the directions. Training finds them, and most have no tidy name.' },
        { text: 'In any trained embedding, king − man + woman lands exactly on queen', why: 'It lands near “queen” in some trained embeddings. Such sums work for many word pairs and fail for many others.' },
      ],
      explain: 'An embedding is a learned table of vectors, one per token. Similar use gives similar vectors, similarity is measured with dot products or cosines, and some directions carry meaning, as a tendency.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Nobody tells a model that “cat” and “kitten” have something to do with each other.

        **In your own words: why do their embeddings end up close together anyway?**
      `,
      model: `
        Embeddings are weights. They start out random, and gradient descent adjusts them while the model learns to predict text.

        “cat” and “kitten” appear in very similar surroundings: the same words tend to come before and after them.
        To predict well, the model has to treat the two in nearly the same way, and the easiest way to do that is to give them nearly the same vector.
        So training pushes their vectors together, without anyone saying what either word means.
      `,
    },
  ],
  recap: [
    'An **embedding** gives every token a vector. Tokens used in similar ways get vectors that are close together.',
    'How alike two embeddings are is measured by distance, by a dot product, or by cosine similarity, which looks at direction only.',
    'Embeddings are weights in a table with one row per token. They start random and are set by training, not by hand.',
    'Some directions carry meaning, as in king − man + woman ≈ queen (word2vec, 2013). That is a tendency in trained embeddings, not a law.',
  ],
  next: 'Next: one vector per word cannot be the whole story. “Bank” means one thing by a river and another in a high street. The fix is called attention.',
};
