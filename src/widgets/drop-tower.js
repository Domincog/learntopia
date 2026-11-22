/**
 * drop-tower — release two objects side by side and see which lands first.
 * Without air they always land together, whatever their masses. With air
 * switched on, light fluffy things lag behind.
 *
 * {
 *   type: 'drop-tower',
 *   height: 20,                        // drop height (m)
 *   objects: ['bowling', 'tennis'],    // two of: bowling, tennis, hammer, feather
 *   air: false,                        // start with air resistance on?
 *   airToggle: true,                   // let the learner switch the air on and off
 *   strobe: 0.5,                       // seconds between strobe images (0 for none)
 *   g: 10,                             // acceleration of free fall (m/s²)
 *   static: false,                     // true: picture of the finished drop, no controls
 * }
 *
 * State: { air, dropped, times, together, first, runs, vacuumRuns, airRuns }
 *   dropped    — the current setting has been dropped at least once
 *   times      — landing time of each object (s) for the current setting
 *   together   — they land within 0.01 s of each other
 *   first      — index of the object that lands first (null if together)
 *   runs / vacuumRuns / airRuns — how many drops the learner has made
 *
 * setState({ air, dropped }) sets the switch and shows the finished drop.
 *
 * The model: no air → y = ½·g·t² for every object. With air → drag that grows
 * with the square of the speed, y = (vt²/g)·ln cosh(g·t/vt), where vt is the
 * object's terminal speed. Both are exact formulas, so results never depend
 * on frame timing. The terminal speeds are rough, realistic values; this is a
 * teaching model, not a wind tunnel.
 */
import { frame, button, readout, loop, hue, s, h, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 336;
const GROUND = 286;
const TOP = 46;

addStyles('drop-tower', `
  .widget-drop-tower .dt-air { display: flex; justify-content: center; }
  .widget-drop-tower .dt-name { font-family: var(--font-body); font-weight: 800; font-size: 14px; fill: var(--ink); }
  .widget-drop-tower .dt-mass { font-family: var(--font-body); font-weight: 700; font-size: 13px; fill: var(--ink-3); }
  @media (max-width: 520px) {
    .widget-drop-tower .dt-name { font-size: 18px; }
    .widget-drop-tower .dt-mass { font-size: 17px; }
  }
`);

/** Shapes are drawn with their lowest point at (0, 0). */
const OBJECTS = {
  bowling: {
    name: 'bowling ball', mass: '6 kg', vt: 80, size: 34, ghost: 15, color: 'violet',
    draw: (g) => {
      g.appendChild(s('circle', { cy: -17, r: 17, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      for (const [x, y] of [[-5, -23], [3, -25], [0, -17]]) g.appendChild(s('circle', { cx: x, cy: y, r: 2.4, fill: 'var(--ink)' }));
    },
  },
  tennis: {
    name: 'tennis ball', mass: '60 g', vt: 22, size: 18, ghost: 8, color: 'yellow',
    draw: (g) => {
      g.appendChild(s('circle', { cy: -9, r: 9, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      g.appendChild(s('path', { d: 'M-7 -14 Q0 -9 -7 -4', fill: 'none', stroke: 'var(--surface)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    },
  },
  hammer: {
    name: 'hammer', mass: '1.3 kg', vt: 70, size: 36, ghost: 9, color: 'gray',
    draw: (g) => {
      g.appendChild(s('rect', { x: -3.5, y: -34, width: 7, height: 30, rx: 3, fill: hue('orange', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      g.appendChild(s('rect', { x: -14, y: -12, width: 28, height: 12, rx: 3, fill: hue('gray'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    },
  },
  feather: {
    name: 'feather', mass: '30 g', vt: 1.5, size: 34, ghost: 7, color: 'teal',
    draw: (g) => {
      g.appendChild(s('path', { d: 'M0 0 Q-13 -14 -5 -31 Q1 -37 5 -31 Q12 -14 0 0 Z', fill: hue('teal', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      g.appendChild(s('path', { d: 'M0 3 V-29', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    },
  },
};

const lncosh = (u) => u + Math.log1p(Math.exp(-2 * u)) - Math.LN2;

export default function create(spec, env) {
  const height = spec.height || 20;
  const g = spec.g || 10;
  const isStatic = !!spec.static || !!env.compact;
  const airToggle = spec.airToggle !== false && !isStatic;
  const strobe = spec.strobe != null ? spec.strobe : 0.5;
  const keys = (spec.objects || ['bowling', 'tennis']).slice(0, 2);
  const objs = keys.map((key) => OBJECTS[key] || OBJECTS.bowling);
  const lanes = [205, 385];
  const ky = (GROUND - TOP) / height;                 // px per metre

  let air = !!spec.air;
  let dropped = isStatic;
  let t = 0;
  let runs = 0;
  let vacuumRuns = 0;
  let airRuns = 0;
  let readOnly = !!env.readOnly;

  /* ----------------------------------------------------------- the model */
  /** Distance fallen after `time` seconds (m). */
  const fallen = (obj, time, withAir) => (withAir ? ((obj.vt * obj.vt) / g) * lncosh((g * time) / obj.vt) : 0.5 * g * time * time);
  /** Time to fall the whole height (s). */
  function landing(obj, withAir) {
    if (!withAir) return Math.sqrt((2 * height) / g);
    const c = (g * height) / (obj.vt * obj.vt);
    return (obj.vt / g) * (c + Math.log(1 + Math.sqrt(1 - Math.exp(-2 * c))));
  }
  const rawTimes = () => objs.map((o) => landing(o, air));
  const times = () => rawTimes().map((v) => tidy(v, 2));
  const runLength = () => { const ts = rawTimes(); return Math.min(Math.max(...ts), Math.min(...ts) + 2.5); };

  /* ------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Two objects ready to be dropped side by side' });
  const { svg } = fr;

  const gAir = s('g');
  svg.appendChild(gAir);
  for (let i = 0; i < 46; i++) {
    gAir.appendChild(s('circle', { cx: 96 + env.rng.float(0, 440), cy: TOP - 30 + env.rng.float(0, GROUND - TOP + 20), r: env.rng.float(1.6, 3), fill: hue('blue', 'soft') }));
  }
  // height scale
  svg.appendChild(s('line', { x1: 66, x2: 66, y1: TOP, y2: GROUND, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  const stepM = height <= 10 ? 2 : height <= 25 ? 5 : height <= 50 ? 10 : 20;
  for (let m = 0; m <= height + 1e-9; m += stepM) {
    const y = GROUND - m * ky;
    svg.appendChild(s('line', { x1: 58, x2: 66, y1: y, y2: y, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    svg.appendChild(s('text.tick-label', { x: 52, y: y + 4, 'text-anchor': 'end' }, m + stepM > height ? `${m} m` : String(m)));
  }
  svg.appendChild(s('line', { x1: 66, x2: W - 30, y1: TOP, y2: TOP, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }));
  svg.appendChild(s('line', { x1: 40, x2: W - 16, y1: GROUND, y2: GROUND, stroke: 'var(--ink)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }));

  const gGuides = s('g');
  const gGhosts = s('g');
  svg.append(gGuides, gGhosts);
  const movers = objs.map((obj, i) => {
    const grp = s('g');
    obj.draw(grp);
    svg.appendChild(grp);
    svg.appendChild(s('text.dt-name', { x: lanes[i], y: GROUND + 22, 'text-anchor': 'middle' }, obj.name));
    svg.appendChild(s('text.dt-mass', { x: lanes[i], y: GROUND + 41, 'text-anchor': 'middle' }, obj.mass));
    return grp;
  });
  const landLabels = objs.map((_, i) => {
    const el = s('text.fig-label', { x: lanes[i] + 30, y: GROUND - 10, 'text-anchor': 'start' });
    svg.appendChild(el);
    return el;
  });

  /* ------------------------------------------------------------ controls */
  const roTime = readout('time', { digits: 2, unit: 's' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let dropBtn = null;
  const airBtns = [];
  if (!isStatic) {
    fr.readouts.append(roTime.el);
    if (airToggle) {
      const seg = h('div.segmented', { role: 'group', 'aria-label': 'Air resistance' });
      [['No air', false], ['With air', true]].forEach(([text, value]) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(air === value) }, text);
        b.addEventListener('click', () => {
          if (readOnly || air === value) return;
          anim.stop();
          air = value;
          dropped = false;
          t = 0;
          note.textContent = '';
          play('select');
          render();
        });
        airBtns.push({ b, value });
        seg.appendChild(b);
      });
      fr.controls.appendChild(h('div.dt-air', seg));
    }
    dropBtn = button('Drop', () => drop(true), { icon: 'arrow-down', variant: 'primary' });
    fr.buttons.appendChild(dropBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    const end = runLength();
    t = Math.min(end, t + dt * 0.75);                 // slight slow motion
    if (t >= end - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  function summary() {
    const ts = times();
    if (Math.abs(ts[0] - ts[1]) < 0.01) return `Both land after ${formatNumber(ts[0], 2)} s.`;
    const first = ts[0] < ts[1] ? 0 : 1;
    const late = rawTimes()[1 - first] > runLength() + 1e-9;
    return `The ${objs[first].name} lands first, after ${formatNumber(ts[first], 2)} s. ${late ? `The ${objs[1 - first].name} is still drifting down.` : `The ${objs[1 - first].name} follows at ${formatNumber(ts[1 - first], 2)} s.`}`;
  }

  function finish(notify) {
    dropped = true;
    t = runLength();
    render();
    note.textContent = summary();
    if (notify) {
      play('drop');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function drop(count) {
    if (isStatic) return;
    anim.stop();
    t = 0;
    dropped = true;
    note.textContent = '';
    if (count && !readOnly) { runs++; if (air) airRuns++; else vacuumRuns++; }
    if (reducedMotion()) { finish(count && !readOnly); return; }
    notifyAtEnd = count && !readOnly;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const ts = objs.map((o) => landing(o, air));
    const shown = isStatic ? runLength() : t;
    const active = anim.running || (dropped && shown > 0);
    gAir.setAttribute('visibility', air ? 'visible' : 'hidden');
    while (gGhosts.firstChild) gGhosts.removeChild(gGhosts.firstChild);
    while (gGuides.firstChild) gGuides.removeChild(gGuides.firstChild);
    objs.forEach((obj, i) => {
      const done = active && shown >= ts[i] - 1e-9;
      const d = active ? Math.min(height, fallen(obj, Math.min(shown, ts[i]), air)) : 0;
      movers[i].setAttribute('transform', `translate(${lanes[i]} ${(TOP + d * ky).toFixed(1)})`);
      landLabels[i].textContent = done ? `${formatNumber(ts[i], 2)} s` : '';
      if (strobe > 0 && active) {
        for (let k = 1; k * strobe < Math.min(shown, ts[i]) - 1e-9 && k < 40; k++) {
          const y = TOP + fallen(obj, k * strobe, air) * ky;
          gGhosts.appendChild(s('circle', { cx: lanes[i], cy: y - obj.ghost, r: obj.ghost, fill: hue(obj.color, 'soft'), stroke: hue(obj.color), 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
        }
      }
    });
    if (strobe > 0 && active && !air) {
      for (let k = 1; k * strobe < Math.min(shown, ts[0]) - 1e-9 && k < 40; k++) {
        const y = TOP + fallen(objs[0], k * strobe, false) * ky;
        gGuides.appendChild(s('line', { x1: lanes[0] + objs[0].ghost + 6, x2: lanes[1] - objs[1].ghost - 6, y1: y, y2: y, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '2 5' }));
        gGuides.appendChild(s('text.tick-label', { x: (lanes[0] + lanes[1]) / 2, y: y - 5, 'text-anchor': 'middle' }, `${formatNumber(k * strobe, 2)} s`));
      }
    }
    roTime.set(active ? Math.min(shown, Math.max(...ts)) : 0);
    for (const { b, value } of airBtns) { b.setAttribute('aria-pressed', String(air === value)); b.disabled = readOnly; }
    if (dropBtn) dropBtn.lastChild.textContent = dropped && !anim.running ? 'Drop again' : 'Drop';
    if (!isStatic) svg.setAttribute('aria-label', `${spec.alt || `A ${objs[0].name} and a ${objs[1].name}, ${height} metres above the ground`}. Air resistance ${air ? 'on' : 'off'}.${dropped && !anim.running ? ` ${summary()}` : ''}`);
  }

  function getState() {
    const ts = times();
    const together = Math.abs(ts[0] - ts[1]) < 0.01;
    return { air, dropped, times: ts, together, first: together ? null : (ts[0] < ts[1] ? 0 : 1), runs, vacuumRuns, airRuns };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (typeof next.air === 'boolean') air = next.air;
      if (next.dropped === false) { dropped = false; t = 0; render(); return; }
      if (isStatic) { render(); return; }
      if (air) airRuns = Math.max(airRuns, 1); else vacuumRuns = Math.max(vacuumRuns, 1);
      runs = Math.max(runs, 1);
      finish(false);
    },
    setReadOnly(val) { readOnly = !!val; fr.el.classList.toggle('is-readonly', readOnly); render(); },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'drop-tower — heavy and light, with an air switch', spec: { type: 'drop-tower', height: 20, objects: ['bowling', 'tennis'] } },
  { title: 'drop-tower — hammer and feather in air', spec: { type: 'drop-tower', height: 20, objects: ['hammer', 'feather'], air: true } },
];
