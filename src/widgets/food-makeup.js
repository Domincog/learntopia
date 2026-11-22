/**
 * food-makeup — what 100 grams of a food is made of, and where its energy comes from.
 *
 * Two bars. The top one is 100 g of the food cut into water, carbohydrate, fibre, protein and fat. The bottom
 * one is the energy those grams carry (4 kcal per gram of carbohydrate or protein, 9 per gram of fat, 2 per
 * gram of fibre, none for water), drawn to one fixed scale, so that a watery food gives a short bar and an oily
 * one a long bar. Whatever the five parts leave of the 100 g (minerals, mostly) is drawn as a grey "other" part.
 * The learner switches between foods, or (with `build`) sets the grams with sliders.
 *
 * {
 *   type: 'food-makeup',
 *   foods: [{ id: 'bread', name: 'White bread', water: 36, carb: 47, fibre: 3, protein: 9, fat: 3 }, …],   // grams per 100 g
 *   food: 'bread',           // the food shown first (default: the first of the list)
 *   pick: true,              // buttons to switch between the foods (default: true when there is more than one)
 *   build: false,            // true: sliders for carbohydrate, fibre, protein and fat; water fills the rest
 *   step: 5,                 // slider step in grams (build)
 *   energy: true,            // false hides the energy bar and the numbers, for a "predict first" picture
 *   unit: 'kcal',            // or 'kJ'
 *   static: false,
 * }
 *
 * State: { food, grams: { water, carb, fibre, protein, fat }, kcal, kj, share: { carb, fibre, protein, fat }, top, seen, seenCount }
 *   food   — id of the food shown (null once the sliders of `build` have been moved)
 *   kcal   — energy in 100 g, from the label factors;  kj — the same in kilojoules (17, 17, 37 and 8 kJ per gram)
 *   share  — percentage of that energy from each nutrient, in whole numbers
 *   top    — the nutrient that supplies most of the energy ('carb' | 'protein' | 'fat' | 'fibre'), or null with no energy
 *   seen   — ids of the foods looked at so far, in order;  seenCount — how many
 *
 * setState({ food }) shows a food; setState({ grams: { carb, fibre, protein, fat } }) sets the sliders;
 * setState({ seen: [...] }) marks foods as looked at and shows the last of them.
 *
 * The model leaves a good deal out: the factors are averages (the body gets rather less out of whole nuts than
 * the label says) and alcohol is not included.
 */
import { frame, sliderRow, hue, s, h, clamp, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 430;                // drawn narrow, so that the writing in the bars stays readable on a phone
const H = 222;
const X0 = 12;
const X1 = W - 12;
const KCAL = { carb: 4, fibre: 2, protein: 4, fat: 9 };
const KJ = { carb: 17, fibre: 8, protein: 17, fat: 37 };
const PARTS = [
  { key: 'water', name: 'Water', color: 'blue' },
  { key: 'carb', name: 'Carbohydrate', color: 'orange' },
  { key: 'fibre', name: 'Fibre', color: 'green' },
  { key: 'protein', name: 'Protein', color: 'violet' },
  { key: 'fat', name: 'Fat', color: 'yellow' },
  { key: 'other', name: 'Other', color: 'gray' },      // whatever the five parts leave of the 100 g; shown only when there is some
];
const NUTRIENTS = PARTS.slice(1, 5);                              // the parts that carry energy
const MAX_KCAL = 900;

addStyles('food-makeup', `
  .widget-food-makeup .fm-foods { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-food-makeup .fm-food { min-height: 40px; padding: 4px 12px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
  .widget-food-makeup .fm-food[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
  .widget-food-makeup .fm-food:disabled { cursor: default; opacity: 0.75; }
  .widget-food-makeup .fm-table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); font-variant-numeric: tabular-nums; }
  .widget-food-makeup .fm-table th, .widget-food-makeup .fm-table td { padding: 2px 8px; text-align: right; border-bottom: 1px solid var(--hair); }
  .widget-food-makeup .fm-table th:first-child, .widget-food-makeup .fm-table td:first-child { text-align: left; }
  .widget-food-makeup .fm-table thead th { font-size: var(--fs-xs); color: var(--ink-2); font-weight: 800; }
  .widget-food-makeup .fm-table tfoot td { font-weight: 800; border-bottom: 0; }
  .widget-food-makeup .fm-key { display: inline-block; width: 12px; height: 12px; margin-right: 6px; border: 2px solid var(--ink); border-radius: 3px; vertical-align: -1px; }
  .widget-food-makeup .w-slider { grid-template-columns: 7.2em minmax(0, 1fr) 3.4em; }
  .widget-food-makeup .fm-seg-label { font-family: var(--font-body); font-size: 12px; font-weight: 800; fill: #1D1B26; pointer-events: none; }
`);

const round1 = (v) => Math.round(v * 10) / 10;

/** Energy in 100 g of a composition, kcal. */
export const energyKcal = (g) => KCAL.carb * (g.carb || 0) + KCAL.fibre * (g.fibre || 0) + KCAL.protein * (g.protein || 0) + KCAL.fat * (g.fat || 0);
export const energyKj = (g) => KJ.carb * (g.carb || 0) + KJ.fibre * (g.fibre || 0) + KJ.protein * (g.protein || 0) + KJ.fat * (g.fat || 0);
/** Percentage of the energy that each nutrient supplies (whole numbers), and the biggest supplier. */
export function energyShare(g) {
  const total = energyKcal(g);
  const share = {};
  let top = null;
  for (const key of ['carb', 'fibre', 'protein', 'fat']) {
    share[key] = total > 0 ? Math.round((KCAL[key] * (g[key] || 0) * 100) / total) : 0;
    if (total > 0 && (top == null || KCAL[key] * (g[key] || 0) > KCAL[top] * (g[top] || 0))) top = key;
  }
  return { share, top };
}

export default function create(spec, env) {
  const foods = Array.isArray(spec.foods) ? spec.foods : [];
  const isStatic = !!spec.static || !!env.compact;
  const build = !!spec.build && !isStatic;
  const pick = !isStatic && !build && spec.pick !== false && foods.length > 1;
  const showEnergy = spec.energy !== false;
  const unit = spec.unit === 'kJ' ? 'kJ' : 'kcal';
  const step = spec.step || 5;
  const byId = (id) => foods.find((f) => f.id === id) || null;
  const gramsOf = (f) => {
    const g = { carb: f.carb || 0, fibre: f.fibre || 0, protein: f.protein || 0, fat: f.fat || 0 };
    const rest = Math.max(0, 100 - g.carb - g.fibre - g.protein - g.fat);
    g.water = f.water != null ? Math.min(f.water, rest) : rest;
    g.other = Math.round((rest - g.water) * 10) / 10;
    return g;
  };

  let current = byId(spec.food) || foods[0] || null;
  let grams = current ? gramsOf(current) : { water: 100, carb: 0, fibre: 0, protein: 0, fat: 0, other: 0 };
  if (build && spec.grams) grams = gramsOf({ ...spec.grams, water: null });
  if (build) current = null;
  let seen = current ? [current.id] : [];
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: showEnergy ? H : 100, compact: env.compact, plain: true, maxWidth: 540, label: spec.alt || 'What a food is made of' });
  const { svg } = fr;
  const gBars = s('g');
  svg.appendChild(gBars);

  const chips = {};
  let chipBox = null;
  if (pick) {
    chipBox = h('div.fm-foods', { role: 'group', 'aria-label': 'Foods' });
    for (const f of foods) {
      const b = h('button.fm-food', { type: 'button', 'aria-pressed': 'false' }, f.name);
      b.addEventListener('click', () => {
        if (readOnly) return;
        current = f;
        grams = gramsOf(f);
        if (!seen.includes(f.id)) seen.push(f.id);
        play('select');
        render();
        env.announce(describe());
        env.onChange(getState());
      });
      chips[f.id] = b;
      chipBox.appendChild(b);
    }
    fr.el.insertBefore(chipBox, fr.canvas);
  }

  const table = h('table.fm-table');
  if (!env.compact && showEnergy) fr.el.insertBefore(table, fr.readouts);

  const sliders = {};
  if (build) {
    for (const part of NUTRIENTS) {
      sliders[part.key] = sliderRow({
        label: part.name, min: 0, max: 100, step, value: grams[part.key], color: part.color, unit: 'g',
        onInput: (v) => {
          if (readOnly) return;
          const others = ['carb', 'fibre', 'protein', 'fat'].filter((k) => k !== part.key).reduce((t, k) => t + grams[k], 0);
          grams[part.key] = clamp(v, 0, 100 - others);          // 100 g is all there is
          grams.water = 100 - others - grams[part.key];
          grams.other = 0;
          if (grams[part.key] !== v) sliders[part.key].set(grams[part.key]);
          current = null;
          render();
          env.onChange(getState());
        },
      });
      fr.controls.appendChild(sliders[part.key].el);
    }
  }

  function facts() {
    const kcal = energyKcal(grams);
    const { share, top } = energyShare(grams);
    return { kcal: round1(kcal), kj: Math.round(energyKj(grams)), share, top };
  }
  const energyText = (f) => (unit === 'kJ' ? `${formatNumber(f.kj, 0)} kJ` : `${formatNumber(f.kcal, 0)} kcal`);
  function describe() {
    const f = facts();
    const parts = PARTS.filter((p) => grams[p.key] > 0).map((p) => `${p.key === 'other' ? 'other' : p.name.toLowerCase()} ${formatNumber(grams[p.key], 1)} g`).join(', ');
    const name = current ? current.name : 'This food';
    return showEnergy ? `${name}, per 100 grams: ${parts}. Energy ${energyText(f)}.` : `${name}, per 100 grams: ${parts}.`;
  }

  function bar(y, hgt, title, segs, scaleTo) {
    gBars.appendChild(s('text.fig-label', { x: X0, y: y - 9, 'text-anchor': 'start' }, title));
    const full = X1 - X0;
    gBars.appendChild(s('rect', { x: X0, y, width: full, height: hgt, rx: 8, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 2 }));
    let x = X0;
    for (const seg of segs) {
      if (!(seg.value > 0)) continue;
      const w = (seg.value / scaleTo) * full;
      gBars.appendChild(s('rect', { x, y, width: w, height: hgt, fill: hue(seg.color), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      const text = w >= 22 + 6.6 * seg.label.length ? seg.label : (w >= 12 + 6.6 * seg.short.length ? seg.short : '');
      if (text) gBars.appendChild(s('text.fm-seg-label', { x: x + w / 2, y: y + hgt / 2 + 4, 'text-anchor': 'middle' }, text));
      x += w;
    }
  }

  function render() {
    while (gBars.firstChild) gBars.removeChild(gBars.firstChild);
    const f = facts();
    const name = current ? current.name.charAt(0).toLowerCase() + current.name.slice(1) : 'your food';
    bar(34, 46, `100 g of ${name}`, PARTS.map((p) => ({ value: grams[p.key], color: p.color, label: `${p.key === 'other' ? 'other' : p.name.toLowerCase()} ${formatNumber(grams[p.key], 0)} g`, short: `${formatNumber(grams[p.key], 0)} g` })), 100);
    if (showEnergy) {
      const segs = NUTRIENTS.map((p) => ({ value: KCAL[p.key] * grams[p.key], color: p.color, label: `${p.name.toLowerCase()} ${f.share[p.key]}%`, short: `${f.share[p.key]}%` }));
      bar(134, 46, `Its energy: ${energyText(f)}`, segs, MAX_KCAL);
      for (const t of [0, 300, 600, 900]) {
        const x = X0 + (t / MAX_KCAL) * (X1 - X0);
        gBars.appendChild(s('line', { x1: x, x2: x, y1: 180, y2: 187, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
        gBars.appendChild(s('text.tick-label', { x, y: 204, 'text-anchor': t === 0 ? 'start' : t === 900 ? 'end' : 'middle' }, unit === 'kJ' ? `${formatNumber(Math.round(t * 4.184 / 100) * 100, 0)} kJ` : `${t} kcal`));
      }
    }
    // the same as a table: grams, and the energy they carry
    table.replaceChildren(
      h('thead', h('tr', h('th', { scope: 'col' }, 'In 100 g'), h('th', { scope: 'col' }, 'grams'), h('th', { scope: 'col' }, unit === 'kJ' ? 'kJ per g' : 'kcal per g'), h('th', { scope: 'col' }, unit))),
      h('tbody', PARTS.filter((p) => p.key !== 'other' || grams.other > 0).map((p) => {
        const per = p.key === 'water' || p.key === 'other' ? 0 : (unit === 'kJ' ? KJ : KCAL)[p.key];
        const key = h('span.fm-key');
        key.style.background = hue(p.color);
        return h('tr', h('td', key, p.name), h('td', formatNumber(grams[p.key], 1)), h('td', String(per)), h('td', formatNumber(per * grams[p.key], 0)));
      })),
      h('tfoot', h('tr', h('td', 'Total'), h('td', '100'), h('td', ''), h('td', formatNumber(unit === 'kJ' ? f.kj : f.kcal, 0)))),
    );
    for (const id in chips) chips[id].setAttribute('aria-pressed', current && current.id === id ? 'true' : 'false');
    svg.setAttribute('aria-label', describe());
  }
  function getState() {
    const f = facts();
    return {
      food: current ? current.id : null,
      grams: { water: grams.water, carb: grams.carb, fibre: grams.fibre, protein: grams.protein, fat: grams.fat },
      kcal: f.kcal, kj: f.kj, share: f.share, top: f.top,
      seen: seen.slice(), seenCount: seen.length,
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.seen)) {
        seen = next.seen.filter((id) => byId(id));
        const last = byId(seen[seen.length - 1]);
        if (last && next.food == null) { current = last; grams = gramsOf(last); }
      }
      if (next.food != null && byId(next.food)) {
        current = byId(next.food);
        grams = gramsOf(current);
        if (!seen.includes(current.id)) seen.push(current.id);
      } else if (next.grams && build) {
        const g = { carb: 0, fibre: 0, protein: 0, fat: 0, ...next.grams };
        let left = 100;
        for (const key of ['carb', 'fibre', 'protein', 'fat']) { g[key] = clamp(Number(g[key]) || 0, 0, left); left -= g[key]; }
        grams = { ...g, water: left, other: 0 };
        current = null;
        for (const key in sliders) sliders[key].set(grams[key]);
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      for (const id in chips) chips[id].disabled = readOnly;
    },
  };
}

const DEMO = [
  { id: 'oil', name: 'Olive oil', water: 0, carb: 0, fibre: 0, protein: 0, fat: 100 },
  { id: 'bread', name: 'White bread', water: 36, carb: 47, fibre: 3, protein: 9, fat: 3 },
  { id: 'lentils', name: 'Lentils (boiled)', water: 70, carb: 12, fibre: 8, protein: 9, fat: 0 },
  { id: 'apple', name: 'Apple', water: 86, carb: 11, fibre: 2, protein: 0, fat: 0 },
];
export const examples = [
  { title: 'food-makeup — switch between foods', spec: { type: 'food-makeup', foods: DEMO, food: 'bread' } },
  { title: 'food-makeup — build a food with sliders', spec: { type: 'food-makeup', build: true, grams: { carb: 40, fibre: 5, protein: 10, fat: 10 } } },
  { title: 'food-makeup — weight only', spec: { type: 'food-makeup', foods: DEMO, food: 'apple', energy: false, static: true } },
];
