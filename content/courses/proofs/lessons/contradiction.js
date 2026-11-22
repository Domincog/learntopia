// Proofs: How to Be Certain · Lesson 2 · Suppose It Were False
import { r } from '../../../kit.js';
import { fractionText } from '../helpers.js';

/** Claims to prove by contradiction, with the right supposition and three tempting wrong ones. */
const SUPPOSITIONS = [
  {
    claim: r`$\sqrt{3}$ is not a fraction.`,
    right: r`$\sqrt{3}$ is a fraction`,
    wrong: [
      [r`$\sqrt{3}$ is not a fraction`, 'That is the claim itself. Supposing it would be assuming what you want to prove.'],
      [r`$\sqrt{3}$ is a whole number`, 'Too narrow. The opposite of "not a fraction" is "a fraction", of any kind.'],
      [r`$\sqrt{2}$ is a fraction`, 'That is about a different number.'],
    ],
  },
  {
    claim: 'There are infinitely many primes.',
    right: 'There are only finitely many primes',
    wrong: [
      ['There are infinitely many primes', 'That is the claim itself. Supposing it would be assuming what you want to prove.'],
      ['There are no primes at all', 'Too strong. The opposite of "infinitely many" is "only finitely many", which could still be a great many.'],
      ['Every whole number is prime', 'That is not the opposite of the claim. The opposite is that the primes run out somewhere.'],
    ],
  },
  {
    claim: 'There is no largest whole number.',
    right: 'There is a largest whole number',
    wrong: [
      ['There is no largest whole number', 'That is the claim itself. Supposing it would be assuming what you want to prove.'],
      ['There is a smallest whole number', 'A different question. Suppose the opposite of the claim: that a largest one exists.'],
      ['Every whole number is the largest', 'Too strong. To contradict "there is none" you suppose that there is one.'],
    ],
  },
  {
    claim: 'Every prime number greater than 2 is odd.',
    right: 'Some prime number greater than 2 is even',
    wrong: [
      ['Every prime number greater than 2 is even', 'Too strong. The opposite of "every one is odd" is "at least one is not odd".'],
      ['Every prime number greater than 2 is odd', 'That is the claim itself. Supposing it would be assuming what you want to prove.'],
      ['Some prime number greater than 2 is odd', 'That agrees with the claim. You need to suppose that the claim fails somewhere.'],
    ],
  },
  {
    claim: 'No whole number is both even and odd.',
    right: 'Some whole number is both even and odd',
    wrong: [
      ['Every whole number is both even and odd', 'Too strong. The opposite of "none is" is "at least one is".'],
      ['No whole number is both even and odd', 'That is the claim itself. Supposing it would be assuming what you want to prove.'],
      ['Some whole number is neither even nor odd', 'A different statement. The opposite of "none is both" is "at least one is both".'],
    ],
  },
  {
    claim: 'There is no smallest positive fraction.',
    right: 'There is a smallest positive fraction',
    wrong: [
      ['There is no smallest positive fraction', 'That is the claim itself. Supposing it would be assuming what you want to prove.'],
      ['There is a largest positive fraction', 'A different question. Suppose the opposite of the claim: that a smallest one exists.'],
      ['Every positive fraction is the smallest', 'Too strong. To contradict "there is none" you suppose that there is one.'],
    ],
  },
];

export default {
  id: 'contradiction',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A search with no end',
      text: r`
        The fraction $\frac{3}{2}$ squared is $2.25$: a little too big. And $\frac{7}{5}$ squared
        is $1.96$: close to 2, but a little too small.

        There are infinitely many fractions left to try.
        **Is there one whose square is exactly 2?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Yes: with large enough numbers on top and bottom, one will fit' },
        { text: 'No: no fraction will ever do it', correct: true },
        { text: 'Nobody can know: there are too many fractions to check' },
      ],
      explain: r`
        No fraction squares to exactly 2, and people have been sure of it for well over two
        thousand years.

        But how can anyone be *sure*, with infinitely many fractions to rule out? First get a feel for the search.
      `,
    },
    {
      id: 'hunt',
      type: 'interact',
      graded: false,
      title: 'So close',
      text: r`
        A fraction $\frac{p}{q}$ squares to 2 exactly when $p^2 = 2q^2$. On this grid, that
        happens when the point $(q, p)$ sits exactly **on the line**.

        **Drag the point to grid points near the line.** How small can you make the gap between
        $p^2$ and $2q^2$? Find a point where the gap is only 1.
      `,
      widget: {
        type: 'plot', x: [0, 13], y: [0, 18], xStep: 1, yStep: 2, xLabel: 'q', yLabel: 'p',
        fns: [{ expr: 'sqrt(2)*x', color: 'blue' }],
        points: [{ id: 'P', x: 2, y: 4, drag: 'xy', snap: 1, color: 'orange', coords: true }],
        readouts: [
          { label: '$p^2$', expr: 'Py^2', digits: 0 },
          { label: '$2q^2$', expr: '2*Px^2', digits: 0 },
          { label: 'gap', expr: 'abs(Py^2 - 2*Px^2)', digits: 0, color: 'orange' },
        ],
        alt: 'A grid with q across and p up, and a straight line through the origin on which p squared equals 2 q squared. A point can be dragged from grid point to grid point.',
      },
      check: (s) => {
        const p = s.P.y;
        const q = s.P.x;
        if (q < 1) return 'A fraction needs a bottom number: keep $q$ at 1 or more.';
        const gap = Math.abs(p * p - 2 * q * q);
        if (gap === 1) return true;
        return `Here $p^2 = ${p * p}$ and $2q^2 = ${2 * q * q}$: a gap of ${gap}. Try grid points that hug the line more closely.`;
      },
      solution: { P: { x: 5, y: 7 } },
      hints: [r`Try $q = 2$ and look for the best $p$. Then try $q = 5$.`],
      explain: r`
        $\frac{3}{2}$, $\frac{7}{5}$, $\frac{17}{12}$: the gap shrinks to 1, again and again,
        but the point never lands on the line.

        You could go on for ever and still not know whether the next fraction is the one. The
        way out is to stop searching and start **supposing**.
      `,
    },
    {
      id: 'method',
      type: 'info',
      title: 'Suppose it were false',
      text: r`
        You have used this trick before. On the island of knights and liars, Cleo said "We are
        both liars." *Suppose* she is a knight. Then her sentence is true, which makes her a
        liar: impossible. So she is not a knight.

        The same shape of argument proves things in mathematics.

        1. **Suppose** the opposite of what you want to prove.
        2. **Follow** it, one sound step at a time.
        3. Arrive at something **impossible**: a contradiction.

        :::key
        Sound steps cannot lead from a true start to an impossible end. So the supposition was
        false, and the thing you wanted to prove is true. This is **proof by contradiction**.
        :::
      `,
    },
    {
      id: 'halve',
      type: 'interact',
      title: 'A warm-up',
      text: r`
        A friend claims: "$\frac{1}{4}$ is the smallest positive number there is." The blue dot
        marks it.

        **Prove them wrong: put your point on a positive number that is smaller than $\frac14$.**
      `,
      widget: {
        type: 'number-line', min: 0, max: 0.5, step: 1 / 32, tick: 1 / 32, major: 0.25, format: (v) => fractionText(v),
        points: [{ id: 'a', value: 0.5, color: 'orange' }],
        marks: [{ value: 0.25, color: 'blue' }],
        alt: 'A number line from 0 to one half, with a blue dot at one quarter and a point you can move.',
      },
      check: (s) => {
        if (s.a > 0 && s.a < 0.25) return true;
        if (s.a === 0) return 'Zero is not positive. You need a number that is greater than 0.';
        if (s.a === 0.25) return 'That is their number itself. Find a smaller one.';
        return r`That is larger than $\frac14$. Move to the left of the blue dot, but stay above 0.`;
      },
      solution: { a: 0.125 },
      explain: r`
        Whatever positive number they name, **half of it** is smaller and still positive. Half of
        $\frac14$ is $\frac18$. If they retreat to $\frac18$, you answer $\frac{1}{16}$. They can never win.

        Now turn that game into a proof.
      `,
    },
    {
      id: 'example-contradiction',
      type: 'info',
      title: 'From a game to a proof',
      text: r`
        The same game beats any "largest" number: whatever multiple of 10 somebody names, add 10
        and you hold a larger one. Written out as a proof by contradiction:

        :::example There is no largest multiple of 10
        1. **Suppose** there is a largest multiple of 10. Call it $L$. *The opposite of the claim.*
        2. Look at $L + 10$. It is a multiple of 10 too, and it is larger than $L$. *A sound step.*
        3. So $L$ is not the largest after all. That contradicts how $L$ was chosen. *Something impossible.*
        4. So the supposition was false: there is no largest multiple of 10. *The claim is proved.*
        :::

        The letter $L$ stands for whichever number the largest one is supposed to be, so no
        multiple of 10 escapes the argument.
      `,
    },
    {
      id: 'smallest-order',
      type: 'order',
      text: r`
        Back to the halving game. Here is a proof that **there is no smallest positive
        fraction**, cut into lines. It has the same four parts as the proof you just read.

        **Put them in order.**
      `,
      items: [
        r`Suppose there **is** a smallest positive fraction. Call it $s$.`,
        r`Look at $\frac{s}{2}$. It is a positive fraction too, and it is smaller than $s$.`,
        r`So $s$ is not the smallest positive fraction after all. That contradicts how $s$ was chosen.`,
        r`So the supposition was false: there is no smallest positive fraction.`,
      ],
      labels: ['Start', 'Conclusion'],
      hints: ['Every proof by contradiction opens with "Suppose …" and closes with "So the supposition was false".'],
      explain: r`
        Suppose the opposite, follow it, hit a contradiction, conclude. The proof never looks at
        any particular fraction, so no fraction can escape it.
      `,
    },
    {
      id: 'odd-square',
      type: 'fill',
      title: 'Two tools for the big one',
      text: r`
        The proof about 2 needs two small facts. First: every fraction can be written in
        **lowest terms**, where top and bottom share no common factor bigger than 1 ($\frac{6}{8} = \frac{3}{4}$).

        Second: **if $p^2$ is even, then $p$ is even.** The easy way to see that is its
        contrapositive: an odd number has an odd square.
      `,
      template: r`
        Take any odd number, $p = 2m + 1$. Then

        $p^2 = 4m^2 + 4m + 1 = 2 \times ($ [[2]] $m^2 + 2m) +$ [[1]]

        That is 2 times a whole number, plus 1, so $p^2$ is [[even|*odd]].

        So a number whose square is **even** cannot be odd. It must be [[*even|odd]].
      `,
      hints: [r`$4m^2 + 4m$ is twice $2m^2 + 2m$.`],
      explain: r`
        $(2m + 1)^2 = 2(2m^2 + 2m) + 1$ is odd. "If $p$ is odd, then $p^2$ is odd" is the
        contrapositive of "if $p^2$ is even, then $p$ is even", and a statement and its
        contrapositive are true or false together.
      `,
    },
    {
      id: 'example-root-half',
      type: 'info',
      title: 'A rehearsal with one half',
      text: r`
        Here are the two tools at work in a complete proof. Read it line by line: the famous
        proof about 2 is built the same way, and you will assemble it next.

        :::example No fraction has a square of exactly ½
        1. **Suppose** some fraction does. Write it in lowest terms: $\frac{p}{q}$.
        2. Then $\frac{p^2}{q^2} = \frac{1}{2}$, so $q^2 = 2p^2$. *Multiply both sides by $2q^2$.*
        3. So $q^2$ is even, and therefore $q$ is even: $q = 2k$. *The second tool.*
        4. Put that in: $4k^2 = 2p^2$, so $p^2 = 2k^2$. *$(2k)^2$ is $4k^2$. Then halve both sides.*
        5. So $p^2$ is even, and therefore $p$ is even as well. *The second tool again.*
        6. Top and bottom are both even, so $\frac{p}{q}$ was not in lowest terms: a **contradiction**. No such fraction exists.
        :::
      `,
    },
    {
      id: 'sqrt2-order',
      type: 'order',
      review: true,
      title: 'The famous one',
      text: r`
        This proof has been known since ancient Greece: **no fraction has a square of exactly 2.**
        In other words, $\sqrt{2}$ is not a fraction.

        **Put the lines in order.**
      `,
      items: [
        r`Suppose some fraction does square to 2. Write it in lowest terms: $\frac{p}{q}$.`,
        r`Then $\frac{p^2}{q^2} = 2$, so $p^2 = 2q^2$.`,
        r`So $p^2$ is even, and therefore $p$ is even: $p = 2k$ for some whole number $k$.`,
        r`Put that in: $(2k)^2 = 2q^2$, so $4k^2 = 2q^2$, so $q^2 = 2k^2$.`,
        r`So $q^2$ is even, and therefore $q$ is even as well.`,
        r`Now top and bottom are both divisible by 2, so $\frac{p}{q}$ was not in lowest terms: a contradiction. No such fraction exists.`,
      ],
      labels: ['Start', 'Conclusion'],
      hints: [
        'Start with the supposition and end with the contradiction.',
        r`After $p^2 = 2q^2$, the first discovery is about $p$. Only then can you find out about $q$.`,
      ],
      explain: r`
        The supposition forced both $p$ and $q$ to be even, yet a fraction in lowest terms cannot
        have both even. So no fraction squares to 2: $\sqrt{2}$ is **irrational**.

        Your search on the grid was never going to succeed, and now you know *why*, without
        testing one more fraction.
      `,
    },
    {
      id: 'what-clashed',
      type: 'choice',
      text: r`
        A contradiction is a pair of statements that cannot both be true.

        **Which two statements clashed in the proof about $\sqrt{2}$?**
      `,
      columns: 1,
      options: [
        { text: r`"$\frac{p}{q}$ is in lowest terms" and "$p$ and $q$ are both even"`, correct: true },
        { text: r`"$p^2 = 2q^2$" and "$p$ is even"`, why: r`These agree with each other. In fact the second was deduced from the first.` },
        { text: r`"$p$ is even" and "$q$ is even"`, why: 'Two numbers can both be even. The trouble is that the top and bottom of a fraction in lowest terms cannot.' },
        { text: r`"$p^2$ is even" and "$2$ is even"`, why: 'Nothing wrong with either of those. The clash came at the end, with "lowest terms".' },
      ],
      explain: r`
        The fraction was chosen in lowest terms, and then its top and bottom turned out to share
        the factor 2. Everything in between followed from the supposition by sound steps, so the
        supposition is what has to go.
      `,
    },
    {
      id: 'teach-sound-steps',
      type: 'info',
      title: 'Every step must be sound',
      text: r`
        A contradiction only condemns the supposition if every step in between was **sound**:
        allowed for every number it might be about. Two steps that look harmless and are not:

        - **Dividing by zero.** $5 \times 0 = 9 \times 0$ is true. Divide both sides by 0, and it says $5 = 9$.
        - **A "fact" nobody proved.** "If $n^2$ is divisible by 9, then $n$ is divisible by 9" sounds like the fact about even squares. But $n = 3$ breaks it: 9 is divisible by 9, and 3 is not.

        :::tip Hunting a bad step
        Try the argument with small numbers. The first line that turns something true into
        something false is the unsound one.
        :::
      `,
    },
    {
      id: 'bogus',
      type: 'choice',
      title: 'A "proof" that 2 = 1',
      text: r`
        This argument ends in nonsense, so one of its steps is not sound. Here $a$ and
        $b$ are two equal numbers, not zero.

        1. $a = b$
        2. $a^2 = ab$
        3. $a^2 - b^2 = ab - b^2$
        4. $(a + b)(a - b) = b(a - b)$
        5. $a + b = b$
        6. $2b = b$, and so $2 = 1$

        **Which line does not follow from the line before it?**
      `,
      shuffle: false,
      options: [
        { text: 'Line 3', why: r`Subtracting $b^2$ from both sides is always allowed.` },
        { text: 'Line 4', why: 'Both sides are factored correctly. Multiply them out to check.' },
        { text: 'Line 5', correct: true },
        { text: 'Line 6', why: r`Replacing $a$ by $b$ is fine because $a = b$, and dividing by $b$ is fine because $b$ is not zero. The damage was done earlier.` },
      ],
      hints: [r`Try it with numbers: let $a = b = 3$ and work out both sides of each line.`],
      explain: r`
        Line 5 divides both sides by $a - b$. But $a = b$, so $a - b = 0$, and dividing by zero is
        not a sound step. With $a = b = 3$, line 4 says $6 \times 0 = 3 \times 0$, which is true;
        line 5 says $6 = 3$.

        So when an argument ends in nonsense, check the steps before you blame the starting point.
      `,
    },
    {
      id: 'primes-fill',
      type: 'fill',
      review: true,
      title: 'No largest prime',
      text: r`
        Euclid's proof that the primes never run out is usually told as a proof by contradiction.
        It uses one fact: every whole number greater than 1 has at least one prime factor.

        Its trick is to multiply and add 1: $2 \times 3 \times 5 + 1 = 31$, and dividing 31 by
        2, by 3 or by 5 leaves a remainder of 1 each time. **Fill the gaps.**
      `,
      template: r`
        Suppose there are only finitely many primes, all written on one list. Multiply **all** of them together, add 1, and call the result $N$.

        Dividing $N$ by any prime on the list leaves a remainder of [[1]], so [[*none|all|some]] of the primes on the list divides $N$.

        But $N$ is greater than 1, so it has [[*at least one|no]] prime factor. That prime is [[*missing from|on]] the list, which was supposed to hold every prime: a contradiction.
      `,
      hints: ['The product of all the primes on the list is a multiple of each of them. $N$ is one more than that product.'],
      explain: r`
        $N$ is one more than a multiple of every prime on the list, so each of them leaves
        remainder 1. Yet $N$ must have *some* prime factor. So no finite list of primes is
        complete: there is no largest prime.
      `,
    },
    {
      id: 'n-not-prime',
      type: 'choice',
      text: r`
        Try it. Suppose the only primes were 2, 3, 5, 7, 11 and 13. Then
        $$ N = 2 \times 3 \times 5 \times 7 \times 11 \times 13 + 1 $$

        $$ N = 30031 $$

        $$ 30031 = 59 \times 509 $$

        **What does Euclid's argument say about this $N$?**
      `,
      columns: 1,
      options: [
        { text: r`$N$ has a prime factor that is not on the list`, correct: true },
        { text: r`$N$ itself must be prime`, why: r`It is not: $N = 59 \times 509$. The argument only says that the prime factors of $N$ are missing from the list.` },
        { text: r`$N$ is the largest prime`, why: r`$N$ is not even prime here, and the whole point is that there is no largest prime.` },
        { text: r`One of 2, 3, 5, 7, 11, 13 divides $N$`, why: 'Each of them leaves remainder 1.' },
      ],
      explain: r`
        59 and 509 are both prime, and neither is on the list. The proof never claims that
        "the product plus one" is prime. It claims that its prime factors are new, and that is
        enough for the contradiction.
      `,
    },
    {
      id: 'teach-opposite',
      type: 'info',
      title: 'The exact opposite',
      text: r`
        Every proof by contradiction opens by supposing the **exact opposite** of the claim:
        nothing stronger, nothing weaker. In the logic course, the opposite of "every window is
        closed" was "at least one window is open". The same rule works here.

        - "There is **no** largest multiple of 10." Suppose there **is** one.
        - "**Every** multiple of 4 is even." Suppose **some** multiple of 4 is odd.
        - "**No** multiple of 10 is odd." Suppose **some** multiple of 10 is odd.

        :::warn Three ways to miss
        Wrong suppositions for "every multiple of 4 is even":
        - *Every multiple of 4 is odd.* Too strong: the claim could fail without that.
        - *Some multiple of 4 is even.* That agrees with the claim.
        - *Every multiple of 4 is even.* That is the claim itself.
        :::
      `,
    },
    {
      id: 'assume-what',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(SUPPOSITIONS);
        return {
          text: `
            You want to prove this by contradiction:

            **${c.claim}**

            **What do you suppose at the start?**
          `,
          columns: 1,
          options: [{ text: c.right, correct: true }, ...c.wrong.map(([text, why]) => ({ text, why }))],
          hints: ['Suppose the exact opposite of the claim: nothing weaker, nothing stronger.'],
          explain: `Suppose the exact opposite: "${c.right}." If sound steps lead from there to something impossible, the supposition is false and the claim is proved.`,
        };
      },
    },
    {
      id: 'root-four',
      type: 'choice',
      stretch: true,
      title: 'The same proof, for the wrong number',
      text: r`
        Someone copies the proof to "show" that $\sqrt{4}$ is not a fraction. (It is: $\sqrt{4} = 2$.)

        1. Suppose $\sqrt{4} = \frac{p}{q}$, in lowest terms.
        2. Then $p^2 = 4q^2$.
        3. So $p^2$ is divisible by 4, and therefore $p$ is divisible by 4: $p = 4k$.
        4. Then $16k^2 = 4q^2$, so $q^2 = 4k^2$, so $q$ is even.
        5. So $p$ and $q$ are both even: not lowest terms. Contradiction.

        **Which line makes a step that is not sound?**
      `,
      shuffle: false,
      options: [
        { text: 'Line 2', why: r`Squaring both sides and multiplying by $q^2$ is fine.` },
        { text: 'Line 3', correct: true },
        { text: 'Line 4', why: r`Given $p = 4k$, this line is correct: $q^2 = 4k^2$ means $q = 2k$. The slip came before it.` },
        { text: 'Line 5', why: r`If $p = 4k$ and $q$ is even, both really are even. The slip came before it.` },
      ],
      hints: [r`Is it true that a number whose square is divisible by 4 must itself be divisible by 4? Try $p = 2$.`],
      explain: r`
        Line 3. "$p^2$ is divisible by 4" does not force "$p$ is divisible by 4": for $p = 2$,
        the square is 4 but 2 is not divisible by 4. (For divisibility by 2 the step *is* sound:
        you proved it.)

        Done honestly, $p^2 = 4q^2$ only gives $p = 2q$, so $\frac{p}{q} = 2$. No contradiction, which is as it should be.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A proof by contradiction starts from something that turns out to be false.

        **Why is that not cheating?**
      `,
      model: r`
        Because the false statement is never claimed. It is only *supposed*, to see where it leads.

        Sound steps cannot turn a truth into an impossibility. So if a supposition leads, by sound
        steps, to something impossible, the supposition must be false and its opposite true. A
        detective rules out a suspect the same way: "if she had done it, she would have been in
        two places at once."

        The one thing to watch is that every step in between really is sound. Otherwise the
        contradiction may be your own mistake, as in the "proof" that 2 = 1.
      `,
    },
  ],
  recap: [
    'To prove a claim by contradiction: **suppose the opposite**, follow sound steps, and reach something impossible.',
    'No fraction squares to 2: a fraction in lowest terms that did would have an even top *and* an even bottom.',
    'There is no smallest positive fraction (halve it) and no largest prime (multiply them all and add 1).',
    'A contradiction only blames the supposition if every other step was sound. Dividing by zero is not.',
  ],
  next: 'Next: how two small arguments can prove infinitely many statements at once. Bring dominoes.',
};
