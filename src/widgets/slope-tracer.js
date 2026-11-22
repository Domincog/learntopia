/**
 * slope-tracer — slide a point along a curve and watch its slope being
 * recorded. The top panel shows the curve with its tangent at the point; the
 * bottom panel plots the slope measured at every x you visit. Sweep the whole
 * curve and the recorded slopes draw a new curve: the derivative.
 *
 * {
 *   type: 'slope-tracer',
 *   fn: 'x^2',                 // the curve, an expression in x
 *   x: [-3, 3], y: [-1, 9],    // window of the top panel
 *   dy: [-7, 7],               // slope range of the bottom panel (automatic if omitted)
 *   xStep: 1, yStep: 2, dyStep: 2,   // tick spacing (automatic if omitted)
 *   start: -2,                 // where the point starts
 *   snap: 1,                   // the point snaps to multiples of this; slopes are then
 *                              //   recorded as separate dots instead of a continuous trace
 *   targets: [0, 1, 2, 3],     // with snap: the x values the learner is asked to measure
 *   table: true,               // with snap: show the measurements in a table as well
 *   labels: { f: 'the curve y = x²', d: 'its slope at each x' },   // panel titles
 *   triangle: true,            // draw the "1 across, slope up" triangle at the point
 *   reveal: false,             // true: start with the whole slope curve already traced
 *   static: false,             // true: picture only, nothing to drag
 * }
 *
 * State: { x, slope, coverage, measured: { "1": 2, "2": 4 }, done }
 *   x, slope  — where the point is and the slope of the curve there
 *   coverage  — fraction (0–1) of the x-range that has been traced
 *   measured  — with snap: the slope recorded at each visited x
 *   done      — every target has been measured (or, without targets, coverage ≥ 0.9)
 * setState also accepts { traced: true } to mark the whole curve as traced.
 */
import { frame, plane, drawAxes, handle, readout, fnPath, svgPoint, niceStep, hue, s, h, clamp, snapTo, tidy, formatNumber, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';

addStyles('slope-tracer', `
  .widget-slope-tracer .sl-hit { cursor: ew-resize; }
  .widget-slope-tracer.is-readonly .sl-hit { cursor: default; }
  .widget-slope-tracer .sl-table { border-collapse: collapse; margin: 0 auto; font-size: var(--fs-sm); font-variant-numeric: tabular-nums; }
  .widget-slope-tracer .sl-table th, .widget-slope-tracer .sl-table td { padding: 0.3em 0.7em; text-align: center; border: 1px solid var(--hair); min-width: 2.6em; }
  .widget-slope-tracer .sl-table th { font-weight: 800; text-align: right; white-space: nowrap; border-left: 0; }
  .widget-slope-tracer .sl-table td { font-family: var(--font-mono); font-weight: 700; }
  .widget-slope-tracer .sl-table td:last-child { border-right: 0; }
  .widget-slope-tracer .sl-table tr:first-child th, .widget-slope-tracer .sl-table tr:first-child td { border-top: 0; }
  .widget-slope-tracer .sl-table tr:last-child th, .widget-slope-tracer .sl-table tr:last-child td { border-bottom: 0; }
  .widget-slope-tracer .sl-table tr.sl-slopes td { color: var(--orange-text); }
  .widget-slope-tracer .sl-table td.is-todo { color: var(--ink-3); font-weight: 500; }
  .widget-slope-tracer .sl-table td.is-current { background: var(--orange-soft); }
`);

const W = 560;
const H = 498;
const TOP = { t: 26, b: 240 };
const BOT = { t: 290, b: 474 };
const PAD_L = 46;
const PAD_R = 16;

let clipSeq = 0;

export default function create(spec, env) {
  const [x0, x1] = spec.x || [-3, 3];
  const yRange = spec.y || [-1, 9];
  const f = compile(spec.fn || 'x^2', { vars: ['x'] });
  const fy = (x) => { try { return f({ x }); } catch { return NaN; } };
  const eps = (x1 - x0) * 1e-4;
  const slopeAt = (x) => (fy(x + eps) - fy(x - eps)) / (2 * eps);

  const snap = spec.snap || 0;
  const isStatic = !!spec.static || !!env.compact;
  const labels = { f: 'the curve', d: 'its slope at each x', ...(spec.labels || {}) };
  let readOnly = !!env.readOnly;

  // slope range of the bottom panel
  let dyRange = spec.dy;
  if (!dyRange) {
    let lo = 0;
    let hi = 0;
    for (let i = 0; i <= 120; i++) { const m = slopeAt(x0 + ((x1 - x0) * i) / 120); if (Number.isFinite(m)) { lo = Math.min(lo, m); hi = Math.max(hi, m); } }
    const step = niceStep(hi - lo || 1, 4);
    dyRange = [Math.floor(lo / step - 0.2) * step, Math.ceil(hi / step + 0.2) * step];
  }

  /* ------------------------------------------------------------- model */
  const fit = (v) => tidy(clamp(snap ? snapTo(v, snap) : v, snap ? Math.ceil(x0 / snap - 1e-9) * snap : x0, snap ? Math.floor(x1 / snap + 1e-9) * snap : x1));
  let x = fit(spec.start != null ? spec.start : x0 + (x1 - x0) * 0.2);
  const snapPoints = [];
  if (snap) for (let v = Math.ceil(x0 / snap - 1e-9) * snap; v <= x1 + 1e-9; v += snap) snapPoints.push(tidy(v));
  const targets = snap ? (spec.targets || snapPoints).map((v) => tidy(v)) : [];
  const measured = new Set();        // snap mode: x values visited
  const BINS = 240;                  // continuous mode: which slices of the x-range were traced
  const seen = new Uint8Array(BINS);
  const binOf = (v) => clamp(Math.floor(((v - x0) / (x1 - x0)) * BINS), 0, BINS - 1);
  const revealAll = !!spec.reveal;

  function record(from, to) {
    if (snap) { measured.add(to); return; }
    const a = binOf(Math.min(from, to));
    const b = binOf(Math.max(from, to));
    for (let i = a; i <= b; i++) seen[i] = 1;
  }
  record(x, x);
  const coverage = () => {
    if (revealAll) return 1;
    if (snap) return targets.length ? targets.filter((v) => measured.has(v)).length / targets.length : 1;
    let n = 0;
    for (let i = 0; i < BINS; i++) n += seen[i];
    return n / BINS;
  };

  /* ------------------------------------------------------------ layers */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A curve with a movable tangent, and a record of its slope' });
  const { svg } = fr;
  const top = plane({ x: [x0, x1], y: yRange, width: W, height: H, pad: { l: PAD_L, r: PAD_R, t: TOP.t, b: H - TOP.b } });
  const bot = plane({ x: [x0, x1], y: dyRange, width: W, height: H, pad: { l: PAD_L, r: PAD_R, t: BOT.t, b: H - BOT.b } });
  const defs = s('defs');
  const clipTop = `sl-clip-${++clipSeq}`;
  const clipBot = `sl-clip-${++clipSeq}`;
  defs.append(
    s('clipPath', { id: clipTop }, s('rect', { x: top.left, y: top.top, width: top.iw, height: top.ih })),
    s('clipPath', { id: clipBot }, s('rect', { x: bot.left, y: bot.top, width: bot.iw, height: bot.ih })),
  );
  svg.appendChild(defs);
  const xStep = spec.xStep || niceStep(x1 - x0, 6.5);
  svg.appendChild(drawAxes(top, { xStep, yStep: spec.yStep }));
  svg.appendChild(drawAxes(bot, { xStep, yStep: spec.dyStep }));
  svg.appendChild(s('text.fig-label', { x: top.left, y: TOP.t - 9, style: `fill:${hue('blue', 'text')}` }, labels.f));
  svg.appendChild(s('text.fig-label', { x: bot.left, y: BOT.t - 9, style: `fill:${hue('orange', 'text')}` }, labels.d));

  const hitTop = s('rect.sl-hit', { x: top.left, y: top.top, width: top.iw, height: top.ih, fill: 'transparent' });
  const hitBot = s('rect.sl-hit', { x: bot.left, y: bot.top, width: bot.iw, height: bot.ih, fill: 'transparent' });
  const gTop = s('g', { 'clip-path': `url(#${clipTop})`, 'pointer-events': 'none' });
  const gBot = s('g', { 'clip-path': `url(#${clipBot})`, 'pointer-events': 'none' });
  const gOver = s('g', { 'pointer-events': 'none' });
  const gHandles = s('g');
  svg.append(hitTop, hitBot, gTop, gBot, gOver, gHandles);

  const dash = (color, width = 2.5, pattern = '6 6') => s('line', { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': pattern });
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: fnPath(fy, top) });
  const tangent = s('line', { stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round' });
  const runLeg = dash(hue('green'));
  const riseLeg = dash(hue('red'));
  gTop.append(curve, runLeg, riseLeg, tangent);
  const runLabel = s('text.fig-label-sm', { 'text-anchor': 'middle', style: `fill:${hue('green', 'text')}` }, '1');
  const riseLabel = s('text.fig-label-sm', { style: `fill:${hue('red', 'text')}` });

  const trail = s('path', { fill: 'none', stroke: hue('orange'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const gDots = s('g', { 'pointer-events': 'none' });
  gBot.append(trail);

  const guide = dash('var(--ink-3)', 1.5, '3 5');
  const nowDot = s('circle', { r: 7, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
  const fixedDot = isStatic ? s('circle', { r: 7, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }) : null;
  gOver.append(guide, gDots, runLabel, riseLabel, nowDot);
  if (fixedDot) gOver.appendChild(fixedDot);

  /* ----------------------------------------------------------- controls */
  const roX = readout('$x$', { digits: 2 });
  const roSlope = readout('slope here', { digits: 2, color: 'orange' });
  if (!env.compact) fr.readouts.append(roX.el, roSlope.el);

  let cells = null;
  if (snap && spec.table && !env.compact) {
    const head = h('tr', h('th', 'x'));
    const row = h('tr.sl-slopes', h('th', 'slope'));
    cells = targets.map((v) => {
      const td = h('td.is-todo', '?');
      head.appendChild(h('td', formatNumber(v, 2)));
      row.appendChild(td);
      return { v, td };
    });
    fr.el.appendChild(h('table.sl-table', h('tbody', head, row)));
  }

  /** Move the point to maths coordinate `v`; `sweep` marks everything passed on the way as traced. */
  function moveTo(v, sweep) {
    if (readOnly) return;
    const next = fit(v);
    if (next === x) return;
    const far = Math.abs(next - x) * top.kx > 100;   // a jump this big is a tap somewhere else, not a sweep
    record(sweep && !far ? x : next, next);
    x = next;
    render();
    env.onChange(getState());
  }

  const hd = isStatic ? null : handle(svg, {
    color: 'orange',
    label: 'Point on the curve',
    keyStep: Math.max(4, (snap || (x1 - x0) / 60) * top.kx),
    onMove: (px) => moveTo(top.ux(px), true),
  });
  if (hd) gHandles.appendChild(hd.el);

  // drag or tap anywhere in either panel to move the point
  if (!isStatic) {
    for (const hit of [hitTop, hitBot]) {
      let active = null;
      hit.addEventListener('pointerdown', (ev) => {
        if (readOnly || ev.button > 0) return;
        active = ev.pointerId;
        try { hit.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
        moveTo(top.ux(svgPoint(svg, ev).x), false);
        ev.preventDefault();
      });
      hit.addEventListener('pointermove', (ev) => { if (active === ev.pointerId) moveTo(top.ux(svgPoint(svg, ev).x), true); });
      const end = (ev) => {
        if (active !== ev.pointerId) return;
        active = null;
        try { hit.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      };
      hit.addEventListener('pointerup', end);
      hit.addEventListener('pointercancel', end);
    }
  }

  /* ------------------------------------------------------------- render */
  const setLine = (el, xa, ya, xb, yb) => { el.setAttribute('x1', xa); el.setAttribute('y1', ya); el.setAttribute('x2', xb); el.setAttribute('y2', yb); };
  const show = (el, on) => el.setAttribute('visibility', on ? 'visible' : 'hidden');

  function renderTrail() {
    while (gDots.firstChild) gDots.removeChild(gDots.firstChild);
    if (snap) {
      trail.setAttribute('d', '');
      for (const v of snapPoints) {
        if (!measured.has(v) && !revealAll) continue;
        const m = slopeAt(v);
        if (Number.isFinite(m) && m >= dyRange[0] - 1e-9 && m <= dyRange[1] + 1e-9) gDots.appendChild(s('circle', { cx: bot.sx(v), cy: bot.sy(m), r: 5.5, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
      }
      return;
    }
    let d = '';
    let pen = false;
    for (let i = 0; i < BINS; i++) {
      if (!seen[i] && !revealAll) { pen = false; continue; }
      // each traced slice is drawn edge to edge so neighbouring slices join up
      for (const u of pen ? [i + 1] : [i, i + 1]) {
        const v = x0 + ((x1 - x0) * u) / BINS;
        const m = slopeAt(v);
        if (!Number.isFinite(m)) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${bot.sx(v).toFixed(2)} ${bot.sy(clamp(m, dyRange[0] * 3 - 1, dyRange[1] * 3 + 1)).toFixed(2)}`;
        pen = true;
      }
    }
    trail.setAttribute('d', d);
  }

  function render() {
    const y = fy(x);
    const m = tidy(slopeAt(x), 4);
    const px = top.sx(x);
    const py = top.sy(y);
    const span = x1 - x0;
    setLine(tangent, top.sx(x - span), top.sy(y - m * span), top.sx(x + span), top.sy(y + m * span));

    // "1 across, m up" triangle; it flips to the left where the right-hand edge is too close
    const dir = top.sx(x + 1) <= top.right - 44 ? 1 : -1;
    const cornerX = top.sx(x + dir);
    const endY = top.sy(y + dir * m);
    const triangle = spec.triangle !== false;
    setLine(runLeg, px, py, cornerX, py);
    setLine(riseLeg, cornerX, py, cornerX, endY);
    show(runLeg, triangle);
    show(riseLeg, triangle);
    const risePx = Math.abs(endY - py);
    const midY = (py + endY) / 2;
    const below = m * dir >= 0;      // the run leg lies below the tangent
    runLabel.setAttribute('x', (px + cornerX) / 2);
    runLabel.setAttribute('y', below ? py + 15 : py - 7);
    show(runLabel, triangle && py > top.top + 16 && py < top.bottom - (below ? 16 : 2));
    riseLabel.textContent = formatNumber(m, 2);
    riseLabel.setAttribute('text-anchor', dir > 0 ? 'start' : 'end');
    riseLabel.setAttribute('x', cornerX + dir * 7);
    riseLabel.setAttribute('y', clamp(midY, top.top + 12, top.bottom - 6) + 4);
    show(riseLabel, triangle && risePx >= 22 && cornerX + dir * 44 > top.left && cornerX + dir * 44 < W - 2);

    renderTrail();
    const inRange = Number.isFinite(m) && m >= dyRange[0] - 1e-9 && m <= dyRange[1] + 1e-9;
    const qy = bot.sy(clamp(m, dyRange[0], dyRange[1]));
    nowDot.setAttribute('cx', px);
    nowDot.setAttribute('cy', qy);
    show(nowDot, inRange);
    setLine(guide, px, clamp(py, top.top, top.bottom), px, inRange ? qy : bot.top);
    if (hd) { hd.set(px, clamp(py, top.top, top.bottom)); hd.setLabel(`x ${formatNumber(x, 2)}, slope ${formatNumber(m, 2)}`); }
    if (fixedDot) { fixedDot.setAttribute('cx', px); fixedDot.setAttribute('cy', py); }

    roX.set(x);
    roSlope.set(m);
    if (cells) {
      for (const { v, td } of cells) {
        const done = measured.has(v) || revealAll;
        td.textContent = done ? formatNumber(tidy(slopeAt(v), 4), 2) : '?';
        td.classList.toggle('is-todo', !done);
        td.classList.toggle('is-current', v === x);
      }
    }
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Point at x = ${formatNumber(x, 2)}: the slope of the curve there is ${formatNumber(m, 2)}. `
      + (snap ? `${measured.size} slope${measured.size === 1 ? '' : 's'} measured.` : `${Math.round(coverage() * 100)}% of the curve traced.`));
  }

  function getState() {
    const out = { x, slope: tidy(slopeAt(x), 4), coverage: tidy(coverage(), 3), measured: {} };
    if (snap) for (const v of snapPoints) if (measured.has(v) || revealAll) out.measured[String(v)] = tidy(slopeAt(v), 4);
    out.done = snap && targets.length ? targets.every((v) => measured.has(v) || revealAll) : out.coverage >= 0.9;
    return out;
  }

  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.x === 'number') x = fit(next.x);
      if (next.traced || next.done) {
        seen.fill(1);
        for (const v of snapPoints) measured.add(v);
      }
      if (next.measured && snap) for (const key of Object.keys(next.measured)) measured.add(tidy(Number(key)));
      record(x, x);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'slope-tracer — sweep the curve to draw its derivative', spec: { type: 'slope-tracer', fn: '4 - x^2', x: [-3, 3], y: [-6, 5], dy: [-7, 7], labels: { f: 'a hill', d: 'its slope at each x' } } },
  { title: 'slope-tracer — measure slopes at whole numbers', spec: { type: 'slope-tracer', fn: 'x^2', x: [-3, 3], y: [-1, 9], dy: [-7, 7], snap: 1, start: 0, targets: [0, 1, 2, 3], table: true } },
];
