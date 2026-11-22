// Independent checks of "Money: Financial Literacy for Real Life".
//
// 1. A second, separately typed table of the course's real-world facts (each with its source) is compared
//    with the tables in content/courses/money/helpers.js, and the arithmetic helpers are re-derived by
//    another route (loops instead of closed formulas, and the other way round).
// 2. Every generated question is re-solved from its own wording: the numbers are parsed out of the text
//    the learner sees and the answer is worked out again here.
// 3. Every interact step is fed the states its controls can reach and must accept exactly those that
//    satisfy the instruction, as worked out here independently of the lesson.
// 4. Care: the standard note, no request for the learner's own finances, tone on the sober steps, no
//    named product recommended, help organisations with country and a verified mark, picture credits.
//
//   node --test tests/money-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { parseNumber } from '../src/core/mathexpr.js';
import course from '../content/courses/money/course.js';
import * as H from '../content/courses/money/helpers.js';
import { taxFor } from '../src/widgets/tax-bands.js';
import { budgetTotals } from '../src/widgets/budget-builder.js';
import { planValue } from '../src/widgets/growth-curve.js';
import { inflate } from '../src/widgets/inflation-clock.js';
import { cardPlan } from '../src/widgets/card-paydown.js';
import { loanFacts } from '../src/widgets/loan-schedule.js';
import { expectedClaim } from '../src/widgets/insurance-pool.js';
import { specificRisk } from '../src/widgets/diversify-sim.js';
import { ponziRun } from '../src/widgets/ponzi-sim.js';

const SEEDS = 200;
const LESSONS = ['pay-and-tax', 'budgeting', 'compound-growth', 'inflation', 'borrowing', 'safety-net', 'investing', 'long-game', 'scams-and-traps'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'pay-and-tax': ['gross-net', 'tax-calc', 'marginal-average', 'raise', 'convert'],
  budgeting: ['shares', 'yearly', 'unit-price'],
  'compound-growth': ['calc', 'rule72', 'effective', 'contrib'],
  inflation: ['basket', 'halving', 'real-return', 'zim-note', 'shrink'],
  borrowing: ['month-interest', 'total-cost', 'payday'],
  'safety-net': ['fund-size', 'deposit', 'expected', 'warranty', 'excess'],
  investing: ['fund-share', 'crash'],
  'long-game': ['fee-calc', 'regular', 'match-calc', 'rebalance', 'four-percent'],
  'scams-and-traps': ['ponzi-photo', 'which-scam', 'mind-traps', 'lottery-ev'],
};
const tested = new Set();

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/money/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'money', id);
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../content/media/money/manifest.json', import.meta.url)), 'utf8'));

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const number = (s) => Number(String(s).replace(/,/g, ''));
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
/** Every amount of money written in a piece of lesson text ("\$1,234.50"), in order. */
const dollars = (text) => [...String(text).matchAll(/\\\$([\d,]+(?:\.\d+)?)/g)].map((m) => number(m[1]));
const grouped = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const figuresOf = (step) => [...(step.figures || []), ...(step.widget ? [step.widget] : []), ...((step.options || []).map((o) => o.figure).filter(Boolean))];

/** Every string a learner can see in a resolved step (drawing markup and internal ids excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'expr', 'mode', 'kind', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'group', 'tone', 'xLabel']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/** Run a generated step with many seeds and hand each concrete step (and the generator's raw output) to `verify`. */
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok(GENERATED[lesson].includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const seed = 7001 + k * 7919;
    const s = resolveStep(step, makeRng(seed), id);
    const made = step.gen(makeRng(seed));
    const text = flat(s.text);
    texts.add(text + (s.pairs ? JSON.stringify(s.pairs) : ''));
    try {
      for (const str of visible(s)) assert.ok(!/undefined|NaN|\[object|Infinity/.test(str), `stray value in: ${str}`);
      if (s.type === 'numeric') {
        const slips = (made.wrong || []).map((w) => Number(w[0]));
        const all = [s.answer, ...slips];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
          assert.ok(Math.abs(all[i] - all[j]) > 2 * (s.tolerance || 0) + 1e-9, `answer and slips must differ: ${all.join(', ')}`);
        }
      }
      if (s.type === 'choice') {
        assert.equal(s.options.filter((o) => o.correct).length, 1, 'exactly one correct option');
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, 'no duplicate options');
      }
      assert.ok(s.explain.length > 20, 'has an explanation');
      verify(s, text, made);
    } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${text}`; throw err; }
  }
  assert.ok(texts.size >= 3, `${lesson}/${id} has at least three variants (${texts.size})`);
  return texts.size;
}
const correctText = (s) => flat(s.options.find((o) => o.correct).text);
/** The explanation quotes this amount of money. */
const quotes = (s, amount) => assert.ok(dollars(s.explain).some((v) => Math.abs(v - amount) < 0.006), `the explanation states ${amount}: ${flat(s.explain)}`);

/* ------------------------------------------------------- 1. double entry */

// Typed in from the sources, independently of helpers.js.
const FACTS = {
  verdia: [[10000, 0], [40000, 20], [80000, 30], [null, 40]],     // invented
  ukTaper: [100000, 125140, 60],                 // HMRC, tax year 2026-27 (personal allowance taper)
  spending: [33.9, 16.5, 13.0, 2025],            // US BLS Consumer Expenditure Surveys 2025 (Oct 2026)
  rule: [50, 30, 20, 2005],                      // Warren & Tyagi, All Your Worth
  targets: 2,                                    // Fed, ECB (2021 review), Bank of England
  germany: { marksPerDollar: 4.2e12, oldPerNew: 1e12, note: 1e10 },   // Nov 1923; the note says Zehn Milliarden
  zimbabwe: { hours: 24.7, note: 1e14, issued: 2009 },                 // Hanke & Kwok 2009
  card: [2000, 18, 2.5, 25],                     // invented
  payday: [15, 14, 400, 0.8, 100, 2015],         // CFPB; FCA price cap of 2 January 2015
  survey: [2025, 400, 63, 12],                   // Federal Reserve SHED 2025 (May 2026)
  deposits: { 'United States': '250,000', 'United Kingdom': '120,000', 'European Union': '100,000', Canada: '100,000', Australia: '250,000' },   // FDIC; PRA Nov 2025; DGSD; CDIC; APRA
  longRun: [1900, 2024, 5.2, 1.7, 0.5],          // Dimson, Marsh, Staunton: UBS Yearbook 2025
  swings: [23.0, 13.1, 7.5],                     // UBS Yearbook 2026
  bessembinder: [1926, 2016, 57.4, 1092],        // Bessembinder, JFE 2018
  losing: [27, 12, 5, 0],                        // US shares 1926-2024, rolling periods (approximate)
  crash: [57, 2007, 2009, 2013],                 // S&P 500, Oct 2007 to Mar 2009
  spiva: [79, 89, 91, 2025],                     // SPIVA U.S. year-end 2025; 20-year figure mid-2025
  gap: [8.2, 7.0, 1.2],                          // Morningstar Mind the Gap 2025
  bestDays: [7, 10],                             // J.P. Morgan Guide to Retirement 2024
  bengen: [4, 1994, 30],                         // Bengen, Journal of Financial Planning 1994
  fraud: [2025, 15.9, 3, 7.9, 12.5],             // FTC Consumer Sentinel 2025 (March 2026)
  ponzi: [1920, 50, 45],                         // Boston, 1920
  madoff: [2008, 65, 17.5, 150],                 // US DoJ / FBI 2009
  barberOdean: [66465, 11.4, 17.9, 16.4],        // Barber & Odean, Journal of Finance 2000
  lottery: 50,                                   // Powerball prize share (NPR 2023)
  help: {
    debt: [['United Kingdom', 'StepChange Debt Charity', '0800 138 1111'], ['United Kingdom', 'National Debtline', '0808 808 4000'], ['Australia', 'National Debt Helpline', '1800 007 007'], ['United States', 'National Foundation for Credit Counseling', 'nfcc.org']],
    fraud: [['United States', 'Federal Trade Commission', 'ReportFraud.ftc.gov'], ['United Kingdom', 'Report Fraud', 'reportfraud.police.uk or 0300 123 2040'], ['Australia', 'Scamwatch', 'scamwatch.gov.au'], ['Canada', 'Canadian Anti-Fraud Centre', '1-888-495-8501']],
    gambling: [['United Kingdom', 'National Gambling Helpline', '0808 8020 133'], ['United States', 'National Problem Gambling Helpline', '1-800-MY-RESET (1-800-697-3738)']],
    guidance: [['United Kingdom', 'MoneyHelper', 'moneyhelper.org.uk'], ['Australia', 'Moneysmart', 'moneysmart.gov.au'], ['Canada', 'Financial Consumer Agency of Canada', 'canada.ca']],
  },
};

/** Income tax by brute force: every 100-dollar slice is taxed at the rate of the band it lies in. */
function sliceTax(income, bands) {
  let tax = 0;
  for (let lo = 0; lo < income; lo += 100) {
    const mid = lo + 50;
    const band = bands.find(([upTo]) => upTo == null || mid < upTo);
    tax += Math.min(100, income - lo) * band[1] / 100;
  }
  return Math.round(tax * 100) / 100;
}
/** The band table printed in a question, read back from the text. */
function bandsIn(text) {
  const rows = [...text.matchAll(/\| (The first|From|Everything above) ([^|]+?) \| (\d+)% \|/g)];
  assert.ok(rows.length >= 3, `band table found in: ${text}`);
  return rows.map((m) => { const amounts = dollars(m[2]); return [m[1] === 'Everything above' ? null : amounts[amounts.length - 1], Number(m[3])]; });
}
/** A card balance paid down month by month, written out separately from the lesson's helper. */
function payCard(balance, apr, pay) {
  let owed = balance; let months = 0; let interest = 0; let paid = 0;
  while (owed > 0.005 && months < 2000) {
    const add = Math.round(owed * apr / 12) / 100;
    const due = owed + add;
    const p = Math.min(due, pay === 'min' ? Math.max(25, Math.round(due * 2.5) / 100) : pay);
    if (p <= add && due > p) return null;
    owed = Math.round((due - p) * 100) / 100; interest += add; paid += p; months++;
  }
  return { months, interest: Math.round(interest * 100) / 100, paid: Math.round(paid * 100) / 100 };
}
/** A level-payment loan checked by running it: the payment that leaves nothing owed after n months. */
function runLoan(amount, apr, months, payment) {
  let owed = amount;
  for (let k = 0; k < months; k++) owed = owed * (1 + apr / 1200) - payment;
  return owed;
}

test('the helper tables agree with an independent table of the key facts', () => {
  assert.deepEqual(H.VERDIA_BANDS.map((b) => [b.upTo, b.rate * 100]), FACTS.verdia);
  assert.deepEqual([H.UK_TAPER.from, H.UK_TAPER.to, H.UK_TAPER.effectivePct], FACTS.ukTaper);
  // the 60% follows from the rule: 40% tax plus 40% on the 50p of allowance lost with each pound
  near(40 + 40 * 0.5, FACTS.ukTaper[2]);
  assert.equal(FACTS.ukTaper[0] + 2 * 12570, FACTS.ukTaper[1]);
  assert.deepEqual([H.SPENDING_SHARES.housing, H.SPENDING_SHARES.transport, H.SPENDING_SHARES.food, H.SPENDING_SHARES.year], FACTS.spending);
  assert.deepEqual([H.FIFTY_THIRTY_TWENTY.needs, H.FIFTY_THIRTY_TWENTY.wants, H.FIFTY_THIRTY_TWENTY.saving, H.FIFTY_THIRTY_TWENTY.year], FACTS.rule);
  assert.equal(H.INFLATION_TARGETS.length, 3);
  for (const t of H.INFLATION_TARGETS) assert.equal(t.target, FACTS.targets);
  const G = H.HYPERINFLATION.germany;
  assert.deepEqual([G.marksPerDollar, G.oldPerNew, G.noteMarks], [FACTS.germany.marksPerDollar, FACTS.germany.oldPerNew, FACTS.germany.note]);
  const Z = H.HYPERINFLATION.zimbabwe;
  assert.deepEqual([Z.doublingHours, Z.note, Z.noteIssued], [FACTS.zimbabwe.hours, FACTS.zimbabwe.note, FACTS.zimbabwe.issued]);
  assert.deepEqual([H.CARD.balance, H.CARD.apr, H.CARD.minPct, H.CARD.minFloor], FACTS.card);
  const P = H.PAYDAY;
  assert.deepEqual([P.feePer100, P.days, P.aprAbout, P.ukDailyCapPct, P.ukTotalCapPct, P.ukCapSince], FACTS.payday);
  near(FACTS.payday[0] * (364 / FACTS.payday[1]), 390, 1e-9, '15 dollars per 100 for 14 days, 26 times a year, is "almost 400%"');
  const E = H.EMERGENCY_SURVEY;
  assert.deepEqual([E.year, E.amount, E.cashPct, E.cannotPct], FACTS.survey);
  assert.deepEqual(Object.fromEntries(H.DEPOSIT_LIMITS.map((d) => [d.where, d.limit.split(' ')[0]])), FACTS.deposits);
  for (const d of H.DEPOSIT_LIMITS) assert.ok(['S', 'K'].includes(d.mark) && d.asOf, `${d.where} is dated and marked`);
  const L = H.LONG_RUN;
  assert.deepEqual([L.from, L.to, L.shares, L.bonds, L.bills], FACTS.longRun);
  assert.deepEqual([L.sd.shares, L.sd.bonds, L.sd.bills], FACTS.swings);
  const B = H.BESSEMBINDER;
  assert.deepEqual([B.from, B.to, B.worsePct, B.topFirms], FACTS.bessembinder);
  near(B.betterPct, 100 - FACTS.bessembinder[2], 1e-9);
  near((B.topFirms / B.shares) * 100, B.topPct, 0.3, 'about 4% of the companies');
  assert.deepEqual([1, 5, 10, 20].map((y) => H.LOSING_PERIODS.pct[y]), FACTS.losing);
  assert.equal(2024 - 1989 - 1, H.LOSING_PERIODS.nikkeiYears, 'December 1989 to February 2024 is 34 years');
  const C = H.CRASH_2008;
  assert.deepEqual([C.fallPct, C.peak, C.trough, C.recovered], FACTS.crash);
  assert.deepEqual([H.SPIVA.oneYearPct, H.SPIVA.fiveYearPct, H.SPIVA.twentyYearPct, H.SPIVA.year], FACTS.spiva);
  assert.deepEqual([H.MIND_THE_GAP.fundPct, H.MIND_THE_GAP.investorPct, H.MIND_THE_GAP.gap], FACTS.gap);
  near(FACTS.gap[0] - FACTS.gap[1], FACTS.gap[2], 1e-9);
  assert.deepEqual([H.BEST_DAYS.bestNearWorst, H.BEST_DAYS.of], FACTS.bestDays);
  assert.deepEqual([H.BENGEN.ratePct, H.BENGEN.year, H.BENGEN.years], FACTS.bengen);
  const F = H.FRAUD;
  assert.deepEqual([F.year, F.billions, F.reportsMillions, F.investmentBillions, F.previous], FACTS.fraud);
  assert.deepEqual([H.PONZI.year, H.PONZI.promisePct, H.PONZI.days], FACTS.ponzi);
  assert.deepEqual([H.MADOFF.year, H.MADOFF.paperBillions, H.MADOFF.principalBillions, H.MADOFF.sentenceYears], FACTS.madoff);
  const O = H.BARBER_ODEAN;
  assert.deepEqual([O.households, O.activePct, O.marketPct, O.averagePct], FACTS.barberOdean);
  assert.equal(H.LOTTERY.prizeSharePct, FACTS.lottery);
  // help and reporting services: the same rows, each with a country and a mark of verification
  assert.deepEqual(Object.keys(H.HELP).sort(), Object.keys(FACTS.help).sort());
  for (const [key, rows] of Object.entries(FACTS.help)) {
    assert.deepEqual(H.HELP[key].map((h) => [h.country, h.name, h.contact]), rows, key);
    for (const h of H.HELP[key]) assert.equal(h.mark, 'S', `${h.name} was verified by search`);
  }
});

test('the arithmetic helpers agree with a second derivation', () => {
  for (let income = 0; income <= 200000; income += 500) {
    near(H.bandTax(income), sliceTax(income, FACTS.verdia), 1e-6, `tax on ${income}`);
    near(taxFor(income, H.VERDIA_BANDS).tax, sliceTax(income, FACTS.verdia), 1e-6, `widget tax on ${income}`);
    // the marginal rate is the tax on one more hundred dollars
    near(H.marginalRate(income) * 100, sliceTax(income + 100, FACTS.verdia) - sliceTax(income, FACTS.verdia), 1e-6, `marginal at ${income}`);
    near(taxFor(income, H.VERDIA_BANDS).marginal, H.marginalRate(income), 1e-12);
  }
  // compound growth by repeated multiplication; simple interest by repeated addition
  for (const [p, r, n] of [[1000, 7, 40], [500, 5, 3], [2000, 10, 2], [1, 5.2, 125]]) {
    let c = p; let s = p;
    for (let y = 0; y < n; y++) { c *= 1 + r / 100; s += p * r / 100; }
    near(H.compound(p, r, n), c, 1e-6 * c);
    near(H.simple(p, r, n), s, 1e-9 * s);
    near(planValue({ start: p, rate: r }, n), c, 1e-6 * c);
    near(planValue({ start: p, rate: r, simple: true }, n), s, 1e-9 * s);
  }
  near(H.compound(1000, 7, 40), 14974.46, 0.01, 'the hook of the compound-growth lesson');
  for (const r of [2, 3, 4, 6, 8, 9, 12]) {
    const y = H.doublingYears(r);
    near(H.compound(1, r, y), 2, 1e-9);
    assert.ok(Math.abs(y - 72 / r) / y < 0.04, `rule of 72 is within 4% at ${r}%`);
  }
  near(H.effectiveRate(12, 12), 12.6825, 0.0001);
  near(H.effectiveRate(10, 2), 10.25, 1e-9);
  // the two savers, by the annuity formula instead of the loop
  for (const r of [5, 6, 6.5, 7]) {
    const f = 1 + r / 100;
    const aiko = 2000 * f * ((f ** 10 - 1) / (f - 1)) * f ** 30;
    const ben = 2000 * f * ((f ** 30 - 1) / (f - 1));
    near(H.savedUp(2000, r, 0, 10, 40), aiko, 1e-6 * aiko);
    near(H.savedUp(2000, r, 10, 40, 40), ben, 1e-6 * ben);
    assert.equal(ben > aiko, r <= 6, `Ben is ahead only at 6% or less (${r}%)`);
  }
  near(H.buyingPower(100, 3, 20), 55.37, 0.005, 'the hook of the inflation lesson');
  near(H.realReturn(5, 2), 2.9412, 0.0001);
  near(inflate(100, 6, 12).power, 49.7, 0.005);
  // the card: the lesson's helper, the widget and this file's own loop agree
  for (const pay of ['min', 40, 90, 100, 150, 300]) {
    const mine = payCard(2000, 18, pay);
    const theirs = H.payDown(H.CARD, pay);
    const widget = cardPlan(H.CARD, pay);
    assert.deepEqual([theirs.months, theirs.interest, theirs.paid], [mine.months, mine.interest, mine.paid], `payDown ${pay}`);
    assert.deepEqual([widget.months, widget.interest, widget.paid], [mine.months, mine.interest, mine.paid], `cardPlan ${pay}`);
  }
  const min = payCard(2000, 18, 'min');
  assert.equal(min.months, 128);
  near(min.paid, 3983.61, 0.005, 'a 2,000-dollar debt costs about 4,000');
  assert.equal(payCard(2000, 18, 30), null, 'a payment equal to the first month\'s interest never clears the debt');
  // loans: the formula's payment leaves nothing owed when the loan is run month by month
  for (const [amount, apr, years] of [[12000, 8, 3], [12000, 8, 7], [200000, 5, 25], [5000, 9, 4]]) {
    const pay = H.loanPayment(amount, apr, years * 12);
    near(runLoan(amount, apr, years * 12, pay), 0, 1e-5 * amount);
    const f = loanFacts(amount, apr, years * 12);
    near(f.payment, pay, 0.005);
    near(f.totalInterest, pay * years * 12 - amount, 0.01);
    near(f.yearly.reduce((t, y) => t + y.principal, 0), amount, 0.05);
    near(f.firstInterest, amount * apr / 1200, 0.005);
  }
  assert.equal(expectedClaim(0.01, 100000), 1000);
  assert.equal(specificRisk(30, 25), 6);
  // what a fee of 1% a year takes over 40 years
  near(1 - (1.05 / 1.06) ** 40, 0.316, 0.001);
});

/* -------------------------------------------------- 2. generated questions */

test('pay-and-tax: generated steps', () => {
  eachVariant('pay-and-tax', 'gross-net', (s, text) => {
    const [gross] = grab(/Gross pay \| \\\$([\d,.]+)/, text).map(number);
    const [tax] = grab(/Income tax \| \\\$([\d,.]+)/, text).map(number);
    const [social] = grab(/Social insurance \| \\\$([\d,.]+)/, text).map(number);
    const [pension] = grab(/Pension contribution \| \\\$([\d,.]+)/, text).map(number);
    assert.equal(s.answer, gross - tax - social - pension);
    assert.ok(s.answer > 0 && Number.isInteger(s.answer * 100));
    near(social, gross * 0.06, 1e-9); near(pension, gross * 0.04, 1e-9);
    quotes(s, s.answer);
  });
  eachVariant('pay-and-tax', 'tax-calc', (s, text) => {
    const bands = bandsIn(text);
    assert.deepEqual(bands, FACTS.verdia);
    const [income] = grab(/earns \*\*\\\$([\d,]+)\*\* a year/, text).map(number);
    assert.equal(s.answer, sliceTax(income, bands));
    quotes(s, s.answer);
    assert.ok(![10000, 40000, 80000].includes(income), 'no income sits exactly on a band line');
  });
  eachVariant('pay-and-tax', 'marginal-average', (s, text) => {
    const bands = bandsIn(text);
    const [income, stated] = grab(/earns \*\*\\\$([\d,]+)\*\* a year and pays \*\*\\\$([\d,]+)\*\*/, text).map(number);
    assert.equal(stated, sliceTax(income, bands));
    assert.ok(![10000, 40000, 80000].includes(income));
    const marginal = sliceTax(income + 100, bands) - sliceTax(income, bands);
    assert.equal(s.blanks.length, 2);
    assert.deepEqual(s.blanks[0].numbers, [marginal]);
    near(s.blanks[1].numbers[0], (stated / income) * 100, 1e-9, 'the average rate is exact, not rounded');
    assert.ok(s.blanks[1].numbers[0] < marginal);
  });
  eachVariant('pay-and-tax', 'raise', (s, text, made) => {
    const bands = bandsIn(text);
    const [from, to] = grab(/rises from \*\*\\\$([\d,]+)\*\* to \*\*\\\$([\d,]+)\*\*/, text).map(number);
    const extraTax = sliceTax(to, bands) - sliceTax(from, bands);
    assert.equal(s.answer, to - from - extraTax);
    assert.ok(s.answer > 0 && s.answer < to - from, 'the rise leaves more, but not all of it');
    assert.ok(sliceTax(from + 100, bands) - sliceTax(from, bands) < sliceTax(to, bands) - sliceTax(to - 100, bands), 'the rise crosses a band line');
    quotes(s, s.answer); quotes(s, extraTax);
    assert.ok(made.wrong.some((w) => Number(w[0]) === extraTax));
  });
  const kinds = new Set();
  eachVariant('pay-and-tax', 'convert', (s, text) => {
    let m;
    if ((m = /\*\*\\\$([\d,]+) an hour\*\* and works \*\*(\d+) hours a week\*\*/.exec(text))) {
      kinds.add('hourly');
      let year = 0;
      for (let week = 0; week < 52; week++) year += number(m[1]) * Number(m[2]);
      assert.equal(s.answer, year);
    } else if ((m = /\*\*\\\$([\d,]+) a year\*\*, paid in twelve/.exec(text))) {
      kinds.add('monthly');
      assert.equal(s.answer * 12, number(m[1]));
      assert.ok(Number.isInteger(s.answer));
    } else {
      kinds.add('yearly');
      [m] = grab(/\*\*\\\$([\d,]+) a month\*\*, before deductions/, text).map(number);
      assert.equal(s.answer, m * 12);
    }
    quotes(s, s.answer);
  });
  assert.equal(kinds.size, 3);
});

test('budgeting: generated steps', () => {
  eachVariant('budgeting', 'shares', (s, text) => {
    const [income] = grab(/takes home \*\*\\\$([\d,]+)\*\* a month/, text).map(number);
    const [needs, wants, saving] = grab(/\\\$([\d,]+) goes on needs, \\\$([\d,]+) on wants, and \\\$([\d,]+) is saved/, text).map(number);
    assert.equal(needs + wants + saving, income, 'the three parts make up the pay');
    assert.ok(wants > 0);
    [needs, wants, saving].forEach((v, i) => near(s.blanks[i].numbers[0], (v / income) * 100, 1e-9, `share ${i}`));
    const share = (needs / income) * 100;
    assert.notEqual(share, 50);
    assert.equal(s.blanks[3].answer, share > 50 ? 'more than' : 'less than');
    assert.equal(s.blanks[3].options.length, 3);
    assert.ok(flat(s.explain).includes(`Needs take ${share > 50 ? 'more than' : 'less than'} the 50%`));
  });
  eachVariant('budgeting', 'yearly', (s, text) => {
    const [amount, per] = grab(/pays \*\*\\\$([\d,.]+) a (week|month)\*\*/, text);
    assert.equal(s.answer, number(amount) * (per === 'week' ? 52 : 12));
    quotes(s, s.answer);
  });
  let smallWins = 0;
  eachVariant('budgeting', 'unit-price', (s, text) => {
    const [g1, p1] = grab(/small pack: \*\*(\d+) g for \\\$([\d.]+)\*\*/, text).map(number);
    const [g2, p2] = grab(/large pack: \*\*(\d+) g for \\\$([\d.]+)\*\*/, text).map(number);
    assert.ok(g1 < g2);
    const u1 = p1 / g1; const u2 = p2 / g2;
    assert.ok(Math.abs(u1 - u2) > 1e-6, 'the two unit prices differ');
    assert.equal(correctText(s), u1 < u2 ? 'The small pack' : 'The large pack');
    if (u1 < u2) smallWins++;
    assert.ok(flat(s.explain).includes(`**${Math.round(u1 * 10000)} cents** per 100 g`) && flat(s.explain).includes(`**${Math.round(u2 * 10000)} cents** per 100 g`));
  });
  assert.ok(smallWins > 40 && smallWins < 160, 'sometimes the small pack is cheaper, sometimes the large one');
});

test('compound-growth: generated steps', () => {
  eachVariant('compound-growth', 'calc', (s, text, made) => {
    const [p] = grab(/puts \*\*\\\$([\d,]+)\*\* into/, text).map(number);
    const [r] = grab(/pays \*\*(\d+)%\*\* a year/, text).map(Number);
    const [n] = grab(/after (\d+) years\?/, text).map(Number);
    let v = p;
    for (let y = 0; y < n; y++) v += v * r / 100;
    near(s.answer, v, 0.0051);
    assert.ok(Math.abs(Math.round(v) - s.answer) <= s.tolerance, 'the nearest dollar is accepted');
    assert.equal(Number(made.wrong[0][0]), p + n * p * r / 100, 'the listed slip is simple interest');
    quotes(s, Math.round(v));
  });
  eachVariant('compound-growth', 'rule72', (s, text) => {
    let m;
    if ((m = /grows at \*\*(\d+)%\*\* a year/.exec(text))) { assert.equal(s.answer * Number(m[1]), 72); assert.equal(s.unit, 'years'); }
    else { [m] = grab(/doubled in \*\*(\d+) years\*\*/, text).map(Number); assert.equal(s.answer * m, 72); assert.equal(s.unit, '%'); }
    assert.ok(Number.isInteger(s.answer));
    // the exact figure quoted in the explanation
    const rate = s.unit === '%' ? s.answer : 72 / s.answer;
    const exact = Math.log(2) / Math.log(1 + rate / 100);
    assert.ok(flat(s.explain).includes(`${Math.round(exact * 10) / 10} years`), `exact doubling time ${exact} is quoted`);
  });
  eachVariant('compound-growth', 'effective', (s, text) => {
    const [nominal] = grab(/advertised at \*\*(\d+)% a year\*\*/, text).map(Number);
    const [per, , times] = grab(/: ([\d.]+)% each ([a-z-]+), (\d+) times a year/, text);
    near(Number(per) * Number(times), nominal, 1e-9, 'the period rate times the number of periods is the nominal rate');
    let v = 100;
    for (let k = 0; k < Number(times); k++) v *= 1 + Number(per) / 100;
    near(s.answer, v - 100, 0.005);
    assert.ok(s.answer > nominal);
    assert.ok(flat(s.explain).includes(`**${s.answer.toFixed(2)}%**`));
  });
  eachVariant('compound-growth', 'contrib', (s, text) => {
    const [pay] = grab(/pays \*\*\\\$([\d,]+)\*\* into an account at the start of each year/, text).map(number);
    const [r] = grab(/pays \*\*(\d+)%\*\* a year/, text).map(Number);
    let v = 0;
    for (let y = 0; y < 2; y++) { v += pay; v *= 1 + r / 100; }
    near(s.answer, v, 0.005);
    quotes(s, v);
  });
});

test('inflation: generated steps', () => {
  eachVariant('inflation', 'basket', (s, text) => {
    const [before, after] = grab(/cost \*\*\\\$([\d,.]+)\*\*\. This year it costs \*\*\\\$([\d,.]+)\*\*/, text).map(number);
    near(s.answer, ((after - before) / before) * 100, 1e-9);
    assert.ok(Number.isInteger(s.answer));
  });
  eachVariant('inflation', 'halving', (s, text) => {
    const [rate] = grab(/rise by \*\*(\d+)%\*\* a year/, text).map(Number);
    assert.equal(s.answer * rate, 72);
    // the rule's answer is within a year of the truth
    let years = 0; let power = 1;
    while (power > 0.5) { power /= 1 + rate / 100; years++; }
    assert.ok(Math.abs(years - s.answer) <= 1, `buying power really halves after about ${s.answer} years (${years})`);
  });
  let negative = 0;
  eachVariant('inflation', 'real-return', (s, text) => {
    const [nominal] = grab(/(?:went up by|paid) \*\*(\d+)%\*\*/, text).map(Number);
    const [inflation] = grab(/prices rose by \*\*(\d+)%\*\*/, text).map(Number);
    near(s.answer, ((100 + nominal) / (100 + inflation) - 1) * 100, 0.005);
    assert.ok(text.includes(`${nominal} − ${inflation} = ${nominal - inflation}%`), 'the quick estimate is stated correctly');
    assert.equal(s.answer < 0, nominal < inflation);
    if (s.answer < 0) { negative++; assert.ok(/went \*\*down\*\*/.test(flat(s.explain))); } else assert.ok(/went up, but by less/.test(flat(s.explain)));
    assert.ok(Math.abs(s.answer) < Math.abs(nominal - inflation), 'the exact real change is smaller in size than the estimate');
  });
  assert.ok(negative > 20, 'some variants have a falling real value');
  eachVariant('inflation', 'zim-note', (s, text) => {
    const [start] = grab(/costs \*\*(\d+) million\*\* dollars today/, text).map(Number);
    const [days] = grab(/after (\d+) days, in millions/, text).map(Number);
    let price = start;
    for (let d = 0; d < days; d++) price += price;
    assert.equal(s.answer, price);
    assert.ok(flat(s.explain).includes(`$ = ${grouped(price)} million`), 'the result is written outside the formula, where its thousands separator is set as text');
    assert.equal(s.figures[0].type, 'photo');
  });
  eachVariant('inflation', 'shrink', (s, text, made) => {
    const [before, after] = grab(/weigh \*\*(\d+) g\*\*\. It now weighs \*\*(\d+) g\*\*/, text).map(Number);
    near(s.answer, (before / after - 1) * 100, 1e-9);
    assert.ok(Number.isInteger(s.answer));
    near(Number(made.wrong[0][0]), ((before - after) / before) * 100, 0.05, 'the listed slip is the fall in weight');
  });
});

test('borrowing: generated steps', () => {
  eachVariant('borrowing', 'month-interest', (s, text) => {
    const [apr] = grab(/APR of \*\*(\d+)%\*\*/, text).map(Number);
    const [owed] = grab(/owes \*\*\\\$([\d,]+)\*\*/, text).map(number);
    near(s.answer, (owed * apr) / 100 / 12, 1e-9);
    assert.ok(Number.isInteger(Math.round(s.answer * 100)) && Math.abs(s.answer * 100 - Math.round(s.answer * 100)) < 1e-9, 'a whole number of cents');
    quotes(s, s.answer);
  });
  eachVariant('borrowing', 'total-cost', (s, text) => {
    const [amount] = grab(/borrows \*\*\\\$([\d,]+)\*\*/, text).map(number);
    const [months, payment] = grab(/\*\*(\d+) monthly payments of \\\$([\d,]+)\*\*/, text).map(number);
    assert.equal(s.answer, months * payment - amount);
    assert.ok(s.answer > 0, 'the loan costs something');
    // the implied rate is a plausible one: between 4% and 15% a year
    assert.ok(runLoan(amount, 4, months, payment) < 0 && runLoan(amount, 15, months, payment) > 0, 'an ordinary interest rate');
    quotes(s, s.answer);
  });
  eachVariant('borrowing', 'payday', (s, text) => {
    const [fee] = grab(/fee of \*\*\\\$(\d+) for every \\\$100 borrowed\*\*/, text).map(Number);
    assert.ok(/\*\*two weeks\*\*/.test(text));
    assert.equal(s.answer, (fee / 100) * 100 * (52 / 2));
    assert.ok(flat(s.explain).includes(`almost ${FACTS.payday[2]}%`));
  });
});

test('safety-net: generated steps', () => {
  eachVariant('safety-net', 'fund-size', (s, text) => {
    const [monthly] = grab(/essential spending is \*\*\\\$([\d,]+) a month\*\*/, text).map(number);
    assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [3 * monthly, 6 * monthly]);
  });
  let covered = 0;
  eachVariant('safety-net', 'deposit', (s, text) => {
    const [limit] = grab(/limit is \*\*\\\$([\d,]+) per person, per bank\*\*/, text).map(number);
    const [balance] = grab(/has \*\*\\\$([\d,]+)\*\* in one Verdian bank/, text).map(number);
    assert.equal(s.answer, Math.max(0, balance - limit));
    if (s.answer === 0) covered++;
    for (const [where, amount] of Object.entries(FACTS.deposits)) assert.ok(s.explain.includes(`| ${where} | ${amount} `), `the comparison table lists ${where}`);
  });
  assert.ok(covered > 10, 'some balances are fully covered');
  eachVariant('safety-net', 'expected', (s, text) => {
    const [oneIn] = grab(/\*\*1 in ([\d,]+)\*\*/, text).map(number);
    const [loss] = grab(/cost of \*\*\\\$([\d,]+)\*\*/, text).map(number);
    assert.equal(s.answer * oneIn, loss);
    quotes(s, s.answer);
  });
  eachVariant('safety-net', 'warranty', (s, text) => {
    const [price] = grab(/for \*\*\\\$([\d,]+)\*\*\. At the till/, text).map(number);
    const [cost] = grab(/is offered for \*\*\\\$([\d,]+)\*\*/, text).map(number);
    const [chance] = grab(/chance of that is \*\*(\d+)%\*\*/, text).map(Number);
    assert.equal(s.answer, (price * chance) / 100);
    assert.ok(cost >= 3 * s.answer, 'the warranty costs several times its expected payout');
    quotes(s, s.answer);
  });
  let nothing = 0;
  eachVariant('safety-net', 'excess', (s, text) => {
    const [excess] = grab(/excess of \\\$([\d,]+)\*\*/, text).map(number);
    const [loss] = grab(/loss comes to \*\*\\\$([\d,]+)\*\*/, text).map(number);
    assert.equal(s.answer, Math.max(0, loss - excess));
    if (s.answer === 0) { nothing++; assert.ok(/\*\*Nothing\*\*/.test(s.explain)); } else quotes(s, s.answer);
  });
  assert.ok(nothing > 5, 'sometimes the loss is below the excess');
});

test('investing: generated steps', () => {
  eachVariant('investing', 'fund-share', (s, text) => {
    const [n] = grab(/shares in \*\*([\d,]+) companies\*\*/, text).map(number);
    near(s.answer * n, 100, 1e-9);
  });
  eachVariant('investing', 'crash', (s, text) => {
    const [fall] = grab(/falls by \*\*(\d+)%\*\*/, text).map(Number);
    const after = 100 - fall;
    near(after * (1 + s.answer / 100), 100, 0.05, 'the rise brings the index back to 100');
    assert.ok(s.answer > fall);
    assert.ok(flat(s.explain).includes(`about ${FACTS.crash[0]}%`) && flat(s.explain).includes(`about ${Math.round((57 / 43) * 100)}%`));
  });
});

test('long-game: generated steps', () => {
  eachVariant('long-game', 'fee-calc', (s, text) => {
    const [pot] = grab(/has \*\*\\\$([\d,]+)\*\* in an investment fund/, text).map(number);
    const [fee] = grab(/fee of \*\*([\d.]+)% a year\*\*/, text).map(Number);
    near(s.answer, pot / 100 * fee, 1e-9);
    quotes(s, s.answer);
  });
  eachVariant('long-game', 'regular', (s, text) => {
    const [each] = grab(/puts \*\*\\\$(\d+) a month\*\*/, text).map(Number);
    const prices = grab(/is \\\$(\d+), then \\\$(\d+), then \\\$(\d+)\./, text).map(Number);
    const units = prices.reduce((t, p) => t + each / p, 0);
    near(s.answer, (each * prices.length) / units, 0.005);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    assert.ok(s.answer < mean, 'the average price paid is below the average of the prices');
  });
  let capped = 0;
  eachVariant('long-game', 'match-calc', (s, text) => {
    const [salary] = grab(/earns \*\*\\\$([\d,]+)\*\* a year/, text).map(number);
    const [cap] = grab(/up to \*\*(\d+)%\*\* of salary/, text).map(Number);
    const [own] = grab(/pays in \*\*(\d+)%\*\* of salary/, text).map(Number);
    const employer = Math.min(own, cap);
    if (own > cap) capped++;
    near(s.answer, (salary / 100) * own + (salary / 100) * employer, 1e-9);
    quotes(s, s.answer);
    for (const a of ['401(k), IRA', 'workplace pension, ISA', 'superannuation', 'RRSP, TFSA']) assert.ok(s.explain.includes(a));
  });
  assert.ok(capped > 20, 'in some variants the match is capped');
  eachVariant('long-game', 'rebalance', (s, text) => {
    const [total] = grab(/pot of \*\*\\\$([\d,]+)\*\*/, text).map(number);
    const [now] = grab(/is \*\*(\d+)% shares\*\*/, text).map(Number);
    const shares = (total * now) / 100;
    near((shares - s.answer) / total, 0.6, 1e-9, 'after the move, shares are 60% of the pot');
    assert.ok(s.answer > 0);
  });
  const kinds = new Set();
  eachVariant('long-game', 'four-percent', (s, text) => {
    let m;
    if ((m = /retires with a pot of \*\*\\\$([\d,]+)\*\*/.exec(text))) { kinds.add('income'); near(s.answer / number(m[1]), 0.04, 1e-12); }
    else { kinds.add('pot'); [m] = grab(/provide \*\*\\\$([\d,]+)\*\* in the first year/, text).map(number); near(m / s.answer, 0.04, 1e-12); }
    assert.ok(text.includes(`from ${FACTS.bengen[1]}`));
  });
  assert.equal(kinds.size, 2);
});

// Typed here from the scenarios, independently of the helper table: a telling phrase and the kind of scam.
const SCAM_KEY = [
  ['parcel company', 'Phishing'], ['sign in and confirm your password', 'Phishing'],
  ['six-digit code', 'Impersonation'], ['tax office', 'Impersonation'],
  ['oil rig', 'Romance scam'], ['video-call', 'Romance scam'],
  ['3% profit every day', 'Investment scam'], ['new coin', 'Investment scam'],
  ['release fee', 'Advance-fee scam'], ['insurance fee', 'Advance-fee scam'],
  ['fund recovery agent', 'Recovery scam'],
];
const TRAP_KEY = { 'Present bias': 'next month', 'Loss aversion': 'has fallen', 'Sunk-cost thinking': 'already been spent', Anchoring: 'was 120', Overconfidence: 'pick the winners', 'Following the crowd': 'everyone online' };

test('scams-and-traps: generated steps', () => {
  eachVariant('scams-and-traps', 'ponzi-photo', (s, text) => {
    const [start, days, periods] = grab(/What would \\\$([\d,]+) be worth after (\d+) days: (\d+) periods of 45 days/, text).map(number);
    assert.equal(days, periods * 45);
    let v = start;
    for (let k = 0; k < periods; k++) v += v / 2;
    near(s.answer, v, 0.005);
    assert.equal(s.figures[0].type, 'photo');
    assert.equal(s.tone, 'sober');
  });
  const seen = new Set();
  eachVariant('scams-and-traps', 'which-scam', (s, text) => {
    const hit = SCAM_KEY.filter(([phrase]) => text.includes(phrase));
    assert.equal(hit.length, 1, 'the scenario is one of the test\'s own table');
    seen.add(hit[0][0]);
    assert.equal(correctText(s), hit[0][1]);
    assert.equal(s.options.length, 4);
    const offered = s.options.map((o) => flat(o.text));
    // kinds that could both be defended for one story are never offered together
    const rivals = { Phishing: ['Impersonation'], Impersonation: ['Phishing'], 'Recovery scam': ['Advance-fee scam', 'Impersonation'], 'Advance-fee scam': ['Recovery scam'] }[hit[0][1]] || [];
    for (const rival of rivals) assert.ok(!offered.includes(rival), `${rival} is not offered beside ${hit[0][1]}`);
    assert.ok(flat(s.explain).startsWith(`**${hit[0][1]}**`));
  });
  assert.equal(seen.size, SCAM_KEY.length, 'every scenario turns up');
  assert.equal(H.SCAM_CASES.length, SCAM_KEY.length);
  eachVariant('scams-and-traps', 'mind-traps', (s) => {
    assert.equal(s.pairs.length, 4);
    for (const [name, example] of s.pairs) {
      assert.ok(TRAP_KEY[name], `${name} is in the test's own table`);
      assert.ok(example.includes(TRAP_KEY[name]), `${name} is paired with its own example: ${example}`);
    }
    assert.equal(new Set(s.pairs.map((p) => p[0])).size, 4);
  });
  eachVariant('scams-and-traps', 'lottery-ev', (s, text) => {
    const [share] = grab(/pays out \*\*(\d+)%\*\*/, text).map(Number);
    const [ticket] = grab(/ticket costs \*\*\\\$(\d+)\*\*/, text).map(Number);
    let back = 0;
    for (let cent = 0; cent < ticket * 100; cent++) back += share / 100;      // each cent staked returns `share` hundredths of a cent
    near(s.answer, ticket - back / 100, 1e-6);
    assert.ok(s.answer > 0 && s.answer < ticket);
    assert.equal(s.tone, 'sober');
    for (const [country, name, contact] of FACTS.help.gambling) assert.ok(s.explain.includes(`| ${country} | ${name} | ${contact} |`));
  });
});

/* ------------------------------------------------------ 3. interact steps */

const accepts = (lesson, id, state) => raw(lesson, id).check(state) === true;
/** `check` accepts exactly the states for which `rule` holds; every refusal that carries a message is a string. */
function exactly(lesson, id, states, rule) {
  let yes = 0;
  for (const state of states) {
    const res = raw(lesson, id).check(state);
    const want = !!rule(state);
    assert.equal(res === true, want, `${lesson}/${id} ${want ? 'should accept' : 'should refuse'} ${JSON.stringify(state).slice(0, 200)}`);
    if (res !== true) assert.ok(res === false || typeof res === 'string');
    if (typeof res === 'string') assert.ok(!/undefined|NaN/.test(res), res);
    if (want) yes++;
  }
  assert.ok(yes > 0, `${lesson}/${id}: at least one reachable state is accepted`);
  return yes;
}
const steps = (lo, hi, step) => { const out = []; for (let i = 0; lo + i * step <= hi + 1e-9; i++) out.push(Math.round((lo + i * step) * 1000) / 1000); return out; };

test('pay-and-tax: interact steps', () => {
  const slip = raw('pay-and-tax', 'payslip-read').widget;
  assert.equal(exactly('pay-and-tax', 'payslip-read', [...slip.lines.map((l) => ({ picked: l.id })), { picked: null }], (s) => s.picked === 'net'), 1);
  // the slip adds up, and its tax line is a twelfth of the yearly tax on 39,000
  const amount = Object.fromEntries(slip.lines.map((l) => [l.id, l.amount]));
  near(amount.gross + amount.tax + amount.social + amount.pension, amount.net, 0.005);
  near(-amount.tax * 12, sliceTax(39000, FACTS.verdia), 0.05);
  near(amount.gross * 12, 39000, 1e-9);

  const bandState = (income, benefit) => {
    const t = taxFor(income, H.VERDIA_BANDS);
    const got = benefit && income <= benefit.until ? benefit.amount : 0;
    return { income, tax: t.tax, net: income - t.tax, marginal: t.marginal * 100, average: income ? Math.round((t.tax / income) * 10000) / 100 : 0, perBand: t.perBand, benefit: got, pocket: income - t.tax + got };
  };
  exactly('pay-and-tax', 'bands-explore', steps(0, 120000, 1000).map((i) => bandState(i)), (s) => s.income >= 42000);
  // the cliff: the only income above the threshold that leaves exactly what 30,000 left
  const benefit = raw('pay-and-tax', 'cliff').widget.benefit;
  assert.deepEqual([benefit.amount, benefit.until], [2400, 30000]);
  const pocket = (income) => income - sliceTax(income, FACTS.verdia) + (income <= 30000 ? 2400 : 0);
  const n = exactly('pay-and-tax', 'cliff', steps(0, 60000, 500).map((i) => bandState(i, benefit)), (s) => s.income > 30000 && Math.abs(pocket(s.income) - pocket(30000)) < 1e-9);
  assert.equal(n, 1);
  assert.equal(raw('pay-and-tax', 'cliff').solution.income, 33000);
  for (let i = 30500; i < 33000; i += 500) assert.ok(pocket(i) < pocket(30000), `worse off at ${i}`);
  // the hook: 39,000 to 42,000 leaves more
  assert.equal(42000 - sliceTax(42000, FACTS.verdia) - (39000 - sliceTax(39000, FACTS.verdia)), 2200);
});

test('budgeting: interact steps', () => {
  const grid = (step) => {
    const items = raw('budgeting', step).widget.items;
    let states = [{}];
    for (const it of items) {
      const values = it.fixed ? [it.amount] : steps(it.min, it.max, it.step);
      states = states.flatMap((s) => values.map((v) => ({ ...s, [it.id]: v })));
    }
    const income = raw('budgeting', step).widget.income;
    return states.map((amounts) => ({ amounts, ...budgetTotals(income, items.map((it) => ({ group: it.group, amount: amounts[it.id] }))) }));
  };
  const total = (s) => Object.values(s.amounts).reduce((a, b) => a + b, 0);
  exactly('budgeting', 'build-tomas', grid('build-tomas'), (s) => total(s) === 3000 && s.amounts.saving >= 600);
  exactly('budgeting', 'build-mira', grid('build-mira'), (s) => total(s) === 2000 && s.amounts.saving > 0);
  // Mira's needs cannot be brought to 50%: the smallest possible share is 75%
  assert.equal(Math.min(...grid('build-mira').map((s) => s.shares.needs)), 75);
  exactly('budgeting', 'sinking', grid('sinking'), (s) => total(s) === 3000 && s.amounts.aside * 12 === 540 + 180);
  for (const id of ['build-tomas', 'build-mira', 'sinking']) {
    const st = raw('budgeting', id);
    const sol = grid(id).find((s) => Object.entries(st.solution.amounts).every(([k, v]) => s.amounts[k] === v));
    assert.ok(sol && st.check(sol) === true, `${id}: the solution is a reachable state and passes`);
  }
  // the yearly bills are named in the text
  assert.deepEqual(dollars(raw('budgeting', 'sinking').text), [540, 180]);
});

test('compound-growth and long-game: growth-curve steps', () => {
  const stateOf = (widget, set) => {
    const params = {};
    for (const [k, m] of Object.entries(widget.params || {})) params[k] = set[k] != null ? set[k] : m.value;
    const years = set.years != null ? set.years : widget.years;
    const val = (x, t) => planValue({ start: typeof x.start === 'string' ? params[x.start] : x.start || 0, rate: typeof x.rate === 'string' ? params[x.rate] : x.rate || 0, fee: typeof x.fee === 'string' ? params[x.fee] : x.fee || 0, pay: x.pay || 0, from: x.from || 0, to: x.to == null ? Infinity : x.to, simple: !!x.simple, inflation: typeof x.deflate === 'string' ? params[x.deflate] : x.deflate || 0 }, t);
    const values = {}; const doubled = {};
    for (const x of widget.series) {
      values[x.id] = Math.round(val(x, years) * 100) / 100;
      doubled[x.id] = null;
      if (x.start > 0) for (let t = 1; t <= years; t++) if (val(x, t) >= 2 * x.start - 1e-9) { doubled[x.id] = t; break; }
    }
    const gap = widget.gap ? values[widget.gap[0]] - values[widget.gap[1]] : 0;
    const kept = widget.gap ? Math.round((values[widget.gap[1]] / values[widget.gap[0]]) * 1000) / 10 : 0;
    return { years, ...params, values, gap, kept, doubled };
  };
  const w = (lesson, id) => raw(lesson, id).widget;
  exactly('compound-growth', 'explore', steps(1, 40, 1).map((y) => stateOf(w('compound-growth', 'explore'), { years: y })), (s) => s.years === 40);
  // doubling in 12 years: the lowest rate on the slider that does it, found here by repeated multiplication
  const rates = steps(1, 12, 0.5);
  const doubles = (r) => { let v = 1000; for (let y = 0; y < 12; y++) v *= 1 + r / 100; return v >= 2000; };
  const lowest = rates.find(doubles);
  assert.equal(lowest, 6);
  assert.equal(exactly('compound-growth', 'double', rates.map((r) => stateOf(w('compound-growth', 'double'), { rate: r })), (s) => s.rate === lowest), 1);
  // the two savers
  const ahead = (r) => {
    let aiko = 0; let ben = 0;
    for (let y = 0; y < 40; y++) { if (y < 10) aiko += 2000; else ben += 2000; aiko *= 1 + r / 100; ben *= 1 + r / 100; }
    return ben > aiko;
  };
  const n = exactly('compound-growth', 'savers', steps(2, 9, 0.5).map((r) => stateOf(w('compound-growth', 'savers'), { rate: r })), (s) => ahead(s.rate));
  assert.equal(n, steps(2, 6, 0.5).length, 'Ben is ahead at every rate up to 6%');
  assert.ok(!accepts('compound-growth', 'savers', stateOf(w('compound-growth', 'savers'), { rate: 7 })));
  // inflation: the rate at which a 2% account only just keeps its buying power
  exactly('inflation', 'real-explore', steps(0, 6, 0.5).map((i) => stateOf(w('inflation', 'real-explore'), { inflation: i })), (s) => Math.abs(s.values.real - 1000) < 0.005);
  // long game
  exactly('long-game', 'fee-explore', steps(0, 2, 0.1).flatMap((f) => [5, 20, 40].map((y) => stateOf(w('long-game', 'fee-explore'), { fee: f, years: y }))), (s) => s.fee === 1);
  const keeps = (fee) => ((1.06 - fee / 100) / 1.06) ** 30;
  const best = Math.max(...steps(0, 2, 0.1).filter((f) => keeps(f) >= 0.9));
  assert.equal(best, 0.3);
  assert.equal(exactly('long-game', 'fee-target', steps(0, 2, 0.1).map((f) => stateOf(w('long-game', 'fee-target'), { fee: f })), (s) => s.fee === best), 1);
  exactly('long-game', 'time', steps(2, 8, 0.5).map((r) => stateOf(w('long-game', 'time'), { rate: r })), (s) => s.rate !== 5);
  exactly('investing', 'history', [1, 50, 124, 125].map((y) => stateOf(w('investing', 'history'), { years: y })), (s) => s.years === 125);
  // numbers the texts quote
  const hook = raw('long-game', 'hook');
  assert.equal(hook.answer, Math.round((1 - (1.05 / 1.06) ** 40) * 100));
  assert.equal(raw('inflation', 'hook').answer, Math.round(100 / 1.03 ** 20));
  near(raw('compound-growth', 'hook').answer, 1000 * 1.07 ** 40, raw('compound-growth', 'hook').tolerance);
});

test('inflation: clock steps', () => {
  const st = (rate, years) => { const f = inflate(100, rate, years); return { rate, years, power: f.power, price: f.price, halved: f.power <= 50, ran: true }; };
  exactly('inflation', 'clock', steps(0, 40, 1).map((y) => st(3, y)), (s) => s.years >= 20);
  let first = 0;
  while (100 / 1.06 ** first > 50) first++;
  assert.equal(first, 12);
  const all = steps(0, 10, 0.5).flatMap((r) => steps(0, 40, 1).map((y) => st(r, y)));
  assert.equal(exactly('inflation', 'halve', all, (s) => s.rate === 6 && s.years === first), 1);
  // the German note: how many ten-billion-mark notes make a million million marks
  assert.equal(raw('inflation', 'german-note').answer, FACTS.germany.oldPerNew / FACTS.germany.note);
});

test('borrowing and safety-net: card, loan and pool steps', () => {
  const cardState = (mode, payment) => {
    const p = mode === 'min' ? payCard(2000, 18, 'min') : payCard(2000, 18, payment);
    const min = payCard(2000, 18, 'min');
    return { mode, payment, months: p ? p.months : null, interest: p ? p.interest : 0, paid: p ? p.paid : 0, cleared: !!p, min };
  };
  const pays = steps(30, 400, 10);
  exactly('borrowing', 'card-explore', [...pays.map((p) => cardState('fixed', p)), ...pays.map((p) => cardState('min', p))], (s) => s.mode === 'fixed' && s.cleared);
  const smallest = pays.find((p) => { const r = payCard(2000, 18, p); return r && r.months <= 24; });
  assert.equal(smallest, 100);
  assert.equal(exactly('borrowing', 'card-target', pays.map((p) => cardState('fixed', p)), (s) => s.payment === smallest), 1);
  // the loan: the shortest term with a payment of 200 or less, found by running the loan
  const fits = (years) => runLoan(12000, 8, years * 12, 200) <= 0;      // paying 200 a month clears it in time
  const shortest = steps(1, 10, 1).find(fits);
  assert.equal(shortest, 7);
  assert.equal(exactly('borrowing', 'amort-explore', steps(1, 10, 1).map((y) => ({ years: y, apr: 8, ...loanFacts(12000, 8, y * 12) })), (s) => s.years === shortest), 1);
  // the hook and the texts
  near(raw('borrowing', 'hook').answer, payCard(2000, 18, 'min').paid, raw('borrowing', 'hook').tolerance);
  const home = loanFacts(200000, 5, 300);
  assert.ok(home.firstInterest > home.firstPrincipal && home.yearly[0].interest > home.yearly[0].principal && home.yearly[24].interest < home.yearly[24].principal, 'early payments are mostly interest, late ones mostly repayment');
  assert.ok(raw('borrowing', 'amort-first').options.find((o) => o.correct).text.startsWith('On interest'));
  // the small shock of the safety-net lesson, and its correct option
  const repair = cardPlan({ balance: 600, apr: 24, minPct: 2.5, minFloor: 25 }, 25);
  near(repair.paid, 825.54, 0.005);
  assert.ok(raw('safety-net', 'shock').options.find((o) => o.correct).text.includes('825'));

  const poolState = (premium, years) => ({ premium, excess: 0, years, hits: 10, totalHits: 10 * years, avgHits: years ? 10 : 0, paidIn: premium * 1000 * years, paidOut: 1e6 * years, balance: (premium * 1000 - 1e6) * years, expected: 0.01 * 100000, margin: premium - 0.01 * 100000 });
  exactly('safety-net', 'pool-explore', steps(0, 12, 1).map((y) => poolState(1200, y)), (s) => s.years >= 5);
  // break-even: premiums from a thousand households equal the claims of an average year (ten fires)
  assert.equal(exactly('safety-net', 'premium-find', steps(500, 2000, 50).flatMap((p) => [0, 3].map((y) => poolState(p, y))), (s) => s.premium * 1000 === 10 * 100000), 2);
  assert.equal(raw('safety-net', 'hook').answer, FACTS.survey[2]);
});

test('investing and scams: simulator steps', () => {
  const div = (n, years, seen) => ({ n, years, market: years ? 4.2 : null, best: years ? 20 : null, worst: years ? -10 : null, spread: years ? 5 : null, specific: Math.round((30 / Math.sqrt(n)) * 100) / 100, marketSd: 15, seen });
  const subsets = [[], [1], [4], [25], [100], [1, 4], [1, 25], [1, 100], [4, 25], [1, 4, 25, 100]];
  exactly('investing', 'div-explore', subsets.flatMap((seen) => [1, 25].map((n) => div(n, 2, seen))), (s) => s.seen.includes(1) && s.seen.some((n) => n >= 25));
  const enough = [1, 4, 25, 100].find((n) => 30 / Math.sqrt(n) <= 6);
  assert.equal(enough, 25);
  exactly('investing', 'div-target', [1, 4, 25, 100].flatMap((n) => [0, 1, 4].map((y) => div(n, y, y ? [n] : []))), (s) => s.n === enough && s.years >= 1);
  assert.equal(raw('investing', 'hook').answer, Math.round(100 - FACTS.bessembinder[2]));

  // the Ponzi scheme, replayed here with its own bookkeeping
  const replay = (promise) => {
    const cohorts = [10]; let investors = 10; let pot = 9000; let round = 0;
    for (;;) {
      round++;
      const earlier = investors;
      const joined = Math.min(5000 - investors, investors);
      investors += joined; cohorts.push(joined); pot += joined * 900;
      const owed = earlier * 10 * promise;
      if (pot < owed) {
        const losers = cohorts.reduce((t, c, j) => t + (Math.max(0, round - 1 - j) * promise < 100 ? c : 0), 0);
        return { round, losers, investors };
      }
      pot -= owed;
    }
  };
  for (const p of [10, 20, 30, 40, 50]) {
    const mine = replay(p);
    const run = ponziRun({ promise: p, deposit: 1000, first: 10, town: 5000, skim: 10 });
    const end = run[run.length - 1];
    assert.deepEqual([end.round, end.losers, end.investors, end.collapsed], [mine.round, mine.losers, mine.investors, true], `promise ${p}`);
    assert.ok(end.losersPct >= 50, 'most investors lose');
  }
  const fast = replay(50); const slow = replay(10);
  assert.deepEqual([fast.round, slow.round], [10, 17]);
  const ex = flat(raw('scams-and-traps', 'ponzi-explore').explain);
  assert.ok(ex.includes(`In round ${fast.round} `) && ex.includes(`${grouped(fast.losers)} of the ${grouped(fast.investors)} investors, ${Math.round((fast.losers / fast.investors) * 100)}%`));
  const ex2 = flat(raw('scams-and-traps', 'ponzi-target').explain);
  assert.ok(ex2.includes(`${slow.round} rounds instead of ${fast.round}`) && ex2.includes(`${Math.round((slow.losers / slow.investors) * 100)}% of the investors lose`));
  const pz = (promise, i) => { const run = ponziRun({ promise, deposit: 1000, first: 10, town: 5000, skim: 10 }); const e = run[Math.min(i, run.length - 1)]; return { promise, round: e.round, investors: e.investors, collapsed: e.collapsed, collapseRound: e.collapsed ? e.round : null }; };
  exactly('scams-and-traps', 'ponzi-explore', steps(0, 12, 1).map((i) => pz(50, i)), (s) => s.collapsed);
  exactly('scams-and-traps', 'ponzi-target', [10, 20, 30, 40, 50].flatMap((p) => steps(0, 20, 1).map((i) => pz(p, i))), (s) => s.promise === 10 && s.collapsed);
  exactly('scams-and-traps', 'lottery', [0, 1, 10, 99, 100, 300].map((plays) => ({ plays })), (s) => s.plays >= 100);
  // the wheel returns half of what is staked
  const wheel = raw('scams-and-traps', 'lottery').widget;
  const weight = wheel.outcomes.reduce((t, o) => t + o.p, 0);
  near(wheel.outcomes.reduce((t, o) => t + (o.p / weight) * o.prize, 0), wheel.price / 2, 1e-9);
  assert.equal(raw('scams-and-traps', 'hook').tolerance >= Math.abs(raw('scams-and-traps', 'hook').answer - FACTS.fraud[1]), true);
});

/* ---------------------------------------------- 4. order, choices and care */

test('order steps follow the test\'s own sequence', () => {
  const order = raw('scams-and-traps', 'what-to-do').items.map((t) => /^(Stop|Find|Contact|If money|Report)/.exec(t)[1]);
  assert.deepEqual(order, ['Stop', 'Find', 'Contact', 'If money', 'Report']);
  for (const id of LESSONS) for (const s of lessons[id].steps) if (s.type === 'order') assert.equal(`${id}/${s.id}`, 'scams-and-traps/what-to-do', 'every order step is checked here');
});

test('choices have one right answer; matches and buckets are well formed', () => {
  for (const id of LESSONS) {
    for (const step of lessons[id].steps) {
      const s = resolveStep(step, makeRng(5), step.id);
      if (s.type === 'choice') {
        assert.equal(s.options.filter((o) => o.correct).length, 1, `${id}/${s.id}: one correct option`);
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${s.id}: no duplicate options`);
      }
      if (s.type === 'multi') assert.ok(s.options.some((o) => o.correct) && s.options.some((o) => !o.correct), `${id}/${s.id}`);
      if (s.type === 'match') assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, `${id}/${s.id}: right-hand items are distinct`);
      if (step.type !== 'info' && step.mode !== 'predict' && step.graded !== false) assert.ok((s.explain || '').length > 20, `${id}/${s.id} has an explanation`);
    }
  }
});

test('lesson shape: steps, hands-on work, review and generated practice', () => {
  for (const id of LESSONS) {
    const all = lessons[id].steps;
    assert.ok(all.length >= 11 && all.length <= 20, `${id}: ${all.length} steps`);
    const handsOn = all.filter((s) => s.type === 'interact' || (resolveStep(s, makeRng(1), s.id).figures || []).some((f) => ['card-paydown', 'growth-curve', 'budget-builder'].includes(f.type) && !f.static)).length;
    assert.ok(handsOn >= 3, `${id}: ${handsOn} hands-on steps`);
    const review = all.filter((s) => s.review).length;
    assert.ok(review >= 2 && review <= 4, `${id}: ${review} review steps`);
    assert.ok(all.filter((s) => s.gen).length >= 2, `${id}: generated steps`);
    assert.ok(all.filter((s) => s.type === 'choice').length <= 5, `${id}: at most five choice steps`);
    assert.ok(lessons[id].recap.length >= 3 && lessons[id].recap.length <= 4);
  }
});

const NOTE = '> **A note before we start.** This course is general education about money. It cannot take account of your own circumstances, and rules differ from country to country, so it is not financial advice.';
const allText = (lesson) => {
  const out = [];
  for (const step of lessons[lesson].steps) {
    for (let k = 0; k < (step.gen ? 12 : 1); k++) out.push(...visible(resolveStep(step, makeRng(100 + k), step.id)).map((t) => ({ step, t })));
  }
  for (const t of lessons[lesson].recap) out.push({ step: { id: 'recap' }, t });
  if (lessons[lesson].next) out.push({ step: { id: 'next' }, t: lessons[lesson].next });
  return out;
};

test('care: the standard note, no request for the learner\'s finances, sober steps, help and credits', () => {
  // the note appears once, word for word, on the first or second step of the first lesson
  let count = 0;
  for (const id of LESSONS) for (const { t } of allText(id)) if (flat(t).includes(flat(NOTE))) count++;
  assert.equal(count, 1);
  assert.ok(lessons['pay-and-tax'].steps.slice(0, 2).some((s) => flat(s.text).includes(flat(NOTE))));

  // no step asks for the learner's own figures
  const personal = /\b(your|enter your|type your|tell us your) (own )?(income|salary|wage|wages|pay|savings|debt|debts|rent|spending|balance|net worth|bank details)\b|how much do you (earn|owe|save|spend)|enter your/i;
  for (const id of LESSONS) for (const { step, t } of allText(id)) assert.ok(!personal.test(t), `${id}/${step.id} asks for the learner's own finances: ${t}`);
  for (const id of LESSONS) for (const s of lessons[id].steps) if (s.type === 'reflect') assert.ok(s.personal === true, `${id}/${s.id}: a reflection about the learner's own money is marked personal`);

  // sober tone where harm is discussed, with the help pointers in the same lesson
  const sober = { borrowing: ['trouble'], 'scams-and-traps': ['hook', 'ponzi-explore', 'teach-ponzi', 'ponzi-photo', 'ponzi-target', 'teach-signs', 'signs', 'teach-kinds', 'which-scam', 'teach-defence', 'what-to-do', 'safe-account', 'lottery', 'teach-ev', 'lottery-ev'] };
  for (const [id, ids] of Object.entries(sober)) for (const sid of ids) assert.equal(raw(id, sid).tone, 'sober', `${id}/${sid} is sober`);
  for (const id of LESSONS) {
    for (const step of lessons[id].steps) {
      const text = allText(id).filter((x) => x.step === step).map((x) => x.t).join(' ');
      if (/\b(scam|scams|scammer|fraud|gambling|lottery|unmanageable|beyond what a person can repay)\b/i.test(text) && id !== 'investing') assert.equal(step.tone, 'sober', `${id}/${step.id} mentions fraud, gambling or problem debt and is sober`);
    }
  }
  const textOf = (id) => allText(id).map((x) => x.t).join('\n');
  for (const [, name, contact] of FACTS.help.debt) assert.ok(textOf('borrowing').includes(name) && textOf('borrowing').includes(contact), `${name} is named in the borrowing lesson`);
  for (const key of ['fraud', 'gambling', 'guidance']) for (const [, name, contact] of FACTS.help[key]) assert.ok(textOf('scams-and-traps').includes(name) && textOf('scams-and-traps').includes(contact), `${name} is named in the last lesson`);
  // every telephone number in the course belongs to a service in the verified table (or is the UK's 159)
  const known = Object.values(FACTS.help).flat().map((r) => r[2]).join(' ');
  for (const id of LESSONS) for (const { step, t } of allText(id)) {
    for (const m of t.matchAll(/\b(?:0\d{3}|1[- ]8\d\d|1800)[- ]\d[\d -]{5,}\d\b/g)) assert.ok(known.includes(m[0].trim()), `${id}/${step.id}: ${m[0]} is a verified number`);
  }

  // no product, fund, company, bank, platform, coin or app is recommended; none of these names appears at all
  const brands = /\b(Vanguard|Fidelity|BlackRock|iShares|Schwab|Robinhood|Coinbase|Binance|Bitcoin|Ethereum|Dogecoin|Tesla|Apple|Amazon|Nvidia|PayPal|Revolut|Monzo|Klarna|Afterpay|Visa|Mastercard|American Express|Barclays|HSBC|Chase|Wells Fargo|eToro|Trading 212|Wealthfront|Betterment|Nutmeg)\b/;
  const advice = /\b(you should (buy|sell|invest|borrow|open|sign up)|we recommend|I recommend|our pick|best (fund|bank|broker|card|app) (is|to))/i;
  for (const id of LESSONS) for (const { step, t } of allText(id)) {
    assert.ok(!brands.test(t), `${id}/${step.id} names a product or company: ${t}`);
    assert.ok(!advice.test(t), `${id}/${step.id} reads as a recommendation: ${t}`);
  }
  // the words "guaranteed" and "risk-free" are only ever used to warn
  for (const id of LESSONS) for (const { step, t } of allText(id)) if (/risk-free/i.test(t)) assert.ok(/warning|scam|sign/i.test(allText(id).filter((x) => x.step === step).map((x) => x.t).join(' ')), `${id}/${step.id}`);

  // pictures: each one used has a manifest entry with a licence and a credit, and an alt text of substance
  const used = new Set();
  for (const id of LESSONS) for (const step of lessons[id].steps) for (const fig of figuresOf(resolveStep(step, makeRng(1), step.id))) {
    if (fig.type !== 'photo') { assert.ok(fig.alt && fig.alt.length > 20, `${id}/${step.id}: ${fig.type} has an alt text`); continue; }
    const key = /content\/media\/money\/([a-z0-9-]+)\.jpg/.exec(fig.src)[1];
    used.add(key);
    const rec = manifest.images[key];
    assert.ok(rec, `${key} is in the manifest`);
    assert.ok(rec.license && rec.author && rec.sourceUrl.startsWith('https://commons.wikimedia.org/'), `${key} has a licence, an author and a source`);
    assert.ok(fig.alt && fig.alt.length > 40, `${key} has a real alt text`);
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture of the course is used, and nothing else');
  assert.ok(used.size >= 3 && used.size <= 6);
});

/* ------------------------------------------------- added in independent review */

// The checker's own rules for a typed number (src/player/ui.js), restated here so that the forms a learner
// might type can be tried without a browser.
const typedMatches = (step, typed) => {
  const unit = step.unit ? String(step.unit) : '';
  const tol = step.tolerance;
  const hit = (v) => Number.isFinite(v) && [step.answer, ...(step.accept || [])].some((a) => (tol != null ? Math.abs(v - a) <= tol + 1e-12 : Math.abs(v - a) <= 1e-6 * Math.max(1, Math.abs(a))));
  const t = String(typed).trim();
  const comma = /^-?\d{1,3},\d{3}$/.test(t) ? Number(t.replace(',', '.')) : NaN;
  const dots = /^-?[1-9]\d{0,2}(\.\d{3})+$/.test(t) ? Number(t.replace(/\./g, '')) : NaN;
  return hit(parseNumber(typed, { unit, percentAsNumber: unit === '%' })) || hit(comma) || hit(dots);
};
const withCommas = (v, d = 0) => { const [w, p] = Math.abs(v).toFixed(d).split('.'); return `${v < 0 ? '-' : ''}${w.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${p ? `.${p}` : ''}`; };

test('review: numeric answers accept the forms a learner types, and every listed slip is rejected', () => {
  let checked = 0;
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    if (step.type !== 'numeric') continue;
    for (let k = 0; k < (step.gen ? 80 : 1); k++) {
      const s = step.gen ? resolveStep(step, makeRng(31 + k * 101), step.id) : step;
      const a = s.answer;
      const whole = Number.isInteger(a);
      const forms = [String(a), withCommas(a, whole ? 0 : 2)];
      if (s.prefix && /\$/.test(s.prefix)) forms.push(`$${a}`, `$${withCommas(a, whole ? 0 : 2)}`, `$${withCommas(a, 2)}`, `$ ${a}`);
      if (s.unit === '%') forms.push(`${a}%`, `${a} %`, String(a).replace('.', ','));
      if (a < 0) forms.push(String(a).replace('-', '−'));
      for (const f of forms) assert.ok(typedMatches(s, f), `${id}/${s.id}: "${f}" should be accepted for ${a}`);
      for (const [w] of s.wrong || []) {
        assert.ok(!typedMatches(s, String(w)), `${id}/${s.id}: the slip ${w} must not be accepted for ${a}`);
        if (s.prefix && /\$/.test(s.prefix)) assert.ok(!typedMatches(s, `$${withCommas(w, Number.isInteger(w) ? 0 : 2)}`), `${id}/${s.id}: the slip ${w} with a dollar sign`);
      }
      if (/nearest dollar/.test(s.text)) {
        assert.ok(typedMatches(s, String(Math.round(a))), `${id}/${s.id}: the nearest dollar is accepted`);
        assert.ok(!typedMatches(s, String(Math.round(a) + 2)) && !typedMatches(s, String(Math.round(a) - 2)), `${id}/${s.id}: two dollars off is rejected`);
      }
      checked++;
    }
  }
  assert.ok(checked > 1500, `${checked} numeric variants tried`);
});

test('review: answers asked "to two decimal places" are not on a rounding edge', () => {
  // A learner who rounds an intermediate result first (0.98095, then 1.905, then 1.91) must not be marked
  // wrong for a slip the question invited: no exact answer may lie within 0.05 hundredths of a half.
  const safe = (exact, where) => { const frac = Math.abs(exact * 100) % 1; assert.ok(Math.abs(frac - 0.5) > 0.05, `${where}: ${exact} sits on a rounding edge`); };
  eachVariant('inflation', 'real-return', (s, text) => {
    const [n, i] = [...text.matchAll(/\*\*(\d+)%\*\*/g)].map((m) => Number(m[1]));
    safe(((100 + n) / (100 + i) - 1) * 100, `real return of ${n} and ${i}`);
  }, 120);
  eachVariant('compound-growth', 'effective', (s, text) => {
    const [per, , times] = grab(/: ([\d.]+)% each (month|quarter|half-year), (\d+) times a year/, text);
    const exact = ((1 + Number(per) / 100) ** Number(times) - 1) * 100;
    if (Math.abs(exact * 100 - Math.round(exact * 100)) > 1e-6) safe(exact, `effective rate of ${per}% × ${times}`);
  }, 120);
});

test('review: every dollar sign a learner sees is an amount of money, never a stray formula delimiter', () => {
  for (const id of LESSONS) for (const { step, t } of allText(id)) {
    if (/^(File:|https?:)/.test(t) || /Obverse|LCCN/.test(t)) continue;   // file names in picture credits
    const rest = t.replace(/\\\$/g, '').replace(/\$\$[^$]*\$\$/g, '').replace(/\$[^$\n]*\$/g, '');
    assert.ok(!rest.includes('$'), `${id}/${step.id}: a lone dollar sign in: ${t}`);
    assert.ok(!/\\\$-?\d[\d,]*\.\d(?!\d)(?! (million|billion|trillion))/.test(t), `${id}/${step.id}: an amount with one decimal place in: ${t}`);
    // an escaped amount must not sit inside a formula, where the backslash would show
    for (const m of t.replace(/\\\$/g, '\u0001').matchAll(/\$[^$\n]*\$/g)) {
      assert.ok(!m[0].includes('\u0001'), `${id}/${step.id}: money inside a formula: ${m[0]}`);
      // a thousands separator inside a formula is typeset as a list comma, with a gap after it ("1, 024")
      assert.ok(!/\d,\d{3}/.test(m[0]), `${id}/${step.id}: a grouped number inside a formula: ${m[0]}`);
    }
  }
});

test('review: statements corrected in review stay true', () => {
  // 1. the cliff and the taper are different things: a 60% taper never leaves anyone with less
  const cliff = flat(raw('pay-and-tax', 'cliff').explain);
  assert.match(cliff, /gradual/);
  assert.ok(FACTS.ukTaper[2] < 100, 'a taper below 100% always leaves more after a rise');
  assert.match(cliff, /tax bands alone never make a rise cost you money/);
  for (const [text] of raw('pay-and-tax', 'self-employed').items.map((it) => (Array.isArray(it) ? it : [it.text]))) assert.ok(!/change a lot from month to month/.test(text), 'irregular pay is not offered as a mark of self-employment: many employees have it too');
  assert.ok(course.description.includes('never takes back what you already earned') && !/pay rise can never/i.test(course.description + course.chapters.flatMap((c) => c.lessons.map((l) => l.summary)).join(' ')));
  assert.match(lessons['pay-and-tax'].recap.join(' '), /because of tax bands alone/);

  // 2. the card: the minimum payments quoted are the ones a month-by-month run gives
  let owed = 2000; const mins = [];
  while (owed > 0.005 && mins.length < 600) { const add = Math.round(owed * 18 / 12) / 100; const due = owed + add; const p = Math.min(due, Math.max(25, Math.round(due * 2.5) / 100)); mins.push(p); owed = Math.round((due - p) * 100) / 100; }
  const cardText = flat(raw('borrowing', 'card-explore').explain);
  const [first, later] = grab(/first minimum payment is about \\\$(\d+); four years later it is about \\\$(\d+)/, cardText).map(Number);
  assert.equal(first, Math.round(mins[0]));
  assert.equal(later, Math.round(mins[48]), 'the 49th payment, four years on');
  assert.equal(mins.length, 128);
  assert.ok(mins.length > 120, 'more than ten years: "a ten-year debt"');

  // 3. deposits: "spread evenly over N banks" really brings every part under the limit, whatever the balance
  let seen = 0;
  eachVariant('safety-net', 'deposit', (s, text) => {
    const [limit, balance] = dollars(text);
    const m = /Spread evenly over (two|three|four) banks, all of it would be/.exec(s.explain);
    assert.equal(!!m, balance > limit);
    if (!m) return;
    const n = { two: 2, three: 3, four: 4 }[m[1]];
    assert.ok(balance / n <= limit, `${balance} over ${n} banks`);
    assert.ok(balance / (n - 1) > limit, 'and no fewer banks would do');
    seen++;
  }, 120);
  assert.ok(seen > 20);
  const canada = H.DEPOSIT_LIMITS.find((d) => d.where === 'Canada');
  assert.match(canada.limit, /proposed/, 'the pending Canadian rise is mentioned, not asserted');

  // 4. fees: the note says how the simulator applies the fee, and the sums quoted follow from it
  for (const sid of ['fee-explore', 'fee-target']) assert.match(raw('long-game', sid).widget.note, /fee comes off that rate/);
  const pot = (rate, years) => { let v = 10000; for (let y = 0; y < years; y++) v += v * rate / 100; return v; };
  const feeText = dollars(raw('long-game', 'fee-target').explain);
  near(feeText[feeText.length - 2], pot(6, 30) - pot(5.7, 30), 50, 'cost of a 0.3% fee over 30 years');
  near(feeText[feeText.length - 1], pot(6, 30) - pot(5, 30), 50, 'cost of a 1% fee over 30 years');
  assert.ok(pot(6, 30) - pot(5, 30) > 10000, '"more than the sum that was invested"');
  // the hook's answer holds whether the fee is read as "rate minus fee" or as 1% of the pot taken each year
  const hook = raw('long-game', 'hook');
  for (const lost of [(1 - (1.05 / 1.06) ** 40) * 100, (1 - 0.99 ** 40) * 100]) assert.ok(Math.abs(lost - hook.answer) <= hook.tolerance, `a loss of ${lost.toFixed(1)}% is inside the accepted band`);

  // 5. fraud: "nearly half", not "half"; the UK reporting service names the route for Scotland
  const fraud = flat(raw('scams-and-traps', 'hook').explain);
  assert.match(fraud, /Nearly half of it/);
  assert.ok(FACTS.fraud[3] / FACTS.fraud[1] < 0.5 && FACTS.fraud[3] / FACTS.fraud[1] > 0.45);
  assert.match(flat(raw('scams-and-traps', 'what-to-do').explain), /Report Fraud \| reportfraud\.police\.uk or 0300 123 2040 \(in Scotland: Police Scotland on 101\)/);

  // 6. gambling and crypto: the expected loss is plain and nothing reads as an invitation
  eachVariant('scams-and-traps', 'lottery-ev', (s) => {
    assert.match(s.explain, /the average result is a loss, by design/);
    assert.ok(!/fair thing to buy|worth a try|you could win/i.test(s.explain));
  }, 30);
  const crypto = raw('investing', 'crypto');
  assert.match(correctText(crypto), /prepared to lose all the money/);
  assert.match(flat(crypto.explain), /takes no view on whether anyone should own them/);

  // 7. investing: history is labelled as history, the losing-period chart names its market and period and is hedged
  const horizon = flat(raw('investing', 'horizon').text);
  assert.match(horizon, /roughly how often US shares/);
  assert.match(horizon, /from 1926 to 2024 \(with dividends, before inflation\)/);
  assert.match(flat(raw('investing', 'horizon').explain), /The past is a guide, not a guarantee/);
  assert.match(flat(raw('investing', 'history').widget.note), /Not a forecast/);
  for (const id of ['compound-growth', 'inflation', 'investing', 'long-game']) for (const step of lessons[id].steps) for (const fig of figuresOf(step)) {
    if (fig.type === 'growth-curve') assert.match(fig.note || 'A constant example rate, added once a year. No tax or fees. Not a forecast.', /Not a forecast/, `${id}/${step.id}: the chart says it is not a forecast`);
  }
});

/* ------------------------------------------------------ teach before you ask */

// The teaching screens added when the course was revised to teach before it asks. For each: the lesson, the
// screen, the first step it serves, and the terms that step needs, which the screen must contain.
const TEACHING = [
  ['pay-and-tax', 'teach-payslip', 'payslip-read', [/Gross pay/, /Deductions/, /Net pay/]],
  ['pay-and-tax', 'bands-name', 'tax-calc', [/progressive/, /bands/, /above\*\* the line/]],
  ['pay-and-tax', 'example-tax', 'tax-calc', [/slice/, /at 20%/, /at 30%/, /Total/]],
  ['pay-and-tax', 'teach-marginal', 'marginal-average', [/marginal rate/, /average rate/, /÷/]],
  ['pay-and-tax', 'example-raise', 'raise', [/band line/, /Extra tax/, /keeps/]],
  ['pay-and-tax', 'teach-convert', 'convert', [/52 weeks/, /12 months/, /an hour/, /× 52/, /÷ 12/, /× 12/]],
  ['budgeting', 'teach-budget', 'build-tomas', [/budget/, /every dollar of income a job/, /needs/, /wants/, /saving/]],
  ['budgeting', 'name', 'fixed-variable', [/Fixed costs/, /Variable costs/, /50\/30\/20/]],
  ['budgeting', 'example-shares', 'shares', [/share/, /÷/, /rule of thumb/]],
  ['budgeting', 'teach-yearly', 'yearly', [/12 months/, /52 weeks/, /× 12/, /× 52/, /÷ 12/]],
  ['budgeting', 'teach-unit', 'unit-price', [/unit price/, /per 100 g/, /cents/]],
  ['compound-growth', 'name', 'calc', [/simple interest/, /compound interest/, /\(1 \+ r\)\^n/]],
  ['compound-growth', 'example-compound', 'calc', [/multiplies the balance by 1\.04/, /nearest dollar/, /Simple interest/]],
  ['compound-growth', 'teach-rule72', 'rule72', [/rule of 72/, /72 ÷/, /rule of thumb/]],
  ['compound-growth', 'teach-effective', 'effective', [/nominal rate/, /effective annual rate/, /APY, AER or EAR/, /1\.02\^2/]],
  ['compound-growth', 'example-contrib', 'contrib', [/start of each year/, /interest twice/]],
  ['inflation', 'name', 'basket', [/Inflation/, /purchasing power/, /basket/, /share of last year/]],
  ['inflation', 'teach-halving', 'halving', [/72 ÷/, /half as much/]],
  ['inflation', 'teach-real', 'real-return', [/nominal/, /real/, /Quick estimate/, /Exact/, /two decimal places/]],
  ['inflation', 'teach-winners', 'winners', [/owes/, /is owed/, /fixed number of dollars/, /cash/]],
  ['inflation', 'teach-deflation', 'targets', [/deflation/, /wait to buy/, /harder to repay/]],
  ['borrowing', 'name', 'month-interest', [/Interest/, /APR/, /one twelfth/]],
  ['borrowing', 'example-month', 'month-interest', [/÷ 12/, /Interest added/, /Minimum payment/]],
  ['borrowing', 'teach-amort', 'amort-first', [/interest/, /principal/, /hatched/]],
  ['borrowing', 'example-total', 'total-cost', [/Everything paid back/, /what was borrowed/, /of interest/]],
  ['borrowing', 'teach-kinds', 'kinds', [/Secured loan/, /Unsecured loan/, /Payday loan/, /Buy now, pay later/, /× 26/]],
  ['borrowing', 'teach-record', 'credit-record', [/credit record/, /score/, /on time/, /credit limit/, /mistakes/]],
  ['safety-net', 'teach-cushion', 'shock', [/emergency fund/, /three to six months of essential spending/, /rule of thumb/]],
  ['safety-net', 'teach-places', 'where', [/all there/, /reachable within days/, /deposit protection/, /Shares and crypto-assets/, /fixed-term deposit/, /Valuables/, /per person, per bank/]],
  ['safety-net', 'teach-expected', 'expected', [/insurance/, /expected loss/, /chance of the loss times its size/, /law of large numbers/]],
  ['safety-net', 'name', 'premium-find', [/premium/, /cover/, /excess/, /deductible/]],
  ['safety-net', 'teach-kinds', 'kinds', [/Health insurance/, /Home insurance/, /Liability insurance/, /Income protection/, /Life insurance/]],
  ['investing', 'teach-what', 'what', [/Saving/, /Investing/, /A savings account/, /A bond/, /A share/, /A fund/, /bill/]],
  ['investing', 'teach-risk', 'risk-return', [/Risk and return travel together/, /swing/, /stay down for years/]],
  ['investing', 'name', 'fund-share', [/diversification/, /Market risk/, /Company-specific risk/, /100% ÷ 40/]],
  ['investing', 'teach-speculating', 'crypto', [/Speculating/, /Crypto-assets/, /Deposit protection/, /unregulated/]],
  ['investing', 'example-crash', 'crash', [/index/, /40 ÷ 60/, /one decimal place/]],
  ['long-game', 'name', 'fee-calc', [/yearly fee/, /expense ratio/, /percentage of its value/]],
  ['long-game', 'example-fee', 'fee-calc', [/1% of/, /Over 20 years/, /nearest dollar/]],
  ['long-game', 'teach-index', 'index', [/index fund/, /actively managed fund/, /SPIVA/, /are\* the market/]],
  ['long-game', 'example-regular', 'regular', [/units/, /Average price paid/, /plain average/]],
  ['long-game', 'teach-match', 'match-calc', [/match/, /up to a limit/, /stops at/]],
  ['scams-and-traps', 'teach-ponzi', 'ponzi-photo', [/Ponzi scheme/, /Owed next round/, /new investor/, /multiplies the money by 1\.5/]],
  ['scams-and-traps', 'teach-signs', 'signs', [/guaranteed/, /Hurry/, /secrecy/, /cannot be reversed/, /one-time code/, /remote access/, /out of the blue/]],
  ['scams-and-traps', 'teach-kinds', 'which-scam', [/Phishing/, /Impersonation/, /Romance scam/, /Investment scam/, /Advance-fee scam/, /Recovery scam/]],
  ['scams-and-traps', 'teach-defence', 'what-to-do', [/stop/, /channel you found yourself/, /bank comes first/, /fraud-reporting service/, /freezes the account/]],
  ['scams-and-traps', 'teach-traps', 'mind-traps', [/Present bias/, /Loss aversion/, /Sunk-cost thinking/, /Anchoring/, /Overconfidence/, /Following the crowd/]],
  ['scams-and-traps', 'teach-ev', 'lottery-ev', [/expected value/, /paid out as prizes/, /average loss/]],
];
/** The teaching screens that the revision added (the others in TEACHING were there before and were extended). */
const ADDED = {
  'pay-and-tax': ['teach-payslip', 'example-tax', 'teach-marginal', 'example-raise', 'teach-convert'],
  budgeting: ['teach-budget', 'example-shares', 'teach-yearly', 'teach-unit'],
  'compound-growth': ['example-compound', 'teach-rule72', 'teach-effective', 'example-contrib'],
  inflation: ['teach-halving', 'teach-real', 'teach-winners', 'teach-deflation'],
  borrowing: ['example-month', 'teach-amort', 'example-total', 'teach-kinds', 'teach-record'],
  'safety-net': ['teach-cushion', 'teach-places', 'teach-expected', 'teach-kinds'],
  investing: ['teach-what', 'teach-risk', 'teach-speculating', 'example-crash'],
  'long-game': ['example-fee', 'teach-index', 'example-regular', 'teach-match'],
  'scams-and-traps': ['teach-ponzi', 'teach-signs', 'teach-kinds', 'teach-defence', 'teach-traps', 'teach-ev'],
};
const indexOf = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `step ${lesson}/${id} exists`); return i; };
const shown = (lesson, id) => flat(raw(lesson, id).text);
const figOf = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id).figures[0];

test('teach before you ask', () => {
  for (const id of LESSONS) {
    const all = lessons[id].steps.map((s) => resolveStep(s, makeRng(1), s.id));
    const firstGraded = all.findIndex((s) => s.graded);
    const firstTeach = all.findIndex((s) => s.type === 'info' || (s.type === 'interact' && !s.graded));
    assert.ok(firstTeach >= 0 && firstTeach < firstGraded, `${id}: something is taught (step ${firstTeach + 1}) before the first graded step (${firstGraded + 1})`);
    // a teaching screen is an info step that is followed by something to answer
    const lastAsked = all.map((s) => s.type !== 'info').lastIndexOf(true);
    const teaching = all.filter((s, i) => s.type === 'info' && i < lastAsked);
    assert.ok(teaching.length >= 3 && teaching.length <= 6, `${id}: ${teaching.length} teaching screens`);
    assert.ok(all.filter((s) => s.mode === 'predict').length <= 2, `${id}: at most two predictions`);
    for (let i = 2; i < all.length; i++) assert.ok(!(all[i].type === 'info' && all[i - 1].type === 'info' && all[i - 2].type === 'info'), `${id}: three info steps in a row at ${all[i].id}`);
    for (const sid of ADDED[id]) {
      const step = raw(id, sid);
      assert.equal(step.type, 'info', `${id}/${sid} is a teaching screen`);
      assert.ok(indexOf(id, sid) < lastAsked, `${id}/${sid} is followed by a question`);
      assert.ok(TEACHING.some(([l, t]) => l === id && t === sid), `${id}/${sid} has its pins of substance`);
    }
    // new screens never reuse an id
    assert.equal(new Set(lessons[id].steps.map((s) => s.id)).size, lessons[id].steps.length, `${id}: step ids are unique`);
  }
  // each teaching screen comes before the step it serves, and holds the terms that step needs
  for (const [lesson, teach, serves, terms] of TEACHING) {
    assert.equal(raw(lesson, teach).type, 'info', `${lesson}/${teach}`);
    assert.ok(indexOf(lesson, teach) < indexOf(lesson, serves), `${lesson}/${teach} comes before ${serves}`);
    for (const term of terms) assert.match(shown(lesson, teach), term, `${lesson}/${teach} teaches what ${serves} needs`);
  }
  // steps drawn from a table: every item of the table is on a teaching screen above the step
  const kinds = shown('scams-and-traps', 'teach-kinds');
  for (const name of new Set(SCAM_KEY.map((k) => k[1]))) assert.ok(kinds.includes(`**${name}**`), `${name} is taught before "which scam?"`);
  for (const c of H.SCAM_CASES) assert.ok(kinds.includes(c.sign), `the mark of ${c.type} is taught: ${c.sign}`);
  assert.equal(new Set(H.SCAM_CASES.map((c) => `${c.type}|${c.sign}`)).size, Object.keys(H.SCAM_TYPES).length, 'one mark for each kind of scam');
  const traps = shown('scams-and-traps', 'teach-traps');
  for (const t of H.MIND_TRAPS) {
    assert.ok(TRAP_KEY[t.name], `${t.name} is in the test's own table`);
    assert.ok(traps.includes(`**${t.name}**: ${t.means}.`), `${t.name} is taught with its meaning`);
    assert.ok(!traps.includes(t.example), 'the screen gives the meaning, not the example the question asks for');
  }
  // matches whose left-hand items are a taught list: every item is on the screen above
  for (const [lesson, teach, match] of [['borrowing', 'teach-kinds', 'kinds'], ['safety-net', 'teach-kinds', 'kinds'], ['investing', 'teach-what', 'what']]) {
    for (const [left] of raw(lesson, match).pairs) assert.ok(shown(lesson, teach).includes(`**${left}**`), `${lesson}/${teach} presents "${left}"`);
  }
  // care: the new screens about fraud and gambling are sober and add no organisation, number or address
  const helpWords = Object.values(FACTS.help).flat().flatMap((r) => [r[1], r[2]]);
  for (const id of LESSONS) for (const sid of ADDED[id]) {
    const text = visible(raw(id, sid)).join(' ');
    for (const w of helpWords) assert.ok(!text.includes(w), `${id}/${sid} names no help service (${w})`);
    assert.ok(!/https?:|www\.|\.org|\.gov|\.uk|\b159\b|\b\d{3,4}[ -]\d{3}[ -]\d{3,4}\b/.test(text), `${id}/${sid} carries no address or telephone number`);
    assert.ok(!/\bforecast\b/i.test(text) || /Not a forecast/.test(text), `${id}/${sid} forecasts nothing`);
  }
});

test('teach before you ask: every worked example is re-derived here, and no generated question can repeat one', () => {
  const has = (lesson, id, ...parts) => { for (const p of parts) assert.ok(shown(lesson, id).includes(p), `${lesson}/${id} states "${p}" in: ${shown(lesson, id)}`); };
  const usd = (v, d) => `\\$${withCommas(v, d != null ? d : Number.isInteger(v) ? 0 : 2)}`;
  /** No variant of a generated step may contain any of these phrases (the numbers of a worked example). */
  const never = (lesson, id, ...phrases) => {
    const step = raw(lesson, id);
    for (let k = 0; k < SEEDS; k++) {
      const text = flat(resolveStep(step, makeRng(911 + k * 131), id).text);
      for (const p of phrases) assert.ok(!(p instanceof RegExp ? p.test(text) : text.includes(p)), `${lesson}/${id} can repeat the worked example (${p}): ${text}`);
    }
  };
  const grow = (start, ratePct, years) => { let v = start; for (let y = 0; y < years; y++) v += (v * ratePct) / 100; return v; };

  // 1 · pay and tax: Ravi on 48,000 a year
  const slip = figOf('pay-and-tax', 'teach-payslip');
  const line = Object.fromEntries(slip.lines.map((l) => [l.id, l.amount]));
  assert.equal(slip.mode, 'static');
  near(line.gross * 12, 48000); near(-line.tax * 12, sliceTax(48000, FACTS.verdia)); near(-line.social, line.gross * 0.06); near(-line.pension, line.gross * 0.04);
  near(line.gross + line.tax + line.social + line.pension, line.net);
  assert.deepEqual([line.gross, -line.tax, -line.social, -line.pension, line.net], [4000, 700, 240, 160, 2900]);
  has('pay-and-tax', 'teach-payslip', `${usd(700)} + ${usd(240)} + ${usd(160)} = ${usd(1100)}`, `${usd(4000)} − ${usd(1100)} = **${usd(2900)}**`);
  never('pay-and-tax', 'gross-net', 'Gross pay | \\$4,000 ');
  const taxFig = figOf('pay-and-tax', 'example-tax');
  assert.deepEqual([taxFig.type, taxFig.static, taxFig.income], ['tax-bands', true, 48000]);
  assert.equal(sliceTax(48000, FACTS.verdia), 8400);
  has('pay-and-tax', 'example-tax', `at 20%, ${usd(30000 * 0.2)}`, `at 30%, ${usd(8000 * 0.3)}`, `${usd(6000)} + ${usd(2400)} = **${usd(8400)}**`, usd(8400 / 12));
  has('pay-and-tax', 'teach-marginal', `marginal rate is **${sliceTax(48100, FACTS.verdia) - sliceTax(48000, FACTS.verdia)}%**`, `average rate is **${(8400 / 48000) * 100}%**`, '8,400 ÷ 48,000 = 0.175');
  for (const id of ['tax-calc', 'marginal-average']) never('pay-and-tax', id, 'earns **\\$48,000**');
  const before = sliceTax(37000, FACTS.verdia); const after = sliceTax(46000, FACTS.verdia);
  has('pay-and-tax', 'example-raise', `from ${usd(37000)} to ${usd(46000)}`, `${usd(3000)} at 20% is ${usd(600)}`, `${usd(6000)} at 30% is ${usd(1800)}`, `= ${usd(after - before)}.`, `${usd(9000)} − ${usd(after - before)} = **${usd(9000 - (after - before))}**`);
  assert.equal(9000 - (after - before), 6600);
  const raiseFig = figOf('pay-and-tax', 'example-raise');
  assert.deepEqual([raiseFig.income, raiseFig.compare, raiseFig.static], [46000, 37000, true]);
  never('pay-and-tax', 'raise', 'from **\\$37,000**');
  let year = 0; for (let w = 0; w < 52; w++) year += 21 * 25;
  has('pay-and-tax', 'teach-convert', `${usd(21)} × 25 = ${usd(525)}`, `× 52 = **${usd(year)}**`, `÷ 12 = **${usd(year / 12)}**`, `${usd(year / 12)} × 12 = ${usd(year)}`);
  assert.ok(Number.isInteger(year / 12));
  never('pay-and-tax', 'convert', '**\\$21 an hour**', '**25 hours a week**', '**\\$27,300 a year**', '**\\$2,275 a month**');

  // 2 · budgeting: Noor's plan
  const plan = figOf('budgeting', 'teach-budget');
  const totals = budgetTotals(plan.income, plan.items);
  assert.ok(plan.static && totals.balanced && plan.income === 3500);
  for (const it of plan.items) has('budgeting', 'teach-budget', `| ${it.label} | ${usd(it.amount)} |`);
  has('budgeting', 'teach-budget', `**${usd(plan.income)}** |`);
  assert.deepEqual(totals.shares, { needs: 80, wants: 12, saving: 8 });
  has('budgeting', 'example-shares', `${usd(totals.needs)} ÷ ${usd(3500)} = 0.80, which is **80%**`, `${usd(totals.wants)} ÷ ${usd(3500)} = 0.12, which is **12%**`, `${usd(totals.saving)} ÷ ${usd(3500)} = 0.08, which is **8%**`, '80 + 12 + 8 = 100');
  assert.deepEqual(figOf('budgeting', 'example-shares').items, plan.items);
  never('budgeting', 'shares', 'takes home **\\$3,500**');
  has('budgeting', 'teach-yearly', `${usd(11)} × 12 = **${usd(11 * 12)}**`, `${usd(7)} × 52 = **${usd(7 * 52)}**`, `${usd(600)} ÷ 12 = **${usd(50)}**`);
  never('budgeting', 'yearly', '**\\$11 a', '**\\$7 a');
  const packs = [...shown('budgeting', 'teach-unit').matchAll(/(\d+) g for \\\$([\d.]+):.*?= \*\*(\d+) cents\*\* per 100 g/g)].map((m) => m.slice(1).map(Number));
  assert.equal(packs.length, 2);
  for (const [grams, price, cents] of packs) near((price * 100) / (grams / 100), cents, 1e-9, `${grams} g for ${price}`);
  assert.ok(packs[0][0] < packs[1][0] && packs[1][2] < packs[0][2], 'in the example the larger pack is the cheaper per 100 g');
  never('budgeting', 'unit-price', '**500 g for', '**750 g for');

  // 3 · compound growth
  const three = [1, 2, 3].map((n) => grow(3000, 4, n));
  has('compound-growth', 'example-compound', `${usd(3000)} → ${usd(3120)} → ${usd(3244.8)} → ${usd(Math.round(three[2] * 100) / 100)}`, '\\approx 3374.59', `**${usd(Math.round(three[2]))}**`, `${usd(3000 + 3 * 120)}`, `about ${usd(Math.round(three[2]) - 3360)}`);
  near(three[2], 3374.592, 1e-9);
  never('compound-growth', 'calc', 'puts **\\$3,000**', 'pays **4%**');
  has('compound-growth', 'teach-rule72', '72 ÷ 5 = **14.4 years**', `exact figure is ${(Math.log(2) / Math.log(1.05)).toFixed(1)} years`, '72 ÷ 10 = **7.2%**');
  const ruleFig = figOf('compound-growth', 'teach-rule72');
  assert.ok(ruleFig.static && ruleFig.series[0].rate === 5 && grow(1000, 5, 14) < 2000 && grow(1000, 5, 15) > 2000, 'the chart doubles between years 14 and 15');
  never('compound-growth', 'rule72', 'grows at **5%**', 'doubled in **10 years**');
  has('compound-growth', 'teach-effective', '4% ÷ 2 = 2%', `1.02^2 = ${1.02 * 1.02}`, `grows by **${((1.02 * 1.02 - 1) * 100).toFixed(2)}%**`, `1.01^4 \\approx ${(1.01 ** 4).toFixed(4)}`, `a growth of ${((1.01 ** 4 - 1) * 100).toFixed(2)}%`);
  never('compound-growth', 'effective', 'advertised at **4% a year**');
  const paidIn = (800 * 1.04 + 800) * 1.04;
  has('compound-growth', 'example-contrib', `${usd(800)} × 1.04 = ${usd(832)}`, `${usd(832)} + ${usd(800)} = ${usd(1632)}`, `${usd(1632)} × 1.04 = **${usd(1697.28)}**`);
  near(paidIn, 1697.28, 1e-9); near(planValue({ pay: 800, rate: 4 }, 2), 1697.28, 1e-9);
  never('compound-growth', 'contrib', 'pays **\\$800**', 'pays **4%**');

  // 4 · inflation
  has('inflation', 'name', `${usd(642)} − ${usd(600)} = ${usd(42)}`, '42 ÷ 600 = 0.07', 'Inflation was **7%**');
  never('inflation', 'basket', 'cost **\\$600**');
  let power = 100; for (let y = 0; y < 14; y++) power /= 1.05;
  has('inflation', 'teach-halving', '72 ÷ 5 = **14.4 years**', `\\approx ${power.toFixed(2)}`);
  const clock = figOf('inflation', 'teach-halving');
  assert.deepEqual([clock.static, clock.rate, clock.years], [true, 5, 14]);
  near(inflate(100, 5, 14).power, 50.51, 1e-9); assert.ok(Math.abs(power - 50) < 1, 'almost exactly half');
  never('inflation', 'halving', 'rise by **5%**');
  const real = (n, i) => ((100 + n) / (100 + i) - 1) * 100;
  has('inflation', 'teach-real', '6 − 4 = 2%', `\\approx ${(1.06 / 1.04).toFixed(4)}`, `**${real(6, 4).toFixed(2)}%**`, `\\approx ${(1.06 / 1.09).toFixed(4)}`, `**−${Math.abs(real(6, 9)).toFixed(2)}%**`);
  for (const v of [real(6, 4), real(6, 9)]) assert.ok(Math.abs((Math.abs(v * 100) % 1) - 0.5) > 0.05, 'not on a rounding edge');
  assert.ok(real(6, 9) < 0);
  never('inflation', 'real-return', /\*\*6%\*\*.*prices rose by \*\*4%\*\*/, /\*\*6%\*\*.*prices rose by \*\*9%\*\*/);
  for (let k = 0; k < 40; k++) {
    const s = resolveStep(raw('inflation', 'shrink'), makeRng(77 + k), 'shrink');
    assert.ok(flat(s.text).includes('from 400 g to 320 g at the same price costs 400 ÷ 320 = 1.25 times as much per gram: a rise of 25%'));
    assert.ok(!/weigh \*\*400 g\*\*\. It now weighs \*\*320 g\*\*/.test(flat(s.text)));
  }
  near((400 / 320 - 1) * 100, 25);

  // 5 · borrowing
  const add = Math.round(2000 * 18 / 12) / 100; const due = 2000 + add; const min = Math.max(25, Math.round(due * 2.5) / 100);
  assert.deepEqual([add, due, min, Math.round((due - min) * 100) / 100], [30, 2030, 50.75, 1979.25]);
  has('borrowing', 'example-month', '18% ÷ 12 = 1.5%', `= **${usd(30)}**. He now owes ${usd(2030)}`, `2.5% of ${usd(2030)} = **${usd(50.75)}**`, `falls by ${usd(20.75)}, to ${usd(1979.25)}`);
  assert.equal(Math.round(min), Number(grab(/first minimum payment is about \\\$(\d+)/, flat(raw('borrowing', 'card-explore').explain))[0]), 'the same first payment as the exploration quotes');
  never('borrowing', 'month-interest', 'owes **\\$2,000**');
  const van = loanFacts(12000, 8, 84);
  assert.ok(Math.abs(runLoan(12000, 8, 84, 187.03)) < 1, 'a payment of 187.03 clears the van loan in seven years, to within a dollar');
  near(van.payment, 187.03, 1e-9); near(van.firstInterest, 80, 1e-9); near(van.firstPrincipal, 107.03, 1e-9);
  const owed2 = Math.round((12000 - 107.03) * 100) / 100;
  has('borrowing', 'teach-amort', `${usd(187.03)} a month`, `= ${usd(80, 2)}`, `${usd(187.03)} − ${usd(80, 2)} = **${usd(107.03)}**`, `owes ${usd(owed2)}`, `(${usd(Math.round(owed2 * 8 / 12) / 100)})`);
  assert.deepEqual([owed2, Math.round(owed2 * 8 / 12) / 100], [11892.97, 79.29]);
  const amortFig = figOf('borrowing', 'teach-amort');
  assert.deepEqual([amortFig.type, amortFig.static, amortFig.amount, amortFig.apr, amortFig.years], ['loan-schedule', true, 12000, 8, 7]);
  has('borrowing', 'example-total', `30 × ${usd(221)} = ${usd(30 * 221)}`, `${usd(6630)} − ${usd(6000)} = **${usd(630)}**`);
  assert.ok(runLoan(6000, 4, 30, 221) < 0 && runLoan(6000, 15, 30, 221) > 0, 'an ordinary interest rate');
  never('borrowing', 'total-cost', 'borrows **\\$6,000**', '**30 monthly payments');
  has('borrowing', 'teach-kinds', `12% × 26 = **${12 * (52 / 2)}%**`);
  never('borrowing', 'payday', 'fee of **\\$12 for every');

  // 6 · safety net
  has('safety-net', 'teach-cushion', `3 × ${usd(1100)} = ${usd(3300)}`, `6 × ${usd(1100)} = ${usd(6600)}`);
  never('safety-net', 'fund-size', '**\\$1,100 a month**');
  has('safety-net', 'teach-places', `guarantees ${usd(100000)} per person, per bank`, `With ${usd(140000)} in one bank, ${usd(100000)} is covered and ${usd(140000 - 100000)} is not`, `With ${usd(75000)}, all of it is covered`);
  assert.ok(75000 <= H.VERDIA_DEPOSIT_LIMIT && H.VERDIA_DEPOSIT_LIMIT === 100000);
  never('safety-net', 'deposit', 'has **\\$140,000**', 'has **\\$75,000**');
  assert.equal(expectedClaim(0.02, 30000), 600);
  has('safety-net', 'teach-expected', '2% chance a year (1 in 50)', `2% × ${usd(30000)} = **${usd(600)}**`, `${usd(30000)} ÷ 50`, `10 × ${usd(30000)} = ${usd(300000)}`, `${usd(300000)} ÷ 500 = ${usd(600)}`);
  assert.deepEqual([500 * 0.02, 30000 / 50, 300000 / 500], [10, 600, 600]);
  never('safety-net', 'expected', 'cost of **\\$30,000**', '**1 in 250**');
  never('safety-net', 'warranty', '**2%**');
  has('safety-net', 'name', `${usd(1500)} − ${usd(400)} = **${usd(1100)}**`, `A loss of ${usd(250)}: that is below the excess, so the insurer pays **nothing**`);
  never('safety-net', 'excess', `excess of \\$400**`);

  // 7 · investing
  has('investing', 'name', 'A fund holds 40 companies', `100% ÷ 40 = **${100 / 40}%**`);
  never('investing', 'fund-share', '**40 companies**');
  has('investing', 'example-crash', 'falls by 40%', 'After the fall, 60 is left', '40 ÷ 60 ≈ 0.667', `**${((40 / 60) * 100).toFixed(1)}%**`, '60 × 1.4 is only 84');
  near(60 * 1.4, 84, 1e-9);
  never('investing', 'crash', 'falls by **40%**');
  const riskFig = figOf('investing', 'teach-risk');
  assert.deepEqual(riskFig.data.map((d) => d.value), FACTS.swings);
  has('investing', 'teach-risk', `some ${Math.round(FACTS.swings[0])} percentage points`, `about ${Math.round(FACTS.swings[1])} points`, `bills about ${Math.round(FACTS.swings[2])}`);

  // 8 · long game
  has('long-game', 'example-fee', `1% of ${usd(30000)} is ${usd(300)}, so 0.4% is 0.4 × ${usd(300)} = **${usd(120)}**`);
  near((30000 / 100) * 0.4, 120, 1e-9);
  never('long-game', 'fee-calc', 'has **\\$30,000**', '**0.4% a year**');
  const noFee = Math.round(grow(10000, 6, 20)); const withFee = Math.round(grow(10000, 5, 20));
  assert.deepEqual([noFee, withFee, noFee - withFee], [32071, 26533, 5538]);
  has('long-game', 'example-fee', `\\approx ${noFee}}`, `\\approx ${withFee}}`, `${usd(noFee)} − ${usd(withFee)} = **${usd(noFee - withFee)}**`, 'more than half of the sum put in');
  assert.ok(noFee - withFee > 10000 / 2);
  near(planValue({ start: 10000, rate: 6, fee: 1 }, 20), grow(10000, 5, 20), 1e-6, 'the chart applies the fee as the text does');
  const feeFig = figOf('long-game', 'example-fee');
  assert.ok(feeFig.static && feeFig.years === 20 && feeFig.params.fee.value === 1 && /Not a forecast/.test(feeFig.note));
  const indexFig = figOf('long-game', 'teach-index');
  assert.deepEqual(indexFig.data.map((d) => d.value), FACTS.spiva.slice(0, 3));
  has('long-game', 'teach-index', `${FACTS.spiva[0]}% in ${FACTS.spiva[3]}`, `${FACTS.spiva[1]}% over five years`, 'about nine in ten over twenty');
  has('long-game', 'timing', `${FACTS.bestDays[0]} of the ${FACTS.bestDays[1]} best days came within two weeks of the ${FACTS.bestDays[1]} worst days`);
  const bought = [12, 6, 8].map((p) => 120 / p);
  const units = bought.reduce((a, b) => a + b, 0);
  has('long-game', 'example-regular', `${usd(12)}, then ${usd(6)}, then ${usd(8)}`, `Together ${units} units`, `3 × ${usd(120)} = ${usd(360)}`, `${usd(360)} ÷ ${units} = **${usd(360 / units, 2)}**`, `prices is ${usd((12 + 6 + 8) / 3, 2)}`);
  assert.deepEqual([bought, units, 360 / units], [[10, 20, 15], 45, 8]);
  assert.ok(360 / units < (12 + 6 + 8) / 3);
  never('long-game', 'regular', '**\\$120 a month**');
  has('long-game', 'teach-match', `pays in 2%, which is ${usd((45000 * 2) / 100)}`, `Together **${usd(2 * (45000 * 2) / 100)}**`, `pays in 7%, which is ${usd((45000 * 7) / 100)}`, `stops at 4%, which is ${usd((45000 * 4) / 100)}`, `Together **${usd((45000 * 7) / 100 + (45000 * 4) / 100)}**`);
  assert.deepEqual([900 + 900, 3150 + 1800], [1800, 4950]);
  never('long-game', 'match-calc', 'earns **\\$45,000**');
  for (let k = 0; k < 40; k++) {
    const rb = flat(resolveStep(raw('long-game', 'rebalance'), makeRng(55 + k), 'rebalance').text);
    assert.ok(rb.includes(`a pot of ${usd(30000)} that has drifted to 72% shares holds ${usd(30000 * 0.72)} in shares. 60% would be ${usd(30000 * 0.6)}, so ${usd(30000 * 0.72 - 30000 * 0.6)} has to move`));
    assert.ok(!/pot of \*\*\\\$30,000\*\*/.test(rb) && !/\*\*72% shares\*\*/.test(rb));
    const fp = flat(resolveStep(raw('long-game', 'four-percent'), makeRng(55 + k), 'four-percent').text);
    assert.ok(fp.includes(`(${usd(100000 * 0.04)} from a pot of ${usd(100000)}, for example)`));
    assert.ok(!/\*\*\\\$100,000\*\*/.test(fp) && !/\*\*\\\$4,000\*\*/.test(fp));
  }

  // 9 · scams and traps
  const first = ponziRun({ promise: 50, deposit: 1000, first: 10, town: 5000, skim: 10 });
  near(first[1].pot - first[0].pot, first[1].joined * 900 - first[0].investors * 500, 1e-9, 'in the simulator a new deposit adds 900 to the pot and every earlier investor is paid 500');
  const bill = 40 * 500; let needed = 0; while (needed * 900 < bill) needed++;
  has('scams-and-traps', 'teach-ponzi', `40 × ${usd(500)} = ${usd(bill)}`, `brings ${usd(900)} (the operator keeps ${usd(100)})`, `20,000 ÷ 900 ≈ ${(bill / 900).toFixed(1)}: at least ${needed} new people`, `${40 + needed} × ${usd(500)} = ${usd((40 + needed) * 500)}`, `${usd(600)} → ${usd(600 * 1.5)} → ${usd(600 * 1.5 * 1.5)}`);
  assert.deepEqual([needed, (40 + needed) * 500], [23, 31500]);
  never('scams-and-traps', 'ponzi-photo', 'What would \\$600 be');
  const wheel = raw('scams-and-traps', 'lottery').widget;
  const weight = wheel.outcomes.reduce((t, o) => t + o.p, 0);
  const prize = wheel.outcomes.reduce((t, o) => t + (o.p / weight) * o.prize, 0);
  has('scams-and-traps', 'teach-ev', `${usd(prize)} − ${usd(wheel.price)}, a loss of ${usd(wheel.price - prize)} a game`, `70% of ${usd(4)} comes back: ${usd(2.8, 2)}`, `${usd(4)} − ${usd(2.8, 2)} = **${usd(1.2, 2)}**`);
  let back = 0; for (let cent = 0; cent < 400; cent++) back += 0.7;
  near(back / 100, 2.8, 1e-9); near(4 - back / 100, 1.2, 1e-9);
  never('scams-and-traps', 'lottery-ev', 'pays out **70%**', 'ticket costs **\\$4**');
});

test('second review of the teaching screens: what was corrected stays corrected', () => {
  // 1. central banks are not all "given" their target: the Bank of England's is set by the government, the
  //    Federal Reserve and the European Central Bank chose their own (see INFLATION_TARGETS in helpers.js)
  const deflation = shown('inflation', 'teach-deflation');
  assert.match(deflation, /work to a target for inflation/);
  assert.ok(!/are given a target/.test(deflation));
  // 2. the screen above "halving" works out 6% (72 ÷ 6 = 12) and 5%: the question asks for neither
  assert.match(shown('inflation', 'teach-halving'), /72 ÷ 6 = 12 years/);
  const halvingRates = new Set();
  for (let k = 0; k < 300; k++) halvingRates.add(Number(/rise by \*\*(\d+)%\*\*/.exec(flat(resolveStep(raw('inflation', 'halving'), makeRng(3 + k * 17), 'halving').text))[1]));
  assert.ok(!halvingRates.has(6) && !halvingRates.has(5), 'no rate that the teaching screen has already worked out');
  assert.ok(halvingRates.size >= 6, 'still a varied pool');
  // 3. the card's minimum is the larger of a floor and a percentage: the worked month says which one applies
  const floor = 25; const pctPart = Math.round((2000 + 30) * 2.5) / 100;
  assert.ok(pctPart > floor);
  assert.ok(shown('borrowing', 'example-month').includes(`= **\\$${pctPart.toFixed(2)}** (more than the \\$${floor} floor, so the percentage decides)`));
  // 4. evidence carries its source, market and period on the screen that shows it
  const risk = shown('investing', 'teach-risk');
  assert.equal(H.LONG_RUN.sdTo, 2025, 'the swings are from the 2026 edition, 1900 to 2025');
  assert.ok(risk.includes('from 1900 to 2025') && risk.includes('Dimson, Marsh and Staunton'), 'the swings name their source and period');
  assert.ok(!/in the same study/.test(risk), 'the returns (to 2024) and the swings (to 2025) are from different editions');
  const timing = flat(raw('long-game', 'timing').text);
  assert.ok(timing.includes('US share market over the twenty years to the end of 2023') && timing.includes('J.P. Morgan Asset Management'), 'the best-days count names its market, period and source');
  assert.equal(H.BEST_DAYS.year, 2023);
  assert.match(shown('long-game', 'teach-index'), /S&P's SPIVA scorecards for 2025/);
  assert.equal(FACTS.spiva[3], 2025, 'year-end 2025 for one and five years, mid-2025 for twenty: two scorecards of the same year, hence the plural');
  // 5. regular investing: the lower average price is arithmetic, and the screen says it promises no gain
  const regular = shown('long-game', 'example-regular');
  assert.match(regular, /That is arithmetic\. It does not guarantee a gain/);
  assert.ok(!/\b(best|smart|should|always wins?|beats?)\b/i.test(regular), 'nothing on the screen recommends the method');
  // 6. the closing table of lesson 1 fits a phone: no heading word longer than "insurance"
  const names = flat(raw('pay-and-tax', 'names').text);
  assert.ok(names.includes('| | Income tax | Social insurance | Pension saving |'));
  assert.match(shown('pay-and-tax', 'teach-payslip'), /social insurance/, 'the same words as on the payslip');
});

test('the course outline matches the lessons, and every generated step is covered', () => {
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  for (const id of LESSONS) {
    const gen = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(gen.slice().sort(), GENERATED[id].slice().sort(), `${id}: the list of generated steps is complete`);
    for (const g of gen) assert.ok(tested.has(`${id}/${g}`), `${id}/${g} is re-derived by a test`);
    for (const s of lessons[id].steps) if (s.review) assert.ok(s.id && (s.explain || s.gen), `${id}/${s.id} review step`);
  }
});
