// Proofs: How to Be Certain · Lesson 3 · Dominoes
import { r, ordinal, plural } from '../../../kit.js';
import { layersFigure, trominoTiling, centreTromino } from '../helpers.js';

/** The 4 × 4 block that sits in the bottom-left corner of a 5 × 5 grid of tiles (row-major indices). */
const OLD_SQUARE = [];
for (let row = 1; row <= 4; row++) for (let col = 0; col <= 3; col++) OLD_SQUARE.push(row * 5 + col);

const HOLE_4 = 6;   // the square missing from the 4 × 4 board
const HOLE_8 = 10;  // the square missing from the 8 × 8 board (it lies in the top-left quarter)

export default {
  id: 'induction',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'Make them all fall',
      text: r`
        Ten dominoes stand in a row. Push the first one and see what happens.

        **Then make all ten fall.** Tap between two dominoes to move them closer together
        or further apart.
      `,
      widget: { type: 'domino-chain', count: 10, gaps: [6], alt: 'Ten dominoes in a row. Between the sixth and the seventh there is a wide gap.' },
      check: (s) => {
        if (s.allFallen) return true;
        if (s.fallen === 0) return s.gaps.length ? 'Nothing has fallen yet. Push the first domino and watch where the chain stops.' : 'Every domino is now close enough to the next. Push the first one.';
        const fell = s.fallen === 1 ? 'Only domino 1 fell' : `Dominoes 1 to ${s.fallen} fell`;
        return `${fell}, and then the chain stopped: domino ${s.fallen} stands too far from domino ${s.fallen + 1}. Mend that link and push again.`;
      },
      solution: { gaps: [], pushed: true },
      explain: r`
        One wide gap was enough to stop the chain after domino 6. With that link mended, a single
        push brings down all ten.
      `,
    },
    {
      id: 'teach-chain',
      type: 'info',
      title: 'Two facts, and they all fall',
      text: r`
        Two things had to be true:

        1. **The first domino falls.**
        2. **Every domino knocks over the next one.**

        With both in place they all fall: ten of them, or ten million, or a row with no end at all.

        Lose either one and dominoes stay standing. In this row the second fact fails once, after
        domino 3. **Push**, and see how little a chain with one broken link proves.
      `,
      figure: { type: 'domino-chain', count: 8, gaps: [3], editable: false, alt: 'Eight dominoes in a row. Between the third and the fourth there is a wide gap, so a push brings down only the first three.' },
    },
    {
      id: 'two-facts',
      type: 'choice',
      text: r`
        Picture a row of dominoes numbered 1, 2, 3, … that **never ends**.

        **Which facts would guarantee that every single one falls?**
      `,
      columns: 1,
      options: [
        { text: 'Domino 1 falls; and whenever a domino falls, the next one falls too', correct: true },
        { text: 'Whenever a domino falls, the next one falls too', why: 'Not enough alone: if nothing knocks over domino 1, the chain never starts.' },
        { text: 'Dominoes 1, 2, 3, … up to 1000 all fall', why: 'That says nothing about domino 1001. A thousand cases are evidence, not proof.' },
        { text: 'Domino 1 falls, and domino 2 falls', why: 'Then nothing is known about domino 3.' },
      ],
      explain: r`
        The first fact starts the chain and the second keeps it going. Domino 1 falls, so 2
        falls, so 3 falls … and no domino can be the first one left standing.

        Now use the same idea on numbers.
      `,
    },
    {
      id: 'odd-sums',
      type: 'fill',
      title: 'A pattern in the odd numbers',
      text: 'Add up the odd numbers, taking one more each time.',
      figure: layersFigure(4),
      template: r`
        $1 = 1$

        $1 + 3 =$ [[4]]

        $1 + 3 + 5 =$ [[9]]

        $1 + 3 + 5 + 7 =$ [[16]]

        These are the [[even|*square|prime]] numbers.
      `,
      explain: r`
        1, 4, 9, 16: the squares. The picture suggests why: each odd number wraps round the last
        square as an L-shaped layer and makes the next square.

        So here is a conjecture: **the first $n$ odd numbers add up to $n^2$.**
      `,
    },
    {
      id: 'add-layer',
      type: 'interact',
      title: 'One more layer',
      text: r`
        Here is a $4 \times 4$ square: 16 tiles, the sum of the first four odd numbers.

        **Add one L-shaped layer of tiles to turn it into a $5 \times 5$ square.**
        Count the tiles as you add them.
      `,
      widget: { type: 'grid', rows: 5, cols: 5, on: OLD_SQUARE, locked: OLD_SQUARE, colors: ['orange'], counter: 'tiles', cell: 54, alt: 'A five by five grid. The sixteen squares in the bottom-left corner are filled. The top row and the right-hand column are empty.' },
      check: (s) => s.count === 25 || `There are ${plural(s.count, 'tile')} now. A 5 × 5 square needs 25, so ${25 - s.count} more.`,
      solution: { on: Array.from({ length: 25 }, (_, i) => i) },
      explain: r`
        You added $4 + 4 + 1 = 9$ tiles, and 9 is the fifth odd number.

        It always goes like that: an $n \times n$ square needs $n + n + 1 = 2n + 1$ more tiles to
        become an $(n + 1) \times (n + 1)$ square, and $2n + 1$ is exactly the next odd number.
        **Each case hands you the next one.** That is a falling domino.
      `,
    },
    {
      id: 'name-induction',
      type: 'info',
      title: 'Proof by induction',
      text: r`
        To prove a claim for **every** whole number $n \ge 1$, two small proofs are enough.

        :::key
        **Base case.** Prove the claim for $n = 1$. *(The first domino falls.)*

        **Induction step.** Prove: *if* the claim holds for some $n$, *then* it holds for $n + 1$. *(Each domino knocks over the next.)*
        :::

        The letter $n$ stands for any whole number at all, so one "if $n$, then $n + 1$"
        argument makes every link of the chain at once.

        Notice what the step does *not* do: it never checks that the claim is true for $n$.
        It only shows that truth is passed on.
      `,
    },
    {
      id: 'example-induction',
      type: 'info',
      title: 'The odd numbers, proved',
      text: r`
        Your conjecture about the odd numbers, as a complete proof by induction.

        :::example The first $n$ odd numbers add up to $n^2$
        1. **Base case.** For $n = 1$ the sum is 1, and $1^2 = 1$. True. *The first domino.*
        2. **Induction step.** Suppose the first $n$ odd numbers add up to $n^2$. *Only supposed, for some $n$.*
        3. Add the next odd number, $2n + 1$. The first $n + 1$ odd numbers add up to $n^2 + 2n + 1$. *The L-shaped layer: $n + n + 1$ tiles.*
        4. That is $(n + 1)^2$: the claim for $n + 1$. *The layer completes the next square.*
        5. Base case and step together prove the claim for every $n \ge 1$.
        :::
      `,
      figure: layersFigure(4),
    },
    {
      id: 'step-algebra',
      type: 'fill',
      title: 'Your turn: an induction step',
      text: r`
        **Claim:** $\;1 + 2 + 3 + \cdots + n = \dfrac{n(n + 1)}{2}$. For $n = 4$ both sides are 10.

        Suppose it holds for some $n$. Add the next number, $n + 1$, to both sides. The right-hand
        side becomes $\dfrac{n(n + 1)}{2} + (n + 1)$. Tidy it up, the way these numbers tidy up
        for $n = 4$:

        $$ \frac{4 \times 5}{2} + 5 = \frac{4 \times 5 + 2 \times 5}{2} = \frac{5 \times 6}{2} $$
      `,
      template: r`
        Put everything over 2. The top is $\;n(n + 1) +$ [[2]] $\times\, (n + 1)$.

        Take out the common factor $(n + 1)$. The top is $\;(n + 1) \times (n +$ [[2]] $)$.

        So the sum up to $n + 1$ is $\frac{(n + 1)(n + 2)}{2}$: the same formula with $n +$ [[1]] in place of $n$.
      `,
      hints: [r`$(n + 1) = \frac{2(n + 1)}{2}$.`],
      explain: r`
        $$ \frac{n(n+1)}{2} + (n + 1) $$

        $$ = \frac{n(n+1) + 2(n+1)}{2} $$

        $$ = \frac{(n+1)(n+2)}{2} $$
        That is the formula for $n + 1$. So if it holds for $n$, it holds for $n + 1$: the induction step is done.
      `,
    },
    {
      id: 'sum-order',
      type: 'order',
      review: true,
      text: r`
        Here is a complete proof by induction that $\;1 + 2 + \cdots + n = \frac{n(n+1)}{2}\;$ for
        every whole number $n \ge 1$.

        **Put it in order**, with the base case first.
      `,
      items: [
        r`**Base case.** For $n = 1$ the sum is 1, and the formula gives $\frac{1 \times 2}{2} = 1$. True.`,
        r`**Induction step.** Suppose the formula holds for some $n$: $\;1 + 2 + \cdots + n = \frac{n(n+1)}{2}$.`,
        r`Add $n + 1$ to both sides: $\;1 + 2 + \cdots + n + (n + 1) = \frac{n(n+1)}{2} + (n + 1)$.`,
        r`The right-hand side equals $\frac{(n+1)(n+2)}{2}$, which is the formula with $n + 1$ in place of $n$.`,
        r`So whenever the formula holds for $n$, it also holds for $n + 1$.`,
        r`The base case and the induction step together prove the formula for every whole number $n \ge 1$.`,
      ],
      labels: ['Start', 'Conclusion'],
      hints: ['Inside the induction step: suppose, add the next number, tidy up, conclude.'],
      explain: r`
        Two short arguments, and infinitely many statements are proved: $n = 1$ by the base case,
        then $n = 2$ by the step, then $n = 3$ by the step again, and so on without end.
      `,
    },
    {
      id: 'use-formula',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(12, 60);
        const last = 2 * n - 1;
        return {
          text: r`
            It can be proved by induction that the first $n$ odd numbers add up to $n^2$, for every $n$.
            For example, $1 + 3 + 5 + 7 + 9$ has 5 terms, because 9 is the 5th odd number
            ($2 \times 5 - 1$), so it adds up to $5^2 = 25$. Use it:

            $$ 1 + 3 + 5 + \cdots + ${last} = \;? $$
          `,
          answer: n * n,
          wrong: [
            [last * last, `That squares the last number. The formula needs the *number of terms*: how many odd numbers are there from 1 to ${last}?`],
            [(n - 1) * (n - 1), `Count again: there are ${n} odd numbers from 1 to ${last}, not ${n - 1}.`],
            [(last * (last + 1)) / 2, `That is the sum of *all* the whole numbers from 1 to ${last}. Only the odd ones are wanted.`],
          ],
          hints: [
            r`Odd number number $k$ is $2k - 1$: the 1st is 1, the 2nd is 3, the 3rd is 5. Which $k$ gives ${last}?`,
            r`$${last} = 2 \times ${n} - 1$, so there are ${n} terms.`,
          ],
          explain: r`${last} is the ${ordinal(n)} odd number, because $2 \times ${n} - 1 = ${last}$. So the sum is $${n}^2 = ${n * n}$.`,
        };
      },
    },
    {
      id: 'tromino-try',
      type: 'interact',
      title: 'Not only for sums',
      text: r`
        Induction also works where there is no formula at all. An **L-tromino** covers three
        squares in an L shape. A $2 \times 2$ board with one square removed *is* one L-tromino.

        Here is a $4 \times 4$ board with one square removed.
        **Cover the other 15 squares with L-trominoes.**
      `,
      widget: { type: 'domino-board', rows: 4, cols: 4, piece: 'tromino', removed: [HOLE_4], alt: 'A four by four board with one square removed.' },
      check: (s) => {
        if (s.complete) return true;
        if (s.count === 0) return 'Tap three squares that form an L to place the first tromino.';
        if (s.stuck) return `No L fits any more, but ${s.open === 1 ? '1 square is' : `${s.open} squares are`} still open. Take a piece off and try another arrangement.`;
        return `${s.open} squares are still open. Keep going.`;
      },
      solution: { pieces: trominoTiling(4, HOLE_4) },
      hints: [
        'Start with the L that wraps round the missing square.',
        'Then place one L in the very centre of the board. After that, each of the other three quarters needs exactly one more L.',
      ],
      explain: r`
        It can be done. But "I managed it" is evidence about one board. The claim worth proving
        is far bigger: **every** $2^n \times 2^n$ board with one square removed can be tiled,
        whether it is $8 \times 8$, $16 \times 16$ or $1024 \times 1024$, and wherever the hole is.

        That is a job for dominoes.
      `,
    },
    {
      id: 'tromino-step',
      type: 'interact',
      title: 'The induction step, by hand',
      text: r`
        An $8 \times 8$ board with one square removed. The dotted lines cut it into four
        $4 \times 4$ quarters. *Suppose* you already know that every $4 \times 4$ board with one
        square removed can be tiled.

        One quarter already has a square missing.
        **Place a single tromino so that each of the other three quarters loses exactly one square.**
      `,
      widget: { type: 'domino-board', rows: 8, cols: 8, piece: 'tromino', removed: [HOLE_8], quadrants: true, max: 1, counts: false, alt: 'An eight by eight board with one square removed in the top-left quarter. Dotted lines divide the board into four quarters.' },
      check: (s) => {
        if (s.placed === 0) return 'Place one tromino: tap three squares that form an L.';
        if (s.quarters.every((gone) => gone === 1)) return true;
        return 'Count the squares that are gone in each quarter. You need exactly one per quarter: the missing square in its own quarter, and one square of your tromino in each of the other three. Where do three quarters meet?';
      },
      solution: { pieces: [centreTromino(8, HOLE_8)] },
      hints: ['An L-tromino covers three squares of a 2 × 2 block. Which 2 × 2 block has one square in every quarter?'],
      explain: r`
        The tromino goes in the centre, where the quarters meet. Now each quarter is a
        $4 \times 4$ board with one square gone, and those can be tiled. So the $8 \times 8$ board can.
      `,
    },
    {
      id: 'teach-tromino-proof',
      type: 'info',
      title: 'Every size at once',
      text: r`
        That single tromino is an induction step. The same move works at every size.

        :::key
        **Base case.** A $2 \times 2$ board with one square removed *is* one L-tromino.

        **Induction step.** *If* every $2^n \times 2^n$ board with one square removed can be tiled, *then* so can every board of twice the side: cut it into quarters, lay one tromino round the centre, and tile each quarter.
        :::

        So induction settles **every** size, 2, 4, 8, 16 and so on, wherever the hole is. The
        picture shows where the method leads on your board. Solomon Golomb published this proof
        in 1954.
      `,
      figure: { type: 'domino-board', rows: 8, cols: 8, piece: 'tromino', removed: [HOLE_8], quadrants: true, pieces: trominoTiling(8, HOLE_8), static: true, counts: false, alt: 'The eight by eight board with one square removed, completely covered by 21 L-trominoes. One tromino sits round the centre, and each quarter is tiled in the same way, one size down.' },
    },
    {
      id: 'which-part',
      type: 'bucket',
      text: 'Which part of an induction proof is each sentence? Two of them do not belong in a proof at all.',
      buckets: ['Base case', 'Induction step', 'Neither'],
      items: [
        { text: r`For $n = 1$, the formula gives $\frac{1 \times 2}{2} = 1$, which is right.`, bucket: 0 },
        { text: r`If the first $n$ odd numbers add up to $n^2$, then the first $n + 1$ add up to $(n + 1)^2$.`, bucket: 1 },
        { text: r`A $2 \times 2$ board with one square removed is exactly one L-tromino.`, bucket: 0 },
        { text: r`If every $2^n \times 2^n$ board with a hole can be tiled, so can every board of twice the side.`, bucket: 1 },
        { text: r`I checked $n = 1, 2, 3, \ldots, 50$ on a calculator and it worked every time.`, bucket: 2, why: 'Fifty cases are evidence. Nothing here covers n = 51.' },
        { text: 'The formula looks far too neat to be wrong.', bucket: 2, why: 'A feeling is not an argument. Euler\'s prime formula looked neat too.' },
      ],
      explain: 'The base case proves the first statement outright. The induction step is an "if … then": it carries the truth from each case to the next. Checking cases or trusting your taste does neither.',
    },
    {
      id: 'horses',
      type: 'interact',
      title: 'All horses are the same colour?',
      text: r`
        A famous "proof" of something absurd: *in any group of $n$ horses, all have the same colour.*

        **Base case:** one horse has the same colour as itself. **Step:** line up $n + 1$ horses.
        The first $n$ share a colour, and so do the last $n$. The two groups overlap, so all
        $n + 1$ share a colour.

        Each domino is the claim for one $n$. An induction step has to work for **every** $n$,
        so test this one with small groups. **Break the one link the argument fails to make, then push.**
      `,
      widget: { type: 'domino-chain', count: 7, alt: 'Seven dominoes in a row, numbered 1 to 7. Each stands for the claim about a group of that many horses.' },
      check: (s) => {
        if (s.gaps.length === 1 && s.gaps[0] === 1) return s.pushed ? true : 'That is the broken link. Now push the first domino, to see how much the argument really proves.';
        if (!s.gaps.length) return 'No link is broken yet. Tap between two dominoes to break the link there.';
        if (s.gaps.length > 1) return 'Break one link only: the one step where the two groups of horses have no horse in common.';
        const k = s.gaps[0];
        return `The step from ${k} horses to ${k + 1} is sound: the first ${k} and the last ${k} of the ${k + 1} horses have ${plural(k - 1, 'horse')} in common. Look for the step where the two groups share none.`;
      },
      solution: { gaps: [1], pushed: true },
      hints: [
        'Try the step with small numbers. From 2 horses to 3: the first two and the last two share the middle horse.',
        'From 1 horse to 2: the "first one" and the "last one" are two different horses, with nobody in between.',
      ],
      explain: r`
        The step from 1 horse to 2 fails. With two horses, the "first $n$" is the first horse and
        the "last $n$" is the second: the groups do not overlap, so nothing makes them match.

        Every later step is fine, but that no longer matters. The chain is broken right after
        the first domino, so only the case $n = 1$ is proved. **An induction step has to work for
        every $n$, with no exceptions.** (The puzzle goes back to an exercise set by George Pólya in 1954.)
      `,
    },
    {
      id: 'skip-step',
      type: 'choice',
      review: true,
      stretch: true,
      gen: (rng) => {
        const a = rng.int(1, 3);
        const d = rng.int(2, 4);
        const k = rng.int(3, 8);
        const t = a + k * d;
        const values = [t, t + 1, t - 1, d === 2 ? t + 3 : t + 2].sort((x, y) => x - y);
        return {
          text: r`
            Someone proves two things about a claim:

            - it is true for $n = ${a}$;
            - if it is true for some $n$, then it is true for $n + ${d}$.

            **For which of these values of $n$ is the claim certainly proved?**
          `,
          shuffle: false,
          options: values.map((v) => ({ text: String(v), correct: v === t, why: v === t ? undefined : `${v} is not ${a} plus a multiple of ${d}, so the chain never reaches it.` })),
          hints: [`Which dominoes fall? ${a}, then ${a + d}, then ${a + 2 * d} …`],
          explain: r`The dominoes fall in jumps of ${d}: ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, … Only those cases are proved, and $${t} = ${a} + ${k} \times ${d}$ is one of them. The other values are never reached.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        An induction proof has two parts.

        **What goes wrong if you leave out the base case?** Give an example if you can.
      `,
      model: r`
        Without a base case nothing starts the chain. The induction step only says "if the claim
        is true for $n$, then it is true for $n + 1$", and that can be perfectly correct for a
        claim that is never true.

        An example is the claim "$n = n + 1$". If it were true for some $n$, adding 1 to both
        sides would make it true for $n + 1$, so the induction step works. But there is no first
        case, and the claim is false for every $n$. Dominoes that stand close together still
        stay up until somebody pushes the first one.
      `,
    },
  ],
  recap: [
    '**Induction** proves a claim for every whole number $n \\ge 1$ with two proofs: a base case and an induction step.',
    'Base case: the claim holds for the first value. Induction step: *if* it holds for $n$, *then* it holds for $n + 1$.',
    'It works for formulas, such as $1 + 3 + \\cdots + (2n - 1) = n^2$, and for things without formulas, such as tilings.',
    'One step that fails, like 1 → 2 for the horses, leaves everything after it unproved.',
  ],
  next: 'Next: an idea so obvious it sounds useless. If there are more pigeons than holes, two pigeons must share.',
};
