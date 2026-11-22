/** Accessible modal dialogs: focus is trapped inside and restored on close. */
import { h } from '../core/dom.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {{
 *   title?: string, body?: Node|string|Array, wide?: boolean, dismissable?: boolean,
 *   actions?: { label: string, variant?: string, onClick?: Function, autofocus?: boolean, keepOpen?: boolean }[],
 *   onClose?: Function
 * }} opts
 * @returns {{ close: Function, el: HTMLElement }}
 */
export function openModal(opts) {
  const { title, body, wide = false, dismissable = true, actions = [], onClose } = opts;
  const root = document.getElementById('overlay-root');
  const previous = document.activeElement;
  let closed = false;

  const titleEl = title ? h('h2', { id: 'modal-title' }, title) : null;
  const dialog = h('div', {
    class: 'modal' + (wide ? ' modal-wide' : ''),
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': title ? 'modal-title' : null,
    tabindex: '-1',
  },
    titleEl,
    h('div.modal-body.stack', { style: { marginTop: title ? 'var(--s3)' : 0 } }, body),
    actions.length ? h('div.modal-actions', actions.map((a) => {
      const btn = h('button', { type: 'button', class: `btn ${a.variant ? 'btn-' + a.variant : ''}` }, a.label);
      btn.addEventListener('click', () => {
        if (a.onClick) a.onClick();
        if (!a.keepOpen) close();
      });
      if (a.autofocus) btn.dataset.autofocus = '1';
      return btn;
    })) : null,
  );
  const scrim = h('div.modal-scrim', dialog);

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    scrim.remove();
    if (previous && previous.focus) { try { previous.focus(); } catch { /* ignore */ } }
    if (onClose) onClose();
  }

  function onKey(ev) {
    if (ev.key === 'Escape' && dismissable) { ev.preventDefault(); ev.stopPropagation(); close(); return; }
    if (ev.key !== 'Tab') return;
    const items = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!items.length) { ev.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }

  scrim.addEventListener('mousedown', (ev) => { if (ev.target === scrim && dismissable) close(); });
  document.addEventListener('keydown', onKey, true);
  root.appendChild(scrim);
  const auto = dialog.querySelector('[data-autofocus]') || dialog.querySelector(FOCUSABLE) || dialog;
  auto.focus();
  return { close, el: dialog };
}

/** Promise-based confirm dialog. Resolves true/false. */
export function confirmDialog({ title, body, confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    openModal({
      title,
      body: typeof body === 'string' ? h('p.muted', body) : body,
      actions: [
        { label: cancelLabel, variant: 'ghost', onClick: () => { answered = true; resolve(false); } },
        { label: confirmLabel, variant: danger ? 'danger' : 'primary', autofocus: true, onClick: () => { answered = true; resolve(true); } },
      ],
      onClose: () => { if (!answered) resolve(false); },
    });
  });
}
