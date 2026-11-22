// The Secret Life of Numbers · Lesson 5 · Secret Codes
import { r, plural } from '../../../kit.js';
import { ALPHABET, caesar } from '../helpers.js';

/** The alphabet with its numbers, A = 0 … Z = 25, in two rows of thirteen. */
function alphabetStrip() {
  const w = 26;
  let out = '';
  for (let i = 0; i < 26; i++) {
    const x = 11 + (i % 13) * w;
    const y = 4 + Math.floor(i / 13) * 62;
    out += `<rect class="fill-surface stroke-ink" stroke-width="1.5" x="${x}" y="${y}" width="${w}" height="30"/>`
      + `<rect class="fill-violet-soft stroke-ink" stroke-width="1.5" x="${x}" y="${y + 30}" width="${w}" height="22"/>`
      + `<text class="fig-label" x="${x + w / 2}" y="${y + 21}" text-anchor="middle">${ALPHABET[i]}</text>`
      + `<text class="fig-label-sm" x="${x + w / 2}" y="${y + 46}" text-anchor="middle">${i}</text>`;
  }
  return {
    type: 'svg', viewBox: '0 0 360 122', maxWidth: 520, content: out,
    alt: 'The alphabet with a number under each letter: A is 0, B is 1, C is 2, and so on up to Z, which is 25.',
  };
}

const FIRST_SECRET = caesar('WELL DONE YOU FOUND THE KEY', 7);
const LONG_SECRET = caesar('EVERY SECRET NEEDS A KEY. THE BEST KEYS ARE THE ONES NOBODY ELSE CAN GUESS.', 9);

export default {
  id: 'secret-codes',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A message from Caesar',
      text: `
        Julius Caesar is said to have written his private letters in a simple code. One of his orders might have looked like this:

        **DWWDFN DW GDZQ**

        Can you guess what it says? Look at the pattern of repeated letters.
      `,
      options: [
        { text: 'ATTACK AT DAWN', correct: true },
        { text: 'RETURN TO ROME' },
        { text: 'FOLLOW ME HOME' },
        { text: 'BEWARE OF FIRE' },
      ],
      explain: `
        **ATTACK AT DAWN.** The pattern gives it away: D-W-W-D has the same shape as A-T-T-A.

        According to the Roman historian Suetonius, Caesar replaced every letter by the one **three places further on** in the alphabet:
        A became D, B became E, and so on.
      `,
    },
    {
      id: 'teach-caesar',
      type: 'info',
      title: 'A cipher and its key',
      text: `
        A **cipher** is a rule for scrambling a message. Caesar's rule moves every letter on by the same number of places.
        That number is the **key**. Caesar's key was 3.

        :::example Key 3
        - To **encode**, move each letter 3 places on: A becomes D and T becomes W, so ATTACK becomes DWWDFN.
        - At the end, the alphabet wraps round: X becomes A, Y becomes B, Z becomes C.
        - To **decode**, move each letter 3 places back: D becomes A again.
        :::

        On the wheel, the outer ring is the ordinary alphabet and the inner ring is the secret one, turned by 3 places.
      `,
      figure: {
        type: 'cipher-wheel', text: 'ATTACK AT DAWN', mode: 'encode', shift: 3, static: true,
        alt: 'A cipher wheel with two rings of letters. The inner ring is turned 3 places, so that D sits under A, E under B, and so on. Below it, ATTACK AT DAWN is encoded as DWWDFN DW GDZQ.',
      },
    },
    {
      id: 'wheel',
      type: 'interact',
      title: 'Turn the wheel',
      text: `
        This wheel does Caesar's trick with any number of places. The outer ring is the ordinary alphabet; the inner ring is the secret one.

        A new message has arrived, and its key is not 3. **Turn the wheel, or drag the slider, until the message makes sense.**
      `,
      widget: { type: 'cipher-wheel', text: FIRST_SECRET, mode: 'decode' },
      check: (s) => {
        if (s.shift === 7) return true;
        if (s.shift === 0) return 'Key 0 moves nothing. Turn the wheel and watch the yellow line.';
        return 'Still gibberish. Keep turning: there are only 25 keys to try.';
      },
      solution: { shift: 7 },
      attempts: 6,
      hints: ['Go through the keys one at a time and read the yellow line after each step.'],
      explain: `
        Key **7** does it. Nobody told you the key: you simply tried them until one worked.

        Remember how easy that was. It is about to matter.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'A code is arithmetic',
      text: r`
        Number the letters, starting from 0. Then a Caesar cipher with key $k$ is nothing but **addition on a clock with 26 places**:

        $$ \text{secret letter} = (\text{letter} + k) \bmod 26 $$

        Take key 3. H is 7, and $7 + 3 = 10$, which is K. Near the end of the alphabet the clock wraps round:
        Y is 24, and $(24 + 3) \bmod 26 = 1$, which is B.

        To decode, subtract the key instead.
      `,
      figure: alphabetStrip(),
    },
    {
      id: 'encode',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const k = rng.int(4, 12); // never 3: Caesar's own key is the lesson's worked example
        const wraps = rng.bool(0.6);
        const i = wraps ? rng.int(26 - k, 25) : rng.int(0, 25 - k);
        const j = (i + k) % 26;
        return {
          text: `Encode the letter **${ALPHABET[i]}** with a Caesar cipher, key **${k}**. The letters are numbered from A = 0 to Z = 25.`,
          figure: alphabetStrip(),
          template: r`**${ALPHABET[i]}** is letter number [[${i}]]. Add the key: $(${i} + ${k}) \bmod 26 =$ [[${j}]], which is the letter [[${ALPHABET[j]}]].`,
          hints: [wraps ? `${i} + ${k} goes past 25, so the clock wraps round: subtract 26.` : `Find ${ALPHABET[i]} in the table, then count on ${k} places.`],
          explain: wraps
            ? r`$${i} + ${k} = ${i + k}$, which is past the end of the alphabet. The clock wraps round: $${i + k} - 26 = ${j}$, and letter ${j} is **${ALPHABET[j]}**.`
            : r`$${i} + ${k} = ${j}$, and letter ${j} is **${ALPHABET[j]}**. No wrapping was needed this time.`,
        };
      },
    },
    {
      id: 'how-many-keys',
      type: 'numeric',
      text: 'A Caesar cipher moves every letter on by the same number of places. **How many different keys are there that actually change the message?**',
      answer: 25,
      wrong: [
        [26, 'Moving every letter on 26 places brings each one back to itself, just like key 0. That key changes nothing.'],
        [24, 'Count again: keys 1, 2, 3, … up to the last one that is not a full turn.'],
      ],
      hints: ['Keys 1, 2, 3, … How far can you go before the alphabet is back where it started?'],
      explain: 'Keys 1 to 25 give 25 different codes. Key 26 is the same as key 0, key 27 the same as key 1, and so on: it is arithmetic mod 26.',
    },
    {
      id: 'crack',
      type: 'interact',
      title: 'Break it without trying every key',
      text: `
        There is an even faster attack than trying all 25 keys. In English, **E** is by far the most common letter.

        Under this message you can see which letters turn up most often in the secret. **Use that clue to find the key.**
      `,
      widget: { type: 'cipher-wheel', text: LONG_SECRET, mode: 'decode', top: 3 },
      check: (s) => {
        if (s.shift === 9) return true;
        if (s.shift === 0) return 'Find E on the outer ring. Which secret letter is probably standing in for it?';
        return 'Not readable yet. The most common secret letter is probably E in disguise: turn the wheel until it sits under E.';
      },
      solution: { shift: 9 },
      attempts: 6,
      hints: [
        'The most common letter in the secret is N. It is probably standing in for E.',
        'Turn the inner ring until N sits under E on the outer ring.',
        'N is letter 13 and E is letter 4. The key is the difference.',
      ],
      explain: r`
        The most common secret letter, N, is E in disguise. N is 13 and E is 4, so the key is $13 - 4 = 9$.

        This attack is called **frequency analysis**. The Arab scholar al-Kindi described it in the 9th century, and it breaks far more complicated letter codes than Caesar's.
      `,
    },
    {
      id: 'why-weak',
      type: 'choice',
      review: true,
      text: 'A spy intercepts a message written in a Caesar cipher. **What is the main reason it is so easy to break?**',
      options: [
        { text: 'There are only 25 possible keys, so every one of them can be tried', correct: true },
        { text: 'The alphabet has too few letters', why: 'Modern codes scramble just two symbols, 0 and 1. What matters is the number of *keys*, not the number of symbols.' },
        { text: 'Adding is too simple an operation to hide anything', why: 'Modern ciphers are built from simple operations too. The trouble here is how few keys there are to try.' },
        { text: 'It only works for short messages', why: 'The other way round: the longer a message is, the more clearly its letter pattern shows.' },
      ],
      explain: r`
        With 25 keys an attacker just tries them all. That is called a **brute-force attack**.

        A good cipher needs so many possible keys that trying them all is hopeless, and no shortcut like letter counting either.
        One widely used modern cipher, AES, has more than $10^{38}$ keys.
      `,
    },
    {
      id: 'multiply',
      type: 'numeric',
      title: 'A one-way street',
      text: `
        Modern codes are built on things that are easy to do but hard to undo. Here is the most famous one, starting with the easy direction.

        **Multiply the two primes 37 and 61.** Use pencil and paper, or a calculator.
      `,
      answer: 2257,
      hints: [r`$37 \times 61 = 37 \times 60 + 37$`],
      explain: r`
        $37 \times 61 = 2257$. One multiplication: a minute by hand, an instant on a calculator.

        A computer multiplies two primes that are hundreds of digits long in well under a millisecond.
      `,
    },
    {
      id: 'hunt',
      type: 'interact',
      title: 'Now go backwards',
      text: `
        Somebody else multiplied two primes and got **2491**. They are keeping the two primes secret.

        **Find them.** Tap a prime to try dividing by it.
      `,
      widget: { type: 'factor-hunt', n: 2491 },
      check: (s) => {
        if (s.found) return true;
        if (!s.tries) return 'Tap a prime to test whether it divides 2491.';
        return `No luck after ${plural(s.tries, 'division')}. Keep hunting.`;
      },
      solution: { tried: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47] },
      attempts: 8,
      hints: [
        'Your divisibility tests can save a few tries: 2491 is odd, it does not end in 0 or 5, and its digits add up to 16.',
        'If the two primes are close together, both are near the square root of 2491, which is just under 50.',
      ],
      explain: r`
        $2491 = 47 \times 53$.

        Forwards took one multiplication. Backwards, with no clues, means testing prime after prime: 15 divisions if you start from 2, and this is only a four-digit number.
      `,
    },
    {
      id: 'scale',
      type: 'choice',
      title: 'It gets worse. Much worse.',
      text: `
        Here is the most work that method can take: the number of primes you might have to try before you find a factor.

        | Digits in the number | Primes to try |
        |:--------------------:|--------------:|
        | 4 | 25 |
        | 8 | 1,229 |
        | 16 | 5,761,455 |

        **What happens to the work each time the number of digits doubles?**
      `,
      options: [
        { text: 'It explodes: it is multiplied by a bigger factor every time', correct: true },
        { text: 'It roughly doubles', why: 'From 25 to 1,229 is about fifty times as much, not twice.' },
        { text: 'It goes up by about the same amount each time', why: 'The first jump is about 1,200. The second is more than five million.' },
        { text: 'It starts to level off', why: 'Compare the jumps: about 1,200, then more than five million. The growth is speeding up.' },
      ],
      explain: `
        From 4 to 8 digits the work grows about 50-fold; from 8 to 16 digits, almost 5,000-fold. Every two extra digits make this search around eight times longer.

        The numbers used in real cryptography have more than **600 digits**. There are far cleverer methods than trying primes one by one, but they run out of steam too:
        in 2020 a 250-digit number of this kind was factored, a record at the time, and it took the equivalent of about 2,700 years of work for a single processor.
      `,
    },
    {
      id: 'rsa',
      type: 'info',
      title: 'A padlock anyone can close',
      text: r`
        Here is how that one-way street protects you.

        A website picks two huge secret primes and multiplies them. The product, $N$, is published for the whole world to see. It works like an **open padlock**:

        - **Anyone** can use $N$ to scramble a message for the site. The scrambling is clock arithmetic, on a clock with $N$ places.
        - **Unscrambling** takes a key made from the two secret primes. Nobody has found a practical way to do it without them.

        This idea is called **public-key cryptography**. The version built on multiplying primes is **RSA**, named after Rivest, Shamir and Adleman, who described it in 1977.
        Methods like it are at work whenever your browser shows a padlock.

        :::note The honest small print
        Nobody has *proved* that factoring must be slow. It is just that a very long search has turned up no fast method for ordinary computers.
        A large enough quantum computer could do it, which is why newer codes, built on other one-way streets, are now being introduced.
        :::
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements are **true**?',
      options: [
        { text: 'A Caesar cipher is addition on a clock with 26 places', correct: true },
        { text: 'Multiplying two large primes is quick, but getting them back from the product is extremely slow with every method known for ordinary computers', correct: true },
        { text: 'In RSA the product of the two primes can be made public; only the primes themselves must stay secret', correct: true },
        { text: 'It has been proved that no fast way to factor large numbers can exist', why: 'That is still an open question. The security rests on the fact that nobody has found one, despite a very long search.' },
        { text: 'A Caesar cipher is safe as long as the key is kept secret', why: 'With only 25 keys an attacker can simply try them all, and counting letters is quicker still.' },
      ],
      explain: `
        Old codes relied on keeping the *method* secret. Modern ones publish the method, and even part of the key,
        and rely instead on a problem that is easy in one direction and hard in the other.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        One thing to put in your own words before going on:

        **How can a website publish a number for everyone to see, and still keep its messages secret?**
      `,
      model: `
        The published number is the product of two huge secret primes. Multiplying them was easy for the website,
        but nobody else can split the product back into its primes in any reasonable time. The product is enough to
        *lock* a message. Unlocking needs the primes, and those never leave the website.
      `,
    },
  ],
  recap: [
    'A Caesar cipher adds a key to every letter, mod 26. With only 25 keys it falls to brute force, or to counting letters.',
    'A good cipher needs so many keys that trying them all is hopeless.',
    'Multiplying two primes is easy; finding them again from the product is hard. That one-way street is the heart of RSA.',
    'Divisibility, primes, gcds and clock arithmetic: the ideas of this course guard the messages you send every day.',
  ],
  next: 'Next: what is actually inside that padlock. It starts with a strange fact about powers.',
};
