/**
 * power-cycle — powers on a clock. A marker starts at 1 on a dial with m
 * places and is multiplied by the base again and again, keeping only the
 * remainder each time. Shows that powers mod m run round a cycle, how long
 * the cycle is, and (with a product of two primes as m) a toy RSA.
 *
 * {
 *   type: 'power-cycle',
 *   m: 7,                   // number of places on the dial (the modulus), 2 to 40
 *   base: 3,                // the number that is multiplied in at each step
 *   baseRange: [2, 6],      // optional: adds a slider so the learner can change the base
 *   n: 0,                   // power shown when the figure appears
 *   max: 12,                // highest power the slider allows
 *   nLabel: 'power',        // label of the slider
 *   static: false,          // true: picture only
 * }
 *
 * State: { m, base, n, value, visited, count, period, home }
 *   value    base^n mod m: where the marker is
 *   visited  every place landed on for powers 0 … n (sorted), and `count` of them
 *   period   the smallest power k > 0 with base^k mod m = 1, or null if the marker never returns to 1
 *   home     true when n > 0 and the marker is back on 1
 *
 * setState accepts { n, base }.
 */
import { frame, sliderRow, readout, hue, s, h, clamp, mdInline, addStyles, arrowMarker } from './kit.js';
import { play } from '../core/audio.js';

addStyles('power-cycle', `
  .widget-power-cycle .pc-line { text-align: center; min-height: 2.6em; display: grid; align-content: center; gap: 2px; font-size: var(--fs-md); }
  .widget-power-cycle .pc-line small { color: var(--ink-2); font-size: var(--fs-sm); }
`);

/** base^n mod m without ever holding a big number. */
export function powMod(base, n, m) {
  let value = 1 % m;
  for (let i = 0; i < n; i++) value = (value * base) % m;
  return value;
}

/** Smallest k > 0 with base^k = 1 (mod m), or null when there is none. */
export function orderOf(base, m) {
  let value = 1 % m;
  for (let k = 1; k <= m; k++) {
    value = (value * base) % m;
    if (value === 1 % m) return k;
  }
  return null;
}

export default function create(spec, env) {
  const m = clamp(Math.round(spec.m || 7), 2, 40);
  const max = clamp(Math.round(spec.max || 12), 1, 60);
  const isStatic = !!spec.static || env.compact;
  let base = clamp(Math.round(spec.base != null ? spec.base : 3), 0, 999);
  let n = clamp(Math.round(spec.n || 0), 0, max);
  let readOnly = !!env.readOnly;

  const size = 400;
  const fr = frame({ width: size, height: size, compact: env.compact, plain: true, maxWidth: 420, label: spec.alt || `A dial with ${m} places for powers of ${base}` });
  const { svg } = fr;
  const cx0 = size / 2;
  const cy0 = size / 2;
  const R = m > 20 ? 158 : 150;
  const spot = (k, radius = R) => {
    const angle = (k / m) * Math.PI * 2 - Math.PI / 2;
    return { x: cx0 + radius * Math.cos(angle), y: cy0 + radius * Math.sin(angle) };
  };
  const dotR = m > 26 ? 10 : m > 14 ? 13 : 17;
  const arrow = arrowMarker(svg, 'violet', 6);
  const arrowNow = arrowMarker(svg, 'orange', 5);

  svg.appendChild(s('circle', { cx: cx0, cy: cy0, r: R, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2.5 }));
  const gChords = s('g');
  const gDots = s('g');
  svg.append(gChords, gDots);
  const dots = [];
  for (let k = 0; k < m; k++) {
    const p = spot(k);
    const circle = s('circle', { cx: p.x, cy: p.y, r: dotR, 'stroke-width': 2.5 });
    const text = s('text', { class: m > 14 ? 'fig-label-sm' : 'fig-label', x: p.x, y: p.y + (m > 14 ? 4 : 5), 'text-anchor': 'middle' }, String(k));
    gDots.append(circle, text);
    dots.push({ circle, text });
  }
  const centre = s('text', { class: 'fig-label-lg', x: cx0, y: cy0 + 2, 'text-anchor': 'middle' });
  const centreSub = s('text', { class: 'fig-label-sm', x: cx0, y: cy0 + 24, 'text-anchor': 'middle' });
  svg.append(centre, centreSub);

  const line = h('div.pc-line');
  fr.el.insertBefore(line, fr.readouts);
  const roValue = readout('lands on', { digits: 0, color: 'orange' });
  const roSeen = readout('places visited', { digits: 0 });
  if (!env.compact) fr.readouts.append(roValue.el, roSeen.el);

  const path = () => { // values for powers 0 … n
    const out = [1 % m];
    for (let i = 0; i < n; i++) out.push((out[i] * base) % m);
    return out;
  };

  const getState = () => {
    const seq = path();
    const visited = Array.from(new Set(seq)).sort((a, b) => a - b);
    const value = seq[seq.length - 1];
    return { m, base, n, value, visited, count: visited.length, period: orderOf(base, m), home: n > 0 && value === 1 % m };
  };

  function draw() {
    const seq = path();
    const value = seq[seq.length - 1];
    const seen = new Set(seq);
    dots.forEach(({ circle, text }, k) => {
      const here = k === value;
      circle.setAttribute('fill', here ? hue('orange') : seen.has(k) ? hue('violet', 'soft') : 'var(--surface)');
      circle.setAttribute('stroke', here ? 'var(--edge-strong)' : seen.has(k) ? hue('violet') : 'var(--edge)');
      text.setAttribute('style', here ? 'fill: var(--on-color)' : '');
    });
    gChords.replaceChildren();
    for (let i = 0; i < seq.length - 1; i++) {
      const a = spot(seq[i], R - dotR - 3);
      const b = spot(seq[i + 1], R - dotR - 5);
      if (seq[i] === seq[i + 1]) continue; // stuck on one place: nothing to draw
      const last = i === seq.length - 2;
      gChords.appendChild(s('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: hue(last ? 'orange' : 'violet'), 'stroke-width': last ? 3.5 : 2.5, 'stroke-linecap': 'round',
        opacity: last ? 1 : 0.55, 'marker-end': last ? arrowNow : arrow,
      }));
    }
    centre.textContent = n === 0 ? '1' : String(value);
    centreSub.textContent = `power ${n}`;
    const prev = n > 0 ? seq[n - 1] : null;
    const product = prev != null ? prev * base : null;
    const step = prev == null
      ? `Start on 1. Each step multiplies by ${base}.`
      : product < m
        ? `$${prev} \\times ${base} = ${product}$`
        : `$${prev} \\times ${base} = ${product} = ${Math.floor(product / m)} \\times ${m} + ${value}$`;
    line.replaceChildren(
      h('span', { html: mdInline(`$${base}^{${n}} \\bmod ${m} = ${value}$`) }),
      h('small', { html: mdInline(step) }),
    );
    roValue.set(value);
    roSeen.set(`${seen.size} of ${m}`);
    svg.setAttribute('aria-label', `Powers of ${base} on a dial with ${m} places. Power ${n} lands on ${value}. Places visited so far: ${Array.from(seen).sort((a, b) => a - b).join(', ')}.`);
  }

  let nRow = null;
  let baseRow = null;
  if (!isStatic) {
    nRow = sliderRow({
      label: spec.nLabel || 'power', min: 0, max, step: 1, value: n, color: 'orange',
      onInput: (v) => { if (readOnly) return; n = v; play('tap'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(nRow.el);
    if (Array.isArray(spec.baseRange)) {
      const [lo, hi] = spec.baseRange;
      base = clamp(base, lo, hi);
      baseRow = sliderRow({
        label: 'base', min: lo, max: hi, step: 1, value: base, color: 'violet',
        onInput: (v) => { if (readOnly) return; base = v; play('tap'); draw(); env.onChange(getState()); },
      });
      fr.controls.appendChild(baseRow.el);
    }
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.base != null) { base = baseRow ? clamp(Math.round(next.base), spec.baseRange[0], spec.baseRange[1]) : Math.round(next.base); if (baseRow) baseRow.set(base); }
      if (next.n != null) { n = clamp(Math.round(next.n), 0, max); if (nRow) nRow.set(n); }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (nRow) nRow.setDisabled(readOnly);
      if (baseRow) baseRow.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'Last digits of powers of 7', spec: { type: 'power-cycle', m: 10, base: 7, max: 12 } },
  { title: 'Choose the base on a 7-clock', spec: { type: 'power-cycle', m: 7, base: 2, baseRange: [2, 6], max: 12, n: 3 } },
  { title: 'A 33-clock (toy RSA)', spec: { type: 'power-cycle', m: 33, base: 29, max: 7, n: 7 } },
];
