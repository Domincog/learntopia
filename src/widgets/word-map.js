/**
 * word-map — a small, hand-made map of word embeddings in two dimensions.
 * Every word is a point (a vector with two numbers). Tap a word to see which
 * words are closest to it, measured by straight-line distance, by dot product
 * or by cosine similarity. Words can be made draggable ("where does this new
 * word belong?"), a free probe point reports the word nearest to it, and an
 * offset arrow (from one word to another) can be drawn and copied to a third
 * word, for "king − man + woman" arithmetic.
 *
 * {
 *   type: 'word-map',
 *   words: [                                   // default: the built-in map of twelve words (exported as WORDS)
 *     { text: 'cat', at: [3, 4], group: 0 },   // group 0, 1, 2 … decides colour and marker shape
 *   ],
 *   range: 7,                  // the window runs from −range to range both ways
 *   select: 'cat',             // the word whose neighbours are listed at the start (false: none; tapping still selects)
 *   measure: 'distance',       // 'distance' (smaller is closer) | 'dot' | 'cosine' (larger is closer)
 *   nearest: 3,                // how many neighbours are listed and linked
 *   arrows: false,             // draw the selected word and its neighbours as arrows from the origin
 *   drag: ['tiger'],           // words the learner can drag
 *   snap: 0.5,                 // grid for dragging
 *   probe: { at: [0, 0] },     // a draggable point that is not a word; the word nearest to it is reported
 *   offset: { from: 'man', to: 'woman', at: 'king', copy: true },
 *                              // an arrow from `from` to `to`; with copy: true the same arrow is drawn again starting at `at`
 *   line: true,                // false: no line of words under the picture (and the nearest word to the probe is not given away)
 *   static: false,             // true: a picture, nothing to tap or drag
 * }
 *
 * State: { selected, measure, neighbours, positions, probe, probeNearest, probeDistance, visited }
 *   neighbours     the closest words to the selected one, best first: [{ word, value }]
 *   positions      { word: [x, y] } for every word
 *   probe          [x, y] of the probe (null without one), probeNearest the word nearest to it (by distance),
 *                  probeDistance how far away that word is
 *   visited        every word that has been selected so far, in order of first selection
 *
 * setState accepts { selected, positions: { tiger: [3, 5] }, probe: [x, y], visited: [...] }.
 */
import { frame, plane, drawAxes, handle, hue, s, h, clamp, tidy, snapTo, arrowMarker, mdInline, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

addStyles('word-map', `
  .widget-word-map .wm-line { text-align: center; min-height: 2.8em; display: grid; align-content: center; gap: 2px; font-size: var(--fs-md); }
  .widget-word-map .wm-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 600; }
  .widget-word-map .wm-word { cursor: pointer; outline: none; }
  .widget-word-map .wm-word:focus-visible .wm-ring { stroke: var(--focus); stroke-width: 4; opacity: 1; }
  .widget-word-map.is-readonly .wm-word { cursor: default; pointer-events: none; }
`);

/** The hand-made map used in the lessons. Groups: 0 animals, 1 people, 2 food. */
export const WORDS = [
  { text: 'cat', at: [3, 4], group: 0 },
  { text: 'dog', at: [4, 3], group: 0 },
  { text: 'kitten', at: [4.5, 5.5], group: 0 },
  { text: 'puppy', at: [5.5, 4.5], group: 0 },
  { text: 'man', at: [-5, 1], group: 1 },
  { text: 'woman', at: [-5, 3], group: 1 },
  { text: 'king', at: [-2, 3], group: 1 },
  { text: 'queen', at: [-2, 5], group: 1 },
  { text: 'apple', at: [-2, -4], group: 2 },
  { text: 'pear', at: [-1, -5], group: 2 },
  { text: 'bread', at: [2, -4], group: 2 },
  { text: 'cheese', at: [3, -3], group: 2 },
];
const GROUP_COLORS = ['orange', 'blue', 'green', 'pink', 'teal'];

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const length = (a) => Math.hypot(a[0], a[1]);
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const cosine = (a, b) => (length(a) && length(b) ? dot(a, b) / (length(a) * length(b)) : 0);

/** The other words ranked by closeness to `from`: [{ word, value }], best first. Ties keep the order of the list. */
export function rank(words, from, measure = 'distance') {
  const origin = words.find((w) => w.text === from);
  if (!origin) return [];
  const value = (w) => (measure === 'dot' ? dot(origin.at, w.at) : measure === 'cosine' ? cosine(origin.at, w.at) : distance(origin.at, w.at));
  const list = words.filter((w) => w.text !== from).map((w) => ({ word: w.text, value: value(w) }));
  return list.sort((a, b) => (measure === 'distance' ? a.value - b.value : b.value - a.value));
}

/** The word nearest (by distance) to a point. */
export function nearestTo(words, point, skip = []) {
  let best = null;
  for (const w of words) {
    if (skip.includes(w.text)) continue;
    const d = distance(w.at, point);
    if (!best || d < best.distance - 1e-12) best = { word: w.text, distance: d };
  }
  return best;
}

const SIZE = 480;

export default function create(spec, env) {
  const words = (Array.isArray(spec.words) ? spec.words : WORDS).map((w) => ({ text: String(w.text), at: [Number(w.at[0]), Number(w.at[1])], group: w.group || 0 }));
  const range = spec.range || 7;
  const measure = ['dot', 'cosine'].includes(spec.measure) ? spec.measure : 'distance';
  const count = spec.nearest != null ? spec.nearest : 3;
  const isStatic = !!spec.static || !!env.compact;
  const snap = spec.snap || 0.5;
  const dragList = isStatic ? [] : (spec.drag || []).filter((t) => words.some((w) => w.text === t));
  const probeDef = spec.probe && typeof spec.probe === 'object' ? spec.probe : null;
  const offset = spec.offset && typeof spec.offset === 'object' ? spec.offset : null;
  let readOnly = !!env.readOnly;
  const byText = (t) => words.find((w) => w.text === t);
  let selected = spec.select && byText(spec.select) ? spec.select : null;
  const visited = selected ? [selected] : [];
  let probe = probeDef ? [Number(probeDef.at ? probeDef.at[0] : 0), Number(probeDef.at ? probeDef.at[1] : 0)] : null;

  const fit = (v) => tidy(clamp(snapTo(v, snap), -range + 0.5, range - 0.5), 4);

  const getState = () => {
    const near = probe ? nearestTo(words, probe) : null;
    return {
      selected,
      measure,
      neighbours: selected ? rank(words, selected, measure).slice(0, count).map((n) => ({ word: n.word, value: tidy(n.value, 4) })) : [],
      positions: Object.fromEntries(words.map((w) => [w.text, [w.at[0], w.at[1]]])),
      probe: probe ? [probe[0], probe[1]] : null,
      probeNearest: near ? near.word : null,
      probeDistance: near ? tidy(near.distance, 4) : null,
      visited: visited.slice(),
    };
  };

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: SIZE, height: SIZE, compact: env.compact, maxWidth: 520, label: spec.alt || 'A map of words' });
  const { svg } = fr;
  const pl = plane({ x: [-range, range], y: [-range, range], width: SIZE, height: SIZE, pad: { l: 12, r: 12, t: 12, b: 12 } });
  svg.appendChild(drawAxes(pl, { xStep: 1, yStep: 1, labels: false }));
  // a few numbers along the axes, enough to read coordinates off
  for (let v = -range + 1; v < range; v += 2) {
    if (v === 0) continue;
    svg.appendChild(s('text.tick-label', { x: pl.sx(v), y: pl.sy(0) + 15, 'text-anchor': 'middle' }, formatNumber(v, 0)));
    svg.appendChild(s('text.tick-label', { x: pl.sx(0) - 6, y: pl.sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 0)));
  }
  const arrowInk = arrowMarker(svg, 'ink-2', 5);
  const arrowViolet = arrowMarker(svg, 'violet', 4);
  const gLinks = s('g');
  const gWords = s('g');
  const gTop = s('g');
  svg.append(gLinks, gWords, gTop);

  const line = h('div.wm-line');
  if (!env.compact && spec.line !== false) fr.el.insertBefore(line, fr.readouts);

  const fmt = (v, d = 2) => formatNumber(tidy(v, 6), d);
  const marker = (group, x, y, r, attrs) => {
    const kind = group % 3;
    if (kind === 1) return s('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, rx: 2, ...attrs });
    if (kind === 2) return s('path', { d: `M${x} ${y - r * 1.2} L${x + r * 1.1} ${y + r * 0.8} L${x - r * 1.1} ${y + r * 0.8} Z`, 'stroke-linejoin': 'round', ...attrs });
    return s('circle', { cx: x, cy: y, r, ...attrs });
  };

  const handles = {};
  const wordEls = {};
  function select(text, quiet = false) {
    if (readOnly || !byText(text)) return;
    selected = text;
    if (!visited.includes(text)) visited.push(text);
    if (!quiet) play('select');
    const hadFocus = typeof document !== 'undefined' && gWords.contains(document.activeElement);
    draw();
    // the words are redrawn, so the keyboard focus has to be handed to the new copy
    if (hadFocus && wordEls[text]) wordEls[text].focus({ preventScroll: true });
    env.announce(describe());
    env.onChange(getState());
  }
  const measureWords = { distance: 'distance', dot: 'dot product', cosine: 'cosine similarity' };
  function describe() {
    const st = getState();
    if (!st.selected) return '';
    return `${measure === 'distance' ? 'Closest to' : 'Most similar to'} ${st.selected}, by ${measureWords[measure]}: ${st.neighbours.map((n) => `${n.word} ${fmt(n.value)}`).join(', ')}.`;
  }

  function draw() {
    const st = getState();
    const near = new Set(st.neighbours.map((n) => n.word));
    gLinks.replaceChildren();
    gWords.replaceChildren();
    gTop.replaceChildren();

    // links from the selected word to its neighbours (or arrows from the origin, for dot product and cosine)
    if (selected) {
      const from = byText(selected);
      if (spec.arrows) {
        for (const w of [from, ...words.filter((q) => near.has(q.text))]) {
          const main = w === from;
          gLinks.appendChild(s('line', { x1: pl.sx(0), y1: pl.sy(0), x2: pl.sx(w.at[0]), y2: pl.sy(w.at[1]), stroke: main ? 'var(--ink)' : 'var(--ink-2)', 'stroke-width': main ? 3 : 2, 'stroke-linecap': 'round', 'marker-end': arrowInk, opacity: main ? 1 : 0.7 }));
        }
      } else {
        for (const w of words) {
          if (!near.has(w.text)) continue;
          gLinks.appendChild(s('line', { x1: pl.sx(from.at[0]), y1: pl.sy(from.at[1]), x2: pl.sx(w.at[0]), y2: pl.sy(w.at[1]), stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }));
        }
      }
    }
    // the offset arrow, and its copy
    if (offset && byText(offset.from) && byText(offset.to)) {
      const a = byText(offset.from).at;
      const b = byText(offset.to).at;
      const arrow = (p, q, dashed) => gLinks.appendChild(s('line', { x1: pl.sx(p[0]), y1: pl.sy(p[1]), x2: pl.sx(q[0]), y2: pl.sy(q[1]), stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'marker-end': arrowViolet, 'stroke-dasharray': dashed ? '7 6' : null }));
      arrow(a, b, false);
      if (offset.copy && byText(offset.at)) {
        const c = byText(offset.at).at;
        arrow(c, [c[0] + b[0] - a[0], c[1] + b[1] - a[1]], true);
      }
    }
    // the words
    for (const w of words) {
      const x = pl.sx(w.at[0]);
      const y = pl.sy(w.at[1]);
      const color = GROUP_COLORS[w.group % GROUP_COLORS.length];
      const isSel = w.text === selected;
      const isNear = near.has(w.text);
      const draggable = dragList.includes(w.text);
      const labelLeft = w.at[0] > range - 1.2;
      const text = s('text', { class: 'fig-label', x: labelLeft ? x - 11 : x, y: labelLeft ? y + 5 : y - 12, 'text-anchor': labelLeft ? 'end' : 'middle' }, w.text);
      if (draggable) {
        // a draggable word: the handle is the marker
        gTop.appendChild(text);
        continue;
      }
      const g = s('g.wm-word');
      g.appendChild(s('circle', { cx: x, cy: y, r: 26, fill: 'transparent' }));
      g.appendChild(s('circle.wm-ring', { cx: x, cy: y, r: 13, fill: isSel ? hue('yellow', 'soft') : 'none', stroke: isSel ? 'var(--ink)' : isNear ? 'var(--ink-2)' : 'none', 'stroke-width': isSel ? 3 : 2, 'stroke-dasharray': isSel ? null : '3 3', opacity: isSel || isNear ? 1 : 0 }));
      g.appendChild(marker(w.group, x, y, 6.5, { fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
      g.appendChild(text);
      if (!isStatic) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `${w.text}, at ${fmt(w.at[0])}, ${fmt(w.at[1])}${isSel ? ', selected' : ''}`);
        g.setAttribute('aria-pressed', String(isSel));
        g.dataset.keys = 'own';
        g.addEventListener('click', () => select(w.text));
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); select(w.text); } });
      }
      wordEls[w.text] = g;
      gWords.appendChild(g);
    }
    // draggable things keep their handles; only their positions are refreshed
    for (const t of dragList) {
      const w = byText(t);
      handles[t].set(pl.sx(w.at[0]), pl.sy(w.at[1]));
      handles[t].setLabel(`${t} at ${fmt(w.at[0])}, ${fmt(w.at[1])}`);
    }
    if (probe && handles.probe) {
      handles.probe.set(pl.sx(probe[0]), pl.sy(probe[1]));
      handles.probe.setLabel(`point at ${fmt(probe[0])}, ${fmt(probe[1])}; nearest word ${st.probeNearest}`);
      // without the line of words under the picture, the coordinates ride along with the point, on whichever side has room
      if (spec.line === false) {
        const tight = probe[0] > range - 3.5;
        gTop.appendChild(s('text', { class: 'fig-label text-pink', x: pl.sx(probe[0]) + (tight ? -14 : 14), y: pl.sy(probe[1]) + 22, 'text-anchor': tight ? 'end' : 'start' }, `(${fmt(probe[0])}, ${fmt(probe[1])})`));
      }
    }
    if (probe && isStatic) {
      gTop.appendChild(s('circle', { cx: pl.sx(probe[0]), cy: pl.sy(probe[1]), r: 9, fill: hue('pink'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
    }

    // the line of words under the picture
    const rows = [];
    if (selected) {
      const sel = byText(selected);
      const lead = measure === 'distance' ? 'Closest to' : 'Most similar to';
      rows.push(h('span', { html: mdInline(`${lead} **${selected}** (${fmt(sel.at[0])}, ${fmt(sel.at[1])}): ${st.neighbours.map((n) => `${n.word} ${fmt(n.value)}`).join(' · ')}`) }));
      rows.push(h('small', `measured by ${measureWords[measure]}: ${measure === 'distance' ? 'smaller is closer' : 'larger is more alike'}`));
    } else if (!probe) {
      rows.push(h('small', 'Tap a word to see its closest neighbours.'));
    }
    if (probe) {
      rows.push(h('span', { html: mdInline(`The point is at (${fmt(probe[0])}, ${fmt(probe[1])}). Nearest word: **${st.probeNearest}**${st.probeDistance < 1e-9 ? ', exactly' : `, ${fmt(st.probeDistance)} away`}`) }));
    }
    line.replaceChildren(...rows);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${describe()}${probe ? ` A point is marked at ${fmt(probe[0])}, ${fmt(probe[1])}${spec.line === false ? '' : `; the nearest word is ${st.probeNearest}`}.` : ''}`);
  }

  // handles are made once
  for (const t of dragList) {
    const w = byText(t);
    handles[t] = handle(svg, {
      x: pl.sx(w.at[0]), y: pl.sy(w.at[1]), color: GROUP_COLORS[w.group % GROUP_COLORS.length], label: t, keyStep: pl.kx * snap,
      onMove: (px, py) => {
        if (readOnly) return;
        const nx = fit(pl.ux(px));
        const ny = fit(pl.uy(py));
        if (nx === w.at[0] && ny === w.at[1]) return;
        w.at = [nx, ny];
        if (selected !== t) { selected = t; if (!visited.includes(t)) visited.push(t); }
        draw();
        env.onChange(getState());
      },
    });
  }
  if (probe && !isStatic) {
    handles.probe = handle(svg, {
      x: pl.sx(probe[0]), y: pl.sy(probe[1]), color: 'pink', label: 'movable point', shape: 'square', keyStep: pl.kx * snap,
      onMove: (px, py) => {
        if (readOnly) return;
        const nx = fit(pl.ux(px));
        const ny = fit(pl.uy(py));
        if (nx === probe[0] && ny === probe[1]) return;
        probe = [nx, ny];
        draw();
        env.onChange(getState());
      },
    });
  }
  draw();
  for (const key of Object.keys(handles)) svg.appendChild(handles[key].el);
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.positions) {
        for (const [t, at] of Object.entries(next.positions)) {
          const w = byText(t);
          if (w && Array.isArray(at)) w.at = [Number(at[0]), Number(at[1])];
        }
      }
      if (Array.isArray(next.probe) && probe) probe = [Number(next.probe[0]), Number(next.probe[1])];
      if (Array.isArray(next.visited)) for (const t of next.visited) if (byText(t) && !visited.includes(t)) visited.push(t);
      if (next.selected && byText(next.selected)) { selected = next.selected; if (!visited.includes(selected)) visited.push(selected); }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key of Object.keys(handles)) handles[key].setEnabled(!readOnly);
    },
    destroy() { for (const key of Object.keys(handles)) handles[key].destroy(); },
  };
}

export const examples = [
  { title: 'word-map — tap a word, see its neighbours', spec: { type: 'word-map', select: 'cat' } },
  { title: 'word-map — cosine similarity, with arrows', spec: { type: 'word-map', select: 'king', measure: 'cosine', arrows: true } },
  {
    title: 'word-map — king − man + woman',
    spec: { type: 'word-map', select: false, offset: { from: 'man', to: 'woman', at: 'king', copy: true }, probe: { at: [0, 0] } },
  },
];
