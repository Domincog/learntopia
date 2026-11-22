// Money: Financial Literacy for Real Life · Lesson 1 · What You Actually Earn
//
// Driving question: can a pay rise ever leave you with less?
// Verdia, its tax bands, its payroll deductions and its housing benefit are invented (see ../helpers.js).
import { r } from '../../../kit.js';
import { VERDIA_BANDS as BANDS, VERDIA_PAYROLL as PAYROLL, VERDIA_BENEFIT as BENEFIT, PAY_WORDS, UK_TAPER, PEOPLE, bandTax, marginalRate, bandTable, money, paras, thousands } from '../helpers.js';

const bands = (extra) => ({ type: 'tax-bands', bands: BANDS, max: 120000, step: 1000, ...extra });

// Dara's payslip: 39,000 a year in Verdia.
const DARA = { yearly: 39000 };
DARA.gross = DARA.yearly / 12;
DARA.tax = Math.round((bandTax(DARA.yearly) / 12) * 100) / 100;
DARA.social = DARA.gross * PAYROLL.social;
DARA.pension = DARA.gross * PAYROLL.pension;
DARA.net = Math.round((DARA.gross - DARA.tax - DARA.social - DARA.pension) * 100) / 100;
const SLIP = {
  type: 'payslip', employer: 'Harbour Bakery Ltd', employee: 'Dara Okafor', period: 'March',
  lines: [
    { id: 'gross', section: 'Pay', label: 'Gross pay', amount: DARA.gross, note: 'Salary: 39,000 a year' },
    { id: 'tax', section: 'Deductions', label: 'Income tax', amount: -DARA.tax },
    { id: 'social', label: 'Social insurance (6%)', amount: -DARA.social },
    { id: 'pension', label: 'Pension contribution (4%)', amount: -DARA.pension },
    { id: 'net', section: 'Paid to you', label: 'Net pay', amount: DARA.net, strong: true },
  ],
};

// The worked examples of the teaching screens. Ravi earns 48,000 a year in Verdia: an income, and a monthly
// gross pay, that none of the generated questions below can produce.
const RAVI = { yearly: 48000 };
RAVI.gross = RAVI.yearly / 12;
RAVI.tax = bandTax(RAVI.yearly);
RAVI.monthTax = RAVI.tax / 12;
RAVI.social = RAVI.gross * PAYROLL.social;
RAVI.pension = RAVI.gross * PAYROLL.pension;
RAVI.deductions = RAVI.monthTax + RAVI.social + RAVI.pension;
RAVI.net = RAVI.gross - RAVI.deductions;
const RAVI_SLIP = {
  type: 'payslip', employer: 'Hillside Garden Centre Ltd', employee: 'Ravi Menon', period: 'May', mode: 'static',
  lines: [
    { id: 'gross', section: 'Pay', label: 'Gross pay', amount: RAVI.gross, note: 'Salary: 48,000 a year' },
    { id: 'tax', section: 'Deductions', label: 'Income tax', amount: -RAVI.monthTax },
    { id: 'social', label: 'Social insurance (6%)', amount: -RAVI.social },
    { id: 'pension', label: 'Pension contribution (4%)', amount: -RAVI.pension },
    { id: 'net', section: 'Paid to you', label: 'Net pay', amount: RAVI.net, strong: true },
  ],
};
// A rise that crosses the 40,000 line, for the worked example before the "raise" question.
const RISE = { from: 37000, to: 46000, line: 40000 };
RISE.low = (RISE.line - RISE.from) * marginalRate(RISE.from);
RISE.high = (RISE.to - RISE.line) * marginalRate(RISE.to - 1);
RISE.extraTax = bandTax(RISE.to) - bandTax(RISE.from);
// Converting pay between the hour, the month and the year.
const HOURLY = { rate: 21, hours: 25 };
HOURLY.week = HOURLY.rate * HOURLY.hours;
HOURLY.year = HOURLY.week * 52;
HOURLY.month = HOURLY.year / 12;

const pocketAt = (income) => income - bandTax(income) + (income <= BENEFIT.until ? BENEFIT.amount : 0);
const CLIFF_BACK = 33000;   // the income at which pay + benefit is back to what it was at 30,000

export default {
  id: 'pay-and-tax',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The pay rise',
      text: r`
        > **A note before we start.** This course is general education about money. It cannot take account of your own circumstances, and rules differ from country to country, so it is not financial advice.

        Dara earns \$39,000 a year. Her manager offers a rise to \$42,000. A colleague warns her: "Careful. Above \$40,000 you are in the 30% tax band instead of the 20% one. You could end up taking home **less**."

        **Is the colleague right?**
      `,
      options: [
        { text: 'No: she takes home more', correct: true },
        { text: 'Yes: she takes home less' },
        { text: 'She takes home exactly the same' },
      ],
      shuffle: false,
      explain: r`
        She takes home more, and by the end of this lesson you will be able to say exactly how much.

        The colleague's worry is one of the most widespread beliefs about tax. It rests on a picture of how tax bands work that is wrong, and the right picture is easier than it sounds.
      `,
    },
    {
      id: 'teach-payslip',
      type: 'info',
      title: 'Gross, deductions, net',
      text: r`
        A payslip tells one story in three parts. (We write \$ in this course; the ideas are the same in pounds, euros, rupees or pesos.)

        - **Gross pay** is what the job pays.
        - **Deductions** are taken off before the money arrives: here income tax, a contribution to social insurance, and a payment into a pension.
        - **Net pay**, or take-home pay, is what is left.

        :::example Ravi's slip for May
        1. Deductions: ${money(RAVI.monthTax)} + ${money(RAVI.social)} + ${money(RAVI.pension)} = ${money(RAVI.deductions)}.
        2. Net pay: ${money(RAVI.gross)} − ${money(RAVI.deductions)} = **${money(RAVI.net)}**.
        :::
      `,
      figure: { ...RAVI_SLIP, alt: 'A sample payslip for May. Gross pay 4,000 dollars; deductions: income tax 700, social insurance 240, pension contribution 160; net pay 2,900 dollars.' },
    },
    {
      id: 'payslip-read',
      type: 'interact',
      title: 'Read the slip',
      text: r`
        Here is another payslip: Dara's, for March. She earns \$39,000 a year at a bakery.

        **Tap the line that shows what arrives in her bank account.**
      `,
      widget: { ...SLIP, mode: 'pick', alt: 'A sample payslip for March with five lines: gross pay, income tax, social insurance, pension contribution and net pay.' },
      check: (s) => s.picked === 'net' || (s.picked === 'gross' ? 'That is what the job pays before anything comes off. Look for what is left at the end.' : s.picked ? 'That is one of the amounts taken off. Look for what is left after all of them.' : false),
      solution: { picked: 'net' },
      explain: r`
        **Net pay**, also called take-home pay: ${money(DARA.net)} of the ${money(DARA.gross)} she earned.

        The gap is not lost. Income tax pays for whatever the country has decided to fund together (schools, roads, health care, defence and so on; how much and on what is a political choice). Social insurance usually pays for state pensions and support when people are ill or out of work. The pension contribution is still her own money, set aside for later.
      `,
    },
    {
      id: 'gross-net',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const gross = rng.pick([1900, 2400, 2800, 3250, 3600, 4200, 5000]);
        const tax = Math.round((gross * rng.pick([0.08, 0.1, 0.12, 0.15])) / 5) * 5;
        const social = gross * PAYROLL.social;
        const pension = gross * PAYROLL.pension;
        const net = gross - tax - social - pension;
        return {
          text: r`
            ${name}'s payslip for one month shows:

            | | |
            |---|--:|
            | Gross pay | ${money(gross)} |
            | Income tax | ${money(tax)} |
            | Social insurance | ${money(social)} |
            | Pension contribution | ${money(pension)} |

            **What is the net pay?**
          `,
          answer: net,
          prefix: r`\$`,
          wrong: [
            [gross - tax, 'That takes off the income tax only. Social insurance and the pension contribution come off too.'],
            [tax + social + pension, 'That is the total of the deductions. Net pay is what is left after them.'],
          ],
          hints: ['Net pay is gross pay minus everything that is taken off.', r`Add up the three deductions first: ${money(tax)} + ${money(social)} + ${money(pension)}.`],
          explain: r`The deductions add up to ${money(tax + social + pension)}. Gross pay minus deductions: ${money(gross)} − ${money(tax + social + pension)} = **${money(net)}**.`,
        };
      },
    },
    {
      id: 'bands-explore',
      type: 'interact',
      graded: false,
      title: 'Tax, slice by slice',
      text: r`
        Dara lives in **Verdia**, an invented country. Its income tax is drawn here: yearly income runs from left to right, and in each band the hatched part is the share of those dollars that goes in tax.

        Start at \$39,000 and **slide the income up past the \$40,000 line**, to \$42,000 or more. Watch the hatched area to the *left* of the line while you do it.
      `,
      widget: bands({ income: 39000, alt: 'A bar for yearly income from 0 to 120,000 dollars, cut into four bands taxed at 0, 20, 30 and 40 per cent. A slider sets the income.' }),
      check: (s) => s.income >= 42000 || (s.income > 40000 ? r`A little further: take the income to \$42,000 or more.` : r`Slide the income to the right, across the \$40,000 line.`),
      solution: { income: 42000 },
      explain: r`
        Nothing changes to the left of the line: the hatched area there stays exactly as it was. Only the strip to the right of \$40,000 gets the taller, 30% hatching.
      `,
    },
    {
      id: 'bands-name',
      type: 'info',
      title: 'One rate for each slice',
      text: paras(
        r`What you just saw is how the tax works. Verdia's income tax, like that of most countries, is **progressive** (the rate rises with income) and charged in **bands**: each slice of income has its own rate.`,
        bandTable(),
        [':::key', 'Crossing a band line changes the rate on the dollars **above** the line, and on nothing else. Moving "into a higher band" does not re-tax what was already earned.', ':::'].join('\n'),
      ),
    },
    {
      id: 'example-tax',
      type: 'info',
      title: 'Worked example: a tax bill, slice by slice',
      text: r`
        Ravi earns ${money(RAVI.yearly)} a year in Verdia. Cut the income at the band lines and tax each slice at its own rate.

        :::example
        1. The first ${money(10000)}: at 0%, no tax.
        2. From ${money(10000)} to ${money(40000)} is a slice of ${money(30000)}: at 20%, ${money(30000 * 0.2)}.
        3. The top slice, above ${money(40000)}, is ${money(RAVI.yearly - 40000)}: at 30%, ${money((RAVI.yearly - 40000) * 0.3)}.
        4. Total: ${money(30000 * 0.2)} + ${money((RAVI.yearly - 40000) * 0.3)} = **${money(RAVI.tax)}** for the year.
        :::

        In the picture the bill is the hatched area. (A twelfth of it, ${money(RAVI.monthTax)}, was the tax line on his payslip.)
      `,
      figure: bands({ income: RAVI.yearly, static: true, alt: 'The tax bands of Verdia with an income of 48,000 dollars marked: nothing hatched up to 10,000, a fifth of the bar hatched from 10,000 to 40,000, and three tenths hatched from 40,000 to 48,000.' }),
    },
    {
      id: 'tax-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const income = rng.pick([14000, 22000, 30000, 36000, 45000, 50000, 60000, 72000, 90000, 100000]);
        const tax = bandTax(income);
        const top = marginalRate(income - 1);
        const slices = [];
        let from = 0;
        for (const b of BANDS) {
          const to = b.upTo == null ? Infinity : b.upTo;
          if (income > from && b.rate > 0) slices.push(r`${money(Math.min(income, to) - from)} at ${b.rate * 100}% = ${money((Math.min(income, to) - from) * b.rate)}`);
          from = to;
        }
        return {
          text: paras(
            r`An invented country charges income tax on yearly income in bands:`,
            bandTable(),
            r`${name} earns **${money(income)}** a year. **How much income tax is due for the year?**`,
          ),
          answer: tax,
          prefix: r`\$`,
          wrong: [
            ...(income * top !== tax ? [[income * top, r`That charges ${top * 100}% on the whole income. Only the slice inside the ${top * 100}% band is taxed at that rate.`]] : []),
            ...((income - 10000) * top !== tax && income > 40000 ? [[(income - 10000) * top, r`That charges ${top * 100}% on everything above ${money(10000)}. The slice from ${money(10000)} to ${money(40000)} is taxed at 20%.`]] : []),
          ],
          hints: ['Cut the income into slices at the band lines and tax each slice at its own rate.', r`The first ${money(10000)} is free of tax. What is left falls into the next band, or bands.`],
          explain: paras(r`Slice by slice: ${slices.join('; ')}.`, r`Total: **${money(tax)}**. The first ${money(10000)} is not taxed at all.`),
        };
      },
    },
    {
      id: 'teach-marginal',
      type: 'info',
      title: 'Marginal and average',
      text: r`
        Two rates describe any taxpayer.

        - The **marginal rate** is the rate on the *next* dollar earned: the band the top of the income sits in.
        - The **average rate** is the whole tax bill divided by the whole income.

        :::example Ravi: ${money(RAVI.yearly)} a year, ${money(RAVI.tax)} of tax
        1. ${money(RAVI.yearly)} ends inside the 30% band, so the marginal rate is **30%**.
        2. ${thousands(RAVI.tax)} ÷ ${thousands(RAVI.yearly)} = ${RAVI.tax / RAVI.yearly}, so the average rate is **${(RAVI.tax / RAVI.yearly) * 100}%**.
        :::

        The average is the lower of the two, because the early slices were taxed more lightly.
      `,
      figure: bands({ income: RAVI.yearly, static: true, alt: 'The tax bands of Verdia with an income of 48,000 dollars marked. The readouts give 30 per cent on the next dollar and 17.5 per cent on average.' }),
    },
    {
      id: 'marginal-average',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const income = rng.pick([16000, 20000, 25000, 50000, 60000, 75000, 100000, 125000, 200000]);
        const tax = bandTax(income);
        const marginal = marginalRate(income) * 100;
        const average = Math.round((tax / income) * 1000) / 10;
        return {
          text: paras(
            r`An invented country charges income tax on yearly income in bands:`,
            bandTable(),
            r`${name} earns **${money(income)}** a year and pays **${money(tax)}** in income tax.`,
          ),
          template: r`The next dollar ${name} earns is taxed at [[${marginal}]]%: that is the marginal rate. Over the whole income, the tax comes to [[${average}]]% of what ${name} earns: the average rate.`,
          hints: [r`Which band is the top of ${money(income)} in?`, r`Average rate: ${money(tax)} divided by ${money(income)}, as a percentage.`],
          explain: r`${money(income)} ends inside the ${marginal}% band, so the marginal rate is **${marginal}%**. The average rate is ${thousands(tax)} ÷ ${thousands(income)} = **${average}%**, lower than the marginal rate because the earlier slices were taxed at lower rates or not at all.`,
        };
      },
    },
    {
      id: 'example-raise',
      type: 'info',
      title: 'Worked example: a rise across a band line',
      text: r`
        Lina's pay rises from ${money(RISE.from)} to ${money(RISE.to)} a year. How much more does she take home, looking at income tax only? Split the rise at the band line.

        :::example
        1. The rise is ${money(RISE.to - RISE.from)}.
        2. Up to the line: ${money(RISE.line - RISE.from)} at 20% is ${money(RISE.low)} of tax.
        3. Above the line: ${money(RISE.to - RISE.line)} at 30% is ${money(RISE.high)} of tax.
        4. Extra tax: ${money(RISE.low)} + ${money(RISE.high)} = ${money(RISE.extraTax)}.
        5. She keeps ${money(RISE.to - RISE.from)} − ${money(RISE.extraTax)} = **${money(RISE.to - RISE.from - RISE.extraTax)}** more.
        :::
      `,
      figure: bands({ income: RISE.to, compare: RISE.from, static: true, alt: 'The tax bands of Verdia with two incomes marked: 37,000 dollars before the rise, in the 20 per cent band, and 46,000 dollars after it, in the 30 per cent band.' }),
    },
    {
      id: 'raise',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const [from, to] = rng.pick([[39000, 42000], [38000, 43000], [36000, 44000], [35000, 41000], [78000, 84000], [79000, 82000], [76000, 85000], [9000, 12000]]);
        const line = from < 10000 ? 10000 : from < 40000 ? 40000 : 80000;
        const lowRate = marginalRate(from);
        const highRate = marginalRate(to - 1);
        const extraTax = bandTax(to) - bandTax(from);
        const more = to - from - extraTax;
        return {
          text: paras(
            r`An invented country charges income tax on yearly income in bands:`,
            bandTable(),
            r`${name}'s pay rises from **${money(from)}** to **${money(to)}** a year, crossing a band line. Looking at income tax only, **how much more does ${name} take home in a year?**`,
          ),
          answer: more,
          prefix: r`\$`,
          wrong: [
            [(to - from) * (1 - highRate), r`That taxes the whole rise at ${highRate * 100}%. Part of the rise, up to ${money(line)}, is still in the ${lowRate * 100}% band.`],
            [to - from, 'That is the rise before tax. Some of it goes in income tax.'],
            [extraTax, 'That is the extra tax. The question asks what is left of the rise after it.'],
          ],
          hints: [r`Split the rise at ${money(line)}: one part is taxed at ${lowRate * 100}%, the rest at ${highRate * 100}%.`, r`Extra tax: ${money(line - from)} × ${lowRate * 100}% plus ${money(to - line)} × ${highRate * 100}%.`],
          explain: r`
            The rise is ${money(to - from)}. The first ${money(line - from)} of it is taxed at ${lowRate * 100}% (${money((line - from) * lowRate)}) and the other ${money(to - line)} at ${highRate * 100}% (${money((to - line) * highRate)}): ${money(extraTax)} of extra tax.

            ${name} keeps ${money(to - from)} − ${money(extraTax)} = **${money(more)}** more. Under bands like these, a rise always leaves more in the pocket, because no rate is above 100%.
          `,
        };
      },
    },
    {
      id: 'myth',
      type: 'choice',
      review: true,
      text: r`
        A friend says: "I turned down extra shifts. They would have pushed me into a higher tax band, and I would have ended up with less money."

        In a system of tax bands, **what is wrong with this reasoning?**
      `,
      columns: 1,
      options: [
        { text: 'The higher rate applies only to the income above the band line, not to everything earned', correct: true },
        { text: 'Nothing: once the line is crossed, the whole income is taxed at the higher rate', why: 'That is the myth itself. Each slice of income keeps its own rate; crossing a line changes the rate on the dollars beyond it and on nothing else.' },
        { text: 'Tax bands apply only to people who are self-employed', why: 'Bands apply to income tax in general, whoever pays it.' },
        { text: 'Extra shifts are never taxed', why: 'Extra earnings are income like any other, and are taxed at the marginal rate.' },
      ],
      explain: r`
        Tax is charged slice by slice. Earning more moves only the **extra** dollars into the higher band, and even those are taxed at less than 100%, so more pay means more take-home pay.

        There is one honest exception, and it is not about the bands themselves: a benefit or allowance that stops dead once income passes a threshold.
      `,
    },
    {
      id: 'cliff',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'The honest footnote',
      text: r`
        Suppose Verdia also pays a **housing benefit** of ${money(BENEFIT.amount)} a year to everyone who earns up to ${money(BENEFIT.until)}, and nothing at all above that.

        Kofi earns exactly ${money(BENEFIT.until)}. Watch the readout **pay + benefit** as his income rises. **Find the income at which he is back to exactly what he had in his pocket at ${money(BENEFIT.until)}.**
      `,
      widget: bands({ income: BENEFIT.until, max: 60000, step: 500, benefit: { ...BENEFIT, label: 'housing benefit' }, alt: 'The tax bands of Verdia up to 60,000 dollars, with a housing benefit of 2,400 dollars a year marked for incomes up to 30,000. A slider sets the income.' }),
      check: (s) => {
        const start = pocketAt(BENEFIT.until);
        if (s.income <= BENEFIT.until) return `At that income he still gets the benefit. Take the income above ${money(BENEFIT.until)}.`;
        if (s.pocket < start) return `At ${money(s.income)} he has ${money(s.pocket)} in his pocket: ${money(start - s.pocket)} less than before the rise. Keep going.`;
        if (s.pocket > start) return `At ${money(s.income)} he has ${money(s.pocket)}: more than the ${money(start)} he started with. Come back down to the point where the two are equal.`;
        return true;
      },
      solution: { income: CLIFF_BACK },
      hints: [r`At ${money(BENEFIT.until)} he has ${money(pocketAt(BENEFIT.until))}: pay after tax plus the benefit.`, 'Above the threshold he keeps 80 cents of each extra dollar. How many dollars does it take to make up for the lost benefit?'],
      explain: r`
        One dollar over the threshold costs Kofi the whole ${money(BENEFIT.amount)}. He needs a rise of ${money(CLIFF_BACK - BENEFIT.until)}, to **${money(CLIFF_BACK)}**, just to get back to where he was.

        This is called a **cliff**: a benefit, a tax credit or an allowance that stops dead at a threshold. Real systems have some. More often the withdrawal is gradual, which takes a large bite out of each extra dollar without making anyone worse off: in the United Kingdom, for example, the tax-free allowance is taken away step by step between £${thousands(UK_TAPER.from)} and £${thousands(UK_TAPER.to)}, so income in that range is in effect taxed at about ${UK_TAPER.effectivePct}% (${UK_TAPER.year}). So the careful answer to the hook is: tax bands alone never make a rise cost you money; a benefit that stops at a threshold sometimes can.
      `,
    },
    {
      id: 'teach-convert',
      type: 'info',
      title: 'By the hour, the month, the year',
      text: r`
        Pay is quoted by the hour, by the month or by the year. To compare two offers, bring them to the same period. A year has **52 weeks** and **12 months**.

        :::example Hanna: ${money(HOURLY.rate)} an hour, ${HOURLY.hours} hours a week
        1. One week: ${money(HOURLY.rate)} × ${HOURLY.hours} = ${money(HOURLY.week)}.
        2. One year: ${money(HOURLY.week)} × 52 = **${money(HOURLY.year)}**.
        3. One month: ${money(HOURLY.year)} ÷ 12 = **${money(HOURLY.month)}**.
        4. And back again: ${money(HOURLY.month)} × 12 = ${money(HOURLY.year)} a year.
        :::

        All of these are gross amounts: before tax and the other deductions.
      `,
    },
    {
      id: 'convert',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const kind = rng.pick(['hourly', 'monthly', 'yearly']);
        if (kind === 'hourly') {
          const rate = rng.pick([12, 15, 18, 20, 24, 30]);
          const hours = rng.pick([20, 30, 35, 40]);
          return {
            text: r`${name} is paid **${money(rate)} an hour** and works **${hours} hours a week**, every week of the year (52 weeks). **What is the gross pay for a year?**`,
            answer: rate * hours * 52,
            prefix: r`\$`,
            wrong: [[rate * hours * 12, 'That multiplies a week by 12. A year has 52 weeks, not 12.'], [rate * hours, 'That is one week. Multiply by the 52 weeks of the year.']],
            hints: ['First find the pay for one week.', r`${money(rate)} × ${hours} = ${money(rate * hours)} a week. Then 52 weeks.`],
            explain: r`One week: ${money(rate)} × ${hours} = ${money(rate * hours)}. One year: ${money(rate * hours)} × 52 = **${money(rate * hours * 52)}**. (A quick estimate for a 40-hour week: the hourly rate times 2,000.)`,
          };
        }
        if (kind === 'monthly') {
          const yearly = rng.pick([24000, 30000, 36000, 42000, 48000, 60000, 66000]);
          return {
            text: r`A job advert offers ${name} **${money(yearly)} a year**, paid in twelve equal monthly amounts. **What is the gross pay each month?**`,
            answer: yearly / 12,
            prefix: r`\$`,
            wrong: [[yearly / 52, 'That divides by 52, which gives a week. A year has 12 months.']],
            hints: ['A year has 12 months.'],
            explain: r`${money(yearly)} ÷ 12 = **${money(yearly / 12)}** a month, before tax and other deductions.`,
          };
        }
        const monthly = rng.pick([1800, 2250, 2600, 3100, 3400, 4500]);
        return {
          text: r`${name}'s contract says **${money(monthly)} a month**, before deductions. **What is that as a yearly salary?**`,
          answer: monthly * 12,
          prefix: r`\$`,
          wrong: [[monthly * 52, 'That multiplies by 52, the number of weeks. A year has 12 months.']],
          hints: ['A year has 12 months.'],
          explain: r`${money(monthly)} × 12 = **${money(monthly * 12)}** a year, gross.`,
        };
      },
    },
    {
      id: 'self-employed',
      type: 'bucket',
      title: 'Who sends the tax?',
      text: r`
        Dara is an **employee**: her employer works out the tax and sends it to the government before paying her. Her brother Emeka is **self-employed**, a plumber working for himself. Nobody takes tax out of what his customers pay him: he sends each of them an invoice (a bill for the work), and the tax on what he earns is settled later, in a bill of his own.

        **Sort each statement: whose working life does it describe?**
      `,
      buckets: ['Employee', 'Self-employed'],
      items: [
        ['Gets a payslip showing gross and net pay', 0],
        ['Tax is taken out before the money arrives', 0],
        ['The employer usually pays part of the social contributions', 0],
        ['Must put money aside during the year for a tax bill', 1],
        ['Sends invoices and keeps records of business costs', 1],
        ['Finds their own customers and agrees a price with each', 1],
      ],
      explain: r`
        For an employee, tax is mostly dealt with out of sight. A self-employed person receives money that still has tax owing on it: a share of every payment belongs to the tax office, and has to be kept back until the bill comes. Many people who start working for themselves are caught out by their first tax bill for exactly this reason.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Same ideas, different words',
      text: paras(
        r`Every country has its own names for these things. Three examples:`,
        ['| | Income tax | Social insurance | Pension saving |', '|---|---|---|---|', ...PAY_WORDS.map((w) => `| ${w.country} | ${w.tax} | ${w.social} | ${w.pension} |`)].join('\n'),
        r`If you like, one thing to try this week: look at one payslip, your own or a sample one from the internet, and find three lines on it: gross pay, the total taken off, and net pay.`,
      ),
      cta: 'Finish',
    },
  ],
  recap: [
    '**Gross pay** is what the job pays; **net pay** is what arrives after income tax, social contributions and pension payments.',
    'Tax bands work slice by slice: a higher rate applies only to the income above the band line. The **marginal rate** is the rate on the next dollar; the **average rate** is the whole bill divided by the whole income.',
    'A pay rise never costs you money because of tax bands alone. A benefit or allowance that stops dead at a threshold can, and real systems have some such cliffs.',
    'Employees have tax taken out for them; the self-employed have to set it aside themselves.',
  ],
  next: 'Next: the money has arrived. Where does a month of it actually go?',
};
