/**
 * force-cart — push an object along a level track and watch what the forces
 * do to its velocity. Force arrows show the push, the friction and their sum
 * (the net force); a velocity–time graph is drawn live. Balanced forces give
 * a steady velocity, not rest.
 *
 * {
 *   type: 'force-cart',
 *   body: 'cart',                // 'cart' | 'crate' | 'block' (a block sliding on ice)
 *   mass: 2,                     // kg
 *   push: 6,                     // N, towards the right
 *   friction: 0,                 // N; opposes the motion, and holds the object still while push <= friction
 *   v0: 0,                       // starting velocity (m/s, towards the right)
 *   duration: 5,                 // seconds of simulated time
 *   pushFor: null,               // the push ends after this many seconds (null: it lasts the whole run)
 *   length: 80,                  // metres of track shown
 *   pushRange: [0, 12, 1],       // optional sliders: [min, max, step]
 *   frictionRange: [0, 6, 1],
 *   massRange: [1, 6, 1],
 *   graph: true,                 // live velocity–time graph
 *   vMax: 20,                    // top of the graph's velocity axis
 *   log: false,                  // keep a visible list of the runs (push, mass → acceleration)
 * }
 *
 * State: { mass, push, friction, v0, net, a, ran, vEnd, distance, stopped, stopTime, steady, speedsUp, slowsDown, history }
 *   net       — net force at the start of the run (N, + is to the right)
 *   a         — acceleration at the start of the run (m/s²)
 *   ran       — the current settings have been run
 *   vEnd      — velocity when the clock reaches `duration`
 *   distance  — distance covered by then (m)
 *   stopped / stopTime — friction brought it to rest, and when
 *   steady    — it moved the whole time without its velocity changing
 *   speedsUp / slowsDown — vEnd compared with v0
 *   history   — every run so far: [{ push, mass, friction, a }]
 * These facts always describe the *current* settings; they do not wait for the animation.
 *
 * setState({ push, mass, friction, history }) sets the sliders and shows the
 * finished run. `history` may list earlier runs as { push, mass, friction };
 * their accelerations are recomputed.
 *
 * Motion is exact: within each phase the acceleration is constant, so
 * v = v0 + a·t and x = v0·t + ½·a·t² are evaluated directly.
 */
import { frame, plane, drawAxes, sliderRow, button, readout, loop, niceStep, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const SCENE_H = 134;
const GROUND = 94;
const N_PX = 7;          // arrow length per newton

addStyles('force-cart', `
  .widget-force-cart .fc-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-force-cart .fc-mass { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink); }
  .widget-force-cart .fc-log { list-style: none; display: grid; gap: 2px; justify-items: center; font-size: var(--fs-sm); font-family: var(--font-mono); font-weight: 600; color: var(--ink-2); }
  .widget-force-cart .fc-log li:last-child { color: var(--ink); font-weight: 800; }
  .widget-force-cart .fc-log:empty { display: none; }
  @media (max-width: 520px) {
    .widget-force-cart .fc-tag { font-size: 17px; }
    .widget-force-cart .fc-mass { font-size: 16px; }
  }
`);

export default function create(spec, env) {
  const body = ['cart', 'crate', 'block'].includes(spec.body) ? spec.body : 'cart';
  const duration = spec.duration || 5;
  const length = spec.length || 80;
  const isStatic = !!spec.static || !!env.compact;
  const showGraph = spec.graph !== false && !env.compact;
  const pushFor = spec.pushFor != null && spec.pushFor < duration ? spec.pushFor : null;
  const ranges = isStatic ? {} : { push: spec.pushRange, friction: spec.frictionRange, mass: spec.massRange };
  const initial = { push: spec.push || 0, friction: spec.friction || 0, mass: spec.mass || 2 };
  const v0 = Math.max(0, spec.v0 || 0);

  let push = initial.push;
  let friction = initial.friction;
  let mass = initial.mass;
  let ran = isStatic;
  let t = isStatic ? duration : 0;
  let history = [];
  let readOnly = !!env.readOnly;

  /* ----------------------------------------------------------- the model */
  /** Constant-acceleration phases of the run: [{ t0, t1, a, v0, x0, push, fr }]. */
  function phases(p = push, f = friction, m = mass) {
    const out = [];
    let time = 0;
    let v = v0;
    let x = 0;
    const cuts = pushFor != null ? [[pushFor, p], [duration, 0]] : [[duration, p]];
    for (const [until, force] of cuts) {
      let guard = 0;
      while (time < until - 1e-12 && guard++ < 4) {
        let a;
        let fr;                                   // friction force actually acting (N, magnitude)
        if (v > 1e-12) { fr = f; a = (force - f) / m; }
        else { fr = Math.min(force, f); a = Math.max(0, force - f) / m; }
        let end = until;
        if (a < 0) { const tStop = time + v / -a; if (tStop < until - 1e-12) end = tStop; }
        out.push({ t0: time, t1: end, a, v0: v, x0: x, push: force, fr });
        const dt = end - time;
        x += v * dt + 0.5 * a * dt * dt;
        v = Math.max(0, v + a * dt);
        if (v < 1e-9) v = 0;
        time = end;
      }
    }
    return out;
  }
  const phaseAt = (ph, time) => ph.find((q) => time < q.t1 - 1e-12) || ph[ph.length - 1];
  const vAt = (ph, time) => { const q = phaseAt(ph, time); return Math.max(0, q.v0 + q.a * (Math.min(time, q.t1) - q.t0)); };
  const xAt = (ph, time) => { const q = phaseAt(ph, time); const dt = Math.min(time, q.t1) - q.t0; return q.x0 + q.v0 * dt + 0.5 * q.a * dt * dt; };
  function facts(p = push, f = friction, m = mass) {
    const ph = phases(p, f, m);
    const first = ph[0];
    const vEnd = tidy(vAt(ph, duration));
    const rest = ph.find((q) => q.a < 0 && q.t1 < duration - 1e-9 && Math.abs(q.v0 + q.a * (q.t1 - q.t0)) < 1e-9);
    const neverMoves = v0 === 0 && ph.every((q) => q.a === 0);
    return {
      ph,
      net: tidy(first.push - first.fr),
      a: tidy(first.a, 4),
      vEnd,
      distance: tidy(xAt(ph, duration), 4),
      stopped: !!rest || neverMoves,
      stopTime: rest ? tidy(rest.t1, 3) : (neverMoves ? 0 : null),
      steady: v0 > 0 && ph.every((q) => Math.abs(q.a) < 1e-12),
    };
  }

  /* ------------------------------------------------------------- drawing */
  const graphH = showGraph ? 192 : 0;
  const height = SCENE_H + graphH;
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'An object on a track with force arrows' });
  const { svg } = fr;
  const X0 = 124;
  const k = (W - X0 - 44) / length;             // px per metre
  const sx = (m) => X0 + m * k;

  if (body === 'block') svg.appendChild(s('rect', { x: 14, y: GROUND, width: W - 28, height: 9, rx: 4, fill: hue('blue', 'soft') }));
  svg.appendChild(s('line', { x1: 14, x2: W - 14, y1: GROUND, y2: GROUND, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  const labelEvery = niceStep(length, 5);
  let tickEvery = labelEvery / (/^5/.test(String(labelEvery)) ? 5 : 2);
  if (tickEvery * k < 13) tickEvery = labelEvery;
  for (let m = 0; m <= length + 1e-9; m += tickEvery) {
    const major = Math.round(m / tickEvery) % Math.round(labelEvery / tickEvery) === 0;
    svg.appendChild(s('line', { x1: sx(m), x2: sx(m), y1: GROUND + 3, y2: GROUND + (major ? 11 : 8), stroke: 'var(--ink)', 'stroke-width': major ? 2 : 1.5, 'stroke-linecap': 'round' }));
    if (major) svg.appendChild(s('text.tick-label', { x: sx(m), y: GROUND + 28, 'text-anchor': 'middle' }, m + labelEvery > length ? `${formatNumber(m, 1)} m` : formatNumber(m, 1)));
  }
  const gMarks = s('g');
  svg.appendChild(gMarks);

  // the body, drawn with its bottom centre at (0, 0)
  const mover = s('g');
  const massText = s('text.fc-mass', { 'text-anchor': 'middle' });
  let bodyTop;
  let halfW;
  if (body === 'cart') {
    bodyTop = -38; halfW = 28;
    mover.append(
      s('rect', { x: -28, y: -38, width: 56, height: 26, rx: 7, fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('circle', { cx: -15, cy: -7, r: 7, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('circle', { cx: 15, cy: -7, r: 7, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    );
    massText.setAttribute('y', -20);
  } else if (body === 'crate') {
    bodyTop = -40; halfW = 26;
    mover.append(
      s('rect', { x: -26, y: -40, width: 52, height: 39, rx: 5, fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('path', { d: 'M-26 -27 H26', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.5 }),
    );
    massText.setAttribute('y', -10);
  } else {
    bodyTop = -30; halfW = 28;
    mover.append(s('rect', { x: -28, y: -30, width: 56, height: 29, rx: 8, fill: hue('teal', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    massText.setAttribute('y', -10);
  }
  mover.appendChild(massText);

  const makeArrow = (color, name) => {
    const line = s('line', { stroke: hue(color), 'stroke-width': 6, 'stroke-linecap': 'round' });
    const head = s('path', { fill: hue(color), stroke: hue(color), 'stroke-width': 2, 'stroke-linejoin': 'round' });
    const tag = s('text.fc-tag', { style: `fill:${hue(color, 'text')}` }, name);
    const g = s('g', line, head, tag);
    return {
      g,
      /** Arrow from (x, y), `n` newtons long (signed). `tagAbove` puts the name over the shaft. */
      set(x, y, n, tagAbove = true) {
        if (Math.abs(n) < 1e-9) { g.setAttribute('visibility', 'hidden'); return; }
        g.setAttribute('visibility', 'visible');
        const dir = Math.sign(n);
        const len = Math.max(20, Math.abs(n) * N_PX);
        const tip = x + dir * len;
        line.setAttribute('x1', x); line.setAttribute('x2', tip - dir * 9);
        line.setAttribute('y1', y); line.setAttribute('y2', y);
        head.setAttribute('d', `M${tip} ${y}L${tip - dir * 12} ${y - 8}L${tip - dir * 12} ${y + 8}Z`);
        tag.setAttribute('x', dir > 0 ? x + 4 : x - 4);
        tag.setAttribute('y', tagAbove ? y - 11 : y + 22);
        tag.setAttribute('text-anchor', dir > 0 ? 'start' : 'end');
      },
    };
  };
  const arrowPush = makeArrow('orange', 'push');
  const arrowFriction = makeArrow('red', 'friction');
  const arrowNet = makeArrow('violet', 'net force');
  const noNet = s('text.fc-tag', { 'text-anchor': 'middle', style: `fill:${hue('violet', 'text')}` }, 'net force 0');
  svg.append(mover, arrowPush.g, arrowFriction.g, arrowNet.g, noNet);

  /* --------------------------------------------------------------- graph */
  let pl = null;
  let gLine = null;
  let gDot = null;
  if (showGraph) {
    const vMax = spec.vMax || 20;
    pl = plane({ x: [0, duration], y: [0, vMax], width: W, height, pad: { l: 54, r: 18, t: SCENE_H + 8, b: 52 } });
    svg.appendChild(drawAxes(pl, { xStep: duration <= 10 ? 1 : undefined, yStep: niceStep(vMax, 4) }));
    const midY = (pl.top + pl.bottom) / 2;
    svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: height - 8, 'text-anchor': 'middle' }, 'time (s)'));
    svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, 'velocity (m/s)'));
    if (pushFor != null) {
      svg.appendChild(s('line', { x1: pl.sx(pushFor), x2: pl.sx(pushFor), y1: pl.top, y2: pl.bottom, stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
      svg.appendChild(s('text.fig-label-sm', { x: pl.sx(pushFor) + 6, y: pl.top + 14, style: `fill:${hue('orange', 'text')}` }, 'push ends'));
    }
    gLine = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    gDot = s('circle', { r: 7, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
    svg.append(gLine, gDot);
  }

  /* ------------------------------------------------------------ controls */
  const roNet = readout('net force', { color: 'violet' });
  const roV = readout('velocity', { digits: 1, unit: 'm/s', color: 'blue' });
  const roA = readout('acceleration', {});
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const logEl = h('ul.fc-log', { 'aria-label': 'Runs so far' });
  const sliders = {};
  let goBtn = null;
  let resetBtn = null;
  const changed = () => { anim.stop(); ran = false; t = 0; note.textContent = ''; render(); };
  if (!isStatic) {
    fr.readouts.append(roNet.el, roA.el, roV.el);
    if (ranges.push) {
      sliders.push = sliderRow({ label: 'push', min: ranges.push[0], max: ranges.push[1], step: ranges.push[2] || 1, value: push, color: 'orange', unit: 'N', onInput: (val) => { push = val; changed(); } });
      fr.controls.appendChild(sliders.push.el);
    }
    if (ranges.friction) {
      sliders.friction = sliderRow({ label: 'friction', min: ranges.friction[0], max: ranges.friction[1], step: ranges.friction[2] || 1, value: friction, color: 'red', unit: 'N', onInput: (val) => { friction = val; changed(); } });
      fr.controls.appendChild(sliders.friction.el);
    }
    if (ranges.mass) {
      sliders.mass = sliderRow({ label: 'mass', min: ranges.mass[0], max: ranges.mass[1], step: ranges.mass[2] || 1, value: mass, color: 'blue', unit: 'kg', onInput: (val) => { mass = val; changed(); } });
      fr.controls.appendChild(sliders.mass.el);
    }
    goBtn = button('Go', () => go(true), { icon: 'play', variant: 'primary' });
    resetBtn = button('Reset', () => {
      if (readOnly) return;
      anim.stop();
      push = initial.push; friction = initial.friction; mass = initial.mass;
      for (const key in sliders) sliders[key].set({ push, friction, mass }[key]);
      ran = false; t = 0; note.textContent = '';
      render();
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, resetBtn);
    if (spec.log) fr.el.appendChild(logEl);
    fr.el.appendChild(note);
  }

  function drawLog() {
    if (!spec.log) return;
    while (logEl.firstChild) logEl.removeChild(logEl.firstChild);
    for (const run of history.slice(-4)) {
      logEl.appendChild(h('li', `${formatNumber(run.push, 1)} N on ${formatNumber(run.mass, 1)} kg → ${formatNumber(run.a, 2)} m/s²`));
    }
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    t = Math.min(duration, t + dt * 1.2);
    if (t >= duration - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  function describe(f) {
    if (f.stopped && f.stopTime === 0) return 'It does not move: friction is holding it.';
    if (f.stopped) return `It came to rest after ${formatNumber(f.stopTime, 1)} s.`;
    if (f.distance > length) return 'It has left the picture, still going.';
    return '';
  }

  function finish(notify) {
    const f = facts();
    ran = true;
    t = duration;
    render();
    note.textContent = describe(f);
    if (notify) {
      play('tick');
      env.announce(`Run finished at ${formatNumber(f.vEnd, 1)} metres per second. ${note.textContent}`);
      env.onChange(getState());
    }
  }

  function go(count) {
    anim.stop();
    t = 0;
    ran = true;
    note.textContent = '';
    if (count && !readOnly) {
      history.push({ push, mass, friction, a: facts().a });
      drawLog();
    }
    if (reducedMotion()) { finish(count && !readOnly); return; }
    notifyAtEnd = count && !readOnly;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const f = facts();
    const { ph } = f;
    const active = anim.running || ran;
    const now = active ? t : 0;
    const q = phaseAt(ph, Math.min(now, duration - 1e-9));
    const x = xAt(ph, now);
    const v = vAt(ph, now);
    const px = sx(x);
    mover.setAttribute('transform', `translate(${px.toFixed(1)} ${GROUND - 1.5})`);
    massText.textContent = `${formatNumber(mass, 1)} kg`;

    // forces acting right now
    const pushNow = q.push;
    const moving = v > 1e-9;
    const frNow = moving ? friction : Math.min(pushNow, friction);
    const netNow = tidy(pushNow - frNow);
    const yBody = GROUND + bodyTop / 2 - 2;
    arrowPush.set(px + halfW + 4, yBody, pushNow, true);
    arrowFriction.set(px - halfW - 4, GROUND - 9, -frNow, true);
    arrowNet.set(px, GROUND + bodyTop - 14, netNow, true);
    const showZero = Math.abs(netNow) < 1e-9;
    noNet.setAttribute('visibility', showZero ? 'visible' : 'hidden');
    noNet.setAttribute('x', clamp(px, 70, W - 70));
    noNet.setAttribute('y', GROUND + bodyTop - 12);

    while (gMarks.firstChild) gMarks.removeChild(gMarks.firstChild);
    if (active) {
      for (let sec = 0; sec <= Math.min(now, duration) + 1e-9; sec++) {
        const mx = sx(xAt(ph, sec));
        if (mx > W - 10) break;
        gMarks.appendChild(s('circle', { cx: mx, cy: GROUND - 1.5, r: 4.5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      }
    }

    if (showGraph) {
      if (active) {
        let d = `M${pl.sx(0).toFixed(1)} ${pl.sy(Math.min(v0, pl.y1)).toFixed(1)}`;
        for (const seg of ph) {
          const end = Math.min(seg.t1, now);
          if (end <= seg.t0) break;
          d += `L${pl.sx(end).toFixed(1)} ${pl.sy(clamp(vAt(ph, end - 1e-12), 0, pl.y1 * 1.15)).toFixed(1)}`;
        }
        gLine.setAttribute('d', d);
      } else gLine.setAttribute('d', '');
      gDot.setAttribute('cx', pl.sx(now));
      gDot.setAttribute('cy', pl.sy(clamp(v, 0, pl.y1 * 1.15)));
    }

    roNet.set(netNow === 0 ? '0 N' : `${formatNumber(Math.abs(netNow), 2)} N ${netNow > 0 ? '→' : '←'}`);
    roV.set(v);
    roA.set(active ? `${formatNumber(q.a, 2)} m/s²` : '—');
    if (goBtn) goBtn.lastChild.textContent = ran && !anim.running ? 'Go again' : 'Go';
    if (resetBtn) resetBtn.disabled = readOnly;
    if (!isStatic) {
      svg.setAttribute('aria-label', `${spec.alt || `A ${formatNumber(mass, 1)} kilogram ${body} on a track`}. Push ${formatNumber(push, 1)} newtons, friction ${formatNumber(friction, 1)} newtons.${ran ? ` After ${duration} seconds it is moving at ${formatNumber(f.vEnd, 1)} metres per second.` : ''}`);
    }
  }

  function getState() {
    const f = facts();
    return {
      mass, push, friction, v0,
      net: f.net,
      a: f.a,
      ran,
      vEnd: f.vEnd,
      distance: f.distance,
      stopped: f.stopped,
      stopTime: f.stopTime,
      steady: f.steady,
      speedsUp: f.vEnd > v0 + 1e-9,
      slowsDown: f.vEnd < v0 - 1e-9,
      history: history.map((run) => ({ ...run })),
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
      const put = (key, val) => {
        if (typeof val !== 'number') return val;
        const range = ranges[key];
        const out = range ? clamp(val, range[0], range[1]) : val;
        if (sliders[key]) sliders[key].set(out);
        return out;
      };
      if (typeof next.push === 'number') push = put('push', next.push);
      if (typeof next.friction === 'number') friction = put('friction', next.friction);
      if (typeof next.mass === 'number') mass = put('mass', next.mass);
      if (Array.isArray(next.history)) {
        history = next.history.map((run) => {
          const p = run.push != null ? run.push : push;
          const m = run.mass != null ? run.mass : mass;
          const f = run.friction != null ? run.friction : friction;
          return { push: p, mass: m, friction: f, a: facts(p, f, m).a };
        });
      } else if (next.ran !== false && !isStatic) {
        history.push({ push, mass, friction, a: facts().a });
      }
      drawLog();
      if (next.ran === false) { ran = false; t = 0; render(); return; }
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
  { title: 'force-cart — push, friction and mass', spec: { type: 'force-cart', body: 'cart', mass: 2, push: 6, friction: 2, pushRange: [0, 12, 1], frictionRange: [0, 6, 1], massRange: [1, 6, 1], duration: 5, length: 80 } },
  { title: 'force-cart — a block gliding on ice', spec: { type: 'force-cart', body: 'block', mass: 2, v0: 6, push: 0, friction: 2, frictionRange: [0, 4, 1], duration: 6, length: 40, vMax: 8 } },
];
