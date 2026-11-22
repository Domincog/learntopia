/**
 * balance — a pan balance for equations. Mystery boxes (x) and unit weights
 * sit on two pans; the same move applied to both sides keeps it level.
 *
 * {
 *   type: 'balance',
 *   left:  { x: 2, ones: 3 },
 *   right: { x: 0, ones: 11 },
 *   xValue: 4,                      // the hidden weight of one box (needed for tilting)
 *   mode: 'both',                   // 'both': moves apply to both sides (stays balanced)
 *                                   // 'free': each side is edited separately (it can tip)
 *   ops: ['sub1', 'subx', 'div'],   // buttons in 'both' mode: add1 sub1 addx subx div
 *   edit: { left: ['ones'], right: ['ones', 'x'] },   // what can be changed in 'free' mode
 *   equation: true,                 // show the matching equation under the scale
 *   static: false,                  // true: picture only, no buttons (for figures)
 *   max: 14,                        // cap on unit weights per pan
 * }
 *
 * State: { left: { x, ones }, right: { x, ones }, balanced, solved, moves }
 *   solved   — one box alone on one side, only unit weights on the other
 *   balanced — both pans weigh the same
 */
import { frame, button, hue, s, h, formatNumber, mdInline } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 330;
const PIVOT = { x: 280, y: 78 };
const ARM = 186;
const DROP = 150; // beam end to pan plate

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };

function sideTex(side) {
  const parts = [];
  if (side.x > 0) parts.push(side.x === 1 ? 'x' : `${side.x}x`);
  if (side.ones > 0 || !parts.length) parts.push(String(side.ones));
  return parts.join(' + ');
}

export default function create(spec, env) {
  const mode = spec.mode === 'free' ? 'free' : 'both';
  const interactive = !env.compact && !spec.static; // static: just the picture (and equation)
  const xValue = spec.xValue != null ? spec.xValue : 1;
  const max = spec.max || 14;
  const ops = spec.ops || ['sub1', 'subx', 'div'];
  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'Balance scale' });
  const { svg } = fr;
  let readOnly = !!env.readOnly;

  let state = {
    left: { x: (spec.left && spec.left.x) || 0, ones: (spec.left && spec.left.ones) || 0 },
    right: { x: (spec.right && spec.right.x) || 0, ones: (spec.right && spec.right.ones) || 0 },
  };
  const initial = JSON.parse(JSON.stringify(state));
  const history = [];
  let moves = 0;
  let angle = 0;       // current beam angle (degrees, + = right side down)
  let raf = 0;

  const weight = (side) => side.x * xValue + side.ones;
  const isBalanced = () => Math.abs(weight(state.left) - weight(state.right)) < 1e-9;
  const isSolved = () => isBalanced() && (
    (state.left.x === 1 && state.left.ones === 0 && state.right.x === 0) ||
    (state.right.x === 1 && state.right.ones === 0 && state.left.x === 0));
  const targetAngle = () => Math.max(-13, Math.min(13, (weight(state.right) - weight(state.left)) * 2.6));

  /* ------------------------------------------------------------ drawing */
  // stand
  svg.appendChild(s('path', { d: `M${PIVOT.x} ${PIVOT.y} V${H - 46}`, stroke: 'var(--ink)', 'stroke-width': 9, 'stroke-linecap': 'round' }));
  svg.appendChild(s('path', { d: `M${PIVOT.x - 78} ${H - 22} H${PIVOT.x + 78} L${PIVOT.x + 52} ${H - 48} H${PIVOT.x - 52} Z`, fill: 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linejoin': 'round' }));
  const beam = s('g');
  beam.appendChild(s('line', { x1: PIVOT.x - ARM, x2: PIVOT.x + ARM, y1: PIVOT.y, y2: PIVOT.y, stroke: 'var(--ink)', 'stroke-width': 8, 'stroke-linecap': 'round' }));
  svg.appendChild(beam);
  svg.appendChild(s('circle', { cx: PIVOT.x, cy: PIVOT.y, r: 11, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 4 }));

  function makePan() {
    const g = s('g');
    g.appendChild(s('path', { d: `M0 0 L-78 ${DROP} M0 0 L78 ${DROP}`, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }));
    g.appendChild(s('circle', { r: 6, fill: 'var(--ink)' }));
    const items = s('g');
    g.appendChild(items);
    g.appendChild(s('path', { d: `M-92 ${DROP} H92 Q92 ${DROP + 26} 0 ${DROP + 26} Q-92 ${DROP + 26} -92 ${DROP} Z`, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linejoin': 'round' }));
    svg.appendChild(g);
    return { g, items };
  }
  const pans = { left: makePan(), right: makePan() };

  function drawItems(panKey) {
    const { items } = pans[panKey];
    while (items.firstChild) items.removeChild(items.firstChild);
    const side = state[panKey];
    const rows = [];
    for (let i = 0; i < side.x; i += 4) rows.push({ kind: 'x', n: Math.min(4, side.x - i) });
    for (let i = 0; i < side.ones; i += 5) rows.push({ kind: 'one', n: Math.min(5, side.ones - i) });
    const need = rows.reduce((sum, r) => sum + (r.kind === 'x' ? 40 : 30), 0);
    const scale = Math.min(1, 132 / Math.max(1, need));
    let y = DROP - 3;
    for (const row of rows) {
      const size = (row.kind === 'x' ? 36 : 26) * scale;
      const gap = 4 * scale;
      const total = row.n * size + (row.n - 1) * gap;
      let x = -total / 2;
      y -= size;
      for (let i = 0; i < row.n; i++) {
        if (row.kind === 'x') {
          items.appendChild(s('rect', { x, y, width: size, height: size, rx: 7 * scale, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 3 }));
          items.appendChild(s('text', { x: x + size / 2, y: y + size / 2 + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'fig-label fig-math', style: `font-size:${20 * scale}px;fill:#1D1B26` }, 'x'));
        } else {
          items.appendChild(s('circle', { cx: x + size / 2, cy: y + size / 2, r: size / 2 - 1, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
          items.appendChild(s('text', { x: x + size / 2, y: y + size / 2 + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'fig-label', style: `font-size:${13 * scale}px;fill:#1D1B26` }, '1'));
        }
        x += size + gap;
      }
      y -= gap;
    }
  }

  function place() {
    const rad = (angle * Math.PI) / 180;
    beam.setAttribute('transform', `rotate(${angle} ${PIVOT.x} ${PIVOT.y})`);
    const dx = ARM * Math.cos(rad);
    const dy = ARM * Math.sin(rad);
    pans.left.g.setAttribute('transform', `translate(${PIVOT.x - dx} ${PIVOT.y - dy})`);
    pans.right.g.setAttribute('transform', `translate(${PIVOT.x + dx} ${PIVOT.y + dy})`);
  }

  function animate() {
    cancelAnimationFrame(raf);
    if (reducedMotion()) { angle = targetAngle(); place(); return; }
    const step = () => {
      const target = targetAngle();
      const diff = target - angle;
      if (Math.abs(diff) < 0.05) { angle = target; place(); return; }
      angle += diff * 0.16;
      place();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------- controls */
  const equation = h('div.w-balance-eq', { 'aria-live': 'polite' });
  const note = h('div.w-hint');
  if (spec.equation !== false && !env.compact) fr.el.insertBefore(equation, fr.readouts);
  if (interactive) fr.el.appendChild(note);

  const divisor = () => {
    const g = gcd(gcd(state.left.x, state.left.ones), gcd(state.right.x, state.right.ones));
    if (g < 2) return 0;
    for (let k = 2; k <= g; k++) if (g % k === 0) return k;
    return 0;
  };

  const OPS = {
    sub1: { label: () => 'Take 1 from each side', icon: 'minus', can: () => state.left.ones >= 1 && state.right.ones >= 1, run: () => { state.left.ones--; state.right.ones--; return 'Took 1 from both sides.'; } },
    add1: { label: () => 'Add 1 to each side', icon: 'plus', can: () => state.left.ones < max && state.right.ones < max, run: () => { state.left.ones++; state.right.ones++; return 'Added 1 to both sides.'; } },
    subx: { label: () => 'Take a box from each side', icon: 'minus', can: () => state.left.x >= 1 && state.right.x >= 1, run: () => { state.left.x--; state.right.x--; return 'Took one box from both sides.'; } },
    addx: { label: () => 'Add a box to each side', icon: 'plus', can: () => state.left.x < 6 && state.right.x < 6, run: () => { state.left.x++; state.right.x++; return 'Added one box to both sides.'; } },
    div: {
      label: () => { const k = divisor(); return k ? `Split each side into ${k} equal groups` : 'Split into equal groups'; },
      icon: 'divide',
      can: () => divisor() > 0,
      run: () => { const k = divisor(); for (const side of [state.left, state.right]) { side.x /= k; side.ones /= k; } return `Divided both sides by ${k}.`; },
    },
  };

  const opButtons = [];
  function apply(name) {
    if (readOnly) return;
    const op = OPS[name];
    if (!op || !op.can()) return;
    history.push(JSON.stringify(state));
    const msg = op.run();
    moves++;
    note.textContent = msg;
    play('drop');
    update(true);
  }

  if (mode === 'both' && interactive) {
    for (const name of ops) {
      if (!OPS[name]) continue;
      const btn = button(OPS[name].label(), () => apply(name), { icon: OPS[name].icon });
      opButtons.push({ name, btn });
      fr.buttons.appendChild(btn);
    }
  }

  function freeControls() {
    const edit = spec.edit || { left: ['ones'], right: ['ones'] };
    const row = h('div.w-balance-free');
    for (const key of ['left', 'right']) {
      if (!edit[key] || !edit[key].length) { row.appendChild(h('div')); continue; }
      const col = h('div.w-balance-side', h('div.eyebrow', key === 'left' ? 'Left pan' : 'Right pan'));
      for (const what of edit[key] || []) {
        const change = (delta) => {
          if (readOnly) return;
          const side = state[key];
          const next = side[what] + delta;
          if (next < 0 || next > (what === 'x' ? 6 : max)) return;
          history.push(JSON.stringify(state));
          side[what] = next;
          moves++;
          play('drop');
          update(true);
        };
        col.appendChild(h('div.row', { style: { '--gap': '0.4rem', justifyContent: 'center' } },
          button('', () => change(-1), { icon: 'minus', title: `Remove a ${what === 'x' ? 'box' : 'weight'}` }),
          h('span.small', { style: { fontWeight: 700, minWidth: '4.5em', textAlign: 'center' } }, what === 'x' ? 'boxes' : 'weights'),
          button('', () => change(1), { icon: 'plus', title: `Add a ${what === 'x' ? 'box' : 'weight'}` }),
        ));
      }
      row.appendChild(col);
    }
    return row;
  }
  if (mode === 'free' && interactive) fr.controls.appendChild(freeControls());

  const undoBtn = button('Undo', () => {
    if (readOnly || !history.length) return;
    state = JSON.parse(history.pop());
    note.textContent = '';
    update(true);
  }, { icon: 'undo', variant: 'ghost' });
  const resetBtn = button('Reset', () => {
    if (readOnly) return;
    state = JSON.parse(JSON.stringify(initial));
    history.length = 0;
    note.textContent = '';
    update(true);
  }, { icon: 'reset', variant: 'ghost' });
  if (interactive) fr.buttons.append(undoBtn, resetBtn);

  function update(notify) {
    drawItems('left');
    drawItems('right');
    animate();
    for (const { name, btn } of opButtons) {
      btn.disabled = readOnly || !OPS[name].can();
      btn.lastChild.textContent = OPS[name].label();
    }
    undoBtn.disabled = readOnly || !history.length;
    resetBtn.disabled = readOnly || !history.length;
    const rel = isBalanced() ? '=' : (weight(state.left) > weight(state.right) ? '>' : '<');
    equation.innerHTML = mdInline(`$${sideTex(state.left)} \\; ${rel} \\; ${sideTex(state.right)}$`);
    equation.classList.toggle('is-solved', isSolved());
    equation.classList.toggle('is-off', !isBalanced());
    svg.setAttribute('aria-label', `Balance scale. Left pan: ${describe(state.left)}. Right pan: ${describe(state.right)}. ${isBalanced() ? 'Balanced.' : weight(state.left) > weight(state.right) ? 'Left side is heavier.' : 'Right side is heavier.'}`);
    if (notify) env.onChange(getState());
  }

  function describe(side) {
    const bits = [];
    if (side.x) bits.push(`${side.x} mystery box${side.x === 1 ? '' : 'es'}`);
    if (side.ones || !bits.length) bits.push(`${formatNumber(side.ones, 0)} unit weight${side.ones === 1 ? '' : 's'}`);
    return bits.join(' and ');
  }

  function getState() {
    return {
      left: { ...state.left },
      right: { ...state.right },
      balanced: isBalanced(),
      solved: isSolved(),
      moves,
    };
  }

  angle = targetAngle();
  place();
  update(false);

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !next.left || !next.right) return;
      state = { left: { x: next.left.x || 0, ones: next.left.ones || 0 }, right: { x: next.right.x || 0, ones: next.right.ones || 0 } };
      update(false);
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); update(false); },
    destroy() { cancelAnimationFrame(raf); },
  };
}
