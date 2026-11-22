/** `match` — pair each item on the left with its partner. */
import { h } from '../../core/dom.js';
import { mdText } from '../../core/markdown.js';
import { mdSpan, spokenName } from '../ui.js';
import { chipBoard } from '../chips.js';

export default function match(step, env) {
  const n = step.pairs.length;
  const pool = h('div.chip-pool', { 'aria-label': 'Answers to place' });
  const zones = [{ id: 'pool', el: pool, capacity: Infinity, label: 'the answer pool' }];
  const rows = step.pairs.map(([left], i) => {
    const spoken = mdText(left);
    const slot = h('div.match-slot', { 'aria-label': `Answer for ${spoken}` });
    zones.push({ id: `slot${i}`, el: slot, capacity: 1, label: spoken });
    return h('div.match-row', h('div.match-left', mdSpan(left)), h('span.match-arrow', { 'aria-hidden': 'true' }, '→'), slot);
  });
  const chips = env.rng.shuffle(step.pairs.map((_, i) => i)).map((i) => ({
    id: `c${i}`,
    pair: i,
    el: h('button.chip-token', { type: 'button', 'aria-label': spokenName(step.pairs[i][1]) }, mdSpan(step.pairs[i][1])),
  }));
  const board = chipBoard({ zones, chips, home: 'pool', onChange: () => { clearMarks(); env.onReady(board.allPlaced()); } });

  const chipInSlot = (i) => {
    const id = board.chipsIn(`slot${i}`)[0];
    return id ? chips.find((c) => c.id === id) : null;
  };
  const rightIn = (i) => {
    const chip = chipInSlot(i);
    return !!chip && step.pairs[chip.pair][1] === step.pairs[i][1];
  };
  function clearMarks() { chips.forEach((c) => c.el.classList.remove('is-right', 'is-wrong')); }

  return {
    el: h('div.match', h('div.match-rows', rows), pool,
      h('p.step-instruction', 'Drag each answer to its partner — or tap an answer, then tap a slot.')),
    check() {
      let right = 0;
      for (let i = 0; i < n; i++) {
        const chip = chipInSlot(i);
        const ok = rightIn(i);
        if (chip) chip.el.classList.add(ok ? 'is-right' : 'is-wrong');
        if (ok) right++;
      }
      if (right === n) return { correct: true };
      return { correct: false, message: `${right} of ${n} matched correctly.` };
    },
    retry() {
      for (let i = 0; i < n; i++) {
        const chip = chipInSlot(i);
        if (chip && !rightIn(i)) board.place(chip.id, 'pool');
      }
      clearMarks();
      env.onReady(board.allPlaced());
    },
    reveal() {
      // free every slot, then drop each partner where it belongs
      chips.forEach((c) => board.place(c.id, 'pool'));
      const used = new Set();
      for (let i = 0; i < n; i++) {
        const chip = chips.find((c) => !used.has(c.id) && step.pairs[c.pair][1] === step.pairs[i][1]);
        used.add(chip.id);
        board.place(chip.id, `slot${i}`);
        chip.el.classList.add('is-right');
      }
    },
    lock() { board.lock(); },
    solve() { chips.forEach((c) => board.place(c.id, 'pool')); chips.forEach((c) => board.place(c.id, `slot${c.pair}`)); env.onReady(true); },
    destroy() { board.destroy(); },
  };
}
