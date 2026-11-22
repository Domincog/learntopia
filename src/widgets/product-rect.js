/**
 * product-rect — a rectangle whose two sides both grow. Over a small step the
 * area gains a strip on the right, a strip on top and a little corner where
 * the two strips meet. Shrink the step and the corner fades much faster than
 * the strips: the rate at which the area grows is "two strips", which is the
 * product rule  (fg)' = f'g + fg'.
 *
 * {
 *   type: 'product-rect',
 *   f: '5 + 2*x', g: '4 + 3*x',     // the two sides (across and up), as expressions in x
 *   at: 0,                          // the value of x now
 *   xRange: [0, 2], xStep: 0.5,     // optional: adds a slider for x
 *   steps: [1, 0.5, 0.25, 0.1, 0.01],   // the step sizes h on offer, largest first
 *   h: 1,                           // the step at the start (one of `steps`)
 *   names: { f: 'width', g: 'height', x: 't', shape: 'rectangle' },   // what the sides, the variable and the shape are called
 *   readouts: ['gain', 'rate'],     // 'gain': area gained over the step · 'rate': gain ÷ step
 *   bar: true,                      // the bar that splits "gain ÷ step" into right strip, top strip and corner
 *   static: false,                  // true: a picture, no sliders
 * }
 *
 * State: { x, h, f, g, df, dg, right, top, corner, gain, rate, cornerShare, tried, smallest }
 *   f, g          the two sides now;  df, dg: how much each grows over the step h
 *   right         area of the strip on the right:  g × df
 *   top           area of the strip on top:        f × dg
 *   corner        area of the corner:              df × dg
 *   gain          right + top + corner;  rate = gain ÷ h
 *   cornerShare   corner ÷ gain: the fraction of the growth that the corner is responsible for
 *   tried         every step size tried so far (largest first);  smallest: the smallest of them
 *
 * setState accepts { h, x }.
 */
import { frame, sliderRow, readout, hue, s, clamp, tidy, formatNumber } from './kit.js';
import { compile } from '../core/mathexpr.js';

const W = 560;
const H = 362;
const BOX = { l: 80, r: 298, t: 24, b: 256 };     // where the rectangle may be drawn
const LEGEND_X = 326;
const BAR = { l: 80, r: 540, t: 320, b: 346 };

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const steps = (Array.isArray(spec.steps) && spec.steps.length ? spec.steps : [1, 0.5, 0.25, 0.1, 0.01]).map(Number);
  const names = { f: 'width', g: 'height', x: 'x', shape: 'rectangle', ...(spec.names || {}) };
  const showBar = spec.bar !== false;
  const fExpr = compile(String(spec.f || 'x'), { vars: ['x'] });
  const gExpr = compile(String(spec.g || 'x'), { vars: ['x'] });
  const fAt = (v) => fExpr({ x: v });
  const gAt = (v) => gExpr({ x: v });
  const xRange = Array.isArray(spec.xRange) ? spec.xRange : null;
  const xStep = spec.xStep || 0.5;
  let x = spec.at != null ? Number(spec.at) : (xRange ? xRange[0] : 1);
  let hi = Math.max(0, steps.indexOf(spec.h != null ? Number(spec.h) : steps[0]));
  let readOnly = !!env.readOnly;
  const tried = new Set([steps[hi]]);

  const model = () => {
    const h = steps[hi];
    const f = fAt(x);
    const g = gAt(x);
    const df = fAt(x + h) - f;
    const dg = gAt(x + h) - g;
    const right = g * df;
    const top = f * dg;
    const corner = df * dg;
    const gain = right + top + corner;
    return { h, f, g, df, dg, right, top, corner, gain, rate: gain / h };
  };
  const getState = () => {
    const m = model();
    const list = Array.from(tried).sort((a, b) => b - a);
    return {
      x, h: m.h, f: tidy(m.f), g: tidy(m.g), df: tidy(m.df), dg: tidy(m.dg),
      right: tidy(m.right), top: tidy(m.top), corner: tidy(m.corner), gain: tidy(m.gain), rate: tidy(m.rate),
      cornerShare: m.gain ? tidy(m.corner / m.gain) : 0, tried: list, smallest: list[list.length - 1],
    };
  };

  // one scale for every setting, so the rectangle keeps its size while the strips change
  const maxStep = Math.max(...steps);
  let widest = 0;
  let tallest = 0;
  let fastest = 0;
  const xs = xRange ? [] : [x];
  if (xRange) for (let v = xRange[0]; v <= xRange[1] + 1e-9; v += xStep) xs.push(v);
  for (const v of xs) {
    widest = Math.max(widest, fAt(v + maxStep), fAt(v));
    tallest = Math.max(tallest, gAt(v + maxStep), gAt(v));
    for (const h of steps) fastest = Math.max(fastest, (fAt(v + h) * gAt(v + h) - fAt(v) * gAt(v)) / h);
  }
  const k = Math.min((BOX.r - BOX.l) / (widest || 1), (BOX.b - BOX.t) / (tallest || 1));

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: showBar ? H : BOX.b + 34, compact: env.compact, label: spec.alt || 'A rectangle whose two sides are growing' });
  const { svg } = fr;
  const part = (color) => s('rect', { fill: hue(color, 'soft'), stroke: hue(color), 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const main = part('blue');
  const rightStrip = part('orange');
  const topStrip = part('violet');
  const cornerBox = part('green');
  const outline = s('rect', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  svg.append(main, rightStrip, topStrip, cornerBox, outline);
  const text = (cls, anchor = 'middle') => { const el = s('text', { class: cls, 'text-anchor': anchor }); svg.appendChild(el); return el; };
  const fLabel = text('fig-label');
  const dfLabel = text('fig-label text-orange');
  const gName = text('fig-label', 'end');
  const gLabel = text('fig-label', 'end');
  const dgLabel = text('fig-label text-violet', 'end');

  const legend = [['blue', `the ${names.shape} now`], ['orange', 'strip on the right'], ['violet', 'strip on top'], ['green', 'corner']].map(([color, name], i) => {
    const y = BOX.t + 12 + i * 60;
    svg.appendChild(s('rect', { x: LEGEND_X, y: y - 11, width: 16, height: 16, rx: 4, fill: hue(color, 'soft'), stroke: hue(color), 'stroke-width': 2 }));
    svg.appendChild(s('text', { class: `fig-label text-${color}`, x: LEGEND_X + 24, y: y + 2 }, name));
    const value = s('text.fig-label', { x: LEGEND_X + 24, y: y + 24 });
    svg.appendChild(value);
    return value;
  });

  let barParts = null;
  if (showBar) {
    svg.appendChild(s('text.fig-label', { x: BAR.l, y: BAR.t - 9 }, 'area gained ÷ step, in its three parts'));
    svg.appendChild(s('rect', { x: BAR.l, y: BAR.t, width: BAR.r - BAR.l, height: BAR.b - BAR.t, rx: 6, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 1.5 }));
    barParts = ['orange', 'violet', 'green'].map((color) => { const el = s('rect', { y: BAR.t, height: BAR.b - BAR.t, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 }); svg.appendChild(el); return el; });
  }

  const outs = {};
  if (!env.compact) {
    const wanted = Array.isArray(spec.readouts) ? spec.readouts : ['gain', 'rate'];
    if (wanted.includes('gain')) { outs.gain = readout('area gained', { digits: 4 }); fr.readouts.appendChild(outs.gain.el); }
    if (wanted.includes('rate')) { outs.rate = readout('area gained ÷ step', { digits: 4, color: 'pink' }); fr.readouts.appendChild(outs.rate.el); }
  }

  const fmt = (v) => formatNumber(tidy(v), 4);
  const named = (name, v) => (name.length <= 2 ? `${name} = ${fmt(v)}` : `${name} ${fmt(v)}`);
  const place = (el, px, py, w, hh) => { el.setAttribute('x', px); el.setAttribute('y', py); el.setAttribute('width', Math.max(0, w)); el.setAttribute('height', Math.max(0, hh)); };

  function render() {
    const m = model();
    const fw = m.f * k;
    const gh = m.g * k;
    const dw = Math.max(0, m.df * k);
    const dh = Math.max(0, m.dg * k);
    const ox = BOX.l;
    const oy = BOX.b;
    place(main, ox, oy - gh, fw, gh);
    place(rightStrip, ox + fw, oy - gh, dw, gh);
    place(topStrip, ox, oy - gh - dh, fw, dh);
    place(cornerBox, ox + fw, oy - gh - dh, dw, dh);
    place(outline, ox, oy - gh - dh, fw + dw, gh + dh);
    fLabel.setAttribute('x', ox + fw / 2); fLabel.setAttribute('y', oy + 22);
    fLabel.textContent = named(names.f, m.f);
    dfLabel.setAttribute('x', ox + fw + Math.max(dw / 2, 14)); dfLabel.setAttribute('y', oy + 22);
    dfLabel.setAttribute('text-anchor', dw >= 56 ? 'middle' : 'start');
    if (dw < 56) dfLabel.setAttribute('x', ox + fw + 6);
    dfLabel.textContent = `+${fmt(m.df)}`;
    const longName = names.g.length > 2;
    gName.setAttribute('x', ox - 9); gName.setAttribute('y', oy - gh / 2 - 8);
    gName.textContent = longName ? names.g : '';
    gLabel.setAttribute('x', ox - 9); gLabel.setAttribute('y', oy - gh / 2 + (longName ? 14 : 5));
    gLabel.textContent = longName ? fmt(m.g) : named(names.g, m.g);
    dgLabel.setAttribute('x', ox - 9); dgLabel.setAttribute('y', Math.min(oy - gh - dh / 2 + 5, oy - gh - 6));
    dgLabel.textContent = `+${fmt(m.dg)}`;
    legend[0].textContent = `${fmt(m.f)} × ${fmt(m.g)} = ${fmt(m.f * m.g)}`;
    legend[1].textContent = `${fmt(m.g)} × ${fmt(m.df)} = ${fmt(m.right)}`;
    legend[2].textContent = `${fmt(m.f)} × ${fmt(m.dg)} = ${fmt(m.top)}`;
    legend[3].textContent = `${fmt(m.df)} × ${fmt(m.dg)} = ${fmt(m.corner)}`;
    if (barParts) {
      const scale = (BAR.r - BAR.l) / (fastest || 1);
      let at = BAR.l;
      [m.right, m.top, m.corner].forEach((area, i) => {
        const w = Math.max(0, (area / m.h) * scale);
        barParts[i].setAttribute('x', at);
        barParts[i].setAttribute('width', w);
        barParts[i].setAttribute('visibility', w > 0.2 ? 'visible' : 'hidden');
        at += w;
      });
    }
    if (outs.gain) outs.gain.set(tidy(m.gain));
    if (outs.rate) outs.rate.set(tidy(m.rate));
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The rectangle is ${fmt(m.f)} by ${fmt(m.g)}. Over a step of ${fmt(m.h)} it gains a strip of area ${fmt(m.right)} on the right, a strip of area ${fmt(m.top)} on top and a corner of area ${fmt(m.corner)}. Area gained divided by the step: ${fmt(m.rate)}.`);
  }

  let hRow = null;
  let xRow = null;
  if (!isStatic) {
    hRow = sliderRow({
      label: 'step $h$', min: 0, max: steps.length - 1, step: 1, value: hi, color: 'pink', format: (i) => formatNumber(steps[Math.round(i)], 4),
      onInput: (i) => { if (readOnly) return; hi = clamp(Math.round(i), 0, steps.length - 1); tried.add(steps[hi]); render(); env.onChange(getState()); },
    });
    fr.controls.appendChild(hRow.el);
    if (xRange) {
      xRow = sliderRow({
        label: `$${names.x}$`, min: xRange[0], max: xRange[1], step: xStep, value: x, color: 'blue',
        onInput: (v) => { if (readOnly) return; x = v; render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(xRow.el);
    }
  }
  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.h === 'number') {
        let best = 0;
        steps.forEach((v, i) => { if (Math.abs(v - next.h) < Math.abs(steps[best] - next.h)) best = i; });
        hi = best;
        tried.add(steps[hi]);
        if (hRow) hRow.set(hi);
      }
      if (typeof next.x === 'number') { x = xRange ? clamp(next.x, xRange[0], xRange[1]) : next.x; if (xRow) xRow.set(x); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hRow) hRow.setDisabled(readOnly);
      if (xRow) xRow.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'product-rect — both sides grow', spec: { type: 'product-rect', f: '5 + 2*x', g: '4 + 3*x', at: 0, names: { f: 'width', g: 'height', x: 't' } } },
  { title: 'product-rect — a growing square: why x² has slope 2x', spec: { type: 'product-rect', f: 'x', g: 'x', at: 3, xRange: [1, 4], xStep: 0.5, steps: [1, 0.5, 0.1, 0.01], names: { f: 'x', g: 'x', x: 'x' } } },
];
