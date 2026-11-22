// How to Learn Anything · Lesson 1 · Why We Forget
import { plural } from '../../../kit.js';

export default {
  id: 'forgetting-curve',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Where does it all go?',
      text: `
        Tonight you study 20 new words until you can recite every one.
        Then you never look at them again.

        A week from now, how many will you probably still remember?
      `,
      shuffle: false,
      options: [
        { text: 'Nearly all 20' },
        { text: 'Around 15' },
        { text: '10 or fewer', correct: true },
      ],
      explain: `
        For most people and most material: **half or less** — often much less.
        That is not a flaw in *your* memory. It is how memory works, and once you
        know the pattern you can turn it to your advantage.
      `,
    },
    {
      id: 'curve',
      type: 'info',
      title: 'The forgetting curve',
      text: `
        In the 1880s, Hermann Ebbinghaus memorised lists of nonsense syllables and
        tested himself hours, days and weeks later. He was the first person to
        *measure* forgetting.

        His result has been repeated ever since. Here is the shape he found:
      `,
      figure: {
        type: 'memory-curve', days: 14, strength: 1, editable: false,
        alt: 'A curve that starts at 100 percent recall, drops steeply during the first days and then flattens out.',
        caption: 'Chance of recalling something you learned on day 0 and never reviewed.',
      },
    },
    {
      id: 'read-curve',
      type: 'choice',
      text: 'Look at the curve again. **When is forgetting fastest?**',
      figure: { type: 'memory-curve', days: 14, strength: 1, editable: false, alt: 'The same forgetting curve.' },
      options: [
        { text: 'Right after learning', correct: true, why: 'The curve is steepest at the very start.' },
        { text: 'After about a week', why: 'By then the curve has flattened: what is left fades slowly.' },
        { text: 'It is the same speed throughout', why: 'A constant speed would be a straight line. This curve bends.' },
      ],
      explain: `
        The steepest drop comes first. Most of what you will lose, you lose in the
        first day or two. So a first review cannot wait for weeks. As the next screens show, it should not come too soon either.
      `,
    },
    {
      id: 'try-review',
      type: 'interact',
      graded: false,
      title: 'Now fight back',
      text: `
        Here are the next 30 days of a fresh memory.

        **Tap the chart to add one review** — anywhere you like — and watch what
        happens to the curve *after* it.
      `,
      widget: { type: 'memory-curve', days: 30, strength: 1, budget: 1 },
      check: (s) => s.reviews.length === 1 || 'Tap somewhere on the chart to place a review.',
      solution: { reviews: [3] },
      explain: `
        Look at the curve on both sides of your review. Something changed, and it is
        not only the height. The next screen spells it out.
      `,
    },
    {
      id: 'teach-review',
      type: 'info',
      title: 'What a review does',
      text: `
        A **review** means recalling the thing again. It does two jobs at once:

        1. It lifts recall **back to 100%**.
        2. It makes the curve that follows **flatter**: the memory now fades more
           slowly than it did the first time.

        So forgetting does not mean the first effort was wasted. Relearning is much
        faster than learning from scratch, and each relearning makes the memory last longer.
      `,
      figure: {
        type: 'memory-curve', days: 30, strength: 1, editable: false, reviews: [3],
        alt: 'A forgetting curve with one review on day 3. Recall jumps back to 100 percent, and afterwards the curve falls more slowly than before.',
        caption: 'One review on day 3: back to the top, then a slower fall.',
      },
    },
    {
      id: 'timing',
      type: 'choice',
      text: `
        Both of these memories got exactly one review.
        **Which one is in better shape on day 30?**
      `,
      figure: [
        { type: 'memory-curve', days: 30, strength: 1, editable: false, reviews: [1], caption: 'A: reviewed on day 1', alt: 'Curve with one review on day 1.' },
        { type: 'memory-curve', days: 30, strength: 1, editable: false, reviews: [5], caption: 'B: reviewed on day 5', alt: 'Curve with one review on day 5.' },
      ],
      shuffle: false,
      options: [
        { text: 'A — the early review', why: 'Compare the right-hand ends of the two curves: B finishes higher.' },
        { text: 'B — the later review', correct: true },
        { text: 'They end up the same', why: 'Look closely at day 30: the curves end at different heights.' },
      ],
      hints: ['Read off the height of each curve at the far right, day 30.'],
      explain: `
        B wins. On day 1 there was almost nothing to rebuild, so the review added
        little. By day 5 the memory had faded a lot, and the review had real work to do.
      `,
    },
    {
      id: 'teach-spacing',
      type: 'info',
      title: 'Space it out',
      text: `
        **Retrieving a fading memory is what strengthens it most.** Wait too long,
        though, and there is nothing left to retrieve.

        So spread your reviews out, and let the **gaps grow**: after each review the
        curve is flatter, so the next one can wait longer. This is called **spacing**.

        Both plans shown here use three reviews in 20 days. Compare where they end.
      `,
      figure: [
        { type: 'memory-curve', days: 20, strength: 1, editable: false, reviews: [1, 2, 3], caption: 'Bunched: days 1, 2 and 3', alt: 'Curve with reviews on days 1, 2 and 3. After day 3 it falls steadily and ends day 20 at about 63 percent.' },
        { type: 'memory-curve', days: 20, strength: 1, editable: false, reviews: [2, 6, 15], caption: 'Spaced: days 2, 6 and 15', alt: 'Curve with reviews on days 2, 6 and 15. It never falls below about 81 percent and ends day 20 at about 94 percent.' },
      ],
    },
    {
      id: 'plan',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'a history exam', unit: 'study sessions' },
          { what: 'a driving theory test', unit: 'practice sessions' },
          { what: 'a talk you must give from memory', unit: 'rehearsals' },
          { what: 'a vocabulary quiz', unit: 'study sessions' },
        ]);
        const total = rng.pick([12, 14, 16]);
        return {
          text: `You have **${scene.what} in ${total} days** and time for exactly three ${scene.unit}. Which plan will leave you remembering the most on the day?`,
          options: [
            { text: 'All three today, back to back', why: 'Three reviews of a memory that has not faded add very little — and then it has two weeks to decay.' },
            { text: 'Today, tomorrow and the day after', why: 'Better than cramming, but the gaps are too short to build much, and nothing protects the last stretch.' },
            { text: `Today, in 4 days, and on day ${total - 2}`, correct: true },
            { text: `All three on day ${total - 1}, the night before`, why: 'Cramming can get you through tomorrow. A week later most of it is gone — and it is a miserable evening.' },
          ],
        };
      },
      explain: `
        Spread the sessions out, with **gaps that grow**. Each session then catches
        the memory after it has faded a little, which is when the boost is biggest.
      `,
    },
    {
      id: 'keep-alive',
      type: 'interact',
      stretch: true,
      attempts: 8,
      title: 'Keep it alive',
      text: `
        Your turn to schedule. You get **3 reviews**.

        Place them so that recall **never drops below 70%** during the whole 30 days.
        The curve turns red when it dips under the line.
      `,
      widget: { type: 'memory-curve', days: 30, strength: 1, budget: 3, threshold: 0.7 },
      check: (s) => {
        if (s.ok && s.reviews.length <= 3) return true;
        if (s.reviews.length < 3) return `You have ${plural(3 - s.reviews.length, 'review')} left to place.`;
        if (s.reviews[0] > 3) return 'The first review comes too late: recall has already fallen under 70% before it.';
        if (s.reviews[2] - s.reviews[1] <= s.reviews[1] - s.reviews[0]) return 'Reviews bunched together add little. Let each gap be longer than the last.';
        return 'Close. Somewhere the curve still dips under the line — stretch or shrink a gap.';
      },
      solution: { reviews: [3, 10, 28] },
      hints: [
        'Start with the first review. With no reviews, the curve crosses 70% a little after day 3.',
        'After each review the curve falls more slowly, so the next gap can be longer than the one before.',
        'Try gaps that roughly triple: reviews around days 3, 10 and 28.',
      ],
      explain: `
        Every solution has the same shape: **short gap, longer gap, much longer gap**.
        Three well-timed reviews protect a whole month. Thirty badly-timed ones would not be needed.
      `,
    },
    {
      id: 'gaps',
      type: 'choice',
      review: true,
      text: 'A memory was kept alive for a month with only three reviews. **What must have been true of the gaps between them?**',
      options: [
        { text: 'Each gap was longer than the one before', correct: true },
        { text: 'The gaps were all equal', why: 'Equal gaps are either too long at the start (the memory dies early) or wastefully short later on.' },
        { text: 'Each gap was shorter than the one before', why: 'That piles reviews up at the end, long after the fragile early memory has already faded.' },
        { text: 'The reviews were all in the first two days', why: 'Early cramming builds little strength; the memory then has four weeks to decay.' },
      ],
      explain: 'This is called **expanding spacing**: as a memory gets stronger, it can be left alone for longer.',
    },
    {
      id: 'doubling',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const start = rng.pick([1, 2, 3]);
        const n = rng.pick([3, 4, 5]);
        const answer = start * Math.pow(2, n);
        return {
          text: `
            Say a new memory lasts about **${plural(start, 'day')}** before it needs a review,
            and each well-timed review roughly **doubles** how long it lasts.

            After **${n} reviews**, about how many days can it go without one?

            (For example, starting from 5 days: 10 after one review, 20 after two.)
          `,
          answer,
          unit: 'days',
          wrong: [
            [start * 2 * n, 'That adds the same amount each time. Doubling *multiplies*: each review doubles the previous length.'],
            [start * Math.pow(2, n - 1), `That is ${n - 1} doublings. Count again: one doubling per review.`],
            [start + n, 'Doubling is much faster than adding one day per review.'],
          ],
          hints: [`After 1 review: ${start * 2}. After 2: ${start * 4}. Keep doubling.`],
          explain: `Doubling ${n} times multiplies by $2^{${n}} = ${Math.pow(2, n)}$: $${start} \\times ${Math.pow(2, n)} = ${answer}$ days. A handful of reviews can carry a memory for weeks or months.`,
        };
      },
    },
    {
      id: 'lemma',
      type: 'info',
      title: 'You will not have to do this by hand',
      text: `
        Working out the perfect moment to review every idea you learn would be a
        full-time job. So Learntopia does it for you.

        - Each lesson saves a few **key ideas** for review.
        - A memory model estimates how fast each one is fading *for you*.
        - It shows up under **Review** just before you would forget it.
        - Recall it and the next gap grows. Miss it and it comes back sooner.

        :::key
        A few minutes of review, at the right moments, beats hours of re-studying.
        :::
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about memory are **true**?',
      options: [
        { text: 'Reviewing something after you have started to forget it strengthens it more than reviewing it straight away', correct: true },
        { text: 'The gaps between reviews can grow longer over time', correct: true },
        { text: 'Three reviews in one evening beat three reviews spread over two weeks', why: 'Spread out wins, clearly and reliably. This is one of the most repeated findings in learning research.' },
        { text: 'If you forgot most of something, the time you spent learning it was wasted', why: 'Not at all. Relearning is much faster than learning from scratch, and every relearning makes the memory last longer.' },
      ],
      explain: `
        Forgetting is not the enemy of learning — it is part of the mechanism.
        A little forgetting is what makes the next review count.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of something you once **crammed** — and then forgot.

        If you had to learn it again, when would you schedule your first three reviews?
      `,
      model: `
        Something like: **the next day**, then **three or four days later**, then **a week or two after that** —
        short gap first, then longer and longer. The exact days matter less than two things:
        the gaps grow, and each review is an honest attempt to *recall*, not just a re-read.
      `,
    },
  ],
  recap: [
    'Forgetting is fastest right after learning, then slows down.',
    'A review restores the memory **and** makes it fade more slowly.',
    'Reviews work best spread out, with gaps that grow.',
    'A little forgetting before a review is what makes the review powerful.',
  ],
  next: 'Next: *how* you review matters even more than *when*.',
};
