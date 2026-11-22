/**
 * acid-day — a day in the life of a tooth. The curve is the acidity (pH) at
 * the tooth surface: every time something sugary is eaten or drunk, the
 * bacteria in dental plaque turn the sugar into acid within minutes, and it
 * takes saliva the better part of an hour to bring things back to neutral.
 * Below a critical pH the enamel loses minerals. The meals are fixed; the
 * learner drags the sugary snacks and drinks along the day and sees how many
 * separate "acid attacks" result and how long the teeth spend under attack.
 *
 * {
 *   type: 'acid-day',
 *   from: 7, to: 23,                     // the hours shown (24-hour clock)
 *   meals: [8, 13, 19],                  // mealtimes, fixed
 *   snacks: [10, 11.5, 15, 17, 21],      // sugary snacks and drinks: draggable
 *   snap: 0.5,                           // hours
 *   critical: 5.5,                       // pH below which enamel starts to dissolve
 *   static: false,                       // true: a picture
 * }
 *
 * State: { snacks, attacks, minutes, withMeals, between }
 *   snacks    — their times, sorted (hours)
 *   attacks   — separate spells below the critical pH during the day
 *   minutes   — total minutes below it (whole minutes)
 *   withMeals — snacks that share a time with a meal · between — the others
 *
 * setState accepts { snacks: [hours] }.
 *
 * The model (a simplified Stephan curve): resting pH 7. Everything eaten at one time counts as one sitting.
 * A sitting drops the pH in a straight line to 4.6 within 5 minutes, and it then recovers as
 * 7 − 2.4·exp(−(t − 5)/τ), with τ = 45 minutes for one item and 20% longer for each further item eaten at
 * the same sitting. Overlapping sittings: the lower pH wins. Real mouths differ (saliva flow, the food's
 * stickiness, fluoride, the plaque itself); the shape of the curve is the well-established part.
 */
import { frame, plane, handle, readout, hue, s, h, clamp, snapTo, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 318;
const REST = 7;
const DEPTH = 2.4;
const DROP_MIN = 5;
const TAU = 45;
const LANE_MEAL = 222;
const LANE_SNACK = 252;
const STACK = 13;

addStyles('acid-day', `
  .widget-acid-day .ad-note { min-height: 1.4em; margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); }
`);

/** pH at `minute` (minutes after midnight) for sittings [{ at: minutes, items }]. */
export function phAt(minute, sittings) {
  let ph = REST;
  for (const sit of sittings) {
    const dt = minute - sit.at;
    if (dt <= 0) continue;
    const v = dt < DROP_MIN ? REST - DEPTH * (dt / DROP_MIN) : REST - DEPTH * Math.exp(-(dt - DROP_MIN) / (TAU * (1 + 0.2 * (sit.items - 1))));
    if (v < ph) ph = v;
  }
  return ph;
}

/** Group meal and snack times (hours) into sittings, and count the attacks and the minutes below `critical`. */
export function acidDay(meals, snacks, critical = 5.5) {
  const byTime = new Map();
  for (const t of [...meals, ...snacks]) { const at = Math.round(t * 60); byTime.set(at, (byTime.get(at) || 0) + 1); }
  const sittings = [...byTime].map(([at, items]) => ({ at, items })).sort((a, b) => a.at - b.at);
  let minutes = 0;
  let attacks = 0;
  let below = false;
  const end = (sittings.length ? sittings[sittings.length - 1].at : 0) + 6 * 60;
  for (let m = sittings.length ? sittings[0].at : 0; m <= end; m++) {
    const now = phAt(m + 0.5, sittings) < critical;
    if (now) { minutes++; if (!below) attacks++; }
    below = now;
  }
  const mealSet = new Set(meals.map((t) => Math.round(t * 60)));
  const withMeals = snacks.filter((t) => mealSet.has(Math.round(t * 60))).length;
  return { sittings, attacks, minutes, withMeals, between: snacks.length - withMeals };
}

const clockText = (hours) => `${Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`;

export default function create(spec, env) {
  const from = spec.from != null ? spec.from : 7;
  const to = spec.to != null ? spec.to : 23;
  const snap = spec.snap || 0.5;
  const critical = spec.critical || 5.5;
  const meals = (Array.isArray(spec.meals) ? spec.meals : [8, 13, 19]).slice();
  const lo = from + snap;
  const hi = to - 1;
  let snacks = (Array.isArray(spec.snacks) ? spec.snacks : [10, 11.5, 15, 17, 21]).map((t) => clamp(snapTo(t, snap), lo, hi));
  const isStatic = !!spec.static || !!env.compact;
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Acidity at the tooth surface through a day' });
  const { svg } = fr;
  const pl = plane({ x: [from, to], y: [4, 7.5], width: W, height: 208, pad: { l: 62, r: 14, t: 22, b: 22 } });

  // axes
  for (const v of [4, 5, 6, 7]) {
    svg.appendChild(s('line.grid-line', { x1: pl.left, x2: pl.right, y1: pl.sy(v), y2: pl.sy(v) }));
    svg.appendChild(s('text.tick-label', { x: pl.left - 7, y: pl.sy(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  svg.appendChild(s('text.axis-label', { x: pl.left + 6, y: 14 }, 'pH at the tooth surface'));
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.left, y1: pl.top, y2: pl.bottom }));
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.right, y1: pl.bottom, y2: pl.bottom }));
  for (let t = Math.ceil(from / 2) * 2; t <= to; t += 2) {
    svg.appendChild(s('line', { x1: pl.sx(t), x2: pl.sx(t), y1: pl.bottom, y2: pl.bottom + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x: pl.sx(t), y: pl.bottom + 18, 'text-anchor': 'middle' }, `${t}:00`));
  }
  const danger = s('path', { fill: hue('red'), opacity: 0.85, stroke: 'none' });
  const curve = s('path', { fill: 'none', stroke: hue('teal'), 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  svg.append(danger, curve);
  svg.appendChild(s('line', { x1: pl.left, x2: pl.right, y1: pl.sy(critical), y2: pl.sy(critical), stroke: hue('red'), 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
  svg.appendChild(s('text.fig-label-sm.text-red', { x: pl.right - 4, y: pl.sy(4.22), 'text-anchor': 'end' }, `red: below pH ${critical}, enamel dissolves`));

  // the two lanes under the chart
  svg.appendChild(s('text.tick-label', { x: pl.left - 7, y: LANE_MEAL + 4, 'text-anchor': 'end' }, 'meals'));
  svg.appendChild(s('text.tick-label', { x: pl.left - 7, y: LANE_SNACK + 4, 'text-anchor': 'end' }, 'sugar'));
  svg.appendChild(s('line', { x1: pl.left, x2: pl.right, y1: LANE_SNACK, y2: LANE_SNACK, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '2 6' }));
  for (const t of meals) {
    svg.appendChild(s('rect', { x: pl.sx(t) - 9, y: LANE_MEAL - 9, width: 18, height: 18, rx: 4, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    svg.appendChild(s('line', { x1: pl.sx(t), x2: pl.sx(t), y1: LANE_MEAL + 10, y2: LANE_SNACK + 4 * STACK, stroke: 'var(--hair)', 'stroke-width': 1.5 }));
  }

  const roAttacks = readout('acid attacks', { digits: 0, color: 'red' });
  const roMinutes = readout('time under attack', { digits: 0, color: 'red', unit: 'min' });
  const note = h('p.ad-note', { 'aria-live': 'polite' });
  const handles = [];

  const result = () => acidDay(meals, snacks, critical);

  function getState() {
    const res = result();
    return { snacks: snacks.slice().sort((a, b) => a - b).map((t) => tidy(t, 3)), attacks: res.attacks, minutes: res.minutes, withMeals: res.withMeals, between: res.between };
  }

  function render() {
    const res = result();
    let d = '';
    let area = '';
    let open = false;
    const yc = pl.sy(critical);
    for (let m = from * 60; m <= to * 60; m += 1) {
      const ph = phAt(m, res.sittings);
      const x = pl.sx(m / 60).toFixed(1);
      const y = pl.sy(ph).toFixed(1);
      d += `${m === from * 60 ? 'M' : 'L'}${x} ${y}`;
      if (ph < critical) { area += open ? `L${x} ${y}` : `M${x} ${yc.toFixed(1)}L${x} ${y}`; open = true; }
      else if (open) { area += `L${x} ${yc.toFixed(1)}Z`; open = false; }
    }
    if (open) area += `L${pl.right} ${yc.toFixed(1)}Z`;
    curve.setAttribute('d', d);
    danger.setAttribute('d', area);
    // stack snacks that share a time
    const seen = new Map();
    snacks.forEach((t, i) => {
      const key = Math.round(t * 60);
      const level = seen.get(key) || 0;
      seen.set(key, level + 1);
      if (handles[i]) {
        handles[i].set(pl.sx(t), LANE_SNACK + level * STACK);
        handles[i].setLabel(`sugary snack ${i + 1} at ${clockText(t)}${meals.some((mt) => Math.round(mt * 60) === key) ? ', with a meal' : ''}`);
      } else if (isStatic) {
        marks[i].setAttribute('cx', pl.sx(t));
        marks[i].setAttribute('cy', LANE_SNACK + level * STACK);
      }
    });
    roAttacks.set(res.attacks);
    roMinutes.set(res.minutes);
    note.textContent = res.between
      ? `${res.between} of the ${snacks.length} sugary snacks fall between meals.`
      : snacks.length ? 'Every sugary snack now comes with a meal.' : '';
    svg.setAttribute('aria-label', `${spec.alt || 'Acidity at the tooth surface through a day'}. ${res.attacks} acid attacks, ${res.minutes} minutes below pH ${critical}.`);
  }

  const marks = [];
  snacks.forEach((t, i) => {
    if (isStatic) {
      const c = s('circle', { r: 8, fill: hue('pink'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
      marks.push(c);
      svg.appendChild(c);
      return;
    }
    const hd = handle(svg, {
      x: pl.sx(t), y: LANE_SNACK, r: 9, color: 'pink', label: `Sugary snack ${i + 1}`, keyStep: pl.kx * snap,
      onMove(x) {
        if (readOnly) return;
        const next = clamp(snapTo(pl.ux(x), snap), lo, hi);
        if (next === snacks[i]) return;
        snacks[i] = next;
        play('tick');
        render();
      },
      onEnd() { if (!readOnly) env.onChange(getState()); },
    });
    handles.push(hd);
    svg.appendChild(hd.el);
  });

  if (!env.compact) {
    fr.readouts.append(roAttacks.el, roMinutes.el);
    fr.el.appendChild(note);
  }
  render();
  if (readOnly) { fr.el.classList.add('is-readonly'); handles.forEach((hd) => hd.setEnabled(false)); }

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.snacks)) return;
      next.snacks.slice(0, snacks.length).forEach((t, i) => { snacks[i] = clamp(snapTo(t, snap), lo, hi); });
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      handles.forEach((hd) => hd.setEnabled(!readOnly));
    },
    destroy() { handles.forEach((hd) => hd.destroy()); },
  };
}

export const examples = [
  { title: 'acid-day — snacks spread through the day', spec: { type: 'acid-day' } },
  { title: 'acid-day — the same snacks, with meals (picture)', spec: { type: 'acid-day', snacks: [8, 8, 13, 13, 19], static: true } },
];
