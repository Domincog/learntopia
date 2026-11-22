/** Puzzle hub: today's daily puzzle and the arcade. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { today, formatDay, lastDays } from '../core/dates.js';
import { PUZZLES, dailyPuzzleInfo } from '../puzzles/registry.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { sectionHead, plural } from '../ui/components.js';

export default {
  title: 'Puzzles',
  live: true,
  render() {
    const state = store.state;
    const day = today();
    const daily = dailyPuzzleInfo(day);
    const done = !!state.puzzles.daily[day];
    const week = lastDays(7, day);
    let run = 0;
    for (let i = week.length - 1; i >= 0; i--) {
      if (state.puzzles.daily[week[i]]) run++;
      else if (i !== week.length - 1) break;
    }

    return h('div.page',
      h('header.page-head',
        h('h1', 'Puzzles'),
        h('p', 'A different kind of practice: no lesson, no right method, just a problem to think your way through.'),
      ),

      h('div', { class: cx('card daily-card', `hue-${daily.hue}`) },
        h('div.daily-body',
          h('div.eyebrow', `Daily puzzle · ${formatDay(day)}`),
          h('h2', daily.title),
          h('p.muted', done ? 'Solved. A new puzzle arrives at midnight — the same one for everybody.' : daily.blurb),
          h('div.week-strip.daily-week', week.map((key) => h('div', { class: cx('week-day', state.puzzles.daily[key] ? 'is-done' : key === day ? 'is-today' : 'is-missed') },
            h('div.week-dot', state.puzzles.daily[key] ? icon('check', { size: 16, stroke: 3 }) : null),
            h('div.week-label', formatDay(key).slice(0, 2)),
          ))),
          h('div', h('a', { class: cx('btn btn-lg', done ? '' : 'btn-primary'), href: href(`/puzzles/${daily.id}?daily=1`) },
            done ? 'Play it again' : 'Play today’s puzzle', icon('arrow-right', 20))),
        ),
        h('div.daily-art', mascot(done ? 'proud' : 'think', { size: 150 })),
      ),

      h('section.section',
        sectionHead('Arcade', h('span.small.muted', 'Fresh puzzle every time')),
        h('div.grid.grid-auto', PUZZLES.map((p) => {
          const st = state.puzzles[p.id] || {};
          return h('a', { class: cx('card card-link arcade-card', `hue-${p.hue}`), href: href(`/puzzles/${p.id}`) },
            h('div.arcade-icon', icon(p.icon, 28)),
            h('h3', p.title),
            h('p.small.muted', p.blurb),
            h('div.small.faint', p.skills, st.solved ? ` · ${plural(st.solved, 'solve')}` : ''),
          );
        })),
      ),

      h('section.section',
        h('div.tip-card',
          mascot('wink', { size: 74, variant: 'face' }),
          h('div', h('div.eyebrow', 'Why puzzles?'),
            h('p', 'Puzzles train you to stay with a problem when the next step is not obvious. That patience is the single most transferable skill in mathematics and science.')),
        ),
      ),
    );
  },
};
