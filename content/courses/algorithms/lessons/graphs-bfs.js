// Algorithms · Lesson 6 · Maps and Shortest Paths
import { plural } from '../../../kit.js';
import { GRAPHS, QUEUE_GRAPH, bfs, graphPartsFigure, layers, listAnd, neighbours, queueTrace, roadsFigure, shortestPath } from '../helpers.js';

const FRIENDS = GRAPHS.friends;
const METRO = GRAPHS.metro;

/** The worked queue example: BFS from J on a graph of its own, written out row by row. */
const QUEUE_START = 'J';
const QUEUE_ROWS = queueTrace(QUEUE_GRAPH, QUEUE_START);
const QUEUE_LAYERS = layers(QUEUE_GRAPH, QUEUE_START);
/** The neighbour that the third node explored meets again, although it is already in the queue. */
const QUEUE_TWICE = neighbours(QUEUE_GRAPH)[QUEUE_ROWS[3].explored].find((v) => QUEUE_ROWS[2].found.includes(v));

/** Feedback for "select exactly these nodes" tasks. `dist` maps node -> steps from `start`. */
function judgeLayer(selected, want, dist, start, steps) {
  const extra = selected.filter((id) => !want.includes(id));
  if (extra.length) {
    const x = extra[0];
    if (dist[x] < steps) return `${x} is only ${plural(dist[x], 'step')} from ${start}: it has an edge ${dist[x] === 1 ? `straight to ${start}` : 'to an earlier layer'}.`;
    return `${x} is ${dist[x]} steps from ${start}. No route with only ${plural(steps, 'edge')} reaches it.`;
  }
  const missing = want.filter((id) => !selected.includes(id));
  if (missing.length) {
    if (!selected.length) return `Tap the nodes that are exactly ${plural(steps, 'step')} from ${start}.`;
    return `Right so far, but ${missing.length === 1 ? 'one more node belongs' : 'more nodes belong'} here. Check every edge that leaves the layer before.`;
  }
  return true;
}

export default {
  id: 'graphs-bfs',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'Pass it on',
      text: `
        Eight people. A line joins two people who know each other, and a message can only be handed between people who know each other.

        **What is the smallest number of hand-overs that gets a message from A to H?**
      `,
      figure: { type: 'graph-walk', mode: 'view', ...FRIENDS, start: 'A', goal: 'H', alt: 'Eight people, A to H, drawn as dots. Lines join the pairs who know each other.' },
      options: [
        { text: '2', why: 'Nobody who knows A also knows H, so two hand-overs cannot be enough.' },
        { text: '3', correct: true },
        { text: '4', why: 'A route with four hand-overs exists, but there is a shorter one through F.' },
        { text: '5' },
      ],
      explain: `
        Three: A → B → F → H. You probably found it by looking.

        That stops working quickly. Among millions of people nobody can find the shortest chain by looking. This lesson builds a method that can.
      `,
    },
    {
      id: 'teach-graph',
      type: 'info',
      title: 'Graphs: nodes and edges',
      text: `
        A picture like the one you just saw is called a **graph**. The dots are **nodes** and the lines are **edges**. Two nodes joined by an edge are **neighbours**.

        A **route** goes from node to node along edges, and every edge on the way counts as one **step**. In the small graph here, P and R are not neighbours. The shortest route between them is P → Q → R: two edges, so two steps.

        Friendships, road maps, and web pages with the links between them are all graphs.
      `,
      figure: graphPartsFigure(),
    },
    {
      id: 'layer-one',
      type: 'interact',
      attempts: 5,
      title: 'One step at a time',
      text: 'Start with the easy part. **Tap every node that is exactly one step from A.**',
      widget: { type: 'graph-walk', mode: 'select', ...FRIENDS, start: 'A' },
      check: (s) => judgeLayer(s.selected, ['B', 'C'], bfs(FRIENDS, 'A').dist, 'A', 1),
      solution: { selected: ['B', 'C'] },
      hints: ['One step means one edge. Follow each line that starts at A.'],
      explain: 'B and C: the nodes that share an edge with A. Call them **layer 1**.',
    },
    {
      id: 'layer-two',
      type: 'interact',
      attempts: 5,
      text: `
        Layer 1 is coloured in. Now **tap every node that is exactly two steps from A**: the new nodes you can reach by one more edge from layer 1.
      `,
      widget: { type: 'graph-walk', mode: 'select', ...FRIENDS, start: 'A', showDist: 1 },
      check: (s) => judgeLayer(s.selected, ['D', 'E', 'F'], bfs(FRIENDS, 'A').dist, 'A', 2),
      solution: { selected: ['D', 'E', 'F'] },
      hints: [
        'Look at every edge that leaves B, and every edge that leaves C.',
        'From B you can reach D and F. What can you reach from C?',
      ],
      explain: `
        D, E and F. You never had to think about whole routes. You only looked **one edge beyond** the layer you already had.

        Keep going like this and every node gets its distance from A.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Breadth-first search',
      text: `
        Exploring layer by layer is called **breadth-first search**, or **BFS**:

        1. The start node is layer 0.
        2. Its neighbours are layer 1.
        3. The *new* neighbours of layer 1 are layer 2.
        4. Carry on until nothing new turns up.

        Each layer is finished before the next one begins, so the number of a node's layer is its distance from the start.

        A computer does not see layers. It keeps a **queue**, a waiting line. Each newly found node joins the back of the line, and the node at the front is the next one whose neighbours get explored.
      `,
      figure: {
        type: 'graph-walk', mode: 'view', ...FRIENDS, start: 'A', showDist: true,
        alt: 'The same graph with every node labelled by its distance from A: B and C are 1 step away, D, E and F are 2, and G and H are 3.',
        caption: 'Every node with its distance from A. Each colour is one layer.',
      },
    },
    {
      id: 'run-bfs',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Be the search',
      text: `
        A new graph. Run BFS from **A**. The node with the dashed ring is being explored: **tap each of its neighbours that has not been found yet.**

        The queue under the graph shows who is waiting.
      `,
      widget: { type: 'graph-walk', mode: 'bfs', ...METRO, start: 'A' },
      check: (s) => s.done || 'Keep going until the queue is empty and every node has a number.',
      solution: { done: true },
      hints: [
        'Only nodes that are still white can be found, and only if an edge joins them to the ringed node.',
        'When the ringed node has no white neighbours left, the ring moves on by itself to the next node in the queue.',
      ],
      explain: `
        Every node now carries its distance from A: the number of the layer in which BFS first reached it.

        The thick edges show *how* each node was first reached. Follow them backwards from any node and you have a shortest route to A.
      `,
    },
    {
      id: 'read-path',
      type: 'interact',
      attempts: 6,
      title: 'Read off a route',
      text: 'BFS has numbered this graph with distances from A. **Tap a shortest route from A to I**, one node after another.',
      widget: { type: 'graph-walk', mode: 'path', ...METRO, start: 'A', goal: 'I', showDist: true },
      check: (s) => {
        if (!s.reached) return s.length ? `Your route stops at ${s.path[s.path.length - 1]}. Carry on until it reaches I.` : 'Tap a neighbour of A to start the route.';
        if (s.length > 4) return `That route arrives, but it takes ${s.length} steps. I is only 4 steps from A: move one layer further with every step.`;
        return true;
      },
      solution: { path: ['A', 'B', 'D', 'G', 'I'] },
      hints: ['A shortest route never stays in a layer and never goes back: 0, then 1, then 2, then 3, then 4.'],
      explain: `
        Any route that climbs exactly one layer with every step is a shortest route: 0 → 1 → 2 → 3 → 4.

        There are several of them here, and all are 4 steps long. BFS promises the smallest number of steps, not a unique route.
      `,
    },
    {
      id: 'distance',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const graph = GRAPHS[rng.pick(Object.keys(GRAPHS))];
        const ids = Object.keys(graph.nodes);
        const from = rng.pick(ids);
        const { dist } = bfs(graph, from);
        // routes of 3 or more steps are twice as likely to be asked about
        const pool = ids.flatMap((id) => (dist[id] >= 3 ? [id, id] : dist[id] === 2 ? [id] : []));
        const to = rng.pick(pool);
        const d = dist[to];
        const path = shortestPath(graph, from, to);
        const rings = layers(graph, from);
        return {
          text: `What is the **smallest number of steps** (edges) on a route from **${from}** to **${to}**?`,
          figure: { type: 'graph-walk', mode: 'view', ...graph, start: from, goal: to, alt: `A graph with ${ids.length} nodes. ${from} is marked as the start and ${to} as the goal.` },
          answer: d,
          unit: 'steps',
          wrong: [
            [d + 1, 'One too many. Either there is a shorter route, or you counted the nodes on the route instead of the steps between them.'],
            [d - 1, `No route is that short. Go layer by layer from ${from} and see when ${to} first turns up.`],
          ],
          hints: [
            `Work in layers. Layer 1: the neighbours of ${from}. Layer 2: their new neighbours. And so on.`,
            `Layer 1 is ${listAnd(rings[1])}.`,
          ],
          explain: `
            Layer by layer from ${from}: ${rings.slice(1).map((ring, i) => `${plural(i + 1, 'step')}: ${ring.join(', ')}`).join('; ')}.

            ${to} first turns up after **${d} steps**. One shortest route is ${path.join(' → ')}.
          `,
        };
      },
    },
    {
      id: 'two-away',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const cases = [];
        for (const name of Object.keys(GRAPHS)) {
          for (const id of Object.keys(GRAPHS[name].nodes)) {
            const rings = layers(GRAPHS[name], id);
            if (rings[2] && rings[2].length >= 2 && rings[2].length <= 4) cases.push({ graph: GRAPHS[name], start: id, rings });
          }
        }
        const { graph, start, rings } = rng.pick(cases);
        const { dist } = bfs(graph, start);
        const want = rings[2];
        return {
          text: `**Tap every node that is exactly 2 steps from ${start}.** (Two steps by the shortest route: a neighbour of ${start} does not count.)`,
          widget: { type: 'graph-walk', mode: 'select', ...graph, start },
          check: (s) => judgeLayer(s.selected, want, dist, start, 2),
          solution: { selected: want },
          hints: [
            `First find layer 1: the nodes joined to ${start} by a single edge.`,
            `Layer 1 is ${listAnd(rings[1])}. Layer 2 is whatever you can reach from them by one more edge, leaving out ${start} and layer 1 itself.`,
          ],
          explain: `
            Layer 1, the neighbours of ${start}: ${listAnd(rings[1])}.

            One more edge from there reaches **${listAnd(want)}**. Those are the nodes exactly 2 steps away.
          `,
        };
      },
    },
    {
      id: 'why-shortest',
      type: 'choice',
      text: `
        BFS meets node T for the first time while it is exploring a node of layer 3, so it gives T the distance 4.

        **How can we be sure that no route to T has fewer than 4 steps?**
      `,
      options: [
        { text: 'A shorter route would have put T into an earlier layer, and BFS finished those layers first', correct: true },
        { text: 'BFS tries the longest routes first', why: 'The opposite: it spreads outwards from the start, so short routes are found before long ones.' },
        { text: 'T has only one edge', why: 'T may have many edges. What matters is which layer its neighbours are in.' },
        { text: 'We cannot be sure; BFS only finds *a* route', why: 'BFS does better than that: the first time it reaches a node is always along a shortest route.' },
      ],
      explain: `
        If T could be reached in 3 steps, one of its neighbours would be in layer 2, and T would have been found while layer 2 was being explored.

        BFS finishes each layer before it starts the next, so the first time it meets a node is always by a shortest route.
      `,
    },
    {
      id: 'teach-queue',
      type: 'info',
      title: 'First in, first out',
      text: `
        The **queue** works like the line at a counter: **first in, first out**. BFS takes the node at the *front*, explores it, and puts each newly found node at the *back*. Here is BFS from ${QUEUE_START} on the graph in the picture:

        | Explore | New nodes | Queue afterwards |
        |:-:|:-:|:--|
        ${QUEUE_ROWS.slice(0, 4).map((row) => `| ${row.explored || 'start'} | ${row.found.join(', ')} | ${row.queue.join(', ')} |`).join('\n        ')}

        ${QUEUE_ROWS[3].explored} was found before ${listAnd(QUEUE_ROWS[2].found)}, so it is explored before them. That is how a layer gets finished before the next one starts. And no node joins the queue twice: when ${QUEUE_ROWS[3].explored} is explored, ${QUEUE_TWICE} has already been found.
      `,
      figure: {
        type: 'graph-walk', mode: 'view', ...QUEUE_GRAPH, start: QUEUE_START, showDist: true, height: 220,
        alt: `A graph with six nodes. ${QUEUE_START} is the start. ${listAnd(QUEUE_LAYERS[1])} are 1 step away, and ${listAnd(QUEUE_LAYERS[2])} are 2 steps away.`,
        caption: `Every node with its distance from ${QUEUE_START}.`,
      },
    },
    {
      id: 'queue-trace',
      type: 'choice',
      text: `
        BFS is running. Its queue holds **C, D, E**, with C at the front. It explores C and finds two new nodes, F and G.

        **What does the queue hold now?**
      `,
      options: [
        { text: 'D, E, F, G', correct: true },
        { text: 'F, G, D, E', why: 'New nodes join the *back* of the line. Putting them at the front would send the search racing down one path before the layer is finished.' },
        { text: 'C, D, E, F, G', why: 'C has been explored, so it leaves the queue.' },
        { text: 'F, G', why: 'D and E were found earlier and are still waiting for their turn.' },
      ],
      explain: `
        C leaves from the front; F and G join at the back: **D, E, F, G**.

        First in, first out. That simple rule is what keeps the layers in order: D and E were found before F and G, so they cannot belong to a later layer, and they are explored first.
      `,
    },
    {
      id: 'recipe',
      type: 'order',
      code: 'pseudo',
      stretch: true,
      title: 'BFS for a machine',
      text: `
        Here is breadth-first search in five lines. A "new" neighbour is one that has not been found yet, and "while" repeats its indented lines for as long as its test is true.

        **Put the lines in order.**
      `,
      items: [
        'put start in the queue',
        'while queue is not empty:',
        '  take the front node',
        '  for each new neighbour:',
        '    add it to the back',
      ],
      hints: [
        'The queue must hold something before the loop can begin.',
        'Inside the loop: first take a node out, then look at its neighbours.',
      ],
      explain: `
        Take from the front, add to the back, stop when the queue is empty. Every node enters the queue once, and every edge is looked at from each of its two ends.

        So the work grows in proportion to the size of the graph: nodes plus edges.
      `,
    },
    {
      id: 'weights',
      type: 'choice',
      title: 'What BFS does not know',
      text: `
        Two ways to drive from town A to town B. BFS counts **edges**, so it picks the single long road.

        **Which way is actually shorter in kilometres?**
      `,
      figure: roadsFigure(),
      options: [
        { text: 'The single road: 1 edge, 12 km', why: 'It has the fewest edges. But 12 km is more than 3 + 4 = 7 km.' },
        { text: 'Through C: 2 edges, 7 km', correct: true },
        { text: 'Both are the same length', why: 'Add up the distances: 12 km one way, 3 + 4 = 7 km the other.' },
      ],
      explain: `
        12 km against 3 + 4 = 7 km: the way through C is shorter, although it has more edges.

        BFS would still pick the single road, because it counts one edge against two and knows nothing about kilometres.
      `,
    },
    {
      id: 'teach-fewest',
      type: 'info',
      title: 'Fewest edges, not shortest distance',
      text: `
        BFS finds the route with the **fewest edges**. That is the shortest route only when every edge counts the same: one hand-over between friends, one move in a board game, one hop from one computer to the next.

        When edges have different lengths or costs, like the kilometres on these roads, the fewest edges need not be the best route. Then you need a method that adds the lengths up, such as **Dijkstra's algorithm**. It also spreads outwards from the start, but in order of distance instead of layer by layer.
      `,
      figure: { ...roadsFigure(), caption: 'Fewest edges: the single road, 12 km. Shortest distance: through C, 7 km.' },
    },
    {
      id: 'uses',
      type: 'multi',
      review: true,
      text: 'Which of these questions can plain BFS answer directly?',
      options: [
        { text: 'The fewest clicks needed to get from one web page to another', correct: true },
        { text: 'The fewest introductions needed to reach a stranger through friends of friends', correct: true },
        { text: 'The fewest stops between two stations on a metro map', correct: true },
        { text: 'The fastest route by car when roads have different speed limits', why: 'Here the edges cost different amounts of time. BFS treats every edge as one step.' },
        { text: 'The cheapest combination of flights between two cities', why: 'Ticket prices differ from flight to flight. BFS would only find the route with the fewest flights.' },
      ],
      explain: `
        Clicks, introductions and stops all count **edges**, and each edge counts once. That is exactly what BFS measures.

        Driving times and ticket prices put a different cost on every edge, and BFS knows nothing about costs.
      `,
    },
  ],
  recap: [
    'A **graph** is a set of nodes joined by edges: people and friendships, towns and roads, pages and links.',
    '**Breadth-first search** explores in layers: the start, its neighbours, their new neighbours, and so on.',
    'A **queue** (first in, first out) keeps the layers in order.',
    'BFS finds the route with the **fewest edges**. With edges of different lengths, you need a different algorithm.',
  ],
  next: 'That is the end of the course. You can now read an algorithm, run it by hand, and say how its work grows.',
};
