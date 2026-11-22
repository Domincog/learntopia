// Thinking in Code · Lesson 1 · Names for Values
import { py, out, listing, tracer, reachedEnd } from '../helpers.js';

const formula = py`
  x = 5
  y = x + 1
  x = 10
  print(y)
`;

// Worked examples for the teaching screens. Each uses other names and numbers than the questions after it.
const updateExample = py`
  eggs = 12
  eggs = eggs - 2
  eggs = eggs * 3
  print(eggs)
`;

const stringExample = py`
  print(4 + 4)
  print("4 + 4")
  print("sun" + "set")
`;

const payExample = py`
  hours = 6
  rate = 15
  pay = hours * rate
  print(hours, pay)
`;

const brokenSwap = py`
  a = 1
  b = 2
  a = b
  b = a
  print(a, b)
`;

// A name tag tied to a value: the picture behind "a variable is a name for a value".
const tagFigure = {
  type: 'svg', viewBox: '0 0 360 132', maxWidth: 380,
  alt: 'Two name tags. The tag x is tied to the value 10. The tag y is tied to the value 6. A value 5 sits to one side with no tag.',
  content: [
    '<g stroke-width="2.5" class="stroke-ink">',
    '<path class="fill-yellow" d="M22 20 H92 L110 38 L92 56 H22 Z" stroke-linejoin="round"/>',
    '<path class="fill-yellow" d="M22 78 H92 L110 96 L92 114 H22 Z" stroke-linejoin="round"/>',
    '<path class="fill-none" d="M112 38 H178 M168 30 L178 38 L168 46" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path class="fill-none" d="M112 96 H178 M168 88 L178 96 L168 104" stroke-linecap="round" stroke-linejoin="round"/>',
    '<rect class="fill-blue-soft" x="184" y="16" width="64" height="44" rx="10"/>',
    '<rect class="fill-blue-soft" x="184" y="74" width="64" height="44" rx="10"/>',
    '<rect class="fill-surface stroke-hair" x="282" y="16" width="56" height="44" rx="10" stroke-dasharray="5 5"/>',
    '</g>',
    '<text class="fig-label fig-mono" x="60" y="43" text-anchor="middle" style="fill:#1D1B26">x</text>',
    '<text class="fig-label fig-mono" x="60" y="101" text-anchor="middle" style="fill:#1D1B26">y</text>',
    '<text class="fig-label-lg fig-mono" x="216" y="45" text-anchor="middle">10</text>',
    '<text class="fig-label-lg fig-mono" x="216" y="103" text-anchor="middle">6</text>',
    '<text class="fig-label-lg fig-mono text-muted" x="310" y="45" text-anchor="middle">5</text>',
    '<text class="fig-label-sm text-muted" x="310" y="78" text-anchor="middle">no name</text>',
    '<text class="fig-label-sm text-muted" x="310" y="93" text-anchor="middle">any more</text>',
  ].join(''),
};

export default {
  id: 'variables',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'What does the computer remember?',
      text: 'Read this program from top to bottom, the way a computer does. The last line, `print(y)`, shows the value of `y` on the screen. **What does it print?**',
      figure: listing(formula),
      shuffle: false,
      options: [
        { text: '`6`', correct: true },
        { text: '`10`' },
        { text: '`11`' },
        { text: 'An error' },
      ],
      explain: [
        'It prints **6**. Line 2 worked out `x + 1` once, using the value `x` had *at that moment*, and gave the result the name `y`.',
        'Changing `x` on line 3 does not reach back and change `y`. Next, watch it happen.',
      ].join('\n\n'),
    },
    {
      id: 'watch',
      type: 'interact',
      graded: false,
      title: 'Watch it run',
      text: [
        'Here is the same program in a **tracer**. Each press of **Step** runs one line.',
        'Step all the way to the end. The tracer lists what every name stands for, and what `print` has shown so far. Keep an eye on `y` when line 3 runs.',
      ].join('\n\n'),
      widget: tracer(formula),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: [
        'A program runs **one line at a time, from the top**. Each `=` line gives a name to a value.',
        '`y` stayed 6 the whole time, because no line ever told Python to change it.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'A variable is a name for a value',
      text: [
        'Python reads an `=` line from the **right**:',
        '1. Work out the value on the right-hand side.\n2. Tie the name on the left to that value.',
        'From then on the name stands for that value, until another `=` line ties it to a new one. The old value is simply dropped.',
        ':::key\n`=` is an instruction: *make this name stand for this value*. It is not a claim that two things are equal.\n:::',
      ].join('\n\n'),
      figure: { ...tagFigure, caption: 'After the program above: x names 10, y names 6.' },
    },
    {
      id: 'example-update',
      type: 'info',
      title: 'A name can be updated',
      text: [
        'Python does arithmetic with `+`, `-`, `*` (times) and `/` (divided by).',
        'The right-hand side of an `=` line may use the **same name** that stands on the left. Python reads the old value, works out the result, and ties the name to the new value.',
        ':::example\nStep through the program.\n- **Line 2:** 12 − 2 is 10, so `eggs` now stands for 10.\n- **Line 3:** 10 × 3 is 30, so `eggs` now stands for 30.\n- **Line 4:** `print` shows `30`.\n:::',
      ].join('\n\n'),
      figure: tracer(updateExample, { alt: 'A four-line program in a tracer that runs it one line at a time and shows the value of eggs after each line: 12, then 10, then 30.' }),
    },
    {
      id: 'reassign',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(3, 12);
        const b = rng.int(2, 9);
        const name = rng.pick(['score', 'points', 'coins', 'steps']);
        const code = py`
          ${name} = ${a}
          ${name} = ${name} + ${b}
          ${name} = ${name} * 2
          print(${name})
        `;
        const answer = Number(out(code));
        return {
          text: `In maths, \`${name} = ${name} + ${b}\` could never be true. In Python it is a perfectly good instruction. **What does this program print?**`,
          figure: listing(code),
          answer,
          wrong: [
            [a + b, 'There is one more line: line 3 doubles the value.'],
            [a * 2, `Line 2 already changed \`${name}\` to ${a + b}. Line 3 doubles *that*.`],
            [a + b * 2, `Take one line at a time. After line 2, \`${name}\` is ${a + b}; line 3 doubles the whole value.`],
          ],
          hints: [
            `Work out the right-hand side first, using the value \`${name}\` has *right now*.`,
            `After line 2, \`${name}\` is ${a + b}.`,
          ],
          explain: `Right-hand side first: ${a} + ${b} is ${a + b}, so \`${name}\` now stands for ${a + b}. Then ${a + b} × 2 is **${answer}**. Each \`=\` line replaces the old value.`,
        };
      },
    },
    {
      id: 'table',
      type: 'fill',
      title: 'Be the computer',
      text: 'Run this program in your head, one line at a time. What does each name stand for **after line 3**?',
      template: [
        '```python',
        'a = 3',
        'b = a * 2',
        'a = a + b',
        '```',
        'After line 3, `a` is [[9]] and `b` is [[6]].',
      ].join('\n'),
      hints: ['After line 2, `a` is 3 and `b` is 6.', 'Line 3 works out `a + b` with those values, then gives the result to `a`.'],
      explain: 'Line 2: `b` becomes 3 × 2 = 6. Line 3: the right-hand side is 3 + 6 = 9, so `a` becomes 9. Line 3 only *read* `b`, so `b` is still 6.',
    },
    {
      id: 'teach-strings',
      type: 'info',
      title: 'Text goes in quotes',
      text: [
        'A piece of text in quotes is called a **string**. Without quotes, Python sees a number or a name.',
        '- Inside quotes **nothing is worked out**: `"4 + 4"` stays exactly as written.\n- Between two strings, `+` does not add. It **joins** them end to end.\n- A number may have a decimal point: `3.5` is a number too.',
        'Read the three lines and the output of each. Then change something and press **Run**.',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: stringExample, alt: 'A three-line program in an editor, with its output: 8, then 4 + 4, then sunset.' },
    },
    {
      id: 'strings',
      type: 'choice',
      title: 'Numbers and text',
      text: 'Quotes make **text**. No quotes make a **number**. The first line prints `5`. What does the **second** line print?',
      figure: listing(py`
        print(2 + 3)
        print("2" + "3")
      `),
      options: [
        { text: '`23`', correct: true },
        { text: '`5`', why: 'With quotes, `"2"` and `"3"` are pieces of text, not numbers. For text, `+` does not add.' },
        { text: '`"2" + "3"`', why: 'Python still carries out the `+`. For two pieces of text, that means joining them.' },
        { text: '`2 3`', why: 'Joining puts nothing in between — not even a space.' },
      ],
      explain: 'With quotes, `"2"` and `"3"` are strings, and `+` joins strings end to end: `23`. Same symbol, different job: it depends on the kind of value.',
    },
    {
      id: 'kinds',
      type: 'bucket',
      text: 'Which of these are numbers, and which are strings?',
      buckets: ['Number', 'String (text)'],
      items: [
        { text: '`42`', bucket: 0 },
        { text: '`"42"`', bucket: 1, why: 'The quotes make it text: the two characters 4 and 2.' },
        { text: '`3.5`', bucket: 0 },
        { text: '`"hello"`', bucket: 1 },
        { text: '`7 + 1`', bucket: 0, why: 'No quotes, so Python works it out: the number 8.' },
        { text: '`"7 + 1"`', bucket: 1, why: 'Inside quotes nothing is worked out. It is just five characters of text.' },
      ],
      explain: 'The quotes decide. `7 + 1` is the number 8. `"7 + 1"` is text, and Python leaves it exactly as written.',
    },
    {
      id: 'example-program',
      type: 'info',
      title: 'A whole program, built from names',
      text: [
        ':::example\n- **Lines 1 and 2** give two names their values.\n- **Line 3** looks both names up and multiplies: 6 × 15 is 90.\n- **Line 4** prints two values. A comma inside `print` shows them on one line, with a space between.\n:::',
        'Change the 6 to 8 and press **Run**. Line 3 still does its job, because it uses the names and not the numbers.',
        ':::warn\nA line can only use a name that an **earlier** line has given a value. Otherwise Python stops with a `NameError`.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: payExample, alt: 'A four-line program in an editor, with its output: 6 90.' },
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Put the lines in order so that the program prints `24`.',
      items: [
        'width = 4',
        'height = width + 2',
        'area = width * height',
        'print(area)',
      ],
      hints: ['A line can only use a name that an *earlier* line has given a value.'],
      explain: 'Every name needs a value before a line uses it. `height` needs `width`; `area` needs both; `print` needs `area`. Any other order stops with a NameError.',
    },
    {
      id: 'code-total',
      type: 'code',
      title: 'Your turn: finish the program',
      text: [
        'Tickets cost 12 each, and you are buying 3. Line 3 should work out the total **from the two names above it**.',
        'Fix line 3. Press **Run** to try your program as often as you like, then **Check**.',
      ].join('\n\n'),
      starter: py`
        price = 12
        tickets = 3
        total = 0
        print(total)
      `,
      solution: py`
        price = 12
        tickets = 3
        total = price * tickets
        print(total)
      `,
      expect: '36',
      hidden: [
        { set: { price: 5, tickets: 4 }, stdout: '20', message: 'That prints 36 only because the answer is typed in. Use the names instead — `price * tickets` — and the program still works when the price changes.' },
      ],
      hints: ['Multiply the two names. Python looks up their values for you.', 'Line 3 becomes `total = price * tickets`.'],
      explain: '`total = price * tickets` looks up both names, multiplies 12 × 3 and ties the name `total` to the result. Because it uses the names, the program keeps working when the price changes.',
    },
    {
      id: 'code-lives',
      type: 'code',
      title: 'Update a variable',
      text: [
        'A game starts you with 3 lives. You **lose one**. Then a bonus **doubles** the lives you have left.',
        'Add one line under each comment (a comment starts with `#`; Python ignores it). Each line should work from the *current* value of `lives`.',
      ].join('\n\n'),
      starter: py`
        lives = 3
        # lose one life

        # double the lives

        print(lives)
      `,
      solution: py`
        lives = 3
        # lose one life
        lives = lives - 1
        # double the lives
        lives = lives * 2
        print(lives)
      `,
      expect: '4',
      hidden: [
        { set: { lives: 5 }, stdout: '8', message: 'That prints 4 for 3 lives, but not the right number for other starting values. Work from the current value: `lives = lives - 1`, then `lives = lives * 2`.' },
      ],
      wrong: [
        ['3', 'The value of `lives` never changes. A line such as `lives - 1` works out 2 and then throws it away. To keep the result: `lives = lives - 1`.'],
        ['2', 'You lost a life. Now add the line that doubles what is left.'],
        ['6', 'The lives were doubled, but no life was lost first.'],
        ['5', 'Order matters: lose a life first (3 − 1 = 2), then double (2 × 2 = 4). This doubles first.'],
      ],
      hints: ['`lives = lives - 1` reads the old value, takes 1 away, and gives the result the same name.', 'The second line follows the same pattern, with `* 2`.'],
      explain: '`lives = lives - 1` makes `lives` stand for 2. Then `lives = lives * 2` makes it stand for 4. The same name, a new value each time.',
    },
    {
      id: 'swap-trap',
      type: 'choice',
      review: true,
      title: 'A classic trap',
      gen: (rng) => {
        const [p, q] = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2);
        const [m, n] = rng.pick([['a', 'b'], ['x', 'y'], ['left', 'right'], ['first', 'second']]);
        const code = py`
          ${m} = ${p}
          ${n} = ${q}
          ${m} = ${n}
          ${n} = ${m}
          print(${m}, ${n})
        `;
        const printed = out(code);
        return {
          text: 'This program is *meant* to swap the two values. **What does it actually print?** (`print` with a comma shows both values on one line, with a space between them.)',
          figure: listing(code),
          options: [
            { text: `\`${printed}\``, correct: true },
            { text: `\`${q} ${p}\``, why: `That is what its author hoped for. But after line 3 the value ${p} has no name any more, so line 4 cannot get it back.` },
            { text: `\`${p} ${q}\``, why: `Line 3 does change \`${m}\`: from then on it stands for ${q}.` },
            { text: `\`${p} ${p}\``, why: `Line 3 runs first, and it replaces the ${p}.` },
          ],
          explain: `After line 3, both names stand for ${q}. The ${p} has been dropped, so line 4 just ties \`${n}\` to ${q} again.`,
        };
      },
    },
    {
      id: 'code-swap',
      type: 'code',
      stretch: true,
      title: 'Fix the swap',
      text: [
        'Repair the program so that it really swaps the two values and prints `2 1`.',
        'You will need a **third name** to keep the old value of `a` safe. The swap has to work for any two values, so do not type the numbers in.',
      ].join('\n\n'),
      starter: brokenSwap,
      solution: py`
        a = 1
        b = 2
        temp = a
        a = b
        b = temp
        print(a, b)
      `,
      expect: '2 1',
      hidden: [
        { set: { a: 7, b: 3 }, stdout: '3 7', message: 'That prints `2 1`, but it does not swap other values. Before `a` changes, give its old value a second name — `temp = a` — and use that name at the end.' },
        { set: { a: 7, b: 3 }, call: '[a, b]', expect: [3, 7], message: 'That prints the values the other way round, but `a` and `b` themselves have not changed places. After a real swap, `a` stands for the old value of `b`, and `b` for the old value of `a`.' },
      ],
      wrong: [['2 2', 'Still `2 2`: by the time line 4 runs, the 1 is gone. Save it under a third name *before* the line that changes `a`.']],
      hints: ['Before the line `a = b` drops the old value of `a`, give that value a second name: `temp = a`.', 'Then `a = b`, and finally `b = temp`.'],
      explain: '`temp = a` keeps the 1 alive under a second name while `a` is given its new value. Python also has a shortcut for exactly this: `a, b = b, a`.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about Python are **true**?',
      options: [
        { text: '`x = x + 1` works out `x + 1` first, then makes `x` stand for the result', correct: true },
        { text: 'After `y = x + 1`, changing `x` later changes `y` as well', why: '`y` was given a value, not a formula. It keeps that value until a line assigns to `y` again.' },
        { text: '`"12"` and `12` are different kinds of value', correct: true },
        { text: 'A name can be given a new value later in the program', correct: true },
        { text: '`=` asks whether two values are equal', why: '`=` gives a name to a value. Asking whether two values are equal is written `==`, which comes in the next lesson.' },
      ],
      explain: 'An `=` line works out its right-hand side once, and ties the name to that value. Nothing links the name to the calculation afterwards.',
    },
  ],
  recap: [
    'A variable is a **name for a value**. `name = value` works out the right-hand side first, then ties the name to it.',
    'A name keeps its value until another `=` line replaces it. `y = x + 1` is worked out once: it is a value, not a formula.',
    'Quotes make a **string**: `"2" + "3"` is `23`, while `2 + 3` is `5`.',
    'A program runs one line at a time, from the top — and you can trace it yourself.',
  ],
  next: 'Next: programs that make decisions.',
};
