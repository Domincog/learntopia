/** Course page: overview, outcomes and the lesson path. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, formatMinutes } from '../core/dates.js';
import { getCourse, getCategory, lessonsOf, countLessons, courseMinutes, pathOf, prerequisitesOf } from '../core/content.js';
import { courseProgress, lessonRecord, lessonStrength, strengthLabel } from '../core/progress.js';
import { icon } from '../ui/icon.js';
import { cover } from '../ui/covers.js';
import { bar, chip, plural, pct } from '../ui/components.js';
import { courseCard } from '../ui/course-card.js';
import { levelChip } from '../ui/path-strip.js';
import notFound from './notfound.js';

const STRENGTH_HUE = { strong: 'green', good: 'teal', fading: 'yellow', weak: 'red' };

function lessonRow(course, lesson, number, state, now, isNext) {
  const rec = lessonRecord(state, course.id, lesson.id);
  const done = !!(rec && rec.done > 0);
  const resuming = !!(rec && rec.resume);
  const strength = done ? lessonStrength(state, course.id, lesson.id, now) : null;
  const sl = strengthLabel(strength);

  const node = h('div', { class: cx('trail-node', done && 'is-done', isNext && 'is-next', resuming && 'is-resume') },
    done ? icon('check', { size: 22, stroke: 3 }) : resuming ? icon('play', { size: 18, filled: true }) : String(number));

  return h('li', { class: cx('trail-item', isNext && 'is-next') },
    node,
    h('a.card.card-link.trail-card', { href: href(`/learn/${course.id}/${lesson.id}`) },
      h('div.grow',
        h('div.trail-title', lesson.title),
        h('div.small.muted', lesson.summary),
        h('div.trail-meta',
          h('span.small.faint.row', { style: { '--gap': '0.3rem' } }, icon('clock', 14), `${lesson.minutes || 8} min`),
          resuming ? chip('In progress', { hue: 'orange' }) : null,
          sl ? chip(`Memory: ${sl.label}`, { hue: STRENGTH_HUE[sl.key], icon: 'review', title: `Predicted recall ${pct(strength)}` }) : null,
          done && rec.best >= 1 ? chip('Perfect', { hue: 'yellow', icon: 'star' }) : null,
        ),
      ),
      h('span.trail-cta', isNext ? h('span.btn.btn-primary.btn-sm', resuming ? 'Resume' : done ? 'Again' : 'Start') : icon('chevron-right', 22)),
    ),
  );
}

export default {
  title: (ctx) => { const c = getCourse(ctx.params.courseId); return c ? c.title : 'Course'; },
  live: true,
  render(ctx) {
    const course = getCourse(ctx.params.courseId);
    if (!course) return notFound.render(ctx);
    const state = store.state;
    const now = clock.now();
    const category = getCategory(course.category);
    const progress = courseProgress(state, course, now);
    const next = progress.next;
    let number = 0;

    // Where this course sits in its learning path, and what it builds on.
    const place = pathOf(course.id);
    const builds = prerequisitesOf(course);
    const nextCourse = place && place.next;
    const pathLine = place ? h('div.course-path',
      icon('route', 16),
      h('span', `Course ${place.index + 1} of ${place.total} in the `, h('a', { href: href('/courses') }, `${place.path.title} path`)),
    ) : null;
    const buildsLine = builds.length ? h('div.course-builds',
      h('span', 'Builds on'),
      builds.map((c) => {
        const finished = courseProgress(state, c, now).complete;
        return h('a', { class: cx('chip', finished ? 'chip-green' : 'chip-outline'), href: href(`/course/${c.id}`), title: finished ? 'You have completed this course' : 'Open this course' },
          finished ? icon('circle-check', 14) : null, c.title);
      }),
    ) : null;

    const cta = progress.complete
      ? h('a.btn.btn-lg', { href: href('/review') }, icon('review', 20), 'Review this course')
      : h('a.btn.btn-primary.btn-lg', { href: href(`/learn/${course.id}/${next.id}`) },
        progress.started ? 'Continue' : 'Start course', icon('arrow-right', 20));

    return h('div', { class: cx('page course-page', `hue-${course.color}`) },
      h('a.back-link', { href: href('/courses') }, icon('arrow-left', 18), 'All courses'),
      h('header.course-hero',
        h('div.course-hero-body',
          h('div.row.row-wrap', { style: { '--gap': 'var(--s3)' } },
            h('div.eyebrow', category ? category.title : ''),
            levelChip(course.level),
          ),
          h('h1', course.title),
          h('p.course-desc', course.description),
          pathLine,
          buildsLine,
          h('div.row.row-wrap.small.muted', { style: { '--gap': 'var(--s4)' } },
            h('span.row', { style: { '--gap': '0.35rem' } }, icon('list', 16), plural(countLessons(course), 'lesson')),
            h('span.row', { style: { '--gap': '0.35rem' } }, icon('clock', 16), `about ${formatMinutes(courseMinutes(course))}`),
            progress.strength != null ? h('span.row', { style: { '--gap': '0.35rem' } }, icon('review', 16), `memory ${pct(progress.strength)}`) : null,
          ),
          progress.started ? h('div.course-progress',
            bar(progress.pct, { label: 'Course progress' }),
            h('span.small.muted.nowrap', `${progress.done} of ${progress.total} done`),
          ) : null,
          h('div', cta),
        ),
        h('div.course-hero-art', cover(course.cover)),
      ),

      course.outcomes && course.outcomes.length ? h('section.section.outcomes',
        h('h2', 'By the end you will be able to'),
        h('ul', course.outcomes.map((o) => h('li', icon('circle-check', 20), h('span', o)))),
      ) : null,

      h('section.section',
        course.chapters.map((chapter, ci) => h('div.chapter',
          h('div.chapter-head',
            h('span.chapter-num', `Part ${ci + 1}`),
            h('h2', chapter.title),
          ),
          h('ol.trail', chapter.lessons.map((lesson) => {
            number += 1;
            return lessonRow(course, lesson, number, state, now, !!next && next.id === lesson.id && !progress.complete);
          })),
        )),
      ),

      nextCourse ? h('section.section.course-next',
        h('h2', progress.complete ? 'Ready for the next one?' : `Next in the ${place.path.title} path`),
        h('div.grid', courseCard(nextCourse, { compact: true })),
      ) : null,
    );
  },
};
