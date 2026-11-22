/**
 * hypnogram — one night of sleep as a sleep laboratory draws it: time runs
 * left to right, and the line steps between Awake, REM, N1, N2 and N3 (deep
 * sleep). The learner reads a night with a cursor, cuts it short with an
 * alarm to see which stages are lost, or builds a night from five cycles.
 *
 * {
 *   type: 'hypnogram',
 *   mode: 'read',               // 'read' | 'cut' | 'build' | 'static'
 *   night: [['W', 10], ['N1', 10], ['N2', 10], ['N3', 42], …],   // [stage, minutes] in order; stages W, REM, N1, N2, N3
 *                               // (default: a typical 8-hour night of a young adult; ignored in build mode)
 *   bedtime: 23,                // clock hour of lights out, for the time axis
 *   at: 200,                    // read: where the cursor starts (minutes after lights out)
 *   halves: false,              // read and build: a small table of deep sleep and REM in each half of the night
 *   alarm: 480,                 // cut: where the alarm starts; cut and static: sleep after this moment is greyed out
 *   alarmRange: [240, 480, 30], // cut: [earliest, latest, step] in minutes after lights out
 *   mark: 250,                  // static: a dashed marker at this minute (for "which stage is this?" questions)
 *   patterns: ['M', 'M', 'M', 'M', 'M'],   // build: the starting pattern of each of the five cycles
 * }
 *
 * State
 *   read    { t, clock, stage, cycle, seen: ['W', 'N2', …], seenCount }
 *             stage — the stage under the cursor;  seen — every stage the cursor has visited so far
 *   cut     { alarm, hours, kept: { W, N1, N2, N3, REM, sleep }, lost: { … }, lostPct: { N3, REM, sleep } }
 *             minutes of each stage before and after the alarm; `sleep` counts every stage except W
 *   build   { patterns: ['D', 'D', 'M', 'R', 'R'], deep: [min per cycle], rem: [min per cycle],
 *             deepFirst, deepSecond, remFirst, remSecond }
 *             patterns: 'D' deep-rich, 'M' mixed, 'R' REM-rich; First / Second are the two halves of the night
 *   static  {}
 *
 * setState accepts { t }, { alarm } or { patterns }.
 *
 * The model is a teaching example, not a recording: real nights are less tidy, differ from person to
 * person and from night to night, and change with age.
 */
import { frame, handle, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 600;
const H = 292;
const PL = 62;
const PR = 30;
const PT = 46;
const PB = 30;
const ROWS = ['W', 'REM', 'N1', 'N2', 'N3'];
const ROW_LABEL = { W: 'Awake', REM: 'REM', N1: 'N1', N2: 'N2', N3: 'N3' };
const STAGE_NAME = { W: 'awake', REM: 'REM sleep', N1: 'N1, dozing off', N2: 'N2, light sleep', N3: 'N3, deep sleep' };
const STAGE_HUE = { W: 'gray', REM: 'orange', N1: 'teal', N2: 'blue', N3: 'violet' };

/** A typical night of a healthy young adult (8 hours in bed). */
export const TYPICAL_NIGHT = [
  ['W', 10], ['N1', 10], ['N2', 10], ['N3', 42], ['N2', 10], ['REM', 8],
  ['N2', 20], ['N3', 38], ['N2', 17], ['REM', 18],
  ['N2', 32], ['N3', 18], ['N2', 22], ['REM', 26],
  ['W', 3], ['N1', 7], ['N2', 59], ['REM', 30],
  ['N2', 52], ['REM', 32], ['N2', 10], ['W', 6],
];

/** The three kinds of 96-minute cycle a night can be built from. */
export const PATTERNS = {
  D: { name: 'deep-rich', short: 'deep', segments: [['N1', 4], ['N2', 24], ['N3', 40], ['N2', 18], ['REM', 10]] },
  M: { name: 'mixed', short: 'mixed', segments: [['N1', 2], ['N2', 30], ['N3', 20], ['N2', 20], ['REM', 24]] },
  R: { name: 'REM-rich', short: 'REM', segments: [['N1', 2], ['N2', 56], ['REM', 34], ['W', 4]] },
};
const PATTERN_ORDER = ['D', 'M', 'R'];

addStyles('hypnogram', `
  .widget-hypnogram .hy-note { text-align: center; font-size: var(--fs-sm); min-height: 2.8em; margin: 0; color: var(--ink-2); }
  .widget-hypnogram .hy-note b { color: var(--ink); }
  .widget-hypnogram .hy-table { display: grid; gap: 5px; font-size: var(--fs-sm); font-weight: 700; }
  .widget-hypnogram .hy-row { display: grid; grid-template-columns: 6.2em minmax(0, 1fr) 8.6em; align-items: center; gap: var(--s2); }
  .widget-hypnogram .hy-row > span:last-child { font-family: var(--font-mono); text-align: right; font-variant-numeric: tabular-nums; font-size: var(--fs-xs); }
  .widget-hypnogram .hy-bar { display: flex; height: 14px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); overflow: hidden; }
  .widget-hypnogram .hy-bar i { display: block; height: 100%; }
  .widget-hypnogram .hy-halves { display: grid; grid-template-columns: auto auto auto; justify-content: center; gap: 2px var(--s4); font-size: var(--fs-sm); text-align: center; }
  .widget-hypnogram .hy-halves b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .widget-hypnogram .hy-halves .hy-head { color: var(--ink-3); font-weight: 700; font-size: var(--fs-xs); }
  .widget-hypnogram .hy-halves .hy-name { text-align: right; font-weight: 700; }
  .widget-hypnogram .hy-cycle { cursor: pointer; outline: none; }
  .widget-hypnogram .hy-cycle rect.hy-hit { fill: transparent; }
  .widget-hypnogram .hy-cycle:hover rect.hy-pill, .widget-hypnogram .hy-cycle:focus-visible rect.hy-pill { stroke: var(--focus); stroke-width: 3; }
  .widget-hypnogram .hy-pilltext { font-family: var(--font-body); font-size: 13px; font-weight: 800; fill: var(--ink); }
  @container wcanvas (max-width: 470px) { .widget-hypnogram .hy-pilltext { font-size: 17px; } }
  .widget-hypnogram.is-readonly .hy-cycle { cursor: default; pointer-events: none; }
`);

const clockText = (bedtime, minute) => {
  const total = Math.round(((bedtime * 60 + minute) % 1440 + 1440) % 1440);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Minutes of `stage` between two moments of a night. */
function minutesOf(night, stage, from, to) {
  let t = 0;
  let total = 0;
  for (const [st, len] of night) {
    if (stage === 'sleep' ? st !== 'W' : st === stage) total += Math.max(0, Math.min(to, t + len) - Math.max(from, t));
    t += len;
  }
  return total;
}

export default function create(spec, env) {
  const mode = env.compact ? 'static' : (['read', 'cut', 'build', 'static'].includes(spec.mode) ? spec.mode : 'static');
  const bedtime = spec.bedtime != null ? spec.bedtime : 23;
  let patterns = (Array.isArray(spec.patterns) ? spec.patterns : ['M', 'M', 'M', 'M', 'M']).map((p) => (PATTERNS[p] ? p : 'M')).slice(0, 5);
  while (patterns.length < 5) patterns.push('M');
  const fixedNight = Array.isArray(spec.night) && spec.night.length ? spec.night : TYPICAL_NIGHT;
  const nightNow = () => (mode === 'build' ? patterns.flatMap((p) => PATTERNS[p].segments) : fixedNight);
  const total = nightNow().reduce((t, seg) => t + seg[1], 0);
  const range = Array.isArray(spec.alarmRange) ? spec.alarmRange : [240, total, 30];
  let t = clamp(spec.at != null ? spec.at : Math.round(total * 0.42 / 5) * 5, 0, total - 1);
  let alarm = clamp(spec.alarm != null ? spec.alarm : total, mode === 'cut' ? range[0] : 0, total);
  let readOnly = !!env.readOnly;
  const seen = new Set();

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A hypnogram: the stages of one night of sleep' });
  const { svg } = fr;
  const iw = W - PL - PR;
  const rowH = (H - PT - PB) / ROWS.length;
  const sx = (m) => PL + (m / total) * iw;
  const rowY = (stage) => PT + ROWS.indexOf(stage) * rowH;

  // rows, stage names and the clock along the bottom
  for (const stage of ROWS) {
    const y = rowY(stage);
    svg.appendChild(s('line.grid-line', { x1: PL, x2: W - PR, y1: y + rowH / 2, y2: y + rowH / 2 }));
    svg.appendChild(s('text', { class: `fig-label-sm text-${STAGE_HUE[stage]}`, x: PL - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end' }, ROW_LABEL[stage]));
  }
  for (let m = 0; m <= total + 1e-9; m += 60) {
    svg.appendChild(s('line', { x1: sx(m), x2: sx(m), y1: H - PB, y2: H - PB + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x: sx(m), y: H - PB + 19, 'text-anchor': 'middle' }, clockText(bedtime, m)));
  }
  svg.appendChild(s('line', { x1: PL, x2: W - PR, y1: H - PB, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  const gNight = s('g');
  const gOver = s('g');
  svg.append(gNight, gOver);

  const note = h('p.hy-note', { 'aria-live': 'polite' });
  const table = h('div');
  if (!env.compact && mode !== 'static') fr.el.insertBefore(note, fr.readouts);
  if (!env.compact && (mode === 'cut' || (spec.halves && mode !== 'static'))) fr.el.insertBefore(table, fr.readouts);

  /* ------------------------------------------------------------- facts */
  const stageAt = (minute) => {
    let u = 0;
    for (const [stage, len] of nightNow()) { if (minute < u + len) return stage; u += len; }
    return 'W';
  };
  const cycleAt = (minute) => {
    let u = 0;
    let n = 1;
    for (const [stage, len] of nightNow()) {
      if (minute < u + len) return n;
      u += len;
      if (stage === 'REM') n++;
    }
    return n;
  };
  const halvesOf = () => {
    const night = nightNow();
    return {
      deepFirst: minutesOf(night, 'N3', 0, total / 2), deepSecond: minutesOf(night, 'N3', total / 2, total),
      remFirst: minutesOf(night, 'REM', 0, total / 2), remSecond: minutesOf(night, 'REM', total / 2, total),
    };
  };

  function getState() {
    if (mode === 'read') {
      return { t, clock: clockText(bedtime, t), stage: stageAt(t), cycle: cycleAt(t), seen: ROWS.filter((r) => seen.has(r)), seenCount: seen.size };
    }
    if (mode === 'cut') {
      const night = nightNow();
      const kept = {};
      const lost = {};
      for (const key of [...ROWS, 'sleep']) { kept[key] = minutesOf(night, key, 0, alarm); lost[key] = minutesOf(night, key, alarm, total); }
      const pct = (key) => (kept[key] + lost[key] ? Math.round((lost[key] / (kept[key] + lost[key])) * 100) : 0);
      return { alarm, hours: alarm / 60, kept, lost, lostPct: { N3: pct('N3'), REM: pct('REM'), sleep: pct('sleep') } };
    }
    if (mode === 'build') {
      const per = (stage) => patterns.map((p) => PATTERNS[p].segments.reduce((sum, seg) => sum + (seg[0] === stage ? seg[1] : 0), 0));
      return { patterns: patterns.slice(), deep: per('N3'), rem: per('REM'), ...halvesOf() };
    }
    return {};
  }

  /* ----------------------------------------------------------- drawing */
  let hd = null;
  const cursorLine = s('line', { stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round' });
  if (mode === 'read' || mode === 'cut') {
    const step = mode === 'cut' ? range[2] : 5;
    hd = handle(svg, {
      x: sx(mode === 'cut' ? alarm : t), y: PT - 16, r: 10, color: 'orange', keyStep: (step / total) * iw,
      label: mode === 'cut' ? 'Alarm time' : 'Time of night',
      onMove(x) {
        if (readOnly) return;
        const minute = Math.round((((x - PL) / iw) * total) / step) * step;
        if (mode === 'cut') {
          const next = clamp(minute, range[0], range[1]);
          if (next === alarm) return;
          alarm = next;
        } else {
          const next = clamp(minute, 0, total - step);
          if (next === t) return;
          t = next;
          seen.add(stageAt(t));
        }
        play('tick');
        render();
        env.onChange(getState());
      },
    });
  }

  function cycleButtons() {
    const cw = iw / 5;
    patterns.forEach((p, i) => {
      const x = PL + i * cw;
      const label = `${i + 1} · ${PATTERNS[p].short}`;
      const g = s('g.hy-cycle', { tabindex: readOnly ? '-1' : '0', role: 'button', 'aria-label': `Cycle ${i + 1} is ${PATTERNS[p].name}. Press to change it.` },
        s('rect.hy-hit', { x: x + 1, y: 2, width: cw - 2, height: H - PB - 2 }),
        s('rect.hy-pill', { x: x + 5, y: 8, width: cw - 10, height: 24, rx: 12, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }),
        s('text.hy-pilltext', { x: x + cw / 2, y: 24, 'text-anchor': 'middle' }, label));
      g.dataset.keys = 'own';
      const turn = () => {
        if (readOnly) return;
        const hadFocus = document.activeElement === g;
        patterns[i] = PATTERN_ORDER[(PATTERN_ORDER.indexOf(patterns[i]) + 1) % PATTERN_ORDER.length];
        play('tap');
        render();
        const again = gOver.querySelectorAll('.hy-cycle')[i];
        if (hadFocus && again) again.focus({ preventScroll: true });
        env.announce(`Cycle ${i + 1}: ${PATTERNS[patterns[i]].name}`);
        env.onChange(getState());
      };
      g.addEventListener('click', turn);
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); turn(); } });
      gOver.appendChild(g);
      if (i > 0) gOver.appendChild(s('line', { x1: x, x2: x, y1: PT - 6, y2: H - PB, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 5' }));
    });
  }

  const bar = (label, parts, text) => h('div.hy-row', h('span', label), h('div.hy-bar', parts.map(([w, color, soft]) => h('i', { style: `width:${w}%;background:${soft ? hue(color, 'soft') : hue(color)}` }))), h('span', text));

  function render() {
    const night = nightNow();
    while (gNight.firstChild) gNight.removeChild(gNight.firstChild);
    while (gOver.firstChild) gOver.removeChild(gOver.firstChild);
    // the step line first, then a block for each stretch of one stage
    let u = 0;
    let d = '';
    night.forEach(([stage, len], i) => {
      const y = rowY(stage) + rowH / 2;
      d += `${i ? 'L' : 'M'}${sx(u).toFixed(1)} ${y.toFixed(1)}L${sx(u + len).toFixed(1)} ${y.toFixed(1)}`;
      u += len;
    });
    gNight.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round', opacity: 0.55 }));
    u = 0;
    for (const [stage, len] of night) {
      const y = rowY(stage);
      gNight.appendChild(s('rect', { x: sx(u), y: y + rowH * 0.2, width: Math.max(2, sx(u + len) - sx(u)), height: rowH * 0.6, rx: 4, fill: hue(STAGE_HUE[stage]), stroke: 'var(--ink)', 'stroke-width': 2 }));
      u += len;
    }

    const cutAt = mode === 'cut' ? alarm : (spec.alarm != null ? alarm : null);
    if (cutAt != null && cutAt < total) {
      gOver.appendChild(s('rect', { x: sx(cutAt), y: PT - 4, width: sx(total) - sx(cutAt), height: H - PB - PT + 4, fill: 'var(--paper)', opacity: 0.78 }));
      gOver.appendChild(s('text.fig-label-sm', { x: (sx(cutAt) + sx(total)) / 2, y: PT + 12, 'text-anchor': 'middle' }, 'sleep missed'));
    }
    if (mode === 'static' && spec.mark != null) {
      const x = sx(spec.mark);
      gOver.appendChild(s('line', { x1: x, x2: x, y1: PT - 10, y2: H - PB, stroke: hue('red'), 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }));
      gOver.appendChild(s('text', { class: 'fig-label text-red', x, y: PT - 16, 'text-anchor': x > W - 60 ? 'end' : x < PL + 30 ? 'start' : 'middle' }, clockText(bedtime, spec.mark)));
    }
    if (mode === 'static' && cutAt != null && cutAt < total) {
      const x = sx(cutAt);
      gOver.appendChild(s('line', { x1: x, x2: x, y1: PT - 10, y2: H - PB, stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round' }));
      gOver.appendChild(s('text', { class: 'fig-label text-orange', x, y: PT - 16, 'text-anchor': 'middle' }, `alarm ${clockText(bedtime, cutAt)}`));
    }
    if (mode === 'build') cycleButtons();

    if (hd) {
      const at = mode === 'cut' ? alarm : t;
      const x = sx(at);
      cursorLine.setAttribute('x1', x); cursorLine.setAttribute('x2', x);
      cursorLine.setAttribute('y1', PT - 8); cursorLine.setAttribute('y2', H - PB);
      gOver.appendChild(cursorLine);
      gOver.appendChild(hd.el);
      hd.set(x, PT - 16);
      gOver.appendChild(s('text', { class: 'fig-label text-orange', x: clamp(x, PL + 40, W - PR - 40), y: 13, 'text-anchor': 'middle' }, mode === 'cut' ? `alarm ${clockText(bedtime, at)}` : clockText(bedtime, at)));
    }

    const st = getState();
    if (mode === 'read') {
      note.innerHTML = '';
      note.append(h('b', `${st.clock}: ${STAGE_NAME[st.stage]}`), ` · sleep cycle ${Math.min(st.cycle, 5)}`);
      hd.setLabel(`${st.clock}, ${STAGE_NAME[st.stage]}`);
      svg.setAttribute('aria-label', `${spec.alt || 'A hypnogram of one night'}. The cursor is at ${st.clock}: ${STAGE_NAME[st.stage]}.`);
    } else if (mode === 'cut') {
      const row = (key, label, color) => {
        const all = st.kept[key] + st.lost[key];
        return bar(label, [[(st.kept[key] / all) * 100, color, false], [(st.lost[key] / all) * 100, color, true]], `${st.kept[key]} of ${all} min`);
      };
      table.className = 'hy-table';
      table.replaceChildren(row('N3', 'Deep (N3)', 'violet'), row('REM', 'REM', 'orange'), row('sleep', 'All sleep', 'blue'));
      note.innerHTML = '';
      note.append(alarm >= total ? 'The whole night. Drag the alarm earlier.' : h('b', `Up at ${clockText(bedtime, alarm)}: `), alarm >= total ? '' : `${st.lostPct.sleep}% of all sleep is lost, ${st.lostPct.N3}% of the deep sleep and ${st.lostPct.REM}% of the REM sleep.`);
      hd.setLabel(`alarm at ${clockText(bedtime, alarm)}`);
      svg.setAttribute('aria-label', `${spec.alt || 'A hypnogram of one night'}. Alarm at ${clockText(bedtime, alarm)}: ${st.lostPct.N3}% of deep sleep and ${st.lostPct.REM}% of REM sleep are lost.`);
    } else if (mode === 'build') {
      note.textContent = 'Tap a cycle to change it: deep (deep-rich), mixed or REM (REM-rich).';
      svg.setAttribute('aria-label', `${spec.alt || 'A night built from five sleep cycles'}. ${patterns.map((p, i) => `Cycle ${i + 1}: ${PATTERNS[p].name}`).join('. ')}.`);
    }
    if (spec.halves && mode !== 'static' && mode !== 'cut') {
      const hv = halvesOf();
      table.className = 'hy-halves';
      table.replaceChildren(
        h('span'), h('span.hy-head', 'first half'), h('span.hy-head', 'second half'),
        h('span.hy-name', 'Deep sleep (N3)'), h('b', `${hv.deepFirst} min`), h('b', `${hv.deepSecond} min`),
        h('span.hy-name', 'REM sleep'), h('b', `${hv.remFirst} min`), h('b', `${hv.remSecond} min`));
    }
  }

  if (mode === 'read') seen.add(stageAt(t));
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'read') {
        if (Array.isArray(next.seen)) for (const st of next.seen) if (ROWS.includes(st)) seen.add(st);
        if (typeof next.t === 'number') { t = clamp(next.t, 0, total - 1); seen.add(stageAt(t)); }
      }
      if (mode === 'cut' && typeof next.alarm === 'number') alarm = clamp(next.alarm, range[0], range[1]);
      if (mode === 'build' && Array.isArray(next.patterns)) patterns = next.patterns.map((p) => (PATTERNS[p] ? p : 'M')).slice(0, 5).concat(['M', 'M', 'M', 'M', 'M']).slice(0, 5);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      if (mode === 'build') render();
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'hypnogram — read a night', spec: { type: 'hypnogram', mode: 'read', halves: true } },
  { title: 'hypnogram — cut the night short', spec: { type: 'hypnogram', mode: 'cut', alarm: 480 } },
  { title: 'hypnogram — build a night from cycles', spec: { type: 'hypnogram', mode: 'build', halves: true } },
  { title: 'hypnogram — a marked moment', spec: { type: 'hypnogram', mode: 'static', mark: 250 } },
];
