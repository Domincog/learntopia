/**
 * tile-pattern — a growing pattern, one step at a time. It draws step n of a
 * tile or matchstick pattern and colours the part that never changes
 * differently from the part that grows, so that a rule such as 2n + 1 can be
 * *seen* before it is written down.
 *
 * {
 *   type: 'tile-pattern',
 *   shape: 'L',            // 'L'      corner tile + 2 arms of n tiles          2n + 1
 *                          // 'T'      centre tile + 3 arms of n tiles          3n + 1
 *                          // 'plus'   centre tile + 4 arms of n tiles          4n + 1
 *                          // 'row'    `start` fixed tiles + n columns of `grow` (grow)n + (start)
 *                          // 'border' the tiles around an n × n pool           4n + 4
 *                          // 'sticks' n matchstick squares in a row            3n + 1
 *   grow: 3, start: 2,     // 'row' only
 *   n: 3,                  // the step shown first
 *   min: 1, max: 8,        // range of the step slider (min may be 0: "step 0" is the fixed part alone)
 *   steps: [1, 2, 3],      // instead of a slider: draw these steps side by side
 *   ask: 10,               // with `steps`: add a "?" panel captioned "Step 10"
 *   color: 'parts',        // 'parts' fixed part vs growing part · 'plain' one colour · 'new' what the latest step added
 *   counts: true,          // show the counts under the figure
 *   rule: false,           // true: show the growing count as a product, e.g. "2 × 6 = 12"
 *   unit: 'tiles',         // what is being counted
 *   mode: 'view',          // 'build': the learner taps empty spots to turn step n into step n + 1
 *   static: false,         // true: picture only (no slider)
 * }
 *
 * State in 'view' mode:  { n, total, constant, growing }
 * State in 'build' mode: { n, added, total, missing, extra, complete }
 *   added    — the cells the learner filled, as [x, y] pairs. x counts to the right and y counts
 *              downwards from the corner (or centre) tile at [0, 0]; in a 'row' the first fixed tile is [0, 0].
 *   missing  — tiles step n + 1 still needs
 *   extra    — added tiles that do not belong to step n + 1
 *   complete — the figure is exactly step n + 1
 *
 * In an `interact` step a solution is { n: 6 } (view) or { added: [[0, -4], [4, 0]] } (build).
 * Build mode works for the shapes that grow by adding to the previous step: L, T, plus and row.
 */
import { frame, sliderRow, button, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('tile-pattern', `
  .widget-tile-pattern .tp-in { animation: tp-in 0.28s var(--ease-out) both; }
  @keyframes tp-in { from { opacity: 0; } to { opacity: 1; } }
  .widget-tile-pattern .tp-spot { cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
  .widget-tile-pattern .tp-ghost { fill: transparent; stroke: var(--ink-3); stroke-width: 2; stroke-dasharray: 5 6; opacity: 0.55; }
  @media (hover: hover) { .widget-tile-pattern .tp-spot:hover .tp-ghost { fill: var(--sunken); opacity: 1; } }
  .widget-tile-pattern .tp-spot:focus-visible .tp-ghost { stroke: var(--focus); stroke-width: 4; stroke-dasharray: none; opacity: 1; }
  .widget-tile-pattern .tp-spot[aria-pressed='true'] .tp-ghost { opacity: 0; }
  .widget-tile-pattern .tp-spot[aria-pressed='true']:focus-visible .tp-ghost { opacity: 1; }
  .widget-tile-pattern.is-readonly .tp-spot { cursor: default; pointer-events: none; }
  .widget-tile-pattern .tp-key { display: inline-flex; align-items: center; gap: 0.45rem; }
  .widget-tile-pattern .tp-key svg { flex: none; display: block; }
  .widget-tile-pattern .btn-ghost { box-shadow: none; min-height: 40px; }
  /* nothing in the drawing is dragged, so a finger on it may still scroll the page */
  .widget-tile-pattern .w-canvas svg { touch-action: manipulation; }
`);

const INK = '#1D1B26'; // marks drawn on a vivid fill
const PAD = 16;
const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

/** One fixed tile in the middle and one new tile per arm at every step. */
function arms(n, dirs) {
  const cells = [{ x: 0, y: 0, part: 'const', k: 0 }];
  for (let k = 1; k <= n; k++) for (const d of dirs) cells.push({ x: DIRS[d][0] * k, y: DIRS[d][1] * k, part: 'grow', k });
  return { cells };
}

/**
 * Each shape says how many items every step adds (`grow`), how many are always
 * there (`start`) and where they go at step n: `cells` are unit squares with
 * their top-left corner at (x, y); `sticks` are unit line segments.
 */
const SHAPES = {
  L: { grow: 2, start: 1, nested: true, at: (n) => arms(n, ['up', 'right']) },
  T: { grow: 3, start: 1, nested: true, at: (n) => arms(n, ['left', 'right', 'down']) },
  plus: { grow: 4, start: 1, nested: true, at: (n) => arms(n, ['up', 'right', 'down', 'left']) },
  row: {
    nested: true,
    at(n, o) {
      const cells = [];
      for (let j = 0; j < o.start; j++) cells.push({ x: 0, y: -j, part: 'const', k: 0 });
      const first = o.start > 0 ? 1 + o.gap : 0;
      for (let k = 1; k <= n; k++) for (let j = 0; j < o.grow; j++) cells.push({ x: first + (k - 1) * (1 + o.gap), y: -j, part: 'grow', k });
      return { cells };
    },
  },
  border: {
    grow: 4, start: 4,
    at(n) {
      const a = -(n + 2) / 2; // keep the figure centred on (0, 0) as it grows
      const b = a + n + 1;
      const cells = [[a, a], [b, a], [a, b], [b, b]].map(([x, y]) => ({ x, y, part: 'const', k: 0 }));
      for (let k = 1; k <= n; k++) {
        cells.push({ x: a + k, y: a, part: 'grow', k }, { x: a + k, y: b, part: 'grow', k }, { x: a, y: a + k, part: 'grow', k }, { x: b, y: a + k, part: 'grow', k });
      }
      return { cells, pool: { x: a + 1, y: a + 1, size: n } };
    },
  },
  sticks: {
    grow: 3, start: 1, unit: 'matchsticks', cell: 54, smallCell: 40,
    at(n) {
      const sticks = [{ x1: 0, y1: 0, x2: 0, y2: 1, part: 'const', k: 0 }];
      for (let k = 1; k <= n; k++) {
        sticks.push({ x1: k - 1, y1: 0, x2: k, y2: 0, part: 'grow', k }, { x1: k - 1, y1: 1, x2: k, y2: 1, part: 'grow', k }, { x1: k, y1: 0, x2: k, y2: 1, part: 'grow', k });
      }
      return { sticks };
    },
  },
};

function bounds(fig) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  const add = (ax, ay, bx, by) => { x0 = Math.min(x0, ax); y0 = Math.min(y0, ay); x1 = Math.max(x1, bx); y1 = Math.max(y1, by); };
  for (const c of fig.cells || []) add(c.x, c.y, c.x + 1, c.y + 1);
  for (const t of fig.sticks || []) add(Math.min(t.x1, t.x2), Math.min(t.y1, t.y2), Math.max(t.x1, t.x2), Math.max(t.y1, t.y2));
  if (!Number.isFinite(x0)) return { x0: 0, y0: 0, x1: 1, y1: 1, w: 1, h: 1 };
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

const keyOf = (x, y) => `${x},${y}`;

export default function create(spec, env) {
  const shape = SHAPES[spec.shape] || SHAPES.L;
  const building = spec.mode === 'build' && shape.nested && !env.compact;
  const o = { grow: spec.grow != null ? spec.grow : 3, start: spec.start != null ? spec.start : 2, gap: building ? 0 : 0.2 };
  const grow = shape.grow != null ? shape.grow : o.grow;
  const start = shape.start != null ? shape.start : o.start;
  const unit = spec.unit || shape.unit || 'tiles';
  const many = Array.isArray(spec.steps) && spec.steps.length ? spec.steps : null;
  const colorMode = ['parts', 'plain', 'new'].includes(spec.color) ? spec.color : 'parts';
  const min = spec.min != null ? spec.min : 1;
  const max = Math.max(min, spec.max != null ? spec.max : 8);
  const hasSlider = !many && !building && !spec.static && !env.compact;
  let n = clamp(spec.n != null ? spec.n : min, hasSlider ? min : 0, hasSlider ? max : 99);
  let readOnly = !!env.readOnly;
  const at = (k) => shape.at(k, o);
  const totalAt = (k) => grow * k + start;

  /* -------------------------------------------------------------- drawing */
  function tileFill(part, k, step, mode) {
    if (mode === 'plain') return hue('blue');
    if (mode === 'new') return part === 'grow' && k === step ? hue('green') : hue('gray', 'soft');
    return part === 'const' ? hue('orange') : hue('blue');
  }
  const isNew = (part, k, step, mode) => mode === 'new' && part === 'grow' && k === step;

  /** One square tile with its top-left corner at (px, py). `mark`: 'dot' (fixed part), 'plus' (just added) or null. */
  function tileEl(px, py, size, fill, mark) {
    const g = s('g');
    const inset = size >= 26 ? 1.5 : 1;
    g.appendChild(s('rect', { x: px + inset, y: py + inset, width: size - 2 * inset, height: size - 2 * inset, rx: size * 0.2, fill, stroke: 'var(--edge-strong)', 'stroke-width': size >= 26 ? 2.5 : 2 }));
    const cx = px + size / 2;
    const cy = py + size / 2;
    if (mark === 'dot') g.appendChild(s('circle', { cx, cy, r: Math.max(2.5, size * 0.11), fill: INK }));
    if (mark === 'plus') {
      const a = Math.max(3.5, size * 0.17);
      g.appendChild(s('path', { d: `M${cx - a} ${cy} H${cx + a} M${cx} ${cy - a} V${cy + a}`, stroke: INK, 'stroke-width': Math.max(2, size * 0.075), 'stroke-linecap': 'round', fill: 'none' }));
    }
    return g;
  }

  /**
   * One matchstick: an outlined, round-ended bar that stops a little short of the corners.
   * A stick is thin, so its outline uses --edge (visible in both themes) and the "always
   * there" mark is a bead on the stick rather than a dot inside it.
   */
  function stickEl(ox, oy, size, t, fill, mark) {
    const g = s('g');
    const cut = size * 0.17;
    const thick = clamp(size * 0.2, 8, 11);
    const dx = t.x2 - t.x1;
    const dy = t.y2 - t.y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const p = { x1: ox + t.x1 * size + ux * cut, y1: oy + t.y1 * size + uy * cut, x2: ox + t.x2 * size - ux * cut, y2: oy + t.y2 * size - uy * cut };
    g.appendChild(s('line', { ...p, stroke: 'var(--edge)', 'stroke-width': thick, 'stroke-linecap': 'round' }));
    g.appendChild(s('line', { ...p, stroke: fill, 'stroke-width': thick - 4, 'stroke-linecap': 'round' }));
    if (mark === 'dot') {
      const cx = (p.x1 + p.x2) / 2;
      const cy = (p.y1 + p.y2) / 2;
      g.appendChild(s('circle', { cx, cy, r: thick / 2 + 1.5, fill, stroke: 'var(--edge)', 'stroke-width': 2 }));
      g.appendChild(s('circle', { cx, cy, r: 2, fill: INK }));
    }
    return g;
  }

  /** Draw a whole figure with unit (0, 0) at pixel (ox, oy). Items of step numbers above `fadeAbove` fade in. */
  function drawFigure(parent, fig, ox, oy, size, step, mode, fadeAbove = Infinity) {
    if (fig.pool && fig.pool.size > 0) {
      const { x, y, size: m } = fig.pool;
      parent.appendChild(s('rect', { x: ox + x * size + 3, y: oy + y * size + 3, width: m * size - 6, height: m * size - 6, rx: Math.min(10, size * 0.25), fill: hue('teal', 'soft'), stroke: hue('teal'), 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
      if (m * size >= 60) {
        parent.appendChild(s('text', { x: ox + (x + m / 2) * size, y: oy + (y + m / 2) * size, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'fig-label', style: `fill:${hue('teal', 'text')};stroke:none;font-size:16px` }, `${m} × ${m}`));
      }
    }
    const items = [...(fig.cells || []), ...(fig.sticks || [])];
    for (const it of items) {
      const fill = tileFill(it.part, it.k, step, mode);
      const mark = mode === 'parts' && it.part === 'const' ? 'dot' : isNew(it.part, it.k, step, mode) ? 'plus' : null;
      const el = it.x1 != null ? stickEl(ox, oy, size, it, fill, mark) : tileEl(ox + it.x * size, oy + it.y * size, size, fill, mark);
      if (it.k > fadeAbove) el.setAttribute('class', 'tp-in');
      parent.appendChild(el);
    }
  }

  /** A small swatch for the key under the figure, drawn exactly like the tiles. */
  function swatch(fill, mark) {
    const svg = s('svg', { viewBox: '0 0 20 20', width: 18, height: 18, 'aria-hidden': 'true' });
    svg.appendChild(tileEl(0, 0, 20, fill, mark));
    return svg;
  }

  /* --------------------------------------------------------------- layout */
  const LIMIT_W = 560;
  let W; let H; let size; let ox; let oy;
  let panels = null;   // side-by-side mode: [{ step, fig, ox, oy, cx }]
  let askBox = null;
  let captionY = 0;
  let base = null;     // build mode
  let goal = null;
  let spots = [];

  if (many) {
    const figs = many.map((k) => at(k));
    const boxes = figs.map(bounds);
    const tallest = Math.max(...boxes.map((b) => b.h));
    size = spec.cell || shape.smallCell || 30;
    const widthAt = (c) => {
      const gap = Math.max(20, c * 0.9);
      const askW = spec.ask != null ? gap * 1.6 + Math.max(72, c * 2.2) : 0;
      return boxes.reduce((t, b) => t + b.w * c, 0) + gap * (boxes.length - 1) + askW;
    };
    while (size > 12 && (widthAt(size) > LIMIT_W - 2 * PAD || tallest * size > 250)) size -= 1;
    const gap = Math.max(20, size * 0.9);
    const figH = Math.max(tallest * size, spec.ask != null ? 56 : 0);
    W = Math.max(Math.round(widthAt(size) + 2 * PAD), 300);
    H = Math.round(figH + PAD + 40);
    captionY = PAD + figH + 24;
    let x = (W - widthAt(size)) / 2;
    panels = figs.map((fig, i) => {
      const b = boxes[i];
      const panel = { step: many[i], fig, ox: x - b.x0 * size, oy: PAD + figH - b.y1 * size, cx: x + (b.w * size) / 2 };
      x += b.w * size + gap;
      return panel;
    });
    if (spec.ask != null) {
      const w = Math.max(72, size * 2.2);
      const dotsX = x - gap + gap * 0.8;
      const bx = x + gap * 0.6;
      const bh = Math.min(figH, Math.max(56, w * 0.9));
      askBox = { x: bx, y: PAD + figH - bh, w, h: bh, dotsX, dotsY: PAD + figH - bh / 2 };
    }
  } else if (building) {
    base = at(n);
    goal = at(n + 1);
    const b = bounds(goal);
    size = spec.cell || 56;
    while (size > 40 && b.w * size > 500) size -= 2;
    W = Math.max(Math.round(b.w * size + 2 * PAD), 280);
    H = Math.round(b.h * size + 2 * PAD);
    ox = (W - b.w * size) / 2 - b.x0 * size;
    oy = PAD - b.y0 * size;
  } else {
    const b = bounds(at(hasSlider ? max : n));
    size = spec.cell || shape.cell || 36;
    while (size > 12 && (b.w * size > LIMIT_W - 2 * PAD || b.h * size > 300)) size -= 1;
    if (env.compact) size = Math.min(size, 26);
    W = Math.max(Math.round(b.w * size + 2 * PAD), env.compact ? 120 : 300);
    H = Math.round(b.h * size + 2 * PAD);
    ox = (W - b.w * size) / 2 - b.x0 * size;
    oy = PAD - b.y0 * size;
  }

  // Captions are sized in drawing units so that they stay readable when a wide drawing is scaled down to a phone.
  const captionStyle = `font-size:${Math.round(clamp((15 * W) / 358, 15, 22))}px`;

  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'Growing pattern' });
  const { svg } = fr;
  // The drawing keeps its natural size (one unit = one pixel) while the key and slider may use the full width.
  // On a short screen the player hands every figure a height to stay within (--w-fit-h); the drawing gives way
  // down to about two thirds of its size, so that the tiles stay easy to tap.
  const fitWidth = `max(${Math.round(W * 0.62)}px, calc(var(--w-fit-h, 100vh) * ${(W / H).toFixed(3)}))`;
  Object.assign(fr.canvas.style, { width: '100%', maxWidth: `min(${W}px, ${fitWidth})`, justifySelf: 'center' });
  const layer = s('g');
  svg.appendChild(layer);

  /* ---------------------------------------------------- key and controls */
  const showCounts = spec.counts !== false && !env.compact && !many;
  const keyTotal = h('b');
  const keyConst = h('b', { style: { color: hue('orange', 'text') } });
  const keyGrow = h('b', { style: { color: hue('blue', 'text') } });
  const keyAdded = h('b', { style: { color: hue('green', 'text') } });
  if (showCounts) {
    if (building) {
      fr.readouts.append(
        h('span.w-readout', h('span', unit), keyTotal),
        h('span.w-readout.tp-key', swatch(hue('green'), 'plus'), h('span', 'added by you'), keyAdded),
      );
    } else if (colorMode === 'parts') {
      fr.readouts.append(
        h('span.w-readout.tp-key', swatch(hue('orange'), 'dot'), h('span', 'always there'), keyConst),
        h('span.w-readout.tp-key', swatch(hue('blue'), null), h('span', 'growing'), keyGrow),
        h('span.w-readout', h('span', 'total'), keyTotal),
      );
    } else if (colorMode === 'new') {
      fr.readouts.append(
        h('span.w-readout.tp-key', swatch(hue('green'), 'plus'), h('span', 'new this step'), keyAdded),
        h('span.w-readout', h('span', unit), keyTotal),
      );
    } else {
      fr.readouts.append(h('span.w-readout', h('span', unit), keyTotal));
    }
  }

  let slider = null;
  if (hasSlider) {
    slider = sliderRow({
      label: spec.sliderLabel || 'step $n$', min, max, step: 1, value: n, color: 'blue',
      onInput: (v) => {
        if (readOnly || v === n) return;
        const before = n;
        n = v;
        render(before);
        env.announce(`Step ${n}: ${totalAt(n)} ${unit}.`);
        env.onChange(getState());
      },
    });
    if (readOnly) slider.setDisabled(true);
    fr.controls.appendChild(slider.el);
  }

  /* ----------------------------------------------------------- build mode */
  const added = new Set();
  const baseKeys = new Set();
  const goalKeys = new Set();
  let clearBtn = null;

  function toggleSpot(spot) {
    if (readOnly) return;
    if (added.has(spot.key)) added.delete(spot.key); else added.add(spot.key);
    const on = added.has(spot.key);
    play(on ? 'tap' : 'pop');
    paintSpots();
    env.announce(`${on ? 'Tile added' : 'Tile taken away'}. ${totalAt(n) + added.size} ${unit} now.`);
    env.onChange(getState());
  }

  function paintSpots() {
    for (const spot of spots) {
      const on = added.has(spot.key);
      spot.el.setAttribute('aria-pressed', String(on));
      spot.tile.setAttribute('visibility', on ? 'visible' : 'hidden');
    }
    const st = getState();
    keyTotal.textContent = String(st.total);
    keyAdded.textContent = String(added.size);
    if (clearBtn) clearBtn.disabled = readOnly || !added.size;
    svg.setAttribute('aria-label', `Step ${n} of the pattern has ${totalAt(n)} ${unit}. You have added ${added.size}, making ${st.total}.`);
  }

  if (building) {
    for (const c of base.cells) baseKeys.add(keyOf(c.x, c.y));
    for (const c of goal.cells) if (!baseKeys.has(keyOf(c.x, c.y))) goalKeys.add(keyOf(c.x, c.y));
    const b = bounds(goal);
    drawFigure(layer, base, ox, oy, size, n, 'plain');
    for (let y = b.y0; y < b.y1; y++) {
      for (let x = b.x0; x < b.x1; x++) {
        if (baseKeys.has(keyOf(x, y))) continue;
        const px = ox + x * size;
        const py = oy + y * size;
        const tile = tileEl(px, py, size, hue('green'), 'plus');
        const el = s('g', { class: 'tp-spot', tabindex: '0', role: 'button', 'aria-pressed': 'false', 'aria-label': `Spot in column ${x - b.x0 + 1}, row ${y - b.y0 + 1}` },
          s('rect', { x: px, y: py, width: size, height: size, fill: 'transparent' }),
          s('rect', { class: 'tp-ghost', x: px + 5, y: py + 5, width: size - 10, height: size - 10, rx: size * 0.2 }),
          tile,
        );
        const spot = { key: keyOf(x, y), x, y, el, tile };
        el.dataset.keys = 'own';
        el.addEventListener('click', () => toggleSpot(spot));
        el.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.preventDefault();
          ev.stopPropagation();
          toggleSpot(spot);
        });
        spots.push(spot);
        layer.appendChild(el);
      }
    }
    if (!spec.static) {
      clearBtn = button('Clear', () => { if (readOnly || !added.size) return; added.clear(); paintSpots(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(clearBtn);
      fr.el.appendChild(h('p.w-hint', 'Tap an empty spot to add a tile. Tap it again to take it away.'));
    }
  }

  /* --------------------------------------------------------------- render */
  function render(before = n) {
    if (building) { paintSpots(); return; }
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    if (many) {
      for (const p of panels) {
        drawFigure(layer, p.fig, p.ox, p.oy, size, p.step, colorMode);
        layer.appendChild(s('text', { x: p.cx, y: captionY, 'text-anchor': 'middle', class: 'fig-label', style: captionStyle }, `Step ${p.step}`));
      }
      if (askBox) {
        const a = askBox;
        layer.appendChild(s('text', { x: a.dotsX, y: a.dotsY, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'fig-label-lg', style: 'fill:var(--ink-3)' }, '…'));
        layer.appendChild(s('rect', { x: a.x, y: a.y, width: a.w, height: a.h, rx: 12, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '6 7', 'stroke-linecap': 'round' }));
        layer.appendChild(s('text', { x: a.x + a.w / 2, y: a.y + a.h / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'fig-label-lg', style: 'font-size:26px;fill:var(--ink-2)' }, '?'));
        layer.appendChild(s('text', { x: a.x + a.w / 2, y: captionY, 'text-anchor': 'middle', class: 'fig-label', style: captionStyle }, `Step ${spec.ask}`));
      }
      svg.setAttribute('aria-label', spec.alt || `Steps ${many.join(', ')} of a growing pattern with ${many.map(totalAt).join(', ')} ${unit}.`);
      return;
    }
    drawFigure(layer, at(n), ox, oy, size, n, colorMode, n > before ? before : Infinity);
    const total = totalAt(n);
    keyTotal.textContent = String(total);
    keyConst.textContent = String(start);
    keyGrow.textContent = spec.rule ? `${grow} × ${n} = ${grow * n}` : String(grow * n);
    keyAdded.textContent = String(n > 0 ? grow : 0);
    // In one colour the learner is still looking for the two parts, so the description does not name them either.
    svg.setAttribute('aria-label', `Step ${n} of the pattern: ${total} ${unit}.${colorMode === 'parts' ? ` ${start} always there, ${grow * n} in the growing part.` : ''}`);
  }

  function getState() {
    if (building) {
      let extra = 0;
      let hit = 0;
      for (const k of added) { if (goalKeys.has(k)) hit++; else extra++; }
      const missing = goalKeys.size - hit;
      return {
        n,
        added: spots.filter((sp) => added.has(sp.key)).map((sp) => [sp.x, sp.y]),
        total: totalAt(n) + added.size,
        missing,
        extra,
        complete: missing === 0 && extra === 0,
      };
    }
    return { n, total: totalAt(n), constant: start, growing: grow * n };
  }

  render();
  if (readOnly) {
    fr.el.classList.add('is-readonly');
    for (const spot of spots) spot.el.setAttribute('tabindex', '-1');
  }

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (building) {
        if (!Array.isArray(next.added)) return;
        added.clear();
        const valid = new Set(spots.map((sp) => sp.key));
        for (const pair of next.added) { const k = keyOf(pair[0], pair[1]); if (valid.has(k)) added.add(k); }
        paintSpots();
        return;
      }
      if (typeof next.n === 'number') {
        n = clamp(Math.round(next.n), hasSlider ? min : 0, hasSlider ? max : 99);
        if (slider) slider.set(n);
        render();
      }
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      for (const spot of spots) spot.el.setAttribute('tabindex', readOnly ? '-1' : '0');
      if (building) paintSpots();
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'tile-pattern — step slider with the fixed and growing parts', spec: { type: 'tile-pattern', shape: 'L', n: 3, min: 0, max: 6, rule: true } },
  { title: 'tile-pattern — three steps side by side', spec: { type: 'tile-pattern', shape: 'plus', steps: [1, 2, 3], ask: 10, color: 'plain' } },
  { title: 'tile-pattern — matchstick squares', spec: { type: 'tile-pattern', shape: 'sticks', n: 3, max: 6 } },
  { title: 'tile-pattern — build the next step', spec: { type: 'tile-pattern', shape: 'L', n: 3, mode: 'build' } },
];
