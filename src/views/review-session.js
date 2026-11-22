/**
 * A spaced-review session: a short, interleaved run of items the scheduler
 * says are about to be forgotten.
 *
 *   #/review/session                  due items (up to the session size)
 *   #/review/session?mode=practice    nothing due? practise the weakest items anyway
 *   #/review/session?course=algebra   only items from one course
 */
import { h, mount } from '../core/dom.js';
import { href, navigate } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, relativeDays } from '../core/dates.js';
import { getCourses, loadCardStep } from '../core/content.js';
import { dueCardIds, weakestCardIds, applyReview, dueCount, reviewForecast } from '../core/progress.js';
import { recallNow, interleave } from '../core/srs.js';
import { checkAchievements } from '../core/achievements.js';
import { createPlayer } from '../player/player.js';
import { reviewSummary } from '../player/summary.js';
import { mascot } from '../ui/mascot.js';
import { icon } from '../ui/icon.js';
import { loadingBlock } from '../ui/components.js';

async function buildQueue({ practice, courseId }) {
  const state = store.state;
  const now = clock.now();
  const size = state.settings.reviewSize || 10;
  let ids = practice ? weakestCardIds(state, now, size * 3) : dueCardIds(state, now);
  if (courseId) ids = ids.filter((id) => id.startsWith(`${courseId}/`));
  const picked = [];
  const orphans = [];
  // Load a few more than needed in case some cards point at content that has since changed.
  for (const id of ids) {
    if (picked.length >= size) break;
    const found = await loadCardStep(id);
    if (found) picked.push(found);
    else orphans.push(id);
  }
  if (orphans.length) {
    store.update((s) => { for (const id of orphans) delete s.cards[id]; }, { silent: true });
  }
  const ordered = interleave(picked.map((p) => ({
    id: p.cardId,
    group: `${p.course.id}/${p.lesson.id}`,
    r: recallNow(state.cards[p.cardId], now),
    item: p,
  })));
  return ordered.map((o) => o.item);
}

function emptyScreen({ practice }) {
  const state = store.state;
  const now = clock.now();
  const total = Object.keys(state.cards).length;
  const fc = reviewForecast(state, now, 60);
  const nextIdx = fc.findIndex((n, i) => i > 0 && n > 0);
  return h('div.page.page-narrow', h('div.empty',
    mascot(total ? 'proud' : 'happy', { size: 160 }),
    h('h1', total ? (practice ? 'Nothing to practise yet' : 'All caught up') : 'Nothing to review yet'),
    h('p', total
      ? (nextIdx > 0 ? `Your next review is ${relativeDays(nextIdx)}. Until then, your memory is doing fine on its own.` : 'No reviews are scheduled soon.')
      : 'Finish a lesson and its key ideas will show up here, timed to arrive just before you would forget them.'),
    h('div.row.row-wrap', { style: { justifyContent: 'center' } },
      total && !practice ? h('a.btn', { href: href('/review/session?mode=practice') }, icon('dumbbell', 18), 'Practise anyway') : null,
      h('a.btn.btn-primary', { href: href('/courses') }, 'Learn something new', icon('arrow-right', 18)),
    ),
  ));
}

export default {
  title: 'Review',
  focus: true,
  async render(ctx) {
    const practice = ctx.query.mode === 'practice';
    const courseId = ctx.query.course || null;
    const root = h('div.lesson-root', loadingBlock('Gathering what is due…'));
    let player = null;
    ctx.d(() => { if (player) player.destroy(); });

    const queue = await buildQueue({ practice, courseId });
    if (!queue.length) {
      document.body.classList.remove('mode-focus');
      return emptyScreen({ practice });
    }

    const reviewed = [];
    player = createPlayer({
      mode: 'review',
      label: 'Review',
      confidence: store.state.settings.confidence !== false,
      items: queue.map((q) => ({
        step: q.step,
        context: { cardId: q.cardId, courseId: q.course.id, courseTitle: q.course.title, lessonId: q.lesson.id, lessonTitle: q.lesson.title },
      })),
      onResult: (item, result) => {
        if (!result.graded || !item.context) return null;
        const out = store.update((s) => applyReview(s, clock.now(), item.context.cardId, {
          correct: result.firstTry, confidence: result.confidence, hints: result.hints,
        }));
        if (!out) return null;
        reviewed.push({ correct: result.firstTry, ivl: out.ivl, changed: out.changed });
        if (!out.changed) return { note: 'Not due yet — schedule unchanged' };
        return { note: result.firstTry ? `Next check-in ${relativeDays(out.ivl)}` : 'Back tomorrow' };
      },
      onExit: () => { store.flush(); navigate('/review'); },
      onFinish: (summary) => {
        const now = clock.now();
        const earned = store.update((s) => checkAchievements(s, now, getCourses()));
        if (player) { player.destroy(); player = null; }
        mount(root, h('div.player.is-summary', reviewSummary({
          summary, reviewed, earned, practice,
          remaining: practice ? 0 : dueCount(store.state, now),
        })));
        window.scrollTo(0, 0);
      },
    });
    window.__lemmaPlayer = player;
    mount(root, player.el);
    return root;
  },
};
