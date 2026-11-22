/**
 * neuron-lab — one artificial neuron and the examples it has to sort.
 * The neuron works out  score = w1 × (first input) + w2 × (second input) + bias
 * and answers "yes" when the score is above zero. On a plane that is a
 * straight line with a "yes" side — and the learner moves it with three knobs.
 *
 * {
 *   type: 'neuron-lab',
 *   points: [[8.5, 4, 1], [1.5, 2, 0]],       // examples: [first input, second input, class 0 or 1]
 *   x: [0, 10], y: [0, 10],                   // window
 *   xLabel: 'sweetness', yLabel: 'softness',  // names of the two inputs
 *   classes: ['unripe', 'ripe'],              // names of class 0 and class 1 (class 1 is the neuron's "yes")
 *   w1: { min: -2, max: 2, step: 0.5, value: 1 },
 *   w2: { min: -2, max: 2, step: 0.5, value: 1 },
 *   b:  { min: -20, max: 20, step: 1, value: 0 },
 *   lock: ['w1', 'w2'],                       // knobs that are shown but cannot be moved (lock all three: no knobs)
 *   line: true,                               // false: only the examples (no neuron, no knobs)
 *   formula: true,                            // show the live weighted sum
 *   probe: { x: 6, y: 5, drag: true },        // a test point; its score is worked out live
 * }
 *
 * State: { w1, w2, b, correct, total, accuracy, separated, swapped, best, probe }
 *   correct / total — examples on the right side of the line
 *   separated       — every example is on its right side
 *   swapped         — every example is on the wrong side (the line is fine, its "yes" side is not)
 *   best            — the largest `correct` reached so far
 *   probe           — { x, y, score, yes } when the spec has a probe
 *
 * Class 1 is drawn as circles, class 0 as squares; the "yes" side is tinted
 * and striped, so nothing depends on colour alone.
 */
import { frame, plane, drawAxes, handle, sliderRow, readout, clipTo, hue, s, h, clamp, tidy, snapTo, formatNumber, addStyles } from './kit.js';

addStyles('neuron-lab', `
  .widget-neuron-lab .w-neuron-formula {
    justify-self: center;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-wrap: balance;
  }
  .widget-neuron-lab .w-neuron-formula small { display: block; font-size: var(--fs-sm); font-weight: 600; color: var(--ink-2); }
  .widget-neuron-lab .w-neuron-formula .is-w1 { color: var(--teal-text); }
  .widget-neuron-lab .w-neuron-formula .is-w2 { color: var(--violet-text); }
  .widget-neuron-lab .w-neuron-formula .is-b { color: var(--pink-text); }
  .widget-neuron-lab .w-slider { grid-template-columns: minmax(0, 9.5em) minmax(0, 1fr) 2.8em; }
  .widget-neuron-lab .w-slider.is-locked { opacity: 0.55; }
  .widget-neuron-lab .w-neuron-key { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s3); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-neuron-lab .w-neuron-key span { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-neuron-lab .w-neuron-key svg { flex: none; }
`);

const W = 560;
let patternSeq = 0;

/** Keep the part of a polygon where a·x + b·y + c has the given sign (Sutherland–Hodgman). */
function clipHalf(poly, a, b, c, positive) {
  const val = (p) => (a * p[0] + b * p[1] + c) * (positive ? 1 : -1);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const vp = val(p);
    const vq = val(q);
    if (vp >= 0) out.push(p);
    if ((vp >= 0) !== (vq >= 0)) {
      const t = vp / (vp - vq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

export default function create(spec, env) {
  const pts = (spec.points || []).map((p) => ({ x: Number(p[0]), y: Number(p[1]), c: p[2] ? 1 : 0 }));
  const classes = spec.classes || ['no', 'yes'];
  const colors = spec.colors || ['blue', 'orange'];
  const xName = spec.xLabel || 'input 1';
  const yName = spec.yLabel || 'input 2';
  const showLine = spec.line !== false;
  const interactive = showLine && !env.compact && !spec.static;
  const locked = new Set(spec.lock || []);
  const defs = {
    w1: { min: -2, max: 2, step: 0.5, value: 1, ...(spec.w1 || {}) },
    w2: { min: -2, max: 2, step: 0.5, value: 1, ...(spec.w2 || {}) },
    b: { min: -20, max: 20, step: 1, value: 0, ...(spec.b || {}) },
  };
  let readOnly = !!env.readOnly;
  const st = { w1: defs.w1.value, w2: defs.w2.value, b: defs.b.value };
  let best = 0;
  const probe = spec.probe ? { x: spec.probe.x, y: spec.probe.y } : null;

  const score = (x, y) => st.w1 * x + st.w2 * y + st.b;
  const tally = () => {
    let correct = 0;
    for (const p of pts) if ((score(p.x, p.y) > 1e-9) === (p.c === 1)) correct += 1;
    return correct;
  };

  /* -------------------------------------------------------------- plot */
  const height = env.compact ? 400 : 420;
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'Examples of two kinds on a plane' });
  const { svg } = fr;
  const xWin = spec.x || [0, 10];
  const yWin = spec.y || [0, 10];
  const pl = plane({ x: xWin, y: yWin, width: W, height, pad: env.compact ? { l: 14, r: 14, t: 14, b: 14 } : { l: 58, r: 18, t: 22, b: 58 } });
  const clip = clipTo(svg, pl);

  // stripes mark the "yes" side so that it does not depend on colour alone
  const patId = `w-neuron-stripes-${++patternSeq}`;
  svg.querySelector('defs').appendChild(s('pattern', { id: patId, width: 12, height: 12, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
    s('line', { x1: 0, y1: 0, x2: 0, y2: 12, stroke: hue(colors[1]), 'stroke-width': 5, opacity: 0.3 })));

  const yesFill = s('path', { fill: hue(colors[1], 'soft'), stroke: 'none' });
  const yesStripes = s('path', { fill: `url(#${patId})`, stroke: 'none' });
  const noFill = s('path', { fill: hue(colors[0], 'soft'), stroke: 'none' });
  const gRegions = s('g', { 'clip-path': clip, opacity: 0.9 }, noFill, yesFill, yesStripes);
  svg.appendChild(gRegions);
  svg.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep, labels: !env.compact, box: env.compact }));
  const midY = (pl.top + pl.bottom) / 2;
  if (!env.compact) {
    svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: height - 9, 'text-anchor': 'middle' }, xName));
    svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, yName));
  }
  const boundary = s('line', { stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round', 'clip-path': clip });
  const gRings = s('g');
  const gPts = s('g');
  svg.append(boundary, gRings, gPts);

  const rings = pts.map((p) => {
    const ring = s('circle', { cx: pl.sx(p.x), cy: pl.sy(p.y), r: 14, fill: 'none', stroke: hue('red'), 'stroke-width': 3.5 });
    gRings.appendChild(ring);
    const px = pl.sx(p.x);
    const py = pl.sy(p.y);
    gPts.appendChild(p.c === 1
      ? s('circle', { cx: px, cy: py, r: 7.5, fill: hue(colors[1]), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 })
      : s('rect', { x: px - 6.5, y: py - 6.5, width: 13, height: 13, rx: 2.5, fill: hue(colors[0]), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
    return ring;
  });

  /* ------------------------------------------------------------- probe */
  let probeHandle = null;
  let probeMark = null;
  const probeLabel = s('text.fig-label', { 'text-anchor': 'start' });
  if (probe) {
    const draggable = !!spec.probe.drag && interactive;
    if (draggable) {
      const snap = spec.probe.snap || 0.5;
      probeHandle = handle(svg, {
        color: 'pink', shape: 'square', r: 9, label: 'Test point. Drag it to see its score change.',
        keyStep: snap * Math.sqrt(pl.kx * pl.ky),     // one arrow press = one snap step, across or up
        onMove: (px, py) => {
          if (readOnly) return;
          const nx = tidy(clamp(snapTo(pl.ux(px), snap), xWin[0], xWin[1]));
          const ny = tidy(clamp(snapTo(pl.uy(py), snap), yWin[0], yWin[1]));
          if (nx === probe.x && ny === probe.y) return;
          probe.x = nx;
          probe.y = ny;
          render();
          env.onChange(getState());
        },
      });
      // the figure is scaled down on phones: widen the hit area so that it stays at least 40 px across
      probeHandle.el.insertBefore(s('circle', { r: 36, fill: 'transparent' }), probeHandle.el.firstChild);
      const dot = probeHandle.el.querySelector('.w-handle-dot');
      if (dot) dot.setAttribute('transform', 'rotate(45)');     // a diamond, like the fixed marker
      svg.appendChild(probeHandle.el);
    } else {
      probeMark = s('rect', { width: 17, height: 17, rx: 3, fill: hue('pink'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
      svg.appendChild(probeMark);
    }
    svg.appendChild(probeLabel);
  }

  /* ---------------------------------------------------------- controls */
  const formula = h('div.w-neuron-formula');
  if (showLine && !env.compact && spec.formula !== false) fr.el.insertBefore(formula, fr.buttons);
  const roCorrect = readout('sorted correctly', { digits: 0 });
  if (showLine && !env.compact && pts.length) fr.readouts.appendChild(roCorrect.el);

  const sliders = {};
  const allLocked = ['w1', 'w2', 'b'].every((key) => locked.has(key));   // nothing to adjust: leave the knobs out
  if (interactive && !allLocked) {
    const labels = { w1: `weight: ${xName}`, w2: `weight: ${yName}`, b: 'bias' };
    const tint = { w1: 'teal', w2: 'violet', b: 'pink' };
    for (const key of ['w1', 'w2', 'b']) {
      const d = defs[key];
      sliders[key] = sliderRow({
        label: d.label || labels[key], min: d.min, max: d.max, step: d.step, value: st[key], color: tint[key],
        onInput: (v) => { if (locked.has(key)) return; st[key] = v; render(); env.onChange(getState()); },
      });
      if (locked.has(key)) { sliders[key].setDisabled(true); sliders[key].el.classList.add('is-locked'); }
      fr.controls.appendChild(sliders[key].el);
    }
  }

  if (!env.compact && pts.length) {
    const dot = (inner) => { const el = s('svg', { width: 18, height: 18, viewBox: '0 0 18 18', 'aria-hidden': 'true' }); el.appendChild(inner); return el; };
    const key = h('div.w-neuron-key',
      h('span', dot(s('circle', { cx: 9, cy: 9, r: 6, fill: hue(colors[1]), stroke: 'var(--edge-strong)', 'stroke-width': 2 })), classes[1]),
      h('span', dot(s('rect', { x: 3.5, y: 3.5, width: 11, height: 11, rx: 2, fill: hue(colors[0]), stroke: 'var(--edge-strong)', 'stroke-width': 2 })), classes[0]),
      showLine ? h('span', dot(s('rect', { x: 2, y: 2, width: 14, height: 14, rx: 3, fill: `url(#${patId})`, stroke: hue(colors[1]), 'stroke-width': 2 })), `says “${classes[1]}”`) : null,
      showLine ? h('span', dot(s('circle', { cx: 9, cy: 9, r: 6.5, fill: 'none', stroke: hue('red'), 'stroke-width': 3 })), 'wrong side') : null,
    );
    fr.el.insertBefore(key, fr.canvas.nextSibling);
  }

  /* ------------------------------------------------------------ render */
  const num = (v) => formatNumber(v, 2);
  const signed = (v, first) => (first ? num(v) : `${v < 0 ? '−' : '+'} ${num(Math.abs(v))}`);
  const toPath = (poly) => (poly.length < 3 ? '' : `${poly.map((p, i) => `${i ? 'L' : 'M'}${pl.sx(p[0]).toFixed(1)} ${pl.sy(p[1]).toFixed(1)}`).join('')}Z`);

  function render() {
    const rect = [[xWin[0], yWin[0]], [xWin[1], yWin[0]], [xWin[1], yWin[1]], [xWin[0], yWin[1]]];
    if (showLine) {
      const flat = Math.abs(st.w1) < 1e-9 && Math.abs(st.w2) < 1e-9;
      const yes = flat ? (st.b > 0 ? rect : []) : clipHalf(rect, st.w1, st.w2, st.b, true);
      const no = flat ? (st.b > 0 ? [] : rect) : clipHalf(rect, st.w1, st.w2, st.b, false);
      yesFill.setAttribute('d', toPath(yes));
      yesStripes.setAttribute('d', toPath(yes));
      noFill.setAttribute('d', toPath(no));
      // the line itself: two far-apart points on w1·x + w2·y + b = 0
      if (flat) boundary.setAttribute('visibility', 'hidden');
      else {
        const len = Math.hypot(st.w1, st.w2);
        const cx = (-st.b * st.w1) / (len * len);
        const cy = (-st.b * st.w2) / (len * len);
        const dx = -st.w2 / len;
        const dy = st.w1 / len;
        const far = (xWin[1] - xWin[0]) + (yWin[1] - yWin[0]) + Math.abs(cx) + Math.abs(cy);
        boundary.setAttribute('x1', pl.sx(cx - dx * far)); boundary.setAttribute('y1', pl.sy(cy - dy * far));
        boundary.setAttribute('x2', pl.sx(cx + dx * far)); boundary.setAttribute('y2', pl.sy(cy + dy * far));
        boundary.setAttribute('visibility', 'visible');
      }
    } else {
      gRegions.setAttribute('visibility', 'hidden');
      boundary.setAttribute('visibility', 'hidden');
    }

    let correct = 0;
    pts.forEach((p, i) => {
      const ok = (score(p.x, p.y) > 1e-9) === (p.c === 1);
      if (ok) correct += 1;
      rings[i].style.display = showLine && !ok ? '' : 'none';
    });
    best = Math.max(best, correct);
    roCorrect.set(`${correct} of ${pts.length}`);

    if (probe) {
      const px = pl.sx(probe.x);
      const py = pl.sy(probe.y);
      if (probeHandle) { probeHandle.set(px, py); probeHandle.setLabel(`${xName} ${num(probe.x)}, ${yName} ${num(probe.y)}`); } else { probeMark.setAttribute('x', px - 8.5); probeMark.setAttribute('y', py - 8.5); probeMark.setAttribute('transform', `rotate(45 ${px} ${py})`); }
      const sc = score(probe.x, probe.y);
      probeLabel.textContent = showLine ? `score ${num(sc)}` : (spec.probe.label || '?');
      if (!showLine) probeLabel.setAttribute('class', 'fig-label-lg');
      const right = px < pl.right - 120;
      probeLabel.setAttribute('x', px + (right ? 17 : -17));
      probeLabel.setAttribute('text-anchor', right ? 'start' : 'end');
      probeLabel.setAttribute('y', py - 14 < pl.top + 14 ? py + 26 : py - 12);
    }

    if (showLine) {
      const general = `score = <span class="is-w1">${num(st.w1)}</span> × ${xName} ${st.w2 < 0 ? '−' : '+'} <span class="is-w2">${num(Math.abs(st.w2))}</span> × ${yName} ${st.b < 0 ? '−' : '+'} <span class="is-b">${num(Math.abs(st.b))}</span>`;
      if (probe) {
        const sc = score(probe.x, probe.y);
        formula.innerHTML = `<span class="is-w1">${num(st.w1)}</span> × ${num(probe.x)} ${st.w2 < 0 ? '−' : '+'} <span class="is-w2">${num(Math.abs(st.w2))}</span> × ${num(probe.y)} ${st.b < 0 ? '−' : '+'} <span class="is-b">${num(Math.abs(st.b))}</span> = ${num(sc)}` +
          `<small>score ${sc > 1e-9 ? 'above 0' : 'not above 0'}, so the neuron says “${classes[sc > 1e-9 ? 1 : 0]}”</small>`;
      } else {
        formula.innerHTML = `${general}<small>the neuron says “${classes[1]}” when the score is above 0</small>`;
      }
      svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Neuron: ${signed(st.w1, true)} times ${xName} ${signed(st.w2)} times ${yName} ${signed(st.b)}. ${correct} of ${pts.length} examples are on the right side of its line.`);
    }
  }

  function getState() {
    const correct = tally();
    const out = {
      w1: tidy(st.w1, 4), w2: tidy(st.w2, 4), b: tidy(st.b, 4),
      correct,
      total: pts.length,
      accuracy: pts.length ? tidy(correct / pts.length, 4) : 1,
      separated: correct === pts.length,
      swapped: pts.length > 0 && correct === 0,
      best: Math.max(best, correct),
    };
    if (probe) {
      const sc = score(probe.x, probe.y);
      out.probe = { x: probe.x, y: probe.y, score: tidy(sc, 4), yes: sc > 1e-9 };
    }
    return out;
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      for (const key of ['w1', 'w2', 'b']) {
        if (typeof next[key] === 'number') { st[key] = next[key]; if (sliders[key]) sliders[key].set(next[key]); }
      }
      if (probe && next.probe && typeof next.probe.x === 'number') { probe.x = next.probe.x; probe.y = typeof next.probe.y === 'number' ? next.probe.y : probe.y; }
      best = 0;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly || locked.has(key));
      if (probeHandle) probeHandle.setEnabled(!readOnly);
    },
    destroy() { if (probeHandle) probeHandle.destroy(); },
  };
}

const FRUIT = [
  [8.5, 4, 1], [7, 6.5, 1], [5.5, 8, 1], [9, 7, 1], [6.5, 9.2, 1], [4, 8.5, 1], [8, 8.5, 1], [9.3, 3, 1],
  [1.5, 2, 0], [3, 1.5, 0], [2, 4.5, 0], [4, 3, 0], [1, 6.5, 0], [5.5, 2, 0], [6.8, 1, 0], [3, 5, 0],
];

export const examples = [
  {
    title: 'neuron-lab — three knobs, one line',
    spec: { type: 'neuron-lab', points: FRUIT, xLabel: 'sweetness', yLabel: 'softness', classes: ['unripe', 'ripe'], w1: { value: 1 }, w2: { value: 0.5 }, b: { value: -6 } },
  },
  {
    title: 'neuron-lab — a test point whose score is worked out live',
    spec: { type: 'neuron-lab', points: FRUIT, xLabel: 'sweetness', yLabel: 'softness', classes: ['unripe', 'ripe'], w1: { value: 1 }, w2: { value: 1 }, b: { value: -10 }, lock: ['w1', 'w2', 'b'], probe: { x: 6, y: 7, drag: true } },
  },
];
