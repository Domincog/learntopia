/**
 * First-visit page: says what this is, then a three-question setup
 * (name, interests, daily goal) that ends inside the first lesson.
 */
import { h, cx, mount } from '../core/dom.js';
import { href, navigate } from '../core/router.js';
import { store } from '../core/store.js';
import { config, repoLink } from '../config.js';
import { getCategories, getCourses, countLessons, lessonsOf } from '../core/content.js';
import { GOALS } from '../core/progress.js';
import { icon } from '../ui/icon.js';
import { mascot, brandMark } from '../ui/mascot.js';
import { cover } from '../ui/covers.js';
import { play } from '../core/audio.js';
import { toast } from '../ui/toast.js';

function firstLessonFor(interests) {
  const courses = getCourses();
  const course = courses.find((c) => interests.includes(c.category)) || courses[0];
  if (!course) return '/courses';
  const first = lessonsOf(course)[0];
  return first ? `/learn/${course.id}/${first.id}` : `/course/${course.id}`;
}

function setupWizard(root) {
  const draft = { name: '', interests: [], goal: 40 };
  let stepIdx = 0;

  const steps = [
    () => {
      const input = h('input.input', {
        type: 'text', maxlength: 24, placeholder: 'Your first name (optional)', autocomplete: 'given-name',
        value: draft.name, 'aria-label': 'Your first name',
      });
      input.addEventListener('input', () => { draft.name = input.value.trim(); });
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') next(); });
      setTimeout(() => input.focus(), 60);
      return {
        mood: 'happy',
        title: `Hi! I’m ${config.mascot}. What should I call you?`,
        note: 'This stays on your device. There is no account and nothing to sign up for.',
        body: input,
      };
    },
    () => {
      // The "Start here" course is for everyone, so it is not offered as an interest.
      const cats = getCategories().filter((cat) => cat.id !== 'meta' && getCourses().some((c) => c.category === cat.id));
      const grid = h('div.pick-grid', cats.map((cat) => {
        const btn = h('button', {
          type: 'button',
          class: cx('pick', `hue-${cat.color}`),
          'aria-pressed': String(draft.interests.includes(cat.id)),
        }, h('span.pick-icon', icon(cat.icon, 22)), h('span', h('strong', cat.title), h('span.small.muted', cat.blurb)));
        btn.addEventListener('click', () => {
          const i = draft.interests.indexOf(cat.id);
          if (i >= 0) draft.interests.splice(i, 1); else draft.interests.push(cat.id);
          btn.setAttribute('aria-pressed', String(i < 0));
          play('select');
        });
        return btn;
      }));
      return {
        mood: 'think',
        title: draft.name ? `Nice to meet you, ${draft.name}. What are you curious about?` : 'What are you curious about?',
        note: 'Pick as many as you like. Everything stays open either way.',
        body: grid,
      };
    },
    () => {
      const list = h('div.pick-grid.pick-goals', GOALS.map((g) => {
        const btn = h('button', { type: 'button', class: 'pick hue-orange', 'aria-pressed': String(draft.goal === g.xp) },
          h('span.pick-icon', h('strong', String(g.xp)), h('span.tiny', 'XP')),
          h('span', h('strong', g.label), h('span.small.muted', g.note)));
        btn.addEventListener('click', () => {
          draft.goal = g.xp;
          for (const b of list.children) b.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-pressed', 'true');
          play('select');
        });
        return btn;
      }));
      return {
        mood: 'proud',
        title: 'How much time feels doable each day?',
        note: 'Little and often wins: spreading practice out is one of the most reliable findings in learning research. You can change this any time.',
        body: list,
        cta: 'Start my first lesson',
      };
    },
  ];

  function finish() {
    store.update((s) => {
      s.profile.name = draft.name;
      s.profile.interests = draft.interests.slice();
      s.profile.goal = draft.goal;
      s.profile.onboarded = true;
    });
    play('streak');
    navigate(firstLessonFor(draft.interests));
  }

  function next() {
    if (stepIdx < steps.length - 1) { stepIdx++; draw(); play('step'); } else finish();
  }

  function draw() {
    const step = steps[stepIdx]();
    mount(root,
      h('div.setup.card.rise-in',
        h('div.setup-dots', { 'aria-label': `Step ${stepIdx + 1} of ${steps.length}` },
          steps.map((_, i) => h('span', { class: cx('setup-dot', i <= stepIdx && 'is-on') }))),
        h('div.setup-head', mascot(step.mood, { size: 96 }), h('div.bubble', h('h2', step.title))),
        h('div.setup-body', step.body),
        h('p.small.muted', step.note),
        h('div.setup-actions',
          stepIdx > 0 ? h('button.btn.btn-ghost', { type: 'button', onclick: () => { stepIdx--; draw(); } }, icon('arrow-left', 18), 'Back') : h('span'),
          h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: next }, step.cta || 'Continue', icon('arrow-right', 20)),
        ),
      ),
    );
  }
  draw();
}

function importProgress() {
  const input = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      store.importData(JSON.parse(await file.text()));
      store.update((s) => { s.profile.onboarded = true; });
      toast({ icon: 'check', hue: 'green', title: 'Progress restored' });
      navigate('/', { replace: true });
    } catch (err) {
      toast({ icon: 'alert', hue: 'red', title: 'Could not import', body: err.message });
    }
  });
  document.body.appendChild(input);
  input.click();
  setTimeout(() => input.remove(), 60000);
}

const FEATURES = [
  { icon: 'hand', hue: 'orange', title: 'Shown, then tried', text: 'Each idea is explained on one short screen, then you use it straight away: drag, build, solve. Ideas you have used are the ones that stay.' },
  { icon: 'review', hue: 'violet', title: 'Remember for good', text: 'Key ideas return just before you would forget them. A memory model schedules each review, so a few minutes go a long way.' },
  { icon: 'lightbulb', hue: 'yellow', title: 'Stuck is welcome', text: 'Hints when you want them, explanations for every answer, and no lives to lose. Mistakes are part of the method.' },
  { icon: 'shield', hue: 'green', title: 'Free, open, private', text: 'No ads, no account, no tracking. Your progress lives on your device and the whole thing is open source.' },
];

export default {
  title: 'Welcome',
  focus: true,
  render() {
    const stage = h('div.welcome-stage');
    const courses = getCourses();
    const lessonTotal = courses.reduce((n, c) => n + countLessons(c), 0);

    const hero = h('div.welcome-hero',
      h('div.welcome-copy',
        h('div.wordmark.welcome-wordmark', brandMark(40), h('span', config.name, h('span.wordmark-dot', '.'))),
        h('h1.welcome-title', 'Small steps', h('br'), 'to ', h('span.squiggle', 'big ideas'), '.'),
        h('p.welcome-lead', 'Interactive lessons in math, logic, computer science, science, history, geography, health, psychology and money — built on what research says actually makes learning stick.'),
        h('div.welcome-cta',
          h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => { setupWizard(stage); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
            'Start learning — it’s free', icon('arrow-right', 20)),
          h('a.btn.btn-ghost', { href: href('/courses'), onclick: () => store.update((s) => { s.profile.onboarded = true; }) }, 'Browse courses first'),
        ),
        h('p.small.faint.welcome-facts',
          h('span', `${courses.length} courses · ${lessonTotal} lessons · no sign-up`),
          h('span', 'Been here before? ', h('button.link-btn.small', { type: 'button', onclick: importProgress }, 'Restore a backup')),
        ),
      ),
      h('div.welcome-art',
        h('div.welcome-blob'),
        mascot('cheer', { size: 280, label: `${config.mascot} the lemur, cheering` }),
      ),
    );

    const features = h('section.welcome-features',
      FEATURES.map((f) => h('div', { class: cx('feature', `hue-${f.hue}`) },
        h('div.feature-icon', icon(f.icon, 24)),
        h('h3', f.title),
        h('p.muted', f.text),
      )),
    );

    const shelf = h('section.welcome-shelf',
      h('h2.center', 'Pick a path'),
      h('div.shelf-row', courses.slice(0, 8).map((c) => h('div', { class: cx('shelf-item', `hue-${c.color}`) },
        h('div.shelf-cover', cover(c.cover)),
        h('div.shelf-title', c.title),
      ))),
    );

    return h('div.welcome',
      hero,
      stage,
      features,
      shelf,
      h('footer.welcome-foot.small.faint',
        h('span', `${config.name} is open source. `),
        h('a', { href: href('/about'), onclick: () => store.update((s) => { s.profile.onboarded = true; }) }, 'How it works'),
        repoLink() ? [h('span', ' · '), h('a', { href: repoLink(), target: '_blank', rel: 'noopener noreferrer' }, 'Source code')] : null,
      ),
    );
  },
};
