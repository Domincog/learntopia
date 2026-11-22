/**
 * radian-wrap — lay radius-lengths along the edge of a circle and see what
 * angle they span. One radius-length of arc is one radian, a half turn takes
 * π of them (3.14…) and a full turn 2π (6.28…), whatever the size of the
 * circle. The arc is drawn in alternating colours, one colour per radius-length.
 *
 * {
 *   type: 'radian-wrap',
 *   mode: 'radius',          // 'radius': the arc is set in radius-lengths, in steps of `step`.
 *                            //           Quarter, half, three-quarter and full turns snap exactly (1.57, 3.14, 4.71, 6.28).
 *                            // 'pi':     the angle moves in steps of π/12 (15°), named as multiples of π.
 *   arc: 0.5,                // starting arc, in radius-lengths (= radians); in 'pi' mode use deg instead
 *   deg: 60,                 // starting angle in 'pi' mode (a multiple of 15)
 *   step: 0.1,               // 'radius' mode: step of the arc slider
 *   r: 2,                    // radius of the circle (in length units; only its size on screen changes)
 *   rRange: [1, 3], rStep: 0.5,   // adds a slider for the radius
 *   readouts: ['ratio', 'deg'],   // any of: 'lengths' (arc and radius, as lengths), 'ratio' (arc ÷ radius),
 *                                 //         'rad' (the angle in radians), 'deg' (the angle in degrees)
 *   unit: 'cm',              // unit for the 'lengths' readout
 *   static: false,
 * }
 *
 * State: { arc, rad, deg, turns, full, r, length, sizes, sizesTried }
 *   arc, rad   the arc in radius-lengths, which is the angle in radians (4 decimals)
 *   deg        the angle in degrees (1 decimal; exact multiples of 15 in 'pi' mode)
 *   turns      the angle as a fraction of a full turn (0.25 and 0.5 are exact)
 *   full       true when the arc goes all the way round
 *   r, length  the radius and the length of the arc (r × rad), in length units
 *   sizes      every radius tried so far (sorted); sizesTried is how many
 *
 * setState accepts { arc } or { deg }, and { r, sizes }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, tidy, formatNumber } from './kit.js';

const W = 440;
const H = 400;
const CX = 220;
const CY = 204;
const RMAX = 138;
const TAU = Math.PI * 2;
const SPECIAL = [Math.PI / 2, Math.PI, (3 * Math.PI) / 2, TAU];

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** A multiple of 15 degrees as a multiple of π: 120 -> "2π/3". */
const piText = (deg) => {
  if (deg === 0) return '0';
  const g = gcd(deg, 180);
  const n = deg / g;
  const d = 180 / g;
  return `${n === 1 ? '' : n}π${d === 1 ? '' : `/${d}`}`;
};

export default function create(spec, env) {
  const isStatic = !!spec.static || env.compact;
  const piMode = spec.mode === 'pi';
  const step = piMode ? Math.PI / 12 : (spec.step > 0 ? Number(spec.step) : 0.1);
  const kMax = piMode ? 24 : Math.ceil(TAU / step - 1e-9);
  const rRange = !isStatic && Array.isArray(spec.rRange) ? spec.rRange.map(Number) : null;
  const rStep = spec.rStep || 0.5;
  const unit = spec.unit || '';
  let r = Number(spec.r) > 0 ? Number(spec.r) : 2;
  if (rRange) r = clamp(r, rRange[0], rRange[1]);
  const sizes = new Set([r]);
  let readOnly = !!env.readOnly;

  /** The arc (in radius-lengths) at slider position k. */
  const arcOf = (k) => {
    if (piMode) return (k * Math.PI) / 12;
    const v = k * step;
    for (const q of SPECIAL) if (Math.abs(v - q) <= step / 2 + 1e-9) return q;
    return Math.min(v, TAU);
  };
  const kOf = (arc) => clamp(Math.round(arc / step), 0, kMax);
  let k = piMode ? kOf(((Number(spec.deg) || 0) * Math.PI) / 180) : kOf(spec.arc != null ? Number(spec.arc) : 0.5);

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 460, label: spec.alt || 'An arc laid along the edge of a circle' });
  const { svg } = fr;
  const rPx = () => (rRange ? (r / rRange[1]) * RMAX : RMAX * 0.94);

  const circle = s('circle', { cx: CX, cy: CY, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 3 });
  const wedge = s('path', { fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const gArc = s('g');
  const gTicks = s('g');
  const base = s('line', { x1: CX, y1: CY, y2: CY, stroke: hue('orange'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  const arm = s('line', { x1: CX, y1: CY, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' });
  const baseText = s('text.fig-label-sm', { y: CY + 18, 'text-anchor': 'middle', style: `fill:${hue('orange', 'text')}` }, 'radius');
  const dot = s('circle', { r: 8, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
  svg.append(circle, wedge, gArc, gTicks, arm, base, s('circle', { cx: CX, cy: CY, r: 3.5, fill: 'var(--ink)' }), baseText);

  const getState = () => {
    const arc = arcOf(k);
    return {
      arc: tidy(arc, 4), rad: tidy(arc, 4),
      deg: piMode ? k * 15 : tidy((arc * 180) / Math.PI, 1),
      turns: tidy(arc / TAU, 4), full: arc >= TAU - 1e-9,
      r, length: tidy(arc * r, 4),
      sizes: Array.from(sizes).sort((a, b) => a - b), sizesTried: sizes.size,
    };
  };

  const wanted = env.compact ? [] : (Array.isArray(spec.readouts) ? spec.readouts : ['ratio', 'deg']);
  const outs = {};
  const addOut = (key, label, opts) => { outs[key] = readout(label, opts); fr.readouts.appendChild(outs[key].el); };
  if (wanted.includes('lengths')) { addOut('arcLength', 'arc', { digits: 2, color: 'orange', unit }); addOut('radius', 'radius', { digits: 2, unit }); }
  if (wanted.includes('ratio')) addOut('ratio', 'arc ÷ radius', { digits: 2, color: 'orange' });
  if (wanted.includes('rad')) addOut('rad', 'angle', { digits: 2 });
  if (wanted.includes('deg')) addOut('deg', wanted.includes('rad') ? 'in degrees' : 'angle', { digits: 1, unit: '°' });

  const radLabel = (st) => (piMode ? `${piText(st.deg)} rad` : `${formatNumber(st.rad, 2)} rad`);
  const point = (a, rad) => ({ x: CX + rad * Math.cos(a), y: CY - rad * Math.sin(a) });
  const arcPath = (a0, a1, rad) => {
    const p0 = point(a0, rad);
    const p1 = point(a1, rad);
    return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${rad} ${rad} 0 ${a1 - a0 > Math.PI ? 1 : 0} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  };

  let hd = null;
  let arcRow = null;
  let rRow = null;

  function render() {
    const st = getState();
    const R = rPx();
    const a = st.arc;
    circle.setAttribute('r', R);
    base.setAttribute('x2', CX + R);
    baseText.setAttribute('x', CX + R / 2);
    const end = point(a, R);
    arm.setAttribute('x2', end.x);
    arm.setAttribute('y2', end.y);

    // the arc, one colour per radius-length
    gArc.replaceChildren();
    gTicks.replaceChildren();
    for (let n = 0; n < a - 1e-9; n++) {
      const to = Math.min(n + 1, a);
      // split long pieces so that no single SVG arc is close to a full circle
      const midA = (n + to) / 2;
      for (const [u, v] of [[n, midA], [midA, to]]) {
        gArc.appendChild(s('path', { d: arcPath(u, v, R), fill: 'none', stroke: hue(n % 2 ? 'teal' : 'orange'), 'stroke-width': 7, 'stroke-linecap': 'butt' }));
      }
    }
    for (let n = 1; n <= a + 1e-9 && n <= 6; n++) {
      const p0 = point(n, R - 8);
      const p1 = point(n, R + 8);
      const pt = point(n, R + 22);
      gTicks.appendChild(s('line', { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      gTicks.appendChild(s('text.fig-label', { x: pt.x, y: pt.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, String(n)));
    }

    const wr = Math.min(30, R * 0.4);
    if (a <= 1e-9) wedge.setAttribute('d', '');
    else if (st.full) wedge.setAttribute('d', `M${CX + wr} ${CY} A${wr} ${wr} 0 1 0 ${CX - wr} ${CY} A${wr} ${wr} 0 1 0 ${CX + wr} ${CY} Z`);
    else { const w = point(a, wr); wedge.setAttribute('d', `M${CX} ${CY} L${CX + wr} ${CY} A${wr} ${wr} 0 ${a > Math.PI ? 1 : 0} 0 ${w.x} ${w.y} Z`); }

    dot.setAttribute('cx', end.x);
    dot.setAttribute('cy', end.y);
    if (hd) { hd.set(end.x, end.y); hd.setLabel(`${formatNumber(st.arc, 2)} radius-lengths of arc, ${formatNumber(st.deg, 1)} degrees`); }

    if (outs.arcLength) outs.arcLength.set(st.length);
    if (outs.radius) outs.radius.set(r);
    if (outs.ratio) outs.ratio.set(st.arc);
    if (outs.rad) outs.rad.set(radLabel(st));
    if (outs.deg) outs.deg.set(st.deg);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The arc is ${formatNumber(st.arc, 2)} radius-lengths long${wanted.includes('deg') ? `, which spans ${formatNumber(st.deg, 1)} degrees` : ''}.`);
  }

  const setK = (next, fromSlider) => {
    const v = clamp(Math.round(next), 0, kMax);
    if (v === k) return;
    k = v;
    if (arcRow && !fromSlider) arcRow.set(k);
    render();
    env.onChange(getState());
  };

  if (isStatic) svg.appendChild(dot);
  else {
    hd = handle(svg, {
      // one press of an arrow key has to carry the point at least one step along the edge
      color: 'green', label: 'The end of the arc', keyStep: Math.max(12, RMAX * 0.94 * step * 1.4),
      onMove: (hx, hy) => {
        if (readOnly) return;
        let a = Math.atan2(CY - hy, hx - CX);
        if (a < 0) a += TAU;
        // near the start: stay at the full turn if that is where the arc already is
        if (k > kMax * 0.75 && a < 1) a = TAU;
        setK(a / step, false);
      },
    });
    svg.appendChild(hd.el);
    const showsDeg = wanted.includes('deg') && !wanted.includes('rad');
    const showsRad = wanted.includes('rad') && !wanted.includes('deg');
    arcRow = sliderRow({
      label: piMode ? 'angle' : 'arc, in radius-lengths', min: 0, max: kMax, step: 1, value: k, color: 'orange',
      format: (v) => {
        const arc = arcOf(v);
        if (piMode) return showsDeg ? `${v * 15}°` : showsRad ? piText(v * 15) : `${v * 15}° = ${piText(v * 15)}`;
        return formatNumber(arc, 2);
      },
      onInput: (v) => { if (readOnly) return; setK(v, true); },
    });
    fr.controls.appendChild(arcRow.el);
    if (rRange) {
      rRow = sliderRow({
        label: 'size of the circle', min: rRange[0], max: rRange[1], step: rStep, value: r, color: 'blue', unit,
        format: unit ? null : (v) => `radius ${formatNumber(v, 2)}`,
        onInput: (v) => { if (readOnly) return; r = v; sizes.add(v); render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(rRow.el);
    }
  }
  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.deg != null && piMode) k = kOf((Number(next.deg) * Math.PI) / 180);
      else if (next.arc != null) k = kOf(Number(next.arc));
      if (next.r != null && rRange) { r = clamp(Number(next.r), rRange[0], rRange[1]); if (rRow) rRow.set(r); }
      if (Array.isArray(next.sizes) && rRange) for (const v of next.sizes) if (Number(v) >= rRange[0] && Number(v) <= rRange[1]) sizes.add(Number(v));
      sizes.add(r);
      if (arcRow) arcRow.set(k);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      if (arcRow) arcRow.setDisabled(readOnly);
      if (rRow) rRow.setDisabled(readOnly);
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'One radius-length of arc', spec: { type: 'radian-wrap', arc: 1, r: 2, rRange: [1, 3], readouts: ['ratio', 'deg'] } },
  { title: 'All the way round', spec: { type: 'radian-wrap', arc: 4 } },
  { title: 'Multiples of π', spec: { type: 'radian-wrap', mode: 'pi', deg: 120, readouts: ['rad', 'deg'] } },
];
