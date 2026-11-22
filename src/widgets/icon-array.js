/**
 * icon-array — natural frequencies made visible. A crowd of dots (1000 people)
 * is split by a base rate into ill and healthy, then everyone is "tested".
 * Counting the dots that test positive answers "how likely is it that a
 * positive person is really ill?" with no formula at all: it is simply
 * (ill and positive) out of (everyone positive).
 *
 * {
 *   type: 'icon-array',
 *   n: 1000,                  // how many dots: 100, 200, 400 or 1000 work best
 *   base: 0.01,               // base rate: the share who have the condition
 *   sens: 0.9,                // chance of a positive test for someone who has it ("sensitivity")
 *   fpr: 0.09,                // chance of a positive test for someone who does not ("false-positive rate")
 *   stage: 0,                 // what is revealed at the start: 0 everyone · 1 who is ill · 2 test results · 3 positives only
 *   stages: true,             // show the four step-through buttons
 *   sliders: ['base'],        // which of 'base', 'sens', 'fpr' the learner can change (default: none)
 *   ranges: { base: [0.01, 0.5, 0.01] },   // optional [min, max, step] per slider
 *   labels: { base: 'how common the illness is' },   // optional slider labels
 *   answer: true,             // spell out "9 of the 98 positives are ill: about 9%" once test results are visible
 *   words: {                  // optional wording, so the same picture works for spam filters, alarms…
 *     people: 'people', has: 'ill', not: 'healthy', posVerb: 'test positive',
 *     tp: 'ill, test positive', fn: 'ill, test negative', fp: 'healthy, test positive', tn: 'healthy, test negative',
 *     stages: ['Everyone', 'Who is ill?', 'Test everyone', 'Positives only'],
 *   },
 * }
 *
 * State: { n, base, sens, fpr, ill, healthy, truePos, falseNeg, falsePos, trueNeg, positives, ppv, stage }
 *   Whole people only: ill = round(n · base), truePos = round(ill · sens), falsePos = round(healthy · fpr).
 *   ppv — truePos / positives: the chance that someone who tests positive really has the condition
 *         (0 when nobody tests positive).
 *
 * Squares are people who have the condition, circles are people who do not;
 * a filled dot with a dark ring has tested positive. Shape and ring carry the
 * meaning as well as colour.
 */
import { frame, sliderRow, hue, s, h, cx, clamp, mdInline, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('icon-array', `
  .widget-icon-array .ia-stages { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); justify-self: center; width: 100%; max-width: 500px; }
  .widget-icon-array .ia-stages button { min-height: 44px; justify-content: center; padding: 0.3rem 0.35rem; text-align: center; white-space: normal; line-height: 1.15; }
  .widget-icon-array .ia-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s4); font-size: var(--fs-sm); font-weight: 700; min-height: 1.6em; }
  .widget-icon-array .ia-key { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-icon-array .ia-key svg { flex: none; width: 16px; height: 16px; }
  .widget-icon-array .ia-key b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .widget-icon-array .ia-answer { text-align: center; padding: var(--s2) var(--s3); border: var(--bw) dashed var(--hair); border-radius: var(--r); font-size: var(--fs-lg); line-height: 1.4; }
  .widget-icon-array .ia-answer.is-major { border-style: solid; border-color: var(--green); background: var(--green-soft); }
  .widget-icon-array.is-readonly .ia-stages { pointer-events: none; }
`);

const TP = 0;
const FN = 1;
const FP = 2;
const TN = 3;

/** How a dot of category `cat` looks at a given stage. */
function look(cat, stage) {
  const has = cat === TP || cat === FN;
  const positive = cat === TP || cat === FP;
  const tone = has ? 'red' : 'blue';
  if (stage === 0) return { fill: hue('gray'), stroke: 'none', sw: 0, scale: 1, opacity: 1, square: false };
  if (stage === 1) {
    return has
      ? { fill: hue('red'), stroke: 'var(--edge-strong)', sw: 1.5, scale: 1, opacity: 1, square: true }
      : { fill: hue('blue', 'soft'), stroke: hue('blue'), sw: 1, scale: 1, opacity: 1, square: false };
  }
  if (positive) return { fill: hue(tone), stroke: 'var(--ink)', sw: 2, scale: 1, opacity: 1, square: has };
  return { fill: hue(tone, 'soft'), stroke: hue(tone), sw: 1, scale: 0.8, opacity: stage === 3 ? 0.14 : 1, square: has };
}

/** A legend swatch drawn exactly like the dots. */
function swatch(cat, stage) {
  const k = look(cat, stage);
  const size = 11 * k.scale;
  return s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    s('rect', { x: 8 - size / 2, y: 8 - size / 2, width: size, height: size, rx: k.square ? 2 : size / 2, fill: k.fill, stroke: k.stroke, 'stroke-width': k.sw }));
}

const DEFAULT_RANGES = { base: [0.01, 0.5, 0.01], sens: [0.5, 1, 0.05], fpr: [0, 0.3, 0.01] };
const DEFAULT_LABELS = { base: 'are ill', sens: 'positive if ill', fpr: 'positive if healthy' };
const SLIDER_HUES = { base: 'red', sens: 'orange', fpr: 'blue' };

export default function create(spec, env) {
  const n = clamp(Math.round(spec.n || 1000), 20, 2000);
  const words = {
    people: 'people', has: 'ill', not: 'healthy', posVerb: 'test positive',
    tp: 'ill, test positive', fn: 'ill, test negative', fp: 'healthy, test positive', tn: 'healthy, test negative',
    stages: ['Everyone', 'Who is ill?', 'Test everyone', 'Positives only'],
    ...(spec.words || {}),
  };
  const model = {
    base: clamp(spec.base != null ? spec.base : 0.01, 0, 1),
    sens: clamp(spec.sens != null ? spec.sens : 0.9, 0, 1),
    fpr: clamp(spec.fpr != null ? spec.fpr : 0.09, 0, 1),
  };
  let stage = clamp(Math.round(spec.stage || 0), 0, 3);
  let readOnly = !!env.readOnly;
  const interactive = !env.compact && !spec.static;

  function tally() {
    const ill = Math.round(n * model.base);
    const healthy = n - ill;
    const truePos = Math.round(ill * model.sens);
    const falsePos = Math.round(healthy * model.fpr);
    const positives = truePos + falsePos;
    return { ill, healthy, truePos, falseNeg: ill - truePos, falsePos, trueNeg: healthy - falsePos, positives, ppv: positives ? truePos / positives : 0 };
  }

  /* ---------------------------------------------------------------- dots */
  const cols = spec.cols || (n <= 200 ? 20 : 40);
  const rows = Math.ceil(n / cols);
  const W = 560;
  const pad = 16;
  const pitch = (W - 2 * pad) / cols;
  const size = pitch * 0.7;
  const H = Math.round(rows * pitch + 2 * pad);
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Icon array' });
  const dots = [];
  const keys = new Array(n).fill('');
  for (let i = 0; i < n; i++) {
    const rect = s('rect');
    dots.push(rect);
    fr.svg.appendChild(rect);
  }

  function paint() {
    const t = tally();
    for (let i = 0; i < n; i++) {
      const cat = i < t.truePos ? TP : i < t.ill ? FN : i < t.ill + t.falsePos ? FP : TN;
      const key = `${cat}${stage}`;
      if (keys[i] === key) continue;
      keys[i] = key;
      const k = look(cat, stage);
      const d = size * k.scale;
      const x = pad + (i % cols) * pitch + (pitch - d) / 2;
      const y = pad + Math.floor(i / cols) * pitch + (pitch - d) / 2;
      const el = dots[i];
      el.setAttribute('x', x.toFixed(2));
      el.setAttribute('y', y.toFixed(2));
      el.setAttribute('width', d.toFixed(2));
      el.setAttribute('height', d.toFixed(2));
      el.setAttribute('rx', (k.square ? Math.min(2.5, d / 5) : d / 2).toFixed(2));
      el.setAttribute('fill', k.fill);
      el.setAttribute('stroke', k.stroke);
      el.setAttribute('stroke-width', Math.min(k.sw, d / 4).toFixed(2));
      el.setAttribute('opacity', k.opacity);
    }
    return t;
  }

  /* -------------------------------------------------------------- chrome */
  const legend = h('div.ia-legend');
  const answer = h('div.ia-answer', { 'aria-live': 'polite' });
  fr.el.insertBefore(legend, fr.readouts);
  if (spec.answer !== false && !env.compact) fr.el.insertBefore(answer, fr.readouts);

  const stageButtons = words.stages.map((label, i) => {
    const btn = h('button', { type: 'button', 'aria-pressed': 'false' }, label);
    btn.addEventListener('click', () => {
      if (readOnly || stage === i) return;
      stage = i;
      play('select');
      update();
      env.onChange(getState());
    });
    return btn;
  });
  if (interactive && spec.stages !== false) fr.el.insertBefore(h('div.segmented.ia-stages', { role: 'group', 'aria-label': 'What to show' }, stageButtons), fr.canvas);

  // Sliders sit above the picture, so that on a phone the dots stay in view while a slider is dragged.
  fr.el.insertBefore(fr.controls, fr.canvas);
  const sliders = {};
  if (interactive) {
    for (const name of Array.isArray(spec.sliders) ? spec.sliders : []) {
      if (!(name in model)) continue;
      const [min, max, step] = (spec.ranges && spec.ranges[name]) || DEFAULT_RANGES[name];
      const digits = Math.max(0, (String(Math.round(step * 1e6) / 1e4).split('.')[1] || '').length);
      const row = sliderRow({
        label: (spec.labels && spec.labels[name]) || DEFAULT_LABELS[name],
        min: min * 100, max: max * 100, step: step * 100, value: model[name] * 100, digits, unit: '%', color: SLIDER_HUES[name],
        onInput: (v) => {
          if (readOnly) return;
          model[name] = Math.round(v * 1e4) / 1e6;
          if (stage < 2 && name !== 'base') stage = 2; // changing the test only shows once results are visible
          if (stage < 1) stage = 1;
          update();
          env.onChange(getState());
        },
      });
      sliders[name] = row;
      fr.controls.appendChild(row.el);
    }
  }

  const key = (cat, label, count) => h('span.ia-key', swatch(cat, stage), `${label}: `, h('b', formatNumber(count, 0)));

  function update() {
    const t = paint();
    stageButtons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === stage)));
    if (stage === 0) legend.replaceChildren(h('span.ia-key', swatch(TN, 0), `${formatNumber(n, 0)} ${words.people}`));
    else if (stage === 1) legend.replaceChildren(key(TP, words.has, t.ill), key(TN, words.not, t.healthy));
    else legend.replaceChildren(key(TP, words.tp, t.truePos), key(FN, words.fn, t.falseNeg), key(FP, words.fp, t.falsePos), key(TN, words.tn, t.trueNeg));

    if (stage < 2) {
      answer.innerHTML = mdInline(stage === 0
        ? `Each dot is one of ${formatNumber(n, 0)} ${words.people}.`
        : `**${formatNumber(t.ill, 0)}** of the ${formatNumber(n, 0)} ${words.people} are ${words.has}.`);
    } else if (!t.positives) {
      answer.innerHTML = mdInline(`Nobody ${words.posVerb}s.`);
    } else {
      const pct = t.ppv * 100;
      const exact = Math.abs(pct - Math.round(pct)) < 1e-9;
      answer.innerHTML = mdInline(`**${formatNumber(t.positives, 0)}** ${words.people} ${words.posVerb}. **${formatNumber(t.truePos, 0)}** of them are ${words.has}: `
        + `$\\frac{${t.truePos}}{${t.positives}}$ ${exact ? '=' : '≈'} **${formatNumber(pct, pct < 10 ? 1 : 0)}%**`);
    }
    answer.classList.toggle('is-major', stage >= 2 && t.ppv > 0.5);
    fr.svg.setAttribute('aria-label', `${formatNumber(n, 0)} ${words.people}: ${t.ill} ${words.has}, ${t.healthy} ${words.not}.`
      + (stage >= 2 ? ` ${t.positives} ${words.posVerb}; ${t.truePos} of those are ${words.has}.` : ''));
  }

  function getState() {
    return { n, base: model.base, sens: model.sens, fpr: model.fpr, ...tally(), stage };
  }

  update();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      for (const name of ['base', 'sens', 'fpr']) {
        if (typeof next[name] === 'number') {
          model[name] = clamp(next[name], 0, 1);
          if (sliders[name]) sliders[name].set(model[name] * 100);
        }
      }
      if (typeof next.stage === 'number') stage = clamp(Math.round(next.stage), 0, 3);
      update();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const name in sliders) sliders[name].setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'icon-array — step through a medical test (1% ill, 90% detected, 9% false alarms)', spec: { type: 'icon-array', base: 0.01, sens: 0.9, fpr: 0.09 } },
  { title: 'icon-array — change the base rate and the test', spec: { type: 'icon-array', base: 0.1, sens: 0.9, fpr: 0.09, stage: 3, stages: false, sliders: ['base', 'sens', 'fpr'] } },
  {
    title: 'icon-array — a spam filter, 200 emails',
    spec: {
      type: 'icon-array', n: 200, base: 0.25, sens: 0.9, fpr: 0.1, stage: 2,
      words: { people: 'emails', has: 'spam', not: 'wanted', posVerb: 'are flagged', tp: 'spam, flagged', fn: 'spam, let through', fp: 'wanted, flagged', tn: 'wanted, let through', stages: ['All emails', 'Which are spam?', 'Run the filter', 'Flagged only'] },
    },
  },
];
