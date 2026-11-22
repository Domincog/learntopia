/**
 * week-planner — plan a week of physical activity for an example person and
 * see it measured against the WHO recommendations. Seven day cards show how
 * many minutes that person has free on each day; the learner picks a day,
 * then taps an activity to put it there (tap a placed activity to take it
 * away). A gauge adds up the "moderate-equivalent" minutes (vigorous minutes
 * count double) against the 150–300 range, and pips count the days with
 * muscle-strengthening and, if asked for, balance practice.
 *
 * {
 *   type: 'week-planner',
 *   free: [30, 30, 0, 45, 30, 90, 60],        // minutes free on Monday … Sunday
 *   activities: [                              // what can be placed
 *     { id: 'walk', label: 'Brisk walk', minutes: 30, kind: 'moderate' },
 *     { id: 'run', label: 'Run', minutes: 20, kind: 'vigorous' },
 *     { id: 'strength', label: 'Strength exercises', minutes: 20, strength: true },
 *     { id: 'taichi', label: 'Tai chi', minutes: 30, balance: true, strength: true },
 *   ],                                         // kind: 'moderate' | 'vigorous' | omitted (no aerobic minutes counted)
 *   plan: [[], ['walk'], [], [], [], [], []],  // what is already placed, by day
 *   need: { minutes: 150, strengthDays: 2, balanceDays: 0 },
 *   static: false,                             // true: a picture without controls
 * }
 *
 * State: { plan, moderate, vigorous, equivalent, strengthDays, balanceDays, activeDays, used, count,
 *          meetsAerobic, meetsStrength, meetsBalance, meets }
 *   moderate, vigorous — minutes of each kind in the week;  equivalent — moderate + 2 × vigorous
 *   strengthDays, balanceDays — days with at least one strengthening / balance activity
 *   activeDays — days with anything planned;  used — minutes planned on each day;  count — activities placed
 *   meetsAerobic — equivalent ≥ need.minutes;  meetsStrength, meetsBalance — enough days;  meets — all of them
 *
 * setState({ plan }) restores a plan (activities that do not fit a day's free time are left out).
 *
 * A simplification: strength and balance sessions are counted in days only,
 * not in aerobic minutes, although a brisk session does a little of both.
 */
import { frame, button, hue, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 50;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BAR0 = 24;
const BAR1 = 536;
const SCALE = 360;      // minutes shown by the full bar

export const DEFAULT_ACTIVITIES = [
  { id: 'walk', label: 'Brisk walk', minutes: 30, kind: 'moderate' },
  { id: 'cycle', label: 'Bike ride', minutes: 30, kind: 'moderate' },
  { id: 'run', label: 'Run', minutes: 20, kind: 'vigorous' },
  { id: 'strength', label: 'Strength exercises', minutes: 20, strength: true },
];

/** Totals of a plan: the same sums the widget shows. */
export function tally(plan, activities = DEFAULT_ACTIVITIES, need = {}) {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const want = { minutes: 150, strengthDays: 2, balanceDays: 0, ...need };
  let moderate = 0;
  let vigorous = 0;
  let strengthDays = 0;
  let balanceDays = 0;
  let activeDays = 0;
  let count = 0;
  const used = [];
  for (let d = 0; d < 7; d++) {
    const items = ((plan && plan[d]) || []).map((id) => byId.get(id)).filter(Boolean);
    used.push(items.reduce((t, a) => t + a.minutes, 0));
    count += items.length;
    if (items.length) activeDays++;
    if (items.some((a) => a.strength)) strengthDays++;
    if (items.some((a) => a.balance)) balanceDays++;
    for (const a of items) { if (a.kind === 'moderate') moderate += a.minutes; else if (a.kind === 'vigorous') vigorous += a.minutes; }
  }
  const equivalent = moderate + 2 * vigorous;
  const meetsAerobic = equivalent >= want.minutes;
  const meetsStrength = strengthDays >= want.strengthDays;
  const meetsBalance = balanceDays >= want.balanceDays;
  return { moderate, vigorous, equivalent, strengthDays, balanceDays, activeDays, used, count, meetsAerobic, meetsStrength, meetsBalance, meets: meetsAerobic && meetsStrength && meetsBalance };
}

addStyles('week-planner', `
  .widget-week-planner .wp-days { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 6px; width: 100%; }
  .widget-week-planner .wp-day { display: flex; flex-direction: column; gap: 4px; padding: 4px; border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); min-height: 96px; }
  .widget-week-planner .wp-day.is-picked { border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); background: var(--blue-soft); }
  .widget-week-planner .wp-head {
    min-height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.15; border-radius: var(--r-sm);
    font-weight: 800; font-size: var(--fs-sm); cursor: pointer; user-select: none; -webkit-user-select: none; text-align: center;
  }
  .widget-week-planner .wp-head small { font-weight: 600; font-size: var(--fs-xs); color: var(--ink-2); font-variant-numeric: tabular-nums; }
  .widget-week-planner .wp-chip {
    min-height: 36px; padding: 2px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.1;
    border: var(--bw) solid var(--edge-strong); border-radius: var(--r-sm); font-size: var(--fs-xs); font-weight: 700; cursor: pointer; user-select: none; -webkit-user-select: none; color: var(--ink);
  }
  .widget-week-planner .wp-chip small { font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }
  .widget-week-planner .wp-moderate { background: var(--green-soft); }
  .widget-week-planner .wp-vigorous { background: var(--orange-soft); }
  .widget-week-planner .wp-other { background: var(--violet-soft); }
  .widget-week-planner .wp-palette { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-week-planner .wp-add {
    min-height: 42px; padding: 0.3rem 0.7rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.15;
    border: var(--bw) solid var(--edge-strong); border-radius: var(--r); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; user-select: none; -webkit-user-select: none; color: var(--ink);
  }
  .widget-week-planner .wp-add small { font-weight: 600; font-size: var(--fs-xs); color: var(--ink-2); }
  .widget-week-planner .wp-head:focus-visible, .widget-week-planner .wp-chip:focus-visible, .widget-week-planner .wp-add:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-week-planner.is-readonly .wp-head, .widget-week-planner.is-readonly .wp-chip, .widget-week-planner.is-readonly .wp-add { cursor: default; }
  .widget-week-planner .wp-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 1.4em; text-wrap: balance; }
  .widget-week-planner .wp-total { text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); line-height: 1.2; }
  .widget-week-planner .wp-total b { font-family: var(--font-mono); font-size: var(--fs-lg); font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums; }
  .widget-week-planner .wp-pips { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px var(--s4); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-week-planner .wp-pip { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .widget-week-planner .wp-pip svg { flex: none; }
`);

const kindClass = (a) => (a.kind === 'moderate' ? 'wp-moderate' : a.kind === 'vigorous' ? 'wp-vigorous' : 'wp-other');
function kindWords(a) {
  const parts = [];
  if (a.kind) parts.push(a.kind);
  if (a.strength) parts.push('strength');
  if (a.balance) parts.push('balance');
  return parts.join(' + ');
}

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const activities = (Array.isArray(spec.activities) && spec.activities.length ? spec.activities : DEFAULT_ACTIVITIES).map((a) => ({ ...a }));
  const byId = new Map(activities.map((a) => [a.id, a]));
  const free = DAYS.map((_, d) => (Array.isArray(spec.free) && Number.isFinite(spec.free[d]) ? Math.max(0, spec.free[d]) : 60));
  const need = { minutes: 150, strengthDays: 2, balanceDays: 0, ...(spec.need || {}) };
  let readOnly = !!env.readOnly;
  let picked = Math.max(0, free.findIndex((m) => m > 0));

  /** Keep only known activities that fit into each day's free time, in order. */
  function fit(raw) {
    return DAYS.map((_, d) => {
      const out = [];
      let used = 0;
      for (const id of (raw && raw[d]) || []) {
        const a = byId.get(id);
        if (a && used + a.minutes <= free[d]) { out.push(id); used += a.minutes; }
      }
      return out;
    });
  }
  let plan = fit(spec.plan);
  const sums = () => tally(plan, activities, need);

  const label = spec.alt || 'A week of activity measured against the WHO recommendations';
  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, label });
  const { svg } = fr;

  /* ----------------------------------------------------------------- gauge */
  const bx = (m) => BAR0 + (clamp(m, 0, SCALE) / SCALE) * (BAR1 - BAR0);
  svg.appendChild(s('rect', { x: BAR0, y: 6, width: BAR1 - BAR0, height: 20, rx: 10, fill: 'var(--sunken)', stroke: 'var(--edge)', 'stroke-width': 2 }));
  svg.appendChild(s('rect', { x: bx(need.minutes), y: 6, width: bx(2 * need.minutes) - bx(need.minutes), height: 20, fill: hue('green', 'soft'), stroke: hue('green'), 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
  const fill = s('rect', { x: BAR0, y: 9, height: 14, rx: 7, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2 });
  svg.appendChild(fill);
  for (const m of [0, need.minutes, 2 * need.minutes]) svg.appendChild(s('text.tick-label', { x: bx(m), y: 43, 'text-anchor': m === 0 ? 'start' : 'middle' }, String(m)));
  svg.appendChild(s('text.tick-label', { x: (bx(need.minutes) + bx(2 * need.minutes)) / 2, y: 43, 'text-anchor': 'middle' }, 'WHO range'));
  // the score in words, as ordinary text so that it stays readable on a phone
  const total = h('div.wp-total');
  const pipRow = h('div.wp-pips');
  if (!env.compact) { fr.el.insertBefore(total, fr.canvas); fr.el.insertBefore(pipRow, fr.readouts); }

  /* ------------------------------------------------------------------ days */
  const note = h('p.wp-note', { 'aria-live': 'polite' });
  const grid = h('div.wp-days', { role: 'group', 'aria-label': 'The week' });
  const palette = h('div.wp-palette', { role: 'group', 'aria-label': 'Activities to place on the chosen day' });
  if (!env.compact) fr.el.insertBefore(grid, fr.readouts);
  if (!isStatic) fr.el.insertBefore(palette, fr.readouts);
  if (!env.compact) fr.el.appendChild(note);
  let clearBtn = null;
  if (!isStatic) {
    clearBtn = button('Clear the week', () => { if (readOnly) return; plan = DAYS.map(() => []); message = ''; changed(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(clearBtn);
  }
  let message = '';

  const press = (el, fn) => {
    el.dataset.keys = 'own';
    el.addEventListener('click', fn);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(); } });
  };
  const changed = () => { render(); env.onChange(getState()); };

  function add(id) {
    if (readOnly) return;
    const a = byId.get(id);
    const t = sums();
    const left = free[picked] - t.used[picked];
    if (a.minutes > left) {
      message = left > 0 ? `${DAY_NAMES[picked]} has only ${left} minutes left: ${a.label.toLowerCase()} takes ${a.minutes}.` : `${DAY_NAMES[picked]} has no free time left. Pick another day.`;
      note.textContent = message;
      env.announce(message);
      return;
    }
    plan[picked] = [...plan[picked], id];
    message = '';
    play('drop');
    changed();
  }
  function remove(d, i) {
    if (readOnly) return;
    plan[d] = plan[d].filter((_, k) => k !== i);
    message = '';
    play('tap');
    changed();
  }

  if (!isStatic) {
    for (const a of activities) {
      const el = h('div', { class: cx('wp-add', kindClass(a)), role: 'button', tabindex: '0', 'aria-label': `Add ${a.label}, ${a.minutes} minutes, ${kindWords(a)}` }, a.label, h('small', `${a.minutes} min · ${kindWords(a)}`));
      press(el, () => add(a.id));
      palette.appendChild(el);
    }
  }

  /* ---------------------------------------------------------------- render */
  function pips(title, have, want, color) {
    const row = h('span.wp-pip', `${title} `);
    for (let i = 0; i < Math.max(want, have); i++) {
      const on = i < have;
      const dot = s('svg', { viewBox: '0 0 18 18', width: 18, height: 18, 'aria-hidden': 'true' },
        s('circle', { cx: 9, cy: 9, r: 7, fill: on ? hue(color) : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': i >= want ? '2 3' : null }),
        on ? s('path', { d: 'M5.5 9 l2.5 3 l4.5 -6', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) : null);
      row.appendChild(dot);
    }
    row.appendChild(h('span', ` ${have} of ${want}`));
    return row;
  }

  function render() {
    const t = sums();
    total.replaceChildren(h('b', String(t.equivalent)), ` moderate-equivalent minutes${t.vigorous ? ` (${t.moderate} + 2 × ${t.vigorous})` : ''}`);
    fill.setAttribute('width', Math.max(0, bx(t.equivalent) - BAR0));
    fill.setAttribute('visibility', t.equivalent > 0 ? 'visible' : 'hidden');
    fill.setAttribute('fill', t.meetsAerobic ? hue('green') : hue('blue'));
    pipRow.replaceChildren(pips('Strength days', t.strengthDays, need.strengthDays, 'violet'));
    if (need.balanceDays > 0) pipRow.appendChild(pips('Balance days', t.balanceDays, need.balanceDays, 'teal'));

    grid.replaceChildren();
    DAYS.forEach((name, d) => {
      const left = free[d] - t.used[d];
      const head = h('div.wp-head', { role: isStatic ? null : 'button', tabindex: isStatic || readOnly ? null : '0', 'aria-pressed': isStatic ? null : String(d === picked), 'aria-label': `${DAY_NAMES[d]}: ${free[d] ? `${left} of ${free[d]} minutes free` : 'no free time'}` }, name, h('small', free[d] ? `${left} min free` : 'no time'));
      if (!isStatic) press(head, () => { if (readOnly) return; picked = d; message = ''; play('select'); render(); });
      const card = h('div', { class: cx('wp-day', !isStatic && d === picked && 'is-picked') }, head);
      plan[d].forEach((id, i) => {
        const a = byId.get(id);
        const chip = h('div', { class: cx('wp-chip', kindClass(a)), role: isStatic ? null : 'button', tabindex: isStatic || readOnly ? null : '0', 'aria-label': isStatic ? null : `Remove ${a.label} from ${DAY_NAMES[d]}` }, a.label, h('small', `${a.minutes} min`));
        if (!isStatic) press(chip, () => remove(d, i));
        card.appendChild(chip);
      });
      grid.appendChild(card);
    });
    if (clearBtn) clearBtn.disabled = readOnly || t.count === 0;
    const missing = [
      t.meetsAerobic ? null : `${need.minutes - t.equivalent} more moderate-equivalent minutes`,
      t.meetsStrength ? null : `${need.strengthDays - t.strengthDays} more strength day${need.strengthDays - t.strengthDays === 1 ? '' : 's'}`,
      t.meetsBalance ? null : `${need.balanceDays - t.balanceDays} more balance day${need.balanceDays - t.balanceDays === 1 ? '' : 's'}`,
    ].filter(Boolean);
    note.textContent = message || (isStatic ? '' : missing.length ? `Still to find: ${missing.join(', ')}.` : 'This week meets every part of the recommendation.');
    svg.setAttribute('aria-label', `${label}. ${t.equivalent} moderate-equivalent minutes planned, against a recommended ${need.minutes} to ${2 * need.minutes}. Strength on ${t.strengthDays} of ${need.strengthDays} days.${need.balanceDays ? ` Balance on ${t.balanceDays} of ${need.balanceDays} days.` : ''}`);
  }

  const getState = () => ({ plan: plan.map((day) => day.slice()), ...sums() });

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.plan)) return;
      plan = fit(next.plan);
      message = '';
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const el of palette.children) el.setAttribute('tabindex', readOnly ? '-1' : '0');
      render();
    },
  };
}

export const examples = [
  { title: 'week-planner — an empty week', spec: { type: 'week-planner', free: [30, 30, 0, 45, 30, 90, 60] } },
  { title: 'week-planner — a week that meets the recommendation', spec: { type: 'week-planner', free: [30, 30, 0, 45, 30, 90, 60], plan: [['walk'], ['strength'], [], ['walk'], ['run'], ['cycle', 'strength'], ['walk']] } },
  {
    title: 'week-planner — for someone over 65, with balance days',
    spec: {
      type: 'week-planner', free: [60, 60, 60, 60, 60, 60, 60], need: { minutes: 150, strengthDays: 2, balanceDays: 3 },
      activities: [{ id: 'walk', label: 'Brisk walk', minutes: 30, kind: 'moderate' }, { id: 'taichi', label: 'Tai chi', minutes: 30, balance: true, strength: true }, { id: 'garden', label: 'Digging the garden', minutes: 30, kind: 'moderate', strength: true }],
    },
  },
];
