// Probability II: Random Variables · Lesson 2 · Heads k Times out of n
import { r, plural } from '../../../kit.js';
import { choose, fracText, fracChain, rawFrac, slips, eqDec, probFeedback, PROB_HOW, PROB_TOL } from '../helpers.js';

const ROUTES_INTO_2 = ['RRLL', 'RLRL', 'RLLR', 'LRRL', 'LRLR', 'LLRR'];
/** Every route through four rows of pegs: LLLL, LLLR, … RRRR. */
const ALL_ROUTES_4 = Array.from({ length: 16 }, (_, i) => [8, 4, 2, 1].map((bit) => (i & bit ? 'R' : 'L')).join(''));

/** TeX for a fraction raised to a power: "\left(\frac{1}{3}\right)^{2}", or just the fraction for a power of 1. */
const power = (n, d, e) => (e === 1 ? rawFrac(n, d) : `\\left(${rawFrac(n, d)}\\right)^{${e}}`);

export default {
  id: 'binomial',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Exactly half',
      text: `
        Flip a fair coin **10 times**. Five heads and five tails is the most "typical" result there is.

        **How likely is it that you get exactly 5 heads?** Drag the slider to your best guess.
      `,
      min: 0, max: 100, step: 1, answer: 25, tolerance: 4, unit: '%', start: 0,
      explain: `
        About 25% (24.6%, to be exact). Five heads is the most likely single result, and yet three
        times out of four you get something else.

        To find where 24.6% comes from, you need to count routes.
      `,
    },
    {
      id: 'teach-board',
      type: 'info',
      title: 'A board that flips coins',
      text: `
        Swap the coin for a ball. It falls through rows of pegs, and at every peg it bounces left or
        right, like a coin landing tails or heads.

        A ball's **route** is its list of bounces. The ball in the picture went right, left, right,
        right: route **RLRR**.

        The **bin** it lands in counts its bounces to the right. RLRR has three R's, so it ends in
        bin 3. So does LRRR: different routes can share a bin.
      `,
      figure: {
        type: 'galton-board', mode: 'steer', rows: 4, static: true, routes: ['RLRR'], show: 'RLRR',
        alt: 'A board with four rows of pegs above five bins, numbered 0 to 4. A line traces one ball: right, left, right, right, into bin 3.',
      },
    },
    {
      id: 'steer',
      type: 'interact',
      title: 'Routes through the pegs',
      attempts: 6,
      text: `
        Here is the same board: four rows of pegs, and the bin counts the bounces **to the right**.

        This time you decide each bounce. **Steer balls down until you have found every different route into bin 2.**
      `,
      widget: {
        type: 'galton-board', mode: 'steer', rows: 4, target: 2,
        alt: 'A board with four rows of pegs above five bins, numbered 0 to 4. Buttons send the ball left or right at each peg.',
      },
      check: (s) => {
        if (s.found >= s.needed) return true;
        if (s.found === 0) return 'Use the Left and Right buttons. A route into bin 2 has exactly two bounces to the right.';
        return `You have ${s.found} of the routes into bin 2. There are more: which two of the four bounces go right?`;
      },
      solution: { routes: ROUTES_INTO_2 },
      hints: [
        'A ball lands in bin 2 when exactly two of its four bounces go right.',
        'Be systematic. If the first bounce goes right, the other right can be 2nd, 3rd or 4th. Then start with a left.',
      ],
      explain: `
        Six routes: RRLL, RLRL, RLLR, LRRL, LRLR, LLRR. Each has two R's and two L's, and no other
        arrangement of two R's among four bounces exists.
      `,
    },
    {
      id: 'teach-routes',
      type: 'info',
      title: 'A route is a choice',
      text: r`
        A route into bin 2 is a choice of **which 2 of the 4 bounces go right**. Order does not matter
        in that choice, so "$n$ choose $k$" from the last lesson counts the routes:
        $$ \binom{4}{2} = \frac{4 \times 3}{2 \times 1} = 6 $$

        :::key
        On a board with $n$ rows, $\binom{n}{k}$ different routes lead into bin $k$.
        :::

        The picture shows all 16 routes of this board, sorted into their bins: 1, 4, 6, 4 and 1.
        That is row 4 of Pascal's triangle.

        :::example
        Six rows, bin 2: $\binom{6}{2} = \dfrac{6 \times 5}{2 \times 1} = 15$ routes.
        :::
      `,
      figure: {
        type: 'galton-board', mode: 'steer', rows: 4, static: true, target: 2, routes: ALL_ROUTES_4,
        alt: 'The board with four rows of pegs. Every one of its 16 routes has been found: 1 ends in bin 0, 4 in bin 1, 6 in bin 2, 4 in bin 3 and 1 in bin 4.',
      },
    },
    {
      id: 'bin-chance',
      type: 'numeric',
      text: `
        With fair pegs, left and right are equally likely at every bounce, so each of the
        2 × 2 × 2 × 2 = 16 routes is equally likely.

        **What is the probability that a ball lands in bin 2?** ${PROB_HOW}
      `,
      figure: { type: 'pascal-triangle', rows: 5, static: true, line: false, mark: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], alt: "Pascal's triangle down to row 4, which reads 1, 4, 6, 4, 1." },
      answer: '6/16',
      display: '3/8',
      tolerance: PROB_TOL,
      wrong: [
        [1 / 5, 'There are five bins, but they are not equally likely: more routes lead to the middle. Count routes, not bins.'],
        [1 / 16, 'That is the chance of one particular route. Six different routes end in bin 2.'],
        [1 / 2, 'Two bounces out of four go right, but that is not the probability. Count the routes into bin 2 out of all 16.'],
      ],
      feedback: probFeedback(6 / 16),
      hints: ['Six of the 16 equally likely routes end in bin 2.'],
      explain: r`$\frac{6}{16} = \frac{3}{8} = 0.375$. Routes into the bin, out of all routes: the counting rule from the first probability course, with $\binom{4}{2}$ doing the counting.`,
    },
    {
      id: 'drop',
      type: 'interact',
      graded: false,
      title: 'Let chance steer',
      text: `
        This board starts with 10 rows, so every ball is like 10 coin flips, and its bin is its number of heads.

        **Drop at least 300 balls** and watch the pile. Then try it with more rows, or fewer.
      `,
      widget: {
        type: 'galton-board', rows: 10, rowsRange: [2, 12], p: 0.5, buttons: [1, 10, 100], max: 2000,
        alt: 'A board with ten rows of pegs above eleven bins. Buttons drop 1, 10 or 100 balls, and a slider changes the number of rows.',
      },
      check: (s) => s.balls >= 300 || `${s.balls} ${s.balls === 1 ? 'ball' : 'balls'} so far. Keep going until you reach 300.`,
      solution: { balls: 300 },
      explain: `
        The balls pile up in the middle and thin out towards the edges. No ball "aims" for the middle:
        there are simply more routes that end there.

        More rows spread the pile over more bins, and yet it fills a smaller share of the board.

        :::fun
        Francis Galton built a board like this in the 1870s to show how order appears out of pure chance.
        :::
      `,
    },
    {
      id: 'example-flips',
      type: 'info',
      title: 'Ten flips, exactly five heads',
      text: r`
        Every row of pegs is one coin flip: right for heads, left for tails. So the board with 10 rows
        settles the opening question. The dashed outline is the exact shape of its pile.

        :::example
        **A fair coin is flipped 10 times. How likely are exactly 5 heads?**

        1. All routes: $2^{10} = 1024$, each equally likely.
        2. Routes with 5 heads: choose which 5 of the 10 flips are heads. $\binom{10}{5} = 252$.
        3. Probability: $\dfrac{252}{1024} \approx 24.6\%$.
        :::

        Only one route of the 1024 ends in bin 0: ten tails in a row.
      `,
      figure: {
        type: 'galton-board', rows: 10, p: 0.5, exact: true, static: true,
        alt: 'A board with ten rows of pegs above eleven bins. A dashed outline shows the exact shape of the pile: tallest at bin 5, falling away evenly on both sides.',
      },
    },
    {
      id: 'fair',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([4, 5, 6]);
        const k = rng.int(1, n - 1);
        const total = Math.pow(2, n);
        const ways = choose(n, k);
        const answer = ways / total;
        const story = rng.pick([
          `A fair coin is flipped **${n} times**.\n\n**What is the probability of exactly ${plural(k, 'head')}?**`,
          `A quiz has **${n} true-or-false questions**. You answer each one by flipping a fair coin.\n\n**What is the probability that you get exactly ${k} right?**`,
          `A fair coin is flipped **${n} times**.\n\n**What is the probability of exactly ${plural(k, 'tail')}?**`,
        ]);
        const row = Array.from({ length: n + 1 }, (_, j) => choose(n, j)).join(', ');
        return {
          text: `${story} ${PROB_HOW}`,
          answer: `${ways}/${total}`,
          display: fracText(ways, total),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [1 / total, `That is the chance of one particular sequence. Count how many of the ${total} sequences fit.`],
            [k / n, `That is the share of the ${n} flips, not a probability. Count sequences: how many of the ${total} fit?`],
            [1 / 2, 'Each single flip is fifty-fifty, but an exact count is not. Count the sequences that fit, out of all of them.'],
          ], PROB_TOL),
          feedback: (v) => (v > 1 && Math.abs(v - ways) < 1e-9 ? `That is the number of sequences that fit. Divide by all ${total} sequences.` : probFeedback(answer)(v)),
          hints: [
            r`All $2^{${n}} = ${total}$ sequences are equally likely. How many of them fit?`,
            `Row ${n} of Pascal's triangle is ${row}.`,
          ],
          explain: r`$\binom{${n}}{${k}} = ${ways}$ of the $2^{${n}} = ${total}$ equally likely sequences fit, so the probability is $${fracChain(ways, total)} ${eqDec(answer)}$.`,
        };
      },
    },
    {
      id: 'formula',
      type: 'info',
      title: 'Routes times the chance of one route',
      text: r`
        When right and left are not equally likely, the routes are not equally likely either. So
        count the routes **and** work out the chance of one of them.

        :::example
        A player scores each free throw with probability $\frac{4}{5}$. How likely are exactly 2 scores in 3 throws?

        1. Orders: $\binom{3}{2} = 3$. The one miss comes first, second or third.
        2. One order: $\frac{4}{5} \times \frac{4}{5} \times \frac{1}{5} = \frac{16}{125}$. Multiply, because the throws are independent.
        3. Together: $3 \times \frac{16}{125} = \frac{48}{125} = 0.384$.
        :::

        :::key
        In $n$ independent **trials**, each a **success** with the same probability $p$:
        $$ P(k \text{ successes}) = \binom{n}{k}\, p^k (1-p)^{n-k} $$
        This is the **binomial distribution**. Heads, sixes, right-bounces: the same formula.
        :::
      `,
    },
    {
      id: 'one-six',
      type: 'fill',
      title: 'Unequal chances, by hand',
      text: r`
        Roll a fair die **3 times**. What is the probability of **exactly one six**?

        Here a "success" has probability $\frac{1}{6}$ and a "failure" $\frac{5}{6}$, and the rolls are independent.
      `,
      template: r`
        The six can come on any one of [[3]] rolls.

        Each of those orders has probability $\frac{1}{6} \times \frac{5}{6} \times \frac{5}{6} = \frac{25}{216}$.

        So the probability of exactly one six is [[75]]/216.
      `,
      hints: ['Six first, six second or six third: how many orders is that?', 'Add the probabilities of the orders. They are all the same.'],
      explain: r`
        $\binom{3}{1} \times \frac{1}{6} \times \left(\frac{5}{6}\right)^2 = 3 \times \frac{25}{216} = \frac{75}{216} \approx 0.347$.
        Routes times the chance of one route.
      `,
    },
    {
      id: 'biased',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [a, b] = rng.pick([[1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [1, 6]]);
        const n = rng.pick([3, 4]);
        const k = rng.int(1, n - 1);
        const ways = choose(n, k);
        const one = Math.pow(a, k) * Math.pow(b - a, n - k);       // numerator of one order's probability
        const den = Math.pow(b, n);
        const answer = (ways * one) / den;
        const p = rawFrac(a, b);
        const stories = [
          { text: `A spinner stops on red with probability $${p}$ on every spin, whatever happened on earlier spins. It is spun **${n} times**.\n\n**What is the probability that it stops on red exactly ${k === 1 ? 'once' : `${k} times`}?**`, one: 'red', many: 'reds' },
          { text: `An archer hits the bullseye with probability $${p}$ on each shot, independently of her other shots. She shoots **${n} arrows**.\n\n**What is the probability of exactly ${plural(k, 'bullseye')}?**`, one: 'bullseye', many: 'bullseyes' },
        ];
        if (a === 1 && b === 6) stories.push({ text: `A fair die is rolled **${n} times**.\n\n**What is the probability of exactly ${k === 1 ? 'one six' : `${k} sixes`}?**`, one: 'six', many: 'sixes' });
        const story = rng.pick(stories);
        const hits = k === 1 ? `one ${story.one}` : `${k} ${story.many}`;
        const routeTex = `${power(a, b, k)} \\times ${power(b - a, b, n - k)}`;
        return {
          text: `${story.text} ${PROB_HOW}`,
          answer: `${ways * one}/${den}`,
          display: fracText(ways * one, den),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [one / den, `That is the probability of one particular order. The ${k === 1 ? `single ${story.one}` : hits} can fall on different tries: count the orders.`],
            [Math.pow(a / b, k), `That only asks for ${hits}. The other ${plural(n - k, 'try', 'tries')} must fail, each with probability $${rawFrac(b - a, b)}$.`],
            [ways * Math.pow(a / b, k), `The other ${plural(n - k, 'try', 'tries')} must fail, each with probability $${rawFrac(b - a, b)}$. Multiply that in as well.`],
          ], PROB_TOL),
          feedback: probFeedback(answer),
          hints: [
            r`How many orders are there for ${hits} among ${n} tries? That is $\binom{${n}}{${k}}$.`,
            r`One such order has probability $${routeTex}$. There are ${ways} orders.`,
          ],
          explain: r`
            There are $\binom{${n}}{${k}} = ${ways}$ orders, and each has probability $${routeTex} = ${rawFrac(one, den)}$.
            Together: $${ways} \times ${rawFrac(one, den)} = ${fracChain(ways * one, den)} ${eqDec(answer)}$.
          `,
        };
      },
    },
    {
      id: 'tilt',
      type: 'interact',
      title: 'Tilt the board',
      text: `
        This board has 10 rows, and a slider that makes "right" more or less likely at every peg. The
        dashed outline is the exact binomial shape for the current setting.

        **Set the chance of "right" so that bin 7 is the most likely bin. Then drop at least 200 balls to test it.**
      `,
      widget: {
        type: 'galton-board', rows: 10, p: 0.5, pRange: [0.1, 0.9], exact: true, buttons: [10, 100], max: 2000,
        alt: 'A board with ten rows of pegs, a slider for the chance of bouncing right, and a dashed outline of the expected pile.',
      },
      check: (s) => {
        if (s.peak !== 7) return `With this setting the most likely bin is bin ${s.peak}. ${s.peak < 7 ? 'Make "right" more likely.' : 'That is too far: make "right" a little less likely.'}`;
        if (s.balls < 200) return `Bin 7 is now the most likely one. Drop at least 200 balls to test it (${s.balls} so far).`;
        return true;
      },
      solution: { p: 0.7, balls: 200 },
      hints: ['To land in bin 7, a ball must go right at 7 of its 10 bounces. What chance of "right" makes that typical?'],
      explain: `
        A chance of 0.7 does it (0.65 works too). When 7 bounces in 10 go right on average, bin 7 is
        where the pile is tallest.
      `,
    },
    {
      id: 'teach-centre',
      type: 'info',
      title: 'Where the pile sits',
      text: r`
        The tilted pile was centred near
        $$ n \times p = 10 \times 0.7 = 7 $$
        That is the **expected count** from the first course: the number of tries times the
        probability of success.

        :::example
        A striker scores each penalty with probability 0.7 and takes **50** of them: expect about
        $50 \times 0.7 = 35$ goals.

        The board in the picture has 10 rows and $p = 0.3$. Its pile sits around bin $\mathord{10 \times 0.3 = 3}$.
        :::

        Notice the shape as well. At $p = 0.5$ the pile is symmetric. Tilt the board and it leans,
        with a longer tail on the side that has more room.
      `,
      figure: {
        type: 'galton-board', rows: 10, p: 0.3, exact: true, static: true,
        alt: 'A board with ten rows of pegs where each bounce goes right 30% of the time. The dashed outline of the pile is tallest at bin 3, with a longer tail towards the higher bins.',
      },
    },
    {
      id: 'centres',
      type: 'match',
      text: r`The pile of a binomial distribution is centred near $n \times p$. **Match each experiment with its expected count.**`,
      pairs: [
        ['Heads in 20 flips of a fair coin', '10'],
        ['Sixes in 30 rolls of a fair die', '5'],
        ['Baskets in 40 free throws, each scored with probability 0.8', '32'],
        ['Wins among 200 scratch cards, each a winner with probability 0.01', '2'],
      ],
      explain: r`$20 \times \frac{1}{2} = 10$, then $30 \times \frac{1}{6} = 5$, then $40 \times 0.8 = 32$, and $200 \times 0.01 = 2$.`,
    },
    {
      id: 'example-at-least',
      type: 'info',
      title: 'Several bins at once',
      text: r`
        "At least" covers several bins. Two tools from the first course do the work: **add** the
        cases, or take the opposite away from 1.

        :::example
        **A fair coin is flipped 7 times.** There are $2^7 = 128$ sequences, and row 7 of Pascal's
        triangle says how many of them have 0, 1, 2, … heads: 1, 7, 21, 35, 35, 21, 7, 1.

        - **At least 6 heads** means 6 or 7 heads. Add the two cases.
          - $\frac{7}{128} + \frac{1}{128} = \frac{8}{128} = \frac{1}{16}$
        - **At least 2 heads** leaves out only two cases: no heads, or exactly one. Subtract those from 1.
          - $1 - \left(\frac{1}{128} + \frac{7}{128}\right) = \frac{120}{128} = \frac{15}{16}$
        :::

        A short list of cases: add them. A long list: count the few it leaves out.
      `,
      figure: {
        type: 'pascal-triangle', rows: 8, static: true, line: false, mark: [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7]],
        alt: "Pascal's triangle down to row 7, which reads 1, 7, 21, 35, 35, 21, 7, 1.",
      },
    },
    {
      id: 'at-least',
      type: 'numeric',
      review: true,
      title: 'At least…',
      gen: (rng) => {
        const n = rng.pick([4, 5, 6]);
        const kind = rng.pick(['top', 'one', 'two']);
        const total = Math.pow(2, n);
        const row = Array.from({ length: n + 1 }, (_, j) => choose(n, j));
        const k = kind === 'top' ? n - 1 : kind === 'one' ? 1 : 2;
        const good = row.slice(k).reduce((t, v) => t + v, 0);
        const answer = good / total;
        const below = row.slice(0, k).reduce((t, v) => t + v, 0);
        const adding = kind === 'top';
        return {
          text: `A fair coin is flipped **${n} times**.\n\n**What is the probability of at least ${plural(k, 'head')}?** ${PROB_HOW}`,
          answer: `${good}/${total}`,
          display: fracText(good, total),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [row[k] / total, `That is the chance of *exactly* ${plural(k, 'head')}. "At least ${k}" also includes ${k + 1}${k + 1 < n ? ' and more' : ''}.`],
            [below / total, `That is the chance of the opposite: fewer than ${plural(k, 'head')}. Subtract it from 1.`],
          ], PROB_TOL),
          feedback: probFeedback(answer),
          hints: adding
            ? [`"At least ${k}" means ${k} or ${n} heads. Find both chances and add them.`, `Row ${n} of Pascal's triangle is ${row.join(', ')}: that many of the ${total} sequences have 0, 1, 2… heads.`]
            : [`The opposite is easier: fewer than ${plural(k, 'head')}, which means ${k === 1 ? 'no heads at all' : 'no heads or exactly one'}.`, `Row ${n} of Pascal's triangle is ${row.join(', ')}: that many of the ${total} sequences have 0, 1, 2… heads.`],
          explain: adding
            ? r`Add the two cases: $${rawFrac(row[n - 1], total)} + ${rawFrac(1, total)} = ${fracChain(good, total)} ${eqDec(answer)}$. For a short list of cases, adding is quickest.`
            : r`Use the complement: $1 - ${k === 1 ? rawFrac(1, total) : `\\left(${rawFrac(1, total)} + ${rawFrac(n, total)}\\right)`} = ${fracChain(good, total)} ${eqDec(answer)}$. When "at least" covers most of the cases, count the few it leaves out.`,
        };
      },
    },
    {
      id: 'fits',
      type: 'bucket',
      review: true,
      title: 'When the model does not fit',
      text: `
        The binomial formula needs four things: a **fixed number** of trials, **two outcomes** per trial,
        the **same probability** every time, and trials that are **independent**.

        **Does the binomial model fit the number described?**
      `,
      buckets: ['Binomial fits', 'It does not fit'],
      items: [
        { text: 'Heads in 20 flips of a fair coin', bucket: 0, why: 'Twenty independent flips, each heads with probability one half.' },
        { text: 'Sixes in 12 rolls of a fair die', bucket: 0, why: 'Twelve independent rolls, each a six with probability one sixth.' },
        { text: 'Aces in a 5-card hand dealt from one deck', bucket: 1, why: 'The cards are not put back, so every ace dealt makes the next ace less likely. The trials are not independent.' },
        { text: 'Red marbles in 8 draws from a bag, putting the marble back each time', bucket: 0, why: 'Putting the marble back keeps the chance of red the same for every draw, and the draws independent.' },
        { text: 'Rolls needed to get the first six', bucket: 1, why: 'There is no fixed number of trials here: the rolling stops when the six comes. That is a waiting time, a different distribution.' },
        { text: 'Rainy days next week', bucket: 1, why: 'Weather on one day affects the next, and the chance of rain is not the same every day.' },
        { text: 'Baskets in 10 shots by a player who tires, so that each shot is less likely to go in', bucket: 1, why: 'The probability changes from shot to shot.' },
      ],
      explain: `
        Dealing without replacement, weather and tiring players all break the model: the chance changes,
        or one trial influences the next. Before using the formula, check the four conditions.
      `,
    },
    {
      id: 'quiz',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const n = rng.pick([3, 4]);
        const m = rng.pick([2, 3, 4, 5]);
        const den = Math.pow(m, n);
        const nearly = n * (m - 1);            // numerator for exactly n − 1 right
        const good = nearly + 1;
        const answer = good / den;
        return {
          text: `
            A quiz has **${n} questions**. Each offers **${m} answers**, exactly one of them right. You pick
            every answer at random, each pick independent of the others.

            You pass with **at least ${n - 1} right**. **What is the probability that you pass?** ${PROB_HOW}
          `,
          answer: `${good}/${den}`,
          display: fracText(good, den),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [nearly / den, `That is the chance of exactly ${n - 1} right. Getting all ${n} right is a pass too.`],
            [1 / den, `That is the chance of getting all ${n} right. ${n - 1} right is enough to pass.`],
            [(m - 1) / den, `That is the chance of one particular pattern with ${n - 1} right. The wrong answer can be any one of the ${n} questions.`],
          ], PROB_TOL),
          feedback: probFeedback(answer),
          hints: [
            `"At least ${n - 1}" means exactly ${n - 1} right, or all ${n} right. Find the two chances and add.`,
            r`A pick is right with probability $${rawFrac(1, m)}$ and wrong with probability $${rawFrac(m - 1, m)}$. The one wrong answer can be on any of the ${n} questions.`,
          ],
          explain: r`
            Exactly ${n - 1} right: $${n} \times ${power(1, m, n - 1)} \times ${rawFrac(m - 1, m)} = ${rawFrac(nearly, den)}$.
            All ${n} right: $${power(1, m, n)} = ${rawFrac(1, den)}$.
            Together: $${fracChain(good, den)} ${eqDec(answer)}$.
          `,
        };
      },
    },
  ],
  recap: [
    'Count **routes**: $k$ successes in $n$ trials can come in $\\binom{n}{k}$ different orders.',
    '**Binomial distribution:** $P(k) = \\binom{n}{k}\\, p^k (1-p)^{n-k}$, for $n$ independent trials with the same chance $p$.',
    'The pile is centred near $n \\times p$. For "at least" questions, add the cases or use the complement.',
    'No fixed number of trials, a changing chance, or trials that influence each other: not binomial.',
  ],
  next: 'Next: the binomial tells you where the pile sits. Now for a number that says how wide it is.',
};
