/**
 * interval-rain — what "95% confident" means, shown by doing it a hundred
 * times. Each press draws a random sample from a bell-shaped population,
 * works out "average ± a multiple of the standard error" and adds that
 * interval to the picture. Intervals that catch the true mean are blue;
 * the ones that miss are red and flagged under the axis. The learner can
 * change the confidence level (the same samples get wider or narrower
 * intervals) and the sample size.
 *
 * {
 *   type: 'interval-rain',
 *   mean: 40, sd: 12,             // the population: its true mean is what every interval is trying to catch
 *   n: 64,                        // sample size at the start
 *   sizes: [16, 64, 256],         // optional: adds a picker
 *   level: 95,                    // confidence level: 68 (± 1 SE), 95 (± 2 SE) or 99.7 (± 3 SE); also 80, 90, 99
 *   levels: [68, 95, 99.7],       // optional: adds a picker
 *   buttons: [1, 10, 100],        // how many samples each button draws
 *   max: 100,                     // most intervals the picture holds
 *   start: 0,                     // intervals already drawn when the figure appears
 *   truth: true,                  // false: no line at the true mean, and hits and misses are not told apart
 *                                 //   'reveal': the line appears once the step is resolved (the widget is locked)
 *   fixed: [[41.2, 1.5], …],      // a fixed list of [sample average, standard error] instead of random samples:
 *                                 //   for pictures whose numbers are quoted in the text (no buttons are shown)
 *   band: 0,                      // stretch interval number `band` (counting from 0) across the picture and count
 *                                 //   how many of the OTHER sample averages fall inside it
 *   y: [28, 52],                  // optional ends of the vertical axis
 *   unit: 'min',                  // appended to numbers
 *   what: 'true mean',            // what the dashed line is called
 * }
 *
 * State: { n, level, mult, count, hits, misses, coverage, margin, last, inBand, counts }
 *   mult     — how many standard errors the margin is (1, 2 or 3)
 *   count    — intervals drawn for the sample size now on show · counts: the same for every size on offer
 *   hits, misses, coverage — how many of them contain the true mean (coverage = hits / count; null before the first).
 *              Random unless `fixed` is used: never check them.
 *   margin   — mult × sd / √n: the margin of a typical interval (each interval uses its own sample's SD)
 *   last     — the newest interval: { est, se, lo, hi, hit } or null
 *   inBand   — with `band`: how many of the other sample averages lie inside that interval (else null)
 *
 * setState accepts { n, level, count, counts: { 64: 100 } }. Samples are drawn with env.rng.
 */
import { frame, button, hue, s, h, clamp, tidy, formatNumber, niceStep, ticks, clipTo, plane, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('interval-rain', `
  .widget-interval-rain .ir-pick { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-interval-rain .ir-pick-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-interval-rain .ir-pick .btn[aria-pressed='true'] { --btn-bg: var(--ink); --btn-fg: var(--paper); }
  .widget-interval-rain.is-row .ir-pick { justify-content: flex-start; }
`);

/** Standard errors either side of the estimate, for each confidence level on offer. */
export const MULTIPLIER = { 68: 1, 80: 1.28, 90: 1.645, 95: 2, 99: 2.58, 99.7: 3 };

/** Does the interval est ± mult × se contain `truth`? */
export const catches = (est, se, mult, truth) => Math.abs(est - truth) <= mult * se;

const W = 560;
const H = 330;

export default function create(spec, env) {
  const compact = !!env.compact;
  const mu = Number(spec.mean != null ? spec.mean : 40);
  const sigma = Math.max(1e-6, Number(spec.sd != null ? spec.sd : 12));
  const fixed = Array.isArray(spec.fixed) ? spec.fixed.map(([est, se]) => ({ est: Number(est), se: Number(se) })) : null;
  const sizes = (Array.isArray(spec.sizes) && spec.sizes.length && !fixed ? spec.sizes : [spec.n || 64]).map((k) => clamp(Math.round(k), 2, 2000));
  const levels = (Array.isArray(spec.levels) && spec.levels.length ? spec.levels : [spec.level || 95]).filter((v) => MULTIPLIER[v]);
  if (!levels.length) levels.push(95);
  const cap = fixed ? fixed.length : clamp(Math.round(spec.max || 100), 5, 200);
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const what = spec.what || 'true mean';
  const isStatic = !!spec.static || compact || !!fixed;
  let n = sizes.includes(spec.n) ? spec.n : sizes[0];
  let level = levels.includes(spec.level) ? spec.level : levels.includes(95) ? 95 : levels[0];
  let readOnly = !!env.readOnly;

  const piles = {};
  const pileOf = (size) => (fixed ? fixed : (piles[size] || (piles[size] = [])));
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(env.rng.next(), 1e-12))) * Math.cos(2 * Math.PI * env.rng.next());
  function drawOne(size) {
    let total = 0;
    let squares = 0;
    for (let i = 0; i < size; i++) { const v = mu + sigma * gauss(); total += v; squares += v * v; }
    const est = total / size;
    const variance = Math.max(0, (squares - size * est * est) / (size - 1));
    pileOf(size).push({ est, se: Math.sqrt(variance / size) });
  }
  function fill(size, want) {
    if (fixed) return;
    const goal = clamp(Math.round(Number(want) || 0), 0, cap);
    const pile = pileOf(size);
    if (pile.length > goal) pile.length = goal;
    while (pile.length < goal) drawOne(size);
  }

  const showTruth = () => spec.truth === 'reveal' ? readOnly : spec.truth !== false;
  const bandIndex = () => (spec.band != null && pileOf(n)[spec.band] ? Number(spec.band) : null);

  function getState() {
    const pile = pileOf(n);
    const mult = MULTIPLIER[level];
    const hits = pile.filter((p) => catches(p.est, p.se, mult, mu)).length;
    const last = pile.length ? pile[pile.length - 1] : null;
    const b = bandIndex();
    const counts = {};
    for (const size of sizes) counts[size] = pileOf(size).length;
    return {
      n, level, mult, count: pile.length, hits, misses: pile.length - hits,
      coverage: pile.length ? tidy(hits / pile.length, 4) : null,
      margin: tidy((mult * sigma) / Math.sqrt(n), 4),
      last: last ? { est: tidy(last.est, 3), se: tidy(last.se, 3), lo: tidy(last.est - mult * last.se, 3), hi: tidy(last.est + mult * last.se, 3), hit: catches(last.est, last.se, mult, mu) } : null,
      inBand: b == null ? null : pile.filter((p, i) => i !== b && Math.abs(p.est - pile[b].est) <= mult * pile[b].se).length,
      counts,
    };
  }

  /* ------------------------------------------------------------ the figure */
  const fr = frame({ width: W, height: compact ? 290 : H, compact, label: spec.alt || 'Confidence intervals from repeated samples' });
  const { svg } = fr;
  const reach = 4.4 * sigma / Math.sqrt(Math.min(...sizes));
  const yr = Array.isArray(spec.y) ? spec.y : [mu - reach, mu + reach];
  const pl = plane({ x: [0, cap], y: yr, width: W, height: compact ? 290 : H, pad: { l: 46, r: 12, t: 32, b: compact ? 14 : 44 } });
  const clip = clipTo(svg, pl);
  const num = (v, d = 1) => formatNumber(v, d);

  const gAxes = s('g');
  for (const v of ticks(yr[0], yr[1], niceStep(yr[1] - yr[0], 5))) {
    gAxes.appendChild(s('line.grid-line', { x1: pl.left, x2: pl.right, y1: pl.sy(v), y2: pl.sy(v) }));
    gAxes.appendChild(s('text.tick-label', { x: pl.left - 7, y: pl.sy(v) + 4, 'text-anchor': 'end' }, num(v, 2)));
  }
  gAxes.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.left, y1: pl.top, y2: pl.bottom }));
  gAxes.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.right, y1: pl.bottom, y2: pl.bottom }));
  if (!compact) {
    const every = cap <= 20 ? 5 : cap <= 50 ? 10 : 20;
    for (let i = every; i <= cap; i += every) gAxes.appendChild(s('text.tick-label', { x: pl.sx(i - 0.5), y: pl.bottom + 22, 'text-anchor': 'middle' }, String(i)));
    gAxes.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: H - 6, 'text-anchor': 'middle' }, spec.xLabel || 'sample number'));
  }
  const gBand = s('g', { 'clip-path': clip });
  const gLines = s('g', { 'clip-path': clip });
  const gFlags = s('g');
  const gTruth = s('g');
  const tally = s('text.fig-label', { x: pl.left, y: 20 });
  const latest = s('text.fig-label-sm', { x: pl.right, y: 20, 'text-anchor': 'end' });
  svg.append(gAxes, gBand, gLines, gFlags, gTruth);
  if (!compact) svg.append(tally, latest);

  const levelBtns = [];
  const sizeBtns = [];
  const drawBtns = [];
  let resetBtn = null;

  function draw() {
    const pile = pileOf(n);
    const mult = MULTIPLIER[level];
    const state = getState();
    const known = showTruth();
    const pitch = (pl.right - pl.left) / cap;
    const b = bandIndex();

    gBand.replaceChildren();
    if (b != null) {
      const top = pl.sy(pile[b].est + mult * pile[b].se);
      const bottom = pl.sy(pile[b].est - mult * pile[b].se);
      gBand.appendChild(s('rect', { x: pl.left, y: top, width: pl.right - pl.left, height: bottom - top, fill: hue('violet', 'soft'), stroke: hue('violet'), 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }));
    }

    gLines.replaceChildren();
    gFlags.replaceChildren();
    pile.forEach((p, i) => {
      const x = pl.sx(i + 0.5);
      const hit = catches(p.est, p.se, mult, mu);
      const miss = known && !hit;
      const newest = !fixed && i === pile.length - 1;
      const picked = i === b;
      const color = miss ? 'red' : picked ? 'violet' : 'blue';
      gLines.appendChild(s('line', {
        x1: x, x2: x, y1: pl.sy(p.est - mult * p.se), y2: pl.sy(p.est + mult * p.se),
        stroke: hue(color), 'stroke-width': Math.min(miss || picked ? 3.6 : 2.4, pitch * 0.8), 'stroke-linecap': 'round',
      }));
      const r = Math.min(newest || picked ? 3.6 : 2.2, pitch * 0.5);
      gLines.appendChild(s('circle', { cx: x, cy: pl.sy(p.est), r, fill: newest ? hue('yellow') : 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': newest ? 1.2 : 0 }));
      // a miss is flagged under the axis as well, so that colour is not the only sign
      if (miss && !compact) gFlags.appendChild(s('path', { d: `M${x - 3.2} ${pl.bottom + 9}L${x} ${pl.bottom + 3}L${x + 3.2} ${pl.bottom + 9}Z`, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 0.8 }));
    });

    gTruth.replaceChildren();
    if (known) {
      const y = pl.sy(mu);
      gTruth.appendChild(s('line', { x1: pl.left, x2: pl.right, y1: y, y2: y, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
      if (!compact) gTruth.appendChild(s('text.fig-label-sm', { x: pl.right - 4, y: pl.top + 13, 'text-anchor': 'end' }, `dashed line: ${what} ${num(mu, 2)}${unit}`));
    }

    if (!pile.length) tally.textContent = 'No samples yet';
    else if (b != null) tally.textContent = `Inside the band: ${state.inBand} of the other ${pile.length - 1}`;
    else if (known) tally.textContent = `Caught the ${what}: ${state.hits} of ${pile.length}`;
    else tally.textContent = `${pile.length} ${pile.length === 1 ? 'interval' : 'intervals'}`;
    latest.textContent = state.last && !fixed ? `latest: ${num(state.last.lo)} to ${num(state.last.hi)}${unit}` : '';

    for (const [key, btn] of levelBtns) btn.setAttribute('aria-pressed', String(key === level));
    for (const [key, btn] of sizeBtns) btn.setAttribute('aria-pressed', String(key === n));
    for (const btn of drawBtns) btn.disabled = readOnly || pile.length >= cap;
    if (resetBtn) resetBtn.disabled = readOnly || !pile.length;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${pile.length} ${pile.length === 1 ? 'interval' : 'intervals'} at ${level} percent confidence from samples of ${n}.`
      + (known && pile.length ? ` ${state.hits} contain the ${what} of ${num(mu, 2)}, ${state.misses} miss it.` : '')
      + (b != null ? ` Interval ${b + 1} runs from ${num(pile[b].est - mult * pile[b].se)} to ${num(pile[b].est + mult * pile[b].se)}; ${state.inBand} of the other ${pile.length - 1} sample averages lie inside it.` : '')
      + (state.last && !fixed ? ` The latest runs from ${num(state.last.lo)} to ${num(state.last.hi)}.` : ''));
  }

  /* -------------------------------------------------------------- controls */
  const changed = () => { draw(); env.onChange(getState()); };
  const picker = (label, items, into, onPick) => {
    const box = h('div.ir-pick', h('span.ir-pick-label', label));
    for (const [key, text] of items) {
      const btn = button(text, () => { if (readOnly) return; onPick(key); play('select'); changed(); });
      btn.setAttribute('aria-pressed', 'false');
      into.push([key, btn]);
      box.appendChild(btn);
    }
    fr.controls.appendChild(box);
  };
  if (!compact && !spec.static) {
    if (levels.length > 1) picker(spec.levelLabel || 'Confidence:', levels.map((v) => [v, `${v}%`]), levelBtns, (v) => { level = v; });
    if (sizes.length > 1) picker(spec.sizeLabel || 'Sample size:', sizes.map((k) => [k, String(k)]), sizeBtns, (k) => { n = k; });
  }
  if (!isStatic) {
    const take = (times) => {
      if (readOnly) return;
      const pile = pileOf(n);
      const room = cap - pile.length;
      if (room <= 0) { env.announce('The picture is full. Press Reset to start again.'); return; }
      for (let i = 0; i < Math.min(times, room); i++) drawOne(n);
      play(times > 1 ? 'drop' : 'tick');
      const st = getState();
      env.announce(`Interval from ${num(st.last.lo)} to ${num(st.last.hi)}.${showTruth() ? ` ${st.hits} of ${st.count} contain the ${what}.` : ''}`);
      changed();
    };
    (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10, 100]).forEach((times, i) => {
      const btn = button(`Draw ${times}`, () => take(times), i === 0 ? { icon: 'plus', variant: 'primary' } : { icon: 'layers' });
      drawBtns.push(btn);
      fr.buttons.appendChild(btn);
    });
    resetBtn = button('Reset', () => { if (readOnly) return; pileOf(n).length = 0; changed(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(resetBtn);
  }

  if (spec.start) fill(n, spec.start);
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.counts && typeof next.counts === 'object') for (const size of sizes) if (next.counts[size] != null) fill(size, next.counts[size]);
      if (sizes.includes(Number(next.n))) n = Number(next.n);
      if (levels.includes(Number(next.level))) level = Number(next.level);
      if (typeof next.count === 'number') fill(n, next.count);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const [, btn] of [...levelBtns, ...sizeBtns]) btn.disabled = readOnly;
      draw();
    },
  };
}

export const examples = [
  {
    title: 'interval-rain — a hundred 95% intervals',
    spec: { type: 'interval-rain', mean: 40, sd: 12, n: 64, start: 100, levels: [68, 95, 99.7], unit: 'min' },
  },
  {
    title: 'interval-rain — a fixed set, with the first interval stretched into a band',
    spec: { type: 'interval-rain', mean: 40, sd: 12, n: 64, band: 0, unit: 'min', fixed: [[42.6, 1.5], [39.1, 1.4], [40.8, 1.6], [38.2, 1.5], [41.5, 1.5], [36.6, 1.4], [40.1, 1.5], [43.9, 1.6], [39.6, 1.5], [41.0, 1.4]] },
  },
];
