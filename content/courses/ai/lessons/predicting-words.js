// How AI Learns · Lesson 5 · Guess the Next Word
import { catModel } from '../helpers.js';

const LOOP = ['the', 'cat', 'sat', 'on', 'the', 'cat', 'sat', 'on', 'the', 'cat', 'sat', 'on'];

const TOKEN_DIAGRAM = {
  type: 'svg',
  viewBox: '0 0 360 136',
  maxWidth: 440,
  alt: 'Two words and their tokens. The common word “the” is a single token. The rarer word “unbelievably” is split into three tokens: “un”, “believ” and “ably”.',
  content: `
    <text class="fig-label text-muted" x="62" y="16" text-anchor="middle">word</text>
    <text class="fig-label text-muted" x="248" y="16" text-anchor="middle">tokens</text>
    <g class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M122 50 H146 M140 45 L146 50 L140 55"/>
      <path d="M122 104 H146 M140 99 L146 104 L140 109"/>
    </g>
    <g class="stroke-ink" stroke-width="2.5">
      <rect class="fill-blue-soft" x="158" y="32" width="56" height="36" rx="10"/>
      <rect class="fill-violet-soft" x="158" y="86" width="42" height="36" rx="10"/>
      <rect class="fill-teal-soft" x="206" y="86" width="70" height="36" rx="10"/>
      <rect class="fill-pink-soft" x="282" y="86" width="60" height="36" rx="10"/>
    </g>
    <text class="fig-label" x="62" y="55" text-anchor="middle">the</text>
    <text class="fig-label" x="62" y="109" text-anchor="middle">unbelievably</text>
    <text class="fig-label" x="186" y="55" text-anchor="middle">the</text>
    <text class="fig-label" x="179" y="109" text-anchor="middle">un</text>
    <text class="fig-label" x="241" y="109" text-anchor="middle">believ</text>
    <text class="fig-label" x="312" y="109" text-anchor="middle">ably</text>
  `,
};

export default {
  id: 'predicting-words',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Finish the sentence',
      text: `
        Read this, and notice the word that comes to mind before you have time to think:

        > Thank you very …
      `,
      options: [
        { text: 'much', correct: true },
        { text: 'many' },
        { text: 'big' },
        { text: 'green' },
      ],
      explain: `
        “Much”, at once. Nobody taught you a rule for that. You have simply met so much language that you have a feel for what comes next.

        A **language model** is a machine built for exactly this one job: given some text, predict what comes next.
        Let us build one small enough to see right through.
      `,
    },
    {
      id: 'teach-counting',
      type: 'info',
      title: 'A model you can read',
      text: `
        This language model has read five sentences. That is its whole world.
        To “learn”, it did one thing: for every word, it counted what came next.

        :::example After “cat”
        “cat” occurs 4 times in the training text. Next comes “sat” twice, “saw” once, and once the sentence ends.

        So after “cat” the model gives “sat” a chance of 2 in 4. That is 2 ÷ 4 = 0.5, or **50%**.
        “saw” gets 1 in 4, or 25%.
        :::

        That table of counts **is** the model. There is nothing else inside.
      `,
      figure: catModel({
        static: true, start: 'cat',
        alt: 'Five training sentences about a cat and a dog, and a bar for everything that follows “cat” in them: sat 2 of 4, saw 1 of 4, end of sentence 1 of 4.',
      }),
    },
    {
      id: 'read-the-bars',
      type: 'choice',
      text: `
        Now the text so far is “the”, and the bars show what the model counted after it.

        **According to the model, which word is most likely to come next?**
      `,
      figure: catModel({
        static: true,
        alt: 'Five training sentences about a cat and a dog, and a bar for each word that follows “the” in them: cat 4 of 10, dog 3 of 10, mat 2 of 10, rug 1 of 10.',
      }),
      options: [
        { text: 'cat', correct: true },
        { text: 'dog', why: '“dog” follows “the” 3 times. One word does better.' },
        { text: 'mat', why: '“mat” follows “the” twice. Look for the longest bar.' },
        { text: 'sat', why: 'In these five sentences, “sat” never comes straight after “the”. The model gives it no chance at all.' },
      ],
      explain: `
        “the” occurs 10 times in the training text. It is followed by “cat” 4 times, “dog” 3 times, “mat” twice and “rug” once.
        So after “the”, the model gives “cat” a chance of 4 in 10, or 40%.
      `,
    },
    {
      id: 'count-to-chance',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const set = rng.pick([
          { word: 'red', nexts: ['car', 'apple', 'light'] },
          { word: 'big', nexts: ['dog', 'house', 'city'] },
          { word: 'good', nexts: ['morning', 'idea', 'night'] },
          { word: 'my', nexts: ['friend', 'phone', 'bike'] },
        ]);
        const total = rng.pick([10, 20, 25, 50]);
        const c3 = rng.int(1, Math.floor(total / 5));
        const c2 = rng.int(c3 + 1, Math.floor((total - c3) / 2) - (((total - c3) % 2 === 0) ? 1 : 0));
        const counts = [total - c2 - c3, c2, c3];
        const which = rng.int(0, 2);
        const answer = Math.round((counts[which] * 100) / total);
        return {
          text: `
            A next-word model is built by counting. In its training text the word **“${set.word}”** occurs **${total} times**. It is followed by

            - “${set.nexts[0]}” ${counts[0]} times,
            - “${set.nexts[1]}” ${counts[1]} times,
            - “${set.nexts[2]}” ${counts[2]} ${counts[2] === 1 ? 'time' : 'times'}.

            **What chance does the model give “${set.nexts[which]}” after “${set.word}”?**

            (A count of 3 out of 12 would be a chance of 3 ÷ 12 = 0.25, or 25%.)
          `,
          answer,
          unit: '%',
          wrong: [
            [counts[which], `${counts[which]} is the count. The chance is that count as a share of all ${total} times “${set.word}” occurs.`],
            [100 / 3, 'The three words are not equally likely: the counts differ.'],
            [100 - answer, `That is the chance of anything *except* “${set.nexts[which]}”.`],
          ],
          hints: [`How many of the ${total} times is “${set.word}” followed by “${set.nexts[which]}”?`, `${counts[which]} out of ${total}. Turn that into a percentage.`],
          explain: `${counts[which]} out of ${total} is ${answer}%. Counting how often each word follows, then dividing by the total: that is all this kind of model does to “learn”.`,
        };
      },
    },
    {
      id: 'write-something-new',
      type: 'interact',
      attempts: 6,
      title: 'Write something new',
      text: `
        Now write with it. Tap a bar to add that word, or press “Model picks”: the model then rolls dice weighted like the bars.

        **Write a complete sentence, ending in a full stop, that is *not* one of the five training sentences.**
      `,
      widget: catModel({
        temperature: false, starters: false,
        alt: 'The five training sentences, the text so far, and bars for the possible next words.',
      }),
      check: (s) => {
        if (s.novel && s.text.length >= 5) return true;
        if (s.novel) return 'That is new, but it is hardly a sentence. Start over and write one with at least four words.';
        if (s.copied) return 'That sentence is in the training text, word for word. Start over and take a different turn somewhere.';
        if (s.full) return 'That one never reached a full stop. Start over.';
        return 'Keep adding words until the sentence ends with a full stop.';
      },
      solution: { text: ['the', 'dog', 'sat', 'on', 'the', 'rug', '.'] },
      hints: [
        'Follow one training sentence for a few words, then switch to another at a word they share, such as “the” or “sat”.',
        'For example: the · dog · sat · on · the · rug · end.',
      ],
      explain: `
        Your sentence is nowhere in the training text. Yet every step in it was copied: each pair of neighbouring words occurs somewhere in those five sentences.

        **The model does not look sentences up. It builds new ones, one likely step at a time.**
        Some come out fine: “the dog sat on the rug.” Some do not: “the cat sat on the dog saw the mat.”
        Each step was plausible, and the whole is nonsense. This model looks one word back, so it cannot tell the difference.
      `,
    },
    {
      id: 'no-randomness',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Turn the randomness down',
      text: `
        The new slider sets how adventurous the model’s picks are. Watch the bars as you move it.

        **Set the randomness to 0. Then press “Model picks” again and again until the text stops growing.**
      `,
      widget: catModel({
        temperature: { min: 0, max: 2, step: 0.5, value: 1 }, starters: false,
        alt: 'The toy language model with a slider for randomness.',
      }),
      check: (s) => {
        if (s.temperature !== 0) return 'Set the randomness slider to 0 first. Then start over and let the model pick.';
        if (s.modelPicks >= 6 && (s.repeats || s.full)) return true;
        return 'Keep pressing “Model picks” until the text stops growing.';
      },
      solution: { temperature: 0, text: LOOP, modelPicks: 11 },
      explain: `
        “the cat sat on the cat sat on the cat sat on …”

        With no randomness the model always takes the single most likely word. So it walks into a loop, and it can never say anything else.
      `,
    },
    {
      id: 'teach-temperature',
      type: 'info',
      title: 'Temperature',
      text: `
        The slider decides how the model picks from its bars. Take the four words after “the”.

        - **At 0** there is no dice roll. The model takes the most likely word, “cat”, every single time.
        - **At 1** the picks follow the chances: “cat” about 40 times in 100, “dog” about 30.
        - **Higher still**, the chances flatten out. Unlikely words such as “rug” catch up, so the text gets more varied, and more likely to go wrong.

        Chatbots have a setting like this, usually called **temperature**. It is one reason why the same question
        (the same **prompt**, as the text you send is called) can get a different answer each time.
      `,
      figure: catModel({
        static: true,
        alt: 'The bars after “the” with the randomness at 1: cat 4 of 10, dog 3 of 10, mat 2 of 10, rug 1 of 10.',
      }),
    },
    {
      id: 'zero-randomness',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const set = rng.pick([
          { lead: 'The sky is', words: ['blue', 'grey', 'clear'] },
          { lead: 'I would like a cup of', words: ['tea', 'coffee', 'water'] },
          { lead: 'She opened the', words: ['door', 'window', 'box'] },
        ]);
        const [p1, p2, p3] = rng.pick([[60, 30, 10], [50, 40, 10], [70, 20, 10], [50, 30, 20]]);
        const [a, b, c] = set.words;
        return {
          text: `
            After “${set.lead}”, a language model gives these chances for the next word:

            | Next word | Chance |
            |-----------|-------:|
            | ${a} | ${p1}% |
            | ${b} | ${p2}% |
            | ${c} | ${p3}% |

            **With its randomness (temperature) set to 0, what does it write?**
          `,
          options: [
            { text: `“${a}”, every single time`, correct: true },
            { text: `“${a}” about ${p1} times in 100, “${b}” about ${p2}, “${c}” about ${p3}`, why: 'That is what a randomness of 1 does: the picks follow the chances. At 0 there is no dice roll at all.' },
            { text: 'Each of the three equally often', why: 'That is where a very high randomness leads: the chances flatten out. Zero does the opposite.' },
            { text: `“${c}”, because it is the most surprising`, why: 'Zero randomness means no surprises: the most likely word wins every time.' },
          ],
          explain: `At 0 the model always takes the most likely word: “${a}”. At 1 it would pick “${a}” about ${p1}% of the time. Higher still, and the less likely words catch up.`,
        };
      },
    },
    {
      id: 'scale-up',
      type: 'info',
      title: 'Same job, different scale',
      text: `
        Your model looks one word back, and it shows. A real language model does the same job on another scale:
        *given the text so far, give every possible next word a chance.*

        - **Context.** Not one word back, but thousands of words at once.
        - **Weights, not counts.** A neural network with billions of weights works out the chances.
        - **Training.** The weights start out random. Gradient descent, the small downhill steps of lesson 3, tunes them on an enormous amount of text.

        :::key
        A chatbot writes its reply the way you wrote your sentence: predict, pick, add, repeat.
        :::

        Systems built for chatting get extra training on top, for instance to follow instructions. They still write one piece at a time.
      `,
    },
    {
      id: 'why-not-a-table',
      type: 'choice',
      title: 'Why not just a bigger table?',
      text: `
        To take whole paragraphs into account, why not simply build a bigger table of counts, with a row for every 50-word passage?

        Here is a fact to reason from. Take any 50 words from a book: that exact sequence has probably never been written anywhere else.

        **So what would go wrong with the table?**
      `,
      options: [
        { text: 'Almost every 50-word passage has been written only once, so there would be nothing to count', correct: true },
        { text: 'Counting that many passages would take a computer too long', why: 'Counting is the easy part. The trouble is what the counts would say: next to nothing.' },
        { text: 'It would work perfectly, but it would not count as AI', why: 'It would not work. Faced with a passage it had never seen, which is nearly every passage, the table would have no row to look up.' },
        { text: 'Long passages do not help with predicting the next word', why: 'They help a great deal. What comes next often depends on something said sentences earlier.' },
      ],
      explain: `
        A table can only count what repeats. About nearly every context it met, it would have nothing to say.

        So real models keep no counts. They *work out* the chances with a neural network: billions of weights, layer upon layer.
        That lets them respond sensibly to text they have never seen.
      `,
    },
    {
      id: 'teach-tokens',
      type: 'info',
      title: 'Pieces, not words',
      text: `
        One more detail. Language models do not work with whole words but with **tokens**.

        - A common word is one token.
        - A rarer word is split into several pieces: a model might cut “unbelievably” as in the picture.
        - The list of tokens is fixed before training begins. A typical list has around a hundred thousand pieces, down to single letters.

        With pieces that small, any text can be spelled out: names, typing errors, words invented a second ago.

        So “predict the next word” is shorthand. Strictly, it is “predict the next token”.
        As a rough guide for English, a token is about three-quarters of a word. It varies from model to model.
      `,
      figure: TOKEN_DIAGRAM,
    },
    {
      id: 'tokens',
      type: 'choice',
      text: `
        You type the made-up word **“flurbish”** into a chatbot. It is not on the token list.

        **What happens?**
      `,
      options: [
        { text: 'It is split into smaller pieces that are on the list, such as “fl”, “urb” and “ish”', correct: true },
        { text: 'The model cannot read your message', why: 'The token list includes very short pieces, down to single letters, so any text at all can be spelled out.' },
        { text: 'The word is silently left out', why: 'Nothing is dropped. Unfamiliar words just take more tokens to spell.' },
        { text: '“flurbish” is added to the list as a new token', why: 'The list is fixed before training begins and does not change while you chat.' },
      ],
      explain: `
        Nothing is dropped and nothing is added. “flurbish” is spelled out with pieces that are on the list, just as a rare real word would be.
        An unfamiliar word simply takes more tokens.
      `,
    },
    {
      id: 'teach-lm-training',
      type: 'info',
      title: 'One round of training',
      text: `
        Training a language model is the loop from lesson 3: predict, measure the error, nudge the weights downhill. The training data are text.

        :::example One round, on “Thank you very much”
        1. Take the passage and hide its last token: “Thank you very …”
        2. The model gives every possible next token a chance. Say “much” gets 20%.
        3. Compare with what really came next, “much”. The lower the chance it got, the bigger the error.
        4. Gradient descent nudges all the weights, so that “much” would get a higher chance next time.
        :::

        Then on to the next passage, billions of times over. What is left at the end is the weights, not the text.
        And notice: no step asks whether the text is *true*.
      `,
    },
    {
      id: 'training-a-language-model',
      type: 'order',
      review: true,
      text: 'Put one round of training a language model in order.',
      items: [
        'Take a passage of real text and hide what comes next',
        'The model gives every possible next token a chance',
        'Compare with the token that really came next: the lower its chance, the bigger the error',
        'Nudge all the weights slightly downhill, so that token would get a higher chance next time',
        'Move on to another passage',
      ],
      labels: ['First', 'Last'],
      explain: `
        Hide, predict, compare, nudge: billions of times over.

        Notice what is missing. Nothing in this loop asks whether a sentence is *true*.
        The only question is: did you give a high chance to what the text said next? Hold on to that for the next lesson.
      `,
    },
    {
      id: 'model-facts',
      type: 'multi',
      review: true,
      text: 'Which of these statements about large language models are accurate?',
      options: [
        { text: 'They write one token at a time, each picked according to predicted chances', correct: true },
        { text: 'Their weights were tuned by gradient descent to predict the next token in huge amounts of text', correct: true },
        { text: 'With some randomness switched on, the same prompt can produce different replies', correct: true },
        { text: 'They keep a copy of their training text and paste in the best-matching passage', why: 'What they keep is weights. A reply is built token by token, which is why it can be a sentence nobody ever wrote.' },
        { text: 'Every reply is checked against a database of facts before you see it', why: 'Nothing in the model does that. Some products add a search step around the model, but the model’s own output is unchecked prediction.' },
      ],
      explain: 'Predict the next token, pick, add, repeat. The weights behind the predictions come from gradient descent on text. No lookup and no fact-check is built in.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend asks: **“How does a chatbot actually write its answers?”**

        Explain it in two or three sentences.
      `,
      model: `
        It writes one small piece (a token) at a time. At each step it takes everything so far, your question and what it has already written,
        and works out a chance for every possible next piece. It picks one, adds it, and repeats.

        The chances come from a huge neural network whose weights were tuned on enormous amounts of text to be good at exactly this prediction.
      `,
    },
  ],
  recap: [
    'A language model does one thing: given the text so far, it gives every possible next token a chance.',
    'Text is written one token at a time: predict, pick, add, repeat. A randomness setting (**temperature**) controls how adventurous the picks are.',
    'Real models replace the table of counts by a neural network with billions of weights, tuned by gradient descent on huge amounts of text.',
    'Training rewards predicting what the text said next. Nothing in it checks what is true.',
  ],
  next: 'Next: why a machine that predicts so well can still be confidently wrong.',
};
