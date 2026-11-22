/**
 * op-machine — a chain of "function machines". A number goes in on the left,
 * each machine does one operation to it, and the result comes out on the
 * right. Run it forwards to watch an expression such as 2x + 3 being built;
 * run it backwards to see why an equation is solved by undoing the
 * operations in reverse order ("last on, first off").
 *
 * {
 *   type: 'op-machine',
 *   ops: ['*2', '+3'],          // the machines, left to right: '+3', '-4', '*2', '/5'
 *   mode: 'run',                // 'run'  — the learner picks the input and watches it flow through
 *                               // 'undo' — the input is hidden; the learner works back from the output
 *   input: 4,                   // run: the starting input · undo: the hidden input
 *   min: 0, max: 10, step: 1,   // run: range of the input slider
 *   target: 11,                 // run: an output to aim for (optional; see `hit` in the state)
 *   undo: ['-3', '/2'],         // undo: moves already made (for finished pictures, or a head start)
 *   choices: ['+3', '-3', '*2', '/2'],   // undo: the moves on offer (default: every machine and its opposite)
 *   symbol: 'x',                // the letter on the hidden input
 *   exprs: false,               // true: caption each stage with its expression (x, 2x, 2x + 3)
 *   static: false,              // true: picture only, no controls
 * }
 *
 * State in 'run' mode:  { input, values, output, hit }
 *   values  — every stage, input first, output last
 *   hit     — the output equals `target`
 *
 * State in 'undo' mode: { moves, values, value, done, onTrack, solved, check }
 *   moves   — the moves made so far, e.g. ['-3', '/2']
 *   values  — the output followed by the result of each move
 *   value   — the number the learner has worked back to
 *   done    — one move has been made for every machine
 *   onTrack — every move so far undoes the right machine, in the right order
 *   solved  — done, and `value` really is the hidden input
 *   check   — what comes out when `value` is fed forwards again (null until done)
 *
 * In an `interact` step a solution is just { moves: ['-3', '/2'] } or { input: 4 }.
 */
import { frame, button, sliderRow, hue, s, h, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('op-machine', `
  .widget-op-machine .om-moves { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-op-machine .om-move { min-width: 74px; min-height: 46px; gap: 0.3rem; font-size: 1.15rem; font-variant-numeric: tabular-nums; }
  .widget-op-machine .om-sign { font-size: 1.3em; line-height: 0.8; }
  .widget-op-machine .btn-ghost { box-shadow: none; min-height: 40px; }
  /* nothing in the drawing is dragged, so a finger on it may still scroll the page */
  .widget-op-machine .w-canvas svg { touch-action: manipulation; }
  .widget-op-machine .om-check {
    justify-self: center;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  .widget-op-machine .om-check:empty { display: none; }
  .widget-op-machine .om-check.is-good { border-style: solid; border-color: var(--green); background: var(--green-soft); }
  .widget-op-machine .om-check.is-bad { border-style: solid; border-color: var(--red); background: var(--red-soft); }
  .widget-op-machine .om-new { animation: om-fade 0.3s var(--ease-out) both; }
  @keyframes om-fade { from { opacity: 0; } to { opacity: 1; } }
`);

const SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const VERB = { '+': 'Add', '-': 'Subtract', '*': 'Multiply by', '/': 'Divide by' };
const OPPOSITE = { '+': '-', '-': '+', '*': '/', '/': '*' };
const ORDER = '+-*/';

function parseOp(src) {
  if (src && typeof src === 'object') return { op: src.op, n: Number(src.n) };
  const text = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  const m = /^\s*([+\-*/])\s*(\d+(?:\.\d+)?)\s*$/.exec(text);
  if (!m) throw new Error(`cannot read the operation "${src}" (write it like '+3', '-4', '*2' or '/5')`);
  return { op: m[1], n: Number(m[2]) };
}

const apply = (v, o) => (o.op === '+' ? v + o.n : o.op === '-' ? v - o.n : o.op === '*' ? v * o.n : v / o.n);
const tidy = (v) => { const r = Math.round(v * 1e9) / 1e9; return Object.is(r, -0) ? 0 : r; };
const idOf = (o) => `${o.op}${o.n}`;
const opposite = (o) => ({ op: OPPOSITE[o.op], n: o.n });
const show = (v) => formatNumber(v, 2);
const labelOf = (o) => `${SYMBOL[o.op]} ${show(o.n)}`;
const wordsOf = (o) => `${VERB[o.op]} ${show(o.n)}`;

/** Every machine and its opposite, in a neutral order (+ and − first, then × and ÷) that gives nothing away. */
function defaultChoices(ops) {
  const seen = new Map();
  for (const o of ops) for (const c of [o, opposite(o)]) seen.set(idOf(c), c);
  const group = (o) => (ORDER.indexOf(o.op) < 2 ? 0 : 1);
  return Array.from(seen.values()).sort((a, b) => group(a) - group(b) || a.n - b.n || ORDER.indexOf(a.op) - ORDER.indexOf(b.op));
}

/** The expression after each machine, as text pieces: [['2', false], ['x', true], [' + 3', false]] (true marks the letter). */
function buildExprs(ops, symbol) {
  let parts = [[symbol, true]];
  let kind = 'atom'; // atom | product | sum | quotient
  const out = [parts];
  const wrap = (p) => [['(', false], ...p, [')', false]];
  for (const o of ops) {
    const num = show(o.n);
    if (o.op === '+' || o.op === '-') {
      parts = [...parts, [` ${SYMBOL[o.op]} ${num}`, false]];
      kind = 'sum';
    } else if (o.op === '*') {
      parts = [[num, false], ...(kind === 'atom' ? parts : wrap(parts))];
      kind = 'product';
    } else {
      parts = [...(kind === 'sum' ? wrap(parts) : parts), [` ÷ ${num}`, false]];
      kind = 'quotient';
    }
    out.push(parts);
  }
  return out;
}

const SLOT_W = 62;
const SLOT_H = 50;
const OP_W = 72;
const OP_H = 46;
const GAP = 24;
const PAD = 14;

export default function create(spec, env) {
  const ops = (spec.ops && spec.ops.length ? spec.ops : ['*2', '+3']).map(parseOp);
  const n = ops.length;
  const mode = spec.mode === 'undo' ? 'undo' : 'run';
  const interactive = !spec.static && !env.compact;
  const symbol = spec.symbol || 'x';
  const min = spec.min != null ? spec.min : 0;
  const max = spec.max != null ? spec.max : 10;
  const target = spec.target != null ? spec.target : null;
  const choices = (spec.choices ? spec.choices.map(parseOp) : defaultChoices(ops));
  const exprs = spec.exprs ? buildExprs(ops, symbol) : null;
  let readOnly = !!env.readOnly;

  let input = Number.isFinite(spec.input) ? spec.input : min;
  let moves = (spec.undo || []).map(parseOp).slice(0, n);
  let fresh = -1; // index of the move that was just made (it fades in)
  // A picture with no moves made shows just the machine; the return row appears once there is something on it.
  const showBack = mode === 'undo' && (interactive || moves.length > 0);

  const forward = (v) => { const out = [v]; for (const o of ops) out.push(tidy(apply(out[out.length - 1], o))); return out; };
  const backward = () => { const out = [forward(input)[n]]; for (const m of moves) out.push(tidy(apply(out[out.length - 1], m))); return out; };

  function getState() {
    if (mode === 'run') {
      const values = forward(input);
      return { input, values, output: values[n], hit: target != null && Math.abs(values[n] - target) < 1e-9 };
    }
    const values = backward();
    const value = values[values.length - 1];
    const done = moves.length === n;
    return {
      moves: moves.map(idOf),
      values,
      value,
      done,
      onTrack: moves.every((m, i) => idOf(m) === idOf(opposite(ops[n - 1 - i]))),
      solved: done && Math.abs(value - input) < 1e-9,
      check: done ? forward(value)[n] : null,
    };
  }

  /* ------------------------------------------------------------ geometry */
  const contentW = (n + 1) * SLOT_W + n * OP_W + 2 * n * GAP;
  const W = Math.max(contentW + 2 * PAD, 360);
  const left = (W - contentW) / 2;
  const ROW1 = 64;
  const ROW2 = ROW1 + 102;
  const H = showBack ? ROW2 + SLOT_H / 2 + 14 : ROW1 + SLOT_H / 2 + (mode === 'run' && target != null ? 36 : 14);
  const slotX = (j) => left + j * (SLOT_W + OP_W + 2 * GAP) + SLOT_W / 2;   // centre of value window j (0…n)
  const opX = (j) => slotX(j) + SLOT_W / 2 + GAP + OP_W / 2;                // centre of machine j (0…n-1)

  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'Function machine', maxWidth: Math.min(560, Math.round(W * 1.16)) });
  const { svg } = fr;
  const layer = s('g');
  svg.appendChild(layer);

  const line = (d, color = 'var(--ink-2)') => s('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  /** A straight arrow along y from x1 to x2 (either direction). */
  const arrow = (x1, x2, y, color) => { const dir = x2 > x1 ? 1 : -1; return line(`M${x1} ${y} H${x2} M${x2 - dir * 7} ${y - 5.5} L${x2} ${y} L${x2 - dir * 7} ${y + 5.5}`, color); };

  function textIn(cx, cy, str, { fill = 'var(--ink)', size = 20, math = false } = {}) {
    const fit = str.length > 5 ? 14 : str.length > 4 ? 16 : str.length > 3 ? 18 : size;
    return s('text', {
      x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: math ? 'fig-label-lg fig-math' : 'fig-label-lg',
      style: `fill:${fill};stroke:none;font-size:${Math.min(size, fit)}px`,
    }, str);
  }

  /** "× 2" with the sign drawn a little larger than the number, so that × and ÷ are easy to tell apart. */
  function opText(cx, cy, o, fill) {
    const t = s('text', { x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'fig-label-lg', style: `fill:${fill};stroke:none;font-size:19px` });
    t.appendChild(s('tspan', { style: 'font-size:25px' }, SYMBOL[o.op]));
    t.appendChild(s('tspan', { dx: 5 }, show(o.n)));
    return t;
  }

  /** A value window. kind: value | letter | unknown | empty | good | bad */
  function slot(cx, cy, str, kind, cls) {
    const g = s('g', { class: cls || null });
    const box = { x: cx - SLOT_W / 2, y: cy - SLOT_H / 2, width: SLOT_W, height: SLOT_H, rx: 11, 'stroke-width': 2.5 };
    if (kind === 'empty') g.appendChild(s('rect', { ...box, fill: 'none', stroke: 'var(--hair)', 'stroke-dasharray': '6 6' }));
    else if (kind === 'letter') g.appendChild(s('rect', { ...box, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 3 }));
    else if (kind === 'unknown') g.appendChild(s('rect', { ...box, fill: 'var(--surface)', stroke: 'var(--ink-3)', 'stroke-dasharray': '6 6' }));
    else g.appendChild(s('rect', { ...box, fill: kind === 'good' ? hue('green', 'soft') : kind === 'bad' ? hue('red', 'soft') : 'var(--surface)', stroke: 'var(--edge)' }));
    if (kind === 'letter') g.appendChild(textIn(cx, cy, str, { fill: '#1D1B26', size: 24, math: true }));
    else if (kind === 'unknown') g.appendChild(textIn(cx, cy, '?', { fill: 'var(--ink-3)' }));
    else if (kind !== 'empty') g.appendChild(textIn(cx, cy, str));
    if (kind === 'good' || kind === 'bad') {
      const bx = cx + SLOT_W / 2 - 3;
      const by = cy - SLOT_H / 2 + 3;
      g.appendChild(s('circle', { cx: bx, cy: by, r: 10, fill: hue(kind === 'good' ? 'green' : 'red'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
      g.appendChild(s('path', {
        d: kind === 'good' ? `M${bx - 4.5} ${by + 0.5} l3.2 3.2 l5.8 -6.6` : `M${bx - 3.8} ${by - 3.8} l7.6 7.6 M${bx + 3.8} ${by - 3.8} l-7.6 7.6`,
        fill: 'none', stroke: '#1D1B26', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));
    }
    return g;
  }

  /** A machine. kind: forward | undo | empty */
  function machine(cx, cy, o, kind, cls) {
    const g = s('g', { class: cls || null });
    const box = { x: cx - OP_W / 2, y: cy - OP_H / 2, width: OP_W, height: OP_H, rx: OP_H / 2 };
    if (kind === 'empty') {
      g.appendChild(s('rect', { ...box, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2.5, 'stroke-dasharray': '6 6' }));
      g.appendChild(textIn(cx, cy, '?', { fill: 'var(--ink-3)', size: 18 }));
    } else if (kind === 'undo') {
      g.appendChild(s('rect', { ...box, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 3 }));
      g.appendChild(opText(cx, cy, o, '#1D1B26'));
    } else {
      g.appendChild(s('rect', { ...box, fill: hue('blue', 'soft'), stroke: 'var(--edge)', 'stroke-width': 2.5 }));
      g.appendChild(opText(cx, cy, o, 'var(--ink)'));
    }
    return g;
  }

  /** Small text above or below a window. Long captions at either end are tucked inwards so they stay on the canvas. */
  function caption(j, y, parts, muted) {
    const long = parts.reduce((len, p) => len + p[0].length, 0) > 8;
    const anchor = long && j === 0 ? 'start' : long && j === n ? 'end' : 'middle';
    const x = anchor === 'start' ? slotX(j) - SLOT_W / 2 : anchor === 'end' ? slotX(j) + SLOT_W / 2 : slotX(j);
    const t = s('text', { x, y, 'text-anchor': anchor, class: 'fig-label-sm', style: muted ? 'fill:var(--ink-3)' : 'fill:var(--ink-2);font-size:16px;font-weight:700' });
    for (const [str, isLetter] of parts) t.appendChild(s('tspan', isLetter ? { class: 'fig-math', style: 'font-size:19px' } : null, str));
    return t;
  }

  /* -------------------------------------------------------------- controls */
  const note = h('div.om-check', { 'aria-live': 'polite' });
  if (mode === 'undo' && interactive) fr.el.insertBefore(note, fr.readouts);

  let slider = null;
  if (mode === 'run' && interactive) {
    slider = sliderRow({
      label: spec.inputLabel || 'number in', min, max, step: spec.step || 1, value: input, color: 'blue',
      onInput: (v) => { if (readOnly) return; input = v; render(); env.onChange(getState()); },
    });
    if (readOnly) slider.setDisabled(true);
    fr.controls.appendChild(slider.el);
  }

  const moveButtons = [];
  const undoBtn = button('Undo', () => {
    if (readOnly || !moves.length) return;
    moves.pop();
    render();
    env.onChange(getState());
  }, { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Reset', () => {
    if (readOnly || !moves.length) return;
    moves = [];
    render();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });

  function makeMove(choice) {
    if (readOnly || moves.length >= n) return;
    const before = backward().pop();
    moves.push(choice);
    fresh = moves.length - 1;
    play('drop');
    render();
    env.announce(`${wordsOf(choice)}: ${show(before)} becomes ${show(backward().pop())}.`);
    env.onChange(getState());
  }

  if (mode === 'undo' && interactive) {
    const row = h('div.om-moves', { role: 'group', 'aria-label': 'Moves' });
    for (const c of choices) {
      const btn = button('', () => makeMove(c));
      btn.append(h('span.om-sign', { 'aria-hidden': 'true' }, SYMBOL[c.op]), h('span', { 'aria-hidden': 'true' }, show(c.n)));
      btn.classList.add('om-move');
      btn.setAttribute('aria-label', wordsOf(c));
      moveButtons.push(btn);
      row.appendChild(btn);
    }
    fr.controls.appendChild(row);
    fr.buttons.append(undoBtn, resetBtn);
  }

  /* --------------------------------------------------------------- render */
  function render() {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    const st = getState();
    const fwd = forward(input);
    const y1 = ROW1;

    // top row: the machine running forwards
    for (let j = 0; j < n; j++) {
      layer.appendChild(arrow(slotX(j) + SLOT_W / 2 + 4, opX(j) - OP_W / 2 - 4, y1));
      layer.appendChild(arrow(opX(j) + OP_W / 2 + 4, slotX(j + 1) - SLOT_W / 2 - 4, y1));
      layer.appendChild(machine(opX(j), y1, ops[j], 'forward'));
    }
    for (let j = 0; j <= n; j++) {
      let kind = 'value';
      if (mode === 'undo' && j === 0) kind = 'letter';
      else if (mode === 'undo' && j < n && !st.solved) kind = 'unknown';
      else if (mode === 'run' && j === n && st.hit) kind = 'good';
      layer.appendChild(slot(slotX(j), y1, kind === 'letter' ? symbol : show(fwd[j]), kind));
      const top = y1 - SLOT_H / 2 - 10;
      if (exprs) layer.appendChild(caption(j, top, exprs[j], false));
      else if (j === 0) layer.appendChild(caption(j, top, [['in', false]], true));
      else if (j === n) layer.appendChild(caption(j, top, [['out', false]], true));
    }
    if (mode === 'run' && target != null) layer.appendChild(caption(n, y1 + SLOT_H / 2 + 20, [[`goal: ${show(target)}`, false]], false));

    // bottom row: working backwards from the output
    if (showBack) {
      const y2 = ROW2;
      const xo = slotX(n);
      const on = 'var(--ink-2)';
      const off = 'var(--ink-3)';
      const tip = opX(n - 1) + OP_W / 2 + 5;
      layer.appendChild(line(`M${xo} ${y1 + SLOT_H / 2 + 4} V${y2 - 16} Q${xo} ${y2} ${xo - 16} ${y2} H${tip} M${tip + 7} ${y2 - 5.5} L${tip} ${y2} L${tip + 7} ${y2 + 5.5}`, on));
      for (let i = 0; i < n; i++) {
        const j = n - 1 - i;                 // the machine this move sits under
        const made = i < moves.length;
        const cls = i === fresh ? 'om-new' : null;
        layer.appendChild(arrow(opX(j) - OP_W / 2 - 4, slotX(j) + SLOT_W / 2 + 4, y2, made ? on : off));
        if (j > 0) layer.appendChild(arrow(slotX(j) - SLOT_W / 2 - 4, opX(j - 1) + OP_W / 2 + 4, y2, made ? on : off));
        layer.appendChild(machine(opX(j), y2, made ? moves[i] : null, made ? 'undo' : 'empty', cls));
        let kind = made ? 'value' : 'empty';
        if (made && j === 0) kind = st.solved ? 'good' : 'bad';
        layer.appendChild(slot(slotX(j), y2, made ? show(st.values[i + 1]) : '', kind, cls));
      }
    }

    // the same picture in words, for screen readers
    const chain = ops.map(wordsOf).join(', then ').toLowerCase();
    if (mode === 'run') {
      svg.setAttribute('aria-label', `Machine: ${chain}. In: ${show(input)}. Out: ${show(st.output)}.${target != null ? ` Goal: ${show(target)}.` : ''}`);
    } else {
      svg.setAttribute('aria-label', `Machine: ${chain}. Out: ${show(fwd[n])}. ${moves.length ? `Working backwards: ${moves.map(wordsOf).join(', then ').toLowerCase()} gives ${show(st.value)}.` : 'The number that went in is hidden.'}`);
    }

    // the running calculation, then a forward test of the finished answer
    if (mode === 'undo') {
      note.classList.toggle('is-good', st.done && st.solved);
      note.classList.toggle('is-bad', st.done && !st.solved);
      if (!moves.length) note.textContent = '';
      else if (!st.done) note.textContent = moves.map((m, i) => `${show(st.values[i])} ${labelOf(m)} = ${show(st.values[i + 1])}`).join(', then ');
      else {
        const test = forward(st.value);
        const steps = ops.map((o, j) => `${show(test[j])} ${labelOf(o)} = ${show(test[j + 1])}`).join(', then ');
        note.textContent = st.solved
          ? `Test ${show(st.value)}: ${steps}. It works ✓`
          : `Test ${show(st.value)}: ${steps}. That is not ${show(fwd[n])}.`;
      }
      for (const btn of moveButtons) btn.disabled = readOnly || st.done;
      undoBtn.disabled = readOnly || !moves.length;
      resetBtn.disabled = readOnly || !moves.length;
    }
    fresh = -1;
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'run') {
        if (typeof next.input === 'number') { input = next.input; if (slider) slider.set(input); }
      } else if (Array.isArray(next.moves)) {
        moves = next.moves.map(parseOp).slice(0, n);
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      render();
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'op-machine — run it forwards', spec: { type: 'op-machine', ops: ['*3', '-2'], mode: 'run', input: 2, min: 0, max: 10, target: 19 } },
  { title: 'op-machine — work backwards from the output', spec: { type: 'op-machine', ops: ['*2', '+3'], mode: 'undo', input: 4 } },
  { title: 'op-machine — finished picture with expressions', spec: { type: 'op-machine', ops: ['*2', '+3'], mode: 'undo', input: 4, undo: ['-3', '/2'], exprs: true, static: true } },
];
