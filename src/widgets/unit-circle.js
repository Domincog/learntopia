/**
 * unit-circle — a point that walks around a circle of radius 1. Its
 * x-coordinate is the cosine of the angle turned and its y-coordinate is the
 * sine, which is what gives sine and cosine a meaning for every angle, not
 * only the acute ones that fit in a right-angled triangle.
 *
 * The point snaps to whole steps of the angle, so lesson checks can be exact.
 * Drag the point, use the slider, or focus the point and press the arrow keys.
 *
 * {
 *   type: 'unit-circle',
 *   deg: 40,                 // where the point starts, in degrees, counter-clockwise from the positive x-axis
 *   step: 1,                 // the point snaps to multiples of this many degrees
 *   min: 0, max: 360,        // the part of the circle the point may visit
 *   names: 'trig',           // 'trig': the readouts say cos θ and sin θ;  'xy': they say x and y
 *   readouts: ['angle', 'cos', 'sin'],   // any of: angle, cos, sin, tan, cos2 (x²), sin2 (y²)
 *   exact: false,            // true: at multiples of 30° and 45° the readouts also give the exact value (√3/2 …)
 *   unit: 'deg',             // 'rad': the angle is written in radians, as a multiple of π where that is tidy
 *   legs: true,              // draw the horizontal (cosine) and vertical (sine) legs with their lengths
 *   marks: [0, 90, 180, 270],   // angles to label around the outside of the circle
 *   slider: true,            // show the angle slider
 *   static: false,           // true: a picture
 * }
 *
 * State: { deg, cos, sin, tan, quadrant, visited }
 *   cos, sin   the coordinates of the point (4 decimals)
 *   tan        sin ÷ cos (4 decimals), or null where the cosine is 0
 *   quadrant   1 to 4, or 0 when the point is on an axis
 *   visited    every quadrant the point has been in so far (sorted)
 *
 * setState accepts { deg }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, tidy, formatNumber } from './kit.js';

const W = 420;
const H = 400;
const CX = 210;
const CY = 200;
const R = 138;
const D2R = Math.PI / 180;

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** An angle in degrees as radians text: 120 -> "2π/3", 37 -> "0.65". */
export function radText(deg) {
  if (deg === 0) return '0';
  if (Number.isInteger(deg) && deg % 15 === 0) {
    const g = gcd(deg, 180);
    const n = deg / g;
    const d = 180 / g;
    return `${n === 1 ? '' : n === -1 ? '−' : formatNumber(n, 0)}π${d === 1 ? '' : `/${d}`}`;
  }
  return formatNumber(deg * D2R, 2);
}

/** The exact value of a sine or cosine at a multiple of 30° or 45°, as text; otherwise null. */
export function exactText(value) {
  const a = Math.abs(value);
  const sign = value < -1e-9 ? '−' : '';
  if (a < 1e-9) return '0';
  if (Math.abs(a - 1) < 1e-9) return `${sign}1`;
  if (Math.abs(a - 0.5) < 1e-9) return `${sign}1/2`;
  if (Math.abs(a - Math.SQRT1_2) < 1e-9) return `${sign}√2/2`;
  if (Math.abs(a - Math.sqrt(3) / 2) < 1e-9) return `${sign}√3/2`;
  return null;
}

export default function create(spec, env) {
  const isStatic = !!spec.static || env.compact;
  const step = spec.step > 0 ? Number(spec.step) : 1;
  const min = spec.min != null ? Number(spec.min) : 0;
  const max = spec.max != null ? Number(spec.max) : 360;
  const trigNames = spec.names !== 'xy';
  const inRad = spec.unit === 'rad';
  const showLegs = spec.legs !== false;
  const marks = Array.isArray(spec.marks) ? spec.marks : [];
  const snap = (d) => clamp(Math.round(d / step) * step, min, max);
  let deg = snap(spec.deg != null ? Number(spec.deg) : 40);
  let readOnly = !!env.readOnly;

  const quadrantOf = (d) => {
    const a = ((d % 360) + 360) % 360;
    if (a % 90 === 0) return 0;
    return Math.floor(a / 90) + 1;
  };
  const visited = new Set();
  if (quadrantOf(deg)) visited.add(quadrantOf(deg));

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 440, label: spec.alt || 'A point on a circle of radius 1' });
  const { svg } = fr;
  const sx = (x) => CX + x * R;
  const sy = (y) => CY - y * R;

  /* -------------------------------------------------------------- static */
  const axis = { stroke: 'var(--ink-3)', 'stroke-width': 1.6, 'stroke-linecap': 'round' };
  svg.appendChild(s('line', { x1: CX - R - 44, x2: CX + R + 44, y1: CY, y2: CY, ...axis }));
  svg.appendChild(s('line', { x1: CX, x2: CX, y1: CY - R - 44, y2: CY + R + 44, ...axis }));
  for (const v of [-1, -0.5, 0.5, 1]) {
    svg.appendChild(s('line', { x1: sx(v), x2: sx(v), y1: CY - 4, y2: CY + 4, ...axis }));
    svg.appendChild(s('line', { x1: CX - 4, x2: CX + 4, y1: sy(v), y2: sy(v), ...axis }));
  }
  svg.appendChild(s('text.tick-label', { x: sx(1) + 7, y: CY + 15, 'text-anchor': 'start' }, '1'));
  svg.appendChild(s('text.tick-label', { x: sx(-1) - 7, y: CY + 15, 'text-anchor': 'end' }, '−1'));
  svg.appendChild(s('text.tick-label', { x: CX - 8, y: sy(1) - 7, 'text-anchor': 'end' }, '1'));
  svg.appendChild(s('text.tick-label', { x: CX - 8, y: sy(-1) + 17, 'text-anchor': 'end' }, '−1'));
  svg.appendChild(s('text.axis-label', { x: CX + R + 44, y: CY - 8, 'text-anchor': 'end' }, 'x'));
  svg.appendChild(s('text.axis-label', { x: CX + 9, y: CY - R - 34, 'text-anchor': 'start' }, 'y'));
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  for (const m of marks) {
    const a = m * D2R;
    const out = R + 20;
    svg.appendChild(s('line', { x1: CX + (R - 5) * Math.cos(a), y1: CY - (R - 5) * Math.sin(a), x2: CX + (R + 5) * Math.cos(a), y2: CY - (R + 5) * Math.sin(a), stroke: 'var(--ink)', 'stroke-width': 2 }));
    const onAxis = m % 90 === 0;
    svg.appendChild(s('text.fig-label-sm', {
      x: CX + out * Math.cos(a) + (onAxis && m % 180 !== 0 ? 22 : 0), y: CY - out * Math.sin(a) + (onAxis && m % 180 === 0 ? -14 : 0),
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
    }, inRad ? radText(m) : `${m}°`));
  }

  /* ------------------------------------------------------------- dynamic */
  const wedge = s('path', { fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const cosLeg = s('line', { stroke: hue('blue'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const sinLeg = s('line', { stroke: hue('orange'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const radius = s('line', { x1: CX, y1: CY, stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-linecap': 'round' });
  const corner = s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.8 });
  const angleText = s('text.fig-label', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
  const cosText = s('text.fig-label', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: `fill:${hue('blue', 'text')}` });
  const sinText = s('text.fig-label', { 'dominant-baseline': 'middle', style: `fill:${hue('orange', 'text')}` });
  const dot = s('circle', { r: 8, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
  svg.append(wedge, corner);
  if (showLegs) svg.append(cosLeg, sinLeg);
  svg.append(radius, s('circle', { cx: CX, cy: CY, r: 3.5, fill: 'var(--ink)' }), angleText);
  if (showLegs) svg.append(cosText, sinText);

  const values = () => {
    const c = Math.cos(deg * D2R);
    const sn = Math.sin(deg * D2R);
    return { cos: tidy(c, 4), sin: tidy(sn, 4), tan: Math.abs(tidy(c, 9)) < 1e-9 ? null : tidy(sn / c, 4) };
  };
  const getState = () => ({ deg, ...values(), quadrant: quadrantOf(deg), visited: Array.from(visited).sort() });

  const angleLabel = () => (inRad ? radText(deg) : `${formatNumber(deg, 1)}°`);
  const names = {
    angle: { label: '$\\theta$' },
    cos: { label: trigNames ? '$\\cos\\theta$' : '$x$', color: 'blue' },
    sin: { label: trigNames ? '$\\sin\\theta$' : '$y$', color: 'orange' },
    tan: { label: '$\\tan\\theta$', color: 'green' },
    cos2: { label: trigNames ? '$\\cos^2\\theta$' : '$x^2$', color: 'blue' },
    sin2: { label: trigNames ? '$\\sin^2\\theta$' : '$y^2$', color: 'orange' },
  };
  const outs = (env.compact ? [] : (Array.isArray(spec.readouts) ? spec.readouts : ['angle', 'cos', 'sin'])).filter((k) => names[k]).map((key) => {
    const ro = readout(names[key].label, { digits: 3, color: names[key].color });
    fr.readouts.appendChild(ro.el);
    return { key, ro };
  });

  let hd = null;
  let row = null;

  function render() {
    const v = values();
    const a = deg * D2R;
    const px = sx(Math.cos(a));
    const py = sy(Math.sin(a));
    radius.setAttribute('x2', px);
    radius.setAttribute('y2', py);
    cosLeg.setAttribute('x1', CX); cosLeg.setAttribute('y1', CY); cosLeg.setAttribute('x2', px); cosLeg.setAttribute('y2', CY);
    sinLeg.setAttribute('x1', px); sinLeg.setAttribute('y1', CY); sinLeg.setAttribute('x2', px); sinLeg.setAttribute('y2', py);

    // the angle turned so far, as a wedge from the positive x-axis
    const wr = 30;
    const turned = clamp(deg, 0, 360);
    if (turned <= 0) wedge.setAttribute('d', '');
    else if (turned >= 360) wedge.setAttribute('d', `M${CX + wr} ${CY} A${wr} ${wr} 0 1 0 ${CX - wr} ${CY} A${wr} ${wr} 0 1 0 ${CX + wr} ${CY} Z`);
    else wedge.setAttribute('d', `M${CX} ${CY} L${CX + wr} ${CY} A${wr} ${wr} 0 ${turned > 180 ? 1 : 0} 0 ${CX + wr * Math.cos(a)} ${CY - wr * Math.sin(a)} Z`);
    const mid = turned < 24 ? 0.35 : (turned * D2R) / 2;
    const lr = turned < 24 ? 62 : wr + 20;
    angleText.setAttribute('x', CX + lr * Math.cos(mid));
    angleText.setAttribute('y', CY - lr * Math.sin(mid) - (turned < 24 ? 6 : 0));
    angleText.textContent = angleLabel();

    // the right angle between the two legs, when there is a triangle to speak of
    const big = Math.abs(v.cos) > 0.14 && Math.abs(v.sin) > 0.14;
    const q = 9;
    corner.setAttribute('d', showLegs && big ? `M${px - Math.sign(v.cos) * q} ${CY} v${-Math.sign(v.sin) * q} h${Math.sign(v.cos) * q}` : '');

    if (showLegs) {
      cosText.textContent = Math.abs(v.cos) > 0.2 ? formatNumber(v.cos, 2) : '';
      cosText.setAttribute('x', (CX + px) / 2);
      cosText.setAttribute('y', CY + (v.sin >= 0 ? 15 : -14));
      sinText.textContent = Math.abs(v.sin) > 0.14 ? formatNumber(v.sin, 2) : '';
      sinText.setAttribute('x', px + (v.cos >= 0 ? 9 : -9));
      sinText.setAttribute('y', (CY + py) / 2);
      sinText.setAttribute('text-anchor', v.cos >= 0 ? 'start' : 'end');
    }

    dot.setAttribute('cx', px);
    dot.setAttribute('cy', py);
    if (hd) { hd.set(px, py); hd.setLabel(`${formatNumber(deg, 1)} degrees: x ${formatNumber(v.cos, 2)}, y ${formatNumber(v.sin, 2)}`); }

    const withExact = (num, raw) => {
      const text = spec.exact ? exactText(raw) : null;
      if (text == null || /^[−]?[01]$/.test(text)) return formatNumber(num, 3);
      return text.includes('√') ? `${text} ≈ ${formatNumber(num, 3)}` : `${text} = ${formatNumber(num, 3)}`;
    };
    for (const { key, ro } of outs) {
      if (key === 'angle') ro.set(inRad ? `${radText(deg)} rad` : `${formatNumber(deg, 1)}°`);
      else if (key === 'cos') ro.set(withExact(v.cos, Math.cos(a)));
      else if (key === 'sin') ro.set(withExact(v.sin, Math.sin(a)));
      else if (key === 'tan') ro.set(v.tan == null ? 'undefined' : formatNumber(v.tan, 3));
      else if (key === 'cos2') ro.set(tidy(v.cos * v.cos, 3));
      else if (key === 'sin2') ro.set(tidy(v.sin * v.sin, 3));
    }
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The point is at ${formatNumber(deg, 1)} degrees, with x-coordinate ${formatNumber(v.cos, 2)} and y-coordinate ${formatNumber(v.sin, 2)}.`);
  }

  const moveTo = (next, fromSlider) => {
    const d = snap(next);
    if (d === deg) return;
    deg = d;
    if (quadrantOf(deg)) visited.add(quadrantOf(deg));
    if (row && !fromSlider) row.set(deg);
    render();
    env.onChange(getState());
  };

  if (isStatic) svg.appendChild(dot);
  else {
    hd = handle(svg, {
      color: 'green', label: 'The point on the circle', keyStep: Math.max(10, R * step * D2R * 1.2),
      onMove: (hx, hy) => {
        if (readOnly) return;
        let a = Math.atan2(CY - hy, hx - CX) / D2R;
        if (a < 0) a += 360;
        // stay on the near side of the gap when the allowed range is only part of the circle
        if (a > max && max < 360) a = a - max < 360 + min - a ? max : min;
        if (a < min) a = min;
        // let the point reach a full turn when it is dragged on past 359°
        if (max >= 360 && deg > 270 && a < 90 && min <= 0) a = Math.round(a / step) * step === 0 ? 360 : a;
        moveTo(a, false);
      },
    });
    svg.appendChild(hd.el);
    if (spec.slider !== false) {
      row = sliderRow({
        label: 'angle $\\theta$', min, max, step, value: deg, color: 'yellow', format: (v) => (inRad ? radText(v) : `${formatNumber(v, 1)}°`),
        onInput: (v) => { if (readOnly) return; moveTo(v, true); },
      });
      fr.controls.appendChild(row.el);
    }
  }
  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || next.deg == null) return;
      deg = snap(Number(next.deg));
      if (quadrantOf(deg)) visited.add(quadrantOf(deg));
      if (row) row.set(deg);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      if (row) row.setDisabled(readOnly);
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'Walk the point around', spec: { type: 'unit-circle', deg: 40 } },
  { title: 'The first quarter, as x and y', spec: { type: 'unit-circle', deg: 35, min: 0, max: 90, names: 'xy' } },
  { title: 'Special angles, exact values', spec: { type: 'unit-circle', deg: 60, step: 15, exact: true, marks: [0, 90, 180, 270] } },
  { title: 'Pythagoras on the circle', spec: { type: 'unit-circle', deg: 130, step: 5, readouts: ['angle', 'cos2', 'sin2'] } },
  { title: 'In radians', spec: { type: 'unit-circle', deg: 120, step: 15, unit: 'rad' } },
];
