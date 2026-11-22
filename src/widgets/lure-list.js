/**
 * lure-list — a false memory made on the spot (the Deese-Roediger-McDermott
 * procedure). Fifteen related words are shown one at a time. Then eight words
 * appear, and the learner ticks the ones they remember seeing. One of the
 * eight is the "lure": the word all the others point to, which was never
 * shown. Afterwards every test word is marked as shown or not shown, and the
 * message describes what most people do. It covers the learner who ticked
 * the lure and the one who did not, and judges neither.
 *
 * {
 *   type: 'lure-list',
 *   words: ['bed', 'rest', …],                    // the study list, in order
 *   lure: 'sleep',                                // never shown
 *   test: { studied: ['bed', 'dream'], other: ['door', 'sugar'] },   // test words: some from the list, some unrelated
 *   seconds: 1.3,                                 // how long each word is shown
 * }
 *
 * A learner who cannot follow the timed list (or does not want to) may go
 * straight to the test with "Skip the list"; the step is still answerable.
 *
 * State: { phase, done, picks, pickedLure, hits, falseAlarms }
 *   phase        'intro' | 'study' | 'test' | 'done'
 *   picks        the words ticked, once the test has been handed in
 *   pickedLure   the lure was among them
 *   hits         ticked words that really were on the list · falseAlarms: ticked unrelated words
 * Use `check: (s) => s.done`. setState({ done: true, picks: ['bed', 'sleep'] }) shows a finished test.
 */
import { h, cx, addStyles, icon } from './kit.js';
import { play } from '../core/audio.js';

addStyles('lure-list', `
  .widget-lure-list { gap: var(--s4); padding: var(--s5); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); text-align: center; }
  .widget-lure-list > * { min-width: 0; max-width: 100%; }
  .widget-lure-list .ll-head { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
  .widget-lure-list .ll-stage { display: grid; gap: var(--s3); justify-items: center; }
  .widget-lure-list .ll-stage p { margin: 0; text-wrap: balance; max-width: 100%; }
  .widget-lure-list .ll-word { box-sizing: border-box; width: min(320px, 100%); min-height: 110px; display: grid; place-items: center; border-radius: var(--r); background: var(--paper); border: var(--bw) solid var(--edge); font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; }
  .widget-lure-list .ll-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s2); width: min(380px, 100%); }
  .widget-lure-list .ll-tile { min-height: 48px; padding: 6px 10px; border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--paper); color: var(--ink); font-weight: 800; font-size: var(--fs-md); display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; }
  .widget-lure-list .ll-tile[aria-pressed='true'] { background: var(--blue-soft); border-color: var(--blue); }
  .widget-lure-list .ll-tile .ll-box { flex: none; width: 20px; height: 20px; border: 2px solid var(--edge-strong); border-radius: 5px; display: grid; place-items: center; background: var(--surface); }
  .widget-lure-list .ll-tile:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-lure-list .ll-tile small { font-weight: 700; font-size: var(--fs-xs); color: var(--ink-2); text-align: right; }
  .widget-lure-list .ll-tile.is-lure { border-style: dashed; border-color: var(--orange); background: var(--orange-soft); }
  .widget-lure-list .ll-row { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; }
  .widget-lure-list .ll-verdict { font-size: var(--fs-md); }
`);

export default function create(spec, env) {
  const words = Array.isArray(spec.words) && spec.words.length ? spec.words.map(String) : ['bed', 'rest', 'awake', 'tired', 'dream', 'wake', 'snooze', 'blanket', 'doze', 'slumber', 'snore', 'nap', 'peace', 'yawn', 'drowsy'];
  const lure = String(spec.lure || 'sleep');
  const studied = (spec.test && spec.test.studied) || words.slice(0, 4);
  const other = (spec.test && spec.test.other) || ['door', 'sugar', 'pencil'];
  const perWord = Math.max(0.6, spec.seconds || 1.3) * 1000;
  const testWords = env.rng.shuffle([...studied, lure, ...other]);
  let readOnly = !!env.readOnly;
  let phase = 'intro';
  let picks = [];
  const ticked = new Set();
  let timer = 0;

  const head = h('div.ll-head');
  const stage = h('div.ll-stage');
  const el = h('div.w-frame', head, stage);

  const getState = () => ({
    phase, done: phase === 'done', picks: picks.slice(), pickedLure: picks.includes(lure),
    hits: picks.filter((w) => studied.includes(w)).length, falseAlarms: picks.filter((w) => other.includes(w)).length,
  });

  function drawIntro() {
    head.textContent = 'A memory test';
    const go = h('button.btn.btn-primary', { type: 'button' }, icon('play', 18), 'Show the list');
    go.addEventListener('click', () => { if (!readOnly) drawStudy(); });
    const skip = h('button.btn.btn-sm', { type: 'button' }, 'Skip the list');
    skip.addEventListener('click', () => { if (!readOnly) drawTest(); });
    stage.replaceChildren(
      h('p', `${words.length} words will appear one at a time, about one a second. Just read each one.`),
      h('p.small.muted', 'Afterwards you will be asked which words you saw.'),
      h('div.ll-row', go, skip),
    );
  }

  function drawStudy() {
    phase = 'study';
    head.textContent = 'Read each word';
    const box = h('div.ll-word', { 'aria-live': 'assertive', 'aria-atomic': 'true' });
    const count = h('p.small.muted');
    stage.replaceChildren(box, count);
    let i = 0;
    const next = () => {
      if (i >= words.length) { drawTest(); env.onChange(getState()); return; }
      box.textContent = words[i];
      count.textContent = `${i + 1} of ${words.length}`;
      i++;
      timer = setTimeout(next, perWord);
    };
    next();
    env.onChange(getState());
  }

  function drawTest() {
    clearTimeout(timer);
    phase = 'test';
    head.textContent = 'Which of these did you see?';
    const tiles = testWords.map((w) => {
      const box = h('span.ll-box');
      const btn = h('button.ll-tile', { type: 'button', 'aria-pressed': 'false' }, w, box);
      btn.addEventListener('click', () => {
        if (readOnly) return;
        if (ticked.has(w)) ticked.delete(w); else ticked.add(w);
        const on = ticked.has(w);
        btn.setAttribute('aria-pressed', String(on));
        box.replaceChildren(...(on ? [icon('check', 14)] : []));
        play('select');
      });
      return btn;
    });
    const doneBtn = h('button.btn.btn-primary', { type: 'button' }, 'That is my answer');
    doneBtn.addEventListener('click', () => {
      if (readOnly) return;
      picks = testWords.filter((w) => ticked.has(w));
      drawDone();
      play('pop');
      env.onChange(getState());
    });
    stage.replaceChildren(
      h('p', 'Tick every word that was on the list. Go with your memory; there is no hurry.'),
      h('div.ll-grid', { role: 'group', 'aria-label': 'Test words' }, tiles),
      doneBtn,
    );
  }

  function drawDone() {
    clearTimeout(timer);
    phase = 'done';
    head.textContent = 'What was really on the list';
    const tiles = testWords.map((w) => {
      const was = studied.includes(w);
      const isLure = w === lure;
      const label = was ? 'shown' : isLure ? 'never shown' : 'not shown';
      return h('div', { class: cx('ll-tile', isLure && 'is-lure') },
        h('span', w, picks.includes(w) ? ' ✓' : ''), h('small', label));
    });
    let verdict;
    if (picks.includes(lure)) {
      verdict = ['You ticked ', h('strong', lure.toUpperCase()), '. It was never shown. Most people tick it, and many feel they can remember seeing it.'];
    } else {
      verdict = [h('strong', lure.toUpperCase()), ' was among the test words, and it was never shown. You did not tick it; most people do, especially when the list is read out and the test comes later.'];
    }
    stage.replaceChildren(
      h('div.ll-grid', tiles),
      h('p.small.muted', '✓ marks the words you ticked.'),
      h('p.ll-verdict', verdict),
    );
    env.announce(stage.lastChild.textContent);
  }

  drawIntro();

  return {
    el,
    getState,
    setState(next) {
      if (!next || !next.done) return;
      picks = Array.isArray(next.picks) ? testWords.filter((w) => next.picks.includes(w)) : [];
      drawDone();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
    destroy() { clearTimeout(timer); },
  };
}

export const examples = [
  { title: 'lure-list — the "sleep" list', spec: { type: 'lure-list' } },
];
