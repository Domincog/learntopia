// Thinking in Code · Lesson 2 · Forks in the Road
import { py, out, listing, tracer, reachedEnd } from '../helpers.js';

const ticket = py`
  age = 12
  if age >= 13:
      print("Teen ticket")
  else:
      print("Child ticket")
  print("Enjoy the film")
`;

// Worked examples for the teaching screens. Each uses other names and numbers than the questions after it.
const speedExample = py`
  speed = 70
  if speed > 60:
      print("Slow down")
  else:
      print("Speed is fine")
  print("Drive on")
`;

const greetingExample = py`
  hour = 9
  if hour < 12:
      print("Good morning")
  elif hour < 18:
      print("Good afternoon")
  else:
      print("Good evening")
`;

const discountExample = py`
  age = 30
  member = True
  if age < 16 or member:
      print("Discount")
  else:
      print("Full price")
`;

export default {
  id: 'decisions',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A program that chooses',
      text: 'It is 15 degrees outside. **What does this program print?**',
      figure: listing(py`
        temp = 15
        if temp > 20:
            print("T-shirt weather")
        print("Go outside")
      `),
      options: [
        { text: 'Only `Go outside`', correct: true },
        { text: 'Both lines' },
        { text: 'Only `T-shirt weather`' },
        { text: 'Nothing at all' },
      ],
      explain: [
        'Only `Go outside`. Line 2 asks a question: is `temp` greater than 20? It is not, so Python **skips the indented line**.',
        'The last line is not indented, so it does not belong to the `if`. It runs whatever the answer was.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Questions with yes-or-no answers',
      text: [
        'A **comparison** asks a question. Python works out both sides, then answers `True` or `False`.',
        [
          '| You write | It asks |',
          '|-----------|---------|',
          '| `a == b` | are they equal? |',
          '| `a != b` | are they different? |',
          '| `a < b`, `a > b` | less than? greater than? |',
          '| `a <= b`, `a >= b` | at most? at least? |',
        ].join('\n'),
        '- Strings can be compared too, and capitals count: `"cat" == "Cat"` is `False`.\n- `True` and `False` are values. A name can hold one: `raining = False`.',
        ':::warn\n`=` gives a name a value. `==` asks whether two values are equal. Swapping them is one of the most common slips in programming.\n:::',
      ].join('\n\n'),
    },
    {
      id: 'true-false',
      type: 'bucket',
      text: 'Answer these the way Python would.',
      buckets: ['True', 'False'],
      items: [
        { text: '`3 < 5`', bucket: 0 },
        { text: '`7 < 7`', bucket: 1, why: '`<` is strict: 7 is not less than itself.' },
        { text: '`10 >= 10`', bucket: 0, why: '`>=` means "at least", so equal counts.' },
        { text: '`4 != 4`', bucket: 1, why: '`!=` asks "are they different?" They are not.' },
        { text: '`2 + 2 == 4`', bucket: 0 },
        { text: '`"a" == "A"`', bucket: 1, why: 'Capital letters matter: these are two different strings.' },
      ],
      explain: '`<` and `>` are strict; `<=` and `>=` also accept equal values. And for strings, a capital letter is a different character.',
    },
    {
      id: 'be-computer',
      type: 'interact',
      graded: false,
      title: 'Be the computer',
      text: [
        'This program decides which ticket a 12-year-old gets. **You** are the computer now.',
        'Line 2 asks a question. The line under `else:` is for when the answer is no.',
        'Tap the line that runs next, again and again, until the program ends.',
      ].join('\n\n'),
      widget: tracer(ticket, { ask: 'next' }),
      check: reachedEnd('Keep going: tap the next line until the program ends.'),
      solution: { done: true },
      explain: 'Line 2 asked a question, and the answer was False. So Python jumped over line 3 and ran the `else` part instead. After that, the program carried on with line 6.',
    },
    {
      id: 'teach-if-else',
      type: 'info',
      title: 'if and else: one branch of two',
      text: [
        'An `if` line asks a question and ends with a **colon**. The **indented** lines under it run only when the answer is `True`.',
        '`else:` means *otherwise*: its indented lines run when the answer is `False`. Exactly **one** of the two branches runs. Then Python carries on with the next line that is not indented.',
        ':::example\n`70 > 60` is `True`: Python prints `Slow down`, skips the `else` branch and prints `Drive on`. Change 70 to 60 and press **Run**: 60 is not greater than 60, so the other branch runs.\n:::',
        'An `if` needs no `else`. Without one, a `False` answer simply skips the indented lines.',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: speedExample, alt: 'A six-line program with an if and an else branch in an editor, with its output: Slow down, then Drive on.' },
    },
    {
      id: 'boundary',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const limit = rng.pick([40, 50, 60, 100]);
        const off = rng.pick([5, 10, 20]);
        const price = rng.pick([limit, limit, limit - 15, limit + 25, limit + 10, limit - 5]);
        const code = py`
          price = ${price}
          if price > ${limit}:
              price = price - ${off}
          print(price)
        `;
        const answer = Number(out(code));
        const truth = price > limit;
        return {
          text: `A shop takes ${off} off any price **over** ${limit}. **What does this program print?**`,
          figure: listing(code),
          answer,
          wrong: truth
            ? [[price, `Is ${price} greater than ${limit}? Yes — so the indented line does run.`]]
            : [[price - off, price === limit
              ? `\`>\` is strict: ${limit} is not greater than ${limit}. The answer is False, so the indented line is skipped.`
              : `Is ${price} greater than ${limit}? No — so the indented line is skipped.`]],
          hints: [`Line 2 asks: is ${price} greater than ${limit}? Decide True or False first.`],
          explain: truth
            ? `\`${price} > ${limit}\` is True, so line 3 runs: ${price} − ${off} = **${answer}**.`
            : `\`${price} > ${limit}\` is False${price === limit ? ' (equal is not greater)' : ''}, so line 3 is skipped and the price stays **${answer}**.`,
        };
      },
    },
    {
      id: 'teach-elif',
      type: 'info',
      title: 'More than two branches',
      text: [
        '`elif` means "otherwise, if". It puts another question between the `if` and the `else`.',
        'Python tests the questions **from the top** and runs only the **first** branch whose answer is `True`. The rest of the chain is skipped. The `else` branch runs when no answer was `True`.',
        ':::example\n`hour` is 9, and `9 < 12` is `True`. Python prints `Good morning` and leaves the chain. It never asks `hour < 18`, although that is `True` as well. Try 14, then 20.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: greetingExample, alt: 'A seven-line program with if, elif and else in an editor, with its output: Good morning.' },
    },
    {
      id: 'elif-chain',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const score = rng.pick([95, 90, 84, 75, 70, 66, 50, 45, 30]);
        const code = py`
          score = ${score}
          if score >= 90:
              grade = "A"
          elif score >= 70:
              grade = "B"
          elif score >= 50:
              grade = "C"
          else:
              grade = "D"
          print(grade)
        `;
        const answer = out(code);
        const later = { A: 'B', B: 'C', C: null, D: null }[answer];
        const options = ['A', 'B', 'C', 'D'].map((g) => {
          const opt = { text: `\`${g}\`` };
          if (g === answer) opt.correct = true;
          else if (g === later) opt.why = `That condition is True as well. But Python never gets that far: it stops at the **first** branch that is True.`;
          else if (answer === 'D' && g === 'C') opt.why = `Is ${score} at least 50? No. None of the three conditions is True, so the \`else\` branch runs.`;
          return opt;
        });
        return {
          text: `\`elif\` means "otherwise, if". A pupil scores ${score}. **What does this program print?**`,
          figure: listing(code),
          shuffle: false,
          options,
          hints: ['Check the conditions one at a time, from the top. Stop at the first one that is True.'],
          explain: `Python tests the conditions from the top and runs **only the first branch that is True**${answer === 'D' ? ' — or the `else` branch if none is' : ''}. Here that gives \`${answer}\`. The rest of the chain is skipped.`,
        };
      },
    },
    {
      id: 'indent',
      type: 'choice',
      title: 'Indentation is structure',
      text: 'These two programs differ only in the **spaces at the start of the last line**. It is not raining. Which program prints `Wear boots`?',
      figure: [
        { ...listing(py`
          raining = False
          if raining:
              print("Take an umbrella")
              print("Wear boots")
        `), caption: 'Program A' },
        { ...listing(py`
          raining = False
          if raining:
              print("Take an umbrella")
          print("Wear boots")
        `), caption: 'Program B' },
      ],
      shuffle: false,
      options: [
        { text: 'Only A', why: 'In A, both prints are indented, so both belong to the `if` — and the `if` is skipped.' },
        { text: 'Only B', correct: true },
        { text: 'Both', why: 'In A the last line is inside the `if`, and `raining` is False.' },
        { text: 'Neither', why: 'In B the last line is not indented. It is outside the `if`, so it always runs.' },
      ],
      explain: 'Indentation is not decoration. It tells Python which lines belong to the `if`. In A, both prints are inside it and both are skipped. In B, the last line is outside, so it runs every time.',
    },
    {
      id: 'fill-vote',
      type: 'fill',
      text: 'Complete the program so that it prints `Too young` for anyone under 18, and `You can vote` for everyone else.',
      template: [
        '```python',
        'age = 16',
        'if age [[>=|*<|==]] 18:',
        '    print("Too young")',
        '[[*else|elif|if]]:',
        '    print("You can vote")',
        '```',
      ].join('\n'),
      explain: '`age < 18` is True for 16, so the first branch runs. `else` catches everything the `if` did not: here, 18 and over.',
    },
    {
      id: 'teach-and-or',
      type: 'info',
      title: 'Joining two questions',
      text: [
        'Three small words combine yes-or-no answers.',
        [
          '| You write | It is `True` when |',
          '|-----------|-------------------|',
          '| `a and b` | **both** sides are True |',
          '| `a or b` | **at least one** side is True |',
          '| `not a` | `a` is False: it flips the answer |',
        ].join('\n'),
        ':::example\n`age < 16` is `False`, but `member` is `True`. For `or`, one True side is enough, so the program prints `Discount`. Change `or` to `and` and press **Run**: now both sides have to be True.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: discountExample, alt: 'A six-line program whose if line joins two questions with or, in an editor, with its output: Discount.' },
    },
    {
      id: 'and-or',
      type: 'multi',
      review: true,
      title: 'Two questions at once',
      text: [
        '`and` is True only when **both** sides are True. `or` is True when **at least one** side is. `not` flips True and False.',
        'Suppose `x = 7`. **Which of these are True?**',
      ].join('\n\n'),
      options: [
        { text: '`x > 5 and x < 10`', correct: true },
        { text: '`x < 5 or x > 6`', correct: true },
        { text: '`x > 5 and x > 10`', why: '`x > 10` is False, and `and` needs both sides to be True.' },
        { text: '`not x == 7`', why: '`x == 7` is True, and `not` flips it to False.' },
        { text: '`x == 3 or x == 7`', correct: true },
      ],
      explain: '7 is between 5 and 10, so the first is True. For `or`, one True side is enough: `x > 6` and `x == 7` do the job.',
    },
    {
      id: 'code-pass',
      type: 'code',
      title: 'Your turn: add the other branch',
      text: [
        'A test is passed with a score of **50 or more**. Right now the program says nothing when the score is too low.',
        'Add the missing branch so that it prints `Fail` in that case. The checker changes the first line to try other scores.',
      ].join('\n\n'),
      starter: py`
        score = 62
        if score >= 50:
            print("Pass")
      `,
      solution: py`
        score = 62
        if score >= 50:
            print("Pass")
        else:
            print("Fail")
      `,
      tests: [
        { set: { score: 62 }, stdout: 'Pass' },
        { set: { score: 30 }, stdout: 'Fail' },
        { set: { score: 50 }, stdout: 'Pass' },
      ],
      hints: ['`else:` starts at the left edge, lined up with `if`, and ends with a colon.', 'Under it, indented by 4 spaces: `print("Fail")`.'],
      explain: '`else:` lines up with its `if` and catches every case the condition did not. Its body is indented, just like the body of the `if`.',
    },
    {
      id: 'code-weather',
      type: 'code',
      title: 'A chain of choices',
      text: [
        'Write a program that looks at `temp` and prints **one** word:',
        '- `Freezing` if it is below 0\n- `Cold` if it is below 15\n- `Mild` if it is below 25\n- `Hot` otherwise',
        'Keep the first line: the checker changes it to try other temperatures.',
      ].join('\n\n'),
      starter: py`
        temp = 18
      `,
      solution: py`
        temp = 18
        if temp < 0:
            print("Freezing")
        elif temp < 15:
            print("Cold")
        elif temp < 25:
            print("Mild")
        else:
            print("Hot")
      `,
      rows: 10,
      tests: [
        { set: { temp: 18 }, stdout: 'Mild' },
        { set: { temp: -5 }, stdout: 'Freezing' },
        { set: { temp: 8 }, stdout: 'Cold' },
        { set: { temp: 30 }, stdout: 'Hot' },
      ],
      hidden: [
        { set: { temp: 0 }, stdout: 'Cold', message: 'Nearly. Try the temperatures right on the edges: 0, 15 and 25. "Below 0" does not include 0 itself.' },
        { set: { temp: 15 }, stdout: 'Mild', message: 'Nearly. Try the temperatures right on the edges: 0, 15 and 25. "Below 15" does not include 15 itself.' },
        { set: { temp: 25 }, stdout: 'Hot', message: 'Nearly. Try the temperatures right on the edges: 0, 15 and 25. "Below 25" does not include 25 itself.' },
      ],
      feedback: ({ check }) => (check && check.kind === 'output' && !check.error && check.actual.includes('\n')
        ? 'Your program printed more than one word. With separate `if`s, *every* condition that is True prints something. Use `elif`, so that only the first match runs.'
        : null),
      hints: ['Start with `if temp < 0:` and print `Freezing` under it.', 'Each later test is an `elif`. By the time Python reaches `elif temp < 15:`, it already knows `temp` is not below 0.', 'Finish with `else:` for `Hot`.'],
      explain: 'Because Python stops at the first True branch, each `elif` can be simple: `elif temp < 15` is only reached when `temp` is *not* below 0.',
    },
    {
      id: 'code-ticket',
      type: 'code',
      stretch: true,
      title: 'Who pays what?',
      text: [
        'A cinema sets its prices like this:',
        '- children **under 5** get in free: print `0`\n- otherwise, anyone **under 18**, and any **student**, pays `6`\n- everyone else pays `10`',
        'Write the program. `student` is `True` or `False`. The checker tries several people.',
      ].join('\n\n'),
      starter: py`
        age = 20
        student = True
      `,
      solution: py`
        age = 20
        student = True
        if age < 5:
            print(0)
        elif age < 18 or student:
            print(6)
        else:
            print(10)
      `,
      rows: 9,
      tests: [
        { set: { age: 20, student: true }, stdout: '6' },
        { set: { age: 30, student: false }, stdout: '10' },
        { set: { age: 3, student: false }, stdout: '0' },
        { set: { age: 12, student: false }, stdout: '6' },
      ],
      hidden: [
        { set: { age: 5, student: false }, stdout: '6' },
        { set: { age: 18, student: false }, stdout: '10' },
        { set: { age: 4, student: true }, stdout: '0', message: 'Nearly. The free ticket comes first: a child under 5 pays nothing, even when `student` is True. Test `age < 5` before anything else.' },
      ],
      hints: ['Test for the free ticket first: `if age < 5:`.', 'The middle price has two ways in. Join them with `or`: `elif age < 18 or student:`.'],
      explain: 'Order does the work. Under-fives are caught first. `age < 18 or student` then needs only one side to be True. Whoever is left pays 10.',
    },
    {
      id: 'match-ops',
      type: 'match',
      review: true,
      text: 'Match each piece of Python with what it does.',
      pairs: [
        ['`x = 5`', 'Makes x stand for 5'],
        ['`x == 5`', 'Asks: is x equal to 5?'],
        ['`x != 5`', 'Asks: is x different from 5?'],
        ['`x >= 5`', 'Asks: is x at least 5?'],
      ],
      explain: 'One `=` is an instruction. Everything else here is a question with the answer `True` or `False`.',
    },
  ],
  recap: [
    'A comparison such as `age >= 13` is a question. Python answers `True` or `False`.',
    '`if` runs its indented lines only when the answer is True. `elif` and `else` handle the other cases, and **only the first matching branch** runs.',
    'Indentation is structure: it decides which lines belong to a branch.',
    '`=` gives a name a value. `==` asks whether two values are equal.',
  ],
  next: 'Next: making the computer repeat itself.',
};
