// Money: Financial Literacy for Real Life · Lesson 5 · The Price of Borrowing
//
// Driving question: how can a $2,000 debt cost $4,000?
// The card, the loans and the people are invented examples (see ../helpers.js). The payday-loan figure,
// the UK price cap and the debt-advice services are real and were checked in November 2026.
import { r, num } from '../../../kit.js';
import { CARD, PAYDAY, HELP, PEOPLE, payDown, loanPayment, helpTable, money, paras } from '../helpers.js';

const MIN = payDown(CARD, 'min');
const FIXED = payDown(CARD, 100);
const span = (months) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} year${y === 1 ? '' : 's'}` : '', m ? `${m} month${m === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and ');
};
const card = (extra) => ({ type: 'card-paydown', ...CARD, ...extra });

const LOAN = { amount: 12000, apr: 8 };
const pay = (years) => loanPayment(LOAN.amount, LOAN.apr, years * 12);
const interestOver = (years) => pay(years) * years * 12 - LOAN.amount;
const HOME = { amount: 200000, apr: 5, years: 25 };
const HOME_PAY = loanPayment(HOME.amount, HOME.apr, HOME.years * 12);
const HOME_FIRST_INTEREST = (HOME.amount * HOME.apr) / 1200;

// The worked examples of the teaching screens.
// One month of Chidi's card (a balance the generated question cannot produce), rounded to the cent as payDown does.
const MONTH = { interest: Math.round(CARD.balance * CARD.apr / 12) / 100 };
MONTH.due = CARD.balance + MONTH.interest;
MONTH.min = Math.max(CARD.minFloor, Math.round(MONTH.due * CARD.minPct) / 100);
MONTH.after = Math.round((MONTH.due - MONTH.min) * 100) / 100;
// The first two payments of Sofia's van loan over seven years.
const VAN = { years: 7 };
VAN.pay = Math.round(pay(VAN.years) * 100) / 100;
VAN.interest1 = (LOAN.amount * LOAN.apr) / 1200;
VAN.principal1 = Math.round((VAN.pay - VAN.interest1) * 100) / 100;
VAN.owed2 = Math.round((LOAN.amount - VAN.principal1) * 100) / 100;
VAN.interest2 = Math.round(VAN.owed2 * LOAN.apr / 12) / 100;
// The total cost of a loan from its payments (an amount and a term the generated question cannot produce).
const COST = { amount: 6000, months: 30 };
COST.payment = Math.round(loanPayment(COST.amount, 8, COST.months));
COST.total = COST.payment * COST.months;
// A two-week fee as a simple yearly rate (a fee the generated question cannot produce).
const FEE_EX = 12;

export default {
  id: 'borrowing',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Only the minimum',
      text: r`
        Chidi owes ${money(CARD.balance)} on a credit card that charges ${CARD.apr}% a year (an example rate). He stops using the card.

        Each month the card asks for a **minimum payment**: ${CARD.minPct}% of what he owes, or ${money(CARD.minFloor)} if that is more. He pays exactly that, every month, until the debt is gone.

        **How much will he have paid in total?**
      `,
      min: 2000, max: 8000, step: 100, answer: 4000, tolerance: 500, start: 2000, unit: 'dollars',
      explain: r`
        About **${money(Math.round(MIN.paid / 10) * 10)}**: nearly twice what he borrowed. It takes him ${span(MIN.months)}.

        He never missed a payment and never spent another cent on the card. The cost comes from how the minimum payment is designed, and you can take it apart on the next screen.
      `,
    },
    {
      id: 'card-explore',
      type: 'interact',
      graded: false,
      title: 'Take the card apart',
      text: r`
        The dashed line is Chidi's debt if he pays only the minimum.

        **Switch to "Pay a fixed amount"** and try a few amounts. Watch what happens to the time it takes and to the interest.
      `,
      widget: card({ payment: 100, alt: 'A chart of a card balance of 2,000 dollars falling over the years, for minimum payments and for a fixed monthly payment, with a slider for the fixed payment.' }),
      check: (s) => (s.mode === 'fixed' && s.cleared) || (s.mode === 'fixed' ? 'That payment does not even cover the interest. Try a larger one.' : 'Press "Pay a fixed amount", then move the slider.'),
      solution: { mode: 'fixed', payment: 100 },
      explain: r`
        At a steady ${money(100)} a month the debt is gone in ${span(FIXED.months)} and costs ${money(Math.round(FIXED.interest))} in interest, against ${span(MIN.months)} and ${money(Math.round(MIN.interest))}.

        The minimum is a share of what is owed, so it **shrinks as the debt shrinks**. Chidi's first minimum payment is about ${money(51)}; four years later it is about ${money(31)}. Most of each small payment goes on that month's interest, and the debt barely moves.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'The price of money',
      text: r`
        **Interest** is the price of using someone else's money for a while. To compare prices, lenders in many countries must quote an **APR**, an annual percentage rate: the yearly cost of the loan as a percentage of what is owed, with compulsory fees included.

        A credit card usually adds interest every month: roughly one twelfth of the APR on whatever is owed.

        Most cards also have a **grace period**: someone who pays the *whole* statement balance by the due date each month is normally charged no interest on purchases at all. The card is then a way of paying, not a way of borrowing.
      `,
    },
    {
      id: 'example-month',
      type: 'info',
      title: 'Worked example: one month on the card',
      text: r`
        Take the first month of Chidi's ${money(CARD.balance)}, at an APR of ${CARD.apr}%.

        :::example
        1. One month's rate: ${CARD.apr}% ÷ 12 = ${num(CARD.apr / 12)}%.
        2. Interest added: ${num(CARD.apr / 12)}% of ${money(CARD.balance)} = **${money(MONTH.interest)}**. He now owes ${money(MONTH.due)}.
        3. Minimum payment: ${CARD.minPct}% of ${money(MONTH.due)} = **${money(MONTH.min, 2)}** (more than the ${money(CARD.minFloor)} floor, so the percentage decides).
        4. The first ${money(MONTH.interest)} of it only pays the interest. The debt itself falls by ${money(MONTH.min - MONTH.interest, 2)}, to ${money(MONTH.after, 2)}.
        :::

        Next month the minimum is ${CARD.minPct}% of a slightly smaller debt, so it is slightly smaller too. That is why the line falls so slowly.
      `,
      figure: card({ static: true, mode: 'min', alt: 'A chart of a card balance of 2,000 dollars paid off with minimum payments only: the line falls slowly and reaches zero after more than ten years.' }),
    },
    {
      id: 'month-interest',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const balance = rng.pick([600, 800, 1000, 1200, 1500, 2400, 3000]);
        const apr = rng.pick([12, 18, 24, 30]);
        const interest = (balance * apr) / 1200;
        return {
          text: r`
            A credit card has an APR of **${apr}%** (an example rate) and adds interest once a month: one twelfth of the yearly rate, on what is owed.

            ${name} owes **${money(balance)}** on it. **How much interest is added this month?**
          `,
          answer: interest,
          prefix: r`\$`,
          wrong: [[(balance * apr) / 100, r`That is a whole year of interest. One month is a twelfth of it.`]],
          hints: [r`${apr}% a year is ${num(apr / 12)}% a month.`, r`${num(apr / 12)}% of ${money(balance)}.`],
          explain: r`${apr}% ÷ 12 = ${num(apr / 12)}% a month, and ${num(apr / 12)}% of ${money(balance)} is **${money(interest)}**. A payment smaller than that would leave ${name} owing more than before.`,
        };
      },
    },
    {
      id: 'card-target',
      type: 'interact',
      attempts: 6,
      title: 'Two years',
      text: r`
        Chidi decides he wants the ${money(CARD.balance)} gone within two years.

        **Find the smallest fixed monthly payment that clears the debt in 24 months or less.** (The slider moves in steps of ${money(10)}.)
      `,
      widget: card({ fixedOnly: true, payment: 50, alt: 'A chart of a card balance of 2,000 dollars falling over time under a fixed monthly payment, with a slider for the payment.' }),
      check: (s) => {
        if (!s.cleared) return 'That payment does not cover the interest.';
        if (s.months > 24) return `At ${money(s.payment)} a month it takes ${span(s.months)}. Pay a little more.`;
        if (s.payment > 100) return `${money(s.payment)} a month does it in ${span(s.months)}. A smaller payment would still make the two years: find the smallest.`;
        return true;
      },
      solution: { payment: 100 },
      hints: [r`Without interest it would be ${money(CARD.balance)} ÷ 24, about ${money(83)}. Interest pushes it higher.`],
      explain: r`
        **${money(100)} a month**: exactly ${span(FIXED.months)}, with ${money(Math.round(FIXED.interest))} of interest. At ${money(90)} it would take ${span(payDown(CARD, 90).months)}.

        Roughly twice the first minimum payment turns a ten-year debt into a two-year one. Not everyone has that money to spare, and paying the minimum is far better than missing a payment. But where there is room, the difference is large.
      `,
    },
    {
      id: 'amort-explore',
      type: 'interact',
      attempts: 6,
      title: 'A loan in instalments',
      text: r`
        Sofia borrows ${money(LOAN.amount)} for a van at ${LOAN.apr}% a year (an example rate), to be repaid in equal monthly payments. Each bar is one year of payments.

        The most she can afford is ${money(200)} a month. **Find the shortest term at which the payment is ${money(200)} or less.**
      `,
      widget: { type: 'loan-schedule', ...LOAN, years: 3, yearsRange: [1, 10, 1], alt: 'A bar chart with one bar for each year of a loan of 12,000 dollars, split into interest and repayment of the debt, with a slider for the length of the loan.' },
      check: (s) => {
        if (s.payment > 200) return `Over ${s.years} years the payment is ${money(s.payment, 2)}: more than she can afford. Stretch the term.`;
        if (s.years > 7) return `That works, at ${money(s.payment, 2)} a month, but it costs ${money(Math.round(s.totalInterest))} in interest. A shorter term also fits her budget: find the shortest.`;
        return true;
      },
      solution: { years: 7 },
      explain: r`
        **Seven years**: ${money(pay(7), 2)} a month. Over three years it would have been ${money(pay(3), 2)}.

        Now compare the interest: ${money(Math.round(interestOver(3)))} over three years, ${money(Math.round(interestOver(7)))} over seven. Stretching a loan lowers the payment and raises the total, because the money is borrowed for longer. A low monthly figure on its own says little about what a loan costs.
      `,
    },
    {
      id: 'teach-amort',
      type: 'info',
      title: 'Where each payment goes',
      text: r`
        Each payment of an instalment loan does two jobs. It pays that month's **interest** on what is still owed. The rest pays off the debt itself, which is called the **principal**.

        :::example Sofia's van loan over ${VAN.years} years: ${money(VAN.pay, 2)} a month
        1. She owes ${money(LOAN.amount)}. One month's interest: ${LOAN.apr}% ÷ 12 of ${money(LOAN.amount)} = ${money(VAN.interest1, 2)}.
        2. The rest of the payment, ${money(VAN.pay, 2)} − ${money(VAN.interest1, 2)} = **${money(VAN.principal1, 2)}**, comes off the principal.
        3. Next month she owes ${money(VAN.owed2, 2)}, so the interest is a little less (${money(VAN.interest2, 2)}) and a little more is paid off.
        :::

        In the chart the hatched part of each bar is interest. It shrinks from year to year.
      `,
      figure: { type: 'loan-schedule', ...LOAN, years: VAN.years, static: true, alt: 'A bar chart with seven bars of equal height, one for each year of a loan of 12,000 dollars. The hatched part of each bar, the interest, shrinks from year to year.' },
    },
    {
      id: 'amort-first',
      type: 'choice',
      review: true,
      text: r`
        The chart shows a home loan of ${money(HOME.amount)} at ${HOME.apr}% a year (an example rate), repaid in equal monthly payments over ${HOME.years} years. Each bar is one year of payments.

        **In the first years, where does most of each payment go?**
      `,
      figure: { type: 'loan-schedule', ...HOME, static: true, alt: 'A bar chart with 25 bars of equal height, one for each year of a home loan. In the first bars most of the height is hatched (interest); the hatched part shrinks year by year until the last bars are almost all repayment.' },
      columns: 1,
      options: [
        { text: 'On interest: only a small part pays off the debt itself', correct: true },
        { text: 'On paying off the debt: interest comes at the end', why: 'It is the other way round. Interest is charged on what is still owed, and at the start nearly all of the loan is still owed.' },
        { text: 'Half and half, every year', why: 'The payment is the same every year, but the split changes: look at how the hatched part of the bars shrinks.' },
      ],
      explain: r`
        The first monthly payment is ${money(HOME_PAY, 2)}, of which ${money(HOME_FIRST_INTEREST, 2)} is interest and only ${money(HOME_PAY - HOME_FIRST_INTEREST, 2)} reduces the debt.

        Interest is charged on what is still owed, so it is largest at the start. As the debt falls, more of each payment goes to paying it off. This pattern is called **amortisation**, and it is why paying extra early in a loan saves the most interest.
      `,
    },
    {
      id: 'example-total',
      type: 'info',
      title: 'Worked example: what a loan costs',
      text: r`
        A loan offer normally states the payment and the number of payments. That is enough to find the price of the loan.

        :::example ${money(COST.amount)} borrowed, repaid in ${COST.months} monthly payments of ${money(COST.payment)}
        1. Everything paid back: ${COST.months} × ${money(COST.payment)} = ${money(COST.total)}.
        2. Take away what was borrowed: ${money(COST.total)} − ${money(COST.amount)} = **${money(COST.total - COST.amount)}** of interest.
        :::

        The interest is what is paid on top of the principal: the price of having the money for those ${COST.months} months.
      `,
    },
    {
      id: 'total-cost',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const amount = rng.pick([3000, 5000, 8000, 10000, 15000]);
        const months = rng.pick([24, 36, 48, 60]);
        const payment = Math.round(loanPayment(amount, rng.pick([6, 9, 12]), months));
        const total = payment * months;
        const thing = rng.pick(['a used car', 'a new boiler', 'a training course', 'dental work', 'a motorbike']);
        return {
          text: r`${name} borrows **${money(amount)}** for ${thing} and repays it in **${months} monthly payments of ${money(payment)}**. **How much interest does ${name} pay in total?**`,
          answer: total - amount,
          prefix: r`\$`,
          wrong: [[total, 'That is everything paid back. The interest is what is paid on top of the amount borrowed.']],
          hints: ['First find everything that is paid back.', r`${months} × ${money(payment)} = ${money(total)}. How much of that was borrowed?`],
          explain: r`Paid back: ${months} × ${money(payment)} = ${money(total)}. Borrowed: ${money(amount)}. The difference, **${money(total - amount)}**, is the price of the loan. This sum needs nothing but the payment and the number of payments, which a loan offer normally states.`,
        };
      },
    },
    {
      id: 'teach-kinds',
      type: 'info',
      title: 'Kinds of borrowing',
      text: r`
        Loans differ in what stands behind them and in how long they run.

        - **Secured loan**: backed by something the lender can take if payments stop, such as a home or a car.
        - **Unsecured loan**: backed only by a promise to repay, so the rate is usually higher.
        - **Payday loan**: a small sum for a few weeks, at a very high price.
        - **Buy now, pay later**: a purchase split into instalments, often free if paid on time, with charges if not.

        :::example A fee of ${money(FEE_EX)} for every ${money(100)}, for two weeks
        That is ${FEE_EX}% for two weeks, and a year has 26 two-week periods. As a simple yearly rate: ${FEE_EX}% × 26 = **${FEE_EX * 26}%**.
        :::
      `,
    },
    {
      id: 'kinds',
      type: 'match',
      title: 'Which kind is it?',
      text: '**Match each kind of borrowing with the case that shows it.**',
      pairs: [
        ['Secured loan', 'A loan to buy a flat: if the payments stop, the lender can take the flat'],
        ['Unsecured loan', 'A loan for a training course, given on a signed promise to repay and nothing else'],
        ['Payday loan', 'A few hundred dollars until the next pay day, for a steep fee'],
        ['Buy now, pay later', 'A coat paid for in four instalments at the checkout, with no charge if they are on time'],
      ],
      explain: r`
        A lender's risk is part of the price: a loan backed by a house is cheaper than one backed by nothing. The other side of a secured loan is what "secured" means: if the payments stop, the home or the car can be taken.

        "Buy now, pay later" is borrowing too, even when it is free. Several small plans at once are easy to lose track of.
      `,
    },
    {
      id: 'payday',
      type: 'numeric',
      gen: (rng) => {
        const fee = rng.pick([10, 15, 20, 25, 30]);
        const amount = rng.pick([100, 200, 300, 400]);
        return {
          text: r`
            A payday lender charges a fee of **${money(fee)} for every ${money(100)} borrowed**, and the loan must be repaid in **two weeks**. A borrower takes ${money(amount)}.

            ${fee}% sounds modest. But it is the price of two weeks, and a year has 26 of them. **What is that as a simple yearly rate?** (Multiply; ignore compounding.)
          `,
          answer: fee * 26,
          unit: '%',
          wrong: [[fee * 12, 'That multiplies by 12, as if the loan lasted a month. Two weeks fit into a year 26 times.'], [fee, r`${fee}% is the price for two weeks. The question is what that comes to over a year.`]],
          hints: ['How many two-week periods are there in a year of 52 weeks?', r`${fee}% × 26`],
          explain: r`
            ${fee}% × 26 = **${fee * 26}%** a year. The fee on ${money(amount)} is ${money((amount * fee) / 100)} each time, and a borrower who cannot repay after two weeks pays it again to roll the loan over.

            The US consumer finance regulator gives ${money(PAYDAY.feePer100)} per ${money(100)} for two weeks as a typical price: an APR of almost ${PAYDAY.aprAbout}%. Many countries cap such loans. In the United Kingdom, since ${PAYDAY.ukCapSince}, the charge may not exceed ${PAYDAY.ukDailyCapPct}% a day, and a borrower can never be made to pay back more than twice what was borrowed.
          `,
        };
      },
    },
    {
      id: 'teach-record',
      type: 'info',
      title: 'The record lenders look at',
      text: r`
        In many countries, agencies keep a **credit record** on each borrower: which loans and cards they have, and whether they paid on time. Lenders look at it, often boiled down to a **score**, before deciding whether to lend and at what rate.

        Where such records exist, the common core is much the same:

        - Paying on time counts most. Late payments are exactly what the record keeps.
        - Using most of a credit limit, or applying for a lot of credit in a short time, tends to count against a borrower.
        - Records contain mistakes more often than people expect. In most countries that have them there is a right to see one's own and have errors put right.

        The rest depends on the country, and some countries have no such system.
      `,
    },
    {
      id: 'credit-record',
      type: 'multi',
      title: 'The record',
      text: r`
        Think of a country where lenders use credit records. **Which of these habits usually help a borrower's record?** Choose all that apply.
      `,
      columns: 1,
      options: [
        { text: 'Paying bills and loan instalments on time', correct: true },
        { text: 'Using only a modest part of a credit limit', correct: true },
        { text: 'Looking at the record from time to time and having mistakes corrected', correct: true },
        { text: 'Applying for several new cards and loans within a few weeks', why: 'A burst of applications usually counts against a borrower: it can look like someone in urgent need of money.' },
        { text: 'Paying only once a reminder letter has arrived', why: 'By then the payment is late, and late payments are exactly what the record keeps.' },
      ],
      explain: r`
        Paying on time matters most everywhere, and a modest use of a limit and a corrected mistake both help. A burst of applications and a payment made only after the reminder count against a borrower.

        How the rest works (what a "good score" is, how long things stay on file) depends entirely on the country.
      `,
    },
    {
      id: 'payoff-order',
      type: 'choice',
      text: r`
        Farid has two debts: ${money(3000)} on a card at 24% a year, and ${money(800)} left on a loan at 9%. After the minimum payments on both, he has ${money(150)} a month to spare for them.

        **Putting the spare money toward which debt first leaves him paying the least interest overall?**
      `,
      columns: 1,
      options: [
        { text: 'The card at 24%: the highest rate first', correct: true },
        { text: r`The ${money(800)} loan: the smallest balance first`, why: 'That clears one debt sooner, and some people find that an early win keeps them going. But it costs more in interest: all the while, the larger debt goes on growing at 24%.' },
        { text: 'Half to each', why: 'Every dollar sent to the 9% loan instead of the 24% card saves less interest than it could.' },
        { text: 'It makes no difference', why: 'It does: a dollar of debt at 24% costs far more to keep for a month than a dollar at 9%.' },
      ],
      explain: r`
        Each dollar paid off stops costing its own rate of interest, so paying the **highest rate first** costs least. That is plain arithmetic.

        Paying the **smallest balance first** costs more but gets one debt out of the way quickly, and for some people that makes the difference between sticking to the plan and giving up. People who study debt disagree about which to recommend. Both are far better than not starting.
      `,
    },
    {
      id: 'trouble',
      type: 'info',
      tone: 'sober',
      title: 'When debt is too much',
      text: paras(
        r`Sometimes debts grow beyond what a person can repay: after an illness, a lost job, a separation, a rise in rent. It happens to a great many people, and it is not a moral failing.`,
        r`Free, independent debt advice exists in many countries. An adviser can deal with lenders, and knows the legal ways out that exist where you live. Some examples:`,
        helpTable(HELP.debt),
        r`Firms that charge a fee to "settle" or "clear" debts are best avoided: consumer bodies warn against them, and the free services do the same work.`,
        r`(Separately, and only if you like, one thing to try this week: find the APR on one statement, loan agreement or advert.)`,
      ),
      cta: 'Finish',
    },
  ],
  recap: [
    '**Interest** is the price of borrowed money, and the **APR** is the yardstick for comparing loans.',
    'A minimum payment shrinks with the debt, so paying only the minimum can take many years and cost as much again as the debt. A fixed, larger payment changes that completely.',
    'In an instalment loan the early payments are mostly interest. A longer term means a lower payment and a higher total cost.',
    'Paying the highest rate first costs least. If debt becomes unmanageable, free and independent advice exists, and asking for it early helps.',
  ],
  next: 'Next: what stands between a broken boiler and a new debt? A cushion, and for the big risks, a shield.',
};
