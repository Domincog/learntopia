/**
 * matrix-grid — a 2×2 matrix as a machine that moves the whole plane. The
 * two columns of the matrix are drawn as arrows: the blue one is where the
 * arrow (1, 0) lands, the orange one is where (0, 1) lands (they are also
 * marked "1st" and "2nd", so that colour is not the only cue). A grid and a
 * letter F ride along, so that stretches, turns, shears and flips can be seen.
 * The learner sets the matrix by dragging the two arrow tips, or builds it up
 * by pressing buttons that each apply a fixed matrix after what is there.
 *
 * {
 *   type: 'matrix-grid',
 *   matrix: [[1, 0], [0, 1]],     // start, written as rows: [[a, b], [c, d]]. The columns are (a, c) and (b, d).
 *   range: 4,                     // the window runs from -range to range both ways
 *   drag: true,                   // the two arrow tips can be dragged (default true, unless there are moves)
 *   snap: 1,                      // tips snap to multiples of this
 *   shape: 'F',                   // 'F' | 'none'
 *   fit: 'big',                   // 'big': an F 1.2 wide and 2 tall standing on the origin; 'unit': a small F inside the unit square
 *   ghost: true,                  // a thin outline of the F before the matrix acts
 *   square: false,                // shade the image of the unit square (the parallelogram spanned by the two arrows)
 *   pre: [[2, 0], [0, 1]],        // a matrix that has already moved the F (drawn in grey); the learner's matrix acts after it
 *   target: [[0, -1], [1, 0]],    // dashed outline of the F where it should end up: the target matrix applied to the original F
 *   moves: [                      // buttons instead of dragging; each press applies its matrix AFTER everything so far
 *     { id: 'turn', label: 'Turn', matrix: [[0, -1], [1, 0]] },
 *   ],
 *   maxMoves: 6,
 *   readouts: ['area', 'facing', 'det'],   // 'area' of the shaded shape, 'facing' (right way round / mirrored / flat), 'det'
 *   showMatrix: true,             // the matrix, with coloured columns, under the picture
 *   static: false,                // true: a picture, nothing moves
 * }
 *
 * State: { a, b, c, d,            the learner's matrix [[a, b], [c, d]]
 *          det, area, flipped, flat,
 *                                 its determinant ad − bc, |det|, det < 0, det = 0
 *          applied: ['turn', …],  with moves: the buttons pressed, in order
 *          total: { a, b, c, d }, the learner's matrix times `pre` (equal to the matrix itself without `pre`)
 *          match }                with target: true when `total` equals the target matrix
 *
 * setState accepts { a, b, c, d } or, with moves, { applied: [...] }.
 */
import { frame, handle, readout, button, loop, hue, s, h, clamp, snapTo, tidy, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('matrix-grid', `
  .widget-matrix-grid .mg-line { display: grid; gap: 2px; justify-items: center; text-align: center; min-height: 3.1em; align-content: center; font-size: var(--fs-md); }
  .widget-matrix-grid .mg-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 700; min-height: 1.4em; }
  .widget-matrix-grid .mg-line:empty { display: none; }
`);

let clipSeq = 0;

// A blocky letter F on a 3 × 5 board of cells, as an outline.
const F_CELLS = [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [1, 3], [1, 4], [3, 4], [3, 5], [0, 5]];

const fmt = (v) => String(tidy(Math.round(v * 100) / 100));
const txt = (v) => fmt(v).replace('-', '−');
const rows = (m, fallback) => (Array.isArray(m) && m.length === 2 && m.every((r) => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite))
  ? { a: m[0][0], b: m[0][1], c: m[1][0], d: m[1][1] } : fallback);
/** p then q: the matrix of "first p, then q" is q·p. */
export const after = (q, p) => ({
  a: tidy(q.a * p.a + q.b * p.c), b: tidy(q.a * p.b + q.b * p.d),
  c: tidy(q.c * p.a + q.d * p.c), d: tidy(q.c * p.b + q.d * p.d),
});
const same = (p, q) => ['a', 'b', 'c', 'd'].every((key) => Math.abs(p[key] - q[key]) < 1e-9);
const ID = { a: 1, b: 0, c: 0, d: 1 };

export default function create(spec, env) {
  const R = Math.max(2, Number(spec.range) || 4);
  const snap = spec.snap || 1;
  const isStatic = !!spec.static || !!env.compact;
  const moves = Array.isArray(spec.moves) ? spec.moves.map((m) => ({ ...m, m: rows(m.matrix, ID) })) : null;
  const maxMoves = spec.maxMoves || 6;
  const canDrag = !isStatic && !moves && spec.drag !== false;
  const pre = spec.pre ? rows(spec.pre, null) : null;
  const target = spec.target ? rows(spec.target, null) : null;
  const shape = spec.shape === 'none' ? null : 'F';
  const unitFit = spec.fit === 'unit';
  const want = Array.isArray(spec.readouts) ? spec.readouts : [];
  let readOnly = !!env.readOnly;

  const start = rows(spec.matrix, ID);
  let M = { ...start };          // the learner's matrix
  let shown = { ...M };          // what is drawn (differs from M only while a move is animated)
  let applied = [];

  // A thumbnail (inside an answer option) is drawn on a smaller canvas, so that its lines stay bold when it is shown small.
  const W = env.compact ? 190 : 440;
  const H = W;
  const PAD = env.compact ? 5 : 14;
  const k = (W - 2 * PAD) / (2 * R);
  const sx = (v) => W / 2 + v * k;
  const sy = (v) => H / 2 - v * k;
  const ux = (px) => (px - W / 2) / k;
  const uy = (py) => (H / 2 - py) / k;
  const at = (m, x, y) => [m.a * x + m.b * y, m.c * x + m.d * y];

  const cell = unitFit ? 0.2 : 0.4;
  const shapePts = F_CELLS.map(([cx0, cy0]) => [cx0 * cell + (unitFit ? 0.2 : 0), cy0 * cell]);
  const poly = (m, pts) => pts.map(([x, y]) => { const [px, py] = at(m, x, y); return `${sx(px).toFixed(1)},${sy(py).toFixed(1)}`; }).join(' ');

  const facts = (m) => {
    const det = tidy(m.a * m.d - m.b * m.c);
    return { det, area: Math.abs(det), flipped: det < 0, flat: det === 0 };
  };
  const getState = () => {
    const total = pre ? after(M, pre) : { ...M };
    const out = { a: M.a, b: M.b, c: M.c, d: M.d, ...facts(M), total };
    if (moves) out.applied = applied.slice();
    if (target) out.match = same(total, target);
    return out;
  };

  /* ------------------------------------------------------------- layers */
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 480, label: spec.alt || 'A grid moved by a matrix' });
  const { svg } = fr;
  const clipId = `mg-clip-${++clipSeq}`;
  svg.appendChild(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: PAD, y: PAD, width: W - 2 * PAD, height: H - 2 * PAD }))));
  const gBack = s('g');
  const gMoved = s('g', { 'clip-path': `url(#${clipId})`, 'pointer-events': 'none' });
  const gNames = s('g', { 'pointer-events': 'none' });
  const gHandles = s('g');
  svg.append(gBack, gMoved, gNames, gHandles);

  // the plane before anything happens: a pale grid with numbered axes
  for (let v = -R; v <= R; v++) {
    gBack.appendChild(s('line.grid-line', { x1: sx(v), x2: sx(v), y1: sy(-R), y2: sy(R) }));
    gBack.appendChild(s('line.grid-line', { y1: sy(v), y2: sy(v), x1: sx(-R), x2: sx(R) }));
  }
  gBack.appendChild(s('line', { x1: sx(-R), x2: sx(R), y1: sy(0), y2: sy(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
  gBack.appendChild(s('line', { y1: sy(-R), y2: sy(R), x1: sx(0), x2: sx(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
  if (!env.compact) {
    const every = R > 5 ? 2 : 1;
    for (let v = -R + 1; v < R; v++) {
      if (v === 0 || v % every) continue;
      gBack.appendChild(s('text.tick-label', { x: sx(v), y: sy(0) + 15, 'text-anchor': 'middle' }, txt(v)));
      gBack.appendChild(s('text.tick-label', { x: sx(0) - 6, y: sy(v) + 4, 'text-anchor': 'end' }, txt(v)));
    }
  }

  const gridA = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 1.5, opacity: 0.45 });   // lines that run along the blue arrow
  const gridB = s('path', { fill: 'none', stroke: hue('orange'), 'stroke-width': 1.5, opacity: 0.45 }); // lines that run along the orange arrow
  const squareEl = spec.square ? s('polygon', { fill: hue('yellow', 'soft'), stroke: hue('yellow'), 'stroke-width': 2.5, 'stroke-linejoin': 'round', opacity: 0.9 }) : null;
  const ghostEl = shape && spec.ghost !== false && !pre ? s('polygon', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-linejoin': 'round', points: poly(ID, shapePts) }) : null;
  const preEl = shape && pre ? s('polygon', { fill: hue('gray', 'soft'), stroke: hue('gray'), 'stroke-width': 2, 'stroke-linejoin': 'round', points: poly(pre, shapePts) }) : null;
  const shapeEl = shape ? s('polygon', { fill: hue('violet', 'soft'), stroke: hue('violet'), 'stroke-width': 2.5, 'stroke-linejoin': 'round', opacity: 0.92 }) : null;
  const targetEl = shape && target ? s('polygon', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '7 6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', points: poly(target, shapePts) }) : null;
  gMoved.append(gridA, gridB);
  // the unit square before the matrix acts, so that "area 1" has something to point at
  if (spec.square) gMoved.appendChild(s('polygon', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4', points: poly(ID, [[0, 0], [1, 0], [1, 1], [0, 1]]) }));
  for (const el of [squareEl, ghostEl, preEl, shapeEl, targetEl]) if (el) gMoved.appendChild(el);

  // Each arrow carries a small "1st" or "2nd" beyond its tip (which column of the matrix it is),
  // so that the two can be told apart without relying on their colours.
  const arrow = (color, word) => {
    const line = s('line', { stroke: hue(color), 'stroke-width': 4.5, 'stroke-linecap': 'round' });
    const tip = s('path', { fill: hue(color) });
    gMoved.append(line, tip);
    const name = env.compact ? null : s('text', { class: 'fig-label-sm', style: `fill:${hue(color, 'text')}` }, word);
    if (name) gNames.appendChild(name);
    return (x, y) => {
      const px = sx(x) - sx(0);
      const py = sy(y) - sy(0);
      const len = Math.hypot(px, py);
      if (name) {
        const nx = len < 3 ? 0 : px / len;
        const ny = len < 3 ? -1 : py / len;
        const gap = canDrag ? 22 : 13;
        const inside = Math.abs(x) <= R + 1e-9 && Math.abs(y) <= R + 1e-9;
        name.setAttribute('visibility', inside ? 'visible' : 'hidden');
        name.setAttribute('x', clamp(sx(x) + nx * gap, 14, W - 14).toFixed(1));
        name.setAttribute('y', clamp(sy(y) + ny * gap + 4, 14, H - 6).toFixed(1));
        name.setAttribute('text-anchor', nx > 0.4 ? 'start' : nx < -0.4 ? 'end' : 'middle');
      }
      if (len < 3) { line.setAttribute('visibility', 'hidden'); tip.setAttribute('visibility', 'hidden'); return; }
      line.removeAttribute('visibility'); tip.removeAttribute('visibility');
      const ex = px / len;
      const ey = py / len;
      const hl = Math.min(canDrag ? 19 : 14, len * 0.7);
      const hw = hl * 0.5;
      const bx = sx(x) - ex * hl;
      const by = sy(y) - ey * hl;
      line.setAttribute('x1', sx(0)); line.setAttribute('y1', sy(0));
      line.setAttribute('x2', (bx + ex * 2).toFixed(1)); line.setAttribute('y2', (by + ey * 2).toFixed(1));
      tip.setAttribute('d', `M${sx(x).toFixed(1)} ${sy(y).toFixed(1)}L${(bx - ey * hw).toFixed(1)} ${(by + ex * hw).toFixed(1)}L${(bx + ey * hw).toFixed(1)} ${(by - ex * hw).toFixed(1)}Z`);
    };
  };
  const drawBlue = arrow('blue', '1st');
  const drawOrange = arrow('orange', '2nd');

  /* ----------------------------------------------- text under the picture */
  const line = h('div.mg-line');
  const showLine = !env.compact && spec.showMatrix !== false;
  if (showLine) fr.el.insertBefore(line, fr.readouts);
  const ro = {};
  if (!env.compact) {
    if (want.includes('area')) ro.area = readout('area of the yellow shape', { digits: 2 });
    if (want.includes('facing')) { ro.facing = readout('the F is', {}); ro.facing.el.querySelector('b').style.fontFamily = 'inherit'; }
    if (want.includes('det')) ro.det = readout('determinant', { digits: 2 });
    for (const r of Object.values(ro)) fr.readouts.appendChild(r.el);
  }

  /* ------------------------------------------------------------- drawing */
  function draw() {
    const m = shown;
    const N = 3 * R + 2;
    let dA = '';
    let dB = '';
    for (let i = -N; i <= N; i++) {
      const [x1, y1] = at(m, -N, i);
      const [x2, y2] = at(m, N, i);
      dA += `M${sx(x1).toFixed(1)} ${sy(y1).toFixed(1)}L${sx(x2).toFixed(1)} ${sy(y2).toFixed(1)}`;
      const [x3, y3] = at(m, i, -N);
      const [x4, y4] = at(m, i, N);
      dB += `M${sx(x3).toFixed(1)} ${sy(y3).toFixed(1)}L${sx(x4).toFixed(1)} ${sy(y4).toFixed(1)}`;
    }
    gridA.setAttribute('d', dA);
    gridB.setAttribute('d', dB);
    if (squareEl) squareEl.setAttribute('points', poly(m, [[0, 0], [1, 0], [1, 1], [0, 1]]));
    if (shapeEl) shapeEl.setAttribute('points', poly(pre ? after(m, pre) : m, shapePts));
    drawBlue(m.a, m.c);
    drawOrange(m.b, m.d);
  }

  function describe() {
    const f = facts(M);
    if (showLine) {
      const kids = [h('span', { html: mdInline(`$\\begin{pmatrix} \\blue{${fmt(M.a)}} & \\orange{${fmt(M.b)}} \\\\ \\blue{${fmt(M.c)}} & \\orange{${fmt(M.d)}} \\end{pmatrix}$`) })];
      if (moves) {
        const names = applied.map((id) => (moves.find((mv) => mv.id === id) || {}).label || id);
        kids.push(h('small', {}, names.length ? `Done so far: ${names.join(', then ')}` : 'Nothing done yet'));
      }
      line.replaceChildren(...kids);
    }
    if (ro.area) ro.area.set(f.area);
    if (ro.facing) ro.facing.set(f.flat ? 'squashed flat' : f.flipped ? 'mirrored' : 'the right way round');
    if (ro.det) { ro.det.set(f.det); ro.det.el.querySelector('b').style.color = f.det < 0 ? hue('red', 'text') : ''; }
    const st = getState();
    const bits = [`The blue arrow ends at ${txt(M.a)} across, ${txt(M.c)} up. The orange arrow ends at ${txt(M.b)} across, ${txt(M.d)} up.`];
    if (shape) bits.push(f.flat ? 'The F is squashed onto a line.' : f.flipped ? 'The F is mirrored.' : 'The F is the right way round.');
    if (spec.square) bits.push(`The unit square has become a shape of area ${txt(f.area)}.`);
    if (target) bits.push(st.match ? 'The F sits on the dashed outline.' : 'The F is not on the dashed outline.');
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${bits.join(' ')}`);
  }

  let handles = [];
  function placeHandles() {
    if (!handles.length) return;
    handles[0].set(sx(M.a), sy(M.c));
    handles[0].setLabel(`${txt(M.a)} across, ${txt(M.c)} up`);
    handles[1].set(sx(M.b), sy(M.d));
    handles[1].setLabel(`${txt(M.b)} across, ${txt(M.d)} up`);
  }
  function render() { shown = { ...M }; draw(); placeHandles(); describe(); }

  /* -------------------------------------------------------------- inputs */
  if (canDrag) {
    const lim = Math.floor(R / snap + 1e-9) * snap;
    const fit = (v) => tidy(clamp(snapTo(v, snap), -lim, lim));
    const make = (color, label, set) => handle(svg, {
      r: 7, color, label, keyStep: k * snap,
      onMove(px, py) {
        if (readOnly) return;
        const x = fit(ux(px));
        const y = fit(uy(py));
        if (!set(x, y)) return;
        play('tap');
        render();
        env.onChange(getState());
      },
    });
    handles = [
      make('blue', 'Tip of the blue arrow, the first column', (x, y) => { if (x === M.a && y === M.c) return false; M.a = x; M.c = y; return true; }),
      make('orange', 'Tip of the orange arrow, the second column', (x, y) => { if (x === M.b && y === M.d) return false; M.b = x; M.d = y; return true; }),
    ];
    gHandles.append(handles[0].el, handles[1].el);
  }

  // moves: glide from the old matrix to the new one. A pure turn is shown as a turn
  // (the picture swings round at full size); everything else slides in straight lines.
  let from = null;
  let swing = null;   // the angle of the move when it is a pure turn
  let t = 1;
  const anim = loop((dt) => {
    t = Math.min(1, t + dt / 0.45);
    const e = t * t * (3 - 2 * t);
    if (swing != null) {
      const cos = Math.cos(swing * e);
      const sin = Math.sin(swing * e);
      shown = after({ a: cos, b: -sin, c: sin, d: cos }, from);
    } else {
      shown = { a: from.a + (M.a - from.a) * e, b: from.b + (M.b - from.b) * e, c: from.c + (M.c - from.c) * e, d: from.d + (M.d - from.d) * e };
    }
    draw();
    if (t >= 1) { anim.stop(); shown = { ...M }; draw(); }
  });
  function glide(old, move = null) {
    describe();
    if (reducedMotion()) { render(); return; }
    const turn = move && Math.abs(move.a - move.d) < 1e-9 && Math.abs(move.b + move.c) < 1e-9 && Math.abs(move.a * move.a + move.c * move.c - 1) < 1e-9;
    swing = turn ? Math.atan2(move.c, move.a) : null;
    from = old; t = 0; anim.start();
  }
  if (moves && !isStatic) {
    for (const mv of moves) {
      fr.buttons.appendChild(button(mv.label, () => {
        if (readOnly) return;
        if (applied.length >= maxMoves) { env.announce('That is as many moves as fit. Press Start again.'); return; }
        const old = { ...M };   // a press in mid-glide starts from where the last move was heading
        applied.push(mv.id);
        M = after(mv.m, M);
        play('tap');
        glide(old, mv.m);
        env.announce(`${mv.label} done.`);
        env.onChange(getState());
      }));
    }
    fr.buttons.appendChild(button('Start again', () => {
      if (readOnly || !applied.length) return;
      const old = { ...shown };
      applied = [];
      M = { ...start };
      glide(old);
      env.onChange(getState());
    }, { icon: 'reset' }));
  }

  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (moves && Array.isArray(next.applied)) {
        applied = next.applied.filter((id) => moves.some((mv) => mv.id === id)).slice(0, maxMoves);
        M = applied.reduce((acc, id) => after(moves.find((mv) => mv.id === id).m, acc), { ...start });
      } else {
        const m = next.matrix ? rows(next.matrix, M) : next;
        for (const key of ['a', 'b', 'c', 'd']) if (Number.isFinite(m[key])) M[key] = tidy(m[key]);
        if (moves) applied = [];
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const hd of handles) hd.setEnabled(!readOnly);
    },
    destroy() { anim.stop(); for (const hd of handles) hd.destroy(); },
  };
}

export const examples = [
  { title: 'matrix-grid — drag the two columns', spec: { type: 'matrix-grid', matrix: [[1, 1], [0, 1]] } },
  { title: 'matrix-grid — moves and a target outline', spec: { type: 'matrix-grid', moves: [{ id: 'turn', label: 'Quarter turn', matrix: [[0, -1], [1, 0]] }, { id: 'shear', label: 'Shear', matrix: [[1, 1], [0, 1]] }], target: [[0, -1], [1, 1]] } },
  { title: 'matrix-grid — the unit square and its area', spec: { type: 'matrix-grid', range: 5, matrix: [[3, 1], [1, 2]], fit: 'unit', square: true, readouts: ['area', 'facing', 'det'] } },
];
