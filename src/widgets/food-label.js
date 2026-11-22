/**
 * food-label — a nutrition label as it is printed on a pack in Europe, generated from numbers.
 *
 * The table gives each nutrient per 100 g (or 100 mL) and per serving; the energy lines are worked out from the
 * grams with the factors labels use (fat 37 kJ / 9 kcal per gram, carbohydrate and protein 17 kJ / 4 kcal,
 * fibre 8 kJ / 2 kcal). Under it comes the ingredients list, in descending order of weight. A lesson can hide
 * cells for the learner to work out, add front-of-pack "traffic lights", or let the learner tap a line.
 *
 * {
 *   type: 'food-label',
 *   product: {
 *     name: 'Crunchy oat granola', serving: 45, unit: 'g',            // unit: 'g' or 'mL'
 *     fat: 15, saturates: 3.5, carb: 60, sugars: 22, fibre: 7, protein: 9, salt: 0.1,   // per 100 g
 *     ingredients: ['oat flakes (55%)', 'sugar', …],                   // in the order of the pack
 *   },
 *   columns: ['100', 'serving'],     // which columns to print (default: both)
 *   rows: ['fat', 'sugars', 'salt'], // print only these lines (default: all eight)
 *   energy: 'both',                  // 'both' | 'kJ' | 'kcal'
 *   ingredients: true,               // false: no ingredients list
 *   lights: false,                   // true: a front-of-pack strip with LOW / MED / HIGH for fat, saturates, sugars and salt
 *                                    //   (UK bands per 100 g: fat 3 and 17.5 g, saturates 1.5 and 5, sugars 5 and 22.5, salt 0.3 and 1.5)
 *   hide: ['100:energy', 'serving:sugars'],   // cells printed as "?": 'column:row'
 *   mode: 'view',                    // 'pick': the learner taps a line of the table or an ingredient
 *   pickable: 'rows',                // 'rows' | 'ingredients' | 'both'
 * }
 *
 * Rows: energy, fat, saturates, carb, sugars, fibre, protein, salt.
 *
 * State (pick mode): { picked, kind, index }
 *   picked — the row id ('sugars') or 'ingredient:2' (the third ingredient), or null
 *   kind   — 'row' | 'ingredient' | null;  index — position of the ingredient in the list (0 = first), or null
 * In view mode the state is {}.
 *
 * setState({ picked: 'sugars' }) or ({ picked: 'ingredient:0' }).
 */
import { h, cx, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const ROWS = [
  { id: 'energy', name: 'Energy' },
  { id: 'fat', name: 'Fat' },
  { id: 'saturates', name: 'of which saturates', sub: true },
  { id: 'carb', name: 'Carbohydrate' },
  { id: 'sugars', name: 'of which sugars', sub: true },
  { id: 'fibre', name: 'Fibre' },
  { id: 'protein', name: 'Protein' },
  { id: 'salt', name: 'Salt' },
];
const BANDS = { fat: [3, 17.5], saturates: [1.5, 5], sugars: [5, 22.5], salt: [0.3, 1.5] };

addStyles('food-label', `
  .widget-food-label { width: 100%; max-width: 440px; margin: 0 auto; display: grid; gap: var(--s3); }
  .widget-food-label .fl-card { border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); padding: var(--s3) var(--s4); display: grid; gap: 2px; }
  .widget-food-label .fl-name { font-weight: 800; font-size: var(--fs-md); }
  .widget-food-label .fl-serving { font-size: var(--fs-sm); color: var(--ink-2); margin-bottom: 4px; }
  .widget-food-label .fl-row { display: grid; grid-template-columns: minmax(0, 1fr) 6.2em 6.2em; gap: 6px; align-items: baseline; width: 100%; padding: 3px 6px; border: 0; border-top: 1px solid var(--hair); background: none; color: var(--ink); font: inherit; font-size: var(--fs-sm); text-align: left; font-variant-numeric: tabular-nums; }
  .widget-food-label .fl-row.is-one { grid-template-columns: minmax(0, 1fr) 7em; }
  .widget-food-label .fl-row > span + span { text-align: right; font-family: var(--font-mono); }
  .widget-food-label .fl-head { border-top: 0; border-bottom: 2px solid var(--ink); font-weight: 800; font-size: var(--fs-xs); }
  .widget-food-label .fl-head > span + span { font-family: var(--font-body); }
  .widget-food-label .fl-row.is-sub > span:first-child { padding-left: 1em; color: var(--ink-2); }
  .widget-food-label .fl-row.is-main > span:first-child { font-weight: 700; }
  .widget-food-label button.fl-row, .widget-food-label button.fl-ing { cursor: pointer; border-radius: 6px; min-height: 34px; }
  .widget-food-label button.fl-row:hover, .widget-food-label button.fl-ing:hover { background: var(--sunken); }
  .widget-food-label button.fl-row[aria-pressed="true"], .widget-food-label button.fl-ing[aria-pressed="true"] { background: var(--yellow-soft); box-shadow: inset 0 0 0 2px var(--ink); }
  .widget-food-label button:disabled { cursor: default; opacity: 1; }
  .widget-food-label .fl-hidden { display: inline-block; min-width: 2.6em; padding: 0 6px; border: 2px dashed var(--ink-3); border-radius: 6px; text-align: center; font-weight: 800; }
  .widget-food-label .fl-ings { display: block; font-size: var(--fs-sm); line-height: 1.7; }
  .widget-food-label .fl-ings.is-pick { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
  .widget-food-label .fl-ings b { font-weight: 800; }
  .widget-food-label .fl-ing { display: inline; padding: 2px 6px; border: 0; background: none; color: var(--ink); font: inherit; }
  .widget-food-label button.fl-ing { display: inline-block; border: 1.5px dashed var(--ink-3); padding: 2px 10px; }
  .widget-food-label .fl-lights { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .widget-food-label .fl-light { border: var(--bw) solid var(--edge-strong); border-radius: var(--r-sm); padding: 4px 2px; text-align: center; font-size: var(--fs-xs); font-weight: 700; color: #1D1B26; line-height: 1.25; }
  .widget-food-label .fl-light b { display: block; font-size: var(--fs-sm); font-family: var(--font-mono); }
  .widget-food-label .fl-light i { display: block; font-style: normal; font-weight: 800; letter-spacing: 0.04em; }
  .widget-food-label .fl-light.is-low { background: var(--green); }
  .widget-food-label .fl-light.is-medium { background: var(--yellow); }
  .widget-food-label .fl-light.is-high { background: var(--red); }
`);

/** Energy of 100 g of a product from its grams, as a label states it. */
export const labelKj = (p) => Math.round(37 * (p.fat || 0) + 17 * (p.carb || 0) + 17 * (p.protein || 0) + 8 * (p.fibre || 0));
export const labelKcal = (p) => Math.round(9 * (p.fat || 0) + 4 * (p.carb || 0) + 4 * (p.protein || 0) + 2 * (p.fibre || 0));
/** A per-100 value scaled to the serving, rounded as a label would (one decimal). */
export const perServing = (per100, serving) => Math.round(((per100 * serving) / 100) * 10) / 10;
/** 'low' | 'medium' | 'high' on the UK front-of-pack bands (per 100 g of a food). */
export const lightBand = (key, g) => (g <= BANDS[key][0] ? 'low' : g > BANDS[key][1] ? 'high' : 'medium');

const grams = (v) => `${formatNumber(v, 1)} g`;

export default function create(spec, env) {
  const p = spec.product || {};
  const unit = p.unit === 'mL' ? 'mL' : 'g';
  const serving = p.serving || 100;
  const cols = (Array.isArray(spec.columns) && spec.columns.length ? spec.columns : ['100', 'serving']).filter((c) => c === '100' || c === 'serving');
  const hide = new Set(spec.hide || []);
  const energyMode = spec.energy === 'kJ' || spec.energy === 'kcal' ? spec.energy : 'both';
  const pick = spec.mode === 'pick' && !env.compact;
  const pickable = spec.pickable || 'rows';
  const ings = Array.isArray(p.ingredients) ? p.ingredients : [];
  let picked = null;
  let readOnly = !!env.readOnly;

  const value = (rowId, col) => {
    const scale = col === 'serving' ? serving / 100 : 1;
    if (rowId === 'energy') {
      const kj = Math.round(labelKj(p) * scale);
      const kcal = Math.round(labelKcal(p) * scale);
      // kJ and kcal on two lines, as on real packs
      return energyMode === 'kJ' ? [`${formatNumber(kj, 0)} kJ`] : energyMode === 'kcal' ? [`${formatNumber(kcal, 0)} kcal`] : [`${formatNumber(kj, 0)} kJ`, h('br'), `${formatNumber(kcal, 0)} kcal`];
    }
    return [grams(col === 'serving' ? perServing(p[rowId] || 0, serving) : (p[rowId] || 0))];
  };
  const cell = (rowId, col) => (hide.has(`${col}:${rowId}`) ? h('span', h('span.fl-hidden', { 'aria-label': 'hidden' }, '?')) : h('span', value(rowId, col)));

  const root = h('div', { role: 'group', 'aria-label': spec.alt || `Nutrition label of ${p.name || 'a food'}` });
  const rowEls = {};
  const ingEls = [];

  function choose(id) {
    if (readOnly) return;
    picked = picked === id ? null : id;
    play('select');
    paint();
    env.announce(picked ? `Selected: ${describe(picked)}` : 'Nothing selected');
    env.onChange(getState());
  }
  const describe = (id) => (id.startsWith('ingredient:') ? `ingredient ${Number(id.split(':')[1]) + 1}, ${ings[Number(id.split(':')[1])]}` : ROWS.find((r) => r.id === id).name);

  if (spec.lights && !env.compact) {
    const strip = h('div.fl-lights', { role: 'group', 'aria-label': 'Front-of-pack label, per 100 grams' });
    for (const key of ['fat', 'saturates', 'sugars', 'salt']) {
      const band = lightBand(key, p[key] || 0);
      strip.appendChild(h('div', { class: `fl-light is-${band}` }, key === 'saturates' ? 'Saturates' : key.charAt(0).toUpperCase() + key.slice(1), h('b', grams(p[key] || 0)), h('i', band === 'medium' ? 'MED' : band.toUpperCase())));
    }
    root.appendChild(strip);
  }

  const card = h('div.fl-card');
  card.appendChild(h('div.fl-name', p.name || 'Nutrition information'));
  card.appendChild(h('div.fl-serving', `Serving: ${formatNumber(serving, 0)} ${unit}`));
  const one = cols.length === 1;
  const colName = (c) => (c === '100' ? `per 100 ${unit}` : `per serving (${formatNumber(serving, 0)} ${unit})`);
  card.appendChild(h('div', { class: cx('fl-row fl-head', one && 'is-one') }, h('span', 'Typical values'), cols.map((c) => h('span', colName(c)))));
  const wanted = Array.isArray(spec.rows) && spec.rows.length ? spec.rows : null;
  for (const row of ROWS) {
    if (wanted && !wanted.includes(row.id)) continue;
    // "of which sugars" only makes sense under its parent line; printed alone it is simply "Sugars"
    const parent = row.id === 'saturates' ? 'fat' : row.id === 'sugars' ? 'carb' : null;
    const alone = !!parent && !!wanted && !wanted.includes(parent);
    const kids = [h('span', alone ? row.id.charAt(0).toUpperCase() + row.id.slice(1) : row.name), cols.map((c) => cell(row.id, c))];
    const cls = cx('fl-row', row.sub && !alone ? 'is-sub' : 'is-main', one && 'is-one');
    const canPick = pick && (pickable === 'rows' || pickable === 'both');
    const el = canPick ? h('button', { type: 'button', class: cls, 'aria-pressed': 'false' }, kids) : h('div', { class: cls }, kids);
    if (canPick) el.addEventListener('click', () => choose(row.id));
    rowEls[row.id] = el;
    card.appendChild(el);
  }
  root.appendChild(card);

  if (spec.ingredients !== false && ings.length && !env.compact) {
    const canPick = pick && (pickable === 'ingredients' || pickable === 'both');
    const list = h('div', { class: cx('fl-card fl-ings', canPick && 'is-pick') }, h('b', 'Ingredients: '));
    ings.forEach((name, i) => {
      const el = canPick ? h('button.fl-ing', { type: 'button', 'aria-pressed': 'false' }, name) : h('span.fl-ing', name);
      if (canPick) el.addEventListener('click', () => choose(`ingredient:${i}`));
      ingEls.push(el);
      list.appendChild(el);
      if (!canPick && i < ings.length - 1) list.appendChild(document.createTextNode(', '));
    });
    root.appendChild(list);
  }

  function paint() {
    for (const id in rowEls) if (rowEls[id].tagName === 'BUTTON') rowEls[id].setAttribute('aria-pressed', picked === id ? 'true' : 'false');
    ingEls.forEach((el, i) => { if (el.tagName === 'BUTTON') el.setAttribute('aria-pressed', picked === `ingredient:${i}` ? 'true' : 'false'); });
  }
  const getState = () => {
    if (!pick) return {};
    const isIng = !!picked && picked.startsWith('ingredient:');
    return { picked, kind: picked ? (isIng ? 'ingredient' : 'row') : null, index: isIng ? Number(picked.split(':')[1]) : null };
  };

  paint();
  return {
    el: root,
    getState,
    setState(next) {
      if (!next || !pick) return;
      if (next.picked === null || rowEls[next.picked] || (typeof next.picked === 'string' && next.picked.startsWith('ingredient:') && ings[Number(next.picked.split(':')[1])] != null)) picked = next.picked;
      paint();
    },
    setReadOnly(v) {
      readOnly = !!v;
      root.classList.toggle('is-readonly', readOnly);
      for (const id in rowEls) if (rowEls[id].tagName === 'BUTTON') rowEls[id].disabled = readOnly;
      for (const el of ingEls) if (el.tagName === 'BUTTON') el.disabled = readOnly;
    },
  };
}

const DEMO = { name: 'Crunchy oat granola', serving: 45, unit: 'g', fat: 15, saturates: 3.5, carb: 60, sugars: 22, fibre: 7, protein: 9, salt: 0.1, ingredients: ['oat flakes (55%)', 'sugar', 'sunflower oil', 'honey (4%)', 'almonds (3%)', 'salt'] };
export const examples = [
  { title: 'food-label — a generated label', spec: { type: 'food-label', product: DEMO } },
  { title: 'food-label — traffic lights, and a line to tap', spec: { type: 'food-label', product: DEMO, lights: true, mode: 'pick', pickable: 'both' } },
  { title: 'food-label — a cell to work out', spec: { type: 'food-label', product: DEMO, energy: 'kJ', hide: ['serving:sugars'], ingredients: false } },
];
