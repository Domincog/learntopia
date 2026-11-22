// Probability & Chance · Lesson 2 · Two Dice, 36 Worlds
import { r, frac } from '../../../kit.js';
import { diceWhere, diceCount, dicePairs, fracText, rawFrac } from '../helpers.js';

const SEVEN = (a, b) => a + b === 7;
const HAS_SIX = (a, b) => a === 6 || b === 6;

/** "= 1/6" when a fraction over 36 can be simplified, otherwise nothing. */
const simplified = (n) => (fracText(n, 36) === `${n}/36` ? '' : ` = ${frac(n, 36)}`);

/** Feedback for an answer that is close to k/36 but not exact (a rounded decimal). */
const nearMiss = (target) => (value) => (Math.abs(value - target) < 0.006
  ? 'Very close, but rounded. Give the exact fraction: the number of outcomes out of 36.'
  : null);

// Events for generated practice. "First" and "second" die, so the question also works without the coloured board.
const EVENTS = [
  { text: 'both dice show the **same number**', test: (a, b) => a === b, how: 'There is exactly one double for each number, from (1, 1) to (6, 6).' },
  { text: 'the total is **10 or more**', test: (a, b) => a + b >= 10, how: 'Three ways to make 10, two ways to make 11 and one way to make 12.' },
  { text: 'the total is **9 or more**', test: (a, b) => a + b >= 9, how: 'Four ways to make 9, three for 10, two for 11 and one for 12.' },
  { text: 'the total is **4 or less**', test: (a, b) => a + b <= 4, how: 'One way to make 2, two ways to make 3 and three ways to make 4.' },
  { text: 'the total is **5 or less**', test: (a, b) => a + b <= 5, how: 'One way to make 2, two for 3, three for 4 and four for 5.' },
  { text: 'the two numbers **differ by exactly 2**', test: (a, b) => Math.abs(a - b) === 2, how: 'The pairs 1 & 3, 2 & 4, 3 & 5 and 4 & 6 can each come up in two orders.', half: '1 then 3, or 3 then 1' },
  { text: 'the two numbers **differ by exactly 3**', test: (a, b) => Math.abs(a - b) === 3, how: 'The pairs 1 & 4, 2 & 5 and 3 & 6 can each come up in two orders.', half: '1 then 4, or 4 then 1' },
  { text: '**at least one** die shows a 1', test: (a, b) => a === 1 || b === 1, how: 'Six outcomes have a 1 on the first die and six have a 1 on the second, but (1, 1) is in both lists: 6 + 6 − 1.', double: true },
  { text: '**neither** die shows a 6', test: (a, b) => a !== 6 && b !== 6, how: 'Each die then has 5 faces to choose from: 5 × 5.' },
  { text: 'both dice show an **even** number', test: (a, b) => a % 2 === 0 && b % 2 === 0, how: 'Each die has 3 even faces: 3 × 3.' },
  { text: 'the first die shows a **bigger** number than the second', test: (a, b) => a > b, how: 'Take away the 6 doubles from the 36 outcomes. In half of the remaining 30, the first die is the bigger one.' },
  { text: 'the **larger** of the two numbers is a 4 (a double 4 counts)', test: (a, b) => Math.max(a, b) === 4, how: 'One die shows 4 and the other shows 4 or less: (4, 1), (4, 2), (4, 3), (4, 4), (1, 4), (2, 4), (3, 4).' },
];

export default {
  id: 'counting-outcomes',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A favourite number',
      text: `
        You roll two dice and add up the two numbers.

        **Which total will come up most often?**
      `,
      shuffle: false,
      options: [
        { text: '6' },
        { text: '7', correct: true },
        { text: '12' },
        { text: 'Every total from 2 to 12 is equally likely' },
      ],
      explain: `
        It is 7, and the totals are far from equally likely: over many rolls,
        a 7 turns up about six times as often as a 2.

        Do not take that on trust. Roll the dice.
      `,
    },
    {
      id: 'simulate',
      type: 'interact',
      graded: false,
      title: 'Roll them',
      text: `
        Here are two dice. Each roll adds one more result to the chart.

        **Roll at least 300 times** and watch which totals pile up.
      `,
      widget: { type: 'chance-lab', kind: 'dice-sum', line: false, target: false, buttons: [1, 10, 100], max: 2000 },
      check: (s) => s.trials >= 300 || `That is ${s.trials} ${s.trials === 1 ? 'roll' : 'rolls'} so far. Keep going to at least 300: the pattern needs time to show.`,
      solution: { trials: 300 },
      explain: `
        A mountain, with its peak at 7 or right next to it. The totals in the
        middle come up far more often than 2 or 12.

        The dice are not cheating. There are simply **more ways** to make a 7.
        Time to count them.
      `,
    },
    {
      id: 'teach-board',
      type: 'info',
      title: 'Every way two dice can land',
      text: r`
        To count ways, you need to see them all. This board has a row for
        each number on the [blue die]{.blue} and a column for each number on
        the [orange die]{.orange}.

        Each cell is one **outcome**: one way the two dice can land. Blue 2
        with orange 5 is written (2, 5). Blue 5 with orange 2 is another
        cell, (5, 2): a **different outcome**, although the same two numbers show.

        Six rows of six cells make $6 \times 6 = 36$ outcomes, and all 36
        are equally likely.
      `,
      figure: {
        type: 'dice-grid', static: true, show: 'pair', cell: 44, on: [[2, 5], [5, 2]],
        alt: 'A 6 by 6 board of outcomes: one row for each number on the blue die, one column for each number on the orange die. Two cells are highlighted: blue 2 with orange 5, and blue 5 with orange 2.',
        caption: 'Highlighted: (2, 5) and (5, 2).',
      },
    },
    {
      id: 'grid-seven',
      type: 'interact',
      title: 'Every way to make 7',
      text: `
        Here is the board: the [blue die]{.blue} picks the row and the
        [orange die]{.orange} picks the column.

        **Tap every outcome whose total is 7.**
      `,
      widget: { type: 'dice-grid', show: 'pair', counter: 'Selected' },
      check: (s) => {
        const off = s.cells.find(([a, b]) => a + b !== 7);
        if (off) return `Blue ${off[0]} and orange ${off[1]} add up to ${off[0] + off[1]}, not 7.`;
        if (s.count === 0) return 'Tap a cell to select it.';
        if (s.count < 6) return `You have found ${s.count} so far, and all of them are right. There are more: check every row.`;
        return true;
      },
      solution: { on: diceWhere(SEVEN) },
      hints: [
        'Go row by row. If the blue die shows 1, what must the orange die show?',
        'Every row has exactly one cell that works: 1 with 6, 2 with 5, 3 with 4, and so on.',
      ],
      explain: `
        Six outcomes make 7, one in every row:
        (1, 6), (2, 5), (3, 4), (4, 3), (5, 2) and (6, 1).
      `,
    },
    {
      id: 'sample-space',
      type: 'info',
      title: 'From counting to probability',
      text: r`
        Here is the board again, this time showing the total in each cell.
        Every total sits on its own diagonal, and 7 owns the longest one.

        The complete list of outcomes, all 36 cells, is called the
        **sample space**. An **event**, such as "the total is 7", is a set
        of outcomes from it. The 36 cells are equally likely. The 11 totals
        are not.

        :::example
        Six of the 36 cells show a 7, so
        $P(\text{total is 7}) = \frac{6}{36} = \frac{1}{6}$.

        Only one cell, (1, 1), shows a 2, so $P(\text{total is 2}) = \frac{1}{36}$.
        :::
      `,
      figure: {
        type: 'dice-grid', static: true, show: 'sum', on: SEVEN,
        alt: 'The 6 by 6 board of outcomes showing the total in each cell. The six cells with a total of 7 form a diagonal from the top right to the bottom left and are highlighted.',
      },
    },
    {
      id: 'one-and-two',
      type: 'choice',
      text: `
        You roll the two dice once. Which is more likely:
        **"a 1 and a 2"** (either way round) or **"two 1s"**?
      `,
      figure: {
        type: 'dice-grid', show: 'pair', counter: false, cell: 44,
        alt: 'The board of all 36 outcomes. You can tap cells to mark them.',
        caption: 'Tap cells to mark them if it helps you count.',
      },
      options: [
        { text: '"A 1 and a 2": it is twice as likely', correct: true },
        { text: '"Two 1s"', why: 'Two 1s can only happen one way: blue 1 with orange 1.' },
        { text: 'They are equally likely', why: 'Count cells. "A 1 and a 2" covers two of them: blue 1 with orange 2, and blue 2 with orange 1. "Two 1s" covers only one.' },
      ],
      explain: r`
        "A 1 and a 2" covers **two** cells, (1, 2) and (2, 1), so its probability
        is $\frac{2}{36}$. "Two 1s" covers one cell: $\frac{1}{36}$.

        Forgetting that the dice are two separate objects is the classic
        mistake in this kind of counting.
      `,
    },
    {
      id: 'count-sum',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.pick([3, 4, 5, 6, 8, 9, 10, 11]);
        const test = (a, b) => a + b === k;
        const ways = diceCount(test);
        const unordered = Math.ceil(ways / 2);
        const low = k <= 7 ? 1 : k - 6;   // one concrete pair that makes k, e.g. 1 and 4 for a total of 5
        const high = k - low;
        return {
          text: `
            You roll two dice. What is the probability that the **total is ${k}**?

            Give your answer as a fraction.
          `,
          answer: `${ways}/36`,
          display: fracText(ways, 36),
          tolerance: 0.0005,
          wrong: [
            [1 / 11, 'There are 11 possible totals, but they are not equally likely. Count outcomes out of 36 instead.'],
            [unordered / 36, `The dice are two separate objects: ${low} then ${high}, and ${high} then ${low}, are different outcomes. Count both orders.`],
            [unordered / 21, 'It looks as if each pair of numbers was counted once, whichever die shows which. With two separate dice there are 36 equally likely outcomes, and most pairs appear twice.'],
            [1 / 6, 'That is the probability of a total of 7, the most likely total. This one has fewer outcomes.'],
          ],
          feedback: nearMiss(ways / 36),
          hints: [
            `List the ways to make ${k}: start with the smallest number the first die can show, then go up one at a time.`,
            `The ways are ${dicePairs(test)}. How many is that, out of 36?`,
          ],
          explain: r`${ways} of the 36 outcomes add up to ${k}: ${dicePairs(test)}. So $P(\text{total is ${k}}) = ${rawFrac(ways, 36)}${simplified(ways)}$.`,
        };
      },
    },
    {
      id: 'at-least-one-six',
      type: 'interact',
      title: 'A trickier event',
      text: `
        New event: **at least one of the two dice shows a 6**. That means
        the blue die shows 6, or the orange die shows 6, or both do.

        Tap every outcome that fits.
      `,
      widget: { type: 'dice-grid', show: 'pair', counter: 'Selected' },
      check: (s) => {
        const off = s.cells.find(([a, b]) => !HAS_SIX(a, b));
        if (off) return `Blue ${off[0]} with orange ${off[1]}: there is no 6 in that one.`;
        if (s.count === 0) return 'Tap a cell to select it.';
        if (s.count === 11) return true;
        const blue = s.cells.filter(([a]) => a === 6).length;
        const orange = s.cells.filter(([, b]) => b === 6).length;
        if (blue === 6 && orange === 1) return 'That is every outcome where the blue die shows 6. The orange die can show a 6 too.';
        if (orange === 6 && blue === 1) return 'That is every outcome where the orange die shows 6. The blue die can show a 6 too.';
        return `You have ${s.count} so far, all correct. "At least one 6" also includes outcomes with just one 6, on either die.`;
      },
      solution: { on: diceWhere(HAS_SIX) },
      hints: ['Look for one whole row and one whole column. Which cell lies in both?'],
      explain: r`
        The whole bottom row (blue shows 6) and the whole right-hand column
        (orange shows 6). That is 6 + 6 cells, except that the corner (6, 6)
        sits in both and is **one** outcome, not two. So there are 11:

        $$ P(\text{at least one 6}) = \frac{11}{36} $$
      `,
    },
    {
      id: 'example-event',
      type: 'info',
      title: 'Any event: find, count, divide',
      text: r`
        The same three moves work for every event on two dice: find its
        cells, count them, divide by 36.

        :::example
        **The total is 11 or more.** That means a total of 11 or of 12: the
        cells (5, 6), (6, 5) and (6, 6). Three cells out of 36:
        $\frac{3}{36} = \frac{1}{12}$.
        :::

        Two things to watch. A cell that fits in two ways still counts
        **once**, like the corner (6, 6) a moment ago. And two orders are
        two cells: (5, 6) and (6, 5) both count.
      `,
      figure: {
        type: 'dice-grid', static: true, show: 'sum', cell: 44, on: (a, b) => a + b >= 11,
        alt: 'The 6 by 6 board showing the total in each cell. The three cells in the bottom right corner, with totals 11, 11 and 12, are highlighted.',
        caption: 'Totals of 11 or more: three cells.',
      },
    },
    {
      id: 'event-prob',
      type: 'numeric',
      review: true,
      figure: {
        type: 'dice-grid', show: 'pair', counter: false, cell: 40,
        alt: 'The board of all 36 outcomes. You can tap cells to mark them.',
        caption: 'First die: rows. Second die: columns. Tap cells to mark them if it helps you count.',
      },
      gen: (rng) => {
        const ev = rng.pick(EVENTS);
        const count = diceCount(ev.test);
        const wrong = [];
        if (ev.half) wrong.push([count / 2 / 36, `Each of those pairs can come up in two orders: for example ${ev.half}. Count both.`]);
        if (ev.double) wrong.push([12 / 36, 'Six outcomes for the first die plus six for the second counts one outcome twice: the one where both dice show it.']);
        return {
          text: `
            You roll two dice. What is the probability that ${ev.text}?

            Give your answer as a fraction.
          `,
          answer: `${count}/36`,
          display: fracText(count, 36),
          tolerance: 0.0005,
          wrong,
          feedback: nearMiss(count / 36),
          hints: [
            'There are 36 equally likely outcomes. Picture the 6 by 6 board, or sketch it, and count the cells that fit.',
            ev.how,
          ],
          explain: r`${ev.how} That makes ${count} of the 36 outcomes: $P = ${rawFrac(count, 36)}${simplified(count)}$.`,
        };
      },
    },
    {
      id: 'teach-multiply',
      type: 'info',
      title: 'Counting without a board',
      text: r`
        You do not need to draw every outcome to know how many there are.
        Each of the 6 faces of one die can go with each of the 6 faces of
        the other: $6 \times 6 = 36$.

        :::key
        When an experiment has several parts, **multiply** the number of
        possibilities of each part.
        :::

        :::example
        Flip a coin (H or T) and spin a spinner with three equal sections:
        $2 \times 3 = 6$ outcomes.

        H-red, H-green, H-blue, T-red, T-green, T-blue

        If every part is fair, the six are equally likely, so
        $P(\text{tails and green}) = \frac{1}{6}$.
        :::
      `,
    },
    {
      id: 'multiply',
      type: 'fill',
      text: `
        Each possibility of one part can go with each possibility of the others.

        **Fill in the number of outcomes.**
      `,
      template: `
        Two dice: 6 × 6 = [[36]] outcomes.

        Two coins: 2 × 2 = [[4]] outcomes.

        Three coins: 2 × 2 × 2 = [[8]] outcomes.

        One coin and one die: [[12]] outcomes.
      `,
      explain: `
        Multiply the number of possibilities of each part. A coin and a die
        give 2 × 6 = 12 outcomes: each of the 2 sides can go with each of
        the 6 faces.
      `,
    },
    {
      id: 'two-coins',
      type: 'choice',
      review: true,
      text: 'You flip two coins. What is the probability of getting **one head and one tail**?',
      options: [
        { text: r`$\frac{1}{2}$`, correct: true },
        { text: r`$\frac{1}{3}$`, why: 'That treats "two heads", "one of each" and "two tails" as equally likely. But "one of each" can happen in two ways: head then tail, or tail then head.' },
        { text: r`$\frac{1}{4}$`, why: 'That is the probability of one particular outcome, such as head then tail. There is a second way to get one of each.' },
      ],
      explain: r`
        List the outcomes: HH, HT, TH, TT. Four equally likely outcomes, and two
        of them (HT and TH) have one head and one tail: $\frac{2}{4} = \frac{1}{2}$.

        :::fun
        In the 1750s the French mathematician d'Alembert argued in print for an
        answer based on three cases instead of four. Even experts trip over this.
        :::
      `,
    },
    {
      id: 'difference',
      type: 'choice',
      stretch: true,
      title: 'Mind the gap',
      text: `
        Roll two dice and look at the **difference** between the two numbers
        (the bigger one minus the smaller one).

        **Which difference is the most likely?**
      `,
      figure: {
        type: 'dice-grid', show: 'pair', counter: 'Marked', cell: 44,
        alt: 'The board of all 36 outcomes. You can tap cells to mark them.',
        caption: 'Use the board to count: tap cells to mark them.',
      },
      shuffle: false,
      options: [
        { text: '0 (a double)', why: 'There are 6 doubles. Now count the cells where the two numbers differ by exactly 1.' },
        { text: '1', correct: true },
        { text: '2', why: 'A difference of 2 has 8 outcomes. One of the other options has more.' },
        { text: '3', why: 'Only 6 outcomes: (1, 4), (2, 5), (3, 6) and the same three the other way round.' },
      ],
      hints: [
        'On the board, outcomes with the same difference lie along a diagonal. The doubles run from the top left to the bottom right.',
        'A difference of 1 uses the two diagonals right next to the doubles: one on each side.',
      ],
      explain: r`
        A difference of 0 has 6 outcomes: the doubles. A difference of 1 has
        **10**: five on each side of the doubles, such as (1, 2) and (2, 1).
        After that the counts fall: 8, 6, 4 and 2 outcomes for differences of
        2, 3, 4 and 5.

        So a difference of 1 is the most likely, with probability $\frac{10}{36}$.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        In your own words: **why is a total of 7 more likely than a total of 2**,
        when each is just one of the numbers you can roll?
      `,
      model: `
        There is only one way to roll a 2: both dice must show 1. But there are
        six ways to roll a 7: (1, 6), (2, 5), (3, 4), (4, 3), (5, 2) and (6, 1).
        All 36 outcomes are equally likely, so the total with more outcomes
        behind it comes up more often.
      `,
    },
  ],
  recap: [
    'Two dice have 6 × 6 = 36 equally likely outcomes. (2, 5) and (5, 2) are different outcomes.',
    'The probability of an event is the number of its outcomes divided by the number of all outcomes.',
    'Totals are **not** equally likely: 7 can be made in six ways, 2 and 12 in only one.',
    'When an experiment has several parts, multiply to count its outcomes.',
  ],
  next: 'Next: what do these probabilities promise about real rolls? Less than you might hope in the short run, and more in the long run.',
};
