/**
 * projectile — fire a ball and watch two independent motions happen at once:
 * steady sideways, accelerating downwards. Strobe images mark where the ball
 * is at equal time steps. Optionally a second ball is dropped at the same
 * moment, a target waits on the ground, and "shadows" on the ground and on a
 * wall show each motion on its own.
 *
 * {
 *   type: 'projectile',
 *   height: 0,                    // launch height above the ground (m); > 0 draws a cliff
 *   angle: 45, speed: 20,         // launch settings (degrees above horizontal, m/s)
 *   angleRange: [10, 80, 5],      // slider [min, max, step]; omit to fix the angle
 *   speedRange: [5, 30, 5],       // slider; omit to fix the speed
 *   dropBall: false,              // also drop a second ball from the launch height at the same moment
 *   target: { x: 40, width: 4 },  // a target on the ground (centre and width in m)
 *   world: [60, 30],              // width and height of the view (m)
 *   strobe: 0.5,                  // seconds between strobe images (0 for none)
 *   shadows: false,               // show the strobe images' shadows on the ground and on a wall
 *   ghosts: [{ angle: 30, speed: 20 }],   // faint reference paths that are always shown
 *   keep: 3,                      // how many earlier shots stay visible, faded
 *   g: 10,                        // m/s²
 *   static: false,                // true: a picture without controls…
 *   show: 'end',                  // …of the finished flight ('end') or before launch ('start')
 * }
 *
 * State: { angle, speed, launched, range, time, peak, dropTime, hit, miss, error, shots, best }
 *   launched — the current settings have been fired
 *   range    — horizontal distance to the landing point (m)
 *   time     — time in the air (s);  peak — greatest height above the ground (m)
 *   dropTime — time the dropped ball takes (null without one)
 *   hit      — the ball lands on the target;  miss — 'short' | 'long' | null
 *   error    — range minus the target's centre (m)
 *   shots    — every shot fired so far: [{ angle, speed, range }]
 *   best     — the longest of them
 * The facts always describe the *current* settings; they do not wait for the animation.
 *
 * setState({ angle, speed, shots }) sets the sliders and shows the finished flight.
 * No air resistance. Motion is exact: x = v·cos(a)·t, y = h + v·sin(a)·t − ½·g·t².
 */
import { frame, sliderRow, button, readout, loop, clipTo, niceStep, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const R = 9;            // ball radius (px)

addStyles('projectile', `
  .widget-projectile .pj-land { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--orange-text); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-projectile .pj-target { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--green-text); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) {
    .widget-projectile .pj-land, .widget-projectile .pj-target { font-size: 17px; }
  }
`);

export default function create(spec, env) {
  const g = spec.g || 10;
  const h0 = Math.max(0, spec.height || 0);
  const isStatic = !!spec.static || !!env.compact;
  const angleRange = !isStatic && Array.isArray(spec.angleRange) ? spec.angleRange : null;
  const speedRange = !isStatic && Array.isArray(spec.speedRange) ? spec.speedRange : null;
  const strobe = spec.strobe != null ? spec.strobe : 0.5;
  const keep = spec.keep != null ? spec.keep : 3;
  const target = spec.target ? { x: spec.target.x, width: spec.target.width || 4 } : null;
  const [worldW, worldH] = spec.world || [60, 30];
  const initial = { angle: spec.angle != null ? spec.angle : 45, speed: spec.speed != null ? spec.speed : 20 };

  let angle = initial.angle;
  let speed = initial.speed;
  let launched = isStatic && spec.show !== 'start';
  let t = 0;
  let shots = [];
  let readOnly = !!env.readOnly;

  /* ----------------------------------------------------------- the model */
  function flight(a = angle, v = speed) {
    const rad = (a * Math.PI) / 180;
    const vx = v * Math.cos(rad);
    const vy = v * Math.sin(rad);
    const time = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
    return {
      vx, vy, time,
      range: tidy(vx * time, 4),
      peak: tidy(h0 + (vy * vy) / (2 * g), 4),
      x: (tt) => vx * tt,
      y: (tt) => Math.max(0, h0 + vy * tt - 0.5 * g * tt * tt),
    };
  }
  const dropTime = Math.sqrt((2 * h0) / g);
  const verdict = (range) => {
    if (!target) return { hit: false, miss: null, error: null };
    const error = tidy(range - target.x, 4);
    const hit = Math.abs(error) <= target.width / 2 + 1e-9;
    return { hit, miss: hit ? null : (error < 0 ? 'short' : 'long'), error };
  };

  /* ------------------------------------------------------------ geometry */
  const padL = h0 > 0 ? 86 : 46;
  // px per metre (the same both ways, so angles look true); the canvas is only as tall as the view needs
  const kx = (W - padL - 22) / worldW;
  const GROUND = clamp(Math.ceil(worldH * kx) + 24, 150, 276);            // y of the ground surface
  const k = Math.min(kx, (GROUND - 24) / worldH);
  const H = GROUND + 44;
  const X = (m) => padL + m * k;
  const Y = (m) => GROUND - R - m * k;                                     // ball centre for a height in metres

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A ball launcher' });
  const { svg } = fr;
  const clip = clipTo(svg, { left: 0, top: 0, iw: W, ih: GROUND + 1 });

  // ground, ruler, cliff
  svg.appendChild(s('line', { x1: 0, x2: W, y1: GROUND, y2: GROUND, stroke: 'var(--ink)', 'stroke-width': 3 }));
  const labelEvery = niceStep(worldW, 6);
  for (let m = 0; X(m) <= W - 12; m += labelEvery / 2) {
    const major = Math.round(m / (labelEvery / 2)) % 2 === 0;
    svg.appendChild(s('line', { x1: X(m), x2: X(m), y1: GROUND + 2, y2: GROUND + (major ? 10 : 7), stroke: 'var(--ink)', 'stroke-width': major ? 2 : 1.5, 'stroke-linecap': 'round' }));
    if (major) svg.appendChild(s('text.tick-label', { x: X(m), y: GROUND + 27, 'text-anchor': 'middle' }, X(m + labelEvery) > W - 12 ? `${m} m` : String(m)));
  }
  let ledge = null;
  if (h0 > 0) {
    const topY = Y(h0) + R;
    svg.appendChild(s('path', { d: `M0 ${GROUND}V${topY}H${padL - 34}V${GROUND}Z`, fill: 'var(--sunken)', stroke: 'none' }));
    svg.appendChild(s('path', { d: `M0 ${topY}H${padL - 34}V${GROUND}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    ledge = s('line', { x1: padL - 34, x2: padL + R + 2, y1: topY, y2: topY, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    svg.appendChild(ledge);
    svg.appendChild(s('text.fig-label-sm', { x: (padL - 34) / 2, y: (topY + GROUND) / 2 + 4, 'text-anchor': 'middle' }, `${formatNumber(h0, 1)} m`));
  }
  if (target) {
    const x0 = X(target.x - target.width / 2);
    const x1 = X(target.x + target.width / 2);
    svg.appendChild(s('line', { x1: x0, x2: x1, y1: GROUND, y2: GROUND, stroke: hue('green'), 'stroke-width': 7, 'stroke-linecap': 'round' }));
    const cx = X(target.x);
    svg.appendChild(s('line', { x1: cx, x2: cx, y1: GROUND - 3, y2: GROUND - 30, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('path', { d: `M${cx} ${GROUND - 30}L${cx + 15} ${GROUND - 24}L${cx} ${GROUND - 18}Z`, fill: hue('green'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  }

  const gGuides = s('g', { 'clip-path': clip });
  const gOld = s('g', { 'clip-path': clip });
  const gPath = s('g', { 'clip-path': clip });
  const gGhosts = s('g', { 'clip-path': clip });
  const gLabels = s('g');
  svg.append(gGuides, gOld, gPath, gGhosts, gLabels);

  const pathD = (f, upTo) => {
    let d = '';
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const tt = (upTo * i) / n;
      d += `${i ? 'L' : 'M'}${X(f.x(tt)).toFixed(1)} ${Y(f.y(tt)).toFixed(1)}`;
    }
    return d;
  };
  for (const gh of spec.ghosts || []) {
    const f = flight(gh.angle, gh.speed);
    gOld.appendChild(s('path', { d: pathD(f, f.time), fill: 'none', stroke: hue('gray'), 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }));
    svg.appendChild(s('circle', { cx: X(f.range), cy: GROUND, r: 5, fill: hue('gray'), stroke: 'var(--ink)', 'stroke-width': 2 }));
    if (gh.label) svg.appendChild(s('text.fig-label-sm', { x: X(f.x(f.time * 0.3)) + 8, y: Y(f.y(f.time * 0.3)) + 16 }, gh.label));
  }
  const gOldShots = s('g', { 'clip-path': clip });
  svg.appendChild(gOldShots);

  if (spec.shadows) svg.appendChild(s('line', { x1: X(0) - 26, x2: X(0) - 26, y1: GROUND, y2: h0 > 0 ? Y(h0) : 10, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-linecap': 'round' }));

  // launcher barrel (ground launches) and the balls
  let barrel = null;
  if (h0 === 0) {
    barrel = s('rect', { x: -4, y: -7, width: 34, height: 14, rx: 5, fill: 'var(--ink-2)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
    svg.appendChild(barrel);
    svg.appendChild(s('circle', { cx: X(0), cy: GROUND - R, r: 11, fill: 'var(--ink-2)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  }
  const dropBall = spec.dropBall && h0 > 0
    ? s('circle', { r: R, fill: hue('teal'), stroke: 'var(--ink)', 'stroke-width': 2.5 })
    : null;
  const ball = s('circle', { r: R, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  if (dropBall) svg.appendChild(dropBall);
  svg.appendChild(ball);
  const dropX = X(0) - 2 * R - 3;

  /* ------------------------------------------------------------ controls */
  const roTime = readout('time in the air', {});
  const roRange = readout('lands at', {});
  const roPeak = readout('highest point', {});
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  let goBtn = null;
  let resetBtn = null;
  const changed = () => { anim.stop(); launched = false; t = 0; note.textContent = ''; render(); };
  if (!isStatic) {
    fr.readouts.append(roRange.el, roTime.el);
    if (h0 === 0) fr.readouts.append(roPeak.el);
    if (angleRange) {
      sliders.angle = sliderRow({ label: 'angle', min: angleRange[0], max: angleRange[1], step: angleRange[2] || 5, value: angle, color: 'violet', unit: '°', onInput: (val) => { angle = val; changed(); } });
      fr.controls.appendChild(sliders.angle.el);
    }
    if (speedRange) {
      sliders.speed = sliderRow({ label: 'speed', min: speedRange[0], max: speedRange[1], step: speedRange[2] || 1, value: speed, color: 'blue', unit: 'm/s', onInput: (val) => { speed = val; changed(); } });
      fr.controls.appendChild(sliders.speed.el);
    }
    goBtn = button(dropBall ? 'Fire and drop' : 'Launch', () => go(true), { icon: 'rocket', variant: 'primary' });
    resetBtn = button('Clear', () => {
      if (readOnly) return;
      anim.stop();
      shots = [];
      launched = false; t = 0; note.textContent = '';
      render();
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, resetBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const endOfRun = () => Math.max(flight().time, dropBall ? dropTime : 0);
  const anim = loop((dt) => {
    const end = endOfRun();
    t = Math.min(end, t + dt * 1.25);
    if (t >= end - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  function describe() {
    const f = flight();
    const where = `It lands ${formatNumber(f.range, 1)} m away after ${formatNumber(f.time, 2)} s`;
    if (X(f.range) > W) return `${where}: out of the picture.`;
    if (!target) return dropBall ? `Both balls land after ${formatNumber(f.time, 2)} s. The fired one is ${formatNumber(f.range, 1)} m away.` : `${where}.`;
    const v = verdict(f.range);
    if (v.hit) return `${where}: on the target.`;
    return `${where}: ${formatNumber(Math.abs(v.error), 1)} m ${v.miss === 'short' ? 'short of' : 'beyond'} the target.`;
  }

  function finish(notify) {
    launched = true;
    t = endOfRun();
    render();
    note.textContent = describe();
    if (notify) {
      play(verdict(flight().range).hit ? 'pop' : 'drop');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function go(count) {
    anim.stop();
    t = 0;
    launched = true;
    note.textContent = '';
    if (count && !readOnly) shots.push({ angle, speed, range: flight().range });
    if (reducedMotion()) { finish(count && !readOnly); return; }
    notifyAtEnd = count && !readOnly;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const f = flight();
    const active = anim.running || launched;
    const now = active ? (isStatic ? endOfRun() : t) : 0;
    const tf = Math.min(now, f.time);
    ball.setAttribute('cx', X(f.x(tf)));
    ball.setAttribute('cy', Y(f.y(tf)));
    ball.setAttribute('visibility', h0 === 0 && now === 0 ? 'hidden' : 'visible');
    if (dropBall) {
      const td = Math.min(now, dropTime);
      dropBall.setAttribute('cx', dropX);
      dropBall.setAttribute('cy', Y(Math.max(0, h0 - 0.5 * g * td * td)));
    }
    if (ledge) ledge.setAttribute('visibility', now > 0 ? 'hidden' : 'visible');
    if (barrel) barrel.setAttribute('transform', `translate(${X(0)} ${GROUND - R}) rotate(${-angle})`);

    clear(gGuides); clear(gPath); clear(gGhosts); clear(gLabels); clear(gOldShots);

    // earlier shots, faded
    const old = shots.slice(0, launched ? -1 : shots.length).slice(-keep);
    for (const shot of old) {
      const of = flight(shot.angle, shot.speed);
      gOldShots.appendChild(s('path', { d: pathD(of, of.time), fill: 'none', stroke: hue('gray'), 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.7 }));
      gOldShots.appendChild(s('line', { x1: X(of.range), x2: X(of.range), y1: GROUND - 9, y2: GROUND + 1, stroke: hue('gray'), 'stroke-width': 3, 'stroke-linecap': 'round' }));
    }

    if (now > 0) {
      gPath.appendChild(s('path', { d: pathD(f, tf), fill: 'none', stroke: hue('orange'), 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 }));
      if (strobe > 0) {
        for (let i = 1; i * strobe < now - 1e-9 && i < 60; i++) {
          const ts = i * strobe;
          const inAir = ts < f.time - 1e-9;
          const px = X(f.x(ts));
          const py = Y(f.y(ts));
          if (inAir) {
            gGhosts.appendChild(s('circle', { cx: px, cy: py, r: R - 2, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2 }));
            if (spec.shadows) {
              gGuides.appendChild(s('path', { d: `M${px} ${py}V${GROUND}M${px} ${py}H${X(0) - 26}`, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }));
              gLabels.appendChild(s('circle', { cx: px, cy: GROUND - 6, r: 5, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
              gLabels.appendChild(s('circle', { cx: X(0) - 26, cy: py, r: 5, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
            }
          }
          if (dropBall && ts < dropTime - 1e-9) {
            const dy = Y(Math.max(0, h0 - 0.5 * g * ts * ts));
            gGhosts.appendChild(s('circle', { cx: dropX, cy: dy, r: R - 2, fill: hue('teal', 'soft'), stroke: hue('teal'), 'stroke-width': 2 }));
            if (inAir) gGuides.appendChild(s('line', { x1: dropX + R, x2: px - R, y1: dy, y2: dy, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '2 5' }));
          }
        }
      }
    }

    const landed = launched && !anim.running;
    if (landed && !target && X(f.range) <= W - 4) {
      const lx = X(f.range);
      gLabels.appendChild(s('text.pj-land', { x: clamp(lx, 40, W - 40), y: GROUND - 2 * R - 9, 'text-anchor': 'middle' }, `${formatNumber(f.range, 1)} m`));
    }
    if (target) {
      const cx = X(target.x);
      gLabels.appendChild(s('text.pj-target', { x: clamp(cx + 4, 44, W - 44), y: GROUND - 38, 'text-anchor': 'middle' }, `target ${formatNumber(target.x, 1)} m`));
    }

    roTime.set(landed ? `${formatNumber(f.time, 2)} s` : '—');
    roRange.set(landed ? `${formatNumber(f.range, 1)} m` : '—');
    roPeak.set(landed ? `${formatNumber(f.peak, 1)} m` : '—');
    if (goBtn) goBtn.lastChild.textContent = dropBall ? (landed ? 'Again' : 'Fire and drop') : (landed ? 'Launch again' : 'Launch');
    if (resetBtn) resetBtn.disabled = readOnly || !shots.length;
    if (!isStatic) {
      svg.setAttribute('aria-label', `${spec.alt || 'A ball launcher'}. Angle ${formatNumber(angle, 0)} degrees, speed ${formatNumber(speed, 1)} metres per second${h0 ? `, from ${formatNumber(h0, 1)} metres up` : ''}.${landed ? ` ${describe()}` : ''}`);
    }
  }

  function getState() {
    const f = flight();
    const v = verdict(f.range);
    let best = null;
    for (const shot of shots) if (!best || shot.range > best.range) best = shot;
    return {
      angle, speed, launched,
      range: f.range,
      time: tidy(f.time, 4),
      peak: f.peak,
      dropTime: dropBall ? tidy(dropTime, 4) : null,
      hit: v.hit,
      miss: v.miss,
      error: v.error,
      shots: shots.map((shot) => ({ ...shot })),
      best: best ? { ...best } : null,
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
      if (typeof next.angle === 'number') { angle = angleRange ? clamp(next.angle, angleRange[0], angleRange[1]) : next.angle; if (sliders.angle) sliders.angle.set(angle); }
      if (typeof next.speed === 'number') { speed = speedRange ? clamp(next.speed, speedRange[0], speedRange[1]) : next.speed; if (sliders.speed) sliders.speed.set(speed); }
      if (Array.isArray(next.shots)) shots = next.shots.map((shot) => ({ angle: shot.angle != null ? shot.angle : angle, speed: shot.speed != null ? shot.speed : speed })).map((shot) => ({ ...shot, range: flight(shot.angle, shot.speed).range }));
      if (next.launched === false) { launched = false; t = 0; render(); return; }
      if (isStatic) { render(); return; }
      const last = shots[shots.length - 1];
      if (!last || last.angle !== angle || last.speed !== speed) shots.push({ angle, speed, range: flight().range });
      finish(false);
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
  { title: 'projectile — hit the target', spec: { type: 'projectile', angle: 30, speed: 20, angleRange: [10, 80, 5], speedRange: [10, 30, 5], target: { x: 40, width: 3 }, world: [100, 48] } },
  { title: 'projectile — dropped and fired from a cliff', spec: { type: 'projectile', height: 20, angle: 0, speed: 10, speedRange: [5, 25, 5], dropBall: true, world: [56, 24] } },
];
