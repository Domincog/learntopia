/**
 * air-sac — gas exchange at one air sac (alveolus) of the lung. Blood flows along a capillary under the
 * thin wall of the sac and loads oxygen on the way. The learner changes what the speed of loading depends
 * on (the oxygen in the sac, the thickness of the wall, how much of the surface still works, and how fast
 * the blood passes) and sees how full the blood is when it leaves.
 *
 * {
 *   type: 'air-sac',
 *   oxygen: 100,        // oxygen pressure in the air sac in mmHg: 50 to 100 in steps of 10 (100 = healthy lungs at sea level)
 *   thickness: 1,       // wall thickness as a multiple of normal: 1, 2, 4 or 8
 *   area: 100,          // per cent of the exchange surface still working: 25, 50, 75 or 100
 *   exercise: false,    // true: hard exercise, the blood passes three times as fast
 *   controls: ['oxygen', 'thickness', 'area', 'exercise'],   // which controls to show (default: all)
 *   static: false,
 * }
 *
 * State: { oxygen, thickness, area, exercise, arriving, leaving, saturation, fullAt, full, changed }
 *   arriving    oxygen pressure of the blood as it arrives (40 mmHg: about 75% loaded)
 *   leaving     oxygen pressure of the blood as it leaves, in mmHg (one decimal)
 *   saturation  how loaded the haemoglobin is when the blood leaves, as a whole per cent
 *   fullAt      how far along the capillary (0 to 1) the blood comes within 2 mmHg of the air; null if it never does
 *   full        fullAt !== null
 *   changed     names of the controls the learner has moved
 *
 * setState accepts { oxygen, thickness, area, exercise }.
 *
 * The model. Diffusion across the wall obeys Fick's law: the rate is proportional to the surface area and
 * to the difference in oxygen pressure between air and blood, and inversely proportional to the thickness of
 * the wall. Along the capillary the blood's oxygen pressure P therefore closes in on the air's:
 *     P(u) = Pair − (Pair − 40) · exp(−K · u),   K = 9 / (thickness × speed),   u from 0 to `area`
 * (K = 9 puts healthy resting blood within 2 mmHg of the air about a third of the way along, as measured).
 * Lost surface is drawn as a stretch of wall that no longer exchanges. The load on the haemoglobin follows the
 * S-shaped binding curve (Hill equation, half-loaded at 26.6 mmHg, exponent 2.7). Left out: the arriving
 * blood is kept at 40 mmHg whatever the settings (in thin air it would be lower); carbon dioxide, which
 * crosses about twenty times more easily, is only indicated; and real lungs match air flow to blood flow
 * sac by sac, which this single sac cannot show.
 */
import { frame, sliderRow, hue, s, h, clamp, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

export const ARRIVING = 40;
export const THICKNESSES = [1, 2, 4, 8];
export const AREAS = [25, 50, 75, 100];

/** Haemoglobin loading (0 to 1) at an oxygen pressure of p mmHg. */
export const saturation = (p) => { const r = Math.pow(Math.max(p, 0) / 26.6, 2.7); return r / (1 + r); };

/** Oxygen pressure of the blood a fraction u (0 to 1) of the way along the capillary. */
export function pressureAlong(u, { oxygen = 100, thickness = 1, area = 100, exercise = false } = {}) {
  const K = 9 / (thickness * (exercise ? 3 : 1));
  const reach = Math.min(clamp(u, 0, 1), area / 100);
  return oxygen - (oxygen - ARRIVING) * Math.exp(-K * reach);
}

/** What the blood is like when it leaves. */
export function leavingBlood(set) {
  const p = pressureAlong(1, set);
  const { oxygen = 100, thickness = 1, area = 100, exercise = false } = set;
  const K = 9 / (thickness * (exercise ? 3 : 1));
  const need = oxygen - ARRIVING > 2 ? Math.log((oxygen - ARRIVING) / 2) / K : 0;
  const fullAt = need <= area / 100 + 1e-9 ? tidy(need, 2) : null;
  return { leaving: tidy(p, 1), saturation: Math.round(saturation(p) * 100), fullAt, full: fullAt !== null };
}

const W = 560;
const H = 300;
const X0 = 40;
const X1 = 520;
const WALL_Y = 150;
const DARK = '#1D1B26';

addStyles('air-sac', `
  .widget-air-sac .as-toggle { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-air-sac .as-big { font-size: 15px; }
  .widget-air-sac .as-o2 { font-family: var(--font-body); font-size: 9px; font-weight: 800; fill: ${DARK}; }
  @container wcanvas (max-width: 470px) {
    .widget-air-sac .as-big { font-size: 18px; }
  }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const show = new Set(Array.isArray(spec.controls) ? spec.controls : ['oxygen', 'thickness', 'area', 'exercise']);
  const set = {
    oxygen: clamp(Math.round((spec.oxygen != null ? spec.oxygen : 100) / 10) * 10, 50, 100),
    thickness: THICKNESSES.includes(spec.thickness) ? spec.thickness : 1,
    area: AREAS.includes(spec.area) ? spec.area : 100,
    exercise: !!spec.exercise,
  };
  let readOnly = !!env.readOnly;
  const changed = new Set();

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'An air sac of the lung with a blood capillary running under its thin wall' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const note = h('p.w-hint', { 'aria-live': 'polite' });

  const getState = () => ({ ...set, arriving: ARRIVING, ...leavingBlood(set), changed: [...changed] });

  // fixed scatter for the oxygen molecules in the air (no randomness: the same picture every time)
  const spots = [];
  const halton = (i, base) => { let f = 1; let r = 0; while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); } return r; };
  for (let i = 1; i <= 24; i++) spots.push([X0 + 26 + halton(i, 2) * (X1 - X0 - 52), 52 + halton(i, 3) * 66]);

  function describe() {
    const out = leavingBlood(set);
    if (!out.full) return `The blood leaves ${out.saturation}% loaded. It left before it had caught up with the air: ${Math.round(out.leaving)} against ${set.oxygen} mmHg.`;
    const where = out.fullAt <= 0.25 ? 'within the first quarter of the way' : out.fullAt <= 0.45 ? 'about a third of the way along' : out.fullAt <= 0.75 ? 'about two thirds of the way along' : 'only just before the end';
    if (set.oxygen >= 90) return `The blood leaves ${out.saturation}% loaded. It caught up with the air ${where}${out.fullAt <= 0.75 ? ': there is time to spare' : ''}.`;
    return `The blood catches up with the air ${where}, but this air holds less oxygen: the blood leaves only ${out.saturation}% loaded.`;
  }

  function render() {
    const out = leavingBlood(set);
    const th = 6 + 6 * set.thickness;                 // drawn thickness of the wall
    const capY = WALL_Y + th;
    const capH = 46;
    const xEnd = X0 + ((X1 - X0) * set.area) / 100;   // where the working surface ends
    g.replaceChildren();

    // the air sac
    g.appendChild(s('path', { d: `M${X0} ${WALL_Y} V60 Q${X0} 14 ${X0 + 60} 14 H${X1 - 60} Q${X1} 14 ${X1} 60 V${WALL_Y} Z`, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    const n = Math.round((set.oxygen / 100) * spots.length);
    for (let i = 0; i < n; i++) {
      g.appendChild(s('circle', { cx: spots[i][0], cy: spots[i][1], r: 7, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      g.appendChild(s('text.as-o2', { x: spots[i][0], y: spots[i][1] + 3, 'text-anchor': 'middle' }, 'O₂'));
    }
    g.appendChild(s('text.fig-label.as-big', { x: W / 2, y: 36, 'text-anchor': 'middle' }, `air sac: oxygen ${set.oxygen} mmHg`));

    // the wall, with the part that no longer works
    g.appendChild(s('rect', { x: X0, y: WALL_Y, width: X1 - X0, height: th, fill: hue('pink', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    if (set.area < 100) {
      g.appendChild(s('rect', { x: xEnd, y: WALL_Y - 26, width: X1 - xEnd, height: th + 26, fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      let d = '';
      for (let x = xEnd + 10; x < X1 - 2; x += 14) d += `M${x} ${WALL_Y + th - 3}L${Math.min(x + th + 20, X1 - 2)} ${WALL_Y + th - 3 - Math.min(th + 20, X1 - 2 - x)}`;
      g.appendChild(s('path', { d, stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.35, fill: 'none' }));
      g.appendChild(s('text.fig-label-sm', { x: (xEnd + X1) / 2, y: WALL_Y - 32, 'text-anchor': 'middle' }, 'surface lost'));
    }
    g.appendChild(s('text.fig-label-sm', { x: X0 - 4, y: WALL_Y + th / 2 + 4, 'text-anchor': 'end' }, 'wall'));

    // the capillary and its red cells
    g.appendChild(s('rect', { x: 6, y: capY, width: W - 12, height: capH, fill: hue('red', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    const cells = 11;
    for (let i = 0; i < cells; i++) {
      const cx = 30 + (i * (W - 60)) / (cells - 1);
      const u = clamp((cx - X0) / (X1 - X0), 0, 1);
      const p = cx < X0 ? ARRIVING : pressureAlong(u, set);
      const load = clamp((saturation(p) - saturation(ARRIVING)) / (saturation(100) - saturation(ARRIVING)), 0, 1);
      g.appendChild(s('ellipse', { cx, cy: capY + capH / 2, rx: 17, ry: 11, fill: hue('blue') }));
      g.appendChild(s('ellipse', { cx, cy: capY + capH / 2, rx: 17, ry: 11, fill: hue('red'), opacity: load.toFixed(3) }));
      g.appendChild(s('ellipse', { cx, cy: capY + capH / 2, rx: 17, ry: 11, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }));
    }
    // oxygen crossing: arrows fade as the blood fills up
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6;
      const x = X0 + u * (X1 - X0);
      if (u > set.area / 100) continue;
      const gap = (set.oxygen - pressureAlong(u, set)) / 60;
      if (gap < 0.03) continue;
      const len = 8 + 16 * clamp(gap, 0, 1);
      g.appendChild(s('path', { d: `M${x} ${WALL_Y - 6} V${WALL_Y + th + len - 6}M${x - 6} ${WALL_Y + th + len - 13}L${x} ${WALL_Y + th + len - 6}L${x + 6} ${WALL_Y + th + len - 13}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    // labels under the capillary
    const by = capY + capH + 20;
    g.appendChild(s('path', { d: `M${W / 2 - 60} ${by - 5} H${W / 2 + 52}M${W / 2 + 44} ${by - 11}L${W / 2 + 54} ${by - 5}L${W / 2 + 44} ${by + 1}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    g.appendChild(s('text.fig-label-sm', { x: W / 2, y: by + 16, 'text-anchor': 'middle' }, set.exercise ? 'blood passes in about ¼ second' : 'blood passes in about ¾ second'));
    g.appendChild(s('text.fig-label-sm', { x: 8, y: by, 'text-anchor': 'start' }, 'arrives'));
    g.appendChild(s('text.fig-label.as-big', { x: 8, y: by + 18, 'text-anchor': 'start' }, '75% loaded'));
    g.appendChild(s('text.fig-label-sm', { x: W - 8, y: by, 'text-anchor': 'end' }, 'leaves'));
    g.appendChild(s(`text.fig-label.as-big.${out.saturation >= 95 ? 'text-green' : out.saturation >= 90 ? 'text-orange' : 'text-red'}`, { x: W - 8, y: by + 18, 'text-anchor': 'end' }, `${out.saturation}% loaded`));
    g.appendChild(s('text.fig-label-sm.text-muted', { x: W / 2, y: H - 8, 'text-anchor': 'middle' }, 'carbon dioxide crosses the other way, from blood to air'));

    note.textContent = describe();
    svg.setAttribute('aria-label', `${spec.alt || 'An air sac of the lung and the capillary under it'}. Oxygen in the air sac ${set.oxygen} mmHg, wall ${set.thickness === 1 ? 'of normal thickness' : `${set.thickness} times normal thickness`}, ${set.area}% of the surface working, ${set.exercise ? 'hard exercise' : 'at rest'}. ${describe()}`);
    if (exBtn) { exBtn.setAttribute('aria-pressed', String(set.exercise)); exBtn.textContent = set.exercise ? 'Blood flow: hard exercise' : 'Blood flow: at rest'; }
  }

  const rows = {};
  let exBtn = null;
  const touch = (name) => { changed.add(name); play('tick'); render(); env.onChange(getState()); };
  if (!isStatic) {
    if (show.has('oxygen')) {
      rows.oxygen = sliderRow({ label: 'oxygen in the air sac', min: 50, max: 100, step: 10, value: set.oxygen, color: 'red', unit: 'mmHg', onInput: (v) => { if (readOnly) return; set.oxygen = v; touch('oxygen'); } });
      fr.controls.appendChild(rows.oxygen.el);
    }
    if (show.has('thickness')) {
      rows.thickness = sliderRow({ label: 'wall thickness', min: 0, max: THICKNESSES.length - 1, step: 1, value: THICKNESSES.indexOf(set.thickness), color: 'pink', format: (v) => (THICKNESSES[v] === 1 ? 'normal' : `× ${THICKNESSES[v]}`), onInput: (v) => { if (readOnly) return; set.thickness = THICKNESSES[v]; touch('thickness'); } });
      fr.controls.appendChild(rows.thickness.el);
    }
    if (show.has('area')) {
      rows.area = sliderRow({ label: 'working surface', min: 0, max: AREAS.length - 1, step: 1, value: AREAS.indexOf(set.area), color: 'teal', format: (v) => `${AREAS[v]}%`, onInput: (v) => { if (readOnly) return; set.area = AREAS[v]; touch('area'); } });
      fr.controls.appendChild(rows.area.el);
    }
    if (show.has('exercise')) {
      exBtn = h('button.btn.btn-sm', { type: 'button', 'aria-pressed': 'false' }, '');
      exBtn.addEventListener('click', (ev) => { ev.preventDefault(); if (readOnly) return; set.exercise = !set.exercise; touch('exercise'); });
      fr.buttons.appendChild(exBtn);
    }
  }
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.oxygen === 'number') { set.oxygen = clamp(Math.round(next.oxygen / 10) * 10, 50, 100); if (rows.oxygen) rows.oxygen.set(set.oxygen); changed.add('oxygen'); }
      if (THICKNESSES.includes(next.thickness)) { set.thickness = next.thickness; if (rows.thickness) rows.thickness.set(THICKNESSES.indexOf(set.thickness)); changed.add('thickness'); }
      if (AREAS.includes(next.area)) { set.area = next.area; if (rows.area) rows.area.set(AREAS.indexOf(set.area)); changed.add('area'); }
      if (typeof next.exercise === 'boolean') { set.exercise = next.exercise; changed.add('exercise'); }
      if (Array.isArray(next.changed)) for (const c of next.changed) changed.add(c);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const k of Object.keys(rows)) rows[k].setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'air-sac — what sets the speed of gas exchange?', spec: { type: 'air-sac' } },
  { title: 'air-sac — thick walls, hard exercise', spec: { type: 'air-sac', thickness: 4, exercise: true, static: true } },
];
