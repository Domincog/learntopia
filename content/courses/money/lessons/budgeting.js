// Money: Financial Literacy for Real Life · Lesson 2 · Where the Money Goes
//
// Driving question: where does a month's pay actually go?
// The people and their budgets are invented (see ../helpers.js); the spending shares are from the US
// Bureau of Labor Statistics.
import { r } from '../../../kit.js';
import { BUDGETS, SPENDING_SHARES as SHARES, FIFTY_THIRTY_TWENTY as RULE, PEOPLE, money, paras, pct } from '../helpers.js';

const BIG_THREE = Math.round(SHARES.housing + SHARES.transport + SHARES.food);
const builder = (b, extra = {}) => ({ type: 'budget-builder', person: b.name, income: b.income, items: b.items, ...extra });
const T = BUDGETS.tomas;
const M = BUDGETS.mira;
const miraFloor = M.items.filter((it) => it.group === 'needs').reduce((t, it) => t + (it.fixed ? it.amount : it.min), 0);

// Tomás again, a few months on: his budget balances with 600 saved, and now yearly bills have to fit in.
const YEARLY_BILLS = [['car insurance', 540], ['a licence fee', 180]];
const BILLS_TOTAL = YEARLY_BILLS.reduce((t, b) => t + b[1], 0);
const ASIDE = BILLS_TOTAL / 12;
const T2_ITEMS = [
  ...T.items.filter((it) => it.group === 'needs').map((it) => ({ ...it, fixed: true })),
  { id: 'aside', label: 'Set aside for yearly bills', group: 'needs', amount: 0, min: 0, max: 150, step: 10 },
  { id: 'fun', label: 'Eating out, hobbies', group: 'wants', amount: 700, min: 0, max: 1200, step: 10 },
  { id: 'saving', label: 'Saving', group: 'saving', amount: 600, min: 0, max: 1200, step: 10 },
];

// The worked example of the teaching screens: Noor's plan. Her pay and her shares are ones the generated
// "shares" question cannot produce.
const NOOR = {
  name: 'Noor', income: 3500,
  items: [
    { id: 'rent', label: 'Rent and bills', group: 'needs', amount: 2100, fixed: true },
    { id: 'food', label: 'Groceries and bus', group: 'needs', amount: 700, fixed: true },
    { id: 'fun', label: 'Eating out, hobbies', group: 'wants', amount: 420, fixed: true },
    { id: 'saving', label: 'Saving', group: 'saving', amount: 280, fixed: true },
  ],
};
const noorGroup = (g) => NOOR.items.filter((it) => it.group === g).reduce((t, it) => t + it.amount, 0);
const NOOR_SHARE = (g) => Number(((noorGroup(g) / NOOR.income) * 100).toFixed(2));
// Worked examples for a yearly cost and for a unit price (none of them in the generators' lists).
const YEAR_EX = { monthly: 11, weekly: 7, bill: 600 };
const UNIT_EX = [{ grams: 500, price: 2.1 }, { grams: 750, price: 2.85 }];
const unitCents = (p) => Math.round((p.price / (p.grams / 100)) * 100);

const LINA = [1400, 3100, 2200, 1800, 3600, 2300];
const LINA_MEAN = LINA.reduce((a, b) => a + b, 0) / LINA.length;

const REGULAR = [
  { what: 'a streaming service', per: 'month', times: 12, amounts: [8, 12, 15] },
  { what: 'a gym membership', per: 'month', times: 12, amounts: [25, 35, 40] },
  { what: 'a phone plan', per: 'month', times: 12, amounts: [18, 30, 45] },
  { what: 'a bus pass', per: 'week', times: 52, amounts: [15, 20, 25] },
  { what: 'a weekly takeaway meal', per: 'week', times: 52, amounts: [12, 18, 30] },
  { what: 'a magazine', per: 'week', times: 52, amounts: [4, 5, 6] },
];
const GOODS = ['rice', 'washing powder', 'oats', 'flour', 'coffee beans', 'dried lentils'];

export default {
  id: 'budgeting',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Three big things',
      text: r`
        Statisticians in the ${SHARES.country} record what households spend their money on, down to shoelaces and stamps.

        Of every \$100 that households spent in ${SHARES.year}, **how many dollars went on just three things: housing, transport and food?**
      `,
      min: 0, max: 100, step: 1, answer: BIG_THREE, tolerance: 6, start: 30, unit: '%',
      explain: r`
        About **${BIG_THREE}%**: housing ${pct(SHARES.housing)}, transport ${pct(SHARES.transport)}, food ${pct(SHARES.food)} (US Bureau of Labor Statistics, ${SHARES.year}). The shares differ from country to country and from household to household, but the pattern is common.

        Where a month's pay goes is decided mostly by a few big costs, not by the small ones. This lesson is about seeing all of them at once.
      `,
    },
    {
      id: 'teach-budget',
      type: 'info',
      title: 'A plan for the month',
      text: paras(
        r`A **budget** is a plan made before the month starts. It gives every dollar of income a job, in spending or in saving, so that income minus everything planned comes to zero.`,
        r`${NOOR.name} takes home ${money(NOOR.income)} a month. Her plan:`,
        ['| | |', '|---|--:|', ...NOOR.items.map((it) => `| ${it.label} | ${money(it.amount)} |`), `| **Total** | **${money(NOOR.items.reduce((t, it) => t + it.amount, 0))}** |`].join('\n'),
        r`The bar shows the same plan in three groups: [needs]{.blue} (what she cannot do without), [wants]{.orange} and [saving]{.green}.`,
      ),
      figure: builder(NOOR, { static: true, alt: 'A bar showing a monthly take-home pay of 3,500 dollars shared out completely: 2,800 dollars for needs, 420 for wants and 280 for saving.' }),
    },
    {
      id: 'build-tomas',
      type: 'interact',
      attempts: 6,
      title: 'Every dollar a job',
      text: r`
        Tomás takes home ${money(T.income)} a month. The bar is his pay; the coloured blocks are what he plans to do with it. His rent and bills are fixed, the rest he can change.

        He wants to save **${money(600)} a month**. **Move the sliders until he saves at least that and no dollar is left without a job.**
      `,
      widget: builder(T, { guide: [RULE.needs, RULE.wants, RULE.saving], alt: 'A bar showing a monthly take-home pay of 3,000 dollars shared between needs, wants and saving, with sliders for groceries, transport, eating out and saving.' }),
      check: (s) => {
        if (s.left < 0) return `That plans ${money(-s.left)} more than comes in. Something has to give.`;
        if (s.saving < 600) return `He is saving ${money(s.saving)} so far. Raise it to at least ${money(600)}.`;
        if (s.left > 0) return `${money(s.left)} still has no job. Give it one: spending or saving.`;
        return true;
      },
      solution: { amounts: { food: 400, transport: 200, fun: 700, saving: 600 } },
      hints: ['Start with the saving slider. Then look at what the bar says.', 'To save 600 he has to take 100 from somewhere else: there is only one pay to go round.'],
      explain: r`
        Now income minus planned spending and saving comes to zero: every dollar has a job.

        To reach ${money(600)}, something else had to shrink. That trade is the whole subject of budgeting, and it has a name that comes up later in the lesson.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'The words',
      text: r`
        Three ways of looking at the same month:

        - **Income − spending = what is left.** If the answer is negative, the gap is filled by debt or by savings.
        - **Fixed and variable costs.** Fixed costs are the same every month and hard to change quickly (rent, a loan payment). Variable costs move with what you do (food, fuel).
        - **Needs, wants and saving.** One well-known rule of thumb, "**${RULE.needs}/${RULE.wants}/${RULE.saving}**", suggests ${RULE.needs}% of take-home pay for needs, ${RULE.wants}% for wants and ${RULE.saving}% for saving and paying off debt (Warren and Tyagi, ${RULE.year}).

        A rule of thumb is a starting point for a plan. It is not a law, and many incomes cannot meet it, as you are about to see.
      `,
    },
    {
      id: 'fixed-variable',
      type: 'bucket',
      text: r`**Sort these monthly costs.** Which are fixed (the same each month, hard to change quickly) and which are variable?`,
      buckets: ['Fixed', 'Variable'],
      items: [
        ['Rent', 0],
        ['A loan repayment', 0],
        ['A phone contract', 0],
        ['An insurance premium', 0],
        ['Groceries', 1],
        ['Fuel for a car', 1],
        ['Eating out', 1],
        ['Clothes', 1],
      ],
      explain: r`
        Fixed costs are decided once, when a contract is signed, and then run every month. That is why the big decisions (where to live, whether to run a car) shape a budget far more than daily choices do: they set the fixed costs for years.
      `,
    },
    {
      id: 'example-shares',
      type: 'info',
      title: 'Worked example: the shares of a budget',
      text: r`
        A **share** is a part divided by the whole, written as a percentage. Here is ${NOOR.name}'s plan again: ${money(NOOR.income)} a month.

        :::example
        1. Needs: ${money(noorGroup('needs'))} ÷ ${money(NOOR.income)} = ${(noorGroup('needs') / NOOR.income).toFixed(2)}, which is **${NOOR_SHARE('needs')}%**.
        2. Wants: ${money(noorGroup('wants'))} ÷ ${money(NOOR.income)} = ${(noorGroup('wants') / NOOR.income).toFixed(2)}, which is **${NOOR_SHARE('wants')}%**.
        3. Saving: ${money(noorGroup('saving'))} ÷ ${money(NOOR.income)} = ${(noorGroup('saving') / NOOR.income).toFixed(2)}, which is **${NOOR_SHARE('saving')}%**.
        4. Check: ${NOOR_SHARE('needs')} + ${NOOR_SHARE('wants')} + ${NOOR_SHARE('saving')} = 100.
        :::

        Her needs take more than the ${RULE.needs}% of the ${RULE.needs}/${RULE.wants}/${RULE.saving} rule of thumb, marked by the triangles.
      `,
      figure: builder(NOOR, { static: true, guide: [RULE.needs, RULE.wants, RULE.saving], alt: 'The budget bar for a take-home pay of 3,500 dollars: needs 80 per cent, wants 12 per cent, saving 8 per cent. Triangles mark the 50/30/20 rule of thumb at 50 and 80 per cent.' }),
    },
    {
      id: 'shares',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const income = rng.pick([2000, 2500, 3000, 4000, 5000]);
        const needsPct = rng.pick([40, 45, 55, 60, 65, 70]);
        const savingPct = rng.pick([5, 10, 15, 20]);
        const wantsPct = 100 - needsPct - savingPct;
        const needs = (income * needsPct) / 100;
        const wants = (income * wantsPct) / 100;
        const saving = (income * savingPct) / 100;
        const word = needsPct > RULE.needs ? 'more than' : 'less than';
        const options = rng.shuffle(['more than', 'less than', 'exactly']).map((o) => (o === word ? `*${o}` : o)).join('|');
        return {
          text: r`
            ${name} takes home **${money(income)}** a month. Of that, ${money(needs)} goes on needs, ${money(wants)} on wants, and ${money(saving)} is saved.

            **Work out each share of the take-home pay.**
          `,
          template: `Needs: [[${needsPct}]]%. Wants: [[${wantsPct}]]%. Saving: [[${savingPct}]]%. The share for needs is [[${options}]] the ${RULE.needs}% of the ${RULE.needs}/${RULE.wants}/${RULE.saving} rule of thumb.`,
          hints: ['A share is the part divided by the whole, times 100.', r`Needs: ${money(needs)} ÷ ${money(income)}.`],
          explain: r`${money(needs)} ÷ ${money(income)} = **${needsPct}%**; ${money(wants)} ÷ ${money(income)} = **${wantsPct}%**; ${money(saving)} ÷ ${money(income)} = **${savingPct}%**. The three shares add up to 100%. Needs take ${word} the ${RULE.needs}% of the rule of thumb, which says nothing about whether the plan is a good one: it depends on what ${name}'s needs cost where ${name} lives.`,
        };
      },
    },
    {
      id: 'build-mira',
      type: 'interact',
      attempts: 6,
      title: 'When the rule does not fit',
      text: r`
        Mira takes home ${money(M.income)} a month, and her rent is ${money(1000)}: half her pay before she has eaten anything.

        The triangles mark the ${RULE.needs}/${RULE.wants}/${RULE.saving} rule. Try to get her needs down to ${RULE.needs}%. Then **build the best plan you can: every dollar with a job, and something saved**, however small.
      `,
      widget: builder(M, { guide: [RULE.needs, RULE.wants, RULE.saving], alt: 'A bar showing a monthly take-home pay of 2,000 dollars, half of it taken by rent, with sliders for groceries, everything else and saving.' }),
      check: (s) => {
        if (s.left < 0) return `That plans ${money(-s.left)} more than comes in.`;
        if (s.saving <= 0) return 'Find something for saving, however small: move it out of "everything else".';
        if (s.left > 0) return `${money(s.left)} still has no job.`;
        return true;
      },
      solution: { amounts: { food: 350, fun: 300, saving: 100 } },
      hints: ['Her fixed needs cannot be moved. Only groceries, "everything else" and saving can.'],
      explain: r`
        Her needs cannot go below ${money(miraFloor)}, which is ${pct((miraFloor / M.income) * 100)} of her pay. No amount of care with small things turns that into ${RULE.needs}%.

        When housing takes half of a pay packet, the textbook split is out of reach, and that is a fact about rents and wages, not about the person. A budget is still worth making: it is a plan for the money there is, and it shows that the lever that matters is a big one (income, housing), not the small treats.
      `,
    },
    {
      id: 'opportunity',
      type: 'choice',
      review: true,
      title: 'The real price',
      text: r`
        Kofi has saved \$900. He can spend it on a new phone, or keep his old phone and use the money as the deposit on a room nearer his work, which would save him two hours of travel a day.

        Economists say that every choice has an **opportunity cost**: the best alternative that is given up by making it. **What is the opportunity cost of the phone?**
      `,
      columns: 1,
      options: [
        { text: 'The deposit on the room: the best other thing the same money could have done', correct: true },
        { text: r`\$900`, why: 'That is the price. The opportunity cost is what he gives up by paying it: the best alternative use of the money.' },
        { text: 'Nothing, because he already had the money', why: 'Money he already has can still only be spent once. Choosing the phone means not choosing something else.' },
        { text: 'The interest the phone shop earns', why: 'The cost is counted from Kofi\'s side: what he can no longer do with the money.' },
      ],
      explain: r`
        The best alternative Kofi gives up is the room nearer his work, so that is the opportunity cost. Money spent on one thing cannot do another, and time works the same way.

        This is not an argument against the phone. It is a way of asking the question properly: not "can I afford this?" but "is this what I most want this money to do?"
      `,
    },
    {
      id: 'teach-yearly',
      type: 'info',
      title: 'The same cost, seen over a year',
      text: r`
        A small regular cost is easier to weigh against other uses of the money once it is a yearly figure. A year has **12 months** and **52 weeks**.

        :::example
        - A music subscription at ${money(YEAR_EX.monthly)} a month: ${money(YEAR_EX.monthly)} × 12 = **${money(YEAR_EX.monthly * 12)}** a year.
        - A swimming session at ${money(YEAR_EX.weekly)} a week: ${money(YEAR_EX.weekly)} × 52 = **${money(YEAR_EX.weekly * 52)}** a year.
        - The other way round: a bill of ${money(YEAR_EX.bill)} that comes once a year is ${money(YEAR_EX.bill)} ÷ 12 = **${money(YEAR_EX.bill / 12)}** a month.
        :::
      `,
    },
    {
      id: 'yearly',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const item = rng.pick(REGULAR);
        const amount = rng.pick(item.amounts);
        const other = item.times === 12 ? 52 : 12;
        return {
          text: r`${name} pays **${money(amount)} a ${item.per}** for ${item.what}. **What does that come to in a year?** (A year has 12 months, or 52 weeks.)`,
          answer: amount * item.times,
          prefix: r`\$`,
          wrong: [[amount * other, `That multiplies by ${other}. The cost is per ${item.per}, and a year has ${item.times} ${item.per}s.`]],
          hints: [`How many ${item.per}s are there in a year?`],
          explain: r`${money(amount)} × ${item.times} = **${money(amount * item.times)}** a year. Turning a weekly or monthly cost into a yearly one makes it possible to compare it with other things the same money could do. The sum works the same way for a big cost: a rent that is \$100 a month lower is \$1,200 a year.`,
        };
      },
    },
    {
      id: 'teach-unit',
      type: 'info',
      title: 'The price per 100 g',
      text: r`
        Two packs of different sizes can only be compared at the same amount. The **unit price** is the price of one standard amount, here 100 g: divide the price by the number of hundreds of grams in the pack.

        :::example Two bags of pasta
        1. ${UNIT_EX[0].grams} g for ${money(UNIT_EX[0].price, 2)}: that is ${UNIT_EX[0].grams / 100} lots of 100 g, so ${money(UNIT_EX[0].price, 2)} ÷ ${UNIT_EX[0].grams / 100} = **${unitCents(UNIT_EX[0])} cents** per 100 g.
        2. ${UNIT_EX[1].grams} g for ${money(UNIT_EX[1].price, 2)}: that is ${UNIT_EX[1].grams / 100} lots, so ${money(UNIT_EX[1].price, 2)} ÷ ${UNIT_EX[1].grams / 100} = **${unitCents(UNIT_EX[1])} cents** per 100 g.
        :::

        Here the larger bag is cheaper per 100 g. That is not always so, which is why the sum is worth doing.
      `,
    },
    {
      id: 'unit-price',
      type: 'choice',
      gen: (rng) => {
        const good = rng.pick(GOODS);
        const [u1, u2] = rng.sample([30, 35, 40, 45, 50, 55, 60], 2);
        const small = rng.pick([200, 400, 600]);
        const large = rng.pick([800, 1000, 1200]);
        const p1 = (u1 * small) / 10000;
        const p2 = (u2 * large) / 10000;
        const smallWins = u1 < u2;
        return {
          text: r`
            A shop sells ${good} in two sizes:

            - a small pack: **${small} g for ${money(p1, 2)}**
            - a large pack: **${large} g for ${money(p2, 2)}**

            **Which costs less per 100 g?**
          `,
          shuffle: false,
          options: [
            { text: 'The small pack', correct: smallWins, why: smallWins ? undefined : `Per 100 g the small pack costs ${u1} cents and the large one ${u2} cents.` },
            { text: 'The large pack', correct: !smallWins, why: smallWins ? `Bigger is not always cheaper. Per 100 g the large pack costs ${u2} cents and the small one ${u1} cents.` : undefined },
            { text: 'They cost the same per 100 g', why: `Divide each price by the number of 100 g in the pack: ${u1} cents against ${u2} cents.` },
          ],
          hints: ['Divide each price by the number of hundreds of grams in the pack.', r`Small pack: ${money(p1, 2)} ÷ ${small / 100}.`],
          explain: r`Small: ${money(p1, 2)} ÷ ${small / 100} = **${u1} cents** per 100 g. Large: ${money(p2, 2)} ÷ ${large / 100} = **${u2} cents** per 100 g. The ${smallWins ? 'small' : 'large'} pack is cheaper per 100 g. Many shops print the unit price in small type on the shelf label. (A lower unit price only helps if the larger amount gets used.)`,
        };
      },
    },
    {
      id: 'sinking',
      type: 'interact',
      attempts: 6,
      title: 'The bill that comes once a year',
      text: r`
        Tomás's plan balances. Then he remembers two bills that arrive once a year: ${YEARLY_BILLS.map((b) => `${b[0]} (${money(b[1])})`).join(' and ')}.

        **Set aside the right amount each month so that both are covered when they arrive, and rebalance the plan** so that every dollar still has a job.
      `,
      widget: { type: 'budget-builder', person: T.name, income: T.income, items: T2_ITEMS, alt: 'A budget bar for a take-home pay of 3,000 dollars with sliders for a monthly set-aside, eating out and saving.' },
      check: (s) => {
        if (s.amounts.aside < ASIDE) return s.amounts.aside === 0 ? 'Nothing is set aside yet. What do the two bills come to in a year, and per month?' : `${money(s.amounts.aside)} a month makes ${money(s.amounts.aside * 12)} in a year. The bills come to ${money(BILLS_TOTAL)}.`;
        if (s.amounts.aside > ASIDE) return `${money(s.amounts.aside)} a month makes ${money(s.amounts.aside * 12)} in a year: more than the ${money(BILLS_TOTAL)} needed.`;
        if (s.left < 0) return `The set-aside is right. Now the plan is ${money(-s.left)} over: take it from somewhere else.`;
        if (s.left > 0) return `${money(s.left)} has no job.`;
        return true;
      },
      solution: { amounts: { aside: ASIDE, fun: 700, saving: 540 } },
      hints: [r`The two bills together: ${money(YEARLY_BILLS[0][1])} + ${money(YEARLY_BILLS[1][1])}.`, r`${money(BILLS_TOTAL)} ÷ 12 months.`],
      explain: r`
        ${money(BILLS_TOTAL)} a year is **${money(ASIDE)} a month**. Set aside monthly, a yearly bill stops being a shock and becomes one more line in the plan.

        And again something else had to give way to make room for it.
      `,
    },
    {
      id: 'irregular',
      type: 'choice',
      title: 'When pay goes up and down',
      text: r`
        Lina is a freelance translator. Her take-home pay over the last six months was:

        ${LINA.map((v) => money(v)).join(', ')}.

        Her rent and bills arrive every month whatever she earned. **Which figure, used as the base for planning her essential spending, makes it least likely that she runs short in a thin month?**
      `,
      columns: 1,
      options: [
        { text: r`${money(Math.min(...LINA))}: her lowest month`, correct: true },
        { text: r`${money(LINA_MEAN)}: her average month`, why: `In ${LINA.filter((v) => v < LINA_MEAN).length} of these six months she earned less than the average. A plan built on the average comes up short more often than not.` },
        { text: r`${money(Math.max(...LINA))}: her best month`, why: 'A plan built on the best month fails in every other month.' },
        { text: r`${money(LINA[LINA.length - 1])}: her most recent month`, why: 'The most recent month says little about the next one when income jumps around like this.' },
      ],
      explain: r`
        A plan built on a low month holds in a low month. In the better months the extra goes into a buffer, and the buffer tops up the thin ones: in effect, Lina pays herself a steady wage out of an unsteady income.

        Irregular income is common: freelancers, people on shifts or commission, seasonal workers. It makes budgeting harder and a buffer more valuable.
      `,
    },
    {
      id: 'pay-first',
      type: 'choice',
      title: 'First or last',
      text: r`
        Two ways of saving \$200 a month:

        - **Plan A:** on payday, an automatic transfer moves \$200 into a savings account before anything else happens.
        - **Plan B:** at the end of the month, whatever is left over is saved.

        People who use plan A usually end up saving more than people who use plan B. **Why?**
      `,
      columns: 1,
      options: [
        { text: 'By the end of the month the money has usually found other uses; plan A takes the decision before that can happen', correct: true },
        { text: 'Banks pay a higher interest rate on money moved on payday', why: 'The rate does not depend on the day of the transfer. The difference is in behaviour, not in the bank.' },
        { text: 'Money moved automatically does not count as income', why: 'It is income like the rest. It has only been given its job first.' },
      ],
      explain: r`
        This is called **paying yourself first**. It works because it does not rely on willpower at the end of the month: the saving is treated like a fixed cost, and the rest of the plan is built round it. (The Psychology course looks at why "later" so reliably loses to "now".)

        It also only works when there is room for it. For Mira, a small automatic amount was the most that fitted, and that still counts.
      `,
    },
    {
      id: 'try',
      type: 'info',
      title: 'A plan, not a punishment',
      text: r`
        A budget does not tell anyone what they are allowed to enjoy. It shows where the money goes, so that the choices are made on purpose and the big costs are seen for what they are.

        If you like, one thing to try this week: pick one regular cost you know of (a subscription, a fare, a weekly habit) and work out what it comes to in a year. Then ask the opportunity-cost question: is that what you most want that money to do? Either answer is fine.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'A **budget** gives every dollar of income a job in advance: income minus planned spending and saving comes to zero.',
    'A few big costs (housing, transport, food) decide most budgets. Rules of thumb such as 50/30/20 are a starting point that many incomes cannot meet.',
    'The **opportunity cost** of anything is the best other use of the same money. Turning weekly and monthly costs into yearly ones makes the comparison possible.',
    'Saving first and automatically works better than saving what is left; yearly bills are tamed by setting money aside each month; irregular income calls for a plan built on a low month and a buffer.',
  ],
  next: 'Next: money that is saved does not just sit there. Why does it grow in a curve and not in a line?',
};
