// Probability II: Random Variables · Lesson 3 · How Much Does It Wobble?
import { r, num } from '../../../kit.js';
import { commas, rawFrac, slips, listAnd } from '../helpers.js';

// The six equally likely ways to hand three hats back to guests A, B and C: the letter in column j is the hat that guest j gets.
const HAT_ORDERS = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
const GUESTS = ['A', 'B', 'C'];
const HAT_CELLS = HAT_ORDERS.join('').split('');
const ownHat = (i) => HAT_CELLS[i] === GUESTS[i % 3];
const OWN_HATS = HAT_CELLS.map((_, i) => i).filter(ownHat);

const coinWord = (v) => (v === 1 ? 'coin' : 'coins');

export default {
  id: 'random-variables',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two bets, one average',
      text: `
        **Bet A:** flip a fair coin once. Heads pays 100 coins, tails pays nothing.

        **Bet B:** flip a fair coin 100 times. Every head pays 1 coin.

        Both pay 50 coins on average. **Which bet is more likely to pay you less than 40 coins?**
      `,
      shuffle: false,
      options: [
        { text: 'Bet A', correct: true },
        { text: 'Bet B' },
        { text: 'They are equally likely to' },
      ],
      explain: `
        Bet A pays less than 40 coins half the time: whenever the coin lands tails. Bet B does so
        only if 39 or fewer of the 100 flips are heads, which happens less than 2 times in 100.

        The same expected value, and completely different risks. Expected value cannot see the
        difference. This lesson builds the number that can.
      `,
    },
    {
      id: 'teach-random-variable',
      type: 'info',
      title: 'A number that depends on chance',
      text: r`
        Roll a die for a prize: 1, 2 or 3 wins nothing, 4 or 5 wins 2 coins, and a six wins 8 coins.
        The prize is a **random variable**: a number whose value depends on chance. Call it $X$.

        Its **distribution** lists every value it can take, with the probability of each. The
        probabilities add up to 1. The chart shows the same thing as bars.

        | Prize $X$ | 0 | 2 | 8 |
        |---|---|---|---|
        | Probability | $\frac{3}{6}$ | $\frac{2}{6}$ | $\frac{1}{6}$ |

        :::example
        The **expected value** of $X$ is written $E(X)$. It is the long-run average from the first
        course: multiply each value by its probability, then add.

        - $0 \times \frac{3}{6} + 2 \times \frac{2}{6} + 8 \times \frac{1}{6} = 2$ coins
        :::
      `,
      figure: {
        type: 'dice-sum-lab', static: true, values: [0, 2, 8], weights: [3, 2, 1], n: 1, die: false, axis: 'prize, in coins', meanLabel: 'expected value',
        alt: 'A bar chart of the prize: a bar of one half at 0 coins, a bar of one third at 2 coins and a bar of one sixth at 8 coins. A dashed line marks the expected value, 2 coins.',
      },
    },
    {
      id: 'distribution',
      type: 'fill',
      title: 'Two coins',
      text: `
        Flip two fair coins and count the heads. That count is a random variable too.

        **Fill in its distribution, and then the expected value.** Fractions and decimals are both fine.
      `,
      template: `
        | Number of heads | 0 | 1 | 2 |
        |---|---|---|---|
        | Probability | [[1/4]] | [[1/2]] | [[1/4]] |

        Expected value: [[1]] head.
      `,
      tolerance: 0.001,
      hints: [
        'The four equally likely results are HH, HT, TH and TT.',
        'Expected value, from the first course: multiply each value by its probability, then add.',
      ],
      explain: r`
        One result in four has no heads, two have one head, one has two. The expected value is
        $0 \times \frac{1}{4} + 1 \times \frac{1}{2} + 2 \times \frac{1}{4} = 1$.

        The expected value says where the distribution is centred. It says nothing about how far
        from the centre the values typically fall.
      `,
    },
    {
      id: 'reweight',
      type: 'interact',
      attempts: 6,
      title: 'Load the die',
      text: `
        The roll of a die is a random variable too, and this die can be loaded: **tap a bar to change how
        likely that face is.**

        The dashed line marks the expected value. The shaded band reaches one **standard deviation (SD)**
        either side of it: the typical distance between a roll and the expected value.

        **Keep the expected value at exactly 3.5, and make the SD as large as you can.**
      `,
      widget: {
        type: 'dice-sum-lab', edit: true, n: 1, band: 1, maxWeight: 4, readouts: ['mean', 'sd'], meanLabel: 'expected value',
        alt: 'A bar chart of the chance of each face of a die, with the expected value and a band of one standard deviation either side.',
      },
      check: (s) => {
        if (Math.abs(s.mean - 3.5) > 1e-9) return `The expected value is now ${num(s.mean, 2)}. Keep it at exactly 3.5: weight on low faces has to be balanced by weight on high faces.`;
        if (s.sd > 2.49) return true;
        if (s.flat) return 'That is a fair die, with an SD of 1.71. Move the weight away from the middle.';
        return `The expected value is 3.5 and the SD is ${num(s.sd, 2)}. It can be larger: which faces are furthest from 3.5?`;
      },
      solution: { weights: [1, 0, 0, 0, 0, 1] },
      hints: [
        'Distance from 3.5 is what counts. Which two faces are furthest from 3.5?',
        'Take all the weight off the faces 2, 3, 4 and 5, and give faces 1 and 6 equal weight.',
      ],
      explain: `
        All the weight on 1 and 6, half each. Every roll then lands exactly 2.5 away from 3.5, so the
        typical distance is exactly **2.5**.

        A fair die has an SD of about 1.71. A die that only shows 3 or 4 has an SD of 0.5. All three dice
        have the same expected value. The SD is what tells them apart.
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: 'Variance and standard deviation',
      text: r`
        Here is the recipe the chart was using, for a random variable with expected value $\mu$.

        1. For each value, take its distance from $\mu$ and **square** it.
        2. Take the expected value of those squares: weight each by its probability and add. This is the **variance**.
        3. Take the **square root**. This is the **standard deviation**, in the same unit as the variable.

        For the die that shows 1 or 6: the distances are $-2.5$ and $+2.5$, both squares are $6.25$, so the
        variance is $6.25$ and the SD is $\sqrt{6.25} = 2.5$.

        :::note
        If you have met the standard deviation of a data set, this is the same recipe. The only change
        is that probabilities do the averaging.
        :::
      `,
    },
    {
      id: 'example-sd',
      type: 'info',
      title: 'The recipe, line by line',
      text: r`
        When the values are not equally likely, the expected value comes first, and every square is
        weighted by its probability.

        :::example
        A lucky dip pays **10 coins** with probability $\frac{4}{5}$ and **20 coins** with probability $\frac{1}{5}$.

        1. Expected value: $\frac{4}{5} \times 10 + \frac{1}{5} \times 20 = 12$ coins.
        2. Distances from 12: one prize lies 2 below, the other 8 above. Squared: 4 and 64.
        3. Variance: $\frac{4}{5} \times 4 + \frac{1}{5} \times 64 = 16$.
        4. Standard deviation: $\sqrt{16} = 4$ coins.
        :::

        In the chart, the band reaches 4 coins either side of the expected value.
      `,
      figure: {
        type: 'dice-sum-lab', static: true, values: [10, 20], weights: [4, 1], n: 1, x: [6, 22], die: false, band: 1, readouts: ['mean', 'sd'], axis: 'prize, in coins', meanLabel: 'expected value',
        alt: 'A bar chart of the prize: a tall bar at 10 coins and a short bar at 20 coins. A dashed line marks the expected value, 12 coins, and a shaded band reaches from 8 to 16 coins.',
      },
    },
    {
      id: 'sd-table',
      type: 'fill',
      review: true,
      gen: (rng) => {
        // Families whose variance is a perfect square, so that every blank is a whole number.
        const kind = rng.pick(['even', 'fifth', 'tenth', 'three']);
        let rows;
        if (kind === 'even') {
          const a = rng.int(0, 4);
          const d = rng.int(2, 5);
          rows = [[a, 1, 2], [a + 2 * d, 1, 2]];
        } else if (kind === 'fifth') {
          const a = rng.pick([0, 1, 2, 5]);
          const m = rng.int(1, 3);
          rows = [[a, 4, 5], [a + 5 * m, 1, 5]];
        } else if (kind === 'tenth') {
          const a = rng.pick([0, 1, 2]);
          const m = rng.int(1, 2);
          rows = [[a, 9, 10], [a + 10 * m, 1, 10]];
        } else {
          const m = rng.int(1, 2);
          const c = 4 * m + rng.int(0, 3);
          rows = [[c - 4 * m, 1, 8], [c, 3, 4], [c + 4 * m, 1, 8]];
        }
        const mean = rows.reduce((t, [v, n, d]) => t + (v * n) / d, 0);
        const variance = rows.reduce((t, [v, n, d]) => t + ((v - mean) ** 2 * n) / d, 0);
        const sd = Math.sqrt(variance);
        const table = rows.map(([v, n, d]) => `| ${v} ${coinWord(v)} | $${rawFrac(n, d)}$ |`).join('\n');
        const evTex = rows.map(([v, n, d]) => `${rawFrac(n, d)} \\times ${v}`).join(' + ');
        const varTex = rows.map(([v, n, d]) => `${rawFrac(n, d)} \\times ${num((v - mean) ** 2)}`).join(' + ');
        const dists = rows.map(([v]) => num(Math.abs(v - mean)));
        return {
          text: `A lucky dip pays out as follows.\n\n| Prize | Probability |\n|---|:---:|\n${table}\n\n**Find the expected value, the variance and the standard deviation of the prize.**`,
          template: `Expected value: [[${num(mean)}]] coins. Variance: [[${num(variance)}]]. Standard deviation: [[${num(sd)}]] coins.`,
          hints: [
            'Expected value first: multiply each prize by its probability, and add.',
            `The prizes lie ${listAnd(dists)} away from the expected value. Square those distances, weight each by its probability, and add: that is the variance.`,
            'The standard deviation is the square root of the variance.',
          ],
          explain: r`
            Expected value: $${evTex} = ${num(mean)}$.
            Variance: $${varTex} = ${num(variance)}$, using the squared distances from ${num(mean)}.
            Standard deviation: $\sqrt{${num(variance)}} = ${num(sd)}$ ${coinWord(sd)}.
          `,
        };
      },
    },
    {
      id: 'rank-risk',
      type: 'order',
      review: true,
      text: `
        Four offers. Each has an expected value of exactly **10 coins**.

        **Put them in order of standard deviation, smallest first.**
      `,
      items: [
        '10 coins for certain',
        'A fair coin flip: 20 coins or nothing',
        'A 1-in-10 chance of 100 coins, otherwise nothing',
        'A 1-in-100 chance of 1,000 coins, otherwise nothing',
      ],
      labels: ['Smallest SD (safest)', 'Largest SD (riskiest)'],
      hints: ['How far from 10 coins do the results of each offer fall? The further and the more lopsided, the larger the SD.'],
      explain: r`
        The SDs are 0, then 10, then 30, then about 99.5 coins.

        For the third offer: the results are 100 and 0, which lie 90 and 10 away from the expected value.
        Variance $= \frac{1}{10} \times 90^2 + \frac{9}{10} \times 10^2 = 900$, so the SD is 30.

        Expected value put all four offers at the same point. The SD spreads them out again.
      `,
    },
    {
      id: 'hats',
      type: 'interact',
      title: 'Whose hat is it?',
      text: `
        Three guests, A, B and C, leave their hats at the door. On the way out the hats are handed back
        in a random order, and all six orders are equally likely.

        Each row shows one order: the first column is the hat that guest A receives, and so on.
        **Tap every hat that went back to its owner.**
      `,
      widget: {
        type: 'grid', rows: 6, cols: 3, labels: HAT_CELLS, cell: 50, colors: ['green'], counter: 'Hats returned to their owner',
        colLabels: ['A gets', 'B gets', 'C gets'],
        alt: 'Six rows, one for each order in which three hats can be handed back to guests A, B and C.',
      },
      check: (s) => {
        const bad = s.on.find((i) => !ownHat(i));
        if (bad != null) return `In row ${Math.floor(bad / 3) + 1}, guest ${GUESTS[bad % 3]} gets hat ${HAT_CELLS[bad]}, which is not their own.`;
        if (s.count === 0) return 'Tap a hat to select it. A hat is back with its owner when its letter matches its column.';
        if (s.count < OWN_HATS.length) return `${s.count} so far, all correct. There are more.`;
        return true;
      },
      solution: { on: OWN_HATS },
      hints: ['Go down one column at a time. In column "A gets", look for the letter A.'],
      explain: r`
        Six matches in six equally likely rows: on average, exactly **1** guest gets their own hat.

        Now look down the columns. Each guest's own hat appears in 2 of the 6 rows, a chance of
        $\frac{1}{3}$. Three guests, each with a chance of $\frac{1}{3}$: $3 \times \frac{1}{3} = 1$. Adding up the
        columns gives the same total as adding up the rows.
      `,
    },
    {
      id: 'hats-100',
      type: 'choice',
      mode: 'predict',
      text: `
        Now **100 guests** leave their hats, and all 100 hats are handed back in a random order.

        **On average, how many guests get their own hat back?**
      `,
      shuffle: false,
      options: [
        { text: 'Far fewer than 1' },
        { text: 'Exactly 1', correct: true },
        { text: 'About 10' },
        { text: 'About 50' },
      ],
      explain: r`
        Still exactly 1, and the same for a thousand guests or a million.

        Each guest has a chance of $\frac{1}{100}$ of getting their own hat, and
        $100 \times \frac{1}{100} = 1$. Working out the full distribution of the number of matches would be
        hard. Its expected value takes one line.
      `,
    },
    {
      id: 'linearity',
      type: 'info',
      title: 'Expected values add. Always.',
      text: r`
        The number of matches is a **sum**: one number for each guest, equal to 1 if that guest gets
        their own hat and 0 if not. Each of those has expected value $\frac{1}{100}$.

        :::key
        The expected value of a sum is the sum of the expected values:
        $$ E(X + Y) = E(X) + E(Y) $$
        This holds **whether or not** $X$ and $Y$ are independent.
        :::

        The hats are far from independent: if 99 guests have their own hats, the last one must too. It
        makes no difference. You may add up the hat table row by row or column by column, and the total is the same.

        :::example
        **Two dice:** each has expected value 3.5, so the total has $3.5 + 3.5 = 7$.

        **Sixes in 60 rolls:** each roll adds $\frac{1}{6}$ to the expected count, so expect $\mathord{60 \times \frac{1}{6} = 10}$ sixes.
        :::
      `,
    },
    {
      id: 'add-means',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['dice', 'quiz', 'aces', 'letters', 'birthdays']);
        if (kind === 'dice') {
          const n = rng.int(3, 12);
          return {
            text: `You roll **${n} fair dice** and add up the numbers. One die has an expected value of 3.5.\n\n**What is the expected total?**`,
            answer: 3.5 * n,
            wrong: slips(3.5 * n, [
              [3.5, `That is one die. There are ${n} of them, and expected values add.`],
              [6 * n, 'That is the largest possible total, not the expected one.'],
            ]),
            hints: ['The total is a sum of single rolls. Expected values add.'],
            explain: r`$${n} \times 3.5 = ${num(3.5 * n)}$. The expected value of a sum is the sum of the expected values.`,
          };
        }
        if (kind === 'quiz') {
          const m = rng.pick([2, 4, 5]);
          const n = rng.pick([10, 20, 40]);
          return {
            text: `A test has **${n} questions**, each with ${m} possible answers, one of them right. You pick every answer at random.\n\n**What is the expected number of right answers?**`,
            answer: n / m,
            wrong: slips(n / m, [
              [n, 'That would be every question right. Each one is right only some of the time.'],
              [1 / m, `That is the expected number right on a single question. There are ${n} questions, and expected values add.`],
            ]),
            hints: [r`Each question adds 1 right answer with probability $${rawFrac(1, m)}$, so it adds $${rawFrac(1, m)}$ to the expected count.`],
            explain: r`Each question contributes $${rawFrac(1, m)}$ on average, so the expected count is $${n} \times ${rawFrac(1, m)} = ${num(n / m)}$.`,
          };
        }
        if (kind === 'aces') {
          const c = rng.pick([13, 26, 39]);
          return {
            text: `
              You are dealt **${c} cards** from a well-shuffled deck of 52, which contains 4 aces. Each card
              you receive has a chance of $${rawFrac(1, 13)}$ of being an ace, though the cards are not independent
              of each other.

              **What is the expected number of aces in your hand?**
            `,
            answer: c / 13,
            wrong: slips(c / 13, [
              [4, 'That would be all four aces. Each of your cards is an ace only one time in 13.'],
              [1 / 13, `That is the expected number of aces for a single card. You hold ${c} cards, and expected values add.`],
            ]),
            hints: [r`Each card adds $${rawFrac(1, 13)}$ to the expected count. Expected values add, even when the cards depend on each other.`],
            explain: r`$${c} \times ${rawFrac(1, 13)} = ${c / 13}$. The cards are dealt without replacement, so they are not independent. For expected values that does not matter.`,
          };
        }
        if (kind === 'letters') {
          const n = rng.pick([5, 8, 20, 50]);
          return {
            text: `
              A hurried clerk puts **${n} letters** into ${n} addressed envelopes completely at random, one
              letter in each. Each letter has a chance of $${rawFrac(1, n)}$ of landing in its own envelope.

              **What is the expected number of letters in the right envelope?**
            `,
            answer: 1,
            wrong: slips(1, [
              [1 / n, `That is the expected number for a single letter. There are ${n} letters, and expected values add.`],
              [n / 2, 'Each letter is right far less than half the time: only one envelope in the whole pile is its own.'],
              [0, 'More often than not, at least one letter does land in the right envelope. Add up the chances.'],
            ]),
            hints: [r`Each letter adds $${rawFrac(1, n)}$ to the expected count. Expected values add, even though the letters depend on each other.`],
            explain: r`$${n} \times ${rawFrac(1, n)} = 1$, whatever the number of letters. The letters are not independent, and it makes no difference.`,
          };
        }
        const days = 365;
        const people = rng.pick([730, 1460, 3650]);
        return {
          text: `
            A village has **${commas(people)} people**. Assume each person is equally likely to be born on any
            of the ${days} days of the year.

            **What is the expected number of villagers whose birthday is today?**
          `,
          answer: people / days,
          wrong: slips(people / days, [
            [1, 'One would be right for a village of 365 people. This village is larger.'],
            [1 / days, `That is the expected number for a single villager. There are ${commas(people)} of them, and expected values add.`],
          ]),
          hints: [r`Each villager adds $${rawFrac(1, days)}$ to the expected count.`],
          explain: r`$${people} \times ${rawFrac(1, days)} = ${people / days}$. Each person contributes $${rawFrac(1, days)}$, and expected values add.`,
        };
      },
    },
    {
      id: 'spread-adds',
      type: 'choice',
      title: 'Does the spread add too?',
      text: `
        Two ways to get a number between 2 and 12, both with an expected value of 7.

        **Left:** roll one die and double it. **Right:** roll two dice and add them.

        **Which has the larger standard deviation?**
      `,
      figure: [
        {
          type: 'dice-sum-lab', static: true, values: [2, 4, 6, 8, 10, 12], n: 1, x: [2, 12], yMax: 0.2, noun: ['doubled die', 'doubled dice'], meanLabel: 'expected value',
          alt: 'One die, doubled: six bars of equal height at 2, 4, 6, 8, 10 and 12.', caption: 'One die, doubled',
        },
        {
          type: 'dice-sum-lab', static: true, n: 2, x: [2, 12], yMax: 0.2, meanLabel: 'expected value',
          alt: 'Two dice, added: bars from 2 to 12 that rise to a peak at 7 and fall again.', caption: 'Two dice, added',
        },
      ],
      shuffle: false,
      options: [
        { text: 'One die, doubled', correct: true },
        { text: 'Two dice, added', why: 'Look at the pictures: the total of two dice crowds towards 7, because a high roll on one die is often cancelled by a low roll on the other.' },
        { text: 'They are equal', why: 'The expected values are equal. But two separate dice can cancel each other out, and a doubled die never cancels itself.' },
      ],
      explain: r`
        Doubling one die doubles every distance from the centre, so its SD is $2 \times 1.71 = 3.42$.

        Two separate dice often pull in opposite directions: a high roll on one is cancelled by a low
        roll on the other. Their total has an SD of only 2.42.
      `,
    },
    {
      id: 'teach-variances-add',
      type: 'info',
      title: 'What adds, and when',
      text: r`
        Where does 2.42 come from? Standard deviations do not add. For **independent** random
        variables it is the *variances* that add. Add them first, then take the square root.

        :::example
        One die has variance $\frac{35}{12} \approx 2.92$.

        - **Two dice:** two variances make $\mathord{\frac{35}{6} \approx 5.83}$, whose square root is about 2.42.
        - **Twelve dice:** $12 \times \frac{35}{12} = 35$, so the SD of the total is $\sqrt{35} \approx 5.92$.
        :::

        :::warn
        Expected values always add. Variances add **only for independent** variables. A doubled die
        is one die counted twice, not two independent ones, and its spread is larger.
        :::
      `,
      figure: {
        type: 'dice-sum-lab', static: true, n: 12, die: false, band: 1, readouts: ['sd'],
        alt: 'A bar chart of the total of 12 fair dice: a bell-shaped pile centred on 42, with a shaded band of one standard deviation, about 5.9, either side.',
      },
    },
    {
      id: 'root-n',
      type: 'numeric',
      stretch: true,
      title: 'Back to bet B',
      gen: (rng) => {
        const n = rng.pick([16, 36, 64, 100, 144, 400]);
        const answer = Math.sqrt(n) / 2;
        return {
          text: r`
            A fair coin is flipped **${n} times**, and every head pays 1 coin. A single flip pays 0 or 1 coin:
            its variance is $\frac{1}{4}$. The flips are independent.

            **What is the standard deviation of the total payout?**
          `,
          answer,
          unit: 'coins',
          wrong: slips(answer, [
            [n / 4, 'That is the variance of the total. The standard deviation is its square root.'],
            [n / 2, `That adds up ${n} standard deviations of one half. For independent flips the variances add, not the SDs.`],
            [1 / 2, `That is the SD of a single flip. Add the ${n} variances, then take the square root.`],
          ]),
          hints: [
            `The flips are independent, so their variances add. What is the variance of the total?`,
            r`Variance of the total: $${n} \times \frac{1}{4} = ${n / 4}$. Now take the square root.`,
          ],
          explain: r`
            Variances add for independent flips: $${n} \times \frac{1}{4} = ${n / 4}$. The SD is
            $\sqrt{${n / 4}} = ${num(answer)}$ coins.

            That is why bet B at the start of the lesson was so safe. With 100 flips the SD is only 5
            coins, so a payout below 40 is two whole SDs under the expected 50. Bet A, with one big
            flip, has an SD of 50 coins.
          `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements are **true**?',
      options: [
        { text: 'The expected value of a sum is the sum of the expected values, even if the parts depend on each other', correct: true },
        { text: 'The standard deviation is measured in the same unit as the random variable', correct: true },
        { text: 'A random variable with a standard deviation of 0 always takes the same value', correct: true },
        { text: 'Two bets with the same expected value carry the same risk', why: 'A sure 10 coins and a 1-in-100 chance of 1,000 coins have the same expected value. Their standard deviations are 0 and about 99.5.' },
        { text: 'The variance of a sum is always the sum of the variances', why: 'Only for independent variables. A die added to itself has four times the variance of one die, not twice.' },
      ],
      explain: `
        Expected value tells you the centre, and it adds up no matter what. Standard deviation tells
        you the typical distance from the centre. Its square, the variance, adds up only when the
        parts are independent.
      `,
    },
  ],
  recap: [
    'A **random variable** is a number that depends on chance. Its distribution lists its values and their probabilities.',
    '**Variance** is the expected squared distance from the expected value. Its square root, the **standard deviation**, is the typical distance.',
    'Expected values always add: $E(X + Y) = E(X) + E(Y)$, independent or not.',
    'Variances add only for **independent** variables. Standard deviations do not simply add.',
  ],
  next: 'Next: add up enough small random effects and one shape appears every time. Find out why the bell curve is everywhere.',
};
