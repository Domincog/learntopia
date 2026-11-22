// Probability & Chance: course outline. Lessons live in ./lessons/<id>.js
export default {
  id: 'probability',
  title: 'Probability & Chance',
  tagline: 'Think clearly when things are uncertain.',
  category: 'math',
  level: 'Beginner',
  color: 'violet',
  cover: 'dice',
  description: 'Chance is famously counter-intuitive, so this course never asks you to take it on trust. You predict, then flip, roll and simulate, then find out why. Along the way you learn to spot the traps that fool almost everyone.',
  outcomes: [
    'Find a probability by counting equally likely outcomes',
    'Combine events with and, or and not, and tell independent events from dependent ones',
    'Update a belief when new evidence arrives, without falling into the base rate trap',
    'Use expected value to judge games, lotteries and insurance',
    'Explain why the gambler\'s fallacy and the "50–50" answer to the Monty Hall problem are wrong',
  ],
  chapters: [
    {
      title: 'Counting chances',
      lessons: [
        {
          id: 'what-are-the-chances',
          title: 'What Are the Chances?',
          summary: 'A probability is a share: the outcomes you want, out of all the equally likely ones.',
          minutes: 10,
        },
        {
          id: 'counting-outcomes',
          title: 'Two Dice, 36 Worlds',
          summary: 'List every outcome, and probability turns into counting.',
          minutes: 11,
        },
        {
          id: 'the-long-run',
          title: 'The Long Run',
          summary: 'Why 10 flips mislead, 10,000 flips tell the truth, and the coin has no memory.',
          minutes: 10,
        },
      ],
    },
    {
      title: 'Combining events',
      lessons: [
        {
          id: 'and-or',
          title: 'And, Or, Not',
          summary: 'Multiply for and, add for or, and turn "at least one" inside out.',
          minutes: 12,
        },
        {
          id: 'conditional',
          title: 'Given That…',
          summary: 'New information shrinks the world of possibilities.',
          minutes: 11,
        },
        {
          id: 'bayes',
          title: 'The Base Rate Trap',
          summary: 'Why a positive test is not the same as being ill.',
          minutes: 11,
        },
      ],
    },
    {
      title: 'Deciding under uncertainty',
      lessons: [
        {
          id: 'expected-value',
          title: 'What Is It Worth?',
          summary: 'Expected value: what a bet pays on average, if you could make it again and again.',
          minutes: 11,
        },
        {
          id: 'monty-hall',
          title: 'The Monty Hall Problem',
          summary: 'Three doors, one car, and the puzzle that fools almost everyone. Play it and see.',
          minutes: 12,
        },
      ],
    },
  ],
};
