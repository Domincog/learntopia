// The Secret Life of Numbers · Lesson 6 · Powers That Come Home
import { r } from '../../../kit.js';
import { powMod, powerChain } from '../helpers.js';

export default {
  id: 'power-cycles',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'An impossibly big number',
      text: r`
        The number $7^{100}$ has 85 digits. Nobody is going to write it out.

        **What is its last digit?**
      `,
      options: [
        { text: '1', correct: true },
        { text: '3' },
        { text: '7' },
        { text: '9' },
        { text: 'There is no way to know without working out the whole number' },
      ],
      explain: r`
        It ends in **1**, and you are about to see why without ever meeting the other 84 digits.
        The last digit of a number is its remainder mod 10, and remainders of powers go round in circles.
      `,
    },
    {
      id: 'teach-powers',
      type: 'info',
      title: 'What a power is',
      text: r`
        $7^3$ is a **power** of 7: three 7s multiplied together. The small raised number, the **exponent**, counts them.

        | Power | Meaning | Value |
        |:------|:--------|------:|
        | $7^1$ | $7$ | 7 |
        | $7^2$ | $7 \times 7$ | 49 |
        | $7^3$ | $7 \times 7 \times 7$ | 343 |

        To get from one power to the next, multiply by 7 once more. So $7^{100}$ is a hundred 7s multiplied together: far too big to write out.

        The **last digit** of a number is its remainder mod 10. For example, $343 \bmod 10 = 3$.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      title: 'Round the dial',
      text: r`
        This dial has 10 places, one for each possible last digit. The marker starts on 1 and
        is **multiplied by 7** at every step. Only the last digit is kept.

        **Raise the power one step at a time until the marker is back on 1.**
      `,
      widget: { type: 'power-cycle', m: 10, base: 7, max: 12, alt: 'A dial with ten places. A marker starts on 1 and is multiplied by 7 at each step, keeping only the last digit.' },
      check: (s) => {
        if (s.home) return true;
        return s.n === 0 ? 'Move the "power" slider one step to the right, and watch where the marker goes.' : 'Not back on 1 yet. Keep raising the power.';
      },
      solution: { n: 4 },
      explain: r`
        The last digits go **7, 9, 3, 1** and then start again: every fourth power of 7 ends in 1.

        And $100 = 25 \times 4$, so $7^{100}$ is exactly 25 times round the loop. It ends in 1.
      `,
    },
    {
      id: 'method',
      type: 'info',
      title: 'Multiply, reduce, repeat',
      text: r`
        The dial never showed you a big number. It used the rule from two lessons ago, that you may
        reduce before you multiply: to go from one power to the next it multiplied by 7 and
        **kept only the remainder**.

        | Power | Multiply by 7 | Keep (mod 10) |
        |:------|:--------------|:-------------:|
        | $7^1$ | | 7 |
        | $7^2$ | $7 \times 7 = 49$ | 9 |
        | $7^3$ | $9 \times 7 = 63$ | 3 |
        | $7^4$ | $3 \times 7 = 21$ | 1 |

        :::key
        To find $a^n \bmod m$, never work out $a^n$. Multiply by $a$, reduce, and repeat.
        :::

        :::example The same on a 5-clock
        $3 \times 3 = 9$, and $9 \bmod 5 = 4$. Then $4 \times 3 = 12$, and $12 \bmod 5 = 2$. So $3^3 \bmod 5 = 2$.
        :::
      `,
    },
    {
      id: 'small-power',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.pick([7, 9, 11]);
        const a = rng.pick([2, 3, 4, 5, 6].filter((x) => x % m !== 0 && !(m === 9 && x % 3 === 0)));
        const n = rng.pick([3, 4, 5]);
        const chain = powerChain(a, n, m);
        const answer = chain[n - 1];
        return {
          text: r`
            Work out $${a}^{${n}} \bmod ${m}$.

            Go one step at a time, and throw away multiples of ${m} as you go.
          `,
          answer,
          wrong: [
            [(a * n) % m, r`That multiplies ${a} by ${n}. A power means multiplying ${a} by *itself*, ${n} times over.`],
            [Math.pow(a, n), r`That is $${a}^{${n}}$ itself. The question asks for its remainder on division by ${m}.`],
          ].filter(([v], i, all) => v !== answer && all.findIndex(([u]) => u === v) === i),
          hints: [r`Start with ${a}. Multiply by ${a} and reduce mod ${m}: you get ${chain[1]}. Carry on from there.`],
          explain: r`Step by step on the ${m}-clock: $${chain.join(r` \to `)}$. So $${a}^{${n}} \bmod ${m} = ${answer}$.`,
        };
      },
    },
    {
      id: 'visit-all',
      type: 'interact',
      title: 'Which base goes everywhere?',
      text: r`
        Now a clock with **7** places. The powers of 2 only ever land on 1, 2 and 4: they come
        home after three steps and miss the rest.

        **Find a base whose powers land on all six places from 1 to 6.**
      `,
      widget: { type: 'power-cycle', m: 7, base: 2, baseRange: [2, 6], max: 12, n: 3, alt: 'A dial with seven places. Sliders choose the base and the power.' },
      check: (s) => {
        if (s.count >= 6) return true;
        if (s.period && s.period < 6) return `The powers of ${s.base} come home after ${s.period} steps, so they reach only ${s.period} places. Try another base.`;
        return 'This base has not come home yet. Keep raising the power.';
      },
      solution: { base: 3, n: 6 },
      hints: ['Set a base, then slide the power all the way up and count the places it visits.'],
      explain: r`
        The bases 3 and 5 visit all six places. The others come home early: 2 and 4 after
        three steps, 6 after two.

        Look at those cycle lengths: 6, 3 and 2. **Every one of them divides 6.** That is
        no accident.
      `,
    },
    {
      id: 'sixth-power',
      type: 'numeric',
      text: r`
        A cycle of length 2, 3 or 6 always fits a whole number of times into 6 steps. So on the
        7-clock, *every* base should be back on 1 at the sixth power.

        Check it for the base 5. **What is $5^6 \bmod 7$?**
      `,
      figure: { type: 'power-cycle', m: 7, base: 5, max: 6, alt: 'A dial with seven places, set up for powers of 5.' },
      answer: 1,
      wrong: [
        [2, r`$5 \times 6 = 30$, and $30 \bmod 7 = 2$. But that is 5 *times* 6. Use the dial for $5^6$.`],
        [6, r`That is $5^3 \bmod 7$. Three more steps to go.`],
      ],
      hints: [r`Step the dial up to power 6, or work it out: $5 \to 4 \to 6 \to 2 \to 3 \to \;?$`],
      explain: r`$5^6 \bmod 7 = 1$. The same is true of $1^6, 2^6, 3^6, 4^6$ and $6^6$: on the 7-clock, the sixth power of every place from 1 to 6 is 1.`,
    },
    {
      id: 'fermat',
      type: 'info',
      title: 'Fermat\'s little theorem',
      text: r`
        Nothing was special about 7 except that it is **prime**. The same thing happens on every
        prime clock, with the power one less than the size of the clock.

        :::key
        If $p$ is prime and $a$ is not a multiple of $p$, then
        $$ a^{\,p-1} \bmod p = 1 $$
        :::

        On the 11-clock every tenth power is 1. On the 101-clock every hundredth power is 1.

        Pierre de Fermat stated this in a letter in 1640, without giving a proof. It is called
        his *little* theorem to tell it apart from his famous "last" one, and it is the engine
        inside the code you will build in the next lesson.
      `,
    },
    {
      id: 'example-fermat',
      type: 'info',
      title: 'Worked example: skip the full laps',
      text: r`
        The theorem turns a huge power into a small one. On a prime clock with $p$ places the powers are back on 1
        every $p - 1$ steps, so whole laps of $p - 1$ steps can be thrown away.

        :::example Find $5^{20} \bmod 7$
        - 7 is prime and 5 is not a multiple of 7, so $5^6 \bmod 7 = 1$.
        - $20 = 3 \times 6 + 2$: three full laps of 6 steps, then 2 steps more.
        - Each lap ends on 1, so only the last 2 steps count: $5^2 = 25$, and $25 \bmod 7 = 4$.

        So $5^{20} \bmod 7 = 4$.
        :::

        Divide the exponent by $p - 1$, not by $p$. If nothing is left over, the answer is 1.
      `,
    },
    {
      id: 'fermat-use',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const p = rng.pick([5, 7, 11, 13]);
        const a = rng.pick([2, 3]);
        const laps = rng.int(3, 12);
        const extra = rng.pick([0, 1, 2, 3].filter((x) => x < p - 1));
        const power = (p - 1) * laps + extra;
        const answer = powMod(a, extra, p);
        return {
          text: r`
            Use Fermat's little theorem to find
            $$ ${a}^{${power}} \bmod ${p} $$
          `,
          answer,
          wrong: [
            [powMod(a, power % p, p), r`You reduced the exponent mod ${p}. The powers come home every $${p} - 1 = ${p - 1}$ steps, so reduce the exponent mod ${p - 1}.`],
            [0, r`A power of ${a} is never a multiple of ${p}, so the remainder cannot be 0.`],
          ].filter(([v], i, all) => v !== answer && all.findIndex(([u]) => u === v) === i),
          hints: [
            r`Every ${p - 1} steps the powers of ${a} are back on 1. How many steps are left over when ${power} is divided by ${p - 1}?`,
            extra === 0
              ? r`$${power} = ${laps} \times ${p - 1}$ exactly, so no steps are left over.`
              : r`$${power} = ${laps} \times ${p - 1} + ${extra}$, so only the last ${extra === 1 ? 'step counts' : `${extra} steps count`}.`,
          ],
          explain: extra === 0
            ? r`$${power} = ${laps} \times ${p - 1}$: a whole number of laps, so the answer is 1.`
            : r`$${power} = ${laps} \times ${p - 1} + ${extra}$. The ${laps} full laps each give 1, so only $${a}^{${extra}} \bmod ${p} = ${answer}$ is left.`,
        };
      },
    },
    {
      id: 'not-prime',
      type: 'choice',
      title: 'A test for primes',
      text: r`
        The theorem promises a 1 whenever the clock size is prime. A computer works out
        $$ 2^{90} \bmod 91 = 64 $$

        **What does that tell you about 91?**
      `,
      options: [
        { text: '91 is not prime', correct: true },
        { text: '91 is prime', why: 'If 91 were prime, Fermat\'s theorem would force the answer to be 1.' },
        { text: 'Nothing: the theorem only works for small numbers', why: 'The theorem holds for every prime, however large. That is what makes it useful.' },
        { text: '2 must be a multiple of 91', why: '2 is far smaller than 91, so it cannot be a multiple of it.' },
      ],
      explain: r`
        If 91 were prime the answer would have to be 1. It is not, so 91 cannot be prime
        (it is $7 \times 13$). Notice that the test proved this **without finding a factor**.

        This is how computers check 300-digit numbers. An answer other than 1 settles it: not
        prime. An answer of 1 is strong evidence of a prime but not proof, because a few
        impostors slip through, so real tests use a slightly sharper version of the same idea.
      `,
    },
    {
      id: 'squaring',
      type: 'fill',
      title: 'Powers in a hurry',
      text: r`
        Finding $3^{16} \bmod 7$ one step at a time takes 15 multiplications. There is a much
        shorter way: **keep squaring**.

        To square a number is to multiply it by itself. Squaring a power doubles its exponent:
        $3^2 \times 3^2$ is four 3s multiplied together, which is $3^4$.
      `,
      template: r`
        $3^2 = 9$, which is [[2]] on the 7-clock.

        $3^4 = (3^2)^2$, so square that: [[4]].

        $3^8 = (3^4)^2$: sixteen, which is [[2]] on the 7-clock.

        $3^{16} = (3^8)^2$, which is [[4]].
      `,
      hints: ['Each line squares the answer of the line before, then reduces mod 7.'],
      explain: r`
        Four squarings instead of fifteen multiplications: $3 \to 2 \to 4 \to 2 \to 4$. Each
        squaring **doubles** the exponent.
      `,
    },
    {
      id: 'count-squarings',
      type: 'numeric',
      text: r`
        Squaring doubles the exponent each time: $a^2,\ a^4,\ a^8,\ a^{16} \ldots$

        **How many squarings does it take to get from $a$ to $a^{1024}$?**
      `,
      answer: 10,
      wrong: [
        [1023, 'That is the number of multiplications if you go up one step at a time. Squaring doubles the exponent with each step.'],
        [512, r`You halved 1024 once. Keep halving until you reach 1, and count the steps.`],
        [1024, 'That would be one step per unit of the exponent. Each squaring doubles it.'],
      ],
      hints: [r`$2, 4, 8, 16, 32 \ldots$ Count the doublings up to 1024.`],
      explain: r`
        $1024 = 2^{10}$, so ten squarings. A power with a thousand digits in its exponent needs
        only a few thousand steps, which a computer does in a blink.

        Hold on to that: **huge powers on a clock are easy to work out.** The next lesson
        depends on it.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: r`To find $a^n \bmod m$ you can reduce mod $m$ after every multiplication`, correct: true },
        { text: r`On a clock with a prime number $p$ of places, $a^{p-1}$ lands on 1 (unless $a$ is a multiple of $p$)`, correct: true },
        { text: r`If $n$ is odd and $2^{n-1} \bmod n$ is not 1, then $n$ is certainly not prime`, correct: true },
        { text: r`To know the last digit of $7^{100}$ you have to work out all of its digits`, why: 'Only the last digit matters at each step, and the last digits repeat every four powers.' },
        { text: r`Working out $a^{1024}$ takes about a thousand multiplications, whatever you do`, why: 'Repeated squaring gets there in ten.' },
      ],
      explain: 'Powers on a clock go round in cycles, primes make those cycles predictable, and squaring makes even enormous powers quick to compute.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A friend asks for the last digit of $3^{2025}$ and reaches for a calculator, which
        promptly gives up.

        **Explain how to find it by hand.**
      `,
      model: r`
        Only last digits matter. The powers of 3 end in 3, 9, 7, 1 and then repeat, so every
        fourth power ends in 1.

        $2025 = 4 \times 506 + 1$: that is 506 full laps and one step more. So $3^{2025}$ ends
        in the same digit as $3^1$, which is **3**.
      `,
    },
  ],
  recap: [
    'Powers on a clock go round in a cycle: multiply, reduce, repeat.',
    '**Fermat\'s little theorem:** if $p$ is prime and $a$ is not a multiple of $p$, then $a^{p-1} \\bmod p = 1$.',
    'A number that fails that test is certainly not prime, even if no factor is known.',
    'Repeated squaring makes enormous powers quick to compute.',
  ],
  next: 'Next: use all of this to build a lock that anyone can close and only you can open.',
};
