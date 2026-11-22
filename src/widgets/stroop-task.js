/**
 * stroop-task — the Stroop experiment (1935), run on the learner in two short
 * blocks. In each block items appear one at a time and the learner answers
 * with one of four buttons (or the keys 1 to 4). The clock is the measurement,
 * not a deadline: nothing times out.
 *
 *   'colour' version   say the INK colour of a word.
 *                      block 1: the word names its own ink ("red" in red)
 *                      block 2: the word names another colour ("red" in blue)
 *   'count' version    say HOW MANY characters are shown. Needs no colour vision.
 *                      block 1: neutral marks ("# # #" → 3)
 *                      block 2: digits that disagree with their number ("4 4" → 2)
 *
 * {
 *   type: 'stroop-task',
 *   items: 8,              // items per block (4 to 16)
 *   version: 'colour',     // which version is offered first: 'colour' or 'count'
 *   switchable: true,      // show the switch between the two versions before the first block starts
 * }
 *
 * State: { done, version, block, times, perItem, cost, slips }
 *   block    blocks finished: 0, 1 or 2 · done: both are finished
 *   times    seconds taken for each block: [matching, clashing] (null until finished)
 *   perItem  the same per item · cost: extra time in the clashing block, as a percentage of the matching one
 *   slips    wrong presses in each block
 * Everything timed depends on the learner: check `done` only.
 *
 * setState({ done: true, times: [6.2, 9.4], version: 'count' }) shows a finished result.
 */
import { h, cx, addStyles, icon, clamp } from './kit.js';
import { play } from '../core/audio.js';

addStyles('stroop-task', `
  .widget-stroop-task { gap: var(--s4); padding: var(--s5); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); text-align: center; }
  .widget-stroop-task .st-count { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
  .widget-stroop-task .st-stage { display: grid; gap: var(--s3); justify-items: center; min-width: 0; }
  .widget-stroop-task > * { min-width: 0; max-width: 100%; }
  .widget-stroop-task .st-stage p { margin: 0; text-wrap: balance; }
  .widget-stroop-task .st-item { min-height: 92px; box-sizing: border-box; width: min(300px, 100%); display: grid; place-items: center; padding: var(--s3) var(--s5); border-radius: var(--r); background: var(--paper); border: var(--bw) solid var(--edge); font-size: 2.3rem; font-weight: 800; letter-spacing: 0.04em; font-family: var(--font-display); }
  .widget-stroop-task .st-item.is-count { font-family: var(--font-mono); letter-spacing: 0.3em; color: var(--ink); }
  .widget-stroop-task .st-eg { font-weight: 800; font-size: 1.3rem; }
  .widget-stroop-task .st-keys { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); width: min(420px, 100%); }
  .widget-stroop-task .st-key { min-height: 52px; border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--paper); color: var(--ink); font-weight: 800; font-size: var(--fs-md); box-shadow: 0 3px 0 var(--edge-strong); touch-action: manipulation; display: grid; gap: 0; place-items: center; line-height: 1.15; padding: 4px 2px; }
  .widget-stroop-task .st-key small { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-2); font-weight: 700; }
  .widget-stroop-task .st-key:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--edge-strong); }
  .widget-stroop-task .st-key:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-stroop-task .st-progress { font-size: var(--fs-sm); color: var(--ink-2); font-weight: 700; }
  .widget-stroop-task .st-switch { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; max-width: 100%; }
  .widget-stroop-task .st-switch .btn { white-space: normal; height: auto; min-height: 40px; max-width: 100%; }
  .widget-stroop-task .st-stage p { max-width: 100%; overflow-wrap: anywhere; }
  .widget-stroop-task .st-bars { display: grid; gap: var(--s3); width: min(420px, 100%); text-align: left; }
  .widget-stroop-task .st-bar-head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s3); font-weight: 700; }
  .widget-stroop-task .st-bar-head span:last-child { font-family: var(--font-mono); }
  .widget-stroop-task .st-track { height: 22px; border-radius: 8px; background: var(--sunken); overflow: hidden; }
  .widget-stroop-task .st-track i { display: block; height: 100%; border-radius: 8px; border: 2px solid var(--edge-strong); }
  .widget-stroop-task .st-track i.is-a { background: var(--blue); }
  .widget-stroop-task .st-track i.is-b { background: var(--orange); }
  .widget-stroop-task .st-verdict { font-size: var(--fs-lg); }
`);

const COLOURS = ['red', 'blue', 'green', 'violet'];
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const secs = (v) => `${v.toFixed(2)} s`;

export default function create(spec, env) {
  const n = clamp(Math.round(spec.items || 8), 4, 16);
  let version = spec.version === 'count' ? 'count' : 'colour';
  const switchable = spec.switchable !== false;
  let readOnly = !!env.readOnly;
  let block = 0;
  const times = [null, null];
  const slips = [0, 0];
  let live = null; // { answer, press(i) } while an item is on screen

  const count = h('div.st-count');
  const stage = h('div.st-stage');
  const el = h('div.w-frame', count, stage);
  el.dataset.keys = 'own';
  el.addEventListener('keydown', (ev) => {
    if (!live || readOnly) return;
    const k = Number(ev.key);
    if (k >= 1 && k <= 4) { ev.preventDefault(); live.press(k - 1); }
  });

  const cost = () => (times[0] != null && times[1] != null && times[0] > 0 ? Math.round(((times[1] - times[0]) / times[0]) * 100) : null);
  const getState = () => ({
    done: block >= 2, version, block, times: times.slice(),
    perItem: times.map((t) => (t == null ? null : Math.round((t / n) * 100) / 100)), cost: cost(), slips: slips.slice(),
  });

  /** The items of one block: { show, answer (0-3), ink } with no item repeated straight away. */
  function makeItems(clash) {
    const out = [];
    let last = -1;
    for (let i = 0; i < n; i++) {
      let answer = env.rng.int(0, 3);
      if (answer === last) answer = (answer + 1 + env.rng.int(0, 2)) % 4;
      last = answer;
      if (version === 'colour') {
        const word = clash ? (answer + 1 + env.rng.int(0, 2)) % 4 : answer;
        out.push({ show: COLOURS[word], ink: COLOURS[answer], answer });
      } else {
        const digit = clash ? (answer + 1 + env.rng.int(0, 2)) % 4 : null;
        out.push({ show: Array(answer + 1).fill(clash ? String(digit + 1) : '#').join(' '), answer });
      }
    }
    return out;
  }

  const sample = (clash) => {
    if (version === 'colour') return h('span.st-eg', { style: { color: `var(--${clash ? 'blue' : 'red'}-text)` } }, 'red');
    return h('span.st-eg', { style: { fontFamily: 'var(--font-mono)' } }, clash ? '4 4' : '# #');
  };

  function drawIntro() {
    count.textContent = `Block ${block + 1} of 2`;
    const first = block === 0;
    const go = h('button.btn.btn-primary', { type: 'button' }, icon('play', 18), `Start block ${block + 1}`);
    go.addEventListener('click', () => { if (!readOnly) drawRun(); });
    const rule = version === 'colour'
      ? ['Press the colour of the ', h('strong', 'ink'), '. Ignore what the word says.']
      : ['Press ', h('strong', 'how many'), ' characters you see. Ignore what the characters are.'];
    const eg = version === 'colour'
      ? [sample(!first), first ? ' → press "red"' : ' → press "blue"']
      : [sample(!first), ' → press "2"'];
    const kids = [
      first ? null : h('p.st-progress', `Block 1 took you ${secs(times[0])}.`),
      h('p', rule),
      h('p', first ? 'In this block the two agree, like this: ' : 'This time they clash, like this: ', eg),
      h('p.small.muted', `${n} items. Go as fast as you can without mistakes; the clock only measures.`),
      go,
    ];
    if (first && switchable) {
      const other = version === 'colour' ? 'count' : 'colour';
      const sw = h('button.btn.btn-sm', { type: 'button' }, other === 'count' ? 'Switch to the number version (no colours)' : 'Switch to the colour version');
      sw.addEventListener('click', () => { if (readOnly) return; version = other; drawIntro(); env.onChange(getState()); });
      kids.push(h('div.st-switch', sw));
    }
    stage.replaceChildren(...kids.filter(Boolean));
  }

  function drawRun() {
    const items = makeItems(block === 1);
    let at = 0;
    const started = now();
    const item = h('div', { class: cx('st-item', version === 'count' && 'is-count') });
    const progress = h('p.st-progress', `1 of ${n}`);
    const labels = version === 'colour' ? COLOURS : ['1', '2', '3', '4'];
    const keys = labels.map((label, i) => {
      const btn = h('button.st-key', { type: 'button' }, label, version === 'colour' ? h('small', `key ${i + 1}`) : null);
      btn.addEventListener('click', () => { if (live) live.press(i, btn); });
      return btn;
    });
    const show = () => {
      const it = items[at];
      item.textContent = it.show;
      item.style.color = it.ink ? `var(--${it.ink}-text)` : '';
      // a screen reader hears the word, so it is told the ink as well
      env.announce(it.ink ? `The word ${it.show}, in ${it.ink} ink` : it.show.split(' ').join(', '));
      progress.textContent = `${at + 1} of ${n}`;
    };
    live = {
      press(i, btn) {
        if (readOnly) return;
        if (i !== items[at].answer) {
          slips[block]++;
          const b = btn || keys[i];
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          play('wrong');
          return;
        }
        play('tap');
        at++;
        if (at >= n) { live = null; finish((now() - started) / 1000); } else show();
      },
    };
    count.textContent = block === 0 ? 'Block 1: they agree' : 'Block 2: they clash';
    stage.replaceChildren(item, h('div.st-keys', { role: 'group', 'aria-label': 'Answers' }, keys), progress);
    show();
    keys[0].focus({ preventScroll: true });
  }

  function finish(time) {
    times[block] = Math.max(0.1, Math.round(time * 100) / 100);
    block++;
    play(block >= 2 ? 'correct' : 'step');
    if (block >= 2) drawResults(); else drawIntro();
    env.onChange(getState());
  }

  function drawResults() {
    count.textContent = 'Your two blocks';
    const per = times.map((t) => t / n);
    const longest = Math.max(per[0], per[1]);
    const bar = (label, value, cls) => h('div',
      h('div.st-bar-head', h('span', label), h('span', `${secs(value)} per item`)),
      h('div.st-track', h('i', { class: cls, style: { width: `${Math.max(4, (value / longest) * 100)}%` } })));
    const extra = cost();
    let verdict;
    if (extra >= 8) verdict = ['The clashing items took you ', h('strong', `${extra}% longer`), ' each.'];
    else if (extra > -8) verdict = 'Your two blocks came out about level. With so few items that happens; over a long list nearly everyone is slower when the two clash.';
    else verdict = 'You were faster in the second block: practice outweighed the clash this time. Over a long list nearly everyone is slower when the two clash.';
    const total = slips[0] + slips[1];
    stage.replaceChildren(...[
      h('div.st-bars', bar(version === 'colour' ? 'Word and ink agree' : 'Neutral marks', per[0], 'is-a'), bar(version === 'colour' ? 'Word and ink clash' : 'Digits that clash with their number', per[1], 'is-b')),
      h('p.st-verdict', verdict),
      h('p.small.muted', 'The clashing block came second, after some practice, which if anything works against the effect.'),
      total > 0 ? h('p.small.muted', `Wrong presses: ${slips[0]} in block 1, ${slips[1]} in block 2.`) : null,
    ].filter(Boolean));
  }

  drawIntro();

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.version === 'count' || next.version === 'colour') version = next.version;
      if (!next.done) { if (block === 0) drawIntro(); return; }
      const t = Array.isArray(next.times) ? next.times : [];
      times[0] = t[0] > 0 ? t[0] : 6.2;
      times[1] = t[1] > 0 ? t[1] : 9.4;
      if (Array.isArray(next.slips)) { slips[0] = next.slips[0] || 0; slips[1] = next.slips[1] || 0; }
      block = 2;
      live = null;
      drawResults();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'stroop-task — ink colours', spec: { type: 'stroop-task' } },
  { title: 'stroop-task — the number version', spec: { type: 'stroop-task', version: 'count', items: 6 } },
];
