/**
 * truth-table — a truth table with cells the learner fills in by tapping.
 * One row for every combination of the input statements; some columns are
 * given, others are left for the learner.
 *
 * {
 *   type: 'truth-table',
 *   vars: ['P', 'Q'],                 // input columns: strings, or { id: 'c', label: 'Coffee' }
 *   columns: [
 *     { head: 'P and Q', value: (v) => v.P && v.Q },                         // given
 *     { head: 'not (P and Q)', value: (v) => !(v.P && v.Q), fill: true },    // filled in by the learner
 *     { head: 'P or Q', value: (v) => v.P || v.Q, mark: true },              // highlighted, e.g. for comparing
 *   ],
 *   symbols: ['T', 'F'],              // how true and false are written: ['1', '0'], ['yes', 'no'] …
 *   order: 'true-first',              // row order: 'true-first' (TT, TF, FT, FF) or 'binary' (00, 01, 10, 11)
 *   legend: ['**P**: Sam owns a cat', '**Q**: Sam owns a dog'],   // optional lines under the table (markdown)
 *   static: false,                    // true: picture only
 * }
 *
 * `value(v)` gets an object keyed by variable id, e.g. { P: true, Q: false }.
 * Column heads accept markdown. Tap an empty cell for true; tap again to flip.
 * On a keyboard: T / F (or 1 / 0, Y / N) set a cell, arrow keys move.
 *
 * State: { values, filled, total, complete, mistakes, correct, firstWrong }
 *   values     — for each fill column, the learner's entries per row (true | false | null)
 *   filled     — cells filled in so far, out of `total`
 *   complete   — every cell is filled in
 *   mistakes   — filled cells that disagree with the column's rule
 *   correct    — complete, with no mistakes
 *   firstWrong — { column, head, row, inputs } for the first wrong cell (column counts fill columns
 *                from 0; inputs reads like "P = T, Q = F"), or null
 *
 * setState accepts { values: [[true, false, …], …] } or { solved: true } (fills in every cell correctly).
 */
import { h, cx, button, addStyles, mdInline } from './kit.js';
import { mdText } from '../core/markdown.js';
import { play } from '../core/audio.js';

addStyles('truth-table', `
  .widget-truth-table.w-frame { justify-items: center; }
  .widget-truth-table .tt-scroll { max-width: 100%; overflow-x: auto; padding: 2px; }
  .widget-truth-table table { border-collapse: separate; border-spacing: 4px; margin: 0 auto; }
  .widget-truth-table th {
    padding: 2px 4px 4px; vertical-align: bottom; text-align: center;
    font-size: var(--fs-sm); font-weight: 800; line-height: 1.2; max-width: 8.5em; text-wrap: balance;
  }
  .widget-truth-table th em { font-weight: 600; font-style: normal; color: var(--ink-3); }
  .widget-truth-table th.is-var { color: var(--ink-2); }
  .widget-truth-table th.is-fill { color: var(--violet-text); }
  .widget-truth-table th.is-mark, .widget-truth-table td.is-mark { background: var(--yellow-soft); }
  .widget-truth-table th.is-mark { border-radius: 10px 10px 0 0; }
  .widget-truth-table tr:last-child td.is-mark { border-radius: 0 0 10px 10px; }
  .widget-truth-table td { padding: 0; text-align: center; }
  .widget-truth-table td.is-mark { padding: 3px; }
  .widget-truth-table td.tt-gap, .widget-truth-table th.tt-gap { width: 6px; padding: 0; }
  .widget-truth-table .tt-val {
    display: grid; place-items: center; min-width: 46px; height: 44px; margin: 0 auto; padding: 0 8px;
    border: var(--bw) solid transparent; border-radius: 10px;
    font-family: var(--font-mono); font-weight: 700; font-size: var(--fs-lg); line-height: 1; color: var(--ink-2);
  }
  .widget-truth-table .tt-val.is-var { background: var(--sunken); }
  .widget-truth-table .tt-val.is-given { border-color: var(--hair); background: var(--surface); }
  .widget-truth-table .tt-val.is-true { color: var(--blue-text); }
  .widget-truth-table .tt-val.is-var.is-true, .widget-truth-table .tt-val.is-given.is-true { background: var(--blue-soft); }
  .widget-truth-table .tt-val.is-given.is-true { border-color: transparent; }
  .widget-truth-table button.tt-val {
    width: 100%; border-color: var(--edge); background: var(--surface); color: var(--ink);
    transition: background-color 0.12s ease, transform 0.12s var(--ease-spring);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .widget-truth-table button.tt-val:active { transform: scale(0.92); }
  .widget-truth-table button.tt-val.is-empty { border-style: dashed; border-color: var(--violet); color: var(--ink-3); }
  .widget-truth-table button.tt-val.is-true { background: var(--blue-soft); color: var(--blue-text); }
  .widget-truth-table button.tt-val.is-false { background: var(--surface); color: var(--ink); }
  .widget-truth-table.is-readonly button.tt-val { pointer-events: none; }
  .widget-truth-table .tt-legend { list-style: none; display: grid; gap: 2px; font-size: var(--fs-sm); color: var(--ink-2); text-align: center; }
  .widget-truth-table.is-compact .tt-val { min-width: 30px; height: 30px; font-size: var(--fs-sm); padding: 0 4px; }
  .widget-truth-table.is-compact th { font-size: var(--fs-xs); }
  @media (max-width: 480px) {
    .widget-truth-table table { border-spacing: 3px; }
    .widget-truth-table .tt-val { min-width: 42px; padding: 0 5px; }
    .widget-truth-table th { font-size: 0.8rem; padding: 2px 2px 4px; }
  }
`);

export default function create(spec, env) {
  const vars = (spec.vars || ['P', 'Q']).map((v) => (typeof v === 'string' ? { id: v, label: v } : { id: v.id, label: v.label || v.id }));
  const columns = spec.columns || [];
  const symbols = Array.isArray(spec.symbols) && spec.symbols.length === 2 ? spec.symbols.map(String) : ['T', 'F'];
  const sym = (v) => (v ? symbols[0] : symbols[1]);
  const nRows = 1 << vars.length;
  const interactive = !spec.static && !env.compact;
  let readOnly = !!env.readOnly;

  // row r, variable j: true-first order lists TT, TF, FT, FF; binary lists 00, 01, 10, 11
  const rows = Array.from({ length: nRows }, (_, r) => {
    const bits = vars.map((_, j) => !!(r & (1 << (vars.length - 1 - j))));
    const vals = spec.order === 'binary' ? bits : bits.map((b) => !b);
    const env0 = {};
    vars.forEach((v, j) => { env0[v.id] = vals[j]; });
    return { vals, scope: env0 };
  });
  const expected = columns.map((col) => rows.map((row) => !!col.value(row.scope)));
  const fillCols = columns.map((col, i) => (col.fill ? i : -1)).filter((i) => i >= 0);
  let entries = fillCols.map(() => rows.map(() => null));

  /* ------------------------------------------------------------------ view */
  const table = h('table', { 'aria-label': spec.alt || 'Truth table' });
  table.dataset.keys = 'own';
  const headRow = h('tr');
  for (const v of vars) headRow.appendChild(h('th.is-var', { scope: 'col', html: mdInline(v.label) }));
  headRow.appendChild(h('th.tt-gap', { 'aria-hidden': 'true' }));
  columns.forEach((col) => {
    headRow.appendChild(h('th', { scope: 'col', class: cx(col.fill && 'is-fill', col.mark && 'is-mark'), html: mdInline(col.head || '') }));
  });
  table.appendChild(h('thead', headRow));

  const buttons = fillCols.map(() => []);
  const body = h('tbody');
  rows.forEach((row, r) => {
    const tr = h('tr');
    row.vals.forEach((val) => tr.appendChild(h('td', h('span', { class: cx('tt-val is-var', val && 'is-true') }, sym(val)))));
    tr.appendChild(h('td.tt-gap', { 'aria-hidden': 'true' }));
    columns.forEach((col, c) => {
      const td = h('td', { class: cx(col.mark && 'is-mark') });
      const k = fillCols.indexOf(c);
      if (k < 0) {
        td.appendChild(h('span', { class: cx('tt-val is-given', expected[c][r] && 'is-true') }, sym(expected[c][r])));
      } else if (!interactive) {
        td.appendChild(h('span.tt-val.is-given', '?'));
      } else {
        const btn = h('button.tt-val.is-empty', { type: 'button' }, '?');
        btn.addEventListener('click', () => set(k, r, entries[k][r] === true ? false : true));
        btn.addEventListener('keydown', (ev) => {
          const key = ev.key.toLowerCase();
          if (['t', '1', 'y'].includes(key)) { ev.preventDefault(); set(k, r, true); return; }
          if (['f', '0', 'n'].includes(key)) { ev.preventDefault(); set(k, r, false); return; }
          if (key === 'backspace' || key === 'delete') { ev.preventDefault(); set(k, r, null); return; }
          const dr = key === 'arrowdown' ? 1 : key === 'arrowup' ? -1 : 0;
          const dk = key === 'arrowright' ? 1 : key === 'arrowleft' ? -1 : 0;
          if (!dr && !dk) return;
          const target = buttons[k + dk] && buttons[k + dk][r + dr];
          if (target) { ev.preventDefault(); target.focus(); }
        });
        buttons[k][r] = btn;
        td.appendChild(btn);
      }
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
  table.appendChild(body);

  const clearBtn = button('Clear', () => {
    if (readOnly) return;
    entries = fillCols.map(() => rows.map(() => null));
    render();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });
  const legend = Array.isArray(spec.legend) && spec.legend.length && !env.compact
    ? h('ul.tt-legend', spec.legend.map((line) => h('li', { html: mdInline(line) })))
    : null;
  const root = h('div', { class: cx('w-frame', env.compact && 'is-compact') },
    h('div.tt-scroll', table),
    legend,
    interactive && fillCols.length ? h('p.w-hint', `Tap a cell for ${symbols[0]}. Tap again for ${symbols[1]}.`) : null,
    interactive && fillCols.length ? h('div.w-buttons', clearBtn) : null,
  );

  const inputsText = (r) => vars.map((v, j) => `${mdText(v.label)} = ${sym(rows[r].vals[j])}`).join(', ');

  function render() {
    fillCols.forEach((c, k) => {
      rows.forEach((_, r) => {
        const btn = buttons[k][r];
        if (!btn) return;
        const v = entries[k][r];
        btn.textContent = v == null ? '?' : sym(v);
        btn.classList.toggle('is-empty', v == null);
        btn.classList.toggle('is-true', v === true);
        btn.classList.toggle('is-false', v === false);
        btn.setAttribute('aria-label', `${mdText(columns[c].head || '')}, when ${inputsText(r)}: ${v == null ? 'empty' : sym(v)}`);
      });
    });
    if (interactive) clearBtn.disabled = readOnly || entries.every((col) => col.every((v) => v == null));
  }

  function set(k, r, value) {
    if (readOnly || entries[k][r] === value) return;
    entries[k][r] = value;
    play(value === false ? 'tap' : 'select');
    render();
    env.onChange(getState());
  }

  function getState() {
    let filled = 0;
    let mistakes = 0;
    let firstWrong = null;
    // scan row by row so that "first" matches reading order
    rows.forEach((_, r) => {
      fillCols.forEach((c, k) => {
        const v = entries[k][r];
        if (v == null) return;
        filled++;
        if (v !== expected[c][r]) {
          mistakes++;
          if (!firstWrong) firstWrong = { column: k, head: mdText(columns[c].head || ''), row: r, inputs: inputsText(r) };
        }
      });
    });
    const total = fillCols.length * nRows;
    return {
      values: entries.map((col) => col.slice()),
      filled,
      total,
      complete: filled === total,
      mistakes,
      correct: filled === total && mistakes === 0,
      firstWrong,
    };
  }

  render();
  if (readOnly) root.classList.add('is-readonly');

  return {
    el: root,
    getState,
    setState(next) {
      if (!next) return;
      if (next.solved) entries = fillCols.map((c) => expected[c].slice());
      else if (Array.isArray(next.values)) {
        entries = fillCols.map((_, k) => rows.map((__, r) => {
          const v = next.values[k] ? next.values[k][r] : null;
          return v === true || v === false ? v : null;
        }));
      } else return;
      render();
    },
    setReadOnly(v) { readOnly = !!v; root.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  {
    title: 'truth-table — fill in a column',
    spec: {
      type: 'truth-table',
      vars: ['P', 'Q'],
      columns: [
        { head: 'P and Q', value: (v) => v.P && v.Q },
        { head: 'not (P and Q)', value: (v) => !(v.P && v.Q), fill: true },
      ],
    },
  },
  {
    title: 'truth-table — 1 and 0, binary order, static',
    spec: {
      type: 'truth-table', static: true, symbols: ['1', '0'], order: 'binary',
      vars: ['A', 'B'],
      columns: [{ head: 'A AND B', value: (v) => v.A && v.B }, { head: 'A OR B', value: (v) => v.A || v.B, mark: true }],
    },
  },
];
