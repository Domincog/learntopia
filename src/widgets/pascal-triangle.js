/**
 * pascal-triangle — Pascal's triangle as a board of tappable cells. Row n,
 * place k (both counted from 0) holds "n choose k": the number of ways to
 * choose k things from n. Tapping a cell shows where its number comes from:
 * the two cells just above it, added together.
 *
 * {
 *   type: 'pascal-triangle',
 *   rows: 7,               // how many rows to draw: rows 0 … rows − 1 (2 to 11)
 *   selected: [4, 2],      // optional: the cell [n, k] that is selected at the start
 *   mark: [[4, 2]],        // optional: cells to tint (for pictures)
 *   hideFrom: 5,           // optional: rows from this one on show "?" instead of their numbers
 *   line: true,            // show the working line under the triangle
 *   static: false,         // true: a picture, nothing can be tapped
 * }
 *
 * State: { selected, n, k, value }
 *   selected — [n, k] of the chosen cell, or null; n and k repeat it (null when nothing is chosen)
 *   value    — the number in that cell (null when nothing is chosen)
 *
 * setState accepts { selected: [n, k] } or { n, k }.
 * Arrow keys move between cells; Enter or Space selects.
 */
import { frame, hue, s, h, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('pascal-triangle', `
  .widget-pascal-triangle .pt-cell { cursor: pointer; outline: none; }
  .widget-pascal-triangle .pt-cell:focus-visible .pt-disc { stroke: var(--focus); stroke-width: 4; }
  .widget-pascal-triangle.is-readonly .pt-cell, .widget-pascal-triangle .pt-cell.is-fixed { cursor: default; }
  .widget-pascal-triangle .pt-line { display: grid; gap: 2px; justify-items: center; text-align: center; min-height: 3.4em; align-content: center; font-size: var(--fs-md); }
  .widget-pascal-triangle .pt-line small { color: var(--ink-2); font-size: var(--fs-sm); }
`);

/** n choose k, by the multiplication formula (exact for the small rows drawn here). */
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let out = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) out = (out * (n - i + 1)) / i;
  return Math.round(out);
}

export default function create(spec, env) {
  const rows = clamp(Math.round(spec.rows || 7), 2, 11);
  const isStatic = !!spec.static || env.compact;
  const hideFrom = Number.isInteger(spec.hideFrom) ? spec.hideFrom : Infinity;
  const marks = new Set((spec.mark || []).map(([n, k]) => `${n},${k}`));
  let readOnly = !!env.readOnly;
  let selected = null;
  const valid = (n, k) => Number.isInteger(n) && Number.isInteger(k) && n >= 0 && n < rows && k >= 0 && k <= n;
  if (Array.isArray(spec.selected) && valid(spec.selected[0], spec.selected[1])) selected = [spec.selected[0], spec.selected[1]];

  const W = 560;
  const LABEL = env.compact ? 0 : 46;
  const pitch = Math.min(58, (W - LABEL - 16) / rows);
  const rowH = Math.min(50, pitch * 0.88);
  const R = Math.min(22, pitch / 2 - 3);
  const PAD_T = R + 8;
  const H = Math.round(PAD_T + (rows - 1) * rowH + R + 10);
  const cx0 = LABEL + (W - LABEL) / 2;
  const at = (n, k) => ({ x: cx0 + (k - n / 2) * pitch, y: PAD_T + n * rowH });

  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, label: spec.alt || "Pascal's triangle" });
  const { svg } = fr;
  const gLinks = s('g');
  const gCells = s('g');
  svg.append(gLinks, gCells);

  const cells = new Map();
  let focusKey = selected ? `${selected[0]},${selected[1]}` : '0,0';

  for (let n = 0; n < rows; n++) {
    if (!env.compact) svg.appendChild(s('text.fig-label-sm', { x: 4, y: at(n, 0).y + 4, style: 'fill:var(--ink-3)' }, `row ${n}`));
    for (let k = 0; k <= n; k++) {
      const p = at(n, k);
      const g = s('g.pt-cell', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` });
      const disc = s('circle.pt-disc', { r: R, 'stroke-width': 2.5 });
      const hit = s('circle', { r: pitch / 2, fill: 'transparent' });
      const text = s('text.fig-label', { y: 5, 'text-anchor': 'middle' });
      g.append(hit, disc, text);
      if (!isStatic) {
        g.dataset.keys = 'own';
        g.setAttribute('role', 'button');
        g.addEventListener('click', () => pick(n, k, true));
        g.addEventListener('keydown', (ev) => {
          let to = null;
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(n, k, true); return; }
          if (ev.key === 'ArrowLeft') to = [n, k - 1];
          else if (ev.key === 'ArrowRight') to = [n, k + 1];
          else if (ev.key === 'ArrowUp') to = [n - 1, Math.min(k, n - 1)];
          else if (ev.key === 'ArrowDown') to = [n + 1, k];
          else return;
          ev.preventDefault();
          if (!valid(to[0], to[1])) return;
          focusKey = `${to[0]},${to[1]}`;
          draw();
          cells.get(focusKey).g.focus();
        });
      } else {
        g.classList.add('is-fixed');
      }
      gCells.appendChild(g);
      cells.set(`${n},${k}`, { g, disc, text, n, k });
    }
  }

  const line = h('div.pt-line', { 'aria-live': 'polite' });
  if (!env.compact && spec.line !== false) fr.el.insertBefore(line, fr.readouts);

  const getState = () => (selected
    ? { selected: selected.slice(), n: selected[0], k: selected[1], value: choose(selected[0], selected[1]) }
    : { selected: null, n: null, k: null, value: null });

  const things = (k) => (k === 1 ? '1 thing' : `${k} things`);

  function draw() {
    const sel = selected ? `${selected[0]},${selected[1]}` : null;
    const parents = new Set();
    gLinks.replaceChildren();
    if (selected) {
      const [n, k] = selected;
      for (const pk of [k - 1, k]) {
        if (!valid(n - 1, pk)) continue;
        parents.add(`${n - 1},${pk}`);
        const a = at(n - 1, pk);
        const b = at(n, k);
        gLinks.appendChild(s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: hue('blue'), 'stroke-width': 4, 'stroke-linecap': 'round' }));
      }
    }
    for (const [key, cell] of cells) {
      const isSel = key === sel;
      const isParent = parents.has(key);
      const tinted = marks.has(key);
      cell.disc.setAttribute('fill', isSel ? hue('orange') : isParent ? hue('blue', 'soft') : tinted ? hue('yellow', 'soft') : 'var(--surface)');
      cell.disc.setAttribute('stroke', isSel ? 'var(--edge-strong)' : isParent ? hue('blue') : tinted ? hue('yellow') : 'var(--edge)');
      const hidden = cell.n >= hideFrom && !isSel;
      cell.text.textContent = hidden ? '?' : String(choose(cell.n, cell.k));
      cell.text.setAttribute('style', isSel ? 'fill:#1D1B26;stroke:none' : hidden ? 'fill:var(--ink-3);stroke:none' : 'stroke:none');
      if (!isStatic) {
        cell.g.setAttribute('tabindex', !readOnly && key === focusKey ? '0' : '-1');
        cell.g.setAttribute('aria-pressed', String(isSel));
        cell.g.setAttribute('aria-label', `Row ${cell.n}, place ${cell.k}: ${hidden ? 'hidden' : choose(cell.n, cell.k)}`);
      }
    }
    if (!selected) {
      line.replaceChildren(h('small', isStatic ? '' : 'Tap a number to see where it comes from.'));
    } else {
      const [n, k] = selected;
      const v = choose(n, k);
      let working;
      if (k === 0 || k === n) working = `$\\binom{${n}}{${k}} = 1$`;
      else working = `$\\binom{${n}}{${k}} = \\binom{${n - 1}}{${k - 1}} + \\binom{${n - 1}}{${k}} = ${choose(n - 1, k - 1)} + ${choose(n - 1, k)} = ${v}$`;
      const meaning = k === 0 ? `row ${n}, place 0: one way to choose nothing from ${n}`
        : k === n ? `row ${n}, place ${k}: one way to choose all ${n}`
          : `row ${n}, place ${k}: ${v} ways to choose ${things(k)} from ${n}`;
      line.replaceChildren(h('span', { html: mdInline(working) }), h('small', meaning));
    }
    svg.setAttribute('aria-label', `${spec.alt || "Pascal's triangle"}, rows 0 to ${rows - 1}.${selected ? ` Selected: row ${selected[0]}, place ${selected[1]}, value ${choose(selected[0], selected[1])}.` : ''}`);
  }

  function pick(n, k, byLearner) {
    if (byLearner && (readOnly || isStatic)) return;
    if (!valid(n, k)) return;
    selected = [n, k];
    focusKey = `${n},${k}`;
    draw();
    if (byLearner) {
      play('tap');
      env.announce(`Row ${n}, place ${k}: ${choose(n, k)}.`);
      env.onChange(getState());
    }
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      const cell = Array.isArray(next.selected) ? next.selected : (next.n != null && next.k != null ? [next.n, next.k] : null);
      if (cell && valid(cell[0], cell[1])) pick(cell[0], cell[1], false);
      else if (next.selected === null) { selected = null; draw(); }
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); draw(); },
  };
}

export const examples = [
  { title: 'pascal-triangle — tap a number to see the two it comes from', spec: { type: 'pascal-triangle', rows: 7, selected: [4, 2] } },
  { title: 'pascal-triangle — a picture with one row marked', spec: { type: 'pascal-triangle', rows: 5, static: true, mark: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], line: false } },
  { title: 'pascal-triangle — the last rows are hidden until tapped', spec: { type: 'pascal-triangle', rows: 8, hideFrom: 6 } },
];
