/**
 * grid — a rows × cols board of tappable cells. Useful for area models,
 * fractions, the sieve of Eratosthenes, pixel/binary pictures, arrays…
 *
 * {
 *   type: 'grid',
 *   rows: 10, cols: 10,
 *   on: [0, 11, 22],            // initially selected cell indices (row-major, 0-based)
 *   locked: [0],                // cells that cannot be changed
 *   colors: ['blue'],           // tapping cycles: off -> colors[0] -> colors[1] … -> off
 *   labels: 'index1',           // 'index' (0-based), 'index1' (1-based), an array, or (i, row, col) => text
 *   shape: 'square',            // or 'circle'
 *   cell: 40,                   // max cell size in px
 *   max: 12,                    // optional cap on selected cells
 *   counter: 'Selected',        // readout label (false to hide); shows "n of total" when total: true
 *   rowLabels: ['a', 'b'], colLabels: ['1', '2'],
 *   indexBase: 1,          // how cells are counted when read aloud and there are no labels: 1 (default) or 0
 * }
 *
 * State: { on: [sorted indices], colors: { index: colorNumber } }
 * Dragging across cells paints them, so large regions are quick to fill.
 */
import { h, cx, readout, hue } from './kit.js';
import { play } from '../core/audio.js';

export default function create(spec, env) {
  const rows = spec.rows || 5;
  const cols = spec.cols || 5;
  const n = rows * cols;
  const colors = spec.colors && spec.colors.length ? spec.colors : ['blue'];
  const locked = new Set(spec.locked || []);
  const values = new Array(n).fill(0); // 0 = off, k = colors[k-1]
  let readOnly = !!env.readOnly;

  const initial = Array.isArray(spec.on) ? spec.on : [];
  if (initial.length && Array.isArray(initial[0])) {
    initial.forEach((row, r) => row.forEach((v, c) => { if (v) values[r * cols + c] = Number(v) || 1; }));
  } else {
    for (const i of initial) if (i >= 0 && i < n) values[i] = 1;
  }
  if (spec.cells) for (const key in spec.cells) values[Number(key)] = spec.cells[key];

  const labelOf = (i) => {
    const l = spec.labels;
    if (l == null || l === false) return '';
    if (l === 'index') return String(i);
    if (l === 'index1') return String(i + 1);
    if (typeof l === 'function') return String(l(i, Math.floor(i / cols), i % cols) ?? '');
    if (Array.isArray(l)) return l[i] == null ? '' : String(l[i]);
    return '';
  };

  const cellSize = spec.cell || (env.compact ? 26 : 40);
  const board = h('div', {
    class: cx('w-grid', spec.shape === 'circle' && 'is-circle', env.compact && 'is-compact'),
    role: 'group', // toggle buttons in a group; each button's name gives its row and column
    'aria-label': spec.alt || 'Grid of cells',
    style: { '--cols': cols, '--cell': `${cellSize}px`, '--gap': `${spec.gap != null ? spec.gap : 4}px` },
  });
  board.dataset.keys = 'own';
  const cells = [];
  const counter = spec.counter !== false && !env.compact ? readout(spec.counter || 'Selected', { digits: 0 }) : null;

  const count = () => values.reduce((k, v) => k + (v ? 1 : 0), 0);

  function paint(i) {
    const el = cells[i];
    const v = values[i];
    el.setAttribute('aria-pressed', String(v > 0));
    el.style.setProperty('--cell-color', v ? hue(colors[v - 1]) : 'transparent');
    el.style.setProperty('--cell-soft', v ? hue(colors[v - 1], 'soft') : 'var(--surface)');
    el.classList.toggle('is-on', v > 0);
  }
  function refresh() {
    if (counter) counter.set(spec.total ? `${count()} of ${n}` : count());
  }

  function setCell(i, v, { silent = false } = {}) {
    if (locked.has(i) || values[i] === v) return false;
    if (v && !values[i] && spec.max != null && count() >= spec.max) return false;
    values[i] = v;
    paint(i);
    refresh();
    if (!silent) { play('tap'); env.onChange(getState()); }
    return true;
  }

  // Cells are announced by the labels printed beside the board when there are any, so that a screen
  // reader says what a sighted learner sees (a lesson on Python indexes labels its rows from 0).
  const base = spec.indexBase === 0 ? 0 : 1;
  const rowName = (r) => (spec.rowLabels && spec.rowLabels[r] != null ? spec.rowLabels[r] : r + base);
  const colName = (c) => (spec.colLabels && spec.colLabels[c] != null ? spec.colLabels[c] : c + base);
  let painting = null; // value being painted during a drag
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const el = h('button.w-cell', {
      type: 'button',
      tabindex: i === 0 ? '0' : '-1',
      'aria-label': `Row ${rowName(r)}, column ${colName(c)}${labelOf(i) ? ': ' + labelOf(i) : ''}`,
      'aria-pressed': 'false',
    }, labelOf(i));
    if (locked.has(i)) el.classList.add('is-locked');
    el.addEventListener('pointerdown', (ev) => {
      if (readOnly || ev.button > 0) return;
      const next = (values[i] + 1) % (colors.length + 1);
      painting = next;
      setCell(i, next);
      try { el.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
    });
    el.addEventListener('pointerenter', () => { if (painting !== null && !readOnly) setCell(i, painting); });
    el.addEventListener('click', (ev) => {
      // keyboard / assistive activation (pointer clicks are handled on pointerdown)
      if (ev.detail === 0 && !readOnly) setCell(i, (values[i] + 1) % (colors.length + 1));
    });
    el.addEventListener('keydown', (ev) => {
      let j = -1;
      if (ev.key === 'ArrowRight') j = i + 1;
      else if (ev.key === 'ArrowLeft') j = i - 1;
      else if (ev.key === 'ArrowDown') j = i + cols;
      else if (ev.key === 'ArrowUp') j = i - cols;
      else return;
      ev.preventDefault();
      if (j >= 0 && j < n) { cells[i].tabIndex = -1; cells[j].tabIndex = 0; cells[j].focus(); }
    });
    cells.push(el);
    board.appendChild(el);
  }
  const stopPaint = () => { painting = null; };
  window.addEventListener('pointerup', stopPaint);
  window.addEventListener('pointercancel', stopPaint);

  const wrap = h('div.w-frame.w-grid-frame', { class: env.compact ? 'is-compact' : '' });
  if (spec.colLabels) {
    const colLabels = h('div.w-grid-collabels', { style: { '--cols': cols, '--cell': `${cellSize}px`, '--gap': `${spec.gap != null ? spec.gap : 4}px` } },
      spec.colLabels.map((t) => h('span', t)));
    if (spec.rowLabels) {
      // An invisible copy of the row labels takes up the same width, so each column label sits over its column.
      const spacer = h('div.w-grid-rowlabels', { 'aria-hidden': 'true', style: { visibility: 'hidden', height: '0', overflow: 'hidden' } }, spec.rowLabels.map((t) => h('span', t)));
      wrap.appendChild(h('div.w-grid-withrows', spacer, colLabels));
    } else {
      wrap.appendChild(colLabels);
    }
  }
  if (spec.rowLabels) {
    wrap.appendChild(h('div.w-grid-withrows',
      h('div.w-grid-rowlabels', { style: { '--cell': `${cellSize}px`, '--gap': `${spec.gap != null ? spec.gap : 4}px` } }, spec.rowLabels.map((t) => h('span', t))),
      board));
  } else {
    wrap.appendChild(board);
  }
  if (counter) wrap.appendChild(h('div.w-readouts', counter.el));

  function getState() {
    const on = [];
    const cellColors = {};
    values.forEach((v, i) => { if (v) { on.push(i); cellColors[i] = v; } });
    return { on, colors: cellColors, count: on.length };
  }

  for (let i = 0; i < n; i++) paint(i);
  refresh();
  if (readOnly) wrap.classList.add('is-readonly');

  return {
    el: wrap,
    getState,
    setState(next) {
      if (!next) return;
      const want = new Array(n).fill(0);
      if (next.colors) for (const key in next.colors) want[Number(key)] = next.colors[key];
      else if (Array.isArray(next.on)) for (const i of next.on) want[i] = 1;
      for (let i = 0; i < n; i++) { values[i] = want[i]; paint(i); }
      refresh();
    },
    setReadOnly(v) { readOnly = !!v; wrap.classList.toggle('is-readonly', readOnly); },
    destroy() {
      window.removeEventListener('pointerup', stopPaint);
      window.removeEventListener('pointercancel', stopPaint);
    },
  };
}
