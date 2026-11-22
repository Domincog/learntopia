// Python II: Building Programs · Lesson 6 · Build Something Real
import { py, out, outcome, listing, runner } from '../helpers.js';

const average = py`
  def average(nums):
      return sum(nums) / len(nums)

  print(average([4, 6]))
`;
const averageOf = (list) => out(average.replace('[4, 6]', list));
const averageCrash = outcome(average.replace('[4, 6]', '[]'));

const biggestBroken = py`
  def biggest(nums):
      best = 0
      for n in nums:
          if n > best:
              best = n
      return best

  assert biggest([3, 9, 4]) == 9
  assert biggest([-5, -2]) == -2
  print("All tests passed")
`;

// Functions with one bug each, and four asserts of which exactly one catches it.
const BUGS = [
  {
    task: 'return the longest word in a list. If several words tie, it should return the **first** of them',
    code: py`
      def longest(words):
          best = ""
          for w in words:
              if len(w) >= len(best):
                  best = w
          return best
    `,
    asserts: [
      'assert longest(["tea", "coffee"]) == "coffee"',
      'assert longest(["milk"]) == "milk"',
      'assert longest(["jam", "tea"]) == "jam"',
      'assert longest([]) == ""',
    ],
    explain: '`>=` lets a later word of the same length take over, so `longest(["jam", "tea"])` gives `"tea"`. Only the test with a **tie** shows that. The typical case, the single word and the empty list all pass.',
  },
  {
    task: 'count the marks of 50 **or more**',
    code: py`
      def passed(marks):
          count = 0
          for m in marks:
              if m > 50:
                  count = count + 1
          return count
    `,
    asserts: [
      'assert passed([70, 30]) == 1',
      'assert passed([]) == 0',
      'assert passed([50, 20]) == 1',
      'assert passed([51, 49]) == 1',
    ],
    explain: 'The function tests `m > 50`, so a mark of exactly 50 is not counted. Only the test that sits **right on the boundary** shows that. The test with 51 and 49 looks close, but both marks fall on the side where the function is right.',
  },
  {
    task: 'say whether the numbers in a list are in rising order',
    note: 'Here `i` is a position in the list, so `nums[i]` and `nums[i + 1]` are two numbers that stand next to each other.',
    code: py`
      def in_order(nums):
          for i in range(len(nums) - 2):
              if nums[i] > nums[i + 1]:
                  return False
          return True
    `,
    asserts: [
      'assert in_order([1, 2, 3]) == True',
      'assert in_order([3, 1, 2]) == False',
      'assert in_order([1, 3, 2]) == False',
      'assert in_order([5]) == True',
    ],
    explain: '`range(len(nums) - 2)` stops one step too early, so the **last pair** is never compared. `[1, 3, 2]` goes wrong only in its last pair, and slips through. A list that goes wrong at the start is caught, and the easy cases pass.',
  },
  {
    task: 'return the smallest number in a list',
    code: py`
      def smallest(nums):
          best = 100
          for n in nums:
              if n < best:
                  best = n
          return best
    `,
    asserts: [
      'assert smallest([4, 2, 9]) == 2',
      'assert smallest([7]) == 7',
      'assert smallest([150, 200]) == 150',
      'assert smallest([-3, 0]) == -3',
    ],
    explain: '`best` starts at 100, so the function can never return anything larger. Only a list in which **every** number is above 100 shows that. The starting value should come from the list itself: `best = nums[0]`.',
  },
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const SHIFT = py`
  def shift(ch, key):
      letters = "${ALPHABET}"
      if ch not in letters:
          return ch
      return letters[(letters.find(ch) + key) % 26]
`;
const ENCODE = py`
  def encode(text, key):
      result = ""
      for ch in text:
          result = result + shift(ch, key)
      return result
`;
const DECODE = py`
  def decode(text, key):
      return encode(text, -key)
`;
const program = (...parts) => parts.join('\n\n');

// The intercepted message of the last step, made with the learner's own functions.
const PLAIN = 'well done! you can read secret messages now';
const KEY = 17;
const SECRET = out(program(SHIFT, ENCODE, `print(encode("${PLAIN}", ${KEY}))`));
// (No blank line before the main program: one line more and the editor would not fit a laptop screen.)
const machine = (last) => `${program(SHIFT, ENCODE, DECODE)}\nsecret = "${SECRET}"\n${last}`;

// Worked examples for the teaching screens: each runs in the editor, with its output showing.
const claims = py`
  def double(n):
      return n + n

  assert double(4) == 8
  print("The first claim holds")
  assert double(4) == 9
  print("never reached")
`;
const claimsRun = outcome(claims);

const wrapping = py`
  letters = "${ALPHABET}"
  pos = letters.find("q")
  print(pos)
  print(pos + 12)
  print((pos + 12) % 26)
  print(letters[(pos + 12) % 26])
`;

/** A program in the editor that has already been run: the code and what it prints. */
const example = (code, alt) => runner(code, { autorun: true, alt });

/** Anticipated wrong answers: drop any that equal the answer or share a value with another entry. */
const slips = (answer, entries) => entries.filter(([v], i, all) => v !== answer && all.filter(([u]) => u === v).length === 1);

export default {
  id: 'build-a-program',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'It works. Or does it?',
      text: `This function passes its one and only test: the program prints \`${out(average)}\`. **Which of these calls would crash it?**`,
      figure: listing(average),
      options: [
        { text: '`average([])`', correct: true },
        { text: '`average([7])`' },
        { text: '`average([0, 0])`' },
        { text: '`average([-2, 2])`' },
      ],
      explain: [
        `\`average([])\`. An empty list has length 0, and dividing by zero stops the program with a ${averageCrash.error}. The other three calls are fine: they give \`${averageOf('[7]')}\`, \`${averageOf('[0, 0]')}\` and \`${averageOf('[-2, 2]')}\`.`,
        'A program that works on the one example you happened to try is not yet a program that works. In this lesson you check the awkward cases **on purpose**, and then build something bigger out of functions you have checked.',
      ].join('\n\n'),
    },
    {
      id: 'teach-assert',
      type: 'info',
      title: 'A claim that checks itself',
      text: [
        'Checking by hand soon gets tiring. Python has a word for it: `assert`, followed by a condition, means *this must be true here*. If it is, nothing happens and the program carries on. If it is not, the program stops with an **AssertionError** that names the line.',
        `:::example\nThe claim on line 4 is true, so it passes in silence and line 5 prints. The claim on line 6 is false: \`double(4)\` is 8, not 9. Python stops there with an ${claimsRun.error}, and line 7 never runs.\n:::`,
      ].join('\n\n'),
      figure: example(claims, 'A seven-line program in an editor with two asserts about a function that doubles a number. Its output: The first claim holds, and then an AssertionError on line 6.'),
    },
    {
      id: 'code-biggest',
      type: 'code',
      title: 'Which claim fails?',
      text: [
        'Lines 8 and 9 are asserts: each of them states something that **must be true** of `biggest`. Press **Run** and see which claim fails.',
        'The claims are right. The function is wrong. **Repair `biggest`**, so that the program reaches its last line.',
      ].join('\n\n'),
      starter: biggestBroken,
      solution: biggestBroken.replace('best = 0', 'best = nums[0]'),
      rows: 11,
      expect: 'All tests passed',
      hidden: [
        { call: 'biggest([-5, -2])', expect: -2, message: 'The program reaches its last line, but `biggest([-5, -2])` still does not give -2. Repair the function, not the tests.' },
        { call: 'biggest([-7])', expect: -7 },
        { call: 'biggest([-1, -9, -3])', expect: -1 },
        { call: 'biggest([2, 8, 8, 1])', expect: 8 },
        { call: 'biggest([-500, -200])', expect: -200 },
        { call: 'biggest([-2000000000, -1000000000])', expect: -1000000000 },
      ],
      feedback: ({ result }) => (result.error && result.error.type === 'AssertionError'
        ? `The claim on line ${result.error.line} is false at the moment: \`biggest\` does not return what that line expects. Find out what it returns instead.`
        : null),
      hints: [
        'The message names line 9: `biggest([-5, -2])` did not give -2. What did it give? A `print` above line 9 will tell you.',
        '`best` starts at 0, and no negative number can beat 0. Start from the first item instead: `best = nums[0]`.',
      ],
      explain: [
        'An `assert` that is true does nothing at all: line 8 passed in silence. The claim on line 9 was false, so Python stopped right there with an **AssertionError**.',
        'The bug: `best` started at 0, which beats every negative number. Starting from `nums[0]` works for any list that has at least one item.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Test the awkward cases on purpose',
      text: [
        'A handful of asserts under a function is a **test**. The bug in `biggest` stayed hidden until a test tried negative numbers. So choose the cases like a sceptic:',
        [
          '| Case | For a function that takes a list |',
          '|------|----------------------------------|',
          '| **Typical** | a few ordinary items |',
          '| **Empty** | `[]` |',
          '| **One item** | `[7]` |',
          '| **Ties** | two items that are equally good |',
          '| **Extremes** | negative numbers, zero, very large numbers, a value right on a boundary |',
        ].join('\n'),
        'The typical case usually works. Bugs live at the edges.',
      ].join('\n\n'),
    },
    {
      id: 'catch-bug',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const bug = rng.pick(BUGS);
        const failing = bug.asserts.filter((line) => outcome(`${bug.code}\n\n${line}`).error === 'AssertionError');
        if (failing.length !== 1) throw new Error(`expected exactly one failing assert, found ${failing.length}`);
        return {
          text: [
            `This function should ${bug.task}. It has a bug.${bug.note ? ` ${bug.note}` : ''}`,
            'An assert **catches** a bug when it stops the program. **Which of these asserts catches this one?**',
          ].join('\n\n'),
          figure: listing(bug.code),
          columns: 1,
          options: bug.asserts.map((line) => (line === failing[0]
            ? { text: `\`${line}\``, correct: true }
            : { text: `\`${line}\``, why: 'This claim is true of the function as it stands, so the assert passes in silence and catches nothing.' })),
          hints: ['Run each call in your head, with the function exactly as it is written. Which one does not give the value after `==`?'],
          explain: bug.explain,
        };
      },
    },
    {
      id: 'match-cases',
      type: 'match',
      text: 'You are testing `longest(words)`, which returns the longest word of a list. **Match each kind of test case with an input of that kind.**',
      pairs: [
        ['Typical', '`["tea", "coffee", "milk"]`'],
        ['Empty', '`[]`'],
        ['One item', '`["tea"]`'],
        ['A tie', '`["tea", "jam"]`'],
      ],
      explain: 'Four short lists, four different ways for the function to go wrong. Writing them down takes a minute. Finding the same bugs later, inside a bigger program, takes much longer.',
    },
    {
      id: 'wheel',
      type: 'interact',
      title: 'The project: a secret-message machine',
      text: [
        'Time to build something. A **Caesar cipher** hides a message by moving every letter the same number of places along the alphabet. That number is the **key**.',
        'Turn the wheel, or use the slider, until `HELLO` turns into `KHOOR`. **Which key does it?**',
      ].join('\n\n'),
      widget: {
        type: 'cipher-wheel', text: 'HELLO', mode: 'encode', shift: 0,
        alt: 'A cipher wheel: an outer ring with the alphabet and an inner ring with the alphabet turned by the key. Below it the word HELLO and its encoded version.',
      },
      check: (s) => {
        if (s.shift === 3) return true;
        if (s.shift === 0) return 'With key 0 nothing moves. Turn the wheel or drag the slider.';
        return `With key ${s.shift}, HELLO turns into ${s.output}. You need the H to become a K.`;
      },
      solution: { shift: 3 },
      hints: ['Count along the alphabet from H to K.'],
      explain: [
        'Key 3: every letter moves three places, so H → K, E → H, L → O and O → R. To read the message, the receiver moves every letter three places **back**.',
        'The Roman writer Suetonius reports that Julius Caesar wrote private letters like this, with a shift of three. You will build the machine out of three small functions, and test each one before you rely on it.',
      ].join('\n\n'),
    },
    {
      id: 'teach-wrap',
      type: 'info',
      title: 'Past z, back to a',
      text: [
        'For a program, moving a letter is arithmetic on its **position**: `a` is at 0 and `z` at 25, and `letters.find(ch)` gives the position of a letter. But there is no position past 25. The remainder operator `%` makes the count **wrap round**, like the hours on a clock.',
        ':::example\n`q` is at position 16. Twelve places on is 28, past the end of the alphabet. `28 % 26` is the remainder after dividing by 26: that is 2, the position of `c`. A sum below 26 is left alone: `19 % 26` is 19.\n:::',
      ].join('\n\n'),
      figure: example(wrapping, 'A six-line program in an editor that finds the position of the letter q, adds 12 and takes the remainder after dividing by 26. Its output: 16, 28, 2 and the letter c.'),
    },
    {
      id: 'wrap',
      type: 'numeric',
      review: true,
      title: 'Wrapping round',
      gen: (rng) => {
        const letter = rng.pick(['r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']);
        const key = rng.int(3, 9);
        const pos = ALPHABET.indexOf(letter);
        const code = py`
          letters = "${ALPHABET}"
          print((letters.find("${letter}") + ${key}) % 26)
        `;
        const answer = Number(out(code));
        const wraps = pos + key >= 26;
        return {
          text: 'The remainder operator `%` can make a count wrap round, like the hours on a clock. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [pos + key, `That is ${pos} + ${key}, before the wrap. \`% 26\` keeps only the remainder after dividing by 26.`],
            [(pos + 1 + key) % 26, `Positions start at 0: \`a\` is at 0, so \`${letter}\` is at ${pos}, not ${pos + 1}.`],
          ]),
          hints: [`\`letters.find("${letter}")\` is the position of \`${letter}\`, counting from 0.`, `It is ${pos}. Add ${key}, then take the remainder after dividing by 26.`],
          explain: wraps
            ? `\`${letter}\` is at position ${pos}, and ${pos} + ${key} = ${pos + key}. That is past the end of the alphabet, which stops at position 25. The remainder after dividing by 26 is **${answer}**: the count has wrapped round to \`${ALPHABET[answer]}\`.`
            : `\`${letter}\` is at position ${pos}, and ${pos} + ${key} = ${pos + key}. That is still less than 26, so \`% 26\` leaves it alone: **${answer}**, the position of \`${ALPHABET[answer]}\`.`,
        };
      },
    },
    {
      id: 'code-shift',
      type: 'code',
      title: 'Step 1: one letter',
      text: [
        'Write `shift(ch, key)`. It moves one lower-case letter `key` places along the alphabet and returns the new letter.',
        '- Past `z` it wraps round to `a`: `shift("y", 3)` is `"b"`. Use `% 26`.\n- A negative key moves backwards: `shift("d", -3)` is `"a"`.\n- Anything that is not a lower-case letter, such as a space or `!`, comes back unchanged.',
        '`letters.find(ch)` is the position of a letter, from 0 to 25.',
      ].join('\n\n'),
      starter: py`
        def shift(ch, key):
            letters = "${ALPHABET}"
            return ch

        print(shift("a", 3))
      `,
      solution: `${SHIFT}\n\nprint(shift("a", 3))`,
      rows: 8,
      tests: [
        { call: 'shift("a", 3)', expect: 'd' },
        { call: 'shift("y", 3)', expect: 'b' },
        { call: 'shift(" ", 3)', expect: ' ' },
      ],
      hidden: [
        { call: 'shift("z", 1)', expect: 'a' },
        { call: 'shift("d", -3)', expect: 'a' },
        { call: 'shift("b", -3)', expect: 'y' },
        { call: 'shift("m", 0)', expect: 'm' },
        { call: 'shift("q", 26)', expect: 'q' },
        { call: 'shift("a", 55)', expect: 'd', message: 'A key can be much larger than 26: `shift("a", 55)` should be `"d"`, the same as a key of 3. `% 26` takes care of that.' },
        { call: 'shift("c", -29)', expect: 'z' },
        { call: 'shift("!", 5)', expect: '!' },
        { call: 'shift("7", 2)', expect: '7' },
        { call: 'shift("A", 3)', expect: 'A', message: 'Only lower-case letters move. A capital such as `"A"` is not a lower-case letter, so `shift("A", 3)` should hand it back unchanged.' },
      ],
      hints: [
        'Deal with the odd characters first: `if ch not in letters:` then `return ch`.',
        'The new position is `(letters.find(ch) + key) % 26`. Return the letter at that position: `letters[...]`.',
      ],
      explain: 'Three typical letters would not have been enough to trust this function. The checks also tried the edge of the alphabet, a key of 0, a negative key and characters that are not letters. In Python, `% 26` gives a result from 0 to 25 even when the key is negative, which is why going backwards needs no extra code.',
    },
    {
      id: 'code-encode',
      type: 'code',
      title: 'Step 2: a whole message',
      text: [
        'Now `encode(text, key)`: it shifts **every** character of a text and returns the new text. A tested `shift` is already in the editor. Use it.',
        'You know the pattern: start with `""` and build the result one character at a time.',
      ].join('\n\n'),
      starter: program(SHIFT, py`
        def encode(text, key):
            return text

        print(encode("hello", 3))
      `),
      solution: program(SHIFT, ENCODE, 'print(encode("hello", 3))'),
      rows: 13,
      tests: [
        { call: 'encode("hello", 3)', expect: 'khoor' },
        { call: 'encode("see you at six!", 1)', expect: 'tff zpv bu tjy!' },
        { call: 'encode("", 5)', expect: '' },
      ],
      hidden: [
        { call: 'encode("xyz", 3)', expect: 'abc' },
        { call: 'encode("lemma", 0)', expect: 'lemma' },
        { call: 'encode("khoor", -3)', expect: 'hello' },
        { call: 'encode("a b", 25)', expect: 'z a' },
      ],
      hints: [
        '`result = ""`, then `for ch in text:`.',
        'Inside the loop: `result = result + shift(ch, key)`. After the loop: `return result`.',
      ],
      explain: '`encode` knows nothing about alphabets or wrapping. It loops, and leaves every decision about a single character to `shift`. Because `shift` was tested first, there is very little here that can go wrong.',
    },
    {
      id: 'code-decode',
      type: 'code',
      title: 'Step 3: and back again',
      text: [
        'A cipher is no use unless the message can be read again. Write `decode(text, key)`: it undoes `encode` with the same key, so `decode("khoor", 3)` is `"hello"`.',
        'Think before you type. Do you need a new loop? Moving every letter `key` places **back** is the same as encoding with…',
      ].join('\n\n'),
      starter: program(SHIFT, ENCODE, py`
        def decode(text, key):
            return text
      `),
      solution: program(SHIFT, ENCODE, DECODE),
      rows: 14,
      tests: [
        { call: 'decode(encode("round trip!", 7), 7)', expect: 'round trip!' },
      ],
      hidden: [
        { call: 'decode("khoor", 3)', expect: 'hello' },
        { call: 'decode("abc", 3)', expect: 'xyz' },
        { call: 'decode("tff zpv!", 1)', expect: 'see you!' },
        { call: 'decode("", 4)', expect: '' },
        { call: 'decode("lemma", 0)', expect: 'lemma' },
      ],
      hints: [
        'Going back by `key` is the same as going forward by `-key`.',
        'The whole body is one line: `return encode(text, -key)`.',
      ],
      explain: 'One line, because `encode` already does all the work: `decode(text, key)` is `encode(text, -key)`. The check shown here is worth remembering. Encode, then decode, and you must get back exactly what you started with. A **round trip** like that tests two functions at once.',
    },
    {
      id: 'crack',
      type: 'interact',
      title: 'Run the whole machine',
      text: [
        'The finished machine is in the editor, together with an intercepted message. Nobody told you the key. But there are only 26 keys…',
        '**Find the key and read the message.** Change the last line, or better still, make the program try every key for you.',
      ].join('\n\n'),
      widget: runner(machine('print(decode(secret, 1))'), { alt: 'The finished cipher program in an editor, with a secret message on the last lines.' }),
      check: (s) => {
        if (!s.runs) return 'Press Run, look at the output, then change the last line and run again.';
        if (s.error) return 'The program stopped with an error. Read the message, fix the line and run it again.';
        if (s.stdout.includes(PLAIN)) return true;
        return 'No readable message in the output yet. Try other keys. A loop can try them all: `for key in range(26):` with the `print` inside it.';
      },
      solution: { code: machine('for key in range(26):\n    print(key, decode(secret, key))') },
      hints: ['Change the 1 in the last line to another key and run again. Or let a loop do the trying.', 'Replace the last line with `for key in range(26):` and, indented under it, `print(key, decode(secret, key))`. Then read down the output.'],
      explain: [
        `The key was ${KEY}. Twenty-six tries are nothing to a computer, which is why this cipher has not been safe for a very long time.`,
        'Look at how the program is built. `decode` is one line because `encode` exists, and the code breaker is two lines because `decode` exists. Each layer rests on functions that were tested before anything was built on them. Large programs are made the same way.',
      ].join('\n\n'),
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'An `assert` whose condition is true does nothing', correct: true },
        { text: 'An `assert` whose condition is false stops the program with an AssertionError', correct: true },
        { text: 'An empty list and a list with one item are both worth a test of their own', correct: true },
        { text: 'If a function gives the right answer for one typical input, it is correct', why: 'Bugs hide at the edges: the empty list, a tie, a negative number, a value right on a boundary.' },
        { text: 'A function that only calls well-tested functions needs no test of its own', why: 'The pieces can each be right and still be put together wrongly. Test the combination as well.' },
      ],
      explain: 'An assert is a claim that checks itself. A good set of them covers a typical case and the awkward ones, at every level: the small functions first, then the functions built from them.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'Think of a small program you would like to write next. **Which functions would it need? Name three, and say what each one takes in and what it returns.**',
      model: [
        'An example, for a program that splits a restaurant bill: `subtotal(prices)` takes a list of prices and returns their sum. `with_tip(amount, percent=10)` takes an amount and returns it with the tip added. `split(amount, people)` returns each person\'s share and what is left over.',
        'Each of them has one job and can be tested on its own, with typical and awkward inputs, before the three are joined together.',
      ].join('\n\n'),
    },
  ],
  recap: [
    '`assert` states what must be true. It is silent when the claim holds, and stops the program when it does not.',
    'Test the awkward cases on purpose: empty, one item, ties, negative numbers, values on a boundary.',
    'Build in layers: write a small function, test it, then build the next one on top of it.',
    'A round trip, such as encode and then decode, tests two functions at once.',
  ],
  next: 'That is the course. You can take text apart, choose the right loop, give data a shape, split a program into functions, use recursion and test what you build. A good next step is Algorithms II, where the question becomes which strategy to choose: try and back up, grab the best piece, or remember what you have already solved. (If you have not taken the first Algorithms course, start there.)',
};
