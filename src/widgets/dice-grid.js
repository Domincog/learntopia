/**
 * dice-grid — every way two dice can land, as a 6 × 6 board of tappable
 * cells. The BLUE die picks the row, the ORANGE die picks the column, so
 * (2, 5) and (5, 2) are visibly different outcomes. Made for counting
 * ("tap every way to make 7") and for conditional probability (`given`
 * rules outcomes out and shrinks the board).
 *
 * {
 *   type: 'dice-grid',
 *   show: 'pair',                    // what each cell shows: 'pair' (two little number tiles), 'sum', 'diff',
 *                                    // 'max', 'min', 'product', 'none', or a function (a, b) => text
 *   on: [5, 10],                     // cells selected at the start: indices 0–35, [a, b] pairs, or a test (a, b) => boolean
 *   given: (a, b) => a % 2 === 0,    // optional condition: outcomes that fail it are ruled out (faded, cannot be selected)
 *   tint: (a, b) => 'blue',          // optional background tint per cell (palette name or null) for pictures of events
 *   legend: [{ color: 'blue', label: 'blue die shows 6' }],   // explains the tints
 *   color: 'yellow',                 // colour of selected cells
 *   counter: 'Selected',             // label of the count readout ("6 of 36"); false hides it
 *   cell: 52,                        // largest cell size in px
 *   static: false,                   // true: a picture, nothing can be tapped
 * }
 *
 * Cell index = (a − 1) · 6 + (b − 1), with a = blue die (row) and b = orange die (column).
 *
 * State: { on: [sorted indices], cells: [[a, b], …], count, possible }
 *   possible — how many outcomes are not ruled out by `given` (36 without it)
 *
 * Tap or drag to paint cells; arrow keys move between cells, Enter or Space toggles.
 */
import { h, s, cx, readout, hue, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('dice-grid', `
  .widget-dice-grid { justify-items: center; max-width: 100%; }
  .widget-dice-grid .dg-board {
    display: grid;
    grid-template-columns: auto var(--dg-head) repeat(6, minmax(0, var(--dg-cell)));
    gap: 4px;
    align-items: center;
    max-width: 100%;
    user-select: none;
    -webkit-user-select: none;
  }
  .widget-dice-grid .dg-top, .widget-dice-grid .dg-side { font-size: var(--fs-sm); font-weight: 800; line-height: 1.2; text-align: center; white-space: nowrap; }
  .widget-dice-grid .dg-top { grid-column: 3 / span 6; grid-row: 1; color: var(--orange-text); }
  .widget-dice-grid .dg-side { grid-column: 1; grid-row: 3 / span 6; writing-mode: vertical-rl; transform: rotate(180deg); color: var(--blue-text); padding-left: 2px; }
  .widget-dice-grid .dg-head { display: grid; place-items: center; }
  .widget-dice-grid .dg-head svg { display: block; width: calc(var(--dg-head) - 2px); max-width: 100%; height: auto; }
  .widget-dice-grid .dg-cell {
    aspect-ratio: 1;
    min-width: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: var(--bw) solid var(--dg-edge, var(--edge));
    border-radius: 9px;
    background: var(--dg-bg, var(--surface));
    color: var(--ink);
    font-size: clamp(0.8rem, calc(var(--dg-cell) * 0.36), 1.1rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    transition: background-color 0.12s ease, transform 0.12s var(--ease-spring), opacity 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .widget-dice-grid button.dg-cell { touch-action: none; cursor: pointer; }
  .widget-dice-grid button.dg-cell:active { transform: scale(0.9); }
  .widget-dice-grid .dg-cell.is-on { background: var(--dg-on); border-color: var(--edge-strong); color: #1D1B26; }
  .widget-dice-grid .dg-cell.is-out { border-style: dashed; border-color: var(--hair); background: transparent; color: var(--ink-3); pointer-events: none; }
  /* ruled out: struck through and muted, but still readable */
  .widget-dice-grid .dg-cell.is-out > svg { opacity: 0.3; }
  .widget-dice-grid .dg-cell.is-out > span { text-decoration: line-through; font-weight: 600; }
  .widget-dice-grid .dg-chip {
    display: grid;
    place-items: center;
    width: 42%;
    max-width: 22px;
    aspect-ratio: 1;
    border-radius: 5px;
    border: 1.5px solid var(--edge-strong);
    font-size: 0.82em;
    color: #1D1B26;
  }
  .widget-dice-grid .dg-chip.is-a { background: var(--blue); }
  .widget-dice-grid .dg-chip.is-b { background: var(--orange); }
  .widget-dice-grid.is-readonly button.dg-cell { pointer-events: none; }
  .widget-dice-grid.is-compact .dg-board { gap: 2px; }
  .widget-dice-grid.is-compact .dg-cell { border-width: 1.5px; border-radius: 5px; font-size: 0.6rem; }
  .widget-dice-grid .w-legend-item i { flex: none; }
`);

const PIP_AT = [[8, 8], [22, 8], [8, 15], [15, 15], [22, 15], [8, 22], [22, 22]];
const PIPS = { 1: [3], 2: [0, 6], 3: [0, 3, 6], 4: [0, 1, 5, 6], 5: [0, 1, 3, 5, 6], 6: [0, 1, 2, 4, 5, 6] };

/** A small die face as an inline SVG. */
function dieFace(n, color) {
  const svg = s('svg', { viewBox: '0 0 30 30', 'aria-hidden': 'true', focusable: 'false' },
    s('rect', { x: 2, y: 2, width: 26, height: 26, rx: 6, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
  for (const i of PIPS[n]) svg.appendChild(s('circle', { cx: PIP_AT[i][0], cy: PIP_AT[i][1], r: 2.7, fill: '#1D1B26' }));
  return svg;
}

const STATS = {
  sum: (a, b) => a + b,
  diff: (a, b) => Math.abs(a - b),
  max: (a, b) => Math.max(a, b),
  min: (a, b) => Math.min(a, b),
  product: (a, b) => a * b,
};
const STAT_WORD = { sum: 'total', diff: 'difference', max: 'larger number', min: 'smaller number', product: 'product' };

export default function create(spec, env) {
  const interactive = !spec.static && !env.compact;
  const show = spec.show == null ? 'pair' : spec.show;
  const color = spec.color || 'yellow';
  const given = typeof spec.given === 'function' ? spec.given : null;
  const tint = typeof spec.tint === 'function' ? spec.tint : null;
  let readOnly = !!env.readOnly;

  const faces = (i) => [Math.floor(i / 6) + 1, (i % 6) + 1];
  const allowed = [];
  const values = [];
  for (let i = 0; i < 36; i++) { const [a, b] = faces(i); allowed.push(!given || !!given(a, b)); values.push(false); }
  const possible = allowed.filter(Boolean).length;

  function load(list) {
    values.fill(false);
    if (typeof list === 'function') {
      for (let i = 0; i < 36; i++) { const [a, b] = faces(i); values[i] = allowed[i] && !!list(a, b); }
      return;
    }
    for (const item of Array.isArray(list) ? list : []) {
      const i = Array.isArray(item) ? (item[0] - 1) * 6 + (item[1] - 1) : Number(item);
      if (Number.isInteger(i) && i >= 0 && i < 36 && allowed[i]) values[i] = true;
    }
  }
  load(spec.on);

  /* ------------------------------------------------------------- board */
  const board = h('div.dg-board', {
    role: 'group',
    'aria-label': spec.alt || 'All 36 outcomes of two dice. Rows: blue die. Columns: orange die.',
    style: { '--dg-cell': `${spec.cell || (env.compact ? 20 : 52)}px`, '--dg-head': env.compact ? '16px' : '30px', '--dg-on': hue(color) },
  });
  board.dataset.keys = 'own';
  if (!env.compact) {
    board.appendChild(h('div.dg-top', { 'aria-hidden': 'true' }, 'orange die'));
    board.appendChild(h('div.dg-side', { 'aria-hidden': 'true' }, 'blue die'));
  }
  for (let k = 1; k <= 6; k++) {
    board.appendChild(h('div.dg-head', { style: { gridRow: '2', gridColumn: String(k + 2) } }, dieFace(k, 'orange')));
    board.appendChild(h('div.dg-head', { style: { gridRow: String(k + 2), gridColumn: '2' } }, dieFace(k, 'blue')));
  }

  const content = (a, b) => {
    if (show === 'none' || show === false) return [];
    if (show === 'pair') return [h('span.dg-chip.is-a', String(a)), h('span.dg-chip.is-b', String(b))];
    if (typeof show === 'function') return [h('span', String(show(a, b) ?? ''))];
    if (STATS[show]) return [h('span', String(STATS[show](a, b)))];
    return [];
  };
  const describe = (a, b) => {
    let text = `Blue ${a}, orange ${b}`;
    if (STATS[show]) text += `, ${STAT_WORD[show]} ${STATS[show](a, b)}`;
    return text;
  };

  const cells = [];
  let painting = null; // the value being painted while a pointer is held down
  let focusAt = allowed.indexOf(true);

  function paint(i) {
    const el = cells[i];
    el.classList.toggle('is-on', values[i]);
    if (interactive && allowed[i]) el.setAttribute('aria-pressed', String(values[i]));
  }
  function setCell(i, v) {
    if (readOnly || !allowed[i] || values[i] === v) return;
    values[i] = v;
    paint(i);
    refresh();
    play('tap');
    env.onChange(getState());
  }

  for (let i = 0; i < 36; i++) {
    const [a, b] = faces(i);
    const place = { gridRow: String(a + 2), gridColumn: String(b + 2) };
    const hueName = tint ? tint(a, b) : null;
    if (hueName) { place['--dg-bg'] = hue(hueName, 'soft'); place['--dg-edge'] = hue(hueName); }
    let el;
    if (interactive && allowed[i]) {
      el = h('button.dg-cell', { type: 'button', tabindex: i === focusAt ? '0' : '-1', 'aria-label': describe(a, b), 'aria-pressed': 'false', style: place }, content(a, b));
      el.addEventListener('pointerdown', (ev) => {
        if (readOnly || ev.button > 0) return;
        painting = !values[i];
        setCell(i, painting);
        try { el.releasePointerCapture(ev.pointerId); } catch { /* not captured */ }
      });
      el.addEventListener('pointerenter', () => { if (painting !== null) setCell(i, painting); });
      el.addEventListener('click', (ev) => { if (ev.detail === 0) setCell(i, !values[i]); }); // keyboard and assistive tech
      el.addEventListener('keydown', (ev) => {
        const move = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[ev.key];
        if (!move) return;
        ev.preventDefault();
        // step to the next cell in that direction that has not been ruled out
        let row = a - 1 + move[0];
        let col = b - 1 + move[1];
        const inside = () => row >= 0 && row < 6 && col >= 0 && col < 6;
        while (inside() && !allowed[row * 6 + col]) { row += move[0]; col += move[1]; }
        if (!inside()) return;
        const j = row * 6 + col;
        cells[focusAt].tabIndex = -1;
        focusAt = j;
        cells[j].tabIndex = 0;
        cells[j].focus();
      });
    } else {
      el = h('div', { class: cx('dg-cell', !allowed[i] && 'is-out'), style: place, role: 'img', 'aria-label': `${describe(a, b)}${allowed[i] ? '' : ' (ruled out)'}` }, content(a, b));
    }
    cells.push(el);
    board.appendChild(el);
  }
  const stopPaint = () => { painting = null; };
  window.addEventListener('pointerup', stopPaint);
  window.addEventListener('pointercancel', stopPaint);

  /* ------------------------------------------------------------ chrome */
  const el = h('div', { class: cx('w-frame', env.compact && 'is-compact') }, board);
  if (Array.isArray(spec.legend) && spec.legend.length && !env.compact) {
    el.appendChild(h('div.w-legend', spec.legend.map((item) => h('span.w-legend-item',
      h('i', { style: { background: hue(item.color, 'soft'), borderColor: hue(item.color) } }), item.label))));
  }
  const counter = spec.counter !== false && interactive ? readout(spec.counter || 'Selected', { digits: 0 }) : null;
  if (counter) el.appendChild(h('div.w-readouts', counter.el));

  const count = () => values.reduce((n, v) => n + (v ? 1 : 0), 0);
  function refresh() {
    if (counter) counter.set(`${count()} of ${possible}`);
  }
  function getState() {
    const on = [];
    for (let i = 0; i < 36; i++) if (values[i]) on.push(i);
    return { on, cells: on.map(faces), count: on.length, possible };
  }

  for (let i = 0; i < 36; i++) paint(i);
  refresh();
  if (readOnly) el.classList.add('is-readonly');

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      load(Array.isArray(next.on) ? next.on : next.cells);
      for (let i = 0; i < 36; i++) paint(i);
      refresh();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
    destroy() {
      window.removeEventListener('pointerup', stopPaint);
      window.removeEventListener('pointercancel', stopPaint);
    },
  };
}

export const examples = [
  {
    title: 'dice-grid — tap every way to make a total of 7',
    spec: { type: 'dice-grid', show: 'pair', on: [5, 10], counter: 'Selected' },
  },
  {
    title: 'dice-grid — totals, with a condition that rules half the board out',
    spec: { type: 'dice-grid', show: 'sum', given: (a) => a % 2 === 0, on: (a, b) => a + b === 8, counter: 'Total of 8' },
  },
  {
    title: 'dice-grid — static picture of two overlapping events',
    spec: {
      type: 'dice-grid', static: true, show: 'pair',
      tint: (a, b) => (a >= 5 && b >= 5 ? 'violet' : a >= 5 ? 'blue' : b >= 5 ? 'orange' : null),
      legend: [{ color: 'blue', label: 'blue die shows 5 or 6' }, { color: 'orange', label: 'orange die shows 5 or 6' }, { color: 'violet', label: 'both' }],
    },
  },
];
