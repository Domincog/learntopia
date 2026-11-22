export default {
  id: 'functions',
  title: 'Algebra II: Functions & Growth',
  tagline: 'Machines that turn numbers into numbers, and the curves they draw.',
  category: 'math',
  level: 'Intermediate',
  color: 'green',
  cover: 'growth',
  requires: ['algebra'],
  description: 'A function is a machine: a number goes in, exactly one comes out. Learn to read functions as rules, tables and graphs, move their graphs around, and meet the two families that describe growth and decay: exponentials and logarithms. Then finish the story of the quadratic.',
  outcomes: [
    'Read and write function notation, and move between a rule, a table and a graph',
    'Shift, stretch and flip a graph by changing its formula',
    'Solve inequalities and show the answers on a number line',
    'Use the rules of exponents, including zero, negative and fractional powers',
    'Model growth and decay with exponential functions, and undo a power with a logarithm',
    'Solve any quadratic equation by completing the square or with the quadratic formula',
  ],
  chapters: [
    {
      title: 'Functions',
      lessons: [
        { id: 'function-machines', title: 'Function Machines', summary: 'One input, one output. Rules, tables and graphs are three views of the same machine.', minutes: 13 },
        { id: 'transformations', title: 'Shift, Stretch, Flip', summary: 'Change the formula a little and the whole graph moves. Learn to predict how.', minutes: 11 },
        { id: 'inequalities', title: 'More Than, Less Than', summary: 'Solve an inequality like an equation, with one trap: multiplying or dividing by a negative number.', minutes: 13 },
      ],
    },
    {
      title: 'Powers and growth',
      lessons: [
        { id: 'exponents', title: 'The Rules of Powers', summary: 'Why x to the zero is 1, what a negative power means, and how a power can be a root.', minutes: 13 },
        { id: 'exponential-growth', title: 'Doubling and Halving', summary: 'Growth that multiplies: slow at first, but in the end it overtakes any straight line.', minutes: 11 },
        { id: 'logarithms', title: 'Undoing a Power', summary: 'A logarithm answers one question: which power? It turns multiplying into adding.', minutes: 11 },
      ],
    },
    {
      title: 'Every quadratic',
      lessons: [
        { id: 'quadratic-formula', title: 'The Formula for Any Quadratic', summary: 'Complete the square with a picture, then once with letters, and never be stuck on a quadratic again.', minutes: 13 },
      ],
    },
  ],
};
