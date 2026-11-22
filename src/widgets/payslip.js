/**
 * payslip — a sample payslip for learning to read one: what was earned, what
 * came off, what is left. Drawn as a slip of paper with headed sections. In
 * `pick` mode the learner taps the line that answers a question.
 *
 * {
 *   type: 'payslip',
 *   employer: 'Harbour Bakery Ltd',     // top line
 *   employee: 'Dara Okafor',
 *   period: 'March',                    // the pay period, shown top right
 *   currency: '$',
 *   lines: [
 *     { id: 'gross', section: 'Pay', label: 'Gross pay', amount: 3250 },
 *     { id: 'tax', section: 'Deductions', label: 'Income tax', amount: -375 },     // deductions are negative
 *     { id: 'net', section: 'Paid to you', label: 'Net pay', amount: 2550, strong: true, note: 'Paid into account ····4821' },
 *   ],
 *   mode: 'static',                     // 'static' (a picture) or 'pick' (tap one line)
 *   stamp: 'Sample payslip',            // small tag; false hides it
 * }
 *
 * A new `section` name starts a headed block. Nothing is added up by the widget: the slip shows what the
 * spec says, as a real slip would, so the lesson decides which lines appear.
 *
 * State (pick): { picked: 'net' | null }.   State (static): {}.   setState accepts { picked }.
 *
 * A teaching slip for an invented employer in an invented country; real payslips differ in layout and wording.
 */
import { h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('payslip', `
  .widget-payslip.w-frame { --w-max: 440px; }
  .widget-payslip .ps-slip { border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); overflow: hidden; box-shadow: var(--shadow-sm); }
  .widget-payslip .ps-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--s2); padding: var(--s2) var(--s3); background: var(--green-soft); border-bottom: var(--bw) solid var(--edge); }
  .widget-payslip .ps-who { font-family: var(--font-display); font-weight: 750; font-size: var(--fs-md); line-height: 1.2; color: var(--ink); }
  .widget-payslip .ps-who small { display: block; font-family: var(--font-body); font-size: var(--fs-xs); font-weight: 700; color: var(--ink-2); }
  .widget-payslip .ps-stamp { flex: none; padding: 1px 7px; border: 1.5px dashed var(--ink-3); border-radius: 999px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); background: var(--surface); }
  .widget-payslip .ps-head { padding: 0.3rem var(--s3) 0.1rem; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-2); border-top: 1px solid var(--hair); background: var(--sunken); }
  .widget-payslip .ps-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--s3); width: 100%; margin: 0; padding: 0.32rem var(--s3); border: 0; border-top: 1px solid var(--hair); border-radius: 0; background: none; color: var(--ink); font: inherit; font-size: var(--fs-sm); line-height: 1.3; text-align: left; }
  .widget-payslip .ps-row b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .widget-payslip .ps-row.is-strong { font-weight: 800; font-size: var(--fs-md); }
  .widget-payslip .ps-note { display: block; font-size: var(--fs-xs); font-weight: 600; color: var(--ink-2); }
  .widget-payslip button.ps-row { cursor: pointer; min-height: 42px; }
  .widget-payslip button.ps-row:hover:not(:disabled) { background: var(--sunken); }
  .widget-payslip button.ps-row[aria-pressed='true'] { background: var(--blue-soft); box-shadow: inset 4px 0 0 var(--blue); }
  .widget-payslip button.ps-row:disabled { cursor: default; }
  .widget-payslip.is-compact .ps-row { font-size: var(--fs-xs); padding: 0.2rem var(--s2); }
`);

/** 3250 -> "$3,250.00", -375 -> "−$375.00" */
export function slipAmount(v, currency = '$') {
  const [whole, part] = Math.abs(v).toFixed(2).split('.');
  return `${v < 0 ? '−' : ''}${currency}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${part}`;
}

export default function create(spec, env) {
  const lines = Array.isArray(spec.lines) ? spec.lines : [];
  const pick = spec.mode === 'pick' && !env.compact;
  const stamp = spec.stamp === false ? null : spec.stamp || 'Sample payslip';
  const currency = spec.currency || '$';
  let picked = null;
  let readOnly = !!env.readOnly;
  const buttons = new Map();

  const getState = () => (pick ? { picked } : {});
  const paint = () => { for (const [id, btn] of buttons) btn.setAttribute('aria-pressed', String(id === picked)); };

  const slip = h('div.ps-slip', { role: 'group', 'aria-label': `${stamp ? `${stamp}: ` : ''}${spec.employee || 'employee'}, ${spec.period || ''}` },
    h('div.ps-top',
      h('span.ps-who', spec.employer || 'Employer', h('small', `${spec.employee || ''}${spec.period ? ` · ${spec.period}` : ''}`)),
      stamp ? h('span.ps-stamp', stamp) : null));
  let section = null;
  for (const line of lines) {
    if (line.section && line.section !== section) {
      section = line.section;
      slip.appendChild(h('div.ps-head', section));
    }
    const inner = [h('span', line.label, line.note ? h('span.ps-note', line.note) : null), h('b', slipAmount(line.amount, currency))];
    if (pick) {
      const btn = h('button', { type: 'button', class: cx('ps-row', line.strong && 'is-strong'), 'aria-pressed': 'false' }, inner);
      btn.dataset.keys = 'own';
      btn.addEventListener('click', () => {
        if (readOnly) return;
        picked = picked === line.id ? null : line.id;
        play('select');
        paint();
        env.announce(picked ? `Chosen: ${line.label}` : 'Nothing chosen');
        env.onChange(getState());
      });
      buttons.set(line.id, btn);
      slip.appendChild(btn);
    } else {
      slip.appendChild(h('div', { class: cx('ps-row', line.strong && 'is-strong') }, inner));
    }
  }

  const el = h('div', { class: cx('w-frame', env.compact && 'is-compact') }, slip);
  if (spec.alt) { el.setAttribute('aria-label', spec.alt); el.setAttribute('role', 'group'); }

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

const SAMPLE = [
  { id: 'gross', section: 'Pay', label: 'Gross pay', amount: 3250 },
  { id: 'tax', section: 'Deductions', label: 'Income tax', amount: -375 },
  { id: 'social', label: 'Social insurance (6%)', amount: -195 },
  { id: 'pension', label: 'Pension (4%)', amount: -130 },
  { id: 'net', section: 'Paid to you', label: 'Net pay', amount: 2550, strong: true },
];

export const examples = [
  { title: 'payslip — a sample slip', spec: { type: 'payslip', employer: 'Harbour Bakery Ltd', employee: 'Dara Okafor', period: 'March', lines: SAMPLE } },
  { title: 'payslip — tap a line', spec: { type: 'payslip', mode: 'pick', employer: 'Harbour Bakery Ltd', employee: 'Dara Okafor', period: 'March', lines: SAMPLE } },
];
