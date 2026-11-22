// Python II: Building Programs · Lesson 2 · Loops With a Purpose
import { py, out, listing, tracer, runner, reachedEnd, lit } from '../helpers.js';

const early = py`
  for n in [4, 7, 10, 3, 8]:
      if n > 6:
          print(n)
          break
`;

const search = py`
  found = None
  for n in [4, 7, 10]:
      if n > 6:
          found = n
          break
  print(found)
`;

const numbered = py`
  names = ["Ana", "Bo", "Cy"]
  for i, name in enumerate(names):
      print(i, name)
`;

const shirts = py`
  sizes = ["S", "M"]
  colours = ["red", "green", "blue"]
  for size in sizes:
      for colour in colours:
          print(size, colour)
`;

// Worked examples for the teaching screens: each runs in the editor, with its output showing.
const filtering = py`
  kept = []
  for x in [3, 12, 7, 20]:
      if x > 6:
          kept.append(x)
  print(kept)
`;

const zipped = py`
  days = ["Mon", "Tue", "Wed"]
  hours = [7, 9, 6]
  for day, h in zip(days, hours):
      print(day, h)
`;

const seats = py`
  for row in range(3):
      for seat in range(2):
          print(row, seat)
`;

const halving = py`
  def halvings(n):
      count = 0
      while n > 1:
          n = n // 2
          count = count + 1
      return count

  print(halvings(20))
  print(20 % 2, 5 % 2)
`;

const firstNegative = py`
  def first_negative(nums):
      for n in nums:
          if n < 0:
              return n
      return None

  print(first_negative([4, -2, 7, -5]))
  print(first_negative([1, 2]))
`;

/** A program in the editor that has already been run: the code and what it prints. */
const example = (code, alt) => runner(code, { autorun: true, alt });

/** Anticipated wrong answers: drop any that equal the answer or share a value with another entry. */
const listOf = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const slips = (answer, entries) => entries.filter(([v], i, all) => v !== answer && all.findIndex(([u]) => u === v) === i && all.filter(([u]) => u === v).length === 1);

export default {
  id: 'loop-patterns',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A loop that gives up early',
      text: 'This loop contains a word you have not met: `break`. **What do you think the program prints?**',
      figure: listing(early),
      options: [
        { text: '`7`', correct: true },
        { text: '`7`, then `10`, then `8`' },
        { text: '`8`' },
        { text: 'Nothing at all' },
      ],
      explain: [
        `Just \`${out(early)}\`. \`break\` ends the loop on the spot. The first number greater than 6 is printed, and the 10, the 3 and the 8 are never even looked at.`,
        'This loop is not adding or counting. It is **searching**, and a search can stop as soon as it has found what it wants.',
      ].join('\n\n'),
    },
    {
      id: 'be-computer',
      type: 'interact',
      graded: false,
      title: 'Be the computer',
      text: [
        'You are the computer. Tap each line as it runs, all the way to the end.',
        'Watch closely where Python goes **after the `break`**.',
      ].join('\n\n'),
      widget: tracer(search, { ask: 'next' }),
      check: reachedEnd('Keep going: tap the next line until the program ends.'),
      solution: { done: true },
      explain: [
        'After `break` on line 5, Python jumps straight to line 6, the first line **below** the loop. The loop never comes back for the 10.',
        'The variable `found` remembers what the search turned up, so the rest of the program can use it. Had no number passed the test, it would still be `None`.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Five patterns cover most loops',
      text: [
        'You have already written most of these without knowing their names. Each pattern is a start value plus one kind of line inside the loop.',
        [
          '| Pattern | Before the loop | Inside the loop |',
          '|---------|-----------------|-----------------|',
          '| **Accumulate** | `total = 0` | `total = total + x` |',
          '| **Count** | `count = 0` | `if …: count = count + 1` |',
          '| **Filter** | `kept = []` | `if …: kept.append(x)` |',
          '| **Search** | `found = None` | `if …:` remember `x`, then `break` |',
          '| **Find the best** | `best = items[0]` | `if x > best: best = x` |',
        ].join('\n'),
        'To save space, the table puts each `if` and its body on one line, which Python allows when the body is short. Faced with a new problem, ask first: *which pattern is this?* Much of the code then writes itself.',
      ].join('\n\n'),
    },
    {
      id: 'sort-patterns',
      type: 'bucket',
      review: true,
      text: 'Which loop pattern fits each job? **Accumulate** builds one result out of every item. **Filter** builds a new list out of some of the items. **Search** looks for one item, and can stop as soon as it has found it.',
      buckets: ['Accumulate', 'Filter', 'Search'],
      items: [
        { text: 'Add up the prices in a basket', bucket: 0 },
        { text: 'Is anyone in the class called Sam?', bucket: 2, why: 'You can stop at the first Sam: a search.' },
        { text: 'Make a list of the words longer than five letters', bucket: 1 },
        { text: 'Join all the words into one long string', bucket: 0, why: 'One result that grows on every pass: an accumulator that starts as `""`.' },
        { text: 'Find the first negative number', bucket: 2, why: 'Only one item is wanted, and nothing after it matters.' },
        { text: 'Keep only the even numbers', bucket: 1, why: 'The result is a new list holding some of the items.' },
      ],
      explain: 'Ask what the loop has to **produce**: one combined value (accumulate), a shorter list (filter), or a single item that passes a test (search).',
    },
    {
      id: 'first-match',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let nums;
        let limit;
        let matches;
        do {
          nums = rng.sample([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18], 5);
          limit = rng.pick([6, 8, 10, 12]);
          matches = nums.filter((n) => n > limit);
        } while (matches.length < 2 || nums[0] > limit);
        const code = py`
          nums = ${lit(nums)}
          for n in nums:
              if n > ${limit}:
                  print(n)
                  break
        `;
        const answer = Number(out(code));
        const skipped = nums.slice(0, nums.indexOf(answer));
        const unchecked = nums.length - 1 - nums.indexOf(answer);
        const last = matches[matches.length - 1];
        const biggest = Math.max(...nums);
        return {
          text: 'A search with an early exit. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            last === biggest
              ? [last, `That is the largest number, and the last one greater than ${limit}. \`break\` ends the loop at the **first** number greater than ${limit}.`]
              : [last, `That is the **last** number greater than ${limit}. \`break\` ends the loop at the first one.`],
            ...(last === biggest ? [] : [[biggest, `That is the largest number. The loop is not looking for the biggest: it stops at the first number greater than ${limit}.`]]),
            [nums[0], `The first number, ${nums[0]}, is not greater than ${limit}, so the \`if\` skips it.`],
          ]),
          hints: [`Go through the list from the left and ask of each number: is it greater than ${limit}?`, 'The first time the answer is yes, the number is printed and `break` ends the loop.'],
          explain: `The loop passes over ${listOf(skipped)}, which ${skipped.length === 1 ? 'is' : 'are'} not greater than ${limit}. Then comes **${answer}**: it is printed, and \`break\` ends the loop. ${unchecked === 1 ? 'The number after it is' : 'The numbers after it are'} never checked.`,
        };
      },
    },
    {
      id: 'enumerate',
      type: 'choice',
      mode: 'predict',
      title: 'When you need the position',
      text: [
        '`for name in names` hands you each item, but not *where* it is in the list. `enumerate` hands out both.',
        '**What is the first line this program prints?**',
      ].join('\n\n'),
      figure: listing(numbered),
      options: [
        { text: '`0 Ana`', correct: true },
        { text: '`1 Ana`' },
        { text: '`Ana 0`' },
        { text: '`0 1 2`' },
      ],
      explain: [
        `\`${out(numbered).split('\n')[0]}\`. On every pass, \`enumerate\` gives a **pair**: the position (from 0, as always) and the item. The two names after \`for\` catch one each.`,
        `The whole output is ${out(numbered).split('\n').map((l) => `\`${l}\``).join(', ')}.`,
      ].join('\n\n'),
    },
    {
      id: 'teach-zip',
      type: 'info',
      title: 'Two lists, side by side',
      text: [
        '`enumerate` handed out a position and an item on every pass. `zip` does the same kind of thing with **two lists**. It walks through them side by side and hands out the first items together, then the second items, and so on. Again, the two names after `for` catch one value each.',
        ':::example\nOn the first pass `day` is `"Mon"` and `h` is 7. On the second they are `"Tue"` and 9. Each day stays with the number in the **same position** of the other list.\n:::',
      ].join('\n\n'),
      figure: example(zipped, 'A four-line program in an editor that loops over two lists with zip. Its output: Mon 7, Tue 9, Wed 6, one pair per line.'),
    },
    {
      id: 'zip-total',
      type: 'numeric',
      title: 'Price times count',
      gen: (rng) => {
        const prices = rng.sample([2, 3, 4, 5, 6], 3);
        const counts = [rng.int(1, 4), rng.int(1, 4), rng.int(1, 4)];
        const code = py`
          prices = ${lit(prices)}
          counts = ${lit(counts)}
          total = 0
          for p, c in zip(prices, counts):
              total = total + p * c
          print(total)
        `;
        const answer = Number(out(code));
        const sum = (list) => list.reduce((a, b) => a + b, 0);
        return {
          text: [
            '`zip` walks through two lists **side by side**.',
            'Here every price belongs to the count in the same position. **What does the program print?**',
          ].join('\n\n'),
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [sum(prices) * sum(counts), 'Each price is multiplied only by the count in the **same position**, not by every count.'],
            [sum(prices) + sum(counts), 'That adds all six numbers. Line 5 multiplies each price by its count before adding.'],
            [prices[2] * counts[2], 'That is only the last pair. `total` keeps everything that was added before.'],
          ]),
          hints: [`The pairs are ${prices.map((p, i) => `(${p}, ${counts[i]})`).join(', ')}.`, 'Multiply each pair, then add the three products.'],
          explain: `The loop sees the pairs ${prices.map((p, i) => `(${p}, ${counts[i]})`).join(', ')} and accumulates their products: ${prices.map((p, i) => `${p} × ${counts[i]}`).join(' + ')} = **${answer}**.`,
        };
      },
    },
    {
      id: 'pairs',
      type: 'interact',
      title: 'A loop inside a loop',
      text: [
        'A shop sells its T-shirt in every size and every colour. Press **Run**: 2 sizes and 3 colours make 6 lines.',
        '**Add to the lists until the program prints exactly 12 lines.**',
      ].join('\n\n'),
      widget: runner(shirts),
      check: (s) => {
        if (!s.runs) return 'Press Run first, then change the lists and run again.';
        if (s.error) return 'The program stopped with an error. Check the quotes and commas in your lists, then run it again.';
        const lines = s.stdout.split('\n').filter((l) => l.trim()).length;
        if (lines === 12) return true;
        if (lines === 6) return 'Still 6 lines. Add a size or a colour to one of the lists, then run again.';
        return `That prints ${lines} ${lines === 1 ? 'line' : 'lines'}, not 12. Every size is printed once for every colour.`;
      },
      solution: { code: shirts.replace('["S", "M"]', '["S", "M", "L", "XL"]') },
      hints: ['Every size is paired with every colour, so the number of lines is sizes × colours.', 'Two more sizes make 4 × 3. Three more colours make 2 × 6.'],
      explain: 'Every size is printed once for every colour, so the number of lines is sizes × colours. Twelve lines can be 4 sizes × 3 colours, or 2 × 6, or 3 × 4.',
    },
    {
      id: 'teach-nested',
      type: 'info',
      title: 'The inner loop runs in full',
      text: [
        'What you just saw is the rule for a loop inside a loop. On **every** pass of the outer loop, the inner loop runs **in full**. So the passes multiply.',
        ':::example\n`row` stays 0 while `seat` goes through 0 and 1. Only then does `row` move on to 1, and the inner loop starts again from the beginning. Three passes outside, two inside each of them: 3 × 2 = 6 lines.\n:::',
        'That is worth remembering. Ten sizes and ten colours would be 100 lines, and a loop inside a loop over 1,000 items makes a million passes.',
      ].join('\n\n'),
      figure: example(seats, 'A three-line program in an editor: a loop over three rows with a loop over two seats inside it. Its output is six lines: 0 0, 0 1, 1 0, 1 1, 2 0, 2 1.'),
    },
    {
      id: 'nested-count',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 5);
        const b = rng.intExcept(3, 6, [a]);
        const code = py`
          count = 0
          for a in range(${a}):
              for b in range(${b}):
                  count = count + 1
          print(count)
        `;
        const answer = Number(out(code));
        return {
          text: 'One loop sits inside another. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [a + b, 'The two loops do not take turns. The inner loop runs **in full** on every pass of the outer loop, so the passes multiply.'],
            [b, `That is one full run of the inner loop. The outer loop makes it run ${a} times over.`],
            [a, `That is the number of passes of the outer loop. On each of them the inner loop makes ${b} passes of its own.`],
          ]),
          hints: ['How many times does line 4 run during **one** pass of the outer loop?', `The outer loop makes ${a} passes, and each one contains ${b} passes of the inner loop.`],
          explain: `The outer loop makes ${a} passes. On each one the inner loop makes ${b} passes, and each of those adds 1: ${a} × ${b} = **${answer}**.`,
        };
      },
    },
    {
      id: 'example-while',
      type: 'info',
      title: 'As long as it takes',
      text: [
        'A `for` loop knows its passes in advance. A loop that must run **until something happens** is a job for `while`: it repeats as long as its condition is true.',
        'Two operators help with whole numbers. `//` divides and drops the remainder: `5 // 2` is 2. `%` gives the **remainder** itself: `5 % 2` is 1, and `20 % 2` is 0. So `n % 2 == 0` asks: is `n` even?',
        ':::example\n`halvings(20)` halves `n` until it is 1: 20, 10, 5, 2, 1. That takes four passes, and `count` counts them.\n:::',
      ].join('\n\n'),
      figure: example(halving, 'A function in an editor with a while loop that halves a number until it reaches 1 and counts the passes. Its output: 4, then 0 1.'),
    },
    {
      id: 'code-collatz',
      type: 'code',
      title: 'Repeat until…',
      text: [
        'Some loops cannot know in advance how many passes they need. That is the job of `while`.',
        'Take a whole number `n`, 1 or more. If it is even, halve it. If it is odd, replace it with `3 * n + 1`. Repeat **until `n` is 1**.',
        'Write `collatz_steps(n)`, which returns how many steps that takes. From 6 the numbers go 3, 10, 5, 16, 8, 4, 2, 1: eight steps.',
      ].join('\n\n'),
      starter: py`
        def collatz_steps(n):
            count = 0
            # repeat until n is 1
            return count

        print(collatz_steps(6))
      `,
      solution: py`
        def collatz_steps(n):
            count = 0
            while n != 1:
                if n % 2 == 0:
                    n = n // 2
                else:
                    n = 3 * n + 1
                count = count + 1
            return count

        print(collatz_steps(6))
      `,
      rows: 11,
      tests: [
        { call: 'collatz_steps(6)', expect: 8 },
        { call: 'collatz_steps(1)', expect: 0 },
        { call: 'collatz_steps(8)', expect: 3 },
      ],
      hidden: [
        { call: 'collatz_steps(7)', expect: 16 },
        { call: 'collatz_steps(27)', expect: 111 },
      ],
      hints: [
        'The loop keeps going while `n` is **not yet** 1: `while n != 1:`.',
        'Inside the loop: `if n % 2 == 0:` halve with `n = n // 2`, `else:` set `n = 3 * n + 1`. Then count the step, once per pass.',
      ],
      explain: [
        'A `while` loop is "repeat until" written the other way round: *keep going while the goal has not been reached*. Each pass changes `n` and counts one step.',
        'Nobody has ever found a starting number that fails to reach 1, and nobody has managed to prove that there is none. Mathematicians call this the Collatz problem.',
      ].join('\n\n'),
    },
    {
      id: 'example-filter',
      type: 'info',
      title: 'A filter at work',
      text: [
        'Of the five patterns, the **filter** is the one you have not yet seen run. Its result is not one value but a **new list**, holding the items that pass a test.',
        ':::example\nThe program starts with an empty list. It tests every number in turn, and `append` adds the ones that are greater than 6. The 3 fails the test and is left out. The original list is not changed.\n:::',
      ].join('\n\n'),
      figure: example(filtering, 'A five-line program in an editor: a loop that appends the numbers greater than 6 to a new list. Its output: the list 12, 7, 20.'),
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Now build one yourself. Arrange the lines into a filter: the program should print the negative numbers, as the list `[-2, -5]`.',
      items: [
        'kept = []',
        'for n in [4, -2, 7, -5, 0]:',
        '    if n < 0:',
        '        kept.append(n)',
        'print(kept)',
      ],
      hints: ['The empty list has to exist before the loop can append to it.', 'The `print` comes last and is not indented: it runs once, after the loop.'],
      explain: 'The filter pattern: start with an empty list, test every item, append the ones that pass. The original list is left alone, and a new, shorter list is built.',
    },
    {
      id: 'example-search',
      type: 'info',
      title: 'A search inside a function',
      text: [
        'Inside a function, a search does not need `break`. A `return` in the loop ends the loop **and** the function, and hands back what was found.',
        ':::example\n`first_negative([4, -2, 7, -5])` returns at -2. The 7 and the -5 are never looked at. In the second call no number passes the test, so the loop runs to its end and the line after it answers `None`: nothing found. That last `return` lines up with `for`, not with `if`.\n:::',
      ].join('\n\n'),
      figure: example(firstNegative, 'A function in an editor that loops over a list and returns the first negative number, or None after the loop. Its output: -2, then None.'),
    },
    {
      id: 'code-first-long',
      type: 'code',
      title: 'A search that returns',
      text: [
        'Write `first_long(words, n)`. It returns the **first** word in the list that has **more than** `n` letters. If no word is that long, it returns `""`.',
        'It is a search like the one you have just seen: a `return` in the loop ends it and hands back the answer in one go.',
      ].join('\n\n'),
      starter: py`
        def first_long(words, n):
            return ""

        print(first_long(["to", "boldly", "go", "where"], 4))
      `,
      solution: py`
        def first_long(words, n):
            for word in words:
                if len(word) > n:
                    return word
            return ""

        print(first_long(["to", "boldly", "go", "where"], 4))
      `,
      rows: 8,
      tests: [
        { call: 'first_long(["to", "boldly", "go", "where"], 4)', expect: 'boldly' },
        { call: 'first_long(["cat", "horse"], 3)', expect: 'horse' },
        { call: 'first_long(["a", "bb"], 5)', expect: '' },
      ],
      hidden: [
        { call: 'first_long(["apple", "fig", "banana"], 4)', expect: 'apple' },
        { call: 'first_long(["abcd", "abcde", "abcdef"], 4)', expect: 'abcde' },
        { call: 'first_long([], 1)', expect: '' },
      ],
      hints: [
        'Loop over the words. Test each one with `if len(word) > n:`.',
        'Inside the `if`, `return word`. The line `return ""` goes **after** the loop: it is only reached when no word passed the test.',
      ],
      explain: 'The `return` inside the loop is the early exit: the function stops at the first word that passes. `return ""` sits after the loop, not in an `else`, so it runs only when every word has been checked and none was long enough.',
    },
    {
      id: 'code-warmest',
      type: 'code',
      stretch: true,
      title: 'Where was the best one?',
      text: [
        'A weather station stores one temperature per day. Write `warmest_day(temps)`: it returns the **position** of the highest temperature. If two days tie, it returns the earlier one. The list is never empty.',
        'This is "find the best" with a twist: remember *where* the best one was. `enumerate` gives you the position of every item.',
      ].join('\n\n'),
      starter: py`
        def warmest_day(temps):
            best = 0
            return best

        print(warmest_day([12, 19, 15]))
      `,
      solution: py`
        def warmest_day(temps):
            best = 0
            for i, t in enumerate(temps):
                if t > temps[best]:
                    best = i
            return best

        print(warmest_day([12, 19, 15]))
      `,
      rows: 9,
      tests: [
        { call: 'warmest_day([12, 19, 15])', expect: 1 },
        { call: 'warmest_day([20, 14])', expect: 0 },
        { call: 'warmest_day([3, 9, 9])', expect: 1 },
      ],
      hidden: [
        { call: 'warmest_day([-5, -2, -9])', expect: 1, message: 'Try a week of frost: `warmest_day([-5, -2, -9])` should give 1. Compare each temperature with the best one **found so far**, not with a made-up starting value such as 0.' },
        { call: 'warmest_day([1, 2, 3, 4])', expect: 3 },
        { call: 'warmest_day([7])', expect: 0 },
        { call: 'warmest_day([4, 4, 4])', expect: 0 },
        { call: 'warmest_day([18, 11, 14])', expect: 0, message: 'The warmest day can come first: `warmest_day([18, 11, 14])` should give 0. Compare each temperature with the best one **found so far**, not with the day before it.' },
      ],
      hints: [
        '`best` holds a position. The best temperature so far is therefore `temps[best]`.',
        '`for i, t in enumerate(temps):` and inside it `if t > temps[best]:` then `best = i`. Use `>`, not `>=`, so that an earlier day keeps the title in a tie.',
      ],
      explain: '`best` starts at position 0 and moves only when a **strictly** higher temperature turns up, so the earlier day wins a tie. Comparing with `temps[best]` instead of a made-up starting value such as 0 keeps the function right for negative temperatures too.',
    },
    {
      id: 'match-patterns',
      type: 'match',
      review: true,
      text: 'Each of these lines sits inside a loop over a list of numbers, and gives the pattern away. **Match each line with its pattern.**',
      pairs: [
        ['`total = total + x`', 'Accumulate'],
        ['`if x < 0: count = count + 1`', 'Count'],
        ['`if x < 0: kept.append(x)`', 'Filter'],
        ['`if x < 0: return x`', 'Search'],
        ['`if x < lowest: lowest = x`', 'Find the best'],
      ],
      explain: 'Add on every pass: accumulate. Add one when a test holds: count. Append when a test holds: filter. Stop when a test holds: search. Replace the champion when it is beaten: find the best.',
    },
  ],
  recap: [
    'Most loops are one of five patterns: **accumulate**, **count**, **filter**, **search** and **find the best**.',
    'A search can stop early: `break` leaves a loop, and `return` leaves the whole function.',
    '`enumerate` gives each item with its position; `zip` walks two lists side by side.',
    'A loop inside a loop multiplies the work. A `while` loop is for "repeat until", when the number of passes is not known in advance.',
  ],
  next: 'Next: lists inside lists, and dictionaries inside lists. Data with structure.',
};
