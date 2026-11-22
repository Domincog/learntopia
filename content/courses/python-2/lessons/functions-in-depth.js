// Python II: Building Programs · Lesson 4 · Functions That Work Together
import { py, out, errorOf, listing, tracer, reachedEnd, lit } from '../helpers.js';

const hook = py`
  rate = 2

  def cost(hours):
      return hours * rate

  print(cost(3))
  rate = 5
  print(cost(3))
`;
const hookOut = out(hook).split('\n');

const painting = py`
  def area(w, h):
      return w * h

  def paint_cost(w, h, price):
      return area(w, h) * price

  print(paint_cost(3, 4, 2))
`;

const framing = py`
  def frame(text, edge="*", width=2):
      return edge * width + text + edge * width

  print(frame("hi", width=1))
`;

const bill = py`
  def split_bill(total, people):
      each = total // people
      left = total % people
      return each, left

  share, spare = split_bill(47, 4)
  print(share, spare)
`;
const [billShare, billSpare] = out(bill).split(' ');

const reaching = py`
  total = 0

  def add(n):
      total = total + n

  add(5)
  print(total)
`;
const reachError = errorOf(reaching);

const lump = py`
  prices = [4, 6, 10]
  total = 0
  for p in prices:
      total = total + p
  if total > 15:
      total = total - 2
  print("To pay:", total)
`;

// Worked examples for the teaching screens: each runs in the editor, with its output showing.
const banner = py`
  def banner(word, mark="!", times=1):
      return word + mark * times

  print(banner("Hi"))
  print(banner("Hi", "?"))
  print(banner("Hi", times=3))
`;

const bonus = py`
  score = 10

  def reset():
      score = 0

  def add_bonus(score):
      return score + 5

  reset()
  print(score)
  score = add_bonus(score)
  print(score)
`;

const warmLump = py`
  temps = [18, 25, 21]
  warm = 0
  for t in temps:
      if t > 20:
          warm = warm + 1
  print("Warm days:", warm)
`;

const warmSplit = py`
  def count_warm(temps):
      warm = 0
      for t in temps:
          if t > 20:
              warm = warm + 1
      return warm

  temps = [18, 25, 21]
  print("Warm days:", count_warm(temps))
`;

/** A program in the editor that has already been run: the code and what it prints. */
const example = (code, alt) => ({ type: 'py-run', autorun: true, code, alt });

/** Anticipated wrong answers: drop any that equal the answer or share a value with another entry. */
const slips = (answer, entries) => entries.filter(([v], i, all) => v !== answer && all.filter(([u]) => u === v).length === 1);

export default {
  id: 'functions-in-depth',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Same call, same answer?',
      text: 'This program calls `cost(3)` twice. **What do you think it prints?**',
      figure: listing(hook),
      options: [
        { text: '`6`, then `15`', correct: true },
        { text: '`6`, then `6`' },
        { text: '`15`, then `15`' },
        { text: 'An error, because `rate` is not a parameter' },
      ],
      columns: 1,
      explain: [
        `\`${hookOut[0]}\`, then \`${hookOut[1]}\`. The function reads \`rate\` from the main program, and line 7 changed it between the two calls.`,
        'That makes `cost(3)` hard to trust: its answer depends on something the call does not show. This lesson is about writing functions you **can** trust, and about fitting them together.',
      ].join('\n\n'),
    },
    {
      id: 'be-computer',
      type: 'interact',
      graded: false,
      title: 'Be the computer',
      text: [
        'In this program every function gets what it needs through its parameters. One of them **calls the other**.',
        'Tap each line as it runs. How deep does the detour go?',
      ].join('\n\n'),
      widget: tracer(painting, { ask: 'next' }),
      check: reachedEnd('Keep going: tap the next line until the program ends.'),
      solution: { done: true },
      explain: [
        `Line 7 calls \`paint_cost\`, and line 5 has to call \`area\` before it can finish: a detour inside a detour. \`area\` hands 12 back to line 5, which multiplies it by 2 and hands ${out(painting)} back to line 7.`,
        'Small functions that call each other: that is how large programs are built.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'In through the parameters, out through return',
      text: [
        'A function you can trust has three habits.',
        '1. **One job.** `area` works out an area. It does not also print it, or ask what paint costs.\n2. **Everything it needs comes in as a parameter.** It does not reach for variables of the main program.\n3. **Its result goes out through `return`.** It does not change variables that live elsewhere.',
        ':::key\nA function with these habits is called **pure**: the same arguments always give the same answer. You can test it once, and then use it without thinking about its insides.\n:::',
      ].join('\n\n'),
    },
    {
      id: 'sort-pure',
      type: 'bucket',
      review: true,
      text: 'A **pure** function uses nothing but its parameters, and its only effect is the value it returns: the same arguments always give the same answer. **Sort these functions.**',
      buckets: ['Pure', 'Not pure'],
      items: [
        { text: 'Takes two numbers and returns the larger one', bucket: 0 },
        { text: 'Returns its parameter times a `rate` that it reads from the main program', bucket: 1, why: 'Change `rate`, and the same call gives a different answer.' },
        { text: 'Takes a list and returns the sum of its items', bucket: 0 },
        { text: 'Adds 1 to a counter that lives in the main program', bucket: 1, why: 'It changes something outside itself, so calling it twice is not the same as calling it once.' },
        { text: 'Takes a word and returns it backwards', bucket: 0 },
        { text: 'Takes a list and appends an item to that very list', bucket: 1, why: 'The caller\'s list is changed behind its back. A pure version would build and return a new list.' },
      ],
      explain: 'A pure function is a closed box: values go in through the parameters, one value comes out through `return`, and nothing else is touched. Reading or changing anything outside the box makes a function harder to test and to trust.',
    },
    {
      id: 'teach-defaults',
      type: 'info',
      title: 'Arguments you can leave out',
      text: [
        'A parameter can be given a **default value** in the `def` line. A call may then leave that argument out.',
        ':::example\n- `banner("Hi")` passes no mark and no number, so both defaults are used.\n- `banner("Hi", "?")` brings its own mark. A value that is passed in beats the default.\n- `banner("Hi", times=3)` passes an argument **by name**. It skips `mark`, which keeps its default, and sets `times`. This is called a **keyword argument**.\n:::',
        '`mark * times` repeats a string: `"!" * 3` is `"!!!"`.',
      ].join('\n\n'),
      figure: example(banner, 'A function in an editor with two parameters that have default values, called three times: with one argument, with two, and with one argument passed by name. Its output: Hi!, then Hi?, then Hi!!!.'),
    },
    {
      id: 'defaults',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const fallback = rng.pick([1, 2]);
        const given = rng.pick([3, 5, 6]);
        const p = rng.int(8, 20);
        const q = rng.int(8, 20);
        const code = py`
          def ticket(price, discount=${fallback}):
              return price - discount

          print(ticket(${p}) + ticket(${q}, ${given}))
        `;
        const answer = Number(out(code));
        return {
          text: [
            'A parameter can be given a **default value** in the `def` line. The default is used whenever a call leaves that argument out.',
            '**What does this program print?**',
          ].join('\n\n'),
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [(p - given) + (q - given), `The first call passes no discount, so it gets the default, ${fallback}. The ${given} belongs to the second call only.`],
            [(p - fallback) + (q - fallback), `The second call passes ${given} as its discount. A value that is passed in beats the default.`],
            [p + (q - given), `A call that leaves the discount out still gets one: the default, ${fallback}.`],
          ]),
          hints: [`\`ticket(${p})\` gives no second argument, so \`discount\` is ${fallback} in that call.`, `The two calls return ${p - fallback} and ${q - given}.`],
          explain: `\`ticket(${p})\` uses the default: ${p} − ${fallback} = ${p - fallback}. \`ticket(${q}, ${given})\` brings its own discount: ${q} − ${given} = ${q - given}. Together: **${answer}**.`,
        };
      },
    },
    {
      id: 'keywords',
      type: 'choice',
      title: 'Arguments by name',
      text: 'A call can also pass an argument **by name**. That lets it skip a default it is happy with. **What does this program print?**',
      figure: listing(framing),
      options: [
        { text: '`*hi*`', correct: true },
        { text: '`**hi**`', why: '`width=1` replaces the default width of 2, so there is one star on each side.' },
        { text: '`1hi1`', why: '`width=1` names the parameter `width`. The parameter `edge` keeps its default, `"*"`.' },
        { text: 'An error', why: 'Naming a parameter in a call is allowed. It is called a keyword argument.' },
      ],
      explain: [
        `It prints \`${out(framing)}\`. \`width=1\` is a **keyword argument**: it sets \`width\` and leaves \`edge\` at its default.`,
        'Keyword arguments also make a call easier to read: `frame("hi", width=1)` says what the 1 is for.',
      ].join('\n\n'),
    },
    {
      id: 'watch-tuple',
      type: 'interact',
      graded: false,
      title: 'Two answers from one call',
      text: [
        'Four friends split a bill of 47. Each pays the same whole amount, and a little is left over. So the function has **two** things to report. (Remember: `//` divides and drops the remainder, and `%` gives the remainder.)',
        'Step through. Watch what line 4 hands back, and what line 6 does with it.',
      ].join('\n\n'),
      widget: tracer(bill),
      check: reachedEnd(),
      solution: { done: true },
      explain: [
        `Line 4 hands back \`(${billShare}, ${billSpare})\`: two values packed into one. Such a package is called a **tuple**. It behaves like a list that cannot be changed.`,
        `Line 6 **unpacks** it into two names in one go: \`share\` becomes ${billShare} and \`spare\` becomes ${billSpare}.`,
      ].join('\n\n'),
    },
    {
      id: 'two-values',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const nums = rng.sample([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 4);
        const code = py`
          def low_high(nums):
              return min(nums), max(nums)

          low, high = low_high(${lit(nums)})
          print(high - low)
        `;
        const answer = Number(out(code));
        const lo = Math.min(...nums);
        const hi = Math.max(...nums);
        return {
          text: 'This function returns two values at once, and line 4 unpacks them into two names. `min` gives the smallest number of a list and `max` the largest. **What does the program print?**',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [hi, 'That is `high` on its own. The last line prints `high - low`.'],
            [lo, 'That is `low` on its own. The last line prints `high - low`.'],
            [nums[3] - nums[0], 'The function hands back the smallest and the largest number, wherever they stand in the list. They need not be the first and the last.'],
          ]),
          hints: ['Which is the smallest number in the list, and which is the largest? They need not stand first and last.',`The function returns the pair (${lo}, ${hi}). The first value goes to \`low\`, the second to \`high\`.`],
          explain: `The function returns the pair (${lo}, ${hi}). Unpacking gives \`low\` = ${lo} and \`high\` = ${hi}, so the program prints ${hi} − ${lo} = **${answer}**.`,
        };
      },
    },
    {
      id: 'teach-local',
      type: 'info',
      title: 'What a function cannot do',
      text: [
        'The opening program showed that a function can **read** a variable of the main program. It cannot quietly **change** one. As soon as a function assigns to a name, Python makes that name **local** in the whole function: a new variable, with the outer one out of reach.',
        ':::example\n`reset` makes a local `score` and throws it away, so line 10 still prints 10. `add_bonus` does it the clean way: the old value goes **in** as a parameter, the new one comes **out** through `return`, and line 11 keeps it.\n:::',
      ].join('\n\n'),
      figure: example(bonus, 'A twelve-line program in an editor. One function assigns to score and changes nothing outside; another takes the score as a parameter and returns it with 5 added. Its output: 10, then 15.'),
    },
    {
      id: 'local-trap',
      type: 'choice',
      review: true,
      title: 'Reaching out of a function',
      text: 'This function tries to update a variable of the main program. **What happens when the program runs?**',
      figure: listing(reaching),
      options: [
        { text: `It stops with an error on line ${reachError.line}`, correct: true },
        { text: 'It prints `5`', why: 'A function cannot quietly change a variable of the main program. Assigning to `total` inside `add` makes a new, local `total`.' },
        { text: 'It prints `0`', why: 'You are right that the outer `total` stays 0. But line 4 never finishes: it needs the **local** `total` before that has a value.' },
        { text: 'It prints `None`', why: 'The last line prints the variable `total`, not the result of a call. And the program stops before it gets there.' },
      ],
      columns: 1,
      explain: [
        `Assigning to a name inside a function makes that name **local**. So line ${reachError.line} asks for the local \`total\` before it exists, and Python stops with an \`${reachError.type}\`.`,
        'Python has a keyword, `global`, that forces a function to reach outwards. Avoid it. The clean way is to pass the old total **in** and `return` the new one.',
      ].join('\n\n'),
    },
    {
      id: 'code-pure',
      type: 'code',
      title: 'Repair it the clean way',
      text: [
        'This program has the same problem: `add_item` reaches for `total`. Repair it without `global`. Change `add_item` so that it takes the running total as its **first parameter** and **returns** the new total.',
        'Then change the call inside the loop: pass the total in, and keep what comes back. With these prices the program should print `10`.',
      ].join('\n\n'),
      starter: py`
        def add_item(price):
            total = total + price

        prices = [4, 6]
        total = 0
        for p in prices:
            add_item(p)
        print(total)
      `,
      solution: py`
        def add_item(total, price):
            return total + price

        prices = [4, 6]
        total = 0
        for p in prices:
            total = add_item(total, p)
        print(total)
      `,
      rows: 9,
      tests: [
        { stdout: '10', set: { prices: [4, 6] } },
        { call: 'add_item(10, 5)', expect: 15 },
      ],
      hidden: [
        { stdout: '6', set: { prices: [1, 2, 3] } },
        { stdout: '0', set: { prices: [] } },
        { call: 'add_item(-3, 3)', expect: 0 },
        { call: 'add_item(2.5, 1)', expect: 3.5 },
      ],
      forbid: [{ pattern: 'global', message: 'That works, but this task asks for the clean way: no `global`. Pass the total in as a parameter and `return` the new one.' }],
      require: [{ pattern: /^(?!def\b).*\badd_item\s*\(/m, message: 'The function is right, but the main program does not use it. Inside the loop, call `add_item` and keep its result.' }],
      wrong: [
        ['0', 'It prints 0, so the total never grows. Does `add_item` **return** the new total, and does the loop keep it? The call should look like `total = add_item(total, p)`.'],
      ],
      hints: [
        'The `def` line needs two parameters: `def add_item(total, price):`. The body is one line: `return total + price`.',
        'The call in the loop becomes `total = add_item(total, p)`. The old total goes in, and the new one is kept.',
      ],
      explain: 'Now `add_item` is pure: the total goes in as a parameter and the new total comes out through `return`. The main program decides what to do with the result, here by giving it the name `total` again.',
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Arrange the lines: a function that returns both the total and the mean of a list, followed by a main program that prints `15 5.0`.',
      items: [
        'def stats(nums):',
        '    total = sum(nums)',
        '    mean = total / len(nums)',
        '    return total, mean',
        'total, mean = stats([2, 4, 9])',
        'print(total, mean)',
      ],
      hints: ['Inside the function, `mean` is worked out from `total`, so `total` must come first.', 'The call can only come after the whole function. It unpacks the two values that come back.'],
      explain: 'The function packs two results into one `return`, and the caller unpacks them into two names. The names `total` and `mean` inside the function are local: the main program has variables of its own with the same names.',
    },
    {
      id: 'example-refactor',
      type: 'info',
      title: 'Same output, better shape',
      text: [
        'To **refactor** a program is to change its structure without changing what it prints. This program works, but it is one lump:',
        `\`\`\`python\n${warmLump}\n\`\`\``,
        `:::example\nIn the editor, the counting has moved into a function with one job. The list comes **in** as a parameter and the count goes **out** through \`return\`. The main program shrinks to its data, one call and the \`print\`. Both versions print \`${out(warmLump)}\`.\n:::`,
      ].join('\n\n'),
      figure: example(warmSplit, 'A program in an editor: a function that counts the temperatures above 20 and returns the count, and a two-line main program that calls it. Its output: Warm days: 2.'),
    },
    {
      id: 'code-refactor',
      type: 'code',
      title: 'Split the lump',
      text: [
        'This program works, but it is one lump. **Refactor** it: change its structure without changing what it prints.',
        '- Move the adding into `subtotal(prices)`, which returns the sum.\n- Move the discount rule into `discounted(amount)`. It returns `amount - 2` if the amount is over 15, and the amount unchanged otherwise.\n- The main program keeps the `prices` line, calls the two functions and prints.',
      ].join('\n\n'),
      starter: lump,
      solution: py`
        def subtotal(prices):
            total = 0
            for p in prices:
                total = total + p
            return total

        def discounted(amount):
            if amount > 15:
                return amount - 2
            return amount

        prices = [4, 6, 10]
        print("To pay:", discounted(subtotal(prices)))
      `,
      rows: 13,
      tests: [
        { stdout: 'To pay: 18', set: { prices: [4, 6, 10] } },
        { call: 'subtotal([1, 2, 3])', expect: 6 },
        { call: 'discounted(20)', expect: 18 },
      ],
      hidden: [
        { call: 'discounted(15)', expect: 15, message: 'Check the edge of the rule: an amount of exactly 15 is not **over** 15, so `discounted(15)` should give 15.' },
        { call: 'discounted(16)', expect: 14 },
        { call: 'subtotal([])', expect: 0 },
        { stdout: 'To pay: 10', set: { prices: [5, 5] } },
        { stdout: 'To pay: 19', set: { prices: [20, 1] } },
      ],
      forbid: [
        { pattern: /^(for|while)\b/m, message: 'Everything works, but the adding loop is still in the main program. Leave it inside `subtotal`, and let the main program call the function.' },
        { pattern: /^if\b/m, message: 'Everything works, but the discount rule is still in the main program. Leave it inside `discounted`, and let the main program call the function.' },
      ],
      hints: [
        'Start with `def subtotal(prices):` and move the three adding lines into it, indented. End it with `return total`.',
        '`discounted(amount)` needs an `if amount > 15:` with `return amount - 2`, and then `return amount`.',
        'The main program shrinks to two lines: the `prices` line and `print("To pay:", discounted(subtotal(prices)))`.',
      ],
      explain: 'The output is the same, but the program now has parts with names. Each part can be read, tested and reused on its own: `discounted(15)` can be checked without building a list of prices first.',
    },
    {
      id: 'code-compose',
      type: 'code',
      stretch: true,
      title: 'Build a bigger function from small ones',
      text: [
        'The two small functions are in the editor. Use them to write `to_pay(prices, tip=0)`:',
        '1. work out the subtotal,\n2. apply the discount,\n3. add the tip.',
        'The tip has a default of 0, so `to_pay([4, 6, 10])` gives 18 and `to_pay([4, 6, 10], 3)` gives 21.',
      ].join('\n\n'),
      starter: py`
        def subtotal(prices):
            return sum(prices)

        def discounted(amount):
            if amount > 15:
                return amount - 2
            return amount

        def to_pay(prices):
            return 0

        print(to_pay([4, 6, 10]))
      `,
      solution: py`
        def subtotal(prices):
            return sum(prices)

        def discounted(amount):
            if amount > 15:
                return amount - 2
            return amount

        def to_pay(prices, tip=0):
            return discounted(subtotal(prices)) + tip

        print(to_pay([4, 6, 10]))
      `,
      rows: 13,
      tests: [
        { call: 'to_pay([4, 6, 10])', expect: 18 },
        { call: 'to_pay([4, 6, 10], 3)', expect: 21 },
        { call: 'to_pay([1, 2], tip=1)', expect: 4 },
      ],
      hidden: [
        { call: 'to_pay([10, 4], 3)', expect: 17, message: 'The order of the steps matters. With prices of 10 and 4 and a tip of 3, the subtotal is 14: no discount. Then the tip makes 17. Discount first, tip last.' },
        { call: 'to_pay([8, 8], 5)', expect: 19 },
        { call: 'to_pay([20])', expect: 18 },
        { call: 'to_pay([])', expect: 0 },
      ],
      hints: [
        'The `def` line needs a second parameter with a default: `def to_pay(prices, tip=0):`.',
        'Feed the result of one function into the next: `discounted(subtotal(prices))`. Then add `tip`.',
      ],
      explain: '`to_pay` contains no loop and no `if`. It only connects functions that already work: the result of `subtotal` goes into `discounted`, and the tip is added at the end. Writing a big function is mostly choosing the right small ones.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'A friend shows you a 60-line program with no functions in it. It works, but every change she makes breaks something else. **What would you suggest, and why would it help?**',
      model: [
        'Find the separate jobs hiding in the lump and give each one a function of its own: values in through parameters, the result out through `return`.',
        'Each piece can then be read, tested and changed on its own. A change inside one function cannot break the others, as long as the function still returns the right thing.',
      ].join('\n\n'),
    },
  ],
  recap: [
    'Give a function **one job**. Let everything it needs come in as parameters, and let its result go out through `return`.',
    'A default value (`tip=0`) makes an argument optional, and a call can pass an argument by name: `to_pay(prices, tip=3)`.',
    '`return a, b` hands back two values as a **tuple**; `x, y = f()` unpacks them.',
    'Assigning to a name inside a function makes it local. Do not reach for outside variables: pass values in, and return results.',
  ],
  next: 'Next: a function can call other functions. What happens when it calls itself?',
};
