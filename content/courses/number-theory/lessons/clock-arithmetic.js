// The Secret Life of Numbers · Lesson 4 · Arithmetic on a Clock
import { r, gcd } from '../../../kit.js';
import { mod, DAYS, DAYS_SHORT, listAnd } from '../helpers.js';

/** The faces of a 12-hour clock, starting at the top: the place called 12 does the job of 0. */
const HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export default {
  id: 'clock-arithmetic',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A hundred hours',
      text: "It is **9 o'clock**. What will this clock show **100 hours** from now?",
      figure: {
        type: 'mod-clock', m: 12, labels: HOURS, start: 9, static: true, equation: false, maxWidth: 300,
        alt: 'A 12-hour clock face with a single hand pointing at 9.',
      },
      shuffle: false,
      options: [
        { text: "1 o'clock", correct: true },
        { text: "4 o'clock" },
        { text: "7 o'clock" },
        { text: "9 o'clock" },
      ],
      explain: r`
        Every 12 hours the hand is back where it started, so full turns do not matter.
        $100 = 8 \times 12 + 4$: eight full turns, then 4 more hours.

        Four hours after 9 o'clock is **1 o'clock**.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Round and round',
      text: `
        Try it yourself. The slider moves the hand on from 9 o'clock, one hour at a time.

        After 5 hours the hand is on 2. **Find a number of hours bigger than 12 that also lands on 2.**
      `,
      widget: { type: 'mod-clock', m: 12, labels: HOURS, start: 9, max: 48, nLabel: 'hours later', equation: 'steps' },
      check: (s) => {
        if (s.label === '2' && s.n > 12) return true;
        if (s.label === '2') return 'That is the 5 hours from the question. Keep going round: which bigger number lands on 2 again?';
        if (s.n <= 12) return 'Go further: more than 12 hours.';
        return `After ${s.n} hours the hand is on ${s.label}. You want it on 2.`;
      },
      solution: { n: 17 },
      attempts: 6,
      hints: ['One full turn takes 12 hours and changes nothing.', 'So try 5 + 12.'],
      explain: `
        **17, 29 and 41** all land on 2: each is 5 plus a whole number of turns.

        Numbers that differ by a multiple of 12 always end up in the same place.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Arithmetic that wraps around',
      text: r`
        On a clock, only the **remainder** after dividing by 12 matters. Mathematicians write it with the word **mod**:
        read "$17 \bmod 12$" as *the remainder when 17 is divided by 12*.

        :::example
        - $17 = 1 \times 12 + 5$, so $17 \bmod 12 = 5$
        - $100 = 8 \times 12 + 4$, so $100 \bmod 12 = 4$
        - $12 = 1 \times 12 + 0$, so $12 \bmod 12 = 0$: a full turn leaves nothing over
        :::

        The clock does not need 12 places. One with $m$ places counts $0, 1, 2, \dots$ up to $m - 1$, then starts again at 0.
        Arithmetic done this way is called **modular arithmetic**. You already use it for hours, weekdays and months.

        :::note
        On a real clock face the place at the top is labelled 12, but it does the job of 0: twelve hours on, you are back at the start.
        :::
      `,
    },
    {
      id: 'mod-practice',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.int(3, 12);
        let q = rng.int(2, 11);
        const rem = rng.bool(0.15) ? 0 : rng.int(1, m - 1);
        if (m === 12 && q === 8 && rem === 4) q = 9; // 100 mod 12 is the lesson's worked example
        const n = q * m + rem;
        return {
          text: r`What is $${n} \bmod ${m}$?`,
          answer: rem,
          wrong: [
            [q, `${q} is how many times ${m} fits into ${n}. The answer is what is *left over*.`],
            [n, `${n} is far more than a full turn. Take away as many ${m}s as you can.`],
          ],
          feedback: (v) => (v >= m ? `A remainder after dividing by ${m} is always less than ${m}.` : null),
          hints: [`How many whole ${m}s fit into ${n}? What is left over?`, r`$${q} \times ${m} = ${q * m}$. How far is that from ${n}?`],
          explain: rem
            ? r`$${n} = ${q} \times ${m} + ${rem}$, so $${n} \bmod ${m} = ${rem}$.`
            : r`$${n} = ${q} \times ${m}$ exactly: nothing is left over, so $${n} \bmod ${m} = 0$. On a clock with ${m} places, ${n} steps bring you back to the start.`,
        };
      },
    },
    {
      id: 'week',
      type: 'choice',
      title: 'A clock with seven places',
      text: `
        The days of the week go round a clock with 7 places.

        Today is **Wednesday**. Use the day-clock to find out: what day will it be **23 days** from now?
      `,
      figure: {
        type: 'mod-clock', m: 7, labels: DAYS_SHORT, start: 2, max: 30, nLabel: 'days later', equation: 'steps', maxWidth: 380,
        alt: 'A clock with seven places, one for each day of the week. The hand starts on Wednesday and a slider moves it forward day by day.',
      },
      shuffle: false,
      options: [
        { text: 'Wednesday', why: 'That would be exactly three weeks: 21 days. You need two more.' },
        { text: 'Thursday', why: 'That is 22 days from now, one short.' },
        { text: 'Friday', correct: true },
        { text: 'Saturday', why: 'That is 24 days from now, one too many.' },
      ],
      explain: r`
        $23 = 3 \times 7 + 2$. Three whole weeks change nothing; then count on two days: Thursday, **Friday**.

        In the new language: $23 \bmod 7 = 2$.
      `,
    },
    {
      id: 'day-of-week',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const start = rng.int(0, 6);
        const n = rng.pick([30, 45, 60, 75, 100, 200, 365, 500, 1000]);
        const rem = n % 7;
        const q = (n - rem) / 7;
        const offsets = [];
        for (const candidate of [0, rem + 1, rem - 1, rem + 2, rem + 3]) {
          const off = mod(candidate, 7);
          if (off !== rem && !offsets.includes(off) && offsets.length < 3) offsets.push(off);
        }
        const day = (off) => DAYS[(start + off) % 7];
        const options = [{ off: rem, correct: true }, ...offsets.map((off) => ({ off }))]
          .sort((p, q2) => p.off - q2.off)
          .map(({ off, correct }) => {
            if (correct) return { text: day(off), correct: true };
            if (off === 0) return { text: day(off), why: `It would be ${day(0)} again only after a whole number of weeks, and ${n} is not a multiple of 7.` };
            return { text: day(off) };
          });
        return {
          text: `Today is **${DAYS[start]}**. What day of the week will it be in **${n} days**?`,
          shuffle: false,
          options,
          hints: ['Whole weeks do not change the day. Only the days left over matter.', `What is ${n} mod 7?`],
          explain: r`
            $${n} = ${q} \times 7 + ${rem}$. The ${q} whole weeks bring you back to ${DAYS[start]}; ${rem} more ${rem === 1 ? 'day takes' : 'days take'} you to **${day(rem)}**.
          `,
        };
      },
    },
    {
      id: 'add-first',
      type: 'fill',
      title: 'Throw away the full turns first',
      text: r`
        What is $(61 + 45) \bmod 7$? You could add first: $61 + 45 = 106 = 15 \times 7 + 1$, so the answer is 1.

        Or you could shrink each number **before** adding. Try it:
      `,
      template: r`
        $61 \bmod 7 =$ [[5]]

        $45 \bmod 7 =$ [[3]]

        Now add the two remainders and reduce once more:

        $(5 + 3) \bmod 7 =$ [[1]]
      `,
      hints: [r`$8 \times 7 = 56$ and $6 \times 7 = 42$.`],
      explain: r`
        The same answer, 1, with much smaller numbers: $61 = 8 \times 7 + 5$ and $45 = 6 \times 7 + 3$, and the full turns never mattered.
      `,
    },
    {
      id: 'multiply',
      type: 'numeric',
      title: 'Multiplying on a clock',
      text: r`
        Multiplying is repeated adding: $5 \times 4$ means five hops of 4.

        This clock has 7 places, numbered 0 to 6. **Make 5 hops of 4.** Where does the hand land?
      `,
      figure: {
        type: 'mod-clock', m: 7, hop: 4, max: 14, nLabel: 'hops of 4', equation: false, maxWidth: 380,
        alt: 'A clock with seven places numbered 0 to 6. A slider makes the hand take hops of 4 places at a time.',
      },
      answer: 6,
      wrong: [
        [20, r`That is $5 \times 4$ on an ordinary number line. On this clock the numbers stop at 6: where is the hand pointing?`],
        [2, 'That is how many full turns the hand made. Where did it stop?'],
      ],
      hints: ['Move the slider to 5 and read off where the hand points.'],
      explain: r`
        $5 \times 4 = 20 = 2 \times 7 + 6$: the hand goes round twice and stops on **6**. So $(5 \times 4) \bmod 7 = 6$.

        Now try 12 hops: the hand lands on 6 again. Seven hops of 4 make exactly four full turns, so they change nothing, and you may swap 12 for $12 \bmod 7 = 5$ before multiplying.
      `,
    },
    {
      id: 'teach-reduce-first',
      type: 'info',
      title: 'Reduce first, then calculate',
      text: r`
        Full turns can be thrown away **at any moment**: before you add or multiply, after, or both. The answer is the same, and the numbers stay small. That is what makes modular arithmetic so handy.

        :::example On a clock with 10 places
        **Adding:** $(47 + 36) \bmod 10$

        - $47 \bmod 10 = 7$ and $36 \bmod 10 = 6$
        - $7 + 6 = 13$, and $13 \bmod 10 = 3$

        **Multiplying:** $(47 \times 36) \bmod 10$

        - the same remainders, 7 and 6
        - $7 \times 6 = 42$, and $42 \bmod 10 = 2$
        :::

        The long way agrees: $47 + 36 = 83$ and $47 \times 36 = 1692$. (Mod 10 is simply the last digit.)
      `,
    },
    {
      id: 'mixed',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const m = rng.pick([5, 6, 7, 8, 9, 11, 12]);
        const times = rng.bool(0.5);
        const r1 = rng.int(1, m - 1);
        const r2 = rng.int(1, m - 1);
        const a = r1 + m * rng.int(2, times ? 4 : 9);
        const b = r2 + m * rng.int(1, times ? 3 : 8);
        const op = times ? r`\times` : '+';
        const raw = times ? a * b : a + b;
        const small = times ? r1 * r2 : r1 + r2;
        const answer = raw % m;
        return {
          text: r`Work out $(${a} ${op} ${b}) \bmod ${m}$.`,
          answer,
          wrong: [
            [small, `Nearly: ${small} is still ${small === m ? 'a full turn' : `more than ${m - 1}`}. Reduce it once more.`],
            [raw, `That is the ordinary answer. Now find its remainder when divided by ${m}.`],
          ],
          feedback: (v) => (v >= m ? `An answer mod ${m} is always one of 0, 1, …, ${m - 1}.` : null),
          hints: [
            `Shrink the numbers first: what are ${a} mod ${m} and ${b} mod ${m}?`,
            `The remainders are ${r1} and ${r2}. ${times ? 'Multiply' : 'Add'} them, then reduce mod ${m} again if you need to.`,
          ],
          explain: r`
            Reduce first: $${a} \bmod ${m} = ${r1}$ and $${b} \bmod ${m} = ${r2}$. Then $${r1} ${op} ${r2} = ${small}$${small >= m ? r`, and $${small} \bmod ${m} = ${answer}$` : ''}.

            The long way agrees: $${a} ${op} ${b} = ${raw} = ${Math.floor(raw / m)} \times ${m} + ${answer}$.
          `,
        };
      },
    },
    {
      id: 'night-trip',
      type: 'numeric',
      gen: (rng) => {
        const depart = rng.int(14, 23);
        const hours = rng.int(26 - depart, 32);
        const total = depart + hours;
        const answer = total % 24;
        const days = Math.floor(total / 24);
        const what = rng.pick(['A night train', 'A ferry', 'A long-distance coach', 'A cargo ship']);
        return {
          text: `${what} leaves at **${depart}:00** and the journey takes **${hours} hours**, all in one time zone. What does a 24-hour clock show when it arrives?`,
          answer,
          unit: ':00',
          wrong: [
            [total, `A 24-hour clock never shows ${total}. Take away the full days.`],
            [hours % 24, `That is ${hours} mod 24. Do not forget that the clock started at ${depart}, not at 0.`],
          ],
          feedback: (v) => (v >= 24 ? 'A 24-hour clock only shows the hours 0 to 23.' : null),
          hints: [`A 24-hour clock is a clock with 24 places. Add first: ${depart} + ${hours}.`, `Now find ${total} mod 24.`],
          explain: r`
            $${depart} + ${hours} = ${total} = ${days} \times 24 + ${answer}$, so $${total} \bmod 24 = ${answer}$.
            It arrives at **${answer}:00**, ${days === 1 ? 'the next day' : 'two days later'}.
          `,
        };
      },
    },
    {
      id: 'teach-check-digit',
      type: 'info',
      title: 'Catching typos',
      text: r`
        The long numbers on barcodes, books and bank cards end in a **check digit**, chosen with modular arithmetic so that typing mistakes can be caught.

        Here is a simple version: the last digit is chosen so that **all the digits add up to 0 mod 10**.

        :::example A code starts 7 5 4. What is its check digit?
        - $7 + 5 + 4 = 16$
        - the next multiple of 10 is 20, so the check digit is $20 - 16 = 4$
        - check: $7 + 5 + 4 + 4 = 20$, and $20 \bmod 10 = 0$
        :::

        Now suppose someone types 7 5 **9** 4 by mistake. The digits add up to 25, which is not 0 mod 10, so a computer can refuse the number at once.
      `,
    },
    {
      id: 'check-digit',
      type: 'numeric',
      gen: (rng) => {
        const digits = [rng.int(1, 9), rng.int(0, 9), rng.int(0, 9), rng.int(0, 9)];
        const sum = digits.reduce((t, d) => t + d, 0);
        const answer = (10 - (sum % 10)) % 10;
        return {
          text: r`
            The last digit of this code is its check digit, chosen so that **all the digits add up to 0 mod 10**. Which digit completes the code?

            $$ ${digits.join(r`\;`)}\;\square $$
          `,
          answer,
          wrong: [[sum % 10, `${sum % 10} is the remainder of the first four digits. You need the digit that *tops the total up* to a multiple of 10.`]],
          feedback: (v) => (Number.isInteger(v) && v >= 0 && v <= 9 ? `With ${v} the digits add up to ${sum + v}, and ${sum + v} mod 10 is ${(sum + v) % 10}, not 0.` : 'The check digit is a single digit, 0 to 9.'),
          hints: [`The four digits you can see add up to ${sum}.`, 'What must you add to reach the next multiple of 10?'],
          explain: r`
            $${digits.join(' + ')} = ${sum}$. ${answer === 0 ? 'That is already a multiple of 10, so the check digit is **0**.' : r`Adding **${answer}** makes ${sum + answer}, and $${sum + answer} \bmod 10 = 0$.`}

            Real schemes, such as the one on barcodes, use a slightly cleverer weighted sum that also catches most swapped digits.
          `,
        };
      },
    },
    {
      id: 'hops',
      type: 'interact',
      stretch: true,
      title: 'Which hops reach everywhere?',
      text: `
        On this 12-place clock the hand has made 12 hops of 4. It only ever lands on three places.

        **Find a hop size bigger than 1 that lands on all 12 places.**
      `,
      widget: { type: 'mod-clock', m: 12, hop: 4, hopRange: [1, 11], n: 12, max: 12, equation: false },
      check: (s) => {
        if (s.n < 12) return 'Make all 12 hops first: move the "hops" slider to the end.';
        if (s.hop === 1) return 'Hops of 1 certainly reach everywhere. Find a bigger hop size that does too.';
        if (s.count === 12) return true;
        const g = gcd(s.hop, 12);
        return `Hops of ${s.hop} reach only ${s.count} places. Both ${s.hop} and 12 are multiples of ${g}, so the hand never leaves the multiples of ${g}.`;
      },
      solution: { hop: 5, n: 12 },
      attempts: 8,
      hints: [
        'Try each hop size in turn and watch the "positions reached" count.',
        'Hop sizes 2, 3, 4, 6, 8, 9 and 10 all get trapped. What does each of them share with 12?',
      ],
      explain: r`
        **5, 7 and 11** work. They are exactly the hop sizes that share no factor with 12: $\gcd(\text{hop}, 12) = 1$.

        A hop size that does share a factor with 12 gets trapped: hops of 4 only ever visit 0, 4 and 8.
        The gcd from the last lesson decides what multiplication can do on a clock.
      `,
    },
    {
      id: 'same-place',
      type: 'multi',
      review: true,
      gen: (rng) => {
        const m = rng.int(5, 9);
        const rem = rng.int(1, m - 1);
        const ref = rem + m * rng.int(1, 2);
        const same = [rem + m * rng.int(4, 6), rem + m * rng.int(8, 12)];
        if (rng.bool(0.5)) same.push(rem);
        const others = [1, -1, 2].map((off) => mod(rem + off, m) + m * rng.int(3, 11));
        const options = [
          ...same.map((v) => ({ value: v, correct: true })),
          ...others.map((v) => ({ value: v, why: `$${v} \\bmod ${m} = ${v % m}$, but $${ref} \\bmod ${m} = ${rem}$.` })),
        ].sort((p, q) => p.value - q.value).map(({ value, ...rest }) => ({ text: String(value), ...rest }));
        return {
          text: `
            Which of these numbers land on the **same place** as ${ref} on a clock with ${m} places?

            (Put another way: which leave the same remainder as ${ref} when divided by ${m}?)
          `,
          shuffle: false,
          options,
          hints: [`First find ${ref} mod ${m}.`, `${ref} leaves remainder ${rem}. Now test each number: is it ${rem} more than a multiple of ${m}?`],
          explain: `
            ${ref} leaves remainder ${rem} when divided by ${m}. So do ${listAnd(same.slice().sort((p, q) => p - q))}:
            each differs from ${ref} by a multiple of ${m}, which is just a number of full turns.
          `,
        };
      },
    },
  ],
  recap: [
    '$a \\bmod m$ is the remainder when $a$ is divided by $m$: where you land on a clock with $m$ places.',
    'Numbers that differ by a multiple of $m$ land on the same place.',
    'You can reduce mod $m$ before or after adding and multiplying. The answer is the same.',
    'Weekdays, 24-hour time and check digits are all modular arithmetic.',
  ],
  next: 'Next: put clock arithmetic to work, first breaking a 2,000-year-old code and then meeting the idea that guards the internet.',
};
