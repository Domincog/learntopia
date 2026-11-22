export default {
  id: 'probability-2',
  title: 'Probability II: Random Variables',
  tagline: 'From single events to whole distributions.',
  category: 'math',
  level: 'Intermediate',
  color: 'orange',
  cover: 'bell',
  requires: ['probability'],
  description: 'One coin flip is a question of luck. A thousand flips follow laws. Count arrangements without listing them, steer balls through a board of pegs to build the binomial distribution, measure how much a random quantity wobbles, watch the bell curve appear out of crooked dice, and follow chains of chance to see where they settle.',
  outcomes: [
    'Count arrangements and selections with factorials and "n choose k"',
    'Use the binomial distribution for repeated yes-or-no trials, and say when it does not apply',
    'Find the expected value, variance and standard deviation of a random variable',
    'Explain why sums of many small independent effects pile up into a bell curve, and read one with z-scores',
    'Reason about waiting times, and about chains that move from state to state',
  ],
  chapters: [
    {
      title: 'Counting without listing',
      lessons: [
        { id: 'counting-arrangements', title: 'How Many Ways?', summary: 'Orders and choices: factorials, arrangements and "n choose k", and when each one applies.', minutes: 13 },
        { id: 'binomial', title: 'Heads k Times out of n', summary: 'Steer balls through a board of pegs, count the routes, and watch the binomial distribution build itself.', minutes: 14 },
      ],
    },
    {
      title: 'Numbers that depend on chance',
      lessons: [
        { id: 'random-variables', title: 'How Much Does It Wobble?', summary: 'Expected value gives the centre. Variance and standard deviation give the spread, and the risk.', minutes: 13 },
        { id: 'normal-curve', title: 'Why the Bell Appears', summary: 'Add up enough small random effects and the same shape turns up every time, even with loaded dice.', minutes: 13 },
      ],
    },
    {
      title: 'Chance over time',
      lessons: [
        { id: 'waiting-times', title: 'How Long Until…?', summary: 'Waiting for a six, collecting the full set, and the birthday surprise.', minutes: 12 },
        { id: 'markov-chains', title: 'A Memory of One Step', summary: 'When tomorrow depends only on today: follow a crowd through a chain of states and see where it settles.', minutes: 14 },
      ],
    },
  ],
};
