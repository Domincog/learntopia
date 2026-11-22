// Thinking in Code · Lesson 4 · Your Own Commands
import { py, out, listing, tracer, reachedEnd } from '../helpers.js';

const doubler = py`
  def double(n):
      return n * 2

  x = double(4)
  print(x)
`;

const birthday = py`
  def birthday(age):
      age = age + 1
      return age

  age = 10
  birthday(age)
  print(age)
`;

// Worked examples for the teaching screens. Each uses other names and numbers than the questions after it.
const leftExample = py`
  def left(money, price):
      return money - price

  print(left(10, 4))
  print(left(20, 5) + left(3, 1))
`;

const showExample = py`
  def show_double(n):
      print(n * 2)

  x = show_double(4)
  print(x)
`;

const discountExample = py`
  def discount(price):
      price = price - 5
      return price

  price = 40
  sale = discount(price)
  print(price, sale)
`;

const rideExample = py`
  def ride(height):
      if height < 120:
          return "Too small"
      return "Welcome aboard"

  print(ride(110))
  print(ride(135))
`;

export default {
  id: 'functions',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Teaching Python a new word',
      text: 'The first two lines create a command called `greet`. **In what order do the words appear when the program runs?**',
      figure: listing(py`
        def greet():
            print("Hello!")

        print("Start")
        greet()
        greet()
      `),
      options: [
        { text: 'Start, Hello!, Hello!', correct: true },
        { text: 'Hello!, Start, Hello!, Hello!' },
        { text: 'Hello!, Start' },
        { text: 'Start, Hello!' },
      ],
      columns: 1,
      explain: [
        '`def` only **teaches** Python the new command. It does not run it.',
        'The indented body runs each time the command is **called** — that is what `greet()` does. So `Hello!` appears twice, both times after `Start`.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Define once, call as often as you like',
      text: [
        '```python\ndef double(n):\n    return n * 2\n```',
        '- `def` gives the function a name and lists what it needs: its **parameters** (here `n`).\n- The indented **body** runs each time the function is **called**.\n- `return` hands a value back to the line that made the call.',
        'A call such as `double(4)` behaves like a value. Python runs the body with `n = 4`, and then the whole call is replaced by what comes back: `8`.',
      ].join('\n\n'),
    },
    {
      id: 'be-computer',
      type: 'interact',
      graded: false,
      title: 'Be the computer',
      text: [
        'Here is `double` inside a whole program. Tap the line that runs next, all the way to the end.',
        'Watch for two jumps: **into** the function when it is called, and back **out** when it returns.',
      ].join('\n\n'),
      widget: tracer(doubler, { ask: 'next' }),
      check: reachedEnd('Keep going: tap the next line until the program ends.'),
      solution: { done: true },
      explain: [
        'Line 1 only stores the function. The call on line 4 jumps into the body with `n` set to 4; `return` hands 8 back to line 4, which gives it the name `x`.',
        'A function is a detour: Python leaves a line, does the work, and comes back to the same line with an answer.',
      ].join('\n\n'),
    },
    {
      id: 'code-square',
      type: 'code',
      title: 'Your turn: write a function',
      text: [
        'Change the function so that `square(n)` **returns** `n` times `n`.',
        'The checker calls your function with several numbers. The last line is only there so that **Run** shows you something.',
      ].join('\n\n'),
      starter: py`
        def square(n):
            return 0

        print(square(3))
      `,
      solution: py`
        def square(n):
            return n * n

        print(square(3))
      `,
      tests: [
        { call: 'square(3)', expect: 9 },
        { call: 'square(10)', expect: 100 },
        { call: 'square(-4)', expect: 16 },
      ],
      hints: ['The function gets its number through the parameter `n`.', '`return n * n`'],
      explain: 'The parameter `n` stands for whatever number the caller passes in. `return n * n` hands the product back, so `square(3)` becomes 9.',
    },
    {
      id: 'example-two-params',
      type: 'info',
      title: 'More than one parameter',
      text: [
        'A function can ask for several values. The values in the brackets of a call are its **arguments**. They are handed to the parameters **in order**: the first argument to the first parameter, the second to the second.',
        ':::example\n- **Line 4:** `left(10, 4)` runs the body with `money = 10` and `price = 4`, and returns 6.\n- **Line 5:** each call is replaced by its result. Python adds 15 + 2 and prints `17`.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: leftExample, alt: 'A five-line program in an editor: a function with two parameters, called three times. Its output: 6, then 17.' },
    },
    {
      id: 'params',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [a, b, c, d] = [rng.int(2, 6), rng.int(2, 6), rng.int(2, 5), rng.int(3, 7)];
        const code = py`
          def area(w, h):
              return w * h

          print(area(${a}, ${b}) + area(${c}, ${d}))
        `;
        const answer = Number(out(code));
        return {
          text: 'One function, called twice with different values. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: [
            [a * b, 'That is only the first call. The second call returns a value too, and line 4 adds them.'],
            [c * d, 'That is only the second call. Line 4 adds the results of both.'],
            [(a + c) * (b + d), 'Each call is worked out on its own, with its own `w` and `h`. Then the two results are added.'],
          ],
          hints: [`\`area(${a}, ${b})\` runs the body with \`w = ${a}\` and \`h = ${b}\`.`, `The two calls return ${a * b} and ${c * d}.`],
          explain: `\`area(${a}, ${b})\` returns ${a * b} and \`area(${c}, ${d})\` returns ${c * d}. Each call is replaced by its result, so line 4 prints ${a * b} + ${c * d} = **${answer}**.`,
        };
      },
    },
    {
      id: 'teach-print-vs-return',
      type: 'info',
      title: 'print shows, return hands back',
      text: [
        '- `print(...)` **shows** a value on the screen, for a person to read. The function then carries on.\n- `return ...` **hands a value back** to the line that made the call, and ends the function at once.\n- A function that ends without a `return` hands back `None`, Python\'s word for "no value".',
        ':::example\n`show_double(4)` prints `8`, but it hands nothing back. So line 4 gives `x` the value `None`, and line 5 prints `None`.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: showExample, alt: 'A five-line program in an editor: a function that prints instead of returning. Its output: 8, then None.' },
    },
    {
      id: 'return-vs-print',
      type: 'choice',
      review: true,
      title: 'Showing is not the same as giving back',
      text: 'Look closely at what this function does with its answer. **What does the program print?**',
      figure: listing(py`
        def add(a, b):
            print(a + b)

        result = add(2, 3)
        print(result)
      `),
      options: [
        { text: '`5`, then `None`', correct: true },
        { text: '`5`, then `5`', why: '`add` *shows* 5 on the screen, but it hands nothing back. So `result` does not get the 5.' },
        { text: 'Just `5`', why: 'There are two prints: one inside the function, and `print(result)` on the last line.' },
        { text: 'An error', why: 'No error. A function without `return` quietly hands back a special value called `None`.' },
      ],
      explain: '`add` shows 5 with `print`, but it has no `return`. So it hands back `None`, Python\'s word for "no value". That is what `result` holds, and what the last line prints.',
    },
    {
      id: 'sort-print-return',
      type: 'bucket',
      text: '`print` or `return`? Sort each description.',
      buckets: ['print', 'return'],
      items: [
        { text: 'Shows a value on the screen', bucket: 0 },
        { text: 'Hands a value back to the line that made the call', bucket: 1 },
        { text: 'Ends the function straight away', bucket: 1, why: 'Nothing after a `return` runs. A function carries on after a `print`.' },
        { text: 'Makes `x = double(4)` give `x` the value 8', bucket: 1, why: 'The call is replaced by whatever the function returns.' },
        { text: 'Leaves the caller with `None`', bucket: 0, why: 'A function that only prints hands nothing back.' },
        { text: 'Is for the person reading the screen', bucket: 0 },
      ],
      explain: 'Use `return` when the rest of the program needs the answer. Use `print` when a person needs to see something.',
    },
    {
      id: 'teach-locals',
      type: 'info',
      title: 'What is made in a function stays there',
      text: [
        'A function\'s parameters, and any variables made in its body, are **local**: they belong to that one call and vanish when it returns. A local name may even match a name outside. They are still two separate variables.',
        ':::example\nStep through it. The tracer lists the function\'s own `price` apart from the outer one. Inside, `price` drops to 35. Outside, it stays 40. The 35 survives only because line 6 stores what came back, under the name `sale`. The program prints `40 35`.\n:::',
      ].join('\n\n'),
      figure: tracer(discountExample, { alt: 'A seven-line program in a tracer. While the function discount runs, its own variable price is listed separately from the outer price, which stays 40.' }),
    },
    {
      id: 'locals',
      type: 'choice',
      review: true,
      title: 'What happens in the function…',
      text: 'There are two things called `age` in this program. **What does the last line print?**',
      figure: listing(birthday),
      options: [
        { text: '`10`', correct: true },
        { text: '`11`', why: 'The `age` inside the function is a separate name. And the 11 it returned was never stored anywhere.' },
        { text: '`None`', why: '`age` on the last line is the one from line 5. It still stands for 10.' },
        { text: 'An error', why: 'No error: the program runs fine. It just does not do what its author hoped.' },
      ],
      explain: [
        'Inside the function, `age` is a **local variable**: it belongs to that one call, and disappears when the call ends.',
        'The function did return 11, but line 6 threw the value away. To keep it: `age = birthday(age)`.',
      ].join('\n\n'),
    },
    {
      id: 'watch-locals',
      type: 'interact',
      graded: false,
      text: 'Step through the same program. While the function is running, the tracer lists **its** variables separately from the main program\'s. Watch the two `age`s.',
      widget: tracer(birthday),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: 'Each call gets its own fresh set of local variables, and they vanish when the function returns. That is a feature: a function cannot change your other variables by accident.',
    },
    {
      id: 'example-early-return',
      type: 'info',
      title: 'return can end a function early',
      text: [
        'A function body can hold anything you already know, an `if` for instance. Remember that `return` ends the function **at once**: no later line of the body runs.',
        ':::example\n- `ride(110)`: `110 < 120` is `True`, so line 3 returns `"Too small"` and the call is over. Line 4 never runs.\n- `ride(135)`: the answer is `False`, so line 3 is skipped and Python reaches line 4.\n\nNo `else` is needed: line 4 is only reached when line 3 did not return.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: rideExample, alt: 'A seven-line program in an editor: a function with an if that returns early, called twice. Its output: Too small, then Welcome aboard.' },
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Arrange the lines into a function that returns the larger of two numbers, followed by a call that prints `8`.',
      items: [
        'def biggest(a, b):',
        '    if a > b:',
        '        return a',
        '    return b',
        'print(biggest(3, 8))',
      ],
      hints: ['The `def` line comes first; the call can only come after the whole function.', 'The more a line is indented, the deeper it sits: `return a` belongs to the `if`.'],
      explain: '`return` ends the function at once. If `a > b`, the function is over at line 3. Otherwise Python skips that line and reaches `return b`.',
    },
    {
      id: 'code-return',
      type: 'code',
      title: 'Repair the function',
      text: [
        'This program should print `22`: three items at 4 each, plus two items at 5 each.',
        'Press **Run** and read what happens. Then change **one word** to fix it.',
      ].join('\n\n'),
      starter: py`
        def cost(price, count):
            print(price * count)

        bill = cost(4, 3) + cost(5, 2)
        print(bill)
      `,
      solution: py`
        def cost(price, count):
            return price * count

        bill = cost(4, 3) + cost(5, 2)
        print(bill)
      `,
      expect: '22',
      tests: [{ call: 'cost(4, 3)', expect: 12 }],
      feedback: ({ result }) => (result.error && /NoneType/.test(result.error.message)
        ? 'Line 4 tries to add the results of two calls, but both results are `None`. What does `cost` hand back to its caller?'
        : null),
      hints: ['The function *shows* each product, but line 4 needs to *receive* it.', 'Inside the function, replace `print` with `return`. (`return` is written without brackets: `return price * count`.)'],
      explain: 'With `print`, each call showed a number and handed back `None` — and `None + None` is an error. With `return`, each call is replaced by its product: 12 + 10 = 22.',
    },
    {
      id: 'code-ticket',
      type: 'code',
      stretch: true,
      title: 'A function that decides',
      text: [
        'Write `ticket_price(age)` so that it **returns** the price of a cinema ticket:',
        '- `0` for children under 5\n- `6` for anyone under 18\n- `10` for everyone else',
        'A function may contain several `return` lines. Whichever one runs first ends the function.',
      ].join('\n\n'),
      starter: py`
        def ticket_price(age):
            return 10

        print(ticket_price(12))
      `,
      solution: py`
        def ticket_price(age):
            if age < 5:
                return 0
            if age < 18:
                return 6
            return 10

        print(ticket_price(12))
      `,
      rows: 9,
      tests: [
        { call: 'ticket_price(12)', expect: 6 },
        { call: 'ticket_price(3)', expect: 0 },
        { call: 'ticket_price(30)', expect: 10 },
      ],
      hidden: [
        { call: 'ticket_price(5)', expect: 6, message: 'Nearly. Check the ages right on the edges: a 5-year-old is not *under* 5, and an 18-year-old is not *under* 18.' },
        { call: 'ticket_price(18)', expect: 10, message: 'Nearly. Check the ages right on the edges: a 5-year-old is not *under* 5, and an 18-year-old is not *under* 18.' },
        { call: 'ticket_price(4)', expect: 0 },
      ],
      hints: ['Start with the youngest group: `if age < 5:` and, indented under it, `return 0`.', 'Then `if age < 18:` with `return 6`. Anyone who gets past both tests pays 10.'],
      explain: 'Each `return` ends the function, so later lines only run for people who did not match an earlier test. You could also write the chain with `elif` and `else`.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'A friend says: "My function prints the right answer, but when I try to use the answer I get `None`." **Explain what is going on, in your own words.**',
      model: [
        'The function *shows* the answer with `print`, but never hands it back. A function without `return` gives its caller `None`.',
        'Replace `print(...)` with `return ...` inside the function. Then the call itself stands for the answer, and the caller can store it, add to it or print it.',
      ].join('\n\n'),
    },
  ],
  recap: [
    '`def` teaches Python a new command. The body runs only when the function is **called**.',
    'Parameters are names for the values a call passes in. Variables inside a function are **local**: they exist only during that call.',
    '`return` hands a value back to the caller; `print` only shows it on the screen. A function without `return` gives back `None`.',
  ],
  next: 'Next: one name for a whole collection of values.',
};
