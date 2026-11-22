/**
 * sampler — a pot of 1,000 beads in two colours. Draw random samples and
 * watch each sample's percentage land on a strip: small samples scatter
 * widely, large ones cluster around the truth. An unstirred pot with a
 * "scoop from the top" method shows what bias does to even a large sample.
 *
 * {
 *   type: 'sampler',
 *   share: 0.6,                  // true share of the first colour among the 1,000 beads
 *   rows: [                      // each row is one way of sampling; its results pile up on its own strip
 *     { n: 10 }, { n: 40 }, { n: 160 },
 *     { n: 100, method: 'top', depth: 4, label: 'top 100' },   // 'top': picked only from the top `depth` rows of beads
 *   ],
 *   row: 0,                      // the row that is active at the start
 *   stirred: true,               // false: the first colour floats towards the top, so a scoop from the top is biased
 *   truth: true,                 // dashed line at the true share
 *   band: false,                 // shade, on each random row, the range where about 95% of samples land
 *   start: [0, 0, 0],            // samples already drawn per row when the widget appears
 *   max: 60,                     // most samples one row can hold
 *   colors: ['teal', 'orange'],  // palette names of the two kinds of bead
 *   names: ['teal', 'orange'],   // what to call them in labels
 * }
 *
 * State: { row, counts, total, results, means, spreads, last, share }
 *   counts  — samples drawn so far, per row
 *   results — every sample's percentage of the first colour, per row
 *   means, spreads — mean and standard deviation of each row's results (null while a row has fewer than 2)
 *   last    — the most recent sample: { row, n, hits, pct } (null before the first draw)
 *   share   — the true percentage in the pot
 *
 * setState accepts { counts: [..] } (draws or discards samples until every row holds that many) and { row }.
 * All drawing of samples uses env.rng.
 */
import { frame, button, readout, hue, s, h, clamp, tidy, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('sampler', `
  .widget-sampler .sm-pot.has-sample .sm-bead { opacity: 0.32; }
  .widget-sampler .sm-pot.has-sample .sm-bead.is-in { opacity: 1; stroke: var(--ink); stroke-width: 1.4; }
  .widget-sampler .sm-rowlabel { fill: var(--ink-3); }
  .widget-sampler .sm-rowlabel.is-active { fill: var(--ink); }
  .widget-sampler .sm-pick { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-sampler .sm-pick-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-sampler .sm-pick .btn[aria-pressed='true'] { --btn-bg: var(--ink); --btn-fg: var(--paper); }
  @media (max-width: 520px) { .widget-sampler .w-canvas .fig-label { font-size: 16px; } .widget-sampler .w-canvas .fig-label-sm { font-size: 13px; } }
`);

const COLS = 50;
const ROWS = 20;
const N = COLS * ROWS;

/** Half-width of the range that holds about 95% of random samples of size n (in percentage points). */
export function margin(share, n, population = N) {
  const fpc = Math.sqrt((population - n) / (population - 1));
  return 200 * Math.sqrt((share * (1 - share)) / n) * fpc;
}

/** How many first-colour beads each row of an unstirred pot holds: plenty at the top, few at the bottom. */
export function layers(share) {
  const want = Math.round(share * N);
  const counts = [];
  for (let r = 0; r < ROWS; r++) counts.push(Math.round(COLS * clamp(share + 0.76 * (0.5 - (r + 0.5) / ROWS), 0.02, 0.98)));
  let diff = want - counts.reduce((t, v) => t + v, 0);
  for (let guard = 0, r = ROWS - 1; diff !== 0 && guard < 4000; guard++, r = r > 0 ? r - 1 : ROWS - 1) {
    const stepBy = Math.sign(diff);
    if (counts[r] + stepBy >= 0 && counts[r] + stepBy <= COLS) { counts[r] += stepBy; diff -= stepBy; }
  }
  return counts;
}

export default function create(spec, env) {
  const compact = !!env.compact;
  const phone = !compact && typeof matchMedia === 'function' && matchMedia('(max-width: 520px)').matches;
  const share = clamp(spec.share != null ? spec.share : 0.6, 0.02, 0.98);
  const rows = (Array.isArray(spec.rows) && spec.rows.length ? spec.rows : [{ n: 10 }, { n: 40 }, { n: 160 }])
    .map((row) => ({ method: 'random', depth: 4, ...row, n: clamp(Math.round(row.n || 10), 1, 400) }));
  for (const row of rows) {
    if (row.method === 'top') row.n = Math.min(row.n, row.depth * COLS);
    if (!row.label) row.label = row.method === 'top' ? `top ${row.n}` : `n = ${row.n}`;
  }
  const colors = spec.colors || ['teal', 'orange'];
  const names = spec.names || colors;
  const cap = spec.max || 60;
  let active = clamp(spec.row || 0, 0, rows.length - 1);
  let readOnly = !!env.readOnly;

  /* -------------------------------------------------------------- the pot */
  const pop = new Array(N).fill(0);
  if (spec.stirred === false) {
    layers(share).forEach((count, r) => {
      const line = env.rng.shuffle(Array.from({ length: COLS }, (_, c) => (c < count ? 1 : 0)));
      line.forEach((v, c) => { pop[r * COLS + c] = v; });
    });
  } else {
    env.rng.shuffle(Array.from({ length: N }, (_, i) => (i < Math.round(share * N) ? 1 : 0))).forEach((v, i) => { pop[i] = v; });
  }
  const truth = (100 * pop.reduce((t, v) => t + v, 0)) / N;

  /* ------------------------------------------------------------ geometry */
  const W = compact ? 300 : phone ? 440 : 560;
  const pitch = (W - (compact ? 20 : phone ? 30 : 60)) / COLS;
  const potX = (W - pitch * COLS) / 2;
  const potY = 10;
  const pitchY = pitch * 0.8;                 // beads sit a little closer vertically, to keep the pot compact
  const potH = pitchY * ROWS;
  const STRIP = compact ? 34 : phone ? 58 : 60;
  const labelW = compact ? 0 : phone ? 76 : 86;
  const stripsY = potY + potH + (compact ? 12 : 34);
  const x0 = (compact ? 10 : 8) + labelW;
  const x1 = W - (compact ? 10 : 26);
  const px = (pct) => x0 + (pct / 100) * (x1 - x0);
  const baseOf = (k) => stripsY + (k + 1) * STRIP - 6;
  const H = stripsY + rows.length * STRIP + (compact ? 6 : 28);
  const dotR = compact ? 2.4 : phone ? 3.2 : 3.5;

  const fr = frame({ width: W, height: H, compact, label: spec.alt || 'Sampling experiment' });
  const { svg } = fr;

  const gPot = s('g.sm-pot');
  gPot.appendChild(s('rect', { x: potX - 6, y: potY - 6, width: pitch * COLS + 12, height: potH + 12, rx: 10, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const beads = pop.map((v, i) => {
    const el = s('circle.sm-bead', {
      cx: potX + pitch * ((i % COLS) + 0.5), cy: potY + pitchY * (Math.floor(i / COLS) + 0.5), r: pitch * (v ? 0.33 : 0.26),
      fill: v ? hue(colors[0]) : hue(colors[1], 'soft'), stroke: v ? 'none' : hue(colors[1]), 'stroke-width': v ? 0 : pitch * 0.14,
    });
    gPot.appendChild(el);
    return el;
  });
  const reach = s('g', { visibility: 'hidden' },
    s('line', { x1: potX - 6, x2: potX + pitch * COLS + 6, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
  gPot.appendChild(reach);
  svg.appendChild(gPot);

  // strips
  const gStrips = s('g');
  const gDots = s('g');
  svg.append(gStrips, gDots);
  const rowLabels = [];
  const rowBacks = [];
  rows.forEach((row, k) => {
    const top = stripsY + k * STRIP;
    const back = s('rect', { x: x0 - 4, y: top + 2, width: x1 - x0 + 8, height: STRIP - 4, rx: 8, fill: 'var(--sunken)', opacity: 0 });
    gStrips.appendChild(back);
    rowBacks.push(back);
    if (spec.band && row.method !== 'top' && !compact) {
      const m = margin(truth / 100, row.n);
      const a = px(Math.max(0, truth - m));
      const b = px(Math.min(100, truth + m));
      gStrips.appendChild(s('rect', { x: a, y: top + 5, width: b - a, height: STRIP - 10, rx: 6, fill: hue('violet', 'soft'), opacity: 0.9 }));
      gStrips.appendChild(s('text.fig-label-sm', { x: 8, y: top + STRIP / 2 + 19, style: `fill:${hue('violet', 'text')}` }, `±${Math.round(m)} points`));
    }
    gStrips.appendChild(s('line', { x1: x0, x2: x1, y1: baseOf(k), y2: baseOf(k), stroke: 'var(--hair)', 'stroke-width': 2 }));
    if (!compact) {
      const label = s('text.fig-label.sm-rowlabel', { x: 8, y: top + STRIP / 2 + (spec.band && row.method !== 'top' ? 0 : 5) }, row.label);
      gStrips.appendChild(label);
      rowLabels.push(label);
    }
  });
  const axisY = baseOf(rows.length - 1);
  if (!compact) {
    for (let v = 0; v <= 100; v += 10) {
      gStrips.appendChild(s('line.axis-line', { x1: px(v), x2: px(v), y1: axisY, y2: axisY + (v % 20 ? 4 : 6), 'stroke-width': 1.5 }));
      if (v % 20 === 0) gStrips.appendChild(s('text.tick-label', { x: px(v), y: axisY + 20, 'text-anchor': 'middle' }, `${v}%`));
    }
  }
  gStrips.appendChild(s('line.axis-line', { x1: x0, x2: x1, y1: axisY, y2: axisY }));
  if (spec.truth !== false) {
    const tx = px(truth);
    gStrips.appendChild(s('line', { x1: tx, x2: tx, y1: stripsY - 2, y2: axisY, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
    if (!compact) gStrips.appendChild(s('text.fig-label-sm', { x: tx, y: stripsY - 8, 'text-anchor': 'middle' }, `in the pot: ${formatNumber(truth, 1)}% ${names[0]}`));
  }

  /* --------------------------------------------------------------- model */
  const results = rows.map(() => []);
  let last = null;
  let picked = [];
  const everything = Array.from({ length: N }, (_, i) => i);

  function sampleOnce(k) {
    const row = rows[k];
    const pool = row.method === 'top' ? everything.slice(0, row.depth * COLS) : everything.slice();
    for (let i = 0; i < row.n; i++) {
      const j = i + Math.floor(env.rng.next() * (pool.length - i));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    picked = pool.slice(0, row.n);
    const hits = picked.reduce((t, i) => t + pop[i], 0);
    const pct = tidy((100 * hits) / row.n, 4);
    results[k].push(pct);
    last = { row: k, n: row.n, hits, pct };
  }

  function getState() {
    const stat = (list) => {
      if (list.length < 2) return [null, null];
      const m = list.reduce((t, v) => t + v, 0) / list.length;
      return [tidy(m, 2), tidy(Math.sqrt(list.reduce((t, v) => t + (v - m) * (v - m), 0) / list.length), 2)];
    };
    const stats = results.map(stat);
    return {
      row: active,
      counts: results.map((list) => list.length),
      total: results.reduce((t, list) => t + list.length, 0),
      results: results.map((list) => list.slice()),
      means: stats.map((x) => x[0]),
      spreads: stats.map((x) => x[1]),
      last: last ? { ...last } : null,
      share: tidy(truth, 2),
    };
  }

  /* ------------------------------------------------------------ controls */
  const roLast = readout('last sample', {});
  const roCount = readout('samples on this row', { digits: 0 });
  if (!compact) fr.readouts.append(roLast.el, roCount.el);

  const pickers = [];
  if (rows.length > 1 && !compact) {
    const box = h('div.sm-pick', h('span.sm-pick-label', spec.pickLabel || 'Sample:'));
    rows.forEach((row, k) => {
      const btn = button(row.label, () => { if (readOnly) return; active = k; play('select'); draw(); env.onChange(getState()); });
      btn.setAttribute('aria-pressed', 'false');
      pickers.push(btn);
      box.appendChild(btn);
    });
    fr.controls.appendChild(box);
  }
  const take = (times) => {
    if (readOnly) return;
    const room = cap - results[active].length;
    if (room <= 0) { env.announce('This row is full. Choose another row or reset.'); return; }
    for (let i = 0; i < Math.min(times, room); i++) sampleOnce(active);
    play('drop');
    draw();
    env.announce(`Sample of ${last.n}: ${formatNumber(last.pct, 1)} percent ${names[0]}.`);
    env.onChange(getState());
  };
  const btnOne = button('Draw 1 sample', () => take(1), { icon: 'plus', variant: 'primary' });
  const btnTen = button('Draw 10', () => take(10), { icon: 'layers' });
  const btnReset = button('Reset', () => {
    if (readOnly) return;
    results.forEach((list) => { list.length = 0; });
    last = null;
    picked = [];
    draw();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });
  if (!compact) fr.buttons.append(btnOne, btnTen, btnReset);

  /* ---------------------------------------------------------------- draw */
  let shown = [];
  function draw() {
    // beads of the last sample stand out
    for (const i of shown) beads[i].classList.remove('is-in');
    shown = last ? picked : [];
    for (const i of shown) beads[i].classList.add('is-in');
    gPot.classList.toggle('has-sample', shown.length > 0);

    while (gDots.firstChild) gDots.removeChild(gDots.firstChild);
    rows.forEach((row, k) => {
      const grid = Math.max(100 / row.n, 2.5);                 // dots closer than this share a pile
      const piles = new Map();
      for (const pct of results[k]) { const key = Math.round(pct / grid); piles.set(key, (piles.get(key) || 0) + 1); }
      const tallest = Math.max(1, ...piles.values());
      const gap = Math.min(2 * dotR + 0.4, (STRIP - 12 - 2 * dotR) / Math.max(1, tallest - 1));
      const seen = new Map();
      results[k].forEach((pct, i) => {
        const key = Math.round(pct / grid);
        const level = seen.get(key) || 0;
        seen.set(key, level + 1);
        const newest = last && last.row === k && i === results[k].length - 1;
        gDots.appendChild(s('circle', {
          cx: px(key * grid), cy: baseOf(k) - dotR - 1.5 - level * gap, r: newest ? dotR + 1 : dotR,
          fill: hue(newest ? 'yellow' : row.method === 'top' ? 'pink' : 'blue'), stroke: 'var(--ink)', 'stroke-width': newest ? 1.8 : 1,
        }));
      });
      if (rowBacks[k]) rowBacks[k].setAttribute('opacity', k === active && rows.length > 1 ? 0.75 : 0);
      if (rowLabels[k]) rowLabels[k].classList.toggle('is-active', k === active || rows.length === 1);
    });

    // a spoon that only takes from the top: show how deep it reaches
    const deep = rows[active].method === 'top' ? rows[active].depth : 0;
    reach.setAttribute('visibility', deep ? 'visible' : 'hidden');
    reach.firstChild.setAttribute('y1', potY + pitchY * deep);
    reach.firstChild.setAttribute('y2', potY + pitchY * deep);

    pickers.forEach((btn, k) => btn.setAttribute('aria-pressed', String(k === active)));
    roLast.set(last ? `${last.hits} of ${last.n} ${names[0]} = ${formatNumber(last.pct, 1)}%` : '—');
    roCount.set(results[active].length);
    const full = results[active].length >= cap;
    btnOne.disabled = readOnly || full;
    btnTen.disabled = readOnly || full;
    btnReset.disabled = readOnly || results.every((list) => !list.length);
    const state = getState();
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}A pot of ${N} beads, ${formatNumber(truth, 1)} percent ${names[0]}. ${rows.map((row, k) => `${row.label}: ${state.counts[k]} samples${state.means[k] != null ? `, averaging ${formatNumber(state.means[k], 0)} percent, spread ${formatNumber(state.spreads[k], 1)}` : ''}`).join('. ')}.`);
  }

  function fill(counts) {
    rows.forEach((_, k) => {
      const want = clamp(Math.round(Number(counts[k]) || 0), 0, cap);
      if (results[k].length > want) { results[k].length = want; if (last && last.row === k) { last = null; picked = []; } }
      while (results[k].length < want) sampleOnce(k);
    });
  }

  if (Array.isArray(spec.start)) fill(spec.start);
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.counts)) fill(next.counts);
      if (typeof next.row === 'number') active = clamp(Math.round(next.row), 0, rows.length - 1);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      pickers.forEach((btn) => { btn.disabled = readOnly; });
      draw();
    },
  };
}

export const examples = [
  {
    title: 'sampler — three sample sizes from a stirred pot',
    spec: { type: 'sampler', share: 0.6, rows: [{ n: 10 }, { n: 40 }, { n: 160 }], start: [12, 12, 12], band: true },
  },
  {
    title: 'sampler — an unstirred pot: a big scoop from the top against a small random sample',
    spec: { type: 'sampler', share: 0.6, stirred: false, rows: [{ n: 100, method: 'top', label: 'top 100' }, { n: 25, label: 'random 25' }], start: [8, 8] },
  },
];
