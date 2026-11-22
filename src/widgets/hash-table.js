/**
 * hash-table — a table of numbered slots, and words that are filed by
 * computing their slot number instead of searching for a place. Words that
 * land in the same slot form a chain.
 *
 * Hash functions (m = number of slots, letters count A = 1, B = 2, … Z = 26):
 *   'sum'     add up the numbers of all the letters, take the remainder on division by m
 *   'first'   the number of the first letter, remainder on division by m
 *   'length'  the number of letters, remainder on division by m
 *
 * Modes
 *   'place'    the words in `keys` wait in a queue. For each one the learner works out the slot
 *              and taps it. A wrong slot is refused (and counted), with a nudge towards the sum.
 *   'compare'  all of `keys` are filed at once; buttons switch between the hash functions in `fns`
 *              so that the learner can see how evenly each one spreads the same words.
 *   'view'     a picture of the table holding `keys`. With `find`, the slot of that word is
 *              outlined and the words that a search has to look at are numbered.
 *
 * {
 *   type: 'hash-table',
 *   slots: 7,
 *   fn: 'sum',
 *   mode: 'place',
 *   keys: ['CAB', 'BED', 'ACE'],     // capital letters only
 *   placed: ['FED'],                 // place mode: words that are in the table from the start
 *   fns: ['first', 'sum'],           // compare mode
 *   find: 'BED',                     // view mode
 * }
 *
 * State: { fn, table, counts, placed, waiting, longest, used, collisions, load, mistakes, done, tried }
 *   table       the chain in each slot, e.g. [['BAD'], [], ['ACE', 'ADD'], …]; `counts`: the chain lengths
 *   placed      how many words are in the table; `waiting`: how many are still in the queue
 *   longest     the longest chain; `used`: how many slots hold at least one word
 *   collisions  words that landed in a slot that already held a word
 *   load        placed ÷ slots
 *   mistakes    place mode: refused taps
 *   done        nothing is waiting
 *   tried       compare mode: the hash functions the learner has looked at so far
 *
 * setState accepts { done: true } (place mode: files every waiting word), { placed: 3 } (files the
 * first 3 waiting words) and { fn: 'sum' } or { tried: ['first', 'sum'] } (compare mode).
 */
import { frame, readout, button, hue, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('hash-table', `
  .widget-hash-table .ht-slot { outline: none; }
  .widget-hash-table .ht-slot.is-tap { cursor: pointer; }
  .widget-hash-table .ht-slot:focus-visible .ht-num { stroke: var(--focus); stroke-width: 5; }
  .widget-hash-table .ht-slot.is-nope .ht-inner { animation: shake 0.4s ease; }
  .widget-hash-table.is-readonly .ht-slot { pointer-events: none; }
  .widget-hash-table .ht-status { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-hash-table .ht-status.is-good { color: var(--green-text); }
  .widget-hash-table .ht-status.is-bad { color: var(--red-text); }
  .widget-hash-table .ht-fns { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-hash-table .ht-fns .btn.is-on { background: var(--ink); color: var(--surface); border-color: var(--ink); }
  .widget-hash-table .btn-ghost { box-shadow: none; }
`);

export const letterNumber = (ch) => ch.toUpperCase().charCodeAt(0) - 64;
export const HASH = {
  sum: { name: 'Sum of the letters', slot: (word, m) => [...word].reduce((t, ch) => t + letterNumber(ch), 0) % m },
  first: { name: 'First letter only', slot: (word, m) => letterNumber(word[0]) % m },
  length: { name: 'Number of letters', slot: (word, m) => word.length % m },
};
/** File the words into m slots, in order. Returns the chains. */
export function fileAll(words, m, fn = 'sum') {
  const table = Array.from({ length: m }, () => []);
  for (const word of words) table[HASH[fn].slot(word, m)].push(word);
  return table;
}
/** What the state reports about a table. */
export function tableFacts(table) {
  const counts = table.map((chain) => chain.length);
  const placed = counts.reduce((a, b) => a + b, 0);
  return {
    counts, placed, longest: Math.max(0, ...counts), used: counts.filter((c) => c > 0).length,
    collisions: counts.reduce((total, c) => total + Math.max(0, c - 1), 0), load: Math.round((placed / table.length) * 1000) / 1000,
  };
}

// A narrow drawing with tall rows: on a phone it is shown at nearly full size, so every slot is easy to tap.
const W = 400;
const ROW = 46;
const CHIP = 50;

export default function create(spec, env) {
  const m = clamp(Math.round(spec.slots || 7), 2, 12);
  const mode = ['place', 'compare', 'view'].includes(spec.mode) ? spec.mode : 'view';
  const clean = (list) => (Array.isArray(list) ? list : []).map((w) => String(w).toUpperCase().replace(/[^A-Z]/g, '')).filter(Boolean);
  const keys = clean(spec.keys);
  const preset = clean(spec.placed);
  const fnList = (Array.isArray(spec.fns) ? spec.fns : []).filter((id) => HASH[id]);
  let fn = HASH[spec.fn] ? spec.fn : fnList.length ? fnList[0] : 'sum';
  const interactive = mode !== 'view' && !env.compact;
  let readOnly = !!env.readOnly;
  let filed = 0;          // place mode: how many of `keys` are in the table
  let mistakes = 0;
  let tried = mode === 'compare' ? [fn] : [];

  const tableNow = () => (mode === 'place' ? fileAll([...preset, ...keys.slice(0, filed)], m, fn) : fileAll(keys, m, fn));
  function getState() {
    const table = tableNow();
    return { fn, table, ...tableFacts(table), waiting: mode === 'place' ? keys.length - filed : 0, mistakes, done: mode !== 'place' || filed >= keys.length, tried: tried.slice() };
  }

  /* ---------------------------------------------------------------- scene */
  const TOP = mode === 'place' ? 84 : 8;
  const H = TOP + m * ROW + 8;
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 470, label: spec.alt || `A hash table with ${m} slots` });
  const { svg } = fr;
  const gCard = s('g');
  const gRows = s('g');
  svg.append(gCard, gRows);
  const rowEls = [];
  for (let i = 0; i < m; i++) {
    const y = TOP + i * ROW;
    const num = s('rect.ht-num', { x: 10, y: y + 5, width: 40, height: ROW - 10, rx: 9, 'stroke-width': 2.5 });
    const text = s('text.fig-label', { x: 30, y: y + ROW / 2 + 5, 'text-anchor': 'middle', style: 'stroke:none' }, String(i));
    const rail = s('line', { x1: 50, x2: W - 10, y1: y + ROW / 2, y2: y + ROW / 2, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
    const chain = s('g');
    const hit = s('rect', { x: 4, y, width: W - 8, height: ROW, fill: 'transparent' });
    const g = s('g.ht-slot', s('g.ht-inner', rail, num, text, chain), hit);
    if (interactive && mode === 'place') {
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => tap(i));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(i); } });
    }
    rowEls.push({ g, num, text, chain });
    gRows.appendChild(g);
  }

  /* ------------------------------------------------------------- controls */
  const status = h('div.ht-status', { 'aria-live': 'polite' });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('ht-status', tone && `is-${tone}`); };
  const roLongest = readout('Longest chain', { digits: 0 });
  const roUsed = readout('Slots in use', { digits: 0 });
  const fnRow = h('div.ht-fns', { role: 'group', 'aria-label': 'Hash function' });
  const fnBtns = fnList.map((id) => {
    const b = button(HASH[id].name, () => {
      if (readOnly || fn === id) return;
      fn = id;
      if (!tried.includes(id)) tried.push(id);
      play('tap');
      changed(prompt());
    });
    fnRow.appendChild(b);
    return b;
  });
  const resetBtn = button('Start again', () => { if (readOnly) return; filed = 0; mistakes = 0; play('pop'); changed(prompt()); }, { icon: 'reset', variant: 'ghost' });
  if (interactive) {
    fr.el.insertBefore(status, fr.readouts);
    if (mode === 'compare') fr.el.insertBefore(fnRow, fr.readouts);
    fr.readouts.append(roLongest.el, roUsed.el);
    if (mode === 'place') fr.buttons.appendChild(resetBtn);
  }

  const working = (word) => {
    if (fn === 'first') return `${word[0]} is letter ${letterNumber(word[0])}`;
    if (fn === 'length') return `${word} has ${word.length} letters`;
    return `${[...word].map(letterNumber).join(' + ')} = ${[...word].reduce((t, ch) => t + letterNumber(ch), 0)}`;
  };
  const valueOf = (word) => (fn === 'first' ? letterNumber(word[0]) : fn === 'length' ? word.length : [...word].reduce((t, ch) => t + letterNumber(ch), 0));

  function prompt() {
    const st = getState();
    if (mode === 'compare') return `${HASH[fn].name}: ${st.placed} words in ${m} slots. The longest chain holds ${st.longest}.`;
    if (st.done) return `All ${st.placed} words are filed. ${st.collisions ? `${st.collisions === 1 ? 'One word' : `${st.collisions} words`} had to share a slot.` : 'Every word has a slot of its own.'}`;
    const word = keys[filed];
    if (fn === 'sum') return `${word}: add the numbers of its letters, then take the remainder on division by ${m}. Tap that slot.`;
    if (fn === 'first') return `${word}: take the number of its first letter, then the remainder on division by ${m}. Tap that slot.`;
    return `${word}: count its letters, then take the remainder on division by ${m}. Tap that slot.`;
  }

  /* --------------------------------------------------------------- render */
  function render() {
    const st = getState();
    const table = st.table;
    const word = mode === 'place' && !st.done ? keys[filed] : null;
    const findSlot = mode === 'view' && spec.find ? HASH[fn].slot(String(spec.find).toUpperCase(), m) : null;
    gCard.replaceChildren();
    if (mode === 'place') {
      if (word) {
        const tile = 40;
        const x0 = 12;
        [...word].forEach((ch, i) => {
          const x = x0 + i * (tile + 4);
          gCard.append(
            s('rect', { x, y: 8, width: tile, height: 46, rx: 9, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }),
            s('text.fig-label-lg', { x: x + tile / 2, y: 38, 'text-anchor': 'middle', style: 'fill:#1D1B26' }, ch),
            s('text.fig-label', { x: x + tile / 2, y: 72, 'text-anchor': 'middle' }, String(letterNumber(ch))),
          );
        });
        const after = x0 + word.length * (tile + 4) + 10;
        const rest = keys.slice(filed + 1);
        if (rest.length) {
          gCard.appendChild(s('text.fig-label-sm', { x: after, y: 24, style: 'fill:var(--ink-3)' }, 'waiting'));
          rest.slice(0, 5).forEach((w, i) => {
            const x = after + i * (CHIP + 4);
            if (x + CHIP > W - 6) return;
            gCard.append(
              s('rect', { x, y: 30, width: CHIP, height: 24, rx: 8, fill: 'var(--surface)', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
              s('text.fig-label-sm', { x: x + CHIP / 2, y: 46, 'text-anchor': 'middle', style: 'stroke:none;font-size:12px' }, w),
            );
          });
        }
      } else {
        gCard.appendChild(s('text.fig-label', { x: W / 2, y: 46, 'text-anchor': 'middle' }, 'Nothing is waiting'));
      }
    }
    table.forEach((chain, i) => {
      const el = rowEls[i];
      const isFind = findSlot === i;
      el.num.setAttribute('fill', isFind ? hue('orange') : chain.length ? hue('blue', 'soft') : 'var(--surface)');
      el.num.setAttribute('stroke', 'var(--ink)');
      el.text.setAttribute('style', `stroke:none${isFind ? ';fill:#1D1B26' : ''}`);
      el.chain.replaceChildren();
      const target = isFind ? chain.indexOf(String(spec.find).toUpperCase()) : -1;
      chain.forEach((w, k) => {
        const x = 58 + k * (CHIP + 6);
        if (x + CHIP > W - 4) return;
        const looked = isFind && (target < 0 || k <= target);
        const isHit = isFind && k === target;
        if (k > 0) el.chain.appendChild(s('line', { x1: x - 6, x2: x, y1: TOP + i * ROW + ROW / 2, y2: TOP + i * ROW + ROW / 2, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
        el.chain.append(
          s('rect', { x, y: TOP + i * ROW + 7, width: CHIP, height: ROW - 14, rx: 8, fill: isHit ? hue('green') : looked ? hue('yellow') : hue('blue', 'soft'), stroke: isHit || looked ? 'var(--edge-strong)' : 'var(--ink)', 'stroke-width': 2.5 }),
          s('text.fig-label', { x: x + CHIP / 2, y: TOP + i * ROW + ROW / 2 + 5, 'text-anchor': 'middle', style: `stroke:none;font-size:${w.length > 4 ? 12 : 14}px${isHit || looked ? ';fill:#1D1B26' : ''}` }, w),
        );
      });
      if (interactive && mode === 'place') {
        el.g.classList.toggle('is-tap', !readOnly && !!word);
        el.g.setAttribute('tabindex', !readOnly && word ? '0' : '-1');
        el.g.setAttribute('aria-label', `Slot ${i}: ${chain.length ? chain.join(', ') : 'empty'}`);
      }
    });
    roLongest.set(st.longest);
    roUsed.set(`${st.used} of ${m}`);
    fnBtns.forEach((b, i) => { b.classList.toggle('is-on', fnList[i] === fn); b.setAttribute('aria-pressed', String(fnList[i] === fn)); });
    resetBtn.disabled = readOnly || (!filed && !mistakes);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Hash table with ${m} slots. ${table.map((chain, i) => `Slot ${i}: ${chain.length ? chain.join(', ') : 'empty'}`).join('. ')}.${word ? ` Next word: ${word}.` : ''}`);
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function tap(i) {
    if (readOnly || mode !== 'place' || filed >= keys.length) return;
    const word = keys[filed];
    const right = HASH[fn].slot(word, m);
    if (i !== right) {
      const g = rowEls[i].g;
      g.classList.remove('is-nope');
      void g.getBoundingClientRect();
      g.classList.add('is-nope');
      play('wrong');
      mistakes++;
      const text = `Not slot ${i}. ${word}: ${working(word)}. What is left over when ${valueOf(word)} is divided by ${m}?`;
      setStatus(text, 'bad');
      env.announce(text);
      env.onChange(getState());
      return;
    }
    const before = tableNow()[right];
    filed++;
    play('drop');
    const st = getState();
    let text = `${word}: ${working(word)}, remainder ${right}. Filed in slot ${right}.`;
    if (before.length) text += ` ${before.join(' and ')} ${before.length === 1 ? 'is' : 'are'} already there: a collision. ${word} joins the chain.`;
    if (st.done) text += ` ${prompt()}`;
    changed(text, st.done ? 'good' : '');
  }

  render();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'place') {
        if (Number.isFinite(next.placed)) filed = clamp(Math.round(next.placed) - preset.length, 0, keys.length);
        if (next.done) filed = keys.length;
      }
      if (mode === 'compare') {
        if (Array.isArray(next.tried)) for (const id of next.tried) if (fnList.includes(id)) { fn = id; if (!tried.includes(id)) tried.push(id); }
        if (next.fn && fnList.includes(next.fn)) { fn = next.fn; if (!tried.includes(fn)) tried.push(fn); }
      }
      render();
      setStatus(prompt(), mode === 'place' && getState().done ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'hash-table — file each word by working out its slot', spec: { type: 'hash-table', mode: 'place', slots: 7, keys: ['CAB', 'BED', 'ACE', 'FED', 'BAG'] } },
  { title: 'hash-table — a good and a bad hash function', spec: { type: 'hash-table', mode: 'compare', slots: 7, fns: ['first', 'sum'], keys: ['BAD', 'BID', 'BAG', 'BED', 'BEE', 'BIDE', 'ACE', 'DAB', 'CAD', 'FIB', 'HEAD', 'EGG'] } },
  { title: 'hash-table — looking a word up', spec: { type: 'hash-table', mode: 'view', slots: 7, keys: ['BAD', 'BED', 'BEG', 'BIG', 'CAB', 'DIG', 'HID'], find: 'HID' } },
];
