// Proofs: How to Be Certain · Lesson 5 · What Never Changes
import { r, plural } from '../../../kit.js';

/** A 5 × 5 chequered board with a knight in the middle and the eight squares it can jump to. */
const KNIGHT_BOARD = (() => {
  const cell = 40;
  const pad = 6;
  let content = '';
  for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
    content += `<rect class="${(row + col) % 2 ? 'fill-gray-soft' : 'fill-surface'} stroke-ink" stroke-width="1.5" x="${pad + col * cell}" y="${pad + row * cell}" width="${cell}" height="${cell}"/>`;
  }
  for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
    content += `<circle class="fill-orange stroke-ink" stroke-width="2" cx="${pad + (2 + dc + 0.5) * cell}" cy="${pad + (2 + dr + 0.5) * cell}" r="7"/>`;
  }
  content += `<circle class="fill-blue stroke-ink" stroke-width="2.5" cx="${pad + 2.5 * cell}" cy="${pad + 2.5 * cell}" r="14"/>`;
  content += `<text class="fig-label" x="${pad + 2.5 * cell}" y="${pad + 2.5 * cell + 5}" text-anchor="middle" style="fill:#1D1B26">N</text>`;
  return {
    type: 'svg', viewBox: `0 0 ${2 * pad + 5 * cell} ${2 * pad + 5 * cell}`, maxWidth: 230, content,
    alt: 'A five by five chequered board. A knight stands on the square in the middle. The eight squares it can jump to are marked, and all eight have the other colour.',
  };
})();

const CORNERS_SAME = { type: 'domino-board', rows: 4, cols: 4, removed: [0, 15] };

export default {
  id: 'invariants',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The cut chessboard',
      text: r`
        A chessboard has 64 squares, and 32 dominoes cover it exactly: each domino covers two
        neighbouring squares.

        Now cut off two opposite corners. That leaves 62 squares.
        **Can 31 dominoes cover them exactly?**
      `,
      figure: { type: 'domino-board', rows: 8, cols: 8, removed: [0, 63], static: true, counts: false, alt: 'A chessboard drawn without colours. The top-left and bottom-right corner squares have been removed.' },
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Yes: 62 squares are exactly enough for 31 dominoes' },
        { text: 'No: it cannot be done', correct: true },
        { text: 'Nobody knows: there are far too many arrangements to check' },
      ],
      explain: r`
        It cannot be done. In a few minutes you will be able to prove that, without laying a
        single domino on the big board.

        First, try a small one.
      `,
    },
    {
      id: 'try-small',
      type: 'interact',
      graded: false,
      title: 'Try a small one',
      text: r`
        The same puzzle on a $4 \times 4$ board. Two opposite corners are gone, 14 squares are
        left, and 7 dominoes would cover them.

        **Cover as much of the board as you can.** Stop when no domino fits any more.
      `,
      widget: { ...CORNERS_SAME, alt: 'A four by four board without colours. The top-left and bottom-right corner squares have been removed.' },
      check: (s) => s.complete || s.stuck || `There is still room: ${s.open} squares are open, and two of them are neighbours.`,
      solution: { pieces: [[1, 2], [3, 7], [5, 6], [4, 8], [9, 10], [12, 13]] },
      explain: r`
        Six dominoes at best, and at least two squares are left over. Try as often as you like.

        But trying proves nothing: perhaps the seventh domino fits in an arrangement you did not
        think of. On this small board you could patiently check every arrangement. On the
        $8 \times 8$ board there are far too many. What is needed is a *reason*.
      `,
    },
    {
      id: 'colour-it',
      type: 'choice',
      title: 'Add some colour',
      text: r`
        The same board, coloured like a chessboard. Both missing corners were **light** squares.

        Lay a few dominoes and watch the counters. **Whatever you do, each domino covers …**
      `,
      figure: { ...CORNERS_SAME, checker: true, alt: 'The four by four board with two opposite corners removed, now coloured like a chessboard. Dominoes can be laid on it, and counters show how many dark and light squares are still open.' },
      columns: 1,
      options: [
        { text: 'one dark square and one light square', correct: true },
        { text: 'two squares of the same colour', why: 'Neighbouring squares always have different colours, and a domino covers two neighbours.' },
        { text: 'it depends on whether the domino lies flat or stands upright', why: 'Either way it covers two neighbouring squares, and neighbours always differ in colour.' },
      ],
      explain: r`
        Squares that share a side always have different colours, so every domino covers exactly
        one dark and one light square. Now count the colours.
      `,
    },
    {
      id: 'count-colours',
      type: 'fill',
      review: true,
      title: 'Count the colours',
      text: r`
        A chessboard has 32 dark and 32 light squares, and opposite corners have the same colour.
        Two opposite **light** corners are removed, and 31 dominoes are supposed to cover the rest.
      `,
      template: `
        The cut board has [[32]] dark squares and [[30]] light squares.

        Every domino covers one dark and one light square, so 31 dominoes cover [[31]] dark squares and [[31]] light squares.

        That does not match the board, so covering it exactly is [[possible|*impossible|a matter of luck]].
      `,
      hints: ['Start from the full board, 32 of each colour, and take away the two light corners.'],
      explain: r`
        31 dominoes need 31 dark and 31 light squares. The board offers 32 and 30. No arrangement
        can get round that, so there is nothing left to try.

        The philosopher Max Black published this puzzle in 1946, and it has been a favourite ever since.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Invariants',
      text: r`
        You found a quantity that **no move can change**:

        $$ \text{open dark} - \text{open light} $$

        Each domino takes away one of each, so this difference keeps the value it started with: 2.
        On a fully covered board it would be 0. You cannot get from 2 to 0.

        :::key
        An **invariant** is a quantity that stays the same whatever moves are made. If the goal
        needs a different value from the start, the goal is **impossible**.
        :::

        That is the whole difference between "I tried many times and failed" and "nobody can
        ever succeed". (Checking **every** arrangement of a small board would be a proof too.
        Checking many of them is not.)
      `,
    },
    {
      id: 'fix-it',
      type: 'interact',
      title: 'When the invariant has no objection',
      text: r`
        This time one **light** corner and one **dark** corner are missing. Seven dark and seven
        light squares are left, so the invariant does not forbid a tiling.

        Does one exist? **Cover the whole board.**
      `,
      widget: { type: 'domino-board', rows: 4, cols: 4, removed: [0, 3], checker: true, alt: 'A four by four chequered board. The two top corners, one light and one dark, have been removed.' },
      check: (s) => {
        if (s.complete) return true;
        if (s.stuck) return `No domino fits any more, but ${s.open} squares are still open. Take a domino off and rearrange.`;
        return `${s.open} squares are still open.`;
      },
      solution: { pieces: [[1, 2], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15]] },
      hints: ['Lay every domino flat, side by side, one row at a time.'],
      explain: r`
        Here it works. But notice the logic: an invariant can only ever say **no**. When it has
        no objection, that proves nothing; you still had to find a tiling yourself.

        (On a real chessboard it turns out that removing one dark and one light square, wherever
        they are, always leaves a board that can be covered. That fact needs its own proof.)
      `,
    },
    {
      id: 'coins-try',
      type: 'interact',
      graded: false,
      title: 'Two at a time',
      text: r`
        Five coins. One move turns over **exactly two** coins, any two you like. The goal is five heads.

        **Give it a real try: make at least six moves.** Keep an eye on the number of tails.
      `,
      widget: { type: 'coin-pairs', coins: 'THTTH', alt: 'Five coins in a row: tails, heads, tails, tails, heads.' },
      check: (s) => s.allHeads || s.moves >= 6 || `${plural(s.moves, 'move')} so far. Make at least six, and watch what happens to the number of tails.`,
      solution: { coins: 'HHTHH', moves: 6 },
      explain: r`
        Three tails, then one, then three again, perhaps five … but never zero.

        Trying for an hour would not settle whether five heads can be reached. An invariant will.
      `,
    },
    {
      id: 'coins-why',
      type: 'fill',
      text: 'Work out what one move can do to the **number of tails**.',
      template: `
        If the two coins both show tails, the number of tails goes down by [[2]].

        If both show heads, it goes up by [[2]].

        If one shows heads and the other tails, it changes by [[0]].

        The number of tails starts at 3, which is odd, so it stays [[even|*odd]] for ever. Five heads would mean 0 tails, and 0 is [[*even|odd]]. So the goal is [[possible|*impossible]].
      `,
      hints: ['Take the three cases one at a time. Two tails turned over become two heads: how many tails is that fewer?'],
      explain: r`
        Two tails fewer, two more, or no change. The number of tails starts odd, the goal needs
        an even number, and no sequence of moves gets from one to the other.
      `,
    },
    {
      id: 'teach-parity',
      type: 'info',
      title: 'Odd stays odd',
      text: r`
        A move changes the number of tails by $-2$, $0$ or $+2$, so it can never switch between
        odd and even. Whether a number is odd or even is called its **parity**. The parity of
        the number of tails is the invariant.

        :::example Four coins
        **T H T T** has 3 tails: odd. All heads means 0 tails, and 0 is even. So all heads can
        never be reached.

        **T H H T** has 2 tails: even, like the goal. The invariant has no objection, which
        proves nothing yet. But here a way exists: turn over the two tails. Try it.
        :::
      `,
      figure: { type: 'coin-pairs', coins: 'THHT', alt: 'Four coins in a row: tails, heads, heads, tails. Turning over the two tails makes all four show heads.' },
    },
    {
      id: 'coins-can',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const n = rng.int(5, 8);
        let coins;
        do { coins = Array.from({ length: n }, () => (rng.bool() ? 'H' : 'T')); } while (!coins.includes('T') || !coins.includes('H'));
        const tails = coins.filter((c) => c === 'T').length;
        const even = tails % 2 === 0;
        return {
          text: `
            A row of coins (H is heads, T is tails):

            **${coins.join(' ')}**

            One move turns over **exactly two** coins. **Can you ever reach all heads?**
          `,
          shuffle: false,
          columns: 1,
          options: [
            { text: 'Yes', correct: even, why: even ? undefined : `There ${tails === 1 ? 'is 1 tail' : `are ${tails} tails`}: an odd number. A move changes the number of tails by 2 or by 0, so it can never reach 0.` },
            { text: 'No: the number of tails is odd, and it stays odd', correct: !even, why: even ? `Count again: there are ${tails} tails, which is an even number.` : undefined },
            { text: 'No: the number of tails is even, and it stays even', why: even ? 'Even is good news here: 0 tails is an even number too. Turn the tails over two at a time.' : `Count again: there ${tails === 1 ? 'is 1 tail' : `are ${tails} tails`}, which is an odd number.` },
          ],
          explain: even
            ? `There are ${tails} tails. Turn them over two at a time: after ${plural(tails / 2, 'move')} every coin shows heads. The parity of the number of tails had no objection, and here a way exists.`
            : `There ${tails === 1 ? 'is 1 tail' : `are ${tails} tails`}: an odd number. Every move changes the number of tails by −2, 0 or +2, so it stays odd and can never be 0.`,
        };
      },
    },
    {
      id: 'example-erase',
      type: 'info',
      title: 'The parity of a sum',
      text: r`
        Parity can be the invariant even when the quantity itself keeps changing. Ask of a
        move: **by how much can it change the total?**

        :::example On the board: 3, 4, 6
        One move: rub out two numbers and write their difference in their place.
        1. The sum starts at $3 + 4 + 6 = 13$: odd.
        2. Rub out 6 and 4, write 2. The board shows 3 and 2, and the sum is 5. It dropped by 8: twice the smaller number.
        3. It always goes that way. Replacing $a$ and $b$ by $a - b$ lowers the sum by $2b$, an even amount. So the sum stays odd.
        4. At the end the sum *is* the last number. So the last number is odd, whatever the moves.
        :::
      `,
    },
    {
      id: 'erase-game',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const n = rng.int(5, 9);
        const total = (n * (n + 1)) / 2;
        const odd = total % 2 === 1;
        const word = odd ? 'odd' : 'even';
        return {
          title: 'A different invariant',
          text: r`
            The numbers $1, 2, 3, \ldots, ${n}$ are written on a board. One move: rub out any two
            numbers and write their **difference** in their place. After ${n - 1} moves a single
            number is left.

            **What can you say about that last number?**
          `,
          shuffle: false,
          columns: 1,
          options: [
            { text: 'It is certainly odd', correct: odd, why: odd ? undefined : r`The sum of the numbers at the start is ${total}, which is even, and a move cannot change whether the sum is odd or even.` },
            { text: 'It is certainly even', correct: !odd, why: odd ? r`The sum of the numbers at the start is ${total}, which is odd, and a move cannot change whether the sum is odd or even.` : undefined },
            { text: 'It could be odd or even, depending on the moves', why: r`Replacing $a$ and $b$ by their difference lowers the sum of all the numbers by twice the smaller one: an even amount. So the sum is always ${word}, whatever the moves.` },
          ],
          hints: [
            r`Look for something no move can change. What happens to the **sum** of all the numbers on the board when $a$ and $b$ are replaced by $a - b$?`,
            r`The sum drops by $2b$, an even amount. So the sum stays odd if it starts odd, and even if it starts even.`,
          ],
          explain: r`
            Replace $a$ and $b$ (say $a \ge b$) by $a - b$: the sum of everything on the board
            drops by $2b$, an even amount. So the *parity* of the sum is an invariant.

            At the start the sum is $1 + 2 + \cdots + ${n} = ${total}$, which is ${word}. At the end the sum *is* the last number. So the last number is ${word}.
          `,
        };
      },
    },
    {
      id: 'knight',
      type: 'choice',
      stretch: true,
      title: 'A knight on a small board',
      text: r`
        A chess knight jumps in an L: two squares one way and one square sideways.
        **Every jump takes it to a square of the opposite colour.**

        On a $5 \times 5$ board, a knight is to visit all 25 squares, each exactly once, and
        then jump back to where it started: 25 jumps in all. **Can that be done?**
      `,
      figure: KNIGHT_BOARD,
      columns: 1,
      options: [
        { text: 'No: after 25 jumps the knight is on the opposite colour from its starting square', correct: true },
        { text: 'Yes: with enough patience a route can be found', why: 'Patience cannot help. The colour changes with every jump, and 25 is an odd number.' },
        { text: 'No: a knight can never visit every square of a board', why: 'It can: routes that visit all 25 squares exist. The trouble is only the jump back to the start.' },
        { text: 'It depends on the starting square', why: 'The colour argument works the same way from every starting square.' },
      ],
      hints: ['What colour is the knight on after 1 jump? After 2? After 3?'],
      explain: r`
        The colour flips with every jump: opposite colour after 1 jump, the original colour after
        2, and so on. After an **odd** number of jumps the knight is on the opposite colour, so
        after 25 jumps it cannot be back where it began.

        Here the useful quantity is not constant, but it changes in a completely predictable
        way. That does the same job as an invariant.
      `,
    },
    {
      id: 'sort-proofs',
      type: 'bucket',
      text: 'Each line is offered as a reason why a puzzle has **no solution**. Which of them prove it?',
      buckets: ['Proves it is impossible', 'Proves nothing'],
      items: [
        { text: 'Every move keeps the number of tails odd, and the goal has no tails.', bucket: 0 },
        { text: 'I tried two hundred arrangements, and none of them worked.', bucket: 1, why: 'Two hundred failures are evidence. The next arrangement might be the one.' },
        { text: 'Every domino covers one dark and one light square, but 32 dark and 30 light squares are left.', bucket: 0 },
        { text: 'The best puzzle solvers in the world have all given up.', bucket: 1, why: 'Giving up is not a proof, whoever does it.' },
        { text: 'A computer went through every possible arrangement, and none worked.', bucket: 0, why: 'Checking every case of a finite puzzle is a proof, if not an elegant one. Checking many cases is not.' },
        { text: 'A computer searched for a week, found nothing, and ran out of time.', bucket: 1, why: 'A search that did not finish is still only "tried and failed".' },
      ],
      explain: 'A proof of impossibility has to cover every possible attempt: with an invariant, or by truly checking them all. A pile of failed attempts covers only the attempts in the pile.',
    },
    {
      id: 'teach-toolbox',
      type: 'info',
      title: 'Five tools',
      text: r`
        You have now met five kinds of argument. Each suits its own kind of claim.

        - **Counterexample.** An "every" claim is *false*: show one case that breaks it. $n = 40$ broke Euler's formula.
        - **Contradiction.** Something *does not exist*: suppose it does, and reach something impossible. No fraction squares to 2.
        - **Induction.** A claim about *every* $n$: a first case, then a step from each case to the next. The odd numbers add up to $n^2$.
        - **Pigeonhole.** A coincidence *must happen*: more pigeons than holes. Two people with equally many hairs.
        - **Invariant.** A goal *can never be reached*: a quantity that no move changes. The cut chessboard.
      `,
    },
    {
      id: 'choose-tool',
      type: 'match',
      review: true,
      title: 'Choose your tool',
      text: 'You now have five ways to settle a question for good. **Match each claim to the kind of argument that fits it best.**',
      pairs: [
        ['There is no largest even number', 'Contradiction: suppose there is one, and build a larger one'],
        [r`$1 + 2 + 4 + \cdots + 2^n = 2^{n+1} - 1$ for every whole number $n \ge 1$`,'Induction: a first case, then a step from each case to the next'],
        ['Among 400 people, two have the same birthday', 'Pigeonhole: more people than possible dates'],
        ['Seven coins showing tails can never all become heads by turning two at a time', 'Invariant: a quantity that no move can change'],
        ['"Every prime number is odd" is false', 'Counterexample: one case that breaks the claim'],
      ],
      explain: r`
        A claim that something does not exist invites contradiction. A claim about every $n$
        invites induction. A promised coincidence is a job for pigeons, an impossible goal for an
        invariant, and a false "every" needs just one counterexample (here, the prime 2).
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        "Nobody has ever found a way" and "there is no way" sound alike.

        **What is the difference, and how does an invariant get you from the first to the second?**
      `,
      model: r`
        "Nobody has found a way" is a report about the attempts made so far. It leaves open that
        the next attempt succeeds. "There is no way" is a claim about every possible attempt,
        including the ones nobody has thought of.

        An invariant covers all attempts at once, because it does not depend on which moves are
        made: whatever you do, the quantity keeps its value (the number of tails stays odd, the
        open dark squares stay two ahead of the light ones). If the goal needs a different
        value, no sequence of moves can reach it.
      `,
    },
  ],
  recap: [
    'To prove that something can **never** be done, look for an **invariant**: a quantity no move can change.',
    'If the goal needs a different value of the invariant from the start, the goal is impossible.',
    'Colourings and parity (odd or even) are the most common invariants.',
    'An invariant can only say no. When it has no objection, you still have to find a way.',
  ],
  next: 'Next, the last lesson: the same tools, turned on infinity itself.',
};
