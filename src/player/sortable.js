/**
 * Reorderable vertical list. Three equivalent ways to move an item, so it
 * works with a mouse, a finger, a keyboard and a screen reader:
 *   - drag it (by the grip on touch screens, anywhere with a mouse)
 *   - tap one item, then tap where it should go
 *   - focus an item and press ↑ / ↓
 *
 *   const s = sortable(listEl, { onChange: () => … });
 *   s.setDisabled(true); s.destroy();
 */
import { announce } from '../core/dom.js';
import { play } from '../core/audio.js';

export function sortable(listEl, { onChange = () => {}, handle = '.sort-grip' } = {}) {
  let disabled = false;
  let selected = null;
  let drag = null;

  const items = () => Array.from(listEl.children);

  function clearSelection() {
    if (selected) selected.classList.remove('is-selected');
    selected = null;
  }

  function moveTo(item, index, { silent = false } = {}) {
    const list = items().filter((el) => el !== item);
    const ref = list[index] || null;
    listEl.insertBefore(item, ref);
    if (!silent) {
      play('drop');
      announce(`Moved to position ${index + 1} of ${list.length + 1}`);
      onChange();
    }
  }

  function onPointerDown(ev) {
    if (disabled || ev.button > 0) return;
    const item = ev.target.closest('[data-sort-item]');
    if (!item || item.parentNode !== listEl) return;
    const onHandle = !!ev.target.closest(handle);
    if (ev.pointerType !== 'mouse' && !onHandle) return; // touch: body scrolls, grip drags
    const list = items();
    const startIndex = list.indexOf(item);
    const rects = list.map((el) => el.getBoundingClientRect());
    const gap = list.length > 1 ? rects[1].top - rects[0].bottom : 0;
    drag = {
      item, list, rects, startIndex, current: startIndex,
      startY: ev.clientY, size: rects[startIndex].height + gap, moved: false, pointerId: ev.pointerId,
    };
    try { item.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    if (onHandle) ev.preventDefault();
  }

  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const dy = ev.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.abs(dy) < 5) return;
      drag.moved = true;
      drag.item.classList.add('is-dragging');
      clearSelection();
    }
    ev.preventDefault();
    const { item, list, rects, startIndex, size } = drag;
    item.style.transform = `translateY(${dy}px)`;
    const center = rects[startIndex].top + rects[startIndex].height / 2 + dy;
    let idx = 0;
    list.forEach((el, i) => {
      if (i === startIndex) return;
      if (rects[i].top + rects[i].height / 2 < center) idx++;
    });
    drag.current = idx;
    list.forEach((el, i) => {
      if (i === startIndex) return;
      let shift = 0;
      if (i > startIndex && i <= idx) shift = -size;
      else if (i < startIndex && i >= idx) shift = size;
      el.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  }

  function onPointerUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const { item, list, startIndex, current, moved } = drag;
    drag = null;
    try { item.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
    for (const el of list) el.style.transform = '';
    item.classList.remove('is-dragging');
    if (moved) {
      item.dataset.justDragged = '1';
      setTimeout(() => { delete item.dataset.justDragged; }, 50);
      if (current !== startIndex) moveTo(item, current);
    }
  }

  function onClick(ev) {
    if (disabled) return;
    const item = ev.target.closest('[data-sort-item]');
    if (!item || item.parentNode !== listEl || item.dataset.justDragged) return;
    if (!selected) {
      selected = item;
      item.classList.add('is-selected');
      play('select');
      announce('Selected. Choose where to move it.');
    } else if (selected === item) {
      clearSelection();
    } else {
      const target = items().indexOf(item);
      const moving = selected;
      clearSelection();
      moveTo(moving, target);
      moving.focus({ preventScroll: true });
    }
  }

  function onKeyDown(ev) {
    if (disabled) return;
    const item = ev.target.closest('[data-sort-item]');
    if (!item || item.parentNode !== listEl) return;
    const list = items();
    const idx = list.indexOf(item);
    if (ev.key === 'ArrowUp' && idx > 0) {
      ev.preventDefault();
      clearSelection();
      moveTo(item, idx - 1);
      item.focus({ preventScroll: true });
    } else if (ev.key === 'ArrowDown' && idx < list.length - 1) {
      ev.preventDefault();
      clearSelection();
      moveTo(item, idx + 1);
      item.focus({ preventScroll: true });
    }
  }

  listEl.addEventListener('pointerdown', onPointerDown);
  listEl.addEventListener('pointermove', onPointerMove);
  listEl.addEventListener('pointerup', onPointerUp);
  listEl.addEventListener('pointercancel', onPointerUp);
  listEl.addEventListener('click', onClick);
  listEl.addEventListener('keydown', onKeyDown);

  return {
    setDisabled(v) { disabled = !!v; clearSelection(); listEl.classList.toggle('is-locked', disabled); },
    moveTo: (item, index) => moveTo(item, index, { silent: true }),
    destroy() {
      listEl.removeEventListener('pointerdown', onPointerDown);
      listEl.removeEventListener('pointermove', onPointerMove);
      listEl.removeEventListener('pointerup', onPointerUp);
      listEl.removeEventListener('pointercancel', onPointerUp);
      listEl.removeEventListener('click', onClick);
      listEl.removeEventListener('keydown', onKeyDown);
    },
  };
}
