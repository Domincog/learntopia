/**
 * factor-hunt — hunt for the prime factors of a number by trial division.
 * Tap a prime to divide by it; the widget does the arithmetic and keeps count
 * of the tries. Multiplying two primes takes one step. Going backwards takes
 * as many steps as it takes to stumble on the right prime — which is the point.
 *
 * {
 *   type: 'factor-hunt',
 *   n: 2491,                       // the number to take apart (a product of two primes works best)
 *   primes: [2, 3, 5, 7, 11, …],   // optional list of primes on offer (default: every prime up to 59,
 *                                  //   or up to the square root of n if that is larger)
 * }
 *
 * State: { n, tried, tries, found, factors }
 *   tried   — the primes divided by so far, in order
 *   tries   — how many that is
 *   found   — one of them divided n exactly
 *   factors — [p, n / p] for the first one that did (smaller first), otherwise null
 *
 * setState accepts { tried: [2, 3, 5, …] }.
 */
import { h, cx, readout, button, mdInline, icon, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('factor-hunt', `
  .widget-factor-hunt { justify-items: center; }
  .widget-factor-hunt .fh-card {
    width: 100%;
    display: grid; justify-items: center; gap: var(--s1);
    padding: var(--s4);
    border: var(--bw) solid var(--edge);
    border-radius: var(--r-lg);
    background: var(--surface);
    text-align: center;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  .widget-factor-hunt .fh-card.is-found { background: var(--green-soft); border-color: var(--green); }
  .widget-factor-hunt .fh-number {
    font-family: var(--font-display); font-variation-settings: 'SOFT' 100; font-weight: 800;
    font-size: clamp(2.2rem, 9vw, 3.2rem); line-height: 1.1; font-variant-numeric: tabular-nums;
  }
  .widget-factor-hunt .fh-line { min-height: 1.7em; font-size: 1.1rem; }
  .widget-factor-hunt .fh-line svg { display: inline-block; vertical-align: -4px; margin-right: 0.3rem; }
  .widget-factor-hunt .fh-line.is-miss svg { color: var(--red-text); }
  .widget-factor-hunt .fh-line.is-hit svg { color: var(--green-text); }
  .widget-factor-hunt .fh-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-factor-hunt .fh-prime {
    position: relative;
    min-width: 52px; min-height: 46px;
    padding: 0 0.5rem;
    border: var(--bw) solid var(--edge);
    border-radius: 12px;
    background: var(--surface);
    color: var(--ink);
    font-size: var(--fs-lg); font-weight: 800; font-variant-numeric: tabular-nums;
    box-shadow: 2px 2px 0 var(--drop);
    transition: transform 0.09s ease, box-shadow 0.09s ease, background-color 0.15s ease, opacity 0.15s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .widget-factor-hunt .fh-prime:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--drop); }
  .widget-factor-hunt .fh-prime.is-miss { background: var(--red-soft); border-color: var(--red); color: var(--ink-3); box-shadow: none; text-decoration: line-through; text-decoration-thickness: 2px; }
  .widget-factor-hunt .fh-prime.is-hit { background: var(--green); border-color: var(--edge-strong); color: #1D1B26; }
  .widget-factor-hunt .fh-prime:disabled { pointer-events: none; }
  .widget-factor-hunt .fh-prime:disabled:not(.is-miss):not(.is-hit) { opacity: 0.5; box-shadow: none; }
`);

const isPrime = (k) => { if (k < 2) return false; for (let d = 2; d * d <= k; d++) if (k % d === 0) return false; return true; };

export default function create(spec, env) {
  const n = Math.max(4, Math.round(spec.n || 2491));
  let primes = Array.isArray(spec.primes) ? spec.primes.map(Number).filter(isPrime) : [];
  if (!primes.length) {
    const top = Math.max(59, Math.floor(Math.sqrt(n)));
    for (let k = 2; k <= top; k++) if (isPrime(k)) primes.push(k);
  }
  primes = Array.from(new Set(primes)).sort((p, q) => p - q);
  let tried = [];
  let readOnly = !!env.readOnly;

  const hit = () => tried.find((p) => n % p === 0) || null;

  /* --------------------------------------------------------------- parts */
  const heading = h('div.eyebrow');
  const number = h('div.fh-number');
  const line = h('div.fh-line', { 'aria-live': 'polite' });
  const card = h('div.fh-card', heading, number, line);
  const grid = h('div.fh-grid', { role: 'group', 'aria-label': 'Primes to divide by' });
  const buttons = new Map();
  for (const p of primes) {
    const btn = h('button.fh-prime', { type: 'button', 'aria-label': `Divide by ${p}` }, String(p));
    btn.addEventListener('click', () => attempt(p));
    buttons.set(p, btn);
    grid.appendChild(btn);
  }
  const roTries = readout('divisions tried', { digits: 0 });
  const resetBtn = button('Start again', () => {
    if (readOnly || !tried.length) return;
    tried = [];
    render();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });
  const el = h('div.w-frame', card, env.compact ? null : grid, env.compact ? null : h('div.w-readouts', roTries.el), env.compact ? null : h('div.w-buttons', resetBtn));

  function render() {
    const found = hit();
    const last = tried[tried.length - 1];
    for (const [p, btn] of buttons) {
      const used = tried.includes(p);
      const good = used && n % p === 0;
      btn.className = cx('fh-prime', used && (good ? 'is-hit' : 'is-miss'));
      btn.disabled = readOnly || used || !!found;
      btn.setAttribute('aria-label', used ? `${p}: ${good ? 'divides exactly' : 'does not divide'}` : `Divide by ${p}`);
    }
    card.classList.toggle('is-found', !!found);
    if (found) {
      const pair = [found, n / found].sort((p, q) => p - q);
      heading.textContent = 'Found them';
      number.textContent = `${n} = ${pair[0]} × ${pair[1]}`;
      line.className = 'fh-line is-hit';
      line.replaceChildren(icon('check', { size: 20, stroke: 3 }), h('span', { html: mdInline(`$${n} \\div ${found} = ${n / found}$ exactly`) }));
    } else {
      heading.textContent = 'Which two primes multiply to';
      number.textContent = String(n);
      if (last) {
        line.className = 'fh-line is-miss';
        line.replaceChildren(icon('x', { size: 20, stroke: 3 }), h('span', { html: mdInline(`$${n} \\div ${last} = ${Math.floor(n / last)}$ remainder $${n % last}$`) }));
      } else {
        line.className = 'fh-line';
        line.textContent = 'Tap a prime to try dividing by it.';
      }
    }
    roTries.set(tried.length);
    resetBtn.disabled = readOnly || !tried.length;
  }

  function attempt(p) {
    if (readOnly || tried.includes(p) || hit()) return;
    tried.push(p);
    play(n % p === 0 ? 'correct' : 'tap');
    const viaKeyboard = document.activeElement === buttons.get(p); // that button is about to be disabled
    render();
    if (viaKeyboard) {
      const next = primes.map((q) => buttons.get(q)).find((btn) => !btn.disabled);
      (next || resetBtn).focus({ preventScroll: true });
    }
    env.onChange(getState());
  }

  function getState() {
    const found = hit();
    return { n, tried: tried.slice(), tries: tried.length, found: !!found, factors: found ? [found, n / found].sort((p, q) => p - q) : null };
  }

  render();
  if (readOnly) el.classList.add('is-readonly');

  return {
    el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.tried)) return;
      tried = [];
      for (const p of next.tried) {
        if (buttons.has(p) && !tried.includes(p)) tried.push(p);
        if (n % p === 0) break; // nothing is tried after the hit
      }
      render();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'factor-hunt — find the two primes hiding in 2491', spec: { type: 'factor-hunt', n: 2491 } },
];
