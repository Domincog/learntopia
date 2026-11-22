/**
 * Picture Logic (nonogram). The numbers beside each row and above each
 * column give the lengths of the runs of filled cells in that line, in
 * order. Fill the grid so every line matches.
 *
 * Generated boards are checked with a line-by-line logic solver, so every
 * puzzle has exactly one solution and can be solved without guessing.
 */
import { h, cx } from '../core/dom.js';
import { play } from '../core/audio.js';

const SIZES = { easy: 5, medium: 7, hard: 10 };

export function cluesOf(line) {
  const out = [];
  let run = 0;
  for (const v of line) {
    if (v === 1) run++;
    else if (run) { out.push(run); run = 0; }
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}

/** Every way to place the clue's blocks in a line of length n. */
function placements(clue, n) {
  if (clue.length === 1 && clue[0] === 0) return [new Array(n).fill(0)];
  const out = [];
  (function rec(idx, acc) {
    if (idx === clue.length) { out.push(acc.concat(new Array(n - acc.length).fill(0))); return; }
    let need = clue.length - idx - 1;
    for (let k = idx; k < clue.length; k++) need += clue[k];
    for (let start = acc.length; start + need <= n; start++) {
      const next = acc.concat(new Array(start - acc.length).fill(0), new Array(clue[idx]).fill(1));
      if (idx < clue.length - 1) next.push(0);
      rec(idx + 1, next);
    }
  })(0, []);
  return out;
}

/** Can the puzzle be completed using single-line deductions only? */
export function lineSolvable(rowClues, colClues) {
  const n = rowClues.length;
  const m = colClues.length;
  const grid = Array.from({ length: n }, () => new Array(m).fill(-1));
  const rowOpts = rowClues.map((c) => placements(c, m));
  const colOpts = colClues.map((c) => placements(c, n));
  let changed = true;
  const settle = (opts, read, write, len) => {
    const fits = opts.filter((p) => p.every((v, i) => read(i) === -1 || read(i) === v));
    if (!fits.length) return false;
    for (let i = 0; i < len; i++) {
      if (read(i) !== -1) continue;
      const v = fits[0][i];
      if (fits.every((p) => p[i] === v)) { write(i, v); changed = true; }
    }
    return true;
  };
  while (changed) {
    changed = false;
    for (let r = 0; r < n; r++) if (!settle(rowOpts[r], (i) => grid[r][i], (i, v) => { grid[r][i] = v; }, m)) return false;
    for (let c = 0; c < m; c++) if (!settle(colOpts[c], (i) => grid[i][c], (i, v) => { grid[i][c] = v; }, n)) return false;
  }
  return grid.every((row) => row.every((v) => v !== -1));
}

const FALLBACK = {
  5: ['01110', '11111', '11011', '11111', '01110'],
  7: ['0011100', '0111110', '1111111', '1101011', '1111111', '0110110', '0010100'],
  10: ['0001111000', '0011111100', '0111111110', '1110110111', '1111111111', '1111111111', '1101111011', '0110000110', '0011111100', '0001111000'],
};

function generate(rng, n) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const density = rng.float(0.5, 0.68);
    const solution = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng.bool(density) ? 1 : 0)));
    if (solution.some((row) => !row.includes(1))) continue;
    if (solution[0].map((_, c) => solution.some((row) => row[c] === 1)).includes(false)) continue;
    const rows = solution.map(cluesOf);
    const cols = solution[0].map((_, c) => cluesOf(solution.map((row) => row[c])));
    if (lineSolvable(rows, cols)) return { solution, rows, cols };
  }
  const solution = FALLBACK[n].map((line) => line.split('').map(Number));
  return { solution, rows: solution.map(cluesOf), cols: solution[0].map((_, c) => cluesOf(solution.map((row) => row[c]))) };
}

export default {
  id: 'nonogram',
  howTo: [
    'Each number is the length of a run of filled cells in that row or column, in order. "3 1" means a run of 3, a gap, then a single cell.',
    'Tap a cell to fill it. Switch to ✕ mode to mark cells you know are empty.',
    'Start with the biggest numbers: a run of 4 in a row of 5 must cover the middle three cells.',
  ],
  levels: [{ id: 'easy', label: '5 × 5' }, { id: 'medium', label: '7 × 7' }, { id: 'hard', label: '10 × 10' }],

  create({ rng, level = 'easy', onChange, onSolved }) {
    const n = SIZES[level] || 5;
    const { solution, rows, cols } = generate(rng, n);
    let cells;       // 0 blank, 1 filled, 2 crossed
    let mode = 1;
    let solved;
    let moves;
    let paint = null;

    const cellEls = [];
    const rowEls = [];
    const colEls = [];
    const maxRow = Math.max(...rows.map((c) => c.length));
    const board = h('div.pz-nono', { style: { '--n': n, '--clue': maxRow } });
    const fillBtn = h('button.filter', { type: 'button', 'aria-pressed': 'true' }, '■ Fill');
    const crossBtn = h('button.filter', { type: 'button', 'aria-pressed': 'false' }, '✕ Mark empty');
    const setMode = (m) => { mode = m; fillBtn.setAttribute('aria-pressed', String(m === 1)); crossBtn.setAttribute('aria-pressed', String(m === 2)); };
    fillBtn.addEventListener('click', () => setMode(1));
    crossBtn.addEventListener('click', () => setMode(2));

    const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
    const rowLine = (r) => cells.slice(r * n, r * n + n);
    const colLine = (c) => Array.from({ length: n }, (_, r) => cells[r * n + c]);

    function refresh() {
      cellEls.forEach((el, i) => {
        el.classList.toggle('is-filled', cells[i] === 1);
        el.classList.toggle('is-crossed', cells[i] === 2);
        el.setAttribute('aria-label', `Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}: ${['blank', 'filled', 'marked empty'][cells[i]]}`);
      });
      let ok = true;
      rows.forEach((clue, r) => { const done = same(cluesOf(rowLine(r)), clue); rowEls[r].classList.toggle('is-done', done); if (!done) ok = false; });
      cols.forEach((clue, c) => { const done = same(cluesOf(colLine(c)), clue); colEls[c].classList.toggle('is-done', done); if (!done) ok = false; });
      if (ok && !solved) {
        solved = true;
        cellEls.forEach((el, i) => { if (cells[i] !== 1) el.classList.remove('is-crossed'); });
        board.classList.add('is-solved');
        onSolved({ moves });
      }
    }

    function setCell(i, v) {
      if (solved || cells[i] === v) return;
      cells[i] = v;
      moves++;
      play('tap');
      refresh();
      onChange();
    }

    // header row: corner + column clues
    board.appendChild(h('div.pz-nono-corner'));
    cols.forEach((clue) => {
      const el = h('div.pz-nono-col', clue.map((v) => h('span', String(v))));
      colEls.push(el);
      board.appendChild(el);
    });
    for (let r = 0; r < n; r++) {
      const rowEl = h('div.pz-nono-row', rows[r].map((v) => h('span', String(v))));
      rowEls.push(rowEl);
      board.appendChild(rowEl);
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const btn = h('button.pz-nono-cell', { type: 'button', class: cx(c % 5 === 4 && c < n - 1 && 'is-vline', r % 5 === 4 && r < n - 1 && 'is-hline') });
        btn.addEventListener('pointerdown', (ev) => {
          if (solved || ev.button > 0) return;
          paint = cells[i] === mode ? 0 : mode;
          setCell(i, paint);
          try { btn.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
          ev.preventDefault();
        });
        btn.addEventListener('pointerenter', () => { if (paint !== null) setCell(i, paint); });
        btn.addEventListener('keydown', (ev) => {
          const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: n, ArrowUp: -n }[ev.key];
          if (step) {
            ev.preventDefault();
            const j = i + step;
            if (j >= 0 && j < n * n && !(Math.abs(step) === 1 && Math.floor(j / n) !== r)) cellEls[j].focus();
          } else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); setCell(i, cells[i] === 1 ? 0 : 1); }
          else if (ev.key.toLowerCase() === 'x') { ev.preventDefault(); setCell(i, cells[i] === 2 ? 0 : 2); }
        });
        cellEls.push(btn);
        board.appendChild(btn);
      }
    }
    const stopPaint = () => { paint = null; };
    window.addEventListener('pointerup', stopPaint);
    window.addEventListener('pointercancel', stopPaint);

    const reset = () => { cells = new Array(n * n).fill(0); solved = false; moves = 0; board.classList.remove('is-solved'); };
    reset();
    refresh();

    return {
      el: h('div.pz-nono-wrap', board, h('div.pz-nono-modes', { role: 'group', 'aria-label': 'Drawing mode' }, fillBtn, crossBtn)),
      restart() { reset(); refresh(); onChange(); },
      hint() {
        if (solved) return;
        const wrong = [];
        for (let i = 0; i < n * n; i++) {
          const want = solution[Math.floor(i / n)][i % n];
          if ((want === 1 && cells[i] !== 1) || (want === 0 && cells[i] === 1)) wrong.push(i);
        }
        if (!wrong.length) return;
        const i = rng.pick(wrong);
        const want = solution[Math.floor(i / n)][i % n];
        setCell(i, want === 1 ? 1 : 2);
        cellEls[i].classList.add('is-hint');
      },
      status: () => `${cells.filter((v) => v === 1).length} of ${solution.flat().filter(Boolean).length} cells filled`,
      share: () => `Picture Logic ${n}×${n}: solved\n${solution.map((row) => row.map((v) => (v ? '■' : '□')).join('')).join('\n')}`,
      destroy() {
        window.removeEventListener('pointerup', stopPaint);
        window.removeEventListener('pointercancel', stopPaint);
      },
    };
  },
};
