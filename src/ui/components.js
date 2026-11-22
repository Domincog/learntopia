/**
 * Small presentational building blocks shared by the views.
 */
import { h, s, cx } from '../core/dom.js';
import { icon } from './icon.js';

/** Circular progress ring. `pct` is 0–1. `label` is any node shown in the middle. */
export function ring({ pct = 0, size = 64, stroke = 8, hue = null, label = null, title = null } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  const svgEl = s('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' },
    s('circle.ring-track', { cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke }),
    s('circle.ring-fill', {
      cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, 'stroke-linecap': 'round',
      'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - clamped),
    }),
  );
  return h('div', {
    class: cx('ring', hue && `hue-${hue}`),
    style: { width: size + 'px', height: size + 'px' },
    role: 'img',
    'aria-label': title || `${Math.round(clamped * 100)}%`,
  }, svgEl, label != null ? h('div.ring-label', label) : null);
}

/** Horizontal progress bar. */
export function bar(pct, { hue = null, thin = false, label = null } = {}) {
  const clamped = Math.max(0, Math.min(1, pct || 0));
  return h('div', {
    class: cx('bar', thin && 'bar-thin', hue && `hue-${hue}`),
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(clamped * 100),
    'aria-label': label || 'Progress',
    style: { '--pct': clamped },
  }, h('i'));
}

export function chip(text, { icon: ic = null, hue = null, outline = false, title = null } = {}) {
  return h('span', { class: cx('chip', hue && `chip-${hue}`, outline && 'chip-outline'), title },
    ic ? icon(ic, 14) : null, text);
}

export function sectionHead(title, action = null) {
  return h('div.section-head', h('h2', title), action);
}

/** A labelled on/off switch. */
export function toggle({ checked = false, onChange, label, id }) {
  const input = h('input', { type: 'checkbox', id, checked, role: 'switch', 'aria-label': label });
  input.addEventListener('change', () => onChange && onChange(input.checked));
  return h('span.switch', input, h('span.switch-track'));
}

/** Segmented control. options: [{ value, label, icon? }] */
export function segmented({ options, value, onChange, label }) {
  const wrap = h('div.segmented', { role: 'group', 'aria-label': label });
  const buttons = options.map((opt) => {
    const btn = h('button', { type: 'button', 'aria-pressed': String(opt.value === value) },
      opt.icon ? icon(opt.icon, 16) : null, opt.label);
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      onChange && onChange(opt.value);
    });
    return btn;
  });
  buttons.forEach((b) => wrap.appendChild(b));
  return wrap;
}

/** A big number with a caption, used on stats screens. */
export function statTile({ value, label, icon: ic = null, hue = 'orange', sub = null }) {
  return h('div', { class: cx('stat-tile', `hue-${hue}`, String(value).length > 6 && 'is-long') },
    ic ? h('div.stat-tile-icon', icon(ic, 20)) : null,
    h('div.stat-tile-value', value),
    h('div.stat-tile-label', label),
    sub ? h('div.stat-tile-sub', sub) : null,
  );
}

export function loadingBlock(text = 'Loading…') {
  return h('div.loading', { role: 'status' }, h('div.spinner'), h('div', text));
}

/** Format a 0–1 fraction as a whole percent string. */
export const pct = (v) => `${Math.round((v || 0) * 100)}%`;

/** Pluralise: plural(3, 'lesson') -> "3 lessons" */
export const plural = (n, word, pluralWord) => `${n} ${n === 1 ? word : (pluralWord || word + 's')}`;
