// Thinking in Code · Lesson 6 · Look It Up
import { py, out, listing, tracer, reachedEnd } from '../helpers.js';

const prices = py`
  prices = {"apple": 3, "pear": 5}
  print(prices["pear"])
`;

const tally = py`
  counts = {}
  for colour in ["red", "blue", "red"]:
      if colour in counts:
          counts[colour] = counts[colour] + 1
      else:
          counts[colour] = 1
  print(counts)
`;

// Two keys, each with an arrow to its value.
const dictFigure = {
  type: 'svg', viewBox: '0 0 372 150', maxWidth: 400,
  alt: 'A dictionary drawn as two rows. In each row a key on the left points with an arrow to its value on the right: apple points to 3, pear points to 5.',
  content: [
    '<text class="fig-label-sm text-orange" x="80" y="20" text-anchor="middle">key</text>',
    '<text class="fig-label-sm text-blue" x="292" y="20" text-anchor="middle">value</text>',
    '<g class="stroke-ink" stroke-width="2.5">',
    '<rect class="fill-orange-soft" x="12" y="30" width="136" height="46" rx="10"/>',
    '<rect class="fill-orange-soft" x="12" y="92" width="136" height="46" rx="10"/>',
    '<rect class="fill-blue-soft" x="244" y="30" width="96" height="46" rx="10"/>',
    '<rect class="fill-blue-soft" x="244" y="92" width="96" height="46" rx="10"/>',
    '<path fill="none" d="M156 53H232M222 45l10 8-10 8M156 115H232M222 107l10 8-10 8" stroke-linecap="round" stroke-linejoin="round"/>',
    '</g>',
    '<text class="fig-label fig-mono" x="80" y="58" text-anchor="middle">"apple"</text>',
    '<text class="fig-label fig-mono" x="80" y="120" text-anchor="middle">"pear"</text>',
    '<text class="fig-label-lg fig-mono" x="292" y="60" text-anchor="middle">3</text>',
    '<text class="fig-label-lg fig-mono" x="292" y="122" text-anchor="middle">5</text>',
  ].join(''),
};

// Worked examples for the teaching screens. Each uses other names and values than the questions after it.
const bagExample = py`
  bag = {"apples": 3}
  bag["plums"] = 8
  bag["apples"] = bag["apples"] + 1
  print(bag)
  print(len(bag))
`;

const agesExample = py`
  ages = {"Ana": 31, "Bo": 25}
  for name in ages:
      print(name, ages[name])
`;

const MENUS = [
  ['tea', 'cake', 'juice', 'soup'],
  ['pen', 'ruler', 'glue', 'tape'],
  ['bus', 'tram', 'ferry', 'train'],
];

export default {
  id: 'dictionaries',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Not a position, a name',
      text: 'Curly brackets make a **dictionary**. Instead of a position, each value gets a label of its own. **What does this program print?**',
      figure: listing(prices),
      shuffle: false,
      options: [
        { text: '`pear`' },
        { text: '`5`', correct: true },
        { text: '`1`' },
        { text: 'An error' },
      ],
      explain: '`5`. The program asks the dictionary: what is stored under `"pear"`? No counting from 0 this time. You look a value up by its label, the way you look up a word in a real dictionary.',
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Try it',
      text: [
        'Change the word in the square brackets and press **Run**.',
        'Your goal: make the program print the price of an apple. On the way, be curious. What happens with `"plum"`?',
      ].join('\n\n'),
      widget: { type: 'py-run', code: prices },
      check: (s) => {
        if (!s.runs) return 'Change the word in the brackets, then press Run.';
        if (s.error === 'KeyError') return 'The dictionary has nothing stored under that label. Ask for one it knows: `"apple"`.';
        if (s.error) return 'The program stopped with an error. Read the message, fix the line and run it again.';
        return s.stdout.trim() === '3' || 'Not the price of an apple yet. Put `"apple"` in the square brackets, with its quotes.';
      },
      solution: { code: 'prices = {"apple": 3, "pear": 5}\nprint(prices["apple"])' },
      explain: '`prices["apple"]` is 3. Asking for a label that is not there, such as `"plum"`, stops the program with a **KeyError**. The spelling has to match exactly: `"Apple"` would fail too.',
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Keys and values',
      text: [
        'A dictionary stores **pairs**. The label is called the **key**, and what it leads to is the **value**.',
        '- `prices["pear"]` looks up the value stored under a key: here `5`.\n- A key that is not there stops the program with a KeyError. The spelling has to match exactly.\n- `"pear" in prices` asks whether a key exists. Here the answer is `True`; for `"plum" in prices` it is `False`.',
        ':::note\nA key can appear only once. That is the point: one key, one answer.\n:::',
      ].join('\n\n'),
      figure: { ...dictFigure, caption: 'prices = {"apple": 3, "pear": 5}' },
    },
    {
      id: 'in-check',
      type: 'choice',
      title: 'Ask before you look',
      text: 'Looking up a missing key stops the program. This one checks first. **What does it print?**',
      figure: listing(py`
        ages = {"Ana": 31, "Bo": 25}
        if "Cy" in ages:
            print(ages["Cy"])
        else:
            print("unknown")
      `),
      options: [
        { text: '`unknown`', correct: true },
        { text: 'A KeyError', why: 'The lookup on line 3 never runs: the `if` on line 2 is False, so Python goes to the `else`.' },
        { text: '`Cy`', why: 'Nothing prints the key itself. And `"Cy"` is not in the dictionary.' },
        { text: '`None`', why: 'Line 3 is skipped. The `else` branch prints the text `unknown`.' },
      ],
      explain: [
        '`"Cy" in ages` is `False`, so the lookup is skipped and the `else` branch runs.',
        'There is a shortcut for this pattern: `ages.get("Cy", 0)` gives the value if the key exists, and the fallback `0` if it does not. No error either way.',
      ].join('\n\n'),
    },
    {
      id: 'example-change-dict',
      type: 'info',
      title: 'A dictionary can change',
      text: [
        'Storing uses the same square brackets as looking up.',
        '- `bag["plums"] = 8` uses a key that is **new**, so a pair is **added**.\n- If the key is already there, its value is **replaced**. A key never appears twice.\n- `len(bag)` is the number of pairs.',
        ':::example\nLine 3 reads from the right, as always. It looks up the 3 under `"apples"`, adds 1, and stores 4 back under the same key. The dictionary still has two pairs, so line 5 prints `2`.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: bagExample, alt: 'A five-line program in an editor that adds a pair to a dictionary and raises one value. Its output: the dictionary with apples 4 and plums 8, then 2.' },
    },
    {
      id: 'update',
      type: 'choice',
      text: 'A dictionary can change while the program runs. **What does this one print?**',
      figure: listing(py`
        stock = {"pens": 4, "cups": 2}
        stock["cups"] = stock["cups"] + 5
        stock["mugs"] = 1
        print(len(stock), stock["cups"])
      `),
      options: [
        { text: '`3 7`', correct: true },
        { text: '`2 7`', why: '`"mugs"` was not in the dictionary, so line 3 adds a third pair.' },
        { text: '`4 7`', why: 'Line 2 changes the value under a key that is already there. It does not add a pair.' },
        { text: '`3 5`', why: 'Line 2 adds 5 to the 2 that was stored under `"cups"`.' },
      ],
      explain: 'Line 2 reads the value under `"cups"`, adds 5 and stores 7 back under the same key. Line 3 uses a key that is new, so the dictionary grows to three pairs.',
    },
    {
      id: 'lookup-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const names = rng.pick(MENUS);
        const [a, b, c] = rng.sample(names, 3);
        const [va, vb, vc] = rng.sample([2, 3, 4, 5, 6, 7, 8, 9], 3);
        const kind = rng.pick(['sum', 'replace', 'count']);
        if (kind === 'sum') {
          const code = py`
            cost = {"${a}": ${va}, "${b}": ${vb}, "${c}": ${vc}}
            print(cost["${a}"] + cost["${c}"])
          `;
          const answer = Number(out(code));
          return {
            text: 'What does this program print?',
            figure: listing(code),
            answer,
            wrong: [[va + vb, `The second lookup asks for \`"${c}"\`, not for the pair that comes second.`], [va + vb + vc, 'Only two of the three values are looked up.']].filter(([v]) => v !== answer),
            hints: [`Look up each key on its own: what is stored under \`"${a}"\`?`],
            explain: `\`cost["${a}"]\` is ${va} and \`cost["${c}"]\` is ${vc}. Together: **${answer}**.`,
          };
        }
        if (kind === 'replace') {
          const add = rng.int(2, 5);
          const code = py`
            cost = {"${a}": ${va}, "${b}": ${vb}}
            cost["${b}"] = cost["${b}"] + ${add}
            cost["${b}"] = cost["${b}"] + ${add}
            print(cost["${b}"])
          `;
          const answer = Number(out(code));
          return {
            text: 'What does this program print?',
            figure: listing(code),
            answer,
            wrong: [[vb + add, 'That is the value after line 2. Line 3 adds to it once more.'], [vb, 'Lines 2 and 3 each store a new value under the key.']],
            hints: [`After line 2, the value under \`"${b}"\` is ${vb + add}. Line 3 starts from there.`],
            explain: `The value under \`"${b}"\` starts at ${vb}, becomes ${vb + add} on line 2 and **${answer}** on line 3. Each assignment replaces what was stored before.`,
          };
        }
        const code = py`
          cost = {"${a}": ${va}, "${b}": ${vb}}
          cost["${c}"] = ${vc}
          cost["${a}"] = ${vc}
          print(len(cost))
        `;
        const answer = Number(out(code));
        return {
          text: 'What does this program print?',
          figure: listing(code),
          answer,
          wrong: [[4, `Line 3 uses the key \`"${a}"\`, which is already there. It replaces a value and adds nothing.`], [2, `Line 2 uses a key that is new, so it adds a pair.`]],
          hints: ['Which of lines 2 and 3 uses a key that the dictionary does not have yet?'],
          explain: `Line 2 adds a pair, because \`"${c}"\` is a new key. Line 3 only replaces the value under \`"${a}"\`. That makes **3** pairs.`,
        };
      },
    },
    {
      id: 'watch-tally',
      type: 'interact',
      graded: false,
      title: 'Counting things',
      text: [
        'This is the most useful dictionary program there is: it counts how often each thing appears. `counts = {}` starts with an empty dictionary.',
        'For each colour there are two cases. If it is already a key, add 1 to its value. Otherwise it is new: store it with a 1.',
        'Step through it and watch `counts` grow. **What is different the second time it meets `"red"`?**',
      ].join('\n\n'),
      widget: tracer(tally),
      check: reachedEnd('Keep pressing Step until the program has finished.'),
      solution: { done: true },
      explain: 'The first time a colour appears, it is not in `counts` yet, so the `else` branch stores it with a 1. The second `"red"` is already a key, so the `if` branch adds 1 to its value instead.',
    },
    {
      id: 'code-tally',
      type: 'code',
      title: 'Your turn: count the letters',
      text: [
        'This program should count how often each letter appears in a word. At the moment it stores a 1 for every letter, however often it comes up.',
        'Fix the loop. For `"banana"` it should print `{\'b\': 1, \'a\': 3, \'n\': 2}`. The checker replaces the word on line 1 to try others.',
      ].join('\n\n'),
      starter: py`
        word = "banana"
        counts = {}
        for letter in word:
            counts[letter] = 1
        print(counts)
      `,
      solution: py`
        word = "banana"
        counts = {}
        for letter in word:
            if letter in counts:
                counts[letter] = counts[letter] + 1
            else:
                counts[letter] = 1
        print(counts)
      `,
      rows: 9,
      tests: [
        { set: { word: 'banana' }, stdout: "{'b': 1, 'a': 3, 'n': 2}" },
        { set: { word: 'noon' }, stdout: "{'n': 2, 'o': 2}" },
        { set: { word: 'a' }, stdout: "{'a': 1}" },
      ],
      wrong: [
        ["{'b': 1, 'a': 1, 'n': 1}", 'Every letter still gets a 1. When a letter is already in `counts`, add 1 to the value that is there.'],
      ],
      hints: [
        'Two cases, as in the colour counter: is this letter already a key of `counts`, or not?',
        'If it is: `counts[letter] = counts[letter] + 1`. Otherwise: `counts[letter] = 1`.',
      ],
      explain: 'A letter that is already a key gets its value raised by 1, and a new letter starts at 1. The same few lines can count words in a book or votes in an election. (`counts[letter] = counts.get(letter, 0) + 1` does both cases in one line.)',
    },
    {
      id: 'teach-for-dict',
      type: 'info',
      title: 'A loop over a dictionary',
      text: [
        'A `for` loop over a dictionary visits its **keys**, one after another. To get the value that belongs to the current key, look it up inside the loop.',
        ':::example\nOn the first pass `name` is `"Ana"`, so `ages[name]` is 31. On the second pass `name` is `"Bo"`, and `ages[name]` is 25.\n:::',
      ].join('\n\n'),
      figure: { type: 'py-run', autorun: true, code: agesExample, alt: 'A three-line program in an editor: a for loop over a dictionary prints each key with its value. Its output: Ana 31, then Bo 25.' },
    },
    {
      id: 'loop-total',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const names = rng.sample(rng.pick(MENUS), 3);
        const values = rng.sample([2, 3, 4, 5, 6, 7, 8, 9], 3);
        const code = py`
          cost = {"${names[0]}": ${values[0]}, "${names[1]}": ${values[1]}, "${names[2]}": ${values[2]}}
          total = 0
          for item in cost:
              total = total + cost[item]
          print(total)
        `;
        const answer = Number(out(code));
        return {
          title: 'Walking through a dictionary',
          text: 'A `for` loop over a dictionary visits its **keys**, one after another. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: [[3, 'That is the number of keys. The loop adds up the *values* stored under them.'], [values[2], 'That is only the last value. `total` keeps everything that was added before.']].filter(([v]) => v !== answer),
          hints: [`On the first pass, \`item\` is \`"${names[0]}"\`, so \`cost[item]\` is ${values[0]}.`],
          explain: `\`item\` is each key in turn, and \`cost[item]\` is the value under it: ${values.join(' + ')} = **${answer}**.`,
        };
      },
    },
    {
      id: 'code-price',
      type: 'code',
      title: 'A function that looks things up',
      text: [
        'Write `price_of(menu, item)` so that it **returns** the price stored under `item`.',
        'If the item is not on the menu, it should return `0` instead of stopping with an error.',
      ].join('\n\n'),
      starter: py`
        def price_of(menu, item):
            return menu[item]

        print(price_of({"tea": 2, "cake": 4}, "cake"))
      `,
      solution: py`
        def price_of(menu, item):
            if item in menu:
                return menu[item]
            return 0

        print(price_of({"tea": 2, "cake": 4}, "cake"))
      `,
      rows: 8,
      tests: [
        { call: 'price_of({"tea": 2, "cake": 4}, "cake")', expect: 4 },
        { call: 'price_of({"tea": 2, "cake": 4}, "soup")', expect: 0 },
        { call: 'price_of({}, "tea")', expect: 0 },
      ],
      hidden: [{ call: 'price_of({"soup": 0, "pie": 6}, "pie")', expect: 6 }],
      hints: ['Ask first: `if item in menu:`.', 'Inside the `if`, return `menu[item]`. After it, `return 0`.'],
      explain: 'The function checks that the key exists before it looks it up. `return menu.get(item, 0)` is the one-line version of the same idea.',
    },
    {
      id: 'list-or-dict',
      type: 'bucket',
      review: true,
      title: 'List or dictionary?',
      text: 'Which one fits? Use a **list** when the order matters and you go through the items one by one. Use a **dictionary** when you look things up by a label.',
      buckets: ['List', 'Dictionary'],
      items: [
        { text: 'The steps of a recipe', bucket: 0, why: 'What matters is the order: first, second, third.' },
        { text: 'The phone number of each of your contacts', bucket: 1, why: 'You look a number up by a name. The name is the key.' },
        { text: 'The temperature at each hour of one day', bucket: 0, why: 'A row of values in order. Position 0 is the first hour.' },
        { text: 'How many times each word appears in a book', bucket: 1, why: 'Each word is a key, and its count is the value.' },
        { text: 'The capital city of each country', bucket: 1, why: 'You look up a capital by the name of its country.' },
        { text: 'The people waiting in a queue', bucket: 0, why: 'A queue is all about order: who is first, who is next.' },
      ],
      explain: 'A list answers "what is at position 3?". A dictionary answers "what belongs to this name?". Many programs use both: for example, a list of dictionaries, one per person.',
    },
    {
      id: 'case-trap',
      type: 'choice',
      review: true,
      title: 'Almost the same key',
      text: 'Look closely at line 2. **What does this program print?**',
      figure: listing(py`
        ages = {"Ana": 31}
        ages["ana"] = 40
        print(len(ages))
      `),
      options: [
        { text: '`2`', correct: true },
        { text: '`1`', why: '`"ana"` and `"Ana"` are different strings, so line 2 adds a second pair instead of replacing the first.' },
        { text: '`40`', why: 'The program prints `len(ages)`, the number of pairs, not a value.' },
        { text: 'An error', why: 'Storing under a new key is never an error. It adds a pair.' },
      ],
      explain: 'To Python, `"ana"` and `"Ana"` have nothing to do with each other: capital and small letters are different characters. So the dictionary now has two pairs, and `ages["Ana"]` is still 31. Bugs like this are common when keys are typed by people.',
    },
    {
      id: 'code-best',
      type: 'code',
      stretch: true,
      title: 'Who is in the lead?',
      text: [
        'Finish the program so that it prints the **name** with the highest score. Scores are never negative, and there are no ties. (`pass` means "do nothing": replace it with your own lines.)',
        'It is the search from the lists lesson again. This time you have to remember two things: the best score so far, and whose it is.',
      ].join('\n\n'),
      starter: py`
        scores = {"Ana": 7, "Bo": 9, "Cy": 4}
        best = ""
        top = -1
        for name in scores:
            pass
        print(best)
      `,
      solution: py`
        scores = {"Ana": 7, "Bo": 9, "Cy": 4}
        best = ""
        top = -1
        for name in scores:
            if scores[name] > top:
                top = scores[name]
                best = name
        print(best)
      `,
      rows: 9,
      tests: [
        { set: { scores: { Ana: 7, Bo: 9, Cy: 4 } }, stdout: 'Bo' },
        { set: { scores: { Ana: 3, Bo: 1 } }, stdout: 'Ana' },
        { set: { scores: { Zed: 0 } }, stdout: 'Zed' },
      ],
      hidden: [{ set: { scores: { Kim: 2, Lee: 5, May: 8 } }, stdout: 'May' }],
      wrong: [
        ['Cy', 'That is the last name the loop visits. Change `best` only when a score beats `top`.'],
        ['9', 'That is the highest score. The program should print the name it belongs to.'],
      ],
      hints: [
        '`scores[name]` is the score of the person the loop is looking at.',
        'If that score is greater than `top`, update both: `top = scores[name]` and `best = name`.',
      ],
      explain: '`top` remembers the best score seen so far and `best` remembers whose it is. Both change together, and only when a higher score comes along. Starting `top` at -1 makes sure the first person always takes the lead.',
    },
  ],
  recap: [
    'A dictionary stores pairs: a **key** and the **value** it leads to. `d[key]` looks a value up.',
    '`d[key] = value` adds a pair, or replaces the value if the key is already there.',
    'A missing key is a KeyError. Check with `key in d` first, or use `d.get(key, fallback)`.',
    '`for key in d` visits every key. With an `if`, that is how programs count, total and search by name.',
  ],
  next: 'Next: what to do when a program goes wrong.',
};
