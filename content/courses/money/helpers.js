// Money: Financial Literacy for Real Life · the facts and the arithmetic of the course in one place.
//
// Two kinds of thing live here.
//
// 1. INVENTED teaching material: the country of Verdia with its tax bands and its deposit guarantee,
//    the example people, example interest rates and example loans. Every graded step is built on these,
//    so that no answer depends on one real country's rules.
// 2. REAL-WORLD FACTS, each in a table with its source and year, and each marked
//      [S]  confirmed by web search while this course was written (November 2026), or
//      [K]  from the author's own knowledge of the named source, not re-checked in that session.
//    Real figures appear only in predict steps, explanations and ungraded tables.
//
// tests/money-course.test.mjs keeps an independent copy of the key numbers and re-derives every sum.
//
// General education about money, not financial advice: every calculation is for a made-up person.

/** 1234567.8 -> "1,234,568" (whole numbers); thousands(1234.5, 2) -> "1,234.50" */
export const thousands = (v, digits = 0) => {
  const fixed = Math.abs(v).toFixed(digits);
  const [whole, part] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 && Number(fixed) !== 0 ? '-' : ''}${grouped}${part ? `.${part}` : ''}`;
};
/**
 * An amount of money for lesson text: money(1500) -> "\$1,500", money(4.5) -> "\$4.50".
 * The backslash matters: in lesson text a bare dollar sign can open a formula.
 */
export const money = (v, digits = null) => {
  const d = digits != null ? digits : (Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2);
  return `${v < 0 ? '-' : ''}\\$${thousands(Math.abs(v), d)}`;
};
/** A percentage without float fuzz: pct(12.5) -> "12.5%", pct(0.30000000004) -> "0.3%" */
export const pct = (v, digits = 2) => `${Number(v.toFixed(digits))}%`;
/** Round to a number of decimals without float fuzz. */
export const roundTo = (v, places = 0) => { const p = 10 ** places; return Math.round((v + Number.EPSILON * Math.sign(v)) * p) / p; };

// Example people. Never the learner. Names from many parts of the world.
export const PEOPLE = ['Dara', 'Tomás', 'Mira', 'Kofi', 'Aiko', 'Noor', 'Lina', 'Ravi', 'Chidi', 'Sofia', 'Jae', 'Amara', 'Mateo', 'Hanna', 'Farid', 'Mele'];

/* ------------------------------------------------------- 1 · pay and tax */

// INVENTED. Verdia's income tax, charged on yearly income slice by slice.
export const VERDIA_BANDS = [
  { upTo: 10000, rate: 0, name: 'tax-free' },
  { upTo: 40000, rate: 0.2, name: 'basic' },
  { upTo: 80000, rate: 0.3, name: 'middle' },
  { upTo: null, rate: 0.4, name: 'top' },
];
/** Income tax for a yearly income: each slice is taxed at its own band's rate. */
export function bandTax(income, bands = VERDIA_BANDS) {
  let tax = 0;
  let from = 0;
  for (const b of bands) {
    const to = b.upTo == null ? Infinity : b.upTo;
    if (income > from) tax += (Math.min(income, to) - from) * b.rate;
    from = to;
  }
  return Math.round(tax * 100) / 100;
}
/** The rate on the next dollar earned. */
export function marginalRate(income, bands = VERDIA_BANDS) {
  for (const b of bands) if (b.upTo == null || income < b.upTo) return b.rate;
  return bands[bands.length - 1].rate;
}
/** The bands as a table for lesson text. */
export const bandTable = (bands = VERDIA_BANDS) => {
  let from = 0;
  const rows = bands.map((b) => {
    const row = b.upTo == null ? `| Everything above ${money(from)} | ${b.rate * 100}% |` : `| ${from === 0 ? `The first ${money(b.upTo)}` : `From ${money(from)} to ${money(b.upTo)}`} | ${b.rate * 100}% |`;
    from = b.upTo;
    return row;
  });
  return ['| Slice of yearly income | Tax on that slice |', '|---|:-:|', ...rows].join('\n');
};

// INVENTED. Verdia's payslip deductions besides income tax, as shares of gross pay.
export const VERDIA_PAYROLL = { social: 0.06, pension: 0.04 };

// INVENTED. A benefit that stops dead at a threshold: the "cliff" behind the honest footnote.
export const VERDIA_BENEFIT = { amount: 2400, until: 30000 };

// [K] What the same things are called in three real systems (ungraded comparison table).
// Sources: IRS (Form W-2, FICA); HM Revenue & Customs (PAYE, National Insurance); Australian Taxation
// Office (PAYG withholding, Medicare levy, superannuation guarantee). Standard terms, stable for decades.
export const PAY_WORDS = [
  { country: 'United States', tax: 'Federal (and often state) income tax, "withheld" from each pay cheque', social: 'Social Security and Medicare ("FICA")', pension: '401(k) contributions' },
  { country: 'United Kingdom', tax: 'Income Tax, taken through "PAYE"', social: 'National Insurance', pension: 'Workplace pension' },
  { country: 'Australia', tax: 'Income tax, "PAYG withholding"', social: 'Medicare levy', pension: 'Superannuation ("super")' },
];

// [S] A real cliff. UK, tax year 2026-27: the tax-free Personal Allowance (12,570 pounds) is withdrawn
// by 1 pound for every 2 pounds of income above 100,000, so income between 100,000 and 125,140 pounds
// is in effect taxed at about 60%. Sources: HMRC rates; widely reported (MoneyWeek, Rathbones 2026).
export const UK_TAPER = { from: 100000, to: 125140, effectivePct: 60, year: '2026-27' };

/* ----------------------------------------------------------- 2 · budgeting */

// [S] Where household spending goes. US Bureau of Labor Statistics, Consumer Expenditure Surveys,
// calendar year 2025 (released October 2026): shares of average annual expenditures.
// (2024, for comparison: housing 33.4, transportation 17.0, food 12.9.)
export const SPENDING_SHARES = { country: 'United States', year: 2025, housing: 33.9, transport: 16.5, food: 13.0 };

// [K] The 50/30/20 rule of thumb: Elizabeth Warren and Amelia Warren Tyagi, "All Your Worth" (2005).
// Shares of take-home pay: 50% needs, 30% wants, 20% saving and debt repayment.
export const FIFTY_THIRTY_TWENTY = { needs: 50, wants: 30, saving: 20, year: 2005 };

// INVENTED. Example budgets (monthly, after tax).
export const BUDGETS = {
  tomas: {
    name: 'Tomás', income: 3000,
    items: [
      { id: 'rent', label: 'Rent', group: 'needs', amount: 900, fixed: true },
      { id: 'bills', label: 'Energy, water, phone', group: 'needs', amount: 200, fixed: true },
      { id: 'food', label: 'Groceries', group: 'needs', amount: 400, min: 250, max: 700, step: 50 },
      { id: 'transport', label: 'Transport', group: 'needs', amount: 200, min: 100, max: 500, step: 50 },
      { id: 'fun', label: 'Eating out, hobbies', group: 'wants', amount: 800, min: 0, max: 1200, step: 50 },
      { id: 'saving', label: 'Saving', group: 'saving', amount: 0, min: 0, max: 1200, step: 50 },
    ],
  },
  mira: {
    name: 'Mira', income: 2000,
    items: [
      { id: 'rent', label: 'Rent', group: 'needs', amount: 1000, fixed: true },
      { id: 'bills', label: 'Energy, water, phone', group: 'needs', amount: 150, fixed: true },
      { id: 'food', label: 'Groceries', group: 'needs', amount: 350, min: 250, max: 500, step: 25 },
      { id: 'transport', label: 'Bus pass', group: 'needs', amount: 100, fixed: true },
      { id: 'fun', label: 'Everything else', group: 'wants', amount: 400, min: 0, max: 600, step: 25 },
      { id: 'saving', label: 'Saving', group: 'saving', amount: 0, min: 0, max: 600, step: 25 },
    ],
  },
};

/* ------------------------------------------------------ 3 · compound growth */

/** A = P(1 + r)^n, with r as a percentage. */
export const compound = (principal, ratePct, years) => principal * (1 + ratePct / 100) ** years;
/** Simple interest: the same amount is added every year. */
export const simple = (principal, ratePct, years) => principal * (1 + (ratePct / 100) * years);
/** Effective annual rate (%) of a nominal yearly rate (%) added `periods` times a year. */
export const effectiveRate = (nominalPct, periods) => ((1 + nominalPct / 100 / periods) ** periods - 1) * 100;
/** Exact number of years for money to double at a yearly rate (%). */
export const doublingYears = (ratePct) => Math.log(2) / Math.log(1 + ratePct / 100);
/** Value after `years` of paying `yearly` in at the start of each year from year `from` to year `to` (exclusive). */
export function savedUp(yearly, ratePct, from, to, years) {
  let balance = 0;
  for (let y = 0; y < years; y++) {
    if (y >= from && y < to) balance += yearly;
    balance *= 1 + ratePct / 100;
  }
  return balance;
}

// [K] Exponential-growth bias: Victor Stango and Jonathan Zinman, "Exponential Growth Bias and Household
// Finance", Journal of Finance 64(6), 2009. People asked to project compound growth guess too low.
export const GROWTH_BIAS = { authors: 'Stango and Zinman', year: 2009 };

/* ------------------------------------------------------------ 4 · inflation */

/** What `amount` still buys after `years` of inflation at `ratePct` a year, in today's money. */
export const buyingPower = (amount, ratePct, years) => amount / (1 + ratePct / 100) ** years;
/** Exact real return (%) from a nominal return (%) and an inflation rate (%). */
export const realReturn = (nominalPct, inflationPct) => ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;

// [S] Inflation targets of three central banks, all 2% a year. Federal Reserve: 2% (personal consumption
// expenditures price index), stated since 2012. European Central Bank: a symmetric 2% over the medium
// term, since its strategy review of July 2021. Bank of England: 2% on the Consumer Prices Index, set by
// the government; the Governor writes an open letter if inflation is more than 1 point away.
export const INFLATION_TARGETS = [
  { bank: 'US Federal Reserve', target: 2 },
  { bank: 'European Central Bank', target: 2 },
  { bank: 'Bank of England', target: 2 },
];

// Hyperinflation as history.
// [S] Germany 1923: when the currency was stabilised on 15 November 1923 a US dollar cost 4.2 trillion
//     paper marks, and 1 new Rentenmark replaced 1 trillion (1,000,000,000,000) paper marks.
//     (PBS Commanding Heights; standard economic histories.) The note in the picture, dated
//     15 September 1923, says "Zehn Milliarden Mark": a German Milliarde is a thousand million, so it is
//     ten billion marks (read off the note itself).
// [K] At the worst, in October 1923, prices doubled about every 3.7 days (Hanke and Krus, "World
//     Hyperinflations", 2012).
// [S] Zimbabwe 2008: Steve Hanke's estimate for mid-November 2008 is a monthly inflation rate of 79.6
//     billion per cent, prices doubling about every 24.7 hours (Hanke and Kwok, Cato Journal 2009; Johns
//     Hopkins Magazine 2009). The 100-trillion-dollar note was issued in January 2009.
// [K] The last official figure, for July 2008, was 231 million per cent a year (Reserve Bank of Zimbabwe).
export const HYPERINFLATION = {
  germany: { year: 1923, marksPerDollar: 4.2e12, oldPerNew: 1e12, doublingDays: 3.7, noteMarks: 1e10 },
  zimbabwe: { year: 2008, doublingHours: 24.7, monthlyPct: 79.6e9, note: 1e14, noteIssued: 2009 },
};

/* ------------------------------------------------------------ 5 · borrowing */

// INVENTED. The example credit card of the lesson. Interest is added monthly at APR / 12.
// The minimum payment is the larger of a fixed floor and a share of the balance, which is how
// many real cards work; the numbers are examples.
export const CARD = { balance: 2000, apr: 18, minPct: 2.5, minFloor: 25 };

/**
 * Pay down a card balance month by month.
 *   pay: 'min' for the minimum each month, or a fixed amount.
 * Each month: interest = balance × APR / 12 is added, then the payment is taken (never more than is owed).
 * Returns { months, interest, paid, cleared }; `cleared` is false when the payment never covers the interest.
 */
export function payDown({ balance, apr, minPct = 2.5, minFloor = 25 }, pay = 'min', cap = 1200) {
  let b = balance;
  let months = 0;
  let interest = 0;
  let paid = 0;
  while (b > 0.005 && months < cap) {
    const i = Math.round(b * apr / 12) / 100;      // rounded to the cent, as a statement would show it
    const due = b + i;
    const want = pay === 'min' ? Math.max(minFloor, Math.round(due * minPct) / 100) : pay;
    const p = Math.min(due, want);
    if (pay !== 'min' && p <= i && due > p) return { months: Infinity, interest: Infinity, paid: Infinity, cleared: false };
    b = Math.round((due - p) * 100) / 100;
    interest += i;
    paid += p;
    months++;
  }
  return { months, interest: Math.round(interest * 100) / 100, paid: Math.round(paid * 100) / 100, cleared: b <= 0.005 };
}

/** The level monthly payment that clears `amount` in `months` at a yearly rate `apr` (%), interest added monthly. */
export function loanPayment(amount, apr, months) {
  const m = apr / 1200;
  if (m === 0) return amount / months;
  return (amount * m) / (1 - (1 + m) ** -months);
}

// [S] Very-high-cost short-term loans.
// US: a typical two-week payday loan with a fee of 15 dollars per 100 borrowed works out at an annual
//     percentage rate of almost 400% (Consumer Financial Protection Bureau, "What is a payday loan?").
// UK: since 2 January 2015 the Financial Conduct Authority caps such loans at 0.8% of the amount
//     borrowed per day, default fees at 15 pounds, and the total cost at 100% of the amount borrowed.
export const PAYDAY = { feePer100: 15, days: 14, aprAbout: 400, ukDailyCapPct: 0.8, ukTotalCapPct: 100, ukCapSince: 2015 };

/* ----------------------------------------------------------- 6 · safety net */

// [S] US Federal Reserve, "Economic Well-Being of U.S. Households in 2025" (survey of October 2025,
// published May 2026): 63% of adults would cover an unexpected 400-dollar expense with cash or its
// equivalent (unchanged since 2022; 68% in 2021); 12% could not pay it by any means.
export const EMERGENCY_SURVEY = { country: 'United States', year: 2025, amount: 400, cashPct: 63, cannotPct: 12 };

// Deposit protection: the limit per person, per bank (ungraded table; limits change, so each has a date).
// [S] UK: 120,000 pounds since 1 December 2025, up from 85,000 (Bank of England / PRA, November 2025).
// [S] US: 250,000 dollars per depositor, per bank, per ownership category (FDIC, 2026).
// [S] Canada: 100,000 Canadian dollars per category (CDIC notices, April 2026). The 2026 federal budget
//     proposed raising it to 250,000; the reviewer found no confirmation in November 2026 that the rise was
//     in force, so the table gives the limit with its date and mentions the proposal.
// [K] EU: 100,000 euros (Deposit Guarantee Schemes Directive 2014/49/EU).
// [K] Australia: 250,000 Australian dollars (Financial Claims Scheme, APRA).
export const DEPOSIT_LIMITS = [
  { where: 'United States', scheme: 'FDIC', limit: '250,000 US dollars', asOf: '2026', mark: 'S' },
  { where: 'United Kingdom', scheme: 'FSCS', limit: '120,000 pounds', asOf: 'since December 2025', mark: 'S' },
  { where: 'European Union', scheme: 'national deposit guarantee schemes', limit: '100,000 euros', asOf: 'since 2010', mark: 'K' },
  { where: 'Canada', scheme: 'CDIC', limit: '100,000 Canadian dollars (a rise to 250,000 was proposed in 2026)', asOf: 'April 2026', mark: 'S' },
  { where: 'Australia', scheme: 'Financial Claims Scheme', limit: '250,000 Australian dollars', asOf: '2026', mark: 'K' },
];
// INVENTED. Verdia's guarantee, for graded sums.
export const VERDIA_DEPOSIT_LIMIT = 100000;

// INVENTED. The insurance pool of the lesson: a thousand households, a small chance of a ruinous loss.
export const POOL = { households: 1000, chancePct: 1, loss: 100000 };

/* ------------------------------------------------------------- 7 · investing */

// [S] Long-run returns after inflation, 1900 to 2024, world index, per year: shares 5.2%, government
// bonds 1.7%, short-term government bills ("cash") 0.5%. Dimson, Marsh and Staunton, UBS Global
// Investment Returns Yearbook 2025 (35 markets). The 2026 edition (1900 to 2025) reports 6.6% for US
// shares and, across countries, an average yearly swing (standard deviation of real returns) of 23.0%
// for shares, 13.1% for bonds and 7.5% for bills.
// `to` is the last year of the returns (2025 edition); `sdTo` the last year of the swings (2026 edition).
export const LONG_RUN = { from: 1900, to: 2024, sdTo: 2025, shares: 5.2, bonds: 1.7, bills: 0.5, sd: { shares: 23.0, bonds: 13.1, bills: 7.5 } };

// [S] Hendrik Bessembinder, "Do stocks outperform Treasury bills?", Journal of Financial Economics 129
// (2018). About 26,000 US shares, 1926 to 2016: 57.4% earned less over their lifetime than one-month
// Treasury bills; the best 1,092 companies (about 4%) account for the whole net gain of the market.
export const BESSEMBINDER = { from: 1926, to: 2016, shares: 26000, worsePct: 57.4, betterPct: 42.6, topFirms: 1092, topPct: 4 };

// [S] How often US shares lost money over different holding periods, 1926 to 2024, with dividends,
// before inflation (rolling periods; Ben Carlson, A Wealth of Common Sense, 2023-25; S&P Dow Jones
// Indices). Approximate: about 27% of 1-year periods, 12% of 5-year, 5% of 10-year, none of 20-year.
// After inflation, and in other countries, the record is worse. [K] Japan's Nikkei 225 index took
// 34 years (December 1989 to February 2024) to regain its peak.
export const LOSING_PERIODS = { country: 'United States', from: 1926, to: 2024, pct: { 1: 27, 5: 12, 10: 5, 20: 0 }, nikkeiYears: 34 };

// [S] The crash of 2007-09: the US S&P 500 index fell about 57% from 9 October 2007 to 9 March 2009
// and was back at its old peak in 2013 (Kiplinger; Fisher Investments; S&P data).
export const CRASH_2008 = { fallPct: 57, peak: 2007, trough: 2009, recovered: 2013 };

// [S] UK Financial Conduct Authority, repeated consumer warning (2021 onwards): people who buy
// crypto-assets "should be prepared to lose all their money".
export const CRYPTO_WARNING = { body: 'UK Financial Conduct Authority', words: 'be prepared to lose all their money' };

/* ------------------------------------------------------------- 8 · long game */

// [K] The first index fund open to the public: First Index Investment Trust, launched by John Bogle
// at Vanguard in 1976.
// [S] SPIVA U.S. Scorecard, year-end 2025 (S&P Dow Jones Indices, March 2026): 79% of actively managed
// US large-company funds did worse than the S&P 500 index in 2025, and 89% over five years. Over twenty
// years the figure is about nine in ten (91% in the mid-2025 scorecard).
export const SPIVA = { market: 'US large-company funds', year: 2025, oneYearPct: 79, fiveYearPct: 89, twentyYearPct: 91 };

// [S] Morningstar, "Mind the Gap" 2025 (US funds, ten years to December 2024): funds returned 8.2%
// a year, the average dollar invested in them earned 7.0%: a gap of 1.2 points, about 15% of the return.
// (The 2026 edition, ten years to December 2025, reports 9.9% against 8.7%: the same gap of 1.2 points.
// The lesson quotes the 2025 edition and names its period.)
export const MIND_THE_GAP = { fundPct: 8.2, investorPct: 7.0, gap: 1.2, year: 2024 };

// [S] J.P. Morgan Asset Management, Guide to Retirement 2024 (S&P 500, twenty years to the end of 2023):
// seven of the ten best days fell within two weeks of the ten worst days.
export const BEST_DAYS = { bestNearWorst: 7, of: 10, year: 2023 };

// [K] William Bengen, "Determining withdrawal rates using historical data", Journal of Financial
// Planning, October 1994: in US history since 1926, taking 4% of the pot in the first year and the same
// amount, raised with inflation, each year after, lasted at least 30 years with about half in shares.
export const BENGEN = { ratePct: 4, year: 1994, years: 30 };

// Tax-favoured accounts for retirement and saving (ungraded table).
// [K] the names (IRS; gov.uk; ATO; Canada Revenue Agency). [S] Australia: employers must pay 12% of
// ordinary earnings into super since 1 July 2025 (ATO). [S] UK: automatic enrolment into a workplace
// pension with at least 8% of qualifying earnings going in, at least 3% of it from the employer.
export const RETIREMENT_ACCOUNTS = [
  { country: 'United States', names: '401(k), IRA' },
  { country: 'United Kingdom', names: 'workplace pension, ISA' },
  { country: 'Australia', names: 'superannuation' },
  { country: 'Canada', names: 'RRSP, TFSA' },
];

/* ------------------------------------------------------ 9 · scams and traps */

// [S] US Federal Trade Commission, Consumer Sentinel Network, data for 2025 (published March 2026):
// people reported losing 15.9 billion dollars to fraud in about 3 million reports (12.5 billion in
// 2024); 7.9 billion of it to investment scams. Most fraud is never reported.
export const FRAUD = { country: 'United States', year: 2025, billions: 15.9, reportsMillions: 3, investmentBillions: 7.9, previous: 12.5 };

// [S] Charles Ponzi, Boston, 1920: promised 50% in 45 days (or 100% in 90 days) from trading postal
// reply coupons; exposed by the Boston Post in July and arrested on 12 August 1920. Estimates of what
// investors lost run from about 7 to 20 million dollars of the time.
// [S] Bernard Madoff: arrested in December 2008; statements showed about 65 billion dollars that did
// not exist; about 17.5 billion dollars of real money had been handed over; sentenced to 150 years in
// June 2009 (US Department of Justice / FBI).
export const PONZI = { year: 1920, promisePct: 50, days: 45 };
export const MADOFF = { year: 2008, paperBillions: 65, principalBillions: 17.5, sentenceYears: 150 };

// [S] Brad Barber and Terrance Odean, "Trading is hazardous to your wealth", Journal of Finance 55
// (2000): 66,465 households at a US discount broker, 1991 to 1996. The fifth that traded most earned
// 11.4% a year after costs; the market returned 17.9%; the average household 16.4%.
export const BARBER_ODEAN = { households: 66465, activePct: 11.4, marketPct: 17.9, averagePct: 16.4 };

// [S] Lotteries return roughly half of what is staked: for the US multi-state game Powerball, half of
// ticket revenue goes into prizes (NPR, January 2023; the UK National Lottery pays out a little over half).
export const LOTTERY = { name: 'Powerball (United States)', prizeSharePct: 50 };

// Help and reporting bodies named in the lessons. Every one was confirmed by web search in November 2026.
export const HELP = {
  debt: [
    { country: 'United Kingdom', name: 'StepChange Debt Charity', contact: '0800 138 1111', mark: 'S' },
    { country: 'United Kingdom', name: 'National Debtline', contact: '0808 808 4000', mark: 'S' },
    { country: 'Australia', name: 'National Debt Helpline', contact: '1800 007 007', mark: 'S' },
    { country: 'United States', name: 'National Foundation for Credit Counseling', contact: 'nfcc.org', mark: 'S' },
  ],
  fraud: [
    { country: 'United States', name: 'Federal Trade Commission', contact: 'ReportFraud.ftc.gov', mark: 'S' },
    { country: 'United Kingdom', name: 'Report Fraud', contact: 'reportfraud.police.uk or 0300 123 2040', note: 'in Scotland: Police Scotland on 101', mark: 'S' },
    { country: 'Australia', name: 'Scamwatch', contact: 'scamwatch.gov.au', mark: 'S' },
    { country: 'Canada', name: 'Canadian Anti-Fraud Centre', contact: '1-888-495-8501', mark: 'S' },
  ],
  gambling: [
    { country: 'United Kingdom', name: 'National Gambling Helpline', contact: '0808 8020 133', mark: 'S' },
    { country: 'United States', name: 'National Problem Gambling Helpline', contact: '1-800-MY-RESET (1-800-697-3738)', mark: 'S' },
  ],
  guidance: [
    { country: 'United Kingdom', name: 'MoneyHelper', contact: 'moneyhelper.org.uk', mark: 'S' },
    { country: 'Australia', name: 'Moneysmart', contact: 'moneysmart.gov.au', mark: 'S' },
    { country: 'Canada', name: 'Financial Consumer Agency of Canada', contact: 'canada.ca', mark: 'S' },
  ],
};
// [S] UK only: dialling 159 connects a caller to their own bank's real fraud line (Stop Scams UK).
export const UK_159 = '159';
/** A help table for lesson text. */
export const helpTable = (rows) => ['| Country | Service | Contact |', '|---|---|---|', ...rows.map((h) => `| ${h.country} | ${h.name} | ${h.contact}${h.note ? ` (${h.note})` : ''} |`)].join('\n');

// INVENTED scenarios for "which kind of scam is this?".
export const SCAM_TYPES = {
  phishing: 'Phishing',
  impersonation: 'Impersonation',
  romance: 'Romance scam',
  investment: 'Investment scam',
  advance: 'Advance-fee scam',
  recovery: 'Recovery scam',
};
export const SCAM_CASES = [
  { type: 'phishing', text: 'An email that looks like it comes from a parcel company says a delivery is waiting and links to a page that asks for card details.', sign: 'a link to a look-alike page that collects card details or passwords' },
  { type: 'phishing', text: 'A text message says an online account has been locked and gives a link to "sign in and confirm your password".', sign: 'a link to a look-alike page that collects card details or passwords' },
  { type: 'impersonation', text: 'A caller who says he is from the bank\'s fraud team asks for the six-digit code that has just arrived by text.', sign: 'someone posing as a bank or an official to get codes, access or a transfer' },
  { type: 'impersonation', text: 'A caller claiming to be from the tax office says there is a warrant for arrest unless a fine is paid today in gift cards.', sign: 'someone posing as a bank or an official to get codes, access or a transfer' },
  { type: 'romance', text: 'After weeks of warm messages, someone met on a dating site who "works on an oil rig" needs money for an emergency flight.', sign: 'trust built over weeks with someone never met in person, then a request for money' },
  { type: 'romance', text: 'An online friend who has never been able to video-call asks for help with hospital bills, promising to repay on arrival.', sign: 'trust built over weeks with someone never met in person, then a request for money' },
  { type: 'investment', text: 'A social-media advert shows screenshots of 3% profit every day on a trading platform, and a "mentor" offers to help open an account.', sign: 'returns far above anything normal, shown on a platform the scammers control' },
  { type: 'investment', text: 'A stranger in a chat group says a new coin is guaranteed to rise tenfold this month and that places are limited.', sign: 'returns far above anything normal, shown on a platform the scammers control' },
  { type: 'advance', text: 'A letter says a prize has been won in a lottery never entered, and a "release fee" must be paid first.', sign: 'a payment demanded up front to release money that never comes' },
  { type: 'advance', text: 'A loan is "approved" by a firm found online, which asks for an insurance fee by bank transfer before it can pay out.', sign: 'a payment demanded up front to release money that never comes' },
  { type: 'recovery', text: 'Months after losing money to a fake trading site, a "fund recovery agent" phones and offers to get it back for a fee.', sign: 'people who have already lost money are approached again with a paid offer to get it back' },
];

// Tricks of our own minds with money (described in the Psychology course's lesson on thinking).
// `means` is the one-line meaning shown on the teaching screen before the matching question; `example` is
// the case the question pairs with the name.
export const MIND_TRAPS = [
  { name: 'Present bias', means: 'what is wanted now outweighs what is wanted for later', example: 'Planning to start saving "next month", every month' },
  { name: 'Loss aversion', means: 'a loss hurts more than a gain of the same size pleases', example: 'Keeping a share that has fallen, to avoid making the loss real' },
  { name: 'Sunk-cost thinking', means: 'money already spent, which cannot be got back, is allowed to decide what is spent next', example: 'Paying for more repairs on an old car because so much has already been spent on it' },
  { name: 'Anchoring', means: 'a number seen first drags every later judgement of a price towards it', example: 'Feeling that 60 dollars is a bargain because the tag says "was 120"' },
  { name: 'Overconfidence', means: 'being surer of one\'s own judgement than the results justify', example: 'Trading often, sure of being able to pick the winners' },
  { name: 'Following the crowd', means: 'taking what many others are doing as proof that it is wise', example: 'Buying something because everyone online seems to be buying it' },
];

/** Join paragraphs (and tables built elsewhere) into one piece of lesson text. */
export const paras = (...parts) => parts.filter(Boolean).join('\n\n');
