/**
 * motion-graph — a cart runs along a straight track while its position–time
 * graph is drawn live. The trip is split into equal stages; the learner sets
 * one velocity per stage and presses Go. Steeper line = faster, flat line =
 * standing still, falling line = coming back.
 *
 * {
 *   type: 'motion-graph',
 *   duration: 8,                  // length of the time axis (s)
 *   stage: 2,                     // length of one stage (s); duration / stage stages
 *   track: 12,                    // track length = top of the position axis (m)
 *   start: 0,                     // starting position (m)
 *   velocities: [0, 0, 0, 0],     // starting velocity of each stage (m/s, + is away from 0)
 *   vRange: [-4, 4], vStep: 1,    // what the steppers allow
 *   target: [2, 0, 3, -4],        // optional: velocities of a dashed target graph
 *   tStep: 1, xStep: 2,           // grid spacing (auto if omitted)
 *
 *   // Static figures (no controls, the finished graph is shown):
 *   static: true,
 *   showTrack: false,             // the track is hidden in static figures unless true
 *   stageLabels: ['A', 'B'],      // a letter over each stage of the line
 *   points: [{ t: 2, x: 4, label: '(2, 4)' }],          // marked points
 *   triangle: { from: [2, 4], to: [4, 10] },            // dashed run and rise legs between two points
 *   extra: [{ start: 0, velocities: [1, 1], color: 'teal', label: 'B' }],   // more lines on the same axes
 *   label: 'A', color: 'blue',    // name and colour of the main line
 * }
 *
 * State: { velocities, positions, end, distance, played, crashed, match, firstWrong }
 *   positions  — where the cart is at each stage boundary (length stages + 1), ignoring the track ends
 *   end        — the last of those
 *   distance   — total ground covered, forwards plus backwards (m)
 *   played     — the learner has run the current settings with Go
 *   crashed    — the cart would run off an end of the track
 *   match      — every velocity equals the target's (false when there is no target)
 *   firstWrong — index of the first stage that differs from the target (-1 if none)
 *
 * setState({ velocities }) sets the steppers and shows the finished run.
 * The motion is exact: positions come from x = x0 + v·t, not from frame timing.
 */
import { frame, plane, drawAxes, button, loop, arrowMarker, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const PAD_L = 54;
const PAD_R = 16;

addStyles('motion-graph', `
  .widget-motion-graph .mg-steps { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 6px; padding: 0 ${((PAD_R / W) * 100).toFixed(2)}% 0 ${((PAD_L / W) * 100).toFixed(2)}%; }
  .widget-motion-graph .mg-col { display: grid; grid-template-columns: 38px minmax(0, 1fr) 38px; grid-template-areas: "head head head" "down val up"; align-items: center; gap: 4px 2px; text-align: center; min-width: 0; }
  .widget-motion-graph .mg-col-head { grid-area: head; font-size: var(--fs-xs); font-weight: 800; color: var(--ink-3); white-space: nowrap; }
  .widget-motion-graph .mg-col .btn { min-height: 40px; width: 100%; padding: 0; }
  .widget-motion-graph .mg-up { grid-area: up; }
  .widget-motion-graph .mg-down { grid-area: down; }
  .widget-motion-graph .mg-val { grid-area: val; font-family: var(--font-mono); font-weight: 700; font-size: 1.1rem; line-height: 1.15; font-variant-numeric: tabular-nums; }
  .widget-motion-graph .mg-val small { display: block; font-family: var(--font-body); font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); }
  .widget-motion-graph .mg-band { fill: var(--sunken); opacity: 0.55; }
  .widget-motion-graph .mg-letter { font-family: var(--font-body); font-weight: 800; font-size: 17px; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 5px; stroke-linejoin: round; }
  @media (max-width: 520px) {
    .widget-motion-graph .mg-col { grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "up" "val" "down"; }
    .widget-motion-graph .mg-letter { font-size: 22px; }
  }
`);

const signedText = (val) => (val > 0 ? `+${formatNumber(val, 2)}` : formatNumber(val, 2));

export default function create(spec, env) {
  const duration = spec.duration || 8;
  const stageLen = spec.stage || 2;
  const n = Math.max(1, Math.round(duration / stageLen));
  const trackLen = spec.track || 12;
  const start = spec.start || 0;
  const [vMin, vMax] = spec.vRange || [-4, 4];
  const vStep = spec.vStep || 1;
  const isStatic = !!spec.static || !!env.compact;
  const showTrack = spec.showTrack != null ? !!spec.showTrack : !isStatic;
  const target = Array.isArray(spec.target) ? Array.from({ length: n }, (_, i) => spec.target[i] || 0) : null;
  const initial = Array.from({ length: n }, (_, i) => (spec.velocities && spec.velocities[i]) || 0);
  const mainColor = spec.color || 'blue';

  let v = initial.slice();
  let readOnly = !!env.readOnly;
  let played = isStatic;
  let t = 0;

  /* ----------------------------------------------------------- the model */
  /** Boundary positions for a list of stage velocities, plus where (if anywhere) the cart leaves the track. */
  function trip(vels, from = start) {
    const pos = [from];
    let crash = null;
    for (let i = 0; i < vels.length; i++) {
      const x0 = pos[i];
      const x1 = tidy(x0 + vels[i] * stageLen);
      if (!crash && (x1 > trackLen + 1e-9 || x1 < -1e-9)) {
        const wall = x1 > trackLen ? trackLen : 0;
        crash = { t: i * stageLen + (wall - x0) / vels[i], x: wall, stage: i };
      }
      pos.push(x1);
    }
    return { pos, crash };
  }
  /** Position at a time (exact, piecewise linear). */
  function xAt(time, vels, pos) {
    const i = clamp(Math.floor(time / stageLen + 1e-9), 0, vels.length - 1);
    return pos[i] + vels[i] * (time - i * stageLen);
  }
  const endTime = () => { const { crash } = trip(v); return crash ? crash.t : duration; };

  /* ------------------------------------------------------------ drawing */
  const trackBand = showTrack ? 88 : 0;
  const height = env.compact ? 300 : (showTrack ? 376 : 290);
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'Position–time graph' });
  const { svg } = fr;
  const pl = plane({ x: [0, duration], y: [0, trackLen], width: W, height, pad: { l: PAD_L, r: PAD_R, t: trackBand + 14, b: env.compact ? 36 : 52 } });
  const tx = (m) => 44 + (m / trackLen) * (W - 44 - 36);   // track metres -> px

  // stage bands and dividers
  const gStages = s('g');
  for (let i = 0; i < n; i++) {
    const x0 = pl.sx(i * stageLen);
    const x1 = pl.sx(Math.min(duration, (i + 1) * stageLen));
    if (i % 2 === 1 && n > 1) gStages.appendChild(s('rect.mg-band', { x: x0, y: pl.top, width: x1 - x0, height: pl.ih }));
  }
  svg.appendChild(gStages);
  svg.appendChild(drawAxes(pl, {
    xStep: spec.tStep || (duration <= 10 ? 1 : undefined), yStep: spec.xStep || (trackLen <= 12 ? 2 : undefined),
    labels: !env.compact,
  }));
  if (env.compact) {
    svg.appendChild(s('text.mg-letter', { x: pl.right, y: pl.bottom + 26, 'text-anchor': 'end' }, 'time'));
    svg.appendChild(s('text.mg-letter', { x: pl.left + 8, y: pl.top + 20 }, 'position'));
  } else {
    const midY = (pl.top + pl.bottom) / 2;
    svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: height - 8, 'text-anchor': 'middle' }, 'time (s)'));
    svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, 'position (m)'));
  }
  if (!isStatic && n > 1) {
    for (let i = 1; i < n; i++) svg.appendChild(s('line', { x1: pl.sx(i * stageLen), x2: pl.sx(i * stageLen), y1: pl.top, y2: pl.bottom, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }));
  }

  const polyline = (pos, upTo = duration) => {
    let d = `M${pl.sx(0).toFixed(1)} ${pl.sy(pos[0]).toFixed(1)}`;
    for (let i = 1; i < pos.length; i++) {
      const tb = i * stageLen;
      if (tb <= upTo + 1e-9) { d += `L${pl.sx(tb).toFixed(1)} ${pl.sy(pos[i]).toFixed(1)}`; continue; }
      const t0 = (i - 1) * stageLen;
      if (upTo > t0) {
        const x = pos[i - 1] + ((pos[i] - pos[i - 1]) * (upTo - t0)) / stageLen;
        d += `L${pl.sx(upTo).toFixed(1)} ${pl.sy(x).toFixed(1)}`;
      }
      break;
    }
    return d;
  };
  const lineAttrs = (color, dashed) => ({ fill: 'none', stroke: hue(color), 'stroke-width': env.compact ? 6 : 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dashed ? '7 7' : null });

  // dashed target and any extra lines sit under the learner's line
  if (target) svg.appendChild(s('path', { ...lineAttrs('gray', true), 'stroke-width': 3, d: polyline(trip(target).pos) }));
  const endLabels = [];
  for (const ex of spec.extra || []) {
    const pos = trip(ex.velocities || [], ex.start || 0).pos;
    svg.appendChild(s('path', { ...lineAttrs(ex.color || 'teal', ex.dashed), d: polyline(pos) }));
    if (ex.label) endLabels.push({ text: ex.label, color: ex.color || 'teal', x: pos[pos.length - 1], tEnd: (pos.length - 1) * stageLen });
  }
  if (spec.label) endLabels.push({ text: spec.label, color: mainColor, x: trip(v).pos[n], tEnd: duration });

  const line = s('path', lineAttrs(mainColor));
  const crashMark = s('path', { fill: 'none', stroke: hue('red'), 'stroke-width': 3.5, 'stroke-linecap': 'round', visibility: 'hidden' });
  const dot = s('circle', { r: 7, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  svg.append(line, crashMark);

  // annotations for static figures
  if (spec.triangle) {
    const [t0, x0] = spec.triangle.from;
    const [t1, x1] = spec.triangle.to;
    svg.appendChild(s('path', { d: `M${pl.sx(t0)} ${pl.sy(x0)}H${pl.sx(t1)}`, fill: 'none', stroke: hue('green'), 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }));
    svg.appendChild(s('path', { d: `M${pl.sx(t1)} ${pl.sy(x0)}V${pl.sy(x1)}`, fill: 'none', stroke: hue('red'), 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }));
    const below = x1 >= x0;
    svg.appendChild(s('text.fig-label', { x: (pl.sx(t0) + pl.sx(t1)) / 2, y: pl.sy(x0) + (below ? 20 : -9), 'text-anchor': 'middle', style: `fill:${hue('green', 'text')}` }, `${formatNumber(t1 - t0, 2)} s`));
    svg.appendChild(s('text.fig-label', { x: pl.sx(t1) + 8, y: (pl.sy(x0) + pl.sy(x1)) / 2 + 5, 'text-anchor': 'start', style: `fill:${hue('red', 'text')}` }, `${formatNumber(x1 - x0, 2)} m`));
  }
  (spec.stageLabels || []).forEach((text, i) => {
    if (i >= n || !text) return;
    const pos = trip(v).pos;
    const mid = (pos[i] + pos[i + 1]) / 2;
    const y = clamp(pl.sy(mid) - 12, pl.top + 18, pl.bottom - 8);
    svg.appendChild(s('text.mg-letter', { x: pl.sx((i + 0.5) * stageLen), y, 'text-anchor': 'middle' }, text));
  });
  for (const lab of endLabels) {
    const px = pl.sx(Math.min(lab.tEnd, duration));
    svg.appendChild(s('text.mg-letter', { x: px - 8, y: clamp(pl.sy(lab.x) - 10, pl.top + 18, pl.bottom - 8), 'text-anchor': 'end', style: `fill:${hue(lab.color, 'text')}` }, lab.text));
  }
  for (const p of spec.points || []) {
    svg.appendChild(s('circle', { cx: pl.sx(p.t), cy: pl.sy(p.x), r: 6, fill: hue(p.color || 'orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    if (p.label) {
      const right = pl.sx(p.t) < pl.right - 110;
      const up = p.above != null ? p.above : !right;
      svg.appendChild(s('text.fig-label', { x: pl.sx(p.t) + (right ? 12 : -12), y: pl.sy(p.x) + (up ? -10 : 20), 'text-anchor': right ? 'start' : 'end' }, p.label));
    }
  }
  if (!isStatic) svg.appendChild(dot);

  // the track with its cart
  let cart = null;
  let arrow = null;
  if (showTrack) {
    const railY = 55;
    svg.appendChild(s('line', { x1: tx(0) - 26, x2: tx(trackLen) + 14, y1: railY, y2: railY, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    const every = trackLen <= 12 ? 1 : trackLen <= 24 ? 2 : 5;
    const labelEvery = trackLen <= 12 ? 2 : trackLen <= 24 ? 4 : 10;
    for (let m = 0; m <= trackLen + 1e-9; m += every) {
      const major = Math.round(m) % labelEvery === 0;
      svg.appendChild(s('line', { x1: tx(m), x2: tx(m), y1: railY, y2: railY + (major ? 9 : 5), stroke: 'var(--ink)', 'stroke-width': major ? 2 : 1.5, 'stroke-linecap': 'round' }));
      if (major) svg.appendChild(s('text.tick-label', { x: tx(m), y: railY + 25, 'text-anchor': 'middle' }, m + every > trackLen && m > 0 ? `${m} m` : String(m)));
    }
    arrow = s('line', { stroke: hue('blue'), 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': arrowMarker(svg, 'blue', 3.5), visibility: 'hidden' });
    cart = s('g',
      s('rect', { x: -22, y: railY - 32, width: 44, height: 21, rx: 6, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('circle', { cx: -12, cy: railY - 7, r: 6, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
      s('circle', { cx: 12, cy: railY - 7, r: 6, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    );
    svg.append(cart, arrow);
  }

  /* ----------------------------------------------------------- controls */
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const cols = [];
  let goBtn = null;
  let resetBtn = null;

  if (!isStatic) {
    const grid = h('div.mg-steps', { style: { '--n': n } });
    for (let i = 0; i < n; i++) {
      const range = `${formatNumber(i * stageLen, 2)}–${formatNumber((i + 1) * stageLen, 2)} s`;
      const up = button('', () => bump(i, vStep), { icon: 'plus', title: `Faster forwards, ${range}` });
      const down = button('', () => bump(i, -vStep), { icon: 'minus', title: `Faster backwards, ${range}` });
      up.setAttribute('aria-label', `Increase the velocity from ${range}`);
      down.setAttribute('aria-label', `Decrease the velocity from ${range}`);
      const val = h('b');
      up.classList.add('mg-up');
      down.classList.add('mg-down');
      grid.appendChild(h('div.mg-col', h('div.mg-col-head', range), up, h('output.mg-val', { 'aria-label': `Velocity from ${range}` }, val, h('small', 'm/s')), down));
      cols.push({ up, down, val });
    }
    fr.controls.appendChild(grid);
    goBtn = button('Go', () => go(), { icon: 'play', variant: 'primary' });
    resetBtn = button('Reset', () => {
      if (readOnly) return;
      anim.stop();
      v = initial.slice();
      played = false;
      t = 0;
      note.textContent = '';
      render();
      env.onChange(getState());
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, resetBtn);
    fr.el.appendChild(note);
  }

  function bump(i, delta) {
    if (readOnly) return;
    const next = tidy(clamp(v[i] + delta, vMin, vMax));
    if (next === v[i]) return;
    anim.stop();
    v[i] = next;
    played = false;
    t = 0;
    note.textContent = '';
    play('tap');
    render();
    env.onChange(getState());
  }

  /* ---------------------------------------------------------- animation */
  const speed = duration / clamp(duration * 0.55, 2.5, 6);   // simulated seconds per real second
  const anim = loop((dt) => {
    const stop = endTime();
    t = Math.min(stop, t + dt * speed);
    if (t >= stop - 1e-9) { t = stop; anim.stop(); finish(true); return; }
    render();
  });

  function finish(notify) {
    played = true;
    const { crash } = trip(v);
    t = crash ? crash.t : duration;
    render();
    if (crash) {
      note.textContent = crash.t < 1e-9
        ? 'The cart is already at the start of the track. It cannot back up any further.'
        : `Bump! The cart reached the ${crash.x > 0 ? 'far end' : 'start'} of the track after ${formatNumber(crash.t, 1)} s.`;
      env.announce(note.textContent);
    } else if (notify) {
      env.announce(`The cart finished at ${formatNumber(trip(v).pos[n], 1)} metres.`);
    }
    if (notify) { play(crash ? 'drop' : 'tick'); env.onChange(getState()); }
  }

  function go() {
    if (isStatic) return;
    anim.stop();
    note.textContent = '';
    played = false;
    t = 0;
    if (reducedMotion()) { finish(!readOnly); return; }
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const { pos, crash } = trip(v);
    const shown = isStatic ? duration : t;
    const drawn = played || anim.running || shown > 0;
    line.setAttribute('d', drawn ? polyline(pos, shown) : '');
    const x = clamp(xAt(Math.min(shown, duration), v, pos), 0, trackLen);
    const stage = clamp(Math.floor(shown / stageLen - 1e-9), 0, n - 1);
    const moving = anim.running;
    dot.setAttribute('cx', pl.sx(shown));
    dot.setAttribute('cy', pl.sy(x));
    const hit = crash && played && !moving;
    crashMark.setAttribute('visibility', hit ? 'visible' : 'hidden');
    if (hit) {
      const cxp = pl.sx(crash.t);
      const cyp = pl.sy(crash.x);
      crashMark.setAttribute('d', `M${cxp - 11} ${cyp - 11}L${cxp + 11} ${cyp + 11}M${cxp - 11} ${cyp + 11}L${cxp + 11} ${cyp - 11}`);
    }
    if (cart) {
      cart.setAttribute('transform', `translate(${tx(x).toFixed(1)} 0)`);
      const showArrow = moving && Math.abs(v[stage]) > 1e-9;
      arrow.setAttribute('visibility', showArrow ? 'visible' : 'hidden');
      if (showArrow) {
        const len = 14 + Math.abs(v[stage]) * 9;
        const dir = Math.sign(v[stage]);
        arrow.setAttribute('x1', tx(x));
        arrow.setAttribute('x2', tx(x) + dir * len);
        arrow.setAttribute('y1', 12);
        arrow.setAttribute('y2', 12);
      }
    }
    if (!isStatic) {
      cols.forEach((c, i) => {
        c.val.textContent = signedText(v[i]);
        c.up.disabled = readOnly || v[i] >= vMax;
        c.down.disabled = readOnly || v[i] <= vMin;
      });
      goBtn.lastChild.textContent = played && !moving ? 'Go again' : 'Go';
      resetBtn.disabled = readOnly;
      svg.setAttribute('aria-label', `${spec.alt || 'Position–time graph with a cart on a track'}. Stage velocities: ${v.map((val) => `${formatNumber(val, 2)} metres per second`).join(', ')}.${played ? ` The cart ${crash ? 'hit the end of the track' : `finished at ${formatNumber(pos[n], 1)} metres`}.` : ''}`);
    }
  }

  function getState() {
    const { pos, crash } = trip(v);
    let firstWrong = -1;
    if (target) firstWrong = v.findIndex((val, i) => Math.abs(val - target[i]) > 1e-9);
    return {
      velocities: v.slice(),
      positions: pos.slice(),
      end: pos[n],
      distance: tidy(v.reduce((sum, val) => sum + Math.abs(val) * stageLen, 0)),
      played,
      crashed: !!crash,
      match: !!target && firstWrong === -1,
      firstWrong,
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.velocities)) return;
      anim.stop();
      v = Array.from({ length: n }, (_, i) => tidy(clamp(Number(next.velocities[i]) || 0, vMin, vMax)));
      note.textContent = '';
      if (isStatic) { render(); return; }
      finish(false);
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (readOnly && !isStatic && !played && !anim.running) finish(false);   // show the finished trip that was checked
      else render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  {
    title: 'motion-graph — match the dashed target',
    spec: { type: 'motion-graph', duration: 8, stage: 2, track: 12, target: [2, 0, 3, -4] },
  },
  {
    title: 'motion-graph — static figure with a rise-and-run triangle',
    spec: { type: 'motion-graph', static: true, duration: 6, stage: 6, track: 12, velocities: [2], triangle: { from: [1, 2], to: [4, 8] }, points: [{ t: 1, x: 2 }, { t: 4, x: 8 }] },
  },
];
