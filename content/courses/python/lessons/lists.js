// Thinking in Code · Lesson 5 · Many Things at Once
import { py, out, listing, tracer, reachedEnd } from '../helpers.js';

const fruits = py`
  fruits = ["apple", "banana", "cherry"]
  print(fruits[1])
`;

const shared = py`
  a = [1, 2, 3]
  b = a
  b.append(4)
  print(a)
`;

// Three cells with their positions written above them.
const listFigure = {
  type: 'svg', viewBox: '0 0 372 118', maxWidth: 400,
  alt: 'A list drawn as three boxes in a row holding apple, banana and cherry. Above the boxes are their positions: 0, 1 and 2.',
  content: [
    '<g class="stroke-ink" stroke-width="2.5">',
    '<rect class="fill-blue-soft" x="12" y="44" width="116" height="52" rx="10"/>',
    '<rect class="fill-blue-soft" x="128" y="44" width="116" height="52" rx="10"/>',
    '<rect class="fill-blue-soft" x="244" y="44" width="116" height="52" rx="10"/>',
    '</g>',
    '<text class="fig-label-lg fig-mono text-orange" x="70" y="30" text-anchor="middle">0</text>',
    '<text class="fig-label-lg fig-mono text-orange" x="186" y="30" text-anchor="middle">1</text>',
    '<text class="fig-label-lg fig-mono text-orange" x="302" y="30" text-anchor="middle">2</text>',
    '<text class="fig-label fig-mono" x="70" y="75" text-anchor="middle">"apple"</text>',
    '<text class="fig-label fig-mono" x="186" y="75" text-anchor="middle">"banana"</text>',
    '<text class="fig-label fig-mono" x="302" y="75" text-anchor="middle">"cherry"</text>',
  ].join(''),
};

// Worked examples for the teaching screens. Each uses other names and values than the questions after it.
const petsExample = py`
  pets = ["cat", "dog"]
  pets.append("fish")
  pets[1] = "owl"
  print(pets)
  print(len(pets))
`;

const paintExample = py`
  paints = ["red", "green", "blue"]
  for c in paints:
      print(c, "paint")
  print("Done")
`;

// Two-digit scores: the generated question that follows (search) only uses 2 to 9.
const bestSearch = py`
  scores = [12, 30, 8, 21]
  best = scores[0]
  for s in scores:
      if s > best:
          best = s
  print(best)
`;

const winsExample = py`
  def count_wins(results):
      wins = 0
      for r in results:
          if r == "win":
              wins = wins + 1
      return wins

  games = ["win", "loss", "win"]
  print(count_wins(games))
`;

const teamExample = py`
  team = ["Ana", "Bo"]
  squad = team
  squad[0] = "Zed"
  print(team)
`;

export default {
  id: 'lists',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'One name, many values',
      text: 'Square brackets make a **list**: several values in a row, under one name. **What does this program print?**',
      figure: listing(fruits),
      shuffle: false,
      options: [
        { text: '`apple`' },
        { text: '`banana`', correct: true },
        { text: '`cherry`' },
        { text: 'An error' },
      ],
      explain: '`banana`. Python counts positions from **0**, so `fruits[0]` is the first item and `fruits[1]` is the second. Nearly everyone guesses `apple` the first time.',
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Try it',
      text: [
        'Change the number in the square brackets and press **Run**.',
        'Your goal: make the program print `cherry`. On the way, be curious. What happens with `3`? With `-1`?',
      ].join('\n\n'),
      widget: { type: 'py-run', code: fruits },
      check: (s) => {
        if (!s.runs) return 'Change the number in the brackets, then press Run.';
        if (s.error === 'IndexError') return 'There is no such position. Three items sit at positions 0, 1 and 2.';
        if (s.error) return 'The program stopped with an error. Read the message, fix the line and run it again.';
        return s.stdout.trim() === 'cherry' || 'Not `cherry` yet. Which position is it at, counting from 0?';
      },
      solution: { code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[2])' },
      explain: '`cherry` sits at position 2. Position 3 does not exist: asking for it stops the program with an **IndexError**. And `-1`? That printed `cherry` too.',
    },
    {
      id: 'idea',
      type: 'info',
      title: 'A list keeps values in order',
      text: '- A position in a list is called an **index**. Indexes start at 0.\n- `len(fruits)` is the number of items: here 3. So the last index is always `len(fruits) - 1`.\n- A negative index counts back from the end: `fruits[-1]` is the last item.\n- An index past the end, such as `fruits[3]`, stops the program with an IndexError.',
      figure: { ...listFigure, caption: 'fruits = ["apple", "banana", "cherry"]' },
    },
    {
      id: 'index-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const nums = rng.sample([2, 3, 4, 5, 7, 8, 10, 12, 15, 20], 5);
        const kind = rng.pick(['plain', 'ends', 'len']);
        const i = rng.int(1, 3);
        const expr = kind === 'plain' ? `nums[${i}]` : kind === 'ends' ? 'nums[0] + nums[-1]' : 'nums[len(nums) - 1]';
        const code = py`
          nums = [${nums.join(', ')}]
          print(${expr})
        `;
        const answer = Number(out(code));
        if (kind === 'plain') {
          return {
            text: 'What does this program print?',
            figure: listing(code),
            answer,
            wrong: [[nums[i - 1], `Indexes start at 0, so \`nums[${i}]\` is the item *after* ${nums[i - 1]}.`]],
            hints: [`Count along the list from 0: \`nums[0]\` is ${nums[0]}.`],
            explain: `Counting from 0, index ${i} holds **${answer}**.`,
          };
        }
        if (kind === 'ends') {
          return {
            text: 'What does this program print?',
            figure: listing(code),
            answer,
            wrong: [[nums[0] + nums[3], '`nums[-1]` is the **last** item, not the one before it.'], [nums[1] + nums[4], 'The first item is at index 0, not index 1.']],
            hints: ['`nums[0]` is the first item. A negative index counts back from the end.'],
            explain: `\`nums[0]\` is the first item, ${nums[0]}, and \`nums[-1]\` is the last, ${nums[4]}. Together: **${answer}**.`,
          };
        }
        return {
          text: 'What does this program print?',
          figure: listing(code),
          answer,
          wrong: [[5, 'That is `len(nums)`, the number of items. The program prints the item *at* index `len(nums) - 1`.'], [nums[3], `\`len(nums)\` is 5, so the index is 4. Counting from 0, that is the last item.`]],
          hints: ['First work out `len(nums) - 1`. Then look up that index.'],
          explain: `The list has 5 items, so \`len(nums) - 1\` is 4 — the index of the last item: **${answer}**.`,
        };
      },
    },
    {
      id: 'example-change-list',
      type: 'info',
      title: 'A list can change',
      text: [
        '- `pets.append("fish")` adds an item at the **end**.\n- `pets[1] = "owl"` **replaces** the item at index 1.\n- `len(pets)` counts the items afresh each time you ask.',
        ':::example\nAfter line 2 the list has three items. Line 3 swaps `"dog"`, at index 1, for `"owl"`. Line 4 prints the list as it is now, and line 5 prints `3`.\n:::',
        ':::note\nWhen Python prints a list, it shows strings in single quotes. Single and double quotes mean the same thing.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: petsExample, alt: 'A five-line program in an editor that appends to a list and replaces an item. Its output: the list cat, owl, fish, then 3.' },
    },
    {
      id: 'append-len',
      type: 'choice',
      text: 'A list can change while the program runs. **What does this one print?**',
      figure: listing(py`
        jobs = ["wash", "cook"]
        jobs.append("sleep")
        jobs[0] = "rest"
        print(len(jobs), jobs[0])
      `),
      options: [
        { text: '`3 rest`', correct: true },
        { text: '`2 rest`', why: '`append` added a third item to the end of the list.' },
        { text: '`3 wash`', why: 'Line 3 replaced the item at index 0.' },
        { text: '`3 sleep`', why: '`append` adds to the **end**. Index 0 is the front of the list.' },
      ],
      explain: 'After line 2 the list has three items. Line 3 swaps the first one for `"rest"`. So `len(jobs)` is 3 and `jobs[0]` is `rest`.',
    },
    {
      id: 'teach-for-list',
      type: 'info',
      title: 'A loop that walks through a list',
      text: [
        '`for` works on a list just as it does on a range or a string. The loop goes through the list from index 0 to the end. On each pass, the name after `for` stands for the **next item**. No counting, no indexes.',
        ':::example\nThe body runs three times: `c` is `"red"`, then `"green"`, then `"blue"`. The last line is not indented, so `Done` is printed once, after the loop.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: paintExample, alt: 'A four-line program in an editor: a for loop over a list of three colours. Its output: red paint, green paint, blue paint, Done.' },
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Arrange the lines so that the program prints `Hi Ana`, `Hi Bo`, `Hi Cy` and then `3`.',
      items: [
        'names = ["Ana", "Bo"]',
        'names.append("Cy")',
        'for name in names:',
        '    print("Hi", name)',
        'print(len(names))',
      ],
      hints: ['`Cy` has to be in the list before the loop starts greeting people.'],
      explain: 'The `append` comes before the loop, so the list holds all three names when the greeting starts. `name` stands for each item in turn. The last line is outside the loop: it prints the length once.',
    },
    {
      id: 'watch-best',
      type: 'interact',
      graded: false,
      title: 'Find the biggest',
      text: [
        'A loop can search a list. Here `best` starts as the first score. The loop then looks at every score in turn, and replaces `best` whenever it meets a bigger one.',
        'Step through and watch `best`. **How many times does it change after line 2?**',
      ].join('\n\n'),
      widget: tracer(bestSearch),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: 'Only once: from 12 to 30. The later scores, 8 and 21, do not beat 30, so the `if` skips its body for them. `best` always holds the largest score seen *so far*.',
    },
    {
      id: 'search',
      type: 'numeric',
      review: true,
      title: 'Searching a list',
      gen: (rng) => {
        let scores;
        do { scores = rng.sample([2, 3, 4, 5, 6, 7, 8, 9], rng.int(4, 5)); }
        while (Math.max(...scores) === scores[0] || Math.max(...scores) === scores[scores.length - 1]);
        const code = py`
          scores = [${scores.join(', ')}]
          best = scores[0]
          for s in scores:
              if s > best:
                  best = s
          print(best)
        `;
        const answer = Number(out(code));
        return {
          text: 'This loop looks at every score in turn. **What does the program print?**',
          figure: listing(code),
          answer,
          wrong: [
            [scores[scores.length - 1], 'That is the last score. `best` only changes when a *bigger* score comes along.'],
            [scores[0], '`best` starts as the first score, but the loop replaces it whenever it meets a bigger one.'],
          ],
          hints: [`\`best\` starts at ${scores[0]}. Go through the list and ask each time: is this score bigger than \`best\`?`],
          explain: `\`best\` starts at ${scores[0]} and is replaced only by a bigger score. When the loop ends it holds the largest one: **${answer}**.`,
        };
      },
    },
    {
      id: 'code-count',
      type: 'code',
      title: 'Your turn: count only some',
      text: [
        'This program counts **every** temperature. Change it so that it counts only the ones **below zero**.',
        'The checker replaces the list on line 1 to try other temperatures.',
      ].join('\n\n'),
      starter: py`
        temps = [3, -2, 0, -7, 5, -1]
        count = 0
        for t in temps:
            count = count + 1
        print(count)
      `,
      solution: py`
        temps = [3, -2, 0, -7, 5, -1]
        count = 0
        for t in temps:
            if t < 0:
                count = count + 1
        print(count)
      `,
      tests: [
        { set: { temps: [3, -2, 0, -7, 5, -1] }, stdout: '3' },
        { set: { temps: [1, 2] }, stdout: '0' },
        { set: { temps: [-1, -1, 0] }, stdout: '2' },
      ],
      wrong: [
        ['6', 'That still counts every temperature. Put an `if` inside the loop, so that the count only goes up for values below zero.'],
        ['4', 'Zero is not below zero. Use `<`, not `<=`.'],
      ],
      hints: ['Inside the loop, test each temperature: `if t < 0:`.', 'The line `count = count + 1` moves under the `if`, indented one level more.'],
      explain: 'The loop visits every item, and the `if` decides whether that item counts. A loop with an `if` inside is how programs filter a list.',
    },
    {
      id: 'example-list-function',
      type: 'info',
      title: 'A function that takes a list',
      text: [
        'A list can be handed to a function like any other value. Inside the function, the parameter is a local name for that list.',
        ':::example\n`count_wins` starts its own counter, loops over the list it was given, and returns the counter **after** the loop. The `return` lines up with `for`, not with the loop body. Inside the body it would end the function on the very first pass.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: winsExample, alt: 'A nine-line program in an editor: a function that loops over a list and counts the items equal to win. Its output: 2.' },
    },
    {
      id: 'code-total',
      type: 'code',
      title: 'Your turn: add up a list',
      text: [
        'Write `total(nums)` so that it **returns** the sum of all the numbers in a list.',
        'Build the sum yourself with a loop and an accumulator. (Python has a built-in for this, `sum(nums)`, but it is off limits this time.)',
      ].join('\n\n'),
      starter: py`
        def total(nums):
            return 0

        print(total([3, 5, 2]))
      `,
      solution: py`
        def total(nums):
            result = 0
            for n in nums:
                result = result + n
            return result

        print(total([3, 5, 2]))
      `,
      rows: 8,
      tests: [
        { call: 'total([3, 5, 2])', expect: 10 },
        { call: 'total([10])', expect: 10 },
        { call: 'total([])', expect: 0 },
      ],
      hidden: [{ call: 'total([-5, 5, 2.5])', expect: 2.5 }],
      forbid: [{ pattern: /\bsum\s*\(/, message: 'That works, but this task asks you to build the sum yourself, with a loop.' }],
      hints: ['Start a variable at 0 before the loop.', 'Inside `for n in nums:` add `n` to it. After the loop, `return` it.'],
      explain: 'The accumulator starts at 0, the loop adds each item, and `return` hands the result back *after* the loop. For an empty list the loop body never runs, so the answer is 0.',
    },
    {
      id: 'teach-alias',
      type: 'info',
      title: 'Two names, one list',
      text: [
        'In the first lesson, `=` tied a name to a value. It still does. `squad = team` does **not** copy the list: it ties a second name to the **same** list.',
        ':::example\nStep through it. After line 2 the tracer marks `team` and `squad` as one shared list. Line 3 changes that list through the name `squad`, so `print(team)` shows the change too: `[\'Zed\', \'Bo\']`.\n:::',
      ].join('\n\n'),
      figure: tracer(teamExample, { alt: 'A four-line program in a tracer. The names team and squad are marked as sharing one list, so a change made through squad shows up when team is printed.' }),
    },
    {
      id: 'alias',
      type: 'choice',
      review: true,
      stretch: true,
      title: 'A famous surprise',
      text: 'Line 2 looks as if it makes a copy. **What does this program print?**',
      figure: listing(shared),
      options: [
        { text: '`[1, 2, 3, 4]`', correct: true },
        { text: '`[1, 2, 3]`', why: '`b = a` does not copy the list. It gives the **same** list a second name.' },
        { text: '`[4]`', why: '`append` adds to the list that is already there.' },
        { text: 'An error', why: 'No error. The program runs, and surprises almost everyone the first time.' },
      ],
      explain: [
        '`b = a` never copies anything: it makes `b` a second name for the **same list**. So a change made through `b` shows up through `a` as well.',
        'With numbers and strings you never notice, because they cannot be changed in place. A list can.',
      ].join('\n\n'),
    },
    {
      id: 'watch-alias',
      type: 'interact',
      graded: false,
      text: [
        'When you need a second, separate list, ask for one: `a.copy()` builds a **new** list with the same items.',
        'Step through this longer version. The tracer marks names that share one list. **What is different about `c`?**',
      ].join('\n\n'),
      widget: tracer(py`
        a = [1, 2, 3]
        b = a
        b.append(4)
        c = a.copy()
        c.append(5)
        print(a)
        print(c)
      `),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: '`a` and `b` are one list with two names. `c` is a list of its own, so appending 5 to it leaves `a` alone.',
    },
    {
      id: 'code-backup',
      type: 'code',
      stretch: true,
      title: 'Keep a real backup',
      text: [
        'This program wants to keep the original scores in `backup` before adding a new one. Press **Run**: the backup changes too.',
        'Fix **one line** so that it prints the original list first, then the longer one.',
      ].join('\n\n'),
      starter: py`
        scores = [70, 85, 90]
        backup = scores
        scores.append(100)
        print(backup)
        print(scores)
      `,
      solution: py`
        scores = [70, 85, 90]
        backup = scores.copy()
        scores.append(100)
        print(backup)
        print(scores)
      `,
      expect: '[70, 85, 90]\n[70, 85, 90, 100]',
      hidden: [
        { set: { scores: [1] }, stdout: '[1]\n[1, 100]', message: 'That prints the right lists for these scores, but `backup` should be a real copy of whatever `scores` holds: `backup = scores.copy()`.' },
        { call: 'backup', expect: [70, 85, 90], message: 'The output is right, but `backup` is still the same list as `scores`: after the `append` it holds four scores too. Make it a real copy: `backup = scores.copy()`.' },
      ],
      hints: ['Line 2 gives the same list a second name. You need a second *list*.', '`backup = scores.copy()`'],
      explain: '`scores.copy()` makes a second list, so the later `append` changes only `scores`. Whenever two names must not affect each other, make a copy.',
    },
  ],
  recap: [
    'A list holds several values in order. Indexes start at **0**; the last one is `len(list) - 1`, or simply `-1`.',
    '`append` adds to the end, and `list[i] = value` replaces an item.',
    '`for item in list` visits every item. With an accumulator or an `if`, that is how programs add up, count and search.',
    '`b = a` gives the same list a second name. Use `a.copy()` when you need a separate list.',
  ],
  next: 'Next: what if you want to find a value by its name instead of its position?',
};
