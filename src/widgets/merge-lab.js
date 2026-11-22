/**
 * merge-lab — merge sorted piles by hand. Two piles are merged by taking,
 * again and again, the smaller of their two front cards; a whole merge sort
 * is nothing but that, repeated level by level.
 *
 * Give it either
 *   piles:  [[2, 5, 9, 12], [3, 4, 10, 15]]   two sorted piles to merge into one row, or
 *   values: [5, 2, 7, 1, 8, 3, 6, 4]          a row to merge-sort: it starts split into single cards,
 *                                             which are merged into pairs, the pairs into fours, …
 *                                             (use 4 or 8 cards; 8 still fits a phone)
 * {
 *   type: 'merge-lab',
 *   piles: [[…], […]],     // or values: […]
 *   strict: false,         // true: picking the larger front card is refused and counted as a mistake
 *                          // false: it is placed anyway, the break in the order is marked, Undo takes it back
 *                          // (default: false with `piles`, true with `values`)
 * }
 *
 * State: { done, sorted, comparisons, moves, mistakes, level, levels, out, picks }
 *   done         every card has reached the bottom row
 *   sorted       no merged pile has a card out of order
 *   comparisons  picks made while both piles still had cards (one comparison each)
 *   moves        cards moved down a row, including the ones that follow without a comparison
 *   mistakes     strict: refused picks. Otherwise: cards that now sit out of order
 *   level        the level of merging in progress (1 = the first), out of `levels`
 *   out          the bottom row so far
 *   picks        the picks so far as a string of L / R (left or right pile), for replaying
 *
 * setState accepts { done: true } (carry out every remaining merge correctly) or { picks: 'LRRL' }.
 */
import { h, cx, readout, button, icon, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('merge-lab', `
  .widget-merge-lab { justify-items: stretch; gap: var(--s2); }
  .widget-merge-lab .ml-level { display: grid; gap: 3px; }
  .widget-merge-lab .ml-cap { text-align: center; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-3); }
  .widget-merge-lab .ml-level.is-working .ml-cap { color: var(--ink); }
  .widget-merge-lab .ml-row { display: flex; justify-content: center; gap: 5px; }
  .widget-merge-lab .ml-group { display: flex; min-width: 0; border-radius: 11px; transition: box-shadow 0.15s ease; }
  .widget-merge-lab .ml-group.is-source { box-shadow: 0 0 0 3px var(--orange); }
  .widget-merge-lab .ml-group.is-target { box-shadow: 0 0 0 3px var(--blue); }
  .widget-merge-lab .ml-card {
    position: relative; flex: 1 1 0; min-width: 0; height: 46px; padding: 0;
    display: grid; place-items: center;
    border: var(--bw) solid var(--edge); border-radius: 0;
    background: var(--surface); color: var(--ink);
    font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }
  /* cards of one pile share their borders, so a pile reads as one block */
  .widget-merge-lab .ml-card + .ml-card { margin-left: calc(-1 * var(--bw)); }
  .widget-merge-lab .ml-card:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
  .widget-merge-lab .ml-card:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }
  .widget-merge-lab .ml-card:disabled { opacity: 1; }
  .widget-merge-lab .ml-card.is-empty { background: transparent; border-style: dashed; border-color: var(--hair); }
  .widget-merge-lab .ml-card.is-next { z-index: 1; background: var(--blue-soft); border-color: var(--blue); }
  .widget-merge-lab .ml-card.is-used { background: transparent; color: var(--ink-3); border-color: var(--hair); font-weight: 600; }
  .widget-merge-lab .ml-card.is-front {
    z-index: 2; background: var(--orange); color: #1D1B26; border-color: var(--edge-strong); cursor: pointer;
    box-shadow: inset 0 -4px 0 rgba(29, 27, 38, 0.28); transition: transform 0.1s ease;
  }
  .widget-merge-lab .ml-card.is-front:active { transform: translateY(2px); }
  .widget-merge-lab .ml-card.is-settled { background: var(--green-soft); border-color: var(--green); }
  .widget-merge-lab .ml-card.is-bad { z-index: 1; background: var(--red-soft); border-color: var(--red); text-decoration: underline wavy var(--red); }
  .widget-merge-lab .ml-card.is-nope { animation: shake 0.4s ease; }
  .widget-merge-lab .ml-arrow { display: grid; place-items: center; color: var(--ink-3); height: 14px; }
  .widget-merge-lab .ml-status { min-height: 1.5em; margin-top: var(--s1); text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-merge-lab .ml-status.is-good { color: var(--green-text); }
  .widget-merge-lab .ml-status.is-bad { color: var(--red-text); }
  .widget-merge-lab .btn-ghost { box-shadow: none; }
  .widget-merge-lab.is-readonly .ml-card { pointer-events: none; }
`);

export default function create(spec, env) {
  const fromPiles = Array.isArray(spec.piles) && spec.piles.length === 2;
  const start = fromPiles
    ? spec.piles.map((pile) => pile.map(Number))
    : (Array.isArray(spec.values) && spec.values.length >= 2 ? spec.values : [5, 2, 7, 1, 8, 3, 6, 4]).map((v) => [Number(v)]);
  const strict = spec.strict != null ? !!spec.strict : !fromPiles;
  const total = start.reduce((sum, pile) => sum + pile.length, 0);
  let readOnly = !!env.readOnly;

  // Shape of the merge tree: sizes[level][g] = how many cards group g of that level holds.
  const sizes = [start.map((pile) => pile.length)];
  while (sizes[sizes.length - 1].length > 1) {
    const prev = sizes[sizes.length - 1];
    const next = [];
    for (let g = 0; g < prev.length; g += 2) next.push(prev[g] + (prev[g + 1] || 0));
    sizes.push(next);
  }
  const levels = sizes.length - 1;
  const jobs = [];
  for (let level = 1; level <= levels; level++) sizes[level].forEach((_, g) => jobs.push({ level, g }));

  let rows = [];        // rows[level][g] = cards placed in that group so far
  let taken = [];       // taken[level][g] = how many of its cards have moved on to the next level
  let job = 0;
  let comparisons = 0;
  let moves = 0;
  let refused = 0;
  let picks = '';

  function reset() {
    rows = sizes.map((groups, level) => groups.map((_, g) => (level === 0 ? start[g].slice() : [])));
    taken = sizes.map((groups) => groups.map(() => 0));
    job = 0; comparisons = 0; moves = 0; refused = 0; picks = '';
  }

  const done = () => job >= jobs.length;
  /** The two piles being merged right now and where their cards go. */
  function current() {
    if (done()) return null;
    const { level, g } = jobs[job];
    const li = 2 * g;
    const ri = 2 * g + 1;
    const src = rows[level - 1];
    const has = (i) => i < src.length && taken[level - 1][i] < src[i].length;
    const front = (i) => src[i][taken[level - 1][i]];
    return { level, g, li, ri, has, front };
  }

  function move(cur, i) {
    rows[cur.level][cur.g].push(cur.front(i));
    taken[cur.level - 1][i]++;
    moves++;
  }

  /** Take the front card of the left ('L') or right ('R') pile. Returns what happened. */
  function take(side) {
    const cur = current();
    if (!cur) return null;
    const i = side === 'L' ? cur.li : cur.ri;
    const other = side === 'L' ? cur.ri : cur.li;
    if (!cur.has(i)) return null;
    const card = cur.front(i);
    const rival = cur.has(other) ? cur.front(other) : null;
    if (rival != null && strict && card > rival) { refused++; return { refused: true, card, rival }; }
    if (rival != null) comparisons++;
    move(cur, i);
    picks += side;
    let followed = 0;
    if (!cur.has(i) || !cur.has(other)) {
      // one pile has run out: whatever is left in the other follows without any comparing
      const rest = cur.has(i) ? i : other;
      while (cur.has(rest)) { move(cur, rest); followed++; }
    }
    const mergeDone = rows[cur.level][cur.g].length === sizes[cur.level][cur.g];
    if (mergeDone) job++;
    return { card, rival, followed, level: cur.level, mergeDone, levelDone: mergeDone && cur.g === sizes[cur.level].length - 1 };
  }

  function finishAll() {
    for (let guard = 0; guard < 4 * total * (levels + 1) && !done(); guard++) {
      const cur = current();
      const left = cur.has(cur.li);
      const right = cur.has(cur.ri);
      take(left && (!right || cur.front(cur.li) <= cur.front(cur.ri)) ? 'L' : 'R');
    }
  }

  const outOfOrder = () => {
    let count = 0;
    for (let level = 1; level <= levels; level++) for (const group of rows[level]) group.forEach((v, i) => { if (i > 0 && group[i - 1] > v) count++; });
    return count;
  };

  /* ------------------------------------------------------------------ dom */
  const levelEls = [];
  const cells = [];   // cells[level][g][k]
  const groupEls = [];
  const caption = (level) => {
    const count = sizes[level].length;
    if (fromPiles) return level === 0 ? 'Two sorted piles' : 'One sorted row';
    if (level === 0) return `${total} single cards`;
    if (level === levels) return `All ${total}, sorted`;
    return `${count} sorted piles of ${sizes[level][0]}`;
  };
  const board = h('div.ml-board', { style: { display: 'grid', gap: 'var(--s1)' } });
  sizes.forEach((groups, level) => {
    cells.push([]);
    groupEls.push([]);
    const row = h('div.ml-row');
    groups.forEach((size, g) => {
      const group = h('div.ml-group', { style: { flex: `${size} 1 0`, maxWidth: `${size * 56}px` } });
      const list = [];
      for (let k = 0; k < size; k++) {
        const cell = h('button.ml-card', { type: 'button', disabled: true });
        cell.addEventListener('click', () => tapCell(level, g, k));
        list.push(cell);
        group.appendChild(cell);
      }
      cells[level].push(list);
      groupEls[level].push(group);
      row.appendChild(group);
    });
    const el = h('div.ml-level', h('div.ml-cap', caption(level)), row);
    levelEls.push(el);
    if (level > 0) board.appendChild(h('div.ml-arrow', icon('arrow-down', { size: 14, stroke: 3 })));
    board.appendChild(el);
  });

  const roComparisons = readout('Comparisons', { digits: 0 });
  const roMoves = readout('Cards moved', { digits: 0 });
  const status = h('div.ml-status');
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('ml-status', tone && `is-${tone}`); };
  const undoBtn = button('Undo', () => undo(), { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Start again', () => {
    if (readOnly || !picks) return;
    reset();
    render();
    setStatus(prompt());
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });
  const el = h('div.w-frame', board, status, h('div.w-readouts', roComparisons.el, roMoves.el),
    env.compact ? null : h('div.w-buttons', strict ? null : undoBtn, resetBtn));

  function render() {
    const cur = current();
    const finished = done();
    const broken = outOfOrder() > 0;
    sizes.forEach((groups, level) => {
      levelEls[level].classList.toggle('is-working', !!cur && (cur.level === level || cur.level - 1 === level));
      groups.forEach((size, g) => {
        const isSource = !!cur && cur.level - 1 === level && (g === cur.li || g === cur.ri);
        const isTarget = !!cur && cur.level === level && g === cur.g;
        groupEls[level][g].className = cx('ml-group', isSource && 'is-source', isTarget && 'is-target');
        const group = rows[level][g];
        for (let k = 0; k < size; k++) {
          const cell = cells[level][g][k];
          const filled = k < group.length;
          const used = filled && k < taken[level][g];
          const front = isSource && filled && k === taken[level][g];
          const bad = filled && level > 0 && k > 0 && group[k - 1] > group[k];
          const settled = finished && level === levels && !broken;
          cell.className = cx('ml-card', !filled && 'is-empty', !filled && isTarget && k === group.length && 'is-next',
            used && 'is-used', front && 'is-front', bad && !used && 'is-bad', settled && 'is-settled');
          cell.textContent = filled ? String(group[k]) : '';
          cell.disabled = readOnly || !front;
          cell.setAttribute('aria-label', !filled ? 'Empty place' : `${group[k]}${front ? ', front card: tap to take it' : used ? ', already moved down' : ''}`);
        }
      });
    });
    roComparisons.set(comparisons);
    roMoves.set(moves);
    undoBtn.disabled = readOnly || !picks;
    resetBtn.disabled = readOnly || !picks;
  }

  function prompt() {
    const cur = current();
    if (!cur) return '';
    if (cur.has(cur.li) && cur.has(cur.ri)) return `Front cards: ${cur.front(cur.li)} and ${cur.front(cur.ri)}. Tap the smaller one.`;
    return 'Tap the front card.';
  }

  function summary() {
    return fromPiles
      ? `Merged: ${total} cards with ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`
      : `Sorted. ${levels} levels of merging, ${moves} card moves, ${comparisons} comparisons.`;
  }

  function tapCell(level, g, k) {
    if (readOnly) return;
    const cur = current();
    if (!cur || cur.level - 1 !== level || (g !== cur.li && g !== cur.ri) || k !== taken[level][g]) return;
    const res = take(g === cur.li ? 'L' : 'R');
    if (!res) return;
    if (res.refused) {
      const cell = cells[level][g][k];
      cell.classList.remove('is-nope');
      void cell.offsetWidth;
      cell.classList.add('is-nope');
      play('wrong');
      const text = `${res.card} is not the smaller front card: compare it with ${res.rival}.`;
      setStatus(text, 'bad');
      env.announce(text);
      env.onChange(getState());
      return;
    }
    play('drop');
    render();
    let text;
    let tone = '';
    const broken = outOfOrder();
    if (done()) { text = broken ? 'Every card is down, but the row is out of order. Undo and compare the front cards again.' : summary(); tone = broken ? 'bad' : 'good'; }
    else if (!strict && res.rival != null && res.card > res.rival) { text = `${res.card} went down before ${res.rival}, which is smaller. Undo, then compare the two front cards.`; tone = 'bad'; }
    else {
      text = res.followed ? `One pile is empty, so the last ${res.followed === 1 ? 'card follows' : `${res.followed} cards follow`} without any comparing. ` : '';
      if (res.levelDone && !fromPiles) text += `Level ${res.level} is done. `;
      text += prompt();
    }
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function replay(seq) {
    reset();
    for (const side of seq) { if (done()) break; take(side === 'R' ? 'R' : 'L'); }
  }

  function undo() {
    if (readOnly || !picks || strict) return;
    replay(picks.slice(0, -1));
    play('pop');
    render();
    setStatus(prompt());
    env.onChange(getState());
  }

  function getState() {
    const broken = outOfOrder();
    return {
      done: done(), sorted: broken === 0, comparisons, moves,
      mistakes: strict ? refused : broken,
      level: done() ? levels : jobs[job].level, levels,
      out: rows[levels][0].slice(), picks,
    };
  }

  reset();
  render();
  setStatus(prompt());
  if (readOnly) el.classList.add('is-readonly');

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.picks === 'string') replay(next.picks.toUpperCase());
      if (next.done) { if (outOfOrder()) reset(); finishAll(); }
      render();
      setStatus(done() ? summary() : prompt(), done() ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'merge-lab — merge two sorted piles', spec: { type: 'merge-lab', piles: [[2, 5, 9, 12], [3, 4, 10, 15]] } },
  { title: 'merge-lab — a whole merge sort, level by level', spec: { type: 'merge-lab', values: [5, 2, 7, 1, 8, 3, 6, 4] } },
];
