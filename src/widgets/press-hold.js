/**
 * press-hold — direct pressure on a bleeding wound, as a model the learner
 * operates. A plain drawing of a forearm with a marked wound; one control
 * presses a pad onto it, the other lifts the pad "to look". A gauge shows how
 * hard the wound is bleeding. Under unbroken pressure a clot forms and the
 * bleeding slows to a stop; every lift disturbs the clot and the bleeding
 * picks up again. Model time runs at one "minute" a second.
 *
 * {
 *   type: 'press-hold',
 *   need: 10,          // minutes of unbroken pressure after which the model's bleeding is controlled
 *   setback: 0.6,      // share of the clot lost each time the pad is lifted (0 to 1)
 *   limit: 40,         // the model clock stops here (minutes)
 * }
 *
 * State: { pressing, lifts, minutes, held, controlled }
 *   pressing    the pad is on the wound now
 *   lifts       how many times the pad has been lifted after pressing began
 *   minutes     model minutes since the start (whole number)
 *   held        length of the current unbroken press, in model minutes (whole number)
 *   controlled  the clot is complete: bleeding has stopped under the pad
 * setState({ controlled: true, lifts: 0, minutes: 10 }) shows a finished run.
 *
 * The model is a cartoon of clotting. Its ten minutes are an illustration, not a rule: real bleeding
 * may take longer, and severe bleeding may not stop without professional help. What carries over is
 * the principle: press hard, and do not lift to look.
 */
import { frame, loop, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 210;

addStyles('press-hold', `
  .widget-press-hold .ph-row { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-press-hold .ph-btn {
    min-height: 48px; min-width: 150px; padding: 0.5rem 1rem; display: inline-flex; align-items: center; justify-content: center; text-align: center;
    border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--surface); color: var(--ink);
    font-weight: 800; font-size: var(--fs-md); cursor: pointer; user-select: none; -webkit-user-select: none; box-shadow: 0 3px 0 var(--edge-strong);
  }
  .widget-press-hold .ph-btn.is-press[aria-pressed="true"] { background: var(--blue-soft); border-color: var(--blue); box-shadow: none; transform: translateY(3px); }
  .widget-press-hold .ph-btn[aria-disabled="true"] { opacity: 0.5; cursor: default; box-shadow: none; }
  .widget-press-hold .ph-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-press-hold .ph-note { margin: 0; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); min-height: 2.6em; text-wrap: balance; }
`);

/** Words for a bleeding level between 0 (stopped) and 1 (heavy). Exported for the course tests. */
export function bleedingWord(flow) {
  return flow <= 0 ? 'stopped' : flow < 0.34 ? 'oozing' : flow < 0.67 ? 'slowing' : 'heavy';
}

export default function create(spec, env) {
  const need = clamp(Number(spec.need) || 10, 3, 30);
  const setback = clamp(spec.setback != null ? Number(spec.setback) : 0.6, 0, 1);
  const limit = clamp(Number(spec.limit) || 40, need + 5, 120);
  let readOnly = !!env.readOnly;
  let pressing = false;
  let started = false;      // the pad has been pressed at least once
  let clot = 0;             // 0 … 1
  let time = 0;             // model minutes
  let heldFor = 0;          // model minutes of the current press
  let lifts = 0;

  const fr = frame({ width: W, height: H, label: spec.alt || 'A forearm with a wound, a pad to press on it, and a gauge of the bleeding' });
  const svg = fr.svg;
  // the forearm, hand to the right
  svg.appendChild(s('path', { d: 'M24 112 Q24 84 60 84 L384 94 Q398 94 406 88 Q420 66 440 74 Q450 82 438 94 L474 92 Q512 94 512 120 Q512 148 474 150 L406 150 Q396 148 384 150 L60 150 Q24 150 24 122 Z', fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  svg.appendChild(s('path', { d: 'M24 112 Q24 84 60 84 L150 86 L150 150 L60 150 Q24 150 24 122 Z', fill: 'var(--blue-soft)', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));   // a rolled-up sleeve
  const wound = s('line', { x1: 252, x2: 292, y1: 118, y2: 124, stroke: 'var(--red)', 'stroke-width': 5, 'stroke-linecap': 'round' });
  svg.appendChild(wound);
  svg.appendChild(s('text.fig-label', { x: 272, y: 180, 'text-anchor': 'middle' }, 'wound'));
  const pad = s('g', { style: 'display:none' },
    s('rect', { x: 232, y: 98, width: 80, height: 46, rx: 8, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    s('path', { d: 'M236 96 Q236 58 272 58 Q308 58 308 96 Z', fill: 'var(--blue-soft)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    s('path', { d: 'M272 22 L272 46 M263 38 L272 48 L281 38', fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  svg.appendChild(pad);
  // the gauge
  const GX = 372;
  const GW = 168;
  svg.appendChild(s('text.fig-label', { x: GX, y: 26 }, 'bleeding:'));
  svg.appendChild(s('rect', { x: GX, y: 34, width: GW, height: 16, rx: 8, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 1.5 }));
  const bar = s('rect', { x: GX, y: 34, width: GW, height: 16, rx: 8, fill: 'var(--red)' });
  svg.appendChild(bar);
  const level = s('text.fig-label', { x: GX + GW, y: 26, 'text-anchor': 'end' });
  level.style.fontWeight = '800';
  svg.appendChild(level);
  const clock = s('text.fig-label', { x: 30, y: 26 });
  svg.appendChild(clock);

  const note = h('p.ph-note', { 'aria-live': 'polite' });
  const pressBtn = h('div.ph-btn.is-press', { role: 'button', tabindex: '0', 'aria-pressed': 'false' }, 'Press firmly');
  const liftBtn = h('div.ph-btn', { role: 'button', tabindex: '0' }, 'Lift to look');
  pressBtn.dataset.keys = 'own';
  liftBtn.dataset.keys = 'own';
  fr.el.append(note, h('div.ph-row', pressBtn, liftBtn));

  const flow = () => 1 - clot;
  const controlled = () => clot >= 1;
  const getState = () => ({ pressing, lifts, minutes: Math.floor(time), held: Math.floor(heldFor), controlled: controlled() });

  function render() {
    const f = flow();
    bar.setAttribute('width', Math.max(0, GW * f).toFixed(1));
    bar.style.display = f > 0.01 ? '' : 'none';
    level.textContent = bleedingWord(f);
    clock.textContent = started ? `minute ${Math.floor(time)}` : 'minute 0';
    pad.style.display = pressing ? '' : 'none';
    wound.style.display = pressing ? 'none' : '';
    pressBtn.setAttribute('aria-pressed', String(pressing));
    pressBtn.textContent = pressing ? 'Pressing…' : 'Press firmly';
    const pressOff = readOnly || pressing;
    const liftOff = readOnly || !pressing;
    pressBtn.setAttribute('aria-disabled', String(pressOff));
    pressBtn.setAttribute('tabindex', pressOff ? '-1' : '0');
    liftBtn.setAttribute('aria-disabled', String(liftOff));
    liftBtn.setAttribute('tabindex', liftOff ? '-1' : '0');
    if (controlled()) note.textContent = pressing ? `Bleeding controlled after ${Math.floor(heldFor)} minutes of unbroken pressure. Keep the pad on until help takes over.` : 'The bleeding has stopped under the pad.';
    else if (!started) note.textContent = 'The wound is bleeding heavily. Press the pad onto it.';
    else if (pressing) note.textContent = `Pressing for ${Math.floor(heldFor)} ${Math.floor(heldFor) === 1 ? 'minute' : 'minutes'}: the bleeding is ${bleedingWord(f)}.`;
    else note.textContent = `Pad lifted: the clot is disturbed and the wound is bleeding ${f >= 0.67 ? 'heavily' : 'faster'} again. Press, and keep pressing.`;
    svg.setAttribute('aria-label', `${spec.alt || 'A forearm with a wound.'} ${pressing ? 'A pad is being pressed on the wound.' : 'The wound is uncovered.'} Bleeding: ${bleedingWord(f)}. Minute ${Math.floor(time)}.`);
  }

  let lastWhole = -1;
  const anim = loop((dt) => {
    if (readOnly || !started || controlled() || time >= limit) { anim.stop(); render(); return; }
    time += dt;                       // one model minute a second
    if (pressing) { heldFor += dt; clot = Math.min(1, clot + dt / need); }
    if (controlled()) {
      anim.stop();
      render();
      play('step');
      env.announce(note.textContent);
      env.onChange(getState());
      return;
    }
    if (Math.floor(time) !== lastWhole) { lastWhole = Math.floor(time); render(); env.onChange(getState()); } else bar.setAttribute('width', Math.max(0, GW * flow()).toFixed(1));
  });

  function press() {
    if (readOnly || pressing || controlled()) return;
    pressing = true;
    started = true;
    heldFor = 0;
    play('tap');
    render();
    anim.start();
    env.onChange(getState());
  }
  function lift() {
    if (readOnly || !pressing) return;
    pressing = false;
    lifts++;
    if (!controlled()) clot = Math.max(0, clot - setback);
    else clot = Math.max(0, 1 - setback);          // lifting a finished clot starts the bleeding again too
    heldFor = 0;
    play('drop');
    render();
    anim.start();
    env.onChange(getState());
  }
  const onKey = (fn) => (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); fn(); } };
  pressBtn.addEventListener('click', press);
  pressBtn.addEventListener('keydown', onKey(press));
  liftBtn.addEventListener('click', lift);
  liftBtn.addEventListener('keydown', onKey(lift));

  render();
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      lifts = Math.max(0, Math.round(next.lifts || 0));
      if (next.controlled) { started = true; pressing = true; clot = 1; time = next.minutes != null ? Number(next.minutes) : need; heldFor = Math.min(time, need); } else {
        started = !!next.pressing || lifts > 0;
        pressing = !!next.pressing;
        time = Number(next.minutes) || 0;
        heldFor = Number(next.held) || 0;
        clot = clamp(heldFor / need, 0, 0.99);
      }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (readOnly) anim.stop(); render(); },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'press-hold — direct pressure on a wound', spec: { type: 'press-hold' } },
];
