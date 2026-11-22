/**
 * ponzi-sim — a Ponzi scheme, round by round, until it collapses. Investors
 * are promised a "profit" every round. There is no business behind it: the
 * profit of earlier investors is paid out of the deposits of new ones. While
 * word of mouth doubles the number of investors each round, the pot swells.
 * When the town runs out of new people, the payouts due exceed the pot.
 *
 * {
 *   type: 'ponzi-sim',
 *   promise: 50,                    // the "profit" paid to every investor each round, in per cent of the deposit
 *   promiseRange: [10, 50, 10],     // optional slider for the promise
 *   deposit: 1000,                  // what each investor puts in, once
 *   first: 10,                      // investors at the start
 *   town: 5000,                     // everyone who could ever be persuaded to join
 *   skim: 10,                       // per cent of every deposit the operator takes for himself straight away
 *   currency: '$',
 *   static: false,
 * }
 *
 * Each round: as many new investors join as are already in (word of mouth), until the town is used up; their
 * deposits, less the skim, go into the pot; then every earlier investor is paid the promised profit from the
 * pot. If the pot cannot cover the payouts, the scheme collapses and nobody gets their deposit back.
 *
 * State: { promise, round, investors, joined, pot, due, paidOut, operator, collapsed, collapseRound, losers, losersPct }
 *   round       rounds played;  investors  people in the scheme;  joined  new investors in the last round
 *   pot         cash held;  due  payouts owed in the next round;  paidOut  all "profit" paid so far
 *   operator    what the operator has taken (the skim; after a collapse, also whatever was left in the pot)
 *   collapsed, collapseRound   whether, and in which round, the payouts could not be met
 *   losers, losersPct          after the collapse: investors who got back less than they put in, and their share (whole per cent)
 * setState accepts { promise, round } or { promise, end: true } (run until the collapse).
 *
 * A model. Real schemes also face withdrawals of deposits, which bring the end sooner, and their operators
 * usually take far more than a fixed share.
 */
import { frame, sliderRow, button, readout, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 210;
const X0 = 20;
const X1 = 540;

addStyles('ponzi-sim', `
  .widget-ponzi-sim .pz-line { text-align: center; min-height: 3.9em; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-ponzi-sim .pz-cap { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink); }
  @media (max-width: 520px) { .widget-ponzi-sim .pz-cap { font-size: 17px; } }
`);

/**
 * Play a scheme to its collapse. Returns the history: one entry per round with
 * { round, joined, investors, pot, due, paidOut, operator, collapsed } and, on the last entry, losers.
 */
export function ponziRun({ promise = 50, deposit = 1000, first = 10, town = 5000, skim = 10 }, maxRounds = 400) {
  const history = [];
  const cohorts = [first];                      // how many joined in round 0, 1, 2 …
  let investors = first;
  let pot = first * deposit * (1 - skim / 100);
  let operator = first * deposit * (skim / 100);
  let paidOut = 0;
  history.push({ round: 0, joined: first, investors, pot, due: investors * deposit * (promise / 100), paidOut, operator, collapsed: false });
  for (let round = 1; round <= maxRounds; round++) {
    const earlier = investors;
    const joined = Math.min(town - investors, investors);
    investors += joined;
    cohorts.push(joined);
    pot += joined * deposit * (1 - skim / 100);
    operator += joined * deposit * (skim / 100);
    const owed = earlier * deposit * (promise / 100);
    if (pot < owed) {
      // collapse: nothing is paid this round. Cohort j has been paid in rounds j+1 … round−1.
      let losers = 0;
      cohorts.forEach((count, j) => { if (Math.max(0, round - 1 - j) * (promise / 100) < 1) losers += count; });
      history.push({ round, joined, investors, pot, due: owed, paidOut, operator: operator + pot, collapsed: true, losers, losersPct: Math.round((losers / investors) * 100) });
      return history;
    }
    pot -= owed;
    paidOut += owed;
    history.push({ round, joined, investors, pot, due: investors * deposit * (promise / 100), paidOut, operator, collapsed: false });
  }
  return history;
}

const commas = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const base = { deposit: spec.deposit || 1000, first: spec.first || 10, town: spec.town || 5000, skim: spec.skim != null ? spec.skim : 10 };
  const isStatic = !!spec.static || !!env.compact;
  const range = !isStatic && Array.isArray(spec.promiseRange) ? spec.promiseRange : null;
  let promise = spec.promise != null ? spec.promise : 50;
  let history = ponziRun({ ...base, promise });
  let at = 0;                                   // index into history
  let readOnly = !!env.readOnly;
  const money = (v) => `${cur}${commas(v)}`;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A Ponzi scheme, round by round' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const roRound = readout('round');
  const roIn = readout('people in', { color: 'blue' });
  const roPaid = readout('"profit" paid out', { color: 'green' });
  const roOp = readout('operator took', { color: 'red' });
  fr.readouts.append(roRound.el, roIn.el, roPaid.el, roOp.el);
  const line = h('p.pz-line', { 'aria-live': 'polite' });
  let slider = null;
  const btns = [];
  if (!isStatic) {
    if (range) {
      slider = sliderRow({ label: 'promised each round', min: range[0], max: range[1], step: range[2] || 10, value: promise, color: 'green', unit: '%', onInput: (v) => { if (readOnly) return; promise = v; history = ponziRun({ ...base, promise }); at = 0; render(); env.onChange(getState()); } });
      fr.controls.appendChild(slider.el);
    }
    btns.push(button('Next round', () => { if (readOnly || at >= history.length - 1) return; at++; render(); play('tick'); env.announce(line.textContent); env.onChange(getState()); }, { icon: 'play', variant: 'primary' }));
    btns.push(button('Run to the end', () => { if (readOnly) return; at = history.length - 1; render(); play('tick'); env.announce(line.textContent); env.onChange(getState()); }));
    btns.push(button('Start again', () => { if (readOnly) return; at = 0; render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' }));
    fr.buttons.append(...btns);
  }
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);

  function getState() {
    const e = history[at];
    return { promise, round: e.round, investors: e.investors, joined: e.joined, pot: e.pot, due: e.due, paidOut: e.paidOut, operator: e.operator, collapsed: e.collapsed, collapseRound: e.collapsed ? e.round : null, losers: e.collapsed ? e.losers : null, losersPct: e.collapsed ? e.losersPct : null };
  }

  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  function bar(y, value, max, color, caption, pattern) {
    const w = max > 0 ? (Math.min(value, max) / max) * (X1 - X0) : 0;
    g.appendChild(s('rect', { x: X0, y, width: X1 - X0, height: 26, rx: 6, fill: 'var(--surface)', stroke: 'var(--hair)', 'stroke-width': 2 }));
    if (w > 0) g.appendChild(s('rect', { x: X0, y, width: Math.max(w, 3), height: 26, rx: 6, fill: hue(color), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': pattern || null }));
    g.appendChild(s('text.pz-cap', { x: X0, y: y - 7, 'text-anchor': 'start' }, caption));
  }

  function render() {
    const e = history[at];
    clear(g);
    const earlier = e.investors - (e.round ? e.joined : 0);
    // 1. the town
    bar(30, e.investors, base.town, 'blue', `People in the scheme: ${commas(e.investors)} of ${commas(base.town)}${e.round ? (e.joined ? ` (${commas(e.joined)} new)` : ' (nobody new)') : ''}`);
    if (e.round && e.joined > 0) {
      const xa = X0 + (earlier / base.town) * (X1 - X0);
      const xb = X0 + (e.investors / base.town) * (X1 - X0);
      if (xb - xa > 3) g.appendChild(s('rect', { x: xa, y: 30, width: xb - xa, height: 26, rx: 4, fill: hue('teal'), stroke: 'var(--ink)', 'stroke-width': 2 }));
    }
    // 2. the pot against what is owed next
    const scale = Math.max(e.pot, e.due, 1);
    bar(98, e.pot, scale, 'green', `Cash in the pot: ${money(e.pot)}`);
    bar(166, e.due, scale, e.collapsed ? 'red' : 'orange', e.collapsed ? `Owed this round: ${money(e.due)}. It cannot be paid` : `"Profit" owed next round: ${money(e.due)}`, e.collapsed ? null : '7 4');
    roRound.set(String(e.round));
    roIn.set(commas(e.investors));
    roPaid.set(money(e.paidOut));
    roOp.set(money(e.operator));
    if (e.collapsed) {
      line.textContent = `Round ${e.round}: ${e.joined ? `only ${commas(e.joined)} new people could be found` : 'nobody is left to join'}. ${money(e.due)} is owed and the pot holds ${money(e.pot)}. The scheme collapses. ${commas(e.losers)} of the ${commas(e.investors)} investors (${e.losersPct}%) have had back less than they put in; the operator leaves with what remains.`;
      line.style.color = 'var(--red-text)';
    } else {
      line.textContent = e.round
        ? `Round ${e.round}: ${commas(e.joined)} new investors paid in ${money(e.joined * base.deposit)}. Out of that money, the ${commas(earlier)} earlier investors were paid ${promise}% "profit". No business earned any of it.`
        : `${commas(base.first)} people each put in ${money(base.deposit)}, promised ${promise}% profit every round. There is no business: the profit can only come from new deposits.`;
      line.style.color = '';
    }
    if (btns.length) { btns[0].disabled = readOnly || at >= history.length - 1; btns[1].disabled = readOnly || at >= history.length - 1; btns[2].disabled = readOnly || at === 0; }
    svg.setAttribute('aria-label', `${spec.alt || 'A Ponzi scheme, round by round'}. ${line.textContent}`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.promise === 'number') { promise = range ? clamp(next.promise, range[0], range[1]) : next.promise; if (slider) slider.set(promise); history = ponziRun({ ...base, promise }); at = 0; }
      if (next.end || next.collapsed) at = history.length - 1;
      else if (typeof next.round === 'number') at = clamp(Math.round(next.round), 0, history.length - 1);
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (slider) slider.setDisabled(readOnly); render(); },
  };
}

export const examples = [
  { title: 'ponzi-sim — 50% every round', spec: { type: 'ponzi-sim', promise: 50 } },
  { title: 'ponzi-sim — choose the promise', spec: { type: 'ponzi-sim', promise: 20, promiseRange: [10, 50, 10] } },
];
