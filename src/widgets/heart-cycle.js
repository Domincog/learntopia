/**
 * heart-cycle — a schematic heart that the learner operates: four chambers, four valves, two
 * circuits. Three modes:
 *
 *   'cycle'   step (or play, in slow motion) through one heartbeat and watch which valves are open,
 *             where the blood moves and when the two heart sounds are made;
 *   'valves'  the heart is frozen at one moment of the beat and the learner sets the four valves by
 *             hand; the drawing shows at once where blood would run backwards or be held up;
 *   'output'  two sliders, heart rate and stroke volume, and the litres pumped each minute.
 *
 * {
 *   type: 'heart-cycle',
 *   mode: 'cycle',                 // 'cycle' | 'valves' | 'output'
 *   phase: 'fill',                 // cycle: where it starts; valves: the frozen moment (see PHASES)
 *   pressures: true,               // write typical pressures (mmHg) into the ventricles and beside the arteries
 *   valveNames: false,             // label the valves with their names (tricuspid, pulmonary, mitral, aortic)
 *   open: ['tricuspid', 'mitral'], // valves mode: which valves start open (default: none)
 *   rate: 70, stroke: 70,          // output mode: beats per minute and millilitres per beat
 *   rateRange: [40, 190, 5], strokeRange: [40, 140, 5],
 *   static: false,                 // true: a picture without controls
 * }
 *
 * The picture is drawn as if you were facing the person: THEIR right side is on the left of the
 * picture. Oxygen-poor blood is drawn blue and oxygen-rich blood red. That is a drawing convention
 * only (real blood is always red, darker when it carries less oxygen), and the legend says so.
 *
 * State
 *   cycle:  { mode, phase, index, beats, seen, open, sound, pressure }
 *             phase  — id of the current phase;  index — its number, 0 to 4
 *             beats  — whole heartbeats completed;  seen — ids of the phases the learner has looked at
 *             open   — names of the valves that are open now, in alphabetical order
 *             sound  — 'lub' or 'dub' when this phase makes a heart sound, else null
 *             pressure — { ra, rv, pulmonary, la, lv, aorta } typical pressures in mmHg at this moment
 *   valves: { mode, phase, open, backflow, blocked, oneWay, pressure }
 *             backflow — valves that are open although the pressure beyond them is higher: blood runs backwards
 *             blocked  — valves that are shut although the pressure behind them is higher: blood is held up
 *             oneWay   — true when both lists are empty
 *   output: { mode, rate, stroke, output }     output in litres per minute (rate × stroke ÷ 1000)
 *
 * setState: cycle { phase | index, beats, seen };  valves { open: [names] };  output { rate, stroke }.
 *
 * The model. A valve is a passive flap: it is pushed open when the pressure behind it is higher than the
 * pressure beyond it, and pushed shut when it is lower. The five phases and their pressures are typical
 * resting adult values (ventricles: left about 120 mmHg at the peak, right about 25; aorta about 120/80,
 * pulmonary artery about 25/10; atria a few mmHg). Left out: the electrical signal that starts each beat,
 * the coronary arteries, the exact shape of the heart, and the fact that the two sides are never perfectly
 * in step.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, addStyles, tidy } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

export const VALVES = {
  tricuspid: { name: 'tricuspid valve', from: 'ra', to: 'rv', kind: 'inlet', side: 'right' },
  pulmonary: { name: 'pulmonary valve', from: 'rv', to: 'pulmonary', kind: 'outlet', side: 'right' },
  mitral: { name: 'mitral valve', from: 'la', to: 'lv', kind: 'inlet', side: 'left' },
  aortic: { name: 'aortic valve', from: 'lv', to: 'aorta', kind: 'outlet', side: 'left' },
};
const VALVE_IDS = Object.keys(VALVES);

// Typical pressures in mmHg at one representative instant of each phase (resting adult).
export const PHASES = [
  { id: 'fill', name: 'Filling', sound: null, squeeze: { atria: 0, ventricles: 0 },
    pressure: { ra: 4, rv: 2, pulmonary: 12, la: 8, lv: 5, aorta: 85 },
    note: 'Filling. The whole heart is relaxed. Blood flows in from the veins and through the open inlet valves into the ventricles.' },
  { id: 'atria', name: 'Atria squeeze', sound: null, squeeze: { atria: 1, ventricles: 0 },
    pressure: { ra: 6, rv: 4, pulmonary: 10, la: 12, lv: 9, aorta: 80 },
    note: 'The two atria squeeze and top the ventricles up.' },
  { id: 'tighten', name: 'Ventricles tighten', sound: 'lub', squeeze: { atria: 0, ventricles: 0.25 },
    pressure: { ra: 4, rv: 8, pulmonary: 10, la: 8, lv: 50, aorta: 80 },
    note: 'The ventricles begin to squeeze. Their pressure jumps above that of the atria, and the inlet valves are pushed shut: "lub".' },
  { id: 'eject', name: 'Ejection', sound: null, squeeze: { atria: 0, ventricles: 1 },
    pressure: { ra: 4, rv: 25, pulmonary: 24, la: 9, lv: 120, aorta: 118 },
    note: 'Ejection. Pressure in the ventricles now beats the pressure in the arteries: the outlet valves are pushed open and blood is driven out to the lungs and to the body.' },
  { id: 'relax', name: 'Ventricles relax', sound: 'dub', squeeze: { atria: 0, ventricles: 0.75 },
    pressure: { ra: 5, rv: 6, pulmonary: 15, la: 10, lv: 40, aorta: 100 },
    note: 'The ventricles relax. Their pressure drops below that of the arteries, and the outlet valves are pushed shut: "dub".' },
];
const PHASE_IDS = PHASES.map((p) => p.id);
export const phaseById = (id) => PHASES.find((p) => p.id === id) || PHASES[0];

/** Which valves the pressures of a phase push open: those with more pressure behind than beyond. */
export function openValves(phaseId) {
  const p = phaseById(phaseId).pressure;
  return VALVE_IDS.filter((v) => p[VALVES[v].from] > p[VALVES[v].to]).sort();
}

/** What a hand-set valve arrangement does at a given moment. */
export function valveFaults(phaseId, open) {
  const p = phaseById(phaseId).pressure;
  const isOpen = new Set(open);
  const backflow = [];
  const blocked = [];
  for (const v of VALVE_IDS) {
    const forward = p[VALVES[v].from] > p[VALVES[v].to];
    if (isOpen.has(v) && !forward) backflow.push(v);
    if (!isOpen.has(v) && forward) blocked.push(v);
  }
  return { backflow, blocked };
}

/** Litres pumped per minute. */
export const cardiacOutput = (rate, stroke) => tidy((rate * stroke) / 1000, 3);

const W = 560;
const H = 392;
const DARK = '#1D1B26';
// seconds each phase lasts in slow motion (a real beat at rest takes under a second)
const SLOW = [1.5, 0.8, 0.7, 1.3, 0.7];

addStyles('heart-cycle', `
  .widget-heart-cycle .hc-valve { cursor: pointer; outline: none; }
  .widget-heart-cycle .hc-valve:focus-visible .hc-ring { stroke: var(--focus); stroke-width: 4; }
  .widget-heart-cycle .hc-valve .hc-ring { fill: transparent; stroke: var(--ink); stroke-width: 2; stroke-dasharray: 4 5; }
  .widget-heart-cycle.is-readonly .hc-valve { cursor: default; }
  .widget-heart-cycle .hc-flag { font-size: 12.5px; font-weight: 800; }
  .widget-heart-cycle .hc-sound { font-family: var(--font-display); font-size: 26px; font-weight: 800; fill: var(--ink); paint-order: stroke; stroke: var(--yellow); stroke-width: 9px; stroke-linejoin: round; }
  .widget-heart-cycle .hc-side { font-size: 11.5px; font-weight: 700; fill: var(--ink-3); letter-spacing: 0.04em; }
  .widget-heart-cycle .hc-steps { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-heart-cycle .hc-step { padding: 2px 10px; border: var(--bw) solid var(--hair); border-radius: 999px; background: var(--surface); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-heart-cycle .hc-step.is-seen { border-color: var(--edge); color: var(--ink); }
  .widget-heart-cycle .hc-step.is-now { border-color: var(--edge-strong); background: var(--yellow-soft); color: var(--ink); }
  .widget-heart-cycle .hc-eq { display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 6px 10px; font-size: var(--fs-lg); font-weight: 700; }
  .widget-heart-cycle .hc-eq b { font-family: var(--font-mono); font-size: 1.25em; }
  .widget-heart-cycle .hc-eq .hc-out b { color: var(--red-text); }
  .widget-heart-cycle .hc-eq small { font-size: var(--fs-sm); font-weight: 600; color: var(--ink-2); }
  @container wcanvas (max-width: 470px) {
    .widget-heart-cycle .hc-flag { font-size: 16px; }
    .widget-heart-cycle .hc-side { font-size: 14px; }
  }
`);

export default function create(spec, env) {
  const mode = ['valves', 'output'].includes(spec.mode) ? spec.mode : 'cycle';
  return mode === 'output' ? createOutput(spec, env) : createHeart(spec, env, mode);
}

/* ------------------------------------------------------------------ the heart */

function createHeart(spec, env, mode) {
  const isStatic = !!spec.static || !!env.compact;
  const showPressure = spec.pressures !== false;
  const showValveNames = !!spec.valveNames;
  let index = Math.max(0, PHASE_IDS.indexOf(spec.phase || 'fill'));
  let beats = 0;
  const seen = new Set([PHASE_IDS[index]]);
  let open = new Set(mode === 'valves' ? (Array.isArray(spec.open) ? spec.open.filter((v) => VALVES[v]) : []) : openValves(PHASE_IDS[index]));
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A diagram of the heart with its four chambers and four valves' });
  const { svg } = fr;
  const defs = s('defs');
  defs.appendChild(s('marker', { id: `hc-arrow-${uid()}`, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, s('path', { d: 'M0 0 L10 5 L0 10 Z', fill: DARK })));
  svg.appendChild(defs);
  const arrowRef = `url(#${defs.firstChild.getAttribute('id')})`;

  const POOR = hue('blue');
  const RICH = hue('red');

  // fixed parts: the vessels and the body of the heart
  const tube = (d, color) => [
    s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 40, 'stroke-linejoin': 'round' }),
    s('path', { d, fill: 'none', stroke: color, 'stroke-width': 34, 'stroke-linejoin': 'round' }),
  ];
  const gBack = s('g');
  gBack.append(...tube('M8 138 H126', POOR), ...tube('M552 138 H434', RICH));
  gBack.appendChild(s('rect', { x: 96, y: 84, width: 368, height: 276, rx: 44, fill: hue('pink', 'soft'), stroke: 'var(--ink)', 'stroke-width': 3 }));
  gBack.append(...tube('M253 216 V52 H112', POOR), ...tube('M307 216 V52 H448', RICH));
  svg.appendChild(gBack);
  const gDyn = s('g');
  svg.appendChild(gDyn);

  // labels that never change
  const text = (cls, x, y, str, anchor = 'middle') => s(`text.${cls}`, { x, y, 'text-anchor': anchor }, str);
  svg.append(
    text('hc-side', 8, 384, 'THE PERSON\'S RIGHT', 'start'),
    text('hc-side', 552, 384, 'THE PERSON\'S LEFT', 'end'),
    text('fig-label-sm', 8, 108, 'from body', 'start'),
    text('fig-label-sm', 552, 108, 'from lungs', 'end'),
    text('fig-label-sm', 8, 48, 'to lungs', 'start'),
    text('fig-label-sm', 552, 48, 'to body', 'end'),
  );

  const VALVE_AT = {
    tricuspid: { x: 168, y: 192, dir: 'down' },
    mitral: { x: 392, y: 192, dir: 'down' },
    pulmonary: { x: 253, y: 196, dir: 'up' },
    aortic: { x: 307, y: 196, dir: 'up' },
  };
  const valveEls = {};

  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const steps = h('div.hc-steps', { role: 'group', 'aria-label': 'Phases of the heartbeat' });
  let nextBtn = null;
  let playBtn = null;

  const phase = () => PHASES[index];
  const pressures = () => phase().pressure;

  function arrow(d) { return s('path', { d, fill: 'none', stroke: DARK, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'marker-end': arrowRef }); }

  function drawValve(id) {
    const at = VALVE_AT[id];
    const isOpen = open.has(id);
    const g = s('g', { class: 'hc-valve' });
    const flap = (x1, y1, x2, y2) => s('line', { x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-width': 5.5, 'stroke-linecap': 'round' });
    if (at.dir === 'down') {
      if (isOpen) g.append(flap(at.x - 25, at.y - 8, at.x - 17, at.y + 18), flap(at.x + 25, at.y - 8, at.x + 17, at.y + 18));
      else g.append(flap(at.x - 25, at.y - 4, at.x - 1, at.y + 4), flap(at.x + 25, at.y - 4, at.x + 1, at.y + 4));
    } else if (isOpen) g.append(flap(at.x - 15, at.y + 8, at.x - 11, at.y - 16), flap(at.x + 15, at.y + 8, at.x + 11, at.y - 16));
    else g.append(flap(at.x - 15, at.y + 6, at.x - 1, at.y - 3), flap(at.x + 15, at.y + 6, at.x + 1, at.y - 3));
    if (mode === 'valves' && !isStatic) {
      g.insertBefore(s('circle.hc-ring', { cx: at.x, cy: at.y + (at.dir === 'down' ? 4 : -2), r: at.dir === 'down' ? 31 : 25 }), g.firstChild);
      // a generous, invisible target: at least 40 px on a phone, where the drawing is about 0.6 of its size
      g.insertBefore(s('ellipse', { cx: at.x, cy: at.y + (at.dir === 'down' ? 4 : -2), rx: at.dir === 'down' ? 36 : 27, ry: 36, fill: 'transparent' }), g.firstChild);
      g.setAttribute('tabindex', readOnly ? '-1' : '0');
      g.setAttribute('role', 'switch');
      g.setAttribute('aria-checked', isOpen ? 'true' : 'false');
      g.setAttribute('aria-label', `${VALVES[id].name}: ${isOpen ? 'open' : 'closed'}`);
      g.dataset.keys = 'own';
      g.dataset.valve = id;
    }
    return g;
  }

  function toggle(id) {
    if (readOnly || mode !== 'valves' || isStatic) return;
    if (open.has(id)) open.delete(id); else open.add(id);
    play(open.has(id) ? 'pop' : 'tap');
    render();
    const el = valveEls[id];
    if (el && document.activeElement !== el) { try { el.focus({ preventScroll: true }); } catch { /* ignore */ } }
    env.announce(`${VALVES[id].name} ${open.has(id) ? 'open' : 'closed'}. ${faultText()}`);
    env.onChange(getState());
  }
  svg.addEventListener('click', (ev) => {
    const g = ev.target.closest && ev.target.closest('.hc-valve');
    if (g && g.dataset.valve) toggle(g.dataset.valve);
  });
  svg.addEventListener('keydown', (ev) => {
    const g = ev.target.closest && ev.target.closest('.hc-valve');
    if (!g || !g.dataset.valve) return;
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); toggle(g.dataset.valve); }
  });

  function faultText() {
    const { backflow, blocked } = valveFaults(phase().id, [...open]);
    const parts = [];
    if (backflow.length) parts.push(`Blood runs backwards through the ${backflow.map((v) => VALVES[v].name).join(' and the ')}.`);
    if (blocked.length) parts.push(`Blood is held up behind the ${blocked.map((v) => VALVES[v].name).join(' and the ')}.`);
    return parts.length ? parts.join(' ') : 'Blood moves forward only.';
  }

  function render() {
    const ph = phase();
    const p = ph.pressure;
    const sq = ph.squeeze;
    gDyn.replaceChildren();
    // cavities: a squeezing chamber gets smaller, so its wall looks thicker. The edges that carry a valve stay put.
    const a = 9 * sq.atria;
    const v = 15 * sq.ventricles;
    const cavity = (x, y, w, ht, color) => s('rect', { x, y, width: w, height: ht, rx: 16, fill: color, stroke: 'var(--ink)', 'stroke-width': 3 });
    gDyn.append(
      cavity(112 + 1.6 * a, 100 + 1.2 * a, 112 - 1.6 * a, 78 - 1.2 * a, POOR), cavity(336, 100 + 1.2 * a, 112 - 1.6 * a, 78 - 1.2 * a, RICH),
      cavity(112 + 1.6 * v, 212, 158 - 1.6 * v, 128 - 1.3 * v, POOR), cavity(290, 212, 158 - 1.6 * v, 128 - 1.3 * v, RICH),
    );
    // openings between the chambers, and the roots of the two arteries
    const gap = (x, y, w, ht, color) => s('rect', { x, y, width: w, height: ht, fill: color });
    gDyn.append(gap(144, 170, 48, 52, POOR), gap(368, 170, 48, 52, RICH), gap(237.5, 196, 31, 30, POOR), gap(291.5, 196, 31, 30, RICH));
    const wall = (x1, x2, y1, y2) => s('path', { d: `M${x1} ${y1}V${y2}M${x2} ${y1}V${y2}`, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    gDyn.append(wall(142.5, 193.5, 176, 214), wall(366.5, 417.5, 176, 214));

    // blood on the move
    const faults = mode === 'valves' ? valveFaults(ph.id, [...open]) : { backflow: [], blocked: [] };
    gDyn.append(arrow('M14 138 H92'), arrow('M546 138 H468'));
    for (const id of VALVE_IDS) {
      if (!open.has(id)) continue;
      const at = VALVE_AT[id];
      const forward = !faults.backflow.includes(id);
      if (at.dir === 'down') gDyn.appendChild(arrow(forward ? `M${at.x} ${at.y - 24} V${at.y + 36}` : `M${at.x} ${at.y + 36} V${at.y - 24}`));
      else {
        gDyn.appendChild(arrow(forward ? `M${at.x} ${at.y + 36} V${at.y - 86}` : `M${at.x} ${at.y - 86} V${at.y + 36}`));
        const out = id === 'pulmonary' ? [222, 132] : [338, 428];
        gDyn.appendChild(arrow(forward ? `M${out[0]} 52 H${out[1]}` : `M${out[1]} 52 H${out[0]}`));
      }
    }
    for (const id of VALVE_IDS) { valveEls[id] = drawValve(id); gDyn.appendChild(valveEls[id]); }

    // names and pressures
    const label = (x, y, str, cls = 'fig-label-sm', anchor = 'middle') => s(`text.${cls}`, { x, y, 'text-anchor': anchor }, str);
    gDyn.append(label(168, 130, 'right atrium'), label(392, 130, 'left atrium'), label(191, 297, 'right ventricle'), label(369, 297, 'left ventricle'));
    if (showPressure) {
      gDyn.append(
        label(191, 320, `${p.rv} mmHg`, 'fig-label'), label(369, 320, `${p.lv} mmHg`, 'fig-label'),
        label(168, 148, `${p.ra} mmHg`), label(392, 148, `${p.la} mmHg`),
        label(8, 66, `${p.pulmonary} mmHg`, 'fig-label', 'start'), label(552, 66, `${p.aorta} mmHg`, 'fig-label', 'end'),
      );
    }
    if (showValveNames) {
      gDyn.append(label(168, 260, 'tricuspid valve'), label(392, 260, 'mitral valve'), label(266, 238, 'pulmonary valve', 'fig-label-sm', 'end'), label(294, 238, 'aortic valve', 'fig-label-sm', 'start'));
    }
    if (mode === 'valves') {
      // short flags on two lines: inlet flags under their valve, outlet flags a line lower beside the septum
      const flag = (id, str, cls) => {
        const at = VALVE_AT[id];
        const right = VALVES[id].side === 'right';
        if (at.dir === 'down') return s(`text.fig-label.hc-flag.${cls}`, { x: at.x + (right ? -8 : 8), y: 250, 'text-anchor': 'middle' }, str);
        return s(`text.fig-label.hc-flag.${cls}`, { x: right ? 266 : 294, y: 272, 'text-anchor': right ? 'end' : 'start' }, str);
      };
      for (const id of faults.backflow) gDyn.appendChild(flag(id, 'leaks back', 'text-red'));
      for (const id of faults.blocked) gDyn.appendChild(flag(id, 'blocked', 'text-orange'));
    }
    if (mode === 'cycle' && ph.sound) gDyn.appendChild(s('text.hc-sound', { x: 280, y: 384, 'text-anchor': 'middle' }, ph.sound === 'lub' ? '“LUB”' : '“DUB”'));

    // around the drawing
    if (mode === 'cycle') {
      note.textContent = ph.note;
      steps.replaceChildren(...PHASES.map((q, i) => h('span', { class: `hc-step${i === index ? ' is-now' : seen.has(q.id) ? ' is-seen' : ''}` }, `${i + 1}. ${q.name}`)));
    } else {
      note.textContent = `${ph.name}. ${faultText()}`;
    }
    if (nextBtn) nextBtn.disabled = readOnly || anim.running;
    if (playBtn) { playBtn.disabled = readOnly; playBtn.lastChild.textContent = anim.running ? 'Pause' : 'Play one beat'; }
    const openNames = VALVE_IDS.filter((id) => open.has(id)).map((id) => VALVES[id].name);
    svg.setAttribute('aria-label', `${spec.alt || 'A diagram of the heart'}. ${ph.name}. Open: ${openNames.length ? openNames.join(', ') : 'no valve'}. ${mode === 'valves' ? faultText() : ph.note}`);
  }

  function goto(i, notify) {
    const wrapped = i >= PHASES.length;
    index = ((i % PHASES.length) + PHASES.length) % PHASES.length;
    if (wrapped) beats++;
    seen.add(PHASE_IDS[index]);
    open = new Set(openValves(PHASE_IDS[index]));
    const snd = phase().sound;
    if (snd) play(snd === 'lub' ? 'drop' : 'tap');
    render();
    if (notify) { env.announce(phase().note); env.onChange(getState()); }
  }

  let clock = 0;
  let stopAt = -1;
  const anim = loop((dt) => {
    clock += dt;
    if (clock < SLOW[index]) return;
    clock = 0;
    goto(index + 1, true);
    if (index === stopAt) { anim.stop(); render(); }
  });

  function playBeat() {
    if (readOnly) return;
    if (anim.running) { anim.stop(); render(); return; }
    if (reducedMotion()) {
      // no animation: complete the beat at once and show where it ends
      for (const id of PHASE_IDS) seen.add(id);
      beats++;
      index = 0;
      open = new Set(openValves('fill'));
      render();
      env.onChange(getState());
      return;
    }
    stopAt = index;
    clock = 0;
    anim.start();
    render();
  }

  function getState() {
    const ph = phase();
    const names = [...open].sort();
    if (mode === 'valves') {
      const { backflow, blocked } = valveFaults(ph.id, names);
      return { mode, phase: ph.id, open: names, backflow, blocked, oneWay: !backflow.length && !blocked.length, pressure: { ...ph.pressure } };
    }
    return { mode, phase: ph.id, index, beats, seen: PHASE_IDS.filter((id) => seen.has(id)), open: names, sound: ph.sound, pressure: { ...ph.pressure } };
  }

  if (!isStatic) {
    if (mode === 'cycle') {
      nextBtn = button('Next moment', () => { if (!readOnly && !anim.running) goto(index + 1, true); }, { icon: 'arrow-right', variant: 'primary' });
      playBtn = button('Play one beat', playBeat, { icon: 'play' });
      fr.buttons.append(nextBtn, playBtn);
      fr.el.insertBefore(steps, fr.readouts);
    }
    fr.el.insertBefore(note, fr.readouts);
  }
  const legend = h('div.w-legend',
    h('span.w-legend-item', h('i', { style: `background:${RICH}` }), 'rich in oxygen'),
    h('span.w-legend-item', h('i', { style: `background:${POOR}` }), 'poor in oxygen (drawn blue; really dark red)'));
  if (!env.compact) fr.el.appendChild(legend);

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (mode === 'valves') {
        if (Array.isArray(next.open)) open = new Set(next.open.filter((v) => VALVES[v]));
        render();
        return;
      }
      if (Array.isArray(next.seen)) for (const id of next.seen) if (PHASE_IDS.includes(id)) seen.add(id);
      if (typeof next.beats === 'number') { beats = Math.max(0, Math.round(next.beats)); if (beats > 0) for (const id of PHASE_IDS) seen.add(id); }
      let to = typeof next.index === 'number' ? next.index : next.phase != null ? PHASE_IDS.indexOf(next.phase) : index;
      if (to < 0) to = index;
      index = clamp(Math.round(to), 0, PHASES.length - 1);
      seen.add(PHASE_IDS[index]);
      open = new Set(openValves(PHASE_IDS[index]));
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly) anim.stop();
      fr.el.classList.toggle('is-readonly', readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

let seq = 0;
function uid() { seq += 1; return seq; }

/* ------------------------------------------------------------ cardiac output */

function createOutput(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const rr = Array.isArray(spec.rateRange) ? spec.rateRange : [40, 190, 5];
  const sr = Array.isArray(spec.strokeRange) ? spec.strokeRange : [40, 140, 5];
  let rate = clamp(spec.rate != null ? spec.rate : 70, rr[0], rr[1]);
  let stroke = clamp(spec.stroke != null ? spec.stroke : 70, sr[0], sr[1]);
  let readOnly = !!env.readOnly;
  const MAXOUT = 30;
  const OW = 560;
  const OH = 130;
  const fr = frame({ width: OW, height: OH, compact: env.compact, label: spec.alt || 'Heart rate times stroke volume gives the blood pumped each minute' });
  const { svg } = fr;
  const X0 = 30;
  const X1 = 530;
  const sx = (v) => X0 + (v / MAXOUT) * (X1 - X0);
  svg.appendChild(s('rect', { x: X0, y: 44, width: X1 - X0, height: 30, rx: 10, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const bar = s('rect', { x: X0 + 3, y: 47, width: 0, height: 24, rx: 7, fill: hue('red') });
  svg.appendChild(bar);
  for (let v = 0; v <= MAXOUT; v += 5) {
    svg.appendChild(s('line', { x1: sx(v), x2: sx(v), y1: 76, y2: 84, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x: sx(v), y: 100, 'text-anchor': 'middle' }, String(v)));
  }
  svg.appendChild(s('text.axis-label', { x: X1, y: 122, 'text-anchor': 'end' }, 'litres of blood pumped each minute'));
  const mark = s('text.fig-label', { x: X0, y: 30, 'text-anchor': 'middle' }, '');
  svg.appendChild(mark);

  const eq = h('div.hc-eq', { 'aria-live': 'polite' });
  fr.el.insertBefore(eq, fr.readouts);
  const getState = () => ({ mode: 'output', rate, stroke, output: cardiacOutput(rate, stroke) });
  let rateRow = null;
  let strokeRow = null;

  function render() {
    const out = cardiacOutput(rate, stroke);
    bar.setAttribute('width', Math.max(0, sx(Math.min(out, MAXOUT)) - X0 - 6));
    mark.setAttribute('x', clamp(sx(Math.min(out, MAXOUT)), X0 + 40, X1 - 40));
    mark.textContent = `${fmt(out)} L/min`;
    eq.replaceChildren(
      h('span', h('b', String(rate)), ' ', h('small', 'beats a minute')),
      h('span', '×'),
      h('span', h('b', String(stroke)), ' ', h('small', 'mL a beat')),
      h('span', '='),
      h('span.hc-out', h('b', fmt(out)), ' ', h('small', 'litres a minute')),
    );
    svg.setAttribute('aria-label', `${spec.alt || 'Cardiac output'}. ${rate} beats a minute times ${stroke} millilitres a beat gives ${fmt(out)} litres a minute.`);
  }
  const fmt = (v) => String(Math.round(v * 100) / 100);

  if (!isStatic) {
    rateRow = sliderRow({ label: 'heart rate', min: rr[0], max: rr[1], step: rr[2] || 5, value: rate, color: 'red', unit: 'a minute', onInput: (v) => { if (readOnly) return; rate = v; render(); env.onChange(getState()); } });
    strokeRow = sliderRow({ label: 'stroke volume', min: sr[0], max: sr[1], step: sr[2] || 5, value: stroke, color: 'violet', unit: 'mL', onInput: (v) => { if (readOnly) return; stroke = v; render(); env.onChange(getState()); } });
    fr.controls.append(rateRow.el, strokeRow.el);
  }
  render();
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.rate === 'number') { rate = clamp(next.rate, rr[0], rr[1]); if (rateRow) rateRow.set(rate); }
      if (typeof next.stroke === 'number') { stroke = clamp(next.stroke, sr[0], sr[1]); if (strokeRow) strokeRow.set(stroke); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (rateRow) rateRow.setDisabled(readOnly);
      if (strokeRow) strokeRow.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'heart-cycle — step through one heartbeat', spec: { type: 'heart-cycle' } },
  { title: 'heart-cycle — set the valves yourself (ejection)', spec: { type: 'heart-cycle', mode: 'valves', phase: 'eject', open: ['tricuspid', 'mitral'] } },
  { title: 'heart-cycle — heart rate × stroke volume', spec: { type: 'heart-cycle', mode: 'output', rate: 70, stroke: 70 } },
];
