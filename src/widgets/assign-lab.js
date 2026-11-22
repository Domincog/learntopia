/**
 * assign-lab — who gets the treatment? A class of people, each with a score
 * they would get WITHOUT the treatment, and a trait (say, being keen) that
 * goes with higher scores. The learner splits them into a treated group and
 * a control group in two ways:
 *
 *   'choice'  people choose for themselves, and those with the trait mostly pick the treatment
 *   'coin'    a coin toss for each person
 *
 * and compares the groups' average scores. With self-selection the treated
 * group is ahead even when the treatment does nothing, because it is full of
 * people with the trait. With coin tosses the difference is centred on the
 * true effect. Repeating an assignment many times piles the differences up
 * underneath, one strip per method.
 *
 * {
 *   type: 'assign-lab',
 *   units: [{ trait: true, score: 74 }, …],   // optional fixed people (whole-number scores); otherwise they are invented:
 *   count: 40,                     //   how many (half of them have the trait)
 *   scores: { trait: [72, 6], other: [57, 6] },   //   mean and SD of the scores of each kind
 *   effect: 0,                     // what the treatment really adds to a treated person's score
 *   lean: 0.8,                     // 'choice': chance that a person with the trait picks the treatment (others: 1 − lean)
 *   methods: ['choice', 'coin'],   // which ways of assigning are on offer
 *   repeat: 200,                   // size of the "repeat" button (0: no such button)
 *   max: 1000,                     // most assignments kept per method
 *   reveal: 'shown',               // the trait in the picture: 'shown' · 'hidden' · 'toggle' (a button reveals it)
 *   labels: { treat: 'app', control: 'no app', trait: 'keen', outcome: 'score', unit: 'points',
 *             choice: 'They choose', coin: 'Coin toss', people: 'students' },
 * }
 *
 * State: { method, runs, diff, treat, control, means, effect, revealed }
 *   method  — how the split on show was made: 'choice', 'coin' or null (not split yet)
 *   runs    — assignments made so far with each method: { choice, coin }
 *   diff    — treated average minus control average for the split on show (null before the first)
 *   treat, control — the two groups on show: { size, trait, mean } (trait: how many of them have it)
 *   means   — average of every difference seen so far with each method: { choice, coin } (null when none)
 *   Everything that depends on an assignment is random: check `runs`, `method` and `revealed` only.
 *
 * setState accepts { runs: { choice: 200, coin: 200 }, method, revealed }. Assignments use env.rng.
 */
import { frame, button, hue, s, clamp, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('assign-lab', `
  .widget-assign-lab .al-toggle[aria-pressed='true'] { --btn-bg: var(--ink); --btn-fg: var(--paper); }
`);

/** Average score of each group, and treated minus control, for one assignment (true = treated). */
export function compare(units, treated, effect = 0) {
  const sum = [0, 0];
  const size = [0, 0];
  const trait = [0, 0];
  units.forEach((u, i) => {
    const g = treated[i] ? 0 : 1;
    sum[g] += u.score + (treated[i] ? effect : 0);
    size[g]++;
    if (u.trait) trait[g]++;
  });
  const mean = [size[0] ? sum[0] / size[0] : null, size[1] ? sum[1] / size[1] : null];
  return {
    treat: { size: size[0], trait: trait[0], mean: mean[0] }, control: { size: size[1], trait: trait[1], mean: mean[1] },
    diff: mean[0] == null || mean[1] == null ? null : mean[0] - mean[1],
  };
}

const W = 560;
const X0 = 20;
const X1 = 540;
const LEFT = 150;

export default function create(spec, env) {
  const compact = !!env.compact;
  const L = { treat: 'treated', control: 'control', trait: 'trait', outcome: 'score', unit: '', choice: 'They choose', coin: 'Coin toss', people: 'people', ...(spec.labels || {}) };
  const unit = L.unit ? ` ${L.unit}` : '';
  const effect = Number(spec.effect) || 0;
  const lean = clamp(Number(spec.lean != null ? spec.lean : 0.8), 0, 1);
  const methods = (Array.isArray(spec.methods) && spec.methods.length ? spec.methods : ['choice', 'coin']).filter((m) => m === 'choice' || m === 'coin');
  const repeatBy = spec.repeat === 0 ? 0 : clamp(Math.round(spec.repeat || 200), 2, 1000);
  const cap = clamp(Math.round(spec.max || 1000), 10, 5000);
  const revealMode = ['shown', 'hidden', 'toggle'].includes(spec.reveal) ? spec.reveal : 'shown';
  let revealed = revealMode === 'shown';
  let readOnly = !!env.readOnly;

  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(env.rng.next(), 1e-12))) * Math.cos(2 * Math.PI * env.rng.next());
  let units;
  if (Array.isArray(spec.units) && spec.units.length >= 4) {
    units = spec.units.map((u) => ({ trait: !!u.trait, score: Math.round(Number(u.score) || 0) }));
  } else {
    const count = clamp(Math.round(spec.count || 40), 4, 80);
    const sc = { trait: [72, 6], other: [57, 6], ...(spec.scores || {}) };
    units = Array.from({ length: count }, (_, i) => {
      const has = i < count / 2;
      const [m, sd] = has ? sc.trait : sc.other;
      return { trait: has, score: Math.round(m + sd * gauss()) };
    });
  }
  const N = units.length;

  /* one assignment */
  function assign(method) {
    for (let guard = 0; guard < 200; guard++) {
      const treated = units.map((u) => env.rng.next() < (method === 'coin' ? 0.5 : u.trait ? lean : 1 - lean));
      const k = treated.filter(Boolean).length;
      if (k > 0 && k < N) return treated;
    }
    return units.map((_, i) => i % 2 === 0);
  }
  let method = null;
  let current = null;                       // the split on show
  const diffs = { choice: [], coin: [] };   // every difference seen so far
  const doRun = (m, times) => {
    for (let i = 0; i < times && diffs[m].length < cap; i++) {
      current = assign(m);
      diffs[m].push(compare(units, current, effect).diff);
    }
    method = m;
  };

  function getState() {
    const now = current ? compare(units, current, effect) : null;
    const avg = (list) => (list.length ? tidy(list.reduce((a, b) => a + b, 0) / list.length, 3) : null);
    const side = (g) => (g ? { size: g.size, trait: g.trait, mean: tidy(g.mean, 3) } : null);
    return {
      method, runs: { choice: diffs.choice.length, coin: diffs.coin.length },
      diff: now ? tidy(now.diff, 3) : null, treat: side(now && now.treat), control: side(now && now.control),
      means: { choice: avg(diffs.choice), coin: avg(diffs.coin) }, effect, revealed,
    };
  }

  /* -------------------------------------------------------------- geometry */
  const scores = units.map((u) => u.score);
  const sLo = Math.min(...scores) - 3;
  const sHi = Math.max(...scores) + Math.max(0, effect) + 3;
  const sx = (v) => LEFT + ((v - sLo) / (sHi - sLo)) * (X1 - 6 - LEFT);
  const rowY = [66, 112];
  const stripTop = 178;
  const stripH = 54;
  const stripGap = 22;
  const stripBase = (k) => stripTop + (k + 1) * stripH + k * stripGap;
  const H = compact ? 150 : stripBase(methods.length - 1) + 42;
  const fr = frame({ width: W, height: H, compact, label: spec.alt || 'People split into a treated group and a control group' });
  const { svg } = fr;

  // the differences axis: wide enough for both methods
  const mean = (list) => list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);
  const mT = mean(units.filter((u) => u.trait).map((u) => u.score));
  const mO = mean(units.filter((u) => !u.trait).map((u) => u.score));
  const all = mean(scores);
  const sdAll = Math.sqrt(mean(scores.map((v) => (v - all) ** 2)));
  const bias = (2 * lean - 1) * (mT - mO);
  const se = sdAll * Math.sqrt(4 / N);
  const dr = Array.isArray(spec.diffAxis) ? spec.diffAxis : [Math.floor(Math.min(0, bias) + effect - 3.6 * se), Math.ceil(Math.max(0, bias) + effect + 3.6 * se)];
  const dx = (v) => LEFT + ((v - dr[0]) / (dr[1] - dr[0])) * (X1 - 6 - LEFT);

  const gFixed = s('g');
  const gPeople = s('g');
  const gStrips = s('g');
  const gText = s('g');
  svg.append(gFixed, gPeople, gStrips, gText);
  const caption = s('text.fig-label', { x: X0, y: 20 });
  const gapText = s('text.fig-label', { x: X1, y: 20, 'text-anchor': 'end' });
  if (!compact) gText.append(caption, gapText);
  const num = (v, d = 1) => formatNumber(v, d);
  const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v))}`;

  // fixed parts: the score axis, the strips and their axis
  const scoreStep = niceStep(sHi - sLo, 7);
  for (const v of ticks(sLo, sHi, scoreStep)) {
    gFixed.appendChild(s('line', { x1: sx(v), x2: sx(v), y1: 38, y2: 126, stroke: 'var(--hair)', 'stroke-width': 1 }));
    if (!compact) gFixed.appendChild(s('text.tick-label', { x: sx(v), y: 142, 'text-anchor': 'middle' }, String(v)));
  }
  if (!compact) {
    gFixed.appendChild(s('text.axis-label', { x: X1, y: 158, 'text-anchor': 'end' }, `${L.outcome}${unit ? ` (${L.unit})` : ''}`));
    methods.forEach((m, k) => {
      gFixed.appendChild(s('line.axis-line', { x1: LEFT - 8, x2: X1, y1: stripBase(k), y2: stripBase(k) }));
      gFixed.appendChild(s('text.fig-label', { x: X0, y: stripBase(k) - 22 }, L[m]));
    });
    const last = stripBase(methods.length - 1);
    for (const v of ticks(dr[0], dr[1], niceStep(dr[1] - dr[0], 7))) {
      gFixed.appendChild(s('line.axis-line', { x1: dx(v), x2: dx(v), y1: last, y2: last + 5, 'stroke-width': 1.5 }));
      gFixed.appendChild(s('text.tick-label', { x: dx(v), y: last + 19, 'text-anchor': 'middle' }, signed(v)));
    }
    gFixed.appendChild(s('text.axis-label', { x: (LEFT + X1) / 2, y: last + 37, 'text-anchor': 'middle' }, `${L.treat} average − ${L.control} average${unit ? ` (${L.unit})` : ''}`));
    const ex = dx(effect);
    gFixed.appendChild(s('line', { x1: ex, x2: ex, y1: stripTop - 4, y2: last, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
    gFixed.appendChild(s('text.fig-label-sm', { x: ex + (ex > X1 - 150 ? -6 : 6), y: stripTop + 4, 'text-anchor': ex > X1 - 150 ? 'end' : 'start' }, `true effect: ${signed(effect) || '0'}`));
  }

  const person = (u, x, y) => (u.trait && revealed
    ? s('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 1.5, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 1.5 })
    : s('circle', { cx: x, cy: y, r: 5, fill: revealed ? 'var(--surface)' : hue('gray', 'soft'), stroke: revealed ? hue('gray') : 'var(--ink)', 'stroke-width': revealed ? 2 : 1.3 }));

  const choiceBtns = {};
  let repeatBtn = null;
  let resetBtn = null;
  let revealBtn = null;

  function draw() {
    const st = getState();
    gPeople.replaceChildren();
    const rows = current ? [0, 1] : [0];
    const ys = current ? rowY : [(rowY[0] + rowY[1]) / 2];
    const piles = [new Map(), new Map()];
    const place = units.map((u, i) => {
      const row = current ? (current[i] ? 0 : 1) : 0;
      const shown = u.score + (current && current[i] ? effect : 0);
      const key = Math.round(shown);
      const level = piles[row].get(key) || 0;
      piles[row].set(key, level + 1);
      return { u, row, shown, level };
    });
    // equal scores pile up; a tall pile is squeezed so that it stays inside its own row
    const tallest = Math.max(1, ...piles[0].values(), ...piles[1].values());
    const rise = Math.min(7.5, 26 / Math.max(1, tallest - 1));
    for (const it of place) gPeople.appendChild(person(it.u, sx(it.shown), ys[it.row] + 6 - it.level * rise));
    if (!compact) {
      rows.forEach((row) => {
        const g = current ? (row === 0 ? st.treat : st.control) : null;
        const name = current ? (row === 0 ? L.treat : L.control) : `all ${N} ${L.people}`;
        gPeople.appendChild(s('text.fig-label', { x: X0, y: ys[row] + (current ? -2 : 4) }, name));
        if (g) {
          gPeople.appendChild(s('text.fig-label-sm', { x: X0, y: ys[row] + 14, style: revealed ? `fill:${hue('violet', 'text')}` : 'fill:var(--ink-3)' },
            revealed ? `${L.trait}: ${g.trait} of ${g.size}` : `${g.size} ${L.people}`));
          const x = sx(g.mean);
          gPeople.appendChild(s('line', { x1: x, x2: x, y1: ys[row] - 22, y2: ys[row] + 14, stroke: 'var(--ink)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
          gPeople.appendChild(s('text.fig-label-sm', { x: x + (row === 0 ? 7 : -7), y: ys[row] - 14, 'text-anchor': row === 0 ? 'start' : 'end' }, `average ${num(g.mean)}`));
        }
      });
    }
    caption.textContent = !current ? `${N} ${L.people}, not yet split`
      : method === 'coin' ? 'A coin decided for each one' : 'Everyone chose for themselves';
    gapText.textContent = current ? `${L.treat} ${st.diff < 0 ? 'behind' : 'ahead'} by ${num(Math.abs(st.diff))}${unit}` : '';

    gStrips.replaceChildren();
    if (!compact) {
      methods.forEach((m, k) => {
        const list = diffs[m];
        const base = stripBase(k);
        const bins = new Map();
        for (const d of list) { const key = Math.floor(d); bins.set(key, (bins.get(key) || 0) + 1); }
        const tallest = Math.max(1, ...bins.values());
        const unitH = Math.min(7, (stripH - 8) / tallest);
        const bw = dx(1) - dx(0);
        for (const [key, c] of bins) {
          if (key < dr[0] - 1 || key > dr[1]) continue;
          gStrips.appendChild(s('rect', { x: dx(key) + 0.6, y: base - c * unitH, width: Math.max(1, bw - 1.2), height: c * unitH, fill: hue(m === 'coin' ? 'teal' : 'pink'), stroke: 'var(--ink)', 'stroke-width': 0.8 }));
        }
        if (method === m && current && st.diff != null) {
          const x = clamp(dx(st.diff), LEFT - 6, X1);
          gStrips.appendChild(s('path', { d: `M${x - 6} ${base + 11}L${x} ${base + 2}L${x + 6} ${base + 11}Z`, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
        }
        gStrips.appendChild(s('text.fig-label-sm', { x: X0, y: base - 6, style: 'fill:var(--ink-3)' },
          list.length ? `${list.length} ${list.length === 1 ? 'split' : 'splits'}, mean ${signed(st.means[m])}` : 'no splits yet'));
      });
    }

    for (const m of Object.keys(choiceBtns)) choiceBtns[m].disabled = readOnly || diffs[m].length >= cap;
    if (repeatBtn) {
      repeatBtn.disabled = readOnly || !method || diffs[method].length >= cap;
      repeatBtn.lastChild.textContent = method ? `Repeat ${repeatBy}× (${L[method].toLowerCase()})` : `Repeat ${repeatBy}×`;
    }
    if (resetBtn) resetBtn.disabled = readOnly || !current;
    if (revealBtn) { revealBtn.setAttribute('aria-pressed', String(revealed)); revealBtn.disabled = readOnly; }
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}`
      + (current
        ? `${method === 'coin' ? 'Assigned by coin toss' : 'Self-selected'}: ${L.treat} group of ${st.treat.size} averages ${num(st.treat.mean)}, ${L.control} group of ${st.control.size} averages ${num(st.control.mean)}, a difference of ${signed(st.diff)}${unit}.`
          + (revealed ? ` ${st.treat.trait} of the ${L.treat} group and ${st.control.trait} of the ${L.control} group are ${L.trait}.` : '')
        : `${N} ${L.people}, not yet split.`)
      + methods.map((m) => (diffs[m].length ? ` ${L[m]}: ${diffs[m].length} splits, mean difference ${signed(st.means[m])}.` : '')).join('')
      + ` True effect: ${num(effect)}.`);
  }

  /* -------------------------------------------------------------- controls */
  const changed = () => { draw(); env.onChange(getState()); };
  if (!compact && !spec.static) {
    for (const m of methods) {
      const btn = button(m === 'coin' ? 'Toss a coin for each' : `Let them choose`, () => {
        if (readOnly) return;
        doRun(m, 1);
        play('drop');
        const st = getState();
        env.announce(`${L.treat} group averages ${num(st.treat.mean)}, ${L.control} group ${num(st.control.mean)}: a difference of ${signed(st.diff)}.`);
        changed();
      }, { icon: m === 'coin' ? 'dice' : 'hand', variant: m === methods[0] ? 'primary' : '' });
      choiceBtns[m] = btn;
      fr.buttons.appendChild(btn);
    }
    if (repeatBy) {
      repeatBtn = button(`Repeat ${repeatBy}×`, () => {
        if (readOnly || !method) return;
        doRun(method, repeatBy);
        play('drop');
        env.announce(`${diffs[method].length} splits. Mean difference ${signed(getState().means[method])}.`);
        changed();
      }, { icon: 'layers' });
      fr.buttons.appendChild(repeatBtn);
    }
    if (revealMode === 'toggle') {
      revealBtn = button(`Show who is ${L.trait}`, () => { if (readOnly) return; revealed = !revealed; play('select'); changed(); }, { icon: 'eye' });
      revealBtn.classList.add('al-toggle');
      fr.buttons.appendChild(revealBtn);
    }
    resetBtn = button('Reset', () => { if (readOnly) return; diffs.choice.length = 0; diffs.coin.length = 0; current = null; method = null; changed(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(resetBtn);
  }
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.runs && typeof next.runs === 'object') {
        for (const m of methods) {
          if (next.runs[m] == null) continue;
          const want = clamp(Math.round(next.runs[m]), 0, cap);
          if (diffs[m].length > want) diffs[m].length = want;
          if (diffs[m].length < want) doRun(m, want - diffs[m].length);
        }
      }
      if (methods.includes(next.method) && diffs[next.method].length) {
        if (method !== next.method) { method = next.method; current = assign(method); diffs[method][diffs[method].length - 1] = compare(units, current, effect).diff; }
      }
      if (typeof next.revealed === 'boolean' && revealMode !== 'hidden') revealed = next.revealed;
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); draw(); },
  };
}

export const examples = [
  {
    title: 'assign-lab — a treatment that does nothing, assigned two ways',
    spec: { type: 'assign-lab', effect: 0, labels: { treat: 'app', control: 'no app', trait: 'keen', outcome: 'exam score', unit: 'points', people: 'students' } },
  },
];
