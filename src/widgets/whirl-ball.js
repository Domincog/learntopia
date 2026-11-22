/**
 * whirl-ball — a puck on a string, whirled round a peg on smooth ice and seen
 * from above. Arrows show its velocity (along the circle) and the pull of the
 * string (towards the centre). Cut the string and the puck leaves along the
 * tangent, in a straight line at steady speed: with no force, no more turning.
 *
 * The pull needed is m·v²/r, so the speed and radius sliders let a learner
 * find by experiment that doubling the speed takes four times the force and
 * doubling the radius takes half.
 *
 * {
 *   type: 'whirl-ball',
 *   body: 'ball',                 // 'ball': a puck on a string · 'car': a car on a circular road (no string; the force is friction)
 *   speed: 2, radius: 1, mass: 1, // m/s, m, kg
 *   speedRange: [1, 6, 1],        // optional sliders: [min, max, step]
 *   radiusRange: [0.5, 2, 0.5],
 *   massRange: [1, 4, 1],
 *   dir: 1,                       // 1: anticlockwise · -1: clockwise
 *   angle: 35,                    // where the puck is drawn when nothing moves (degrees, anticlockwise from "east")
 *   arrows: true,                 // true | false | 'force' | 'velocity'
 *   cut: true,                    // show the button that cuts the string (for a car: an ice patch that removes the friction)
 *   readouts: ['force'],          // any of 'force', 'accel', 'period'
 *   paths: false,                 // static only: draw three candidate paths A, B, C for "what happens when the string is cut?"
 *   timeScale: 1,                 // the animation shows this many seconds of motion per second (use > 1 for big, slow circles)
 *   static: false,                // true: a picture without controls or motion…
 *   show: 'spin',                 // …of the puck on its string ('spin') or after the string was cut at `angle` ('cut')
 * }
 *
 * State: { speed, radius, mass, accel, force, period, cut, cuts, cutAngles }
 *   accel     — acceleration towards the centre, v²/r (m/s²)
 *   force     — pull towards the centre, m·v²/r (N)
 *   period    — time for one lap, 2πr/v (s)
 *   cut       — the string is cut at the moment
 *   cuts      — how many times the learner has cut it
 *   cutAngles — where the puck was each time (degrees, 0–359)
 * The facts always describe the current settings; they do not wait for the animation.
 *
 * setState({ speed, radius, mass, cuts, cut }) sets the sliders; with cut: true it shows the puck after a cut.
 * Motion is exact: on the string the angle grows steadily at v/r; after a cut
 * the puck moves along the tangent at the same speed v.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 340;
const CX = 280;
const CY = 170;
const RPX = 126;        // radius on screen of the largest circle
const D2R = Math.PI / 180;

addStyles('whirl-ball', `
  .widget-whirl-ball .wb-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-whirl-ball .wb-letter { font-family: var(--font-body); font-weight: 800; font-size: 18px; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 5px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-whirl-ball .wb-tag { font-size: 17px; } .widget-whirl-ball .wb-letter { font-size: 22px; } }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const body = spec.body === 'car' ? 'car' : 'ball';
  const dir = spec.dir === -1 ? -1 : 1;
  const ranges = {
    speed: !isStatic && Array.isArray(spec.speedRange) ? spec.speedRange : null,
    radius: !isStatic && Array.isArray(spec.radiusRange) ? spec.radiusRange : null,
    mass: !isStatic && Array.isArray(spec.massRange) ? spec.massRange : null,
  };
  const showForce = spec.arrows !== false && spec.arrows !== 'velocity';
  const showVel = spec.arrows !== false && spec.arrows !== 'force';
  const canCut = spec.cut !== false && !isStatic;
  const restAngle = spec.angle != null ? spec.angle : 35;
  const forceName = body === 'car' ? 'friction' : 'pull of the string';
  const timeScale = spec.timeScale || 1;

  let speed = spec.speed != null ? spec.speed : 2;
  let radius = spec.radius != null ? spec.radius : 1;
  let mass = spec.mass != null ? spec.mass : 1;
  let theta = restAngle * D2R;          // where the puck is on the circle
  let cut = isStatic && spec.show === 'cut';
  let cutTheta = theta;                 // where it was when the string was cut
  let flown = cut ? 2.2 : 0;            // metres travelled since the cut
  let cuts = 0;
  let cutAngles = [];
  let readOnly = !!env.readOnly;

  const maxOf = (key, value) => (ranges[key] ? ranges[key][1] : value);
  const minOf = (key, value) => (ranges[key] ? ranges[key][0] : value);
  const rMax = maxOf('radius', radius);
  const k = (spec.paths ? RPX - 26 : RPX) / rMax;       // px per metre (a little smaller when candidate paths need room round the circle)
  const anyRange = ranges.speed || ranges.radius || ranges.mass;
  const fMax = (maxOf('mass', mass) * maxOf('speed', speed) ** 2) / minOf('radius', radius);
  const vMax = maxOf('speed', speed);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A puck on a string, seen from above' });
  const { svg } = fr;

  /* ------------------------------------------------------------- drawing */
  const ring = s('circle', { cx: CX, cy: CY, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '5 6' });
  const road = s('circle', { cx: CX, cy: CY, fill: 'none', stroke: 'var(--sunken)', 'stroke-width': 30 });
  const roadEdgeIn = s('circle', { cx: CX, cy: CY, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 });
  const roadEdgeOut = s('circle', { cx: CX, cy: CY, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 });
  if (body === 'car') svg.append(road, roadEdgeIn, roadEdgeOut);
  svg.appendChild(ring);
  const gPaths = s('g');
  const gTrail = s('g');
  const string = s('line', { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  const peg = s('circle', { cx: CX, cy: CY, r: 6, fill: 'var(--ink)' });
  const sense = s('path', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  const senseHead = s('path', { fill: 'var(--ink-3)', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
  const gArrows = s('g');
  const puck = body === 'car'
    ? s('g', s('rect', { x: -15, y: -9, width: 30, height: 18, rx: 5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('rect', { x: 2, y: -6, width: 7, height: 12, rx: 2, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.5 }))
    : s('g', s('circle', { r: 11, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  svg.append(gPaths, gTrail, string, sense, senseHead);
  if (body !== 'car') svg.appendChild(peg);
  svg.append(gArrows, puck);

  /** Screen position for a point `r` metres from the peg at angle `a`. */
  const at = (a, r = radius) => ({ x: CX + r * k * Math.cos(a), y: CY - r * k * Math.sin(a) });
  /** Unit tangent on screen for motion at angle `a`. */
  const tangent = (a) => ({ x: -Math.sin(a) * dir, y: -Math.cos(a) * dir });

  function arrow(group, x0, y0, ux, uy, len, color, label, side = 1) {
    const x1 = x0 + ux * len;
    const y1 = y0 + uy * len;
    const head = Math.min(11, Math.max(6, len * 0.45));
    const bx = x1 - ux * head;
    const by = y1 - uy * head;
    group.appendChild(s('line', { x1: x0, y1: y0, x2: bx, y2: by, stroke: hue(color), 'stroke-width': 5, 'stroke-linecap': 'round' }));
    group.appendChild(s('path', { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${(bx - uy * head * 0.62).toFixed(1)} ${(by + ux * head * 0.62).toFixed(1)}L${(bx + uy * head * 0.62).toFixed(1)} ${(by - ux * head * 0.62).toFixed(1)}Z`, fill: hue(color), stroke: hue(color), 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    if (label) {
      const lx = clamp(x1 + ux * 12 - uy * 10 * side, 44, W - 44);
      const ly = clamp(y1 + uy * 12 + ux * 10 * side + 4, 16, H - 8);
      group.appendChild(s('text.wb-tag', { x: lx, y: ly, 'text-anchor': 'middle', style: `fill:${hue(color, 'text')}` }, label));
    }
  }

  /* ------------------------------------------------------------ controls */
  const facts = () => {
    const accel = (speed * speed) / radius;
    return { accel, force: mass * accel, period: (2 * Math.PI * radius) / speed };
  };
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  const ro = {};
  let cutBtn = null;
  const wanted = Array.isArray(spec.readouts) ? spec.readouts : ['force'];

  function retie() {
    // without animation the puck would be cut loose at the same spot every time: move it on a little
    if (cut && reducedMotion()) theta = cutTheta + dir * 140 * D2R;
    cut = false;
    flown = 0;
    note.textContent = '';
  }
  function changed() {
    retie();
    render();
    if (!reducedMotion()) anim.start();
    env.onChange(getState());
  }
  if (!isStatic) {
    if (wanted.includes('force')) { ro.force = readout(body === 'car' ? 'friction needed' : 'pull of the string', { color: 'red' }); fr.readouts.appendChild(ro.force.el); }
    if (wanted.includes('accel')) { ro.accel = readout('acceleration', {}); fr.readouts.appendChild(ro.accel.el); }
    if (wanted.includes('period')) { ro.period = readout('one lap', {}); fr.readouts.appendChild(ro.period.el); }
    const add = (key, label, unit, color, set) => {
      if (!ranges[key]) return;
      const [lo, hi, st] = ranges[key];
      sliders[key] = sliderRow({ label, min: lo, max: hi, step: st || 1, value: clamp(set(), lo, hi), color, unit, onInput: (v) => { if (readOnly) return; set(v); play('tap'); changed(); } });
      fr.controls.appendChild(sliders[key].el);
    };
    add('speed', 'speed', 'm/s', 'blue', (v) => (v == null ? speed : (speed = v)));
    add('radius', 'radius', 'm', 'violet', (v) => (v == null ? radius : (radius = v)));
    add('mass', 'mass', 'kg', 'orange', (v) => (v == null ? mass : (mass = v)));
    if (canCut) {
      cutBtn = button(body === 'car' ? 'Hit an ice patch' : 'Cut the string', () => {
        if (readOnly) return;
        if (cut) { retie(); play('tap'); render(); if (!reducedMotion()) anim.start(); env.onChange(getState()); return; }
        doCut(true);
      }, { variant: 'primary' });
      fr.buttons.appendChild(cutBtn);
    }
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  /** Metres along the tangent until the puck is `margin` px outside the picture (negative: still that far inside). */
  const flightEnd = (margin = 20) => {
    const p = at(cutTheta);
    const u = tangent(cutTheta);
    let d = 0;
    while (d < 20 * rMax) {
      const x = p.x + u.x * d * k;
      const y = p.y + u.y * d * k;
      if (x < -margin || x > W + margin || y < -margin || y > H + margin) break;
      d += 0.02 * rMax;
    }
    return d;
  };
  /** Where the puck is drawn after a cut when nothing is animated: well on its way, but still in the picture. */
  const parked = () => Math.min(flightEnd(-78), 2.2 * rMax);
  let endAt = 0;
  const anim = loop((frameDt) => {
    const dt = frameDt * timeScale;
    if (cut) {
      flown = Math.min(endAt, flown + speed * dt);
      if (flown >= endAt) anim.stop();
    } else {
      theta += dir * (speed / radius) * dt;
    }
    render();
  });

  function describe() {
    return body === 'car'
      ? 'No friction, no turning: the car goes straight on, along the tangent.'
      : 'No pull, no turning: the puck goes straight on, along the tangent, at the same speed.';
  }

  function doCut(notify) {
    cut = true;
    cutTheta = theta;
    flown = 0;
    endAt = flightEnd();
    if (notify) {
      cuts++;
      const deg = ((Math.round(cutTheta / D2R) % 360) + 360) % 360;
      cutAngles.push(deg);
      play('pop');
    }
    if (reducedMotion() || isStatic) { flown = parked(); anim.stop(); } else anim.start();
    note.textContent = describe();
    render();
    if (notify) { env.announce(note.textContent); env.onChange(getState()); }
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const f = facts();
    const rpx = radius * k;
    ring.setAttribute('r', rpx);
    if (body === 'car') { road.setAttribute('r', rpx); roadEdgeIn.setAttribute('r', Math.max(2, rpx - 15)); roadEdgeOut.setAttribute('r', rpx + 15); ring.setAttribute('visibility', 'hidden'); }
    clear(gArrows); clear(gTrail); clear(gPaths);

    const a = cut ? cutTheta : theta;
    const onCircle = at(a);
    const u = tangent(a);
    const pos = cut ? { x: onCircle.x + u.x * flown * k, y: onCircle.y + u.y * flown * k } : onCircle;
    const heading = Math.atan2(u.y, u.x) / D2R;
    puck.setAttribute('transform', `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})${body === 'car' ? ` rotate(${heading.toFixed(1)})` : ''}`);

    // string, or what is left of it
    if (body === 'car') string.setAttribute('visibility', 'hidden');
    else if (cut) {
      const stub = at(cutTheta, radius * 0.45);
      string.setAttribute('x1', CX); string.setAttribute('y1', CY); string.setAttribute('x2', stub.x); string.setAttribute('y2', stub.y);
      string.setAttribute('stroke-dasharray', '2 6');
    } else {
      string.setAttribute('x1', CX); string.setAttribute('y1', CY); string.setAttribute('x2', onCircle.x); string.setAttribute('y2', onCircle.y);
      string.removeAttribute('stroke-dasharray');
    }

    // a short arc ahead of the puck shows which way it is going round
    const showSense = !cut && (isStatic || reducedMotion()) && !spec.paths && !showVel;
    sense.setAttribute('visibility', showSense ? 'visible' : 'hidden');
    senseHead.setAttribute('visibility', showSense ? 'visible' : 'hidden');
    if (showSense) {
      const rr = radius + 26 / k;
      const a0 = a + dir * 20 * D2R;
      const a1 = a + dir * 58 * D2R;
      const p0 = at(a0, rr);
      const p1 = at(a1, rr);
      sense.setAttribute('d', `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A${(rr * k).toFixed(1)} ${(rr * k).toFixed(1)} 0 0 ${dir > 0 ? 0 : 1} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`);
      const t = tangent(a1);
      senseHead.setAttribute('d', `M${(p1.x + t.x * 9).toFixed(1)} ${(p1.y + t.y * 9).toFixed(1)}L${(p1.x - t.y * 6).toFixed(1)} ${(p1.y + t.x * 6).toFixed(1)}L${(p1.x + t.y * 6).toFixed(1)} ${(p1.y - t.x * 6).toFixed(1)}Z`);
    }

    if (cut) {
      // the straight path so far, with images at equal time steps
      gTrail.appendChild(s('line', { x1: onCircle.x, y1: onCircle.y, x2: pos.x, y2: pos.y, stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' }));
      const stepM = Math.max(0.3 * rMax, speed * 0.25);
      for (let d = stepM; d < flown - 0.05 * rMax; d += stepM) {
        gTrail.appendChild(s('circle', { cx: onCircle.x + u.x * d * k, cy: onCircle.y + u.y * d * k, r: 7, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2 }));
      }
      gTrail.appendChild(s('circle', { cx: onCircle.x, cy: onCircle.y, r: 4, fill: 'var(--ink)' }));
    }

    if (spec.paths && isStatic) {
      const p = at(a);
      const out = { x: Math.cos(a), y: -Math.sin(a) };
      const dash = { fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2.5, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' };
      const tip = (x, y, ux, uy) => s('path', { d: `M${(x + ux * 10).toFixed(1)} ${(y + uy * 10).toFixed(1)}L${(x - uy * 6).toFixed(1)} ${(y + ux * 6).toFixed(1)}L${(x + uy * 6).toFixed(1)} ${(y - ux * 6).toFixed(1)}Z`, fill: 'var(--ink-2)' });
      // A: straight out along the string
      const ax = p.x + out.x * 46;
      const ay = p.y + out.y * 46;
      gPaths.append(s('line', { ...dash, x1: p.x + out.x * 16, y1: p.y + out.y * 16, x2: ax, y2: ay }), tip(ax, ay, out.x, out.y));
      gPaths.appendChild(s('text.wb-letter', { x: ax + out.x * 4 + u.x * -18, y: ay + out.y * 4 + 6, 'text-anchor': 'middle' }, 'A'));
      // B: along the tangent
      const bx = p.x + u.x * 150;
      const by = p.y + u.y * 150;
      gPaths.append(s('line', { ...dash, x1: p.x + u.x * 16, y1: p.y + u.y * 16, x2: bx, y2: by }), tip(bx, by, u.x, u.y));
      gPaths.appendChild(s('text.wb-letter', { x: bx + u.x * 24, y: by + u.y * 24 + 6, 'text-anchor': 'middle' }, 'B'));
      // C: still curving, drifting outwards
      let d = '';
      let last = null;
      let prev = null;
      for (let i = 0; i <= 40; i++) {
        const phi = (i / 40) * 105 * D2R;
        const q = at(a + dir * phi, radius * (1 + 0.42 * (phi / (105 * D2R)) ** 1.4));
        if (i >= 5) d += `${d ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        prev = last; last = q;
      }
      const len = Math.hypot(last.x - prev.x, last.y - prev.y) || 1;
      const cu = { x: (last.x - prev.x) / len, y: (last.y - prev.y) / len };
      gPaths.append(s('path', { ...dash, d }), tip(last.x, last.y, cu.x, cu.y));
      gPaths.appendChild(s('text.wb-letter', { x: last.x + cu.x * 24, y: last.y + cu.y * 24 + 6, 'text-anchor': 'middle' }, 'C'));
    }

    if (!spec.paths) {
      if (showVel) arrow(gArrows, pos.x + u.x * 14, pos.y + u.y * 14, u.x, u.y, 26 + 62 * (speed / vMax), 'blue', 'velocity', dir);
      if (showForce && !cut) {
        const inward = { x: (CX - onCircle.x) / rpx, y: (CY - onCircle.y) / rpx };
        const len = anyRange ? Math.max(12, (f.force / fMax) * RPX * 0.92) : rpx * 0.5;
        arrow(gArrows, onCircle.x + inward.x * 14, onCircle.y + inward.y * 14, inward.x, inward.y, len, 'red', len > 30 ? (body === 'car' ? 'friction' : 'force') : '', -dir);
      }
    }

    if (ro.force) ro.force.set(cut ? '0 N' : `${formatNumber(f.force, 1)} N`);
    if (ro.accel) ro.accel.set(cut ? '0 m/s²' : `${formatNumber(f.accel, 1)} m/s²`);
    if (ro.period) ro.period.set(`${formatNumber(f.period, 2)} s`);
    if (cutBtn) { cutBtn.lastChild.textContent = cut ? (body === 'car' ? 'Back on the road' : 'Tie it back on') : (body === 'car' ? 'Hit an ice patch' : 'Cut the string'); cutBtn.disabled = readOnly; }
    if (!isStatic) {
      svg.setAttribute('aria-label', `${spec.alt || 'A puck on a string, seen from above'}. Speed ${formatNumber(speed, 1)} metres per second, radius ${formatNumber(radius, 2)} metres, mass ${formatNumber(mass, 1)} kilograms. ${cut ? describe() : `The ${forceName} is ${formatNumber(f.force, 1)} newtons, towards the centre.`}`);
    }
  }

  function getState() {
    const f = facts();
    return {
      speed, radius, mass,
      accel: tidy(f.accel, 4),
      force: tidy(f.force, 4),
      period: tidy(f.period, 4),
      cut, cuts,
      cutAngles: cutAngles.slice(),
    };
  }

  if (cut) { cutTheta = theta; endAt = flightEnd(); flown = parked(); }
  render();
  if (!isStatic && !reducedMotion()) anim.start();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      const put = (key, value, set) => {
        if (typeof value !== 'number') return;
        const v = ranges[key] ? clamp(value, ranges[key][0], ranges[key][1]) : value;
        set(v);
        if (sliders[key]) sliders[key].set(v);
      };
      put('speed', next.speed, (v) => { speed = v; });
      put('radius', next.radius, (v) => { radius = v; });
      put('mass', next.mass, (v) => { mass = v; });
      if (typeof next.cuts === 'number') {
        cuts = Math.max(0, Math.round(next.cuts));
        cutAngles = Array.isArray(next.cutAngles) ? next.cutAngles.slice(0, cuts) : Array.from({ length: cuts }, (_, i) => (restAngle + i * 140) % 360);
      }
      retie();
      if (next.cut || (next.cut == null && cuts > 0)) {
        theta = (cutAngles.length ? cutAngles[cutAngles.length - 1] : restAngle) * D2R;
        cut = true; cutTheta = theta; endAt = flightEnd(); flown = parked();
        anim.stop();
        note.textContent = describe();
      }
      render();
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'whirl-ball — speed, radius and the pull of the string', spec: { type: 'whirl-ball', speed: 2, radius: 1, mass: 2, speedRange: [1, 6, 1], radiusRange: [0.5, 2, 0.5], readouts: ['force', 'period'] } },
  { title: 'whirl-ball — which way when the string is cut?', spec: { type: 'whirl-ball', static: true, paths: true, angle: 90 } },
  { title: 'whirl-ball — a car on a bend', spec: { type: 'whirl-ball', body: 'car', speed: 3, radius: 1.5, mass: 2, speedRange: [1, 5, 1] } },
];
