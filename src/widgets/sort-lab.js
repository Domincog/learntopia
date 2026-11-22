/**
 * sort-lab — sort a row the way a machine has to: by comparing two things
 * and swapping two things, and nothing else. Every comparison and every swap
 * is counted.
 *
 * Modes
 *   'free'       Tap two bars: that compares them. Then swap them if you like.
 *                With `hidden: true` the bars are closed boxes of unknown
 *                weight, so comparing is the only way to learn anything.
 *   'bubble'     Guided bubble sort. The pair to compare is highlighted and
 *                the learner decides each time: swap or leave?
 *   'selection'  Guided selection sort. The learner taps the shortest bar
 *                that is not locked yet; the widget counts the comparisons a
 *                machine needs to find it and swaps it into place.
 *   'watch'      The machine runs bubble sort on its own. The learner picks
 *                the row length and reads off the number of comparisons.
 *
 * {
 *   type: 'sort-lab',
 *   mode: 'free',
 *   values: [4, 2, 5, 1, 3],    // heights from left to right (default: 1…n, shuffled)
 *   n: 5,                       // row length when `values` is omitted (3 to 8)
 *   hidden: false,              // free mode: hide the values ("mystery boxes")
 *   sizes: [5, 10, 20],         // watch mode: the row lengths on offer (up to 24)
 * }
 *
 * State: { values, sorted, comparisons, swaps, done, mistakes, runs }
 *   values       the current order, left to right
 *   sorted       the row is in increasing order
 *   comparisons, swaps   counted so far for the current row
 *   done         guided modes: the algorithm has finished (free: same as sorted)
 *   mistakes     guided modes: wrong decisions (they are refused, not carried out)
 *   runs         watch mode: comparisons used by each finished run, e.g. { 5: 10, 10: 45 }
 *
 * setState accepts { values: [...] } (free mode: put the bars in this order),
 * { sorted: true } or { done: true } (finish the job; guided modes play the
 * algorithm to its end with the true counts) and { runs: [5, 10, 20] }
 * (watch mode: mark these row lengths as run).
 */
import { frame, readout, hue, s, h, cx, clamp, icon, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 236;
const BASE = 184;      // y of the shelf the bars stand on
const TALL = 138;      // height of the tallest bar
const MARGIN = 20;
const LETTERS = 'ABCDEFGH';

addStyles('sort-lab', `
  .widget-sort-lab .w-canvas svg { touch-action: manipulation; }
  .widget-sort-lab .sl-bar { transition: transform 0.24s var(--ease-out); outline: none; }
  .widget-sort-lab .sl-bar.is-tap { cursor: pointer; }
  .widget-sort-lab .sl-bar:focus-visible .sl-body { stroke: var(--focus); stroke-width: 4; }
  .widget-sort-lab .sl-bar.is-nope .sl-inner { animation: shake 0.4s ease; }
  .widget-sort-lab.is-fast .sl-bar { transition: none; }
  .widget-sort-lab .sl-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-sort-lab .sl-row:empty { display: none; }
  .widget-sort-lab .sl-row .btn { min-height: 46px; min-width: 112px; }
  .widget-sort-lab .sl-sizes .btn { min-width: 0; }
  .widget-sort-lab .sl-sizes .btn[aria-pressed='true'] { background: var(--ink); color: var(--paper); }
  .widget-sort-lab .sl-status { min-height: 1.5em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-sort-lab .sl-status.is-good { color: var(--green-text); }
  .widget-sort-lab .sl-status.is-bad { color: var(--red-text); }
  .widget-sort-lab .sl-runs { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; min-height: 32px; }
  .widget-sort-lab .sl-runs-label { flex: 1 1 100%; text-align: center; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .widget-sort-lab .sl-run {
    display: inline-flex; align-items: baseline; gap: 0.4rem; padding: 0.2rem 0.7rem;
    border: var(--bw) dashed var(--hair); border-radius: 999px; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-3);
  }
  .widget-sort-lab .sl-run b { font-family: var(--font-mono); }
  .widget-sort-lab .sl-run.is-done { border-style: solid; border-color: var(--green); background: var(--green-soft); color: var(--green-text); }
`);

const isSorted = (list) => list.every((v, i) => i === 0 || list[i - 1] <= v);

export default function create(spec, env) {
  const mode = ['free', 'bubble', 'selection', 'watch'].includes(spec.mode) ? spec.mode : 'free';
  const hidden = mode === 'free' && !!spec.hidden;
  const sizes = mode === 'watch' ? (Array.isArray(spec.sizes) && spec.sizes.length ? spec.sizes : [5, 10, 20]).map((v) => clamp(Math.round(v), 3, 24)) : [];
  let readOnly = !!env.readOnly;

  /** A shuffled row 1…n that is neither sorted nor exactly reversed. */
  function shuffled(n) {
    const base = Array.from({ length: n }, (_, i) => i + 1);
    let out = env.rng.shuffle(base);
    for (let guard = 0; guard < 30 && (isSorted(out) || isSorted(out.slice().reverse())); guard++) out = env.rng.shuffle(base);
    return out;
  }
  const given = Array.isArray(spec.values) && spec.values.length >= 2 ? spec.values.map(Number) : null;
  const firstN = mode === 'watch' ? sizes[0] : given ? given.length : clamp(Math.round(spec.n || 5), 3, 8);

  // The row: bars[id] = { value }, order = ids from left to right.
  let weights = [];       // value of bar id
  let order = [];         // bar ids, left to right
  let comparisons = 0;
  let swaps = 0;
  let mistakes = 0;
  let done = false;
  let revealed = !hidden;
  let sel = [];           // free mode: selected bar ids (at most 2)
  let verdict = null;     // free mode: { big, small } from the last comparison
  let pass = 0;           // bubble: finished passes
  let at = 0;             // bubble: left position of the pair under the lens
  let locked = 0;         // selection: bars locked on the left; bubble: bars locked on the right
  const runs = {};        // watch: n -> comparisons
  let running = false;
  let timer = 0;
  let lens = null;        // watch: [i, j] positions being compared

  const n = () => order.length;
  const valueAt = (pos) => weights[order[pos]];
  const rowValues = () => order.map((id) => weights[id]);

  /* ---------------------------------------------------------------- scene */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Row of bars to sort' });
  const { svg } = fr;
  svg.appendChild(s('line', { x1: 10, x2: W - 10, y1: BASE, y2: BASE, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  const gBars = s('g');
  const bracket = s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  svg.append(gBars, bracket);
  let bars = [];          // per id: { g, inner, body, label, tag, mark, hit }

  const slot = () => (W - 2 * MARGIN) / n();
  const xOf = (pos) => MARGIN + (pos + 0.5) * slot();
  const barH = (id) => (hidden && !revealed ? Math.min(slot() - 18, 76) : 22 + (weights[id] / Math.max(...weights)) * (TALL - 22));

  function build(values) {
    weights = values.slice();
    order = values.map((_, i) => i);
    comparisons = 0; swaps = 0; mistakes = 0; done = false; sel = []; verdict = null; pass = 0; at = 0; locked = 0; lens = null;
    revealed = !hidden;
    gBars.replaceChildren();
    const tappable = mode === 'free' || mode === 'selection';
    bars = weights.map((_, id) => {
      const body = s('rect.sl-body', { 'stroke-width': 2.5, rx: 7 });
      const label = s('text.fig-label', { 'text-anchor': 'middle' });
      const tag = s('text.fig-label-sm', { 'text-anchor': 'middle' });
      const mark = s('path', { fill: 'none', stroke: hue('green', 'text'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M-8 0 l6 6 l10 -11', transform: `translate(0 ${BASE + 20})` });
      const hit = s('rect', { y: 6, height: H - 12, fill: 'transparent' });
      const inner = s('g.sl-inner', body, label, tag, mark);
      const g = s('g.sl-bar', inner, hit);
      if (tappable && !env.compact) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.classList.add('is-tap');
        g.dataset.keys = 'own';
        g.addEventListener('click', () => tap(id));
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(id); } });
      } else {
        g.setAttribute('role', 'img'); // a labelled picture of one bar
      }
      gBars.appendChild(g);
      return { g, inner, body, label, tag, mark, hit };
    });
  }

  function paint() {
    const count = n();
    const sw = slot();
    const bw = Math.max(8, Math.min(sw - (count > 12 ? 4 : 12), 72));
    const pairPos = mode === 'bubble' && !done ? [at, at + 1] : mode === 'watch' && lens ? lens : null;
    order.forEach((id, pos) => {
      const bar = bars[id];
      const hgt = barH(id);
      const closed = hidden && !revealed;
      const isLocked = done || (mode === 'selection' ? pos < locked : mode === 'free' ? false : pos >= count - locked);
      const inPair = !!pairPos && pairPos.includes(pos);
      const picked = sel.includes(id);
      const lift = picked ? -10 : 0;
      bar.g.style.transform = `translate(${xOf(pos)}px, ${lift}px)`;
      bar.body.setAttribute('x', -bw / 2);
      bar.body.setAttribute('width', bw);
      bar.body.setAttribute('y', BASE - hgt - 1.5);
      bar.body.setAttribute('height', hgt);
      bar.hit.setAttribute('x', -sw / 2);
      bar.hit.setAttribute('width', sw);
      // Colour says what is going on; the bracket, the tick marks and the raised position say it again.
      let fill = hue('blue');
      if (isLocked) fill = hue('green');
      else if (inPair || picked) fill = hue('orange');
      else if (closed) fill = hue('violet', 'soft');
      else if (mode === 'bubble' || mode === 'watch') fill = hue('blue', 'soft');
      bar.body.setAttribute('fill', fill);
      bar.body.setAttribute('stroke', picked ? 'var(--ink)' : 'var(--edge-strong)');
      bar.body.setAttribute('stroke-width', picked ? 4 : 2.5);
      // label: the value above the bar, or the box letter inside a closed box
      bar.label.textContent = closed ? LETTERS[id] : (count > 12 ? '' : String(weights[id]));
      bar.label.setAttribute('class', closed ? 'fig-label-lg' : 'fig-label');
      bar.label.setAttribute('y', closed ? BASE - hgt / 2 + 6 : BASE - hgt - 10);
      let tag = '';
      if (verdict && mode === 'free') tag = id === verdict.big ? (hidden ? 'heavier' : 'bigger') : id === verdict.small ? (hidden ? 'lighter' : 'smaller') : '';
      if (hidden && revealed) tag = `box ${LETTERS[id]}`;
      bar.tag.textContent = tag;
      bar.tag.setAttribute('y', hidden && revealed ? BASE + 20 : BASE - hgt - (closed ? 12 : 30));
      bar.mark.setAttribute('visibility', isLocked && mode !== 'free' ? 'visible' : 'hidden');
      const name = closed ? `Box ${LETTERS[id]}` : `Bar ${weights[id]}`;
      bar.g.setAttribute('aria-label', `${name}, position ${pos + 1} of ${count}${picked ? ', selected' : ''}${isLocked && mode !== 'free' ? ', locked in place' : ''}`);
      if (bar.g.hasAttribute('tabindex')) bar.g.setAttribute('tabindex', readOnly || (mode === 'selection' && isLocked) ? '-1' : '0');
    });
    if (pairPos && mode === 'bubble') {
      const a = xOf(pairPos[0]) - bw / 2;
      const b = xOf(pairPos[1]) + bw / 2;
      bracket.setAttribute('d', `M${a} ${BASE + 9} v9 H${b} v-9`);
    } else bracket.setAttribute('d', '');
    roComparisons.set(comparisons);
    roSwaps.set(swaps);
    svg.setAttribute('aria-label', hidden && !revealed
      ? `${count} closed boxes in a row: ${order.map((id) => LETTERS[id]).join(', ')}.`
      : `Row of bars, left to right: ${rowValues().join(', ')}.`);
    renderControls();
  }

  /* ------------------------------------------------------------- controls */
  const roComparisons = readout('Comparisons', { digits: 0 });
  const roSwaps = readout('Swaps', { digits: 0 });
  const status = h('div.sl-status');
  const row = h('div.sl-row');
  const runsEl = h('div.sl-runs');
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('sl-status', tone && `is-${tone}`); };
  const mkBtn = (text, name, onClick, variant = '') => {
    const btn = h('button', { type: 'button', class: cx('btn btn-sm', variant && `btn-${variant}`) }, name ? icon(name, 16) : null, text);
    btn.addEventListener('click', onClick);
    return btn;
  };
  const swapBtn = mkBtn('Swap', 'repeat', () => (mode === 'bubble' ? decide(true) : swapSelected()), 'primary');
  const leaveBtn = mkBtn('Leave', 'check', () => decide(false));
  const sortBtn = mkBtn('Sort', 'play', () => runWatch(), 'primary');
  const sizeBtns = sizes.map((size) => {
    const btn = mkBtn(`${size} bars`, null, () => chooseSize(size));
    btn.setAttribute('aria-pressed', 'false');
    return btn;
  });

  if (!env.compact) {
    fr.readouts.append(roComparisons.el, roSwaps.el);
    if (mode === 'free') row.append(swapBtn);
    if (mode === 'bubble') row.append(swapBtn, leaveBtn);
    if (mode === 'watch') {
      fr.controls.appendChild(h('div.sl-row.sl-sizes', { role: 'group', 'aria-label': 'Row length' }, sizeBtns));
      row.append(sortBtn);
    }
    fr.buttons.replaceWith(row);
    fr.el.append(fr.canvas, status, fr.controls, row, fr.readouts);
    if (mode === 'watch') fr.el.appendChild(runsEl);
  }

  function renderControls() {
    const idle = !readOnly && !running;
    if (mode === 'free') swapBtn.disabled = !idle || sel.length !== 2;
    if (mode === 'bubble') { swapBtn.disabled = !idle || done; leaveBtn.disabled = !idle || done; }
    if (mode === 'watch') {
      sortBtn.disabled = readOnly || running || done;
      sizeBtns.forEach((btn, i) => { btn.disabled = readOnly; btn.setAttribute('aria-pressed', String(sizes[i] === n())); });
      runsEl.replaceChildren(h('span.sl-runs-label', 'Comparisons needed'), ...sizes.map((size) => h('span', { class: cx('sl-run', runs[size] != null && 'is-done') },
        `${size} bars:`, h('b', runs[size] != null ? String(runs[size]) : '?'))));
    }
  }

  const nameOf = (id) => (hidden && !revealed ? `Box ${LETTERS[id]}` : String(weights[id]));

  /* ------------------------------------------------------------ free mode */
  function swapPositions(i, j) {
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }

  function tap(id) {
    if (readOnly || running) return;
    if (mode === 'selection') { pickSmallest(id); return; }
    if (mode !== 'free' || (done && !hidden)) return;
    if (sel.length === 1 && sel[0] === id) { sel = []; play('select'); paint(); setStatus(prompt()); return; }
    // After a comparison, the next tap starts a new pair, even on a bar from the old one
    // (that is what you do when you walk along a row: A with B, then B with C).
    if (sel.length === 2) { sel = []; verdict = null; }
    sel.push(id);
    play('select');
    if (sel.length === 2) {
      comparisons++;
      const [a, b] = sel;
      verdict = weights[a] > weights[b] ? { big: a, small: b } : { big: b, small: a };
      const text = `${nameOf(verdict.big)} is ${hidden ? 'heavier' : 'bigger'} than ${nameOf(verdict.small)}.`;
      paint();
      setStatus(text);
      env.announce(text);
      env.onChange(getState());
      return;
    }
    paint();
    setStatus(`${nameOf(id)} picked. Tap another one to compare the two.`);
  }

  function swapSelected() {
    if (readOnly || sel.length !== 2) return;
    const i = order.indexOf(sel[0]);
    const j = order.indexOf(sel[1]);
    swapPositions(i, j);
    swaps++;
    const text = `Swapped ${nameOf(sel[0])} and ${nameOf(sel[1])}.`;
    sel = [];
    verdict = null;
    done = !hidden && isSorted(rowValues());
    play('drop');
    paint();
    setStatus(done ? 'The row is in order.' : text, done ? 'good' : '');
    env.onChange(getState());
  }

  /* ---------------------------------------------------------- bubble sort */
  function bubbleStep(swap) {
    comparisons++;
    if (swap) { swapPositions(at, at + 1); swaps++; }
    at++;
    let endOfPass = false;
    if (at >= n() - 1 - pass) {
      pass++; locked++; at = 0; endOfPass = true;
      if (pass >= n() - 1) { locked = n(); done = true; }
    }
    return endOfPass;
  }

  function decide(swap) {
    if (readOnly || done || mode !== 'bubble') return;
    const left = valueAt(at);
    const right = valueAt(at + 1);
    const should = left > right;
    if (swap !== should) {
      mistakes++;
      for (const pos of [at, at + 1]) {
        const g = bars[order[pos]].g;
        g.classList.remove('is-nope');
        void g.getBoundingClientRect();
        g.classList.add('is-nope');
      }
      play('wrong');
      const text = should ? `Look again: ${left} is taller than ${right}, and it stands on the left. Swap them.` : `Look again: ${left} is shorter than ${right}, so this pair is already in order. Leave it.`;
      setStatus(text, 'bad');
      env.announce(text);
      paint();
      env.onChange(getState());
      return;
    }
    const passNo = pass + 1;
    const endOfPass = bubbleStep(swap);
    play(swap ? 'drop' : 'tap');
    paint();
    let text = swap ? `${left} was taller than ${right}: swapped.` : `${left} and ${right} were already in order: left alone.`;
    if (done) text = `Sorted. ${comparisons} comparisons and ${swaps} swap${swaps === 1 ? '' : 's'}.`;
    else if (endOfPass) text += ` End of pass ${passNo}: ${valueAt(n() - locked)} is locked in place.`;
    setStatus(text, done ? 'good' : '');
    env.announce(text);
    env.onChange(getState());
  }

  /* ------------------------------------------------------- selection sort */
  function selectionStep() {
    let best = locked;
    for (let pos = locked + 1; pos < n(); pos++) if (valueAt(pos) < valueAt(best)) best = pos;
    const scanned = n() - locked - 1;
    comparisons += scanned;
    const moved = best !== locked;
    if (moved) { swapPositions(locked, best); swaps++; }
    locked++;
    if (locked >= n() - 1) { locked = n(); done = true; }
    return { scanned, moved };
  }

  function pickSmallest(id) {
    if (done) return;
    const pos = order.indexOf(id);
    if (pos < locked) return;
    let smallest = Infinity;
    for (let p = locked; p < n(); p++) smallest = Math.min(smallest, valueAt(p));
    if (weights[id] !== smallest) {
      mistakes++;
      const g = bars[id].g;
      g.classList.remove('is-nope');
      void g.getBoundingClientRect();
      g.classList.add('is-nope');
      play('wrong');
      const text = `${weights[id]} is not the shortest of the bars that are still unlocked. Look for a shorter one.`;
      setStatus(text, 'bad');
      env.announce(text);
      env.onChange(getState());
      return;
    }
    const left = n() - locked;
    const { scanned, moved } = selectionStep();
    play('drop');
    paint();
    let text = `${weights[id]} is the shortest of ${left}. To be sure, a machine needs ${scanned} comparison${scanned === 1 ? '' : 's'}. ${moved ? 'Swapped into place and locked.' : 'It is already in place: locked.'}`;
    if (done) text = `Sorted. ${comparisons} comparisons and ${swaps} swap${swaps === 1 ? '' : 's'}.`;
    setStatus(text, done ? 'good' : '');
    env.announce(text);
    env.onChange(getState());
  }

  /* ----------------------------------------------------------- watch mode */
  function stopRun() { clearTimeout(timer); timer = 0; running = false; lens = null; fr.el.classList.remove('is-fast'); }

  function chooseSize(size) {
    if (readOnly) return;
    stopRun();
    build(shuffled(size));
    paint();
    setStatus(runs[size] != null ? `A fresh row of ${size} bars. Last time: ${runs[size]} comparisons.` : `A row of ${size} bars. Press Sort.`);
  }

  function finishRun() {
    while (!done) bubbleStep(valueAt(at) > valueAt(at + 1));
    stopRun();
    runs[n()] = comparisons;
    paint();
    const text = `${n()} bars sorted with ${comparisons} comparisons.`;
    setStatus(text, 'good');
    env.announce(text);
    env.onChange(getState());
  }

  function runWatch() {
    if (readOnly || running || done || mode !== 'watch') return;
    running = true;
    const total = (n() * (n() - 1)) / 2;
    const delay = clamp(3400 / total, 14, 280);
    if (reducedMotion()) { finishRun(); return; }
    if (delay < 120) fr.el.classList.add('is-fast');
    setStatus('Sorting…');
    const tick = () => {
      if (done) { finishRun(); return; }
      lens = [at, at + 1];
      paint();
      timer = setTimeout(() => {
        bubbleStep(valueAt(at) > valueAt(at + 1));
        lens = null;
        paint();
        if (delay >= 120) play('tick');
        timer = setTimeout(tick, delay * 0.35);
      }, delay * 0.65);
    };
    paint();
    tick();
  }

  /* ---------------------------------------------------------------- state */
  function prompt() {
    if (mode === 'free') return hidden ? 'Tap two boxes to compare their weights.' : 'Tap two bars to compare them.';
    if (mode === 'bubble') return 'Is the left bar of the marked pair taller? Then swap. Otherwise leave.';
    if (mode === 'selection') return 'Tap the shortest bar that is not locked yet.';
    return `A row of ${n()} bars. Press Sort.`;
  }

  function getState() {
    const values = rowValues();
    const sorted = isSorted(values);
    return { values, sorted, comparisons, swaps, done: mode === 'free' ? sorted : done, mistakes, runs: { ...runs } };
  }

  build(given && mode !== 'watch' ? given : shuffled(firstN));
  paint();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      stopRun();
      if (mode === 'watch') {
        const list = Array.isArray(next.runs) ? next.runs : next.runs && typeof next.runs === 'object' ? Object.keys(next.runs).map(Number) : next.done ? sizes : [];
        for (const size of list) if (sizes.includes(size)) runs[size] = (size * (size - 1)) / 2;
        const last = list.length && sizes.includes(list[list.length - 1]) ? list[list.length - 1] : n();
        build(shuffled(last));
        if (list.length) while (!done) bubbleStep(valueAt(at) > valueAt(at + 1));
        paint();
        setStatus(list.length ? `${n()} bars sorted with ${comparisons} comparisons.` : prompt(), list.length ? 'good' : '');
        return;
      }
      if (Array.isArray(next.values) && next.values.length === n() && mode === 'free') {
        const ids = order.slice();
        const placed = [];
        for (const v of next.values) { const k = ids.findIndex((id) => weights[id] === v); if (k >= 0) placed.push(ids.splice(k, 1)[0]); }
        if (placed.length === n()) order = placed;
        sel = []; verdict = null;
      }
      if (next.sorted || next.done) {
        if (mode === 'free') { order.sort((a, b) => weights[a] - weights[b]); sel = []; verdict = null; }
        if (mode === 'bubble') while (!done) bubbleStep(valueAt(at) > valueAt(at + 1));
        if (mode === 'selection') while (!done) selectionStep();
      }
      if (mode === 'free') done = !hidden && isSorted(rowValues());
      paint();
      if (mode === 'free') setStatus(isSorted(rowValues()) ? 'The row is in order.' : prompt(), isSorted(rowValues()) ? 'good' : '');
      else setStatus(done ? `Sorted. ${comparisons} comparisons and ${swaps} swap${swaps === 1 ? '' : 's'}.` : prompt(), done ? 'good' : '');
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (running) finishRun();
      if (readOnly && hidden && !revealed && isSorted(rowValues())) {
        // the job is done: open the boxes
        revealed = true; sel = []; verdict = null; done = true;
        setStatus(`In order. The boxes weigh ${rowValues().join(', ')}.`, 'good');
      }
      paint();
    },
    destroy() { stopRun(); },
  };
}

export const examples = [
  { title: 'sort-lab — mystery boxes: compare two, swap two', spec: { type: 'sort-lab', mode: 'free', hidden: true, n: 5 } },
  { title: 'sort-lab — bubble sort, one decision at a time', spec: { type: 'sort-lab', mode: 'bubble', values: [4, 2, 5, 1, 3] } },
  { title: 'sort-lab — selection sort', spec: { type: 'sort-lab', mode: 'selection', values: [4, 5, 2, 1, 3] } },
  { title: 'sort-lab — watch the machine and count', spec: { type: 'sort-lab', mode: 'watch', sizes: [5, 10, 20] } },
];
