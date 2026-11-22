/**
 * stretchy-ruler — reliability and validity with three rulers. A pencil that
 * is exactly 12.0 cm long is measured again and again:
 *
 *   'steel'     a good ruler: nearly the same reading every time, and the right one  (reliable and valid)
 *   'elastic'   a ruler printed on elastic: it stretches differently each time       (not reliable, so not valid)
 *   'misprint'  a stiff ruler whose scale starts at 1 instead of 0: always the same
 *               reading, always 1 cm too much                                        (reliable, not valid)
 *
 * Every reading becomes a dot on that ruler's strip, with the true length
 * marked, so the learner sees "consistent" and "correct" come apart.
 *
 * {
 *   type: 'stretchy-ruler',
 *   rulers: ['steel', 'elastic', 'misprint'],   // which are offered
 *   truth: 12,                                  // the pencil's real length in cm (10 to 13)
 *   showTruth: true,                            // mark the true length on the strips
 * }
 *
 * State: { ruler, counts, readings, spread, mean }
 *   ruler     the one in use · counts: { steel: 5, … } measurements taken with each
 *   readings  { steel: [12.0, 12.1, …], … } in cm, to one decimal
 *   spread    { steel: 0.1, … } largest minus smallest reading (null with fewer than two)
 *   mean      { steel: 12.02, … } (null when none)
 * The readings are random (env.rng): check `counts` only.
 *
 * setState accepts { ruler, counts: { steel: 5, elastic: 5, misprint: 5 } } and takes that many readings.
 */
import { frame, button, hue, s, h, cx, addStyles, clamp } from './kit.js';
import { play } from '../core/audio.js';

addStyles('stretchy-ruler', `
  .widget-stretchy-ruler .sr-pick { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; }
  .widget-stretchy-ruler .sr-pick .btn[aria-pressed='true'] { background: var(--ink); color: var(--surface); }
  .widget-stretchy-ruler .sr-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 1.4em; }
  .widget-stretchy-ruler .sr-note b { color: var(--ink); font-size: var(--fs-md); }
`);

const W = 470;
const H = 290;
const X0 = 36;
const CM = 27;
export const RULERS = {
  steel: { label: 'Steel ruler', short: 'steel', color: 'blue' },
  elastic: { label: 'Elastic ruler', short: 'elastic', color: 'orange' },
  misprint: { label: 'Misprinted ruler', short: 'misprinted', color: 'violet' },
};
const round1 = (v) => Math.round(v * 10) / 10;

export default function create(spec, env) {
  const offered = (Array.isArray(spec.rulers) ? spec.rulers : Object.keys(RULERS)).filter((k) => RULERS[k]);
  const truth = clamp(spec.truth || 12, 10, 13);
  const showTruth = spec.showTruth !== false;
  let ruler = offered[0];
  const readings = {};
  for (const id of offered) readings[id] = [];
  let stretch = 1; // how the elastic ruler lies right now
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A pencil and a ruler' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const note = h('p.sr-note', { 'aria-live': 'polite' });
  const pick = h('div.sr-pick', { role: 'group', 'aria-label': 'Ruler' });
  fr.controls.append(pick);
  fr.el.insertBefore(note, fr.readouts);

  const getState = () => {
    const counts = {};
    const spread = {};
    const mean = {};
    for (const id of offered) {
      const r = readings[id];
      counts[id] = r.length;
      spread[id] = r.length > 1 ? round1(Math.max(...r) - Math.min(...r)) : null;
      mean[id] = r.length ? Math.round((r.reduce((a, b) => a + b, 0) / r.length) * 100) / 100 : null;
    }
    return { ruler, counts, readings: Object.fromEntries(offered.map((id) => [id, readings[id].slice()])), spread, mean };
  };

  function measure(id) {
    let value;
    if (id === 'steel') value = truth + env.rng.pick([0, 0, 0, 0.1, -0.1]);
    else if (id === 'misprint') value = truth + 1 + env.rng.pick([0, 0, 0, 0.1, -0.1]);
    else { stretch = env.rng.float(0.86, 1.2); value = truth / stretch; }
    readings[id].push(round1(value));
  }

  const ink = { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' };
  function draw() {
    g.replaceChildren();
    // the pencil
    const len = truth * CM;
    g.append(
      s('rect', { x: X0, y: 22, width: 16, height: 22, rx: 3, fill: hue('pink'), ...ink }),
      s('rect', { x: X0 + 16, y: 22, width: len - 48, height: 22, fill: hue('yellow'), ...ink }),
      s('path', { d: `M${X0 + len - 32} 22L${X0 + len} 33L${X0 + len - 32} 44Z`, fill: 'var(--surface)', ...ink }),
      s('path', { d: `M${X0 + len - 9} 30L${X0 + len} 33L${X0 + len - 9} 36Z`, fill: 'var(--ink)' }),
    );
    // the ruler, as it lies against the pencil
    const f = ruler === 'elastic' ? stretch : 1;
    const shift = ruler === 'misprint' ? 1 : 0;
    const last = Math.floor((W - 16 - X0) / (CM * f));
    g.append(s('rect', { x: X0 - 8, y: 52, width: Math.min(W - X0, last * CM * f + 16), height: 44, rx: 5, fill: hue(RULERS[ruler].color, 'soft'), ...ink }));
    for (let k = 0; k <= last; k++) {
      const x = X0 + k * CM * f;
      g.append(s('line', { x1: x, x2: x, y1: 52, y2: 68, stroke: 'var(--ink)', 'stroke-width': 2 }));
      if (k < last) g.append(s('line', { x1: x + (CM * f) / 2, x2: x + (CM * f) / 2, y1: 52, y2: 61, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      g.append(s('text', { class: 'tick-label', x, y: 86, 'text-anchor': 'middle', style: 'fill: var(--ink); font-weight: 700' }, String(k + shift)));
    }
    const got = readings[ruler];
    if (got.length) g.append(s('line', { x1: X0 + len, x2: X0 + len, y1: 14, y2: 100, stroke: hue('red'), 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
    // one strip of dots per ruler
    const ax0 = 112;
    const ax1 = W - 24;
    const lo = truth - 2.5;
    const hi = truth + 2.5;
    const ax = (v) => ax0 + ((clamp(v, lo, hi) - lo) / (hi - lo)) * (ax1 - ax0);
    const top = 132;
    const rowH = (H - 34 - top) / offered.length;
    offered.forEach((id, i) => {
      const y = top + (i + 0.5) * rowH;
      g.append(s('line', { x1: ax0, x2: ax1, y1: y + 9, y2: y + 9, stroke: 'var(--hair)', 'stroke-width': 2 }));
      g.append(s('text', { class: 'fig-label', x: ax0 - 10, y: y + 9, 'text-anchor': 'end', style: id === ruler ? 'font-weight:800' : 'font-weight:600' }, RULERS[id].short));
      const seen = {};
      for (const v of readings[id]) {
        const key = v.toFixed(1);
        seen[key] = (seen[key] || 0) + 1;
        if (seen[key] <= 4) g.append(s('circle', { cx: ax(v), cy: y + 3 - (seen[key] - 1) * 7, r: 5, fill: hue(RULERS[id].color), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      }
    });
    for (let v = Math.ceil(lo); v <= hi; v++) g.append(s('text', { class: 'tick-label', x: ax(v), y: H - 12, 'text-anchor': 'middle' }, `${v} cm`));
    if (showTruth) {
      g.append(s('line', { x1: ax(truth), x2: ax(truth), y1: top - 6, y2: H - 28, stroke: hue('red'), 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
      g.append(s('text', { class: 'fig-label-sm', x: ax(truth), y: top - 10, 'text-anchor': 'middle', style: `fill:${hue('red', 'text')}` }, `true length ${truth.toFixed(1)} cm`));
    }
    note.replaceChildren();
    if (got.length) note.append(`${RULERS[ruler].label} reads `, h('b', `${got[got.length - 1].toFixed(1)} cm`), ` (measurement ${got.length})`);
    else note.append(`${RULERS[ruler].label}: not used yet.`);
    for (const btn of pick.children) btn.setAttribute('aria-pressed', String(btn.dataset.id === ruler));
    const st = getState();
    svg.setAttribute('aria-label', `${spec.alt || 'A pencil and a ruler'}. ${offered.map((id) => `${RULERS[id].label}: ${readings[id].length ? readings[id].map((v) => v.toFixed(1)).join(', ') + ' centimetres' : 'no readings yet'}`).join('. ')}.`);
    return st;
  }

  for (const id of offered) {
    const btn = h('button', { type: 'button', class: cx('btn btn-sm'), dataset: { id } }, RULERS[id].label);
    btn.addEventListener('click', () => { if (readOnly) return; ruler = id; if (id === 'elastic' && !readings.elastic.length) stretch = 1; env.onChange(draw()); });
    pick.append(btn);
  }
  const take = (n) => () => {
    if (readOnly) return;
    for (let i = 0; i < n; i++) if (readings[ruler].length < 40) measure(ruler);
    play('tick');
    const st = draw();
    env.announce(note.textContent);
    env.onChange(st);
  };
  fr.buttons.append(button('Measure', take(1), { variant: 'primary' }), button('Measure 5 times', take(5)));
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.counts) for (const id of offered) { const want = clamp(Math.round(next.counts[id] || 0), 0, 40); while (readings[id].length < want) measure(id); }
      if (offered.includes(next.ruler)) ruler = next.ruler;
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'stretchy-ruler — three rulers', spec: { type: 'stretchy-ruler' } },
];
