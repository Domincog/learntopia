// Algorithms II · Lesson 1 · Try, Fail, Back Up
import { PARCELS, group, listAnd, queensFirst, queensSearch, queensTreeFigure, safeColumns, subsetFirst } from '../helpers.js';

const TREE4 = queensSearch(4);
const TREE6 = queensSearch(6);
const TREE8 = queensSearch(8);
const FIRST4 = queensFirst(4);
const FIRST6 = queensFirst(6);
const PARCEL_RUN = subsetFirst(PARCELS.items, PARCELS.target);
/** Boards of the teaching screens (columns counted from 0). The generated steps use 5 × 5 boards and bigger, never 4 × 4. */
const UNDO_BOARD = [3, 0, 2];
const CLASH_BOARD = [[0, 0], [1, 1]];
const SAFE_BOARD = [1, 3];

/** A random board on which the first `rows` rows hold queens that do not attack each other. */
function partialBoard(rng, n, rows) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const queens = [];
    while (queens.length < rows) {
      const cols = safeColumns(queens, n);
      if (!cols.length) break;
      queens.push(rng.pick(cols));
    }
    if (queens.length === rows) return queens;
  }
  throw new Error('partialBoard: no board found');
}

export default {
  id: 'backtracking',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'Four queens',
      text: `
        A chess queen attacks every square in her row, her column and her two diagonals: the crossed squares in the picture.

        The puzzle: put **4 queens on a 4 × 4 board** so that no queen attacks another. Each row needs exactly one queen, so a computer could try every way of choosing a column in each row: 4 × 4 × 4 × 4 = **256 boards**.

        How many of those 256 boards are solutions?
      `,
      figure: { type: 'queens-board', n: 5, mode: 'view', queens: [[2, 2]], alt: 'A 5 by 5 board with one queen in the middle. Every square in her row, her column and on her two diagonals is crossed out.' },
      options: [
        { text: '2', correct: true },
        { text: '8' },
        { text: '24' },
        { text: '64' },
      ],
      explain: `
        Only **${TREE4.solutions}**. Trying every possibility, one after another, is called **brute force**. Laying out 256 boards to find 2 is a lot of wasted work, and it gets worse quickly: with 8 queens there are ${group(8 ** 8)} boards and only ${TREE8.solutions} solutions.

        You are about to find a solution with far less work than that.
      `,
    },
    {
      id: 'four-queens',
      type: 'interact',
      graded: false,
      auto: true,
      attempts: 8,
      title: 'Row by row',
      text: `
        **Place the four queens, one row at a time from the top.**

        The board crosses out every square that is under attack and will not take a queen there. When a row has no square left, you are stuck: tap the last queen to take her back, and try another square for her.
      `,
      widget: { type: 'queens-board', n: 4 },
      check: (s) => s.solved || (s.stuck ? 'This row has no square left. Take back the queen above it and move her along.' : 'Keep going until all four rows hold a queen.'),
      solution: { queens: [1, 3, 0, 2] },
      hints: [
        'Being stuck is part of the method. Take back only the last queen, and move her to a square she has not tried.',
        'A queen in a corner of row 1 never works here. Try the second square.',
      ],
      explain: `
        You never laid out a hopeless board to the end. The moment a row had no square left, you undid your latest choice and tried the next one.

        Done strictly from left to right, this puts down ${FIRST4.puts} queens and takes ${FIRST4.backs} of them back before the first solution appears. Brute force would still be laying out its 256 boards, four queens each.
      `,
    },
    {
      id: 'tree',
      type: 'info',
      title: 'The search tree',
      text: `
        Every board you can pass through is one box in this picture. The lines lead from a board to the boards you get by adding a queen on a safe square of the next row.

        This is a **search tree**. A board with a red cross is a **dead end**: its next row has no safe square, so nothing below it ever needs to be looked at.

        Walking through such a tree, and turning back at every dead end, is called **backtracking**.
      `,
      figure: queensTreeFigure(),
    },
    {
      id: 'tree-count',
      type: 'fill',
      title: 'Count the work',
      text: 'Count the boards in the tree. The empty board at the top does not count.',
      figure: queensTreeFigure(),
      template: `
        The tree holds [[${TREE4.perLevel[1]}]] boards with one queen, [[${TREE4.perLevel[2]}]] with two, [[${TREE4.perLevel[3]}]] with three and [[${TREE4.perLevel[4]}]] with four.

        That makes [[${TREE4.nodes}]] boards in all, against 256 for brute force.
      `,
      hints: ['Go level by level: each level of the picture adds one queen.'],
      explain: `
        ${TREE4.perLevel.slice(1).join(' + ')} = **${TREE4.nodes} boards**, and ${TREE4.deadEnds} of them are dead ends.

        Brute force looks at 256 complete boards. Backtracking never looks at more than these ${TREE4.nodes} partial ones, because every dead end cuts off everything that would have hung below it.
      `,
    },
    {
      id: 'teach-undo-latest',
      type: 'info',
      title: 'Always undo the latest choice',
      text: `
        The search follows one routine. In each new row it tries the leftmost safe square. When a row has **no** safe square, it takes back the **latest** queen and moves her to her next safe square. If she has none left, the queen above her comes back too.

        :::example The branch that starts in row 1, column 4
        1. Row 2: column 1 is safe. Row 3: column 3. Row 4: nothing is safe (the picture).
        2. Take back the queen in row 3. She has no other safe square, so the queen in row 2 comes back as well.
        3. The queen of row 2 moves on to column 2. Now row 3 has no safe square.
        4. Row 2 has run out too. Only now does the queen in row 1 move.
        :::
      `,
      figure: { type: 'queens-board', n: 4, mode: 'view', queens: UNDO_BOARD, highlight: UNDO_BOARD.length, alt: 'A 4 by 4 board. Queens stand in row 1, column 4, in row 2, column 1 and in row 3, column 3. All four squares of row 4 are crossed out.' },
    },
    {
      id: 'what-next',
      type: 'choice',
      review: true,
      text: `
        Backtracking is solving the 4-queens puzzle row by row. Two queens are down, and every square of row 3 is under attack.

        **What does it do next?**
      `,
      figure: { type: 'queens-board', n: 4, mode: 'view', queens: [0, 2], highlight: 2, alt: 'A 4 by 4 board. Queens stand in row 1, column 1 and in row 2, column 3. All four squares of row 3 are crossed out.' },
      options: [
        { text: 'Take back the queen in row 2 and move her to the next safe square of row 2', correct: true },
        { text: 'Clear the board and start again', why: 'That throws away work that may still be good. Only the latest choice is undone first.' },
        { text: 'Take back the queen in row 1', why: 'Not yet. Row 2 still has a safe square that has not been tried: column 4.' },
        { text: 'Put a queen on an attacked square of row 3 and fix it later', why: 'A board that already breaks the rule can never grow into a solution. That is exactly why the search turns back here.' },
      ],
      explain: `
        Backtracking undoes the **most recent** choice first: the queen in row 2 moves on to her next safe square, column 4.

        Only when a row has run out of squares does the search back up one row further.
      `,
    },
    {
      id: 'teach-prune',
      type: 'info',
      title: 'What one dead end saves',
      text: `
        Brute force cannot stop early. Backtracking can, and one early stop saves a great deal.

        :::example A clash at the top of a 4 × 4 board
        The queens in rows 1 and 2 attack each other (the picture). Brute force does not notice. It still fills the other 2 rows in every possible way: 4 squares for row 3 and, for each of them, 4 squares for row 4.

        4 × 4 = **16** complete boards, every one of them useless.
        :::

        Backtracking never puts the second queen there, so it skips all 16 at once. Cutting a branch off the search tree like this is called **pruning**.
      `,
      figure: { type: 'queens-board', n: 4, mode: 'view', queens: CLASH_BOARD, alt: 'A 4 by 4 board with a queen in row 1, column 1 and a queen in row 2, column 2. They stand on the same diagonal. Every square they attack is crossed out.' },
    },
    {
      id: 'prune-size',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(5, 8);
        const k = rng.pick([2, 3]);
        const rest = n - k;
        const answer = n ** rest;
        const placed = k === 2 ? 'The queens in rows 1 and 2 are down, and they attack each other.' : 'The queens in rows 1, 2 and 3 are down, and two of them attack each other.';
        return {
          text: `
            Queens on a **${n} × ${n}** board, one queen in each row. ${placed}

            Brute force does not notice. It still lays out every way of filling the other ${rest} rows. **How many complete boards is that?**
          `,
          answer,
          wrong: [
            [n * rest, `Each of the ${rest} remaining rows has ${n} possible squares, and the choices multiply: ${new Array(rest).fill(n).join(' × ')}.`],
            [n ** n, `That counts every board there is. Here the first ${k} rows are already fixed; only ${rest} rows are still open.`],
            [rest ** n, `It is the other way round: ${rest} rows, with ${n} choices in each.`],
          ],
          hints: [
            `Each remaining row can have its queen in any of ${n} columns.`,
            `${rest} rows with ${n} choices each: multiply ${n} by itself ${rest} times.`,
          ],
          explain: `
            ${new Array(rest).fill(n).join(' × ')} = **${group(answer)}** boards, every one of them useless because of the two queens at the top.

            Backtracking spots the clash as soon as it appears and skips all ${group(answer)} at once.
          `,
        };
      },
    },
    {
      id: 'six-queens',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'A bigger board',
      text: `
        Now **six queens on a 6 × 6 board**. There are ${group(6 ** 6)} ways to put one queen in each row, and only ${TREE6.solutions} of them are solutions.

        Find one by backtracking. The two counters keep track of your work.
      `,
      widget: { type: 'queens-board', n: 6 },
      check: (s) => s.solved || (s.stuck ? 'This row has no square left. Take back the last queen and move her to a square she has not tried.' : `Keep going: ${s.placed} of the 6 queens ${s.placed === 1 ? 'is' : 'are'} down.`),
      solution: { queens: [1, 3, 5, 0, 2, 4] },
      hints: [
        'When a row is fully crossed out, do not start again. Take back only the last queen and move her along.',
        'No solution has a queen in a corner. Try the second square of row 1, then always the leftmost free square.',
      ],
      explain: `
        Trying the leftmost free square first, backtracking puts down ${FIRST6.puts} queens before the first solution stands. The complete tree of boards without an attack has only ${TREE6.nodes} boards.

        Brute force would be working through up to ${group(6 ** 6)} boards of six queens each.
      `,
    },
    {
      id: 'example-safe-squares',
      type: 'info',
      title: 'Is this square safe?',
      text: `
        So far the board crossed out the attacked squares for you. A program has to work them out. For each square of the next row it looks **straight up** and **up along both diagonals** for a queen.

        :::example Row 3 of this board
        - Column 1: no queen above it, none on its diagonals. **Safe.**
        - Column 2: the queen of row 1 is straight above.
        - Column 3: the queen of row 2 is one step up a diagonal.
        - Column 4: the queen of row 2 is straight above.

        One safe square, not two: a diagonal ruled out column 3.
        :::
      `,
      figure: { type: 'queens-board', n: 4, mode: 'view', queens: SAFE_BOARD, attacks: false, highlight: SAFE_BOARD.length, alt: 'A 4 by 4 board with queens in row 1, column 2 and in row 2, column 4. Row 3 is outlined. No square is crossed out.' },
    },
    {
      id: 'next-row',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([5, 6]);
        const rows = rng.int(2, n - 2);
        const queens = partialBoard(rng, n, rows);
        const safe = safeColumns(queens, n);
        const reasons = [];
        for (let c = 0; c < n; c++) {
          if (safe.includes(c)) continue;
          const by = queens.findIndex((qc, qr) => qc === c || Math.abs(qc - c) === rows - qr);
          reasons.push(`column ${c + 1} (${queens[by] === c ? 'same column as' : 'on a diagonal of'} the queen in row ${by + 1})`);
        }
        const where = queens.map((c, i) => `row ${i + 1}, column ${c + 1}`);
        return {
          text: `
            A backtracking search on a ${n} × ${n} board has placed queens in rows 1 to ${rows}.

            **How many squares of row ${rows + 1}** (outlined) are safe for the next queen?
          `,
          figure: { type: 'queens-board', n, mode: 'view', queens, attacks: false, highlight: rows, alt: `A ${n} by ${n} board with queens in ${listAnd(where)}. Row ${rows + 1} is outlined.` },
          answer: safe.length,
          prefix: 'Safe squares:',
          wrong: [
            [n - rows, 'That only rules out the columns that already hold a queen. Queens attack along diagonals too.'],
          ],
          hints: [
            `Go through row ${rows + 1} square by square. For each one, look straight up and along both diagonals for a queen.`,
          ],
          explain: `
            Ruled out: ${listAnd(reasons)}.

            ${safe.length ? `That leaves **${safe.length}** safe ${safe.length === 1 ? 'square' : 'squares'}: column${safe.length === 1 ? '' : 's'} ${listAnd(safe.map((c) => c + 1))}.` : `**No square** of row ${rows + 1} is safe. This board is a dead end, and backtracking takes back the queen in row ${rows}.`}
          `,
        };
      },
    },
    {
      id: 'parcels',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'Same strategy, new puzzle',
      text: `
        A delivery drone flies best with a load of **exactly ${PARCELS.target} kg**. Five parcels are waiting: ${listAnd(PARCELS.items)} kg.

        **Decide parcel by parcel: take it or skip it.** If the load goes over ${PARCELS.target} kg, back up and change an earlier decision.
      `,
      widget: { type: 'take-or-skip', items: PARCELS.items, target: PARCELS.target, unit: 'kg' },
      check: (s) => s.hit || (s.stuck ? 'You are stuck here. Press **Back up** and change your latest decision.' : `The load is ${s.total} kg. Keep deciding until it is exactly ${PARCELS.target} kg.`),
      solution: { path: PARCEL_RUN.found },
      hints: [
        'Going over the target is not a failure of the method. Back up one decision and try its other option.',
        'The 9 kg parcel belongs in the load. Which two smaller parcels add the missing 6 kg?',
      ],
      explain: `
        Five parcels can be combined in 2 × 2 × 2 × 2 × 2 = ${2 ** PARCELS.items.length} ways. Trying "take" before "skip", backtracking finds the answer (9 + 4 + 2) after ${PARCEL_RUN.steps} decisions.

        Each time the load went over ${PARCELS.target} kg, you turned back at once. Everything you could still have decided after that point was skipped without a look.
      `,
    },
    {
      id: 'prune-rule',
      type: 'multi',
      stretch: true,
      title: 'When may you turn back?',
      text: `
        The drone again: parcels are decided one by one, and the target is exactly 15 kg.

        **In which situations can the search turn back at once**, because no way of finishing can hit 15 kg?
      `,
      options: [
        { text: 'The load is 16 kg, and two parcels are still undecided', correct: true },
        { text: 'The load is 6 kg, and the undecided parcels weigh 5 kg in total', correct: true },
        { text: 'The load is 9 kg, and the undecided parcels weigh 4 kg and 2 kg', why: '9 + 4 + 2 = 15. The target can still be reached, so this branch has to be explored.' },
        { text: 'The load is 11 kg after a skip, and a 4 kg parcel is still undecided', why: 'Skipping is an ordinary choice, not a dead end. With the 4 kg parcel the load can still reach 11 + 4 = 15.' },
      ],
      hints: ['For each case ask: what is the heaviest load this branch can still reach, and what is the lightest?'],
      explain: `
        A load that is already too heavy only gets heavier. And a load of 6 kg with just 5 kg still to come can never get past 11 kg.

        Both tests are **pruning**: they cut a branch off the search tree before it is explored. The sharper the test, the smaller the tree that is left.
      `,
    },
    {
      id: 'match-prune',
      type: 'match',
      review: true,
      text: `
        Backtracking fits any puzzle where an answer is built up choice by choice. A Sudoku is one: its empty cells are filled with digits, one by one, so that no digit repeats in a row, a column or a box.

        **Match each puzzle with the sign that it is time to back up.**
      `,
      pairs: [
        ['Queens on a board', 'The next row has no safe square'],
        ['Sudoku', 'An empty cell has no digit that still fits'],
        ['Loading an exact weight', 'The load is already too heavy'],
        ['A way through a maze', 'The corridor ends in a wall'],
      ],
      explain: 'One strategy, many puzzles: make a choice, go on, and at the first sign that this partial answer cannot work, undo the latest choice and try the next.',
    },
    {
      id: 'growth',
      type: 'choice',
      title: 'How much does it save?',
      text: `
        Boards looked at for the queens puzzle:

        | Queens | Brute force | Backtracking tree |
        |-------:|------------:|------------------:|
        | 4 | ${group(4 ** 4)} | ${group(TREE4.nodes)} |
        | 6 | ${group(6 ** 6)} | ${group(TREE6.nodes)} |
        | 8 | ${group(8 ** 8)} | ${group(TREE8.nodes)} |

        **What does the table show?**
      `,
      options: [
        { text: 'Backtracking does far less work, but its work still grows quickly as the board grows', correct: true },
        { text: 'With backtracking, the work grows in proportion to the size of the board', why: `From 4 to 8 queens the board only gets twice as wide (four times the squares), but the tree grows from ${TREE4.nodes} boards to ${group(TREE8.nodes)}: about ${Math.round(TREE8.nodes / TREE4.nodes / 10) * 10} times as many.` },
        { text: 'Backtracking only pays off on small boards', why: `The saving gets bigger with the board: ${4 ** 4 / TREE4.nodes} times fewer boards for 4 queens, about ${group(Math.round(8 ** 8 / TREE8.nodes / 1000) * 1000)} times fewer for 8.` },
      ],
      explain: `
        For 8 queens backtracking looks at about ${group(Math.round(8 ** 8 / TREE8.nodes / 1000) * 1000)} times fewer boards than brute force. That is what makes the puzzle easy for a computer.

        But the tree still multiplies as the puzzle grows. Backtracking is a clever way to search. It is not a promise that the search will be short, and the last lesson of this course comes back to that.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend writes a program that solves the 8-queens puzzle by trying all ${group(8 ** 8)} boards one after another.

        **How would you explain backtracking to them, and why it is so much faster?**
      `,
      model: `
        Build the board one queen at a time instead of all at once. After each queen, check whether she is attacked. If a row has no safe square, take back the latest queen and try her next square.

        It is faster because one early clash rules out *every* board that contains it. Brute force would lay all of those boards out in full. Backtracking never goes below the clash, so for 8 queens it looks at about ${group(TREE8.nodes)} partial boards instead of ${group(8 ** 8)} complete ones.
      `,
    },
  ],
  recap: [
    '**Backtracking** builds an answer one choice at a time and undoes the latest choice as soon as it cannot work.',
    'The choices form a **search tree**. A dead end cuts off everything below it: that is **pruning**.',
    `For 8 queens: about ${group(TREE8.nodes)} partial boards instead of ${group(8 ** 8)} complete ones.`,
    'The same strategy solves queens, Sudoku, mazes and packing puzzles, but the tree can still grow very fast.',
  ],
  next: 'Next: a strategy that never backs up at all. It just grabs what looks best, and sometimes that is exactly right.',
};
