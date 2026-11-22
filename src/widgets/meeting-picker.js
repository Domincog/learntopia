/**
 * meeting-picker — one room, a list of meeting requests on a time line, and
 * the question "how many can you fit in without overlap?". Tap a bar to book
 * that meeting. Meetings that overlap a booked one are greyed out and refused.
 *
 * With a rule the learner carries out a greedy algorithm by hand: only the
 * meeting the rule would choose next is accepted. With several `rules` the
 * learner can run them one after another on the same timetable and compare
 * how many meetings each of them books.
 *
 * {
 *   type: 'meeting-picker',
 *   meetings: [{ id: 'A', start: 12, end: 12.5 }, …],   // hours of the day; 12.5 is 12:30. At most 9.
 *   from: 9, to: 18,           // the part of the day that is drawn (default: fitted to the meetings);
 *                              // the scale along the top shows the hours as plain numbers
 *   rule: 'finish',            // optional: 'shortest' | 'start' | 'finish': only that rule's choice is accepted
 *   rules: ['shortest', 'start', 'finish'],   // optional: a switch between rules; each finished run is remembered
 *   booked: ['D', 'A'],        // meetings booked at the start
 *   static: false,             // true: picture only
 * }
 *
 * State: { picked, count, full, rule, results }
 *   picked   ids of the booked meetings, in the order they were booked
 *   count    how many that is
 *   full     no further meeting fits
 *   rule     the rule in force (null when the learner chooses freely)
 *   results  with `rules`: how many meetings each rule booked, once its run is finished,
 *            e.g. { shortest: 3, start: 2 }
 *
 * setState accepts { picked: ['D', 'A', 'F'] }, and with rules { ran: ['shortest', 'start'] }
 * (carries those rules out to the end) and/or { rule: 'finish' }.
 *
 * Two meetings may touch: one can start at the minute another ends.
 */
import { frame, readout, button, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('meeting-picker', `
  .widget-meeting-picker .mp-bar { outline: none; }
  .widget-meeting-picker .mp-bar.is-tap { cursor: pointer; }
  .widget-meeting-picker .mp-bar:focus-visible rect { stroke: var(--focus); stroke-width: 5; }
  .widget-meeting-picker .mp-bar.is-nope .mp-inner { animation: shake 0.4s ease; }
  .widget-meeting-picker.is-readonly .mp-bar { pointer-events: none; }
  .widget-meeting-picker .mp-status { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-meeting-picker .mp-status.is-good { color: var(--green-text); }
  .widget-meeting-picker .mp-status.is-bad { color: var(--red-text); }
  .widget-meeting-picker .mp-rules { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-meeting-picker .mp-rules .btn.is-on { background: var(--ink); color: var(--surface); border-color: var(--ink); }
  .widget-meeting-picker .btn-ghost { box-shadow: none; }
`);

export const RULES = {
  shortest: { name: 'Shortest first', key: (m) => m.end - m.start, word: 'shortest' },
  start: { name: 'Earliest start', key: (m) => m.start, word: 'earliest to start' },
  finish: { name: 'Earliest finish', key: (m) => m.end, word: 'earliest to finish' },
};

export const overlap = (a, b) => a.start < b.end && b.start < a.end;
/** Meetings that are neither booked nor in the way of a booked one. */
export const freeOf = (meetings, picked) => meetings.filter((m) => !picked.includes(m.id) && picked.every((id) => !overlap(meetings.find((x) => x.id === id), m)));
/** The ids a rule allows next (more than one only when there is a tie). */
export function ruleChoices(meetings, picked, rule) {
  const free = freeOf(meetings, picked);
  if (!free.length) return [];
  const key = RULES[rule].key;
  const best = Math.min(...free.map(key));
  return free.filter((m) => key(m) === best).map((m) => m.id);
}
/** Carry a rule out to the end (ties: the first in the list). Returns the ids booked, in order. */
export function runRule(meetings, rule) {
  const picked = [];
  for (;;) {
    const next = ruleChoices(meetings, picked, rule);
    if (!next.length) return picked;
    picked.push(next[0]);
  }
}

const clock = (t) => `${Math.floor(t)}:${String(Math.round((t - Math.floor(t)) * 60)).padStart(2, '0')}`;
const lengthText = (m) => {
  const mins = Math.round((m.end - m.start) * 60);
  const hrs = Math.floor(mins / 60);
  const rest = mins % 60;
  return hrs ? (rest ? `${hrs} h ${rest} min` : `${hrs} h`) : `${rest} min`;
};

// A narrow drawing with tall rows: on a phone it is shown at nearly full size, so every bar is easy to tap.
const W = 400;
const ROW = 44;

export default function create(spec, env) {
  const meetings = (Array.isArray(spec.meetings) ? spec.meetings : []).slice(0, 9).map((m, i) => (Array.isArray(m)
    ? { id: 'ABCDEFGHI'[i], start: Number(m[0]), end: Number(m[1]) }
    : { id: String(m.id || 'ABCDEFGHI'[i]), start: Number(m.start), end: Number(m.end) }));
  const byId = (id) => meetings.find((m) => m.id === id);
  const from = Number.isFinite(spec.from) ? spec.from : Math.floor(Math.min(...meetings.map((m) => m.start)));
  const to = Number.isFinite(spec.to) ? spec.to : Math.ceil(Math.max(...meetings.map((m) => m.end)));
  const ruleList = (Array.isArray(spec.rules) ? spec.rules : []).filter((id) => RULES[id]);
  const isStatic = !!spec.static || env.compact;
  let rule = RULES[spec.rule] ? spec.rule : ruleList.length ? ruleList[0] : null;
  let picked = [];
  let results = {};
  let readOnly = !!env.readOnly;

  const place = (list) => {
    const out = [];
    for (const id of Array.isArray(list) ? list : []) {
      const m = byId(id);
      if (m && !out.includes(id) && out.every((other) => !overlap(byId(other), m))) out.push(id);
    }
    return out;
  };
  picked = place(spec.booked);

  const getState = () => ({ picked: picked.slice(), count: picked.length, full: !freeOf(meetings, picked).length, rule, results: { ...results } });

  /* ---------------------------------------------------------------- scene */
  const LEFT = 34;
  const RIGHT = 22;
  const TOP = 30;
  const H = TOP + meetings.length * ROW + 8;
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 500, label: spec.alt || 'Meeting requests on a time line' });
  const { svg } = fr;
  const tx = (t) => LEFT + ((t - from) / (to - from)) * (W - LEFT - RIGHT);
  const everyHour = (to - from) <= 10;
  for (let t = Math.ceil(from); t <= to; t++) {
    svg.appendChild(s('line.grid-line', { x1: tx(t), x2: tx(t), y1: TOP - 6, y2: H - 4 }));
    // plain hour numbers: "12:00" under every line would not fit a phone
    if (everyHour || (t - Math.ceil(from)) % 2 === 0) svg.appendChild(s('text.tick-label', { x: tx(t), y: 17, 'text-anchor': 'middle' }, String(t)));
  }
  const bars = {};
  meetings.forEach((m, i) => {
    const y = TOP + i * ROW;
    const x = tx(m.start);
    const w = Math.max(8, tx(m.end) - x);
    svg.appendChild(s('text.fig-label', { x: 14, y: y + ROW / 2 + 5, 'text-anchor': 'middle' }, m.id));
    const rect = s('rect', { x, y: y + 6, width: w, height: ROW - 12, rx: 8, 'stroke-width': 2.5 });
    const tick = s('path', { d: `M${x + w / 2 - 6} ${y + ROW / 2} l4 4 l8 -9`, fill: 'none', stroke: '#1D1B26', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const hit = s('rect', { x: Math.min(x, x + w / 2 - 22), y, width: Math.max(w, 44), height: ROW, fill: 'transparent' });
    const g = s('g.mp-bar', s('g.mp-inner', rect, tick), hit);
    if (!isStatic) {
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => tap(m.id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(m.id); } });
    }
    bars[m.id] = { g, rect, tick };
    svg.appendChild(g);
  });

  /* ------------------------------------------------------------- controls */
  const status = h('div.mp-status', { 'aria-live': 'polite' });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('mp-status', tone && `is-${tone}`); };
  const roCount = readout('Booked', { digits: 0 });
  const ruleRow = h('div.mp-rules', { role: 'group', 'aria-label': 'Rule to follow' });
  const ruleBtns = ruleList.map((id) => {
    const b = button(RULES[id].name, () => { if (readOnly || rule === id) return; rule = id; picked = []; play('tap'); changed(prompt()); });
    ruleRow.appendChild(b);
    return b;
  });
  const clearBtn = button(rule ? 'Start again' : 'Clear', () => { if (readOnly || !picked.length) return; picked = []; play('pop'); changed(prompt()); }, { icon: 'reset', variant: 'ghost' });
  if (!isStatic) {
    fr.el.insertBefore(status, fr.readouts);
    if (ruleList.length) fr.el.insertBefore(ruleRow, fr.readouts);
    fr.readouts.appendChild(roCount.el);
    fr.buttons.appendChild(clearBtn);
  }

  function prompt() {
    const st = getState();
    if (rule) {
      if (st.full) return `${RULES[rule].name}: no further meeting fits. ${st.count} booked.`;
      return `${RULES[rule].name}: of the meetings that still fit, book the one that is ${RULES[rule].word}.`;
    }
    if (st.full && st.count) return `${st.count} booked, and nothing else fits. Tap a booked meeting to take it out again.`;
    return st.count ? `${st.count} booked. Tap another meeting, or a booked one to take it out.` : 'Tap a meeting to book it.';
  }

  function render() {
    const st = getState();
    const free = new Set(freeOf(meetings, picked).map((m) => m.id));
    for (const m of meetings) {
      const el = bars[m.id];
      const isPicked = picked.includes(m.id);
      const blocked = !isPicked && !free.has(m.id);
      el.rect.setAttribute('fill', isPicked ? hue('green') : blocked ? 'var(--sunken)' : hue('blue', 'soft'));
      el.rect.setAttribute('stroke', isPicked ? 'var(--edge-strong)' : blocked ? 'var(--ink-3)' : 'var(--ink)');
      el.rect.setAttribute('stroke-dasharray', blocked ? '5 4' : 'none');
      el.rect.setAttribute('opacity', blocked ? 0.65 : 1);
      el.tick.setAttribute('visibility', isPicked ? 'visible' : 'hidden');
      if (!isStatic) {
        el.g.classList.toggle('is-tap', !readOnly);
        el.g.setAttribute('tabindex', readOnly ? '-1' : '0');
        el.g.setAttribute('aria-pressed', String(isPicked));
        el.g.setAttribute('aria-label', `Meeting ${m.id}, ${clock(m.start)} to ${clock(m.end)}, ${lengthText(m)}${isPicked ? ', booked' : blocked ? ', overlaps a booked meeting' : ''}`);
      }
    }
    roCount.set(st.count);
    ruleBtns.forEach((b, i) => {
      const id = ruleList[i];
      b.classList.toggle('is-on', id === rule);
      b.setAttribute('aria-pressed', String(id === rule));
      b.lastChild.textContent = id in results ? `${RULES[id].name}: ${results[id]}` : RULES[id].name;
    });
    clearBtn.disabled = readOnly || !picked.length;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Meetings: ${meetings.map((m) => `${m.id} ${clock(m.start)} to ${clock(m.end)}`).join(', ')}. Booked: ${picked.join(', ') || 'none'}.`);
  }

  function changed(text, tone = '') {
    if (rule && ruleList.length && getState().full) results[rule] = picked.length;
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function refuse(id, text) {
    const g = bars[id].g;
    g.classList.remove('is-nope');
    void g.getBoundingClientRect();
    g.classList.add('is-nope');
    play('wrong');
    setStatus(text, 'bad');
    env.announce(text);
  }

  function tap(id) {
    if (readOnly || isStatic) return;
    const m = byId(id);
    if (picked.includes(id)) {
      if (rule) { refuse(id, `${id} is booked. A greedy rule never takes a choice back. Press "Start again" to run the rule afresh.`); return; }
      picked = picked.filter((x) => x !== id);
      play('pop');
      changed(prompt());
      return;
    }
    const clash = picked.find((other) => overlap(byId(other), m));
    if (clash) { refuse(id, `${id} (${clock(m.start)}–${clock(m.end)}) overlaps ${clash}, which is booked.`); return; }
    if (rule) {
      const allowed = ruleChoices(meetings, picked, rule);
      if (!allowed.includes(id)) {
        const told = rule === 'shortest' ? `${id} lasts ${lengthText(m)}. A shorter meeting still fits.`
          : rule === 'start' ? `${id} starts at ${clock(m.start)}. A meeting that still fits starts earlier.`
            : `${id} finishes at ${clock(m.end)}. A meeting that still fits finishes earlier.`;
        refuse(id, told);
        return;
      }
    }
    picked.push(id);
    play('drop');
    const after = getState();
    changed(rule || after.full ? prompt() : `Booked ${id}: ${clock(m.start)}–${clock(m.end)}. ${prompt()}`, rule && after.full ? 'good' : '');
  }

  render();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.ran)) {
        for (const id of next.ran) if (RULES[id] && ruleList.includes(id)) { rule = id; picked = runRule(meetings, id); results[id] = picked.length; }
      }
      if (next.rule && RULES[next.rule] && (ruleList.includes(next.rule) || spec.rule === next.rule)) { if (rule !== next.rule) picked = []; rule = next.rule; }
      if (Array.isArray(next.picked)) picked = place(next.picked);
      render();
      setStatus(prompt(), rule && getState().full ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

const DEMO = [
  { id: 'A', start: 12, end: 12.5 }, { id: 'B', start: 13.5, end: 17 }, { id: 'C', start: 15.5, end: 17.5 }, { id: 'D', start: 11, end: 12 },
  { id: 'E', start: 10, end: 13 }, { id: 'F', start: 12.5, end: 15 }, { id: 'G', start: 9.5, end: 14 }, { id: 'H', start: 14.5, end: 16 },
];

export const examples = [
  { title: 'meeting-picker — book as many as you can', spec: { type: 'meeting-picker', meetings: DEMO, from: 9, to: 18 } },
  { title: 'meeting-picker — three greedy rules to compare', spec: { type: 'meeting-picker', meetings: DEMO, from: 9, to: 18, rules: ['shortest', 'start', 'finish'] } },
];
