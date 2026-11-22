/**
 * timeline — a horizontal time axis for history: moments (events) as dots
 * with labels, stretches of time (spans: empires, eras, lifetimes) as bars in
 * rows. Static, explorable, or answerable.
 *
 * {
 *   type: 'timeline',
 *   from: -3000, to: 2000,          // the axis, in years. BCE years are NEGATIVE: 500 BCE is -500.
 *   step: 1000,                     // optional distance between ticks, in years (chosen to fit when omitted)
 *   era: 'auto',                    // tick and date labels: 'auto' writes "500 BCE" / "1500 CE" when the axis
 *                                   //   reaches back before year 1 and plain "1789" when it does not;
 *                                   //   'always' always adds CE, 'never' never does
 *   events: [{ id: 'rome', year: -753, label: 'Rome founded', color: 'orange',
 *              short: 'Rome', note: 'Shown when tapped (markdown).' }],
 *   spans:  [{ id: 'han', from: -206, to: 220, label: 'Han dynasty', color: 'teal', row: 0, note: '…' }],
 *                                   // row is optional: bars (with their labels) that would collide are
 *                                   //   stacked automatically, as the width of the screen requires
 *   showYears: false,               // true writes the year after each event label
 *   axisLabel: 'years',             // optional caption under the axis
 *   alt: 'What the timeline shows', // for screen readers (a list of the events and spans is used when omitted)
 *   minWidth: 0,                    // px. A long, crowded axis may be given a minimum width; on a narrower
 *                                   //   screen it then scrolls sideways INSIDE its frame (the page never does)
 *
 *   mode: 'static',                 // 'static'   a picture (the default without notes or cards)
 *                                   // 'explore'  tap an event or a span to read its note (default when any has one)
 *                                   // 'pick'     tap the event or span that answers the question
 *                                   // 'place'    drag cards onto the axis (default when `place` is given)
 *   hideLabels: false,              // pick: show numbers and letters instead of names until the step is answered
 *   place: [{ id: 'printing', label: 'Printing press', color: 'violet', answer: 1450 }],
 *                                   // cards to place. `answer` is optional: it is never used to judge, only
 *                                   //   shown as "it was 1450" once the step is answered
 *   snap: 10,                       // place: years a card moves per step (default: about 1/200 of the axis)
 *
 *   scale: 'linear',                // or 'log-ago' for deep time: the axis shows YEARS AGO and every step to
 *   now: 2025,                      //   the left is ten times further back. `now` is the year "ago" counts from.
 *   fromAgo: 4.6e9, toAgo: 1e4,     // with 'log-ago' the ends (and events: `ago`, spans: `fromAgo`/`toAgo`,
 * }                                 //   cards: `answerAgo`) may be given as years ago instead of as years
 *
 * Years and the missing year zero. The calendar goes from 1 BCE straight to
 * 1 CE; there is no year 0. This widget keeps things simple: -1 is 1 BCE and
 * 1 is 1 CE, and they are drawn two units apart instead of one. That is one
 * year of error, invisible on any axis a lesson would draw. What it means in
 * practice: never give an event the year 0; a tick that falls on 0 is
 * labelled "BCE | CE"; and never subtract years across the boundary yourself,
 * use yearsBetween(-44, 14) (57 years, not 58). formatYear(-500) gives
 * "500 BCE". Both are exported from this file for lesson text:
 *
 *   import { formatYear, yearsBetween } from '../../../../src/widgets/timeline.js';
 *
 * On a narrow screen labels that would collide are stacked on several
 * levels; if they still do not fit, each event's `short` label is used, and
 * failing that events are numbered (spans lettered) with a legend below.
 *
 * State:
 *   static   {}
 *   explore  { selected: id | null, seen: [ids], seenCount }
 *   pick     { picked: id | null, kind: 'event' | 'span' | null }
 *   place    { placed: { printing: 1450, … }   the chosen year of each card, null while it is not on the axis
 *              count, complete,                how many are placed; whether all are
 *              off: { printing: 12 }, maxOff } years between each choice and its `answer` (only with answers)
 * setState accepts { selected }, { seen: [ids] } (explore: marks those notes as read and opens the last;
 * this is the form a step's `solution` takes when its check counts `seenCount`), { picked } or
 * { placed: { id: year } }.
 *
 * A lesson checks with a tolerance, for example
 *   check: (s) => s.placed.printing != null && Math.abs(s.placed.printing - 1450) <= 50
 *   solution: { placed: { printing: 1450 } }
 * Keyboard: cards move with ← → (Shift: ten steps; Home / End: the ends of
 * the axis); events and spans are buttons, ← → walks through them.
 */
import { frame, s, h, hue, clamp, niceStep, ticks, addStyles, mdInline, HUES } from './kit.js';
import { play } from '../core/audio.js';

/* ------------------------------------------------------------- pure parts */

const sig = (value) => String(Number(Number(value).toPrecision(3)));

function bigNumber(n) {
  if (n >= 1e9) return `${sig(n / 1e9)} billion`;
  if (n >= 1e6) return `${sig(n / 1e6)} million`;
  if (n >= 10000) return Math.round(n).toLocaleString('en-US');
  return String(Math.round(n));
}

/** -500 → "500 BCE", 1500 → "1500 CE" (or "1500" with { ce: false }). There is no year 0: see the header. */
export function formatYear(year, { ce = true } = {}) {
  const y = Math.round(year);
  if (y === 0) return '1 BCE / 1 CE';
  const text = bigNumber(Math.abs(y));
  return y < 0 ? `${text} BCE` : ce ? `${text} CE` : text;
}

/** 66000000 → "66 million years ago"; with { short: true } → "66 M" (k = thousand, M = million, bn = billion). */
export function formatAgo(years, { short = false } = {}) {
  const v = Number(Number(Math.max(0, years)).toPrecision(3));
  if (short) {
    if (v >= 1e9) return `${sig(v / 1e9)} bn`;
    if (v >= 1e6) return `${sig(v / 1e6)} M`;
    if (v >= 1e3) return `${sig(v / 1e3)} k`;
    return String(v);
  }
  return `${bigNumber(v)} year${v === 1 ? '' : 's'} ago`;
}

/** Years from `a` to `b`, knowing that 1 BCE (-1) is followed directly by 1 CE (1): yearsBetween(-44, 14) is 57. */
export function yearsBetween(a, b) {
  if (a < 0 && b > 0) return b - a - 1;
  if (a > 0 && b < 0) return b - a + 1;
  return b - a;
}

/**
 * The axis as a mapping between years and positions 0 (left end) … 1 (right end).
 *   linear    equal distance for equal numbers of years
 *   log-ago   position by the logarithm of "years before `now`"
 * @returns {{ kind, from, to, now, t(year), year(t), ago(t) }}
 */
export function makeScale({ from, to, fromAgo, toAgo, scale = 'linear', now = 2025 } = {}) {
  const a = Number.isFinite(fromAgo) ? now - fromAgo : Number(from);
  const b = Number.isFinite(toAgo) ? now - toAgo : Number(to);
  if (!(a < b)) throw new Error('timeline: "from" must be earlier than "to"');
  const unit = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  if (scale !== 'log-ago') {
    return { kind: 'linear', from: a, to: b, now, t: (year) => unit((year - a) / (b - a)), year: (t) => a + unit(t) * (b - a), ago: (t) => now - (a + unit(t) * (b - a)) };
  }
  const far = Math.log10(Math.max(now - a, 1));
  const near = Math.log10(Math.max(now - b, 1));
  if (!(far > near)) throw new Error('timeline: a "log-ago" axis must end before "now"');
  const ago = (t) => Math.pow(10, far - unit(t) * (far - near));
  return {
    kind: 'log-ago', from: a, to: b, now,
    t: (year) => unit((far - Math.log10(Math.max(now - year, 1e-9))) / (far - near)),
    year: (t) => now - ago(t),
    ago,
  };
}

/**
 * Ticks of a linear axis: [{ year, label }]. Without a `step` one is chosen
 * so that about `room` ticks appear. Labels follow formatYear; `ce` defaults
 * to "only when the axis reaches back before year 1".
 */
export function yearTicks(from, to, step = null, { ce = from < 0, room = 6 } = {}) {
  let st = step > 0 ? step : Math.max(1, niceStep(to - from, Math.max(1, room)));
  if (!(step > 0)) while (ticks(from, to, st).length > Math.max(2, room + 1)) st *= 2;
  return ticks(from, to, st).map((year) => ({
    year,
    label: year === 0 ? (from < 0 ? 'BCE | CE' : formatYear(1, { ce })) : formatYear(year, { ce }),
  }));
}

/** Ticks of a log-ago axis: one per power of ten of "years ago", oldest first. */
export function agoTicks(agoFrom, agoTo) {
  const out = [];
  for (let k = Math.floor(Math.log10(agoFrom) + 1e-9); k >= Math.ceil(Math.log10(Math.max(agoTo, 1)) - 1e-9); k--) {
    const ago = Math.pow(10, k);
    out.push({ ago, label: formatAgo(ago, { short: true }) });
  }
  return out;
}

/**
 * Put labels on as few levels as possible without overlap. Each item is
 * { x: where it points, w: its width }. Labels are centred on x, pulled
 * inside [0, width], and lifted to the next level while they collide.
 * @returns the items' { left, w, level } in the order given, or null when `maxLevels` is not enough
 */
export function staggerLabels(items, { width, gap = 6, maxLevels = 3 } = {}) {
  const order = items.map((it, i) => i).sort((p, q) => items[p].x - items[q].x);
  const ends = [];
  const out = new Array(items.length);
  for (const i of order) {
    const w = Math.min(items[i].w, width);
    const left = Math.min(Math.max(items[i].x - w / 2, 0), width - w);
    let level = 0;
    while (level < ends.length && left < ends[level] + gap) level++;
    if (level >= maxLevels) return null;
    ends[level] = left + w;
    out[i] = { left, w, level };
  }
  return out;
}

/** A row for every span: the given `row`, or the first row in which it overlaps nothing. */
export function assignRows(spans) {
  const rows = [];
  const fits = (row, sp) => (rows[row] || []).every((o) => sp.from >= o.to || sp.to <= o.from);
  const out = new Array(spans.length);
  spans.forEach((sp, i) => { if (Number.isInteger(sp.row) && sp.row >= 0) { out[i] = sp.row; (rows[sp.row] = rows[sp.row] || []).push(sp); } });
  spans.forEach((sp, i) => {
    if (out[i] !== undefined) return;
    let row = 0;
    while (!fits(row, sp)) row++;
    out[i] = row;
    (rows[row] = rows[row] || []).push(sp);
  });
  return out;
}

/**
 * What setState makes of an explore-mode state. `known(id)` says whether an id is an event or a span.
 *   { selected: 'a' }             opens a's note (and counts it as read, as a tap would)
 *   { seen: ['a', 'b', 'c'] }     marks these notes as read and opens the last one: the form a step's
 *                                 `solution` takes when its check is  (s) => s.seenCount >= 3
 *   { seen: [...], selected }     both, as given
 * @returns {{ seen: ids[] | null (null: leave what has been read alone), selected: id | null }}
 */
export function exploreState(next, known) {
  const seen = Array.isArray(next && next.seen) ? next.seen.filter((id, i, all) => known(id) && all.indexOf(id) === i) : null;
  const wanted = next && next.selected !== undefined ? next.selected : seen && seen.length ? seen[seen.length - 1] : null;
  return { seen, selected: wanted != null && known(wanted) ? wanted : null };
}

/* ------------------------------------------------------------------ style */

addStyles('timeline', `
  .widget-timeline .w-canvas.is-scroll { overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; }
  .widget-timeline .w-canvas.is-scroll svg { width: auto; max-width: none; }
  .widget-timeline svg text { font-family: var(--font-body); stroke: none; user-select: none; -webkit-user-select: none; }
  .widget-timeline .tl-tick { font-size: 12px; font-weight: 600; fill: var(--ink-3); font-variant-numeric: tabular-nums; }
  .widget-timeline .tl-axis-label { font-size: 12px; font-weight: 700; fill: var(--ink-3); }
  .widget-timeline .tl-label { font-size: 13px; font-weight: 700; fill: var(--ink); }
  .widget-timeline .tl-span-label { font-size: 13px; font-weight: 700; fill: var(--ink); }
  .widget-timeline .tl-code { font-size: 12px; font-weight: 800; fill: var(--ink); font-variant-numeric: tabular-nums; }
  .widget-timeline .tl-pill { fill: var(--surface); stroke: var(--hair); stroke-width: 1.5; }
  .widget-timeline .tl-item { outline: none; }
  .widget-timeline .tl-item.is-button { cursor: pointer; }
  .widget-timeline .tl-item.is-button:hover .tl-pill { stroke: var(--ink-3); }
  .widget-timeline .tl-item.is-on .tl-pill { stroke: var(--ink); stroke-width: 2.5; fill: var(--yellow-soft); }
  .widget-timeline .tl-item.is-on .tl-bar { stroke: var(--ink); stroke-width: 3.5; }
  .widget-timeline .tl-item.is-on .tl-dot { stroke-width: 3.5; }
  .widget-timeline .tl-item:focus-visible .tl-pill, .widget-timeline .tl-item:focus-visible .tl-bar, .widget-timeline .tl-card:focus-visible .tl-card-pill { stroke: var(--focus); stroke-width: 3.5; }
  .widget-timeline .tl-card { outline: none; cursor: grab; touch-action: none; }
  .widget-timeline .tl-card.is-dragging { cursor: grabbing; }
  .widget-timeline .tl-card-pill { stroke: var(--ink); stroke-width: 2.5; }
  .widget-timeline .tl-card.is-unplaced .tl-card-pill { stroke-dasharray: 5 4; }
  .widget-timeline.is-place:not(.is-readonly) svg { cursor: crosshair; }
  .widget-timeline.is-readonly .tl-card, .widget-timeline.is-readonly .tl-item.is-button { cursor: default; pointer-events: none; }
  .widget-timeline .tl-note { min-height: 3.1em; padding: var(--s2) var(--s3); border: var(--bw) dashed var(--hair); border-radius: var(--r); font-size: var(--fs-sm); line-height: 1.45; }
  .widget-timeline .tl-note.is-empty { color: var(--ink-3); display: grid; align-items: center; }
  .widget-timeline .tl-note b { margin-right: 0.4em; }
  .widget-timeline .tl-note .tl-when { color: var(--ink-2); font-weight: 700; margin-right: 0.4em; white-space: nowrap; }
  .widget-timeline .tl-legend { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 2px var(--s4); font-size: var(--fs-sm); }
  .widget-timeline .tl-legend li { display: inline-flex; align-items: baseline; gap: 0.4em; }
  .widget-timeline .tl-legend i { font-style: normal; font-weight: 800; min-width: 1.5em; height: 1.5em; padding: 0 0.3em; display: inline-grid; place-items: center; border: 1.5px solid var(--ink); border-radius: 999px; font-size: var(--fs-xs); }
  .widget-timeline .tl-legend small { color: var(--ink-3); white-space: nowrap; }
  .widget-timeline .tl-answers { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; font-size: var(--fs-sm); }
  .widget-timeline .tl-answers b { font-weight: 700; }
  .widget-timeline .tl-key { display: inline-block; width: 11px; height: 11px; margin-right: 0.45em; border-radius: 50%; background: var(--green); border: 2px solid var(--edge-strong); vertical-align: -1px; }
  .widget-timeline .w-hint { margin: 0; }
`);

let pen = null;
/** Width of a piece of label text in px, measured with the page's own font. */
function textWidth(text, size = 13, weight = 700) {
  const rough = String(text).length * size * 0.58;
  if (typeof document === 'undefined') return rough;
  if (pen === null) {
    try { pen = document.createElement('canvas').getContext('2d') || false; } catch { pen = false; }
  }
  if (!pen) return rough;
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
  pen.font = `${weight} ${size}px ${family}`;
  return pen.measureText(String(text)).width * 1.04 + 1;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CARD_HUES = ['orange', 'violet', 'teal', 'pink', 'green', 'blue'];
const SPAN_HUES = ['blue', 'teal', 'violet', 'green', 'pink', 'yellow'];
const safeHue = (name, fallback) => (HUES.includes(name) ? name : fallback);

/* ----------------------------------------------------------------- widget */

export default function create(spec, env) {
  const now = Number.isFinite(spec.now) ? spec.now : 2025;
  const scale = makeScale({ from: spec.from, to: spec.to, fromAgo: spec.fromAgo, toAgo: spec.toAgo, scale: spec.scale, now });
  const isLog = scale.kind === 'log-ago';
  const withCe = spec.era === 'always' ? true : spec.era === 'never' ? false : scale.from < 0;
  const when = (year) => (isLog ? formatAgo(now - year) : formatYear(year, { ce: withCe }));
  const yearOf = (obj, key, agoKey) => (Number.isFinite(obj[agoKey]) ? now - obj[agoKey] : Number(obj[key]));

  const events = (spec.events || []).map((e, i) => ({ ...e, id: e.id != null ? e.id : `e${i + 1}`, year: yearOf(e, 'year', 'ago'), color: safeHue(e.color, 'orange') }))
    .filter((e) => Number.isFinite(e.year));
  const spansIn = (spec.spans || []).map((sp, i) => ({ ...sp, id: sp.id != null ? sp.id : `s${i + 1}`, from: yearOf(sp, 'from', 'fromAgo'), to: yearOf(sp, 'to', 'toAgo') }))
    .filter((sp) => Number.isFinite(sp.from) && Number.isFinite(sp.to) && sp.to > sp.from);
  const spans = spansIn.map((sp, i) => ({ ...sp, color: safeHue(sp.color, SPAN_HUES[i % SPAN_HUES.length]) }));
  const cards = (env.compact ? [] : spec.place || []).map((c, i) => ({
    ...c, id: c.id != null ? c.id : `c${i + 1}`, color: safeHue(c.color, CARD_HUES[i % CARD_HUES.length]),
    answer: Number.isFinite(c.answerAgo) ? now - c.answerAgo : Number.isFinite(c.answer) ? c.answer : null,
  }));
  const anyNote = events.some((e) => e.note) || spans.some((sp) => sp.note);
  const mode = env.compact || spec.static ? 'static' : ['static', 'explore', 'pick', 'place'].includes(spec.mode) ? spec.mode : cards.length ? 'place' : anyNote ? 'explore' : 'static';
  const tappable = mode === 'explore' || mode === 'pick';
  const secret = mode === 'pick' && !!spec.hideLabels;

  let readOnly = !!env.readOnly;
  let selected = null;                 // explore and pick: "event:id" or "span:id"
  const seen = new Set();
  const placed = Object.fromEntries(cards.map((c) => [c.id, null]));
  let active = cards.length ? cards[0].id : null;

  const snap = spec.snap > 0 ? spec.snap : Math.max(1, niceStep(scale.to - scale.from, 200));
  const snapYear = (year) => {
    if (isLog) return Math.round(now - Number((now - year).toPrecision(2)));
    return clamp(Math.round(year / snap) * snap, Math.ceil(scale.from / snap - 1e-9) * snap, Math.floor(scale.to / snap + 1e-9) * snap);
  };

  const fr = frame({ width: 640, height: 200, compact: env.compact, plain: false, label: spec.alt || null, maxWidth: env.compact ? 300 : 760 });
  fr.el.classList.remove('w-fit');     // a timeline reflows to its width instead of being scaled to a height
  const { svg, canvas } = fr;
  const legend = h('ul.tl-legend', { hidden: true });
  const note = mode === 'explore' ? h('div.tl-note.is-empty', 'Tap an event or a period to read about it.') : null;
  const answers = h('ul.tl-answers', { hidden: true });
  const hint = mode === 'place' ? h('p.w-hint', cards.length > 1 ? 'Drag each card to its place on the line.' : 'Drag the card to its place on the line.') : null;
  const scrollHint = h('p.w-hint', { hidden: true }, 'Scroll sideways to see the whole line.');
  for (const el of [scrollHint, legend, note, hint, answers]) if (el) fr.el.insertBefore(el, fr.readouts);

  const keyOf = (kind, id) => `${kind}:${id}`;
  const itemEls = new Map();           // key -> <g>
  const cardEls = new Map();           // id  -> { g, pill, text, stem, dot, w }
  let layoutW = 640;
  let geom = null;                     // { x0, x1, yAxis, laneY(i) } of the current drawing

  /* -------------------------------------------------------------- state */
  function getState() {
    if (mode === 'explore') return { selected: selected ? selected.split(':').slice(1).join(':') : null, seen: Array.from(seen), seenCount: seen.size };
    if (mode === 'pick') return { picked: selected ? selected.split(':').slice(1).join(':') : null, kind: selected ? selected.split(':')[0] : null };
    if (mode === 'place') {
      const count = cards.filter((c) => placed[c.id] != null).length;
      const out = { placed: { ...placed }, count, complete: count === cards.length };
      if (cards.some((c) => c.answer != null)) {
        out.off = {};
        for (const c of cards) if (c.answer != null) out.off[c.id] = placed[c.id] == null ? null : Math.abs(yearsBetween(placed[c.id], c.answer));
        const known = Object.values(out.off);
        out.maxOff = known.length && known.every((v) => v != null) ? Math.max(...known) : null;
      }
      return out;
    }
    return {};
  }

  const describe = () => {
    const parts = [`Timeline from ${when(scale.from)} to ${when(scale.to)}.`];
    if (!secret || readOnly) {
      if (events.length) parts.push(`Events: ${events.map((e) => `${e.label}, ${when(e.year)}`).join('; ')}.`);
      if (spans.length) parts.push(`Periods: ${spans.map((sp) => `${sp.label}, ${when(sp.from)} to ${when(sp.to)}`).join('; ')}.`);
    }
    return parts.join(' ');
  };

  /* ------------------------------------------------------------ drawing */
  function render() {
    const focusKey = typeof document !== 'undefined' && document.activeElement && svg.contains(document.activeElement) ? document.activeElement.dataset.tlKey : null;
    svg.replaceChildren();
    itemEls.clear();
    cardEls.clear();
    const W = layoutW;
    // room at both ends for the first and the last tick label
    const endLabel = isLog ? 0 : Math.max(textWidth(formatYear(scale.from, { ce: withCe }), 12, 600), textWidth(formatYear(scale.to, { ce: withCe }), 12, 600));
    const PAD = Math.round(Math.max(isLog ? 22 : W < 420 ? 12 : 16, Math.min(endLabel / 2 + 4, W * 0.12)));
    const x0 = PAD;
    const x1 = W - PAD;
    const X = (year) => x0 + scale.t(year) * (x1 - x0);
    const codes = secret && !readOnly;

    /* spans: where each bar and its label go. A label sits inside its bar, or beside it; bars that
       would then collide move to another row (unless the author fixed the row), and a label with
       no room at all becomes a letter with a legend entry. */
    const foot = spans.map((sp) => {
      const xa = X(sp.from);
      const xb = Math.max(X(sp.to), xa + 4);
      const tw = sp.label ? textWidth(sp.label) : 0;
      const f = { xa, xb, tw, side: 'in', left: xa, right: xb };
      if (codes) { f.side = 'code'; if (xb - xa < 22) { f.left = (xa + xb) / 2 - 11; f.right = (xa + xb) / 2 + 11; } }
      else if (sp.label && tw + 12 > xb - xa) {
        if (xb + 6 + tw <= W - 3) { f.side = 'right'; f.right = xb + 6 + tw; }
        else if (xa - 6 - tw >= 3) { f.side = 'left'; f.left = xa - 6 - tw; }
        else f.side = 'code';
      }
      return f;
    });
    const rows = assignRows(spans.map((sp, i) => ({ from: foot[i].left - 5, to: foot[i].right + 5, row: sp.row })));
    spans.forEach((sp, i) => {       // a fixed row can still be crowded: then the label gives way
      if (foot[i].side !== 'left' && foot[i].side !== 'right') return;
      const clash = spans.some((o, j) => j !== i && rows[j] === rows[i] && foot[i].left < foot[j].right && foot[j].left < foot[i].right);
      if (clash) { foot[i].side = 'code'; foot[i].left = foot[i].xa; foot[i].right = foot[i].xb; }
    });
    const rowCount = rows.reduce((m, row) => Math.max(m, row + 1), 0);

    /* event labels: full, then short, then numbers */
    const pillH = tappable ? 26 : 22;
    const levelH = pillH + 6;
    const maxLevels = W < 480 ? 3 : 4;
    const evText = (e, useShort) => `${useShort && e.short ? e.short : e.label || ''}${spec.showYears ? ` · ${when(e.year)}` : ''}`;
    let evLayout = null;
    let evMode = 'full';
    if (events.length && !codes) {
      evLayout = staggerLabels(events.map((e) => ({ x: X(e.year), w: textWidth(evText(e, false)) + 16 })), { width: W, gap: 6, maxLevels });
      if (!evLayout && events.some((e) => e.short)) {
        evMode = 'short';
        evLayout = staggerLabels(events.map((e) => ({ x: X(e.year), w: textWidth(evText(e, true)) + 16 })), { width: W, gap: 6, maxLevels });
      }
    }
    if (events.length && !evLayout) {
      evMode = 'code';
      const size = tappable ? 30 : 24;
      evLayout = staggerLabels(events.map((e) => ({ x: X(e.year), w: size })), { width: W, gap: 3, maxLevels: 5 })
        || events.map((e, i) => ({ left: clamp(X(e.year) - size / 2, 0, W - size), w: size, level: i % 4 }));
    }
    const levels = evLayout ? evLayout.reduce((m, l) => Math.max(m, l.level + 1), 0) : 0;

    /* vertical plan */
    const LANE = 44;
    const top = 8;
    const lanes = cards.length * LANE;
    const yAxis = top + lanes + (levels ? levels * levelH + 12 : 0) + (cards.length || levels ? 8 : 10);
    const rowH = tappable ? 36 : 30;
    const barH = tappable ? 28 : 22;
    const captionH = spec.axisLabel || isLog ? 18 : 0;
    const spansTop = yAxis + 32 + captionH;
    const height = rowCount ? spansTop + rowCount * rowH + 2 : yAxis + 30 + captionH;
    geom = { x0, x1, yAxis, laneY: (i) => top + i * LANE + LANE / 2, lanesEnd: top + lanes };

    svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(height));
    fr.el.style.setProperty('--w-aspect', String(Math.round((W / height) * 1000) / 1000));

    /* ticks */
    let tickList;
    if (isLog) {
      const all = agoTicks(now - scale.from, now - scale.to).map((tk) => ({ x: X(now - tk.ago), label: tk.label }));
      const widest = all.reduce((m, tk) => Math.max(m, textWidth(tk.label, 12, 600)), 0) + 12;
      const gap = all.length > 1 ? Math.abs(all[1].x - all[0].x) : W;
      const every = Math.max(1, Math.ceil(widest / Math.max(gap, 1)));
      tickList = all.map((tk, i) => ({ ...tk, label: (all.length - 1 - i) % every === 0 ? tk.label : '' }));
    } else {
      const sample = Math.max(textWidth(formatYear(scale.from, { ce: withCe }), 12, 600), textWidth(formatYear(scale.to, { ce: withCe }), 12, 600)) + 16;
      const room = Math.max(1, Math.floor((x1 - x0) / sample));
      let list = yearTicks(scale.from, scale.to, spec.step || null, { ce: withCe, room });
      if (spec.step > 0 && list.length > room + 1) {
        const every = Math.ceil(list.length / (room + 1));
        list = list.map((tk, i) => (i % every === 0 ? tk : { ...tk, label: '' }));
      }
      tickList = list.map((tk) => ({ x: X(tk.year), label: tk.label }));
    }
    const gAxis = s('g', { 'aria-hidden': 'true' });
    for (const tk of tickList) {
      if (rowCount) gAxis.appendChild(s('line', { x1: tk.x, x2: tk.x, y1: spansTop - 3, y2: height - 2, stroke: 'var(--hair)', 'stroke-width': 1 }));
      gAxis.appendChild(s('line', { x1: tk.x, x2: tk.x, y1: yAxis - (tk.label ? 6 : 4), y2: yAxis + (tk.label ? 6 : 4), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      if (!tk.label) continue;
      const w = textWidth(tk.label, 12, 600);
      const cx0 = clamp(tk.x, w / 2 + 3, W - w / 2 - 3);
      gAxis.appendChild(s('text.tl-tick', { x: cx0, y: yAxis + 21, 'text-anchor': 'middle' }, tk.label));
    }
    gAxis.appendChild(s('line', { x1: x0, x2: x1, y1: yAxis, y2: yAxis, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    if (captionH) gAxis.appendChild(s('text.tl-axis-label', { x: (x0 + x1) / 2, y: yAxis + 38, 'text-anchor': 'middle' }, spec.axisLabel || 'years ago (each step is ten times further back)'));
    svg.appendChild(gAxis);

    const makeButton = (g, key, name) => {
      g.dataset.tlKey = key;
      itemEls.set(key, g);
      if (!tappable) return;
      g.classList.add('is-button');
      g.setAttribute('tabindex', readOnly ? '-1' : '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', name);
      if (mode === 'pick') g.setAttribute('aria-pressed', String(selected === key));
      g.dataset.keys = 'own';
      g.addEventListener('click', () => choose(key));
      g.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(key); return; }
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
        if (!dir) return;
        ev.preventDefault();
        const all = Array.from(itemEls.values());
        all[(all.indexOf(g) + dir + all.length) % all.length].focus();
      });
    };

    // The lines from the dots up to their labels go underneath everything else, so that no label is crossed out.
    const gStems = s('g', { 'aria-hidden': 'true' });
    svg.appendChild(gStems);

    /* spans */
    const legendRows = [];
    spans.forEach((sp, i) => {
      const { xa, xb, side } = foot[i];
      const y = spansTop + rows[i] * rowH + (rowH - barH) / 2;
      const key = keyOf('span', sp.id);
      const letter = LETTERS[i % 26];
      const g = s('g.tl-item');
      g.appendChild(s('rect.tl-bar', { x: xa, y, width: xb - xa, height: barH, rx: 6, fill: hue(sp.color, 'soft'), stroke: hue(sp.color), 'stroke-width': 2 }));
      // a span that runs past an end of the axis is drawn open on that side
      if (sp.from < scale.from) g.appendChild(s('path', { d: `M${xa + 7} ${y + 5} l-4 ${barH / 2 - 5} l4 ${barH / 2 - 5}`, fill: 'none', stroke: hue(sp.color), 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      if (sp.to > scale.to) g.appendChild(s('path', { d: `M${xb - 7} ${y + 5} l4 ${barH / 2 - 5} l-4 ${barH / 2 - 5}`, fill: 'none', stroke: hue(sp.color), 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      const ty = y + barH / 2 + 4.5;
      const text = sp.label || '';
      if (side === 'in' && text) g.appendChild(s('text.tl-span-label', { x: (xa + xb) / 2, y: ty, 'text-anchor': 'middle' }, text));
      else if (side === 'right') g.appendChild(s('text.tl-span-label', { x: xb + 6, y: ty, 'text-anchor': 'start' }, text));
      else if (side === 'left') g.appendChild(s('text.tl-span-label', { x: xa - 6, y: ty, 'text-anchor': 'end' }, text));
      else if (side === 'code') {
        const cxm = clamp((xa + xb) / 2, 12, W - 12);
        if (xb - xa < 22) g.appendChild(s('circle', { cx: cxm, cy: y + barH / 2, r: 10, fill: 'var(--surface)', stroke: hue(sp.color), 'stroke-width': 2 }));
        g.appendChild(s('text.tl-code', { x: cxm, y: ty, 'text-anchor': 'middle' }, letter));
        legendRows.push({ code: letter, label: codes ? null : text, when: codes ? null : `${when(sp.from)} – ${when(sp.to)}` });
      }
      // a generous, invisible target
      g.insertBefore(s('rect', { x: Math.min(foot[i].left, (xa + xb) / 2 - 14), y: spansTop + rows[i] * rowH, width: Math.max(foot[i].right - foot[i].left, 28), height: rowH, fill: 'transparent' }), g.firstChild);
      makeButton(g, key, codes ? `Period ${letter}` : `${text}, ${when(sp.from)} to ${when(sp.to)}`);
      svg.appendChild(g);
    });

    /* events */
    events.forEach((e, i) => {
      const x = X(e.year);
      const lay = evLayout[i];
      const key = keyOf('event', e.id);
      const cy = yAxis - 16 - lay.level * levelH - pillH / 2;
      const g = s('g.tl-item');
      gStems.appendChild(s('line', { x1: x, x2: x, y1: yAxis - 7, y2: cy, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
      if (evMode === 'code') {
        const r = lay.w / 2 - 1;
        g.appendChild(s('circle.tl-pill', { cx: lay.left + lay.w / 2, cy, r }));
        g.appendChild(s('text.tl-code', { x: lay.left + lay.w / 2, y: cy + 4.5, 'text-anchor': 'middle' }, String(i + 1)));
        legendRows.push({ code: String(i + 1), label: codes ? null : e.label, when: codes ? null : when(e.year), first: true });
      } else {
        g.appendChild(s('rect.tl-pill', { x: lay.left + 1, y: cy - pillH / 2, width: lay.w - 2, height: pillH, rx: pillH / 2 }));
        g.appendChild(s('text.tl-label', { x: lay.left + lay.w / 2, y: cy + 4.5, 'text-anchor': 'middle' }, evText(e, evMode === 'short')));
      }
      g.appendChild(s('circle.tl-dot', { cx: x, cy: yAxis, r: 6.5, fill: hue(e.color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
      if (tappable) g.insertBefore(s('circle', { cx: x, cy: yAxis, r: 16, fill: 'transparent' }), g.firstChild);
      makeButton(g, key, codes ? `Event ${i + 1}` : `${e.label}, ${when(e.year)}`);
      svg.appendChild(g);
    });

    /* cards to place */
    const yearRoom = cards.length ? Math.max(textWidth(when(scale.from), 13, 700), textWidth(when(scale.to), 13, 700), textWidth('?', 13, 700)) : 0;
    cards.forEach((c, i) => {
      const y = geom.laneY(i);
      const w = Math.min(W - 4, textWidth(`${c.label} · `, 13, 700) + yearRoom + 22);
      const g = s('g.tl-card', { tabindex: readOnly ? '-1' : '0', role: 'slider', 'aria-label': c.label, 'aria-valuemin': String(Math.round(scale.from)), 'aria-valuemax': String(Math.round(scale.to)) });
      g.dataset.tlKey = keyOf('card', c.id);
      g.dataset.keys = 'own';
      const stem = s('line', { stroke: hue(c.color), 'stroke-width': 2.5, 'stroke-linecap': 'round' });
      const dot = s('path', { fill: hue(c.color), stroke: 'var(--edge-strong)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
      const hit = s('rect', { y: y - LANE / 2, width: w, height: LANE, fill: 'transparent' });
      const pill = s('rect.tl-card-pill', { y: y - 15, width: w, height: 30, rx: 15, fill: hue(c.color, 'soft') });
      const text = s('text.tl-label', { y: y + 4.5, 'text-anchor': 'middle' });
      g.append(stem, dot, hit, pill, text);
      cardEls.set(c.id, { g, pill, hit, text, stem, dot, w, y });
      wireCard(c, g);
      svg.appendChild(g);
    });
    paintCards();

    /* answers revealed once the step is over */
    if (mode === 'place' && readOnly) {
      for (const c of cards) {
        if (c.answer == null) continue;
        const x = X(c.answer);
        svg.appendChild(s('circle', { cx: x, cy: yAxis, r: 5.5, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2, 'aria-hidden': 'true' }));
      }
    }

    /* legend */
    legend.replaceChildren(...legendRows.sort((a, b) => (a.first ? 0 : 1) - (b.first ? 0 : 1)).filter((r) => r.label).map((r) => h('li', h('i', r.code), h('span', r.label), h('small', r.when))));
    legend.hidden = !legend.children.length;

    paintSelection();
    const interactive = tappable || mode === 'place';
    svg.setAttribute('role', interactive ? 'group' : 'img');
    svg.setAttribute('aria-label', spec.alt || describe());
    if (focusKey) { const el = svg.querySelector(`[data-tl-key="${CSS.escape(focusKey)}"]`); if (el) el.focus({ preventScroll: true }); }
  }

  function paintSelection() {
    for (const [key, g] of itemEls) {
      g.classList.toggle('is-on', key === selected);
      if (mode === 'pick') g.setAttribute('aria-pressed', String(key === selected));
    }
  }

  function showNote(key) {
    if (!note) return;
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    const item = kind === 'event' ? events.find((e) => String(e.id) === id) : spans.find((sp) => String(sp.id) === id);
    if (!item) return;
    note.classList.remove('is-empty');
    note.replaceChildren(
      h('b', item.label || ''),
      h('span.tl-when', kind === 'event' ? when(item.year) : `${when(item.from)} – ${when(item.to)}`),
      item.note ? h('span', { html: mdInline(item.note) }) : null,
    );
  }

  function choose(key) {
    if (readOnly) return;
    selected = key;
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    const item = kind === 'event' ? events.find((e) => String(e.id) === id) : spans.find((sp) => String(sp.id) === id);
    play('select');
    paintSelection();
    if (mode === 'explore') {
      seen.add(item.id);
      showNote(key);
      env.announce(`${item.label}, ${kind === 'event' ? when(item.year) : `${when(item.from)} to ${when(item.to)}`}`);
    } else {
      env.announce(secret ? 'Selected' : `${item.label} selected`);
    }
    env.onChange(getState());
  }

  /* ------------------------------------------------------------- cards */
  const pointerX = (ev) => {
    const box = svg.getBoundingClientRect();
    return ((ev.clientX - box.left) / Math.max(box.width, 1)) * layoutW;
  };

  function paintCards() {
    if (!geom) return;
    const { x0, x1, yAxis } = geom;
    for (const c of cards) {
      const el = cardEls.get(c.id);
      if (!el) continue;
      const year = placed[c.id];
      const on = year != null;
      const x = on ? x0 + scale.t(year) * (x1 - x0) : x0 + el.w / 2;
      const left = clamp(x - el.w / 2, 2, layoutW - el.w - 2);
      el.pill.setAttribute('x', left);
      el.hit.setAttribute('x', left);
      el.text.setAttribute('x', left + el.w / 2);
      el.text.textContent = `${c.label} · ${on ? when(year) : '?'}`;
      el.g.classList.toggle('is-unplaced', !on);
      el.stem.setAttribute('visibility', on ? 'visible' : 'hidden');
      el.dot.setAttribute('visibility', on ? 'visible' : 'hidden');
      if (on) {
        const sx = clamp(x, left + 12, left + el.w - 12);
        el.stem.setAttribute('x1', sx); el.stem.setAttribute('y1', el.y + 15);
        el.stem.setAttribute('x2', x); el.stem.setAttribute('y2', yAxis - 9);
        el.dot.setAttribute('d', `M${x} ${yAxis - 1} l-7 -11 h14 Z`);
      }
      el.g.setAttribute('aria-valuenow', String(Math.round(on ? year : scale.from)));
      el.g.setAttribute('aria-valuetext', on ? when(year) : 'not placed yet');
    }
  }

  function moveCard(id, year, done) {
    if (readOnly) return;
    const next = clamp(year, scale.from, scale.to);
    const changed = placed[id] !== next;
    placed[id] = next;
    active = id;
    paintCards();
    if (done) {
      const card = cards.find((c) => c.id === id);
      play('drop');
      env.announce(`${card.label}: ${when(next)}`);
      env.onChange(getState());
    }
    void changed;
  }

  // Tapping the line (anywhere below the cards) brings the card last touched to that year.
  if (mode === 'place') {
    fr.el.classList.add('is-place');
    svg.addEventListener('click', (ev) => {
      if (readOnly || active == null || !geom || (ev.target.closest && ev.target.closest('.tl-card'))) return;
      const box = svg.getBoundingClientRect();
      const y = ((ev.clientY - box.top) / Math.max(box.height, 1)) * (svg.viewBox.baseVal.height || 1);
      if (y < geom.lanesEnd) return;
      moveCard(active, snapYear(scale.year((pointerX(ev) - geom.x0) / (geom.x1 - geom.x0))), true);
    });
  }

  function wireCard(card, g) {
    let drag = null;
    g.addEventListener('focus', () => { active = card.id; });
    g.addEventListener('pointerdown', (ev) => {
      if (readOnly || ev.button > 0) return;
      const { x0, x1 } = geom;
      const px = pointerX(ev);
      const at = placed[card.id] != null ? x0 + scale.t(placed[card.id]) * (x1 - x0) : px;
      drag = { id: ev.pointerId, dx: at - px, moved: false, startX: px };
      active = card.id;
      g.classList.add('is-dragging');
      try { g.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      ev.preventDefault();
      g.focus({ preventScroll: true });
    });
    g.addEventListener('pointermove', (ev) => {
      if (!drag || drag.id !== ev.pointerId) return;
      const px = pointerX(ev);
      if (!drag.moved && Math.abs(px - drag.startX) < 3) return;
      drag.moved = true;
      const { x0, x1 } = geom;
      moveCard(card.id, snapYear(scale.year((px + drag.dx - x0) / (x1 - x0))), false);
    });
    const up = (ev) => {
      if (!drag || drag.id !== ev.pointerId) return;
      const moved = drag.moved;
      drag = null;
      g.classList.remove('is-dragging');
      if (moved && placed[card.id] != null) moveCard(card.id, placed[card.id], true);
    };
    g.addEventListener('pointerup', up);
    g.addEventListener('pointercancel', up);
    g.addEventListener('keydown', (ev) => {
      if (readOnly) return;
      const cur = placed[card.id];
      const big = ev.shiftKey ? 10 : 1;
      let next = null;
      const stepBy = (dir) => {
        if (cur == null) return snapYear(scale.year(0.5));
        if (isLog) return snapYear(scale.year(clamp(scale.t(cur) + dir * 0.01 * big, 0, 1)));
        return snapYear(cur + dir * snap * big);
      };
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') next = stepBy(-1);
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') next = stepBy(1);
      else if (ev.key === 'PageDown') next = cur == null ? snapYear(scale.year(0.5)) : isLog ? snapYear(scale.year(clamp(scale.t(cur) - 0.1, 0, 1))) : snapYear(cur - snap * 10);
      else if (ev.key === 'PageUp') next = cur == null ? snapYear(scale.year(0.5)) : isLog ? snapYear(scale.year(clamp(scale.t(cur) + 0.1, 0, 1))) : snapYear(cur + snap * 10);
      else if (ev.key === 'Home') next = snapYear(scale.from);
      else if (ev.key === 'End') next = snapYear(scale.to);
      else return;
      ev.preventDefault();
      ev.stopPropagation();
      moveCard(card.id, next, true);
    });
  }

  function showAnswers() {
    const rows = cards.filter((c) => c.answer != null);
    answers.hidden = !(readOnly && rows.length);
    if (answers.hidden) return;
    answers.replaceChildren(...rows.map((c) => {
      const mine = placed[c.id];
      const off = mine == null ? null : Math.abs(yearsBetween(mine, c.answer));
      const tail = mine == null ? '' : off === 0 ? ' Exactly where you put it.' : ` You chose ${when(mine)}${isLog ? '' : `, ${off.toLocaleString('en-US')} year${off === 1 ? '' : 's'} away`}.`;
      return h('li', h('i.tl-key', { 'aria-hidden': 'true' }), h('b', `${c.label}: `), `${when(c.answer)}.`, tail);
    }));
  }

  /* -------------------------------------------------------------- sizing */
  const minWidth = !env.compact && spec.minWidth > 0 ? spec.minWidth : 0;
  let lastAt = 0;
  function fit(force) {
    const avail = canvas.clientWidth || 0;
    if (!avail) return;
    const want = Math.max(Math.round(avail), minWidth, 200);
    // A scrollbar that comes and goes changes the width by a few pixels; do not chase it.
    const stamp = typeof performance !== 'undefined' ? performance.now() : 0;
    if (!force && (want === layoutW || (Math.abs(want - layoutW) < 20 && stamp - lastAt < 250))) return;
    layoutW = want;
    lastAt = stamp;
    const scrolls = minWidth > Math.round(avail);
    canvas.classList.toggle('is-scroll', scrolls);
    scrollHint.hidden = !scrolls;
    if (scrolls) { canvas.tabIndex = 0; canvas.setAttribute('role', 'group'); canvas.setAttribute('aria-label', 'Timeline. Scroll sideways to see all of it.'); }
    else { canvas.removeAttribute('tabindex'); canvas.removeAttribute('role'); canvas.removeAttribute('aria-label'); }
    render();
  }
  const watcher = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit(false)) : null;
  if (watcher) watcher.observe(canvas);
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (fr.el.isConnected) fit(true); }).catch(() => {});

  if (readOnly) fr.el.classList.add('is-readonly');
  render();
  showAnswers();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'place' && next.placed && typeof next.placed === 'object') {
        for (const c of cards) if (c.id in next.placed) placed[c.id] = next.placed[c.id] == null ? null : clamp(Number(next.placed[c.id]), scale.from, scale.to);
        paintCards();
      } else if (tappable) {
        const known = (id) => events.some((e) => e.id === id) || spans.some((sp) => sp.id === id);
        // explore: a solution can say which notes have been read, { seen: ['a', 'b', 'c'] }; the last one is opened
        const read = mode === 'explore' ? exploreState(next, known) : null;
        if (read && read.seen) { seen.clear(); for (const id of read.seen) seen.add(id); }
        const id = mode === 'pick' ? next.picked : read.selected;
        const key = id == null ? null : events.some((e) => e.id === id) ? keyOf('event', id) : spans.some((sp) => sp.id === id) ? keyOf('span', id) : null;
        selected = key;
        if (key && mode === 'explore') { seen.add(id); showNote(key); }
        paintSelection();
      }
    },
    setReadOnly(value) {
      readOnly = !!value;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hint) hint.hidden = readOnly;
      render();
      showAnswers();
    },
    destroy() { if (watcher) watcher.disconnect(); },
  };
}

export const examples = [
  {
    title: 'timeline — events and spans (explore)',
    note: 'Tap an event or a period to read about it.',
    spec: {
      type: 'timeline', from: -3000, to: 2000,
      events: [
        { id: 'pyramid', year: -2560, label: 'Great Pyramid', short: 'Pyramid', color: 'orange', note: 'Built for the pharaoh Khufu at Giza. It stayed the tallest building on Earth for almost 4,000 years.' },
        { id: 'rome', year: -753, label: 'Rome founded', short: 'Rome', color: 'red', note: 'The traditional date; the real beginnings were gradual.' },
        { id: 'press', year: 1450, label: 'Printing press', short: 'Press', color: 'violet', note: 'Gutenberg\'s movable type made books cheap enough to spread ideas quickly.' },
      ],
      spans: [
        { id: 'egypt', from: -3000, to: -30, label: 'Ancient Egypt', color: 'yellow', note: 'About three thousand years, from the first pharaohs to the Roman conquest.' },
        { id: 'han', from: -206, to: 220, label: 'Han dynasty', color: 'teal', note: 'Four centuries that shaped China; the majority people of China still call themselves Han.' },
        { id: 'rome-empire', from: -27, to: 476, label: 'Roman Empire (West)', color: 'red', row: 1, note: 'From Augustus to the fall of the western half.' },
        { id: 'maya', from: 250, to: 900, label: 'Classic Maya', color: 'green', note: 'City-states with writing, astronomy and a calendar.' },
      ],
    },
  },
  {
    title: 'timeline — place the cards (graded with a tolerance)',
    note: 'state.placed gives the chosen year of each card. Drag, or focus a card and use the arrow keys.',
    spec: {
      type: 'timeline', from: 1400, to: 2000, step: 100, snap: 10,
      spans: [{ id: 'ming', from: 1368, to: 1644, label: 'Ming dynasty', color: 'teal' }, { id: 'ind', from: 1760, to: 1840, label: 'Industrial Revolution', color: 'gray' }],
      events: [{ id: 'columbus', year: 1492, label: 'Columbus sails', color: 'gray' }],
      place: [
        { id: 'press', label: 'Printing press', answer: 1450 },
        { id: 'moon', label: 'Moon landing', answer: 1969 },
      ],
    },
  },
  {
    title: 'timeline — pick the period (names hidden until answered)',
    spec: {
      type: 'timeline', from: -600, to: 600, mode: 'pick', hideLabels: true,
      spans: [
        { id: 'republic', from: -509, to: -27, label: 'Roman Republic', color: 'orange' },
        { id: 'empire', from: -27, to: 476, label: 'Roman Empire (West)', color: 'red' },
        { id: 'han', from: -206, to: 220, label: 'Han dynasty', color: 'teal' },
      ],
      events: [{ id: 'caesar', year: -44, label: 'Caesar killed', color: 'violet' }],
    },
  },
  {
    title: 'timeline — deep time on a log scale',
    note: 'scale: "log-ago". Every step to the left is ten times further back.',
    spec: {
      type: 'timeline', scale: 'log-ago', fromAgo: 5e9, toAgo: 1000, now: 2025,
      events: [
        { id: 'earth', ago: 4.54e9, label: 'Earth forms', short: 'Earth', color: 'blue', note: 'About 4.54 billion years ago.' },
        { id: 'dino', ago: 66e6, label: 'Dinosaurs die out', short: 'Dinosaurs', color: 'red', note: 'An asteroid impact ends the Cretaceous.' },
        { id: 'sapiens', ago: 3e5, label: 'Homo sapiens', short: 'Humans', color: 'orange', note: 'The oldest known fossils of our species are about 300,000 years old.' },
        { id: 'farming', ago: 11000, label: 'Farming begins', short: 'Farming', color: 'green', note: 'In several places independently, from about 11,000 years ago.' },
      ],
      spans: [{ id: 'life', fromAgo: 3.7e9, toAgo: 1000, label: 'Life on Earth', color: 'green' }],
    },
  },
  {
    title: 'timeline — a long axis that scrolls inside its frame on a narrow screen',
    note: 'minWidth: 860. The page itself never scrolls sideways.',
    spec: {
      type: 'timeline', from: 1900, to: 2000, step: 10, minWidth: 860, showYears: true,
      events: [
        { year: 1903, label: 'First powered flight' }, { year: 1928, label: 'Penicillin', color: 'green' }, { year: 1945, label: 'United Nations', color: 'blue' },
        { year: 1957, label: 'Sputnik', color: 'violet' }, { year: 1969, label: 'Moon landing', color: 'violet' }, { year: 1989, label: 'World Wide Web', color: 'teal' },
      ],
      spans: [{ from: 1914, to: 1918, label: 'First World War', color: 'red' }, { from: 1939, to: 1945, label: 'Second World War', color: 'red' }, { from: 1947, to: 1991, label: 'Cold War', color: 'gray' }],
    },
  },
  {
    title: 'timeline — many events (numbered, with a legend, on a narrow screen)',
    spec: {
      type: 'timeline', from: 1750, to: 1950, showYears: false,
      events: [
        { year: 1776, label: 'US independence' }, { year: 1789, label: 'French Revolution' }, { year: 1804, label: 'Haiti independent' },
        { year: 1815, label: 'Waterloo' }, { year: 1848, label: 'Revolutions of 1848' }, { year: 1861, label: 'Italy unified' },
        { year: 1868, label: 'Meiji Restoration' }, { year: 1914, label: 'First World War begins' }, { year: 1917, label: 'Russian Revolution' },
      ],
    },
  },
];
