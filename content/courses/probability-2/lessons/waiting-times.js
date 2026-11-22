// Probability II: Random Variables · Lesson 5 · How Long Until…?
import { r, num, plural } from '../../../kit.js';
import { fracText, fracChain, rawFrac, slips, eqDec, pct, sharedBirthday, probFeedback, PROB_HOW, PROB_TOL } from '../helpers.js';

const ROLL_WORDS = { tries: 'rolls', one: 'roll', run: 'Roll until a six', axis: 'rolls needed for the first six' };

/** One small dot for every group size from 1 to 60: the exact chance of a shared birthday. */
const BIRTHDAY_DOTS = Array.from({ length: 60 }, (_, i) => ({ x: i + 1, y: sharedBirthday(i + 1), r: 3, color: 'blue' }));

/** n ÷ m written as it is typed: "2.5", "4". */
const quotient = (n, m) => num(n / m, 2);

export default {
  id: 'waiting-times',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Waiting for a six',
      text: `
        You roll a fair die again and again until the first six appears.

        **On which roll is the first six most likely to come?**
      `,
      shuffle: false,
      options: [
        { text: 'On the 1st roll', correct: true },
        { text: 'On the 3rd roll' },
        { text: 'On the 6th roll' },
        { text: 'Every roll is equally likely to bring the first six' },
      ],
      explain: `
        On the very first roll. For the first six to arrive on roll 3, two things have to go "wrong"
        beforehand: no six, and again no six. Every extra roll of waiting makes a result less likely.

        And yet the *average* wait is 6 rolls. Run the experiment and see how both can be true.
      `,
    },
    {
      id: 'roll-sim',
      type: 'interact',
      graded: false,
      title: 'Roll until it comes',
      text: `
        Each run rolls a die until a six shows, and records how many rolls that took.

        **Record at least 200 waits**, and watch the shape of the chart and the average.
      `,
      widget: {
        type: 'wait-sim', kind: 'first', p: 1 / 6, dice: true, cap: 30, buttons: [1, 10, 100], words: ROLL_WORDS,
        alt: 'A chart that counts how many rolls each run needed before the first six.',
      },
      check: (s) => s.trials >= 200 || `${s.trials} ${s.trials === 1 ? 'wait' : 'waits'} recorded so far. Keep going until you reach 200.`,
      solution: { trials: 200 },
      explain: `
        Short waits are the most common. In the long run the tallest bar is the one at 1, and each bar
        is five sixths as tall as the bar before it (except the last one, which collects every wait of
        30 rolls or more). A couple of hundred waits give a bumpier picture than that, but the shape is there.

        The chart also has a long tail: now and then a six takes 20 rolls or more. Those long waits
        pull the average up to somewhere near 6.
      `,
    },
    {
      id: 'chain',
      type: 'fill',
      title: 'One wait, step by step',
      text: r`
        Every roll misses the six with probability $\frac{5}{6}$, whatever happened before. So a chain of
        misses is a product.

        **Complete the two results.**
      `,
      template: r`
        No six in the first 3 rolls: $\frac{5}{6} \times \frac{5}{6} \times \frac{5}{6} =$ [[125]]/216.

        The first six comes exactly on roll 3 (miss, miss, six): $\frac{5}{6} \times \frac{5}{6} \times \frac{1}{6} =$ [[25]]/216.
      `,
      hints: ['Multiply the tops: 5 × 5 × 5 for three misses.', 'For miss, miss, six the tops are 5 × 5 × 1.'],
      explain: r`
        $5 \times 5 \times 5 = 125$ and $5 \times 5 \times 1 = 25$.

        In general, the chance of still waiting after $k$ rolls is $\left(\frac{5}{6}\right)^k$. After 10
        rolls that is still about 16%.
      `,
    },
    {
      id: 'geometric',
      type: 'info',
      title: 'The geometric distribution',
      text: r`
        Repeat an experiment that succeeds with probability $p$ each time, independently, until the first
        success. Every try is a fresh start: chance has no memory, as the first course put it. The number
        of tries you need follows the **geometric distribution**.

        :::key
        Chance of still waiting after $k$ tries: $(1-p)^k$

        Expected number of tries until the first success: $\dfrac{1}{p}$
        :::

        Here is why the average wait is $\frac{1}{p}$. In 6000 rolls of a die, about 1000 are sixes. Those
        sixes cut the 6000 rolls into about 1000 waits, so the average wait is $\mathord{6000 \div 1000 = 6}$ rolls.

        :::example
        A ring holds 7 keys that look alike. You try one at random each time, without keeping track,
        so every try fits with probability $\frac{1}{7}$.

        - Expected wait: $1 \div \frac{1}{7} = 7$ tries, counting the one that fits.
        - Still locked out after 2 tries: $\frac{6}{7} \times \frac{6}{7} = \frac{36}{49}$, about 73%.
        :::
      `,
    },
    {
      id: 'wait',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        if (rng.bool(0.55)) {
          const scene = rng.pick([
            { m: rng.pick([4, 8, 10, 12, 20, 25]), text: (m) => `A claw machine grabs a prize on **1 try in ${m}**, and every try is independent of the others.`, what: 'tries', p: (m) => rawFrac(1, m) },
            { m: rng.pick([10, 20, 50]), text: (m) => `Each pack of trading cards contains a rare card with probability **${num(1 / m)}**, independently of the other packs.`, what: 'packs', p: (m) => num(1 / m) },
            { m: rng.pick([1.25, 2.5, 4]), text: (m) => `A basketball player scores each free throw with probability **${num(1 / m)}**, independently of her other throws.`, what: 'throws', p: (m) => num(1 / m) },
          ]);
          const m = scene.m;
          const first = scene.what === 'tries' ? 'the first prize' : scene.what === 'packs' ? 'the first rare card' : 'her first score';
          return {
            text: `${scene.text(m)}\n\n**On average, how many ${scene.what} does it take to get ${first}?** Count the successful one too.`,
            answer: m,
            unit: scene.what,
            wrong: slips(m, [
              [1 / m, 'That is the probability of success on one try. The expected wait is 1 divided by it.'],
              [m / 2, 'The average wait is not half-way. A few very long waits pull the average up to 1 divided by the probability.'],
              [m - 1, 'Count the successful try as well.'],
            ]),
            hints: [r`The expected wait is $\dfrac{1}{p}$, where $p$ is the probability of success on one try.`],
            explain: r`$\dfrac{1}{p} = 1 \div ${scene.p(m)} = ${num(m)}$ ${scene.what}, on average.`,
          };
        }
        const m = rng.pick([2, 3, 4, 5]);
        const k = rng.int(2, 4);
        const top = Math.pow(m - 1, k);
        const den = Math.pow(m, k);
        const answer = top / den;
        const miss = rawFrac(m - 1, m);
        return {
          text: `
            A spinner stops on gold with probability $${rawFrac(1, m)}$ on every spin, whatever happened before.

            **What is the probability that there is no gold at all in the first ${k} spins?** ${PROB_HOW}
          `,
          answer: `${top}/${den}`,
          display: fracText(top, den),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [1 - answer, `That is the chance of at least one gold in ${k} spins: the opposite of what is asked.`],
            [1 / den, `That is the chance of gold on every one of the ${k} spins. You want a miss on every one.`],
            [1 - k / m, k < m ? `The chances of a miss multiply; they do not subtract. Each spin misses with probability $${miss}$.` : ''],
          ].filter(([, msg]) => msg), PROB_TOL),
          feedback: probFeedback(answer),
          hints: [
            `Each spin misses gold with probability $${miss}$.`,
            `Multiply ${k} of those together.`,
          ],
          explain: r`Each spin misses with probability $${miss}$, and the spins are independent: $\left(${miss}\right)^{${k}} = ${fracChain(top, den)} ${eqDec(answer)}$.`,
        };
      },
    },
    {
      id: 'memoryless',
      type: 'choice',
      review: true,
      title: 'Is a six overdue?',
      text: `
        A fair die has just been rolled **10 times without a single six**.

        **From now on, how many more rolls should you expect to need before the first six?**
      `,
      options: [
        { text: '6, exactly as at the start', correct: true },
        { text: 'About 1 or 2: a six is overdue', why: "That is the gambler's fallacy. The die cannot remember its last 10 rolls, so nothing is due." },
        { text: 'Fewer than 6, because part of the wait is already used up', why: 'There is no fixed wait to use up. Each roll is a fresh start with the same one-in-six chance.' },
        { text: 'More than 6: this die seems to be unlucky', why: 'The die is fair, so ten misses in a row are just chance. They happen about 16% of the time.' },
      ],
      explain: `
        Six more, on average. The die has no memory, so the wait starts afresh with every roll: a
        waiting time like this is called **memoryless**.

        You met the same idea as the gambler's fallacy in [The Long Run](#/learn/probability/the-long-run).
        There it was about the next flip. Here it is about the whole wait still to come.
      `,
    },
    {
      id: 'collector-hook',
      type: 'info',
      title: 'Collect the set',
      text: r`
        Every box of cereal contains one of **6 different toys**. Each toy is equally likely, and the
        boxes are independent of each other. How many boxes must you open, on average, to own all six?

        Split the job into waits, one for each new toy.

        :::example
        - **1st toy:** any box will do. Wait: 1 box.
        - **2nd toy:** 5 of the 6 toys would be new, so a box succeeds with probability $\frac{5}{6}$.
          Expected wait: $1 \div \frac{5}{6} = 1.2$ boxes.
        - **3rd toy:** only 4 of the 6 would be new. Expected wait: $1 \div \frac{4}{6} = 1.5$ boxes.
        :::

        Each new toy is harder to find than the one before, and the last one keeps you waiting.
        Open some boxes and see what the whole collection costs.
      `,
    },
    {
      id: 'collector-sim',
      type: 'interact',
      graded: false,
      title: 'Open the boxes',
      text: `
        Each run opens boxes until all six toys have turned up. In the strip above the chart, a
        highlighted number is a toy you did not have yet.

        **Collect at least 200 full sets.**
      `,
      widget: {
        type: 'wait-sim', kind: 'collector', n: 6, cap: 40, buttons: [1, 10, 100],
        alt: 'A chart that counts how many boxes each run had to open before all six toys had turned up.',
      },
      check: (s) => s.trials >= 200 || `${plural(s.trials, 'set')} collected so far. Keep going until you reach 200.`,
      solution: { trials: 200 },
      explain: `
        Nobody can finish in fewer than 6 boxes. Most collectors need between 9 and 20, and about 1 in
        40 needs more than 30. The average comes out close to 14.7.

        Run a single set a few times and watch the strip: the new toys usually crowd together at the
        start, and then come long stretches of toys you already have.
      `,
    },
    {
      id: 'collector-sum',
      type: 'fill',
      title: 'Six waits in a row',
      text: `
        Collecting the set is six waits in a row: for the 1st new toy, then the 2nd, and so on. Each is a
        wait for a first success, so its expected length is 1 divided by the chance of success. And
        expected values add.

        **Fill in the missing waits and the total.**
      `,
      template: r`
        | Toys in hand | 0 | 1 | 2 | 3 | 4 | 5 |
        |---|---|---|---|---|---|---|
        | Chance that a box holds a new toy | $\frac{6}{6}$ | $\frac{5}{6}$ | $\frac{4}{6}$ | $\frac{3}{6}$ | $\frac{2}{6}$ | $\frac{1}{6}$ |
        | Expected wait, in boxes | 1 | 1.2 | 1.5 | [[2]] | 3 | [[6]] |

        Expected total, adding up all six waits: [[14.7]] boxes.
      `,
      hints: ['The expected wait is 1 divided by the probability of success.', 'For the total, add the six waits: 1 + 1.2 + 1.5 + …'],
      explain: r`
        The six waits add up to 14.7 boxes, and the last toy alone accounts for 6 of them.

        For a set of $n$ toys the same sum gives $n \times \left(1 + \frac{1}{2} + \frac{1}{3} + \cdots + \frac{1}{n}\right)$.
        A set of 50 takes about 225 boxes on average.
      `,
    },
    {
      id: 'next-new',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([10, 12, 20, 24, 30, 50, 100]);
        const options = [];
        for (let m = 1; m < n; m++) if (Number.isInteger((n * 100) / m) && n / m <= 30) options.push(m);
        const missing = rng.pick(options);
        const have = n - missing;
        const answer = n / missing;
        return {
          text: `
            A sticker album has room for **${n} different stickers**. Every pack holds one sticker, equally
            likely to be any of the ${n}, independently of the other packs. You already have **${have} different stickers**.

            **On average, how many packs must you open to get a sticker you do not have yet?**
          `,
          answer,
          unit: 'packs',
          wrong: slips(answer, [
            [missing / n, 'That is the probability that a pack holds a new sticker. The expected wait is 1 divided by it.'],
            [n, `That would be the wait for one particular sticker. Any of the ${missing} missing ones will do.`],
            [n / have, `Use the stickers you are missing, not the ones you have: ${missing} of the ${n} would be new.`],
          ]),
          hints: [
            `How many of the ${n} stickers would be new to you? That gives the probability that a pack is a success.`,
            r`The probability of a new sticker is $${rawFrac(missing, n)}$. The expected wait is 1 divided by that.`,
          ],
          explain: r`You are missing ${missing} of the ${n} stickers, so a pack holds a new one with probability $${rawFrac(missing, n)}$. Expected wait: $${rawFrac(n, missing)} = ${quotient(n, missing)}$ packs.`,
        };
      },
    },
    {
      id: 'birthday-hook',
      type: 'slider',
      mode: 'predict',
      title: 'The birthday surprise',
      text: `
        People walk into a room one at a time. Assume each of them is equally likely to be born on any of
        the 365 days of the year, independently of the others.

        **How many people must be in the room before a shared birthday is more likely than not?**
      `,
      min: 2, max: 200, step: 1, answer: 23, tolerance: 3, unit: 'people', start: 2,
      explain: `
        Just 23. Most people guess far higher, because they picture someone sharing *their own*
        birthday. But any two people in the room can match, and 23 people make 253 different pairs.
      `,
    },
    {
      id: 'birthday-find',
      type: 'interact',
      title: 'Turn the question inside out',
      text: r`
        "At least one shared birthday" is hard to count directly. Its opposite is easy: **all different**.
        The second person must avoid 1 day, the third 2 days, and so on. So the chance of "all different" is

        $$ \frac{365}{365} \times \frac{364}{365} \times \frac{363}{365} \times \cdots $$

        The chart shows 1 minus that product. **Find the smallest group in which a shared birthday is more likely than not.**
      `,
      widget: {
        type: 'plot', x: [0, 60], y: [0, 1], xStep: 10, yStep: 0.25, height: 320, xLabel: 'people', yLabel: 'chance of a shared birthday',
        params: { k: { min: 2, max: 60, step: 1, value: 5, label: 'people in the room', color: 'orange' } },
        hlines: [{ y: 0.5, dashed: true }],
        vlines: [{ x: 'k', color: 'orange', dashed: true }],
        points: [...BIRTHDAY_DOTS, { x: 'k', y: (s) => sharedBirthday(s.k), r: 8, color: 'orange' }],
        readouts: [{ label: 'chance of a shared birthday', value: (s) => 100 * sharedBirthday(s.k), digits: 1, unit: '%' }],
        alt: 'A chart of the chance that at least two people in a room share a birthday, for 1 to 60 people. The chance rises quickly and passes one half between 20 and 25 people.',
      },
      check: (s) => {
        if (s.k === 23) return true;
        const p = pct(sharedBirthday(s.k));
        return s.k < 23
          ? `With ${s.k} people the chance of a shared birthday is ${p}%: not yet more than half.`
          : `With ${s.k} people the chance is ${p}%. That is more than half, but a smaller group already gets there.`;
      },
      solution: { k: 23 },
      hints: ['Move the slider until the orange dot first rises above the dashed line at one half.'],
      explain: `
        With 22 people the chance is 47.6%, and with 23 it is 50.7%. With 50 people it is 97%.

        This is the complement rule from the first course, doing what it does best: "at least one"
        becomes 1 minus "none at all".
      `,
    },
    {
      id: 'example-match',
      type: 'info',
      title: 'All different, then subtract',
      text: r`
        The birthday trick works whenever a question asks for **at least two the same**.

        1. Find the chance that all are different, one pick at a time: each new pick must avoid the ones already taken.
        2. Subtract it from 1. That is the complement rule from the first course.

        :::example
        Three friends each pick one of **4 ice-cream flavours** at random, independently.

        - All different: $\dfrac{4}{4} \times \dfrac{3}{4} \times \dfrac{2}{4} = \dfrac{24}{64} = \dfrac{3}{8}$
        - At least two the same: $1 - \dfrac{3}{8} = \dfrac{5}{8}$
        :::

        With only 4 flavours and 3 friends, a match is already more likely than not.
      `,
    },
    {
      id: 'same-pick',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        const scene = rng.pick([
          { m: rng.pick([5, 8, 10]), text: (k, m) => `**${k} friends** each write down a whole number from 1 to ${m}, in secret. Assume every number is equally likely and the friends choose independently.`, same: 'write down the same number', pick: 'number' },
          { m: 6, text: (k) => `You roll **${k} fair dice**.`, same: 'show the same number', pick: 'number' },
          { m: 7, text: (k) => `**${k} people** are chosen at random. Assume each is equally likely to have been born on any of the 7 days of the week, independently of the others.`, same: 'were born on the same day of the week', pick: 'day' },
          { m: 12, text: (k) => `**${k} people** are chosen at random. Assume each is equally likely to have been born in any of the 12 months, independently of the others.`, same: 'were born in the same month', pick: 'month' },
        ]);
        const m = scene.m;
        const k = rng.pick([2, 3, 4]);
        let top = 1;
        for (let i = 0; i < k; i++) top *= m - i;
        const den = Math.pow(m, k);
        const answer = 1 - top / den;
        const factors = Array.from({ length: k }, (_, i) => rawFrac(m - i, m)).join(' \\times ');
        return {
          text: `${scene.text(k, m)}\n\n**What is the probability that at least two of them ${scene.same}?** ${PROB_HOW}`,
          answer: `${den - top}/${den}`,
          display: fracText(den - top, den),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [top / den, `That is the chance that all ${k} are different. The question asks for the opposite: subtract it from 1.`],
            [1 / m, k > 2 ? `That is the chance that two particular ones match. With ${k} there are several pairs that could.` : ''],
            [k / m, `Adding up chances does not work here. Find the chance that all ${k} are different, and subtract it from 1.`],
          ].filter(([, msg]) => msg), PROB_TOL),
          feedback: probFeedback(answer),
          hints: [
            `The opposite of "at least two the same" is "all ${k} different". Find that chance first.`,
            r`All different: $${factors}$. Each new ${scene.pick} must avoid the ones already taken.`,
          ],
          explain: r`
            All different: $${factors} = ${fracChain(top, den)}$. So the chance of at least one match is
            $1 - ${rawFrac(top, den)} = ${fracChain(den - top, den)} ${eqDec(answer)}$.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: "One scratch card in 10 is a winner. I have bought 9 without a win, so the next
        one is bound to win."

        **What would you tell your friend?** Assume each card wins with probability 0.1, independently of the others.
      `,
      model: r`
        The next card wins with probability 0.1, exactly like every card before it. The cards have no
        memory, so nine losses do not make a win "due": from here on, the expected wait is still 10 cards.

        "One in 10" describes the long-run average, not a promise about any ten cards. In fact, the
        chance of buying 10 cards and winning nothing at all is $0.9^{10}$, about 35%.
      `,
    },
  ],
  recap: [
    'Waiting for a first success with chance $p$ per try: the chance of still waiting after $k$ tries is $(1-p)^k$.',
    'The expected wait is $\\dfrac{1}{p}$. The wait is **memoryless**: past misses do not shorten it.',
    'Collecting a full set is a sum of waits. The last few items take the longest.',
    'For "at least one match", find the chance that all are different and subtract it from 1. With birthdays, 23 people are enough for an even chance.',
  ],
  next: 'Next: chance with a memory of exactly one step. Follow a whole crowd through a chain of states and watch it settle.',
};
