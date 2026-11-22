// How to Learn Anything · Lesson 6 · The Narrow Doorway

export default {
  id: 'narrow-doorway',
  steps: [
    {
      id: 'span',
      type: 'interact',
      graded: false,
      title: 'How much can you hold?',
      text: `
        A quick test of your own memory. You will see a row of digits for a few seconds.
        Then they vanish, and you type them back in order.

        **Play all four rounds.** Each one is longer than the last.
      `,
      widget: { type: 'memory-span', lengths: [4, 6, 8, 10], alt: 'A memory test: digits are shown briefly, then typed back from memory.' },
      check: (s) => s.done || 'Play all four rounds to see your results.',
      solution: { done: true, results: [{ correct: true }, { correct: true }, { correct: false, right: 5 }, { correct: false, right: 4 }] },
      explain: `
        Four digits: easy. Six: fine. Somewhere around **seven**, most adults begin to drop
        digits, and ten is out of reach for almost everyone at the first attempt.

        You have just found the edge of your **working memory**.
      `,
    },
    {
      id: 'workspace',
      type: 'info',
      title: 'A very small workspace',
      text: `
        **Working memory** is the mental workspace that holds whatever you are thinking about
        *right now*. It is astonishingly small.

        - It holds about **seven digits**, and only about **four** unrelated ideas at a time.
        - It holds them for a few seconds, unless you keep repeating them.
        - Training it directly does very little. People who get much better at tests like the one
          you just did turn out to be using a trick, not a bigger workspace.

        Your long-term memory, by contrast, is enormous. But everything you learn has to pass
        through working memory to get there.

        :::key
        Working memory is a narrow doorway into a very large house.
        :::
      `,
    },
    {
      id: 'chunks',
      type: 'interact',
      graded: false,
      title: 'The trick',
      text: `
        Two more rounds. Each has **twelve letters**, and you get the same six seconds for both.
      `,
      widget: {
        type: 'memory-span',
        rounds: [
          { show: 'QXJZKVWPRMTB', label: 'Twelve letters', seconds: 6 },
          { show: 'TREE MOON FISH', label: 'Twelve more letters', seconds: 6 },
        ],
        alt: 'A memory test with two rounds of twelve letters each.',
      },
      check: (s) => s.done || 'Play both rounds to see your results.',
      solution: { done: true, results: [{ correct: false, right: 4 }, { correct: true }] },
      explain: `
        Same number of letters, same six seconds, and a very different result. The next screen
        explains why the second round was so much easier.
      `,
    },
    {
      id: 'teach-chunks',
      type: 'info',
      title: 'Chunks',
      text: `
        Twelve random letters are far beyond anybody's working memory. *TREE MOON FISH* is twelve
        letters as well, but only **three things** to hold, because each word already lives in
        your long-term memory as a single unit.

        Such a unit is called a **chunk**. Working memory does not count letters or digits.
        It counts chunks.

        :::example
        **314159** is six digits to hold.

        Read as **314 159**, it is two groups: **2 chunks**.
        :::
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 150', maxWidth: 400,
        alt: 'Top row: the twelve letters Q X J Z K V W P R M T B, each in its own small box, twelve things to hold. Bottom row: three larger boxes holding the words TREE, MOON and FISH, three things to hold.',
        content:
          'QXJZKVWPRMTB'.split('').map((c, i) =>
            `<rect class="fill-gray-soft stroke-ink" stroke-width="1.5" x="${6 + i * 29}" y="10" width="26" height="34" rx="6"/>` +
            `<text class="fig-label" x="${19 + i * 29}" y="33" text-anchor="middle">${c}</text>`).join('') +
          '<text class="fig-label text-muted" x="180" y="64" text-anchor="middle">12 letters, 12 things to hold</text>' +
          ['TREE', 'MOON', 'FISH'].map((w, i) =>
            `<rect class="fill-orange-soft stroke-ink" stroke-width="2.5" x="${22 + i * 110}" y="82" width="96" height="38" rx="10"/>` +
            `<text class="fig-label" x="${70 + i * 110}" y="107" text-anchor="middle">${w}</text>`).join('') +
          '<text class="fig-label text-muted" x="180" y="142" text-anchor="middle">12 letters, 3 chunks</text>',
      },
    },
    {
      id: 'chess',
      type: 'choice',
      mode: 'predict',
      text: `
        Chess masters can look at a position from a real game for five seconds and then rebuild
        almost the whole board from memory. Beginners manage only a few pieces.

        Researchers repeated the test with the pieces placed **at random**.
        **How did the masters do then?**
      `,
      shuffle: false,
      options: [
        { text: 'Still far better than the beginners: masters have superior memories' },
        { text: 'Barely better than the beginners', correct: true },
        { text: 'About half as well as before, still well ahead' },
      ],
      explain: `
        On random boards the masters' advantage all but vanished (Chase & Simon, 1973). Their
        memory is no bigger than yours. What they have is thousands of familiar patterns, built
        up over years of play, so a real position is a handful of chunks to them and two dozen
        separate pieces to a beginner.

        **Knowledge is what makes the doorway seem wider.**
      `,
    },
    {
      id: 'count-chunks',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [n, size] = rng.pick([[8, 4], [9, 3], [10, 5], [12, 3], [12, 4], [10, 2]]);
        let digits = String(rng.int(1, 9));
        while (digits.length < n) digits += String(rng.int(0, 9));
        const groups = [];
        for (let i = 0; i < n; i += size) groups.push(digits.slice(i, i + size));
        const answer = n / size;
        return {
          text: `
            The number **${digits}** has ${n} digits: too many to hold comfortably.

            So you read it in groups instead: **${groups.join(' ')}**.
            How many chunks do you have to hold now?
          `,
          answer,
          unit: 'chunks',
          wrong: [
            [n, 'That is the number of digits. Count the groups instead.'],
            [size, 'That is how many digits are in each group. How many groups are there?'],
          ],
          hints: ['Count the groups that are separated by spaces.'],
          explain: `${n} digits in groups of ${size} make **${answer} chunks**, which fits. It is why phone numbers and card numbers are printed in groups.`,
        };
      },
    },
    {
      id: 'overload',
      type: 'info',
      title: 'Why new things feel overwhelming',
      text: `
        When a subject is new, you have no chunks for it yet. Every symbol, every term and every
        step takes a slot of its own, and four slots fill up fast. That swamped feeling has a
        name: **cognitive overload**.

        It is not a sign that you lack talent. It is what a full doorway feels like.

        And it passes. A skill you have practised until it takes no thought has become one
        chunk, and the slots are free again for something new.

        :::key
        Overload means too much is new at once, not that you are not clever enough.
        :::
      `,
    },
    {
      id: 'worked',
      type: 'choice',
      mode: 'predict',
      text: `
        Two groups of beginners are learning a new kind of algebra problem.

        - **Group A** solves eight practice problems.
        - **Group B** studies four *worked solutions*, each followed by one similar problem to solve.

        **Which group does better on a test afterwards?**
      `,
      shuffle: false,
      options: [
        { text: 'Group A: they solved twice as many problems' },
        { text: 'Group B: fewer problems, but with worked solutions', correct: true },
        { text: 'About the same' },
      ],
      explain: `
        Group B. In the experiments this question is modelled on (Sweller & Cooper, 1985), students
        who studied worked examples needed less time to learn, and afterwards solved similar
        problems faster and with fewer mistakes.
      `,
    },
    {
      id: 'teach-worked',
      type: 'info',
      title: 'Examples first, then let go',
      text: `
        This is the **worked-example effect**. A beginner facing an unfamiliar problem has to
        juggle the goal, the given numbers and a pile of half-tried ideas, so working memory is
        full before any learning can happen. A worked solution carries that load. Attention is
        free for what matters: *why each step follows*.

        So beginners learn new material best from clear explanation and worked examples
        (Kirschner, Sweller & Clark, 2006). The help should then **fade** as you improve
        (Kalyuga and colleagues, 2003): support that a beginner needs becomes dead weight once
        you know the method.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 150', maxWidth: 400,
        alt: 'Three stages of fading help. Stage 1, study: all three steps of a solution are shown to you. Stage 2, finish: two steps are shown and you do the last one. Stage 3, solve: you do all three steps yourself.',
        content:
          [['1. Study', [0, 0, 0]], ['2. Finish', [0, 0, 1]], ['3. Solve', [1, 1, 1]]].map(([title, rows], c) =>
            `<text class="fig-label" x="${62 + c * 118}" y="22" text-anchor="middle">${title}</text>` +
            rows.map((you, k) =>
              `<rect class="${you ? 'fill-orange-soft' : 'fill-blue-soft'} stroke-ink" stroke-width="2" x="${10 + c * 118}" y="${34 + k * 38}" width="104" height="30" rx="8"/>` +
              `<text class="fig-label" x="${62 + c * 118}" y="${55 + k * 38}" text-anchor="middle">${you ? 'you' : 'shown'}</text>`).join('')).join(''),
        caption: 'Each column is one problem with three steps. The help fades from left to right.',
      },
    },
    {
      id: 'fit-together',
      type: 'choice',
      title: 'Hold on…',
      text: `
        Lesson 2 said *pull, don't push*: test yourself instead of reading. Now reading worked
        solutions is supposed to be good.

        **How do the two fit together?**
      `,
      options: [
        { text: 'Worked solutions are for when a topic is brand new. Once you have the idea, switch to solving and recalling', correct: true },
        { text: 'They do not fit: one of the two findings must be wrong', why: 'Both are well established. They apply at different stages of learning.' },
        { text: 'Worked solutions are for maths, self-testing is for facts', why: 'Both work across subjects. What decides between them is how much you already know.' },
        { text: 'Always study a worked solution first, even for things you know well', why: 'For someone who already knows the method, studying examples adds little. Solving and recalling do more.' },
      ],
      explain: `
        Both findings are sound. They belong to different stages: first study a complete
        solution, then finish one with a step missing, then solve the whole thing yourself and
        keep recalling it.

        So: **examples to get started, retrieval to make it last.**
      `,
    },
    {
      id: 'teach-load',
      type: 'info',
      title: 'Lighten the load',
      text: `
        When you feel overloaded, there are two things to do: move something **out of your
        head**, or let **less in at once**.

        | Move | Why it helps |
        |---|---|
        | Shrink the step | Only one new thing comes in at a time |
        | Write things down | Paper is spare working memory |
        | Practise the basics until automatic | An automatic skill is a single chunk |
        | Keep words and picture side by side | No slots are spent hunting for the other half |
        | Cut out competing words | Song lyrics fight the words you are reading |
      `,
    },
    {
      id: 'load-sort',
      type: 'bucket',
      review: true,
      text: 'Which of these **lighten** the load on working memory while you study, and which **add** to it?',
      buckets: ['Lightens the load', 'Adds to the load'],
      items: [
        { text: 'Writing intermediate results down as you go', bucket: 0 },
        { text: 'Taking in one new idea at a time', bucket: 0 },
        { text: 'Labels placed right on the diagram', bucket: 0 },
        { text: 'Practising basic steps until they are automatic', bucket: 0 },
        { text: 'A diagram on one page and its explanation on another', bucket: 1, why: 'Holding one in mind while you hunt for the other uses up slots. Keep things that belong together side by side.' },
        { text: 'Songs with lyrics playing while you read', bucket: 1, why: 'The words in the song compete with the words on the page for the same part of working memory.' },
        { text: 'Three new methods in one sitting', bucket: 1 },
        { text: 'Doing a long calculation entirely in your head', bucket: 1 },
      ],
      explain: 'Everything in the first group either moves something out of your head or makes sure that only one new thing is in it.',
    },
    {
      id: 'swamped',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const thing = rng.pick([
          'equations with fractions',
          'chord changes on the guitar',
          'your first programming language',
          'the past tenses in Spanish',
        ]);
        return {
          text: `You are learning **${thing}** and feel completely swamped: you can no longer even follow the solutions. **What is the best next move?**`,
          options: [
            { text: 'Drop back to a smaller piece and go through one worked example slowly', correct: true },
            { text: 'Keep attempting full-size problems: struggling is good for you', why: 'Struggle helps only when you can make *some* headway. With working memory overloaded, nothing is left over to learn with.' },
            { text: 'Read the whole chapter again from the start', why: 'That overloads you again in the same places. Find the first step that loses you and work on that.' },
            { text: 'Accept that you have no talent for it', why: 'Overload comes from how much is new at once, not from ability. Everyone is swamped when everything is unfamiliar.' },
          ],
        };
      },
      explain: 'A difficulty is *desirable* only if you can get past it with effort. When you are swamped, make the step smaller until you can.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'Working memory holds only a few items at a time', correct: true },
        { text: 'Experts remember more in their own field because they see patterns, not because their memory is bigger', correct: true },
        { text: 'Feeling overwhelmed by a new subject shows that you are not suited to it', why: 'It shows that a lot is new at once. Smaller steps fix that; talent has nothing to do with it.' },
        { text: 'A complete beginner learns a method best by solving as many problems as possible without looking at any solutions', why: 'For beginners, studying worked solutions and then solving similar problems works better. Unaided solving comes into its own later.' },
      ],
      explain: 'The doorway stays narrow for everyone. What changes with learning is the size of the parcels you carry through it.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of something you now do without thinking, although it once took all your
        concentration: reading, typing, riding a bike, mental arithmetic.

        **What does that tell you about a subject that overwhelms you today?**
      `,
      model: `
        That overwhelm is temporary. Reading once meant sounding out single letters; now whole
        words arrive at a glance, because years of practice packed the letters into chunks.

        The same will happen with anything you practise in small enough steps. The subject does
        not get simpler. You get bigger chunks.
      `,
    },
  ],
  recap: [
    'Working memory is tiny: about four unrelated things at once.',
    'It counts chunks, not letters or digits. Knowledge packs many details into one chunk.',
    'Overload means too much is new at once. Shrink the step, write things down, automate the basics.',
    'Worked examples to get started, retrieval practice to make it last.',
  ],
  next: 'Next: what happens when you ask that small workspace to do two things at once.',
};
