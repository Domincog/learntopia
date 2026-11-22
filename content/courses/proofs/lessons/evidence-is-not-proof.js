// Proofs: How to Be Certain · Lesson 1 · Evidence Is Not Proof
import { r } from '../../../kit.js';

/**
 * Claims about "every" number that are false. Each has numbers that break it (`counter`),
 * numbers that fit it (`fits`) and, for most, numbers it says nothing about (`other`).
 */
const FALSE_CLAIMS = [
  {
    claim: 'Every odd number greater than 1 is prime.',
    counter: [9, 15, 21, 25], fits: [3, 5, 7, 11, 13, 17, 19, 23], other: [4, 8, 10, 14],
    whyCounter: (v) => `${v} is odd and greater than 1, yet $${v} = ${v % 3 === 0 ? `3 \\times ${v / 3}` : '5 \\times 5'}$ is not prime.`,
    whyFit: (v) => `${v} is odd and it is prime. It fits the claim.`,
    whyOther: (v) => `${v} is even, and the claim is only about odd numbers. It says nothing about ${v}.`,
  },
  {
    claim: 'Every prime number is odd.',
    counter: [2], fits: [3, 5, 7, 11, 13, 17, 19, 23], other: [9, 15, 21, 25],
    whyCounter: () => '2 is prime, and it is even.',
    whyFit: (v) => `${v} is prime and odd. It fits the claim.`,
    whyOther: (v) => `${v} is not prime, and the claim is only about primes. It says nothing about ${v}.`,
  },
  {
    claim: 'Every whole number that ends in 3 is prime.',
    counter: [33, 63, 93], fits: [3, 13, 23, 43, 53, 73, 83], other: [9, 15, 21, 25],
    whyCounter: (v) => `${v} ends in 3, yet $${v} = 3 \\times ${v / 3}$ is not prime.`,
    whyFit: (v) => `${v} ends in 3 and it is prime. It fits the claim.`,
    whyOther: (v) => `${v} does not end in 3, so the claim says nothing about it.`,
  },
  {
    claim: 'Every multiple of 3 is odd.',
    counter: [6, 12, 18, 24], fits: [3, 9, 15, 21, 27], other: [4, 8, 10, 14],
    whyCounter: (v) => `$${v} = 3 \\times ${v / 3}$ is a multiple of 3, and it is even.`,
    whyFit: (v) => `${v} is a multiple of 3 and it is odd. It fits the claim.`,
    whyOther: (v) => `${v} is not a multiple of 3, so the claim says nothing about it.`,
  },
  {
    claim: 'Every even number is a multiple of 4.',
    counter: [6, 10, 14, 18], fits: [4, 8, 12, 16, 20], other: [3, 5, 7, 9],
    whyCounter: (v) => `${v} is even, but it is not a multiple of 4: $${v} = 4 \\times ${Math.floor(v / 4)} + 2$.`,
    whyFit: (v) => `${v} is even and it is a multiple of 4. It fits the claim.`,
    whyOther: (v) => `${v} is odd, and the claim is only about even numbers. It says nothing about ${v}.`,
  },
  {
    claim: 'Every whole number that is divisible by 6 is also divisible by 12.',
    counter: [6, 18, 30, 42], fits: [12, 24, 36, 48], other: [8, 9, 10, 20],
    whyCounter: (v) => `$${v} = 6 \\times ${v / 6}$ is divisible by 6, but dividing it by 12 leaves a remainder of 6.`,
    whyFit: (v) => `${v} is divisible by 6 and by 12. It fits the claim.`,
    whyOther: (v) => `${v} is not divisible by 6, so the claim says nothing about it.`,
  },
];

/** Skeleton proofs about odd and even numbers, each with a couple of gaps. */
const PARITY_PROOFS = [
  {
    claim: 'the sum of two odd numbers is even',
    template: r`
      Let $a$ and $b$ be odd: $a = 2m + 1$ and $b = 2k + 1$ for whole numbers $m$ and $k$.

      Then $a + b = 2m + 2k +$ [[2]] $= 2 \times (m + k +$ [[1]] $)$.

      That is 2 times a whole number, so $a + b$ is [[*even|odd]].
    `,
    hint: r`The two odd numbers each bring a leftover 1: $1 + 1 = 2$, and $2m + 2k + 2$ has the common factor 2.`,
    explain: r`$(2m + 1) + (2k + 1) = 2m + 2k + 2 = 2(m + k + 1)$. The two leftover 1s pair up, so the sum is even, whichever odd numbers you start with.`,
  },
  {
    claim: 'the sum of an even number and an odd number is odd',
    template: r`
      Let $a$ be even and $b$ odd: $a = 2m$ and $b = 2k +$ [[1]] for whole numbers $m$ and $k$.

      Then $a + b = 2m + 2k + 1 =$ [[2]] $\times\, (m + k) + 1$.

      That is 2 times a whole number, plus 1, so $a + b$ is [[even|*odd]].
    `,
    hint: r`An odd number is $2k + 1$. Take the common factor 2 out of $2m + 2k$ and leave the 1 where it is.`,
    explain: r`$2m + (2k + 1) = 2(m + k) + 1$. One leftover 1 has no partner, so the sum is odd, whichever numbers you start with.`,
  },
  {
    claim: 'the product of two odd numbers is odd',
    template: r`
      Let $a$ and $b$ be odd: $a = 2m + 1$ and $b = 2k + 1$ for whole numbers $m$ and $k$.

      Multiply out: $ab = 4mk + 2m + 2k +$ [[1]] $= 2 \times ($ [[2]] $mk + m + k) + 1$.

      That is 2 times a whole number, plus 1, so $ab$ is [[even|*odd]].
    `,
    hint: r`Multiply each part of $2m + 1$ by each part of $2k + 1$: $2m \times 2k$, then $2m \times 1$, then $1 \times 2k$, then $1 \times 1$. And $4mk$ is 2 times $2mk$.`,
    explain: r`$(2m + 1)(2k + 1) = 4mk + 2m + 2k + 1 = 2(2mk + m + k) + 1$: twice a whole number, plus 1. So the product is odd.`,
  },
  {
    claim: 'an even number times any whole number is even',
    template: r`
      Let $a$ be even, $a = 2m$ for a whole number $m$, and let $b$ be any whole number.

      Then $ab =$ [[2]] $\times\, (mb)$.

      Since $mb$ is a whole number, $ab$ is 2 times a whole number, so $ab$ is [[*even|odd]].
    `,
    hint: r`$a \times b$ is $2 \times m \times b$. Group it as 2 times something.`,
    explain: r`$ab = (2m)b = 2(mb)$: twice a whole number, so even. One even factor is enough to make a product even.`,
  },
];

export default {
  id: 'evidence-is-not-proof',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Points on a circle',
      text: r`
        Mark some points on a circle and join every pair with a straight line.
        The lines cut the circle into regions.

        **Slide from 1 point up to 5** and watch the number of regions.

        **How many regions will 6 points give?**
      `,
      figure: { type: 'chord-regions', n: 1, nRange: [1, 5], count: 'auto', alt: 'A circle with points on its edge. A slider adds points, from one to five. Every pair of points is joined by a line, and the number of regions is shown: 1, 2, 4, 8, 16.' },
      shuffle: false,
      options: [{ text: '24' }, { text: '30' }, { text: '31' }, { text: '32' }],
      explain: r`
        1, 2, 4, 8, 16: the number of regions has doubled every time, and most people expect 32 next.

        Do not take anyone's word for it, not even your own. **Count.**
      `,
    },
    {
      id: 'count-six',
      type: 'interact',
      graded: false,
      title: 'Count them',
      text: r`
        Here are 6 points, with all 15 lines drawn. No three lines cross at the same spot
        inside the circle, so no region is lost.

        **Tap every region to count it.** Some are small: look closely near the middle.
      `,
      widget: { type: 'chord-regions', n: 6, alt: 'Six points on a circle, every pair joined by a line. Tap a region to count it.' },
      check: (s) => {
        if (s.complete) return true;
        if (s.counted === 0) return 'Tap a region and it gets a number. Count them all.';
        return `You have counted ${s.counted} so far, and at least one region is still white. Check the small ones near the middle and along the edge.`;
      },
      solution: { counted: 'all' },
      hints: ['Work round the edge first, then move inwards. Every counted region gets a colour and a number.'],
      explain: r`
        **31.** Not 32.

        The pattern 1, 2, 4, 8, 16 held five times in a row, and then it broke. (It stays broken:
        7 points give 57 regions and 8 give 99.)
      `,
    },
    {
      id: 'conjecture',
      type: 'info',
      title: 'A pattern is a guess',
      text: r`
        "The number of regions doubles with every new point" was a **conjecture**: a claim that
        fits everything seen so far, but has not been proved.

        Five cases fitted. In everyday life, five out of five feels convincing. But the claim was about
        *every* number of points, and there are infinitely many of those. Five cases, or five
        million, leave infinitely many unchecked.

        :::key
        Examples that fit a claim are **evidence** for it. They are never a proof of a claim
        about infinitely many cases.
        :::
      `,
    },
    {
      id: 'euler-hunt',
      type: 'interact',
      title: 'Forty in a row',
      text: r`
        A **prime** is a whole number greater than 1 that is not a product of two smaller
        whole numbers: 7 is prime, $9 = 3 \times 3$ is not.

        In 1772 Leonhard Euler pointed out a remarkable formula: $\;n^2 + n + 41$.
        Put in $n = 0, 1, 2, 3 \ldots$ and out come 41, 43, 47, 53 … all prime.

        Does it give a prime for **every** whole number $n$?

        **Test it until you find a value of $n$ that breaks the claim.**
      `,
      widget: {
        type: 'conjecture-test', preset: 'euler', claim: '$n^2 + n + 41$ is prime for every whole number $n$', min: 0, max: 47, cols: 8, n: 0,
        alt: 'A strip of the numbers 0 to 47. Each number can be tested in the formula n squared plus n plus 41.',
      },
      check: (s) => {
        if (s.found) return true;
        const k = s.tested.length;
        return k < 20
          ? `A prime every time so far, for ${k} value${k === 1 ? '' : 's'} of $n$. Keep testing.`
          : `${k} values tested, and every one gave a prime. It is tempting to stop here. But the claim is about every $n$: keep going.`;
      },
      solution: { n: 40 },
      hints: ['Drag the slider slowly to the right: every value it passes is tested.'],
      explain: r`
        From $n = 0$ to $n = 39$ the formula gives a prime: forty in a row. Then
        $$ 40^2 + 40 + 41 = 1681 = 41 \times 41 $$
        Forty successes, and the claim is still false.
      `,
    },
    {
      id: 'why-forty',
      type: 'fill',
      title: 'No accident',
      text: r`
        Why did it break at $n = 40$? Look at what the formula does there.

        One fact about counting is all you need: seven 5s and one more 5 make eight 5s, so
        $7 \times 5 + 5 = 8 \times 5$.
      `,
      template: r`
        $40^2 + 40 + 41 \;=\; 40 \times (40 + 1) + 41 \;=\; 40 \times 41 + 41 \;=\;$ [[41]] $\times\, 41$

        And at $n = 41$ every term is a multiple of 41: $\;\;41^2 + 41 + 41 \;=\; 41 \times$ [[43]]
      `,
      hints: [r`$40 \times 41 + 41$ is forty 41s and one more 41.`, r`$41^2 + 41 + 41 = 41 \times (41 + 1 + 1)$.`],
      explain: r`
        $40 \times 41 + 41 = 41 \times 41$, and $41^2 + 41 + 41 = 41 \times 43$.

        Once you look at how the formula is built, the failure is no surprise. That is what a
        *reason* can do and a list of examples cannot.
      `,
    },
    {
      id: 'polya',
      type: 'choice',
      title: 'Nine hundred million successes',
      text: r`
        How long can a false claim survive? Count the prime factors of a number with repeats:
        $12 = 2 \times 2 \times 3$ has three. Here is a claim that George Pólya studied in 1919:

        > For every $N > 1$, at least half of the numbers from 1 to $N$ have an **odd** number of prime factors.

        It holds for $N = 2$, for $N = 3$, and on and on. It first fails at $N = 906{,}150{,}257$.

        **What does that tell you?**
      `,
      columns: 1,
      options: [
        { text: 'However many cases agree, a claim about all numbers may still be false', correct: true },
        { text: 'After a million successes, a claim can safely be called true', why: 'This one passed more than 900 million tests in a row, and it is false.' },
        { text: 'Claims about infinitely many numbers can never be settled', why: 'They can, but not by checking cases one at a time. The rest of this course is about how.' },
        { text: 'Very large numbers follow different rules from small ones', why: 'The rules never changed. The claim was false all along; it only took a long time to show.' },
      ],
      explain: r`
        The smallest exception, 906,150,257, was found by Minoru Tanaka in 1980, with a computer.
        (In 1958 Brian Haselgrove had already proved that an exception must exist, without knowing where.)

        More than 900 million cases agreed with the claim, and it is false all the same.
      `,
    },
    {
      id: 'teach-counterexample',
      type: 'info',
      title: 'One exception is enough',
      text: r`
        A case that breaks a claim is called a **counterexample**. A single one **disproves** a
        claim about *all* numbers: $n = 40$ did it to Euler's formula.

        A counterexample has to be a number the claim is **about**, for which the claim **fails**.

        :::example Claim: every multiple of 5 ends in 5
        - **15** is a multiple of 5 and ends in 5. It fits the claim: evidence, nothing more.
        - **12** is not a multiple of 5. The claim says nothing about it.
        - **10** is a multiple of 5, and it ends in 0. A counterexample: the claim is false.
        :::
      `,
    },
    {
      id: 'counterexample',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(FALSE_CLAIMS);
        const counter = rng.pick(c.counter);
        const other = rng.pick(c.other);
        const options = [
          { value: counter, correct: true },
          ...rng.sample(c.fits, 2).map((v) => ({ value: v, why: c.whyFit(v) })),
          { value: other, why: c.whyOther(other) },
        ];
        options.sort((a, b) => a.value - b.value);
        return {
          text: r`
            A **counterexample** to a claim about all numbers is a number the claim is about, for which it fails.

            The claim: **${c.claim}**

            **Which of these is a counterexample?**
          `,
          shuffle: false,
          options: options.map((o) => ({ text: String(o.value), correct: !!o.correct, why: o.why })),
          hints: ['It is the four cards from the logic course again: a rule "if this, then that" is broken only by a case where the "if" part holds and the "then" part fails.', 'A number that fits the claim does not break it. Neither does a number the claim is not about.'],
          explain: `${c.whyCounter(counter)} One counterexample is enough: the claim is false.`,
        };
      },
    },
    {
      id: 'definitions',
      type: 'info',
      title: 'Certain, without checking them all',
      text: r`
        So how can anyone be sure of a claim about infinitely many numbers? By arguing from
        **what the words mean**, in a way that covers every case at once.

        Take the claim *"the sum of two even numbers is always even"*. First, say exactly what the
        words mean.

        :::key
        A whole number is **even** if it equals $2 \times k$ for some whole number $k$.

        It is **odd** if it equals $2 \times k + 1$ for some whole number $k$.
        :::

        So $14 = 2 \times 7$ is even, $0 = 2 \times 0$ is even, and $15 = 2 \times 7 + 1$ is odd.

        The letter $k$ stands for "some whole number, whichever it is". That is how one line
        can speak about every even number at once.
      `,
    },
    {
      id: 'example-direct',
      type: 'info',
      title: 'A proof, line by line',
      text: r`
        Watch the method on a similar claim first. A **multiple of 3** is 3 times a whole
        number: $12 = 3 \times 4$.

        :::example The sum of two multiples of 3 is a multiple of 3
        1. Let $a$ and $b$ be any two multiples of 3. *Letters, so no pair is left out.*
        2. Then $a = 3m$ and $b = 3k$ for some whole numbers $m$ and $k$. *What the words mean. Two letters, because $a$ and $b$ need not be equal.*
        3. Add them: $a + b = 3m + 3k = 3(m + k)$. *Take out the common factor 3.*
        4. $m + k$ is a whole number, so $a + b$ is 3 times a whole number: a multiple of 3. *The meaning again.*
        :::

        This is a **direct proof**: start from what the words mean and walk straight to the
        conclusion. It settles $12 + 9$, $300 + 6$ and every other pair at once.
      `,
    },
    {
      id: 'even-proof',
      type: 'order',
      review: true,
      text: r`
        Here is a proof that **the sum of two even numbers is even**, cut into lines.
        It never mentions a particular number, so it settles every case at once.

        **Put the lines in order**, so that each one follows from the lines above it.
      `,
      items: [
        r`Let $a$ and $b$ be any two even numbers.`,
        r`By the definition of even, $a = 2m$ and $b = 2k$ for some whole numbers $m$ and $k$.`,
        r`Add them: $a + b = 2m + 2k$.`,
        r`Take out the common factor: $a + b = 2(m + k)$.`,
        r`Since $m + k$ is a whole number, $a + b$ is 2 times a whole number.`,
        r`So $a + b$ is even.`,
      ],
      labels: ['Start', 'Conclusion'],
      hints: [
        'Begin by naming the two numbers. End with what was to be shown.',
        'You can only take out a factor of 2 after both numbers have been written as 2 times something.',
      ],
      explain: r`
        $a + b = 2m + 2k = 2(m + k)$: twice a whole number, so even. The letters $m$ and $k$
        could be anything, so this one argument covers $4 + 10$, $1000 + 2$ and every other pair.

        This is a **direct proof**: start from the definitions and walk straight to the conclusion.
      `,
    },
    {
      id: 'parity-proof',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const p = rng.pick(PARITY_PROOFS);
        return {
          text: `Fill the gaps in this proof that **${p.claim}**.`,
          template: p.template,
          hints: [r`Write the numbers out with the definitions ($2m$ for even, $2m + 1$ for odd), and collect everything that has a factor of 2.`, p.hint],
          explain: p.explain,
        };
      },
    },
    {
      id: 'sort-evidence',
      type: 'bucket',
      title: 'What does it show?',
      text: r`
        Each line is offered in support of, or against, a claim about **all** cases.
        **Sort them**: is it only evidence, a proof, or a disproof?
      `,
      buckets: ['Evidence only', 'Proof', 'Disproof'],
      items: [
        { text: r`The formula gave a prime for $n = 0, 1, 2, \ldots, 39$.`, bucket: 0, why: 'Forty cases that fit are evidence. (And here the very next case failed.)' },
        { text: r`A computer checked every even number from 4 to $4 \times 10^{18}$: each is a sum of two primes.`, bucket: 0, why: 'A mountain of evidence, but still finitely many cases. This claim, Goldbach\'s conjecture, has been unproved since 1742.' },
        { text: r`$a = 2m$ and $b = 2k$, so $a + b = 2(m + k)$, whatever $m$ and $k$ are.`, bucket: 1, why: 'This argument covers every pair of even numbers at once: a proof.' },
        { text: r`For $n = 40$ the formula gives $41 \times 41$.`, bucket: 2, why: 'One counterexample settles it: "always prime" is false.' },
        { text: 'Fifty triangles were measured, and the angles added up to 180° every time.', bucket: 0, why: 'Fifty measured triangles say nothing certain about the next one.' },
        { text: 'With six points on the circle there are 31 regions, not 32.', bucket: 2, why: 'One counterexample: the doubling claim is false.' },
      ],
      explain: 'Cases that fit can only ever support a claim about all cases. Proving it takes an argument that covers every case; disproving it takes one counterexample.',
    },
    {
      id: 'what-it-takes',
      type: 'fill',
      review: true,
      text: 'Think about a claim of the form "**every** whole number has this property".',
      template: `
        To show that the claim is **false**, you need [[*one counterexample|a thousand counterexamples|a counterexample for every number]].

        To show that it is **true**, you need [[one example that fits|a million examples that fit|*an argument that covers every case]].

        A million examples that fit, and nothing more, leave the claim [[certainly true|*still unproved|certainly false]].
      `,
      explain: 'One counterexample disproves a claim about every number. Only an argument that covers every case proves it. Examples that fit, however many, are evidence and nothing more.',
    },
    {
      id: 'built-to-fail',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const p = rng.pick([11, 17, 41]);
        const row = [1, 2, 3, 4].map((n) => n * n - n + p);
        return {
          title: 'Find the weak spot',
          text: r`
            Another formula that pours out primes: $\;n^2 - n + ${p}$.
            For $n = 1, 2, 3, 4$ it gives ${row.join(', ')}.

            Do not test it number by number. Think about how it is built:
            **what is the smallest $n \ge 1$ for which all three terms, $n^2$, $n$ and $${p}$, are multiples of ${p}$?**
          `,
          answer: p,
          prefix: '$n =$',
          wrong: [
            [1, r`For $n = 1$ the terms are 1, 1 and ${p}. Only the last is a multiple of ${p}.`],
            [p + 1, r`For $n = ${p + 1}$ the value is $${p} \times ${p + 2}$, so the formula does fail there. But $n^2$ and $n$ are not multiples of ${p}$, and a smaller $n$ already fails.`],
            [2 * p, r`That works, but it is not the smallest: try $n = ${p}$ itself.`],
          ],
          hints: [
            r`Euler's formula failed at $n = 41$ because every term was a multiple of 41.`,
            r`$n$ and $n^2$ are multiples of ${p} when $n$ is.`,
          ],
          explain: r`
            At $n = ${p}$ the formula gives $${p}^2 - ${p} + ${p} = ${p}^2 = ${p} \times ${p}$, which is not prime.

            As it happens, the formula gives a prime for every $n$ from 1 to ${p - 1}: ${p - 1} successes in a row before the failure that was built in from the start.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A friend tests a formula on the numbers 1 to 100, and it works every time.
        "That proves it," they say.

        **What would you tell them?**
      `,
      model: r`
        A hundred cases that fit are evidence, not proof. The claim is about infinitely many
        numbers, and all but a hundred of them are still unchecked. Euler's formula passed forty
        tests and failed the next one; another famous claim first fails beyond 900 million.

        To be sure, they need an argument that covers every case at once, the way
        $2m + 2k = 2(m + k)$ covers every pair of even numbers. And if the formula is false, a
        single counterexample would show it.
      `,
    },
  ],
  recap: [
    'A pattern that fits every case you have checked is a **conjecture**, not a fact.',
    'Cases that fit are **evidence**. No number of them proves a claim about infinitely many cases.',
    'One **counterexample** is enough to show that a claim about all cases is false.',
    'A **proof** argues from the definitions and covers every case at once: $2m + 2k = 2(m + k)$.',
  ],
  next: 'Next: how to prove that something can never be found, by pretending for a moment that it has been.',
};
