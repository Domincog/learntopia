/**
 * light-ray — a ray of light meets a surface. At a mirror it bounces off at
 * the angle it came in at. At the boundary between two transparent materials
 * it changes speed and bends: towards the normal when it slows down, away
 * from the normal when it speeds up. Angles are measured from the normal, the
 * line at right angles to the surface, and read out live.
 *
 * {
 *   type: 'light-ray',
 *   mode: 'refract',              // 'mirror' | 'refract'
 *   angle: 40,                    // angle of the incoming ray, in degrees from the normal
 *   angleRange: [0, 80, 5],       // slider (and drag) limits [min, max, step]
 *   medium: 'water',              // the material below the surface: 'water' | 'glass' | 'diamond'
 *   media: ['water', 'glass', 'diamond'],   // optional buttons to swap it
 *   from: 'above',                // 'above': the light starts in the air · 'below': it starts inside the material and comes out
 *   fronts: false,                // draw the light as a wide beam with moving wavefronts (the "marching band" picture)
 *   target: { incidence: 50 },    // a coin (or, for a mirror, a detector) placed where the ray goes when the incoming angle is this
 *   aim: false,                   // with a target: a dashed straight line through the target and the point where the ray hits the surface
 *   apparent: false,              // from 'below': extend the ray that comes out backwards, to show where the light seems to come from
 *   readouts: true,
 *   static: false,
 * }
 *
 * State: { mode, angle, out, medium, bends, total, hit, tried }
 *   angle — the incoming angle;  out — the angle of the reflected or refracted ray (both from the normal, degrees)
 *   bends — 'towards' | 'away' | 'none': which way the ray turns relative to the normal as it crosses (mirror: 'none')
 *   total — the ray cannot get out and is reflected back inside (only possible from 'below')
 *   hit   — the ray passes through the target;  tried — every incoming angle the learner has set
 *
 * setState({ angle, medium }).
 *
 * The bending is computed from the speeds of light (Snell's law):
 * sin(out) / sin(angle) = speed after ÷ speed before. Speeds used, in km/s:
 * air 300 000, water 225 000, glass 200 000, diamond 124 000. Each side of the surface is labelled with its speed.
 */
import { frame, sliderRow, readout, handle, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 360;
const OX = 280;
const OY = 180;
const RS = 150;        // distance of the source (and of the target) from the point where the ray lands
const D2R = Math.PI / 180;
export const LIGHT_SPEED = { air: 300000, water: 225000, glass: 200000, diamond: 124000 };   // km/s
const TINT = { water: 'blue', glass: 'teal', diamond: 'violet' };

addStyles('light-ray', `
  .widget-light-ray .w-buttons { align-items: center; }
  .widget-light-ray .lr-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-light-ray .lr-medium { font-family: var(--font-body); font-weight: 700; font-size: 13px; fill: var(--ink-2); }
  @media (max-width: 520px) { .widget-light-ray .lr-tag, .widget-light-ray .lr-medium { font-size: 17px; } }
`);

/** Angle (degrees from the normal) of the ray after the surface, or null when it cannot cross. */
export function refractAngle(angle, speedBefore, speedAfter) {
  const sine = (Math.sin(angle * D2R) * speedAfter) / speedBefore;
  return sine > 1 ? null : Math.asin(sine) / D2R;
}

export default function create(spec, env) {
  const mode = spec.mode === 'mirror' ? 'mirror' : 'refract';
  const isStatic = !!spec.static || !!env.compact;
  const below = spec.from === 'below' && mode === 'refract';
  const range = Array.isArray(spec.angleRange) ? spec.angleRange : [0, 80, 5];
  const media = !isStatic && mode === 'refract' && Array.isArray(spec.media) ? spec.media : null;
  const showFronts = !!spec.fronts && mode === 'refract';

  let angle = clamp(spec.angle != null ? spec.angle : 40, range[0], range[1]);
  let medium = spec.medium || 'water';
  let tried = [];
  let phase = 0;
  let readOnly = !!env.readOnly;

  const speeds = () => (below ? [LIGHT_SPEED[medium], LIGHT_SPEED.air] : [LIGHT_SPEED.air, LIGHT_SPEED[medium]]);
  const outAngle = (a = angle) => (mode === 'mirror' ? a : refractAngle(a, ...speeds()));
  const targetOut = spec.target ? outAngle(spec.target.incidence) : null;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A ray of light meeting a surface' });
  const { svg } = fr;

  /* ------------------------------------------------------------- drawing */
  const lower = s('rect', { x: 0, y: OY, width: W, height: H - OY });
  svg.appendChild(lower);
  const gHatch = s('g');
  svg.appendChild(gHatch);
  if (mode === 'mirror') for (let x = 6; x < W; x += 16) gHatch.appendChild(s('line', { x1: x, x2: x - 10, y1: OY + 3, y2: OY + 15, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: 0, x2: W, y1: OY, y2: OY, stroke: 'var(--ink)', 'stroke-width': 3 }));
  svg.appendChild(s('line', { x1: OX, x2: OX, y1: 16, y2: mode === 'mirror' ? OY : H - 16, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 6' }));
  svg.appendChild(s('text.lr-tag', { x: OX + 8, y: 28, style: 'fill: var(--ink-3)' }, 'normal'));
  const upperLabel = s('text.lr-medium', { x: 14, y: 26 });
  const lowerLabel = s('text.lr-medium', { x: 14, y: H - 14 });
  svg.append(upperLabel, lowerLabel);
  const gFronts = s('g');
  const gRays = s('g');
  const gArcs = s('g');
  const gTarget = s('g');
  svg.append(gFronts, gTarget, gRays, gArcs);

  /** A point `r` px from the landing point, at `deg` from the normal; side −1: left, +1: right; up −1: above the surface, +1: below. */
  const polar = (deg, r, side, up) => ({ x: OX + side * r * Math.sin(deg * D2R), y: OY + up * r * Math.cos(deg * D2R) });
  const srcUp = below ? 1 : -1;            // which side of the surface the light starts on
  const outUp = mode === 'mirror' ? -1 : -srcUp;

  /* ------------------------------------------------------------ controls */
  const roIn = readout(mode === 'mirror' ? 'angle in' : `angle in ${below ? 'the material' : 'air'}`, { color: 'red' });
  const roOut = readout(mode === 'mirror' ? 'angle out' : 'angle after', { color: 'violet' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let slider = null;
  let grip = null;
  const mediumBtns = [];

  function getState() {
    const out = outAngle();
    const bends = mode === 'mirror' || out == null || Math.abs(out - angle) < 1e-9 ? 'none' : (out < angle ? 'towards' : 'away');
    return {
      mode, angle,
      out: out == null ? null : tidy(out, 4),
      medium: mode === 'mirror' ? null : medium,
      bends,
      total: mode === 'refract' && out == null,
      hit: spec.target ? angle === spec.target.incidence : false,
      tried: tried.slice(),
    };
  }
  const setAngle = (v, notify) => {
    const st = range[2] || 5;
    const next = clamp(Math.round(v / st) * st, range[0], range[1]);
    if (next === angle) { render(); return; }
    angle = next;
    if (!tried.includes(angle)) tried.push(angle);
    if (slider) slider.set(angle);
    render();
    if (notify) { if (spec.target && angle === spec.target.incidence) play('pop'); env.onChange(getState()); }
  };

  if (!isStatic) {
    if (spec.readouts !== false) fr.readouts.append(roIn.el, roOut.el);
    slider = sliderRow({ label: 'angle of the incoming ray', min: range[0], max: range[1], step: range[2] || 5, value: angle, color: 'red', unit: '°', onInput: (v) => { if (readOnly) return; setAngle(v, true); } });
    fr.controls.appendChild(slider.el);
    if (media) {
      const seg = h('div.segmented', { role: 'group', 'aria-label': 'Material below the surface' });
      media.forEach((name) => {
        const b = h('button', { type: 'button' }, name);
        b.addEventListener('click', () => { if (readOnly || medium === name) return; medium = name; play('select'); render(); env.onChange(getState()); });
        mediumBtns.push({ b, name });
        seg.appendChild(b);
      });
      fr.buttons.appendChild(seg);
    }
    fr.el.appendChild(note);
    grip = handle(svg, {
      x: 0, y: 0, color: 'red', label: 'Light source', keyStep: 14,
      onMove(px, py) {
        if (readOnly) return;
        const dx = OX - px;
        const dy = (py - OY) * srcUp;
        setAngle(Math.atan2(Math.max(dx, 0), Math.max(dy, 1e-6)) / D2R, true);
      },
    });
    svg.appendChild(grip.el);
  }

  /* ----------------------------------------------------------- wavefronts */
  const anim = loop((dt) => { phase = (phase + dt * 0.9) % 1; render(); });

  /**
   * Lines of constant phase across a beam of the given width that travels in
   * the direction (kx, ky), kept to the side of the surface where `up` points.
   * Fronts are `lambda` px apart; the same `phase` on both sides of the
   * surface makes the two sets join up along it.
   */
  function fronts(group, kx, ky, up, lambda, widthPx, dMin, dMax) {
    const px = -ky;
    const py = kx;
    const first = Math.ceil(dMin / lambda - phase);
    const last = Math.floor(dMax / lambda - phase);
    for (let m = first; m <= last; m++) {
      const d = (m + phase) * lambda;                  // distance past the landing point, along the direction of travel
      const cx = OX + kx * d;
      const cy = OY + ky * d;
      let s0 = -widthPx / 2;
      let s1 = widthPx / 2;
      const inside = (sv) => (cy + py * sv - OY) * up >= -1e-9;
      if (Math.abs(py) > 1e-9) {
        const cross = (OY - cy) / py;
        if (!inside(s0) && !inside(s1)) continue;
        if (!inside(s0)) s0 = cross;
        if (!inside(s1)) s1 = cross;
      } else if (!inside(0)) continue;
      if (Math.abs(s1 - s0) < 1.5) continue;
      group.appendChild(s('line', { x1: (cx + px * s0).toFixed(1), y1: (cy + py * s0).toFixed(1), x2: (cx + px * s1).toFixed(1), y2: (cy + py * s1).toFixed(1), stroke: hue('red'), 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }));
    }
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const km = (v) => `${formatNumber(v / 1000, 0)},000 km/s`;

  function arc(group, deg, r, side, up, color, label) {
    if (deg < 0.5) return;
    const a = polar(0, r, side, up);
    const b = polar(deg, r, side, up);
    const sweep = side * up > 0 ? 0 : 1;
    group.appendChild(s('path', { d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}A${r} ${r} 0 0 ${sweep} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, fill: 'none', stroke: hue(color), 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    const mid = polar(deg / 2, r + 22, side, up);
    group.appendChild(s('text.lr-tag', { x: mid.x, y: mid.y + 5, 'text-anchor': 'middle', style: `fill:${hue(color, 'text')}` }, label));
  }

  function render() {
    const out = outAngle();
    clear(gRays); clear(gArcs); clear(gTarget); clear(gFronts);
    if (mode === 'mirror') {
      lower.setAttribute('fill', 'var(--sunken)');
      upperLabel.textContent = '';
      lowerLabel.textContent = 'mirror';
    } else {
      lower.setAttribute('fill', hue(TINT[medium] || 'blue', 'soft'));
      upperLabel.textContent = `air · ${km(LIGHT_SPEED.air)}`;
      lowerLabel.textContent = `${medium} · ${km(LIGHT_SPEED[medium])}`;
    }
    const src = polar(angle, RS, -1, srcUp);
    const ray = { stroke: hue('red'), 'stroke-width': 4, 'stroke-linecap': 'round' };

    if (spec.target && targetOut != null) {
      const tp = polar(targetOut, RS, 1, outUp);
      if (spec.aim) {
        // the straight line from the target back through the landing point: where you would aim if light did not bend
        const back = polar(targetOut, RS + 12, -1, -outUp);
        gTarget.appendChild(s('line', { x1: tp.x, y1: tp.y, x2: back.x, y2: back.y, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 6' }));
      }
      const hit = angle === spec.target.incidence;
      gTarget.appendChild(s('circle', { cx: tp.x, cy: tp.y, r: 12, fill: hue(hit ? 'green' : 'yellow'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gTarget.appendChild(s('text.lr-tag', { x: tp.x + 18, y: tp.y + 5, style: 'fill: var(--ink-2)' }, mode === 'mirror' ? 'detector' : 'coin'));
    }

    if (showFronts && out != null) {
      const lambdaIn = 24;
      const [vIn, vOut] = speeds();
      const lambdaOut = (lambdaIn * vOut) / vIn;
      const widthIn = 84;
      const widthOut = (widthIn * Math.cos(out * D2R)) / Math.cos(angle * D2R);
      const reach = (widthIn / 2) * Math.tan(angle * D2R);          // how far past the landing point the beam's far edge still is on the first side
      fronts(gFronts, Math.sin(angle * D2R), -srcUp * Math.cos(angle * D2R), srcUp, lambdaIn, widthIn, -RS, reach);
      fronts(gFronts, Math.sin(out * D2R), outUp * Math.cos(out * D2R), outUp, lambdaOut, widthOut, -(widthOut / 2) * Math.tan(out * D2R), RS + 30);
    }

    gRays.appendChild(s('line', { ...ray, x1: src.x, y1: src.y, x2: OX, y2: OY, opacity: showFronts ? 0.35 : 1 }));
    if (out != null) {
      const end = polar(out, mode === 'mirror' ? RS : RS + 40, 1, outUp);
      gRays.appendChild(s('line', { ...ray, x1: OX, y1: OY, x2: end.x, y2: end.y, opacity: showFronts ? 0.35 : 1 }));
      if (spec.apparent && below) {
        const back = polar(out, RS, -1, 1);
        gRays.appendChild(s('line', { x1: OX, y1: OY, x2: back.x, y2: back.y, stroke: hue('violet'), 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }));
        gRays.appendChild(s('text.lr-tag', { x: clamp(back.x, 70, W - 70), y: clamp(back.y + 20, 20, H - 30), 'text-anchor': 'middle', style: `fill:${hue('violet', 'text')}` }, 'where it seems to come from'));
      }
    } else {
      const end = polar(angle, RS, 1, srcUp);
      gRays.appendChild(s('line', { ...ray, x1: OX, y1: OY, x2: end.x, y2: end.y }));
    }
    // the source: a small torch pointing at the landing point
    if (isStatic) gRays.appendChild(s('circle', { cx: src.x, cy: src.y, r: 9, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));

    arc(gArcs, angle, 46, -1, srcUp, 'red', `${formatNumber(angle, 0)}°`);
    if (out != null) arc(gArcs, out, 46, 1, outUp, 'violet', `${formatNumber(out, 1)}°`);

    roIn.set(`${formatNumber(angle, 0)}°`);
    roOut.set(out == null ? 'none: all reflected' : `${formatNumber(out, 1)}°`);
    if (grip) { grip.set(src.x, src.y); grip.setLabel(`incoming ray at ${formatNumber(angle, 0)} degrees from the normal`); grip.setEnabled(!readOnly); }
    for (const { b, name } of mediumBtns) { b.setAttribute('aria-pressed', String(medium === name)); b.disabled = readOnly; }
    if (!isStatic) {
      svg.setAttribute('aria-label', mode === 'mirror'
        ? `${spec.alt || 'A ray of light reflecting from a mirror'}. It arrives at ${formatNumber(angle, 0)} degrees from the normal and leaves at ${formatNumber(out, 0)} degrees on the other side.`
        : `${spec.alt || 'A ray of light crossing a surface'}. It arrives at ${formatNumber(angle, 0)} degrees from the normal${out == null ? ' and is reflected back: it cannot get out.' : ` and carries on at ${formatNumber(out, 1)} degrees from the normal in the ${below ? 'air' : medium}.`}`);
    }
  }

  tried.push(angle);
  render();
  if (showFronts && !isStatic && !reducedMotion()) anim.start();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.medium === 'string' && LIGHT_SPEED[next.medium]) medium = next.medium;
      if (typeof next.angle === 'number') { angle = clamp(next.angle, range[0], range[1]); if (!tried.includes(angle)) tried.push(angle); if (slider) slider.set(angle); }
      render();
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); if (grip) grip.destroy(); },
  };
}

export const examples = [
  { title: 'light-ray — a mirror', spec: { type: 'light-ray', mode: 'mirror', angle: 50, target: { incidence: 35 } } },
  { title: 'light-ray — from air into water, glass or diamond', spec: { type: 'light-ray', angle: 40, media: ['water', 'glass', 'diamond'] } },
  { title: 'light-ray — wavefronts crossing into glass', spec: { type: 'light-ray', angle: 50, medium: 'glass', fronts: true } },
];
