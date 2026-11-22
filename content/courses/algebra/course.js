export default {
  id: 'algebra',
  title: 'Algebra Foundations',
  tagline: 'Find the unknown by keeping things balanced.',
  category: 'math',
  level: 'Beginner',
  color: 'blue',
  cover: 'balance',
  description:
    'Algebra is not a bag of rules to memorise — it is one idea, used over and over: do the same ' +
    'thing to both sides and the balance holds. Start with a real scale, read the story a straight ' +
    'line tells, and end by finding where a parabola lands.',
  outcomes: [
    'Solve one-step, two-step and both-sides equations with confidence',
    'Turn a growing pattern into a rule for any step',
    'Read slope as a rate of change',
    'Write and graph lines as y = mx + b, and find where two lines meet',
    'Read a parabola: its vertex, its roots, and how to find them by factoring',
  ],
  chapters: [
    {
      title: 'The balance',
      lessons: [
        { id: 'keeping-the-balance', title: 'Keeping the Balance', summary: 'An equation is a scale. Whatever you do to one side, do to the other.', minutes: 9 },
        { id: 'undoing-operations', title: 'Undoing Operations', summary: 'Two-step equations: run the machine backwards. Last on, first off.', minutes: 10 },
        { id: 'both-sides', title: 'Unknowns on Both Sides', summary: 'When x sits on both sides, take the same x away from each.', minutes: 10 },
      ],
    },
    {
      title: 'From patterns to lines',
      lessons: [
        { id: 'growing-patterns', title: 'Growing Patterns', summary: 'See how a pattern grows, then write a rule that works for any step.', minutes: 10 },
        { id: 'rate-of-change', title: 'Rate of Change', summary: 'Slope: how much y changes each time x goes up by one.', minutes: 11 },
        { id: 'lines', title: 'The Line y = mx + b', summary: 'A starting value and a slope describe every straight line. Steer them yourself.', minutes: 12 },
        { id: 'systems', title: 'Where Lines Meet', summary: 'Two rules, one answer: find the crossing point by graph and by algebra.', minutes: 11 },
      ],
    },
    {
      title: 'Squares and curves',
      lessons: [
        { id: 'parabolas', title: 'The Curve y = x²', summary: 'When the steps themselves grow, the line bends. Steer a parabola and find where it turns.', minutes: 12 },
        { id: 'factoring', title: 'Rectangles and Roots', summary: 'Multiply two brackets with a picture, then run it backwards to solve a quadratic.', minutes: 13 },
      ],
    },
  ],
};
