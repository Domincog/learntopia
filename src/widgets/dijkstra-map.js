/**
 * dijkstra-map — a small road map in which every road has a length, for
 * finding cheapest routes by hand.
 *
 * Modes
 *   'view'      a picture (optionally with labels, settled places and a highlighted route)
 *   'path'      tap places one after another to trace a route from `start` to `goal`;
 *               the lengths of its roads are added up
 *   'pick'      a picture of a moment in a run (`labels`, `settled`); the learner taps ONE place,
 *               for questions such as "which place is settled next?". Nothing is refused.
 *   'dijkstra'  carry out Dijkstra's algorithm. Every place shows its label: the best
 *               distance from `start` found so far (∞ = not reached yet). The learner
 *               taps the unsettled place with the smallest label to settle it. Then the
 *               roads out of it are checked: by the widget (relax: 'auto'), or by the
 *               learner, who taps each unsettled neighbour in turn (relax: 'tap') and
 *               sees whether the route through the newly settled place is an improvement.
 *               A wrong tap is refused and counted. Ties may be broken either way.
 *
 * {
 *   type: 'dijkstra-map',
 *   nodes: { A: [56, 150], B: [180, 56], … },      // id (one letter) -> [x, y] in a 560 × `height` box
 *   edges: [['A', 'B', 2], ['A', 'D', 4, 0.4]],   // [from, to, length, where along the road the number sits (0–1, default 0.5)]
 *   start: 'A', goal: 'F',
 *   mode: 'view',
 *   relax: 'auto',                                 // dijkstra mode: 'auto' | 'tap'
 *   unit: 'min',                                   // written after totals
 *   labels: true,                                  // view / path: true = print every place's true distance from start;
 *                                                  // or an object { A: 0, B: 2 } of labels to print
 *   settled: ['A', 'B'],                           // view: draw these places as settled
 *   route: ['A', 'D', 'F'],                        // view: highlight this route
 *   height: 300,
 * }
 *
 * State
 *   path:     { path: ['A', 'B'], cost, roads, reached }
 *   pick:     { picked }      the chosen place, or null
 *   dijkstra: { settled, dist, prev, phase, current, pending, done, mistakes }
 *               settled   places in the order they were settled
 *               dist      { A: 0, B: 2, … }: the labels so far (places not reached yet are missing)
 *               prev      { B: 'A', … }: the place each label came through
 *               phase     'pick' (choose the next place to settle) | 'update' (check the roads out of `current`) | 'done'
 *               pending   update phase: neighbours of `current` whose road has not been checked yet
 *
 * setState accepts { path: [...] }, { picked: 'D' }, { done: true } (runs the algorithm to the end) or
 * { settled: ['A', 'B', 'D'] } (settles these places in this order, checking all their roads).
 */
import { frame, readout, button, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('dijkstra-map', `
  .widget-dijkstra-map .w-canvas svg { touch-action: manipulation; }
  .widget-dijkstra-map .dm-node { outline: none; }
  .widget-dijkstra-map .dm-node.is-tap { cursor: pointer; }
  .widget-dijkstra-map .dm-node:focus-visible .dm-disc { stroke: var(--focus); stroke-width: 5; }
  .widget-dijkstra-map .dm-node.is-nope .dm-inner { animation: shake 0.4s ease; }
  .widget-dijkstra-map.is-readonly .dm-node { pointer-events: none; }
  .widget-dijkstra-map .dm-status { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-dijkstra-map .dm-status.is-good { color: var(--green-text); }
  .widget-dijkstra-map .dm-status.is-bad { color: var(--red-text); }
  .widget-dijkstra-map .btn-ghost { box-shadow: none; }
`);

const W = 560;
const R = 21;

/** Roads out of every place: { A: [['B', 2], ['D', 4]], … } */
export function roads(nodes, edges) {
  const adj = {};
  for (const id of Object.keys(nodes)) adj[id] = [];
  for (const [a, b, w] of edges) { if (adj[a] && adj[b] && a !== b) { adj[a].push([b, w]); adj[b].push([a, w]); } }
  for (const id of Object.keys(adj)) adj[id].sort((x, y) => (x[0] < y[0] ? -1 : 1));
  return adj;
}

/** True shortest distances from `start` (the plain algorithm, used for pictures and for finishing a run). */
export function shortest(nodes, edges, start) {
  const adj = roads(nodes, edges);
  const dist = { [start]: 0 };
  const prev = {};
  const order = [];
  for (;;) {
    const open = Object.keys(dist).filter((id) => !order.includes(id)).sort();
    if (!open.length) break;
    const u = open.reduce((best, id) => (dist[id] < dist[best] ? id : best));
    order.push(u);
    for (const [v, w] of adj[u]) if (!order.includes(v) && (!(v in dist) || dist[u] + w < dist[v])) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  return { dist, prev, order };
}

export default function create(spec, env) {
  const mode = ['view', 'path', 'pick', 'dijkstra'].includes(spec.mode) ? spec.mode : 'view';
  const pos = spec.nodes || {};
  const ids = Object.keys(pos);
  const edges = (spec.edges || []).map((e) => (Array.isArray(e) ? e : [String(e).split(/[-:]/)[0], String(e).split(/[-:]/)[1], Number(String(e).split(':')[1])]))
    .filter(([a, b, w]) => pos[a] && pos[b] && a !== b && Number.isFinite(w));
  const adj = roads(pos, edges);
  const start = pos[spec.start] ? spec.start : ids[0];
  const goal = pos[spec.goal] ? spec.goal : null;
  const height = spec.height || 300;
  const manual = spec.relax === 'tap';
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const truth = shortest(pos, edges, start);
  const shown = spec.labels === true ? truth.dist : (spec.labels && typeof spec.labels === 'object' ? spec.labels : null);
  const interactive = mode !== 'view' && !env.compact;
  const lengthOf = (a, b) => { const e = adj[a].find(([v]) => v === b); return e ? e[1] : null; };
  let readOnly = !!env.readOnly;

  // pick
  let picked = null;
  // path
  let path = [start];
  // dijkstra
  let dist = {};
  let prev = {};
  let settled = [];
  let phase = 'pick';
  let current = null;
  let pending = [];
  let mistakes = 0;

  function resetRun() { dist = { [start]: 0 }; prev = {}; settled = []; phase = 'pick'; current = null; pending = []; }
  resetRun();
  const openLabels = () => Object.keys(dist).filter((id) => !settled.includes(id));
  const least = () => Math.min(...openLabels().map((id) => dist[id]));

  /** Check the road current -> v. Returns what happened. */
  function relax(v) {
    const w = lengthOf(current, v);
    const sum = dist[current] + w;
    const old = v in dist ? dist[v] : null;
    const better = old === null || sum < old;
    if (better) { dist[v] = sum; prev[v] = current; }
    pending = pending.filter((id) => id !== v);
    return { to: v, road: w, sum, old, better };
  }
  function afterUpdates() {
    if (pending.length) return;
    current = null;
    phase = openLabels().length ? 'pick' : 'done';
  }
  /** Settle u (assumed allowed). In auto mode all its roads are checked at once. */
  function settle(u, auto) {
    settled.push(u);
    current = u;
    pending = adj[u].map(([v]) => v).filter((v) => !settled.includes(v));
    phase = 'update';
    const done = [];
    if (auto) while (pending.length) done.push(relax(pending[0]));
    afterUpdates();
    return done;
  }

  /* ---------------------------------------------------------------- scene */
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'A road map with a length on every road' });
  const { svg } = fr;
  const gEdges = s('g');
  const gSigns = s('g');
  const gNodes = s('g');
  svg.append(gEdges, gSigns, gNodes);
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const edgeEls = {};
  for (const [a, b, w, t = 0.5] of edges) {
    const line = s('line', { x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1], 'stroke-linecap': 'round' });
    edgeEls[key(a, b)] = line;
    gEdges.appendChild(line);
    const mx = pos[a][0] + (pos[b][0] - pos[a][0]) * t;
    const my = pos[a][1] + (pos[b][1] - pos[a][1]) * t;
    const wide = String(w).length > 1 ? 34 : 28;
    gSigns.append(
      s('rect', { x: mx - wide / 2, y: my - 13, width: wide, height: 26, rx: 8, fill: 'var(--surface)', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
      s('text.fig-label', { x: mx, y: my + 5, 'text-anchor': 'middle', style: 'stroke:none' }, String(w)),
    );
  }
  const nodeEls = {};
  for (const id of ids) {
    const [x, y] = pos[id];
    const ring = s('circle', { r: R + 8, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' });
    const disc = s('circle.dm-disc', { r: R, 'stroke-width': 3 });
    const letter = s('text.fig-label-lg', { y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, id);
    const badgeBox = s('rect', { x: -17, y: -12, width: 34, height: 24, rx: 12, 'stroke-width': 2.5 });
    const badgeText = s('text.fig-label', { y: 5, 'text-anchor': 'middle' });
    const badge = s('g', { transform: `translate(${R + 6} ${-R - 3})` }, badgeBox, badgeText);
    const tick = s('g', { transform: `translate(${-R + 2} ${-R + 3})` },
      s('circle', { r: 10, fill: 'var(--ink)' }),
      s('path', { d: 'M-5 0 l3.5 4 l6.5 -8', fill: 'none', stroke: 'var(--surface)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const note = s('text.fig-label-sm', { y: R + 17, 'text-anchor': 'middle' });
    const inner = s('g.dm-inner', ring, disc, letter, badge, tick, note);
    const g = s('g.dm-node', { transform: `translate(${x} ${y})` }, inner, s('circle', { r: R + 11, fill: 'transparent' }));
    if (interactive) {
      g.classList.add('is-tap');
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => tap(id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(id); } });
    }
    nodeEls[id] = { g, ring, disc, letter, badge, badgeBox, badgeText, tick, note };
    gNodes.appendChild(g);
  }

  /* ------------------------------------------------------------- controls */
  const status = h('div.dm-status', { 'aria-live': 'polite' });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('dm-status', tone && `is-${tone}`); };
  const roTotal = readout('Total', { digits: 0 });
  const roRoads = readout('Roads', { digits: 0 });
  const roSettled = readout('Settled', { digits: 0 });
  const undoBtn = button('Undo', () => { if (readOnly || path.length < 2) return; path.pop(); play('pop'); changed(describePath()); }, { icon: 'undo', variant: 'ghost' });
  const clearBtn = button(mode === 'dijkstra' ? 'Start again' : 'Clear', () => {
    if (readOnly) return;
    if (mode === 'path') path = [start];
    if (mode === 'dijkstra') { resetRun(); mistakes = 0; }
    play('pop');
    changed(prompt());
  }, { icon: 'reset', variant: 'ghost' });
  if (interactive) {
    fr.el.insertBefore(status, fr.readouts);
    if (mode === 'path') { fr.readouts.append(roTotal.el, roRoads.el); fr.buttons.append(undoBtn, clearBtn); }
    if (mode === 'dijkstra') { fr.readouts.appendChild(roSettled.el); fr.buttons.appendChild(clearBtn); }
  }

  const pathCost = () => path.reduce((total, id, i) => (i ? total + lengthOf(path[i - 1], id) : 0), 0);

  function getState() {
    if (mode === 'path') return { path: path.slice(), cost: pathCost(), roads: path.length - 1, reached: !!goal && path[path.length - 1] === goal };
    if (mode === 'dijkstra') return { settled: settled.slice(), dist: { ...dist }, prev: { ...prev }, phase, current, pending: pending.slice(), done: phase === 'done', mistakes };
    if (mode === 'pick') return { picked };
    return {};
  }

  /* --------------------------------------------------------------- render */
  function render() {
    const onPath = mode === 'path' ? path : (Array.isArray(spec.route) ? spec.route : []);
    const isSettled = (id) => (mode === 'dijkstra' ? settled.includes(id) : Array.isArray(spec.settled) && spec.settled.includes(id));
    const labelOf = (id) => (mode === 'dijkstra' ? (id in dist ? dist[id] : '∞') : shown && id in shown ? shown[id] : null);
    for (const [a, b] of edges) {
      const line = edgeEls[key(a, b)];
      const i = onPath.indexOf(a);
      const onRoute = i >= 0 && (onPath[i + 1] === b || onPath[i - 1] === b);
      const tree = mode === 'dijkstra' && (prev[a] === b || prev[b] === a);
      const checking = mode === 'dijkstra' && phase === 'update' && ((a === current && pending.includes(b)) || (b === current && pending.includes(a)));
      line.setAttribute('stroke', onRoute ? hue('orange') : checking ? hue('orange') : tree ? 'var(--ink)' : 'var(--ink-3)');
      line.setAttribute('stroke-width', onRoute ? 8 : tree || checking ? 6 : 3.5);
      line.setAttribute('stroke-dasharray', checking ? '2 11' : 'none');
      line.setAttribute('opacity', onRoute || tree || checking ? 1 : 0.7);
    }
    for (const id of ids) {
      const el = nodeEls[id];
      const done = isSettled(id);
      const label = labelOf(id);
      const stepIndex = mode === 'path' ? path.indexOf(id) : onPath.indexOf(id);
      const reached = mode === 'dijkstra' && id in dist && !done;
      let fill = 'var(--surface)';
      let dark = false;
      if (done) { fill = hue('green'); dark = true; }
      else if (reached) { fill = hue('yellow', 'soft'); }
      else if (stepIndex >= 0) { fill = stepIndex === 0 ? hue('orange') : hue('orange', 'soft'); dark = stepIndex === 0; }
      else if (id === start && mode !== 'dijkstra') { fill = hue('orange'); dark = true; }
      el.disc.setAttribute('fill', fill);
      el.disc.setAttribute('stroke', dark ? 'var(--edge-strong)' : 'var(--ink)');
      el.disc.setAttribute('stroke-width', id === goal || stepIndex >= 0 || id === picked ? 5 : 3);
      el.letter.setAttribute('style', dark ? 'fill:#1D1B26' : '');
      el.ring.setAttribute('visibility', (id === current && phase === 'update') || id === picked ? 'visible' : 'hidden');
      el.tick.setAttribute('visibility', done ? 'visible' : 'hidden');
      el.badge.setAttribute('visibility', label != null ? 'visible' : 'hidden');
      el.badgeText.textContent = label != null ? String(label) : '';
      el.badgeBox.setAttribute('fill', done ? 'var(--ink)' : 'var(--surface)');
      el.badgeBox.setAttribute('stroke', 'var(--ink)');
      el.badgeText.setAttribute('style', `stroke:none;fill:${done ? 'var(--surface)' : 'var(--ink)'}`);
      el.note.textContent = id === goal ? 'goal' : id === start ? 'start' : '';
      let said = `Place ${id}`;
      if (id === start) said += ', the start';
      if (id === goal) said += ', the goal';
      if (label != null) said += label === '∞' ? ', not reached yet' : `, label ${label}`;
      if (done) said += ', settled';
      if (mode === 'path' && stepIndex >= 0) said += `, stop ${stepIndex + 1} on your route`;
      if (id === picked) said += ', your choice';
      said += `. Roads: ${adj[id].map(([v, w]) => `${w} to ${v}`).join(', ') || 'none'}.`;
      el.g.setAttribute('aria-label', said);
      if (interactive) el.g.setAttribute('tabindex', readOnly ? '-1' : '0');
    }
    if (mode === 'path') { roTotal.set(`${pathCost()}${unit}`); roRoads.set(path.length - 1); }
    if (mode === 'dijkstra') roSettled.set(`${settled.length} of ${ids.length}`);
    undoBtn.disabled = readOnly || path.length < 2;
    clearBtn.disabled = readOnly || (mode === 'path' ? path.length < 2 : !settled.length && !mistakes);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Road map with places ${ids.join(', ')}. Roads: ${edges.map(([a, b, w]) => `${a} to ${b}, ${w}`).join('; ')}.`);
  }

  function prompt() {
    if (mode === 'path') return `Tap a neighbour of ${start} to start your route.`;
    if (mode === 'pick') return picked ? `Your choice: ${picked}. Tap another place to change it.` : 'Tap the place you choose.';
    if (mode === 'dijkstra') {
      if (phase === 'done') return `Every place is settled. Each label is the shortest distance from ${start}.`;
      if (phase === 'update') return `${current} is settled at ${dist[current]}. Now check its roads: tap each unsettled neighbour of ${current}.`;
      return settled.length ? 'Tap the unsettled place with the smallest label.' : `Only ${start} has a label so far: 0. Tap it to settle it.`;
    }
    return '';
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function nope(id, text, counts = true) {
    const g = nodeEls[id].g;
    g.classList.remove('is-nope');
    void g.getBoundingClientRect();
    g.classList.add('is-nope');
    play('wrong');
    if (counts) { mistakes++; render(); }
    setStatus(text, 'bad');
    env.announce(text);
    if (counts) env.onChange(getState());
  }

  const told = (u) => {
    if (u.old === null) return `${u.to}: ${u.sum - u.road} + ${u.road} = ${u.sum}, its first label.`;
    if (u.better) return `${u.to}: ${u.sum - u.road} + ${u.road} = ${u.sum}, better than ${u.old}.`;
    return `${u.to}: ${u.sum - u.road} + ${u.road} = ${u.sum}, not better than ${u.old}.`;
  };

  function tapDijkstra(v) {
    if (phase === 'done') return;
    if (phase === 'update') {
      if (v === current) { setStatus(prompt()); return; }
      if (!pending.includes(v)) {
        if (settled.includes(v)) nope(v, `${v} is settled: its label is final and cannot improve.`, false);
        else if (lengthOf(current, v) == null) nope(v, `No road joins ${current} and ${v}. Check only the roads that leave ${current}.`);
        else nope(v, `The road to ${v} has been checked already.`, false);
        return;
      }
      const u = relax(v);
      afterUpdates();
      play('drop');
      let text = told(u);
      if (phase === 'pick') text += ' All roads checked. Now settle the place with the smallest label.';
      else if (phase === 'done') text = `${told(u)} ${prompt()}`;
      changed(text, phase === 'done' ? 'good' : '');
      return;
    }
    if (settled.includes(v)) { nope(v, `${v} is already settled.`, false); return; }
    if (!(v in dist)) { nope(v, `${v} has no label yet: no settled place has a road to it.`); return; }
    if (dist[v] > least()) { nope(v, `${v}'s label is ${dist[v]}. An unsettled place with a smaller label has to go first.`); return; }
    const updates = settle(v, !manual);
    play('drop');
    let text;
    if (manual) text = phase === 'update' ? prompt() : `${v} is settled at ${dist[v]}. It has no unsettled neighbours. ${phase === 'done' ? prompt() : 'Settle the next place.'}`;
    else {
      text = `${v} is settled at ${dist[v]}. ${updates.length ? updates.map(told).join(' ') : 'No roads left to check.'}`;
      if (phase === 'done') text = `${v} is settled at ${dist[v]}. ${prompt()}`;
    }
    changed(text, phase === 'done' ? 'good' : '');
  }

  function describePath() {
    if (path.length < 2) return prompt();
    const tail = goal && path[path.length - 1] === goal ? ` You have reached ${goal}.` : '';
    return `Route ${path.join(' → ')}: ${path.slice(1).map((id, i) => lengthOf(path[i], id)).join(' + ')}${path.length > 2 ? ` = ${pathCost()}` : ''}${unit}.${tail}`;
  }

  function tapPath(v) {
    const last = path[path.length - 1];
    const at = path.indexOf(v);
    if (v === last) { if (path.length > 1) { path.pop(); play('pop'); changed(describePath()); } return; }
    if (at >= 0) { path = path.slice(0, at + 1); play('pop'); changed(describePath()); return; }
    if (lengthOf(last, v) == null) { nope(v, `No road joins ${last} and ${v}.`, false); return; }
    path.push(v);
    play('drop');
    changed(describePath(), goal && v === goal ? 'good' : '');
  }

  function tap(id) {
    if (readOnly || !interactive) return;
    if (mode === 'pick') {
      if (Array.isArray(spec.settled) && spec.settled.includes(id)) { nope(id, `${id} is already settled.`, false); return; }
      picked = picked === id ? null : id;
      play('select');
      changed(prompt());
      return;
    }
    if (mode === 'dijkstra') tapDijkstra(id);
    else if (mode === 'path') tapPath(id);
  }

  render();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'pick' && 'picked' in next) picked = pos[next.picked] ? next.picked : null;
      if (mode === 'path' && Array.isArray(next.path)) {
        path = [start];
        for (const id of next.path) { if (id === start && path.length === 1) continue; if (pos[id] && lengthOf(path[path.length - 1], id) != null && !path.includes(id)) path.push(id); else break; }
      }
      if (mode === 'dijkstra') {
        resetRun();
        if (Array.isArray(next.settled)) {
          for (const id of next.settled) { if (phase !== 'pick' || !(id in dist) || settled.includes(id) || dist[id] > least()) break; settle(id, true); }
        }
        if (next.done) {
          while (phase !== 'done') {
            if (phase === 'update') { while (pending.length) relax(pending[0]); afterUpdates(); continue; }
            const open = openLabels().sort();
            settle(open.find((id) => dist[id] === least()), true);
          }
        }
      }
      render();
      setStatus(mode === 'path' ? describePath() : prompt(), mode === 'dijkstra' && phase === 'done' ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

const DEMO = {
  nodes: { A: [56, 150], B: [180, 56], C: [336, 56], D: [250, 236], E: [440, 150], F: [512, 256] },
  edges: [['A', 'B', 2], ['A', 'D', 4], ['B', 'C', 4], ['B', 'D', 3], ['C', 'E', 2], ['D', 'E', 5], ['D', 'F', 9], ['E', 'F', 3]],
};

export const examples = [
  { title: 'dijkstra-map — settle the closest place, roads checked for you', spec: { type: 'dijkstra-map', mode: 'dijkstra', start: 'A', ...DEMO } },
  { title: 'dijkstra-map — check the roads yourself', spec: { type: 'dijkstra-map', mode: 'dijkstra', relax: 'tap', start: 'A', ...DEMO } },
  { title: 'dijkstra-map — trace a route and add it up', spec: { type: 'dijkstra-map', mode: 'path', start: 'A', goal: 'F', unit: 'min', ...DEMO } },
];
