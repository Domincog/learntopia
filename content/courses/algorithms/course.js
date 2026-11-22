export default {
  id: 'algorithms',
  title: 'Algorithms',
  tagline: 'Think like a computer scientist.',
  category: 'cs',
  level: 'Beginner',
  color: 'teal',
  cover: 'bars',
  description: 'An algorithm is a recipe a machine can follow. Carry out the classics by hand, count your own steps, and see why some recipes are a billion times faster than others. No programming needed.',
  outcomes: [
    'Describe a process exactly enough for a machine to follow',
    'Search sorted data by halving, and say how many steps it takes',
    'Sort by hand with bubble sort, selection sort and merge sort',
    'Compare algorithms by how their work grows with the input',
    'Find the route with the fewest steps through a network',
  ],
  chapters: [
    {
      title: 'Search',
      lessons: [
        { id: 'what-is-an-algorithm', title: 'Recipes for Machines', summary: 'Program a robot that does exactly what you say, and nothing else.', minutes: 9 },
        { id: 'binary-search', title: 'Halve It', summary: 'Find one name among a million in 20 looks.', minutes: 11 },
      ],
    },
    {
      title: 'Sort',
      lessons: [
        { id: 'sorting', title: 'Putting Things in Order', summary: 'Sort the way a machine must: compare two, swap two, count the cost.', minutes: 11 },
        { id: 'divide-and-conquer', title: 'Divide and Conquer', summary: 'Split the problem, solve the halves, merge. Sorting gets fifty times cheaper.', minutes: 11 },
      ],
    },
    {
      title: 'Scale',
      lessons: [
        { id: 'big-o', title: 'How Work Grows', summary: 'Why doubling the input can double the work, quadruple it, or barely change it.', minutes: 10 },
        { id: 'graphs-bfs', title: 'Maps and Shortest Paths', summary: 'Explore a network layer by layer to find the route with the fewest steps.', minutes: 10 },
      ],
    },
  ],
};
