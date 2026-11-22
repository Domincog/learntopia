/** `bucket` — sort items into named groups. */
import { h } from '../../core/dom.js';
import { mdText } from '../../core/markdown.js';
import { mdSpan, spokenName } from '../ui.js';
import { chipBoard } from '../chips.js';

export default function bucket(step, env) {
  const pool = h('div.chip-pool', { 'aria-label': 'Items to sort' });
  const zones = [{ id: 'pool', el: pool, capacity: Infinity, label: 'the unsorted pile' }];
  const bucketEls = step.buckets.map((title, i) => {
    const body = h('div.bucket-body');
    const spoken = mdText(title);
    const el = h('div.bucket', { 'aria-label': `Group: ${spoken}` }, h('div.bucket-title', mdSpan(title)), body);
    zones.push({ id: `b${i}`, el, slot: body, capacity: Infinity, label: spoken });
    return el;
  });
  const chips = env.rng.shuffle(step.items.map((_, i) => i)).map((i) => ({
    id: `c${i}`,
    item: step.items[i],
    el: h('button.chip-token', { type: 'button', 'aria-label': spokenName(step.items[i].text) }, mdSpan(step.items[i].text)),
  }));
  const clearMarks = () => chips.forEach((c) => c.el.classList.remove('is-right', 'is-wrong'));
  const board = chipBoard({ zones, chips, home: 'pool', onChange: () => { clearMarks(); env.onReady(board.allPlaced()); } });
  const isRight = (c) => board.where(c.id) === `b${c.item.bucket}`;

  return {
    el: h('div.bucketing', pool,
      h('div.buckets', { style: { '--cols': Math.min(step.buckets.length, 4) } }, bucketEls),
      h('p.step-instruction', 'Drag each item into a group — or tap an item, then tap a group.')),
    check() {
      let right = 0;
      for (const c of chips) {
        const ok = isRight(c);
        c.el.classList.add(ok ? 'is-right' : 'is-wrong');
        if (ok) right++;
      }
      if (right === chips.length) return { correct: true };
      const firstWrong = chips.find((c) => !isRight(c));
      const why = firstWrong && firstWrong.item.why;
      return { correct: false, message: why || `${right} of ${chips.length} are in the right group.` };
    },
    retry() {
      for (const c of chips) if (!isRight(c)) board.place(c.id, 'pool');
      clearMarks();
      env.onReady(board.allPlaced());
    },
    reveal() {
      for (const c of chips) { board.place(c.id, `b${c.item.bucket}`); c.el.classList.remove('is-wrong'); c.el.classList.add('is-right'); }
    },
    lock() { board.lock(); },
    solve() { for (const c of chips) board.place(c.id, `b${c.item.bucket}`); env.onReady(true); },
    destroy() { board.destroy(); },
  };
}
