/**
 * `order` — arrange items into the correct sequence (also used for
 * Parsons problems: put shuffled lines of code in order).
 */
import { h, cx } from '../../core/dom.js';
import { icon } from '../../ui/icon.js';
import { highlight } from '../../core/highlight.js';
import { mdSpan, shuffledOrder } from '../ui.js';
import { sortable } from '../sortable.js';

export default function order(step, env) {
  const n = step.items.length;
  const perm = shuffledOrder(n, env.rng);
  const lang = step.code === true ? 'python' : step.code;
  const list = h('ol', { class: cx('sort-list', step.code && 'is-code'), 'aria-label': 'Put these in order. Drag, or tap one then tap its new position, or use the arrow keys.' });

  const els = perm.map((idx) => {
    const body = step.code
      ? h('code.sort-code', { html: highlight(step.items[idx], lang) })
      : mdSpan(step.items[idx], 'sort-text');
    const li = h('li.sort-item', { tabindex: '0', 'data-sort-item': '', dataset: { idx } },
      h('span.sort-grip', { 'aria-hidden': 'true' }, icon('grip', 18)),
      body,
      h('span.sort-mark', { 'aria-hidden': 'true' }),
    );
    list.appendChild(li);
    return li;
  });

  const clearMarks = () => els.forEach((el) => { el.classList.remove('is-right', 'is-wrong'); el.querySelector('.sort-mark').textContent = ''; });
  const sorter = sortable(list, { onChange: () => { clearMarks(); env.onReady(true); } });
  const current = () => Array.from(list.children).map((el) => Number(el.dataset.idx));

  // Items with identical text are interchangeable.
  const rightAt = (pos, idx) => step.items[idx] === step.items[pos];

  function markAll() {
    let right = 0;
    Array.from(list.children).forEach((el, pos) => {
      const ok = rightAt(pos, Number(el.dataset.idx));
      el.classList.toggle('is-right', ok);
      el.classList.toggle('is-wrong', !ok);
      const slot = el.querySelector('.sort-mark');
      slot.textContent = '';
      slot.appendChild(icon(ok ? 'check' : 'x', { size: 18, stroke: 3 }));
      if (ok) right++;
    });
    return right;
  }

  setTimeout(() => env.onReady(true), 0);

  const labels = Array.isArray(step.labels) ? step.labels : null;
  return {
    el: h('div',
      labels ? h('div.sort-label', labels[0]) : null,
      list,
      labels ? h('div.sort-label', labels[1]) : null,
    ),
    check() {
      const right = markAll();
      if (right === n) return { correct: true };
      return { correct: false, message: right === 0 ? 'None of these are in the right place yet.' : `${right} of ${n} are in the right place.` };
    },
    retry() { /* keep the marks until the learner moves something */ },
    reveal() {
      const byIdx = new Map(els.map((el) => [Number(el.dataset.idx), el]));
      for (let i = 0; i < n; i++) list.appendChild(byIdx.get(i));
      markAll();
    },
    lock() { sorter.setDisabled(true); },
    solve() {
      const byIdx = new Map(els.map((el) => [Number(el.dataset.idx), el]));
      for (let i = 0; i < n; i++) list.appendChild(byIdx.get(i));
    },
    order: current,
    destroy() { sorter.destroy(); },
  };
}
