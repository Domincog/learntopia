/**
 * The step player: shows one step at a time and runs the learning loop.
 *
 *   attempt -> feedback -> (hint / retry) -> answer + explanation -> next
 *
 * Design choices that come straight from learning research:
 *   - no lives or timers: errors cost nothing and are followed by feedback
 *   - feedback is specific where the author anticipated the mistake
 *   - hints are graduated and optional
 *   - anything missed comes back at the end of the session ("second look")
 *   - "predict" steps invite a guess before the idea is taught
 *
 * The same engine runs lessons, review sessions and previews; the caller
 * decides what happens with the results (see views/lesson.js, review-session.js).
 */
import { h, mount, cx, disposer, announce, reducedMotion } from '../core/dom.js';
import { makeRng, randomSeed } from '../core/rng.js';
import { resolveStep } from './normalize.js';
import { RENDERERS, attemptsAllowed } from './steps.js';
import { createWidget, preloadWidget } from '../widgets/index.js';
import { mdBlock } from './ui.js';
import { mdInline } from '../core/markdown.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { chip } from '../ui/components.js';
import { play } from '../core/audio.js';
import { store } from '../core/store.js';
import { clock, today } from '../core/dates.js';
import { addActivity, todayRecord, XP } from '../core/progress.js';
import { toast } from '../ui/toast.js';

const PRAISE = ['Nice work!', 'Exactly right.', 'You got it!', 'Spot on.', 'Well reasoned!', 'That’s it!', 'Yes — nicely done.', 'Correct!'];
const PRAISE_RETRY = ['Got there!', 'Persistence pays off.', 'That’s the one.', 'Nice recovery!', 'There it is.'];
// An ungraded activity (an exploration, a demonstration run on the learner) has no right answer to praise.
const DONE = ['Done.', 'Nicely explored.', 'Good. Here is what it shows.'];
// Plain wording for steps marked tone: 'sober' (war, slavery, genocide): no cheering, no mascot.
const SOBER = { right: 'That is right.', retry: 'That is right.', predictRight: 'Yes. That matches what is known.', predictWrong: 'Here is what is known.' };
const NUDGE = ['Not quite — take another look.', 'Not yet. What else could it be?', 'Close, but not there yet.', 'Good try. Have another go.'];
const PREDICT_RIGHT = ['Your instinct was right!', 'Good call — that is what happens.'];
const PREDICT_WRONG = ['Surprising, isn’t it? Most people guess that.', 'A natural guess — and a great setup for what comes next.', 'Good guess. Here is what actually happens.'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
/** Step types whose answer area is big enough to deserve its own column on a wide screen. */
const SIDE_INPUT = new Set(['interact', 'code', 'bucket', 'match', 'order']);
/** Sorting and matching boards use the full width instead: loose items on one side, targets on the other. */
const BOARD_INPUT = new Set(['bucket', 'match']);
/** A choice prompt longer than this many characters gets its options in the side column. */
const LONG_PROMPT = 330;

const CONFIDENCE = [
  { key: 'guess', label: 'Guessing' },
  { key: 'think', label: 'Fairly sure' },
  { key: 'sure', label: 'Certain' },
];

/**
 * @param {object} opts
 * @param {'lesson'|'review'|'preview'} opts.mode
 * @param {{ step: object, context?: object }[]} opts.items  steps from normalizeLesson()
 * @param {number} [opts.startIndex]
 * @param {number} [opts.seed]
 * @param {Node}   [opts.intro]          card shown before the first step
 * @param {object[]} [opts.initialResults] results restored when resuming
 * @param {boolean} [opts.confidence]    ask "how sure are you?" before checking
 * @param {boolean} [opts.record]        write XP / activity to the store (default: not in preview)
 * @param {Function} [opts.onStepShown]  ({ pos, origin, pass, results })
 * @param {Function} [opts.onResult]     (item, result) => { note?: string } | void   (first pass only)
 * @param {Function} opts.onFinish       (summary)
 * @param {Function} opts.onExit         ()
 */
export function createPlayer(opts) {
  const {
    mode = 'lesson',
    items,
    startIndex = 0,
    seed = randomSeed(),
    intro = null,
    initialResults = [],
    confidence = false,
    record = mode !== 'preview',
    label = 'Lesson',
    onStepShown = () => {},
    onResult = () => {},
    onFinish = () => {},
    onExit = () => {},
  } = opts;

  const d = disposer();
  const queue = items.map((it, i) => ({ step: it.step, context: it.context || null, origin: i, pass: 1 }));
  const results = new Map(initialResults.map((r) => [r.origin, r]));
  let pos = Number.isInteger(startIndex) ? Math.min(Math.max(0, startIndex), queue.length) : 0;
  let current = null;
  let token = 0;
  let combo = 0;
  let xpEarned = 0;
  let totalMs = 0;
  let finished = false;
  let primaryAction = () => {};

  /* ------------------------------------------------------------ skeleton */
  const progressFill = h('i');
  const progressBar = h('div.player-progress', { role: 'progressbar', 'aria-label': `${label} progress`, 'aria-valuemin': '0', 'aria-valuemax': '100' }, progressFill);
  const comboEl = h('div.player-combo', { hidden: true, 'aria-hidden': 'true' });
  const exitBtn = h('button.icon-btn', { type: 'button', 'aria-label': 'Exit', title: 'Exit (your place is saved)' }, icon('x', 24));
  const stage = h('div.player-stage');
  const verdict = h('div.verdict', { hidden: true });
  const confidenceRow = h('div.confidence', { hidden: true });
  const hintBtn = h('button.btn.btn-ghost.hint-btn', { type: 'button' });
  const revealBtn = h('button.btn.btn-ghost.reveal-btn', { type: 'button' }, 'Show answer');
  const primaryBtn = h('button.btn.btn-primary.btn-lg.player-primary', { type: 'button' }, 'Continue');
  const bottom = h('footer.player-bottom', { dataset: { state: 'info' } },
    h('div.player-bottom-inner',
      verdict,
      confidenceRow,
      h('div.player-actions', h('div.player-actions-left', hintBtn, revealBtn), primaryBtn),
    ),
  );
  const topBar = h('header.player-top', exitBtn, progressBar, comboEl);
  const el = h('div.player', { dataset: { mode } },
    h('h1.sr-only', label),
    topBar,
    h('div.player-body', stage),
    bottom,
  );

  exitBtn.addEventListener('click', () => onExit());
  primaryBtn.addEventListener('click', () => primaryAction());
  hintBtn.addEventListener('click', () => showHint());
  revealBtn.addEventListener('click', () => {
    if (!current || current.state !== 'idle') return;
    current.renderer.reveal();
    resolve({ kind: 'revealed', asked: true });
  });

  /* ------------------------------------------------------------- helpers */
  function setProgress() {
    const pct = queue.length ? Math.min(1, pos / queue.length) : 1;
    progressFill.style.width = `${Math.max(pct * 100, pos > 0 ? 4 : 0)}%`;
    progressBar.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
  }

  function setPrimary(text, action, { enabled = true, variant = 'primary' } = {}) {
    primaryBtn.textContent = text;
    primaryBtn.className = `btn btn-${variant} btn-lg player-primary`;
    primaryBtn.disabled = !enabled;
    primaryAction = action;
  }

  function showVerdict(kind, title, message, extras = [], sober = false) {
    const moods = { correct: 'cheer', wrong: 'oops', invalid: 'think', revealed: 'think', predict: 'wow', done: 'happy' };
    mount(verdict,
      sober ? null : mascot(moods[kind] || 'happy', { size: 54, variant: 'face', animate: false }),
      h('div.verdict-text',
        h('div.verdict-title', title),
        message ? h('div.verdict-message', { html: mdInline(message) }) : null,
        extras.length ? h('div.verdict-extras', extras) : null,
      ),
    );
    verdict.hidden = false;
    verdict.classList.remove('pop-in');
    void verdict.offsetWidth; // restart the animation
    verdict.classList.add('pop-in');
    announce(`${title} ${message ? message.replace(/[$*_`]/g, '') : ''}`, true);
  }

  function hideVerdict() {
    verdict.hidden = true;
    bottom.dataset.state = 'idle';
  }

  function updateIdleControls() {
    if (!current || current.state !== 'idle') return;
    const { step } = current;
    const hintsLeft = step.hints.length - current.hints;
    hintBtn.hidden = hintsLeft <= 0;
    mount(hintBtn, icon('lightbulb', 18), current.hints === 0 ? 'Hint' : `Another hint (${hintsLeft})`);
    revealBtn.hidden = !(current.attempts > 0 && mode !== 'review' && step.mode !== 'predict');
    primaryBtn.disabled = !current.ready;
    confidenceRow.hidden = !(confidence && current.ready && step.graded);
  }

  function setReady(ready) {
    if (!current || current.state !== 'idle') return;
    const was = current.ready;
    current.ready = !!ready;
    if (ready && !was && bottom.dataset.state === 'wrong') hideVerdict();
    updateIdleControls();
  }

  function ensureVisible(node) {
    requestAnimationFrame(() => {
      if (!node || !node.isConnected) return;
      const rect = node.getBoundingClientRect();
      const limit = window.innerHeight - bottom.getBoundingClientRect().height - 16;
      if (rect.bottom > limit) window.scrollBy({ top: Math.min(rect.bottom - limit, rect.top - 80), behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
  }

  /** Widen the stage (and the bar under it) for steps laid out in two columns. */
  function setWide(on) { el.classList.toggle('is-split', on); }

  /*
   * Fitting the side column to the screen. Two things are measured, because
   * CSS alone cannot know how tall a widget's sliders and buttons are:
   *
   *  1. How tall may the drawings be so that the whole column fits between the
   *     two bars? That height is handed to the stylesheet as --w-fit-h, and
   *     .w-frame.w-fit turns it into a width (see widgets.css).
   *  2. Does the column fit? Then it may stay in view (sticky) while the prompt
   *     column scrolls, for instance when the explanation appears under it.
   */
  let sideEl = null;
  let idleFoot = 0; // height of the bottom bar before any feedback is shown
  const fitSide = () => {
    if (!sideEl || !sideEl.isConnected) return;
    const frames = Array.from(sideEl.querySelectorAll('.w-frame.w-fit'));
    const sideBySide = getComputedStyle(sideEl).display !== 'contents';
    if (!sideBySide) {
      for (const f of frames) { f.style.removeProperty('--w-fit-h'); f.classList.remove('is-row'); }
      sideEl.classList.remove('is-sticky');
      return;
    }
    const pad = getComputedStyle(stage);
    const top = topBar.getBoundingClientRect().height;
    const foot = bottom.getBoundingClientRect().height;
    if (!idleFoot || bottom.dataset.state === 'idle' || bottom.dataset.state === 'info') idleFoot = foot;
    const inner = window.innerHeight - top - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom);
    if (frames.length) {
      const canvases = frames.map((f) => f.querySelector('.w-canvas')).filter(Boolean);
      const figures = sideEl.querySelector('.step-figures');
      const cols = figures && figures.dataset.cols ? Number(figures.dataset.cols) : 1;
      const rows = Math.max(1, Math.ceil(canvases.length / cols));
      const limit = inner - idleFoot;
      if (cols === 1 && canvases.length > 1) {
        // Drawings of different sizes stacked in one column (a small picture above the thing you work
        // with): the small ones keep their size and the larger ones share whatever height is left.
        for (const f of frames) { f.classList.remove('is-row'); f.style.removeProperty('--w-fit-h'); }
        const pairs = frames.map((f) => [f, f.querySelector('.w-canvas')]).filter((pair) => pair[1]);
        const natural = pairs.map((pair) => pair[1].offsetHeight);
        let room = limit - (sideEl.offsetHeight - natural.reduce((a, b) => a + b, 0));
        const order = natural.map((_, i) => i).sort((a, b) => natural[a] - natural[b]);
        order.forEach((i, k) => {
          const share = Math.max(140, Math.floor(room / (order.length - k)));
          pairs[i][0].style.setProperty('--w-fit-h', `${share}px`);
          room -= Math.min(natural[i], share);
        });
      } else {
        const tallest = canvases.reduce((m, c) => Math.max(m, c.offsetHeight), 0);
        const other = sideEl.offsetHeight - rows * tallest; // captions, sliders, buttons, gaps
        const each = Math.max(140, Math.floor((limit - other) / rows));
        for (const f of frames) { f.classList.remove('is-row'); f.style.setProperty('--w-fit-h', `${each}px`); }
      }
      // Still too tall, because a single drawing carries a stack of controls? If the column
      // is wide enough, move the controls beside the drawing (see .w-frame.is-row).
      const frame = frames.length === 1 ? frames[0] : null;
      const canvas = frame && Array.from(frame.children).find((c) => c.classList.contains('w-canvas'));
      if (canvas && sideEl.offsetHeight > limit + 4 && sideEl.clientWidth >= 560 && frame.offsetHeight - canvas.offsetHeight > 70) {
        const outside = sideEl.offsetHeight - frame.offsetHeight;
        frame.style.setProperty('--w-fit-h', `${Math.max(180, Math.floor(limit - outside))}px`);
        frame.classList.add('is-row');
        // The drawing normally spans a generous number of rows, so that the controls stay packed at the
        // top beside it. When the controls are the taller side, those spare rows would turn into blank
        // space under the widget, so the drawing then spans exactly the rows that are in use.
        frame.style.removeProperty('--w-rows');
        const beside = Array.from(frame.children).filter((c) => c !== canvas && getComputedStyle(c).display !== 'none');
        const besideHeight = beside.reduce((sum, c) => sum + c.offsetHeight + (parseFloat(getComputedStyle(c).marginBottom) || 0), 0);
        if (beside.length && besideHeight >= canvas.offsetHeight) frame.style.setProperty('--w-rows', String(beside.length));
      }
    }
    sideEl.style.setProperty('--stick-top', `${Math.round(top + parseFloat(pad.paddingTop))}px`);
    sideEl.classList.toggle('is-sticky', sideEl.offsetHeight <= inner - foot + parseFloat(pad.paddingBottom));
  };
  const sizeWatcher = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fitSide()) : null;
  function watchSide(next) {
    if (sizeWatcher && sideEl) sizeWatcher.unobserve(sideEl);
    sideEl = next || null;
    idleFoot = 0;
    if (!sideEl) return;
    if (sizeWatcher) sizeWatcher.observe(sideEl);
    fitSide();
  }
  if (sizeWatcher) sizeWatcher.observe(bottom);
  window.addEventListener('resize', fitSide);
  d(() => { window.removeEventListener('resize', fitSide); if (sizeWatcher) sizeWatcher.disconnect(); });

  function cleanupCurrent() {
    if (!current) return;
    try { if (current.renderer && current.renderer.destroy) current.renderer.destroy(); } catch (err) { console.error(err); }
    for (const w of current.widgets || []) w.destroy();
    current = null;
  }

  function elapsed() {
    if (!current) return 0;
    return Math.min(180000, Math.max(0, performance.now() - current.startedAt));
  }

  function celebrate(activity) {
    if (!activity) return;
    if (activity.streakExtended) {
      play('streak');
      toast({ icon: 'flame', hue: 'orange', title: `${activity.streak}-day streak!`, body: activity.streak === 1 ? 'Day one. Come back tomorrow to keep it going.' : 'You showed up again. That is how it sticks.' });
    }
    if (activity.restEarned) toast({ icon: 'coffee', hue: 'blue', title: 'Rest day earned', body: 'A week of practice banks a day off.' });
    if (activity.goalMet) toast({ icon: 'target', hue: 'green', title: 'Daily goal reached', body: 'Anything more today is a bonus.' });
    if (activity.levelUp) {
      play('levelup');
      toast({ icon: 'zap', hue: 'yellow', title: `Level ${activity.levelUp.to}: ${activity.levelUp.title}`, duration: 4500 });
    }
  }

  /* ---------------------------------------------------------- show a step */
  async function show() {
    const my = ++token;
    cleanupCurrent();
    setProgress();
    verdict.hidden = true;
    confidenceRow.hidden = true;
    hintBtn.hidden = true;
    revealBtn.hidden = true;
    if (pos >= queue.length) { finish(); return; }

    const item = queue[pos];
    if (item.interstitial) { showInterstitial(item); return; }

    const rng = makeRng((seed + item.origin * 7919 + item.pass * 104729) >>> 0);
    let step;
    try {
      step = resolveStep(item.step, rng, item.step.id);
    } catch (err) {
      showBroken(item, err);
      return;
    }

    current = {
      item, step, renderer: null, widgets: [], attempts: 0, hints: 0, ready: false,
      state: 'loading', startedAt: performance.now(), confidence: null, notes: {},
      maxAttempts: attemptsAllowed(step, mode),
    };
    const mine = current;

    const env = {
      rng,
      mode,
      onReady: (v) => { if (current === mine) setReady(v); },
      submit: () => { if (current === mine) doCheck(); },
      note: (data) => { Object.assign(mine.notes, data); },
    };

    let renderer;
    let widgets;
    try {
      widgets = await Promise.all(step.figures.map((spec) => createWidget(spec, { rng })));
      mine.widgets = widgets;
      renderer = await RENDERERS[step.type](step, env);
    } catch (err) {
      if (my !== token) return;
      showBroken(item, err);
      return;
    }
    if (my !== token) {
      widgets.forEach((w) => w.destroy());
      if (renderer && renderer.destroy) renderer.destroy();
      return;
    }
    mine.renderer = renderer;

    const badges = [];
    if (item.context && mode === 'review') badges.push(chip(`${item.context.courseTitle} · ${item.context.lessonTitle}`, { icon: 'courses' }));
    if (item.pass > 1) badges.push(chip('Second look', { hue: 'violet', icon: 'repeat' }));
    if (step.mode === 'predict') badges.push(chip('Make a prediction', { hue: 'violet', icon: 'telescope' }));
    if (step.teach && mode !== 'review') badges.push(chip('Learn', { hue: 'blue', icon: 'lightbulb' }));
    if (step.stretch) badges.push(chip('Challenge', { hue: 'yellow', icon: 'star' }));

    mine.hintsEl = h('div.step-hints');
    mine.explainEl = h('div.step-explain', { hidden: true });
    // On a wide screen the visual part of a step sits beside the prompt instead of
    // below it, so a laptop shows both without scrolling. "Visual" means figures,
    // plus the answer area itself when that is a large thing to work in.
    const figuresEl = widgets.length
      ? h('div.step-figures', { dataset: { cols: widgets.length > 1 ? 2 : null } }, widgets.map((w) => h('div.step-figure', w.el)))
      : null;
    const inputEl = renderer.el ? h('div.step-input', renderer.el) : null;
    // A long prompt with its options underneath does not fit a short screen either: options go aside.
    const longChoice = !figuresEl && (step.type === 'choice' || step.type === 'multi') && String(step.text || '').length > LONG_PROMPT;
    // picture options are a board as well: on a wide screen they sit in one row
    const pictureOptions = Array.isArray(step.options) && step.options.some((o) => o && o.figure);
    const board = !!inputEl && !figuresEl && (BOARD_INPUT.has(step.type) || pictureOptions);
    const inputAside = !!inputEl && !board && (SIDE_INPUT.has(step.type) || longChoice);
    const split = board ? 'board' : figuresEl || inputAside ? (inputAside ? 'input' : 'figure') : null;
    mine.sideEl = split && !board ? h('div.step-side', figuresEl, inputAside ? inputEl : null) : null;
    const article = h('article.step.rise-in', { dataset: { type: step.type, split }, tabindex: '-1' },
      badges.length ? h('div.step-badges', badges) : null,
      step.title ? h('h2.step-title', step.title) : null,
      step.text ? mdBlock(step.text, 'md step-text') : null,
      mine.sideEl,
      inputAside ? null : inputEl,
      mine.hintsEl,
      mine.explainEl,
    );
    mine.article = article;
    setWide(!!split);
    mount(stage, article);
    watchSide(mine.sideEl);
    window.scrollTo(0, 0);

    // the streak flame in the header steps aside while a sober step is on screen
    if (step.tone === 'sober') comboEl.hidden = true;
    else if (combo >= 3 && comboEl.firstChild) comboEl.hidden = false;
    if (step.type === 'info') {
      mine.state = 'info';
      bottom.dataset.state = 'info';
      setPrimary(step.cta || 'Continue', () => {
        if (current !== mine) return;
        const ms = elapsed();
        totalMs += ms;
        if (record) store.update((s) => addActivity(s, clock.now(), { ms }), { silent: true });
        play('step');
        next();
      });
    } else {
      mine.state = 'idle';
      bottom.dataset.state = 'idle';
      setPrimary(renderer.checkLabel || 'Check', doCheck, { enabled: mine.ready });
      if (confidence && step.graded) drawConfidence();
      updateIdleControls();
    }

    article.focus({ preventScroll: true });
    if (renderer.focus && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) renderer.focus();

    // warm up whatever the next step needs
    const upcoming = queue[pos + 1];
    if (upcoming && upcoming.step) {
      const figs = upcoming.step.figure ? (Array.isArray(upcoming.step.figure) ? upcoming.step.figure : [upcoming.step.figure]) : [];
      for (const f of figs) if (f && f.type) preloadWidget(f.type);
      if (upcoming.step.widget && upcoming.step.widget.type) preloadWidget(upcoming.step.widget.type);
    }

    onStepShown({ pos, origin: item.origin, pass: item.pass, results: Array.from(results.values()) });
  }

  function drawConfidence() {
    mount(confidenceRow,
      h('span.confidence-label', 'How sure are you?'),
      CONFIDENCE.map((c) => {
        const btn = h('button.filter', { type: 'button', 'aria-pressed': 'false' }, c.label);
        btn.addEventListener('click', () => {
          const on = current.confidence !== c.key;
          current.confidence = on ? c.key : null;
          for (const b of confidenceRow.querySelectorAll('button')) b.setAttribute('aria-pressed', 'false');
          if (on) btn.setAttribute('aria-pressed', 'true');
          play('select');
        });
        return btn;
      }),
    );
  }

  function showInterstitial(item) {
    const remaining = queue.slice(pos + 1).filter((q) => !q.interstitial).length;
    setWide(false);
    watchSide(null);
    mount(stage, h('article.step.step-interstitial.rise-in', { tabindex: '-1' },
      mascot('think', { size: 130 }),
      h('h2.step-title', remaining === 1 ? 'One to look at again' : `${remaining} to look at again`),
      h('p.md', mode === 'review'
        ? 'A couple slipped away — completely normal. Seeing them once more now makes the next recall much easier.'
        : 'Let’s revisit what tripped you up. Getting it right after a short gap is far more powerful than getting it right the first time.'),
    ));
    bottom.dataset.state = 'info';
    const here = pos;
    setPrimary('Let’s go', () => { if (pos === here) next(); }); // guard against double clicks
    window.scrollTo(0, 0);
    void item;
  }

  function showBroken(item, err) {
    console.error('[player] step failed to render', item && item.step && item.step.id, err);
    current = null;
    setWide(false);
    watchSide(null);
    mount(stage, h('article.step.rise-in',
      h('h2.step-title', 'This step has a problem'),
      h('p.md', 'Something in this step could not be shown. You can skip it — it will not count against you.'),
      h('pre.code', String(err && err.message ? err.message : err)),
    ));
    bottom.dataset.state = 'info';
    const here = pos;
    setPrimary('Skip this step', () => { if (pos === here) next(); });
  }

  /* -------------------------------------------------------------- hints */
  function showHint() {
    if (!current || current.state !== 'idle') return;
    const { step } = current;
    if (current.hints >= step.hints.length) return;
    const i = current.hints++;
    const card = h('div.hint-card.rise-in',
      h('div.hint-head', icon('lightbulb', 16), step.hints.length > 1 ? `Hint ${i + 1} of ${step.hints.length}` : 'Hint'),
      mdBlock(step.hints[i]),
    );
    current.hintsEl.appendChild(card);
    play('hint');
    updateIdleControls();
    ensureVisible(card);
  }

  /* -------------------------------------------------------------- check */
  function doCheck() {
    if (!current || current.state !== 'idle' || !current.ready) return;
    const { renderer, step } = current;
    let res;
    try {
      res = renderer.check() || { correct: false };
    } catch (err) {
      console.error('[player] check() threw', err);
      res = { correct: true };
    }
    if (res.invalid) {
      // Unreadable input (or the right idea in the wrong form): no attempt is used.
      // The message clears as soon as the answer is edited.
      current.ready = false;
      bottom.dataset.state = 'wrong';
      showVerdict('invalid', res.title || 'Hmm, I can’t read that', res.message);
      updateIdleControls();
      return;
    }
    if (res.ungraded) { resolve({ kind: 'done', wrote: res.wrote }); return; }

    current.attempts += 1;
    if (step.mode === 'predict') {
      renderer.reveal();
      resolve({ kind: 'predict', correct: !!res.correct, message: res.message });
      return;
    }
    if (res.correct) { resolve({ kind: 'correct', message: res.message }); return; }

    if (current.attempts >= current.maxAttempts) {
      renderer.reveal();
      resolve({ kind: 'revealed', message: res.message });
      return;
    }

    play('wrong');
    if (renderer.el) {
      renderer.el.classList.remove('shake');
      void renderer.el.offsetWidth;
      renderer.el.classList.add('shake');
    }
    if (renderer.retry) renderer.retry();
    current.ready = false;
    bottom.dataset.state = 'wrong';
    showVerdict('wrong', step.tone === 'sober' ? 'Not quite. Look again.' : pick(NUDGE), res.message, [], step.tone === 'sober');
    updateIdleControls();
    if (step.hints.length > current.hints) hintBtn.classList.add('is-nudge');
  }

  /* ------------------------------------------------------------ resolve */
  function resolve(outcome) {
    const mine = current;
    const { item, step, renderer } = mine;
    mine.state = outcome.kind;
    try { renderer.lock(); } catch (err) { console.error(err); }
    hintBtn.hidden = true;
    hintBtn.classList.remove('is-nudge');
    revealBtn.hidden = true;
    confidenceRow.hidden = true;

    const firstPass = item.pass === 1;
    const correct = outcome.kind === 'correct';
    const firstTry = correct && mine.attempts === 1;
    const graded = step.graded;

    let xp;
    if (outcome.kind === 'predict') xp = XP.predict;
    else if (outcome.kind === 'done') xp = outcome.wrote ? XP.reflect : 2;
    else if (!firstPass) xp = correct ? XP.reviewMiss : 1;
    else if (mode === 'review') xp = correct ? XP.review : XP.reviewMiss;
    else if (correct) xp = firstTry ? (mine.hints ? XP.withHelp : XP.firstTry) : XP.retry;
    else xp = XP.revealed;
    if (step.stretch && firstTry && firstPass) xp += 5;

    if (graded) combo = firstTry ? combo + 1 : 0;
    const ms = elapsed();
    totalMs += ms;
    xpEarned += xp;

    const result = {
      origin: item.origin,
      id: step.id,
      type: step.type,
      graded,
      review: step.review,
      correct,
      firstTry,
      attempts: mine.attempts,
      hints: mine.hints,
      revealed: outcome.kind === 'revealed',
      confidence: mine.confidence,
    };

    let extra = null;
    if (firstPass) {
      results.set(item.origin, result);
      try { extra = onResult(item, result) || null; } catch (err) { console.error(err); }
      // anything not right first time comes back once at the end of the session
      if (graded && !firstTry && mode !== 'preview') {
        if (!queue.some((q) => q.interstitial)) queue.push({ interstitial: true });
        queue.push({ step: item.step, context: item.context, origin: item.origin, pass: 2 });
      }
    }

    if (record) {
      const activity = store.update((s) => addActivity(s, clock.now(), {
        xp,
        ms,
        answered: graded && firstPass ? 1 : 0,
        correct: graded && firstPass && firstTry ? 1 : 0,
        reviews: mode === 'review' && firstPass ? 1 : 0,
      }));
      celebrate(activity);
      // Long sitting? Say so once a day: breaks and sleep are when memories consolidate.
      const day = today();
      if (todayRecord(store.state, clock.now()).ms > 30 * 60000 && store.state.flags.breakDay !== day) {
        store.update((s) => { s.flags.breakDay = day; }, { silent: true });
        toast({ icon: 'coffee', hue: 'blue', title: '30 minutes of focused work', body: 'A short break now helps today’s learning settle in.', duration: 6000 });
      }
    }

    /* verdict */
    const extras = [];
    if (xp > 0 && step.tone !== 'sober') extras.push(h('span.xp-chip', icon('zap', 14), `+${xp} XP`)); // XP is still earned, just not announced beside sober material
    const sober = step.tone === 'sober';
    if (graded && combo >= 3 && firstTry && !sober) extras.push(h('span.combo-chip', icon('flame', { size: 14, filled: true }), `${combo} in a row`));
    if (extra && extra.note) extras.push(h('span.note-chip', icon('calendar', 14), extra.note));

    if (outcome.kind === 'correct') {
      play(sober ? 'step' : 'correct');
      bottom.dataset.state = 'correct';
      showVerdict('correct', !graded ? (sober ? 'Done.' : pick(DONE)) : sober ? SOBER.right : firstTry ? pick(PRAISE) : pick(PRAISE_RETRY), outcome.message, extras, sober);
    } else if (outcome.kind === 'predict') {
      play('reveal');
      bottom.dataset.state = 'predict';
      // A predict-mode choice with no correct option is an opinion poll.
      const poll = Array.isArray(step.options) && !step.options.some((o) => o.correct);
      showVerdict('predict', poll ? 'Noted. Hold that thought.' : sober ? (outcome.correct ? SOBER.predictRight : SOBER.predictWrong) : outcome.correct ? pick(PREDICT_RIGHT) : pick(PREDICT_WRONG), outcome.message, extras, sober);
    } else if (outcome.kind === 'done') {
      play('step');
      bottom.dataset.state = 'predict';
      showVerdict('done', 'Compare with the model answer', 'Putting an idea into your own words is one of the strongest ways to learn it.', extras, sober);
    } else {
      play(outcome.asked ? 'reveal' : 'wrong');
      bottom.dataset.state = 'revealed';
      showVerdict('revealed', outcome.asked ? 'Here is the answer' : 'Not this time — here is the answer',
        outcome.message || (firstPass && graded && mode !== 'preview' ? 'You will get another go at this one in a moment.' : null), extras, sober);
    }

    if (combo >= 3 && graded && firstTry && !sober) {
      comboEl.hidden = false;
      mount(comboEl, icon('flame', { size: 18, filled: true }), String(combo));
      comboEl.classList.remove('pop-in'); void comboEl.offsetWidth; comboEl.classList.add('pop-in');
    } else if (graded && !firstTry) {
      comboEl.hidden = true;
    }

    /* explanation */
    if (step.explain) {
      mount(mine.explainEl, h('div.explain-card.rise-in',
        h('div.explain-head', icon('message', 16), outcome.kind === 'predict' ? 'What is going on' : 'Why'),
        mdBlock(step.explain),
      ));
      mine.explainEl.hidden = false;
      ensureVisible(mine.explainEl);
    }

    const last = pos >= queue.length - 1;
    setPrimary(last ? 'Finish' : 'Continue', () => { if (current === mine) next(); },
      { variant: outcome.kind === 'correct' ? 'success' : 'primary' });
    primaryBtn.focus({ preventScroll: true });
  }

  function next() {
    pos += 1;
    show();
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanupCurrent();
    progressFill.style.width = '100%';
    const list = Array.from(results.values());
    const graded = list.filter((r) => r.graded);
    const firstTry = graded.filter((r) => r.firstTry).length;
    onFinish({
      results: list,
      graded: graded.length,
      firstTry,
      accuracy: graded.length ? firstTry / graded.length : 1,
      perfect: graded.length > 0 && firstTry === graded.length,
      xp: xpEarned,
      ms: totalMs,
    });
  }

  /* ----------------------------------------------------------- keyboard */
  d.on(document, 'keydown', (ev) => {
    if (ev.defaultPrevented || ev.isComposing || document.querySelector('.modal-scrim')) return;
    const target = ev.target;
    const tag = target && target.tagName;
    if (ev.key === 'Enter') {
      if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || tag === 'SUMMARY') return;
      if (target && target.closest && target.closest('[data-keys="own"]')) return;
      if (!primaryBtn.disabled) { ev.preventDefault(); primaryAction(); }
      return;
    }
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (target && target.closest && target.closest('[data-keys="own"]')) return;
    if (current && current.state === 'idle' && current.renderer && current.renderer.onKey) {
      if (current.renderer.onKey(ev)) ev.preventDefault();
    }
  });

  /* --------------------------------------------------------------- start */
  function start() {
    setProgress();
    if (intro) {
      setWide(false);
      mount(stage, intro);
      bottom.dataset.state = 'info';
      setPrimary(pos > 0 ? 'Resume' : 'Start', () => { play('step'); show(); });
      hintBtn.hidden = true;
      revealBtn.hidden = true;
    } else {
      show();
    }
  }
  // Start on the next microtask so callbacks never fire before the caller
  // has received the player object.
  Promise.resolve().then(start);

  return {
    el,
    destroy() { token++; cleanupCurrent(); d.run(); },
    /** Snapshot for saving a resume point. */
    snapshot: () => ({ pos, results: Array.from(results.values()), seed, xp: xpEarned }),
    /** Test hooks (used by tools/smoke.mjs). */
    debug: {
      current: () => current,
      solve() { if (current && current.renderer && current.renderer.solve) current.renderer.solve(); },
      check: () => doCheck(),
      primary: () => primaryAction(),
      queueLength: () => queue.length,
      pos: () => pos,
    },
  };
}
