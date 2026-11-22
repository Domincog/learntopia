/**
 * curve-zoom — a microscope for curves. A slider magnifies the view around one
 * point of a curve; the axes show the real coordinates of the shrinking
 * window. Zoom in far enough on a smooth curve and it becomes
 * indistinguishable from a straight line: its tangent.
 *
 * {
 *   type: 'curve-zoom',
 *   fn: 'x^2',                  // the curve, an expression in x
 *   at: 1,                      // x-coordinate of the point to zoom in on
 *   x: [-3.5, 5.5],             // the window at ×1, left to right (put the point near its centre)
 *   y: [-3.4, 5.4],             // optional. By default the height is chosen so that the grid squares
 *                               //   really are square, with the point half-way up
 *   height: 520,                // height of the drawing (the width is always 560)
 *   levels: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],   // magnifications on the slider
 *   zoom: 1,                    // starting magnification (one of the levels)
 *   tangent: false,             // also draw the tangent line at the point (dashed)
 *   static: false,              // true: picture only, no slider
 * }
 *
 * The grid always uses the same step on both axes, so "squares up per square
 * across" is the true slope at every magnification.
 *
 * State: { zoom, bend }
 *   zoom — the current magnification
 *   bend — how far the curve strays from its tangent inside the window, as a
 *          fraction of the window's height (0 means perfectly straight)
 */
import { frame, plane, drawAxes, sliderRow, readout, fnPath, clipTo, niceStep, hue, s, clamp, tidy, formatNumber } from './kit.js';
import { compile } from '../core/mathexpr.js';

const W = 560;
const PAD = { l: 58, r: 18, t: 16, b: 34 };

export default function create(spec, env) {
  const H = spec.height || 520;
  const f = compile(spec.fn || 'x^2', { vars: ['x'] });
  const fy = (x) => { try { return f({ x }); } catch { return NaN; } };
  const at = spec.at != null ? spec.at : 1;
  const py = fy(at);
  const [x0, x1] = spec.x || [at - 4.5, at + 4.5];
  const half = ((x1 - x0) / 2) * ((H - PAD.t - PAD.b) / (W - PAD.l - PAD.r));   // square units on screen
  const [y0, y1] = spec.y || [py - half, py + half];
  const levels = (spec.levels || [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]).slice().sort((a, b) => a - b);
  const isStatic = !!spec.static || !!env.compact;
  const eps = (x1 - x0) * 1e-7;
  const slope = (fy(at + eps) - fy(at - eps)) / (2 * eps);
  let readOnly = !!env.readOnly;

  const nearest = (z) => levels.reduce((best, v, i) => (Math.abs(Math.log(v / z)) < Math.abs(Math.log(levels[best] / z)) ? i : best), 0);
  let level = nearest(spec.zoom || levels[0]);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A curve under a microscope' });
  const { svg } = fr;
  const scene = s('g');
  svg.appendChild(scene);

  const roZoom = readout('magnification', { digits: 0 });
  const roWidth = readout('window width', { digits: 6 });
  if (!env.compact) {
    if (isStatic) fr.readouts.appendChild(roZoom.el);   // otherwise the slider already shows it
    fr.readouts.appendChild(roWidth.el);
  }

  const win = () => {
    const k = levels[level];
    return { k, xa: at - (at - x0) / k, xb: at + (x1 - at) / k, ya: py - (py - y0) / k, yb: py + (y1 - py) / k };
  };
  const bend = () => {
    const { xa, xb, ya, yb } = win();
    const stray = Math.max(Math.abs(fy(xa) - (py + slope * (xa - at))), Math.abs(fy(xb) - (py + slope * (xb - at))));
    return tidy(clamp(stray / (yb - ya), 0, 99), 4);
  };

  function render() {
    const { k, xa, xb, ya, yb } = win();
    while (scene.firstChild) scene.removeChild(scene.firstChild);
    const old = svg.querySelector('defs');
    if (old) old.remove();
    const pl = plane({ x: [xa, xb], y: [ya, yb], width: W, height: H, pad: PAD });
    const step = niceStep(xb - xa, 5);
    scene.appendChild(drawAxes(pl, { xStep: step, yStep: step }));
    const g = s('g', { 'clip-path': clipTo(svg, pl) });
    if (spec.tangent) {
      g.appendChild(s('line', {
        x1: pl.sx(xa), y1: pl.sy(py + slope * (xa - at)), x2: pl.sx(xb), y2: pl.sy(py + slope * (xb - at)),
        stroke: hue('orange'), 'stroke-width': 3, 'stroke-dasharray': '8 7', 'stroke-linecap': 'round',
      }));
    }
    g.appendChild(s('path', { d: fnPath(fy, pl), fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    scene.appendChild(g);
    scene.appendChild(s('circle', { cx: pl.sx(at), cy: pl.sy(py), r: 7, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
    roZoom.set(`×${formatNumber(k, 0)}`);
    roWidth.set(tidy(xb - xa, 8));
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Magnified ${formatNumber(k, 0)} times around the point (${formatNumber(at, 3)}, ${formatNumber(py, 3)}). `
      + `The window is ${formatNumber(xb - xa, 6)} wide. ${bend() < 0.01 ? 'The curve looks like a straight line.' : 'The curve is visibly bent.'}`);
  }

  const getState = () => ({ zoom: levels[level], bend: bend() });

  let slider = null;
  if (!isStatic) {
    slider = sliderRow({
      label: 'zoom', min: 0, max: levels.length - 1, step: 1, value: level, color: 'orange',
      format: (v) => `×${formatNumber(levels[v], 0)}`,
      onInput: (v) => {
        if (readOnly) return;
        level = clamp(Math.round(v), 0, levels.length - 1);
        render();
        env.onChange(getState());
      },
    });
    if (readOnly) slider.setDisabled(true);
    fr.controls.appendChild(slider.el);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || typeof next.zoom !== 'number') return;
      level = nearest(next.zoom);
      if (slider) slider.set(level);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'curve-zoom — zoom in until the curve looks straight', spec: { type: 'curve-zoom', fn: 'x^2', at: 1, x: [-3.5, 5.5] } },
  { title: 'curve-zoom — with the tangent line', spec: { type: 'curve-zoom', fn: 'sin(x)', at: 1, x: [-3.5, 5.5], zoom: 10, tangent: true } },
];
