/**
 * hilbert-hotel — Hilbert's hotel: rooms 1, 2, 3, … without end, every one
 * occupied, and new guests at the door. The learner gives all the guests one
 * instruction ("move up k rooms" or "go to the room with double your number")
 * and sees which rooms that frees.
 *
 * {
 *   type: 'hilbert-hotel',
 *   rooms: 8,           // how many rooms are drawn (the hotel itself never ends); 6 to 10
 *   arrivals: 1,        // new guests waiting: a number from 1 to 4, or 'bus' for infinitely many
 *   maxShift: 5,        // the largest k offered for "move up k rooms"
 *   rule: null,         // start with an instruction already given: 'plus' or 'double'
 *   k: 1,               // the k of "move up k rooms" at the start
 *   static: false,      // true: picture only
 * }
 *
 * State: { rule, k, freed, housed, waiting, allHoused }
 *   rule       null (nothing done yet), 'plus' (everyone moved from room n to room n + k) or 'double' (n to 2n)
 *   k          the current k
 *   freed      how many rooms the instruction freed in the whole hotel: 0, k, or 'infinite'
 *   housed     how many of the new guests now have a room: a number, or 'all'
 *   waiting    how many are still at the door: a number, or 'infinite'
 *   allHoused  every new guest has a room, and nobody was sent away
 *
 * setState accepts { rule: 'double' } or { rule: 'plus', k: 3 } or { rule: null }.
 */
import { frame, sliderRow, button, hue, s, h, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('hilbert-hotel', `
  .widget-hilbert-hotel .hh-line { text-align: center; min-height: 4.4em; display: grid; align-content: center; font-size: var(--fs-sm); color: var(--ink-2); }
  .widget-hilbert-hotel .hh-line b { color: var(--ink); }
  .widget-hilbert-hotel .hh-who { font-size: 14px; fill: #1D1B26; stroke: none !important; }
`);

const W = 440;
const H = 164;

export default function create(spec, env) {
  const rooms = clamp(Math.round(spec.rooms || 8), 6, 10);
  const bus = spec.arrivals === 'bus';
  const arrivals = bus ? Infinity : clamp(Math.round(spec.arrivals || 1), 1, 4);
  const maxShift = clamp(Math.round(spec.maxShift || 5), 1, rooms - 1);
  const isStatic = !!spec.static || env.compact;
  let rule = spec.rule === 'plus' || spec.rule === 'double' ? spec.rule : null;
  let k = clamp(Math.round(spec.k || 1), 1, maxShift);
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A hotel with endlessly many rooms' });
  const { svg } = fr;
  const layer = s('g');
  svg.appendChild(layer);
  const line = h('div.hh-line');
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);

  const step = (W - 44) / rooms;
  const doorW = Math.min(46, step - 6);
  const roomX = (j) => 8 + (j - 0.5) * step;

  function getState() {
    const freed = rule === 'plus' ? k : rule === 'double' ? 'infinite' : 0;
    const housedCount = freed === 'infinite' ? arrivals : Math.min(freed, arrivals);
    const allHoused = housedCount === arrivals;
    return {
      rule, k, freed,
      housed: allHoused ? 'all' : housedCount,
      waiting: allHoused ? 0 : bus ? 'infinite' : arrivals - housedCount,
      allHoused,
    };
  }

  /** Who is in room j now? { old: n } an original guest (from room n), { fresh: m } new guest number m, or null. */
  function occupant(j) {
    if (!rule) return { old: j };
    if (rule === 'plus') return j > k ? { old: j - k } : j <= arrivals ? { fresh: j } : null;
    if (j % 2 === 0) return { old: j / 2 };
    const m = (j + 1) / 2;
    return m <= arrivals ? { fresh: m } : null;
  }

  function token(x, y, text, color) {
    const g = s('g');
    g.appendChild(s('circle', { cx: x, cy: y, r: 15, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
    g.appendChild(s('text', { class: 'fig-label hh-who', x, y: y + 4.5, 'text-anchor': 'middle' }, text));
    return g;
  }
  const fmt = (list) => (list.length === 1 ? `Room ${list[0]}` : `Rooms ${list[0]} to ${list[list.length - 1]}`);

  function draw() {
    layer.replaceChildren();
    const st = getState();
    // the guests at the door
    const waitingShown = st.waiting === 'infinite' ? 4 : st.waiting;
    const firstWaiting = st.housed === 'all' ? arrivals + 1 : st.housed + 1;
    layer.appendChild(s('text', { class: 'fig-label', x: 12, y: 31 }, st.waiting === 0 ? 'At the door: nobody' : 'At the door:'));
    for (let i = 0; i < waitingShown; i++) layer.appendChild(token(140 + i * 36, 26, `N${firstWaiting + i}`, 'orange'));
    if (st.waiting === 'infinite') layer.appendChild(s('text', { class: 'fig-label', x: 140 + 4 * 36 - 12, y: 31 }, '… without end'));
    // the rooms
    for (let j = 1; j <= rooms; j++) {
      const x = roomX(j);
      const who = occupant(j);
      layer.appendChild(s('rect', { x: x - doorW / 2, y: 62, width: doorW, height: 86, rx: 6, fill: who ? 'var(--surface)' : hue('green', 'soft'), stroke: who ? 'var(--ink)' : hue('green'), 'stroke-width': 2.5, 'stroke-dasharray': who ? null : '6 5' }));
      layer.appendChild(s('text', { class: 'fig-label', x, y: 82, 'text-anchor': 'middle' }, String(j)));
      if (who) layer.appendChild(token(x, 118, who.old ? String(who.old) : `N${who.fresh}`, who.old ? 'blue' : 'orange'));
      else layer.appendChild(s('text', { class: 'fig-label-sm text-green', x, y: 122, 'text-anchor': 'middle' }, 'free'));
    }
    layer.appendChild(s('text', { class: 'fig-label-lg', x: roomX(rooms) + step * 0.5 + 16, y: 112, 'text-anchor': 'middle' }, '…'));

    const many = bus ? 'Infinitely many new guests are' : arrivals === 1 ? 'One new guest is' : `${arrivals} new guests are`;
    let text;
    if (!rule) text = `Every room is taken. ${many} waiting.`;
    else if (rule === 'plus') {
      const free = Array.from({ length: k }, (_, i) => i + 1);
      const tail = st.allHoused ? '**Every new guest has a room.**' : st.waiting === 'infinite' ? `That houses ${k} new guest${k === 1 ? '' : 's'}. **Infinitely many are still at the door.**` : `**${st.waiting} new guest${st.waiting === 1 ? ' is' : 's are'} still at the door.**`;
      text = `Everyone moved from room $n$ to room $n + ${k}$. ${fmt(free)} became free. ${tail}`;
    } else {
      text = `Everyone moved from room $n$ to room $2n$. Every odd room became free: infinitely many rooms. ${bus ? 'New guest number $m$ takes room $2m - 1$. ' : ''}**Every new guest has a room.**`;
    }
    line.replaceChildren(h('span', { html: mdInline(text) }));
    if (plusBtn) {
      plusBtn.lastChild.textContent = `Everyone moves up ${k} room${k === 1 ? '' : 's'}`;
      plusBtn.disabled = doubleBtn.disabled = readOnly || !!rule;
      backBtn.disabled = readOnly || !rule;
      slider.setDisabled(readOnly || !!rule);
    }
    const shown = Array.from({ length: rooms }, (_, i) => { const who = occupant(i + 1); return `room ${i + 1}: ${!who ? 'free' : who.old ? `the guest from room ${who.old}` : `new guest ${who.fresh}`}`; });
    svg.setAttribute('aria-label', `The first ${rooms} rooms of an endless hotel. ${shown.join('; ')}.`);
  }

  function apply(next) {
    if (readOnly) return;
    rule = next;
    play(next ? 'drop' : 'pop');
    draw();
    const st = getState();
    env.announce(!rule ? 'Everyone is back in their own room.' : st.allHoused ? 'Every new guest has a room.' : 'Some new guests are still at the door.');
    env.onChange(st);
  }

  let slider = null;
  let plusBtn = null;
  let doubleBtn = null;
  let backBtn = null;
  if (!isStatic) {
    slider = sliderRow({ label: 'rooms to move up', min: 1, max: maxShift, step: 1, value: k, color: 'blue', onInput: (v) => { if (readOnly || rule) return; k = v; draw(); } });
    plusBtn = button('Everyone moves up 1 room', () => apply('plus'), { variant: 'primary' });
    doubleBtn = button('Everyone doubles their room number', () => apply('double'), { variant: 'primary' });
    backBtn = button('Back to the start', () => apply(null), { icon: 'reset', variant: 'ghost' });
    fr.controls.appendChild(slider.el);
    fr.buttons.append(plusBtn, doubleBtn, backBtn);
  }
  if (!env.compact) fr.el.appendChild(h('p.w-hint', 'A blue guest carries the number of the room they started in. Orange guests are new.'));
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.k != null) { k = clamp(Math.round(next.k), 1, maxShift); if (slider) slider.set(k); }
      if ('rule' in next) rule = next.rule === 'plus' || next.rule === 'double' ? next.rule : null;
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      draw();
    },
  };
}

export const examples = [
  { title: 'hilbert-hotel — one new guest', spec: { type: 'hilbert-hotel', arrivals: 1 } },
  { title: 'hilbert-hotel — an endless bus', spec: { type: 'hilbert-hotel', arrivals: 'bus' } },
];
