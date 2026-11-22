/**
 * many-tests — a wall of significance tests, for seeing what happens when
 * many things are tested at once. Two modes:
 *
 *   'wall'   every tile is one study of an effect that does NOT exist. Press the button and each study
 *            gets its p-value; tiles below the threshold light up as "discoveries". Run batch after
 *            batch and count how many batches contain at least one.
 *   'paths'  one data set, many ways to analyse it (rows × columns). The learner taps a tile to run
 *            that analysis and see its p-value: a hands-on model of p-hacking.
 *
 * {
 *   type: 'many-tests',
 *   mode: 'wall',
 *   tests: 20,                       // tiles in the wall
 *   columns: 5,                      // tiles per row
 *   labels: ['red', 'green', …],     // optional names for the tiles
 *   alpha: 0.05,                     // threshold: a p-value below it counts as "significant"
 *   alphas: [0.05, 0.0025],          // optional: adds a picker …
 *   alphaLabels: ['0.05', '0.05 ÷ 20'],   // … with these captions
 *   batches: [1, 20],                // buttons: how many batches (walls) each one runs
 *   maxBatches: 500,
 *   start: 0,                        // batches already run when the figure appears
 *   p: [0.41, 0.03, …],              // a fixed wall instead of random p-values (no buttons): for pictures the text quotes
 *   drawer: false,                   // true: adds a switch between "every study" and "published only" (significant ones)
 *   noun: 'studies',                 // what the tiles are: "Run the 20 studies"
 *
 *   mode: 'paths',
 *   rows: ['Everyone', 'Women', 'Men', 'Over 50'],
 *   cols: ['Weight', 'Sleep', 'Mood', 'Energy', 'Memory'],
 *   p: [[0.41, 0.62, …], …],         // the p-value of every analysis: one row of numbers per row of tiles (fixed)
 *   open: [[0, 0]],                  // analyses already run at the start, as [row, column]
 *   alpha: 0.05,
 * }
 *
 * In wall mode the null hypothesis is true for every tile, so each p-value is drawn evenly between 0 and 1
 * with env.rng: that is how p-values behave when nothing is going on.
 *
 * State, wall:  { mode, alpha, tests, batches, hits, totalTests, totalHits, batchesWithHit, view, p }
 *   hits — tiles below the threshold in the wall on show · totalHits, batchesWithHit — over every batch so far
 *   Random unless `p` is given: check `batches` and `alpha`, never the counts.
 * State, paths: { mode, alpha, tried, opened, found, best, bestText, bestAt, hits }
 *   opened — analyses run so far as 'row-column' strings, in the order they were run · tried: how many
 *   found  — at least one of them has a p-value below the threshold · hits: how many do
 *   best, bestAt — the smallest p-value seen so far and where it is ([row, column]); null before the first
 *   bestText — `best` as it is printed on its tile
 *
 * setState accepts { batches, alpha, view } (wall) and { opened: [[row, column], …] } (paths).
 */
import { frame, button, readout, hue, s, h, clamp, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('many-tests', `
  .widget-many-tests .mt-pick { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-many-tests .mt-pick-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-many-tests .mt-pick .btn[aria-pressed='true'] { --btn-bg: var(--ink); --btn-fg: var(--paper); }
  .widget-many-tests.is-row .mt-pick { justify-content: flex-start; }
  .widget-many-tests .mt-tile { cursor: pointer; outline: none; }
  .widget-many-tests .mt-tile:hover .mt-face { stroke-width: 3.5; }
  .widget-many-tests .mt-tile:focus-visible .mt-face { stroke: var(--focus); stroke-width: 4.5; }
  .widget-many-tests.is-readonly .mt-tile { cursor: default; pointer-events: none; }
`);

/**
 * A p-value as it is printed on a tile: "0.41", "0.037", "0.0024". Digits are cut off, never rounded up,
 * so a value printed as 0.049 really is below 0.05 and one printed as 0.05 really is not.
 */
export function pText(p) {
  if (p < 0.0001) return '< 0.0001';
  const places = p < 0.01 ? 4 : p < 0.1 ? 3 : 2;
  const k = Math.pow(10, places);
  return (Math.floor(p * k + 1e-9) / k).toFixed(places);
}

const W = 560;

export default function create(spec, env) {
  const compact = !!env.compact;
  const paths = spec.mode === 'paths';
  const alphas = Array.isArray(spec.alphas) && spec.alphas.length ? spec.alphas.map(Number) : null;
  let alpha = Number(spec.alpha != null ? spec.alpha : alphas ? alphas[0] : 0.05);
  let readOnly = !!env.readOnly;
  const below = (p) => p < alpha;

  /* ================================================================ paths */
  if (paths) {
    const rows = spec.rows || ['All'];
    const cols = spec.cols || ['Outcome'];
    const table = rows.map((_, r) => cols.map((__, c) => Number((spec.p && spec.p[r] && spec.p[r][c]) != null ? spec.p[r][c] : 0.5)));
    const key = (r, c) => `${r}-${c}`;
    const valid = (r, c) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < rows.length && c >= 0 && c < cols.length;
    const initial = (spec.open || []).filter(([r, c]) => valid(r, c)).map(([r, c]) => key(r, c));
    let opened = initial.slice();

    const left = compact ? 8 : 112;
    const gap = 8;
    const tw = (W - 8 - left - gap * (cols.length - 1)) / cols.length;
    const th = 66;                       // 40px tall on a phone: a comfortable touch target
    const top = compact ? 8 : 34;
    const H = top + rows.length * th + (rows.length - 1) * gap + 10;
    const fr = frame({ width: W, height: H, compact, label: spec.alt || 'A grid of possible analyses' });
    const { svg } = fr;
    const gTiles = s('g');
    if (!compact) {
      svg.appendChild(s('text.fig-label-sm', { x: left - 10, y: 22, 'text-anchor': 'end', style: 'fill:var(--ink-3)' }, 'p-values'));
      cols.forEach((name, c) => svg.appendChild(s('text.fig-label-sm', { x: left + c * (tw + gap) + tw / 2, y: 22, 'text-anchor': 'middle' }, name)));
      rows.forEach((name, r) => svg.appendChild(s('text.fig-label-sm', { x: left - 10, y: top + r * (th + gap) + th / 2 + 4, 'text-anchor': 'end' }, name)));
    }
    svg.appendChild(gTiles);
    const roTried = readout('analyses run', { digits: 0 });
    const roBest = readout('smallest p so far', { color: 'orange' });
    if (!compact) fr.readouts.append(roTried.el, roBest.el);

    const getState = () => {
      let best = null;
      let bestAt = null;
      for (const k of opened) {
        const [r, c] = k.split('-').map(Number);
        if (best == null || table[r][c] < best) { best = table[r][c]; bestAt = [r, c]; }
      }
      const hits = opened.filter((k) => { const [r, c] = k.split('-').map(Number); return below(table[r][c]); }).length;
      return { mode: 'paths', alpha, tried: opened.length, opened: opened.slice(), found: hits > 0, best, bestText: best == null ? null : pText(best), bestAt, hits };
    };

    const tiles = [];
    const reveal = (r, c) => {
      if (readOnly || opened.includes(key(r, c))) return;
      opened.push(key(r, c));
      const p = table[r][c];
      play(below(p) ? 'pop' : 'tap');
      env.announce(`${cols[c]}, ${rows[r]}: p equals ${pText(p)}${below(p) ? ', below the threshold' : ''}.`);
      draw();
      env.onChange(getState());
    };
    rows.forEach((rowName, r) => cols.forEach((colName, c) => {
      const x = left + c * (tw + gap);
      const y = top + r * (th + gap);
      const face = s('rect.mt-face', { x, y, width: tw, height: th, rx: 10, 'stroke-width': 2.5 });
      const big = s('text.fig-label', { x: x + tw / 2, y: y + th / 2 + 6, 'text-anchor': 'middle' });
      const g = s('g.mt-tile', { tabindex: compact ? null : '0', role: 'button' }, face, big);
      g.dataset.keys = 'own';
      g.addEventListener('click', () => reveal(r, c));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); reveal(r, c); } });
      gTiles.appendChild(g);
      tiles.push({ r, c, g, face, big, rowName, colName });
    }));

    function draw() {
      for (const t of tiles) {
        const isOpen = opened.includes(key(t.r, t.c));
        const p = table[t.r][t.c];
        const hit = isOpen && below(p);
        t.face.setAttribute('fill', hit ? hue('yellow') : isOpen ? 'var(--sunken)' : 'var(--surface)');
        t.face.setAttribute('stroke', hit ? 'var(--edge-strong)' : isOpen ? 'var(--hair)' : 'var(--edge)');
        t.face.setAttribute('stroke-dasharray', isOpen ? 'none' : '5 5');
        t.big.textContent = isOpen ? `${hit ? '★ ' : ''}${pText(p)}` : '?';
        t.big.setAttribute('style', hit ? 'fill:#1D1B26; stroke:none' : isOpen ? 'fill:var(--ink-2)' : '');
        t.g.setAttribute('aria-label', `${t.colName}, ${t.rowName}: ${isOpen ? `p = ${pText(p)}${hit ? ', significant' : ''}` : 'not analysed yet'}`);
        if (!compact) t.g.setAttribute('tabindex', readOnly ? '-1' : '0');
        if (isOpen) t.g.setAttribute('aria-disabled', 'true'); else t.g.removeAttribute('aria-disabled');
      }
      const st = getState();
      roTried.set(`${st.tried} of ${tiles.length}`);
      roBest.set(st.best == null ? '—' : pText(st.best));
      if (resetBtn) resetBtn.disabled = readOnly || opened.length <= initial.length;
      svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${st.tried} of ${tiles.length} analyses run.${st.best != null ? ` Smallest p-value so far: ${pText(st.best)}.` : ''}`);
    }
    let resetBtn = null;
    if (!compact && !spec.static) {
      resetBtn = button('Start again', () => { if (readOnly) return; opened = initial.slice(); draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(resetBtn);
    }
    draw();
    if (readOnly) fr.el.classList.add('is-readonly');
    return {
      el: fr.el,
      getState,
      setState(next) {
        if (!next) return;
        if (Array.isArray(next.opened)) {
          const list = next.opened.map((it) => (Array.isArray(it) ? it : String(it).split('-').map(Number))).filter(([r, c]) => valid(r, c)).map(([r, c]) => key(r, c));
          opened = Array.from(new Set(list));
        }
        if (next.alpha != null) alpha = Number(next.alpha);
        draw();
      },
      setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); draw(); },
    };
  }

  /* ================================================================= wall */
  const fixed = Array.isArray(spec.p) ? spec.p.map(Number) : null;
  const tests = fixed ? fixed.length : clamp(Math.round(spec.tests || 20), 1, 400);
  const columns = clamp(Math.round(spec.columns || (tests > 40 ? 10 : 5)), 1, 20);
  const rowsN = Math.ceil(tests / columns);
  const maxBatches = clamp(Math.round(spec.maxBatches || 500), 1, 5000);
  const noun = spec.noun || 'studies';
  const labels = Array.isArray(spec.labels) ? spec.labels : null;
  const roomy = columns <= 6;
  let view = 'all';
  /** Every batch run so far; the last one is on show. */
  const history = fixed ? [fixed] : [];
  const runBatch = () => { const batch = []; for (let i = 0; i < tests; i++) batch.push(env.rng.next()); history.push(batch); };

  const gap = roomy ? 8 : 5;
  const tw = (W - 16 - gap * (columns - 1)) / columns;
  const th = roomy ? 56 : Math.max(22, Math.min(34, tw * 0.62));
  const top = compact ? 8 : 34;
  const H = top + rowsN * th + (rowsN - 1) * gap + 10;
  const fr = frame({ width: W, height: H, compact, label: spec.alt || 'A wall of studies' });
  const { svg } = fr;
  const headLeft = s('text.fig-label', { x: 8, y: 22 });
  const headRight = s('text.fig-label', { x: W - 8, y: 22, 'text-anchor': 'end' });
  if (!compact) svg.append(headLeft, headRight);
  const tiles = [];
  for (let i = 0; i < tests; i++) {
    const x = 8 + (i % columns) * (tw + gap);
    const y = top + Math.floor(i / columns) * (th + gap);
    const face = s('rect', { x, y, width: tw, height: th, rx: roomy ? 10 : 6, 'stroke-width': roomy ? 2.5 : 1.8 });
    const name = s('text.fig-label-sm', { x: x + tw / 2, y: y + 20, 'text-anchor': 'middle' });
    const value = s('text.fig-label', { x: x + tw / 2, y: y + (labels ? 42 : th / 2 + 5), 'text-anchor': 'middle' });
    const g = s('g', {}, face);
    if (roomy && !compact) { if (labels) g.appendChild(name); g.appendChild(value); }
    svg.appendChild(g);
    tiles.push({ g, face, name, value });
  }
  const roBatches = readout('batches run', { digits: 0 });
  const roAny = readout('batches with a "discovery"', { color: 'orange' });
  if (!compact && !fixed) fr.readouts.append(roBatches.el, roAny.el);

  function getState() {
    const now = history.length ? history[history.length - 1] : null;
    let totalHits = 0;
    let batchesWithHit = 0;
    for (const batch of history) { const k = batch.filter(below).length; totalHits += k; if (k) batchesWithHit++; }
    return {
      mode: 'wall', alpha, tests, batches: history.length, hits: now ? now.filter(below).length : 0,
      totalTests: history.length * tests, totalHits, batchesWithHit, view, p: now ? now.slice() : [],
    };
  }

  const alphaBtns = [];
  const viewBtns = [];
  const runBtns = [];
  let resetBtn = null;
  const alphaText = () => {
    const i = alphas ? alphas.findIndex((a) => Math.abs(a - alpha) < 1e-12) : -1;
    return i >= 0 && spec.alphaLabels && spec.alphaLabels[i] ? spec.alphaLabels[i] : formatNumber(alpha, 5);
  };
  function draw() {
    const st = getState();
    const now = history.length ? history[history.length - 1] : null;
    tiles.forEach((t, i) => {
      const p = now ? now[i] : null;
      const hit = p != null && below(p);
      const hidden = view === 'published' && p != null && !hit;
      t.face.setAttribute('fill', hit ? hue('yellow') : p == null ? 'var(--surface)' : 'var(--sunken)');
      t.face.setAttribute('stroke', hit ? 'var(--edge-strong)' : p == null ? 'var(--edge)' : 'var(--hair)');
      t.face.setAttribute('stroke-width', hit ? (roomy ? 3 : 2.4) : roomy ? 2.5 : 1.5);
      t.g.setAttribute('opacity', hidden ? 0.16 : 1);
      t.name.textContent = labels && labels[i] != null ? labels[i] : '';
      t.name.setAttribute('style', hit ? 'fill:#1D1B26; stroke:none' : 'fill:var(--ink-2)');
      t.value.textContent = p == null ? '?' : `${hit ? '★ ' : ''}${pText(p)}`;
      t.value.setAttribute('style', hit ? 'fill:#1D1B26; stroke:none' : p == null ? '' : 'fill:var(--ink-3)');
    });
    headLeft.textContent = `Significant means p < ${alphaText()}`;
    headRight.textContent = !now ? '' : view === 'published'
      ? `published: ${st.hits} of ${tests}`
      : `★ ${st.hits} of ${tests}`;
    roBatches.set(st.batches);
    roAny.set(st.batches ? `${st.batchesWithHit} of ${st.batches}` : '—');
    for (const [key, btn] of alphaBtns) btn.setAttribute('aria-pressed', String(Math.abs(key - alpha) < 1e-12));
    for (const [key, btn] of viewBtns) btn.setAttribute('aria-pressed', String(key === view));
    for (const btn of runBtns) btn.disabled = readOnly || history.length >= maxBatches;
    if (resetBtn) resetBtn.disabled = readOnly || !history.length;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${tests} ${noun} of effects that do not exist. `
      + (now ? `In this batch ${st.hits} have a p-value below ${alphaText()}.` : 'Not run yet.')
      + (!fixed && st.batches ? ` ${st.batches} batches run; ${st.batchesWithHit} of them contain at least one such result.` : ''));
  }

  const changed = () => { draw(); env.onChange(getState()); };
  if (!compact && !spec.static) {
    const picker = (label, items, into, onPick) => {
      const box = h('div.mt-pick', h('span.mt-pick-label', label));
      for (const [key, text] of items) {
        const btn = button(text, () => { if (readOnly) return; onPick(key); play('select'); changed(); });
        btn.setAttribute('aria-pressed', 'false');
        into.push([key, btn]);
        box.appendChild(btn);
      }
      fr.controls.appendChild(box);
    };
    if (alphas) picker('Threshold:', alphas.map((a, i) => [a, (spec.alphaLabels && spec.alphaLabels[i]) || formatNumber(a, 5)]), alphaBtns, (a) => { alpha = a; });
    if (spec.drawer) picker('Show:', [['all', `every ${noun.replace(/ies$/, 'y').replace(/s$/, '')}`], ['published', 'published only']], viewBtns, (v) => { view = v; });
    if (!fixed) {
      const take = (times) => {
        if (readOnly) return;
        const room = maxBatches - history.length;
        if (room <= 0) { env.announce('That is plenty of batches. Press Reset to start again.'); return; }
        for (let i = 0; i < Math.min(times, room); i++) runBatch();
        const st = getState();
        play(st.hits ? 'pop' : 'tick');
        env.announce(`Batch ${st.batches}: ${st.hits} of ${tests} below the threshold. ${st.batchesWithHit} of ${st.batches} batches so far contain at least one.`);
        changed();
      };
      (Array.isArray(spec.batches) && spec.batches.length ? spec.batches : [1, 20]).forEach((times, i) => {
        const btn = button(times === 1 ? `Run the ${tests} ${noun}` : `Run ${times} batches`, () => take(times), i === 0 ? { icon: 'play', variant: 'primary' } : { icon: 'layers' });
        runBtns.push(btn);
        fr.buttons.appendChild(btn);
      });
      resetBtn = button('Reset', () => { if (readOnly) return; history.length = 0; changed(); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(resetBtn);
    }
  }
  if (spec.start && !fixed) for (let i = 0; i < clamp(Math.round(spec.start), 0, maxBatches); i++) runBatch();
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.alpha != null && (!alphas || alphas.some((a) => Math.abs(a - Number(next.alpha)) < 1e-12))) alpha = Number(next.alpha);
      if (next.view === 'all' || next.view === 'published') view = next.view;
      if (typeof next.batches === 'number' && !fixed) {
        const want = clamp(Math.round(next.batches), 0, maxBatches);
        if (history.length > want) history.length = want;
        while (history.length < want) runBatch();
      }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const [, btn] of [...alphaBtns, ...viewBtns]) btn.disabled = readOnly;
      draw();
    },
  };
}

export const examples = [
  {
    title: 'many-tests — twenty studies of effects that do not exist',
    spec: { type: 'many-tests', tests: 20, alphas: [0.05, 0.0025], alphaLabels: ['0.05', '0.05 ÷ 20'], start: 3 },
  },
  {
    title: 'many-tests — one data set, twenty analyses to choose from',
    spec: {
      type: 'many-tests', mode: 'paths', rows: ['Everyone', 'Women', 'Men', 'Over 50'], cols: ['Weight', 'Sleep', 'Mood', 'Energy', 'Memory'], open: [[0, 0]],
      p: [[0.41, 0.62, 0.18, 0.77, 0.33], [0.55, 0.09, 0.03, 0.48, 0.91], [0.29, 0.84, 0.66, 0.12, 0.37], [0.07, 0.52, 0.71, 0.24, 0.045]],
    },
  },
];
