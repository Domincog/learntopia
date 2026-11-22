/**
 * monty-hall — the three-door game, playable for real. Pick a door; the
 * host opens another door to show a goat; stay or switch. A tally keeps the
 * win rate of each strategy, and the computer can play hundreds of rounds
 * of either strategy so the long-run rates (about 1/3 and 2/3) show up.
 *
 * {
 *   type: 'monty-hall',
 *   doors: 3,          // 3 for the classic game; up to 100 for the "many doors" version,
 *                      // where the host opens every other door except one
 *   host: 'knows',     // 'knows': the host knows where the car is and never reveals it
 *                      // 'random': the host opens other doors blindly; a round in which the car is exposed is void
 *   auto: 100,         // rounds per press of the two auto-play buttons; false hides them
 *   manual: true,      // false: no playing by hand, auto-play only
 * }
 *
 * State: { doors, host, rounds, stay: { played, won }, switch: { played, won }, stayRate, switchRate, voids, phase }
 *   stay / switch — rounds finished with each strategy (by hand or auto-played) and how many of them won the car
 *   stayRate / switchRate — won / played (null until that strategy has been played)
 *   rounds — stay.played + switch.played;  voids — rounds a 'random' host spoiled by exposing the car
 *   phase  — 'pick' | 'decide' | 'done' | 'void'
 *
 * setState({ stay: { played: 100 }, switch: { played: 100 } }) plays that many rounds of each strategy
 * (give `won` as well to set a result exactly), so a lesson's `solution` needs no results.
 * Results are random: write checks about `played`, never about `won`.
 */
import { frame, button, hue, s, h, cx, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('monty-hall', `
  .widget-monty-hall .mh-status { min-height: 3.2em; display: grid; align-content: center; text-align: center; font-size: var(--fs-lg); line-height: 1.4; }
  .widget-monty-hall .mh-door { cursor: pointer; outline: none; }
  .widget-monty-hall .mh-door:focus-visible .mh-leaf, .widget-monty-hall .mh-door:focus-visible .mh-way { stroke: var(--focus); stroke-width: 5; }
  .widget-monty-hall .mh-door.is-fixed { cursor: default; }
  .widget-monty-hall .mh-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); min-height: 48px; }
  .widget-monty-hall .mh-actions .btn { min-height: 46px; white-space: normal; }
  .widget-monty-hall .mh-tally { display: grid; gap: var(--s2); }
  .widget-monty-hall .mh-row { display: grid; grid-template-columns: 4.2em minmax(40px, 1fr) minmax(9.5em, auto); align-items: center; gap: var(--s2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-monty-hall .mh-bar { position: relative; height: 22px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); overflow: hidden; }
  .widget-monty-hall .mh-bar i { position: absolute; inset: 0 auto 0 0; background: var(--accent); transition: width 0.5s var(--ease-out); }
  .widget-monty-hall .mh-num { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .widget-monty-hall .mh-auto { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: var(--s2); }
  .widget-monty-hall .mh-auto-label { flex-basis: 100%; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-3); }
  .widget-monty-hall.is-readonly .mh-door { cursor: default; }
  .widget-monty-hall.is-readonly .mh-actions, .widget-monty-hall.is-readonly .mh-auto { pointer-events: none; }
  .widget-monty-hall.is-readonly .mh-auto-label { display: none; }
`);

const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** A little car, drawn inside an 80 × 44 box and scaled to `w` wide around (x, y). */
function car(x, y, w) {
  const k = w / 80;
  return s('g', { transform: `translate(${(x - 40 * k).toFixed(1)} ${(y - 22 * k).toFixed(1)}) scale(${k.toFixed(3)})` },
    s('path', { d: 'M5 31 Q5 22 14 20 L24 9 Q26 6 30 6 H50 Q54 6 56 9 L65 20 H69 Q76 21 76 29 V32 Q76 35 73 35 H8 Q5 35 5 32 Z', fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    s('path', { d: 'M29 10 H38 V19 H21 Z M42 10 H50 L58 19 H42 Z', fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    s('circle', { cx: 22, cy: 36, r: 6.5, fill: 'var(--ink)' }), s('circle', { cx: 22, cy: 36, r: 2.4, fill: 'var(--surface)' }),
    s('circle', { cx: 59, cy: 36, r: 6.5, fill: 'var(--ink)' }), s('circle', { cx: 59, cy: 36, r: 2.4, fill: 'var(--surface)' }));
}

/** A little goat, drawn inside a 76 × 64 box and scaled to `w` wide around (x, y). */
function goat(x, y, w) {
  const k = w / 76;
  const line = { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' };
  const coat = { fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' };
  return s('g', { transform: `translate(${(x - 38 * k).toFixed(1)} ${(y - 32 * k).toFixed(1)}) scale(${k.toFixed(3)})` },
    s('path', { d: 'M18 49 L17 61 M26 51 V61 M39 51 V61 M47 48 L48 61 M11 36 Q5 30 9 25', ...line }),
    s('ellipse', { cx: 32, cy: 40, rx: 21, ry: 12, ...coat }),
    s('path', { d: 'M44 34 L51 15 L62 27 L50 42 Z', ...coat }),
    s('path', { d: 'M53 15 Q47 3 39 7 M59 14 Q56 1 47 0', ...line }),
    s('ellipse', { cx: 58, cy: 22, rx: 10.5, ry: 8, transform: 'rotate(22 58 22)', ...coat }),
    s('ellipse', { cx: 48.5, cy: 19, rx: 5, ry: 2.6, transform: 'rotate(-25 48.5 19)', ...coat }),
    s('path', { d: 'M62 30 L60 41 L67 32 Z', fill: 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }),
    s('circle', { cx: 61, cy: 20, r: 1.8, fill: 'var(--ink)' }));
}

export default function create(spec, env) {
  const N = clamp(Math.round(spec.doors || 3), 3, 100);
  const host = spec.host === 'random' ? 'random' : 'knows';
  const autoSize = spec.auto === false ? 0 : clamp(Math.round(spec.auto || 100), 1, 10000);
  const manual = spec.manual !== false && !env.compact;
  const rng = env.rng;
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  const tally = { stay: { played: 0, won: 0 }, switch: { played: 0, won: 0 } };
  let voids = 0;
  let phase = 'pick';
  let carAt = 0;
  let pick = -1;
  let other = -1;          // the door the host leaves shut
  let finalDoor = -1;
  let opened = new Set();
  let message = '';
  let timer = 0;

  const anyBut = (...not) => { let d = rng.int(0, N - 1); while (not.includes(d)) d = rng.int(0, N - 1); return d; };

  /** The host's move for a given car position and first pick: which door stays shut, and whether the car got exposed. */
  function hostMove(carDoor, picked) {
    if (host === 'knows') return { left: picked === carDoor ? anyBut(picked) : carDoor, spoiled: false };
    const left = anyBut(picked);                      // a blind host leaves a random door shut…
    return { left, spoiled: carDoor !== picked && carDoor !== left };   // …and may expose the car
  }

  /** Play one whole round with a fixed strategy; returns true / false, or null for a void round. */
  function simulate(strategy) {
    const c = rng.int(0, N - 1);
    const p = rng.int(0, N - 1);
    const move = hostMove(c, p);
    if (move.spoiled) return null;
    return (strategy === 'switch' ? move.left : p) === c;
  }
  function autoPlay(strategy, rounds) {
    let done = 0;
    for (let guard = 0; done < rounds && guard < rounds * 400; guard++) {
      const won = simulate(strategy);
      if (won === null) { voids += 1; continue; }
      tally[strategy].played += 1;
      if (won) tally[strategy].won += 1;
      done += 1;
    }
  }

  function newRound() {
    clearTimeout(timer);
    carAt = rng.int(0, N - 1);
    pick = -1; other = -1; finalDoor = -1;
    opened = new Set();
    phase = 'pick';
    message = manual ? (N === 3 ? 'Behind one door is a car, behind the others goats. **Pick a door.**' : `One car, ${N - 1} goats. **Pick any door.**`) : '';
  }

  /* ---------------------------------------------------------------- scene */
  const cols = N <= 4 ? N : N <= 10 ? 5 : 10;
  const rowsN = Math.ceil(N / cols);
  const big = N === 3;
  const W = 560;
  const pitch = big ? 162 : Math.min(120, 540 / cols);
  const dw = big ? 112 : Math.min(72, pitch - 12);
  const dh = big ? 168 : Math.round(dw * 1.08);
  const rowPitch = dh + (big ? 0 : 14);
  const left = (W - (cols * pitch - (pitch - dw))) / 2;
  const top = big ? 24 : 14;
  const H = big ? 230 : top + rowsN * rowPitch + 6;
  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'Monty Hall game' });
  const { svg } = fr;
  svg.setAttribute('role', 'group');
  const gDoors = s('g');
  svg.appendChild(gDoors);
  if (big) svg.insertBefore(s('line', { x1: 24, x2: W - 24, y1: top + dh, y2: top + dh, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }), gDoors);

  const doorXY = (i) => ({ x: left + (i % cols) * pitch, y: top + Math.floor(i / cols) * rowPitch });

  function drawDoor(i) {
    const { x, y } = doorXY(i);
    const isOpen = opened.has(i) || phase === 'done';
    const hasCar = i === carAt;
    const picked = i === pick;
    const chosen = phase === 'done' ? i === finalDoor : picked;
    const canPick = manual && phase === 'pick' && !readOnly;
    const what = isOpen ? (hasCar ? 'open: the car' : 'open: a goat') : 'closed';
    const g = s('g', {
      class: cx('mh-door', !canPick && 'is-fixed'),
      role: canPick ? 'button' : 'img',
      tabindex: canPick ? '0' : null,
      'aria-label': `Door ${i + 1}, ${what}${chosen ? ', your door' : ''}`,
    });
    if (chosen) g.appendChild(s('rect', { x: x - 7, y: y - 7, width: dw + 14, height: dh + (big ? 7 : 14), rx: 12, fill: 'none', stroke: hue('orange'), 'stroke-width': big ? 5 : 4 }));
    if (isOpen) {
      g.appendChild(s('rect', { class: 'mh-way', x, y, width: dw, height: dh, rx: 6, fill: hasCar ? hue('yellow', 'soft') : 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': big ? 3 : 2 }));
      const mid = { x: x + dw / 2, y: y + dh * (big ? 0.5 : 0.52) };
      g.appendChild(hasCar ? car(mid.x, mid.y, dw * 0.78) : goat(mid.x, mid.y, dw * (big ? 0.68 : 0.72)));
      if (big) {
        g.appendChild(s('text.fig-label', { x: mid.x, y: y + dh - 18, 'text-anchor': 'middle' }, hasCar ? 'car' : 'goat'));
        g.appendChild(s('path', { d: `M${x} ${y} L${x - 15} ${y + 10} V${y + dh - 6} L${x} ${y + dh} Z`, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      }
    } else {
      g.appendChild(s('rect', { class: 'mh-leaf', x, y, width: dw, height: dh, rx: 6, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': big ? 3 : 2 }));
      if (big) {
        g.appendChild(s('rect', { x: x + 14, y: y + 14, width: dw - 28, height: 62, rx: 5, fill: 'none', stroke: 'var(--edge-strong)', 'stroke-width': 2, opacity: 0.45 }));
        g.appendChild(s('rect', { x: x + 14, y: y + 90, width: dw - 28, height: 62, rx: 5, fill: 'none', stroke: 'var(--edge-strong)', 'stroke-width': 2, opacity: 0.45 }));
        g.appendChild(s('circle', { cx: x + dw - 16, cy: y + 84, r: 5.5, fill: hue('yellow'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
        g.appendChild(s('text.fig-label-lg', { x: x + dw / 2, y: y + 53, 'text-anchor': 'middle', style: 'fill:#1D1B26;stroke:none;font-size:28px' }, String(i + 1)));
      } else {
        g.appendChild(s('text.fig-label-sm', { x: x + dw / 2, y: y + dh / 2 + 5, 'text-anchor': 'middle', style: 'fill:#1D1B26;stroke:none' }, String(i + 1)));
      }
    }
    if (big && chosen) g.appendChild(s('text.fig-label', { x: x + dw / 2, y: top + dh + 24, 'text-anchor': 'middle', style: `fill:${hue('orange', 'text')}` }, phase === 'done' && finalDoor !== pick ? 'you switched here' : 'your door'));
    if (canPick) {
      g.addEventListener('click', () => choose(i));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(i); } });
    }
    return g;
  }

  /* --------------------------------------------------------------- chrome */
  const status = h('div.mh-status', { 'aria-live': 'polite' });
  const actions = h('div.mh-actions');
  if (manual) { fr.el.insertBefore(status, fr.canvas); fr.el.insertBefore(actions, fr.readouts); }

  const rows = {};
  const tallyEl = h('div.mh-tally', { role: 'group', 'aria-label': 'Wins for each strategy' });
  for (const [key, label, color] of [['stay', 'Stay', 'orange'], ['switch', 'Switch', 'blue']]) {
    const fill = h('i');
    const num = h('span.mh-num');
    rows[key] = { fill, num };
    tallyEl.appendChild(h('div', { class: `mh-row hue-${color}` }, h('span', label), h('div.mh-bar', fill), num));
  }
  if (!env.compact) fr.el.insertBefore(tallyEl, fr.readouts);

  const autoRow = h('div.mh-auto');
  const autoButtons = [];
  if (autoSize && !env.compact) {
    autoRow.appendChild(h('span.mh-auto-label', 'Let the computer play:'));
    for (const [key, label] of [['stay', 'Always stay'], ['switch', 'Always switch']]) {
      const b = button(`${label} × ${fmtInt(autoSize)}`, () => auto(key), { icon: key === 'stay' ? 'lock' : 'shuffle' });
      autoButtons.push(b);
      autoRow.appendChild(b);
    }
    fr.el.insertBefore(autoRow, fr.readouts);
  }
  const clearBtn = button('Clear the tally', () => clearTally(), { icon: 'reset', variant: 'ghost' });
  if (!env.compact) fr.buttons.appendChild(clearBtn);

  /* ----------------------------------------------------------------- draw */
  function draw() {
    gDoors.replaceChildren();
    for (let i = 0; i < N; i++) gDoors.appendChild(drawDoor(i));
    status.innerHTML = mdInline(message);

    actions.replaceChildren();
    if (phase === 'decide') {
      actions.append(
        button(`Stay with door ${pick + 1}`, () => decide(false), { icon: 'lock', variant: 'primary' }),
        button(`Switch to door ${other + 1}`, () => decide(true), { icon: 'shuffle', variant: 'primary' }));
    } else if (phase === 'done' || phase === 'void') {
      actions.appendChild(button('Play another round', () => { if (readOnly) return; newRound(); draw(); }, { icon: 'refresh', variant: 'primary' }));
    } else if (phase === 'pick' && manual && N > 3) {
      actions.appendChild(button('Pick a door for me', () => choose(rng.int(0, N - 1)), { icon: 'dice' }));
    }

    for (const key of ['stay', 'switch']) {
      const t = tally[key];
      const rate = t.played ? t.won / t.played : 0;
      rows[key].fill.style.width = `${(rate * 100).toFixed(1)}%`;
      rows[key].num.textContent = t.played ? `won ${fmtInt(t.won)} of ${fmtInt(t.played)} · ${Math.round(rate * 100)}%` : 'not played yet';
    }
    for (const b of autoButtons) b.disabled = readOnly;
    clearBtn.disabled = readOnly || tally.stay.played + tally.switch.played + voids === 0;
  }

  /* -------------------------------------------------------------- actions */
  function choose(i) {
    if (readOnly || phase !== 'pick' || !manual) return;
    pick = i;
    play('select');
    const reveal = () => {
      const move = hostMove(carAt, pick);
      other = move.left;
      opened = new Set();
      for (let d = 0; d < N; d++) if (d !== pick && d !== other) opened.add(d);
      const shown = N === 3 ? `door ${[...opened][0] + 1}` : `${N - 2} other doors`;
      if (move.spoiled) {
        phase = 'void';
        voids += 1;
        message = `You picked door ${pick + 1}. The host opens ${shown} without knowing what is behind… and **exposes the car**. This round is void.`;
        play('pop');
      } else {
        phase = 'decide';
        message = host === 'knows'
          ? `You picked door ${pick + 1}. The host, who knows where the car is, opens ${shown}: ${N === 3 ? 'a goat' : 'all goats'}. **Stay or switch?**`
          : `You picked door ${pick + 1}. The host opens ${shown} without knowing what is behind: ${N === 3 ? 'a goat' : 'all goats'}, as it happens. **Stay or switch?**`;
        play('drop');
      }
      draw();
      env.announce(message.replace(/\*/g, ''));
      env.onChange(getState());
    };
    if (reducedMotion()) { reveal(); return; }
    phase = 'host';
    message = `You picked door ${pick + 1}. The host walks over to the other doors…`;
    draw();
    timer = setTimeout(reveal, 550);
  }

  function decide(doSwitch) {
    if (readOnly || phase !== 'decide') return;
    finalDoor = doSwitch ? other : pick;
    const won = finalDoor === carAt;
    const key = doSwitch ? 'switch' : 'stay';
    tally[key].played += 1;
    if (won) tally[key].won += 1;
    phase = 'done';
    message = `You ${doSwitch ? 'switched to' : 'stayed with'} door ${finalDoor + 1}: ${won ? '**you win the car!**' : `**a goat.** The car was behind door ${carAt + 1}.`}`;
    play(won ? 'correct' : 'pop');
    draw();
    env.announce(message.replace(/\*/g, ''));
    env.onChange(getState());
  }

  function auto(key) {
    if (readOnly) return;
    autoPlay(key, autoSize);
    play('tick');
    draw();
    const t = tally[key];
    env.announce(`Always ${key}: won ${t.won} of ${t.played} rounds.`);
    env.onChange(getState());
  }

  function clearTally() {
    if (readOnly) return;
    for (const key of ['stay', 'switch']) { tally[key].played = 0; tally[key].won = 0; }
    voids = 0;
    play('pop');
    draw();
    env.onChange(getState());
  }

  function getState() {
    const rate = (t) => (t.played ? t.won / t.played : null);
    return {
      doors: N, host,
      rounds: tally.stay.played + tally.switch.played,
      stay: { ...tally.stay }, switch: { ...tally.switch },
      stayRate: rate(tally.stay), switchRate: rate(tally.switch),
      voids,
      phase: phase === 'host' ? 'pick' : phase,
    };
  }

  newRound();
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      voids = 0;
      for (const key of ['stay', 'switch']) {
        const want = next[key] || {};
        const rounds = Math.max(0, Math.round(want.played || 0));
        tally[key].played = 0;
        tally[key].won = 0;
        if (typeof want.won === 'number') { tally[key].played = rounds; tally[key].won = clamp(Math.round(want.won), 0, rounds); } else autoPlay(key, rounds);
      }
      newRound();
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); draw(); },
    destroy() { clearTimeout(timer); },
  };
}

export const examples = [
  { title: 'monty-hall — the classic three doors', spec: { type: 'monty-hall' } },
  { title: 'monty-hall — 100 doors: the host opens 98 of them', spec: { type: 'monty-hall', doors: 100, auto: false } },
  { title: 'monty-hall — a host who opens a door blindly', spec: { type: 'monty-hall', host: 'random', auto: 300, manual: false } },
];
