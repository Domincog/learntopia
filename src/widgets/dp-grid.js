/**
 * dp-grid — a table to fill in by hand, cell by cell, the way dynamic
 * programming does: every cell is worked out from cells that are already
 * filled. Selecting a cell lights up the cells it reads from; the learner
 * does the arithmetic and types the number.
 *
 * Three kinds of table:
 *
 *   { type: 'dp-grid', kind: 'fib', n: 10 }
 *       One row, cells 1 … n. Cell k = cell (k − 1) + cell (k − 2). Cells 1 and 2 are given (1 and 1).
 *       (A row of more than 7 cells is drawn as two lines, so that the cells stay big enough to tap on a phone.)
 *
 *   { type: 'dp-grid', kind: 'coins', coins: [1, 3, 4], max: 10 }
 *       One row, cells for the amounts 0 … max: the fewest coins that make each amount.
 *       Cell a = 1 + the smallest of the cells a − coin (for every coin that fits). Cell 0 is given (0).
 *
 *   { type: 'dp-grid', kind: 'paths', rows: 4, cols: 4, closed: [[1, 2]] }
 *       A grid of cells: the number of routes from the top-left cell to each cell, moving only right
 *       or down. Cell = cell above + cell to the left. The top-left cell is given (1); closed cells
 *       cannot be entered and count as 0.
 *
 * Options for all kinds:
 *   given: [3, 4]          // further cells shown already filled: cell numbers along the row (fib: k, coins: the amount),
 *                          // or [row, col] pairs for paths, or 'edges' (paths: the whole top row and left column)
 *   ordered: true,         // a cell opens only when every cell it reads from is filled
 *   mark: true,            // a filled cell that does not follow from the cells it reads is marked once the learner moves on
 *   hide: [7],             // static pictures: cells printed as "?" (same addressing as `given`)
 *   static: false,         // true: a picture with every other cell filled in
 *
 * State: { kind, values, filled, total, complete, correct, wrong, firstWrong }
 *   values      one entry per cell in reading order (row by row), null for an empty cell; closed cells hold 0
 *   filled      how many of the learner's cells hold a number, out of `total`
 *   complete    every cell is filled; `correct`: and every one is right
 *   wrong       indices (into values) of filled cells that hold the wrong number
 *   firstWrong  null, or the first of them in reading order:
 *               { index, row, col, head, value, truth, reads: [{ index, row, col, head, value }] }
 *               (head: k for fib, the amount for coins; reads: the cells it should be worked out from, with their true values)
 *
 * setState accepts { values: [...] } (same layout as the state) or { solved: true }.
 *
 * Keyboard: focus a cell, type digits, Backspace deletes, arrow keys or Enter move on.
 */
import { frame, readout, button, hue, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('dp-grid', `
  .widget-dp-grid .dg-cell { outline: none; }
  .widget-dp-grid .dg-cell.is-tap { cursor: pointer; }
  .widget-dp-grid .dg-cell:focus-visible .dg-box { stroke: var(--focus); stroke-width: 5; }
  .widget-dp-grid.is-readonly .dg-cell { pointer-events: none; }
  .widget-dp-grid .dg-line { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-dp-grid .dg-line.is-bad { color: var(--red-text); }
  .widget-dp-grid .dg-line.is-good { color: var(--green-text); }
  .widget-dp-grid .dg-keys { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-dp-grid .dg-keys .btn { min-width: 40px; padding-left: 0; padding-right: 0; font-variant-numeric: tabular-nums; }
  .widget-dp-grid .btn-ghost { box-shadow: none; }
`);

/**
 * The table behind a spec: its cells, which cells each one reads, and the true values.
 * cells[i] = { index, row, col, head, given, closed, reads: [indices] }
 */
export function tableOf(spec) {
  const kind = ['fib', 'coins', 'paths'].includes(spec.kind) ? spec.kind : 'fib';
  const cells = [];
  let rows = 1;
  let cols;
  let coins = [];
  if (kind === 'fib') {
    cols = clamp(Math.round(spec.n || 10), 3, 12);
    for (let k = 1; k <= cols; k++) cells.push({ index: k - 1, row: 0, col: k - 1, head: k, given: k <= 2, closed: false, reads: k <= 2 ? [] : [k - 2, k - 3] });
  } else if (kind === 'coins') {
    coins = (Array.isArray(spec.coins) ? spec.coins : [1, 3, 4]).map(Number).filter((v) => v > 0).sort((a, b) => a - b);
    cols = clamp(Math.round(spec.max || 10), 2, 11) + 1;
    for (let a = 0; a < cols; a++) cells.push({ index: a, row: 0, col: a, head: a, given: a === 0, closed: false, reads: coins.filter((c) => c <= a).map((c) => a - c) });
  } else {
    rows = clamp(Math.round(spec.rows || 4), 2, 6);
    cols = clamp(Math.round(spec.cols || 4), 2, 6);
    const shut = new Set((spec.closed || []).map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const closed = shut.has(`${r},${c}`) && !(r === 0 && c === 0);
        const reads = [];
        if (!closed && r > 0) reads.push((r - 1) * cols + c);
        if (!closed && c > 0) reads.push(r * cols + c - 1);
        cells.push({ index: r * cols + c, row: r, col: c, head: null, given: closed || (r === 0 && c === 0), closed, reads });
      }
    }
  }
  const rule = (cell, values) => {
    if (cell.closed) return 0;
    if (!cell.reads.length) return kind === 'coins' ? 0 : 1;
    const got = cell.reads.map((i) => values[i]);
    if (got.some((v) => v == null)) return null;
    if (kind === 'coins') return 1 + Math.min(...got);
    return got.reduce((a, b) => a + b, 0);
  };
  const truth = [];
  for (const cell of cells) truth.push(rule(cell, truth));
  // extra givens
  const mark = (list, flag) => {
    if (list === 'edges' && kind === 'paths') { for (const cell of cells) if (cell.row === 0 || cell.col === 0) cell[flag] = true; return; }
    for (const item of Array.isArray(list) ? list : []) {
      const cell = Array.isArray(item) ? cells.find((x) => x.row === item[0] && x.col === item[1]) : cells.find((x) => x.head === item);
      if (cell) cell[flag] = true;
    }
  };
  mark(spec.given, 'given');
  mark(spec.hide, 'hidden');
  return { kind, rows, cols, coins, cells, truth, rule };
}

/** Everything the state says about a list of entered values. */
export function judge(spec, values) {
  const t = tableOf(spec);
  const vals = t.cells.map((cell, i) => (cell.given ? t.truth[i] : (Number.isFinite(values && values[i]) ? values[i] : null)));
  const own = t.cells.filter((cell) => !cell.given);
  const wrong = own.filter((cell) => vals[cell.index] != null && vals[cell.index] !== t.truth[cell.index]).map((cell) => cell.index);
  const filled = own.filter((cell) => vals[cell.index] != null).length;
  let firstWrong = null;
  if (wrong.length) {
    const cell = t.cells[wrong[0]];
    const brief = (c) => ({ index: c.index, row: c.row, col: c.col, head: c.head, value: t.truth[c.index] });
    firstWrong = { index: cell.index, row: cell.row, col: cell.col, head: cell.head, value: vals[cell.index], truth: t.truth[cell.index], reads: cell.reads.map((i) => brief(t.cells[i])) };
  }
  return { kind: t.kind, values: vals, filled, total: own.length, complete: filled === own.length, correct: filled === own.length && !wrong.length, wrong, firstWrong };
}

export default function create(spec, env) {
  const t = tableOf(spec);
  const { kind, rows, cols, cells, truth } = t;
  const isStatic = !!spec.static || env.compact;
  const ordered = spec.ordered !== false;
  const marking = spec.mark !== false;
  let readOnly = !!env.readOnly;
  let entered = cells.map(() => null);
  let selected = null;

  const valueAt = (i) => (cells[i].given ? truth[i] : entered[i]);
  const allValues = () => cells.map((_, i) => valueAt(i));
  const isOpen = (cell) => !cell.given && (!ordered || cell.reads.every((i) => valueAt(i) != null));
  const getState = () => judge(spec, entered);

  /* ---------------------------------------------------------------- scene */
  const isRow = kind !== 'paths';
  // A long row is drawn as two lines, so that its cells stay big enough to tap on a phone.
  const perLine = isRow && cols > 7 ? Math.ceil(cols / 2) : cols;
  const lines = isRow ? Math.ceil(cols / perLine) : rows;
  const HEAD = 30; // room above each line of a row table for the cell numbers
  const LEFT = isRow ? 62 : 12;
  const SIZE = isRow ? Math.min(72, Math.floor((560 - LEFT - 8) / perLine)) : 58;
  const TOP = isRow ? HEAD : 26;
  const W = isRow ? 560 : Math.max(280, LEFT + cols * SIZE + 12);
  const H = isRow ? lines * (HEAD + SIZE) + 10 : TOP + rows * SIZE + 12;
  const gridW = perLine * SIZE;
  const ox = isRow ? LEFT + (W - LEFT - 8 - gridW) / 2 : (W - gridW) / 2;
  const spot = (cell) => (isRow
    ? { x: ox + (cell.col % perLine) * SIZE, y: HEAD + Math.floor(cell.col / perLine) * (HEAD + SIZE) }
    : { x: ox + cell.col * SIZE, y: TOP + cell.row * SIZE });
  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, maxWidth: isRow ? 560 : Math.round(W * 1.25), label: spec.alt || 'A table to fill in' });
  const { svg } = fr;
  if (isRow) {
    for (let k = 0; k < lines; k++) {
      const y = HEAD + k * (HEAD + SIZE);
      svg.appendChild(s('text.fig-label-sm', { x: ox - 10, y: y - 9, 'text-anchor': 'end', style: 'fill:var(--ink-3)' }, kind === 'fib' ? 'n' : 'amount'));
      svg.appendChild(s('text.fig-label-sm', { x: ox - 10, y: y + SIZE / 2 + 4, 'text-anchor': 'end', style: 'fill:var(--ink-3)' }, kind === 'fib' ? 'fib(n)' : 'coins'));
    }
  }
  const gLinks = s('g');
  const gCells = s('g');
  svg.append(gCells, gLinks);
  const els = cells.map((cell) => {
    const { x, y } = spot(cell);
    const box = s('rect.dg-box', { x: x + 2, y: y + 2, width: SIZE - 4, height: SIZE - 4, rx: 8, 'stroke-width': 2.5 });
    const text = s('text', { class: 'fig-label-lg', x: x + SIZE / 2, y: y + SIZE / 2 + 9, 'text-anchor': 'middle' });
    const wave = s('path', { d: `M${x + SIZE / 2 - 12} ${y + SIZE - 9} q4 -5 8 0 t8 0 t8 0`, fill: 'none', stroke: hue('red'), 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    const crossed = s('path', { d: `M${x + 16} ${y + 16} L${x + SIZE - 16} ${y + SIZE - 16} M${x + SIZE - 16} ${y + 16} L${x + 16} ${y + SIZE - 16}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    const g = s('g.dg-cell', box, text, wave, crossed);
    if (isRow) svg.appendChild(s('text.fig-label', { x: x + SIZE / 2, y: y - 9, 'text-anchor': 'middle', style: 'fill:var(--ink-2)' }, String(cell.head)));
    if (!isStatic && !cell.given) {
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => select(cell.index, true));
      g.addEventListener('focus', () => { if (selected !== cell.index && isOpen(cell) && !readOnly) select(cell.index, false); });
      g.addEventListener('keydown', (ev) => onKey(ev, cell));
    }
    gCells.appendChild(g);
    return { g, box, text, wave, crossed, x, y };
  });
  if (kind === 'paths') {
    svg.appendChild(s('text.fig-label-sm', { x: ox + SIZE / 2, y: TOP - 8, 'text-anchor': 'middle', style: 'fill:var(--ink-2)' }, 'start'));
  }

  /* ------------------------------------------------------------- controls */
  const line = h('div.dg-line', { 'aria-live': 'polite' });
  const setLine = (text, tone = '') => { line.textContent = text; line.className = cx('dg-line', tone && `is-${tone}`); };
  const roFilled = readout('Filled', { digits: 0 });
  const keys = h('div.dg-keys', { role: 'group', 'aria-label': 'Number keys' });
  const keyBtns = [];
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) keyBtns.push(button(d, () => type(d)));
  keyBtns.push(button('⌫', () => type('back'), { title: 'Delete the last digit' }));
  keyBtns[keyBtns.length - 1].setAttribute('aria-label', 'Delete the last digit');
  keys.append(...keyBtns);
  const resetBtn = button('Clear the table', () => {
    if (readOnly) return;
    entered = cells.map(() => null);
    selected = firstOpen();
    play('pop');
    changed();
  }, { icon: 'reset', variant: 'ghost' });
  if (!isStatic) {
    fr.el.insertBefore(line, fr.readouts);
    fr.readouts.appendChild(roFilled.el);
    fr.el.insertBefore(keys, fr.buttons);
    fr.buttons.appendChild(resetBtn);
  }

  const nameOf = (cell) => (kind === 'fib' ? `fib(${cell.head})` : kind === 'coins' ? `the amount ${cell.head}` : `row ${cell.row + 1}, column ${cell.col + 1}`);
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  function firstOpen() {
    const cell = cells.find((c) => isOpen(c) && entered[c.index] == null);
    return cell ? cell.index : null;
  }
  const breaksRule = (cell) => {
    const v = entered[cell.index];
    if (cell.given || v == null) return false;
    const should = t.rule(cell, allValues());
    return should != null && should !== v;
  };

  function hint() {
    const st = getState();
    if (st.correct) return ['Every cell is filled, and each one follows from the cells before it.', 'good'];
    if (selected == null) {
      if (marking && cells.some(breaksRule)) return ['A marked cell does not follow from the cells it reads. Tap it and work it out again.', 'bad'];
      return ['Tap an open cell, then type its number.', ''];
    }
    const cell = cells[selected];
    if (kind === 'fib') return [`fib(${cell.head}) = fib(${cell.head - 1}) + fib(${cell.head - 2}): add the two cells before it.`, ''];
    if (kind === 'coins') {
      const from = cell.reads.map((i) => cells[i].head);
      if (from.length === 1) return [`Amount ${cell.head}: only a ${cell.head - from[0]} fits as the last coin. Look at the cell for ${from[0]} and add 1.`, ''];
      return [`Amount ${cell.head}: the last coin leaves ${listAnd(from)}. Take the smallest of those cells and add 1.`, ''];
    }
    const up = cell.row > 0 ? cells[selected - cols] : null;
    const leftCell = cell.col > 0 ? cells[selected - 1] : null;
    if (up && leftCell) return [`Routes into this cell arrive from above or from the left: add those two cells.${up.closed || leftCell.closed ? ' A closed cell counts as 0.' : ''}`, ''];
    return [`This cell can only be entered from ${up ? 'above' : 'the left'}: copy that cell.`, ''];
  }

  /* --------------------------------------------------------------- render */
  function render() {
    const st = getState();
    const reads = new Set(selected != null && !isStatic ? cells[selected].reads : []);
    gLinks.replaceChildren();
    cells.forEach((cell, i) => {
      const el = els[i];
      const v = isStatic ? (cell.hidden ? null : truth[i]) : valueAt(i);
      const open = isOpen(cell);
      const isSel = selected === i && !isStatic;
      const flagged = !isStatic && marking && !isSel && breaksRule(cell);
      let fill = 'var(--surface)';
      if (cell.closed) fill = 'var(--sunken)';
      else if (st.correct && !isStatic) fill = hue('green', 'soft');
      else if (flagged) fill = hue('red', 'soft');
      else if (reads.has(i)) fill = hue('blue', 'soft');
      else if (cell.given || isStatic) fill = cell.hidden ? hue('yellow', 'soft') : 'var(--sunken)';
      el.box.setAttribute('fill', fill);
      const locked = !isStatic && !cell.given && !open;
      el.box.setAttribute('stroke', isSel ? hue('orange') : reads.has(i) ? hue('blue') : flagged ? hue('red') : locked ? 'var(--hair)' : 'var(--ink)');
      el.box.setAttribute('stroke-width', isSel ? 5 : 2.5);
      el.box.setAttribute('stroke-dasharray', locked ? '5 5' : 'none');
      el.text.textContent = cell.closed ? '' : v == null ? (isStatic && cell.hidden ? '?' : '') : String(v);
      el.text.setAttribute('style', `stroke:none;font-size:${isRow ? 26 : 24}px`);
      el.wave.setAttribute('visibility', flagged ? 'visible' : 'hidden');
      el.crossed.setAttribute('visibility', cell.closed ? 'visible' : 'hidden');
      if (!isStatic && !cell.given) {
        el.g.classList.toggle('is-tap', !readOnly && open);
        el.g.setAttribute('tabindex', !readOnly && open ? '0' : '-1');
        el.g.setAttribute('aria-label', `Cell for ${nameOf(cell)}: ${v == null ? (open ? 'empty' : 'not open yet') : v}${flagged ? ', does not follow from the cells it reads' : ''}${isSel ? ', selected' : ''}`);
      }
    });
    if (selected != null && !isStatic && kind === 'paths') {
      const to = els[selected];
      for (const i of cells[selected].reads) {
        const from = els[i];
        const dx = Math.sign(to.x - from.x);
        const dy = Math.sign(to.y - from.y);
        const cxm = (from.x + to.x) / 2 + SIZE / 2;
        const cym = (from.y + to.y) / 2 + SIZE / 2;
        gLinks.appendChild(s('path', {
          d: `M${cxm - dx * 9} ${cym - dy * 9} L${cxm + dx * 9} ${cym + dy * 9} M${cxm + dx * 9 - (dx * 6 + dy * 5)} ${cym + dy * 9 - (dy * 6 + dx * 5)} L${cxm + dx * 9} ${cym + dy * 9} L${cxm + dx * 9 - (dx * 6 - dy * 5)} ${cym + dy * 9 - (dy * 6 - dx * 5)}`,
          fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        }));
      }
    }
    roFilled.set(`${st.filled} of ${st.total}`);
    const canType = !readOnly && selected != null;
    keyBtns.forEach((b) => { b.disabled = !canType; });
    resetBtn.disabled = readOnly || !st.filled;
    const [text, tone] = hint();
    setLine(text, tone);
    const said = cells.filter((c) => !c.closed).map((c) => `${nameOf(c)}: ${(isStatic ? (c.hidden ? null : truth[c.index]) : valueAt(c.index)) ?? 'empty'}`).join('; ');
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${said}.`);
  }

  function changed() {
    render();
    env.onChange(getState());
  }

  function select(i, byTap) {
    if (readOnly || isStatic) return;
    const cell = cells[i];
    if (cell.given) return;
    if (!isOpen(cell)) {
      if (byTap) { play('wrong'); setLine('That cell is not open yet. Fill the cells it is worked out from first.', 'bad'); }
      return;
    }
    selected = i;
    if (byTap) play('tap');
    render();
  }

  function type(key) {
    if (readOnly || isStatic || selected == null) return;
    const cur = entered[selected];
    if (key === 'back') entered[selected] = cur == null || cur < 10 ? null : Math.floor(cur / 10);
    else {
      const next = cur == null || cur === 0 ? Number(key) : cur * 10 + Number(key);
      if (next > 999) return;
      entered[selected] = next;
    }
    // a cell that depended on this one may now have to close again
    if (ordered) for (const cell of cells) if (!cell.given && entered[cell.index] != null && !cell.reads.every((i) => valueAt(i) != null)) entered[cell.index] = null;
    play('tick');
    changed();
  }

  function move(delta) {
    const order = cells.filter((c) => isOpen(c)).map((c) => c.index);
    if (!order.length) return;
    const at = order.indexOf(selected);
    const next = order[clamp(at + delta, 0, order.length - 1)];
    selected = next;
    render();
    els[next].g.focus();
  }

  function onKey(ev, cell) {
    if (readOnly) return;
    if (/^[0-9]$/.test(ev.key)) { ev.preventDefault(); ev.stopPropagation(); if (selected !== cell.index) select(cell.index, false); type(ev.key); return; }
    if (ev.key === 'Backspace' || ev.key === 'Delete') { ev.preventDefault(); ev.stopPropagation(); type('back'); return; }
    if (ev.key === 'Enter' || ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); ev.stopPropagation(); move(1); return; }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); ev.stopPropagation(); move(-1); }
  }

  if (!isStatic) selected = firstOpen();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.solved) entered = cells.map((cell, i) => (cell.given ? null : truth[i]));
      else if (Array.isArray(next.values)) entered = cells.map((cell, i) => (cell.given || !Number.isFinite(next.values[i]) ? null : Math.round(next.values[i])));
      selected = firstOpen();
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (readOnly) selected = null; render(); },
  };
}

export const examples = [
  { title: 'dp-grid — Fibonacci numbers from left to right', spec: { type: 'dp-grid', kind: 'fib', n: 10 } },
  { title: 'dp-grid — fewest coins for every amount', spec: { type: 'dp-grid', kind: 'coins', coins: [1, 3, 4], max: 10 } },
  { title: 'dp-grid — routes through a grid', spec: { type: 'dp-grid', kind: 'paths', rows: 4, cols: 4, given: 'edges' } },
  { title: 'dp-grid — a picture with one cell hidden', spec: { type: 'dp-grid', kind: 'paths', rows: 3, cols: 4, closed: [[1, 1]], static: true, hide: [[2, 3]] } },
];
