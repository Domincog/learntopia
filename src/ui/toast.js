/** Lightweight toasts for achievements, streaks and status messages. */
import { h } from '../core/dom.js';
import { icon } from './icon.js';

const queue = [];
let showing = 0;
const MAX_VISIBLE = 2;

function show(item) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  showing++;
  const el = h('div', { class: `toast hue-${item.hue || 'orange'}` },
    item.icon ? h('div.toast-icon', icon(item.icon, 18)) : null,
    h('div',
      item.title ? h('div.toast-title', item.title) : null,
      item.body ? h('div.toast-body', item.body) : null,
    ),
  );
  root.appendChild(el);
  const remove = () => {
    el.classList.add('is-leaving');
    setTimeout(() => {
      el.remove();
      showing--;
      if (queue.length) show(queue.shift());
    }, 260);
  };
  const timer = setTimeout(remove, item.duration || 3600);
  el.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

/**
 * @param {{ title?: string, body?: string, icon?: string, hue?: string, duration?: number }|string} item
 */
export function toast(item) {
  const t = typeof item === 'string' ? { title: item } : item;
  if (showing >= MAX_VISIBLE) queue.push(t);
  else show(t);
}
