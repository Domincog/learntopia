// Logic & Deduction · Lesson 1 · Process of Elimination
import { PETS, BAND, RACE, gridWidget, gridSolution, gridCheck, miniPuzzle, miniCast, blocks, bullets } from '../helpers.js';

const GRID_CASTS = [
  { rows: ['Ana', 'Ben', 'Cy'], cols: ['Cat', 'Dog', 'Fish'], thing: 'pet' },
  { rows: ['Dev', 'Eva', 'Finn'], cols: ['Drums', 'Flute', 'Piano'], thing: 'instrument' },
  { rows: ['Gia', 'Hal', 'Ivy'], cols: ['Red', 'Blue', 'Green'], thing: 'team colour' },
  { rows: ['Jo', 'Kit', 'Lou'], cols: ['Tea', 'Milk', 'Juice'], thing: 'drink' },
];

/*
 * Worked examples for the teaching screens. Their casts are deliberately not
 * in GRID_CASTS, MINI_NAMES or the three puzzles, so that no question in the
 * lesson can turn out to be the example it has just been shown.
 */
const EXAMPLE_FRUIT = {
  rows: ['Pat', 'Quinn', 'Rae'],
  cols: ['Apple', 'Pear', 'Plum'],
  marks: { '0,1': 'no', '1,1': 'no', '2,1': 'yes' },
};
const EXAMPLE_TEAM = {
  rows: ['Gus', 'Hope', 'Idris'],
  cols: ['Keeper', 'Striker', 'Referee'],
  clues: ['Gus sat next to the goalkeeper.', 'Idris waved to the goalkeeper.'],
  marks: { '0,0': 'no', '2,0': 'no', '1,0': 'yes' },
};
const EXAMPLE_QUEUE = {
  rows: ['Mo', 'Nour', 'Pia'],
  cols: ['1st', '2nd', '3rd'],
  clues: ['Nour queued somewhere behind Pia.'],
  marks: { '1,0': 'no', '2,2': 'no' },
};

export default {
  id: 'deduction-warmup',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three friends, three pets',
      text: `
        Ana, Ben and Cy each own one pet: a cat, a dog and a fish.

        - Ana is allergic to cats.
        - Ben’s pet has no legs.

        **Who owns the cat?**
      `,
      shuffle: false,
      options: [
        { text: 'Ana' },
        { text: 'Ben' },
        { text: 'Cy', correct: true },
        { text: 'There is no way to tell' },
      ],
      explain: `
        Ben’s pet has no legs, so it is the fish. Ana cannot have the cat, and the fish
        is taken, so she has the dog. Only Cy is left for the cat.

        Nobody told you who owns the cat. You found out by **ruling out everyone else**.
        Sherlock Holmes worked the same way:

        > When you have eliminated the impossible, whatever remains, however improbable, must be the truth.
      `,
    },
    {
      id: 'first-grid',
      type: 'interact',
      graded: false,
      title: 'Let a grid do the remembering',
      text: `
        Bigger puzzles are too much to hold in your head. A grid can do the remembering for you.

        Here is the same puzzle again. **Tap a square once to cross it out, twice to tick it.**
        Start with what the clues rule out, and finish with one tick in every row.
      `,
      widget: gridWidget(PETS, { nudge: true }),
      check: gridCheck(PETS),
      solution: gridSolution(PETS),
      hints: [
        'Clue 1 rules out exactly one square: Ana with Cat. Tap it once.',
        'Clue 2 means Ben has the fish. Tap Ben with Fish twice, and watch what the grid does on its own.',
      ],
      explain: `
        Did you see what a tick does? It crosses out the rest of its row and its column
        **by itself**. If Ben has the fish, then Ben has nothing else, and nobody else has the fish.

        After that, Ana’s row had a single open square. So it had to be a tick.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The process of elimination',
      text: `
        That way of reasoning has a name: the **process of elimination**. It is a loop.

        1. **Cross out** whatever a clue makes impossible.
        2. When a row or a column has **one open square left**, tick it.
        3. A tick **rules out** the rest of its row and column. Back to step 1.

        :::example
        Pat and Quinn are crossed out for the pear, and somebody has to have it.
        The **Pear column** has one open square, so Rae gets the tick.
        The tick then crosses out the rest of Rae’s row.
        :::
      `,
      figure: {
        type: 'logic-grid', static: true, rows: EXAMPLE_FRUIT.rows, cols: EXAMPLE_FRUIT.cols, marks: EXAMPLE_FRUIT.marks,
        alt: 'A three by three deduction grid. In the Pear column, Pat and Quinn are crossed out and Rae is ticked. The tick has crossed out Apple and Plum in Rae’s row.',
      },
    },
    {
      id: 'next-tick',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const cast = rng.pick(GRID_CASTS);
        const r = rng.int(0, 2);
        const c = rng.int(0, 2);
        const [r1, r2] = [0, 1, 2].filter((v) => v !== r);
        const [c1, c2] = rng.shuffle([0, 1, 2].filter((v) => v !== c));
        const byColumn = rng.bool();
        const name = (row, col) => `${cast.rows[row]} with ${cast.cols[col]}`;
        const marks = byColumn
          ? { [`${r1},${c}`]: 'no', [`${r2},${c}`]: 'no', [`${r},${c1}`]: 'no' }
          : { [`${r},${c1}`]: 'no', [`${r},${c2}`]: 'no', [`${r1},${c}`]: 'no' };
        const loose = 'That square is open, but so is another square in its row, and another in its column. Nothing forces it yet.';
        return {
          text: `
            A puzzle in progress: each person goes with a different ${cast.thing}, and three squares have been crossed out so far.

            **Which square can you tick right now?**
          `,
          figure: {
            type: 'logic-grid', static: true, rows: cast.rows, cols: cast.cols, marks,
            alt: `A three by three deduction grid. Crossed out: ${Object.keys(marks).map((k) => { const [a, b] = k.split(',').map(Number); return name(a, b); }).join('; ')}.`,
          },
          options: [
            { text: name(r, c), correct: true },
            { text: name(byColumn ? r : r2, byColumn ? c2 : c), why: byColumn ? loose : `Not that one: ${cast.rows[r]} has to take ${cast.cols[c]}, so nobody else can.` },
            { text: name(r1, c1), why: loose },
            { text: name(r2, c2), why: loose },
          ],
          hints: ['Look for a row **or a column** with two crosses in it.'],
          explain: byColumn
            ? `Look down the **${cast.cols[c]} column**: ${cast.rows[r1]} and ${cast.rows[r2]} are crossed out. Somebody has to go with ${cast.cols[c]}, and only ${cast.rows[r]} is left.`
            : `Look along **${cast.rows[r]}’s row**: ${cast.cols[c1]} and ${cast.cols[c2]} are crossed out. ${cast.rows[r]} has to go with something, and only ${cast.cols[c]} is left.`,
        };
      },
    },
    {
      id: 'teach-not-clues',
      type: 'info',
      title: 'Clues that only say “not”',
      text: `
        Many clues never say who *is* anything. Look for the **“not”** hiding inside them.

        :::example
        *“Gus sat next to the goalkeeper.”* Nobody sits next to themselves, so Gus is **not**
        the goalkeeper: one cross. Clue 2 does the same for Idris. Now the Keeper column
        has one open square, and Hope gets the tick.
        :::

        :::key
        You do not need a clue that hands you the answer.
        You need enough clues to rule out every *other* answer.
        :::
      `,
      figure: {
        type: 'logic-grid', static: true, ...EXAMPLE_TEAM,
        alt: 'A deduction grid for Gus, Hope and Idris against Keeper, Striker and Referee. Gus and Idris are crossed out in the Keeper column, and Hope is ticked there.',
      },
    },
    {
      id: 'band',
      type: 'interact',
      title: 'Who plays what?',
      text: `
        Dev, Eva and Finn are a band: one drummer, one flute player, one pianist.

        This time no clue hands you a tick. **Work out who plays what.**
      `,
      widget: gridWidget(BAND),
      check: gridCheck(BAND),
      solution: gridSolution(BAND),
      hints: [
        'Clue 1 talks about Dev *and* the drummer. They are two different people, so cross out Dev with Drums.',
        'After clues 1 and 2, look down the Drums column. Who is still possible?',
        'Finn is not the drummer and not the flute player. What is left in his row?',
      ],
      explain: `
        Dev and Finn were both ruled out as the drummer, so the **Drums column** had one
        open square left: Eva. Elimination works down columns as well as along rows.

        Notice that no clue said who *is* anything. Three “nots” were enough.
      `,
    },
    {
      id: 'teach-certain',
      type: 'info',
      title: 'What do you know so far?',
      text: `
        Part-way through a puzzle, several answers are usually still open.
        List them, then test a statement against **each one**.

        - **Certain**: true in every answer still open.
        - **Possible**: true in some, false in others.
        - **Impossible**: true in none.

        :::example
        A hidden card is a heart, a spade or a club, and you learn it is **not a club**.
        Still open: heart, spade. “It is a heart” is only *possible*.
        “It is a heart or a spade” is *certain*. “It is a club” is *impossible*.
        :::
      `,
    },
    {
      id: 'sure',
      type: 'multi',
      review: true,
      gen: (rng) => {
        const { A, B, C, x, y, z, intro, pos, neg } = miniCast(rng);
        return {
          text: `
            ${intro} You know only two things:

            - ${neg(A, x)}.
            - ${neg(B, x)}.

            **Which of these can you be certain of?**
          `,
          options: [
            { text: pos(C, x), correct: true },
            { text: neg(C, y), correct: true },
            { text: pos(A, y), why: `Nothing rules out the ${z} for ${A}. It could be the ${y} or the ${z}.` },
            { text: pos(B, z), why: `Nothing rules out the ${y} for ${B}. It could be the ${y} or the ${z}.` },
          ],
          hints: [`Who is still possible for the ${x}?`],
          explain: `
            Two people are ruled out for the ${x}, so it goes with ${C}, and then ${C} has nothing else.
            But ${A} and ${B} could still split the ${y} and the ${z} either way round.

            Elimination tells you what you know. It also tells you what you **do not know yet**.
          `,
        };
      },
    },
    {
      id: 'key-boxes',
      type: 'bucket',
      title: 'Certain, possible, impossible',
      text: `
        A key is hidden in exactly one of three boxes: red, green or blue.
        You are told one thing: **the key is not in the red box.**

        Sort the statements.
      `,
      buckets: ['Certain', 'Possible', 'Impossible'],
      items: [
        { text: 'It is in the red box', bucket: 2 },
        { text: 'It is in the green box', bucket: 1, why: 'Green is still open, but so is blue. Possible is the most you can say.' },
        { text: 'It is in green or blue', bucket: 0, why: 'Red is ruled out and the key is somewhere, so it must be in one of the other two.' },
        { text: 'It is not in the blue box', bucket: 1, why: 'That is true if the key is in the green box and false if it is in the blue one. You cannot tell yet.' },
        { text: 'It is in red or green', bucket: 1, why: 'With red ruled out, this is just another way of saying “green”. Possible, not certain.' },
        { text: 'It is in none of them', bucket: 2, why: 'The key is in exactly one of the three boxes, so “none” cannot be right.' },
      ],
      explain: `
        One clue removed one possibility and left two. Anything that depends on *which* of
        the two is only **possible**. One more clue, such as “not green”, would make it certain.
      `,
    },
    {
      id: 'mini',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const p = miniPuzzle(rng);
        return {
          text: blocks(p.intro, bullets(p.clues), `**${p.question}**`),
          options: [
            ...p.names.map((n) => ({ text: n, correct: n === p.answer })),
            { text: 'There is not enough information', why: 'There is. Each clue crosses something out, and together they leave a single possibility.' },
          ],
          hints: ['Find something that is ruled out for two of the three people, or a person with two things ruled out.', 'Picture the three by three grid, with three crosses in it.'],
          explain: p.why,
        };
      },
    },
    {
      id: 'teach-order-clues',
      type: 'info',
      title: 'Clues about order',
      text: `
        When the columns are places in a line, a clue about *before* and *after* hides crosses too.

        :::example
        *“Nour queued somewhere behind Pia.”* Then Nour was not 1st, and Pia was not last: two crosses.
        :::

        Read a clue like this **again after every tick**. Once you know that Pia was 2nd,
        the same clue puts Nour 3rd.
      `,
      figure: {
        type: 'logic-grid', static: true, ...EXAMPLE_QUEUE,
        alt: 'A deduction grid for Mo, Nour and Pia against 1st, 2nd and 3rd place. Nour is crossed out for 1st and Pia is crossed out for 3rd.',
      },
    },
    {
      id: 'race',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'Photo finish',
      text: `
        Four runners, four places, three clues. **Work out the finishing order.**

        One of the clues is worth reading twice. You will need it again after your first tick.
      `,
      widget: gridWidget(RACE),
      check: gridCheck(RACE),
      solution: gridSolution(RACE),
      hints: [
        'Clue 2: if Bea finished immediately *after* Dee, then Bea was not 1st and Dee was not 4th. Clue 3 works the same way for Cal and Ali.',
        'Now look down the 4th column. Only one runner can still be last.',
        'Bea is 4th, and she finished immediately after Dee. So where did Dee finish?',
      ],
      explain: `
        The chain: Ali, Cal and Dee were ruled out of last place, so **Bea was 4th**.
        Dee finished just ahead of her: **3rd**. Ali, not 1st and not 4th, had only **2nd** left.
        And so **Cal won**.

        Each tick made an old clue say something new. That is why you keep going back over the clues.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A tick lets you cross out every other square in its row *and* its column.

        **Why is that allowed?** Explain it as you would to a friend who has never seen one of these grids.
      `,
      model: `
        Because the puzzle pairs things up **one to one**: each person has exactly one pet, and each pet
        has exactly one owner. So if Ben has the fish, Ben has nothing else (his row), and nobody else has
        the fish (its column). If two friends could share a pet, a tick would rule out nothing.
      `,
    },
  ],
  recap: [
    'You can find an answer nobody told you, by ruling out every other answer.',
    'Cross out what a clue makes impossible. One open square left in a row **or a column** must be a tick.',
    'Every tick rules out the rest of its row and column. Then go back over the clues.',
    'Elimination also shows you what you do **not** know yet.',
  ],
  next: 'Next: an island where some people always lie. Can you still get at the truth?',
};
