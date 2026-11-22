/** Progress page: level, streak, activity, calibration and achievements. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, today, addDays, keyToDate, formatDay, monthShort, lastDays, weekdayShort, formatMinutes } from '../core/dates.js';
import { getCourses } from '../core/content.js';
import { levelInfo, streakStatus, totals, calibration, courseProgress, MAX_REST_DAYS } from '../core/progress.js';
import { achievementList } from '../core/achievements.js';
import { config, supportLink } from '../config.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { bar, sectionHead, statTile, pct, plural } from '../ui/components.js';

function heatmap(state) {
  const goal = state.profile.goal || 40;
  const end = today();
  const endDate = keyToDate(end);
  const dow = (endDate.getDay() + 6) % 7; // Monday = 0
  const weeks = 53; // a year; the page shows as many of the latest weeks as fit its width
  const start = addDays(end, -(dow + (weeks - 1) * 7));
  const rested = new Set(state.streak.rested);
  const cols = [];
  let lastMonth = '';
  for (let w = 0; w < weeks; w++) {
    const cells = [];
    const first = addDays(start, w * 7);
    const month = monthShort(first);
    const label = month !== lastMonth ? month : '';
    lastMonth = month;
    for (let d = 0; d < 7; d++) {
      const key = addDays(start, w * 7 + d);
      if (key > end) { cells.push(h('i.heat-cell.is-future')); continue; }
      const rec = state.days[key];
      const xp = rec ? rec.xp : 0;
      const level = xp <= 0 ? 0 : xp < goal * 0.5 ? 1 : xp < goal ? 2 : xp < goal * 2 ? 3 : 4;
      cells.push(h('i', {
        class: cx('heat-cell', `is-l${level}`, rested.has(key) && 'is-rest', key === end && 'is-today'),
        title: `${formatDay(key)}: ${xp ? xp + ' XP' : rested.has(key) ? 'rest day' : 'no activity'}`,
      }));
    }
    cols.push(h('div.heat-col', h('span.heat-month', label), cells));
  }
  // Newest week first in the document and laid out right to left, so that on a narrow screen
  // the weeks that do not fit are the oldest ones (they wrap out of sight, see .heat-weeks).
  return h('div.heat-wrap',
    h('div.heat', { role: 'img', 'aria-label': 'Your activity day by day over the past months, most recent week on the right' },
      h('div.heat-col.heat-days', h('span.heat-month', ''), ['M', '', 'W', '', 'F', '', ''].map((t) => h('span', t))),
      h('div.heat-weeks', cols.reverse()),
    ),
    h('div.heat-legend.tiny.faint', 'Less', [0, 1, 2, 3, 4].map((l) => h('i', { class: `heat-cell is-l${l}` })), 'More',
      h('span', { style: { marginLeft: '12px' } }, h('i.heat-cell.is-rest'), ' rest day')),
  );
}

function xpChart(state) {
  const days = lastDays(14);
  const goal = state.profile.goal || 40;
  const values = days.map((k) => (state.days[k] ? state.days[k].xp : 0));
  const max = Math.max(goal * 1.2, ...values);
  return h('div.forecast.xp-chart', { role: 'img', 'aria-label': `XP earned over the last 14 days: ${values.join(', ')}` },
    h('div.xp-goal-line', { style: { bottom: `calc(22px + (100% - 44px) * ${goal / max})` } }, h('span.tiny', `goal ${goal}`)),
    days.map((key, i) => h('div', { class: cx('forecast-col', i === days.length - 1 && 'is-today', values[i] >= goal && 'is-met') },
      h('div.forecast-num', values[i] ? String(values[i]) : ''),
      h('div.forecast-bar', h('i', { style: { height: `${(values[i] / max) * 100}%` } })),
      h('div.forecast-day', i === days.length - 1 ? 'Today' : weekdayShort(key).slice(0, 2)),
    )),
  );
}

function calibrationCard(state) {
  const rows = calibration(state);
  const n = rows.reduce((t, r) => t + r.n, 0);
  if (n < 5) {
    return h('div.panel',
      h('p.muted', 'During reviews you can say how sure you are before checking. After a handful of answers, this chart shows whether your confidence matches reality — one of the most useful things a learner can know about themselves.'),
    );
  }
  return h('div.panel.calib',
    rows.map((r) => h('div', { class: cx('calib-row', `hue-${r.key === 'sure' ? 'violet' : r.key === 'think' ? 'blue' : 'gray'}`) },
      h('div.calib-label', h('strong', r.label), h('span.tiny.faint', r.n ? plural(r.n, 'answer') : 'no answers yet')),
      h('div.calib-track',
        r.accuracy != null ? h('i', { style: { width: `${Math.max(2, r.accuracy * 100)}%` } }) : null,
        h('b', { style: { left: `${r.expected * 100}%` }, title: `Well calibrated would be about ${pct(r.expected)}` }),
      ),
      h('div.calib-value', r.accuracy != null ? pct(r.accuracy) : '—'),
    )),
    h('p.tiny.faint', 'Bars show how often you were right at each confidence level. The marker shows roughly where a well-calibrated learner would be. Bars left of the marker mean overconfidence.'),
  );
}

export default {
  title: 'Progress',
  live: true,
  render() {
    const state = store.state;
    const now = clock.now();
    const level = levelInfo(state.xp);
    const streak = streakStatus(state, now);
    const t = totals(state);
    const achievements = achievementList(state, getCourses());
    const earned = achievements.filter((a) => a.earnedAt);
    const started = getCourses().map((c) => ({ c, p: courseProgress(state, c, now) })).filter((x) => x.p.started);

    return h('div.page',
      h('header.profile-head.card',
        h('div', { class: `profile-avatar hue-${state.profile.avatar || 'orange'}` }, mascot('happy', { size: 76, variant: 'face', animate: false })),
        h('div.grow',
          h('h1', state.profile.name || 'Your progress'),
          h('div.muted', `Level ${level.level} · ${level.title}`),
          h('div.profile-xp',
            bar(level.pct, { hue: 'yellow', label: 'Progress to next level' }),
            h('span.small.muted.nowrap', `${level.into} / ${level.span} XP to level ${level.level + 1}`),
          ),
        ),
        h('a.icon-btn', { href: href('/settings'), 'aria-label': 'Settings', title: 'Settings' }, icon('settings', 24)),
      ),

      h('section.section',
        h('div.stat-grid',
          statTile({ value: String(streak.current), label: 'day streak', icon: 'flame', hue: 'orange', sub: `best ${streak.best} · ${streak.rest}/${MAX_REST_DAYS} rest days banked` }),
          statTile({ value: String(t.lessons), label: plural(t.lessons, 'lesson').replace(/^\d+ /, '') + ' finished', icon: 'courses', hue: 'blue' }),
          statTile({ value: formatMinutes(t.minutes), label: 'focused time', icon: 'clock', hue: 'teal', sub: `${plural(t.activeDays, 'active day')}` }),
          statTile({ value: t.accuracy == null ? '—' : pct(t.accuracy), label: 'right first time', icon: 'target', hue: 'green', sub: t.answered ? `${t.answered} questions` : null }),
          statTile({ value: String(t.reviews), label: 'reviews done', icon: 'review', hue: 'violet', sub: `${plural(t.cards, 'idea')} saved` }),
          statTile({ value: String(state.xp), label: 'total XP', icon: 'zap', hue: 'yellow' }),
        ),
      ),

      h('section.section', sectionHead('Activity'), h('div.panel', heatmap(state))),
      h('section.section', sectionHead('Last 14 days'), h('div.panel', xpChart(state))),
      h('section.section', sectionHead('How well do you know what you know?'), calibrationCard(state)),

      started.length ? h('section.section',
        sectionHead('Courses'),
        h('div.panel.memory-list', started.map(({ c, p }) => h('div', { class: cx('memory-row', `hue-${c.color}`) },
          h('div.grow',
            h('div.row.spread', h('a.memory-title', { href: href(`/course/${c.id}`) }, c.title), h('span.small.muted.nowrap', `${p.done} of ${p.total} lessons`)),
            h('div', { style: { marginTop: '6px' } }, bar(p.pct, { thin: true, label: `${c.title} progress` })),
          ),
          p.complete ? icon('circle-check', { size: 22, cls: 'tc-green' }) : h('a.btn.btn-sm', { href: href(`/learn/${c.id}/${p.next.id}`) }, 'Continue'),
        ))),
      ) : null,

      h('section.section',
        sectionHead('Achievements', h('span.small.muted', `${earned.length} of ${achievements.length}`)),
        h('div.ach-grid', achievements.map((a) => h('div', { class: cx('ach-card', `hue-${a.hue}`, !a.earnedAt && 'is-locked') },
          h('div.ach-icon', icon(a.earnedAt ? a.icon : 'lock', 22)),
          h('div.ach-title', a.title),
          h('div.tiny.muted', a.desc),
          !a.earnedAt && a.progress ? h('div', { style: { marginTop: '6px' } }, bar(Math.min(1, a.progress[0] / a.progress[1]), { thin: true, label: `${a.title} progress` })) : null,
          a.earnedAt ? h('div.tiny.faint', formatDay(new Date(a.earnedAt).toISOString().slice(0, 10))) : null,
        ))),
      ),

      h('section.section.center',
        h('p.small.faint', 'Everything on this page is stored only in this browser. ',
          h('a', { href: href('/settings') }, 'Back up or move your progress'), '.'),
        h('p.small.faint', h('a', { href: href('/about') }, `How ${config.name} works`),
          supportLink() ? [' · ', h('a', { href: href('/support') }, `Support ${config.name}`)] : null),
      ),
    );
  },
};
