/**
 * wason-cards — a row of two-sided cards and a rule about them (the Wason
 * selection task). The learner picks the cards they would turn over to test
 * the rule. When the step is resolved, every card flips and shows its back.
 *
 * {
 *   type: 'wason-cards',
 *   rule: 'If a card has a vowel on one side, it has an even number on the other.',   // markdown allowed
 *   cards: [
 *     { front: 'A', back: '6', note: 'A vowel with an even number. The rule holds.' },
 *     { front: 'K', back: '3', note: 'The rule says nothing about consonants.' },
 *     { front: '4', back: 'K', note: 'The rule never said even numbers need a vowel.' },
 *     { front: '7', back: 'E', note: 'A vowel with an odd number!', breaks: true },
 *   ],
 *   reveal: 'lock',      // when the backs are shown: 'lock' (once the step is resolved), 'always' or 'never'
 *   static: false,       // true: picture only
 * }
 *
 * A face is a string or { text, sub } (sub: a small caption such as "age").
 * `note` is shown beside the card once it has been turned; `breaks: true`
 * marks a card whose hidden side breaks the rule.
 *
 * State: { selected: [0, 3], count: 2, revealed: false }
 *   selected — indices of the cards chosen, in ascending order
 *
 * setState accepts { selected: [0, 3] }. If the learner had chosen
 * differently before, their own picks stay marked ("your pick") after the reveal.
 */
import { h, cx, addStyles, mdInline, icon } from './kit.js';
import { play } from '../core/audio.js';

addStyles('wason-cards', `
  .widget-wason-cards.w-frame { gap: var(--s4); }
  .widget-wason-cards .wc-rule {
    padding: var(--s3) var(--s4); border: var(--bw) solid var(--violet); border-radius: var(--r-lg);
    background: var(--violet-soft); font-size: var(--fs-lg); font-weight: 700; line-height: 1.35; text-align: center; text-wrap: balance;
  }
  .widget-wason-cards .wc-rule-head { display: block; margin-bottom: 2px; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; color: var(--violet-text); }
  .widget-wason-cards .wc-row { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 108px)); justify-content: center; gap: var(--s3); padding-top: 10px; }
  .widget-wason-cards .wc-slot { display: grid; gap: var(--s2); justify-items: center; align-content: start; min-width: 0; }
  .widget-wason-cards .wc-card {
    position: relative; width: 100%; aspect-ratio: 5 / 7; padding: 0; border: 0; background: none; color: var(--ink);
    perspective: 700px; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transition: transform 0.15s var(--ease-spring);
  }
  .widget-wason-cards .wc-card.is-selected { transform: translateY(-10px); }
  .widget-wason-cards .wc-inner { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 0.55s var(--ease-out); transition-delay: calc(var(--i) * 110ms); }
  .widget-wason-cards .wc-card.is-flipped .wc-inner { transform: rotateY(180deg); }
  .widget-wason-cards .wc-face {
    position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 2px;
    border: var(--bw) solid var(--edge); border-radius: 14px; background: var(--surface);
    box-shadow: 3px 3px 0 var(--drop); backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden;
  }
  .widget-wason-cards .wc-face.is-back { transform: rotateY(180deg); background: var(--yellow-soft); }
  .widget-wason-cards .wc-card.is-selected .wc-face { border-color: var(--blue); box-shadow: 3px 3px 0 var(--blue); }
  .widget-wason-cards .wc-card.is-selected .wc-face.is-front { background: var(--blue-soft); }
  .widget-wason-cards .wc-card.is-breaking .wc-face.is-back { background: var(--red-soft); border-color: var(--red); box-shadow: 3px 3px 0 var(--red); }
  .widget-wason-cards .wc-text { font-family: var(--font-display); font-variation-settings: 'SOFT' 100; font-weight: 750; line-height: 1; font-size: 2.6rem; }
  .widget-wason-cards .wc-text.is-word { font-size: 1.35rem; }
  .widget-wason-cards .wc-text.is-long { font-size: 1.05rem; }
  .widget-wason-cards .wc-sub { font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); letter-spacing: 0.04em; }
  .widget-wason-cards .wc-corner { position: absolute; top: 6px; left: 8px; font-size: var(--fs-xs); font-weight: 800; color: var(--ink-3); }
  .widget-wason-cards .wc-tag {
    display: inline-flex; align-items: center; gap: 0.25rem; min-height: 1.6em; padding: 0.05rem 0.5rem; border-radius: 999px;
    font-size: var(--fs-xs); font-weight: 800; white-space: nowrap; color: var(--ink-3);
  }
  .widget-wason-cards .wc-tag[data-kind='turn'] { background: var(--blue-soft); color: var(--blue-text); }
  .widget-wason-cards .wc-tag[data-kind='needed'] { background: var(--green-soft); color: var(--green-text); }
  .widget-wason-cards .wc-tag[data-kind='extra'] { background: var(--gray-soft); color: var(--gray-text); }
  .widget-wason-cards .wc-notes { list-style: none; display: grid; gap: var(--s2); }
  .widget-wason-cards .wc-note { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--s3); padding: var(--s2) var(--s3); border: var(--bw) solid var(--hair); border-radius: var(--r); background: var(--surface); font-size: var(--fs-md); line-height: 1.35; }
  .widget-wason-cards .wc-note.is-breaking { border-color: var(--red); background: var(--red-soft); }
  .widget-wason-cards .wc-pair { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 800; white-space: nowrap; }
  .widget-wason-cards .wc-pair span { display: inline-grid; place-items: center; min-width: 2em; padding: 0.1rem 0.4rem; border: var(--bw) solid var(--edge); border-radius: 8px; background: var(--surface); }
  .widget-wason-cards .wc-pair span + span { background: var(--yellow-soft); }
  .widget-wason-cards.is-readonly .wc-card, .widget-wason-cards.is-static .wc-card { pointer-events: none; }
  @media (max-width: 480px) {
    .widget-wason-cards .wc-row { gap: var(--s2); }
    .widget-wason-cards .wc-text { font-size: 2.1rem; }
    .widget-wason-cards .wc-text.is-word { font-size: 1.05rem; }
    .widget-wason-cards .wc-text.is-long { font-size: 0.85rem; }
  }
`);

const faceOf = (f) => (f && typeof f === 'object' ? { text: String(f.text ?? ''), sub: f.sub || '' } : { text: String(f ?? ''), sub: '' });

function faceEl(face, kind, corner) {
  const len = face.text.length;
  return h('span', { class: `wc-face is-${kind}` },
    corner ? h('span.wc-corner', { 'aria-hidden': 'true' }, corner) : null,
    h('span', { class: cx('wc-text', len > 2 && 'is-word', len > 6 && 'is-long') }, face.text),
    face.sub ? h('span.wc-sub', face.sub) : null,
  );
}

export default function create(spec, env) {
  const cards = (spec.cards || []).map((c) => ({ ...c, front: faceOf(c.front), back: faceOf(c.back) }));
  const n = cards.length;
  const interactive = !spec.static && !env.compact;
  const revealMode = spec.reveal || 'lock';
  let readOnly = !!env.readOnly;
  let selected = new Set();
  let picked = null; // what the learner themselves last chose (kept when a solution is shown)
  let revealed = revealMode === 'always';

  const slots = cards.map((card, i) => {
    const btn = h(interactive ? 'button.wc-card' : 'span.wc-card', interactive ? { type: 'button', 'aria-pressed': 'false' } : { role: 'img' },
      h('span.wc-inner', { style: { '--i': i } },
        faceEl(card.front, 'front'),
        faceEl(card.back, 'back', `${card.front.text} ↻`),
      ));
    const tag = h('span.wc-tag');
    if (interactive) btn.addEventListener('click', () => toggle(i));
    return { btn, tag, el: h('div.wc-slot', btn, tag) };
  });
  const notes = h('ul.wc-notes', { hidden: true });
  const hint = h('p.w-hint', 'Tap a card to choose it. Tap again to put it back.');
  const root = h('div', { class: cx('w-frame', spec.static && 'is-static') },
    spec.rule && !env.compact ? h('div.wc-rule', h('span.wc-rule-head', 'The rule'), h('span', { html: mdInline(spec.rule) })) : null,
    h('div.wc-row', { style: { '--n': n }, role: 'group', 'aria-label': spec.alt || 'Cards' }, slots.map((s) => s.el)),
    notes,
    interactive ? hint : null,
  );

  function toggle(i) {
    if (readOnly || revealed) return;
    if (selected.has(i)) selected.delete(i); else selected.add(i);
    picked = new Set(selected);
    play(selected.has(i) ? 'select' : 'tap');
    render();
    env.onChange(getState());
  }

  function render() {
    const differs = picked && (picked.size !== selected.size || [...picked].some((i) => !selected.has(i)));
    slots.forEach((slot, i) => {
      const card = cards[i];
      const on = selected.has(i);
      slot.btn.classList.toggle('is-selected', on && !revealed);
      slot.btn.classList.toggle('is-flipped', revealed);
      slot.btn.classList.toggle('is-breaking', revealed && !!card.breaks);
      if (interactive) slot.btn.setAttribute('aria-pressed', String(on));
      slot.btn.setAttribute('aria-label', revealed
        ? `Card: ${card.front.text} on one side, ${card.back.text} on the other.`
        : `Card showing ${card.front.text}${card.front.sub ? ` (${card.front.sub})` : ''}. ${on ? 'Chosen.' : 'Not chosen.'}`);
      slot.tag.replaceChildren();
      slot.tag.removeAttribute('data-kind');
      if (!revealed) {
        if (on) { slot.tag.dataset.kind = 'turn'; slot.tag.append(icon('refresh', { size: 12, stroke: 3 }), 'turn over'); }
      } else if (revealMode === 'lock') {
        if (on) { slot.tag.dataset.kind = 'needed'; slot.tag.append(icon('check', { size: 12, stroke: 3.5 }), 'needed'); }
        else if (differs && picked.has(i)) { slot.tag.dataset.kind = 'extra'; slot.tag.append('your pick'); }
      }
    });
    hint.hidden = revealed;
    notes.hidden = !revealed || !cards.some((c) => c.note);
    if (!notes.hidden && !notes.childElementCount) {
      for (const card of cards) {
        if (!card.note) continue;
        notes.appendChild(h('li', { class: cx('wc-note', card.breaks && 'is-breaking') },
          h('span.wc-pair', h('span', card.front.text), h('span', card.back.text)),
          h('span', { html: mdInline(card.note) })));
      }
    }
  }

  const getState = () => ({ selected: [...selected].sort((a, b) => a - b), count: selected.size, revealed });

  render();
  if (readOnly) root.classList.add('is-readonly');

  return {
    el: root,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.selected)) return;
      selected = new Set(next.selected.filter((i) => Number.isInteger(i) && i >= 0 && i < n));
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      root.classList.toggle('is-readonly', readOnly);
      if (readOnly && revealMode === 'lock' && !revealed) {
        revealed = true;
        env.announce(`The cards are turned over. ${cards.map((c) => `${c.front.text}: ${c.back.text}`).join(', ')}.`);
      }
      render();
    },
  };
}

export const examples = [
  {
    title: 'wason-cards — which cards test the rule?',
    spec: {
      type: 'wason-cards',
      rule: 'If a card has a vowel on one side, it has an even number on the other.',
      cards: [
        { front: 'A', back: '6', note: 'A vowel with an even number. The rule holds.' },
        { front: 'K', back: '3', note: 'The rule says nothing about consonants.' },
        { front: '4', back: 'K', note: 'The rule never said that even numbers need a vowel.' },
        { front: '7', back: 'E', note: 'A vowel with an odd number. The rule is broken!', breaks: true },
      ],
    },
  },
];
