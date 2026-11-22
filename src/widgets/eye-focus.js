/**
 * eye-focus — a side view of an eye bringing light to a focus. Rays from an
 * object pass the cornea and lens and meet at a point: on the retina (a sharp
 * image), in front of it, or behind it (a blurred one). The learner can move
 * the object, change the shape of the eye's own lens, and put a spectacle lens
 * in front of the eye. A small panel shows what the eye would see.
 *
 * {
 *   type: 'eye-focus',
 *   eye: 0,                    // the eye's focusing error in dioptres: 0 a typical eye,
 *                              //   +2 too strong for its length (a long eyeball: short sight),
 *                              //   −2 too weak for its length (a short eyeball: long sight)
 *   distance: 6,               // object distance in metres: one of 6 ("far away"), 2, 1, 0.5, 0.25
 *   distances: [6, 2, 1, 0.5, 0.25],   // positions offered by the distance slider (omit `distanceSlider` to hide it)
 *   distanceSlider: true,
 *   lens: 0,                   // extra power of the eye's own lens when it fattens, in dioptres (0 = relaxed)
 *   lensRange: [0, 4, 1],      // slider [min, max, step]; null hides the slider (the lens then stays as given)
 *   glasses: 0,                // power of a spectacle lens in dioptres (minus: thinner in the middle; plus: fatter in the middle)
 *   glassesRange: [-4, 4, 1],  // slider; null: no spectacle lens
 *   static: false,
 * }
 *
 * State: { eye, distance, lens, glasses, error, where, sharp, tried }
 *   error   focusing error in dioptres: eye + lens + glasses − 1/distance (an object at 6 m or more counts as
 *           infinitely far, 1/distance = 0). Positive: the rays meet in front of the retina; negative: behind it
 *   where   'retina' | 'front' | 'behind'
 *   sharp   |error| < 0.25 dioptres
 *   tried   every glasses power the learner has set
 *
 * setState({ distance, lens, glasses }).
 *
 * The model is a single thin lens: powers simply add, and a dioptre is 1 ÷ (focal length in metres). A real eye
 * has about 60 dioptres in all, two thirds of it from the cornea. The drawing exaggerates the focusing error (a
 * real one moves the focus by a fraction of a millimetre) and the length of a short- or long-sighted eye.
 */
import { frame, sliderRow, readout, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 250;
const CY = 118;
const XL = 318;          // the eye's lens
const XR0 = 478;         // the retina of a typical eye
const PX_PER_D = 15;     // how far one dioptre of error moves the drawn focus

addStyles('eye-focus', `
  .widget-eye-focus .ef-blur { transition: filter 0.2s; }
`);

let seq = 0;

export default function create(spec, env) {
  const eye = spec.eye || 0;
  const isStatic = !!spec.static || !!env.compact;
  const distances = Array.isArray(spec.distances) ? spec.distances : [6, 2, 1, 0.5, 0.25];
  const lensRange = spec.lensRange === null ? null : (spec.lensRange || null);
  const glassesRange = spec.glassesRange === null ? null : (spec.glassesRange || null);
  let distance = spec.distance != null ? spec.distance : 6;
  let lens = spec.lens || 0;
  let glasses = spec.glasses || 0;
  let readOnly = !!env.readOnly;
  const tried = [];
  const id = `ef-blur-${++seq}`;

  const vergence = (d) => (d >= 6 ? 0 : 1 / d);
  const errorOf = () => Math.round((eye + lens + glasses - vergence(distance)) * 100) / 100;
  const distText = (d) => (d >= 6 ? 'far away' : d >= 1 ? `${d} m` : `${Math.round(d * 100)} cm`);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'An eye focusing light, seen from the side' });
  const { svg } = fr;
  const defs = s('defs');
  const blur = s('feGaussianBlur', { stdDeviation: 0 });
  defs.appendChild(s('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, blur));
  svg.appendChild(defs);

  const XR = XR0 + eye * 12;                       // a short-sighted eye is drawn longer, a long-sighted one shorter
  const gEye = s('g');
  const gRays = s('g');
  const gGlass = s('g');
  const gObj = s('g');
  const gSeen = s('g');
  svg.append(gEye, gRays, gGlass, gObj, gSeen);

  // the eyeball: an ellipse from the cornea to the retina, with a bulging cornea and an iris
  const ecx = (XL - 22 + XR) / 2;
  const erx = (XR - (XL - 22)) / 2;
  gEye.appendChild(s('ellipse', { cx: ecx, cy: CY, rx: erx, ry: 78, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3 }));
  gEye.appendChild(s('path', { d: `M${XL - 14} ${CY - 44} Q${XL - 46} ${CY} ${XL - 14} ${CY + 44}`, fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  gEye.appendChild(s('path', { d: `M${XL - 4} ${CY - 60} V${CY - 30} M${XL - 4} ${CY + 30} V${CY + 60}`, fill: 'none', stroke: hue('teal'), 'stroke-width': 6, 'stroke-linecap': 'round' }));
  gEye.appendChild(s('path', { d: `M${XR - 2} ${CY - 34} Q${XR + 5} ${CY} ${XR - 2} ${CY + 34}`, fill: 'none', stroke: hue('orange'), 'stroke-width': 6, 'stroke-linecap': 'round' }));
  gEye.appendChild(s('text.fig-label-sm', { x: XR - 14, y: CY - 44, 'text-anchor': 'end' }, 'retina'));
  gEye.appendChild(s('text.fig-label-sm', { x: XL - 36, y: CY - 58, 'text-anchor': 'end' }, 'cornea'));
  const eyeLens = s('ellipse', { cx: XL + 8, cy: CY, ry: 27, fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  gEye.appendChild(eyeLens);
  gEye.appendChild(s('text.fig-label-sm', { x: XL + 14, y: CY + 54, 'text-anchor': 'start' }, 'lens'));
  // what the eye sees
  gSeen.appendChild(s('rect', { x: 14, y: 176, width: 92, height: 62, rx: 10, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const letter = s('text', { class: 'ef-blur', x: 60, y: 224, 'text-anchor': 'middle', 'font-size': 46, 'font-weight': 800, fill: 'var(--ink)', filter: `url(#${id})`, style: 'font-family: var(--font-body)' }, 'E');
  gSeen.appendChild(letter);
  gSeen.appendChild(s('text.fig-label-sm', { x: 114, y: 212, 'text-anchor': 'start' }, 'what this eye sees'));

  const roWhere = readout('the rays meet', { color: 'orange' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let dRow = null;
  let lRow = null;
  let gRow = null;

  const whereOf = (e) => (Math.abs(e) < 0.25 ? 'retina' : e > 0 ? 'front' : 'behind');
  const getState = () => {
    const error = errorOf();
    return { eye, distance, lens, glasses, error, where: whereOf(error), sharp: Math.abs(error) < 0.25, tried: tried.slice() };
  };

  function render() {
    const error = errorOf();
    const where = whereOf(error);
    const xf = clamp(XR - error * PX_PER_D, XL + 60, W - 8);
    // the eye's lens fattens as it accommodates
    eyeLens.setAttribute('rx', 8 + lens * 2.2);

    gRays.replaceChildren();
    gObj.replaceChildren();
    const far = distance >= 6;
    const xo = far ? 12 : 232 - clamp(Math.log2(distance / 0.25), 0, 3) * 56;      // 25 cm → 232, 50 cm → 176, 1 m → 120, 2 m → 64
    const ray = { fill: 'none', stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const withGlass = !!(glassesRange || glasses);
    for (const sign of [-1, 1]) {
      // a spectacle lens bends the rays a little before they reach the eye: apart (minus) or together (plus)
      const yl = CY + sign * (24 - glasses * 2.4);
      const start = (far ? `M${xo} ${CY + sign * 24}` : `M${xo + 8} ${CY}`) + (withGlass ? ` L262 ${CY + sign * (far ? 24 : 21)}` : '');
      // after the lens the ray heads for the focus; it is drawn as far as the retina
      const t = (XR - XL) / (xf - XL);
      const yr = yl + (CY - yl) * t;
      gRays.appendChild(s('path', { d: `${start} L${XL + 8} ${yl} L${XR - 3} ${yr.toFixed(1)}`, ...ray }));
      if (xf > XR) gRays.appendChild(s('path', { d: `M${XR} ${yr.toFixed(1)} L${xf} ${CY}`, ...ray, 'stroke-dasharray': '3 6', opacity: 0.8 }));
    }
    gRays.appendChild(s('circle', { cx: xf, cy: CY, r: 6, fill: hue(where === 'retina' ? 'green' : 'red'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    if (far) {
      gObj.appendChild(s('text.fig-label-sm', { x: 14, y: CY - 36, 'text-anchor': 'start' }, 'light from far away'));
    } else {
      gObj.appendChild(s('path', { d: `M${xo} ${CY + 26} V${CY - 26} M${xo - 8} ${CY - 15} L${xo} ${CY - 27} L${xo + 8} ${CY - 15}`, fill: 'none', stroke: hue('violet'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      gObj.appendChild(s('text.fig-label-sm', { x: xo, y: CY - 36, 'text-anchor': 'middle' }, `object, ${distText(distance)}`));
    }

    // spectacle lens
    gGlass.replaceChildren();
    if (glassesRange || glasses) {
      const x = 262;
      const b = clamp(glasses * 3, -10, 12);   // bulge of each face
      const d = glasses >= 0
        ? `M${x} ${CY - 46} Q${x + 5 + b} ${CY} ${x} ${CY + 46} Q${x - 5 - b} ${CY} ${x} ${CY - 46} Z`
        : `M${x - 8} ${CY - 46} H${x + 8} Q${x + 8 + b} ${CY} ${x + 8} ${CY + 46} H${x - 8} Q${x - 8 - b} ${CY} ${x - 8} ${CY - 46} Z`;
      gGlass.appendChild(s('path', { d, fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round', opacity: glasses === 0 ? 0.45 : 1 }));
      gGlass.appendChild(s('text.fig-label-sm', { x, y: CY + 66, 'text-anchor': 'middle' }, glasses === 0 ? 'no glasses' : `${glasses > 0 ? '+' : '−'}${Math.abs(glasses)} lens`));
    }

    blur.setAttribute('stdDeviation', (Math.min(Math.abs(error), 5) * 1.6).toFixed(2));
    const words = where === 'retina' ? 'on the retina: sharp' : where === 'front' ? 'in front of the retina: blurred' : 'behind the retina: blurred';
    roWhere.set(words);
    svg.setAttribute('aria-label', `${spec.alt || 'An eye focusing light, seen from the side'}. The object is ${distText(distance)}.${glassesRange ? ` Spectacle lens: ${glasses} dioptres.` : ''} The rays meet ${words}.`);
  }

  function changed(sound = true) {
    render();
    if (sound) play('tap');
    env.onChange(getState());
  }

  if (!isStatic) {
    fr.readouts.appendChild(roWhere.el);
    if (spec.distanceSlider) {
      const start = Math.max(0, distances.indexOf(distance));
      dRow = sliderRow({ label: 'object', min: 0, max: distances.length - 1, step: 1, value: start, color: 'violet', format: (i) => distText(distances[i]), onInput: (i) => { if (readOnly) return; distance = distances[i]; changed(); } });
      fr.controls.appendChild(dRow.el);
    }
    if (lensRange) {
      lRow = sliderRow({ label: "the eye's lens", min: lensRange[0], max: lensRange[1], step: lensRange[2] || 1, value: lens, color: 'yellow', format: (v) => (v === 0 ? 'relaxed (thin)' : `fatter: +${v}`), onInput: (v) => { if (readOnly) return; lens = v; changed(); } });
      fr.controls.appendChild(lRow.el);
    }
    if (glassesRange) {
      gRow = sliderRow({ label: 'spectacle lens', min: glassesRange[0], max: glassesRange[1], step: glassesRange[2] || 1, value: glasses, color: 'blue', format: (v) => (v === 0 ? 'none' : `${v > 0 ? '+' : '−'}${Math.abs(v)} dioptres`), onInput: (v) => { if (readOnly) return; glasses = v; if (!tried.includes(v)) tried.push(v); changed(); } });
      fr.controls.appendChild(gRow.el);
    }
    fr.el.appendChild(note);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.distance === 'number') { distance = next.distance; if (dRow) dRow.set(Math.max(0, distances.indexOf(distance))); }
      if (typeof next.lens === 'number') { lens = next.lens; if (lRow) lRow.set(lens); }
      if (typeof next.glasses === 'number') { glasses = next.glasses; if (gRow) gRow.set(glasses); if (!tried.includes(glasses)) tried.push(glasses); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [dRow, lRow, gRow]) if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'eye-focus — near and far', spec: { type: 'eye-focus', distanceSlider: true, lensRange: [0, 4, 1] } },
  { title: 'eye-focus — a short-sighted eye and a spectacle lens', spec: { type: 'eye-focus', eye: 2, glassesRange: [-4, 4, 1] } },
  { title: 'eye-focus — a long-sighted eye', spec: { type: 'eye-focus', eye: -2, glasses: 0, static: true } },
];
