/**
 * vector-plane — arrows on a grid. Vectors are drawn from the origin and can
 * be dragged by their tips. On top of that the widget can show a sum (tip to
 * tail, both routes), a combination a·u + b·v driven by sliders, a target to
 * reach, the component "legs" of an arrow, and everything about a pair of
 * arrows that the dot product measures: its value, the angle, the shadow that
 * one arrow casts on the other.
 *
 * {
 *   type: 'vector-plane',
 *   x: [-6, 6], y: [-6, 6],        // window; both axes use the same scale
 *   vectors: [
 *     { id: 'u', x: 3, y: 1, color: 'blue', label: 'u' },          // label: false hides the name
 *     { id: 'v', x: 1, y: 3, color: 'orange', drag: true, snap: 1 },
 *     { id: 'w', x: 3, y: 0, drag: true, circle: 3, snapDeg: 15 },  // tip stays on a circle of radius 3
 *     // legs: true    draw the "across, then up" legs of the arrow with their numbers
 *     // faint: true   draw the arrow thin and pale (a reference)
 *   ],
 *   sum: { of: ['u', 'v'], show: true, routes: 'both', color: 'green', label: 'u + v' },
 *       // the second arrow is repeated at the tip of the first (routes: 'both' also draws the other way round);
 *       // show: false leaves the sum arrow out, so that the learner can supply it
 *   combo: {                        // sliders: a lots of u, then b lots of v, tip to tail
 *     of: ['u', 'v'],               //   one id only: a single slider that scales that arrow
 *     a: { min: -3, max: 3, step: 1, value: 1, label: '$a$' },
 *     b: { min: -3, max: 3, step: 1, value: 1, label: '$b$' },
 *   },
 *   target: { x: 4, y: 5 },         // a star to reach
 *   pair: ['u', 'v'],               // the pair that the dot-product readouts are about
 *   show: ['dot', 'angle', 'cos', 'shadow', 'lengths'],   // readouts for the pair ('shadow': of the second arrow on the first;
 *                                   //   'len0' / 'len1' give the length of just one of the two)
 *   xLabel: 'action', yLabel: 'romance',   // names for the two axes
 *   shadow: true,                   // draw the shadow of the second arrow of the pair on the line of the first
 *   dots: [['w', 'u'], ['w', 'v']], // extra dot-product readouts, for any pairs
 *   cosLabel: 'similarity',         // another name for the 'cos' readout
 *   ticks: true,                    // numbers along the axes (the across-axis loses its numbers when an arrow shows its legs)
 *   line: 'vector',                 // the formula under the picture: 'vector' | 'sum' | 'combo' | 'dot' | 'length' | false
 *                                   //   (default: whichever fits what is switched on; 'vector' and 'length' describe the first arrow)
 *   static: false,                  // true: a picture, nothing moves
 * }
 *
 * State: { u: { x, y }, v: { x, y }, …            every arrow by id
 *          a, b, point: { x, y },                  with combo: the slider values and where the chain ends
 *          sum: { x, y },                          with sum: the tip of the sum
 *          dot, angle, cos, shadow,                with pair: u·v, the angle in degrees (null if an arrow has no length),
 *                                                  its cosine, and the signed length of the shadow of the second on the first
 *          hit }                                   with target: true when the chain (combo) or the sum ends on the star
 *
 * setState accepts arrows by id ({ w: { x: 4, y: 4 } }) and the slider values { a, b }.
 */
import { frame, handle, sliderRow, readout, hue, s, h, clamp, snapTo, tidy, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('vector-plane', `
  .widget-vector-plane .vp-line { text-align: center; min-height: 3.1em; display: grid; align-content: center; font-size: var(--fs-md); }
  .widget-vector-plane .vp-line:empty { display: none; }
`);

let clipSeq = 0;
const W = 440;
const H = 440;
const PAD = 14;

/** A number for a formula: at most two decimals, ASCII minus. */
const fmt = (v) => String(tidy(Math.round(v * 100) / 100));
/** A number for a label drawn in the picture: a real minus sign. */
const txt = (v) => fmt(v).replace('-', '−');
const bracket = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v));
const col = (x, y) => `\\begin{pmatrix} ${fmt(x)} \\\\ ${fmt(y)} \\end{pmatrix}`;
const name = (def) => (def.label === false ? '' : String(def.label != null ? def.label : def.id));
const texName = (def) => { const n = name(def) || def.id; return /^[A-Za-z]$/.test(n) ? `\\mathbf{${n}}` : `\\text{${n}}`; };
/** "3u", "u", "-u", "- 2v": a coefficient next to a name, as TeX. */
const coef = (k, tex, first) => {
  const mag = Math.abs(k) === 1 ? '' : `${fmt(Math.abs(k))}\\,`;
  if (first) return `${k < 0 ? '-' : ''}${mag}${tex}`;
  return `${k < 0 ? '-' : '+'} ${mag}${tex}`;
};

function makeArrow(color, { width = 3.5, dashed = false, opacity = 1, head = 13 } = {}) {
  const line = s('line', { stroke: hue(color), 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? '7 6' : null });
  const tip = s('path', { fill: hue(color) });
  const el = s('g', { 'pointer-events': 'none', opacity }, line, tip);
  return {
    el,
    set(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 3) { el.setAttribute('visibility', 'hidden'); return; }
      el.removeAttribute('visibility');
      const ux = dx / len;
      const uy = dy / len;
      const hl = Math.min(head, len * 0.7);
      const hw = hl * 0.5;
      const bx = x2 - ux * hl;
      const by = y2 - uy * hl;
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', (bx + ux * 2).toFixed(2)); line.setAttribute('y2', (by + uy * 2).toFixed(2));
      tip.setAttribute('d', `M${x2.toFixed(2)} ${y2.toFixed(2)}L${(bx - uy * hw).toFixed(2)} ${(by + ux * hw).toFixed(2)}L${(bx + uy * hw).toFixed(2)} ${(by - ux * hw).toFixed(2)}Z`);
    },
  };
}

export default function create(spec, env) {
  const [x0, x1] = spec.x || [-6, 6];
  const [y0, y1] = spec.y || [-6, 6];
  const isStatic = !!spec.static || !!env.compact;
  let readOnly = !!env.readOnly;

  const k = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (y1 - y0));
  const ox = (W - k * (x1 - x0)) / 2;
  const oy = (H - k * (y1 - y0)) / 2;
  const sx = (v) => ox + (v - x0) * k;
  const sy = (v) => oy + (y1 - v) * k;
  const ux = (px) => x0 + (px - ox) / k;
  const uy = (py) => y1 - (py - oy) / k;

  /* -------------------------------------------------------------- model */
  const defs = (spec.vectors || []).map((d) => ({ color: 'blue', snap: 1, ...d }));
  const byId = {};
  const pos = {};
  for (const d of defs) { byId[d.id] = d; pos[d.id] = { x: Number(d.x) || 0, y: Number(d.y) || 0 }; }
  const has = (id) => Object.prototype.hasOwnProperty.call(pos, id);

  const sumSpec = spec.sum && spec.sum.of && spec.sum.of.every(has) ? { show: true, routes: 'both', color: 'green', ...spec.sum } : null;
  const comboSpec = spec.combo && spec.combo.of && spec.combo.of.every(has) ? spec.combo : null;
  const two = comboSpec && comboSpec.of.length > 1;
  const pair = Array.isArray(spec.pair) && spec.pair.every(has) ? spec.pair : null;
  const show = Array.isArray(spec.show) ? spec.show : [];
  const target = spec.target ? { x: Number(spec.target.x), y: Number(spec.target.y) } : null;
  const sliderDef = (d, value) => ({ min: -3, max: 3, step: 1, value, ...(d || {}) });
  const aDef = comboSpec ? sliderDef(comboSpec.a, 1) : null;
  const bDef = two ? sliderDef(comboSpec.b, 1) : null;
  let a = aDef ? aDef.value : 0;
  let b = bDef ? bDef.value : 0;

  const lineKind = spec.line === false || env.compact ? null
    : spec.line || (comboSpec ? 'combo' : sumSpec ? 'sum' : pair ? 'dot' : defs.length === 1 ? 'vector' : null);

  const comboPoint = () => {
    const u = pos[comboSpec.of[0]];
    const v = two ? pos[comboSpec.of[1]] : { x: 0, y: 0 };
    return { x: tidy(a * u.x + b * v.x), y: tidy(a * u.y + b * v.y) };
  };
  const sumPoint = () => {
    const [p, q] = sumSpec.of.map((id) => pos[id]);
    return { x: tidy(p.x + q.x), y: tidy(p.y + q.y) };
  };
  const dotOf = (p, q) => tidy(p.x * q.x + p.y * q.y);
  const lenOf = (p) => Math.hypot(p.x, p.y);
  function pairFacts() {
    const [p, q] = pair.map((id) => pos[id]);
    const dot = dotOf(p, q);
    const lp = lenOf(p);
    const lq = lenOf(q);
    const cos = lp > 0 && lq > 0 ? clamp(dot / (lp * lq), -1, 1) : null;
    return {
      dot,
      cos: cos == null ? null : tidy(cos),
      angle: cos == null ? null : tidy((Math.acos(cos) * 180) / Math.PI, 4),
      shadow: lp > 0 ? tidy(dot / lp) : null,
    };
  }

  const getState = () => {
    const out = {};
    for (const d of defs) out[d.id] = { x: pos[d.id].x, y: pos[d.id].y };
    if (comboSpec) { out.a = a; if (two) out.b = b; out.point = comboPoint(); }
    if (sumSpec) out.sum = sumPoint();
    if (pair) Object.assign(out, pairFacts());
    if (target) {
      const end = comboSpec ? comboPoint() : sumSpec ? sumPoint() : null;
      out.hit = !!end && Math.abs(end.x - target.x) < 1e-9 && Math.abs(end.y - target.y) < 1e-9;
    }
    return out;
  };

  /* ------------------------------------------------------------- layers */
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 480, label: spec.alt || 'Arrows on a grid' });
  const { svg } = fr;
  const gGrid = s('g');
  const clipId = `vp-clip-${++clipSeq}`;
  svg.appendChild(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: sx(x0), y: sy(y1), width: k * (x1 - x0), height: k * (y1 - y0) }))));
  const gUnder = s('g', { 'pointer-events': 'none', 'clip-path': `url(#${clipId})` });
  const gArrows = s('g', { 'pointer-events': 'none' });
  const gLabels = s('g', { 'pointer-events': 'none' });
  const gHandles = s('g');
  svg.append(gGrid, gUnder, gArrows, gLabels, gHandles);

  // grid, axes and a few numbers along the axes
  const span = Math.max(x1 - x0, y1 - y0);
  const every = span > 16 ? 5 : span > 9 ? 2 : 1;
  for (let v = Math.ceil(x0); v <= x1; v++) gGrid.appendChild(s('line.grid-line', { x1: sx(v), x2: sx(v), y1: sy(y0), y2: sy(y1) }));
  for (let v = Math.ceil(y0); v <= y1; v++) gGrid.appendChild(s('line.grid-line', { y1: sy(v), y2: sy(v), x1: sx(x0), x2: sx(x1) }));
  const axisX = clamp(0, x0, x1);
  const axisY = clamp(0, y0, y1);
  gGrid.appendChild(s('line.axis-line', { x1: sx(x0), x2: sx(x1), y1: sy(axisY), y2: sy(axisY) }));
  gGrid.appendChild(s('line.axis-line', { y1: sy(y0), y2: sy(y1), x1: sx(axisX), x2: sx(axisX) }));
  const anyLegs = defs.some((d) => d.legs);
  if (!env.compact && spec.ticks !== false) {
    for (let v = Math.ceil(x0); v <= x1 && !anyLegs; v++) {
      if (v === 0 || v % every || v === x0 || v === x1) continue;
      gGrid.appendChild(s('text.tick-label', { x: sx(v), y: sy(axisY) + 15, 'text-anchor': 'middle' }, txt(v)));
    }
    for (let v = Math.ceil(y0); v <= y1; v++) {
      if (v === 0 || v % every || v === y0 || v === y1) continue;
      gGrid.appendChild(s('text.tick-label', { x: sx(axisX) - 6, y: sy(v) + 4, 'text-anchor': 'end' }, txt(v)));
    }
  }
  if (!env.compact) {
    if (spec.xLabel) gGrid.appendChild(s('text.axis-label', { x: sx(x1) - 2, y: sy(axisY) - 8, 'text-anchor': 'end' }, spec.xLabel));
    if (spec.yLabel) gGrid.appendChild(s('text.axis-label', { x: sx(axisX) + 8, y: sy(y1) + 12, 'text-anchor': 'start' }, spec.yLabel));
  }

  const text = (cls = 'fig-label') => { const t = s('text', { class: cls, 'text-anchor': 'middle' }); gLabels.appendChild(t); return t; };
  const put = (t, x, y, str, anchor = 'middle') => {
    if (!str) { t.setAttribute('visibility', 'hidden'); return; }
    t.removeAttribute('visibility');
    t.setAttribute('x', clamp(x, 12, W - 12).toFixed(1));
    t.setAttribute('y', clamp(y, 16, H - 8).toFixed(1));
    t.setAttribute('text-anchor', anchor);
    t.textContent = str;
  };
  /** Place a name just beyond the tip of an arrow. */
  const tipLabel = (t, from, to, str, gap = 17) => {
    const dx = sx(to.x) - sx(from.x);
    const dy = sy(to.y) - sy(from.y);
    const len = Math.hypot(dx, dy) || 1;
    const nx = len < 2 ? 0 : dx / len;
    const ny = len < 2 ? -1 : dy / len;
    put(t, sx(to.x) + nx * gap, sy(to.y) + ny * gap + 5, str, nx > 0.4 ? 'start' : nx < -0.4 ? 'end' : 'middle');
  };

  // target star (under everything that moves)
  let star = null;
  if (target) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? 6 : 14;
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      d += `${i ? 'L' : 'M'}${(sx(target.x) + rad * Math.cos(ang)).toFixed(1)} ${(sy(target.y) + rad * Math.sin(ang)).toFixed(1)}`;
    }
    star = s('path', { d: `${d}Z`, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
    gUnder.appendChild(star);
  }

  // shadow of the second arrow of the pair on the line of the first
  const drawShadow = !!spec.shadow && !!pair;
  const shadowLine = s('line', { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 6' });
  const shadowDrop = s('line', { stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5', 'stroke-linecap': 'round' });
  const shadowBar = s('line', { stroke: hue('violet'), 'stroke-width': 13, 'stroke-linecap': 'round', opacity: 0.5 });
  const shadowCorner = s('path', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 });
  if (drawShadow) gUnder.append(shadowLine, shadowBar, shadowDrop, shadowCorner);
  const arc = s('path', { fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2 });
  if (pair && show.includes('angle')) gUnder.appendChild(arc);

  // per-arrow drawing
  const parts = {};
  for (const d of defs) {
    const inCombo = comboSpec && comboSpec.of.includes(d.id);
    const faint = !!d.faint || (inCombo && two);
    const arrow = makeArrow(d.color, { width: faint ? 2.5 : 4, opacity: faint ? 0.45 : 1, head: d.drag && !isStatic ? 18 : 13 });
    const legs = d.legs ? s('path', { fill: 'none', stroke: hue('teal'), 'stroke-width': 4, 'stroke-dasharray': '1 8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) : null;
    if (legs) gUnder.appendChild(legs);
    gArrows.appendChild(arrow.el);
    parts[d.id] = {
      arrow, legs,
      label: name(d) ? text() : null,
      legX: legs ? text() : null,
      legY: legs ? text() : null,
      handle: null,
    };
    if (legs) for (const t of [parts[d.id].legX, parts[d.id].legY]) t.setAttribute('style', `fill:${hue('teal', 'text')}`);
    if (parts[d.id].label) parts[d.id].label.setAttribute('style', `fill:${hue(d.color, 'text')}`);
  }

  // sum: ghosts of each arrow at the other's tip, and the sum itself
  let sumParts = null;
  if (sumSpec) {
    const [du, dv] = sumSpec.of.map((id) => byId[id]);
    sumParts = {
      ghostV: makeArrow(dv.color, { width: 3, dashed: true, opacity: 0.75 }),
      ghostU: sumSpec.routes === 'both' ? makeArrow(du.color, { width: 3, dashed: true, opacity: 0.75 }) : null,
      arrow: sumSpec.show ? makeArrow(sumSpec.color, { width: 4.5 }) : null,
      label: sumSpec.show && sumSpec.label !== false ? text() : null,
    };
    gArrows.insertBefore(sumParts.ghostV.el, gArrows.firstChild);
    if (sumParts.ghostU) gArrows.insertBefore(sumParts.ghostU.el, gArrows.firstChild);
    if (sumParts.arrow) gArrows.appendChild(sumParts.arrow.el);
    if (sumParts.label) sumParts.label.setAttribute('style', `fill:${hue(sumSpec.color, 'text')}`);
  }

  // combination: a lots of the first arrow, then b lots of the second
  let comboParts = null;
  if (comboSpec) {
    const [du, dv] = comboSpec.of.map((id) => byId[id]);
    comboParts = {
      first: makeArrow(two ? du.color : (comboSpec.color || 'green'), { width: two ? 5 : 7, opacity: two ? 1 : 0.6 }),
      second: two ? makeArrow(dv.color, { width: 5 }) : null,
      beads: s('g'),
      end: s('circle', { r: 7, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }),
      label: !two ? text() : null,
    };
    if (two) { gArrows.append(comboParts.first.el, comboParts.second.el); } else gArrows.insertBefore(comboParts.first.el, gArrows.firstChild);
    gArrows.append(comboParts.beads, comboParts.end);
    if (comboParts.label) comboParts.label.setAttribute('style', `fill:${hue(comboSpec.color || 'green', 'text')}`);
  }

  // formula line, readouts, sliders
  const line = h('div.vp-line');
  if (lineKind) fr.el.insertBefore(line, fr.readouts);
  const ro = {};
  if (!env.compact) {
    const pairName = pair ? pair.map((id) => name(byId[id]) || id) : null;
    for (const key of show) {
      if (!pair) break;
      if (key === 'dot') ro.dot = readout(`$${texName(byId[pair[0]])} \\cdot ${texName(byId[pair[1]])}$`, { digits: 2 });
      else if (key === 'angle') ro.angle = readout('angle', { digits: 0, unit: '°' });
      else if (key === 'cos') ro.cos = readout(spec.cosLabel || 'cos of the angle', { digits: 2 });
      else if (key === 'shadow') ro.shadow = readout(`shadow of ${pairName[1]} on ${pairName[0]}`, { digits: 2, color: 'violet' });
      else if (key === 'len0' || key === 'lengths') ro.len0 = readout(`length of ${pairName[0]}`, { digits: 2 });
      if (key === 'len1' || key === 'lengths') ro.len1 = readout(`length of ${pairName[1]}`, { digits: 2 });
    }
    for (const r of Object.values(ro)) fr.readouts.appendChild(r.el);
  }
  const extraDots = (!env.compact && Array.isArray(spec.dots) ? spec.dots : []).filter((p) => p.every(has)).map((p) => {
    const r = readout(`$${texName(byId[p[0]])} \\cdot ${texName(byId[p[1]])}$`, { digits: 2 });
    fr.readouts.appendChild(r.el);
    return { ids: p, r };
  });
  const signed = (r, v) => { r.set(v); r.el.querySelector('b').style.color = v > 0 ? hue('green', 'text') : v < 0 ? hue('red', 'text') : ''; };

  let aRow = null;
  let bRow = null;
  if (comboSpec && !isStatic) {
    const [du, dv] = comboSpec.of.map((id) => byId[id]);
    const row = (def, color, fallback, set) => sliderRow({
      label: def.label || fallback, min: def.min, max: def.max, step: def.step, value: def.value, color,
      onInput: (v) => { if (readOnly) return; set(v); play('tap'); render(); env.onChange(getState()); },
    });
    aRow = row(aDef, du.color, two ? `$a$: lots of ${name(du) || 'the first'}` : 'scale by', (v) => { a = v; });
    fr.controls.appendChild(aRow.el);
    if (two) {
      bRow = row(bDef, dv.color, `$b$: lots of ${name(dv) || 'the second'}`, (v) => { b = v; });
      fr.controls.appendChild(bRow.el);
    }
  }

  /* ------------------------------------------------------------ handles */
  function constrain(d, x, y, ev) {
    if (d.circle) {
      const cur = pos[d.id];
      const stepDeg = d.snapDeg || 15;
      let deg;
      if (ev && ev.type === 'keydown') {
        const turn = ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? 1 : -1;
        deg = Math.round((Math.atan2(cur.y, cur.x) * 180) / Math.PI / stepDeg) * stepDeg + turn * stepDeg * (ev.shiftKey ? 3 : 1);
      } else {
        if (Math.hypot(x, y) < 1e-6) return cur;
        deg = snapTo((Math.atan2(y, x) * 180) / Math.PI, stepDeg);
      }
      const rad = (deg * Math.PI) / 180;
      return { x: tidy(d.circle * Math.cos(rad), 9), y: tidy(d.circle * Math.sin(rad), 9) };
    }
    const lo = (v, step) => Math.ceil(v / step - 1e-9) * step;
    const hi = (v, step) => Math.floor(v / step + 1e-9) * step;
    const st = d.snap || 0;
    return {
      x: tidy(clamp(st ? snapTo(x, st) : x, st ? lo(x0, st) : x0, st ? hi(x1, st) : x1)),
      y: tidy(clamp(st ? snapTo(y, st) : y, st ? lo(y0, st) : y0, st ? hi(y1, st) : y1)),
    };
  }
  if (!isStatic) {
    for (const d of defs) {
      if (!d.drag) continue;
      const hd = handle(svg, {
        x: sx(pos[d.id].x), y: sy(pos[d.id].y), r: 7, color: d.color,
        label: `Tip of arrow ${name(d) || d.id}`,
        keyStep: Math.max(4, k * (d.snap || 0.25)),
        onMove(px, py, ev) {
          if (readOnly) return;
          const next = constrain(d, ux(px), uy(py), ev);
          if (next.x === pos[d.id].x && next.y === pos[d.id].y) return;
          pos[d.id] = next;
          play('tap');
          render();
          env.onChange(getState());
        },
      });
      parts[d.id].handle = hd;
      gHandles.appendChild(hd.el);
    }
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const O = { x: 0, y: 0 };
    for (const d of defs) {
      const p = pos[d.id];
      const part = parts[d.id];
      part.arrow.set(sx(0), sy(0), sx(p.x), sy(p.y));
      if (part.handle) { part.handle.set(sx(p.x), sy(p.y)); part.handle.setLabel(`${txt(p.x)} across, ${txt(p.y)} up`); }
      if (part.label) tipLabel(part.label, O, p, name(d), part.handle ? 21 : 15);
      if (part.legs) {
        part.legs.setAttribute('d', `M${sx(0)} ${sy(0)}H${sx(p.x)}V${sy(p.y)}`);
        put(part.legX, sx(p.x / 2), sy(0) + (p.y >= 0 ? 20 : -10), p.x ? txt(p.x) : '');
        put(part.legY, sx(p.x) + (p.x >= 0 ? 10 : -10), sy(p.y / 2) + 5, p.y ? txt(p.y) : '', p.x >= 0 ? 'start' : 'end');
      }
    }
    if (sumParts) {
      const [p, q] = sumSpec.of.map((id) => pos[id]);
      const end = sumPoint();
      sumParts.ghostV.set(sx(p.x), sy(p.y), sx(end.x), sy(end.y));
      if (sumParts.ghostU) sumParts.ghostU.set(sx(q.x), sy(q.y), sx(end.x), sy(end.y));
      if (sumParts.arrow) sumParts.arrow.set(sx(0), sy(0), sx(end.x), sy(end.y));
      if (sumParts.label) tipLabel(sumParts.label, O, end, sumSpec.label || sumSpec.of.map((id) => name(byId[id]) || id).join(' + '), 16);
    }
    if (comboParts) {
      const u = pos[comboSpec.of[0]];
      const v = two ? pos[comboSpec.of[1]] : O;
      const mid = { x: a * u.x, y: a * u.y };
      const end = comboPoint();
      comboParts.first.set(sx(0), sy(0), sx(mid.x), sy(mid.y));
      if (comboParts.second) comboParts.second.set(sx(mid.x), sy(mid.y), sx(end.x), sy(end.y));
      comboParts.end.setAttribute('cx', sx(end.x));
      comboParts.end.setAttribute('cy', sy(end.y));
      comboParts.beads.replaceChildren();
      if (two) {
        // a bead at the end of each whole copy, so the copies can be counted
        const bead = (x, y, color) => comboParts.beads.appendChild(s('circle', { cx: sx(x), cy: sy(y), r: 3.5, fill: 'var(--surface)', stroke: hue(color), 'stroke-width': 2 }));
        for (let i = 1; i < Math.abs(a) - 1e-9; i++) bead(Math.sign(a) * i * u.x, Math.sign(a) * i * u.y, byId[comboSpec.of[0]].color);
        for (let i = 1; i < Math.abs(b) - 1e-9; i++) bead(mid.x + Math.sign(b) * i * v.x, mid.y + Math.sign(b) * i * v.y, byId[comboSpec.of[1]].color);
      } else if (comboParts.label) {
        const d = byId[comboSpec.of[0]];
        tipLabel(comboParts.label, O, end, a === 1 || a === 0 ? '' : `${txt(a)}${name(d) || ''}`, 20);
      }
    }
    let facts = null;
    if (pair) {
      facts = pairFacts();
      const [p, q] = pair.map((id) => pos[id]);
      const lp = lenOf(p);
      if (drawShadow) {
        const ok = lp > 0;
        for (const el of [shadowLine, shadowDrop, shadowBar, shadowCorner]) el.setAttribute('visibility', ok ? 'visible' : 'hidden');
        if (ok) {
          const t = dotOf(p, q) / (lp * lp);
          const foot = { x: t * p.x, y: t * p.y };
          const far = (Math.abs(x1 - x0) + Math.abs(y1 - y0)) / lp;
          shadowLine.setAttribute('x1', sx(-far * p.x)); shadowLine.setAttribute('y1', sy(-far * p.y));
          shadowLine.setAttribute('x2', sx(far * p.x)); shadowLine.setAttribute('y2', sy(far * p.y));
          shadowBar.setAttribute('x1', sx(0)); shadowBar.setAttribute('y1', sy(0));
          shadowBar.setAttribute('x2', sx(foot.x)); shadowBar.setAttribute('y2', sy(foot.y));
          shadowBar.setAttribute('visibility', Math.hypot(foot.x, foot.y) * k < 1 ? 'hidden' : 'visible');
          shadowDrop.setAttribute('x1', sx(q.x)); shadowDrop.setAttribute('y1', sy(q.y));
          shadowDrop.setAttribute('x2', sx(foot.x)); shadowDrop.setAttribute('y2', sy(foot.y));
          // a small right-angle mark where the drop meets the line
          const drop = { x: q.x - foot.x, y: q.y - foot.y };
          const dl = lenOf(drop);
          if (dl * k > 16) {
            const e1 = { x: (p.x / lp) * (t >= 0 ? -1 : 1), y: (p.y / lp) * (t >= 0 ? -1 : 1) };
            const e2 = { x: drop.x / dl, y: drop.y / dl };
            const m = 9 / k;
            shadowCorner.setAttribute('d', `M${sx(foot.x + e1.x * m)} ${sy(foot.y + e1.y * m)}L${sx(foot.x + (e1.x + e2.x) * m)} ${sy(foot.y + (e1.y + e2.y) * m)}L${sx(foot.x + e2.x * m)} ${sy(foot.y + e2.y * m)}`);
          } else shadowCorner.setAttribute('d', '');
        }
      }
      if (show.includes('angle')) {
        if (facts.angle == null || facts.angle < 0.5) arc.setAttribute('d', '');
        else {
          const a0 = Math.atan2(p.y, p.x);
          const a1 = Math.atan2(q.y, q.x);
          let sweep = a1 - a0;
          while (sweep > Math.PI) sweep -= 2 * Math.PI;
          while (sweep < -Math.PI) sweep += 2 * Math.PI;
          const R = 26;
          const start = { x: sx(0) + R * Math.cos(a0), y: sy(0) - R * Math.sin(a0) };
          const end = { x: sx(0) + R * Math.cos(a0 + sweep), y: sy(0) - R * Math.sin(a0 + sweep) };
          arc.setAttribute('d', `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A${R} ${R} 0 0 ${sweep > 0 ? 0 : 1} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`);
        }
      }
      if (ro.dot) signed(ro.dot, facts.dot);
      if (ro.angle) ro.angle.set(facts.angle == null ? '—' : facts.angle);
      if (ro.cos) ro.cos.set(facts.cos == null ? '—' : facts.cos);
      if (ro.shadow) ro.shadow.set(facts.shadow == null ? '—' : facts.shadow);
      if (ro.len0) ro.len0.set(lp);
      if (ro.len1) ro.len1.set(lenOf(q));
    }
    for (const { ids, r } of extraDots) signed(r, dotOf(pos[ids[0]], pos[ids[1]]));

    if (lineKind) {
      let tex = '';
      const first = defs[0];
      if (lineKind === 'vector' && first) {
        tex = `${texName(first)} = ${col(pos[first.id].x, pos[first.id].y)}`;
      } else if (lineKind === 'length' && first) {
        const p = pos[first.id];
        const sq = tidy(p.x * p.x + p.y * p.y);
        const root = Math.sqrt(sq);
        tex = `|${texName(first)}| = \\sqrt{${bracket(p.x)}^2 + ${bracket(p.y)}^2} = \\sqrt{${fmt(sq)}}${Number.isInteger(root) ? ` = ${root}` : ` \\approx ${fmt(root)}`}`;
      } else if (lineKind === 'sum' && sumSpec) {
        const [du, dv] = sumSpec.of.map((id) => byId[id]);
        const end = sumPoint();
        tex = `\\${du.color}{${texName(du)}} + \\${dv.color}{${texName(dv)}} = ${col(pos[du.id].x, pos[du.id].y)} + ${col(pos[dv.id].x, pos[dv.id].y)} = ${col(end.x, end.y)}`;
      } else if (lineKind === 'combo' && comboSpec) {
        const [du, dv] = comboSpec.of.map((id) => byId[id]);
        const end = comboPoint();
        // an arrow without a name is written out as its column
        const shownAs = (d) => `\\${d.color}{${d.label === false ? col(pos[d.id].x, pos[d.id].y) : texName(d)}}`;
        tex = two
          ? `${coef(a, shownAs(du), true)} ${coef(b, shownAs(dv), false)} = ${col(end.x, end.y)}`
          : `${fmt(a)} \\times ${col(pos[du.id].x, pos[du.id].y)} = ${col(end.x, end.y)}`;
      } else if (lineKind === 'dot' && pair) {
        const [p, q] = pair.map((id) => pos[id]);
        tex = `${texName(byId[pair[0]])} \\cdot ${texName(byId[pair[1]])} = ${fmt(p.x)} \\times ${bracket(q.x)} + ${bracket(p.y)} \\times ${bracket(q.y)} = ${fmt(dotOf(p, q))}`;
      }
      line.innerHTML = tex ? mdInline(`$${tex}$`) : '';
    }

    const said = defs.map((d) => `${name(d) || d.id} is ${txt(pos[d.id].x)} across and ${txt(pos[d.id].y)} up`);
    if (comboSpec) { const end = comboPoint(); said.push(`the combination ends at ${txt(end.x)} across, ${txt(end.y)} up`); }
    if (sumSpec) { const end = sumPoint(); said.push(`the sum ends at ${txt(end.x)} across, ${txt(end.y)} up`); }
    if (facts) said.push(`the dot product is ${txt(facts.dot)}`);
    if (target) said.push(`the star is at ${txt(target.x)} across, ${txt(target.y)} up`);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Now: ${said.join('; ')}.`);
  }
  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      for (const d of defs) {
        const p = next[d.id];
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) pos[d.id] = { x: tidy(p.x, 9), y: tidy(p.y, 9) };
      }
      if (comboSpec && Number.isFinite(next.a)) { a = clamp(next.a, aDef.min, aDef.max); if (aRow) aRow.set(a); }
      if (two && Number.isFinite(next.b)) { b = clamp(next.b, bDef.min, bDef.max); if (bRow) bRow.set(b); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const part of Object.values(parts)) if (part.handle) part.handle.setEnabled(!readOnly);
      if (aRow) aRow.setDisabled(readOnly);
      if (bRow) bRow.setDisabled(readOnly);
    },
    destroy() { for (const part of Object.values(parts)) if (part.handle) part.handle.destroy(); },
  };
}

export const examples = [
  { title: 'vector-plane — drag an arrow, read its two numbers', spec: { type: 'vector-plane', vectors: [{ id: 'v', x: 3, y: 2, drag: true, legs: true }] } },
  { title: 'vector-plane — a sum, tip to tail', spec: { type: 'vector-plane', vectors: [{ id: 'u', x: 3, y: 1, drag: true }, { id: 'v', x: 1, y: 3, color: 'orange', drag: true }], sum: { of: ['u', 'v'] } } },
  { title: 'vector-plane — reach the star with a·u + b·v', spec: { type: 'vector-plane', x: [-2, 8], y: [-2, 8], vectors: [{ id: 'u', x: 2, y: 1 }, { id: 'v', x: -1, y: 1, color: 'orange' }], combo: { of: ['u', 'v'] }, target: { x: 4, y: 5 } } },
  { title: 'vector-plane — dot product and shadow', spec: { type: 'vector-plane', vectors: [{ id: 'u', x: 4, y: 2 }, { id: 'v', x: 1, y: 4, color: 'orange', drag: true }], pair: ['u', 'v'], show: ['dot', 'angle', 'shadow'], shadow: true } },
];
