/**
 * sample-means — the sampling distribution of an average, built by hand.
 * The top panel is a population (a bell, a skewed one, two humps or a flat
 * one). Each press draws a random sample of n values from it; the sample's
 * average drops into the bottom panel, where the averages pile up into a
 * distribution of their own: centred on the population mean, narrower than
 * the data, and more and more bell-shaped as n grows.
 *
 * {
 *   type: 'sample-means',
 *   x: [0, 80],                    // ends of the axis: whole numbers, at most 240 apart; values are whole numbers
 *   shape: 'bell',                 // the population at the start: 'bell' | 'skew' | 'twin' | 'flat'
 *   shapes: ['bell', 'skew', 'twin'],          // optional: adds a picker
 *   shapeLabels: { bell: 'Bell', skew: 'Skewed', twin: 'Two humps', flat: 'Flat' },
 *   shapeLabel: 'Population:',     // caption of that picker
 *   n: 16,                         // sample size at the start
 *   sizes: [4, 16, 64],            // optional: adds a picker
 *   start: 0,                      // samples already drawn (for the starting population and size) when the figure appears
 *   buttons: [1, 10, 1000],        // how many samples each button draws
 *   max: 5000,                     // most samples one pile can hold
 *   spreads: false,                // true: mark ±1 SD on both panels and print the two SDs (the lower one measured from
 *                                  //   the pile, once it holds 10 averages) · 'exact': print popSd / √n for the lower one
 *   unit: 'min',                   // appended to numbers in the figure
 *   xLabel: 'commute (minutes)',   // caption under the axis
 *   dataLabel: 'Individual commutes',          // title of the top panel
 *   noun: 'commuters',             // what a sample is made of: "1,000 averages of 16 commuters"
 *   static: false,                 // true: a picture without buttons (and without the marks of the latest sample)
 * }
 *
 * State: { shape, n, count, counts, mean, sd, se, popMean, popSd, last }
 *   count   — samples drawn so far for the population and sample size now on show
 *   counts  — the same for every population and size on offer: counts.bell[16]
 *   mean, sd — mean and SD of the averages in the pile (null while it holds fewer than 2). Random: never check them.
 *   popMean, popSd — of the population on show (exact) · se = popSd / √n
 *   last    — the most recent sample of the pile: { values, mean }, or null
 *
 * setState accepts { shape, n, counts: { bell: { 16: 1000 } } }: piles are topped up (or redrawn) to those sizes.
 * Every sample is drawn with env.rng. Write checks about `counts`, `shape` and `n`.
 */
import { frame, button, hue, s, h, clamp, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('sample-means', `
  .widget-sample-means .sx-pick { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-sample-means .sx-pick-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-sample-means .sx-pick .btn[aria-pressed='true'] { --btn-bg: var(--ink); --btn-fg: var(--paper); }
  .widget-sample-means.is-row .sx-pick { justify-content: flex-start; }
`);

const SHAPE_NAMES = { bell: 'Bell', skew: 'Skewed', twin: 'Two humps', flat: 'Flat' };
const bump = (t, centre, width) => Math.exp(-0.5 * ((t - centre) / width) ** 2);
const WEIGHT = {
  bell: (t) => bump(t, 0.5, 0.125),
  skew: (t) => (t / 0.11) * Math.exp(-t / 0.11),
  twin: (t) => bump(t, 0.3, 0.07) + bump(t, 0.7, 0.07),
  flat: () => 1,
};

/**
 * A population of whole numbers from lo to hi.
 * @returns {{ values: number[], weights: number[], mean: number, sd: number }} weights add up to 1
 */
export function population(shape, lo, hi) {
  const f = WEIGHT[shape] || WEIGHT.bell;
  const values = [];
  const raw = [];
  for (let v = lo; v <= hi; v++) { values.push(v); raw.push(Math.max(0, f((v - lo) / (hi - lo)))); }
  const total = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((w) => w / total);
  const mean = values.reduce((t, v, i) => t + v * weights[i], 0);
  const variance = values.reduce((t, v, i) => t + (v - mean) ** 2 * weights[i], 0);
  return { values, weights, mean, sd: Math.sqrt(variance) };
}

/** How many neighbouring sums share one bar of the pile, so that a bar is about `target` wide on the axis. */
export const binSize = (n, target) => Math.max(1, Math.round(target * n));

const W = 560;
const X0 = 24;
const X1 = 536;
const TOP = { title: 20, bracket: 36, top: 48, base: 150 };
const BOT = { title: 190, bracket: 206, top: 218, base: 322 };

export default function create(spec, env) {
  const compact = !!env.compact;
  const isStatic = !!spec.static || compact;
  const lo = Math.round(Array.isArray(spec.x) ? spec.x[0] : 0);
  const hi = clamp(Math.round(Array.isArray(spec.x) ? spec.x[1] : 80), lo + 4, lo + 240);
  const shapes = (Array.isArray(spec.shapes) && spec.shapes.length ? spec.shapes : [spec.shape || 'bell']).filter((k) => WEIGHT[k]);
  if (!shapes.length) shapes.push('bell');
  const sizes = (Array.isArray(spec.sizes) && spec.sizes.length ? spec.sizes : [spec.n || 16]).map((k) => clamp(Math.round(k), 1, 400));
  const cap = clamp(Math.round(spec.max || 5000), 10, 20000);
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const noun = spec.noun || 'values';
  const names = { ...SHAPE_NAMES, ...(spec.shapeLabels || {}) };
  let shape = shapes.includes(spec.shape) ? spec.shape : shapes[0];
  let n = sizes.includes(spec.n) ? spec.n : sizes[0];
  let readOnly = !!env.readOnly;

  const pops = {};
  for (const k of shapes) {
    const p = population(k, lo, hi);
    const cum = [];
    p.weights.reduce((t, w, i) => (cum[i] = t + w), 0);
    pops[k] = { ...p, cum, peak: Math.max(...p.weights) };
  }
  const target = (hi - lo) / 160;
  /** One pile of averages per population and sample size. */
  const piles = {};
  const pileOf = (k, size) => {
    const key = `${k}:${size}`;
    if (!piles[key]) {
      const m = binSize(size, target);
      piles[key] = { m, bins: new Array(Math.floor((size * (hi - lo)) / m) + 1).fill(0), count: 0, sum: 0, sumSq: 0, last: null, lastBin: -1, tallest: 0 };
    }
    return piles[key];
  };
  const clearPile = (k, size) => { delete piles[`${k}:${size}`]; };

  function drawOne(k, size) {
    const pop = pops[k];
    const pile = pileOf(k, size);
    const picked = [];
    let total = 0;
    for (let i = 0; i < size; i++) {
      const u = env.rng.next();
      let a = 0;
      let b = pop.cum.length - 1;
      while (a < b) { const mid = (a + b) >> 1; if (pop.cum[mid] > u) b = mid; else a = mid + 1; }
      picked.push(pop.values[a]);
      total += pop.values[a];
    }
    const avg = total / size;
    const bin = Math.floor((total - size * lo) / pile.m);
    pile.bins[bin]++;
    if (pile.bins[bin] > pile.tallest) pile.tallest = pile.bins[bin];
    pile.count++;
    pile.sum += avg;
    pile.sumSq += avg * avg;
    pile.last = { values: picked, mean: avg };
    pile.lastBin = bin;
  }
  function fill(k, size, want) {
    const goal = clamp(Math.round(Number(want) || 0), 0, cap);
    if (pileOf(k, size).count > goal) clearPile(k, size);
    while (pileOf(k, size).count < goal) drawOne(k, size);
  }

  const statsOf = (pile) => {
    if (pile.count < 2) return [null, null];
    const m = pile.sum / pile.count;
    return [m, Math.sqrt(Math.max(0, pile.sumSq / pile.count - m * m))];
  };
  function getState() {
    const pile = pileOf(shape, n);
    const [m, sd] = statsOf(pile);
    const counts = {};
    for (const k of shapes) { counts[k] = {}; for (const size of sizes) counts[k][size] = pileOf(k, size).count; }
    return {
      shape, n, count: pile.count, counts,
      mean: m == null ? null : tidy(m, 3), sd: sd == null ? null : tidy(sd, 3),
      se: tidy(pops[shape].sd / Math.sqrt(n), 4), popMean: tidy(pops[shape].mean, 3), popSd: tidy(pops[shape].sd, 3),
      last: pile.last ? { values: pile.last.values.slice(), mean: tidy(pile.last.mean, 3) } : null,
    };
  }

  /* ------------------------------------------------------------ the figure */
  const fr = frame({ width: W, height: compact ? 330 : 366, compact, label: spec.alt || 'Samples drawn from a population, and the pile of their averages' });
  const { svg } = fr;
  const px = (v) => X0 + ((v - (lo - 1)) / (hi - lo + 2)) * (X1 - X0);
  const num = (v, d = 1) => formatNumber(v, d);
  const big = (v) => v.toLocaleString('en-US');

  const gStatic = s('g');
  const gPop = s('g');
  const gPile = s('g');
  const gMarks = s('g');
  const gText = s('g');   // titles sit on top, so that their halo keeps them readable over the marker lines
  svg.append(gStatic, gPop, gPile, gMarks, gText);

  for (const base of [TOP.base, BOT.base]) gStatic.appendChild(s('line.axis-line', { x1: X0, x2: X1, y1: base, y2: base }));
  const step = niceStep(hi - lo, 8);
  for (const v of ticks(lo, hi, step)) {
    gStatic.appendChild(s('line.axis-line', { x1: px(v), x2: px(v), y1: TOP.base, y2: TOP.base + 4, 'stroke-width': 1.5 }));
    gStatic.appendChild(s('line.axis-line', { x1: px(v), x2: px(v), y1: BOT.base, y2: BOT.base + 5, 'stroke-width': 1.5 }));
    if (!compact) gStatic.appendChild(s('text.tick-label', { x: px(v), y: BOT.base + 19, 'text-anchor': 'middle' }, String(v)));
  }
  if (spec.xLabel && !compact) gStatic.appendChild(s('text.axis-label', { x: (X0 + X1) / 2, y: BOT.base + 38, 'text-anchor': 'middle' }, spec.xLabel));
  const topTitle = s('text.fig-label', { x: X0, y: TOP.title });
  const topNote = s('text.fig-label', { x: X1, y: TOP.title, 'text-anchor': 'end', style: `fill:${hue('blue', 'text')}` });
  const botTitle = s('text.fig-label', { x: X0, y: BOT.title });
  const botNote = s('text.fig-label', { x: X1, y: BOT.title, 'text-anchor': 'end', style: `fill:${hue('violet', 'text')}` });
  if (!compact) gText.append(topTitle, topNote, botTitle, botNote);

  const bracket = (y, from, to, color) => {
    const a = clamp(px(from), X0, X1);
    const b = clamp(px(to), X0, X1);
    return s('path', { d: `M${a} ${y - 6}V${y + 6}M${a} ${y}H${b}M${b} ${y - 6}V${y + 6}`, fill: 'none', stroke: hue(color), 'stroke-width': 3, 'stroke-linecap': 'round' });
  };

  function draw() {
    const pop = pops[shape];
    const pile = pileOf(shape, n);
    const [, sdSeen] = statsOf(pile);
    const se = pop.sd / Math.sqrt(n);

    // the population: one outline, filled
    gPop.replaceChildren();
    const k = (TOP.base - TOP.top) / pop.peak;
    let d = `M${px(lo - 0.5).toFixed(1)} ${TOP.base}`;
    pop.values.forEach((v, i) => { const y = (TOP.base - pop.weights[i] * k).toFixed(1); d += `V${y}H${px(v + 0.5).toFixed(1)}`; });
    d += `V${TOP.base}Z`;
    gPop.appendChild(s('path', { d, fill: hue('blue', 'soft'), stroke: hue('blue'), 'stroke-width': 2, 'stroke-linejoin': 'round' }));

    // the pile of averages
    gPile.replaceChildren();
    const unitH = Math.min(9, (BOT.base - BOT.top) / Math.max(1, pile.tallest));
    const barW = Math.max(1.2, (pile.m / n) * ((X1 - X0) / (hi - lo + 2)));
    let bars = '';
    pile.bins.forEach((c, b) => {
      if (!c) return;
      const left = px(lo + (b * pile.m - 0.5) / n);
      bars += `M${left.toFixed(2)} ${BOT.base}v${(-c * unitH).toFixed(2)}h${barW.toFixed(2)}V${BOT.base}Z`;
    });
    if (bars) gPile.appendChild(s('path', { d: bars, fill: hue('violet'), stroke: 'var(--surface)', 'stroke-width': barW > 2.4 ? 0.6 : 0 }));

    // markers: the true mean, the latest sample, the two spreads
    gMarks.replaceChildren();
    const mx = px(pop.mean);
    gMarks.appendChild(s('line', { x1: mx, x2: mx, y1: TOP.top - 4, y2: BOT.base, stroke: 'var(--ink)', 'stroke-width': 1.8, 'stroke-dasharray': '5 5', opacity: 0.75 }));
    if (pile.last && !compact && !spec.static) {
      const seen = new Map();
      const tight = pile.last.values.length > 40 ? 5 : 6.4;
      for (const v of pile.last.values) {
        const level = seen.get(v) || 0;
        seen.set(v, level + 1);
        gMarks.appendChild(s('circle', { cx: px(v), cy: TOP.base - 5 - level * tight, r: 3.4, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      }
      const ax = px(pile.last.mean);
      gMarks.appendChild(s('line', { x1: ax, x2: ax, y1: TOP.base + 12, y2: BOT.base, stroke: hue('orange'), 'stroke-width': 2, opacity: 0.9 }));
      gMarks.appendChild(s('path', { d: `M${ax - 7} ${TOP.base + 2}H${ax + 7}L${ax} ${TOP.base + 14}Z`, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      const side = ax > (X0 + X1) / 2 ? -1 : 1;
      gMarks.appendChild(s('text.fig-label-sm', { x: ax + side * 12, y: TOP.base + 21, 'text-anchor': side > 0 ? 'start' : 'end' }, `sample average ${num(pile.last.mean)}`));
      // the newest average, picked out in the pile
      const left = px(lo + (pile.lastBin * pile.m - 0.5) / n);
      const top = BOT.base - pile.bins[pile.lastBin] * unitH;
      gMarks.appendChild(s('rect', { x: left - 0.5, y: top, width: barW + 1, height: Math.max(3, unitH), fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 1 }));
    }
    const showSd = spec.spreads && !compact;
    if (showSd) {
      gMarks.appendChild(bracket(TOP.bracket, pop.mean - pop.sd, pop.mean + pop.sd, 'blue'));
      const lower = spec.spreads === 'exact' ? se : (pile.count >= 10 ? sdSeen : null);
      if (lower != null) gMarks.appendChild(bracket(BOT.bracket, pop.mean - lower, pop.mean + lower, 'violet'));
      topNote.textContent = `SD ${num(pop.sd, pop.sd < 10 ? 1 : 0)}${unit}`;
      botNote.textContent = lower == null ? '' : `SD ${num(lower, spec.spreads === 'exact' ? (lower < 10 ? 2 : 1) : 2)}${unit}`;
    } else {
      topNote.textContent = '';
      botNote.textContent = '';
    }
    topTitle.textContent = spec.dataLabel || 'The population, one value at a time';
    botTitle.textContent = pile.count
      ? `${big(pile.count)} ${pile.count === 1 ? 'average' : 'averages'} of ${n === 1 ? `1 ${noun.replace(/s$/, '')}` : `${n} ${noun}`}`
      : `Averages of ${n} ${noun} land here`;

    for (const [key, btn] of shapeBtns) btn.setAttribute('aria-pressed', String(key === shape));
    for (const [key, btn] of sizeBtns) btn.setAttribute('aria-pressed', String(key === n));
    const full = pile.count >= cap;
    for (const btn of drawBtns) btn.disabled = readOnly || full;
    if (resetBtn) resetBtn.disabled = readOnly || !pile.count;
    const [mSeen] = statsOf(pile);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Population: ${names[shape]}, mean ${num(pop.mean)}, standard deviation ${num(pop.sd)}. `
      + `Sample size ${n}. ${pile.count} ${pile.count === 1 ? 'sample' : 'samples'} drawn`
      + (mSeen != null ? `; their averages have mean ${num(mSeen)} and standard deviation ${num(sdSeen, 2)}.` : '.'));
  }

  /* -------------------------------------------------------------- controls */
  const shapeBtns = [];
  const sizeBtns = [];
  const drawBtns = [];
  let resetBtn = null;
  const changed = () => { draw(); env.onChange(getState()); };
  if (!isStatic) {
    const picker = (label, items, into, onPick) => {
      const box = h('div.sx-pick', h('span.sx-pick-label', label));
      for (const [key, text] of items) {
        const btn = button(text, () => { if (readOnly) return; onPick(key); play('select'); changed(); });
        btn.setAttribute('aria-pressed', 'false');
        into.push([key, btn]);
        box.appendChild(btn);
      }
      fr.controls.appendChild(box);
    };
    if (shapes.length > 1) picker(spec.shapeLabel || 'Population:', shapes.map((k) => [k, names[k]]), shapeBtns, (k) => { shape = k; });
    if (sizes.length > 1) picker(spec.sizeLabel || 'Sample size:', sizes.map((k) => [k, String(k)]), sizeBtns, (k) => { n = k; });
    const take = (times) => {
      if (readOnly) return;
      const pile = pileOf(shape, n);
      const room = cap - pile.count;
      if (room <= 0) { env.announce('This pile is full. Reset it, or choose another setting.'); return; }
      for (let i = 0; i < Math.min(times, room); i++) drawOne(shape, n);
      play(times > 1 ? 'drop' : 'tick');
      const now = pileOf(shape, n);
      env.announce(times === 1
        ? `Sample average ${num(now.last.mean)}. ${now.count} drawn so far.`
        : `${now.count} samples drawn. Their averages have standard deviation ${num(statsOf(now)[1], 2)}.`);
      changed();
    };
    (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10, 1000]).forEach((times, i) => {
      const btn = button(`Draw ${big(times)}`, () => take(times), i === 0 ? { icon: 'plus', variant: 'primary' } : { icon: 'layers' });
      drawBtns.push(btn);
      fr.buttons.appendChild(btn);
    });
    resetBtn = button('Reset', () => { if (readOnly) return; clearPile(shape, n); changed(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(resetBtn);
  }

  if (spec.start) fill(shape, n, spec.start);
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.counts && typeof next.counts === 'object') {
        for (const k of shapes) {
          if (!next.counts[k]) continue;
          for (const size of sizes) if (next.counts[k][size] != null) fill(k, size, next.counts[k][size]);
        }
      }
      if (shapes.includes(next.shape)) shape = next.shape;
      if (sizes.includes(Number(next.n))) n = Number(next.n);
      if (typeof next.count === 'number') fill(shape, n, next.count);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const [, btn] of [...shapeBtns, ...sizeBtns]) btn.disabled = readOnly;
      draw();
    },
  };
}

export const examples = [
  {
    title: 'sample-means — averages of 16 from a bell-shaped population',
    spec: { type: 'sample-means', x: [0, 80], n: 16, start: 400, spreads: true, unit: 'min', xLabel: 'commute (minutes)', dataLabel: 'Individual commutes', noun: 'commuters' },
  },
  {
    title: 'sample-means — three populations, four sample sizes',
    spec: { type: 'sample-means', x: [0, 80], shapes: ['bell', 'skew', 'twin'], shape: 'skew', sizes: [1, 2, 5, 30], n: 5, start: 1000 },
  },
];
