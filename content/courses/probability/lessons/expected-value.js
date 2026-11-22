// Probability & Chance · Lesson 7 · What Is It Worth?
import { r, num } from '../../../kit.js';
import { rawFrac, commas } from '../helpers.js';

// The opening game: one gold slice in six pays 12 coins, a spin costs 3.
const GOLD_WHEEL = [
  { label: 'Gold', p: 1, prize: 12, color: 'yellow' },
  { label: 'Blank', p: 5, prize: 0, color: 'gray' },
];
// The stall game: half the wheel pays nothing, a quarter pays 4, a quarter pays 12.
const STALL_WHEEL = [
  { label: 'Red', p: 2, prize: 0, color: 'red' },
  { label: 'Blue', p: 1, prize: 4, color: 'blue' },
  { label: 'Green', p: 1, prize: 12, color: 'green' },
];

const signed = (v) => (v > 0 ? `+${num(v)}` : num(v));
const coinWord = (v) => (Math.abs(v) === 1 ? 'coin' : 'coins');

export default {
  id: 'expected-value',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Would you play?',
      text: `
        A fairground wheel has six equal slices. One is gold: land on it and
        you win **12 coins**. The other five win nothing. A spin costs **3 coins**.

        You plan to play all afternoon. **What will happen to your pile of coins?**
      `,
      figure: {
        type: 'ev-game', static: true, slices: 6, price: 3, outcomes: GOLD_WHEEL,
        alt: 'A wheel with six equal slices. One slice is gold and marked 12. The other five are marked 0.',
      },
      shuffle: false,
      options: [
        { text: 'It grows: the prize is four times the price of a spin' },
        { text: 'It shrinks', correct: true },
        { text: 'It stays about the same' },
      ],
      explain: `
        It shrinks, by about one coin for every spin you buy. The prize is
        four times the price, but you only win one time in six.

        Play, and watch it happen.
      `,
    },
    {
      id: 'play',
      type: 'interact',
      graded: false,
      title: 'Spin and see',
      text: `
        Here is the game. Start with a few single spins to get a feel for it,
        then use the bigger buttons.

        **Play at least 500 games**, and keep an eye on your average result per game.
      `,
      widget: { type: 'ev-game', slices: 6, price: 3, outcomes: GOLD_WHEEL, buttons: [1, 10, 100], max: 10000 },
      check: (s) => s.plays >= 500 || `${commas(s.plays)} ${s.plays === 1 ? 'game' : 'games'} so far. Keep playing until you reach 500.`,
      solution: { plays: 500 },
      explain: `
        Single games jump between +9 and −3. But the **average** per game
        settles close to **−1**. After 500 games you are down about 500
        coins, give or take a hundred.

        It is the law of large numbers again, this time working on your money.
      `,
    },
    {
      id: 'idea',
      type: 'info',
      title: 'What a game is worth',
      text: r`
        Where does the −1 come from? In the long run one spin in six lands on
        gold, so the average prize per spin, the **expected prize**, is

        $$ \frac{1}{6} \times 12 + \frac{5}{6} \times 0 = 2 \text{ coins} $$

        You pay 3 coins for it. That leaves $2 - 3 = -1$ coin per spin.

        :::key
        The **expected value** of a game is its long-run average result per
        play. To find it, multiply each possible result by its probability
        and add everything up.
        :::
      `,
      figure: {
        type: 'ev-game', static: true, slices: 6, price: 3, outcomes: GOLD_WHEEL,
        alt: 'A wheel with six equal slices. One slice is gold and marked 12. The other five are marked 0.',
        caption: 'One slice in six pays 12 coins. Five in six pay nothing.',
      },
    },
    {
      id: 'table-ev',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        if (rng.bool()) {
          // a wheel described by fractions; each prize is a multiple of its denominator, so every product is whole
          const shares = rng.pick([
            [[1, 2], [1, 4], [1, 4]],
            [[1, 2], [1, 3], [1, 6]],
            [[1, 2], [3, 10], [1, 5]],
            [[3, 5], [3, 10], [1, 10]],
            [[2, 3], [1, 6], [1, 6]],
          ]);
          const names = ['Red', 'Blue', 'Gold'];
          const mult = [rng.pick([0, 0, 1]), rng.int(1, 2), rng.int(2, 4)];
          const prizes = shares.map(([, d], i) => mult[i] * d);
          const parts = shares.map(([n], i) => n * mult[i]);
          const answer = parts.reduce((t, v) => t + v, 0);
          const rows = shares.map(([n, d], i) => `| ${names[i]} | $${rawFrac(n, d)}$ | ${prizes[i]} coins |`).join('\n');
          const products = shares.map(([n, d], i) => `${rawFrac(n, d)} \\times ${prizes[i]}`).join(' + ');   // TeX for 1/2 × 0 + 1/4 × 4 + …
          return {
            text: `A wheel pays these prizes:\n\n| Lands on | Chance | Prize |\n|---|:---:|---:|\n${rows}\n\n**What is the expected prize per spin?**`,
            answer,
            unit: 'coins',
            wrong: [
              [(prizes[0] + prizes[1] + prizes[2]) / 3, 'That is the plain average of the three prizes. It treats them as equally likely, and they are not: weight each prize by its chance.'],
              [prizes[0] + prizes[1] + prizes[2], 'That adds up the prizes as if you won all of them every time. Multiply each prize by its chance first.'],
              [Math.max(...prizes), 'That is the top prize. You only win it some of the time.'],
            ],
            hints: [
              'Multiply each prize by its chance. Then add the three results.',
              `$${products}$`,
            ],
            explain: `$${products} = ${parts.join(' + ')} = ${answer}$ coins per spin, on average.`,
          };
        }
        // a lucky dip described by counts
        const total = 20;
        const counts = rng.pick([[10, 6, 4], [12, 6, 2], [10, 8, 2], [14, 4, 2], [8, 8, 4]]);
        const prizes = [0, rng.pick([5, 10]), rng.pick([20, 30, 50])];
        const sum = counts.reduce((t, c, i) => t + c * prizes[i], 0);
        const answer = sum / total;
        return {
          text: `
            A lucky dip holds **${total} envelopes**. ${counts[0]} are empty, ${counts[1]} contain
            ${prizes[1]} coins each, and ${counts[2]} contain ${prizes[2]} coins each. You draw one at random.

            **What is the expected prize?**
          `,
          answer,
          unit: 'coins',
          wrong: [
            [(prizes[1] + prizes[2]) / 2, 'That is the plain average of the two prizes. It ignores the empty envelopes, and the fact that the big prize is rarer.'],
            [(prizes[0] + prizes[1] + prizes[2]) / 3, 'That treats the three kinds of envelope as equally likely. There are more of some kinds than of others.'],
            [sum, `That is all the prize money in the dip. Share it out over the ${total} envelopes.`],
          ],
          hints: [
            `The chance of each kind of envelope is its count out of ${total}.`,
            `Shortcut: add up all the prize money in the dip, then divide by ${total}.`,
          ],
          explain: r`
            $\frac{${counts[0]}}{${total}} \times 0 + \frac{${counts[1]}}{${total}} \times ${prizes[1]} + \frac{${counts[2]}}{${total}} \times ${prizes[2]} = \frac{${sum}}{${total}} = ${num(answer)}$ coins.
            In other words: all the prize money, shared equally over all the envelopes.
          `,
        };
      },
    },
    {
      id: 'die-game',
      type: 'numeric',
      title: 'An average you can never get',
      text: `
        A simpler game: roll one die and win as many coins as the number it shows.

        **What is the expected value of one roll?**
      `,
      answer: 3.5,
      unit: 'coins',
      wrong: [
        [3, 'Close. Work it out exactly: each of the six results has probability one sixth.'],
        [4, 'Close. Work it out exactly: each of the six results has probability one sixth.'],
        [21, 'That is the six results added up. Each one only counts for one sixth.'],
        [6, 'That is the best result, not the average one.'],
      ],
      hints: [
        r`Each number has probability $\frac{1}{6}$: start with $\frac{1}{6} \times 1 + \frac{1}{6} \times 2 + \dots$`,
        'That is the same as (1 + 2 + 3 + 4 + 5 + 6) ÷ 6.',
      ],
      explain: r`
        $\dfrac{1 + 2 + 3 + 4 + 5 + 6}{6} = \dfrac{21}{6} = 3.5$ coins.

        You can **never** win 3.5 coins on a single roll. "Expected" is a
        technical word here: it does not mean "what to expect next time". It
        means the long-run average.
      `,
    },
    {
      id: 'fair',
      type: 'interact',
      title: 'Name your price',
      text: `
        Now you run the stall. Your wheel pays **12 coins** on green and
        **4 coins** on blue (a quarter of the wheel each), and nothing on red.

        **Set a price that makes the game fair**, so that in the long run
        neither you nor the players come out ahead. Then test it: play
        **at least 300 games** at that price.
      `,
      widget: {
        type: 'ev-game', slices: 4, outcomes: STALL_WHEEL, price: 6, priceEdit: { min: 0, max: 8, step: 0.5 },
        buttons: [1, 10, 100], max: 10000,
      },
      check: (s) => {
        if (!s.fair) {
          return s.price > s.payout
            ? 'At that price the players lose in the long run: the average prize per game is smaller than the price.'
            : 'At that price the players win in the long run, and your stall goes broke: the average prize per game is bigger than the price.';
        }
        if (s.plays < 300) return `That price is fair. Now test it: play at least 300 games (${commas(s.plays)} so far).`;
        return true;
      },
      solution: { price: 4, plays: 300 },
      hints: [
        'What is the expected prize per game? Multiply each prize by its chance, and add.',
        r`$\frac{1}{2} \times 0 + \frac{1}{4} \times 4 + \frac{1}{4} \times 12 = 4$. A fair price is equal to the expected prize.`,
      ],
      explain: r`
        The expected prize is $\frac{1}{2} \times 0 + \frac{1}{4} \times 4 + \frac{1}{4} \times 12 = 4$ coins
        per game. Charge exactly that and the expected value is $4 - 4 = 0$:
        the average hovers around the break-even line.
      `,
    },
    {
      id: 'teach-fair',
      type: 'info',
      title: 'Fair games, and losses with a minus sign',
      text: r`
        A game with an expected value of zero is called a **fair game**: the
        price equals the expected prize. Charge a little more and the stall
        wins in the long run. That one sentence is the business model of
        every casino.

        For the expected value of a whole game, take the price off the
        expected prize. Or list every result, with a loss as a **negative** number.

        :::example
        **A raffle:** 50 tickets at 4 coins each, one prize of 100 coins.

        - Expected prize: $\frac{1}{50} \times 100 = 2$ coins.
        - Minus the price: $2 - 4 = -2$ coins per ticket.

        The raffle pays back half of the money it takes in, so the average
        ticket loses half its price.

        **A bet:** heads you win 5 coins, tails you lose 3.

        - $\frac{1}{2} \times 5 + \frac{1}{2} \times (-3) = +1$ coin.
        :::
      `,
    },
    {
      id: 'net-ev',
      type: 'numeric',
      review: true,
      keyboard: 'full',   // the answer may be negative: do not let a digits-only keypad give that away
      gen: (rng) => {
        const kind = rng.pick(['raffle', 'die', 'coin']);
        if (kind === 'raffle') {
          const tickets = rng.pick([100, 200, 500]);
          const each = rng.pick([0.5, 1, 1.5, 2]);          // prize money per ticket sold
          const prize = tickets * each;
          const price = rng.pick([2, 3, 5].filter((c) => c > each));
          const answer = each - price;
          return {
            text: `
              A raffle sells **${tickets} tickets** at **${price} coins** each. One ticket,
              drawn at random, wins the only prize: **${commas(prize)} coins**.

              What is the expected value of buying one ticket? Type a loss as a negative number.
            `,
            answer,
            unit: 'coins',
            wrong: [
              [each, `That is the average prize per ticket. Now take away the ${price} coins the ticket costs.`],
              [prize - price, 'That is what you gain *if you win*. But you almost never do: weigh both results by their chances.'],
              [-price, 'That is the result when you lose. Now and then a ticket wins, and that pulls the average up a little.'],
              [-answer, 'Check the sign: a ticket costs more than it brings in on average, so the expected value is negative.'],
            ],
            hints: [
              r`The chance that your ticket wins is $\frac{1}{${tickets}}$. What is the expected prize?`,
              r`Expected prize: $\frac{1}{${tickets}} \times ${prize} = ${num(each)}$ ${coinWord(each)}. Now take away the price.`,
            ],
            explain: r`
              Expected prize: $\frac{1}{${tickets}} \times ${prize} = ${num(each)}$ ${coinWord(each)}. Minus the price:
              $${num(each)} - ${price} = ${num(answer)}$ ${coinWord(answer)} per ticket. On average every ticket loses money
              for its buyer, which is exactly how a raffle raises money.
            `,
          };
        }
        if (kind === 'die') {
          const prize = rng.pick([6, 12, 18, 24, 30]);
          const price = rng.pick([2, 3, 4]);
          const answer = prize / 6 - price;
          return {
            text: `
              A game costs **${price} coins**. You roll one die: a six wins **${prize} coins**,
              anything else wins nothing.

              What is the expected value of one game? Type a loss as a negative number.
            `,
            answer,
            unit: 'coins',
            wrong: [
              [prize / 6, `That is the expected prize. Now take away the ${price} coins it costs to play.`],
              [prize - price, 'That is what you gain *if you roll a six*. Five times out of six you do not.'],
              [-answer, 'Check the sign: compare the expected prize with the price.'],
            ],
            hints: [
              r`A six comes up with probability $\frac{1}{6}$. What is the expected prize?`,
              r`Expected prize: $\frac{1}{6} \times ${prize} = ${prize / 6}$ ${coinWord(prize / 6)}. Now take away the price.`,
            ],
            explain: r`
              Expected prize: $\frac{1}{6} \times ${prize} = ${prize / 6}$ ${coinWord(prize / 6)}. Minus the price:
              $${prize / 6} - ${price} = ${num(answer)}$ ${coinWord(answer)} per game. ${answer > 0 ? 'A rare thing: a game that favours the player.' : answer < 0 ? 'In the long run the player loses.' : 'A fair game.'}
            `,
          };
        }
        const win = rng.pick([4, 6, 8, 10]);
        const lose = rng.intExcept(3, 9, [win]);
        const answer = (win - lose) / 2;
        return {
          text: `
            A friend offers you a bet on a fair coin. Heads: your friend pays you
            **${win} coins**. Tails: you pay your friend **${lose} coins**.

            What is the expected value of the bet for you? Type a loss as a negative number.
          `,
          answer,
          unit: 'coins',
          wrong: [
            [win - lose, 'That adds the two results as if both happened. Each happens only half the time.'],
            [-answer, 'Check the sign: which is bigger, what you can win or what you can lose?'],
            [(win + lose) / 2, `Losing ${lose} coins counts as −${lose}, not +${lose}.`],
          ],
          hints: [
            `Your two results are +${win} and −${lose}, each with probability one half.`,
            r`$\frac{1}{2} \times ${win} + \frac{1}{2} \times (-${lose})$`,
          ],
          explain: r`
            $\frac{1}{2} \times ${win} + \frac{1}{2} \times (-${lose}) = ${signed(answer)}$ ${coinWord(answer)}.
            ${answer > 0 ? 'On average the bet favours you.' : 'On average the bet favours your friend.'}
          `,
        };
      },
    },
    {
      id: 'lottery',
      type: 'choice',
      text: `
        Many lotteries pay out only about **half** of the money from ticket
        sales as prizes. The rest goes to the organiser.

        What does that tell you about the expected value of a ticket that costs 2 coins?
      `,
      options: [
        { text: 'It is about −1 coin: on average, half the price is lost', correct: true },
        { text: 'It is about +1 coin', why: 'The buyers as a group get back less than they pay in, so the average ticket cannot be a gain.' },
        { text: 'It is zero: a lottery is a fair game', why: 'A fair game would have to pay out *all* of the ticket money as prizes.' },
        { text: 'Nothing, without the odds of every prize', why: 'You do not need them. If half of all the ticket money comes back as prizes, the average ticket gets half its price back.' },
      ],
      explain: `
        If half of the money comes back, the average ticket returns 1 coin
        for the 2 it cost: an expected value of about **−1 coin**. Somebody
        wins the jackpot, but the *average* buyer loses half the stake at
        every draw.

        As a way to make money, a lottery ticket is a dependable loss.
        Whether a daydream is worth 1 coin is a different question.
      `,
    },
    {
      id: 'teach-risk',
      type: 'info',
      title: 'What the average leaves out',
      text: r`
        Expected value puts very different offers on one scale. A 20% chance
        of winning 200 coins is worth $0.2 \times 200 = 40$ coins on
        average. So is 40 coins for certain: $1 \times 40 = 40$.

        Yet they are not the same offer. Four times out of five, the first
        one pays nothing at all.

        :::key
        Expected value measures the **average**, not the **risk**. It is the
        right guide when you can repeat a bet many times and shrug off any
        single loss. When one bad result would ruin you, the average is not
        the whole story.
        :::
      `,
    },
    {
      id: 'insurance',
      type: 'choice',
      review: true,
      text: `
        Insuring a home against fire costs more per year than the expected
        loss from fire: otherwise the insurer would go broke. So for the
        buyer, the expected value of the insurance is **negative**.

        Why do sensible people buy it anyway?
      `,
      options: [
        { text: 'A small, certain cost is worth paying to avoid a rare loss that would ruin you', correct: true },
        { text: 'The expected value is really positive for the buyer', why: 'It cannot be positive for both sides. The insurer sets the price above the expected payout.' },
        { text: 'A fire becomes more likely the longer you go without one', why: "That is the gambler's fallacy. Next year's risk does not depend on your luck so far." },
        { text: 'Insurers lose money on most of their customers', why: 'It is the other way round: most customers pay in more than they ever get back.' },
      ],
      explain: `
        Expected value is the right guide when you can repeat a bet many
        times and shrug off any single loss. The insurer, with thousands of
        customers, is in exactly that position. You are not: you have one home.

        Paying a small, certain amount to remove a small chance of ruin can
        be a good trade, even at a negative expected value. For losses you
        could easily absorb, the same reasoning says: skip the insurance.
      `,
    },
    {
      id: 'order-ev',
      type: 'order',
      text: 'Four offers. **Put them in order of expected value, smallest first.**',
      items: [
        'A 1% chance of winning 3,000 coins',
        'A 10% chance of winning 400 coins',
        '50 coins for certain',
        'A 50% chance of winning 120 coins',
      ],
      labels: ['Smallest expected value', 'Largest expected value'],
      hints: [
        'For each offer, work out chance × prize.',
        '1% of 3,000 is 30, and 10% of 400 is 40.',
      ],
      explain: r`
        Chance × prize: $0.01 \times 3000 = 30$, then $0.1 \times 400 = 40$,
        then $1 \times 50 = 50$, then $0.5 \times 120 = 60$.

        Expected value puts very different-looking offers on a single scale.
        Whether you would *prefer* a sure 50 to a risky 60 is another matter:
        expected value measures the average, not the risk.
      `,
    },
    {
      id: 'dice-game',
      type: 'numeric',
      stretch: true,
      keyboard: 'full',
      gen: (rng) => {
        const double = rng.pick([6, 12, 18]);
        const seven = rng.pick([3, 6, 9, 12]);
        const price = rng.pick([2, 3, 4]);
        const answer = double / 6 + seven / 6 - price;
        return {
          text: `
            A dice game costs **${price} coins** a go. You roll two dice. A **double**
            wins ${double} coins, a **total of 7** wins ${seven} coins, and anything else wins nothing.

            What is the expected value of one go? Type a loss as a negative number.
          `,
          answer,
          unit: 'coins',
          wrong: [
            [double / 6 + seven / 6, `That is the expected prize. Now take away the ${price} coins a go costs.`],
            [(double + seven) / 36 - price, 'A double is not 1 outcome in 36: there are six doubles. The same goes for a total of 7.'],
            [-answer, 'Check the sign: compare the expected prize with the price.'],
          ],
          hints: [
            'How likely is a double? How likely is a total of 7? Think of the board of 36 outcomes.',
            r`Each has probability $\frac{6}{36} = \frac{1}{6}$, and a roll cannot be both.`,
            r`Expected prize: $\frac{1}{6} \times ${double} + \frac{1}{6} \times ${seven}$. Then take away the price.`,
          ],
          explain: r`
            Six of the 36 outcomes are doubles and six add up to 7, so each has
            probability $\frac{1}{6}$. Expected prize:
            $\frac{1}{6} \times ${double} + \frac{1}{6} \times ${seven} = ${num(double / 6 + seven / 6)}$ ${coinWord(double / 6 + seven / 6)}.
            Minus the price: $${num(double / 6 + seven / 6)} - ${price} = ${signed(answer)}$ ${coinWord(answer)} per go.
          `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about expected value are **true**?',
      options: [
        { text: 'It is the average result per play over a very long run', correct: true },
        { text: 'A fair game has an expected value of zero', correct: true },
        { text: 'It is the result you are most likely to get on your next play', why: 'For one roll of a die the expected value is 3.5, which cannot come up at all. In the gold-slice game it was −1, while every actual result was +9 or −3.' },
        { text: 'A game with a negative expected value can never be won', why: 'You can win any single game, and even be ahead after a lucky run. The expected value describes the long-run average, which is what catches up with you if you keep playing.' },
      ],
      explain: `
        Expected value is a long-run average: every result times its
        probability, added up. It tells you what repeating a bet many times
        will do to you, not what the next play will bring.
      `,
    },
  ],
  recap: [
    '**Expected value** = each result × its probability, added up. It is the long-run average per play.',
    'A **fair game** has expected value zero: the price equals the expected prize.',
    'Lotteries and casino games have a negative expected value for the player. That is how they earn money.',
    'A negative expected value can still be worth it when it protects you from a loss you could not bear: insurance.',
  ],
  next: 'Next: the most argued-about puzzle in probability. Three doors, one car, and a host who knows too much.',
};
