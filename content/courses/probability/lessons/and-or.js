// Probability & Chance · Lesson 4 · And, Or, Not
import { r, frac, lcm } from '../../../kit.js';
import { diceWhere, fracText, rawFrac, treeFigure, nearMiss, commas } from '../helpers.js';

const HIGH = (v) => v >= 5;                       // "shows a 5 or a 6"
const BOTH_HIGH = (a, b) => HIGH(a) && HIGH(b);
const ANY_HIGH = (a, b) => HIGH(a) || HIGH(b);

/** TeX for a product of fractions and its value: "\frac{1}{2} \times \frac{1}{6} = \frac{1}{12}". */
function productTex(parts) {
  const n = parts.reduce((t, p) => t * p[0], 1);
  const d = parts.reduce((t, p) => t * p[1], 1);
  const reduced = fracText(n, d) !== `${n}/${d}`;
  return `${parts.map(([a, b]) => rawFrac(a, b)).join(' \\times ')} = ${rawFrac(n, d)}${reduced ? ` = ${frac(n, d)}` : ''}`;
}

// A bar from 0 to 1, split into "red" (one quarter) and "not red" (the other three quarters).
const NOT_BAR = {
  type: 'svg', viewBox: '0 0 360 96', maxWidth: 400,
  alt: 'A bar that stands for a probability of 1. One quarter of it is labelled red, the remaining three quarters are labelled not red.',
  content:
    '<rect class="fill-red-soft stroke-red" stroke-width="2.5" x="20" y="20" width="80" height="40" rx="6"/>' +
    '<rect class="fill-gray-soft stroke-gray" stroke-width="2.5" x="100" y="20" width="240" height="40" rx="6"/>' +
    '<text class="fig-label" x="60" y="46" text-anchor="middle">red</text>' +
    '<text class="fig-label" x="220" y="46" text-anchor="middle">not red</text>' +
    '<text class="fig-label" x="60" y="84" text-anchor="middle">¼</text>' +
    '<text class="fig-label" x="220" y="84" text-anchor="middle">¾</text>',
};

// Cards 1 to 15: multiples of 3 in blue, multiples of 5 in orange, and 15 (in both lists) in violet.
const CARDS_15 = (() => {
  let out = '';
  for (let n = 1; n <= 15; n++) {
    const col = (n - 1) % 5;
    const row = Math.floor((n - 1) / 5);
    const hue = n % 15 === 0 ? 'violet' : n % 3 === 0 ? 'blue' : n % 5 === 0 ? 'orange' : null;
    const x = 12 + col * 58;
    const y = 8 + row * 54;
    out += `<rect class="${hue ? `fill-${hue}-soft stroke-${hue}` : 'fill-surface stroke-ink-3'}" stroke-width="2.5" x="${x}" y="${y}" width="46" height="42" rx="8"/>`;
    out += `<text class="fig-label" x="${x + 23}" y="${y + 27}" text-anchor="middle">${n}</text>`;
  }
  return {
    type: 'svg', viewBox: '0 0 300 170', maxWidth: 330,
    alt: 'Fifteen cards numbered 1 to 15. The multiples of 3 (3, 6, 9, 12) are tinted blue, the multiples of 5 (5, 10) are tinted orange, and 15, which is both, is tinted violet.',
    caption: 'Blue: multiples of 3. Orange: multiples of 5. Violet: 15 is both.',
    content: out,
  };
})();

export default {
  id: 'and-or',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: "A gambler's question",
      text: `
        You roll a die **four times**. You win if **at least one** of the four
        rolls is a six.

        **What is your chance of winning?** Drag the slider to your best guess.
      `,
      min: 0, max: 100, step: 1, answer: 52, tolerance: 4, unit: '%', start: 0,
      explain: r`
        About 52%: only a little better than even. A tempting shortcut says
        "four rolls at $\frac{1}{6}$ each, so $\frac{4}{6} \approx 67\%$". But
        the same shortcut would give more than 100% for seven rolls, which
        cannot be right.

        :::fun
        In the 1650s a French gambler, the Chevalier de Méré, took puzzles
        like this one to the mathematician Blaise Pascal. Pascal's letters
        about them with Pierre de Fermat are usually counted as the birth
        of probability theory.
        :::
      `,
    },
    {
      id: 'simulate',
      type: 'interact',
      graded: false,
      title: 'Try it first',
      text: `
        Each round rolls four dice. The round is a win if at least one six shows.

        **Play at least 1000 rounds** and see where the share of wins settles.
      `,
      widget: {
        type: 'chance-lab', kind: 'dice-event', dice: 4, event: (faces) => faces.includes(6),
        labels: ['Win', 'No six'], trackLabel: 'wins', verb: 'Play', unit: 'rounds', one: 'round',
        bars: false, target: false, buttons: [1, 10, 100, 1000], max: 10000,
      },
      check: (s) => s.trials >= 1000 || `${commas(s.trials)} rounds so far. Keep going to 1000 so that the share has time to settle.`,
      solution: { trials: 1000 },
      explain: `
        A little over half: after 1000 rounds the share of wins is usually
        somewhere between 49% and 55%. Nowhere near 67%.

        To work the chance out exactly you need three small tools:
        **not**, **and**, **or**.
      `,
    },
    {
      id: 'teach-not',
      type: 'info',
      title: 'Tool 1: not',
      text: r`
        Either a thing happens or it does not. Between them, those two cover
        every outcome, so their probabilities add up to 1.

        :::key
        $P(\text{not } A) = 1 - P(A)$
        :::

        $A$ stands for any event. This is the **complement rule**. It looks
        too simple to matter, but it is about to do the heavy lifting.

        :::example
        A spinner stops on red with probability $\frac{1}{4}$, so
        $P(\text{not red}) = 1 - \frac{1}{4} = \frac{3}{4}$.
        In percentages: 25% red, so 75% not red.
        :::
      `,
      figure: NOT_BAR,
    },
    {
      id: 'not',
      type: 'fill',
      text: `
        A thing and its opposite share out the whole: 1, or 100%.

        **Fill in the blanks.**
      `,
      template: r`
        The chance of rain tomorrow is 30%, so the chance of no rain is [[70]]%.

        $P(\text{six}) = \frac{1}{6}$, so $P(\text{not a six}) =$ [[5/6;0.83;0.833;0.8333]].
      `,
      explain: r`
        Take the probability away from the whole: $100\% - 30\% = 70\%$, and
        $1 - \frac{1}{6} = \frac{5}{6}$. That is the complement rule,
        $P(\text{not } A) = 1 - P(A)$.
      `,
    },
    {
      id: 'and-grid',
      type: 'interact',
      title: 'Tool 2: and',
      text: `
        Roll two dice. **Tap every outcome in which both dice show a 5 or a 6.**
      `,
      widget: { type: 'dice-grid', show: 'pair', counter: 'Selected' },
      check: (s) => {
        const off = s.cells.find(([a, b]) => !BOTH_HIGH(a, b));
        if (off) {
          return ANY_HIGH(off[0], off[1])
            ? `In blue ${off[0]}, orange ${off[1]} only one die shows a 5 or 6. **Both** have to.`
            : `Blue ${off[0]}, orange ${off[1]}: neither die shows a 5 or 6 there.`;
        }
        if (s.count === 0) return 'Tap a cell to select it.';
        if (s.count < 4) return `${s.count} so far, all correct. There are more.`;
        return true;
      },
      solution: { on: diceWhere(BOTH_HIGH) },
      hints: ['The blue die shows 5 or 6 in the bottom two rows. Where in those rows does the orange die show 5 or 6 as well?'],
      explain: r`
        Only 4 of the 36 cells: the corner where the bottom two rows cross the
        last two columns.

        Each die shows a 5 or 6 with probability $\frac{2}{6} = \frac{1}{3}$.
        For both: 2 rows out of 6 **and** 2 columns out of 6, which is
        $2 \times 2$ cells out of $6 \times 6$:

        $$ \frac{1}{3} \times \frac{1}{3} = \frac{1}{9} $$
      `,
    },
    {
      id: 'multiply',
      type: 'info',
      title: 'Multiply for "and"',
      text: r`
        The two dice do not influence each other. Events like that are called
        **independent**, and for them:

        :::key
        $P(A \text{ and } B) = P(A) \times P(B)$
        :::

        The tree shows why. The blue die shows 5 or 6 one third of the time.
        In one third of *those* cases the orange die does too: a third of a third.

        :::example
        Heads on a coin **and** red on a spinner with 8 equal sections, one
        of them red: $\frac{1}{2} \times \frac{1}{8} = \frac{1}{16}$.

        With more events, keep multiplying. Three rolls of a die, all sixes:
        $\frac{1}{6} \times \frac{1}{6} \times \frac{1}{6} = \frac{1}{216}$.
        :::

        Flips, rolls and spins are independent. So are draws from a bag, as
        long as each marble is **put back** before the next draw.
      `,
      figure: treeFigure({
        titles: ['blue die', 'orange die'],
        first: [{ label: '5 or 6', p: '1/3' }, { label: '1 to 4', p: '2/3' }],
        second: [
          [{ label: '5 or 6', p: '1/3' }, { label: '1 to 4', p: '2/3' }],
          [{ label: '5 or 6', p: '1/3' }, { label: '1 to 4', p: '2/3' }],
        ],
        leaves: ['1/9', '2/9', '2/9', '4/9'],
        highlight: [0],
        alt: 'A probability tree. First the blue die: 5 or 6 with probability one third, 1 to 4 with probability two thirds. Then the orange die, with the same two branches. The path "5 or 6, then 5 or 6" has probability one ninth; the other three paths have two ninths, two ninths and four ninths.',
      }),
    },
    {
      id: 'and-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['coin-die', 'spinner', 'coins', 'bag']);
        let text;
        let parts;
        const wrong = [];
        if (kind === 'coin-die') {
          const v = rng.pick([
            { what: 'heads and a six', die: [1, 6] },
            { what: 'tails and an even number', die: [1, 2] },
            { what: 'heads and a number greater than 4', die: [1, 3] },
            { what: 'tails and a number less than 6', die: [5, 6] },
          ]);
          text = `You flip a coin and roll a die. What is the probability of getting **${v.what}**?`;
          parts = [[1, 2], v.die];
        } else if (kind === 'spinner') {
          const n = rng.pick([3, 4, 5]);
          text = `A spinner has ${n} equal sections, one of them red. You spin it twice. What is the probability that it stops on **red both times**?`;
          parts = [[1, n], [1, n]];
          wrong.push([1 / (2 * n), `Multiply ${n} by ${n}, not by 2: one in ${n}, and then one in ${n} of those.`]);
        } else if (kind === 'coins') {
          const k = rng.pick([3, 4, 5]);
          text = `You flip a fair coin ${k} times. What is the probability of getting **heads every time**?`;
          parts = Array.from({ length: k }, () => [1, 2]);
          wrong.push([1 / (2 * k), `That is 1 over 2 × ${k}. Multiply one half by itself ${k} times: the denominator doubles with every flip.`]);
        } else {
          const [red, total] = rng.pick([[2, 5], [1, 4], [3, 4], [2, 3], [3, 5], [1, 3]]);
          text = `A bag holds ${red} red and ${total - red} blue ${total - red === 1 ? 'marble' : 'marbles'}. You draw one marble, put it back, and draw again. What is the probability of drawing **red both times**?`;
          parts = [[red, total], [red, total]];
        }
        const n = parts.reduce((t, p) => t * p[0], 1);
        const d = parts.reduce((t, p) => t * p[1], 1);
        const sum = parts.reduce((t, p) => t + p[0] / p[1], 0);
        if (sum < 1) wrong.push([sum, 'You added. "And" asks for more things to go right, so the chance has to get *smaller*. Multiply instead.']);
        wrong.push([parts[0][0] / parts[0][1], 'That is the chance for just one of them. All of them have to happen.']);
        return {
          text: `${text} Give your answer as a fraction.`,
          answer: `${n}/${d}`,
          display: fracText(n, d),
          tolerance: 0.0005,
          wrong,
          feedback: nearMiss(n / d),
          hints: [
            'These events do not influence each other. What is the probability of each one on its own?',
            'For independent events, multiply the separate probabilities.',
          ],
          explain: r`The events are independent, so multiply: $${productTex(parts)}$.`,
        };
      },
    },
    {
      id: 'or-grid',
      type: 'interact',
      title: 'Tool 3: or',
      text: `
        Two dice again. **Tap every outcome in which at least one die shows a
        5 or a 6**: the blue one, the orange one, or both.
      `,
      widget: { type: 'dice-grid', show: 'pair', counter: 'Selected' },
      check: (s) => {
        const off = s.cells.find(([a, b]) => !ANY_HIGH(a, b));
        if (off) return `Blue ${off[0]}, orange ${off[1]}: neither die shows a 5 or 6 there.`;
        if (s.count === 0) return 'Tap a cell to select it. You can also drag across cells.';
        if (s.count === 20) return true;
        const blueOnly = s.cells.every(([a]) => HIGH(a));
        const orangeOnly = s.cells.every(([, b]) => HIGH(b));
        if (blueOnly && orangeOnly) return 'Those are outcomes where *both* dice show a 5 or 6. "Or" is more generous: one of them is enough.';
        if (blueOnly) return 'So far the blue die shows 5 or 6 in all your picks. Outcomes where only the orange die does count too.';
        if (orangeOnly) return 'So far the orange die shows 5 or 6 in all your picks. Outcomes where only the blue die does count too.';
        return `${s.count} so far, all correct. Keep going: there are more.`;
      },
      solution: { on: diceWhere(ANY_HIGH) },
      hints: ['Mark the two rows where the blue die shows 5 or 6. Then the two columns where the orange die does.'],
      explain: `
        Two whole rows (blue shows 5 or 6) and two whole columns (orange
        shows 5 or 6): 20 cells, not 24. The four corner cells lie in a row
        *and* in a column, but each is still only one outcome.
      `,
    },
    {
      id: 'or-rule',
      type: 'info',
      title: 'Add for "or", and count the overlap once',
      text: r`
        On the board, 12 cells have a blue 5 or 6 and 12 have an orange 5
        or 6. The 4 corner cells are in both lists, and adding 12 + 12
        would count them twice. So take them away once.

        $12 + 12 - 4 = 20$ cells, and $P = \frac{20}{36} = \frac{5}{9}$.

        :::key
        $P(A \text{ or } B) = P(A) + P(B) - P(A \text{ and } B)$
        :::

        In probability, "or" always includes "both".
      `,
      figure: {
        type: 'dice-grid', static: true, show: 'pair', cell: 44,
        tint: (a, b) => (BOTH_HIGH(a, b) ? 'violet' : HIGH(a) ? 'blue' : HIGH(b) ? 'orange' : null),
        legend: [
          { color: 'blue', label: 'only blue shows 5 or 6 (8)' },
          { color: 'orange', label: 'only orange shows 5 or 6 (8)' },
          { color: 'violet', label: 'both do (4)' },
        ],
        alt: 'The board of 36 outcomes. The bottom two rows and the last two columns are tinted. The four corner cells, where they overlap, have their own tint.',
      },
    },
    {
      id: 'example-or',
      type: 'info',
      title: 'The same rule, with cards',
      text: r`
        :::example
        Cards numbered 1 to 15. One is drawn. What is the chance of a
        multiple of 3 **or** a multiple of 5?

        1. Multiples of 3: 3, 6, 9, 12, 15. That is 5 cards.
        2. Multiples of 5: 5, 10, 15. That is 3 cards.
        3. In both lists: only 15. That is 1 card.

        So $5 + 3 - 1 = 7$ cards fit, and $P = \frac{7}{15}$.
        :::

        If two events **cannot happen together**, there is no overlap to
        take away and you simply add. A total of 2 or a total of 12 on two
        dice: $\frac{1}{36} + \frac{1}{36} = \frac{2}{36}$.
      `,
      figure: CARDS_15,
    },
    {
      id: 'or-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([12, 20, 24, 30]);
        const [a, b] = rng.pick([[2, 3], [2, 5], [3, 4], [3, 5], [2, 7]].filter(([x, y]) => lcm(x, y) <= n));
        const both = lcm(a, b);
        const countA = Math.floor(n / a);
        const countB = Math.floor(n / b);
        const countBoth = Math.floor(n / both);
        const count = countA + countB - countBoth;
        return {
          text: `
            Cards numbered **1 to ${n}** are shuffled and one is drawn at random.

            What is the probability that its number is a **multiple of ${a} or a multiple of ${b}**? Give your answer as a fraction.
          `,
          answer: `${count}/${n}`,
          display: fracText(count, n),
          tolerance: 0.0005,
          wrong: [
            [(countA + countB) / n, `That adds the ${countA} multiples of ${a} to the ${countB} multiples of ${b}. But ${countBoth === 1 ? `${both} is` : `numbers such as ${both} are`} in both lists and got counted twice.`],
            [countBoth / n, `That is the chance of a multiple of ${a} **and** of ${b}. For "or", one of the two is enough.`],
            [(countA + countB - 2 * countBoth) / n, 'A number that is a multiple of both still counts: "or" includes "both". Take the overlap away once, not twice.'],
          ],
          feedback: nearMiss(count / n),
          hints: [
            `How many of the numbers 1 to ${n} are multiples of ${a}? How many are multiples of ${b}?`,
            `Some numbers are in both lists: the multiples of ${both}. Count them only once.`,
          ],
          explain: r`
            Multiples of ${a}: ${countA}. Multiples of ${b}: ${countB}. In both lists
            (the multiples of ${both}): ${countBoth}. So $${countA} + ${countB} - ${countBoth} = ${count}$
            cards fit, and $P = ${rawFrac(count, n)}${fracText(count, n) !== `${count}/${n}` ? ` = ${frac(count, n)}` : ''}$.
          `,
        };
      },
    },
    {
      id: 'teach-at-least-one',
      type: 'info',
      title: '"At least one" is a "not" in disguise',
      text: r`
        "At least one" is awkward to count directly: exactly one, or two, or
        more. Its opposite is a single case: **none at all**. So find the
        chance of none, and take it away from 1.

        :::example
        A spinner has 10 equal sections, one of them gold. You spin twice.
        What is the chance of **at least one** gold?

        1. *Not:* one spin misses gold with probability $1 - \frac{1}{10} = \frac{9}{10}$.
        2. *And:* both spins miss with probability $\frac{9}{10} \times \frac{9}{10} = \frac{81}{100}$.
        3. *Not* again: $P(\text{at least one gold}) = 1 - \frac{81}{100} = \frac{19}{100}$.
        :::
      `,
    },
    {
      id: 'which-calc',
      type: 'choice',
      title: 'Back to the four rolls',
      text: `
        You now have every tool the opening puzzle needs: **at least one six
        in four rolls** of a die.

        Which calculation gives the right probability?
      `,
      options: [
        { text: r`$1 - \left(\frac{5}{6}\right)^4$`, correct: true },
        { text: r`$4 \times \frac{1}{6}$`, why: 'Adding the four chances counts every round with two or more sixes several times. For seven rolls this recipe would even give more than 1.' },
        { text: r`$\left(\frac{1}{6}\right)^4$`, why: 'That is the chance that **all four** rolls are sixes, which is far rarer than at least one.' },
        { text: r`$1 - \left(\frac{1}{6}\right)^4$`, why: 'That is the chance that the four rolls are **not all** sixes, which is almost certain.' },
      ],
      hints: [
        '"At least one six" is awkward to count directly: one six, or two, or three, or four. What is its *opposite*?',
        r`The opposite is "no six at all": not a six, and again, and again, and again. Each of those has probability $\frac{5}{6}$.`,
      ],
      explain: r`
        The opposite of "at least one six" is "**no** six in four rolls", and
        that is an *and* of four independent events:

        $$ P(\text{no six}) = \left(\frac{5}{6}\right)^4 = \frac{625}{1296} \approx 0.482 $$

        So $P(\text{at least one six}) \approx 1 - 0.482 = 0.518$: the 52%
        you saw in the simulation.
      `,
    },
    {
      id: 'at-least-one',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['coin', 'die', 'spinner']);
        let text;
        let miss;   // [numerator, denominator] of the chance that one try fails
        let tries;
        if (kind === 'coin') {
          tries = rng.int(2, 5);
          text = `You flip a fair coin ${tries} times. What is the probability of **at least one head**?`;
          miss = [1, 2];
        } else if (kind === 'die') {
          tries = rng.pick([2, 3]);
          text = `You roll a die ${tries === 2 ? 'twice' : 'three times'}. What is the probability of **at least one six**?`;
          miss = [5, 6];
        } else {
          const n = rng.pick([3, 4, 5]);
          tries = 2;
          text = `A spinner has ${n} equal sections, one of them red. You spin it twice. What is the probability that it stops on red **at least once**?`;
          miss = [n - 1, n];
        }
        const none = Math.pow(miss[0], tries);
        const all = Math.pow(miss[1], tries);
        const hit = miss[1] - miss[0];
        const answer = (all - none) / all;
        const wrong = [
          [none / all, 'That is the chance of **none at all**. Take it away from 1.'],
          [Math.pow(hit, tries) / all, 'That is the chance of success on **every** try, which is much rarer than at least one.'],
        ];
        if ((tries * hit) / miss[1] < 1) wrong.push([(tries * hit) / miss[1], 'Adding the chances counts the cases with two or more successes more than once. Go through the opposite event instead.']);
        return {
          text: `${text} Give your answer as a fraction.`,
          answer: `${all - none}/${all}`,
          display: fracText(all - none, all),
          tolerance: 0.0005,
          wrong,
          feedback: nearMiss(answer),
          hints: [
            'What is the opposite of "at least one"?',
            r`First find $P(\text{none})$ by multiplying, then subtract it from 1.`,
          ],
          explain: r`
            $P(\text{none}) = \left(${rawFrac(miss[0], miss[1])}\right)^{${tries}} = ${rawFrac(none, all)}$, so
            $P(\text{at least one}) = 1 - ${rawFrac(none, all)} = ${rawFrac(all - none, all)}$.
          `,
        };
      },
    },
    {
      id: 'de-mere',
      type: 'fill',
      stretch: true,
      title: "De Méré's other bet",
      text: `
        De Méré had a second bet: roll **two dice 24 times**, and win if a
        **double six** turns up at least once. By the gamblers' rule of thumb
        of his day it should have been just as good as the first bet. Check it.
      `,
      template: r`
        On one roll of two dice, $P(\text{double six}) = \frac{1}{36}$, so $P(\text{no double six}) =$ [[35/36;0.972;0.9722]].

        For no double six in 24 rolls, multiply that number by itself [[24]] times. The result is about 0.509.

        So the chance of at least one double six is about [[0.491;0.4914;0.49]].
      `,
      hints: [
        'Use the complement rule twice: once for a single roll, once at the very end.',
        r`The last blank is $1 - 0.509$.`,
      ],
      explain: r`
        $1 - \left(\frac{35}{36}\right)^{24} \approx 1 - 0.509 = 0.491$:
        slightly **worse** than even, while the first bet, at about 0.518, is
        slightly better. Two bets that look alike sit on opposite sides of
        one half.
      `,
    },
    {
      id: 'match',
      type: 'match',
      review: true,
      text: 'Match each situation with the way to work out its probability.',
      pairs: [
        ['A **and** B, when they are independent', r`$P(A) \times P(B)$`],
        ['A **or** B, when they cannot both happen', r`$P(A) + P(B)$`],
        ['A **or** B, when they can both happen', r`$P(A) + P(B) - P(\text{both})$`],
        ['**not** A', r`$1 - P(A)$`],
        ['**at least one** success in several tries', r`$1 - P(\text{none})$`],
      ],
      explain: `
        Multiply for *and* (when the events are independent). Add for *or*,
        taking away any overlap. Subtract from 1 for *not*. And "at least
        one" is a *not* in disguise.
      `,
    },
  ],
  recap: [
    r`**Not:** $P(\text{not } A) = 1 - P(A)$.`,
    '**And**, for independent events: multiply the probabilities.',
    '**Or:** add the probabilities, then take away the overlap so that nothing is counted twice.',
    '"At least one" is easiest through its opposite: 1 − P(none).',
  ],
  next: 'Next: what happens to a probability when you learn something new?',
};
