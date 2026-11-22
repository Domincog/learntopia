/**
 * dot-rectangles — n dots dealt into equal rows. Change the number of rows and
 * see whether the dots fill a rectangle or leave some over: a picture of
 * "does r divide n?", of factor pairs, and of primes (numbers whose dots only
 * ever make a single line).
 *
 * {
 *   type: 'dot-rectangles',
 *   n: 24,              // number of dots
 *   rows: 1,            // starting number of rows
 *   nRange: [20, 30],   // optional: adds a second slider so the learner can change n
 *   maxRows: 24,        // optional cap for the rows slider (default: n)
 *   collect: true,      // list the full rectangles found so far (tap one to jump back to it)
 *   status: true,       // the sentence under the picture ("4 rows of 6 …"); default: on unless static
 *   color: 'blue',      // palette colour of the dots
 *   static: false,      // true: picture only, no controls (for figures); drawn just tall enough for its dots
 *   maxWidth: 360,      // optional: limit the width in px (handy for small static pictures)
 * }
 *
 * The dots are dealt out like cards, one to each row in turn, so every column
 * is full except possibly the last. Dots in an unfinished last column are the
 * remainder; they are drawn in orange next to dashed "missing" places.
 *
 * State: { n, rows, cols, remainder, fits, found, factors, complete }
 *   cols      — full columns: floor(n / rows)
 *   remainder — dots left over: n mod rows
 *   fits      — the remainder is 0, so the dots make a full rows × cols rectangle
 *   found     — the row counts (sorted) for which the learner has seen a full rectangle, for the current n
 *   factors   — every factor of n (sorted)
 *   complete  — `found` contains every factor of n
 *
 * setState accepts { n, rows, found }.
 */
import { frame, sliderRow, hue, s, h, clamp, mdInline, icon, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 520;
const H = 300;
const PAD = 24;
const MAX_PITCH = 46;
const MAX_DOTS = 120;

addStyles('dot-rectangles', `
  /* nothing in the picture is dragged, so a finger that lands on it may still scroll the page */
  .widget-dot-rectangles .w-canvas svg { touch-action: manipulation; }
  .widget-dot-rectangles .dr-dot { transition: transform 0.3s var(--ease-out); }
  .widget-dot-rectangles .dr-status {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0 var(--s2);
    min-height: 2.9em;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    line-height: 1.35;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  .widget-dot-rectangles .dr-status svg { flex: none; color: var(--green-text); }
  .widget-dot-rectangles .dr-status-eq { white-space: nowrap; }
  .widget-dot-rectangles .dr-status.is-fit { border-style: solid; border-color: var(--green); background: var(--green-soft); }
  .widget-dot-rectangles .dr-found { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); min-height: 40px; }
  .widget-dot-rectangles .dr-found-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-dot-rectangles .dr-chip {
    min-height: 40px; min-width: 48px;
    padding: 0.2rem 0.65rem;
    border: var(--bw) solid var(--edge);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums;
    white-space: nowrap;
    animation: pop-in 0.25s var(--ease-spring) both;
    -webkit-tap-highlight-color: transparent;
  }
  .widget-dot-rectangles .dr-chip[aria-pressed='true'] { background: var(--green-soft); border-color: var(--green); }
  .widget-dot-rectangles.is-readonly .dr-chip { pointer-events: none; }
`);

const factorsOf = (n) => { const out = []; for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d); return out; };

export default function create(spec, env) {
  const interactive = !env.compact && !spec.static;
  const range = Array.isArray(spec.nRange)
    ? [clamp(Math.round(spec.nRange[0]), 1, MAX_DOTS), clamp(Math.round(spec.nRange[1]), 1, MAX_DOTS)].sort((p, q) => p - q)
    : null;
  let n = clamp(Math.round(spec.n || (range ? range[0] : 12)), range ? range[0] : 1, range ? range[1] : MAX_DOTS);
  const maxN = range ? range[1] : n;
  const rowCap = (k) => Math.max(1, Math.min(k, spec.maxRows || k));
  let rows = clamp(Math.round(spec.rows || 1), 1, rowCap(n));
  const color = spec.color || 'blue';
  const collect = spec.collect !== false && interactive;
  const showStatus = spec.status != null ? !!spec.status : interactive;
  let readOnly = !!env.readOnly;
  const foundByN = new Map(); // n -> Set of row counts that gave a full rectangle

  // A picture that never changes is drawn just tall enough for its dots.
  let height = H;
  if (!interactive) {
    const shown = Math.ceil(n / rows);
    height = Math.max(70, Math.round(rows * Math.min(MAX_PITCH, (W - 2 * PAD) / shown) + 2 * PAD));
  }
  const fr = frame({ width: W, height, compact: env.compact, maxWidth: spec.maxWidth || null, label: spec.alt || 'Dots arranged in rows' });
  const { svg } = fr;

  /* ------------------------------------------------------------ drawing */
  const outline = s('rect', { fill: hue('green', 'soft'), stroke: hue('green'), 'stroke-width': 3 });
  const gGhost = s('g');
  const gDots = s('g');
  svg.append(outline, gGhost, gDots);
  const dots = [];
  for (let i = 0; i < maxN; i++) {
    const dot = s('circle.dr-dot', { r: 8, stroke: 'var(--edge-strong)' });
    dots.push(dot);
    gDots.appendChild(dot);
  }

  const status = h('div.dr-status', { 'aria-live': 'polite' });
  const foundRow = h('div.dr-found');
  // The sentence sits below the sliders, so nothing above a slider changes height while it is dragged.
  if (showStatus && !env.compact) fr.el.insertBefore(status, fr.buttons);
  if (collect) fr.el.appendChild(foundRow);

  const foundSet = () => {
    if (!foundByN.has(n)) foundByN.set(n, new Set());
    return foundByN.get(n);
  };

  function geometry() {
    const cols = Math.floor(n / rows);
    const remainder = n % rows;
    const shown = cols + (remainder ? 1 : 0);
    const pitch = Math.min(MAX_PITCH, (W - 2 * PAD) / shown, (height - 2 * PAD) / rows);
    return { cols, remainder, shown, pitch, x0: (W - shown * pitch) / 2, y0: (height - rows * pitch) / 2 };
  }

  function describe(cols, remainder) {
    const rowWord = rows === 1 ? 'row' : 'rows';
    if (!remainder) return [`**${rows} ${rowWord} of ${cols}**: a full rectangle.`, `$${n} = ${rows} \\times ${cols}$`];
    return [`**${rows} ${rowWord}**: ${remainder} ${remainder === 1 ? 'dot is' : 'dots are'} left over.`, `$${n} = ${rows} \\times ${cols} + ${remainder}$`];
  }

  function drawFound() {
    if (!collect) return;
    const list = Array.from(foundSet()).sort((p, q) => p - q);
    foundRow.replaceChildren(h('span.dr-found-label', list.length ? 'Full rectangles found:' : 'No full rectangle found yet'));
    for (const r of list) {
      const chip = h('button.dr-chip', {
        type: 'button',
        'aria-pressed': String(r === rows),
        'aria-label': `${r} ${r === 1 ? 'row' : 'rows'} of ${n / r}. Show this rectangle.`,
      }, `${r} × ${n / r}`);
      chip.addEventListener('click', () => { if (!readOnly) setRows(r, true); });
      foundRow.appendChild(chip);
    }
  }

  function render() {
    const { cols, remainder, pitch, x0, y0 } = geometry();
    const rad = Math.max(2, pitch * 0.36);
    const strokeW = pitch >= 22 ? 2.5 : pitch >= 13 ? 1.75 : 1;
    dots.forEach((dot, k) => {
      if (k >= n) { dot.style.display = 'none'; return; }
      const col = Math.floor(k / rows);
      const row = k % rows;
      dot.style.display = '';
      dot.style.transform = `translate(${(x0 + (col + 0.5) * pitch).toFixed(2)}px, ${(y0 + (row + 0.5) * pitch).toFixed(2)}px)`;
      dot.setAttribute('r', rad.toFixed(2));
      dot.setAttribute('stroke-width', strokeW);
      dot.setAttribute('fill', remainder && col === cols ? hue('orange') : hue(color));
    });

    // the places the unfinished last column is missing
    while (gGhost.firstChild) gGhost.removeChild(gGhost.firstChild);
    if (remainder) {
      for (let row = remainder; row < rows; row++) {
        gGhost.appendChild(s('circle', {
          cx: x0 + (cols + 0.5) * pitch, cy: y0 + (row + 0.5) * pitch, r: rad,
          fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': Math.min(2, strokeW), 'stroke-dasharray': pitch >= 13 ? '4 4' : '2 2',
        }));
      }
    }

    const margin = Math.min(7, pitch * 0.14 + 2);
    if (remainder) outline.setAttribute('visibility', 'hidden');
    else {
      outline.setAttribute('visibility', 'visible');
      outline.setAttribute('x', x0 - margin);
      outline.setAttribute('y', y0 - margin);
      outline.setAttribute('width', cols * pitch + 2 * margin);
      outline.setAttribute('height', rows * pitch + 2 * margin);
      outline.setAttribute('rx', Math.min(16, pitch * 0.5 + margin));
    }

    const [sentence, equation] = describe(cols, remainder);
    status.replaceChildren(
      remainder ? '' : icon('check', { size: 20, stroke: 3 }),
      h('span', { html: mdInline(sentence) }),
      h('span.dr-status-eq', { html: mdInline(equation) }),
    );
    status.classList.toggle('is-fit', !remainder);
    svg.setAttribute('aria-label', remainder
      ? `${n} dots in ${rows} rows: ${cols} full columns and ${remainder} left over.`
      : `${n} dots in ${rows} ${rows === 1 ? 'row' : 'rows'} of ${cols}: a full rectangle.`);
    drawFound();
  }

  /* ----------------------------------------------------------- controls */
  let rowSlider = null;
  let nSlider = null;

  function buildRowSlider() {
    const row = sliderRow({
      label: 'rows', min: 1, max: Math.max(2, rowCap(n)), step: 1, value: rows, color,
      onInput: (v) => { if (readOnly) { row.set(rows); return; } setRows(v, true); },
    });
    row.setDisabled(readOnly);
    if (rowSlider) fr.controls.replaceChild(row.el, rowSlider.el); else fr.controls.appendChild(row.el);
    rowSlider = row;
  }

  function setRows(v, notify) {
    const next = clamp(Math.round(v), 1, rowCap(n));
    const changed = next !== rows;
    rows = next;
    let isNew = false;
    if (n % rows === 0 && !foundSet().has(rows)) { foundSet().add(rows); isNew = true; }
    if (rowSlider && rowSlider.value !== rows) rowSlider.set(rows);
    render();
    if (notify && (changed || isNew)) {
      if (isNew) play('select');
      env.onChange(getState());
    }
  }

  function setN(v, notify) {
    const next = clamp(Math.round(v), range ? range[0] : 1, maxN);
    if (next === n) return;
    n = next;
    rows = clamp(rows, 1, rowCap(n));
    if (n % rows === 0) foundSet().add(rows);
    if (interactive) buildRowSlider();
    if (nSlider && nSlider.value !== n) nSlider.set(n);
    render();
    if (notify) env.onChange(getState());
  }

  if (interactive) {
    if (range && range[1] > range[0]) {
      nSlider = sliderRow({
        label: 'dots', min: range[0], max: range[1], step: 1, value: n, color: 'teal',
        onInput: (v) => { if (readOnly) { nSlider.set(n); return; } setN(v, true); },
      });
      fr.controls.appendChild(nSlider.el);
    }
    buildRowSlider();
  }

  function getState() {
    const factors = factorsOf(n);
    const found = Array.from(foundSet()).sort((p, q) => p - q);
    return {
      n,
      rows,
      cols: Math.floor(n / rows),
      remainder: n % rows,
      fits: n % rows === 0,
      found,
      factors,
      complete: found.length === factors.length,
    };
  }

  if (n % rows === 0) foundSet().add(rows);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.n != null) setN(next.n, false);
      if (Array.isArray(next.found)) {
        const set = foundSet();
        set.clear();
        for (const r of next.found) if (Number.isInteger(r) && r >= 1 && n % r === 0) set.add(r);
      }
      setRows(next.rows != null ? next.rows : rows, false);
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (rowSlider) rowSlider.setDisabled(readOnly);
      if (nSlider) nSlider.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'dot-rectangles — which row counts make a rectangle?', spec: { type: 'dot-rectangles', n: 24, rows: 5 } },
  { title: 'dot-rectangles — the learner also picks the number of dots', spec: { type: 'dot-rectangles', n: 24, rows: 4, nRange: [20, 30] } },
  { title: 'dot-rectangles — static picture', spec: { type: 'dot-rectangles', n: 7, rows: 1, static: true } },
];
