/**
 * sway-lab — balance as something to experiment with. Seen from above: the
 * feet of a standing person, a dashed ring for how far the body's weight can
 * wander before a foot has to move, and the wandering itself, traced as a
 * line. The learner changes the stance, closes the eyes, swaps the firm floor
 * for a soft cushion and adds weeks of practice, and watches the trace grow
 * or shrink. Under the feet, three lamps show the senses that balance uses.
 *
 * {
 *   type: 'sway-lab',
 *   stance: 'two',            // 'two' feet | 'one' leg
 *   eyes: 'open',             // 'open' | 'closed'
 *   ground: 'firm',           // 'firm' floor | 'soft' cushion
 *   practice: 0,              // weeks of balance practice, 0 to 8
 *   controls: ['stance', 'eyes', 'ground', 'practice'],   // which of them the learner may change
 *   static: false,            // true: a picture without controls
 * }
 *
 * State: { stance, eyes, ground, practice, sway, reach, limit, steady, clear, tried }
 *   sway    — average distance of the body's weight from the centre, in cm (one decimal)
 *   reach   — the furthest it wanders, in cm: 2.2 × sway
 *   limit   — how far it may wander before a foot has to move: 9 cm on two feet, 4 cm on one leg
 *   steady  — reach ≤ limit
 *   clear   — how many of the three senses (eyes, inner ear, feet and joints) are giving clear signals
 *   tried   — the settings looked at so far, each as 'stance/eyes/ground/practice'
 *
 * setState({ stance, eyes, ground, practice, tried }) restores a state.
 *
 * The model (exported as `swayOf`). sway = 0.5 cm × 2.4 on one leg × 2.2 with
 * the eyes closed × 1.4 on a soft surface × (1 − 0.45 × (1 − e^(−weeks/4))).
 * The sizes are illustrative; the directions are what measurements on force
 * plates show: a narrower base, a missing sense or a dulled one mean more
 * sway, and practice means less. The trace is a random wander scaled to the
 * model's numbers, so it looks different each time while the facts stay the
 * same. Real balance also depends on strength, reaction speed, attention,
 * medicines and much else.
 */
import { frame, sliderRow, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 300;
const H = 250;
const PX = 7;            // pixels per centimetre
const CX = 150;          // centre of the standing area
const CY = 128;
const N = 260;           // points in the trace
const REACH = 2.2;

export const LIMIT = { two: 9, one: 4 };

/** Average sway in centimetres for a setting. */
export function swayOf({ stance = 'two', eyes = 'open', ground = 'firm', practice = 0 } = {}) {
  const trained = 1 - 0.45 * (1 - Math.exp(-clamp(practice, 0, 8) / 4));
  return 0.5 * (stance === 'one' ? 2.4 : 1) * (eyes === 'closed' ? 2.2 : 1) * (ground === 'soft' ? 1.4 : 1) * trained;
}
/** The facts of a setting, as the widget reports them. */
export function balanceOf(setting) {
  const sway = swayOf(setting);
  const limit = LIMIT[setting.stance === 'one' ? 'one' : 'two'];
  return {
    sway: tidy(sway, 1), reach: tidy(sway * REACH, 1), limit, steady: sway * REACH <= limit,
    clear: 3 - (setting.eyes === 'closed' ? 1 : 0) - (setting.ground === 'soft' ? 1 : 0),
  };
}

addStyles('sway-lab', `
  .widget-sway-lab .sl-rows { display: grid; gap: 6px; width: 100%; max-width: 520px; justify-self: center; }
  .widget-sway-lab .sl-row { display: grid; grid-template-columns: 4.6em repeat(2, minmax(0, 1fr)); gap: 4px; align-items: center; font-size: var(--fs-sm); font-weight: 700; }
  .widget-sway-lab .sl-opt {
    min-height: 40px; padding: 0.25rem 0.4rem; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.15;
    border: var(--bw) solid var(--edge); border-radius: var(--r-sm); background: var(--surface); color: var(--ink-2); cursor: pointer; user-select: none; -webkit-user-select: none;
  }
  .widget-sway-lab .sl-opt[aria-checked="true"] { background: var(--blue-soft); border-color: var(--blue); color: var(--ink); box-shadow: inset 0 0 0 1px var(--blue); }
  .widget-sway-lab .sl-opt:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-sway-lab.is-readonly .sl-opt { cursor: default; }
  .widget-sway-lab .sl-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 2.5em; text-wrap: balance; }
  .widget-sway-lab .sl-senses { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px var(--s4); min-width: 0; }
  .widget-sway-lab.is-row .sl-senses { flex-direction: column; align-items: flex-start; }
  .widget-sway-lab .sl-sense { display: grid; grid-template-columns: auto auto; column-gap: 8px; align-items: center; font-size: var(--fs-sm); line-height: 1.2; }
  .widget-sway-lab .sl-sense svg { grid-row: span 2; }
  .widget-sway-lab .sl-sense b { font-weight: 800; }
  .widget-sway-lab .sl-sense small { color: var(--ink-2); font-size: var(--fs-xs); font-weight: 600; }
`);

const OPTIONS = {
  stance: { label: 'Stance', values: [['two', 'Two feet'], ['one', 'One leg']] },
  eyes: { label: 'Eyes', values: [['open', 'Open'], ['closed', 'Closed']] },
  ground: { label: 'Ground', values: [['firm', 'Firm floor'], ['soft', 'Soft cushion']] },
};

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const allowed = Array.isArray(spec.controls) ? spec.controls : ['stance', 'eyes', 'ground', 'practice'];
  const set = {
    stance: spec.stance === 'one' ? 'one' : 'two',
    eyes: spec.eyes === 'closed' ? 'closed' : 'open',
    ground: spec.ground === 'soft' ? 'soft' : 'firm',
    practice: clamp(Math.round(spec.practice || 0), 0, 8),
  };
  let readOnly = !!env.readOnly;
  const tried = [];
  const sig = () => `${set.stance}/${set.eyes}/${set.ground}/${set.practice}`;
  const remember = () => { const k = sig(); if (!tried.includes(k)) { tried.push(k); if (tried.length > 60) tried.shift(); } };

  // A wander with average distance 1 from the centre and a furthest point of exactly REACH.
  const unit = (() => {
    const pts = [];
    let x = 0;
    let y = 0;
    const gauss = () => { let t = 0; for (let i = 0; i < 6; i++) t += env.rng.float(-1, 1); return t / Math.sqrt(2); };
    for (let i = 0; i < N; i++) {
      x = 0.93 * x + 0.37 * gauss();
      y = 0.93 * y + 0.37 * gauss();
      pts.push([x, y]);
    }
    const radius = pts.map(([px, py]) => Math.hypot(px, py));
    const mean = radius.reduce((t, v) => t + v, 0) / N || 1;
    const top = Math.max(...radius) / mean;
    return pts.map(([px, py], i) => {
      const r = radius[i] / mean;
      const out = r <= 1 || top <= 1 ? r : 1 + ((r - 1) * (REACH - 1)) / (top - 1);
      const k = radius[i] > 0 ? out / radius[i] : 0;
      return [px * k, py * k];
    });
  })();

  const label = spec.alt || 'The feet of a standing person seen from above, with a line showing how the body sways';
  const fr = frame({ width: W, height: H, compact: env.compact, label, maxWidth: 380 });
  const { svg } = fr;

  /* --------------------------------------------------------------- picture */
  const gFeet = s('g');
  const ring = s('circle', { cx: CX, cy: CY, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 6' });
  const trace = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const dot = s('circle', { r: 6, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const ringLabel = s('text.fig-label-sm', { x: CX, 'text-anchor': 'middle' }, 'limit of balance');
  svg.append(gFeet, ring, ringLabel, trace, dot);

  // the three senses, as ordinary text under the picture so that they stay readable on a phone
  const lamps = {};
  const senses = h('div.sl-senses', { role: 'group', 'aria-label': 'The senses that balance uses' });
  [['eyes', 'Eyes'], ['ear', 'Inner ear'], ['body', 'Feet and joints']].forEach(([key, name]) => {
    const lamp = s('circle', { cx: 13, cy: 13, r: 11, stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const mark = s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'translate(13 13)' });
    const status = h('small');
    senses.appendChild(h('div.sl-sense', s('svg', { viewBox: '0 0 26 26', width: 26, height: 26, 'aria-hidden': 'true' }, lamp, mark), h('b', name), status));
    lamps[key] = { lamp, mark, status };
  });
  if (!env.compact) fr.el.insertBefore(senses, fr.readouts);
  const roSway = readout('average sway', { color: 'blue' });
  if (!env.compact) fr.readouts.appendChild(roSway.el);

  const foot = (cx, side) => {
    // a footprint, 9 cm wide and 25 cm long, toes towards the top of the picture; side: -1 left foot, 1 right foot, 0 a single foot
    const w2 = 4.5 * PX;
    const top = CY - 12.5 * PX + 16;
    const bottom = CY + 12.5 * PX;
    const inner = side === 0 ? -1 : -side;         // the big toe is on the inner side
    const g = s('g');
    g.appendChild(s('path', {
      d: `M${cx - w2} ${top + 26} C${cx - w2} ${top - 4} ${cx + w2} ${top - 4} ${cx + w2} ${top + 26} L${cx + w2 * 0.72} ${bottom - 22} C${cx + w2 * 0.72} ${bottom + 6} ${cx - w2 * 0.72} ${bottom + 6} ${cx - w2 * 0.72} ${bottom - 22} Z`,
      fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round',
    }));
    [[3.3, 7, 2], [1.5, 5.6, -5], [-0.1, 5, -7], [-1.6, 4.6, -5], [-3, 4.2, 1]].forEach(([u, r, dy]) => {
      g.appendChild(s('circle', { cx: cx + inner * u * PX, cy: top - 9 + dy, r, fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2 }));
    });
    return g;
  };

  /* -------------------------------------------------------------- controls */
  const note = h('p.sl-note', { 'aria-live': 'polite' });
  const optEls = {};
  let slider = null;
  const changed = () => { remember(); restart(); render(); env.onChange(getState()); };
  if (!isStatic) {
    const rows = h('div.sl-rows');
    for (const key of ['stance', 'eyes', 'ground']) {
      if (!allowed.includes(key)) continue;
      const def = OPTIONS[key];
      const row = h('div.sl-row', { role: 'radiogroup', 'aria-label': def.label }, h('span', def.label));
      optEls[key] = {};
      for (const [value, text] of def.values) {
        const el = h('div.sl-opt', { role: 'radio', tabindex: '0', 'aria-checked': 'false' }, text);
        el.dataset.keys = 'own';
        const choose = () => { if (readOnly || set[key] === value) return; set[key] = value; play('select'); changed(); };
        el.addEventListener('click', choose);
        el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(); } });
        optEls[key][value] = el;
        row.appendChild(el);
      }
      rows.appendChild(row);
    }
    if (rows.childNodes.length) fr.el.insertBefore(rows, fr.readouts);
    if (allowed.includes('practice')) {
      slider = sliderRow({ label: 'weeks of practice', min: 0, max: 8, step: 1, value: set.practice, color: 'green', onInput: (v) => { if (readOnly) return; set.practice = v; changed(); } });
      fr.controls.appendChild(slider.el);
    }
  }
  if (!env.compact) fr.el.appendChild(note);

  /* ------------------------------------------------------------- animation */
  let shown = N;
  const anim = loop((dt) => {
    shown = Math.min(N, shown + dt * 34);
    drawTrace();
    if (shown >= N) anim.stop();
  });
  function restart() {
    anim.stop();
    if (isStatic || reducedMotion()) { shown = N; return; }
    shown = 1;
    anim.start();
  }

  function drawTrace() {
    const b = balanceOf(set);
    const scale = swayOf(set) * PX;
    const limitPx = b.limit * PX;
    let d = '';
    let last = [CX, CY];
    let out = false;
    const upto = Math.max(1, Math.floor(shown));
    for (let i = 0; i < upto; i++) {
      const x = CX + unit[i][0] * scale;
      const y = CY + unit[i][1] * scale;
      if (!b.steady && Math.hypot(x - CX, y - CY) > limitPx) { out = true; last = [x, y]; d += `L${x.toFixed(1)} ${y.toFixed(1)}`; break; }
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      last = [x, y];
    }
    trace.setAttribute('d', d);
    dot.setAttribute('cx', last[0]);
    dot.setAttribute('cy', last[1]);
    dot.setAttribute('fill', out ? hue('red') : hue('orange'));
    if (out) anim.stop();
  }

  /* ---------------------------------------------------------------- render */
  const tick = 'M-5 0 L-1.5 4 L5 -4';
  const cross = 'M-4 -4 L4 4 M4 -4 L-4 4';
  const wave = 'M-6 0 Q-3 -5 0 0 T6 0';
  function lampSet(key, state, text) {
    const l = lamps[key];
    l.lamp.setAttribute('fill', state === 'on' ? hue('green') : state === 'dull' ? hue('yellow') : 'var(--sunken)');
    l.mark.setAttribute('d', state === 'on' ? tick : state === 'dull' ? wave : cross);
    l.status.textContent = text;
  }

  function render() {
    const b = balanceOf(set);
    while (gFeet.firstChild) gFeet.removeChild(gFeet.firstChild);
    if (set.ground === 'soft') gFeet.appendChild(s('rect', { x: CX - 118, y: CY - 104, width: 236, height: 208, rx: 26, fill: hue('violet', 'soft'), stroke: hue('violet'), 'stroke-width': 2, 'stroke-dasharray': '3 6' }));
    if (set.stance === 'two') { gFeet.appendChild(foot(CX - 8.5 * PX, -1)); gFeet.appendChild(foot(CX + 8.5 * PX, 1)); } else gFeet.appendChild(foot(CX, 0));
    ring.setAttribute('r', b.limit * PX);
    ringLabel.setAttribute('y', CY + 12.5 * PX + 26);
    lampSet('eyes', set.eyes === 'open' ? 'on' : 'off', set.eyes === 'open' ? 'seeing the room' : 'closed: no signal');
    lampSet('ear', 'on', 'sensing tilt and turning');
    lampSet('body', set.ground === 'firm' ? 'on' : 'dull', set.ground === 'firm' ? 'feeling the floor' : 'dulled by the cushion');
    roSway.set(`${formatNumber(b.sway, 1)} cm`);
    for (const key of Object.keys(optEls)) for (const value of Object.keys(optEls[key])) optEls[key][value].setAttribute('aria-checked', String(set[key] === value));
    if (slider) slider.set(set.practice);
    note.textContent = b.steady
      ? `The body's weight wanders up to ${formatNumber(b.reach, 1)} cm from the centre, inside the ${b.limit} cm limit: steady.`
      : `The body's weight wanders up to ${formatNumber(b.reach, 1)} cm, beyond the ${b.limit} cm limit: a foot has to go down.`;
    svg.setAttribute('aria-label', `${label}. ${set.stance === 'two' ? 'Standing on two feet' : 'Standing on one leg'}, eyes ${set.eyes}, on a ${set.ground === 'firm' ? 'firm floor' : 'soft cushion'}, after ${set.practice} weeks of practice. Average sway ${formatNumber(b.sway, 1)} centimetres. ${note.textContent}`);
    drawTrace();
  }

  const getState = () => ({ ...set, ...balanceOf(set), tried: tried.slice() });

  remember();
  shown = N;
  render();
  if (!isStatic && !reducedMotion()) restart();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.tried)) for (const k of next.tried) if (typeof k === 'string' && !tried.includes(k)) tried.push(k);
      if (next.stance === 'one' || next.stance === 'two') set.stance = next.stance;
      if (next.eyes === 'open' || next.eyes === 'closed') set.eyes = next.eyes;
      if (next.ground === 'firm' || next.ground === 'soft') set.ground = next.ground;
      if (typeof next.practice === 'number') set.practice = clamp(Math.round(next.practice), 0, 8);
      remember();
      anim.stop();
      shown = N;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      for (const key of Object.keys(optEls)) for (const value of Object.keys(optEls[key])) optEls[key][value].setAttribute('tabindex', readOnly ? '-1' : '0');
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'sway-lab — standing on two feet', spec: { type: 'sway-lab' } },
  { title: 'sway-lab — one leg, eyes closed', spec: { type: 'sway-lab', stance: 'one', eyes: 'closed' } },
  { title: 'sway-lab — one leg on a cushion, after practice', spec: { type: 'sway-lab', stance: 'one', ground: 'soft', practice: 6 } },
];
