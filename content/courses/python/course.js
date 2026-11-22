export default {
  id: 'python',
  title: 'Thinking in Code',
  tagline: 'Learn to program by reading, predicting and writing real code.',
  category: 'cs',
  level: 'Beginner',
  color: 'yellow',
  cover: 'code',
  description: 'Programming is a way of thinking: break a problem into steps a machine can follow. Here you read programs before you write them, predict what they do, and watch real Python run line by line, right in the lesson.',
  outcomes: [
    'Trace what a program does, one line at a time',
    'Store and update values with variables',
    'Make decisions and repeat work with if, while and for',
    'Package logic into functions, and organise data with lists and dictionaries',
    'Find bugs with a method instead of guesswork',
  ],
  chapters: [
    {
      title: 'First programs',
      lessons: [
        { id: 'variables', title: 'Names for Values', summary: 'Variables: how a program remembers, one line at a time.', minutes: 12 },
        { id: 'decisions', title: 'Forks in the Road', summary: 'Comparisons, if, elif and else: programs that choose.', minutes: 13 },
        { id: 'loops', title: 'Again, and Again', summary: 'while and for: the reason computers are useful.', minutes: 13 },
      ],
    },
    {
      title: 'Building blocks',
      lessons: [
        { id: 'functions', title: 'Your Own Commands', summary: 'Wrap up an idea, give it a name, and get an answer back.', minutes: 13 },
        { id: 'lists', title: 'Many Things at Once', summary: 'Lists, the loops that walk through them, and a famous surprise.', minutes: 13 },
        { id: 'dictionaries', title: 'Look It Up', summary: 'Dictionaries: find a value by its name, and count anything.', minutes: 12 },
        { id: 'debugging', title: 'When It Goes Wrong', summary: 'Find bugs like a detective, not a gambler.', minutes: 13 },
      ],
    },
  ],
};
