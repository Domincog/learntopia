/**
 * switch-cost — a two-round tapping experiment in which learners measure
 * what switching between tasks costs them.
 *
 *   Round 1 (one thing at a time): tap 1, 2, 3 … then A, B, C …
 *   Round 2 (switching):           tap 1, A, 2, B, 3, C …
 *
 * Same tiles and the same number of taps; only the order differs. The tiles
 * are reshuffled for each round so that neither round is helped by
 * remembering where things were.
 *
 * { type: 'switch-cost', count: 8 }      // tiles of each kind, 4 to 10 (default 8)
 *
 * State: { done, round, single, switching, cost, slips }
 *   round      0 before round 1 is finished, 1 after it, 2 when both are done
 *   single     seconds taken for round 1 (null until finished)
 *   switching  seconds taken for round 2 (null until finished)
 *   cost       extra time in round 2, as a percentage of round 1 (null until done)
 *   slips      wrong taps in each round: [round1, round2]
 * Use `check: (s) => s.done`. setState({ done: true, single: 9, switching: 13.5 })
 * shows a finished result.
 */
import { h, cx, addStyles, icon, clamp } from './kit.js';
import { play } from '../core/audio.js';

addStyles('switch-cost', `
  .widget-switch-cost { gap: var(--s4); padding: var(--s5); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); text-align: center; }
  .widget-switch-cost .sc-count { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .widget-switch-cost .sc-stage { display: grid; gap: var(--s3); justify-items: center; }
  .widget-switch-cost .sc-rule { margin: 0; text-wrap: balance; }
  .widget-switch-cost .sc-order { font-family: var(--font-mono); font-variant-ligatures: none; font-weight: 700; letter-spacing: 0.08em; padding: var(--s2) var(--s3); border-radius: var(--r); background: var(--sunken); overflow-wrap: anywhere; }
  .widget-switch-cost .sc-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); width: min(340px, 100%); }
  .widget-switch-cost .sc-tile { aspect-ratio: 1; min-height: 52px; border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--paper); color: var(--ink); font-family: var(--font-mono); font-size: 1.35rem; font-weight: 800; box-shadow: 0 3px 0 var(--edge-strong); touch-action: manipulation; }
  .widget-switch-cost .sc-tile.is-number { background: var(--blue-soft); }
  .widget-switch-cost .sc-tile.is-letter { background: var(--orange-soft); }
  .widget-switch-cost .sc-tile:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--edge-strong); }
  .widget-switch-cost .sc-tile.is-done { background: var(--sunken); color: var(--ink-2); border-color: var(--hair); box-shadow: none; transform: none; text-decoration: line-through; }
  .widget-switch-cost .sc-tile:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-switch-cost .sc-progress { font-size: var(--fs-sm); color: var(--ink-2); font-weight: 700; margin: 0; }
  .widget-switch-cost .sc-bars { display: grid; gap: var(--s3); width: min(420px, 100%); text-align: left; }
  .widget-switch-cost .sc-bar-head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s3); font-weight: 700; }
  .widget-switch-cost .sc-bar-head span:last-child { font-family: var(--font-mono); }
  .widget-switch-cost .sc-track { height: 22px; border-radius: 8px; background: var(--sunken); overflow: hidden; }
  .widget-switch-cost .sc-track i { display: block; height: 100%; border-radius: 8px; border: 2px solid var(--edge-strong); transition: width 0.6s var(--ease-out); }
  .widget-switch-cost .sc-track i.is-single { background: var(--blue); }
  .widget-switch-cost .sc-track i.is-switching { background: var(--orange); }
  .widget-switch-cost .sc-verdict { font-size: var(--fs-lg); margin: 0; text-wrap: balance; }
`);

const LETTERS = 'ABCDEFGHIJ'.split('');
const seconds = (v) => `${v.toFixed(1)} s`;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export default function create(spec, env) {
  const n = clamp(Math.round(spec.count || 8), 4, 10);
  const numbers = Array.from({ length: n }, (_, i) => String(i + 1));
  const letters = LETTERS.slice(0, n);
  const orders = [
    [...numbers, ...letters],
    numbers.flatMap((num, i) => [num, letters[i]]),
  ];
  const shown = (list) => (list.length > 6 ? `${list.slice(0, 3).join(' ')} … ${list[list.length - 1]}` : list.join(' '));

  let readOnly = !!env.readOnly;
  let round = 0;            // rounds finished
  const times = [null, null];
  const slips = [0, 0];

  const count = h('div.sc-count');
  const stage = h('div.sc-stage');
  const el = h('div.w-frame', count, stage);

  const cost = () => (times[0] != null && times[1] != null && times[0] > 0 ? Math.round(((times[1] - times[0]) / times[0]) * 100) : null);
  const getState = () => ({ done: round >= 2, round, single: times[0], switching: times[1], cost: cost(), slips: slips.slice() });

  function drawIntro() {
    count.textContent = `Round ${round + 1} of 2`;
    const first = round === 0;
    const go = h('button.btn.btn-primary', { type: 'button' }, icon('play', 18), `Start round ${round + 1}`);
    go.addEventListener('click', () => { if (!readOnly) drawRun(); });
    stage.replaceChildren(...[
      first ? null : h('p.sc-progress', `Round 1 took you ${seconds(times[0])}.`),
      h('p.sc-rule', first
        ? ['One thing at a time. Tap the ', h('strong', 'numbers in order'), ', then the ', h('strong', 'letters in order'), ':']
        : ['Same tiles, same number of taps. This time ', h('strong', 'alternate'), ' between the two:']),
      h('div.sc-order', first ? `${shown(numbers)}   then   ${shown(letters)}` : `${orders[1].slice(0, 6).join(' ')} …`),
      h('p.small.muted', { style: { margin: 0 } }, 'Go as fast as you can without mistakes. The clock starts when the tiles appear.'),
      go,
    ].filter(Boolean));
  }

  function drawRun() {
    const order = orders[round];
    let at = 0;
    const started = now();
    const progress = h('p.sc-progress', { 'aria-live': 'off' }, `0 of ${order.length}`);
    const grid = h('div.sc-grid', { role: 'group', 'aria-label': 'Tiles' });
    const tiles = env.rng.shuffle([...numbers, ...letters]).map((label) => {
      const btn = h('button', { type: 'button', class: cx('sc-tile', /\d/.test(label) ? 'is-number' : 'is-letter') }, label);
      btn.dataset.keys = 'own';
      btn.addEventListener('click', () => {
        if (readOnly || btn.classList.contains('is-done')) return;
        if (label !== order[at]) {
          slips[round]++;
          btn.classList.remove('shake');
          void btn.offsetWidth;
          btn.classList.add('shake');
          play('wrong');
          return;
        }
        btn.classList.add('is-done');
        btn.setAttribute('aria-pressed', 'true');
        at++;
        progress.textContent = `${at} of ${order.length}`;
        play('tap');
        if (at >= order.length) finishRound((now() - started) / 1000);
      });
      return btn;
    });
    tiles.forEach((t) => grid.appendChild(t));
    count.textContent = round === 0 ? 'Round 1: numbers, then letters' : 'Round 2: 1 A 2 B 3 C …';
    stage.replaceChildren(grid, progress);
  }

  function finishRound(time) {
    times[round] = Math.max(0.1, Math.round(time * 10) / 10);
    round++;
    play(round >= 2 ? 'correct' : 'step');
    if (round >= 2) drawResults(); else drawIntro();
    env.onChange(getState());
  }

  function drawResults() {
    count.textContent = 'Your results';
    const longest = Math.max(times[0], times[1]);
    const bar = (label, value, cls) => h('div',
      h('div.sc-bar-head', h('span', label), h('span', seconds(value))),
      h('div.sc-track', h('i', { class: cls, style: { width: `${Math.max(4, (value / longest) * 100)}%` } })));
    const extra = cost();
    let verdict;
    if (extra >= 8) verdict = [`Switching made the same ${n * 2} taps take `, h('strong', `${extra}% longer`), '.'];
    else if (extra > -8) verdict = 'Your two rounds were about level. Most people are clearly slower in round 2, even though it comes second and they have had practice.';
    else verdict = 'You were faster the second time: the practice from round 1 outweighed the switching. Most people are clearly slower in round 2.';
    const mistakes = slips[1] - slips[0];
    stage.replaceChildren(...[
      h('div.sc-bars',
        bar('One thing at a time', times[0], 'is-single'),
        bar('Switching back and forth', times[1], 'is-switching')),
      h('p.sc-verdict', verdict),
      slips[0] + slips[1] > 0
        ? h('p.small.muted', { style: { margin: 0 } }, `Wrong taps: ${slips[0]} in round 1, ${slips[1]} in round 2${mistakes > 0 ? '. Switching costs accuracy as well as time.' : '.'}`)
        : null,
    ].filter(Boolean)); // replaceChildren would print a bare null as the word "null"
  }

  drawIntro();

  return {
    el,
    getState,
    setState(next) {
      if (!next || !next.done) return;
      times[0] = next.single > 0 ? next.single : 9;
      times[1] = next.switching > 0 ? next.switching : 13.5;
      if (Array.isArray(next.slips)) { slips[0] = next.slips[0] || 0; slips[1] = next.slips[1] || 0; }
      round = 2;
      drawResults();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'Switching experiment', spec: { type: 'switch-cost' } },
  { title: 'Shorter version', spec: { type: 'switch-cost', count: 5 } },
];
