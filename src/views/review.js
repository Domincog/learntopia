/** Review hub: what is due, what is coming, and how strong each course's memories are. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, relativeDays, addDays, today, weekdayShort } from '../core/dates.js';
import { getCourses } from '../core/content.js';
import { dueCount, reviewForecast, strengthLabel } from '../core/progress.js';
import { recallNow, isDue, maturity } from '../core/srs.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { bar, sectionHead, plural, pct, statTile } from '../ui/components.js';
import { createWidget } from '../widgets/index.js';

const STRENGTH_HUE = { strong: 'green', good: 'teal', fading: 'yellow', weak: 'red' };

function forecastChart(state, now) {
  const fc = reviewForecast(state, now, 14);
  const max = Math.max(1, ...fc);
  const t = today();
  return h('div.forecast', { role: 'img', 'aria-label': `Reviews due over the next 14 days: ${fc.join(', ')}` },
    fc.map((n, i) => {
      const key = addDays(t, i);
      return h('div', { class: cx('forecast-col', i === 0 && 'is-today') },
        h('div.forecast-num', n ? String(n) : ''),
        h('div.forecast-bar', h('i', { style: { height: `${(n / max) * 100}%` } })),
        h('div.forecast-day', i === 0 ? 'Today' : weekdayShort(key).slice(0, 2)),
      );
    }),
  );
}

function courseRows(state, now) {
  const rows = [];
  for (const course of getCourses()) {
    const prefix = `${course.id}/`;
    let n = 0;
    let due = 0;
    let sum = 0;
    for (const id in state.cards) {
      if (!id.startsWith(prefix)) continue;
      n++;
      sum += recallNow(state.cards[id], now);
      if (isDue(state.cards[id], now)) due++;
    }
    if (!n) continue;
    const strength = sum / n;
    const sl = strengthLabel(strength);
    rows.push(h('div', { class: cx('memory-row', `hue-${STRENGTH_HUE[sl.key]}`) },
      h('div.grow',
        h('div.row.spread', h('a.memory-title', { href: href(`/course/${course.id}`) }, course.title), h('span.small.muted.nowrap', `${pct(strength)} · ${sl.label}`)),
        h('div', { style: { marginTop: '6px' } }, bar(strength, { thin: true, hue: STRENGTH_HUE[sl.key], label: `${course.title} memory strength` })),
        h('div.tiny.faint', { style: { marginTop: '4px' } }, `${plural(n, 'idea')} saved${due ? ` · ${due} due` : ''}`),
      ),
      h('a.btn.btn-sm', { href: href(`/review/session?course=${course.id}${due ? '' : '&mode=practice'}`) }, due ? 'Review' : 'Practise'),
    ));
  }
  return rows;
}

export default {
  title: 'Review',
  live: true,
  async render() {
    const state = store.state;
    const now = clock.now();
    const total = Object.keys(state.cards).length;
    const due = dueCount(state, now);
    const size = Math.min(due, state.settings.reviewSize || 10);
    let longTerm = 0;
    let recallSum = 0;
    for (const id in state.cards) {
      if (maturity(state.cards[id]).key === 'strong') longTerm++;
      recallSum += recallNow(state.cards[id], now);
    }

    let hero;
    if (!total) {
      hero = h('div.card.review-hero',
        mascot('happy', { size: 120 }),
        h('div',
          h('h2', 'Nothing to review yet'),
          h('p.muted', 'Each lesson saves a few key ideas. They will appear here, timed to arrive just before you would forget them.'),
          h('div', { style: { marginTop: 'var(--s4)' } }, h('a.btn.btn-primary', { href: href('/courses') }, 'Start a lesson', icon('arrow-right', 18))),
        ),
      );
    } else if (due) {
      hero = h('div.card.review-hero.hue-violet',
        mascot('think', { size: 120 }),
        h('div',
          h('div.eyebrow', 'Ready now'),
          h('h2', `${plural(due, 'idea')} to strengthen`),
          h('p.muted', `Sessions are short: ${plural(size, 'question')}, about ${Math.max(1, Math.round(size * 0.6))} min, mixed across everything you have learned.`),
          h('div', { style: { marginTop: 'var(--s4)' } }, h('a.btn.btn-violet.btn-lg', { href: href('/review/session') }, 'Start review', icon('arrow-right', 20))),
        ),
      );
    } else {
      const fc = reviewForecast(state, now, 60);
      const nextIdx = fc.findIndex((n, i) => i > 0 && n > 0);
      hero = h('div.card.review-hero.hue-green',
        mascot('proud', { size: 120 }),
        h('div',
          h('div.eyebrow', 'All caught up'),
          h('h2', nextIdx > 0 ? `Next review ${relativeDays(nextIdx)}` : 'Nothing scheduled soon'),
          h('p.muted', 'Reviewing before an idea is due adds very little. Rest, or learn something new.'),
          h('div.row.row-wrap', { style: { marginTop: 'var(--s4)' } },
            h('a.btn.btn-primary', { href: href('/courses') }, 'Learn something new'),
            h('a.btn.btn-ghost', { href: href('/review/session?mode=practice') }, icon('dumbbell', 18), 'Practise anyway'),
          ),
        ),
      );
    }

    const curve = await createWidget({
      type: 'memory-curve', days: 30, strength: 1, editable: false, reviews: [3, 10],
      alt: 'A forgetting curve that is lifted back to 100% by two reviews and falls more slowly after each.',
    });

    return h('div.page',
      h('header.page-head',
        h('h1', 'Review'),
        h('p', 'Short, well-timed recall sessions that move what you learn into long-term memory.'),
      ),
      hero,
      total ? h('section.section',
        h('div.stat-grid', { style: { '--cols': 4 } },
          statTile({ value: String(total), label: 'ideas saved', icon: 'layers', hue: 'blue' }),
          statTile({ value: String(due), label: 'due now', icon: 'clock', hue: due ? 'violet' : 'green' }),
          statTile({ value: pct(total ? recallSum / total : 0), label: 'average recall', icon: 'review', hue: 'teal', sub: 'predicted right now' }),
          statTile({ value: String(longTerm), label: 'in long-term memory', icon: 'mountain', hue: 'orange', sub: 'lasting a month or more' }),
        ),
      ) : null,
      total ? h('section.section',
        sectionHead('Coming up'),
        h('div.panel', forecastChart(state, now)),
      ) : null,
      total ? h('section.section',
        sectionHead('Memory by course'),
        h('div.panel.memory-list', courseRows(state, now)),
      ) : null,
      h('section.section',
        sectionHead('Why review works'),
        h('div.panel.why-review',
          h('div.why-figure', curve.el),
          h('div.md',
            h('p', 'Without review, most of what you learn fades within days. Each time you successfully ', h('strong', 'recall'), ' an idea, two things happen: it snaps back to full strength, and it fades more slowly afterwards.'),
            h('p', 'So the gaps between reviews can grow: days, then weeks, then months. Learntopia tracks every idea you have saved and schedules it for the moment recall is predicted to drop to about ', h('strong', pct(state.settings.retention || 0.9)), '.'),
            h('p', h('a', { href: href('/learn/learning/forgetting-curve') }, 'Try the forgetting-curve lesson'), ' to play with this yourself.'),
          ),
        ),
      ),
    );
  },
};
