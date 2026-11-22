// How to Learn Anything · Lesson 7 · One Thing at a Time

export default {
  id: 'one-thing',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Sixteen taps, twice',
      text: `
        In a moment you will tap sixteen tiles, in two different orders.

        - **Round 1:** the numbers 1 to 8, then the letters A to H.
        - **Round 2:** the same tiles, but alternating: 1, A, 2, B, 3, C …

        You know your numbers and your alphabet equally well in both rounds.
        **How will round 2 compare with round 1?**
      `,
      shuffle: false,
      options: [
        { text: 'A little faster: I will have had practice' },
        { text: 'About the same' },
        { text: 'Clearly slower' },
      ],
      explain: 'Keep your guess in mind. The experiment is next, and you are the subject.',
    },
    {
      id: 'experiment',
      type: 'interact',
      graded: false,
      title: 'Run the experiment',
      text: '**Play both rounds.** Go as fast as you can without making mistakes.',
      widget: { type: 'switch-cost', alt: 'A tapping experiment with sixteen tiles, played in two rounds.' },
      check: (s) => s.done || 'Finish both rounds to see your result.',
      solution: { done: true, single: 9, switching: 13.5 },
      explain: `
        Most people are clearly slower in round 2, even though it comes second and the tiles
        are the same. Compare your two bars: the next screen says where the extra time went.
      `,
    },
    {
      id: 'switching',
      type: 'info',
      title: 'There is no multitasking',
      text: `
        In round 2 your brain had to keep **dropping one sequence and picking up the other**,
        sixteen times over. The gap between your two bars is the sum of those switches.

        When two tasks both need thought, the brain does not do them at the same time. It
        **switches** between them, and every switch has a price:

        - a moment to drop one task and reload the other,
        - more mistakes,
        - and a part of your attention that stays behind with the task you just left.

        Practice shrinks the price. It never removes it. Reading a textbook while answering
        messages costs the same. You just cannot see it.

        :::key
        "Multitasking" is task switching, and switching is never free.
        :::
      `,
    },
    {
      id: 'lecture',
      type: 'choice',
      mode: 'predict',
      text: `
        In an experiment, some students in a lecture were asked to do small online tasks on their
        laptops while they took notes. Afterwards everyone was tested on the lecture.

        The multitaskers scored lower. **Who else did?**
      `,
      options: [
        { text: 'Students who could see a multitasker\'s screen from where they sat', correct: true },
        { text: 'Nobody else: it only affects the person doing it' },
        { text: 'Students who took notes on paper' },
        { text: 'Students at the back of the room' },
      ],
      explain: `
        Students who merely had a multitasker's screen **in view** scored clearly lower too
        (Sana, Weston & Cepeda, 2013). Paper notes and distance from the front were not the
        problem. A busy screen in view was.
      `,
    },
    {
      id: 'teach-remove',
      type: 'info',
      title: 'Do not resist it. Remove it.',
      text: `
        Movement and novelty pull at your attention whether you want them to or not. So the
        most reliable defence is not willpower. It is **arranging things so that the
        distraction is not there**.

        | Thief of attention | Remove the switch |
        |---|---|
        | Phone lighting up | Put it in another room, notifications off |
        | A stray thought or worry | Write it down, deal with it later |
        | Several tasks waiting | Choose one before you sit down |
        | An urge to check messages | Finish the problem first, then check |
      `,
    },
    {
      id: 'protect',
      type: 'bucket',
      review: true,
      text: 'Which of these **protect** your attention, and which **fragment** it?',
      buckets: ['Protects attention', 'Fragments attention'],
      items: [
        { text: 'Phone in another room while you study', bucket: 0 },
        { text: 'Notifications off for the next half hour', bucket: 0 },
        { text: 'Choosing one task before you sit down', bucket: 0 },
        { text: 'Jotting a stray thought on paper, then carrying on', bucket: 0 },
        { text: 'Replying to messages as they arrive', bucket: 1 },
        { text: 'A series playing in the background', bucket: 1 },
        { text: 'A chat window left open "just in case"', bucket: 1, why: 'Even unanswered, it invites a glance every few minutes, and every glance is a switch.' },
        { text: 'Checking your phone "for a second" between problems', bucket: 1, why: 'The second is rarely a second, and part of your attention stays with whatever you saw.' },
      ],
      explain: 'The protecting moves all work the same way: they remove the switch before it can happen, instead of asking you to resist it.',
    },
    {
      id: 'mixing',
      type: 'choice',
      title: 'Hold on…',
      text: `
        Lesson 3 said that **mixing** different kinds of problem in one session is good for
        learning: you finish one problem, and the next is of a different kind. This lesson
        says that switching is costly.

        **What is the difference?**
      `,
      options: [
        { text: 'In mixed practice every problem still gets your full attention. In multitasking, no task does', correct: true },
        { text: 'There is none: mixed practice is a kind of multitasking', why: 'In mixed practice you finish one problem before the next begins. Nothing is interrupted halfway.' },
        { text: 'Mixing is fine for maths, but not for other subjects', why: 'Mixed practice helps in many subjects. The real difference is what gets interrupted.' },
        { text: 'Mixed practice only works if you switch every few seconds', why: 'Speed is not the point. Each problem is worked through to the end before the next one starts.' },
      ],
      explain: `
        In mixed practice the change comes *between* problems, and working out which method the
        next one needs is exactly the skill being trained. In multitasking the change comes in the
        *middle* of a thought, and what it interrupts is the learning itself.
      `,
    },
    {
      id: 'rest',
      type: 'info',
      title: 'Rest is part of the work',
      text: `
        Attention runs down, and a break restores it. A common routine is about 25 minutes of
        work followed by 5 minutes away from the desk. The exact numbers matter far less than
        the two rules behind them: **one task while you work, a real break when you stop.**

        The longest break matters most. While you **sleep**, the brain goes back over the day and
        moves what you learned into long-term storage. This was first measured a century ago:
        people who learned a list and then slept remembered far more of it than people who learned
        it and stayed awake for the same number of hours (Jenkins & Dallenbach, 1924).

        :::key
        Sleep is not time taken away from learning. It is when much of the learning is saved.
        :::
      `,
    },
    {
      id: 'night-before',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { event: 'an exam', when: 'nine tomorrow morning' },
          { event: 'a presentation', when: 'ten tomorrow morning' },
          { event: 'your driving theory test', when: 'eight tomorrow morning' },
          { event: 'a job interview with a technical quiz', when: 'nine tomorrow morning' },
        ]);
        const hour = rng.pick(['midnight', 'half past eleven', 'nearly midnight']);
        return {
          text: `It is ${hour}. You have been preparing all evening for ${scene.event} at ${scene.when}, and you are getting tired. **What does the research suggest you do?**`,
          options: [
            { text: 'Stop now and sleep', correct: true },
            { text: 'Keep going until three in the morning: more hours, more learned', why: 'Tired hours teach little, and cutting sleep weakens both the saving of tonight\'s work and your thinking tomorrow.' },
            { text: 'Stay up all night and catch up on sleep afterwards', why: 'A night without sleep hits attention and recall hard, which are exactly what tomorrow needs.' },
            { text: 'It makes no difference either way', why: 'It does. Sleep is when much of this evening\'s learning is saved.' },
          ],
        };
      },
      explain: `
        Sleep does two jobs for you tonight. It helps to **save** what you studied this evening,
        and it restores the attention you will need to **recall** it in the morning. A few more
        tired hours cannot buy that back.
      `,
    },
    {
      id: 'fixes',
      type: 'match',
      text: 'Match each attention problem with the fix that fits it best.',
      pairs: [
        ['Your phone keeps lighting up', 'Put it in another room'],
        ['A worry keeps popping into your head', 'Write it down and deal with it later'],
        ['After 40 minutes you are reading without taking anything in', 'Take a short break away from the desk'],
        ['You want to check your messages in the middle of a problem', 'Finish the problem first, then check'],
      ],
      explain: 'None of these fixes needs more willpower. Each one changes the situation, so that less willpower is needed.',
    },
    {
      id: 'cost-sum',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const each = rng.pick([1, 2]);
        const times = rng.pick([6, 8, 10, 12, 15]);
        const answer = each * times;
        return {
          text: `
            Suppose every glance at your phone costs you **${each} minute${each === 1 ? '' : 's'}**
            before you are properly back inside the problem you were working on.

            During one hour of study you glance at it **${times} times**.
            How many minutes of that hour go on getting back into the work?
          `,
          answer,
          unit: 'minutes',
          wrong: [
            [60 - answer, 'That is the time left over. The question asks for the time lost.'],
            [times, each === 1 ? null : `That counts the glances. Each one costs ${each} minutes.`],
          ].filter((w) => w[1]),
          hints: [`${times} glances, ${each} minute${each === 1 ? '' : 's'} each.`],
          explain: `${times} × ${each} = **${answer} minutes**, out of sixty. The glances themselves took almost no time. Getting back took all of it.`,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'When two tasks need thought, the brain switches between them rather than doing both at once', correct: true },
        { text: 'A distraction in view affects you even when you try to ignore it', correct: true },
        { text: 'Sleep after studying helps to save what you learned', correct: true },
        { text: 'With enough practice, people can multitask at no cost', why: 'Practice shrinks the cost of switching. It never removes it.' },
        { text: 'Short breaks are wasted study time', why: 'A real break restores attention, so the next stretch of work is worth more.' },
      ],
      explain: 'Attention is the one thing every other learning technique depends on. Guard it, and rest it.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        What is the **biggest thief of your attention** when you try to learn something?

        **Describe one change to your surroundings that would deal with it.** A change to the
        situation, not a promise to try harder.
      `,
      model: `
        For example:

        - *My phone. From now on it stays in the hallway while I study, and I check it in the break.*
        - *The open browser tabs. I will study in a separate window with only the one tab I need.*

        The best answers remove the temptation instead of relying on resisting it.
      `,
    },
  ],
  recap: [
    'The brain does not multitask on things that need thought. It switches, and every switch costs time and accuracy.',
    'Distractions work even when you try to ignore them. Remove them instead of resisting them.',
    'Mixed practice is not multitasking: each problem still gets your full attention.',
    'Breaks restore attention, and sleep is when much of the day\'s learning is saved.',
  ],
  next: 'Next: putting every tool from this course into one system you will actually keep.',
};
