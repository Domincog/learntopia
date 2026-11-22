/**
 * euclid-rect — the greatest common divisor as a tiling problem.
 *
 *   mode 'tile'  Choose the side of a square tile and see whether tiles of that
 *                size cover the a × b rectangle exactly. The sizes that work
 *                are the common divisors of a and b; the largest is the gcd.
 *   mode 'cut'   Euclid's algorithm as geometry: cut the biggest possible
 *                square off the rectangle, again and again, until nothing is
 *                left. The side of the last square is the gcd, and each batch
 *                of equal squares is one division line (48 = 2 × 18 + 12).
 *
 * {
 *   type: 'euclid-rect',
 *   a: 48, b: 18,        // width and height of the rectangle (whole numbers)
 *   mode: 'cut',         // 'cut' | 'tile'
 *   unit: 'cm',          // optional unit for the side labels
 *   tile: 1,             // tile mode: starting tile side
 *   collect: true,       // tile mode: list the tile sizes found to fit (tap one to jump back to it)
 *   status: true,        // tile mode: the sentence under the picture ("6 cm tiles fit exactly …")
 *   cuts: 0,             // cut mode: squares already cut off when the figure appears
 *   log: true,           // cut mode: list each division line once all squares of that size are cut
 *   static: false,       // true: picture only (for figures)
 * }
 *
 * State, tile mode: { mode, a, b, tile, across, down, gapWidth, gapHeight, fits, found, common, complete }
 *   across, down        — whole tiles that fit along the width and the height
 *   gapWidth, gapHeight — what is left uncovered along each side (a mod tile, b mod tile)
 *   fits                — both gaps are 0
 *   found               — the tile sides (sorted) the learner has seen fit exactly
 *   common              — every tile side that fits: the common divisors of a and b (sorted)
 *   complete            — `found` contains all of them
 *
 * State, cut mode: { mode, a, b, cuts, total, squares, steps, remaining, done, last }
 *   cuts      — squares cut off so far;  total — squares needed to use up the rectangle
 *   squares   — what has been cut, grouped by size, in order: [{ side: 18, count: 2 }, …]
 *   steps     — the finished division lines: [{ a: 48, b: 18, q: 2, r: 12 }, …]
 *   remaining — { w, h } of the piece still uncut, or null when nothing is left
 *   done      — nothing is left;  last — side of the most recent square (the gcd once done)
 *
 * setState accepts { tile, found } in tile mode, and { cuts } or { done: true } in cut mode.
 */
import { frame, sliderRow, button, hue, s, h, clamp, mdInline, icon, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const PAD_L = 40;
const PAD_R = 14;
const PAD_T = 38;
const PAD_B = 14;
const MAX_H = 320;
const PHASE_HUES = ['blue', 'orange', 'green', 'violet', 'teal', 'pink', 'yellow'];
let seq = 0;

addStyles('euclid-rect', `
  /* nothing in the picture is dragged, so a finger that lands on it may still scroll the page */
  .widget-euclid-rect .w-canvas svg { touch-action: manipulation; }
  .widget-euclid-rect .er-rest { cursor: pointer; }
  .widget-euclid-rect.is-readonly .er-rest { cursor: default; }
  .widget-euclid-rect .er-status {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0 var(--s2);
    min-height: 2.9em;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    line-height: 1.35;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  .widget-euclid-rect .er-status svg { flex: none; color: var(--green-text); }
  .widget-euclid-rect .er-status.is-fit { border-style: solid; border-color: var(--green); background: var(--green-soft); }
  .widget-euclid-rect .er-nowrap { white-space: nowrap; }
  .widget-euclid-rect .er-found { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); min-height: 40px; }
  .widget-euclid-rect .er-found-label { font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-euclid-rect .er-chip {
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
  .widget-euclid-rect .er-chip[aria-pressed='true'] { background: var(--green-soft); border-color: var(--green); }
  .widget-euclid-rect.is-readonly .er-chip { pointer-events: none; }
  .widget-euclid-rect .er-log { display: grid; gap: 2px; justify-items: center; min-height: 1.8em; font-size: 1.1rem; }
  .widget-euclid-rect .er-log:empty { display: none; }
  .widget-euclid-rect .er-line { animation: rise-in 0.3s var(--ease-out) both; }
  .widget-euclid-rect .er-result {
    margin-top: var(--s2);
    padding: var(--s1) var(--s4);
    border: var(--bw) solid var(--green);
    border-radius: var(--r);
    background: var(--green-soft);
    font-size: var(--fs-md);
    text-align: center;
  }
`);

export default function create(spec, env) {
  const a = clamp(Math.round(spec.a || 48), 1, 400);
  const b = clamp(Math.round(spec.b || 18), 1, 400);
  const mode = spec.mode === 'tile' ? 'tile' : 'cut';
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const interactive = !env.compact && !spec.static;
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------ geometry */
  const k = Math.min((W - PAD_L - PAD_R) / a, MAX_H / b); // pixels per unit
  const rw = a * k;
  const rh = b * k;
  const ox = PAD_L + (W - PAD_L - PAD_R - rw) / 2;
  const oy = PAD_T;
  const height = Math.round(PAD_T + rh + PAD_B);
  const px = (u) => ox + u * k;
  const py = (u) => oy + u * k;

  const fr = frame({ width: W, height, plain: true, compact: env.compact, label: spec.alt || `A ${a} by ${b} rectangle` });
  const { svg } = fr;
  const hatchId = `er-hatch-${++seq}`;
  svg.appendChild(s('defs', s('pattern', { id: hatchId, patternUnits: 'userSpaceOnUse', width: 9, height: 9, patternTransform: 'rotate(45)' },
    s('line', { x1: 0, y1: 0, x2: 0, y2: 9, stroke: hue('red'), 'stroke-width': 5 }))));

  // Only gBody takes pointer events (the uncut piece is tappable); everything drawn above it lets taps through.
  const gBody = s('g');
  const gUnits = s('g', { opacity: 0.13, style: 'pointer-events:none' });
  const gOver = s('g', { style: 'pointer-events:none' });
  svg.append(gBody, gUnits, gOver);
  if (k >= 7) {
    let d = '';
    for (let i = 1; i < a; i++) d += `M${px(i).toFixed(2)} ${oy}V${oy + rh}`;
    for (let j = 1; j < b; j++) d += `M${ox} ${py(j).toFixed(2)}H${ox + rw}`;
    gUnits.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1 }));
  }
  svg.appendChild(s('rect', { x: ox, y: oy, width: rw, height: rh, rx: 2, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', style: 'pointer-events:none' }));
  svg.appendChild(s('text.fig-label', { x: ox + rw / 2, y: oy - 13, 'text-anchor': 'middle' }, `${a}${unit}`));
  const ly = oy + rh / 2;
  svg.appendChild(s('text.fig-label', { x: ox - 14, y: ly, 'text-anchor': 'middle', transform: `rotate(-90 ${ox - 14} ${ly})` }, `${b}${unit}`));

  // A number in the middle of a square, with a halo in the square's own colour so grid lines never cut through it.
  const boxLabel = (x, y, size, text, fill, back) => {
    if (size < 16 + 9 * text.length) return null;
    return s('text', {
      class: size >= 46 ? 'fig-label-lg' : 'fig-label', x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      style: `fill:${fill};paint-order:stroke;stroke:${back};stroke-width:7px;stroke-linejoin:round`,
    }, text);
  };

  /* ================================================================ tile */
  let tile = clamp(Math.round(spec.tile || 1), 1, Math.min(a, b));
  const status = h('div.er-status', { 'aria-live': 'polite' });
  const foundRow = h('div.er-found');
  const found = new Set();
  const collect = mode === 'tile' && spec.collect !== false && interactive;
  const common = [];
  for (let d = 1; d <= Math.min(a, b); d++) if (a % d === 0 && b % d === 0) common.push(d);
  let tileSlider = null;

  const tileFacts = () => {
    const across = Math.floor(a / tile);
    const down = Math.floor(b / tile);
    const gapWidth = a % tile;
    const gapHeight = b % tile;
    return { across, down, gapWidth, gapHeight, fits: !gapWidth && !gapHeight };
  };

  function renderTile() {
    const { across, down, gapWidth, gapHeight, fits } = tileFacts();
    gBody.replaceChildren();
    gOver.replaceChildren();
    const tw = across * tile;
    const th = down * tile;
    gBody.appendChild(s('rect', { x: ox, y: oy, width: tw * k, height: th * k, fill: hue(fits ? 'green' : 'blue', 'soft') }));
    const gap = (x, y, w, hh) => {
      if (w <= 0 || hh <= 0) return;
      gBody.appendChild(s('rect', { x: px(x), y: py(y), width: w * k, height: hh * k, fill: hue('red', 'soft') }));
      gBody.appendChild(s('rect', { x: px(x), y: py(y), width: w * k, height: hh * k, fill: `url(#${hatchId})`, opacity: 0.55 }));
    };
    gap(tw, 0, gapWidth, b);
    gap(0, th, tw, gapHeight);
    let d = '';
    for (let i = 0; i <= across; i++) d += `M${px(i * tile).toFixed(2)} ${oy}V${py(th).toFixed(2)}`;
    for (let j = 0; j <= down; j++) d += `M${ox} ${py(j * tile).toFixed(2)}H${px(tw).toFixed(2)}`;
    gOver.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': tile * k >= 14 ? 2.5 : 1.25, 'stroke-linecap': 'square' }));

    const name = `**${tile}${unit} tiles**`;
    let sentence;
    let detail = '';
    if (fits) {
      sentence = `${name} fit exactly:`;
      detail = `${across} across, ${down} down`;
    } else if (gapWidth && gapHeight) {
      sentence = `${name} leave gaps along both sides.`;
    } else if (gapWidth) {
      sentence = `${name} leave a gap along the width:`;
      detail = `$${a} = ${across} \\times ${tile} + ${gapWidth}$`;
    } else {
      sentence = `${name} leave a gap along the height:`;
      detail = `$${b} = ${down} \\times ${tile} + ${gapHeight}$`;
    }
    status.replaceChildren(fits ? icon('check', { size: 20, stroke: 3 }) : '', h('span', { html: mdInline(sentence) }), detail ? h('span.er-nowrap', { html: mdInline(detail) }) : '');
    status.classList.toggle('is-fit', fits);
    if (collect) {
      const list = Array.from(found).sort((p, q) => p - q);
      foundRow.replaceChildren(h('span.er-found-label', list.length ? 'Tile sizes that fit:' : 'No fitting tile size found yet'));
      for (const side of list) {
        const chip = h('button.er-chip', { type: 'button', 'aria-pressed': String(side === tile), 'aria-label': `Tiles of side ${side}${unit}. Show them.` }, `${side}${unit}`);
        chip.addEventListener('click', () => { if (!readOnly) setTile(side, true); });
        foundRow.appendChild(chip);
      }
    }
    svg.setAttribute('aria-label', `A ${a} by ${b} rectangle covered with square tiles of side ${tile}. ${fits ? `They fit exactly: ${across} across and ${down} down.` : 'They do not fit exactly.'}`);
  }

  function setTile(v, notify) {
    const next = clamp(Math.round(v), 1, Math.min(a, b));
    const changed = next !== tile;
    tile = next;
    const fresh = tileFacts().fits && !found.has(tile);
    if (fresh) found.add(tile);
    if (tileSlider && tileSlider.value !== tile) tileSlider.set(tile);
    renderTile();
    if (notify && (changed || fresh)) {
      if (fresh) play('select');
      env.onChange(getState());
    }
  }

  /* ================================================================= cut */
  // The whole run is planned up front; `cuts` says how far the learner has got.
  const plan = [];     // squares in cutting order: { x, y, side, phase }
  const phases = [];   // one per square size: { long, side, q, r, sideways, first }
  {
    let x = 0;
    let y = 0;
    let w = a;
    let hh = b;
    while (w > 0 && hh > 0 && plan.length < 400) {
      const side = Math.min(w, hh);
      const long = Math.max(w, hh);
      const q = Math.floor(long / side);
      const r = long % side;
      const sideways = w >= hh;
      const phase = phases.length;
      phases.push({ long, side, q, r, sideways, first: plan.length });
      for (let i = 0; i < q; i++) {
        plan.push({ x, y, side, phase });
        if (sideways) x += side; else y += side;
      }
      if (sideways) w = r; else hh = r;
    }
  }
  const total = plan.length;
  let cuts = clamp(Math.round(spec.cuts || 0), 0, total);
  const showLog = spec.log !== false && !env.compact;
  const log = h('div.er-log', { 'aria-live': 'polite' });

  function restAfter(count) {
    if (count >= total) return null;
    const next = plan[count];
    const ph = phases[next.phase];
    const longLeft = ph.long - (count - ph.first) * ph.side; // minus the squares of this size already cut
    return ph.sideways ? { x: next.x, y: next.y, w: longLeft, h: ph.side } : { x: next.x, y: next.y, w: ph.side, h: longLeft };
  }

  const cutBtn = button('Cut off the biggest square', () => cut(), { variant: 'primary' });
  const undoBtn = button('Undo', () => {
    if (readOnly || !cuts) return;
    cuts -= 1;
    play('pop');
    renderCut();
    env.onChange(getState());
  }, { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Start again', () => {
    if (readOnly || !cuts) return;
    cuts = 0;
    renderCut();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });

  function cut() {
    if (readOnly || !interactive || cuts >= total) return;
    cuts += 1;
    play('drop');
    renderCut();
    const sq = plan[cuts - 1];
    env.announce(cuts >= total
      ? `Cut the last square, ${sq.side} by ${sq.side}. Nothing is left.`
      : `Cut a ${sq.side} by ${sq.side} square. ${restAfter(cuts).w} by ${restAfter(cuts).h} is left.`);
    env.onChange(getState());
  }

  function renderCut() {
    const done = cuts >= total;
    const g = phases[phases.length - 1].side;
    gBody.replaceChildren();
    gOver.replaceChildren();
    plan.slice(0, cuts).forEach((sq) => {
      const color = PHASE_HUES[sq.phase % PHASE_HUES.length];
      const final = done && sq.phase === phases.length - 1;
      const size = sq.side * k;
      gBody.appendChild(s('rect', { x: px(sq.x), y: py(sq.y), width: size, height: size, fill: final ? hue(color) : hue(color, 'soft') }));
      gOver.appendChild(s('rect', { x: px(sq.x), y: py(sq.y), width: size, height: size, fill: 'none', stroke: 'var(--ink)', 'stroke-width': size >= 16 ? 2.5 : 1.5, 'stroke-linejoin': 'round' }));
      const label = boxLabel(px(sq.x) + size / 2, py(sq.y) + size / 2, size, String(sq.side), final ? '#1D1B26' : hue(color, 'text'), final ? hue(color) : hue(color, 'soft'));
      if (label) gOver.appendChild(label);
    });
    const rest = restAfter(cuts);
    if (rest) {
      const zone = s('rect.er-rest', { x: px(rest.x), y: py(rest.y), width: rest.w * k, height: rest.h * k, fill: 'var(--surface)', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' });
      zone.addEventListener('click', () => cut());
      gBody.appendChild(zone);
      if (rest.w * k >= 70 && rest.h * k >= 26) {
        gOver.appendChild(s('text.fig-label', { x: px(rest.x + rest.w / 2), y: py(rest.y + rest.h / 2) + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'stroke:none;fill:var(--ink-2);pointer-events:none' }, `${rest.w} × ${rest.h}`));
      }
    }
    if (done && g * k >= 12 && (a > g || b > g)) {
      // the last square tiles everything: show its grid across the whole rectangle
      let d = '';
      for (let i = g; i < a; i += g) d += `M${px(i).toFixed(2)} ${oy}V${oy + rh}`;
      for (let j = g; j < b; j += g) d += `M${ox} ${py(j).toFixed(2)}H${ox + rw}`;
      gOver.insertBefore(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', opacity: 0.75 }), gOver.firstChild);
    }

    // division lines, one per finished square size
    if (showLog) {
      const lines = [];
      phases.forEach((ph, i) => {
        if (cuts < ph.first + ph.q) return;
        const color = PHASE_HUES[i % PHASE_HUES.length];
        lines.push(h('div.er-line', { html: mdInline(`$${ph.long} = \\${color}{${ph.q} \\times ${ph.side}} + ${ph.r}$`) }));
      });
      if (done) lines.push(h('div.er-result.er-line', { html: mdInline(`Nothing is left. The last square is **${g} × ${g}**.`) }));
      log.replaceChildren(...lines);
    }
    cutBtn.disabled = readOnly || done;
    undoBtn.disabled = readOnly || !cuts;
    resetBtn.disabled = readOnly || !cuts;
    const sizes = getState().squares.map((q) => `${q.count} of side ${q.side}`).join(', ');
    svg.setAttribute('aria-label', `A ${a} by ${b} rectangle. ${cuts ? `Squares cut off: ${sizes}.` : 'Nothing cut off yet.'} ${rest ? `Still uncut: ${rest.w} by ${rest.h}.` : 'Nothing is left.'}`);
  }

  /* ---------------------------------------------------------------- wiring */
  if (mode === 'tile') {
    if (interactive) {
      tileSlider = sliderRow({
        label: 'tile side', min: 1, max: Math.max(2, Math.min(a, b)), step: 1, value: tile, unit: spec.unit || '', color: 'blue',
        onInput: (v) => { if (readOnly) { tileSlider.set(tile); return; } setTile(v, true); },
      });
      fr.controls.appendChild(tileSlider.el);
    }
    if (!env.compact && spec.status !== false) fr.el.insertBefore(status, fr.buttons); // below the slider, so the slider never moves while dragged
    if (collect) fr.el.appendChild(foundRow);
  } else {
    if (interactive) fr.buttons.append(cutBtn, undoBtn, resetBtn);
    if (showLog) fr.el.appendChild(log);
  }

  function getState() {
    if (mode === 'tile') {
      const list = Array.from(found).sort((p, q) => p - q);
      return { mode, a, b, tile, ...tileFacts(), found: list, common: common.slice(), complete: list.length === common.length };
    }
    const squares = [];
    plan.slice(0, cuts).forEach((sq) => {
      const top = squares[squares.length - 1];
      if (top && top.phase === sq.phase) top.count += 1; else squares.push({ side: sq.side, count: 1, phase: sq.phase });
    });
    const rest = restAfter(cuts);
    return {
      mode, a, b, cuts, total,
      squares: squares.map(({ side, count }) => ({ side, count })),
      steps: phases.filter((ph) => cuts >= ph.first + ph.q).map((ph) => ({ a: ph.long, b: ph.side, q: ph.q, r: ph.r })),
      remaining: rest ? { w: rest.w, h: rest.h } : null,
      done: cuts >= total,
      last: cuts ? plan[cuts - 1].side : null,
    };
  }

  const render = () => (mode === 'tile' ? renderTile() : renderCut());
  if (mode === 'tile' && tileFacts().fits) found.add(tile);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'tile') {
        if (Array.isArray(next.found)) {
          found.clear();
          for (const side of next.found) if (common.includes(side)) found.add(side);
        }
        setTile(next.tile != null ? next.tile : tile, false);
        return;
      }
      if (next.done) cuts = total;
      else if (next.cuts != null) cuts = clamp(Math.round(next.cuts), 0, total);
      renderCut();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (tileSlider) tileSlider.setDisabled(readOnly);
      render();
    },
  };
}

export const examples = [
  { title: 'euclid-rect — which square tiles fit exactly?', spec: { type: 'euclid-rect', mode: 'tile', a: 48, b: 18, unit: 'cm', tile: 4 } },
  { title: 'euclid-rect — cut off the biggest square, again and again', spec: { type: 'euclid-rect', mode: 'cut', a: 48, b: 18 } },
];
