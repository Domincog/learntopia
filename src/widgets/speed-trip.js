/**
 * speed-trip — a car on a road, right next to its distance–time graph.
 * The road runs up the left edge, so the car's position on the road is the
 * height of the graph. Two moments, A and B, mark a stretch of the trip: the
 * widget shows the distance covered (the rise), the time taken (the run) and
 * the average speed between them — the slope of the line through A and B.
 *
 * {
 *   type: 'speed-trip',
 *   fn: '2t^2',                 // distance as a function of time t
 *   t: [0, 6], d: [0, 80],      // window: time range and distance range
 *   tStep: 1, dStep: 10,        // tick spacing (automatic if omitted)
 *   units: { t: 's', d: 'm' },
 *
 *   mode: 'free',               // 'free': the learner drags both moments A and B
 *   a: 1, b: 3,                 //   starting moments
 *   snap: 0.5,                  //   A and B snap to multiples of this
 *   play: true,                 //   "Play the trip" button: the car drives while a dot rides the graph
 *
 *   // mode: 'gap'              // 'gap': A stays put and B sits a chosen gap after (or before) it
 *   // a: 5,                    //   the moment being examined
 *   // gaps: [1, 0.5, 0.1, 0.01],   one button per gap; each try is logged in a table
 *   // gap: 1,                  //   starting gap
 *   // side: 'after',           //   'after': from a to a + gap · 'before': from a − gap to a
 *   // dragA: false,            //   let the learner move A as well (snaps to `snap`)
 *   // lens: true,              //   magnifier that appears once A and B are too close to tell apart
 *
 *   markers: true,              // false: no A and B at all — just the car, the road and the graph
 *   time: 5,                    // with markers: false — freeze the car (and a dot on the graph) at this moment
 *   table: true,                // gap mode: log every gap tried in a table
 *   tangent: false,             // also draw the tangent at A (dashed)
 *   equation: true,             // show "average speed = distance ÷ time" under the graph
 *   static: false,              // true: picture only, nothing to drag or press
 * }
 *
 * State:
 *   free mode: { a, b, dt, dd, avg, played }      (with markers: false, just { played })
 *   gap mode:  { a, b, gap, dt, dd, avg, tried: [1, 0.5, …], smallest, triedAll }
 *     dt, dd   — time taken and distance covered between the two moments
 *     avg      — average speed, dd / dt
 *     played   — the trip animation has been run at least once
 *     tried    — the gaps used so far (largest first); smallest — the least of them
 *     triedAll — every gap button has been used
 */
import { frame, plane, drawAxes, handle, button, fnPath, clipTo, loop, svgPoint, hue, s, h, clamp, snapTo, tidy, formatNumber, mdInline, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

addStyles('speed-trip', `
  .widget-speed-trip .st-eq {
    display: grid;
    justify-items: center;
    justify-self: center;
    gap: 2px;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    font-size: 1.05rem;
  }
  .widget-speed-trip .st-eq-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-speed-trip .st-gaps { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-speed-trip .st-gaps-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-speed-trip .st-gaps .filter { padding-left: 0.75rem; padding-right: 0.75rem; }
  .widget-speed-trip .st-table { border-collapse: collapse; margin: 0 auto; font-size: var(--fs-sm); font-variant-numeric: tabular-nums; }
  .widget-speed-trip .st-table th, .widget-speed-trip .st-table td { padding: 0.35em 0.85em; text-align: right; border-bottom: 1px solid var(--hair); }
  .widget-speed-trip .st-table th { font-weight: 800; border-bottom: 2px solid var(--ink); white-space: nowrap; }
  .widget-speed-trip .st-table tr:last-child td { border-bottom: 0; }
  .widget-speed-trip .st-table td { font-family: var(--font-mono); font-weight: 600; white-space: nowrap; }
  .widget-speed-trip .st-table tr.is-todo td { color: var(--ink-3); }
  .widget-speed-trip .st-table tr.is-current td { background: var(--violet-soft); }
  .widget-speed-trip .st-table td.st-speed { font-weight: 800; }
  .widget-speed-trip .st-hit { cursor: ew-resize; }
  .widget-speed-trip.is-readonly .st-hit { cursor: default; }
  .widget-speed-trip.is-readonly .filter { pointer-events: none; }
  @media (max-width: 520px) {
    .widget-speed-trip .st-gaps-label { flex-basis: 100%; text-align: center; }
  }
`);

const W = 560;
const H = 400;
const ROAD = { x: 14, w: 48 };

const numText = (v, digits = 4) => formatNumber(v, digits).replace('−', '-');
let lensSeq = 0;

/** A small car seen from above, pointing up, centred on (0, 0). */
function carShape(color) {
  const g = s('g', { transform: 'scale(1.2)' });
  for (const [x, y] of [[-13, -12], [9, -12], [-13, 5], [9, 5]]) g.appendChild(s('rect', { x, y, width: 4, height: 8, rx: 1.5, fill: 'var(--ink)' }));
  g.appendChild(s('rect', { x: -10, y: -17, width: 20, height: 34, rx: 6, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
  g.appendChild(s('path', { d: 'M-6.5 -3 L-5 -10 H5 L6.5 -3 Z', fill: 'var(--surface)', stroke: 'var(--edge-strong)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
  g.appendChild(s('rect', { x: -5.5, y: 7, width: 11, height: 4.5, rx: 1.5, fill: 'var(--surface)', stroke: 'var(--edge-strong)', 'stroke-width': 1.5 }));
  return g;
}

export default function create(spec, env) {
  const [t0, t1] = spec.t || [0, 6];
  const [d0, d1] = spec.d || [0, 80];
  const units = { t: 's', d: 'm', ...(spec.units || {}) };
  const speedUnit = `${units.d}/${units.t}`;
  const mode = spec.mode === 'gap' ? 'gap' : 'free';
  const isStatic = !!spec.static || !!env.compact;
  const snap = spec.snap || 0.5;
  const side = spec.side === 'before' ? 'before' : 'after';
  const gaps = (spec.gaps || [1, 0.5, 0.1, 0.01]).slice().sort((p, q) => q - p);
  const markers = spec.markers !== false;
  const canDragA = markers && (mode === 'free' || !!spec.dragA);
  let readOnly = !!env.readOnly;

  const f = compile(spec.fn || '2t^2', { vars: ['t'] });
  const dist = (t) => { try { return f({ t }); } catch { return NaN; } };
  const slopeAt = (t) => { const e = (t1 - t0) * 1e-4; return (dist(t + e) - dist(t - e)) / (2 * e); };

  /* ------------------------------------------------------------- model */
  let a = spec.a != null ? spec.a : (mode === 'gap' ? t1 - 1 : t0 + 1);
  let b = spec.b != null ? spec.b : Math.min(t1, a + 2);
  let gap = spec.gap != null ? spec.gap : gaps[0];
  const tried = new Set(mode === 'gap' ? [gap] : []);
  let played = false;
  const frozen = !markers && spec.time != null;
  let now = frozen ? spec.time : mode === 'gap' ? null : t0;   // where the live car is (null: it sits at A)

  // In gap mode A must leave room for the widest gap; a draggable A also stays on the snap grid.
  const grid = (v, round) => (spec.dragA ? round(v / snap + (round === Math.floor ? 1e-9 : -1e-9)) * snap : v);
  const clampA = (v) => {
    if (mode === 'free') return clamp(v, t0, t1 - snap);
    return side === 'after' ? clamp(v, t0, grid(t1 - gaps[0], Math.floor)) : clamp(v, grid(t0 + gaps[0], Math.ceil), t1);
  };
  function settle() {
    if (mode === 'gap') { a = tidy(clampA(a)); b = tidy(side === 'after' ? a + gap : a - gap, 8); }
    else { a = tidy(clampA(a)); b = tidy(clamp(b, a + snap, t1)); }
  }
  settle();

  const measure = () => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const dt = hi - lo;
    const dd = dist(hi) - dist(lo);
    return { lo, hi, dt: tidy(dt, 8), dd: tidy(dd, 8), avg: tidy(dd / dt, 6) };
  };

  /* ------------------------------------------------------------ layers */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A car on a road beside its distance–time graph' });
  const { svg } = fr;
  const pl = plane({ x: [t0, t1], y: [d0, d1], width: W, height: H, pad: { l: 108, r: 18, t: 20, b: 38 } });
  const clip = clipTo(svg, pl);
  const roadMid = ROAD.x + ROAD.w / 2;
  const roadRight = ROAD.x + ROAD.w;

  // the road, with a painted mark at every labelled distance
  const gRoad = s('g');
  gRoad.appendChild(s('rect', { x: ROAD.x, y: pl.top - 12, width: ROAD.w, height: pl.ih + 24, rx: 9, fill: 'var(--gray-soft)', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
  svg.appendChild(gRoad);
  const axes = drawAxes(pl, { xStep: spec.tStep, yStep: spec.dStep, xLabel: `time (${units.t})`, yLabel: `distance (${units.d})` });
  svg.appendChild(axes);
  for (const line of axes.querySelectorAll('line.grid-line')) {
    if (line.getAttribute('y1') !== line.getAttribute('y2')) continue; // horizontal grid lines only
    const y = Number(line.getAttribute('y1'));
    gRoad.appendChild(s('line', { x1: ROAD.x + 2, x2: ROAD.x + 9, y1: y, y2: y, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
    gRoad.appendChild(s('line', { x1: roadRight - 9, x2: roadRight - 2, y1: y, y2: y, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
  }

  const gConn = s('g');
  const gCurve = s('g', { 'clip-path': clip });
  const gRoadDyn = s('g');
  const gLabels = s('g');
  const gLens = s('g');
  const gHandles = s('g');
  svg.append(gConn, gCurve, gRoadDyn, gLabels, gLens, gHandles);

  const dash = (color, width = 2.5, pattern = '6 6') => s('line', { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': pattern });
  const connA = dash('var(--ink-3)', 1.5, '3 5');
  const connB = dash('var(--ink-3)', 1.5, '3 5');
  const connNow = dash('var(--ink-3)', 1.5, '3 5');
  const dropNow = dash('var(--ink-3)', 1.5, '3 5');
  gConn.append(connA, connB, connNow, dropNow);

  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  curve.setAttribute('d', fnPath(dist, pl));
  const tangentLine = dash(hue('orange'), 2.5, '7 6');
  const secant = s('line', { stroke: hue('violet'), 'stroke-width': 3, 'stroke-linecap': 'round' });
  const runLeg = dash(hue('green'));
  const riseLeg = dash(hue('red'));
  gCurve.append(curve, tangentLine, secant, runLeg, riseLeg);
  if (!spec.tangent) tangentLine.setAttribute('visibility', 'hidden');

  // on the road: where the car is at A and at B, and the stretch between them
  const bracket = s('line', { stroke: hue('red'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const markA = s('line', { stroke: hue('orange'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const markB = s('line', { stroke: hue('violet'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const liveCar = s('g', carShape('red'));
  gRoadDyn.append(bracket, markA, markB, liveCar);
  const nowDot = s('circle', { r: 6, fill: hue('red'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
  gLabels.appendChild(nowDot);

  const label = (color, cls = 'fig-label') => { const el = s(`text.${cls}`, { style: `fill:${hue(color, 'text')}` }); gLabels.appendChild(el); return el; };
  const labelA = label('orange');
  const labelB = label('violet');
  const runLabel = label('green');
  const riseLabel = label('red');
  labelA.textContent = 'A';
  labelB.textContent = 'B';
  if (!markers) for (const el of [connA, connB, secant, runLeg, riseLeg, tangentLine, bracket, markA, markB, labelA, labelB, runLabel, riseLabel]) el.setAttribute('display', 'none');

  /* ----------------------------------------------------------- handles */
  /** Move moment A or B to the time under pixel `px` (snapped, kept in order). */
  function moveMoment(which, px) {
    if (readOnly) return;
    const v = tidy(snapTo(pl.ux(px), snap));
    const prev = which === 'A' ? a : b;
    if (which === 'A') a = mode === 'free' ? clamp(v, t0, b - snap) : v;
    else b = clamp(v, a + snap, t1);
    settle();
    if ((which === 'A' ? a : b) === prev) return;
    render();
    env.onChange(getState());
  }
  const makeHandle = (which, color) => handle(svg, {
    color,
    label: `Moment ${which}`,
    keyStep: snap * pl.kx,
    onMove: (px) => moveMoment(which, px),
  });
  const handleA = canDragA && !isStatic ? makeHandle('A', 'orange') : null;
  const handleB = markers && mode === 'free' && !isStatic ? makeHandle('B', 'violet') : null;
  const dotA = handleA ? null : s('circle', { r: 6.5, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
  const dotB = handleB ? null : s('circle', { r: 6.5, fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
  for (const el of [dotA, dotB]) if (el && markers) gHandles.appendChild(el);
  for (const hd of [handleB, handleA]) if (hd) gHandles.appendChild(hd.el);

  // Dragging (or tapping) anywhere on the graph moves the nearer moment, so
  // small handles are never a problem on a phone.
  if (handleA || handleB) {
    for (const g of [gConn, gCurve, gRoadDyn, gLabels, gLens]) g.setAttribute('pointer-events', 'none');
    const hit = s('rect.st-hit', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih, fill: 'transparent' });
    svg.insertBefore(hit, gConn);
    let scrub = null;
    hit.addEventListener('pointerdown', (ev) => {
      if (readOnly || ev.button > 0) return;
      const p = svgPoint(svg, ev);
      const which = !handleB ? 'A' : !handleA ? 'B' : (Math.abs(p.x - pl.sx(a)) <= Math.abs(p.x - pl.sx(b)) ? 'A' : 'B');
      scrub = { id: ev.pointerId, which };
      try { hit.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      moveMoment(which, p.x);
      ev.preventDefault();
    });
    hit.addEventListener('pointermove', (ev) => {
      if (!scrub || ev.pointerId !== scrub.id) return;
      moveMoment(scrub.which, svgPoint(svg, ev).x);
    });
    const end = (ev) => {
      if (!scrub || ev.pointerId !== scrub.id) return;
      scrub = null;
      try { hit.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
    };
    hit.addEventListener('pointerup', end);
    hit.addEventListener('pointercancel', end);
  }

  /* --------------------------------------------------------------- lens */
  const lensOn = mode === 'gap' && spec.lens !== false;
  const lensAt = (spec.lens && spec.lens.at) || [0.27, 0.3];
  const LR = 66;
  const lens = { cx: pl.left + lensAt[0] * pl.iw, cy: pl.top + lensAt[1] * pl.ih };
  let lensParts = null;
  if (lensOn) {
    const id = `st-lens-${++lensSeq}`;
    let defs = svg.querySelector('defs');
    if (!defs) { defs = s('defs'); svg.insertBefore(defs, svg.firstChild); }
    defs.appendChild(s('clipPath', { id }, s('circle', { cx: lens.cx, cy: lens.cy, r: LR })));
    const leader = s('line', { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round' });
    const inner = s('g', { 'clip-path': `url(#${id})` });
    const zCurve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    const zSecant = s('line', { stroke: hue('violet'), 'stroke-width': 3, 'stroke-linecap': 'round' });
    const zRun = dash(hue('green'));
    const zRise = dash(hue('red'));
    const zA = s('circle', { r: 6, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
    const zB = s('circle', { r: 6, fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
    inner.append(s('circle', { cx: lens.cx, cy: lens.cy, r: LR, fill: 'var(--surface)' }), zCurve, zSecant, zRun, zRise, zA, zB);
    const rim = s('circle', { cx: lens.cx, cy: lens.cy, r: LR, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const caption = s('text.fig-label-sm', { x: lens.cx, y: lens.cy + LR + 17, 'text-anchor': 'middle' });
    gLens.append(leader, inner, rim, caption);
    lensParts = { leader, zCurve, zSecant, zRun, zRise, zA, zB, caption };
  }

  /* ----------------------------------------------------------- controls */
  const eqMath = h('span.st-eq-math');
  const eq = h('div.st-eq', h('span.st-eq-label', mode === 'gap' && side === 'before' ? 'average speed from B to A' : 'average speed from A to B'), eqMath);
  if (spec.equation !== false && markers && !env.compact) fr.el.insertBefore(eq, fr.readouts);

  const chips = [];
  let rows = [];
  if (mode === 'gap' && !isStatic && gaps.length > 1) {
    const row = h('div.st-gaps', h('span.st-gaps-label', side === 'after' ? 'Gap after A:' : 'Gap before A:'));
    for (const g of gaps) {
      const chip = h('button.filter', { type: 'button', 'aria-pressed': 'false' }, `${numText(g)} ${units.t}`);
      chip.addEventListener('click', () => {
        if (readOnly || gap === g) return;
        gap = g;
        tried.add(g);
        settle();
        play('select');
        render();
        const m = measure();
        env.announce(`Gap ${numText(g)} ${units.t}: average speed ${numText(m.avg)} ${speedUnit}`);
        env.onChange(getState());
      });
      chips.push({ g, chip });
      row.appendChild(chip);
    }
    fr.controls.appendChild(row);
  }
  if (mode === 'gap' && !env.compact && spec.table !== false) {
    const body = h('tbody');
    rows = gaps.map((g) => {
      const cells = [h('td'), h('td'), h('td.st-speed')];
      const tr = h('tr', cells);
      body.appendChild(tr);
      return { g, tr, cells };
    });
    fr.el.appendChild(h('table.st-table',
      h('thead', h('tr', h('th', 'gap'), h('th', 'distance'), h('th', 'average speed'))),
      body));
  }

  let playBtn = null;
  const anim = loop((dt) => {
    now = Math.min(t1, now + dt * (t1 - t0) / Math.max(2.5, (t1 - t0) * 0.75));
    if (now >= t1) { anim.stop(); finishPlay(); }
    renderNow();
  });
  function finishPlay() {
    now = t1;
    if (playBtn) playBtn.lastChild.textContent = 'Play again';
    env.announce('The car has reached the end of the trip.');
  }
  if (mode === 'free' && spec.play !== false && !isStatic) {
    playBtn = button('Play the trip', () => {
      if (readOnly) return;
      played = true;
      play('tap');
      if (reducedMotion()) { anim.stop(); finishPlay(); renderNow(); } else { now = t0; anim.stop(); anim.start(); }
      env.onChange(getState());
    }, { icon: 'play' });
    fr.buttons.appendChild(playBtn);
  }

  /* ------------------------------------------------------------- render */
  const setLine = (el, x1, y1, x2, y2) => { el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2); };
  const show = (el, on) => el.setAttribute('visibility', on ? 'visible' : 'hidden');

  function renderNow() {
    const t = now == null ? a : now;
    const y = pl.sy(dist(t));
    liveCar.setAttribute('transform', `translate(${roadMid} ${y})`);
    const riding = now != null && (frozen || anim.running || (played && now > t0));
    show(nowDot, riding);
    show(connNow, riding);
    show(dropNow, riding);
    if (riding) {
      nowDot.setAttribute('cx', pl.sx(t));
      nowDot.setAttribute('cy', y);
      setLine(connNow, roadRight, y, pl.sx(t), y);
      setLine(dropNow, pl.sx(t), y, pl.sx(t), pl.bottom);
    }
  }

  function renderLens(m) {
    if (!lensParts) return;
    const gapPx = (m.hi - m.lo) * pl.kx;
    const on = gapPx < 30;
    show(gLens, on);
    if (!on) return;
    // uniform magnification of the screen picture around the middle of A–B
    const sep = Math.hypot((m.hi - m.lo) * pl.kx, m.dd * pl.ky);
    const M = (LR * 0.95) / sep;
    const tm = (m.lo + m.hi) / 2;
    const dm = (dist(m.lo) + dist(m.hi)) / 2;
    const zx = (t) => lens.cx + (t - tm) * pl.kx * M;
    const zy = (d) => lens.cy - (d - dm) * pl.ky * M;
    const reach = (LR * 1.2) / (pl.kx * M);
    let d = '';
    for (let i = 0; i <= 40; i++) {
      const t = tm - reach + (2 * reach * i) / 40;
      d += `${i ? 'L' : 'M'}${zx(t).toFixed(2)} ${zy(dist(t)).toFixed(2)}`;
    }
    lensParts.zCurve.setAttribute('d', d);
    const slope = m.dd / m.dt;
    setLine(lensParts.zSecant, zx(tm - reach), zy(dm - slope * reach), zx(tm + reach), zy(dm + slope * reach));
    setLine(lensParts.zRun, zx(m.lo), zy(dist(m.lo)), zx(m.hi), zy(dist(m.lo)));
    setLine(lensParts.zRise, zx(m.hi), zy(dist(m.lo)), zx(m.hi), zy(dist(m.hi)));
    lensParts.zA.setAttribute('cx', zx(a)); lensParts.zA.setAttribute('cy', zy(dist(a)));
    lensParts.zB.setAttribute('cx', zx(b)); lensParts.zB.setAttribute('cy', zy(dist(b)));
    // leader from the rim of the lens to the real point
    const px = pl.sx(a);
    const py = pl.sy(dist(a));
    const ang = Math.atan2(py - lens.cy, px - lens.cx);
    setLine(lensParts.leader, lens.cx + Math.cos(ang) * LR, lens.cy + Math.sin(ang) * LR, px, py);
    lensParts.caption.textContent = `zoomed in ×${M >= 10 ? Math.round(M) : formatNumber(M, 1)}`;
  }

  function render() {
    const m = measure();
    const ax = pl.sx(a); const ay = pl.sy(dist(a));
    const bx = pl.sx(b); const by = pl.sy(dist(b));
    const lox = pl.sx(m.lo); const loy = pl.sy(dist(m.lo));
    const hix = pl.sx(m.hi); const hiy = pl.sy(dist(m.hi));

    // secant through A and B, run and rise
    const slope = m.dd / m.dt;
    const span = t1 - t0;
    setLine(secant, pl.sx(m.lo - span), pl.sy(dist(m.lo) - slope * span), pl.sx(m.lo + span), pl.sy(dist(m.lo) + slope * span));
    setLine(runLeg, lox, loy, hix, loy);
    setLine(riseLeg, hix, loy, hix, hiy);
    if (spec.tangent) {
      const k = slopeAt(a);
      setLine(tangentLine, pl.sx(a - span), pl.sy(dist(a) - k * span), pl.sx(a + span), pl.sy(dist(a) + k * span));
    }

    // labels on the two legs (hidden when the triangle is too small to hold them)
    const runPx = hix - lox;
    const risePx = Math.abs(loy - hiy);
    show(runLabel, runPx >= 44);
    show(riseLabel, risePx >= 26 && runPx >= 20);
    runLabel.textContent = `${numText(m.dt)} ${units.t}`;
    runLabel.setAttribute('text-anchor', 'middle');
    runLabel.setAttribute('x', (lox + hix) / 2);
    runLabel.setAttribute('y', loy < pl.bottom - 30 ? loy + 20 : loy - 9);
    riseLabel.textContent = `${numText(m.dd, 6)} ${units.d}`;
    const roomRight = hix < pl.right - 70;
    riseLabel.setAttribute('text-anchor', roomRight ? 'start' : 'end');
    riseLabel.setAttribute('x', hix + (roomRight ? 10 : -10));
    riseLabel.setAttribute('y', (loy + hiy) / 2 + 5);

    // the letters sit above-left of their points, clear of the curve
    const place = (el, x, y) => {
      const left = x - 14 > pl.left + 6;
      el.setAttribute('text-anchor', left ? 'end' : 'start');
      el.setAttribute('x', x + (left ? -13 : 13));
      el.setAttribute('y', Math.max(pl.top + 14, y - 11));
    };
    place(labelA, ax, ay);
    place(labelB, bx, by);
    show(labelB, Math.abs(bx - ax) >= 24);

    // road: marks at A and B, the stretch between, dotted links to the graph
    setLine(markA, ROAD.x + 5, ay, roadRight - 5, ay);
    setLine(markB, ROAD.x + 5, by, roadRight - 5, by);
    setLine(bracket, ROAD.x - 7, loy, ROAD.x - 7, hiy);
    setLine(connA, roadRight, ay, ax, ay);
    setLine(connB, roadRight, by, bx, by);

    if (handleA) { handleA.set(ax, ay); handleA.setLabel(`time ${numText(a)} ${units.t}, distance ${numText(dist(a))} ${units.d}`); }
    if (handleB) { handleB.set(bx, by); handleB.setLabel(`time ${numText(b)} ${units.t}, distance ${numText(dist(b))} ${units.d}`); }
    if (dotA) { dotA.setAttribute('cx', ax); dotA.setAttribute('cy', ay); }
    if (dotB) { dotB.setAttribute('cx', bx); dotB.setAttribute('cy', by); }

    renderLens(m);
    renderNow();

    eqMath.innerHTML = mdInline(`$\\dfrac{\\red{${numText(m.dd, 6)}\\text{ ${units.d}}}}{\\green{${numText(m.dt)}\\text{ ${units.t}}}} = \\violet{${numText(m.avg)}\\text{ ${speedUnit}}}$`);

    for (const { g, chip } of chips) chip.setAttribute('aria-pressed', String(g === gap));
    for (const { g, tr, cells } of rows) {
      const done = tried.has(g);
      tr.classList.toggle('is-todo', !done);
      tr.classList.toggle('is-current', g === gap);
      cells[0].textContent = `${numText(g)} ${units.t}`;
      if (done) {
        const lo = side === 'after' ? a : a - g;
        const dd = dist(lo + g) - dist(lo);
        cells[1].textContent = `${numText(tidy(dd, 8), 6)} ${units.d}`;
        cells[2].textContent = `${numText(tidy(dd / g, 6))} ${speedUnit}`;
      } else {
        cells[1].textContent = '?';
        cells[2].textContent = '?';
      }
    }

    svg.setAttribute('aria-label', !markers ? (spec.alt || 'A car on a road beside its distance–time graph')
      : `${spec.alt ? spec.alt + ' ' : ''}Moment A at ${numText(a)} ${units.t}, moment B at ${numText(b)} ${units.t}. `
        + `Distance covered ${numText(m.dd, 6)} ${units.d} in ${numText(m.dt)} ${units.t}: average speed ${numText(m.avg)} ${speedUnit}.`);
  }

  function getState() {
    if (!markers) return { played };
    const m = measure();
    const out = { a, b, dt: m.dt, dd: m.dd, avg: m.avg };
    if (mode === 'gap') {
      const list = Array.from(tried).sort((p, q) => q - p);
      Object.assign(out, { gap, tried: list, smallest: list[list.length - 1], triedAll: gaps.every((g) => tried.has(g)) });
    } else out.played = played;
    return out;
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.a === 'number') a = next.a;
      if (mode === 'gap') {
        if (Array.isArray(next.tried)) { tried.clear(); for (const g of next.tried) if (gaps.includes(g)) tried.add(g); }
        if (typeof next.gap === 'number' && gaps.includes(next.gap)) gap = next.gap;
        else if (tried.size) gap = Math.min(...tried);
        tried.add(gap);
      } else {
        if (typeof next.b === 'number') b = next.b;
        if (next.played != null) played = !!next.played;
        if (played) { anim.stop(); now = t1; if (playBtn) playBtn.lastChild.textContent = 'Play again'; }
      }
      settle();
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const hd of [handleA, handleB]) if (hd) hd.setEnabled(!readOnly);
      for (const { chip } of chips) chip.disabled = readOnly;
      if (playBtn) playBtn.disabled = readOnly;
      if (readOnly && anim.running) { anim.stop(); finishPlay(); renderNow(); }
    },
    destroy() {
      anim.stop();
      for (const hd of [handleA, handleB]) if (hd) hd.destroy();
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'speed-trip — drag two moments, read the average speed', spec: { type: 'speed-trip', fn: '2t^2', t: [0, 6], d: [0, 80], dStep: 10, a: 1, b: 3 } },
  { title: 'speed-trip — shrink the gap at one moment', spec: { type: 'speed-trip', mode: 'gap', fn: '2t^2', t: [0, 6], d: [0, 80], dStep: 10, a: 5, gaps: [1, 0.5, 0.1, 0.01] } },
];
