/**
 * eigen-spin — a test arrow v and where a 2×2 matrix sends it. Most arrows
 * are knocked off their own line; turn v until Av lies on the dashed line
 * through v and you have found an eigenvector. The same picture answers
 * "which arrow lands on this target?" (drag v on the grid until Av reaches
 * the star), and shows what happens when the matrix is applied again and
 * again (a button, and a trail).
 *
 * {
 *   type: 'eigen-spin',
 *   matrix: [[2, 1], [1, 2]],     // written as rows: [[a, b], [c, d]]
 *   x: [-4, 4], y: [-4, 4],       // window; both axes use the same scale
 *   gridStep: 1, tickStep: 1,     // spacing of grid lines and of the numbers on the axes
 *   xLabel: '', yLabel: '',       // names for the axes
 *   v: { x: 1, y: 0 },            // where the test arrow starts
 *   mode: 'spin',                 // 'spin': the tip stays on a circle of radius r and moves in steps of snapDeg degrees
 *   r: 1, snapDeg: 15,            // 'free': the tip snaps to multiples of `snap` anywhere in the window
 *   snap: 1,
 *   drag: true,
 *   line: true,                   // the dashed line through v
 *   lines: [[1, 1], [1, -1]],     // extra thin lines through the origin, along these directions
 *   target: { x: 5, y: 3 },       // a star for Av to reach
 *   trace: false,                 // leave a dot wherever Av has been
 *   iterate: { label: 'Apply A again', max: 8, unit: 'step' },
 *                                 // a button that applies the matrix to the result, again and again, leaving a trail;
 *                                 // Av is then only drawn once the button has been pressed
 *   names: ['v', 'Av'],           // what the two arrows are called
 *   parts: ['North', 'South'],    // readouts for the two numbers of the current arrow, under these names (digits: partDigits, default 0)
 *   readouts: ['verdict'],        // 'verdict': "off the line of v" or "on the line of v: 3 × v"
 *   formula: true,                // the product written out under the picture
 *   showMatrix: true,             // with formula: false, show just the matrix
 *   static: false,
 * }
 *
 * State: { v: { x, y },           the test arrow
 *          image: { x, y },       the matrix applied to v once
 *          aligned, factor,       aligned: image lies on the line through v (and v is not zero); factor: then image = factor × v, otherwise null
 *          angle,                 direction of v in degrees, 0 to 360
 *          steps, current: { x, y },   with iterate: how often the button was pressed, and the matrix applied that many times to v
 *          hit }                  with target: true when image (with iterate: current) is on the star
 *
 * setState accepts { v: { x, y }, steps }. In 'spin' mode only the direction of v is used.
 */
import { frame, handle, readout, button, loop, hue, s, h, clamp, snapTo, tidy, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('eigen-spin', `
  .widget-eigen-spin .es-line { text-align: center; min-height: 3.1em; display: grid; align-content: center; font-size: var(--fs-md); }
  .widget-eigen-spin .es-line:empty { display: none; }
`);

const W = 440;
const H = 440;
let clipSeq = 0;

const fmt = (v) => String(tidy(Math.round(v * 100) / 100));
const txt = (v) => fmt(v).replace('-', '−');
const col = (p) => `\\begin{pmatrix} ${fmt(p.x)} \\\\ ${fmt(p.y)} \\end{pmatrix}`;

function makeArrow(color, { width = 4, head = 14, opacity = 1 } = {}) {
  const line = s('line', { stroke: hue(color), 'stroke-width': width, 'stroke-linecap': 'round' });
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
      const ex = dx / len;
      const ey = dy / len;
      const hl = Math.min(head, len * 0.7);
      const hw = hl * 0.5;
      const bx = x2 - ex * hl;
      const by = y2 - ey * hl;
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', (bx + ex * 2).toFixed(2)); line.setAttribute('y2', (by + ey * 2).toFixed(2));
      tip.setAttribute('d', `M${x2.toFixed(2)} ${y2.toFixed(2)}L${(bx - ey * hw).toFixed(2)} ${(by + ex * hw).toFixed(2)}L${(bx + ey * hw).toFixed(2)} ${(by - ex * hw).toFixed(2)}Z`);
    },
    hide() { el.setAttribute('visibility', 'hidden'); },
  };
}

export default function create(spec, env) {
  const m = Array.isArray(spec.matrix) ? spec.matrix : [[1, 0], [0, 1]];
  const A = { a: m[0][0], b: m[0][1], c: m[1][0], d: m[1][1] };
  const apply = (p) => ({ x: A.a * p.x + A.b * p.y, y: A.c * p.x + A.d * p.y });
  const [x0, x1] = spec.x || [-4, 4];
  const [y0, y1] = spec.y || [-4, 4];
  const gridStep = spec.gridStep || 1;
  const tickStep = spec.tickStep || gridStep;
  const free = spec.mode === 'free';
  const radius = spec.r || 1;
  const stepDeg = spec.snapDeg || 15;
  const snap = spec.snap || 1;
  const isStatic = !!spec.static || !!env.compact;
  const canDrag = !isStatic && spec.drag !== false;
  const iter = spec.iterate ? { label: 'Apply the matrix again', max: 8, ...(spec.iterate === true ? {} : spec.iterate) } : null;
  const target = spec.target ? { x: Number(spec.target.x), y: Number(spec.target.y) } : null;
  const names = Array.isArray(spec.names) ? spec.names : ['v', 'Av'];
  const want = Array.isArray(spec.readouts) ? spec.readouts : [];
  let readOnly = !!env.readOnly;

  // a window that starts at zero keeps its axis numbers outside the plot, so it needs wider margins
  const padL = x0 >= 0 ? 46 : 14;
  const padB = y0 >= 0 ? 30 : 14;
  const padT = y0 >= 0 ? 22 : 14;
  const padR = x0 >= 0 ? 26 : 14;
  const k = Math.min((W - padL - padR) / (x1 - x0), (H - padB - padT) / (y1 - y0));
  const ox = padL + (W - padL - padR - k * (x1 - x0)) / 2;
  const oy = padT + (H - padB - padT - k * (y1 - y0)) / 2;
  const sx = (v) => ox + (v - x0) * k;
  const sy = (v) => oy + (y1 - v) * k;
  const ux = (px) => x0 + (px - ox) / k;
  const uy = (py) => y1 - (py - oy) / k;

  /* -------------------------------------------------------------- model */
  const onCircle = (deg) => { const rad = (deg * Math.PI) / 180; return { x: tidy(radius * Math.cos(rad), 9), y: tidy(radius * Math.sin(rad), 9) }; };
  const toMode = (p) => {
    if (free) return { x: tidy(p.x, 9), y: tidy(p.y, 9) };
    if (Math.hypot(p.x, p.y) < 1e-9) return onCircle(0);
    return onCircle((Math.atan2(p.y, p.x) * 180) / Math.PI);
  };
  let v = toMode(spec.v || { x: 1, y: 0 });
  let steps = 0;
  const seen = new Map();   // trace: every place the image has been

  const power = (n) => { let p = v; for (let i = 0; i < n; i++) p = apply(p); return { x: tidy(p.x, 9), y: tidy(p.y, 9) }; };
  const getState = () => {
    const image = power(1);
    const cross = v.x * image.y - v.y * image.x;
    const len2 = v.x * v.x + v.y * v.y;
    const aligned = len2 > 1e-12 && Math.abs(cross) < 1e-7 * Math.max(1, len2);
    let angle = (Math.atan2(v.y, v.x) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const out = {
      v: { x: v.x, y: v.y }, image, aligned,
      factor: aligned ? tidy((image.x * v.x + image.y * v.y) / len2, 6) : null,
      angle: tidy(angle, 4) % 360,
    };
    if (iter) { out.steps = steps; out.current = power(steps); }
    if (target) {
      const end = iter ? out.current : image;
      out.hit = Math.abs(end.x - target.x) < 1e-6 && Math.abs(end.y - target.y) < 1e-6;
    }
    return out;
  };

  /* ------------------------------------------------------------- layers */
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 480, label: spec.alt || 'A test arrow and where a matrix sends it' });
  const { svg } = fr;
  const clipId = `es-clip-${++clipSeq}`;
  svg.appendChild(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: sx(x0) - 1, y: sy(y1) - 1, width: k * (x1 - x0) + 2, height: k * (y1 - y0) + 2 }))));
  const gGrid = s('g');
  const gUnder = s('g', { 'clip-path': `url(#${clipId})`, 'pointer-events': 'none' });
  const gArrows = s('g', { 'clip-path': `url(#${clipId})`, 'pointer-events': 'none' });
  const gLabels = s('g', { 'pointer-events': 'none' });
  const gHandles = s('g');
  svg.append(gGrid, gUnder, gArrows, gLabels, gHandles);

  const multiples = (lo, hi, step) => { const out = []; for (let i = Math.ceil(lo / step - 1e-9); i * step <= hi + 1e-9; i++) out.push(tidy(i * step)); return out; };
  for (const g of multiples(x0, x1, gridStep)) gGrid.appendChild(s('line.grid-line', { x1: sx(g), x2: sx(g), y1: sy(y0), y2: sy(y1) }));
  for (const g of multiples(y0, y1, gridStep)) gGrid.appendChild(s('line.grid-line', { y1: sy(g), y2: sy(g), x1: sx(x0), x2: sx(x1) }));
  const axisX = clamp(0, x0, x1);
  const axisY = clamp(0, y0, y1);
  gGrid.appendChild(s('line.axis-line', { x1: sx(x0), x2: sx(x1), y1: sy(axisY), y2: sy(axisY) }));
  gGrid.appendChild(s('line.axis-line', { y1: sy(y0), y2: sy(y1), x1: sx(axisX), x2: sx(axisX) }));
  if (!env.compact) {
    for (const g of multiples(x0, x1, tickStep)) {
      if (g === 0 && x0 < 0) continue;
      if (x0 < 0 && (g === x0 || g === x1)) continue;
      gGrid.appendChild(s('text.tick-label', { x: sx(g), y: sy(axisY) + 15, 'text-anchor': 'middle' }, txt(g)));
    }
    for (const g of multiples(y0, y1, tickStep)) {
      if (g === 0 || (y0 < 0 && (g === y0 || g === y1))) continue;
      gGrid.appendChild(s('text.tick-label', { x: sx(axisX) - 6, y: sy(g) + 4, 'text-anchor': 'end' }, txt(g)));
    }
    if (spec.xLabel) gGrid.appendChild(s('text.axis-label', { x: sx(x1), y: sy(axisY) - 8, 'text-anchor': 'end' }, spec.xLabel));
    if (spec.yLabel) gGrid.appendChild(s('text.axis-label', { x: sx(axisX) + 8, y: sy(y1) + 12, 'text-anchor': 'start' }, spec.yLabel));
  }

  // fixed extras: direction lines, the circle the tip runs on, the star
  const reach = Math.abs(x1 - x0) + Math.abs(y1 - y0);
  for (const dir of Array.isArray(spec.lines) ? spec.lines : []) {
    const len = Math.hypot(dir[0], dir[1]) || 1;
    const fx = (dir[0] / len) * reach;
    const fy = (dir[1] / len) * reach;
    gUnder.appendChild(s('line', { x1: sx(-fx), y1: sy(-fy), x2: sx(fx), y2: sy(fy), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
  }
  if (!free) gUnder.appendChild(s('circle', { cx: sx(0), cy: sy(0), r: radius * k, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2 }));
  if (target) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? 6 : 14;
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      d += `${i ? 'L' : 'M'}${(sx(target.x) + rad * Math.cos(ang)).toFixed(1)} ${(sy(target.y) + rad * Math.sin(ang)).toFixed(1)}`;
    }
    gUnder.appendChild(s('path', { d: `${d}Z`, fill: hue('yellow'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  }
  const ownLine = s('line', { stroke: hue('violet'), 'stroke-width': 2, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' });
  if (spec.line !== false) gUnder.appendChild(ownLine);
  const gTrace = s('g');
  const trail = s('polyline', { fill: 'none', stroke: hue('green'), 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: 0.6 });
  const gTrail = s('g');
  gUnder.append(gTrace, trail, gTrail);

  const arrowV = makeArrow('violet', { head: canDrag ? 18 : 14 });
  const arrowOut = makeArrow('green', { width: 4.5 });
  gArrows.append(arrowOut.el, arrowV.el);
  const label = (color) => { const t = s('text', { class: 'fig-label', style: `fill:${hue(color, 'text')}` }); gLabels.appendChild(t); return t; };
  const labV = label('violet');
  const labOut = label('green');
  const place = (t, p, str, gap) => {
    const px = sx(p.x);
    const py = sy(p.y);
    const inside = px >= sx(x0) - 1 && px <= sx(x1) + 1 && py >= sy(y1) - 1 && py <= sy(y0) + 1;
    if (!str || !inside) { t.setAttribute('visibility', 'hidden'); return; }
    t.removeAttribute('visibility');
    const dx = px - sx(0);
    const dy = py - sy(0);
    const len = Math.hypot(dx, dy);
    const nx = len < 2 ? 0 : dx / len;
    const ny = len < 2 ? -1 : dy / len;
    // keep the whole word inside the picture: near the right or left edge it moves above the tip instead
    const wide = str.length * 9 + 6;
    let tx = px + nx * gap;
    let ty = py + ny * gap + 5;
    let anchor = nx > 0.4 ? 'start' : nx < -0.4 ? 'end' : 'middle';
    if (anchor === 'start' && tx + wide > W - 6) { anchor = 'end'; tx = px - 4; ty = py - 14; }
    if (anchor === 'end' && tx - wide < 6) { anchor = 'start'; tx = px + 4; ty = py - 14; }
    t.setAttribute('x', clamp(tx, 10, W - 10).toFixed(1));
    t.setAttribute('y', clamp(ty, 16, H - 8).toFixed(1));
    t.setAttribute('text-anchor', anchor);
    t.textContent = str;
  };

  /* ----------------------------------------------- text under the picture */
  const line = h('div.es-line');
  const showFormula = !env.compact && spec.formula !== false;
  const showMatrixOnly = !env.compact && spec.formula === false && spec.showMatrix;
  if (showFormula || showMatrixOnly) fr.el.insertBefore(line, fr.readouts);
  const matTex = `\\begin{pmatrix} ${fmt(A.a)} & ${fmt(A.b)} \\\\ ${fmt(A.c)} & ${fmt(A.d)} \\end{pmatrix}`;
  if (showMatrixOnly) line.innerHTML = mdInline(`$A = ${matTex}$`);
  const ro = {};
  if (!env.compact) {
    if (want.includes('verdict')) { ro.verdict = readout(`${names[1]} is`, {}); ro.verdict.el.querySelector('b').style.fontFamily = 'inherit'; }
    if (Array.isArray(spec.parts)) {
      if (iter) ro.steps = readout(iter.unit || 'step', { digits: 0 });
      ro.p0 = readout(spec.parts[0], { digits: spec.partDigits || 0, color: 'green' });
      ro.p1 = readout(spec.parts[1], { digits: spec.partDigits || 0, color: 'green' });
    }
    for (const r of Object.values(ro)) fr.readouts.appendChild(r.el);
  }

  /* ------------------------------------------------------------- drawing */
  let hd = null;
  let glide = null;   // { from, to, t } while the result arrow is moving
  function render() {
    const st = getState();
    arrowV.set(sx(0), sy(0), sx(v.x), sy(v.y));
    place(labV, v, names[0], canDrag ? 21 : 15);
    if (hd) { hd.set(sx(v.x), sy(v.y)); hd.setLabel(free ? `${txt(v.x)} across, ${txt(v.y)} up` : `pointing at ${Math.round(st.angle)} degrees`); }
    const far = reach / (Math.hypot(v.x, v.y) || 1);
    ownLine.setAttribute('x1', sx(-far * v.x)); ownLine.setAttribute('y1', sy(-far * v.y));
    ownLine.setAttribute('x2', sx(far * v.x)); ownLine.setAttribute('y2', sy(far * v.y));
    ownLine.setAttribute('visibility', Math.hypot(v.x, v.y) > 1e-9 ? 'visible' : 'hidden');
    ownLine.setAttribute('stroke-width', st.aligned && !iter ? 3.5 : 2);

    const end = iter ? st.current : st.image;
    const showOut = !iter || steps > 0;
    const drawn = glide ? glide.at : end;
    if (showOut) arrowOut.set(sx(0), sy(0), sx(drawn.x), sy(drawn.y)); else arrowOut.hide();
    place(labOut, drawn, showOut ? (iter ? '' : names[1]) : '', 16);

    if (iter) {
      const pts = [];
      gTrail.replaceChildren();
      for (let i = 0; i <= steps; i++) {
        const p = power(i);
        pts.push(`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`);
        if (i > 0 && i < steps) gTrail.appendChild(s('circle', { cx: sx(p.x), cy: sy(p.y), r: 4, fill: 'var(--surface)', stroke: hue('green'), 'stroke-width': 2 }));
      }
      trail.setAttribute('points', pts.join(' '));
    }
    if (spec.trace) {
      const key = `${Math.round(st.image.x * 100)},${Math.round(st.image.y * 100)}`;
      if (!seen.has(key) && seen.size < 400) {
        seen.set(key, st.image);
        gTrace.appendChild(s('circle', { cx: sx(st.image.x), cy: sy(st.image.y), r: 4.5, fill: hue('green'), opacity: 0.55 }));
      }
    }

    if (showFormula) {
      const out = iter ? st.current : st.image;
      // numbers shown to two decimals are rounded: the product is then only approximately what is written
      const exact = [v.x, v.y, out.x, out.y].every((n) => Math.abs(n - Number(fmt(n))) < 1e-9);
      const left = iter
        ? (steps === 0 ? `\\violet{\\mathbf{${names[0]}}} = ${col(v)}` : `\\text{after ${steps} ${steps === 1 ? (iter.unit || 'step') : `${iter.unit || 'step'}s`}: } \\green{${col(out)}}`)
        : `${matTex}\\violet{${col(v)}} ${exact ? '=' : '\\approx'} \\green{${col(out)}}`;
      line.innerHTML = mdInline(`$${left}$`);
    }
    if (ro.verdict) {
      ro.verdict.set(st.aligned ? `on the line of ${names[0]}: ${txt(st.factor)} × ${names[0]}` : `off the line of ${names[0]}`);
      ro.verdict.el.querySelector('b').style.color = st.aligned ? hue('green', 'text') : '';
    }
    if (ro.p0) { const p = iter ? st.current : st.image; ro.p0.set(p.x); ro.p1.set(p.y); }
    if (ro.steps) ro.steps.set(steps);

    const said = [`The test arrow ${names[0]} is ${txt(v.x)} across and ${txt(v.y)} up.`];
    if (iter) said.push(steps ? `After ${steps} ${steps === 1 ? 'application' : 'applications'} of the matrix it is at ${txt(st.current.x)} across, ${txt(st.current.y)} up.` : 'The matrix has not been applied yet.');
    else said.push(`The matrix sends it to ${txt(st.image.x)} across, ${txt(st.image.y)} up, ${st.aligned ? `which is ${txt(st.factor)} times the test arrow: they lie on one line` : 'which is off the line of the test arrow'}.`);
    if (target) said.push(st.hit ? 'That is on the star.' : `The star is at ${txt(target.x)} across, ${txt(target.y)} up.`);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${said.join(' ')}`);
  }

  const anim = loop((dt) => {
    if (!glide) { anim.stop(); return; }
    glide.t = Math.min(1, glide.t + dt / 0.35);
    const e = glide.t * glide.t * (3 - 2 * glide.t);
    glide.at = { x: glide.from.x + (glide.to.x - glide.from.x) * e, y: glide.from.y + (glide.to.y - glide.from.y) * e };
    if (glide.t >= 1) { glide = null; anim.stop(); }
    render();
  });

  /* -------------------------------------------------------------- inputs */
  if (canDrag) {
    const lo = (val, st) => Math.ceil(val / st - 1e-9) * st;
    const hi = (val, st) => Math.floor(val / st + 1e-9) * st;
    hd = handle(svg, {
      r: 7, color: 'violet', label: `Tip of the test arrow ${names[0]}`, keyStep: Math.max(4, k * snap),
      onMove(px, py, ev) {
        if (readOnly) return;
        let next;
        if (free) {
          next = { x: tidy(clamp(snapTo(ux(px), snap), lo(x0, snap), hi(x1, snap))), y: tidy(clamp(snapTo(uy(py), snap), lo(y0, snap), hi(y1, snap))) };
        } else if (ev && ev.type === 'keydown') {
          const turn = ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? 1 : -1;
          const now = Math.round((Math.atan2(v.y, v.x) * 180) / Math.PI / stepDeg) * stepDeg;
          next = onCircle(now + turn * stepDeg * (ev.shiftKey ? 3 : 1));
        } else {
          const x = ux(px);
          const y = uy(py);
          if (Math.hypot(x, y) < 1e-6) return;
          next = onCircle(snapTo((Math.atan2(y, x) * 180) / Math.PI, stepDeg));
        }
        if (next.x === v.x && next.y === v.y) return;
        v = next;
        steps = 0;
        glide = null;
        play('tap');
        render();
        env.onChange(getState());
      },
    });
    gHandles.appendChild(hd.el);
  }
  if (iter && !isStatic) {
    fr.buttons.appendChild(button(iter.label, () => {
      if (readOnly) return;
      if (steps >= iter.max) { env.announce('That is as far as this picture goes. Press Start again.'); return; }
      const from = steps === 0 ? { ...v } : power(steps);
      steps++;
      play('tap');
      if (reducedMotion()) { glide = null; render(); } else { glide = { from, to: power(steps), t: 0, at: from }; render(); anim.start(); }
      const now = power(steps);
      env.announce(`Now at ${txt(now.x)}, ${txt(now.y)}.`);
      env.onChange(getState());
    }, { icon: 'play', variant: 'primary' }));
    fr.buttons.appendChild(button('Start again', () => {
      if (readOnly || !steps) return;
      steps = 0;
      glide = null;
      render();
      env.onChange(getState());
    }, { icon: 'reset' }));
  }

  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      glide = null;
      anim.stop();
      if (next.v && Number.isFinite(next.v.x) && Number.isFinite(next.v.y)) { v = toMode(next.v); steps = 0; }
      if (iter && Number.isFinite(next.steps)) steps = clamp(Math.round(next.steps), 0, iter.max);
      render();
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
    },
    destroy() { anim.stop(); if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'eigen-spin — turn v until Av lines up with it', spec: { type: 'eigen-spin', matrix: [[2, 1], [1, 2]], readouts: ['verdict'] } },
  { title: 'eigen-spin — which arrow lands on the star?', spec: { type: 'eigen-spin', matrix: [[2, 1], [1, 1]], mode: 'free', x: [-1, 7], y: [-1, 7], v: { x: 1, y: 0 }, target: { x: 5, y: 3 }, line: false } },
  { title: 'eigen-spin — apply the matrix again and again', spec: { type: 'eigen-spin', matrix: [[1, 0.5], [0.5, 1]], mode: 'free', x: [-6, 6], y: [-6, 6], v: { x: 0, y: 1 }, line: false, lines: [[1, 1], [1, -1]], iterate: { label: 'Apply A again', max: 6 } } },
];
