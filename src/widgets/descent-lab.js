/**
 * descent-lab — gradient descent on a one-weight error landscape.
 * A ball sits on an error curve. Each step moves the weight by
 * (learning rate × slope) downhill; the learner chooses the learning rate
 * and watches the ball crawl, settle, bounce or fly off.
 *
 * {
 *   type: 'descent-lab',
 *   curve: '(w - 4)^2',            // the error as a function of the weight w
 *   x: [0, 8], y: [0, 16],         // window: weight range and error range
 *   start: 1.5,                    // where the ball starts
 *   rate: { min: 0.05, max: 1.1, step: 0.05, value: 0.25 },   // learning-rate slider (a plain number fixes the rate)
 *   drag: false,                   // true: drag the ball (or use the arrow keys) to choose another start
 *   snap: 0.25,                    // grid for dragging
 *   burst: 0,                      // n > 0 adds a "Run n steps" button
 *   roll: false,                   // true adds a "Roll" button: keep stepping until the ball settles (40 steps at most)
 *   flat: 0.1,                     // the ball counts as settled when the slope is closer to zero than this
 *   preview: true,                 // show where the next step would land
 *   rule: true,                    // show the update rule with the current numbers
 *   steps: 0,                      // a static picture only: show the ball after this many steps, with its trail
 *                                  // (stops early once the ball has settled)
 *   xLabel: 'weight', yLabel: 'error',
 * }
 *
 * State: { w, start, rate, steps, error, slope, settled, deepest, escaped, crossings, lowest, path }
 *   settled   — the ball is resting in a valley (slope ≈ 0)
 *   deepest   — …and that valley is the lowest one in the window
 *   escaped   — a step carried the ball out of the window
 *   crossings — how many steps jumped across a valley floor (the slope changed sign)
 *   lowest    — the smallest error seen along the way
 *   path      — every weight visited, starting with `start`
 *
 * setState accepts { start, rate, steps } and replays the steps.
 */
import { frame, plane, drawAxes, handle, sliderRow, readout, button, fnPath, clipTo, arrowMarker, hue, s, h, clamp, tidy, snapTo, formatNumber, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('descent-lab', `
  .widget-descent-lab .w-descent-rule {
    justify-self: center;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-wrap: balance;
  }
  .widget-descent-lab .w-descent-rule .is-rate { color: var(--green-text); }
  .widget-descent-lab .w-descent-rule .is-slope { color: var(--violet-text); }
  .widget-descent-lab .w-descent-rule .is-new { color: var(--orange-text); }
  .widget-descent-lab .w-descent-rule.is-off { border-color: var(--red); color: var(--red-text); }
  .widget-descent-lab .btn-ghost.btn-sm { box-shadow: none; }
  .widget-descent-lab .btn-sm { min-height: 40px; }
`);

const W = 560;
const H = 340;
const MAX_STEPS = 200;

export default function create(spec, env) {
  const f0 = compile(spec.curve || '(w - 4)^2', { vars: ['w'] });
  const f = (v) => f0({ w: v });
  const slopeAt = (v) => (f(v + 1e-4) - f(v - 1e-4)) / 2e-4;
  const xWin = spec.x || [0, 8];
  const yWin = spec.y || [0, 16];
  const flat = spec.flat != null ? spec.flat : 0.1;
  const rateDef = typeof spec.rate === 'number' ? null : { min: 0.05, max: 1.1, step: 0.05, value: 0.25, ...(spec.rate || {}) };
  const interactive = !env.compact && !spec.static;
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------- model */
  let start = spec.start != null ? spec.start : xWin[0] + (xWin[1] - xWin[0]) * 0.15;
  let rate = rateDef ? rateDef.value : spec.rate;
  let path = [start];
  let escaped = false;
  let crossings = 0;
  let timer = 0;

  // the lowest point of the landscape inside the window (to tell a deep valley from a shallow one)
  let deepW = xWin[0];
  for (let i = 0; i <= 2000; i++) {
    const v = xWin[0] + ((xWin[1] - xWin[0]) * i) / 2000;
    if (f(v) < f(deepW)) deepW = v;
  }

  const cur = () => path[path.length - 1];
  // at rest: next to no slope, and the ground curves upwards on both sides (a valley floor, not a hilltop)
  const isSettled = () => !escaped && Math.abs(slopeAt(cur())) < flat && f(cur() + 0.05) + f(cur() - 0.05) - 2 * f(cur()) > 0;
  const inDeepest = () => isSettled() && Math.abs(cur() - deepW) < Math.max(0.25, (xWin[1] - xWin[0]) * 0.04);

  function stepOnce() {
    if (escaped || path.length > MAX_STEPS) return false;
    const w0 = cur();
    const g = slopeAt(w0);
    const w1 = w0 - rate * g;
    if (Math.sign(slopeAt(w1)) * Math.sign(g) < 0) crossings += 1;
    path.push(w1);
    if (!(w1 >= xWin[0] && w1 <= xWin[1]) || !Number.isFinite(f(w1))) escaped = true;
    return true;
  }
  function restart(at = start) {
    start = at;
    path = [start];
    escaped = false;
    crossings = 0;
  }

  /* -------------------------------------------------------------- plot */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A ball on an error curve' });
  const { svg } = fr;
  const pl = plane({ x: xWin, y: yWin, width: W, height: H, pad: { l: 58, r: 18, t: 22, b: 58 } });
  svg.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep, labels: !env.compact }));
  const midY = (pl.top + pl.bottom) / 2;
  if (!env.compact) {
    svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: H - 9, 'text-anchor': 'middle' }, spec.xLabel || 'weight'));
    svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, spec.yLabel || 'error'));
  }
  const clip = clipTo(svg, pl);
  const arrow = arrowMarker(svg, 'green', 6);

  // the landscape: a soft fill under the curve, then the curve itself
  const curveD = fnPath(f, pl);
  const gLand = s('g', { 'clip-path': clip });
  if (curveD) gLand.appendChild(s('path', { d: `${curveD}L${pl.right} ${pl.bottom}L${pl.left} ${pl.bottom}Z`, fill: hue('blue', 'soft'), opacity: 0.6, stroke: 'none' }));
  gLand.appendChild(s('path', { d: curveD, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  const trail = s('path', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const gDots = s('g');
  const tangent = s('line', { stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-linecap': 'round' });
  const gClip = s('g', { 'clip-path': clip }, trail, gDots, tangent);
  const nextArrow = s('line', { stroke: hue('green'), 'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': arrow });
  const ghost = s('circle', { r: 10, fill: 'none', stroke: hue('green'), 'stroke-width': 3, 'stroke-dasharray': '4 5' });
  const gNext = s('g', { 'clip-path': clip }, nextArrow, ghost);
  const edgeNote = s('text.fig-label', { 'text-anchor': 'middle', style: `fill:${hue('red', 'text')}` });
  svg.append(gLand, gClip, gNext, edgeNote);

  let ball = null;
  let ballDot = null;
  if (spec.drag && interactive) {
    ball = handle(svg, {
      color: 'orange', r: 11, label: 'The ball. Drag it to choose where descent starts.',
      keyStep: Math.max(4, (spec.snap || 0.25) * pl.kx),
      onMove: (px) => {
        if (readOnly || timer) return;
        const v = tidy(clamp(snapTo(pl.ux(px), spec.snap || 0.25), xWin[0], xWin[1]));
        if (v === start && path.length === 1) return;
        restart(v);
        render();
        env.onChange(getState());
      },
    });
    // the figure is scaled down on phones: widen the hit area so that it stays at least 40 px across
    ball.el.insertBefore(s('circle', { r: 36, fill: 'transparent' }), ball.el.firstChild);
    svg.appendChild(ball.el);
  } else {
    ballDot = s('circle', { r: 11, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
    svg.appendChild(ballDot);
  }

  /* ---------------------------------------------------------- controls */
  const rule = h('div.w-descent-rule', { 'aria-live': 'polite' });
  if (interactive && spec.rule !== false) fr.el.insertBefore(rule, fr.readouts);
  const roSteps = readout('steps', { digits: 0 });
  const roSlope = readout('slope', { digits: 2, color: 'violet' });
  const roError = readout('error', { digits: 2 });
  if (!env.compact) fr.readouts.append(roSteps.el, roSlope.el, roError.el);

  let slider = null;
  if (rateDef && interactive) {
    slider = sliderRow({
      label: spec.rateLabel || 'learning rate', min: rateDef.min, max: rateDef.max, step: rateDef.step, value: rate, color: 'green',
      onInput: (v) => { rate = v; render(); env.onChange(getState()); },
    });
    fr.controls.appendChild(slider.el);
  }

  const stopRun = () => { if (timer) { clearInterval(timer); timer = 0; } };
  const buttons = [];
  const syncButtons = () => {
    const busy = !!timer;
    buttons.forEach((btn) => { btn.disabled = readOnly || busy || (btn.dataset.kind !== 'reset' && (escaped || path.length > MAX_STEPS)); });
    if (slider) slider.setDisabled(readOnly || busy);
  };
  function after() {
    render();
    if (escaped) env.announce('The step was so large that the ball left the chart.');
    else if (isSettled()) env.announce(`The ball has settled after ${path.length - 1} steps.`);
    env.onChange(getState());
  }
  function run(count, untilSettled) {
    if (readOnly || timer || escaped) return;
    const more = () => count > 0 && !(untilSettled && isSettled());
    if (count === 1 || reducedMotion()) {
      while (more() && stepOnce()) count -= 1;
      play('tap');
      after();
      return;
    }
    timer = setInterval(() => {
      const ok = more() && stepOnce();
      count -= 1;
      if (ok) { play('tick'); render(); }
      if (!ok || !more() || escaped) { stopRun(); after(); }
    }, 140);
    syncButtons();
  }
  if (interactive) {
    const mk = (label, fn, opts, kind) => { const btn = button(label, fn, opts); btn.dataset.kind = kind; buttons.push(btn); return btn; };
    fr.buttons.appendChild(mk('Take a step', () => run(1), { icon: 'footprints' }, 'step'));
    if (spec.burst > 0) fr.buttons.appendChild(mk(`Run ${spec.burst} steps`, () => run(spec.burst), { icon: 'play' }, 'run'));
    if (spec.roll) fr.buttons.appendChild(mk('Roll', () => run(40, true), { icon: 'play' }, 'run'));
    fr.buttons.appendChild(mk('Back to start', () => { if (readOnly) return; stopRun(); restart(); render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' }, 'reset'));
  }

  /* ------------------------------------------------------------ render */
  const fmt = (v, d = 2) => formatNumber(v, d);
  const paren = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v));
  function render() {
    const w = cur();
    const shown = clamp(w, xWin[0], xWin[1]);
    const by = clamp(pl.sy(f(shown)), pl.top, pl.bottom);
    const bx = pl.sx(shown);
    if (ball) { ball.set(bx, by); ball.setLabel(`weight ${fmt(w)}, error ${fmt(f(w))}`); ball.setEnabled(!readOnly); } else { ballDot.setAttribute('cx', bx); ballDot.setAttribute('cy', by); }

    // where the ball has been
    let d = '';
    path.forEach((v, i) => { d += `${i ? 'L' : 'M'}${pl.sx(v).toFixed(1)} ${pl.sy(f(v)).toFixed(1)}`; });
    trail.setAttribute('d', path.length > 1 ? d : '');
    while (gDots.firstChild) gDots.removeChild(gDots.firstChild);
    path.slice(0, -1).forEach((v) => gDots.appendChild(s('circle', { cx: pl.sx(v), cy: pl.sy(f(v)), r: 4.5, fill: 'var(--surface)', stroke: 'var(--ink-2)', 'stroke-width': 2 })));

    const g = slopeAt(w);
    const settled = isSettled();
    // tangent: a short piece of the slope under the ball
    if (!escaped && spec.tangent !== false) {
      const half = 46;
      const ang = Math.atan2(-g * pl.ky, pl.kx);
      tangent.setAttribute('x1', bx - half * Math.cos(ang)); tangent.setAttribute('y1', by - half * Math.sin(ang));
      tangent.setAttribute('x2', bx + half * Math.cos(ang)); tangent.setAttribute('y2', by + half * Math.sin(ang));
      tangent.setAttribute('visibility', 'visible');
    } else tangent.setAttribute('visibility', 'hidden');

    // preview of the next step
    const next = w - rate * g;
    const showNext = interactive && spec.preview !== false && !escaped && !settled && !readOnly;
    gNext.style.display = showNext ? '' : 'none';
    if (showNext) {
      const nx = pl.sx(clamp(next, xWin[0] - 1, xWin[1] + 1));
      const ny = pl.sy(f(clamp(next, xWin[0] - 1, xWin[1] + 1)));
      const len = Math.hypot(nx - bx, ny - by) || 1;
      const trim = Math.min(14, len / 2);
      nextArrow.setAttribute('x1', bx + ((nx - bx) / len) * 13); nextArrow.setAttribute('y1', by + ((ny - by) / len) * 13);
      nextArrow.setAttribute('x2', nx - ((nx - bx) / len) * trim); nextArrow.setAttribute('y2', ny - ((ny - by) / len) * trim);
      nextArrow.style.display = len > 30 ? '' : 'none';
      ghost.setAttribute('cx', nx); ghost.setAttribute('cy', ny);
    }

    edgeNote.textContent = escaped ? 'off the chart!' : '';
    if (escaped) {
      edgeNote.setAttribute('x', clamp(bx, pl.left + 70, pl.right - 70));
      edgeNote.setAttribute('y', clamp(by - 20, pl.top + 18, pl.bottom - 10));
    }

    roSteps.set(path.length - 1);
    roSlope.set(escaped ? '—' : g);
    roError.set(escaped ? '—' : f(w));
    rule.classList.toggle('is-off', escaped);
    if (escaped) rule.textContent = 'That step was too big: the ball has left the chart.';
    else if (settled) rule.innerHTML = `Slope ≈ 0, so the steps have shrunk to nothing. Weight <span class="is-new">${fmt(w)}</span>.`;
    else rule.innerHTML = `next weight = ${fmt(w)} − <span class="is-rate">${fmt(rate)}</span> × <span class="is-slope">${paren(g)}</span> = <span class="is-new">${fmt(next)}</span>`;
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Weight ${fmt(w)}, error ${escaped ? 'off the chart' : fmt(f(w))}, slope ${escaped ? 'unknown' : fmt(g)}, after ${path.length - 1} steps.${settled ? ' The ball has settled.' : ''}`);
    syncButtons();
  }

  function getState() {
    const w = cur();
    return {
      w: tidy(w, 4),
      start: tidy(start, 4),
      rate: tidy(rate, 4),
      steps: path.length - 1,
      error: Number.isFinite(f(w)) ? tidy(f(w), 3) : null,
      slope: Number.isFinite(slopeAt(w)) ? tidy(slopeAt(w), 3) : null,
      settled: isSettled(),
      deepest: inDeepest(),
      escaped,
      crossings,
      lowest: tidy(Math.min(...path.map((v) => f(v)).filter(Number.isFinite)), 3),
      path: path.map((v) => tidy(v, 3)),
    };
  }

  // a preset for teaching figures: the picture after some steps have already been taken
  if (spec.static && Number.isInteger(spec.steps)) for (let i = 0; i < spec.steps && !isSettled() && stepOnce(); i++);

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      stopRun();
      if (typeof next.rate === 'number') { rate = next.rate; if (slider) slider.set(rate); }
      restart(typeof next.start === 'number' ? next.start : start);
      const count = Number.isInteger(next.steps) ? next.steps : 0;
      for (let i = 0; i < count; i++) if (!stepOnce()) break;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly) stopRun();
      fr.el.classList.toggle('is-readonly', readOnly);
      render();
    },
    destroy() { stopRun(); if (ball) ball.destroy(); },
  };
}

export const examples = [
  {
    title: 'descent-lab — choose a learning rate and step downhill',
    spec: { type: 'descent-lab', curve: '(w - 4)^2', x: [0, 8], y: [0, 16], yStep: 4, start: 1.5, burst: 10 },
  },
  {
    title: 'descent-lab — two valleys; drag the ball to choose a start',
    spec: { type: 'descent-lab', curve: '0.1(w - 1.5)^2 (w - 6)^2 + 0.3(6 - w) + 0.8', x: [0, 7.5], y: [0, 11], yStep: 2, start: 0.5, rate: 0.1, drag: true, roll: true },
  },
];
