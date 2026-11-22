/**
 * coin-change — pay an exact amount with coins, one coin at a time. The
 * coins land in a tray and are counted, so the learner can compare different
 * ways of paying the same amount. With `greedy: true` the widget only takes
 * the coin the greedy rule would take (the biggest one that still fits), so
 * that the learner carries out the rule by hand and sees where it leads.
 *
 * {
 *   type: 'coin-change',
 *   coins: [1, 5, 10, 25],    // the kinds of coin on offer (as many of each as needed)
 *   target: 68,               // the amount to pay
 *   greedy: false,            // true: every coin must be the biggest one that fits
 *   max: 16,                  // the tray is full after this many coins (at most 20)
 *   paid: [25, 25],           // coins already in the tray at the start
 *   static: false,            // true: picture only
 * }
 *
 * State: { coins, total, count, left, exact, greedy }
 *   coins   the coins in the tray, in the order they were paid
 *   total   their sum; `left` = target − total (never negative: a coin that would overshoot is refused)
 *   count   how many coins that is
 *   exact   the amount has been paid exactly
 *   greedy  every coin so far was the biggest one that still fitted at that moment
 *
 * setState accepts { coins: [25, 25, 10, 5, 1, 1, 1] }.
 */
import { frame, readout, button, hue, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('coin-change', `
  .widget-coin-change .cc-status { min-height: 1.6em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-coin-change .cc-status.is-good { color: var(--green-text); }
  .widget-coin-change .cc-status.is-bad { color: var(--red-text); }
  .widget-coin-change .cc-coin {
    min-width: 52px; height: 52px; padding: 0 8px; border-radius: 999px;
    border: var(--bw) solid var(--edge-strong); color: #1D1B26; font-weight: 800; font-size: 1.05rem;
    box-shadow: inset 0 -4px 0 rgba(29, 27, 38, 0.22); font-variant-numeric: tabular-nums;
    transition: transform 0.1s ease; -webkit-tap-highlight-color: transparent;
  }
  .widget-coin-change .cc-coin:active { transform: translateY(2px); }
  .widget-coin-change .cc-coin:disabled { opacity: 0.45; }
  .widget-coin-change .cc-coin.is-nope { animation: shake 0.4s ease; }
  .widget-coin-change .cc-purse { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: var(--s2); }
  .widget-coin-change .btn-ghost { box-shadow: none; }
`);

const COIN_HUES = ['orange', 'yellow', 'teal', 'pink', 'violet', 'gray'];

/** Play a list of coins into the tray: coins of an unknown kind, or that would overshoot, are left out. */
export function pay(kinds, target, list, max = 20) {
  const coins = [];
  let total = 0;
  let greedy = true;
  for (const c of Array.isArray(list) ? list : []) {
    if (!kinds.includes(c) || total + c > target || coins.length >= max) continue;
    const biggest = Math.max(...kinds.filter((k) => k <= target - total));
    if (c !== biggest) greedy = false;
    coins.push(c);
    total += c;
  }
  return { coins, total, count: coins.length, left: target - total, exact: total === target, greedy };
}

const W = 560;
const PER_ROW = 10;
const PITCH = 52;

export default function create(spec, env) {
  const kinds = (Array.isArray(spec.coins) ? spec.coins : [1, 5, 10, 25]).map(Number).filter((v) => v > 0).sort((a, b) => b - a);
  const target = Math.max(1, Math.round(Number(spec.target) || 30));
  const max = clamp(Math.round(spec.max || 16), 2, 20);
  const strict = !!spec.greedy;
  const isStatic = !!spec.static || env.compact;
  let readOnly = !!env.readOnly;
  let coins = pay(kinds, target, spec.paid, max).coins;

  const getState = () => pay(kinds, target, coins, max);
  const hueOf = (c) => COIN_HUES[Math.min(kinds.indexOf(c), COIN_HUES.length - 1)];

  const rows = Math.ceil(max / PER_ROW);
  const trayH = rows * PITCH + 12;
  const H = 46 + trayH + 8;
  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, label: spec.alt || `Pay ${target} with coins of ${kinds.join(', ')}` });
  const { svg } = fr;
  const head = s('text.fig-label-lg', { x: 20, y: 30 }, `To pay: ${target}`);
  const paidText = s('text.fig-label', { x: W - 20, y: 30, 'text-anchor': 'end' });
  svg.append(head, paidText);
  svg.appendChild(s('rect', { x: 10, y: 44, width: W - 20, height: trayH, rx: 16, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const gCoins = s('g');
  const emptyText = s('text.fig-label-sm', { x: W / 2, y: 44 + trayH / 2 + 4, 'text-anchor': 'middle', style: 'fill:var(--ink-3);stroke:none' }, 'The tray is empty');
  svg.append(gCoins, emptyText);

  const status = h('div.cc-status', { 'aria-live': 'polite' });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('cc-status', tone && `is-${tone}`); };
  const roCount = readout('Coins used', { digits: 0 });
  const roLeft = readout('Still to pay', { digits: 0 });
  const purse = h('div.cc-purse', { role: 'group', 'aria-label': 'Coins you can pay with' });
  const coinBtns = kinds.map((c) => {
    const b = h('button.cc-coin', { type: 'button', style: { background: hue(hueOf(c)) }, 'aria-label': `Pay a ${c} coin` }, String(c));
    b.addEventListener('click', (ev) => { ev.preventDefault(); add(c, b); });
    purse.appendChild(b);
    return b;
  });
  const undoBtn = button('Undo', () => { if (readOnly || !coins.length) return; coins.pop(); play('pop'); changed(prompt()); }, { icon: 'undo', variant: 'ghost' });
  const clearBtn = button('Empty the tray', () => { if (readOnly || !coins.length) return; coins = []; play('pop'); changed(prompt()); }, { icon: 'reset', variant: 'ghost' });
  if (!isStatic) {
    fr.el.insertBefore(status, fr.readouts);
    fr.readouts.append(roCount.el, roLeft.el);
    fr.el.insertBefore(purse, fr.buttons);
    fr.buttons.append(undoBtn, clearBtn);
  }

  function prompt() {
    const st = getState();
    if (st.exact) return `Paid exactly: ${st.count} ${st.count === 1 ? 'coin' : 'coins'}.`;
    if (strict) return `Greedy rule: take the biggest coin that fits into ${st.left}.`;
    return st.count ? `${st.left} still to pay.` : 'Tap a coin to pay with it.';
  }

  function render() {
    const st = getState();
    gCoins.replaceChildren();
    st.coins.forEach((c, i) => {
      const x = 10 + (W - 20 - (PER_ROW - 1) * PITCH) / 2 + (i % PER_ROW) * PITCH;
      const y = 44 + 6 + PITCH / 2 + Math.floor(i / PER_ROW) * PITCH;
      gCoins.append(
        s('circle', { cx: x, cy: y, r: 22, fill: hue(hueOf(c)), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }),
        s('text.fig-label', { x, y: y + 5, 'text-anchor': 'middle', style: 'fill:#1D1B26;stroke:none' }, String(c)),
      );
    });
    emptyText.setAttribute('visibility', st.count ? 'hidden' : 'visible');
    paidText.textContent = `paid ${st.total}`;
    roCount.set(st.count);
    roLeft.set(st.left);
    coinBtns.forEach((b, i) => { b.disabled = readOnly || st.exact || kinds[i] > st.left; });
    undoBtn.disabled = readOnly || !st.count;
    clearBtn.disabled = readOnly || !st.count;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}To pay: ${target}. In the tray: ${st.count ? st.coins.join(', ') : 'nothing'}. Paid ${st.total}.`);
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function refuse(btn, text) {
    btn.classList.remove('is-nope');
    void btn.offsetWidth;
    btn.classList.add('is-nope');
    play('wrong');
    setStatus(text, 'bad');
    env.announce(text);
  }

  function add(c, btn) {
    if (readOnly || isStatic) return;
    const st = getState();
    if (st.exact || c > st.left) return;
    if (st.count >= max) { refuse(btn, `The tray is full: ${max} coins. Take some back and use bigger coins.`); return; }
    const biggest = Math.max(...kinds.filter((k) => k <= st.left));
    if (strict && c !== biggest) { refuse(btn, `A ${c} fits, but it is not the biggest coin that fits into ${st.left}.`); return; }
    coins.push(c);
    play('drop');
    const after = getState();
    changed(prompt(), after.exact ? 'good' : '');
  }

  render();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.coins)) return;
      coins = pay(kinds, target, next.coins.map(Number), max).coins;
      render();
      setStatus(prompt(), getState().exact ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'coin-change — pay 68 with ordinary coins', spec: { type: 'coin-change', coins: [1, 5, 10, 25], target: 68 } },
  { title: 'coin-change — the greedy rule, enforced', spec: { type: 'coin-change', coins: [1, 3, 4], target: 6, greedy: true, max: 10 } },
];
