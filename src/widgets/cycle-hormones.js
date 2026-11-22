/**
 * cycle-hormones — one menstrual cycle on a time line: the four hormones that
 * run it (FSH, oestrogen, LH, progesterone), the lining of the uterus below
 * them, and the day the egg is released. The learner moves a day marker through
 * the cycle and, where the spec allows, changes the cycle's length: the first
 * part of the cycle stretches or shrinks, while the part after ovulation stays
 * about fourteen days. An optional band marks the fertile window.
 *
 * {
 *   type: 'cycle-hormones',
 *   length: 28,                 // days in this cycle (21 to 35)
 *   lengthRange: [21, 35, 1],   // slider [min, max, step]; null: fixed length
 *   day: 1,                     // where the day marker starts
 *   fertile: false,             // shade the fertile window (the day of ovulation and the five days before it)
 *   hormones: true,             // false: only the lining, the egg and the fertile window (no hormone curves)
 *   static: false,
 * }
 *
 * State: { length, day, ovulation, phase, top, inWindow, windowFrom, windowTo, phases, lengths }
 *   ovulation   the day the egg is released: length − 14
 *   phase       where the marker is: 'period' (days 1–5) | 'before' (egg ripening, up to the day before ovulation)
 *               | 'ovulation' | 'after' (from the day after ovulation to the end)
 *   top         the hormone that is highest, relative to its own peak, on the marked day: 'FSH' | 'oestrogen' | 'LH' | 'progesterone'
 *   inWindow    the marked day lies in the fertile window;  windowFrom, windowTo: its first and last day
 *   phases      every phase the marker has visited;  lengths: every cycle length that has been set
 *
 * setState({ day, length, lengths }).
 *
 * The curves (hormoneLevels, exported) are the textbook pattern of an ovulating cycle, each hormone drawn relative
 * to its own peak. Real cycles vary from person to person and month to month: the time from ovulation to the next
 * period is usually between 10 and 16 days, not exactly 14; the day of ovulation cannot be read off a calendar;
 * and the fertile window drawn here is the average one (Wilcox et al., 1995).
 */
import { frame, sliderRow, readout, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

export const LUTEAL = 14;
export const PERIOD_DAYS = 5;
export const ovulationDay = (length) => length - LUTEAL;
const bump = (d, centre, width) => Math.exp(-(((d - centre) / width) ** 2));

/** Relative level (0 to 1) of each hormone on day d of a cycle of the given length. */
export function hormoneLevels(d, length) {
  const o = ovulationDay(length);
  const early = (o - 1) * 0.3 + 1;
  return {
    FSH: clamp(0.22 + 0.2 * bump(d, early, (o - 1) * 0.3) + 0.5 * bump(d, o - 1, 1.1) - 0.12 * bump(d, o + 7, 4), 0, 1),
    oestrogen: clamp(0.07 + 0.88 * bump(d, o - 1.6, 0.16 * (o - 1) + 1.2) * (1 - 0.8 / (1 + Math.exp(-(d - (o + 0.4)) / 0.6))) + 0.45 * bump(d, o + 7, 3.4), 0, 1),
    LH: clamp(0.1 + 0.88 * bump(d, o - 1, 1), 0, 1),
    progesterone: clamp(0.04 + 0.94 * bump(d, o + 7, 3.9) * (d >= o - 1 ? 1 : 0), 0, 1),
  };
}

/** Relative thickness (0 to 1) of the lining of the uterus on day d. */
export function liningThickness(d, length) {
  const o = ovulationDay(length);
  if (d <= PERIOD_DAYS) return 0.85 - 0.65 * (d / PERIOD_DAYS);
  if (d <= o) return 0.2 + 0.5 * ((d - PERIOD_DAYS) / (o - PERIOD_DAYS));
  return Math.min(1, 0.7 + 0.3 * ((d - o) / 6));
}

export function phaseOf(d, length) {
  const o = ovulationDay(length);
  return d <= PERIOD_DAYS ? 'period' : d < o ? 'before' : d === o ? 'ovulation' : 'after';
}

const W = 560;
const H = 330;
const X0 = 30;
const X1 = 540;
const HY0 = 26;
const HY1 = 176;
const LY0 = 198;      // lining strip
const LY1 = 254;
const AX = 276;       // day axis
const HORMONES = [
  ['FSH', 'teal', null],
  ['oestrogen', 'pink', null],
  ['LH', 'orange', '7 4'],
  ['progesterone', 'violet', '2 5'],
];
const PHASE_NAMES = { period: 'period: the lining is shed', before: 'an egg is ripening; the lining rebuilds', ovulation: 'ovulation: the egg is released', after: 'after ovulation: the lining is kept ready' };

addStyles('cycle-hormones', `
  .widget-cycle-hormones .ch-name { font-family: var(--font-body); font-weight: 800; font-size: 12.5px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-cycle-hormones .ch-name { font-size: 16px; } }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const range = spec.lengthRange === null ? null : (spec.lengthRange || null);
  const showHormones = spec.hormones !== false;
  const showWindow = !!spec.fertile;
  let length = clamp(Math.round(spec.length || 28), 21, 35);
  let day = clamp(Math.round(spec.day || 1), 1, length);
  let readOnly = !!env.readOnly;
  const phases = [phaseOf(day, length)];
  const lengths = [length];

  const fr = frame({ width: W, height: showHormones ? H : H - 150, compact: env.compact, label: spec.alt || 'A menstrual cycle on a time line' });
  const { svg } = fr;
  const off = showHormones ? 0 : -150;       // without the hormone graph everything below moves up
  const g = s('g');
  svg.appendChild(g);
  const dx = (d) => X0 + ((d - 0.5) / length) * (X1 - X0);
  const hy = (v) => HY1 - v * (HY1 - HY0);

  const roDay = readout('day', { digits: 0 });
  const roPhase = readout('now', { color: 'pink' });
  let dRow = null;
  let lRow = null;

  function getState() {
    const o = ovulationDay(length);
    const lv = hormoneLevels(day, length);
    const top = Object.keys(lv).reduce((a, b) => (lv[b] > lv[a] ? b : a));
    return { length, day, ovulation: o, phase: phaseOf(day, length), top, inWindow: day >= o - 5 && day <= o, windowFrom: o - 5, windowTo: o, phases: phases.slice(), lengths: lengths.slice() };
  }

  function render() {
    g.replaceChildren();
    const o = ovulationDay(length);
    const cell = (X1 - X0) / length;
    // fertile window
    if (showWindow) {
      g.appendChild(s('rect', { x: dx(o - 5) - cell / 2, y: (showHormones ? HY0 - 8 : LY0 + off - 18), width: cell * 6, height: (showHormones ? AX - HY0 + 8 : AX - LY0 + 18), fill: hue('green', 'soft'), stroke: hue('green'), 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
      g.appendChild(s('text.fig-label-sm', { x: Math.max(dx(o - 2.5), X0 + 46), y: (showHormones ? HY0 + 4 : LY0 + off - 24), 'text-anchor': 'middle', class: 'text-green' }, 'fertile window'));
    }
    // hormones
    if (showHormones) {
      g.appendChild(s('line', { x1: X0, x2: X1, y1: HY1, y2: HY1, stroke: 'var(--hair)', 'stroke-width': 2 }));
      for (const [name, color, dash] of HORMONES) {
        let d = '';
        let best = { v: -1, x: 0 };
        for (let t = 1; t <= length + 1e-9; t += 0.25) {
          const v = hormoneLevels(t, length)[name];
          d += `${t > 1 ? 'L' : 'M'}${dx(t).toFixed(1)} ${hy(v).toFixed(1)}`;
          if (v > best.v) best = { v, x: dx(t) };
        }
        g.appendChild(s('path', { d, fill: 'none', stroke: hue(color), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash }));
        // each curve is named at its own peak: FSH is named over its early rise so that it does not sit on LH
        const at = name === 'FSH' ? { x: dx((o - 1) * 0.3 + 1), y: hy(0.42) - 8 } : name === 'oestrogen' ? { x: best.x - 26, y: hy(best.v) + 4 } : name === 'LH' ? { x: best.x + 10, y: hy(best.v) + 22 } : { x: best.x, y: hy(best.v) - 8 };
        g.appendChild(s('text.ch-name', { x: clamp(at.x, X0 + 30, X1 - 44), y: at.y, 'text-anchor': name === 'oestrogen' ? 'end' : name === 'LH' ? 'start' : 'middle', fill: hue(color, 'text') }, name));
      }
    }
    // the lining of the uterus: a band whose thickness follows the cycle
    let top = '';
    for (let t = 1; t <= length + 1e-9; t += 0.25) top += `L${dx(t).toFixed(1)} ${(LY1 + off - liningThickness(t, length) * (LY1 - LY0)).toFixed(1)}`;
    g.appendChild(s('path', { d: `M${dx(1)} ${LY1 + off}${top}L${dx(length)} ${LY1 + off}Z`, fill: hue('pink', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    g.appendChild(s('rect', { x: dx(1) - cell / 2, y: LY1 + off + 3, width: cell * PERIOD_DAYS, height: 6, rx: 3, fill: hue('red') }));
    g.appendChild(s('text.fig-label-sm', { x: X1, y: LY0 + off - 6, 'text-anchor': 'end' }, 'lining of the uterus'));
    g.appendChild(s('text.fig-label-sm', { x: dx(1) - cell / 2, y: LY0 + off - 6, 'text-anchor': 'start', class: 'text-red' }, 'period'));
    // the egg
    g.appendChild(s('circle', { cx: dx(o), cy: LY0 + off + 8, r: 7, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    g.appendChild(s('text.fig-label-sm', { x: dx(o), y: LY0 + off - 6, 'text-anchor': 'middle' }, 'egg released'));
    // day axis
    g.appendChild(s('line', { x1: X0, x2: X1, y1: AX + off, y2: AX + off, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    for (let d = 1; d <= length; d++) {
      const major = d === 1 || d % 7 === 0 || d === length;
      g.appendChild(s('line', { x1: dx(d), x2: dx(d), y1: AX + off, y2: AX + off + (major ? 7 : 4), stroke: 'var(--ink)', 'stroke-width': major ? 2 : 1.2 }));
      if (major && !(d === length && length % 7 === 1)) g.appendChild(s('text.tick-label', { x: dx(d), y: AX + off + 21, 'text-anchor': 'middle' }, d === 1 ? 'day 1' : String(d)));
    }
    g.appendChild(s('text.tick-label', { x: X1, y: AX + off + 40, 'text-anchor': 'end' }, 'next period starts →'));
    // the day marker
    if (!isStatic) {
      // the marker line skips the row of names between the hormone graph and the lining
      const mark = { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' };
      if (showHormones) g.appendChild(s('line', { x1: dx(day), x2: dx(day), y1: HY0 - 6, y2: HY1, ...mark }));
      g.appendChild(s('line', { x1: dx(day), x2: dx(day), y1: LY0 + off, y2: AX + off, ...mark }));
      g.appendChild(s('circle', { cx: dx(day), cy: AX + off, r: 6, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    }
    const st = getState();
    roDay.set(`${day} of ${length}`);
    roPhase.set(PHASE_NAMES[st.phase]);
    svg.setAttribute('aria-label', `${spec.alt || 'A menstrual cycle on a time line'}. A cycle of ${length} days; the egg is released on day ${o}. ${isStatic ? '' : `The marker is on day ${day}: ${PHASE_NAMES[st.phase]}.${showHormones ? ` Highest hormone: ${st.top}.` : ''}`}${showWindow ? ` The fertile window runs from day ${o - 5} to day ${o}.` : ''}`);
  }

  function visit() {
    const p = phaseOf(day, length);
    if (!phases.includes(p)) phases.push(p);
  }

  if (!isStatic) {
    fr.readouts.append(roDay.el, roPhase.el);
    dRow = sliderRow({ label: 'day of the cycle', min: 1, max: 35, step: 1, value: day, color: 'blue', onInput: (v) => { if (readOnly) return; day = clamp(v, 1, length); if (v > length) dRow.set(day); visit(); render(); env.onChange(getState()); } });
    fr.controls.appendChild(dRow.el);
    if (range) {
      lRow = sliderRow({ label: 'length of this cycle', min: range[0], max: range[1], step: range[2] || 1, value: length, color: 'pink', unit: 'days', onInput: (v) => { if (readOnly) return; length = v; if (!lengths.includes(v)) lengths.push(v); day = clamp(day, 1, length); dRow.set(day); visit(); render(); play('tap'); env.onChange(getState()); } });
      fr.controls.appendChild(lRow.el);
    }
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.length === 'number') { length = clamp(Math.round(next.length), 21, 35); if (lRow) lRow.set(length); if (!lengths.includes(length)) lengths.push(length); }
      if (Array.isArray(next.lengths)) for (const v of next.lengths) if (v >= 21 && v <= 35 && !lengths.includes(v)) lengths.push(v);
      if (typeof next.day === 'number') day = Math.round(next.day);
      day = clamp(day, 1, length);
      if (dRow) dRow.set(day);
      visit();
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [dRow, lRow]) if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'cycle-hormones — four hormones through a 28-day cycle', spec: { type: 'cycle-hormones', length: 28, lengthRange: [21, 35, 1] } },
  { title: 'cycle-hormones — the fertile window', spec: { type: 'cycle-hormones', length: 30, lengthRange: [21, 35, 1], fertile: true, hormones: false } },
];
