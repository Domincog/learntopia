/**
 * med-label — the label of a medicine pack, for learning to read one. One or
 * two sample packs are shown side by side, each a list of headed lines
 * (active ingredient, dose, maximum, warnings…). In `pick` mode the learner
 * taps the line that answers a question.
 *
 * {
 *   type: 'med-label',
 *   labels: [
 *     {
 *       name: 'Pain Relief Tablets',        // the product name on the pack
 *       sub: '16 tablets',                  // small line under it
 *       color: 'blue',                      // palette colour of the pack's band
 *       rows: [
 *         { id: 'active', head: 'Active ingredient (in each tablet)', text: 'Paracetamol 500 mg' },   // text: markdown allowed
 *         { id: 'max', head: 'Maximum', text: '8 tablets in 24 hours' },
 *       ],
 *     },
 *   ],
 *   mode: 'static',                         // 'static' (a picture) or 'pick' (tap one line)
 *   stamp: 'Sample label',                  // small tag on every pack; false hides it
 * }
 *
 * Row ids must be unique across all the packs of one widget.
 *
 * State (pick): { picked: 'max' | null, pack: 0 | null }   — the id of the chosen line and the index of its pack.
 * State (static): {}
 * setState accepts { picked }.
 *
 * These are teaching labels. Their wording follows the pattern of real over-the-counter labels, but a
 * real pack and a pharmacist are the authority on any real medicine.
 */
import { h, cx, addStyles, mdInline } from './kit.js';
import { play } from '../core/audio.js';

addStyles('med-label', `
  .widget-med-label.w-frame { gap: var(--s3); }
  .widget-med-label .ml-packs { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: var(--s3); align-items: start; }
  .widget-med-label .ml-pack { border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); overflow: hidden; box-shadow: var(--shadow-sm); }
  .widget-med-label .ml-band { display: flex; align-items: baseline; justify-content: space-between; gap: var(--s2); padding: var(--s2) var(--s3); border-bottom: var(--bw) solid var(--edge); }
  .widget-med-label .ml-name { font-family: var(--font-display); font-weight: 750; font-size: var(--fs-lg); line-height: 1.15; color: var(--ink); }
  .widget-med-label .ml-sub { display: block; font-family: var(--font-body); font-size: var(--fs-xs); font-weight: 700; color: var(--ink-2); }
  .widget-med-label .ml-stamp { flex: none; padding: 1px 7px; border: 1.5px dashed var(--ink-3); border-radius: 999px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); background: var(--surface); }
  .widget-med-label .ml-row { display: block; width: 100%; margin: 0; padding: 0.4rem var(--s3); border: 0; border-top: 1px solid var(--hair); border-radius: 0; background: none; color: var(--ink); font: inherit; font-size: var(--fs-sm); line-height: 1.35; text-align: left; }
  .widget-med-label .ml-row:first-of-type { border-top: 0; }
  .widget-med-label .ml-head { display: block; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-2); }
  .widget-med-label button.ml-row { cursor: pointer; min-height: 44px; }
  .widget-med-label button.ml-row:hover:not(:disabled) { background: var(--sunken); }
  .widget-med-label button.ml-row[aria-pressed='true'] { background: var(--blue-soft); box-shadow: inset 4px 0 0 var(--blue); }
  .widget-med-label button.ml-row:disabled { cursor: default; }
  .widget-med-label.is-compact .ml-row { font-size: var(--fs-xs); padding: 0.25rem var(--s2); }
`);

export default function create(spec, env) {
  const packs = (Array.isArray(spec.labels) ? spec.labels : [spec]).slice(0, 2);
  const pick = spec.mode === 'pick' && !env.compact;
  const stamp = spec.stamp === false ? null : spec.stamp || 'Sample label';
  let picked = null;
  let readOnly = !!env.readOnly;
  const buttons = new Map();

  const where = (id) => { const i = packs.findIndex((p) => (p.rows || []).some((row) => row.id === id)); return i < 0 ? null : i; };
  const getState = () => (pick ? { picked, pack: picked == null ? null : where(picked) } : {});

  function paint() {
    for (const [id, btn] of buttons) btn.setAttribute('aria-pressed', String(id === picked));
  }

  const grid = h('div.ml-packs');
  packs.forEach((pack) => {
    const band = h('div.ml-band', h('span.ml-name', pack.name || 'Medicine', pack.sub ? h('span.ml-sub', pack.sub) : null), stamp ? h('span.ml-stamp', stamp) : null);
    band.style.background = `var(--${pack.color || 'blue'}-soft)`;
    const card = h('div.ml-pack', { role: 'group', 'aria-label': `${stamp ? `${stamp}: ` : ''}${pack.name || 'medicine'}` }, band);
    for (const row of pack.rows || []) {
      const inner = [h('span.ml-head', row.head), h('span', { html: mdInline(row.text) })];
      if (pick) {
        const btn = h('button.ml-row', { type: 'button', 'aria-pressed': 'false' }, inner);
        btn.dataset.keys = 'own';
        btn.addEventListener('click', () => {
          if (readOnly) return;
          picked = picked === row.id ? null : row.id;
          play('select');
          paint();
          env.announce(picked ? `Chosen: ${row.head}` : 'Nothing chosen');
          env.onChange(getState());
        });
        buttons.set(row.id, btn);
        card.appendChild(btn);
      } else {
        card.appendChild(h('div.ml-row', inner));
      }
    }
    grid.appendChild(card);
  });

  const el = h('div', { class: cx('w-frame', env.compact && 'is-compact') }, grid);
  if (spec.alt) el.setAttribute('aria-label', spec.alt);
  if (spec.alt) el.setAttribute('role', 'group');

  return {
    el,
    getState,
    setState(next) {
      if (!next || !pick) return;
      picked = next.picked != null && buttons.has(next.picked) ? next.picked : null;
      paint();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  {
    title: 'med-label — a sample label',
    spec: {
      type: 'med-label',
      labels: [{
        name: 'Pain Relief Tablets', sub: '16 tablets', color: 'blue',
        rows: [
          { id: 'active', head: 'Active ingredient (in each tablet)', text: 'Paracetamol 500 mg' },
          { id: 'dose', head: 'Dose', text: 'Adults and children over 12: 1 or 2 tablets every 4 to 6 hours' },
          { id: 'max', head: 'Maximum', text: 'No more than 8 tablets in 24 hours' },
        ],
      }],
    },
  },
  {
    title: 'med-label — pick a line, two packs',
    spec: {
      type: 'med-label', mode: 'pick',
      labels: [
        { name: 'Brand A', color: 'orange', rows: [{ id: 'a1', head: 'Active ingredient', text: 'Ibuprofen 200 mg' }, { id: 'a2', head: 'Price', text: '6.40' }] },
        { name: 'Pharmacy own', color: 'teal', rows: [{ id: 'b1', head: 'Active ingredient', text: 'Ibuprofen 200 mg' }, { id: 'b2', head: 'Price', text: '1.10' }] },
      ],
    },
  },
];
