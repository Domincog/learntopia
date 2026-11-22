/**
 * conjecture-test — test a claim about every whole number, one number at a
 * time. A strip of cells shows which values of n have been tried: a tick where
 * the claim held, a cross where it failed. The point is the experience of a
 * pattern that holds again and again and then breaks (or never breaks, which
 * still proves nothing).
 *
 * {
 *   type: 'conjecture-test',
 *   claim: '$n^2 + n + 41$ is prime',   // markdown shown above the strip (optional)
 *   preset: 'euler',                    // a built-in test (see PRESETS below), or …
 *   test: (n) => ({ ok: true, text: '…' }),   // … your own: does the claim hold for n? `text` (markdown) is the working shown
 *   min: 0, max: 45,                    // the values of n on offer
 *   n: 0,                               // the value selected at the start
 *   cols: 12,                           // cells per row
 * }
 *
 * Moving the slider across several values tests every value it passes.
 *
 * State: { n, tested, failures, found, first, all }
 *   tested    every n tried so far (sorted)
 *   failures  the tested values for which the claim failed (sorted)
 *   found     at least one failure has been seen
 *   first     the smallest failure seen, or null
 *   all       every value from min to max has been tested
 *
 * setState accepts { n } (tests that value) or { tested: [..] }.
 */
import { frame, sliderRow, readout, button, hue, s, h, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('conjecture-test', `
  .widget-conjecture-test .ct-claim { text-align: center; font-weight: 700; }
  .widget-conjecture-test .ct-line { text-align: center; min-height: 3.1em; display: grid; align-content: center; font-size: var(--fs-md); }
  .widget-conjecture-test .ct-cell { cursor: pointer; outline: none; }
  .widget-conjecture-test .ct-cell:focus-visible rect { stroke: var(--focus); stroke-width: 4; }
  .widget-conjecture-test.is-readonly .ct-cell { cursor: default; }
`);

/** Smallest factor of v greater than 1 (v itself when v is prime). */
export function smallestFactor(v) {
  for (let d = 2; d * d <= v; d++) if (v % d === 0) return d;
  return v;
}

export const PRESETS = {
  /** Euler's polynomial: prime for n = 0 … 39, then 40² + 40 + 41 = 41 × 41. */
  euler: (n) => {
    const v = n * n + n + 41;
    const p = smallestFactor(v);
    return p === v
      ? { ok: true, text: `$${n}^2 + ${n} + 41 = ${v}$, which is **prime**.` }
      : { ok: false, text: `$${n}^2 + ${n} + 41 = ${v} = ${p} \\times ${v / p}$: **not prime**.` };
  },
  /** The sum of the first n odd numbers is n² (true for every n ≥ 1). */
  'odd-sum': (n) => {
    let sum = 0;
    for (let k = 1; k <= n; k++) sum += 2 * k - 1;
    const terms = n <= 4 ? Array.from({ length: n }, (_, k) => 2 * k + 1).join(' + ') : `1 + 3 + \\cdots + ${2 * n - 1}`;
    return { ok: sum === n * n, text: `$${terms} = ${sum}$ and $${n}^2 = ${n * n}$.` };
  },
};

export default function create(spec, env) {
  const test = typeof spec.test === 'function' ? spec.test : PRESETS[spec.preset] || PRESETS.euler;
  const min = Math.round(spec.min != null ? spec.min : 0);
  const max = Math.max(min, Math.round(spec.max != null ? spec.max : 45));
  const total = max - min + 1;
  const cols = clamp(Math.round(spec.cols || 12), 4, 16);
  const rows = Math.ceil(total / cols);
  const W = 480;
  const cell = W / cols;
  const H = rows * cell;
  let n = clamp(Math.round(spec.n != null ? spec.n : min), min, max);
  let readOnly = !!env.readOnly;
  const tested = new Set();
  const results = new Map();
  const resultOf = (k) => { if (!results.has(k)) results.set(k, test(k)); return results.get(k); };

  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, maxWidth: 520, label: spec.alt || 'A strip of numbers to test a claim on' });
  const { svg } = fr;
  if (spec.claim && !env.compact) fr.el.insertBefore(h('div.ct-claim', { html: mdInline(`Claim: ${spec.claim}`) }), fr.canvas);
  const line = h('div.ct-line');
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);
  const roTested = readout('tested', { digits: 0 });
  const roFails = readout('failures', { digits: 0, color: 'red' });
  if (!env.compact) fr.readouts.append(roTested.el, roFails.el);

  const cells = [];
  for (let k = min; k <= max; k++) {
    const i = k - min;
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    const rect = s('rect', { x: x + 2.5, y: y + 2.5, width: cell - 5, height: cell - 5, rx: 7, 'stroke-width': 2 });
    const num = s('text', { class: 'fig-label-sm', x: x + cell / 2, y: y + cell / 2 - 1, 'text-anchor': 'middle' }, String(k));
    const mark = s('path', { fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const g = s('g', { class: 'ct-cell', tabindex: '0', role: 'button' }, rect, num, mark);
    g.dataset.keys = 'own';
    g.addEventListener('click', () => choose(k, false));
    g.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      ev.stopPropagation();
      choose(k, false);
    });
    cells.push({ k, g, rect, mark, x, y });
    svg.appendChild(g);
  }

  const failures = () => Array.from(tested).filter((k) => !resultOf(k).ok).sort((a, b) => a - b);
  const getState = () => {
    const fails = failures();
    return { n, tested: Array.from(tested).sort((a, b) => a - b), failures: fails, found: fails.length > 0, first: fails.length ? fails[0] : null, all: tested.size === total };
  };

  function draw() {
    for (const c of cells) {
      const done = tested.has(c.k);
      const ok = done && resultOf(c.k).ok;
      c.rect.setAttribute('fill', !done ? 'var(--surface)' : ok ? hue('green', 'soft') : hue('red', 'soft'));
      c.rect.setAttribute('stroke', c.k === n ? 'var(--ink)' : !done ? 'var(--hair)' : ok ? hue('green') : hue('red'));
      c.rect.setAttribute('stroke-width', c.k === n ? 3.5 : 2);
      const mx = c.x + cell / 2;
      const my = c.y + cell - 10;
      c.mark.setAttribute('d', !done ? '' : ok ? `M${mx - 5} ${my - 1}l3.5 3.5l6 -7` : `M${mx - 4} ${my - 4}l8 8M${mx + 4} ${my - 4}l-8 8`);
      c.mark.setAttribute('stroke', ok ? hue('green', 'text') : hue('red', 'text'));
      c.g.setAttribute('aria-label', `n = ${c.k}: ${!done ? 'not tested' : ok ? 'the claim holds' : 'the claim fails'}`);
    }
    const now = resultOf(n);
    line.replaceChildren(h('span', { html: mdInline(`$n = ${n}$: ${now.text}`) }));
    const fails = failures();
    roTested.set(`${tested.size} of ${total}`);
    roFails.set(fails.length);
    svg.setAttribute('aria-label', `${tested.size} of ${total} values tested. ${fails.length ? `The claim failed for n = ${fails.join(', ')}.` : 'The claim has held every time so far.'}`);
  }

  /** Select k; with `sweep`, every value passed on the way counts as tested too. */
  function choose(k, sweep) {
    if (readOnly) return;
    const from = sweep ? Math.min(n, k) : k;
    const to = sweep ? Math.max(n, k) : k;
    for (let v = from; v <= to; v++) tested.add(v);
    n = k;
    if (slider) slider.set(n);
    play(resultOf(n).ok ? 'tap' : 'pop');
    draw();
    env.announce(`n = ${n}: the claim ${resultOf(n).ok ? 'holds' : 'fails'}.`);
    env.onChange(getState());
  }

  let slider = null;
  if (!env.compact && !spec.static) {
    slider = sliderRow({ label: '$n$', min, max, step: 1, value: n, color: 'orange', onInput: (v) => choose(v, true) });
    fr.controls.appendChild(slider.el);
    fr.buttons.appendChild(button('Test the next number', () => { if (n < max) choose(n + 1, false); }, { icon: 'arrow-right' }));
  }
  tested.add(n);
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.tested)) { tested.clear(); for (const k of next.tested) if (k >= min && k <= max) tested.add(Math.round(k)); }
      if (next.n != null) { n = clamp(Math.round(next.n), min, max); tested.add(n); if (slider) slider.set(n); }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      for (const c of cells) c.g.setAttribute('tabindex', readOnly ? '-1' : '0');
    },
  };
}

export const examples = [
  { title: 'conjecture-test — Euler\'s polynomial', spec: { type: 'conjecture-test', preset: 'euler', claim: '$n^2 + n + 41$ is prime', min: 0, max: 47 } },
  { title: 'conjecture-test — a claim that never fails', spec: { type: 'conjecture-test', preset: 'odd-sum', claim: 'the first $n$ odd numbers add up to $n^2$', min: 1, max: 24, n: 1 } },
];
