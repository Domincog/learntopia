/**
 * Developer tools (not linked from the main navigation):
 *
 *   #/dev                 index
 *   #/dev/steps           play the sample lesson that uses every step type
 *   #/dev/lesson?course=ID&lesson=ID&step=N   preview a real lesson from step N, a number or a step id (nothing is saved)
 *   #/dev/widgets         gallery of widget examples
 *   #/dev/time            shift the app clock to test spaced review
 */
import { h, mount } from '../core/dom.js';
import { href, navigate } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, formatDay, today } from '../core/dates.js';
import { getCourses, lessonsOf, loadLesson } from '../core/content.js';
import { normalizeLesson } from '../player/normalize.js';
import { createPlayer } from '../player/player.js';
import { dueCount } from '../core/progress.js';
import { toast } from '../ui/toast.js';

function previewPlayer(ctx, lesson, startIndex, back) {
  const root = h('div');
  let player = null;
  const run = () => {
    if (player) player.destroy();
    player = createPlayer({
      mode: 'preview',
      label: 'Preview',
      items: lesson.steps.map((step) => ({ step })),
      startIndex,
      onExit: () => navigate(back),
      onFinish: (summary) => {
        if (player) player.destroy();
        player = null;
        mount(root, h('div.page.page-narrow', h('div.empty',
          h('h1', 'Preview finished'),
          h('p', `${summary.firstTry} of ${summary.graded} graded steps right first time. Nothing was saved.`),
          h('div.row', h('button.btn.btn-primary', { type: 'button', onclick: run }, 'Run again'), h('a.btn', { href: href(back) }, 'Back')),
        )));
      },
    });
    window.__lemmaPlayer = player;
    mount(root, player.el);
  };
  ctx.d(() => { if (player) player.destroy(); });
  run();
  return root;
}

async function stepsTool(ctx) {
  const { sampleLesson } = await import('../dev/samples.js');
  const lesson = normalizeLesson(sampleLesson, 'dev', 'samples');
  return previewPlayer(ctx, lesson, startAt(lesson, ctx.query.step), '/dev');
}

/** `step` may be a 1-based number or a step id; anything else starts at the beginning. */
function startAt(lesson, step) {
  if (step == null || step === '') return 0;
  const byId = lesson.steps.findIndex((s) => s.id === step);
  if (byId >= 0) return byId;
  const n = Number(step);
  return Number.isInteger(n) ? Math.min(Math.max(0, n - 1), lesson.steps.length - 1) : 0;
}

async function lessonTool(ctx) {
  const { course, lesson, step } = ctx.query;
  if (!course || !lesson) return h('div.page', h('p', 'Usage: #/dev/lesson?course=ID&lesson=ID&step=N (N is a step number or a step id)'));
  const data = await loadLesson(course, lesson);
  return previewPlayer(ctx, data, startAt(data, step), '/dev');
}

async function widgetsTool() {
  const { widgetExamples } = await import('../dev/widget-examples.js');
  const { createWidget } = await import('../widgets/index.js');
  // Central examples for the core widgets, plus every widget module's own `examples` export.
  const all = widgetExamples.slice();
  let names = [];
  try { names = (await import('../dev/widget-list.js')).WIDGETS; } catch { /* list not generated yet */ }
  for (const name of names) {
    try {
      const mod = await import(`../widgets/${name}.js`);
      (mod.examples || []).forEach((ex, i) => all.push({ id: `${name}-${i + 1}`, title: ex.title || name, note: ex.note, spec: ex.spec }));
    } catch (err) {
      console.error('[gallery] could not load widget', name, err);
    }
  }
  const types = Array.from(new Set(all.map((ex) => ex.spec.type))).sort();
  const page = h('div.page',
    h('a.back-link', { href: href('/dev') }, '← Dev tools'),
    h('h1', 'Widget gallery'),
    h('p.muted', `${all.length} examples of ${types.length} widgets. Specs are documented in docs/WIDGETS.md and in each widget's source file.`),
    h('p.small', { style: { marginTop: 'var(--s3)' } }, types.map((t, i) => [i ? ' · ' : '', h('a', { href: `#w-type-${t}`, onclick: (ev) => { ev.preventDefault(); const el = document.querySelector(`[data-widget="${t}"]`); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }, t)])),
  );
  for (const ex of all) {
    const stateOut = h('pre.code', { style: { fontSize: '0.75rem', whiteSpace: 'pre-wrap' } }, '(interact to see state)');
    const w = await createWidget(ex.spec, { onChange: (state) => { stateOut.textContent = JSON.stringify(state); } });
    stateOut.textContent = JSON.stringify(w.getState());
    page.appendChild(h('section.section', { id: `w-${ex.id}`, dataset: { widget: ex.spec.type } },
      h('h2', ex.title),
      ex.note ? h('p.muted', ex.note) : null,
      h('div.panel', { style: { marginTop: 'var(--s3)' } }, h('div.step-figure', w.el)),
      h('details', { style: { marginTop: 'var(--s2)' } },
        h('summary.small.muted', 'Spec & state'),
        h('pre.code', { style: { fontSize: '0.75rem', whiteSpace: 'pre-wrap' } }, JSON.stringify(ex.spec, (k, v) => (typeof v === 'function' ? `[function ${v.name || ''}]` : v), 2)),
        stateOut,
      ),
    ));
  }
  return page;
}

function timeTool(ctx) {
  const info = h('div');
  const draw = () => mount(info,
    h('p', 'App date: ', h('strong', formatDay(today())), ` (offset ${clock.offsetDays()} days)`),
    h('p', `Reviews due now: ${dueCount(store.state, clock.now())}`),
  );
  const jump = (days) => () => { clock.travel(days); draw(); toast(`Moved ${days > 0 ? 'forward' : 'back'} ${Math.abs(days)} day(s)`); };
  draw();
  void ctx;
  return h('div.page.page-narrow',
    h('a.back-link', { href: href('/dev') }, '← Dev tools'),
    h('h1', 'Time travel'),
    h('p.muted', 'Shifts the clock used by streaks and the review scheduler, for this browser tab only.'),
    h('div.panel.stack', { style: { marginTop: 'var(--s4)' } },
      info,
      h('div.row.row-wrap',
        h('button.btn', { type: 'button', onclick: jump(1) }, '+1 day'),
        h('button.btn', { type: 'button', onclick: jump(3) }, '+3 days'),
        h('button.btn', { type: 'button', onclick: jump(7) }, '+1 week'),
        h('button.btn', { type: 'button', onclick: jump(30) }, '+30 days'),
        h('button.btn.btn-ghost', { type: 'button', onclick: () => { clock.reset(); draw(); } }, 'Reset'),
      ),
    ),
  );
}

function indexTool() {
  const lessons = [];
  for (const course of getCourses()) {
    for (const l of lessonsOf(course)) lessons.push(h('li', h('a', { href: href(`/dev/lesson?course=${course.id}&lesson=${l.id}`) }, `${course.title} — ${l.title}`)));
  }
  return h('div.page.page-narrow',
    h('h1', 'Developer tools'),
    h('p.muted', 'Handy when writing lessons or widgets. Previews never touch saved progress.'),
    h('div.panel.stack', { style: { marginTop: 'var(--s4)' } },
      h('ul.md',
        h('li', h('a', { href: href('/dev/steps') }, 'Step sampler'), ' — every step type in one lesson'),
        h('li', h('a', { href: href('/dev/widgets') }, 'Widget gallery'), ' — every widget with an example spec'),
        h('li', h('a', { href: href('/dev/time') }, 'Time travel'), ' — test streaks and spaced review'),
      ),
    ),
    h('h2', { style: { marginTop: 'var(--s8)' } }, 'Preview a lesson'),
    h('ul.md', { style: { marginTop: 'var(--s3)' } }, lessons),
  );
}

export default {
  title: 'Dev tools',
  render(ctx) {
    document.body.classList.toggle('mode-focus', ctx.params.tool === 'steps' || ctx.params.tool === 'lesson');
    switch (ctx.params.tool) {
      case 'steps': return stepsTool(ctx);
      case 'lesson': return lessonTool(ctx);
      case 'widgets': return widgetsTool(ctx);
      case 'time': return timeTool(ctx);
      default: return indexTool(ctx);
    }
  },
};
