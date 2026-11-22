// Algorithms · Lesson 5 · How Work Grows
import { r, plural } from '../../../kit.js';
import { group, halvingChain } from '../helpers.js';

/** The four growth laws are introduced with the count each gives for 8 items (the merge-sort row of lesson 4). */
const GROW_N = 8;
const GROW_CHAIN = halvingChain(GROW_N).join(String.raw` \to `); // 8 \to 4 \to 2 \to 1
const GROW_LOG = halvingChain(GROW_N).length - 1; // 3 halvings

/** The worked "how much longer?" example. Neither 3,000 items nor 4 seconds can turn up in "scale-up". */
const SCALE_DEMO = { base: 3000, k: 3, t: 4 };

export default {
  id: 'big-o',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'Same job, same computer',
      text: `
        Say a computer carries out about **a billion simple steps every second**.

        Sorting a million numbers with bubble sort takes about 500 billion steps: more than **8 minutes**. Merge sort needs about 20 million steps for the same job.

        **How long does merge sort take?**
      `,
      options: [
        { text: 'About 4 minutes', why: 'That would be half the steps. Merge sort needs about 25,000 times fewer.' },
        { text: 'About 20 seconds', why: 'Twenty seconds would be 20 *billion* steps. Merge sort needs 20 million.' },
        { text: 'About 1 second', why: 'One second is a billion steps. Twenty million is only a fiftieth of that.' },
        { text: 'About a fiftieth of a second', correct: true },
      ],
      explain: `
        Twenty million steps at a billion a second take 0.02 seconds. Same computer, same numbers, same result: one method is finished before you can blink, the other needs 8 minutes.

        What separates them is not speed. It is how the amount of work **grows** when the input grows. That is the subject of this lesson.
      `,
    },
    {
      id: 'teach-growths',
      type: 'info',
      title: 'Four ways for work to grow',
      text: r`
        Call the number of items $n$. So far the work has depended on $n$ in four ways:

        | Steps | Read it as | For $n = ${GROW_N}$ |
        |:-:|:--|:-:|
        | $\log_2 n$ | halvings of $n$ until 1 is left | ${GROW_LOG} |
        | $n$ | one step per item | ${GROW_N} |
        | $n \log_2 n$ | $n$ times $\log_2 n$ | ${GROW_N * GROW_LOG} |
        | $n^2$ | $n$ times $n$ | ${GROW_N * GROW_N} |

        You have met all four. **Binary search** needs about $\log_2 n$ checks: $${GROW_CHAIN}$ is ${GROW_LOG} halvings. **Finding the largest number** takes $n$ looks. **Merge sort** moves all $n$ cards on each of $\log_2 n$ levels. **Bubble sort** compares nearly every pair, which is about half of $n^2$.
      `,
      figure: {
        type: 'bars', yMax: 70, yStep: 10, yLabel: `steps for ${GROW_N} items`,
        data: [
          { label: 'log₂ n', value: GROW_LOG, color: 'green' },
          { label: 'n', value: GROW_N, color: 'blue' },
          { label: 'n log₂ n', value: GROW_N * GROW_LOG, color: 'violet' },
          { label: 'n²', value: GROW_N * GROW_N, color: 'orange' },
        ],
        alt: `A bar chart of the four counts for ${GROW_N} items: log n is ${GROW_LOG}, n is ${GROW_N}, n log n is ${GROW_N * GROW_LOG} and n squared is ${GROW_N * GROW_N}.`,
      },
    },
    {
      id: 'race',
      type: 'interact',
      attempts: 6,
      title: 'A race between four recipes',
      text: r`
        Four kinds of algorithm, four curves. Each shows how many steps are needed for $n$ items. (The green one, $\log_2 n$, hardly leaves the floor.) **Slide $n$** and watch the numbers.

        Find the **smallest $n$** for which the $n^2$ algorithm needs more than 1,000 steps (the dashed line).
      `,
      widget: {
        type: 'plot', x: [0, 40], y: [0, 1200], xStep: 10, yStep: 200, yLabel: 'steps', pad: { l: 54 },
        params: { n: { min: 1, max: 40, step: 1, value: 4, label: 'items $n$', color: 'orange' } },
        fns: [
          { expr: 'x^2', color: 'orange' },
          { expr: 'x*log2(x)', color: 'violet' },
          { expr: 'x', color: 'blue' },
          { expr: 'log2(x)', color: 'green' },
        ],
        hlines: [{ y: 1000, dashed: true, color: 'gray' }],
        vlines: [{ x: 'n', dashed: true }],
        points: [
          { x: 'n', on: 0, color: 'orange' },
          { x: 'n', on: 1, color: 'violet' },
          { x: 'n', on: 2, color: 'blue' },
          { x: 'n', on: 3, color: 'green' },
        ],
        labels: [
          { x: 25.5, y: 830, text: 'n²', color: 'orange', anchor: 'end' },
          { x: 30.5, y: 240, text: 'n log n', color: 'violet', anchor: 'end' },
          { x: 39.5, y: 100, text: 'n', color: 'blue', anchor: 'end' },
        ],
        readouts: [
          { label: '$n^2$', expr: 'n^2', digits: 0, color: 'orange' },
          { label: r`$n \log_2 n$`, expr: 'n*log2(n)', digits: 0, color: 'violet' },
          { label: '$n$', expr: 'n', digits: 0, color: 'blue' },
          { label: r`$\log_2 n$`, expr: 'log2(n)', digits: 1, color: 'green' },
        ],
        alt: 'Four curves over n from 0 to 40: n squared shoots up steeply, n log n rises gently, and n and log n stay close to the bottom.',
      },
      check: (s) => {
        if (s.n === 32) return true;
        if (s.n < 32) return `At $n = ${s.n}$ the $n^2$ algorithm needs ${s.n * s.n} steps: still not more than 1,000.`;
        return `It passes 1,000 before $n = ${s.n}$. Slide back to the *first* $n$ where $n^2$ is over 1,000.`;
      },
      solution: { n: 32 },
      hints: [
        r`Watch the orange readout, $n^2$, while you slide. Where does it first go past 1,000?`,
        r`$31^2 = 961$ and $32^2 = 1024$.`,
      ],
      explain: r`
        At $n = 32$ the four bills are: $n^2 = 1024$ steps, $n \log_2 n = 160$, $n = 32$ and $\log_2 n = 5$.

        The same input, and wildly different amounts of work. As $n$ grows, the gaps only get wider.
      `,
    },
    {
      id: 'table',
      type: 'info',
      title: 'The same race in numbers',
      text: r`
        Here is the race again for bigger inputs, with one more runner: $2^n$, which is $n$ twos multiplied together. It doubles with every extra item.

        | $n$ | 10 | 100 | 1,000 |
        |-----|---:|----:|------:|
        | $\log_2 n$ | $\approx 3$ | $\approx 7$ | $\approx 10$ |
        | $n$ | 10 | 100 | 1,000 |
        | $n \log_2 n$ | $\approx 33$ | $\approx 660$ | $\approx 10{,}000$ |
        | $n^2$ | 100 | 10,000 | 1 million |
        | $2^n$ | 1,024 | $\approx 10^{30}$ | $\approx 10^{301}$ |

        ($\approx$ means "about", and $10^{30}$ is a 1 followed by 30 zeros.) Read down the last column: for the same 1,000 items, the bill runs from about 10 steps to a number with 302 digits.
      `,
    },
    {
      id: 'ten-times',
      type: 'choice',
      shuffle: false,
      text: r`
        Suppose the input grows from 100 items to 1,000: **ten times** as many.

        What happens to the work of an algorithm that needs $n^2$ steps?
      `,
      options: [
        { text: 'It stays about the same', why: r`That is closer to what happens with $\log_2 n$, which only goes from about 7 to about 10.` },
        { text: 'About 10 times more', why: r`That is what happens to an algorithm that needs $n$ steps: 100 becomes 1,000. Squaring makes it worse.` },
        { text: '100 times more', correct: true },
        { text: '1,000 times more', why: r`Not quite that bad: $100^2 = 10{,}000$ and $1000^2 = 1{,}000{,}000$. Divide one by the other.` },
      ],
      explain: r`
        From $100^2 = 10{,}000$ steps to $1000^2 = 1{,}000{,}000$: **100 times** more. Ten times the input means $10^2$ times the work.

        Compare $\log_2 n$: it went from about 7 to about 10. Ten times the input cost three extra steps.
      `,
    },
    {
      id: 'notation',
      type: 'info',
      title: 'Big O: a name for the shape',
      text: r`
        Computer scientists sort algorithms by **how their work grows**, and write the label with a capital O:

        | Label | Read it as |
        |-------|------------|
        | $O(1)$ | the same work, however big the input |
        | $O(\log n)$ | grows with the number of halvings |
        | $O(n)$ | grows in proportion to $n$ |
        | $O(n \log n)$ | a little faster than in proportion |
        | $O(n^2)$ | grows with the square of $n$ |
        | $O(2^n)$ | doubles with every extra item |

        Big O keeps the shape and drops the details. Bubble sort makes $n(n-1)/2$ comparisons, which is about half of $n^2$. Its label is simply $O(n^2)$: whatever the constant in front, doubling $n$ makes the work about four times bigger.
      `,
    },
    {
      id: 'match-algorithms',
      type: 'match',
      review: true,
      text: r`Match each job with the way its work grows as the input size $n$ grows.`,
      pairs: [
        ['Binary search in a sorted list', r`$O(\log n)$`],
        ['Reading every item once', r`$O(n)$`],
        ['Merge sort', r`$O(n \log n)$`],
        ['Bubble sort', r`$O(n^2)$`],
        ['Looking at the first item only', r`$O(1)$`],
      ],
      explain: r`
        Binary search halves the list at every step: $O(\log n)$. Reading every item once grows in proportion: $O(n)$.
        Merge sort does about $n$ work on each of about $\log_2 n$ levels: $O(n \log n)$. Bubble sort compares about every pair: $O(n^2)$.

        And looking at one item takes the same time whether the list has ten entries or ten million: $O(1)$.
      `,
    },
    {
      id: 'teach-scale',
      type: 'info',
      title: 'Bigger input: how much longer?',
      text: r`
        The label tells you what happens to the running time when the input grows. Ask two things: *how many times bigger is the input?* And *what does the label do with that factor?*

        :::example
        An algorithm takes **${SCALE_DEMO.t} seconds** on ${group(SCALE_DEMO.base)} items. How long on ${group(SCALE_DEMO.base * SCALE_DEMO.k)} items? The input is ${SCALE_DEMO.k} times as big.

        - If it is $O(n)$: ${SCALE_DEMO.k} times the work. $${SCALE_DEMO.t} \times ${SCALE_DEMO.k} = ${SCALE_DEMO.t * SCALE_DEMO.k}$ seconds.
        - If it is $O(n^2)$: $${SCALE_DEMO.k} \times ${SCALE_DEMO.k} = ${SCALE_DEMO.k ** 2}$ times the work. $${SCALE_DEMO.t} \times ${SCALE_DEMO.k ** 2} = ${SCALE_DEMO.t * SCALE_DEMO.k ** 2}$ seconds.
        :::

        For $O(\log n)$ the factor hardly matters: every doubling of the input adds just one step.
      `,
    },
    {
      id: 'scale-up',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const square = rng.bool();
        const k = rng.pick([2, 3, 4, 5, 10]);
        const t = rng.pick([1, 2, 3, 5]);
        const base = rng.pick([1000, 2000, 5000, 10000]);
        const unit = rng.pick(['second', 'minute']);
        const answer = square ? t * k * k : t * k;
        return {
          text: square
            ? r`
              The work of an algorithm grows with the **square** of the input size: it is $O(n^2)$. On ${group(base)} items it takes **${plural(t, unit)}**.

              About how long does it take on **${group(base * k)}** items?
            `
            : r`
              The work of an algorithm grows **in proportion** to the input size: it is $O(n)$. On ${group(base)} items it takes **${plural(t, unit)}**.

              About how long does it take on **${group(base * k)}** items?
            `,
          answer,
          unit: `${unit}s`,
          wrong: square
            ? [
              [t * k, r`That would be right for $O(n)$. Here the work grows with the *square*: ${k} times the input means $${k} \times ${k} = ${k * k}$ times the work.`],
              [t * 2 * k, r`Squaring is not doubling: ${k} times the input means $${k} \times ${k} = ${k * k}$ times the work.`],
              [t + k * k, 'Multiply the time, do not add to it.'],
            ]
            : [
              [t * k * k, r`That would be right for $O(n^2)$. Here the work grows *in proportion*: ${k} times the input, ${k} times the work.`],
              [t + k, 'Multiply the time, do not add to it.'],
            ],
          hints: [
            `The input is ${k} times as big as before.`,
            square ? r`For $O(n^2)$, ${k} times the input means $${k}^2 = ${k * k}$ times the work.` : r`For $O(n)$, ${k} times the input means ${k} times the work.`,
          ],
          explain: square
            ? r`The input is ${k} times bigger, so the work is about $${k}^2 = ${k * k}$ times bigger: $${t} \times ${k * k} = ${answer}$ ${unit}s.`
            : r`The input is ${k} times bigger, so the work is about ${k} times bigger: $${t} \times ${k} = ${answer}$ ${unit}s.`,
        };
      },
    },
    {
      id: 'billion',
      type: 'numeric',
      title: 'A billion entries',
      text: `
        A sorted list holds **a billion** entries. Checking them one by one could take a billion steps.

        How many steps does binary search need, at most? (A thousand entries need ${halvingChain(1000).length} steps, and a million need ${halvingChain(1e6).length}.)
      `,
      answer: 30,
      unit: 'steps',
      wrong: [
        [20, 'Twenty halvings are enough for a million. A billion is a thousand times bigger than that.'],
        [500000000, 'That is how many entries are left after the first step. Keep halving.'],
        [1000, 'Far fewer: every single step throws away half of what is left.'],
        [9, 'A billion has nine zeros, but halving shrinks it more slowly than dividing by ten: it takes about 30 halvings.'],
      ],
      hints: [
        'From a thousand entries to a million, the list gets a thousand times longer. How many steps did that add?',
        'A billion is a thousand millions: ten more halvings.',
      ],
      explain: r`
        $2^{30}$ is about 1.07 billion, so 30 halvings are enough to get from a billion entries down to one.

        **Thirty steps instead of a billion.** That is what $O(\log n)$ against $O(n)$ means once the input is large.
      `,
    },
    {
      id: 'doubling',
      type: 'fill',
      text: 'The input **doubles**. What happens to the number of steps?',
      template: r`
        An algorithm that needs $n$ steps now needs [[the same number of|*twice as many|four times as many]] steps.

        One that needs $n^2$ steps needs [[twice as many|*four times as many|eight times as many]].

        One that needs $\log_2 n$ steps needs just [[*one more step|twice as many steps|ten more steps]].
      `,
      hints: [r`Try it with numbers: compare $n = 8$ with $n = 16$.`],
      explain: r`
        $2n$ is twice $n$. And $(2n)^2 = 4n^2$ is four times $n^2$.

        But $\log_2(2n) = \log_2 n + 1$: doubling the input adds a single halving, however big the input already is.
      `,
    },
    {
      id: 'crossover',
      type: 'interact',
      attempts: 6,
      title: 'Big O is about big inputs',
      text: r`
        Algorithm A needs $100n$ steps. Algorithm B needs $n^2$ steps. Big O ranks A as the better one: $O(n)$ grows more slowly than $O(n^2)$. But look at small inputs.

        **Slide $n$ to the point where the two need exactly the same number of steps.**
      `,
      widget: {
        type: 'plot', x: [0, 160], y: [0, 24000], xStep: 40, yStep: 4000, xLabel: 'n', yLabel: 'steps', pad: { l: 64 },
        params: { n: { min: 10, max: 160, step: 10, value: 20, label: 'items $n$', color: 'gray' } },
        fns: [
          { expr: '100x', color: 'blue' },
          { expr: 'x^2', color: 'orange' },
        ],
        vlines: [{ x: 'n', dashed: true }],
        points: [
          { x: 'n', on: 0, color: 'blue' },
          { x: 'n', on: 1, color: 'orange' },
        ],
        labels: [
          { x: 118, y: 9300, text: 'A: 100n', color: 'blue' },
          { x: 96, y: 19500, text: 'B: n²', color: 'orange', anchor: 'end' },
        ],
        readouts: [
          { label: 'A: $100n$', expr: '100n', digits: 0, color: 'blue' },
          { label: 'B: $n^2$', expr: 'n^2', digits: 0, color: 'orange' },
        ],
        alt: 'A straight line for 100 n and a curve for n squared. The curve starts below the line and crosses above it.',
      },
      check: (s) => {
        if (s.n === 100) return true;
        return s.n < 100
          ? `At $n = ${s.n}$, B is still ahead: ${group(s.n * s.n)} steps against ${group(100 * s.n)}. Slide further.`
          : `At $n = ${s.n}$, A is already ahead: ${group(100 * s.n)} steps against ${group(s.n * s.n)}. Slide back.`;
      },
      solution: { n: 100 },
      hints: [
        'Watch the two readouts. Where do they show the same number?',
        r`$100n = n^2$ exactly when $n = 100$.`,
      ],
      explain: r`
        At $n = 100$ both need 10,000 steps. Below that, the "worse" algorithm B is actually faster: for 10 items it needs 100 steps against A's 1,000. Above it A wins, and its lead grows without end.

        Big O tells you who wins **in the long run**. For small inputs, the constants it ignores can matter more.
      `,
    },
    {
      id: 'exponential',
      type: 'choice',
      shuffle: false,
      title: 'The curve that breaks computers',
      text: r`
        A safe has $n$ switches, each either up or down. Trying every combination takes $2^n$ steps: every extra switch doubles the number of combinations.

        With **30 switches** that is about a billion combinations: one second of work for our billion-steps-a-second computer.

        **How long for 60 switches?**
      `,
      hints: [
        'From 30 switches to 60 is 30 extra switches, and each one doubles the work.',
        'Thirty doublings multiply by about a billion: that is how 30 switches came to about a billion combinations. So the job takes about a billion seconds, and a day has only 86,400.',
      ],
      options: [
        { text: 'About 2 seconds', why: 'Twice the switches is not twice the work. *Every single* extra switch doubles it.' },
        { text: 'About an hour', why: 'Much longer. Thirty extra switches double the work thirty times over.' },
        { text: 'About a month', why: 'Still far too short: a month is only about 2.6 million seconds.' },
        { text: 'More than 30 years', correct: true },
      ],
      explain: r`
        Thirty extra switches double the work thirty times over. Thirty doublings are a factor of about a billion, so the job takes about a billion seconds, and a billion seconds is more than 30 years.

        This is **exponential** growth, $O(2^n)$. It is why some problems stay out of reach however fast computers become.
      `,
    },
    {
      id: 'classify',
      type: 'bucket',
      review: true,
      text: r`How does the work grow as $n$ grows? Sort each job into its class.`,
      buckets: [r`$O(\log n)$`, r`$O(n)$`, r`$O(n^2)$`],
      items: [
        { text: 'Find a word in a dictionary by halving', bucket: 0, why: 'Every look in the middle throws away half of what is left: that is logarithmic.' },
        { text: 'The higher / lower guessing game', bucket: 0, why: 'Each guess in the middle halves the range: logarithmic.' },
        { text: r`Add up $n$ prices`, bucket: 1, why: 'Each price is handled once: twice the prices, twice the work.' },
        { text: r`Find the tallest of $n$ people`, bucket: 1, why: 'One look at each person is enough: the work grows in proportion.' },
        { text: r`Bubble-sort $n$ cards`, bucket: 2, why: 'Bubble sort compares about every pair of cards: quadratic.' },
        { text: r`$n$ people all shake hands`, bucket: 2, why: r`Everybody with everybody is $n(n-1)/2$ handshakes: that grows with the square of $n$.` },
      ],
      explain: r`
        Halving is $O(\log n)$. Handling each item once is $O(n)$. Dealing with every *pair* of items is $O(n^2)$.

        When you meet a new algorithm, this is the first question to ask: as the input grows, does the work barely move, keep pace, or run away?
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: *"My new computer is twice as fast as yours, so my bubble sort will beat your merge sort."*

        What would you tell them?
      `,
      model: `
        For a short list, quite possibly. But a faster computer only divides the time by a fixed amount, here two. On big inputs it is the *growth* that decides.

        For a million numbers, bubble sort needs about 500 billion steps and merge sort about 20 million: 25,000 times fewer. Halving the bigger number does not come close to closing that gap, and the gap gets wider with every extra item.
      `,
    },
  ],
  recap: [
    'What matters about an algorithm is how its work **grows** with the size of the input.',
    'From slowest-growing to fastest: $O(1)$, $O(\\log n)$, $O(n)$, $O(n \\log n)$, $O(n^2)$, $O(2^n)$.',
    'Double the input: $O(n)$ doubles, $O(n^2)$ quadruples, $O(\\log n)$ adds one step.',
    'At a billion items: about 30 steps for binary search, a billion for checking one by one.',
  ],
  next: 'Next: the last lesson leaves rows and lists behind for networks, and finds the shortest way through them.',
};
