/**
 * rescue-clock — why minutes matter in a cardiac arrest. A rule-of-thumb model
 * of how the chance of survival drains away between the collapse and the first
 * shock from a defibrillator, and how chest compressions slow the drain.
 *
 * {
 *   type: 'rescue-clock',
 *   cprOn: false,          // is anyone giving chest compressions before the shock?
 *   cpr: 1,                // minute at which compressions start (0 to maxCpr)
 *   shock: 8,              // minute of the first shock (1 to max)
 *   ems: 8,                // optional: a dashed marker for "the ambulance arrives", in minutes (an example, not a fact)
 *   lossNoCpr: 10,         // points lost per minute with no CPR        (AHA: 7 to 10% a minute)
 *   lossWithCpr: 3.5,      // points lost per minute while CPR is given (AHA: 3 to 4% a minute)
 *   max: 12,               // length of the time axis in minutes
 *   fixed: [],             // controls to leave out: any of 'cprOn', 'cpr', 'shock'
 *   static: false,         // true: a picture without controls
 * }
 *
 * State: { cprOn, cpr, shock, chance, noCprChance, gain }
 *   chance       what is left of the starting chance at the moment of the shock, 0 to 100 (rounded to a whole number)
 *   noCprChance  the same if nobody had given compressions
 *   gain         chance − noCprChance: what the compressions bought
 * setState accepts { cprOn, cpr, shock }.
 *
 * The model. The chance starts at 100 (the best it could be: a shock at once),
 * falls by `lossNoCpr` points for every minute without compressions and by
 * `lossWithCpr` for every minute with them, until the shock. It describes a
 * collapse that someone saw, with a heart rhythm a shock can correct. It leaves
 * out a great deal: not every arrest has such a rhythm, real chances are lower
 * and vary widely, and the straight lines are a simplification. In particular the
 * lines reach zero at a fixed minute and real chances do not: so a modelled zero is
 * shown as "close to 0", and the axis says that this is a rule of thumb. Nothing here
 * may suggest that compressions are pointless after some minute.
 */
import { frame, plane, drawAxes, sliderRow, readout, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 312;

addStyles('rescue-clock', `
  .widget-rescue-clock .rc-switch { display: flex; align-items: center; justify-content: center; gap: var(--s3); font-weight: 700; font-size: var(--fs-sm); }
  .widget-rescue-clock .rc-toggle {
    min-height: 42px; padding: 0.4rem 0.9rem; border: var(--bw) solid var(--edge-strong); border-radius: 999px; background: var(--surface); color: var(--ink);
    cursor: pointer; user-select: none; -webkit-user-select: none; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800;
  }
  .widget-rescue-clock .rc-toggle i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink); background: var(--surface); }
  .widget-rescue-clock .rc-toggle[aria-checked="true"] { background: var(--green-soft); border-color: var(--green); }
  .widget-rescue-clock .rc-toggle[aria-checked="true"] i { background: var(--green); }
  .widget-rescue-clock .rc-toggle:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-rescue-clock.is-readonly .rc-toggle { cursor: default; opacity: 0.7; }
`);

/** What is left of the starting chance at the moment of the first shock. Exported for the course tests. */
export function chanceAtShock({ cprOn = false, cpr = 0, shock = 8, lossNoCpr = 10, lossWithCpr = 3.5 } = {}) {
  const start = cprOn ? Math.min(cpr, shock) : shock;          // minutes with no compressions
  return Math.max(0, 100 - lossNoCpr * start - lossWithCpr * (shock - start));
}

export default function create(spec, env) {
  const max = clamp(Math.round(spec.max || 12), 6, 20);
  const lossNoCpr = spec.lossNoCpr > 0 ? spec.lossNoCpr : 10;
  const lossWithCpr = spec.lossWithCpr > 0 ? spec.lossWithCpr : 3.5;
  const fixed = new Set(Array.isArray(spec.fixed) ? spec.fixed : []);
  const isStatic = !!spec.static || env.compact;
  const maxCpr = Math.min(10, max - 1);
  let cprOn = !!spec.cprOn;
  let cpr = clamp(Number(spec.cpr != null ? spec.cpr : 1), 0, maxCpr);
  let shock = clamp(Number(spec.shock != null ? spec.shock : 8), 1, max);
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, label: spec.alt || 'A model of the chance of survival against minutes since a collapse' });
  const pl = plane({ x: [0, max], y: [0, 100], width: W, height: H, pad: { l: 46, r: 18, t: 40, b: 46 } });
  fr.svg.appendChild(drawAxes(pl, { xStep: 2, yStep: 20 }));
  fr.svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: H - 6, 'text-anchor': 'middle' }, 'minutes since the collapse'));
  fr.svg.appendChild(s('text.axis-label', { x: 8, y: 16 }, 'chance left, % (a rule of thumb)'));
  const layer = s('g');
  fr.svg.appendChild(layer);

  const model = (o = {}) => chanceAtShock({ cprOn, cpr, shock, lossNoCpr, lossWithCpr, ...o });
  const getState = () => {
    const chance = Math.round(model());
    const noCprChance = Math.round(model({ cprOn: false }));
    return { cprOn, cpr, shock, chance, noCprChance, gain: chance - noCprChance };
  };

  const swatch = (css) => h('i', { style: css });
  const legend = h('div.w-legend',
    h('span.w-legend-item', swatch('background: var(--red)'), 'no compressions yet'),
    h('span.w-legend-item', swatch('background: var(--green)'), 'with compressions'),
    h('span.w-legend-item', swatch('background: repeating-linear-gradient(90deg, var(--ink-3) 0 4px, transparent 4px 7px); border-color: var(--ink-3)'), 'no help at all'));
  fr.el.insertBefore(legend, fr.readouts);

  const roChance = readout('Chance left at the first shock', { digits: 0 });
  const roNone = readout('With no compressions', { digits: 0 });
  fr.readouts.appendChild(roChance.el);
  fr.readouts.appendChild(roNone.el);

  const changed = () => { render(); env.onChange(getState()); };
  let toggle = null;
  let cprRow = null;
  let shockRow = null;
  if (!isStatic) {
    if (!fixed.has('cprOn')) {
      toggle = h('div.rc-toggle', { role: 'switch', tabindex: '0', 'aria-checked': String(cprOn), 'aria-label': 'A bystander gives chest compressions' }, h('i'), h('span'));
      toggle.dataset.keys = 'own';
      const flip = () => { if (readOnly) return; cprOn = !cprOn; play('select'); changed(); };
      toggle.addEventListener('click', flip);
      toggle.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); } });
      fr.el.insertBefore(h('div.rc-switch', toggle), fr.controls);
    }
    if (!fixed.has('cpr')) {
      cprRow = sliderRow({ label: 'Compressions start at', min: 0, max: maxCpr, step: 1, value: cpr, color: 'green', unit: 'min', onInput: (v) => { if (readOnly) return; cpr = v; changed(); } });
      fr.controls.appendChild(cprRow.el);
    }
    if (!fixed.has('shock')) {
      shockRow = sliderRow({ label: 'First shock at', min: 1, max, step: 1, value: shock, color: 'orange', unit: 'min', onInput: (v) => { if (readOnly) return; shock = v; changed(); } });
      fr.controls.appendChild(shockRow.el);
    }
  }

  function render() {
    layer.replaceChildren();
    const P = (t, v) => `${pl.sx(t).toFixed(1)} ${pl.sy(v).toFixed(1)}`;
    // what happens with no help at all: the dashed line
    const zeroAt = Math.min(max, 100 / lossNoCpr);
    layer.appendChild(s('path', { d: `M${P(0, 100)} L${P(zeroAt, Math.max(0, 100 - lossNoCpr * zeroAt))}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 6', 'stroke-linecap': 'round' }));
    if (spec.ems > 0 && spec.ems <= max) {
      layer.appendChild(s('line', { x1: pl.sx(spec.ems), x2: pl.sx(spec.ems), y1: pl.top, y2: pl.bottom, stroke: hue('violet'), 'stroke-width': 2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }));
      layer.appendChild(s('text.fig-label-sm', { x: Math.min(pl.right - 70, pl.sx(spec.ems)), y: pl.top - 9, 'text-anchor': 'middle', fill: hue('violet', 'text') }, 'ambulance (example)'));
    }
    const start = cprOn ? Math.min(cpr, shock) : shock;
    const vStart = Math.max(0, 100 - lossNoCpr * start);
    const vShock = model();
    const flat = (t) => Math.max(0, 100 - lossNoCpr * t);
    // before compressions: a red line (clipped at zero)
    const hitZero = 100 / lossNoCpr;
    let d = `M${P(0, 100)}`;
    if (start > hitZero) d += ` L${P(hitZero, 0)} L${P(start, 0)}`; else d += ` L${P(start, flat(start))}`;
    layer.appendChild(s('path', { d, fill: 'none', stroke: hue('red'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    if (cprOn && cpr < shock) {
      const zeroCpr = vStart / lossWithCpr + start;
      let d2 = `M${P(start, vStart)}`;
      if (zeroCpr < shock) d2 += ` L${P(zeroCpr, 0)} L${P(shock, 0)}`; else d2 += ` L${P(shock, vShock)}`;
      layer.appendChild(s('path', { d: d2, fill: 'none', stroke: hue('green'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      layer.appendChild(s('circle', { cx: pl.sx(start), cy: pl.sy(vStart), r: 6, fill: hue('green'), stroke: 'var(--ink)', 'stroke-width': 2 }));
      layer.appendChild(s('text.fig-label-sm', { x: pl.sx(start) + 9, y: pl.sy(vStart) - 9, fill: hue('green', 'text') }, 'compressions'));
    }
    // the shock
    layer.appendChild(s('line', { x1: pl.sx(shock), x2: pl.sx(shock), y1: pl.sy(vShock), y2: pl.bottom, stroke: hue('orange'), 'stroke-width': 2, 'stroke-linecap': 'round' }));
    layer.appendChild(s('circle', { cx: pl.sx(shock), cy: pl.sy(vShock), r: 8, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    const right = shock > max - 2.5;
    layer.appendChild(s('text.fig-label', { x: pl.sx(shock) + (right ? -12 : 12), y: Math.max(pl.top + 14, pl.sy(vShock) - 10), 'text-anchor': right ? 'end' : 'start' }, `shock: ${Math.round(vShock) > 0 ? Math.round(vShock) : 'close to 0'}`));

    const st = getState();
    const inHundred = (v) => (v > 0 ? `${v} in 100` : 'close to 0');      // the model's zero is not a real zero
    roChance.set(inHundred(st.chance));
    roNone.set(inHundred(st.noCprChance));
    if (toggle) {
      toggle.setAttribute('aria-checked', String(cprOn));
      toggle.lastChild.textContent = cprOn ? 'Chest compressions: yes' : 'Chest compressions: no';
    }
    if (cprRow) { cprRow.set(cpr); cprRow.setDisabled(readOnly || !cprOn); cprRow.el.style.opacity = cprOn ? '' : '0.5'; }
    if (shockRow) { shockRow.set(shock); shockRow.setDisabled(readOnly); }
    fr.svg.setAttribute('aria-label', `${spec.alt || 'Model of a cardiac arrest.'} First shock at minute ${shock}; ${cprOn && cpr < shock ? `chest compressions from minute ${cpr}` : 'no chest compressions'}. Chance left at the shock, as a rule of thumb: ${inHundred(st.chance)}.`);
  }

  render();
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.cprOn != null) cprOn = !!next.cprOn;
      if (next.cpr != null) cpr = clamp(Number(next.cpr), 0, maxCpr);
      if (next.shock != null) shock = clamp(Number(next.shock), 1, max);
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'rescue-clock — nobody helps until the ambulance', spec: { type: 'rescue-clock', cprOn: false, shock: 8, ems: 8 } },
  { title: 'rescue-clock — compressions at 1 minute, shock at 4', spec: { type: 'rescue-clock', cprOn: true, cpr: 1, shock: 4, ems: 8 } },
];
