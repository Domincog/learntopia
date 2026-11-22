// Money: Financial Literacy for Real Life · Lesson 4 · The Shrinking Coin
//
// Driving question: if prices rise 3% a year, what is $100 worth in twenty years?
// Sources for the real figures (central-bank targets, Germany 1923, Zimbabwe 2008) are in ../helpers.js.
import { r, num } from '../../../kit.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/money/index.js';
import { PEOPLE, INFLATION_TARGETS as TARGETS, HYPERINFLATION as HYPER, buyingPower, realReturn, doublingYears, money, thousands } from '../helpers.js';

const HOOK = { amount: 100, rate: 3, years: 20 };
const HOOK_POWER = buyingPower(HOOK.amount, HOOK.rate, HOOK.years);
const NOTES_PER_NEW_MARK = HYPER.germany.oldPerNew / HYPER.germany.noteMarks;
const SAVINGS = { start: 1000, rate: 2, years: 20 };
// The worked examples of the teaching screens: numbers that the generated questions cannot produce.
const BASKET_EX = { before: 600, after: 642 };
const HALF_EX = { rate: 5, years: 14 };
const REAL_EX = { nominal: 6, inflation: 4, high: 9 };
const realPct = (n, i) => (Math.round(realReturn(n, i) * 100) / 100).toFixed(2).replace('-', '−');

export default {
  id: 'inflation',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A note in a drawer',
      text: r`
        Someone puts a ${money(HOOK.amount)} note in a drawer and finds it again ${HOOK.years} years later. It still says 100.

        Meanwhile prices have risen by ${HOOK.rate}% every year. **How much shopping does the note buy now, measured in the prices of the day it went into the drawer?**
      `,
      min: 0, max: 100, step: 1, answer: Math.round(HOOK_POWER), tolerance: 6, start: 100, unit: 'dollars’ worth',
      explain: r`
        About **${money(Math.round(HOOK_POWER))}** worth. The note has lost nearly half of what it could buy without changing at all.

        A common guess is ${money(40)}: ${HOOK.years} years times ${HOOK.rate}% is 60% off. But rising prices compound, like interest, and the sum works a little differently. This lesson shows how.
      `,
    },
    {
      id: 'clock',
      type: 'interact',
      graded: false,
      title: 'Run the clock',
      text: r`
        The hundred squares are what ${money(100)} buys in year 0. Prices rise ${HOOK.rate}% a year.

        **Run the clock to year ${HOOK.years}** (press the button, or drag the slider) and watch the squares.
      `,
      widget: { type: 'inflation-clock', rate: HOOK.rate, years: 0, maxYears: 40, alt: 'A dial that counts years beside a grid of a hundred squares which empty as prices rise.' },
      check: (s) => s.years >= HOOK.years || `The clock is at year ${s.years}. Take it to year ${HOOK.years}.`,
      solution: { years: HOOK.years },
      explain: r`
        After ${HOOK.years} years a basket of shopping that cost ${money(100)} costs ${money(HOOK.amount * (1 + HOOK.rate / 100) ** HOOK.years, 2)}, so ${money(100)} buys only $100 \div 1.03^{${HOOK.years}} \approx ${num(HOOK_POWER, 2)}$ dollars' worth of it.

        Each year the note loses the same share (a little under 3%) of what it had *left*, not of the original: the squares go more slowly as fewer remain.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Inflation',
      text: r`
        **Inflation** is a general rise in prices, which is the same thing as a fall in what each unit of money buys: its **purchasing power**.

        Statistics offices measure it with a **basket**: a long list of the things households buy (food, rent, fuel, haircuts, phones), weighted by how much is spent on each. Every month they price the same basket again. The result is the **consumer price index**, and the percentage it has risen in a year is the rate of inflation in the news.

        :::example Last year the basket cost ${money(BASKET_EX.before)}; this year it costs ${money(BASKET_EX.after)}
        1. The rise: ${money(BASKET_EX.after)} − ${money(BASKET_EX.before)} = ${money(BASKET_EX.after - BASKET_EX.before)}.
        2. As a share of last year's price: ${BASKET_EX.after - BASKET_EX.before} ÷ ${BASKET_EX.before} = ${(BASKET_EX.after - BASKET_EX.before) / BASKET_EX.before}.
        3. Inflation was **${num(((BASKET_EX.after - BASKET_EX.before) / BASKET_EX.before) * 100)}%**.
        :::
      `,
    },
    {
      id: 'basket',
      type: 'numeric',
      gen: (rng) => {
        const before = rng.pick([200, 250, 400, 500, 800]);
        const rate = rng.pick([2, 3, 4, 5, 8, 10]);
        const after = before * (1 + rate / 100);
        const place = rng.pick(['an invented country', 'the island of Verdia', 'a small town', 'a city']);
        return {
          text: r`In ${place}, the statistics office prices the same basket of goods every year. Last year the basket cost **${money(before)}**. This year it costs **${money(after)}**. **What was the rate of inflation?**`,
          answer: rate,
          unit: '%',
          wrong: [[after - before, r`${money(after - before)} is the rise in dollars. The rate is that rise as a percentage of last year's ${money(before)}.`]],
          hints: ['By how many dollars did the basket go up?', r`${money(after - before)} as a percentage of ${money(before)}.`],
          explain: r`The basket rose by ${money(after - before)}. As a share of last year's price: ${num(after - before)} ÷ ${before} = ${num(rate / 100)}, so inflation was **${rate}%**. (A household's own inflation can differ from the official figure, because nobody buys exactly the average basket.)`,
        };
      },
    },
    {
      id: 'halve',
      type: 'interact',
      attempts: 6,
      title: 'Half gone',
      text: r`
        Now you can set the rate of inflation as well.

        **Set inflation to 6% a year, and stop the clock at the first year in which ${money(100)} buys half or less of what it did.**
      `,
      widget: { type: 'inflation-clock', rate: 3, rateRange: [0, 10, 0.5], years: 0, maxYears: 40, alt: 'A dial that counts years beside a grid of a hundred squares, with sliders for the years gone by and for the yearly rate of inflation.' },
      check: (s) => {
        if (s.rate !== 6) return 'Set the inflation slider to 6% first.';
        if (!s.halved) return `In year ${s.years} the ${money(100)} still buys what ${money(s.power, 2)} did: more than half. Go on.`;
        if (s.years > 12) return `By year ${s.years} it is well below half. Go back to the **first** year at which it is ${money(50)} or less.`;
        return true;
      },
      solution: { rate: 6, years: 12 },
      hints: ['Watch the readout on the left as the years go by.', 'The rule of 72 from the last lesson works here too.'],
      explain: r`
        **Year 12**: $100 \div 1.06^{12} \approx ${num(buyingPower(100, 6, 12), 2)}$.

        Notice that $6 \times 12 = 72$: the rule of 72 from the last lesson is at work on prices too.
      `,
    },
    {
      id: 'teach-halving',
      type: 'info',
      title: 'The rule of 72, for prices',
      text: r`
        Prices compound like interest. At 6% a year they double in about 72 ÷ 6 = 12 years, and money that sits still then buys half as much.

        :::key
        Money that sits still buys **half as much** after about 72 ÷ (the yearly rate of inflation in per cent) years.
        :::

        :::example Inflation of ${HALF_EX.rate}% a year
        1. Rule of 72: 72 ÷ ${HALF_EX.rate} = **${num(72 / HALF_EX.rate, 1)} years**.
        2. Check with the clock: after ${HALF_EX.years} years, ${money(100)} buys what $\mathord{100 \div ${num(1 + HALF_EX.rate / 100)}^{${HALF_EX.years}} \approx ${num(buyingPower(100, HALF_EX.rate, HALF_EX.years), 2)}}$ dollars bought at the start. That is almost exactly half.
        :::
      `,
      figure: { type: 'inflation-clock', static: true, rate: HALF_EX.rate, years: HALF_EX.years, maxYears: 40, alt: 'The inflation clock stopped at year 14 with prices rising 5 per cent a year: about half of the hundred squares are empty.' },
    },
    {
      id: 'halving',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const rate = rng.pick([2, 3, 4, 8, 9, 12]);   // not 5 or 6: the teaching screen above works those two out
        const where = rng.pick(['in a drawer', 'under a mattress', 'in a tin', 'in an account that pays no interest']);
        return {
          text: r`
            Prices rise by **${rate}%** a year, every year. Some money is kept ${where}: the number on it does not change, but what it buys does.

            **By the rule of 72 (years ≈ 72 ÷ the yearly rate in per cent), after about how many years does it buy only half as much?**
          `,
          answer: 72 / rate,
          unit: 'years',
          wrong: [[50 / rate, r`That takes ${rate}% off the original amount each year. Prices compound: use the rule of 72.`]],
          hints: [r`72 ÷ ${rate}`],
          explain: r`72 ÷ ${rate} = **${72 / rate} years**. (Exactly: prices double, and buying power halves, after ${num(doublingYears(rate), 1)} years at ${rate}%.)`,
        };
      },
    },
    {
      id: 'real-explore',
      type: 'interact',
      attempts: 6,
      title: 'Two ways to count',
      text: r`
        Noor keeps ${money(SAVINGS.start)} in a savings account that pays ${SAVINGS.rate}% a year (an example rate). The green line is the balance on her statements. The orange line is what that balance can **buy**, in today's money.

        **Find the rate of inflation at which her savings neither gain nor lose buying power over the ${SAVINGS.years} years.**
      `,
      widget: {
        type: 'growth-curve', years: SAVINGS.years, yMax: 1700,
        params: { inflation: { value: 5, min: 0, max: 6, step: 0.5, label: 'inflation a year', unit: '%', color: 'red' } },
        series: [
          { id: 'nominal', label: 'On the statement', color: 'green', start: SAVINGS.start, rate: SAVINGS.rate },
          { id: 'real', label: 'In today’s money', color: 'orange', start: SAVINGS.start, rate: SAVINGS.rate, deflate: 'inflation' },
        ],
        note: 'An example interest rate of 2% and a steady rate of inflation. No tax. Not a forecast.',
        alt: 'A chart over 20 years of a savings balance growing at 2 per cent a year, and of the same balance measured in today’s money, with a slider for the rate of inflation.',
      },
      check: (s) => {
        if (s.inflation > SAVINGS.rate) return `With inflation at ${s.inflation}%, her balance ends up buying what ${money(Math.round(s.values.real))} buys today: less than the ${money(SAVINGS.start)} she started with.`;
        if (s.inflation < SAVINGS.rate) return `With inflation at ${s.inflation}%, her balance ends up buying what ${money(Math.round(s.values.real))} buys today: more than she started with. Find the rate at which it only just holds its value.`;
        return true;
      },
      solution: { inflation: SAVINGS.rate },
      explain: r`
        At **${SAVINGS.rate}%** inflation the orange line is flat: the interest only just keeps up with prices.

        When inflation is higher than the interest rate, the balance goes up while what it can buy goes down.
      `,
    },
    {
      id: 'teach-real',
      type: 'info',
      title: 'Nominal and real',
      text: r`
        The number on a statement or a payslip is the **nominal** value. What it can buy is the **real** value. When prices rise faster than the number does, the real value falls while the number goes up.

        :::example Pay rises by ${REAL_EX.nominal}% in a year in which prices rise by ${REAL_EX.inflation}%
        1. Quick estimate of the real change: ${REAL_EX.nominal} − ${REAL_EX.inflation} = ${REAL_EX.nominal - REAL_EX.inflation}%.
        2. Exact: $\mathord{${num(1 + REAL_EX.nominal / 100)} \div ${num(1 + REAL_EX.inflation / 100)} \approx ${num(1 + realReturn(REAL_EX.nominal, REAL_EX.inflation) / 100, 4)}}$, a real rise of **${realPct(REAL_EX.nominal, REAL_EX.inflation)}%** (to two decimal places).
        3. Had prices risen by ${REAL_EX.high}% instead: $\mathord{${num(1 + REAL_EX.nominal / 100)} \div ${num(1 + REAL_EX.high / 100)} \approx ${num(1 + realReturn(REAL_EX.nominal, REAL_EX.high) / 100, 4)}}$, a real change of **${realPct(REAL_EX.nominal, REAL_EX.high)}%**. The pay would buy less.
        :::
      `,
    },
    {
      id: 'real-return',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const [nominal, inflation] = rng.pick([[5, 2], [7, 3], [4, 6], [10, 4], [2, 3], [8, 2], [3, 6], [6, 2], [1, 3]]);
        const wage = rng.bool();
        const exact = Math.round(realReturn(nominal, inflation) * 100) / 100;
        const story = wage
          ? r`${name}'s pay went up by **${nominal}%** this year. Over the same year, prices rose by **${inflation}%**.`
          : r`${name}'s savings account paid **${nominal}%** interest this year (an example rate). Over the same year, prices rose by **${inflation}%**.`;
        const what = wage ? 'what the pay can buy' : 'what the savings can buy';
        return {
          text: r`
            ${story}

            The quick estimate of the **real** change is ${nominal} − ${inflation} = ${nominal - inflation}%. The exact figure is $\dfrac{1 + \text{nominal change}}{1 + \text{inflation}} - 1$.

            **Work out the exact real change in ${what}**, in per cent, to two decimal places. (Type a minus sign if it fell.)
          `,
          answer: exact,
          tolerance: 0.006,
          unit: '%',
          wrong: [[nominal - inflation, r`That is the quick estimate. For the exact figure, divide ${num(1 + nominal / 100)} by ${num(1 + inflation / 100)} and subtract 1.`]],
          hints: [r`$${num(1 + nominal / 100)} \div ${num(1 + inflation / 100)}$`, 'Subtract 1 and turn the result into a percentage.'],
          explain: r`$${num(1 + nominal / 100)} \div ${num(1 + inflation / 100)} = ${num(1 + exact / 100, 4)}$, a real change of **${exact.toFixed(2)}%**: ${exact < 0 ? `${what} went **down**, although the number went up` : `${what} went up, but by less than the number suggests`}. The quick estimate, ${nominal - inflation}%, is close enough for most purposes when both rates are small.`,
        };
      },
    },
    {
      id: 'teach-winners',
      type: 'info',
      title: 'Fixed sums and rising prices',
      text: r`
        Inflation shrinks what any **fixed number of dollars** is worth. So a burst of inflation that nobody expected moves wealth from one group of people to another.

        - Whoever **owes** a fixed sum gains. A debt of ${money(10000)} is easier to repay when wages and prices have risen and the debt has not.
        - Whoever **is owed** a fixed sum, or holds cash, loses. The dollars that arrive buy less than was agreed.

        That is why wage agreements, pensions and benefits are often linked to the price index.
      `,
    },
    {
      id: 'winners',
      type: 'bucket',
      review: true,
      title: 'Who gains, who loses',
      text: r`
        Prices start rising much faster than anyone expected, by 8% a year instead of 2%. Every fixed number of dollars now buys less than was expected.

        **Sort each of these: does the surprise leave them better off or worse off?**
      `,
      buckets: ['Gains', 'Loses'],
      items: [
        ['Someone repaying a loan at a fixed interest rate', 0],
        ['A government with large debts at fixed rates', 0],
        ['A homeowner with a fixed-rate mortgage, whose wages rise with prices', 0],
        ['Someone who keeps their savings in cash', 1],
        ['A lender who is owed fixed repayments', 1],
        ['A retired person whose pension is a fixed number of dollars', 1],
      ],
      explain: r`
        Unexpected inflation moves wealth from people who are **owed** fixed sums to people who **owe** them: the debt stays the same number of dollars while wages and prices rise round it.

        Anyone on a fixed income, or holding cash, loses.
      `,
    },
    {
      id: 'teach-deflation',
      type: 'info',
      title: 'Falling prices',
      text: r`
        The opposite of inflation is **deflation**: prices falling in general. It sounds pleasant, and it can do harm.

        - If things will be cheaper next month, people wait to buy.
        - Firms sell less, and cut wages or jobs.
        - Debts do not shrink with prices, so they become harder to repay.

        High or unpredictable inflation does harm as well, as the last two screens showed. Central banks, the public bodies that manage a country's money, work to a target for inflation with both dangers in mind.
      `,
    },
    {
      id: 'targets',
      type: 'choice',
      title: 'Why not zero?',
      text: r`
        The ${TARGETS.map((t) => t.bank).join(', the ').replace(/, the ([^,]*)$/, ' and the $1')} all aim for inflation of about **${TARGETS[0].target}% a year**: low and steady, but not zero.

        **What is the main reason for not aiming at 0%?**
      `,
      columns: 1,
      options: [
        { text: 'A small positive rate leaves a safety margin against falling prices, which can make people put off spending and make debts heavier', correct: true },
        { text: 'Inflation of 2% makes everyone 2% richer each year', why: 'Rising prices do not create wealth. If wages and prices both rise 2%, people can buy exactly what they could before.' },
        { text: 'Prices cannot be measured, so any number would do', why: 'They are measured, month by month, with the basket. The figure is imperfect but far from arbitrary.' },
        { text: 'Zero inflation would mean that no price ever changed', why: 'Zero inflation means the average does not change: some prices rise while others fall.' },
      ],
      explain: r`
        A target a little above zero keeps the economy clear of deflation, and it leaves central banks room to cut interest rates in a slump. Economists argue about whether 2% is the right number; almost none argue for high or unpredictable inflation.
      `,
    },
    {
      id: 'german-note',
      type: 'numeric',
      title: 'When money dies',
      text: r`
        This banknote was printed in Germany in September 1923. *Zehn Milliarden Mark*: ten billion marks, 10,000,000,000.

        Two months later the currency was replaced. One new mark was exchanged for 1,000,000,000,000 (a million million) old ones.

        **How many notes like this one did it take to make a single new mark?**
      `,
      figure: photo(MEDIA['mark-1923'], {
        alt: 'An old banknote printed in green and brown. Large Gothic letters read "Zehn Milliarden Mark"; smaller print gives the place and date, Berlin, 15 September 1923.',
        caption: 'Reichsbank note, Germany, 15 September 1923',
        creditLabel: 'Image',
      }),
      answer: NOTES_PER_NEW_MARK,
      unit: 'notes',
      wrong: [[10, 'Count the zeros: the new mark was worth twelve zeros of old marks, the note has ten.'], [1000, 'Count the zeros: the new mark was worth twelve zeros of old marks, the note has ten.']],
      hints: ['The note is a 1 with ten zeros. The exchange rate is a 1 with twelve zeros.', 'Twelve zeros divided by ten zeros leaves two zeros.'],
      explain: r`
        $10^{12} \div 10^{10} = 100$ notes. By November 1923 a US dollar cost ${num(HYPER.germany.marksPerDollar / 1e12, 1)} trillion marks, and at the worst prices doubled every few days.

        This was **hyperinflation**. The government had paid its bills by printing money, and money printed without limit ends up worth nothing. Savings held in marks were wiped out; so were debts. It is rare, and it is one reason why most central banks today are kept at arm's length from the governments whose money they issue.
      `,
    },
    {
      id: 'zim-note',
      type: 'numeric',
      gen: (rng) => {
        const days = rng.pick([3, 4, 5, 6, 7, 10]);
        const start = rng.pick([1, 2, 5]);
        return {
          text: r`
            A real banknote: one hundred trillion Zimbabwe dollars, issued in January ${HYPER.zimbabwe.noteIssued}. A few weeks earlier, by one economist's estimate, prices there were doubling about **once a day**.

            Suppose a loaf of bread costs **${start} million** dollars today and its price doubles every day. **What does it cost after ${days} days, in millions of dollars?**
          `,
          answer: start * 2 ** days,
          unit: 'million',
          wrong: [[start * 2 * days, r`That adds the same amount each day. Doubling multiplies: ${start}, ${start * 2}, ${start * 4}, ${start * 8}…`]],
          hints: [r`Double it once for each day: ${start}, ${start * 2}, ${start * 4}…`, r`$${start} \times 2^{${days}}$`],
          explain: r`$${start} \times 2^{${days}}$ = ${thousands(start * 2 ** days)} million dollars. Daily doubling is the estimate of the economist Steve Hanke for November ${HYPER.zimbabwe.year}: prices doubling about every ${num(HYPER.zimbabwe.doublingHours, 1)} hours. Wages paid in the morning had to be spent by the afternoon, and people turned to foreign currencies. Zimbabwe gave up its own dollar in ${HYPER.zimbabwe.noteIssued}.`,
        };
      },
      figure: photo(MEDIA['zim-100-trillion'], {
        alt: 'A blue banknote of the Reserve Bank of Zimbabwe. It shows the number 100 followed by twelve zeros, the words "One hundred trillion dollars" and a picture of three balancing rocks.',
        caption: 'Reserve Bank of Zimbabwe, 100 trillion dollars (dated 2008, issued in January 2009)',
        creditLabel: 'Image',
      }),
    },
    {
      id: 'shrink',
      type: 'numeric',
      title: 'The quiet price rise',
      gen: (rng) => {
        const [before, after, rise] = rng.pick([[250, 200, 25], [300, 250, 20], [120, 100, 20], [550, 500, 10], [440, 400, 10], [150, 125, 20], [500, 400, 25], [600, 500, 20]]);
        const price = rng.pick([2, 3, 4.5]);
        const thing = rng.pick(['bar of chocolate', 'bag of crisps', 'box of cereal', 'pack of biscuits', 'jar of coffee']);
        const drop = Math.round(((before - after) / before) * 1000) / 10;
        return {
          text: r`
            A ${thing} used to weigh **${before} g**. It now weighs **${after} g**, and the price on the shelf is still ${money(price, 2)}.

            **By what percentage has the price per gram gone up?** (For example, a pack that shrinks from 400 g to 320 g at the same price costs 400 ÷ 320 = 1.25 times as much per gram: a rise of 25%.)
          `,
          answer: rise,
          unit: '%',
          tolerance: 0.05,
          wrong: [[drop, r`${num(drop, 1)}% is how much the weight went down. The price per gram went up by more: the same money now buys ${after} g instead of ${before} g.`]],
          hints: ['The same price now buys fewer grams. Compare the old weight with the new one.', r`${before} ÷ ${after}`],
          explain: r`
            The same ${money(price, 2)} used to buy ${before} g and now buys ${after} g, so each gram costs ${before} ÷ ${after} = ${num(before / after, 2)} times as much: a rise of **${rise}%**.

            This is nicknamed **shrinkflation**. Statistics offices do count it, because they track price per unit. If you like, one thing to notice this week: the weight or volume printed on one packet you often buy.
          `,
        };
      },
    },
  ],
  recap: [
    '**Inflation** is a general rise in prices, measured by pricing the same basket of goods again and again. It is a fall in the purchasing power of money.',
    r`Money that sits still loses value by compounding: after $n$ years at a rate $i$ it buys $1 \div (1 + i)^n$ of what it did. Rule of 72: it halves in about 72 ÷ the rate years.`,
    'The **nominal** figure is the number of dollars; the **real** figure is what they buy. Real change ≈ nominal change − inflation.',
    'Surprise inflation helps people who owe fixed sums and hurts people who are owed them or who hold cash. Central banks aim for low, steady inflation of about 2%.',
  ],
  next: 'Next: the same compounding, working against you. How can a $2,000 debt cost $4,000?'.replace(/\$/g, '\\$'),
};
