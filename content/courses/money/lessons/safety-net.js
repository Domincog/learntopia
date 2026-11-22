// Money: Financial Literacy for Real Life · Lesson 6 · A Cushion and a Shield
//
// Driving question: what is worth insuring, and what is not?
// The survey figure and the deposit-protection limits are real (sources and dates in ../helpers.js);
// the households, the pool and Verdia's guarantee are invented.
import { r, num } from '../../../kit.js';
import { EMERGENCY_SURVEY as SURVEY, DEPOSIT_LIMITS, VERDIA_DEPOSIT_LIMIT as LIMIT, POOL, PEOPLE, payDown, money, paras } from '../helpers.js';

const REPAIR = { balance: 600, apr: 24, minPct: 2.5, minFloor: 25 };
const REPAIR_PLAN = payDown(REPAIR, 25);
const EXPECTED = (POOL.chancePct / 100) * POOL.loss;
const pool = (extra) => ({ type: 'insurance-pool', households: POOL.households, chance: POOL.chancePct / 100, loss: POOL.loss, what: 'house fire', ...extra });

// The worked examples of the teaching screens: numbers that the generated questions cannot produce.
const FUND_EX = 1100;                                        // essential spending a month
const DEPOSIT_EX = [140000, 75000];                          // balances in one Verdian bank
const POOL_EX = { households: 500, chancePct: 2, loss: 30000 };
POOL_EX.expected = (POOL_EX.chancePct / 100) * POOL_EX.loss;
POOL_EX.hits = (POOL_EX.households * POOL_EX.chancePct) / 100;
const EXCESS_EX = { excess: 400, big: 1500, small: 250 };

export default {
  id: 'safety-net',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Four hundred dollars',
      text: r`
        Every year the central bank of the ${SURVEY.country} asks thousands of adults the same question: if an unexpected expense of ${money(SURVEY.amount)} turned up, how would you pay for it?

        In ${SURVEY.year}, **what share said they would simply pay it from cash or savings** (or with a card they clear in full)?
      `,
      min: 0, max: 100, step: 1, answer: SURVEY.cashPct, tolerance: 8, start: 50, unit: '%',
      explain: r`
        **${SURVEY.cashPct}%**. The other ${100 - SURVEY.cashPct}% said they would borrow, sell something, or could not pay at all (${SURVEY.cannotPct}% could not, by any means).

        That is one country and one year, but the pattern is found in many: a large share of households have little or nothing set aside. Low and unsteady incomes are a large part of the reason. What a small cushion is worth, when there is room for one, is the first half of this lesson.
      `,
    },
    {
      id: 'teach-cushion',
      type: 'info',
      title: 'A cushion for small shocks',
      text: r`
        Cars break down, boilers fail, hours get cut. An **emergency fund** is money set aside for exactly that: a cushion that takes the blow, so that the bill does not have to be borrowed.

        A common rule of thumb for its size is **three to six months of essential spending**: rent, food, bills, transport.

        :::example Essential spending of ${money(FUND_EX)} a month
        3 × ${money(FUND_EX)} = ${money(3 * FUND_EX)} and 6 × ${money(FUND_EX)} = ${money(6 * FUND_EX)}. The rule of thumb gives a range from ${money(3 * FUND_EX)} to ${money(6 * FUND_EX)}.
        :::

        For many people that is years of saving. It is a direction, not a test, and the first small amount does the most work.
      `,
    },
    {
      id: 'shock',
      type: 'choice',
      title: 'A small shock',
      text: r`
        Jae's car needs a ${money(REPAIR.balance)} repair, and he needs the car for work. He has no savings, so the bill goes on a credit card at ${REPAIR.apr}% a year (an example rate), and he pays it off at ${money(25)} a month.

        Use the chart. **What does the repair end up costing him?**
      `,
      figure: { type: 'card-paydown', ...REPAIR, fixedOnly: true, payment: 25, paymentRange: [15, 200, 5], alt: 'A chart of a card balance of 600 dollars falling over time under a fixed monthly payment, with a slider for the payment and readouts of the time taken, the interest and the total paid.' },
      options: [
        { text: r`About ${money(Math.round(REPAIR_PLAN.paid / 5) * 5)}`, correct: true },
        { text: r`${money(REPAIR.balance)}`, why: 'That is the bill. Look at the readout "paid in total": the card adds interest every month until the debt is gone.' },
        { text: r`About ${money(650)}`, why: 'Look at the readout "paid in total" with the payment at 25 dollars a month.' },
        { text: r`About ${money(1200)}`, why: 'Not quite that bad. Look at the readout "paid in total" with the payment at 25 dollars a month.' },
      ],
      explain: r`
        About ${money(Math.round(REPAIR_PLAN.paid))}: ${money(Math.round(REPAIR_PLAN.interest))} of interest on top of the bill, spread over almost three years.

        With ${money(600)} set aside, the same repair would have cost ${money(600)}. That is the job of an **emergency fund**: it stops a small shock from turning into a debt. People without one pay more for the same bad luck.
      `,
    },
    {
      id: 'fund-size',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const essential = rng.pick([900, 1200, 1500, 1800, 2400]);
        return {
          text: r`
            A common suggestion for the size of an emergency fund is **three to six months of essential spending**: rent, food, bills, transport.

            ${name}'s essential spending is **${money(essential)} a month**. **What range does the suggestion give?**
          `,
          template: r`From \$[[${essential * 3}]] to \$[[${essential * 6}]].`,
          hints: [r`Three months: 3 × ${money(essential)}.`],
          explain: r`3 × ${money(essential)} = **${money(essential * 3)}** and 6 × ${money(essential)} = **${money(essential * 6)}**. For many people that is years of saving, and the suggestion is a direction, not a test. The first small target does the most work: even ${money(500)} covers many car repairs and broken appliances.`,
        };
      },
    },
    {
      id: 'teach-places',
      type: 'info',
      title: 'Safe, and within reach',
      text: r`
        Emergency money must be **all there** on the day it is needed, and **reachable within days**. Places for money differ on both counts.

        - **A bank account** keeps the same number of dollars. In most countries the government also guarantees deposits up to a limit if the bank fails: **deposit protection**.
        - **A fixed-term deposit** is safe, but locked away until its term ends.
        - **Shares and crypto-assets** have prices that move every day, and can fall a long way within weeks.
        - **Valuables** have to be sold first, at whatever a buyer offers.

        :::example Verdia (invented) guarantees ${money(LIMIT)} per person, per bank
        With ${money(DEPOSIT_EX[0])} in one bank, ${money(LIMIT)} is covered and ${money(DEPOSIT_EX[0] - LIMIT)} is not. With ${money(DEPOSIT_EX[1])}, all of it is covered.
        :::
      `,
    },
    {
      id: 'where',
      type: 'bucket',
      title: 'Where a cushion lives',
      text: r`
        Emergency money has a job: it must still be **all there** on the day it is needed, and it must be **reachable within days**.

        **Sort each place by whether it fits that job.**
      `,
      buckets: ['Fits the job', 'Does not fit'],
      items: [
        ['An easy-access savings account at a bank covered by deposit protection', 0],
        ['An ordinary current (checking) account', 0],
        { text: 'Shares in a company', bucket: 1, why: 'Shares can lose a large part of their value in weeks, and emergencies do not wait for prices to recover.' },
        { text: 'A deposit locked away for five years', bucket: 1, why: 'Safe, but not reachable, or only at a penalty.' },
        { text: 'Crypto-assets', bucket: 1, why: 'Their prices swing far more than share prices do.' },
        { text: 'A collectable watch', bucket: 1, why: 'It has to be sold first, at whatever price a buyer offers that week.' },
      ],
      explain: r`
        Safe and reachable usually means a plain account that pays little or no interest. That is the price of the job: the cushion is there to be available, not to grow. Growing is a different job, with different tools, and it comes in the next lesson.
      `,
    },
    {
      id: 'deposit',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const balance = rng.pick([60000, 130000, 150000, 180000, 250000]);
        const over = Math.max(0, balance - LIMIT);
        const banks = ['', '', 'two', 'three', 'four'][Math.ceil(balance / LIMIT)];
        return {
          text: r`
            In most countries the government guarantees bank deposits up to a limit, so that savers get their money back even if the bank fails. In the invented country of Verdia the limit is **${money(LIMIT)} per person, per bank**.

            ${name} has **${money(balance)}** in one Verdian bank. **If the bank failed, how much of it would not be covered?**
          `,
          answer: over,
          prefix: r`\$`,
          wrong: over > 0 ? [[LIMIT, 'That is the part that is covered. The question asks for the part above the limit.'], [balance, 'Most of it is covered: everything up to the limit.']] : [[balance, 'All of it is below the limit, so all of it is covered.']],
          hints: [r`Everything up to ${money(LIMIT)} is covered.`],
          explain: paras(
            over > 0 ? r`${money(balance)} − ${money(LIMIT)} = **${money(over)}** is above the limit and not covered. (Spread evenly over ${banks} banks, all of it would be.)` : r`${money(balance)} is below the limit of ${money(LIMIT)}, so **nothing** is uncovered.`,
            r`Real limits, per person and per bank, for comparison (they change: check the date):`,
            ['| | Limit | As of |', '|---|---|---|', ...DEPOSIT_LIMITS.map((d) => `| ${d.where} | ${d.limit} | ${d.asOf} |`)].join('\n'),
          ),
        };
      },
    },
    {
      id: 'pool-explore',
      type: 'interact',
      graded: false,
      title: 'A thousand households',
      text: r`
        Some losses are too big for any cushion. Each dot is a household. In any year each has a ${POOL.chancePct}% chance of a house fire that costs ${money(POOL.loss)}.

        They agree to share the risk: every household pays ${money(1200)} a year into a pool, and the pool pays for the fires. **Run at least five years** and watch two things: *who* is hit, and *how many*.
      `,
      widget: pool({ premium: 1200, alt: 'A thousand dots, one for each household. Each year a few of them, different ones each time, turn red.' }),
      check: (s) => s.years >= 5 || `That is ${s.years} year${s.years === 1 ? '' : 's'} so far. Run at least five.`,
      solution: { years: 5 },
      explain: r`
        *Who* is hit is pure chance, and for the household it is everything: ${money(POOL.loss)} gone. *How many* are hit changes far less: about ten, give or take a few, year after year. Nobody can predict one household's year. A thousand households together are predictable.
      `,
    },
    {
      id: 'teach-expected',
      type: 'info',
      title: 'The expected loss',
      text: r`
        That is the idea of **insurance**: a ruinous loss that nobody can predict is swapped for a small, certain cost. The sums start from the **expected loss**: the chance of the loss times its size.

        :::example ${POOL_EX.households} households, each with a ${POOL_EX.chancePct}% chance a year (1 in ${100 / POOL_EX.chancePct}) of losing ${money(POOL_EX.loss)}
        1. For one household: ${POOL_EX.chancePct}% × ${money(POOL_EX.loss)} = **${money(POOL_EX.expected)}** a year. (Or ${money(POOL_EX.loss)} ÷ ${100 / POOL_EX.chancePct}.)
        2. For the pool: in an average year ${POOL_EX.hits} of the ${POOL_EX.households} are hit, which costs ${POOL_EX.hits} × ${money(POOL_EX.loss)} = ${money(POOL_EX.hits * POOL_EX.loss)}.
        3. Shared by all ${POOL_EX.households}: ${money(POOL_EX.hits * POOL_EX.loss)} ÷ ${POOL_EX.households} = ${money(POOL_EX.expected)} each. A pool that collects less runs dry.
        :::

        One household never sees that average. A large pool nearly does: the **law of large numbers**, which the Probability course explores.
      `,
    },
    {
      id: 'expected',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const oneIn = rng.pick([50, 100, 200, 500, 1000]);
        const loss = rng.pick([20000, 50000, 100000, 200000]);
        const what = rng.pick(['a flood', 'a fire', 'a burst pipe that ruins a floor', 'a serious car accident', 'a theft']);
        return {
          text: r`
            In a large group of households, about **1 in ${oneIn}** suffers ${what} each year, at a cost of **${money(loss)}**.

            **What is the expected loss per household per year:** the average cost if it were shared equally by everyone?
          `,
          answer: loss / oneIn,
          prefix: r`\$`,
          wrong: [[loss, 'That is the loss of the one household that is hit. Shared over the whole group, it is much less per household.']],
          hints: [r`Picture ${oneIn} households. One of them loses ${money(loss)}. What is that per household?`, r`${money(loss)} ÷ ${oneIn}`],
          explain: r`${money(loss)} ÷ ${oneIn} = **${money(loss / oneIn)}** per household per year. An insurer has to charge at least that much, on average, or the pool runs dry.`,
        };
      },
    },
    {
      id: 'name',
      type: 'info',
      title: 'The words on the policy',
      text: r`
        - The **premium** is what you pay, every month or year, whether or not anything happens.
        - The **cover** is what the insurer will pay for, and up to how much.
        - The **excess** (or *deductible*) is the first part of any loss, which you bear yourself.

        :::example A policy with an excess of ${money(EXCESS_EX.excess)}
        - A loss of ${money(EXCESS_EX.big)}: you bear ${money(EXCESS_EX.excess)}, and the insurer pays ${money(EXCESS_EX.big)} − ${money(EXCESS_EX.excess)} = **${money(EXCESS_EX.big - EXCESS_EX.excess)}**.
        - A loss of ${money(EXCESS_EX.small)}: that is below the excess, so the insurer pays **nothing**.
        :::

        The premiums are what fills the pool. Together they have to cover at least the expected loss of everyone in it.
      `,
    },
    {
      id: 'premium-find',
      type: 'interact',
      attempts: 6,
      title: 'The break-even premium',
      text: r`
        Now you set the premium for the thousand households (a ${POOL.chancePct}% chance each year of a ${money(POOL.loss)} fire).

        **Set the premium at which the pool breaks even in an average year:** the money coming in equals the claims it should expect to pay. Run a few years at your premium to see how it does.
      `,
      widget: pool({ premium: 600, premiumRange: [500, 2000, 50], alt: 'A thousand dots, one for each household, with a slider for the yearly premium and buttons to run the years.' }),
      check: (s) => {
        if (s.premium < s.expected) return `At ${money(s.premium)} each, the thousand households pay in ${money(s.premium * 1000)} a year. In an average year ten of them claim ${money(POOL.loss)} each. The pool runs dry.`;
        if (s.premium > s.expected) return `At ${money(s.premium)}, the pool takes in ${money(s.margin)} per household more than it expects to pay out. Find the premium at which the two are equal.`;
        return true;
      },
      solution: { premium: EXPECTED },
      hints: ['How many of the thousand are hit in an average year, and what do their claims add up to?', r`Ten fires at ${money(POOL.loss)} is ${money(10 * POOL.loss)}. Shared between a thousand households, that is…`],
      explain: r`
        **${money(EXPECTED)}**: the expected loss. But run the pool at exactly ${money(EXPECTED)} and in about four years out of ten it is short, because chance gives eleven or thirteen fires about as often as nine or seven.

        A real insurer must also pay staff, keep reserves for a bad year, and make a profit. So the real premium is higher than the expected loss, perhaps ${money(1200)}. That means that, on average, **policyholders get back less than they pay in**. This is not a flaw or a trick. It is how insurance has to work.
      `,
    },
    {
      id: 'worth-it',
      type: 'choice',
      review: true,
      text: r`
        On average, people who buy insurance pay more in premiums than they receive in claims.

        **Why can insurance still be well worth buying?**
      `,
      columns: 1,
      options: [
        { text: 'Because it swaps a small, certain cost for protection against a loss that would be ruinous', correct: true },
        { text: 'Because over a lifetime everyone gets their premiums back', why: 'Most people do not, and that is how the pool can pay the few who are hit hard.' },
        { text: 'Because insurers are obliged to pay out more than they take in', why: 'An insurer that did that would run out of money. Premiums must cover claims, costs and reserves.' },
        { text: 'It cannot be: a product that loses money on average is never worth buying', why: 'That would be true if only the average mattered. But an average of 1,000 dollars a year is no comfort to the household that loses 100,000 in one go.' },
      ],
      explain: r`
        Insurance is not there to make money for the buyer. It is there to turn a loss that could wreck a household (a home, a lawsuit, years of income) into a cost it can plan for.

        The same reasoning gives the other half of the answer to this lesson's question: for a loss you could absorb from your own cushion, the average is what matters, and on average insurance costs more than it pays.
      `,
    },
    {
      id: 'warranty',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const price = rng.pick([300, 400, 500, 800]);
        const chancePct = rng.pick([5, 10]);
        const expected = (price * chancePct) / 100;
        const cost = expected * rng.pick([3, 4]);
        const thing = rng.pick(['washing machine', 'television', 'phone', 'vacuum cleaner', 'laptop']);
        return {
          text: r`
            ${name} buys a ${thing} for **${money(price)}**. At the till, an extended warranty is offered for **${money(cost)}**: if the ${thing} breaks down in the covered period, it is replaced. Suppose the chance of that is **${chancePct}%**.

            **What is the expected payout of the warranty?**
          `,
          answer: expected,
          prefix: r`\$`,
          wrong: [[price, r`That is what the warranty pays if the ${thing} does break. But that happens only ${chancePct}% of the time.`], [cost, 'That is the price of the warranty. The expected payout is the chance of a breakdown times what would then be paid.']],
          hints: ['Expected payout = the chance of a claim × the size of the claim.', r`${chancePct}% of ${money(price)}`],
          explain: r`${chancePct}% × ${money(price)} = **${money(expected)}**, for a warranty that costs ${money(cost)}. And the loss it covers, ${money(price)}, is unwelcome but not ruinous. That is why extended warranties are the textbook example of insuring something that could be carried by a cushion instead. Whether the peace of mind is worth the difference is for the buyer to decide.`,
        };
      },
    },
    {
      id: 'excess',
      type: 'numeric',
      gen: (rng) => {
        const name = rng.pick(PEOPLE);
        const excess = rng.pick([250, 500, 1000]);
        const loss = rng.pick([300, 800, 2400, 5000, 12000]);
        const paid = Math.max(0, loss - excess);
        const what = rng.pick(['a storm damages the roof', 'a pipe bursts', 'a bicycle is stolen', 'a kitchen fire damages the cupboards']);
        return {
          text: r`${name}'s home insurance has an **excess of ${money(excess)}**: the first ${money(excess)} of any loss is not covered. Then ${what}, and the loss comes to **${money(loss)}**. **How much does the insurer pay?**`,
          answer: paid,
          prefix: r`\$`,
          wrong: paid > 0 ? [[loss, r`The first ${money(excess)} is ${name}'s own to bear.`], [excess, 'That is the part the insurer does not pay.']] : [[loss, r`The loss is smaller than the excess of ${money(excess)}, so nothing is paid.`]],
          hints: [r`The insurer pays only what goes beyond the first ${money(excess)}.`],
          explain: paid > 0
            ? r`${money(loss)} − ${money(excess)} = **${money(paid)}**. ${name} bears the first ${money(excess)}. A higher excess means a lower premium, because the insurer no longer handles the small claims: the policy is left to do what insurance is good at.`
            : r`**Nothing**: the loss of ${money(loss)} is below the excess of ${money(excess)}, so ${name} bears all of it. A higher excess means a lower premium, because small losses like this one are left to the household's own cushion.`,
        };
      },
    },
    {
      id: 'teach-kinds',
      type: 'info',
      title: 'Shields of different shapes',
      text: r`
        Each kind of insurance is meant for one kind of large loss.

        - **Health insurance**: medical bills, in countries where the patient is charged.
        - **Home insurance**: fire, flood or theft where you live.
        - **Liability insurance**: harm you do by accident to other people or their property.
        - **Income protection**: being too ill or injured to work for a long time.
        - **Life insurance**: the loss of an income to the people who depend on it.

        Which of these a person needs depends on where they live, what the state already provides, and who relies on them. Some kinds are compulsory in some countries.
      `,
    },
    {
      id: 'kinds',
      type: 'match',
      title: 'Which shield?',
      text: '**Match each kind of insurance with a loss it is meant for.**',
      pairs: [
        ['Health insurance', 'A hospital sends its bill for an operation'],
        ['Home insurance', 'A burst pipe ruins the floors of a flat'],
        ['Liability insurance', 'A cyclist knocks a pedestrian over, and has to pay for the injury'],
        ['Income protection', 'A long illness keeps someone away from work for a year'],
        ['Life insurance', 'A family would be left without support if the person who earns its income died'],
      ],
      explain: r`
        Each policy answers one kind of loss. Life insurance, for instance, is for someone whose death would leave others without support.

        The test is the same each time: could I bear this loss myself? If you like, one thing to try this week: find the excess on one insurance policy, or find out which scheme protects bank deposits where you live, and up to what amount.
      `,
    },
  ],
  recap: [
    'An **emergency fund** stops a small shock from becoming a debt. It belongs somewhere safe and easy to reach; the first small target matters most.',
    'Bank deposits are guaranteed by governments up to a limit that differs from country to country.',
    '**Insurance** pools risk: one household\'s year is unpredictable, a thousand households\' year is not. Expected loss = chance × size.',
    'On average insurance costs more than it pays out, by design. It is worth it for losses that would be ruinous, and rarely for losses a cushion could absorb.',
  ],
  next: 'Next: money that will not be needed for many years can be put to work. What do you own when you own a share?',
};
