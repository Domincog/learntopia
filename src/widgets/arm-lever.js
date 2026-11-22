/**
 * arm-lever — the elbow as a lever, in two modes.
 *
 * mode 'lever': the forearm is held level with a load in the hand. The biceps
 * pulls upwards on the forearm a few centimetres from the elbow; the load pulls
 * down at the hand, many times further out. For the arm to hold still the two
 * turning effects must balance, so the muscle has to pull many times harder
 * than the load weighs. Sliders set the load and (to see why the body is built
 * as it is) how far from the elbow the muscle attaches.
 *
 * mode 'pair': two buttons contract the biceps or the triceps and the elbow
 * bends or straightens: muscles only pull, so they work in opposing pairs.
 *
 * {
 *   type: 'arm-lever',
 *   mode: 'lever',              // 'lever' | 'pair'
 *   load: 5,                    // kilograms in the hand
 *   loadRange: [1, 10, 1],      // slider [min, max, step]; null: no slider
 *   attach: 4,                  // centimetres from the elbow joint to where the biceps tendon attaches
 *   attachRange: [2, 8, 1],     // slider; null: no slider
 *   reach: 32,                  // centimetres from the elbow joint to the load in the hand
 *   static: false,
 * }
 *
 * State (lever): { mode, load, attach, reach, weight, force, ratio, gear, loads, attaches }
 *   weight   the load's weight in newtons (10 N for each kilogram)
 *   force    the pull the biceps needs, in newtons: weight × reach ÷ attach
 *   ratio    force ÷ weight = reach ÷ attach
 *   gear     centimetres the hand moves for each centimetre the muscle shortens (the same number as ratio)
 *   loads, attaches   every load and every attachment distance the learner has set
 * State (pair): { mode, angle, bent, straightened, last }
 *   angle    elbow position from −70 (straight, hanging down) to 50 (fully bent) degrees from level
 *   bent, straightened   the learner has contracted the biceps / the triceps at least once
 *   last     'biceps' | 'triceps' | null
 *
 * setState({ load, attach }) or ({ bent, straightened, last }).
 *
 * The model keeps only the lever: the upper arm is upright, the forearm level, the muscle pulls straight up, and
 * the weight of the forearm itself (about 1.5 kg in an adult) is left out. Real muscle forces are somewhat higher still.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 300;
const D2R = Math.PI / 180;

addStyles('arm-lever', `
  .widget-arm-lever .al-force { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-arm-lever .al-force { font-size: 17px; } }
`);

export default function create(spec, env) {
  const mode = spec.mode === 'pair' ? 'pair' : 'lever';
  const isStatic = !!spec.static || !!env.compact;
  const reach = spec.reach || 32;
  // the elbow joint, the shoulder end of the upper arm, and pixels per centimetre along the forearm
  const E = mode === 'pair' ? { x: 250, y: 132 } : { x: 130, y: 196 };
  const SH = mode === 'pair' ? { x: 250, y: 16 } : { x: 130, y: 34 };
  const K = (mode === 'pair' ? 150 : 300) / reach;
  const loadRange = spec.loadRange === null ? null : (spec.loadRange || [1, 10, 1]);
  const attachRange = spec.attachRange === null ? null : (spec.attachRange || [2, 8, 1]);
  let load = spec.load != null ? spec.load : 5;
  let attach = spec.attach != null ? spec.attach : 4;
  let readOnly = !!env.readOnly;
  let angle = mode === 'pair' ? -8 : 0;  // degrees above level
  let target = angle;
  let bent = false;
  let straightened = false;
  let last = null;
  const loads = [load];
  const attaches = [attach];

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'An arm bent at the elbow, drawn as a lever' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);

  const roForce = readout('biceps must pull', { color: 'red' });
  const roRatio = readout('that is', { color: 'orange' });
  const roGear = readout('hand moves', { color: 'blue' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let lRow = null;
  let aRow = null;
  const btns = {};

  const facts = () => {
    const weight = load * 10;
    const ratio = Math.round((reach / attach) * 100) / 100;
    return { weight, force: Math.round((weight * reach) / attach), ratio, gear: ratio };
  };
  const getState = () => (mode === 'lever'
    ? { mode, load, attach, reach, ...facts(), loads: loads.slice(), attaches: attaches.slice() }
    : { mode, angle: Math.round(angle), bent, straightened, last });

  const bone = (x1, y1, x2, y2) => [
    s('line', { x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-width': 17, 'stroke-linecap': 'round' }),
    s('line', { x1, y1, x2, y2, stroke: 'var(--surface)', 'stroke-width': 11, 'stroke-linecap': 'round' }),
  ];
  /** A muscle from a to b: a thick belly over the middle and thin tendons at the ends. `tense` 0–1 fattens it. */
  const muscle = (a, b, tense, active) => {
    const p = (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const m0 = p(0.12);
    const m1 = p(0.8);
    return [
      s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' }),
      s('line', { x1: m0.x, y1: m0.y, x2: m1.x, y2: m1.y, stroke: 'var(--ink)', 'stroke-width': 20 + tense * 12, 'stroke-linecap': 'round' }),
      s('line', { x1: m0.x, y1: m0.y, x2: m1.x, y2: m1.y, stroke: hue('red', active ? '' : 'soft'), 'stroke-width': 15 + tense * 12, 'stroke-linecap': 'round' }),
    ];
  };
  const arrow = (x, y, len, color, text, side) => {
    const dir = Math.sign(len);
    const tip = y + len;
    return [
      s('path', { d: `M${x} ${y} V${tip - dir * 4} M${x - 7} ${tip - dir * 11} L${x} ${tip} L${x + 7} ${tip - dir * 11}`, fill: 'none', stroke: hue(color), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      s('text.al-force', { x: x + (side === 'left' ? -10 : 10), y: tip + (dir > 0 ? 2 : 10), 'text-anchor': side === 'left' ? 'end' : 'start', fill: hue(color, 'text') }, text),
    ];
  };

  function render() {
    g.replaceChildren();
    const th = angle * D2R;
    const dir = { x: Math.cos(th), y: -Math.sin(th) };
    const hand = { x: E.x + reach * K * dir.x, y: E.y + reach * K * dir.y };
    const at = { x: E.x + attach * K * dir.x, y: E.y + attach * K * dir.y - 8 };
    const back = { x: E.x - 16 * dir.x, y: E.y - 16 * dir.y + 4 };      // the point of the elbow, where the triceps attaches
    const flex = (angle + 70) / 120;                                     // 0 straight … 1 fully bent
    // triceps (behind), bones, biceps (in front)
    g.append(...muscle({ x: SH.x - 22, y: SH.y + 10 }, back, mode === 'pair' ? 1 - flex : 0.2, mode === 'pair' && last === 'triceps'));
    g.append(...bone(SH.x, SH.y, E.x, E.y), ...bone(E.x, E.y, hand.x, hand.y));
    g.append(...muscle({ x: SH.x + 24, y: SH.y + 8 }, at, mode === 'pair' ? flex : 0.6, mode === 'lever' || last === 'biceps'));
    g.appendChild(s('circle', { cx: E.x, cy: E.y, r: 7, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    g.appendChild(s('circle', { cx: hand.x, cy: hand.y, r: 12, fill: hue('orange', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    g.appendChild(s('text.fig-label-sm', { x: SH.x + 48, y: SH.y + 60, 'text-anchor': 'start' }, 'biceps'));
    g.appendChild(s('text.fig-label-sm', { x: SH.x - 46, y: SH.y + 60, 'text-anchor': 'end' }, 'triceps'));
    g.appendChild(s('text.fig-label-sm', { x: E.x - 18, y: E.y + 30, 'text-anchor': 'end' }, 'elbow'));

    if (mode === 'lever') {
      const f = facts();
      // the load: a weight hanging from the hand
      g.appendChild(s('rect', { x: hand.x - 20, y: hand.y + 16, width: 40, height: 30, rx: 6, fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      g.appendChild(s('text.fig-label-sm', { x: hand.x, y: hand.y + 36, 'text-anchor': 'middle' }, `${load} kg`));
      g.append(...arrow(hand.x + 38, hand.y + 6, 20 + load * 4, 'blue', `${f.weight} N`, 'right'));
      g.append(...arrow(at.x + 16, at.y - 4, -clamp(16 + f.force / 9, 20, 150), 'red', `${f.force} N`, 'right'));
      // the two distances from the elbow
      const y1 = E.y + 26;
      const y2 = E.y + 74;
      const dim = (x2, y, text, color) => {
        g.appendChild(s('path', { d: `M${E.x} ${y} H${x2} M${E.x} ${y - 5} V${y + 5} M${x2} ${y - 5} V${y + 5}`, fill: 'none', stroke: hue(color), 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
        g.appendChild(s('text.fig-label-sm', { x: Math.max((E.x + x2) / 2, E.x + 22), y: y + 17, 'text-anchor': 'middle', class: `text-${color}` }, text));
      };
      dim(E.x + attach * K, y1, `${attach} cm`, 'red');
      dim(hand.x, y2, `${reach} cm to the load`, 'blue');
      roForce.set(`${f.force} N`);
      roRatio.set(`${f.ratio} × the load`);
      roGear.set(`${f.gear} cm per cm of muscle`);
      svg.setAttribute('aria-label', `${spec.alt || 'An arm bent at the elbow, drawn as a lever'}. A load of ${load} kilograms (${f.weight} newtons) is held ${reach} centimetres from the elbow. The biceps attaches ${attach} centimetres from the elbow and must pull with ${f.force} newtons, ${f.ratio} times the load.`);
    } else {
      for (const k of ['biceps', 'triceps']) if (btns[k]) btns[k].disabled = readOnly;
      svg.setAttribute('aria-label', `${spec.alt || 'An arm with its biceps and triceps muscles'}. The elbow is ${angle > 20 ? 'bent' : angle < -40 ? 'straight' : 'half bent'}.${last ? ` The ${last} has just contracted.` : ''}`);
    }
  }

  const anim = loop((dt) => {
    const stepSize = dt * 220;
    angle = Math.abs(target - angle) <= stepSize ? target : angle + Math.sign(target - angle) * stepSize;
    render();
    if (angle === target) anim.stop();
  });

  function contract(which) {
    if (readOnly) return;
    last = which;
    if (which === 'biceps') { bent = true; target = 50; } else { straightened = true; target = -70; }
    note.textContent = which === 'biceps'
      ? 'The biceps shortens and pulls the forearm up. The triceps is stretched out, relaxed.'
      : 'The triceps shortens and pulls on the point of the elbow, swinging the forearm down. The biceps is stretched out, relaxed.';
    play('tap');
    env.announce(note.textContent);
    if (reducedMotion()) { angle = target; render(); } else { anim.start(); render(); }
    env.onChange(getState());
  }

  if (!isStatic) {
    if (mode === 'lever') {
      fr.readouts.append(roForce.el, roRatio.el, roGear.el);
      if (loadRange) {
        lRow = sliderRow({ label: 'load in the hand', min: loadRange[0], max: loadRange[1], step: loadRange[2] || 1, value: load, color: 'blue', unit: 'kg', onInput: (v) => { if (readOnly) return; load = v; if (!loads.includes(v)) loads.push(v); render(); play('tap'); env.onChange(getState()); } });
        fr.controls.appendChild(lRow.el);
      }
      if (attachRange) {
        aRow = sliderRow({ label: 'muscle attaches', min: attachRange[0], max: attachRange[1], step: attachRange[2] || 1, value: attach, color: 'red', format: (v) => `${v} cm from the elbow`, onInput: (v) => { if (readOnly) return; attach = v; if (!attaches.includes(v)) attaches.push(v); render(); play('tap'); env.onChange(getState()); } });
        fr.controls.appendChild(aRow.el);
      }
    } else {
      btns.biceps = button('Contract the biceps', () => contract('biceps'), { variant: 'primary' });
      btns.triceps = button('Contract the triceps', () => contract('triceps'), { variant: 'primary' });
      fr.buttons.append(btns.biceps, btns.triceps);
      fr.el.appendChild(note);
    }
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (mode === 'lever') {
        if (typeof next.load === 'number') { load = next.load; if (lRow) lRow.set(load); if (!loads.includes(load)) loads.push(load); }
        if (typeof next.attach === 'number') { attach = next.attach; if (aRow) aRow.set(attach); if (!attaches.includes(attach)) attaches.push(attach); }
        if (Array.isArray(next.loads)) for (const v of next.loads) if (!loads.includes(v)) loads.push(v);
      } else {
        if (next.bent) bent = true;
        if (next.straightened) straightened = true;
        if (next.last === 'biceps' || next.last === 'triceps') { last = next.last; angle = target = last === 'biceps' ? 50 : -70; }
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [lRow, aRow]) if (row) row.setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'arm-lever — how hard must the biceps pull?', spec: { type: 'arm-lever', load: 5, attach: 4 } },
  { title: 'arm-lever — an opposing pair', spec: { type: 'arm-lever', mode: 'pair' } },
];
