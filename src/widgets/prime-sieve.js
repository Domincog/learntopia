/**
 * prime-sieve — the sieve of Eratosthenes, worked by hand. Tap the smallest
 * number still standing: it is a prime, and all its larger multiples are
 * crossed out in its colour. Repeat. When a tap crosses out nothing new, every
 * number still standing is prime.
 *
 * {
 *   type: 'prime-sieve',
 *   n: 100,          // the board shows 1 … n
 *   cols: 10,        // numbers per row
 *   sieved: [2],     // primes already sieved with when the figure appears
 *   static: false,   // true: picture only (for figures)
 * }
 *
 * The widget keeps the learner to the real algorithm: until every composite is
 * gone, only the smallest standing number can be used (anything else gets an
 * explanatory note instead).
 *
 * State: { n, sieved, crossed, standing, complete, last }
 *   sieved   — the primes sieved with so far, in order
 *   crossed  — how many numbers are crossed out
 *   standing — the numbers from 2 up that are not crossed out (sorted; includes the sieved primes)
 *   complete — every composite number up to n is crossed out
 *   last     — { p, fresh }: the most recent prime and how many new numbers it crossed out (null at the start)
 *
 * setState accepts { sieved: [2, 3, 5, 7] }.
 */
import { h, cx, readout, button, hue, clamp, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

const PALETTE = ['blue', 'orange', 'green', 'violet', 'teal', 'pink'];

addStyles('prime-sieve', `
  .widget-prime-sieve .w-grid { touch-action: manipulation; }
  .widget-prime-sieve .ps-cell {
    position: relative;
    font-size: clamp(0.68rem, 3.3vw, 1rem);
    transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.12s var(--ease-spring);
  }
  .widget-prime-sieve .ps-cell::after {
    content: '';
    position: absolute; left: 10%; right: 10%; top: calc(50% - 1px);
    border-top: 2px solid var(--ps-color, var(--ink-3));
    transform: rotate(-45deg) scaleX(0);
    transition: transform 0.18s ease;
    transition-delay: inherit;
    pointer-events: none;
  }
  .widget-prime-sieve .ps-cell.is-crossed { background: var(--ps-soft); border-color: var(--hair); color: var(--ink-2); font-weight: 600; }
  .widget-prime-sieve .ps-cell.is-crossed::after { transform: rotate(-45deg) scaleX(1); }
  .widget-prime-sieve .ps-cell.is-sieved { background: var(--ps-color); border-color: var(--edge-strong); color: #1D1B26; font-weight: 800; }
  .widget-prime-sieve .ps-cell.is-prime { background: var(--yellow); border-color: var(--edge-strong); color: #1D1B26; font-weight: 800; }
  .widget-prime-sieve .ps-cell.is-one { border-style: dashed; border-color: var(--ink-3); color: var(--ink-3); background: transparent; }
  .widget-prime-sieve .ps-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2) var(--s4); font-size: var(--fs-sm); font-weight: 700; }
  .widget-prime-sieve .ps-legend:empty { display: none; }
  /* a hundred cells, the counts and the button have to share a short laptop screen */
  @media (min-width: 700px) and (max-height: 820px) { .widget-prime-sieve { gap: var(--s2); } }
  .widget-prime-sieve .ps-key { display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
  .widget-prime-sieve .ps-key i {
    display: grid; place-items: center;
    min-width: 26px; height: 26px; padding: 0 5px;
    border: 2px solid var(--edge-strong); border-radius: 7px;
    font-style: normal; font-weight: 800; color: #1D1B26;
  }
  .widget-prime-sieve .ps-note { min-height: 3em; display: grid; place-items: center; max-width: 48ch; justify-self: center; color: var(--ink-2); font-size: var(--fs-md); font-weight: 600; line-height: 1.4; }
`);

const isPrime = (k) => { if (k < 2) return false; for (let d = 2; d * d <= k; d++) if (k % d === 0) return false; return true; };

export default function create(spec, env) {
  const n = clamp(Math.round(spec.n || 100), 10, 200);
  const cols = clamp(Math.round(spec.cols || 10), 2, 20);
  const interactive = !env.compact && !spec.static;
  let readOnly = !!env.readOnly;

  let sieved = [];                          // primes used, in order
  const by = new Array(n + 1).fill(0);      // by[k]: the prime that crossed k out (0 = still standing)
  let revealed = false;                     // survivors are marked as primes once a tap crosses out nothing
  let last = null;
  let settle = 0;                           // timer that clears the wave's transition delays

  const colorOf = (p) => PALETTE[Math.max(0, sieved.indexOf(p)) % PALETTE.length];
  const smallestStanding = () => { for (let k = 2; k <= n; k++) if (!by[k] && !sieved.includes(k)) return k; return null; };
  const isComplete = () => { for (let k = 4; k <= n; k++) if (!by[k] && !isPrime(k)) return false; return true; };
  const crossedCount = () => by.reduce((t, v) => t + (v ? 1 : 0), 0);

  /* ------------------------------------------------------------ board */
  // On a short screen the cells shrink a little so that the whole board stays in view.
  const boardRows = Math.ceil(n / cols);
  const roomy = typeof window === 'undefined' ? 44 : Math.floor((window.innerHeight - 270) / boardRows) - 4;
  const cellSize = env.compact ? 22 : Math.max(30, Math.min(44, roomy));
  const board = h('div', {
    class: cx('w-grid', env.compact && 'is-compact'),
    role: 'group', // labelled buttons in a group; a real grid would need rows and cells
    'aria-label': spec.alt || `Numbers 1 to ${n}`,
    style: { '--cols': cols, '--cell': `${cellSize}px`, '--gap': env.compact ? '2px' : '4px' },
  });
  board.dataset.keys = 'own';
  const cells = [null];
  for (let k = 1; k <= n; k++) {
    const el = h('button.w-cell.ps-cell', { type: 'button', tabindex: k === 2 ? '0' : '-1' }, String(k));
    el.addEventListener('click', () => tap(k));
    el.addEventListener('keydown', (ev) => {
      let j = 0;
      if (ev.key === 'ArrowRight') j = k + 1;
      else if (ev.key === 'ArrowLeft') j = k - 1;
      else if (ev.key === 'ArrowDown') j = k + cols;
      else if (ev.key === 'ArrowUp') j = k - cols;
      else return;
      ev.preventDefault();
      if (j >= 1 && j <= n) { el.tabIndex = -1; cells[j].tabIndex = 0; cells[j].focus(); }
    });
    cells.push(el);
    board.appendChild(el);
  }

  const note = h('p.w-hint.ps-note', { 'aria-live': 'polite' });
  const legend = h('div.ps-legend');
  const roCrossed = readout('crossed out', { digits: 0 });
  const roStanding = readout('still standing', { digits: 0 });
  const resetBtn = button('Start again', () => {
    if (readOnly || !sieved.length) return;
    load([]);
    note.textContent = '';
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });

  const wrap = h('div.w-frame.w-grid-frame', { class: env.compact ? 'is-compact' : '' }, board);
  if (!env.compact) {
    wrap.appendChild(h('div.w-readouts', roCrossed.el, roStanding.el));
    wrap.appendChild(legend);
    if (interactive) {
      wrap.appendChild(note);
      wrap.appendChild(h('div.w-buttons', resetBtn));
    }
  }

  function paint(k, delay = 0) {
    const el = cells[k];
    const p = by[k];
    const used = sieved.includes(k);
    const prime = revealed && !p && !used && k > 1;
    el.style.transitionDelay = delay ? `${delay}ms` : '0ms';
    el.classList.toggle('is-one', k === 1);
    el.classList.toggle('is-crossed', !!p);
    el.classList.toggle('is-sieved', used);
    el.classList.toggle('is-prime', prime);
    const tint = p || (used ? k : 0);
    if (tint) {
      el.style.setProperty('--ps-color', hue(colorOf(tint)));
      el.style.setProperty('--ps-soft', hue(colorOf(tint), 'soft'));
    } else {
      el.style.removeProperty('--ps-color');
      el.style.removeProperty('--ps-soft');
    }
    el.setAttribute('aria-label', k === 1 ? '1, neither prime nor composite'
      : p ? `${k}, crossed out, a multiple of ${p}`
        : used ? `${k}, prime, used for sieving`
          : prime ? `${k}, prime` : `${k}, still standing`);
  }

  function refresh() {
    const crossed = crossedCount();
    roCrossed.set(crossed);
    roStanding.set(n - 1 - crossed);
    resetBtn.disabled = readOnly || !sieved.length;
    legend.replaceChildren(...sieved.map((p) => {
      let count = 0;
      for (let k = 2 * p; k <= n; k += p) if (by[k] === p) count++;
      return h('span.ps-key', h('i', { style: { background: hue(colorOf(p)) } }, String(p)), count ? `crossed out ${count}` : 'nothing new');
    }));
    if (revealed) legend.appendChild(h('span.ps-key', h('i', { style: { background: hue('yellow') } }), 'still standing: prime'));
  }

  function say(text, k, nudge) {
    note.textContent = text;
    if (k && nudge && cells[k]) {
      cells[k].classList.remove('shake');
      void cells[k].offsetWidth; // restart the animation
      cells[k].classList.add('shake');
    }
  }

  /** Cross out the multiples of p. Returns the numbers newly crossed out. */
  function sieveWith(p) {
    const fresh = [];
    sieved.push(p);
    for (let k = 2 * p; k <= n; k += p) if (!by[k]) { by[k] = p; fresh.push(k); }
    if (!fresh.length) revealed = true;
    last = { p, fresh: fresh.length };
    return fresh;
  }

  function tap(k) {
    if (readOnly || !interactive) return;
    if (k === 1) { say('1 sits this out: it has only one factor, so it is neither prime nor composite.', k, true); return; }
    if (by[k]) { say(`${k} is already crossed out: it is a multiple of ${by[k]}.`, k, true); return; }
    if (sieved.includes(k)) { say(`You have already used ${k}.`, k, true); return; }
    const next = smallestStanding();
    if (k !== next && !isComplete()) { say(`Work in order: the smallest number still standing is ${next}.`, k, true); return; }

    const fresh = sieveWith(k);
    const animate = !reducedMotion();
    paint(k);
    fresh.forEach((m, i) => paint(m, animate ? Math.min(i * 9, 420) : 0)); // a quick wave along the multiples
    if (revealed) for (let m = 2; m <= n; m++) paint(m);
    clearTimeout(settle);
    if (animate) settle = setTimeout(() => { for (const m of fresh) cells[m].style.transitionDelay = '0ms'; }, 700);
    refresh();
    if (fresh.length) {
      play('drop');
      say(`${k} is prime. Crossed out ${fresh.length} of its multiples.`);
    } else {
      play('pop');
      say(`${k} is prime, but there is nothing new to cross out: its first fresh multiple would be ${k} × ${k} = ${k * k}. Every number still standing is prime.`);
    }
    env.onChange(getState()); // (the note is a live region, so screen readers hear it without a separate announcement)
  }

  function load(primes) {
    sieved = [];
    by.fill(0);
    revealed = false;
    last = null;
    for (const p of primes || []) {
      if (Number.isInteger(p) && p >= 2 && p <= n && !by[p] && !sieved.includes(p)) sieveWith(p);
    }
    for (let k = 1; k <= n; k++) paint(k);
    refresh();
  }

  function getState() {
    const standing = [];
    for (let k = 2; k <= n; k++) if (!by[k]) standing.push(k);
    return { n, sieved: sieved.slice(), crossed: crossedCount(), standing, complete: isComplete(), last: last ? { ...last } : null };
  }

  load(spec.sieved);
  if (readOnly) wrap.classList.add('is-readonly');

  return {
    el: wrap,
    getState,
    setState(next) { if (next && Array.isArray(next.sieved)) load(next.sieved); },
    setReadOnly(v) {
      readOnly = !!v;
      wrap.classList.toggle('is-readonly', readOnly);
      // once the board is finished and frozen, show what the sieve has caught
      if (readOnly && sieved.length && isComplete() && !revealed) {
        revealed = true;
        for (let k = 2; k <= n; k++) paint(k);
      }
      refresh();
    },
    destroy() { clearTimeout(settle); },
  };
}

export const examples = [
  { title: 'prime-sieve — tap the smallest number still standing', spec: { type: 'prime-sieve', n: 100 } },
  { title: 'prime-sieve — after sieving with 2 and 3', spec: { type: 'prime-sieve', n: 60, sieved: [2, 3], static: true } },
];
