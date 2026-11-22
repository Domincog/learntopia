/**
 * Helpers for the Algorithms course: the algorithms themselves as small pure
 * functions (so every number in a lesson is computed, not typed), plus a few
 * builders for static figures.
 */

/* ------------------------------------------------------------------ text */

/** 1234567 -> "1,234,567" (for running text). */
export const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** 1234567 -> "1{,}234{,}567" (inside $…$, where a bare comma would get a space after it). */
export const groupTex = (n) => group(n).replace(/,/g, '{,}');
/** ['a', 'b', 'c'] -> "a, b and c" */
export const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/* --------------------------------------------------------------- lesson 1 */

const DIRS = ['N', 'E', 'S', 'W'];
const STEP = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const FACING = { N: 'up', E: 'right', S: 'down', W: 'left' };
export const COMMAND = { F: 'Forward', L: 'Turn left', R: 'Turn right' };

/**
 * Drive a robot from (0, 0) on an endless floor. `turnsMove` models the
 * classic slip: believing that a turn also moves the robot one square.
 */
export function drive(program, dir, { turnsMove = false } = {}) {
  let x = 0;
  let y = 0;
  let d = DIRS.indexOf(dir);
  const visited = [[0, 0]];
  for (const c of program) {
    if (c === 'L') d = (d + 3) % 4;
    else if (c === 'R') d = (d + 1) % 4;
    if (c === 'F' || turnsMove) {
      x += STEP[DIRS[d]][0];
      y += STEP[DIRS[d]][1];
      visited.push([x, y]);
    }
  }
  return { x, y, dir: DIRS[d], visited };
}

/** The run in words, one line per command or block of Forwards. */
export function narrate(program, dir) {
  const lines = [];
  let d = DIRS.indexOf(dir);
  let i = 0;
  while (i < program.length) {
    const c = program[i];
    if (c === 'F') {
      let k = 0;
      while (program[i] === 'F') { k++; i++; }
      lines.push(`${k === 1 ? 'Forward' : `Forward × ${k}`}: ${plural(k, 'square')} ${FACING[DIRS[d]]}.`);
    } else {
      const before = DIRS[d];
      d = (d + (c === 'L' ? 3 : 1)) % 4;
      const aside = before === 'S' ? ` (the robot's ${c === 'L' ? 'left' : 'right'}, not yours)` : '';
      lines.push(`${COMMAND[c]}${aside}: same square, now facing ${FACING[DIRS[d]]}.`);
      i++;
    }
  }
  return lines;
}

/**
 * A "where does the robot stop?" puzzle: a short program, a 5 × 5 grid and
 * four lettered squares, one of them right. The wrong squares are where
 * typical mistakes lead (left/right swapped, a turn that moves, one Forward
 * forgotten).
 */
export function robotTrace(rng) {
  const cols = 5;
  const rows = 5;
  const forwards = (k) => new Array(k).fill('F');
  for (let attempt = 0; attempt < 500; attempt++) {
    const dir = rng.pick(DIRS);
    const program = [...forwards(rng.int(1, 2)), rng.pick(['L', 'R']), ...forwards(rng.int(1, 2))];
    if (rng.bool(0.65)) program.push(rng.pick(['L', 'R']), ...forwards(rng.int(1, 2)));
    const truth = drive(program, dir);
    const swapped = program.map((c) => (c === 'L' ? 'R' : c === 'R' ? 'L' : c));
    const slips = [
      { ...drive(swapped, dir), slip: 'mirror' },
      { ...drive(program, dir, { turnsMove: true }), slip: 'turnsMove' },
      { ...drive(program.slice(0, -1), dir), slip: 'short' },
    ];
    const key = (p) => `${p.x},${p.y}`;
    const used = new Set([key(truth), '0,0']);
    const wrong = [];
    for (const p of slips) if (!used.has(key(p))) { used.add(key(p)); wrong.push(p); }
    for (const [dx, dy] of rng.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]])) {
      if (wrong.length >= 3) break;
      const p = { x: truth.x + dx, y: truth.y + dy, slip: 'near' };
      if (!used.has(key(p))) { used.add(key(p)); wrong.push(p); }
    }
    const pts = [...truth.visited, ...wrong.slice(0, 3).map((p) => [p.x, p.y])];
    const minX = Math.min(...pts.map((p) => p[0]));
    const maxX = Math.max(...pts.map((p) => p[0]));
    const minY = Math.min(...pts.map((p) => p[1]));
    const maxY = Math.max(...pts.map((p) => p[1]));
    if (maxX - minX >= cols || maxY - minY >= rows) continue;
    const ox = rng.int(-minX, cols - 1 - maxX);
    const oy = rng.int(-minY, rows - 1 - maxY);
    // Letters are dealt at random: in reading order the right square would nearly always be B or C.
    const squares = rng.shuffle([{ x: truth.x + ox, y: truth.y + oy, correct: true, slip: null },
      ...wrong.slice(0, 3).map((p) => ({ x: p.x + ox, y: p.y + oy, correct: false, slip: p.slip }))]);
    const marks = {};
    squares.forEach((sq, i) => { sq.letter = 'ABCD'[i]; marks[sq.letter] = [sq.x, sq.y]; });
    return { cols, rows, start: { x: ox, y: oy, dir }, program, marks, squares, answer: squares.find((sq) => sq.correct).letter };
  }
  throw new Error('robotTrace: could not build a puzzle');
}

/* --------------------------------------------------------------- lesson 2 */

/** Pile sizes binary search can be left with: n, then half (rounded down), … down to 1. */
export function halvingChain(n) {
  const out = [n];
  while (n > 1) { n = Math.floor(n / 2); out.push(n); }
  return out;
}
/** Guesses that are always enough to find one of n sorted items with higher / lower / correct answers. */
export const maxGuesses = (n) => halvingChain(n).length; // = floor(log2 n) + 1

/** The chain of piles as a picture: one bar per guess. */
export function halvingFigure(n) {
  const chain = halvingChain(n);
  const rowH = 30;
  const x0 = 86;
  const full = 190;
  let content = '';
  chain.forEach((size, i) => {
    const y = 8 + i * rowH;
    const w = Math.max(5, (size / n) * full);
    content += `<text class="fig-label-sm text-muted" x="${x0 - 10}" y="${y + 15}" text-anchor="end">Guess ${i + 1}</text>`;
    content += `<rect class="${i === chain.length - 1 ? 'fill-green' : 'fill-teal'} stroke-ink" stroke-width="2.5" x="${x0}" y="${y + 2}" width="${w}" height="18" rx="5"/>`;
    content += `<text class="fig-label" x="${x0 + w + 9}" y="${y + 16}">${group(size)}</text>`;
  });
  return {
    type: 'svg', viewBox: `0 0 340 ${chain.length * rowH + 12}`, maxWidth: 400, content,
    alt: `Bars that halve each time: ${chain.join(', ')} numbers left before guesses 1 to ${chain.length}.`,
  };
}

/** What one guess `g` among the numbers 1…max leaves alive after each answer, and after the worse of the two. */
export function guessSplit(max, g) {
  const lower = g - 1;
  const higher = max - g;
  return { lower, higher, worst: Math.max(lower, higher) };
}

/** The strip 1…max with one guess marked, and the two pieces that the answers "lower" and "higher" leave. */
export function guessSplitFigure(max, g) {
  const { lower, higher } = guessSplit(max, g);
  const x0 = 14;
  const full = 312;
  const cell = full / max;
  const y = 40;
  const hgt = 30;
  const gx = x0 + (g - 1) * cell;
  const left = lower * cell;
  const right = higher * cell;
  const brace = (x, w, yb) => `<path class="stroke-ink-3 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M${x + 2} ${yb} v7 H${x + w - 2} v-7"/>`;
  let content = '';
  content += `<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="${x0}" y="${y}" width="${left}" height="${hgt}" rx="6"/>`;
  content += `<rect class="fill-teal-soft stroke-ink" stroke-width="2.5" x="${gx + cell}" y="${y}" width="${right}" height="${hgt}" rx="6"/>`;
  content += `<rect class="fill-orange stroke-ink" stroke-width="2.5" x="${gx}" y="${y - 5}" width="${cell}" height="${hgt + 10}" rx="5"/>`;
  content += `<text class="fig-label" x="${gx + cell / 2}" y="${y - 13}" text-anchor="middle">guess ${g}</text>`;
  content += `<text class="fig-label-sm text-muted" x="${x0}" y="${y - 13}">1</text>`;
  content += `<text class="fig-label-sm text-muted" x="${x0 + full}" y="${y - 13}" text-anchor="end">${max}</text>`;
  content += brace(x0, left, y + hgt + 6) + brace(gx + cell, right, y + hgt + 6);
  content += `<text class="fig-label-sm" x="${x0}" y="${y + hgt + 32}">“lower”: ${lower} left</text>`;
  content += `<text class="fig-label-sm" x="${x0 + full}" y="${y + hgt + 32}" text-anchor="end">“higher”: ${higher} left</text>`;
  return {
    type: 'svg', viewBox: `0 0 340 ${y + hgt + 42}`, maxWidth: 420, content,
    alt: `The numbers 1 to ${max} as a strip, with the guess ${g} marked. If the answer is "lower", the ${lower} numbers to its left are still alive. If the answer is "higher", the ${higher} numbers to its right are.`,
  };
}

/* ------------------------------------------------------ small card figures */

/**
 * A row of number cards as a static picture.
 *   cardsFigure([5, 2, 8], { label: 'Start' })
 */
export function cardsFigure(values, { alt = null, caption = null, maxWidth = null, color = 'blue' } = {}) {
  const w = 44;
  const gap = 8;
  const total = values.length * w + (values.length - 1) * gap;
  let content = '';
  values.forEach((v, i) => {
    const x = 6 + i * (w + gap);
    content += `<rect class="fill-${color}-soft stroke-ink" stroke-width="2.5" x="${x}" y="6" width="${w}" height="52" rx="9"/>`;
    content += `<text class="fig-label-lg" x="${x + w / 2}" y="39" text-anchor="middle">${v}</text>`;
  });
  return {
    type: 'svg', viewBox: `0 0 ${total + 12} 64`, maxWidth: maxWidth || Math.min(420, (total + 12) * 1.15), content,
    alt: alt || `A row of cards: ${values.join(', ')}.`, ...(caption ? { caption } : {}),
  };
}

/* --------------------------------------------------------------- lesson 3 */

/** Comparisons bubble sort (or selection sort) makes on n items: (n-1) + (n-2) + … + 1. */
export const pairCount = (n) => (n * (n - 1)) / 2;

/** One left-to-right pass of bubble sort. Returns the new row and what happened at each pair. */
export function bubblePass(values) {
  const row = values.slice();
  const steps = [];
  for (let i = 0; i < row.length - 1; i++) {
    const left = row[i];
    const right = row[i + 1];
    const swapped = left > right;
    if (swapped) { row[i] = right; row[i + 1] = left; }
    steps.push({ left, right, swapped, row: row.slice() });
  }
  return { row, steps };
}

/**
 * One pass of bubble sort as a stepped picture: the row at the start, then the row after each
 * comparison, with the pair just compared coloured in and the verdict written next to it.
 */
export function passFigure(values) {
  const { steps } = bubblePass(values);
  const w = 38;
  const hgt = 34;
  const gap = 5;
  const x0 = 128;
  const rowGap = 44;
  const width = x0 + values.length * (w + gap) + 2;
  let content = '';
  const label = (text, y) => `<text class="fig-label-sm" x="${x0 - 12}" y="${y + hgt / 2 + 4}" text-anchor="end">${text}</text>`;
  const drawRow = (row, y, pair, swapped, last) => row.forEach((v, i) => {
    const locked = last && i === row.length - 1;
    const compared = i === pair || i === pair + 1;
    const fill = locked ? 'fill-green-soft' : compared ? (swapped ? 'fill-orange' : 'fill-blue-soft') : 'fill-surface';
    content += svgCard(x0 + i * (w + gap), y, w, hgt, v, { fill, cls: 'fig-label' });
  });
  content += label('Start', 6);
  drawRow(values, 6, -2, false, false);
  steps.forEach((st, i) => {
    const y = 6 + (i + 1) * rowGap;
    content += label(`${st.left} and ${st.right}: ${st.swapped ? 'swap' : 'leave'}`, y);
    drawRow(st.row, y, i, st.swapped, i === steps.length - 1);
  });
  const end = steps[steps.length - 1].row;
  return {
    type: 'svg', viewBox: `0 0 ${width} ${6 + steps.length * rowGap + hgt + 6}`, maxWidth: Math.min(440, width * 1.3), content,
    alt: `One pass of bubble sort over the row ${values.join(', ')}. ${steps.map((st) => `${st.left} and ${st.right}: ${st.swapped ? 'swap' : 'leave'}, giving ${st.row.join(', ')}.`).join(' ')} The biggest number, ${end[end.length - 1]}, is now at the end.`,
  };
}

/** Swaps bubble sort needs in total: one for every pair that starts out in the wrong order. */
export function inversions(values) {
  let count = 0;
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) count++;
  return count;
}

/* --------------------------------------------------------------- lesson 4 */

/** Merge two sorted piles; also reports how many comparisons were needed. */
export function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  let comparisons = 0;
  while (i < a.length && j < b.length) { comparisons++; if (a[i] <= b[j]) out.push(a[i++]); else out.push(b[j++]); }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return { out, comparisons };
}

/**
 * A merge written out for a worked example: one entry per comparison (the two front cards, the one
 * taken, the merged row after it), then the cards that follow without a comparison.
 */
export function mergeTrace(a, b) {
  const rows = [];
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const frontA = a[i];
    const frontB = b[j];
    const taken = Math.min(frontA, frontB);
    if (frontA <= frontB) i++; else j++;
    out.push(taken);
    rows.push({ frontA, frontB, taken, out: out.slice(), restA: a.slice(i), restB: b.slice(j) });
  }
  const free = [...a.slice(i), ...b.slice(j)];
  return { rows, free, emptied: i >= a.length ? 'A' : 'B', merged: [...out, ...free], comparisons: rows.length };
}

/** Merge sort, counting comparisons and card moves (each card moves once per level). */
export function mergeSortCounts(values) {
  let piles = values.map((v) => [v]);
  let comparisons = 0;
  let moves = 0;
  let levels = 0;
  while (piles.length > 1) {
    const next = [];
    for (let k = 0; k < piles.length; k += 2) {
      if (k + 1 >= piles.length) { next.push(piles[k]); moves += piles[k].length; continue; }
      const res = merge(piles[k], piles[k + 1]);
      comparisons += res.comparisons;
      moves += res.out.length;
      next.push(res.out);
    }
    piles = next;
    levels++;
  }
  return { sorted: piles[0], comparisons, moves, levels };
}

const svgCard = (x, y, w, hgt, text, { fill = 'fill-surface', stroke = 'stroke-ink', dashed = false, cls = 'fig-label-lg' } = {}) =>
  `<rect class="${fill} ${stroke}" stroke-width="2.5"${dashed ? ' stroke-dasharray="5 5"' : ''} x="${x}" y="${y}" width="${w}" height="${hgt}" rx="8"/>` +
  (text === '' ? '' : `<text class="${cls}" x="${x + w / 2}" y="${y + hgt / 2 + 7}" text-anchor="middle">${text}</text>`);

/**
 * Two sorted piles part-way through a merge: what is left of each pile, and the
 * merged row so far with a "?" where the next card will go.
 */
export function mergeFigure(restA, restB, out) {
  const w = 38;
  const hgt = 38;
  const gap = 5;
  const x0 = 78;
  const rowY = [6, 54, 114];
  const longest = Math.max(restA.length, restB.length, out.length + 1);
  const width = x0 + longest * (w + gap) + 6;
  let content = '';
  const label = (text, y) => `<text class="fig-label-sm" x="${x0 - 10}" y="${y + hgt / 2 + 4}" text-anchor="end">${text}</text>`;
  content += label('Pile A', rowY[0]) + label('Pile B', rowY[1]) + label('Merged', rowY[2]);
  restA.forEach((v, i) => { content += svgCard(x0 + i * (w + gap), rowY[0], w, hgt, v, { fill: i === 0 ? 'fill-orange' : 'fill-orange-soft' }); });
  restB.forEach((v, i) => { content += svgCard(x0 + i * (w + gap), rowY[1], w, hgt, v, { fill: i === 0 ? 'fill-blue' : 'fill-blue-soft' }); });
  out.forEach((v, i) => { content += svgCard(x0 + i * (w + gap), rowY[2], w, hgt, v, { fill: 'fill-green-soft' }); });
  content += svgCard(x0 + out.length * (w + gap), rowY[2], w, hgt, '?', { fill: 'fill-none', stroke: 'stroke-ink-3', dashed: true });
  content += `<path class="stroke-hair" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" d="M6 ${rowY[2] - 11} H${width - 6}"/>`;
  return {
    type: 'svg', viewBox: `0 0 ${width} ${rowY[2] + hgt + 6}`, maxWidth: Math.min(440, width * 1.15), content,
    alt: `Pile A still holds ${restA.join(', ')}, with ${restA[0]} at the front. Pile B still holds ${restB.join(', ')}, with ${restB[0]} at the front. Merged so far: ${out.join(', ') || 'nothing'}.`,
  };
}

/** The "divide" half of merge sort as a picture: the row is halved again and again down to single cards. */
export function splitFigure(values) {
  const n = values.length;
  const slot = 40;
  const hgt = 34;
  const rowGap = 50;
  const x0 = 6;
  let content = '';
  let level = 0;
  for (let size = n; size >= 1; size = Math.floor(size / 2), level++) {
    const y = 6 + level * rowGap;
    for (let g = 0; g * size < n; g++) {
      const x = x0 + g * size * slot + 3;
      const w = size * slot - 6;
      content += `<rect class="${size === 1 ? 'fill-green-soft' : 'fill-blue-soft'} stroke-ink" stroke-width="2.5" x="${x}" y="${y}" width="${w}" height="${hgt}" rx="9"/>`;
      for (let k = 0; k < size; k++) {
        content += `<text class="fig-label" x="${x0 + (g * size + k + 0.5) * slot}" y="${y + hgt / 2 + 5}" text-anchor="middle">${values[g * size + k]}</text>`;
      }
      if (size > 1) {
        const mid = x0 + (g * size + size / 2) * slot;
        content += `<path class="stroke-ink-3 fill-none" stroke-width="2" stroke-linecap="round" d="M${mid - 9} ${y + hgt + 4} l-7 9 M${mid + 9} ${y + hgt + 4} l7 9"/>`;
      }
    }
    if (size === 1) break;
  }
  return {
    type: 'svg', viewBox: `0 0 ${x0 * 2 + n * slot} ${6 + (level + 1) * rowGap - (rowGap - hgt) + 6}`, maxWidth: 420, content,
    alt: `The row ${values.join(', ')} is split into two halves, each half into two again, until every card stands alone.`,
  };
}

/* --------------------------------------------------------------- lesson 6 */

/** The graphs used in the lesson. Node positions are for a 560 × 300 picture. */
export const GRAPHS = {
  friends: {
    nodes: { A: [60, 150], B: [170, 60], C: [170, 240], D: [290, 105], E: [290, 225], F: [410, 55], G: [410, 240], H: [505, 150] },
    edges: ['A-B', 'A-C', 'B-D', 'B-F', 'C-E', 'D-E', 'D-G', 'E-G', 'F-H', 'G-H'],
  },
  metro: {
    nodes: { A: [60, 150], B: [165, 60], C: [165, 240], D: [280, 150], E: [300, 45], F: [300, 255], G: [410, 95], H: [420, 215], I: [510, 150] },
    edges: ['A-B', 'A-C', 'B-D', 'B-E', 'C-D', 'C-F', 'D-G', 'D-H', 'E-G', 'F-H', 'G-I', 'H-I'],
  },
  ring: {
    nodes: { A: [75, 80], B: [250, 45], C: [420, 80], D: [500, 200], E: [345, 255], F: [150, 250], G: [255, 150] },
    edges: ['A-B', 'B-C', 'C-D', 'D-E', 'E-F', 'F-A', 'G-B', 'G-E', 'G-F'],
  },
  bridge: {
    nodes: { A: [60, 75], B: [60, 225], C: [175, 150], D: [290, 60], E: [290, 240], F: [400, 150], G: [505, 70], H: [505, 230] },
    edges: ['A-B', 'A-C', 'B-C', 'C-D', 'C-E', 'D-F', 'E-F', 'F-G', 'F-H', 'G-H'],
  },
};

export function neighbours(graph) {
  const adj = {};
  for (const id of Object.keys(graph.nodes)) adj[id] = [];
  for (const edge of graph.edges) {
    const [a, b] = edge.split('-');
    adj[a].push(b);
    adj[b].push(a);
  }
  for (const id of Object.keys(adj)) adj[id].sort();
  return adj;
}

/** Breadth-first search: distance (fewest edges) and parent for every node reachable from `start`. */
export function bfs(graph, start) {
  const adj = neighbours(graph);
  const dist = { [start]: 0 };
  const parent = {};
  const order = [start];
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();
    for (const v of adj[u]) {
      if (v in dist) continue;
      dist[v] = dist[u] + 1;
      parent[v] = u;
      order.push(v);
      queue.push(v);
    }
  }
  return { dist, parent, order, adj };
}

/** Nodes grouped by distance from `start`: [[start], [1 step away…], [2 steps away…], …] */
export function layers(graph, start) {
  const { dist } = bfs(graph, start);
  const out = [];
  for (const id of Object.keys(dist).sort()) (out[dist[id]] = out[dist[id]] || []).push(id);
  return out;
}

/** One shortest route from `from` to `to`, as a list of nodes. */
export function shortestPath(graph, from, to) {
  const { parent, dist } = bfs(graph, from);
  if (!(to in dist)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(parent[path[0]]);
  return path;
}

/**
 * A small graph for the worked queue example. It is deliberately NOT one of GRAPHS, which the
 * generated questions draw from, and it uses letters that the queue question does not.
 */
export const QUEUE_GRAPH = {
  nodes: { J: [70, 112], K: [230, 56], L: [230, 168], M: [410, 46], N: [410, 112], P: [410, 178] },
  edges: ['J-K', 'J-L', 'K-M', 'K-N', 'L-N', 'L-P'],
};

/**
 * Breadth-first search written out step by step: for each node explored (in order), the new
 * nodes it finds and the queue afterwards, front first. rows[0] is the start, before anything is explored.
 */
export function queueTrace(graph, start) {
  const adj = neighbours(graph);
  const found = new Set([start]);
  const queue = [start];
  const rows = [{ explored: null, found: [start], queue: [start] }];
  while (queue.length) {
    const u = queue.shift();
    const fresh = adj[u].filter((v) => !found.has(v));
    for (const v of fresh) { found.add(v); queue.push(v); }
    rows.push({ explored: u, found: fresh, queue: queue.slice() });
  }
  return rows;
}

/** The words of the lesson as a picture: a tiny graph with a node, an edge and a two-step route pointed out. */
export function graphPartsFigure() {
  const at = { P: [56, 74], Q: [170, 74], R: [284, 74], S: [170, 168] };
  const line = (a, b, cls, width) => `<path class="${cls} fill-none" stroke-width="${width}" stroke-linecap="round" d="M${at[a][0]} ${at[a][1]} L${at[b][0]} ${at[b][1]}"/>`;
  const node = (id) => `<circle class="fill-surface stroke-ink" stroke-width="3" cx="${at[id][0]}" cy="${at[id][1]}" r="20"/><text class="fig-label-lg" x="${at[id][0]}" y="${at[id][1] + 7}" text-anchor="middle">${id}</text>`;
  const pointer = (x1, y1, x2, y2) => `<path class="stroke-ink-3 fill-none" stroke-width="2" stroke-linecap="round" d="M${x1} ${y1} L${x2} ${y2}"/>`;
  const content =
    line('Q', 'S', 'stroke-ink-3', 4) + line('P', 'Q', 'stroke-orange', 6) + line('Q', 'R', 'stroke-orange', 6) +
    node('P') + node('Q') + node('R') + node('S') +
    pointer(56, 118, 56, 100) + '<text class="fig-label-sm" x="56" y="134" text-anchor="middle">a node</text>' +
    pointer(196, 121, 176, 121) + '<text class="fig-label-sm" x="202" y="125">an edge</text>' +
    '<text class="fig-label text-orange" x="170" y="28" text-anchor="middle">P → Q → R: 2 steps</text>';
  return {
    type: 'svg', viewBox: '0 0 340 196', maxWidth: 400, content,
    alt: 'A small graph with four nodes, P, Q, R and S. Edges join P to Q, Q to R and Q to S. The route from P through Q to R is coloured in: it has two edges, so it takes two steps.',
  };
}

/** Two towns joined by one long road and by two short ones: fewest edges is not shortest distance. */
export function roadsFigure() {
  const node = (x, y, id) => `<circle class="fill-surface stroke-ink" stroke-width="3" cx="${x}" cy="${y}" r="20"/><text class="fig-label-lg" x="${x}" y="${y + 7}" text-anchor="middle">${id}</text>`;
  const content =
    '<path class="stroke-orange fill-none" stroke-width="5" stroke-linecap="round" d="M50 70 C 40 215, 300 215, 290 70"/>' +
    '<path class="stroke-blue fill-none" stroke-width="5" stroke-linecap="round" d="M50 70 L170 44 L290 70"/>' +
    '<text class="fig-label text-orange" x="170" y="198" text-anchor="middle">12 km</text>' +
    '<text class="fig-label text-blue" x="104" y="40" text-anchor="middle">3 km</text>' +
    '<text class="fig-label text-blue" x="238" y="40" text-anchor="middle">4 km</text>' +
    node(50, 70, 'A') + node(170, 44, 'C') + node(290, 70, 'B');
  return {
    type: 'svg', viewBox: '0 0 340 210', maxWidth: 400, content,
    alt: 'Towns A and B are joined by one long, winding road of 12 km. A second way goes through town C: 3 km from A to C, then 4 km from C to B.',
  };
}
