/**
 * logic-grid — a deduction grid for "who goes with what?" puzzles. One
 * category runs down the side, another across the top, and the clues are
 * listed beside the grid. The learner marks each square with a cross
 * (ruled out) or a tick (must be so).
 *
 * {
 *   type: 'logic-grid',
 *   rows: ['Ana', 'Ben', 'Cy'],
 *   cols: ['Cat', 'Dog', 'Fish'],
 *   clues: ['Ana is allergic to cats.', 'Ben’s pet has no legs.'],   // markdown allowed
 *   solution: [1, 2, 0],        // the true column for each row; adds solved / wrong / badCrosses to the state
 *   marks: { '0,0': 'no' },     // squares marked at the start ('no' or 'yes'), keyed "row,col"
 *   lockMarks: false,           // true: the starting marks cannot be changed
 *   autoCross: true,            // a tick rules out the rest of its row and column automatically
 *   nudge: false,               // point out a square that is the last one open in its row or column
 *   static: false,              // true: picture only (for figures)
 *   cell: 52,                   // square size in px
 * }
 *
 * Tap a square to cycle: open → ✗ → ✓ → open. A row or column holds at most
 * one tick, so a new tick replaces the old one. Crosses that follow from a
 * tick are drawn faintly and disappear if the tick is taken back.
 *
 * State: { ticks, marks, complete, open, solved, wrong, badCrosses }
 *   ticks      — for each row, the ticked column index (or null)
 *   marks      — the learner's own marks: { 'row,col': 'no' | 'yes' }
 *   complete   — every row has a tick
 *   open       — number of squares still open
 *   solved     — the ticks equal `solution` (null when the spec has no solution)
 *   wrong      — rows whose tick disagrees with the solution
 *   badCrosses — [row, col] of hand-made crosses on squares that are in fact true
 *
 * setState accepts { ticks: [1, 2, 0] } and/or { marks: { '0,0': 'no' } }.
 */
import { h, cx, button, addStyles, mdInline, icon } from './kit.js';
import { play } from '../core/audio.js';

addStyles('logic-grid', `
  .widget-logic-grid.w-frame { max-width: 640px; }
  .widget-logic-grid .lg-layout { display: flex; flex-wrap: wrap; gap: var(--s4) var(--s5); align-items: center; justify-content: center; }
  .widget-logic-grid .lg-clues { flex: 1 1 220px; min-width: 0; list-style: none; display: grid; gap: var(--s2); align-self: flex-start; }
  .widget-logic-grid .lg-clue {
    display: flex; gap: var(--s2); align-items: flex-start; width: 100%;
    padding: 0.5rem 0.7rem; border: var(--bw) solid var(--hair); border-radius: var(--r);
    background: var(--surface); color: var(--ink); text-align: left; font-size: var(--fs-md); line-height: 1.35;
    transition: opacity 0.15s ease, background-color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .widget-logic-grid button.lg-clue:hover { background: var(--sunken); }
  .widget-logic-grid .lg-clue-num {
    flex: none; display: grid; place-items: center; width: 1.6em; height: 1.6em; border-radius: 50%;
    background: var(--violet-soft); color: var(--violet-text); font-weight: 800; font-size: var(--fs-sm);
  }
  .widget-logic-grid .lg-clue.is-done { opacity: 0.55; }
  .widget-logic-grid .lg-clue.is-done .lg-clue-text { text-decoration: line-through; }
  .widget-logic-grid .lg-board {
    flex: none; display: grid; grid-template-columns: auto repeat(var(--n), var(--cell)); gap: 4px; align-items: center;
    user-select: none; -webkit-user-select: none;
  }
  .widget-logic-grid .lg-colhead { font-size: var(--fs-sm); font-weight: 800; text-align: center; line-height: 1.15; padding-bottom: 2px; overflow-wrap: anywhere; }
  .widget-logic-grid .lg-rowhead { font-size: var(--fs-sm); font-weight: 800; text-align: right; padding-right: var(--s2); white-space: nowrap; }
  .widget-logic-grid .lg-cell {
    width: var(--cell); height: var(--cell); padding: 0; display: grid; place-items: center;
    border: var(--bw) solid var(--edge); border-radius: 10px; background: var(--surface); color: var(--ink-3);
    transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.12s var(--ease-spring);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .widget-logic-grid button.lg-cell:active { transform: scale(0.92); }
  .widget-logic-grid .lg-cell[data-mark='no'] { background: var(--sunken); color: var(--ink-2); }
  .widget-logic-grid .lg-cell[data-mark='auto'] { background: var(--sunken); border-color: var(--hair); color: var(--ink-3); }
  .widget-logic-grid .lg-cell[data-mark='auto'] svg { opacity: 0.6; }
  .widget-logic-grid .lg-cell[data-mark='yes'] { background: var(--green-soft); border-color: var(--green); color: var(--green-text); }
  .widget-logic-grid .lg-cell.is-locked { cursor: default; }
  .widget-logic-grid .lg-cell.is-nudge { outline: 3px dashed var(--violet); outline-offset: 2px; }
  .widget-logic-grid.is-readonly .lg-cell, .widget-logic-grid.is-readonly .lg-clue { pointer-events: none; }
  .widget-logic-grid.is-compact .lg-board { gap: 3px; }
  .widget-logic-grid.is-compact .lg-cell { border-width: 1.5px; border-radius: 6px; }
  .widget-logic-grid.is-compact .lg-colhead, .widget-logic-grid.is-compact .lg-rowhead { font-size: var(--fs-xs); }
  .widget-logic-grid .lg-note { min-height: 1.5em; }
  .widget-logic-grid .lg-note.is-nudge { color: var(--violet-text); font-weight: 700; }
`);

const OPEN = 0;
const CROSS = 1;
const TICK = 2;

export default function create(spec, env) {
  const rows = (spec.rows || []).map(String);
  const cols = (spec.cols || []).map(String);
  const nR = rows.length;
  const nC = cols.length;
  const interactive = !spec.static && !env.compact;
  const autoCross = spec.autoCross !== false;
  const solution = Array.isArray(spec.solution) ? spec.solution : null;
  const cellSize = spec.cell || (env.compact ? 28 : nC >= 5 ? 46 : 52);
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  let mark = rows.map(() => cols.map(() => OPEN));
  const locked = rows.map(() => cols.map(() => false));
  const eachCell = (fn) => { for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) fn(r, c); };

  function clearTicksAround(r, c) {
    for (let j = 0; j < nC; j++) if (j !== c && mark[r][j] === TICK && !locked[r][j]) mark[r][j] = OPEN;
    for (let i = 0; i < nR; i++) if (i !== r && mark[i][c] === TICK && !locked[i][c]) mark[i][c] = OPEN;
  }
  function applyMarks(marks, lock) {
    for (const key in marks || {}) {
      const [r, c] = key.split(',').map(Number);
      if (!(r >= 0 && r < nR && c >= 0 && c < nC)) continue;
      const v = marks[key];
      mark[r][c] = v === 'yes' || v === TICK ? TICK : v === 'no' || v === CROSS ? CROSS : OPEN;
      if (lock && mark[r][c] !== OPEN) locked[r][c] = true;
    }
  }
  applyMarks(spec.marks, !!spec.lockMarks);
  const initial = JSON.stringify(mark);
  const history = [];

  const rowTick = (r) => mark[r].indexOf(TICK);
  const colTick = (c) => { for (let i = 0; i < nR; i++) if (mark[i][c] === TICK) return i; return -1; };
  /** What a square shows: 'yes', 'no' (hand-made cross), 'auto' (follows from a tick) or 'open'. */
  function shown(r, c) {
    if (mark[r][c] === TICK) return 'yes';
    if (mark[r][c] === CROSS) return 'no';
    if (autoCross && (rowTick(r) >= 0 || colTick(c) >= 0)) return 'auto';
    return 'open';
  }
  /** Squares that are the only open one left in a row or column without a tick. */
  function forced() {
    const out = [];
    const add = (r, c, where) => { if (!out.some((f) => f.r === r && f.c === c)) out.push({ r, c, where }); };
    for (let r = 0; r < nR; r++) {
      if (rowTick(r) >= 0) continue;
      const open = cols.map((_, c) => c).filter((c) => shown(r, c) === 'open');
      if (open.length === 1) add(r, open[0], `${rows[r]}’s row`);
    }
    for (let c = 0; c < nC; c++) {
      if (colTick(c) >= 0) continue;
      const open = rows.map((_, r) => r).filter((r) => shown(r, c) === 'open');
      if (open.length === 1) add(open[0], c, `the ${cols[c]} column`);
    }
    return out;
  }

  /* ----------------------------------------------------------------- view */
  const cells = rows.map(() => []);
  const board = h('div.lg-board', {
    role: 'group',
    'aria-label': spec.alt || 'Deduction grid',
    style: { '--n': nC, '--cell': `${cellSize}px` },
  });
  board.dataset.keys = 'own';
  board.appendChild(h('span'));
  for (const name of cols) board.appendChild(h('span.lg-colhead', { html: mdInline(name) }));
  for (let r = 0; r < nR; r++) {
    board.appendChild(h('span.lg-rowhead', { html: mdInline(rows[r]) }));
    for (let c = 0; c < nC; c++) {
      const el = interactive
        ? h('button.lg-cell', { type: 'button', tabindex: r === 0 && c === 0 ? '0' : '-1' })
        : h('span.lg-cell', { role: 'img' });
      if (locked[r][c]) el.classList.add('is-locked');
      if (interactive) {
        el.addEventListener('click', () => tap(r, c));
        el.addEventListener('keydown', (ev) => {
          const dr = ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowUp' ? -1 : 0;
          const dc = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
          if (!dr && !dc) return;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= nR || nc < 0 || nc >= nC) return;
          ev.preventDefault();
          el.tabIndex = -1;
          cells[nr][nc].tabIndex = 0;
          cells[nr][nc].focus();
        });
      }
      cells[r].push(el);
      board.appendChild(el);
    }
  }

  const clueEls = (spec.clues || []).map((text, i) => {
    const inner = [h('span.lg-clue-num', { 'aria-hidden': 'true' }, String(i + 1)), h('span.lg-clue-text', { html: mdInline(text) })];
    if (!interactive) return h('li', h('div.lg-clue', inner));
    const btn = h('button.lg-clue', { type: 'button', 'aria-pressed': 'false', title: 'Tap to mark this clue as used' }, inner);
    btn.addEventListener('click', () => {
      if (readOnly) return;
      const done = !btn.classList.contains('is-done');
      btn.classList.toggle('is-done', done);
      btn.setAttribute('aria-pressed', String(done));
      play('select');
    });
    return h('li', btn);
  });
  const clueList = clueEls.length && !env.compact ? h('ol.lg-clues', { 'aria-label': 'Clues' }, clueEls) : null;

  const defaultNote = 'Tap a square once for ✗ (ruled out), twice for ✓ (must be so).';
  const note = h('p.w-hint.lg-note', { 'aria-live': 'polite' }, interactive ? defaultNote : '');
  const undoBtn = button('Undo', () => {
    if (readOnly || !history.length) return;
    mark = JSON.parse(history.pop());
    render();
    env.onChange(getState());
  }, { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Clear', () => {
    if (readOnly) return;
    history.push(JSON.stringify(mark));
    mark = JSON.parse(initial);
    render();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });

  const root = h('div', { class: cx('w-frame', env.compact && 'is-compact') },
    h('div.lg-layout', clueList, board),
    interactive ? note : null,
    interactive ? h('div.w-buttons', undoBtn, resetBtn) : null,
  );

  const WORDS = { open: 'open', no: 'ruled out', auto: 'ruled out', yes: 'yes' };
  function render() {
    const nudges = spec.nudge && interactive ? forced() : [];
    eachCell((r, c) => {
      const el = cells[r][c];
      const kind = shown(r, c);
      if (el.dataset.mark !== kind) {
        el.dataset.mark = kind;
        el.replaceChildren();
        if (kind === 'yes') el.appendChild(icon('check', { size: Math.round(cellSize * 0.5), stroke: 3.5 }));
        else if (kind !== 'open') el.appendChild(icon('x', { size: Math.round(cellSize * 0.42), stroke: 3 }));
      }
      el.setAttribute('aria-label', `${rows[r]}, ${cols[c]}: ${WORDS[kind]}`);
      el.classList.toggle('is-nudge', nudges.some((f) => f.r === r && f.c === c));
    });
    if (interactive) {
      if (nudges.length) {
        note.textContent = `Only one square is still open in ${nudges[0].where}. It must be a tick.`;
        note.classList.add('is-nudge');
      } else {
        note.textContent = defaultNote;
        note.classList.remove('is-nudge');
      }
      undoBtn.disabled = readOnly || !history.length;
      resetBtn.disabled = readOnly || JSON.stringify(mark) === initial;
    }
  }

  function tap(r, c) {
    if (readOnly || locked[r][c]) return;
    const kind = shown(r, c);
    history.push(JSON.stringify(mark));
    if (kind === 'open') {
      mark[r][c] = CROSS;
      play('tap');
    } else if (kind === 'yes') {
      mark[r][c] = OPEN;
      play('pop');
    } else {
      // a tick fixed by the author cannot be displaced: the square stays ruled out
      const fixed = mark[r].some((v, j) => v === TICK && locked[r][j]) || mark.some((line, i) => line[c] === TICK && locked[i][c]);
      if (fixed) { history.pop(); return; }
      clearTicksAround(r, c);
      mark[r][c] = TICK;
      play('drop');
      env.announce(`${rows[r]} goes with ${cols[c]}.`);
    }
    render();
    env.onChange(getState());
  }

  function getState() {
    const ticks = rows.map((_, r) => { const c = rowTick(r); return c >= 0 ? c : null; });
    const marks = {};
    let open = 0;
    eachCell((r, c) => {
      if (mark[r][c] !== OPEN) marks[`${r},${c}`] = mark[r][c] === TICK ? 'yes' : 'no';
      if (shown(r, c) === 'open') open++;
    });
    const complete = ticks.every((c) => c != null);
    const wrong = [];
    const badCrosses = [];
    if (solution) {
      ticks.forEach((c, r) => { if (c != null && c !== solution[r]) wrong.push(r); });
      eachCell((r, c) => { if (mark[r][c] === CROSS && solution[r] === c) badCrosses.push([r, c]); });
    }
    return { ticks, marks, complete, open, solved: solution ? complete && !wrong.length : null, wrong, badCrosses };
  }

  render();
  if (readOnly) root.classList.add('is-readonly');

  return {
    el: root,
    getState,
    setState(next) {
      if (!next || (!next.marks && !Array.isArray(next.ticks))) return;
      eachCell((r, c) => { if (!locked[r][c]) mark[r][c] = OPEN; });
      if (next.marks) {
        for (const key in next.marks) {
          const [r, c] = key.split(',').map(Number);
          if (r >= 0 && r < nR && c >= 0 && c < nC && !locked[r][c]) mark[r][c] = next.marks[key] === 'yes' ? TICK : next.marks[key] === 'no' ? CROSS : OPEN;
        }
      }
      if (Array.isArray(next.ticks)) {
        next.ticks.forEach((c, r) => {
          if (c == null || r >= nR || c < 0 || c >= nC || locked[r][c]) return;
          clearTicksAround(r, c);
          mark[r][c] = TICK;
        });
      }
      history.length = 0;
      render();
    },
    setReadOnly(v) { readOnly = !!v; root.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  {
    title: 'logic-grid — three friends, three pets',
    spec: {
      type: 'logic-grid',
      rows: ['Ana', 'Ben', 'Cy'], cols: ['Cat', 'Dog', 'Fish'],
      clues: ['Ana is allergic to cats.', 'Ben’s pet has no legs.'],
      solution: [1, 2, 0], nudge: true,
    },
  },
  {
    title: 'logic-grid — static, with starting marks',
    spec: {
      type: 'logic-grid', static: true,
      rows: ['Ali', 'Bea', 'Cal', 'Dee'], cols: ['1st', '2nd', '3rd', '4th'],
      marks: { '0,0': 'no', '0,3': 'no', '1,3': 'yes', '3,2': 'yes' },
    },
  },
];
