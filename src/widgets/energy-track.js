/**
 * energy-track — a ball rides a curved track while bars show its kinetic,
 * potential and thermal energy. Without friction the total never changes and
 * the ball can never climb above the height it was released from. With
 * friction, energy leaks steadily into heat.
 *
 * {
 *   type: 'energy-track',
 *   track: [[0, 11], [8, 0], [16, 6], [24, 0], [30, 2]],   // points (x, height) in metres; hilltops and valley
 *                                                         // floors sit exactly on them, joined by smooth slopes
 *   start: 5,                    // release height (m) on the first slope; the ball starts at rest
 *   startRange: [1, 10, 1],      // optional slider for the release height [min, max, step]
 *   mass: 2,                     // kg
 *   massRange: [1, 5, 1],        // optional slider
 *   friction: false,             // is friction on at the start?
 *   frictionToggle: false,       // let the learner switch friction on and off
 *   mu: 0.2,                     // friction coefficient used when friction is on
 *   bars: true,                  // show the energy bars
 *   duration: 12,                // longest run (s)
 *   g: 10,
 *   static: false,               // true: picture without controls…
 *   show: 'start',               // …before the release ('start') or at the end of the run ('end')
 * }
 *
 * State: { start, mass, friction, ran, total, finished, passed, climbHeight, bottomSpeed, maxSpeed, heat, restHeight }
 *   ran         — the current settings have been run
 *   total       — total energy, m·g·(release height), in joules
 *   finished    — the ball reaches the far end of the track
 *   passed      — how many hilltops it gets over
 *   climbHeight — the greatest height it reaches after passing the floor of the first valley (m)
 *   bottomSpeed — its speed at the floor of the first valley (m/s)
 *   maxSpeed    — its greatest speed (m/s)
 *   heat        — thermal energy at the end of the run (J)
 *   restHeight  — height where friction finally stops it (null if it is still moving)
 * These facts always describe the *current* settings; they do not wait for the animation.
 *
 * setState({ start, mass, friction }) sets the controls and shows the finished run.
 *
 * The model: a bead on a wire. Along the track, dv/dt = −g·sin(slope) minus
 * friction μ·g·cos(slope) against the motion (so the heat produced is
 * μ·m·g × horizontal distance travelled). It is integrated with a fixed time
 * step (RK4, 1/240 s) before the animation starts, so every run is exactly
 * repeatable; the animation only plays the result back. The bars are
 * computed from energy conservation: heat = total − kinetic − potential.
 */
import { frame, sliderRow, button, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const DT = 1 / 240;
const R = 10;

addStyles('energy-track', `
  .widget-energy-track .et-bars { display: grid; gap: 5px; }
  .widget-energy-track .et-row { display: grid; grid-template-columns: 5.4em minmax(0, 1fr) 4.6em; align-items: center; gap: var(--s2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-energy-track .et-row > span:last-child { font-family: var(--font-mono); text-align: right; font-variant-numeric: tabular-nums; }
  .widget-energy-track .et-bar { display: flex; height: 16px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); overflow: hidden; }
  .widget-energy-track .et-bar i { display: block; height: 100%; }
  .widget-energy-track .et-ke { background: var(--green); }
  .widget-energy-track .et-pe { background: var(--blue); }
  .widget-energy-track .et-heat { background: var(--red); }
  .widget-energy-track .et-key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; border: 1.5px solid var(--edge-strong); margin-right: 5px; }
  .widget-energy-track .w-buttons { align-items: center; }
  .widget-energy-track .et-level { font-family: var(--font-body); font-weight: 800; font-size: 12px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-energy-track .et-hill { font-family: var(--font-body); font-weight: 800; font-size: 12px; fill: var(--ink-2); paint-order: stroke; stroke: var(--sunken); stroke-width: 6px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-energy-track .et-level, .widget-energy-track .et-hill { font-size: 16px; } }
`);

export default function create(spec, env) {
  const g = spec.g || 10;
  const pts = (spec.track || [[0, 11], [8, 0], [16, 6], [24, 0], [30, 2]]).map(([x, y]) => ({ x, y }));
  const isStatic = !!spec.static || !!env.compact;
  const startRange = !isStatic && Array.isArray(spec.startRange) ? spec.startRange : null;
  const massRange = !isStatic && Array.isArray(spec.massRange) ? spec.massRange : null;
  const frictionToggle = !!spec.frictionToggle && !isStatic;
  const mu = spec.mu != null ? spec.mu : 0.2;
  const showBars = spec.bars !== false && !env.compact;
  const showHeat = frictionToggle || !!spec.friction;
  const maxDuration = spec.duration || 12;
  const initial = { start: spec.start != null ? spec.start : 5, mass: spec.mass || 2, friction: !!spec.friction };
  const x0 = pts[0].x;
  const xEnd = pts[pts.length - 1].x;
  const topHeight = pts[0].y;

  let start = initial.start;
  let mass = initial.mass;
  let friction = initial.friction;
  let ran = isStatic && spec.show === 'end';
  let frameIndex = 0;        // playback position (index into run.xs)
  let clock = 0;
  let readOnly = !!env.readOnly;
  let cache = null;          // the simulated run for the current settings

  /* ----------------------------------------------------------- the track */
  const seg = (x) => { let i = 0; while (i < pts.length - 2 && x > pts[i + 1].x) i++; return i; };
  function heightAt(x) {
    const xx = clamp(x, x0, xEnd);
    const i = seg(xx);
    const u = (xx - pts[i].x) / (pts[i + 1].x - pts[i].x);
    return pts[i].y + (pts[i + 1].y - pts[i].y) * (3 * u * u - 2 * u * u * u);
  }
  function slopeAt(x) {
    const xx = clamp(x, x0, xEnd);
    const i = seg(xx);
    const dx = pts[i + 1].x - pts[i].x;
    const u = (xx - pts[i].x) / dx;
    return ((pts[i + 1].y - pts[i].y) * 6 * u * (1 - u)) / dx;
  }
  /** x on the first slope where the track has height hgt. */
  function xForHeight(hgt) {
    const a = pts[0];
    const b = pts[1];
    const w = clamp((a.y - hgt) / (a.y - b.y), 0, 1);                  // 3u² − 2u³ = w
    const u = 0.5 - Math.sin(Math.asin(1 - 2 * w) / 3);
    return a.x + u * (b.x - a.x);
  }
  const hilltops = pts.slice(1, -1).filter((p, i) => p.y > pts[i].y && p.y > pts[i + 2].y);
  const firstValley = pts.slice(1).find((p, i) => p.y < pts[i].y) || pts[1];

  /* ----------------------------------------------------------- the model */
  function simulate() {
    const key = `${start}|${friction}`;
    if (cache && cache.key === key) return cache;
    // An exact tie with a hilltop would take for ever to resolve; a 4 mm shortfall settles it honestly.
    let h0 = start;
    if (!friction && hilltops.some((p) => Math.abs(p.y - start) < 1e-9)) h0 = start - 0.004;
    const xStart = xForHeight(h0);
    const eTotal = g * h0;                                             // per kilogram
    const f = friction ? mu : 0;
    let x = xStart;
    let v = 0;
    let time = 0;
    const xs = [x];
    const vs = [0];
    let maxSpeed = 0;
    let bottomSpeed = null;
    let climbHeight = null;
    let reached = x;
    let finished = false;
    let rest = false;
    const acc = (xx, dir) => { const m = slopeAt(xx); const c = 1 / Math.sqrt(1 + m * m); return -g * m * c - f * g * c * dir; };
    const steps = Math.round(maxDuration / DT);
    for (let n = 1; n <= steps; n++) {
      let dir = Math.sign(v);
      if (dir === 0) {
        const m = slopeAt(x);
        if (f > 0 && Math.abs(m) <= f + 1e-12) { rest = true; break; }   // friction holds it where it stands
        dir = m > 0 ? -1 : 1;
        if (Math.abs(m) < 1e-12) { rest = true; break; }
      }
      const c = (xx) => 1 / Math.sqrt(1 + slopeAt(xx) ** 2);
      const k1x = v * c(x);                 const k1v = acc(x, dir);
      const k2x = (v + 0.5 * DT * k1v) * c(x + 0.5 * DT * k1x); const k2v = acc(x + 0.5 * DT * k1x, dir);
      const k3x = (v + 0.5 * DT * k2v) * c(x + 0.5 * DT * k2x); const k3v = acc(x + 0.5 * DT * k2x, dir);
      const k4x = (v + DT * k3v) * c(x + DT * k3x);             const k4v = acc(x + DT * k3x, dir);
      const xNew = x + (DT / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      let vNew = v + (DT / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      if (f > 0 && v !== 0 && vNew * v < 0) vNew = 0;                    // friction must reverse: stop at the turning point first
      if (bottomSpeed === null && (x - firstValley.x) * (xNew - firstValley.x) <= 0 && xNew !== x) bottomSpeed = Math.abs(v);
      x = xNew;
      v = vNew;
      time = n * DT;
      maxSpeed = Math.max(maxSpeed, Math.abs(v));
      reached = Math.max(reached, x);
      if (bottomSpeed !== null) climbHeight = Math.max(climbHeight === null ? 0 : climbHeight, heightAt(x));
      if (x >= xEnd) { x = xEnd; finished = true; }
      if (n % 4 === 0) { xs.push(x); vs.push(v); }
      if (finished) break;
    }
    if (xs[xs.length - 1] !== x || vs[vs.length - 1] !== v) { xs.push(x); vs.push(rest ? 0 : v); }
    const xLast = xs[xs.length - 1];
    const vLast = vs[vs.length - 1];
    const heatEnd = Math.max(0, eTotal - 0.5 * vLast * vLast - g * heightAt(xLast));
    cache = {
      key, xs, vs, eTotal, h0, time,
      finished,
      rest,
      passed: hilltops.filter((p) => reached > p.x + 1e-6).length,
      climbHeight,
      bottomSpeed: bottomSpeed === null ? 0 : bottomSpeed,
      maxSpeed,
      heatPerKg: friction ? heatEnd : 0,
      restHeight: rest ? heightAt(xLast) : null,
    };
    return cache;
  }

  /* ------------------------------------------------------------- drawing */
  const padL = 46;
  const padR = 18;
  const k = (W - padL - padR) / (xEnd - x0);                             // px per metre, both ways
  const groundY = Math.round(topHeight * k) + 34;
  const height = groundY + 30;
  const X = (m) => padL + (m - x0) * k;
  const Y = (m) => groundY - m * k;

  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'A ball on a curved track' });
  const { svg } = fr;

  // height scale
  svg.appendChild(s('line', { x1: padL - 14, x2: padL - 14, y1: Y(0), y2: Y(topHeight), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  const stepM = topHeight <= 6 ? 1 : topHeight <= 12 ? 2 : 5;
  for (let m = 0; m <= topHeight + 1e-9; m += stepM) {
    svg.appendChild(s('line', { x1: padL - 20, x2: padL - 14, y1: Y(m), y2: Y(m), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    svg.appendChild(s('text.tick-label', { x: padL - 24, y: Y(m) + 4, 'text-anchor': 'end' }, String(m)));
  }
  svg.appendChild(s('text.tick-label', { x: padL - 24, y: Y(topHeight) - 12, 'text-anchor': 'end' }, 'm'));

  // the track: soft ground under a thick line
  let d = '';
  const N = 240;
  for (let i = 0; i <= N; i++) {
    const xm = x0 + ((xEnd - x0) * i) / N;
    d += `${i ? 'L' : 'M'}${X(xm).toFixed(1)} ${Y(heightAt(xm)).toFixed(1)}`;
  }
  svg.appendChild(s('path', { d: `${d}L${X(xEnd)} ${groundY + 12}L${X(x0)} ${groundY + 12}Z`, fill: 'var(--sunken)', stroke: 'none' }));
  svg.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  // finish flag
  const fx = X(xEnd);
  const fy = Y(heightAt(xEnd));
  svg.appendChild(s('line', { x1: fx, x2: fx, y1: fy, y2: fy - 30, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  svg.appendChild(s('path', { d: `M${fx} ${fy - 30}L${fx - 16} ${fy - 24}L${fx} ${fy - 18}Z`, fill: hue('green'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));

  const levelStart = s('line', { stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 6' });
  const levelStartTag = s('text.et-level', { 'text-anchor': 'end', style: 'fill: var(--ink-2)' }, 'release height');
  const levelLeft = s('line', { stroke: hue('red'), 'stroke-width': 2, 'stroke-dasharray': '3 5' });
  const levelLeftTag = s('text.et-level', { 'text-anchor': 'end', style: `fill:${hue('red', 'text')}` }, 'energy left');
  const ball = s('g', s('circle', { r: R, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  svg.append(levelStart, levelLeft);
  for (const p of hilltops) {
    svg.appendChild(s('text.et-hill', { x: X(p.x), y: Y(p.y) + 26, 'text-anchor': 'middle' }, `${formatNumber(p.y, 1)} m`));
  }
  const speedTag = s('text.fig-label', { x: W - 12, y: 22, 'text-anchor': 'end' });
  svg.append(levelStartTag, levelLeftTag, ball, speedTag);

  /* ------------------------------------------------------------ controls */
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const bars = {};
  const sliders = {};
  const frictionBtns = [];
  let goBtn = null;
  let resetBtn = null;
  const changed = () => { anim.stop(); ran = false; frameIndex = 0; clock = 0; note.textContent = ''; render(); };

  if (showBars) {
    const wrap = h('div.et-bars', { role: 'group', 'aria-label': 'Energy bars' });
    const row = (key, label, parts) => {
      const fills = parts.map((cls) => h('i', { class: cls }));
      const value = h('span');
      wrap.appendChild(h('div.et-row', h('span', parts.length === 1 ? h('span', { class: `et-key ${parts[0]}` }) : null, label), h('div.et-bar', fills), value));
      bars[key] = { fills, value };
    };
    row('ke', 'Kinetic', ['et-ke']);
    row('pe', 'Potential', ['et-pe']);
    if (showHeat) row('heat', 'Heat', ['et-heat']);
    row('total', 'Total', showHeat ? ['et-ke', 'et-pe', 'et-heat'] : ['et-ke', 'et-pe']);
    fr.el.insertBefore(wrap, fr.controls);
  }
  if (!isStatic) {
    if (startRange) {
      sliders.start = sliderRow({ label: 'release height', min: startRange[0], max: startRange[1], step: startRange[2] || 1, value: start, color: 'orange', unit: 'm', onInput: (val) => { start = val; changed(); } });
      fr.controls.appendChild(sliders.start.el);
    }
    if (massRange) {
      sliders.mass = sliderRow({ label: 'mass', min: massRange[0], max: massRange[1], step: massRange[2] || 1, value: mass, color: 'blue', unit: 'kg', onInput: (val) => { mass = val; changed(); } });
      fr.controls.appendChild(sliders.mass.el);
    }
    if (frictionToggle) {
      const segEl = h('div.segmented', { role: 'group', 'aria-label': 'Friction' });
      [['No friction', false], ['With friction', true]].forEach(([text, value]) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(friction === value) }, text);
        b.addEventListener('click', () => { if (readOnly || friction === value) return; friction = value; play('select'); changed(); });
        frictionBtns.push({ b, value });
        segEl.appendChild(b);
      });
      fr.buttons.appendChild(segEl);
    }
    goBtn = button('Release', () => go(true), { icon: 'play', variant: 'primary' });
    resetBtn = button('Reset', () => {
      if (readOnly) return;
      start = initial.start; mass = initial.mass; friction = initial.friction;
      if (sliders.start) sliders.start.set(start);
      if (sliders.mass) sliders.mass.set(mass);
      changed();
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, resetBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    const run = simulate();
    clock += dt;
    frameIndex = Math.min(run.xs.length - 1, Math.round(clock * 60));
    if (frameIndex >= run.xs.length - 1) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  function describe() {
    const run = simulate();
    if (run.finished) return 'It reaches the finish.';
    if (run.rest) return `Friction brings it to rest ${formatNumber(run.restHeight, 1)} m up.`;
    if (run.climbHeight !== null) return `It climbs to ${formatNumber(run.climbHeight, 1)} m, turns round and slides back${friction ? '' : ', again and again'}.`;
    return 'It is still on its way down.';
  }

  function finish(notify) {
    const run = simulate();
    ran = true;
    frameIndex = run.xs.length - 1;
    render();
    note.textContent = describe();
    if (notify) {
      play(run.finished ? 'pop' : 'tick');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function go(count) {
    anim.stop();
    frameIndex = 0;
    clock = 0;
    ran = true;
    note.textContent = '';
    if (reducedMotion()) { finish(count && !readOnly); return; }
    notifyAtEnd = count && !readOnly;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const run = simulate();
    const active = anim.running || ran;
    const i = active ? clamp(frameIndex, 0, run.xs.length - 1) : 0;
    const x = run.xs[i];
    const v = run.vs[i];
    const hgt = heightAt(x);
    // place the ball on top of the track, along the screen-space normal
    const m = slopeAt(x);
    const len = Math.sqrt(1 + m * m);
    ball.setAttribute('transform', `translate(${(X(x) - (m / len) * (R + 2)).toFixed(1)} ${(Y(hgt) - (1 / len) * (R + 2)).toFixed(1)})`);

    // energies: without friction the kinetic bar is whatever the potential bar has given up
    const total = mass * run.eTotal;
    const pe = Math.min(total, mass * g * hgt);
    const keShown = friction ? Math.min(0.5 * mass * v * v, total - pe) : total - pe;
    const heat = friction ? Math.max(0, total - pe - keShown) : 0;
    const leftHeight = (total - heat) / (mass * g);

    const lineY = Y(run.h0);
    levelStart.setAttribute('x1', padL - 14); levelStart.setAttribute('x2', W - 8);
    levelStart.setAttribute('y1', lineY); levelStart.setAttribute('y2', lineY);
    levelStartTag.setAttribute('x', W - 10); levelStartTag.setAttribute('y', lineY - 7);
    const showLeft = friction && active && heat > 1e-6;
    levelLeft.setAttribute('visibility', showLeft ? 'visible' : 'hidden');
    levelLeftTag.setAttribute('visibility', showLeft && Y(leftHeight) - lineY > 16 ? 'visible' : 'hidden');
    if (showLeft) {
      const ly = Y(leftHeight);
      levelLeft.setAttribute('x1', padL - 14); levelLeft.setAttribute('x2', W - 8);
      levelLeft.setAttribute('y1', ly); levelLeft.setAttribute('y2', ly);
      levelLeftTag.setAttribute('x', W - 10); levelLeftTag.setAttribute('y', ly - 7);
    }

    speedTag.textContent = isStatic && !ran ? '' : `speed ${formatNumber(Math.abs(v), 1)} m/s`;
    if (showBars) {
      const scale = (massRange ? massRange[1] : mass) * g * (startRange ? startRange[1] : Math.max(start, initial.start));
      const pct = (val) => `${clamp((val / scale) * 100, 0, 100).toFixed(2)}%`;
      const joules = (val) => `${formatNumber(val, 0)} J`;
      bars.ke.fills[0].style.width = pct(keShown); bars.ke.value.textContent = joules(keShown);
      bars.pe.fills[0].style.width = pct(pe); bars.pe.value.textContent = joules(pe);
      if (bars.heat) { bars.heat.fills[0].style.width = pct(heat); bars.heat.value.textContent = joules(heat); }
      bars.total.fills[0].style.width = pct(keShown);
      bars.total.fills[1].style.width = pct(pe);
      if (bars.total.fills[2]) bars.total.fills[2].style.width = pct(heat);
      bars.total.value.textContent = joules(total);
    }
    for (const { b, value } of frictionBtns) { b.setAttribute('aria-pressed', String(friction === value)); b.disabled = readOnly; }
    if (goBtn) goBtn.lastChild.textContent = ran && !anim.running ? 'Release again' : 'Release';
    if (resetBtn) resetBtn.disabled = readOnly;
    if (!isStatic) {
      svg.setAttribute('aria-label', `${spec.alt || 'A ball on a curved track'}. Release height ${formatNumber(start, 1)} metres, mass ${formatNumber(mass, 1)} kilograms, friction ${friction ? 'on' : 'off'}.${ran && !anim.running ? ` ${describe()}` : ''}`);
    }
  }

  function getState() {
    const run = simulate();
    return {
      start, mass, friction, ran,
      total: tidy(mass * g * start, 4),
      finished: run.finished,
      passed: run.passed,
      climbHeight: run.climbHeight === null ? null : tidy(run.climbHeight, 2),
      bottomSpeed: tidy(run.bottomSpeed, 2),
      maxSpeed: tidy(run.maxSpeed, 2),
      heat: tidy(mass * run.heatPerKg, 1),
      restHeight: run.restHeight === null ? null : tidy(run.restHeight, 2),
    };
  }

  if (ran) frameIndex = simulate().xs.length - 1;
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (typeof next.start === 'number') { start = startRange ? clamp(next.start, startRange[0], startRange[1]) : next.start; if (sliders.start) sliders.start.set(start); }
      if (typeof next.mass === 'number') { mass = massRange ? clamp(next.mass, massRange[0], massRange[1]) : next.mass; if (sliders.mass) sliders.mass.set(mass); }
      if (typeof next.friction === 'boolean') friction = next.friction;
      if (next.ran === false) { ran = false; frameIndex = 0; render(); return; }
      if (isStatic) { render(); return; }
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
  { title: 'energy-track — release height, mass and friction', spec: { type: 'energy-track', start: 7, startRange: [1, 10, 1], massRange: [1, 5, 1], frictionToggle: true } },
];
