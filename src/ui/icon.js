/**
 * Icon helper. Icons are Lucide outlines stored as path data in icons.js.
 *
 *   icon('flame')                       // 20px SVG element
 *   icon('check', { size: 16, label: 'Done' })
 */
import { ICONS } from './icons.js';

const NS = 'http://www.w3.org/2000/svg';

export function iconHtml(name, size = 20, extraClass = '') {
  const body = ICONS[name] || ICONS.help;
  return `<svg class="icon icon-${name}${extraClass ? ' ' + extraClass : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function icon(name, opts = {}) {
  const o = typeof opts === 'number' ? { size: opts } : opts;
  const { size = 20, cls = '', label = null, stroke = 2, filled = false } = o;
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('class', `icon icon-${name}${cls ? ' ' + cls : ''}`);
  el.setAttribute('width', size);
  el.setAttribute('height', size);
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('fill', filled ? 'currentColor' : 'none');
  el.setAttribute('stroke', 'currentColor');
  el.setAttribute('stroke-width', stroke);
  el.setAttribute('stroke-linecap', 'round');
  el.setAttribute('stroke-linejoin', 'round');
  el.setAttribute('focusable', 'false');
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  el.innerHTML = ICONS[name] || ICONS.help;
  return el;
}

export const hasIcon = (name) => Object.prototype.hasOwnProperty.call(ICONS, name);
