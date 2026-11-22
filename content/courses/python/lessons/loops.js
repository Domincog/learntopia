// Thinking in Code · Lesson 3 · Again, and Again
import { py, out, listing, tracer, reachedEnd } from '../helpers.js';

const countdown = py`
  n = 2
  while n > 0:
      print(n)
      n = n - 1
  print("Lift off!")
`;

const forever = py`
  n = 1
  while n < 5:
      print(n)
`;

// range(1, 6): the generated question that follows (accumulate) never asks for this range.
const adder = py`
  total = 0
  for n in range(1, 6):
      total = total + n
  print(total)
`;

// Worked examples for the teaching screens. Each uses other names and numbers than the questions after it.
const rangeExample = py`
  for i in range(5, 8):
      print(i * 10)
`;

const savingExample = py`
  saved = 0
  for week in range(4):
      saved = saved + 5
  print(saved)
`;

const letterExample = py`
  count = 0
  for letter in "pepper":
      if letter == "p":
          count = count + 1
  print(count)
`;

export default {
  id: 'loops',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Four lines of code',
      text: 'This program is four lines long. **How many times does it print `Hello`?**',
      figure: listing(py`
        count = 1
        while count <= 5:
            print("Hello")
            count = count + 1
      `),
      min: 0, max: 10, step: 1, answer: 5, tolerance: 0, start: 0, unit: 'times',
      explain: [
        'Five times. The two indented lines run again and again, **while** the condition on line 2 stays True.',
        'Each pass adds 1 to `count`. Once it reaches 6, `count <= 5` is False and the loop stops.',
      ].join('\n\n'),
    },
    {
      id: 'be-computer',
      type: 'interact',
      graded: false,
      title: 'Be the computer',
      text: [
        'You are the computer again. Tap each line as it runs.',
        'Watch closely where Python goes **after line 4**.',
      ].join('\n\n'),
      widget: tracer(countdown, { ask: 'next' }),
      check: reachedEnd('Keep going: tap the next line until the program ends.'),
      solution: { done: true },
      explain: [
        'After the last indented line, Python **jumps back up** to the `while` line and asks its question again.',
        'The body ran twice. The question was asked three times: the third answer was False, so the program moved on to line 5.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'A loop repeats its body',
      text: [
        'A `while` loop works like this:',
        '1. Check the condition.\n2. If it is True, run the indented lines (the **body**), then go back to step 1.\n3. If it is False, carry on below the loop.',
        ':::warn\nSomething in the body has to change, so that the condition turns False one day. Otherwise the loop never ends.\n:::',
      ].join('\n\n'),
      figure: { ...listing(countdown), caption: 'The countdown again. Line 2 holds the condition; lines 3 and 4 are the body.' },
    },
    {
      id: 'forever',
      type: 'choice',
      review: true,
      text: 'Someone forgot a line. **What does this program do?**',
      figure: listing(forever),
      options: [
        { text: 'It prints `1` again and again, without end', correct: true },
        { text: 'It prints 1, 2, 3 and 4', why: 'Nothing in the body changes `n`. It is still 1 on every pass.' },
        { text: 'It prints `1` once', why: 'After the print, Python goes back to the `while` line — and `1 < 5` is still True.' },
        { text: 'It prints nothing', why: '`1 < 5` is True the very first time, so the body does run.' },
      ],
      explain: '`n` never changes, so `n < 5` is True for ever: an **infinite loop**. A real computer would keep printing until someone stopped it.',
    },
    {
      id: 'code-forever',
      type: 'code',
      title: 'Stop the runaway loop',
      text: [
        'Press **Run** to see what a runaway loop looks like here. (Learntopia stops it after a moment and tells you.)',
        'Then add the missing line, so that the program prints the numbers 1 to 4.',
      ].join('\n\n'),
      starter: forever,
      solution: py`
        n = 1
        while n < 5:
            print(n)
            n = n + 1
      `,
      expect: '1\n2\n3\n4',
      wrong: [
        ['2\n3\n4\n5', 'Nearly: `n` grows *before* it is printed. Print first, then add 1.'],
        ['1\n2\n3\n4\n5', 'One number too many. Keep the condition `n < 5`, and add 1 once per pass.'],
      ],
      feedback: ({ result, source }) => {
        if (!result.error || result.error.type !== 'TimeoutError') return null;
        return /n\s*(?:\+=|=\s*n\s*\+)/.test(source)
          ? 'Still running without end. The line that changes `n` has to be **inside** the loop: indent it so that it lines up with `print(n)`.'
          : 'The loop never ends, because nothing inside it makes `n` grow. Add a line to the body that makes `n` bigger.';
      },
      hints: ['The body needs a second line that makes `n` one bigger.', 'Under `print(n)`, with the same indentation: `n = n + 1`.'],
      explain: 'With `n = n + 1` in the body, `n` climbs 1, 2, 3, 4, 5. When it reaches 5, `n < 5` is False and the loop ends.',
    },
    {
      id: 'for-range',
      type: 'choice',
      mode: 'predict',
      title: 'Counting made easy',
      text: 'A `for` loop does the counting for you. **What is the last number this program prints?**',
      figure: listing(py`
        for i in range(5):
            print(i)
      `),
      shuffle: false,
      options: [
        { text: '`4`', correct: true },
        { text: '`5`' },
        { text: '`6`' },
      ],
      explain: '`range(5)` hands out 0, 1, 2, 3, 4. That is **five** numbers: it starts at 0 and stops *before* 5.',
    },
    {
      id: 'teach-for-range',
      type: 'info',
      title: 'for and range',
      text: [
        'A `for` loop runs its body once for each number that `range` hands out. The name after `for` (here `i`) stands for the current number.',
        [
          '| You write | It hands out |',
          '|-----------|--------------|',
          '| `range(3)` | 0, 1, 2 |',
          '| `range(10, 13)` | 10, 11, 12 |',
        ].join('\n'),
        'A range starts at 0 unless you give it a start. It always stops **before** its end number.',
        ':::example\n`range(5, 8)` hands out 5, 6 and 7. That is 8 − 5 = 3 numbers, so the body runs three times. The last line printed is `70`.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: rangeExample, alt: 'A two-line for loop over range(5, 8) in an editor, with its output: 50, 60, 70.' },
    },
    {
      id: 'range-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['count', 'last', 'last-one']);
        const a = rng.int(1, 4);
        const b = a + rng.int(3, 6);
        if (kind === 'count') {
          const code = py`
            for i in range(${a}, ${b}):
                print("Hi")
          `;
          const answer = out(code).split('\n').length;
          return {
            text: 'How many times does this loop print `Hi`?',
            figure: listing(code),
            answer,
            unit: 'times',
            wrong: [[answer + 1, `\`range(${a}, ${b})\` stops *before* ${b}: it gives ${a} up to ${b - 1}.`], [b, `The loop starts at ${a}, not at 0: count from ${a} up to ${b - 1}.`]],
            hints: [`Write out the numbers: ${a}, ${a + 1}, … and stop before ${b}.`],
            explain: `\`range(${a}, ${b})\` gives the numbers ${a} to ${b - 1}. That is ${b} − ${a} = **${answer}** of them, so the body runs ${answer} times.`,
          };
        }
        const n = rng.int(4, 9);
        const code = kind === 'last'
          ? py`
            for i in range(${a}, ${b}):
                print(i)
          `
          : py`
            for i in range(${n}):
                print(i)
          `;
        const answer = Number(out(code).split('\n').pop());
        const stop = kind === 'last' ? b : n;
        return {
          text: 'What is the **last** number this program prints?',
          figure: listing(code),
          answer,
          wrong: [[stop, `\`range\` stops *before* ${stop}. The last number it hands out is one less.`]],
          hints: ['A range never includes its end number.'],
          explain: `The numbers run up to, but not including, ${stop}. So the last one printed is **${answer}**.`,
        };
      },
    },
    {
      id: 'watch-total',
      type: 'interact',
      graded: false,
      title: 'A loop that adds',
      text: 'Step through this loop and watch `total` grow. `range(1, 6)` hands out 1 to 5, and line 3 runs once for each of those numbers.',
      widget: tracer(adder),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: '`total` went 0, 1, 3, 6, 10, 15. Each pass added the current `n` to what was already there. Line 4 is not indented, so it ran once, after the loop.',
    },
    {
      id: 'teach-accumulator',
      type: 'info',
      title: 'The accumulator pattern',
      text: [
        'What you just watched is a pattern you will use all the time. It is called an **accumulator**.',
        '1. **Before** the loop, start a variable at 0.\n2. **Inside** the loop, update it from its old value.\n3. **After** the loop, on a line that is not indented, use the result.',
        ':::example\n`saved` starts at 0. `range(4)` makes the body run four times, and each pass adds 5: 5, 10, 15, 20. The `print` is outside the loop, so it runs once and shows `20`.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: savingExample, alt: 'A four-line program with a for loop that adds 5 four times, in an editor, with its output: 20.' },
    },
    {
      id: 'accumulate',
      type: 'numeric',
      review: true,
      title: 'Keeping a running total',
      gen: (rng) => {
        const a = rng.int(1, 3);
        const b = a + rng.int(3, 4);
        const code = py`
          total = 0
          for n in range(${a}, ${b}):
              total = total + n
          print(total)
        `;
        const answer = Number(out(code));
        const terms = [];
        for (let i = a; i < b; i++) terms.push(i);
        return {
          text: 'This loop adds things up. **What does the program print?**',
          figure: listing(code),
          answer,
          wrong: [
            [answer + b, `That includes ${b}. But \`range(${a}, ${b})\` stops before ${b}: it gives ${terms.join(', ')}.`],
            [b - 1, 'That is the last value of `n`. `total` adds up *all* of them.'],
            [0, 'Line 3 changes `total` on every pass of the loop.'],
          ],
          hints: [`The loop gives \`n\` the values ${terms.join(', ')}.`, 'Start from 0 and add each value in turn.'],
          explain: `\`total\` starts at 0 and grows on every pass: ${terms.join(' + ')} = **${answer}**.`,
        };
      },
    },
    {
      id: 'example-count',
      type: 'info',
      title: 'Counting only some',
      text: [
        'A `for` loop can also walk through a **string**, one character at a time. And a loop body may hold an `if`: the more a line is indented, the deeper it sits.',
        ':::example\nStep through it. `letter` is `"p"`, then `"e"`, then `"p"` again, and so on. Line 4 belongs to the `if`, so `count` goes up only on the passes where the letter is `"p"`. The last line runs once and prints `3`.\n:::',
      ].join('\n\n'),
      figure: tracer(letterExample, { alt: 'A five-line program in a tracer: a for loop walks through the word pepper and an if inside it counts the letter p. The count ends at 3.' }),
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Now build such a loop yourself. Put the lines in order to count how many times the letter `a` appears in `banana`.',
      items: [
        'count = 0',
        'for letter in "banana":',
        '    if letter == "a":',
        '        count = count + 1',
        'print(count)',
      ],
      hints: ['The counter has to exist before the loop starts.', 'Indentation shows the nesting: the `if` is inside the loop, and the adding is inside the `if`.'],
      explain: 'Another accumulator: `count` starts at 0, and goes up by 1 only on the passes where the letter is `a`. The print comes after the loop, so it runs once: `3`.',
    },
    {
      id: 'code-sum',
      type: 'code',
      title: 'Your turn: add them all up',
      text: [
        'Complete the program so that it adds up all the whole numbers from 1 to `n`. With `n = 100` the answer is 5050.',
        'Use a loop. The checker changes `n` to try other values.',
      ].join('\n\n'),
      starter: py`
        n = 100
        total = 0
        # add up 1 + 2 + ... + n

        print(total)
      `,
      solution: py`
        n = 100
        total = 0
        # add up 1 + 2 + ... + n
        for i in range(1, n + 1):
            total = total + i
        print(total)
      `,
      tests: [
        { set: { n: 100 }, stdout: '5050' },
        { set: { n: 10 }, stdout: '55' },
      ],
      hidden: [{ set: { n: 1 }, stdout: '1' }],
      require: [{ pattern: /\b(?:for|while)\b/, message: 'That gives the right number, but this task asks for a loop that does the adding.' }],
      feedback: ({ check }) => {
        if (!check || check.kind !== 'output' || check.error) return null;
        const n = check.set ? check.set.n : 100;
        const got = Number(check.actual);
        const want = Number(check.expected);
        if (got === want - n) return `Off by one: your loop stops at ${n - 1}. A range leaves out its end number, so use \`range(1, n + 1)\`.`;
        if (got === want + n + 1) return 'Off by one: your loop goes one number past `n`.';
        if (got === n || got === n - 1) return '`total` ends up as just the last number. Each pass has to *add* to it: `total = total + i`.';
        return null;
      },
      hints: ['You need the numbers 1, 2, …, n. Which range hands out exactly those?', '`for i in range(1, n + 1):` — and inside the loop, add `i` to `total`.'],
      explain: '`range(1, n + 1)` hands out 1 up to n, and the accumulator adds each one. The `+ 1` is there because a range stops *before* its end number.',
    },
    {
      id: 'code-rumour',
      type: 'code',
      stretch: true,
      title: 'How long until everyone knows?',
      text: [
        'A rumour starts with 1 person. Every day, the number of people who know it **doubles**.',
        'Write a loop that finds how many days it takes until **more than** `target` people know, and print the number of days. (This is a job for `while`: you cannot tell in advance how many passes it takes.)',
      ].join('\n\n'),
      starter: py`
        target = 1000
        people = 1
        days = 0
        # keep doubling until more than target people know

        print(days)
      `,
      solution: py`
        target = 1000
        people = 1
        days = 0
        # keep doubling until more than target people know
        while people <= target:
            people = people * 2
            days = days + 1
        print(days)
      `,
      rows: 9,
      tests: [
        { set: { target: 1000 }, stdout: '10' },
        { set: { target: 10 }, stdout: '4' },
      ],
      hidden: [
        { set: { target: 8 }, stdout: '4', message: 'Close. Try `target = 8`: when exactly 8 people know, that is not yet *more than* 8, so the loop needs one more day.' },
        { set: { target: 0 }, stdout: '0' },
      ],
      hints: ['The loop should keep going while `people` is **not yet** more than `target`.', '`while people <= target:` — and in the body, double `people` and add 1 to `days`.'],
      explain: 'The loop runs while `people <= target`. Each pass doubles the crowd and counts one day: 2, 4, 8, … 1024 on day 10. Doubling grows fast.',
    },
    {
      id: 'match-range',
      type: 'match',
      review: true,
      text: 'Match each range with the numbers it hands out.',
      pairs: [
        ['`range(4)`', '0, 1, 2, 3'],
        ['`range(1, 4)`', '1, 2, 3'],
        ['`range(1, 5)`', '1, 2, 3, 4'],
        ['`range(2, 5)`', '2, 3, 4'],
      ],
      explain: 'A range starts at its first number (or at 0 if there is only one) and stops **before** its last. `range(1, 5)` has four numbers, not five.',
    },
  ],
  recap: [
    'A loop runs its indented **body** again and again. After the last line of the body, Python jumps back to the top of the loop.',
    '`while` repeats as long as its condition is True. Something in the body must change, or the loop never ends.',
    '`for i in range(a, b)` counts from `a` up to `b - 1`: a range stops **before** its end number.',
    'An **accumulator** starts at 0 and is updated inside the loop: that is how programs add up and count.',
  ],
  next: 'Next: teach Python your own commands.',
};
