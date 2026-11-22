/** Home dashboard: what to do next, today's goal, reviews, puzzle, courses. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, greeting, formatDay, today, relativeDays, diffDays, dayKey } from '../core/dates.js';
import { getCourses, getCourse, lessonsOf, nextCourseAfter, prerequisitesOf } from '../core/content.js';
import { courseProgress, streakStatus, weekStrip, todayRecord, dueCount, reviewForecast, levelInfo } from '../core/progress.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { cover } from '../ui/covers.js';
import { ring, bar, sectionHead, plural } from '../ui/components.js';
import { courseCard } from '../ui/course-card.js';
import { hashString } from '../core/rng.js';
import { dailyPuzzleInfo } from '../puzzles/registry.js';

const TIPS = [
  'Short and often beats long and rare. Ten focused minutes a day really adds up.',
  'Getting stuck is not failing. The struggle is where the learning happens.',
  'Try to answer before you open a hint. Even a wrong guess primes your memory for the right one.',
  'Reviews feel harder than re-reading. That effort is exactly what makes them work.',
  'Sleep is when your brain files today’s lessons. Let it do its job.',
  'Explain an idea out loud as if teaching a friend. The gaps show up fast.',
  'Mixing topics feels messy, but it trains you to pick the right tool for a problem.',
  'Feeling certain and being right are different things. Check yourself often.',
  'A mistake you understand is worth more than a lucky right answer.',
  'Coming back after a break? Forgetting a little first makes the re-learning stick better.',
];

/**
 * Courses the learner has not started, best suggestions first:
 *   1. the next course in a path they have just finished a course of;
 *   2. courses they are ready for (nothing required, or everything required is done),
 *      their chosen interests first, then one per subject in turn for variety;
 *   3. the rest, in catalog order.
 */
function suggestCourses(state, now) {
  const courses = getCourses();
  const progressOf = new Map(courses.map((c) => [c.id, courseProgress(state, c, now)]));
  const fresh = courses.filter((c) => !progressOf.get(c.id).started);
  const isFresh = new Set(fresh.map((c) => c.id));
  const ready = (c) => prerequisitesOf(c).every((req) => progressOf.get(req.id).complete);

  const out = [];
  const take = (c) => { if (c && isFresh.has(c.id) && !out.includes(c)) out.push(c); };
  for (const c of courses) if (progressOf.get(c.id).complete) take(nextCourseAfter(c.id));

  const open = fresh.filter(ready);
  const interests = state.profile.interests || [];
  const liked = open.filter((c) => interests.includes(c.category) || c.category === 'meta');
  const other = open.filter((c) => !liked.includes(c));
  for (const group of [liked, other]) {
    // one course per subject in turn, so the list is not six courses from the same shelf
    const bySubject = new Map();
    for (const c of group) (bySubject.get(c.category) || bySubject.set(c.category, []).get(c.category)).push(c);
    for (let round = 0; bySubject.size; round++) {
      for (const [subject, list] of bySubject) {
        take(list.shift());
        if (!list.length) bySubject.delete(subject);
      }
      if (round > 50) break;
    }
  }
  fresh.forEach(take);
  return out;
}

function pickStartCourse(state) {
  const courses = getCourses();
  const now = clock.now();
  // 1. the course most recently touched that still has lessons left
  const recent = state.recent.course && getCourse(state.recent.course);
  if (recent) {
    const p = courseProgress(state, recent, now);
    if (!p.complete) return { course: recent, progress: p };
  }
  // 2. any started, unfinished course
  for (const course of courses) {
    const p = courseProgress(state, course, now);
    if (p.started && !p.complete) return { course, progress: p };
  }
  // 3. something new: the next course in a finished path, or one the learner is ready for and interested in
  const interests = state.profile.interests || [];
  const suggestions = suggestCourses(state, now);
  const preferred = suggestions.find((c) => interests.includes(c.category)) || suggestions[0];
  if (preferred) return { course: preferred, progress: courseProgress(state, preferred, now) };
  return null;
}

function heroCard(state) {
  const pick = pickStartCourse(state);
  if (!pick) {
    return h('div.card.hero-card.hue-green',
      h('div.hero-card-body',
        h('div.eyebrow', 'All caught up'),
        h('h2', 'You have finished every course!'),
        h('p.muted', 'Keep your knowledge fresh with reviews and puzzles — and check back for new courses.'),
        h('div', h('a.btn.btn-primary', { href: href('/review') }, 'Go to reviews', icon('arrow-right', 18))),
      ),
      h('div.hero-card-art', mascot('proud', { size: 150 })),
    );
  }
  const { course, progress } = pick;
  const lesson = progress.next;
  const list = lessonsOf(course);
  const idx = list.findIndex((l) => l.id === lesson.id);
  const rec = state.lessons[`${course.id}/${lesson.id}`];
  const resuming = !!(rec && rec.resume);
  return h('div', { class: cx('card hero-card', `hue-${course.color}`) },
    h('div.hero-card-body',
      h('div.eyebrow', progress.started ? (resuming ? 'Pick up where you left off' : 'Up next') : 'Start here'),
      h('h2', lesson.title),
      h('p.muted', lesson.summary),
      h('div.hero-card-meta',
        h('a.small', { href: href(`/course/${course.id}`) }, course.title),
        h('span.small.faint', ` · Lesson ${idx + 1} of ${list.length} · ${lesson.minutes || 8} min`),
      ),
      progress.started ? h('div', { style: { maxWidth: '320px' } }, bar(progress.pct, { label: 'Course progress' })) : null,
      h('div', h('a.btn.btn-primary.btn-lg', { href: href(`/learn/${course.id}/${lesson.id}`) },
        resuming ? 'Resume lesson' : progress.started ? 'Continue' : 'Start learning', icon('arrow-right', 20))),
    ),
    h('div.hero-card-art', cover(course.cover)),
  );
}

function goalCard(state, now) {
  const rec = todayRecord(state, now);
  const goal = state.profile.goal || 40;
  const streak = streakStatus(state, now);
  const strip = weekStrip(state, now);
  const met = rec.xp >= goal;
  return h('div.panel.today-card',
    h('div.row', { style: { '--gap': 'var(--s4)' } },
      ring({
        pct: rec.xp / goal, size: 84, stroke: 10, hue: met ? 'green' : 'orange',
        title: `${rec.xp} of ${goal} XP today`,
        label: met ? icon('check', { size: 30, stroke: 3 }) : h('div', h('div.ring-num', String(rec.xp)), h('div.tiny.faint', `/ ${goal} XP`)),
      }),
      h('div.grow',
        h('div.eyebrow', 'Today'),
        h('div.today-title', met ? 'Daily goal reached!' : rec.xp > 0 ? `${goal - rec.xp} XP to go` : 'Ready when you are'),
        h('div.small.muted', streak.current > 0
          ? `${streak.current}-day streak${streak.doneToday ? '' : ' — practise today to keep it'}`
          : 'Start a streak with one lesson'),
      ),
    ),
    h('div.week-strip', { role: 'list', 'aria-label': 'Last seven days' }, strip.map((d) =>
      h('div', { class: cx('week-day', `is-${d.status}`), role: 'listitem', 'aria-label': `${formatDay(d.key)}: ${d.status === 'done' ? d.xp + ' XP' : d.status}` },
        h('div.week-dot',
          d.status === 'done' ? icon('flame', { size: 16, filled: true })
            : d.status === 'rest' ? icon('coffee', 15) : null),
        h('div.week-label', d.label),
      ))),
    streak.rest > 0 ? h('div.tiny.faint.row', { style: { '--gap': '0.3rem' } }, icon('coffee', 14),
      `${plural(streak.rest, 'rest day')} banked — a missed day won’t break your streak`) : null,
  );
}

function reviewCard(state, now) {
  const due = dueCount(state, now);
  const total = Object.keys(state.cards).length;
  if (total === 0) {
    return h('div.panel.today-card',
      h('div.today-icon.hue-violet', icon('review', 24)),
      h('div.eyebrow', 'Review'),
      h('div.today-title', 'Nothing to review yet'),
      h('p.small.muted', 'Finish a lesson and its key ideas will come back here just before you would forget them.'),
    );
  }
  if (due === 0) {
    const fc = reviewForecast(state, now, 30);
    const nextIdx = fc.findIndex((n, i) => i > 0 && n > 0);
    return h('div.panel.today-card',
      h('div.today-icon.hue-green', icon('circle-check', 24)),
      h('div.eyebrow', 'Review'),
      h('div.today-title', 'All caught up'),
      h('p.small.muted', nextIdx > 0 ? `Next review ${relativeDays(nextIdx)}. Your memory is doing fine without you.` : 'No reviews scheduled in the next month.'),
      h('div', h('a.btn.btn-sm', { href: href('/review') }, 'Practise anyway')),
    );
  }
  const size = Math.min(due, state.settings.reviewSize || 10);
  return h('div.panel.today-card.is-hot',
    h('div.today-icon.hue-violet', icon('review', 24)),
    h('div.eyebrow', 'Review'),
    h('div.today-title', `${plural(due, 'idea')} ready to strengthen`),
    h('p.small.muted', `About ${Math.max(1, Math.round(size * 0.6))} min. Recalling them now is what moves them into long-term memory.`),
    h('div', h('a.btn.btn-violet', { href: href('/review/session') }, 'Start review', icon('arrow-right', 18))),
  );
}

function puzzleCard(state) {
  const info = dailyPuzzleInfo(today());
  const done = !!(state.puzzles.daily && state.puzzles.daily[today()]);
  return h('div.panel.today-card',
    h('div.today-icon.hue-teal', icon(info.icon || 'puzzle', 24)),
    h('div.eyebrow', 'Daily puzzle'),
    h('div.today-title', done ? 'Solved — see you tomorrow' : info.title),
    h('p.small.muted', done ? 'A new puzzle unlocks at midnight.' : info.blurb),
    h('div', h('a', { class: cx('btn', done ? 'btn-sm' : 'btn-blue'), href: href(`/puzzles/${info.id}?daily=1`) },
      done ? 'Play again' : 'Play today’s puzzle', done ? null : icon('arrow-right', 18))),
  );
}

export default {
  title: 'Home',
  live: true,
  render() {
    const state = store.state;
    const now = clock.now();
    const courses = getCourses();
    const inProgress = courses.filter((c) => {
      const p = courseProgress(state, c, now);
      return p.started && !p.complete;
    });
    const fresh = suggestCourses(state, now);
    const done = courses.filter((c) => courseProgress(state, c, now).complete);
    const name = state.profile.name ? `, ${state.profile.name}` : '';
    const tip = TIPS[hashString(today()) % TIPS.length];
    const level = levelInfo(state.xp);

    return h('div.page.home',
      h('header.home-head',
        h('div',
          h('div.eyebrow', formatDay(today())),
          h('h1', `${greeting(now)}${name}`),
        ),
        h('a.level-badge', { href: href('/profile'), 'aria-label': `Level ${level.level}, ${level.title}` },
          h('span.level-num', String(level.level)),
          h('span', h('span.level-title', level.title), h('span.level-xp', `${state.xp} XP`)),
        ),
      ),

      heroCard(state),

      h('section.section',
        h('div.today-grid', goalCard(state, now), reviewCard(state, now), puzzleCard(state)),
      ),

      inProgress.length ? h('section.section',
        sectionHead('Your courses'),
        h('div.grid.grid-auto', inProgress.map((c) => courseCard(c, { compact: true }))),
      ) : null,

      fresh.length ? h('section.section',
        sectionHead(inProgress.length ? 'Explore something new' : 'Pick a course', h('a.small', { href: href('/courses') }, 'See all')),
        h('div.grid.grid-auto', fresh.slice(0, 6).map((c) => courseCard(c))),
      ) : null,

      done.length ? h('section.section',
        sectionHead('Completed'),
        h('div.grid.grid-auto', done.map((c) => courseCard(c, { compact: true }))),
      ) : null,

      h('section.section',
        h('div.tip-card',
          mascot('wink', { size: 74, variant: 'face' }),
          h('div', h('div.eyebrow', 'Lem’s learning tip'), h('p', tip)),
        ),
      ),
    );
  },
};
