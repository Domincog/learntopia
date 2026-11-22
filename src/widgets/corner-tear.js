/**
 * corner-tear — a triangle whose three corner angles can be "torn off" and
 * brought together. The corners at A and B slide along their sides to C,
 * turning half a turn on the way, and land beside the corner that was
 * already there. Together the three always fill a straight line: 180°.
 * The corners can be dragged, so the learner can test any triangle they like.
 *
 * {
 *   type: 'corner-tear',
 *   points: [[1.6, 1.2], [8.4, 1.2], [4.2, 5.6]],   // A, B, C in a 10 × 7 unit window (same as the default geo window)
 *   drag: true,      // corners can be dragged (false: fixed triangle)
 *   tear: true,      // show the "move corners" slider (false: no slider)
 *   t: 0,            // 0 = corners in place … 1 = all three together at C
 *   readouts: true,  // show the three angles and their sum under the figure
 * }
 *
 * State: { A: { x, y }, B: { x, y }, C: { x, y }, t, joined, angles, sum, largest, smallest, moved }
 *   t        — how far the corners have travelled (0–1)
 *   joined   — true when the three corners sit together at C
 *   angles   — the angles at A, B and C in whole degrees (rounded so that they total exactly 180)
 *   largest / smallest — the biggest and smallest of the three
 *   moved    — true once the learner has dragged a corner
 *
 * A solution only needs the essentials, e.g. { t: 1 } or { A: { x: 1, y: 1.5 }, B: { x: 9, y: 1.5 }, C: { x: 5, y: 3.4 } }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, tidy } from './kit.js';
import { angleDeg } from '../core/geom.js';

const W = 560;
const H = 380;
const K = 50;               // pixels per unit
const UX = 10;              // window size in units
const UY = 7;
const OX = (W - K * UX) / 2;
const OY = (H - K * UY) / 2;
const R = 40;               // radius of a corner piece (px)
const MIN_ANGLE = 22;       // sharper corners than this are not allowed (keeps labels readable)
const MARGIN = 0.9;         // corners stay this far inside the window (units)
const COLORS = ['orange', 'green', 'violet'];
const NAMES = ['A', 'B', 'C'];
const DEFAULT = [[1.6, 1.2], [8.4, 1.2], [4.2, 5.6]];

const sx = (v) => OX + v * K;
const sy = (v) => OY + (UY - v) * K;
const ux = (px) => (px - OX) / K;
const uy = (py) => UY - (py - OY) / K;
const f = (v) => v.toFixed(1);
const unit = (dx, dy) => { const len = Math.hypot(dx, dy) || 1; return { x: dx / len, y: dy / len }; };
const turn = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });

/** SVG path of the circular sector at `p` between unit directions d1 and d2 (the smaller angle). */
function sector(p, d1, d2, radius) {
  const cross = d1.x * d2.y - d1.y * d2.x;
  return `M${f(p.x)} ${f(p.y)} L${f(p.x + d1.x * radius)} ${f(p.y + d1.y * radius)} ` +
    `A${radius} ${radius} 0 0 ${cross > 0 ? 1 : 0} ${f(p.x + d2.x * radius)} ${f(p.y + d2.y * radius)} Z`;
}

const exact = (P) => [angleDeg(P[1], P[0], P[2]), angleDeg(P[0], P[1], P[2]), angleDeg(P[0], P[2], P[1])];
const valid = (P) => exact(P).every((a) => a >= MIN_ANGLE);

/** Whole-degree angles that total exactly 180 (the third takes up the rounding slack). */
function wholeAngles(P) {
  const [a, b] = exact(P);
  const ra = Math.round(a);
  const rb = Math.round(b);
  return [ra, rb, 180 - ra - rb];
}

export default function create(spec, env) {
  const canDrag = spec.drag !== false && !env.compact;
  const canTear = spec.tear !== false && !env.compact;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A triangle with its three corner angles marked' });
  const { svg } = fr;
  let readOnly = !!env.readOnly;
  let moved = false;
  let wasJoined = false;

  const start = Array.isArray(spec.points) && spec.points.length === 3 ? spec.points : DEFAULT;
  let P = start.map((p) => (Array.isArray(p) ? { x: Number(p[0]), y: Number(p[1]) } : { x: Number(p.x), y: Number(p.y) }));
  if (!valid(P)) P = DEFAULT.map(([x, y]) => ({ x, y }));
  let t = clamp(Number(spec.t) || 0, 0, 1);

  /* ------------------------------------------------------------ drawing */
  const tri = s('polygon', { fill: hue('blue', 'soft'), 'fill-opacity': 0.8, stroke: hue('blue'), 'stroke-width': 3, 'stroke-linejoin': 'round' });
  const holes = [0, 1].map((i) => s('path', { fill: 'var(--surface)', stroke: hue(COLORS[i]), 'stroke-width': 2, 'stroke-dasharray': '4 5', 'stroke-linejoin': 'round' }));
  const line = s('line', { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '8 7', 'stroke-linecap': 'round' });
  const lineLabel = s('text.fig-label-sm', { 'text-anchor': 'start' }, 'straight line');
  const wedges = COLORS.map((c) => s('path', { fill: hue(c, 'soft'), stroke: hue(c), 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  const labels = COLORS.map((c) => s('text.fig-label', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: `fill:${hue(c, 'text')}` }));
  const names = NAMES.map((n) => s('text.fig-label.fig-math', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, n));
  svg.append(tri, ...holes, line, lineLabel, wedges[2], wedges[0], wedges[1], ...labels, ...names);

  const handles = canDrag ? NAMES.map((name, i) => {
    const hd = handle(svg, {
      color: COLORS[i],
      r: 11,
      label: `Corner ${name}`,
      keyStep: K * 0.2,
      onMove: (hx, hy) => {
        if (readOnly) return;
        const want = { x: tidy(clamp(ux(hx), MARGIN, UX - MARGIN), 2), y: tidy(clamp(uy(hy), MARGIN, UY - MARGIN), 2) };
        // if the full move would squash the triangle, try sliding along one axis instead
        const tries = [want, { x: want.x, y: P[i].y }, { x: P[i].x, y: want.y }];
        for (const next of tries) {
          if (next.x === P[i].x && next.y === P[i].y) continue;
          const trial = P.slice();
          trial[i] = next;
          if (!valid(trial)) continue;
          P = trial;
          moved = true;
          render();
          env.onChange(getState());
          return;
        }
        render(); // snap the handle back to where the corner really is
      },
    });
    svg.appendChild(hd.el);
    return hd;
  }) : [];

  /* ----------------------------------------------------------- controls */
  const roAngles = NAMES.map((n, i) => readout(n, { digits: 0, unit: '°', color: COLORS[i] }));
  const roSum = readout('sum', { digits: 0, unit: '°' });
  if (spec.readouts !== false && !env.compact) fr.readouts.append(...roAngles.map((ro) => ro.el), roSum.el);

  const slider = canTear ? sliderRow({
    label: 'Move corners', min: 0, max: 1, step: 0.01, value: t, color: 'orange',
    format: (v) => (v >= 0.995 ? 'joined' : `${Math.round(v * 100)}%`),
    onInput: (v) => {
      if (readOnly) return;
      t = clamp(v, 0, 1);
      render();
      env.onChange(getState());
    },
  }) : null;
  if (slider) fr.controls.appendChild(slider.el);

  /* ------------------------------------------------------------- render */
  function render() {
    const px = P.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
    const [A, B, C] = px;
    const angles = wholeAngles(P);
    tri.setAttribute('points', px.map((p) => `${f(p.x)},${f(p.y)}`).join(' '));

    const home = [
      [unit(B.x - A.x, B.y - A.y), unit(C.x - A.x, C.y - A.y)],
      [unit(A.x - B.x, A.y - B.y), unit(C.x - B.x, C.y - B.y)],
      [unit(A.x - C.x, A.y - C.y), unit(B.x - C.x, B.y - C.y)],
    ];
    for (let i = 0; i < 3; i++) {
      let [d1, d2] = home[i];
      let apex = px[i];
      if (i < 2) {
        // slide along the side towards C while turning half a turn (away from the inside of the triangle)
        const dir = d1.x * d2.y - d1.y * d2.x > 0 ? 1 : -1;
        d1 = turn(d1, dir * Math.PI * t);
        d2 = turn(d2, dir * Math.PI * t);
        apex = { x: px[i].x + (C.x - px[i].x) * t, y: px[i].y + (C.y - px[i].y) * t };
        holes[i].setAttribute('d', sector(px[i], home[i][0], home[i][1], R));
        holes[i].setAttribute('opacity', clamp(t * 12, 0, 1));
      }
      wedges[i].setAttribute('d', sector(apex, d1, d2, R));
      const mid = unit(d1.x + d2.x, d1.y + d2.y);
      const off = R + (angles[i] < 40 ? 27 : 19);
      labels[i].setAttribute('x', f(apex.x + mid.x * off));
      labels[i].setAttribute('y', f(apex.y + mid.y * off));
      labels[i].textContent = `${angles[i]}°`;
    }

    // the straight line the corners end up on: through C, parallel to AB
    let u = unit(B.x - A.x, B.y - A.y);
    if (u.x < 0) u = { x: -u.x, y: -u.y };
    const reach = 150;
    line.setAttribute('x1', f(C.x - u.x * reach)); line.setAttribute('y1', f(C.y - u.y * reach));
    line.setAttribute('x2', f(C.x + u.x * reach)); line.setAttribute('y2', f(C.y + u.y * reach));
    line.setAttribute('opacity', clamp(t * 1.4, 0, 1));
    const cen = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    let n = { x: -u.y, y: u.x };
    if ((cen.x - C.x) * n.x + (cen.y - C.y) * n.y > 0) n = { x: -n.x, y: -n.y }; // point away from the triangle
    const lx = C.x + u.x * (R + 14) + n.x * 12;
    const ly = C.y + u.y * (R + 14) + n.y * 12;
    lineLabel.setAttribute('x', f(lx)); lineLabel.setAttribute('y', f(ly));
    lineLabel.setAttribute('transform', `rotate(${f((Math.atan2(u.y, u.x) * 180) / Math.PI)} ${f(lx)} ${f(ly)})`);
    lineLabel.setAttribute('opacity', clamp((t - 0.8) * 5, 0, 1));

    for (let i = 0; i < 3; i++) {
      const out = unit(px[i].x - cen.x, px[i].y - cen.y);
      const gap = canDrag ? 28 : 18;
      names[i].setAttribute('x', f(clamp(px[i].x + out.x * gap, 12, W - 12)));
      names[i].setAttribute('y', f(clamp(px[i].y + out.y * gap, 14, H - 12)));
      if (handles[i]) { handles[i].set(px[i].x, px[i].y); handles[i].setLabel(`angle ${angles[i]} degrees`); }
      roAngles[i].set(angles[i]);
    }
    roSum.set(180);

    const joined = t >= 0.995;
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Triangle ABC with angles ${angles[0]}°, ${angles[1]}° and ${angles[2]}°, which total 180°.` +
      (joined ? ' The three corners sit together at C and form a straight line.' : t > 0 ? ' The corners at A and B are on their way to C.' : ''));
    if (joined && !wasJoined) env.announce('The three corners fit together along a straight line: 180 degrees.');
    wasJoined = joined;
  }

  function getState() {
    const angles = wholeAngles(P);
    return {
      A: { ...P[0] }, B: { ...P[1] }, C: { ...P[2] },
      t: tidy(t, 3),
      joined: t >= 0.995,
      angles,
      sum: 180,
      largest: Math.max(...angles),
      smallest: Math.min(...angles),
      moved,
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      const trial = P.slice();
      NAMES.forEach((name, i) => {
        const p = next[name];
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) trial[i] = { x: p.x, y: p.y };
      });
      if (valid(trial)) P = trial;
      if (typeof next.t === 'number') t = clamp(next.t, 0, 1);
      else if (next.joined === true) t = 1;
      if (typeof next.moved === 'boolean') moved = next.moved;
      if (slider) slider.set(t);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      handles.forEach((hd) => hd.setEnabled(!readOnly));
      if (slider) slider.setDisabled(readOnly);
    },
    destroy() { handles.forEach((hd) => hd.destroy()); },
  };
}

export const examples = [
  { title: 'corner-tear — drag the corners, then bring them together', spec: { type: 'corner-tear' } },
  { title: 'corner-tear — corners joined on a fixed triangle', spec: { type: 'corner-tear', points: [[2, 1.2], [8.6, 1.2], [6.2, 5.4]], drag: false, tear: false, t: 1 } },
];
