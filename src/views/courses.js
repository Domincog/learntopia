/** Course catalog with subject filters and search across courses and lessons. */
import { h, cx, mount } from '../core/dom.js';
import { getCourses, getCategories, getPaths, lessonsOf } from '../core/content.js';
import { courseCard } from '../ui/course-card.js';
import { pathStrip } from '../ui/path-strip.js';
import { segmented } from '../ui/components.js';
import { icon } from '../ui/icon.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { isLessonDone } from '../core/progress.js';

const norm = (text) => String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

function searchResults(query) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  const hit = (text) => { const t = norm(text); return words.every((w) => t.includes(w)); };
  const courses = [];
  const lessons = [];
  for (const course of getCourses()) {
    if (hit(`${course.title} ${course.tagline} ${course.description} ${(course.outcomes || []).join(' ')}`)) courses.push(course);
    for (const lesson of lessonsOf(course)) {
      if (hit(`${lesson.title} ${lesson.summary}`)) lessons.push({ course, lesson });
    }
  }
  return { courses, lessons };
}

export default {
  title: 'Courses',
  render(ctx) {
    const categories = getCategories().filter((cat) => getCourses().some((c) => c.category === cat.id));
    let selected = ctx.query.cat && categories.some((c) => c.id === ctx.query.cat) ? ctx.query.cat : 'all';
    const paths = getPaths();
    // Two ways to look at the catalog: paths (what to take, in what order) or every course by subject.
    let view = paths.length && ctx.query.view !== 'all' && !ctx.query.cat ? 'paths' : 'all';
    let query = '';
    const list = h('div');
    const filterButtons = [];
    const inPath = new Set(paths.flatMap((p) => p.courses));

    function draw() {
      if (query.trim()) {
        const { courses, lessons } = searchResults(query);
        if (!courses.length && !lessons.length) {
          mount(list, h('div.empty', h('h2', 'Nothing matches that'), h('p', 'Try a different word, such as “slope”, “primes” or “loops”.')));
          return;
        }
        mount(list,
          courses.length ? h('section.section', h('div.section-head', h('h2', 'Courses')), h('div.grid.grid-auto', courses.map((c) => courseCard(c)))) : null,
          lessons.length ? h('section.section',
            h('div.section-head', h('h2', 'Lessons')),
            h('div.panel.search-lessons', lessons.slice(0, 30).map(({ course, lesson }) => h('a', { class: cx('search-lesson', `hue-${course.color}`), href: href(`/learn/${course.id}/${lesson.id}`) },
              h('span.search-dot', isLessonDone(store.state, course.id, lesson.id) ? icon('check', { size: 14, stroke: 3 }) : null),
              h('span.grow', h('strong', lesson.title), h('span.small.muted', ` · ${course.title}`), h('div.small.muted', lesson.summary)),
              icon('chevron-right', 18),
            ))),
          ) : null,
        );
        return;
      }
      if (view === 'paths') {
        // Courses outside every path: the "start here" ones lead the page, any others close it.
        const loose = getCourses().filter((c) => !inPath.has(c.id));
        const first = loose.filter((c) => c.category === 'meta');
        const others = loose.filter((c) => c.category !== 'meta');
        mount(list, h('div.paths',
          first.length ? h('section.path-block',
            h('div.path-head', h('div.grow', h('h2', 'Start here'), h('p.small.muted', 'Short, and it makes every other course work better.'))),
            h('div.grid.grid-auto', first.map((c) => courseCard(c, { compact: true }))),
          ) : null,
          h('p.paths-intro', 'Each path below runs from first steps to advanced ideas. Follow one in order, or jump in wherever you like: nothing is locked.'),
          paths.map((p) => pathStrip(p)),
          others.length ? h('section.path-block',
            h('div.path-head', h('div.grow', h('h2', 'Good to take at any point'))),
            h('div.grid.grid-auto', others.map((c) => courseCard(c))),
          ) : null,
        ));
        return;
      }
      const shown = selected === 'all' ? categories : categories.filter((c) => c.id === selected);
      mount(list, shown.map((cat) => {
        const courses = getCourses().filter((c) => c.category === cat.id);
        return h('section.section',
          h('div.section-head',
            h('div', { class: cx('cat-head', `hue-${cat.color}`) },
              h('span.cat-icon', icon(cat.icon, 20)),
              h('div', h('h2', cat.title), h('p.small.muted', cat.blurb)),
            ),
          ),
          h('div.grid.grid-auto', courses.map((c) => courseCard(c))),
        );
      }));
    }

    const search = h('input.input.search-input', { type: 'search', placeholder: 'Search courses and lessons', 'aria-label': 'Search courses and lessons', autocomplete: 'off' });
    search.addEventListener('input', () => { query = search.value; draw(); });

    const filters = h('div.filters', { role: 'group', 'aria-label': 'Filter by subject' },
      [{ id: 'all', title: 'All subjects' }, ...categories].map((cat) => {
        const btn = h('button.filter', { type: 'button', 'aria-pressed': String(cat.id === selected) }, cat.icon ? icon(cat.icon, 16) : null, cat.title);
        btn.addEventListener('click', () => {
          selected = cat.id;
          history.replaceState(null, '', href(cat.id === 'all' ? '/courses?view=all' : `/courses?cat=${cat.id}`));
          filterButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', 'true');
          search.value = '';
          query = '';
          draw();
        });
        filterButtons.push(btn);
        return btn;
      }),
    );

    const setView = (next) => {
      view = next;
      filters.hidden = view !== 'all';
      history.replaceState(null, '', href(view === 'all' ? (selected === 'all' ? '/courses?view=all' : `/courses?cat=${selected}`) : '/courses'));
      search.value = '';
      query = '';
      draw();
    };
    const viewSwitch = paths.length ? h('div.view-switch', segmented({
      label: 'How to show the courses',
      value: view,
      options: [{ value: 'paths', label: 'Learning paths', icon: 'route' }, { value: 'all', label: 'All courses by subject', icon: 'library' }],
      onChange: setView,
    })) : null;
    filters.hidden = view !== 'all';

    draw();
    return h('div.page',
      h('header.page-head',
        h('h1', 'Courses'),
        h('p', 'Every course is a series of short, hands-on lessons. Start anywhere: nothing is locked.'),
      ),
      h('div.search-row', h('span.search-icon', icon('search', 18)), search),
      viewSwitch,
      filters,
      list,
    );
  },
};
