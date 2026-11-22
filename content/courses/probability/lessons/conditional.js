// Probability & Chance · Lesson 5 · Given That…
import { r, frac } from '../../../kit.js';
import { diceWhere, diceCount, dicePairs, fracText, rawFrac, nearMiss, treeFigure } from '../helpers.js';

const HAS_SIX = (a, b) => a === 6 || b === 6;
const BLUE_EVEN = (a) => a % 2 === 0;
const plain = (text) => text.replace(/\*\*/g, '');
/** "\frac{3}{18} = \frac{1}{6}", or just the fraction when it cannot be simplified. */
const fracSteps = (n, d) => (fracText(n, d) === `${n}/${d}` ? rawFrac(n, d) : `${rawFrac(n, d)} = ${frac(n, d)}`);

// (what you are told, what you are asked) pairs for two dice. "First" and "second" die, so they work without the board.
const DICE_QUESTIONS = [
  { given: 'the total is **10 or more**', B: (a, b) => a + b >= 10, ask: 'both dice show the **same number**', A: (a, b) => a === b },
  { given: 'the total is **8**', B: (a, b) => a + b === 8, ask: '**at least one** die shows a 6', A: HAS_SIX },
  { given: 'the first die shows a **6**', B: (a) => a === 6, ask: 'the total is **10 or more**', A: (a, b) => a + b >= 10 },
  { given: 'the total is **4 or less**', B: (a, b) => a + b <= 4, ask: 'both dice show the **same number**', A: (a, b) => a === b },
  { given: 'both dice show the **same number**', B: (a, b) => a === b, ask: 'the total is **8 or more**', A: (a, b) => a + b >= 8 },
  { given: 'the total is **7**', B: (a, b) => a + b === 7, ask: 'one of the dice shows a **3**', A: (a, b) => a === 3 || b === 3 },
  { given: 'the two dice show **different** numbers', B: (a, b) => a !== b, ask: 'the total is **7**', A: (a, b) => a + b === 7 },
  { given: '**at least one** die shows a 6', B: HAS_SIX, ask: 'the total is **10 or more**', A: (a, b) => a + b >= 10 },
  { given: 'the total is **6**', B: (a, b) => a + b === 6, ask: 'both dice show an **odd** number', A: (a, b) => a % 2 === 1 && b % 2 === 1 },
  { given: 'the first die shows an **odd** number', B: (a) => a % 2 === 1, ask: 'the total is **6**', A: (a, b) => a + b === 6 },
];

// Two-way tables: two yes/no questions about the members of a group.
const TABLES = [
  {
    intro: (n) => `A school asked its ${n} students two things: do you cycle to school, and do you play an instrument?`,
    pick: 'One student is picked at random.',
    rows: ['Cyclists', 'Others'], cols: ['Instrument', 'None'],
    rowIs: 'the student cycles to school', colIs: 'the student plays an instrument',
    rowAsk: 'they cycle to school', colAsk: 'they play an instrument', members: 'students',
  },
  {
    intro: (n) => `A vet's records list ${n} pets, all of them dogs or cats. Some have a microchip.`,
    pick: 'One of these pets is picked at random.',
    rows: ['Dogs', 'Cats'], cols: ['Chip', 'No chip'],
    rowIs: 'the pet is a dog', colIs: 'the pet has a microchip',
    rowAsk: 'it is a dog', colAsk: 'it has a microchip', members: 'pets',
  },
  {
    intro: (n) => `A library checked ${n} of its books: fiction or not, and out on loan or on the shelf.`,
    pick: 'One of these books is picked at random.',
    rows: ['Fiction', 'Other'], cols: ['On loan', 'On shelf'],
    rowIs: 'the book is fiction', colIs: 'the book is out on loan',
    rowAsk: 'it is fiction', colAsk: 'it is out on loan', members: 'books',
  },
];

// The six faces of one die, with the odd ones ruled out by the news "the number is even".
const EVEN_FACES = (() => {
  let out = '';
  for (let n = 1; n <= 6; n++) {
    const x = 12 + (n - 1) * 57;
    const still = n % 2 === 0;
    out += `<rect class="${still ? 'fill-yellow-soft stroke-ink' : 'fill-sunken stroke-ink-3'}" stroke-width="2.5"${still ? '' : ' stroke-dasharray="5 5"'} x="${x}" y="10" width="46" height="46" rx="9"/>`;
    out += `<text class="fig-label-lg"${still ? '' : ' style="fill:var(--ink-3)"'} x="${x + 23}" y="40" text-anchor="middle">${n}</text>`;
    if (!still) out += `<path class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" d="M${x + 6} ${50} L${x + 40} ${16}"/>`;
    out += `<text class="fig-label-sm" style="fill:var(--ink-3)" x="${x + 23}" y="76" text-anchor="middle">${still ? 'possible' : 'out'}</text>`;
  }
  return {
    type: 'svg', viewBox: '0 0 354 84', maxWidth: 400,
    alt: 'The six faces of a die in a row. The faces 1, 3 and 5 are crossed out and marked "out". The faces 2, 4 and 6 are marked "possible".',
    content: out,
  };
})();

export default {
  id: 'conditional',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A peek at the dice',
      text: `
        You roll two dice behind a screen. A friend looks at them, and you
        ask: *"Is at least one of them a six?"* Your friend truthfully answers
        **"Yes."**

        What is the probability that **both** dice show a six?
      `,
      shuffle: false,
      options: [
        { text: r`$\frac{1}{36}$` },
        { text: r`$\frac{1}{11}$`, correct: true },
        { text: r`$\frac{1}{6}$` },
        { text: r`$\frac{1}{2}$` },
      ],
      explain: r`
        It is $\frac{1}{11}$. Not $\frac{1}{36}$, because the answer "yes"
        rules most outcomes out. And not $\frac{1}{6}$ either, which is what
        most people say.

        The board of 36 outcomes shows why.
      `,
    },
    {
      id: 'teach-ruled-out',
      type: 'info',
      title: 'News rules outcomes out',
      text: r`
        Start smaller, with one die: six equally likely faces, and
        $P(\text{six}) = \frac{1}{6}$.

        Now someone who has seen the die tells you: **"The number is even."**
        That rules out 1, 3 and 5. The faces 2, 4 and 6 are still possible,
        and still equally likely.

        :::example
        A six is now 1 of **3** possible outcomes, not 1 of 6. After the
        news, $P(\text{six}) = \frac{1}{3}$.
        :::

        The die did not change. The list of outcomes still in play did.
      `,
      figure: EVEN_FACES,
    },
    {
      id: 'shrink',
      type: 'interact',
      title: 'What is still possible?',
      text: `
        Back to the two dice. Here are all 36 outcomes. Your friend said
        yes: **at least one die shows a six**.

        **Tap every outcome that is still possible.**
      `,
      widget: { type: 'dice-grid', show: 'pair', counter: 'Still possible' },
      check: (s) => {
        const off = s.cells.find(([a, b]) => !HAS_SIX(a, b));
        if (off) return `Blue ${off[0]} with orange ${off[1]} has no six, so your friend would have said no. It is ruled out.`;
        if (s.count === 0) return 'Tap a cell to select it. You can also drag across cells.';
        if (s.count < 11) return `${s.count} so far, all correct. A six on *either* die is enough: there are more.`;
        return true;
      },
      solution: { on: diceWhere(HAS_SIX) },
      hints: ['The six can be on the blue die (one whole row) or on the orange die (one whole column).'],
      explain: `
        Only these 11 outcomes are left: one row and one column, sharing the
        corner. The answer "yes" did not change the dice. It changed which
        outcomes are still in play.
      `,
    },
    {
      id: 'given',
      type: 'info',
      title: '"Given that" shrinks the world',
      text: r`
        The 11 outcomes that are left are still equally likely, and exactly
        one of them is a double six. A probability worked out *after* you
        have learned something is called a **conditional probability**. It
        is written with a bar, read as "given":

        $$ P(\text{double six} \mid \text{a six}) = \frac{1}{11} $$

        :::key
        New information removes outcomes. What is left becomes the whole
        world, and you count inside it:

        $P(A \mid B) = \dfrac{\text{outcomes in } A \text{ and } B}{\text{outcomes in } B}$
        :::
      `,
      figure: {
        type: 'dice-grid', static: true, show: 'pair', cell: 44, given: HAS_SIX, on: (a, b) => a === 6 && b === 6,
        alt: 'The board of 36 outcomes. The 25 outcomes without a six are faded out. Of the 11 that remain, only the double six is highlighted.',
      },
    },
    {
      id: 'given-even',
      type: 'interact',
      title: 'Count inside the smaller world',
      text: `
        A new roll. This time you are told: **the blue die shows an even
        number**. The outcomes this rules out have faded.

        **Among the outcomes that are still possible, tap those with a total of 8.**
      `,
      widget: { type: 'dice-grid', show: 'pair', given: BLUE_EVEN, counter: 'Selected' },
      check: (s) => {
        const off = s.cells.find(([a, b]) => a + b !== 8);
        if (off) return `Blue ${off[0]} and orange ${off[1]} add up to ${off[0] + off[1]}, not 8.`;
        if (s.count === 0) return 'Tap a cell to select it.';
        if (s.count < 3) return `${s.count} so far. Check each of the three rows that are left.`;
        return true;
      },
      solution: { on: diceWhere((a, b) => BLUE_EVEN(a) && a + b === 8) },
      hints: ['If the blue die shows 2, what must the orange die show? Then ask the same for 4 and for 6.'],
      explain: r`
        Three of the 18 remaining outcomes add up to 8: (2, 6), (4, 4) and (6, 2).

        $$ P(\text{total 8} \mid \text{blue even}) = \frac{3}{18} = \frac{1}{6} $$

        Without the information it would be $\frac{5}{36}$: five outcomes out
        of 36. The news removed two of those five, but it removed half of the
        board as well.
      `,
    },
    {
      id: 'cond-dice',
      type: 'numeric',
      review: true,
      figure: {
        type: 'dice-grid', show: 'pair', counter: false, cell: 40,
        alt: 'The board of all 36 outcomes. You can tap cells to mark them.',
        caption: 'First die: rows. Second die: columns. Tap cells to mark them if it helps you count.',
      },
      gen: (rng) => {
        const q = rng.pick(DICE_QUESTIONS);
        const both = (a, b) => q.A(a, b) && q.B(a, b);
        const nB = diceCount(q.B);
        const nA = diceCount(q.A);
        const nBoth = diceCount(both);
        const wrong = [
          [nBoth / 36, `That is out of all 36 outcomes. Once you know that ${plain(q.given)}, only ${nB} outcomes are still possible. Divide by those.`],
          [nA / 36, `That ignores what you were told. Count only inside the ${nB} outcomes that are still possible.`],
        ];
        if (nA !== nB) wrong.push([nBoth / nA, `That is the reverse question: the probability that ${plain(q.given)}, given that ${plain(q.ask)}.`]);
        return {
          text: `
            Two dice are rolled. You are told that ${q.given}.

            Given this, what is the probability that ${q.ask}? Give your answer as a fraction.
          `,
          answer: `${nBoth}/${nB}`,
          display: fracText(nBoth, nB),
          tolerance: 0.0005,
          wrong,
          feedback: nearMiss(nBoth / nB),
          hints: [
            `First find the outcomes that are still possible: those in which ${plain(q.given)}. How many are there?`,
            nB <= 12
              ? `Still possible: ${dicePairs(q.B)}. In how many of these is it true that ${plain(q.ask)}?`
              : `${nB} outcomes are still possible. In how many of them is it true that ${plain(q.ask)}?`,
          ],
          explain: r`
            Still possible: ${nB} outcomes${nB <= 12 ? ` (${dicePairs(q.B)})` : ''}. Among them,
            ${nBoth} ${nBoth === 1 ? 'fits' : 'fit'}: ${dicePairs(both)}. So the probability is $${fracSteps(nBoth, nB)}$.
          `,
        };
      },
    },
    {
      id: 'teach-independent',
      type: 'info',
      title: 'Does the news matter?',
      text: r`
        To see what a piece of news does, compare the probability **before**
        and **after**. Say you learn that the blue die shows a 6. Only the
        bottom row is left: six outcomes.

        | Event | Before | Given blue 6 |
        |:---|:---:|:---:|
        | Total is 11 | $\frac{2}{36}$ | $\frac{1}{6}$ |
        | Orange die is even | $\frac{18}{36}$ | $\frac{3}{6}$ |

        A total of 11 has become three times as likely. "Orange is even"
        has not moved: it was one half and it still is.

        :::key
        When news leaves a probability unchanged, the event is
        **independent** of that news: $P(A \mid B) = P(A)$.
        :::
      `,
      figure: {
        type: 'dice-grid', static: true, show: 'sum', cell: 44, given: (a) => a === 6, on: (a, b) => a === 6 && b === 5,
        alt: 'The board of 36 outcomes showing the total in each cell. Everything except the bottom row, where the blue die shows 6, is faded out. In that row the totals run from 7 to 12, and the cell with total 11 is highlighted.',
        caption: 'Given a blue 6, only the bottom row is left.',
      },
    },
    {
      id: 'shift',
      type: 'bucket',
      text: `
        You roll two dice and learn that **the blue die shows a 6**. What does
        this news do to the probability of each event?
      `,
      buckets: ['More likely now', 'Less likely now', 'No change'],
      items: [
        { text: 'The total is 12', bucket: 0, why: 'A total of 12 needs two sixes, and one of them has just arrived: the chance rises from 1 in 36 to 1 in 6.' },
        { text: 'The total is 10 or more', bucket: 0, why: 'With a 6 on the blue die, an orange 4, 5 or 6 is enough: the chance rises from 1 in 6 to 1 in 2.' },
        { text: 'The total is 5', bucket: 1, why: 'With a 6 on the blue die the total is at least 7. A total of 5 has become impossible.' },
        { text: 'Both dice show odd numbers', bucket: 1, why: 'A 6 is even, so this cannot happen any more.' },
        { text: 'The total is 7', bucket: 2, why: 'It needed one particular orange number before (whatever blue showed), and it still does: 1 in 6 both times.' },
        { text: 'The orange die shows a 3', bucket: 2, why: 'The blue die tells you nothing about the orange one: still 1 in 6.' },
        { text: 'The dice show the same number', bucket: 2, why: 'A double had probability 6 in 36. Now it needs an orange 6: 1 in 6. The same.' },
      ],
      explain: r`
        Given a blue 6, only the six outcomes of the bottom row are left. A
        total of 12 jumps from $\frac{1}{36}$ to $\frac{1}{6}$, a total of 5
        drops to 0, and a total of 7 stays at exactly $\frac{1}{6}$: it is
        independent of the news.
      `,
    },
    {
      id: 'example-table',
      type: 'info',
      title: 'Reading a two-way table',
      text: r`
        Counts often come in a table. Here are 100 orders at a café, sorted
        by drink and by whether milk was added. "Given that…" tells you
        which row or column is the whole world now.

        |  | Milk | No milk | Total |
        |---|---:|---:|---:|
        | **Tea** | 12 | 28 | 40 |
        | **Coffee** | 45 | 15 | 60 |
        | **Total** | 57 | 43 | 100 |

        :::example
        One order is picked at random.

        - Given that it is **tea**: look only at the row "Tea", 40 orders. 12 of them have milk: $\frac{12}{40} = \frac{3}{10}$.
        - Given that it has **milk**: look only at the column "Milk", 57 orders. 12 of them are tea: $\frac{12}{57} = \frac{4}{19}$.
        :::
      `,
    },
    {
      id: 'table',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const t = rng.pick(TABLES);
        // a b / c d: rows × columns. Re-draw until the right answer is clearly different from the tempting wrong ones.
        const byRow = rng.bool();
        let a; let b; let c; let d; let total; let group; let other;
        for (let guard = 0; guard < 100; guard++) {
          a = rng.int(6, 30);
          b = rng.int(5, 30);
          c = rng.int(5, 40);
          d = rng.int(10, 60);
          total = a + b + c + d;
          group = byRow ? a + b : a + c;
          other = byRow ? a + c : a + b;
          const answer = a / group;
          if ([a / total, a / other, group / total].every((v) => Math.abs(v - answer) > 0.02)) break;
        }
        const told = byRow ? t.rowIs : t.colIs;
        const asked = byRow ? t.colAsk : t.rowAsk;
        const where = byRow ? `the row "${t.rows[0]}"` : `the column "${t.cols[0]}"`;
        return {
          text: `
            ${t.intro(total)}

            |  | ${t.cols[0]} | ${t.cols[1]} | Total |
            |---|---:|---:|---:|
            | **${t.rows[0]}** | ${a} | ${b} | ${a + b} |
            | **${t.rows[1]}** | ${c} | ${d} | ${c + d} |
            | **Total** | ${a + c} | ${b + d} | ${total} |

            ${t.pick} **Given that ${told}, what is the probability that ${asked}?** Give your answer as a fraction.
          `,
          answer: `${a}/${group}`,
          display: fracText(a, group),
          tolerance: 0.0005,
          wrong: [
            [a / total, `That is the share of *all* ${total} ${t.members}. "Given that ${told}" means: look only at ${where}.`],
            [a / other, `That answers the question the other way round. You were told that ${told}: look only at ${where}.`],
            [group / total, `That is the probability that ${told}. You already know it is so. What is asked is how many of *those* ${t.members} fit.`],
          ],
          feedback: nearMiss(a / group),
          hints: [
            '"Given that…" tells you which row or column to look at. Everything outside it is ruled out.',
            `Look only at ${where}: ${group} ${t.members}. How many of those fit?`,
          ],
          explain: r`
            "Given that ${told}" leaves only ${where}: ${group} ${t.members}. Of those,
            ${a} fit, so the probability is $${fracSteps(a, group)}$.
          `,
        };
      },
    },
    {
      id: 'flip',
      type: 'fill',
      title: 'Which way round?',
      text: `
        A survey asked 200 people whether they own a dog and whether they go
        for a walk every day.

        |  | Dog | No dog | Total |
        |---|---:|---:|---:|
        | **Walks daily** | 40 | 20 | 60 |
        | **Does not** | 10 | 130 | 140 |
        | **Total** | 50 | 150 | 200 |

        **Fill in the two blanks.** They are not the same number.
      `,
      template: `
        Given that a person **has a dog**, the chance that they walk daily is 40 out of [[50]].

        Given that a person **walks daily**, the chance that they have a dog is 40 out of [[60]].
      `,
      explain: r`
        The same 40 people are on top both times, but a different group is underneath:

        $$ P(\text{walks} \mid \text{dog}) = \frac{40}{50} = 80\% $$

        $$ P(\text{dog} \mid \text{walks}) = \frac{40}{60} \approx 67\% $$

        Swapping the two sides of the bar changes the question.
      `,
    },
    {
      id: 'which-bigger',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const s = rng.pick([
          {
            big: 'The probability that an animal **has four legs**, given that it is a dog',
            small: 'The probability that an animal **is a dog**, given that it has four legs',
            why: 'Nearly every dog has four legs. But most four-legged animals are not dogs: think of cats, cows and mice.',
          },
          {
            big: 'The probability that a person **can swim**, given that they are an Olympic swimmer',
            small: 'The probability that a person **is an Olympic swimmer**, given that they can swim',
            why: 'Every Olympic swimmer can swim. But of the hundreds of millions of people who can swim, only a tiny handful are Olympic swimmers.',
          },
          {
            big: 'The probability that the street **is wet**, given that it is raining',
            small: 'The probability that **it is raining**, given that the street is wet',
            why: 'Rain practically always wets the street. But a wet street has other causes too: the rain may have stopped, or the street may just have been cleaned.',
          },
          {
            big: 'The probability that a whole number **is even**, given that it is a multiple of 4',
            small: 'The probability that a whole number **is a multiple of 4**, given that it is even',
            why: 'Every multiple of 4 is even, so the first probability is 1. But only every second even number is a multiple of 4, so the other is one half.',
          },
        ]);
        const options = [
          { text: s.big, correct: true },
          { text: s.small, why: `Try it the other way round. ${s.why}` },
        ];
        if (rng.bool()) options.reverse();
        options.push({ text: 'Neither: they are the same probability', why: `They involve the same two things, but they are different questions. ${s.why}` });
        return {
          text: 'Which of these two probabilities is **larger**?',
          options,
          shuffle: false,
          columns: 1,
          explain: r`${s.why} $P(A \mid B)$ and $P(B \mid A)$ are different questions, and their answers can be very far apart.`,
        };
      },
    },
    {
      id: 'example-no-replace',
      type: 'info',
      title: 'When the first draw changes the second',
      text: r`
        Take out two marbles and **keep the first one out**: the draws are
        no longer independent, because the first changes what is left for
        the second. "And" still means multiply, but the second factor is a
        conditional probability.

        :::key
        $P(A \text{ and } B) = P(A) \times P(B \mid A)$
        :::

        :::example
        A bag holds 2 red and 3 blue marbles. Are both marbles red?

        First red: $\frac{2}{5}$. Given that, 1 red is left among 4
        marbles: $\frac{1}{4}$. Both: $\frac{2}{5} \times \frac{1}{4} = \frac{2}{20} = \frac{1}{10}$.
        :::
      `,
      figure: treeFigure({
        titles: ['first marble', 'second marble'],
        first: [{ label: 'red', p: '2/5' }, { label: 'blue', p: '3/5' }],
        second: [
          [{ label: 'red', p: '1/4' }, { label: 'blue', p: '3/4' }],
          [{ label: 'red', p: '2/4' }, { label: 'blue', p: '2/4' }],
        ],
        leaves: ['2/20', '6/20', '6/20', '6/20'],
        colors: ['gray', 'gray'],
        highlight: [0],
        alt: 'A probability tree. First marble: red with probability two fifths, blue with probability three fifths. Second marble after a red one: red one quarter, blue three quarters. After a blue one: red two quarters, blue two quarters. The path "red, then red" has probability two twentieths; each of the other three paths has six twentieths.',
      }),
    },
    {
      id: 'no-replace',
      type: 'numeric',
      stretch: true,
      title: 'Two in a row',
      gen: (rng) => {
        const red = rng.int(3, 6);
        const blue = rng.int(2, 5);
        const total = red + blue;
        const n = red * (red - 1);
        const d = total * (total - 1);
        return {
          text: `
            A bag holds **${red} red** and **${blue} blue** marbles. You take out
            two marbles, one after the other, **without putting the first one back**.

            What is the probability that **both are red**? Give your answer as a fraction.
          `,
          figure: {
            type: 'marble-bag', static: true, width: 200, marbles: { red, blue },
            alt: `A bag holding ${red} red and ${blue} blue marbles.`,
          },
          answer: `${n}/${d}`,
          display: fracText(n, d),
          tolerance: 0.0005,
          wrong: [
            [(red * red) / (total * total), `That would be right if the first marble went back into the bag. It stays out, so for the second draw only ${red - 1} of the ${total - 1} remaining marbles are red.`],
            [(red * (red - 1)) / (total * total), `After the first draw only ${total - 1} marbles are left in the bag, not ${total}.`],
            [red / total, 'That is the chance for the first marble alone. The second one has to be red as well.'],
            [(red - 1) / (total - 1), 'That is the chance for the second marble, given that the first was red. Multiply it by the chance that the first is red.'],
          ],
          feedback: nearMiss(n / d),
          hints: [
            r`The first marble is red with probability $\frac{${red}}{${total}}$.`,
            'Now suppose it *was* red, and it stays out. What is in the bag for the second draw?',
            r`Given a red first marble, the second is red with probability $\frac{${red - 1}}{${total - 1}}$. Multiply the two.`,
          ],
          explain: r`
            First marble red: $\frac{${red}}{${total}}$. **Given that**, the bag
            holds ${red - 1} red among ${total - 1} marbles, so the second is red
            with probability $\frac{${red - 1}}{${total - 1}}$:

            $$ \frac{${red}}{${total}} \times \frac{${red - 1}}{${total - 1}} = ${fracSteps(n, d)} $$

            That is $P(A \text{ and } B) = P(A) \times P(B \mid A)$ at work.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'In your own words: **what does "given that" do to a probability question?**',
      model: `
        It rules out every outcome in which the given thing is not true. The
        outcomes that are left become the whole world, and you count inside
        that smaller world: the outcomes you want, out of the outcomes still
        possible.

        It also matters which way round you ask: the probability of A given B
        is usually not the probability of B given A.
      `,
    },
  ],
  recap: [
    '"Given that" removes outcomes. What is left becomes the whole world.',
    r`$P(A \mid B)$ = outcomes in both A and B ÷ outcomes in B.`,
    'If the news does not change a probability, the event is independent of the news.',
    r`$P(A \mid B)$ and $P(B \mid A)$ are different questions, usually with different answers.`,
  ],
  next: 'Next: the most famous mix-up of those two, and why it matters when a medical test comes back positive.',
};
