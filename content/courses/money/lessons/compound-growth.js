// Money: Financial Literacy for Real Life · Lesson 3 · Interest on Interest
//
// Driving question: why does money grow in a curve and not a line?
// Every rate in this lesson is an example. Nothing here is a forecast, and no return is guaranteed.
import { r, num } from '../../../kit.js';
import { PEOPLE, GROWTH_BIAS, compound, simple, effectiveRate, doublingYears, savedUp, money, paras, thousands } from '../helpers.js';

const HOOK = { start: 1000, rate: 7, years: 40 };
const HOOK_VALUE = compound(HOOK.start, HOOK.rate, HOOK.years);
const SAVERS = { pay: 2000, years: 40, aiko: [0, 10], ben: [10, 40], age: 25 };
const saver = (who, rate) => savedUp(SAVERS.pay, rate, SAVERS[who][0], SAVERS[who][1], SAVERS.years);

// The worked examples of the teaching screens: numbers that the generated questions cannot produce.
const EX = { principal: 3000, rate: 4, years: 3 };
EX.path = [1, 2, 3].map((n) => compound(EX.principal, EX.rate, n));
const RULE_EX = { rate: 5, years: 10 };
const EFF_EX = { nominal: 4 };
const PAYIN = { pay: 800, rate: 4 };
PAYIN.afterOne = PAYIN.pay * (1 + PAYIN.rate / 100);
PAYIN.afterTwo = (PAYIN.afterOne + PAYIN.pay) * (1 + PAYIN.rate / 100);

const TWO_LINES = [
  { id: 'compound', label: 'Compound', color: 'green', start: HOOK.start, rate: HOOK.rate },
  { id: 'simple', label: 'Simple', color: 'gray', start: HOOK.start, rate: HOOK.rate, simple: true, dashed: true },
];
const SAVER_LINES = [
  { id: 'aiko', label: 'Aiko', color: 'violet', start: 0, pay: SAVERS.pay, from: SAVERS.aiko[0], to: SAVERS.aiko[1], rate: 'rate' },
  { id: 'ben', label: 'Ben', color: 'orange', start: 0, pay: SAVERS.pay, from: SAVERS.ben[0], to: SAVERS.ben[1], rate: 'rate' },
];

export default {
  id: 'compound-growth',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Forty years, untouched',
      text: r`
        Someone puts ${money(HOOK.start)} into an account that pays ${HOOK.rate}% interest a year, and then forgets about it for ${HOOK.years} years. The interest is added to the account each year and left there.

        (${HOOK.rate}% is an example rate, chosen to make the sums easy to follow. Real rates change, and none is guaranteed.)

        **Roughly how much is in the account at the end?**
      `,
      min: 1000, max: 30000, step: 500, answer: 15000, tolerance: 2500, start: 1000, unit: 'dollars',
      explain: r`
        About **${money(Math.round(HOOK_VALUE))}**: fifteen times what went in.

        Most people guess far lower. ${HOOK.rate}% of ${money(HOOK.start)} is ${money(70)}, and ${HOOK.years} lots of ${money(70)} is ${money(2800)}, which would make ${money(simple(HOOK.start, HOOK.rate, HOOK.years))}. The real answer is four times that. Where the rest comes from is the subject of this lesson.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'A line and a curve',
      text: r`
        Two accounts start with ${money(HOOK.start)} at ${HOOK.rate}% a year.

        In the grey one the interest is paid out each year, so every year earns the same ${money(70)}. In the green one the interest **stays in the account**.

        **Slide the years from 5 to 40** and watch the two lines part.
      `,
      widget: {
        type: 'growth-curve', years: 5, yearsRange: [1, 40, 1], series: TWO_LINES, gap: ['compound', 'simple'], yMax: 16000,
        note: 'An example rate of 7% a year, added once a year. No tax or fees. Not a forecast.',
        alt: 'A chart of two accounts over up to 40 years: a straight line for interest that is paid out, and a rising curve for interest that is left in.',
      },
      check: (s) => s.years >= 40 || 'Slide all the way to 40 years.',
      solution: { years: 40 },
      explain: r`
        For the first few years the two are almost the same. After 40 years the grey line has reached ${money(simple(HOOK.start, HOOK.rate, HOOK.years))} and the green curve ${money(Math.round(HOOK_VALUE))}.

        The green account earns interest on its interest. Each year's interest is a little bigger than the last, because it is 7% of a bigger number.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Simple and compound',
      text: r`
        Interest paid only on the original sum is **simple interest**: the same amount every year, a straight line.

        Interest that is added to the sum, and then earns interest itself, is **compound interest**. Each year the balance is *multiplied* by the same factor:

        | Year | Simple | Compound |
        |---|--:|--:|
        | 0 | ${money(1000)} | ${money(1000)} |
        | 1 | ${money(1070)} | ${money(1070)} |
        | 2 | ${money(1140)} | ${money(1144.9, 2)} |
        | 3 | ${money(1210)} | ${money(1225.04, 2)} |

        After $n$ years at a yearly rate $r$, a starting sum $P$ has grown to $$ A = P(1 + r)^n $$ At 7%, $r = 0.07$: multiply by 1.07, once for every year.
      `,
    },
    {
      id: 'example-compound',
      type: 'info',
      title: 'Worked example: three years of compound interest',
      text: r`
        Tomás puts ${money(EX.principal)} into an account that pays ${EX.rate}% a year (an example rate) and leaves the interest in. What is there after ${EX.years} years?

        :::example
        1. As a decimal, ${EX.rate}% is ${EX.rate / 100}. Each year multiplies the balance by ${num(1 + EX.rate / 100)}.
        2. Year by year: ${money(EX.principal)} → ${money(EX.path[0])} → ${money(EX.path[1], 2)} → ${money(EX.path[2], 2)}.
        3. Or in one go, with the formula: $\mathord{${EX.principal} \times ${num(1 + EX.rate / 100)}^{${EX.years}} \approx ${num(EX.path[2], 2)}}$.
        4. To the nearest dollar: **${money(Math.round(EX.path[2]))}**.
        :::

        Simple interest would add the same ${money((EX.principal * EX.rate) / 100)} three times: ${money(simple(EX.principal, EX.rate, EX.years))}. The extra amount, about ${money(Math.round(EX.path[2]) - simple(EX.principal, EX.rate, EX.years))}, is interest earned on interest.
      `,
    },
    {
      id: 'calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const principal = rng.pick([500, 1000, 2000, 4000, 5000]);
        const rate = rng.pick([5, 10, 20]);
        const years = rng.pick([2, 3]);
        const value = compound(principal, rate, years);
        const factor = num(1 + rate / 100);
        return {
          text: r`
            ${name} puts **${money(principal)}** into an account that pays **${rate}%** a year (an example rate), and leaves the interest in the account.

            **How much is in the account after ${years} years?** Give the answer to the nearest dollar.
          `,
          answer: Math.round(value * 100) / 100,
          tolerance: 0.51,
          display: thousands(Math.round(value * 100) / 100, Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2),
          prefix: r`\$`,
          wrong: [[simple(principal, rate, years), r`That adds the same ${money((principal * rate) / 100)} each year: simple interest. Here each year's interest is ${rate}% of the *new* balance.`]],
          hints: [r`Each year the balance is multiplied by ${factor}.`, r`$${principal} \times ${factor}^{${years}}$`],
          explain: r`Multiply by ${factor} once for each year: $${principal} \times ${factor}^{${years}} = ${num(value, 2)}$, so about **${money(Math.round(value))}**. With simple interest it would be ${money(simple(principal, rate, years))}: the difference is interest earned on interest.`,
        };
      },
    },
    {
      id: 'double',
      type: 'interact',
      attempts: 6,
      title: 'How long to double?',
      text: r`
        This account starts with ${money(1000)} and the chart shows 12 years.

        **Find the lowest interest rate at which the money has at least doubled by year 12.**
      `,
      widget: {
        type: 'growth-curve', years: 12, yMax: 4000,
        params: { rate: { value: 2, min: 1, max: 12, step: 0.5, label: 'yearly rate', unit: '%' } },
        series: [{ id: 'pot', label: 'Balance', color: 'green', start: 1000, rate: 'rate' }],
        alt: 'A chart of one account over 12 years, starting at 1,000 dollars, with a slider for the yearly interest rate.',
      },
      check: (s) => {
        if (s.values.pot < 2000) return `At ${s.rate}% the account holds ${money(Math.round(s.values.pot))} after 12 years: not yet double. Try a higher rate.`;
        if (s.rate > 6) return `At ${s.rate}% it has doubled with time to spare: it passes ${money(2000)} in year ${s.doubled.pot}. Find the **lowest** rate that gets there by year 12.`;
        return true;
      },
      solution: { rate: 6 },
      hints: ['Watch the number at the end of the line as you move the slider.', 'Somewhere between 5% and 7%.'],
      explain: r`
        **6%**: after 12 years, $1000 \times 1.06^{12} \approx ${num(compound(1000, 6, 12), 0)}$.

        Notice that $6 \times 12 = 72$. That is not a coincidence, and it gives a rule that needs no calculator.
      `,
    },
    {
      id: 'teach-rule72',
      type: 'info',
      title: 'The rule of 72',
      text: r`
        :::key
        The **rule of 72**: money growing at a steady yearly rate doubles after about 72 ÷ (the rate in per cent) years.
        :::

        :::example
        - At ${RULE_EX.rate}% a year: 72 ÷ ${RULE_EX.rate} = **${num(72 / RULE_EX.rate, 1)} years**. The chart agrees: the exact figure is ${num(doublingYears(RULE_EX.rate), 1)} years.
        - The other way round: a sum that doubled in ${RULE_EX.years} years grew at about 72 ÷ ${RULE_EX.years} = **${num(72 / RULE_EX.years, 1)}%** a year.
        :::

        It is a rule of thumb, closest for rates between about 2% and 12%.
      `,
      figure: {
        type: 'growth-curve', static: true, years: 15, yMax: 2500,
        series: [{ id: 'pot', label: 'Balance at 5%', color: 'green', start: 1000, rate: RULE_EX.rate }],
        note: 'An example rate of 5% a year, added once a year. No tax or fees. Not a forecast.',
        alt: 'A chart of an account that starts at 1,000 dollars and grows at 5 per cent a year for 15 years. The curve passes 2,000 dollars between year 14 and year 15.',
      },
    },
    {
      id: 'rule72',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const rate = rng.pick([2, 3, 4, 6, 8, 9, 12]);
        const years = 72 / rate;
        const exact = doublingYears(rate);
        if (rng.bool()) {
          return {
            text: r`
              The **rule of 72**: money growing at a steady yearly rate doubles after about 72 ÷ (the rate in per cent) years.

              An account grows at **${rate}%** a year. **By the rule of 72, after about how many years has the money doubled?**
            `,
            answer: years,
            unit: 'years',
            wrong: [[100 / rate, r`That would be right for simple interest. Compound growth is faster: use 72, not 100.`]],
            hints: [r`72 ÷ ${rate}`],
            explain: r`72 ÷ ${rate} = **${years} years**. The exact figure is ${num(exact, 1)} years, so the rule is very close. It works best for rates between about 2% and 12%.`,
          };
        }
        return {
          text: r`
            The **rule of 72**: money growing at a steady yearly rate doubles after about 72 ÷ (the rate in per cent) years.

            A sum of money doubled in **${years} years**. **By the rule of 72, at about what yearly rate did it grow?**
          `,
          answer: rate,
          unit: '%',
          wrong: [[100 / years, r`That would be right for simple interest. With compound growth, use 72 ÷ the number of years.`]],
          hints: [r`72 ÷ ${years}`],
          explain: r`72 ÷ ${years} = **${rate}%** a year. (Checking with the formula: at ${rate}% the money doubles in ${num(exact, 1)} years.)`,
        };
      },
    },
    {
      id: 'teach-effective',
      type: 'info',
      title: 'Advertised rate, real growth',
      text: r`
        Interest is often added more than once a year. The advertised yearly rate, the **nominal rate**, is then split into equal parts, and each part earns interest in the periods after it. The true growth over a full year is the **effective annual rate** (banks label it APY, AER or EAR).

        :::example ${EFF_EX.nominal}% a year, added every six months
        1. Each half-year adds ${EFF_EX.nominal}% ÷ 2 = ${EFF_EX.nominal / 2}%: the balance is multiplied by ${num(1 + EFF_EX.nominal / 200)}.
        2. That happens twice in a year: $\mathord{${num(1 + EFF_EX.nominal / 200)}^2 = ${num(1 + effectiveRate(EFF_EX.nominal, 2) / 100, 4)}}$.
        3. The balance grows by **${effectiveRate(EFF_EX.nominal, 2).toFixed(2)}%**, a little more than the advertised ${EFF_EX.nominal}%.
        :::

        Added every three months (${EFF_EX.nominal / 4}%, four times), it would be $\mathord{${num(1 + EFF_EX.nominal / 400)}^4 \approx ${num(1 + effectiveRate(EFF_EX.nominal, 4) / 100, 4)}}$: a growth of ${effectiveRate(EFF_EX.nominal, 4).toFixed(2)}%.
      `,
    },
    {
      id: 'effective',
      type: 'numeric',
      gen: (rng) => {
        const [nominal, periods, how, each] = rng.pick([
          [12, 12, 'every month', 'month'], [6, 12, 'every month', 'month'], [24, 12, 'every month', 'month'],
          [8, 4, 'every three months', 'quarter'], [12, 4, 'every three months', 'quarter'], [20, 4, 'every three months', 'quarter'],
          [10, 2, 'every six months', 'half-year'],
        ]);
        const per = nominal / periods;
        const ear = effectiveRate(nominal, periods);
        const answer = Math.round(ear * 100) / 100;
        const factor = num(1 + per / 100);
        return {
          text: r`
            An account is advertised at **${nominal}% a year**, with interest added **${how}**: ${num(per)}% each ${each}, ${periods} times a year. (An example rate.)

            Because each addition earns interest in the following ${each}s, a full year brings more than ${nominal}%. **By what percentage does the balance really grow in a year?** Give two decimal places.
          `,
          answer,
          tolerance: 0.006,
          unit: '%',
          wrong: [[nominal, r`${nominal}% is the advertised (nominal) rate. With interest added ${periods} times a year, the balance is multiplied by ${factor} each time.`]],
          hints: [r`Each ${each} the balance is multiplied by ${factor}. How many times in a year?`, r`$${factor}^{${periods}}$, then read off the growth.`],
          explain: r`
            $${factor}^{${periods}} = ${num(1 + ear / 100, 4)}$, a growth of **${answer.toFixed(2)}%**.

            The advertised ${nominal}% is the nominal rate; ${answer.toFixed(2)}% is the effective annual rate. It is the fair number for comparing accounts, and the same thing works against a borrower, as a later lesson shows.
          `,
        };
      },
    },
    {
      id: 'example-contrib',
      type: 'info',
      title: 'Worked example: paying in every year',
      text: r`
        When money is paid in regularly, each payment has its own length of time to grow. Follow the account year by year.

        :::example ${money(PAYIN.pay)} at the start of each year, at ${PAYIN.rate}% a year (an example rate)
        1. Year 1: ${money(PAYIN.pay)} goes in. With the interest at the end of the year: ${money(PAYIN.pay)} × ${num(1 + PAYIN.rate / 100)} = ${money(PAYIN.afterOne)}.
        2. Year 2: another ${money(PAYIN.pay)} goes in: ${money(PAYIN.afterOne)} + ${money(PAYIN.pay)} = ${money(PAYIN.afterOne + PAYIN.pay)}.
        3. With the interest at the end of year 2: ${money(PAYIN.afterOne + PAYIN.pay)} × ${num(1 + PAYIN.rate / 100)} = **${money(PAYIN.afterTwo, 2)}**.
        :::

        The first payment earned interest twice, the second only once.
      `,
    },
    {
      id: 'contrib',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const pay = rng.pick([500, 1000, 2000]);
        const rate = rng.pick([5, 10, 20]);
        const f = 1 + rate / 100;
        const afterOne = pay * f;
        const value = (afterOne + pay) * f;
        return {
          text: r`
            ${name} pays **${money(pay)}** into an account at the start of each year. The account pays **${rate}%** a year (an example rate), added at the end of each year.

            **How much is in the account at the end of the second year?** Give the answer to the nearest dollar.
          `,
          answer: Math.round(value * 100) / 100,
          tolerance: 0.51,
          prefix: r`\$`,
          wrong: [
            [2 * pay * f, r`That gives each payment one year of interest. The first payment was in the account for two years.`],
            [2 * pay * f * f, r`That gives both payments two years of interest. The second payment arrived a year later.`],
          ],
          hints: ['Follow the account year by year: pay in, add the interest, pay in again, add the interest again.', r`End of year 1: ${money(pay)} × ${num(f)} = ${money(afterOne)}. Then the second payment arrives.`],
          explain: r`End of year 1: ${money(pay)} × ${num(f)} = ${money(afterOne)}. The second ${money(pay)} goes in, making ${money(afterOne + pay)}; a year later that is ${money(afterOne + pay)} × ${num(f)} = **${money(value)}**. The first payment has earned interest twice, the second once: early money works longest.`,
        };
      },
    },
    {
      id: 'savers-predict',
      type: 'choice',
      mode: 'predict',
      title: 'Two savers',
      text: r`
        **Aiko** pays ${money(SAVERS.pay)} a year into an account from the age of 25 to 34, ten payments, and then never pays in again.

        **Ben** starts at 35 and pays in ${money(SAVERS.pay)} a year until he is 64: thirty payments, three times as much as Aiko.

        Both accounts grow at 7% a year (an example rate). **Who has more at 65?**
      `,
      options: [
        { text: 'Aiko', correct: true },
        { text: 'Ben' },
        { text: 'About the same' },
      ],
      shuffle: false,
      explain: r`
        **Aiko**: about ${money(Math.round(saver('aiko', 7) / 1000) * 1000)} against Ben's ${money(Math.round(saver('ben', 7) / 1000) * 1000)}, although she paid in ${money(SAVERS.pay * 10)} and he paid in ${money(SAVERS.pay * 30)}.

        Her money had ten more years to compound. This example is famous, and it has a catch that is usually left out. Find it on the next screen.
      `,
    },
    {
      id: 'savers',
      type: 'interact',
      attempts: 6,
      title: 'The catch',
      text: r`
        Here are Aiko (pays in from 25 to 34) and Ben (pays in from 35 to 64) at 7% a year.

        The story is always told at a rate that suits it. **Find a rate at which Ben ends up ahead at 65.**
      `,
      widget: {
        type: 'growth-curve', years: SAVERS.years, xStart: SAVERS.age, xLabel: 'age', yMax: 240000,
        params: { rate: { value: 7, min: 2, max: 9, step: 0.5, label: 'yearly rate', unit: '%' } },
        series: SAVER_LINES,
        note: 'The same example rate every year, added once a year. No tax or fees. Not a forecast.',
        alt: 'A chart from age 25 to 65 of two savers: one who pays in for the first ten years only, and one who pays in for the last thirty. A slider sets the yearly rate.',
      },
      check: (s) => s.values.ben > s.values.aiko || `At ${s.rate}%, Aiko ends with ${money(Math.round(s.values.aiko))} and Ben with ${money(Math.round(s.values.ben))}: she is still ahead. Try a lower rate.`,
      solution: { rate: 5 },
      hints: ['Compounding is weaker when the rate is lower. Which of the two depends on it more?'],
      explain: r`
        At 6% or less, Ben wins: at 5% he has about ${money(Math.round(saver('ben', 5) / 1000) * 1000)} and Aiko ${money(Math.round(saver('aiko', 5) / 1000) * 1000)}.

        The lesson of the two savers is true in kind: money that starts early has more time, and time is the main ingredient of compound growth. How strong the effect is depends on the rate, and nobody knows future rates. Paying in more, as Ben did, always counts too.
      `,
    },
    {
      id: 'bias',
      type: 'choice',
      review: true,
      text: r`
        A sum of money grows by 10% every year, and the gains are left in.

        **Which describes how it grows?**
      `,
      columns: 1,
      options: [
        { text: 'It is multiplied by the same factor each year, so each year\'s gain in dollars is larger than the last', correct: true },
        { text: 'It gains the same number of dollars each year', why: 'That is simple interest: a straight line. With compound growth, each gain is 10% of a larger sum than the year before.' },
        { text: 'It gains quickly at first and then levels off', why: 'It is the other way round: slow at first, then faster and faster, as long as the rate holds.' },
        { text: 'It doubles every 10 years', why: 'That would be simple interest again (10 lots of 10%). By the rule of 72 it doubles about every 7 years.' },
      ],
      explain: r`
        Compound growth multiplies; it does not add. That is why its graph is a curve that keeps getting steeper.

        Human intuition is built for straight lines. When researchers ask people to estimate compound growth, most guess far too low: it is called **exponential-growth bias** (${GROWTH_BIAS.authors}, ${GROWTH_BIAS.year}). It makes saving look less worthwhile than it is, and borrowing look cheaper than it is.
      `,
    },
    {
      id: 'caveats',
      type: 'info',
      title: 'What the curve does not promise',
      text: r`
        Every chart in this lesson used one steady rate. Real interest rates move, investments can fall as well as rise, and no return is guaranteed. Rising prices also eat into what the money can buy: that is the next lesson.

        Some people do not pay or receive interest, for religious reasons, and forms of finance built on sharing profit and risk instead are widely used. The arithmetic of growth is the same whatever it is called.

        If you like, one thing to try this week: find an interest rate on any account, loan or advert, and use the rule of 72 to see how long it would take to double a sum at that rate.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    r`**Simple interest** adds the same amount each year. **Compound interest** multiplies: $A = P(1 + r)^n$, a curve that keeps getting steeper.`,
    'The **rule of 72**: years to double ≈ 72 ÷ the yearly rate in per cent.',
    'Interest added more than once a year makes the **effective annual rate** (APY, AER, EAR) higher than the advertised nominal rate.',
    'Time is the main ingredient: early money compounds longest. How much that matters depends on the rate, and no rate is guaranteed.',
  ],
  next: r`Next: a \$100 note in twenty years will still say 100 on it. What will it buy?`,
};
