export default {
  id: 'logic',
  title: 'Logic & Deduction',
  tagline: 'Reason carefully. Enjoy being stumped.',
  category: 'logic',
  level: 'Beginner',
  color: 'violet',
  cover: 'logic',
  description: 'Detective grids, an island of liars, four famous cards and a game you can always win. Each lesson starts with a puzzle, then draws out the rule of sound reasoning hiding inside it.',
  outcomes: [
    'Solve deduction puzzles by elimination and by testing assumptions',
    'Reason correctly with if-then statements, and tell a rule from its converse',
    'Read, fill in and compare truth tables for and, or and not',
    'Wire logic gates into circuits, up to one that adds',
    'Win take-away games by working backwards from the end',
  ],
  chapters: [
    {
      title: 'Thinking like a detective',
      lessons: [
        {
          id: 'deduction-warmup',
          title: 'Process of Elimination',
          summary: 'Rule things out on a detective’s grid until only the truth is left.',
          minutes: 10,
        },
        {
          id: 'truth-tellers-liars',
          title: 'Knights and Liars',
          summary: 'Some islanders always lie, the rest never do. Assume, follow, and catch the contradiction.',
          minutes: 10,
        },
        {
          id: 'if-then',
          title: 'If… Then…',
          summary: 'Four cards that fool nearly everyone, and the most misunderstood sentence in logic.',
          minutes: 10,
        },
      ],
    },
    {
      title: 'The machinery of logic',
      lessons: [
        {
          id: 'and-or-not',
          title: 'And, Or, Not',
          summary: 'Three small words, one truth table, and what “not both” really means.',
          minutes: 10,
        },
        {
          id: 'logic-gates',
          title: 'Logic You Can Wire',
          summary: 'Flip switches, light lamps, and build a circuit that adds 1 + 1.',
          minutes: 10,
        },
        {
          id: 'strategy-games',
          title: 'Winning Backwards',
          summary: 'Lose a game to the computer, then beat it by starting from the end.',
          minutes: 10,
        },
      ],
    },
  ],
};
