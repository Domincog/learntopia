/*
 * Runs synchronously in <head>, before first paint, so a returning learner
 * never sees a flash of the wrong theme or text size. Kept dependency-free
 * and tiny; it only reads settings — app.js owns everything else.
 * (Classic script on purpose: module scripts are deferred.)
 */
(function () {
  var root = document.documentElement;
  var settings = {};
  try {
    var raw = localStorage.getItem('lemma:v1');
    if (raw) settings = (JSON.parse(raw) || {}).settings || {};
  } catch (e) { /* private mode or corrupt data: fall back to defaults */ }

  var theme = settings.theme || 'auto';
  var dark = theme === 'dark' ||
    (theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.setAttribute('data-theme-pref', theme);

  if (settings.motion === 'reduce' || settings.motion === 'full') root.setAttribute('data-motion', settings.motion);
  if (settings.fontScale) root.style.setProperty('--font-scale', String(settings.fontScale));

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#16151C' : '#FAF5EA');
})();
