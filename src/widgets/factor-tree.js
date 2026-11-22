/**
 * factor-tree — break a number down into primes, one split at a time.
 * The selected composite number is offered all of its factor pairs; pick one
 * and it splits into two branches. Primes are round "atoms" that cannot be
 * split. Whatever route the learner takes, the leaves end up the same.
 *
 * {
 *   type: 'factor-tree',
 *   n: 60,                         // the number at the top
 *   splits: [[60, 6, 10]],         // splits already made: [number, factor, factor], applied in order,
 *                                  //   each to the first unsplit branch (reading left to right) showing that number
 *   equation: true,                // show the running product under the tree ("60 = 2 × 2 × 15")
 *   static: false,                 // true: picture only (for figures), drawn just tall enough for its tree
 *   maxWidth: 520,                 // optional width limit in px
 * }
 *
 * State: { n, splits, first, leaves, primes, complete, count }
 *   splits   — the splits made so far, in order: [[60, 6, 10], [6, 2, 3], …]
 *   first    — the factor pair the top number was split into, smaller first ([6, 10]); null before that
 *   leaves   — the numbers at the ends of the branches, sorted
 *   primes   — the leaves that are prime, sorted
 *   complete — every leaf is prime (so `leaves` is the prime factorisation)
 *   count    — number of splits made
 *
 * setState accepts { splits } in the same form, and { complete: true } to
 * finish any branches that are still composite (smallest prime first).
 */
import { frame, button, hue, s, h, mdInline, icon, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

const W = 480;
const R = 25;       // node "radius"
const ROW = 78;     // vertical distance between levels
const PAD_Y = 40;
const PAD_X = 30;
const SLOT = 92;    // widest spacing between neighbouring leaves

addStyles('factor-tree', `
  /* nothing in the picture is dragged, so a finger that lands on it may still scroll the page */
  .widget-factor-tree .w-canvas svg { touch-action: manipulation; }
  .widget-factor-tree .ft-node { outline: none; }
  .widget-factor-tree .ft-node.is-open { cursor: pointer; }
  .widget-factor-tree .ft-ring { opacity: 0; transition: opacity 0.15s ease; }
  .widget-factor-tree .ft-node.is-selected .ft-ring { opacity: 1; }
  .widget-factor-tree .ft-node:focus-visible .ft-shape { stroke: var(--focus); stroke-width: 4; }
  .widget-factor-tree .ft-eq {
    justify-self: center;
    display: flex; align-items: center; justify-content: center; gap: var(--s2);
    min-height: 2.7em; max-width: 100%;
    padding: var(--s1) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    font-size: 1.15rem;
    text-align: center;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  .widget-factor-tree .ft-eq svg { flex: none; color: var(--green-text); }
  .widget-factor-tree .ft-eq.is-done { border-style: solid; border-color: var(--green); background: var(--green-soft); }
  .widget-factor-tree .ft-chooser { display: grid; gap: var(--s2); justify-items: center; min-height: 92px; align-content: start; }
  .widget-factor-tree .ft-prompt { font-weight: 700; text-align: center; }
  .widget-factor-tree .ft-pairs { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-factor-tree .ft-pairs .btn { min-height: 42px; min-width: 76px; font-size: var(--fs-md); font-variant-numeric: tabular-nums; }
  .widget-factor-tree.is-readonly .ft-node { cursor: default; }
  /* the tree, its equation and two rows of choices have to share a short laptop screen */
  @media (min-width: 700px) and (max-height: 820px) {
    .widget-factor-tree { gap: var(--s2); }
    .widget-factor-tree .ft-eq { min-height: 2.2em; font-size: 1.05rem; }
    .widget-factor-tree .ft-chooser { gap: var(--s1); }
    .widget-factor-tree .ft-pairs .btn { min-height: 36px; min-width: 70px; }
  }
`);

const smallestFactor = (v) => { for (let d = 2; d * d <= v; d++) if (v % d === 0) return d; return v; };
const isPrime = (v) => v > 1 && smallestFactor(v) === v;
const pairsOf = (v) => { const out = []; for (let a = 2; a * a <= v; a++) if (v % a === 0) out.push([a, v / a]); return out; };
const countPrimeFactors = (v) => { let k = 0; let rest = v; while (rest > 1) { rest /= smallestFactor(rest); k++; } return k; };

export default function create(spec, env) {
  const n = Math.max(2, Math.min(9999, Math.round(spec.n || 60)));
  const interactive = !env.compact && !spec.static;
  const showEquation = spec.equation !== false && !env.compact;
  let readOnly = !!env.readOnly;

  const levels = Math.max(2, countPrimeFactors(n)); // a tree can never be deeper than this
  const height = 2 * PAD_Y + (levels - 1) * ROW;
  const fr = frame({ width: W, height, compact: env.compact, maxWidth: spec.maxWidth || 520, label: spec.alt || `Factor tree for ${n}` });
  const { svg } = fr;
  const gEdges = s('g');
  const gNodes = s('g');
  svg.append(gEdges, gNodes);

  /* -------------------------------------------------------------- model */
  let root = null;
  let splits = [];       // { path, v, a, b }
  let selected = null;   // path of the composite leaf whose factor pairs are on offer

  const makeNode = (v, path) => ({ v, path, kids: null });
  const walk = (fn, node = root) => { fn(node); if (node.kids) node.kids.forEach((kid) => walk(fn, kid)); };
  const leaves = () => { const out = []; walk((node) => { if (!node.kids) out.push(node); }); return out; };
  const openLeaves = () => leaves().filter((node) => !isPrime(node.v));
  const find = (path) => { let hit = null; walk((node) => { if (node.path === path) hit = node; }); return hit; };

  function applySplit(node, a, b) {
    if (!node || node.kids || a < 2 || b < 2 || a * b !== node.v) return false;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    node.kids = [makeNode(lo, `${node.path}0`), makeNode(hi, `${node.path}1`)];
    splits.push({ path: node.path, v: node.v, a: lo, b: hi });
    return true;
  }

  /** Rebuild the tree from value-based splits: [[60, 6, 10], …]. */
  function load(list, finish) {
    root = makeNode(n, '');
    splits = [];
    for (const item of list || []) {
      if (!Array.isArray(item) || item.length < 3) continue;
      const [v, a, b] = item.map(Number);
      applySplit(leaves().find((node) => node.v === v), a, b);
    }
    if (finish) {
      for (let guard = 0; guard < 40; guard++) {
        const node = openLeaves()[0];
        if (!node) break;
        const p = smallestFactor(node.v);
        applySplit(node, p, node.v / p);
      }
    }
    const open = openLeaves();
    selected = open.length ? open[0].path : null;
  }

  /* ------------------------------------------------------------ drawing */
  const parts = new Map();   // path -> { g, shape, ring, label, x, y, tx, ty }
  const edges = new Map();   // child path -> line
  let raf = 0;

  function ensurePart(node, parent) {
    let part = parts.get(node.path);
    if (part) return part;
    const g = s('g.ft-node');
    g.dataset.keys = 'own';
    const ring = s('rect.ft-ring', { x: -R - 7, y: -R - 7, width: 2 * R + 14, height: 2 * R + 14, rx: 18, fill: 'none', stroke: hue('blue'), 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' });
    const hit = s('circle', { r: R + 6, fill: 'transparent' });
    const label = s('text.fig-label-lg', { y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    g.append(ring, hit, label);
    g.addEventListener('click', () => choose(node.path));
    g.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(node.path); }
    });
    gNodes.appendChild(g);
    const from = parent ? parts.get(parent.path) : null;
    part = { g, hit, ring, label, shape: null, kind: '', x: from ? from.x : W / 2, y: from ? from.y : PAD_Y, tx: 0, ty: 0 };
    parts.set(node.path, part);
    return part;
  }

  function dress(node, part) {
    const prime = isPrime(node.v);
    const kind = prime ? 'prime' : node.kids ? 'done' : 'open';
    if (part.kind !== kind) {
      if (part.shape) part.shape.remove();
      part.shape = prime
        ? s('circle.ft-shape', { r: R, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 3 })
        : s('rect.ft-shape', {
          x: -R, y: -R, width: 2 * R, height: 2 * R, rx: 11,
          fill: kind === 'open' ? hue('blue') : hue('blue', 'soft'),
          stroke: kind === 'open' ? 'var(--edge-strong)' : 'var(--edge)', 'stroke-width': kind === 'open' ? 3 : 2.5,
        });
      part.g.insertBefore(part.shape, part.label);
      part.kind = kind;
    }
    part.label.textContent = String(node.v);
    part.label.setAttribute('style', kind === 'done' ? '' : 'fill:#1D1B26');
    const canPick = kind === 'open' && interactive;
    part.g.classList.toggle('is-open', canPick);
    part.g.classList.toggle('is-selected', canPick && node.path === selected);
    if (canPick) {
      part.g.setAttribute('tabindex', readOnly ? '-1' : '0');
      part.g.setAttribute('role', 'button');
      part.g.setAttribute('aria-pressed', String(node.path === selected));
      part.g.setAttribute('aria-label', `${node.v}, not prime. Select it to split it.`);
    } else {
      part.g.removeAttribute('tabindex');
      part.g.setAttribute('role', 'img');
      part.g.removeAttribute('aria-pressed');
      part.g.setAttribute('aria-label', prime ? `${node.v}, prime`
        : node.kids ? `${node.v}, split into ${node.kids[0].v} times ${node.kids[1].v}` : `${node.v}, not prime`);
    }
  }

  function place() {
    for (const part of parts.values()) part.g.setAttribute('transform', `translate(${part.x.toFixed(2)} ${part.y.toFixed(2)})`);
    for (const [path, line] of edges) {
      const kid = parts.get(path);
      const mum = parts.get(path.slice(0, -1));
      if (!kid || !mum) continue;
      line.setAttribute('x1', mum.x.toFixed(2));
      line.setAttribute('y1', mum.y.toFixed(2));
      line.setAttribute('x2', kid.x.toFixed(2));
      line.setAttribute('y2', kid.y.toFixed(2));
    }
  }

  function glide(instant) {
    cancelAnimationFrame(raf);
    const list = Array.from(parts.values());
    if (instant || reducedMotion()) {
      for (const part of list) { part.x = part.tx; part.y = part.ty; }
      place();
      return;
    }
    const from = list.map((part) => ({ x: part.x, y: part.y }));
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / 280);
      const ease = 1 - Math.pow(1 - u, 3);
      list.forEach((part, i) => {
        part.x = from[i].x + (part.tx - from[i].x) * ease;
        part.y = from[i].y + (part.ty - from[i].y) * ease;
      });
      place();
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------- controls */
  const eq = h('div.ft-eq');
  const prompt = h('div.ft-prompt');
  const pairRow = h('div.ft-pairs');
  const chooser = h('div.ft-chooser', prompt, pairRow);
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  if (showEquation) fr.el.insertBefore(eq, fr.readouts);
  if (interactive) { fr.el.insertBefore(chooser, fr.readouts); fr.el.appendChild(note); }

  const undoBtn = button('Undo', () => {
    if (readOnly || !splits.length) return;
    const keep = splits.slice(0, -1).map((sp) => [sp.v, sp.a, sp.b]);
    const gone = splits[splits.length - 1];
    load(keep);
    selected = gone.path;
    note.textContent = '';
    play('pop');
    render(false);
    env.onChange(getState());
  }, { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Start again', () => {
    if (readOnly || !splits.length) return;
    load([]);
    note.textContent = '';
    render(false);
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });
  if (interactive) fr.buttons.append(undoBtn, resetBtn);

  function choose(path) {
    if (readOnly || !interactive) return;
    const node = find(path);
    if (!node) return;
    if (isPrime(node.v)) { note.textContent = `${node.v} is prime: it cannot be split any further.`; return; }
    if (node.kids) { note.textContent = `${node.v} is already split into ${node.kids[0].v} × ${node.kids[1].v}.`; return; }
    selected = path;
    note.textContent = '';
    play('tap');
    render(false);
  }

  function split(a, b) {
    if (readOnly) return;
    const node = find(selected);
    if (!applySplit(node, a, b)) return;
    const open = openLeaves();
    // stay in the branch just made if it still needs work, else move to the next one
    const near = open.find((leaf) => leaf.path.startsWith(node.path));
    selected = near ? near.path : open.length ? open[0].path : null;
    note.textContent = '';
    play('drop');
    const viaKeyboard = pairRow.contains(document.activeElement); // the pressed button is about to be replaced
    render(false);
    if (viaKeyboard) (pairRow.querySelector('button') || undoBtn).focus({ preventScroll: true });
    env.announce(open.length
      ? `${node.v} split into ${node.kids[0].v} times ${node.kids[1].v}.`
      : `Finished. ${n} = ${leaves().map((leaf) => leaf.v).sort((p, q) => p - q).join(' times ')}. Every branch ends in a prime.`);
    env.onChange(getState());
  }

  function render(instant) {
    // geometry: leaves take equal slots; a parent sits above the middle of its two branches
    let next = 0;
    const slotOf = new Map();
    const depthOf = new Map();
    (function assign(node, depth) {
      depthOf.set(node.path, depth);
      if (!node.kids) { slotOf.set(node.path, next++); return; }
      node.kids.forEach((kid) => assign(kid, depth + 1));
      slotOf.set(node.path, (slotOf.get(node.kids[0].path) + slotOf.get(node.kids[1].path)) / 2);
    })(root, 0);
    const slotW = Math.min(SLOT, (W - 2 * PAD_X) / next);
    const x0 = W / 2 - (next * slotW) / 2;

    const alive = new Set();
    (function draw(node, parent) {
      alive.add(node.path);
      const part = ensurePart(node, parent);
      dress(node, part);
      part.tx = x0 + (slotOf.get(node.path) + 0.5) * slotW;
      part.ty = PAD_Y + depthOf.get(node.path) * ROW;
      if (parent && !edges.has(node.path)) {
        const line = s('line', { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
        edges.set(node.path, line);
        gEdges.appendChild(line);
      }
      if (node.kids) node.kids.forEach((kid) => draw(kid, node));
    })(root, null);
    for (const [path, part] of parts) if (!alive.has(path)) { part.g.remove(); parts.delete(path); }
    for (const [path, line] of edges) if (!alive.has(path)) { line.remove(); edges.delete(path); }
    glide(instant);

    // running product of the leaves
    const ends = leaves();
    const done = ends.every((leaf) => isPrime(leaf.v));
    const sorted = ends.map((leaf) => leaf.v).sort((p, q) => p - q);
    if (splits.length) {
      const product = sorted.map((v) => (isPrime(v) ? `\\orange{${v}}` : `\\blue{${v}}`)).join(' \\times ');
      eq.replaceChildren(done ? icon('check', { size: 20, stroke: 3 }) : '', h('span', { html: mdInline(`$${n} = ${product}$`) }));
    } else {
      eq.replaceChildren(h('span', { html: mdInline(isPrime(n) ? `$\\orange{${n}}$ is prime` : `$${n} = \\; ?$`) }));
    }
    eq.classList.toggle('is-done', done && splits.length > 0);

    // factor pairs on offer
    const node = selected != null ? find(selected) : null;
    if (interactive) {
      if (node && !node.kids && !isPrime(node.v)) {
        prompt.innerHTML = mdInline(`Split **${node.v}** into two factors:`);
        pairRow.replaceChildren(...pairsOf(node.v).map(([a, b]) => {
          const btn = button(`${a} × ${b}`, () => split(a, b));
          btn.setAttribute('aria-label', `Split ${node.v} into ${a} times ${b}`);
          btn.disabled = readOnly;
          return btn;
        }));
      } else {
        prompt.innerHTML = mdInline(done ? 'Every branch ends in a prime. Nothing is left to split.' : 'Tap a blue number to split it.');
        pairRow.replaceChildren();
      }
      undoBtn.disabled = readOnly || !splits.length;
      resetBtn.disabled = readOnly || !splits.length;
    }
    svg.setAttribute('aria-label', `Factor tree for ${n}. Ends of the branches: ${sorted.join(', ')}.${done ? ' All are prime.' : ''}`);
  }

  function getState() {
    const ends = leaves().map((leaf) => leaf.v).sort((p, q) => p - q);
    const top = splits.find((sp) => sp.path === '');
    return {
      n,
      splits: splits.map((sp) => [sp.v, sp.a, sp.b]),
      first: top ? [top.a, top.b] : null,
      leaves: ends,
      primes: ends.filter(isPrime),
      complete: ends.every(isPrime),
      count: splits.length,
    };
  }

  load(spec.splits);
  if (!interactive) {
    // a picture that will not grow needs only as much room as the tree it shows
    let deepest = 1;
    walk((node) => { deepest = Math.max(deepest, node.path.length); });
    svg.setAttribute('viewBox', `0 0 ${W} ${2 * PAD_Y + deepest * ROW}`);
  }
  render(true);
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      load(Array.isArray(next.splits) ? next.splits : splits.map((sp) => [sp.v, sp.a, sp.b]), !!next.complete);
      note.textContent = '';
      render(true);
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(true); },
    destroy() { cancelAnimationFrame(raf); },
  };
}

export const examples = [
  { title: 'factor-tree — split until every branch ends in a prime', spec: { type: 'factor-tree', n: 60 } },
  { title: 'factor-tree — a finished tree as a picture', spec: { type: 'factor-tree', n: 84, splits: [[84, 7, 12], [12, 3, 4], [4, 2, 2]], static: true } },
];
