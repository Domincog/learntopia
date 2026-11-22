/**
 * softmax-bars — from scores to probabilities, one row per class. Each row
 * shows the working of softmax from left to right:
 *
 *     score  →  base to the power of the score  →  its share of the total
 *
 * The base is 2 (easy to do by hand) or e (what real systems use). Optional
 * sliders change single scores, add the same amount to every score, or divide
 * every score by a "temperature" first. With a right answer marked, the
 * cross-entropy loss, −ln(probability given to the right answer), is shown too.
 *
 * {
 *   type: 'softmax-bars',
 *   classes: ['cat', 'dog', 'fox'],   // two to five short names
 *   scores: [2, 1, 1],                // one score per class
 *   base: 2,                          // 2 or 'e'
 *   sliders: [0, 1, 2],               // which scores get a slider (keep all sliders together to three)
 *   range: { min: -3, max: 5, step: 1 },   // range of those sliders
 *   shift: { min: -4, max: 4, step: 1, value: 0 },         // a slider that adds the same amount to every score
 *   temperature: { min: 0.2, max: 4, step: 0.2, value: 1 },   // a slider: every score is divided by it first
 *                                     //   (a plain number fixes the temperature without a slider)
 *   target: 0,                        // index of the right answer: marks its row and shows the loss
 *   digits: 2,                        // decimals shown
 *   static: false,                    // true: a picture without sliders
 * }
 *
 * State: { scores, shift, temperature, exponents, powers, total, probs, top, target, loss, tried }
 *   scores     the scores as they stand (single-score sliders and the shift included)
 *   exponents  scores ÷ temperature: what the base is raised to
 *   powers     base ^ exponent for every class, and their `total`
 *   probs      powers ÷ total: the probabilities (they add up to 1)
 *   top        index of the most probable class (the first one, if several tie)
 *   loss       −ln(probs[target]), the natural logarithm whatever the base (null without a target)
 *   tried      how many different settings the learner has looked at so far
 *
 * setState accepts { scores: [...], shift, temperature }, where `scores` are the scores before the shift is added.
 */
import { frame, sliderRow, readout, hue, s, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

addStyles('softmax-bars', `
  .widget-softmax-bars .sb-sup { font-size: 0.72em; }
`);

const W = 500;
const HEAD = 30;
const ROW = 48;
const FOOT = 30;
const X_NAME = 14;
const X_SCORE = 136;
const X_POWER = 240;
const BAR0 = 312;
const BAR1 = 428;
const X_PROB = 490;

/** Softmax of a list of scores: base ^ (score / temperature), divided by the total. */
export function softmax(scores, { base = Math.E, temperature = 1 } = {}) {
  const exponents = scores.map((v) => v / temperature);
  const top = Math.max(...exponents);
  const powers = exponents.map((v) => Math.pow(base, v));
  const total = powers.reduce((t, v) => t + v, 0);
  // the shares are worked out from shifted exponents, so that very large scores do not overflow
  const safe = exponents.map((v) => Math.pow(base, v - top));
  const safeTotal = safe.reduce((t, v) => t + v, 0);
  return { exponents, powers, total, probs: safe.map((v) => v / safeTotal) };
}

export default function create(spec, env) {
  const classes = (spec.classes || ['A', 'B', 'C']).slice(0, 5).map(String);
  const k = classes.length;
  const base = spec.base === 2 ? 2 : Math.E;
  const baseName = spec.base === 2 ? '2' : 'e';
  const digits = spec.digits != null ? spec.digits : 2;
  const isStatic = !!spec.static || !!env.compact;
  const range = { min: -3, max: 5, step: 1, ...(spec.range || {}) };
  const sliderIdx = isStatic ? [] : (Array.isArray(spec.sliders) ? spec.sliders.filter((i) => i >= 0 && i < k) : []);
  const shiftDef = spec.shift && typeof spec.shift === 'object' ? { min: -4, max: 4, step: 1, value: 0, ...spec.shift } : null;
  const tempDef = spec.temperature && typeof spec.temperature === 'object' ? { min: 0.2, max: 4, step: 0.2, value: 1, ...spec.temperature } : null;
  const target = Number.isInteger(spec.target) && spec.target >= 0 && spec.target < k ? spec.target : null;
  let readOnly = !!env.readOnly;

  const raw = classes.map((_, i) => Number((spec.scores || [])[i]) || 0);
  let shift = shiftDef ? Number(shiftDef.value) || 0 : 0;
  let temperature = tempDef ? Number(tempDef.value) || 1 : (typeof spec.temperature === 'number' && spec.temperature > 0 ? spec.temperature : 1);
  const seen = new Set();
  const remember = () => seen.add(JSON.stringify([raw, shift, temperature]));

  const getState = () => {
    const scores = raw.map((v) => tidy(v + shift, 6));
    const sm = softmax(scores, { base, temperature });
    let top = 0;
    sm.probs.forEach((p, i) => { if (p > sm.probs[top] + 1e-12) top = i; });
    return {
      scores,
      shift,
      temperature,
      exponents: sm.exponents.map((v) => tidy(v, 6)),
      powers: sm.powers.map((v) => tidy(v, 6)),
      total: tidy(sm.total, 6),
      probs: sm.probs.map((v) => tidy(v, 6)),
      top,
      target,
      loss: target == null ? null : tidy(-Math.log(sm.probs[target]), 6),
      tried: seen.size,
    };
  };

  /* -------------------------------------------------------------- drawing */
  const H = HEAD + k * ROW + FOOT;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Scores turned into probabilities' });
  const { svg } = fr;
  const fmt = (v, d = digits) => formatNumber(v, d);
  const withTemp = !!tempDef || temperature !== 1;

  svg.appendChild(s('text', { class: 'fig-label-sm text-muted', x: X_SCORE, y: 19, 'text-anchor': 'middle' }, withTemp ? 'score ÷ T' : 'score'));
  svg.appendChild(s('text', { class: 'fig-label-sm text-muted', x: X_POWER, y: 19, 'text-anchor': 'middle' }, `${baseName} to that power`));
  svg.appendChild(s('text', { class: 'fig-label-sm text-muted', x: (BAR0 + X_PROB) / 2, y: 19, 'text-anchor': 'middle' }, 'share of the total'));

  const rows = classes.map((name, i) => {
    const y = HEAD + i * ROW;
    const mid = y + ROW / 2;
    const isTarget = i === target;
    const band = s('rect', { x: 4, y: y + 3, width: W - 8, height: ROW - 6, rx: 10, fill: isTarget ? hue('green', 'soft') : 'none', stroke: isTarget ? hue('green') : 'none', 'stroke-width': 2 });
    const label = s('text', { class: 'fig-label', x: X_NAME, y: isTarget ? mid - 1 : mid + 5 }, name);
    const tag = isTarget ? s('text', { class: 'fig-label-sm text-green', x: X_NAME, y: mid + 15 }, 'right answer') : null;
    const score = s('text', { class: 'fig-label', x: X_SCORE, y: mid + 5, 'text-anchor': 'middle' });
    const power = s('text', { class: 'fig-label', x: X_POWER, y: mid + 5, 'text-anchor': 'middle' });
    const track = s('rect', { x: BAR0, y: mid - 9, width: BAR1 - BAR0, height: 18, rx: 9, fill: 'var(--sunken)', stroke: 'var(--edge)', 'stroke-width': 2 });
    const bar = s('rect', { x: BAR0, y: mid - 9, width: 0, height: 18, rx: 9, fill: hue(isTarget ? 'green' : 'blue'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
    const prob = s('text', { class: 'fig-label', x: X_PROB, y: mid + 5, 'text-anchor': 'end' });
    svg.append(band, label, score, power, track, bar, prob);
    if (tag) svg.appendChild(tag);
    return { score, power, bar, prob };
  });
  const footY = HEAD + k * ROW + 19;
  const totalText = s('text', { class: 'fig-label-sm', x: X_POWER, y: footY, 'text-anchor': 'middle' });
  const sumText = s('text', { class: 'fig-label-sm', x: X_PROB, y: footY, 'text-anchor': 'end' }, 'these add up to 1');
  svg.append(totalText, sumText);

  const roLoss = readout('loss = −ln(share of the right answer)', { digits: 2, color: 'green' });
  if (target != null && !env.compact) fr.readouts.appendChild(roLoss.el);

  function draw() {
    const st = getState();
    rows.forEach((row, i) => {
      row.score.textContent = fmt(st.exponents[i]);
      row.power.replaceChildren(
        s('tspan', {}, baseName),
        s('tspan', { class: 'sb-sup', dy: -7 }, fmt(st.exponents[i])),
        s('tspan', { dy: 7 }, ` = ${fmt(st.powers[i])}`),
      );
      const wBar = Math.max(st.probs[i] * (BAR1 - BAR0), st.probs[i] > 0.0005 ? 5 : 0);
      row.bar.setAttribute('width', wBar.toFixed(2));
      row.bar.setAttribute('visibility', wBar > 0 ? 'visible' : 'hidden');
      row.prob.textContent = fmt(st.probs[i]);
    });
    totalText.textContent = `total ${fmt(st.total)}`;
    if (target != null) roLoss.set(fmt(st.loss));
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${classes.map((name, i) => `${name}: score ${fmt(st.exponents[i])}, probability ${fmt(st.probs[i])}`).join('; ')}.${target != null ? ` Loss ${fmt(st.loss)}.` : ''}`);
  }

  /* ------------------------------------------------------------- controls */
  const scoreRows = {};
  let shiftRow = null;
  let tempRow = null;
  const changed = () => { remember(); play('tap'); draw(); env.onChange(getState()); };
  if (!isStatic) {
    for (const i of sliderIdx) {
      raw[i] = clamp(raw[i], range.min, range.max);
      scoreRows[i] = sliderRow({
        label: `score for “${classes[i]}”`, min: range.min, max: range.max, step: range.step, value: raw[i], color: i === target ? 'green' : 'blue',
        onInput: (v) => { if (readOnly) return; raw[i] = v; changed(); },
      });
      fr.controls.appendChild(scoreRows[i].el);
    }
    if (shiftDef) {
      shiftRow = sliderRow({
        label: 'add to every score', min: shiftDef.min, max: shiftDef.max, step: shiftDef.step, value: shift, color: 'orange',
        onInput: (v) => { if (readOnly) return; shift = v; changed(); },
      });
      fr.controls.appendChild(shiftRow.el);
    }
    if (tempDef) {
      tempRow = sliderRow({
        label: 'temperature $T$', min: tempDef.min, max: tempDef.max, step: tempDef.step, value: temperature, color: 'violet',
        onInput: (v) => { if (readOnly) return; temperature = v; changed(); },
      });
      fr.controls.appendChild(tempRow.el);
    }
  }

  remember();
  draw();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.scores)) {
        next.scores.forEach((v, i) => {
          if (i >= k || typeof v !== 'number') return;
          raw[i] = scoreRows[i] ? clamp(v, range.min, range.max) : v;
          if (scoreRows[i]) scoreRows[i].set(raw[i]);
        });
      }
      if (typeof next.shift === 'number' && shiftDef) { shift = clamp(next.shift, shiftDef.min, shiftDef.max); if (shiftRow) shiftRow.set(shift); }
      if (typeof next.temperature === 'number' && next.temperature > 0) {
        temperature = tempDef ? clamp(next.temperature, tempDef.min, tempDef.max) : next.temperature;
        if (tempRow) tempRow.set(temperature);
      }
      remember();
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [...Object.values(scoreRows), shiftRow, tempRow]) if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  {
    title: 'softmax-bars — by hand, with powers of 2',
    spec: { type: 'softmax-bars', classes: ['cat', 'dog', 'fox'], scores: [2, 1, 1], base: 2, sliders: [0, 1, 2] },
  },
  {
    title: 'softmax-bars — temperature',
    spec: { type: 'softmax-bars', classes: ['cat', 'dog', 'mat', 'rug'], scores: [1.386, 1.099, 0.693, 0], base: 'e', temperature: { min: 0.2, max: 4, step: 0.2, value: 1 } },
  },
  {
    title: 'softmax-bars — the loss for a right answer',
    spec: { type: 'softmax-bars', classes: ['cat', 'dog', 'fox'], scores: [1, 0, 0], base: 'e', sliders: [0, 1], range: { min: -4, max: 6, step: 0.5 }, target: 0 },
  },
];
