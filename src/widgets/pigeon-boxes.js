/**
 * pigeon-boxes — pigeons and pigeonholes. Things go into boxes, and a box
 * that holds two or more lights up. It is a model for trying to *avoid* a
 * collision, and for seeing that with more things than boxes it cannot be done.
 *
 * Two modes:
 *
 * { type: 'pigeon-boxes', mode: 'place', boxes: 5, pigeons: 6 }
 *   The learner decides where each pigeon goes: tap a box to put the next
 *   waiting pigeon in, tap a pigeon in a box to take it out again.
 *
 * { type: 'pigeon-boxes', mode: 'choose',
 *   boxes: ['0', '1', '2', '3', '4'],     // box labels (or a number of boxes)
 *   boxTitle: 'remainder on division by 5',
 *   pool: [3, 7, 12, 14, 18, 21, 25, 26], // the things on offer (numbers or short strings), at most 18
 *   boxOf: (item) => item % 5,            // the box (counted from 0) each thing belongs in
 *   limit: 6 }                            // how many things may be chosen
 *   The learner decides which things to take; where each one lands is fixed by the rule.
 *
 * State: { counts, placed, waiting, max, shared, allPlaced, chosen, contents }
 *   counts     how many things are in each box
 *   placed     how many things are in boxes; `waiting`: how many more can still be placed
 *   max        the largest number in any one box
 *   shared     how many boxes hold two or more
 *   allPlaced  nothing is waiting (place mode), or `limit` things have been chosen (choose mode)
 *   chosen     choose mode: the chosen things, in the order they were picked
 *   contents   what is in each box (pigeon numbers in place mode, the things themselves in choose mode)
 *
 * setState accepts { counts: [2, 1, 1, 1, 1] } in place mode and { chosen: [3, 7, 12] } in choose mode.
 */
import { frame, readout, button, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('pigeon-boxes', `
  .widget-pigeon-boxes .pb-tap { cursor: pointer; outline: none; }
  .widget-pigeon-boxes .pb-tap:focus-visible > :first-child { stroke: var(--focus); stroke-width: 4; }
  .widget-pigeon-boxes.is-readonly .pb-tap { cursor: default; pointer-events: none; }
  .widget-pigeon-boxes .pb-item-text { font-size: 15px; fill: #1D1B26; stroke: none !important; pointer-events: none; }
`);

const W = 400;

export default function create(spec, env) {
  const labels = Array.isArray(spec.boxes) ? spec.boxes.map(String) : Array.from({ length: clamp(Math.round(spec.boxes || 5), 2, 8) }, (_, i) => String(i + 1));
  const nBoxes = labels.length;
  const choosing = spec.mode === 'choose' && Array.isArray(spec.pool) && typeof spec.boxOf === 'function';
  const pool = choosing ? spec.pool.slice(0, 18) : [];
  const total = choosing ? clamp(Math.round(spec.limit || nBoxes + 1), 1, pool.length) : clamp(Math.round(spec.pigeons || nBoxes + 1), 1, 12);
  const boxOf = (item) => clamp(Math.round(spec.boxOf(item)), 0, nBoxes - 1);
  const isStatic = !!spec.static || env.compact;
  let readOnly = !!env.readOnly;
  /** contents[b] = the things in box b: pigeon numbers (place mode) or pool items (choose mode) */
  let contents = labels.map(() => []);
  let chosen = [];

  const perRow = choosing ? Math.min(9, Math.ceil(pool.length / (pool.length > 9 ? 2 : 1))) : total;
  const poolRows = choosing ? Math.ceil(pool.length / perRow) : 1;
  const slot = Math.min(50, (W - 16) / perRow);
  const topH = choosing ? poolRows * 46 + 14 : 54;
  const boxTop = topH + 22;
  const boxH = 124;
  const bw = Math.min(84, (W - 14) / nBoxes - 8);
  const H = boxTop + boxH + (spec.boxTitle ? 52 : 32);
  const boxX = (b) => W / 2 + (b - (nBoxes - 1) / 2) * (bw + 8) - bw / 2;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Things to put into boxes' });
  const { svg } = fr;
  const layer = s('g');
  svg.appendChild(layer);
  const roPlaced = readout(choosing ? 'chosen' : 'placed', { digits: 0 });
  const roMax = readout('most in one box', { digits: 0, color: 'orange' });
  if (!env.compact) fr.readouts.append(roPlaced.el, roMax.el);

  const placed = () => contents.reduce((t, c) => t + c.length, 0);
  function getState() {
    const counts = contents.map((c) => c.length);
    const n = placed();
    return {
      counts, placed: n, waiting: total - n, max: Math.max(...counts), shared: counts.filter((c) => c >= 2).length,
      allPlaced: n >= total, chosen: chosen.slice(), contents: contents.map((c) => c.slice()),
    };
  }

  /** A small bird: body, wing, beak and eye. */
  function pigeon(x, y, color) {
    const g = s('g');
    g.appendChild(s('ellipse', { cx: x, cy: y, rx: 15, ry: 12, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
    g.appendChild(s('path', { d: `M${x + 13} ${y - 4}l9 3l-9 3.5`, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    g.appendChild(s('path', { d: `M${x - 9} ${y + 1}q7 9 14 0`, fill: 'none', stroke: '#1D1B26', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    g.appendChild(s('circle', { cx: x + 6, cy: y - 4, r: 2, fill: '#1D1B26' }));
    return g;
  }
  /** A numbered counter. */
  function chip(x, y, text, color) {
    const g = s('g');
    const w = Math.max(34, String(text).length * 10 + 16);
    g.appendChild(s('rect', { x: x - w / 2, y: y - 17, width: w, height: 34, rx: 17, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
    g.appendChild(s('text', { class: 'fig-label pb-item-text', x, y: y + 5, 'text-anchor': 'middle' }, String(text)));
    return g;
  }
  function tappable(g, label, onTap, key) {
    if (isStatic) return g;
    g.setAttribute('class', 'pb-tap');
    g.dataset.fk = key;
    g.setAttribute('tabindex', readOnly ? '-1' : '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', label);
    g.dataset.keys = 'own';
    g.addEventListener('click', (ev) => { ev.stopPropagation(); onTap(); });
    g.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      ev.stopPropagation();
      onTap();
    });
    return g;
  }

  function changed(sound) {
    play(sound);
    // the drawing is rebuilt, so put the keyboard focus back where it was (or on the first box)
    const active = typeof document !== 'undefined' && layer.contains(document.activeElement) ? document.activeElement.dataset.fk : null;
    draw();
    if (active) { const el = layer.querySelector(`[data-fk="${active}"]`) || layer.querySelector('[data-fk^="box"], [data-fk^="pool"]'); if (el) el.focus(); }
    const st = getState();
    env.announce(st.max >= 2 ? `A box now holds ${st.max}.` : `${st.placed} placed, no box holds two.`);
    env.onChange(st);
  }
  function addTo(b) {
    if (readOnly || choosing || placed() >= total) return;
    const used = new Set(contents.flat());
    let k = 1;
    while (used.has(k)) k++;
    contents[b].push(k);
    changed('drop');
  }
  function takeFrom(b, item) {
    if (readOnly) return;
    contents[b] = contents[b].filter((v) => v !== item);
    chosen = chosen.filter((v) => v !== item);
    changed('pop');
  }
  function pick(item) {
    if (readOnly || chosen.includes(item) || chosen.length >= total) return;
    chosen.push(item);
    contents[boxOf(item)].push(item);
    changed('drop');
  }

  function draw() {
    layer.replaceChildren();
    const st = getState();
    // the top row: waiting pigeons, or the pool to choose from
    if (choosing) {
      pool.forEach((item, i) => {
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, pool.length - row * perRow);
        const x = W / 2 + ((i % perRow) - (inRow - 1) / 2) * slot;
        const y = 30 + row * 46;
        if (chosen.includes(item)) {
          layer.appendChild(s('rect', { x: x - 18, y: y - 17, width: 36, height: 34, rx: 17, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
        } else {
          const g = chip(x, y, item, st.allPlaced ? 'gray' : 'yellow');
          layer.appendChild(st.allPlaced ? g : tappable(g, `Choose ${item}`, () => pick(item), `pool${i}`));
        }
      });
    } else {
      for (let k = 0; k < st.waiting; k++) layer.appendChild(pigeon(W / 2 + (k - (st.waiting - 1) / 2) * Math.min(46, (W - 50) / total) - 3, 30, 'gray'));
      if (!st.waiting) layer.appendChild(s('text', { class: 'fig-label-sm text-muted', x: W / 2, y: 34, 'text-anchor': 'middle' }, `All ${total} are in.`));
    }
    // the boxes
    labels.forEach((label, b) => {
      const x = boxX(b);
      const many = contents[b].length >= 2;
      const box = s('g');
      box.appendChild(s('path', {
        d: `M${x} ${boxTop}V${boxTop + boxH - 8}q0 8 8 8H${x + bw - 8}q8 0 8 -8V${boxTop}`,
        fill: many ? hue('orange', 'soft') : 'var(--surface)', stroke: many ? hue('orange') : 'var(--ink)', 'stroke-width': many ? 4 : 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));
      box.appendChild(s('rect', { x, y: boxTop - 14, width: bw, height: boxH + 14, fill: 'transparent' }));
      layer.appendChild(choosing ? box : tappable(box, `Box ${label}, holding ${contents[b].length}. Put the next pigeon here.`, () => addTo(b), `box${b}`));
      layer.appendChild(s('text', { class: 'fig-label', x: x + bw / 2, y: boxTop + boxH + 20, 'text-anchor': 'middle' }, label));
      if (many) layer.appendChild(s('text', { class: 'fig-label-sm text-orange', x: x + bw / 2, y: boxTop - 6, 'text-anchor': 'middle' }, `${contents[b].length} here`));
      const gapY = Math.min(34, (boxH - 34) / Math.max(1, contents[b].length - 1));
      contents[b].forEach((item, k) => {
        const cy = boxTop + boxH - 24 - k * gapY;
        const g = choosing ? chip(x + bw / 2, cy, item, many ? 'orange' : 'blue') : pigeon(x + bw / 2 - 3, cy, many ? 'orange' : 'blue');
        layer.appendChild(tappable(g, choosing ? `${item}, in box ${label}. Take it back.` : `A pigeon in box ${label}. Take it out.`, () => takeFrom(b, item), `in${b}-${k}`));
      });
    });
    if (spec.boxTitle) layer.appendChild(s('text', { class: 'fig-label-sm text-muted', x: W / 2, y: boxTop + boxH + 42, 'text-anchor': 'middle' }, spec.boxTitle));
    roPlaced.set(`${st.placed} of ${total}`);
    roMax.set(st.max);
    if (clearBtn) clearBtn.disabled = readOnly || !st.placed;
    svg.setAttribute('aria-label', `${nBoxes} boxes holding ${st.counts.join(', ')}. ${st.waiting} still to place.`);
  }

  let clearBtn = null;
  if (!isStatic) {
    clearBtn = button('Take them all out', () => { if (readOnly) return; contents = labels.map(() => []); chosen = []; draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(clearBtn);
  }
  if (!choosing && Array.isArray(spec.counts)) fill(spec.counts);
  if (choosing && Array.isArray(spec.chosen)) for (const item of spec.chosen) if (pool.includes(item) && !chosen.includes(item)) { chosen.push(item); contents[boxOf(item)].push(item); }
  draw();

  function fill(counts) {
    let k = 1;
    contents = labels.map((_, b) => Array.from({ length: Math.max(0, Math.round(counts[b] || 0)) }, () => k++));
  }

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (choosing && Array.isArray(next.chosen)) {
        contents = labels.map(() => []);
        chosen = [];
        for (const item of next.chosen) if (pool.includes(item) && !chosen.includes(item) && chosen.length < total) { chosen.push(item); contents[boxOf(item)].push(item); }
      } else if (!choosing && Array.isArray(next.counts)) fill(next.counts);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      draw();
    },
  };
}

export const examples = [
  { title: 'pigeon-boxes — six pigeons, five holes', spec: { type: 'pigeon-boxes', mode: 'place', boxes: 5, pigeons: 6 } },
  {
    title: 'pigeon-boxes — numbers sorted by their remainder',
    spec: { type: 'pigeon-boxes', mode: 'choose', boxes: ['0', '1', '2', '3', '4'], boxTitle: 'remainder on division by 5', pool: [3, 7, 12, 14, 18, 21, 25, 26, 31, 34, 40, 43, 47, 52, 58, 60], boxOf: (v) => v % 5, limit: 6 },
  },
];
