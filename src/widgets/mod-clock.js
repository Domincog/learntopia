/**
 * mod-clock — arithmetic on a clock with m positions. A hand starts somewhere
 * and takes n hops; however far it travels, it can only ever land on one of
 * the m positions. Counting on by 1 shows remainders ("17 hours after 9
 * o'clock"); longer hops show multiplication and which positions a hop size
 * can reach.
 *
 * {
 *   type: 'mod-clock',
 *   m: 12,                         // number of positions
 *   labels: ['12', '1', '2', …],   // optional names for the positions (default 0 … m − 1)
 *   start: 9,                      // position the hand starts from (default 0)
 *   hop: 1,                        // size of one hop (default 1)
 *   hopRange: [1, 11],             // optional: adds a slider so the learner can change the hop size
 *   n: 0,                          // hops made when the figure appears
 *   max: 36,                       // most hops the slider allows
 *   nLabel: 'hours later',         // label of the slider (default 'steps', or 'hops' when hop > 1)
 *   equation: 'steps',             // line under the dial:
 *                                  //   'steps' — splits the count:  17 = 1 × 12 + 5  (one full turn, then 5 more)
 *                                  //   'total' — splits the total:  9 + 17 = 26 = 2 × 12 + 2
 *                                  //   false   — no line
 *   reached: true,                 // show the "positions reached" count (default: only when hopRange is given)
 *   static: false,                 // true: picture only (for figures)
 *   maxWidth: 420,                 // optional width limit in px
 * }
 *
 * With hop 1 the hand leaves a spiral trail: one loop per full turn. With a
 * longer hop each hop is drawn as a chord and the positions reached are tinted.
 *
 * State: { m, start, hop, n, total, position, label, laps, visited, count }
 *   total    — start + hop × n (how far round the hand has gone, counted from position 0)
 *   position — total mod m: where the hand points;  label — the name of that position
 *   laps     — full turns made since the start: floor(hop × n / m)
 *   visited  — every position landed on so far, including the start (sorted);  count — how many
 *
 * setState accepts { n, hop }.
 */
import { frame, sliderRow, button, readout, hue, s, h, clamp, mdInline, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

const W = 400;
const H = 400;
const CX = 200;
const CY = 200;
const RING = 152; // radius of the circle of positions

addStyles('mod-clock', `
  /* nothing in the picture is dragged, so a finger that lands on it may still scroll the page */
  .widget-mod-clock .w-canvas svg { touch-action: manipulation; }
  .widget-mod-clock .mc-line {
    display: grid; justify-items: center; align-content: center; gap: 2px;
    min-height: 4.3em;
    padding: var(--s2) var(--s3);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    line-height: 1.35;
  }
  .widget-mod-clock .mc-eq { font-size: 1.1rem; white-space: nowrap; }
  .widget-mod-clock .mc-step { min-width: 68px; min-height: 42px; font-variant-numeric: tabular-nums; }
`);

const mod = (v, m) => ((v % m) + m) % m;

export default function create(spec, env) {
  const m = clamp(Math.round(spec.m || 12), 2, 36);
  const labels = Array.from({ length: m }, (_, i) => (Array.isArray(spec.labels) && spec.labels[i] != null ? String(spec.labels[i]) : String(i)));
  const start = mod(Math.round(spec.start || 0), m);
  const range = Array.isArray(spec.hopRange) ? [Math.max(1, Math.round(spec.hopRange[0])), Math.max(1, Math.round(spec.hopRange[1]))].sort((p, q) => p - q) : null;
  let hop = Math.max(1, Math.round(spec.hop || (range ? range[0] : 1)));
  const max = Math.max(1, Math.round(spec.max || 3 * m));
  let n = clamp(Math.round(spec.n || 0), 0, max);
  const interactive = !env.compact && !spec.static;
  const eqMode = spec.equation === false ? null : (spec.equation === 'total' || spec.equation === 'steps' ? spec.equation : (Array.isArray(spec.labels) ? 'steps' : 'total'));
  const chords = hop > 1 || !!range;   // long hops are drawn as chords; single steps leave a spiral
  let readOnly = !!env.readOnly;
  let shown = n;                        // hops the picture currently shows (glides towards n)
  let raf = 0;

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: spec.maxWidth || 420, label: spec.alt || `A clock with ${m} positions` });
  const { svg } = fr;

  /* ------------------------------------------------------------ drawing */
  const spacing = (2 * Math.PI * RING) / m;
  const rDot = clamp(spacing * 0.38, 11, 27);
  const angle = (v) => (v / m) * 2 * Math.PI - Math.PI / 2;
  const at = (v, r) => [CX + r * Math.cos(angle(v)), CY + r * Math.sin(angle(v))];
  const small = labels.some((t) => t.length > 2) || rDot < 18;

  svg.appendChild(s('circle', { cx: CX, cy: CY, r: RING, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 3 }));
  const trail = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85 });
  const gChords = s('g');
  const hand = s('line', { x1: CX, y1: CY, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' });
  const tip = s('circle', { r: 6, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
  const gDots = s('g');
  svg.append(trail, gChords, hand, s('circle', { cx: CX, cy: CY, r: 9, fill: 'var(--ink)' }), tip, gDots);

  const dots = labels.map((text, i) => {
    const [x, y] = at(i, RING);
    const ring = s('circle', { cx: x, cy: y, r: rDot, 'stroke-width': 2.5 });
    const label = s('text', { class: small ? 'fig-label-sm' : 'fig-label', x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text);
    gDots.append(ring, label);
    return { ring, label };
  });

  const R_IN = 30;
  const R_OUT = RING - rDot - 14;
  const farthest = Math.max(m, max * (range ? range[1] : hop));
  const trailRadius = (travelled) => R_IN + (R_OUT - R_IN) * Math.min(1, travelled / farthest);

  function draw() {
    const travelled = hop * shown;
    const total = start + travelled;
    const whole = Math.floor(shown + 1e-6);
    const current = mod(start + hop * Math.round(shown), m);
    const reached = new Set();
    for (let j = 0; j <= whole; j++) reached.add(mod(start + hop * j, m));

    const [hx, hy] = at(total, RING - rDot - 7);
    hand.setAttribute('x2', hx.toFixed(2));
    hand.setAttribute('y2', hy.toFixed(2));

    if (chords) {
      trail.setAttribute('d', '');
      tip.setAttribute('visibility', 'hidden');
      gChords.replaceChildren();
      for (let j = 1; j <= whole; j++) {
        const [x1, y1] = at(start + hop * (j - 1), RING - rDot);
        const [x2, y2] = at(start + hop * j, RING - rDot);
        gChords.appendChild(s('line', { x1, y1, x2, y2, stroke: hue('blue'), 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }));
      }
    } else {
      // the path travelled, wound up: one loop for every full turn
      let d = '';
      const pieces = Math.max(1, Math.ceil(travelled * (48 / m)));
      for (let i = 0; i <= pieces; i++) {
        const u = (travelled * i) / pieces;
        const [x, y] = at(start + u, trailRadius(u));
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      trail.setAttribute('d', travelled > 0 ? d : '');
      const [tx, ty] = at(total, trailRadius(travelled));
      tip.setAttribute('cx', tx.toFixed(2));
      tip.setAttribute('cy', ty.toFixed(2));
      tip.setAttribute('visibility', travelled > 0 ? 'visible' : 'hidden');
    }

    dots.forEach(({ ring, label }, i) => {
      const here = i === current;
      const seen = chords && reached.has(i);
      ring.setAttribute('fill', here ? hue('orange') : seen ? hue('blue', 'soft') : 'var(--surface)');
      ring.setAttribute('stroke', here ? 'var(--edge-strong)' : seen ? hue('blue') : 'var(--edge)');
      ring.setAttribute('stroke-width', here ? 3.5 : seen ? 3 : 2.5);
      ring.setAttribute('r', here ? rDot + 2 : rDot);
      label.setAttribute('style', here ? 'stroke:none;fill:#1D1B26' : 'stroke:none');
    });
  }

  function glide(instant) {
    cancelAnimationFrame(raf);
    if (instant || reducedMotion() || Math.abs(n - shown) < 0.01) { shown = n; draw(); return; }
    const from = shown;
    const span = n - from;
    const duration = Math.min(900, 140 + 90 * Math.abs(span) * Math.min(hop, 3));
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / duration);
      shown = from + span * (1 - Math.pow(1 - u, 2));
      if (u >= 1) shown = n;
      draw();
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------- controls */
  const line = h('div.mc-line', { 'aria-live': 'polite' });
  const roSeen = readout('positions reached', { digits: 0, color: 'blue' });
  let nSlider = null;
  let hopSlider = null;

  const facts = () => {
    const total = start + hop * n;
    const visited = new Set();
    for (let j = 0; j <= n; j++) visited.add(mod(start + hop * j, m));
    return { total, position: mod(total, m), laps: Math.floor((hop * n) / m), visited: Array.from(visited).sort((p, q) => p - q) };
  };

  function describe() {
    const { total, position, visited } = facts();
    const name = labels[position];
    const travelled = hop * n;
    let eq;
    let words;
    if (eqMode === 'steps') {
      const turns = Math.floor(travelled / m);
      const rest = travelled % m;
      eq = hop === 1 ? `${n} = ${turns} \\times ${m} + ${rest}` : `${n} \\times ${hop} = ${travelled} = ${turns} \\times ${m} + ${rest}`;
      const turnWords = turns === 0 ? 'No full turn' : turns === 1 ? '1 full turn' : `${turns} full turns`;
      words = `${turnWords}, then ${rest} more: lands on **${name}**`;
    } else {
      const sum = `${start ? `${start} + ` : ''}${hop === 1 ? n : `${n} \\times ${hop}`}`;
      const q = Math.floor(total / m);
      eq = `${sum === String(total) ? '' : `${sum} = `}${total} = ${q} \\times ${m} + ${position}`;
      words = `Lands on **${name}**`;
    }
    if (n === 0) line.replaceChildren(h('div', { html: mdInline(`The hand starts on **${name}**.`) }));
    else line.replaceChildren(h('div.mc-eq', { html: mdInline(`$${eq}$`) }), h('div', { html: mdInline(words) }));
    roSeen.set(`${visited.length} of ${m}`);
    svg.setAttribute('aria-label', `A clock with ${m} positions. The hand started at ${labels[start]}, made ${n} ${hop === 1 ? 'steps' : `hops of ${hop}`} and points at ${name}.`);
  }

  function update(notify, instant) {
    if (nSlider && nSlider.value !== n) nSlider.set(n);
    if (hopSlider && hopSlider.value !== hop) hopSlider.set(hop);
    describe();
    glide(instant);
    if (notify) env.onChange(getState());
  }

  function setN(v, notify) {
    const next = clamp(Math.round(v), 0, max);
    if (next === n) { if (nSlider && nSlider.value !== n) nSlider.set(n); return; }
    n = next;
    if (notify) play('tick');
    update(notify, false);
  }

  function setHop(v, notify) {
    const next = range ? clamp(Math.round(v), range[0], range[1]) : Math.max(1, Math.round(v));
    if (next === hop) return;
    hop = next;
    shown = n;
    if (notify) play('tap');
    update(notify, true);
  }

  if (eqMode && !env.compact) fr.el.insertBefore(line, fr.readouts);
  if ((spec.reached != null ? spec.reached : !!range) && !env.compact) fr.readouts.appendChild(roSeen.el);
  if (interactive) {
    if (range && range[1] > range[0]) {
      hopSlider = sliderRow({
        label: 'hop size', min: range[0], max: range[1], step: 1, value: hop, color: 'orange',
        onInput: (v) => { if (readOnly) { hopSlider.set(hop); return; } setHop(v, true); },
      });
      fr.controls.appendChild(hopSlider.el);
    }
    nSlider = sliderRow({
      label: spec.nLabel || (chords ? 'hops' : 'steps'), min: 0, max, step: 1, value: n, color: 'blue',
      onInput: (v) => { if (readOnly) { nSlider.set(n); return; } setN(v, true); },
    });
    fr.controls.appendChild(nSlider.el);
    const less = button('− 1', () => { if (!readOnly) setN(n - 1, true); });
    const more = button('+ 1', () => { if (!readOnly) setN(n + 1, true); });
    less.classList.add('mc-step');
    more.classList.add('mc-step');
    less.setAttribute('aria-label', 'One fewer');
    more.setAttribute('aria-label', 'One more');
    fr.buttons.append(less, more);
  }

  function getState() {
    const { total, position, laps, visited } = facts();
    return { m, start, hop, n, total, position, label: labels[position], laps, visited, count: visited.length };
  }

  describe();
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.hop != null) hop = range ? clamp(Math.round(next.hop), range[0], range[1]) : Math.max(1, Math.round(next.hop));
      if (next.n != null) n = clamp(Math.round(next.n), 0, max);
      shown = n;
      update(false, true);
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (nSlider) nSlider.setDisabled(readOnly);
      if (hopSlider) hopSlider.setDisabled(readOnly);
      for (const btn of fr.buttons.querySelectorAll('button')) btn.disabled = readOnly;
    },
    destroy() { cancelAnimationFrame(raf); },
  };
}

export const examples = [
  { title: 'mod-clock — hours on a 12-hour clock', spec: { type: 'mod-clock', m: 12, labels: ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], start: 9, n: 17, max: 48, nLabel: 'hours later' } },
  { title: 'mod-clock — which positions can a hop of 4 reach?', spec: { type: 'mod-clock', m: 12, hop: 4, hopRange: [1, 11], n: 12, max: 12, equation: false } },
];
