/**
 * wave-maker — a point walks round a wheel while its height is plotted
 * against the angle it has turned through. The sine wave appears as the
 * unrolled height of the walking point: a dashed line ties the point on the
 * wheel to the point on the graph at every moment.
 *
 * With sliders for the wheel it also shows where amplitude and period come
 * from: a wheel of radius A makes a wave A tall, and a wheel that turns B
 * times as fast fits B waves into the room of one. y = A·sin(B·x).
 *
 * {
 *   type: 'wave-maker',
 *   deg: 0,                  // where x starts, in degrees (x itself is shown in radians unless unit is 'deg')
 *   turns: 2,                // the x-axis runs from 0 to this many full turns (turns × 2π)
 *   step: 15,                // x moves in steps of this many degrees
 *   unit: 'rad',             // 'rad' | 'deg': how the x-axis is labelled
 *   A: 1, B: 1,              // radius of the wheel, and how fast it turns: the point is at angle B·x, at height A·sin(B·x)
 *   aRange: [0.5, 2.5], aStep: 0.5,   // adds a slider for the radius A
 *   bRange: [0.5, 3], bStep: 0.5,     // adds a slider for the speed B
 *   target: { A: 2, B: 2 },  // a dashed wave to match
 *   trace: true,             // true: the wave is drawn only as far as x has got. false: the whole wave is shown.
 *                            // (default: true without the A / B sliders, false with them)
 *   play: true,              // a Play button that walks the point along (default: on when trace is on)
 *   readouts: true,          // show x and the height under the picture (default: off with the A / B sliders)
 *   static: false,
 * }
 *
 * State: { deg, rad, turn, height, traced, A, B }
 *   deg, rad   the position along the x-axis, in degrees and in radians (4 decimals)
 *   turn       how far the wheel has turned, in degrees (B × deg)
 *   height     the height of the point: A·sin(B·x) (4 decimals)
 *   traced     the largest deg reached so far
 *   A, B       the radius and the speed of the wheel
 *
 * setState accepts { deg, A, B, traced }.
 * Drag the point on the graph, use the slider, or press Play.
 */
import { frame, handle, sliderRow, readout, button, loop, hue, s, h, clamp, tidy, formatNumber, mdInline, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';

const W = 620;
const H = 300;
const WX = 116;      // centre of the wheel
const CY = 150;
const GX0 = 262;     // where the graph starts and ends
const GX1 = 600;
const HALF = 112;    // half the height of the drawing area
const D2R = Math.PI / 180;

addStyles('wave-maker', `
  .widget-wave-maker .wm-line { text-align: center; font-size: var(--fs-md); min-height: 1.6em; }
`);

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** Degrees as radians text: 270 -> "3π/2", 100 -> "1.75". */
const radText = (deg) => {
  if (deg === 0) return '0';
  if (Number.isInteger(deg) && deg % 15 === 0) {
    const g = gcd(deg, 180);
    const n = deg / g;
    const d = 180 / g;
    return `${n === 1 ? '' : n}π${d === 1 ? '' : `/${d}`}`;
  }
  return formatNumber(deg * D2R, 2);
};

export default function create(spec, env) {
  const isStatic = !!spec.static || env.compact;
  const turns = clamp(Number(spec.turns) || 2, 0.5, 4);
  const maxDeg = turns * 360;
  const step = spec.step > 0 ? Number(spec.step) : 15;
  const inDeg = spec.unit === 'deg';
  const aRange = !isStatic && Array.isArray(spec.aRange) ? spec.aRange.map(Number) : null;
  const bRange = !isStatic && Array.isArray(spec.bRange) ? spec.bRange.map(Number) : null;
  const target = spec.target && Number(spec.target.A) > 0 ? { A: Number(spec.target.A), B: Number(spec.target.B) || 1 } : null;
  const trace = spec.trace != null ? !!spec.trace : !(aRange || bRange);
  const canPlay = !isStatic && (spec.play != null ? !!spec.play : trace);
  let A = Number(spec.A) > 0 ? Number(spec.A) : 1;
  let B = Number(spec.B) > 0 ? Number(spec.B) : 1;
  if (aRange) A = clamp(A, aRange[0], aRange[1]);
  if (bRange) B = clamp(B, bRange[0], bRange[1]);
  const snap = (d) => clamp(Math.round(d / step) * step, 0, maxDeg);
  let deg = snap(Number(spec.deg) || 0);
  let traced = deg;
  let readOnly = !!env.readOnly;

  const yMax = Math.max(A, aRange ? aRange[1] : 0, target ? target.A : 0) * 1.12;
  const U = HALF / yMax;                         // pixels per unit of height
  const gx = (d) => GX0 + (d / maxDeg) * (GX1 - GX0);
  const sy = (v) => CY - v * U;
  const wave = (d, a = A, b = B) => a * Math.sin(b * d * D2R);

  const fr = frame({ width: W, height: H, wide: true, compact: env.compact, label: spec.alt || 'A point on a wheel and the graph of its height' });
  const { svg } = fr;

  /* -------------------------------------------------------------- static */
  const thin = { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-linecap': 'round' };
  svg.appendChild(s('line', { x1: WX - HALF - 6, x2: WX + HALF + 6, y1: CY, y2: CY, ...thin }));
  svg.appendChild(s('line', { x1: WX, x2: WX, y1: CY - HALF - 6, y2: CY + HALF + 6, ...thin }));
  svg.appendChild(s('line.axis-line', { x1: GX0, x2: GX1 + 10, y1: CY, y2: CY }));
  svg.appendChild(s('line.axis-line', { x1: GX0, x2: GX0, y1: CY - HALF - 8, y2: CY + HALF + 8 }));
  for (let d = 90; d <= maxDeg + 1e-9; d += 90) {
    const x = gx(d);
    svg.appendChild(s('line.grid-line', { x1: x, x2: x, y1: CY - HALF, y2: CY + HALF }));
    if (turns > 2.5 && d % 180 !== 0) continue;
    // along the bottom edge, where the wave never covers them
    svg.appendChild(s('text.tick-label', { x, y: CY + HALF + 17, 'text-anchor': 'middle' }, inDeg ? `${d}°` : radText(d)));
  }
  for (let v = -Math.floor(yMax); v <= Math.floor(yMax); v++) {
    if (v === 0) continue;
    svg.appendChild(s('line.grid-line', { x1: GX0, x2: GX1, y1: sy(v), y2: sy(v) }));
    svg.appendChild(s('text.tick-label', { x: GX0 - 7, y: sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 0)));
  }
  svg.appendChild(s('text.axis-label', { x: GX1 + 10, y: CY - 8, 'text-anchor': 'end' }, 'x'));

  /* ------------------------------------------------------------- dynamic */
  const wheel = s('circle', { cx: WX, cy: CY, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const wedge = s('path', { fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
  const spoke = s('line', { x1: WX, y1: CY, stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-linecap': 'round' });
  const legWheel = s('line', { stroke: hue('orange'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const legGraph = s('line', { stroke: hue('orange'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const link = s('line', { stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-dasharray': '5 5', 'stroke-linecap': 'round' });
  const targetPath = s('path', { fill: 'none', stroke: hue('gray'), 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' });
  const ghost = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 2, opacity: 0.35 });
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const pWheel = s('circle', { r: 7, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
  const pGraph = s('circle', { r: 8, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
  svg.append(targetPath, wheel, wedge, ghost, curve, link, legWheel, legGraph, spoke, s('circle', { cx: WX, cy: CY, r: 3, fill: 'var(--ink)' }), pWheel);

  const line = h('div.wm-line');
  if (!env.compact && (aRange || bRange || target)) fr.el.insertBefore(line, fr.readouts);
  const roX = readout(inDeg ? 'angle' : '$x$', { digits: 2 });
  const roH = readout('height', { digits: 3, color: 'orange' });
  const showReadouts = spec.readouts != null ? !!spec.readouts : !(aRange || bRange);
  if (!env.compact && showReadouts) fr.readouts.append(roX.el, roH.el);

  const getState = () => ({
    deg, rad: tidy(deg * D2R, 4), turn: tidy(B * deg, 4), height: tidy(wave(deg), 4), traced, A, B,
  });

  const pathOf = (from, to, a, b) => {
    let d = '';
    const n = Math.max(2, Math.ceil(((to - from) * b) / 4));
    for (let i = 0; i <= n; i++) {
      const x = from + ((to - from) * i) / n;
      d += `${i ? 'L' : 'M'}${gx(x).toFixed(1)} ${sy(wave(x, a, b)).toFixed(1)}`;
    }
    return d;
  };

  let hd = null;
  let xRow = null;
  let aRow = null;
  let bRow = null;

  function render() {
    const R = A * U;
    const t = B * deg * D2R;
    const px = WX + R * Math.cos(t);
    const py = CY - R * Math.sin(t);
    const qx = gx(deg);
    wheel.setAttribute('r', R);
    spoke.setAttribute('x2', px); spoke.setAttribute('y2', py);
    legWheel.setAttribute('x1', px); legWheel.setAttribute('x2', px); legWheel.setAttribute('y1', CY); legWheel.setAttribute('y2', py);
    legGraph.setAttribute('x1', qx); legGraph.setAttribute('x2', qx); legGraph.setAttribute('y1', CY); legGraph.setAttribute('y2', py);
    link.setAttribute('x1', px); link.setAttribute('y1', py); link.setAttribute('x2', qx); link.setAttribute('y2', py);
    pWheel.setAttribute('cx', px); pWheel.setAttribute('cy', py);
    pGraph.setAttribute('cx', qx); pGraph.setAttribute('cy', py);

    const turned = (((B * deg) % 360) + 360) % 360;
    const wr = Math.min(18, R * 0.45);
    if (turned < 0.5) wedge.setAttribute('d', '');
    else wedge.setAttribute('d', `M${WX} ${CY} L${WX + wr} ${CY} A${wr} ${wr} 0 ${turned > 180 ? 1 : 0} 0 ${WX + wr * Math.cos(turned * D2R)} ${CY - wr * Math.sin(turned * D2R)} Z`);

    curve.setAttribute('d', trace ? (deg > 0 ? pathOf(0, deg, A, B) : '') : pathOf(0, maxDeg, A, B));
    ghost.setAttribute('d', trace && traced > deg ? pathOf(deg, traced, A, B) : '');
    targetPath.setAttribute('d', target ? pathOf(0, maxDeg, target.A, target.B) : '');

    if (hd) { hd.set(qx, py); hd.setLabel(`x ${inDeg ? `${deg} degrees` : radText(deg)}, height ${formatNumber(wave(deg), 2)}`); }
    roX.set(inDeg ? `${deg}°` : (deg % 15 === 0 && deg !== 0 ? `${radText(deg)} ≈ ${formatNumber(deg * D2R, 2)}` : formatNumber(deg * D2R, 2)));
    roH.set(wave(deg));
    if (aRange || bRange || target) {
      const a = A === 1 ? '' : formatNumber(A, 2);
      const b = B === 1 ? '' : formatNumber(B, 2);
      line.innerHTML = mdInline(`$y = \\orange{${a}}\\sin(\\violet{${b}}x)$`);
    }
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The wheel has radius ${formatNumber(A, 2)} and has turned ${formatNumber(B * deg, 0)} degrees; the point is at height ${formatNumber(wave(deg), 2)}.`);
  }

  const moveTo = (next, fromSlider, quiet) => {
    const d = snap(next);
    if (d === deg) return;
    deg = d;
    traced = Math.max(traced, deg);
    if (xRow && !fromSlider) xRow.set(deg);
    render();
    if (!quiet) env.onChange(getState());
  };

  /* ------------------------------------------------------------ controls */
  let anim = null;
  let playBtn = null;
  const stop = () => { if (anim) anim.stop(); if (playBtn) playBtn.lastChild.textContent = 'Play'; };
  if (isStatic) svg.appendChild(pGraph);
  else {
    hd = handle(svg, {
      color: 'green', label: 'The point on the graph', keyStep: Math.max(6, ((GX1 - GX0) * step) / maxDeg),
      onMove: (hx) => { if (readOnly) return; stop(); moveTo(((hx - GX0) / (GX1 - GX0)) * maxDeg, false); },
    });
    svg.appendChild(hd.el);
    if (trace || spec.slider === true) {
      xRow = sliderRow({
        label: inDeg ? 'angle turned' : 'angle turned, $x$', min: 0, max: maxDeg, step, value: deg, color: 'green',
        format: (v) => (inDeg ? `${v}°` : radText(v)),
        onInput: (v) => { if (readOnly) return; stop(); moveTo(v, true); },
      });
      fr.controls.appendChild(xRow.el);
    }
    if (aRange) {
      aRow = sliderRow({
        label: 'radius of the wheel, $A$', min: aRange[0], max: aRange[1], step: spec.aStep || 0.5, value: A, color: 'orange',
        onInput: (v) => { if (readOnly) return; A = v; render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(aRow.el);
    }
    if (bRange) {
      bRow = sliderRow({
        label: 'speed of the wheel, $B$', min: bRange[0], max: bRange[1], step: spec.bStep || 0.5, value: B, color: 'violet',
        onInput: (v) => { if (readOnly) return; B = v; render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(bRow.el);
    }
    if (canPlay) {
      let pos = deg;
      anim = loop((dt) => {
        pos += dt * 150;
        if (pos >= maxDeg) { pos = maxDeg; moveTo(pos, false, true); stop(); env.onChange(getState()); return; }
        moveTo(pos, false, true);
      });
      playBtn = button('Play', () => {
        if (readOnly) return;
        if (anim.running) { stop(); env.onChange(getState()); return; }
        if (deg >= maxDeg) { deg = 0; if (xRow) xRow.set(0); render(); }
        if (reducedMotion()) { moveTo(maxDeg, false); return; }
        pos = deg;
        playBtn.lastChild.textContent = 'Pause';
        anim.start();
      }, { icon: 'play' });
      fr.buttons.appendChild(playBtn);
    }
  }
  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      stop();
      if (next.A != null && aRange) { A = clamp(Number(next.A), aRange[0], aRange[1]); if (aRow) aRow.set(A); }
      if (next.B != null && bRange) { B = clamp(Number(next.B), bRange[0], bRange[1]); if (bRow) bRow.set(B); }
      if (next.deg != null) deg = snap(Number(next.deg));
      traced = Math.max(deg, next.traced != null ? clamp(Number(next.traced), 0, maxDeg) : traced);
      if (xRow) xRow.set(deg);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly) stop();
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      for (const row of [xRow, aRow, bRow]) if (row) row.setDisabled(readOnly);
    },
    destroy() { if (anim) anim.stop(); if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'Unroll the circle', spec: { type: 'wave-maker', turns: 2 } },
  { title: 'In degrees, one turn', spec: { type: 'wave-maker', turns: 1, unit: 'deg', deg: 120 } },
  { title: 'Wheel size and speed', spec: { type: 'wave-maker', turns: 1, deg: 60, A: 1, B: 1, aRange: [0.5, 2.5], bRange: [0.5, 3], target: { A: 2, B: 2 } } },
];
