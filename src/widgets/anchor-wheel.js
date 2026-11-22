/**
 * anchor-wheel — the anchoring experiment of Tversky and Kahneman (1974), run
 * on the learner. A wheel of fortune is spun; it is rigged to stop on one of
 * two numbers. The learner says whether a quantity is higher or lower than
 * that number, then types a best estimate. "Reveal" shows a number line with
 * the wheel's number, the learner's estimate, the typical answers of the two
 * groups in the original study, and the true value, and explains the rigging.
 * One estimate cannot show whether one person was pulled by the anchor (the
 * effect is in the averages), and the text says so: nothing is judged.
 *
 * {
 *   type: 'anchor-wheel',
 *   anchors: [10, 65],                 // the two numbers the wheel can stop on (multiples of 5 from 0 to 95)
 *   question: 'the percentage of United Nations member countries that are in Africa',
 *   unit: '%',
 *   medians: [25, 45],                 // typical estimate after the low and after the high anchor
 *   truth: 28, truthLabel: '54 of 193 countries',
 *   source: 'Tversky and Kahneman, 1974',
 * }
 *
 * State: { spun, anchor, side, estimate, revealed, done }
 *   anchor    the number the wheel stopped on (null before the spin) · side: 'higher' | 'lower' | null
 *   estimate  the number typed (null until one is given) · done: revealed
 * Which anchor comes up is random (env.rng): check `done` only.
 *
 * setState accepts { anchor, side, estimate, revealed }.
 */
import { h, s, addStyles, hue, clamp } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('anchor-wheel', `
  .widget-anchor-wheel { gap: var(--s3); padding: var(--s4) var(--s5); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); text-align: center; }
  .widget-anchor-wheel > * { min-width: 0; max-width: 100%; }
  .widget-anchor-wheel .aw-wheel { width: min(200px, 60%); margin: 0 auto; display: block; }
  .widget-anchor-wheel .aw-wheel.is-small { width: min(96px, 30%); }
  .widget-anchor-wheel .aw-spin { transform-origin: 120px 120px; transform-box: view-box; }
  .widget-anchor-wheel .aw-spin.is-moving { transition: transform 2.4s cubic-bezier(0.15, 0.8, 0.25, 1); }
  .widget-anchor-wheel .aw-stage { display: grid; gap: var(--s3); justify-items: center; }
  .widget-anchor-wheel .aw-stage p { margin: 0; text-wrap: balance; }
  .widget-anchor-wheel .aw-row { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; align-items: center; }
  .widget-anchor-wheel .aw-input { width: 5.5em; min-height: 44px; padding: 4px 10px; font: inherit; font-weight: 800; font-size: var(--fs-lg); text-align: center; color: var(--ink); background: var(--paper); border: var(--bw) solid var(--edge-strong); border-radius: var(--r); }
  .widget-anchor-wheel .aw-input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-anchor-wheel .aw-line { width: 100%; height: auto; display: block; }
  .widget-anchor-wheel .aw-note { font-size: var(--fs-sm); color: var(--ink-2); text-align: left; }
  .widget-anchor-wheel .aw-note b { color: var(--ink); }
`);

const SLOTS = 20; // 0, 5, …, 95

export default function create(spec, env) {
  const anchors = Array.isArray(spec.anchors) && spec.anchors.length === 2 ? spec.anchors.map((a) => clamp(Math.round(a / 5) * 5, 0, 95)) : [10, 65];
  const medians = Array.isArray(spec.medians) && spec.medians.length === 2 ? spec.medians : [25, 45];
  const unit = spec.unit == null ? '%' : spec.unit;
  const question = spec.question || 'the percentage of United Nations member countries that are in Africa';
  const truth = spec.truth == null ? 28 : spec.truth;
  const still = reducedMotion();
  let readOnly = !!env.readOnly;
  let anchor = null;
  let side = null;
  let estimate = null;
  let revealed = false;
  let timer = 0;

  // the wheel
  const spin = s('g.aw-spin');
  for (let i = 0; i < SLOTS; i++) {
    const a0 = ((i - 0.5) * 360) / SLOTS - 90;
    const a1 = ((i + 0.5) * 360) / SLOTS - 90;
    const p = (deg, r) => `${(120 + r * Math.cos((deg * Math.PI) / 180)).toFixed(1)} ${(120 + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)}`;
    spin.append(s('path', { d: `M120 120L${p(a0, 104)}A104 104 0 0 1 ${p(a1, 104)}Z`, fill: i % 2 ? 'var(--sunken)' : 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
    const mid = (i * 360) / SLOTS - 90;
    const [tx, ty] = p(mid, 84).split(' ').map(Number);
    spin.append(s('text', { class: 'tick-label', x: tx, y: ty + 4, 'text-anchor': 'middle', transform: `rotate(${mid + 90} ${tx} ${ty})`, style: 'font-weight:800; fill: var(--ink)' }, String(i * 5)));
  }
  spin.append(s('circle', { cx: 120, cy: 120, r: 12, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const wheel = s('svg.aw-wheel', { viewBox: '0 0 240 240', role: 'img', 'aria-label': 'A wheel of fortune numbered from 0 to 95' }, spin,
    s('path', { d: 'M120 22l-10 -18h20z', fill: 'var(--ink)' }));
  const stage = h('div.aw-stage');
  const el = h('div.w-frame', wheel, stage);

  const getState = () => ({ spun: anchor != null, anchor, side, estimate, revealed, done: revealed });
  const turnTo = (value, moving) => {
    spin.classList.toggle('is-moving', moving);
    spin.style.transform = `rotate(${(moving ? 1080 : 0) - (value / 5) * (360 / SLOTS)}deg)`;
  };

  function drawStart() {
    const go = h('button.btn.btn-primary', { type: 'button' }, 'Spin the wheel');
    go.addEventListener('click', () => {
      if (readOnly || anchor != null) return;
      anchor = env.rng.pick(anchors);
      go.disabled = true;
      play('tick');
      turnTo(anchor, !still);
      timer = setTimeout(() => { drawSide(); env.onChange(getState()); }, still ? 50 : 2500);
    });
    stage.replaceChildren(h('p', 'First, a number from a wheel of fortune.'), go);
  }

  function drawSide() {
    wheel.setAttribute('aria-label', `The wheel stopped on ${anchor}`);
    const mk = (label, value) => {
      const b = h('button.btn', { type: 'button' }, label);
      b.addEventListener('click', () => { if (readOnly) return; side = value; play('select'); drawEstimate(); env.onChange(getState()); });
      return b;
    };
    stage.replaceChildren(
      h('p', 'The wheel says ', h('strong', `${anchor}`), '.'),
      h('p', `Is ${question} `, h('strong', `higher or lower than ${anchor}${unit}`), '?'),
      h('div.aw-row', mk('Higher', 'higher'), mk('Lower', 'lower')),
    );
    env.announce(`The wheel stopped on ${anchor}.`);
  }

  function drawEstimate() {
    const input = h('input.aw-input', { type: 'number', min: 0, max: 100, step: 1, inputmode: 'numeric', 'aria-label': `Your estimate, in ${unit === '%' ? 'per cent' : unit}` });
    input.dataset.keys = 'own';
    const go = h('button.btn.btn-primary', { type: 'button', disabled: true }, 'Reveal');
    const read = () => { const v = Number(input.value); return input.value !== '' && Number.isFinite(v) && v >= 0 && v <= 100 ? Math.round(v) : null; };
    input.addEventListener('input', () => { go.disabled = read() == null; });
    const reveal = () => { if (readOnly || read() == null) return; estimate = read(); revealed = true; play('pop'); drawReveal(); env.onChange(getState()); };
    go.addEventListener('click', reveal);
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); reveal(); } });
    stage.replaceChildren(
      h('p', `You said ${side} than ${anchor}${unit}. Now your best estimate of ${question}:`),
      h('div.aw-row', input, h('span', unit), go),
    );
  }

  function drawReveal() {
    clearTimeout(timer);
    wheel.classList.add('is-small');
    turnTo(anchor, false);
    const W = 360;
    const x = (v) => 22 + (v / 100) * (W - 44);
    const line = s('svg.aw-line', { viewBox: `0 0 ${W} 138`, role: 'img', 'aria-label': `A number line from 0 to 100. The wheel: ${anchor}. Your estimate: ${estimate}. Typical estimates in the original study: ${medians[0]} after ${anchors[0]}, ${medians[1]} after ${anchors[1]}. True value: ${truth}.` });
    line.append(s('line', { x1: x(0), x2: x(100), y1: 80, y2: 80, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    for (let v = 0; v <= 100; v += 10) {
      line.append(s('line', { x1: x(v), x2: x(v), y1: 75, y2: 85, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      if (v % 20 === 0) line.append(s('text', { class: 'tick-label', x: x(v), y: 100, 'text-anchor': 'middle' }, `${v}`));
    }
    // above the line: the original study's two groups; below: the true value; on the line: the wheel and the learner
    const tag = (v, y, text, color, anchorAt = 'middle') => line.append(s('text', { class: 'fig-label-sm', x: x(v), y, 'text-anchor': anchorAt, style: `fill:${hue(color, 'text')}` }, text));
    anchors.forEach((a, i) => {
      line.append(s('path', { d: `M${x(a)} 60Q${(x(a) + x(medians[i])) / 2} 30 ${x(medians[i])} 60`, fill: 'none', stroke: hue('violet'), 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
      line.append(s('circle', { cx: x(medians[i]), cy: 66, r: 5, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      line.append(s('text', { class: 'fig-label-sm', x: i === 0 ? 4 : W - 4, y: 16, 'text-anchor': i === 0 ? 'start' : 'end', style: `fill:${hue('violet', 'text')}` }, `saw ${a} → guessed ${medians[i]}`));
    });
    line.append(s('rect', { x: x(anchor) - 6, y: 74, width: 12, height: 12, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2, transform: `rotate(45 ${x(anchor)} 80)` }));
    line.append(s('circle', { cx: x(estimate), cy: 80, r: 8, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    line.append(s('line', { x1: x(truth), x2: x(truth), y1: 66, y2: 118, stroke: hue('green'), 'stroke-width': 3 }));
    tag(truth, 132, `true value: ${truth}${unit}`, 'green', truth > 70 ? 'end' : truth < 30 ? 'start' : 'middle');
    const other = anchors[0] === anchor ? anchors[1] : anchors[0];
    stage.replaceChildren(
      line,
      h('p.aw-note', h('b', '◆'), ` your wheel: ${anchor}   `, h('b', '●'), ` your estimate: ${estimate}${unit}`),
      h('p.aw-note', h('b', 'The wheel was rigged.'), ` It can stop only on ${anchors[0]} or ${anchors[1]}; other people get ${other}. In the original study, people who saw ${anchors[0]} typically guessed ${medians[0]}${unit} and people who saw ${anchors[1]} guessed ${medians[1]}${unit} (${spec.source || 'Tversky and Kahneman, 1974'}). One answer cannot show whether the wheel pulled you: the effect appears in the averages.`),
    );
    env.announce('The wheel was rigged. It can stop only on two numbers.');
  }

  drawStart();

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      clearTimeout(timer);
      if (next.anchor != null) anchor = anchors.includes(next.anchor) ? next.anchor : anchors[0];
      if (next.side === 'higher' || next.side === 'lower') side = next.side;
      if (next.estimate != null) estimate = clamp(Math.round(next.estimate), 0, 100);
      if (next.revealed) {
        if (anchor == null) anchor = anchors[0];
        if (side == null) side = 'higher';
        if (estimate == null) estimate = medians[anchors.indexOf(anchor)];
        revealed = true;
        drawReveal();
      } else if (anchor != null) { turnTo(anchor, false); if (side) drawEstimate(); else drawSide(); }
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
    destroy() { clearTimeout(timer); },
  };
}

export const examples = [
  { title: 'anchor-wheel — the rigged wheel', spec: { type: 'anchor-wheel', truth: 28 } },
];
