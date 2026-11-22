// Proofs: How to Be Certain · Lesson 6 · Some Infinities Are Bigger
import { r, plural } from '../../../kit.js';
import { fractionList, fractionGrid, integerPosition } from '../helpers.js';

/** The first six entries of a list that claims to hold every decimal between 0 and 1 (digits after "0."). */
const CLAIMED_LIST = ['314159', '718281', '414213', '577215', '693147', '161803'];
const ORDINALS = ['1st', '2nd', '3rd', '4th'];
const LIST_TEX = r`\tfrac11,\;\; \tfrac12,\; \tfrac21,\;\; \tfrac13,\; \tfrac31,\;\; \tfrac14,\; \tfrac23,\; \tfrac32,\; \tfrac41,\;\; \ldots`;
const FRACTIONS = fractionList(60);
const where = (top, bottom) => FRACTIONS.findIndex(([t, b]) => t === top && b === bottom) + 1;

/** The counting numbers 1, 2, 3 … paired off with 11, 12, 13 …: each n with n + 10. */
const PAIR_UP = (() => {
  let content = '';
  for (let i = 0; i < 5; i++) {
    const x = 34 + i * 60;
    content += `<line class="stroke-blue" stroke-width="3" stroke-linecap="round" x1="${x}" y1="42" x2="${x}" y2="82"/>`;
    content += `<text class="fig-label" x="${x}" y="32" text-anchor="middle">${i + 1}</text>`;
    content += `<text class="fig-label" x="${x}" y="106" text-anchor="middle">${i + 11}</text>`;
  }
  content += '<text class="fig-label" x="326" y="32" text-anchor="middle">…</text><text class="fig-label" x="326" y="106" text-anchor="middle">…</text>';
  return {
    type: 'svg', viewBox: '0 0 350 122', maxWidth: 360, content,
    alt: 'Two rows of numbers. The top row is 1, 2, 3, 4, 5 and so on; the bottom row is 11, 12, 13, 14, 15 and so on. A line joins each number to the one below it, which is 10 larger.',
  };
})();

/** Four endless rows of coin flips with the diagonal marked, and under them the row that flips every marked letter. */
const FLIP_ROWS = ['HTTH', 'TTHH', 'HHHT', 'THTT'];
const FLIP_LIST = (() => {
  const cell = 40;
  const left = 78;
  let content = '';
  const box = (x, y, cls, letter) => `<rect class="${cls}" stroke-width="2" x="${x}" y="${y}" width="${cell - 6}" height="${cell - 6}" rx="6"/><text class="fig-label" x="${x + (cell - 6) / 2}" y="${y + 23}" text-anchor="middle">${letter}</text>`;
  FLIP_ROWS.forEach((row, r) => {
    const y = 8 + r * cell;
    content += `<text class="fig-label" x="6" y="${y + 23}">row ${r + 1}</text>`;
    row.split('').forEach((letter, c) => { content += box(left + c * cell, y, r === c ? 'fill-orange-soft stroke-orange' : 'fill-surface stroke-hair', letter); });
    content += `<text class="fig-label" x="${left + 4 * cell + 10}" y="${y + 23}" text-anchor="middle">…</text>`;
  });
  const y = 8 + 4 * cell + 14;
  content += `<text class="fig-label" x="6" y="${y + 23}">new</text>`;
  FLIP_ROWS.forEach((row, c) => { content += box(left + c * cell, y, 'fill-blue-soft stroke-blue', row[c] === 'H' ? 'T' : 'H'); });
  content += `<text class="fig-label" x="${left + 4 * cell + 10}" y="${y + 23}" text-anchor="middle">…</text>`;
  return {
    type: 'svg', viewBox: `0 0 ${left + 4 * cell + 26} ${y + cell + 2}`, maxWidth: 300, content,
    alt: 'Four rows of coin flips: H T T H, T T H H, H H H T and T H T T, each running on. The first flip of row 1, the second of row 2, the third of row 3 and the fourth of row 4 are marked: H, T, H, T. Below them a new row shows the opposite of each marked flip: T, H, T, H.',
  };
})();

export default {
  id: 'infinity',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Which are there more of?',
      text: r`
        Two endless lists.

        The counting numbers: $\;1, 2, 3, 4, 5, 6, \ldots$

        The even numbers among them: $\;2, 4, 6, 8, 10, 12, \ldots$

        **Which list has more numbers in it?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'The counting numbers: the even numbers leave out every other one' },
        { text: 'Neither: the two lists are the same size', correct: true },
        { text: 'The even numbers' },
        { text: 'Endless lists cannot be compared at all' },
      ],
      explain: r`
        They are the same size, even though the second list is only *part* of the first.

        To see how that can be, first decide what "the same size" should mean when counting never finishes.
      `,
    },
    {
      id: 'teach-same-size',
      type: 'info',
      title: 'Counting without counting',
      text: r`
        In a cinema where every seat is taken and nobody stands, you know there are exactly as
        many people as seats, without counting either.

        :::key
        Two collections have **the same size** if their members can be paired off one to one,
        with nothing left over on either side.
        :::

        :::example 1, 2, 3, … and 11, 12, 13, …
        Pair each counting number $n$ with $n + 10$. Every counting number gets a partner: add
        10. Every number from 11 upwards gets one too: subtract 10. Nothing is left over, so
        the two lists are the same size, although the second lacks 1 to 10.
        :::
      `,
      figure: PAIR_UP,
    },
    {
      id: 'pairing',
      type: 'fill',
      title: 'Pair them off',
      text: r`
        Now the two lists from the start. Pair each counting number $n$ with the even number $2n$.
      `,
      template: r`
        $1 \leftrightarrow 2, \qquad 2 \leftrightarrow 4, \qquad 3 \leftrightarrow 6, \qquad \ldots$

        $50 \leftrightarrow$ [[100]] $\qquad$ and $\qquad$ [[21]] $\leftrightarrow 42$

        Is any counting number left without a partner? [[yes|*no]]

        Is any of the even numbers 2, 4, 6, … left without a partner? [[yes|*no]]
      `,
      explain: r`
        Every counting number $n$ has the partner $2n$, and every even number $2n$ has the
        partner $n$. Nothing is left over, so there are exactly as many of these even numbers as counting numbers.

        With infinite collections, a part can be as large as the whole.
      `,
    },
    {
      id: 'hotel-one',
      type: 'interact',
      title: 'The full hotel',
      text: r`
        Hilbert's Hotel has rooms numbered 1, 2, 3, … without end, and tonight **every room is
        taken**. One new guest arrives. Nobody may be sent away, and nobody shares a room.

        **Give the guests an instruction that frees a room for the newcomer.**
      `,
      widget: { type: 'hilbert-hotel', arrivals: 1, alt: 'The first eight rooms of an endless hotel, each occupied. One new guest waits at the door.' },
      check: (s) => s.allHoused || 'Every room is still taken. Give the guests an instruction.',
      solution: { rule: 'plus', k: 1 },
      hints: ['The newcomer needs one empty room. What if every guest moved along by the same number of rooms?'],
      explain: r`
        Ask every guest to move up one room, from room $n$ to room $n + 1$. Each of them has a
        room to go to, because there is no last room. Room 1 is now free.

        In a full hotel with a last room, the guest in it would have nowhere to go. Here the
        hotel is full, and still has room for one more. (David Hilbert told this story in his
        lectures in the 1920s.)
      `,
    },
    {
      id: 'hotel-bus',
      type: 'interact',
      title: 'An endless bus',
      text: r`
        The hotel is full again, and a bus pulls up with **infinitely many** new guests: N1, N2,
        N3, … one for every counting number.

        **Find one instruction that gives every single one of them a room.**
      `,
      widget: { type: 'hilbert-hotel', arrivals: 'bus', alt: 'The first eight rooms of an endless hotel, each occupied. An endless queue of new guests waits at the door.' },
      check: (s) => {
        if (s.allHoused) return true;
        if (s.rule === 'plus') return `Moving up ${plural(s.k, 'room')} frees only ${plural(s.k, 'room')}, and infinitely many guests are still at the door. Go back to the start and try the other instruction.`;
        return 'The bus is still waiting. Give the guests an instruction.';
      },
      solution: { rule: 'double' },
      hints: ['Moving up frees only as many rooms as the number of steps. Look for an instruction that leaves a gap between every two guests.'],
      explain: r`
        Send the guest in room $n$ to room $2n$. The old guests now fill the even rooms, and
        **every odd room** is free: infinitely many of them. New guest number $m$ takes room $2m - 1$.

        This is the pairing from before in disguise: the old guests are paired with the even
        numbers and the new guests with the odd ones.
      `,
    },
    {
      id: 'countable',
      type: 'info',
      title: 'One endless list',
      text: r`
        Giving every guest a room number is the same as writing all the guests in **one endless
        list**: first, second, third, … If a collection can be listed like that, with *every*
        member turning up at some position, it is the same size as the counting numbers.

        Collections that look bigger can often be listed too. Here are all the whole numbers,
        negatives included:

        $$ 0,\;\; 1,\; -1,\;\; 2,\; -2,\;\; 3,\; -3,\;\; \ldots $$

        Listing $0, 1, 2, 3, \ldots$ first would never get round to the negatives. Alternating
        reaches everything: any whole number you name appears after finitely many steps.
      `,
    },
    {
      id: 'list-integers',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.int(5, 40);
        const negative = rng.bool();
        const k = negative ? -m : m;
        return {
          text: r`
            Every whole number, positive, negative or zero, appears somewhere in this list:

            $$ 0,\;\; 1,\; -1,\;\; 2,\; -2,\;\; 3,\; -3,\;\; \ldots $$

            Here 0 is at position 1, and 1 is at position 2. The pair $3, -3$ takes
            positions 6 and 7. **At which position is $${k}$?**
          `,
          answer: integerPosition(k),
          wrong: negative
            ? [
              [2 * m, `That is the position of ${m}. Its negative comes right after it.`],
              [m, `Each size of number takes up two places, one for $${m}$ and one for $-${m}$, so the positions grow twice as fast.`],
            ]
            : [
              [2 * m + 1, `That is the position of $-${m}$. The positive number comes just before its negative.`],
              [m, `Each size of number takes up two places, one for $${m}$ and one for $-${m}$, so the positions grow twice as fast.`],
            ],
          hints: [
            r`Positions 2 and 3 hold $1$ and $-1$. Positions 4 and 5 hold $2$ and $-2$. Where does the pair $${m}$, $-${m}$ sit?`,
            r`A positive number $m$ sits at position $2m$, and $-m$ sits at position $2m + 1$.`,
          ],
          explain: negative
            ? r`The number $${m}$ sits at position $2 \times ${m} = ${2 * m}$, and $-${m}$ comes right after it, at position ${2 * m + 1}.`
            : r`Positions 2 and 3 hold $\pm 1$, positions 4 and 5 hold $\pm 2$, and so on: the positive number $m$ sits at position $2m$. So $${m}$ is at position ${2 * m}.`,
        };
      },
    },
    {
      id: 'teach-sweep',
      type: 'info',
      title: 'Even the fractions',
      text: r`
        Between any two fractions there are more fractions. Surely *they* cannot be listed? They
        can. Put the positive fractions in a grid and sweep the diagonals: top + bottom = 2,
        then 3, then 4 … each from the smallest top number upwards. Skip a fraction if its value
        is already on the list.

        :::example The first three diagonals
        - top + bottom = 2: $\;\frac11$
        - top + bottom = 3: $\;\frac12, \frac21$
        - top + bottom = 4: $\;\frac13, \frac31$ ($\frac22$ is skipped: it equals $\frac11$)

        So the list begins $\frac11, \frac12, \frac21, \frac13, \frac31$.
        :::
      `,
      figure: fractionGrid(5),
    },
    {
      id: 'fractions',
      type: 'choice',
      title: 'What comes next?',
      text: r`
        Here is the list after one more diagonal, the one where top + bottom = 5:

        $$ ${LIST_TEX} $$

        **Which fraction comes next?**
      `,
      figure: fractionGrid(5),
      options: [
        { text: r`$\frac{1}{5}$`, correct: true },
        { text: r`$\frac{5}{1}$`, why: 'It is on the next diagonal, but each diagonal is swept from the smallest top number upwards.' },
        { text: r`$\frac{2}{4}$`, why: r`It equals $\frac12$, which is already on the list, so it is skipped.` },
        { text: r`$\frac{3}{3}$`, why: r`It equals $\frac11$, which is already on the list, so it is skipped.` },
      ],
      hints: ['The last fraction shown, 4/1, ends the diagonal where top + bottom = 5. The next diagonal starts with top number 1.'],
      explain: r`
        The diagonal "top + bottom = 6" holds $\frac15, \frac24, \frac33, \frac42, \frac51$. Three
        of those repeat earlier values, so only $\frac15$ and $\frac51$ join the list.

        Every positive fraction lies on some diagonal, so every one gets a position: $\frac37$,
        for example, is number ${where(3, 7)}. The positive fractions are exactly as numerous as the counting numbers.
      `,
    },
    {
      id: 'fraction-position',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const at = rng.int(9, 20);                 // index in the list: the 10th to the 21st fraction
        const [top, bottom] = FRACTIONS[at];
        const sum = top + bottom;
        const before = FRACTIONS.findIndex(([t, b]) => t + b === sum);
        const diagonal = FRACTIONS.filter(([t, b]) => t + b === sum).map(([t, b]) => `\\tfrac{${t}}{${b}}`).join(',\\; ');
        const naive = ((sum - 2) * (sum - 1)) / 2 + top;   // the position if nothing were skipped
        return {
          text: r`
            The positive fractions can be written in one list. Sweep the diagonals
            "top + bottom = 2, 3, 4, …", each from the smallest top number upwards, and skip
            every fraction that is not in lowest terms:

            $$ ${LIST_TEX} $$

            **At which position is $\frac{${top}}{${bottom}}$?**
          `,
          answer: at + 1,
          wrong: naive !== at + 1 ? [[naive, r`That also counts fractions such as $\frac22$. They are skipped, because their values are already on the list.`]] : [],
          hints: [
            `It lies on the diagonal where top + bottom = ${sum}. How many fractions are listed before that diagonal starts?`,
            r`${before} fractions come before that diagonal. On it, in order: $${diagonal}$.`,
          ],
          explain: r`${before} fractions lie on the earlier diagonals. On the diagonal "top + bottom = ${sum}" the list continues $${diagonal}$, which puts $\frac{${top}}{${bottom}}$ at position ${at + 1}.`,
        };
      },
    },
    {
      id: 'diagonal-build',
      type: 'interact',
      title: 'A list that cannot be complete',
      text: r`
        Can everything be listed, then? Take the decimals between 0 and 1, such as 0.5 or
        0.31415…, with digits that may run on for ever. Suppose someone claims to have listed
        them **all**. Here are the first six entries.

        **Build a decimal that is not on the list.** Make your 1st digit differ from the 1st
        digit of the 1st entry, your 2nd digit from the 2nd digit of the 2nd entry, and so on.
      `,
      widget: { type: 'diagonal-list', rows: CLAIMED_LIST, alt: 'The first six entries of a list of decimals. The first digit of the first entry, the second digit of the second entry and so on are marked. Below is a row of six digits to choose.' },
      check: (s) => {
        if (s.escaped) return true;
        if (s.clashes.length) {
          const j = s.clashes[0];
          return `Your digit ${j} is ${s.diagonal[j - 1]}, the same as digit ${j} of entry ${j}. Change it, so that your number is certainly not entry ${j}.`;
        }
        return `Choose all six digits: ${6 - s.filled} to go.`;
      },
      solution: { escape: true },
      hints: ['Tap a box under the list to step through the digits 1 to 8. The marked digit straight above it, in the same column, is the one to avoid.', 'The marked digits are 3, 1, 4, 2, 4, 3. Any other digits will do: for example 1, 2, 1, 1, 1, 1.'],
      explain: r`
        Your number differs from the 1st entry in its 1st digit, from the 2nd entry in its 2nd
        digit, and so on for ever: from entry number $n$ in digit number $n$. So it is not the
        1st entry, not the 2nd, not the millionth. **It is nowhere on the list.**

        (Why only the digits 1 to 8? Some numbers have two decimal forms, such as
        $0.5000\ldots = 0.4999\ldots$ A number without 0s and 9s has only one form, so differing
        in a digit really does make it a different number.)
      `,
    },
    {
      id: 'teach-diagonal',
      type: 'info',
      title: 'The diagonal argument',
      text: r`
        What you just did is called the **diagonal argument**. It never searches the list. It
        builds one new entry that differs from entry number $n$ at place number $n$, for every
        $n$ at once. Here it is as a complete proof, about endless rows of coin flips.

        :::example The endless rows of H and T cannot all be listed
        1. **Suppose** they can: row 1, row 2, row 3, … with every row somewhere on the list.
        2. Build a new row: its flip number $n$ is the opposite of flip number $n$ of row $n$.
        3. Then the new row differs from row $n$ at flip $n$, for every $n$. So it equals none of the rows.
        4. So a row is missing from the list that was supposed to hold them all: a **contradiction**. No such list exists.
        :::
      `,
      figure: FLIP_LIST,
    },
    {
      id: 'objection',
      type: 'choice',
      text: r`
        "Fine," says the owner of the list. "I will add your number at the top. *Now* my list is complete."

        **What is wrong with that?**
      `,
      columns: 1,
      options: [
        { text: 'The same construction, applied to the new list, produces yet another number that is missing', correct: true },
        { text: 'Nothing: now every decimal is on the list', why: 'Run the diagonal construction on the new list. Out comes a number that differs from every entry, the added one included.' },
        { text: 'Nothing can be added to a list that is already infinite', why: 'It can: Hilbert\'s hotel always has room for one more. That is not the problem.' },
        { text: 'The new number was not really a decimal between 0 and 1', why: 'It was. All its digits are between 1 and 8, so it lies between 0.111… and 0.888….' },
      ],
      explain: r`
        The construction works against *any* list, the patched one included. So no list of
        decimals can ever be complete.

        This is not a matter of nobody being clever enough to make the list. It is a proof that
        the list cannot exist.
      `,
    },
    {
      id: 'cantor-order',
      type: 'order',
      review: true,
      title: 'Cantor\'s diagonal argument',
      text: r`
        Here is the whole argument: a proof by contradiction that **the decimals between 0 and 1
        cannot be written in one list**.

        **Put the lines in order.**
      `,
      items: [
        r`Suppose all the decimals between 0 and 1 **can** be written in one endless list.`,
        r`Build a new decimal: for every $n$, let its digit number $n$ differ from digit number $n$ of entry number $n$, using only the digits 1 to 8.`,
        r`Then for every $n$ the new decimal differs from entry number $n$ in digit number $n$, so it equals none of the entries.`,
        r`So here is a decimal between 0 and 1 that is missing from the list.`,
        r`That contradicts the supposition that the list held them all. So no such list exists.`,
      ],
      labels: ['Start', 'Conclusion'],
      hints: ['It has the shape of every proof by contradiction: suppose, follow, clash, conclude.'],
      explain: r`
        The counting numbers can be paired with *some* of the decimals, but never with all of
        them. In that exact sense there are **more** decimals between 0 and 1 than counting
        numbers, although both collections are infinite.

        Georg Cantor first proved this in 1874, by a different route, and published the diagonal
        argument in 1891. Infinity comes in more than one size.
      `,
    },
    {
      id: 'diagonal-pick',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const rows = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => (i === j ? rng.int(1, 8) : rng.int(0, 9))));
        const diagonal = rows.map((row, i) => row[i]);
        const other = (d) => rng.pick([1, 2, 3, 4, 5, 6, 7, 8].filter((v) => v !== d));
        const right = diagonal.map(other);
        const clashAt = rng.sample([0, 1, 2, 3], 3);
        const options = [
          { text: `0.${right.join('')}…`, correct: true },
          ...clashAt.map((j) => {
            const digits = diagonal.map((d, i) => (i === j ? d : other(d)));
            return { text: `0.${digits.join('')}…`, why: `Its ${ORDINALS[j]} digit is ${diagonal[j]}, the same as the ${ORDINALS[j]} digit of the ${ORDINALS[j]} entry. Nothing shows that it is not that entry.` };
          }),
        ];
        const table = rows.map((row, i) => `| ${ORDINALS[i]} | 0.${row.map((d, j) => (i === j ? `**${d}**` : d)).join('')}… |`).join('\n');
        return {
          text: `Someone claims that this list contains every decimal between 0 and 1. Its first four entries:\n\n| Entry | Decimal |\n|---|---|\n${table}\n\n**Which of these could be the start of a number built by the diagonal construction, a number that is certainly not on the list?**`,
          options,
          hints: ['Go along the marked digits. Your 1st digit must differ from the 1st marked digit, your 2nd from the 2nd, and so on.'],
          explain: `The marked digits are ${diagonal.join(', ')}. A number that starts 0.${right.join('')}… differs from the 1st entry in its 1st digit, from the 2nd entry in its 2nd digit, and so on. Each of the other three agrees with one entry at that entry's marked digit.`,
        };
      },
    },
    {
      id: 'sizes',
      type: 'bucket',
      text: `
        Which of these collections can be written as one endless list, with every member appearing at some position?

        Two things to keep in mind: counting numbers of any one kind can be listed in order of
        size, and a collection that contains one that cannot be listed cannot be listed either.
      `,
      buckets: ['Can be listed', 'Cannot be listed'],
      items: [
        { text: 'The even numbers', bucket: 0 },
        { text: 'All the whole numbers, negatives included', bucket: 0 },
        { text: 'The positive fractions', bucket: 0, why: 'Sweep the diagonals of the grid: every fraction turns up.' },
        { text: 'The prime numbers', bucket: 0, why: 'Write them in order of size: 2, 3, 5, 7, … Any collection of counting numbers can be listed that way.' },
        { text: 'The decimals between 0 and 1', bucket: 1 },
        { text: 'All the points on a number line', bucket: 1, why: 'They include every decimal between 0 and 1, and those alone are already too many to list.' },
      ],
      explain: r`
        A collection that can be listed is called **countable**: it is no bigger than the
        counting numbers. The decimals, and with them the whole number line, are **uncountable**:
        a strictly bigger infinity.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        Someone says: "Maybe the diagonal number *is* on the list after all, just very far down.
        At position one billion, say."

        **How do you answer?**
      `,
      model: r`
        It cannot be at position one billion, because it was built to differ from the entry at
        position one billion in its one-billionth digit.

        The same goes for every position: name any position $n$, and the new number differs from
        entry number $n$ in digit number $n$. So there is no position where it could be hiding.
        The argument does not search the list. It rules out every position at once, which is
        why it works even though the list never ends.
      `,
    },
  ],
  recap: [
    'Two collections have **the same size** if they can be paired off one to one. That works even when counting never ends.',
    'The even numbers, the whole numbers and the fractions can all be listed: each is the same size as the counting numbers.',
    'The decimals between 0 and 1 cannot be listed: every list misses the number built along its diagonal.',
    'So infinity comes in different sizes. Cantor published the diagonal argument in 1891.',
  ],
  next: 'That completes the course. Direct proof, contradiction, induction, the pigeonhole principle and invariants: you have used them on numbers, boards, coins and infinity itself. Whenever "it has always worked so far" is not good enough, these are the tools that settle a question for good.',
};
