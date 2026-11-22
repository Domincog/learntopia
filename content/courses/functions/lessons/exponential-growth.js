// Algebra II: Functions & Growth · Lesson 5 · Doubling and Halving
import { r, num } from '../../../kit.js';
import { commas, texCommas } from '../helpers.js';

const PLANS = {
  type: 'exp-compare',
  linear: { start: 100, add: 100, label: 'Plan A', short: 'A', color: 'blue' },
  exponential: { start: 1, factor: 2, label: 'Plan B', short: 'B', color: 'orange' },
  max: 20, unit: 'day',
};

export default {
  id: 'exponential-growth',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Fold it 42 times',
      text: `
        A sheet of paper is about 0.1 mm thick. Fold it in half and the stack is 0.2 mm thick. Fold again: 0.4 mm. Every fold doubles the thickness.

        Imagine you could keep going for **42 folds**. **How thick would the stack be?**
      `,
      shuffle: false,
      options: [
        { text: 'About as thick as a big book' },
        { text: 'As tall as a house' },
        { text: 'As tall as Mount Everest' },
        { text: 'It would reach past the Moon', correct: true },
      ],
      explain: r`
        $0.1 \text{ mm} \times 2^{42}$ is about 440,000 km. The Moon is about 384,000 km away.

        Nobody can really do it. The record for folding one piece of paper in half is 12 folds, set in 2002 by a school student, Britney Gallivan, with a strip of tissue paper more than a kilometre long.

        Doubling starts slowly and then runs away. This lesson is about growth of that kind.
      `,
    },
    {
      id: 'two-ways',
      type: 'info',
      title: 'Two ways to grow',
      text: r`
        A number can grow in two ways. **Linear** growth **adds** the same amount at each step. **Exponential** growth **multiplies** by the same factor at each step. The folded paper was exponential: its thickness doubled every time.

        | Step | 0 | 1 | 2 | 3 | 4 |
        |:--|--:|--:|--:|--:|--:|
        | add 3 | 5 | 8 | 11 | 14 | 17 |
        | multiply by 3 | 5 | 15 | 45 | 135 | 405 |

        Both rows start at 5. **Move the slider** to watch them part company.
      `,
      figure: {
        type: 'exp-compare',
        linear: { start: 5, add: 3, label: 'Add 3', short: '+3', color: 'blue' },
        exponential: { start: 5, factor: 3, label: 'Multiply by 3', short: '×3', color: 'orange' },
        max: 4, n: 0, unit: 'step',
        alt: 'A bar chart that grows step by step. One bar starts at 5 and gains 3 at each step; the other starts at 5 and is multiplied by 3 at each step. A slider chooses the step, from 0 to 4.',
      },
    },
    {
      id: 'race',
      type: 'interact',
      title: 'Add or multiply?',
      text: `
        Two offers. **Plan A** gives you 100 coins on day 0 and adds 100 coins every day. **Plan B** gives you 1 coin on day 0 and **doubles** it every day.

        Step through the days. **Stop on the first day on which Plan B is ahead.**
      `,
      widget: { ...PLANS, n: 0, alt: 'A bar chart that grows day by day. Plan A adds 100 coins a day; Plan B starts with 1 coin and doubles every day. A slider chooses the day.' },
      check: (s) => {
        if (s.n === 11) return true;
        if (s.n === 0) return 'Move the day slider and watch both plans grow.';
        if (s.n < 11) return `On day ${s.n} Plan A is still ahead: ${commas(s.linear)} coins against ${commas(s.exponential)}. Keep going.`;
        return `On day ${s.n} Plan B is ahead, but it took the lead earlier. Go back to the **first** day on which it leads.`;
      },
      solution: { n: 11 },
      explain: r`
        For ten days Plan B looks hopeless: on day 10 it has 1,024 coins against 1,100. On day 11 it overtakes, and after that it is no contest. On day 20, Plan A has 2,100 coins and Plan B has 1,048,576.

        Plan A adds, so it is linear: a straight line. Plan B multiplies, so it is exponential: slow at first, then out of sight.
      `,
    },
    {
      id: 'compare-neighbours',
      type: 'info',
      title: 'Which kind is it?',
      text: r`
        Given only a list of numbers, compare each number with the one before it. **Subtract** neighbours: equal differences mean linear. **Divide** neighbours, as in $21 \div 7 = 3$: equal ratios mean exponential, and that ratio is the **growth factor**.

        | List | Neighbours | Kind |
        |---|---|---|
        | $7, 11, 15, 19$ | differences: all $4$ | linear |
        | $7, 21, 63, 189$ | ratios: all $3$ | exponential |
        | $50, 45, 40, 35$ | differences: all $-5$ | linear, shrinking |
        | $64, 16, 4, 1$ | ratios: all $\tfrac14$ | exponential, shrinking |
        | $1, 3, 6, 10$ | neither is constant | neither |
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      title: 'Which kind of growth?',
      text: 'Look at how each list gets from one number to the next. **Sort the lists.**',
      buckets: ['Linear: adds', 'Exponential: multiplies', 'Neither'],
      items: [
        { text: '3, 6, 12, 24, 48', bucket: 1, why: 'Each number is twice the one before.' },
        { text: '3, 6, 9, 12, 15', bucket: 0, why: 'Each number is 3 more than the one before.' },
        { text: '80, 40, 20, 10, 5', bucket: 1, why: r`Each number is the one before multiplied by $\frac12$. Shrinking by a constant factor counts as exponential too.` },
        { text: '20, 17, 14, 11, 8', bucket: 0, why: r`Each number is the one before plus $-3$: a straight line going down.` },
        { text: '1, 4, 9, 16, 25', bucket: 2, why: 'The steps are +3, +5, +7, +9, and the ratios are not constant either. These are the squares.' },
        { text: '2, 6, 18, 54, 162', bucket: 1, why: 'Each number is 3 times the one before.' },
      ],
      explain: r`Equal differences mean linear, equal ratios mean exponential, whether the list rises or falls. The squares $1, 4, 9, 16, 25$ pass neither test: their steps are $+3, +5, +7, +9$, and their ratios change as well.`,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The exponential rule',
      text: r`
        Plan A was the straight line $\;y = 100 + 100x$. Plan B was $\;y = 1 \cdot 2^x$, with the variable in the **exponent**. That is where the name comes from.

        :::key
        An exponential function has the form $\;y = a \cdot b^{x}$
        :::

        $a$ is the **starting value**: at $x = 0$ the power $b^0$ is 1, so $y = a$. And $b$ is the **growth factor**: what the value is multiplied by when $x$ goes up by 1.

        :::example
        A pond has 3 water lilies, and their number doubles every week. So $a = 3$ and $b = 2$: after $t$ weeks there are $N = 3 \cdot 2^{\,t}$. After 5 weeks: $\;3 \times 2^5 = 3 \times 32 = 96$.
        :::
      `,
    },
    {
      id: 'write-rule',
      type: 'fill',
      gen: (rng) => {
        const b = rng.pick([2, 3]);
        const word = b === 2 ? 'doubles' : 'triples';
        const a = rng.pick([5, 10, 20, 50, 100]);
        const T = rng.int(3, 5);
        const story = rng.pick([
          { lead: `At 9 o'clock, **${a} people** have heard a rumour. Every hour, the number of people who have heard it **${word}**.`, unit: 'hours', N: 'the number of people', after: `After ${T} hours` },
          { lead: `A video has **${a} views** on the day it is posted. Every day after that, its number of views **${word}**.`, unit: 'days', N: 'the number of views', after: `After ${T} days` },
          { lead: `A lab dish starts with **${a} yeast cells**. Every hour, their number **${word}**.`, unit: 'hours', N: 'the number of cells', after: `After ${T} hours` },
        ]);
        const value = a * b ** T;
        return {
          title: 'Write the rule',
          text: `
            ${story.lead}

            **Write the rule, then use it.**
          `,
          template: r`
            After $t$ ${story.unit}, ${story.N} is $\;N = a \cdot b^{\,t}\;$ with $a =$ [[${a}]] and $b =$ [[${b}]].

            ${story.after}: $N =$ [[${value}]]
          `,
          hints: [
            `The starting value is ${a}. "${word[0].toUpperCase()}${word.slice(1)}" means: multiply by ${b} at every step.`,
            r`${story.after}: $${a} \times ${b}^{${T}} = ${a} \times ${b ** T}$.`,
          ],
          explain: r`$N = ${a} \cdot ${b}^{\,t}$. ${story.after}: $${a} \times ${b}^{${T}} = ${a} \times ${b ** T} = ${texCommas(value)}$.`,
        };
      },
    },
    {
      id: 'factor-slider',
      type: 'interact',
      title: 'The growth factor',
      text: r`
        This curve is $\;y = 4 \cdot \blue{b}^{\,x}$. It starts at 4, whatever $b$ is.

        **Slide $b$ until the curve passes through both orange dots.**
      `,
      widget: {
        type: 'plot', x: [0, 6], y: [0, 16], xStep: 1, yStep: 2,
        params: { b: { min: 0.25, max: 1.5, step: 0.25, value: 1.5, label: 'factor $b$', color: 'blue' } },
        fns: [{ expr: '4*b^x', color: 'blue' }],
        points: [{ x: 0, y: 4, color: 'blue' }, { x: 1, y: 2, color: 'orange' }, { x: 2, y: 1, color: 'orange' }],
        alt: 'The curve y = 4 times b to the power x, starting at height 4. A slider changes b. Orange dots mark the points (1, 2) and (2, 1).',
      },
      check: (s) => {
        if (s.b === 0.5) return true;
        if (s.b === 1) return 'Multiplying by 1 changes nothing: the curve is a flat line at height 4.';
        if (s.b > 1) return 'With a factor greater than 1 the curve climbs. The dots are **below** the starting value, so each step has to make the value smaller.';
        return s.b > 0.5
          ? r`The curve falls, but too slowly: at $x = 1$ it is at $4 \times 0.75 = 3$, above the dot.`
          : r`Too fast: at $x = 1$ the curve is already down at $4 \times 0.25 = 1$, below the dot.`;
      },
      solution: { b: 0.5 },
      explain: r`
        $y = 4 \cdot \left(\tfrac12\right)^x$ gives $4, 2, 1, \tfrac12 \ldots$ Each step **halves** the value, so the curve falls.
      `,
    },
    {
      id: 'decay-half-life',
      type: 'info',
      title: 'Growth, decay and half-life',
      text: r`
        A factor greater than 1 gives exponential **growth**. A factor between 0 and 1 gives exponential **decay**: the curve sinks towards zero but never gets there, because half of a positive number is still positive.

        The time one halving takes is called the **half-life**. The time one doubling takes is the **doubling time**. Either way, count the steps first.

        :::example
        A substance has a half-life of 3 days. Of 200 g, how much is left after 9 days?

        9 days is $9 \div 3 = 3$ half-lives. Halve 3 times: $200 \to 100 \to 50 \to 25$ g.
        :::
      `,
      figure: {
        type: 'plot', x: [0, 12], y: [0, 220], xStep: 3, yStep: 50, xLabel: 'days', yLabel: 'grams',
        fns: [{ expr: '200*0.5^(x/3)', color: 'blue' }],
        points: [{ x: 0, y: 200, color: 'orange' }, { x: 3, y: 100, color: 'orange' }, { x: 6, y: 50, color: 'orange' }, { x: 9, y: 25, color: 'orange' }],
        labels: [
          { x: 0, y: 200, text: '200', color: 'orange', dx: 12, dy: 5 },
          { x: 3, y: 100, text: '100', color: 'orange', dx: 12, dy: -6 },
          { x: 6, y: 50, text: '50', color: 'orange', dx: 10, dy: -8 },
          { x: 9, y: 25, text: '25', color: 'orange', dx: 8, dy: -10 },
        ],
        alt: 'A falling curve of grams against days. It starts at 200 grams and halves every 3 days: 100 grams at day 3, 50 at day 6, 25 at day 9.',
      },
    },
    {
      id: 'half-life',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.int(2, 4);
        const a = rng.pick([16, 32, 48, 64, 80, 160, 240, 400, 800]);
        const story = rng.bool()
          ? { h: rng.pick([4, 6, 8]), per: 'hours', lead: (h) => `A patient takes **${a} mg** of a medicine. Its half-life in the body is **${h} hours**: every ${h} hours, half of what is left is broken down.`, unit: 'mg' }
          : { h: 5730, per: 'years', lead: () => `Carbon-14 decays with a half-life of about **5,730 years**: in that time, half of it turns into nitrogen. A piece of wood starts with **${a} units** of carbon-14.`, unit: 'units' };
        const total = k * story.h;
        const value = a / 2 ** k;
        const chain = Array.from({ length: k + 1 }, (_, i) => num(a / 2 ** i)).join(r` \to `);
        return {
          title: 'Half-life',
          text: `
            ${story.lead(story.h)}

            **How much is left after ${commas(total)} ${story.per}?**
          `,
          answer: value,
          unit: story.unit,
          wrong: [
            [a / 2, `That is what is left after one half-life. ${commas(total)} ${story.per} is ${k} half-lives.`],
            [a / (2 * k), r`Halving ${k} times divides by $2^{${k}} = ${2 ** k}$, not by $2 \times ${k} = ${2 * k}$.`],
            [0, 'Halving never reaches zero: there is always half of the last amount left.'],
          ],
          hints: [
            `How many half-lives fit into ${commas(total)} ${story.per}?`,
            `${k} half-lives: start with ${a} and halve it ${k} times.`,
          ],
          explain: r`${commas(total)} ${story.per} is ${k} half-lives. Halve ${k} times: $${chain}$. As a formula: $${a} \times \left(\tfrac12\right)^{${k}} = ${num(value)}$.`,
        };
      },
    },
    {
      id: 'doubling',
      type: 'numeric',
      gen: (rng) => {
        const d = rng.pick([20, 30]);
        const k = rng.int(3, 6);
        const a = rng.pick([1, 5, 10, 50, 100]);
        const value = a * 2 ** k;
        return {
          title: 'Doubling time',
          text: `
            A colony of bacteria **doubles every ${d} minutes** while it has food and room. Right now there ${a === 1 ? 'is **1 bacterium**' : `are **${a} bacteria**`}.

            **How many will there be in ${k * d} minutes?**
          `,
          answer: value,
          wrong: [
            [a * 2 * k, r`That doubles once and then multiplies by ${k}. Doubling ${k} times multiplies by $2^{${k}} = ${2 ** k}$.`],
            [a * k, `${k * d} minutes is ${k} doubling times. Each of them doubles the number.`],
            [a * 2, `That is the number after one doubling, ${d} minutes from now.`],
          ],
          hints: [
            `How many times does the colony double in ${k * d} minutes?`,
            r`${k} doublings: multiply by 2, ${k} times over. That is $\times\, 2^{${k}}$.`,
          ],
          explain: r`${k * d} minutes is ${k} doubling times, so the number is multiplied by $2^{${k}} = ${2 ** k}$: $\;${a} \times ${2 ** k} = ${texCommas(value)}$.`,
        };
      },
    },
    {
      id: 'eventually',
      type: 'choice',
      review: true,
      title: 'Which wins in the end?',
      text: `
        **Plan C** starts with 1,000 coins and adds **1,000 coins** every week. **Plan D** starts with 1 coin and multiplies it by **1.5** every week.

        Use the slider. **Which plan has more in the long run?**
      `,
      figure: {
        type: 'exp-compare',
        linear: { start: 1000, add: 1000, label: 'Plan C', short: 'C', color: 'blue' },
        exponential: { start: 1, factor: 1.5, label: 'Plan D', short: 'D', color: 'orange' },
        max: 30, n: 4, unit: 'week',
        alt: 'A bar chart that grows week by week. Plan C starts with 1,000 coins and adds 1,000 a week; Plan D starts with 1 coin and is multiplied by 1.5 every week. A slider chooses the week.',
      },
      options: [
        { text: 'Plan D, from week 26 on', correct: true },
        { text: 'Plan C, always: it adds far more each week', why: 'Up to week 25, yes. Slide further.' },
        { text: 'Plan D, from the first week on', why: 'In week 1, Plan C has 2,000 coins and Plan D has 1.5.' },
        { text: 'They keep overtaking each other', why: 'Once Plan D is ahead, it gains half of what it has every week, and that is far more than 1,000. Plan C never catches up again.' },
      ],
      explain: r`
        Plan D is behind up to week 25. In week 26 it has about 37,877 coins against 27,000, and from then on its lead only grows.

        An exponential with a growth factor above 1 **eventually** overtakes any straight line, however steep the line and however small the factor. "Eventually" can mean a long wait, though.
      `,
    },
    {
      id: 'chessboard',
      type: 'numeric',
      gen: (rng) => {
        const k = rng.int(6, 12);
        const value = 2 ** (k - 1);
        return {
          title: 'Grains on a chessboard',
          text: `
            An old story: a king is asked for one grain of rice on the first square of a chessboard, two on the second, four on the third, and so on, **doubling on every square**.

            **How many grains go on square ${k}?**
          `,
          answer: value,
          wrong: [
            [2 ** k, r`One doubling too many. Square 1 has $2^0 = 1$ grain, so square ${k} has $2^{${k - 1}}$.`],
            [2 * k, 'That doubles the number of the square. It is the **amount** on the square before that is doubled each time.'],
            [2 * (k - 1), 'That doubles the number of steps. It is the **amount** on the square before that is doubled each time.'],
          ],
          hints: [
            `From square 1 to square ${k} there are ${k - 1} doublings, not ${k}.`,
            r`Start at 1 and double ${k - 1} times: $2^{${k - 1}}$.`,
          ],
          explain: r`
            Square 1 holds 1 grain, and each of the ${k - 1} steps to square ${k} doubles it: $2^{${k - 1}} = ${texCommas(value)}$.

            The 64th square alone would need $2^{63}$ grains, about 9 followed by 18 zeros: far more rice than the whole world harvests in a year.
          `,
        };
      },
    },
    {
      id: 'find-factor',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [b, starts] = rng.pick([
          [2, [3, 5, 7, 10, 20]], [3, [2, 4, 5, 10]], [4, [1, 2, 3, 5]],
          [1.5, [16, 32, 80, 160]], [2.5, [8, 16, 40]], [0.5, [80, 96, 200, 480]], [0.25, [320, 640, 1280]],
        ]);
        const a = rng.pick(starts);
        const list = [0, 1, 2, 3].map((i) => a * b ** i);
        return {
          text: r`
            Each number in this list is the one before it multiplied by the same factor.

            $$ ${list.map((v) => num(v)).join(r`,\quad `)} $$

            **What is the growth factor?**
          `,
          answer: b,
          wrong: [
            [list[1] - list[0], 'That is the **difference** between the first two numbers. A growth factor is what you multiply by: divide a number by the one before it.'],
            [1 / b, 'That is the factor for going backwards, from right to left. Divide a number by the one **before** it.'],
          ],
          hints: [r`Divide the second number by the first: $${num(list[1])} \div ${num(list[0])}$.`],
          explain: r`$${num(list[1])} \div ${num(list[0])} = ${num(b)}$, and the other neighbours give the same: $${num(list[2])} \div ${num(list[1])} = ${num(b)}$. ${b < 1 ? 'The factor is less than 1, so this is exponential decay.' : 'The factor is greater than 1, so this is exponential growth.'}`,
        };
      },
    },
    {
      id: 'folds',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const [words, mm] = rng.pick([['1 metre', 1000], ['10 metres', 10000], ['100 metres', 100000], ['1 kilometre', 1000000]]);
        const need = mm * 10;                     // 0.1 × 2^n > mm  means  2^n > 10 × mm
        let n = 0;
        while (2 ** n <= need) n++;
        const before = 2 ** (n - 1) / 10;         // the thickness, in mm, one fold earlier
        return {
          title: 'Back to the paper',
          text: `
            A sheet of paper is 0.1 mm thick, and every fold doubles the thickness of the stack.

            **What is the smallest number of folds that makes the stack thicker than ${words}** (${commas(mm)} mm)?
          `,
          answer: n,
          unit: 'folds',
          wrong: [
            [n - 1, r`Not quite: $0.1 \times 2^{${n - 1}} = ${texCommas(before)}$ mm, still less than ${commas(mm)} mm. One more fold.`],
            [need, 'That is how many times thicker the stack has to become. The question asks how many **doublings** it takes to get there.'],
          ],
          hints: [
            r`You need $0.1 \times 2^n$ to be more than ${commas(mm)}, so $2^n$ must be more than ${commas(need)}.`,
            r`$2^{10} = 1{,}024$. Keep doubling from there and count.`,
          ],
          explain: r`
            $2^n$ has to pass ${commas(need)}. Now $2^{${n - 1}} = ${texCommas(2 ** (n - 1))}$ is too small and $2^{${n}} = ${texCommas(2 ** n)}$ is enough, so it takes **${n} folds**.

            Hunting for an exponent by trial and error works, but it is slow. The next lesson has a tool for exactly this question.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Something that doubles at every step seems harmless for a long time, and then it seems to explode.

        **In your own words: why does it look like that?**
      `,
      model: r`
        Because each step adds as much as there already was. Going from 8 to 16 adds 8; going from 512 to 1,024 adds 512.

        So the early steps are tiny compared with the later ones, and on any picture that has room for the last step, the first ones are too small to see. The rule never changes: it is always "times 2". What changes is how much "times 2" amounts to.
      `,
    },
  ],
  recap: [
    'Linear growth **adds** the same amount at each step. Exponential growth **multiplies** by the same factor.',
    'In $y = a \\cdot b^x$, $a$ is the starting value and $b$ is the growth factor.',
    'A factor above 1 gives growth, a factor between 0 and 1 gives decay. Doubling time and half-life count the steps.',
    'Exponential growth starts slowly but eventually overtakes any straight line.',
  ],
  next: 'Next: the logarithm, a tool that answers "which exponent?" without trial and error.',
};
