/**
 * orbit-cannon — Newton's cannon. A gun on a very high mountain fires a ball
 * horizontally. Slow shots curve down and land; faster ones land further round
 * the planet; fast enough, and the ground curves away as quickly as the ball
 * falls, so it never lands: an orbit.
 *
 * {
 *   type: 'orbit-cannon',
 *   speed: 3,                    // launch speed (km/s)
 *   speedRange: [1, 8, 0.5],     // slider [min, max, step]; omit to fix the speed
 *   height: 882,                 // height of the mountain top above the ground (km)
 *   radius: 6400,                // radius of the planet (km)
 *   g: 10,                       // gravity at the surface (m/s²); it weakens with distance as 1/r²
 *   keep: 4,                     // how many earlier shots stay visible, faded
 *   ghosts: [3, 5],              // speeds of reference paths that are always drawn (dashed)
 *   static: false,               // true: a picture without controls…
 *   show: 'start',               // …before firing ('start') or with the finished path ('end')
 * }
 *
 * State: { speed, launched, lands, orbits, escapes, circular, distance, angle, time, lowest, highest, shots }
 *   launched — the current speed has been fired
 *   lands    — the ball comes down;  orbits — it never does, and keeps going round
 *   escapes  — the speed is at least √2 × the circular speed: the ball leaves for good (its path is followed out to 4·r0)
 *   circular — the orbit is a circle (the speed is within 0.2% of the circular speed at the mountain top)
 *   distance — where it lands, measured along the ground from the foot of the mountain (km; null for an orbit)
 *   angle    — how far round the planet that is (degrees; 360 for an orbit)
 *   time     — flight time, or the time for one lap (minutes)
 *   lowest, highest — least and greatest height above the ground along the path (km)
 *   shots    — every shot fired so far: [{ speed, lands }]
 * The facts always describe the *current* speed; they do not wait for the animation.
 *
 * setState({ speed, shots }) sets the slider and shows the finished flight.
 *
 * The model is exact, not stepped: with gravity g·R²/r² the path is a conic,
 *   r(φ) = p / (1 + (q − 1)·cos φ),   q = r0·v²/(g·R²),   p = r0·q,
 * where φ is the angle travelled round the centre and r0 = R + height. The
 * circular speed at the mountain top is √(g·R²/r0) (7.5 km/s for the default
 * mountain; just above the ground it would be √(g·R) = 8 km/s). Times come
 * from Kepler's second law, dt = r²·dφ / (r0·v), by Simpson's rule. No air.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 400;
const TIME_SCALE = 900;     // simulated seconds per second of animation

addStyles('orbit-cannon', `
  .widget-orbit-cannon .oc-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--orange-text); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-orbit-cannon .oc-planet { font-family: var(--font-body); font-weight: 800; font-size: 15px; fill: var(--blue-text); }
  @media (max-width: 520px) { .widget-orbit-cannon .oc-tag { font-size: 17px; } .widget-orbit-cannon .oc-planet { font-size: 19px; } }
`);

/** The flight of a ball fired horizontally at `v` km/s from r0, round a planet of radius R with surface gravity g (km/s²). */
export function flight(v, { R = 6400, height = 882, g = 10 } = {}) {
  const r0 = R + height;
  const mu = (g / 1000) * R * R;                 // km³/s²
  const q = (r0 * v * v) / mu;
  const p = r0 * q;
  const rAt = (phi) => p / (1 + (q - 1) * Math.cos(phi));
  const far = q < 2 ? (r0 * q) / (2 - q) : Infinity;          // distance from the centre on the opposite side of the planet
  const lands = q < 1 && far < R;
  const escapes = q >= 2;
  // a ball that escapes never comes round again: it is followed until it is 4·r0 from the centre
  const phiEnd = lands ? Math.acos(clamp((1 - p / R) / (1 - q), -1, 1)) : escapes ? Math.acos((q / 4 - 1) / (q - 1)) : 2 * Math.PI;
  // time as a function of angle, by Simpson's rule on r²/(r0·v)
  const N = 720;
  const dphi = phiEnd / N;
  const f = (phi) => { const r = rAt(phi); return (r * r) / (r0 * v); };
  const times = [0];
  for (let i = 0; i < N; i++) {
    const a = i * dphi;
    times.push(times[i] + (dphi / 6) * (f(a) + 4 * f(a + dphi / 2) + f(a + dphi)));
  }
  const total = times[N];
  /** Angle travelled after t seconds. */
  const phiAt = (t) => {
    if (t <= 0) return 0;
    if (t >= total) return phiEnd;
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (times[mid] <= t) lo = mid; else hi = mid; }
    return (lo + (t - times[lo]) / (times[hi] - times[lo])) * dphi;
  };
  return {
    r0, q, lands, escapes, phiEnd, total, rAt, phiAt,
    orbits: !lands && !escapes,
    circular: Math.abs(Math.sqrt(q) - 1) < 0.002,
    distance: lands ? R * phiEnd : null,
    lowest: (lands ? R : Math.min(r0, far)) - R,
    highest: Math.max(r0, lands ? r0 : far) - R,
  };
}

export default function create(spec, env) {
  const world = { R: spec.radius || 6400, height: spec.height != null ? spec.height : 882, g: spec.g || 10 };
  const isStatic = !!spec.static || !!env.compact;
  const speedRange = !isStatic && Array.isArray(spec.speedRange) ? spec.speedRange : null;
  const keep = spec.keep != null ? spec.keep : 4;
  const initial = spec.speed != null ? spec.speed : 3;

  let speed = initial;
  let launched = isStatic && spec.show === 'end';
  let t = 0;                       // simulated seconds since firing
  let shots = [];
  let readOnly = !!env.readOnly;
  const cache = new Map();
  const fl = (v = speed) => { if (!cache.has(v)) cache.set(v, flight(v, world)); return cache.get(v); };

  /* ------------------------------------------------------------ geometry */
  const r0 = world.R + world.height;
  const vTop = Math.max(speedRange ? speedRange[1] : initial, ...(spec.ghosts || [0]));
  const farTop = fl(vTop).lands ? world.R : Math.min(fl(vTop).highest + world.R, 4 * r0);
  const k = (H - 34) / (r0 + Math.max(world.R, farTop));     // px per km
  const CX = W / 2;
  const CY = 18 + r0 * k;
  const pt = (phi, r) => ({ x: CX + r * k * Math.sin(phi), y: CY - r * k * Math.cos(phi) });

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A cannon on a mountain, firing round a planet' });
  const { svg } = fr;
  const Rpx = world.R * k;
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: Rpx, fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 3 }));
  svg.appendChild(s('text.oc-planet', { x: CX, y: CY + 5, 'text-anchor': 'middle' }, spec.planet || 'Earth'));
  // the mountain and the gun on its top
  const peak = pt(0, r0);
  const baseW = Math.max(7, world.height * k * 0.42);
  svg.appendChild(s('path', { d: `M${CX - baseW} ${CY - Rpx + 2}L${CX} ${peak.y + 5}L${CX + baseW} ${CY - Rpx + 2}Z`, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  svg.appendChild(s('rect', { x: CX - 9, y: peak.y - 4.5, width: 20, height: 9, rx: 3, fill: 'var(--ink-2)', stroke: 'var(--ink)', 'stroke-width': 2 }));

  const gGhost = s('g');
  const gOld = s('g');
  const gPath = s('g');
  const gMarks = s('g');
  const ball = s('circle', { r: 6.5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  svg.append(gGhost, gOld, gPath, gMarks, ball);

  const pathD = (f, upTo) => {
    let d = '';
    const n = Math.max(8, Math.ceil((upTo / (2 * Math.PI)) * 240));
    for (let i = 0; i <= n; i++) {
      const phi = (upTo * i) / n;
      const p = pt(phi, f.rAt(phi));
      d += `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
    return d;
  };
  for (const v of spec.ghosts || []) {
    const f = fl(v);
    gGhost.appendChild(s('path', { d: pathD(f, f.phiEnd), fill: 'none', stroke: hue('gray'), 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }));
  }

  /* ------------------------------------------------------------ controls */
  const roWhere = readout('lands', {});
  const roTime = readout('time', {});
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let slider = null;
  let goBtn = null;
  let clearBtn = null;
  const changed = () => { anim.stop(); launched = false; t = 0; note.textContent = ''; render(); };
  if (!isStatic) {
    fr.readouts.append(roWhere.el, roTime.el);
    if (speedRange) {
      slider = sliderRow({ label: 'speed', min: speedRange[0], max: speedRange[1], step: speedRange[2] || 0.5, value: speed, color: 'orange', unit: 'km/s', onInput: (v) => { if (readOnly) return; speed = v; changed(); } });
      fr.controls.appendChild(slider.el);
    }
    goBtn = button('Fire', () => go(true), { icon: 'rocket', variant: 'primary' });
    clearBtn = button('Clear', () => { if (readOnly) return; anim.stop(); shots = []; launched = false; t = 0; note.textContent = ''; render(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, clearBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    const f = fl();
    t = Math.min(f.total, t + dt * TIME_SCALE);
    if (t >= f.total - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  const minutes = (sec) => (sec < 10800 ? `${formatNumber(sec / 60, 0)} min` : `${formatNumber(sec / 3600, 1)} h`);
  function describe() {
    const f = fl();
    if (f.lands) return `It comes down ${formatNumber(Math.round(f.distance / 10) * 10, 0)} km from the foot of the mountain, after ${minutes(f.total)}.`;
    if (f.escapes) return 'It never lands and never comes back: at this speed gravity cannot hold it, and it escapes into space.';
    if (f.circular) return `It never lands. It circles the planet and comes back to the cannon after ${minutes(f.total)}.`;
    return `It never lands. Its path is a stretched loop that swings out to ${formatNumber(Math.round(f.highest / 10) * 10, 0)} km above the ground; one lap takes ${minutes(f.total)}.`;
  }

  function finish(notify) {
    launched = true;
    t = fl().total;
    render();
    note.textContent = describe();
    if (notify) {
      play(fl().lands ? 'drop' : 'pop');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function go(count) {
    if (readOnly && count) return;
    anim.stop();
    t = 0;
    launched = true;
    note.textContent = '';
    if (count) shots.push({ speed, lands: fl().lands });
    if (reducedMotion()) { finish(count); return; }
    notifyAtEnd = count;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const f = fl();
    const active = anim.running || launched;
    const now = active ? (isStatic ? f.total : t) : 0;
    const phi = f.phiAt(now);
    const p = pt(phi, f.rAt(phi));
    ball.setAttribute('cx', p.x.toFixed(1));
    ball.setAttribute('cy', p.y.toFixed(1));
    ball.setAttribute('visibility', now === 0 ? 'hidden' : 'visible');

    clear(gOld); clear(gPath); clear(gMarks);
    const old = shots.slice(0, launched ? -1 : shots.length).slice(-keep);
    for (const shot of old) {
      const of = fl(shot.speed);
      gOld.appendChild(s('path', { d: pathD(of, of.phiEnd), fill: 'none', stroke: hue('gray'), 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.75 }));
    }
    if (now > 0) gPath.appendChild(s('path', { d: pathD(f, phi), fill: 'none', stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

    const done = launched && !anim.running;
    if (done && f.lands) {
      const q = pt(f.phiEnd, world.R);
      gMarks.appendChild(s('circle', { cx: q.x, cy: q.y, r: 4.5, fill: 'var(--ink)' }));
      const out = pt(f.phiEnd, world.R + 26 / k);
      gMarks.appendChild(s('text.oc-tag', { x: clamp(out.x + 6, 50, W - 60), y: clamp(out.y, 30, H - 10), 'text-anchor': out.x > CX + 40 ? 'start' : 'middle' }, `${formatNumber(Math.round(f.distance / 10) * 10, 0)} km`));
    }

    roWhere.set(done ? (f.lands ? `${formatNumber(Math.round(f.distance / 10) * 10, 0)} km away` : 'never') : '—');
    roTime.set(done && !f.escapes ? `${minutes(f.total)}${f.lands ? '' : ' a lap'}` : '—');
    if (goBtn) { goBtn.lastChild.textContent = done ? 'Fire again' : 'Fire'; goBtn.disabled = readOnly; }
    if (clearBtn) clearBtn.disabled = readOnly || !shots.length;
    if (!isStatic) svg.setAttribute('aria-label', `${spec.alt || 'A cannon on a mountain, firing round a planet'}. Launch speed ${formatNumber(speed, 1)} kilometres per second.${done ? ` ${describe()}` : ''}`);
  }

  function getState() {
    const f = fl();
    return {
      speed, launched,
      lands: f.lands,
      orbits: f.orbits,
      escapes: f.escapes,
      circular: f.circular,
      distance: f.lands ? tidy(f.distance, 1) : null,
      angle: tidy((f.phiEnd * 180) / Math.PI, 1),
      time: tidy(f.total / 60, 1),
      lowest: tidy(f.lowest, 0),
      highest: tidy(f.highest, 0),
      shots: shots.map((shot) => ({ ...shot })),
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (typeof next.speed === 'number') { speed = speedRange ? clamp(next.speed, speedRange[0], speedRange[1]) : next.speed; if (slider) slider.set(speed); }
      if (Array.isArray(next.shots)) shots = next.shots.map((shot) => ({ speed: shot.speed != null ? shot.speed : speed })).map((shot) => ({ ...shot, lands: fl(shot.speed).lands }));
      if (next.launched === false) { launched = false; t = 0; render(); return; }
      if (isStatic) { render(); return; }
      const last = shots[shots.length - 1];
      if (!last || last.speed !== speed) shots.push({ speed, lands: fl().lands });
      finish(false);
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'orbit-cannon — Newton\'s mountain', spec: { type: 'orbit-cannon', speed: 3, speedRange: [1, 8, 0.5] } },
];
