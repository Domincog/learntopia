// Money: Financial Literacy for Real Life · Lesson 8 · Fees, Time and Nerves
//
// Driving question: how much can a 1% fee cost?
// SPIVA, Morningstar, J.P. Morgan and Bengen figures are real (sources in ../helpers.js); every rate of
// return is an example and no fund, account or adviser is recommended.
import { r, num } from '../../../kit.js';
import { SPIVA, MIND_THE_GAP as GAP, BEST_DAYS, BENGEN, RETIREMENT_ACCOUNTS, PEOPLE, compound, savedUp, money, paras } from '../helpers.js';

const POT = { start: 10000, rate: 6 };
const keptAfter = (fee, years) => compound(POT.start, POT.rate - fee, years) / compound(POT.start, POT.rate, years);
const HOOK_LOST = Math.round((1 - keptAfter(1, 40)) * 100);
const feeChart = (extra) => ({
  type: 'growth-curve', gap: ['gross', 'net'], yMax: 110000,
  series: [
    { id: 'gross', label: 'No fee', color: 'green', start: POT.start, rate: POT.rate },
    { id: 'net', label: 'After the fee', color: 'orange', start: POT.start, rate: POT.rate, fee: 'fee' },
  ],
  note: 'An example return of 6% a year before fees, the same every year; the fee comes off that rate (6% less a 1% fee leaves 5%). No tax. Not a forecast.',
  ...extra,
});
// The worked examples of the teaching screens: numbers that the generated questions cannot produce.
const FEE_EX = { pot: 30000, fee: 0.4, years: 20 };
FEE_EX.gross = Math.round(compound(POT.start, POT.rate, FEE_EX.years));
FEE_EX.net = Math.round(compound(POT.start, POT.rate - 1, FEE_EX.years));
const UNITS_EX = { each: 120, prices: [12, 6, 8] };
UNITS_EX.units = UNITS_EX.prices.map((p) => UNITS_EX.each / p);
UNITS_EX.total = UNITS_EX.units.reduce((a, b) => a + b, 0);
UNITS_EX.paid = UNITS_EX.each * UNITS_EX.prices.length;
UNITS_EX.mean = UNITS_EX.prices.reduce((a, b) => a + b, 0) / UNITS_EX.prices.length;
const MATCH_EX = { salary: 45000, cap: 4, low: 2, high: 7 };
const part = (p) => (MATCH_EX.salary * p) / 100;
const STARTERS = [[25, 'violet'], [35, 'orange'], [45, 'blue']];
const startedAt = (age, rate) => savedUp(2400, rate, age - 25, 40, 40);

export default {
  id: 'long-game',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'One per cent',
      text: r`
        Two people each invest ${money(POT.start)} for 40 years in funds that earn ${POT.rate}% a year before costs (an example figure). One fund charges nothing. The other charges a fee of **1% of the pot each year**.

        **By what percentage is the second person's pot smaller at the end?**
      `,
      min: 0, max: 60, step: 1, answer: HOOK_LOST, tolerance: 6, start: 1, unit: '%',
      explain: r`
        About **${HOOK_LOST}%**: nearly a third of the money, for a fee that sounds like nothing.

        A fee of 1% a year is not 1% of the gains, and it is not charged once. It is 1% of everything, every year, and what it takes can no longer grow.
      `,
    },
    {
      id: 'fee-explore',
      type: 'interact',
      graded: false,
      title: 'Watch the gap open',
      text: r`
        The green line is ${money(POT.start)} growing at ${POT.rate}% a year with no fee. The orange line is the same money in a fund that takes a yearly fee.

        **Set the fee to 1%** and look at the difference after 40 years. Then try other fees and shorter times.
      `,
      widget: feeChart({ years: 40, yearsRange: [5, 40, 1], params: { fee: { value: 0, min: 0, max: 2, step: 0.1, label: 'yearly fee', unit: '%', color: 'orange' } }, alt: 'A chart of 10,000 dollars growing for up to 40 years with and without a yearly fee, with sliders for the years and the fee.' }),
      check: (s) => s.fee === 1 || 'Set the fee slider to 1%.',
      solution: { fee: 1, years: 40 },
      explain: r`
        After 40 years: ${money(Math.round(compound(POT.start, POT.rate, 40)))} without the fee, ${money(Math.round(compound(POT.start, POT.rate - 1, 40)))} with it. The difference, ${money(Math.round(compound(POT.start, POT.rate, 40) - compound(POT.start, POT.rate - 1, 40)))}, is more than three times the original investment.

        Over five years the same fee hardly shows. Fees compound, exactly as interest does, and compounding needs time: for you or against you.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'The cost of owning',
      text: r`
        Almost every fund charges a yearly fee, taken straight out of the pot as a percentage of its value. It goes by many names: *ongoing charge*, *expense ratio*, *management fee*. It is charged in good years and in bad.

        Fees range widely: funds that simply hold a whole market often cost 0.1% to 0.3% a year, while funds whose managers try to beat the market often cost 1% or more. An adviser or a platform may add its own fee on top.

        A fee is the one thing about an investment that is known in advance. Returns are a hope; costs are a certainty.
      `,
    },
    {
      id: 'example-fee',
      type: 'info',
      title: 'Worked example: what a fee costs',
      text: r`
        A fee is a percentage of the whole pot, taken every year.

        :::example This year: ${money(FEE_EX.pot)} in a fund that charges ${num(FEE_EX.fee)}% a year
        1% of ${money(FEE_EX.pot)} is ${money(FEE_EX.pot / 100)}, so ${num(FEE_EX.fee)}% is ${num(FEE_EX.fee)} × ${money(FEE_EX.pot / 100)} = **${money((FEE_EX.pot * FEE_EX.fee) / 100)}**.
        :::

        :::example Over ${FEE_EX.years} years: ${money(POT.start)} earning ${POT.rate}% a year before fees (an example rate)
        1. No fee: $\mathord{${POT.start} \times ${num(1 + POT.rate / 100)}^{${FEE_EX.years}} \approx ${FEE_EX.gross}}$.
        2. A 1% fee leaves ${POT.rate - 1}%: $\mathord{${POT.start} \times ${num(1 + (POT.rate - 1) / 100)}^{${FEE_EX.years}} \approx ${FEE_EX.net}}$.
        3. The fee has cost about ${money(FEE_EX.gross)} − ${money(FEE_EX.net)} = **${money(FEE_EX.gross - FEE_EX.net)}** (to the nearest dollar): more than half of the sum put in.
        :::
      `,
      figure: feeChart({ static: true, years: FEE_EX.years, yMax: 40000, params: { fee: { value: 1, min: 0, max: 2, step: 0.1, label: 'yearly fee', unit: '%', color: 'orange' } }, alt: 'A chart of 10,000 dollars growing for 20 years at 6 per cent a year: to about 32,000 dollars with no fee, and to about 26,500 dollars with a fee of 1 per cent a year.' }),
    },
    {
      id: 'fee-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const pot = rng.pick([5000, 20000, 40000, 80000, 150000, 200000]);
        const fee = rng.pick([0.1, 0.25, 0.5, 1, 1.5, 2]);
        const cost = (pot * fee) / 100;
        return {
          text: r`${name} has **${money(pot)}** in an investment fund. The fund charges a fee of **${num(fee)}% a year**, taken from the pot. **How many dollars does the fee come to this year?**`,
          answer: cost,
          prefix: r`\$`,
          wrong: [[cost * 100, r`${num(fee)}% means ${num(fee)} in every hundred, not ${num(fee)} times the pot.`], ...(fee < 1 ? [[pot / 100, r`That is 1% of the pot. The fee is ${num(fee)}%.`]] : [])],
          hints: [r`1% of ${money(pot)} is ${money(pot / 100)}.`, r`${num(fee)}% is ${num(fee)} times that.`],
          explain: r`1% of ${money(pot)} is ${money(pot / 100)}, so ${num(fee)}% is **${money(cost)}** this year. It is taken whether the fund went up or down, and it grows as the pot grows.`,
        };
      },
    },
    {
      id: 'fee-target',
      type: 'interact',
      attempts: 6,
      title: 'Keeping nine tenths',
      text: r`
        The same ${money(POT.start)} at ${POT.rate}% before fees, now over **30 years**. The **difference** readout shows what the fee has cost.

        **Find the largest yearly fee at which the investor still ends up with at least 90% of the no-fee pot.**
      `,
      widget: feeChart({ years: 30, yMax: 60000, params: { fee: { value: 1.5, min: 0, max: 2, step: 0.1, label: 'yearly fee', unit: '%', color: 'orange' } }, alt: 'A chart of 10,000 dollars growing for 30 years with and without a yearly fee, with a slider for the fee.' }),
      check: (s) => {
        if (s.kept < 90) return `With a fee of ${s.fee}%, the investor ends with ${s.kept}% of the no-fee pot: less than 90%. Lower the fee.`;
        if (s.fee < 0.3) return `With ${s.fee}%, the investor keeps ${s.kept}%. A slightly higher fee would still leave 90%: find the largest.`;
        return true;
      },
      solution: { fee: 0.3 },
      hints: [r`90% of the no-fee pot is ${money(Math.round(compound(POT.start, POT.rate, 30) * 0.9))}.`, 'It is well below half a per cent.'],
      explain: r`
        **0.3%**: the investor keeps ${num(keptAfter(0.3, 30) * 100, 1)}% of the no-fee result. At 0.4% it is already ${num(keptAfter(0.4, 30) * 100, 1)}%, and at 1% only ${num(keptAfter(1, 30) * 100, 1)}%.

        On this pot, a fee of 0.3% a year costs about ${money(Math.round((compound(POT.start, POT.rate, 30) - compound(POT.start, POT.rate - 0.3, 30)) / 100) * 100)} over the thirty years, and a fee of 1% about ${money(Math.round((compound(POT.start, POT.rate, 30) - compound(POT.start, POT.rate - 1, 30)) / 100) * 100)}: more than the sum that was invested.
      `,
    },
    {
      id: 'teach-index',
      type: 'info',
      title: 'Holding the market, or trying to beat it',
      text: r`
        An **index fund** simply holds every share in a market index and charges very little. An **actively managed fund** pays professionals to pick the shares they expect to do best, and charges more for it.

        Scorecards kept year after year count how many active funds end up **behind** the index they are trying to beat. Among ${SPIVA.market}: ${SPIVA.oneYearPct}% in ${SPIVA.year}, ${SPIVA.fiveYearPct}% over five years, and about nine in ten over twenty (S&P's SPIVA scorecards for ${SPIVA.year}).

        One fact to hold on to: all the investors in a market, added together, *are* the market. Before costs, their average return is the market's return.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: '% behind their index', showValues: true,
        data: [
          { label: '1 year', value: SPIVA.oneYearPct, color: 'orange' },
          { label: '5 years', value: SPIVA.fiveYearPct, color: 'orange' },
          { label: '20 years', value: SPIVA.twentyYearPct, color: 'orange' },
        ],
        alt: `A bar chart: the share of actively managed US large-company funds that did worse than their index was ${SPIVA.oneYearPct} per cent over one year, ${SPIVA.fiveYearPct} per cent over five years and ${SPIVA.twentyYearPct} per cent over twenty years.`,
      },
    },
    {
      id: 'index',
      type: 'choice',
      review: true,
      title: 'Trying to beat the market',
      text: r`
        An **index fund** simply holds every share in a market index and charges very little. An **actively managed fund** pays professionals to pick the shares they expect to do best, and charges more for it.

        Scorecards kept year after year show that, over long periods, a large majority of actively managed funds end up **behind** the index they are trying to beat. **What is the main reason?**
      `,
      columns: 1,
      options: [
        { text: 'Taken together, investors earn the market\'s return before costs; active funds have higher costs, so after costs most of them must trail', correct: true },
        { text: 'Professional fund managers know less about companies than the general public', why: 'They are skilled and well informed. The trouble is that they are competing with one another, and their fees come out of the result.' },
        { text: 'Index funds are allowed to buy shares at lower prices', why: 'Everyone buys at the same market prices. The difference is in costs, not prices.' },
        { text: 'Active funds avoid the best companies on purpose', why: 'They try hard to find them. But for every manager who holds more of a winner than the index does, another must hold less.' },
      ],
      explain: r`
        All the investors in a market, added together, *are* the market: before costs, their average return is the market's return. After costs, the average must be lower, and the funds with the highest costs start furthest behind.

        Some managers do beat the index; picking them in advance is the hard part. The first index fund for the public was launched in 1976 and was mocked at the time.
      `,
    },
    {
      id: 'timing',
      type: 'choice',
      title: 'Nerves',
      text: r`
        Share prices fall sharply, and the news is frightening. Jae sells everything, planning to buy back "when things calm down".

        One study of the US share market over the twenty years to the end of ${BEST_DAYS.year} (by J.P. Morgan Asset Management) found that ${BEST_DAYS.bestNearWorst} of the ${BEST_DAYS.of} best days came within two weeks of the ${BEST_DAYS.of} worst days. **What does that record suggest is the main danger in Jae's plan?**
      `,
      columns: 1,
      options: [
        { text: 'The biggest rises tend to come close to the biggest falls, so someone who is out of the market after a fall is likely to miss the recovery', correct: true },
        { text: 'Selling shares is not allowed while prices are falling', why: 'It is allowed, and many people do it. The question is what it costs them.' },
        { text: 'Prices always fall further after a sharp fall', why: 'Sometimes they do and sometimes they bounce back at once. Nobody can tell which in advance: that is the problem.' },
      ],
      explain: r`
        The best days sit next to the worst ones, so being out of the market after a fall often means being out for the rebound. To gain from getting out, an investor has to be right twice: when to leave and when to come back.

        Most are not. Over the ten years to ${GAP.year}, US funds returned ${GAP.fundPct}% a year on average, but the money actually invested in them earned ${GAP.investorPct}%, because it tended to arrive after prices had risen and leave after they had fallen (Morningstar). The gap came from behaviour, not from the funds.
      `,
    },
    {
      id: 'example-regular',
      type: 'info',
      title: 'Worked example: the same sum every month',
      text: r`
        A fund is sold in **units**: equal slices, each with a price that moves. Someone who invests a fixed sum every month buys more units when the price is low, and fewer when it is high.

        :::example ${money(UNITS_EX.each)} a month, while a unit costs ${money(UNITS_EX.prices[0])}, then ${money(UNITS_EX.prices[1])}, then ${money(UNITS_EX.prices[2])}
        1. Units bought: ${UNITS_EX.each} ÷ ${UNITS_EX.prices[0]} = ${UNITS_EX.units[0]}, then ${UNITS_EX.each} ÷ ${UNITS_EX.prices[1]} = ${UNITS_EX.units[1]}, then ${UNITS_EX.each} ÷ ${UNITS_EX.prices[2]} = ${UNITS_EX.units[2]}. Together ${UNITS_EX.total} units.
        2. Money paid: 3 × ${money(UNITS_EX.each)} = ${money(UNITS_EX.paid)}.
        3. Average price paid: ${money(UNITS_EX.paid)} ÷ ${UNITS_EX.total} = **${money(UNITS_EX.paid / UNITS_EX.total, 2)}** a unit.
        :::

        The plain average of the three prices is ${money(UNITS_EX.mean, 2)}. The price paid is lower, because the same sum bought the most units in the cheapest month. That is arithmetic. It does not guarantee a gain: the units can still end up worth less than was paid for them.
      `,
    },
    {
      id: 'regular',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const prices = rng.pick([[10, 5, 10], [20, 10, 20], [8, 4, 8], [4, 2, 4], [20, 5, 20], [40, 10, 40], [50, 25, 50]]);
        const each = 100;
        const units = prices.map((p) => each / p);
        const total = units.reduce((a, b) => a + b, 0);
        const paid = each * prices.length;
        const average = paid / total;
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        return {
          text: r`
            ${name} puts **${money(each)} a month** into a fund, whatever its price. In three months the price of one unit of the fund is ${money(prices[0])}, then ${money(prices[1])}, then ${money(prices[2])}.

            **What average price has ${name} paid per unit?** (Total money paid ÷ total units bought.)
          `,
          answer: Math.round(average * 100) / 100,
          tolerance: 0.006,
          prefix: r`\$`,
          wrong: [[Math.round(mean * 100) / 100, 'That is the average of the three prices. But the same money bought more units in the cheap month, which pulls the average price paid down.']],
          hints: [r`How many units does ${money(each)} buy at each price? ${money(each)} ÷ ${money(prices[0])} = ${num(units[0])}, and so on.`, r`${money(paid)} was paid for ${num(total)} units.`],
          explain: r`
            Units bought: ${units.map((u) => num(u)).join(' + ')} = ${num(total)}. Paid: ${money(paid)}. Average price: ${money(paid)} ÷ ${num(total)} = **${money(average, 2)}**, below the average of the three prices (${money(mean, 2)}), because a fixed sum automatically buys more when the price is low.

            Investing a fixed amount regularly takes the question of timing away. It does not guarantee a gain, and people who study it disagree about whether a sum that is already available is better invested at once or bit by bit.
          `,
        };
      },
    },
    {
      id: 'teach-match',
      type: 'info',
      title: 'An employer\'s match',
      text: r`
        Many employers pay into a pension for their staff. Often they **match** what the employee pays in: for every dollar from the employee, the employer adds a dollar, up to a limit set as a percentage of salary.

        :::example A salary of ${money(MATCH_EX.salary)}; the employer matches up to ${MATCH_EX.cap}% of salary
        - The employee pays in ${MATCH_EX.low}%, which is ${money(part(MATCH_EX.low))}. The employer adds the same. Together **${money(2 * part(MATCH_EX.low))}**.
        - The employee pays in ${MATCH_EX.high}%, which is ${money(part(MATCH_EX.high))}. The employer stops at ${MATCH_EX.cap}%, which is ${money(part(MATCH_EX.cap))}. Together **${money(part(MATCH_EX.high) + part(MATCH_EX.cap))}**.
        :::

        A match is part of the pay for the job. Not every job offers one, and not everyone can spare the contribution.
      `,
    },
    {
      id: 'match-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const salary = rng.pick([24000, 30000, 36000, 40000, 50000]);
        const own = rng.pick([3, 4, 5, 6]);
        const cap = rng.pick([3, 4, 5]);
        const matched = Math.min(own, cap);
        const total = (salary * (own + matched)) / 100;
        return {
          text: r`
            ${name} earns **${money(salary)}** a year. The employer's pension scheme works like this: the employer **matches** whatever the employee pays in, up to **${cap}%** of salary.

            ${name} pays in **${own}%** of salary. **How much goes into the pension in a year, counting both?**
          `,
          answer: total,
          prefix: r`\$`,
          wrong: [
            [(salary * own) / 100, 'That is only what the employee pays in. The employer adds a matching amount.'],
            ...(own > cap ? [[(salary * own * 2) / 100, r`The employer matches only up to ${cap}% of salary, not the full ${own}%.`]] : []),
          ],
          hints: [r`${name} pays ${own}% of ${money(salary)}. What does the employer add?`, r`The employer adds ${matched}% of salary${own > cap ? `: the match stops at ${cap}%` : ''}.`],
          explain: paras(
            r`${name}: ${own}% of ${money(salary)} = ${money((salary * own) / 100)}. Employer: ${matched}% = ${money((salary * matched) / 100)}${own > cap ? ` (the match is capped at ${cap}%)` : ''}. Together **${money(total)}**. A matching contribution is part of the pay for the job: an employee who pays in less than the matched amount leaves some of it unclaimed. (Not everyone can spare the contribution, and not every job offers one.)`,
            r`Many governments also give tax advantages to money saved for retirement or for the long term, through special accounts. The names differ:`,
            ['| Country | Accounts |', '|---|---|', ...RETIREMENT_ACCOUNTS.map((a) => `| ${a.country} | ${a.names} |`)].join('\n'),
          ),
        };
      },
    },
    {
      id: 'rebalance',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const total = rng.pick([10000, 20000, 50000]);
        const now = rng.pick([65, 68, 70, 75]);
        const move = (total * (now - 60)) / 100;
        return {
          text: r`
            ${name} decided to keep **60% in shares and 40% in bonds**. After a strong year for shares, the pot of **${money(total)}** is **${now}% shares** and ${100 - now}% bonds.

            **How many dollars must be moved from shares to bonds to get back to 60/40?** (For example, a pot of ${money(30000)} that has drifted to 72% shares holds ${money(21600)} in shares. 60% would be ${money(18000)}, so ${money(3600)} has to move.)
          `,
          answer: move,
          prefix: r`\$`,
          wrong: [[(total * now) / 100, 'That is everything now held in shares. Only the part above 60% has to move.']],
          hints: [r`Shares are ${now - 60} percentage points above the plan.`, r`${now - 60}% of ${money(total)}`],
          explain: r`
            Shares now: ${money((total * now) / 100)}. The plan: 60% of ${money(total)} = ${money(total * 0.6)}. Move the difference, **${money(move)}**.

            This is **rebalancing**: bringing a mix back to the level of risk that was chosen. It means selling some of what has just risen, which feels wrong and is the point. Many people also shift gradually from shares towards steadier holdings as the date they need the money comes closer, because a crash matters most when there is no time left to recover.
          `,
        };
      },
    },
    {
      id: 'time',
      type: 'interact',
      graded: false,
      title: 'The main ingredient',
      text: r`
        Three people each put ${money(200)} a month (${money(2400)} a year) towards retirement at 65. One starts at 25, one at 35, one at 45. The chart uses the same example rate for all.

        **Move the rate slider** down to 2% and up to 8%, and compare the three at 65.
      `,
      widget: {
        type: 'growth-curve', years: 40, xStart: 25, xLabel: 'age', yMax: 400000,
        params: { rate: { value: 5, min: 2, max: 8, step: 0.5, label: 'yearly rate', unit: '%' } },
        series: STARTERS.map(([age, color]) => ({ id: `from${age}`, label: `From ${age}`, color, start: 0, pay: 2400, from: age - 25, to: 40, rate: 'rate' })),
        note: 'The same example rate every year, after fees. No tax. Not a forecast.',
        alt: 'A chart from age 25 to 65 of three savers who pay in the same yearly amount, starting at 25, 35 and 45, with a slider for the yearly rate.',
      },
      check: (s) => s.rate !== 5 || 'Move the rate slider and watch the three totals.',
      solution: { rate: 8 },
      explain: r`
        At 5%, starting at 25 gives about ${money(Math.round(startedAt(25, 5) / 1000) * 1000)}, at 35 about ${money(Math.round(startedAt(35, 5) / 1000) * 1000)}, at 45 about ${money(Math.round(startedAt(45, 5) / 1000) * 1000)}. The early starter paid in twice as much as the late one and ends with more than three and a half times as much.

        Time is the main ingredient of retirement saving, as the lesson on compound growth showed. It is also the one ingredient that cannot be bought later. Starting late is still far better than not starting.
      `,
    },
    {
      id: 'four-percent',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        if (rng.bool()) {
          const pot = rng.pick([200000, 300000, 450000, 500000, 750000]);
          return {
            text: r`
              A rule of thumb from ${BENGEN.year}, the "**${BENGEN.ratePct}% rule**": take ${BENGEN.ratePct}% of a retirement pot in the first year (${money(4000)} from a pot of ${money(100000)}, for example), then the same amount each year, raised in line with prices.

              ${name} retires with a pot of **${money(pot)}**. **What does the rule give for the first year?**
            `,
            answer: (pot * BENGEN.ratePct) / 100,
            prefix: r`\$`,
            wrong: [[pot / BENGEN.ratePct, r`That divides by ${BENGEN.ratePct}. The rule takes ${BENGEN.ratePct} in every hundred.`]],
            hints: [r`1% of ${money(pot)} is ${money(pot / 100)}.`],
            explain: r`${BENGEN.ratePct}% of ${money(pot)} = **${money((pot * BENGEN.ratePct) / 100)}** a year. The rule comes from a study of US markets since 1926: a pot about half in shares, drawn on in this way, lasted at least ${BENGEN.years} years in every period tested. It is a starting point for thinking, not a guarantee: other countries' markets did worse, and nobody knows the next ${BENGEN.years} years.`,
          };
        }
        const income = rng.pick([12000, 20000, 24000, 30000, 40000]);
        return {
          text: r`
            A rule of thumb from ${BENGEN.year}, the "**${BENGEN.ratePct}% rule**": take ${BENGEN.ratePct}% of a retirement pot in the first year (${money(4000)} from a pot of ${money(100000)}, for example), then the same amount each year, raised in line with prices.

            ${name} would like the pot to provide **${money(income)}** in the first year. **By this rule, how large a pot would that take?**
          `,
          answer: (income * 100) / BENGEN.ratePct,
          prefix: r`\$`,
          wrong: [[(income * BENGEN.ratePct) / 100, r`That is ${BENGEN.ratePct}% of ${money(income)}. The question runs the other way: ${money(income)} is to be ${BENGEN.ratePct}% of the pot.`]],
          hints: [r`${money(income)} must be ${BENGEN.ratePct}% of the pot.`, r`${BENGEN.ratePct}% is one twenty-fifth: multiply by 25.`],
          explain: r`${money(income)} ÷ ${num(BENGEN.ratePct / 100)} = **${money((income * 100) / BENGEN.ratePct)}**: 25 times the yearly amount. The rule comes from a study of US markets since 1926, in which a pot about half in shares lasted at least ${BENGEN.years} years. It is a starting point for thinking, not a guarantee: other countries' markets did worse, and nobody knows the next ${BENGEN.years} years.`,
        };
      },
    },
    {
      id: 'advice',
      type: 'choice',
      title: 'Who is paid for what',
      text: r`
        This course explains how things work. Advice about one person's situation comes from a **regulated financial adviser**, and advisers are paid in two main ways:

        - a **fee** that the customer pays for the advice itself;
        - a **commission** paid by the company whose product the customer ends up buying.

        **Why does it matter which?**
      `,
      columns: 1,
      options: [
        { text: 'An adviser paid by commission earns more from some products than from others, which can pull against the customer\'s interest', correct: true },
        { text: 'Advice paid for by commission is free, so it is always the better deal', why: 'The commission is paid out of the product\'s charges, which means out of the customer\'s money in the end.' },
        { text: 'Advisers who charge a fee are not allowed to recommend anything', why: 'They can and do. The fee pays for the recommendation, whichever product it turns out to be.' },
      ],
      explain: r`
        Commission is not dishonest in itself, but it creates a **conflict of interest**, and some countries have banned it for investment advice for that reason. Two questions are always fair to ask: "Are you regulated, and by whom?" and "How are you paid?"

        If you like, one thing to try this week: find the yearly fee, as a percentage, on any fund, pension or investment account you can look up. It is usually in a document called the key facts or the fund factsheet.
      `,
    },
  ],
  recap: [
    'Fees compound against the investor: 1% a year can take about a third of a pot over 40 years. Costs are the one thing known in advance.',
    'Most actively managed funds trail their index over long periods, because of their costs. An **index fund** holds the whole market cheaply.',
    'Trying to time the market usually costs money: the best days sit next to the worst. Regular investing and rebalancing replace nerve with routine.',
    'For retirement, time is the main ingredient; an employer\'s matching contribution is part of the pay. Rules of thumb such as "4%" are starting points, not guarantees.',
  ],
  next: 'Next: the people who are after your money, and the tricks of your own mind. Why do clever people fall for scams?',
};
