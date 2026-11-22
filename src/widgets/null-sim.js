/**
 * null-sim — a hypothesis test by simulation. The learner has one real
 * result. The widget builds the world in which "nothing is going on" (the
 * null hypothesis), runs it again and again, and piles the results into a
 * histogram. The real result is marked on it, and the share of simulated
 * results at least as extreme is the p-value. Three kinds of test:
 *
 *   'coin'     a count of successes in n tries, each with chance p
 *   'shuffle'  the difference between two groups, tested by dealing the group labels out again at random
 *              (a permutation test), either for measurements or for yes/no counts
 *
 * {
 *   type: 'null-sim',
 *   kind: 'coin',
 *   n: 20, p: 0.5,                  // the null world: n tries, each a success with chance p
 *   observed: 15,                   // the real result: how many successes
 *   observedRange: [10, 20],        // optional: adds a slider that moves the real result
 *   success: 'heads',               // what a success is called: "15 or more heads"
 *
 *   kind: 'shuffle',
 *   groups: [                       // measurements (whole numbers, or one decimal place) …
 *     { label: 'fertiliser', values: [58, 61, 64] }, { label: 'plain', values: [52, 55, 60] } ],
 *   groups: [                       // … or yes/no counts
 *     { label: 'page B', n: 1000, hits: 130 }, { label: 'page A', n: 1000, hits: 100 } ],
 *   unit: 'cm',                     // unit of the measurements (yes/no counts are compared in percentage points)
 *
 *   tail: 'upper',                  // which results count as "at least as extreme": 'upper' (this large or larger)
 *                                   //   or 'lower' (this small or smaller)
 *   buttons: [1, 100, 1000],        // how many simulated worlds each button adds
 *   max: 10000,                     // most worlds the pile holds
 *   start: 0,                       // worlds already simulated when the figure appears
 *   exact: false,                   // true: also print the long-run share, worked out exactly
 *   realLabel: 'your coin',         // what the real result is called on the chart (default 'real result')
 *   verb: 'Flip', many: 'runs',     // wording of the buttons and of the count: "Flip 100 runs"
 *   static: false,                  // true: a picture without buttons
 * }
 *
 * The statistic of a shuffle test is (first group) − (second group): the difference between the two averages,
 * or between the two percentages. Put the treated group first.
 *
 * State: { kind, observed, trials, extreme, share, exact, tail }
 *   observed — the real result: successes (coin), or the difference between the groups (shuffle)
 *   trials   — worlds simulated so far · extreme: how many of them were at least as extreme as the real result
 *   share    — extreme / trials: the simulated p-value (null before the first trial). Random: never check it.
 *   exact    — the exact chance, in the null world, of a result at least as extreme: a binomial sum, a hypergeometric
 *              sum, or a count over every way of dealing the labels (null when that would be too many to count)
 *
 * setState accepts { trials, observed }. Simulations use env.rng: write checks about `trials`, `observed` and `exact`.
 */
import { frame, button, readout, sliderRow, hue, s, clamp, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('null-sim', `
  .widget-null-sim .ns-dealt { transition: opacity 0.15s ease; }
`);

/* ------------------------------------------------------------ exact maths */

/** Chances of 0, 1, …, n successes in n tries with chance p. */
export function binomialDist(n, p) {
  const out = new Array(n + 1).fill(0);
  if (p <= 0) { out[0] = 1; return out; }
  if (p >= 1) { out[n] = 1; return out; }
  let logC = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) logC += Math.log(n - k + 1) - Math.log(k);
    out[k] = Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  return out;
}

/** Chances of 0, 1, …, n1 marked items when n1 of N items are picked at random and K of the N are marked. */
export function hypergeometricDist(N, K, n1) {
  const logFact = [0];
  for (let i = 1; i <= N; i++) logFact.push(logFact[i - 1] + Math.log(i));
  const logChoose = (a, b) => (b < 0 || b > a ? -Infinity : logFact[a] - logFact[b] - logFact[a - b]);
  const out = [];
  for (let k = 0; k <= n1; k++) out.push(Math.exp(logChoose(K, k) + logChoose(N - K, n1 - k) - logChoose(N, n1)));
  return out;
}

/**
 * Every way of picking `size` of the whole numbers in `values`, sorted by the total of the ones picked.
 * @returns {{ min: number, probs: number[] } | null} probs[i] is the share of ways whose total is min + i
 */
export function subsetSumDist(values, size) {
  const N = values.length;
  const lowest = Math.min(...values);
  const shifted = values.map((v) => v - lowest);
  const span = shifted.reduce((a, b) => a + b, 0);
  if (N > 40 || span * size > 2e6) return null;
  // ways[k][t]: how many ways to pick k of the values seen so far with (shifted) total t
  const ways = Array.from({ length: size + 1 }, () => new Float64Array(span + 1));
  ways[0][0] = 1;
  let seen = 0;
  for (const v of shifted) {
    seen += v;
    for (let k = size; k >= 1; k--) {
      const from = ways[k - 1];
      const to = ways[k];
      for (let t = Math.min(span, seen); t >= v; t--) if (from[t - v]) to[t] += from[t - v];
    }
  }
  let total = 0;
  for (const w of ways[size]) total += w;
  return { min: lowest * size, probs: Array.from(ways[size], (w) => w / total) };
}

/* ------------------------------------------------------------- the widget */

const W = 560;
const X0 = 24;
const X1 = 536;

export default function create(spec, env) {
  const compact = !!env.compact;
  const isStatic = !!spec.static || compact;
  const kind = spec.kind === 'shuffle' ? 'shuffle' : 'coin';
  const lower = spec.tail === 'lower';
  const cap = clamp(Math.round(spec.max || 10000), 10, 100000);
  const big = (v) => v.toLocaleString('en-US');
  const num = (v, d = 1) => formatNumber(v, d);
  let readOnly = !!env.readOnly;

  /*
   * Every kind boils down to a whole-number statistic t:
   *   coin              t = successes
   *   shuffle, values   t = total of the first group (times 10 if the data have a decimal place)
   *   shuffle, counts   t = "yes" answers in the first group
   * `show(t)` turns it into the number the learner reads; `dist` is its exact distribution in the null world.
   */
  let tMin = 0;
  let tMax = 1;
  let tObs = 0;
  let dist = null;          // { min, probs }
  let show = (t) => t;
  let simulate = () => 0;
  let sdT = 1;
  let centreT = 0;
  const binary = kind === 'shuffle' && spec.groups && spec.groups[0] && spec.groups[0].values == null;
  const groups = kind === 'shuffle' ? (spec.groups || []).slice(0, 2) : [];
  let scale = 1;
  let pool = [];            // shuffle, values: every (scaled) measurement, first group first
  let dealt = null;         // shuffle, values: positions in `pool` that the latest shuffle gave to the first group
  let lastT = null;
  let lastRun = [];         // coin: the tries of the latest run, in order

  if (kind === 'coin') {
    const n = clamp(Math.round(spec.n || 20), 1, 2000);
    const p = clamp(Number(spec.p != null ? spec.p : 0.5), 0, 1);
    tMin = 0; tMax = n;
    tObs = clamp(Math.round(spec.observed != null ? spec.observed : Math.ceil(n * p)), 0, n);
    dist = { min: 0, probs: binomialDist(n, p) };
    centreT = n * p;
    sdT = Math.sqrt(n * p * (1 - p)) || 1;
    simulate = () => {
      let t = 0;
      lastRun = [];
      for (let i = 0; i < n; i++) { const hit = env.rng.next() < p; lastRun.push(hit); if (hit) t++; }
      return t;
    };
  } else if (binary) {
    const [a, b] = groups;
    const N = a.n + b.n;
    const K = a.hits + b.hits;
    tMin = Math.max(0, K - b.n); tMax = Math.min(K, a.n);
    tObs = a.hits;
    dist = { min: 0, probs: hypergeometricDist(N, K, a.n) };
    centreT = (K * a.n) / N;
    sdT = Math.sqrt((a.n * K * (N - K) * (N - a.n)) / (N * N * Math.max(1, N - 1))) || 1;
    show = (t) => 100 * (t / a.n - (K - t) / b.n);
    simulate = () => {
      let left = K;
      let t = 0;
      for (let i = 0; i < a.n; i++) if (env.rng.next() * (N - i) < left) { t++; left--; }
      return t;
    };
  } else {
    const [a, b] = groups;
    const all = [...a.values, ...b.values];
    scale = all.every((v) => Number.isInteger(v)) ? 1 : 10;
    pool = all.map((v) => Math.round(v * scale));
    const n1 = a.values.length;
    const n2 = b.values.length;
    const total = pool.reduce((x, y) => x + y, 0);
    const sorted = pool.slice().sort((x, y) => x - y);
    tMin = sorted.slice(0, n1).reduce((x, y) => x + y, 0);
    tMax = sorted.slice(-n1).reduce((x, y) => x + y, 0);
    tObs = pool.slice(0, n1).reduce((x, y) => x + y, 0);
    dist = subsetSumDist(pool, n1);
    const N = pool.length;
    const avg = total / N;
    const variance = pool.reduce((x, v) => x + (v - avg) ** 2, 0) / N;
    centreT = avg * n1;
    sdT = Math.sqrt((n1 * variance * (N - n1)) / Math.max(1, N - 1)) || 1;
    show = (t) => t / (scale * n1) - (total - t) / (scale * n2);
    const order = pool.map((_, i) => i);
    simulate = () => {
      let t = 0;
      for (let i = 0; i < n1; i++) {
        const j = i + Math.floor(env.rng.next() * (N - i));
        const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
        t += pool[order[i]];
      }
      dealt = order.slice(0, n1);
      return t;
    };
  }

  const isExtreme = (t) => (lower ? t <= tObs : t >= tObs);
  function exactShare() {
    if (!dist) return null;
    let total = 0;
    dist.probs.forEach((pr, i) => { if (isExtreme(dist.min + i)) total += pr; });
    return total;
  }

  const counts = new Map();   // statistic -> how many simulated worlds gave it
  let trials = 0;
  const run = (times) => {
    for (let i = 0; i < times; i++) { lastT = simulate(); counts.set(lastT, (counts.get(lastT) || 0) + 1); trials++; }
  };
  const reset = () => { counts.clear(); trials = 0; lastT = null; dealt = null; lastRun = []; };
  const extremeCount = () => { let c = 0; for (const [t, k] of counts) if (isExtreme(t)) c += k; return c; };

  function getState() {
    const extreme = extremeCount();
    const exact = exactShare();
    return {
      kind, observed: tidy(show(tObs), 4), trials, extreme,
      share: trials ? tidy(extreme / trials, 5) : null,
      exact: exact == null ? null : tidy(exact, 6),
      tail: lower ? 'lower' : 'upper',
    };
  }

  /* -------------------------------------------------------------- geometry */
  const coinN = kind === 'coin' ? tMax : 0;
  const coinRows = coinN > 60 ? 0 : coinN > 30 ? 2 : 1;
  const topH = compact ? 0 : kind === 'coin' ? 28 + coinRows * 22 : binary ? 78 : 112;
  const histTop = topH + (compact ? 12 : 34);
  const histBase = histTop + (compact ? 120 : 148);
  const H = histBase + (compact ? 10 : 44);
  const fr = frame({ width: W, height: H, compact, label: spec.alt || 'A null world, simulated many times' });
  const { svg } = fr;

  const gTop = s('g');
  const gHist = s('g');
  const gAxis = s('g');
  const gMark = s('g');
  const caption = s('text.fig-label', { x: X0, y: 18 });
  const captionRight = s('text.fig-label-sm', { x: X1, y: 18, 'text-anchor': 'end' });
  const histTitle = s('text.fig-label', { x: X0, y: histTop - 12 });
  svg.append(gTop, gAxis, gHist, gMark);
  if (!compact) svg.append(caption, captionRight, histTitle);

  const unit = kind === 'coin' ? '' : binary ? ' points' : spec.unit ? ` ${spec.unit}` : '';
  const digits = kind === 'coin' ? 0 : spec.digits != null ? spec.digits : 1;
  const signed = (v) => (kind === 'coin' ? String(v) : `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), digits)}`);
  const success = spec.success || 'successes';
  const realLabel = spec.realLabel || 'real result';
  const many = spec.many || (kind === 'coin' ? 'runs' : 'shuffles');
  const verb = spec.verb || (kind === 'coin' ? 'Run' : 'Shuffle');

  const roTrials = readout(`${many} so far`, { digits: 0 });
  const roTail = readout('', {});
  const roExact = readout('in the long run', { color: 'orange' });
  if (!compact) {
    fr.readouts.append(roTrials.el, roTail.el);
    if (spec.exact) fr.readouts.appendChild(roExact.el);
  }
  const tailLabel = roTail.el.firstChild;

  /* ---------------------------------------------------------- the top panel */
  function drawTop() {
    gTop.replaceChildren();
    if (compact) return;
    if (kind === 'coin') {
      caption.textContent = lastT == null ? `One ${many.replace(/s$/, '')} = ${coinN} tries in the null world` : `Latest ${many.replace(/s$/, '')}: ${lastT} ${success}`;
      if (!coinRows) return;
      const perRow = Math.ceil(coinN / coinRows);
      const pitch = Math.min(24, (X1 - X0) / perRow);
      const r = Math.min(9, pitch / 2 - 1.5);
      const left = (W - pitch * perRow) / 2;
      for (let i = 0; i < coinN; i++) {
        const on = lastT != null && !!lastRun[i];
        gTop.appendChild(s('circle', {
          cx: left + pitch * ((i % perRow) + 0.5), cy: 38 + Math.floor(i / perRow) * 22, r,
          fill: on ? hue('orange') : 'var(--surface)', stroke: lastT == null ? 'var(--hair)' : 'var(--ink)', 'stroke-width': on ? 1.8 : 1.4,
        }));
      }
      return;
    }
    const [a, b] = groups;
    const real = lastT == null;
    caption.textContent = real ? 'The real experiment' : `Shuffle ${big(trials)}: labels dealt at random`;
    const t = real ? tObs : lastT;
    captionRight.textContent = `difference ${signed(show(t))}${unit}`;
    if (binary) {
      const K = a.hits + b.hits;
      const rows = [[a, t], [b, K - t]];
      const top = Math.max(a.hits / a.n, b.hits / b.n, K / (a.n + b.n)) * 1.7;
      rows.forEach(([g, hits], i) => {
        const y = 30 + i * 24;
        const rate = hits / g.n;
        const x0 = 118;
        const full = X1 - 190 - x0;
        gTop.appendChild(s('text.fig-label-sm', { x: X0, y: y + 13 }, g.label));
        gTop.appendChild(s('rect', { x: x0, y, width: full, height: 17, rx: 4, fill: 'var(--sunken)' }));
        gTop.appendChild(s('rect', { x: x0, y, width: Math.max(2, Math.min(1, rate / top) * full), height: 17, rx: 4, fill: hue(i ? 'blue' : 'orange'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
        gTop.appendChild(s('text.fig-label-sm', { x: X1, y: y + 13, 'text-anchor': 'end' }, `${big(hits)} of ${big(g.n)} = ${num(100 * rate, 1)}%`));
      });
      return;
    }
    // measurements: two rows of dots; the marker shows which group a value REALLY belongs to
    const n1 = a.values.length;
    const inFirst = new Set(real ? pool.map((_, i) => i).slice(0, n1) : dealt);
    const lo = Math.min(...pool);
    const hi = Math.max(...pool);
    const pad = Math.max(1, (hi - lo) * 0.08);
    const left = 132;
    const vx = (v) => left + ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (X1 - 8 - left);
    const rowsY = [48, 78];
    [a, b].forEach((g, i) => {
      gTop.appendChild(s('text.fig-label-sm', { x: X0, y: rowsY[i] + 4 }, g.label));
      gTop.appendChild(s('line', { x1: left, x2: X1, y1: rowsY[i] + 9, y2: rowsY[i] + 9, stroke: 'var(--hair)', 'stroke-width': 1.5 }));
    });
    const piles = [new Map(), new Map()];
    const sums = [0, 0];
    const sizes = [0, 0];
    pool.forEach((v, i) => {
      const row = inFirst.has(i) ? 0 : 1;
      const level = piles[row].get(v) || 0;
      piles[row].set(v, level + 1);
      sums[row] += v; sizes[row]++;
      const x = vx(v);
      const y = rowsY[row] + 2 - level * 5;
      const mine = i < n1;   // really in the first group
      gTop.appendChild(mine
        ? s('circle', { class: 'ns-dealt', cx: x, cy: y, r: 5.2, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 1.5 })
        : s('rect', { class: 'ns-dealt', x: x - 4.6, y: y - 4.6, width: 9.2, height: 9.2, rx: 1.5, fill: hue('blue', 'soft'), stroke: hue('blue'), 'stroke-width': 2 }));
    });
    [0, 1].forEach((row) => {
      const x = vx(sums[row] / sizes[row]);
      gTop.appendChild(s('line', { x1: x, x2: x, y1: rowsY[row] - 13, y2: rowsY[row] + 13, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    });
    const step = niceStep((hi - lo + 2 * pad) / scale, 7);
    for (const v of ticks((lo - pad) / scale, (hi + pad) / scale, step)) {
      gTop.appendChild(s('text.tick-label', { x: vx(v * scale), y: 106, 'text-anchor': 'middle' }, `${num(v, 2)}`));
    }
  }

  /* ---------------------------------------------------------- the histogram */
  function drawHist() {
    gHist.replaceChildren();
    gAxis.replaceChildren();
    gMark.replaceChildren();
    // the window: the bulk of the null world, and always the real result
    const reach = 4.2 * sdT;
    let lo = Math.max(tMin, Math.floor(Math.min(centreT - reach, tObs - 0.6 * sdT)));
    let hi = Math.min(tMax, Math.ceil(Math.max(centreT + reach, tObs + 0.6 * sdT)));
    if (kind === 'coin' && tMax <= 40) { lo = 0; hi = tMax; }
    if (hi - lo < 4) { lo = Math.max(tMin, lo - 2); hi = Math.min(tMax, hi + 2); }
    const m = Math.max(1, Math.round((hi - lo) / (kind === 'coin' ? 80 : 56)));
    const tx = (t) => X0 + 14 + ((t - (lo - m / 2)) / (hi - lo + m)) * (X1 - X0 - 28);
    const pitch = tx(m) - tx(0);
    // bins of m neighbouring values, lined up with the real result so that no bar straddles it
    const binOf = (t) => (lower ? -Math.floor((tObs - t) / m) : Math.floor((t - tObs) / m));
    const bins = new Map();
    for (const [t, k] of counts) if (t >= lo - m && t <= hi + m) bins.set(binOf(t), (bins.get(binOf(t)) || 0) + k);
    const tallest = Math.max(1, ...bins.values());
    const unitH = Math.min(8, (histBase - histTop - 30) / tallest);
    for (const [b, k] of bins) {
      const first = lower ? tObs + b * m - (m - 1) : tObs + b * m;
      const extreme = lower ? b <= 0 : b >= 0;
      gHist.appendChild(s('rect', {
        x: tx(first - 0.5) + Math.min(1, pitch * 0.07), y: histBase - k * unitH, width: Math.max(1, pitch - 2 * Math.min(1, pitch * 0.07)), height: k * unitH,
        fill: extreme ? hue('orange') : hue('blue', 'soft'), stroke: extreme ? 'var(--ink)' : hue('blue'), 'stroke-width': pitch > 5 ? 1.5 : 0.8,
      }));
    }
    gAxis.appendChild(s('line.axis-line', { x1: X0, x2: X1, y1: histBase, y2: histBase }));
    if (!compact) {
      // ticks at round values of what the learner reads
      const dLo = show(lo);
      const dHi = show(hi);
      const perT = (dHi - dLo) / Math.max(1, hi - lo);
      const stepD = Math.max(kind === 'coin' ? 1 : 0, niceStep(Math.abs(dHi - dLo), 8));
      for (const d of ticks(Math.min(dLo, dHi), Math.max(dLo, dHi), stepD)) {
        const x = tx(lo + (d - dLo) / perT);
        gAxis.appendChild(s('line.axis-line', { x1: x, x2: x, y1: histBase, y2: histBase + 5, 'stroke-width': 1.5 }));
        gAxis.appendChild(s('text.tick-label', { x, y: histBase + 19, 'text-anchor': 'middle' }, kind === 'coin' ? String(d) : signed(d)));
      }
      gAxis.appendChild(s('text.axis-label', { x: (X0 + X1) / 2, y: histBase + 38, 'text-anchor': 'middle' },
        spec.xLabel || (kind === 'coin' ? `${success} in one ${many.replace(/s$/, '')}` : `difference between the groups${unit ? ` (${unit.trim()})` : ''}`)));
    }
    // the real result
    const edge = lower ? tx(tObs + 0.5) : tx(tObs - 0.5);
    const right = edge < (X0 + X1) / 2 + 60;
    gMark.appendChild(s('line', { x1: edge, x2: edge, y1: histTop + 6, y2: histBase, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
    if (!compact) {
      const flag = `${realLabel}: ${kind === 'coin' ? tObs : signed(show(tObs))}${kind === 'coin' ? '' : unit}`;
      gMark.appendChild(s('text.fig-label-sm', { x: edge + (right ? 7 : -7), y: histTop + 14, 'text-anchor': right ? 'start' : 'end' }, flag));
      const dir = lower ? -1 : 1;
      const ay = histTop + 26;
      gMark.appendChild(s('path', { d: `M${edge} ${ay}h${dir * 30}m${-dir * 7} -5l${dir * 7} 5l${-dir * 7} 5`, fill: 'none', stroke: hue('orange', 'text'), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    histTitle.textContent = trials
      ? `${big(trials)} ${trials === 1 ? many.replace(/s$/, '') : many}${kind === 'coin' ? ' of the null world' : ': what chance alone produces'}`
      : 'Results from the null world pile up here';
  }

  function draw() {
    drawTop();
    drawHist();
    const st = getState();
    const what = kind === 'coin'
      ? `${tObs} or ${lower ? 'fewer' : 'more'}`
      : `${signed(show(tObs))} or ${lower ? 'less' : 'more'}`;
    roTrials.set(big(trials));
    tailLabel.textContent = what;
    roTail.set(trials ? `${big(st.extreme)} = ${num(100 * st.share, st.share < 0.1 ? 1 : 0)}%` : '—');
    if (st.exact != null) roExact.set(st.exact > 0 && st.exact < 0.0001 ? '< 0.01%' : `${num(100 * st.exact, st.exact < 0.1 ? 2 : 1)}%`);
    for (const btn of drawBtns) btn.disabled = readOnly || trials >= cap;
    if (resetBtn) resetBtn.disabled = readOnly || !trials;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The real result is ${kind === 'coin' ? `${tObs} ${success}` : `a difference of ${signed(show(tObs))}${unit}`}. `
      + (trials ? `${big(trials)} simulated ${many} of the null world: ${big(st.extreme)} of them, ${num(100 * st.share, 1)} percent, gave ${what}.` : 'Nothing simulated yet.')
      + (spec.exact && st.exact != null ? ` In the long run: ${num(100 * st.exact, 2)} percent.` : ''));
  }

  /* -------------------------------------------------------------- controls */
  const drawBtns = [];
  let resetBtn = null;
  let obsRow = null;
  const changed = () => { draw(); env.onChange(getState()); };
  if (!isStatic) {
    if (kind === 'coin' && Array.isArray(spec.observedRange)) {
      const [a, b] = spec.observedRange.map((v) => clamp(Math.round(v), 0, tMax));
      tObs = clamp(tObs, a, b);
      obsRow = sliderRow({
        label: spec.observedLabel || `${realLabel}: ${success}`, min: a, max: b, step: 1, value: tObs, color: 'orange',
        onInput: (v) => { if (readOnly) return; tObs = v; play('tap'); changed(); },
      });
      fr.controls.appendChild(obsRow.el);
    }
    const take = (times) => {
      if (readOnly) return;
      const room = cap - trials;
      if (room <= 0) { env.announce('The pile is full. Press Reset to start again.'); return; }
      run(Math.min(times, room));
      play(times > 1 ? 'drop' : 'tick');
      const st = getState();
      env.announce(`${big(trials)} ${many}. ${big(st.extreme)} at least as extreme as the real result: ${num(100 * st.share, 1)} percent.`);
      changed();
    };
    (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 100, 1000]).forEach((times, i) => {
      const btn = button(times === 1 ? `${verb} once` : `${verb} ${big(times)}×`, () => take(times), i === 0 ? { icon: kind === 'coin' ? 'play' : 'shuffle', variant: 'primary' } : { icon: 'layers' });
      drawBtns.push(btn);
      fr.buttons.appendChild(btn);
    });
    resetBtn = button('Reset', () => { if (readOnly) return; reset(); changed(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(resetBtn);
  }

  if (spec.start) run(clamp(Math.round(spec.start), 0, cap));
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.observed != null && kind === 'coin') {
        const [a, b] = Array.isArray(spec.observedRange) ? spec.observedRange : [0, tMax];
        tObs = clamp(Math.round(next.observed), Math.max(0, a), Math.min(tMax, b));
        if (obsRow) obsRow.set(tObs);
      }
      if (typeof next.trials === 'number') {
        const want = clamp(Math.round(next.trials), 0, cap);
        if (want < trials) reset();
        run(want - trials);
      }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (obsRow) obsRow.setDisabled(readOnly);
      draw();
    },
  };
}

export const examples = [
  {
    title: 'null-sim — is 15 heads in 20 flips surprising for a fair coin?',
    spec: { type: 'null-sim', kind: 'coin', n: 20, p: 0.5, observed: 15, observedRange: [10, 20], success: 'heads', realLabel: 'your coin', verb: 'Flip', start: 500, exact: true },
  },
  {
    title: 'null-sim — a permutation test on two small groups',
    spec: {
      type: 'null-sim', kind: 'shuffle', unit: 'cm', start: 300,
      groups: [{ label: 'fertiliser', values: [58, 61, 64, 66, 69, 71, 63, 60] }, { label: 'plain', values: [52, 55, 60, 57, 63, 59, 54, 62] }],
    },
  },
  {
    title: 'null-sim — an A/B test on yes/no counts',
    spec: { type: 'null-sim', kind: 'shuffle', groups: [{ label: 'page B', n: 1000, hits: 130 }, { label: 'page A', n: 1000, hits: 100 }], start: 1000, exact: true },
  },
];
