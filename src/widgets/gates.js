/**
 * gates — a logic circuit drawn from a spec: switches on the left, gates in
 * the middle, lamps on the right. Wires light up when they carry a 1.
 * The learner flips switches and, where the author leaves a slot open,
 * chooses which gate goes there.
 *
 * {
 *   type: 'gates',
 *   inputs: [
 *     { id: 'A', value: 0 },                    // a switch; label defaults to the id
 *     { id: 'B', value: 1, locked: true },      // locked: cannot be flipped
 *   ],
 *   gates: [
 *     { id: 'g1', type: 'AND', in: ['A', 'B'], col: 1, row: 0.5 },
 *     { id: 'g2', type: 'NOT', in: ['g1'], col: 2, row: 0.5 },
 *     { id: 's1', slot: ['AND', 'OR', 'XOR'], in: ['A', 'B'], col: 1, row: 2 },   // a slot: the learner picks the gate
 *     { id: 's2', slot: ['AND', 'OR'], type: 'OR', in: ['g2', 's1'], col: 3, row: 1 },   // a slot with a starting choice
 *   ],
 *   outputs: [{ id: 'lamp', from: 's2', label: 'Lamp' }],   // row defaults to the row of `from`
 *   table: 'discover',     // show a truth table under the circuit: 'discover' fills in rows as the learner
 *                          // visits them, 'full' shows every row at once
 *   hideSignals: false,    // true: do not show what the wires carry (for "work it out yourself" questions)
 *   readouts: [{ label: 'A + B in binary', value: (v) => `${v.carry}${v.sum}` }],   // v: every signal by id (0, 1 or null)
 *   static: false,         // true: picture only
 * }
 *
 * Gate types: AND, OR, XOR, NAND, NOR (two inputs), NOT (one input).
 * Layout: switches sit in column 0, one per row (row 0, 1, 2 … unless an
 * input has its own `row`); each gate names its column (1, 2, 3 …) and its
 * row, which may be fractional. List a gate's inputs top to bottom.
 *
 * State: { inputs, gates, outputs, truth, complete, visited, rows, seenAll }
 *   inputs   — { A: 0, B: 1 }
 *   gates    — the gate chosen for each slot: { s1: 'XOR', s2: null }
 *   outputs  — what each lamp shows now: { lamp: 1 } (null while a slot it depends on is empty)
 *   truth    — each lamp's column of the truth table, over every combination of the unlocked
 *              switches counted up in binary (00, 01, 10, 11): { lamp: [0, 1, 1, 0] }
 *   complete — every slot has a gate
 *   visited  — how many switch combinations have been tried since the gates last changed, out of `rows`
 *   seenAll  — visited === rows
 *
 * setState accepts { inputs: { A: 1 }, gates: { s1: 'XOR' }, seenAll: true }, each part optional.
 */
import { frame, button, readout, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('gates', `
  .widget-gates .gt-label { font-family: var(--font-body); font-weight: 800; font-size: 15px; fill: var(--ink); }
  .widget-gates .gt-name { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink); stroke: none; letter-spacing: 0.02em; }
  .widget-gates .gt-name.is-small { font-size: 10.5px; }
  .widget-gates .gt-bit { font-family: var(--font-mono); font-weight: 700; font-size: 13px; stroke: none; fill: var(--ink-3); }
  .widget-gates .gt-bit.is-on { fill: var(--orange-text); }
  .widget-gates .gt-knob-text { font-family: var(--font-mono); font-weight: 800; font-size: 14px; fill: var(--ink); stroke: none; }
  .widget-gates .gt-lamp-label { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink-2); }
  .widget-gates .gt-slot-num { font-family: var(--font-body); font-weight: 800; font-size: 11px; fill: #1D1B26; stroke: none; }
  .widget-gates .gt-switch, .widget-gates .gt-slot { cursor: pointer; outline: none; }
  .widget-gates .gt-switch.is-locked { cursor: default; }
  .widget-gates .gt-switch:focus-visible .gt-track, .widget-gates .gt-slot:focus-visible .gt-body { stroke: var(--focus); stroke-width: 4; }
  .widget-gates .gt-knob { transition: transform 0.16s var(--ease-spring); }
  .widget-gates.is-readonly .gt-switch, .widget-gates.is-readonly .gt-slot { pointer-events: none; cursor: default; }
  .widget-gates .gt-table { border-collapse: separate; border-spacing: 3px; margin: 0 auto; font-family: var(--font-mono); font-weight: 700; }
  .widget-gates .gt-table th { padding: 2px 10px; font-family: var(--font-body); font-size: var(--fs-sm); font-weight: 800; color: var(--ink-2); }
  .widget-gates .gt-table th.is-out { color: var(--orange-text); }
  .widget-gates .gt-table td { min-width: 40px; padding: 3px 10px; border-radius: 8px; text-align: center; background: var(--sunken); color: var(--ink-2); }
  .widget-gates .gt-table td.is-out { background: var(--surface); border: var(--bw) solid var(--hair); }
  .widget-gates .gt-table td.is-on { background: var(--yellow-soft); border-color: var(--yellow); color: var(--ink); }
  .widget-gates .gt-table td.is-unknown { color: var(--ink-3); border-style: dashed; }
  .widget-gates .gt-table tr.is-current td { box-shadow: 0 0 0 2px var(--ink); }
  .widget-gates .gt-slots { display: grid; gap: var(--s2); justify-items: center; }
  .widget-gates .gt-slot-row { display: flex; align-items: center; flex-wrap: wrap; justify-content: center; gap: var(--s2) var(--s3); }
  .widget-gates .gt-slot-title { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800; font-size: var(--fs-sm); }
  .widget-gates .gt-slot-badge { display: inline-grid; place-items: center; width: 1.5em; height: 1.5em; border-radius: 50%; background: var(--violet); color: #1D1B26; font-size: var(--fs-sm); font-weight: 800; }
  .widget-gates .segmented button { min-height: 42px; min-width: 64px; justify-content: center; }
  .widget-gates .segmented button[aria-pressed='true'] { font-weight: 800; }
  .widget-gates.is-readonly .segmented { pointer-events: none; }
  @media (max-width: 520px) {
    .widget-gates .gt-label { font-size: 21px; }
    .widget-gates .gt-name { font-size: 18px; }
    .widget-gates .gt-name.is-small { font-size: 14px; }
    .widget-gates .gt-bit { font-size: 18px; }
    .widget-gates .gt-knob-text { font-size: 17px; }
    .widget-gates .gt-lamp-label { font-size: 18px; }
    .widget-gates .gt-slot-num { font-size: 14px; }
  }
`);

const FN = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  XOR: (a, b) => a ^ b,
  NAND: (a, b) => 1 - (a & b),
  NOR: (a, b) => 1 - (a | b),
  NOT: (a) => 1 - a,
};

/**
 * Work out every signal of a circuit. `inputs` maps switch ids to 0/1,
 * `choices` maps slot ids to gate types. Returns { id: 0 | 1 | null } for
 * switches, gates and lamps; null means "not determined" (an empty slot upstream).
 */
export function evaluate(spec, inputs, choices = {}) {
  const gates = new Map((spec.gates || []).map((g) => [g.id, g]));
  const out = {};
  for (const inp of spec.inputs || []) out[inp.id] = inputs[inp.id] ? 1 : 0;
  const visiting = new Set();
  const get = (id) => {
    if (id in out) return out[id];
    const g = gates.get(id);
    if (!g || visiting.has(id)) return null;
    visiting.add(id);
    const type = g.slot ? (choices[g.id] !== undefined ? choices[g.id] : g.type || null) : g.type;
    const args = (g.in || []).map(get);
    visiting.delete(id);
    out[id] = !type || !FN[type] || args.some((v) => v == null) ? null : FN[type](...args);
    return out[id];
  };
  for (const g of gates.values()) get(g.id);
  for (const o of spec.outputs || []) out[o.id] = get(o.from);
  return out;
}

/** Each lamp's truth-table column over all combinations of the unlocked switches (binary order). */
export function truthTable(spec, choices = {}) {
  const free = (spec.inputs || []).filter((i) => !i.locked);
  const fixed = {};
  for (const i of spec.inputs || []) fixed[i.id] = i.value ? 1 : 0;
  const columns = {};
  for (const o of spec.outputs || []) columns[o.id] = [];
  for (let m = 0; m < 1 << free.length; m++) {
    const inputs = { ...fixed };
    free.forEach((inp, j) => { inputs[inp.id] = (m >> (free.length - 1 - j)) & 1; });
    const sig = evaluate(spec, inputs, choices);
    for (const o of spec.outputs || []) columns[o.id].push(sig[o.id]);
  }
  return columns;
}

const GW = 72; // gate width
const GH = 52; // gate height

function gatePath(type, x0, cy) {
  const y0 = cy - GH / 2;
  const y1 = cy + GH / 2;
  const x1 = x0 + GW;
  const bubble = type === 'NAND' || type === 'NOR' ? 12 : 0;
  const xe = x1 - bubble;
  if (type === 'AND' || type === 'NAND') return `M${x0} ${y0} H${xe - 26} A26 26 0 0 1 ${xe - 26} ${y1} H${x0} Z`;
  if (type === 'OR' || type === 'NOR') return `M${x0} ${y0} Q${x0 + 42} ${y0} ${xe} ${cy} Q${x0 + 42} ${y1} ${x0} ${y1} Q${x0 + 16} ${cy} ${x0} ${y0} Z`;
  if (type === 'XOR') return `M${x0 + 9} ${y0} Q${x0 + 46} ${y0} ${xe} ${cy} Q${x0 + 46} ${y1} ${x0 + 9} ${y1} Q${x0 + 25} ${cy} ${x0 + 9} ${y0} Z`;
  if (type === 'NOT') return `M${x0 + 4} ${y0 + 3} L${x1 - 14} ${cy} L${x0 + 4} ${y1 - 3} Z`;
  return '';
}

export default function create(spec, env) {
  const inputs = (spec.inputs || []).map((inp, i) => ({ label: inp.id, row: i, ...inp }));
  const gates = (spec.gates || []).map((g) => ({ ...g, options: Array.isArray(g.slot) ? g.slot : null }));
  const outputs = (spec.outputs || []).map((o) => ({ label: '', ...o }));
  const slots = gates.filter((g) => g.options);
  const free = inputs.filter((i) => !i.locked);
  const interactive = !spec.static && !env.compact;
  const hide = !!spec.hideSignals;
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  const values = {};
  for (const inp of inputs) values[inp.id] = inp.value ? 1 : 0;
  const choices = {};
  for (const g of slots) choices[g.id] = g.type && g.options.includes(g.type) ? g.type : null;
  const comboKey = () => free.map((i) => values[i.id]).join('');
  let visited = new Set([comboKey()]);
  const signals = () => evaluate(spec, values, choices);

  /* --------------------------------------------------------------- layout */
  const nCols = Math.max(1, ...gates.map((g) => g.col || 1));
  const W = nCols >= 4 ? 680 : nCols === 3 ? 560 : 480;
  const ROW = 76;
  const TOP = 46;
  const yOf = (row) => TOP + row * ROW;
  const mid = W / 2 + 18;
  const span = nCols === 1 ? 0 : Math.min(W - 316, 130 * (nCols - 1));
  const colX = (col) => (nCols === 1 ? mid : mid - span / 2 + ((col - 1) * span) / (nCols - 1)) - GW / 2; // left edge of a gate
  const SW_X = 30; // switch track left edge
  const SW_W = 62;
  const PIN_X = SW_X + SW_W + 2;
  const LAMP_X = W - 44;

  const node = new Map();
  inputs.forEach((inp) => node.set(inp.id, { kind: 'input', col: 0, y: yOf(inp.row), outX: PIN_X }));
  gates.forEach((g) => node.set(g.id, { kind: 'gate', col: g.col || 1, y: yOf(g.row || 0), x0: colX(g.col || 1), outX: colX(g.col || 1) + GW }));
  outputs.forEach((o) => {
    const src = node.get(o.from);
    o.y = o.row != null ? yOf(o.row) : src ? src.y : yOf(0);
  });
  const allRows = [...inputs.map((i) => i.row), ...gates.map((g) => g.row || 0), ...outputs.map((o) => (o.y - TOP) / ROW)];
  const H = Math.round(TOP + Math.max(0, ...allRows) * ROW + (outputs.some((o) => o.label) ? 62 : 46));

  const fr = frame({ width: W, height: H, wide: W > 560, compact: env.compact, label: spec.alt || 'Logic circuit' });
  const { svg } = fr;
  svg.setAttribute('role', 'group');

  // connections: { from, to (gate id or output id), tx, ty, lamp }
  const links = [];
  gates.forEach((g) => {
    const n = node.get(g.id);
    const ins = g.in || [];
    ins.forEach((src, k) => {
      const ty = ins.length === 1 ? n.y : n.y + (k === 0 ? -13 : 13);
      links.push({ from: src, tx: n.x0 + 12, ty, col: n.col });
    });
  });
  outputs.forEach((o) => links.push({ from: o.from, tx: LAMP_X - 18, ty: o.y, col: nCols + 1 }));

  // each source gets a lane for its vertical run, so that different signals never share one
  const laneOf = new Map();
  for (let col = 0; col <= nCols; col++) {
    const sources = [...new Set(links.map((l) => l.from))]
      .filter((id) => node.get(id) && node.get(id).col === col && links.some((l) => l.from === id && Math.abs(l.ty - node.get(id).y) > 0.5))
      .sort((a, b) => node.get(a).y - node.get(b).y);
    sources.forEach((id, i) => laneOf.set(id, i));
  }
  const wires = new Map(); // source id -> { halo, line, dots }
  const gWires = s('g');
  const gGates = s('g');
  const gTop = s('g');
  svg.append(gWires, gGates, gTop);

  for (const id of new Set(links.map((l) => l.from))) {
    const src = node.get(id);
    if (!src) continue;
    const mine = links.filter((l) => l.from === id);
    const mx = src.outX + 16 + (laneOf.get(id) || 0) * 11;
    let d = '';
    const ys = [];
    for (const l of mine) {
      if (Math.abs(l.ty - src.y) < 0.5) d += `M${src.outX} ${src.y}H${l.tx}`;
      else { d += `M${src.outX} ${src.y}H${mx}V${l.ty}H${l.tx}`; ys.push(l.ty); }
    }
    const dots = [];
    if (ys.length) {
      const straight = mine.some((l) => Math.abs(l.ty - src.y) < 0.5);
      const all = [...ys, src.y];
      const lo = Math.min(...all);
      const hi = Math.max(...all);
      // a dot wherever three or more wire ends meet
      if (straight || (src.y > lo && src.y < hi)) dots.push([mx, src.y]);
      for (const y of new Set(ys)) if (y > lo && y < hi) dots.push([mx, y]);
    }
    const halo = s('path', { d, fill: 'none', stroke: 'var(--surface)', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const line = s('path', { d, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const dotEls = dots.map(([x, y]) => s('circle', { cx: x, cy: y, r: 5 }));
    gWires.append(halo, line, ...dotEls);
    wires.set(id, { line, dots: dotEls });
  }

  /* ------------------------------------------------------------- switches */
  const switchEls = inputs.map((inp) => {
    const y = yOf(inp.row);
    const locked = !!inp.locked || !interactive;
    const track = s('rect.gt-track', { x: SW_X, y: y - 16, width: SW_W, height: 32, rx: 16, stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const knobText = s('text.gt-knob-text', { x: 0, y: 5, 'text-anchor': 'middle' }, '0');
    const knob = s('g.gt-knob', s('circle', { r: 13, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }), knobText);
    const g = s('g', { class: cx('gt-switch', locked && 'is-locked') },
      s('rect', { x: 0, y: y - ROW / 2 + 4, width: PIN_X + 8, height: ROW - 8, fill: 'transparent' }),
      s('text.fig-label.gt-label', { x: 14, y: y + 5, 'text-anchor': 'middle' }, inp.label),
      track, knob,
    );
    if (!locked) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'switch');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => flip(inp));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(inp); } });
    }
    gTop.appendChild(g);
    return { inp, g, track, knob, knobText, y };
  });

  /* ---------------------------------------------------------------- gates */
  const gateEls = gates.map((g) => {
    const n = node.get(g.id);
    const group = s('g');
    const body = s('path.gt-body', { 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    const extra = s('path', { fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    const bubble = s('circle', { r: 6, 'stroke-width': 2.5 });
    const name = s('text.gt-name', { 'text-anchor': 'middle' });
    const bit = s('text.gt-bit', { x: n.outX + 5, y: n.y - 8 });
    group.append(body, extra, bubble, name);
    let badge = null;
    if (g.options) {
      const index = slots.indexOf(g) + 1;
      badge = s('g', s('circle', { cx: n.x0 + 4, cy: n.y - GH / 2 - 2, r: 10, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 2 }),
        s('text.gt-slot-num', { x: n.x0 + 4, y: n.y - GH / 2 + 2, 'text-anchor': 'middle' }, String(index)));
      group.appendChild(badge);
      group.setAttribute('class', 'gt-slot');
      if (interactive) {
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
        group.dataset.keys = 'own';
        const cycle = () => {
          const i = g.options.indexOf(choices[g.id]);
          choose(g, g.options[(i + 1) % g.options.length]);
        };
        group.addEventListener('click', cycle);
        group.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cycle(); } });
      }
    }
    gGates.appendChild(group);
    if (!hide) gTop.appendChild(bit);
    return { g, n, group, body, extra, bubble, name, bit };
  });

  /* ---------------------------------------------------------------- lamps */
  const lampEls = outputs.map((o) => {
    const rays = s('g', { stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round' });
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      rays.appendChild(s('line', { x1: LAMP_X + Math.cos(a) * 24, y1: o.y + Math.sin(a) * 24, x2: LAMP_X + Math.cos(a) * 31, y2: o.y + Math.sin(a) * 31 }));
    }
    const bulb = s('circle', { cx: LAMP_X, cy: o.y, r: 18, stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const mark = s('text.gt-knob-text', { x: LAMP_X, y: o.y + 5, 'text-anchor': 'middle' });
    gTop.append(rays, bulb, mark);
    if (o.label) gTop.appendChild(s('text.fig-label-sm.gt-lamp-label', { x: LAMP_X, y: o.y + 47, 'text-anchor': 'middle' }, o.label));
    return { o, rays, bulb, mark };
  });

  /* ------------------------------------------------------- below the SVG */
  const tableMode = env.compact ? null : spec.table === true ? 'full' : spec.table || null;
  let tableBody = null;
  if (tableMode) {
    const head = h('tr', free.map((i) => h('th', i.label)), outputs.map((o) => h('th.is-out', o.label || o.id)));
    tableBody = h('tbody');
    fr.el.insertBefore(h('table.gt-table', { 'aria-label': 'Truth table of this circuit' }, h('thead', head), tableBody), fr.readouts);
  }
  const readouts = (spec.readouts || []).map((ro) => ({ ro, pill: readout(ro.label || '', {}) }));
  if (!env.compact) for (const r of readouts) fr.readouts.appendChild(r.pill.el);

  const slotRows = [];
  if (interactive && slots.length) {
    const box = h('div.gt-slots');
    slots.forEach((g, i) => {
      const buttons = g.options.map((type) => {
        const btn = h('button', { type: 'button', 'aria-pressed': 'false' }, type);
        btn.addEventListener('click', () => choose(g, type));
        return btn;
      });
      box.appendChild(h('div.gt-slot-row',
        h('span.gt-slot-title', h('span.gt-slot-badge', { 'aria-hidden': 'true' }, String(i + 1)), g.title || `Gate ${i + 1}`),
        h('div.segmented', { role: 'group', 'aria-label': `Gate ${i + 1}` }, buttons)));
      slotRows.push({ g, buttons });
    });
    fr.el.insertBefore(box, fr.canvas.nextSibling);
  }
  if (interactive) {
    const text = slots.length
      ? (free.length ? 'Choose a gate for each numbered slot, then flip the switches to test your circuit.' : 'Choose a gate for each numbered slot.')
      : (free.length ? 'Tap a switch to flip it.' : '');
    if (text) fr.el.insertBefore(h('p.w-hint', text), fr.buttons);
    if (slots.length) {
      fr.buttons.appendChild(button('Clear gates', () => {
        if (readOnly) return;
        for (const g of slots) choices[g.id] = null;
        visited = new Set([comboKey()]);
        render();
        env.onChange(getState());
      }, { icon: 'reset', variant: 'ghost' }));
    }
  }

  /* -------------------------------------------------------------- actions */
  function flip(inp) {
    if (readOnly || inp.locked) return;
    values[inp.id] = values[inp.id] ? 0 : 1;
    visited.add(comboKey());
    play(values[inp.id] ? 'select' : 'tap');
    render();
    announceLamps();
    env.onChange(getState());
  }
  function choose(g, type) {
    if (readOnly || choices[g.id] === type) return;
    choices[g.id] = type;
    visited = new Set([comboKey()]);
    play('drop');
    render();
    announceLamps();
    env.onChange(getState());
  }
  function announceLamps() {
    const sig = signals();
    env.announce(outputs.map((o) => `${o.label || 'Lamp'} ${sig[o.id] == null ? 'unknown' : sig[o.id] ? 'on' : 'off'}`).join(', '));
  }

  /* --------------------------------------------------------------- render */
  function paintWire(w, v) {
    const known = v != null && !hide;
    const on = known && v === 1;
    w.line.setAttribute('stroke', on ? hue('orange') : hide ? 'var(--ink)' : 'var(--ink-3)');
    w.line.setAttribute('stroke-width', on ? 4.5 : 2.5);
    if (v == null && !hide) w.line.setAttribute('stroke-dasharray', '3 7'); else w.line.removeAttribute('stroke-dasharray');
    for (const dot of w.dots) dot.setAttribute('fill', on ? hue('orange') : hide ? 'var(--ink)' : 'var(--ink-3)');
  }

  function render() {
    const sig = signals();
    for (const [id, w] of wires) paintWire(w, sig[id]);

    for (const sw of switchEls) {
      const on = values[sw.inp.id] === 1;
      sw.track.setAttribute('fill', on ? hue('yellow') : 'var(--sunken)');
      sw.knob.setAttribute('transform', `translate(${on ? SW_X + SW_W - 16 : SW_X + 16} ${sw.y})`);
      sw.knobText.textContent = on ? '1' : '0';
      sw.g.setAttribute('aria-checked', String(on));
      sw.g.setAttribute('aria-label', `Switch ${sw.inp.label}: ${on ? 'on (1)' : 'off (0)'}${sw.inp.locked ? ', fixed' : ''}`);
    }

    for (const ge of gateEls) {
      const { g, n } = ge;
      const type = g.options ? choices[g.id] : g.type;
      const v = sig[g.id];
      const stroke = g.options ? hue('violet') : 'var(--ink)';
      const fill = v === 1 && !hide ? hue('yellow', 'soft') : g.options && !type ? hue('violet', 'soft') : 'var(--surface)';
      ge.body.setAttribute('stroke', stroke);
      ge.body.setAttribute('fill', fill);
      ge.extra.setAttribute('stroke', stroke);
      ge.bubble.setAttribute('stroke', stroke);
      ge.bubble.setAttribute('fill', fill);
      if (!type) {
        ge.body.setAttribute('d', `M${n.x0 + 12} ${n.y - GH / 2} H${n.x0 + GW - 12} a12 12 0 0 1 12 12 V${n.y + GH / 2 - 12} a12 12 0 0 1 -12 12 H${n.x0 + 12} a12 12 0 0 1 -12 -12 V${n.y - GH / 2 + 12} a12 12 0 0 1 12 -12 Z`);
        ge.body.setAttribute('stroke-dasharray', '6 6');
        ge.extra.setAttribute('d', '');
        ge.bubble.setAttribute('visibility', 'hidden');
        ge.name.textContent = '?';
        ge.name.setAttribute('class', 'gt-label');
        ge.name.setAttribute('x', n.x0 + GW / 2);
        ge.name.setAttribute('y', n.y + 6);
      } else {
        ge.body.removeAttribute('stroke-dasharray');
        ge.body.setAttribute('d', gatePath(type, n.x0, n.y));
        ge.extra.setAttribute('d', type === 'XOR' ? `M${n.x0} ${n.y - GH / 2} Q${n.x0 + 16} ${n.y} ${n.x0} ${n.y + GH / 2}` : '');
        const hasBubble = type === 'NOT' || type === 'NAND' || type === 'NOR';
        ge.bubble.setAttribute('visibility', hasBubble ? 'visible' : 'hidden');
        ge.bubble.setAttribute('cx', n.x0 + GW - 7);
        ge.bubble.setAttribute('cy', n.y);
        ge.name.textContent = type;
        ge.name.setAttribute('class', cx('gt-name', (type === 'NOT' || type.length > 3) && 'is-small'));
        ge.name.setAttribute('x', n.x0 + (type === 'NOT' ? 23 : type === 'XOR' ? GW / 2 + 5 : type.length > 3 ? GW / 2 - 9 : GW / 2 - 4));
        ge.name.setAttribute('y', n.y + (type === 'NOT' || type.length > 3 ? 4 : 5));
      }
      ge.bit.textContent = v == null ? '' : String(v);
      ge.bit.setAttribute('class', cx('gt-bit', v === 1 && 'is-on'));
      if (g.options) ge.group.setAttribute('aria-label', `Gate ${slots.indexOf(g) + 1}: ${type || 'empty'}. Press to change.`);
    }

    for (const le of lampEls) {
      const v = hide ? null : sig[le.o.id];
      le.rays.setAttribute('visibility', v === 1 ? 'visible' : 'hidden');
      le.bulb.setAttribute('fill', v === 1 ? hue('yellow') : v === 0 ? hue('gray', 'soft') : 'var(--surface)');
      if (v == null) le.bulb.setAttribute('stroke-dasharray', '5 5'); else le.bulb.removeAttribute('stroke-dasharray');
      le.mark.textContent = v == null ? '?' : '';
    }

    for (const row of slotRows) row.buttons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(row.g.options[i] === choices[row.g.id])));

    if (tableBody) {
      const truth = truthTable(spec, choices);
      const current = comboKey();
      tableBody.replaceChildren();
      for (let m = 0; m < 1 << free.length; m++) {
        const key = m.toString(2).padStart(free.length, '0');
        const show = tableMode === 'full' || visited.has(key);
        tableBody.appendChild(h('tr', { class: cx(key === current && 'is-current') },
          key.split('').map((bit) => h('td', bit)),
          outputs.map((o) => {
            const v = truth[o.id][m];
            const known = show && v != null;
            return h('td', { class: cx('is-out', known && v === 1 && 'is-on', !known && 'is-unknown') }, known ? String(v) : '?');
          })));
      }
    }
    for (const r of readouts) {
      let text = '?';
      try { text = String(r.ro.value(sig)); } catch { text = '?'; }
      r.pill.set(/null|undefined|NaN/.test(text) ? '?' : text);
    }
    svg.setAttribute('aria-label', `${spec.alt || 'Logic circuit'}. ${inputs.map((i) => `${i.label} is ${values[i.id]}`).join(', ')}.${hide ? '' : ` ${outputs.map((o) => `${o.label || 'Lamp'} is ${sig[o.id] == null ? 'unknown' : sig[o.id] ? 'on' : 'off'}`).join(', ')}.`}`);
  }

  function getState() {
    const sig = signals();
    const outs = {};
    for (const o of outputs) outs[o.id] = sig[o.id];
    const rows = 1 << free.length;
    return {
      inputs: { ...values },
      gates: { ...choices },
      outputs: outs,
      truth: truthTable(spec, choices),
      complete: slots.every((g) => !!choices[g.id]),
      visited: visited.size,
      rows,
      seenAll: visited.size >= rows,
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.gates) {
        for (const g of slots) if (g.id in next.gates) choices[g.id] = g.options.includes(next.gates[g.id]) ? next.gates[g.id] : null;
        visited = new Set();
      }
      if (next.inputs) for (const inp of inputs) if (inp.id in next.inputs) values[inp.id] = next.inputs[inp.id] ? 1 : 0;
      visited.add(comboKey());
      if (next.seenAll) for (let m = 0; m < 1 << free.length; m++) visited.add(m.toString(2).padStart(free.length, '0'));
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const sw of switchEls) if (sw.g.hasAttribute('tabindex')) sw.g.setAttribute('tabindex', readOnly ? '-1' : '0');
    },
  };
}

export const examples = [
  {
    title: 'gates — flip switches, discover the truth table',
    spec: {
      type: 'gates', table: 'discover',
      inputs: [{ id: 'A', value: 0 }, { id: 'B', value: 0 }],
      gates: [{ id: 'and', type: 'AND', in: ['A', 'B'], col: 1, row: 0.5 }],
      outputs: [{ id: 'lamp', from: 'and', label: 'Lamp' }],
    },
  },
  {
    title: 'gates — build XOR by choosing gates for the slots',
    spec: {
      type: 'gates', table: 'full',
      inputs: [{ id: 'A', value: 1 }, { id: 'B', value: 0 }],
      gates: [
        { id: 'g1', slot: ['AND', 'OR'], in: ['A', 'B'], col: 1, row: 0 },
        { id: 'g2', slot: ['AND', 'OR'], in: ['A', 'B'], col: 1, row: 1.5 },
        { id: 'n', type: 'NOT', in: ['g2'], col: 2, row: 1.5 },
        { id: 'g3', slot: ['AND', 'OR'], in: ['g1', 'n'], col: 3, row: 0.75 },
      ],
      outputs: [{ id: 'lamp', from: 'g3', label: 'Lamp' }],
    },
  },
];
