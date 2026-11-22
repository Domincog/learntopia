/**
 * ramp-roll — constant acceleration made visible. A ball rolls down a ramp
 * (or a car drives along a level road) and leaves a marker every second, so
 * the growing or shrinking gaps can be seen and measured. Optionally the
 * learner first plants flags where they expect the ball to be, and a
 * velocity–time graph is drawn live.
 *
 * {
 *   type: 'ramp-roll',
 *   scene: 'ramp',              // 'ramp': a ball on a tilted ramp · 'road': a car on a level road
 *                               // 'none': no picture, only the velocity–time graph (for static figures)
 *   a: 2,                       // acceleration (m/s², negative = slowing down)
 *   v0: 0,                      // starting velocity (m/s, never negative)
 *   duration: 4,                // seconds of motion
 *   length: 17,                 // metres of ramp / road shown
 *   aRange: [-5, 5, 1],         // optional slider for a: [min, max, step]
 *   v0Range: [0, 20, 2],        // optional slider for v0
 *   aLabel: 'acceleration',     // slider label
 *   marks: true,                // drop a marker every second
 *   markLabels: true,           // write the distance at each marker
 *   given: [1],                 // markers (times) already visible before the run
 *   predict: [2, 3, 4],         // draggable flags: "where will it be after 2, 3, 4 s?"
 *   guesses: [8, 11, 14],       // where those flags start (m)
 *   graph: false,               // show a live velocity–time graph under the scene
 *   vMax: 16,                   // top of the graph's velocity axis
 *   target: { t: 4, v: 12 },    // optional point to hit on the graph
 *   points: [{ t: 0, v: 4, label: '(0 s, 4 m/s)' }],   // marked points on the graph (static figures)
 *   button: true,               // show the Go and Reset buttons (false: the run starts only through setState)
 *   static: false,              // true: picture of the finished run, no controls
 * }
 *
 * State: { a, v0, ran, vEnd, distance, stopped, stopTime, offTrack, marks, gaps, guesses, placed }
 *   ran       — the current settings have been run
 *   vEnd      — velocity when the clock reaches `duration` (0 if it has stopped)
 *   distance  — distance covered by then (m)
 *   stopped / stopTime — it came to rest before the end, and when
 *   offTrack  — it ran off the end of the ramp / road before the end
 *   marks     — [{ t, x, v }] for every whole second of the run
 *   gaps      — distance covered during each second
 *   guesses   — where the flags stand (m), in the order of `predict`
 *   placed    — how many flags the learner has moved
 * These facts always describe the *current* settings; they do not wait for the animation.
 *
 * setState({ a, v0, guesses, ran }) sets the controls and shows the run
 * (animated when motion is allowed; the state is correct immediately).
 * Motion is analytic: x = v0·t + ½·a·t², so results are exact and repeatable.
 */
import { frame, plane, drawAxes, handle, sliderRow, button, loop, niceStep, hue, s, h, clamp, snapTo, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;

addStyles('ramp-roll', `
  .widget-ramp-roll .rr-num { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--orange-text); }
  .widget-ramp-roll .rr-flag { font-family: var(--font-body); font-weight: 800; font-size: 14px; fill: var(--violet-text); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-ramp-roll .is-unplaced { opacity: 0.55; }
  @media (max-width: 520px) {
    .widget-ramp-roll .rr-num { font-size: 16px; }
    .widget-ramp-roll .rr-flag { font-size: 18px; }
  }
`);

export default function create(spec, env) {
  const scene = spec.scene === 'road' ? 'road' : spec.scene === 'none' ? 'none' : 'ramp';
  const duration = spec.duration || 4;
  const length = spec.length || (scene === 'ramp' ? 17 : 60);
  const isStatic = !!spec.static || !!env.compact;
  const showGraph = (!!spec.graph || scene === 'none') && !env.compact;
  const showMarks = spec.marks !== false && scene !== 'none';
  const markLabels = spec.markLabels !== false && showMarks;
  const predictTimes = isStatic ? [] : (spec.predict || []).filter((sec) => sec > 0 && sec <= duration);
  const given = spec.given || [];
  const aRange = !isStatic && Array.isArray(spec.aRange) ? spec.aRange : null;
  const v0Range = !isStatic && Array.isArray(spec.v0Range) ? spec.v0Range : null;
  const showButtons = spec.button !== false && !isStatic;
  const initial = { a: spec.a != null ? spec.a : 2, v0: Math.max(0, spec.v0 || 0) };
  const startGuesses = predictTimes.map((_, i) => (spec.guesses && spec.guesses[i] != null
    ? spec.guesses[i]
    : snapTo(length * (0.5 + (0.3 * i) / Math.max(1, predictTimes.length - 1 || 1)), 0.5)));

  let a = initial.a;
  let v0 = initial.v0;
  let guesses = startGuesses.slice();
  let touched = predictTimes.map(() => false);
  let ran = isStatic;
  let t = isStatic ? duration : 0;
  let readOnly = !!env.readOnly;

  /* ----------------------------------------------------------- the model */
  function motion() {
    const brakes = a < 0;
    const tRest = brakes ? (v0 > 0 ? -v0 / a : 0) : Infinity;          // when it comes to rest
    const xOf = (time) => { const tt = Math.min(time, tRest); return v0 * tt + 0.5 * a * tt * tt; };
    const vOf = (time) => (time >= tRest ? 0 : v0 + a * time);
    let tOff = Infinity;
    if (xOf(duration) > length + 1e-9) tOff = Math.abs(a) < 1e-12 ? length / v0 : (-v0 + Math.sqrt(v0 * v0 + 2 * a * length)) / a;
    const tEnd = Math.min(duration, tOff);
    const marks = [];
    for (let sec = 0; sec <= tEnd + 1e-9; sec++) marks.push({ t: sec, x: tidy(xOf(sec)), v: tidy(vOf(sec)) });
    return { xOf, vOf, tEnd, tRest, marks, offTrack: tOff < duration, stopped: tRest <= duration + 1e-9 && (v0 > 0 || brakes) };
  }

  /* ------------------------------------------------------------ geometry */
  const tilt = scene === 'ramp' ? (12 * Math.PI) / 180 : 0;
  const ux = Math.cos(tilt);
  const uy = Math.sin(tilt);
  const X0 = scene === 'ramp' ? 54 : 42;
  const HYP = scene === 'ramp' ? 478 : 480;
  const k = HYP / length;                                              // px per metre
  const Y0 = scene === 'ramp' ? (predictTimes.length ? 104 : 62) : 74;
  const sceneH = scene === 'none' ? 6 : scene === 'ramp' ? Math.round(Y0 + HYP * uy + 58) : 128;
  const graphH = showGraph ? (scene === 'none' ? 262 : 192) : 0;
  const height = sceneH + graphH;
  /** A point `d` metres along the track and `off` px above it. */
  const at = (d, off = 0) => ({ x: X0 + ux * d * k + uy * off, y: Y0 + uy * d * k - ux * off });

  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || (scene === 'ramp' ? 'A ball on a ramp' : 'A car on a road') });
  const { svg } = fr;

  // supports, beam and ruler
  const pStart = at(0);
  const pEnd = at(length);
  const hasScene = scene !== 'none';
  if (scene === 'ramp') {
    const floor = sceneH - 10;
    svg.appendChild(s('line', { x1: 14, x2: W - 14, y1: floor, y2: floor, stroke: 'var(--hair)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(s('line', { x1: pStart.x - ux * 26, x2: pStart.x - ux * 26, y1: pStart.y - uy * 26, y2: floor, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    svg.appendChild(s('line', { x1: pEnd.x + ux * 14, x2: pEnd.x + ux * 14, y1: pEnd.y + uy * 14, y2: floor, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
  }
  const ext = scene === 'ramp' ? 14 : 22;
  if (hasScene) svg.appendChild(s('line', { x1: pStart.x - ux * (scene === 'ramp' ? 26 : ext), y1: pStart.y - uy * (scene === 'ramp' ? 26 : ext), x2: pEnd.x + ux * ext, y2: pEnd.y + uy * ext, stroke: 'var(--ink)', 'stroke-width': scene === 'ramp' ? 5 : 3, 'stroke-linecap': 'round' }));
  const tickEvery = k >= 16 ? 1 : k >= 6 ? 5 : 10;
  const labelEvery = k >= 26 ? 2 : k >= 16 ? 4 : k >= 6 ? 10 : 20;
  for (let m = 0; hasScene && m <= length + 1e-9; m += tickEvery) {
    const major = m % labelEvery === 0;
    const p0 = at(m, -3);
    const p1 = at(m, major ? -11 : -8);
    svg.appendChild(s('line', { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, stroke: 'var(--ink)', 'stroke-width': major ? 2 : 1.5, 'stroke-linecap': 'round' }));
    if (major) {
      const pt = at(m, -27);
      svg.appendChild(s('text.tick-label', { x: pt.x, y: pt.y + 4, 'text-anchor': 'middle' }, m + labelEvery > length ? `${m} m` : String(m)));
    }
  }

  const gPins = s('g');
  const gMarks = s('g');
  const gFlags = s('g');
  svg.append(gPins, gMarks, gFlags);

  // the moving thing
  const R = 12;
  let mover;
  let spoke = null;
  if (scene === 'ramp') {
    spoke = s('line', { x1: -R + 3, x2: R - 3, y1: 0, y2: 0, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    mover = s('g', s('circle', { r: R, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }), spoke);
  } else {
    mover = s('g',
      s('path', { d: 'M-12 -16 Q-10 -27 0 -27 H8 Q16 -27 19 -16 Z', fill: hue('orange', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
      s('rect', { x: -24, y: -17, width: 48, height: 12, rx: 5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('circle', { cx: -13, cy: -6, r: 6, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('circle', { cx: 13, cy: -6, r: 6, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    );
  }
  if (hasScene) svg.appendChild(mover);

  /* --------------------------------------------------------------- graph */
  let pl = null;
  let gLine = null;
  let gDot = null;
  if (showGraph) {
    const vMax = spec.vMax || 16;
    pl = plane({ x: [0, duration], y: [0, vMax], width: W, height, pad: { l: 54, r: 18, t: sceneH + 10, b: 52 } });
    svg.appendChild(drawAxes(pl, { xStep: duration <= 10 ? 1 : undefined, yStep: niceStep(vMax, 4) }));
    const midY = (pl.top + pl.bottom) / 2;
    svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: height - 8, 'text-anchor': 'middle' }, 'time (s)'));
    svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, 'velocity (m/s)'));
    if (spec.target) {
      const px = pl.sx(spec.target.t);
      const py = pl.sy(spec.target.v);
      svg.appendChild(s('circle', { cx: px, cy: py, r: 11, fill: 'none', stroke: hue('green'), 'stroke-width': 3, 'stroke-dasharray': '5 4' }));
      svg.appendChild(s('text.fig-label', { x: px - 16, y: py + (spec.target.v > vMax * 0.2 ? 5 : -14), 'text-anchor': 'end', style: `fill:${hue('green', 'text')}` }, 'target'));
    }
    gLine = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    gDot = s('circle', { r: 7, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5, visibility: isStatic ? 'hidden' : 'visible' });
    svg.append(gLine, gDot);
    for (const pt of spec.points || []) {
      const px = pl.sx(pt.t);
      const py = pl.sy(pt.v);
      svg.appendChild(s('circle', { cx: px, cy: py, r: 6, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      if (pt.label) {
        const right = px < pl.right - 120;
        const up = pt.above != null ? pt.above : py > pl.top + 40;
        svg.appendChild(s('text.fig-label', { x: px + (right ? 12 : -12), y: py + (up ? -16 : 24), 'text-anchor': right ? 'start' : 'end' }, pt.label));
      }
    }
  }

  /* --------------------------------------------------------------- flags */
  const flags = predictTimes.map((sec, i) => {
    const pin = s('line', { stroke: hue('violet'), 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    const label = s('text.rr-flag', { 'text-anchor': 'middle' }, `${sec} s`);
    const hd = handle(svg, {
      color: 'violet', r: 9, label: `Your guess for ${sec} seconds`, keyStep: k * 0.5,
      onMove: (px, py) => {
        if (readOnly) return;
        const d = clamp(snapTo(((px - X0) * ux + (py - Y0) * uy) / k, 0.5), 0, length);
        if (d === guesses[i] && touched[i]) return;
        guesses[i] = tidy(d);
        touched[i] = true;
        render();
        env.onChange(getState());
      },
    });
    const g = s('g', label, hd.el);
    gPins.appendChild(pin);
    gFlags.appendChild(g);
    return { pin, label, hd, g };
  });

  /* ------------------------------------------------------------ controls */
  const sliders = {};
  const changed = () => { anim.stop(); ran = false; t = 0; note.textContent = ''; render(); };
  if (aRange) {
    sliders.a = sliderRow({ label: spec.aLabel || 'acceleration', min: aRange[0], max: aRange[1], step: aRange[2] || 1, value: a, color: 'violet', unit: 'm/s²', onInput: (val) => { a = val; changed(); } });
    fr.controls.appendChild(sliders.a.el);
  }
  if (v0Range) {
    sliders.v0 = sliderRow({ label: spec.v0Label || 'starting velocity', min: v0Range[0], max: v0Range[1], step: v0Range[2] || 1, value: v0, color: 'blue', unit: 'm/s', onInput: (val) => { v0 = val; changed(); } });
    fr.controls.appendChild(sliders.v0.el);
  }
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let goBtn = null;
  let resetBtn = null;
  if (showButtons) {
    goBtn = button(scene === 'ramp' ? 'Roll' : 'Go', () => go(true), { icon: 'play', variant: 'primary' });
    resetBtn = button('Reset', () => {
      if (readOnly) return;
      anim.stop();
      a = initial.a; v0 = initial.v0;
      if (sliders.a) sliders.a.set(a);
      if (sliders.v0) sliders.v0.set(v0);
      ran = false; t = 0; note.textContent = '';
      render();
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, resetBtn);
  }
  if (!isStatic) fr.el.appendChild(note);
  if (predictTimes.length) note.textContent = 'Drag each flag along the ramp.';

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    const { tEnd } = motion();
    t = Math.min(tEnd, t + dt * 1.15);
    if (t >= tEnd - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  function describe() {
    const m = motion();
    if (m.offTrack) return `It ran off the end after ${formatNumber(m.tEnd, 1)} s.`;
    if (m.stopped && m.tRest < duration - 1e-9) return m.tRest === 0 ? 'It never got going.' : `It came to rest after ${formatNumber(m.tRest, 1)} s.`;
    return '';
  }

  function finish(notify) {
    const m = motion();
    ran = true;
    t = m.tEnd;
    render();
    if (!predictTimes.length) note.textContent = describe();
    if (notify) {
      play('tick');
      env.announce(`Run finished. Distance ${formatNumber(m.xOf(m.tEnd), 1)} metres, velocity ${formatNumber(m.vOf(m.tEnd), 1)} metres per second.`);
      env.onChange(getState());
    }
  }

  function go(notify) {
    anim.stop();
    t = 0;
    ran = true;                      // the facts in getState() are valid from the moment of launch
    if (!predictTimes.length) note.textContent = '';
    if (reducedMotion()) { finish(notify && !readOnly); return; }
    notifyAtEnd = notify && !readOnly;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const m = motion();
    const now = Math.min(t, m.tEnd);
    const x = m.xOf(now);
    const p = at(Math.min(x, length + 1.2), scene === 'ramp' ? R + 2.5 : 1.5);
    mover.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})${scene === 'ramp' ? ` rotate(${(tilt * 180) / Math.PI})` : ''}`);
    if (spoke) spoke.setAttribute('transform', `rotate(${(((x * k) / R) * 180) / Math.PI})`);

    while (gMarks.firstChild) gMarks.removeChild(gMarks.firstChild);
    if (showMarks) {
      const running = anim.running || ran;
      for (const mk of m.marks) {
        if (mk.t === 0) continue;
        const visible = given.includes(mk.t) || (running && mk.t <= now + 1e-9);
        if (!visible || mk.x > length + 1e-9) continue;
        if (scene === 'ramp') {
          const c = at(mk.x, R + 2.5);
          gMarks.appendChild(s('circle', { cx: c.x, cy: c.y, r: R, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
          gMarks.appendChild(s('text.rr-num', { x: c.x, y: c.y + 5, 'text-anchor': 'middle' }, String(mk.t)));
          if (markLabels) {
            const lp = at(mk.x, 2 * R + 14);
            gMarks.appendChild(s('text.fig-label', { x: lp.x, y: lp.y, 'text-anchor': 'middle' }, `${formatNumber(mk.x, 1)} m`));
          }
        } else {
          const c = at(mk.x, 0);
          gMarks.appendChild(s('line', { x1: c.x, x2: c.x, y1: c.y - 2, y2: c.y - 36, stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-dasharray': '3 4' }));
          gMarks.appendChild(s('circle', { cx: c.x, cy: c.y - 40, r: 5, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2 }));
          if (markLabels && (mk.x - m.marks[mk.t - 1].x) * k >= 40) {
            gMarks.appendChild(s('text.fig-label-sm', { x: c.x, y: c.y - 52, 'text-anchor': 'middle' }, `${formatNumber(mk.x, 1)} m`));
          }
        }
      }
    }

    flags.forEach((f, i) => {
      const base = at(guesses[i], 3);
      const top = at(guesses[i], markLabels ? 2 * R + 44 : 2 * R + 22);
      f.pin.setAttribute('x1', base.x); f.pin.setAttribute('y1', base.y);
      f.pin.setAttribute('x2', top.x); f.pin.setAttribute('y2', top.y);
      f.hd.set(top.x, top.y);
      f.hd.setLabel(`${formatNumber(guesses[i], 1)} metres`);
      f.label.setAttribute('x', top.x);
      f.label.setAttribute('y', top.y - 16);
      f.g.setAttribute('class', touched[i] || ran ? '' : 'is-unplaced');
      f.pin.setAttribute('class', touched[i] || ran ? '' : 'is-unplaced');
    });

    if (showGraph) {
      const drawn = anim.running || ran;
      if (drawn) {
        let d = `M${pl.sx(0).toFixed(1)} ${pl.sy(v0).toFixed(1)}`;
        if (m.tRest < now) d += `L${pl.sx(m.tRest).toFixed(1)} ${pl.sy(0).toFixed(1)}`;
        d += `L${pl.sx(now).toFixed(1)} ${pl.sy(clamp(m.vOf(now), 0, pl.y1 * 1.2)).toFixed(1)}`;
        gLine.setAttribute('d', d);
      } else gLine.setAttribute('d', '');
      gDot.setAttribute('cx', pl.sx(drawn ? now : 0));
      gDot.setAttribute('cy', pl.sy(clamp(drawn ? m.vOf(now) : v0, 0, pl.y1 * 1.2)));
    }

    if (goBtn) goBtn.lastChild.textContent = ran && !anim.running ? (scene === 'ramp' ? 'Roll again' : 'Go again') : (scene === 'ramp' ? 'Roll' : 'Go');
    if (resetBtn) resetBtn.disabled = readOnly;
    if (!isStatic) {
      svg.setAttribute('aria-label', `${spec.alt || (scene === 'ramp' ? 'A ball on a ramp' : 'A car on a road')}. Acceleration ${formatNumber(a, 1)} metres per second squared, starting velocity ${formatNumber(v0, 1)} metres per second.${ran ? ` After ${formatNumber(m.tEnd, 1)} seconds it has covered ${formatNumber(m.xOf(m.tEnd), 1)} metres.` : ''}`);
    }
  }

  function getState() {
    const m = motion();
    const gaps = [];
    for (let i = 1; i < m.marks.length; i++) gaps.push(tidy(m.marks[i].x - m.marks[i - 1].x));
    return {
      a,
      v0,
      ran,
      vEnd: tidy(m.vOf(duration)),
      distance: tidy(m.xOf(m.tEnd)),
      stopped: m.stopped && m.tRest <= duration + 1e-9,
      stopTime: Number.isFinite(m.tRest) ? tidy(m.tRest) : null,
      offTrack: m.offTrack,
      marks: m.marks.map((mk) => ({ ...mk })),
      gaps,
      guesses: guesses.slice(),
      placed: touched.filter(Boolean).length,
    };
  }

  render();
  if (readOnly) { fr.el.classList.add('is-readonly'); flags.forEach((f) => f.hd.setEnabled(false)); }

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (typeof next.a === 'number') { a = aRange ? clamp(next.a, aRange[0], aRange[1]) : next.a; if (sliders.a) sliders.a.set(a); }
      if (typeof next.v0 === 'number') { v0 = Math.max(0, next.v0); if (sliders.v0) sliders.v0.set(v0); }
      if (Array.isArray(next.guesses)) next.guesses.forEach((g, i) => { if (i < guesses.length && typeof g === 'number') { guesses[i] = clamp(g, 0, length); touched[i] = true; } });
      if (next.ran === false) { ran = false; t = 0; render(); return; }
      if (isStatic) { render(); return; }
      go(false);                     // shows the run; state is already final
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      flags.forEach((f) => f.hd.setEnabled(!readOnly));
      render();
    },
    destroy() { anim.stop(); flags.forEach((f) => f.hd.destroy()); },
  };
}

export const examples = [
  { title: 'ramp-roll — plant flags, then let the ball roll', spec: { type: 'ramp-roll', scene: 'ramp', a: 2, duration: 4, length: 17, given: [1], predict: [2, 3, 4] } },
  { title: 'ramp-roll — braking car with a velocity–time graph', spec: { type: 'ramp-roll', scene: 'road', v0: 12, a: -3, aRange: [-5, 5, 1], duration: 4, length: 60, graph: true, vMax: 16, target: { t: 4, v: 0 } } },
];
