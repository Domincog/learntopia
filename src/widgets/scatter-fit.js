/**
 * scatter-fit — a scatter plot you can push around. It shows the points, the
 * least-squares line and the correlation coefficient r. Points can be
 * dragged (watch one outlier wreck r), the learner can lay their own line
 * through the cloud and compare it with the best fit, and a slider can morph
 * a random cloud through every correlation from −1 to +1.
 *
 * {
 *   type: 'scatter-fit',
 *   x: [0, 10], y: [0, 10],                  // window
 *   xLabel: 'temperature (°C)', yLabel: 'ice creams sold', xStep: 2, yStep: 2,
 *   points: [[1, 2], [2.5, 3.1], …],
 *   drag: false,                             // true: every point · [8]: only these (drawn in orange)
 *   snap: 0.5,                               // grid that dragged points snap to (or [xSnap, ySnap])
 *   fit: false,                              // least-squares line: true · 'reveal' (appears once the step is resolved)
 *   r: false,                                // readout of r: true · 'reveal'
 *   line: { left: 2, right: 8, snap: 0.25 }, // a line the learner fits by eye: the heights of its two end handles
 *   gaps: true,                              // draw the vertical gap from every point to the learner's line
 *   cloud: { n: 40, r: 0.6, slider: true },  // instead of `points`: a random cloud with exactly this correlation
 *   numbers: true,                           // false hides the numbers on the axes (for abstract clouds)
 *   color: 'blue', height: 400,
 * }
 *
 * State: { points, n, r, slope, intercept, line, cloud }
 *   r, slope, intercept — of the least-squares line through the points (r is null when it is undefined)
 *   line  — the learner's line, or null: { left, right, slope, intercept, gap, best, excess, tilt, offset }
 *             gap    typical (root-mean-square) vertical distance from the points to this line
 *             best   the same for the least-squares line, the smallest it can be
 *             excess how much larger the mean squared gap is than the best possible (0 = perfect, 0.5 = 50% more)
 *             tilt   its slope minus the best slope · offset: its height minus the best line's, at the mean x
 *   cloud — the correlation set on the slider (null without a cloud)
 *
 * setState accepts { points }, { line: { left, right } } and { cloud }.
 */
import { frame, plane, drawAxes, handle, sliderRow, readout, clipTo, hue, s, clamp, snapTo, tidy, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('scatter-fit', `
  .widget-scatter-fit .sf-dot { stroke: var(--edge-strong); stroke-width: 2; }
  .widget-scatter-fit .sf-gap { stroke: var(--red); stroke-width: 2; stroke-linecap: round; opacity: 0.75; }
  @media (max-width: 520px) { .widget-scatter-fit .w-canvas .fig-label { font-size: 16px; } }
`);

/** Least-squares line and correlation of [[x, y], …]. */
export function regress(points) {
  const n = points.length;
  let mx = 0;
  let my = 0;
  for (const [x, y] of points) { mx += x; my += y; }
  mx /= n || 1;
  my /= n || 1;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [x, y] of points) { sxx += (x - mx) * (x - mx); syy += (y - my) * (y - my); sxy += (x - mx) * (y - my); }
  const slope = sxx > 1e-12 ? sxy / sxx : 0;
  return {
    n, mx, my, slope, intercept: my - slope * mx,
    r: sxx > 1e-12 && syy > 1e-12 ? sxy / Math.sqrt(sxx * syy) : null,
    mse: n ? Math.max(0, (syy - slope * sxy) / n) : 0,
  };
}

/** n standard scores (mean 0, SD 1) from an rng, none far out in the tails. */
function scores(rng, n) {
  const raw = [];
  while (raw.length < n) {
    const z = Math.sqrt(-2 * Math.log(Math.max(rng.next(), 1e-12))) * Math.cos(2 * Math.PI * rng.next());
    if (Math.abs(z) <= 2.1) raw.push(z);
  }
  const m = raw.reduce((t, v) => t + v, 0) / n;
  const sd = Math.sqrt(raw.reduce((t, v) => t + (v - m) * (v - m), 0) / n) || 1;
  return raw.map((v) => (v - m) / sd);
}

export default function create(spec, env) {
  const compact = !!env.compact;
  const phone = !compact && typeof matchMedia === 'function' && matchMedia('(max-width: 520px)').matches;
  const W = compact ? 300 : phone ? 440 : 560;
  const H = spec.height || (compact ? 170 : phone ? 370 : 400);
  const xr = spec.x || [0, 10];
  const yr = spec.y || [0, 10];
  const pad = compact
    ? { l: 8, r: 8, t: 6, b: 8 }
    : { l: spec.yLabel ? 62 : spec.numbers === false ? 18 : 42, r: 16, t: 16, b: spec.xLabel ? 52 : spec.numbers === false ? 18 : 32 };
  const pl = plane({ x: xr, y: yr, width: W, height: H, pad });
  const fr = frame({ width: W, height: H, compact, plain: compact, label: spec.alt || 'Scatter plot' });
  const { svg } = fr;
  const color = spec.color || 'blue';
  const digits = spec.digits != null ? spec.digits : 2;
  let readOnly = !!env.readOnly;
  let revealed = false;

  /* -------------------------------------------------------------- points */
  const cloudSpec = spec.cloud || null;
  let cloudR = cloudSpec ? clamp(Number(cloudSpec.r) || 0, -1, 1) : null;
  let base = null;                       // standard scores behind a cloud: x and noise, exactly uncorrelated
  if (cloudSpec) {
    const n = cloudSpec.n || 40;
    const zx = scores(env.rng, n);
    let ze = scores(env.rng, n);
    const dot = ze.reduce((t, v, i) => t + v * zx[i], 0) / n;
    ze = ze.map((v, i) => v - dot * zx[i]);
    const sd = Math.sqrt(ze.reduce((t, v) => t + v * v, 0) / n) || 1;
    base = { zx, ze: ze.map((v) => v / sd) };
  }
  const cloudPoints = () => {
    const cx = (pl.x0 + pl.x1) / 2;
    const cy = (pl.y0 + pl.y1) / 2;
    const kx = (pl.x1 - pl.x0) / 6.2;
    const ky = (pl.y1 - pl.y0) / 6.2;
    const mix = Math.sqrt(Math.max(0, 1 - cloudR * cloudR));
    return base.zx.map((zx, i) => [cx + kx * zx, cy + ky * clamp(cloudR * zx + mix * base.ze[i], -2.9, 2.9)]);
  };
  let points = cloudSpec ? cloudPoints() : (spec.points || []).map((p) => [Number(p[0]), Number(p[1])]);
  const dragList = Array.isArray(spec.drag) ? spec.drag : null;
  const canDrag = (i) => !compact && !cloudSpec && (dragList ? dragList.includes(i) : spec.drag === true);
  const snaps = Array.isArray(spec.snap) ? spec.snap : [spec.snap, spec.snap];
  const snapX = snaps[0] || (pl.x1 - pl.x0) / 40;
  const snapY = snaps[1] || (pl.y1 - pl.y0) / 40;

  /* -------------------------------------------------------------- layers */
  if (!compact) {
    svg.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep, grid: spec.grid !== false, labels: spec.numbers !== false }));
    if (spec.xLabel) svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: H - 8, 'text-anchor': 'middle' }, spec.xLabel));
    if (spec.yLabel) {
      const my = (pl.top + pl.bottom) / 2;
      svg.appendChild(s('text.axis-label', { x: 16, y: my, 'text-anchor': 'middle', transform: `rotate(-90 16 ${my})` }, spec.yLabel));
    }
  } else {
    svg.appendChild(s('path', { d: `M${pl.left} ${pl.top} V${pl.bottom} H${pl.right}`, fill: 'none', class: 'axis-line', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  }
  const clip = clipTo(svg, pl);
  const gGaps = s('g', { 'clip-path': clip });
  const gLines = s('g', { 'clip-path': clip });
  const gDots = s('g');
  const gHandles = s('g');
  svg.append(gGaps, gLines, gDots, gHandles);

  const fitLine = spec.fit ? s('line', { stroke: hue('violet'), 'stroke-width': compact ? 2.5 : 4, 'stroke-linecap': 'round', 'stroke-dasharray': spec.line ? '9 8' : null }) : null;
  if (fitLine) gLines.appendChild(fitLine);

  // the learner's own line, held by a handle near each edge of the plot
  const lineSpec = spec.line && !compact ? spec.line : null;
  const xa = pl.x0 + (pl.x1 - pl.x0) * 0.06;
  const xb = pl.x1 - (pl.x1 - pl.x0) * 0.06;
  const ends = lineSpec ? { left: Number(lineSpec.left != null ? lineSpec.left : (pl.y0 + pl.y1) / 2), right: Number(lineSpec.right != null ? lineSpec.right : (pl.y0 + pl.y1) / 2) } : null;
  const lineSnap = (lineSpec && lineSpec.snap) || (pl.y1 - pl.y0) / 60;
  let userLine = null;
  const endHandles = {};
  if (lineSpec) {
    userLine = s('line', { stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' });
    gLines.appendChild(userLine);
    for (const key of ['left', 'right']) {
      endHandles[key] = handle(svg, {
        r: 10, shape: 'square', color: 'orange', label: `${key === 'left' ? 'Left' : 'Right'} end of your line`, keyStep: Math.max(2, lineSnap * pl.ky),
        onMove: (px, py) => {
          if (readOnly) return;
          const v = tidy(clamp(snapTo(pl.uy(py), lineSnap), pl.y0, pl.y1));
          if (v === ends[key]) return;
          ends[key] = v;
          draw();
          env.onChange(getState());
        },
      });
      gHandles.appendChild(endHandles[key].el);
    }
  }
  if (fitLine && userLine) gLines.appendChild(fitLine);      // the best fit goes on top of the learner's line
  const gapLines = lineSpec && spec.gaps !== false ? points.map(() => { const el = s('line.sf-gap'); gGaps.appendChild(el); return el; }) : [];

  let dots = [];
  function buildDots() {
    dots.forEach((d) => { if (d.hd) d.hd.destroy(); });
    while (gDots.firstChild) gDots.removeChild(gDots.firstChild);
    dots = points.map((_, i) => {
      if (!canDrag(i)) {
        const el = s('circle.sf-dot', { r: compact ? 4.5 : 6.5, fill: hue(color) });
        gDots.appendChild(el);
        return { set: (x, y) => { el.setAttribute('cx', x); el.setAttribute('cy', y); } };
      }
      const hd = handle(svg, {
        r: 9, color: dragList ? 'orange' : color, label: `Point ${i + 1}`, keyStep: Math.max(2, snapX * pl.kx),
        onMove: (px, py) => {
          if (readOnly) return;
          const nx = tidy(clamp(snapTo(pl.ux(px), snapX), pl.x0, pl.x1));
          const ny = tidy(clamp(snapTo(pl.uy(py), snapY), pl.y0, pl.y1));
          if (nx === points[i][0] && ny === points[i][1]) return;
          points[i] = [nx, ny];
          draw();
          env.onChange(getState());
        },
      });
      gDots.appendChild(hd.el);
      return { hd, set: (x, y) => hd.set(x, y) };
    });
  }
  buildDots();

  /* ------------------------------------------------------------ controls */
  const roR = readout('correlation $r$', { digits, color: 'violet' });
  const roGap = readout('typical gap', { digits: 1 });
  const roBest = readout('best possible', { digits: 1, color: 'violet' });
  const showR = () => spec.r === true || (spec.r === 'reveal' && revealed);
  if (!compact && spec.r) fr.readouts.appendChild(roR.el);
  if (lineSpec) fr.readouts.appendChild(roGap.el);
  if (lineSpec && spec.fit) fr.readouts.appendChild(roBest.el);

  let cloudRow = null;
  if (cloudSpec && cloudSpec.slider !== false && !compact) {
    cloudRow = sliderRow({
      label: 'correlation $r$', min: -1, max: 1, step: 0.05, value: cloudR, color: 'violet', digits: 2,
      onInput: (v) => { if (readOnly) return; cloudR = v; points = cloudPoints(); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(cloudRow.el);
  }

  /* --------------------------------------------------------------- state */
  function lineState(reg) {
    if (!ends) return null;
    const slope = (ends.right - ends.left) / (xb - xa);
    const intercept = ends.left - slope * xa;
    const mse = points.reduce((t, [x, y]) => t + (y - intercept - slope * x) ** 2, 0) / (points.length || 1);
    return {
      left: ends.left, right: ends.right, slope: tidy(slope, 4), intercept: tidy(intercept, 4),
      gap: tidy(Math.sqrt(mse), 4), best: tidy(Math.sqrt(reg.mse), 4),
      excess: reg.mse > 1e-12 ? tidy(Math.min(mse / reg.mse - 1, 1e6), 4) : (mse > 1e-12 ? 1e6 : 0),
      tilt: tidy(slope - reg.slope, 4),
      offset: tidy(intercept + slope * reg.mx - reg.my, 4),
    };
  }
  function getState() {
    const reg = regress(points);
    return {
      points: points.map((p) => [tidy(p[0], 4), tidy(p[1], 4)]),
      n: reg.n,
      r: reg.r == null ? null : tidy(reg.r, 4),
      slope: tidy(reg.slope, 4),
      intercept: tidy(reg.intercept, 4),
      line: lineState(reg),
      cloud: cloudR,
    };
  }

  /* ---------------------------------------------------------------- draw */
  const setLine = (el, f) => {
    el.setAttribute('x1', pl.sx(pl.x0)); el.setAttribute('y1', pl.sy(f(pl.x0)));
    el.setAttribute('x2', pl.sx(pl.x1)); el.setAttribute('y2', pl.sy(f(pl.x1)));
  };
  function draw() {
    const reg = regress(points);
    const st = lineState(reg);
    points.forEach((p, i) => dots[i].set(pl.sx(p[0]), pl.sy(p[1])));
    if (fitLine) {
      const on = (spec.fit === true || revealed) && reg.n > 1;
      fitLine.setAttribute('visibility', on ? 'visible' : 'hidden');
      setLine(fitLine, (x) => reg.intercept + reg.slope * x);
    }
    if (userLine) {
      setLine(userLine, (x) => st.intercept + st.slope * x);
      endHandles.left.set(pl.sx(xa), pl.sy(ends.left));
      endHandles.right.set(pl.sx(xb), pl.sy(ends.right));
      endHandles.left.setLabel(formatNumber(ends.left, 1));
      endHandles.right.setLabel(formatNumber(ends.right, 1));
      gapLines.forEach((el, i) => {
        const [x, y] = points[i];
        el.setAttribute('x1', pl.sx(x)); el.setAttribute('x2', pl.sx(x));
        el.setAttribute('y1', pl.sy(y)); el.setAttribute('y2', pl.sy(st.intercept + st.slope * x));
      });
      roGap.set(st.gap);
      roBest.el.hidden = !(spec.fit === true || revealed);
      roBest.set(st.best);
    }
    roR.el.hidden = !showR();
    roR.set(reg.r == null ? '—' : reg.r);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Scatter plot of ${reg.n} points.${showR() && reg.r != null ? ` Correlation ${formatNumber(reg.r, 2)}.` : ''}`);
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.cloud === 'number' && cloudSpec) {
        cloudR = clamp(next.cloud, -1, 1);
        if (cloudRow) cloudRow.set(cloudR);
        points = cloudPoints();
      } else if (Array.isArray(next.points) && !cloudSpec) {
        next.points.forEach((p, i) => { if (i < points.length && Array.isArray(p)) points[i] = [Number(p[0]), Number(p[1])]; });
      }
      if (next.line && ends) {
        if (typeof next.line.left === 'number') ends.left = next.line.left;
        if (typeof next.line.right === 'number') ends.right = next.line.right;
      }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      dots.forEach((d) => { if (d.hd) d.hd.setEnabled(!readOnly); });
      for (const key in endHandles) endHandles[key].setEnabled(!readOnly);
      if (cloudRow) cloudRow.setDisabled(readOnly);
      if (readOnly && !revealed) { revealed = true; if (spec.fit === 'reveal' || spec.r === 'reveal') play('pop'); draw(); }
    },
    destroy() {
      dots.forEach((d) => { if (d.hd) d.hd.destroy(); });
      for (const key in endHandles) endHandles[key].destroy();
    },
  };
}

export const examples = [
  {
    title: 'scatter-fit — fit a line by eye; the best fit appears when the step is resolved',
    spec: {
      type: 'scatter-fit', x: [0, 10], y: [0, 10], fit: 'reveal', r: 'reveal', line: { left: 5, right: 5 },
      points: [[1, 2.2], [2, 2.6], [3, 4.4], [4, 3.9], [5, 5.6], [6, 5.4], [7, 7.3], [8, 6.9], [9, 8.4]],
    },
  },
  {
    title: 'scatter-fit — drag the orange point and watch r',
    spec: {
      type: 'scatter-fit', x: [0, 10], y: [0, 10], fit: true, r: true, drag: [6], snap: 0.5,
      points: [[2, 3], [3, 3.5], [3.5, 4.5], [4.5, 5], [5, 6], [6, 6.5], [6.5, 7.5]],
    },
  },
  {
    title: 'scatter-fit — a cloud with exactly the correlation on the slider',
    spec: { type: 'scatter-fit', x: [0, 10], y: [0, 10], cloud: { n: 40, r: 0.6, slider: true } },
  },
];
