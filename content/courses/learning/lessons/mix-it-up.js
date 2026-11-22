// How to Learn Anything · Lesson 3 · Mix It Up

export default {
  id: 'mix-it-up',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Tidy practice or messy practice?',
      text: `
        Two students learn four new kinds of maths problem and do the same 16 practice questions.

        - **Blake** does them in blocks: all the type A questions, then all the Bs, then Cs, then Ds.
        - **Mika** gets the same questions shuffled together.

        **Who does better on a surprise test one week later?**
      `,
      shuffle: false,
      options: [
        { text: 'Blake (practised in blocks)' },
        { text: 'Mika (practised a shuffled mix)', correct: true },
        { text: 'About the same: they did identical questions' },
      ],
      explain: `
        Mika, by a wide margin. In a well-known study of exactly this set-up (Rohrer & Taylor, 2007),
        students who practised a shuffled mix scored **63%** a week later. Those who practised
        in blocks scored **20%**.
      `,
    },
    {
      id: 'data',
      type: 'info',
      title: 'It did not look that way at the time',
      text: `
        During the practice session itself, the picture was reversed. The block practisers got far
        more questions right, and the mixers struggled.

        If you had judged by how practice was going, you would have picked the wrong method.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 20, unit: '%', yLabel: 'questions correct',
        categories: ['During practice', 'Test a week later'],
        series: [
          { name: 'Blocked (AAAA BBBB …)', color: 'gray', values: [89, 20] },
          { name: 'Mixed (shuffled)', color: 'green', values: [60, 63] },
        ],
        alt: 'Bar chart. During practice: blocked 89 percent, mixed 60 percent. On the test a week later: blocked 20 percent, mixed 63 percent.',
        caption: 'Results from Rohrer & Taylor (2007).',
      },
    },
    {
      id: 'feel-blocked',
      type: 'numeric',
      title: 'Feel the difference',
      text: `
        Here is "blocked" practice. This problem, like the two before it in your imaginary worksheet, is solved by **multiplying**.

        *A recipe needs 3 eggs per cake. How many eggs for 7 cakes?*
      `,
      answer: 21,
      unit: 'eggs',
      explain: 'Easy — and notice *why* it was easy. You were told the method. All you had to do was carry it out.',
    },
    {
      id: 'feel-mixed',
      type: 'bucket',
      text: 'Now a shuffled set. Nobody tells you the method. **Which operation does each problem need?**',
      buckets: ['Add', 'Subtract', 'Multiply', 'Divide'],
      items: [
        { text: 'A 15 cm ribbon is joined to a 28 cm ribbon. Total length?', bucket: 0 },
        { text: 'You had 40 stickers and gave away 12. How many are left?', bucket: 1 },
        { text: '6 rows of chairs with 9 chairs in each row. How many chairs?', bucket: 2 },
        { text: '24 biscuits are shared equally among 6 children. How many each?', bucket: 3 },
        { text: 'A bus has 31 passengers; 8 get off. How many remain?', bucket: 1 },
        { text: 'Tickets cost 7 coins each. What do 5 tickets cost?', bucket: 2 },
      ],
      explain: `
        Harder than the eggs, although every sum here is just as simple. The difference was not
        the arithmetic. The next screen says what it was.
      `,
    },
    {
      id: 'teach-mixing',
      type: 'info',
      title: 'Blocked and mixed',
      text: `
        | Practice | Order | What you must do |
        |---|---|---|
        | **Blocked** | AAABBB | Carry out the method |
        | **Mixed** | ABBABA | **Choose** the method, then carry it out |

        In the shuffled set you did something extra: you had to **decide what kind of problem
        each one was**. Blocked practice never asks for that, and on a real test nobody tells
        you the method.

        Researchers call mixed practice **interleaving**.
      `,
    },
    {
      id: 'what-trains',
      type: 'choice',
      review: true,
      text: 'What does mixed practice train that blocked practice leaves out?',
      options: [
        { text: 'Recognising which method a problem calls for', correct: true },
        { text: 'Carrying out each method quickly', why: 'Blocked practice actually gives *more* smooth repetition of each method. What it skips is choosing between them.' },
        { text: 'Memorising the answers to the practice questions', why: 'Neither kind of practice is about memorising answers.' },
        { text: 'Working without making mistakes', why: 'Mixed practice produces more mistakes during practice, not fewer.' },
      ],
      explain: `
        Knowing *how* to use a tool is half the skill. Knowing *when* to use it is the other half,
        and you only practise that when different kinds of problem are side by side.
      `,
    },
    {
      id: 'desirable',
      type: 'info',
      title: 'Desirable difficulties',
      text: `
        Spacing, self-testing and mixing have something in common. Each one makes practice feel
        **harder and slower** — and makes the learning **last longer**.

        The psychologist Robert Bjork named these *desirable difficulties*.

        :::warn
        Not every difficulty is desirable. A noisy room, a confusing explanation or material far
        beyond your level is just difficult. The useful kind makes you **think harder about the
        thing you are trying to learn**.
        :::
      `,
    },
    {
      id: 'sort-difficulty',
      type: 'bucket',
      review: true,
      text: 'Which of these difficulties help learning, and which only get in the way?',
      buckets: ['Desirable', 'Just difficult'],
      items: [
        { text: 'Leaving a gap before you review', bucket: 0 },
        { text: 'Testing yourself instead of re-reading', bucket: 0 },
        { text: 'Mixing different kinds of problem', bucket: 0 },
        { text: 'Making a guess before you are told the answer', bucket: 0 },
        { text: 'Studying with a video playing next to you', bucket: 1, why: 'Distraction takes effort away from the material instead of pointing more effort at it.' },
        { text: 'Studying when you are exhausted', bucket: 1, why: 'Tiredness makes everything harder without making any of it stick.' },
        { text: 'Notes too messy to read', bucket: 1, why: 'The struggle here is with the handwriting, not with the ideas.' },
      ],
      explain: 'The test: does the difficulty make you **retrieve, compare or work out** the material itself? If so, it is probably helping.',
    },
    {
      id: 'schedule',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [a, b, c] = rng.pick([
          ['fractions', 'percentages', 'ratios'],
          ['past tense', 'future tense', 'conditionals'],
          ['forehands', 'backhands', 'serves'],
          ['major scales', 'minor scales', 'arpeggios'],
        ]);
        return {
          text: `This week you want to get better at three things: **A** (${a}), **B** (${b}) and **C** (${c}). You have time for 12 practice items. Which plan is best for long-term skill?`,
          options: [
            { text: 'A A A A B B B B C C C C', why: 'Tidy blocks feel smooth, but you never practise telling the three apart.' },
            { text: 'B A C C A B A C B B C A', correct: true },
            { text: 'A A A A A A A A A A A A, then B and C next week', why: 'A whole week on one skill gives the others seven days to fade — and no practice at choosing.' },
            { text: 'Only whichever of the three feels easiest', why: 'Comfortable, but it avoids exactly the practice you need most.' },
          ],
        };
      },
      explain: 'Shuffle them. Every switch makes you ask "which one is this?", and each skill gets revisited after a gap, so you get spacing for free.',
    },
    {
      id: 'illusion',
      type: 'choice',
      text: `
        In another experiment, people learned to recognise different painters' styles, some in blocks and some mixed.
        Most of them learned better from the **mixed** practice.

        Afterwards they were asked which method had worked better for them. Remember how each
        kind of practice *feels* while you are doing it. **What did most of them say?**
      `,
      options: [
        { text: 'That blocked practice had worked at least as well, or better', correct: true },
        { text: 'That mixed practice had worked better', why: 'That is what their own test scores showed — but it is not what they believed.' },
        { text: 'That they could not tell', why: 'Most were confident. They were also wrong.' },
      ],
      explain: `
        Most still judged blocking to be as good or better (Kornell & Bjork, 2008), *even after* doing better
        with mixing. Smooth practice feels like progress. That feeling is not evidence.
      `,
    },
    {
      id: 'recall-number',
      type: 'slider',
      text: 'From the start of this lesson: block practisers scored 20% on the test a week later. **What did the mixed practisers score?**',
      min: 0, max: 100, step: 1, answer: 63, tolerance: 10, unit: '%', start: 0,
      explain: 'About 63% — roughly three times as much, from the same questions in a different order.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'Practice can go badly and still be producing strong learning', correct: true },
        { text: 'Mixing problem types teaches you to choose the right method', correct: true },
        { text: 'How easy practice feels is a reliable sign of how much you are learning', why: 'It is often the opposite: ease during practice can mean little is being built.' },
        { text: 'You should finish every bit of one topic before touching the next', why: 'Coming back to a topic after working on others is what makes it stick.' },
      ],
      explain: 'Judge a study method by what you can do **later**, not by how it feels **now**.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Learntopia's review sessions deliberately mix questions from every course you have studied.

        **In your own words: why is that better than reviewing one course at a time?**
      `,
      model: `
        Because each question arrives without a label. You have to work out what kind of problem it is
        and which idea applies, which is exactly what real problems demand. Mixed review also spaces
        each topic out automatically. It feels harder than a tidy block — and that is the point.
      `,
    },
  ],
  recap: [
    'Mixing problem types beats practising in tidy blocks, even though it feels worse.',
    'Mixed practice trains the missing skill: recognising **which** method a problem needs.',
    'Spacing, self-testing and mixing are *desirable difficulties*: harder now, stronger later.',
    'How smooth practice feels is not a measure of how much you are learning.',
  ],
  next: 'Next: how to tell what you really know from what merely feels familiar.',
};
