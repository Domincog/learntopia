/**
 * trig-triangle — a right-angled triangle seen from one of its acute angles.
 * Drawn to scale from the angle and one side, so that what the learner sees
 * always agrees with the numbers. Three ways to use it:
 *
 *   explore (default)   sliders for the size and/or the angle; the side lengths and
 *                       the ratios between them update live. Resize it and the
 *                       ratios stay put; change the angle and they move.
 *   label: true         the learner names the three sides (opposite / adjacent /
 *                       hypotenuse) by tapping the tag on each side.
 *   static: true        a picture: a triangle to scale with whatever is written on it.
 *
 * {
 *   type: 'trig-triangle',
 *   angle: 35,                        // the marked angle, in degrees (1 to 89)
 *   size: 6,                          // length of the side named by `fix`
 *   fix: 'hyp',                       // which side `size` is: 'hyp' | 'adj' | 'opp'
 *   sizeRange: [2, 10], sizeStep: 1,  // adds a size slider (leave out for a fixed size)
 *   angleRange: [10, 80], angleStep: 5,   // adds an angle slider (leave out for a fixed angle)
 *   sizeLabel: 'size', angleLabel: 'angle',
 *   names: { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' },   // what the sides are called
 *   sides: 'length',                  // written on each side: 'length' | 'name' | 'both' | 'none'
 *   text: { opp: '?', adj: '20 m', hyp: '', angle: '40°', other: '50°' },
 *                                     // overrides for single labels; '' hides one; `other` marks the second acute angle
 *   ratios: ['sin', 'cos', 'tan'],    // readouts: sin = opp ÷ hyp, cos = adj ÷ hyp, tan = opp ÷ adj
 *   ratioNames: false,                // true: the readouts are labelled sin θ, cos θ, tan θ
 *   unit: 'm', digits: 2, ratioDigits: 2,
 *   flip: false, turn: 0,             // mirror the picture; rotate it by 0, 90, 180 or 270 degrees
 *   plain: false,                     // true: all three sides in one colour, so that colour does not give the names away
 *   scene: 'tree', sceneHeight: 16.8, // an object standing on the right-angle corner: 'tree' | 'pole' | 'tower' | 'wall'
 *   ground: true,                     // draw the ground under the triangle (always on with a scene)
 *   eye: 1.6,                         // with a scene: the marked angle is this far above the ground (an observer's
 *                                     // eye level). sceneHeight is then measured from the ground, and text.total
 *                                     // labels the whole height of the object, text.eye the observer's height
 * }
 *
 * State (explore): { angle, size, opp, adj, hyp, sin, cos, tan, sizes, sizesTried, angles, anglesTried, gap }
 *   opp, adj, hyp   the three side lengths (4 decimals)
 *   sin, cos, tan   the three ratios (4 decimals)
 *   sizes           the sizes tried so far at the current angle (sorted); sizesTried is how many
 *   angles          every angle tried so far (sorted); anglesTried is how many
 *   gap             with a scene: the height where the sloping side meets the object, minus the
 *                   object's height (0 when the line of sight touches the very top); otherwise null
 * State (label):   { tags: { opp, adj, hyp }, placed, right }
 *   tags            the name the learner has given to the side that really is the opposite /
 *                   adjacent / hypotenuse ('' while it has no name)
 *   placed, right   how many sides have a name, and how many of those names are correct
 *
 * setState accepts { angle, size, sizes, angles } or { tags }.
 */
import { frame, sliderRow, readout, hue, s, clamp, tidy, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 480;
const H = 340;
const D2R = Math.PI / 180;
const ROLES = ['opp', 'adj', 'hyp'];
const COLOR = { opp: 'orange', adj: 'blue', hyp: 'violet' };
const NAMES = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' };
const TAGS = ['', 'opposite', 'adjacent', 'hypotenuse'];
const TAG_COLOR = { opposite: 'orange', adjacent: 'blue', hypotenuse: 'violet' };
const CHIP_W = 126;
const CHIP_H = 46;
const CHAR = 10;  // room for one character of a fig-label, in viewBox units (labels are drawn larger on narrow screens)

addStyles('trig-triangle', `
  .widget-trig-triangle .tt-chip { cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
  .widget-trig-triangle .tt-chip rect.tt-face { transition: fill 0.12s ease; }
  .widget-trig-triangle .tt-chip:focus-visible rect.tt-face { stroke: var(--focus); stroke-width: 4; }
  .widget-trig-triangle .w-canvas .tt-chip text.fig-label { stroke: none; }
  .widget-trig-triangle.is-readonly .tt-chip, .widget-trig-triangle .is-readonly .tt-chip { cursor: default; pointer-events: none; }
`);

/** The three side lengths of the triangle with this angle, when one side is `size` long. */
export function sidesOf(angle, size, fix = 'hyp') {
  const sin = Math.sin(angle * D2R);
  const cos = Math.cos(angle * D2R);
  const hyp = fix === 'adj' ? size / cos : fix === 'opp' ? size / sin : size;
  return { opp: hyp * sin, adj: hyp * cos, hyp };
}

const stepsBetween = (lo, hi, step) => { const out = []; for (let i = 0; lo + i * step <= hi + 1e-9; i++) out.push(tidy(lo + i * step)); return out; };

export default function create(spec, env) {
  const labelMode = !!spec.label && !env.compact;
  const isStatic = !!spec.static || !!spec.label || env.compact;
  const fix = ['hyp', 'adj', 'opp'].includes(spec.fix) ? spec.fix : 'hyp';
  const names = { ...NAMES, ...(spec.names || {}) };
  const text = spec.text || {};
  const unit = spec.unit || '';
  const digits = spec.digits != null ? spec.digits : 2;
  const ratioDigits = spec.ratioDigits != null ? spec.ratioDigits : 2;
  const sidesMode = spec.sides || 'length';
  const scene = spec.turn || spec.flip ? null : (spec.scene || null);
  const flip = !!spec.flip;
  const turn = ((Math.round((spec.turn || 0) / 90) % 4) + 4) % 4;
  const showGround = !!scene || !!spec.ground;
  const eye = scene && Number(spec.eye) > 0 ? Number(spec.eye) : 0;
  const plain = !!spec.plain || labelMode;
  const colorOf = (role) => (plain ? 'ink' : COLOR[role]);

  const aRange = !isStatic && Array.isArray(spec.angleRange) ? spec.angleRange.map(Number) : null;
  const sRange = !isStatic && Array.isArray(spec.sizeRange) ? spec.sizeRange.map(Number) : null;
  const aStep = spec.angleStep || 5;
  const sStep = spec.sizeStep || 1;
  let angle = clamp(Number(spec.angle) || 35, 1, 89);
  let size = Number(spec.size) > 0 ? Number(spec.size) : 6;
  if (aRange) angle = clamp(angle, aRange[0], aRange[1]);
  if (sRange) size = clamp(size, sRange[0], sRange[1]);
  let sizes = new Set([size]);
  const angles = new Set([angle]);
  const tags = { opp: '', adj: '', hyp: '' };
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A right-angled triangle' });
  const { svg } = fr;
  const g = s('g');
  const gChips = s('g');
  svg.append(g, gChips);

  /* ------------------------------------------------------------ geometry */
  const sceneHeight = scene ? (Number(spec.sceneHeight) > 0 ? Number(spec.sceneHeight) : sidesOf(angle, size, fix).opp + eye) : 0;
  /** Model coordinates: the marked angle at the origin, the right angle at (adj, 0), the third corner above it. */
  const corners = (a, sz) => { const t = sidesOf(a, sz, fix); return { A: { x: 0, y: 0 }, B: { x: t.adj, y: 0 }, C: { x: t.adj, y: t.opp } }; };
  const orient = (p) => {
    let x = flip ? -p.x : p.x;
    let y = p.y;
    for (let i = 0; i < turn; i++) [x, y] = [-y, x];
    return { x, y };
  };

  const sideText = (role, len) => {
    if (text[role] != null) return String(text[role]);
    const length = `${formatNumber(len, digits)}${unit ? ` ${unit}` : ''}`;
    if (sidesMode === 'none') return '';
    if (sidesMode === 'name') return names[role];
    if (sidesMode === 'both') return `${names[role]} ${length}`;
    return length;
  };
  const boxOf = (str) => ({ a: labelMode ? CHIP_W / 2 : (String(str).length * CHAR) / 2 + 3, b: labelMode ? CHIP_H / 2 : 10 });

  /**
   * Fit the largest triangle the sliders allow into the canvas, leaving room for
   * the labels around it. One scale for every setting, so that resizing looks
   * like resizing.
   */
  const angleList = aRange ? [aRange[0], aRange[1]] : [angle];
  const sizeMax = sRange ? sRange[1] : size;
  let extent = [];
  for (const a of angleList) { const c = corners(a, sizeMax); extent.push(c.A, c.B, c.C); }
  if (scene) extent.push({ x: extent[1].x, y: (sceneHeight - eye) * 1.08 }, { x: 0, y: -eye });
  extent = extent.map(orient);
  const lo = { x: Math.min(...extent.map((p) => p.x)), y: Math.min(...extent.map((p) => p.y)) };
  const hi = { x: Math.max(...extent.map((p) => p.x)), y: Math.max(...extent.map((p) => p.y)) };
  let map = null;
  const fit = (m) => {
    const k = Math.min((W - m.l - m.r) / Math.max(hi.x - lo.x, 1e-6), (H - m.t - m.b) / Math.max(hi.y - lo.y, 1e-6));
    const ox = m.l + (W - m.l - m.r - (hi.x - lo.x) * k) / 2;
    const oy = m.t + (H - m.t - m.b - (hi.y - lo.y) * k) / 2;
    return { k, px: (p) => { const q = orient(p); return { x: ox + (q.x - lo.x) * k, y: oy + (hi.y - q.y) * k }; } };
  };

  /** Where each label goes for a given triangle: just outside the middle of its side. */
  function place(a, sz, mp) {
    const c = corners(a, sz);
    const t = sidesOf(a, sz, fix);
    const P = { A: mp.px(c.A), B: mp.px(c.B), C: mp.px(c.C) };
    const G = { x: (P.A.x + P.B.x + P.C.x) / 3, y: (P.A.y + P.B.y + P.C.y) / 3 };
    const ends = { opp: [P.B, P.C], adj: [P.A, P.B], hyp: [P.A, P.C] };
    const labels = {};
    for (const role of ROLES) {
      const [p, q] = ends[role];
      const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      let n = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
      if ((mid.x + n.x - G.x) ** 2 + (mid.y + n.y - G.y) ** 2 < (mid.x - n.x - G.x) ** 2 + (mid.y - n.y - G.y) ** 2) n = { x: -n.x, y: -n.y };
      const str = sideText(role, t[role]);
      const box = boxOf(str);
      let off = box.a * Math.abs(n.x) + box.b * Math.abs(n.y) + 9;
      if (scene && role === 'opp') off += scene === 'tree' ? 38 : scene === 'wall' || scene === 'tower' ? 30 : 12;
      if (eye && role === 'adj') off += eye * mp.k + 4;
      labels[role] = { x: mid.x + n.x * off, y: mid.y + n.y * off, str, box };
    }
    return { P, labels, t };
  }

  // Start with small margins and widen them until every label is inside the canvas.
  const m = { l: eye ? 34 + String(text.eye || '').length * CHAR : 26, r: eye && text.total ? 64 + String(text.total).length * CHAR : 26, t: 24, b: eye ? 44 : 24 };
  for (let pass = 0; pass < 5; pass++) {
    map = fit(m);
    let moved = false;
    for (const a of angleList) {
      const { labels } = place(a, sizeMax, map);
      for (const role of ROLES) {
        const L = labels[role];
        if (!L.str && !labelMode) continue;
        const over = { l: 8 - (L.x - L.box.a), r: L.x + L.box.a - (W - 8), t: 8 - (L.y - L.box.b), b: L.y + L.box.b - (H - 8) };
        for (const side of ['l', 'r', 't', 'b']) if (over[side] > 0.5) { m[side] += over[side]; moved = true; }
      }
    }
    if (!moved) break;
  }

  /* -------------------------------------------------------------- state */
  const getState = () => {
    if (labelMode) {
      const placed = ROLES.filter((r) => tags[r]).length;
      const right = ROLES.filter((r) => tags[r] === NAMES[r]).length;
      return { tags: { ...tags }, placed, right };
    }
    const t = sidesOf(angle, size, fix);
    const sorted = (set) => Array.from(set).sort((x, y) => x - y);
    return {
      angle, size,
      opp: tidy(t.opp, 4), adj: tidy(t.adj, 4), hyp: tidy(t.hyp, 4),
      sin: tidy(t.opp / t.hyp, 4), cos: tidy(t.adj / t.hyp, 4), tan: tidy(t.opp / t.adj, 4),
      sizes: sorted(sizes), sizesTried: sizes.size,
      angles: sorted(angles), anglesTried: angles.size,
      gap: scene ? tidy(t.opp + eye - sceneHeight, 4) : null,
    };
  };

  /* ------------------------------------------------------------ readouts */
  const ratioDefs = {
    sin: { label: `${names.opp} ÷ ${names.hyp}`, name: '$\\sin\\theta$', color: 'orange', of: (t) => t.opp / t.hyp },
    cos: { label: `${names.adj} ÷ ${names.hyp}`, name: '$\\cos\\theta$', color: 'blue', of: (t) => t.adj / t.hyp },
    tan: { label: `${names.opp} ÷ ${names.adj}`, name: '$\\tan\\theta$', color: 'green', of: (t) => t.opp / t.adj },
  };
  const ratioList = isStatic ? [] : (Array.isArray(spec.ratios) ? spec.ratios : ['sin']).filter((r) => ratioDefs[r]);
  const ratioOuts = ratioList.map((key) => {
    const def = ratioDefs[key];
    const ro = readout(spec.ratioNames ? def.name : def.label, { digits: ratioDigits, color: def.color });
    fr.readouts.appendChild(ro.el);
    return { def, ro };
  });

  /* ---------------------------------------------------------------- draw */
  const line = (p, q, color, width = 4, extra = {}) => s('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: hue(color), 'stroke-width': width, 'stroke-linecap': 'round', ...extra });

  function drawScene(P, mp) {
    const out = [];
    const bx = corners(angle, size).B.x;
    const top = mp.px({ x: bx, y: sceneHeight - eye });
    const ground = mp.px({ x: 0, y: -eye }).y;
    if (showGround) out.push(s('line', { x1: 8, x2: W - 8, y1: ground, y2: ground, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    if (scene === 'tree') {
      const hgt = ground - top.y;
      const half = Math.min(34, hgt * 0.3);
      out.push(s('line', { x1: top.x, x2: top.x, y1: ground, y2: ground - hgt * 0.45, stroke: 'var(--ink)', 'stroke-width': 7, 'stroke-linecap': 'round' }));
      out.push(s('path', { d: `M${top.x} ${top.y} L${top.x + half} ${ground - hgt * 0.28} H${top.x - half} Z`, fill: hue('green'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    } else if (scene === 'pole') {
      out.push(s('line', { x1: top.x, x2: top.x, y1: ground, y2: top.y, stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      out.push(s('path', { d: `M${top.x} ${top.y + 2} l26 9 l-26 9 Z`, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    } else if (scene === 'tower') {
      out.push(s('rect', { x: top.x, y: top.y, width: 26, height: ground - top.y, fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      for (let y = top.y + 14; y < ground - 14; y += 22) out.push(s('rect', { x: top.x + 9, y, width: 8, height: 9, fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
    } else if (scene === 'wall') {
      const wallTop = Math.min(top.y, P.C.y) - 18;
      out.push(s('rect', { x: top.x, y: wallTop, width: 22, height: ground - wallTop, fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    }
    if (eye) {
      // the observer: a post from the ground up to eye level, where the marked angle sits
      out.push(s('line', { x1: P.A.x, x2: P.A.x, y1: ground, y2: P.A.y, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
      if (text.eye) out.push(s('text.fig-label', { x: P.A.x - 9, y: (ground + P.A.y) / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle' }, String(text.eye)));
      if (text.total) {
        const dx = top.x + (scene === 'tree' ? 46 : 40);
        out.push(s('path', { d: `M${dx - 5} ${top.y} h10 M${dx} ${top.y} V${ground} M${dx - 5} ${ground} h10`, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
        out.push(s('text', { class: text.total === '?' ? 'fig-label-lg' : 'fig-label', x: dx + 10, y: (top.y + ground) / 2, 'text-anchor': 'start', 'dominant-baseline': 'middle' }, String(text.total)));
      }
    }
    return out;
  }

  function wedge(v, p, q, r, color) {
    const a1 = Math.atan2(p.y - v.y, p.x - v.x);
    const a2 = Math.atan2(q.y - v.y, q.x - v.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const p1 = { x: v.x + r * Math.cos(a1), y: v.y + r * Math.sin(a1) };
    const p2 = { x: v.x + r * Math.cos(a2), y: v.y + r * Math.sin(a2) };
    return {
      el: s('path', { d: `M${v.x} ${v.y} L${p1.x} ${p1.y} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${p2.x} ${p2.y} Z`, fill: hue(color), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
      mid: a1 + d / 2,
      span: Math.abs(d),
    };
  }

  const chips = {};
  function draw() {
    const { P, labels, t } = place(angle, size, map);
    g.replaceChildren();
    g.appendChild(s('polygon', { points: `${P.A.x},${P.A.y} ${P.B.x},${P.B.y} ${P.C.x},${P.C.y}`, fill: hue('gray', 'soft'), 'fill-opacity': scene ? 0.6 : 0.9, stroke: 'none' }));
    if (scene || showGround) g.append(...drawScene(P, map));

    // the marked angle (and, if asked for, the other acute angle)
    const legAC = Math.hypot(P.C.x - P.A.x, P.C.y - P.A.y);
    const r = clamp(legAC * 0.24, 22, 40);
    const w = wedge(P.A, P.B, P.C, r, 'yellow');
    g.appendChild(w.el);
    const angleText = text.angle != null ? String(text.angle) : `${formatNumber(angle, 1)}°`;
    if (angleText) {
      const lr = r + (w.span < 0.5 ? 12 + angleText.length * 4.6 : 16);
      g.appendChild(s('text.fig-label', { x: P.A.x + lr * Math.cos(w.mid), y: P.A.y + lr * Math.sin(w.mid), 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, angleText));
    }
    if (text.other) {
      const r2 = clamp(legAC * 0.2, 20, 34);
      const w2 = wedge(P.C, P.A, P.B, r2, 'teal');
      g.appendChild(w2.el);
      const lr = r2 + (w2.span < 0.5 ? 12 + String(text.other).length * 4.6 : 16);
      g.appendChild(s('text.fig-label', { x: P.C.x + lr * Math.cos(w2.mid), y: P.C.y + lr * Math.sin(w2.mid), 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, String(text.other)));
    }

    if (eye) g.appendChild(s('circle', { cx: P.A.x, cy: P.A.y, r: 5.5, fill: 'var(--ink)' }));

    // the three sides, each in its own colour
    g.appendChild(line(P.A, P.B, colorOf('adj'), plain ? 3.5 : 4));
    g.appendChild(line(P.B, P.C, colorOf('opp'), plain ? 3.5 : 4));
    g.appendChild(line(P.A, P.C, colorOf('hyp'), plain ? 3.5 : 4));

    // right-angle mark at B
    const u = { x: (P.A.x - P.B.x), y: (P.A.y - P.B.y) };
    const v = { x: (P.C.x - P.B.x), y: (P.C.y - P.B.y) };
    const lu = Math.hypot(u.x, u.y) || 1;
    const lv = Math.hypot(v.x, v.y) || 1;
    const q = Math.min(15, lu * 0.3, lv * 0.3);
    const p1 = { x: P.B.x + (u.x / lu) * q, y: P.B.y + (u.y / lu) * q };
    const p3 = { x: P.B.x + (v.x / lv) * q, y: P.B.y + (v.y / lv) * q };
    g.appendChild(s('path', { d: `M${p1.x} ${p1.y} L${p1.x + (v.x / lv) * q} ${p1.y + (v.y / lv) * q} L${p3.x} ${p3.y}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));

    if (labelMode) {
      for (const role of ROLES) {
        const chip = chips[role];
        const L = labels[role];
        chip.g.setAttribute('transform', `translate(${L.x} ${L.y})`);
        const tag = tags[role];
        chip.face.setAttribute('fill', tag ? hue(TAG_COLOR[tag], 'soft') : 'var(--surface)');
        chip.face.setAttribute('stroke-dasharray', tag ? 'none' : '5 4');
        chip.text.textContent = tag || 'tap to name';
        chip.text.setAttribute('style', tag ? `fill:${hue(TAG_COLOR[tag], 'text')}` : 'fill:var(--ink-3)');
        chip.g.setAttribute('aria-label', `The ${chip.where} side: ${tag ? `named ${tag}` : 'no name yet'}. Press to change the name.`);
      }
    } else {
      for (const role of ROLES) {
        const L = labels[role];
        if (!L.str) continue;
        g.appendChild(s('text', { class: L.str === '?' ? 'fig-label-lg' : 'fig-label', x: L.x, y: L.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: plain ? null : `fill:${hue(COLOR[role], 'text')}` }, L.str));
      }
    }

    for (const { def, ro } of ratioOuts) ro.set(def.of(t));
    if (!labelMode) {
      svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}A right-angled triangle with a marked angle of ${formatNumber(angle, 1)} degrees. ` +
        (isStatic ? '' : `${names.opp} ${formatNumber(t.opp, digits)}, ${names.adj} ${formatNumber(t.adj, digits)}, ${names.hyp} ${formatNumber(t.hyp, digits)}.`));
    }
  }

  /* ---------------------------------------------------------- label mode */
  if (labelMode) {
    for (const role of ROLES) {
      const face = s('rect.tt-face', { x: -CHIP_W / 2, y: -CHIP_H / 2, width: CHIP_W, height: CHIP_H, rx: 10, stroke: 'var(--ink)', 'stroke-width': 2.2 });
      const label = s('text.fig-label', { x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      const chip = s('g.tt-chip', { tabindex: '0', role: 'button' },
        s('rect', { x: -CHIP_W / 2 - 6, y: -CHIP_H / 2 - 6, width: CHIP_W + 12, height: CHIP_H + 12, fill: 'transparent' }), face, label);
      chip.dataset.keys = 'own';
      const cycle = () => {
        if (readOnly) return;
        tags[role] = TAGS[(TAGS.indexOf(tags[role]) + 1) % TAGS.length];
        play('select');
        draw();
        env.announce(tags[role] ? `Named ${tags[role]}` : 'Name removed');
        env.onChange(getState());
      };
      chip.addEventListener('click', cycle);
      chip.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); cycle(); } });
      chips[role] = { g: chip, face, text: label, where: '' };
      gChips.appendChild(chip);
    }
    // describe the sides by where they are, never by their role
    const { P } = place(angle, size, map);
    const mids = { opp: [P.B, P.C], adj: [P.A, P.B], hyp: [P.A, P.C] };
    const describe = ([p, q2]) => {
      const dx = Math.abs(q2.x - p.x);
      const dy = Math.abs(q2.y - p.y);
      const mx = (p.x + q2.x) / 2;
      const my = (p.y + q2.y) / 2;
      if (dy < 2) return my > H / 2 ? 'bottom' : 'top';
      if (dx < 2) return mx > W / 2 ? 'right-hand' : 'left-hand';
      return 'sloping';
    };
    for (const role of ROLES) chips[role].where = describe(mids[role]);
    svg.setAttribute('aria-label', spec.alt || 'A right-angled triangle with one acute angle marked. Each side has a tag you can name.');
  }

  /* ------------------------------------------------------------ controls */
  let sizeRow = null;
  let angleRow = null;
  const changed = () => { play('tap'); draw(); env.onChange(getState()); };
  if (sRange) {
    sizeRow = sliderRow({
      label: spec.sizeLabel || names[fix], min: sRange[0], max: sRange[1], step: sStep, value: size, color: COLOR[fix], unit,
      onInput: (v) => { if (readOnly) return; size = v; sizes.add(v); changed(); },
    });
    fr.controls.appendChild(sizeRow.el);
  }
  if (aRange) {
    angleRow = sliderRow({
      label: spec.angleLabel || 'angle', min: aRange[0], max: aRange[1], step: aStep, value: angle, color: 'yellow', unit: '°',
      onInput: (v) => { if (readOnly) return; angle = v; angles.add(v); sizes = new Set([size]); changed(); },
    });
    fr.controls.appendChild(angleRow.el);
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (labelMode) {
        if (next.tags) for (const role of ROLES) if (TAGS.includes(next.tags[role])) tags[role] = next.tags[role];
        draw();
        return;
      }
      if (next.angle != null) {
        const a = aRange ? clamp(Number(next.angle), aRange[0], aRange[1]) : angle;
        if (a !== angle) { angle = a; sizes = new Set(); }
        angles.add(angle);
        if (angleRow) angleRow.set(angle);
      }
      if (Array.isArray(next.angles) && aRange) for (const a of next.angles) if (stepsBetween(aRange[0], aRange[1], aStep).includes(Number(a))) angles.add(Number(a));
      if (next.size != null && sRange) { size = clamp(Number(next.size), sRange[0], sRange[1]); if (sizeRow) sizeRow.set(size); }
      if (Array.isArray(next.sizes) && sRange) for (const v of next.sizes) if (Number(v) >= sRange[0] && Number(v) <= sRange[1]) sizes.add(Number(v));
      sizes.add(size);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (sizeRow) sizeRow.setDisabled(readOnly);
      if (angleRow) angleRow.setDisabled(readOnly);
      for (const role of ROLES) if (chips[role]) chips[role].g.setAttribute('tabindex', readOnly ? '-1' : '0');
    },
  };
}

export const examples = [
  { title: 'Same angle, any size', spec: { type: 'trig-triangle', angle: 35, size: 6, sizeRange: [2, 10], ratios: ['sin'] } },
  { title: 'Change the angle', spec: { type: 'trig-triangle', angle: 40, size: 8, sizeRange: [4, 10], angleRange: [10, 80], sides: 'both', ratios: ['sin', 'cos', 'tan'] } },
  { title: 'Name the sides', spec: { type: 'trig-triangle', label: true, angle: 32, size: 10, turn: 90, flip: true } },
  { title: 'A picture to scale', spec: { type: 'trig-triangle', static: true, angle: 40, size: 20, fix: 'adj', scene: 'tree', text: { adj: '20 m', opp: '?', hyp: '' } } },
  { title: 'Aim at the top', spec: { type: 'trig-triangle', angle: 20, size: 30, fix: 'adj', angleRange: [10, 50], angleStep: 1, scene: 'pole', sceneHeight: 21, ratios: [], text: { adj: '30 m', opp: '', hyp: '' } } },
];
