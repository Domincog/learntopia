// The Secret Life of Numbers · Lesson 2 · The Atoms of Arithmetic
import { r } from '../../../kit.js';
import { isPrime, primeFactors, primesUpTo, productTex, listAnd } from '../helpers.js';

const ODD_PRIMES = primesUpTo(97).filter((p) => p > 2);
/** Odd composites that look prime at first glance. */
const SNEAKY = [9, 15, 21, 27, 33, 39, 49, 51, 57, 63, 77, 87, 91, 93];
/** Four neighbours, exactly one of them prime. */
const ONE_PRIME = [
  [51, 53, 55, 57],
  [77, 79, 81, 85],
  [87, 91, 93, 97],
  [111, 113, 117, 119],
  [121, 123, 127, 129],
  [133, 135, 137, 141],
  [143, 145, 147, 149],
  [161, 163, 165, 169],
];
/** Numbers with three or four small prime factors, for factorising by hand. */
const TO_FACTORISE = [30, 42, 66, 70, 78, 84, 90, 105, 110, 126, 132, 140, 150, 154, 165, 198, 210, 220, 231, 294, 330];

/** One way to split a composite number, as TeX. Multiples of 5 are split at the 5, since the last digit gives that away. */
const splitTex = (c) => {
  const p = c % 5 === 0 && c > 25 ? 5 : primeFactors(c)[0];
  return `${c} = ${p} \\times ${c / p}`;
};
const TREE_60 = [[60, 6, 10], [6, 2, 3], [10, 2, 5]];

export default {
  id: 'primes',
  steps: [
    {
      id: 'stubborn',
      type: 'interact',
      graded: false,
      title: 'Stubborn numbers',
      text: `
        Some numbers of dots make lots of rectangles. Others refuse.

        Pick a number of dots between 20 and 30, then try every number of rows.
        **Find a number whose only "rectangle" is a single line**: one row, or one dot per row.
      `,
      widget: { type: 'dot-rectangles', n: 24, rows: 4, nRange: [20, 30] },
      check: (s) => {
        if (s.factors.length === 2) return true;
        const f = s.factors[1];
        return `${s.n} is not stubborn: it makes ${f} rows of ${s.n / f}. Try a different number of dots.`;
      },
      solution: { n: 23, rows: 1 },
      attempts: 6,
      hints: ['Even numbers always make 2 equal rows, so try an odd one.', 'Careful with 21, 25 and 27: each hides a rectangle 3 or 5 rows tall.'],
      explain: `
        Between 20 and 30, only **23** and **29** are this stubborn. However you deal the dots, some are left over,
        unless you settle for a single line.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Primes and composites',
      text: r`
        A whole number greater than 1 is **prime** if its only factors are 1 and itself. Its dots make a line and nothing else.

        Every other whole number greater than 1 is **composite**: it can be *composed* by multiplying two smaller numbers, like $6 = 2 \times 3$.

        The smallest prime is 2, and it is the only even one: every bigger even number has 2 as a factor.

        And 1? It has only one factor, so it is neither. You will soon see why it is left out on purpose.
      `,
      figure: [
        { type: 'dot-rectangles', n: 7, rows: 1, static: true, maxWidth: 400, caption: '7 is prime: a line is the best it can do.', alt: 'Seven dots in a single row.' },
        { type: 'dot-rectangles', n: 6, rows: 2, static: true, maxWidth: 400, caption: '6 is composite: 2 rows of 3.', alt: 'Six dots in two rows of three.' },
      ],
    },
    {
      id: 'sieve',
      type: 'interact',
      title: 'Catch them all',
      text: `
        More than 2,200 years ago the Greek scholar Eratosthenes found a way to catch *every* prime at once: a sieve.

        **Tap the smallest number that is not crossed out.** It is prime, and all its bigger multiples get crossed out.
        Repeat until tapping changes nothing.
      `,
      widget: { type: 'prime-sieve', n: 100 },
      check: (s) => {
        if (s.complete) return true;
        if (!s.sieved.length) return 'Start with 2: tap it and watch its multiples go.';
        const next = s.standing.find((k) => !s.sieved.includes(k));
        const left = s.standing.find((k) => !isPrime(k));
        return `Some composite numbers are still standing (${left}, for one). Carry on with ${next}.`;
      },
      solution: { sieved: [2, 3, 5, 7] },
      attempts: 6,
      hints: ['Tap 2 first. The next number still standing is 3, then 5.', 'After 7, tap 11 and see whether anything new gets crossed out.'],
      explain: r`
        Four primes did all the work: **2, 3, 5 and 7**. Everything still standing is prime, which makes **25 primes below 100**.

        Sieving with 11 changes nothing: $22, 33, 44, \dots$ had already been crossed out by smaller primes.
      `,
    },
    {
      id: 'why-stop',
      type: 'choice',
      text: 'To sieve the numbers up to 100, the primes 2, 3, 5 and 7 were enough. **Why did 11 have nothing left to do?**',
      options: [
        { text: r`Every multiple of 11 up to 100 had a smaller prime factor too. The first one that does not is $11 \times 11 = 121$`, correct: true },
        { text: '11 has no multiples below 100', why: '22, 33, 44 … are all below 100. They had simply been crossed out already, by 2 or 3.' },
        { text: 'Primes bigger than 10 do not have multiples', why: 'Every number has multiples: 11, 22, 33 … The question is why those were already gone.' },
        { text: 'A sieve only ever needs one-digit primes', why: 'On a board up to 200 you would need 11 and 13 as well. The cut-off depends on where the board ends.' },
      ],
      explain: r`
        A composite number is a product of two smaller numbers. They cannot *both* be bigger than 10, or the product would be more than $10 \times 10 = 100$.

        So every composite number up to 100 has a factor of 10 or less, and therefore one of the prime factors 2, 3, 5 or 7.
      `,
    },
    {
      id: 'teach-prime-test',
      type: 'info',
      title: 'Testing one number',
      text: r`
        The sieve's lesson works for a single number too. To test whether it is prime, hunt for a prime that divides it: try 2, 3, 5, 7, 11 … in turn.

        You can stop early. Two factors that multiply to your number cannot both be big, so stop as soon as the prime **times itself** is more than the number. (That turning point is called the number's **square root**: for 103 it is a little over 10.)

        :::example Is 103 prime?
        - **2?** No: 103 is odd.
        - **3?** No: the digit sum is $1 + 0 + 3 = 4$.
        - **5?** No: the last digit is 3.
        - **7?** No: $103 = 7 \times 14 + 5$.
        - **11?** No need: $11 \times 11 = 121$ is more than 103.

        No prime divides it, so **103 is prime**.
        :::

        Most composites are caught early: 69 has digit sum 15, so $69 = 3 \times 23$.
      `,
    },
    {
      id: 'spot-primes',
      type: 'multi',
      review: true,
      gen: (rng) => {
        const primes = rng.sample(ODD_PRIMES, rng.int(2, 3));
        if (rng.bool(0.35)) primes[0] = 2;
        const composites = rng.sample(SNEAKY, 3);
        const withOne = rng.bool(0.35);
        const options = [
          ...primes.map((p) => ({ value: p, correct: true })),
          ...composites.map((c) => ({ value: c, why: `$${splitTex(c)}$, so ${c} is composite.` })),
          ...(withOne ? [{ value: 1, why: '1 is not prime. A prime has exactly two factors, and 1 has only one.' }] : []),
        ].sort((p, q) => p.value - q.value).map(({ value, ...rest }) => ({ text: String(value), ...rest }));
        const sortedPrimes = primes.slice().sort((p, q) => p - q);
        return {
          text: 'Which of these numbers are **prime**?',
          shuffle: false,
          options,
          hints: ['For each number, hunt for a factor other than 1 and itself. The digit-sum test finds multiples of 3 quickly.', 'If 3 does not work, try 7.'],
          explain: `
            Prime: **${listAnd(sortedPrimes)}**.${sortedPrimes[0] === 2 ? ' (2 is the only even prime.)' : ''}
            The others split into smaller factors: ${composites.slice().sort((p, q) => p - q).map((c) => `$${splitTex(c)}$`).join(', ')}.
            ${withOne ? 'And 1 is neither prime nor composite: it has only one factor.' : ''}
          `,
        };
      },
    },
    {
      id: 'find-prime',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const set = rng.pick(ONE_PRIME);
        const prime = set.find(isPrime);
        const tested = primesUpTo(Math.floor(Math.sqrt(prime)));
        return {
          text: 'Exactly one of these numbers is prime. **Which one?**',
          shuffle: false,
          options: set.map((v) => (v === prime ? { text: String(v), correct: true } : { text: String(v), why: `$${splitTex(v)}$.` })),
          hints: [
            'Rule out the easy ones first: the digit sum catches multiples of 3, the last digit catches multiples of 5.',
            'For whatever is left, try dividing by 7, 11 and 13.',
          ],
          explain: `
            **${prime}** is prime: none of ${listAnd(tested)} divides it, and there is no need to test beyond its square root (about ${Math.sqrt(prime).toFixed(1)}).
            The others split: ${set.filter((v) => v !== prime).map((v) => `$${splitTex(v)}$`).join(', ')}.
          `,
        };
      },
    },
    {
      id: 'tree',
      type: 'interact',
      title: 'Splitting numbers',
      text: r`
        A composite number can be broken into smaller factors, and those can often be broken again.

        Here is 60. **Keep splitting until every branch ends in a prime.** Choose whichever factor pairs you like.
      `,
      widget: { type: 'factor-tree', n: 60 },
      check: (s) => {
        if (s.complete) return true;
        if (!s.count) return 'Choose one of the factor pairs to make the first split.';
        return `Not finished: ${s.leaves.find((v) => !isPrime(v))} is not prime, so it can still be split.`;
      },
      solution: { splits: TREE_60 },
      attempts: 6,
      hints: ['Blue squares can still be split. Orange circles are prime: they are finished.'],
      explain: r`
        Every branch of your tree ends in a prime, and together they multiply back to 60:

        $$ 60 = 2 \times 2 \times 3 \times 5 $$
      `,
    },
    {
      id: 'tree-again',
      type: 'interact',
      title: 'A different route',
      text: r`
        Here is one finished tree for 60. It starts with $6 \times 10$.

        **Build another tree for 60 that starts with a different split.** Then compare the primes at the ends of the branches.
      `,
      figure: {
        type: 'factor-tree', n: 60, splits: TREE_60, static: true, equation: false, maxWidth: 380,
        alt: 'A factor tree. 60 splits into 6 and 10. 6 splits into 2 and 3. 10 splits into 2 and 5.',
      },
      widget: { type: 'factor-tree', n: 60 },
      check: (s) => {
        if (s.first && s.first[0] === 6) return 'That starts with 6 × 10, just like the picture. Press "Start again" and choose a different first split.';
        if (!s.count) return 'Choose a first split other than 6 × 10.';
        if (!s.complete) return `Not finished: ${s.leaves.find((v) => !isPrime(v))} can still be split.`;
        return true;
      },
      solution: { splits: [[60, 2, 30], [30, 2, 15], [15, 3, 5]] },
      attempts: 6,
      explain: `
        A different route, the same destination: **2, 2, 3 and 5** again.

        Try as many routes as you like. The shape of the tree changes; the primes at the ends never do.
      `,
    },
    {
      id: 'unique',
      type: 'info',
      title: 'The atoms of arithmetic',
      text: r`
        You have just met one of the most important facts in mathematics, the *fundamental theorem of arithmetic*:

        :::key
        Every whole number greater than 1 is a product of primes **in exactly one way** (apart from the order).
        :::

        60 is $2 \times 2 \times 3 \times 5$ and can never be anything else. Primes are the atoms that all whole numbers are built from, and every number has its own recipe.

        This is also why 1 is not counted as a prime. If it were, $60 = 1 \times 2 \times 2 \times 3 \times 5 = 1 \times 1 \times 2 \times 2 \times 3 \times 5 \dots$ and the recipe would no longer be unique.
      `,
    },
    {
      id: 'example-factorise',
      type: 'info',
      title: 'Worked example: 156 into primes',
      text: r`
        You do not need the tree to find a number's primes. Peel off the **smallest prime that divides**, then do the same to what is left.

        :::example Write 156 as a product of primes
        - 156 is even: $156 = 2 \times 78$
        - 78 is even: $78 = 2 \times 39$
        - 39 is odd, but its digit sum is 12: $39 = 3 \times 13$
        - 13 is prime, so stop.

        $$ 156 = 2 \times 2 \times 3 \times 13 $$
        :::

        The last digit and the digit sum settle 2, 3 and 5 at a glance. For 7 and beyond, try the division.
      `,
      figure: {
        type: 'factor-tree', n: 156, splits: [[156, 2, 78], [78, 2, 39], [39, 3, 13]], static: true, equation: false, maxWidth: 340,
        alt: 'A factor tree. 156 splits into 2 and 78. 78 splits into 2 and 39. 39 splits into 3 and 13. The branches end in the primes 2, 2, 3 and 13.',
      },
    },
    {
      id: 'factorise',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const n = rng.pick(TO_FACTORISE);
        const fs = primeFactors(n);
        const lines = [];
        let rest = n;
        for (const p of fs.slice(0, -1)) {
          lines.push(`$${rest} = ${p} \\times ${rest / p}$`);
          rest /= p;
        }
        return {
          text: `Write **${n}** as a product of primes. Put the primes in order, smallest first.`,
          template: `$${n} =$ ${fs.map((p) => `[[${p}]]`).join(' $\\times$ ')}`,
          hints: [
            `Divide out the smallest prime that works, then do the same to what is left. Is ${n} even? If not, try 3.`,
            `${lines[0]}. Now break down ${n / fs[0]}.`,
          ],
          explain: `
            Peel off the smallest prime each time: ${lines.join(', then ')}.

            Altogether $${n} = ${productTex(fs)}$. No other list of primes multiplies to ${n}.
          `,
        };
      },
    },
    {
      id: 'forever',
      type: 'choice',
      mode: 'predict',
      title: 'Do they run out?',
      text: `
        Primes thin out as numbers grow. There are 25 of them below 100, but only 21 between 100 and 200,
        and just 16 between 1,000 and 1,100.

        **Do they eventually stop?** Is there a biggest prime of all?
      `,
      shuffle: false,
      options: [
        { text: 'Yes: somewhere there is a last prime' },
        { text: 'No: there are always more', correct: true },
        { text: 'Nobody knows' },
      ],
      explain: `
        They never stop. Euclid proved it about 2,300 years ago, with an argument so short that you are about to do it yourself.

        (People still hunt for record-breakers. The largest prime known in 2024 had more than 41 million digits.)
      `,
    },
    {
      id: 'euclid-remainders',
      type: 'fill',
      title: "Euclid's trick",
      text: r`
        Suppose a friend claims that the **only** primes are 2, 3 and 5.

        Multiply the whole list together and add 1:

        $$ 2 \times 3 \times 5 + 1 = 31 $$

        Now divide 31 by each prime on the list. What is left over?
      `,
      template: r`
        $31 \div 2$ leaves remainder [[1]]

        $31 \div 3$ leaves remainder [[1]]

        $31 \div 5$ leaves remainder [[1]]
      `,
      hints: [r`$31 = 2 \times 15 + \;?$`, '30 is a multiple of 2, of 3 and of 5. And 31 is one more than 30.'],
      explain: r`
        Always 1. That is no accident: 30 is a multiple of 2, of 3 and of 5, and 31 is one more than 30.

        So **none of the primes on the list divides 31**.
      `,
    },
    {
      id: 'teach-euclid-proof',
      type: 'info',
      title: 'The list is never complete',
      text: r`
        Yet 31 must have a prime factor. Every whole number greater than 1 does: it is prime itself, or it splits into primes. That prime factor is not on the friend's list, so the list was not complete. (Here the missing prime is 31 itself.)

        The same trick defeats **any** list of primes. Multiply them all together and add 1. Every prime on the list leaves remainder 1, so none of them divides the new number, and its prime factors must be new ones.

        :::key
        Whatever list of primes you start from, at least one prime is missing. So the primes never end.
        :::
      `,
    },
    {
      id: 'euclid-conclusion',
      type: 'choice',
      review: true,
      text: r`
        Take a list of primes, multiply them all together and add 1:

        $$ N = 2 \times 3 \times 5 \times 7 + 1 = 211 $$

        Dividing $N$ by any prime on the list leaves remainder 1. **What does that prove?**
      `,
      options: [
        { text: r`$N$ is either prime itself or has a prime factor that is missing from the list. Either way, the list is incomplete`, correct: true },
        { text: r`$N$ must be prime`, why: r`Not necessarily. $2 \times 3 \times 5 \times 7 \times 11 \times 13 + 1 = 30031 = 59 \times 509$ is not prime. Its prime factors, though, are missing from the list.` },
        { text: r`$N$ has no prime factors at all`, why: r`Every whole number greater than 1 is prime or splits into primes. $N$ has prime factors; they are just not on the list.` },
        { text: r`The list contains every prime below $N$`, why: 'The opposite: the argument shows that at least one prime is missing from the list.' },
      ],
      hints: ['Every whole number greater than 1 has at least one prime factor. Can any prime factor of $N$ be on the list?'],
      explain: r`
        Every number greater than 1 has a prime factor. The prime factors of $N$ cannot be on the list, because everything on the list leaves remainder 1.
        So some prime is missing.

        This works for **any** finite list of primes, so no finite list can ever be complete: the primes go on forever.

        Notice what the argument does *not* say: $N$ need not be prime. Here $211$ happens to be, but $2 \times 3 \times 5 \times 7 \times 11 \times 13 + 1 = 30031 = 59 \times 509$.
      `,
    },
  ],
  recap: [
    'A **prime** has exactly two factors, 1 and itself. A **composite** number splits into smaller factors. 1 is neither.',
    'To find all primes up to a limit, sieve with the primes up to its square root.',
    'Every whole number greater than 1 is a product of primes **in exactly one way**.',
    'Multiply any list of primes and add 1: the result has a prime factor that is not on the list. So the primes never end.',
  ],
  next: 'Next: the biggest number that divides two others, and a 2,300-year-old shortcut for finding it.',
};
