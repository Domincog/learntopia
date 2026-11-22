/**
 * exp-compare — a race between adding and multiplying. One quantity grows by
 * the same amount at every step (linear), the other is multiplied by the same
 * factor at every step (exponential). The learner steps forward in time and
 * watches the bars; the vertical scale always stretches to fit the larger
 * one, so the moment the exponential takes off, the line is squashed flat.
 *
 * {
 *   type: 'exp-compare',
 *   linear: { start: 100, add: 100, label: 'Plan A', short: 'A', color: 'blue' },
 *   exponential: { start: 1, factor: 2, label: 'Plan B', short: 'B', color: 'orange' },
 *   max: 20,            // the last step the slider reaches
 *   n: 0,               // the step shown at the start
 *   unit: 'day',        // what one step is called
 *   static: false,      // true: picture only
 * }
 *
 * State: { n, linear, exponential, ahead, crossover }
 *   linear, exponential   the two values at step n
 *   ahead                 'linear' | 'exponential' | 'level'
 *   crossover             the first step at which the exponential is ahead after having been
 *                         level or behind (null if that does not happen up to `max`)
 *
 * setState accepts { n }.
 */
import { frame, sliderRow, readout, hue, s, h, clamp, niceStep, ticks, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('exp-compare', `
  .widget-exp-compare .ec-line { text-align: center; min-height: 1.6em; font-size: var(--fs-md); font-weight: 700; }
`);

const W = 560;
const H = 320;
const PAD = { l: 58, r: 14, t: 26, b: 34 };

/** 1048576 -> "1,048,576"; small non-whole values keep up to two decimals. */
export function withCommas(v) {
  const r = Math.abs(v) >= 1000 ? Math.round(v) : Math.round(v * 100) / 100;
  const [whole, part] = String(Math.abs(r)).split('.');
  return (r < 0 ? '−' : '') + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (part ? `.${part}` : '');
}
/** Short axis labels: 1500 -> "1.5k", 2000000 -> "2M". */
function compact(v) {
  const a = Math.abs(v);
  const short = (x, unit) => `${String(Math.round(x * 10) / 10)}${unit}`;
  if (a >= 1e12) return short(v / 1e12, 'T');
  if (a >= 1e9) return short(v / 1e9, 'B');
  if (a >= 1e6) return short(v / 1e6, 'M');
  if (a >= 1e4) return short(v / 1e3, 'k');
  return withCommas(v);
}

export default function create(spec, env) {
  const lin = { start: 100, add: 100, label: 'Adding', short: 'A', color: 'blue', ...(spec.linear || {}) };
  const exp = { start: 1, factor: 2, label: 'Multiplying', short: 'B', color: 'orange', ...(spec.exponential || {}) };
  const max = clamp(Math.round(spec.max || 20), 2, 40);
  const unit = spec.unit || 'step';
  const isStatic = !!spec.static || env.compact;
  let n = clamp(Math.round(spec.n || 0), 0, max);
  let readOnly = !!env.readOnly;

  const linAt = (k) => lin.start + lin.add * k;
  const expAt = (k) => exp.start * Math.pow(exp.factor, k);
  let crossover = null;
  for (let k = 1; k <= max; k++) if (expAt(k) > linAt(k) + 1e-9 && expAt(k - 1) <= linAt(k - 1) + 1e-9) { crossover = k; break; }

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Two kinds of growth, step by step' });
  const { svg } = fr;
  const gAxes = s('g');
  const gBars = s('g');
  svg.append(gAxes, gBars);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bottom = H - PAD.b;
  const band = iw / (max + 1);

  const line = h('div.ec-line', { 'aria-live': 'polite' });
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);
  const roLin = readout(lin.label, { color: lin.color });
  const roExp = readout(exp.label, { color: exp.color });
  if (!env.compact) fr.readouts.append(roLin.el, roExp.el);

  function getState() {
    const a = linAt(n);
    const b = expAt(n);
    return { n, linear: a, exponential: b, ahead: Math.abs(a - b) < 1e-9 ? 'level' : a > b ? 'linear' : 'exponential', crossover };
  }

  function draw() {
    const st = getState();
    const top = Math.max(st.linear, st.exponential, linAt(0), expAt(0), 1e-9);
    const stepY = niceStep(top, 4);
    const yMax = Math.ceil(top / stepY - 1e-9) * stepY;
    const sy = (v) => bottom - (v / yMax) * ih;

    gAxes.replaceChildren();
    for (const v of ticks(0, yMax, stepY)) {
      gAxes.appendChild(s('line.grid-line', { x1: PAD.l, x2: W - PAD.r, y1: sy(v), y2: sy(v) }));
      gAxes.appendChild(s('text.tick-label', { x: PAD.l - 7, y: sy(v) + 4, 'text-anchor': 'end' }, compact(v)));
    }
    gAxes.appendChild(s('line.axis-line', { x1: PAD.l, x2: W - PAD.r, y1: bottom, y2: bottom }));
    gAxes.appendChild(s('line.axis-line', { x1: PAD.l, x2: PAD.l, y1: PAD.t, y2: bottom }));
    const every = max <= 12 ? 1 : max <= 24 ? 2 : 5;
    for (let k = 0; k <= max; k += every) gAxes.appendChild(s('text.tick-label', { x: PAD.l + band * (k + 0.5), y: bottom + 17, 'text-anchor': 'middle' }, String(k)));
    gAxes.appendChild(s('text.axis-label', { x: W - PAD.r, y: PAD.t - 9, 'text-anchor': 'end' }, `${unit} →`));

    gBars.replaceChildren();
    const bw = Math.min(band * 0.4, 16);
    for (let k = 0; k <= n; k++) {
      const cx = PAD.l + band * (k + 0.5);
      const now = k === n;
      const bar = (v, x, color) => {
        const hgt = v > 0 ? Math.max(1.5, bottom - sy(v)) : 0;
        gBars.appendChild(s('rect', { x, y: bottom - hgt, width: bw, height: hgt, fill: hue(color), stroke: now ? 'var(--edge-strong)' : 'none', 'stroke-width': 1.5, opacity: now ? 1 : 0.55, rx: Math.min(2, bw / 4) }));
        return bottom - hgt;
      };
      const ya = bar(linAt(k), cx - bw - 0.5, lin.color);
      const yb = bar(expAt(k), cx + 0.5, exp.color);
      if (now) {
        // the two bars of the current step carry their letters, so that colour is not the only clue
        // A letter sits over its own bar; when the other bar is as tall or taller it moves outwards, clear of that bar.
        const asideA = yb < ya + 16;
        const asideB = ya < yb + 16;
        gBars.appendChild(s('text.fig-label', { x: asideA ? cx - 2 : cx - bw / 2 - 0.5, y: Math.max(ya - 6, 14), 'text-anchor': asideA ? 'end' : 'middle', style: `fill:${hue(lin.color, 'text')}` }, lin.short));
        gBars.appendChild(s('text.fig-label', { x: asideB ? cx + 2 : cx + bw / 2 + 0.5, y: Math.max(yb - 6, 14), 'text-anchor': asideB ? 'start' : 'middle', style: `fill:${hue(exp.color, 'text')}` }, exp.short));
      }
    }

    roLin.set(withCommas(st.linear));
    roExp.set(withCommas(st.exponential));
    const gapText = withCommas(Math.abs(st.linear - st.exponential));
    const who = st.ahead === 'level' ? 'the two are level' : `${st.ahead === 'linear' ? lin.label : exp.label} is ahead by ${gapText}`;
    const sentence = `${unit[0].toUpperCase()}${unit.slice(1)} ${n}: ${who}.`;
    line.replaceChildren(h('span', { html: mdInline(sentence) }));
    svg.setAttribute('aria-label', `Bar chart up to ${unit} ${n}. ${lin.label}: ${withCommas(st.linear)}. ${exp.label}: ${withCommas(st.exponential)}. ${who[0].toUpperCase()}${who.slice(1)}.`);
  }

  let row = null;
  if (!isStatic) {
    row = sliderRow({
      label: unit, min: 0, max, step: 1, value: n, color: 'green',
      onInput: (v) => { if (readOnly) return; n = v; play('tap'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(row.el);
  }
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || next.n == null) return;
      n = clamp(Math.round(next.n), 0, max);
      if (row) row.set(n);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (row) row.setDisabled(readOnly);
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'exp-compare — add 100 a day, or double every day', spec: { type: 'exp-compare', linear: { start: 100, add: 100, label: 'Plan A' }, exponential: { start: 1, factor: 2, label: 'Plan B' }, max: 20, n: 6, unit: 'day' } },
  { title: 'exp-compare — a slow multiplier still wins in the end', spec: { type: 'exp-compare', linear: { start: 0, add: 1000, label: 'Adding 1000' }, exponential: { start: 1, factor: 1.5, label: 'Times 1.5' }, max: 30, n: 30, unit: 'week', static: true } },
];
