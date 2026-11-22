/**
 * circle-velocity — a point walking round the unit circle, with its velocity
 * drawn as an arrow. The angle is in radians, so the point covers one unit of
 * arc per unit of angle: the arrow has length 1, and it is at right angles to
 * the radius. That makes the velocity triangle a copy of the position
 * triangle turned through a quarter turn: the point rises at cos θ and moves
 * sideways at −sin θ. In other words, the derivative of sine is cosine and
 * the derivative of cosine is minus sine.
 *
 * Lengths that are equal share a colour: blue for cos θ, orange for sin θ.
 *
 * {
 *   type: 'circle-velocity',
 *   deg: 30,                 // where the point starts, in degrees counter-clockwise from the positive x-axis
 *   step: 15,                // the point snaps to multiples of this many degrees
 *   parts: true,             // draw the sideways and upward parts of the velocity (dashed)
 *   legs: true,              // draw the two legs of the position triangle (cos θ along the axis, sin θ up)
 *   readouts: ['angle', 'height', 'rising'],   // any of: angle · height (sin θ) · rising (cos θ, the rate of change of the height)
 *                                              //         · across (cos θ, the x-coordinate) · sideways (−sin θ, its rate of change)
 *   static: false,
 * }
 *
 * State: { deg, rad, sin, cos, vx, vy, visited }
 *   sin, cos   the height and the x-coordinate of the point (4 decimals)
 *   vx, vy     the sideways and upward parts of the velocity: −sin θ and cos θ (4 decimals)
 *   visited    every angle (in degrees) the point has been at, sorted
 *
 * setState accepts { deg }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, tidy, formatNumber, arrowMarker } from './kit.js';

const W = 480;
const H = 430;
const CX = 240;
const CY = 216;
const R = 126;
const D2R = Math.PI / 180;

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** An angle in degrees written in radians: 120 -> "2π/3", 37 -> "0.65". */
export function radiansText(deg) {
  if (deg === 0) return '0';
  if (Number.isInteger(deg) && deg % 15 === 0) {
    const g = gcd(deg, 180);
    const n = deg / g;
    const d = 180 / g;
    return `${n === 1 ? '' : formatNumber(n, 0)}π${d === 1 ? '' : `/${d}`}`;
  }
  return formatNumber(deg * D2R, 2);
}

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const step = spec.step > 0 ? Number(spec.step) : 15;
  const showParts = spec.parts !== false;
  const showLegs = spec.legs !== false;
  const snap = (d) => clamp(Math.round(d / step) * step, 0, 360);
  let deg = snap(spec.deg != null ? Number(spec.deg) : 30);
  let readOnly = !!env.readOnly;
  const visited = new Set([deg]);

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 470, label: spec.alt || 'A point moving round a circle of radius 1, with its velocity drawn as an arrow' });
  const { svg } = fr;
  const sx = (x) => CX + x * R;
  const sy = (y) => CY - y * R;

  /* -------------------------------------------------------------- static */
  const axis = { stroke: 'var(--ink-3)', 'stroke-width': 1.6, 'stroke-linecap': 'round' };
  svg.appendChild(s('line', { x1: CX - R - 56, x2: CX + R + 56, y1: CY, y2: CY, ...axis }));
  svg.appendChild(s('line', { x1: CX, x2: CX, y1: CY - R - 56, y2: CY + R + 56, ...axis }));
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));

  /* ------------------------------------------------------------- dynamic */
  const line = (color, width, dashed) => s('line', { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? '6 6' : null });
  const cosLeg = line(hue('blue'), 5);
  const sinLeg = line(hue('orange'), 5);
  const radius = line('var(--ink)', 2.5);
  const partX = line(hue('orange'), 4, true);
  const partY = line(hue('blue'), 4, true);
  const corner = s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.8 });
  const arrow = s('line', { stroke: hue('green'), 'stroke-width': 4.5, 'stroke-linecap': 'round', 'marker-end': arrowMarker(svg, 'green', 5) });
  if (showLegs) svg.append(cosLeg, sinLeg);
  svg.append(radius, s('circle', { cx: CX, cy: CY, r: 3.5, fill: 'var(--ink)' }), corner);
  if (showParts) svg.append(partX, partY);
  svg.appendChild(arrow);
  const label = (color, anchor = 'middle') => { const el = s('text', { class: `fig-label text-${color}`, 'text-anchor': anchor, 'dominant-baseline': 'middle' }); svg.appendChild(el); return el; };
  const cosText = label('blue');
  const sinText = label('orange');
  const vxText = label('orange');
  const vyText = label('blue');
  const dot = s('circle', { r: 8, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });

  const values = () => {
    const a = deg * D2R;
    return { sin: tidy(Math.sin(a), 4), cos: tidy(Math.cos(a), 4), vx: tidy(-Math.sin(a), 4), vy: tidy(Math.cos(a), 4) };
  };
  const getState = () => ({ deg, rad: tidy(deg * D2R, 4), ...values(), visited: Array.from(visited).sort((a, b) => a - b) });

  const names = {
    angle: { label: 'angle $\\theta$' },
    height: { label: 'height: $\\sin\\theta$', color: 'orange' },
    rising: { label: 'height is changing at', color: 'blue' },
    across: { label: '$x$: $\\cos\\theta$', color: 'blue' },
    sideways: { label: '$x$ is changing at', color: 'orange' },
  };
  const outs = (env.compact ? [] : (Array.isArray(spec.readouts) ? spec.readouts : ['angle', 'height', 'rising'])).filter((key) => names[key]).map((key) => {
    const ro = readout(names[key].label, { digits: 2, color: names[key].color });
    fr.readouts.appendChild(ro.el);
    return { key, ro };
  });

  let hd = null;
  let row = null;
  const set = (el, x1, y1, x2, y2) => { el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2); };
  const put = (el, x, y, text) => { el.setAttribute('x', x); el.setAttribute('y', y); el.textContent = text; };

  function render() {
    const v = values();
    const a = deg * D2R;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const px = sx(c);
    const py = sy(sn);
    const tx = px - sn * R;      // tip of the velocity arrow
    const ty = py - c * R;
    set(radius, CX, CY, px, py);
    set(cosLeg, CX, CY, px, CY);
    set(sinLeg, px, CY, px, py);
    set(arrow, px, py, px - sn * (R - 9), py - c * (R - 9));   // stops short so the arrowhead ends at the tip
    set(partX, px, py, tx, py);
    set(partY, tx, py, tx, ty);
    // right angle between the radius and the velocity
    const q = 17;
    const ux = -c * q; const uy = sn * q;       // towards the centre
    const wx = -sn * q; const wy = -c * q;      // along the velocity
    corner.setAttribute('d', `M${px + ux} ${py + uy} l${wx} ${wy} l${-ux} ${-uy}`);

    // a number is written beside a side only when that side is long enough to carry it
    const big = (t) => Math.abs(t) > 0.3;
    const up = c >= 0 ? 1 : -1;        // the velocity triangle lies above (1) or below (-1) its sideways part
    const roomy = Math.abs(c) * R / 2 > 36;
    put(cosText, (CX + px) / 2, CY + (sn >= 0 ? 16 : -15), showLegs && big(c) ? formatNumber(v.cos, 2) : '');
    put(sinText, px + (c >= 0 ? 9 : -9), (CY + py) / 2, showLegs && big(sn) ? formatNumber(v.sin, 2) : '');
    sinText.setAttribute('text-anchor', c >= 0 ? 'start' : 'end');
    // inside the triangle when there is room (clear of the radius), otherwise just outside it
    put(vxText, (px + tx) / 2, py - up * (roomy ? 15 : -16), showParts && big(sn) ? formatNumber(v.vx, 2) : '');
    put(vyText, tx + (sn >= 0 ? -9 : 9), (py + ty) / 2, showParts && big(c) ? formatNumber(v.vy, 2) : '');
    vyText.setAttribute('text-anchor', sn >= 0 ? 'end' : 'start');

    dot.setAttribute('cx', px);
    dot.setAttribute('cy', py);
    if (hd) { hd.set(px, py); hd.setLabel(`angle ${radiansText(deg)} radians: height ${formatNumber(v.sin, 2)}, rising at ${formatNumber(v.vy, 2)}`); }
    for (const { key, ro } of outs) {
      if (key === 'angle') ro.set(`${radiansText(deg)}${deg % 15 === 0 && deg !== 0 ? ` ≈ ${formatNumber(deg * D2R, 2)}` : ''}`);
      else if (key === 'height') ro.set(v.sin);
      else if (key === 'rising') ro.set(v.vy);
      else if (key === 'across') ro.set(v.cos);
      else if (key === 'sideways') ro.set(v.vx);
    }
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The point is at angle ${radiansText(deg)} radians: x-coordinate ${formatNumber(v.cos, 2)}, height ${formatNumber(v.sin, 2)}. Its velocity arrow, at right angles to the radius, points ${formatNumber(v.vx, 2)} across and ${formatNumber(v.vy, 2)} up.`);
  }

  const moveTo = (next, fromSlider) => {
    const d = snap(next);
    if (d === deg) return;
    deg = d;
    visited.add(deg);
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
        if (deg > 270 && a < 90) a = Math.round(a / step) * step === 0 ? 360 : a;   // let the point complete the turn
        moveTo(a, false);
      },
    });
    svg.appendChild(hd.el);
    row = sliderRow({
      label: 'angle $\\theta$', min: 0, max: 360, step, value: deg, color: 'green', format: (v) => radiansText(v),
      onInput: (v) => { if (readOnly) return; moveTo(v, true); },
    });
    fr.controls.appendChild(row.el);
  }
  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || next.deg == null) return;
      deg = snap(Number(next.deg));
      visited.add(deg);
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
  { title: 'circle-velocity — why the slope of sine is cosine', spec: { type: 'circle-velocity', deg: 30 } },
  { title: 'circle-velocity — both coordinates and both rates', spec: { type: 'circle-velocity', deg: 120, readouts: ['angle', 'height', 'rising', 'across', 'sideways'] } },
];
