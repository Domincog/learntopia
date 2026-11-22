/**
 * Application entry point: boots the store, applies settings, wires the
 * router to the views and keeps the shell in sync.
 */
import { config } from './config.js';
import { store } from './core/store.js';
import { clock } from './core/dates.js';
import { route, start, setNotFound, current } from './core/router.js';
import { h, mount, disposer, announce } from './core/dom.js';
import { configureAudio } from './core/audio.js';
import { settleStreak } from './core/progress.js';
import { checkAchievements } from './core/achievements.js';
import { getCourses } from './core/content.js';
import { createShell } from './ui/shell.js';
import { loadingBlock } from './ui/components.js';
import { toast } from './ui/toast.js';

/* ------------------------------------------------------------ settings */

const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function applySettings(settings = store.state.settings) {
  const root = document.documentElement;
  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && darkQuery && darkQuery.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.themePref = settings.theme;
  if (settings.motion === 'reduce' || settings.motion === 'full') root.dataset.motion = settings.motion;
  else delete root.dataset.motion;
  root.style.setProperty('--font-scale', String(settings.fontScale || 1));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#16151C' : '#FAF5EA');
  configureAudio({ sound: settings.sound !== false, haptics: settings.haptics !== false });
}

/* -------------------------------------------------------------- routes */

const lazy = (loader) => () => loader().then((m) => m.default);

route('/', lazy(() => import('./views/home.js')));
route('/welcome', lazy(() => import('./views/welcome.js')));
route('/courses', lazy(() => import('./views/courses.js')));
route('/course/:courseId', lazy(() => import('./views/course.js')));
route('/learn/:courseId/:lessonId', lazy(() => import('./views/lesson.js')));
route('/review', lazy(() => import('./views/review.js')));
route('/review/session', lazy(() => import('./views/review-session.js')));
route('/puzzles', lazy(() => import('./views/puzzles.js')));
route('/puzzles/:puzzleId', lazy(() => import('./views/puzzle.js')));
route('/profile', lazy(() => import('./views/profile.js')));
route('/settings', lazy(() => import('./views/settings.js')));
route('/about', lazy(() => import('./views/about.js')));
route('/support', lazy(() => import('./views/support.js')));
route('/dev', lazy(() => import('./views/dev.js')));
route('/dev/:tool', lazy(() => import('./views/dev.js')));
setNotFound(lazy(() => import('./views/notfound.js')));

/* ------------------------------------------------------------- render */

let shell = null;
let active = null;       // { view, ctx, path }
let renderToken = 0;
let rerenderQueued = false;

function teardown() {
  if (!active) return;
  try { active.ctx.d.run(); } catch (err) { console.error(err); }
  active = null;
}

function errorView(err) {
  console.error(err);
  return h('div.page.page-narrow', h('div.empty',
    h('h1', 'Something went wrong'),
    h('p', 'This page hit an unexpected error. Your progress is safe.'),
    h('pre.code', { style: { textAlign: 'left', maxWidth: '100%' } }, String(err && err.stack ? err.stack : err)),
    h('a.btn.btn-primary', { href: '#/' }, 'Back to home'),
  ));
}

async function render(match, { keepScroll = false } = {}) {
  const token = ++renderToken;
  const samePath = active && active.path === match.path;
  teardown();

  let view;
  try {
    if (!keepScroll) mount(shell.main, loadingBlock());
    view = await match.view();
  } catch (err) {
    if (token !== renderToken) return;
    document.body.classList.remove('mode-focus');
    mount(shell.main, errorView(err));
    return;
  }
  if (token !== renderToken) return;

  // First-time visitors land on the welcome page instead of an empty dashboard.
  if (match.path === '/' && !store.state.profile.onboarded) {
    view = (await import('./views/welcome.js')).default;
    if (token !== renderToken) return;
  }

  const ctx = {
    params: match.params,
    query: match.query,
    path: match.path,
    d: disposer(),
    rerender: () => queueRerender(),
  };
  active = { view, ctx, path: match.path };
  document.body.classList.toggle('mode-focus', !!view.focus);

  let el;
  try {
    el = await view.render(ctx);
  } catch (err) {
    el = errorView(err);
  }
  if (token !== renderToken) { ctx.d.run(); return; }

  const scrollY = window.scrollY;
  mount(shell.main, el);
  shell.update(match.path);
  const title = typeof view.title === 'function' ? view.title(ctx) : view.title;
  document.title = title ? `${title} · ${config.name}` : `${config.name} — learn by doing`;
  if (keepScroll || samePath) window.scrollTo(0, scrollY);
  else {
    window.scrollTo(0, 0);
    if (navigated) { shell.main.focus({ preventScroll: true }); announce(title || config.name); }
  }
  navigated = true;
}

let navigated = false;

function queueRerender() {
  if (rerenderQueued) return;
  rerenderQueued = true;
  requestAnimationFrame(() => {
    rerenderQueued = false;
    const m = current();
    if (m && active && active.path === m.path) render(m, { keepScroll: true });
  });
}

/* --------------------------------------------------------------- boot */

function boot() {
  store.init();
  applySettings();
  if (darkQuery) {
    const onScheme = () => applySettings();
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onScheme);
    else if (darkQuery.addListener) darkQuery.addListener(onScheme);
  }

  shell = createShell();
  mount(document.getElementById('app'), shell.el);

  // Settle the streak once per visit and tell the learner if a rest day saved it.
  const settled = store.update((s) => settleStreak(s, clock.now()), { silent: true });
  if (settled.usedRest) {
    setTimeout(() => toast({
      icon: 'coffee', hue: 'blue',
      title: 'Rest day used',
      body: `Your ${store.state.streak.current}-day streak is safe. Welcome back!`,
      duration: 5000,
    }), 900);
  }

  // Backfill achievements quietly (e.g. after importing a backup).
  store.update((s) => checkAchievements(s, clock.now(), getCourses()), { silent: true });

  // Re-render "live" views (dashboards) when data changes; apply settings always.
  let lastSettings = JSON.stringify(store.state.settings);
  store.subscribe((state) => {
    const snap = JSON.stringify(state.settings);
    if (snap !== lastSettings) { lastSettings = snap; applySettings(state.settings); }
    if (active && active.view.live) queueRerender();
  });

  start((match) => render(match));
  registerServiceWorker();
}

/** The browser's "install this app" prompt, if it has offered one (used by Settings). */
export const install = { prompt: null };
window.addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  install.prompt = ev;
});
window.addEventListener('appinstalled', () => { install.prompt = null; });

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  let force = false;
  try { force = localStorage.getItem('lemma:sw') === '1'; } catch { /* ignore */ }
  if (location.protocol !== 'https:' && !local) return;
  if (local && !force) return; // keep local development free of caching surprises
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[sw] registration failed', err));
  });
}

boot();
