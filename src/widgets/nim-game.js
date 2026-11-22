/**
 * nim-game — a take-away game against the computer. There is one pile of
 * stones; the players take turns removing a few; whoever takes the LAST
 * stone wins.
 *
 * {
 *   type: 'nim-game',
 *   stones: 15,          // size of the pile at the start of a game
 *   take: [1, 2, 3],     // how many stones may be removed in one turn
 *   first: 'you',        // who starts: 'you', 'computer', or 'choose' (the learner decides before each game)
 *   groups: 0,           // draw the pile in groups of this size, counted from the far end (a visual aid; 0 = off)
 *   static: false,       // true: picture of the pile only
 *   taken: ['you', 'you', 'computer'],   // static pictures only: who has taken the first few stones
 * }
 *
 * The computer plays perfectly whenever it has a winning move and picks a
 * random legal move otherwise (through env.rng).
 *
 * State: { stones, start, turn, over, won, lost, games, wins, losses, first, moves, slip, startedLosing }
 *   stones        — stones left in the pile
 *   turn          — 'you' | 'computer' | 'choose' (waiting for the learner to say who starts) | null (game over)
 *   over, won, lost — won: the learner took the last stone of the current game
 *   games, wins, losses — finished games so far
 *   first         — who started the current game ('you' | 'computer' | null)
 *   moves         — the current game: [{ by: 'you' | 'computer', take, left }]
 *   slip          — the learner's first avoidable mistake in this game, { from, take, left, better }:
 *                   a move that gave away a won position (`better` was a winning move); null if none
 *   startedLosing — the learner's first turn came in a position already lost against perfect play
 *
 * setState accepts { won: true } (plays out a model game that the learner wins, as a demonstration)
 * or { stones: n } (a position with the learner to move).
 */
import { frame, readout, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('nim-game', `
  .widget-nim-game .nim-stone { transition: fill 0.2s ease, stroke 0.2s ease, opacity 0.2s ease; }
  .widget-nim-game .nim-msg {
    min-height: 3.2em; display: grid; place-items: center; text-align: center; padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair); border-radius: var(--r); font-weight: 700; font-size: var(--fs-lg); line-height: 1.3;
  }
  .widget-nim-game .nim-msg[data-kind='won'] { border-style: solid; border-color: var(--green); background: var(--green-soft); color: var(--green-text); }
  .widget-nim-game .nim-msg[data-kind='lost'] { border-style: solid; border-color: var(--orange); background: var(--orange-soft); color: var(--orange-text); }
  .widget-nim-game .nim-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2) var(--s3); min-height: 48px; }
  .widget-nim-game .nim-actions .btn { min-width: 96px; }
  .widget-nim-game .nim-trail { list-style: none; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; font-size: var(--fs-sm); font-weight: 700; }
  .widget-nim-game .nim-trail:empty { display: none; }
  .widget-nim-game .nim-trail li { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.55rem; border-radius: 999px; border: var(--bw) solid var(--hair); background: var(--surface); white-space: nowrap; }
  .widget-nim-game .nim-trail li[data-by='you'] { border-color: var(--blue); background: var(--blue-soft); color: var(--blue-text); }
  .widget-nim-game .nim-trail li[data-by='computer'] { border-color: var(--orange); background: var(--orange-soft); color: var(--orange-text); }
  .widget-nim-game .nim-trail b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--ink); }
  .widget-nim-game .nim-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s4); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-nim-game .nim-legend span { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-nim-game .nim-legend i { width: 14px; height: 14px; border-radius: 50%; border: 2px dashed; }
  .widget-nim-game.is-readonly .nim-actions { display: none; }
`);

/**
 * Which pile sizes are lost for the player about to move (with perfect play
 * on both sides)? Returns an array: losing[n] is true for those sizes.
 * An empty pile is lost: the other player has just taken the last stone.
 */
export function analyse(take, max) {
  const losing = [true];
  for (let n = 1; n <= max; n++) losing[n] = !take.some((t) => t <= n && losing[n - t]);
  return losing;
}

/** The moves from a pile of n that leave the opponent in a losing position. */
export const winningMoves = (take, n, losing) => take.filter((t) => t <= n && losing[n - t]);

export default function create(spec, env) {
  const N = Math.max(1, Math.round(spec.stones || 15));
  const take = (Array.isArray(spec.take) && spec.take.length ? spec.take : [1, 2, 3]).slice().sort((a, b) => a - b);
  const firstRule = ['you', 'computer', 'choose'].includes(spec.first) ? spec.first : 'you';
  const losing = analyse(take, N);
  const interactive = !spec.static && !env.compact;
  let readOnly = !!env.readOnly;

  let stones = N;
  let turn = null;
  let first = null;
  let moves = [];
  let slip = null;
  let startedLosing = false;
  let games = 0;
  let wins = 0;
  let losses = 0;
  let lastMsg = '';
  let timer = 0;

  /* ----------------------------------------------------------------- pile */
  const R = N > 32 ? 10 : 13;
  const PITCH = 2 * R + 5;
  const GAP = 12;
  const g = spec.groups > 1 ? Math.round(spec.groups) : 0;
  const rem = g ? N % g : 0;
  const boundary = (i) => g > 0 && i > 0 && i >= rem && (i - rem) % g === 0; // a gap before stone i
  const maxRow = Math.floor((560 - 40 + 5) / PITCH) - (g ? 1 : 0);
  let split = N;
  if (N > maxRow) {
    split = Math.ceil(N / 2);
    if (g) { while (split < N && !boundary(split)) split++; }
  }
  const rowsOf = [[...Array(split).keys()], [...Array(N - split).keys()].map((i) => i + split)].filter((row) => row.length);
  const rowWidth = (row) => row.length * PITCH - 5 + row.filter((i, k) => k > 0 && boundary(i)).length * GAP;
  const HEIGHT = rowsOf.length * (2 * R + 14) + 26;
  // the drawing is only as wide as the pile, so the stones stay as large as possible on a phone
  const WIDTH = Math.min(560, Math.max(320, Math.max(...rowsOf.map(rowWidth)) + 44));
  const fr = frame({ width: WIDTH, height: HEIGHT, compact: env.compact, label: spec.alt || 'A pile of stones' });
  if (!env.compact) fr.canvas.style.maxWidth = `${WIDTH}px`;
  fr.canvas.style.margin = '0 auto';
  fr.canvas.style.width = '100%';
  const stoneEls = [];
  rowsOf.forEach((row, ri) => {
    let x = (WIDTH - rowWidth(row)) / 2 + R;
    const y = 20 + R + ri * (2 * R + 14);
    row.forEach((i, k) => {
      if (k > 0) x += PITCH + (boundary(i) ? GAP : 0);
      const el = s('circle.nim-stone', { cx: x, cy: y, r: R, 'stroke-width': 2.5 });
      fr.svg.appendChild(el);
      stoneEls[i] = el;
    });
  });

  /* ------------------------------------------------------------- controls */
  const msg = h('div.nim-msg', { 'aria-live': 'polite' });
  const actions = h('div.nim-actions');
  const trail = h('ol.nim-trail', { 'aria-label': 'Moves so far' });
  const roLeft = readout('stones left', { digits: 0 });
  const roScore = readout('games won', { digits: 0 });
  if (interactive) {
    fr.el.insertBefore(msg, fr.readouts);
    fr.el.insertBefore(actions, fr.readouts);
    fr.el.insertBefore(trail, fr.readouts);
    fr.readouts.append(roLeft.el, roScore.el);
  } else if (!env.compact && spec.legend !== false && (spec.taken || []).length) {
    fr.el.appendChild(h('div.nim-legend',
      h('span', h('i', { style: { borderColor: 'var(--blue)', background: 'var(--blue-soft)' } }), 'taken by you'),
      h('span', h('i', { style: { borderColor: 'var(--orange)', background: 'var(--orange-soft)' } }), 'taken by the computer')));
  }

  const takeList = () => (take.length > 2 ? `${take.slice(0, -1).join(', ')} or ${take[take.length - 1]}` : take.join(' or '));
  const clearTimer = () => { clearTimeout(timer); timer = 0; };

  function bigButton(label, onClick, variant) {
    const btn = h('button', { type: 'button', class: cx('btn', variant && `btn-${variant}`) }, label);
    btn.addEventListener('click', () => { if (!readOnly) onClick(); });
    return btn;
  }

  function newGame() {
    clearTimer();
    stones = N;
    moves = [];
    slip = null;
    startedLosing = false;
    lastMsg = '';
    if (firstRule === 'choose') { turn = 'choose'; first = null; } else begin(firstRule);
  }
  function begin(who) {
    first = who;
    turn = who;
    if (who === 'computer') queueComputer();
  }
  function queueComputer() {
    clearTimer();
    if (!interactive || readOnly) return;
    timer = setTimeout(() => { timer = 0; computerMove(); render(); env.onChange(getState()); }, reducedMotion() ? 250 : 800);
  }

  function apply(by, t) {
    stones -= t;
    moves.push({ by, take: t, left: stones });
    if (stones === 0) {
      turn = null;
      games++;
      if (by === 'you') wins++; else losses++;
    } else {
      turn = by === 'you' ? 'computer' : 'you';
    }
  }
  function youTake(t) {
    if (turn !== 'you' || t > stones || !take.includes(t)) return;
    const good = winningMoves(take, stones, losing);
    if (!moves.some((m) => m.by === 'you') && !good.length) startedLosing = true;
    if (!slip && good.length && !good.includes(t)) slip = { from: stones, take: t, left: stones - t, better: good[0] };
    apply('you', t);
    lastMsg = '';
    play(stones === 0 ? 'pop' : 'drop');
    if (turn === 'computer') queueComputer();
    render();
    env.onChange(getState());
  }
  function computerMove() {
    if (turn !== 'computer') return;
    const good = winningMoves(take, stones, losing);
    const legal = take.filter((t) => t <= stones);
    const t = good.length ? env.rng.pick(good) : env.rng.pick(legal);
    apply('computer', t);
    lastMsg = `The computer took ${t}.`;
    play('tap');
  }

  /* --------------------------------------------------------------- render */
  function render() {
    const takenBy = [];
    for (const m of moves) for (let k = 0; k < m.take; k++) takenBy.push(m.by);
    (spec.taken || []).forEach((by, i) => { if (!interactive) takenBy[i] = by; });
    stoneEls.forEach((el, i) => {
      const by = takenBy[i];
      if (!by) {
        el.setAttribute('fill', 'var(--ink-2)');
        el.setAttribute('stroke', 'var(--ink)');
        el.removeAttribute('stroke-dasharray');
      } else {
        el.setAttribute('fill', hue(by === 'you' ? 'blue' : 'orange', 'soft'));
        el.setAttribute('stroke', hue(by === 'you' ? 'blue' : 'orange'));
        el.setAttribute('stroke-dasharray', '4 4');
      }
    });
    fr.svg.setAttribute('aria-label', `${spec.alt || 'A pile of stones'}: ${stones} of ${N} left.`);
    if (!interactive) return;

    const over = turn === null;
    const won = over && moves.length > 0 && moves[moves.length - 1].by === 'you';
    msg.dataset.kind = over ? (won ? 'won' : 'lost') : 'play';
    if (turn === 'choose') msg.textContent = `${N} stones. Who should start?`;
    else if (over) msg.textContent = won ? 'You took the last stone. You win!' : 'The computer took the last stone.';
    else if (turn === 'computer') msg.textContent = `${stones} left. The computer is thinking…`;
    else msg.textContent = `${lastMsg ? `${lastMsg} ` : ''}${stones} left. Your turn: take ${takeList()}.`;

    actions.replaceChildren();
    if (turn === 'choose') {
      actions.append(bigButton('I will start', () => { begin('you'); render(); env.onChange(getState()); }, 'blue'),
        bigButton('Computer starts', () => { begin('computer'); render(); env.onChange(getState()); }));
    } else if (over) {
      actions.append(bigButton('Play again', () => { newGame(); render(); env.onChange(getState()); }, 'primary'));
    } else {
      for (const t of take) {
        const btn = bigButton(`Take ${t}`, () => youTake(t), 'blue');
        btn.disabled = turn !== 'you' || t > stones;
        actions.appendChild(btn);
      }
    }

    trail.replaceChildren();
    for (const m of moves) {
      trail.appendChild(h('li', { dataset: { by: m.by } }, `${m.by === 'you' ? 'You' : 'Computer'} −${m.take}`, h('b', `→ ${m.left}`)));
    }
    roLeft.set(stones);
    roScore.set(`${wins} of ${games}`);
    roScore.el.hidden = games === 0;
  }

  function getState() {
    const over = turn === null;
    const won = over && moves.length > 0 && moves[moves.length - 1].by === 'you';
    return {
      stones,
      start: N,
      turn,
      over,
      won,
      lost: over && !won,
      games,
      wins,
      losses,
      first,
      moves: moves.map((m) => ({ ...m })),
      slip: slip ? { ...slip } : null,
      startedLosing,
    };
  }

  /** A model game: the learner plays perfectly from a winning start and takes the last stone. */
  function demoWin() {
    clearTimer();
    stones = N;
    moves = [];
    slip = null;
    startedLosing = false;
    lastMsg = '';
    first = firstRule === 'choose' ? (losing[N] ? 'computer' : 'you') : firstRule;
    turn = first;
    let guard = 0;
    while (turn !== null && guard++ < 500) {
      const legal = take.filter((t) => t <= stones);
      const good = winningMoves(take, stones, losing);
      if (turn === 'you') apply('you', good.length ? good[0] : legal[0]);
      else apply('computer', good.length ? good[0] : env.rng.pick(legal));
    }
  }

  newGame();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.won) demoWin();
      else if (Number.isFinite(next.stones)) {
        clearTimer();
        stones = Math.max(0, Math.min(N, Math.round(next.stones)));
        moves = [];
        slip = null;
        startedLosing = false;
        lastMsg = '';
        first = 'you';
        turn = stones > 0 ? 'you' : null;
      } else return;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (readOnly) clearTimer();
      else if (turn === 'computer') queueComputer();
    },
    destroy() { clearTimer(); },
  };
}

export const examples = [
  { title: 'nim-game — 15 stones, take 1 to 3, last stone wins', spec: { type: 'nim-game', stones: 15, take: [1, 2, 3] } },
  { title: 'nim-game — choose who starts', spec: { type: 'nim-game', stones: 16, take: [1, 2, 3], first: 'choose' } },
  {
    title: 'nim-game — static picture of a pile in groups',
    spec: { type: 'nim-game', static: true, stones: 15, groups: 4, taken: ['you', 'you', 'you'] },
  },
];
