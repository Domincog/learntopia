// Money: Financial Literacy for Real Life
//
// Personal finance from first principles: pay and tax, budgeting, compound growth, inflation, borrowing, protection, investing, and avoiding scams. Written for readers in any country.
// General education about money. Rules differ by country and by person: this is not financial advice.
export default {
  id: 'money',
  title: 'Money: Financial Literacy for Real Life',
  tagline: 'How pay, prices, debt, saving and investing really work, so that money decisions stop being guesswork.',
  category: 'people',
  level: 'Beginner',
  color: 'green',
  cover: 'coins',
  requires: [],
  description: 'Nobody is born knowing how a payslip, a credit card or a pension works, and few schools teach it. This course does, from first principles and with the arithmetic done on screen. See why moving into a higher tax band never takes back what you already earned, where a month of spending really goes, how interest compounds for you and against you, what inflation does to cash, why a small fee matters over thirty years, how spreading your money lowers risk, and how to spot a scam before it spots you. The examples use made-up people and round numbers; the ideas work in any currency.',
  outcomes: [
    'Read a payslip and explain how tax bands work',
    'Build a budget for an example person and explain opportunity cost',
    'Calculate simple and compound growth and use the rule of 72',
    'Explain inflation and the difference between nominal and real returns',
    'Compare the true cost of loans and credit cards using APR',
    'Explain what an emergency fund and insurance are for, and what is worth insuring',
    'Explain shares, bonds and funds, and why diversification and low costs matter',
    'Recognise the warning signs of scams and of common money mistakes',
  ],
  chapters: [
    {
      title: 'Money in, money out',
      lessons: [
        { id: 'pay-and-tax', title: 'What You Actually Earn', summary: 'Gross, net and everything in between: how tax bands work, and why a higher tax band never leaves you with less.', minutes: 14 },
        { id: 'budgeting', title: 'Where the Money Goes', summary: 'A plan for your money: needs, wants, saving, and the true cost of anything you buy.', minutes: 13 },
      ],
    },
    {
      title: 'Time and money',
      lessons: [
        { id: 'compound-growth', title: 'Interest on Interest', summary: 'Why money grows in a curve and not a line, the rule of 72, and what an early start is worth.', minutes: 14 },
        { id: 'inflation', title: 'The Shrinking Coin', summary: 'Prices rise, so money shrinks: what inflation is and what it does to wages, savings and debts.', minutes: 13 },
        { id: 'borrowing', title: 'The Price of Borrowing', summary: 'APR, minimum payments and the loan that costs twice its size: how debt really works.', minutes: 15 },
      ],
    },
    {
      title: 'Protecting and growing',
      lessons: [
        { id: 'safety-net', title: 'A Cushion and a Shield', summary: 'An emergency fund for the small shocks, insurance for the ruinous ones, and how to tell them apart.', minutes: 13 },
        { id: 'investing', title: 'Owning a Slice', summary: 'Shares, bonds and funds: what you are buying, why prices jump about, and how spreading out tames the risk.', minutes: 14 },
        { id: 'long-game', title: 'Fees, Time and Nerves', summary: 'Small costs compound too. Why patience and low fees beat cleverness, and how retirement saving works.', minutes: 14 },
      ],
    },
    {
      title: 'Staying out of trouble',
      lessons: [
        { id: 'scams-and-traps', title: 'Too Good to Be True', summary: 'How scams work, the tricks our own minds play with money, and a checklist for any big decision.', minutes: 14 },
      ],
    },
  ],
};
