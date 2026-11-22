// Algorithms · Lesson 4 · Divide and Conquer
import { r } from '../../../kit.js';
import { group, listAnd, mergeFigure, mergeSortCounts, mergeTrace, pairCount, splitFigure } from '../helpers.js';

const ROW = [5, 2, 7, 1, 8, 3, 6, 4];
const SORT = mergeSortCounts(ROW);

/** The worked merge: 2 cards and 3 (the generated merge questions never use piles this small). */
const MERGE_DEMO = { a: [3, 8], b: [5, 6, 9] };
const MERGE = mergeTrace(MERGE_DEMO.a, MERGE_DEMO.b);
/** The picture shows the worked merge after this many comparisons. */
const MERGE_SHOWN = MERGE.rows[1];

/** A second recipe that uses itself, as the worked example before "recursion": binary search. */
const SEARCH_CODE = [
  'to find a name in a sorted list:',
  '  look at the middle name',
  '  if it is the one: done',
  '  keep the half that can hold it',
  '  find the name in that half',
];

export default {
  id: 'divide-and-conquer',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'Can sorting be much faster?',
      text: `
        Bubble sort needs about **500,000 comparisons** to sort 1,000 numbers.

        The method in this lesson has no new tricks: it still only compares two numbers at a time. It just organises the work differently.

        About how many comparisons does *it* need for 1,000 numbers?
      `,
      options: [
        { text: 'About 250,000' },
        { text: 'About 100,000' },
        { text: 'About 10,000', correct: true },
        { text: 'About 1,000', why: 'That would be one comparison per number. It can be proved that no method based on comparing can sort with so few.' },
      ],
      explain: `
        **Fewer than 10,000**: about fifty times less work than bubble sort.

        The trick is not to compare faster. It is to split the job into smaller copies of itself.
      `,
    },
    {
      id: 'merge-two',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Two sorted piles',
      text: `
        Each of these two piles is **already sorted**. Build one sorted row from them.

        One rule: you may only take the **front card** of a pile.
      `,
      widget: { type: 'merge-lab', piles: [[2, 5, 9, 12], [3, 4, 10, 15]] },
      check: (s) => {
        if (!s.done) return 'Keep going until both piles are empty.';
        return s.sorted || 'The bottom row is not in order. Press **Undo** or **Start again**, and compare the two front cards before every move.';
      },
      solution: { done: true },
      hints: ['Look only at the two orange front cards. Which of them has to come first in a sorted row?'],
      explain: `
        Both piles are empty and the bottom row is in order. Eight cards, seven comparisons.

        You never had to search through a pile to find the next card.
      `,
    },
    {
      id: 'teach-merge',
      type: 'info',
      title: 'Merging: only the front cards matter',
      text: `
        What you just did is called **merging**. Both piles are sorted, so the smallest card still waiting is always one of the two **front cards**. Each move costs a single comparison: *which front card is smaller?*

        Here is the merge of ${MERGE_DEMO.a.join(', ')} with ${MERGE_DEMO.b.join(', ')}, step by step:

        | Front cards | Smaller | Merged row |
        |:-:|:-:|:--|
        ${MERGE.rows.map((row) => `| ${row.frontA} and ${row.frontB} | ${row.taken} | ${row.out.join(', ')} |`).join('\n        ')}

        Now pile ${MERGE.emptied} is empty, so ${listAnd(MERGE.free)} follows without a comparison: ${MERGE.merged.length} cards, ${MERGE.comparisons} comparisons. Every comparison places one card, and the last card never needs one.
      `,
      figure: {
        ...mergeFigure(MERGE_SHOWN.restA, MERGE_SHOWN.restB, MERGE_SHOWN.out),
        caption: `After two comparisons. The front cards are ${MERGE_SHOWN.restA[0]} and ${MERGE_SHOWN.restB[0]}, so ${Math.min(MERGE_SHOWN.restA[0], MERGE_SHOWN.restB[0])} goes next.`,
      },
    },
    {
      id: 'merge-next',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [sizeA, sizeB] = rng.pick([[3, 4], [4, 3], [4, 4], [3, 3]]);
        const cards = rng.sample(Array.from({ length: 38 }, (_, i) => i + 2), sizeA + sizeB);
        const a = cards.slice(0, sizeA).sort((x, y) => x - y);
        const b = cards.slice(sizeA).sort((x, y) => x - y);
        // carry the merge on for a while, stopping while both piles still have cards
        let i = 0;
        let j = 0;
        const out = [];
        const placed = rng.int(1, sizeA + sizeB - 3);
        while (out.length < placed && i < a.length - 1 && j < b.length - 1) {
          if (a[i] < b[j]) out.push(a[i++]); else out.push(b[j++]);
        }
        const frontA = a[i];
        const frontB = b[j];
        const answer = Math.min(frontA, frontB);
        const other = Math.max(frontA, frontB);
        return {
          text: `
            Two sorted piles are being merged. The picture shows what is left of each pile, and the merged row so far.

            **Which card goes into the empty place next?**
          `,
          figure: mergeFigure(a.slice(i), b.slice(j), out),
          answer,
          wrong: [
            [other, `${other} is a front card, but not the smaller one. Compare it with ${answer}.`],
            ...[...a.slice(i + 1), ...b.slice(j + 1)].map((v) => [v, `Only a front card can be taken, and ${v} is not at the front of its pile.`]),
          ],
          hints: [
            'Only the two front cards matter: the leftmost card of each pile.',
            `The front cards are ${frontA} and ${frontB}.`,
          ],
          explain: `
            The front cards are ${frontA} and ${frontB}, and the smaller one, **${answer}**, goes next.

            Nothing behind them can be smaller: each pile is sorted, so every card is at least as big as the one in front of it.
          `,
        };
      },
    },
    {
      id: 'merge-count',
      type: 'numeric',
      gen: (rng) => {
        const [a, b] = rng.pick([[4, 4], [5, 5], [8, 8], [10, 10], [16, 16], [20, 30], [50, 50], [100, 100], [250, 250], [500, 500]]);
        const total = a + b;
        return {
          text: `
            Two sorted piles are merged: one holds **${a} cards**, the other **${b}**.

            Every comparison of the two front cards sends one card to the merged row. What is the **largest** number of comparisons the whole merge can need?
          `,
          answer: total - 1,
          unit: 'comparisons',
          wrong: [
            [total, 'Close. The very last card never needs a comparison: by then the other pile is empty.'],
            [a * b, 'No card is compared with *every* card of the other pile. Each comparison settles one card for good.'],
            [Math.max(a, b), 'Cards from **both** piles have to be placed, and each one costs at most one comparison.'],
          ],
          hints: [
            'Each comparison places exactly one card in the merged row.',
            `There are ${total} cards to place. Does the very last one need a comparison?`,
          ],
          explain: `
            Each comparison places one card, and the last card goes down without one: at most ${a} + ${b} − 1 = **${total - 1}** comparisons.

            Roughly one comparison per card. Merging is cheap.
          `,
        };
      },
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Where do sorted piles come from?',
      text: `
        Merging is cheap, but it needs **sorted** piles to start from. Here is the trick:

        - A single card is a sorted pile.
        - So cut the row in half, and the halves in half, until every card stands alone.
        - Then merge back up: single cards into sorted pairs, pairs into sorted fours, fours into the whole row.

        Splitting a problem into smaller copies of itself (**divide**), solving those (**conquer**) and putting the answers together (**combine**) is called **divide and conquer**. Sorting this way is called **merge sort**.
      `,
      figure: { ...splitFigure(ROW), caption: 'Dividing: halve the row until every card stands alone.' },
    },
    {
      id: 'merge-sort',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Run merge sort yourself',
      text: `
        The eight cards from the picture, already split into singles. **Merge them back together**, level by level: each time, tap the smaller of the two front cards.

        Keep an eye on the two counters.
      `,
      widget: { type: 'merge-lab', values: ROW },
      check: (s) => s.done || 'Keep merging until all eight cards have reached the bottom row.',
      solution: { done: true },
      explain: `
        Single cards became sorted pairs, the pairs became sorted fours, and the two fours became the whole row, in order.

        The counters stopped at ${SORT.moves} card moves and ${SORT.comparisons} comparisons.
      `,
    },
    {
      id: 'teach-levels',
      type: 'info',
      title: 'Count the levels',
      text: r`
        Count what happened. There were **${SORT.levels} levels** of merging, and on each level every card moved down exactly once: $${SORT.levels} \times ${ROW.length} = ${SORT.moves}$ card moves, and only ${SORT.comparisons} comparisons.

        | Level | It leaves | Cards moved |
        |:-:|:-:|:-:|
        ${Array.from({ length: SORT.levels }, (_, i) => `| ${i + 1} | ${ROW.length / 2 ** (i + 1) === 1 ? '1 pile' : `${ROW.length / 2 ** (i + 1)} piles`} of ${2 ** (i + 1)} | ${ROW.length} |`).join('\n        ')}

        The piles double in size on every level: ${Array.from({ length: SORT.levels + 1 }, (_, i) => 2 ** i).join(' → ')}. It takes ${SORT.levels} doublings to reach ${ROW.length}, so ${ROW.length} cards need ${SORT.levels} levels.

        Bubble sort needs ${pairCount(ROW.length)} comparisons for ${ROW.length} cards. Not a big gap yet. Watch what happens when the row grows.
      `,
    },
    {
      id: 'levels',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.int(4, 10);
        const n = 2 ** k;
        const chain = Array.from({ length: k + 1 }, (_, i) => group(2 ** i));
        return {
          text: `
            Merge sort starts from single cards and doubles the size of the piles on every level: 1, 2, 4, 8, …

            How many **levels of merging** does it take to sort **${group(n)} cards**?
          `,
          answer: k,
          unit: 'levels',
          wrong: [
            [n / 2, 'That is the number of pairs made on the first level. Count how often the pile size doubles before one pile holds everything.'],
            [k + 1, 'One too many: count the doublings, not the pile sizes. Going from 1 to 2 is the first level.'],
            [n, 'Far fewer: the piles double in size on every level, so they reach the full row quickly.'],
          ],
          hints: [
            'Start at 1 and keep doubling until you reach the number of cards. Count the doublings.',
            `${chain.slice(0, 4).join(' → ')} → … → ${group(n)}`,
          ],
          explain: r`
            ${chain.join(' → ')}

            The pile size doubles **${k} times**, so there are ${k} levels ($2^{${k}} = ${n}$).
          `,
        };
      },
    },
    {
      id: 'work',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const k = rng.int(4, 7);
        const n = 2 ** k;
        return {
          text: `Merge sort on **${n} cards**. On every level of merging, each card moves down once.`,
          template: `There are [[${k}]] levels, and each level moves [[${n}]] cards, so the whole sort takes [[${n * k}]] card moves.`,
          hints: [
            'The pile size doubles on every level: 1, 2, 4, … How many doublings until one pile holds all the cards?',
            `Then multiply: (number of levels) × ${n}.`,
          ],
          explain: `
            ${k} levels × ${n} cards = **${group(n * k)} card moves**, and never more comparisons than that.

            Bubble sort would make ${group(pairCount(n))} comparisons on the same row.
          `,
        };
      },
    },
    {
      id: 'compare',
      type: 'choice',
      shuffle: false,
      text: `
        The work for longer and longer rows:

        | Cards | Bubble sort | Merge sort |
        |------:|------------:|-----------:|
        | 8 | 28 | 24 |
        | 64 | 2,016 | 384 |
        | 1,024 | 523,776 | 10,240 |

        (Bubble sort: comparisons. Merge sort: card moves; it needs even fewer comparisons.)

        For 1,024 cards, **about how many times less work** does merge sort do?
      `,
      options: [
        { text: 'About 2 times', why: 'Much more than that. Even for 64 cards it was already about 5 times: look at the last row.' },
        { text: 'About 10 times', why: 'More than that: 10 × 10,240 is only about 100,000.' },
        { text: 'About 50 times', correct: true },
        { text: 'About 1,000 times', why: 'Not yet: 1,000 × 10,240 would be over ten million.' },
      ],
      explain: `
        523,776 ÷ 10,240 is about 51.

        And the gap keeps widening: for a million cards, merge sort does about 25,000 times less work.
      `,
    },
    {
      id: 'teach-recursion',
      type: 'info',
      title: 'A recipe that uses itself',
      text: `
        Look again at how merge sort was described: *to sort a pile, split it and sort each half*. The recipe for sorting uses sorting. A recipe that calls on itself for a smaller copy of the same problem is called **recursive**.

        Binary search can be written that way too:

        \`\`\`pseudo
        ${SEARCH_CODE.join('\n        ')}
        \`\`\`

        Its last line is the whole recipe again, on a list half as long. Such a recipe does not go round in circles, because the list shrinks every time, until it reaches an **easy case** where the recipe simply stops. Here that is the third line: the middle name is the one you want.
      `,
    },
    {
      id: 'recursion',
      type: 'order',
      code: 'pseudo',
      title: 'Merge sort in five lines',
      text: 'Merge sort fits into five lines, because it uses *itself* on the smaller piles. **Put the lines in order.**',
      items: [
        'to sort a pile:',
        '  if it has 1 card: done',
        '  split it into two halves',
        '  sort each half this way',
        '  merge the two halves',
      ],
      hints: [
        'The easy case comes first: a pile that needs no work at all.',
        'The halves can only be merged after each of them has been sorted.',
      ],
      explain: `
        The easy case comes first, so the recipe knows when to stop. Then split, sort each half **the same way**, and only then merge: two halves can be merged only once each of them is sorted.

        The piles shrink at every step until they reach the easy case, a single card.
      `,
    },
    {
      id: 'million',
      type: 'numeric',
      stretch: true,
      text: `
        Merge sort is given **a million** cards.

        How many levels of merging does it need?
      `,
      answer: 20,
      unit: 'levels',
      wrong: [
        [19, 'Nineteen doublings only reach piles of 524,288 cards. One more level is needed.'],
        [10, 'Ten doublings reach piles of about a thousand cards. A million is a thousand thousands.'],
        [500000, 'That is the number of pairs made on the first level. Count the levels: the pile size doubles each time.'],
        [1000000, 'Far fewer: the piles double in size on every level.'],
      ],
      hints: [
        r`Ten doublings turn 1 into $2^{10} = 1024$: about a thousand.`,
        'A million is a thousand thousands, so ten more doublings get you there.',
      ],
      explain: r`
        $2^{20} = 1{,}048{,}576$, so 20 levels are enough. That is about 20 million card moves.

        Bubble sort would need about 500 billion comparisons for the same row. On a computer that does a billion steps a second: **a fiftieth of a second against more than eight minutes.**
      `,
    },
    {
      id: 'both-halves',
      type: 'choice',
      text: 'Binary search and merge sort both cut a problem in half. **What is the difference?**',
      options: [
        { text: 'Binary search throws one half away; merge sort has to sort both halves', correct: true },
        { text: 'Binary search works on unsorted data; merge sort needs sorted data', why: 'It is the other way round: binary search needs sorted data, and merge sort is one way of producing it.' },
        { text: 'Merge sort only cuts the row in half once', why: 'It keeps halving all the way down to single cards.' },
        { text: 'There is none: they do the same amount of work', why: 'Binary search looks at a handful of items. Merge sort has to move every card on every level.' },
      ],
      explain: r`
        Binary search can ignore half of what is left at every step, so for $n$ items its work is about the number of halvings. That number is written $\log_2 n$: how many times $n$ can be halved before 1 is left.

        Merge sort has to deal with **both** halves, so every level handles all $n$ cards: about $n$ work on each of about $\log_2 n$ levels.
      `,
    },
    {
      id: 'three-parts',
      type: 'match',
      text: 'Divide and conquer has three parts and one easy case. Match each with what merge sort does.',
      pairs: [
        ['Divide', 'Cut the pile into two halves'],
        ['Conquer', 'Sort each half the same way'],
        ['Combine', 'Merge the two sorted halves'],
        ['Easy case', 'One card: already sorted'],
      ],
      explain: 'Divide, conquer, combine: the same pattern turns up all over computing, from sorting and searching to multiplying enormous numbers.',
    },
  ],
  recap: [
    '**Merging** two sorted piles is cheap: keep taking the smaller front card, about one comparison per card.',
    '**Merge sort**: split down to single cards, then merge back up, level by level.',
    'For $n$ cards there are about $\\log_2 n$ levels, and each level handles all $n$ cards.',
    'Solving a problem by splitting it into smaller copies of itself is **divide and conquer**; a recipe that uses itself is **recursive**.',
  ],
  next: 'Next: a way to describe how the work grows, for any algorithm, in a couple of symbols.',
};
