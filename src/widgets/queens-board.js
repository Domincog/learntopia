/**
 * queens-board — the n-queens puzzle, solved the way backtracking solves it:
 * one queen per row, from the top row down. Squares attacked by the queens
 * already on the board are crossed out and refused. When a row has no square
 * left, the learner has to take back the queen in the row above and try
 * another square for it. Squares that were already tried under the same
 * queens are remembered (a small ring), so the search never goes in circles.
 * (A square counts as tried once the row below it has run out of squares; a
 * queen taken back earlier than that leaves her square free.)
 * Every queen put down and every queen taken back is counted.
 *
 * {
 *   type: 'queens-board',
 *   n: 4,                 // board size, 4 to 8
 *   mode: 'rows',         // 'rows': solve by hand, row by row · 'view': a picture
 *   queens: [1, 3],       // queens on the board at the start: the column (counted from 0) of the
 *                         // queen in row 0, row 1, … (always the top rows, one after the other).
 *                         // View mode also takes [[row, column], …] for queens anywhere on the board,
 *                         // and then crosses out every square they attack.
 *   attacks: true,        // cross out the squares that the queens attack
 *   highlight: 2,         // view mode: outline this row (counted from 0), e.g. "which squares here are safe?"
 * }
 *
 * State: { n, queens, placed, row, solved, stuck, free, puts, backs }
 *   queens  the column of the queen in each filled row, top row first, e.g. [1, 3]
 *   placed  how many queens are on the board; `row` is the row to fill next (null when solved)
 *   solved  n queens stand on the board (they never attack each other: such squares are refused)
 *   free    columns of the next row that are neither attacked nor already tried
 *   stuck   the next row has no such column: the only move is to take a queen back
 *   puts    queens put down so far, counting every attempt; `backs`: queens taken back
 *
 * setState accepts { queens: [1, 3, 0, 2] } (puts the queens down, counting one move each).
 *
 * Keyboard: Tab moves through the squares of the live row and the last queen; Enter or Space acts.
 */
import { frame, readout, button, hue, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('queens-board', `
  .widget-queens-board .qb-cell { outline: none; }
  .widget-queens-board .qb-cell.is-live { cursor: pointer; }
  .widget-queens-board .qb-cell:focus-visible .qb-focus { stroke: var(--focus); stroke-width: 4; }
  .widget-queens-board .qb-cell.is-nope .qb-inner { animation: shake 0.4s ease; }
  .widget-queens-board.is-readonly .qb-cell { pointer-events: none; }
  .widget-queens-board .qb-status { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-queens-board .qb-status.is-good { color: var(--green-text); }
  .widget-queens-board .qb-status.is-bad { color: var(--red-text); }
  .widget-queens-board .qb-legend { text-align: center; font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); }
  .widget-queens-board .btn-ghost { box-shadow: none; }
`);

/** Does a queen on (r1, c1) attack the square (r2, c2)? */
export const attacks = (r1, c1, r2, c2) => r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2);

/** The row (index) of a queen that attacks (row, col), or -1. `queens[r]` is the column of the queen in row r. */
export function attacker(queens, row, col) {
  for (let r = 0; r < queens.length; r++) if (r !== row && attacks(r, queens[r], row, col)) return r;
  return -1;
}

const CELL = 60;
const LEFT = 50;
const PAD = 8;

export default function create(spec, env) {
  const n = clamp(Math.round(spec.n || 4), 4, 8);
  const isView = spec.mode === 'view' || env.compact;
  const showAttacks = spec.attacks !== false;
  const highlight = Number.isInteger(spec.highlight) ? spec.highlight : null;
  let readOnly = !!env.readOnly;

  let queens = [];
  let tried = [];        // tried[r]: columns already tried in row r under the queens now standing above it
  let puts = 0;
  let backs = 0;

  // A picture may show queens anywhere: [[row, column], …]
  const loose = isView && Array.isArray(spec.queens) && spec.queens.length > 0 && spec.queens.every((q) => Array.isArray(q))
    ? spec.queens.filter(([r, c]) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < n && c < n)
    : null;
  const looseAttacker = (row, col) => loose.findIndex(([r, c]) => !(r === row && c === col) && attacks(r, c, row, col));
  const validPrefix = (list) => {
    const out = [];
    for (const c of Array.isArray(list) ? list : []) {
      if (!Number.isInteger(c) || c < 0 || c >= n || out.length >= n || attacker(out, out.length, c) >= 0) break;
      out.push(c);
    }
    return out;
  };
  function load(list) {
    queens = validPrefix(list);
    tried = Array.from({ length: n }, (_, r) => new Set(r < queens.length ? [queens[r]] : []));
    puts = queens.length;
    backs = 0;
  }
  load(loose ? [] : spec.queens);

  const freeCols = () => {
    const row = queens.length;
    if (row >= n) return [];
    const out = [];
    for (let c = 0; c < n; c++) if (attacker(queens, row, c) < 0 && !tried[row].has(c)) out.push(c);
    return out;
  };
  const getState = () => {
    const free = freeCols();
    const solved = queens.length === n;
    return { n, queens: queens.slice(), placed: queens.length, row: solved ? null : queens.length, solved, stuck: !solved && !free.length, free, puts, backs };
  };

  /* ---------------------------------------------------------------- scene */
  const W = LEFT + n * CELL + PAD;
  const H = PAD + n * CELL + PAD;
  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, maxWidth: Math.round(W * 1.08), label: spec.alt || `A ${n} by ${n} board for the queens puzzle` });
  const { svg } = fr;
  const gCells = s('g');
  const rowFrame = s('rect', { x: LEFT - 3, width: n * CELL + 6, height: CELL + 6, rx: 9, fill: 'none', stroke: hue('orange'), 'stroke-width': 5, 'pointer-events': 'none' });
  const rowLabels = [];
  for (let r = 0; r < n; r++) {
    const label = s('text.fig-label-sm', { x: LEFT - 10, y: PAD + r * CELL + CELL / 2 + 4, 'text-anchor': 'end' }, `row ${r + 1}`);
    rowLabels.push(label);
    svg.appendChild(label);
  }
  svg.append(gCells, rowFrame);

  const cells = [];
  for (let r = 0; r < n; r++) {
    cells.push([]);
    for (let c = 0; c < n; c++) {
      const x = LEFT + c * CELL;
      const y = PAD + r * CELL;
      const base = s('rect', { x, y, width: CELL, height: CELL, stroke: 'var(--ink)', 'stroke-width': 1.5 });
      const tint = s('rect', { x: x + 1, y: y + 1, width: CELL - 2, height: CELL - 2, 'pointer-events': 'none' });
      const cross = s('path', { d: `M${x + 22} ${y + 22} l16 16 M${x + 38} ${y + 22} l-16 16`, fill: 'none', stroke: hue('red'), 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.75 });
      const ring = s('circle', { cx: x + CELL / 2, cy: y + CELL / 2, r: 8, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 3 });
      const queen = s('g', { transform: `translate(${x + CELL / 2} ${y + CELL / 2})` },
        s('path', { d: 'M-17 15 L-21 -9 L-10 2 L0 -16 L10 2 L21 -9 L17 15 Z', fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
        s('path', { d: 'M-14 9 H14', fill: 'none', stroke: 'var(--edge-strong)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
        s('circle', { cx: -21, cy: -11, r: 3.5, fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }),
        s('circle', { cx: 0, cy: -18, r: 3.5, fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }),
        s('circle', { cx: 21, cy: -11, r: 3.5, fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
      const focus = s('rect.qb-focus', { x: x + 3, y: y + 3, width: CELL - 6, height: CELL - 6, rx: 6, fill: 'none', stroke: 'none' });
      const inner = s('g.qb-inner', base, tint, cross, ring, queen, focus);
      const g = s('g.qb-cell', inner);
      if (!isView) {
        g.setAttribute('role', 'button');
        g.dataset.keys = 'own';
        g.addEventListener('click', () => tap(r, c));
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(r, c); } });
      }
      cells[r].push({ g, base, tint, cross, ring, queen });
      gCells.appendChild(g);
    }
  }

  /* ------------------------------------------------------------- controls */
  const status = h('div.qb-status', { 'aria-live': 'polite' });
  const legend = h('div.qb-legend', '✗ attacked by a queen  ·  ○ tried already: it led nowhere');
  const roPuts = readout('Queens put down', { digits: 0 });
  const roBacks = readout('Taken back', { digits: 0 });
  const backBtn = button('Take back', () => takeBack(), { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Start again', () => {
    if (readOnly) return;
    load([]);
    play('pop');
    changed(prompt());
  }, { icon: 'reset', variant: 'ghost' });
  if (!isView) {
    fr.el.insertBefore(status, fr.readouts);
    fr.el.insertBefore(legend, fr.readouts);
    fr.readouts.append(roPuts.el, roBacks.el);
    fr.buttons.append(backBtn, resetBtn);
  }
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('qb-status', tone && `is-${tone}`); };

  function prompt() {
    const st = getState();
    if (st.solved) return `Solved: ${n} queens, and no two attack each other.`;
    if (st.stuck) {
      if (!queens.length) return 'Every square of row 1 has been tried. The search is over.';
      return `Row ${st.row + 1} has no square left. Back up: take back the queen in row ${st.row}.`;
    }
    return `Put a queen on a free square of row ${st.row + 1}.`;
  }

  /* --------------------------------------------------------------- render */
  function render() {
    const st = getState();
    const live = isView ? highlight : st.row;
    for (let r = 0; r < n; r++) {
      rowLabels[r].setAttribute('style', r === live ? 'fill:var(--ink);font-weight:800' : 'fill:var(--ink-3)');
      for (let c = 0; c < n; c++) {
        const el = cells[r][c];
        const hasQueen = loose ? loose.some(([qr, qc]) => qr === r && qc === c) : queens[r] === c;
        const by = hasQueen ? -1 : loose ? looseAttacker(r, c) : attacker(queens, r, c);
        const attacked = by >= 0 && (loose ? true : r >= queens.length);
        const wasTried = !isView && !hasQueen && !attacked && r === st.row && tried[r].has(c);
        const isLive = !isView && r === st.row && !attacked && !wasTried;
        const isLast = !isView && hasQueen && r === queens.length - 1;
        el.base.setAttribute('fill', (r + c) % 2 ? 'var(--sunken)' : 'var(--surface)');
        el.tint.setAttribute('fill', attacked && showAttacks ? hue('red', 'soft') : isLive ? hue('green', 'soft') : 'transparent');
        el.tint.setAttribute('opacity', attacked ? 0.7 : 1);
        el.cross.setAttribute('visibility', attacked && showAttacks ? 'visible' : 'hidden');
        el.ring.setAttribute('visibility', wasTried ? 'visible' : 'hidden');
        el.queen.setAttribute('visibility', hasQueen ? 'visible' : 'hidden');
        if (!isView) {
          const tappable = !readOnly && (r === st.row || isLast);
          el.g.classList.toggle('is-live', !readOnly && (isLive || isLast));
          el.g.setAttribute('tabindex', tappable ? '0' : '-1');
          let label = `Row ${r + 1}, column ${c + 1}: `;
          if (hasQueen) label += isLast ? 'queen. Press to take it back.' : 'queen.';
          else if (attacked) label += `attacked by the queen in row ${by + 1}.`;
          else if (wasTried) label += 'already tried.';
          else if (r === st.row) label += 'free.';
          else label += 'empty.';
          el.g.setAttribute('aria-label', label);
        }
      }
    }
    if (live != null && live < n) { rowFrame.setAttribute('y', PAD + live * CELL - 3); rowFrame.setAttribute('visibility', 'visible'); } else rowFrame.setAttribute('visibility', 'hidden');
    roPuts.set(puts);
    roBacks.set(backs);
    backBtn.disabled = readOnly || !queens.length;
    resetBtn.disabled = readOnly || (!puts && !backs);
    const list = loose || queens.map((c, r) => [r, c]);
    const where = list.length ? list.map(([r, c]) => `row ${r + 1} column ${c + 1}`).join(', ') : 'none';
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${n} by ${n} board. Queens: ${where}.`);
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function nope(r, c, text) {
    const g = cells[r][c].g;
    g.classList.remove('is-nope');
    void g.getBoundingClientRect();
    g.classList.add('is-nope');
    play('wrong');
    setStatus(text, 'bad');
    env.announce(text);
  }

  function takeBack() {
    if (readOnly || isView || !queens.length) return;
    const exhausted = getState().stuck; // the row below this queen has no square left to try
    const row = queens.length - 1;
    const col = queens.pop();
    if (row + 1 < n) tried[row + 1] = new Set(); // the row below starts afresh under different queens
    // Taken back early: the boards below this square have not all been looked at, so the square has not
    // "led nowhere" and stays free. (Marking it as tried could close off a solution without exploring it.)
    if (!exhausted) tried[row].delete(col);
    backs++;
    play('pop');
    const st = getState();
    changed(st.stuck ? prompt() : `Queen taken back. Row ${row + 1} again: try a square you have not tried yet.`, st.stuck ? 'bad' : '');
  }

  function tap(r, c) {
    if (readOnly || isView) return;
    const st = getState();
    if (queens[r] === c) {
      if (r === queens.length - 1) takeBack();
      else nope(r, c, `Back up one step at a time: take back the queen in row ${queens.length} first.`);
      return;
    }
    if (st.solved) return;
    if (r !== st.row) {
      if (r > st.row) nope(r, c, `One row at a time: row ${st.row + 1} comes next.`);
      return;
    }
    const by = attacker(queens, r, c);
    if (by >= 0) { nope(r, c, `That square is attacked by the queen in row ${by + 1}.`); return; }
    if (tried[r].has(c)) { nope(r, c, 'You tried that square under these same queens, and it led nowhere.'); return; }
    queens.push(c);
    tried[r].add(c);
    puts++;
    play('drop');
    const after = getState();
    changed(prompt(), after.solved ? 'good' : after.stuck ? 'bad' : '');
  }

  render();
  setStatus(prompt(), getState().stuck ? 'bad' : '');
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.queens)) return;
      load(next.queens);
      render();
      const st = getState();
      setStatus(prompt(), st.solved ? 'good' : st.stuck ? 'bad' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'queens-board — four queens, row by row', spec: { type: 'queens-board', n: 4 } },
  { title: 'queens-board — six queens, part-way through', spec: { type: 'queens-board', n: 6, queens: [1, 3] } },
  { title: 'queens-board — a picture with one row marked', spec: { type: 'queens-board', n: 5, mode: 'view', queens: [0, 2], attacks: false, highlight: 2 } },
];
