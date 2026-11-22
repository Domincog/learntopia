/**
 * fear-curve — why avoiding a fear feeds it and facing it shrinks it. An
 * example person meets the thing they fear several times. Each time the
 * learner chooses for them: LEAVE at once (the fear drops straight away, and
 * the next peak is a little higher) or STAY until it settles (the fear comes
 * down by itself, and the next peak is lower).
 *
 * {
 *   type: 'fear-curve',
 *   start: 80,            // height of the first peak, 0 to 100
 *   encounters: 5,        // how many meetings
 *   stay: 0.75,           // the next peak is this many times the last one after staying…
 *   leave: 1.1,           // …and this many times after leaving (never above 100)
 *   goal: 30,             // optional dashed line
 *   goalLabel: 'barely a flutter',
 *   stayLabel: 'Stay', leaveLabel: 'Leave',
 * }
 *
 * State: { choices, peaks, next, done, stays, leaves }
 *   choices  'stay' | 'leave' for each meeting so far
 *   peaks    the peak of each meeting so far, to one decimal
 *   next     the peak the next meeting would have (after the last one: what a further meeting would bring)
 *   done     every meeting has been played
 *
 * setState accepts { choices: ['stay', 'leave', …] }.
 *
 * A cartoon of what therapists call exposure. Real progress is bumpier, the steps are chosen to be
 * manageable, and for strong fears the work is done with a trained therapist.
 */
import { frame, button, readout, hue, s, h, clamp, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 600;
const H = 280;
const PL = 44;
const PR = 14;
const PT = 24;
const PB = 40;

addStyles('fear-curve', `
  .widget-fear-curve .fc-note { text-align: center; font-size: var(--fs-sm); min-height: 2.8em; margin: 0; color: var(--ink-2); }
  .widget-fear-curve .fc-note b { color: var(--ink); }
  .widget-fear-curve .fc-peak { font-family: var(--font-body); font-size: 13px; font-weight: 800; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @container wcanvas (max-width: 470px) { .widget-fear-curve .fc-peak { font-size: 18px; } }
`);

export default function create(spec, env) {
  const n = spec.encounters || 5;
  const start = spec.start != null ? spec.start : 80;
  const kStay = spec.stay != null ? spec.stay : 0.75;
  const kLeave = spec.leave != null ? spec.leave : 1.1;
  let choices = [];
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A fear that rises and falls over several meetings' });
  const { svg } = fr;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const seg = iw / n;
  const sy = (v) => PT + (1 - v / 105) * ih;

  for (let v = 0; v <= 100; v += 25) {
    svg.appendChild(s('line.grid-line', { x1: PL, x2: W - PR, y1: sy(v), y2: sy(v) }));
    svg.appendChild(s('text.tick-label', { x: PL - 6, y: sy(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  svg.appendChild(s('text.axis-label', { x: PL + 6, y: PT - 8, 'text-anchor': 'start' }, 'fear (0 to 100)'));
  for (let i = 0; i < n; i++) {
    if (i > 0) svg.appendChild(s('line', { x1: PL + i * seg, x2: PL + i * seg, y1: PT, y2: H - PB, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 5' }));
    svg.appendChild(s('text.tick-label', { x: PL + (i + 0.5) * seg, y: H - PB + 18, 'text-anchor': 'middle' }, `meeting ${i + 1}`));
  }
  svg.appendChild(s('line', { x1: PL, x2: W - PR, y1: H - PB, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: PL, x2: PL, y1: PT, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  if (spec.goal != null) {
    svg.appendChild(s('line', { x1: PL, x2: W - PR, y1: sy(spec.goal), y2: sy(spec.goal), stroke: hue('green'), 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
  }
  const gCurves = s('g');
  svg.appendChild(gCurves);

  /** The peak of each meeting played so far, and of the one to come. */
  function peaksOf(list) {
    const out = [start];
    for (const c of list) out.push(clamp(out[out.length - 1] * (c === 'stay' ? kStay : kLeave), 0, 100));
    return out;
  }
  function getState() {
    const all = peaksOf(choices);
    return {
      choices: choices.slice(),
      peaks: all.slice(0, choices.length).map((v) => tidy(v, 1)),
      next: tidy(all[choices.length], 1),
      done: choices.length >= n,
      stays: choices.filter((c) => c === 'stay').length,
      leaves: choices.filter((c) => c === 'leave').length,
    };
  }

  const note = h('p.fc-note', { 'aria-live': 'polite' });
  const roNext = readout('next peak', { color: 'red', digits: 0 });
  let stayBtn = null;
  let leaveBtn = null;
  let resetBtn = null;

  /** One meeting as a path: a quick climb to the peak, then a sharp drop (leave) or a slow settling (stay). */
  function meetingPath(i, peak, choice) {
    const x0 = PL + i * seg + 6;
    const x1 = PL + (i + 1) * seg - 6;
    const xp = x0 + (x1 - x0) * 0.16;
    const rest = sy(4);
    let d = `M${x0.toFixed(1)} ${rest.toFixed(1)}C${(x0 + (xp - x0) * 0.6).toFixed(1)} ${rest.toFixed(1)} ${(x0 + (xp - x0) * 0.7).toFixed(1)} ${sy(peak).toFixed(1)} ${xp.toFixed(1)} ${sy(peak).toFixed(1)}`;
    if (choice === 'leave') {
      const xl = xp + (x1 - x0) * 0.12;
      d += `L${xl.toFixed(1)} ${sy(peak * 0.96).toFixed(1)}C${(xl + 8).toFixed(1)} ${sy(peak * 0.9).toFixed(1)} ${(xl + 10).toFixed(1)} ${sy(10).toFixed(1)} ${(xl + 26).toFixed(1)} ${sy(7).toFixed(1)}L${x1.toFixed(1)} ${rest.toFixed(1)}`;
    } else if (choice === 'stay') {
      for (let k = 1; k <= 24; k++) {
        const f = k / 24;
        const v = 4 + (peak - 4) * (0.28 + 0.72 * Math.exp(-3.2 * f));
        d += `L${(xp + (x1 - xp) * f).toFixed(1)} ${sy(v).toFixed(1)}`;
      }
    }
    return d;
  }

  function render() {
    while (gCurves.firstChild) gCurves.removeChild(gCurves.firstChild);
    const all = peaksOf(choices);
    for (let i = 0; i < n; i++) {
      const played = i < choices.length;
      const isNext = i === choices.length;
      if (!played && !isNext) continue;
      const peak = all[i];
      const x0 = PL + i * seg + 6;
      const xp = x0 + (seg - 12) * 0.16;
      gCurves.appendChild(s('path', { d: meetingPath(i, peak, played ? choices[i] : null), fill: 'none', stroke: hue(played ? (choices[i] === 'stay' ? 'teal' : 'red') : 'gray'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      gCurves.appendChild(s('circle', { cx: xp, cy: sy(peak), r: 5.5, fill: played ? hue(choices[i] === 'stay' ? 'teal' : 'red') : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gCurves.appendChild(s('text.fc-peak', { x: xp + 9, y: sy(peak) - 8, 'text-anchor': 'start' }, String(Math.round(peak))));
      if (played) gCurves.appendChild(s('text', { class: `fig-label-sm text-${choices[i] === 'stay' ? 'teal' : 'red'}`, x: PL + (i + 0.5) * seg, y: H - 6, 'text-anchor': 'middle' }, choices[i] === 'stay' ? (spec.stayLabel || 'stayed') : (spec.leaveLabel || 'left')));
    }
    const st = getState();
    roNext.set(st.done ? `${Math.round(st.next)}, at one more meeting` : Math.round(st.next));
    note.innerHTML = '';
    if (!choices.length) note.append(`Meeting 1: the fear shoots up to ${Math.round(start)}. What now?`);
    else {
      const last = choices[choices.length - 1];
      const before = all[choices.length - 1];
      const after = all[choices.length];
      note.append(h('b', last === 'stay' ? 'Stayed: ' : 'Left: '), last === 'stay'
        ? `the fear came down by itself. Next time it starts lower: ${Math.round(before)} → ${Math.round(after)}.`
        : `relief at once. But next time the alarm is ${after > before ? `louder: ${Math.round(before)} → ${Math.round(after)}` : 'just as loud'}.`);
    }
    const off = readOnly || st.done;
    if (stayBtn) stayBtn.disabled = off;
    if (leaveBtn) leaveBtn.disabled = off;
    if (resetBtn) resetBtn.disabled = readOnly || !choices.length;
    svg.setAttribute('aria-label', `${spec.alt || 'A fear that rises and falls over several meetings'}. ${choices.length ? choices.map((c, i) => `Meeting ${i + 1}: peak ${Math.round(all[i])}, ${c === 'stay' ? 'stayed' : 'left'}`).join('. ') : 'No meetings yet'}. The next peak would be ${Math.round(st.next)}.`);
  }

  const choose = (c) => {
    if (readOnly || choices.length >= n) return;
    choices.push(c);
    play(c === 'stay' ? 'drop' : 'tap');
    render();
    env.announce(note.textContent);
    env.onChange(getState());
  };
  if (!env.compact && !spec.static) {
    fr.el.insertBefore(note, fr.readouts);
    fr.readouts.appendChild(roNext.el);
    if (spec.goal != null) { const roGoal = readout('dashed line', { color: 'green' }); roGoal.set(`${spec.goal}${spec.goalLabel ? `: ${spec.goalLabel}` : ''}`); fr.readouts.appendChild(roGoal.el); }
    stayBtn = button(spec.stayButton || 'Stay until it settles', () => choose('stay'), { variant: 'primary' });
    leaveBtn = button(spec.leaveButton || 'Leave at once', () => choose('leave'));
    resetBtn = button('Start again', () => { if (readOnly) return; choices = []; render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(stayBtn, leaveBtn, resetBtn);
  }
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.choices)) return;
      choices = next.choices.filter((c) => c === 'stay' || c === 'leave').slice(0, n);
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'fear-curve — leave or stay?', spec: { type: 'fear-curve', start: 80, encounters: 5, goal: 30, goalLabel: 'barely a flutter' } },
];
