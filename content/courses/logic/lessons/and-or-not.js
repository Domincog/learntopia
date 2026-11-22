// Logic & Deduction · Lesson 4 · And, Or, Not
import { r } from '../../../kit.js';
import { blocks } from '../helpers.js';

/** Feedback for a truth-table step: point at the first wrong cell. */
const tableCheck = (special = () => null) => (s) => {
  if (s.correct) return true;
  if (!s.complete) return `Fill in every cell first: ${s.total - s.filled} to go.`;
  const w = s.firstWrong;
  return special(w) || `Not quite. Look again at “${w.head}” in the row where ${w.inputs}.`;
};

const CAT_DOG = ['**C**: Sam owns a cat', '**D**: Sam owns a dog'];
const CAFE_VARS = [{ id: 'c', label: 'Buys a coffee' }, { id: 's', label: 'Buys a sandwich' }];
const word = (v) => (v ? 'true' : 'false');

/** Compound statements for the "evaluate" step, each with its own working. */
const FORMS = [
  { text: 'P **and** Q', usesOr: false, f: (p, q) => p && q, work: (p, q) => `“And” needs both parts to be true. P is ${word(p)} and Q is ${word(q)}` },
  { text: 'P **or** Q', usesOr: true, f: (p, q) => p || q, work: (p, q) => `“Or” needs at least one part to be true. P is ${word(p)} and Q is ${word(q)}` },
  { text: '(**not** P) **or** Q', usesOr: true, f: (p, q) => !p || q, work: (p, q) => `“Not P” is ${word(!p)}, and Q is ${word(q)}. “Or” needs at least one of them to be true` },
  { text: 'P **and** (**not** Q)', usesOr: false, f: (p, q) => p && !q, work: (p, q) => `P is ${word(p)}, and “not Q” is ${word(!q)}. “And” needs both of them to be true` },
  { text: '**not** (P **and** Q)', usesOr: false, f: (p, q) => !(p && q), work: (p, q) => `Work inside the brackets first: “P and Q” is ${word(p && q)}. “Not” flips it` },
  { text: '**not** (P **or** Q)', usesOr: true, f: (p, q) => !(p || q), work: (p, q) => `Work inside the brackets first: “P or Q” is ${word(p || q)}. “Not” flips it` },
  { text: '(**not** P) **and** (**not** Q)', usesOr: false, f: (p, q) => !p && !q, work: (p, q) => `“Not P” is ${word(!p)}, and “not Q” is ${word(!q)}. “And” needs both of them to be true` },
  { text: '(**not** P) **or** (**not** Q)', usesOr: true, f: (p, q) => !p || !q, work: (p, q) => `“Not P” is ${word(!p)}, and “not Q” is ${word(!q)}. “Or” needs at least one of them to be true` },
];

/** Everyday statements and their negations, for the De Morgan practice step. */
const NEGATIONS = [
  { kind: 'and', says: 'The door is locked and the alarm is on.', right: 'The door is unlocked, or the alarm is off.', eager: 'The door is unlocked, and the alarm is off.', lazy: 'The door is locked, or the alarm is on.' },
  { kind: 'and', says: 'Kim speaks French and Kim speaks Spanish.', right: 'Kim does not speak French, or Kim does not speak Spanish.', eager: 'Kim does not speak French, and Kim does not speak Spanish.', lazy: 'Kim speaks French, or Kim speaks Spanish.' },
  { kind: 'and', says: 'The soup is hot and the bread is fresh.', right: 'The soup is not hot, or the bread is not fresh.', eager: 'The soup is not hot, and the bread is not fresh.', lazy: 'The soup is hot, or the bread is fresh.' },
  { kind: 'or', says: 'Ravi plays chess or Ravi plays tennis.', right: 'Ravi does not play chess, and Ravi does not play tennis.', eager: 'Ravi does not play chess, or Ravi does not play tennis.', lazy: 'Ravi plays chess, and Ravi plays tennis.' },
  { kind: 'or', says: 'It will rain today or it will rain tomorrow.', right: 'It will not rain today, and it will not rain tomorrow.', eager: 'It will not rain today, or it will not rain tomorrow.', lazy: 'It will rain today, and it will rain tomorrow.' },
  { kind: 'or', says: 'The printer is out of paper or out of ink.', right: 'The printer has paper, and it has ink.', eager: 'The printer has paper, or it has ink.', lazy: 'The printer is out of paper, and out of ink.' },
];

export default {
  id: 'and-or-not',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A slippery sentence',
      text: `
        Sam says: *“It is **not** true that I own a cat **and** a dog.”*

        Suppose Sam is telling the truth. **What can you be sure of?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Sam owns neither a cat nor a dog' },
        { text: 'Sam is missing at least one of the two', correct: true },
        { text: 'Sam owns a cat, but no dog' },
      ],
      explain: `
        All you know is that Sam does not have *both*. He might have a cat and no dog,
        a dog and no cat, or no pets at all.

        “Neither” is the tempting answer, and it claims too much. The small words **and**, **or** and **not**
        have exact meanings. In this lesson you will build a tool that settles questions like this one without any guessing.
      `,
    },
    {
      id: 'teach-statements',
      type: 'info',
      title: 'True or false, row by row',
      text: `
        A **statement** is a sentence that is either true or false, such as *“Maya bought a coffee”*.

        Two statements can be true or false in **four combinations**. A table with one row
        for each combination lets you check them all, one row at a time.

        :::example
        Four customers visit a café, one in each row. Who “spends nothing”? Read along the rows.
        The top customer buys both things: **no**. The next two buy one thing each: **no**.
        Only the last one buys neither: **yes**.
        :::
      `,
      figure: {
        type: 'truth-table', static: true, symbols: ['yes', 'no'], vars: CAFE_VARS,
        columns: [{ head: 'Spends nothing', value: (v) => !v.c && !v.s }],
        alt: 'A table with four rows, one for each combination of buying a coffee and buying a sandwich: both, coffee only, sandwich only, neither. The column “Spends nothing” says yes only in the last row.',
      },
    },
    {
      id: 'cafe',
      type: 'interact',
      title: 'Two offers',
      text: `
        A café has two offers:

        - a **free cookie** if you buy a coffee **and** a sandwich;
        - a **loyalty stamp** if you buy a coffee **or** a sandwich.

        Four customers walk in. **Fill in who gets what.**
      `,
      widget: {
        type: 'truth-table',
        symbols: ['yes', 'no'],
        vars: CAFE_VARS,
        columns: [
          { head: 'Cookie *(coffee **and** sandwich)*', value: (v) => v.c && v.s, fill: true },
          { head: 'Stamp *(coffee **or** sandwich)*', value: (v) => v.c || v.s, fill: true },
        ],
      },
      check: tableCheck((w) => {
        if (w.column === 1 && w.row === 0) return 'Look at the customer who buys both. Have they bought “a coffee or a sandwich”? The café would hardly refuse them the stamp.';
        if (w.column === 0) return 'The cookie needs **both** purchases. Check each row: is there a coffee *and* a sandwich?';
        return 'The stamp needs **at least one** purchase. Check each row: is there a coffee, a sandwich, or both?';
      }),
      solution: { solved: true },
      hints: ['Take one customer (one row) at a time. The first one buys both things; the last one buys nothing.'],
      explain: `
        The cookie needs **both** purchases, so only one customer gets it.
        The stamp needs **at least one**, so only the customer who buys nothing misses out.

        Look at the top row again. Whoever buys both still gets the stamp. In logic, **“or” includes “both”**.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'And, or, not',
      text: `
        Three small words build bigger statements out of smaller ones.
        Write **P** and **Q** for any two statements.

        - **P and Q** is true only when **both** parts are true.
        - **P or Q** is true when **at least one** part is true: one, the other, or both.
        - **not P** is true exactly when P is false. It is called the **negation** of P.

        A table that lists every combination, like the one you just filled in, is a **truth table**.
        From here on, **T** stands for true and **F** for false.
      `,
      figure: {
        type: 'truth-table', static: true, vars: ['P', 'Q'],
        columns: [
          { head: 'P and Q', value: (v) => v.P && v.Q },
          { head: 'P or Q', value: (v) => v.P || v.Q },
          { head: 'not P', value: (v) => !v.P },
        ],
        alt: 'Truth table. P and Q is true only in the row where both are true. P or Q is false only in the row where both are false. Not P is the opposite of P.',
      },
    },
    {
      id: 'or-kinds',
      type: 'bucket',
      title: 'Two kinds of “or”',
      text: `
        Everyday English uses “or” in two ways. Sometimes both together is fine (**inclusive** or).
        Sometimes you are meant to pick just one (**exclusive** or).

        **Sort these by what the speaker means.**
      `,
      buckets: ['Both is fine', 'One, not both'],
      items: [
        { text: '“You need a passport or an ID card.”', bucket: 0, why: 'Nobody is turned away for carrying both.' },
        { text: '“Call me if you are lost or running late.”', bucket: 0, why: 'Lost *and* late? Then you should certainly call.' },
        { text: '“Students or club members get a discount.”', bucket: 0, why: 'A student who is also a member still gets the discount.' },
        { text: '“The set menu comes with soup or salad.”', bucket: 1, why: 'Ask for both and you will be charged extra. The menu means one of them.' },
        { text: '“Pick the red team or the blue team.”', bucket: 1, why: 'You cannot play for both teams.' },
        { text: '“You can have the window seat or the aisle seat.”', bucket: 1, why: 'One ticket, one seat.' },
      ],
      explain: `
        People work out which “or” is meant from the situation. Logic cannot do that, so it fixes the meaning:
        plain **“or” is inclusive**, at least one and possibly both.
      `,
    },
    {
      id: 'example-evaluate',
      type: 'info',
      title: 'Bigger statements, one piece at a time',
      text: `
        From here on, **or** always means *at least one, possibly both*. The pick-exactly-one kind
        has a name of its own: **exclusive or**, often written **xor**.

        A longer statement is worked out one piece at a time, **brackets first**.

        :::example
        Suppose **R is false** and **S is true**.

        - *(not R) and S*: “not R” is true, and S is true. Both parts are true, so the statement is **true**.
        - *not (R or S)*: inside the brackets, “R or S” is true. “Not” flips it: **false**.
        :::
      `,
    },
    {
      id: 'evaluate',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const form = rng.pick(FORMS);
        const p = rng.bool();
        const q = rng.bool();
        const value = !!form.f(p, q);
        return {
          text: blocks(
            `Suppose **P is ${word(p)}** and **Q is ${word(q)}**. Is this statement true or false?`,
            `> ${form.text}`,
            form.usesOr && 'Remember that in logic “or” means *at least one*, possibly both.',
          ),
          options: [{ text: 'True', correct: value }, { text: 'False', correct: !value }],
          explain: `${form.work(p, q)}. So the whole statement is **${word(value)}**.`,
        };
      },
    },
    {
      id: 'rows',
      type: 'numeric',
      gen: (rng) => {
        const n = rng.int(3, 6);
        const answer = 2 ** n;
        return {
          text: `
            A truth table needs one row for every combination of true and false.
            Each extra statement can be true or false in every row you already have, so it **doubles** the table:
            1 statement takes 2 rows, and 2 statements take 4.

            **How many rows does a table for ${n} statements need?**
          `,
          answer,
          unit: 'rows',
          wrong: [
            [2 * n, 'That adds 2 rows for each statement. In fact every new statement **doubles** the table: each old row splits into a “true” row and a “false” row.'],
            [n * n, r`That is $${n} \times ${n}$. Think of doubling instead: each new statement splits every row in two.`],
            [2 ** (n - 1), `That is the table for ${n - 1} statements. One more doubling to go.`],
          ],
          hints: ['Start from the 4 rows for 2 statements, and double once for each statement you add.', '1 statement: 2 rows. 2 statements: 4 rows. 3 statements: 8 rows…'],
          explain: r`Every statement doubles the table: $2^{${n}} = ${answer}$ rows. This is why truth tables are a job for patience, or for a computer.`,
        };
      },
    },
    {
      id: 'not-and',
      type: 'interact',
      title: 'Back to Sam',
      text: `
        Sam said: *“It is not true that I own a cat and a dog.”*
        Write **C** for “Sam owns a cat” and **D** for “Sam owns a dog”.

        The column for *C and D* is done. **Fill in its negation.**
      `,
      widget: {
        type: 'truth-table', vars: ['C', 'D'], legend: CAT_DOG,
        columns: [
          { head: 'C and D', value: (v) => v.C && v.D },
          { head: 'not (C and D)', value: (v) => !(v.C && v.D), fill: true },
        ],
      },
      check: tableCheck(() => '“Not” flips whatever is next to it. Go down the *C and D* column and write the opposite each time.'),
      solution: { solved: true },
      explain: `
        “Not” flips every entry: F, T, T, T.

        So Sam’s sentence is true in **three** of the four worlds, including the two where he owns exactly one pet.
        The only thing it rules out is owning both.
      `,
    },
    {
      id: 'de-morgan',
      type: 'interact',
      title: 'Find the twin',
      text: `
        Here is that column again, highlighted. Fill in the two new columns.

        **One of them will match the highlighted column exactly.** Which?
      `,
      widget: {
        type: 'truth-table', vars: ['C', 'D'], legend: CAT_DOG,
        columns: [
          { head: 'not (C and D)', value: (v) => !(v.C && v.D), mark: true },
          { head: '(not C) or (not D)', value: (v) => !v.C || !v.D, fill: true },
          { head: '(not C) and (not D)', value: (v) => !v.C && !v.D, fill: true },
        ],
      },
      check: tableCheck((w) => (w.column === 0
        ? `Check the “or” column where ${w.inputs}. Work out *not C* and *not D* first, then ask: is at least one of them true?`
        : `Check the “and” column where ${w.inputs}. Work out *not C* and *not D* first, then ask: are both of them true?`)),
      solution: { solved: true },
      hints: [
        'In each row, first flip C and D in your head. In the top row, *not C* is F and *not D* is F.',
        '“Or” then needs at least one T among those two. “And” needs two.',
      ],
      explain: `
        **(not C) or (not D)** matches *not (C and D)* in every row. The two sentences look different,
        yet they are true in exactly the same worlds.

        “Not both” means “at least one is missing”. It does *not* mean “neither”: that is the last column,
        true in one world only.
      `,
    },
    {
      id: 'laws',
      type: 'info',
      title: 'De Morgan’s laws',
      text: `
        You have just found a law named after the nineteenth-century logician Augustus De Morgan. It comes with a mirror image:

        - **not (P and Q)** says the same as **(not P) or (not Q)**
        - **not (P or Q)** says the same as **(not P) and (not Q)**

        :::key
        To negate an “and” or an “or”: negate each part, **and swap the connecting word**.
        :::

        “I am not both rich and famous” means “I am not rich, or I am not famous”.
        “It is not red or blue” means “it is not red, and it is not blue”.
      `,
    },
    {
      id: 'negate',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const n = rng.pick(NEGATIONS);
        const isAnd = n.kind === 'and';
        return {
          text: `
            Someone says: *“${n.says}”*

            **Which sentence is the negation of that**, true exactly when theirs is false?
          `,
          options: [
            { text: n.right, correct: true },
            {
              text: n.eager,
              why: isAnd
                ? 'That goes too far. An “and” is already false when just **one** of its parts fails.'
                : 'That is not enough. If only one part fails, the other can still make the “or” true.',
            },
            { text: n.lazy, why: 'Only the connecting word has changed. Nothing has been negated.' },
          ],
          hints: ['De Morgan: negate each part, and swap “and” with “or”.'],
          explain: isAnd
            ? 'An “and” statement is false as soon as **at least one** part fails. So its negation is an “or” of the negated parts.'
            : 'An “or” statement is false only when **both** parts fail. So its negation is an “and” of the negated parts.',
        };
      },
    },
    {
      id: 'everyone',
      type: 'choice',
      stretch: true,
      columns: 1,
      title: 'More than two',
      text: `
        “**Every** window is closed” is one long *and*: window 1 is closed, **and** window 2 is closed, **and** so on.

        Let De Morgan loose on it. **What is the negation of “every window is closed”?**
      `,
      options: [
        { text: 'At least one window is open', correct: true },
        { text: 'Every window is open', why: 'That is the opposite extreme, not the negation. With one window open and the rest closed, both “every window is closed” and “every window is open” are false.' },
        { text: 'No window is closed', why: 'That is “every window is open” in other words: far more than is needed to make the original false.' },
        { text: 'At least one window is closed', why: 'That can be true together with the original, so it cannot be its negation.' },
      ],
      hints: ['How many windows have to be open before “every window is closed” stops being true?'],
      explain: `
        Negating a long “and” gives a long “or”: window 1 is open, **or** window 2 is open, **or** … In plain words, **at least one** is open.

        It runs the other way too: the negation of “**some** window is open” is “**every** window is closed”.
      `,
    },
    {
      id: 'connectives',
      type: 'match',
      review: true,
      text: 'Match each kind of statement with the rule for when it is **true**.',
      pairs: [
        ['P and Q', 'only when both parts are true'],
        ['P or Q', 'when at least one part is true'],
        ['P xor Q (exclusive or)', 'when exactly one part is true'],
        ['not P', 'exactly when P is false'],
      ],
      explain: 'Three connectives do nearly all the work: **and** (both), **or** (at least one), **not** (flip). Exclusive or, **xor**, is the pick-exactly-one version of “or”.',
    },
  ],
  recap: [
    '**And** needs both parts true. **Or** needs at least one, and allows both. **Not** flips true and false.',
    'A **truth table** lists every combination, so two statements can be compared row by row.',
    '**De Morgan:** to negate an “and” or an “or”, negate each part and swap the connecting word.',
    'The negation of “every…” is “at least one… not”.',
  ],
  next: 'Next: and, or and not turn into machines you can wire together.',
};
