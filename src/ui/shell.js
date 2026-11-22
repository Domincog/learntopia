/**
 * The persistent app frame: sidebar (desktop), top bar + tab bar (mobile).
 * Views render into `shell.main`.
 */
import { h, mount } from '../core/dom.js';
import { href } from '../core/router.js';
import { icon } from './icon.js';
import { brandMark } from './mascot.js';
import { bar } from './components.js';
import { config, supportLink } from '../config.js';
import { store } from '../core/store.js';
import { clock } from '../core/dates.js';
import { streakStatus, dueCount, todayRecord, levelInfo } from '../core/progress.js';

const NAV = [
  { path: '/', label: 'Home', icon: 'home', match: /^\/$/ },
  { path: '/courses', label: 'Courses', tab: 'Learn', icon: 'courses', match: /^\/course/ },
  { path: '/review', label: 'Review', icon: 'review', match: /^\/review/, badge: true },
  { path: '/puzzles', label: 'Puzzles', icon: 'puzzle', match: /^\/puzzles/ },
  { path: '/profile', label: 'Progress', tab: 'Me', icon: 'stats', match: /^\/(profile|settings|about|support)/ },
];

function wordmark() {
  return h('a.wordmark', { href: href('/'), 'aria-label': `${config.name} home` },
    brandMark(34),
    h('span', config.name, h('span.wordmark-dot', '.')),
  );
}

export function createShell() {
  const main = h('main#main.main', { tabindex: '-1' });

  const navLinks = NAV.map((item) => {
    const badge = item.badge ? h('span.badge-dot', { hidden: true }) : null;
    const el = h('a.nav-item', { href: href(item.path) }, icon(item.icon, 22), h('span', item.label), badge);
    return { item, el, badge };
  });

  const tabs = NAV.map((item) => {
    const badge = item.badge ? h('span.badge-dot', { hidden: true }) : null;
    const el = h('a.tab', { href: href(item.path) }, h('span.tab-icon', icon(item.icon, 22)), h('span', item.tab || item.label), badge);
    return { item, el, badge };
  });

  const statusCard = h('div.status-card');
  const topStats = h('div.topbar-stats');

  const sidebar = h('aside.sidebar', { 'aria-label': 'Main' },
    wordmark(),
    h('nav.nav', { 'aria-label': 'Sections' }, navLinks.map((n) => n.el)),
    h('div.sidebar-foot',
      statusCard,
      h('nav.nav', { 'aria-label': 'More' },
        h('a.nav-item', { href: href('/settings') }, icon('settings', 20), h('span', 'Settings')),
        h('a.nav-item', { href: href('/about') }, icon('info', 20), h('span', 'How it works')),
        supportLink() ? h('a.nav-item.nav-support', { href: href('/support') }, icon('heart', 20), h('span', `Support ${config.name}`)) : null,
      ),
    ),
  );

  const topbar = h('header.topbar', wordmark(), topStats);
  const tabbar = h('nav.tabbar', { 'aria-label': 'Sections' }, tabs.map((t) => t.el));
  const el = h('div.shell', sidebar, h('div.shell-col', topbar, main), tabbar);

  function refreshStats() {
    const state = store.state;
    const now = clock.now();
    const streak = streakStatus(state, now);
    const today = todayRecord(state, now);
    const goal = state.profile.goal || 40;
    const due = dueCount(state, now);
    const level = levelInfo(state.xp);

    for (const group of [navLinks, tabs]) {
      for (const n of group) {
        if (!n.badge) continue;
        n.badge.hidden = due === 0;
        n.badge.textContent = due > 99 ? '99+' : String(due);
        n.badge.setAttribute('aria-label', `${due} reviews due`);
      }
    }

    mount(statusCard,
      h('div.status-row', { title: streak.doneToday ? 'You have practised today' : 'Practise today to extend your streak' },
        icon('flame', { size: 20, cls: streak.doneToday ? 'flame-on' : 'flame-off', filled: streak.doneToday }),
        h('span', 'Streak'),
        h('span.num', `${streak.current} day${streak.current === 1 ? '' : 's'}`),
      ),
      h('div',
        h('div.status-row', icon('target', 20), h('span', 'Today'), h('span.num', `${Math.min(today.xp, 9999)} / ${goal} XP`)),
        h('div', { style: { marginTop: '8px' } }, bar(today.xp / goal, { thin: true, hue: today.xp >= goal ? 'green' : 'orange', label: 'Daily goal' })),
      ),
      h('div.status-row', { title: level.title }, icon('zap', 20), h('span', `Level ${level.level}`), h('span.num', `${state.xp} XP`)),
    );

    mount(topStats,
      h('a.stat-pill', { href: href('/profile'), class: streak.doneToday ? 'is-lit' : '', 'aria-label': `${streak.current} day streak` },
        icon('flame', { size: 18, cls: streak.doneToday ? 'flame-on' : 'flame-off', filled: streak.doneToday }), String(streak.current)),
      h('a.stat-pill', { href: href('/profile'), 'aria-label': `${today.xp} of ${goal} XP today` },
        icon('zap', { size: 18, cls: 'tc-orange' }), `${today.xp}/${goal}`),
    );
  }

  function update(path) {
    for (const group of [navLinks, tabs]) {
      for (const n of group) {
        if (n.item.match.test(path)) n.el.setAttribute('aria-current', 'page');
        else n.el.removeAttribute('aria-current');
      }
    }
    for (const a of sidebar.querySelectorAll('.sidebar-foot .nav-item')) {
      if (a.getAttribute('href') === href(path)) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    refreshStats();
  }

  store.subscribe(refreshStats);
  refreshStats();

  return { el, main, update, refreshStats };
}
