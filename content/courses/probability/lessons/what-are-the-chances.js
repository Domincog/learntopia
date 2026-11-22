// Probability & Chance · Lesson 1 · What Are the Chances?
import { r, frac, num } from '../../../kit.js';
import { fracText, rawFrac, pct } from '../helpers.js';

// A spinner whose three sections are NOT the same size: red covers half, blue and green a quarter each.
const UNEVEN_SPINNER = {
  type: 'svg', viewBox: '0 0 220 216', maxWidth: 230,
  alt: 'A spinner with three sections. The red section covers half of the circle; the blue and the green section cover a quarter each.',
  content:
    '<g transform="rotate(25 110 116)" stroke-width="3" stroke-linejoin="round">' +
    '<path class="fill-red stroke-ink" d="M110 26 A90 90 0 0 0 110 206 Z"/>' +
    '<path class="fill-blue stroke-ink" d="M110 116 L110 26 A90 90 0 0 1 200 116 Z"/>' +
    '<path class="fill-green stroke-ink" d="M110 116 L200 116 A90 90 0 0 1 110 206 Z"/></g>' +
    '<circle class="fill-surface stroke-ink" stroke-width="3" cx="110" cy="116" r="8"/>' +
    '<path class="fill-orange stroke-ink" stroke-width="3" stroke-linejoin="round" d="M98 4 H122 L110 30 Z"/>' +
    '<text class="fig-label" style="fill:#1D1B26" x="65" y="100" text-anchor="middle">red</text>' +
    '<text class="fig-label" style="fill:#1D1B26" x="157" y="104" text-anchor="middle">blue</text>' +
    '<text class="fig-label" style="fill:#1D1B26" x="128" y="169" text-anchor="middle">green</text>',
};

// The probability scale, from impossible to certain.
const SCALE = {
  type: 'svg', viewBox: '0 0 360 86', maxWidth: 420,
  alt: 'A line from 0 to 1. 0 is labelled impossible, one half is labelled even chance, 1 is labelled certain.',
  content:
    '<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" d="M30 30 H330 M30 20 V40 M180 20 V40 M330 20 V40"/>' +
    '<text class="fig-label-lg" x="30" y="62" text-anchor="middle">0</text>' +
    '<text class="fig-label-lg" x="180" y="62" text-anchor="middle">½</text>' +
    '<text class="fig-label-lg" x="330" y="62" text-anchor="middle">1</text>' +
    '<text class="fig-label-sm" style="fill:var(--ink-3)" x="30" y="80" text-anchor="middle">impossible</text>' +
    '<text class="fig-label-sm" style="fill:var(--ink-3)" x="180" y="80" text-anchor="middle">even chance</text>' +
    '<text class="fig-label-sm" style="fill:var(--ink-3)" x="330" y="80" text-anchor="middle">certain</text>',
};

export default {
  id: 'what-are-the-chances',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two bags, one guess',
      text: `
        Each bag holds red and blue marbles. You will reach into **one** bag
        without looking and take out a single marble. You win if it is red.

        **Which bag gives you the better chance?**
      `,
      figure: {
        type: 'marble-bag',
        bags: [{ label: 'Bag A', marbles: { red: 3, blue: 1 } }, { label: 'Bag B', marbles: { red: 30, blue: 10 } }],
        alt: 'Two bags of marbles. Bag A holds 3 red marbles and 1 blue one. Bag B holds 30 red marbles and 10 blue ones.',
        caption: 'Bag A: 3 red, 1 blue. Bag B: 30 red, 10 blue.',
      },
      shuffle: false,
      options: [
        { text: 'Bag A' },
        { text: 'Bag B: it has far more red marbles' },
        { text: 'It makes no difference', correct: true },
      ],
      explain: `
        It makes no difference. In bag A, 3 of the 4 marbles are red. In bag B,
        30 of the 40 are red, and that is *also* three out of every four.

        What matters is not how many red marbles there are, but **what share of
        the bag** they make up.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Change the share',
      text: `
        Here is bag A. The bar underneath shows what share of the marbles is red.

        Use the **+** and **−** buttons to change what is in the bag.
        **Make red exactly as likely as blue.**
      `,
      widget: { type: 'marble-bag', marbles: { red: 3, blue: 1 }, show: 'fraction' },
      check: (s) => {
        if (s.total === 0) return 'The bag is empty. Put some marbles in.';
        if (s.counts.red === s.counts.blue) return true;
        return s.counts.red > s.counts.blue
          ? 'Red is still more likely than blue. Add blue marbles, or take some red ones out.'
          : 'Now blue is more likely than red. Even them up.';
      },
      solution: { counts: { red: 3, blue: 3 } },
      explain: r`
        Whenever the bag holds as many red marbles as blue ones, red makes up
        half of it: 1 out of 2, 3 out of 6, 10 out of 20.

        The chance of red is then $\frac{1}{2}$: an **even chance**.
      `,
    },
    {
      id: 'idea',
      type: 'info',
      title: 'Probability is a fraction',
      text: r`
        The chance that something happens is called its **probability**. When
        every outcome is equally likely (here: every marble has the same
        chance of being picked), you find it by counting:

        $$ \text{probability} = \frac{\text{outcomes you want}}{\text{all outcomes}} $$

        For bag A, with [3 red]{.red} marbles among 4:

        $$ P(\text{red}) = \frac{\red{3}}{4} $$

        $P(\text{red})$ is shorthand for "the probability of red". Underneath
        goes **every** marble in the bag, the red ones included.
      `,
      figure: {
        type: 'marble-bag', static: true, width: 190, marbles: { red: 3, blue: 1 },
        alt: 'Bag A: a bag holding 3 red marbles and 1 blue one.',
        caption: 'Bag A: 4 marbles, 3 of them red.',
      },
    },
    {
      id: 'count-it',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const colours = rng.sample(['red', 'blue', 'green', 'yellow', 'orange', 'purple'], 3);
        const counts = [rng.int(2, 7), rng.int(2, 7), rng.int(2, 7)];
        const i = rng.int(0, 2);
        const c = colours[i];
        const k = counts[i];
        const total = counts[0] + counts[1] + counts[2];
        const reduced = fracText(k, total) !== `${k}/${total}`;
        return {
          text: r`
            A bag holds **${counts[0]} ${colours[0]}**, **${counts[1]} ${colours[1]}** and **${counts[2]} ${colours[2]}** marbles.
            You take one out without looking.

            What is the probability that it is **${c}**? Give your answer as a fraction.
          `,
          answer: `${k}/${total}`,
          display: fracText(k, total),
          tolerance: 0.005,
          wrong: [
            [k / (total - k), `That compares the ${c} marbles with the *other* marbles. Divide by **all** the marbles in the bag, the ${c} ones included.`],
            [1 / 3, 'There are three colours, but they are not equally common. Count marbles, not colours.'],
            [(total - k) / total, `That is the probability of *not* getting ${c}.`],
          ],
          hints: [
            `How many marbles are in the bag altogether? How many of them are ${c}?`,
            r`$P(\text{${c}}) = \dfrac{\text{number of ${c} marbles}}{\text{number of marbles}} = \dfrac{${k}}{${total}}$`,
          ],
          explain: r`${k} of the ${total} marbles are ${c}, and every marble is equally likely to be picked: $P(\text{${c}}) = ${rawFrac(k, total)}${reduced ? ` = ${frac(k, total)}` : ''}$.`,
        };
      },
    },
    {
      id: 'certain',
      type: 'interact',
      title: 'As sure as it gets',
      text: `
        This bag holds 2 red marbles and 3 blue ones.

        **Change it so that drawing a red marble is certain**: it cannot fail.
      `,
      widget: { type: 'marble-bag', marbles: { red: 2, blue: 3 }, show: 'fraction' },
      check: (s) => {
        if (s.total === 0) return 'An empty bag gives you nothing to draw. Keep at least one red marble in it.';
        if (s.counts.red === 0) return 'Now red is *impossible*: there is no red marble left to draw.';
        if (s.counts.blue > 0) return 'There is still a blue marble you might pick, so red is not certain yet.';
        return true;
      },
      solution: { counts: { red: 2, blue: 0 } },
      hints: ['Red is certain when nothing else can come out of the bag.'],
      explain: `
        With only red marbles left, every marble you could draw is red. And
        blue cannot happen at all: there is no blue marble left to pick.
      `,
    },
    {
      id: 'teach-scale',
      type: 'info',
      title: 'From impossible to certain',
      text: r`
        In that all-red bag, 2 of the 2 marbles are red and 0 of the 2 are
        blue: $P(\text{red}) = \frac{2}{2} = 1$ and $P(\text{blue}) = \frac{0}{2} = 0$.

        Nothing is more likely than **certain** (probability 1) or less likely
        than **impossible** (probability 0). So every probability lies
        between 0 and 1, and the nearer it is to 1, the more likely the event.

        :::example
        A die has six equally likely faces: 1, 2, 3, 4, 5 and 6. Two of
        them are smaller than 3, so
        $P(\text{smaller than 3}) = \frac{2}{6} = \frac{1}{3}$.
        :::
      `,
      figure: SCALE,
    },
    {
      id: 'scale',
      type: 'order',
      text: `
        You roll one ordinary six-sided die.
        **Put these events in order, from least likely to most likely.**
      `,
      figure: SCALE,
      items: [
        'Rolling a 7',
        'Rolling a 6',
        'Rolling an even number',
        'Rolling a number bigger than 1',
        'Rolling a number smaller than 7',
      ],
      labels: ['Least likely', 'Most likely'],
      hints: [
        'A die has the faces 1, 2, 3, 4, 5 and 6. For each event, count the faces that fit.',
        'One of these events fits no face at all, and one fits every face.',
      ],
      explain: r`
        Count the faces that fit: $\frac{0}{6}$, $\frac{1}{6}$, $\frac{3}{6}$,
        $\frac{5}{6}$ and $\frac{6}{6}$. That runs from 0 (impossible: there is no 7)
        through $\frac{1}{2}$ (an even chance) up to 1 (certain).
      `,
    },
    {
      id: 'teach-three-ways',
      type: 'info',
      title: 'Three ways to write it',
      text: r`
        A probability is a number between 0 and 1, so you can write it as a
        **fraction**, a **decimal** or a **percentage**. To change a fraction,
        do the division. Then multiply by 100 to get the percentage.

        | Fraction | Decimal | Percentage |
        |:---:|:---:|:---:|
        | $\frac{1}{2}$ | 0.5 | 50% |
        | $\frac{3}{4}$ | 0.75 | 75% |
        | $\frac{1}{100}$ | 0.01 | 1% |

        :::example
        A raffle has 40 tickets and you hold 6 of them, so
        $P(\text{win}) = \frac{6}{40}$. Divide: $6 \div 40 = 0.15$.
        Multiply by 100: $15\%$.
        :::
      `,
    },
    {
      id: 'three-ways',
      type: 'match',
      text: '**Match each probability with the same value written as a percentage.**',
      pairs: [
        [r`$\frac{1}{4}$`, '25%'],
        ['$0.1$', '10%'],
        [r`$\frac{3}{5}$`, '60%'],
        ['$0.05$', '5%'],
      ],
      explain: r`
        Divide, then multiply by 100: $\frac{3}{5} = 0.6 = 60\%$. Watch out
        for $0.05$: that is 5 hundredths, so 5%, not 50%.
      `,
    },
    {
      id: 'percent',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([4, 5, 8, 10, 20, 25, 50]);
        const k = rng.int(1, n - 1);
        const answer = (100 * k) / n;
        const story = rng.pick([
          { text: `A spinner is divided into **${n} equal sections**. ${k === 1 ? 'One of them is' : `${k} of them are`} green.\n\nWhat is the probability that it stops on green?`, want: 'green sections' },
          { text: `A raffle has **${n} tickets**, and each ticket is equally likely to win. You hold ${k === 1 ? 'one' : k} of them.\n\nWhat is the probability that you win?`, want: 'tickets of yours' },
          { text: `A bag holds **${n} marbles**. ${k === 1 ? 'One of them is' : `${k} of them are`} yellow. You take one out without looking.\n\nWhat is the probability that it is yellow?`, want: 'yellow marbles' },
        ]);
        return {
          text: `${story.text} Give your answer as a percentage.`,
          answer,
          unit: '%',
          wrong: [
            [k, `${k} is the number of ${story.want}. Divide it by all ${n}, then turn the result into a percentage.`],
            [k / n, 'That is the probability as a decimal. As a percentage it is 100 times as large.'],
            [100 / n, `That is the chance for just one of the ${n}. How many of them count for you?`],
          ],
          hints: [
            r`Write the fraction first: $\frac{${k}}{${n}}$.`,
            r`$\frac{${k}}{${n}} = ${num(k / n)}$. Multiply by 100 to get a percentage.`,
          ],
          explain: r`$P = \frac{${k}}{${n}} = ${num(k / n)} = ${num(answer)}\%$.`,
        };
      },
    },
    {
      id: 'not-equal',
      type: 'choice',
      title: 'When counting goes wrong',
      text: r`
        This spinner has three sections: red, blue and green.

        **Is the probability of landing on red $\frac{1}{3}$?**
      `,
      figure: UNEVEN_SPINNER,
      options: [
        { text: 'Yes: red is 1 of the 3 sections', why: 'Counting sections only works when they are all the same size. The red one is twice as big as each of the others.' },
        { text: r`No: it is $\frac{1}{2}$`, correct: true },
        { text: r`No: it is $\frac{2}{3}$`, why: 'Red is the biggest section, but look how much of the circle it covers: half, not two thirds.' },
      ],
      explain: r`
        "Outcomes you want ÷ all outcomes" only works when the outcomes you
        count are **equally likely**. So cut the circle into four equal
        quarters: red covers 2 of the 4, and $P(\text{red}) = \frac{2}{4} = \frac{1}{2}$.
      `,
    },
    {
      id: 'build',
      type: 'interact',
      title: 'A bag made to order',
      text: `
        This bag starts empty.

        **Fill it so that the probability of drawing a blue marble is exactly 30%.**
      `,
      widget: { type: 'marble-bag', marbles: { blue: 0, red: 0 }, focus: 'blue', show: 'all' },
      check: (s) => {
        if (s.total === 0) return 'The bag is still empty.';
        if (Math.abs(s.p.blue - 0.3) < 1e-9) return true;
        return s.p.blue > 0.3
          ? `Blue is too likely: ${pct(s.p.blue)}%. Add red marbles, or take blue ones out.`
          : `Blue is not likely enough: ${pct(s.p.blue)}%. Add blue marbles, or take red ones out.`;
      },
      solution: { counts: { blue: 3, red: 7 } },
      hints: [
        r`30% means $\frac{30}{100}$. Can you write that as a simpler fraction?`,
        r`$\frac{30}{100} = \frac{3}{10}$: you need 3 blue marbles in every 10.`,
      ],
      explain: r`
        $30\% = \frac{30}{100} = \frac{3}{10}$. So 3 blue marbles out of 10
        does it: 3 blue and 7 red.
      `,
    },
    {
      id: 'example-backwards',
      type: 'info',
      title: 'From the share back to the bag',
      text: r`
        A probability fixes the **share**, not the number of marbles.
        $P(\text{blue}) = \frac{3}{10}$ fits 3 blue out of 10, and just as
        well 6 out of 20 or 30 out of 100. So if you know the share and one
        of the counts, you can work out the rest.

        :::example
        A bag holds 15 red marbles, the rest are blue, and $P(\text{red}) = \frac{5}{7}$.

        1. Red fills 5 of 7 equal parts, so one part is $15 \div 5 = 3$ marbles.
        2. The whole bag is 7 parts: $7 \times 3 = 21$ marbles.
        3. Not red: $21 - 15 = 6$ blue marbles.
        :::
      `,
      figure: {
        type: 'marble-bag', static: true, width: 190, marbles: { red: 15, blue: 6 },
        alt: 'A bag holding 15 red marbles and 6 blue ones.',
        caption: '15 red and 6 blue: 21 marbles, and 15 out of 21 is five sevenths.',
      },
    },
    {
      id: 'missing',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        const [a, b] = rng.pick([[1, 3], [1, 4], [2, 5], [1, 5], [3, 5], [2, 3], [3, 4], [1, 6], [3, 8]]);
        const k = rng.int(2, 4);
        const red = a * k;
        const total = b * k;
        const blue = total - red;
        return {
          text: r`
            A bag holds only red and blue marbles. There are **${red} red** marbles,
            and the probability of drawing a red one is $\frac{${a}}{${b}}$.

            **How many blue marbles are in the bag?**
          `,
          answer: blue,
          wrong: [
            [total, `${total} is the number of marbles altogether. How many of those are not red?`],
            [b - a, r`$\frac{${a}}{${b}}$ is the simplified fraction. The real bag holds ${red} red marbles, not ${a}.`],
            [b, r`$\frac{${a}}{${b}}$ is the simplified fraction: the bag need not hold exactly ${b} marbles.`],
          ],
          hints: [
            r`The ${red} red marbles are $\frac{${a}}{${b}}$ of the bag. How many marbles must the whole bag hold?`,
            `Think of the bag as ${b} equal parts. The red marbles fill ${a} of them, so one part is ${k} marbles.`,
          ],
          explain: r`
            The ${red} red marbles are ${a} of ${b} equal parts, so one part is
            $${red} \div ${a} = ${k}$ marbles and the whole bag holds
            $${b} \times ${k} = ${total}$. That leaves $${total} - ${red} = ${blue}$ blue marbles.
          `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about probability are **true**?',
      options: [
        { text: r`A probability of 0.25, of $\frac{1}{4}$ and of 25% all mean the same thing`, correct: true },
        { text: 'A probability can never be bigger than 1', correct: true },
        { text: r`If there are exactly two possible outcomes, each one has probability $\frac{1}{2}$`, why: 'Only if the two outcomes are equally likely. A bag with 9 red marbles and 1 blue one also has just two outcomes.' },
        { text: 'More red marbles in a bag always means a better chance of drawing red', why: 'Not if the other colours grow as well: 30 red out of 40 is the same chance as 3 red out of 4.' },
      ],
      explain: `
        A probability is a **share**: the outcomes you want, out of all the
        equally likely outcomes. It runs from 0 to 1, and you can write it as
        a fraction, a decimal or a percentage.
      `,
    },
  ],
  recap: [
    'Probability = outcomes you want ÷ all outcomes, as long as the outcomes are **equally likely**.',
    'It is the share that counts, not the number: 3 out of 4 is the same chance as 30 out of 40.',
    'Every probability lies between 0 (impossible) and 1 (certain).',
    'A fraction, a decimal and a percentage are three ways to write the same probability.',
  ],
  next: 'Next: roll *two* dice at once, and find out why 7 comes up so often.',
};
