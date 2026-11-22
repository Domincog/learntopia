/**
 * card-row — a row of face-down number cards to search through, one flip at
 * a time. In a sorted row every flip rules out a whole side, and the widget
 * greys those cards out; in a shuffled row a flip says nothing about the
 * other cards. The learner feels the difference by counting flips.
 *
 * {
 *   type: 'card-row',
 *   values: [12, 17, 23, 31, 40, 58, 66],  // the cards, left to right (omit to deal random two-digit numbers)
 *   count: 7,                               // how many cards to deal when `values` is omitted (3 to 8)
 *   sorted: true,                           // true: dealt in increasing order, and a flip rules cards out
 *                                           // false: shuffled; nothing can be ruled out
 *   target: 23,                             // the number to find (default: one of the cards; in a dealt sorted
 *                                           // row, one that binary search needs the full number of flips for)
 *   unlucky: false,                         // shuffled rows only: the target always turns out to be under the
 *                                           // last card flipped (the worst case, guaranteed)
 *   open: [3],                              // indices already face up at the start (not counted as flips)
 *   flipped: [3, 5],                        // flips already made at the start, in this order (counted as flips):
 *                                           // a search shown part-way through, for the learner to finish
 *   pick: false,                            // true: nothing flips; the learner selects the ONE card to turn next
 *   redeal: true,                           // offer "New cards" (fresh random cards and target)
 * }
 *
 * State: { flipped, flips, found, picked, values, target, sorted }
 *   flipped  indices in the order the learner turned them (cards in `open` are not included)
 *   flips    how many that is
 *   found    the target card is face up
 *   picked   pick mode: index of the selected card (null if none)
 *
 * setState accepts { flipped: [3, 1, 2] }, { picked: 5 } or { found: true }
 * (plays binary search on a sorted row, left-to-right on a shuffled one).
 */
import { h, cx, clamp, readout, button, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('card-row', `
  .widget-card-row { justify-items: stretch; }
  .widget-card-row .cr-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2) var(--s3); font-weight: 700; }
  .widget-card-row .cr-target {
    display: inline-grid; place-items: center; min-width: 52px; min-height: 44px; padding: 0 0.6rem;
    border: var(--bw) solid var(--edge-strong); border-radius: 10px; background: var(--yellow); color: #1D1B26;
    font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums; box-shadow: 2px 2px 0 var(--drop);
  }
  .widget-card-row .cr-row { display: flex; justify-content: center; gap: 6px; }
  .widget-card-row .cr-slot { flex: 1 1 0; min-width: 0; max-width: 62px; display: grid; gap: 4px; justify-items: center; }
  .widget-card-row .cr-card {
    position: relative; width: 100%; min-height: 64px; padding: 0;
    display: grid; place-items: center; align-content: center; gap: 1px;
    border: var(--bw) solid var(--edge-strong); border-radius: 10px;
    background: var(--teal); color: #1D1B26;
    font-size: 1.2rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1;
    box-shadow: 2px 2px 0 var(--drop);
    transition: transform 0.1s ease, background-color 0.15s ease, opacity 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .widget-card-row .cr-card:not(:disabled) { cursor: pointer; }
  .widget-card-row .cr-card:not(:disabled):active { transform: translate(2px, 2px); box-shadow: none; }
  .widget-card-row .cr-card.is-up { background: var(--surface); color: var(--ink); border-color: var(--edge); box-shadow: none; }
  .widget-card-row .cr-card.is-hit { background: var(--green); color: #1D1B26; border-color: var(--edge-strong); }
  .widget-card-row .cr-card.is-out { background: transparent; color: transparent; border: var(--bw) dashed var(--hair); box-shadow: none; }
  .widget-card-row .cr-card.is-up.is-miss { background: var(--sunken); color: var(--ink-2); }
  .widget-card-row .cr-card.is-picked { box-shadow: 0 0 0 4px var(--blue); transform: translateY(-4px); }
  .widget-card-row .cr-tag { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.01em; color: var(--ink-3); white-space: nowrap; }
  .widget-card-row .cr-card.is-hit .cr-tag { color: #1D1B26; }
  .widget-card-row .cr-pos { font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); font-variant-numeric: tabular-nums; }
  .widget-card-row .cr-status { min-height: 1.5em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-card-row .cr-status.is-good { color: var(--green-text); }
  .widget-card-row .btn-ghost { box-shadow: none; }
  .widget-card-row.is-readonly .cr-card { pointer-events: none; }
`);

export default function create(spec, env) {
  const sorted = spec.sorted !== false;
  const pickMode = !!spec.pick;
  const unlucky = !!spec.unlucky && !sorted && !pickMode;
  const fixed = Array.isArray(spec.values) && spec.values.length >= 2 ? spec.values.map(Number) : null;
  const n = fixed ? fixed.length : clamp(Math.round(spec.count || 7), 3, 8);
  const open = new Set((spec.open || []).filter((i) => i >= 0 && i < n));
  let readOnly = !!env.readOnly;

  let values = [];
  let target = 0;
  let flipped = [];   // learner's flips, in order
  let picked = null;

  function deal() {
    const pool = [];
    for (let v = 10; v <= 99; v++) pool.push(v);
    let out = env.rng.sample(pool, n);
    if (sorted) out.sort((a, b) => a - b);
    else {
      const inOrder = (list) => list.every((v, i) => i === 0 || list[i - 1] < v) || list.every((v, i) => i === 0 || list[i - 1] > v);
      for (let guard = 0; guard < 20 && inOrder(out); guard++) out = env.rng.shuffle(out);
    }
    values = out;
    target = values[env.rng.pick(sorted ? hardest() : values.map((_, i) => i))];
  }
  /** Positions that binary search reaches last, so a dealt target is never a lucky first flip. */
  function hardest() {
    const depth = new Array(n).fill(0);
    const walk = (lo, hi, k) => {
      if (lo > hi) return;
      const mid = Math.floor((lo + hi) / 2);
      depth[mid] = k;
      walk(lo, mid - 1, k + 1);
      walk(mid + 1, hi, k + 1);
    };
    walk(0, n - 1, 1);
    const deepest = Math.max(...depth);
    return depth.map((d, i) => (d === deepest ? i : -1)).filter((i) => i >= 0);
  }
  if (fixed) { values = fixed.slice(); target = values.includes(spec.target) ? spec.target : values[env.rng.int(0, n - 1)]; }
  else { deal(); if (values.includes(spec.target)) target = spec.target; }

  const isUp = (i) => open.has(i) || flipped.includes(i);
  const found = () => values.some((v, i) => v === target && isUp(i));
  /** Sorted rows: is card i ruled out by the cards that are face up? */
  function ruledOut(i) {
    if (!sorted || pickMode) return false;
    for (let j = 0; j < n; j++) {
      if (!isUp(j) || values[j] === target) continue;
      if (values[j] < target && i <= j) return true;
      if (values[j] > target && i >= j) return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------ dom */
  const targetEl = h('span.cr-target');
  const roFlips = readout('Flips', { digits: 0 });
  const row = h('div.cr-row', { role: 'group', 'aria-label': `${n} cards, ${sorted ? 'sorted from smallest to largest' : 'in random order'}` });
  const status = h('div.cr-status');
  const head = h('div.cr-head', h('span', pickMode ? 'Looking for' : 'Find'), targetEl, pickMode ? null : roFlips.el);
  const again = button('New cards', () => {
    if (readOnly) return;
    deal();
    flipped = [];
    picked = null;
    play('drop');
    render();
    setStatus(intro());
    env.onChange(getState());
  }, { icon: 'shuffle', variant: 'ghost' });
  const el = h('div.w-frame', head, row, status, spec.redeal !== false && !pickMode && !env.compact ? h('div.w-buttons', again) : null);

  const cards = [];
  for (let i = 0; i < n; i++) {
    const card = h('button.cr-card', { type: 'button' });
    card.addEventListener('click', () => tap(i));
    cards.push(card);
    row.appendChild(h('div.cr-slot', card, h('span.cr-pos', { 'aria-hidden': 'true' }, String(i + 1))));
  }

  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('cr-status', tone && `is-${tone}`); };
  const intro = () => (pickMode ? 'Tap the card to turn over next.' : `Tap a card to turn it over. ${sorted ? 'The row is sorted, smallest on the left.' : 'The row is shuffled.'}`);

  function render() {
    const done = found();
    targetEl.textContent = String(target);
    roFlips.set(flipped.length);
    cards.forEach((card, i) => {
      const up = isUp(i);
      const hit = up && values[i] === target;
      const out = !up && (ruledOut(i) || (done && !pickMode));
      card.className = cx('cr-card', up && 'is-up', hit && 'is-hit', up && !hit && 'is-miss', out && 'is-out', picked === i && 'is-picked');
      card.replaceChildren();
      let label = `Card ${i + 1} of ${n}`;
      if (up) {
        const tag = hit ? 'found' : sorted ? (values[i] < target ? 'too low' : 'too high') : 'no';
        card.append(h('span', String(values[i])), h('span.cr-tag', tag));
        label += `: ${values[i]}, ${tag === 'no' ? 'not the target' : tag}`;
      } else if (out) {
        label += done ? ', not needed' : ', ruled out';
      } else {
        card.appendChild(h('span', { 'aria-hidden': 'true' }, '?'));
        label += `, face down${picked === i ? ', selected' : ''}`;
      }
      card.setAttribute('aria-label', label);
      card.disabled = readOnly || up || out || (done && !pickMode);
      if (pickMode) card.setAttribute('aria-pressed', String(picked === i));
    });
    again.disabled = readOnly || (!flipped.length && picked == null);
  }

  function flip(i) {
    if (unlucky && values[i] === target) {
      // the target slips away under another face-down card for as long as one exists
      const others = [];
      for (let j = 0; j < n; j++) if (j !== i && !isUp(j)) others.push(j);
      if (others.length) { const j = others[env.rng.int(0, others.length - 1)]; values[i] = values[j]; values[j] = target; }
    }
    flipped.push(i);
  }

  function explain(i) {
    const v = values[i];
    const k = flipped.length;
    if (v === target) return [`Found ${target} in ${k} flip${k === 1 ? '' : 's'}.`, 'good'];
    if (!sorted) return [`${v} is not it, and it says nothing about where ${target} is.`, ''];
    const side = v < target ? 'left' : 'right';
    const word = v < target ? 'lower' : 'higher';
    const edge = v < target ? i === 0 : i === n - 1;
    return [edge ? `${v} is too ${v < target ? 'low' : 'high'}. Only that one card is ruled out.` : `${v} is too ${v < target ? 'low' : 'high'}. Everything to its ${side} is even ${word}: ruled out.`, ''];
  }

  function tap(i) {
    if (readOnly || isUp(i)) return;
    if (pickMode) {
      picked = picked === i ? null : i;
      play('select');
      render();
      setStatus(picked == null ? intro() : `Card ${i + 1} is selected.`);
      env.onChange(getState());
      return;
    }
    if (found() || ruledOut(i)) return;
    flip(i);
    play(values[i] === target ? 'pop' : 'tap');
    render();
    const [text, tone] = explain(i);
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function getState() {
    return { flipped: flipped.slice(), flips: flipped.length, found: found(), picked, values: values.slice(), target, sorted };
  }

  if (Array.isArray(spec.flipped) && !pickMode) {
    for (const i of spec.flipped) if (Number.isInteger(i) && i >= 0 && i < n && !isUp(i) && !found()) flip(i);
  }
  render();
  if (flipped.length) { const [text, tone] = explain(flipped[flipped.length - 1]); setStatus(text, tone); } else setStatus(intro());
  if (readOnly) el.classList.add('is-readonly');

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      flipped = [];
      picked = null;
      if (pickMode) {
        if (Number.isInteger(next.picked) && next.picked >= 0 && next.picked < n && !isUp(next.picked)) picked = next.picked;
      } else if (Array.isArray(next.flipped)) {
        for (const i of next.flipped) if (Number.isInteger(i) && i >= 0 && i < n && !isUp(i) && !found()) flip(i);
      } else if (next.found) {
        if (sorted) {
          let lo = 0;
          let hi = n - 1;
          while (!found() && lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (!isUp(mid)) flip(mid);
            if (values[mid] < target) lo = mid + 1; else hi = mid - 1;
          }
        } else {
          for (let i = 0; i < n && !found(); i++) if (!isUp(i)) flip(i);
        }
      }
      render();
      if (flipped.length) { const [text, tone] = explain(flipped[flipped.length - 1]); setStatus(text, tone); } else setStatus(picked == null ? intro() : `Card ${picked + 1} is selected.`);
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'card-row — a sorted row: every flip rules out a side', spec: { type: 'card-row', count: 7, sorted: true } },
  { title: 'card-row — a shuffled row with the worst luck', spec: { type: 'card-row', count: 7, sorted: false, unlucky: true } },
  { title: 'card-row — a search shown part-way through', spec: { type: 'card-row', values: [14, 22, 35, 47, 53, 68, 81], target: 53, flipped: [3, 5], redeal: false } },
  { title: 'card-row — pick the card to turn next', spec: { type: 'card-row', values: [12, 17, 23, 31, 40, 58, 66], target: 23, open: [3], pick: true } },
];
