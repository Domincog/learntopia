/**
 * body-clock — a 24-hour dial with two rings. The outer ring is local time
 * (day and night outside). The inner ring is the body's own clock: its
 * "night" (melatonin on, sleep comes easily) and its low point, when body
 * temperature and alertness are at their lowest. The learner places a block
 * of bright light on the outer ring and steps through the days: light that
 * falls BEFORE the body's low point pushes the body clock later, light that
 * falls AFTER it pulls the clock earlier. With no time cues at all (`cave`)
 * the clock drifts a little later every day.
 *
 * {
 *   type: 'body-clock',
 *   offset: 0,          // hours the body clock runs BEHIND local time (+6 after flying six zones east, −6 after flying west)
 *   light: 13,          // local clock hour at the centre of the two-hour block of bright light
 *                       // (false: no block of light at all, for a picture of the two clocks only)
 *   static: false,      // true: a picture to read, with no handle, no buttons and no line of text underneath
 *   cave: false,        // true: no light and no clocks; each day the body clock drifts `drift` hours later
 *   drift: 0.2,         // cave only: hours per day (a body clock of 24.2 hours)
 *   zones: false,       // mark on the body ring where light pushes the clock later and where it pulls it earlier
 *   maxDays: 14,        // "Next day" stops here
 *   tolerance: 0.5,     // the clocks count as in step when they differ by no more than this many hours
 * }
 *
 * State: { offset, light, days, aligned, shift, direction, previewed: { later, earlier, none }, history }
 *   offset     hours the body clock is behind local time now (negative: ahead), to two decimals
 *   shift      what the light, where it now stands, would do in one day: hours later (+) or earlier (−)
 *   direction  'later' | 'earlier' | 'none' — the same as a word
 *   previewed  which of those the learner has seen so far by moving the light
 *   aligned    |offset| ≤ tolerance
 *   history    the offset at the start and after each day
 *
 * setState accepts { offset, light, days, previewed }.
 *
 * The model. Light centred τ hours after the body's low point (04:30 on the body clock) shifts the clock by
 *   τ in (−9, 0):  1.5 · sin(π·|τ|/9) hours later   (at most about 1½ hours a day)
 *   τ in (0, 9):   1.0 · sin(π·τ/9) hours earlier   (at most about 1 hour a day)
 *   otherwise:     nothing (the body's afternoon)
 * This is a cartoon of the measured human "phase response curve" to light. It leaves out ordinary
 * daylight, which normally cancels the slow drift, and it treats one block of light as the whole story;
 * real schedules also say when to AVOID light.
 */
import { frame, handle, button, readout, hue, s, h, clamp, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 440;
const H = 424;
const CX = 220;
const CY = 213;
const R_OUT = 160;      // local-time ring
const R_OUT_IN = 133;
const R_BODY = 124;     // body ring
const R_BODY_IN = 90;
const LOW = 4.5;        // the body's low point, on the body clock
const NIGHT = [21, 7];  // the body's night, on the body clock
const MAX_LATER = 1.5;
const MAX_EARLIER = 1;
const SPAN = 9;
let seq = 0;

addStyles('body-clock', `
  .widget-body-clock .bc-note { text-align: center; font-size: var(--fs-sm); min-height: 2.9em; margin: 0; color: var(--ink-2); }
  .widget-body-clock .bc-note b { color: var(--ink); }
  .widget-body-clock .bc-centre { font-family: var(--font-body); font-weight: 800; fill: var(--ink); }
  .widget-body-clock .bc-small { font-family: var(--font-body); font-size: 13.5px; font-weight: 700; fill: var(--ink-2); }
  .widget-body-clock .bc-on { font-family: var(--font-body); font-size: 15px; font-weight: 800; fill: #1D1B26; letter-spacing: 0.02em; }
`);

const wrap24 = (v) => ((v % 24) + 24) % 24;
const wrap12 = (v) => { const w = wrap24(v); return w > 12 ? w - 24 : w; };
const clockText = (hours) => {
  const total = Math.round(wrap24(hours) * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
/** Hours the clock moves in one day (+ later, − earlier) for light centred at local hour `light`. */
export function lightShift(light, offset) {
  if (light == null) return 0;
  const tau = wrap12(light - offset - LOW);
  if (tau < 0 && tau > -SPAN) return MAX_LATER * Math.sin((Math.PI * -tau) / SPAN);
  if (tau > 0 && tau < SPAN) return -MAX_EARLIER * Math.sin((Math.PI * tau) / SPAN);
  return 0;
}
const hoursWord = (v) => { const n = Math.round(Math.abs(v) * 10) / 10; return `${n} ${n === 1 ? 'hour' : 'hours'}`; };

export default function create(spec, env) {
  const cave = !!spec.cave;
  const drift = spec.drift != null ? spec.drift : 0.2;
  const maxDays = spec.maxDays || 14;
  const tol = spec.tolerance != null ? spec.tolerance : 0.5;
  const start = { offset: spec.offset || 0, light: cave || spec.light === false ? null : (spec.light != null ? spec.light : 13) };
  let offset = start.offset;
  let light = start.light;
  let days = 0;
  let history = [tidy(offset, 2)];
  let readOnly = !!env.readOnly;
  const previewed = { later: false, earlier: false, none: false };

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 440, label: spec.alt || 'A 24-hour dial with the body clock inside local time' });
  const { svg } = fr;

  const pt = (hour, r) => { const a = ((hour - 12) / 24) * 2 * Math.PI; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; };
  /** A ring segment from hour h1 clockwise to hour h2. */
  const arc = (h1, h2, r1, r2) => {
    let span = wrap24(h2 - h1);
    if (span === 0) span = 24;
    if (span >= 24) span = 23.999;
    const big = span > 12 ? 1 : 0;
    const [ax, ay] = pt(h1, r1); const [bx, by] = pt(h1 + span, r1);
    const [cx2, cy2] = pt(h1 + span, r2); const [dx, dy] = pt(h1, r2);
    return `M${ax.toFixed(1)} ${ay.toFixed(1)}A${r1} ${r1} 0 ${big} 1 ${bx.toFixed(1)} ${by.toFixed(1)}L${cx2.toFixed(1)} ${cy2.toFixed(1)}A${r2} ${r2} 0 ${big} 0 ${dx.toFixed(1)} ${dy.toFixed(1)}Z`;
  };

  // the local-time ring never changes
  svg.appendChild(s('path', { d: arc(6, 18, R_OUT, R_OUT_IN), fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2 }));
  svg.appendChild(s('path', { d: arc(18, 6, R_OUT, R_OUT_IN), fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2 }));
  for (let hr = 0; hr < 24; hr++) {
    const major = hr % 6 === 0;
    const [x1, y1] = pt(hr, R_OUT); const [x2, y2] = pt(hr, R_OUT + (major ? 8 : 4));
    svg.appendChild(s('line', { x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-width': major ? 2.5 : 1.5, 'stroke-linecap': 'round' }));
    if (hr % 3 === 0) {
      const [x, y] = pt(hr, R_OUT + 21);
      svg.appendChild(s('text', { class: major ? 'fig-label' : 'tick-label', x, y: y + 5, 'text-anchor': 'middle' }, `${String(hr).padStart(2, '0')}:00`));
    }
  }
  if (!env.compact) {
    const [dx, dy] = pt(12, (R_OUT + R_OUT_IN) / 2);
    svg.appendChild(s('text.bc-small', { x: dx, y: dy + 4, 'text-anchor': 'middle' }, cave ? 'day outside' : 'local day'));
    const [nx, ny] = pt(0, (R_OUT + R_OUT_IN) / 2);
    svg.appendChild(s('text.bc-small', { x: nx, y: ny + 4, 'text-anchor': 'middle' }, cave ? 'night outside' : 'local night'));
  }
  const gBody = s('g');
  const gLight = s('g');
  svg.append(gBody, gLight);

  const note = h('p.bc-note', { 'aria-live': 'polite' });
  const pathId = `bc-path-${++seq}`;
  const roOffset = readout(cave ? 'body clock against outside time' : 'body clock against local time', { color: 'violet' });
  if (!env.compact) fr.readouts.appendChild(roOffset.el);
  let nextBtn = null;
  let resetBtn = null;
  let hd = null;

  const shiftNow = () => (cave ? drift : lightShift(light, offset));
  const directionOf = (v) => (v > 0.05 ? 'later' : v < -0.05 ? 'earlier' : 'none');
  function getState() {
    const sh = shiftNow();
    return {
      offset: tidy(offset, 2), light, days, aligned: Math.abs(offset) <= tol + 1e-9,
      shift: tidy(sh, 2), direction: directionOf(sh), previewed: { ...previewed }, history: history.slice(),
    };
  }
  const offsetText = () => {
    if (Math.abs(offset) < 0.05) return 'in step with local time';
    return `${hoursWord(offset)} ${offset > 0 ? 'behind' : 'ahead of'} local time`;
  };

  function render() {
    while (gBody.firstChild) gBody.removeChild(gBody.firstChild);
    while (gLight.firstChild) gLight.removeChild(gLight.firstChild);
    const loc = (bodyHour) => bodyHour + offset;     // where a moment of the body's day falls on the local dial
    gBody.appendChild(s('circle', { cx: CX, cy: CY, r: R_BODY, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }));
    gBody.appendChild(s('path', { d: arc(loc(NIGHT[0]), loc(NIGHT[1]), R_BODY, R_BODY_IN), fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 2 }));
    gBody.appendChild(s('circle', { cx: CX, cy: CY, r: R_BODY_IN, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }));
    if (spec.zones && !cave) {
      gBody.appendChild(s('path', { d: arc(loc(LOW - SPAN), loc(LOW), R_OUT_IN - 1, R_BODY + 1), fill: hue('orange'), opacity: 0.85 }));
      gBody.appendChild(s('path', { d: arc(loc(LOW), loc(LOW + SPAN), R_OUT_IN - 1, R_BODY + 1), fill: hue('teal'), opacity: 0.85 }));
    }
    // the words follow the band round; in the lower half of the dial the path runs the other way so that they stay upright
    const mid = wrap24(loc((NIGHT[0] + NIGHT[1] + 24) / 2));
    const low = mid > 18 || mid < 6;
    const rText = (R_BODY + R_BODY_IN) / 2 + (low ? 5 : -5);
    const [p1x, p1y] = pt(loc(NIGHT[0]), rText); const [p2x, p2y] = pt(loc(NIGHT[1]), rText);
    const along = low ? `M${p2x.toFixed(1)} ${p2y.toFixed(1)}A${rText} ${rText} 0 0 0 ${p1x.toFixed(1)} ${p1y.toFixed(1)}` : `M${p1x.toFixed(1)} ${p1y.toFixed(1)}A${rText} ${rText} 0 0 1 ${p2x.toFixed(1)} ${p2y.toFixed(1)}`;
    gBody.appendChild(s('path', { id: pathId, d: along, fill: 'none', stroke: 'none' }));
    const words = s('text.bc-on', { 'text-anchor': 'middle' });
    const tp = s('textPath', { href: `#${pathId}`, startOffset: '50%' }, "body's night");
    words.appendChild(tp);
    gBody.appendChild(words);
    // the low point: a marker that reaches across both rings
    const [lx1, ly1] = pt(loc(LOW), R_BODY_IN - 10); const [lx2, ly2] = pt(loc(LOW), R_OUT_IN - 2);
    gBody.appendChild(s('line', { x1: lx1, y1: ly1, x2: lx2, y2: ly2, stroke: 'var(--ink)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
    const [tx, ty] = pt(loc(LOW), R_BODY_IN - 34);
    gBody.appendChild(s('text.bc-small', { x: tx, y: ty + 4 + (Math.abs(ty - CY) < 16 ? (ty >= CY ? 14 : -14) : 0), 'text-anchor': 'middle' }, 'low point'));
    gBody.appendChild(s('text.bc-centre', { x: CX, y: CY + 6, 'text-anchor': 'middle', 'font-size': 20 }, `Day ${days + 1}`));
    roOffset.set(Math.abs(offset) < 0.05 ? 'in step' : `${hoursWord(offset)} ${offset > 0 ? 'behind' : 'ahead'}`);

    const sh = shiftNow();
    if (!cave && light != null) {
      gLight.appendChild(s('path', { d: arc(light - 1, light + 1, R_OUT + 1, R_OUT_IN - 1), fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      const [hx, hy] = pt(light, (R_OUT + R_OUT_IN) / 2);
      if (hd) { hd.set(hx, hy); hd.setLabel(`bright light around ${clockText(light)}: ${directionOf(sh) === 'none' ? 'no shift' : `${hoursWord(sh)} ${directionOf(sh)}`}`); gLight.appendChild(hd.el); }
    }

    note.innerHTML = '';
    if (cave) {
      note.append(h('b', `After ${days} ${days === 1 ? 'day' : 'days'} without time cues: `), days === 0 ? 'the body clock still matches the world outside.' : `the body's low point comes at ${clockText(LOW + offset)} outside time, ${hoursWord(offset)} later than at the start.`);
    } else if (light != null) {
      const tau = wrap12(light - offset - LOW);
      const when = `${hoursWord(tau)} ${tau < 0 ? 'before' : 'after'} the body's low point`;
      const dir = directionOf(sh);
      note.append(h('b', `Bright light around ${clockText(light)}`), `, ${when}: `, dir === 'none' ? 'the body clock hardly moves.' : h('b', `the body clock moves ${hoursWord(sh)} ${dir}.`));
    }
    if (nextBtn) { nextBtn.disabled = readOnly || days >= maxDays; }
    if (resetBtn) resetBtn.disabled = readOnly || (days === 0 && offset === start.offset);
    svg.setAttribute('aria-label', `${spec.alt || 'A 24-hour dial with the body clock inside local time'}. Day ${days + 1}. The body clock is ${offsetText()}; its low point falls at ${clockText(LOW + offset)} local time.${!cave && light != null ? ` Bright light is set around ${clockText(light)}.` : ''}`);
  }

  if (!env.compact && !spec.static) {
    if (!cave) {
      hd = handle(svg, {
        x: 0, y: 0, r: 11, color: 'yellow', label: 'Time of bright light',
        onMove(x, y, ev) {
          if (readOnly) return;
          let next;
          if (ev && ev.type === 'keydown') {
            const step = (ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 0.5 : -0.5) * (ev.shiftKey ? 4 : 1);
            next = wrap24(light + step);
          } else {
            const a = Math.atan2(x - CX, -(y - CY));
            next = wrap24(Math.round((12 + (a / (2 * Math.PI)) * 24) * 2) / 2);
          }
          if (next === light) return;
          light = next;
          previewed[directionOf(shiftNow())] = true;
          play('tick');
          render();
          env.onChange(getState());
        },
      });
    }
    fr.el.insertBefore(note, fr.readouts);
    nextBtn = button('Next day', () => {
      if (readOnly || days >= maxDays) return;
      offset = clamp(offset + shiftNow(), -12, 12);
      days++;
      history.push(tidy(offset, 2));
      if (!cave) previewed[directionOf(shiftNow())] = true;
      play('tap');
      render();
      env.announce(`Day ${days + 1}. The body clock is ${offsetText()}.`);
      env.onChange(getState());
    }, { icon: 'play', variant: 'primary' });
    resetBtn = button('Start again', () => {
      if (readOnly) return;
      offset = start.offset; days = 0; history = [tidy(offset, 2)];
      render();
      env.onChange(getState());
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(nextBtn, resetBtn);
  }
  if (!cave && light != null) previewed[directionOf(shiftNow())] = true;
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.light === 'number' && !cave) light = wrap24(next.light);
      if (typeof next.days === 'number') days = clamp(Math.round(next.days), 0, maxDays);
      if (typeof next.offset === 'number') offset = clamp(next.offset, -12, 12);
      else if (typeof next.days === 'number' && cave) offset = start.offset + drift * days;
      if (next.previewed) Object.assign(previewed, next.previewed);
      history = Array.isArray(next.history) ? next.history.slice() : [tidy(start.offset, 2), tidy(offset, 2)];
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      render();
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'body-clock — when does light move the clock?', spec: { type: 'body-clock', offset: 0, light: 13 } },
  { title: 'body-clock — six time zones east', spec: { type: 'body-clock', offset: 6, light: 8, zones: true } },
  { title: 'body-clock — no time cues at all', spec: { type: 'body-clock', cave: true } },
];
