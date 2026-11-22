// Python II: Building Programs · Lesson 1 · Text Is a Sequence
import { py, out, errorOf, listing, tracer, runner, reachedEnd, boxes } from '../helpers.js';

const slicer = py`
  word = "python"
  print(word[1:4])
`;

const frozen = py`
  name = "cat"
  name[0] = "b"
  print(name)
`;
const frozenError = errorOf(frozen);

const reverser = py`
  word = "stop"
  result = ""
  for ch in word:
      result = ch + result
  print(result)
`;

const shouting = py`
  shout = "hello"
  shout.upper()
  print(shout)
`;

const booking = py`
  name = "Ada"
  n = 3
  print(f"{name} has {n * 2} books")
`;

// Worked examples for the teaching screens: each runs in the editor, with its output showing.
const rebuild = py`
  word = "mouse"
  new = "h" + word[1:]
  print(new)
  print(word)
`;

const teaTime = py`
  title = "Tea Time"
  loud = title.upper()
  print(loud)
  print(title.lower().replace(" ", ""))
  print(title)
`;

const labelled = py`
  pet = "Rex"
  age = 4
  print(f"{pet} is {age} years old")
  print(f"Next year: {age + 1}")
  print("{pet} is {age}")
`;

const tagging = py`
  def tags(text):
      result = ""
      for word in text.split():
          result = result + "#" + word.lower()
      return result

  print(tags("Red Kite Park"))
`;

/** A program in the editor that has already been run: the code and what it prints. */
const example = (code, alt) => runner(code, { autorun: true, alt });

// Six-letter words with no repeated letter, so that every slice is different.
const WORDS = ['planet', 'garden', 'silver', 'orange', 'pencil', 'monkey', 'castle', 'frozen', 'bridge'];

/** What Python shows for an expression: its repr, worked out by the interpreter. */
const shown = (expr) => out(`print(repr(${expr}))`);
const tick = (text) => `\`${text}\``;

const METHODS = [
  '" tea ".strip()',
  '"tea".replace("t", "s")',
  '"tea".find("a")',
  '"t-e-a".split("-")',
  '"-".join(["t", "e", "a"])',
];

export default {
  id: 'strings',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Square brackets, again',
      text: [
        'You have used square brackets to pick one item out of a list. They work on text too, and they can do more than pick one character.',
        '**What do you think this program prints?**',
      ].join('\n\n'),
      figure: listing(slicer),
      options: [
        { text: '`yth`', correct: true },
        { text: '`ytho`' },
        { text: '`pyt`' },
        { text: '`pyth`' },
      ],
      explain: [
        `\`${out(slicer)}\`. A string is a row of characters, numbered from 0 like the items of a list: \`p\` is at position 0 and \`y\` at position 1.`,
        '`word[1:4]` is a **slice**. It starts at position 1 and stops **before** position 4, the same rule as `range(1, 4)`.',
      ].join('\n\n'),
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Try it',
      text: [
        'Change the numbers in the square brackets and press **Run**.',
        'Your goal: make the program print `hon`. On the way, be curious. What does `word[:2]` give? And `word[-1]`?',
      ].join('\n\n'),
      widget: runner(slicer),
      check: (s) => {
        if (!s.runs) return 'Change the numbers in the square brackets, then press Run.';
        if (s.error === 'IndexError') return 'That position does not exist. Counting from the front, positions run from 0 to one less than the length of the string.';
        if (s.error) return 'The program stopped with an error. Read the message, fix the line and run it again.';
        return s.stdout.trim() === 'hon' || 'Not `hon` yet. Count from 0 to find where the `h` is, and remember that a slice stops **before** its second number.';
      },
      solution: { code: 'word = "python"\nprint(word[3:6])' },
      explain: [
        '`word[3:6]` gives `hon`: positions 3, 4 and 5. So does `word[3:]`, because a slice with no end number runs to the end. And so does `word[-3:]`, which starts three characters from the end.',
        'None of this changed `word`. A slice hands you a **new**, shorter string.',
      ].join('\n\n'),
    },
    {
      id: 'idea',
      type: 'info',
      title: 'A string is a sequence',
      text: [
        '- `word[0]` is the first character and `word[-1]` the last. `len(word)` is 6.\n- `word[1:4]` is the slice from position 1 up to, but **not including**, position 4.\n- Leave a number out and the slice runs to that end: `word[:2]` is `py`, and `word[2:]` is `thon`.\n- A negative start counts back from the end: `word[-3:]` is `hon`, the last three characters.\n- `"th" in word` asks whether one string appears inside another. Here: `True`.',
        ':::note Why stop before the end?\nBecause the pieces then fit together: `word[:2] + word[2:]` is the whole word, with nothing doubled and nothing lost. And `word[a:b]` has `b - a` characters, as long as the slice stays inside the word.\n:::',
      ].join('\n\n'),
      figure: {
        ...boxes('python', {
          negative: true,
          mark: [1, 2, 3],
          alt: 'The word python drawn as six boxes in a row, one letter in each. Above the boxes are the positions 0 to 5, below them the negative positions -6 to -1. The boxes at positions 1, 2 and 3, holding y, t and h, are highlighted.',
        }),
        caption: 'word = "python", with word[1:4] highlighted',
      },
    },
    {
      id: 'slice-practice',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const word = rng.pick(WORDS);
        const kind = rng.pick(['mid', 'head', 'tail', 'neg']);
        const show = (expr) => out(`word = "${word}"\nprint(${expr})`);
        const at = (i) => tick(show(`word[${i}]`));
        let expr;
        let wrong;
        let why;
        if (kind === 'mid') {
          const a = rng.int(1, 2);
          const b = a + rng.int(2, 3);
          expr = `word[${a}:${b}]`;
          wrong = [
            [`word[${a}:${b + 1}]`, `A slice stops **before** its end position, so ${at(b)} (position ${b}) is left out.`],
            [`word[${a - 1}:${b}]`, `Positions start at 0, so position ${a} is ${at(a)}, not ${at(a - 1)}.`],
            [`word[${a - 1}:${b - 1}]`, `Positions start at 0: the slice begins at ${at(a)} and runs up to, but not including, position ${b}.`],
          ];
          why = `\`${expr}\` starts at position ${a}, which is ${at(a)}, and stops before position ${b}, which is ${at(b)}. That leaves ${b - a} characters`;
        } else if (kind === 'head') {
          const b = rng.int(2, 4);
          expr = `word[:${b}]`;
          wrong = [
            [`word[:${b + 1}]`, `A slice stops **before** its end position, so ${at(b)} (position ${b}) is left out.`],
            [`word[${b}:]`, `That is \`word[${b}:]\`, the part from position ${b} onwards. \`${expr}\` is the part **before** it.`],
            [`word[${b}]`, `That is the single character \`word[${b}]\`. With a colon in the brackets you get a slice.`],
          ];
          why = `With no start number, the slice begins at position 0. It stops before position ${b}, so it has ${b} characters`;
        } else if (kind === 'tail') {
          const a = rng.int(2, 4);
          expr = `word[${a}:]`;
          wrong = [
            [`word[${a + 1}:]`, `The slice starts **at** position ${a}, so ${at(a)} is included.`],
            [`word[:${a}]`, `That is \`word[:${a}]\`, the part before position ${a}. \`${expr}\` starts there and runs to the end.`],
            [`word[${a - 1}:]`, `Positions start at 0, so position ${a} is ${at(a)}, not ${at(a - 1)}.`],
          ];
          why = `With no end number, the slice runs to the end of the string. It starts at position ${a}, which is ${at(a)}`;
        } else {
          const k = rng.int(2, 3);
          expr = `word[-${k}:]`;
          wrong = [
            [`word[-${k}]`, `That is the single character at position -${k}. With the colon, the slice runs from there to the end.`],
            [`word[:-${k}]`, `That is \`word[:-${k}]\`: everything **except** the last ${k} characters.`],
            [`word[-${k - 1}:]`, `Position -${k} is ${k} characters from the end, so the slice has ${k} characters, not ${k - 1}.`],
          ];
          why = `A negative position counts back from the end. The slice starts ${k} characters before the end and runs to the end`;
        }
        const code = `word = "${word}"\nprint(${expr})`;
        const answer = out(code);
        return {
          text: 'What does this program print?',
          figure: listing(code),
          columns: 2,
          options: [
            { text: tick(answer), correct: true },
            ...wrong.map(([e, message]) => ({ text: tick(show(e)), why: message })),
          ],
          hints: [`Write the positions above the letters of \`${word}\`, starting from 0.`],
          explain: `${why}: **\`${answer}\`**.`,
        };
      },
    },
    {
      id: 'teach-immutable',
      type: 'info',
      title: 'A string never changes',
      text: [
        'With a list, `items[0] = "b"` replaces an item. A string does not allow that. It is **immutable**: once made, it never changes. A line such as `word[0] = "h"` stops the program with a TypeError.',
        ':::example\nTo get a changed text, **build a new string**. Line 2 joins `"h"` to the slice `word[1:]`, which is `ouse`, and gives the result a name of its own. The old string is untouched: line 4 still prints `mouse`.\n:::',
      ].join('\n\n'),
      figure: example(rebuild, 'A four-line program in an editor. It builds a new string from the letter h and a slice of the word mouse. Its output: house, then mouse.'),
    },
    {
      id: 'immutable',
      type: 'choice',
      review: true,
      title: 'Can you change a letter?',
      text: 'With a list, `items[0] = "b"` replaces the first item. This program tries the same thing with a string. **What happens?**',
      figure: listing(frozen),
      options: [
        { text: `It stops with a \`${frozenError.type}\` on line ${frozenError.line}`, correct: true },
        { text: 'It prints `bat`', why: 'That is what a list would do. A string cannot be changed in place, so Python refuses to carry out line 2.' },
        { text: 'It prints `cat`', why: 'Python does not skip line 2 quietly. It stops there with an error message.' },
        { text: 'It prints `b`', why: 'Line 2 does not replace the whole string. In fact it cannot run at all.' },
      ],
      columns: 1,
      explain: [
        `A string is **immutable**: once made, it never changes. Line 2 stops the program with \`${frozenError.type}: ${frozenError.message}\`.`,
        `To get \`${out('name = "cat"\nname = "b" + name[1:]\nprint(name)')}\`, you build a **new** string and give it the old name: \`name = "b" + name[1:]\`.`,
      ].join('\n\n'),
    },
    {
      id: 'watch-reverse',
      type: 'interact',
      graded: false,
      title: 'Build a new one',
      text: [
        'If a string cannot be changed, how do you turn a word around? You build a new string, one character at a time.',
        'Step through and watch `result` grow. **On which side does each new letter go?**',
      ].join('\n\n'),
      widget: tracer(reverser),
      check: reachedEnd(),
      solution: { done: true },
      explain: [
        'Line 4 puts each new letter **in front** of what has been built so far: `s`, `ts`, `ots`, `pots`. Every pass makes a brand-new string and gives it the name `result`.',
        'This is the accumulator from the first course, starting from `""` instead of 0. And `word` is still `stop` at the end.',
      ].join('\n\n'),
    },
    {
      id: 'methods',
      type: 'info',
      title: 'The workhorses',
      text: [
        'A string has tools of its own, called **methods**. You call one with a dot after the string. These seven methods do most of the text work in real programs. Each one hands back a **new value** and leaves the original alone.',
        [
          '| Call | Gives |',
          '|------|-------|',
          ...['"Hi There".lower()', '"Hi There".upper()', '"  tea ".strip()', '"banana".replace("a", "o")', '"banana".find("n")', '"a,b,c".split(",")', '"-".join(["a", "b", "c"])']
            .map((expr) => `| \`${expr}\` | \`${shown(expr)}\` |`),
        ].join('\n'),
        '`strip` removes spaces from both ends. `find` gives the **position** of the first match. `split` cuts a string into a **list** of pieces, and `join` glues a list back into one string.',
      ].join('\n\n'),
    },
    {
      id: 'match-methods',
      type: 'match',
      review: true,
      text: 'Match each call with the value it hands back.',
      pairs: METHODS.map((expr) => [tick(expr), tick(shown(expr))]),
      explain: '`strip` removes spaces from both ends, `replace` swaps one piece of text for another, and `find` gives the position of the first match (counting from 0). `split` cuts a string into a **list** of pieces, and `join` glues a list back into one string.',
    },
    {
      id: 'example-chain',
      type: 'info',
      title: 'Keep the result, or pass it on',
      text: [
        'A method works on a name as well: `title.upper()`. Like a function with `return`, it **hands its result back**. What you do with the result is up to you.',
        ':::example\nLine 2 keeps the result by giving it a name. Line 4 is a **chain**: `lower()` runs first, and `replace` works on what it handed back. Replacing `" "` with the empty string `""` removes the space. Line 5 shows that `title` itself never changed.\n:::',
      ].join('\n\n'),
      figure: example(teaTime, 'A five-line program in an editor that calls methods on the string Tea Time. Its output: TEA TIME in capitals, then teatime as one lower-case word, then Tea Time unchanged.'),
    },
    {
      id: 'method-trap',
      type: 'choice',
      review: true,
      title: 'A tool that seems to do nothing',
      text: 'A string has tools of its own, called **methods**. You call one with a dot: `shout.upper()` makes a capital-letter version. **What does this program print?**',
      figure: listing(shouting),
      options: [
        { text: '`hello`', correct: true },
        { text: '`HELLO`', why: 'Line 2 did make the string `HELLO`, but nothing kept it. `shout` still names the old string.' },
        { text: '`Hello`', why: '`upper()` would capitalise every letter. But look at what line 3 prints: `shout`, which line 2 never changed.' },
        { text: 'An error', why: 'No error. Line 2 runs, makes a new string and throws it away.' },
      ],
      explain: [
        `It prints \`${out(shouting)}\`. A method cannot change the string it is called on, because nothing can. It hands back a **new** string, and line 2 does not keep it.`,
        'To keep the result, give it a name: `shout = shout.upper()`.',
      ].join('\n\n'),
    },
    {
      id: 'teach-fstring',
      type: 'info',
      title: 'Text with gaps in it',
      text: [
        'One more tool for building text. Put an `f` in front of the opening quote, and the string becomes an **f-string**: a text with gaps in it. Each pair of curly brackets is a gap. Python **works out** whatever stands in it and drops the value into the text.',
        ':::example\nLine 3 fills its two gaps with the values of `pet` and `age`. A gap can hold a calculation too: line 4 works out `age + 1`. Line 5 has no `f`, so its curly brackets are printed just as they stand.\n:::',
      ].join('\n\n'),
      figure: example(labelled, 'A five-line program in an editor with two f-strings and one ordinary string. Its output: Rex is 4 years old, then Next year: 5, then the text with its curly brackets unfilled.'),
    },
    {
      id: 'fstring',
      type: 'choice',
      title: 'Fill the gaps',
      text: 'This f-string has a calculation in one of its gaps. **What does this program print?**',
      figure: listing(booking),
      options: [
        { text: `\`${out(booking)}\``, correct: true },
        { text: '`Ada has n * 2 books`', why: 'The curly brackets do not just name a variable. Python works out the whole expression between them: `n * 2` is 6.' },
        { text: '`{name} has {n * 2} books`', why: 'That is what the string would be without the `f` in front. With it, each pair of curly brackets is replaced by a value.' },
        { text: '`Ada has 3 books`', why: 'The second gap holds `n * 2`, not `n`. Python works that out first: 6.' },
      ],
      columns: 1,
      explain: 'The first gap holds a name, so it is filled with `Ada`. The second holds `n * 2`, which Python works out first: 6. A gap can hold any expression, even a method call. An f-string is the tidiest way to mix text and values in one line of output.',
    },
    {
      id: 'tidy',
      type: 'fill',
      title: 'Tidy up messy input',
      text: [
        'People type messily: stray spaces, capital letters in odd places. This program cleans up an email address and takes it apart.',
        'It should print `ada at example.com`. **Choose the method for each gap.**',
      ].join('\n\n'),
      template: [
        '```python',
        'raw = "  Ada@Example.COM "',
        'email = raw.[[split|*strip|find]]().[[upper|join|*lower]]()',
        'parts = email.[[*split|replace|join]]("@")',
        'print(f"{parts[0]} at {parts[1]}")',
        '```',
      ].join('\n'),
      hints: ['First get rid of the spaces at both ends, then of the capital letters.', 'Line 3 has to cut the address in two at the `@`, giving a list.'],
      explain: '`strip()` removes the spaces at the ends, `lower()` deals with the capitals, and `split("@")` cuts what is left into the list `[\'ada\', \'example.com\']`. Methods can be chained: each one works on what the one before it handed back.',
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Arrange the lines into a function that counts the vowels in a text. `count_vowels("Queue")` should give 4.',
      items: [
        'def count_vowels(text):',
        '    count = 0',
        '    for ch in text.lower():',
        '        if ch in "aeiou":',
        '            count = count + 1',
        '    return count',
      ],
      hints: ['The counter has to exist before the loop starts.', '`return count` belongs after the loop, not inside it: it has the same indentation as `for`.'],
      explain: '`for ch in text.lower()` visits every character of a lower-case copy, so `Q` and `q` are treated alike. `ch in "aeiou"` is a neat way to ask "is this character one of these five?".',
    },
    {
      id: 'example-words',
      type: 'info',
      title: 'Word by word',
      text: [
        'Now the tools work together inside a function. With nothing in its brackets, `split()` cuts a text at the spaces and hands back the list of its words.',
        ':::example\n`"Red Kite Park".split()` is `[\'Red\', \'Kite\', \'Park\']`. The loop takes one word per pass and adds `#` and a lower-case copy of the word to `result`, which started as `""`. After the loop, `return` hands back the finished string.\n:::',
      ].join('\n\n'),
      figure: example(tagging, 'A function in an editor that splits a text into words and builds a new string from them in a loop. Its output: #red#kite#park.'),
    },
    {
      id: 'code-initials',
      type: 'code',
      title: 'Your turn: initials',
      text: [
        'Write `initials(name)`. It **returns** the first letter of every word, as capitals, joined into one string: `initials("ada lovelace")` gives `"AL"`.',
        'The words are separated by single spaces. `name.split()` gives you the list of words.',
      ].join('\n\n'),
      starter: py`
        def initials(name):
            return ""

        print(initials("ada lovelace"))
      `,
      solution: py`
        def initials(name):
            result = ""
            for word in name.split():
                result = result + word[0].upper()
            return result

        print(initials("ada lovelace"))
      `,
      rows: 8,
      tests: [
        { call: 'initials("ada lovelace")', expect: 'AL' },
        { call: 'initials("Grace Brewster Hopper")', expect: 'GBH' },
        { call: 'initials("plato")', expect: 'P' },
      ],
      hidden: [
        { call: 'initials("tim berners lee")', expect: 'TBL' },
        { call: 'initials("x y z w")', expect: 'XYZW' },
      ],
      hints: [
        'Start with `result = ""`. Then loop: `for word in name.split():`.',
        'Inside the loop, add the first letter of the word, in capitals: `result = result + word[0].upper()`. After the loop, `return result`.',
      ],
      explain: '`split()` cuts the name into words, `word[0]` is the first letter of each, and `upper()` makes it a capital. The accumulator starts as `""` and grows by one letter per word.',
    },
    {
      id: 'code-palindrome',
      type: 'code',
      stretch: true,
      title: 'The same both ways',
      text: [
        'A **palindrome** reads the same forwards and backwards: `level`, `noon`. Write `is_palindrome(text)`, which returns `True` or `False`.',
        'Capital letters and spaces must not matter: `"Never odd or even"` counts as a palindrome.',
      ].join('\n\n'),
      starter: py`
        def is_palindrome(text):
            return False

        print(is_palindrome("Never odd or even"))
      `,
      solution: py`
        def is_palindrome(text):
            clean = text.lower().replace(" ", "")
            backwards = ""
            for ch in clean:
                backwards = ch + backwards
            return clean == backwards

        print(is_palindrome("Never odd or even"))
      `,
      rows: 9,
      tests: [
        { call: 'is_palindrome("level")', expect: true },
        { call: 'is_palindrome("lemma")', expect: false },
        { call: 'is_palindrome("Noon")', expect: true },
        { call: 'is_palindrome("taco cat")', expect: true },
      ],
      hidden: [
        { call: 'is_palindrome("Never odd or even")', expect: true },
        { call: 'is_palindrome("abca")', expect: false },
        { call: 'is_palindrome("ab")', expect: false },
        { call: 'is_palindrome("x")', expect: true },
        { call: 'is_palindrome("foot")', expect: false, message: 'Try `is_palindrome("foot")`: the two `o`s in the middle match, but `f` and `t` do not, so the answer is `False`. One pair of letters that differs is enough.' },
      ],
      hints: [
        'First make a clean copy: `clean = text.lower().replace(" ", "")`.',
        'Build the clean text backwards, as in the word-reversing loop: `backwards = ch + backwards`. Then `return clean == backwards`.',
      ],
      explain: 'Clean first, then compare the text with its own reverse. The comparison `clean == backwards` is already `True` or `False`, so it can be returned as it is. (Python also has a shortcut for reversing: the slice `clean[::-1]`.)',
    },
  ],
  recap: [
    'A string is a sequence of characters: `s[0]`, `s[-1]`, `len(s)`, and slices `s[a:b]` that stop **before** position `b`.',
    'Strings are **immutable**. You never change one: you build a new one and give it a name.',
    'Methods such as `lower`, `strip`, `replace`, `split` and `join` hand back new values. Keep the result, or it is lost.',
    '`for ch in text` visits every character. With an accumulator, that is how you count, reverse and rebuild text.',
  ],
  next: 'Next: the loops you keep writing fall into a handful of patterns. Learn to recognise them.',
};
