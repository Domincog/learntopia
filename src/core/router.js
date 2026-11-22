/**
 * Minimal hash router. Hash routing means the site works on any static host
 * with zero server configuration (Cloudflare Pages, GitHub Pages, a USB stick).
 *
 *   route('/course/:courseId', view)
 *   start(render)          // calls render({ view, params, query, path })
 *   navigate('/courses')
 */

const routes = [];
let notFound = null;
let onChange = null;
let currentMatch = null;

function compile(pattern) {
  const names = [];
  const src = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z_]\w*)/g, (_, name) => { names.push(name); return '([^/]+)'; });
  return { re: new RegExp('^' + src + '/?$'), names };
}

export function route(pattern, view) {
  routes.push({ pattern, view, ...compile(pattern) });
}

export function setNotFound(view) {
  notFound = view;
}

export function parseHash(hash) {
  let raw = (hash || '').replace(/^#/, '');
  if (!raw.startsWith('/')) raw = '/' + raw;
  const [pathPart, queryPart = ''] = raw.split('?');
  const query = {};
  for (const pair of queryPart.split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    try { query[decodeURIComponent(k)] = decodeURIComponent(v); } catch { query[k] = v; }
  }
  return { path: pathPart.replace(/\/+$/, '') || '/', query };
}

export function match(path) {
  for (const r of routes) {
    const m = r.re.exec(path);
    if (m) {
      const params = {};
      r.names.forEach((n, i) => {
        try { params[n] = decodeURIComponent(m[i + 1]); } catch { params[n] = m[i + 1]; }
      });
      return { view: r.view, params, pattern: r.pattern };
    }
  }
  return null;
}

function handle() {
  const { path, query } = parseHash(location.hash);
  const m = match(path) || { view: notFound, params: {}, pattern: null };
  currentMatch = { ...m, path, query };
  if (onChange) onChange(currentMatch);
}

export function start(callback) {
  onChange = callback;
  window.addEventListener('hashchange', handle);
  handle();
}

/** Programmatic navigation. `replace` avoids adding a history entry. */
export function navigate(path, { replace = false } = {}) {
  const target = '#' + path;
  if (location.hash === target) { handle(); return; }
  if (replace) {
    history.replaceState(null, '', target);
    handle();
  } else {
    location.hash = path;
  }
}

/** Build an href for a route path: href('/courses') -> '#/courses' */
export const href = (path) => '#' + path;

export const current = () => currentMatch;

/** Go back if there is in-app history, else to a fallback path. */
export function back(fallback = '/') {
  if (history.length > 1 && document.referrer !== '' || sessionStorage.getItem('lemma:nav') === '1') {
    history.back();
  } else {
    navigate(fallback, { replace: true });
  }
}
