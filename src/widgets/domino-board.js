/**
 * domino-board — a board of squares to cover with dominoes (two squares
 * each) or L-shaped trominoes (three squares each). Squares can be cut out
 * of the board, which is what makes the two classic puzzles: the chessboard
 * with two opposite corners removed (dominoes), and the 2ⁿ × 2ⁿ board with
 * one square removed (trominoes).
 *
 * {
 *   type: 'domino-board',
 *   rows: 8, cols: 8,
 *   piece: 'domino',         // or 'tromino' (an L: three squares of a 2 × 2 block)
 *   removed: [0, 63],        // squares cut out of the board (row-major indices from 0)
 *   checker: false,          // colour the squares like a chessboard; the top-left square is light
 *   quadrants: false,        // heavy lines that cut the board into four quarters
 *   pieces: [[27, 35, 36]],  // pieces on the board at the start, each a list of squares
 *   lockPieces: false,       // true: those starting pieces cannot be taken off
 *   max: null,               // the most pieces the learner may place; one more replaces their latest
 *   counts: true,            // show the readouts under the board
 *   static: false,           // true: picture only
 * }
 *
 * To place a piece the learner taps its squares one after the other; a piece
 * appears as soon as the tapped squares form one. Tapping a piece takes it off.
 *
 * State: { pieces, count, placed, open, openDark, openLight, complete, stuck, quarters }
 *   pieces     every piece on the board: sorted lists of squares, sorted by their first square
 *   count      how many pieces that is; `placed` counts only the learner's own
 *   open       squares that are neither removed nor covered; openDark / openLight split them by colour
 *              (a square is dark when row + column is odd, counting from 0)
 *   complete   no open square is left
 *   stuck      squares are open, but no further piece fits anywhere
 *   quarters   for each quarter (top-left, top-right, bottom-left, bottom-right): how many of its
 *              squares are gone, that is, removed or covered
 *
 * setState accepts { pieces: [[1, 2], [5, 9]] } (the learner's pieces; locked starting pieces stay).
 */
import { frame, readout, button, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('domino-board', `
  .widget-domino-board .db-cell { cursor: pointer; outline: none; }
  .widget-domino-board .db-cell:focus-visible { stroke: var(--focus); stroke-width: 4; }
  .widget-domino-board.is-readonly .db-cell { cursor: default; }
  .widget-domino-board .db-piece { pointer-events: none; }
  .widget-domino-board .db-plain, .widget-domino-board .db-light { fill: var(--surface); }
  .widget-domino-board .db-dark { fill: var(--gray); }
  .widget-domino-board .db-waiting { fill: var(--orange-soft); }
  /* "dark" squares must stay the darker ones when the whole page is dark */
  :root[data-theme='dark'] .widget-domino-board .db-light { fill: var(--gray); }
  :root[data-theme='dark'] .widget-domino-board .db-dark { fill: var(--sunken); }
`);

const PALETTE = ['blue', 'orange', 'green', 'violet', 'teal', 'pink', 'yellow'];

/** Do these squares form one piece? Domino: two squares sharing a side. Tromino: three squares of one 2 × 2 block. */
export function isPiece(cells, cols, kind) {
  const rc = cells.map((c) => [Math.floor(c / cols), c % cols]);
  if (new Set(cells).size !== cells.length) return false;
  if (kind === 'tromino') {
    if (cells.length !== 3) return false;
    const rs = rc.map((p) => p[0]);
    const cs = rc.map((p) => p[1]);
    return Math.max(...rs) - Math.min(...rs) === 1 && Math.max(...cs) - Math.min(...cs) === 1;
  }
  if (cells.length !== 2) return false;
  return Math.abs(rc[0][0] - rc[1][0]) + Math.abs(rc[0][1] - rc[1][1]) === 1;
}

/** Could these squares still grow into a piece (or are they one already)? */
function mayBecomePiece(cells, cols, kind) {
  if (cells.length <= 1) return true;
  const rc = cells.map((c) => [Math.floor(c / cols), c % cols]);
  const rs = rc.map((p) => p[0]);
  const cs = rc.map((p) => p[1]);
  if (kind === 'tromino') return cells.length <= 3 && Math.max(...rs) - Math.min(...rs) <= 1 && Math.max(...cs) - Math.min(...cs) <= 1;
  return isPiece(cells, cols, kind);
}

/** Is there room for one more piece among the open squares? `open` is a Set of square indices. */
export function hasRoom(open, rows, cols, kind) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (kind === 'tromino') {
      if (r + 1 >= rows || c + 1 >= cols) continue;
      const block = [i, i + 1, i + cols, i + cols + 1].filter((k) => open.has(k));
      if (block.length >= 3) return true;
    } else if (open.has(i) && ((c + 1 < cols && open.has(i + 1)) || (r + 1 < rows && open.has(i + cols)))) return true;
  }
  return false;
}

export default function create(spec, env) {
  const rows = Math.max(1, Math.round(spec.rows || 8));
  const cols = Math.max(1, Math.round(spec.cols || 8));
  const kind = spec.piece === 'tromino' ? 'tromino' : 'domino';
  const size = kind === 'tromino' ? 3 : 2;
  const removed = new Set((spec.removed || []).filter((i) => i >= 0 && i < rows * cols));
  const isStatic = !!spec.static || env.compact;
  const max = spec.max != null ? Math.max(1, Math.round(spec.max)) : null;
  const norm = (p) => p.slice().sort((a, b) => a - b);
  const starting = (spec.pieces || []).map(norm);
  const fixed = spec.lockPieces ? starting : [];
  let mine = spec.lockPieces ? [] : starting.slice();
  let pending = [];
  let readOnly = !!env.readOnly;

  const PAD = 8;
  const cell = Math.min(84, 424 / Math.max(rows, cols));
  const W = cols * cell + 2 * PAD;
  const H = rows * cell + 2 * PAD;
  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, maxWidth: Math.round(W), label: spec.alt || 'A board to cover with pieces' });
  const { svg } = fr;
  const gCells = s('g');
  const gPieces = s('g');
  const gOver = s('g', { 'pointer-events': 'none' });
  svg.append(gCells, gPieces, gOver);
  const X = (c) => PAD + c * cell;
  const Y = (r) => PAD + r * cell;
  const isDark = (i) => (Math.floor(i / cols) + (i % cols)) % 2 === 1;

  const name = kind === 'tromino' ? 'tromino' : 'domino';
  const roPieces = readout(`${name}es`, { digits: 0 });
  const roOpen = readout('open squares', { digits: 0, color: 'orange' });
  const roDark = readout('open dark', { digits: 0 });
  const roLight = readout('open light', { digits: 0 });
  if (!env.compact && spec.counts !== false) {
    fr.readouts.append(roPieces.el, roOpen.el);
    if (spec.checker) fr.readouts.append(roDark.el, roLight.el);
  }

  const all = () => [...fixed, ...mine];
  const coveredBy = () => { const map = new Map(); all().forEach((p, k) => p.forEach((c) => map.set(c, k))); return map; };

  function getState() {
    const covered = coveredBy();
    const open = new Set();
    for (let i = 0; i < rows * cols; i++) if (!removed.has(i) && !covered.has(i)) open.add(i);
    let dark = 0;
    for (const i of open) if (isDark(i)) dark++;
    const quarters = [0, 0, 0, 0];
    for (let i = 0; i < rows * cols; i++) {
      if (!removed.has(i) && !covered.has(i)) continue;
      const q = (Math.floor(i / cols) < rows / 2 ? 0 : 2) + (i % cols < cols / 2 ? 0 : 1);
      quarters[q]++;
    }
    return {
      pieces: all().map(norm).sort((a, b) => a[0] - b[0]),
      count: fixed.length + mine.length, placed: mine.length,
      open: open.size, openDark: dark, openLight: open.size - dark,
      complete: open.size === 0, stuck: open.size > 0 && !hasRoom(open, rows, cols, kind), quarters,
    };
  }

  /** A colour for piece k that none of its neighbours (drawn so far) is using. */
  function colourOf(k, pieces, colours) {
    const near = new Set();
    pieces.forEach((other, j) => {
      if (j >= k || colours[j] == null) return;
      const touches = pieces[k].some((a) => other.some((b) => Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) + Math.abs((a % cols) - (b % cols)) === 1));
      if (touches) near.add(colours[j]);
    });
    for (let t = 0; t < PALETTE.length; t++) { const c = PALETTE[(k + t) % PALETTE.length]; if (!near.has(c)) return c; }
    return PALETTE[k % PALETTE.length];
  }

  const cells = [];
  let focusAt = -1;
  function draw() {
    const covered = coveredBy();
    for (const c of cells) {
      if (!c) continue;
      const taken = covered.has(c.i);
      const waiting = pending.includes(c.i);
      c.el.setAttribute('class', `db-cell ${waiting ? 'db-waiting' : !spec.checker ? 'db-plain' : isDark(c.i) ? 'db-dark' : 'db-light'}`);
      if (!isStatic) c.el.setAttribute('aria-label', `Row ${Math.floor(c.i / cols) + 1}, column ${(c.i % cols) + 1}: ${taken ? `covered by a ${name}` : waiting ? 'chosen' : 'open'}${spec.checker ? (isDark(c.i) ? ', dark square' : ', light square') : ''}`);
    }
    gPieces.replaceChildren();
    const pieces = all();
    const colours = [];
    pieces.forEach((p, k) => {
      colours[k] = colourOf(k, pieces, colours);
      const inset = Math.max(4, cell * 0.09);
      // a domino is one bar; an L is the union of two bars that share the corner square
      const bars = [];
      if (size === 2) bars.push(p);
      else {
        const corner = p.find((a) => p.every((b) => b === a || Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) + Math.abs((a % cols) - (b % cols)) === 1));
        for (const b of p) if (b !== corner) bars.push([corner, b]);
      }
      const box = (bar) => {
        const rs = bar.map((c) => Math.floor(c / cols));
        const cs = bar.map((c) => c % cols);
        return { x: X(Math.min(...cs)) + inset, y: Y(Math.min(...rs)) + inset, width: (Math.max(...cs) - Math.min(...cs) + 1) * cell - 2 * inset, height: (Math.max(...rs) - Math.min(...rs) + 1) * cell - 2 * inset, rx: Math.min(12, cell * 0.2) };
      };
      const g = s('g.db-piece');
      const locked = k < fixed.length;
      for (const bar of bars) g.appendChild(s('rect', { ...box(bar), fill: 'none', stroke: 'var(--edge-strong)', 'stroke-width': 5, 'stroke-linejoin': 'round' }));
      if (size === 2 && spec.checker) {
        // see-through, so that the colours of the two squares underneath stay visible
        g.replaceChildren(s('rect', { ...box(p), fill: hue(colours[k]), 'fill-opacity': 0.5, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      } else {
        for (const bar of bars) g.appendChild(s('rect', { ...box(bar), fill: locked ? hue('gray') : hue(colours[k]), stroke: 'none' }));
      }
      gPieces.appendChild(g);
    });
    const st = getState();
    roPieces.set(st.count);
    roOpen.set(st.open);
    roDark.set(st.openDark);
    roLight.set(st.openLight);
    if (clearBtn) clearBtn.disabled = readOnly || (!mine.length && !pending.length);
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}${st.count} ${name}${st.count === 1 ? '' : 'es'} on the board, ${st.open} square${st.open === 1 ? '' : 's'} open.`);
  }

  function tap(i) {
    if (readOnly || isStatic || removed.has(i)) return;
    const covered = coveredBy();
    if (covered.has(i)) {
      const k = covered.get(i);
      if (k < fixed.length) return;
      mine.splice(k - fixed.length, 1);
      pending = [];
      play('pop');
      env.announce(`${name} taken off.`);
    } else if (pending.includes(i)) {
      pending = pending.filter((c) => c !== i);
    } else {
      const next = [...pending, i];
      pending = mayBecomePiece(next, cols, kind) ? next : [i];
      if (pending.length === size && isPiece(pending, cols, kind)) {
        if (max != null && mine.length >= max) mine.pop();
        mine.push(norm(pending));
        pending = [];
        play('drop');
        env.announce(`${name} placed.`);
      } else play('tap');
    }
    draw();
    env.onChange(getState());
  }

  const move = (i, dr, dc) => {
    let r = Math.floor(i / cols) + dr;
    let c = (i % cols) + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols) {
      const j = r * cols + c;
      if (cells[j]) return j;
      r += dr; c += dc;
    }
    return -1;
  };

  for (let i = 0; i < rows * cols; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    if (removed.has(i)) {
      cells.push(null);
      // a cut-out square: a dashed outline with a cross through it
      gCells.appendChild(s('rect', { x: X(c) + 4, y: Y(r) + 4, width: cell - 8, height: cell - 8, rx: 4, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
      gCells.appendChild(s('path', { d: `M${X(c) + cell * 0.32} ${Y(r) + cell * 0.32}L${X(c) + cell * 0.68} ${Y(r) + cell * 0.68}M${X(c) + cell * 0.68} ${Y(r) + cell * 0.32}L${X(c) + cell * 0.32} ${Y(r) + cell * 0.68}`, stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      continue;
    }
    const el = s('rect', { class: 'db-cell', x: X(c), y: Y(r), width: cell, height: cell, stroke: 'var(--ink)', 'stroke-width': 1.5 });
    if (!isStatic) {
      if (focusAt < 0) focusAt = i;
      el.setAttribute('tabindex', i === focusAt ? '0' : '-1');
      el.setAttribute('role', 'button');
      el.dataset.keys = 'own';
      el.addEventListener('click', () => tap(i));
      el.addEventListener('keydown', (ev) => {
        const step = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key];
        if (step) {
          ev.preventDefault();
          ev.stopPropagation();
          const j = move(i, step[0], step[1]);
          if (j >= 0) { cells[i].el.setAttribute('tabindex', '-1'); cells[j].el.setAttribute('tabindex', '0'); cells[j].el.focus(); }
        } else if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          ev.stopPropagation();
          tap(i);
        }
      });
    }
    cells.push({ i, el });
    gCells.appendChild(el);
  }
  if (spec.quadrants) {
    const mx = X(cols / 2);
    const my = Y(rows / 2);
    gOver.appendChild(s('path', { d: `M${mx} ${PAD - 4}V${H - PAD + 4}M${PAD - 4} ${my}H${W - PAD + 4}`, stroke: hue('red'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '2 9' }));
  }

  let clearBtn = null;
  if (!isStatic) {
    clearBtn = button('Clear the board', () => { if (readOnly) return; mine = []; pending = []; draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(clearBtn);
    fr.el.appendChild(h('p.w-hint', kind === 'tromino'
      ? 'Tap the three squares of an L, one after the other. Tap a piece to take it off.'
      : 'Tap two squares that share a side to lay a domino. Tap a domino to take it off.'));
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.pieces)) return;
      const locked = new Set(fixed.map((p) => p.join()));
      mine = next.pieces.map(norm).filter((p) => isPiece(p, cols, kind) && !locked.has(p.join()));
      pending = [];
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      pending = [];
      draw();
    },
  };
}

export const examples = [
  { title: 'domino-board — the chessboard without two opposite corners', spec: { type: 'domino-board', rows: 8, cols: 8, removed: [0, 63], checker: true } },
  { title: 'domino-board — trominoes on a 4 × 4 board with one square removed', spec: { type: 'domino-board', rows: 4, cols: 4, piece: 'tromino', removed: [6] } },
  { title: 'domino-board — the first tromino of the induction step', spec: { type: 'domino-board', rows: 8, cols: 8, piece: 'tromino', removed: [10], quadrants: true, pieces: [[28, 35, 36]], lockPieces: true, static: true } },
];
