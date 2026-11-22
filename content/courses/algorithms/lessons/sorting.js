// Algorithms · Lesson 3 · Putting Things in Order
import { r } from '../../../kit.js';
import { bubblePass, cardsFigure, group, groupTex, pairCount, passFigure } from '../helpers.js';

/** "5 + 4 + 3 + 2 + 1" for a row of n items. */
const passSum = (n) => Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ');
const sameRow = (a, b) => a.join() === b.join();

/** The worked pass: four cards (the generated "one-pass" rows have five). */
const PASS_DEMO = [7, 3, 9, 5];
/** The row the learner bubble-sorts by hand, and whose comparisons are then counted pass by pass. */
const BUBBLE_ROW = [4, 2, 5, 1, 3];
/** The row lengths the machine sorts in "watch". */
const WATCH_SIZES = [5, 10, 20];
/** The worked "twice as long" example. 40 is not a length that "double" can ask about. */
const DOUBLE_DEMO = 40;

export default {
  id: 'sorting',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'Two at a time',
      text: `
        You can put five cards in order at a glance. A computer cannot glance. It can only **compare two things at a time**.

        Working like that, how many comparisons does a simple, reliable method need to sort **five** numbers?
      `,
      options: [
        { text: '4', why: 'Four comparisons are enough to *check* that a row is already in order. Sorting a jumbled row takes more.' },
        { text: '5', why: 'One comparison per number is not enough: a number may have to be compared with several others.' },
        { text: '10', correct: true },
        { text: '25', why: 'That would be every number against every number, itself included. Fewer will do.' },
      ],
      explain: `
        The method you are about to meet uses **10**. Even the cleverest method there is needs 7 when the numbers fall badly.

        Sorting with nothing but pairwise comparisons is real work. That is why the *method* matters so much.
      `,
    },
    {
      id: 'mystery',
      type: 'interact',
      graded: false,
      attempts: 8,
      title: 'Sort like a machine',
      text: `
        Five boxes, five different weights, and you cannot see inside. **Tap two boxes to compare them.** After a comparison you may **swap** the two.

        Put the boxes in order, **lightest on the left**. When you are sure, press **Check**.
      `,
      widget: { type: 'sort-lab', mode: 'free', hidden: true, n: 5 },
      check: (s) => s.sorted || (s.comparisons === 0
        ? 'Tap two boxes to compare them first.'
        : 'Not in order yet: somewhere a heavier box still stands to the left of a lighter one. Compare neighbours to find it.'),
      solution: { sorted: true },
      hints: [
        'Compare the first two boxes from the left and make sure the heavier one ends up on the right. Then do the same with boxes 2 and 3, then 3 and 4, then 4 and 5.',
        'After one walk along the row like that, the heaviest box stands at the far right. Walk the row again to place the next heaviest, and so on.',
      ],
      explain: `
        You had just two moves: **compare two** and **swap two**. A computer sorting numbers has nothing else to work with.

        The whole art lies in choosing *which* pairs to compare, so that no comparison is wasted.
      `,
    },
    {
      id: 'teach-pass',
      type: 'info',
      title: 'A recipe that always works',
      text: `
        Walk along the row from the left and compare each pair of **neighbours**. If the left one is bigger, **swap** the two. Otherwise **leave** them. One such walk is called a **pass**.

        The picture shows one pass over ${PASS_DEMO.join(', ')}. The biggest number, ${Math.max(...PASS_DEMO)}, is carried along to the end, and there it can stay for good. The rest is not in order yet, so the recipe starts again from the left, and each new pass is one pair shorter.

        This recipe is called **bubble sort**.
      `,
      figure: { ...passFigure(PASS_DEMO), caption: 'One pass. The coloured cards are the pair just compared.' },
    },
    {
      id: 'bubble',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Run bubble sort yourself',
      text: `
        Five bars this time. At each marked pair, **swap** if the left bar is taller; otherwise **leave** it. At the end of a pass the last loose bar is locked, and the walk starts again from the left.

        Follow the recipe until every bar is locked in place.
      `,
      widget: { type: 'sort-lab', mode: 'bubble', values: BUBBLE_ROW },
      check: (s) => s.done || 'Keep going: decide for each marked pair until every bar is locked.',
      solution: { done: true },
      explain: `
        On every pass the tallest bar that was still loose "bubbled" along to the end, and stayed there. That is where bubble sort gets its name.

        You made the same kind of decision ${pairCount(BUBBLE_ROW.length)} times, and never had to look at more than two bars at once.
      `,
    },
    {
      id: 'one-pass',
      type: 'choice',
      review: true,
      gen: (rng) => {
        let start;
        let pass;
        let sorted;
        let bigLast;
        for (let guard = 0; guard < 200; guard++) {
          start = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
          pass = bubblePass(start);
          sorted = start.slice().sort((a, b) => a - b);
          const big = Math.max(...start);
          bigLast = [...start.filter((v) => v !== big), big];
          const rows = [pass.row, sorted, bigLast, start];
          if (rows.every((a, i) => rows.every((b, j) => i === j || !sameRow(a, b)))) break;
        }
        const show = (row) => row.join(', ');
        const big = Math.max(...start);
        return {
          text: `
            Bubble sort makes **one pass** over this row: it compares each pair of neighbours from left to right, and swaps them whenever the left number is bigger.

            What does the row look like after that one pass?
          `,
          figure: cardsFigure(start, { alt: `A row of five cards: ${show(start)}.` }),
          columns: 1,
          options: [
            { text: show(pass.row), correct: true },
            { text: show(sorted), why: 'One pass is not enough to sort everything. It only guarantees that the biggest number reaches the end.' },
            { text: show(bigLast), why: `${big} does end up last. But on its way the pass also swaps other neighbours that are in the wrong order.` },
            { text: show(start), why: 'At least one pair of neighbours is in the wrong order, so the pass must change something.' },
          ],
          hints: [
            'Do it pair by pair: positions 1 and 2, then 2 and 3, then 3 and 4, then 4 and 5. Each time, work with the row as it is *now*.',
            `The first comparison is ${pass.steps[0].left} against ${pass.steps[0].right}: ${pass.steps[0].swapped ? 'swap' : 'leave'}.`,
          ],
          explain: `${pass.steps.map((st, i) => `${i + 1}. ${st.left} and ${st.right}: ${st.swapped ? 'swap' : 'leave'}. Row: ${show(st.row)}`).join('\n')}\n\nThe biggest number, ${big}, has reached the end. The rest is not sorted yet.`,
        };
      },
    },
    {
      id: 'teach-count',
      type: 'info',
      title: 'Count the comparisons',
      text: r`
        How much work was your bubble sort of five bars? Count it pass by pass. Every pass locks one more bar, so every pass is one comparison shorter than the one before:

        | Pass | Loose bars | Comparisons |
        |:-:|:-:|:-:|
        ${Array.from({ length: BUBBLE_ROW.length - 1 }, (_, i) => `| ${i + 1} | ${BUBBLE_ROW.length - i} | ${BUBBLE_ROW.length - 1 - i} |`).join('\n        ')}

        Count the comparisons: 4 on the first pass, then 3, then 2, then 1. That makes **${pairCount(BUBBLE_ROW.length)}** for five bars, whatever order they start in.

        A shortcut for such a sum: multiply the number of bars by one less, then halve. Here that is $${BUBBLE_ROW.length} \times ${BUBBLE_ROW.length - 1} = ${BUBBLE_ROW.length * (BUBBLE_ROW.length - 1)}$, and half of it is ${pairCount(BUBBLE_ROW.length)}.
      `,
    },
    {
      id: 'count',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(6, 10);
        const answer = pairCount(n);
        return {
          text: `
            Bubble sort on **${n} numbers**: the first pass makes ${n - 1} comparisons, the next pass one fewer, and so on down to 1.

            How many comparisons is that in total?
          `,
          answer,
          unit: 'comparisons',
          wrong: [
            [n * n, 'Not every number meets every number on every pass: each pass is one comparison shorter than the one before.'],
            [n * (n - 1), `That would be ${n - 1} comparisons on every one of ${n} passes. But the passes get shorter each time.`],
            [n - 1, 'That is only the first pass. Add the later passes too.'],
          ],
          hints: [
            `Write the sum out: ${passSum(n)}.`,
            `A shortcut: multiply ${n} by ${n - 1}, then halve the result.`,
          ],
          explain: r`
            ${passSum(n)} = **${answer}**.

            The shortcut for a row of $n$ numbers is $n(n-1)/2$. Here: $${n} \times ${n - 1} \div 2 = ${answer}$.
          `,
        };
      },
    },
    {
      id: 'watch',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Let the machine take over',
      text: `
        Ten decisions by hand were fine. For longer rows, let the machine follow the same recipe.

        **Press Sort for 5 bars, then for 10, then for 20.** Watch the number of comparisons each time.
      `,
      widget: { type: 'sort-lab', mode: 'watch', sizes: WATCH_SIZES },
      check: (s) => {
        const missing = [5, 10, 20].filter((size) => !s.runs[size]);
        return missing.length === 0 || `Run all three row lengths. Still to do: ${missing.join(' and ')} bars.`;
      },
      solution: { runs: [5, 10, 20] },
      explain: `
        The same recipe every time. Only the bill changed, and it did not simply double when the row did.
      `,
    },
    {
      id: 'teach-fourfold',
      type: 'info',
      title: 'Twice the row, four times the work',
      text: r`
        What the machine counted:

        | Bars | Comparisons |
        |:----:|:-----------:|
        ${WATCH_SIZES.map((n) => `| ${n} | ${pairCount(n)} |`).join('\n        ')}

        Each time the row gets **twice as long**, the work is about **four times** as much. A row twice as long needs about twice as many passes, and each pass is about twice as long: $2 \times 2 = 4$.

        :::example
        ${DOUBLE_DEMO} numbers take ${group(pairCount(DOUBLE_DEMO))} comparisons. For ${2 * DOUBLE_DEMO} numbers expect about four times as many: $4 \times ${pairCount(DOUBLE_DEMO)} = ${groupTex(4 * pairCount(DOUBLE_DEMO))}$, so roughly 3,000. (The exact count is ${group(pairCount(2 * DOUBLE_DEMO))}.)
        :::
      `,
      figure: {
        type: 'bars', yMax: 200, yStep: 50, yLabel: 'comparisons',
        data: WATCH_SIZES.map((n) => ({ label: `${n} bars`, value: pairCount(n), color: 'orange' })),
        alt: `A bar chart of the comparisons bubble sort makes: ${WATCH_SIZES.map((n) => `${pairCount(n)} for ${n} bars`).join(', ')}. Each bar is about four times as tall as the one before.`,
      },
    },
    {
      id: 'double',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const n = rng.pick([50, 100, 200, 500, 1000]);
        const now = pairCount(n);
        const then = pairCount(2 * n);
        // the doubled count rounded to one significant figure: 19,900 -> 20,000
        const size = Math.pow(10, Math.floor(Math.log10(then)));
        const about = Math.round(then / size) * size;
        return {
          text: `
            Bubble sort needs **${group(now)} comparisons** to sort ${group(n)} numbers.

            Roughly how many does it need for **${group(2 * n)}** numbers?
          `,
          options: [
            { text: `About ${group(about / 2)}`, why: 'That is only twice as many. But a row twice as long needs twice as many passes, *and* each pass is twice as long.' },
            { text: `About ${group(about)}`, correct: true },
            { text: `About ${group(about * 2)}`, why: 'That is eight times as many: too much. Twice the passes, each twice as long, makes four times the work.' },
          ],
          hints: ['A row twice as long needs about twice as many passes. And how long is each pass now?'],
          explain: r`
            Twice as many numbers means about twice as many passes, and each pass is about twice as long: $2 \times 2 = 4$ times the work.

            The exact count is $${groupTex(2 * n)} \times ${groupTex(2 * n - 1)} \div 2 = ${groupTex(then)}$.
          `,
        };
      },
    },
    {
      id: 'selection',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'A second recipe',
      text: `
        Most people sort differently: **find the smallest**, put it first, then find the smallest of the rest, and so on. This recipe is called **selection sort**.

        **Tap the shortest bar that is not locked yet**, again and again. The counter shows how many comparisons a machine needs to *find* each one.
      `,
      widget: { type: 'sort-lab', mode: 'selection', values: [4, 5, 2, 1, 3] },
      check: (s) => s.done || 'Keep going: tap the shortest bar that is not locked yet.',
      solution: { done: true },
      explain: `
        You spot the shortest bar at a glance. A machine has to compare its way along the row: 4 comparisons to be sure of the first one, then 3, then 2, then 1.

        That is **10 comparisons again**: the same bill as bubble sort, though with fewer swaps. A different recipe, the same kind of growth.
      `,
    },
    {
      id: 'recipe',
      type: 'order',
      code: 'pseudo',
      title: 'Bubble sort for a machine',
      text: `
        Here is bubble sort in four lines. "Loose" means *not locked yet*, and as in the first lesson, indented lines belong to the line above them and are repeated with it.

        **Put the lines in order.**
      `,
      items: [
        'repeat until all are locked:',
        '  go along the loose pairs:',
        '    if left > right: swap',
        '  lock the last loose bar',
      ],
      hints: [
        'The line that ends in a colon and is not indented comes first: everything else happens inside it.',
        'A bar can only be locked after a full walk along the row has carried the biggest loose bar to the end.',
      ],
      explain: `
        One walk along the loose pairs is a **pass**. After each pass the biggest loose bar has reached the end, so it can be locked, and the next pass is one pair shorter.

        Four lines. They sort 5 bars or 5 million: only the amount of work changes.
      `,
    },
    {
      id: 'worst-case',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const n = rng.int(4, 8);
        const answer = pairCount(n);
        return {
          text: `
            A row of **${n} numbers** stands in exactly the wrong order: biggest first, smallest last.

            How many **swaps** does bubble sort make before the row is sorted?
          `,
          answer,
          unit: 'swaps',
          wrong: [
            [n - 1, 'That is just the first pass, which carries the biggest number to the end. The others still have to move.'],
            [n, 'More than that: in a reversed row, almost every number has to pass almost every other one.'],
            [Math.floor(n / 2), 'Swapping the ends inwards would do it in that many moves, but bubble sort may only swap **neighbours**.'],
          ],
          hints: [
            'In a reversed row, every pair of neighbours that bubble sort looks at is in the wrong order.',
            `So every comparison turns into a swap. How many comparisons does bubble sort make on ${n} numbers?`,
          ],
          explain: `
            In a reversed row every comparison finds the bigger number on the left, so **every comparison is a swap**:
            ${passSum(n)} = **${answer}**.

            No starting order is worse than that.
          `,
        };
      },
    },
    {
      id: 'summary-match',
      type: 'match',
      text: 'Match each idea from this lesson with what it means.',
      pairs: [
        ['Bubble sort', 'Swap neighbours that are in the wrong order'],
        ['Selection sort', 'Find the smallest, put it first, repeat'],
        ['One pass of bubble sort', 'Carries the biggest loose item to the end'],
        ['A row twice as long', 'About four times the comparisons'],
      ],
      explain: 'Two simple recipes, one shared weakness: the work grows with the *square* of the length of the row.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'In your own words: **why does a row twice as long take about four times as many comparisons** with these methods?',
      model: `
        Twice as many items need about twice as many passes. And each pass walks along a row that is twice as long.
        Twice as many passes, each twice as long: about four times the work.

        Another way to see it: sooner or later nearly every item is compared with nearly every other item, and the number of *pairs* grows with the square of the number of items.
      `,
    },
  ],
  recap: [
    'A computer sorts with two moves only: **compare two** and **swap two**.',
    '**Bubble sort** swaps neighbours that are out of order; each pass locks the biggest loose item at the end.',
    'For $n$ items it makes $(n-1) + (n-2) + \\dots + 1$ comparisons: 10 for 5 items, 45 for 10.',
    'Double the row and the work is about **four times** as much.',
  ],
  next: 'Next: a way of sorting that is not four times slower when the row doubles, only a little more than twice.',
};
