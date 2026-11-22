export default {
  id: 'python-2',
  title: 'Python II: Building Programs',
  tagline: 'From single lines to programs with moving parts.',
  category: 'cs',
  level: 'Intermediate',
  color: 'orange',
  cover: 'blocks',
  requires: ['python'],
  description: 'You can read a loop and write a function. Now build things. Work with text, combine loops into patterns, model real data with nested structures, and split a big problem into functions that fit together. Then meet recursion, and finish by building a complete program piece by piece.',
  outcomes: [
    'Slice, search and rebuild strings',
    'Recognise and write the common loop patterns: count, filter, search, pair up, nest',
    'Model data with lists of lists and lists of dictionaries',
    'Design functions that work together, with defaults, several return values and clear responsibilities',
    'Write and trace recursive functions',
    'Test a program against edge cases and build a larger one in stages',
  ],
  chapters: [
    {
      title: 'Working with data',
      lessons: [
        { id: 'strings', title: 'Text Is a Sequence', summary: 'Index it, slice it, split it, join it: strings behave like lists you cannot change.', minutes: 14 },
        { id: 'loop-patterns', title: 'Loops With a Purpose', summary: 'Most loops are one of a few patterns. Learn to see which one a problem needs.', minutes: 15 },
        { id: 'nested-data', title: 'Data Inside Data', summary: 'Grids and records: lists of lists, lists of dictionaries, and how to walk through them.', minutes: 14 },
      ],
    },
    {
      title: 'Programs with structure',
      lessons: [
        { id: 'functions-in-depth', title: 'Functions That Work Together', summary: 'Split a problem into small functions with one job each, and connect them.', minutes: 14 },
        { id: 'recursion', title: 'Functions That Call Themselves', summary: 'A function can solve a problem by handing a smaller copy of it to itself.', minutes: 13 },
        { id: 'build-a-program', title: 'Build Something Real', summary: 'Edge cases, tests, and a complete program built one function at a time.', minutes: 14 },
      ],
    },
  ],
};
