// Python II: Building Programs · Lesson 5 · Functions That Call Themselves
import { py, out, errorOf, listing, tracer, runner, reachedEnd } from '../helpers.js';

const countdown = (n) => py`
  def countdown(n):
      if n == 0:
          print("Lift off!")
          return
      print(n)
      countdown(n - 1)

  countdown(${n})
`;
const hookLines = out(countdown(3)).split('\n');

const endless = py`
  def countdown(n):
      print(n)
      countdown(n - 1)

  countdown(3)
`;
const endlessError = errorOf(endless);

const repaired = py`
  def countdown(n):
      if n == 0:
          return
      print(n)
      countdown(n - 1)

  countdown(3)
`;

const factorial = py`
  def fact(n):
      if n == 1:
          return 1
      smaller = fact(n - 1)
      return n * smaller

  print(fact(3))
`;

const trip = py`
  def trip(n):
      if n == 0:
          print("turn")
          return
      print("down", n)
      trip(n - 1)
      print("up", n)

  trip(2)
`;
const tripLines = out(trip).split('\n');
const inOrder = (lines) => lines.map((l) => `\`${l}\``).join(', ');

const fib = (n) => py`
  calls = 0

  def fib(n):
      global calls
      calls = calls + 1
      if n < 2:
          return n
      return fib(n - 1) + fib(n - 2)

  print(fib(${n}), "after", calls, "calls")
`;
// "55 after 177 calls" -> [55, 177]
const fibFacts = (n) => out(fib(n)).split(' after ').map((part) => parseInt(part, 10));
const [fib10, calls10] = fibFacts(10);
const [fib20, calls20] = fibFacts(20);
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ',');

// Worked examples for the teaching screens: each runs in the editor, with its output showing.
const lengthOf = py`
  def length(text):
      if text == "":
          return 0
      return 1 + length(text[1:])

  print(length("cat"))
`;

const counting = py`
  def count(items):
      n = 0
      for item in items:
          if isinstance(item, list):
              n = n + count(item)
          else:
              n = n + 1
      return n

  print(isinstance([2, 3], list), isinstance(7, list))
  print(count([7, [8, 9], [6, [5]]]))
`;

/** A program in the editor that has already been run: the code and what it prints. */
const example = (code, alt) => runner(code, { autorun: true, alt });

/** Anticipated wrong answers: drop any that equal the answer or share a value with another entry. */
const slips = (answer, entries) => entries.filter(([v], i, all) => v !== answer && all.filter(([u]) => u === v).length === 1);
const downFrom = (n, to) => Array.from({ length: n - to + 1 }, (_, i) => n - i);

export default {
  id: 'recursion',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A function that calls itself',
      text: 'Look at line 6: `countdown` calls **itself**. There is no loop anywhere. **What do you think the program prints?**',
      figure: listing(countdown(3)),
      options: [
        { text: '`3`, `2`, `1`, then `Lift off!`', correct: true },
        { text: '`3`, then `Lift off!`' },
        { text: '`3` again and again, without end' },
        { text: 'An error: a function cannot call itself' },
      ],
      columns: 1,
      explain: [
        `It counts down: ${inOrder(hookLines)}. Each call prints its number and then asks \`countdown\` to deal with a **smaller** one. When \`n\` reaches 0, the function answers by itself and calls nobody.`,
        'A function that calls itself is called **recursive**.',
      ].join('\n\n'),
    },
    {
      id: 'watch-countdown',
      type: 'interact',
      graded: false,
      title: 'Watch the calls pile up',
      text: [
        'Step through `countdown(2)`. Under *Inside countdown*, the tracer lists the variables of the call that is running **right now**.',
        'Watch `n`. Does line 6 change it, or does something else happen?',
      ].join('\n\n'),
      widget: tracer(countdown(2)),
      check: reachedEnd(),
      solution: { done: true },
      explain: [
        'Line 6 does not change `n`. It starts a **new call**, with an `n` of its own: first 2, then 1, then 0. Three calls, three separate sets of variables.',
        'No call is finished until the call it made has finished. An hourglass marks a line that is waiting. When the call with `n = 0` returns, the others finish one by one, the newest first.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Two parts, always',
      text: [
        'Every recursive function has two parts.',
        '- A **base case**: an input so small that the answer is known at once. No further call is made.\n- A **recursive case**: do one small piece of the job, and hand the rest to the same function as a **smaller** input.',
        '```python\ndef countdown(n):\n    if n == 0:             # base case\n        print("Lift off!")\n        return\n    print(n)               # one small piece\n    countdown(n - 1)       # the rest: a smaller problem\n```',
        'Every call moves one step closer to the base case. That is what guarantees an end.',
      ].join('\n\n'),
    },
    {
      id: 'no-base',
      type: 'interact',
      title: 'What if it never stops?',
      text: [
        'Someone left out the base case. Press **Run**, and scroll down the output to see how it ends.',
        'Then repair the function, so that the program prints `3`, `2`, `1` and stops.',
      ].join('\n\n'),
      widget: runner(endless),
      check: (s) => {
        if (!s.runs) return 'Press Run to see what happens without a base case.';
        if (s.error === 'RecursionError') return 'Still no way out: every call makes another one. Before the `print`, test for `n == 0` and `return`.';
        if (s.error) return 'The program stopped with an error. Read the message, fix the line and run it again.';
        const printed = s.stdout.trim();
        if (printed === '3\n2\n1') return true;
        if (printed === '3\n2\n1\n0') return 'Nearly: the 0 should not be printed. Test for the base case **before** the `print`.';
        return 'The output should be `3`, `2` and `1`, each on a line of its own.';
      },
      solution: { code: repaired },
      hints: ['The function needs a case in which it does **not** call itself.', 'Make these the first two lines of the body: `if n == 0:` and, indented under it, `return`.'],
      explain: [
        `Without a base case every call makes another: 3, 2, 1, 0, -1, -2… Python stops the program with a **${endlessError.type}** once too many calls are waiting. Real Python allows about a thousand; Learntopia stops at 200.`,
        'The cure is always the same. Make sure one case returns **without** calling again, and that every call moves towards that case.',
      ].join('\n\n'),
    },
    {
      id: 'watch-fact',
      type: 'interact',
      graded: false,
      title: 'Answers come back up',
      text: [
        '`fact(n)` multiplies the whole numbers from `n` down to 1, so `fact(3)` is 3 × 2 × 1.',
        'Step through. On the way **down**, watch `n` shrink. On the way **back**, watch what each call returns.',
      ].join('\n\n'),
      widget: tracer(factorial),
      check: reachedEnd(),
      solution: { done: true },
      explain: [
        `Down: \`fact(3)\` waits for \`fact(2)\`, which waits for \`fact(1)\`. The base case answers 1. Then back up: \`fact(2)\` returns 2 × 1 = 2, and \`fact(3)\` returns 3 × 2 = **${out(factorial)}**.`,
        'Each call trusts the smaller call to do its job, and adds one multiplication of its own. Lines 4 and 5 are usually written as one: `return n * fact(n - 1)`.',
      ].join('\n\n'),
    },
    {
      id: 'example-trace',
      type: 'info',
      title: 'Down to the base case, and back up',
      text: [
        'In `fact`, the result of the inner call got a name before it was used. Usually the call sits right inside the `return` line, as it does here. `text[1:]` is the text without its first character: a **smaller** input.',
        'To work out what such a function returns, write the chain of calls **down** to the base case. Then fill in the answers from the bottom **up**.',
        [
          '| Call | Returns |',
          '|------|---------|',
          '| `length("cat")` | 1 + `length("at")` = 3 |',
          '| `length("at")` | 1 + `length("t")` = 2 |',
          '| `length("t")` | 1 + `length("")` = 1 |',
          '| `length("")` | 0: the base case |',
        ].join('\n'),
      ].join('\n\n'),
      figure: example(lengthOf, 'A recursive function in an editor that counts the characters of a text: 0 for the empty text, otherwise 1 plus the length of the text without its first character. Its output: 3.'),
    },
    {
      id: 'rec-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['sum', 'fact', 'power', 'digits']);
        if (kind === 'sum') {
          const n = rng.int(3, 6);
          const code = py`
            def total(n):
                if n == 0:
                    return 0
                return n + total(n - 1)

            print(total(${n}))
          `;
          const answer = Number(out(code));
          const chain = downFrom(n, 0).join(' + ');
          return {
            text: 'A recursive function. **What does this program print?**',
            figure: listing(code),
            answer,
            wrong: slips(answer, [
              [n, `That is only the share of the first call. Line 4 adds the result of \`total(${n - 1})\` to it.`],
              [n + (n - 1), `The calls do not stop after one step. They go all the way down to the base case: ${chain}.`],
              [0, 'That is what the base case returns. Every call above it adds its own `n` on the way back.'],
            ]),
            hints: [`\`total(${n})\` needs \`total(${n - 1})\`, which needs \`total(${n - 2})\`… Write out the chain down to \`total(0)\`.`, '`total(0)` returns 0. Work back up from there, adding one number per call.'],
            explain: `\`total(${n})\` is ${n} + \`total(${n - 1})\`, and so on down to \`total(0)\`, which is 0. On the way back up the numbers are added: ${chain} = **${answer}**.`,
          };
        }
        if (kind === 'fact') {
          const n = rng.int(3, 5);
          const code = py`
            def fact(n):
                if n == 1:
                    return 1
                return n * fact(n - 1)

            print(fact(${n}))
          `;
          const answer = Number(out(code));
          const chain = downFrom(n, 1).join(' × ');
          return {
            text: 'A recursive function. **What does this program print?**',
            figure: listing(code),
            answer,
            wrong: slips(answer, [
              [n * (n - 1), `The calls do not stop after one step. They go all the way down to the base case: ${chain}.`],
              [(n * (n + 1)) / 2, 'That adds the numbers. Line 4 **multiplies** `n` by the result of the smaller call.'],
              [n, `That is only the share of the first call. Line 4 multiplies it by the result of \`fact(${n - 1})\`.`],
              [1, 'That is what the base case returns. Every call above it multiplies by its own `n` on the way back.'],
            ]),
            hints: [`\`fact(${n})\` needs \`fact(${n - 1})\`, which needs \`fact(${n - 2})\`… Write out the chain down to \`fact(1)\`.`, '`fact(1)` returns 1. Work back up from there, multiplying once per call.'],
            explain: `\`fact(${n})\` is ${n} × \`fact(${n - 1})\`, and so on down to \`fact(1)\`, which is 1. On the way back up the numbers are multiplied: ${chain} = **${answer}**.`,
          };
        }
        if (kind === 'power') {
          const n = rng.int(3, 6);
          const code = py`
            def power(n):
                if n == 0:
                    return 1
                return 2 * power(n - 1)

            print(power(${n}))
          `;
          const answer = Number(out(code));
          const doubling = Array.from({ length: n + 1 }, (_, i) => 2 ** i).join(' → ');
          return {
            text: 'A recursive function. **What does this program print?**',
            figure: listing(code),
            answer,
            wrong: slips(answer, [
              [2 * n, 'Each call **doubles** what the call below it returns. It does not add 2.'],
              [2 ** (n - 1), `Count the doublings: one for every call from \`power(${n})\` down to \`power(1)\`. That makes ${n} of them.`],
              [1, 'That is what the base case returns. Every call above it doubles the result on the way back.'],
            ]),
            hints: [`\`power(${n})\` needs \`power(${n - 1})\`, and so on down to \`power(0)\`.`, '`power(0)` returns 1. Each call above it doubles what it gets back.'],
            explain: `\`power(0)\` returns 1, and each of the ${n} calls above it doubles what it gets back: ${doubling}. The program prints **${answer}**.`,
          };
        }
        const length = rng.int(3, 5);
        const n = rng.int(10 ** (length - 1), 10 ** length - 1);
        const code = py`
          def digits(n):
              if n < 10:
                  return 1
              return 1 + digits(n // 10)

          print(digits(${n}))
        `;
        const answer = Number(out(code));
        const shrinking = Array.from({ length }, (_, i) => Math.floor(n / 10 ** i)).join(' → ');
        return {
          text: 'A recursive function. Remember that `//` divides and drops the remainder, so `n // 10` is `n` without its last digit. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [answer - 1, 'The base case counts as well: a number below 10 still has one digit, and that call returns 1.'],
            [1, 'That is what the base case returns. Every call above it adds 1 on the way back.'],
            [Math.floor(n / 10), `That is \`${n} // 10\`, the input of the second call. The function does not return it: each call adds 1 to a count.`],
          ]),
          hints: [`Each call hands on a number that is one digit shorter: ${n}, then ${Math.floor(n / 10)}…`, 'Count the calls. Every one of them adds 1.'],
          explain: `Each call drops the last digit and adds 1 to the count: ${shrinking}. That is ${length} calls, so the program prints **${answer}**, the number of digits.`,
        };
      },
    },
    {
      id: 'down-up',
      type: 'choice',
      review: true,
      title: 'Before the call, and after',
      text: 'This function prints something **before** it calls itself and something **after**. **In what order do the lines appear?**',
      figure: listing(trip),
      options: [
        { text: inOrder(tripLines), correct: true },
        { text: inOrder(['down 2', 'up 2', 'down 1', 'up 1', 'turn']), why: 'Line 7 has to wait. `trip(2)` cannot print `up 2` until the call it made on line 6 has completely finished.' },
        { text: inOrder(['down 2', 'down 1', 'turn', 'up 2', 'up 1']), why: 'The calls finish in reverse order: the last one to start, `trip(1)`, is the first to carry on.' },
        { text: inOrder(['down 2', 'down 1', 'turn']), why: 'After `turn`, the calls that were waiting carry on and run their line 7, each with its own `n`.' },
      ],
      columns: 1,
      explain: 'Every call pauses on line 6 until the call it made has finished. So the `down` lines come first, on the way in. Then comes `turn`. Then each waiting call wakes up, the **newest first**, and prints its `up` line with the `n` it has kept all along.',
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Recursion works on lists too: the total of a list is its first item plus the total of **the rest**. A slice works on a list as it does on a string, so `nums[1:]` is the list without its first item. Arrange the lines so that the program prints `15`.',
      items: [
        'def total(nums):',
        '    if nums == []:',
        '        return 0',
        '    rest = total(nums[1:])',
        '    return nums[0] + rest',
        'print(total([4, 5, 6]))',
      ],
      hints: ['The base case is tested first: an empty list has the total 0.', '`nums[1:]` is the list without its first item: a smaller problem of the same kind. Its total is needed before the last line of the function can add to it.'],
      explain: '`total([4, 5, 6])` is 4 + `total([5, 6])`, which is 5 + `total([6])`, which is 6 + `total([])`. The empty list is the base case. Each call hands on a **shorter** list, so the base case is always reached.',
    },
    {
      id: 'code-reverse',
      type: 'code',
      title: 'Your turn: reverse, recursively',
      text: [
        'Write `reverse(text)` with recursion and **no loop**. The idea: the reverse of `"stop"` is the reverse of `"top"`, followed by `"s"`.',
        '- Base case: the empty string is its own reverse. It is already in the starter.\n- Recursive case: reverse everything after the first character, `text[1:]`, and put the first character at the end.',
      ].join('\n\n'),
      starter: py`
        def reverse(text):
            if text == "":
                return ""
            return text

        print(reverse("stop"))
      `,
      solution: py`
        def reverse(text):
            if text == "":
                return ""
            return reverse(text[1:]) + text[0]

        print(reverse("stop"))
      `,
      rows: 7,
      tests: [
        { call: 'reverse("stop")', expect: 'pots' },
        { call: 'reverse("a")', expect: 'a' },
        { call: 'reverse("")', expect: '' },
      ],
      hidden: [
        { call: 'reverse("lemma")', expect: 'ammel' },
        { call: 'reverse("ab")', expect: 'ba' },
      ],
      forbid: [
        { pattern: /\b(for|while)\b/, message: 'That works, but this task asks for recursion: no loop. Let `reverse` call itself on a shorter string.' },
        { pattern: /\[\s*:\s*:\s*-\s*1\s*\]|\breversed\s*\(/, message: 'A handy shortcut, but this task asks you to write the recursion yourself. Let `reverse` call itself on a shorter string.' },
      ],
      require: [
        { pattern: /^[ \t]+.*(?<![\w.])reverse\s*\(/m, message: 'The results are right, but `reverse` never calls itself. This task asks for recursion.' },
      ],
      hints: [
        'The rest of the string is `text[1:]`, and the first character is `text[0]`.',
        'The last line becomes `return reverse(text[1:]) + text[0]`.',
      ],
      explain: '`reverse("stop")` is `reverse("top") + "s"`, which is `reverse("op") + "t" + "s"`, and so on until the string is empty. Each call peels one character off the front and sticks it on the back of whatever the smaller call returns.',
    },
    {
      id: 'teach-nested-lists',
      type: 'info',
      title: 'Boxes inside boxes',
      text: [
        'A list can hold numbers and smaller lists, which hold numbers and still smaller lists. You cannot know in advance how deep it goes, so no fixed number of nested loops will do. Recursion copes with **any** depth.',
        '`isinstance(item, list)` asks: is this item itself a list? The answer is `True` or `False`.',
        ':::example\n`count` counts the numbers in a nested list. A plain number adds 1. An item that is a list is a smaller version of the same problem, so the function hands it to **itself** and adds what comes back. A list with no lists inside it makes no further call: that is the base case.\n:::',
      ].join('\n\n'),
      figure: example(counting, 'A recursive function in an editor that counts the numbers in a nested list, calling itself for every item that is a list. Its output: True False, then 5.'),
    },
    {
      id: 'nested',
      type: 'fill',
      title: 'Add them all up',
      text: [
        'The same idea with a different job: this function should **add up** the numbers in a nested list, however deep it goes.',
        '`isinstance(item, list)` asks: is this item itself a list? Fill the gaps so that `total([1, [2, 3], [4, [5]]])` gives 15.',
      ].join('\n\n'),
      template: [
        '```python',
        'def total(items):',
        '    result = 0',
        '    for item in items:',
        '        if isinstance(item, list):',
        '            result = result + [[sum(item)|*total(item)|len(item)]]',
        '        else:',
        '            result = result + [[total(item)|1|*item]]',
        '    return result',
        '```',
      ].join('\n'),
      hints: ['A plain number is simply added.', 'A list inside the list is a smaller version of the same problem. Which function works out the total of a list of this kind?'],
      explain: 'When an item is itself a list, the function hands it to… itself, and adds whatever comes back. `sum(item)` would do for one level, but it fails on `[4, [5]]`, which has another list inside. The recursive call handles any depth, because every inner list is a smaller version of the same problem.',
    },
    {
      id: 'code-flatten',
      type: 'code',
      stretch: true,
      title: 'Flatten it',
      text: [
        'Write `flatten(items)`: it returns a new, flat list with all the values of a nested list, in their original order. `flatten([1, [2, [3, 4]], 5])` gives `[1, 2, 3, 4, 5]`.',
        'Two lists can be joined with `+`. So when an item is a list, add **its** flattened version to your result.',
      ].join('\n\n'),
      starter: py`
        def flatten(items):
            result = []
            for item in items:
                result.append(item)
            return result

        print(flatten([1, [2, [3, 4]], 5]))
      `,
      solution: py`
        def flatten(items):
            result = []
            for item in items:
                if isinstance(item, list):
                    result = result + flatten(item)
                else:
                    result.append(item)
            return result

        print(flatten([1, [2, [3, 4]], 5]))
      `,
      rows: 11,
      tests: [
        { call: 'flatten([1, [2, [3, 4]], 5])', expect: [1, 2, 3, 4, 5] },
        { call: 'flatten([[1, 2], [3]])', expect: [1, 2, 3] },
        { call: 'flatten([])', expect: [] },
      ],
      hidden: [
        { call: 'flatten([[[["deep"]]]])', expect: ['deep'] },
        { call: 'flatten([1, [], [2, [[], 3]]])', expect: [1, 2, 3] },
        { call: 'flatten(["a", ["b", ["c"]], "d"])', expect: ['a', 'b', 'c', 'd'] },
      ],
      hints: [
        'Inside the loop there are two cases. Test with `if isinstance(item, list):`.',
        'A list: `result = result + flatten(item)`. Anything else: `result.append(item)`.',
      ],
      explain: 'A plain value is appended. A list is flattened first, by the same function, and its values are added to the result. The base case is hiding in the loop: a list with no lists inside it makes no further calls.',
    },
    {
      id: 'fib-cost',
      type: 'interact',
      title: 'Short code, long wait',
      text: [
        'In the Fibonacci numbers 0, 1, 1, 2, 3, 5, 8… each number is the sum of the two before it. This function follows that rule word for word. The `calls` lines count how often it is called. (They use `global`, which is acceptable for a measuring device like this one.)',
        'Press **Run**. Then change the 10 on the last line to **20** and run again. How much more work is that?',
      ].join('\n\n'),
      widget: runner(fib(10)),
      check: (s) => {
        if (!s.runs) return 'Press Run first.';
        if (s.error === 'TimeoutError') return 'Too far: that takes so many calls that the program was stopped before it finished. Come back down to `fib(20)`.';
        if (s.error) return 'The program stopped with an error. Read the message, fix the line and run it again.';
        if (new RegExp(`\\b${calls20}\\b`).test(s.stdout)) return true;
        if (new RegExp(`\\b${calls10}\\b`).test(s.stdout)) return `That is \`fib(10)\`: ${calls10} calls. Now change the 10 on the last line to 20, and run it again.`;
        return 'Set the number on the last line to 20 and run the program.';
      },
      solution: { code: fib(20) },
      explain: [
        `\`fib(10)\` takes ${calls10} calls, but \`fib(20)\` takes **${thousands(calls20)}**: ten steps further, and more than a hundred times the work. Every call that has not reached the base case makes two more, and the same small questions are answered again and again. Try 25, and Learntopia gives up.`,
        'Recursion made this code short. It did not make it fast. Getting the same answers without the repeated work, by remembering them, is a strategy you will meet in the algorithms courses.',
      ].join('\n\n'),
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true** of a recursive function?',
      options: [
        { text: 'It needs a base case: an input that it answers without calling itself', correct: true },
        { text: 'Every call has its own set of local variables', correct: true },
        { text: 'Each recursive call should get an input that is closer to the base case', correct: true },
        { text: 'A call can finish before the call it made has finished', why: 'A call waits on the line where it made the inner call. The inner call always finishes first.' },
        { text: 'Without a base case, the function simply returns `None` after a while', why: 'The calls pile up until Python stops the program with a RecursionError.' },
      ],
      explain: 'A base case to stop at, a recursive case that moves towards it, and a fresh set of variables for every call. The calls go down to the base case, and the answers come back up in reverse order.',
    },
  ],
  recap: [
    'A **recursive** function calls itself on a smaller input.',
    'It needs a **base case** that answers without a further call. Without one, the calls pile up until a RecursionError stops them.',
    'Every call has its own variables and waits for the call it made. The answers come back in reverse order.',
    'Recursion suits data that contains smaller copies of itself, such as lists inside lists. It can be slow when it repeats the same work.',
  ],
  next: 'Next: put everything together. Test your functions on awkward cases, and build a complete program one piece at a time.',
};
