/**
 * fuel-mix — where the muscles' energy comes from, as effort and time change. The learner picks
 * how hard a person is working (from rest to an all-out sprint) and how long they have been at it
 * (from five seconds to three hours). A bar shows which of four supply routes is paying for the
 * work at that moment, and two gauges show the body's sugar store and fat store running down.
 *
 * {
 *   type: 'fuel-mix',
 *   effort: 0,          // 0 rest · 1 easy walk · 2 steady jog · 3 hard run · 4 all-out sprint
 *   stop: 3,            // time since the start: an index into TIMES (0 = 5 seconds … 7 = 3 hours)
 *   gauges: true,       // show the two store gauges
 *   static: false,
 * }
 *
 * State: { effort, effortName, stop, time, seconds, mix, main, withOxygen, glycogenLeft, fatLeft, sustainable, visited }
 *   mix          { ready, noOxygen, sugar, fat } per cent of the energy supplied by each route right now (they add up to 100):
 *                  ready     the store that is ready in the muscle (ATP and phosphocreatine)
 *                  noOxygen  sugar split without oxygen (anaerobic; makes lactate)
 *                  sugar     sugar burned with oxygen
 *                  fat       fat burned with oxygen
 *   main         the route with the largest share: 'ready' | 'noOxygen' | 'sugar' | 'fat'
 *   withOxygen   sugar + fat: the share supplied with oxygen
 *   glycogenLeft per cent of the sugar store (glycogen) still there;  fatLeft — per cent of the fat store still there
 *   sustainable  false when nobody could keep this effort up for this long (an all-out sprint beyond about two
 *                minutes; a hard run once the sugar store is empty). The mix shown is then what the effort has fallen back to.
 *   visited      how many different settings the learner has looked at
 *
 * setState accepts { effort, stop }.
 *
 * The model is a table of rounded teaching values, not a measurement of any one person. Its shape follows
 * exercise physiology: the ready store pays for the first seconds and is spent in about ten; splitting
 * sugar without oxygen peaks within the first minute of a very hard effort (Gastin, Sports Medicine 2001:
 * a 30-second all-out effort is about three-quarters anaerobic, a 2-minute one about two-thirds aerobic);
 * with oxygen, fat supplies most of the energy at rest and at easy efforts and sugar takes over as effort
 * rises (the "crossover", Brooks & Mercier 1994); during long steady work the share of fat creeps up as the
 * sugar store runs down. Stores: about 1,600 kcal of glycogen within reach of working muscles and the liver
 * (out of roughly 2,000 kcal in the whole body), against about 100,000 kcal of fat in a lean adult. Real
 * mixes vary with fitness, the last meal, and from person to person.
 */
import { frame, sliderRow, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

export const EFFORTS = [
  { name: 'at rest', kcalMin: 1.2 },
  { name: 'easy walk', kcalMin: 4 },
  { name: 'steady jog', kcalMin: 8 },
  { name: 'hard run', kcalMin: 13 },
  { name: 'all-out sprint', kcalMin: 25 },
];
export const TIMES = [
  { label: '5 seconds', seconds: 5 }, { label: '30 seconds', seconds: 30 }, { label: '2 minutes', seconds: 120 },
  { label: '10 minutes', seconds: 600 }, { label: '30 minutes', seconds: 1800 }, { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 }, { label: '3 hours', seconds: 10800 },
];
export const ROUTES = {
  ready: { name: 'ready store', color: 'violet' },
  noOxygen: { name: 'sugar without oxygen', color: 'orange' },
  sugar: { name: 'sugar with oxygen', color: 'yellow' },
  fat: { name: 'fat with oxygen', color: 'teal' },
};
const KEYS = Object.keys(ROUTES);

// MIX[effort][stop] = [ready, noOxygen, sugar, fat] in per cent
export const MIX = [
  [[0, 0, 40, 60], [0, 0, 40, 60], [0, 0, 40, 60], [0, 0, 40, 60], [0, 0, 40, 60], [0, 0, 40, 60], [0, 0, 40, 60], [0, 0, 40, 60]],
  [[40, 10, 20, 30], [10, 5, 30, 55], [0, 0, 35, 65], [0, 0, 35, 65], [0, 0, 35, 65], [0, 0, 30, 70], [0, 0, 30, 70], [0, 0, 25, 75]],
  [[50, 15, 20, 15], [15, 15, 40, 30], [0, 5, 50, 45], [0, 0, 55, 45], [0, 0, 45, 55], [0, 0, 40, 60], [0, 0, 35, 65], [0, 0, 30, 70]],
  [[50, 30, 15, 5], [15, 35, 40, 10], [0, 20, 65, 15], [0, 10, 70, 20], [0, 5, 70, 25], [0, 5, 65, 30], [0, 5, 60, 35], [0, 0, 25, 75]],
  [[50, 45, 5, 0], [10, 55, 35, 0], [0, 30, 65, 5], [0, 10, 70, 20], [0, 5, 70, 25], [0, 5, 65, 30], [0, 5, 60, 35], [0, 0, 25, 75]],
];
const GLYCOGEN_KCAL = 1600;
const FAT_KCAL = 100000;

/** Energy drawn from each store (kcal) from the start up to a given stop, at one effort. */
function used(effort, stop) {
  // an all-out sprint cannot be held: after two minutes the person is, at best, running hard
  const rateAt = (i) => EFFORTS[effort === 4 && i > 2 ? 3 : effort].kcalMin;
  let sugar = 0;
  let fat = 0;
  let t0 = 0;
  for (let i = 0; i <= stop; i++) {
    // between two clock settings the mix of the earlier one applies
    const minutes = (TIMES[i].seconds - t0) / 60;
    const j = Math.max(0, i - 1);
    const m = MIX[effort][j];
    sugar += rateAt(j) * minutes * ((m[1] + m[2]) / 100);
    fat += rateAt(j) * minutes * (m[3] / 100);
    t0 = TIMES[i].seconds;
  }
  return { sugar, fat };
}

/** Everything the model says about one setting. */
export function fuelAt(effort, stop) {
  const e = clamp(Math.round(effort), 0, EFFORTS.length - 1);
  const i = clamp(Math.round(stop), 0, TIMES.length - 1);
  const m = MIX[e][i];
  const mix = { ready: m[0], noOxygen: m[1], sugar: m[2], fat: m[3] };
  const main = KEYS.reduce((best, k) => (mix[k] > mix[best] ? k : best), KEYS[0]);
  const u = used(e, i);
  const glycogenLeft = Math.max(0, Math.round(100 - (u.sugar / GLYCOGEN_KCAL) * 100));
  const fatLeft = Math.max(0, Math.round((100 - (u.fat / FAT_KCAL) * 100) * 10) / 10);
  const sustainable = !((e === 4 && i > 2) || (e === 3 && i === 7));
  return { effort: e, effortName: EFFORTS[e].name, stop: i, time: TIMES[i].label, seconds: TIMES[i].seconds, mix, main, withOxygen: mix.sugar + mix.fat, glycogenLeft, fatLeft, sustainable };
}

/** A sentence about what is going on at this setting. */
export function fuelNote(f) {
  if (!f.sustainable) {
    return f.effort === 4
      ? 'Nobody can hold an all-out sprint this long. The fast routes are spent within a minute or two, and the pace falls back to what oxygen can supply.'
      : 'The sugar store is nearly empty. Runners call this "hitting the wall": the pace has to drop, because fat alone cannot supply energy this fast.';
  }
  if (f.effort === 0) return 'At rest, all the energy comes from burning fuel with oxygen, and more than half of that fuel is fat.';
  if (f.main === 'ready') return 'The first seconds are paid for from a small store that is ready in the muscle. It is spent in about ten seconds.';
  if (f.main === 'noOxygen') return 'The ready store is spent, and oxygen cannot yet be delivered this fast: the muscles split sugar without oxygen. It is quick but wasteful, and it makes lactate.';
  if (f.main === 'sugar') return f.mix.noOxygen >= 15
    ? 'Oxygen delivery is catching up. Burning sugar with oxygen now supplies most of the energy, with the no-oxygen route still helping.'
    : 'Oxygen delivery has caught up. At this effort most of the energy comes from burning sugar with oxygen.';
  return f.stop >= 5 && f.effort >= 2
    ? 'As the sugar store runs down, fat takes over more of the work.'
    : 'With plenty of oxygen and a modest demand, fat supplies most of the energy.';
}

const W = 560;
const H = 250;
const X0 = 20;
const X1 = 540;

addStyles('fuel-mix', `
  .widget-fuel-mix .fm-pct { font-family: var(--font-mono); font-size: 14px; font-weight: 700; fill: #1D1B26; }
  .widget-fuel-mix .fm-key { font-size: 12.5px; font-weight: 700; fill: var(--ink); }
  .widget-fuel-mix .fm-head { font-size: 13px; font-weight: 800; fill: var(--ink-2); }
  .widget-fuel-mix .fm-note { min-height: 3.6em; }
  @container wcanvas (max-width: 470px) {
    .widget-fuel-mix .fm-pct { font-size: 18px; }
    .widget-fuel-mix .fm-key { font-size: 16px; }
    .widget-fuel-mix .fm-head { font-size: 16px; }
  }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const showGauges = spec.gauges !== false;
  let effort = clamp(Math.round(spec.effort || 0), 0, EFFORTS.length - 1);
  let stop = clamp(Math.round(spec.stop != null ? spec.stop : 3), 0, TIMES.length - 1);
  let readOnly = !!env.readOnly;
  const visited = new Set([`${effort}|${stop}`]);

  const fr = frame({ width: W, height: showGauges ? H : 150, compact: env.compact, label: spec.alt || 'Where the energy for muscle work comes from' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const note = h('p.w-hint.fm-note', { 'aria-live': 'polite' });
  const getState = () => ({ ...fuelAt(effort, stop), visited: visited.size });

  function render() {
    const f = fuelAt(effort, stop);
    g.replaceChildren();
    g.appendChild(s('text.fm-head', { x: X0, y: 20 }, `Energy supply after ${f.time}: ${f.effortName}`));
    // the stacked bar
    g.appendChild(s('rect', { x: X0, y: 30, width: X1 - X0, height: 44, rx: 12, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    let x = X0;
    const clip = `fm-clip-${uid()}`;
    const defs = s('defs');
    defs.appendChild(s('clipPath', { id: clip }, s('rect', { x: X0 + 1.5, y: 31.5, width: X1 - X0 - 3, height: 41, rx: 10.5 })));
    g.appendChild(defs);
    const segs = s('g', { 'clip-path': `url(#${clip})`, opacity: f.sustainable ? 1 : 0.55 });
    g.appendChild(segs);
    for (const k of KEYS) {
      const w = ((X1 - X0) * f.mix[k]) / 100;
      if (w <= 0) continue;
      segs.appendChild(s('rect', { x, y: 30, width: w, height: 44, fill: hue(ROUTES[k].color), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      if (w > 44) segs.appendChild(s('text.fm-pct', { x: x + w / 2, y: 57, 'text-anchor': 'middle' }, `${f.mix[k]}%`));
      x += w;
    }
    // the key: two columns
    KEYS.forEach((k, i) => {
      const kx = X0 + (i % 2) * 270;
      const ky = 98 + Math.floor(i / 2) * 24;
      g.appendChild(s('rect', { x: kx, y: ky - 12, width: 16, height: 16, rx: 4, fill: hue(ROUTES[k].color), stroke: 'var(--ink)', 'stroke-width': 2 }));
      g.appendChild(s('text.fm-key', { x: kx + 24, y: ky + 1 }, `${ROUTES[k].name}: ${f.mix[k]}%`));
    });
    if (showGauges) {
      const gauge = (y, label, pct, color, text) => {
        g.appendChild(s('text.fm-head', { x: X0, y }, label));
        g.appendChild(s('rect', { x: X0, y: y + 8, width: 380, height: 18, rx: 7, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2 }));
        g.appendChild(s('rect', { x: X0 + 2, y: y + 10, width: Math.max(0, (376 * pct) / 100), height: 14, rx: 5, fill: hue(color) }));
        g.appendChild(s('text.fm-key', { x: X0 + 392, y: y + 22 }, text));
      };
      gauge(158, 'sugar store (glycogen): about 1,600 kcal within reach', f.glycogenLeft, 'yellow', `${f.glycogenLeft}% left`);
      gauge(206, 'fat store: about 100,000 kcal', f.fatLeft, 'teal', `${f.fatLeft >= 99.95 ? '100' : f.fatLeft.toFixed(1)}% left`);
    }
    note.textContent = fuelNote(f);
    const parts = KEYS.filter((k) => f.mix[k] > 0).map((k) => `${ROUTES[k].name} ${f.mix[k]} per cent`).join(', ');
    svg.setAttribute('aria-label', `${spec.alt || 'Where the energy for muscle work comes from'}. ${f.effortName}, after ${f.time}: ${parts}. Sugar store ${f.glycogenLeft} per cent left, fat store ${f.fatLeft} per cent left. ${fuelNote(f)}`);
  }

  let eRow = null;
  let tRow = null;
  const moved = () => { visited.add(`${effort}|${stop}`); play('tick'); render(); env.onChange(getState()); };
  if (!isStatic) {
    eRow = sliderRow({ label: 'effort', min: 0, max: EFFORTS.length - 1, step: 1, value: effort, color: 'red', format: (v) => EFFORTS[v].name, onInput: (v) => { if (readOnly) return; effort = v; eRow.input.setAttribute('aria-valuetext', EFFORTS[v].name); moved(); } });
    tRow = sliderRow({ label: 'time since the start', min: 0, max: TIMES.length - 1, step: 1, value: stop, color: 'blue', format: (v) => TIMES[v].label, onInput: (v) => { if (readOnly) return; stop = v; tRow.input.setAttribute('aria-valuetext', TIMES[v].label); moved(); } });
    eRow.input.setAttribute('aria-valuetext', EFFORTS[effort].name);
    tRow.input.setAttribute('aria-valuetext', TIMES[stop].label);
    fr.controls.append(eRow.el, tRow.el);
  }
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.effort === 'number') effort = clamp(Math.round(next.effort), 0, EFFORTS.length - 1);
      if (typeof next.stop === 'number') stop = clamp(Math.round(next.stop), 0, TIMES.length - 1);
      visited.add(`${effort}|${stop}`);
      if (typeof next.visited === 'number') for (let i = 0; visited.size < next.visited && i < 40; i++) visited.add(`${i % 5}|${Math.floor(i / 5)}`);
      if (eRow) { eRow.set(effort); eRow.input.setAttribute('aria-valuetext', EFFORTS[effort].name); }
      if (tRow) { tRow.set(stop); tRow.input.setAttribute('aria-valuetext', TIMES[stop].label); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (eRow) eRow.setDisabled(readOnly);
      if (tRow) tRow.setDisabled(readOnly);
    },
  };
}

let seq = 0;
function uid() { seq += 1; return seq; }

export const examples = [
  { title: 'fuel-mix — which route pays for the work?', spec: { type: 'fuel-mix', effort: 2, stop: 3 } },
  { title: 'fuel-mix — thirty seconds flat out', spec: { type: 'fuel-mix', effort: 4, stop: 1, static: true } },
];
