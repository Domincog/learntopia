/**
 * budget-builder — a month's take-home pay as one bar, shared out between
 * needs, wants and saving. Fixed costs are given; the learner moves a slider
 * for each cost that can change, and watches the bar fill, overflow or leave
 * money without a job.
 *
 * {
 *   type: 'budget-builder',
 *   person: 'Tomás',                // whose budget it is (for labels)
 *   income: 3000,                   // take-home pay for the period
 *   period: 'month',
 *   currency: '$',
 *   items: [
 *     { id: 'rent', label: 'Rent', group: 'needs', amount: 900, fixed: true },                    // fixed: shown, not adjustable
 *     { id: 'food', label: 'Groceries', group: 'needs', amount: 400, min: 250, max: 700, step: 50 },
 *     { id: 'fun', label: 'Eating out, hobbies', group: 'wants', amount: 800, min: 0, max: 1200, step: 50 },
 *     { id: 'saving', label: 'Saving', group: 'saving', amount: 0, min: 0, max: 1200, step: 50 },
 *   ],
 *   guide: [50, 30, 20],            // optional: mark a rule of thumb (needs, wants, saving in % of income) above the bar
 *   static: false,                  // true: a picture without sliders
 * }
 * group is 'needs', 'wants' or 'saving'.
 *
 * State: { amounts, needs, wants, saving, spent, left, shares, balanced }
 *   amounts   { id: amount } for every item
 *   needs, wants, saving   the three group totals;  spent = their sum;  left = income − spent (negative when overspent)
 *   shares    { needs, wants, saving } as percentages of income, to one decimal
 *   balanced  left is exactly 0: every dollar has a job
 * setState accepts { amounts: { id: amount } } (fixed items cannot be changed).
 *
 * A budget here is one period of a made-up person. It leaves out irregular bills, debts and changes in income,
 * which the lesson treats separately.
 */
import { frame, sliderRow, readout, hue, s, h, clamp, addStyles } from './kit.js';

const W = 560;
const H = 132;
const X0 = 16;
const X1 = 544;
const Y0 = 50;
const Y1 = 100;
const GROUPS = [
  { id: 'needs', label: 'Needs', color: 'blue' },
  { id: 'wants', label: 'Wants', color: 'orange' },
  { id: 'saving', label: 'Saving', color: 'green' },
];

addStyles('budget-builder', `
  .widget-budget-builder .bb-seg { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: #1D1B26; }
  .widget-budget-builder .bb-fixed { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-budget-builder .bb-chip { padding: 2px 10px; border: var(--bw) solid var(--hair); border-radius: 999px; background: var(--surface); font-size: var(--fs-sm); font-weight: 700; }
  .widget-budget-builder .bb-chip b { font-family: var(--font-mono); }
  .widget-budget-builder .bb-line { text-align: center; min-height: 1.5em; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  @media (max-width: 520px) { .widget-budget-builder .bb-seg { font-size: 17px; } }
`);

const commas = (v) => String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Totals of a budget: items are [{ group, amount }]. */
export function budgetTotals(income, items) {
  const t = { needs: 0, wants: 0, saving: 0 };
  for (const it of items) if (t[it.group] != null) t[it.group] += it.amount;
  const spent = t.needs + t.wants + t.saving;
  const share = (v) => (income > 0 ? Math.round((v / income) * 1000) / 10 : 0);
  return { ...t, spent, left: income - spent, shares: { needs: share(t.needs), wants: share(t.wants), saving: share(t.saving) }, balanced: income - spent === 0 };
}

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const income = spec.income || 0;
  const period = spec.period || 'month';
  const isStatic = !!spec.static || !!env.compact;
  const items = (spec.items || []).map((it) => ({ min: 0, max: income, step: 50, ...it }));
  const amounts = {};
  for (const it of items) amounts[it.id] = it.amount || 0;
  let readOnly = !!env.readOnly;
  const money = (v) => `${v < 0 ? '−' : ''}${cur}${commas(v)}`;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A budget bar' });
  const { svg } = fr;
  const gBar = s('g');
  svg.appendChild(gBar);

  const ro = {};
  for (const g of GROUPS) { ro[g.id] = readout(g.label.toLowerCase(), { color: g.color }); fr.readouts.appendChild(ro[g.id].el); }
  const line = h('p.bb-line', { 'aria-live': 'polite' });
  const sliders = {};
  if (!isStatic) {
    const fixed = items.filter((it) => it.fixed);
    if (fixed.length) {
      fr.el.insertBefore(h('div.bb-fixed', { role: 'group', 'aria-label': 'Fixed costs' }, fixed.map((it) => h('span.bb-chip', `${it.label} `, h('b', money(it.amount)), ' fixed'))), fr.controls);
    }
    for (const it of items.filter((x) => !x.fixed)) {
      const g = GROUPS.find((x) => x.id === it.group) || GROUPS[0];
      sliders[it.id] = sliderRow({ label: it.label, min: it.min, max: it.max, step: it.step, value: amounts[it.id], color: g.color, format: (v) => money(v), onInput: (v) => { if (readOnly) return; amounts[it.id] = v; render(); env.onChange(getState()); } });
      fr.controls.appendChild(sliders[it.id].el);
    }
  }
  fr.el.insertBefore(line, fr.readouts);

  const totals = () => budgetTotals(income, items.map((it) => ({ group: it.group, amount: amounts[it.id] })));
  const getState = () => ({ amounts: { ...amounts }, ...totals() });
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const t = totals();
    const scale = Math.max(income, t.spent) || 1;
    const sx = (v) => X0 + (v / scale) * (X1 - X0);
    clear(gBar);
    let at = 0;
    for (const g of GROUPS) {
      const v = t[g.id];
      if (v > 0) {
        const xa = sx(at);
        const w = sx(at + v) - xa;
        gBar.appendChild(s('rect', { x: xa, y: Y0, width: w, height: Y1 - Y0, fill: hue(g.color), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
        if (w > 74) gBar.appendChild(s('text.bb-seg', { x: xa + w / 2, y: (Y0 + Y1) / 2 + 5, 'text-anchor': 'middle' }, `${g.label} ${t.shares[g.id]}%`));
        else if (w > 34) gBar.appendChild(s('text.bb-seg', { x: xa + w / 2, y: (Y0 + Y1) / 2 + 5, 'text-anchor': 'middle' }, `${Math.round(t.shares[g.id])}%`));
      }
      at += v;
    }
    if (t.left > 0) {
      gBar.appendChild(s('rect', { x: sx(at), y: Y0, width: sx(income) - sx(at), height: Y1 - Y0, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linejoin': 'round' }));
      if (sx(income) - sx(at) > 60) gBar.appendChild(s('text.fig-label-sm', { x: (sx(at) + sx(income)) / 2, y: (Y0 + Y1) / 2 + 4, 'text-anchor': 'middle' }, 'no job yet'));
    }
    // the income line, and the rule-of-thumb marks
    const xi = sx(income);
    gBar.appendChild(s('line', { x1: xi, x2: xi, y1: Y0 - 12, y2: Y1 + 8, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    gBar.appendChild(s('text.fig-label-sm', { x: xi > W - 150 ? xi - 6 : xi + 6, y: Y1 + 24, 'text-anchor': xi > W - 150 ? 'end' : 'start' }, `take-home pay ${money(income)} a ${period}`));
    if (Array.isArray(spec.guide)) {
      let acc = 0;
      spec.guide.slice(0, 2).forEach((p) => {
        acc += p;
        const x = sx((income * acc) / 100);
        gBar.appendChild(s('path', { d: `M${x} ${Y0 - 4}l-6 -10h12Z`, fill: 'var(--ink)' }));
      });
      gBar.appendChild(s('text.fig-label-sm', { x: X0, y: 22, 'text-anchor': 'start' }, `▼ the ${spec.guide.join('/')} rule of thumb`));
    }
    for (const g of GROUPS) ro[g.id].set(`${money(t[g.id])} · ${t.shares[g.id]}%`);
    line.textContent = t.left === 0 ? 'Every dollar has a job.' : t.left > 0 ? `${money(t.left)} has no job yet.` : `Overspent by ${money(-t.left)}: more is planned than comes in.`;
    line.style.color = t.left < 0 ? 'var(--red-text)' : '';
    svg.setAttribute('aria-label', `${spec.alt || 'A budget bar'}. Needs ${money(t.needs)}, wants ${money(t.wants)}, saving ${money(t.saving)} out of ${money(income)}. ${line.textContent}`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !next.amounts) return;
      for (const it of items) {
        if (it.fixed || typeof next.amounts[it.id] !== 'number') continue;
        amounts[it.id] = clamp(next.amounts[it.id], it.min, it.max);
        if (sliders[it.id]) sliders[it.id].set(amounts[it.id]);
      }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); for (const k in sliders) sliders[k].setDisabled(readOnly); },
  };
}

export const examples = [
  {
    title: 'budget-builder — give every dollar a job',
    spec: {
      type: 'budget-builder', person: 'Tomás', income: 3000, guide: [50, 30, 20],
      items: [
        { id: 'rent', label: 'Rent', group: 'needs', amount: 900, fixed: true },
        { id: 'food', label: 'Groceries', group: 'needs', amount: 400, min: 250, max: 700, step: 50 },
        { id: 'fun', label: 'Eating out, hobbies', group: 'wants', amount: 800, min: 0, max: 1200, step: 50 },
        { id: 'saving', label: 'Saving', group: 'saving', amount: 0, min: 0, max: 1200, step: 50 },
      ],
    },
  },
];
