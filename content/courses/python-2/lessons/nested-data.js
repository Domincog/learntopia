// Python II: Building Programs · Lesson 3 · Data Inside Data
import { py, out, listing, tracer, reachedEnd, lit, gridFigure } from '../helpers.js';

const hook = py`
  grid = [
      [5, 1, 8],
      [7, 3, 9],
  ]
  print(grid[1][0])
`;

// The grid of the "tap the cell" step: 3 rows, 4 columns.
const BOARD = [
  [4, 9, 2, 7],
  [3, 5, 8, 1],
  [6, 0, 7, 4],
];
const boardCode = `grid = [\n${BOARD.map((row) => `    ${lit(row)},`).join('\n')}\n]`;
const TARGET = { r: 2, c: 1 };
const COLS = BOARD[0].length;

const shared = py`
  grid = [[0] * 3] * 2
  grid[0][0] = 5
  print(grid)
`;

const pets = py`
  pets = [
      {"name": "Rex", "kind": "dog", "age": 3},
      {"name": "Tom", "kind": "cat", "age": 5},
  ]
  print(pets[1]["name"])
`;

const grouping = py`
  groups = {}
  for word in ["ant", "bee", "ape"]:
      key = word[0]
      if key not in groups:
          groups[key] = []
      groups[key].append(word)
  print(groups)
`;

// Worked examples for the teaching screens: each runs in the editor, with its output showing.
const HOOK_GRID = [[5, 1, 8], [7, 3, 9]];

const walking = py`
  grid = [
      [4, 9],
      [3, 5],
  ]
  print(sum(grid[1]))
  for row in grid:
      print(row[0])
  for row in grid:
      for cell in row:
          print(cell)
`;

const sharedRows = py`
  row = [0, 0]
  shared = [row] * 2
  shared[0][0] = 7
  print(shared)

  separate = []
  for r in range(2):
      separate.append([0, 0])
  separate[0][0] = 7
  print(separate)
`;

const trips = py`
  trips = [
      {"city": "Oslo", "days": 3},
      {"city": "Rome", "days": 5},
      {"city": "Lima", "days": 2},
  ]
  for trip in trips:
      if trip["days"] > 2:
          print(trip["city"])
`;

/** A program in the editor that has already been run: the code and what it prints. */
const example = (code, alt) => ({ type: 'py-run', autorun: true, code, alt });

// "Tap the neighbours": a 3 x 4 board with a star on the right-hand edge.
const STAR = { r: 1, c: 3, rows: 3, cols: 4 };
const starIndex = STAR.r * STAR.cols + STAR.c;
const touches = (i) => {
  const r = Math.floor(i / STAR.cols);
  const c = i % STAR.cols;
  return i !== starIndex && Math.abs(r - STAR.r) <= 1 && Math.abs(c - STAR.c) <= 1;
};
const besideOrAbove = (i) => touches(i) && (Math.floor(i / STAR.cols) === STAR.r || i % STAR.cols === STAR.c);
const NEIGHBOURS = Array.from({ length: STAR.rows * STAR.cols }, (_, i) => i).filter(touches);

const TEAM = '[{"name": "Ana", "score": 7}, {"name": "Bo", "score": 9}, {"name": "Cy", "score": 4}]';

const PET_NAMES = ['Rex', 'Tom', 'Fay', 'Kit', 'Max', 'Lou', 'Sky', 'Bea'];

/** Anticipated wrong answers: drop any that equal the answer or share a value with another entry. */
const slips = (answer, entries) => entries.filter(([v], i, all) => v !== answer && all.filter(([u]) => u === v).length === 1);
const sum = (list) => list.reduce((a, b) => a + b, 0);
const listOf = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

export default {
  id: 'nested-data',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A list of lists',
      text: 'A list can hold anything, even other lists. This one holds two. **What do you think the program prints?**',
      figure: listing(hook),
      options: [
        { text: '`7`', correct: true },
        { text: '`1`' },
        { text: '`5`' },
        { text: '`[7, 3, 9]`' },
      ],
      explain: `\`${out(hook)}\`. \`grid[1]\` is the second item of the outer list: the whole row \`${lit(HOOK_GRID[1])}\`. Then \`[0]\` takes the first item of that row.`,
    },
    {
      id: 'teach-grid',
      type: 'info',
      title: 'Rows inside a list',
      text: [
        'A list of lists like this is a **grid**: rows and columns, like a spreadsheet, a game board or the pixels of a picture. Each inner list is one **row**.',
        `Read the square brackets one pair at a time.\n\n- \`grid[0]\` is the first item of the outer list: the whole row \`${lit(HOOK_GRID[0])}\`.\n- \`grid[0][2]\` then takes the item at index 2 **of that row**: ${HOOK_GRID[0][2]}.`,
        ':::key\nThe row first, then the place in that row. Both are counted from 0.\n:::',
      ].join('\n\n'),
      figure: {
        ...gridFigure(HOOK_GRID, {
          mark: [[0, 2]],
          alt: 'The grid of the program drawn as two rows of three cells, with row numbers 0 and 1 down the left side and column numbers 0 to 2 along the top. The cell in row 0, column 2 is highlighted. It holds 8.',
        }),
        caption: `grid[0][2] is ${HOOK_GRID[0][2]}`,
      },
    },
    {
      id: 'tap-cell',
      type: 'interact',
      title: 'Find the cell',
      text: [
        'Here is a bigger grid, drawn as a board. The numbers down the left side count the rows, and the numbers along the top count the columns.',
        '**Tap the cell that `grid[2][1]` picks out.** Which comes first: the row or the column?',
      ].join('\n\n'),
      figure: listing(boardCode),
      widget: {
        type: 'grid', rows: BOARD.length, cols: COLS, labels: BOARD.flat(), cell: 52, counter: false,
        // Short row labels on purpose: the grid widget centres the column labels over rows AND labels, so long row labels push them off their columns.
        rowLabels: BOARD.map((_, r) => String(r)), colLabels: BOARD[0].map((_, c) => String(c)),
        alt: 'A board of three rows and four columns of numbers. The rows are numbered 0 to 2 down the left side and the columns 0 to 3 along the top.',
      },
      check: (s) => {
        if (s.on.length === 0) return 'Tap a cell on the board.';
        if (s.on.length > 1) return 'Select just one cell. Tap a selected cell again to clear it.';
        const r = Math.floor(s.on[0] / COLS);
        const c = s.on[0] % COLS;
        if (r === TARGET.r && c === TARGET.c) return true;
        if (r === TARGET.c && c === TARGET.r) return `That is \`grid[${r}][${c}]\`. The **first** index chooses the row; the second chooses the place in that row.`;
        if (r === TARGET.r) return `Right row. Now count along it from 0: \`[${TARGET.c}]\` is the second cell.`;
        if (c === TARGET.c) return `Right column, wrong row. Rows are counted from 0 too, so \`grid[${TARGET.r}]\` is the third row.`;
        return `Not that one. \`grid[${TARGET.r}]\` is the row with index ${TARGET.r}; then \`[${TARGET.c}]\` picks a cell in that row.`;
      },
      solution: { on: [TARGET.r * COLS + TARGET.c] },
      hints: ['`grid[2]` on its own is a whole row. Which one?', 'It is the bottom row, `[6, 0, 7, 4]`. Now take the item at index 1 of that row.'],
      explain: `\`grid[2]\` is the row \`${lit(BOARD[TARGET.r])}\`, and \`[1]\` is its second item: \`${BOARD[TARGET.r][TARGET.c]}\`. **Row first, then column.** Programmers often write it as \`grid[r][c]\`.`,
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Rows, then columns',
      text: [
        `- A grid is a list of **rows**, and every row is a list.\n- \`len(grid)\` is the number of rows: here ${BOARD.length}. \`len(grid[0])\` is the number of columns: here ${COLS}.\n- \`grid[r][c]\` is the cell in row \`r\`, column \`c\`. \`grid[r][c] = 0\` replaces it.\n- \`grid[${TARGET.r}]\` on its own is a whole row: the ordinary list \`${lit(BOARD[TARGET.r])}\`.`,
      ].join('\n\n'),
      figure: {
        ...gridFigure(BOARD, {
          mark: [[TARGET.r, TARGET.c]],
          alt: 'The grid drawn as three rows of four cells, with row numbers 0 to 2 down the left side and column numbers 0 to 3 along the top. The cell in row 2, column 1 is highlighted. It holds 0.',
        }),
        caption: `grid[${TARGET.r}][${TARGET.c}] is ${BOARD[TARGET.r][TARGET.c]}`,
      },
    },
    {
      id: 'example-rows',
      type: 'info',
      title: 'Walking through a grid',
      text: [
        'Because a row is an ordinary list, everything you know about lists works on it. And a `for` loop over the grid hands out **one whole row** per pass.',
        ':::example\n- Line 5: `grid[1]` is the row `[3, 5]`, and `sum` adds up its items: 8.\n- Lines 6 and 7: `row[0]` takes the first item of each row, 4 and then 3. That walks down a **column**.\n- Lines 8 to 10: a loop inside a loop visits **every cell**. The outer loop takes the rows in turn, the inner one walks along each row: 4, 9, 3, 5.\n:::',
      ].join('\n\n'),
      figure: example(walking, 'A ten-line program in an editor with a grid of two rows and two columns. It prints the sum of one row, then the first item of each row, then every cell. Its output: 8, then 4 and 3, then 4, 9, 3, 5.'),
    },
    {
      id: 'grid-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const rows = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)];
        const column = (c) => rows.map((row) => row[c]);
        const head = `grid = [\n${rows.map((row) => `    ${lit(row)},`).join('\n')}\n]`;
        const kind = rng.pick(['cells', 'row', 'col']);
        if (kind === 'cells') {
          const cells = rng.sample([[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]], 2);
          const [[r1, c1], [r2, c2]] = cells;
          const code = `${head}\nprint(grid[${r1}][${c1}] + grid[${r2}][${c2}])`;
          const answer = Number(out(code));
          return {
            text: 'What does this program print?',
            figure: listing(code),
            answer,
            wrong: slips(answer, [[rows[c1][r1] + rows[c2][r2], 'The **first** index picks the row, and the second picks the place in that row. You read them the other way round.']]),
            hints: [`\`grid[${r1}]\` is the row \`${lit(rows[r1])}\`. Take the item at index ${c1} of that row.`],
            explain: `\`grid[${r1}][${c1}]\` is ${rows[r1][c1]} (row ${r1}, position ${c1}) and \`grid[${r2}][${c2}]\` is ${rows[r2][c2]} (row ${r2}, position ${c2}). Together: **${answer}**.`,
          };
        }
        if (kind === 'row') {
          const r = rng.int(0, 2);
          const code = `${head}\nprint(sum(grid[${r}]))`;
          const answer = Number(out(code));
          return {
            text: 'What does this program print?',
            figure: listing(code),
            answer,
            wrong: slips(answer, [
              [sum(column(r)), `That is the total of a **column**. \`grid[${r}]\` is a whole row: \`${lit(rows[r])}\`.`],
              [45, `That adds up every cell. \`grid[${r}]\` is just one row.`],
            ]),
            hints: [`\`grid[${r}]\` is one item of the outer list. Rows are counted from 0.`],
            explain: `\`grid[${r}]\` is the row \`${lit(rows[r])}\`, and \`sum\` adds up its items: ${rows[r].join(' + ')} = **${answer}**.`,
          };
        }
        const c = rng.int(0, 2);
        const code = `${head}\ntotal = 0\nfor row in grid:\n    total = total + row[${c}]\nprint(total)`;
        const answer = Number(out(code));
        return {
          text: 'What does this program print?',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            [sum(rows[c]), `That is the total of row ${c}. The loop takes the item at position ${c} from **every** row: a column.`],
            [45, `That adds up every cell. Each pass adds just one: the item at position ${c} of the current row.`],
          ]),
          hints: ['On each pass, `row` is one whole row of the grid.', `\`row[${c}]\` is the item at position ${c} of that row. The first pass adds ${rows[0][c]}.`],
          explain: `The loop visits the rows one at a time and takes the item at position ${c} from each: ${column(c).join(' + ')} = **${answer}**. That adds up a **column**.`,
        };
      },
    },
    {
      id: 'teach-shared-rows',
      type: 'info',
      title: 'The same row, twice',
      text: [
        '`*` repeats a list: `[0] * 3` is `[0, 0, 0]`. Repeating numbers is harmless. Repeating a **row** is not, because nothing is copied: `[row] * 2` holds the **same** list twice. In the first course, `b = a` gave one list two names. This is that trap in disguise.',
        ':::example\nLine 3 changes one cell, and line 4 shows the 7 in both rows: they are one list. The loop on lines 7 and 8 makes a **new** `[0, 0]` on every pass, so the rows of `separate` are lists of their own.\n:::',
      ].join('\n\n'),
      figure: example(sharedRows, 'A ten-line program in an editor that builds one grid by repeating a row and another by appending a new row in a loop, then changes one cell of each. Its output: 7 in both rows of the first grid, 7 in only the first row of the second.'),
    },
    {
      id: 'alias-trap',
      type: 'choice',
      review: true,
      title: 'A grid of zeros?',
      text: '`[0] * 3` makes the row `[0, 0, 0]`. Line 1 then asks for that row twice, and line 2 changes **one** cell. **What does the program print?**',
      figure: listing(shared),
      options: [
        { text: '`[[5, 0, 0], [5, 0, 0]]`', correct: true },
        { text: '`[[5, 0, 0], [0, 0, 0]]`', why: 'That is what its author wanted. But the outer `* 2` did not build two rows: it put the **same** row into the grid twice.' },
        { text: '`[[5, 5, 5], [0, 0, 0]]`', why: 'Line 2 changes a single cell, `grid[0][0]`, not a whole row.' },
        { text: 'An error', why: 'No error. The program runs, and prints something its author did not intend.' },
      ],
      columns: 1,
      explain: [
        `It prints \`${out(shared)}\`. The outer \`* 2\` copies nothing: it makes a list that holds **the same row twice**. In the first course, \`b = a\` gave one list two names. This is the same trap in disguise.`,
        'Change the row through `grid[0]`, and `grid[1]` shows the change too. The cure is to build every row separately, in a loop.',
      ].join('\n\n'),
    },
    {
      id: 'code-rows',
      type: 'code',
      title: 'Give every row its own list',
      text: [
        'This program should build a grid of zeros with `rows` rows and `cols` columns, and then put a single 5 in the top-left corner.',
        'Press **Run**: the 5 turns up in every row. **Change the way the grid is built**, so that each row is a list of its own.',
      ].join('\n\n'),
      starter: py`
        rows = 2
        cols = 3
        grid = [[0] * cols] * rows
        grid[0][0] = 5
        print(grid)
      `,
      solution: py`
        rows = 2
        cols = 3
        grid = []
        for r in range(rows):
            grid.append([0] * cols)
        grid[0][0] = 5
        print(grid)
      `,
      rows: 8,
      tests: [
        { set: { rows: 2, cols: 3 }, stdout: '[[5, 0, 0], [0, 0, 0]]' },
        { set: { rows: 3, cols: 2 }, stdout: '[[5, 0], [0, 0], [0, 0]]' },
      ],
      hidden: [
        { set: { rows: 1, cols: 1 }, stdout: '[[5]]' },
        { set: { rows: 4, cols: 1 }, stdout: '[[5], [0], [0], [0]]' },
        { set: { rows: 3, cols: 2 }, call: 'grid[1] is grid[2]', expect: false, message: 'The output is right, but some of the rows are still one and the same list. Build **every** row separately, inside a loop.' },
      ],
      wrong: [
        ['[[5, 0, 0], [5, 0, 0]]', 'The 5 is still in both rows, so both rows are still the same list. Start with `grid = []` and append a new `[0] * cols` for each row.'],
      ],
      hints: [
        'Start with an empty grid: `grid = []`. Then add the rows one at a time.',
        '`for r in range(rows):` and, inside the loop, `grid.append([0] * cols)`. Every pass makes a **new** row.',
      ],
      explain: 'Each pass of the loop works out `[0] * cols` afresh, so every row is a different list. `[0] * cols` itself is harmless: the zeros are numbers, and numbers cannot be changed in place.',
    },
    {
      id: 'records',
      type: 'choice',
      mode: 'predict',
      title: 'Dictionaries in a list',
      text: 'Here is another way to nest: a **list of dictionaries**. Each dictionary describes one pet. **What do you think the program prints?**',
      figure: listing(pets),
      options: [
        { text: '`Tom`', correct: true },
        { text: '`Rex`' },
        { text: '`cat`' },
        { text: '`name`' },
      ],
      explain: `\`${out(pets)}\`. \`pets[1]\` is the second dictionary, and \`["name"]\` looks up the value stored under that key. The brackets are read one pair at a time, just as with a grid.`,
    },
    {
      id: 'teach-records',
      type: 'info',
      title: 'A table of records',
      text: [
        'A dictionary used like this is called a **record**: one thing, with named fields. A list of records is a **table**, like a spreadsheet with one row for each thing.',
        'A loop goes through a table one record at a time, and the loop patterns you know still apply.',
        ':::example\nOn each pass, `trip` is one whole record, and `trip["days"]` is one of its fields. The `if` lets through the trips that last more than 2 days, and the program prints their cities.\n:::',
      ].join('\n\n'),
      figure: example(trips, 'A program in an editor with a list of three dictionaries, each with a city and a number of days, and a loop that prints the cities of the trips longer than 2 days. Its output: Oslo, then Rome.'),
    },
    {
      id: 'records-total',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let kinds;
        do { kinds = [0, 1, 2, 3].map(() => rng.pick(['dog', 'cat'])); } while (new Set(kinds).size < 2);
        const names = rng.sample(PET_NAMES, 4);
        const ages = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
        const table = `pets = [\n${names.map((name, i) => `    {"name": "${name}", "kind": "${kinds[i]}", "age": ${ages[i]}},`).join('\n')}\n]`;
        if (rng.bool()) {
          const kind = rng.pick(['dog', 'cat']);
          const other = kind === 'dog' ? 'cat' : 'dog';
          const code = `${table}\ntotal = 0\nfor pet in pets:\n    if pet["kind"] == "${kind}":\n        total = total + pet["age"]\nprint(total)`;
          const answer = Number(out(code));
          const chosen = names.map((name, i) => ({ name, age: ages[i], kind: kinds[i] })).filter((p) => p.kind === kind);
          return {
            text: 'A table of records, and a loop that goes through it. **What does this program print?**',
            figure: listing(code),
            answer,
            wrong: slips(answer, [
              [sum(ages), `That adds up all four ages. The \`if\` only lets the ${kind}s through.`],
              [chosen.length, `That is how many ${kind}s there are. The loop adds up their **ages**.`],
              [sum(ages) - answer, `That is the total for the ${other}s. The \`if\` asks for \`"${kind}"\`.`],
            ]),
            hints: ['On each pass, `pet` is one whole record. `pet["kind"]` and `pet["age"]` are two of its fields.', `Which pets have the kind \`"${kind}"\`? Add up only their ages.`],
            explain: chosen.length === 1
              ? `Only one record passes the test: ${chosen[0].name}, aged ${chosen[0].age}. So the total is **${answer}**.`
              : `The records that pass the test are ${listOf(chosen.map((p) => `${p.name} (${p.age})`))}. Their ages add up to ${chosen.map((p) => p.age).join(' + ')} = **${answer}**.`,
          };
        }
        const limit = [...ages].sort((a, b) => a - b)[rng.int(0, 2)];
        const code = `${table}\ncount = 0\nfor pet in pets:\n    if pet["age"] > ${limit}:\n        count = count + 1\nprint(count)`;
        const answer = Number(out(code));
        const older = names.filter((_, i) => ages[i] > limit);
        return {
          text: 'A table of records, and a loop that goes through it. **What does this program print?**',
          figure: listing(code),
          answer,
          wrong: slips(answer, [
            answer === 3
              ? [4, `That counts every pet. But the pet aged exactly ${limit} is not **older** than ${limit}.`]
              : [4, `That counts every pet. The \`if\` only lets through the ones older than ${limit}.`],
            ...(answer === 3 ? [] : [[answer + 1, `A pet aged exactly ${limit} is not **older** than ${limit}, so it is not counted.`]]),
            [sum(ages.filter((a) => a > limit)), 'That adds up the ages. The loop adds 1 for each pet that passes the test: it counts them.'],
          ]),
          hints: ['On each pass, `pet` is one whole record, and `pet["age"]` is its age.', `For how many pets is the age greater than ${limit}?`],
          explain: `${older.length === 1 ? `Only ${older[0]} is` : `${listOf(older)} are`} older than ${limit}, so \`count\` goes up ${answer === 1 ? 'once' : `${answer} times`}: **${answer}**.`,
        };
      },
    },
    {
      id: 'code-top',
      type: 'code',
      title: 'Find the best record',
      text: [
        'Every player is a record with a `"name"` and a `"score"`. Write `top_scorer(players)`: it returns the **name** of the player with the highest score. If two players tie, the one who comes first in the list wins.',
        'The list is never empty, but scores can be any numbers, negative ones too. It is "find the best" again: remember the best **record** seen so far.',
      ].join('\n\n'),
      starter: py`
        def top_scorer(players):
            best = players[0]
            return best["name"]

        team = [{"name": "Ana", "score": 7}, {"name": "Bo", "score": 9}]
        print(top_scorer(team))
      `,
      solution: py`
        def top_scorer(players):
            best = players[0]
            for p in players:
                if p["score"] > best["score"]:
                    best = p
            return best["name"]

        team = [{"name": "Ana", "score": 7}, {"name": "Bo", "score": 9}]
        print(top_scorer(team))
      `,
      rows: 10,
      tests: [
        { call: `top_scorer(${TEAM})`, expect: 'Bo', label: 'Ana 7, Bo 9, Cy 4: the answer is "Bo"' },
        { call: 'top_scorer([{"name": "Kim", "score": 5}, {"name": "Lee", "score": 8}, {"name": "May", "score": 8}])', expect: 'Lee', label: 'Kim 5, Lee 8, May 8: the answer is "Lee"' },
        { call: 'top_scorer([{"name": "Zed", "score": 0}])', expect: 'Zed', label: 'Zed 0: the answer is "Zed"' },
      ],
      hidden: [
        { call: 'top_scorer([{"name": "Ida", "score": -3}, {"name": "Jo", "score": -1}])', expect: 'Jo', message: 'Scores can be negative: with Ida on -3 and Jo on -1, the answer is "Jo". Compare each score with the best record so far, not with a made-up starting number.' },
        { call: 'top_scorer([{"name": "Uma", "score": 6}, {"name": "Vic", "score": 2}, {"name": "Wes", "score": 6}])', expect: 'Uma' },
        { call: 'top_scorer([{"name": "Pat", "score": 1}, {"name": "Quin", "score": 2}, {"name": "Ray", "score": 3}])', expect: 'Ray' },
        { call: 'top_scorer([{"name": "Ned", "score": -500}, {"name": "Oz", "score": -200}])', expect: 'Oz' },
      ],
      hints: [
        'Loop over the players. `p["score"]` is the score of the one you are looking at; `best["score"]` is the score to beat.',
        '`if p["score"] > best["score"]:` then `best = p`. Use `>`, so that a later player with the same score does not take over.',
      ],
      explain: '`best` holds a whole record, so the score to beat and the name to return travel together. Starting from `players[0]` means there is no need to invent a starting score, and `>` lets the earlier player keep the title in a tie.',
    },
    {
      id: 'watch-group',
      type: 'interact',
      graded: false,
      title: 'A dictionary of lists',
      text: [
        'One more shape: a dictionary whose **values are lists**. This program files each word under its first letter. Line 4 asks whether that letter is **not** yet a key: `not in` is the opposite of `in`.',
        'Step through it and watch `groups`. **What is different the second time a word starts with `a`?**',
      ].join('\n\n'),
      widget: tracer(grouping),
      check: reachedEnd(),
      solution: { done: true },
      explain: [
        `The first time a letter turns up, line 5 gives it an empty list of its own. After that, line 6 appends to the list that is already there. The result: \`${out(grouping)}\`.`,
        'It is the counting pattern from the dictionaries lesson, with a list where the number used to be. This is called **grouping**.',
      ].join('\n\n'),
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Now from memory. Arrange the lines into a function that files words under their first letter: `by_letter(["ant", "bee", "ape"])` should give `{\'a\': [\'ant\', \'ape\'], \'b\': [\'bee\']}`.',
      items: [
        'def by_letter(words):',
        '    groups = {}',
        '    for w in words:',
        '        if w[0] not in groups:',
        '            groups[w[0]] = []',
        '        groups[w[0]].append(w)',
        '    return groups',
      ],
      hints: ['Before a word can be appended, its letter needs a list to append to.', 'The `append` line is not inside the `if`: it runs for every word.'],
      explain: 'Two cases, as always with a dictionary that is being built: a key that is new gets an empty list first; then the word is appended, whether the list is new or old.',
    },
    {
      id: 'tap-neighbours',
      type: 'interact',
      title: 'Who is next door?',
      text: [
        'In many grid programs a cell has to look at its **neighbours**: the cells that touch it, corners included. A cell in the middle of a big grid has eight.',
        '**Tap every neighbour of the cell marked ★.**',
      ].join('\n\n'),
      widget: {
        type: 'grid', rows: STAR.rows, cols: STAR.cols, cell: 52, counter: 'Selected', indexBase: 0,
        labels: Array.from({ length: STAR.rows * STAR.cols }, (_, i) => (i === starIndex ? '★' : '')),
        alt: 'A board of three rows and four columns. The cell at the right-hand end of the middle row is marked with a star.',
      },
      check: (s) => {
        if (s.on.includes(starIndex)) return 'Leave ★ itself out: a cell is not its own neighbour.';
        if (s.on.some((i) => !touches(i))) return 'One of your cells does not touch ★. A neighbour is at most one row and one column away.';
        if (s.on.length === NEIGHBOURS.length) return true;
        if (NEIGHBOURS.filter(besideOrAbove).every((i) => s.on.includes(i))) return 'Cells that touch ★ only at a corner count as neighbours too.';
        return 'There are more. Look at the row above ★, the row below it, and the cell beside it.';
      },
      solution: { on: NEIGHBOURS },
      explain: [
        `Only **${NEIGHBOURS.length}**. The ★ sits on the right-hand edge, so the three cells that would lie to its right do not exist. A cell in a corner has just three neighbours.`,
        'A program that looks at neighbours has to stay inside the grid, or it will ask for cells that are not there.',
      ].join('\n\n'),
    },
    {
      id: 'code-neighbours',
      type: 'code',
      stretch: true,
      title: 'Count the neighbours',
      text: [
        'In this grid a 1 is a lamp that is on. Write `neighbours(grid, r, c)`: it returns how many of the up to eight cells **around** row `r`, column `c` are on.',
        'The starter adds up the whole 3 × 3 block around the cell. Two tests are missing: skip positions outside the grid (rows run from 0 to `len(grid) - 1`, columns from 0 to `len(grid[0]) - 1`), and do not count the cell itself. Keep the `lamps` line: the checks use it.',
      ].join('\n\n'),
      starter: py`
        def neighbours(grid, r, c):
            count = 0
            for rr in range(r - 1, r + 2):
                for cc in range(c - 1, c + 2):
                    count = count + grid[rr][cc]
            return count

        lamps = [[1, 1, 0], [0, 1, 0], [1, 0, 1]]
        print(neighbours(lamps, 1, 1))
      `,
      solution: py`
        def neighbours(grid, r, c):
            count = 0
            for rr in range(r - 1, r + 2):
                for cc in range(c - 1, c + 2):
                    if 0 <= rr < len(grid) and 0 <= cc < len(grid[0]):
                        if rr != r or cc != c:
                            count = count + grid[rr][cc]
            return count

        lamps = [[1, 1, 0], [0, 1, 0], [1, 0, 1]]
        print(neighbours(lamps, 1, 1))
      `,
      rows: 11,
      tests: [
        { call: 'neighbours(lamps, 1, 1)', expect: 4 },
        { call: 'neighbours(lamps, 0, 0)', expect: 2 },
        { call: 'neighbours(lamps, 2, 2)', expect: 1 },
      ],
      hidden: [
        { call: 'neighbours([[1, 1, 1, 1], [1, 1, 1, 1]], 0, 3)', expect: 3, message: 'Try a grid that is not square: two rows of four lamps, all on. The corner cell in row 0, column 3 has 3 neighbours. The number of columns is `len(grid[0])`, not `len(grid)`.' },
        { call: 'neighbours([[1, 1, 1, 1], [1, 1, 1, 1]], 1, 1)', expect: 5 },
        { call: 'neighbours([[1]], 0, 0)', expect: 0 },
        { call: 'neighbours([[0, 1, 0], [1, 0, 1], [0, 1, 0]], 1, 1)', expect: 4 },
        { call: 'neighbours([[0, 0, 1], [0, 0, 0], [1, 0, 0]], 0, 0)', expect: 0 },
      ],
      hints: [
        'A position is inside the grid when `0 <= rr < len(grid)` and `0 <= cc < len(grid[0])`. Python lets you chain comparisons like that.',
        'The cell itself is the one where `rr == r and cc == c`. Add to `count` only when that is **not** the case: `if rr != r or cc != c:`.',
      ],
      explain: [
        'The two loops visit the nine positions of the 3 × 3 block. The first test throws out the positions that are off the grid, the second throws out the cell in the middle.',
        'Without the first test, a corner cell would go wrong in a sneaky way: Python does not complain about row `-1`. It quietly reads the **last** row, because a negative index counts from the end.',
      ].join('\n\n'),
    },
    {
      id: 'shapes',
      type: 'bucket',
      review: true,
      text: 'Which shape fits the data? A **list of lists** is a grid with rows and columns. A **list of dictionaries** is a table of records with named fields. A **dictionary of lists** files several things under each key.',
      buckets: ['List of lists', 'List of dictionaries', 'Dictionary of lists'],
      items: [
        { text: 'The squares of a chessboard', bucket: 0 },
        { text: 'Your contacts: a name, a number and an email for each', bucket: 1, why: 'Each contact is a record with named fields, and the contacts form a list.' },
        { text: 'For each day of the week, the jobs to do that day', bucket: 2, why: 'You look up a day, the key, and get a list of jobs.' },
        { text: 'The pixels of a small black-and-white picture', bucket: 0, why: 'Rows and columns of values: a grid.' },
        { text: 'The books in a library: title, author and year', bucket: 1 },
        { text: 'Words filed under the letter they start with', bucket: 2 },
      ],
      explain: 'Ask how you will get at the data. By row and column: a grid. One thing at a time, each with named fields: a table of records. By a key that leads to several things: a dictionary of lists.',
    },
  ],
  recap: [
    'A **grid** is a list of rows: `grid[r][c]` reads row `r`, then position `c` in it. Two nested loops visit every cell.',
    '`[[0] * 3] * 2` puts the **same** row in the grid twice. Build each row separately, in a loop.',
    'A **record** is a dictionary with named fields, and a list of records is a table. Loop over it to filter, total or find the best.',
    'A dictionary of lists **groups** things: give a new key an empty list, then append.',
  ],
  next: 'Next: your programs are getting longer. Time to split them into functions that work together.',
};
