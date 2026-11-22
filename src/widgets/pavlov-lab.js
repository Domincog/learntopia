/**
 * pavlov-lab — classical conditioning as a toy. A dog, a bell, a bowl of food
 * and a tube that collects drops of saliva. Each press of a button is one
 * trial, and the chart shows how many drops the bell produced on that trial.
 *
 *   'pair'   the bell rings, then food arrives            → the response to the bell grows (acquisition)
 *   'alone'  the bell rings and nothing follows           → the response fades (extinction)
 *   'rest'   a night passes with no bell                  → part of a faded response returns (spontaneous recovery)
 *   'near'   a bell with a slightly higher note rings     → a smaller response (generalisation); nothing is learned from it
 *   'far'    a bell with a much higher note rings         → a much smaller response
 *
 * {
 *   type: 'pavlov-lab',
 *   actions: ['pair', 'alone', 'rest'],   // which buttons are offered (also 'near', 'far')
 *   trials: ['pair', 'pair'],             // trials already run when the figure appears
 * }
 *
 * The model (a simplification, in the spirit of Rescorla and Wagner 1972): the bell has an excitatory
 * strength V and an inhibitory strength I, both from 0 to 1, and the response is V − I.
 *   pair:  V moves 30% of the way to 1, and I is halved      alone: I moves 30% of the way to V
 *   rest:  I is halved (once: further nights in a row add nothing, so recovery is always partial)
 *   near / far: the response is 60% / 25% of the bell's
 * Drops shown = round(10 × response). Real animals are noisier, and a real "rest" is not a single step.
 *
 * State: { trials, drops, strength, pairs, alones, rests, acquired, extinguished, recovered, generalised }
 *   trials        [{ kind, drops }]: every trial so far, with the drops the bell produced on it (a rest has drops: null)
 *   drops         the drops the bell would produce if it rang now · strength: the same as a number from 0 to 1
 *   pairs, alones, rests   how many trials of each kind
 *   acquired      some bell-alone trial produced 8 drops or more
 *   extinguished  after that, some bell-alone trial produced 1 drop or none
 *   recovered     after that, a rest was followed by a bell-alone trial with 3 drops or more
 *   generalised   after `acquired`, both a 'near' and a 'far' bell have been tried
 *
 * setState accepts { trials: ['pair', 'pair', 'alone', …] } and replays them.
 */
import { frame, button, readout, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('pavlov-lab', `
  .widget-pavlov-lab .pl-key { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 14px; justify-content: center; font-size: var(--fs-sm); color: var(--ink-2); }
  .widget-pavlov-lab .pl-key b { font-family: var(--font-mono); color: var(--ink); }
  .widget-pavlov-lab .w-buttons .btn { white-space: normal; }
`);

const W = 560;
const H = 300;
const KINDS = {
  pair: { label: 'Bell + food', mark: '+', color: 'blue', say: 'Bell, then food' },
  alone: { label: 'Bell alone', mark: 'B', color: 'orange', say: 'Bell, no food' },
  rest: { label: 'Wait a night', mark: '', color: 'gray', say: 'A night passes' },
  near: { label: 'A higher bell', mark: 'h', color: 'violet', say: 'A slightly higher bell' },
  far: { label: 'A much higher bell', mark: 'H', color: 'violet', say: 'A much higher bell' },
};
const SHOWN = 24;

/** Run a list of trial kinds through the model. Exported for tests and lessons. */
export function simulate(kinds) {
  let V = 0;
  let I = 0;
  const trials = [];
  const facts = { acquired: false, extinguished: false, recovered: false, near: false, far: false };
  let restSince = false;
  const drop = (x) => Math.round(10 * Math.max(0, x));
  for (const kind of kinds) {
    if (!KINDS[kind]) continue;
    const R = Math.max(0, V - I);
    if (kind === 'pair') { trials.push({ kind, drops: drop(R) }); V += 0.3 * (1 - V); I *= 0.5; restSince = false; }
    else if (kind === 'alone') {
      const d = drop(R);
      trials.push({ kind, drops: d });
      if (d >= 8) facts.acquired = true;
      if (facts.extinguished && restSince && d >= 3) facts.recovered = true;
      if (facts.acquired && d <= 1) facts.extinguished = true;
      I += 0.3 * (V - I);
      restSince = false;
    } else if (kind === 'rest') { trials.push({ kind, drops: null }); if (!restSince) I *= 0.5; restSince = true; }
    else { trials.push({ kind, drops: drop(R * (kind === 'near' ? 0.6 : 0.25)) }); if (facts.acquired) facts[kind] = true; }
  }
  const strength = Math.round(Math.max(0, V - I) * 100) / 100;
  return {
    trials, strength, drops: drop(V - I),
    pairs: trials.filter((t) => t.kind === 'pair').length, alones: trials.filter((t) => t.kind === 'alone').length, rests: trials.filter((t) => t.kind === 'rest').length,
    acquired: facts.acquired, extinguished: facts.extinguished, recovered: facts.recovered, generalised: facts.near && facts.far,
  };
}

export default function create(spec, env) {
  const actions = (Array.isArray(spec.actions) ? spec.actions : ['pair', 'alone', 'rest']).filter((a) => KINDS[a]);
  let kinds = (Array.isArray(spec.trials) ? spec.trials : []).filter((k) => KINDS[k]);
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A conditioning experiment' });
  const { svg } = fr;
  const scene = s('g');
  const chart = s('g');
  svg.append(scene, chart);
  const dropsOut = readout('drops at the last bell', { digits: 0, color: 'blue' });
  const pairsOut = readout('pairings', { digits: 0 });
  const alonesOut = readout('bell alone', { digits: 0 });
  fr.readouts.append(dropsOut.el, pairsOut.el, alonesOut.el);
  const key = h('p.pl-key', h('span', h('b', '+'), ' bell, then food'), h('span', h('b', 'B'), ' bell alone'),
    actions.includes('near') || actions.includes('far') ? h('span', h('b', 'h H'), ' higher bells') : null, h('span', h('b', '┊'), ' a night'));
  if (!env.compact) fr.el.insertBefore(key, fr.readouts);

  const getState = () => simulate(kinds);
  const ink = { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

  function drawScene(st) {
    const last = st.trials[st.trials.length - 1];
    const rang = last && last.kind !== 'rest';
    const fed = last && last.kind === 'pair';
    const shown = last && last.drops != null ? last.drops : 0;
    scene.replaceChildren();
    // bell
    const bell = s('g', { transform: `translate(56 52)${rang ? ' rotate(-14)' : ''}` },
      s('path', { d: 'M-22 14Q-22 -18 0 -20Q22 -18 22 14Z', fill: hue(last && (last.kind === 'near' || last.kind === 'far') ? 'violet' : 'yellow'), ...ink }),
      s('line', { x1: -27, y1: 14, x2: 27, y2: 14, ...ink }), s('circle', { cx: 0, cy: 21, r: 5, fill: 'var(--ink)' }), s('line', { x1: 0, y1: -20, x2: 0, y2: -28, ...ink }));
    scene.append(bell);
    if (rang) for (const [x, y, a] of [[20, 36, 0], [92, 36, 1]]) scene.append(s('path', { d: a ? `M${x} ${y}q10 14 0 28` : `M${x} ${y}q-10 14 0 28`, fill: 'none', ...ink, 'stroke-width': 2 }));
    scene.append(s('text', { class: 'fig-label-sm', x: 56, y: 100, 'text-anchor': 'middle' }, last ? (rang ? (last.kind === 'near' ? 'higher bell' : last.kind === 'far' ? 'much higher' : 'bell rings') : 'night') : 'bell'));
    // bowl
    scene.append(s('path', { d: 'M132 48h60l-9 26h-42z', fill: 'var(--surface)', ...ink }));
    if (fed) scene.append(s('path', { d: 'M136 48q26 -22 52 0z', fill: hue('orange'), ...ink }));
    scene.append(s('text', { class: 'fig-label-sm', x: 162, y: 100, 'text-anchor': 'middle' }, fed ? 'food arrives' : 'no food'));
    // dog: head, ear, snout, eye, nose
    scene.append(
      s('circle', { cx: 78, cy: 178, r: 40, fill: hue('orange', 'soft'), ...ink }),
      s('rect', { x: 100, y: 174, width: 62, height: 34, rx: 16, fill: hue('orange', 'soft'), ...ink }),
      s('ellipse', { cx: 52, cy: 168, rx: 14, ry: 32, fill: hue('orange'), transform: 'rotate(14 52 168)', ...ink }),
      s('circle', { cx: 92, cy: 166, r: 4.5, fill: 'var(--ink)' }),
      s('circle', { cx: 160, cy: 182, r: 6.5, fill: 'var(--ink)' }),
      s('path', { d: 'M112 200q18 8 36 0', fill: 'none', ...ink }),
    );
    // collecting tube with its drops
    scene.append(s('path', { d: 'M126 226v40q0 12 12 12q12 0 12 -12v-40', fill: 'var(--surface)', ...ink }));
    const level = Math.min(10, shown) * 3.6;
    if (level > 0) scene.append(s('rect', { x: 128.5, y: 276 - level, width: 19, height: level, rx: Math.min(8, level / 2), fill: hue('blue') }));
    for (let i = 0; i < Math.min(3, shown); i++) scene.append(s('path', { d: `M138 ${212 + i * 6}q5 7 0 9q-5 -2 0 -9z`, fill: hue('blue') }));
    scene.append(s('text', { class: 'fig-label', x: 160, y: 262 }, last && last.drops != null ? `${shown} drop${shown === 1 ? '' : 's'}` : ''));
  }

  function drawChart(st) {
    chart.replaceChildren();
    const x0 = 262;
    const x1 = W - 14;
    const y0 = 244;
    const y1 = 34;
    const yOf = (d) => y0 - (d / 10) * (y0 - y1);
    for (const d of [0, 5, 10]) {
      chart.append(s('line', { x1: x0, x2: x1, y1: yOf(d), y2: yOf(d), stroke: 'var(--hair)', 'stroke-width': d === 0 ? 2 : 1 }));
      chart.append(s('text', { class: 'tick-label', x: x0 - 6, y: yOf(d) + 4, 'text-anchor': 'end' }, String(d)));
    }
    chart.append(s('text', { class: 'fig-label-sm', x: x0 - 22, y: 20 }, 'drops when the bell rings'));
    chart.append(s('text', { class: 'tick-label', x: (x0 + x1) / 2, y: H - 8, 'text-anchor': 'middle' }, st.trials.length > SHOWN ? `the last ${SHOWN} trials` : 'trials, in order'));
    const list = st.trials.slice(-SHOWN);
    const slot = (x1 - x0) / SHOWN;
    list.forEach((t, i) => {
      const cx0 = x0 + (i + 0.5) * slot;
      if (t.kind === 'rest') {
        chart.append(s('line', { x1: cx0, x2: cx0, y1: y1, y2: y0 + 4, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '3 5' }));
        return;
      }
      const top = yOf(t.drops);
      chart.append(s('rect', { x: cx0 - slot * 0.36, y: Math.min(top, y0 - 2), width: slot * 0.72, height: Math.max(2, y0 - top), rx: 2, fill: hue(KINDS[t.kind].color), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      chart.append(s('text', { class: 'tick-label', x: cx0, y: y0 + 15, 'text-anchor': 'middle', style: 'font-weight:800' }, KINDS[t.kind].mark));
    });
  }

  function draw() {
    const st = getState();
    drawScene(st);
    drawChart(st);
    const last = st.trials[st.trials.length - 1];
    dropsOut.set(last && last.drops != null ? last.drops : '–');
    pairsOut.set(st.pairs);
    alonesOut.set(st.alones);
    svg.setAttribute('aria-label', `${spec.alt || 'A conditioning experiment'}. ${st.trials.length} trials so far; the bell alone would now produce ${st.drops} drops.`);
    return st;
  }

  for (const a of actions) {
    fr.buttons.append(button(KINDS[a].label, () => {
      if (readOnly) return;
      kinds = [...kinds, a];
      play(a === 'rest' ? 'pop' : 'tick');
      const st = draw();
      const last = st.trials[st.trials.length - 1];
      env.announce(last.drops == null ? 'A night passes.' : `${KINDS[a].say}: ${last.drops} drops.`);
      env.onChange(st);
    }, { variant: a === 'pair' ? 'primary' : '' }));
  }
  if (actions.length) fr.buttons.append(button('Start again', () => { if (readOnly) return; kinds = []; env.onChange(draw()); }, { icon: 'reset' }));
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.trials)) return;
      kinds = next.trials.map((t) => (typeof t === 'string' ? t : t && t.kind)).filter((k) => KINDS[k]);
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'pavlov-lab — pair, fade, rest', spec: { type: 'pavlov-lab' } },
  { title: 'pavlov-lab — with other bells', spec: { type: 'pavlov-lab', actions: ['pair', 'alone', 'near', 'far'], trials: ['pair', 'pair', 'pair', 'pair', 'pair', 'pair', 'alone'] } },
];
