/**
 * marble-bag — a bag of coloured marbles. The learner adds and removes
 * marbles and watches the chance of drawing each colour change: the chance
 * is shown as a share of a bar that runs from 0 (impossible) to 1 (certain),
 * and spelled out as a fraction, a decimal and a percentage.
 *
 * {
 *   type: 'marble-bag',
 *   marbles: { red: 3, blue: 1 },   // colour (a palette name: red blue green orange violet teal pink yellow gray) → how many
 *   edit: true,                     // true: every colour gets − / + buttons · ['blue']: only these colours · false: none
 *   max: 12,                        // most marbles of one colour
 *   focus: 'red',                   // the colour whose chance is spelled out (default: the first one)
 *   show: 'all',                    // 'all' → 3 out of 4 = 3/4 = 0.75 = 75% · 'fraction' → 3 out of 4 = 3/4 · 'none' → no bar, no numbers
 *   draw: false,                    // true: a "Draw one" button (the marble goes back each time) and a tally of draws
 *   static: false,                  // true: just the picture of the bag
 *   width: 320,                     // largest width of the picture in px
 * }
 *
 * Several bags side by side, as a picture (for "which bag would you pick?" questions):
 *
 *   { type: 'marble-bag', bags: [{ label: 'Bag A', marbles: { red: 3, blue: 1 } }, { label: 'Bag B', marbles: { red: 30, blue: 10 } }] }
 *
 * State: { counts: { red: 3, blue: 1 }, total: 4, p: { red: 0.75, blue: 0.25 }, draws: 0, drawn: { red: 0, blue: 0 } }
 *   p     — chance of each colour (all 0 while the bag is empty)
 *   drawn — how often each colour has been drawn since the contents last changed
 */
import { frame, button, readout, hue, s, h, mdInline, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('marble-bag', `
  .widget-marble-bag { justify-items: center; }
  .widget-marble-bag .w-canvas { width: 100%; }
  .widget-marble-bag .mb-steppers { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-marble-bag .mb-stepper {
    display: inline-flex; align-items: center; gap: var(--s2);
    padding: 3px 3px 3px 0.75rem;
    border: var(--bw) solid var(--hair);
    border-radius: 999px;
    background: var(--surface);
    font-weight: 700;
  }
  .widget-marble-bag .mb-swatch { flex: none; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--edge-strong); background: var(--accent); }
  .widget-marble-bag .mb-name { min-width: 3.2em; }
  .widget-marble-bag .mb-count { min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-size: var(--fs-lg); font-variant-numeric: tabular-nums; }
  .widget-marble-bag .mb-btn { width: 40px; min-height: 40px; padding: 0; border-radius: 50%; }
  .widget-marble-bag .mb-prob { width: 100%; max-width: 440px; display: grid; gap: 2px; }
  .widget-marble-bag .mb-bar { display: flex; height: 24px; border: var(--bw) solid var(--edge); border-radius: 999px; overflow: hidden; background: var(--sunken); }
  .widget-marble-bag .mb-bar i { display: block; min-width: 0; transition: flex-grow 0.25s var(--ease-out); }
  .widget-marble-bag .mb-scale { display: grid; grid-template-columns: 1fr auto 1fr; align-items: baseline; font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); line-height: 1.5; }
  .widget-marble-bag .mb-scale b { color: var(--ink-2); font-family: var(--font-mono); font-size: var(--fs-sm); }
  .widget-marble-bag .mb-scale span:nth-child(2) { text-align: center; }
  .widget-marble-bag .mb-scale span:nth-child(3) { text-align: right; }
  .widget-marble-bag .mb-readout { margin-top: var(--s2); text-align: center; font-size: var(--fs-lg); font-weight: 600; line-height: 1.45; min-height: 2.9em; }
  .widget-marble-bag .mb-readout .katex { font-size: 1.2em; }
  .widget-marble-bag.is-readonly .mb-btn { pointer-events: none; opacity: 0.45; }
`);

/* Geometry of one bag, in SVG units: 264 wide, centred on x = 160, 270 tall. */
const CX = 160;
const BOTTOM = 258;
const SIDE = [[126, 44], [120, 84], [28, 92], [28, 170]]; // cubic from the neck down the left side
const SIDE_TABLE = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40;
  const u = 1 - t;
  const at = (k) => u * u * u * SIDE[0][k] + 3 * u * u * t * SIDE[1][k] + 3 * u * t * t * SIDE[2][k] + t * t * t * SIDE[3][k];
  return [at(1), CX - at(0)]; // [y, half-width]
});

/** Half-width of the inside of the bag at height y. */
function halfWidth(y) {
  if (y >= 212) return 86 + Math.sqrt(Math.max(0, 46 * 46 - (y - 212) * (y - 212)));
  if (y >= 170) return 132;
  for (let i = 1; i < SIDE_TABLE.length; i++) {
    const [y1, w1] = SIDE_TABLE[i];
    if (y <= y1) {
      const [y0, w0] = SIDE_TABLE[i - 1];
      return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0 || 1);
    }
  }
  return 132;
}

/** Positions for n marbles piled up from the bottom of the bag: { r, pts: [{ x, y }] }. */
function pile(n) {
  const sizes = [21, 18, 16, 14, 12.5, 11, 10, 9, 8, 7, 6, 5, 4];
  for (const r of sizes) {
    const pitch = 2 * r + 2;
    const rows = [];
    let room = 0;
    for (let j = 0, y = BOTTOM - 6 - r; y - r > 70 && room < n; j++, y -= pitch * 0.866) {
      const half = Math.min(halfWidth(y - r * 0.75), halfWidth(y + r * 0.75)) - r - 5;
      const xs = [];
      for (let k = -30; k <= 30; k++) {
        const x = (k + (j % 2 ? 0.5 : 0)) * pitch;
        if (Math.abs(x) <= half) xs.push(x);
      }
      rows.push({ y, xs });
      room += xs.length;
    }
    if (room < n && r !== sizes[sizes.length - 1]) continue;
    const pts = [];
    for (const row of rows) {
      const need = Math.min(row.xs.length, n - pts.length);
      if (need <= 0) break;
      // a part-filled top row is centred instead of following the lattice
      const xs = need === row.xs.length ? row.xs : Array.from({ length: need }, (_, i) => (i - (need - 1) / 2) * pitch);
      for (const x of xs) pts.push({ x: CX + x, y: row.y });
    }
    return { r, pts };
  }
  return { r: 4, pts: [] };
}

/** The empty cloth bag. */
function sack() {
  const cloth = { fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' };
  return s('g',
    s('path', { d: 'M126 44 C112 24 124 10 138 22 C144 8 176 8 182 22 C196 10 208 24 194 44 Z', ...cloth }),
    s('path', { d: 'M126 44 C120 84 28 92 28 170 L28 212 A46 46 0 0 0 74 258 L246 258 A46 46 0 0 0 292 212 L292 170 C292 92 200 84 194 44 Z', ...cloth }),
    s('rect', { x: 119, y: 38, width: 82, height: 13, rx: 6.5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 3 }));
}

/** One marble; big enough marbles carry the first letter of their colour, so colour is never the only cue. */
function marble(x, y, r, color) {
  const g = s('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` },
    s('circle', { r, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': r >= 9 ? 2.5 : 1.5 }));
  if (r >= 14) {
    g.appendChild(s('text', { y: r * 0.35, 'text-anchor': 'middle', style: `font: 800 ${Math.round(Math.min(r, 24))}px var(--font-body); fill: #1D1B26` }, color[0].toUpperCase()));
  }
  return g;
}

/** Fill a <g> with a pile of marbles, one per entry of `seq` (colour names). */
function drawPile(g, seq) {
  while (g.firstChild) g.removeChild(g.firstChild);
  const { r, pts } = pile(seq.length);
  pts.forEach((p, i) => g.appendChild(marble(p.x, p.y, r, seq[i])));
}

const sequence = (marbles, rng) => {
  const seq = [];
  for (const c of Object.keys(marbles)) for (let i = 0; i < Math.max(0, Math.round(marbles[c]) || 0); i++) seq.push(c);
  return rng.shuffle(seq);
};
const listing = (marbles) => Object.keys(marbles).map((c) => `${marbles[c]} ${c}`).join(', ');
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };

/** Static picture of several bags side by side. */
function picture(spec, env) {
  const bags = spec.bags;
  const step = 300;
  const fr = frame({ width: step * bags.length, height: 300, plain: true, compact: env.compact,
    label: spec.alt || bags.map((b, i) => `${b.label || `Bag ${i + 1}`}: ${listing(b.marbles)}`).join('. ') });
  fr.canvas.style.maxWidth = `${spec.width || step * bags.length}px`;
  bags.forEach((bag, i) => {
    const g = s('g', { transform: `translate(${i * step - 10} 0)` }, sack());
    const marbles = s('g');
    drawPile(marbles, sequence(bag.marbles, env.rng));
    g.appendChild(marbles);
    if (bag.label) g.appendChild(s('text.fig-label', { x: CX, y: 288, 'text-anchor': 'middle' }, bag.label));
    fr.svg.appendChild(g);
  });
  return { el: fr.el };
}

export default function create(spec, env) {
  if (Array.isArray(spec.bags) && spec.bags.length) return picture(spec, env);

  const start = spec.marbles || { red: 3, blue: 1 };
  const colors = Object.keys(start);
  const interactive = !spec.static && !env.compact;
  const editable = !interactive || spec.edit === false ? [] : Array.isArray(spec.edit) ? spec.edit.filter((c) => colors.includes(c)) : colors;
  const max = spec.max || 12;
  const focus = colors.includes(spec.focus) ? spec.focus : colors[0];
  const show = spec.show || (interactive ? 'all' : 'none');
  const canDraw = !!spec.draw && interactive;
  let readOnly = !!env.readOnly;

  const counts = {};
  const drawn = {};
  let draws = 0;
  let lastDrawn = null;
  let seq = []; // the marbles in the order they are piled up

  function fill(from) {
    for (const c of colors) counts[c] = Math.max(0, Math.round(Number(from && from[c] != null ? from[c] : counts[c]) || 0));
    seq = sequence(counts, env.rng);
  }
  function resetTally() {
    draws = 0;
    lastDrawn = null;
    for (const c of colors) drawn[c] = 0;
  }
  fill(start);
  resetTally();

  /* ------------------------------------------------------------ picture */
  const W = canDraw ? 470 : 320;
  const fr = frame({ width: W, height: 270, plain: true, compact: env.compact, label: spec.alt || 'A bag of marbles' });
  const { svg } = fr;
  fr.canvas.style.maxWidth = `${spec.width || W}px`;
  const gMarbles = s('g');
  const gDrawn = s('g');
  svg.append(sack(), gMarbles, gDrawn);

  function drawHand() {
    if (!canDraw) return;
    while (gDrawn.firstChild) gDrawn.removeChild(gDrawn.firstChild);
    gDrawn.appendChild(s('text.fig-label-sm', { x: 396, y: 92, 'text-anchor': 'middle', style: 'fill: var(--ink-3)' }, lastDrawn ? 'you drew' : 'your draw'));
    if (lastDrawn) {
      gDrawn.appendChild(marble(396, 140, 30, lastDrawn));
      gDrawn.appendChild(s('text.fig-label', { x: 396, y: 198, 'text-anchor': 'middle', style: `fill: ${hue(lastDrawn, 'text')}` }, lastDrawn));
    } else {
      gDrawn.appendChild(s('circle', { cx: 396, cy: 140, r: 30, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '5 6' }));
      gDrawn.appendChild(s('text.fig-label-lg', { x: 396, y: 147, 'text-anchor': 'middle', style: 'fill: var(--ink-3)' }, '?'));
    }
  }

  /* ----------------------------------------------------------- controls */
  const steppers = new Map();
  if (editable.length) {
    const row = h('div.mb-steppers');
    for (const c of editable) {
      const minus = button('', () => change(c, -1), { icon: 'minus' });
      const plus = button('', () => change(c, 1), { icon: 'plus' });
      minus.classList.add('mb-btn');
      plus.classList.add('mb-btn');
      minus.setAttribute('aria-label', `Take out a ${c} marble`);
      plus.setAttribute('aria-label', `Add a ${c} marble`);
      const out = h('output.mb-count', { 'aria-label': `${c} marbles` });
      steppers.set(c, { minus, plus, out });
      row.appendChild(h('div', { class: `mb-stepper hue-${c}` }, h('i.mb-swatch'), h('span.mb-name', c), minus, out, plus));
    }
    fr.controls.appendChild(row);
  }

  const bar = h('div.mb-bar', { 'aria-hidden': 'true' });
  const segs = [];
  for (const c of [focus, ...colors.filter((k) => k !== focus)]) {
    const seg = h('i', { style: { background: hue(c) } });
    segs.push([c, seg]);
    bar.appendChild(seg);
  }
  const line = h('div.mb-readout', { 'aria-live': 'polite' });
  if (show !== 'none') {
    fr.el.insertBefore(h('div.mb-prob', bar,
      h('div.mb-scale', { 'aria-hidden': 'true' },
        h('span', h('b', '0'), ' impossible'), h('span', h('b', '1/2')), h('span', 'certain ', h('b', '1'))),
      line), fr.readouts);
  }

  const tally = new Map();
  if (canDraw) {
    const all = readout('draws', { digits: 0 });
    tally.set('*', all);
    fr.readouts.appendChild(all.el);
    for (const c of colors) {
      const ro = readout(c, { digits: 0, color: c });
      tally.set(c, ro);
      fr.readouts.appendChild(ro.el);
    }
    fr.buttons.appendChild(button('Draw one', () => drawOne(), { icon: 'hand', variant: 'primary' }));
    fr.el.appendChild(h('p.w-hint', 'Each marble goes back into the bag after you have looked at it.'));
  }

  /* -------------------------------------------------------------- model */
  const total = () => seq.length;

  /** The chance of the focus colour: [in words, as numbers]. */
  function describe() {
    const n = counts[focus];
    const t = total();
    if (!t) return ['The bag is empty.', ''];
    const words = `Chance of **${focus}**: ${n} out of ${t}`;
    if (n === 0) return [words, '$= 0$ (impossible)'];
    if (n === t) return [words, '$= 1$ (certain)'];
    const g = gcd(n, t);
    const fraction = g > 1 ? `= \\frac{${n}}{${t}} = \\frac{${n / g}}{${t / g}}` : `= \\frac{${n}}{${t}}`;
    if (show !== 'all') return [words, `$${fraction}$`];
    const p = n / t;
    const eq = Math.abs(p * 1000 - Math.round(p * 1000)) < 1e-9 ? '=' : '\\approx';
    return [words, `$${fraction} ${eq} ${formatNumber(p, 3)} ${eq} ${formatNumber(p * 100, 1)}\\%$`];
  }

  function update() {
    drawPile(gMarbles, seq);
    svg.setAttribute('aria-label', total() ? `A bag of marbles: ${listing(counts)}.` : 'An empty bag.');
    drawHand();
    for (const [c, st] of steppers) {
      st.out.textContent = String(counts[c]);
      st.minus.disabled = readOnly || counts[c] <= 0;
      st.plus.disabled = readOnly || counts[c] >= max;
    }
    let first = true;
    for (const [c, seg] of segs) {
      seg.style.flexGrow = String(counts[c]);
      seg.style.boxShadow = counts[c] && !first ? 'inset 2px 0 0 var(--edge-strong)' : 'none';
      if (counts[c]) first = false;
    }
    const [words, numbers] = describe();
    line.replaceChildren(h('div', { html: mdInline(words) }), h('div', { html: mdInline(numbers) }));
    if (canDraw) {
      tally.get('*').set(draws);
      for (const c of colors) tally.get(c).set(drawn[c]);
    }
  }

  function change(c, delta) {
    if (readOnly) return;
    const next = counts[c] + delta;
    if (next < 0 || next > max) return;
    counts[c] = next;
    if (delta > 0) seq.push(c);
    else seq.splice(seq.lastIndexOf(c), 1);
    resetTally();
    play(delta > 0 ? 'drop' : 'pop');
    update();
    env.onChange(getState());
  }

  function drawOne() {
    if (readOnly || !total()) return;
    lastDrawn = seq[env.rng.int(0, seq.length - 1)];
    drawn[lastDrawn] += 1;
    draws += 1;
    play('tap');
    update();
    env.announce(`You drew ${lastDrawn}.`);
    env.onChange(getState());
  }

  function getState() {
    const p = {};
    for (const c of colors) p[c] = total() ? counts[c] / total() : 0;
    return { counts: { ...counts }, total: total(), p, draws, drawn: { ...drawn } };
  }

  update();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || typeof next.counts !== 'object') return;
      fill(next.counts);
      resetTally();
      update();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); update(); },
  };
}

export const examples = [
  { title: 'marble-bag — change the contents, watch the chance', spec: { type: 'marble-bag', marbles: { red: 3, blue: 1 } } },
  { title: 'marble-bag — three colours, with draws', spec: { type: 'marble-bag', marbles: { green: 2, orange: 5, violet: 4 }, focus: 'orange', draw: true, show: 'fraction' } },
  { title: 'marble-bag — two bags side by side (picture)', spec: { type: 'marble-bag', bags: [{ label: 'Bag A', marbles: { red: 3, blue: 1 } }, { label: 'Bag B', marbles: { red: 30, blue: 10 } }] } },
];
