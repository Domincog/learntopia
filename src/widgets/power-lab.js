/**
 * power-lab — the two ways a test can be wrong, as two overlapping bells.
 * An experiment compares two groups and reports the difference between
 * their averages. The grey bell shows which differences turn up when the
 * treatment does nothing; the blue bell shows them when it really adds
 * `effect`. A threshold splits the axis: results to its right are called
 * "significant". The part of the grey bell beyond the threshold is the
 * false-alarm rate, the part of the blue bell short of it is the miss rate,
 * and the rest of the blue bell is the power. Bigger groups make both bells
 * narrower; a bigger effect slides the blue bell away.
 *
 * {
 *   type: 'power-lab',
 *   sd: 10,                       // SD of one person's measurement
 *   effect: 3,                    // what the treatment really adds
 *   effectRange: [0, 8, 0.5],     // optional: adds a slider [min, max, step]
 *   n: 20,                        // people in each group
 *   sizes: [20, 50, 100, 200],    // optional: adds a slider over these group sizes …
 *   nRange: [10, 400, 10],        // … or a plain slider [min, max, step]
 *   alpha: 0.05,                  // the threshold sits where the false-alarm rate is `alpha` …
 *   alphas: [0.1, 0.05, 0.01],    // … with an optional picker
 *   drag: false,                  // true: the learner moves the threshold; the false-alarm rate then follows from it
 *   threshold: 5.2,               // drag mode: where the threshold starts (default: where the false-alarm rate is `alpha`)
 *   simulate: [1, 100],           // optional: buttons that run that many experiments and drop each result as a dot
 *   world: 'real',                // which world those experiments happen in: 'real' (the effect exists) or 'null'
 *   worlds: false,                // true: a picker to switch between the two worlds
 *   max: 300,                     // most simulated experiments kept per world
 *   x: [-8, 14],                  // ends of the axis (default: wide enough for both bells at the smallest group size)
 *   unit: 'points',               // unit of the measurement
 *   groups: 2,                    // 2: the difference between two groups of n (SE = sd × √(2/n)) · 1: one average (SE = sd / √n)
 * }
 *
 * State: { n, effect, se, threshold, alpha, miss, power, world, runs, flagged }
 *   se        — standard error of the difference
 *   threshold — results above it count as significant
 *   alpha     — chance that the null world lands above the threshold (false-alarm rate)
 *   power     — chance that the real-effect world lands above it · miss = 1 − power
 *   runs, flagged — experiments simulated in the world now chosen, and how many of them came out significant.
 *                   Random: never check `flagged`.
 *
 * setState accepts { n, effect, alpha, threshold, world, runs }. Everything except the simulated dots is exact.
 */
import { frame, button, readout, sliderRow, handle, hue, s, h, clamp, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('power-lab', `
  .widget-power-lab .pw-pick { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-power-lab .pw-pick-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-power-lab .pw-pick .btn[aria-pressed='true'] { --btn-bg: var(--ink); --btn-fg: var(--paper); }
  .widget-power-lab.is-row .pw-pick { justify-content: flex-start; }
`);

/** Standard normal cumulative distribution (Hart's algorithm as given by G. West, 2005; accurate to about 1e-15). */
export function normalCdf(x) {
  const ax = Math.abs(x);
  let c;
  if (ax > 37) c = 0;
  else {
    const e = Math.exp((-ax * ax) / 2);
    if (ax < 7.07106781186547) {
      let b = 3.52624965998911e-02 * ax + 0.700383064443688;
      b = b * ax + 6.37396220353165;
      b = b * ax + 33.912866078383;
      b = b * ax + 112.079291497871;
      b = b * ax + 221.213596169931;
      b = b * ax + 220.206867912376;
      c = e * b;
      b = 8.83883476483184e-02 * ax + 1.75566716318264;
      b = b * ax + 16.064177579207;
      b = b * ax + 86.7807322029461;
      b = b * ax + 296.564248779674;
      b = b * ax + 637.333633378831;
      b = b * ax + 793.826512519948;
      b = b * ax + 440.413735824752;
      c /= b;
    } else {
      let b = ax + 0.65;
      b = ax + 4 / b;
      b = ax + 3 / b;
      b = ax + 2 / b;
      b = ax + 1 / b;
      c = e / b / 2.506628274631;
    }
  }
  return x > 0 ? 1 - c : c;
}

/** The z with a share `tail` of the standard normal above it (by bisection). */
export function upperZ(tail) {
  let lo = -10;
  let hi = 10;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (1 - normalCdf(mid) > tail) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/** Standard error of the result: the difference between two groups of n, or one average of n. */
export const standardError = (sd, n, groups = 2) => sd * Math.sqrt((groups === 1 ? 1 : 2) / n);

/** False-alarm rate, power and miss rate of a test that calls results above `threshold` significant. */
export function rates({ sd = 10, n = 20, effect = 0, threshold = 0, groups = 2 }) {
  const se = standardError(sd, n, groups);
  const alpha = 1 - normalCdf(threshold / se);
  const power = 1 - normalCdf((threshold - effect) / se);
  return { se, alpha, power, miss: 1 - power };
}

let hatchSeq = 0;
const W = 560;
const X0 = 20;
const X1 = 540;
const TOP = 52;
const BASE = 200;

export default function create(spec, env) {
  const compact = !!env.compact;
  const sd = Math.max(1e-6, Number(spec.sd != null ? spec.sd : 10));
  const groups = spec.groups === 1 ? 1 : 2;
  const sizes = Array.isArray(spec.sizes) && spec.sizes.length ? spec.sizes.map((v) => Math.max(2, Math.round(v))) : null;
  const nRange = !sizes && Array.isArray(spec.nRange) ? spec.nRange : null;
  const effRange = Array.isArray(spec.effectRange) ? spec.effectRange : null;
  const alphas = Array.isArray(spec.alphas) && spec.alphas.length ? spec.alphas : null;
  const sims = Array.isArray(spec.simulate) && spec.simulate.length ? spec.simulate : null;
  const dragMode = !!spec.drag;
  const cap = clamp(Math.round(spec.max || 300), 10, 1000);
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const isStatic = !!spec.static || compact;
  let n = Math.max(2, Math.round(spec.n || (sizes ? sizes[0] : 20)));
  let effect = Number(spec.effect != null ? spec.effect : 3);
  let alpha = Number(spec.alpha != null ? spec.alpha : 0.05);
  let world = spec.world === 'null' ? 'null' : 'real';
  let readOnly = !!env.readOnly;
  const seOf = () => standardError(sd, n, groups);
  const snap = Number(spec.snap) || 0.1;
  let threshold = dragMode && spec.threshold != null ? Number(spec.threshold) : tidy(upperZ(alpha) * seOf(), 6);
  if (dragMode && spec.threshold == null) threshold = Math.round(threshold / snap) * snap;

  const smallest = sizes ? Math.min(...sizes) : nRange ? nRange[0] : n;
  const widest = standardError(sd, smallest, groups);
  const biggest = effRange ? effRange[1] : effect;
  const xr = Array.isArray(spec.x) ? spec.x : [-3.3 * widest, Math.max(biggest, 0) + 3.3 * widest];
  const sx = (v) => X0 + ((v - xr[0]) / (xr[1] - xr[0])) * (X1 - X0);
  const ux = (pxv) => xr[0] + ((pxv - X0) / (X1 - X0)) * (xr[1] - xr[0]);

  /* simulated experiments: the observed difference of each, per world */
  const results = { null: [], real: [] };
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(env.rng.next(), 1e-12))) * Math.cos(2 * Math.PI * env.rng.next());
  const runOne = (w) => { results[w].push((w === 'real' ? effect : 0) + seOf() * gauss()); };
  const clearRuns = () => { results.null.length = 0; results.real.length = 0; };

  function getState() {
    const r = rates({ sd, n, effect, threshold, groups });
    return {
      n, effect: tidy(effect, 4), se: tidy(r.se, 5), threshold: tidy(threshold, 4),
      alpha: tidy(r.alpha, 6), miss: tidy(r.miss, 6), power: tidy(r.power, 6),
      world, runs: results[world].length, flagged: results[world].filter((v) => v > threshold).length,
    };
  }

  /* ------------------------------------------------------------ the figure */
  const H = compact ? 214 : sims ? 352 : 244;
  const fr = frame({ width: W, height: H, compact, label: spec.alt || 'Two bell curves and a threshold' });
  const { svg } = fr;
  const hatchId = `pw-hatch-${++hatchSeq}`;
  const defs = s('defs', {},
    s('pattern', { id: hatchId, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('rect', { width: 7, height: 7, fill: hue('orange', 'soft') }),
      s('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: hue('orange'), 'stroke-width': 3.5 })));
  svg.appendChild(defs);
  const gAreas = s('g');
  const gCurves = s('g');
  const gAxis = s('g');
  const gThr = s('g');
  const gDots = s('g');
  const gText = s('g');
  svg.append(gAreas, gCurves, gAxis, gThr, gDots, gText);

  gAxis.appendChild(s('line.axis-line', { x1: X0, x2: X1, y1: BASE, y2: BASE }));
  if (!compact) {
    for (const v of ticks(xr[0], xr[1], niceStep(xr[1] - xr[0], 9))) {
      gAxis.appendChild(s('line.axis-line', { x1: sx(v), x2: sx(v), y1: BASE, y2: BASE + 5, 'stroke-width': 1.5 }));
      gAxis.appendChild(s('text.tick-label', { x: sx(v), y: BASE + 19, 'text-anchor': 'middle' }, formatNumber(v, 2)));
    }
    gAxis.appendChild(s('text.axis-label', { x: (X0 + X1) / 2, y: BASE + 38, 'text-anchor': 'middle' }, spec.xLabel || `difference seen in the experiment${unit ? ` (${unit.trim()})` : ''}`));
    // legend: the three shaded regions, told apart by pattern as well as colour
    const items = [['false alarm', hue('red'), 'var(--ink)'], ['miss', `url(#${hatchId})`, hue('orange')], ['detected', hue('green', 'soft'), hue('green')]];
    let lx = X0 + 2;
    for (const [name, fill, stroke] of items) {
      gText.appendChild(s('rect', { x: lx, y: 7, width: 16, height: 13, rx: 3, fill, stroke, 'stroke-width': 1.5 }));
      const label = s('text.fig-label-sm', { x: lx + 22, y: 18 }, name);
      gText.appendChild(label);
      lx += 22 + name.length * 9.6 + 20;
    }
  }
  const nullName = s('text.fig-label-sm', { 'text-anchor': 'end', y: 40, style: `fill:${hue('gray', 'text')}` });
  const realName = s('text.fig-label-sm', { 'text-anchor': 'start', y: 40, style: `fill:${hue('blue', 'text')}` });
  const verdict = s('text.fig-label-sm', { y: TOP + 20 });
  const dotsTitle = s('text.fig-label', { x: X0, y: BASE + 62 });
  if (!compact) gText.append(nullName, realName, verdict, dotsTitle);

  const roAlpha = readout('false alarms', { color: 'red' });
  const roMiss = readout('misses', { color: 'orange' });
  const roPower = readout('power', { color: 'green' });
  if (!compact) fr.readouts.append(roAlpha.el, roMiss.el, roPower.el);
  const pct = (v) => `${formatNumber(100 * v, v < 0.0995 || v > 0.9005 ? 1 : 0)}%`;

  const density = (v, centre, se) => Math.exp(-0.5 * ((v - centre) / se) ** 2);
  function bellPath(centre, se, from, to, closed) {
    const a = Math.max(xr[0], from);
    const b = Math.min(xr[1], to);
    if (!(b > a)) return '';
    const steps = Math.max(8, Math.ceil(((b - a) / (xr[1] - xr[0])) * 220));
    let d = closed ? `M${sx(a).toFixed(1)} ${BASE}` : '';
    for (let i = 0; i <= steps; i++) {
      const v = a + ((b - a) * i) / steps;
      const y = BASE - density(v, centre, se) * (BASE - TOP);
      d += `${d ? 'L' : 'M'}${sx(v).toFixed(1)} ${y.toFixed(1)}`;
    }
    return closed ? `${d}L${sx(b).toFixed(1)} ${BASE}Z` : d;
  }

  let thrHandle = null;
  const sliders = {};
  const alphaBtns = [];
  const worldBtns = [];
  const simBtns = [];
  let resetBtn = null;

  function draw() {
    const st = getState();
    const se = st.se;
    gAreas.replaceChildren(
      s('path', { d: bellPath(effect, se, threshold, xr[1], true), fill: hue('green', 'soft') }),
      s('path', { d: bellPath(effect, se, xr[0], threshold, true), fill: `url(#${hatchId})`, opacity: 0.9 }),
      s('path', { d: bellPath(0, se, threshold, xr[1], true), fill: hue('red'), opacity: 0.85 }),
    );
    gCurves.replaceChildren(
      s('path', { d: bellPath(0, se, xr[0], xr[1], false), fill: 'none', stroke: hue('gray'), 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      s('path', { d: bellPath(effect, se, xr[0], xr[1], false), fill: 'none', stroke: hue('blue'), 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    );
    nullName.setAttribute('x', sx(0) - 6);
    nullName.textContent = 'no effect';
    realName.setAttribute('x', sx(effect) + 6);
    realName.textContent = `real effect ${effect > 0 ? '+' : ''}${formatNumber(effect, 2)}`;

    const tx = clamp(sx(threshold), X0, X1);
    gThr.replaceChildren(s('line', { x1: tx, x2: tx, y1: TOP - 6, y2: BASE + (dragMode ? 0 : 6), stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    if (thrHandle) { gThr.appendChild(thrHandle.el); thrHandle.set(tx, BASE); thrHandle.setLabel(`threshold ${formatNumber(threshold, 1)}, false alarms ${pct(st.alpha)}, misses ${pct(st.miss)}`); }
    const roomRight = X1 - tx > 150;
    verdict.setAttribute('x', tx + (roomRight ? 8 : -8));
    verdict.setAttribute('text-anchor', roomRight ? 'start' : 'end');
    verdict.textContent = roomRight ? '"significant" →' : '← not significant';

    // simulated experiments
    gDots.replaceChildren();
    if (sims && !compact) {
      const list = results[world];
      const floor = H - 10;
      const piles = new Map();
      const cell = 7;
      for (const v of list) { const key = Math.round(sx(clamp(v, xr[0], xr[1])) / cell); piles.set(key, (piles.get(key) || 0) + 1); }
      const tallest = Math.max(1, ...piles.values());
      const gap = Math.min(6.6, (floor - (BASE + 76)) / tallest);
      const level = new Map();
      for (const v of list) {
        const key = Math.round(sx(clamp(v, xr[0], xr[1])) / cell);
        const k = level.get(key) || 0;
        level.set(key, k + 1);
        const hit = v > threshold;
        const color = world === 'real' ? 'green' : 'red';
        gDots.appendChild(s('circle', {
          cx: key * cell, cy: floor - 3.4 - k * gap, r: 3,
          fill: hit ? hue(color) : 'var(--surface)', stroke: hit ? 'var(--ink)' : hue(world === 'real' ? 'orange' : 'gray'), 'stroke-width': hit ? 1 : 1.8,
        }));
      }
      gDots.appendChild(s('line', { x1: X0, x2: X1, y1: floor, y2: floor, stroke: 'var(--hair)', 'stroke-width': 2 }));
      gDots.appendChild(s('line', { x1: tx, x2: tx, y1: BASE + 70, y2: floor, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
      dotsTitle.textContent = list.length
        ? `${list.length} ${list.length === 1 ? 'experiment' : 'experiments'}, ${world === 'real' ? 'effect real' : 'no effect'}: ${st.flagged} significant`
        : `Experiments ${world === 'real' ? 'with the real effect' : 'with no effect'} land here`;
    }

    roAlpha.set(pct(st.alpha));
    roMiss.set(pct(st.miss));
    roPower.set(pct(st.power));
    for (const [key, btn] of alphaBtns) btn.setAttribute('aria-pressed', String(Math.abs(key - alpha) < 1e-12));
    for (const [key, btn] of worldBtns) btn.setAttribute('aria-pressed', String(key === world));
    for (const btn of simBtns) btn.disabled = readOnly || results[world].length >= cap;
    if (resetBtn) resetBtn.disabled = readOnly || !results[world].length;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Groups of ${n}, true effect ${formatNumber(effect, 2)}${unit}. Threshold at ${formatNumber(threshold, 2)}: `
      + `false-alarm rate ${pct(st.alpha)}, miss rate ${pct(st.miss)}, power ${pct(st.power)}.`
      + (sims && results[world].length ? ` ${results[world].length} simulated experiments, ${st.flagged} significant.` : ''));
  }

  /* -------------------------------------------------------------- controls */
  const follow = () => { if (!dragMode) threshold = tidy(upperZ(alpha) * seOf(), 6); };
  const changed = () => { draw(); env.onChange(getState()); };
  if (!isStatic) {
    if (dragMode) {
      thrHandle = handle(svg, {
        x: sx(threshold), y: BASE, color: 'yellow', label: 'Threshold', keyStep: (snap / (xr[1] - xr[0])) * (X1 - X0),
        onMove: (pxv) => { if (readOnly) return; threshold = clamp(Math.round(ux(pxv) / snap) * snap, xr[0], xr[1]); threshold = tidy(threshold, 6); changed(); },
      });
    }
    if (sizes || nRange) {
      const cfg = sizes
        ? { min: 0, max: sizes.length - 1, step: 1, value: Math.max(0, sizes.indexOf(n)), format: (i) => sizes[i].toLocaleString('en-US') }
        : { min: nRange[0], max: nRange[1], step: nRange[2] || 1, value: n, format: (v) => v.toLocaleString('en-US') };
      if (sizes && !sizes.includes(n)) n = sizes[0];
      sliders.n = sliderRow({
        label: spec.nLabel || 'people per group', ...cfg, color: 'blue',
        onInput: (v) => { if (readOnly) return; n = sizes ? sizes[v] : v; clearRuns(); follow(); play('tap'); changed(); },
      });
      fr.controls.appendChild(sliders.n.el);
    }
    if (effRange) {
      effect = clamp(effect, effRange[0], effRange[1]);
      sliders.effect = sliderRow({
        label: spec.effectLabel || 'true effect', min: effRange[0], max: effRange[1], step: effRange[2] || 0.5, value: effect, color: 'violet', unit: spec.unit || '',
        onInput: (v) => { if (readOnly) return; effect = v; clearRuns(); play('tap'); changed(); },
      });
      fr.controls.appendChild(sliders.effect.el);
    }
    const picker = (label, items, into, onPick) => {
      const box = h('div.pw-pick', h('span.pw-pick-label', label));
      for (const [key, text] of items) {
        const btn = button(text, () => { if (readOnly) return; onPick(key); play('select'); changed(); });
        btn.setAttribute('aria-pressed', 'false');
        into.push([key, btn]);
        box.appendChild(btn);
      }
      fr.controls.appendChild(box);
    };
    if (alphas && !dragMode) picker('False-alarm rate:', alphas.map((a) => [a, `${formatNumber(100 * a, 2)}%`]), alphaBtns, (a) => { alpha = a; follow(); });
    if (spec.worlds && sims) picker('World:', [['null', 'no effect'], ['real', 'real effect']], worldBtns, (w) => { world = w; });
    if (sims) {
      const take = (times) => {
        if (readOnly) return;
        const room = cap - results[world].length;
        if (room <= 0) { env.announce('That is enough experiments. Press Reset to start again.'); return; }
        for (let i = 0; i < Math.min(times, room); i++) runOne(world);
        play(times > 1 ? 'drop' : 'tick');
        const st = getState();
        env.announce(`${st.runs} experiments, ${st.flagged} significant.`);
        changed();
      };
      sims.forEach((times, i) => {
        const btn = button(times === 1 ? 'Run 1 experiment' : `Run ${times}`, () => take(times), i === 0 ? { icon: 'play', variant: 'primary' } : { icon: 'layers' });
        simBtns.push(btn);
        fr.buttons.appendChild(btn);
      });
      resetBtn = button('Reset', () => { if (readOnly) return; results[world].length = 0; changed(); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(resetBtn);
    }
  }
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      let moved = false;
      if (next.n != null) {
        const want = Math.round(next.n);
        const ok = sizes ? sizes.includes(want) : nRange ? want >= nRange[0] && want <= nRange[1] : true;
        if (ok && want !== n) { n = want; moved = true; if (sliders.n) sliders.n.set(sizes ? sizes.indexOf(n) : n); }
      }
      if (next.effect != null) {
        const want = effRange ? clamp(Number(next.effect), effRange[0], effRange[1]) : Number(next.effect);
        if (want !== effect) { effect = want; moved = true; if (sliders.effect) sliders.effect.set(effect); }
      }
      if (moved) clearRuns();
      if (next.alpha != null && !dragMode) alpha = Number(next.alpha);
      follow();
      if (next.threshold != null && dragMode) threshold = clamp(Number(next.threshold), xr[0], xr[1]);
      if (next.world === 'null' || next.world === 'real') world = next.world;
      if (typeof next.runs === 'number' && sims) {
        const want = clamp(Math.round(next.runs), 0, cap);
        if (results[world].length > want) results[world].length = want;
        while (results[world].length < want) runOne(world);
      }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (thrHandle) thrHandle.setEnabled(!readOnly);
      for (const key of Object.keys(sliders)) sliders[key].setDisabled(readOnly);
      for (const [, btn] of [...alphaBtns, ...worldBtns]) btn.disabled = readOnly;
      draw();
    },
    destroy() { if (thrHandle) thrHandle.destroy(); },
  };
}

export const examples = [
  {
    title: 'power-lab — drag the threshold: fewer false alarms, more misses',
    spec: { type: 'power-lab', sd: 10, effect: 5, n: 50, drag: true, unit: 'points' },
  },
  {
    title: 'power-lab — group size and effect size drive the power',
    spec: { type: 'power-lab', sd: 10, effect: 3, n: 20, nRange: [10, 400, 10], effectRange: [0, 8, 0.5], unit: 'points' },
  },
  {
    title: 'power-lab — run small experiments on a real effect',
    spec: { type: 'power-lab', sd: 10, effect: 3, n: 20, simulate: [1, 100], worlds: true, unit: 'points' },
  },
];
