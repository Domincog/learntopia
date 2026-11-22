/**
 * breath-check — the ten-second breathing check of first aid, as something to
 * watch. A person lies on their back (a plain side-view outline); pressing the
 * button starts a ten-second look, during which the chest rises and falls and
 * a strip chart of its movement is drawn underneath. The learner then says
 * whether that was normal breathing.
 *
 * {
 *   type: 'breath-check',
 *   pattern: 'normal',        // 'normal' | 'gasping' | 'slow' | 'none'
 *   rate: 15,                 // normal breathing: breaths a minute (12 to 20 in a resting adult)
 *   slowAt: 2,                // slow breathing: the second at which the one shallow breath of the ten seconds begins
 *   gasps: [1.4, 7.9],        // gasping: the seconds at which a gasp comes (one or two in ten seconds)
 *   seconds: 10,              // length of the check
 *   ask: true,                // show the two answer buttons after the look (false: only watch)
 *   compare: ['normal', 'gasping', 'none'],   // instead of `pattern`: tabs that switch between patterns, each
 *                                             // named and described; nothing is asked (for an explorable figure)
 * }
 *
 * State: { watched, answer, seen, seenCount, breaths }
 *   watched    the ten seconds have been watched to the end (for the pattern now shown)
 *   answer     'normal' | 'abnormal' | null: what the learner said
 *   seen       compare mode: the patterns watched to the end so far
 *   seenCount  how many of them
 *   breaths    chest rises during the look (what a careful observer would count)
 *
 * setState({ watched: true, answer: 'abnormal' }) shows the finished strip and the answer;
 * setState({ seen: ['normal', 'gasping', 'none'] }) marks compare tabs as watched.
 *
 * The model. Normal breathing is drawn as a smooth, regular wave. Gasping
 * (agonal breathing, common in the first minutes of a cardiac arrest) is drawn
 * as one or two sudden, isolated heaves with long stillness between. Slow
 * breathing (as in an opioid overdose) is one shallow breath and then a long
 * pause: about five breaths a minute. It leaves
 * out sound (gasps are often noisy: snoring, gurgling, groaning), which is why
 * the description under the strip mentions it. With reduced motion the strip
 * is drawn at once instead of over ten seconds.
 */
import { frame, button, loop, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 268;
const CX0 = 44;        // strip chart
const CX1 = 540;
const CY0 = 168;
const CY1 = 228;

addStyles('breath-check', `
  .widget-breath-check .bc-tabs, .widget-breath-check .bc-answers { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-breath-check .bc-tab, .widget-breath-check .bc-answer {
    min-height: 42px; padding: 0.45rem 0.9rem; border: var(--bw) solid var(--edge-strong); border-radius: var(--r);
    background: var(--surface); color: var(--ink); font-weight: 700; font-size: var(--fs-sm); cursor: pointer; user-select: none; -webkit-user-select: none;
    display: inline-flex; align-items: center; gap: 0.4rem; text-align: center;
  }
  .widget-breath-check .bc-tab[aria-pressed="true"], .widget-breath-check .bc-answer[aria-checked="true"] { background: var(--blue-soft); border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); }
  .widget-breath-check .bc-tab:focus-visible, .widget-breath-check .bc-answer:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-breath-check .bc-answer[aria-disabled="true"] { opacity: 0.55; cursor: default; }
  .widget-breath-check.is-readonly .bc-answer, .widget-breath-check.is-readonly .bc-tab { cursor: default; }
  .widget-breath-check .bc-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 2.6em; text-wrap: balance; }
  .widget-breath-check .bc-seen { font-weight: 800; color: var(--green-text); }
  .widget-breath-check .bc-trace { fill: none; stroke: var(--blue); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .widget-breath-check .bc-now { stroke: var(--ink-3); stroke-width: 1.5; stroke-dasharray: 3 4; }
`);

export const PATTERNS = {
  normal: { label: 'Normal breathing', note: 'Regular and quiet: the chest rises and falls two or three times in ten seconds.' },
  gasping: { label: 'Gasping', note: 'A sudden gasp, then a long stillness. Often noisy: a snore, a gurgle or a groan. This is not normal breathing.' },
  slow: { label: 'Slow, shallow breathing', note: 'One shallow breath, then a long pause: far fewer than the two or three breaths of normal breathing. This is not normal breathing.' },
  none: { label: 'No breathing', note: 'No movement of the chest at all in ten seconds.' },
};

/** Chest movement (0 flat … 1 fully risen) at time t for a pattern. Exported for the course tests. */
export function chestAt(pattern, t, { rate = 15, gasps = [1.4, 7.9], phase = 0, slowAt = 2 } = {}) {
  if (pattern === 'normal') return 0.5 - 0.5 * Math.cos((2 * Math.PI * (t + phase) * rate) / 60);
  if (pattern === 'slow') {                       // one shallow breath of three seconds in every twelve
    const into = (((t - slowAt) % 12) + 12) % 12;
    return into < 3 ? 0.6 * (0.5 - 0.5 * Math.cos((2 * Math.PI * into) / 3)) : 0;
  }
  if (pattern === 'gasping') {
    let v = 0;
    for (const g of gasps) { const d = (t - g) / 0.22; v = Math.max(v, Math.exp(-d * d)); }
    return v;
  }
  return 0;
}

/**
 * How many times the chest comes (all but) fully up within the look: what a careful observer would
 * count as breaths, or as gasps. Exported for the course tests.
 */
export function countBreaths(pattern, seconds, opts = {}) {
  let n = 0;
  const dt = 0.01;
  const top = pattern === 'slow' ? 0.54 : 0.9;      // a slow breath in this model is also a shallow one
  let up = chestAt(pattern, 0, opts) >= top;
  for (let t = dt; t <= seconds + dt / 2; t += dt) {
    const now = chestAt(pattern, t, opts) >= top;
    if (now && !up) n++;
    up = now;
  }
  return n;
}

export default function create(spec, env) {
  const seconds = clamp(Number(spec.seconds) || 10, 4, 20);
  const compare = Array.isArray(spec.compare) && spec.compare.length ? spec.compare.filter((p) => PATTERNS[p]) : null;
  const ask = !compare && spec.ask !== false && !env.compact;
  const rate = clamp(Number(spec.rate) || 15, 8, 30);
  const gasps = Array.isArray(spec.gasps) && spec.gasps.length ? spec.gasps.map(Number) : [1.4, 7.9];
  const opts = { rate, gasps, phase: 0, slowAt: Number.isFinite(Number(spec.slowAt)) ? clamp(Number(spec.slowAt), 0, 6) : 2 };
  let pattern = compare ? compare[0] : (PATTERNS[spec.pattern] ? spec.pattern : 'normal');
  let readOnly = !!env.readOnly;
  let t = 0;                 // seconds of the look that have passed
  let running = false;
  let watched = false;
  let answer = null;
  const seen = new Set();

  const fr = frame({ width: W, height: H, label: spec.alt || 'A person lying on their back, with a strip chart of chest movement over ten seconds' });
  const svg = fr.svg;

  // --- the person: a plain side view, lying on the back, head to the left
  svg.appendChild(s('line', { x1: 24, x2: 536, y1: 112, y2: 112, stroke: 'var(--hair)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  svg.appendChild(s('rect', { x: 318, y: 80, width: 196, height: 30, rx: 14, fill: 'var(--gray-soft)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));           // legs
  svg.appendChild(s('path', { d: 'M500 80 q16 -22 24 -2 l0 32 l-24 0 Z', fill: 'var(--gray-soft)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' })); // feet
  const chest = s('path', { fill: 'var(--blue-soft)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  svg.appendChild(chest);
  svg.appendChild(s('rect', { x: 150, y: 96, width: 150, height: 14, rx: 7, fill: 'var(--blue-soft)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));           // the near arm, at the side
  svg.appendChild(s('circle', { cx: 74, cy: 88, r: 23, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));                                 // head
  svg.appendChild(s('path', { d: 'M62 78 q6 -4 12 0', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));                     // closed eye
  const riseMark = s('line', { x1: 196, x2: 196, y1: 30, y2: 30, stroke: 'var(--blue)', 'stroke-width': 3, 'stroke-linecap': 'round' });
  svg.appendChild(riseMark);
  svg.appendChild(s('text.fig-label', { x: 208, y: 32 }, 'chest'));

  // --- the strip chart
  svg.appendChild(s('rect', { x: CX0, y: CY0 - 8, width: CX1 - CX0, height: CY1 - CY0 + 16, rx: 8, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 1.5 }));
  for (let k = 0; k <= seconds; k++) {
    const x = CX0 + ((CX1 - CX0) * k) / seconds;
    svg.appendChild(s('line', { x1: x, x2: x, y1: CY1 + 8, y2: CY1 + (k % 5 === 0 ? 16 : 12), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    if (k % 5 === 0) svg.appendChild(s('text.tick-label', { x, y: CY1 + 30, 'text-anchor': k === 0 ? 'start' : k === seconds ? 'end' : 'middle' }, `${k} s`));
  }
  svg.appendChild(s('text.fig-label-sm', { x: CX0 + 2, y: CY0 - 15 }, 'chest movement'));
  const now = s('line.bc-now', { y1: CY0 - 8, y2: CY1 + 8 });
  const trace = s('path.bc-trace');
  svg.appendChild(now);
  svg.appendChild(trace);

  const note = h('p.bc-note', { 'aria-live': 'polite' });
  const tabs = compare ? h('div.bc-tabs', { role: 'group', 'aria-label': 'Breathing pattern to watch' }) : null;
  const tabEls = new Map();
  if (compare) {
    for (const p of compare) {
      const el = h('div.bc-tab', { role: 'button', tabindex: '0', 'aria-pressed': 'false' }, PATTERNS[p].label);
      el.dataset.keys = 'own';
      const go = () => { if (readOnly || running) return; pattern = p; t = 0; watched = false; play('select'); render(); start(); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
      tabEls.set(p, el);
      tabs.appendChild(el);
    }
    fr.el.insertBefore(tabs, fr.canvas);
  }
  fr.el.insertBefore(note, fr.readouts);

  const startBtn = button(`Watch for ${seconds} seconds`, () => { if (!readOnly && !running) { t = 0; watched = false; answer = null; render(); start(); } }, { icon: 'play', variant: 'primary' });
  if (!env.compact) fr.buttons.appendChild(startBtn);

  const answers = ask ? h('div.bc-answers', { role: 'radiogroup', 'aria-label': 'What did you see?' }) : null;
  const answerEls = new Map();
  if (ask) {
    for (const [key, label] of [['normal', 'Breathing normally'], ['abnormal', 'Not breathing normally']]) {
      const el = h('div.bc-answer', { role: 'radio', tabindex: '0', 'aria-checked': 'false' }, label);
      el.dataset.keys = 'own';
      const choose = () => {
        if (readOnly || !watched) return;
        answer = key;
        play('select');
        render();
        env.onChange(getState());
      };
      el.addEventListener('click', choose);
      el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(); } });
      answerEls.set(key, el);
      answers.appendChild(el);
    }
    fr.el.appendChild(answers);
  }

  const xOf = (time) => CX0 + ((CX1 - CX0) * time) / seconds;
  const yOf = (v) => CY1 - v * (CY1 - CY0);
  function tracePath(upTo) {
    let d = '';
    const n = Math.max(1, Math.round(upTo * 40));
    for (let i = 0; i <= n; i++) {
      const time = (upTo * i) / n;
      d += `${i ? 'L' : 'M'}${xOf(time).toFixed(1)} ${yOf(chestAt(pattern, time, opts)).toFixed(1)}`;
    }
    return d;
  }

  function render() {
    const v = running || watched ? chestAt(pattern, Math.min(t, seconds), opts) : chestAt(pattern, 0, opts);
    const lift = 16 * v;
    chest.setAttribute('d', `M98 110 L98 84 Q104 ${70 - lift * 0.4} 140 ${64 - lift * 0.7} Q196 ${52 - lift} 262 ${70 - lift * 0.5} Q300 78 320 82 L320 110 Z`);
    riseMark.setAttribute('y1', 46 - lift);
    riseMark.setAttribute('y2', 26);
    riseMark.style.opacity = v > 0.05 ? 1 : 0.25;
    trace.setAttribute('d', t > 0 ? tracePath(Math.min(t, seconds)) : '');
    now.setAttribute('x1', xOf(Math.min(t, seconds)));
    now.setAttribute('x2', xOf(Math.min(t, seconds)));
    now.style.display = running ? '' : 'none';
    startBtn.textContent = '';
    startBtn.append(running ? `Watching… ${Math.max(0, Math.ceil(seconds - t))} s` : watched ? 'Watch again' : `Watch for ${seconds} seconds`);
    startBtn.disabled = running || readOnly;
    if (compare) {
      for (const [p, el] of tabEls) {
        el.setAttribute('aria-pressed', String(p === pattern));
        el.replaceChildren(PATTERNS[p].label, seen.has(p) ? h('span.bc-seen', { 'aria-label': 'watched' }, '✓') : null);
      }
      note.textContent = watched || running ? PATTERNS[pattern].note : 'Choose a pattern, or press the button, and watch the chest and the strip.';
    } else if (ask) {
      note.textContent = running ? 'Look at the chest. Listen and feel for breath.'
        : watched ? (answer ? '' : 'What did you see? Choose one.')
          : `Press the button and watch the chest for ${seconds} seconds.`;
    } else {
      note.textContent = watched ? PATTERNS[pattern].note : '';
    }
    if (ask) {
      for (const [key, el] of answerEls) {
        el.setAttribute('aria-checked', String(answer === key));
        el.setAttribute('aria-disabled', String(!watched || readOnly));
        el.setAttribute('tabindex', watched && !readOnly ? '0' : '-1');
      }
    }
    svg.setAttribute('aria-label', `${spec.alt || 'A person lying on their back.'} ${watched ? `After ${seconds} seconds: the chest rose ${countBreaths(pattern, seconds, opts)} time(s).` : 'The check has not been made yet.'}`);
  }

  function finish(silent) {
    running = false;
    anim.stop();
    t = seconds;
    watched = true;
    if (compare) seen.add(pattern);
    render();
    if (!silent) {
      const n = countBreaths(pattern, seconds, opts);
      env.announce(`${seconds} seconds watched. The chest rose ${n} ${n === 1 ? 'time' : 'times'}${pattern === 'gasping' ? ', each a sudden gasp' : pattern === 'normal' ? ', evenly' : pattern === 'slow' ? ', slowly and only a little' : ''}.`);
      env.onChange(getState());
    }
  }
  const anim = loop((dt) => {
    t += dt;
    if (t >= seconds) { finish(false); return; }
    render();
  });
  function start() {
    if (reducedMotion()) { finish(false); return; }
    running = true;
    render();
    anim.start();
  }

  const getState = () => ({
    watched,
    answer,
    seen: (compare || []).filter((p) => seen.has(p)),
    seenCount: seen.size,
    breaths: countBreaths(pattern, seconds, opts),
  });

  render();
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      running = false;
      if (Array.isArray(next.seen) && compare) {
        for (const p of next.seen) if (compare.includes(p)) { seen.add(p); pattern = p; }
        watched = seen.size > 0;
        t = watched ? seconds : 0;
      }
      if (next.watched || next.answer) { watched = true; t = seconds; }
      if (next.answer === 'normal' || next.answer === 'abnormal') answer = next.answer;
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'breath-check — normal breathing', spec: { type: 'breath-check', pattern: 'normal', rate: 15 } },
  { title: 'breath-check — gasping', spec: { type: 'breath-check', pattern: 'gasping', gasps: [1.4, 7.9] } },
  { title: 'breath-check — slow, shallow breathing', spec: { type: 'breath-check', pattern: 'slow' } },
  { title: 'breath-check — compare the three patterns', spec: { type: 'breath-check', compare: ['normal', 'gasping', 'none'] } },
];
