/**
 * thought-loop — the loop of situation → thought → feeling → action that
 * cognitive behavioural therapy is built on, for one example person. The
 * situation stays fixed; the learner chooses what the person tells
 * themselves, and the widget shows the feeling, the action and what happens
 * next that follow from that thought.
 *
 * {
 *   type: 'thought-loop',
 *   situation: 'Ana waves at a friend across the street. Her friend walks on without waving back.',
 *   ask: 'What does Ana tell herself?',
 *   thoughts: [
 *     { id: 'missed', text: '"She probably did not see me."',
 *       feeling: 'Calm, a little curious', level: 15,           // level: strength of the feeling, 0 to 100
 *       body: 'Nothing much',                                    // what the body does (optional)
 *       action: 'Sends her a message that evening',
 *       next: 'Her friend replies: "Sorry, I was miles away!"' },  // what happens next, feeding the next round
 *     …
 *   ],
 * }
 *
 * State: { thought, seen, seenCount, level }
 *   thought    id of the thought now chosen (null at the start)
 *   seen       ids of every thought looked at so far, in the order first chosen
 *   level      strength of the feeling that goes with the chosen thought (null at the start)
 *
 * setState accepts { thought } and/or { seen: [ids] }.
 *
 * The example people and their thoughts are written by the lesson. The widget never asks the learner
 * for thoughts or feelings of their own.
 */
import { h, cx, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('thought-loop', `
  .widget-thought-loop { display: grid; gap: 6px; width: 100%; max-width: 560px; margin-inline: auto; }
  .widget-thought-loop .tl-box { border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); padding: 6px 12px; }
  .widget-thought-loop .tl-tag { display: block; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
  .widget-thought-loop .tl-situation { background: var(--yellow-soft); }
  .widget-thought-loop .tl-choices { display: grid; gap: 6px; margin-top: 4px; }
  .widget-thought-loop .tl-choices button { text-align: left; min-height: 40px; padding: 5px 10px; border: var(--bw) solid var(--edge); border-radius: var(--r-sm); background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); line-height: 1.3; cursor: pointer; }
  .widget-thought-loop .tl-choices button[aria-pressed='true'] { background: var(--blue-soft); box-shadow: 0 0 0 2px var(--blue); font-weight: 700; }
  .widget-thought-loop .tl-choices button:disabled { cursor: default; opacity: 1; }
  .widget-thought-loop .tl-choices button.is-seen:not([aria-pressed='true']) { border-style: dashed; }
  .widget-thought-loop .tl-arrow { justify-self: center; font-weight: 800; color: var(--ink-3); line-height: 1; }
  .widget-thought-loop .tl-result { font-size: var(--fs-sm); line-height: 1.35; min-height: 1.4em; }
  .widget-thought-loop .tl-result.is-empty { color: var(--ink-3); }
  .widget-thought-loop .tl-feel { display: grid; grid-template-columns: minmax(0, 1fr) 120px; align-items: center; gap: 4px var(--s3); }
  .widget-thought-loop .tl-meter { height: 14px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); overflow: hidden; }
  .widget-thought-loop .tl-meter i { display: block; height: 100%; background: var(--orange); }
  .widget-thought-loop .tl-meterlabel { grid-column: 2; font-size: var(--fs-xs); color: var(--ink-3); text-align: right; font-weight: 700; }
  .widget-thought-loop .tl-back { font-size: var(--fs-xs); color: var(--ink-3); text-align: center; font-weight: 700; }
  .widget-thought-loop.is-compact .tl-choices, .widget-thought-loop.is-compact .tl-back { display: none; }
`);

export default function create(spec, env) {
  const thoughts = (spec.thoughts || []).map((t, i) => ({ id: `t${i + 1}`, level: 50, ...t }));
  const byId = (id) => thoughts.find((t) => t.id === id) || null;
  let chosen = spec.thought && byId(spec.thought) ? spec.thought : null;
  const seen = [];
  if (chosen) seen.push(chosen);
  let readOnly = !!env.readOnly;

  const getState = () => ({ thought: chosen, seen: seen.slice(), seenCount: seen.length, level: chosen ? byId(chosen).level : null });

  const buttons = thoughts.map((t) => {
    const b = h('button', { type: 'button', 'aria-pressed': 'false', html: mdInline(t.text) });
    b.addEventListener('click', () => {
      if (readOnly) return;
      chosen = t.id;
      if (!seen.includes(t.id)) seen.push(t.id);
      play('select');
      render();
      env.announce(`${t.feeling}. ${t.action}.`);
      env.onChange(getState());
    });
    return b;
  });
  const feelText = h('div.tl-result');
  const meterFill = h('i');
  const meter = h('div.tl-meter', { role: 'img' }, meterFill);
  const meterLabel = h('span.tl-meterlabel');
  const actionText = h('div.tl-result');
  const nextText = h('div.tl-result');
  const arrow = () => h('div.tl-arrow', { 'aria-hidden': 'true' }, '↓');

  const el = h('div', { class: cx(env.compact && 'is-compact'), role: 'group', 'aria-label': spec.alt || 'A loop of situation, thought, feeling and action' },
    h('div.tl-box.tl-situation', h('span.tl-tag', 'Situation'), h('div.tl-result', { html: mdInline(spec.situation || '') })),
    arrow(),
    h('div.tl-box', h('span.tl-tag', `Thought: ${spec.ask || 'what does the person tell themselves?'}`), h('div.tl-choices', buttons)),
    arrow(),
    h('div.tl-box', h('span.tl-tag', 'Feeling'), h('div.tl-feel', feelText, meter, meterLabel)),
    arrow(),
    h('div.tl-box', h('span.tl-tag', 'Action'), actionText),
    arrow(),
    h('div.tl-box', h('span.tl-tag', 'What happens next'), nextText),
    h('div.tl-back', '↺ …which becomes the next situation'),
  );

  function render() {
    const t = chosen ? byId(chosen) : null;
    buttons.forEach((b, i) => {
      b.setAttribute('aria-pressed', thoughts[i].id === chosen ? 'true' : 'false');
      b.classList.toggle('is-seen', seen.includes(thoughts[i].id));
      b.disabled = readOnly;
    });
    const set = (node, text) => {
      node.classList.toggle('is-empty', !text);
      node.innerHTML = text ? mdInline(text) : 'Choose a thought to see.';
    };
    set(feelText, t ? `**${t.feeling}**${t.body ? `. In the body: ${t.body.charAt(0).toLowerCase()}${t.body.slice(1)}.` : ''}` : '');
    set(actionText, t ? t.action : '');
    set(nextText, t ? t.next : '');
    meterFill.style.width = `${t ? t.level : 0}%`;
    meter.setAttribute('aria-label', t ? `Strength of the feeling: ${t.level} out of 100` : 'Strength of the feeling: not shown yet');
    meterLabel.textContent = t ? `strength ${t.level} / 100` : '';
  }
  render();

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.seen)) for (const id of next.seen) if (byId(id) && !seen.includes(id)) seen.push(id);
      if (next.thought !== undefined) {
        chosen = byId(next.thought) ? next.thought : null;
        if (chosen && !seen.includes(chosen)) seen.push(chosen);
      } else if (Array.isArray(next.seen) && next.seen.length && !chosen) {
        chosen = seen[seen.length - 1];
      }
      render();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  {
    title: 'thought-loop — one situation, three thoughts',
    spec: {
      type: 'thought-loop',
      situation: 'Ana waves at a friend across the street. Her friend walks on without waving back.',
      ask: 'what does Ana tell herself?',
      thoughts: [
        { id: 'upset', text: '"She saw me and ignored me. I must have upset her."', feeling: 'Hurt and worried', level: 80, body: 'A tight chest', action: 'Keeps away from her friend all week', next: 'With no contact, nothing can show the thought to be wrong.' },
        { id: 'missed', text: '"She probably did not see me."', feeling: 'Calm, a little curious', level: 15, body: 'Nothing much', action: 'Sends her a message that evening', next: 'Her friend replies: "Sorry, I was miles away!"' },
      ],
    },
  },
];
