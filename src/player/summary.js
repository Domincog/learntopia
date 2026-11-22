/** End-of-session screens for lessons and reviews. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, relativeDays, formatMinutes } from '../core/dates.js';
import { todayRecord, streakStatus } from '../core/progress.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { ring, pct, plural } from '../ui/components.js';
import { mdInline } from '../core/markdown.js';
import { confetti } from '../core/confetti.js';
import { play } from '../core/audio.js';
import { config, editLink, supportLink } from '../config.js';

function statBox(value, label, ic, hue) {
  return h('div', { class: cx('summary-stat', `hue-${hue}`) },
    h('div.summary-stat-icon', icon(ic, 20)),
    h('div.summary-stat-value', value),
    h('div.summary-stat-label', label),
  );
}

function achievementRows(earned) {
  if (!earned || !earned.length) return null;
  return h('div.summary-card',
    h('div.eyebrow', earned.length === 1 ? 'Achievement unlocked' : 'Achievements unlocked'),
    earned.map((a) => h('div', { class: cx('ach-row', `hue-${a.hue}`) },
      h('div.ach-icon', icon(a.icon, 22)),
      h('div', h('div.ach-title', a.title), h('div.small.muted', a.desc)),
    )),
  );
}

function goalRow() {
  const state = store.state;
  const now = clock.now();
  const rec = todayRecord(state, now);
  const goal = state.profile.goal || 40;
  const streak = streakStatus(state, now);
  const met = rec.xp >= goal;
  return h('div.summary-card.summary-goal',
    ring({ pct: rec.xp / goal, size: 64, stroke: 8, hue: met ? 'green' : 'orange', label: met ? icon('check', { size: 24, stroke: 3 }) : h('strong', String(rec.xp)) }),
    h('div.grow',
      h('div.summary-goal-title', met ? 'Daily goal reached' : `${rec.xp} of ${goal} XP today`),
      h('div.small.muted', met ? 'Anything more today is a bonus. Rest is part of learning too.' : `${goal - rec.xp} XP to reach today’s goal.`),
    ),
    streak.current > 0 ? h('div.summary-streak', icon('flame', { size: 22, filled: true }), h('strong', String(streak.current)), h('span.tiny', streak.current === 1 ? 'day' : 'days')) : null,
  );
}

/**
 * @param {object} p
 * @param p.course, p.lesson (meta), p.lessonData ({ recap }), p.summary (from player),
 *        p.outcome (from finishLesson), p.bonusXp, p.earned (achievements), p.next (lesson meta|null),
 *        p.nextCourse (the course that follows in the learning path, offered after the last lesson)
 */
export function lessonSummary({ course, lesson, lessonData, summary, outcome, bonusXp, earned, next, nextCourse = null, onReplay }) {
  const totalXp = summary.xp + bonusXp;
  // Lessons marked tone: 'sober' (war, slavery, genocide) end quietly: no cheering, no confetti, no mascot.
  const sober = lessonData.tone === 'sober';
  const title = sober ? 'Lesson complete' : summary.perfect ? 'Flawless!' : summary.accuracy >= 0.65 ? 'Lesson complete!' : 'You made it through!';
  const sub = sober ? 'Thank you for giving this your full attention.' : summary.perfect
    ? 'Every answer right first time.'
    : summary.accuracy >= 0.65 ? 'Strong work. The ideas you wrestled with are the ones that will stick.'
      : 'That one fought back — which is exactly when the most learning happens.';

  setTimeout(() => { if (sober) play('step'); else { play('complete'); confetti({ count: summary.perfect ? 180 : 110 }); } }, 250);

  const recap = lessonData.recap && lessonData.recap.length
    ? h('div.summary-card',
      h('div.eyebrow', 'What you learned'),
      h('ul.summary-recap', lessonData.recap.map((r) => h('li', icon('check', { size: 18, stroke: 3 }), h('span', { html: mdInline(r) })))),
    ) : null;

  const memory = outcome.scheduled > 0
    ? h('div.summary-card.summary-memory',
      h('div.summary-memory-icon', icon('review', 24)),
      h('div',
        h('div.summary-goal-title', `${plural(outcome.scheduled, 'key idea')} saved for review`),
        h('div.small.muted', `First check-in ${relativeDays(outcome.nextDueDays || 1)}. Recalling an idea just as it starts to fade is what moves it into long-term memory.`),
      ),
    ) : null;

  return h('div.summary.rise-in',
    h('div.summary-hero',
      sober ? null : mascot(summary.perfect ? 'proud' : 'cheer', { size: 170 }),
      h('h1', title),
      h('p.muted', sub),
      h('p.small.faint', `${course.title} · ${lesson.title}`),
    ),
    h('div.summary-stats',
      statBox(`+${totalXp}`, 'XP earned', 'zap', 'yellow'),
      statBox(summary.graded ? pct(summary.accuracy) : '—', 'right first time', 'target', 'green'),
      statBox(formatMinutes(Math.max(1, summary.ms / 60000)), 'focused', 'clock', 'blue'),
    ),
    goalRow(),
    recap,
    memory,
    achievementRows(earned),
    lessonData.next ? h('p.summary-teaser', { html: mdInline(lessonData.next) }) : null,
    h('div.summary-actions',
      next
        ? h('a.btn.btn-primary.btn-lg', { href: href(`/learn/${course.id}/${next.id}`) }, `Next: ${next.title}`, icon('arrow-right', 20))
        : nextCourse
          ? h('a.btn.btn-primary.btn-lg', { href: href(`/course/${nextCourse.id}`) }, `Next course: ${nextCourse.title}`, icon('arrow-right', 20))
          : h('a.btn.btn-primary.btn-lg', { href: href(`/course/${course.id}`) }, 'Course complete — see overview', icon('trophy', 20)),
      h('div.row.row-wrap', { style: { justifyContent: 'center' } },
        h('a.btn.btn-ghost', { href: href(`/course/${course.id}`) }, 'Back to course'),
        h('a.btn.btn-ghost', { href: href('/') }, 'Home'),
        onReplay ? h('button.btn.btn-ghost', { type: 'button', onclick: onReplay }, icon('reset', 18), 'Practise again') : null,
      ),
      suggestEdit(course, lesson),
    ),
    next ? null : supportNote(course),
  );
}

/**
 * One quiet note about supporting the project, shown the first time the
 * learner reaches the end of a course and never in the middle of one. It sits
 * below every button, can be switched off for good on the spot (or in
 * Settings), and is absent when no support address is configured.
 */
function supportNote(course) {
  if (!supportLink()) return null;
  const state = store.state;
  const flag = `supportNote:${course.id}`;
  if (state.settings.supportNote === false || (state.flags && state.flags[flag])) return null;
  store.update((s) => { s.flags = s.flags || {}; s.flags[flag] = clock.now(); }, { silent: true });
  const el = h('aside.support-note', { 'aria-label': `Support ${config.name}` },
    h('span.support-note-icon', icon('heart', 20)),
    h('p', h('strong', `You finished ${course.title}. `), `${config.name} is free, with no ads. If it helped, you can help keep it going.`),
    h('div.support-note-actions',
      h('a.btn.btn-sm', { href: href('/support') }, 'See how'),
      h('button.btn.btn-sm.btn-ghost', {
        type: 'button',
        onclick: () => { store.update((s) => { s.settings.supportNote = false; }, { silent: true }); el.remove(); },
      }, 'Don’t show again'),
    ),
  );
  return el;
}

/** "Spotted a mistake?" link to this lesson's source file (only when a repository is configured). */
function suggestEdit(course, lesson) {
  const link = editLink(`content/courses/${course.id}/lessons/${lesson.id}.js`);
  if (!link) return null;
  return h('p.small.faint.center.summary-edit',
    'Spotted a mistake or a confusing step? ',
    h('a', { href: link, target: '_blank', rel: 'noopener noreferrer' }, 'Suggest an edit'), '.');
}

/**
 * @param {object} p
 * @param p.summary (from player), p.reviewed [{ ivl, correct }], p.earned, p.remaining (due count left)
 */
export function reviewSummary({ summary, reviewed, earned, remaining, practice }) {
  const recalled = summary.firstTry;
  const total = summary.graded;
  const title = total === 0 ? 'All done' : recalled === total ? 'Everything recalled!' : recalled / total >= 0.7 ? 'Review complete' : 'Tough round — well done for doing it';
  const soonest = reviewed.filter((r) => r.ivl).map((r) => r.ivl).sort((a, b) => a - b);
  const longest = soonest.length ? soonest[soonest.length - 1] : null;

  setTimeout(() => { play('complete'); if (total && recalled / total >= 0.7) confetti({ count: 90 }); }, 250);

  return h('div.summary.rise-in',
    h('div.summary-hero',
      mascot(recalled === total ? 'proud' : 'happy', { size: 150 }),
      h('h1', title),
      h('p.muted', practice
        ? 'Extra practice done. Items that were not due yet keep their schedule.'
        : 'Each recall just pushed these ideas further into long-term memory.'),
    ),
    h('div.summary-stats',
      statBox(`${recalled}/${total}`, 'recalled', 'review', 'violet'),
      statBox(`+${summary.xp}`, 'XP earned', 'zap', 'yellow'),
      statBox(longest ? relativeDays(longest).replace(/^in /, '') : '—', 'longest gap ahead', 'calendar', 'blue'),
    ),
    goalRow(),
    total > 0 && recalled < total ? h('div.summary-card',
      h('div.eyebrow', 'About the ones you missed'),
      h('p.small.muted', 'They will come back tomorrow. Forgetting is not failure — it is the signal the schedule uses to give an idea more attention.'),
    ) : null,
    achievementRows(earned),
    h('div.summary-actions',
      remaining > 0
        ? h('a.btn.btn-violet.btn-lg', { href: href('/review/session') + `?t=${Date.now()}` }, `Keep going (${remaining} more)`, icon('arrow-right', 20))
        : h('a.btn.btn-primary.btn-lg', { href: href('/') }, 'Done', icon('check', 20)),
      h('div.row.row-wrap', { style: { justifyContent: 'center' } },
        h('a.btn.btn-ghost', { href: href('/review') }, 'Review overview'),
        h('a.btn.btn-ghost', { href: href('/') }, 'Home'),
      ),
    ),
  );
}
