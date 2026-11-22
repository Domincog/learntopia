/**
 * graph-walk — a small network of nodes and edges to explore by hand.
 *
 * Modes
 *   'view'    a picture (optionally with every node's distance from `start`)
 *   'select'  tap nodes to pick a set ("which nodes are exactly 2 steps away?")
 *   'bfs'     carry out breadth-first search: the node at the front of the queue
 *             is ringed, and the learner taps each of its neighbours that has
 *             not been found yet. Found nodes get their layer's colour and
 *             their distance, and join the back of the queue shown underneath.
 *   'path'    tap nodes one after another to trace a route from `start` to `goal`
 *
 * {
 *   type: 'graph-walk',
 *   nodes: { A: [60, 150], B: [170, 60], … },   // id (one letter) -> [x, y] in a 560 × `height` box
 *   edges: ['A-B', 'A-C', 'B-D'],               // undirected
 *   start: 'A',                                 // where distances are measured from
 *   goal: 'H',                                  // optional: marked as the destination
 *   mode: 'view',
 *   showDist: false,                            // true: colour every node by layer and show its distance;
 *                                               // a number k: only for nodes at most k steps from start
 *   height: 300,
 * }
 *
 * State
 *   select: { selected: ['D', 'E'] }                       (sorted)
 *   bfs:    { order, dist, parent, queue, current, done, mistakes }
 *             order   nodes in the order they were found (start first)
 *             dist    { A: 0, B: 1, … } for the nodes found so far
 *             parent  { B: 'A', … }: the node each one was found from
 *             queue   nodes waiting, front first; current = the one being explored
 *   path:   { path: ['A', 'B', 'F'], length: 2, reached: false }
 *
 * setState accepts { selected: [...] }, { path: [...] }, { done: true } (runs BFS
 * to the end, neighbours in alphabetical order) or { order: [...] } (replays taps).
 */
import { frame, readout, button, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const R = 22;
const LAYERS = ['orange', 'blue', 'green', 'violet', 'pink', 'teal', 'yellow'];

addStyles('graph-walk', `
  .widget-graph-walk .w-canvas svg { touch-action: manipulation; }
  .widget-graph-walk .gw-node { outline: none; }
  .widget-graph-walk .gw-node.is-tap { cursor: pointer; }
  .widget-graph-walk .gw-node:focus-visible .gw-disc { stroke: var(--focus); stroke-width: 5; }
  .widget-graph-walk .gw-node.is-nope .gw-inner { animation: shake 0.4s ease; }
  .widget-graph-walk.is-readonly .gw-node { pointer-events: none; }
  .widget-graph-walk .gw-status { min-height: 1.5em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-graph-walk .gw-status.is-good { color: var(--green-text); }
  .widget-graph-walk .gw-status.is-bad { color: var(--red-text); }
  .widget-graph-walk .gw-queue { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; min-height: 40px; }
  .widget-graph-walk .gw-queue-label { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); margin-right: 2px; }
  .widget-graph-walk .gw-chip {
    display: inline-grid; place-items: center; min-width: 34px; height: 34px; padding: 0 8px;
    border: var(--bw) solid var(--edge-strong); border-radius: 10px; color: #1D1B26; font-weight: 800;
  }
  .widget-graph-walk .gw-chip.is-front { box-shadow: 0 0 0 3px var(--paper), 0 0 0 5px var(--ink); margin: 0 5px; }
  .widget-graph-walk .gw-chip.is-empty { border-style: dashed; border-color: var(--hair); color: var(--ink-3); font-weight: 600; font-size: var(--fs-sm); background: transparent; }
  .widget-graph-walk .btn-ghost { box-shadow: none; }
`);

/** Distances (fewest edges) from `start` to every node it can reach. */
export function distances(ids, adj, start) {
  const dist = { [start]: 0 };
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();
    for (const v of adj[u]) if (!(v in dist)) { dist[v] = dist[u] + 1; queue.push(v); }
  }
  return dist;
}

export default function create(spec, env) {
  const mode = ['view', 'select', 'bfs', 'path'].includes(spec.mode) ? spec.mode : 'view';
  const ids = Object.keys(spec.nodes || {});
  const pos = spec.nodes || {};
  const edges = (spec.edges || []).map((e) => (Array.isArray(e) ? e : String(e).split('-'))).filter(([a, b]) => pos[a] && pos[b] && a !== b);
  const adj = {};
  for (const id of ids) adj[id] = [];
  for (const [a, b] of edges) { if (!adj[a].includes(b)) adj[a].push(b); if (!adj[b].includes(a)) adj[b].push(a); }
  for (const id of ids) adj[id].sort();
  const start = pos[spec.start] ? spec.start : ids[0];
  const goal = pos[spec.goal] ? spec.goal : null;
  const height = spec.height || 300;
  const trueDist = distances(ids, adj, start);
  const showUpTo = spec.showDist === true ? Infinity : Number.isFinite(spec.showDist) ? spec.showDist : -1;
  const interactive = mode !== 'view' && !env.compact;
  let readOnly = !!env.readOnly;

  // select
  let selected = new Set();
  // bfs
  let dist = {};
  let parent = {};
  let order = [];
  let queue = [];
  let done = false;
  let mistakes = 0;
  // path
  let path = [start];

  function resetBfs() { dist = { [start]: 0 }; parent = {}; order = [start]; queue = [start]; done = false; }
  resetBfs();

  /* ---------------------------------------------------------------- scene */
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'A network of nodes and edges' });
  const { svg } = fr;
  const gEdges = s('g');
  const gNodes = s('g');
  svg.append(gEdges, gNodes);
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const edgeEls = {};
  for (const [a, b] of edges) {
    const line = s('line', { x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1], 'stroke-linecap': 'round' });
    edgeEls[key(a, b)] = line;
    gEdges.appendChild(line);
  }
  const nodeEls = {};
  for (const id of ids) {
    const [x, y] = pos[id];
    const ring = s('circle', { r: R + 8, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' });
    const disc = s('circle.gw-disc', { r: R, 'stroke-width': 3 });
    const letter = s('text.fig-label-lg', { y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, id);
    const badge = s('g', { transform: `translate(${R - 3} ${-R + 3})` },
      s('circle', { r: 12, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }),
      s('text.fig-label', { y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }));
    const tick = s('g', { transform: `translate(${-R + 3} ${-R + 3})` },
      s('circle', { r: 11, fill: 'var(--ink)' }),
      s('path', { d: 'M-5 0 l3.5 4 l6.5 -8', fill: 'none', stroke: 'var(--surface)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const note = s('text.fig-label', { y: R + 19, 'text-anchor': 'middle' });
    const inner = s('g.gw-inner', ring, disc, letter, badge, tick, note);
    const g = s('g.gw-node', { transform: `translate(${x} ${y})` }, inner, s('circle', { r: R + 10, fill: 'transparent' }));
    if (interactive) {
      g.classList.add('is-tap');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => tap(id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(id); } });
    }
    nodeEls[id] = { g, ring, disc, letter, badge, tick, note };
    gNodes.appendChild(g);
  }

  /* ------------------------------------------------------------- controls */
  const status = h('div.gw-status');
  const queueEl = h('div.gw-queue', { role: 'group' });
  const roPath = readout('Steps', { digits: 0 });
  const roPicked = readout('Selected', { digits: 0 });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('gw-status', tone && `is-${tone}`); };
  const undoBtn = button('Undo', () => { if (readOnly || path.length < 2) return; path.pop(); play('pop'); changed(describePath()); }, { icon: 'undo', variant: 'ghost' });
  const clearBtn = button(mode === 'bfs' ? 'Start again' : 'Clear', () => {
    if (readOnly) return;
    if (mode === 'path') path = [start];
    if (mode === 'select') selected = new Set();
    if (mode === 'bfs') { resetBfs(); mistakes = 0; settle(); }
    play('pop');
    changed(prompt());
  }, { icon: 'reset', variant: 'ghost' });
  if (interactive) {
    fr.el.insertBefore(status, fr.readouts);
    if (mode === 'bfs') fr.el.insertBefore(queueEl, fr.readouts);
    if (mode === 'path') { fr.readouts.appendChild(roPath.el); fr.buttons.append(undoBtn, clearBtn); }
    if (mode === 'select') { fr.readouts.appendChild(roPicked.el); fr.buttons.appendChild(clearBtn); }
    if (mode === 'bfs') fr.buttons.appendChild(clearBtn);
  }

  /* --------------------------------------------------------------- render */
  const layerHue = (d) => LAYERS[Math.min(d, LAYERS.length - 1)];
  /** Which distance (if any) is on show for this node right now? */
  function shownDist(id) {
    if (mode === 'bfs') return id in dist ? dist[id] : null;
    return id in trueDist && trueDist[id] <= showUpTo ? trueDist[id] : null;
  }

  function render() {
    const current = mode === 'bfs' && !done ? queue[0] : null;
    const onPath = new Set(mode === 'path' ? path : []);
    for (const [a, b] of edges) {
      const line = edgeEls[key(a, b)];
      let strong = false;
      if (mode === 'bfs') strong = parent[a] === b || parent[b] === a;
      if (mode === 'path') { const i = path.indexOf(a); strong = i >= 0 && (path[i + 1] === b || path[i - 1] === b); }
      line.setAttribute('stroke', strong ? (mode === 'path' ? hue('orange') : 'var(--ink)') : 'var(--ink-3)');
      line.setAttribute('stroke-width', strong ? (mode === 'path' ? 8 : 6) : 3);
      line.setAttribute('opacity', strong ? 1 : 0.75);
    }
    for (const id of ids) {
      const el = nodeEls[id];
      const d = shownDist(id);
      const picked = selected.has(id);
      const stepIndex = mode === 'path' ? path.indexOf(id) : -1;
      let fill = 'var(--surface)';
      let dark = false;
      if (d != null) { fill = hue(layerHue(d)); dark = true; }
      else if (id === start) { fill = hue('orange'); dark = true; }
      if (picked) { fill = hue('yellow'); dark = true; }
      if (mode === 'path' && stepIndex > 0 && d == null) { fill = hue('orange', 'soft'); dark = false; }
      el.disc.setAttribute('fill', fill);
      el.disc.setAttribute('stroke', dark ? 'var(--edge-strong)' : 'var(--ink)');
      el.disc.setAttribute('stroke-width', picked || (id === goal) || stepIndex >= 0 ? 5 : 3);
      if (picked || id === goal || stepIndex >= 0) el.disc.setAttribute('stroke', 'var(--ink)');
      el.letter.setAttribute('style', dark ? 'fill:#1D1B26' : '');
      el.ring.setAttribute('visibility', id === current ? 'visible' : 'hidden');
      el.badge.setAttribute('visibility', d != null ? 'visible' : 'hidden');
      el.badge.lastChild.textContent = d != null ? String(d) : '';
      el.tick.setAttribute('visibility', picked ? 'visible' : 'hidden');
      el.note.textContent = id === goal ? 'goal' : id === start ? 'start' : '';
      let label = `Node ${id}`;
      if (id === start) label += ', the start';
      if (id === goal) label += ', the goal';
      if (d != null) label += `, ${d} step${d === 1 ? '' : 's'} from ${start}`;
      if (picked) label += ', selected';
      if (id === current) label += ', being explored';
      if (stepIndex >= 0 && mode === 'path') label += `, stop ${stepIndex + 1} on your route`;
      label += `. Joined to ${adj[id].join(', ') || 'nothing'}.`;
      el.g.setAttribute('aria-label', label);
      if (interactive) el.g.setAttribute('tabindex', readOnly ? '-1' : '0');
    }
    if (mode === 'bfs') {
      queueEl.replaceChildren(h('span.gw-queue-label', 'Queue, front first'));
      if (!queue.length) queueEl.appendChild(h('span.gw-chip.is-empty', 'empty'));
      queue.forEach((id, i) => {
        queueEl.appendChild(h('span', { class: cx('gw-chip', i === 0 && 'is-front'), style: { background: hue(layerHue(dist[id])) }, title: i === 0 ? `${id} is being explored` : `${id} is waiting` }, id));
      });
      queueEl.setAttribute('aria-label', queue.length ? `Queue, front first: ${queue.join(', ')}` : 'The queue is empty');
    }
    if (mode === 'path') roPath.set(path.length - 1);
    if (mode === 'select') roPicked.set(selected.size);
    undoBtn.disabled = readOnly || path.length < 2;
    clearBtn.disabled = readOnly || (mode === 'path' ? path.length < 2 : mode === 'select' ? !selected.size : order.length < 2 && !mistakes);
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Network with nodes ${ids.join(', ')}. Edges: ${edges.map(([a, b]) => `${a} to ${b}`).join(', ')}.`);
  }

  function prompt() {
    if (mode === 'select') return 'Tap a node to select it. Tap it again to let go.';
    if (mode === 'path') return `Tap a neighbour of ${start} to start your route.`;
    if (mode === 'bfs') return done ? '' : `Exploring ${queue[0]}: tap each neighbour of ${queue[0]} that has not been found yet.`;
    return '';
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.onChange(getState());
  }

  function nope(id) {
    const g = nodeEls[id].g;
    g.classList.remove('is-nope');
    void g.getBoundingClientRect();
    g.classList.add('is-nope');
    play('wrong');
  }

  /* ------------------------------------------------------------------ bfs */
  const fresh = (u) => adj[u].filter((v) => !(v in dist));
  /** Move on while the node at the front has nothing new to offer. Returns the nodes passed over. */
  function settle() {
    const passed = [];
    while (queue.length && !fresh(queue[0]).length) {
      const finished = queue.shift();
      if (queue.length && !fresh(queue[0]).length) passed.push(queue[0]);
      void finished;
    }
    if (!queue.length) done = true;
    return passed;
  }

  function find(v) {
    const u = queue[0];
    dist[v] = dist[u] + 1;
    parent[v] = u;
    order.push(v);
    queue.push(v);
  }

  function tapBfs(v) {
    if (done) return;
    const u = queue[0];
    if (v === u) { setStatus(`${u} is the node being explored. Tap its neighbours.`); return; }
    if (v in dist) {
      mistakes++; nope(v);
      changed(`${v} has already been found${v === start ? '' : ` (from ${parent[v]})`}. Only tap nodes that are still white.`, 'bad');
      return;
    }
    if (!adj[u].includes(v)) {
      mistakes++; nope(v);
      changed(`${v} is not joined to ${u}. Right now only ${u}'s own neighbours can be found.`, 'bad');
      return;
    }
    find(v);
    const before = u;
    const passed = settle();
    play('drop');
    let text = `Found ${v}, ${dist[v]} step${dist[v] === 1 ? '' : 's'} from ${start}. `;
    if (done) text = `Found ${v}. The queue is empty: every node has its distance from ${start}.`;
    else if (queue[0] !== before) {
      text += `${before} has no new neighbours left. `;
      if (passed.length) text += `${passed.length > 1 ? `${passed.slice(0, -1).join(', ')} and ${passed[passed.length - 1]} have` : `${passed[0]} has`} none either. `;
      text += `Next in the queue: ${queue[0]}.`;
    } else text += `Any more new neighbours of ${before}?`;
    env.announce(text);
    changed(text, done ? 'good' : '');
  }

  /* ----------------------------------------------------------------- path */
  function describePath() {
    if (path.length < 2) return prompt();
    const steps = path.length - 1;
    const tail = goal && path[path.length - 1] === goal ? ` You have reached ${goal}.` : '';
    return `Route: ${path.join(' → ')} (${steps} step${steps === 1 ? '' : 's'}).${tail}`;
  }

  function tapPath(v) {
    const last = path[path.length - 1];
    const at = path.indexOf(v);
    if (v === last) { if (path.length > 1) { path.pop(); play('pop'); changed(describePath()); } return; }
    if (at >= 0) { path = path.slice(0, at + 1); play('pop'); changed(describePath()); return; }
    if (!adj[last].includes(v)) { nope(v); setStatus(`${v} is not joined to ${last}. A route moves along one edge at a time.`, 'bad'); return; }
    path.push(v);
    play('drop');
    changed(describePath(), goal && v === goal ? 'good' : '');
  }

  function tap(id) {
    if (readOnly || !interactive) return;
    if (mode === 'select') {
      if (id === start) { setStatus(`${start} is the start: it is 0 steps from itself.`); return; }
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      play('select');
      changed(selected.size ? `Selected: ${Array.from(selected).sort().join(', ')}.` : prompt());
    } else if (mode === 'bfs') tapBfs(id);
    else if (mode === 'path') tapPath(id);
  }

  function getState() {
    if (mode === 'select') return { selected: Array.from(selected).sort() };
    if (mode === 'path') return { path: path.slice(), length: path.length - 1, reached: !!goal && path[path.length - 1] === goal };
    if (mode === 'bfs') return { order: order.slice(), dist: { ...dist }, parent: { ...parent }, queue: queue.slice(), current: done ? null : queue[0], done, mistakes };
    return {};
  }

  settle();
  render();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'select' && Array.isArray(next.selected)) selected = new Set(next.selected.filter((id) => pos[id] && id !== start));
      if (mode === 'path' && Array.isArray(next.path)) {
        path = [start];
        for (const id of next.path) { if (id === start && path.length === 1) continue; if (pos[id] && adj[path[path.length - 1]].includes(id) && !path.includes(id)) path.push(id); else break; }
      }
      if (mode === 'bfs') {
        resetBfs();
        settle();
        if (Array.isArray(next.order)) for (const v of next.order) { if (done) break; if (v !== start && !(v in dist) && adj[queue[0]].includes(v)) { find(v); settle(); } }
        if (next.done) while (!done) { find(fresh(queue[0])[0]); settle(); }
      }
      render();
      setStatus(mode === 'bfs' && done ? `The queue is empty: every node has its distance from ${start}.` : mode === 'path' ? describePath() : mode === 'select' && selected.size ? `Selected: ${Array.from(selected).sort().join(', ')}.` : prompt(), mode === 'bfs' && done ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

const DEMO = {
  nodes: { A: [60, 150], B: [170, 60], C: [170, 240], D: [290, 105], E: [290, 225], F: [410, 55], G: [410, 240], H: [505, 150] },
  edges: ['A-B', 'A-C', 'B-D', 'B-F', 'C-E', 'D-E', 'D-G', 'E-G', 'F-H', 'G-H'],
};

export const examples = [
  { title: 'graph-walk — carry out breadth-first search', spec: { type: 'graph-walk', mode: 'bfs', start: 'A', ...DEMO } },
  { title: 'graph-walk — trace a route', spec: { type: 'graph-walk', mode: 'path', start: 'A', goal: 'H', showDist: true, ...DEMO } },
  { title: 'graph-walk — pick a set of nodes', spec: { type: 'graph-walk', mode: 'select', start: 'A', showDist: 1, ...DEMO } },
];
