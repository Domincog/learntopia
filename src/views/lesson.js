/** Runs one lesson in the step player, then shows the summary. */
import { h, mount } from '../core/dom.js';
import { href, navigate } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, DAY_MS, relativeDays } from '../core/dates.js';
import { getCourse, getCourses, lessonMeta, loadLesson, nextLessonAfter, nextCourseAfter, lessonsOf, loadCardStep } from '../core/content.js';
import { lessonRecord, saveResume, clearResume, finishLesson, XP, dueCardIds, applyReview } from '../core/progress.js';
import { checkAchievements } from '../core/achievements.js';
import { createPlayer } from '../player/player.js';
import { lessonSummary } from '../player/summary.js';
import { mascot } from '../ui/mascot.js';
import { chip, loadingBlock } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import notFound from './notfound.js';

function introCard(course, lesson, number, total) {
  return h('article.step.lesson-intro.rise-in',
    mascot('happy', { size: 130 }),
    h('div.eyebrow', `${course.title} · Lesson ${number} of ${total}`),
    h('h2.intro-title', lesson.title),
    h('p.md', lesson.summary),
    h('div.row.row-wrap', { style: { justifyContent: 'center' } },
      chip(`about ${lesson.minutes || 8} min`, { icon: 'clock' }),
      chip('Hints when you want them', { icon: 'lightbulb' }),
      chip('Mistakes cost nothing', { icon: 'heart' }),
    ),
  );
}

function resumeCard(course, lesson, number, total, stepNumber, stepTotal, onRestart) {
  return h('article.step.lesson-intro.rise-in',
    mascot('wink', { size: 130 }),
    h('div.eyebrow', `${course.title} · Lesson ${number} of ${total}`),
    h('h2.intro-title', 'Welcome back'),
    h('p.md', `You were on step ${stepNumber} of ${stepTotal} in “${lesson.title}”. Pick up right where you stopped.`),
    h('div', h('button.link-btn', { type: 'button', onclick: onRestart }, 'Or start this lesson over')),
  );
}

function warmupCard(count, onSkip) {
  return h('article.step.lesson-intro.rise-in',
    mascot('think', { size: 130 }),
    h('div.eyebrow', 'Warm-up'),
    h('h2.intro-title', count === 1 ? 'One quick question first' : `${count} quick questions first`),
    h('p.md', 'From earlier in this course, and due for review today. Recalling them now makes the new lesson easier to build on.'),
    h('div', h('button.link-btn', { type: 'button', onclick: onSkip }, 'Skip the warm-up')),
  );
}

/** Up to two due review items from earlier lessons of the same course. */
async function warmupItems(courseId, lessonId) {
  if (store.state.settings.warmup === false) return [];
  const prefix = `${courseId}/`;
  const own = `${courseId}/${lessonId}/`;
  const ids = dueCardIds(store.state, clock.now()).filter((id) => id.startsWith(prefix) && !id.startsWith(own));
  const out = [];
  for (const id of ids) {
    if (out.length >= 2) break;
    const found = await loadCardStep(id);
    if (found) out.push(found);
  }
  return out;
}

export default {
  title: (ctx) => { const m = lessonMeta(ctx.params.courseId, ctx.params.lessonId); return m ? m.title : 'Lesson'; },
  focus: true,
  async render(ctx) {
    const { courseId, lessonId } = ctx.params;
    const course = getCourse(courseId);
    const meta = lessonMeta(courseId, lessonId);
    if (!course || !meta) return notFound.render(ctx);

    const root = h('div.lesson-root', loadingBlock('Loading lesson…'));
    let player = null;
    ctx.d(() => { if (player) player.destroy(); });

    let lesson;
    try {
      lesson = await loadLesson(courseId, lessonId);
    } catch (err) {
      console.error(err);
      return h('div.page.page-narrow', h('div.empty',
        mascot('oops', { size: 140 }),
        h('h1', 'This lesson could not be loaded'),
        h('p', 'It may not be published yet, or you may be offline.'),
        h('pre.code', { style: { maxWidth: '100%', textAlign: 'left', whiteSpace: 'pre-wrap' } }, String(err.message || err)),
        h('a.btn.btn-primary', { href: href(`/course/${courseId}`) }, 'Back to course'),
      ));
    }

    const list = lessonsOf(course);
    const number = list.findIndex((l) => l.id === lessonId) + 1;

    function finish(summary) {
      const at = clock.now();
      const bonusXp = XP.lessonDone + (summary.perfect ? XP.perfect : 0);
      const outcome = store.update((s) => finishLesson(s, at, {
        courseId, lessonId, accuracy: summary.accuracy, bonusXp,
        stepResults: summary.results.filter((r) => r.graded),
      }));
      const earned = store.update((s) => checkAchievements(s, at, getCourses()));
      if (outcome.levelUp) toast({ icon: 'zap', hue: 'yellow', title: `Level ${outcome.levelUp.to}: ${outcome.levelUp.title}`, duration: 4500 });
      if (outcome.goalMet) toast({ icon: 'target', hue: 'green', title: 'Daily goal reached' });
      if (player) { player.destroy(); player = null; }
      mount(root, h('div.player.is-summary', lessonSummary({
        course, lesson: meta, lessonData: lesson, summary, outcome, bonusXp, earned,
        next: nextLessonAfter(courseId, lessonId),
        nextCourse: nextCourseAfter(courseId),
        onReplay: () => run({ fresh: true }),
      })));
      window.scrollTo(0, 0);
    }

    function run({ fresh = false } = {}) {
      if (player) { player.destroy(); player = null; }
      const now = clock.now();
      if (fresh) store.update((s) => clearResume(s, courseId, lessonId), { silent: true });
      const rec = lessonRecord(store.state, courseId, lessonId);
      let resume = rec && rec.resume ? rec.resume : null;
      if (resume && (now - resume.at > 14 * DAY_MS || !(resume.pos > 0) || resume.pos >= lesson.steps.length)) resume = null;

      const seed = resume && resume.seed ? resume.seed : undefined;
      player = createPlayer({
        mode: 'lesson',
        label: meta.title,
        items: lesson.steps.map((step) => ({ step })),
        startIndex: resume ? resume.pos : 0,
        seed,
        initialResults: resume ? (resume.results || []) : [],
        intro: resume
          ? resumeCard(course, meta, number, list.length, resume.pos + 1, lesson.steps.length, () => run({ fresh: true }))
          : introCard(course, meta, number, list.length),
        onStepShown: ({ origin, pass, results }) => {
          if (pass !== 1 || !player) return;
          const snap = player.snapshot();
          store.update((s) => saveResume(s, courseId, lessonId, { pos: origin, results, seed: snap.seed, at: clock.now() }), { silent: true });
        },
        onExit: () => { store.flush(); navigate(`/course/${courseId}`); },
        onFinish: finish,
      });
      window.__lemmaPlayer = player; // handy for tools/smoke.mjs and debugging
      mount(root, player.el);
      window.scrollTo(0, 0);
    }

    /** Cumulative retrieval: start with a couple of due questions from earlier lessons. */
    function runWarmup(items) {
      const start = () => run();
      player = createPlayer({
        mode: 'review',
        label: 'Warm-up',
        items: items.map((q) => ({
          step: q.step,
          context: { cardId: q.cardId, courseId: q.course.id, courseTitle: q.course.title, lessonId: q.lesson.id, lessonTitle: q.lesson.title },
        })),
        intro: warmupCard(items.length, start),
        onResult: (item, result) => {
          if (!result.graded || !item.context) return null;
          const out = store.update((st) => applyReview(st, clock.now(), item.context.cardId, { correct: result.firstTry, hints: result.hints }));
          if (!out || !out.changed) return null;
          return { note: result.firstTry ? `Next check-in ${relativeDays(out.ivl)}` : 'Back tomorrow' };
        },
        onExit: () => { store.flush(); navigate(`/course/${courseId}`); },
        onFinish: start,
      });
      window.__lemmaPlayer = player;
      mount(root, player.el);
      window.scrollTo(0, 0);
    }

    const rec0 = lessonRecord(store.state, courseId, lessonId);
    const warm = rec0 && rec0.resume ? [] : await warmupItems(courseId, lessonId);
    if (warm.length) runWarmup(warm);
    else run();
    return root;
  },
};
