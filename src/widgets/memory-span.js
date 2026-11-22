/**
 * memory-span — "how much can you hold?" A sequence is shown for a few
 * seconds, then hidden, and the learner types it back. Lets people feel the
 * limit of working memory, and how grouping ("chunking") gets around it.
 *
 * {
 *   type: 'memory-span',
 *   kind: 'digits',              // what generated rounds use: 'digits' (default) or 'letters'
 *   lengths: [4, 6, 8, 10],      // one generated round per length …
 *   rounds: [                    // … or fixed rounds instead
 *     { show: 'QXJ ZKV', label: 'Six letters', seconds: 4 },
 *   ],                           // spaces are displayed but ignored when checking
 *   perItem: 0.6,                // viewing time per item, in seconds (never less than 2 s a round)
 * }
 *
 * State: { done, round, best, results: [{ length, right, correct }] }
 *   round    index of the round in progress (= number of rounds finished)
 *   best     length of the longest sequence recalled completely
 *   results  one entry per finished round; `right` counts items in the right place
 * Use `check: (s) => s.done`. setState({ done: true }) shows a finished result.
 */
import { h, cx, addStyles, icon } from './kit.js';
import { play } from '../core/audio.js';

addStyles('memory-span', `
  .widget-memory-span { gap: var(--s4); padding: var(--s5); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); text-align: center; }
  .widget-memory-span .ms-count { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .widget-memory-span .ms-stage { display: grid; gap: var(--s3); justify-items: center; align-content: center; min-height: 168px; }
  .widget-memory-span .ms-seq { font-family: var(--font-mono); font-variant-ligatures: none; font-weight: 700; font-size: clamp(1.5rem, 7vw, 2.4rem); letter-spacing: 0.14em; line-height: 1.3; overflow-wrap: anywhere; user-select: none; -webkit-user-select: none; }
  .widget-memory-span .ms-seq b { font-weight: 700; border-radius: 6px; padding: 0 1px; }
  .widget-memory-span .ms-seq b.is-right { color: var(--green-text); }
  .widget-memory-span .ms-seq b.is-wrong { color: var(--red-text); text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 5px; }
  .widget-memory-span .ms-timer { width: min(260px, 80%); height: 8px; border-radius: 99px; background: var(--sunken); overflow: hidden; }
  .widget-memory-span .ms-timer i { display: block; height: 100%; width: 100%; background: var(--orange); transform-origin: left; animation: ms-drain linear forwards; }
  @keyframes ms-drain { to { transform: scaleX(0); } }
  @media (prefers-reduced-motion: reduce) { .widget-memory-span .ms-timer i { animation: none; } }
  .widget-memory-span .ms-input { width: min(320px, 100%); min-height: 52px; padding: 0 var(--s3); border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--paper); color: var(--ink); font-family: var(--font-mono); font-size: 1.35rem; font-weight: 700; letter-spacing: 0.12em; text-align: center; }
  .widget-memory-span .ms-input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-memory-span .ms-typed { font-family: var(--font-mono); letter-spacing: 0.1em; overflow-wrap: anywhere; }
  .widget-memory-span .ms-verdict { font-weight: 800; }
  .widget-memory-span .ms-verdict.is-right { color: var(--green-text); }
  .widget-memory-span .ms-verdict.is-wrong { color: var(--red-text); }
  .widget-memory-span .ms-results { display: grid; gap: var(--s2); width: min(360px, 100%); margin: 0; padding: 0; list-style: none; text-align: left; }
  .widget-memory-span .ms-results li { display: flex; align-items: center; gap: var(--s3); padding: var(--s2) var(--s3); border-radius: var(--r); border: var(--bw) solid var(--hair); }
  .widget-memory-span .ms-results li.is-right { border-color: var(--green); background: var(--green-soft); }
  .widget-memory-span .ms-results li.is-wrong { border-color: var(--hair); background: var(--sunken); }
  .widget-memory-span .ms-results svg { flex: none; }
  .widget-memory-span .ms-results span { flex: 1; font-weight: 700; }
  .widget-memory-span .ms-results small { color: var(--ink-2); }
  .widget-memory-span .ms-best { font-size: var(--fs-lg); margin: 0; text-wrap: balance; }
`);

const DIGITS = '0123456789'.split('');
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXZ'.split('');

/** A sequence with no obvious pattern: nothing repeated close together, and no neighbours such as 4-5 side by side. */
function randomSequence(rng, n, kind) {
  const pool = kind === 'letters' ? CONSONANTS : DIGITS;
  let out = '';
  let guard = 0;
  while (out.length < n && guard++ < 2000) {
    const ch = rng.pick(pool);
    const prev = out[out.length - 1];
    if (out.slice(-3).includes(ch)) continue; // no 5-5 and no 5-2-5-2
    if (kind !== 'letters' && prev != null && Math.abs(Number(ch) - Number(prev)) === 1) continue;
    out += ch;
  }
  return out;
}

const clean = (text) => String(text == null ? '' : text).replace(/[^0-9a-z]/gi, '').toUpperCase();
const spaced = (text) => String(text).split('').join(' ');

export default function create(spec, env) {
  const kind = spec.kind === 'letters' ? 'letters' : 'digits';
  const perItem = spec.perItem > 0 ? spec.perItem : 0.6;
  const noun = (n, k = kind) => `${n} ${k === 'letters' ? 'letter' : 'digit'}${n === 1 ? '' : 's'}`;

  const rounds = Array.isArray(spec.rounds) && spec.rounds.length
    ? spec.rounds.map((r) => {
      const show = String(r.show).toUpperCase();
      const answer = clean(show);
      const isLetters = /[A-Z]/.test(answer);
      return { show, answer, label: r.label || noun(answer.length, isLetters ? 'letters' : 'digits'), seconds: r.seconds > 0 ? r.seconds : Math.max(2, answer.length * perItem), letters: isLetters };
    })
    : (spec.lengths || [4, 6, 8, 10]).map((n) => {
      const answer = randomSequence(env.rng, n, kind);
      return { show: answer, answer, label: noun(n), seconds: Math.max(2, n * perItem), letters: kind === 'letters' };
    });

  const results = [];
  let index = 0;
  let readOnly = !!env.readOnly;
  let timer = null;

  const count = h('div.ms-count');
  const stage = h('div.ms-stage');
  const el = h('div.w-frame', count, stage);

  const best = () => results.reduce((m, r) => (r.correct ? Math.max(m, r.length) : m), 0);
  const getState = () => ({ done: results.length >= rounds.length, round: results.length, best: best(), results: results.map((r) => ({ ...r })) });
  const stopTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const setCount = (text) => { count.textContent = text; };
  const secondsText = (sec) => `${Math.round(sec)} second${Math.round(sec) === 1 ? '' : 's'}`;

  function drawReady() {
    const round = rounds[index];
    setCount(`Round ${index + 1} of ${rounds.length}`);
    const go = h('button.btn.btn-primary', { type: 'button' }, icon('eye', 18), index === 0 ? 'Show me' : 'Show the next one');
    go.addEventListener('click', () => { if (!readOnly) drawShowing(); });
    stage.replaceChildren(
      h('p', { style: { margin: 0 } }, h('strong', round.label), `, shown for ${secondsText(round.seconds)}.`),
      h('p.small.muted', { style: { margin: 0 } }, 'Then they disappear and you type them back.'),
      go,
    );
  }

  function drawShowing() {
    const round = rounds[index];
    play('reveal');
    const bar = h('i', { style: { animationDuration: `${round.seconds}s` } });
    stage.replaceChildren(
      h('div.ms-seq', { role: 'status', 'aria-label': spaced(round.answer) }, round.show),
      h('div.ms-timer', { 'aria-hidden': 'true' }, bar),
      h('p.small.muted', { style: { margin: 0 } }, 'Memorise it…'),
    );
    stopTimer();
    timer = setTimeout(() => { timer = null; drawRecall(); }, round.seconds * 1000);
  }

  function drawRecall() {
    const round = rounds[index];
    const input = h('input.ms-input', {
      type: 'text',
      inputmode: round.letters ? 'text' : 'numeric',
      autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: false,
      'aria-label': `Type the ${round.letters ? 'letters' : 'digits'} you remember, in order`,
    });
    input.dataset.keys = 'own';
    const done = h('button.btn.btn-primary', { type: 'button' }, 'Done');
    const submit = () => { if (!readOnly) finishRound(input.value); };
    done.addEventListener('click', submit);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); submit(); }
    });
    stage.replaceChildren(
      h('p', { style: { margin: 0 } }, h('strong', 'What was it?'), ' Type what you remember, in order.'),
      input,
      done,
    );
    input.focus({ preventScroll: true });
  }

  function finishRound(typedRaw) {
    const round = rounds[index];
    const typed = clean(typedRaw);
    let right = 0;
    for (let i = 0; i < round.answer.length; i++) if (typed[i] === round.answer[i]) right++;
    const correct = typed === round.answer;
    results.push({ length: round.answer.length, right, correct });
    play(correct ? 'correct' : 'wrong');
    drawFeedback(round, typed, correct, right);
    env.onChange(getState());
  }

  function drawFeedback(round, typed, correct, right) {
    // show the sequence again, item by item, marked right or wrong
    let k = 0;
    const marked = round.show.split('').map((ch) => {
      if (ch === ' ') return ' ';
      const ok = typed[k] === round.answer[k];
      k++;
      return h('b', { class: ok ? 'is-right' : 'is-wrong' }, ch);
    });
    const last = index >= rounds.length - 1;
    const next = h('button.btn.btn-primary', { type: 'button' }, last ? 'See my results' : 'Next round');
    next.addEventListener('click', () => {
      if (readOnly) return;
      index++;
      if (index >= rounds.length) drawResults(); else drawReady();
    });
    stage.replaceChildren(
      h('div.ms-seq', { 'aria-label': `It was ${spaced(round.answer)}` }, marked),
      h('p.small', { style: { margin: 0 } }, 'You typed: ', h('span.ms-typed', typed || '(nothing)')),
      h('p', { class: cx('ms-verdict', correct ? 'is-right' : 'is-wrong'), style: { margin: 0 } },
        correct ? `All ${round.answer.length} right.` : `${right} of ${round.answer.length} in the right place.`),
      next,
    );
    next.focus({ preventScroll: true });
  }

  function drawResults() {
    setCount('Your results');
    const rows = rounds.map((round, i) => {
      const r = results[i];
      return h('li', { class: r.correct ? 'is-right' : 'is-wrong' },
        icon(r.correct ? 'check' : 'x', { size: 18, stroke: 3 }),
        h('span', round.label),
        h('small', r.correct ? 'all right' : `${r.right} of ${r.length}`));
    });
    const top = best();
    stage.replaceChildren(
      h('ul.ms-results', rows),
      h('p.ms-best', top ? ['Longest sequence you got completely right: ', h('strong', String(top)), '.'] : 'None of them came back complete this time. That is normal: it is a hard task.'),
    );
  }

  if (rounds.length) drawReady();

  return {
    el,
    getState,
    setState(next) {
      // used to show a finished run (for example when the answer is revealed)
      if (!next || !next.done) return;
      stopTimer();
      results.length = 0;
      rounds.forEach((round, i) => {
        const given = Array.isArray(next.results) ? next.results[i] : null;
        const correct = given ? !!given.correct : true;
        results.push({ length: round.answer.length, right: given && given.right != null ? given.right : (correct ? round.answer.length : 0), correct });
      });
      index = rounds.length;
      drawResults();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
    destroy() { stopTimer(); },
  };
}

export const examples = [
  { title: 'Digit span', spec: { type: 'memory-span', lengths: [4, 6, 8] } },
  { title: 'Fixed rounds: chunking', spec: { type: 'memory-span', rounds: [{ show: 'QXJZKVWPRMTB', label: '12 letters', seconds: 6 }, { show: 'TREE MOON FISH', label: '12 letters, as 3 words', seconds: 6 }] } },
];
