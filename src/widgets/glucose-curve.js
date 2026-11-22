/**
 * glucose-curve — blood glucose in the two hours after eating, for foods the learner chooses.
 *
 * Each food is described by its glycaemic index (GI: how much it raises blood glucose compared with pure
 * glucose, when both supply the same amount of carbohydrate) and by the grams of carbohydrate eaten. The
 * widget draws one curve for each food chosen, up to `max` at a time, so that two foods can be compared.
 *
 * {
 *   type: 'glucose-curve',
 *   foods: [{ id: 'bread', name: 'White bread', gi: 75, carbs: 50, serving: '2 slices' }, …],
 *                              // carbs: grams of available carbohydrate eaten (default 50, as in a GI test)
 *                              // serving: optional words shown on the button, e.g. '1 slice (150 g)'
 *   shown: ['bread'],          // foods drawn at the start
 *   max: 2,                    // how many curves at once (1 to 3). Choosing one more replaces the oldest
 *   minutes: 120,              // length of the time axis
 *   static: false,
 * }
 *
 * State: { shown, seen, seenCount, peak, rise, peakAt, load, highest, lowest }
 *   shown    — ids of the foods drawn now, oldest first
 *   seen     — ids of every food drawn so far;  seenCount — how many
 *   peak     — { id: highest blood glucose, mmol/L, one decimal } for the foods shown
 *   rise     — { id: peak minus the starting level, mmol/L, one decimal }
 *   peakAt   — { id: minutes after eating at which the peak comes }
 *   load     — { id: glycaemic load of the portion = GI × grams of carbohydrate ÷ 100, rounded }
 *   highest, lowest — id of the shown food with the highest / lowest peak (null when nothing is shown)
 *
 * setState({ shown: [...] }) draws those foods; setState({ seen: [...] }) marks foods as looked at and draws
 * the last `max` of them.
 *
 * The model (a deliberate simplification, for a healthy adult starting at 5.0 mmol/L, 90 mg/dL):
 *   rise(t) = A · (t/τ)² · e^(2(1 − t/τ)),  τ = 30 + (100 − GI)/4 minutes,
 *   A = 3.0 mmol/L · GI/100 · carbs/50 · 30/τ
 * so 50 g of glucose peaks 3.0 mmol/L above the start after 30 minutes, the area under a curve is in
 * proportion to GI × carbohydrate, and a low-GI food peaks lower and later. Real responses differ a great
 * deal between people, between days and with what else is eaten; the widget says so under the drawing.
 */
import { frame, plane, hue, s, h, clamp, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 330;
const START = 5.0;                  // mmol/L before eating
const MGDL = 18;                    // 1 mmol/L of glucose = 18 mg/dL
const SLOTS = [
  { color: 'orange', dash: null, letter: 'A' },
  { color: 'blue', dash: '9 6', letter: 'B' },
  { color: 'violet', dash: '2 6', letter: 'C' },
];

addStyles('glucose-curve', `
  .widget-glucose-curve .gc-foods { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-glucose-curve .gc-food { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 4px 12px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 700; line-height: 1.15; cursor: pointer; text-align: left; }
  .widget-glucose-curve .gc-food small { display: block; font-size: var(--fs-xs); font-weight: 600; color: var(--ink-2); }
  .widget-glucose-curve .gc-food[aria-pressed="true"] { background: var(--sunken); border-color: var(--edge-strong); box-shadow: inset 0 0 0 2px var(--ink); }
  .widget-glucose-curve .gc-food:disabled { cursor: default; opacity: 0.8; }
  .widget-glucose-curve .gc-tag { display: none; flex: none; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #1D1B26; color: #1D1B26; font-size: 12px; font-weight: 800; align-items: center; justify-content: center; }
  .widget-glucose-curve .gc-food[aria-pressed="true"] .gc-tag { display: inline-flex; }
  .widget-glucose-curve .gc-notes { display: grid; gap: 4px; justify-items: center; min-height: 1.6em; font-size: var(--fs-sm); font-weight: 700; text-align: center; }
  .widget-glucose-curve .gc-notes b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .widget-glucose-curve .gc-letter { font-family: var(--font-body); font-size: 13px; font-weight: 800; fill: #1D1B26; pointer-events: none; dominant-baseline: central; }
  @container wcanvas (max-width: 470px) { .widget-glucose-curve .gc-letter { font-size: 17px; } }
`);

/** Minutes to the peak for a food of glycaemic index `gi`. */
export const peakTime = (gi) => 30 + (100 - gi) / 4;
/** Height of the peak above the starting level, mmol/L. */
export const peakRise = (gi, carbs = 50) => 3.0 * (gi / 100) * (carbs / 50) * (30 / peakTime(gi));
/** Rise above the starting level `t` minutes after eating, mmol/L. */
export function glucoseRise(gi, carbs, t) {
  if (t <= 0) return 0;
  const u = t / peakTime(gi);
  return peakRise(gi, carbs) * u * u * Math.exp(2 * (1 - u));
}
/** Glycaemic load of a portion. */
export const glycaemicLoad = (gi, carbs = 50) => Math.round((gi * carbs) / 100);

const round1 = (v) => Math.round(v * 10) / 10;

export default function create(spec, env) {
  const foods = (Array.isArray(spec.foods) ? spec.foods : []).map((f) => ({ carbs: 50, ...f }));
  const byId = (id) => foods.find((f) => f.id === id) || null;
  const isStatic = !!spec.static || !!env.compact;
  const max = clamp(Math.round(spec.max || 2), 1, SLOTS.length);
  const minutes = spec.minutes || 120;
  let shown = (Array.isArray(spec.shown) ? spec.shown : []).filter(byId).slice(-max);
  let seen = shown.slice();
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Blood glucose after eating' });
  const { svg } = fr;
  const pl = plane({ x: [0, minutes], y: [4, 9], width: W, height: H, pad: { l: 50, r: 54, t: 22, b: 46 } });

  // axes: time along the bottom, mmol/L on the left, mg/dL on the right
  for (let v = 4; v <= 9; v++) {
    svg.appendChild(s('line.grid-line', { x1: pl.left, x2: pl.right, y1: pl.sy(v), y2: pl.sy(v) }));
    svg.appendChild(s('text.tick-label', { x: pl.left - 8, y: pl.sy(v) + 4, 'text-anchor': 'end' }, String(v)));
    svg.appendChild(s('text.tick-label', { x: pl.right + 8, y: pl.sy(v) + 4, 'text-anchor': 'start' }, String(v * MGDL)));
  }
  for (let t = 0; t <= minutes; t += 30) {
    svg.appendChild(s('line.grid-line', { x1: pl.sx(t), x2: pl.sx(t), y1: pl.top, y2: pl.bottom }));
    svg.appendChild(s('text.tick-label', { x: pl.sx(t), y: pl.bottom + 17, 'text-anchor': 'middle' }, String(t)));
  }
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.right, y1: pl.bottom, y2: pl.bottom }));
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.left, y1: pl.top, y2: pl.bottom }));
  svg.appendChild(s('line.axis-line', { x1: pl.right, x2: pl.right, y1: pl.top, y2: pl.bottom }));
  svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: H - 8, 'text-anchor': 'middle' }, 'minutes after eating'));
  svg.appendChild(s('text.axis-label', { x: pl.left - 36, y: pl.top - 8, 'text-anchor': 'start' }, 'mmol/L'));
  svg.appendChild(s('text.axis-label', { x: pl.right + 40, y: pl.top - 8, 'text-anchor': 'end' }, 'mg/dL'));
  svg.appendChild(s('line', { x1: pl.left, x2: pl.right, y1: pl.sy(START), y2: pl.sy(START), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '3 5' }));
  svg.appendChild(s('text.fig-label-sm', { x: pl.right - 6, y: pl.sy(START) + 16, 'text-anchor': 'end' }, 'level before eating'));
  const gCurves = s('g');
  svg.appendChild(gCurves);

  const chips = {};
  if (!isStatic && foods.length) {
    const box = h('div.gc-foods', { role: 'group', 'aria-label': 'Foods to draw' });
    for (const f of foods) {
      const tag = h('span.gc-tag', { 'aria-hidden': 'true' });
      const b = h('button.gc-food', { type: 'button', 'aria-pressed': 'false' }, tag, h('span', f.name, f.serving ? h('small', `${f.serving}: ${formatNumber(f.carbs, 0)} g carbohydrate`) : null));
      b.addEventListener('click', () => {
        if (readOnly) return;
        if (shown.includes(f.id)) shown = shown.filter((id) => id !== f.id);
        else {
          shown.push(f.id);
          if (shown.length > max) shown.shift();
          if (!seen.includes(f.id)) seen.push(f.id);
        }
        play('select');
        render();
        env.announce(describe());
        env.onChange(getState());
      });
      chips[f.id] = { b, tag };
      box.appendChild(b);
    }
    fr.el.insertBefore(box, fr.canvas);
  }
  const notes = h('div.gc-notes', { 'aria-live': 'polite' });
  const caveat = h('p.w-hint', 'A simplified model of a healthy adult. Real responses differ between people and from day to day.');
  if (!env.compact) fr.el.append(notes, caveat);

  const factsOf = (f) => ({ rise: round1(peakRise(f.gi, f.carbs)), peak: round1(START + peakRise(f.gi, f.carbs)), at: Math.round(peakTime(f.gi)), load: glycaemicLoad(f.gi, f.carbs) });

  function describe() {
    if (!shown.length) return 'No food chosen yet.';
    return shown.map((id) => { const f = byId(id); const k = factsOf(f); return `${f.name}: peak ${k.peak.toFixed(1)} millimoles per litre after ${k.at} minutes`; }).join('. ') + '.';
  }

  function render() {
    while (gCurves.firstChild) gCurves.removeChild(gCurves.firstChild);
    notes.replaceChildren();
    for (const id in chips) { chips[id].b.setAttribute('aria-pressed', 'false'); }
    shown.forEach((id, i) => {
      const f = byId(id);
      const slot = SLOTS[i];
      let d = '';
      for (let t = 0; t <= minutes; t += 2) d += `${t ? 'L' : 'M'}${pl.sx(t).toFixed(1)} ${pl.sy(clamp(START + glucoseRise(f.gi, f.carbs, t), 4, 9)).toFixed(1)}`;
      gCurves.appendChild(s('path', { d, fill: 'none', stroke: hue(slot.color), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': slot.dash }));
    });
    // letters on the peaks, drawn after all the curves so that none is hidden
    shown.forEach((id, i) => {
      const f = byId(id);
      const slot = SLOTS[i];
      const k = factsOf(f);
      const x = pl.sx(Math.min(peakTime(f.gi), minutes));
      const y = pl.sy(clamp(START + peakRise(f.gi, f.carbs), 4, 9));
      gCurves.appendChild(s('circle', { cx: x, cy: y, r: 13, fill: hue(slot.color), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gCurves.appendChild(s('text.gc-letter', { x, y: y + 1, 'text-anchor': 'middle' }, slot.letter));
      if (chips[id]) {
        chips[id].b.setAttribute('aria-pressed', 'true');
        chips[id].tag.textContent = slot.letter;
        chips[id].tag.style.background = hue(slot.color);
      }
      notes.appendChild(h('span', `${slot.letter} · ${f.name}: peak `, h('b', `${k.peak.toFixed(1)} mmol/L`), ` (${Math.round(k.peak * MGDL)} mg/dL) after `, h('b', `${k.at} min`)));
    });
    if (!shown.length && !isStatic) notes.appendChild(h('span', 'Choose a food to draw its curve.'));
    svg.setAttribute('aria-label', `${spec.alt || 'Blood glucose in the two hours after eating'}. ${describe()}`);
  }

  function getState() {
    const peak = {}; const rise = {}; const peakAt = {}; const load = {};
    let highest = null; let lowest = null;
    for (const id of shown) {
      const k = factsOf(byId(id));
      peak[id] = k.peak; rise[id] = k.rise; peakAt[id] = k.at; load[id] = k.load;
      const raw = peakRise(byId(id).gi, byId(id).carbs);
      if (highest == null || raw > peakRise(byId(highest).gi, byId(highest).carbs)) highest = id;
      if (lowest == null || raw < peakRise(byId(lowest).gi, byId(lowest).carbs)) lowest = id;
    }
    return { shown: shown.slice(), seen: seen.slice(), seenCount: seen.length, peak, rise, peakAt, load, highest, lowest };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.seen)) {
        seen = next.seen.filter(byId);
        if (!Array.isArray(next.shown)) shown = seen.slice(-max);
      }
      if (Array.isArray(next.shown)) {
        shown = next.shown.filter(byId).slice(-max);
        for (const id of shown) if (!seen.includes(id)) seen.push(id);
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const id in chips) chips[id].b.disabled = readOnly;
    },
  };
}

const DEMO = [
  { id: 'glucose', name: 'Glucose drink', gi: 100 },
  { id: 'bread', name: 'White bread', gi: 75 },
  { id: 'spaghetti', name: 'Spaghetti', gi: 49 },
  { id: 'lentils', name: 'Lentils', gi: 32 },
];
export const examples = [
  { title: 'glucose-curve — the same carbohydrate from different foods', spec: { type: 'glucose-curve', foods: DEMO, shown: ['glucose'] } },
  { title: 'glucose-curve — everyday servings', spec: { type: 'glucose-curve', max: 3, foods: [{ id: 'melon', name: 'Watermelon', gi: 76, carbs: 11, serving: '1 slice' }, { id: 'rice', name: 'White rice', gi: 73, carbs: 50, serving: '1 bowl' }], shown: ['melon', 'rice'] } },
];
