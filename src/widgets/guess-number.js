/**
 * guess-number — the higher / lower guessing game, with everything that has
 * been ruled out greyed away. The top strip always shows the whole range;
 * the big bar underneath is the part still alive, enlarged, and that is
 * where the learner picks the next guess.
 *
 * {
 *   type: 'guess-number',
 *   max: 100,            // the secret is a whole number from 1 to max (works up to a few million)
 *   secret: 37,          // fix the first secret (default: random)
 *   adversary: false,    // true: no number is chosen in advance; every answer keeps as many
 *                        // numbers alive as it can, i.e. the learner always gets the worst luck
 *   limit: 7,            // show "3 of 7" and flag guesses beyond the limit (the game still goes on)
 * }
 *
 * State: { found, guesses, history: [{ guess, answer }], low, high, left, max, secret, overLimit }
 *   answer  'higher' | 'lower' | 'correct'   ("higher" means the secret is higher than the guess)
 *   low, high, left   the range still alive and how many numbers it holds
 *   secret  the number, once found (null before)
 *
 * setState accepts
 *   { history: [50, 75, 62] }      replay these guesses in a fresh game
 *   { found: true }                play binary search (always the middle) until the number is found
 *   { found: true, guesses: 6 }    the same, with a secret chosen so that it takes exactly 6 guesses
 *                                  (ignored with `adversary`, where the count is forced anyway)
 *
 * Keyboard: focus the big bar, ← → move the marker (Shift: by 10), Enter guesses.
 */
import { frame, button, readout, hue, s, h, cx, clamp, icon, svgPoint, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 178;
const X0 = 30;
const BW = 500;
const STRIP = { y: 26, h: 14 };
const BAR = { y: 78, h: 50 };

addStyles('guess-number', `
  .widget-guess-number .gn-bar { cursor: pointer; outline: none; }
  .widget-guess-number .gn-bar:focus-visible .gn-bar-rect { stroke: var(--focus); stroke-width: 4; }
  .widget-guess-number.is-readonly .gn-bar { cursor: default; pointer-events: none; }
  .widget-guess-number .gn-row { display: flex; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-guess-number .gn-row .btn { min-height: 46px; }
  .widget-guess-number .gn-step { min-width: 46px; padding: 0; }
  .widget-guess-number .gn-go { min-width: 150px; font-variant-numeric: tabular-nums; }
  .widget-guess-number .btn-ghost { box-shadow: none; }
  .widget-guess-number .gn-status { min-height: 1.5em; text-align: center; font-weight: 700; color: var(--ink-2); }
  .widget-guess-number .gn-status.is-good { color: var(--green-text); }
  .widget-guess-number .gn-status.is-bad { color: var(--red-text); }
  .widget-guess-number .gn-history { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; min-height: 30px; }
  .widget-guess-number .gn-chip {
    display: inline-flex; align-items: center; gap: 2px; padding: 2px 8px 2px 6px;
    border: var(--bw) solid var(--hair); border-radius: 999px; background: var(--surface);
    font-family: var(--font-mono); font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums;
  }
  .widget-guess-number .gn-chip.is-higher { background: var(--blue-soft); border-color: var(--blue); color: var(--blue-text); }
  .widget-guess-number .gn-chip.is-lower { background: var(--violet-soft); border-color: var(--violet); color: var(--violet-text); }
  .widget-guess-number .gn-chip.is-correct { background: var(--green-soft); border-color: var(--green); color: var(--green-text); }
  .widget-guess-number .gn-chip.is-none { border-style: dashed; color: var(--ink-3); font-family: var(--font-body); padding: 2px 10px; }
`);

const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function create(spec, env) {
  const max = clamp(Math.round(spec.max || 100), 2, 4000000);
  const adversary = !!spec.adversary;
  const limit = Number.isInteger(spec.limit) && spec.limit > 0 ? spec.limit : null;
  const pickSecret = () => env.rng.int(1, max);
  let secret = adversary ? null : (Number.isInteger(spec.secret) ? clamp(spec.secret, 1, max) : pickSecret());
  let low = 1;
  let high = max;
  let history = [];
  let found = false;
  let candidate = null;
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Number guessing game' });
  const { svg } = fr;

  /* ---------------------------------------------------------------- scene */
  const gStrip = s('g');
  const funnel = s('polygon', { fill: hue('teal', 'soft'), opacity: 0.55 });
  const gBar = s('g.gn-bar', { tabindex: env.compact ? null : '0', role: 'slider', 'aria-label': 'Your next guess', 'aria-valuemin': 1, 'aria-valuemax': max });
  gBar.dataset.keys = 'own';
  const barRect = s('rect.gn-bar-rect', { x: X0, y: BAR.y, width: BW, height: BAR.h, rx: 10, fill: hue('teal', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const gCells = s('g');
  const gThumb = s('g');
  const hit = s('rect', { x: 0, y: BAR.y - 26, width: W, height: BAR.h + 52, fill: 'transparent' });
  const lowLabel = s('text.fig-label', { x: X0, y: BAR.y + BAR.h + 24, 'text-anchor': 'start' });
  const highLabel = s('text.fig-label', { x: X0 + BW, y: BAR.y + BAR.h + 24, 'text-anchor': 'end' });
  const midLabel = s('text.fig-label-sm', { x: X0 + BW / 2, y: BAR.y + BAR.h + 24, 'text-anchor': 'middle', class: 'text-muted' });
  gBar.append(barRect, gCells, gThumb, hit);
  svg.append(
    s('text.tick-label', { x: X0, y: 17, 'text-anchor': 'start' }, '1'),
    s('text.tick-label', { x: X0 + BW, y: 17, 'text-anchor': 'end' }, group(max)),
    s('text.tick-label', { x: X0 + BW / 2, y: 17, 'text-anchor': 'middle' }, 'all the numbers'),
    funnel, gStrip, gBar, lowLabel, highLabel, midLabel,
  );

  const count = () => high - low + 1;
  const stripX = (v) => X0 + (v / max) * BW;                       // right edge of number v on the strip
  const barX = (v) => X0 + ((v - low + 0.5) / count()) * BW;       // centre of number v on the big bar
  const valueAt = (x) => clamp(low + Math.floor(((x - X0) / BW) * count()), low, high);

  /* ------------------------------------------------------------- controls */
  const roGuesses = readout('Guesses', { digits: 0 });
  const roLeft = readout('Numbers left', { digits: 0 });
  const status = h('div.gn-status');
  const historyEl = h('div.gn-history', { 'aria-label': 'Guesses so far' });
  const minus = h('button.btn.btn-sm.gn-step', { type: 'button', 'aria-label': 'One lower' }, icon('minus', 18));
  const plus = h('button.btn.btn-sm.gn-step', { type: 'button', 'aria-label': 'One higher' }, icon('plus', 18));
  const go = h('button.btn.btn-primary.gn-go', { type: 'button' }, 'Guess');
  const again = button('New game', () => { if (readOnly) return; newGame(); env.onChange(getState()); }, { icon: 'refresh', variant: 'ghost' });
  if (!env.compact) {
    fr.readouts.append(roGuesses.el, roLeft.el);
    fr.controls.appendChild(h('div.gn-row', minus, go, plus));
    fr.buttons.appendChild(again);
    fr.el.append(fr.canvas, status, fr.controls, fr.readouts, historyEl, fr.buttons);
  }

  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('gn-status', tone && `is-${tone}`); };

  /* --------------------------------------------------------------- render */
  function drawStrip() {
    gStrip.replaceChildren();
    const y = STRIP.y;
    gStrip.appendChild(s('rect', { x: X0, y, width: BW, height: STRIP.h, rx: 7, fill: hue('gray', 'soft'), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    const a = stripX(low - 1);
    const b = Math.max(stripX(high), a + 3);
    gStrip.appendChild(s('rect', { x: a, y, width: b - a, height: STRIP.h, rx: Math.min(7, (b - a) / 2), fill: found ? hue('green') : hue('teal'), stroke: 'var(--ink)', 'stroke-width': 2 }));
    for (const item of history) {
      if (item.answer === 'correct') continue;
      const x = stripX(item.guess - 0.5);
      gStrip.appendChild(s('line', { x1: x, x2: x, y1: y + 2.5, y2: y + STRIP.h - 2.5, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    }
    funnel.setAttribute('points', `${a},${y + STRIP.h + 2} ${b},${y + STRIP.h + 2} ${X0 + BW},${BAR.y - 3} ${X0},${BAR.y - 3}`);
  }

  function drawBar() {
    gCells.replaceChildren();
    const n = count();
    const cw = BW / n;
    barRect.setAttribute('fill', found ? hue('green', 'soft') : hue('teal', 'soft'));
    if (found) {
      gCells.appendChild(s('text.fig-label-lg', { x: X0 + BW / 2, y: BAR.y + BAR.h / 2 + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, group(secret)));
    } else if (n <= 40) {
      for (let i = 1; i < n; i++) gCells.appendChild(s('line', { x1: X0 + i * cw, x2: X0 + i * cw, y1: BAR.y + 1.5, y2: BAR.y + BAR.h - 1.5, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
      const widest = String(high).length * 10.5 + 8;
      if (n <= 12 && cw >= widest) {
        for (let v = low; v <= high; v++) {
          gCells.appendChild(s('text.fig-label', { x: barX(v), y: BAR.y + BAR.h / 2 + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(v)));
        }
      }
    }
    lowLabel.textContent = found ? '' : group(low);
    highLabel.textContent = found ? '' : group(high);
    midLabel.textContent = found ? '' : (n === 1 ? 'only one number is left' : `${group(n)} numbers still possible`);
    if (!found && n <= 12 && gCells.querySelector('text')) { lowLabel.textContent = ''; highLabel.textContent = ''; }
  }

  function drawThumb() {
    gThumb.replaceChildren();
    if (candidate == null || found) return;
    const x = barX(candidate);
    const text = group(candidate);
    const bw = Math.max(44, text.length * 11 + 20);
    const bx = clamp(x - bw / 2, 4, W - bw - 4);
    gThumb.append(
      s('line', { x1: x, x2: x, y1: BAR.y - 8, y2: BAR.y + BAR.h + 5, stroke: 'var(--edge-strong)', 'stroke-width': 4, 'stroke-linecap': 'round' }),
      s('circle', { cx: x, cy: BAR.y + BAR.h / 2, r: 10, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }),
      s('rect', { x: bx, y: BAR.y - 34, width: bw, height: 27, rx: 9, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }),
      s('text.fig-label', { x: bx + bw / 2, y: BAR.y - 20, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'fill:#1D1B26;stroke:none' }, text),
    );
  }

  function drawHistory() {
    historyEl.replaceChildren();
    if (!history.length) { historyEl.appendChild(h('span.gn-chip.is-none', 'No guesses yet')); return; }
    for (const item of history) {
      const name = item.answer === 'higher' ? 'arrow-up' : item.answer === 'lower' ? 'arrow-down' : 'check';
      historyEl.appendChild(h('span', { class: `gn-chip is-${item.answer}`, title: `${item.guess}: ${item.answer}` },
        icon(name, { size: 14, stroke: 3, label: item.answer }), group(item.guess)));
    }
  }

  function render() {
    drawStrip();
    drawBar();
    drawThumb();
    drawHistory();
    const k = history.length;
    roGuesses.set(limit ? `${k} of ${limit}` : String(k));
    roLeft.set(group(found ? 1 : count()));
    const idle = !readOnly && !found;
    go.disabled = !idle || candidate == null;
    go.textContent = found ? 'Found' : candidate == null ? 'Pick a number' : `Guess ${group(candidate)}`;
    minus.disabled = !idle || candidate == null || candidate <= low;
    plus.disabled = !idle || candidate == null || candidate >= high;
    again.disabled = readOnly || !history.length;
    gBar.setAttribute('aria-valuenow', candidate == null ? low : candidate);
    gBar.setAttribute('aria-valuetext', candidate == null ? `No number picked. ${group(low)} to ${group(high)} still possible.` : `${group(candidate)}, between ${group(low)} and ${group(high)}`);
    svg.setAttribute('aria-label', found
      ? `Found: the number was ${group(secret)}, in ${k} guesses.`
      : `Numbers from ${group(low)} to ${group(high)} are still possible; ${k} guesses made.`);
  }

  /* ----------------------------------------------------------------- game */
  function answerFor(g) {
    if (!adversary) return g === secret ? 'correct' : g < secret ? 'higher' : 'lower';
    const below = g - low;
    const above = high - g;
    if (!below && !above) return 'correct';
    if (above !== below) return above > below ? 'higher' : 'lower';
    return env.rng.bool() ? 'higher' : 'lower';
  }

  function applyGuess(g) {
    const guess = clamp(Math.round(g), low, high);
    const answer = answerFor(guess);
    history.push({ guess, answer });
    if (answer === 'correct') { found = true; secret = guess; low = guess; high = guess; }
    else if (answer === 'higher') low = guess + 1;
    else high = guess - 1;
    candidate = null;
    return { guess, answer };
  }

  function describe(last) {
    const k = history.length;
    if (found) return [`Yes, it is ${group(secret)}. Found in ${k} guess${k === 1 ? '' : 'es'}${limit && k > limit ? ` (the target was ${limit})` : ''}.`, limit && k > limit ? 'bad' : 'good'];
    if (!last) return [adversary ? 'Tap the bar to choose your first guess.' : `I am thinking of a number from 1 to ${group(max)}. Tap the bar to choose a guess.`, ''];
    const n = count();
    const left = n === 1 ? `Only ${group(low)} is left.` : `${group(n)} left: ${group(low)} to ${group(high)}.`;
    const over = limit && k >= limit ? ` That was guess ${k} of ${limit}.` : '';
    return [`${last.answer === 'higher' ? 'Higher' : 'Lower'} than ${group(last.guess)}. ${left}${over}`, over ? 'bad' : ''];
  }

  function guess() {
    if (readOnly || found || candidate == null) return;
    const last = applyGuess(candidate);
    play(last.answer === 'correct' ? 'pop' : 'drop');
    render();
    const [text, tone] = describe(last);
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function reset() {
    low = 1; high = max; history = []; found = false; candidate = null;
    if (adversary) secret = null;
  }

  function newGame() {
    reset();
    if (!adversary) secret = pickSecret();
    render();
    setStatus(...describe(null));
  }

  function setCandidate(v) {
    if (readOnly || found) return;
    const next = clamp(Math.round(v), low, high);
    if (next === candidate) return;
    candidate = next;
    render();
  }

  /* ---------------------------------------------------------------- input */
  let dragging = null;
  hit.addEventListener('pointerdown', (ev) => {
    if (readOnly || found || ev.button > 0) return;
    dragging = ev.pointerId;
    try { hit.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    setCandidate(valueAt(svgPoint(svg, ev).x));
    play('tap');
    ev.preventDefault();
  });
  hit.addEventListener('pointermove', (ev) => { if (dragging === ev.pointerId) setCandidate(valueAt(svgPoint(svg, ev).x)); });
  const drop = (ev) => { if (dragging === ev.pointerId) dragging = null; };
  hit.addEventListener('pointerup', drop);
  hit.addEventListener('pointercancel', drop);
  gBar.addEventListener('keydown', (ev) => {
    if (readOnly || found) return;
    const jump = ev.shiftKey ? 10 : 1;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') setCandidate(candidate == null ? low : candidate + jump);
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') setCandidate(candidate == null ? high : candidate - jump);
    else if (ev.key === 'Home') setCandidate(low);
    else if (ev.key === 'End') setCandidate(high);
    else if (ev.key === 'Enter' || ev.key === ' ') guess();
    else return;
    ev.preventDefault();
    ev.stopPropagation();
  });
  minus.addEventListener('click', () => setCandidate(candidate - 1));
  plus.addEventListener('click', () => setCandidate(candidate + 1));
  go.addEventListener('click', guess);

  function getState() {
    const k = history.length;
    return {
      found, guesses: k, history: history.map((item) => ({ ...item })),
      low, high, left: found ? 1 : count(), max,
      secret: found ? secret : null,
      overLimit: !!limit && k > limit,
    };
  }

  /** The secret that takes binary search (always the lower middle) exactly k guesses, if there is one. */
  function secretNeeding(k) {
    let lo = 1;
    let hi = max;
    for (let i = 1; i < k; i++) { lo = Math.floor((lo + hi) / 2) + 1; if (lo > hi) return null; }
    return Math.floor((lo + hi) / 2);
  }

  render();
  setStatus(...describe(null));
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      reset();
      if (!adversary && Number.isInteger(next.secret)) secret = clamp(next.secret, 1, max);
      let last = null;
      if (Array.isArray(next.history)) {
        for (const item of next.history) {
          if (found) break;
          const g = typeof item === 'number' ? item : item && item.guess;
          if (Number.isFinite(g)) last = applyGuess(g);
        }
      } else if (next.found) {
        if (!adversary && Number.isInteger(next.guesses) && !Number.isInteger(next.secret)) secret = secretNeeding(next.guesses) || secret;
        while (!found) last = applyGuess(Math.floor((low + high) / 2));
      }
      render();
      setStatus(...describe(last));
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); gBar.setAttribute('tabindex', readOnly ? '-1' : '0'); render(); },
  };
}

export const examples = [
  { title: 'guess-number — 1 to 100', spec: { type: 'guess-number', max: 100 } },
  { title: 'guess-number — worst luck, with a limit', spec: { type: 'guess-number', max: 100, adversary: true, limit: 7 } },
];
