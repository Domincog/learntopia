/**
 * Helpers for Algorithms II: the algorithms of the course as small pure
 * functions, so that every count quoted in a lesson is computed and not
 * typed, plus the data (boards, timetables, maps, word lists) the lessons
 * share and a few builders for static figures.
 *
 * The course test (tests/algorithms-2-course.test.mjs) re-derives all of this
 * with its own, differently written code.
 */

/* ------------------------------------------------------------------ text */

/** 1234567 -> "1,234,567" (for running text). Accepts numbers and BigInts. */
export const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** 1234567 -> "1{,}234{,}567" (inside $…$, where a bare comma would get a space after it). */
export const groupTex = (n) => group(n).replace(/,/g, '{,}');
/** ['a', 'b', 'c'] -> "a, b and c" */
export const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
/** ['a', 'b', 'c'] -> "a, b or c" */
export const listOr = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`);

/* ------------------------------------------------- lesson 1: backtracking */

/** May a queen go on (row, col), given queens[r] = column of the queen in each earlier row r? */
export function queenSafe(queens, row, col) {
  for (let r = 0; r < row; r++) {
    if (queens[r] === col || Math.abs(queens[r] - col) === row - r) return false;
  }
  return true;
}

/** The columns of the next row that no queen placed so far attacks. */
export function safeColumns(queens, n) {
  const out = [];
  for (let c = 0; c < n; c++) if (queenSafe(queens, queens.length, c)) out.push(c);
  return out;
}

/**
 * The whole backtracking tree for n queens, one row at a time.
 * nodes: partial boards with at least one queen and no attack (the boards a search visits);
 * solutions: full boards; deadEnds: boards whose next row has no safe square.
 */
export function queensSearch(n) {
  let nodes = 0;
  let solutions = 0;
  let deadEnds = 0;
  const perLevel = new Array(n + 1).fill(0);
  const grow = (queens) => {
    if (queens.length === n) { solutions++; return; }
    const cols = safeColumns(queens, n);
    if (!cols.length) deadEnds++;
    for (const c of cols) { nodes++; perLevel[queens.length + 1]++; grow([...queens, c]); }
  };
  grow([]);
  return { nodes, solutions, deadEnds, perLevel };
}

/** Backtracking that always tries the leftmost square first, until the first solution. */
export function queensFirst(n) {
  let puts = 0;
  let backs = 0;
  let found = null;
  const grow = (queens) => {
    if (queens.length === n) { found = queens; return true; }
    for (const c of safeColumns(queens, n)) {
      puts++;
      if (grow([...queens, c])) return true;
      backs++;
    }
    return false;
  };
  grow([]);
  return { puts, backs, found };
}

/** The 4-queens search tree as nested nodes: { queens, kids, dead, solved }. */
export function queensTree(n) {
  const build = (queens) => {
    const kids = queens.length === n ? [] : safeColumns(queens, n).map((c) => build([...queens, c]));
    return { queens, kids, solved: queens.length === n, dead: queens.length < n && !kids.length };
  };
  return build([]);
}

/**
 * The search tree for 4 queens as a picture: every board backtracking can
 * pass through, dead ends crossed, the two solutions ticked.
 */
export function queensTreeFigure() {
  const n = 4;
  const root = queensTree(n);
  const cell = 12;
  const board = n * cell;
  const rowGap = 76;
  const top = 4;
  const left = 54;
  const leaves = [];
  const collect = (node) => { if (!node.kids.length) leaves.push(node); node.kids.forEach(collect); };
  collect(root);
  const width = 560;
  const slot = (width - left - board - 8) / (leaves.length - 1);
  leaves.forEach((leaf, i) => { leaf.x = left + board / 2 + 4 + i * slot; });
  const place = (node) => {
    node.kids.forEach(place);
    if (node.kids.length) node.x = (node.kids[0].x + node.kids[node.kids.length - 1].x) / 2;
    node.y = top + node.queens.length * rowGap;
  };
  place(root);
  let lines = '';
  let boards = '';
  const draw = (node) => {
    const x0 = node.x - board / 2;
    for (const kid of node.kids) {
      lines += `<path class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" d="M${node.x.toFixed(1)} ${node.y + board + 2} L${kid.x.toFixed(1)} ${kid.y - 2}"/>`;
    }
    const frame = node.solved ? 'stroke-green' : node.dead ? 'stroke-red' : 'stroke-ink';
    boards += `<rect class="${node.solved ? 'fill-green-soft' : node.dead ? 'fill-red-soft' : 'fill-surface'} ${frame}" stroke-width="${node.solved || node.dead ? 3.5 : 2.5}" x="${x0.toFixed(1)}" y="${node.y}" width="${board}" height="${board}" rx="4"/>`;
    for (let k = 1; k < n; k++) {
      boards += `<path class="stroke-ink-3 fill-none" stroke-width="1" opacity="0.5" d="M${(x0 + k * cell).toFixed(1)} ${node.y} v${board} M${x0.toFixed(1)} ${node.y + k * cell} h${board}"/>`;
    }
    node.queens.forEach((c, r) => {
      boards += `<circle class="fill-violet stroke-ink" stroke-width="1.5" cx="${(x0 + (c + 0.5) * cell).toFixed(1)}" cy="${node.y + (r + 0.5) * cell}" r="4.2"/>`;
    });
    if (node.dead) {
      const cy = node.y + board + 13;
      boards += `<path class="stroke-red fill-none" stroke-width="3.5" stroke-linecap="round" d="M${node.x - 6} ${cy - 6} l12 12 M${node.x + 6} ${cy - 6} l-12 12"/>`;
    }
    if (node.solved) {
      const cy = node.y + board + 13;
      boards += `<path class="stroke-green fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M${node.x - 8} ${cy} l6 6 l11 -13"/>`;
    }
    node.kids.forEach(draw);
  };
  draw(root);
  let labels = `<text class="fig-label text-muted" x="2" y="${top + board / 2 + 5}">empty</text>`;
  for (let level = 1; level <= n; level++) {
    labels += `<text class="fig-label text-muted" x="2" y="${top + level * rowGap + board / 2 + 5}">row ${level}</text>`;
  }
  const stats = queensSearch(n);
  return {
    type: 'svg', viewBox: `0 0 ${width} ${top + n * rowGap + board + 26}`, maxWidth: 560, content: lines + boards + labels,
    alt: `A tree of small 4 by 4 boards. The empty board is at the top. Under it are the ${stats.perLevel[1]} ways to place the first queen, then ${stats.perLevel[2]} boards with two queens, ${stats.perLevel[3]} with three and ${stats.perLevel[4]} with four. ${stats.deadEnds} boards are dead ends, marked with a cross, and the ${stats.solutions} boards at the bottom are solutions, marked with a tick.`,
  };
}

/** How a square is named for the learner: rows and columns are counted from 1. */
export const squareName = (row, col) => `row ${row + 1}, column ${col + 1}`;

/** Subset sum by backtracking, deciding the items in order, "take" before "skip", until the first hit. */
export function subsetFirst(items, target) {
  let steps = 0;
  let backs = 0;
  let found = null;
  const path = [];
  const go = (i, total) => {
    if (total === target) { found = path.join(''); return true; }
    if (total > target || i === items.length) return false;
    for (const choice of ['T', 'S']) {
      steps++;
      path.push(choice);
      if (go(i + 1, total + (choice === 'T' ? items[i] : 0))) return true;
      path.pop();
      backs++;
    }
    return false;
  };
  go(0, 0);
  return { steps, backs, found };
}

/** Every subset of `items` (as a list of the chosen numbers) that adds up to `target`. */
export function subsetsWithSum(items, target) {
  const out = [];
  for (let mask = 0; mask < 2 ** items.length; mask++) {
    const chosen = items.filter((_, i) => Math.floor(mask / 2 ** i) % 2 === 1);
    if (chosen.reduce((a, b) => a + b, 0) === target) out.push(chosen);
  }
  return out;
}

export const PARCELS = { items: [9, 7, 5, 4, 2], target: 15 };

/* ------------------------------------------------------- lesson 2: greedy */

/** Greedy change: again and again the biggest coin that still fits. Returns the coins handed over. */
export function greedyChange(coins, amount) {
  const sorted = coins.slice().sort((a, b) => b - a);
  const out = [];
  let left = amount;
  for (const coin of sorted) {
    while (coin <= left) { out.push(coin); left -= coin; }
  }
  return left === 0 ? out : null;
}

/** table[a] = the fewest coins that make the amount a (Infinity when it cannot be made), for a = 0 … amount. */
export function minCoinsTable(coins, amount) {
  const table = [0];
  for (let a = 1; a <= amount; a++) {
    let best = Infinity;
    for (const coin of coins) if (coin <= a && table[a - coin] + 1 < best) best = table[a - coin] + 1;
    table.push(best);
  }
  return table;
}

/** One way of paying `amount` with the fewest coins (largest coins first). */
export function bestChange(coins, amount) {
  const table = minCoinsTable(coins, amount);
  if (!Number.isFinite(table[amount])) return null;
  const sorted = coins.slice().sort((a, b) => b - a);
  const out = [];
  let left = amount;
  while (left > 0) {
    const coin = sorted.find((c) => c <= left && table[left - c] === table[left] - 1);
    out.push(coin);
    left -= coin;
  }
  return out;
}

/** The smallest amount for which greedy change uses more coins than necessary (null if none up to `limit`). */
export function firstGreedyFailure(coins, limit = 200) {
  const table = minCoinsTable(coins, limit);
  for (let a = 1; a <= limit; a++) if (greedyChange(coins, a).length > table[a]) return a;
  return null;
}

/**
 * The timetable of the lesson: eight requests for one room. Times are hours
 * of the day (12.5 = 12:30). Chosen so that the three rules give three
 * different results and no rule ever has to break a tie.
 */
export const MEETINGS = [
  { id: 'A', start: 12, end: 12.5 },
  { id: 'B', start: 13.5, end: 17 },
  { id: 'C', start: 15.5, end: 17.5 },
  { id: 'D', start: 11, end: 12 },
  { id: 'E', start: 10, end: 13 },
  { id: 'F', start: 12.5, end: 15 },
  { id: 'G', start: 9.5, end: 14 },
  { id: 'H', start: 14.5, end: 16 },
];

export const overlaps = (a, b) => a.start < b.end && b.start < a.end;

const RULE_KEY = {
  shortest: (m) => m.end - m.start,
  start: (m) => m.start,
  finish: (m) => m.end,
};
export const RULE_NAME = { shortest: 'Shortest first', start: 'Earliest start first', finish: 'Earliest finish first' };

/** Run a greedy rule on a timetable: keep booking the best-ranked meeting that still fits. Returns the meetings booked, in order. */
export function runRule(meetings, rule) {
  const key = RULE_KEY[rule];
  const booked = [];
  for (;;) {
    const free = meetings.filter((m) => !booked.includes(m) && booked.every((b) => !overlaps(b, m)));
    if (!free.length) return booked;
    booked.push(free.reduce((best, m) => (key(m) < key(best) ? m : best)));
  }
}

/** The largest number of meetings that fit without overlap (earliest finish first is provably optimal). */
export const maxMeetings = (meetings) => runRule(meetings, 'finish').length;

/** 12.5 -> "12:30" */
export const clock = (t) => `${Math.floor(t)}:${String(Math.round((t - Math.floor(t)) * 60)).padStart(2, '0')}`;

/** A random timetable of `n` requests on a half-hour grid between 9:00 and 17:00, with distinct finishing times. */
export function randomTimetable(rng, n = 6) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const meetings = [];
    const ends = new Set();
    let guard = 0;
    while (meetings.length < n && guard++ < 200) {
      const length = rng.pick([1, 1, 2, 2, 3, 4, 5, 6]) / 2;
      const start = 9 + rng.int(0, Math.round((8 - length) * 2)) / 2;
      const end = start + length;
      if (ends.has(end) || meetings.some((m) => m.start === start && m.end === end)) continue;
      ends.add(end);
      meetings.push({ id: 'ABCDEFGH'[meetings.length], start, end });
    }
    if (meetings.length < n) continue;
    const best = maxMeetings(meetings);
    const naive = Math.min(runRule(meetings, 'shortest').length, runRule(meetings, 'start').length);
    if (best >= 3 && best <= 4 && naive < best) return meetings;
  }
  throw new Error('randomTimetable: no timetable found');
}

/* ------------------------------------------- lesson 3: dynamic programming */

/** Fibonacci numbers with fib(1) = fib(2) = 1. */
export function fib(n) {
  let a = 1;
  let b = 1;
  for (let i = 3; i <= n; i++) { const c = a + b; a = b; b = c; }
  return b;
}

/** How many times the recipe "fib(n) = fib(n-1) + fib(n-2)" is called to work out fib(n) with no memory. */
export function fibCalls(n) {
  if (n <= 2) return 1;
  let a = 1;
  let b = 1;
  for (let i = 3; i <= n; i++) { const c = a + b + 1; a = b; b = c; }
  return b;
}

/** How often fib(k) is worked out inside the call tree of fib(n). */
export function fibRepeats(n, k) {
  if (n === k) return 1;
  if (n <= 2) return 0;
  return fibRepeats(n - 1, k) + fibRepeats(n - 2, k);
}

/** The call tree of fib(n) as a picture. Calls with the same argument share a colour. */
export function fibTreeFigure(n) {
  const HUE = { 1: 'gray', 2: 'orange', 3: 'blue', 4: 'green', 5: 'violet', 6: 'pink', 7: 'teal' };
  const build = (k, depth) => ({ k, depth, kids: k <= 2 ? [] : [build(k - 1, depth + 1), build(k - 2, depth + 1)] });
  const root = build(n, 0);
  const leaves = [];
  let deepest = 0;
  const collect = (node) => { deepest = Math.max(deepest, node.depth); if (!node.kids.length) leaves.push(node); node.kids.forEach(collect); };
  collect(root);
  const R = 15;
  const slot = 44;
  const rowGap = 52;
  const width = (leaves.length - 1) * slot + 2 * R + 12;
  leaves.forEach((leaf, i) => { leaf.x = R + 6 + i * slot; });
  const place = (node) => { node.kids.forEach(place); if (node.kids.length) node.x = (node.kids[0].x + node.kids[1].x) / 2; node.y = R + 6 + node.depth * rowGap; };
  place(root);
  let lines = '';
  let discs = '';
  let count = 0;
  const draw = (node) => {
    count++;
    for (const kid of node.kids) lines += `<path class="stroke-ink-3 fill-none" stroke-width="2.5" stroke-linecap="round" d="M${node.x.toFixed(1)} ${node.y} L${kid.x.toFixed(1)} ${kid.y}"/>`;
    discs += `<circle class="fill-${HUE[node.k] || 'yellow'}${node.k === n ? '' : '-soft'} stroke-ink" stroke-width="2.5" cx="${node.x.toFixed(1)}" cy="${node.y}" r="${R}"/>`;
    discs += `<text class="fig-label" x="${node.x.toFixed(1)}" y="${node.y + 5}" text-anchor="middle">${node.k}</text>`;
    node.kids.forEach(draw);
  };
  draw(root);
  const repeats = [];
  for (let k = n - 1; k >= 1; k--) repeats.push(`fib(${k}) ${fibRepeats(n, k) === 1 ? 'once' : `${fibRepeats(n, k)} times`}`);
  return {
    type: 'svg', viewBox: `0 0 ${width} ${2 * R + 12 + deepest * rowGap}`, maxWidth: 520, content: lines + discs,
    alt: `The call tree of fib(${n}): ${count} circles, each labelled with the number whose Fibonacci number is being worked out. The circle ${n} at the top splits into ${n - 1} and ${n - 2}, and so on down to 2 and 1. In the whole tree, ${listAnd(repeats)} appears.`,
  };
}

/**
 * Routes through a grid of cells from the top-left cell, moving only right or down.
 * Returns table[r][c] = number of routes to that cell (0 for a closed cell).
 */
export function gridPaths(rows, cols, closed = []) {
  const shut = new Set(closed.map(([r, c]) => `${r},${c}`));
  const table = [];
  for (let r = 0; r < rows; r++) {
    table.push([]);
    for (let c = 0; c < cols; c++) {
      if (shut.has(`${r},${c}`)) table[r].push(0);
      else if (r === 0 && c === 0) table[r].push(1);
      else table[r].push((r > 0 ? table[r - 1][c] : 0) + (c > 0 ? table[r][c - 1] : 0));
    }
  }
  return table;
}

/* --------------------------------------------- lesson 4: weighted shortest paths */

/** The maps of the lesson. Node positions are for a 560 × 300 picture; an edge is [from, to, minutes]. */
export const MAPS = {
  towns: {
    nodes: { A: [56, 150], B: [180, 56], C: [336, 56], D: [250, 236], E: [440, 150], F: [512, 256] },
    edges: [['A', 'B', 2], ['A', 'D', 4], ['B', 'C', 4], ['B', 'D', 3], ['C', 'E', 2], ['D', 'E', 5], ['D', 'F', 9], ['E', 'F', 3]],
  },
  valley: {
    nodes: { A: [50, 150], B: [165, 52], C: [165, 248], D: [290, 150], E: [405, 52], F: [405, 248], G: [512, 150] },
    edges: [['A', 'B', 4], ['A', 'C', 2], ['B', 'C', 1], ['B', 'D', 5], ['B', 'E', 9], ['C', 'D', 8, 0.62], ['C', 'F', 11], ['D', 'E', 2], ['D', 'F', 6], ['E', 'G', 4], ['F', 'G', 2]],
  },
  coast: {
    nodes: { A: [56, 70], B: [56, 232], C: [200, 150], D: [330, 56], E: [330, 244], F: [470, 150] },
    edges: [['A', 'B', 6], ['A', 'C', 3], ['A', 'D', 10], ['B', 'C', 2], ['B', 'E', 9], ['C', 'D', 5], ['C', 'E', 6], ['D', 'F', 4], ['E', 'F', 1], ['D', 'E', 3]],
  },
};

/**
 * The small map of the worked example (a teaching screen). It is deliberately NOT one of MAPS, and its
 * places are called P to S: the generated steps draw from MAPS and from the letters B to H, so they can
 * never ask the worked example back.
 */
export const SHOW_MAP = {
  nodes: { P: [70, 150], Q: [260, 56], R: [260, 244], S: [480, 150] },
  edges: [['P', 'Q', 3], ['P', 'R', 4], ['Q', 'R', 2], ['Q', 'S', 8], ['R', 'S', 5]],
};

export function roadsOf(map) {
  const adj = {};
  for (const id of Object.keys(map.nodes)) adj[id] = [];
  for (const [a, b, w] of map.edges) { adj[a].push([b, w]); adj[b].push([a, w]); }
  for (const id of Object.keys(adj)) adj[id].sort((x, y) => (x[0] < y[0] ? -1 : 1));
  return adj;
}

/**
 * Dijkstra's algorithm from `start`. Returns the final labels, the node each
 * label came from, the order of settling and a log of every step:
 *   { node, label, tied, updates: [{ to, via, old, sum, better }], labels (unsettled labels before this pick) }
 */
export function dijkstra(map, start) {
  const adj = roadsOf(map);
  const dist = { [start]: 0 };
  const prev = {};
  const settled = [];
  const log = [];
  for (;;) {
    const open = Object.keys(dist).filter((id) => !settled.includes(id)).sort();
    if (!open.length) break;
    const least = Math.min(...open.map((id) => dist[id]));
    const node = open.find((id) => dist[id] === least);
    const labels = {};
    for (const id of open) labels[id] = dist[id];
    const step = { node, label: least, tied: open.filter((id) => dist[id] === least).length > 1, labels, updates: [] };
    settled.push(node);
    for (const [to, w] of adj[node]) {
      if (settled.includes(to)) continue;
      const sum = least + w;
      const old = to in dist ? dist[to] : null;
      const better = old === null || sum < old;
      step.updates.push({ to, road: w, old, sum, better });
      if (better) { dist[to] = sum; prev[to] = node; }
    }
    log.push(step);
  }
  return { dist, prev, order: settled, log };
}

/** The cheapest route from `from` to `to` as a list of nodes. */
export function cheapestRoute(map, from, to) {
  const { prev, dist } = dijkstra(map, from);
  if (!(to in dist)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}

/** Total length of a route (null if two neighbours on it are not joined by a road). */
export function routeCost(map, path) {
  let total = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const edge = map.edges.find(([a, b]) => (a === path[i] && b === path[i + 1]) || (b === path[i] && a === path[i + 1]));
    if (!edge) return null;
    total += edge[2];
  }
  return total;
}

/** Every route with the fewest roads from `from` to `to` (what breadth-first search looks for). */
export function fewestRoadRoutes(map, from, to) {
  const adj = roadsOf(map);
  let frontier = [[from]];
  const seen = new Set([from]);
  while (frontier.length) {
    const hits = frontier.filter((p) => p[p.length - 1] === to);
    if (hits.length) return hits;
    const next = [];
    const found = new Set();
    for (const path of frontier) {
      for (const [v] of adj[path[path.length - 1]]) {
        if (seen.has(v)) continue;
        found.add(v);
        next.push([...path, v]);
      }
    }
    for (const v of found) seen.add(v);
    frontier = next;
  }
  return [];
}

/**
 * A two-road detour that beats a direct road only because one road is "negative".
 * The negative road is one-way (C to B, drawn with an arrowhead): a two-way road that
 * pays could be driven back and forth for ever, and then no cheapest cost would exist.
 */
export function negativeFigure() {
  const node = (x, y, id) => `<circle class="fill-surface stroke-ink" stroke-width="3" cx="${x}" cy="${y}" r="20"/><text class="fig-label-lg" x="${x}" y="${y + 7}" text-anchor="middle">${id}</text>`;
  const sign = (x, y, text, cls = '') => `<rect class="fill-surface stroke-hair" stroke-width="2" x="${x - 19}" y="${y - 14}" width="38" height="26" rx="8"/><text class="fig-label ${cls}" x="${x}" y="${y + 4}" text-anchor="middle">${text}</text>`;
  const content =
    '<path class="stroke-ink-3 fill-none" stroke-width="4" stroke-linecap="round" d="M50 150 L290 150 M50 150 L170 44 L290 150"/>' +
    '<path class="stroke-ink-3 fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M258 132 L273 135 L268 121"/>' +
    sign(170, 150, '2') + sign(104, 92, '5') + sign(236, 92, '−4', 'text-red') +
    node(50, 150, 'A') + node(170, 44, 'C') + node(290, 150, 'B');
  return {
    type: 'svg', viewBox: '0 0 340 190', maxWidth: 380, content,
    alt: 'Three places. A straight road from A to B has length 2. A road from A to C has length 5, and a one-way road from C to B has length minus 4. An arrowhead shows its direction.',
  };
}

/* ------------------------------------------------------ lesson 5: hashing */

/** Position of a capital letter in the alphabet: A = 1 … Z = 26. */
export const letterNumber = (ch) => ch.toUpperCase().charCodeAt(0) - 64;
export const letterSum = (word) => [...word].reduce((total, ch) => total + letterNumber(ch), 0);
/** The hash functions of the lesson: key -> slot number in a table of m slots. */
export const HASHES = {
  sum: (word, m) => letterSum(word) % m,
  first: (word, m) => letterNumber(word[0]) % m,
  length: (word, m) => word.length % m,
};

/** Put keys into a table of m slots with chaining. Returns the chains. */
export function hashAll(keys, m, fn = 'sum') {
  const table = Array.from({ length: m }, () => []);
  for (const key of keys) table[HASHES[fn](key, m)].push(key);
  return table;
}

export const FIRST_WORDS = ['CAB', 'BED', 'ACE', 'FED', 'BAG'];
export const MORE_WORDS = ['BEE', 'BAD', 'DIG'];
export const CROWD = ['BAD', 'BID', 'BAG', 'BED', 'BEE', 'BIDE', 'ACE', 'DAB', 'CAD', 'FIB', 'HEAD', 'EGG'];
/** Short words made of the letters A to J, so that the sums stay small. */
export const WORD_POOL = ['ACE', 'BAD', 'BED', 'BEG', 'BIG', 'CAB', 'DIG', 'FED', 'FIG', 'HID', 'ICE', 'AGE', 'BEE', 'EGG', 'FAD', 'HAD', 'ADD', 'BAG', 'AID', 'BID', 'JAB', 'JIG', 'DIE', 'CAD', 'DAD', 'HAG', 'EBB', 'GAB'];

/* ------------------------------------------------ lesson 6: hard problems */

/** The seven towns of the lesson, on a 560 × 320 picture. One unit of distance is 10 pixels. */
export const TOWNS = { A: [160, 140], B: [40, 140], C: [130, 240], D: [400, 180], E: [310, 260], F: [350, 80], G: [520, 50] };
export const TOWN_SCALE = 10;

/** Road distance between two towns: the straight-line distance, rounded to a whole number of km. */
export const km = (towns, a, b, scale = TOWN_SCALE) => Math.round(Math.hypot(towns[a][0] - towns[b][0], towns[a][1] - towns[b][1]) / scale);

/** Length of the round trip that visits the towns in this order and returns to the first. */
export const tourLength = (towns, order, scale = TOWN_SCALE) => order.reduce((total, id, i) => total + km(towns, id, order[(i + 1) % order.length], scale), 0);

const permutations = (list) => (list.length < 2 ? [list] : list.flatMap((v, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [v, ...p])));

/** Every different round trip from `start` (each loop listed once, not once per direction). */
export function allTours(towns, start) {
  const rest = Object.keys(towns).filter((id) => id !== start);
  return permutations(rest).filter((p) => p.length < 2 || p[0] < p[p.length - 1]).map((p) => [start, ...p]);
}

/** The shortest round trip, found by trying them all. */
export function bestTour(towns, start, scale = TOWN_SCALE) {
  let best = null;
  let count = 0;
  for (const order of allTours(towns, start)) {
    const length = tourLength(towns, order, scale);
    if (!best || length < best.length) { best = { order, length }; count = 1; } else if (length === best.length) count++;
  }
  return { ...best, ties: count };
}

/** The nearest-neighbour rule of thumb: from `start`, always go to the nearest town not visited yet. */
export function nearestTour(towns, start, scale = TOWN_SCALE) {
  const order = [start];
  const ids = Object.keys(towns);
  while (order.length < ids.length) {
    const here = order[order.length - 1];
    const open = ids.filter((id) => !order.includes(id));
    order.push(open.reduce((best, id) => (km(towns, here, id, scale) < km(towns, here, best, scale) ? id : best)));
  }
  return { order, length: tourLength(towns, order, scale) };
}

/** Number of different round trips through n towns: (n - 1)! / 2, as a BigInt. */
export function tourCount(n) {
  let product = 1n;
  for (let k = 2n; k < BigInt(n); k++) product *= k;
  return n < 3 ? 1n : product / 2n;
}

/** A proposed round trip drawn as a ring of towns with the length of every leg written on it. */
export function ringFigure(legs) {
  const n = legs.length;
  const cx = 170;
  const cy = 132;
  const R = 96;
  const at = (i, radius = R) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  };
  let lines = '';
  let signs = '';
  let nodes = '';
  for (let i = 0; i < n; i++) {
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    lines += `<path class="stroke-orange fill-none" stroke-width="5" stroke-linecap="round" d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const out = Math.hypot(mx - cx, my - cy) || 1;
    const lx = mx + ((mx - cx) / out) * 22;
    const ly = my + ((my - cy) / out) * 22;
    signs += `<text class="fig-label-lg" x="${lx.toFixed(1)}" y="${(ly + 7).toFixed(1)}" text-anchor="middle">${legs[i]}</text>`;
    nodes += `<circle class="fill-surface stroke-ink" stroke-width="3" cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="15"/><text class="fig-label" x="${x1.toFixed(1)}" y="${(y1 + 5).toFixed(1)}" text-anchor="middle">${'ABCDEFGHIJ'[i]}</text>`;
  }
  return {
    type: 'svg', viewBox: '0 0 340 264', maxWidth: 360, content: lines + signs + nodes,
    alt: `A round trip through ${n} towns drawn as a ring. The legs are ${listAnd(legs.map((v) => `${v} km`))} long.`,
  };
}
