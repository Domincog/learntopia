// The Secret Life of Numbers · Lesson 1 · What Divides What
import { r, range } from '../../../kit.js';
import { factorsOf, digitSum, commas, listAnd } from '../helpers.js';

/** "Every ten is 9 + 1, every hundred is 99 + 1": a rod of ten and a block of a hundred, each with one square picked out. */
function ninesFigure() {
  const u = 16; // rod
  const rx = 22;
  const ry = 62;
  let rodLines = '';
  for (let i = 1; i < 10; i++) rodLines += `M${rx + i * u} ${ry}v${u}`;
  const g = 11; // block
  const gx = 226;
  const gy = 14;
  let gridLines = '';
  for (let i = 1; i < 10; i++) gridLines += `M${gx + i * g} ${gy}v${10 * g}M${gx} ${gy + i * g}h${10 * g}`;
  return {
    type: 'svg',
    viewBox: '0 0 360 166',
    maxWidth: 420,
    alt: 'A rod of ten squares with its last square picked out: 10 = 9 + 1. A block of one hundred squares with one corner square picked out: 100 = 99 + 1.',
    content:
      `<rect class="fill-blue-soft" x="${rx}" y="${ry}" width="${10 * u}" height="${u}"/>` +
      `<rect class="fill-orange" x="${rx + 9 * u}" y="${ry}" width="${u}" height="${u}"/>` +
      `<path class="stroke-ink fill-none" stroke-width="1.5" d="${rodLines}"/>` +
      `<rect class="stroke-ink fill-none" stroke-width="2.5" x="${rx}" y="${ry}" width="${10 * u}" height="${u}" rx="2"/>` +
      `<text class="fig-label" x="${rx + 5 * u}" y="${ry + u + 26}" text-anchor="middle">10 = 9 + <tspan class="text-orange">1</tspan></text>` +
      `<rect class="fill-blue-soft" x="${gx}" y="${gy}" width="${10 * g}" height="${10 * g}"/>` +
      `<rect class="fill-orange" x="${gx + 9 * g}" y="${gy + 9 * g}" width="${g}" height="${g}"/>` +
      `<path class="stroke-ink fill-none" stroke-width="1" d="${gridLines}"/>` +
      `<rect class="stroke-ink fill-none" stroke-width="2.5" x="${gx}" y="${gy}" width="${10 * g}" height="${10 * g}" rx="2"/>` +
      `<text class="fig-label" x="${gx + 5 * g}" y="${gy + 10 * g + 26}" text-anchor="middle">100 = 99 + <tspan class="text-orange">1</tspan></text>`,
  };
}

/** The digits of n written out as a sum, for explanations: 4782 -> "4 + 7 + 8 + 2". */
const digitsPlus = (n) => String(n).split('').join(' + ');

export default {
  id: 'divisibility',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Picture day',
      text: `
        A photographer wants each class to stand in **equal rows**: no gaps, nobody left over.

        Which class size gives her the **most** ways to do it?
      `,
      shuffle: false,
      options: [
        { text: '23 students' },
        { text: '24 students', correct: true },
        { text: '25 students' },
        { text: '26 students' },
      ],
      explain: `
        **24** wins easily: it can stand in 1, 2, 3, 4, 6, 8, 12 or 24 equal rows. That is eight ways.

        26 has four ways, 25 has three, and 23 has just two: one long row, or 23 rows of one.
        A bigger class is not a more flexible one. What matters is which numbers **divide** the class size.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Line them up',
      text: `
        Here are the 24 students as dots. The slider deals them into rows.

        **Find every number of rows that uses all 24 dots, with none left over.**
      `,
      widget: { type: 'dot-rectangles', n: 24, rows: 5 },
      check: (s) => {
        if (s.complete) return true;
        const missing = s.factors.filter((f) => !s.found.includes(f));
        if (missing.every((f) => f === 1 || f === 24)) return 'Nearly there. Do not forget the two extremes: one long row, and 24 rows of one.';
        return `You have found ${s.found.length} so far, and there are more. Try every number of rows from 1 to 24.`;
      },
      solution: { rows: 24, found: [1, 2, 3, 4, 6, 8, 12, 24] },
      attempts: 6,
      hints: ['Slide slowly. A green outline means every row is full.', 'There are eight in all. The largest is 24 rows of one.'],
      explain: r`
        Eight row counts work: **1, 2, 3, 4, 6, 8, 12 and 24**.

        Look at what you collected: $3 \times 8$ and $8 \times 3$ are the same rectangle turned on its side. The ways come in **pairs**.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Factors and multiples',
      text: r`
        When 24 dots fill 3 equal rows, we say that **3 divides 24**, or that 24 is **divisible** by 3:

        $$ 24 = 3 \times 8 $$

        Two names come out of this one fact.

        - 3 is a **factor** of 24, and so is 8. (Some books say *divisor*.) The eight row counts you found, from 1 up to 24 itself, are all the factors of 24.
        - 24 is a **multiple** of 3, and of 8.

        :::key
        "3 divides 24", "3 is a factor of 24" and "24 is a multiple of 3" all say the same thing:
        **24 splits into equal groups of 3 with nothing left over.**
        :::
      `,
    },
    {
      id: 'remainder',
      type: 'numeric',
      title: 'When it does not fit',
      gen: (rng) => {
        const rows = rng.int(3, 6);
        const cols = rng.int(3, 7);
        const rem = rng.int(1, rows - 1);
        const n = rows * cols + rem;
        return {
          text: `**${n} dots** are dealt into **${rows} rows**. How many dots are left over in the unfinished column? That leftover is called the **remainder**.`,
          figure: {
            type: 'dot-rectangles', n, rows, static: true, maxWidth: 440,
            alt: `${n} dots dealt into ${rows} rows: ${cols} full columns, then an unfinished column.`,
          },
          answer: rem,
          wrong: [
            [cols, 'That is the number of full columns. Count the dots in the unfinished one: they are orange.'],
            [rows - rem, 'That is how many dots are *missing* from the last column. Count the orange dots that are there.'],
            [n, 'That is all the dots. How many of them sit in the unfinished column?'],
          ],
          explain: r`
            $${n} = ${rows} \times ${cols} + ${rem}$: ${cols} full columns use up ${rows * cols} dots, and ${rem} ${rem === 1 ? 'is' : 'are'} left.

            ${rows} divides ${n} only if the remainder is 0, and here it is not.
          `,
        };
      },
    },
    {
      id: 'factors-of',
      type: 'multi',
      review: true,
      gen: (rng) => {
        const n = rng.pick([18, 20, 28, 30, 36, 40, 42, 45, 48, 54, 56, 60]);
        const all = factorsOf(n);
        const middle = all.filter((f) => f > 2 && f < n);
        const yes = rng.sample(middle, 3);
        const edge = rng.pick([1, n, null]);
        if (edge) yes.push(edge);
        const no = rng.sample(range(4, n).filter((k) => n % k !== 0), 2);
        const multiple = n * rng.pick([2, 3]);
        const options = [
          ...yes.map((f) => ({ value: f, correct: true })),
          ...no.map((k) => ({ value: k, why: `${n} ÷ ${k} leaves a remainder: $${n} = ${k} \\times ${Math.floor(n / k)} + ${n % k}$.` })),
          { value: multiple, why: `${multiple} is a *multiple* of ${n}, not a factor. A factor of ${n} can never be bigger than ${n}.` },
        ].sort((p, q) => p.value - q.value).map(({ value, ...rest }) => ({ text: String(value), ...rest }));
        return {
          text: `Which of these numbers are **factors** of ${n}?`,
          shuffle: false,
          options,
          hints: [`A factor of ${n} divides it with nothing left over. Test each number: does ${n} split into equal groups of that size?`],
          explain: `
            The factors of ${n} are ${listAnd(all)}: each divides ${n} with no remainder.
            ${edge === n ? `That includes ${n} itself ($${n} = ${n} \\times 1$).` : edge === 1 ? 'That includes 1, which divides every number.' : ''}
            Numbers bigger than ${n}, such as ${multiple}, can be multiples of ${n} but never factors.
          `,
        };
      },
    },
    {
      id: 'sort-12',
      type: 'bucket',
      text: 'Sort these numbers by how they are related to **12**.',
      buckets: ['Factor of 12', 'Multiple of 12', 'Neither'],
      items: [
        { text: '3', bucket: 0, why: r`$12 = 3 \times 4$, so 3 divides 12: it is a factor.` },
        { text: '4', bucket: 0, why: r`$12 = 4 \times 3$, so 4 is a factor of 12.` },
        { text: '6', bucket: 0, why: r`$12 = 6 \times 2$, so 6 is a factor of 12.` },
        { text: '24', bucket: 1, why: r`$24 = 12 \times 2$: a multiple of 12. Factors of 12 cannot be bigger than 12.` },
        { text: '36', bucket: 1, why: r`$36 = 12 \times 3$: a multiple of 12.` },
        { text: '60', bucket: 1, why: r`$60 = 12 \times 5$: a multiple of 12.` },
        { text: '8', bucket: 2, why: '8 does not divide 12 (remainder 4), and 8 is too small to be a multiple of 12.' },
        { text: '18', bucket: 2, why: '18 is too big to be a factor of 12, and it is not a whole number of 12s either.' },
      ],
      explain: 'Factors of 12 are 12 or smaller; multiples of 12 are 12 or bigger. Only 12 itself is both.',
    },
    {
      id: 'teach-last-digit',
      type: 'info',
      title: 'Read the last digit',
      text: r`
        For some factors you do not need to divide at all. **The last digit is enough.**

        Every number is a pile of tens plus its last digit: $346 = 34 \times 10 + 6$.
        Tens are always divisible by 2 and by 5, because $10 = 2 \times 5$. So only the last digit decides.

        | Last digit | The number is divisible by |
        |:-----------|:---------------------------|
        | even: 0, 2, 4, 6 or 8 | **2** |
        | 0 or 5 | **5** |
        | 0 | **10**, and so by 2 and 5 as well |

        :::example
        - **346** ends in 6: divisible by 2, but not by 5 or 10.
        - **715** ends in 5: divisible by 5, but not by 2 or 10.
        - **870** ends in 0: divisible by 2, by 5 and by 10.
        :::
      `,
    },
    {
      id: 'last-digit',
      type: 'match',
      text: 'Match each number with what its **last digit** tells you.',
      pairs: [
        ['4,318', 'Divisible by 2, not by 5'],
        ['9,135', 'Divisible by 5, not by 2'],
        ['7,260', 'Divisible by 2 and by 5'],
        ['6,423', 'Divisible by neither'],
      ],
      explain: `
        Only the last digit was needed: 8 is even, 5 is a 5, 0 counts for both 2 and 5 (so 7,260 is divisible by 10 as well),
        and 3 is odd and is not 5.
      `,
    },
    {
      id: 'nines',
      type: 'choice',
      title: 'A stranger test',
      text: r`
        Here are the first few multiples of 9:

        **18, 27, 36, 45, 54, 63, 72, 81**

        Add up the **digits** of each one: $1 + 8$, then $2 + 7$, and so on. What do you find?
      `,
      options: [
        { text: 'The digits add up to 9 every time', correct: true },
        { text: 'The sums go up by 9 each time', why: r`Try the first two: $1 + 8 = 9$ and $2 + 7 = 9$. The sum stays where it is.` },
        { text: 'Every sum is different', why: r`Try the first two: $1 + 8 = 9$ and $2 + 7 = 9$.` },
        { text: 'The sums are always even', why: r`The very first one is odd: $1 + 8 = 9$.` },
      ],
      explain: r`
        Nine, every time: $1 + 8$, $2 + 7$, $3 + 6$ …

        It keeps working for bigger multiples, with one twist: $9 \times 11 = 99$ gives $9 + 9 = 18$.
        The digit sum of a multiple of 9 is always itself **a multiple of 9**.

        That cannot be a coincidence. So why does it happen?
      `,
    },
    {
      id: 'why-nines',
      type: 'fill',
      title: 'Why the digits know',
      text: `
        The secret is in the picture: every ten is **9 + 1** and every hundred is **99 + 1**.
        Divided by 9, each leaves exactly one unit over. Take 234 apart the same way:
      `,
      figure: ninesFigure(),
      template: r`

        | Part of 234 | Multiple of 9 | Left over |
        |-------------|---------------|:---------:|
        | 2 hundreds | $2 \times 99$ | 2 |
        | 3 tens | $3 \times 9$ | [[3]] |
        | 4 ones | none | 4 |

        The middle column is divisible by 9 whatever happens. The leftovers add up to [[9]], so 234 [[*is|is not]] divisible by 9.
      `,
      hints: ['Each ten is 9 + 1, so each ten leaves 1 over. How many tens are there in 234?', r`The leftovers are just the digits: $2 + 3 + 4$.`],
      explain: r`
        The leftovers are exactly the **digits** of 234, and $2 + 3 + 4 = 9$. Indeed $234 = 26 \times 9$.
      `,
    },
    {
      id: 'teach-digit-sum',
      type: 'info',
      title: 'The digit-sum test',
      text: r`
        The same split works for every number: it is a pile of 9s, 99s, 999s … plus the sum of its digits, its **digit sum**.
        The pile is always divisible by 9, so the digit sum alone decides.

        :::key
        A number is divisible by **9** exactly when its digit sum is.
        And because 9, 99, 999 … are also multiples of 3, the same test works for **3**.
        :::

        :::example
        - **738:** $7 + 3 + 8 = 18$, a multiple of 9 (and so of 3). 738 is divisible by both.
        - **582:** $5 + 8 + 2 = 15$, a multiple of 3 but not of 9. 582 is divisible by 3 only.
        - **415:** $4 + 1 + 5 = 10$, not a multiple of 3. 415 is divisible by neither.
        :::
      `,
    },
    {
      id: 'digit-sum',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const kind = rng.pick(['both', 'three', 'three', 'neither']);
        let n = 0;
        for (let guard = 0; guard < 500; guard++) {
          n = rng.int(1012, 98765);
          const sum = digitSum(n);
          const is = sum % 9 === 0 ? 'both' : sum % 3 === 0 ? 'three' : 'neither';
          if (is === kind && n % 10 !== 0) break;
        }
        const sum = digitSum(n);
        const by3 = sum % 3 === 0;
        const by9 = sum % 9 === 0;
        const verdict = by9
          ? `${sum} is divisible by 9 (and so by 3), so ${commas(n)} is divisible by both`
          : by3
            ? `${sum} is divisible by 3 but not by 9, and the same goes for ${commas(n)}`
            : `${sum} is not divisible by 3, so ${commas(n)} is divisible by neither 3 nor 9`;
        return {
          text: `Use the digit-sum test. Which is true of **${commas(n)}**?`,
          shuffle: false,
          options: [
            { text: 'It is divisible by 3 and by 9', correct: by9, why: by9 ? undefined : `The digit sum is ${sum}. Is that a multiple of 9?` },
            { text: 'It is divisible by 3 but not by 9', correct: by3 && !by9, why: by3 && !by9 ? undefined : `The digit sum is ${sum}. Check it against 3 and against 9.` },
            { text: 'It is divisible by 9 but not by 3', why: r`That can never happen: $9 = 3 \times 3$, so every multiple of 9 is a multiple of 3 as well.` },
            { text: 'It is divisible by neither', correct: !by3, why: !by3 ? undefined : `The digit sum is ${sum}, which is a multiple of 3.` },
          ],
          hints: ['Add up the digits.', `The digits add up to ${sum}. Is ${sum} divisible by 3? By 9?`],
          explain: r`The digits add up to $${digitsPlus(n)} = ${sum}$. ${verdict}.`,
        };
      },
    },
    {
      id: 'all-tests',
      type: 'multi',
      review: true,
      gen: (rng) => {
        const base = rng.pick([2, 3, 5, 6, 9, 10, 15, 18, 30, 45]);
        const n = base * rng.int(Math.ceil(1100 / base), Math.floor(9990 / base));
        const last = n % 10;
        const sum = digitSum(n);
        const lastWords = last === 0
          ? 'The last digit is 0, so 2, 5 and 10 all divide it.'
          : last === 5
            ? 'The last digit is 5: divisible by 5, but not by 2 or 10.'
            : last % 2 === 0
              ? `The last digit, ${last}, is even: divisible by 2, but not by 5 or 10.`
              : `The last digit, ${last}, is odd and is not 5, so 2, 5 and 10 are all out.`;
        const sumWords = sum % 9 === 0
          ? `The digits add up to ${sum}, a multiple of 9, so 9 and 3 both divide it.`
          : sum % 3 === 0
            ? `The digits add up to ${sum}: a multiple of 3 but not of 9.`
            : `The digits add up to ${sum}, which is not a multiple of 3, so 3 and 9 are out.`;
        const option = (d, why) => (n % d === 0 ? { text: String(d), correct: true } : { text: String(d), why });
        return {
          text: `No long division allowed. Which of these numbers divide **${commas(n)}**?`,
          shuffle: false,
          columns: 2,
          options: [
            option(2, `Look at the last digit: ${last} is odd.`),
            option(3, `The digits add up to ${sum}, which is not divisible by 3.`),
            option(5, `The last digit would have to be 0 or 5. It is ${last}.`),
            option(9, `The digits add up to ${sum}, which is not divisible by 9.`),
            option(10, `The last digit would have to be 0. It is ${last}.`),
          ],
          hints: ['Two things to look at: the last digit (for 2, 5 and 10) and the digit sum (for 3 and 9).', `The last digit is ${last} and the digits add up to ${sum}.`],
          explain: `${lastWords} ${sumWords}`,
        };
      },
    },
    {
      id: 'missing-digit',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        let digits = [];
        let sum = 0;
        for (let guard = 0; guard < 200; guard++) {
          digits = [rng.int(1, 9), rng.int(0, 9), rng.int(0, 9)];
          sum = digits[0] + digits[1] + digits[2];
          if (sum % 9 !== 0) break; // otherwise both 0 and 9 would work
        }
        const answer = 9 - (sum % 9);
        const hole = rng.int(1, 3); // position of the missing digit (never the first)
        const shown = digits.slice();
        shown.splice(hole, 0, r`\square`);
        const full = digits.slice();
        full.splice(hole, 0, answer);
        const number = Number(full.join(''));
        const target = sum + answer;
        return {
          text: r`
            One digit of this four-digit number is hidden. The number is **divisible by 9**.

            $$ ${shown.join(r`\;`)} $$

            What is the hidden digit?
          `,
          answer,
          feedback: (v) => (Number.isInteger(v) && v >= 0 && v <= 9
            ? `With ${v} in the gap the digits add up to ${sum + v}, and ${sum + v} is not a multiple of 9.`
            : 'The answer is a single digit, from 0 to 9.'),
          hints: [
            'A number is divisible by 9 exactly when its digits add up to a multiple of 9.',
            `The three digits you can see add up to ${sum}. What must be added to reach the next multiple of 9?`,
          ],
          explain: r`
            The visible digits add up to $${digits.join(' + ')} = ${sum}$. The next multiple of 9 is ${target}, so the hidden digit is $${target} - ${sum} = ${answer}$.

            Check: $${number} = 9 \times ${number / 9}$.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: "Adding up the digits to test for 9 is just a party trick. Nobody knows why it works."

        **What would you tell them?**
      `,
      model: `
        Every ten is 9 + 1 and every hundred is 99 + 1. So any number is a pile of 9s and 99s, which is always
        divisible by 9, plus one leftover unit for each ten and each hundred, plus its last digit. Those leftovers
        add up to exactly the **digit sum**. The pile never matters, so the digit sum alone decides.
      `,
    },
  ],
  recap: [
    '"3 divides 24" means 24 splits into equal groups of 3 with nothing left over. Then 3 is a **factor** of 24, and 24 is a **multiple** of 3.',
    'Factors come in pairs: every rectangle of dots gives two of them.',
    'The **last digit** settles divisibility by 2, 5 and 10.',
    'The **digit sum** settles divisibility by 3 and 9, because every ten is $9 + 1$.',
  ],
  next: 'Next: the stubborn numbers whose dots refuse to make any rectangle at all.',
};
