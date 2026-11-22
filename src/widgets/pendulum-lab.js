/**
 * pendulum-lab — time a pendulum, or a mass bobbing on a spring, and see what
 * does and does not change its period. Beside the apparatus a position–time
 * graph is drawn live: a smooth wave whose peaks are one period apart.
 *
 * {
 *   type: 'pendulum-lab',
 *   mode: 'pendulum',             // 'pendulum' | 'spring'
 *
 *   // pendulum
 *   length: 1, mass: 1, angle: 5, // metres, kilograms, release angle in degrees from the vertical
 *   lengthRange: [0.2, 2, 0.2],   // optional sliders: [min, max, step]
 *   massRange: [0.5, 2, 0.5],
 *   angleRange: [5, 40, 5],
 *
 *   // spring (a mass hanging on a spring)
 *   mass: 0.4, stiffness: 10, pull: 5,   // kilograms, newtons per metre, pull-down before release in centimetres
 *   massRange: [0.1, 0.4, 0.1],
 *   stiffnessRange: [10, 40, 10],
 *   pullRange: [2, 10, 2],
 *
 *   window: 6,                    // seconds of motion that are timed and drawn (default 6 for a pendulum, 3 for a spring)
 *   bars: false,                  // pendulum only: bars for kinetic, potential and total energy
 *   scrub: false,                 // add a "time" slider that moves the apparatus through its motion by hand
 *   log: true,                    // list the runs so far under the picture
 *   g: 10,
 *   static: false,                // true: a picture without controls…
 *   show: 'start',                // …before the release ('start') or with the finished graph ('end')
 * }
 *
 * State: { mode, length, mass, angle, stiffness, pull, period, formula, frequency, ran, time, scrubbed, runs, history }
 *   period    — time for one full swing with the current settings (s)
 *   formula   — 2π√(L/g) for a pendulum, 2π√(m/k) for a spring (s). A spring's period is exactly this;
 *               a pendulum's is slightly longer, the more so the wider it swings
 *   frequency — swings per second, 1 / period
 *   ran       — the current settings have been released
 *   time      — where the clock (or the time slider) stands (s);  scrubbed — the learner has moved the time slider
 *   runs      — how many runs so far;  history — each run: { length, mass, angle, period } or { mass, stiffness, pull, period }
 * The facts always describe the *current* settings; they do not wait for the animation.
 *
 * setState({ length, mass, angle, stiffness, pull, history }) sets the sliders and shows the finished run.
 * `history` may list earlier runs by their settings alone; the periods are recomputed.
 *
 * The models. Pendulum: θ'' = −(g/L)·sin θ, the real pendulum, not the small-angle
 * one, integrated by RK4 with a fixed step of 1/240 s; its period is the exact
 * value 2π√(L/g) / agm(1, cos(θ₀/2)). Spring: x = A·cos(2πt/T) with
 * T = 2π√(m/k), exact. No friction, no air: the swings never die away.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 300;
const D2R = Math.PI / 180;
const DT = 1 / 240;
const GX0 = 300;       // the graph panel
const GX1 = 544;
const GY0 = 46;
const GY1 = 250;

addStyles('pendulum-lab', `
  .widget-pendulum-lab .pl-log { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; min-height: 30px; }
  .widget-pendulum-lab .pl-run { padding: 2px 10px; border: var(--bw) solid var(--hair); border-radius: 999px; background: var(--surface); font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums; }
  .widget-pendulum-lab .pl-run b { font-family: var(--font-mono); color: var(--blue-text); }
  .widget-pendulum-lab .pl-run.is-now { border-color: var(--edge-strong); }
  .widget-pendulum-lab .pl-empty { color: var(--ink-3); font-size: var(--fs-sm); align-self: center; }
  .widget-pendulum-lab .pl-bars { display: grid; gap: 5px; }
  .widget-pendulum-lab .pl-row { display: grid; grid-template-columns: 5.4em minmax(0, 1fr) 4.4em; align-items: center; gap: var(--s2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-pendulum-lab .pl-row > span:last-child { font-family: var(--font-mono); text-align: right; font-variant-numeric: tabular-nums; }
  .widget-pendulum-lab .pl-bar { display: flex; height: 16px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); overflow: hidden; }
  .widget-pendulum-lab .pl-bar i { display: block; height: 100%; }
  .widget-pendulum-lab .pl-ke { background: var(--green); }
  .widget-pendulum-lab .pl-pe { background: var(--blue); }
  .widget-pendulum-lab .pl-key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; border: 1.5px solid var(--edge-strong); margin-right: 5px; }
  .widget-pendulum-lab .pl-period { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--blue-text); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-pendulum-lab .pl-period { font-size: 17px; } }
`);

/** Arithmetic–geometric mean, for the exact period of a pendulum. */
function agm(a, b) {
  for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) { const m = (a + b) / 2; b = Math.sqrt(a * b); a = m; }
  return a;
}
/** Exact period of a pendulum of length L released from rest at `deg` degrees. */
export const pendulumPeriod = (L, deg, g = 10) => (2 * Math.PI * Math.sqrt(L / g)) / agm(1, Math.cos((deg * D2R) / 2));
export const springPeriod = (m, k) => 2 * Math.PI * Math.sqrt(m / k);

export default function create(spec, env) {
  const mode = spec.mode === 'spring' ? 'spring' : 'pendulum';
  const g = spec.g || 10;
  const isStatic = !!spec.static || !!env.compact;
  const keys = mode === 'pendulum' ? ['length', 'mass', 'angle'] : ['mass', 'stiffness', 'pull'];
  const defaults = mode === 'pendulum' ? { length: 1, mass: 1, angle: 5 } : { mass: 0.4, stiffness: 10, pull: 5 };
  const meta = {
    length: { label: 'length', unit: 'm', color: 'violet' },
    mass: { label: 'mass', unit: 'kg', color: 'orange' },
    angle: { label: 'release angle', unit: '°', color: 'teal' },
    stiffness: { label: 'spring stiffness', unit: 'N/m', color: 'violet' },
    pull: { label: 'pull down by', unit: 'cm', color: 'teal' },
  };
  const ranges = {};
  const set = {};
  for (const key of keys) {
    ranges[key] = !isStatic && Array.isArray(spec[`${key}Range`]) ? spec[`${key}Range`] : null;
    set[key] = spec[key] != null ? spec[key] : defaults[key];
  }
  const initial = { ...set };
  const windowS = spec.window || (mode === 'pendulum' ? 6 : 3);
  const showBars = !!spec.bars && mode === 'pendulum' && !env.compact;
  const showLog = spec.log !== false && !isStatic && !showBars;
  const scrub = !!spec.scrub && !isStatic;

  let ran = isStatic && spec.show === 'end';
  let t = 0;
  let history = [];
  let readOnly = !!env.readOnly;
  let cache = null;

  /* ----------------------------------------------------------- the model */
  const periodOf = (v) => (mode === 'pendulum' ? pendulumPeriod(v.length, v.angle, g) : springPeriod(v.mass, v.stiffness));
  const formulaOf = (v) => (mode === 'pendulum' ? 2 * Math.PI * Math.sqrt(v.length / g) : springPeriod(v.mass, v.stiffness));

  /** Position and velocity sampled every 1/60 s over the timed window. */
  function simulate() {
    const key = keys.map((k2) => set[k2]).join('|');
    if (cache && cache.key === key) return cache;
    const n = Math.round(windowS * 60);
    const pos = new Float64Array(n + 1);
    const vel = new Float64Array(n + 1);
    if (mode === 'pendulum') {
      const w2 = g / set.length;
      let th = set.angle * D2R;
      let om = 0;
      pos[0] = th;
      for (let i = 1; i <= n; i++) {
        for (let j = 0; j < 4; j++) {
          const k1t = om;                    const k1o = -w2 * Math.sin(th);
          const k2t = om + 0.5 * DT * k1o;   const k2o = -w2 * Math.sin(th + 0.5 * DT * k1t);
          const k3t = om + 0.5 * DT * k2o;   const k3o = -w2 * Math.sin(th + 0.5 * DT * k2t);
          const k4t = om + DT * k3o;         const k4o = -w2 * Math.sin(th + DT * k3t);
          th += (DT / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
          om += (DT / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);
        }
        pos[i] = th;
        vel[i] = om;
      }
    } else {
      const T = springPeriod(set.mass, set.stiffness);
      const A = set.pull / 100;
      for (let i = 0; i <= n; i++) {
        const ph = (2 * Math.PI * (i / 60)) / T;
        pos[i] = A * Math.cos(ph);
        vel[i] = -A * ((2 * Math.PI) / T) * Math.sin(ph);
      }
    }
    cache = { key, pos, vel, n, period: periodOf(set), amp: mode === 'pendulum' ? set.angle * D2R : set.pull / 100 };
    return cache;
  }

  /* ------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || (mode === 'pendulum' ? 'A pendulum and its position–time graph' : 'A mass on a spring and its position–time graph') });
  const { svg } = fr;
  const PX = 138;                 // centre line of the apparatus
  const PY = 26;                  // the support
  const maxLen = ranges.length ? ranges.length[1] : set.length;
  const kLen = mode === 'pendulum' ? Math.min(230 / Math.max(maxLen, 0.5), 250) : 300;   // px per metre

  svg.appendChild(s('line', { x1: PX - 62, x2: PX + 62, y1: PY - 6, y2: PY - 6, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
  const rest = s('line', { stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 6' });
  const gApp = s('g');
  svg.append(rest, gApp);

  // the graph panel
  const gMid = (GY0 + GY1) / 2;
  const tx = (sec) => GX0 + (sec / windowS) * (GX1 - GX0);
  svg.appendChild(s('line', { x1: GX0, x2: GX0, y1: GY0 - 8, y2: GY1 + 8, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: GX0, x2: GX1 + 6, y1: gMid, y2: gMid, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  for (let sec = 1; sec <= windowS + 1e-9; sec++) {
    svg.appendChild(s('line', { x1: tx(sec), x2: tx(sec), y1: gMid - 4, y2: gMid + 4, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x: tx(sec), y: GY1 + 24, 'text-anchor': 'middle' }, sec === Math.round(windowS) ? `${sec} s` : String(sec)));
    svg.appendChild(s('line.grid-line', { x1: tx(sec), x2: tx(sec), y1: GY0 - 4, y2: GY1 + 4 }));
  }
  svg.appendChild(s('text.axis-label', { x: GX0 - 12, y: gMid, 'text-anchor': 'middle', transform: `rotate(-90 ${GX0 - 12} ${gMid})` }, 'position'));
  svg.appendChild(s('text.tick-label', { x: GX0 - 6, y: GY0 + 4, 'text-anchor': 'end' }, mode === 'pendulum' ? 'right' : 'up'));
  svg.appendChild(s('text.tick-label', { x: GX0 - 6, y: GY1 + 2, 'text-anchor': 'end' }, mode === 'pendulum' ? 'left' : 'down'));
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const gMarks = s('g');
  const dot = s('circle', { r: 6, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  svg.append(curve, gMarks, dot);

  /* ------------------------------------------------------------ controls */
  const roPeriod = readout('period', { color: 'blue' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  const bars = {};
  let logEl = null;
  let scrubRow = null;
  let scrubbed = false;          // the learner has moved the time slider
  let goBtn = null;
  let resetBtn = null;
  const changed = () => { anim.stop(); ran = false; t = 0; if (scrubRow) scrubRow.set(0); note.textContent = ''; render(); };

  if (showBars) {
    const wrap = h('div.pl-bars', { role: 'group', 'aria-label': 'Energy bars' });
    const row = (key, label, parts) => {
      const fills = parts.map((cls) => h('i', { class: cls }));
      const value = h('span');
      wrap.appendChild(h('div.pl-row', h('span', parts.length === 1 ? h('span', { class: `pl-key ${parts[0]}` }) : null, label), h('div.pl-bar', fills), value));
      bars[key] = { fills, value };
    };
    row('ke', 'Kinetic', ['pl-ke']);
    row('pe', 'Potential', ['pl-pe']);
    row('total', 'Total', ['pl-ke', 'pl-pe']);
    fr.el.insertBefore(wrap, fr.controls);
  }
  if (!isStatic) {
    fr.readouts.appendChild(roPeriod.el);
    for (const key of keys) {
      if (!ranges[key]) continue;
      const [lo, hi, st] = ranges[key];
      set[key] = clamp(set[key], lo, hi);
      sliders[key] = sliderRow({ label: meta[key].label, min: lo, max: hi, step: st || 1, value: set[key], color: meta[key].color, unit: meta[key].unit, onInput: (v) => { if (readOnly) return; set[key] = v; changed(); env.onChange(getState()); } });
      fr.controls.appendChild(sliders[key].el);
    }
    if (scrub) {
      scrubRow = sliderRow({ label: 'time', min: 0, max: windowS, step: 0.05, value: 0, color: 'blue', unit: 's', onInput: (v) => { if (readOnly) return; anim.stop(); t = v; ran = true; scrubbed = true; note.textContent = ''; render(); env.onChange(getState()); } });
      fr.controls.appendChild(scrubRow.el);
    }
    goBtn = button('Release', () => go(true), { icon: 'play', variant: 'primary' });
    resetBtn = button('Clear', () => {
      if (readOnly) return;
      history = [];
      changed();
      env.onChange(getState());
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(goBtn);
    if (showLog) fr.buttons.appendChild(resetBtn);
    if (showLog) {
      logEl = h('div.pl-log', { role: 'group', 'aria-label': 'Runs so far' });
      fr.el.appendChild(logEl);
    }
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    t = Math.min(windowS, t + dt);
    if (t >= windowS - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  const secs = (v) => `${formatNumber(v, 2)} s`;
  function describe() {
    const T = periodOf(set);
    return `One full swing takes ${secs(T)}.`;
  }
  const runLabel = (run) => keys.filter((key) => ranges[key]).map((key) => `${formatNumber(run[key], 2)}${meta[key].unit === '°' ? '°' : ` ${meta[key].unit}`}`).join(' · ');

  function finish(notify) {
    ran = true;
    t = windowS;
    render();
    note.textContent = describe();
    if (notify) {
      play('tick');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function go(count) {
    if (count && readOnly) return;
    anim.stop();
    t = 0;
    ran = true;
    note.textContent = '';
    if (count) {
      const run = { ...set, period: tidy(periodOf(set), 4) };
      const last = history[history.length - 1];
      if (!last || keys.some((key) => last[key] !== run[key])) history.push(run);
    }
    if (reducedMotion()) { finish(count); return; }
    notifyAtEnd = count;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function spring(x, y0, y1) {
    const coils = 9;
    const lead = 8;
    let d = `M${x} ${y0}V${y0 + lead}`;
    const span = y1 - y0 - 2 * lead;
    for (let i = 0; i < coils * 2; i++) d += `L${x + (i % 2 ? -12 : 12)} ${(y0 + lead + ((i + 0.5) / (coils * 2)) * span).toFixed(1)}`;
    return `${d}L${x} ${(y1 - lead).toFixed(1)}V${y1.toFixed(1)}`;
  }

  function render() {
    const run = simulate();
    const active = anim.running || ran;
    const now = active ? (isStatic ? windowS : t) : 0;
    const i = clamp(Math.round(now * 60), 0, run.n);
    // while the run is on screen the apparatus follows the clock (or the time slider); at rest it is shown at the release point
    const shown = anim.running || scrub ? i : 0;
    if (scrubRow) scrubRow.set(Math.round(now * 20) / 20);
    const x = run.pos[shown];
    clear(gApp);

    let pe = 0;
    let ke = 0;
    let total = 0;
    if (mode === 'pendulum') {
      const len = set.length * kLen;
      const bx = PX + len * Math.sin(x);
      const by = PY + len * Math.cos(x);
      // a heavier bob is drawn bigger, but never so big that it swamps a short string
      const rBob = Math.min(9 + 8 * Math.sqrt(set.mass / (ranges.mass ? ranges.mass[1] : Math.max(set.mass, 1))), Math.max(9, len * 0.3));
      rest.setAttribute('x1', PX); rest.setAttribute('x2', PX); rest.setAttribute('y1', PY); rest.setAttribute('y2', Math.min(H - 8, PY + len + 26));
      gApp.appendChild(s('line', { x1: PX, y1: PY - 4, x2: bx, y2: by, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      gApp.appendChild(s('circle', { cx: PX, cy: PY - 4, r: 4, fill: 'var(--ink)' }));
      gApp.appendChild(s('circle', { cx: bx, cy: by, r: rBob, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      if (!anim.running) gApp.appendChild(s('text.fig-label-sm', { x: PX + (len * Math.sin(x)) / 2 + 12, y: PY + (len * Math.cos(x)) / 2, 'text-anchor': 'start' }, `${formatNumber(set.length, 2)} m`));
      total = set.mass * g * set.length * (1 - Math.cos(set.angle * D2R));
      pe = set.mass * g * set.length * (1 - Math.cos(x));
      ke = Math.max(0, total - pe);
    } else {
      const natural = 0.2;
      const stretch = (set.mass * g) / set.stiffness;            // where the mass hangs at rest
      const eqY = PY - 6 + (natural + stretch) * kLen;
      const y = eqY + x * kLen;
      const side = 17 + 12 * Math.sqrt(set.mass / (ranges.mass ? ranges.mass[1] : set.mass));
      rest.setAttribute('x1', PX - 70); rest.setAttribute('x2', PX + 70); rest.setAttribute('y1', eqY + side / 2); rest.setAttribute('y2', eqY + side / 2);
      gApp.appendChild(s('path', { d: spring(PX, PY - 6, y), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      gApp.appendChild(s('rect', { x: PX - side / 2, y, width: side, height: side, rx: 5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gApp.appendChild(s('text.fig-label-sm', { x: PX + 76, y: eqY + side / 2 + 4, 'text-anchor': 'start' }, 'rest'));
    }

    // the graph: drawn as far as the clock has got
    const gy = (val) => gMid - (val / run.amp) * ((GY1 - GY0) / 2 - 8) * (mode === 'spring' ? -1 : 1);
    let d = '';
    for (let j = 0; j <= i; j++) d += `${j ? 'L' : 'M'}${tx(j / 60).toFixed(1)} ${gy(run.pos[j]).toFixed(1)}`;
    curve.setAttribute('d', now > 0 ? d : '');
    dot.setAttribute('cx', tx(i / 60));
    dot.setAttribute('cy', gy(run.pos[i]));
    dot.setAttribute('visibility', now > 0 && (anim.running || scrub) ? 'visible' : 'hidden');
    clear(gMarks);
    const T = run.period;
    if (now >= T && T < windowS) {
      // the release-side extremes are one period apart; a bracket over the first period says how long that is
      const yPeak = gy(run.amp);
      const yb = GY0 - 8;
      for (let n = 0; n * T <= now + 1e-9; n++) gMarks.appendChild(s('circle', { cx: tx(n * T), cy: yPeak, r: 4.5, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      for (const x0 of [tx(0) + 2, tx(T)]) gMarks.appendChild(s('line', { x1: x0, x2: x0, y1: yb, y2: yPeak, stroke: hue('blue'), 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }));
      gMarks.appendChild(s('path', { d: `M${tx(0) + 2} ${yb}H${tx(T)}M${tx(0) + 2} ${yb - 5}V${yb + 5}M${tx(T)} ${yb - 5}V${yb + 5}`, fill: 'none', stroke: hue('blue'), 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      gMarks.appendChild(s('text.pl-period', { x: clamp((tx(0) + tx(T)) / 2, GX0 + 44, GX1 - 40), y: yb - 9, 'text-anchor': 'middle' }, `period ${secs(T)}`));
    }

    const done = ran && !anim.running;
    roPeriod.set(done || now >= T ? secs(T) : '—');
    if (showBars) {
      const scale = (ranges.mass ? ranges.mass[1] : set.mass) * g * (ranges.length ? ranges.length[1] : set.length) * (1 - Math.cos((ranges.angle ? ranges.angle[1] : set.angle) * D2R));
      const pct = (val) => `${clamp((val / scale) * 100, 0, 100).toFixed(2)}%`;
      const joules = (val) => `${formatNumber(val, 2)} J`;
      bars.ke.fills[0].style.width = pct(ke); bars.ke.value.textContent = joules(ke);
      bars.pe.fills[0].style.width = pct(pe); bars.pe.value.textContent = joules(pe);
      bars.total.fills[0].style.width = pct(ke); bars.total.fills[1].style.width = pct(pe); bars.total.value.textContent = joules(total);
    }
    if (logEl) {
      clear(logEl);
      if (!history.length) logEl.appendChild(h('span.pl-empty', 'Each run is listed here.'));
      history.slice(-4).forEach((r) => {
        const isNow = keys.every((key) => r[key] === set[key]);
        logEl.appendChild(h('span', { class: `pl-run${isNow ? ' is-now' : ''}` }, `${runLabel(r)} → `, h('b', secs(r.period))));
      });
    }
    if (goBtn) { goBtn.lastChild.textContent = done ? 'Release again' : 'Release'; goBtn.disabled = readOnly; }
    if (resetBtn) resetBtn.disabled = readOnly || !history.length;
    if (!isStatic) {
      const settings = keys.map((key) => `${meta[key].label} ${formatNumber(set[key], 2)} ${meta[key].unit}`).join(', ');
      svg.setAttribute('aria-label', `${spec.alt || (mode === 'pendulum' ? 'A pendulum and its position–time graph' : 'A mass on a spring and its position–time graph')}. Settings: ${settings}.${done ? ` ${describe()}` : ''}`);
    }
  }

  function getState() {
    const T = periodOf(set);
    return {
      mode,
      ...set,
      period: tidy(T, 4),
      formula: tidy(formulaOf(set), 4),
      frequency: tidy(1 / T, 4),
      ran,
      time: tidy(t, 2),
      scrubbed,
      runs: history.length,
      history: history.map((r) => ({ ...r })),
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      for (const key of keys) {
        if (typeof next[key] !== 'number') continue;
        set[key] = ranges[key] ? clamp(next[key], ranges[key][0], ranges[key][1]) : next[key];
        if (sliders[key]) sliders[key].set(set[key]);
      }
      if (Array.isArray(next.history)) {
        history = next.history.map((r) => { const run = {}; for (const key of keys) run[key] = r[key] != null ? r[key] : initial[key]; run.period = tidy(periodOf(run), 4); return run; });
      }
      if (next.ran === false) { ran = false; t = 0; render(); return; }
      if (isStatic) { render(); return; }
      if (scrub && typeof next.time === 'number') { t = clamp(next.time, 0, windowS); ran = true; scrubbed = true; scrubRow.set(t); render(); return; }
      const last = history[history.length - 1];
      if (!last || keys.some((key) => last[key] !== set[key])) history.push({ ...set, period: tidy(periodOf(set), 4) });
      finish(false);
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'pendulum-lab — what sets the period of a pendulum?', spec: { type: 'pendulum-lab', length: 1, mass: 1, angle: 5, lengthRange: [0.2, 2, 0.2], massRange: [0.5, 2, 0.5], angleRange: [5, 40, 5] } },
  { title: 'pendulum-lab — a mass on a spring', spec: { type: 'pendulum-lab', mode: 'spring', mass: 0.4, stiffness: 10, pull: 6, massRange: [0.1, 0.4, 0.1], stiffnessRange: [10, 40, 10], pullRange: [2, 10, 2] } },
  { title: 'pendulum-lab — energy swaps back and forth', spec: { type: 'pendulum-lab', length: 1, mass: 1, angle: 30, bars: true } },
];
