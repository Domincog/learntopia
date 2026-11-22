// Algorithms II · Lesson 2 · Take the Best Bite
import { plural } from '../../../kit.js';
import { MEETINGS, RULE_NAME, bestChange, clock, firstGreedyFailure, greedyChange, listAnd, maxMeetings, minCoinsTable, randomTimetable, runRule } from '../helpers.js';

const EURO = [1, 5, 10, 25];
const ODD = [1, 3, 4];
const PAY = 68;
const PAY_GREEDY = greedyChange(EURO, PAY);
const BEST_ROOM = maxMeetings(MEETINGS);
const RUNS = Object.fromEntries(['shortest', 'start', 'finish'].map((rule) => [rule, runRule(MEETINGS, rule).map((m) => m.id)]));
const STRETCH = [1, 5, 12];
const STRETCH_FAIL = firstGreedyFailure(STRETCH);

/** Coin sets (smallest coin 1) for which greedy sometimes uses too many coins, with the amounts where it does. */
const TRAPS = [[1, 3, 4], [1, 4, 5], [1, 5, 6], [1, 4, 6], [1, 6, 10], [1, 7, 10]].map((coins) => {
  const best = minCoinsTable(coins, 24);
  const amounts = [];
  for (let a = 2; a <= 24; a++) if (greedyChange(coins, a).length > best[a]) amounts.push(a);
  return { coins, amounts };
});

const sumText = (coins) => coins.join(' + ');

/** Worked examples of the teaching screens. The generated steps cannot ask them: 23 is below their range, and 1, 5, 8 is not one of TRAPS. */
const SHOW_PAY = 23;
const SHOW_GREEDY = greedyChange(EURO, SHOW_PAY);
const SHOW_TRAP = { coins: [1, 5, 8], amount: 15 };
const TRAP_GREEDY = greedyChange(SHOW_TRAP.coins, SHOW_TRAP.amount);
const TRAP_BEST = bestChange(SHOW_TRAP.coins, SHOW_TRAP.amount);
const MEETING = Object.fromEntries(MEETINGS.map((m) => [m.id, m]));

export default {
  id: 'greedy',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'The lazy cashier',
      text: `
        A cashier gives change the quick way: hand over the **biggest coin that still fits**, then the biggest that fits what is left, and so on. No planning, no going back.

        **Does that always use the fewest coins possible?**
      `,
      options: [
        { text: 'Yes, whatever coins the country has' },
        { text: 'For some sets of coins yes, for others no', correct: true },
        { text: 'No: it is only ever a rough guess' },
      ],
      explain: `
        It depends on the coins. With the usual 1, 5, 10 and 25 the quick way is always best. With other sets of coins it can go wrong.

        This lesson is about that kind of rule: fast, tempting, sometimes exactly right and sometimes a trap.
      `,
    },
    {
      id: 'teach-rule',
      type: 'info',
      title: 'The cashier\'s rule, coin by coin',
      text: `
        Watch the rule at work once, with coins of **1, 5, 10 and 25**.

        :::example Pay ${SHOW_PAY}
        1. 25 is too big. The biggest coin that fits is **10**. Left to pay: 13.
        2. 10 fits again. Left: 3.
        3. Now 10 and 5 are both too big. Only **1** fits, three times.

        ${sumText(SHOW_GREEDY)} = ${SHOW_PAY}: that is **${SHOW_GREEDY.length} coins**. Count every coin, not every kind of coin.
        :::

        At each step the cashier asks one question only: *what is the biggest coin that fits into what is left?*
      `,
      figure: { type: 'coin-change', coins: EURO, target: SHOW_PAY, paid: SHOW_GREEDY, static: true, alt: `A tray holding ${SHOW_GREEDY.length} coins: ${listAnd(SHOW_GREEDY)}. Together they make ${SHOW_PAY}.` },
    },
    {
      id: 'make-change',
      type: 'interact',
      attempts: 6,
      title: 'Fewest coins',
      text: `
        Coins of **1, 5, 10 and 25**, as many of each as you like.

        **Pay exactly ${PAY} with as few coins as you can.**
      `,
      widget: { type: 'coin-change', coins: EURO, target: PAY },
      check: (s) => {
        if (!s.exact) return s.count ? `The tray holds ${s.total}. Another ${s.left} is missing.` : `Tap coins until the tray holds exactly ${PAY}.`;
        if (s.count > PAY_GREEDY.length) return `That pays ${PAY}, but with ${s.count} coins. Fewer will do: swap small coins for bigger ones.`;
        return true;
      },
      solution: { coins: PAY_GREEDY },
      hints: ['Start with the biggest coin that fits, and ask the same question again for what is left.'],
      explain: `
        ${sumText(PAY_GREEDY)} = ${PAY}: **${PAY_GREEDY.length} coins**, and no way of paying ${PAY} uses fewer.

        You probably did not plan anything. You reached for the 25s first, then the 10, and let the small coins fill the gap.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Greedy algorithms',
      text: `
        What you just did is a **greedy algorithm**:

        - At every step, take the option that looks best **right now**.
        - Never reconsider a choice once it is made.

        Compare that with backtracking, which undoes choices all the time. Greedy never looks back, so it is fast: one pass, and the answer is there.

        The catch is in the words "looks best right now". Whether a string of locally best choices adds up to the best answer overall depends on the problem.
      `,
    },
    {
      id: 'greedy-run',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const amount = rng.intExcept(27, 99, [50, 75]);
        const coins = greedyChange(EURO, amount);
        const used = EURO.slice().reverse().filter((c) => coins.includes(c));
        return {
          text: `
            A machine pays out change with coins of 1, 5, 10 and 25. It follows the greedy rule: always the biggest coin that still fits.

            **How many coins does it hand over for ${amount}?**
          `,
          answer: coins.length,
          wrong: [
            [used.length, `That is how many *kinds* of coin it uses. Some kinds are needed more than once: count every coin.`],
          ],
          hints: [
            `Start with the 25s: how many fit into ${amount}, and what is left?`,
            `After the 25s, ${amount - 25 * Math.floor(amount / 25)} is left. Carry on with 10s, then 5s, then 1s.`,
          ],
          explain: `
            ${sumText(coins)} = ${amount}. That is **${plural(coins.length, 'coin')}**.

            With these coins the greedy answer is also the best possible one.
          `,
        };
      },
    },
    {
      id: 'odd-coins',
      type: 'interact',
      attempts: 6,
      title: 'A country with odd coins',
      text: `
        Somewhere else the coins are **1, 3 and 4**.

        **Pay 6 by the greedy rule:** always the biggest coin that still fits. The tray refuses any other coin.
      `,
      widget: { type: 'coin-change', coins: ODD, target: 6, greedy: true, max: 10 },
      check: (s) => s.exact || (s.count ? `${s.left} is still to pay. Take the biggest coin that fits into ${s.left}.` : 'Start with the biggest coin that fits into 6.'),
      solution: { coins: greedyChange(ODD, 6) },
      explain: `
        Greedy pays ${sumText(greedyChange(ODD, 6))}: **three coins**. After grabbing the 4 it had no choice left: 2 remained, and only 1s fit into that.

        Is three coins really the best anyone can do?
      `,
    },
    {
      id: 'beat-greedy',
      type: 'interact',
      attempts: 6,
      text: `
        The same coins, **1, 3 and 4**, but now you may choose freely.

        **Pay 6 with fewer than three coins.**
      `,
      widget: { type: 'coin-change', coins: ODD, target: 6, max: 10 },
      check: (s) => {
        if (!s.exact) return s.count ? `The tray holds ${s.total}. Another ${s.left} is missing.` : 'Tap coins until the tray holds exactly 6.';
        if (s.count === 2) return true;
        if (s.greedy) return 'That is the greedy answer again: 4 + 1 + 1. Empty the tray and start with a smaller coin this time.';
        return `That pays 6 with ${s.count} coins. Two are enough.`;
      },
      solution: { coins: bestChange(ODD, 6) },
      hints: ['Leave the 4 alone. Which coin fits into 6 exactly twice?'],
      explain: `
        ${sumText(bestChange(ODD, 6))}: **two coins**. The greedy tray could never get there, because its first coin has to be the 4.
      `,
    },
    {
      id: 'teach-hold-back',
      type: 'info',
      title: 'One grab can spoil the rest',
      text: `
        Greedy grabbed the 4 because it looked best at that moment. That one choice ruled the best answer out, and greedy never goes back, so it never found out. To beat it, **hold back on the biggest coin**.

        :::example Coins of ${listAnd(SHOW_TRAP.coins)}. Pay ${SHOW_TRAP.amount}.
        - Greedy: ${sumText(TRAP_GREEDY)}. **${TRAP_GREEDY.length} coins.**
        - With no 8 at all: ${sumText(TRAP_BEST)}. **${TRAP_BEST.length} coins.**
        :::

        An example on which a rule fails is called a **counterexample**. With 1, 5, 10 and 25 the greedy rule has none. With 1, 3 and 4 it has one at 6. **A greedy rule needs a reason, not just a good feeling.**
      `,
      figure: { type: 'coin-change', coins: SHOW_TRAP.coins, target: SHOW_TRAP.amount, paid: TRAP_GREEDY, static: true, alt: `The greedy payment of ${SHOW_TRAP.amount} in a tray: ${TRAP_GREEDY.length} coins, ${listAnd(TRAP_GREEDY)}.` },
    },
    {
      id: 'fewest',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const trap = rng.pick(TRAPS);
        const amount = rng.pick(trap.amounts);
        const greedy = greedyChange(trap.coins, amount);
        const best = bestChange(trap.coins, amount);
        const big = trap.coins[2];
        const count = (list) => list.filter((c) => c === big).length;
        return {
          text: `
            A country has coins of **${listAnd(trap.coins)}**. The greedy rule pays **${amount}** as ${sumText(greedy)}: that is ${greedy.length} coins.

            What is the **smallest number of coins** that pays ${amount} exactly?
          `,
          answer: best.length,
          wrong: [
            [greedy.length, `That is the greedy answer. Here it is not the best one: try using ${count(greedy) === 1 ? `no ${big} at all` : `fewer ${big}s`}.`],
          ],
          hints: [
            `Greedy uses ${plural(count(greedy), `coin of ${big}`, `coins of ${big}`)}. You may use fewer of them.`,
            `Try paying ${amount} with ${count(best) === 0 ? `no ${big} at all` : plural(count(best), `coin of ${big}`, `coins of ${big}`)}.`,
          ],
          explain: `
            ${sumText(best)} = ${amount}: **${plural(best.length, 'coin')}** instead of greedy's ${greedy.length}.

            Greedy took as many ${big}s as it could, and that left an awkward remainder. The best answer holds back on the biggest coin.
          `,
        };
      },
    },
    {
      id: 'meetings-free',
      type: 'interact',
      attempts: 6,
      title: 'One room, eight requests',
      text: `
        A different problem. Eight groups want the same meeting room, each for a fixed time. The scale along the top shows the hours of the day. Two meetings cannot overlap, but one may start the minute another ends.

        **Book as many meetings as you can.**
      `,
      widget: { type: 'meeting-picker', meetings: MEETINGS, from: 9, to: 18 },
      check: (s) => {
        if (s.count === BEST_ROOM) return true;
        if (!s.count) return 'Tap a bar to book that meeting.';
        return s.full
          ? `${plural(s.count, 'meeting')} booked, and nothing else fits. But ${BEST_ROOM} are possible: take some out again and try others.`
          : `${plural(s.count, 'meeting')} booked so far. More will fit: ${BEST_ROOM} are possible.`;
      },
      solution: { picked: RUNS.finish },
      hints: [
        'Long meetings block a lot of others. Look for meetings that leave the room free again early.',
        `The first meeting to book is ${RUNS.finish[0]}: it finishes before any other.`,
      ],
      explain: `
        ${listAnd(RUNS.finish)}: **${BEST_ROOM} meetings**, and no choice of five fits.

        You found that by trying things out. A greedy algorithm would follow one fixed rule instead. But which rule?
      `,
    },
    {
      id: 'three-rules',
      type: 'interact',
      attempts: 6,
      title: 'Three greedy rules',
      text: `
        Here are three rules that each sound sensible. Every one of them means: *of the meetings that still fit, book the one that is* …

        - shortest,
        - earliest to start, or
        - earliest to finish.

        **Carry out all three by hand**, one after the other. Pick a rule with the buttons; the room only accepts the meeting that rule would choose.
      `,
      widget: { type: 'meeting-picker', meetings: MEETINGS, from: 9, to: 18, rules: ['shortest', 'start', 'finish'] },
      check: (s) => {
        const missing = ['shortest', 'start', 'finish'].filter((rule) => !(rule in s.results));
        if (!missing.length) return true;
        return `Still to do: ${listAnd(missing.map((rule) => `"${RULE_NAME[rule]}"`))}. Run each rule until no further meeting fits.`;
      },
      solution: { ran: ['shortest', 'start', 'finish'] },
      explain: `
        | Rule | Books | Meetings |
        |------|-------|---------:|
        | Shortest first | ${RUNS.shortest.join(', ')} | ${RUNS.shortest.length} |
        | Earliest start first | ${RUNS.start.join(', ')} | ${RUNS.start.length} |
        | Earliest finish first | ${RUNS.finish.join(', ')} | ${RUNS.finish.length} |

        *Earliest start* fell for G, a long meeting that happens to begin first. *Shortest* fell for H, which is short but sits across both F and C. Only *earliest finish* found all ${BEST_ROOM}.
      `,
    },
    {
      id: 'teach-exchange',
      type: 'info',
      title: 'Why earliest finish is safe',
      text: `
        Earliest finish first found all ${BEST_ROOM} meetings here. It can be **proved** to find a best answer on every timetable. The idea is a swap.

        Take any schedule, say one that starts with E (${clock(MEETING.E.start)} to ${clock(MEETING.E.end)}). Swap E for ${RUNS.finish[0]}, the meeting that finishes earliest (the picture). ${RUNS.finish[0]} ends no later than E did, so every later meeting still fits, and the schedule is just as big.

        So booking the earliest finisher first never loses anything. The same swap works for the second meeting, the third, and so on. This is called an **exchange argument**.
      `,
      figure: { type: 'meeting-picker', meetings: MEETINGS, from: 9, to: 18, booked: [RUNS.finish[0]], static: true, alt: `The eight meeting requests as bars on a time line from 9 to 18. ${RUNS.finish[0]}, from ${clock(MEETING[RUNS.finish[0]].start)} to ${clock(MEETING[RUNS.finish[0]].end)}, is booked. E, from ${clock(MEETING.E.start)} to ${clock(MEETING.E.end)}, overlaps it and ends later.` },
    },
    {
      id: 'why-finish',
      type: 'choice',
      review: true,
      title: 'A rule with a reason',
      text: `
        To fit as many meetings as possible into one room, the rule "book the meeting that **finishes earliest**, then the earliest-finishing one that still fits, and so on" always gives a best answer. That can be proved.

        **What is the idea behind the proof?**
      `,
      options: [
        { text: 'Take any best schedule. Swapping its first meeting for the one that finishes earliest never causes a clash, so the greedy choice loses nothing', correct: true },
        { text: 'The meeting that finishes earliest is always the shortest one', why: 'Not so. A long meeting that starts very early can finish before a short one that starts late.' },
        { text: 'It has been tried on many timetables and never failed', why: 'Examples can show that a rule fails. They cannot show that it always works: the next timetable might be the bad one.' },
        { text: 'Greedy rules always give the best answer when the choices are sorted first', why: 'Sorting by start time or by length is also "sorted first", and both of those rules can fail.' },
      ],
      explain: `
        The meeting that finishes first leaves the most room for everything after it. If a best schedule starts with some other meeting, swap that one for the earliest finisher: it ends no later, so nothing else is disturbed, and the schedule is just as big.

        Repeat the argument for the second meeting, the third, and so on. This kind of **exchange argument** is how greedy rules are proved correct.
      `,
    },
    {
      id: 'schedule',
      type: 'interact',
      review: true,
      attempts: 5,
      gen: (rng) => {
        const n = rng.pick([5, 6, 6, 7]);
        const meetings = randomTimetable(rng, n);
        const greedy = runRule(meetings, 'finish');
        const best = greedy.length;
        const [who, what, where] = rng.pick([
          ['groups', 'meetings', 'one meeting room'],
          ['bands', 'rehearsals', 'one rehearsal room'],
          ['classes', 'lessons', 'the only sports hall'],
          ['teams', 'training sessions', 'the same pitch'],
        ]);
        const word = { 5: 'Five', 6: 'Six', 7: 'Seven' }[n];
        return {
          text: `
            ${word} ${who} have asked for ${where}, each for a fixed time: the bars, on a scale of hours of the day. Bookings must not overlap, but one may start the minute another ends.

            **Book as many ${what} as possible.**
          `,
          widget: { type: 'meeting-picker', meetings, from: 9, to: 17 },
          check: (s) => {
            if (s.count === best) return true;
            if (!s.count) return 'Tap a bar to book it.';
            return s.full
              ? `${s.count} booked, and nothing else fits. But more are possible: start with the request that finishes first.`
              : `${s.count} booked so far. At least one more fits.`;
          },
          solution: { picked: greedy.map((m) => m.id) },
          hints: [
            'Use the rule that is proved to work: of the requests that still fit, book the one that finishes earliest.',
            `The request that finishes first is ${greedy[0].id} (${clock(greedy[0].start)}–${clock(greedy[0].end)}).`,
          ],
          explain: `
            Earliest finish first books ${listAnd(greedy.map((m) => `${m.id} (until ${clock(m.end)})`))}: **${best} ${what}**.

            No schedule can hold more, because that rule is proved to be optimal.
          `,
        };
      },
    },
    {
      id: 'smallest-fail',
      type: 'numeric',
      stretch: true,
      title: 'Hunt for a counterexample',
      text: `
        A country plans coins of **${listAnd(STRETCH)}**, and its cashiers will give change by the greedy rule.

        **What is the smallest amount for which greedy does *not* use the fewest coins?**
      `,
      answer: STRETCH_FAIL,
      wrong: [
        [12, 'Greedy pays 12 with a single coin. Nothing beats that.'],
        [10, 'The 12 does not fit into 10, so greedy pays 5 + 5: two coins, which is the best possible.'],
        [13, 'Greedy pays 13 as 12 + 1: two coins. Without the 12 it would take five (5 + 5 + 1 + 1 + 1).'],
        [14, 'Greedy pays 14 as 12 + 1 + 1: three coins. Without the 12 it would take six (5 + 5 + 1 + 1 + 1 + 1).'],
        [24, 'Greedy pays 24 as 12 + 12: two coins, which cannot be beaten. Look for a smaller amount.'],
      ],
      hints: [
        'Greedy can only go wrong once the 12 fits. Check the amounts from 12 upwards.',
        'Look for an amount just above 12 that the 5s make exactly.',
      ],
      explain: `
        **${STRETCH_FAIL}**: greedy pays ${sumText(greedyChange(STRETCH, STRETCH_FAIL))}, which is ${greedyChange(STRETCH, STRETCH_FAIL).length} coins. But ${sumText(bestChange(STRETCH, STRETCH_FAIL))} does it with ${bestChange(STRETCH, STRETCH_FAIL).length}.

        Below 12 only the coins 1 and 5 are in play, and greedy is fine with those. For 12, 13 and 14 the 12 really is the right first coin. One counterexample is enough to show that a greedy rule cannot be trusted.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend invents a greedy rule for a new problem. They test it on three examples, and each time it finds the best answer.

        **What would you tell them before they rely on it?**
      `,
      model: `
        Three examples prove nothing. "Biggest coin first" passes any number of tests with coins of 1, 5, 10 and 25, and still fails for 6 with coins of 1, 3 and 4.

        A greedy rule is trustworthy only when there is an argument that the locally best choice can never spoil the best overall answer, like the swap argument for "earliest finish first". Without such an argument, look hard for a counterexample, or use a method that considers more than one option.
      `,
    },
  ],
  recap: [
    'A **greedy algorithm** takes the option that looks best right now and never goes back. That makes it fast.',
    'Sometimes greedy is provably best: biggest coin first with coins of 1, 5, 10, 25, or earliest finish first for booking a room.',
    'Sometimes it fails: with coins of 1, 3, 4 it pays 6 as 4 + 1 + 1, although 3 + 3 is better.',
    'So a greedy rule needs a **reason**. One counterexample sinks it; examples that work prove nothing.',
  ],
  next: 'Next: what to do when greedy fails. The trick is to solve every small case once, and write the answers down.',
};
