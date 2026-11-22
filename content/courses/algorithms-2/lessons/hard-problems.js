// Algorithms II · Lesson 6 · No Fast Way Known
import { r, plural } from '../../../kit.js';
import { TOWNS, allTours, bestTour, group, km, nearestTour, ringFigure, tourCount, tourLength } from '../helpers.js';

const BEST = bestTour(TOWNS, 'A');
const NEAR = nearestTour(TOWNS, 'A');
const TRIPS = allTours(TOWNS, 'A').length;
const N = Object.keys(TOWNS).length;
const legsOf = (order) => order.map((id, i) => km(TOWNS, id, order[(i + 1) % order.length]));
const arrow = (order) => `${order.join(' → ')} → ${order[0]}`;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
const PER_SECOND = 1e9;
const secondsFor = (n) => Number(tourCount(n)) / PER_SECOND;
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const product = (n) => Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' × ');
/** The worked count: a depot and two other towns. Three towns is below the range of the generated step (4 to 8). */
const TRIO = { A: [150, 226], B: [410, 226], C: [280, 66] };
const TRIO_KM = tourLength(TRIO, ['A', 'B', 'C']);
/** The worked check: the best trip of the lesson against a claim it meets. Its legs are longer than any the generated step draws. */
const CLAIM = BEST.length + 5;

export default {
  id: 'hard-problems',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      attempts: 8,
      title: 'The delivery round',
      text: `
        A van starts at the depot **A**, has to visit each of the other six towns once, and then returns to A. Roads run straight from town to town, and their lengths are counted in whole kilometres.

        **Plan a round trip that is as short as you can make it.** Tap the towns in the order the van should visit them.
      `,
      widget: { type: 'tour-builder', towns: TOWNS, start: 'A', unit: 'km' },
      check: (s) => s.complete || `${plural(N - s.visited, 'town has', 'towns have')} not been visited yet.`,
      solution: { tour: NEAR.order },
      explain: `
        Your trip was one of **${TRIPS}** different round trips through these seven towns. The shortest of them all is ${BEST.length} km long.

        Did you find it? And if you did: how could you be *sure*, without looking at the other ${TRIPS - 1}?
      `,
    },
    {
      id: 'beat-it',
      type: 'interact',
      attempts: 8,
      text: `
        This is the **travelling salesman problem**, and it is famous for being hard.

        **Find the shortest round trip of all: ${BEST.length} km.**
      `,
      widget: { type: 'tour-builder', towns: TOWNS, start: 'A', unit: 'km' },
      check: (s) => {
        if (!s.complete) return `${plural(N - s.visited, 'town has', 'towns have')} not been visited yet.`;
        if (s.length > BEST.length) return `Your round trip is ${s.length} km long. ${BEST.length} km is possible: look for a long leg that you could avoid.`;
        return true;
      },
      solution: { tour: BEST.order },
      hints: [
        'The best trip here never crosses its own path. Try driving round the outside of the map.',
        `Start ${BEST.order.slice(0, 3).join(' → ')}, then carry on along the bottom.`,
      ],
      explain: `
        ${arrow(BEST.order)}: ${legsOf(BEST.order).join(' + ')} = **${BEST.length} km**.

        Adding up seven legs took you a few seconds. Knowing that no other trip is shorter is a different matter: for that, a computer here simply tried all ${TRIPS}.
      `,
    },
    {
      id: 'teach-count',
      type: 'info',
      title: 'Count the round trips',
      text: `
        To be sure of the best trip, a computer could try them all. How many are there? Count the orders in which the van can visit the other towns, then allow for direction.

        :::example A depot and 2 other towns
        The van has 2 choices for its first stop, then 1 for the next: 2 × 1 = **2 orders**, A → B → C → A and A → C → B → A.

        These are the same loop driven in opposite directions, and both are ${TRIO_KM} km long. So there is only 2 ÷ 2 = **1 round trip**.
        :::

        Each extra town puts one more factor in front: with 3 other towns the orders are counted 3 × 2 × 1. And every loop is in the list twice, once in each direction.
      `,
      figure: { type: 'tour-builder', mode: 'view', towns: TRIO, start: 'A', unit: 'km', tour: ['A', 'B', 'C'], height: 290, alt: `Three towns joined in a loop: the depot A, B and C. The legs are ${km(TRIO, 'A', 'B')}, ${km(TRIO, 'B', 'C')} and ${km(TRIO, 'C', 'A')} km long, ${TRIO_KM} km in all.` },
    },
    {
      id: 'count-fill',
      type: 'fill',
      title: 'How many round trips?',
      text: 'Take a smaller map: a depot and **4 other towns**. Count the round trips.',
      template: `
        The van has 4 choices for its first stop, then 3, then 2, then 1. That makes [[${factorial(4)}]] orders.

        Each round trip is in that list twice, once in each direction. So there are [[${factorial(4) / 2}]] different round trips.
      `,
      hints: ['Multiply the choices: 4 × 3 × 2 × 1.', 'A trip and the same trip driven backwards have the same length, so they count as one.'],
      explain: r`
        $4 \times 3 \times 2 \times 1 = 24$ orders, and $24 \div 2 = 12$ round trips.

        In general, $n$ towns give $(n - 1) \times (n - 2) \times \dots \times 1$ orders, and half as many round trips.
      `,
    },
    {
      id: 'tours-count',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(4, 8);
        const orders = factorial(n - 1);
        const answer = orders / 2;
        return {
          text: `
            A round trip starts at a depot, visits each of the other towns once and returns to the depot. The same loop driven in the opposite direction counts as the same trip.

            **How many different round trips are there through ${n} towns** (the depot included)?
          `,
          answer,
          wrong: [
            [orders, `That is the number of orders in which the ${n - 1} other towns can be visited. Each round trip is counted twice in it, once per direction.`],
            [factorial(n), `The depot is fixed as the start, so only the other ${n - 1} towns are put in order. And each loop is counted twice.`],
            [factorial(n) / 2, `The depot is fixed as the start. Only the other ${n - 1} towns are put in order: ${product(n)}.`],
          ],
          hints: [
            `First count the orders for the ${n - 1} towns after the depot: ${product(n)}.`,
            `That is ${group(orders)}. Now halve it, because each loop appears once in each direction.`,
          ],
          explain: `
            ${product(n)} = ${group(orders)} orders. Each round trip appears twice, so there are ${group(orders)} ÷ 2 = **${group(answer)}** round trips.
          `,
        };
      },
    },
    {
      id: 'explosion',
      type: 'choice',
      shuffle: false,
      title: 'The explosion',
      text: `
        The number of round trips for larger maps:

        | Towns | Round trips |
        |------:|------------:|
        | 7 | ${group(tourCount(7))} |
        | 10 | ${group(tourCount(10))} |
        | 15 | ${group(tourCount(15))} |
        | 20 | ${group(tourCount(20))} |

        A computer checks **a billion round trips every second**. For 15 towns it needs ${group(tourCount(15))} ÷ 1,000,000,000 seconds: about ${Math.round(secondsFor(15))} seconds. A year has about ${Math.round(SECONDS_PER_YEAR / 1e6)} million seconds.

        About how long does the computer need to try them all for **20 towns**?
      `,
      options: [
        { text: 'About a minute', why: `That is about right for 15 towns: ${group(tourCount(15))} trips take ${Math.round(secondsFor(15))} seconds. Twenty towns have over a million times as many.` },
        { text: 'About a day', why: 'A day has 86,400 seconds: enough for about 86 trillion trips. The table shows nearly 61 thousand trillion.' },
        { text: 'About 2 years', correct: true },
        { text: 'About 2,000 years', why: 'Not quite that bad yet. But 25 towns would take millions of years.' },
      ],
      explain: `
        ${group(tourCount(20))} trips at a billion a second take about ${group(Math.round(secondsFor(20) / 1e6))} million seconds: nearly **two years**. For 25 towns it would be about ${Math.round(secondsFor(25) / SECONDS_PER_YEAR / 1e6)} million years.

        Every extra town multiplies the work by the number of towns. That grows even faster than doubling, and no faster computer keeps up with it.
      `,
    },
    {
      id: 'teach-check',
      type: 'info',
      title: 'Finding is hard, checking is easy',
      text: `
        You have now seen one job: **finding** a shortest round trip. No known method avoids an explosion of work. **Checking** a trip that somebody proposes is a very different job.

        :::example "There is a round trip of at most ${CLAIM} km."
        As proof, a friend hands you the trip in the picture. Add up its legs: ${legsOf(BEST.order).join(' + ')} = ${BEST.length} km. That is within ${CLAIM} km, so the claim is **proved**.
        :::

        Seven numbers to add, however long the search for that trip took. A trip of ${NEAR.length} km would prove nothing: a different trip might still be short enough.
      `,
      figure: { type: 'tour-builder', mode: 'view', towns: TOWNS, start: 'A', unit: 'km', tour: BEST.order, alt: `The seven towns with the round trip ${arrow(BEST.order)} drawn in. Its legs are ${legsOf(BEST.order).join(', ')} km long.` },
    },
    {
      id: 'verify',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const n = rng.int(5, 7);
        const legs = Array.from({ length: n }, () => rng.int(3, 15));
        const total = legs.reduce((a, b) => a + b, 0);
        const proved = rng.bool();
        const limit = proved ? total + rng.int(0, 5) : total - rng.int(1, 5);
        return {
          text: `
            A friend claims: *"There is a round trip through these ${n} towns that is at most **${limit} km** long."* As proof, they hand you this trip.

            **Check the claim.**
          `,
          figure: ringFigure(legs),
          template: `The trip is [[${total}]] km long, so the claim is [[${proved ? '*proved' : 'proved'}|${proved ? 'not proved by this trip' : '*not proved by this trip'}]].`,
          hints: ['Add up the numbers on the legs, then compare the total with the claim.'],
          explain: `
            ${legs.join(' + ')} = **${total} km**. ${proved
    ? `That is ${total === limit ? 'exactly' : 'less than'} ${limit} km, so this trip proves the claim.`
    : `That is more than ${limit} km, so this trip proves nothing. (The claim might still be true: a different trip could be shorter.)`}

            Either way, checking meant adding up ${n} numbers. Checking a proposed answer is fast, however hard the answer was to find.
          `,
        };
      },
    },
    {
      id: 'p-np',
      type: 'info',
      title: 'Fast to solve, fast to check',
      text: `
        Computer scientists sort problems by this difference between finding and checking.

        - **P** is the class of problems that can be *solved* fast: the work grows only like n, n², n³ … with the size of the input. Sorting is in P, and so is finding a shortest route with Dijkstra's algorithm.
        - **NP** is the class of problems whose proposed answers can be *checked* fast. "Is there a round trip of at most 110 km?" is in NP: show me the trip and I add it up.

        Two more problems are in NP, and like the round trip they have no known fast way of *finding* an answer. Can a map be coloured with three colours so that neighbouring countries differ? Do these parcels fit into a given number of vans? A proposed colouring is checked border by border, a proposed packing van by van.

        Everything in P is also in NP. The open question, **P versus NP**, is whether the two are really the same: *if an answer can always be checked fast, can it always be found fast?* Nobody knows.
      `,
    },
    {
      id: 'sort-p-np',
      type: 'bucket',
      review: true,
      text: 'For each task: is a **fast method known**, or is it only known to be **fast to check** once somebody hands you an answer?',
      buckets: ['A fast method is known', 'Fast to check, no fast method known'],
      items: [
        { text: 'Sort a million names', bucket: 0, why: 'Merge sort does it in about n log n steps.' },
        { text: 'Find the shortest route between two towns on a road map', bucket: 0, why: 'Dijkstra\'s algorithm does this fast, even on huge maps.' },
        { text: 'Find a name in a sorted list', bucket: 0, why: 'Binary search needs about log n looks.' },
        { text: 'Is there a round trip through these 500 towns of at most 10,000 km?', bucket: 1, why: 'A proposed trip is quickly added up. But no fast way of finding one, or of ruling one out, is known.' },
        { text: 'Can this map of 1,000 countries be coloured with three colours so that neighbours differ?', bucket: 1, why: 'A proposed colouring is quickly checked border by border. No fast way of finding one is known.' },
        { text: 'Can these 1,000 parcels be packed into 20 vans?', bucket: 1, why: 'A proposed packing is quickly checked van by van. No fast way of finding one is known.' },
      ],
      explain: `
        Sorting, searching and shortest routes are in P: fast methods exist. For the round trip, the map colouring and the vans, a proposed answer can be checked fast, which puts them in NP. Fast methods for *finding* an answer are not known.

        "Not known" is the honest wording. Nobody has shown that such methods cannot exist.
      `,
    },
    {
      id: 'np-complete',
      type: 'info',
      title: 'The hardest problems in NP',
      text: `
        In 1971 Stephen Cook proved something remarkable, which Richard Karp extended a year later (Leonid Levin found it independently in the Soviet Union). Many of these stubborn problems are **the same problem in disguise**.

        Some problems in NP have this property: a fast method for that one problem could be converted into a fast method for **every** problem in NP. Such problems are called **NP-complete**. The round-trip question, the map colouring and the van packing are all NP-complete.

        So thousands of problems stand or fall together. One fast algorithm for any NP-complete problem would show that P and NP are the same. In more than fifty years nobody has found one, and nobody has proved that none exists.

        :::note
        P versus NP is one of the seven Millennium Prize Problems chosen by the Clay Mathematics Institute in 2000. A correct solution is worth a million dollars.
        :::
      `,
    },
    {
      id: 'one-falls',
      type: 'choice',
      stretch: true,
      text: `
        Suppose that tomorrow someone publishes a fast method for one NP-complete problem, say the round-trip question.

        **What would follow?**
      `,
      options: [
        { text: 'Every problem in NP would have a fast method: P and NP would be the same', correct: true },
        { text: 'Only the round-trip question would become easy', why: 'NP-complete means more than "hard": a fast method for such a problem can be converted into a fast method for every problem in NP.' },
        { text: 'Nothing: it has been proved that no such method exists', why: 'That has not been proved. Whether such a method exists is exactly the open question.' },
        { text: 'Checking answers would become slow instead', why: 'Checking a proposed answer stays as fast as it always was.' },
      ],
      explain: `
        Because the round-trip question is NP-complete, a fast method for it would turn into fast methods for map colouring, van packing and every other problem in NP. The question "P versus NP" would be answered: they are the same.

        Most researchers expect the opposite, that no such method exists. But expecting is not proving, and so the question stays open.
      `,
    },
    {
      id: 'nearest',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'Good enough, and fast',
      text: `
        Meanwhile the parcels still have to be delivered. In practice people use rules of thumb that are fast and usually decent. The simplest is **nearest neighbour**: from wherever you are, drive to the nearest town you have not visited yet.

        **Carry it out from the depot.** The dashed lines show the distances from the town you are in.
      `,
      widget: { type: 'tour-builder', towns: TOWNS, start: 'A', unit: 'km', mode: 'nearest' },
      check: (s) => s.complete || `${plural(N - s.visited, 'town is', 'towns are')} still open. From ${s.tour[s.tour.length - 1]}, tap the nearest one.`,
      solution: { tour: NEAR.order },
      explain: `
        ${arrow(NEAR.order)}: **${NEAR.length} km**, after six quick decisions instead of ${TRIPS} round trips.

        The best trip is ${BEST.length} km, so this one is about ${Math.round((NEAR.length / BEST.length - 1) * 100)}% longer. It grabbed short legs early and paid for them later: the drive home from ${NEAR.order[N - 1]} alone is ${km(TOWNS, NEAR.order[N - 1], 'A')} km.
      `,
    },
    {
      id: 'teach-heuristic',
      type: 'info',
      title: 'Heuristics',
      text: `
        Nearest neighbour did not find the best trip, but it found a decent one almost at once. A rule like this is called a **heuristic**: quick, usually good, and with no promise of the best answer.

        It is also a **greedy** algorithm, like the cashier's rule in the lesson on greedy choices: it takes what looks best right now and never goes back. The picture shows the price. The short legs come first, and the long drive home comes last.

        Heuristics are what people turn to when trying everything is out of reach.
      `,
      figure: { type: 'tour-builder', mode: 'view', towns: TOWNS, start: 'A', unit: 'km', tour: NEAR.order, alt: `The seven towns with the nearest-neighbour trip ${arrow(NEAR.order)} drawn in. Its legs are ${legsOf(NEAR.order).join(', ')} km long, ${NEAR.length} km in all.` },
    },
    {
      id: 'practice',
      type: 'choice',
      title: 'What people really do',
      text: `
        A courier firm has to plan a round of **80 stops** for tomorrow morning.

        **What is the sensible approach?**
      `,
      options: [
        { text: 'Use heuristics to get a good route quickly, improve it while time allows, and accept that it may not be the very best', correct: true },
        { text: 'Try every possible route: computers are fast', why: 'Already 25 stops would take a billion-trips-a-second computer millions of years. Eighty is far beyond that.' },
        { text: 'Give up: the problem cannot be solved', why: 'Hard is not impossible. A good route is easy to find. Only the *guaranteed best* route is out of reach by trying everything.' },
        { text: 'Wait until P versus NP has been settled', why: 'The vans leave tomorrow. A route that is a few per cent longer than the best is perfectly usable.' },
      ],
      explain: `
        Real planners start from a quick heuristic and then improve the route, for instance by untangling places where it crosses itself. The result is usually within a few per cent of the best possible.

        For many real maps, clever pruning (the idea from the first lesson) even finds a route that is *proved* best. What nobody has is a method that is fast on every map.
      `,
    },
    {
      id: 'careful',
      type: 'multi',
      review: true,
      text: 'Hard problems attract sloppy claims. **Which of these statements are accurate?**',
      options: [
        { text: 'A proposed round trip can be checked quickly against a target length', correct: true },
        { text: 'Nobody has found a fast method for an NP-complete problem, and nobody has proved that there is none', correct: true },
        { text: 'It has been proved that NP-complete problems cannot be solved fast', why: 'That would settle P versus NP. The question is still open.' },
        { text: 'A computer cannot solve NP-complete problems at all', why: 'It can: trying every possibility always works. It only takes too long when the input is large, and small cases are solved every day.' },
        { text: 'NP stands for "not polynomial", so NP problems are the ones outside P', why: 'NP stands for "nondeterministic polynomial time". It is about fast *checking*, and it includes every problem in P.' },
      ],
      explain: `
        The careful version: for NP-complete problems, answers are fast to **check**, no fast way to **find** them is known, and whether one exists is an open question.

        "Cannot be solved fast" and "impossible" both claim more than anyone knows.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Someone tells you: *"The travelling salesman problem is impossible for computers."*

        **Put it right in a few sentences.**
      `,
      model: `
        It is not impossible. A computer can always try every round trip, and for a handful of towns it does so instantly. The trouble is growth: the number of round trips explodes, so trying them all is hopeless beyond a couple of dozen towns.

        Nobody knows a method that is fast on every map, and nobody has proved that none exists: that is the open P versus NP question. A proposed trip is quick to check, though, and in practice heuristics find very good routes fast. So: hard to solve *perfectly*, not impossible.
      `,
    },
  ],
  recap: [
    `The travelling salesman problem: ${N} towns already allow ${TRIPS} round trips, 20 towns about ${group(Math.round(Number(tourCount(20)) / 1e15))} thousand trillion.`,
    '**P**: problems that can be solved fast. **NP**: problems whose answers can be checked fast. Whether these are the same is an open question.',
    '**NP-complete** problems are the hardest in NP: a fast method for one would give a fast method for all of them.',
    'In practice, **heuristics** such as nearest neighbour give good answers fast, without a promise that they are the best.',
  ],
  next: 'That is the end of Algorithms II. You can now back up out of dead ends, tell a safe greedy choice from a trap, trade memory for time, find cheapest routes, file things by hashing, and say honestly where the limits are.',
};
