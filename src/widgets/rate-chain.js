/**
 * rate-chain — three linked quantities on three tracks: x drives u, and u
 * drives y. Each link is labelled with its rate right now ("u moves 3 times
 * as fast as x"), and the readouts give the two link rates and the rate of
 * the whole chain. Move x and compare the three numbers: the rate of the
 * chain is always the product of the rates of its links. That is the chain
 * rule, before any formula.
 *
 * {
 *   type: 'rate-chain',
 *   inner: '3*x',                  // the middle quantity, as an expression in x (and k, when there is a k slider)
 *   outer: 'u^2',                  // the last quantity, as an expression in u
 *   x: [0, 4], u: [0, 12], y: [0, 144],   // what each track runs from and to
 *   start: 1, snap: 0.5,           // where x starts, and the step it moves in
 *   names: ['time', 'side', 'area'],      // names of the three quantities
 *   symbols: ['t', 's', 'A'],             // their letters
 *   units: ['s', 'cm', 'cm²'],            // their units ('' for none)
 *   rates: ['cm of side per second', 'cm² of area per cm of side', 'cm² of area per second'],
 *                                  // readout labels for the two links and the whole chain
 *                                  // (default: "s per t", "A per s", "A per t")
 *   show: ['inner', 'outer', 'total'],    // which rates get a readout; a rate that is left out reads "?"
 *   k: { min: 1, max: 4, step: 1, value: 3, label: 'gear' },   // optional slider; `inner` and `outer` may use k
 *   digits: 2,                     // decimals in the values and rates
 *   static: false,                 // true: a picture, nothing to move
 * }
 *
 * State: { x, u, y, inner, outer, total, k, visited }
 *   x, u, y   where the three markers are
 *   inner     the rate of u with respect to x, here   (du/dx)
 *   outer     the rate of y with respect to u, here   (dy/du)
 *   total     the rate of y with respect to x, here   (dy/dx), measured on the whole chain
 *   k         the slider value (only with a k slider)
 *   visited   every x tried so far (sorted)
 *
 * setState accepts { x, k }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, snapTo, tidy, formatNumber, ticks, niceStep, arrowMarker } from './kit.js';
import { compile } from '../core/mathexpr.js';

const W = 560;
const H = 304;
const X0 = 214;
const X1 = 508;
const ROWS = [50, 152, 254];
const COLORS = ['orange', 'blue', 'green'];

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const digits = spec.digits != null ? spec.digits : 2;
  const kDef = spec.k && typeof spec.k === 'object' ? spec.k : null;
  const vars = kDef ? ['k'] : [];
  const fInner = compile(String(spec.inner || '2*x'), { vars: ['x', ...vars] });
  const fOuter = compile(String(spec.outer || '3*u'), { vars: ['u', ...vars] });
  const ranges = [spec.x || [0, 4], spec.u || [0, 12], spec.y || [0, 36]];
  const names = spec.names || ['x', 'u', 'y'];
  const symbols = spec.symbols || ['x', 'u', 'y'];
  const units = spec.units || ['', '', ''];
  const show = Array.isArray(spec.show) ? spec.show : ['inner', 'outer', 'total'];
  const snap = spec.snap > 0 ? Number(spec.snap) : (ranges[0][1] - ranges[0][0]) / 40;
  let readOnly = !!env.readOnly;
  let k = kDef ? (kDef.value != null ? kDef.value : kDef.min) : 0;
  const fit = (v) => tidy(clamp(snapTo(v, snap), ranges[0][0], ranges[0][1]));
  let x = fit(spec.start != null ? Number(spec.start) : ranges[0][0]);
  const visited = new Set([x]);

  const g = (v) => { try { return fInner({ x: v, k }); } catch { return NaN; } };
  const f = (v) => { try { return fOuter({ u: v, k }); } catch { return NaN; } };
  /** Slope of fn at v, by a central difference that is far finer than anything shown. */
  const rate = (fn, v, span) => { const hh = Math.max(Math.abs(span), 1) * 1e-5; return (fn(v + hh) - fn(v - hh)) / (2 * hh); };
  const model = () => {
    const u = g(x);
    return {
      u, y: f(u),
      inner: rate(g, x, ranges[0][1] - ranges[0][0]),
      outer: rate(f, u, ranges[1][1] - ranges[1][0]),
      total: rate((v) => f(g(v)), x, ranges[0][1] - ranges[0][0]),
    };
  };
  const getState = () => {
    const m = model();
    const out = { x, u: tidy(m.u, 4), y: tidy(m.y, 4), inner: tidy(m.inner, 4), outer: tidy(m.outer, 4), total: tidy(m.total, 4), visited: Array.from(visited).sort((a, b) => a - b) };
    if (kDef) out.k = k;
    return out;
  };

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Three linked quantities, each on its own track' });
  const { svg } = fr;
  const arrow = arrowMarker(svg, 'ink-2', 6);
  const px = (i, v) => X0 + clamp((v - ranges[i][0]) / (ranges[i][1] - ranges[i][0]), 0, 1) * (X1 - X0);
  const valueTexts = [];
  const dots = [];
  ROWS.forEach((y, i) => {
    const [lo, hi] = ranges[i];
    svg.appendChild(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: 'var(--hair)', 'stroke-width': 7, 'stroke-linecap': 'round' }));
    for (const v of ticks(lo, hi, niceStep(hi - lo, 8))) {
      svg.appendChild(s('line', { x1: px(i, v), x2: px(i, v), y1: y - 6, y2: y + 6, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    }
    svg.appendChild(s('text.tick-label', { x: X0 - 10, y: y + 4, 'text-anchor': 'end' }, formatNumber(lo, 2)));
    svg.appendChild(s('text.tick-label', { x: X1 + 10, y: y + 4, 'text-anchor': 'start' }, formatNumber(hi, 2)));
    svg.appendChild(s('text', { class: `fig-label text-${COLORS[i]}`, x: 12, y: y - 9 }, names[i]));
    const value = s('text.fig-label', { x: 12, y: y + 14 });
    svg.appendChild(value);
    valueTexts.push(value);
  });
  const links = [0, 1].map((i) => {
    const line = s('line', { stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linecap': 'round', 'marker-end': arrow });
    const pill = s('rect', { width: 72, height: 30, rx: 15, fill: 'var(--surface)', stroke: hue(COLORS[i + 1]), 'stroke-width': 2.5 });
    const text = s('text', { class: `fig-label text-${COLORS[i + 1]}`, 'text-anchor': 'middle' });
    svg.append(line, pill, text);
    return { line, pill, text };
  });
  for (const i of [1, 2]) {
    const dot = s('circle', { r: 9, fill: hue(COLORS[i]), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
    svg.appendChild(dot);
    dots[i] = dot;
  }
  const topDot = isStatic ? s('circle', { r: 9, fill: hue(COLORS[0]), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }) : null;
  if (topDot) svg.appendChild(topDot);

  /* ------------------------------------------------------------- controls */
  const defaults = [`${symbols[1]} per ${symbols[0]}`, `${symbols[2]} per ${symbols[1]}`, `${symbols[2]} per ${symbols[0]}`];
  const rateLabels = defaults.map((d, i) => (spec.rates && spec.rates[i]) || d);
  const outs = env.compact ? [] : ['inner', 'outer', 'total'].map((key, i) => {
    const ro = readout(rateLabels[i], { digits, color: ['blue', 'green', 'violet'][i] });
    fr.readouts.appendChild(ro.el);
    return { key, ro };
  });

  let hd = null;
  let kRow = null;
  const moveTo = (v) => {
    if (readOnly) return;
    const next = fit(v);
    if (next === x) return;
    x = next;
    visited.add(x);
    render();
    env.onChange(getState());
  };
  if (!isStatic) {
    hd = handle(svg, {
      color: COLORS[0], label: names[0], keyStep: Math.max(4, (snap / (ranges[0][1] - ranges[0][0])) * (X1 - X0)),
      onMove: (hx) => moveTo(ranges[0][0] + ((hx - X0) / (X1 - X0)) * (ranges[0][1] - ranges[0][0])),
    });
    svg.appendChild(hd.el);
    if (kDef) {
      kRow = sliderRow({
        label: kDef.label || '$k$', min: kDef.min, max: kDef.max, step: kDef.step || 1, value: k, color: kDef.color || 'blue',
        onInput: (v) => { if (readOnly) return; k = v; render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(kRow.el);
    }
  }

  const withUnit = (v, unit) => `${formatNumber(v, digits)}${unit ? ` ${unit}` : ''}`;

  function render() {
    const m = model();
    const values = [x, m.u, m.y];
    const xs = values.map((v, i) => px(i, v));
    values.forEach((v, i) => { valueTexts[i].textContent = `${symbols[i]} = ${withUnit(v, units[i])}`; });
    if (hd) { hd.set(xs[0], ROWS[0]); hd.setLabel(`${names[0]} ${formatNumber(x, digits)}`); }
    if (topDot) { topDot.setAttribute('cx', xs[0]); topDot.setAttribute('cy', ROWS[0]); }
    for (const i of [1, 2]) { dots[i].setAttribute('cx', xs[i]); dots[i].setAttribute('cy', ROWS[i]); }
    links.forEach((link, i) => {
      const ya = ROWS[i] + 15;
      const yb = ROWS[i + 1] - 17;
      link.line.setAttribute('x1', xs[i]); link.line.setAttribute('y1', ya);
      link.line.setAttribute('x2', xs[i + 1]); link.line.setAttribute('y2', yb);
      const mx = clamp((xs[i] + xs[i + 1]) / 2, X0 + 30, X1 - 30);
      const my = (ROWS[i] + ROWS[i + 1]) / 2;
      const known = show.includes(i === 0 ? 'inner' : 'outer');
      const label = known ? `×${formatNumber(tidy(i === 0 ? m.inner : m.outer, 4), digits)}` : '× ?';
      const w = Math.max(64, label.length * 13 + 22);
      link.pill.setAttribute('x', mx - w / 2); link.pill.setAttribute('y', my - 15); link.pill.setAttribute('width', w);
      link.text.setAttribute('x', mx); link.text.setAttribute('y', my + 5.5);
      link.text.textContent = label;
    });
    for (const { key, ro } of outs) ro.set(show.includes(key) ? tidy(m[key], 4) : '?');
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${names[0]} ${withUnit(x, units[0])}, ${names[1]} ${withUnit(m.u, units[1])}, ${names[2]} ${withUnit(m.y, units[2])}.`
      + (show.includes('inner') ? ` ${rateLabels[0]}: ${formatNumber(tidy(m.inner, 4), digits)}.` : '')
      + (show.includes('outer') ? ` ${rateLabels[1]}: ${formatNumber(tidy(m.outer, 4), digits)}.` : '')
      + (show.includes('total') ? ` ${rateLabels[2]}: ${formatNumber(tidy(m.total, 4), digits)}.` : ''));
  }

  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (kDef && typeof next.k === 'number') { k = clamp(next.k, kDef.min, kDef.max); if (kRow) kRow.set(k); }
      if (typeof next.x === 'number') { x = fit(next.x); visited.add(x); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      if (kRow) kRow.setDisabled(readOnly);
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  {
    title: 'rate-chain — pedals, wheel, road',
    spec: {
      type: 'rate-chain', inner: 'k*x', outer: '2*u', x: [0, 4], u: [0, 16], y: [0, 32], start: 1, snap: 0.5,
      names: ['pedal turns', 'wheel turns', 'distance'], symbols: ['p', 'w', 'd'], units: ['', '', 'm'],
      rates: ['wheel turns per pedal turn', 'metres per wheel turn', 'metres per pedal turn'],
      k: { min: 1, max: 4, step: 1, value: 3, label: 'gear' },
    },
  },
  {
    title: 'rate-chain — a growing square (the outer rate changes)',
    spec: {
      type: 'rate-chain', inner: '3*x', outer: 'u^2', x: [0, 4], u: [0, 12], y: [0, 144], start: 1, snap: 0.5,
      names: ['time', 'side', 'area'], symbols: ['t', 's', 'A'], units: ['s', 'cm', 'cm²'], show: ['inner', 'outer'],
    },
  },
];
