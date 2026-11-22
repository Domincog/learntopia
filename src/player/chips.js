/**
 * "Chips and zones": movable tokens that live in drop zones. Powers the
 * match and bucket question types.
 *
 * A chip can be moved by dragging it onto a zone, or by tapping the chip and
 * then tapping a zone (which is also how keyboard and screen-reader users do
 * it, since chips are buttons and zones are focusable).
 *
 *   const board = chipBoard({
 *     zones: [{ id: 'pool', el, capacity: Infinity }, { id: 'a', el, capacity: 1 }],
 *     chips: [{ id: 'c1', el }],
 *     home: 'pool',
 *     onChange: () => {},
 *   });
 *   board.where('c1'); board.chipsIn('a'); board.place('c1', 'a'); board.lock();
 */
import { announce } from '../core/dom.js';
import { play } from '../core/audio.js';

export function chipBoard({ zones, chips, home, onChange = () => {} }) {
  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const chipById = new Map(chips.map((c) => [c.id, c]));
  const location = new Map();
  let locked = false;
  let selected = null;
  let drag = null;
  const cleanups = [];

  const chipsIn = (zoneId) => chips.filter((c) => location.get(c.id) === zoneId).map((c) => c.id);

  function setSelected(chipId) {
    if (selected) chipById.get(selected).el.classList.remove('is-selected');
    selected = chipId;
    if (selected) chipById.get(selected).el.classList.add('is-selected');
    for (const z of zones) z.el.classList.toggle('is-target', !!selected);
  }

  function place(chipId, zoneId, { silent = false } = {}) {
    const chip = chipById.get(chipId);
    const zone = zoneById.get(zoneId);
    if (!chip || !zone) return;
    const from = location.get(chipId);
    if (from === zoneId) return;
    // A full single-slot zone swaps its occupant back to where the newcomer came from (or home).
    const occupants = chipsIn(zoneId);
    if (occupants.length >= (zone.capacity || Infinity)) {
      const evicted = occupants[0];
      const dest = from && from !== zoneId ? from : home;
      location.set(evicted, dest);
      zoneById.get(dest).el.appendChild(chipById.get(evicted).el);
    }
    location.set(chipId, zoneId);
    (zone.slot || zone.el).appendChild(chip.el);
    chip.el.classList.remove('is-wrong', 'is-right');
    for (const z of zones) z.el.classList.toggle('is-filled', chipsIn(z.id).length > 0);
    if (!silent) {
      play('drop');
      announce(`Placed in ${zone.label || 'zone'}`);
      onChange();
    }
  }

  function zoneAt(x, y) {
    let best = null;
    for (const z of zones) {
      const r = z.el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        // prefer the smallest zone under the pointer (targets sit inside/near the pool)
        if (!best || r.width * r.height < best.area) best = { zone: z, area: r.width * r.height };
      }
    }
    return best ? best.zone : null;
  }

  for (const chip of chips) {
    const el = chip.el;
    el.dataset.chip = chip.id;

    const down = (ev) => {
      if (locked || ev.button > 0) return;
      drag = { id: chip.id, x: ev.clientX, y: ev.clientY, moved: false, pointerId: ev.pointerId };
      try { el.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    };
    const move = (ev) => {
      if (!drag || drag.id !== chip.id || ev.pointerId !== drag.pointerId) return;
      const dx = ev.clientX - drag.x;
      const dy = ev.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 6) return;
        drag.moved = true;
        el.classList.add('is-dragging');
        setSelected(null);
      }
      ev.preventDefault();
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(2deg)`;
      const over = zoneAt(ev.clientX, ev.clientY);
      for (const z of zones) z.el.classList.toggle('is-over', z === over);
    };
    const up = (ev) => {
      if (!drag || drag.id !== chip.id || ev.pointerId !== drag.pointerId) return;
      const { moved } = drag;
      drag = null;
      try { el.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      el.style.transform = '';
      el.classList.remove('is-dragging');
      for (const z of zones) z.el.classList.remove('is-over');
      if (!moved) return;
      el.dataset.justDragged = '1';
      setTimeout(() => { delete el.dataset.justDragged; }, 50);
      const target = zoneAt(ev.clientX, ev.clientY);
      if (target) place(chip.id, target.id);
    };
    const click = (ev) => {
      if (locked || el.dataset.justDragged) return;
      ev.stopPropagation();
      if (selected === chip.id) { setSelected(null); return; }
      if (selected && location.get(chip.id) !== home) {
        // tapping a placed chip while another is selected: drop the selected one into that zone
        const zoneId = location.get(chip.id);
        const moving = selected;
        setSelected(null);
        place(moving, zoneId);
        return;
      }
      setSelected(chip.id);
      play('select');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click);
    cleanups.push(() => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click);
    });
  }

  for (const zone of zones) {
    const el = zone.el;
    el.dataset.zone = zone.id;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'group'); // lets the zone carry an aria-label
    const activate = () => {
      if (locked || !selected) return;
      const moving = selected;
      setSelected(null);
      place(moving, zone.id);
      const chipEl = chipById.get(moving).el;
      if (chipEl.focus) chipEl.focus({ preventScroll: true });
    };
    const click = () => activate();
    const key = (ev) => {
      if (ev.target !== el) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(); }
    };
    el.addEventListener('click', click);
    el.addEventListener('keydown', key);
    cleanups.push(() => { el.removeEventListener('click', click); el.removeEventListener('keydown', key); });
  }

  // initial placement
  for (const chip of chips) {
    location.set(chip.id, home);
    zoneById.get(home).el.appendChild(chip.el);
  }

  return {
    where: (chipId) => location.get(chipId),
    chipsIn,
    place: (chipId, zoneId) => place(chipId, zoneId, { silent: true }),
    allPlaced: () => chipsIn(home).length === 0,
    lock() { locked = true; setSelected(null); },
    unlock() { locked = false; },
    destroy() { cleanups.forEach((fn) => fn()); },
  };
}
