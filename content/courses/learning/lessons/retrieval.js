// How to Learn Anything · Lesson 2 · Pull, Don't Push

export default {
  id: 'retrieval',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'Read it again, or close the book?',
      text: `
        Two groups of students studied the same short science text.

        - **Group A** read it four times.
        - **Group B** read it once, then closed it and wrote down everything they could remember — three times.

        A week later both groups took a test. **Drag the bars** to show how much you think each group remembered.
      `,
      widget: {
        type: 'bars', adjust: true, step: 5, yMax: 100, yStep: 20, unit: '%', yLabel: 'remembered after a week',
        data: [
          { label: 'A: read it\n4 times', value: 50, color: 'gray' },
          { label: 'B: read once,\nrecalled 3 times', value: 50, color: 'orange' },
        ],
        alt: 'Two adjustable bars: group A, who read the text four times, and group B, who read it once and recalled it three times.',
      },
      check: (s) => s.values[0][1] > s.values[0][0],
      solution: { values: [[40, 60]] },
      explain: `
        In the original experiment (Roediger & Karpicke, 2006) the re-readers remembered about **40%**.
        The students who practised *recalling* remembered about **60%** — half as much again, from the
        same amount of study time.
      `,
    },
    {
      id: 'twist',
      type: 'info',
      title: 'The twist',
      text: `
        Here is what makes this result so easy to miss. The researchers also tested
        some students after only **five minutes**.

        After five minutes, the re-readers were slightly *ahead*.
        Re-reading wins the sprint and loses the marathon.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 20, unit: '%', yLabel: 'remembered',
        categories: ['After 5 minutes', 'After 1 week'],
        series: [
          { name: 'Read 4 times', color: 'gray', values: [83, 40] },
          { name: 'Read once, recalled 3 times', color: 'orange', values: [71, 61] },
        ],
        alt: 'Bar chart. After 5 minutes: re-readers 83 percent, recallers 71 percent. After 1 week: re-readers 40 percent, recallers 61 percent.',
        caption: 'Results from Roediger & Karpicke (2006), Experiment 2.',
      },
    },
    {
      id: 'confidence',
      type: 'choice',
      text: `
        Before the final test, the students were asked to predict how well they would remember the text.

        Think about how each method felt. By the fourth reading, every sentence looked smooth and
        familiar. Recalling with the book closed was a strain, full of gaps.

        **Which group was more confident?**
      `,
      options: [
        { text: 'Group A, the re-readers', correct: true },
        { text: 'Group B, who practised recalling', why: 'Recalling felt hard, so these students felt *less* sure, even though they had learned more.' },
        { text: 'Both were equally confident', why: 'There was a clear difference, and it pointed the wrong way.' },
      ],
      explain: `
        The re-readers expected to do better. People judge their learning by how easy it feels,
        and **familiar feels like learned**. It is not. Psychologists call this the *illusion of fluency*.
      `,
    },
    {
      id: 'words',
      type: 'info',
      title: 'Try it on yourself',
      text: `
        Here are four made-up words. Read them **once**, carefully. You will need them in a moment.

        - **blick** — a spark too small to see
        - **wug** — a bird that walks backwards
        - **dax** — to sneeze very quietly
        - **fep** — the smell of rain on warm ground
      `,
      cta: 'I have read them',
    },
    {
      id: 'recall-1',
      type: 'match',
      graded: false,
      text: 'No peeking. **Match each word to its meaning.**',
      pairs: [
        ['blick', 'a spark too small to see'],
        ['wug', 'a bird that walks backwards'],
        ['dax', 'to sneeze very quietly'],
        ['fep', 'the smell of rain on warm ground'],
      ],
      explain: `
        Notice how that felt: a small strain, a moment of searching. You have just done what
        Group B did. The next screen gives it a name.
      `,
    },
    {
      id: 'teach-pull',
      type: 'info',
      title: 'Pull, don’t push',
      text: `
        Pulling an answer out of your own memory is called **retrieval practice**. The strain
        you felt is not a sign that learning failed. **It is the learning**: each time you pull
        a memory out, you make it easier to find next time.

        | | What happens | Example |
        |---|---|---|
        | **Pull** | The answer is hidden and you produce it | Cover the page, say what was on it, then check |
        | **Push** | The answer goes past your eyes again | Read the page once more |

        Pushing feels smoother. Pulling is what builds the memory.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'Some study habits **pull** knowledge out of your head. Others just **push** it past your eyes again. Sort these.',
      buckets: ['Pull (retrieval)', 'Push (re-exposure)'],
      items: [
        { text: 'Close the book and write down what you remember', bucket: 0 },
        { text: 'Answer practice questions', bucket: 0 },
        { text: 'Explain it to a friend from memory', bucket: 0 },
        { text: 'Flashcards: answer before you flip', bucket: 0 },
        { text: 'Re-read the chapter', bucket: 1 },
        { text: 'Highlight the key sentences', bucket: 1, why: 'Highlighting keeps your eyes on the page, but nothing is being recalled.' },
        { text: 'Copy out your notes neatly', bucket: 1, why: 'Copying can be done without thinking about the meaning at all.' },
        { text: 'Watch the lecture a second time', bucket: 1 },
      ],
      explain: 'The pull habits all have one thing in common: for a moment, the answer is **not in front of you** and you have to produce it.',
    },
    {
      id: 'teach-errors',
      type: 'info',
      title: 'A wrong answer still helps',
      text: `
        What if you try to recall something, or guess before you have been told, and get it
        **wrong**? As long as you then see the correct answer, you remember it *better* than if
        you had only read it. Your mind was already searching, so the answer has somewhere to land.

        :::note How far this goes
        Guessing first helps most with understanding ideas. A meta-analysis, a study that pools
        many studies, found little or no benefit for step-by-step procedures or for younger
        learners (Sinha & Kapur, 2021).
        :::

        So Learntopia opens most lessons with **one** guess, never marked wrong. After that, each
        idea is shown on a short "Learn" screen before you are asked to use it.
      `,
    },
    {
      id: 'errors',
      type: 'choice',
      text: `
        You cover your notes and try to name the three causes listed on the page. You get one of
        them **wrong**, then uncover the notes and see the correct one.

        Compared with simply reading the notes again, how well will you remember that cause?
      `,
      options: [
        { text: 'Better', correct: true },
        { text: 'Worse: the wrong answer gets stuck in memory', why: 'A reasonable worry, but studies find the opposite, as long as you see the correct answer afterwards.' },
        { text: 'About the same', why: 'The failed attempt is not wasted: it measurably helps.' },
      ],
      explain: `
        Better. A failed attempt, followed by feedback, beats passive reading. The feedback is the
        part that matters: always check your answer.
      `,
    },
    {
      id: 'plan',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { topic: 'chapter 5', event: 'tomorrow’s quiz' },
          { topic: 'a list of 20 vocabulary words', event: 'a test on Friday' },
          { topic: 'the steps of a lab procedure', event: 'a practical exam' },
          { topic: 'your notes on the French Revolution', event: 'an essay test' },
        ]);
        const mins = rng.pick([20, 30, 40]);
        return {
          text: `You have **${mins} minutes** to prepare for ${scene.event} on ${scene.topic}. Which plan will leave you remembering the most?`,
          options: [
            { text: 'Read it through as many times as you can', why: 'It will feel productive, and most of it will be gone in a few days.' },
            { text: 'Read it once, then cover it, test yourself, and check what you missed', correct: true },
            { text: 'Go through it with a highlighter', why: 'Highlighting is still re-exposure: nothing is being pulled from memory.' },
            { text: 'Copy the important parts into a fresh notebook', why: 'Neat notes are satisfying, but copying does not require recall.' },
          ],
        };
      },
      explain: 'Read once, then **retrieve and check**. The checking matters: it tells you exactly what to look at again.',
    },
    {
      id: 'recall-2',
      type: 'choice',
      text: 'A few minutes have passed. Which of the made-up words meant **“to sneeze very quietly”**?',
      options: [
        { text: 'dax', correct: true },
        { text: 'blick', why: 'A *blick* was a spark too small to see.' },
        { text: 'wug', why: 'A *wug* was a bird that walks backwards.' },
        { text: 'fep', why: '*Fep* was the smell of rain on warm ground.' },
      ],
      explain: `
        That is your second retrieval of a word you read exactly once. You probably know *dax*
        better right now than if you had read the list five times.
      `,
    },
    {
      id: 'number',
      type: 'slider',
      text: `
        One more retrieval, from the start of this lesson. The re-readers remembered about 40% after a week.
        **Roughly what did the students who practised recalling remember?**
      `,
      min: 0, max: 100, step: 5, answer: 60, tolerance: 10, unit: '%', start: 0,
      explain: 'About 60%. And you have just made that fact more memorable by recalling it instead of scrolling back.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'Testing yourself is a way to learn, not just a way to measure learning', correct: true },
        { text: 'A study method can feel easy and still work poorly', correct: true },
        { text: 'If recalling something feels hard, you should stop and re-read it instead', why: 'The difficulty is what does the work. Try first, then check.' },
        { text: 'Getting an answer wrong while practising harms your memory of the right one', why: 'Not when you see the correct answer afterwards. Errors followed by feedback help.' },
      ],
      explain: 'The feeling of effort is a poor guide to what is working. Effortful recall, then feedback, is the reliable recipe.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of something you are learning right now.

        **What is one way you could turn re-reading it into retrieval?**
      `,
      model: `
        Anything where the answer is hidden for a moment: cover your notes and write down the main points;
        turn headings into questions and answer them aloud; do the practice problems with your notes
        closed; explain the idea to someone else. Then check what you missed.
      `,
    },
  ],
  recap: [
    'Recalling an idea strengthens it far more than reading it again.',
    'Re-reading feels effective because the page looks familiar. Familiar is not the same as learned.',
    'A wrong attempt followed by the right answer still helps you learn.',
    'Good habits hide the answer for a moment: self-quizzing, practice problems, explaining from memory.',
  ],
  next: 'Next: why practice that feels messy can beat practice that feels smooth.',
};
