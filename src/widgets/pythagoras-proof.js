/**
 * pythagoras-proof — the rearrangement proof of Pythagoras' theorem.
 * Four copies of a right-angled triangle (legs a and b, hypotenuse c) sit in
 * a square frame of side a + b. Arranged one way, they leave a tilted square
 * of area c² uncovered. Slide three of them and the same frame is left with
 * two squares uncovered: a² and b². Same frame, same triangles, so
 * a² + b² = c².
 *
 * {
 *   type: 'pythagoras-proof',
 *   a: 3, b: 4,          // the two legs
 *   t: 0,                // 0 = "c² arrangement" … 1 = "a² + b² arrangement"
 *   slider: true,        // show the slider that slides the triangles
 *   adjust: false,       // true: add sliders for the legs a and b (1 … max)
 *   max: 6,
 *   numbers: true,       // write the areas as numbers too (c² = 25), not just symbols
 *   readouts: true,      // show the areas of the frame, the four triangles and the uncovered part
 * }
 *
 * State: { a, b, t, done, uncovered, c }
 *   t         — progress of the slide, 0–1 (the three triangles move one after another)
 *   done      — true when all three triangles have arrived
 *   uncovered — the area of the frame not covered by triangles (always a² + b²)
 *   c         — the hypotenuse
 *
 * A solution only needs { t: 1 }.
 */
import { frame, sliderRow, readout, hue, s, clamp, tidy, formatNumber, addStyles } from './kit.js';

// figures shrink on phones; keep the big labels readable there (as the shared styles do for small ones)
addStyles('pythagoras-proof', `
  @media (max-width: 520px) {
    .widget-pythagoras-proof .w-canvas .fig-label-lg { font-size: 25px; }
  }
`);

const W = 560;
const H = 390;
const SIDE = 300;                 // the frame, in px
const LEFT = (W - SIDE) / 2;
const TOP = 46;
const BOTTOM = TOP + SIDE;

const smooth = (lo, hi, v) => { const u = clamp((v - lo) / (hi - lo), 0, 1); return u * u * (3 - 2 * u); };

export default function create(spec, env) {
  const interactive = !env.compact;
  const max = spec.max || 6;
  let a = clamp(Number(spec.a) || 3, 0.5, 20);
  let b = clamp(Number(spec.b) || 4, 0.5, 20);
  let t = clamp(Number(spec.t) || 0, 0, 1);
  let readOnly = !!env.readOnly;
  let wasDone = false;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Four right-angled triangles inside a square frame' });
  const { svg } = fr;

  /* ------------------------------------------------------------ drawing */
  const floor = s('rect', { x: LEFT, y: TOP, width: SIDE, height: SIDE, fill: 'var(--surface)' });
  const sqC = s('polygon', { fill: hue('green', 'soft'), stroke: hue('green'), 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-linejoin': 'round' });
  const sqA = s('rect', { fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '6 5' });
  const sqB = s('rect', { fill: hue('violet', 'soft'), stroke: hue('violet'), 'stroke-width': 2, 'stroke-dasharray': '6 5' });
  const tris = [0, 1, 2, 3].map(() => s('polygon', { fill: hue('blue', 'soft'), stroke: hue('blue'), 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  const border = s('rect', { x: LEFT, y: TOP, width: SIDE, height: SIDE, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, rx: 2 });
  const mkText = (cls, color) => s(`text.${cls}`, { 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: color ? `fill:${hue(color, 'text')}` : null });
  const lblC = mkText('fig-label-lg', 'green');
  const lblA = mkText('fig-label-lg', 'orange');
  const lblB = mkText('fig-label-lg', 'violet');
  const lblHyp = mkText('fig-label-lg.fig-math', null);
  const edge = [mkText('fig-label-lg.fig-math', 'violet'), mkText('fig-label-lg.fig-math', 'orange'), mkText('fig-label-lg.fig-math', 'violet'), mkText('fig-label-lg.fig-math', 'orange')];
  const ticks = s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  // moving triangles are drawn last so they pass over the ones that stay put
  svg.append(floor, sqC, sqA, sqB, tris[2], tris[3], tris[1], tris[0], border, ticks, lblC, lblA, lblB, lblHyp, ...edge);

  /* ----------------------------------------------------------- controls */
  const roFrame = readout('frame', { digits: 2 });
  const roTris = readout('4 triangles', { digits: 2 });
  const roFree = readout('uncovered', { digits: 2, color: 'green' });
  if (spec.readouts !== false && interactive) fr.readouts.append(roFrame.el, roTris.el, roFree.el);

  const onLeg = (which) => (v) => {
    if (readOnly) return;
    if (which === 'a') a = v; else b = v;
    render();
    env.onChange(getState());
  };
  const legA = spec.adjust && interactive ? sliderRow({ label: 'Leg $a$', min: 1, max, step: spec.step || 1, value: a, color: 'orange', onInput: onLeg('a') }) : null;
  const legB = spec.adjust && interactive ? sliderRow({ label: 'Leg $b$', min: 1, max, step: spec.step || 1, value: b, color: 'violet', onInput: onLeg('b') }) : null;
  const slide = spec.slider !== false && interactive ? sliderRow({
    label: 'Slide triangles', min: 0, max: 1, step: 0.005, value: t, color: 'blue',
    format: (v) => (v >= 0.995 ? 'done' : v <= 0 ? 'start' : `${Math.min(3, Math.floor(v * 3) + 1)} of 3`),
    onInput: (v) => {
      if (readOnly) return;
      t = clamp(v, 0, 1);
      render();
      env.onChange(getState());
    },
  }) : null;
  if (legA) fr.controls.append(legA.el, legB.el);
  if (slide) fr.controls.appendChild(slide.el);

  /* ------------------------------------------------------------- render */
  function render() {
    const k = SIDE / (a + b);
    const X = (x) => LEFT + x * k;
    const Y = (y) => BOTTOM - y * k;
    const poly = (list) => list.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
    const n = a + b;
    // the three travelling triangles move one after another
    const u1 = clamp(t * 3, 0, 1);
    const u2 = clamp(t * 3 - 1, 0, 1);
    const u3 = clamp(t * 3 - 2, 0, 1);
    const shift = (list, dx, dy) => list.map(([x, y]) => [x + dx, y + dy]);
    tris[0].setAttribute('points', poly(shift([[0, 0], [a, 0], [0, b]], b * u1, a * u1)));
    tris[1].setAttribute('points', poly(shift([[n, 0], [n, a], [a, 0]], -a * u2, 0)));
    tris[2].setAttribute('points', poly([[n, n], [b, n], [n, a]]));
    tris[3].setAttribute('points', poly(shift([[0, n], [0, b], [b, n]], 0, -b * u3)));

    const start = 1 - smooth(0, 0.12, t);
    const end = smooth(0.9, 1, t);
    sqC.setAttribute('points', poly([[a, 0], [n, a], [b, n], [0, b]]));
    sqC.setAttribute('opacity', start);
    sqA.setAttribute('x', X(b)); sqA.setAttribute('y', Y(a)); sqA.setAttribute('width', a * k); sqA.setAttribute('height', a * k);
    sqB.setAttribute('x', X(0)); sqB.setAttribute('y', Y(n)); sqB.setAttribute('width', b * k); sqB.setAttribute('height', b * k);
    sqA.setAttribute('opacity', end);
    sqB.setAttribute('opacity', end);

    const c2 = a * a + b * b;
    const withNumber = spec.numbers !== false;
    const label = (el, x, y, sym, value, room, opacity) => {
      el.setAttribute('x', X(x).toFixed(1));
      el.setAttribute('y', Y(y).toFixed(1));
      el.setAttribute('opacity', opacity);
      el.textContent = withNumber && room >= 96 ? `${sym}² = ${formatNumber(value, 2)}` : `${sym}²`;
      el.style.fontSize = room < 48 ? '13px' : '';
    };
    label(lblC, n / 2, n / 2, 'c', c2, Math.sqrt(c2) * k * 0.7, start);
    label(lblA, b + a / 2, a / 2, 'a', a * a, a * k, end);
    label(lblB, b / 2, a + b / 2, 'b', b * b, b * k, end);

    // hypotenuse of the triangle that never moves
    const hx = X(b + a / 2);
    const hy = Y(a + b / 2);
    const len = Math.hypot(a, b);
    lblHyp.setAttribute('x', (hx + (b / len) * 15).toFixed(1));
    lblHyp.setAttribute('y', (hy - (a / len) * 15).toFixed(1));
    lblHyp.textContent = 'c';

    // side lengths along the top and the right-hand edge, with a tick where they meet
    const place = (el, x, y, str) => { el.setAttribute('x', x.toFixed(1)); el.setAttribute('y', y.toFixed(1)); el.textContent = str; };
    place(edge[0], X(b / 2), TOP - 18, 'b');
    place(edge[1], X(b + a / 2), TOP - 18, 'a');
    place(edge[2], LEFT + SIDE + 20, Y(a + b / 2), 'b');
    place(edge[3], LEFT + SIDE + 20, Y(a / 2), 'a');
    ticks.setAttribute('d', `M${X(b).toFixed(1)} ${TOP - 7}v14 M${LEFT + SIDE - 7} ${Y(a).toFixed(1)}h14`);

    roFrame.set(n * n);
    roTris.set(2 * a * b);
    roFree.set(c2);

    const done = t >= 0.995;
    svg.setAttribute('aria-label', `A square frame with side ${formatNumber(n, 2)} holding four right-angled triangles with legs ${formatNumber(a, 2)} and ${formatNumber(b, 2)}. ` +
      (done ? `The uncovered part is two squares, of area ${formatNumber(a * a, 2)} and ${formatNumber(b * b, 2)}.`
        : t <= 0 ? `The uncovered part is one tilted square of area ${formatNumber(c2, 2)}.`
          : 'The triangles are sliding to new positions.'));
    if (done && !wasDone) env.announce(`Now two squares are uncovered: ${formatNumber(a * a, 2)} plus ${formatNumber(b * b, 2)}, the same total as before, ${formatNumber(c2, 2)}.`);
    wasDone = done;
  }

  function getState() {
    return { a, b, t: tidy(t, 3), done: t >= 0.995, uncovered: tidy(a * a + b * b, 4), c: tidy(Math.hypot(a, b), 4) };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Number.isFinite(next.a) && next.a > 0) { a = next.a; if (legA) legA.set(a); }
      if (Number.isFinite(next.b) && next.b > 0) { b = next.b; if (legB) legB.set(b); }
      if (typeof next.t === 'number') t = clamp(next.t, 0, 1);
      else if (next.done === true) t = 1;
      if (slide) slide.set(t);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [slide, legA, legB]) if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'pythagoras-proof — slide the triangles: c² becomes a² + b²', spec: { type: 'pythagoras-proof', a: 3, b: 4 } },
  { title: 'pythagoras-proof — any right-angled triangle', spec: { type: 'pythagoras-proof', a: 2, b: 5, adjust: true, t: 1 } },
];
