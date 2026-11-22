/**
 * immune-response — the body meets a microbe for the first time, and then,
 * months later, meets either the same microbe again or a different one. Two
 * four-week panels show the number of microbes in the body, the days of
 * illness, and the level of antibodies against that microbe. The first
 * response is slow and modest; a second meeting with the SAME microbe is met
 * by memory cells: sooner, faster and far stronger, often with no illness at
 * all. A different microbe gets the slow first response all over again.
 *
 * {
 *   type: 'immune-response',
 *   second: ['same', 'different'],   // what the learner may choose for the second meeting ([] for the first meeting only)
 *   exposures: [],                   // meetings already run at the start: [] | ['first'] | ['first', 'same'] | ['first', 'different']
 *   static: false,
 * }
 *
 * State: { exposures, first, second, count, sawSame, sawDifferent }
 *   exposures  what has been run so far, e.g. ['first', 'same']
 *   first, second   facts about each meeting (null until run):
 *       { kind, lag, peakDay, peak, illDays }
 *       lag      days from the meeting until antibodies reach a tenth of their peak
 *       peakDay  day on which antibodies peak
 *       peak     that peak, as a multiple of the first response's peak
 *       illDays  days on which there are enough microbes to cause symptoms
 *   count      meetings run
 *   sawSame, sawDifferent   the learner has, at some point, run each kind of second meeting
 *
 * setState({ exposures, sawSame, sawDifferent }).
 *
 * The curves (responseCurves, exported) are typical textbook shapes, not a simulation of any one disease: a first
 * response with a lag of about five days and a peak around day 12; a memory response that starts within about two
 * days and peaks some twenty times higher around day 6. Real infections differ widely in timing, and real
 * protection also depends on killer T cells and on how much the microbe has changed. The antibody axis is
 * stretched: each step up is ten times more.
 */
import { frame, button, readout, loop, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const sig = (x) => 1 / (1 + Math.exp(-x));
export const DAYS = 28;
export const ILL_AT = 0.15;       // microbes above this share of their peak cause symptoms

/** Antibody level (× the first peak) and microbes (share of the first peak) on day d after a meeting. */
export function responseCurves(kind, d) {
  if (d < 0) return { antibody: 0, microbes: 0 };
  if (kind === 'memory') {
    return {
      antibody: 20 * sig((d - 3.5) / 0.8) * (0.15 + 0.85 * Math.exp(-Math.max(0, d - 6) / 25)),
      microbes: 0.16 * sig(2 * (d - 1.5)) * (1 - sig((d - 3) / 0.5)),
    };
  }
  return {
    antibody: sig((d - 8) / 1.2) * (0.1 + 0.9 * Math.exp(-Math.max(0, d - 12) / 9)),
    microbes: sig(1.4 * (d - 5)) * (1 - sig((d - 9.5) / 0.9)),
  };
}

/** The facts the state reports for one meeting. */
export function describeResponse(kind) {
  let peak = 0;
  let peakDay = 0;
  let ill = 0;
  for (let d = 0; d <= DAYS; d += 0.25) {
    const c = responseCurves(kind, d);
    if (c.antibody > peak) { peak = c.antibody; peakDay = d; }
    if (c.microbes > ILL_AT) ill += 0.25;
  }
  let lag = 0;
  for (let d = 0; d <= DAYS; d += 0.05) if (responseCurves(kind, d).antibody >= peak / 10) { lag = d; break; }
  const firstPeak = kind === 'memory' ? describeResponse('first').rawPeak : peak;
  return { lag: Math.round(lag), peakDay: Math.round(peakDay), peak: Math.round((peak / firstPeak) * 10) / 10, illDays: Math.round(ill), rawPeak: peak };
}

const W = 560;
const H = 330;
const PANELS = [{ x0: 46, x1: 258 }, { x0: 306, x1: 518 }];
const MY0 = 30;      // microbes panel
const MY1 = 118;
const AY0 = 160;     // antibody panel
const AY1 = 286;
const LOG_MIN = -1.3;   // 0.05×
const LOG_MAX = 1.7;    // 50×

addStyles('immune-response', `
  .widget-immune-response .ir-ill { fill: var(--red-soft); }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const offered = Array.isArray(spec.second) ? spec.second.filter((k) => k === 'same' || k === 'different') : ['same', 'different'];
  let exposures = [];
  let readOnly = !!env.readOnly;
  let progress = [0, 0];       // days drawn in each panel
  let sawSame = false;
  let sawDifferent = false;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Graphs of microbes and antibodies after a first and a second meeting with a microbe' });
  const { svg } = fr;
  const px = (panel, d) => PANELS[panel].x0 + (d / DAYS) * (PANELS[panel].x1 - PANELS[panel].x0);
  const my = (v) => MY1 - Math.min(v, 1.05) * (MY1 - MY0) * 0.92;
  const ay = (v) => AY1 - ((Math.log10(Math.max(v, 10 ** LOG_MIN)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (AY1 - AY0);

  // fixed parts
  PANELS.forEach((p, i) => {
    for (const [y0, y1] of [[MY0, MY1], [AY0, AY1]]) {
      svg.appendChild(s('line', { x1: p.x0, x2: p.x0, y1: y0, y2: y1, stroke: 'var(--ink)', 'stroke-width': 2 }));
      svg.appendChild(s('line', { x1: p.x0, x2: p.x1, y1, y2: y1, stroke: 'var(--ink)', 'stroke-width': 2 }));
    }
    for (const mult of [0.1, 1, 10]) svg.appendChild(s('line.grid-line', { x1: p.x0, x2: p.x1, y1: ay(mult), y2: ay(mult) }));
    for (let wk = 0; wk <= 4; wk++) {
      svg.appendChild(s('line', { x1: px(i, wk * 7), x2: px(i, wk * 7), y1: AY1, y2: AY1 + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
      svg.appendChild(s('text.tick-label', { x: px(i, wk * 7), y: AY1 + 20, 'text-anchor': 'middle' }, wk === 4 ? '4 weeks' : String(wk)));
    }
    svg.appendChild(s('text.fig-label-sm', { x: (p.x0 + p.x1) / 2, y: 14, 'text-anchor': 'middle' }, i === 0 ? 'First meeting' : 'Months later'));
  });
  for (const [mult, text] of [[0.1, '÷10'], [1, '1×'], [10, '10×']]) svg.appendChild(s('text.tick-label', { x: PANELS[0].x0 - 6, y: ay(mult) + 4, 'text-anchor': 'end' }, text));
  svg.appendChild(s('text.axis-label', { x: PANELS[0].x0 + 6, y: MY0 + 2 }, 'microbes in the body'));
  svg.appendChild(s('text.axis-label', { x: PANELS[0].x0 + 6, y: AY0 - 6 }, 'antibodies'));
  svg.appendChild(s('path', { d: `M${PANELS[0].x1 + 14} ${AY1 + 8} l8 -16 M${PANELS[0].x1 + 24} ${AY1 + 8} l8 -16`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));

  const gDyn = s('g');
  svg.appendChild(gDyn);

  const roLag = readout('antibodies appear', { color: 'blue' });
  const roPeak = readout('peak', { color: 'blue' });
  const roIll = readout('days ill', { color: 'red' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const btns = {};

  const kindOf = (i) => (i === 1 && exposures[1] === 'same' ? 'memory' : 'first');
  const facts = (i) => {
    if (exposures.length <= i) return null;
    const f = describeResponse(kindOf(i));
    return { kind: i === 0 ? 'first' : exposures[1], lag: f.lag, peakDay: f.peakDay, peak: f.peak, illDays: f.illDays };
  };
  const getState = () => ({ exposures: exposures.slice(), first: facts(0), second: facts(1), count: exposures.length, sawSame, sawDifferent });

  function sentence(i) {
    const f = facts(i);
    if (!f) return '';
    const who = i === 0 ? 'First meeting' : exposures[1] === 'same' ? 'Same microbe again' : 'A different microbe';
    return `${who}: antibodies appear after about ${f.lag} day${f.lag === 1 ? '' : 's'} and peak on day ${f.peakDay} at ${f.peak} times the first peak; ${f.illDays ? `ill for about ${f.illDays} days` : 'no illness'}.`;
  }

  function render() {
    gDyn.replaceChildren();
    for (let i = 0; i < exposures.length; i++) {
      const kind = kindOf(i);
      const to = progress[i];
      const different = i === 1 && exposures[1] === 'different';
      // days of illness
      let from = null;
      for (let d = 0; d <= to + 1e-9; d += 0.25) {
        const ill = responseCurves(kind, d).microbes > ILL_AT;
        if (ill && from == null) from = d;
        if ((!ill || d + 0.25 > to) && from != null) {
          gDyn.appendChild(s('rect.ir-ill', { x: px(i, from), y: MY0 + 8, width: Math.max(0, px(i, d) - px(i, from)), height: MY1 - MY0 - 8 }));
          if (!ill || to >= DAYS) gDyn.appendChild(s('text.fig-label-sm', { x: px(i, d) + 6, y: MY0 + 26, 'text-anchor': 'start', class: 'text-red' }, `ill: about ${Math.round(d - from)} days`));
          from = null;
          if (!ill) break;
        }
      }
      let dm = '';
      let da = '';
      for (let d = 0; d <= to + 1e-9; d += 0.25) {
        const c = responseCurves(kind, d);
        dm += `${d ? 'L' : 'M'}${px(i, d).toFixed(1)} ${my(c.microbes).toFixed(1)}`;
        da += `${d ? 'L' : 'M'}${px(i, d).toFixed(1)} ${ay(c.antibody).toFixed(1)}`;
      }
      gDyn.appendChild(s('path', { d: `${dm}L${px(i, to).toFixed(1)} ${MY1}L${px(i, 0)} ${MY1}Z`, fill: hue(different ? 'orange' : 'red'), opacity: 0.35 }));
      gDyn.appendChild(s('path', { d: dm, fill: 'none', stroke: hue(different ? 'orange' : 'red'), 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      gDyn.appendChild(s('path', { d: da, fill: 'none', stroke: hue(different ? 'teal' : 'blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': different ? '8 5' : null }));
      if (to >= DAYS) {
        const f = describeResponse(kind);
        gDyn.appendChild(s('text.fig-label-sm', { x: px(i, Math.min(f.peakDay + 1, 20)), y: ay(f.rawPeak) - 8, 'text-anchor': 'start', class: different ? 'text-teal' : 'text-blue' }, different ? 'against microbe B' : 'against microbe A'));
      }
    }
    if (exposures[1] === 'different' && progress[1] > 0) {
      // the memory of microbe A is still there, but it does not help against B
      gDyn.appendChild(s('text.tick-label', { x: PANELS[1].x1 - 4, y: AY0 + 4, 'text-anchor': 'end' }, 'memory of A is no use against B'));
    }
    if (!exposures.length) gDyn.appendChild(s('text.fig-label', { x: (PANELS[0].x0 + PANELS[0].x1) / 2, y: (AY0 + AY1) / 2, 'text-anchor': 'middle' }, 'Not met yet'));

    const last = exposures.length - 1;
    const f = last >= 0 && progress[last] >= DAYS ? facts(last) : null;
    roLag.set(f ? `after ${f.lag} day${f.lag === 1 ? '' : 's'}` : '—');
    roPeak.set(f ? `${f.peak}× on day ${f.peakDay}` : '—');
    roIll.set(f ? String(f.illDays) : '—');
    if (btns.first) { btns.first.disabled = readOnly || exposures.length > 0; btns.first.hidden = exposures.length > 0; }
    for (const k of ['same', 'different']) if (btns[k]) { btns[k].hidden = exposures.length === 0; btns[k].disabled = readOnly || anim.running; }
    if (btns.reset) { btns.reset.hidden = exposures.length === 0; btns.reset.disabled = readOnly; }
    svg.setAttribute('aria-label', `${spec.alt || 'Graphs of microbes and antibodies after a first and a second meeting with a microbe'}. ${exposures.length ? [0, 1].map(sentence).filter(Boolean).join(' ') : 'Nothing has been run yet.'}`);
  }

  let active = 0;
  const anim = loop((dt) => {
    progress[active] = Math.min(DAYS, progress[active] + dt * 9);
    if (progress[active] >= DAYS) { anim.stop(); done(true); return; }
    render();
  });

  function done(notify) {
    progress = progress.map((p, i) => (i < exposures.length ? DAYS : 0));
    render();
    note.textContent = sentence(exposures.length - 1);
    if (notify) { play('tick'); env.announce(note.textContent); env.onChange(getState()); }
  }

  function run(kind) {
    if (readOnly) return;
    anim.stop();
    if (kind === 'first') { exposures = ['first']; progress = [0, 0]; active = 0; }
    else { exposures = ['first', kind]; progress = [DAYS, 0]; active = 1; if (kind === 'same') sawSame = true; else sawDifferent = true; }
    note.textContent = '';
    if (reducedMotion()) { done(true); return; }
    anim.start();
    render();
  }

  if (!isStatic) {
    fr.readouts.append(roLag.el, roPeak.el, roIll.el);
    btns.first = button('Meet microbe A', () => run('first'), { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(btns.first);
    if (offered.includes('same')) { btns.same = button('Months later: A again', () => run('same'), { icon: 'play', variant: 'primary' }); fr.buttons.appendChild(btns.same); }
    if (offered.includes('different')) { btns.different = button('Months later: a new microbe, B', () => run('different'), { icon: 'play' }); fr.buttons.appendChild(btns.different); }
    btns.reset = button('Start again', () => { if (readOnly) return; anim.stop(); exposures = []; progress = [0, 0]; note.textContent = ''; render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(btns.reset);
    fr.el.appendChild(note);
  }

  function restore(list) {
    exposures = [];
    if (Array.isArray(list) && list[0] === 'first') {
      exposures = ['first'];
      if (list[1] === 'same' || list[1] === 'different') { exposures.push(list[1]); if (list[1] === 'same') sawSame = true; else sawDifferent = true; }
    }
    progress = [exposures.length > 0 ? DAYS : 0, exposures.length > 1 ? DAYS : 0];
  }

  restore(spec.exposures);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (Array.isArray(next.exposures)) restore(next.exposures);
      if (next.sawSame) sawSame = true;
      if (next.sawDifferent) sawDifferent = true;
      render();
      note.textContent = sentence(exposures.length - 1);
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'immune-response — first and second meeting', spec: { type: 'immune-response' } },
  { title: 'immune-response — the memory response (finished picture)', spec: { type: 'immune-response', exposures: ['first', 'same'], static: true } },
];
