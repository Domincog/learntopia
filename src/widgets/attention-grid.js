/**
 * attention-grid — one step of (simplified) self-attention on a handful of
 * tokens whose vectors have two numbers each.
 *
 *   1. score:   every token scores every token (itself included) by the dot product of their two vectors;
 *   2. weights: softmax turns each token's row of scores into weights that add up to 1;
 *   3. mix:     the token's new vector is the weighted average of all the vectors.
 *
 * On the left the vectors are drawn as arrows; on the right is the grid of
 * weights: the row is the token doing the looking, the column the token being
 * looked at. One row is "in focus": its scores, weights and new vector are
 * written out under the picture, and its new vector is drawn dashed. Tap a row
 * to move the focus. Vectors can be made draggable, and one token can be
 * swapped for another with a button.
 *
 * {
 *   type: 'attention-grid',
 *   tokens: [{ text: 'the', v: [0.5, 0.5] }, { text: 'river', v: [0, 2] }, { text: 'bank', v: [1, 1] }],   // two to four
 *   base: 'e',                 // 'e' (real softmax) or 2 (powers of 2, for working by hand)
 *   focus: 2,                  // index of the row in focus
 *   drag: [1],                 // indices of tokens whose vector can be dragged
 *   snap: 0.5, range: 3,       // dragging grid, and the window (−range to range; the picture shows −1 to range by default)
 *   window: { x: [-1, 3], y: [-1, 3] },   // optional: the part of the plane that is shown
 *   swap: { index: 1, options: [{ text: 'river', v: [0, 2] }, { text: 'money', v: [2, 0] }] },   // a button that swaps one token
 *   axes: ['money', 'water'],  // optional names for the two directions
 *   digits: 2,
 *   static: false,
 * }
 *
 * State: { tokens, vectors, focus, scores, weights, out, top, option, seen }
 *   tokens    the token texts, in order; vectors: their vectors as they stand
 *   scores    scores[i][j]: the dot product of token i's vector with token j's
 *   weights   weights[i][j]: softmax of row i; out[i]: the new vector of token i
 *   top       top[i]: the index of the token that row i gives the most weight to (the first, if several tie)
 *   option    with swap: which option is in place now (index); seen: every option shown so far
 *
 * setState accepts { vectors: [[x, y], …], focus, option, seen }.
 */
import { frame, plane, drawAxes, handle, button, hue, s, h, clamp, tidy, snapTo, mdInline, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

addStyles('attention-grid', `
  .widget-attention-grid .ag-line { text-align: center; min-height: 3.2em; display: grid; align-content: center; gap: 2px; font-size: var(--fs-md); }
  .widget-attention-grid .ag-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 600; }
  .widget-attention-grid .ag-row { cursor: pointer; outline: none; }
  .widget-attention-grid .ag-row:focus-visible .ag-row-box { stroke: var(--focus); stroke-width: 4; }
  .widget-attention-grid.is-readonly .ag-row { cursor: default; pointer-events: none; }
`);

const COLORS = ['blue', 'orange', 'teal', 'pink'];

/** One step of simplified self-attention. vectors: [[x, y], …]. */
export function attend(vectors, base = Math.E) {
  const scores = vectors.map((a) => vectors.map((b) => a[0] * b[0] + a[1] * b[1]));
  const weights = scores.map((row) => {
    const top = Math.max(...row);
    const powers = row.map((v) => base ** (v - top));
    const total = powers.reduce((t, v) => t + v, 0);
    return powers.map((v) => v / total);
  });
  const out = weights.map((row) => [
    row.reduce((t, w, j) => t + w * vectors[j][0], 0),
    row.reduce((t, w, j) => t + w * vectors[j][1], 0),
  ]);
  return { scores, weights, out };
}

const W = 640;
const H = 320;

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const base = spec.base === 2 ? 2 : Math.E;
  const digits = spec.digits != null ? spec.digits : 2;
  const snap = spec.snap || 0.5;
  const range = spec.range || 3;
  const swap = spec.swap && Array.isArray(spec.swap.options) && spec.swap.options.length > 1 ? spec.swap : null;
  let readOnly = !!env.readOnly;
  const tokens = (spec.tokens || [{ text: 'a', v: [1, 0] }, { text: 'b', v: [0, 1] }]).slice(0, 4).map((t) => ({ text: String(t.text), v: [Number(t.v[0]), Number(t.v[1])] }));
  const n = tokens.length;
  const dragList = isStatic ? [] : (spec.drag || []).filter((i) => i >= 0 && i < n);
  let focus = clamp(Math.round(spec.focus != null ? spec.focus : n - 1), 0, n - 1);
  let option = 0;
  const seen = [0];
  if (swap) {
    const start = swap.options.findIndex((o) => o.text === tokens[swap.index].text);
    option = start >= 0 ? start : 0;
    seen[0] = option;
  }

  const getState = () => {
    const vectors = tokens.map((t) => [t.v[0], t.v[1]]);
    const a = attend(vectors, base);
    const round = (rows, places = 6) => rows.map((row) => row.map((v) => tidy(v, places)));
    return {
      tokens: tokens.map((t) => t.text),
      vectors,
      focus,
      scores: round(a.scores),
      weights: round(a.weights),
      out: round(a.out),
      top: a.weights.map((row) => row.indexOf(Math.max(...row))),
      option: swap ? option : null,
      seen: seen.slice(),
    };
  };

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 680, label: spec.alt || 'Attention between a few tokens' });
  const { svg } = fr;
  const win = spec.window || { x: [-1, range], y: [-1, range] };
  const PL = 300;
  const pl = plane({ x: win.x, y: win.y, width: PL, height: H, pad: { l: 14, r: 14, t: 24, b: 24 } });
  svg.appendChild(drawAxes(pl, { xStep: 1, yStep: 1, xLabel: spec.axes ? spec.axes[0] : '', yLabel: spec.axes ? spec.axes[1] : '' }));
  const gArrows = s('g');
  const gGrid = s('g');
  const gLabels = s('g');
  svg.append(gArrows, gLabels, gGrid);

  // grid geometry
  const GX = 398;                       // left edge of the cells
  const cellW = Math.min(74, (W - GX - 10) / n);
  const cellH = Math.min(50, (H - 96) / n);
  const GY = 70;

  const line = h('div.ag-line');
  if (!env.compact && spec.line !== false) fr.el.insertBefore(line, fr.readouts);
  const fmt = (v, d = digits) => formatNumber(tidy(v, 6), d);
  const handles = {};
  const rowEls = [];

  function setFocus(i) {
    if (readOnly || i === focus) return;
    const hadFocus = typeof document !== 'undefined' && gGrid.contains(document.activeElement);
    focus = i;
    play('select');
    draw();
    if (hadFocus && rowEls[i]) rowEls[i].focus({ preventScroll: true });
    env.onChange(getState());
  }

  function draw() {
    const st = getState();
    gArrows.replaceChildren();
    gGrid.replaceChildren();
    gLabels.replaceChildren();
    const ox = pl.sx(0);
    const oy = pl.sy(0);
    /** An arrow from the origin with a head of fixed size; returns the unit direction on screen. */
    const arrow = (v, color, width, dashed) => {
      const x = pl.sx(v[0]);
      const y = pl.sy(v[1]);
      const long = Math.hypot(x - ox, y - oy);
      const ux = long > 1e-6 ? (x - ox) / long : 1;
      const uy = long > 1e-6 ? (y - oy) / long : 0;
      const head = Math.min(13, long);
      gArrows.appendChild(s('line', { x1: ox, y1: oy, x2: x - ux * head * 0.8, y2: y - uy * head * 0.8, stroke: hue(color), 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? '6 6' : null }));
      if (long > 3) gArrows.appendChild(s('path', { d: `M${x} ${y} L${x - ux * head - uy * 6} ${y - uy * head + ux * 6} L${x - ux * head + uy * 6} ${y - uy * head - ux * 6} Z`, fill: hue(color), stroke: hue(color), 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      return { x, y, ux, uy };
    };
    /** A label just beyond the tip, or beside it for an arrow that lies along a longer one. */
    const label = (text, color, tip, inner, bump = 0) => {
      let lx = tip.x + tip.ux * 15;
      let ly = tip.y + tip.uy * 15 + 5;
      let anchor = tip.ux >= 0 ? 'start' : 'end';
      if (Math.abs(tip.ux) < 0.2) {
        // straight up or down: beside the tip, clear of the axis
        lx = tip.x + 10;
        ly = tip.y + (tip.uy < 0 ? 0 : 14);
        anchor = 'start';
      } else if (Math.abs(tip.uy) < 0.2) {
        // lying along the horizontal axis: above the arrow, clear of the axis and its name
        lx = tip.x - 2;
        ly = tip.y - 10;
        anchor = tip.ux > 0 ? 'end' : 'start';
      }
      if (inner) {
        // step sideways off the shared line, towards the lower side of the picture
        const px = tip.uy > 0 ? tip.uy : -tip.uy;
        const py = tip.uy > 0 ? -tip.ux : tip.ux;
        const down = py >= 0 ? 1 : -1;
        lx = tip.x + px * down * 14;
        ly = tip.y + py * down * 14 + 12;
        anchor = px * down >= 0 ? 'start' : 'end';
      }
      gLabels.appendChild(s('text', { class: `fig-label text-${color}`, x: lx, y: ly + bump, 'text-anchor': anchor }, text));
    };
    const sameWay = (a, b) => Math.abs(a[0] * b[1] - a[1] * b[0]) < 1e-9 && a[0] * b[0] + a[1] * b[1] > 0;
    // the token vectors
    tokens.forEach((t, i) => {
      const color = COLORS[i % COLORS.length];
      const tip = arrow(t.v, color, i === focus ? 4.5 : 3, false);
      const inner = tokens.some((u, j) => j !== i && sameWay(u.v, t.v) && Math.hypot(u.v[0], u.v[1]) > Math.hypot(t.v[0], t.v[1]) + 1e-9);
      const twin = tokens.filter((u, j) => j < i && u.v[0] === t.v[0] && u.v[1] === t.v[1]).length;
      label(t.text, color, tip, inner, twin * 18);
    });
    // the new vector of the token in focus
    const nv = st.out[focus];
    const newTip = arrow(nv, 'violet', 3.5, true);
    const crowded = tokens.some((t) => Math.hypot(pl.sx(t.v[0]) - newTip.x, pl.sy(t.v[1]) - newTip.y) < 26);
    label(`new ${tokens[focus].text}`, 'violet', newTip, false, crowded ? 20 : 0);

    // the grid of weights
    gGrid.appendChild(s('text', { class: 'fig-label-sm text-muted', x: GX + (n * cellW) / 2, y: 16, 'text-anchor': 'middle' }, 'weight given to …'));
    tokens.forEach((t, j) => {
      gGrid.appendChild(s('text', { class: `fig-label text-${COLORS[j % COLORS.length]}`, x: GX + j * cellW + cellW / 2, y: GY - 12, 'text-anchor': 'middle' }, t.text));
    });
    tokens.forEach((t, i) => {
      const y = GY + i * cellH;
      const row = s('g.ag-row');
      row.appendChild(s('text', { class: `fig-label text-${COLORS[i % COLORS.length]}`, x: GX - 10, y: y + cellH / 2 + 5, 'text-anchor': 'end' }, t.text));
      st.weights[i].forEach((w, j) => {
        row.appendChild(s('rect', { x: GX + j * cellW + 2, y: y + 2, width: cellW - 4, height: cellH - 4, rx: 8, fill: 'var(--surface)', stroke: 'var(--hair)', 'stroke-width': 1.5 }));
        row.appendChild(s('rect', { x: GX + j * cellW + 2, y: y + 2, width: cellW - 4, height: cellH - 4, rx: 8, fill: hue('violet'), opacity: (0.08 + 0.8 * w).toFixed(3) }));
        row.appendChild(s('text', { class: 'fig-label', x: GX + j * cellW + cellW / 2, y: y + cellH / 2 + 5, 'text-anchor': 'middle' }, fmt(w)));
      });
      row.appendChild(s('rect.ag-row-box', { x: GX - 2, y: y - 1, width: n * cellW + 4, height: cellH + 2, rx: 10, fill: 'transparent', stroke: i === focus ? 'var(--ink)' : 'none', 'stroke-width': 3 }));
      if (!isStatic) {
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'button');
        row.setAttribute('aria-pressed', String(i === focus));
        row.setAttribute('aria-label', `${t.text} looks at: ${tokens.map((u, j) => `${u.text} ${fmt(st.weights[i][j])}`).join(', ')}`);
        row.dataset.keys = 'own';
        row.addEventListener('click', () => setFocus(i));
        row.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); setFocus(i); } });
      }
      rowEls[i] = row;
      gGrid.appendChild(row);
    });
    gGrid.appendChild(s('text', { class: 'fig-label-sm text-muted', x: GX + (n * cellW) / 2, y: GY + n * cellH + 20, 'text-anchor': 'middle' }, 'each row adds up to 1'));

    for (const i of dragList) {
      handles[i].set(pl.sx(tokens[i].v[0]), pl.sy(tokens[i].v[1]));
      handles[i].setLabel(`${tokens[i].text}: ${fmt(tokens[i].v[0])}, ${fmt(tokens[i].v[1])}`);
    }

    // the working for the row in focus
    const f = tokens[focus];
    const scoreText = tokens.map((t, j) => `${t.text} ${fmt(st.scores[focus][j])}`).join(' · ');
    line.replaceChildren(
      h('span', { html: mdInline(`**${f.text}** (${fmt(f.v[0])}, ${fmt(f.v[1])}) scores: ${scoreText}`) }),
      h('span', { html: mdInline(`new **${f.text}** = (${fmt(nv[0])}, ${fmt(nv[1])})`) }),
    );
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${tokens.map((t, i) => `${t.text} is at ${fmt(t.v[0])}, ${fmt(t.v[1])} and gives most weight to ${tokens[st.top[i]].text}`).join('; ')}. New vector of ${f.text}: ${fmt(nv[0])}, ${fmt(nv[1])}.`);
  }

  for (const i of dragList) {
    handles[i] = handle(svg, {
      x: pl.sx(tokens[i].v[0]), y: pl.sy(tokens[i].v[1]), color: COLORS[i % COLORS.length], label: tokens[i].text, keyStep: pl.kx * snap,
      onMove: (px, py) => {
        if (readOnly) return;
        const nx = tidy(clamp(snapTo(pl.ux(px), snap), Math.max(-range, win.x[0]), Math.min(range, win.x[1])), 4);
        const ny = tidy(clamp(snapTo(pl.uy(py), snap), Math.max(-range, win.y[0]), Math.min(range, win.y[1])), 4);
        if (nx === tokens[i].v[0] && ny === tokens[i].v[1]) return;
        tokens[i].v = [nx, ny];
        draw();
        env.onChange(getState());
      },
    });
  }

  let swapBtn = null;
  const swapLabel = () => {
    const next = swap.options[(option + 1) % swap.options.length];
    return `Swap “${tokens[swap.index].text}” for “${next.text}”`;
  };
  const place = (k) => {
    option = k;
    const o = swap.options[k];
    tokens[swap.index] = { text: String(o.text), v: [Number(o.v[0]), Number(o.v[1])] };
    if (!seen.includes(k)) seen.push(k);
  };
  if (swap && !isStatic) {
    swapBtn = button(swapLabel(), () => {
      if (readOnly) return;
      place((option + 1) % swap.options.length);
      swapBtn.lastChild.textContent = swapLabel();
      play('tap');
      draw();
      env.announce(`Now: ${tokens.map((t) => t.text).join(' ')}.`);
      env.onChange(getState());
    }, { variant: 'primary' });
    fr.buttons.appendChild(swapBtn);
  }

  draw();
  for (const i of dragList) svg.appendChild(handles[i].el);
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (swap && Array.isArray(next.seen)) for (const k of next.seen) if (k >= 0 && k < swap.options.length && !seen.includes(k)) seen.push(k);
      if (swap && typeof next.option === 'number' && next.option >= 0 && next.option < swap.options.length) { place(next.option); if (swapBtn) swapBtn.lastChild.textContent = swapLabel(); }
      if (Array.isArray(next.vectors)) next.vectors.forEach((v, i) => { if (i < n && Array.isArray(v)) tokens[i].v = [Number(v[0]), Number(v[1])]; });
      if (typeof next.focus === 'number') focus = clamp(Math.round(next.focus), 0, n - 1);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const i of dragList) handles[i].setEnabled(!readOnly);
    },
    destroy() { for (const i of dragList) handles[i].destroy(); },
  };
}

export const examples = [
  {
    title: 'attention-grid — the river bank and the money bank',
    spec: {
      type: 'attention-grid', axes: ['money', 'water'],
      tokens: [{ text: 'the', v: [0.5, 0.5] }, { text: 'river', v: [0, 2] }, { text: 'bank', v: [1, 1] }],
      swap: { index: 1, options: [{ text: 'river', v: [0, 2] }, { text: 'money', v: [2, 0] }] },
    },
  },
  {
    title: 'attention-grid — steer a token by dragging its vector',
    spec: {
      type: 'attention-grid', range: 3, window: { x: [-1, 3], y: [-2, 3] },
      tokens: [{ text: 'dog', v: [2, 0] }, { text: 'ball', v: [0, 2] }, { text: 'it', v: [1, 1] }], drag: [2], focus: 2,
    },
  },
];
