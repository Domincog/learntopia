/**
 * dice-sum-lab — the exact distribution of the total (or the average) of n
 * dice, for a die whose faces the learner can re-weight. With one die it is a
 * picture of a single random variable: its distribution, its expected value
 * and its standard deviation. Add dice and the bars pile up into a bell,
 * whatever the die looks like. A switch can make every die copy the first
 * one, to show what dependence does to the bell.
 *
 * Nothing here is simulated: the bars are exact probabilities, so checks may
 * use every number in the state.
 *
 * {
 *   type: 'dice-sum-lab',
 *   values: [1, 2, 3, 4, 5, 6],     // what the faces show: whole numbers in ascending order
 *   weights: [1, 1, 1, 1, 1, 1],    // how likely each face is: the chance of a face is its weight / the total weight
 *   edit: false,                    // true: tapping a bar of the small "one die" chart changes that face's weight
 *   maxWeight: 4,                   //   weights run from 0 to this
 *   n: 1,                           // how many dice are added
 *   nRange: [1, 30],                // adds a slider for the number of dice
 *   view: 'sum',                    // 'sum' (the total) or 'average' (the total divided by n)
 *   viewToggle: false,              // adds a switch between the two
 *   linked: false,                  // true: every die shows the same face as the first one
 *   linkToggle: false,              // adds a switch for that
 *   curve: false,                   // overlay the normal curve that has the same mean and SD
 *   band: 0,                        // shade mean ± band SDs, and report the exact chance of landing inside
 *   readouts: ['mean', 'sd'],       // any of: mean, sd, variance, inside, dieSd (a static picture has none unless listed)
 *   meanLabel: 'mean',              // what the centre is called in the chart and the readout, e.g. 'expected value'
 *   die: true,                      // show the small chart of one die (always shown when edit is true)
 *   x: [2, 12], yMax: 0.2,          // optional fixed axes, for pictures that are compared side by side
 *   noun: ['die', 'dice'],          // what one thing and several things are called
 *   axis: 'prize, in coins',        // optional: the caption under the chart while it shows a single die (for pictures of other variables)
 *   static: false,                  // true: a picture without controls
 * }
 *
 * State: { n, weights, view, linked, mean, sd, variance, dieMean, dieSd, dieVariance, flat, faces, inside }
 *   mean, sd, variance — of what the chart shows: the total, or the average
 *   dieMean, dieSd, dieVariance — of a single die
 *   flat  — every face has the same weight
 *   faces — how many faces have a weight above 0
 *   inside — the chance of landing within `band` SDs of the mean (null without a band)
 *
 * setState accepts { n, weights, view, linked }.
 */
import { frame, button, readout, sliderRow, niceStep, ticks, hue, s, h, clamp, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

addStyles('dice-sum-lab', `
  .widget-dice-sum-lab .dsl-die { display: flex; align-items: flex-end; justify-content: center; gap: var(--s3); }
  .widget-dice-sum-lab .dsl-die-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); padding-bottom: 4px; max-width: 9ch; text-align: right; line-height: 1.2; }
  .widget-dice-sum-lab .dsl-faces { display: flex; gap: 4px; }
  .widget-dice-sum-lab .dsl-face {
    width: 40px; min-height: 76px; padding: 0 0 2px; display: grid; grid-template-rows: 1fr auto; justify-items: center; align-items: end; gap: 2px;
    border: var(--bw) solid var(--hair); border-radius: 10px; background: var(--surface); color: var(--ink);
    font-weight: 800; font-size: var(--fs-sm); font-variant-numeric: tabular-nums; line-height: 1.1;
  }
  .widget-dice-sum-lab button.dsl-face { cursor: pointer; border-color: var(--edge); }
  .widget-dice-sum-lab button.dsl-face:active { transform: scale(0.95); }
  .widget-dice-sum-lab .dsl-face i { display: block; width: 22px; border-radius: 4px 4px 0 0; background: var(--violet); border: 2px solid var(--ink); border-bottom: 0; }
  .widget-dice-sum-lab .dsl-face.is-zero i { border: 0; height: 0; }
  .widget-dice-sum-lab .dsl-face.is-zero { color: var(--ink-3); }
  .widget-dice-sum-lab.is-readonly button.dsl-face { cursor: default; }
  .widget-dice-sum-lab .dsl-switches { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; }
`);

const fmt = (v, d = 2) => formatNumber(v, d);

/** Exact distribution of the total of n dice: [{ t, p }, …] in ascending order of the total t. */
export function totalDistribution(values, weights, n, linked = false) {
  const tot = weights.reduce((a, b) => a + b, 0) || 1;
  const probs = weights.map((w) => w / tot);
  if (linked || n === 1) return values.map((v, i) => ({ t: n * v, p: probs[i] })).filter((q) => q.p > 0);
  const vmin = values[0];
  const span = values[values.length - 1] - vmin;
  const base = new Float64Array(span + 1);
  values.forEach((v, i) => { base[v - vmin] += probs[i]; });
  let dist = Float64Array.from(base);
  for (let k = 1; k < n; k++) {
    const next = new Float64Array(dist.length + span);
    for (let i = 0; i < dist.length; i++) {
      if (!dist[i]) continue;
      for (let j = 0; j <= span; j++) if (base[j]) next[i + j] += dist[i] * base[j];
    }
    dist = next;
  }
  const out = [];
  for (let i = 0; i < dist.length; i++) if (dist[i] > 0) out.push({ t: n * vmin + i, p: dist[i] });
  return out;
}

export default function create(spec, env) {
  const values = (Array.isArray(spec.values) && spec.values.length > 1 ? spec.values : [1, 2, 3, 4, 5, 6]).map((v) => Math.round(v));
  const maxWeight = clamp(Math.round(spec.maxWeight || 4), 1, 9);
  const startWeights = values.map((_, i) => clamp(Math.round(Array.isArray(spec.weights) && spec.weights[i] != null ? spec.weights[i] : 1), 0, 99));
  if (!startWeights.some((w) => w > 0)) startWeights.fill(1);
  let weights = startWeights.slice();
  const nLim = Array.isArray(spec.nRange) ? [Math.max(1, Math.round(spec.nRange[0])), Math.min(60, Math.round(spec.nRange[1]))] : null;
  let n = clamp(Math.round(spec.n || 1), nLim ? nLim[0] : 1, nLim ? nLim[1] : 60);
  let view = spec.view === 'average' ? 'average' : 'sum';
  let linked = !!spec.linked;
  const band = spec.band > 0 ? Number(spec.band) : 0;
  const isStatic = !!spec.static || env.compact;
  const canEdit = !!spec.edit && !isStatic;
  const showDie = !env.compact && (canEdit || (spec.die !== false && !spec.static));
  const [one, many] = Array.isArray(spec.noun) ? spec.noun : ['die', 'dice'];
  const wanted = Array.isArray(spec.readouts) ? spec.readouts : (spec.static ? [] : band ? ['mean', 'sd', 'inside'] : ['mean', 'sd']);
  const meanWord = spec.meanLabel || 'mean';
  let readOnly = !!env.readOnly;

  // A picture is usually shown small (two side by side, or inside an answer option), so it is drawn on a
  // smaller canvas: its labels then stay readable when the whole figure is scaled down.
  const small = !!spec.static || env.compact;
  const W = small ? 420 : 560;
  const H = small ? 240 : 300;
  const box = { l: 48, r: W - 14, t: 22, b: H - 46 };
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Chance of each total' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);

  /* ---------------------------------------------------------------- model */
  function model() {
    const tot = weights.reduce((a, b) => a + b, 0);
    const probs = weights.map((w) => w / tot);
    const dieMean = values.reduce((t, v, i) => t + v * probs[i], 0);
    const dieVariance = values.reduce((t, v, i) => t + (v - dieMean) ** 2 * probs[i], 0);
    const k = view === 'average' ? n : 1;
    const pts = totalDistribution(values, weights, n, linked).map((q) => ({ x: q.t / k, p: q.p }));
    const variance = (linked ? n * n * dieVariance : n * dieVariance) / (k * k);
    const mean = (n * dieMean) / k;
    const sd = Math.sqrt(variance);
    let inside = null;
    if (band) inside = pts.reduce((t, q) => (Math.abs(q.x - mean) <= band * sd + 1e-9 ? t + q.p : t), 0);
    return { pts, mean, sd, variance, dieMean, dieVariance, dieSd: Math.sqrt(dieVariance), inside, k };
  }
  const tidy = (v) => Math.round(v * 1e9) / 1e9;
  function getState() {
    const m = model();
    return {
      n, weights: weights.slice(), view, linked,
      mean: tidy(m.mean), sd: tidy(m.sd), variance: tidy(m.variance),
      dieMean: tidy(m.dieMean), dieSd: tidy(m.dieSd), dieVariance: tidy(m.dieVariance),
      flat: weights.every((w) => w === weights[0]), faces: weights.filter((w) => w > 0).length,
      inside: m.inside == null ? null : tidy(m.inside),
    };
  }

  /* --------------------------------------------------------------- chrome */
  const faceEls = [];
  if (showDie) {
    const facesEl = h('div.dsl-faces', { role: 'group', 'aria-label': `Chances of the faces of one ${one}` });
    values.forEach((v, i) => {
      const bar = h('i');
      const el = canEdit
        ? h('button.dsl-face', { type: 'button' }, bar, String(v))
        : h('div.dsl-face', bar, String(v));
      if (canEdit) {
        el.dataset.keys = 'own';
        el.addEventListener('click', () => bump(i, 0));
        el.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowUp') { ev.preventDefault(); bump(i, 1); } else if (ev.key === 'ArrowDown') { ev.preventDefault(); bump(i, -1); }
        });
      }
      faceEls.push({ el, bar });
      facesEl.appendChild(el);
    });
    fr.el.insertBefore(h('div.dsl-die', h('span.dsl-die-label', canEdit ? `one ${one}: tap to re-weight` : `one ${one}`), facesEl), fr.canvas);
  }

  const ro = {};
  const names = () => {
    // a single die with no slider is one random variable: "of the total" would only confuse
    const of = n === 1 && !(nLim && nLim[1] > nLim[0]) ? '' : ` of the ${view === 'average' ? 'average' : 'total'}`;
    return { mean: `${meanWord}${of}`, sd: `SD${of}`, variance: `variance${of}`, inside: `within ${band === 1 ? '1 SD' : `${fmt(band)} SDs`}`, dieSd: `SD of one ${one}` };
  };
  if (!env.compact) {
    for (const key of wanted) {
      if (!(key in names())) continue;
      if (key === 'inside' && !band) continue;
      ro[key] = readout(names()[key], { color: key === 'sd' ? 'orange' : null });
      fr.readouts.appendChild(ro[key].el);
    }
  }

  let nRow = null;
  const switches = [];
  let resetBtn = null;
  if (!isStatic) {
    if (nLim && nLim[1] > nLim[0]) {
      nRow = sliderRow({ label: `number of ${many}`, min: nLim[0], max: nLim[1], step: 1, value: n, color: 'blue', onInput: (v) => { if (readOnly) return; n = v; play('tap'); render(); env.onChange(getState()); } });
      fr.controls.appendChild(nRow.el);
    }
    const addSwitch = (label, options, get, set) => {
      const seg = h('div.segmented', { role: 'group', 'aria-label': label });
      const btns = options.map(([text, value]) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(get() === value) }, text);
        b.addEventListener('click', () => { if (readOnly || get() === value) return; set(value); play('select'); render(); env.onChange(getState()); });
        seg.appendChild(b);
        return { b, value };
      });
      switches.push({ btns, get });
      return seg;
    };
    const row = h('div.dsl-switches');
    if (spec.viewToggle) row.appendChild(addSwitch('What the chart shows', [['Total', 'sum'], ['Average', 'average']], () => view, (v) => { view = v; }));
    if (spec.linkToggle) row.appendChild(addSwitch('How the dice behave', [[`Independent ${many}`, false], ['All copy the first', true]], () => linked, (v) => { linked = v; }));
    if (row.children.length) fr.controls.appendChild(row);
    if (canEdit) {
      resetBtn = button('Back to the start', () => { if (readOnly) return; weights = startWeights.slice(); play('pop'); render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(resetBtn);
    }
  }

  function bump(i, dir) {
    if (readOnly) return;
    let w = dir === 0 ? (weights[i] + 1) % (maxWeight + 1) : clamp(weights[i] + dir, 0, maxWeight);
    const others = weights.some((v, j) => j !== i && v > 0);
    if (w === 0 && !others) w = dir === 0 ? 1 : weights[i];   // a die needs at least one face that can come up
    if (w === weights[i]) return;
    weights[i] = w;
    play('tap');
    render();
    env.announce(`Face ${values[i]}: weight ${w}.`);
    env.onChange(getState());
  }

  /* ----------------------------------------------------------------- draw */
  function render() {
    const m = model();
    const { pts, mean, sd } = m;
    // horizontal range
    const vmin = values[0];
    const vmax = values[values.length - 1];
    let gap = Infinity;
    for (let i = 1; i < pts.length; i++) gap = Math.min(gap, pts[i].x - pts[i - 1].x);
    if (!Number.isFinite(gap)) gap = 1 / m.k;
    let lo;
    let hi;
    if (Array.isArray(spec.x)) [lo, hi] = spec.x;
    else if (view === 'average') { lo = vmin; hi = vmax; }
    else if (linked || n === 1) { lo = n * vmin; hi = n * vmax; }
    else { lo = Math.max(n * vmin, Math.floor(mean - 5 * sd)); hi = Math.min(n * vmax, Math.ceil(mean + 5 * sd)); }
    const padX = Math.min(gap, (hi - lo) / 6 || 1) * 0.6;
    const x0 = lo - padX;
    const x1 = hi + padX;
    const sx = (v) => box.l + ((v - x0) / (x1 - x0)) * (box.r - box.l);
    // vertical range
    const curveOn = !!spec.curve && sd > 0;
    const dens = (x) => (gap / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * sd * sd));
    const pMax = Math.max(...pts.map((q) => q.p), curveOn ? dens(mean) : 0);
    const yStep = niceStep(pMax * 1.1, 4);
    const yTop = spec.yMax > 0 ? Number(spec.yMax) : Math.ceil((pMax * 1.08) / yStep) * yStep;
    const sy = (v) => box.b - (clamp(v, 0, yTop) / yTop) * (box.b - box.t);

    g.replaceChildren();
    const pctDigits = yStep * 100 < 1 - 1e-9 ? (yStep * 100 < 0.1 - 1e-9 ? 2 : 1) : 0;
    for (const v of ticks(0, yTop, yStep)) {
      g.appendChild(s('line.grid-line', { x1: box.l, x2: box.r, y1: sy(v), y2: sy(v) }));
      g.appendChild(s('text.tick-label', { x: box.l - 6, y: sy(v) + 4, 'text-anchor': 'end' }, `${(v * 100).toFixed(pctDigits)}%`));
    }
    if (band && sd > 0) {
      const a = Math.max(x0, mean - band * sd);
      const b = Math.min(x1, mean + band * sd);
      g.appendChild(s('rect', { x: sx(a), y: box.t, width: Math.max(0, sx(b) - sx(a)), height: box.b - box.t, fill: hue('orange', 'soft'), opacity: 0.75 }));
    }
    const slotPx = (gap / (x1 - x0)) * (box.r - box.l);
    const bw = clamp(slotPx * 0.82, 1.2, 46);
    const thin = bw < 7;
    let d = '';
    for (const q of pts) {
      if (q.x < x0 || q.x > x1) continue;
      const y = sy(q.p);
      const hh = box.b - y;
      if (hh < 0.3) continue;
      if (thin) d += `M${(sx(q.x) - bw / 2).toFixed(2)} ${box.b}v${(-hh).toFixed(2)}h${bw.toFixed(2)}v${hh.toFixed(2)}z`;
      else g.appendChild(s('rect', { x: sx(q.x) - bw / 2, y, width: bw, height: Math.max(1, hh), rx: Math.min(3, bw / 4), fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': bw > 16 ? 2.5 : 1.5 }));
    }
    if (d) g.appendChild(s('path', { d, fill: hue('blue') }));
    if (curveOn) {
      let c = '';
      for (let i = 0; i <= 160; i++) {
        const x = x0 + ((x1 - x0) * i) / 160;
        c += `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(dens(x)).toFixed(1)}`;
      }
      g.appendChild(s('path', { d: c, fill: 'none', stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    // axis, ticks, mean marker
    g.appendChild(s('line.axis-line', { x1: box.l, x2: box.r, y1: box.b, y2: box.b }));
    // a handful of bars: number each one; otherwise evenly spaced ticks
    const xStep = Math.max(niceStep(x1 - x0, 9), view === 'average' ? 0 : 1);
    const inView = pts.filter((q) => q.x >= x0 && q.x <= x1);
    const marks = n === 1 && values.length <= 13 ? values.filter((v) => v >= x0 && v <= x1)    // one die: every face, even one that never comes up
      : inView.length <= 13 ? inView.map((q) => q.x) : ticks(Math.max(lo, x0), Math.min(hi, x1), xStep);
    for (const v of marks) {
      g.appendChild(s('text.tick-label', { x: sx(v), y: box.b + 17, 'text-anchor': 'middle' }, fmt(v, 2)));
    }
    if (mean >= x0 && mean <= x1) {
      g.appendChild(s('line', { x1: sx(mean), x2: sx(mean), y1: box.t - 4, y2: box.b, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
      g.appendChild(s('text.fig-label-sm', { x: clamp(sx(mean), box.l + 34 + meanWord.length * 3, box.r - 34 - meanWord.length * 3), y: box.t - 8, 'text-anchor': 'middle' }, `${meanWord} ${fmt(mean, 2)}`));
    }
    const caption = n === 1 && spec.axis ? String(spec.axis) : n === 1 ? `what one ${one} shows` : `${view === 'average' ? 'average' : 'total'} of ${n} ${many}${linked ? ' that copy each other' : ''}`;
    g.appendChild(s('text.axis-label', { x: (box.l + box.r) / 2, y: H - 8, 'text-anchor': 'middle' }, caption));

    // one die
    const wMax = Math.max(maxWeight, ...weights);
    faceEls.forEach(({ el, bar }, i) => {
      bar.style.height = `${Math.round((weights[i] / wMax) * 48)}px`;
      el.classList.toggle('is-zero', weights[i] === 0);
      const tot = weights.reduce((a, b) => a + b, 0);
      el.setAttribute('aria-label', `Face ${values[i]}: weight ${weights[i]} of ${tot}${canEdit ? '. Press to change.' : ''}`);
      if (canEdit) el.disabled = readOnly;
    });
    const nm = names();
    for (const key of Object.keys(ro)) {
      ro[key].el.firstChild.textContent = nm[key];
      if (key === 'inside') ro[key].set(`${(m.inside * 100).toFixed(1)}%`);
      else ro[key].set(key === 'dieSd' ? m.dieSd : m[key]);
    }
    for (const { btns, get } of switches) for (const { b, value } of btns) { b.setAttribute('aria-pressed', String(get() === value)); b.disabled = readOnly; }
    if (resetBtn) resetBtn.disabled = readOnly || weights.every((w, i) => w === startWeights[i]);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Chance of each ${caption}: mean ${fmt(mean, 2)}, standard deviation ${fmt(sd, 2)}.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.weights) && next.weights.length === values.length && next.weights.some((w) => w > 0)) weights = next.weights.map((w) => clamp(Math.round(w), 0, 99));
      if (next.n != null) { n = clamp(Math.round(next.n), nLim ? nLim[0] : 1, nLim ? nLim[1] : 60); if (nRow) nRow.set(n); }
      if (next.view === 'sum' || next.view === 'average') view = next.view;
      if (typeof next.linked === 'boolean') linked = next.linked;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (nRow) nRow.setDisabled(readOnly);
      render();
    },
  };
}

export const examples = [
  { title: 'dice-sum-lab — add dice and watch the bell appear', spec: { type: 'dice-sum-lab', n: 2, nRange: [1, 30], edit: true, curve: true } },
  { title: 'dice-sum-lab — one loaded die: mean, SD and the band around the mean', spec: { type: 'dice-sum-lab', weights: [3, 1, 0, 0, 1, 3], edit: true, band: 1 } },
  { title: 'dice-sum-lab — total or average; independent or copied dice', spec: { type: 'dice-sum-lab', n: 10, nRange: [1, 30], viewToggle: true, linkToggle: true, curve: true } },
];
