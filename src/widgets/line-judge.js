/**
 * line-judge — Solomon Asch's line-judgement task as a demonstration. On each
 * round a standard line and three comparison lines (A, B, C) are shown, and
 * the learner says which comparison line matches the standard. Five scripted
 * "other participants" answer first, one after another, and on some rounds
 * they all give the same wrong answer. With `ally`, one of them gives the
 * right answer on those rounds, as in Asch's "partner" variation.
 *
 * At the end the widget says plainly that the others were scripted and lists,
 * round by round, the right answer, what the others said and what the learner
 * said. It draws no conclusion about the learner: on a screen, with drawn
 * "participants", nothing like the pressure of Asch's room exists.
 *
 * {
 *   type: 'line-judge',
 *   rounds: [                                  // optional; six rounds by default, three of them "critical"
 *     { standard: 150, lines: [110, 150, 190], group: null },   // group: null → the others answer correctly
 *     { standard: 170, lines: [140, 200, 170], group: 0 },      // group: 0 → the others all say "A"
 *   ],
 *   others: 5,                                 // how many scripted participants (3 to 6)
 *   ally: false,                               // true: the fourth of them answers correctly on critical rounds
 * }
 *
 * State: { round, done, answers, critical, withGroup, right, ally }
 *   round      index of the round in progress (= rounds finished) · done: all rounds finished
 *   answers    the learner's answer on each finished round: 0, 1 or 2
 *   critical   how many rounds the others get wrong · withGroup: on how many of those the learner gave the others' answer
 *   right      how many of the learner's answers were correct
 * Use `check: (s) => s.done`. setState({ done: true, answers: [1, 0, 2] }) shows the end
 * (rounds without an answer are filled in with the correct one).
 */
import { frame, hue, s, h, cx, addStyles, clamp } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('line-judge', `
  .widget-line-judge .lj-head { margin: 0; text-align: center; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
  .widget-line-judge .lj-people { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .widget-line-judge .lj-person { min-width: 46px; padding: 4px 6px; border: 2px solid var(--edge); border-radius: var(--r); background: var(--paper); text-align: center; font-size: var(--fs-xs); font-weight: 700; color: var(--ink-2); line-height: 1.2; }
  .widget-line-judge .lj-person b { display: block; font-size: var(--fs-md); color: var(--ink); min-height: 1.3em; }
  .widget-line-judge .lj-person.is-you { border-color: var(--blue); background: var(--blue-soft); }
  .widget-line-judge .lj-answers { display: flex; gap: var(--s2); justify-content: center; }
  .widget-line-judge .lj-answers .btn { min-width: 56px; min-height: 44px; font-size: var(--fs-md); }
  .widget-line-judge .lj-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 1.4em; text-wrap: balance; }
  .widget-line-judge .lj-table { margin: 0 auto; border-collapse: collapse; font-size: var(--fs-sm); }
  .widget-line-judge .lj-table th, .widget-line-judge .lj-table td { padding: 3px 10px; border-bottom: 1px solid var(--hair); text-align: center; }
  .widget-line-judge .lj-table th { font-size: var(--fs-xs); color: var(--ink-2); }
  .widget-line-judge .lj-table tr.is-critical td { background: var(--orange-soft); font-weight: 700; }
`);

const W = 520;
const H = 250;
const LETTERS = ['A', 'B', 'C'];
const DEFAULT_ROUNDS = [
  { standard: 150, lines: [110, 150, 190], group: null },
  { standard: 120, lines: [120, 170, 90], group: null },
  { standard: 170, lines: [140, 200, 170], group: 0 },
  { standard: 100, lines: [130, 100, 160], group: null },
  { standard: 160, lines: [160, 125, 195], group: 2 },
  { standard: 130, lines: [165, 105, 130], group: 0 },
];

export default function create(spec, env) {
  const rounds = (Array.isArray(spec.rounds) && spec.rounds.length ? spec.rounds : DEFAULT_ROUNDS).map((r) => {
    const correct = r.lines.indexOf(r.standard);
    return { standard: r.standard, lines: r.lines.slice(0, 3), correct, group: r.group == null || r.group === correct ? null : r.group };
  });
  const nOthers = clamp(Math.round(spec.others || 5), 3, 6);
  const ally = !!spec.ally;
  const allyAt = Math.min(3, nOthers - 1);
  const still = reducedMotion();
  let readOnly = !!env.readOnly;
  let round = 0;
  let answers = [];
  let spoken = 0; // how many of the others have answered in this round
  let timer = 0;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A standard line and three comparison lines' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const head = h('p.lj-head');
  const people = h('div.lj-people');
  const note = h('p.lj-note', { 'aria-live': 'polite' });
  const answerRow = h('div.lj-answers', { role: 'group', 'aria-label': 'Your answer' });
  const summary = h('div');
  fr.el.insertBefore(head, fr.canvas);
  fr.el.append(people, note, answerRow, summary);

  const says = (r, i) => (r.group == null || (ally && i === allyAt) ? r.correct : r.group);
  const done = () => round >= rounds.length;
  const getState = () => {
    const crit = rounds.map((r, i) => (r.group != null ? i : -1)).filter((i) => i >= 0);
    return {
      round, done: done(), answers: answers.slice(), critical: crit.length,
      withGroup: crit.filter((i) => answers[i] != null && answers[i] === rounds[i].group).length,
      right: answers.filter((a, i) => a === rounds[i].correct).length, ally,
    };
  };

  const buttons = LETTERS.map((letter, i) => {
    const b = h('button.btn', { type: 'button' }, letter);
    b.addEventListener('click', () => {
      if (readOnly || done() || spoken < nOthers) return;
      answers[round] = i;
      round++;
      play('select');
      start();
      env.onChange(getState());
    });
    answerRow.append(b);
    return b;
  });

  function drawLines(r) {
    g.replaceChildren();
    const base = 214;
    const card = (x, w) => s('rect', { x, y: 8, width: w, height: H - 16, rx: 10, fill: 'var(--paper)', stroke: 'var(--hair)', 'stroke-width': 2 });
    g.append(card(16, 150), card(196, 308));
    const bar = (x, len, color = 'var(--ink)') => s('line', { x1: x, x2: x, y1: base, y2: base - len, stroke: color, 'stroke-width': 6, 'stroke-linecap': 'butt' });
    g.append(bar(91, r.standard, hue('blue')), s('text', { class: 'fig-label-sm', x: 91, y: base + 20, 'text-anchor': 'middle' }, 'standard'));
    r.lines.forEach((len, i) => {
      const x = 270 + i * 80;
      g.append(bar(x, len), s('text', { class: 'fig-label', x, y: base + 22, 'text-anchor': 'middle' }, LETTERS[i]));
    });
    svg.setAttribute('aria-label', `The standard line is ${r.standard} units long. Line A: ${r.lines[0]}. Line B: ${r.lines[1]}. Line C: ${r.lines[2]}.`);
  }

  function drawPeople(r) {
    people.replaceChildren();
    for (let i = 0; i < nOthers; i++) people.append(h('div.lj-person', `no. ${i + 1}`, h('b', i < spoken ? LETTERS[says(r, i)] : '…')));
    people.append(h('div', { class: cx('lj-person', 'is-you') }, 'you', h('b', '?')));
    const ready = spoken >= nOthers;
    for (const b of buttons) b.disabled = readOnly || !ready;
    note.textContent = ready ? 'Your turn: which line matches the standard?' : 'The others answer first, in turn…';
  }

  function speak(r) {
    if (spoken >= nOthers) return;
    spoken++;
    drawPeople(r);
    if (spoken >= nOthers) {
      env.announce(`The others said: ${Array.from({ length: nOthers }, (_, i) => LETTERS[says(r, i)]).join(', ')}. Your turn.`);
      return;
    }
    timer = setTimeout(() => speak(r), 480);
  }

  function start() {
    clearTimeout(timer);
    if (done()) { finish(); return; }
    const r = rounds[round];
    head.textContent = `Round ${round + 1} of ${rounds.length}`;
    spoken = still ? nOthers - 1 : 0;
    drawLines(r);
    drawPeople(r);
    timer = setTimeout(() => speak(r), still ? 10 : 600);
  }

  function finish() {
    clearTimeout(timer);
    head.textContent = 'What was going on';
    drawLines(rounds[rounds.length - 1]);
    people.replaceChildren();
    answerRow.hidden = true;
    const st = getState();
    const rows = rounds.map((r, i) => h('tr', { class: r.group != null ? 'is-critical' : '' },
      h('td', String(i + 1)), h('td', LETTERS[r.correct]), h('td', r.group != null ? `${LETTERS[r.group]} (wrong)` : LETTERS[r.correct]), h('td', LETTERS[answers[i]])));
    summary.replaceChildren(h('table.lj-table',
      h('thead', h('tr', h('th', 'Round'), h('th', 'Right answer'), h('th', 'The others said'), h('th', 'You said'))),
      h('tbody', rows)));
    note.textContent = `The other ${nOthers} were scripted. On ${st.critical} round${st.critical === 1 ? '' : 's'} they gave the same wrong answer on purpose${ally ? `, except no. ${allyAt + 1}, who was scripted to give the right one` : ''}.`;
    env.announce(note.textContent);
  }

  start();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.answers)) answers = next.answers.slice(0, rounds.length).map((a) => clamp(Math.round(a), 0, 2));
      if (next.done) { for (let i = 0; i < rounds.length; i++) if (answers[i] == null) answers[i] = rounds[i].correct; round = rounds.length; }
      else round = Math.min(answers.length, rounds.length);
      start();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (!done()) for (const b of buttons) b.disabled = readOnly || spoken < nOthers; },
    destroy() { clearTimeout(timer); },
  };
}

export const examples = [
  { title: 'line-judge — six rounds', spec: { type: 'line-judge' } },
  { title: 'line-judge — with one partner', spec: { type: 'line-judge', ally: true, rounds: [{ standard: 150, lines: [110, 150, 190], group: null }, { standard: 170, lines: [140, 200, 170], group: 0 }, { standard: 130, lines: [165, 105, 130], group: 0 }] } },
];
