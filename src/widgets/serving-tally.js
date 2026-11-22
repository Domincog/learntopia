/**
 * serving-tally — add up what a list of servings contributes, against a reference line.
 *
 * A row of foods, each with the amount of one nutrient that a serving supplies. Tapping a food puts it into
 * (or takes it out of) an example person's day; a bar adds the amounts up and shows where the total stands
 * against a reference amount. Used for "can plant foods supply enough protein?" and "where does the salt in
 * a day come from?". It describes; it does not judge: the reference is drawn as a line, not as a pass mark.
 *
 * {
 *   type: 'serving-tally',
 *   what: 'protein',            // the nutrient being added up
 *   unit: 'g',
 *   items: [{ id: 'lentils', name: 'a bowl of lentils', amount: 18, tag: 'plant' }, …],
 *   tags: { plant: { name: 'plant foods', color: 'green' }, animal: { name: 'animal foods', color: 'violet' } },   // optional grouping
 *   picked: [],                 // ids in the day at the start
 *   target: 56,                 // the reference amount (optional)
 *   targetLabel: "Amara's reference intake",
 *   scaleMax: 100,              // right-hand end of the bar (default: enough for the target and for every item)
 *   decimals: 0,                // decimals shown for amounts
 *   static: false,
 * }
 *
 * State: { picked, count, total, reached, byTag, top, largest }
 *   picked   — ids of the servings in the day, in the order they were added
 *   count    — how many;  total — the sum of their amounts
 *   reached  — total >= target (false when there is no target)
 *   byTag    — { tag: sum of the amounts of the picked items with that tag }
 *   top      — id of the picked item that contributes most (null when nothing is picked)
 *   largest  — id of the item with the largest amount in the whole list
 *
 * setState({ picked: [...] }).
 */
import { frame, hue, s, h, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 430;                // drawn narrow, so that the numbers in the bar stay readable on a phone
const H = 118;
const X0 = 14;
const X1 = W - 14;
const BY = 52;
const BH = 40;

addStyles('serving-tally', `
  .widget-serving-tally .st-items { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-serving-tally .st-item { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 12px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 700; line-height: 1.15; cursor: pointer; text-align: left; }
  .widget-serving-tally .st-item b { font-family: var(--font-mono); font-weight: 700; white-space: nowrap; color: var(--ink-2); }
  .widget-serving-tally .st-item[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
  .widget-serving-tally .st-item[aria-pressed="true"] b { color: var(--paper); }
  .widget-serving-tally .st-item:disabled { cursor: default; opacity: 0.8; }
  .widget-serving-tally .st-sum { text-align: center; font-size: var(--fs-md); font-weight: 700; min-height: 1.5em; }
  .widget-serving-tally .st-sum small { display: block; font-size: var(--fs-sm); font-weight: 600; color: var(--ink-2); }
  .widget-serving-tally .st-seg { font-family: var(--font-body); font-size: 12px; font-weight: 800; fill: #1D1B26; pointer-events: none; }
`);

export default function create(spec, env) {
  const items = Array.isArray(spec.items) ? spec.items : [];
  const byId = (id) => items.find((it) => it.id === id) || null;
  const tags = spec.tags || {};
  const unit = spec.unit || 'g';
  const what = spec.what || '';
  const decimals = spec.decimals != null ? spec.decimals : 0;
  const target = typeof spec.target === 'number' ? spec.target : null;
  const isStatic = !!spec.static || !!env.compact;
  const all = items.reduce((t, it) => t + it.amount, 0);
  const scaleMax = spec.scaleMax || Math.max(all, (target || 0) * 1.25, 1);
  let picked = (Array.isArray(spec.picked) ? spec.picked : []).filter(byId);
  let readOnly = !!env.readOnly;
  const fmt = (v) => `${formatNumber(v, decimals)} ${unit}`;
  const tidy = (v) => Math.round(v * 1000) / 1000;

  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, maxWidth: 540, label: spec.alt || 'A running total' });
  const { svg } = fr;
  const gBar = s('g');
  svg.appendChild(gBar);
  const sx = (v) => X0 + (Math.min(v, scaleMax) / scaleMax) * (X1 - X0);

  const chips = {};
  if (!isStatic) {
    const box = h('div.st-items', { role: 'group', 'aria-label': 'Servings' });
    for (const it of items) {
      const b = h('button.st-item', { type: 'button', 'aria-pressed': 'false' }, h('span', it.name), h('b', fmt(it.amount)));
      b.addEventListener('click', () => {
        if (readOnly) return;
        picked = picked.includes(it.id) ? picked.filter((id) => id !== it.id) : [...picked, it.id];
        play('select');
        render();
        env.announce(describe());
        env.onChange(getState());
      });
      chips[it.id] = b;
      box.appendChild(b);
    }
    fr.el.appendChild(box);
  }
  const sum = h('div.st-sum', { 'aria-live': 'polite' });
  if (!env.compact) fr.el.insertBefore(sum, fr.readouts);

  function totals() {
    let total = 0;
    const byTag = {};
    for (const key of Object.keys(tags)) byTag[key] = 0;
    let top = null;
    for (const id of picked) {
      const it = byId(id);
      total += it.amount;
      if (it.tag) byTag[it.tag] = tidy((byTag[it.tag] || 0) + it.amount);
      if (top == null || it.amount > byId(top).amount) top = id;
    }
    return { total: tidy(total), byTag, top };
  }
  function describe() {
    const t = totals();
    return `${picked.length} serving${picked.length === 1 ? '' : 's'} chosen. Total ${fmt(t.total)}${what ? ` of ${what}` : ''}${target != null ? `; the reference line is at ${fmt(target)}` : ''}.`;
  }

  function render() {
    while (gBar.firstChild) gBar.removeChild(gBar.firstChild);
    const t = totals();
    gBar.appendChild(s('rect', { x: X0, y: BY, width: X1 - X0, height: BH, rx: 8, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 2 }));
    let acc = 0;
    picked.forEach((id, i) => {
      const it = byId(id);
      const x = sx(acc);
      const w = sx(acc + it.amount) - x;
      acc += it.amount;
      if (w <= 0) return;
      const color = it.tag && tags[it.tag] ? tags[it.tag].color : ['orange', 'teal', 'violet', 'yellow', 'pink', 'blue'][i % 6];
      gBar.appendChild(s('rect', { x, y: BY, width: w, height: BH, fill: hue(color), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      const text = formatNumber(it.amount, decimals);
      if (w >= 10 + 7 * text.length) gBar.appendChild(s('text.st-seg', { x: x + w / 2, y: BY + BH / 2 + 4, 'text-anchor': 'middle' }, text));
    });
    // scale
    const stepRaw = scaleMax / 5;
    const pow = Math.pow(10, Math.floor(Math.log10(stepRaw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((v) => v >= stepRaw) || stepRaw;
    for (let v = 0; v <= scaleMax + 1e-9; v += step) {
      gBar.appendChild(s('line', { x1: sx(v), x2: sx(v), y1: BY + BH, y2: BY + BH + 6, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
      gBar.appendChild(s('text.tick-label', { x: sx(v), y: BY + BH + 21, 'text-anchor': v === 0 ? 'start' : 'middle' }, v === 0 ? `0 ${unit}` : formatNumber(tidy(v), 2)));
    }
    if (target != null) {
      const x = sx(target);
      gBar.appendChild(s('line', { x1: x, x2: x, y1: BY - 12, y2: BY + BH + 4, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '5 4' }));
      const left = x > (X0 + X1) / 2;
      gBar.appendChild(s('text.fig-label', { x: x + (left ? -8 : 8), y: BY - 14, 'text-anchor': left ? 'end' : 'start' }, `${spec.targetLabel || 'reference'}: ${fmt(target)}`));
    }
    const tagLine = Object.keys(tags).filter((key) => t.byTag[key] > 0).map((key) => `${tags[key].name} ${fmt(t.byTag[key])}`).join(' · ');
    sum.replaceChildren(...[h('span', `Total so far: ${fmt(t.total)}${what ? ` of ${what}` : ''}`), tagLine ? h('small', tagLine) : null].filter(Boolean));
    for (const id in chips) chips[id].setAttribute('aria-pressed', picked.includes(id) ? 'true' : 'false');
    svg.setAttribute('aria-label', `${spec.alt || 'A bar that adds up the servings chosen'}. ${describe()}`);
  }

  function getState() {
    const t = totals();
    let largest = null;
    for (const it of items) if (largest == null || it.amount > byId(largest).amount) largest = it.id;
    return { picked: picked.slice(), count: picked.length, total: t.total, reached: target != null && t.total >= target - 1e-9, byTag: t.byTag, top: t.top, largest };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.picked)) picked = [...new Set(next.picked)].filter(byId);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const id in chips) chips[id].disabled = readOnly;
    },
  };
}

export const examples = [
  {
    title: 'serving-tally — protein from plant foods',
    spec: {
      type: 'serving-tally', what: 'protein', target: 56, targetLabel: 'reference intake',
      tags: { plant: { name: 'plant foods', color: 'green' }, animal: { name: 'animal foods', color: 'violet' } },
      items: [
        { id: 'lentils', name: 'a bowl of lentils', amount: 18, tag: 'plant' },
        { id: 'tofu', name: 'a block of tofu', amount: 20, tag: 'plant' },
        { id: 'bread', name: 'two slices of bread', amount: 8, tag: 'plant' },
        { id: 'eggs', name: 'two eggs', amount: 13, tag: 'animal' },
      ],
      picked: ['lentils'],
    },
  },
];
