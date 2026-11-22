// The Secret Life of Numbers · Lesson 7 · Build a Public Key
import { r } from '../../../kit.js';
import { powMod } from '../helpers.js';

// The toy system used throughout: N = 3 × 11, lock with the power 3, unlock with the power 7.
const N = 33;
const E = 3;
const D = 7;

export default {
  id: 'public-keys',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Whispering in a crowded room',
      text: `
        Two people who have never met want to send each other secret messages. They can only
        talk in public, and an eavesdropper hears **every word** they say, including whatever
        they say about the code.

        **Can they still keep their messages secret?**
      `,
      shuffle: false,
      options: [
        { text: 'No: whatever they agree on, the eavesdropper knows it too' },
        { text: 'Only if they met in private first to agree on a key' },
        { text: 'Yes', correct: true },
      ],
      explain: `
        Yes, and for thousands of years nobody suspected it. The answer was found in the 1970s,
        and it is the reason you can type a card number into a website you have never visited
        before.

        In this lesson you will build a small one yourself.
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: 'A lock with two numbers',
      text: r`
        Here is a complete toy version. It is built on a clock with $N = 33$ places.

        | | | who knows it |
        |:--|:--|:--|
        | the clock size | $N = 33$ | **everyone** |
        | the locking power | $e = 3$ | **everyone** |
        | the unlocking power | $d = 7$ | only the owner |

        A message is a number $m$ smaller than 33.

        - **To lock it**, anyone works out $\;m^3 \bmod 33$.
        - **To unlock it**, the owner raises the result to the power 7, again mod 33.

        The two public numbers are the **public key**: the open padlock you met two lessons ago.
        The unlocking power is the **private key**.
      `,
    },
    {
      id: 'example-lock',
      type: 'info',
      title: 'Worked example: lock a message',
      text: r`
        Say the message is the number 13. To lock it with the public key, raise it to the power 3 and keep the remainder mod 33.

        :::example Lock 13
        - $13^3 = 13 \times 13 \times 13 = 2197$
        - $2197 = 66 \times 33 + 19$
        - so $13^3 \bmod 33 = 19$

        The locked message is **19**. That is what gets sent.
        :::

        Anyone can do this, because 33 and 3 are public. Turning 19 back into 13 takes the private power 7, and only the owner has that.
      `,
    },
    {
      id: 'lock',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.pick([2, 4, 5, 6, 7, 8, 9]);
        const cube = m * m * m;
        const answer = cube % N;
        return {
          text: r`
            Your message is the number **${m}**. Lock it with the public key:

            $$ ${m}^3 \bmod 33 $$
          `,
          answer,
          wrong: [
            [cube, r`That is $${m}^3$. Now take its remainder on division by 33.`],
            [(m * 3) % N, r`That is ${m} times 3. Locking means ${m} *to the power* 3.`],
            [powMod(m, D, N), r`That uses the private power 7. Locking uses the public power 3.`],
          ].filter(([v], i, all) => v !== answer && all.findIndex(([u]) => u === v) === i),
          hints: [r`$${m}^3 = ${cube}$. What is left after taking away as many 33s as you can?`],
          explain: r`$${m}^3 = ${cube} = ${Math.floor(cube / N)} \times 33 + ${answer}$, so the locked message is **${answer}**. Anyone could have done that. Undoing it is another matter.`,
        };
      },
    },
    {
      id: 'unlock',
      type: 'interact',
      title: 'Open it',
      text: r`
        You own the lock. A message arrives, locked with your public key: the number **29**.

        **Unlock it with your private key**: raise 29 to the power 7 on the 33-clock.
      `,
      widget: { type: 'power-cycle', m: N, base: 29, max: D, alt: 'A dial with 33 places, set up to take powers of 29.' },
      check: (s) => s.n === D || 'The private key is the power 7. Slide the power all the way up to 7.',
      solution: { n: D },
      explain: r`
        The marker lands on **17**: that was the message. Check it by locking 17 again:
        $17^3 = 4913 = 148 \times 33 + 29$. Locking gives 29, unlocking gives back 17.

        The sender never knew the number 7, and never needed it.
      `,
    },
    {
      id: 'why',
      type: 'fill',
      title: 'Why 7 undoes 3',
      text: r`
        The clock size is a product of two primes: $33 = 3 \times 11$. Take one off each prime and
        multiply. Then look at what the two powers do together.
      `,
      template: r`
        $(3 - 1) \times (11 - 1) =$ [[20]]

        Locking and then unlocking raises the message to the power $3 \times 7 =$ [[21]].

        And 21 leaves remainder [[1]] when divided by 20.
      `,
      explain: r`
        On the 33-clock, raising to the power **20** brings a number back to 1, as long as it
        shares no factor with 33. That is Fermat's little theorem from the last lesson, working
        on both primes at once.

        So the power 21 is "back to 1, then one more step": $m^{21} = m^{20} \times m = m$.
        The message comes back. (It comes back for the multiples of 3 and 11 as well, by a
        slightly longer argument.)
      `,
    },
    {
      id: 'teach-key-rule',
      type: 'info',
      title: 'How a key pair is made',
      text: r`
        The three lines you just filled in are the recipe for any lock of this kind.

        1. Pick two primes $p$ and $q$. The clock size is $N = p \times q$.
        2. Work out $(p - 1) \times (q - 1)$.
        3. Choose the powers $e$ and $d$ so that $e \times d$ leaves **remainder 1** when divided by that number.

        :::example The toy lock
        The primes are 3 and 11, and $e = 3$. Then $(3 - 1) \times (11 - 1) = 20$.
        The numbers that leave remainder 1 on division by 20 are 21, 41, 61 …
        The first multiple of 3 among them is $21 = 3 \times 7$, so $d = 7$.
        :::

        Step 2 cannot be done without the two primes. $N$ and $e$ go public; the primes and $d$ stay with the owner.
      `,
    },
    {
      id: 'find-d',
      type: 'numeric',
      stretch: true,
      title: 'Make your own key',
      text: r`
        Build a new lock from the primes 3 and 23. The clock size is $N = 69$, and
        $(3 - 1) \times (23 - 1) = 44$. Keep the locking power $e = 3$.

        Choose the unlocking power $d$ so that $3 \times d$ leaves **remainder 1** when divided by 44.
        **Find the smallest $d$ that does.**
      `,
      answer: 15,
      prefix: '$d =$',
      feedback: (v) => (Number.isInteger(v) && v > 15 && (3 * v) % 44 === 1
        ? r`$3 \times ${v} = ${3 * v}$ does leave remainder 1, so ${v} would unlock too. But a smaller power also works. Find that one.`
        : null),
      wrong: [
        [7, r`That was the key for $N = 33$. Here $3 \times 7 = 21$, which leaves remainder 21 on division by 44.`],
        [14, r`$3 \times 14 = 42$: two short of 44, so the remainder is 42, not 1.`],
        [16, r`$3 \times 16 = 48$, which leaves remainder 4. You need remainder 1.`],
      ],
      hints: [
        'The numbers that leave remainder 1 on division by 44 are 45, 89, 133 …',
        'Which of 45, 89, 133 is a multiple of 3?',
      ],
      explain: r`
        $3 \times 15 = 45 = 1 \times 44 + 1$, so $d = 15$.

        To find it you needed the number 44, and for that you needed the two primes. The owner
        of a lock knows them. Nobody else does.
      `,
    },
    {
      id: 'attacker',
      type: 'choice',
      text: r`
        An eavesdropper knows the public key, $N$ and $e$, and has seen the locked message.
        **What would they need in order to work out the unlocking power $d$?**
      `,
      options: [
        { text: r`The two primes that were multiplied to make $N$`, correct: true },
        { text: 'A copy of the original message', why: 'If they had the message they would not need to unlock anything.' },
        { text: r`Nothing more: $d$ can be worked out from $e$ alone`, why: r`You needed $(p - 1)(q - 1)$ to find $d$, and that needs the primes. The power $e$ on its own is not enough.` },
        { text: r`A larger value of $e$`, why: r`The size of $e$ does not matter. What matters is the pair of primes hidden inside $N$.` },
      ],
      explain: r`
        They need the primes. For $N = 33$ a child can find them. Real keys use an $N$ with more
        than 600 digits. Splitting one with 250 digits took a huge computing effort, finished in
        2020, and nobody has publicly split a number of this kind anywhere near the size of a
        real key.

        The whole system rests on the one-way street you met two lessons ago: multiplying
        is easy, un-multiplying is not.
      `,
    },
    {
      id: 'sign',
      type: 'choice',
      title: 'The lock, run backwards',
      text: r`
        The two powers undo each other in either order. So the owner can also do it backwards:
        take a message, raise it to the **private** power, and publish the result.

        Anyone can undo that with the public power and read the message. **So what is the point?**
      `,
      options: [
        { text: 'It proves that the message came from the owner of the private key', correct: true },
        { text: 'It keeps the message secret from everyone else', why: 'It cannot: anyone can undo it with the public key.' },
        { text: 'It makes the message shorter', why: 'The result is about the same size as the message.' },
        { text: 'There is none: it is a mistake', why: 'It is one of the most used ideas in computing.' },
      ],
      explain: `
        Only the holder of the private key could have produced something that the public key
        turns back into a sensible message. That is a **digital signature**.

        Signatures are how your phone knows that an update really comes from its maker, and
        how your browser knows that a website is the one it claims to be.
      `,
    },
    {
      id: 'roles',
      type: 'match',
      review: true,
      text: 'Match each part of the system with what it is.',
      pairs: [
        [r`$N$`, 'Public: the product of two primes'],
        [r`$e$`, 'Public: the power that locks'],
        [r`$d$`, 'Private: the power that unlocks'],
        [r`The two primes`, 'Secret: needed to work out the unlocking power'],
      ],
      explain: 'Two numbers go out to the world, and the rest stays at home. Publishing the lock gives nothing away about the key.',
    },
    {
      id: 'real',
      type: 'info',
      title: 'From toy to real',
      text: r`
        What you built is **RSA**, published in 1977 by Rivest, Shamir and Adleman. (Clifford
        Cocks had found the same idea at a British intelligence agency in 1973, but that stayed
        secret for more than twenty years.)

        A real system differs from the toy in three ways:

        - **Size.** The primes have hundreds of digits each. Powers that large are still quick,
          thanks to repeated squaring.
        - **Padding.** Random filler is mixed into every message before locking. Without it, the
          same message would always lock to the same number, and short messages could be guessed.
        - **Division of labour.** Public-key methods are slow, so they are used only to agree
          on a fresh key for a fast everyday cipher, which then does the bulk of the work.

        The mathematics, though, is the mathematics of this course: primes, remainders,
        and powers on a clock.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'Anyone who knows the public key can lock a message', correct: true },
        { text: 'Unlocking takes a power that only the owner knows', correct: true },
        { text: r`Whoever can split $N$ into its two primes can work out the private key`, correct: true },
        { text: 'The public key has to be kept away from eavesdroppers', why: 'It is meant to be seen by everyone. Only the private key is secret.' },
        { text: 'Two people must meet in private before they can use it', why: 'That is exactly what public keys make unnecessary.' },
      ],
      explain: 'A public key lets strangers talk in private, and its safety rests on how hard it is to split a product of two large primes.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Suppose someone announced a **fast way to split large numbers into their prime factors**.

        **Why would that be front-page news, and not only for mathematicians?**
      `,
      model: `
        Because every lock built this way would stop working overnight. Anyone could take a
        public key, split its clock size into the two primes, work out the private power, and
        read messages or forge signatures.

        The safety of the system is not a secret hidden inside it. It is the difficulty of one
        arithmetic problem, and it lasts exactly as long as that problem stays hard.
      `,
    },
  ],
  recap: [
    'A public key is two numbers anyone may know: a clock size $N$ and a locking power $e$.',
    'The private key is an unlocking power $d$, chosen so that $e \\times d$ leaves remainder 1 on division by $(p-1)(q-1)$.',
    'Finding $d$ needs the two primes inside $N$. That is why factoring is the attack, and why it must stay hard.',
    'Run backwards, the same lock makes digital signatures.',
  ],
  next: 'That is the end of this course. The reviews will keep its ideas fresh, a few minutes at a time.',
};
