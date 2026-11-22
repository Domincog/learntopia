// Algorithms II · Lesson 3 · Remember Your Answers
import { plural } from '../../../kit.js';
import { bestChange, fib, fibCalls, fibRepeats, fibTreeFigure, greedyChange, gridPaths, group, listAnd, listOr, minCoinsTable } from '../helpers.js';

const ODD = [1, 3, 4];
const ODD_TABLE = minCoinsTable(ODD, 10);
/** The worked example of the last-coin rule. 1, 5, 8 is not among the coin sets of the generated step. */
const SHOW_COINS = [1, 5, 8];
const SHOW_AMOUNT = 10;
const SHOW_TABLE = minCoinsTable(SHOW_COINS, SHOW_AMOUNT);
const SHOW_LEAST = Math.min(...SHOW_COINS.map((c) => SHOW_TABLE[SHOW_AMOUNT - c]));
const ROUTES3 = gridPaths(3, 3);

/** Feedback for a table of routes: explain the first wrong cell from the two cells it reads. */
function routesFeedback(s) {
  if (s.correct) return true;
  if (s.firstWrong) {
    const w = s.firstWrong;
    const up = w.reads.find((c) => c.row === w.row - 1);
    const left = w.reads.find((c) => c.col === w.col - 1);
    return `Row ${w.row + 1}, column ${w.col + 1}: ${up.value === 0 ? 'the cell above is closed (0 routes)' : `the cell above holds ${up.value}`} and ${left.value === 0 ? 'the cell to the left is closed (0 routes)' : `the cell to the left holds ${left.value}`}. So ${up.value} + ${left.value} = ${w.truth} routes arrive here, not ${w.value}.`;
  }
  return `${plural(s.total - s.filled, 'cell is', 'cells are')} still empty.`;
}

export default {
  id: 'dynamic-programming',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'A forgetful recipe',
      text: `
        The Fibonacci numbers begin 1, 1, and after that each one is the sum of the two before it: 1, 1, 2, 3, 5, 8, 13 …

        As a recipe that uses itself, like merge sort did: **fib(n) = fib(n − 1) + fib(n − 2)**, with fib(1) = fib(2) = 1.

        A computer follows this recipe to the letter to work out fib(30) = ${group(fib(30))}. **How many times does it start the recipe in all?**
      `,
      options: [
        { text: 'About 30' },
        { text: 'About 900' },
        { text: 'About 30,000' },
        { text: 'More than 1.6 million', correct: true },
      ],
      explain: `
        **${group(fibCalls(30))} times**, for a job that needs only ${30 - 2} additions.

        The recipe is correct. It is just hopelessly forgetful, and the next picture shows how.
      `,
    },
    {
      id: 'teach-call-tree',
      type: 'info',
      title: 'One call starts two more',
      text: `
        Each time the recipe is started, that is one **call**. A call for fib(5) cannot add anything yet. First it starts a call for fib(4) and one for fib(3), and each of those starts two more. Only fib(2) and fib(1) answer at once.

        The picture shows every call for fib(5). Each circle is one call, labelled with its n.

        :::example Count the calls
        - fib(3): itself, fib(2) and fib(1). **${fibCalls(3)} calls.**
        - fib(4): itself, the ${fibCalls(3)} calls of fib(3), and fib(2). 1 + ${fibCalls(3)} + ${fibCalls(2)} = **${fibCalls(4)} calls.**
        - fib(5): itself, the ${fibCalls(4)} calls of fib(4) and the ${fibCalls(3)} of fib(3). 1 + ${fibCalls(4)} + ${fibCalls(3)} = **${fibCalls(5)} calls.**
        :::
      `,
      figure: fibTreeFigure(5),
    },
    {
      id: 'call-tree',
      type: 'fill',
      title: 'The same question, again and again',
      text: `
        Here is everything the recipe does to work out fib(6). Each circle is one call, labelled with its n: fib(6) asks for fib(5) and fib(4), fib(5) asks for fib(4) and fib(3), and so on down.

        **Count in the picture.**
      `,
      figure: fibTreeFigure(6),
      template: `
        fib(4) is worked out [[${fibRepeats(6, 4)}]] times, fib(3) [[${fibRepeats(6, 3)}]] times and fib(2) [[${fibRepeats(6, 2)}]] times.

        The whole tree has [[${fibCalls(6)}]] calls.
      `,
      hints: ['Calls with the same number have the same colour.'],
      explain: `
        ${fibCalls(6)} calls for fib(6): one for itself, ${fibCalls(5)} inside fib(5) and ${fibCalls(4)} inside fib(4).

        Most of them repeat work that is already done: the whole branch under the second fib(4) is a copy of the first.
      `,
    },
    {
      id: 'teach-table',
      type: 'info',
      title: 'Write the answers down',
      text: `
        The same sub-question keeps coming back. These are called **overlapping subproblems**, and the forgetful recipe pays for each copy in full.

        The cure is to turn the recipe round: start with the smallest cases and write every answer into a **table**.

        :::example fib(6) with a table
        fib(1) and fib(2) are both 1. After that, each cell is the sum of the two cells before it:

        1 + 1 = 2, then 2 + 1 = 3, then 3 + 2 = 5, then 5 + 3 = **${fib(6)}**.
        :::

        ${6 - 2} additions instead of ${fibCalls(6)} calls. Nothing is worked out twice, because every answer is still in the table when it is needed.
      `,
      figure: { type: 'dp-grid', kind: 'fib', n: 6, static: true, alt: `A table with six cells, fib(1) to fib(6), holding ${[1, 2, 3, 4, 5, 6].map((k) => fib(k)).join(', ')}.` },
    },
    {
      id: 'fib-table',
      type: 'interact',
      attempts: 6,
      title: 'Now with a memory',
      text: `
        Your turn, and this table goes on to fib(10).

        **Fill the table from left to right.** Each cell is the sum of the two cells before it, and both are already there: nothing is ever worked out twice.
      `,
      widget: { type: 'dp-grid', kind: 'fib', n: 10 },
      check: (s) => {
        if (s.correct) return true;
        if (s.firstWrong) {
          const w = s.firstWrong;
          return `fib(${w.head}) is fib(${w.head - 1}) + fib(${w.head - 2}) = ${w.reads[0].value} + ${w.reads[1].value}, not ${w.value}.`;
        }
        return `${plural(s.total - s.filled, 'cell is', 'cells are')} still empty.`;
      },
      solution: { solved: true },
      hints: ['Tap a cell, then type its number with the keys under the table. The two cells it needs are lit up.'],
      explain: `
        Eight additions, and fib(10) = ${fib(10)} is in the table. The forgetful recipe makes ${fibCalls(10)} calls for the same number.

        For fib(30) the score is ${30 - 2} additions against ${group(fibCalls(30))} calls.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Two ways to remember',
      text: `
        The cure for a forgetful recipe is to store every answer the first time it is worked out. There are two ways to do it.

        - **Memoisation**: keep the recipe, but give it a notebook. Before working anything out, look in the notebook. Afterwards, write the answer in.
        - **Dynamic programming**: turn the recipe round, as you just did. Start with the smallest cases and fill a table in an order that makes sure every cell you need is already there.

        Both rest on one idea: when the same sub-question comes up again and again, **answer it once**.

        :::note
        The name goes back to the mathematician Richard Bellman in the 1950s. "Programming" meant planning, not writing code.
        :::
      `,
    },
    {
      id: 'calls-grow',
      type: 'numeric',
      gen: (rng) => {
        const n = rng.int(9, 15);
        const a = fibCalls(n - 2);
        const b = fibCalls(n - 1);
        return {
          text: `
            Without a memory, working out fib(n) takes one call for fib(n) itself, plus every call needed for fib(n − 1), plus every call needed for fib(n − 2).

            The recipe needs **${group(a)} calls for fib(${n - 2})** and **${group(b)} calls for fib(${n - 1})**. How many calls does it need for fib(${n})?
          `,
          answer: a + b + 1,
          unit: 'calls',
          wrong: [
            [a + b, `Nearly: that counts the calls inside fib(${n - 1}) and fib(${n - 2}). Add the one call for fib(${n}) itself.`],
            [2 * b, `fib(${n}) asks for fib(${n - 1}) only once. Its second question is fib(${n - 2}), which costs ${group(a)} calls.`],
            [b + 1, `That would be right if fib(${n}) only asked for fib(${n - 1}). It also asks for fib(${n - 2}).`],
          ],
          hints: [`Add three things: 1, the calls for fib(${n - 1}), and the calls for fib(${n - 2}).`],
          explain: `
            1 + ${group(b)} + ${group(a)} = **${group(a + b + 1)}** calls.

            Each step up multiplies the cost by about 1.6, because the work for fib(${n - 2}) is done all over again inside fib(${n - 1}). With a table, each step up costs one more addition.
          `,
        };
      },
    },
    {
      id: 'teach-routes',
      type: 'info',
      title: 'A new problem: count the routes',
      text: `
        A walker starts in the top-left cell of a grid and may only step **right** or **down**. How many different routes lead to each cell?

        Along the top row and the left column there is one route: straight on. For any other cell, look at the **last step** of a route. It comes from the cell above or from the cell on the left, never both. So the two groups can be added:

        **routes to a cell = cell above + cell on its left**

        :::example The 3 × 3 grid in the picture
        Row 2: 1 + 1 = ${ROUTES3[1][1]}, then ${ROUTES3[0][2]} + ${ROUTES3[1][1]} = ${ROUTES3[1][2]}. Row 3: ${ROUTES3[1][1]} + 1 = ${ROUTES3[2][1]}, then ${ROUTES3[1][2]} + ${ROUTES3[2][1]} = **${ROUTES3[2][2]}** routes to the far corner.
        :::
      `,
      figure: { type: 'dp-grid', kind: 'paths', rows: 3, cols: 3, static: true, alt: `A grid of 3 rows and 3 columns. Each cell holds the number of routes to it: ${ROUTES3.map((row) => row.join(', ')).join('; ')}.` },
    },
    {
      id: 'grid-paths',
      type: 'interact',
      attempts: 6,
      title: 'Counting routes',
      text: `
        The same walker on a bigger grid: start in the top-left cell, step only **right** or **down**.

        The top row and the left column are filled in: one route each, straight on. **Fill in the other cells.** Each one needs only the cell above it and the cell on its left.
      `,
      widget: { type: 'dp-grid', kind: 'paths', rows: 4, cols: 4, given: 'edges' },
      check: routesFeedback,
      solution: { solved: true },
      hints: [
        'Start with the cell in row 2, column 2. A route can reach it from the cell above or from the cell to its left.',
        'So add those two cells: 1 + 1 = 2. Do the same for every cell, row by row.',
      ],
      explain: `
        **${gridPaths(4, 4)[3][3]} routes** lead to the far corner, found with nine small additions.

        Writing the routes out one by one would mean listing all ${gridPaths(4, 4)[3][3]}. On a grid of 10 by 10 cells there are ${group(gridPaths(10, 10)[9][9])} routes, and the table still needs only 81 additions.
      `,
    },
    {
      id: 'why-add',
      type: 'choice',
      review: true,
      text: `
        A table counts the routes from the top-left cell of a grid to every other cell, for a walker who may only step right or down.

        **Why is the number in a cell the sum of the cell above it and the cell to its left?**
      `,
      options: [
        { text: 'Every route arrives by a last step from above or from the left, never both, so the two groups can be added', correct: true },
        { text: 'Because routes may also arrive diagonally', why: 'Diagonal steps are not allowed. A route can only come in from above or from the left.' },
        { text: 'Because the cell is one row and one column further on', why: 'Position alone gives no rule. What matters is where the last step of a route can come from.' },
        { text: 'It is a pattern that happens to fit the first few cells', why: 'It is more than a pattern: every route into the cell is counted exactly once, by its last step.' },
      ],
      explain: `
        Sort the routes into a cell by their **last step**. Those that come from above are exactly the routes to the cell above, and those that come from the left are exactly the routes to the cell on the left.

        That is the heart of dynamic programming: express the answer for a cell through answers for smaller cases that are already in the table.
      `,
    },
    {
      id: 'paths-table',
      type: 'interact',
      review: true,
      attempts: 6,
      gen: (rng) => {
        const [rows, cols] = rng.pick([[3, 3], [3, 4], [4, 3], [3, 5], [4, 4]]);
        const inner = [];
        for (let r = 1; r < rows; r++) for (let c = 1; c < cols; c++) if (!(r === rows - 1 && c === cols - 1)) inner.push([r, c]);
        const closed = rng.pick(inner);
        const table = gridPaths(rows, cols, [closed]);
        return {
          text: `
            A walker starts in the top-left cell of this grid (${rows} rows, ${cols} columns) and may only step right or down. The crossed-out cell in row ${closed[0] + 1}, column ${closed[1] + 1} is closed: no route may pass through it, so it counts as 0.

            **Fill in the number of routes to every open cell.**
          `,
          widget: { type: 'dp-grid', kind: 'paths', rows, cols, closed: [closed], given: 'edges' },
          check: routesFeedback,
          solution: { solved: true },
          hints: [
            'Each cell is the cell above plus the cell to its left.',
            'The closed cell counts as 0: no route comes out of it.',
          ],
          explain: `
            Each cell is the cell above plus the cell to its left, and the closed cell counts as 0.

            The bottom-right cell ends up with **${table[rows - 1][cols - 1]}**: that many routes cross the whole grid without touching the closed cell.
          `,
        };
      },
    },
    {
      id: 'teach-last-coin',
      type: 'info',
      title: 'Which coin comes last?',
      text: `
        Back to paying with the **fewest coins**, the problem that greedy got wrong. Greedy fixes the first coin and hopes. A table asks about the **last** coin instead, and tries every kind.

        :::example Coins of ${listAnd(SHOW_COINS)}: the cell for ${SHOW_AMOUNT}
        ${SHOW_COINS.map((c) => `- Last coin ${c === 8 ? 'an' : 'a'} ${c}: ${SHOW_AMOUNT - c} is left. That cell holds ${SHOW_TABLE[SHOW_AMOUNT - c]}.`).join('\n        ')}

        The smallest is ${SHOW_LEAST}. Add the last coin itself, and ${SHOW_AMOUNT} needs ${SHOW_LEAST} + 1 = **${SHOW_TABLE[SHOW_AMOUNT]} coins**: ${bestChange(SHOW_COINS, SHOW_AMOUNT).join(' + ')}. Greedy would pay ${greedyChange(SHOW_COINS, SHOW_AMOUNT).join(' + ')}.
        :::

        Every cell is **1 + the smallest of the cells it reads**. Those cells are already filled, because the table grows from 0 upwards.
      `,
      figure: { type: 'dp-grid', kind: 'coins', coins: SHOW_COINS, max: SHOW_AMOUNT, static: true, alt: `A table of the fewest coins of ${listAnd(SHOW_COINS)} for the amounts 0 to ${SHOW_AMOUNT}: ${SHOW_TABLE.join(', ')}.` },
    },
    {
      id: 'coins-return',
      type: 'interact',
      attempts: 6,
      title: 'Back to the odd coins',
      text: `
        Remember the coins **1, 3 and 4**, where greedy paid 6 with three coins? Build a table of the **fewest coins** for every amount up to 10.

        Think about the *last* coin: a 1, a 3 or a 4. Whichever it is, the rest was paid in the best way, and that number is already in the table. **Fill in the cells.**
      `,
      widget: { type: 'dp-grid', kind: 'coins', coins: ODD, max: 10 },
      check: (s) => {
        if (s.correct) return true;
        if (s.firstWrong) {
          const w = s.firstWrong;
          const least = Math.min(...w.reads.map((c) => c.value));
          return w.reads.length === 1
            ? `Amount ${w.head}: the last coin must be a 1, which leaves ${w.reads[0].head}. That cell holds ${w.reads[0].value}, so ${w.head} needs ${w.reads[0].value} + 1 = ${w.truth}, not ${w.value}.`
            : `Amount ${w.head}: the last coin leaves ${listOr(w.reads.map((c) => c.head))}. Those cells hold ${listAnd(w.reads.map((c) => c.value))}. The smallest is ${least}, so ${w.head} needs ${least} + 1 = ${w.truth}, not ${w.value}.`;
        }
        return `${plural(s.total - s.filled, 'cell is', 'cells are')} still empty.`;
      },
      solution: { solved: true },
      hints: [
        'For the amount 4: the last coin leaves 3, 1 or 0. Those cells hold 1, 1 and 0. The smallest is 0, so 4 needs 0 + 1 = 1 coin.',
        'Every cell works the same way: look at the lit cells, take the smallest, add 1.',
      ],
      explain: `
        The cell for 6 says **${ODD_TABLE[6]}**. The table found 3 + 3 without trying every combination of coins, and without greedy's blind spot.

        Greedy looks at one option and never looks back. Dynamic programming looks at **every** possible last coin, and can afford to, because the rest is a look-up.
      `,
    },
    {
      id: 'coin-cell',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const coins = rng.pick([[1, 3, 4], [1, 4, 5], [1, 5, 6], [1, 4, 6], [1, 3, 5], [1, 2, 5]]);
        const amount = rng.int(6, 10);
        const table = minCoinsTable(coins, amount);
        const fits = coins.filter((c) => c <= amount);
        const left = fits.map((c) => amount - c);
        const least = Math.min(...left.map((a) => table[a]));
        const greedy = greedyChange(coins, amount).length;
        return {
          text: `
            A country has coins of **${listAnd(coins)}**. The table lists the fewest coins needed for each amount from 0 to ${amount - 1}.

            **What belongs in the cell for ${amount}?**
          `,
          figure: {
            type: 'dp-grid', kind: 'coins', coins, max: amount, static: true, hide: [amount],
            alt: `A table of the fewest coins for the amounts 0 to ${amount - 1}: ${table.slice(0, amount).join(', ')}. The cell for ${amount} shows a question mark.`,
          },
          answer: table[amount],
          prefix: 'Fewest coins:',
          wrong: [
            [table[amount - 1] + 1, `That only tries a 1 as the last coin. Check the other coins as well: they leave ${listAnd(left.filter((a) => a !== amount - 1))}.`],
            [least, `${least} is the smallest of the cells you need. Do not forget to add 1 for the last coin itself.`],
            ...(greedy !== table[amount - 1] + 1 ? [[greedy, 'That is what the greedy rule would pay. The table can do better: compare every possible last coin.']] : []),
          ],
          hints: [
            `The last coin is ${listOr(fits.map((c) => `a ${c}`))}. That leaves ${listOr(left)}.`,
            `Those cells hold ${listAnd(left.map((a) => table[a]))}. Take the smallest and add 1.`,
          ],
          explain: `
            The last coin is ${listOr(fits.map((c) => `a ${c}`))}, which leaves ${listOr(left)}. Those cells hold ${listAnd(left.map((a) => table[a]))}.

            The smallest is ${least}, so ${amount} needs ${least} + 1 = **${plural(table[amount], 'coin')}**.
          `,
        };
      },
    },
    {
      id: 'classify',
      type: 'bucket',
      review: true,
      text: 'Three strategies so far. **Sort each description under the strategy it fits.**',
      buckets: ['Backtracking', 'Greedy', 'Dynamic programming'],
      items: [
        { text: 'Tries a choice and undoes it if it leads nowhere', bucket: 0, why: 'Undoing the latest choice is what backtracking does.' },
        { text: 'Gives up on a partial answer the moment it breaks a rule', bucket: 0, why: 'That is pruning, the heart of backtracking.' },
        { text: 'Takes what looks best right now and never reconsiders', bucket: 1, why: 'No going back and no table: that is greedy.' },
        { text: 'Fast, but can miss the best answer', bucket: 1, why: 'Greedy with coins of 1, 3 and 4 pays 6 with three coins instead of two.' },
        { text: 'Solves the small cases first and stores every answer', bucket: 2, why: 'Filling a table from the smallest case up is dynamic programming.' },
        { text: 'Pays off when the same sub-question keeps coming back', bucket: 2, why: 'Overlapping subproblems are what make a table worth keeping.' },
      ],
      explain: `
        Backtracking explores choices and retreats. Greedy commits to one choice and moves on. Dynamic programming compares all the choices, but looks the rest up in a table instead of exploring it again.
      `,
    },
    {
      id: 'no-overlap',
      type: 'choice',
      stretch: true,
      title: 'When a table does not help',
      text: `
        Merge sort also solves a problem by splitting it into smaller ones: sort the left half, sort the right half, merge.

        **Would storing the sub-answers in a table make merge sort faster?**
      `,
      options: [
        { text: 'No: its sub-problems are different pieces of the row, so no answer is ever needed twice', correct: true },
        { text: 'Yes: every recipe that uses itself gets faster with a table', why: 'A table only helps when the same sub-question is asked more than once.' },
        { text: 'Yes: merge sort keeps sorting the same piles again', why: 'Every pile is a different stretch of the row, and each one is sorted exactly once.' },
        { text: 'No: tables only work for problems about numbers', why: 'A table can hold any kind of sub-answer. What matters is whether sub-problems repeat.' },
      ],
      explain: `
        In the Fibonacci tree, fib(4) turns up in several places. In merge sort, every pile is its own piece of the row, and nothing repeats.

        Splitting into sub-problems is not enough. Dynamic programming pays off when the sub-problems **overlap**.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        The recipe fib(n) = fib(n − 1) + fib(n − 2) needs more than a million calls for fib(30), yet a table gets there with 28 additions.

        **Explain in your own words where the million calls come from, and why the table avoids them.**
      `,
      model: `
        The recipe has no memory. To work out fib(30) it works out fib(29) and fib(28), but inside fib(29) it works out fib(28) all over again, and inside each of those fib(27), and so on. The same few questions are answered over and over, and the number of calls more than doubles every two steps.

        The table answers each question once, smallest first. When a cell needs fib(28) and fib(27), they are simply read off. Thirty questions, each answered one time.
      `,
    },
  ],
  recap: [
    'A recipe that uses itself can ask the same sub-question again and again: **overlapping subproblems**.',
    'The cure is to answer each one once and store it: with a notebook (**memoisation**) or by filling a table from the smallest case up (**dynamic programming**).',
    `fib(30): ${group(fibCalls(30))} calls without a memory, ${30 - 2} additions with a table.`,
    'With coins of 1, 3 and 4, the table finds the true fewest coins, where greedy does not.',
  ],
  next: 'Next: back to maps. When roads have different lengths, the route with the fewest roads is no longer the shortest.',
};
