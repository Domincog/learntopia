/**
 * dialogue — a short conversation between two example people. One of them is
 * having a hard time; the learner chooses, turn by turn, what the other one
 * says, and sees how each reply lands. For practising how to listen and how
 * to support someone, without asking the learner anything about themselves.
 *
 * {
 *   type: 'dialogue',
 *   people: { a: 'Idris', b: 'Noor' },          // a speaks first and is being supported; the learner chooses b's lines
 *   opening: ['"I am fine. Just tired."'],      // a's first line(s)
 *   turns: [
 *     { options: [
 *         { id: 'ask', text: '"What has it been like?"', good: true,
 *           reply: '"Flat. Nothing is fun any more."',            // what a says back
 *           note: 'An open question, taken seriously.' },         // one line on why the reply landed as it did
 *         { id: 'cheer', text: '"Come on, cheer up!"', reply: '"Yeah. Forget I said anything."', note: 'It tells him his feelings are wrong.' },
 *       ] },
 *     …
 *   ],
 * }
 *
 * State: { picks, turn, done, good, allGood }
 *   picks    the id chosen at each turn so far
 *   turn     how many turns have been answered
 *   done     every turn has been answered
 *   good     how many of the chosen replies were marked good
 *   allGood  done, and every chosen reply was good
 *
 * setState accepts { picks: ['ask', …] }.
 *
 * Options are shown in the order written: vary where the good one stands. The conversation always goes on
 * to the next turn, whatever was chosen, so that the learner sees the consequence; "Start again" replays it.
 */
import { h, cx, button, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('dialogue', `
  .widget-dialogue { display: grid; gap: var(--s2); width: 100%; max-width: 560px; margin-inline: auto; }
  .widget-dialogue .dg-log { display: grid; gap: 6px; max-height: 250px; overflow-y: auto; padding: 8px; border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); }
  .widget-dialogue .dg-line { max-width: 86%; padding: 5px 10px; border: var(--bw) solid var(--edge); border-radius: 14px; font-size: var(--fs-sm); line-height: 1.35; }
  .widget-dialogue .dg-line b { display: block; font-size: var(--fs-xs); letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-3); }
  .widget-dialogue .dg-a { justify-self: start; background: var(--yellow-soft); border-bottom-left-radius: 4px; }
  .widget-dialogue .dg-b { justify-self: end; background: var(--blue-soft); border-bottom-right-radius: 4px; }
  .widget-dialogue .dg-note { justify-self: center; max-width: 94%; font-size: var(--fs-xs); font-weight: 700; color: var(--ink-2); text-align: center; padding: 2px 8px; border-radius: 999px; background: var(--sunken); }
  .widget-dialogue .dg-note.is-good::before { content: '✓ '; }
  .widget-dialogue .dg-note.is-bad::before { content: '✗ '; }
  .widget-dialogue .dg-ask { font-size: var(--fs-sm); font-weight: 800; margin: 0; }
  .widget-dialogue .dg-options { display: grid; gap: 6px; }
  .widget-dialogue .dg-options button { text-align: left; min-height: 40px; padding: 6px 10px; border: var(--bw) solid var(--edge); border-radius: var(--r-sm); background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); line-height: 1.3; cursor: pointer; box-shadow: var(--shadow-sm); }
  .widget-dialogue .dg-options button:disabled { cursor: default; box-shadow: none; }
  .widget-dialogue .dg-end { font-size: var(--fs-sm); color: var(--ink-2); margin: 0; text-align: center; }
  .widget-dialogue .dg-foot { display: flex; justify-content: center; }
`);

export default function create(spec, env) {
  const people = { a: 'A', b: 'B', ...(spec.people || {}) };
  const turns = (spec.turns || []).map((t) => ({ ...t, options: (t.options || []).map((o, i) => ({ id: `o${i + 1}`, ...o })) }));
  let picks = [];
  let readOnly = !!env.readOnly;

  const optionOf = (i) => turns[i].options.find((o) => o.id === picks[i]) || null;
  function getState() {
    const chosen = picks.map((_, i) => optionOf(i));
    const good = chosen.filter((o) => o && o.good).length;
    const done = picks.length >= turns.length;
    return { picks: picks.slice(), turn: picks.length, done, good, allGood: done && good === turns.length };
  }

  const log = h('div.dg-log', { role: 'log', 'aria-live': 'polite', 'aria-label': `Conversation between ${people.a} and ${people.b}`, tabindex: '0' });
  const ask = h('p.dg-ask');
  const options = h('div.dg-options');
  const end = h('p.dg-end');
  const resetBtn = button('Start again', () => { if (readOnly) return; picks = []; render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
  const el = h('div', { class: cx(env.compact && 'is-compact') }, log, ask, options, end, h('div.dg-foot', resetBtn));

  const line = (who, text) => h('div', { class: `dg-line dg-${who}` }, h('b', people[who]), h('span', { html: mdInline(text) }));

  function render() {
    log.replaceChildren();
    for (const text of spec.opening || []) log.appendChild(line('a', text));
    picks.forEach((_, i) => {
      const o = optionOf(i);
      if (!o) return;
      log.appendChild(line('b', o.text));
      if (o.note) log.appendChild(h('div', { class: `dg-note ${o.good ? 'is-good' : 'is-bad'}` }, o.note));
      if (o.reply) log.appendChild(line('a', o.reply));
    });
    const st = getState();
    options.replaceChildren();
    if (!st.done && !env.compact) {
      ask.textContent = `What does ${people.b} say? (${picks.length + 1} of ${turns.length})`;
      for (const o of turns[picks.length].options) {
        const b = h('button', { type: 'button', html: mdInline(o.text) });
        b.disabled = readOnly;
        b.addEventListener('click', () => {
          if (readOnly) return;
          picks.push(o.id);
          play('select');
          render();
          env.announce(`${people.b}: ${o.text} ${o.note || ''} ${people.a}: ${o.reply || ''}`);
          env.onChange(getState());
        });
        options.appendChild(b);
      }
      end.textContent = '';
    } else {
      ask.textContent = '';
      end.textContent = st.done ? (st.allGood ? `${people.a} felt heard at every turn.` : `${st.good} of ${turns.length} replies kept the conversation open.`) : '';
    }
    resetBtn.disabled = readOnly || !picks.length;
    log.scrollTop = log.scrollHeight;
  }
  render();

  return {
    el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.picks)) return;
      picks = [];
      next.picks.slice(0, turns.length).forEach((id, i) => { if (turns[i].options.some((o) => o.id === id)) picks.push(id); });
      render();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  {
    title: 'dialogue — choosing what to say',
    spec: {
      type: 'dialogue', people: { a: 'Idris', b: 'Noor' },
      opening: ['"I am fine. Just tired. I have been tired for about two months, to be honest."'],
      turns: [
        { options: [
          { id: 'cheer', text: '"Come on, cheer up! You have so much going for you."', reply: '"Yeah. I know. Forget I said anything."', note: 'Meant kindly, but it tells him his feelings are wrong.' },
          { id: 'ask', text: '"Two months is a long time. What has it been like?"', good: true, reply: '"Flat. Nothing is fun any more."', note: 'An open question, taken seriously.' },
        ] },
      ],
    },
  },
];
