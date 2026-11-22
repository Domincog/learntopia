// How to Learn Anything · Lesson 8 · Build Your System
import { plural } from '../../../kit.js';

export default {
  id: 'build-your-system',
  steps: [
    {
      id: 'styles',
      type: 'choice',
      mode: 'predict',
      title: 'What kind of learner are you?',
      text: `
        Many people describe themselves as a *visual learner*, or as someone who learns best by
        *listening* or by *doing*.

        Researchers have tested the obvious prediction: teach people in their preferred style
        and they should learn more. **What do the experiments show?**
      `,
      shuffle: false,
      options: [
        { text: 'It works: matching the style clearly improves learning' },
        { text: 'It works, but only for visual learners' },
        { text: 'Matching the style makes no reliable difference', correct: true },
      ],
      explain: `
        People really do have **preferences**. But in properly designed studies, teaching to the
        preferred style does not improve results (Pashler and colleagues, 2008). It is one of the
        most widely believed ideas in education, and the evidence for it is missing.

        What does help is fitting the format to the **content**: a map for geography, sound for
        pronunciation, a diagram for anything with parts. And for almost everything, words and
        pictures together beat either one alone.
      `,
    },
    {
      id: 'teach-myths',
      type: 'info',
      title: 'Popular is not the same as tested',
      text: `
        Learning styles are not the only belief of this kind. The idea that people are
        **left-brained or right-brained** learners is a myth too: both halves of the brain take
        part in nearly everything you do.

        A large review of study techniques (Dunlosky and colleagues, 2013) rated each one by
        how well it held up when it was tested:

        | Rating | Techniques |
        |---|---|
        | **High** | Testing yourself, spreading practice out |
        | **Moderate** | Mixing, asking why, explaining to yourself |
        | **Low** | Re-reading, highlighting |

        The two most common study habits came out at the bottom.
      `,
    },
    {
      id: 'myths',
      type: 'bucket',
      text: 'You have met most of these during the course. **Sort the beliefs.**',
      buckets: ['Well supported', 'Popular, but not supported'],
      items: [
        { text: 'Spreading practice out beats cramming', bucket: 0 },
        { text: 'Testing yourself strengthens memory', bucket: 0 },
        { text: 'Sleep helps to save what you learned', bucket: 0 },
        { text: 'Explaining an idea in your own words deepens understanding', bucket: 0 },
        { text: 'Teaching should match each person\'s learning style', bucket: 1 },
        { text: 'Re-reading and highlighting are the most effective ways to study', bucket: 1, why: 'They are the most *common* ways. A large review of study techniques rated both as low in usefulness.' },
        { text: 'People are either left-brained or right-brained learners', bucket: 1, why: 'Both halves of the brain take part in nearly everything you do. Sorting people into two brain types is a myth.' },
        { text: 'If studying feels easy, it is working', bucket: 1, why: 'Ease mostly signals familiarity. The methods that work best tend to feel harder.' },
      ],
      explain: 'A good question to ask of any claim about learning: what happened when somebody **tested** it?',
    },
    {
      id: 'teach-toolkit',
      type: 'info',
      title: 'One tool for each problem',
      text: `
        The course has given you a toolkit. Each tool fixes a different problem, so the first
        step is always to notice **which problem you have**.

        | The problem | The tool |
        |---|---|
        | It fades as the weeks pass | Spaced reviews (lesson 1) |
        | It will not come to mind when you need it | Retrieval practice (lesson 2) |
        | You cannot tell which method to use | Mixed practice (lesson 3) |
        | You know the rule but not the reason | Asking why (lesson 5) |
        | Too much is new at once | Small steps and worked examples (lesson 6) |
      `,
    },
    {
      id: 'diagnose',
      type: 'match',
      review: true,
      text: 'Five learners, five different problems. **Match each one with the tool that fits.**',
      pairs: [
        ['"I knew it last month. Now it is gone."', 'Reviews spread out over time'],
        ['"It makes sense when I read it, but my mind goes blank in the test."', 'Practise recalling it without notes'],
        ['"I can do each type of problem alone, but not when they are jumbled."', 'Mixed practice'],
        ['"I can recite the rule, but I cannot say why it works."', 'Ask why, and invent examples'],
        ['"I get lost as soon as there are more than two steps."', 'Smaller steps and worked examples'],
      ],
      explain: 'The tools are not interchangeable. Knowing *which* problem you have is half of solving it, and that is why the course spent a whole lesson on knowing what you know.',
    },
    {
      id: 'teach-deadline',
      type: 'info',
      title: 'Plan backwards from the day',
      text: `
        When there is a deadline, a review plan has two jobs.

        1. **Stay alive on the way.** Start early and let the gaps grow, as in lesson 1.
        2. **Arrive strong.** Put the last review close to the day.

        :::example
        A test in 20 days and time for three reviews: days **2, 7 and 17**. Recall never
        drops below 78%, and you walk in at 97%.
        :::

        Saving all three reviews for the last few days fails job 1: the memory is almost gone
        before the first of them.
      `,
      figure: {
        type: 'memory-curve', days: 20, strength: 1, editable: false, reviews: [2, 7, 17],
        alt: 'A forgetting curve over 20 days with reviews on days 2, 7 and 17. The gaps grow, recall never falls below 78 percent, and it stands at 97 percent on day 20.',
        caption: 'Growing gaps, and the last review three days before the test.',
      },
    },
    {
      id: 'exam-plan',
      type: 'interact',
      stretch: true,
      attempts: 8,
      title: 'Plan for a deadline',
      text: `
        An exam is **30 days away**, and you have time for exactly **three review sessions**.

        Place them so that recall **never falls below 60%** on the way, and you walk into the
        exam on day 30 at **90% or better**.
      `,
      widget: { type: 'memory-curve', days: 30, strength: 1, budget: 3, threshold: 0.6 },
      check: (s) => {
        if (s.reviews.length < 3) return `You have ${plural(3 - s.reviews.length, 'review')} left to place.`;
        if (!s.ok) {
          return s.reviews[0] > 4
            ? 'The first review comes too late: recall has dropped under 60% before it.'
            : 'The curve still dips under the 60% line somewhere. Adjust the gaps.';
        }
        if (s.final < 0.9) return `You stay above the line, but you arrive at the exam at ${Math.round(s.final * 100)}%. Move your last review closer to day 30.`;
        return true;
      },
      solution: { reviews: [3, 10, 24] },
      hints: [
        'Start as in lesson 1: a first review within the first few days, then longer and longer gaps.',
        'Watch the "day 30" number under the chart. The later your last review, the higher it is.',
        'Try reviews around days 3, 10 and 24.',
      ],
      explain: `
        Growing gaps keep the memory alive cheaply, and the **last review sits close enough to the
        deadline** to carry you through it.

        Close enough, but not the night before. Had you saved everything for day 29, the memory
        would have been long gone by the time you got there.
      `,
    },
    {
      id: 'week',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const subject = rng.pick(['Italian', 'the guitar', 'statistics', 'to write code', 'human anatomy']);
        const [total, daily] = rng.pick([['three hours', 25], ['two hours', 20], ['four hours', 35]]);
        return {
          text: `You have about **${total} a week** to learn ${subject}. **Which plan will leave you knowing the most three months from now?**`,
          options: [
            { text: `About ${daily} minutes on most days, each time starting by recalling the last session`, correct: true },
            { text: `One ${total.replace(' hours', '-hour')} session every Sunday`, why: 'A week is a long first gap for brand-new material, and attention fades long before a session that size ends.' },
            { text: 'Nothing for three weeks, then a whole weekend', why: 'That is cramming with extra steps. Most of it will be gone before the next weekend comes round.' },
            { text: `${total[0].toUpperCase()}${total.slice(1)} every Sunday, re-reading last week's notes`, why: 'Long sessions, long gaps and re-reading: three weak choices at once.' },
          ],
        };
      },
      explain: 'Short and often lets every tool in this course do its work: the gaps give you spacing, the opening recall gives you retrieval, and no single session outlasts your attention.',
    },
    {
      id: 'habit-time',
      type: 'choice',
      mode: 'predict',
      text: `
        Researchers followed people who were each trying to build one small daily habit, such as
        a glass of water with breakfast or a short walk after dinner.

        **How long did it take until the habit felt automatic?**
      `,
      shuffle: false,
      options: [
        { text: 'About 21 days, for nearly everyone' },
        { text: 'Anything from three weeks to about eight months, typically around two months', correct: true },
        { text: 'At least a year' },
      ],
      explain: `
        The famous "21 days" is a myth. In the study the typical time was about **66 days**, and
        people ranged from 18 days to an estimated 254 (Lally and colleagues, 2010). Simple habits
        settled quickly, harder ones took far longer.

        One more finding is worth keeping: **missing a single day made no real difference.**
        What built the habit was coming back.
      `,
    },
    {
      id: 'teach-habit',
      type: 'info',
      title: 'A cue and a small target',
      text: `
        Two things help a study habit to last those two months.

        **A cue.** A plan of the form *"When X happens, I will do Y"* hands the decision over
        to the situation. Psychologists call these **if-then plans**, and they reliably make
        people more likely to follow through.

        :::example
        *"When I sit down on the bus, I will do my reviews."* That is an if-then plan.
        *"I will study more"* is only a wish: it names no moment.
        :::

        **A small target.** Choose one you can meet on your worst day, such as five minutes.
        Short sessions every day are also exactly what **spacing** asks for.
      `,
    },
    {
      id: 'if-then',
      type: 'choice',
      review: true,
      text: `
        In lesson 4 you wrote a plan that named a time and a place. Plans of the form
        **"When X happens, I will do Y"** reliably make people more likely to follow through.

        **Which of these is such a plan?**
      `,
      options: [
        { text: 'When I have finished breakfast, I will do one review session at the kitchen table', correct: true },
        { text: 'I will study more this month', why: 'A wish, not a plan: it does not say when, where or what.' },
        { text: 'I will review whenever I find some free time', why: '"Whenever I have time" is not a cue. Free time arrives unannounced and leaves the same way.' },
        { text: 'I must stop wasting my evenings', why: 'It names what to avoid, but not what to do or when to do it.' },
      ],
      explain: `
        A good plan hands the decision over to the situation: when the cue arrives, you already
        know what happens next. Psychologists call these **if-then plans**. They work because you
        no longer have to *decide* every day.
      `,
    },
    {
      id: 'small',
      type: 'choice',
      text: 'Which target is most likely to be still going two months from now?',
      options: [
        { text: 'One short review every day, about five minutes', correct: true },
        { text: 'Two hours every Saturday', why: 'One missed Saturday leaves a two-week gap, and two hours is a lot to face when you are tired.' },
        { text: 'An hour every day, starting on Monday', why: 'Admirable, and fragile: one busy week and the whole plan collapses.' },
        { text: 'No fixed target: study when motivation is high', why: 'Motivation comes and goes. A habit is what carries you through the days when it is gone.' },
      ],
      explain: `
        Small and daily wins twice: it suits the way memory works, and a target you can meet on
        your worst day is one you keep meeting.

        You may always do more than the minimum. The minimum is there for the days when you do
        not feel like it.
      `,
    },
    {
      id: 'session',
      type: 'fill',
      review: true,
      title: 'Design a session',
      text: 'Build a good half-hour study session by choosing the better option each time.',
      template: `
        Start by [[re-reading|*recalling]] what you covered last time.

        Take in the new material in [[*small steps|one long read]], and keep asking [[how to memorise the wording|*why each step works]].

        Then practise on problems that are [[*mixed with older types|all of one type]].

        Before you stop, decide [[how many pages to read next|*when you will review this]].
      `,
      explain: `
        Retrieval first, then small steps with reasons, then mixed practice, then a date for the
        next review. One half hour, and every lesson of this course is in it.
      `,
    },
    {
      id: 'in-lemma',
      type: 'match',
      text: 'Learntopia was built on the same ideas. **Match each feature with the principle behind it.**',
      pairs: [
        ['Reviews that return after longer and longer gaps', 'Spacing'],
        ['A question to answer straight after each idea is shown', 'Retrieval'],
        ['Review sessions that shuffle all your courses', 'Mixing'],
        ['The "How sure are you?" buttons', 'Calibration'],
        ['Short "Learn" screens with one small idea each', 'Limited working memory'],
      ],
      explain: 'Nothing here is secret or special to this site. You can use the same five ideas with a textbook, a notebook and a pencil.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'One last check, across the whole course. Which of these are **true**?',
      options: [
        { text: 'A way of studying that feels harder can be the one that works better', correct: true },
        { text: 'The gaps between reviews should grow as a memory gets stronger', correct: true },
        { text: 'A plan that names a time and a place is more likely to happen', correct: true },
        { text: 'People learn best when taught in their preferred learning style', why: 'Preferences are real, but matching them has not been shown to improve learning.' },
        { text: 'Missing one day ruins a new habit', why: 'In the habit study a single missed day made no real difference. Come back the next day.' },
      ],
      explain: 'Space it, retrieve it, mix it, explain it, protect your attention, and check what you really know. Then let a small daily habit do the rest.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      title: 'Your system',
      text: `
        Write your own system in three lines:

        1. **When and where** will you study? (*When …, I will …*)
        2. **What** will you learn first?
        3. **Which two tools** from this course will you use, and how?
      `,
      minChars: 30,
      model: `
        For example:

        1. *When I have had my coffee, I will do my reviews and one lesson at my desk, phone in the hall.*
        2. *Probability, because I keep getting it wrong.*
        3. *Retrieval: I will close the page and write down what I remember. Asking why: one sentence per rule on why it works.*

        Yours will be different. What matters is that it is specific enough to happen tomorrow.
      `,
    },
  ],
  recap: [
    'Learning styles, re-reading and "easy means it is working" are popular beliefs without good evidence.',
    'Each learning problem has its own tool. Diagnose first, then choose.',
    'Plan backwards from a deadline: growing gaps, with the last review close to the day.',
    'Small, daily and tied to a cue beats big, rare and left to motivation.',
  ],
  next: 'That is the whole toolkit. Pick any course and put it to work.',
};
