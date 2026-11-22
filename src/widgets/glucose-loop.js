/**
 * glucose-loop — blood glucose and insulin over five hours, with a meal after
 * half an hour. A feedback loop in action: glucose rises, the pancreas answers
 * with insulin, cells take glucose up, the level falls back, insulin follows
 * it down. The learner can break the loop in two ways (no insulin is made; the
 * cells respond only weakly to it) and, where the spec allows, give insulin by
 * injection, and compare each run with the one before.
 *
 * {
 *   type: 'glucose-loop',
 *   condition: 'normal',                         // 'normal' | 'none' (no insulin is made) | 'resistant' (cells respond weakly)
 *   conditions: ['normal', 'none', 'resistant'], // which of them the learner may choose (one: no chooser)
 *   treated: false,                              // insulin is given by injection (a steady background amount and a dose with the meal)
 *   treatToggle: false,                          // show the switch for it (it only has an effect with 'none')
 *   insulin: true,                               // draw the insulin panel under the glucose graph
 *   static: false,                               // true: a finished picture, no controls
 * }
 *
 * State: { condition, treated, ran, start, peak, peakAt, final, backAt, insulinPeak, spills, runs, seen }
 *   ran          the current setting has been run ("Eat a meal")
 *   start        fasting glucose before the meal, mmol/L
 *   peak, peakAt highest glucose after the meal (mmol/L) and when (minutes after the meal)
 *   final        glucose at the end of the five hours
 *   backAt       minutes after the meal at which glucose is back within 0.5 mmol/L of where it started (null: not within the time shown)
 *   insulinPeak  highest insulin level, as a multiple of a healthy fasting level
 *   spills       glucose rose above about 10 mmol/L, where the kidneys start to lose it into the urine
 *   runs         every distinct setting that has been run: { condition, treated, peak, backAt, insulinPeak }
 *   seen         the conditions among them
 * The numbers describe the current setting whether or not it has been run yet.
 *
 * setState({ condition, treated, runs }) shows that setting as a finished run; `runs` may list earlier ones by
 * { condition, treated } alone.
 *
 * The model (simulateGlucose, exported) is a teaching model, in steps of one minute:
 *   insulin is made in proportion to how far glucose is above 5 mmol/L, with a lag of about ten minutes;
 *   cells take glucose up partly without insulin (the brain) and partly in proportion to insulin × sensitivity;
 *   the liver releases glucose when insulin is low and more when glucose falls below 4.5 (the work of glucagon);
 *   above 10 mmol/L the kidneys lose glucose into the urine.
 * It leaves out a great deal (other hormones, the size and kind of meal, exercise, how injected insulin is really
 * timed), and its numbers are typical shapes, not predictions for any person. 1 mmol/L of glucose is 18 mg/dL.
 */
import { frame, button, readout, loop, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const KINDS = { normal: { beta: 1, sens: 1 }, none: { beta: 0, sens: 1 }, resistant: { beta: 1, sens: 0.35 } };
const NAMES = { normal: 'Insulin working', none: 'No insulin made', resistant: 'Cells respond weakly' };
export const MEAL_AT = 30;
export const MINUTES = 300;
export const MGDL = 18;

/** One run of the model: an array of { t, G, I } for every minute, glucose in mmol/L, insulin in multiples of a healthy fasting level. */
export function simulateGlucose({ condition = 'normal', treated = false } = {}) {
  const c = KINDS[condition] || KINDS.normal;
  const basal = treated ? 1 : 0;
  let G = 5;
  let I = c.beta;
  const step = (ra, given) => {
    I += (c.beta * Math.max(0, 1 + (G - 5)) - I) / 10;
    const X = c.sens * (I + given);
    const liver = Math.min(0.1, Math.max(0, 0.05 * (2 - X))) + (G < 4.5 ? 0.03 * (4.5 - G) : 0);
    const uptake = 0.004 * G + 0.006 * X * G;
    const kidney = G > 10 ? 0.01 * (G - 10) : 0;
    G += ra + liver - uptake - kidney;
  };
  for (let i = 0; i < 3000; i++) step(0, basal);          // settle at this body's fasting level
  const out = [];
  for (let t = 0; t <= MINUTES; t++) {
    const m = t - MEAL_AT;
    const ra = m > 0 ? 0.18 * (m / 30) * Math.exp(1 - m / 30) : 0;
    const dose = treated && m > 0 ? 1.2 * (m / 45) * Math.exp(1 - m / 45) : 0;
    out.push({ t, G, I: I + basal + dose });
    step(ra, basal + dose);
  }
  return out;
}

/** The facts of a run that the state reports. */
export function describeRun(run) {
  const start = run[0].G;
  let peak = run[0];
  let top = 0;
  for (const p of run) { if (p.G > peak.G) peak = p; if (p.I > top) top = p.I; }
  const back = run.find((p) => p.t > peak.t && Math.abs(p.G - start) < 0.5);
  const r1 = (v) => Math.round(v * 10) / 10;
  return {
    start: r1(start), peak: r1(peak.G), peakAt: peak.t - MEAL_AT, final: r1(run[run.length - 1].G),
    backAt: back && peak.G - start >= 0.5 ? back.t - MEAL_AT : null, insulinPeak: r1(top), spills: peak.G > 10,
  };
}

const W = 560;
const H = 340;
const X0 = 52;
const X1 = 508;
const GY0 = 22;       // glucose panel
const GY1 = 212;
const IY0 = 246;      // insulin panel
const IY1 = 306;
const GMAX = 22;
const IMAX = 7;

addStyles('glucose-loop', `
  .widget-glucose-loop .gl-pick { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-glucose-loop .gl-opt { min-height: 40px; padding: 6px 12px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
  .widget-glucose-loop .gl-opt[aria-checked="true"] { background: var(--blue-soft); border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); }
  .widget-glucose-loop .gl-opt:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-glucose-loop .gl-opt:disabled { cursor: default; opacity: 0.75; }
  .widget-glucose-loop .gl-switch { display: flex; align-items: center; justify-content: center; gap: var(--s2); font-weight: 700; font-size: var(--fs-sm); min-height: 40px; }
  .widget-glucose-loop .gl-switch input { width: 22px; height: 22px; accent-color: var(--violet); }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const offered = (Array.isArray(spec.conditions) && spec.conditions.length ? spec.conditions : ['normal', 'none', 'resistant']).filter((k) => KINDS[k]);
  let condition = KINDS[spec.condition] ? spec.condition : offered[0];
  let treated = !!spec.treated;
  let readOnly = !!env.readOnly;
  let ran = isStatic;
  let shownTo = isStatic ? MINUTES : 0;     // minutes of the current run that are drawn
  let ghost = null;                         // the run before this one, drawn in grey
  let runs = [];
  const showInsulin = spec.insulin !== false;
  const bottom = showInsulin ? IY1 : GY1;

  const fr = frame({ width: W, height: showInsulin ? H : GY1 + 34, compact: env.compact, label: spec.alt || 'A graph of blood glucose and insulin over five hours' });
  const { svg } = fr;
  const tx = (min) => X0 + (min / MINUTES) * (X1 - X0);
  const gy = (g) => GY1 - (Math.min(g, GMAX) / GMAX) * (GY1 - GY0);
  const iy = (i) => IY1 - (Math.min(i, IMAX) / IMAX) * (IY1 - IY0);

  // the usual range, the kidney threshold, axes
  svg.appendChild(s('rect', { x: X0, y: gy(8), width: X1 - X0, height: gy(4) - gy(8), fill: hue('green', 'soft') }));
  svg.appendChild(s('text.tick-label', { x: X1 - 6, y: gy(8) - 3, 'text-anchor': 'end' }, 'shaded: usual range'));
  svg.appendChild(s('line', { x1: X0, x2: X1, y1: gy(10), y2: gy(10), stroke: hue('red'), 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }));
  svg.appendChild(s('text.tick-label', { x: X1 - 6, y: gy(10) - 5, 'text-anchor': 'end' }, 'above this line, glucose is lost in the urine'));
  for (const g of [0, 5, 10, 15, 20]) {
    svg.appendChild(s('text.tick-label', { x: X0 - 7, y: gy(g) + 4, 'text-anchor': 'end' }, String(g)));
    svg.appendChild(s('text.tick-label', { x: X1 + 7, y: gy(g) + 4, 'text-anchor': 'start' }, String(g * MGDL)));
    if (g) svg.appendChild(s('line.grid-line', { x1: X0, x2: X1, y1: gy(g), y2: gy(g) }));
  }
  svg.appendChild(s('text.axis-label', { x: X0 + 6, y: GY0 - 6 }, 'glucose, mmol/L'));
  svg.appendChild(s('text.axis-label', { x: X1, y: GY0 - 6, 'text-anchor': 'end' }, 'mg/dL'));
  svg.appendChild(s('line', { x1: X0, x2: X0, y1: GY0, y2: GY1, stroke: 'var(--ink)', 'stroke-width': 2 }));
  svg.appendChild(s('line', { x1: X0, x2: X1, y1: GY1, y2: GY1, stroke: 'var(--ink)', 'stroke-width': 2 }));
  if (showInsulin) {
    svg.appendChild(s('line', { x1: X0, x2: X0, y1: IY0, y2: IY1, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('line', { x1: X0, x2: X1, y1: IY1, y2: IY1, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.axis-label', { x: X0 + 6, y: IY0 - 4 }, 'insulin (dashed: healthy fasting level)'));
    svg.appendChild(s('line', { x1: X0, x2: X1, y1: iy(1), y2: iy(1), stroke: 'var(--hair)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }));
  }
  for (let hr = 0; hr <= 5; hr++) {
    svg.appendChild(s('line', { x1: tx(hr * 60), x2: tx(hr * 60), y1: bottom, y2: bottom + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x: tx(hr * 60), y: bottom + 20, 'text-anchor': 'middle' }, hr === 5 ? '5 h' : String(hr)));
  }
  // the meal
  svg.appendChild(s('line', { x1: tx(MEAL_AT), x2: tx(MEAL_AT), y1: GY0 + 6, y2: bottom, stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '2 5' }));
  svg.appendChild(s('text.fig-label-sm', { x: tx(MEAL_AT) + 6, y: GY0 + 16, 'text-anchor': 'start', class: 'text-orange' }, 'meal'));

  const ghostG = s('path', { fill: 'none', stroke: hue('gray'), 'stroke-width': 2.5, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' });
  const ghostI = s('path', { fill: 'none', stroke: hue('gray'), 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' });
  const ghostLabel = s('text.tick-label', { 'text-anchor': 'start' });
  const lineG = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const lineI = s('path', { fill: 'none', stroke: hue('violet'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const dot = s('circle', { r: 5.5, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2 });
  svg.append(ghostG, ghostI, ghostLabel, lineG, lineI, dot);

  const roPeak = readout('highest', { color: 'blue' });
  const roBack = readout('back to start', { color: 'green' });
  const roIns = readout('insulin peak', { color: 'violet' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const opts = {};
  let box = null;
  let boxWrap = null;
  let goBtn = null;

  let cache = null;
  const current = () => {
    const on = treated && condition === 'none';       // injected insulin only applies to the body that makes none
    const key = `${condition}|${on ? 1 : 0}`;
    if (!cache || cache.key !== key) { const run = simulateGlucose({ condition, treated: on }); cache = { key, run, facts: describeRun(run) }; }
    return cache;
  };
  const keyOf = (r) => `${r.condition}|${r.treated ? 1 : 0}`;

  function getState() {
    const { facts } = current();
    return { condition, treated: treated && condition === 'none', ran: ran && shownTo >= MINUTES, ...facts, runs: runs.map((r) => ({ ...r })), seen: [...new Set(runs.map((r) => r.condition))] };
  }

  const pathOf = (run, to, y, key) => {
    let d = '';
    for (let t = 0; t <= to; t += 2) d += `${t ? 'L' : 'M'}${tx(t).toFixed(1)} ${y(run[t][key]).toFixed(1)}`;
    return d;
  };
  const mins = (m) => (m == null ? 'not within 5 h' : m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`);
  function sentence() {
    const { facts } = current();
    return `Glucose started at ${facts.start}, peaked at ${facts.peak} mmol/L (${Math.round(facts.peak * MGDL)} mg/dL) and ${facts.backAt == null ? `was still at ${facts.final} after five hours` : `was back near its starting level ${mins(facts.backAt)} after the meal`}.`;
  }

  function render() {
    const { run, facts } = current();
    const to = Math.round(shownTo);
    lineG.setAttribute('d', ran ? pathOf(run, to, gy, 'G') : '');
    lineI.setAttribute('d', ran && showInsulin ? pathOf(run, to, iy, 'I') : '');
    dot.setAttribute('visibility', ran ? 'visible' : 'hidden');
    dot.setAttribute('cx', tx(ran ? to : 0));
    dot.setAttribute('cy', gy(run[ran ? to : 0].G));
    if (ghost) {
      ghostG.setAttribute('d', pathOf(ghost.run, MINUTES, gy, 'G'));
      ghostI.setAttribute('d', showInsulin ? pathOf(ghost.run, MINUTES, iy, 'I') : '');
      ghostLabel.textContent = `before: ${ghost.name.toLowerCase()}`;
      ghostLabel.setAttribute('x', X0 + 8);
      ghostLabel.setAttribute('y', GY1 - 8);
    } else { ghostG.setAttribute('d', ''); ghostI.setAttribute('d', ''); ghostLabel.textContent = ''; }
    const done = ran && shownTo >= MINUTES;
    roPeak.set(done ? `${facts.peak} mmol/L` : '—');
    roBack.set(done ? mins(facts.backAt) : '—');
    roIns.set(done ? `${facts.insulinPeak} × fasting` : '—');
    for (const k of offered) if (opts[k]) { opts[k].setAttribute('aria-checked', String(k === condition)); opts[k].disabled = readOnly; }
    if (boxWrap) boxWrap.style.visibility = condition === 'none' ? 'visible' : 'hidden';
    if (goBtn) goBtn.disabled = readOnly;
    svg.setAttribute('aria-label', `${spec.alt || 'A graph of blood glucose and insulin over five hours'}. Setting: ${NAMES[condition].toLowerCase()}${treated && condition === 'none' ? ', with insulin given by injection' : ''}. ${done ? sentence() : 'Not run yet.'}`);
  }

  const nameOf = () => `${NAMES[condition]}${treated && condition === 'none' ? ', insulin injected' : ''}`;
  function record() {
    const { facts } = current();
    const r = { condition, treated: treated && condition === 'none', peak: facts.peak, backAt: facts.backAt, insulinPeak: facts.insulinPeak };
    if (!runs.some((q) => keyOf(q) === keyOf(r))) runs.push(r);
  }

  const anim = loop((dt) => {
    shownTo = Math.min(MINUTES, shownTo + dt * 110);
    if (shownTo >= MINUTES) { anim.stop(); finish(true); return; }
    render();
  });

  function finish(notify) {
    shownTo = MINUTES;
    ran = true;
    record();
    render();
    note.textContent = sentence();
    if (notify) { play('tick'); env.announce(note.textContent); env.onChange(getState()); }
  }

  function reset() {
    anim.stop();
    if (ran && shownTo >= MINUTES) ghost = { run: current().run, name: nameOf() };
  }

  function go() {
    if (readOnly) return;
    anim.stop();
    ran = true;
    shownTo = 0;
    note.textContent = '';
    if (reducedMotion()) { finish(true); return; }
    render();
    anim.start();
  }

  function choose(k) {
    if (readOnly || k === condition) return;
    reset();
    condition = k;
    ran = false;
    shownTo = 0;
    note.textContent = '';
    play('select');
    render();
    env.onChange(getState());
  }

  if (!isStatic) {
    fr.readouts.append(roPeak.el, roBack.el, ...(showInsulin ? [roIns.el] : []));
    if (offered.length > 1) {
      const group = h('div.gl-pick', { role: 'radiogroup', 'aria-label': 'Which body is this?' });
      for (const k of offered) {
        opts[k] = h('button.gl-opt', { type: 'button', role: 'radio' }, (spec.labels && spec.labels[k]) || NAMES[k]);
        opts[k].dataset.keys = 'own';
        opts[k].addEventListener('click', () => choose(k));
        group.appendChild(opts[k]);
      }
      fr.controls.appendChild(group);
    }
    if (spec.treatToggle) {
      box = h('input', { type: 'checkbox', checked: treated });
      box.dataset.keys = 'own';
      box.addEventListener('change', () => {
        if (readOnly) { box.checked = treated; return; }
        reset();
        treated = box.checked;
        ran = false;
        shownTo = 0;
        note.textContent = '';
        render();
        env.onChange(getState());
      });
      boxWrap = h('label.gl-switch', box, 'give insulin by injection');
      fr.controls.appendChild(boxWrap);
    }
    goBtn = button('Eat a meal', go, { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(goBtn);
    fr.el.appendChild(note);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (Array.isArray(next.runs)) {
        runs = [];
        for (const r of next.runs) {
          if (!KINDS[r.condition]) continue;
          const facts = describeRun(simulateGlucose({ condition: r.condition, treated: !!r.treated && r.condition === 'none' }));
          const q = { condition: r.condition, treated: !!r.treated && r.condition === 'none', peak: facts.peak, backAt: facts.backAt, insulinPeak: facts.insulinPeak };
          if (!runs.some((p) => keyOf(p) === keyOf(q))) runs.push(q);
        }
      }
      if (KINDS[next.condition]) condition = next.condition;
      if (typeof next.treated === 'boolean') { treated = next.treated; if (box) box.checked = treated; }
      if (next.ran === false) { ran = false; shownTo = 0; render(); return; }
      // an earlier, different run is kept as the grey comparison line
      const now = keyOf({ condition, treated: treated && condition === 'none' });
      const before = runs.filter((r) => keyOf(r) !== now).pop();
      ghost = before ? { run: simulateGlucose(before), name: `${NAMES[before.condition]}${before.treated ? ', insulin injected' : ''}` } : null;
      finish(false);
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (box) box.disabled = readOnly;
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'glucose-loop — a meal, with the loop working', spec: { type: 'glucose-loop', conditions: ['normal'] } },
  { title: 'glucose-loop — break the loop', spec: { type: 'glucose-loop', conditions: ['normal', 'none', 'resistant'], treatToggle: true } },
  { title: 'glucose-loop — no insulin (finished picture)', spec: { type: 'glucose-loop', condition: 'none', static: true } },
];
