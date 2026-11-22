// How AI Learns · Lesson 6 · Confidently Wrong
import { DOCTOR_SENTENCES, tomatoLab } from '../helpers.js';

export default {
  id: 'limits',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A book that does not exist',
      text: `
        You ask a chatbot for three books on the history of tea. It answers at once: three titles, each with an author and a year.

        You look them up. Two are real. The third does not exist, although its title sounds just like a real book.

        **What is the most likely explanation?**
      `,
      options: [
        { text: 'It produced a likely-looking title, and nothing in it checks whether the book is real', correct: true },
        { text: 'It wanted to give you a fuller list' },
        { text: 'The book has been removed from its database' },
        { text: 'It made a typing mistake in a real title' },
      ],
      explain: `
        A language model is trained to continue text plausibly. “Three books, each with title, author and year” has a very predictable shape,
        and the model fills that shape with likely words. Usually the likely words are also true. When they are not, you get a fluent, confident, false statement.

        This is often called a **hallucination**. No intention is involved, and no database either: the model is doing exactly what it was trained to do.
      `,
    },
    {
      id: 'likely-is-not-true',
      type: 'info',
      title: 'Likely is not the same as true',
      text: `
        Think back to the training loop: hide the next token, predict it, nudge the weights.
        At no point does anything ask *“is this true?”* Only: *“is this what the text said next?”*

        For facts that turn up again and again in the training text, the likely continuation *is* the true one.
        “The capital of France is …” will be followed by “Paris”.

        The trouble starts where the truth is rare, exact, or missing from the text: a page number, a reference, the digits of a long sum,
        anything that happened after the training text was collected.
        The model still writes something, in the same assured style.

        :::warn
        How confident a reply sounds tells you nothing about whether it is right.
        :::
      `,
    },
    {
      id: 'where-errors-cluster',
      type: 'bucket',
      review: true,
      text: `
        A language model answers from its weights alone, with no search and no calculator.

        **Which replies can you usually take as they are, and which should you check before relying on them?**
      `,
      buckets: ['Usually fine', 'Check before relying on it'],
      items: [
        { text: 'The capital of Japan', bucket: 0, why: 'This fact appears in countless texts, always the same. The likely answer and the true answer coincide.' },
        { text: 'Why the sky is blue', bucket: 0, why: 'A standard explanation, written out thousands of times in the training text.' },
        { text: 'What a common English word means', bucket: 0, why: 'Everyday word meanings are about as well covered by text as anything can be.' },
        { text: 'The page number of a quotation', bucket: 1, why: 'An exact detail that appears rarely, if at all. The model will still produce a number that looks right.' },
        { text: 'Five papers on a narrow topic, with links', bucket: 1, why: 'References and links are written the same way as everything else: as likely-looking text. Some may not exist.' },
        { text: 'The result of yesterday’s match', bucket: 1, why: 'Training text ends at some date. Anything after it is simply not in the weights.' },
        { text: '48,317 × 9,274', bucket: 1, why: 'Predicting likely digits is not the same as calculating. Long sums often come out slightly wrong.' },
      ],
      explain: `
        Common knowledge that appears thousands of times usually comes out right. Exact details, narrow topics, recent events and long calculations are where errors cluster.

        Many chat products can now run a web search or a calculator on the side, which helps with exactly these cases. The model on its own cannot.
      `,
    },
    {
      id: 'what-the-text-says',
      type: 'fill',
      title: 'What the text says, the model says',
      text: `
        Here is a model like the one you built, trained on six sentences. This one looks **two** words back.

        Switch between the two starts and read the bars.
      `,
      figure: {
        type: 'next-word',
        corpus: DOCTOR_SENTENCES,
        start: 'the doctor said', context: 2,
        temperature: false, auto: false, pick: false,
        starters: ['the doctor said', 'the nurse said'],
        alt: 'Six training sentences. Four begin “the doctor said”, three of them continuing with “he” and one with “she”. Two begin “the nurse said”, both continuing with “she”.',
      },
      template: 'After “the doctor said”, the model gives “she” a chance of [[25]] %. After “the nurse said”, it gives “he” a chance of [[0]] %.',
      hints: ['Count the lines: how many times is “doctor said” followed by “she”, out of how many?', 'Tap “the nurse said”. Is there a bar for “he” at all?'],
      explain: `
        “doctor said” occurs 4 times: 3 times followed by “he”, once by “she”. So “she” gets 25%.
        After “nurse said” the text only ever continues with “she”, so “he” gets no chance at all.
      `,
    },
    {
      id: 'teach-skew',
      type: 'info',
      title: 'Lopsided in, lopsided out',
      text: `
        After “the doctor said”, this model gives “he” a chance of 75%.
        Is that a fact about doctors? No. It is a fact about **these six sentences**.

        A model learns whatever patterns its training data contain: the useful ones, and also the skews, stereotypes and gaps.
        It cannot tell which is which. Nobody wrote a rule, nothing was looked up, and the model holds no opinion.
        It only makes some continuations more likely than others.

        :::key
        Lopsided examples in, lopsided predictions out. Programmers have an old phrase for this: *garbage in, garbage out*.
        :::
      `,
      figure: {
        type: 'next-word',
        corpus: DOCTOR_SENTENCES,
        start: 'the doctor said', context: 2,
        static: true,
        alt: 'The six training sentences and the bars after “the doctor said”: he 3 of 4, she 1 of 4.',
      },
    },
    {
      id: 'skewed-in-skewed-out',
      type: 'choice',
      review: true,
      text: `
        A large language model completes “The engineer said that …” with “he” far more often than with “she”.

        **What does that tell you?**
      `,
      options: [
        { text: 'In its training text, engineers were mostly called “he”, and the model reproduces the pattern', correct: true },
        { text: 'It has looked up how many engineers are men', why: 'It has no such step. It predicts likely text, and “likely” is decided by the text it was trained on.' },
        { text: 'A programmer wrote a rule about engineers', why: 'Nobody writes rules like that into a language model. The pattern was absorbed from the training text.' },
        { text: 'It believes that women cannot be engineers', why: 'A model has no beliefs. It has weights that make some continuations more likely than others.' },
      ],
      explain: `
        The model reproduces a pattern of its training text. Lopsided examples in, lopsided predictions out.

        It matters most when predictions feed decisions about people. In 2018, Reuters reported that Amazon had dropped an experimental tool for rating job applications.
        Trained on ten years of past applications, most of them from men, it had learned to mark down CVs containing the word “women’s”.
      `,
    },
    {
      id: 'never-miss',
      type: 'interact',
      graded: false,
      title: 'A model that never misses',
      text: `
        A different limit now, and a small model to watch it in.

        Ten tomato plants got different amounts of water. A model predicts the harvest from the water.
        You decide how many weights it has: 2 make a straight line, and every extra weight lets the curve bend more.
        For each setting, training finds the curve with the lowest error.

        **Make the training error as small as you can.**
      `,
      widget: tomatoLab({
        reveal: false, weights: { value: 2 },
        alt: 'Ten training points: harvest rises with water up to about 5 litres a week, then falls. A fitted curve and a chart of training error against the number of weights.',
      }),
      check: (s) => s.trainError < 0.05 || `The training error is still ${s.trainError}. Give the model more weights.`,
      solution: { weights: 10, tried: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
      explain: `
        Ten weights, ten plants: the curve passes through every single point. Training error: zero.

        A perfect model? Look at what the curve does *between* the points.
      `,
    },
    {
      id: 'which-model',
      type: 'choice',
      mode: 'predict',
      text: `
        Twelve more plants are measured. The model has never seen them.

        **Which model will predict these new plants best?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: '2 weights', figure: tomatoLab({ reveal: false, weights: { value: 2 }, alt: 'A straight line through the ten points. It misses the rise and fall.' }) },
        { text: '3 weights', correct: true, figure: tomatoLab({ reveal: false, weights: { value: 3 }, alt: 'A gentle arch that follows the rise and fall but misses most points by a little.' }) },
        { text: '10 weights', figure: tomatoLab({ reveal: false, weights: { value: 10 }, alt: 'A wildly wiggling curve that passes through all ten points.' }) },
      ],
      explain: 'There is one way to find out: test each model on plants it was not trained on.',
    },
    {
      id: 'fresh-data',
      type: 'interact',
      attempts: 6,
      title: 'Test it on fresh data',
      text: `
        Press **“Reveal fresh data”**. The diamonds are the twelve new plants. No model was trained on them.

        **Find the number of weights that gives the smallest error on fresh data.**
      `,
      widget: tomatoLab({
        weights: { value: 10 },
        alt: 'The tomato model with a button that reveals twelve fresh examples and their error.',
      }),
      check: (s) => {
        if (!s.revealed) return 'Press “Reveal fresh data” first.';
        if (s.weights === s.best) return true;
        return s.weights > s.best
          ? 'With this many weights, the curve chases the scatter of the ten training plants, and the fresh plants show it up. Try fewer weights.'
          : 'This model is too stiff to follow the bend in the data. It misses the training plants and the fresh ones alike. Try more weights.';
      },
      solution: { weights: 3, revealed: true, tried: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
      hints: [
        'Slide through every setting and watch the dashed line in the lower chart.',
        'The dashed line is lowest at 3 weights.',
      ],
      explain: `
        As weights are added, the training error only ever goes down. The error on fresh data falls at first, then **turns back up**.
        It is lowest at 3 weights.
      `,
    },
    {
      id: 'teach-overfitting',
      type: 'info',
      title: 'Overfitting',
      text: `
        Here are the errors you just saw, for three of the models.

        | Weights | Training error | Error on fresh data |
        |:-------:|:--------------:|:-------------------:|
        | 2 | 2.46 | 2.93 |
        | 3 | 0.46 | 0.77 |
        | 10 | 0.00 | 8.91 |

        - **2 weights: too simple.** A straight line cannot follow the bend. It does badly on both.
        - **10 weights: overfitting.** The model has memorised its ten training plants, accidents and all, instead of the pattern behind them
          (more water helps, up to a point). The sign is a tiny training error next to a large error on fresh data.

        Data kept aside for checking are called **test data**. A model is only as good as its error on data it was not trained on.
      `,
      figure: tomatoLab({
        reveal: true, static: true, chart: false, weights: { value: 10 },
        alt: 'The 10-weight curve passes through all ten training plants and swings far away from the twelve fresh plants between them.',
      }),
    },
    {
      id: 'another-batch',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Another batch of plants',
      text: `
        Why does the 10-weight model do so badly? Ten *other* plants would have scattered a little differently.

        **Press “New training data” a few times and watch the 10-weight curve.
        Then set the slider to 3 weights and press it a few more times.**
      `,
      widget: tomatoLab({
        reveal: true, resample: true, weights: { value: 10 },
        alt: 'The tomato model with a button that draws a new batch of ten training plants.',
      }),
      check: (s) => {
        const count = (lo, hi) => Object.keys(s.sampledAt).reduce((t, k) => t + (Number(k) >= lo && Number(k) <= hi ? s.sampledAt[k] : 0), 0);
        if (count(8, 10) < 2) return 'Draw new training data at least twice with the slider at 10 weights.';
        if (count(2, 4) < 2) return 'Now move the slider down to 3 weights and draw new training data at least twice more.';
        return true;
      },
      solution: { weights: 3, sampledAt: { 10: 2, 3: 2 } },
      explain: `
        With 10 weights the curve is a different shape every time: it follows the scatter of whichever ten plants it happened to get.
        With 3 weights it hardly moves: it follows the pattern that all the batches share.

        A model you can trust on new cases is one that would have come out much the same from different examples.
      `,
    },
    {
      id: 'diagnose',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'A model that reads handwritten digits', train: 'the 10,000 digits it was trained on', fresh: 'digits written by new people' },
          { what: 'A model that spots plant diseases in leaf photos', train: 'the photos it was trained on', fresh: 'photos from a different farm' },
          { what: 'A model that flags spam', train: 'the emails it was trained on', fresh: 'this week’s new emails' },
        ]);
        const low = rng.int(1, 3);
        const high = rng.int(24, 38);
        return {
          text: `
            ${scene.what} gets **${low}%** wrong on ${scene.train}, and **${high}%** wrong on ${scene.fresh}.

            **What is the most likely diagnosis?**
          `,
          options: [
            { text: 'Overfitting: it has latched on to details of its training data that do not carry over', correct: true },
            { text: 'The model is too simple to capture the pattern', why: `A model that is too simple does badly everywhere, on its training data too. Here the training error is only ${low}%.` },
            { text: 'The learning rate was too high', why: `With a learning rate that is too high, the training error bounces around or grows. It would not have come down to ${low}%.` },
            { text: `Nothing is wrong: ${low}% is an excellent result`, why: 'The training error is not what matters. What matters is how the model does on data it has not seen.' },
          ],
          explain: `A tiny error on the training data and a large one on fresh data is the signature of overfitting. The honest score is the ${high}%: the one measured on data the model was not trained on.`,
        };
      },
    },
    {
      id: 'teach-habits',
      type: 'info',
      title: 'Using these tools well',
      text: `
        None of this makes language models useless. They are remarkably good at drafting, explaining, summarising and translating.
        Treat one like a well-read assistant who sometimes misremembers and never mentions it.

        **Match the checking to the stakes.**

        - **Ideas and first drafts** need no checking. A poor idea costs nothing.
        - **A fact you will pass on or act upon** needs an independent source.
        - **A reference** must be opened, because it can be invented.
        - **Whatever you type** may be kept by the company running the tool. Know what you are sharing.
      `,
    },
    {
      id: 'good-habits',
      type: 'match',
      text: `
        You are using a chatbot. **Match each situation with the sensible habit.**
      `,
      pairs: [
        ['It gives you a figure for your report', 'Find the figure in a source you trust'],
        ['It names three articles as sources', 'Open each one and read what it says'],
        ['Your question includes private details', 'Leave out what you would not want stored'],
        ['You want ideas for a birthday party', 'Go ahead: a poor idea costs nothing'],
      ],
      explain: `
        The party ideas are the only case with nothing at stake. The figure and the three articles may be invented, so each needs
        a look at the real thing. And private details are best left out of a tool that may keep what you type.
      `,
    },
    {
      id: 'limits-facts',
      type: 'multi',
      review: true,
      text: 'Which of these statements are accurate?',
      options: [
        { text: 'A language model can state something false in a fluent, confident style', correct: true },
        { text: 'Skewed training data lead to skewed predictions', correct: true },
        { text: 'A model with no error at all on its training data can still do badly on new data', correct: true },
        { text: 'If a chatbot names a source, that source must exist', why: 'A reference is generated like everything else: as likely-looking text. Always open it.' },
        { text: 'When a model gets something wrong, it is trying to mislead you', why: 'There is no intent behind it. A wrong answer is a likely-looking continuation that happens to be false.' },
      ],
      explain: 'Fluent is not the same as true, the data shape the predictions, and only fresh data show how good a model really is.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: **“It sounded so sure of itself, it must be right.”**

        What would you tell them?
      `,
      model: `
        How sure it sounds tells you nothing. A language model is trained to produce likely continuations of text, not checked facts,
        and it writes everything, right or wrong, in the same fluent style.

        For anything that matters, check the claim against an independent source. And if it names its sources, open them.
      `,
    },
  ],
  recap: [
    'A language model is trained to produce *likely* text, not *true* text. It can be fluent, confident and wrong.',
    'Models reproduce the patterns in their training data, including its skews and gaps.',
    '**Overfitting** is memorising the training data instead of the pattern. Only data the model has not seen can reveal it.',
    'Use these tools freely for drafts and ideas. Check the facts that matter, open the sources, and mind what you share.',
  ],
  next: 'That is the whole arc: weights, error, descent, layers, next-token prediction, and their limits. You can now open the box.',
};
