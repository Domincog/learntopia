/**
 * take-or-skip — find some of a list of numbers that add up to a target,
 * by backtracking. The numbers are decided one at a time, in order: take it
 * or skip it. The moment the total goes over the target the widget stops the
 * learner (nothing further along can repair that), and the only way on is to
 * back up and change an earlier decision. Choices already tried under the
 * same earlier decisions are greyed out, so the search cannot go in circles.
 * (A choice counts as tried once everything that could follow it has failed.
 * Backing out of a choice earlier than that leaves it open.)
 *
 * {
 *   type: 'take-or-skip',
 *   items: [9, 7, 5, 4, 2],   // positive whole numbers, decided from left to right (at most 6)
 *   target: 15,
 *   unit: 'kg',               // optional, written after totals
 * }
 *
 * State: { path, taken, total, target, hit, over, end, stuck, next, steps, backs }
 *   path    the decisions so far as a string of T (take) and S (skip), e.g. 'TST'
 *   taken   the numbers taken; `total` is their sum
 *   hit     the total equals the target
 *   over    the total is above the target
 *   end     every number has been decided
 *   stuck   the only possible move is to back up (over, or at the end without a hit,
 *           or both choices for the next number have been tried)
 *   next    index of the number to decide next (null when nothing can be decided)
 *   steps   decisions made so far, counting every attempt; `backs`: decisions taken back
 *
 * setState accepts { path: 'TSSTT' }.
 */
import { frame, readout, button, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('take-or-skip', `
  .widget-take-or-skip .ts-status { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-take-or-skip .ts-status.is-good { color: var(--green-text); }
  .widget-take-or-skip .ts-status.is-bad { color: var(--red-text); }
  .widget-take-or-skip .btn-ghost { box-shadow: none; }
`);

/** Replay a string of T/S decisions. Stops at the first decision that is not allowed. */
export function replay(items, target, path) {
  let total = 0;
  let used = '';
  for (const ch of String(path || '').toUpperCase()) {
    if (used.length >= items.length || total >= target || (ch !== 'T' && ch !== 'S')) break;
    if (ch === 'T') total += items[used.length];
    used += ch;
  }
  const taken = items.filter((_, i) => used[i] === 'T');
  const hit = total === target;
  const over = total > target;
  const end = used.length === items.length;
  return { path: used, taken, total, hit, over, end };
}

const W = 560;
const H = 196;

export default function create(spec, env) {
  const items = (Array.isArray(spec.items) ? spec.items : [9, 7, 5, 4, 2]).map(Number).filter((v) => v > 0).slice(0, 6);
  const target = Number(spec.target) || 15;
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const sumAll = items.reduce((a, b) => a + b, 0);
  let readOnly = !!env.readOnly;
  let path = '';
  let tried = [];   // tried[depth]: choices already tried for that number under the current earlier decisions
  let steps = 0;
  let backs = 0;

  function load(p) {
    path = replay(items, target, p).path;
    tried = items.map((_, i) => new Set(i < path.length ? [path[i]] : []));
    steps = path.length;
    backs = 0;
  }
  load('');

  function getState() {
    const r = replay(items, target, path);
    const canDecide = !r.hit && !r.over && !r.end;
    const open = canDecide ? ['T', 'S'].filter((ch) => !tried[path.length].has(ch)) : [];
    return { ...r, target, stuck: !r.hit && !open.length, next: canDecide && open.length ? path.length : null, open, steps, backs };
  }

  /* ---------------------------------------------------------------- scene */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || `Choose some of the numbers ${items.join(', ')} to make exactly ${target}` });
  const { svg } = fr;
  const barX = 34;
  const barW = W - 2 * barX;
  const scaleMax = Math.max(sumAll, target);
  const bx = (v) => barX + (Math.min(v, scaleMax) / scaleMax) * barW;
  svg.appendChild(s('rect', { x: barX, y: 34, width: barW, height: 22, rx: 8, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const fill = s('rect', { x: barX, y: 34, height: 22, rx: 8, stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const targetLine = s('path', { d: `M${bx(target)} 26 V64`, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const targetText = s('text.fig-label', { x: bx(target), y: 18, 'text-anchor': 'middle' }, `target ${target}${unit}`);
  const totalText = s('text.fig-label', { y: 82, 'text-anchor': 'middle' });
  svg.append(fill, targetLine, targetText, totalText);

  const cardW = Math.min(76, (W - 40) / items.length - 10);
  const pitch = cardW + 10;
  const x0 = (W - (items.length * pitch - 10)) / 2;
  const cards = items.map((value, i) => {
    const g = s('g', { transform: `translate(${x0 + i * pitch} 100)` });
    const box = s('rect', { width: cardW, height: 58, rx: 10, 'stroke-width': 3 });
    const num = s('text.fig-label-lg', { x: cardW / 2, y: 39, 'text-anchor': 'middle', style: 'font-size:26px' }, String(value));
    const strike = s('path', { d: `M10 48 L${cardW - 10} 10`, stroke: 'var(--ink-3)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    const tag = s('text.fig-label-sm', { x: cardW / 2, y: 76, 'text-anchor': 'middle' });
    g.append(box, num, strike, tag);
    svg.appendChild(g);
    return { g, box, num, strike, tag };
  });

  const status = h('div.ts-status', { 'aria-live': 'polite' });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('ts-status', tone && `is-${tone}`); };
  const roSteps = readout('Decisions', { digits: 0 });
  const roBacks = readout('Taken back', { digits: 0 });
  const takeBtn = button('Take', () => decide('T'), { variant: 'primary' });
  const skipBtn = button('Skip', () => decide('S'));
  const backBtn = button('Back up', () => backUp(), { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Start again', () => { if (readOnly) return; load(''); play('pop'); changed(prompt()); }, { icon: 'reset', variant: 'ghost' });
  if (!env.compact) {
    fr.el.insertBefore(status, fr.readouts);
    fr.readouts.append(roSteps.el, roBacks.el);
    fr.buttons.append(takeBtn, skipBtn, backBtn, resetBtn);
  }

  function prompt() {
    const st = getState();
    if (st.hit) return `Exactly ${target}${unit}: ${st.taken.join(' + ')} = ${target}.`;
    if (st.over) return `${st.total}${unit} is over the target. Nothing further along can fix that: back up.`;
    if (st.end) return `No numbers left, and the total is only ${st.total}${unit}. Back up.`;
    if (st.stuck) return path.length ? `Taking ${items[path.length]} and skipping it have both failed here. Back up further.` : 'Every possibility has been tried.';
    const v = items[st.next];
    if (st.open.length === 1) return `${v}: you have already tried to ${st.open[0] === 'T' ? 'skip' : 'take'} it here. Now ${st.open[0] === 'T' ? 'take' : 'skip'} it, or back up.`;
    return `Total so far: ${st.total}${unit}. Next number: ${v}. Take it or skip it?`;
  }

  function render() {
    const st = getState();
    const w = Math.max(0, bx(st.total) - barX);
    fill.setAttribute('width', w);
    fill.setAttribute('visibility', w > 0 ? 'visible' : 'hidden');
    fill.setAttribute('fill', st.hit ? hue('green') : st.over ? hue('red') : hue('blue'));
    totalText.textContent = `total ${st.total}${unit}`;
    totalText.setAttribute('x', Math.min(Math.max(bx(st.total), barX + 40), W - barX - 40));
    cards.forEach((card, i) => {
      const choice = path[i];
      const isNext = i === path.length && !st.hit && !st.over;
      card.box.setAttribute('fill', choice === 'T' ? hue('blue') : choice === 'S' ? 'var(--sunken)' : 'var(--surface)');
      card.box.setAttribute('stroke', isNext ? hue('orange') : choice === 'T' ? 'var(--edge-strong)' : choice === 'S' ? 'var(--ink-3)' : 'var(--ink)');
      card.box.setAttribute('stroke-width', isNext ? 5 : 3);
      card.box.setAttribute('stroke-dasharray', choice === 'S' ? '6 5' : 'none');
      card.num.setAttribute('style', `font-size:26px;${choice === 'T' ? 'fill:#1D1B26' : choice === 'S' ? 'fill:var(--ink-3)' : ''}`);
      card.strike.setAttribute('visibility', choice === 'S' ? 'visible' : 'hidden');
      card.tag.textContent = choice === 'T' ? 'taken' : choice === 'S' ? 'skipped' : isNext ? 'next' : '';
    });
    const v = st.next == null ? null : items[st.next];
    takeBtn.lastChild.textContent = v == null ? 'Take' : `Take ${v}`;
    skipBtn.lastChild.textContent = v == null ? 'Skip' : `Skip ${v}`;
    takeBtn.disabled = readOnly || !st.open.includes('T');
    skipBtn.disabled = readOnly || !st.open.includes('S');
    backBtn.disabled = readOnly || !path.length || st.hit;
    resetBtn.disabled = readOnly || (!steps && !backs);
    roSteps.set(steps);
    roBacks.set(backs);
    const said = items.map((value, i) => `${value}${path[i] === 'T' ? ' taken' : path[i] === 'S' ? ' skipped' : ''}`).join(', ');
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Numbers: ${said}. Total ${st.total} of target ${target}.`);
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function decide(ch) {
    if (readOnly) return;
    const st = getState();
    if (!st.open.includes(ch)) return;
    tried[path.length].add(ch);
    path += ch;
    steps++;
    const after = getState();
    play(after.over ? 'wrong' : 'drop');
    changed(prompt(), after.hit ? 'good' : after.stuck ? 'bad' : '');
  }

  function backUp() {
    if (readOnly || !path.length || getState().hit) return;
    const exhausted = getState().stuck; // everything that could follow the latest decision has been tried
    const depth = path.length - 1;
    const choice = path[depth];
    path = path.slice(0, -1);
    if (depth + 1 < items.length) tried[depth + 1] = new Set(); // the next number starts afresh under different decisions
    // Backed out early: what lies beyond this choice has not all been looked at, so the choice has not failed
    // and stays open. (Marking it as tried could close off the only solution without it ever being explored.)
    if (!exhausted) tried[depth].delete(choice);
    backs++;
    play('pop');
    changed(prompt(), getState().stuck ? 'bad' : '');
  }

  render();
  setStatus(prompt());
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || typeof next.path !== 'string') return;
      load(next.path);
      render();
      const st = getState();
      setStatus(prompt(), st.hit ? 'good' : st.stuck ? 'bad' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'take-or-skip — make exactly 15', spec: { type: 'take-or-skip', items: [9, 7, 5, 4, 2], target: 15, unit: 'kg' } },
];
