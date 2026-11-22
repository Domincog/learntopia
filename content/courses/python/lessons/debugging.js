// Thinking in Code · Lesson 7 · When It Goes Wrong
import { py, listing, tracer, reachedEnd, errorOf } from '../helpers.js';

const shopBug = py`
  prices = [4, 6, 10]
  total = 0
  for p in prices:
      total = p
  print("Total:", total)
`;

// A first crash to read together, on the teaching screen: other names than the bug hunts that follow.
const typoCrash = py`
  width = 4
  print(widht * 2)
`;

// The kinds of error this lesson uses. The teaching table shows all of them;
// the matching question is built from the first four, so the two cannot disagree.
const ERROR_KINDS = [
  ['NameError', 'A misspelled name, or one used before it has a value'],
  ['TypeError', 'Two kinds of value that do not mix, like text + number'],
  ['IndexError', 'A position past the end of a list'],
  ['SyntaxError', 'A line Python cannot read: a missing colon, bracket or quote'],
  ['ZeroDivisionError', 'Dividing by zero, for example by the `len` of an empty list'],
];

// Broken programs for the "read the message, choose the fix" review step.
const CASES = [
  {
    code: py`
      names = ["Ana", "Bo", "Cy"]
      print(names[3])
    `,
    options: [
      { text: 'Change `names[3]` to `names[2]`', correct: true },
      { text: 'Change the square brackets to round ones', why: 'Round brackets *call* a function. `names` is a list, so that gives a different error.' },
      { text: 'Put quotes around the 3', why: 'An index has to be a whole number, not text.' },
    ],
    explain: 'Three items sit at indexes 0, 1 and 2. Index 3 is one past the end — the classic off-by-one slip.',
  },
  {
    code: py`
      price = 4
      print("Total: " + price * 3)
    `,
    options: [
      { text: 'Wrap the number: `str(price * 3)`', correct: true },
      { text: 'Remove the quotes around `Total: `', why: 'Without quotes, Python would treat `Total` as a name and the colon as a mistake.' },
      { text: 'Change `price = 4` to `price = 4.0`', why: 'A decimal number is still a number. `+` cannot join text and a number.' },
    ],
    explain: '`+` joins text to text, or adds numbers to numbers — never a mixture. `str(...)` turns the number into text first.',
  },
  {
    code: py`
      score = 80
      if score > 50:
          print("Passed with", scroe)
    `,
    options: [
      { text: 'Correct the spelling on line 3: `score`', correct: true },
      { text: 'Add the line `scroe = 0` at the top', why: 'That silences the message, but the program would then print 0 instead of the real score.' },
      { text: 'Put quotes around `scroe`', why: 'Then it prints the word, not the number the name stands for.' },
    ],
    explain: 'A NameError nearly always means a typo, or a name used before it was given a value. The message even tells you which name.',
  },
  {
    code: py`
      marks = []
      average = sum(marks) / len(marks)
      print(average)
    `,
    note: '(`sum(marks)` adds up a list and `len(marks)` counts its items. `//` is division rounded down to a whole number.)',
    options: [
      { text: 'Only divide when the list has at least one mark', correct: true },
      { text: 'Use `//` instead of `/`', why: 'That is still a division by zero.' },
      { text: 'Divide by `len(marks) - 1` instead', why: 'That hides the message by dividing by −1, and gives a wrong average for other lists.' },
    ],
    explain: 'The list is empty, so `len(marks)` is 0. The division is fine; the *value* is the problem. An `if` can check for an empty list first.',
  },
];

export default {
  id: 'debugging',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Nothing looks wrong',
      text: 'A shop\'s program adds up three prices. The customer should pay 20. **What does the program print?**',
      figure: listing(shopBug),
      options: [
        { text: '`Total: 20`' },
        { text: '`Total: 10`', correct: true },
        { text: '`Total: 0`' },
        { text: 'An error message' },
      ],
      shuffle: false,
      explain: [
        'It prints `Total: 10` — and Python does not complain at all. Line 4 *replaces* the total instead of adding to it.',
        'Some bugs stop the program with a message. Others quietly give a wrong answer. Either way, guessing is slow. This lesson gives you a **method**.',
      ].join('\n\n'),
    },
    {
      id: 'teach-error-message',
      type: 'info',
      title: 'First, read the message',
      text: [
        'Some bugs stop the program. Python then tells you what went wrong, and its message always has the same three parts.',
        '1. The **kind** of error. It is the first word: here `NameError`.\n2. **Where** it happened: line 2.\n3. A short **description**: the name `widht` is not defined.',
        'So go to line 2 and look at that name. It is a typo for `width`. Correct it and press **Run**.',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, rows: 3, code: typoCrash, alt: 'A two-line program in an editor, with the error message it produces when run: NameError on line 2, name widht is not defined.' },
    },
    {
      id: 'read-message',
      type: 'fill',
      title: 'Your turn: read a message',
      text: [
        'Here is another real crash. Find the three parts of the message: the kind of error, the line, and the description.',
        'The note under the message says what this kind of error usually means. Read it all, then fill in the gaps.',
      ].join('\n\n'),
      figure: {
        type: 'py-run', autorun: true, rows: 3,
        code: py`
          age = 12
          label = "Age: " + age
          print(label)
        `,
        alt: 'A three-line program in an editor, with the error message it produces when run.',
      },
      template: 'The program stopped on line [[2]]. The kind of error is a [[NameError|*TypeError|IndexError]]. One fix: write [[str]]`(age)` instead of `age`.',
      explain: 'The message names the line (2) and the kind of error (TypeError), and says what Python could not do: join text and a number with `+`. `str(age)` turns the number into text first.',
    },
    {
      id: 'teach-error-kinds',
      type: 'info',
      title: 'The usual suspects',
      text: [
        'The first word of a message already narrows things down. These are the kinds of error you will meet most.',
        [
          '| First word | Usual cause |',
          '|------------|-------------|',
          ...ERROR_KINDS.map(([kind, cause]) => `| \`${kind}\` | ${cause} |`),
        ].join('\n'),
        'A SyntaxError is special. Python finds it **before** the program starts, so not a single line runs.',
      ].join('\n\n'),
    },
    {
      id: 'match-errors',
      type: 'match',
      review: true,
      text: 'The first word of an error message already narrows things down. Match each kind of error with its usual cause.',
      pairs: ERROR_KINDS.slice(0, 4).map(([kind, cause]) => [`\`${kind}\``, cause]),
      explain: 'You do not need to memorise every error. Read the first word, go to the line it names, and look for the usual suspect.',
    },
    {
      id: 'code-name',
      type: 'code',
      title: 'Bug hunt 1',
      text: [
        'This program should print the average of three marks: `4.0`. (`/` divides, and its result is always written with a decimal point.)',
        'Press **Run** and read the message. Which line? What kind of error? Then fix it.',
      ].join('\n\n'),
      starter: py`
        marks = [3, 5, 4]
        total = 0
        for m in marks:
            total = total + m
        average = totl / len(marks)
        print(average)
      `,
      solution: py`
        marks = [3, 5, 4]
        total = 0
        for m in marks:
            total = total + m
        average = total / len(marks)
        print(average)
      `,
      expect: '4.0',
      hints: ['The message says which name Python does not know. Compare it, letter by letter, with the name on line 2.'],
      explain: 'A **NameError** on line 5: `totl` is not `total`. Python cannot guess what you meant, but its message points straight at the typo.',
    },
    {
      id: 'code-equals',
      type: 'code',
      title: 'Bug hunt 2',
      text: [
        'This one will not even start: Python cannot read it. It should print `Jackpot!` when the guess matches the secret number.',
        'Run it, read the message, and fix the line it points to.',
      ].join('\n\n'),
      starter: py`
        guess = 7
        secret = 7
        if guess = secret:
            print("Jackpot!")
        else:
            print("Try again")
      `,
      solution: py`
        guess = 7
        secret = 7
        if guess == secret:
            print("Jackpot!")
        else:
            print("Try again")
      `,
      expect: 'Jackpot!',
      hidden: [{ set: { guess: 3 }, stdout: 'Try again' }, { set: { guess: 9 }, stdout: 'Try again' }, { set: { guess: 3, secret: 3 }, stdout: 'Jackpot!' }],
      hints: ['Line 3 should *ask* whether two values are equal. Which symbol asks that question?'],
      explain: 'A **SyntaxError**: one `=` gives a name a value, which makes no sense inside an `if`. Two — `==` — ask whether the values are equal.',
    },
    {
      id: 'method',
      type: 'info',
      title: 'A method, not luck',
      text: [
        'Good debuggers do not stare at the code and hope. They work like detectives:',
        '1. **Read the message.** What kind of error, on which line?\n2. **Reproduce it.** Run the program. Note what you expected and what you got.\n3. **Make a guess you can test.** "I think `total` is wrong after the loop."\n4. **Test the guess.** Add a `print`, or step through in the tracer, and compare with what you expected.\n5. **Change one thing**, then run again.',
        ':::tip\nNo error message? Then step 1 becomes: *which part of the output is wrong, and what should it be?*\n:::',
      ].join('\n\n'),
    },
    {
      id: 'code-range',
      type: 'code',
      title: 'Bug hunt 3',
      text: [
        'No error message this time, just the wrong output. The program should print the numbers **1 to 5**, one per line.',
        'Run it and compare what you get with the goal. What exactly is different?',
      ].join('\n\n'),
      starter: py`
        for i in range(1, 5):
            print(i)
      `,
      solution: py`
        for i in range(1, 6):
            print(i)
      `,
      expect: '1\n2\n3\n4\n5',
      wrong: [['0\n1\n2\n3\n4\n5', 'Now the end is right, but the list starts at 0. Keep the 1 at the front of the range.']],
      hints: ['The output stops one number early. A range never includes its end number.'],
      explain: 'An **off-by-one** error: `range(1, 5)` stops before 5. Comparing the output with the goal showed exactly what was missing: the last number.',
    },
    {
      id: 'find-line',
      type: 'interact',
      graded: false,
      title: 'Test a guess',
      text: [
        'Back to the shop that printed `Total: 10` instead of 20. A guess you can test: *`total` should grow by each price — 4, then 10, then 20.*',
        'Step through the program and watch `total`. Find the first step where it does something else.',
      ].join('\n\n'),
      widget: tracer(shopBug),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: 'On the second pass, `total` changes from 4 to 6 — but 4 + 6 should give 10. The only line that touches `total` in the loop is line 4, and it says `total = p`. Found it.',
    },
    {
      id: 'code-logic',
      type: 'code',
      title: 'Bug hunt 4',
      text: 'You have found the guilty line. Fix the program so that it prints `Total: 20`.',
      starter: shopBug,
      solution: py`
        prices = [4, 6, 10]
        total = 0
        for p in prices:
            total = total + p
        print("Total:", total)
      `,
      expect: 'Total: 20',
      hidden: [{ set: { prices: [1, 1] }, stdout: 'Total: 2', message: 'That prints 20 for these prices, but the total has to be worked out from the list: `total = total + p`.' }],
      hints: ['Line 4 should *add* `p` to the total, not replace the total with `p`.'],
      explain: '`total = total + p` adds each price to what is already there. This bug gave no error message; watching the variable in the tracer exposed it.',
    },
    {
      id: 'code-indent',
      type: 'code',
      title: 'Bug hunt 5',
      text: [
        'One more. This program should print the three words, and then `Done` **once**, at the very end.',
        'Run it and look closely at the output. Which lines are repeating that should not?',
      ].join('\n\n'),
      starter: py`
        for word in ["ready", "steady", "go"]:
            print(word)
            print("Done")
      `,
      solution: py`
        for word in ["ready", "steady", "go"]:
            print(word)
        print("Done")
      `,
      expect: 'ready\nsteady\ngo\nDone',
      hints: ['`Done` appears three times, so its line must be inside the loop. What decides whether a line is inside?'],
      explain: 'The last line was indented, so Python treated it as part of the loop body. Moving it back to the left edge puts it *after* the loop. Indentation is structure.',
    },
    {
      id: 'read-fix',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(CASES);
        const err = errorOf(c.code);
        return {
          text: [
            'This program stops with the message below. **What is the best fix?**',
            `\`\`\`\n${err.type} on line ${err.line}\n${err.message}\n\`\`\``,
            ...(c.note ? [c.note] : []),
          ].join('\n\n'),
          figure: listing(c.code, { mark: [err.line] }),
          columns: 1,
          options: c.options,
          explain: c.explain,
        };
      },
    },
    {
      id: 'first-move',
      type: 'choice',
      review: true,
      text: 'A program runs without any error message, but prints the wrong answer. **What is the best first move?**',
      columns: 1,
      options: [
        { text: 'Work out what the output *should* be, then trace or print to find where the program first differs', correct: true },
        { text: 'Change something that looks suspicious and run it again', why: 'That is guessing. It sometimes works — and teaches you nothing when it does.' },
        { text: 'Read every line again, very carefully', why: 'Your eyes tend to see what you *meant* to write. Evidence from the running program is far more reliable.' },
        { text: 'Delete the program and start again', why: 'The same misunderstanding usually comes back in the new version.' },
      ],
      explain: 'A bug is a gap between what you expect and what happens. Pin down the expectation first; then let the tracer or a `print` show you the first place where reality disagrees.',
    },
    {
      id: 'order-method',
      type: 'order',
      review: true,
      text: 'A program has just stopped with an error message. Put the steps of the debugging method in order.',
      items: [
        'Read the error message: what kind, which line?',
        'Run the program again; note what you expected and what you got',
        'Make a guess about the cause that you can test',
        'Test the guess with a print or the tracer',
        'Change one thing, then run again',
      ],
      labels: ['First', 'Last'],
      explain: 'Evidence first, then a testable guess, then one change at a time. If you change three things at once, you never learn which one mattered.',
    },
  ],
  recap: [
    'An error message tells you the **kind** of error and the **line**. Read it before you touch the code.',
    'Not every bug has a message. Then the clue is the gap between the output you expected and the output you got.',
    'Debug with a method: reproduce, make a testable guess, test it with a `print` or the tracer, and change one thing at a time.',
  ],
  next: 'You can now read, trace, write and repair small programs. From here it is practice: every program you write will give you something new to debug.',
};
