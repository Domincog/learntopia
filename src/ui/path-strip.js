/** A learning path drawn as a numbered row of courses, from beginner to advanced. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, formatMinutes } from '../core/dates.js';
import { getCourse, countLessons, courseMinutes } from '../core/content.js';
import { courseProgress } from '../core/progress.js';
import { cover } from './covers.js';
import { chip, plural } from './components.js';
import { icon } from './icon.js';

export const LEVEL_HUE = { Beginner: 'green', Intermediate: 'yellow', Advanced: 'red' };

/** A small coloured label for a course level. */
export const levelChip = (level) => chip(level || 'Beginner', { hue: LEVEL_HUE[level] || 'green' });

function pathCourse(course, number, state, now, hereLabel) {
  const progress = courseProgress(state, course, now);
  const isNext = !!hereLabel;
  const status = progress.complete
    ? h('span.path-status', icon('circle-check', 15), 'Completed')
    : progress.started
      ? h('span.path-status', `${progress.done} of ${progress.total} lessons`)
      : h('span.path-status', plural(countLessons(course), 'lesson'), ' · ', formatMinutes(courseMinutes(course)));
  return h('li', { class: cx('path-step', progress.complete && 'is-done', isNext && 'is-next') },
    h('a', { class: cx('card card-link path-course', `hue-${course.color || 'orange'}`), href: href(`/course/${course.id}`) },
      h('span.path-cover', cover(course.cover)),
      h('span.path-body',
        h('span.path-eyebrow', `Course ${number}`, isNext ? h('span.path-here', hereLabel) : null),
        h('span.path-title', course.title),
        h('span.path-meta', levelChip(course.level), status),
      ),
    ),
  );
}

/**
 * One path: heading, how far the learner has come, and its courses in order.
 * Once the learner has begun a path, the course they are part-way through (or, failing that,
 * the first one not finished) is marked as the place to continue. An untouched path carries no mark: "Course 1" already says where to begin.
 */
export function pathStrip(path) {
  const state = store.state;
  const now = clock.now();
  const courses = path.courses.map(getCourse).filter(Boolean);
  const progress = courses.map((c) => courseProgress(state, c, now));
  const done = progress.filter((p) => p.complete).length;
  const begun = progress.some((p) => p.started || p.complete);
  const underWay = progress.findIndex((p) => p.started && !p.complete);
  const nextIndex = !begun ? -1 : underWay >= 0 ? underWay : progress.findIndex((p) => !p.complete);
  const hereLabel = (i) => (i !== nextIndex ? null : progress[i].started ? 'Continue here' : 'Next up');
  return h('section', { class: cx('path-block', `hue-${path.color || 'orange'}`), id: `path-${path.id}`, 'aria-label': `${path.title} path` },
    h('div.path-head',
      h('span.cat-icon', icon(path.icon || 'route', 20)),
      h('div.grow', h('h2', path.title), h('p.small.muted', path.blurb)),
      h('span.small.muted.nowrap', done ? `${done} of ${courses.length} courses done` : plural(courses.length, 'course')),
    ),
    h('ol.path-steps', courses.map((c, i) => pathCourse(c, i + 1, state, now, hereLabel(i)))),
  );
}
