// Algorithms II · Lesson 4 · The Cheapest Route
import { MAPS, SHOW_MAP, cheapestRoute, dijkstra, fewestRoadRoutes, listAnd, negativeFigure, routeCost } from '../helpers.js';

const TOWNS = MAPS.towns;
const VALLEY = MAPS.valley;
const RUN1 = dijkstra(TOWNS, 'A');
const RUN2 = dijkstra(VALLEY, 'A');
const BEST1 = cheapestRoute(TOWNS, 'A', 'F');
const BFS1 = fewestRoadRoutes(TOWNS, 'A', 'F')[0];
const BEST2 = cheapestRoute(VALLEY, 'A', 'G');
const BFS2 = fewestRoadRoutes(VALLEY, 'A', 'G').map((p) => routeCost(VALLEY, p));

const arrow = (path) => path.join(' → ');
const legs = (map, path) => path.slice(1).map((id, i) => routeCost(map, [path[i], id])).join(' + ');
/** The label improvements of a run, as "E from 9 to 8". */
const improvements = (run) => run.log.flatMap((step) => step.updates.filter((u) => u.better && u.old !== null).map((u) => `${u.to}'s from ${u.old} to ${u.sum}`));

/* The teaching screens. Every number in them is read off a real run, so that the text cannot drift from the maps. */
/** A route to add up by hand: three roads, neither the quickest route nor the one with the fewest roads. */
const SHOW_ROUTE = ['A', 'B', 'D', 'F'];
/** The worked run on the small map P, Q, R, S. */
const SHOW = dijkstra(SHOW_MAP, 'P');
const [SHOW_P, SHOW_Q, SHOW_R] = SHOW.log;
const road = (step, to) => step.updates.find((u) => u.to === to);
/** The moment of the second map at which D is about to be settled: A, C and B are done. */
const SAFE = RUN2.log.find((step) => step.node === 'D');
const SAFE_SETTLED = RUN2.order.slice(0, RUN2.order.indexOf('D'));
const SAFE_OTHERS = Object.keys(SAFE.labels).filter((id) => id !== 'D');
const SAFE_UNREACHED = Object.keys(VALLEY.nodes).filter((id) => !SAFE_SETTLED.includes(id) && !(id in SAFE.labels));

/** Every moment of every run at which the next place to settle is beyond doubt. */
const MOMENTS = [];
for (const [name, map] of Object.entries(MAPS)) {
  for (const start of Object.keys(map.nodes)) {
    const run = dijkstra(map, start);
    for (let k = 2; k < run.log.length - 1; k++) {
      const step = run.log[k];
      const open = Object.keys(step.labels);
      if (step.tied || open.length < 2) continue;
      MOMENTS.push({ name, map, start, settled: run.order.slice(0, k), labels: step.labels, next: step.node, dist: run.dist });
    }
  }
}

/** Pairs of places whose shortest route uses at least two roads. */
const TRIPS = [];
for (const [name, map] of Object.entries(MAPS)) {
  const ids = Object.keys(map.nodes);
  for (const from of ids) {
    const { dist } = dijkstra(map, from);
    for (const to of ids) {
      if (to <= from) continue;
      const path = cheapestRoute(map, from, to);
      if (path.length >= 3) TRIPS.push({ name, map, from, to, path, cost: dist[to] });
    }
  }
}

export default {
  id: 'weighted-paths',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Six towns',
      text: `
        A road map. The number on each road is the driving time in minutes.

        **Find the quickest route from A to F.** Tap the towns one after another.
      `,
      widget: { type: 'dijkstra-map', mode: 'path', ...TOWNS, start: 'A', goal: 'F', unit: 'min' },
      check: (s) => {
        if (!s.reached) return s.roads ? `Your route stops at ${s.path[s.path.length - 1]}. Carry on until it reaches F.` : 'Tap a neighbour of A to start the route.';
        if (s.cost > RUN1.dist.F) return `That route takes ${s.cost} minutes. A quicker one exists. It may use more roads than yours.`;
        return true;
      },
      solution: { path: BEST1 },
      hints: ['Short roads add up slowly. Try going along the top of the map.'],
      explain: `
        ${arrow(BEST1)}: ${legs(TOWNS, BEST1)} = **${RUN1.dist.F} minutes**, on four roads.

        The route with the fewest roads, ${arrow(BFS1)}, takes ${routeCost(TOWNS, BFS1)} minutes.
      `,
    },
    {
      id: 'teach-lengths',
      type: 'info',
      title: 'Roads with numbers',
      text: `
        A road map is a graph: the towns are its nodes and the roads are its edges. In the first course every edge counted the same, one step, and **breadth-first search** (BFS) found the route with the fewest edges.

        Here every road carries a number. The **length of a route** is the sum of the numbers on its roads. The **shortest route** is the one with the smallest sum, however many roads it uses.

        :::example The route in the picture
        ${arrow(SHOW_ROUTE)}: ${legs(TOWNS, SHOW_ROUTE)} = **${routeCost(TOWNS, SHOW_ROUTE)} minutes**, on ${SHOW_ROUTE.length - 1} roads.
        :::
      `,
      figure: { type: 'dijkstra-map', mode: 'view', ...TOWNS, start: 'A', goal: 'F', route: SHOW_ROUTE, alt: `The map of six towns with the route ${SHOW_ROUTE.join(', ')} highlighted. Its roads take ${legs(TOWNS, SHOW_ROUTE).replace(/ \+ (\d+)$/, ' and $1').replace(/ \+ /g, ', ')} minutes.` },
    },
    {
      id: 'bfs-wrong',
      type: 'numeric',
      title: 'What BFS would do',
      text: `
        Breadth-first search, from the first course, finds the route with the **fewest roads**. On this map that is ${arrow(BFS1)}.

        **How many minutes does that route take?**
      `,
      figure: { type: 'dijkstra-map', mode: 'view', ...TOWNS, start: 'A', goal: 'F', route: BFS1, alt: `The map of six towns with the route ${BFS1.join(', ')} highlighted. Its two roads take ${legs(TOWNS, BFS1).replace(' + ', ' and ')} minutes.` },
      answer: routeCost(TOWNS, BFS1),
      unit: 'minutes',
      wrong: [
        [BFS1.length - 1, 'That is the number of roads. Add up the minutes written on them.'],
        [RUN1.dist.F, `That is the quickest route of all. BFS picks ${arrow(BFS1)}: add up its two roads.`],
      ],
      explain: `
        ${legs(TOWNS, BFS1)} = **${routeCost(TOWNS, BFS1)} minutes**: ${routeCost(TOWNS, BFS1) - RUN1.dist.F} more than the quickest route.

        BFS counts roads. It never looks at the numbers written on them, so it cannot know that two roads may take longer than four.
      `,
    },
    {
      id: 'teach-run',
      type: 'info',
      title: 'A method that reads the numbers',
      text: `
        Every place carries a **label**: the best distance from the start found so far. Again and again, **settle** the unsettled place with the smallest label (that label is final), then check the roads out of it.

        :::example From P, closest first
        1. **P** is the start: label 0. Settle it. Its roads give Q the label ${road(SHOW_P, 'Q').sum} and R the label ${road(SHOW_P, 'R').sum}.
        2. Smallest unsettled label: **Q**, ${SHOW_Q.label}. Settle it. To R: ${SHOW_Q.label} + ${road(SHOW_Q, 'R').road} = ${road(SHOW_Q, 'R').sum}, no better than ${road(SHOW_Q, 'R').old}, so R keeps ${road(SHOW_Q, 'R').old}. To S: ${SHOW_Q.label} + ${road(SHOW_Q, 'S').road} = ${road(SHOW_Q, 'S').sum}, the first label of S. *The picture shows this moment.*
        3. Next **R**, ${SHOW_R.label}. To S: ${SHOW_R.label} + ${road(SHOW_R, 'S').road} = ${road(SHOW_R, 'S').sum}. That beats ${road(SHOW_R, 'S').old}, so the label of S drops to ${road(SHOW_R, 'S').sum}.
        4. **S** is last, settled at ${SHOW.dist.S}.
        :::
      `,
      figure: {
        type: 'dijkstra-map', mode: 'view', ...SHOW_MAP, start: 'P', settled: SHOW.order.slice(0, 2), labels: { P: 0, Q: SHOW_Q.label, ...SHOW_R.labels },
        alt: `A map of four places during the run. P and Q are settled, with the labels 0 and ${SHOW_Q.label}. R has the label ${SHOW_R.labels.R} and S has the label ${SHOW_R.labels.S}.`,
      },
    },
    {
      id: 'first-run',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'Closest first',
      text: `
        Your turn, on the six towns. Every town shows its **label**: the best time from A found so far. The sign ∞ means "not reached yet".

        **Again and again, tap the unsettled town with the smallest label.** That *settles* it: its label is final. The map then checks the roads out of it and improves its neighbours' labels where it can.
      `,
      widget: { type: 'dijkstra-map', mode: 'dijkstra', ...TOWNS, start: 'A' },
      check: (s) => s.done || `${s.settled.length} of 6 towns are settled. Keep tapping the unsettled town with the smallest label.`,
      solution: { done: true },
      hints: ['Start by tapping A itself: its label is 0, the smallest there is.'],
      explain: `
        The towns were settled in the order ${RUN1.order.join(', ')}: closest first. On the way, ${listAnd(improvements(RUN1).map((t) => t.replace("'s", "'s label improved")))}, as quicker ways to them turned up.

        F's final label is ${RUN1.dist.F}: the quickest time you found by eye. The thick roads show where each label came from.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Dijkstra\'s algorithm',
      text: `
        What you just carried out is **Dijkstra's algorithm**:

        1. The start gets the label 0. Every other place gets ∞.
        2. **Settle** the unsettled place with the smallest label. That label is now final.
        3. **Update** its neighbours: if *label of the settled place + length of the road* is smaller than a neighbour's label, the neighbour gets the smaller number.
        4. Repeat until every place is settled.

        Like BFS it spreads outwards from the start, but in order of **distance** instead of layer by layer.

        :::note
        The Dutch computer scientist Edsger Dijkstra thought of it in 1956 and published it in 1959. Route planners still build on it.
        :::
      `,
    },
    {
      id: 'update-step',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [u, v] = rng.sample(['B', 'C', 'D', 'E', 'F', 'G', 'H'], 2);
        const d = rng.int(3, 12);
        const w = rng.int(1, 9);
        const sum = d + w;
        const better = w === 1 || rng.bool(0.6);
        const old = better ? sum + rng.int(1, 5) : sum - rng.int(1, Math.min(4, w - 1));
        const improved = old > sum;
        return {
          text: `
            Dijkstra's algorithm has just settled **${u}** with the label **${d}**. A road of length **${w}** leads from ${u} to ${v}. At the moment ${v} is unsettled and has the label **${old}**.

            **What is ${v}'s label after the update?**
          `,
          answer: improved ? sum : old,
          wrong: improved
            ? [
              [old, `The route through ${u} is shorter: ${d} + ${w} = ${sum}, and that is less than ${old}.`],
              [w, `${w} is only the last road. The route through ${u} costs ${u}'s label plus the road: ${d} + ${w}.`],
              [old + w, `Add the road to ${u}'s label, not to ${v}'s old one: ${d} + ${w}.`],
            ]
            : [
              [sum, `${d} + ${w} = ${sum} is not better than ${old}. A label only changes when the new route is shorter.`],
              [w, `${w} is only the last road. The route through ${u} costs ${d} + ${w} = ${sum}, and ${v} already has ${old}.`],
              [old + w, `Nothing is added to ${v}'s label. Compare it with ${d} + ${w} = ${sum} and keep the smaller number.`],
            ],
          hints: [
            `The route through ${u} costs ${u}'s label plus the road. Compare that with the label ${v} already has.`,
            `${d} + ${w} = ${sum}. Is that smaller than ${old}?`,
          ],
          explain: improved
            ? `The route through ${u} costs ${d} + ${w} = ${sum}. That beats ${old}, so ${v}'s label drops to **${sum}**.`
            : `The route through ${u} costs ${d} + ${w} = ${sum}. That is no better than ${old}, so ${v} keeps the label **${old}**.`,
        };
      },
    },
    {
      id: 'second-run',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'Now you do the updates',
      text: `
        A new map, and this time the updating is your job as well.

        **Settle the closest town. Then tap each of its unsettled neighbours** to check the road to it, and watch whether the label improves. Carry on until every town is settled.
      `,
      widget: { type: 'dijkstra-map', mode: 'dijkstra', relax: 'tap', ...VALLEY, start: 'A' },
      check: (s) => s.done || (s.phase === 'update'
        ? `${s.current} is settled, but ${s.pending.length === 1 ? 'one of its roads has' : 'some of its roads have'} not been checked yet. Tap ${s.current}'s unsettled neighbours.`
        : `${s.settled.length} of 7 towns are settled. Tap the unsettled town with the smallest label.`),
      solution: { done: true },
      hints: [
        'Two moves alternate. First: settle the unsettled town with the smallest label. Second: tap every unsettled neighbour of that town.',
        'Tap A to begin. Its neighbours B and C then get their first labels.',
      ],
      explain: `
        Settled in the order ${RUN2.order.join(', ')}. B's first label was 4, straight from A. Then C was settled at 2, and the road from C gave 2 + 1 = 3.

        Labels only ever go down, and only until their town is settled. G ends with ${RUN2.dist.G}.
      `,
    },
    {
      id: 'which-next',
      type: 'interact',
      review: true,
      attempts: 3,
      gen: (rng) => {
        const m = rng.pick(MOMENTS);
        const ids = Object.keys(m.map.nodes);
        const open = ids.filter((id) => !m.settled.includes(id));
        const unreached = open.filter((id) => !(id in m.labels));
        const labelled = open.filter((id) => id in m.labels);
        return {
          text: `
            Dijkstra's algorithm is running from **${m.start}**. The green places with a tick are settled. The numbers are the labels so far, and ∞ means "not reached yet".

            **Tap the place that is settled next.**
          `,
          widget: {
            type: 'dijkstra-map', mode: 'pick', ...m.map, start: m.start, settled: m.settled,
            labels: Object.fromEntries([...m.settled.map((id) => [id, m.dist[id]]), ...labelled.map((id) => [id, m.labels[id]]), ...unreached.map((id) => [id, '∞'])]),
            alt: `A road map during a run of Dijkstra's algorithm from ${m.start}. Settled: ${m.settled.join(', ')}. Labels of the unsettled places: ${labelled.map((id) => `${id} ${m.labels[id]}`).join(', ')}.${unreached.length ? ` Not reached yet: ${unreached.join(', ')}.` : ''}`,
          },
          check: (s) => {
            if (s.picked === m.next) return true;
            if (!s.picked) return 'Tap one of the unsettled places.';
            if (s.picked in m.labels) return `${s.picked}'s label is ${m.labels[s.picked]}. Another unsettled place has a smaller label, and the smallest goes first.`;
            return `${s.picked} has not been reached yet: no settled place has a road to it.`;
          },
          solution: { picked: m.next },
          hints: ['Compare the labels of the places that are not green. Roads do not matter at this moment.'],
          explain: `
            Among the unsettled places, ${labelled.map((id) => `${id} has the label ${m.labels[id]}`).join(', ')}${unreached.length ? `, and ${listAnd(unreached)} ${unreached.length === 1 ? 'has' : 'have'} not been reached` : ''}.

            The smallest label is ${m.labels[m.next]}, so **${m.next}** is settled next.
          `,
        };
      },
    },
    {
      id: 'teach-final',
      type: 'info',
      title: 'Can a settled label be wrong?',
      text: `
        Dijkstra's algorithm declares the smallest unsettled label **final**, although it has looked at only a few routes. Here is why that is safe.

        In the picture ${listAnd(SAFE_SETTLED)} are settled, and D has the smallest unsettled label: ${SAFE.label}. That is the best way into D straight from a settled place. Any other route has to pass through another unsettled place first: ${SAFE_OTHERS.map((id) => `${id} (label ${SAFE.labels[id]})`).join(' or ')}. By then it is already longer than ${SAFE.label}, and every further road only adds to it.

        So nothing can beat ${SAFE.label}. Notice what the argument leans on: **no road has a negative length.**
      `,
      figure: {
        type: 'dijkstra-map', mode: 'view', ...VALLEY, start: 'A', settled: SAFE_SETTLED,
        labels: Object.fromEntries([...SAFE_SETTLED.map((id) => [id, RUN2.dist[id]]), ...Object.entries(SAFE.labels), ...SAFE_UNREACHED.map((id) => [id, '∞'])]),
        alt: `The map of seven towns during a run from A. Settled: ${SAFE_SETTLED.join(', ')}. Labels of the unsettled towns: ${Object.entries(SAFE.labels).map(([id, v]) => `${id} ${v}`).join(', ')}. Not reached yet: ${SAFE_UNREACHED.join(', ')}.`,
      },
    },
    {
      id: 'why-closest',
      type: 'choice',
      title: 'Why the smallest label is safe',
      text: `
        Dijkstra's algorithm declares the smallest unsettled label **final**, although it has looked at only a few routes.

        **Why can no better route to that place turn up later?**
      `,
      options: [
        { text: 'Any other route has to pass through an unsettled place first, whose label is at least as big, and then adds roads that are never negative', correct: true },
        { text: 'Because by then the algorithm has tried every possible route', why: 'It has not, and it does not need to. Most routes are never looked at: that is why the method is fast.' },
        { text: 'Because the place has only one road leading to it', why: 'It may have many roads. What matters is that everything still unsettled is at least as far away.' },
        { text: 'A better route can turn up, and then the label is corrected', why: 'A settled label is never changed. The method relies on it being final.' },
      ],
      explain: `
        Everything still unsettled is at least as far from the start as the place being settled. A route that goes round through one of those places starts out no shorter, and its further roads only add to it.

        That holds as long as **no road has a negative length**.
      `,
    },
    {
      id: 'negative',
      type: 'numeric',
      title: 'The one thing that breaks it',
      text: `
        Imagine a "road" with a negative length: a one-way toll road from C to B that *pays* you 4.

        Dijkstra's algorithm starts at A. It settles B first, with the label 2, because 2 is smaller than 5.

        **What is the true cheapest cost from A to B?**
      `,
      figure: negativeFigure(),
      answer: 1,
      wrong: [
        [2, 'That is the label Dijkstra declared final. Now add up the detour through C.'],
        [9, 'The road from C to B counts as −4, not +4: 5 + (−4).'],
        [-4, 'That is only the last road. The detour costs 5 + (−4).'],
      ],
      hints: ['There are two routes from A to B. Add up the one through C.'],
      explain: `
        A → C → B costs 5 + (−4) = **1**, which beats the "final" label 2.

        With a negative road, a route that looks worse at first can become cheaper later on, so settling the smallest label is no longer safe. Dijkstra's algorithm needs every length to be zero or more. Other, slower algorithms can cope with negative lengths.
      `,
    },
    {
      id: 'read-route',
      type: 'interact',
      attempts: 6,
      title: 'From labels to a route',
      text: `
        Dijkstra's algorithm has finished on this map. Every town shows its shortest distance from A. The labels also tell you the route. Work backwards from G: the route comes in from the neighbour whose label plus its road gives exactly G's label.

        **Trace a shortest route from A to G.**
      `,
      widget: { type: 'dijkstra-map', mode: 'path', ...VALLEY, start: 'A', goal: 'G', labels: true },
      check: (s) => {
        if (!s.reached) return s.roads ? `Your route stops at ${s.path[s.path.length - 1]}. Carry on until it reaches G.` : 'Tap a neighbour of A to start the route.';
        if (s.cost > RUN2.dist.G) return `That route is ${s.cost} long, but G's label says ${RUN2.dist.G} is possible. Work backwards from G: which neighbour's label plus its road gives exactly ${RUN2.dist.G}?`;
        return true;
      },
      solution: { path: BEST2 },
      hints: [
        `Work backwards from G. E has the label ${RUN2.dist.E}, and the road from E to G is 4 long: ${RUN2.dist.E} + 4 = ${RUN2.dist.G}. So the route arrives through E.`,
        `Do the same for E: D's label ${RUN2.dist.D} plus the road of 2 gives ${RUN2.dist.E}. Keep stepping back until you reach A.`,
      ],
      explain: `
        ${arrow(BEST2)}: ${legs(VALLEY, BEST2)} = **${RUN2.dist.G}**. Five roads, and still shorter than both three-road routes, which are ${listAnd(BFS2.slice().sort((a, b) => a - b))} long.

        On a shortest route every label is the label before it plus the road between them. That is how a route is read off the finished labels.
      `,
    },
    {
      id: 'cheapest-cost',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const trip = rng.pick(TRIPS);
        const few = fewestRoadRoutes(trip.map, trip.from, trip.to);
        const fewCosts = [...new Set(few.map((p) => routeCost(trip.map, p)))];
        return {
          text: `
            The numbers on this map are road lengths in km.

            **How long is the shortest route from ${trip.from} to ${trip.to}?**
          `,
          figure: { type: 'dijkstra-map', mode: 'view', ...trip.map, start: trip.from, goal: trip.to, alt: `A road map with ${Object.keys(trip.map.nodes).length} places. Roads and their lengths in km: ${trip.map.edges.map(([a, b, w]) => `${a} to ${b} ${w}`).join(', ')}. ${trip.from} is the start and ${trip.to} is the goal.` },
          answer: trip.cost,
          unit: 'km',
          wrong: fewCosts.filter((c) => c !== trip.cost).map((c) => [c, 'That is how long a route with the fewest roads is. A different route is shorter.']),
          hints: [
            `Spread out from ${trip.from}: settle the closest place, update its neighbours, and repeat until ${trip.to} is settled.`,
            `A shortest route here uses ${trip.path.length - 1} roads.`,
          ],
          explain: `
            ${arrow(trip.path)}: ${legs(trip.map, trip.path)} = **${trip.cost} km**.

            No other route from ${trip.from} to ${trip.to} is shorter.
          `,
        };
      },
    },
    {
      id: 'sort-uses',
      type: 'bucket',
      review: true,
      text: 'Which of these questions can plain breadth-first search answer, and which need an algorithm that adds up lengths, like Dijkstra\'s?',
      buckets: ['BFS is enough', 'Needs lengths'],
      items: [
        { text: 'Fewest stops between two metro stations', bucket: 0, why: 'Every stop counts the same, so counting edges is all that is needed.' },
        { text: 'Fewest clicks from one web page to another', bucket: 0, why: 'Each click is one step. No lengths are involved.' },
        { text: 'Fewest knight moves between two squares of a chessboard', bucket: 0, why: 'Every move counts as one, whatever it looks like on the board.' },
        { text: 'Quickest drive when roads have different travel times', bucket: 1, why: 'A route with more roads can be quicker, so the times have to be added up.' },
        { text: 'Cheapest combination of flights between two cities', bucket: 1, why: 'Tickets cost different amounts. Fewest flights is not the same as cheapest.' },
        { text: 'Shortest walk in metres through a network of paths', bucket: 1, why: 'Paths have different lengths, so counting them is not enough.' },
      ],
      explain: `
        When every step counts the same, the fewest steps *is* the shortest route, and BFS finds it. As soon as steps have different costs (minutes, money, metres), those costs have to be added up, and that is Dijkstra's job.
      `,
    },
    {
      id: 'equal-weights',
      type: 'choice',
      stretch: true,
      text: `
        Suppose every road on a map has the same length, say 1.

        **In what order does Dijkstra's algorithm settle the places?**
      `,
      options: [
        { text: 'Layer by layer: first the start, then its neighbours, then their new neighbours, just like BFS', correct: true },
        { text: 'In alphabetical order', why: 'Names play no part. Only the labels decide, apart from ties between equal labels.' },
        { text: 'In no particular order, because all the labels are equal', why: 'The roads are equal, but the labels are not: a label is the number of roads from the start.' },
        { text: 'It cannot run: it needs roads of different lengths', why: 'Equal lengths are fine. The only thing it cannot handle is a negative length.' },
      ],
      explain: `
        If every road has length 1, a label is simply the number of roads from the start. Settling the smallest label first then means finishing all the places one road away before any place two roads away.

        So BFS is what Dijkstra's algorithm turns into when every road counts the same.
      `,
    },
  ],
  recap: [
    'When roads have different lengths, the route with the fewest roads need not be the shortest. BFS cannot see that.',
    '**Dijkstra\'s algorithm**: settle the unsettled place with the smallest label, update its neighbours, repeat.',
    'A settled label is final, because everything unsettled is at least as far away. That needs lengths of zero or more: a negative length breaks it.',
    'With all lengths equal, Dijkstra\'s algorithm settles places layer by layer, exactly like BFS.',
  ],
  next: 'Next: how to find one item among a million without searching at all.',
};
