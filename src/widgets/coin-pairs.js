/**
 * coin-pairs — a row of coins and one kind of move: turn over exactly two
 * (or `flip`) coins at once. A toy for finding an invariant: with two coins
 * turned per move, the number of tails goes up by 2, down by 2 or stays the
 * same, so it never changes between odd and even.
 *
 * {
 *   type: 'coin-pairs',
 *   coins: 'THTTH',     // the starting row: H = heads, T = tails (2 to 9 coins)
 *   flip: 2,            // how many coins every move turns over
 *   static: false,      // true: picture only
 * }
 *
 * The learner taps coins to select them; as soon as `flip` coins are selected
 * they all turn over, and that counts as one move.
 *
 * State: { coins, heads, tails, moves, allHeads, allTails, start }
 *   coins   the row now, e.g. 'HHTTH'
 *   moves   how many moves have been made since the start (or since "Start again")
 *   start   the starting row
 *
 * setState accepts { coins: 'HHHHH', moves: 2 }.
 */
import { frame, readout, button, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('coin-pairs', `
  .widget-coin-pairs .cp-coin { cursor: pointer; outline: none; }
  .widget-coin-pairs .cp-coin:focus-visible circle:first-child { stroke: var(--focus); stroke-width: 5; }
  .widget-coin-pairs.is-readonly .cp-coin { cursor: default; pointer-events: none; }
  .widget-coin-pairs .cp-face { font-size: 22px; font-weight: 800; pointer-events: none; }
`);

const W = 480;
const H = 132;
const parse = (text, fallback) => { const t = String(text || '').toUpperCase().replace(/[^HT]/g, ''); return t.length >= 2 ? t.slice(0, 9).split('') : fallback; };

export default function create(spec, env) {
  const start = parse(spec.coins, ['T', 'H', 'T', 'T', 'H']);
  const n = start.length;
  const flip = clamp(Math.round(spec.flip || 2), 1, n);
  const isStatic = !!spec.static || env.compact;
  let coins = start.slice();
  let moves = 0;
  let selected = [];
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A row of coins' });
  const { svg } = fr;
  const gap = Math.min(76, (W - 36) / n);
  const r = Math.min(30, gap / 2 - 5);
  const roHeads = readout('heads', { digits: 0 });
  const roTails = readout('tails', { digits: 0, color: 'orange' });
  const roMoves = readout('moves', { digits: 0 });
  if (!env.compact) fr.readouts.append(roHeads.el, roTails.el, roMoves.el);

  const getState = () => {
    const heads = coins.filter((c) => c === 'H').length;
    return { coins: coins.join(''), heads, tails: n - heads, moves, allHeads: heads === n, allTails: heads === 0, start: start.join('') };
  };

  const els = coins.map((_, i) => {
    const x = W / 2 + (i - (n - 1) / 2) * gap;
    const y = H / 2;
    const ring = s('circle', { cx: x, cy: y, r: r + 5, fill: 'none', 'stroke-width': 4 });
    const disc = s('circle', { cx: x, cy: y, r, 'stroke-width': 3 });
    const face = s('text', { class: 'fig-label cp-face', x, y: y + 8, 'text-anchor': 'middle' });
    const g = s('g', { class: 'cp-coin' }, disc, ring, face);
    if (!isStatic) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => tap(i));
      g.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        ev.stopPropagation();
        tap(i);
      });
    }
    svg.appendChild(g);
    return { g, ring, disc, face };
  });

  function draw() {
    els.forEach((el, i) => {
      const head = coins[i] === 'H';
      const on = selected.includes(i);
      el.disc.setAttribute('fill', head ? hue('yellow') : hue('gray', 'soft'));
      el.disc.setAttribute('stroke', head ? 'var(--edge-strong)' : 'var(--ink)');
      el.ring.setAttribute('stroke', on ? hue('blue') : 'none');
      el.face.textContent = head ? 'H' : 'T';
      el.face.setAttribute('style', head ? 'fill: #1D1B26' : '');
      el.g.setAttribute('aria-label', `Coin ${i + 1}: ${head ? 'heads' : 'tails'}${on ? ', selected' : ''}`);
      if (!isStatic) el.g.setAttribute('tabindex', readOnly ? '-1' : '0');
    });
    const st = getState();
    roHeads.set(st.heads);
    roTails.set(st.tails);
    roMoves.set(moves);
    if (resetBtn) resetBtn.disabled = readOnly || (!moves && !selected.length);
    svg.setAttribute('aria-label', `${n} coins: ${coins.map((c) => (c === 'H' ? 'heads' : 'tails')).join(', ')}. ${st.tails} tails. ${moves} move${moves === 1 ? '' : 's'} made.`);
  }

  function tap(i) {
    if (readOnly || isStatic) return;
    if (selected.includes(i)) selected = selected.filter((k) => k !== i);
    else selected.push(i);
    if (selected.length === flip) {
      for (const k of selected) coins[k] = coins[k] === 'H' ? 'T' : 'H';
      selected = [];
      moves++;
      play('drop');
      draw();
      const st = getState();
      env.announce(`${flip} coins turned over. ${st.tails} tails now.`);
      env.onChange(st);
      return;
    }
    play('tap');
    draw();
  }

  let resetBtn = null;
  if (!isStatic) {
    resetBtn = button('Start again', () => { if (readOnly) return; coins = start.slice(); moves = 0; selected = []; draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(resetBtn);
    fr.el.appendChild(document.createElement('p')).className = 'w-hint';
    fr.el.lastChild.textContent = `Tap ${flip === 1 ? 'a coin' : `${flip === 2 ? 'two' : flip} coins`} to turn ${flip === 1 ? 'it' : 'them'} over.`;
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.coins != null) { const row = parse(next.coins, null); if (row && row.length === n) coins = row; }
      if (next.moves != null) moves = Math.max(0, Math.round(next.moves));
      selected = [];
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      selected = [];
      draw();
    },
  };
}

export const examples = [
  { title: 'coin-pairs — three tails, two coins per move', spec: { type: 'coin-pairs', coins: 'THTTH' } },
  { title: 'coin-pairs — a row that can be solved', spec: { type: 'coin-pairs', coins: 'TTHTTH', static: true } },
];
