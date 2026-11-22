// Money: Financial Literacy for Real Life · Lesson 9 · Too Good to Be True
//
// Driving question: why do clever people fall for scams?
// Fraud figures, the Ponzi and Madoff cases, the trading study, the lottery payout and every help or
// reporting service named here are real and were checked in November 2026 (sources in ../helpers.js).
// The scheme in the simulator and the scam scenarios are invented.
import { r, num } from '../../../kit.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/money/index.js';
import { FRAUD, PONZI, MADOFF, BARBER_ODEAN as BO, LOTTERY, HELP, UK_159, SCAM_TYPES, SCAM_CASES, MIND_TRAPS, helpTable, money, paras, thousands } from '../helpers.js';
import { ponziRun } from '../../../../src/widgets/ponzi-sim.js';

const scheme = (extra) => ({ type: 'ponzi-sim', deposit: 1000, first: 10, town: 5000, skim: 10, ...extra });
const END = (promise) => { const h = ponziRun({ promise, deposit: 1000, first: 10, town: 5000, skim: 10 }); return h[h.length - 1]; };
const FAST = END(PONZI.promisePct);
const SLOW = END(10);
// Kinds that could fairly be given for the same story are never offered side by side.
const TOO_CLOSE = { phishing: ['impersonation'], impersonation: ['phishing'], recovery: ['advance', 'impersonation'], advance: ['recovery'], romance: [], investment: [] };

// The worked examples of the teaching screens: numbers that the generated questions cannot produce.
const OWED = { investors: 40, deposit: 1000, promise: PONZI.promisePct, skim: 10 };
OWED.each = (OWED.deposit * OWED.promise) / 100;                 // "profit" owed to one investor each round
OWED.bill = OWED.investors * OWED.each;
OWED.brings = OWED.deposit * (1 - OWED.skim / 100);              // what one new deposit adds to the pot
OWED.needed = Math.ceil(OWED.bill / OWED.brings);
OWED.next = (OWED.investors + OWED.needed) * OWED.each;
const GROW = { start: 600 };
const RAFFLE = { ticket: 4, share: 70 };
RAFFLE.back = (RAFFLE.ticket * RAFFLE.share) / 100;

const WHEEL = {
  type: 'ev-game', unit: 'dollars', price: 2, buttons: [1, 10, 100], max: 5000, showEV: true,
  outcomes: [
    { label: 'Jackpot', p: 1, prize: 50, color: 'yellow' },
    { label: 'Small prize', p: 10, prize: 5, color: 'teal' },
    { label: 'Nothing', p: 89, prize: 0, color: 'gray' },
  ],
  alt: 'A wheel of fortune with a small jackpot section, a small-prize section and a large section that wins nothing, beside a chart of the average result per game.',
};

export default {
  id: 'scams-and-traps',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      tone: 'sober',
      title: 'An industry',
      text: r`
        People in the ${FRAUD.country} can report fraud to a government agency, the Federal Trade Commission. Most victims never do.

        **How much money did the people who did report say they had lost to fraud in ${FRAUD.year}?**
      `,
      min: 0, max: 30, step: 0.5, answer: 16, tolerance: 3, start: 1, unit: 'billion dollars',
      explain: r`
        **${money(FRAUD.billions, 1)} billion**, in about ${FRAUD.reportsMillions} million reports, up from ${money(FRAUD.previous, 1)} billion the year before. Nearly half of it, ${money(FRAUD.investmentBillions, 1)} billion, went to investment scams.

        Fraud on this scale is not the work of lone tricksters. It is organised and professional, with scripts, call centres and staff who do nothing else. That is the first part of the answer to why clever people are caught: they are up against people who do this for a living.
      `,
    },
    {
      id: 'ponzi-explore',
      type: 'interact',
      graded: false,
      tone: 'sober',
      title: 'The oldest trick',
      text: r`
        A man in a town of ${thousands(5000)} people offers an investment: put in ${money(1000)} and receive **${PONZI.promisePct}% profit every round**. Early investors really are paid, and they tell their friends.

        There is no business behind it. **Press "Next round" a few times and watch where the "profit" comes from. Then run to the end.**
      `,
      widget: scheme({ promise: PONZI.promisePct, alt: 'Three bars: the people in the scheme out of a town of 5,000, the cash in the pot, and the profit owed in the next round.' }),
      check: (s) => s.collapsed || 'Keep going: press "Next round", or "Run to the end".',
      solution: { end: true },
      explain: r`
        Each round's "profit" was simply the money of the newest investors. While their number doubled, the pot swelled and everyone was paid on time, which is exactly what made the scheme look sound.

        In round ${FAST.round} the town ran out of new people, and it was over: ${thousands(FAST.losers)} of the ${thousands(FAST.investors)} investors, ${FAST.losersPct}%, got back less than they put in. This is a **Ponzi scheme**. It cannot be run honestly, and it cannot end any other way.
      `,
    },
    {
      id: 'teach-ponzi',
      type: 'info',
      tone: 'sober',
      title: 'The arithmetic of a Ponzi scheme',
      text: r`
        A Ponzi scheme earns nothing, so every promise it makes is a bill that only new deposits can pay.

        :::example What the scheme owes: ${OWED.investors} investors, ${money(OWED.deposit)} each, ${OWED.promise}% promised every round
        1. Owed next round: ${OWED.investors} × ${money(OWED.each)} = ${money(OWED.bill)} of "profit".
        2. Each new investor brings ${money(OWED.brings)} (the operator keeps ${money(OWED.deposit - OWED.brings)}). Paying the bill takes ${thousands(OWED.bill)} ÷ ${OWED.brings} ≈ ${num(OWED.bill / OWED.brings, 1)}: at least ${OWED.needed} new people.
        3. With those ${OWED.needed}, the round after, ${OWED.investors + OWED.needed} investors are owed ${OWED.investors + OWED.needed} × ${money(OWED.each)} = ${money(OWED.next)}.
        :::

        :::example If the promise were real
        ${OWED.promise}% added every round multiplies the money by 1.5 each time: ${money(GROW.start)} → ${money(GROW.start * 1.5)} → ${money(GROW.start * 1.5 ** 2)} after two rounds.
        :::
      `,
    },
    {
      id: 'ponzi-photo',
      type: 'numeric',
      tone: 'sober',
      gen: (rng) => {
        const periods = rng.pick([2, 3, 4]);
        const start = rng.pick([200, 1000, 2000]);
        const value = start * 1.5 ** periods;
        return {
          text: r`
            The scheme is named after this man, **Charles Ponzi**. In Boston in ${PONZI.year} he promised investors ${PONZI.promisePct}% profit in ${PONZI.days} days.

            Suppose that were real, and the profit were put back in each time. **What would ${money(start)} be worth after ${periods * PONZI.days} days: ${periods} periods of ${PONZI.days} days?** Give the nearest dollar.
          `,
          answer: Math.round(value * 100) / 100,
          tolerance: 0.51,
          prefix: r`\$`,
          wrong: [[start * (1 + 0.5 * periods), r`That adds 50% of the original sum each time. With the profit put back in, the money is multiplied by 1.5 each period.`]],
          hints: ['Multiply by 1.5 once for each period.', r`$${start} \times 1.5^{${periods}}$`],
          explain: r`
            $${start} \times 1.5^{${periods}}$ = ${thousands(value, Number.isInteger(value) ? 0 : 2)}. Kept up for a year (eight periods), 50% every 45 days would multiply money about 25 times. No real business does that, and a promise of it is the plainest warning sign there is.

            Ponzi said the profit came from trading international postal coupons. A financial journalist worked out that he would have needed 160 million of them; about 27,000 existed. He was arrested in August ${PONZI.year}. In ${MADOFF.year} the largest scheme of this kind collapsed: Bernard Madoff's clients had been shown about ${money(MADOFF.paperBillions)} billion on their statements that did not exist.
          `,
        };
      },
      figure: photo(MEDIA.ponzi, {
        alt: 'A black-and-white studio portrait from about 1920 of a neatly dressed man in a light suit, patterned tie and pocket handkerchief, with a slight smile.',
        caption: 'Charles Ponzi, about 1920',
        maxWidth: 300,
      }),
    },
    {
      id: 'ponzi-target',
      type: 'interact',
      tone: 'sober',
      attempts: 6,
      title: 'A more modest promise',
      text: r`
        Perhaps ${PONZI.promisePct}% was simply too greedy. Suppose the scheme promises a more believable return.

        **Lower the promise to 10% a round and run the scheme to its end.**
      `,
      widget: scheme({ promise: PONZI.promisePct, promiseRange: [10, 50, 10], alt: 'Three bars: the people in the scheme out of a town of 5,000, the cash in the pot, and the profit owed in the next round, with a slider for the promised return.' }),
      check: (s) => {
        if (s.promise !== 10) return 'Set the promise slider to 10% first.';
        return s.collapsed || `Round ${s.round}, and it is still paying. Run it to the end.`;
      },
      solution: { promise: 10, end: true },
      explain: r`
        It lasts longer, ${SLOW.round} rounds instead of ${FAST.round}, and then collapses just the same. This time ${SLOW.losersPct}% of the investors lose, because more of them joined too late to be paid back.

        A lower promise only buys time. Madoff's statements showed gains of roughly 10% a year, with hardly a losing month, for many years: modest enough to seem safe, and that steadiness was itself the sign that something was wrong. Real investments have bad years.
      `,
    },
    {
      id: 'teach-signs',
      type: 'info',
      tone: 'sober',
      title: 'What gives a scam away',
      text: r`
        A Ponzi scheme is one scam among many. Whatever the story, the same few warning signs give it away, and each one has a purpose.

        - **Returns that are too good**: high, and described as guaranteed. Real investments have bad years.
        - **Hurry**, and often **secrecy**: they stop the victim from thinking, or from asking anyone.
        - **Payment that cannot be reversed**: gift cards, crypto and wire transfers cannot be called back.
        - **Requests for the keys**: a password, a one-time code, remote access to a device. No bank, tax office or police force ever needs your code.
        - **Contact out of the blue**: the call, message or advert came looking for you.
      `,
    },
    {
      id: 'signs',
      type: 'multi',
      review: true,
      tone: 'sober',
      title: 'Warning signs',
      text: r`
        Scams change their costume every year, but the same few signs keep showing through.

        **Which of these are warning signs of a scam?** Choose all that apply.
      `,
      columns: 1,
      options: [
        { text: 'A high return described as guaranteed or risk-free', correct: true },
        { text: 'Pressure to decide today, before the chance is gone', correct: true },
        { text: 'A request to pay by gift card, cryptocurrency or wire transfer', correct: true },
        { text: 'A request for a password, a one-time code or remote access to a device', correct: true },
        { text: 'A written contract that you are encouraged to take away and read', why: 'Time to read, and to ask someone else, is the opposite of what a scammer wants.' },
        { text: 'A clear statement that you could lose money', why: 'Honest sellers of investments are required to say this. Scammers promise that you cannot lose.' },
      ],
      explain: r`
        Four signs: **returns that are too good**, **hurry**, **payment that cannot be reversed**, and **requests for the keys** (passwords, codes, remote access). Two more belong with them: contact that comes out of the blue, and a request to keep it secret.

        Each one has a purpose. Hurry and secrecy stop the victim from thinking or asking anyone. Gift cards, crypto and wire transfers cannot be called back. And no bank, tax office or police force ever needs your code.
      `,
    },
    {
      id: 'teach-kinds',
      type: 'info',
      tone: 'sober',
      title: 'Six kinds of scam',
      text: paras(
        r`The signs turn up in different stories. Six kinds of scam are common enough to have names, and each has its own mark:`,
        Object.keys(SCAM_TYPES).map((k) => `- **${SCAM_TYPES[k]}**: ${SCAM_CASES.find((c) => c.type === k).sign}.`).join('\n'),
      ),
    },
    {
      id: 'which-scam',
      type: 'choice',
      review: true,
      tone: 'sober',
      gen: (rng) => {
        const item = rng.pick(SCAM_CASES);
        const others = Object.keys(SCAM_TYPES).filter((k) => k !== item.type && !TOO_CLOSE[item.type].includes(k));
        return {
          text: r`
            ${item.text}

            **What kind of scam is this most likely to be?**
          `,
          options: [
            { text: SCAM_TYPES[item.type], correct: true },
            ...rng.sample(others, 3).map((k) => ({ text: SCAM_TYPES[k] })),
          ],
          explain: r`**${SCAM_TYPES[item.type]}**. The mark of it: ${item.sign}. Whatever the kind, the next move is the same: stop, and check through a channel you find yourself.`,
        };
      },
    },
    {
      id: 'teach-defence',
      type: 'info',
      tone: 'sober',
      title: 'Stop, then check',
      text: r`
        Whatever the kind of scam, the defence is the same, and it has two halves.

        **Before anything is lost:** stop. Do not click, pay or give details, and end the call. Then check through a channel you found yourself: the number on your card, on a bill or on the official website, never the number or the link in the message.

        **If money or details have already gone:** the bank comes first, at once, because banks can sometimes stop or recall a payment and minutes matter. A report to the official fraud-reporting service comes after that, and helps the next person.

        A real bank that suspects fraud freezes the account. It does not ask a customer to move money, to share a code, or to keep a call secret.
      `,
    },
    {
      id: 'what-to-do',
      type: 'order',
      tone: 'sober',
      title: 'What to do',
      text: r`
        A message or a call says there is a problem with your account, and that you must act now. **Put the steps in a sensible order.**
      `,
      items: [
        'Stop. Do not click, pay or give any details; end the call',
        'Find the organisation\'s number yourself: on your card, a bill or its official website',
        'Contact it that way and ask whether the message was real',
        'If money or details have already gone, tell your bank at once',
        'Report it to the official fraud-reporting service',
      ],
      labels: ['First', 'Last'],
      explain: paras(
        r`The whole defence is in the first two steps: **stop, and check through a channel you found yourself**, never through the number or link in the message. If money has gone, minutes matter: banks can sometimes stop or recall a payment. In the United Kingdom, dialling ${UK_159} connects customers of most banks to their own bank's real fraud line.`,
        r`Reporting helps the next person. Some official services:`,
        helpTable(HELP.fraud),
        r`People who are caught are not stupid. They were targeted by professionals, often at a tired or worried moment, and shame is what keeps most fraud unreported.`,
      ),
    },
    {
      id: 'safe-account',
      type: 'choice',
      review: true,
      tone: 'sober',
      text: r`
        The phone rings. A calm, professional voice says: "This is your bank's fraud team. Your account has been compromised. To protect your money, we need you to move it to a safe account straight away. I will give you the details."

        **What is the right way to read this call?**
      `,
      columns: 1,
      options: [
        { text: 'It is a scam: a bank never asks a customer to move money to a "safe account". Hang up and ring the number on your card', correct: true },
        { text: 'It is probably real, because the caller knew your name and your bank', why: 'Names, banks and even parts of card numbers are bought and sold among criminals. Knowing them proves nothing.' },
        { text: 'It is safe as long as the caller does not ask for your password', why: 'The caller does not need the password. The victim is being talked into making the transfer themselves.' },
        { text: 'Move a small amount first to test whether it is real', why: 'Any amount sent to the "safe account" goes to the criminals. Check by ringing the bank yourself instead.' },
      ],
      explain: r`
        The "safe account" belongs to the criminals. A real bank that suspects fraud freezes the account; it does not ask the customer to move money, to share a code, or to keep the call secret.

        The calm voice and the urgency are the method. Hanging up on a real bank costs nothing: ring back on the number printed on the card.
      `,
    },
    {
      id: 'teach-traps',
      type: 'info',
      title: 'Six habits of thought',
      text: paras(
        r`Not every loss needs a criminal. Some habits of thought cost money all by themselves, and salespeople know them well. Six of them have names:`,
        MIND_TRAPS.map((t) => `- **${t.name}**: ${t.means}.`).join('\n'),
        r`(The Psychology course looks at where they come from.)`,
      ),
    },
    {
      id: 'mind-traps',
      type: 'match',
      title: 'The tricks of our own minds',
      gen: (rng) => {
        const picked = rng.sample(MIND_TRAPS, 4);
        return {
          text: r`
            **Match each habit of thought with an example of it.**
          `,
          pairs: picked.map((t) => [t.name, t.example]),
          explain: r`
            ${picked.map((t) => `**${t.name}**: ${t.example.charAt(0).toLowerCase()}${t.example.slice(1)}.`).join(' ')}

            Nobody is free of these. Knowing their names does not switch them off, but it makes it easier to notice the moment and to slow down.
          `,
        };
      },
    },
    {
      id: 'barber-odean',
      type: 'choice',
      mode: 'predict',
      title: 'Busy hands',
      text: r`
        Two researchers studied the accounts of ${thousands(BO.households)} households at a US stockbroker over six years in the 1990s. They sorted the households into five groups by how often they bought and sold shares.

        **Which group ended up with the best return after costs?**
      `,
      options: [
        { text: 'The group that traded least', correct: true },
        { text: 'The group that traded most' },
        { text: 'There was no real difference' },
      ],
      shuffle: false,
      explain: r`
        The group that traded least. The fifth of households that traded **most** earned ${BO.activePct}% a year after costs, in years when the market as a whole returned ${BO.marketPct}% (Barber and Odean, 2000).

        The busy traders did not pick worse shares. They paid more in costs, and each trade was a fresh chance for overconfidence to act. The title of the study was "Trading is hazardous to your wealth".
      `,
    },
    {
      id: 'lottery',
      type: 'interact',
      graded: false,
      tone: 'sober',
      title: 'The house always knows',
      text: r`
        A lottery in miniature. A game costs ${money(2)}. One spin in a hundred wins ${money(50)}, ten in a hundred win ${money(5)}, and the rest win nothing.

        **Play at least 100 games** and watch the average result per game.
      `,
      widget: WHEEL,
      check: (s) => s.plays >= 100 || `That is ${s.plays} so far. Play at least 100: the button for 100 games is quickest.`,
      solution: { plays: 300 },
      explain: r`
        Over many games the average settles near **−${money(1)} a game** (after only a hundred it can still be some way off: keep playing and watch it close in). The prizes come to ${money(1)} a game on average ($\tfrac{1}{100} \times 50 + \tfrac{10}{100} \times 5$), and each game costs ${money(2)}.

        That gap is the **house edge**, and it is how every lottery, casino and betting firm earns its living. A single player can win; the players as a group cannot.
      `,
    },
    {
      id: 'teach-ev',
      type: 'info',
      tone: 'sober',
      title: 'The average result has a name',
      text: r`
        The long-run average result of one game is called its **expected value**: each prize times its chance, added up, minus the price. For the wheel that is ${money(1)} − ${money(2)}, a loss of ${money(1)} a game.

        When the share of the stakes that is paid out as prizes is known, the sum is shorter.

        :::example A raffle pays out ${RAFFLE.share}% of the ticket money as prizes. A ticket costs ${money(RAFFLE.ticket)}
        1. On average ${RAFFLE.share}% of ${money(RAFFLE.ticket)} comes back: ${money(RAFFLE.back, 2)}.
        2. The average loss is the rest: ${money(RAFFLE.ticket)} − ${money(RAFFLE.back, 2)} = **${money(RAFFLE.ticket - RAFFLE.back, 2)}** a ticket.
        :::

        A single player can win. The players as a group cannot.
      `,
    },
    {
      id: 'lottery-ev',
      type: 'numeric',
      review: true,
      tone: 'sober',
      gen: (rng) => {
        const ticket = rng.pick([1, 2, 5, 10]);
        const share = rng.pick([45, 50, 55, 60]);
        const back = (ticket * share) / 100;
        return {
          text: r`A lottery pays out **${share}%** of all the money staked as prizes. A ticket costs **${money(ticket)}**. **On average, how much does a player lose on each ticket?**`,
          answer: Math.round((ticket - back) * 100) / 100,
          prefix: r`\$`,
          tolerance: 0.001,
          wrong: share !== 50 ? [[back, r`${money(back, 2)} is what comes back in prizes, on average. The loss is the rest of the ticket price.`]] : [],
          hints: [r`On average, ${share}% of the ticket price comes back as prizes.`, r`${share}% of ${money(ticket)} is ${money(back, 2)}. What is left?`],
          explain: paras(
            r`On average ${money(back, 2)} of each ${money(ticket)} ticket comes back as prizes, so the player loses **${money(ticket - back, 2)}** a ticket. Real lotteries pay back roughly half: ${LOTTERY.name}, for example, puts ${LOTTERY.prizeSharePct}% of ticket sales into prizes. Whatever else a ticket is bought for, it is not an investment: the average result is a loss, by design.`,
            r`For some people gambling stops being a choice. Free, confidential help exists:`,
            helpTable(HELP.gambling),
          ),
        };
      },
    },
    {
      id: 'checklist',
      type: 'info',
      title: 'Five questions',
      text: paras(
        r`This course has no list of things to buy. It ends with five questions that fit any big money decision: a loan, an investment, a contract, a "once in a lifetime" offer.`,
        r`1. **Do I understand it** well enough to explain it to a friend?
2. **What is the total cost**, over the whole time, fees and interest included?
3. **What is the worst case**, and could I live with it?
4. **Who earns what** if I say yes?
5. **Can it wait a day?** If it cannot, that is an answer in itself.`,
        r`Free, official guidance on money exists in many countries, for instance:`,
        helpTable(HELP.guidance),
        r`If you like, one thing to try this week: the next time anything asks you to decide about money quickly, give it a day.`,
      ),
      cta: 'Finish the course',
    },
  ],
  recap: [
    'A **Ponzi scheme** pays old investors with new investors\' money. It needs ever more people and always collapses; a modest promise only delays the end.',
    'Warning signs: returns that are too good, hurry, secrecy, payment that cannot be reversed, requests for codes or access, the "safe account". The defence: stop, and check through a channel you found yourself.',
    'Our own minds set traps too: present bias, loss aversion, sunk costs, anchoring, overconfidence, the crowd. Gambling has a negative expected value by design.',
    'Before any big money decision: do I understand it, what is the total cost, what is the worst case, who earns what, can it wait a day?',
  ],
  next: 'That is the course: pay and tax, budgets, compound growth, inflation, debt, protection, investing, costs and traps. None of it tells you what to do with your money. All of it is there so that, whatever you decide, you can see what you are deciding.',
};
