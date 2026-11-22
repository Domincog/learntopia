/** Course card used on the home and catalog screens. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { cover } from './covers.js';
import { bar, chip, plural } from './components.js';
import { icon } from './icon.js';
import { countLessons, courseMinutes, getCategory } from '../core/content.js';
import { courseProgress } from '../core/progress.js';
import { formatMinutes, clock } from '../core/dates.js';
import { store } from '../core/store.js';

export function courseCard(course, { compact = false } = {}) {
  const progress = courseProgress(store.state, course, clock.now());
  const category = getCategory(course.category);
  const lessons = countLessons(course);

  let footer;
  if (progress.complete) {
    footer = h('div.course-card-foot', chip('Completed', { icon: 'circle-check', hue: 'green' }));
  } else if (progress.started) {
    footer = h('div.course-card-foot',
      h('div.grow', bar(progress.pct, { thin: true, label: `${course.title} progress` })),
      h('span.small.faint.nowrap', `${progress.done}/${progress.total}`),
    );
  } else {
    footer = h('div.course-card-foot.small.faint',
      h('span.row', { style: { '--gap': '0.3rem' } }, icon('list', 15), plural(lessons, 'lesson')),
      h('span.row', { style: { '--gap': '0.3rem' } }, icon('clock', 15), formatMinutes(courseMinutes(course))),
    );
  }

  return h('a', {
    class: cx('card card-link course-card', `hue-${course.color || (category && category.color) || 'orange'}`, compact && 'is-compact'),
    href: href(`/course/${course.id}`),
  },
    h('div.course-card-cover', cover(course.cover)),
    h('div.course-card-body',
      h('div.eyebrow', category ? category.title : '', ' · ', course.level || 'Beginner'),
      h('h3.course-card-title', course.title),
      compact ? null : h('p.course-card-tagline', course.tagline),
      footer,
    ),
  );
}
