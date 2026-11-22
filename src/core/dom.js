/**
 * Tiny DOM toolkit. No framework, no virtual DOM: views build real nodes with
 * `h()` (HTML) and `s()` (SVG) and update them imperatively.
 *
 *   h('button.btn.btn-primary', { onclick: go, 'aria-label': 'Go' }, 'Go!')
 *   s('circle', { cx: 10, cy: 10, r: 4, class: 'fill-blue' })
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function parseSpec(spec) {
  // 'div.card.big#main' -> { tag: 'div', classes: ['card','big'], id: 'main' }
  let tag = 'div';
  let id = null;
  const classes = [];
  const re = /([.#]?)([^.#]+)/g;
  let m;
  let first = true;
  while ((m = re.exec(spec))) {
    if (m[1] === '.') classes.push(m[2]);
    else if (m[1] === '#') id = m[2];
    else if (first) tag = m[2];
    first = false;
  }
  return { tag, id, classes };
}

function appendKids(el, kids) {
  for (const kid of kids) {
    if (kid == null || kid === false || kid === true) continue;
    if (Array.isArray(kid)) appendKids(el, kid);
    else if (kid instanceof Node) el.appendChild(kid);
    else el.appendChild(document.createTextNode(String(kid)));
  }
}

function setAttrs(el, attrs, isSvg) {
  for (const key in attrs) {
    const val = attrs[key];
    if (val == null || val === false) continue;
    if (key === 'class' || key === 'className') {
      const cls = cx(val);
      if (cls) {
        if (isSvg) el.setAttribute('class', ((el.getAttribute('class') || '') + ' ' + cls).trim());
        else el.className = (el.className + ' ' + cls).trim();
      }
    } else if (key === 'style') {
      if (typeof val === 'string') el.setAttribute('style', val);
      else for (const p in val) {
        if (val[p] == null) continue;
        if (p.startsWith('--')) el.style.setProperty(p, val[p]);
        else el.style[p] = val[p];
      }
    } else if (key === 'dataset') {
      for (const d in val) if (val[d] != null) el.dataset[d] = val[d];
    } else if (key === 'html') {
      el.innerHTML = val; // trusted, app-generated markup only
    } else if (key === 'text') {
      el.textContent = val;
    } else if (key === 'ref') {
      val(el);
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (val === true) {
      el.setAttribute(key, '');
    } else if (!isSvg && key in el && key !== 'list' && key !== 'form' && typeof val !== 'string') {
      el[key] = val;
    } else {
      el.setAttribute(key, val);
    }
  }
}

/** Create an HTML element. */
export function h(spec, attrs, ...kids) {
  const { tag, id, classes } = parseSpec(spec);
  const el = document.createElement(tag);
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');
  if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    kids.unshift(attrs);
  } else if (attrs) {
    setAttrs(el, attrs, false);
  }
  appendKids(el, kids);
  return el;
}

/** Create an SVG element. */
export function s(spec, attrs, ...kids) {
  const { tag, id, classes } = parseSpec(spec);
  const el = document.createElementNS(SVG_NS, tag);
  if (id) el.setAttribute('id', id);
  if (classes.length) el.setAttribute('class', classes.join(' '));
  if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    kids.unshift(attrs);
  } else if (attrs) {
    setAttrs(el, attrs, true);
  }
  appendKids(el, kids);
  return el;
}

/** Update attributes on an existing SVG/HTML element (no class merging). */
export function attr(el, attrs) {
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) el.removeAttribute(k);
    else el.setAttribute(k, v === true ? '' : v);
  }
  return el;
}

/** classnames helper: cx('a', cond && 'b', { c: true }, ['d']) */
export function cx(...args) {
  const out = [];
  for (const a of args) {
    if (!a) continue;
    if (typeof a === 'string') out.push(a);
    else if (Array.isArray(a)) { const c = cx(...a); if (c) out.push(c); }
    else if (typeof a === 'object') for (const k in a) if (a[k]) out.push(k);
  }
  return out.join(' ');
}

export function frag(...kids) {
  const f = document.createDocumentFragment();
  appendKids(f, kids);
  return f;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function mount(parent, ...kids) {
  clear(parent);
  appendKids(parent, kids);
  return parent;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** addEventListener that returns its own remover. */
export function on(target, type, fn, opts) {
  target.addEventListener(type, fn, opts);
  return () => target.removeEventListener(type, fn, opts);
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let uidCounter = 0;
export function uid(prefix = 'id') {
  uidCounter += 1;
  return `${prefix}-${uidCounter.toString(36)}`;
}

export const wait = (ms) => new Promise((res) => setTimeout(res, ms));
export const nextFrame = () => new Promise((res) => requestAnimationFrame(() => res()));

/** True when animations should be minimised (OS setting or in-app setting). */
export function reducedMotion() {
  const root = document.documentElement;
  if (root.dataset.motion === 'reduce') return true;
  if (root.dataset.motion === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A bag of cleanup functions. Views and widgets collect listeners, timers and
 * animation frames here so `destroy()` can release everything at once.
 */
export function disposer() {
  const fns = [];
  const d = (fn) => { if (typeof fn === 'function') fns.push(fn); return fn; };
  d.on = (target, type, fn, opts) => d(on(target, type, fn, opts));
  d.timeout = (fn, ms) => { const t = setTimeout(fn, ms); d(() => clearTimeout(t)); return t; };
  d.interval = (fn, ms) => { const t = setInterval(fn, ms); d(() => clearInterval(t)); return t; };
  d.run = () => { while (fns.length) { try { fns.pop()(); } catch (e) { console.error(e); } } };
  return d;
}

/** Clamp helper used all over the place. */
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Announce a message to screen readers via the global live region. */
export function announce(message, assertive = false) {
  const region = document.getElementById(assertive ? 'live-assertive' : 'live-polite');
  if (!region) return;
  region.textContent = '';
  // Re-setting on the next frame makes repeated identical messages re-announce.
  requestAnimationFrame(() => { region.textContent = message; });
}
