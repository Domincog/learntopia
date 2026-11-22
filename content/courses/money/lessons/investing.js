// Money: Financial Literacy for Real Life · Lesson 7 · Owning a Slice
//
// Driving question: what do you own when you own a share, and why does its price jump about?
// Long-run returns, the Bessembinder study, the record of losing periods, the 2007-09 crash and the
// regulators' warning on crypto-assets are real (sources in ../helpers.js). The simulator is a model.
// Nothing in this lesson recommends buying anything.
import { r, num } from '../../../kit.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/money/index.js';
import { LONG_RUN, BESSEMBINDER as BESS, LOSING_PERIODS as LOSING, CRASH_2008 as CRASH, CRYPTO_WARNING, compound, money, thousands } from '../helpers.js';

const SPAN = LONG_RUN.to - LONG_RUN.from + 1;
const grew = (rate) => compound(1, rate, SPAN);
const sim = (extra) => ({ type: 'diversify-sim', options: [1, 4, 25, 100], market: { mean: 6, sd: 15 }, specific: 30, ...extra });

export default {
  id: 'investing',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Pick a share, any share',
      text: r`
        A researcher followed every share listed on the US stock markets from ${BESS.from} to ${BESS.to}: about ${thousands(BESS.shares)} companies. For each he compared two things: what the share earned over its whole life on the market, and what the same money would have earned in the safest government bills.

        Over those ninety years the stock market as a whole did far better than the bills. **What percentage of the individual shares did better than the bills?**
      `,
      min: 0, max: 100, step: 1, answer: Math.round(BESS.betterPct), tolerance: 8, start: 50, unit: '%',
      explain: r`
        Only about **${Math.round(BESS.betterPct)}%**. Most shares, about four in every seven, did worse than the safest investment there is (Bessembinder, 2018).

        How can most shares disappoint while the market as a whole does well? The answer explains what investors are actually buying, and why almost nobody can reliably pick the winners.
      `,
    },
    {
      id: 'teach-what',
      type: 'info',
      title: 'Lending and owning',
      text: r`
        **Saving** keeps money safe and reachable. **Investing** puts it to work for years, accepting that its value will move about. Four things people hold:

        - **A savings account**: a promise from a bank to give the money back on request, with a little interest.
        - **A bond**: a loan to a government or a company. It pays interest each year, and the money back on a fixed date. (A government *bill* is a very short loan of the same kind, close to cash.)
        - **A share**: part-ownership of a company, a slice of whatever it earns in future.
        - **A fund**: a basket of many bonds or shares, owned jointly with thousands of other investors.
      `,
    },
    {
      id: 'what',
      type: 'match',
      title: 'Which is which?',
      text: r`
        **Match each of the four with the person who holds one.**
      `,
      pairs: [
        ['A savings account', 'Noor can take her money out of the bank whenever she likes, with a little interest added'],
        ['A bond', 'Kai has lent a government money for ten years, and is paid interest every year'],
        ['A share', 'Lina owns a ten-thousandth of a bakery chain, and of whatever it earns'],
        ['A fund', 'Farid and thousands of others jointly own a basket of 500 companies'],
      ],
      explain: r`
        A bond is a loan; a share is a slice of ownership. A bondholder is promised fixed payments. A shareholder is promised nothing: when the company does well the slice is worth more and may pay a **dividend**, and when it fails, shareholders are last in the queue. (Property is a third thing people invest in: a building that earns rent.)
      `,
    },
    {
      id: 'certificate',
      type: 'choice',
      title: 'Four shares, 1900',
      text: r`
        This is the top of a share certificate from 1900. It says that its holder owned four shares of "common stock" in a railway company.

        **What did those four shares give their owner?**
      `,
      figure: photo(MEDIA['share-1900'], {
        alt: 'The top of an ornate certificate printed in green. It reads: Number 3064, Common Stock, The Toledo and Ohio Central Railway Company, 4 Shares. A ram’s head is engraved in the centre.',
        caption: 'Share certificate, United States, 1900',
        creditLabel: 'Image',
      }),
      columns: 1,
      options: [
        { text: 'A small part of the ownership of the railway, and with it a claim on a part of its future profits', correct: true },
        { text: 'A loan to the railway, which it had to repay with interest', why: 'That would be a bond. A share is not a loan: the company never has to pay it back.' },
        { text: 'A guarantee of getting the money back', why: 'Shares carry no guarantee. If the company fails, its shareholders can lose everything they put in.' },
        { text: 'Four free railway journeys a year', why: 'A share is a slice of the company, not a ticket.' },
      ],
      explain: r`
        A share is a slice of a company. Its price today is what other people are willing to pay for that slice of its **future** profits, and nobody knows the future.

        That is why share prices jump about. Every piece of news changes people's guesses about what the company will earn, and the price moves at once to match the new guess.
      `,
    },
    {
      id: 'history',
      type: 'interact',
      graded: false,
      title: `${SPAN} years`,
      text: r`
        Economists have traced what investments earned around the world since ${LONG_RUN.from}, **after inflation**: shares about ${LONG_RUN.shares}% a year, government bonds ${LONG_RUN.bonds}%, cash-like government bills ${LONG_RUN.bills}%.

        The chart smooths that into steady growth of ${money(1)} in each. **Slide to ${SPAN} years.**
      `,
      widget: {
        type: 'growth-curve', years: 10, yearsRange: [1, SPAN, 1], yMax: 600,
        series: [
          { id: 'shares', label: 'Shares', color: 'green', start: 1, rate: LONG_RUN.shares },
          { id: 'bonds', label: 'Bonds', color: 'blue', start: 1, rate: LONG_RUN.bonds },
          { id: 'bills', label: 'Bills', color: 'gray', start: 1, rate: LONG_RUN.bills, dashed: true },
        ],
        note: `World averages after inflation, ${LONG_RUN.from} to ${LONG_RUN.to} (Dimson, Marsh and Staunton), smoothed into steady growth. Real markets did not grow smoothly. Not a forecast.`,
        alt: 'A chart of one dollar growing for up to 125 years at the long-run average real returns of shares, bonds and bills.',
      },
      check: (s) => s.years >= SPAN || `Slide all the way to ${SPAN} years.`,
      solution: { years: SPAN },
      explain: r`
        At those averages ${money(1)} in bills became about ${money(grew(LONG_RUN.bills), 2)} of buying power, in bonds about ${money(Math.round(grew(LONG_RUN.bonds)))}, and in shares about ${money(Math.round(grew(LONG_RUN.shares)))}.

        This is evidence about the past, not a promise. And the smooth lines hide the most important fact about the green one, which comes next.
      `,
    },
    {
      id: 'teach-risk',
      type: 'info',
      title: 'What the smooth lines hide',
      text: r`
        Real returns jump about from year to year, and those of shares jump most. Country by country from ${LONG_RUN.from} to ${LONG_RUN.sdTo} (the same researchers, Dimson, Marsh and Staunton), the yearly return on shares after inflation has typically been some ${Math.round(LONG_RUN.sd.shares)} percentage points above or below its average. For bonds the typical swing is about ${Math.round(LONG_RUN.sd.bonds)} points, for bills about ${Math.round(LONG_RUN.sd.bills)}.

        :::key
        **Risk and return travel together.** Shares have earned most and swung most: they can lose a large part of their value and stay down for years. The extra return is what investors are paid for living with that.
        :::
      `,
      figure: {
        type: 'bars', yMax: 30, yStep: 10, yLabel: 'typical swing (points)', showValues: true,
        data: [
          { label: 'Shares', value: LONG_RUN.sd.shares, color: 'green' },
          { label: 'Bonds', value: LONG_RUN.sd.bonds, color: 'blue' },
          { label: 'Bills', value: LONG_RUN.sd.bills, color: 'gray' },
        ],
        alt: `A bar chart of the typical yearly swing of real returns: shares ${LONG_RUN.sd.shares} percentage points, government bonds ${LONG_RUN.sd.bonds}, bills ${LONG_RUN.sd.bills}.`,
      },
    },
    {
      id: 'risk-return',
      type: 'choice',
      review: true,
      text: r`
        Over the long run, shares have earned much more than bonds, and bonds more than cash.

        **Why, then, does anyone hold bonds or cash?**
      `,
      columns: 1,
      options: [
        { text: 'Because the higher return of shares comes with far bigger swings: they can lose a large part of their value and stay down for years', correct: true },
        { text: 'Because shares are only for people who are already rich', why: 'Funds let people invest small amounts. The reason is risk, not a minimum.' },
        { text: 'Because over any five years, bonds and cash always beat shares', why: 'Usually it is the other way round. But "usually" is the point: sometimes shares do far worse.' },
        { text: 'Because the long-run figures are a mistake', why: 'They are among the best-documented numbers in finance. They are averages, and an average hides the rough years.' },
      ],
      explain: r`
        **Risk and return travel together.** The yearly return on shares swings far more than that of bonds or cash, and the extra return of shares is what investors are paid for living with that. Bonds and cash are held for their calm, not for their return.

        An investment that offers a high return with no risk does not exist. An offer that claims to is a warning sign, as the last lesson of this course shows.
      `,
    },
    {
      id: 'div-explore',
      type: 'interact',
      graded: false,
      attempts: 8,
      title: 'One company or many',
      text: r`
        A model: 200 investors, each holding shares of **one** company picked at random. Every company's year is the market's year plus its own luck, good or bad.

        **Run three or four years.** Then give every investor **25 companies** and run a few more. Watch how far apart the investors end up, and what the whole group does from year to year.
      `,
      widget: sim({ n: 1, alt: 'A bar chart of how 200 investors fared in one year, with buttons to choose how many companies each one holds and to run another year.' }),
      check: (s) => {
        if (!s.seen.includes(1)) return 'Run a few years with one company each first.';
        if (!s.seen.some((n) => n >= 25)) return 'Now choose 25 companies and run a few years.';
        return true;
      },
      solution: { seen: [1], n: 25, years: 3 },
      explain: r`
        With one company each, one investor can gain 60% in a year in which another loses half. With 25 each, they all end up close to the market's own result.

        But the market's result still jumps from year to year, and with 25 or 100 companies everyone jumps with it. Spreading out removes one kind of risk and leaves the other untouched.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Two kinds of risk',
      text: r`
        **Company-specific risk** is the luck of one firm: a failed product, a scandal, a brilliant invention. Across many companies the good and bad luck largely cancel out. Spreading money over many holdings is called **diversification**.

        **Market risk** is what moves all companies together: a recession, a financial crisis, a rise in interest rates. Holding more companies does nothing against it.

        A **fund** that holds hundreds or thousands of companies is diversification bought in one piece. It removes most of the first risk, and none of the second.

        :::example A fund holds 40 companies, the same amount of money in each
        One of them goes bankrupt. The fund loses one fortieth of its value: 100% ÷ 40 = **2.5%**. An investor who held only that company loses 100%.
        :::
      `,
    },
    {
      id: 'fund-share',
      type: 'numeric',
      gen: (rng) => {
        const n = rng.pick([50, 100, 200, 500, 1000]);
        const lossPct = 100 / n;
        return {
          text: r`
            A fund holds shares in **${n} companies**, the same amount of money in each. One of the companies goes bankrupt and its shares become worthless. Nothing else changes.

            **What percentage of its value does the fund lose?**
          `,
          answer: lossPct,
          unit: '%',
          tolerance: 0.001,
          wrong: [[100, 'An investor who held only that company would lose 100%. The fund has spread its money over many companies.']],
          hints: [r`What share of the fund's money was in that one company?`, r`100% ÷ ${n}`],
          explain: r`Each company is one ${n}th of the fund, so the fund loses 100% ÷ ${n} = **${num(lossPct)}%**. An investor who held only that one company lost everything. The bankruptcy is the same; the damage is not.`,
        };
      },
    },
    {
      id: 'div-target',
      type: 'interact',
      attempts: 6,
      title: 'How many is enough?',
      text: r`
        In this model one company's own luck swings its yearly return by about 30 percentage points either way. The readout **swing from company luck** shows what is left of that when holdings are combined.

        **Choose the smallest number of companies that brings the swing from company luck down to 6 points or less, and run a year with it.**
      `,
      widget: sim({ n: 1, alt: 'A bar chart of how 200 investors fared in one year, with buttons to choose how many companies each one holds and a readout of the swing left from company luck.' }),
      check: (s) => {
        if (s.specific > 6) return `With ${s.n} ${s.n === 1 ? 'company' : 'companies'} the swing from company luck is still about ${s.specific} points. Hold more.`;
        if (s.n > 25) return `That works: about ${s.specific} points. But a smaller number already gets it to 6. Find the smallest.`;
        return s.years >= 1 || 'That is the number. Now run a year with it.';
      },
      solution: { n: 25, years: 1 },
      explain: r`
        **25 companies**: the swing from company luck falls from 30 points to 6, a fifth, because it shrinks with the square root of the number of holdings ($30 \div \sqrt{25} = 6$). A hundred companies bring it to 3.

        The market's own swing, about 15 points in this model, is still there in full. And real companies share more of their luck than the model's do, so real portfolios need more holdings for the same effect: one reason funds hold hundreds.
      `,
    },
    {
      id: 'bessembinder',
      type: 'choice',
      review: true,
      text: r`
        A study of about ${thousands(BESS.shares)} US shares over ninety years found that most of them earned less than safe government bills, while the stock market as a whole earned far more.

        **How can both be true?**
      `,
      columns: 1,
      hints: ['Think of ten people in a room. Nine earn a little and one earns a fortune. Where does the average sit, compared with what most of them earn?'],
      options: [
        { text: 'A small number of shares made enormous gains, enough to carry the whole market; most of the others did poorly', correct: true },
        { text: 'The study must have counted wrongly: the market cannot do better than most of its shares', why: 'It can, in the way that the average wealth in a room rises a great deal when one billionaire walks in. An average can be far above the typical case.' },
        { text: 'Government bills were a better investment than the stock market', why: 'The market as a whole did far better than bills. It was the typical single share that did worse.' },
        { text: 'Shares only make money for people who trade them quickly', why: 'The study measured what each share earned over its whole life, for someone who simply held it.' },
      ],
      explain: r`
        Just ${thousands(BESS.topFirms)} companies, about ${BESS.topPct}% of them, accounted for the whole gain of the US market over bills in ${BESS.from} to ${BESS.to}. The rest, taken together, only matched the bills.

        Someone who picks a few shares will most likely miss those few. Someone who owns a slice of all of them, through a broad fund, is certain to hold them. That is the case for diversification in one fact, and it is why picking winners is so much harder than it looks.
      `,
    },
    {
      id: 'teach-speculating',
      type: 'info',
      title: 'Investing and speculating',
      text: r`
        A share or a bond is a claim on something that earns money: profits, interest. **Speculating** is buying something mainly in the hope that someone else will pay more for it later.

        **Crypto-assets** (digital coins and tokens) earn no profits and pay no interest: their price is whatever the next buyer will pay. What is known about them:

        - Their prices swing far more than share prices do, and have fallen by more than half several times.
        - Deposit protection covers money in bank accounts, not crypto-assets, and in many countries they are largely unregulated.
        - In most countries owning them is legal.
      `,
    },
    {
      id: 'crypto',
      type: 'choice',
      title: 'What the regulators say',
      text: r`
        Financial regulators in many countries have published warnings for people who think of buying crypto-assets. **Which statement matches what they say?**
      `,
      columns: 1,
      options: [
        { text: 'Their prices are extremely volatile, in many countries they are largely unregulated, and buyers should be prepared to lose all the money they put in', correct: true },
        { text: 'They are protected by the same guarantee as bank deposits', why: 'Deposit protection covers money in bank accounts. Crypto-assets are not covered by it.' },
        { text: 'Their price can only rise over time, because the supply is limited', why: 'A limited supply does not put a floor under a price. Crypto prices have fallen by more than half several times.' },
        { text: 'They are illegal to own in every country', why: 'In most countries owning them is legal. The warnings are about risk, not legality.' },
      ],
      explain: r`
        The ${CRYPTO_WARNING.body}, for example, has warned repeatedly that people who buy crypto-assets should "${CRYPTO_WARNING.words}". Regulators in many other countries say much the same.

        This course takes no view on whether anyone should own them. The description is simply the fair one: very large swings, little protection if something goes wrong, and no earnings underneath the price.
      `,
    },
    {
      id: 'horizon',
      type: 'choice',
      title: 'Time',
      text: r`
        The bars show roughly how often US shares **lost money** over holding periods of different lengths, from ${LOSING.from} to ${LOSING.to} (with dividends, before inflation).

        Roza will need her money in 18 months, for a deposit on a flat. Kai will not touch his for 25 years. **For whom is a fall in share prices the greater danger?**
      `,
      figure: {
        type: 'bars', yMax: 40, yStep: 10, unit: '%', yLabel: '% of periods with a loss',
        data: [
          { label: '1 year', value: LOSING.pct[1], color: 'red' },
          { label: '5 years', value: LOSING.pct[5], color: 'orange' },
          { label: '10 years', value: LOSING.pct[10], color: 'yellow' },
          { label: '20 years', value: LOSING.pct[20], color: 'green' },
        ],
        alt: `A bar chart: US shares lost money in about ${LOSING.pct[1]} per cent of one-year periods, ${LOSING.pct[5]} per cent of five-year periods, ${LOSING.pct[10]} per cent of ten-year periods and none of the twenty-year periods.`,
      },
      options: [
        { text: 'Roza', correct: true },
        { text: 'Kai', why: 'Kai has 25 years for prices to recover from a fall. Roza has 18 months.' },
        { text: 'It is the same for both', why: 'The chance of being down when the money is needed shrinks as the holding period grows: compare the bars.' },
      ],
      shuffle: false,
      explain: r`
        Over one year, shares lost money about one time in four. Over twenty years, in this record, never. Money that is needed soon may have to be taken out at a bad moment; money with decades ahead of it can wait.

        Two honest cautions. After inflation the record is worse, and other countries have fared worse than the United States: Japan's main share index took ${LOSING.nikkeiYears} years to get back to its 1989 peak. The past is a guide, not a guarantee.
      `,
    },
    {
      id: 'example-crash',
      type: 'info',
      title: 'Worked example: down, then back up',
      text: r`
        A share **index** is the combined price of a set of shares: a thermometer for a whole market. When it falls, the climb back is steeper than the fall was.

        :::example An index falls by 40%
        1. Start at 100. After the fall, 60 is left.
        2. To get back it has to gain 40, starting from 60.
        3. 40 ÷ 60 ≈ 0.667, so it must rise by **66.7%** (to one decimal place).
        :::

        A rise of 40% would not be enough: 60 × 1.4 is only 84.
      `,
    },
    {
      id: 'crash',
      type: 'numeric',
      review: true,
      title: 'A crash, calmly',
      gen: (rng) => {
        const fall = rng.pick([20, 25, 50, 60, 75, 80]);
        const left = 100 - fall;
        const gain = (fall / left) * 100;
        const answer = Math.round(gain * 10) / 10;
        return {
          text: r`
            In a crash, a share index falls by **${fall}%**. **By what percentage must it then rise to get back to where it started?** (Round to one decimal place if needed.)
          `,
          answer,
          unit: '%',
          tolerance: 0.06,
          wrong: [[fall, r`A rise of ${fall}% starts from the lower level, so it adds less than was lost. From ${left}, how much must be added to reach 100?`]],
          hints: [r`Start with 100. After the fall, ${left} is left.`, r`From ${left} back to 100 is a gain of ${fall}. What is ${fall} as a percentage of ${left}?`],
          explain: r`
            From 100, a fall of ${fall}% leaves ${left}. Getting back means gaining ${fall} on ${left}: ${fall} ÷ ${left} = **${num(answer, 1)}%**. Falls and rises are not symmetrical.

            In the financial crisis of ${CRASH.peak} to ${CRASH.trough}, the main US share index fell about ${CRASH.fallPct}% and needed a rise of about ${Math.round((CRASH.fallPct / (100 - CRASH.fallPct)) * 100)}% to recover. It was back at its old peak in ${CRASH.recovered}. Those who had to sell near the bottom made the loss real; those who could wait did not. If you like, one thing to try this week: when a headline says that markets "plunged", look up where the same index stood five years earlier.
          `,
        };
      },
    },
  ],
  recap: [
    'A **bond** is a loan; a **share** is a slice of a company and its future profits; a **fund** holds many of either.',
    '**Risk and return travel together.** Over more than a century shares have earned most and swung most. History is evidence, not a promise.',
    '**Diversification** removes most company-specific risk and none of the market risk. A few shares produce most of the market\'s gain, which is why picking winners is so hard.',
    'Time matters: money needed soon can be caught by a crash; money with decades ahead has, in the past, had time to recover.',
  ],
  next: 'Next: the things an investor can actually control. How much can a fee of 1% a year cost?',
};
