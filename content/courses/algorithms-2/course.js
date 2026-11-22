export default {
  id: 'algorithms-2',
  title: 'Algorithms II: Clever Strategies',
  tagline: 'The ideas behind programs that seem to do the impossible.',
  category: 'cs',
  level: 'Advanced',
  color: 'red',
  cover: 'tree',
  requires: ['algorithms'],
  description: 'Searching and sorting were the warm-up. These are the strategies that make hard problems tractable: try and back up, grab the best piece, remember what you have already solved. Then follow the cheapest route through a map, see how a dictionary finds an entry without searching, and meet the problems nobody knows how to solve quickly.',
  outcomes: [
    'Solve puzzles by backtracking through a tree of choices',
    'Tell when a greedy choice is safe and when it fails',
    'Replace repeated work by a table of stored sub-answers (dynamic programming)',
    'Run Dijkstra\'s algorithm by hand on a weighted map',
    'Explain how hashing finds an item without searching',
    'Say what P versus NP asks, and what is and is not known about hard problems',
  ],
  chapters: [
    {
      title: 'Searching the space of choices',
      lessons: [
        { id: 'backtracking', title: 'Try, Fail, Back Up', summary: 'Place queens, load parcels: explore choices one by one and retreat the moment one fails.', minutes: 13 },
        { id: 'greedy', title: 'Take the Best Bite', summary: 'Always grab what looks best right now. Sometimes that is provably best, sometimes a trap.', minutes: 13 },
        { id: 'dynamic-programming', title: 'Remember Your Answers', summary: 'Solve each small problem once, write the answer down, and a million steps shrink to a few dozen.', minutes: 14 },
      ],
    },
    {
      title: 'Structures that make it fast',
      lessons: [
        { id: 'weighted-paths', title: 'The Cheapest Route', summary: 'When roads have different lengths, the fewest steps is not the shortest. Dijkstra\'s algorithm.', minutes: 14 },
        { id: 'hashing', title: 'Find It in One Step', summary: 'Turn a key into an address and skip the search altogether.', minutes: 13 },
      ],
    },
    {
      title: 'The limits',
      lessons: [
        { id: 'hard-problems', title: 'No Fast Way Known', summary: 'Easy to check, hard to find: the travelling salesman, P versus NP, and what people do in practice.', minutes: 14 },
      ],
    },
  ],
};
