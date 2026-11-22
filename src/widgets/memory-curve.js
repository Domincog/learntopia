/**
 * memory-curve — the forgetting curve as a toy you can play with.
 * Recall probability decays over time; each review snaps it back to 100%
 * and makes the next decay slower. The later (harder) the review, the bigger
 * the boost — the idea behind spaced repetition.
 *
 * {
 *   type: 'memory-curve',
 *   days: 30,             // length of the timeline
 *   strength: 1,          // starting memory strength (days until recall falls to 90%)
 *   reviews: [3],         // review days already placed
 *   editable: true,       // tap the chart to add a review, tap a marker to remove it, drag to move
 *   budget: 3,            // max number of reviews (omit for unlimited)
 *   threshold: 0.7,       // draw a "keep it above this" line
 * }
 *
 * State: { reviews: [days…], lowest, final, ok }
 *   lowest — the minimum recall probability over the whole timeline (0–1)
 *   final  — recall at the last day
 *   ok     — true if recall never dropped below the threshold
 *
 * The model is deliberately simple (exponential decay; boost grows with how
 * much had been forgotten). It is a teaching model, not the app's scheduler.
 */
import { frame, plane, drawAxes, handle, readout, button, hue, s, h, clamp, tidy, svgPoint } from './kit.js';
import { play } from '../core/audio.js';

/** Recall after `t` days for strength S. */
const recall = (t, S) => Math.pow(0.9, t / S);
/** Strength after a review made when recall was R. */
const boosted = (S, R) => S * (1 + 3 * Math.pow(Math.max(0, 1 - R), 0.6));

export function simulate(reviews, days, strength) {
  const pts = [];
  let S = strength;
  let last = 0;
  let lowest = 1;
  const sorted = reviews.slice().sort((a, b) => a - b);
  const segments = [];
  for (const day of [...sorted, days]) {
    segments.push({ from: last, to: day, S });
    const R = recall(day - last, S);
    lowest = Math.min(lowest, R);
    if (day < days || sorted.includes(days)) { S = boosted(S, R); }
    last = day;
  }
  for (const seg of segments) {
    const n = Math.max(2, Math.ceil((seg.to - seg.from) * 4));
    for (let i = 0; i <= n; i++) {
      const t = seg.from + ((seg.to - seg.from) * i) / n;
      pts.push({ t, r: recall(t - seg.from, seg.S), start: i === 0 });
    }
  }
  const lastSeg = segments[segments.length - 1];
  return { pts, lowest, final: recall(lastSeg.to - lastSeg.from, lastSeg.S), strength: S, segments };
}

export default function create(spec, env) {
  const days = spec.days || 30;
  const strength = spec.strength || 1;
  const budget = spec.budget != null ? spec.budget : Infinity;
  const threshold = spec.threshold != null ? spec.threshold : null;
  const editable = spec.editable !== false && !env.compact;
  let readOnly = !!env.readOnly;
  let reviews = (spec.reviews || []).slice().sort((a, b) => a - b);

  const width = 560;
  const height = env.compact ? 240 : 320;
  const fr = frame({ width, height, compact: env.compact, label: spec.alt || 'Forgetting curve' });
  const { svg } = fr;
  const pl = plane({ x: [0, days], y: [0, 1], width, height, pad: { l: 64, r: 18, t: 20, b: 38 } });
  svg.appendChild(drawAxes(pl, { xStep: days <= 14 ? 1 : 5, yStep: 0.25, yFormat: (v) => `${Math.round(v * 100)}%`, xLabel: 'days', grid: true }));
  const midY = (pl.top + pl.bottom) / 2;
  svg.appendChild(s('text.axis-label', { x: 14, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 14 ${midY})` }, 'chance of recall'));

  const zone = threshold != null ? s('rect', { x: pl.left, y: pl.sy(threshold), width: pl.iw, height: pl.sy(0) - pl.sy(threshold), fill: hue('red', 'soft'), opacity: 0.55 }) : null;
  const thLine = threshold != null ? s('line', { x1: pl.left, x2: pl.right, y1: pl.sy(threshold), y2: pl.sy(threshold), stroke: hue('red'), 'stroke-width': 2, 'stroke-dasharray': '6 5' }) : null;
  if (zone) svg.append(zone, thLine, s('text.fig-label-sm', { x: pl.right - 4, y: pl.sy(threshold) + 14, 'text-anchor': 'end', style: `fill:${hue('red', 'text')}` }, `${Math.round(threshold * 100)}% line`));

  const area = s('path', { fill: hue('blue', 'soft'), opacity: 0.7, stroke: 'none' });
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  const jumps = s('g');
  const gHandles = s('g');
  const hit = s('rect', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih, fill: 'transparent', style: editable ? 'cursor:copy' : null });
  svg.append(area, curve, jumps, hit, gHandles);

  const roLowest = readout('lowest point', { digits: 0, unit: '%' });
  const roFinal = readout(`day ${days}`, { digits: 0, unit: '%' });
  const roCount = readout('reviews', { digits: 0 });
  if (!env.compact) fr.readouts.append(roCount.el, roLowest.el, roFinal.el);

  let handles = [];

  function tryAdd(day) {
    if (readOnly || !editable) return;
    const d = clamp(Math.round(day), 1, days - 1);
    if (reviews.includes(d)) return;
    if (reviews.length >= budget) { env.announce(`You have used all ${budget} reviews. Remove one first.`); fr.canvas.classList.remove('shake'); void fr.canvas.offsetWidth; fr.canvas.classList.add('shake'); return; }
    reviews = [...reviews, d].sort((a, b) => a - b);
    play('drop');
    rebuild();
    env.onChange(getState());
  }
  function removeAt(day) {
    if (readOnly || !editable) return;
    reviews = reviews.filter((d) => d !== day);
    play('pop');
    rebuild();
    env.onChange(getState());
  }

  hit.addEventListener('click', (ev) => { const p = svgPoint(svg, ev); tryAdd(pl.ux(p.x)); });

  function rebuild() {
    handles.forEach((hd) => hd.destroy());
    handles = [];
    while (gHandles.firstChild) gHandles.removeChild(gHandles.firstChild);
    if (editable) {
      reviews.forEach((day) => {
        let current = day;
        let moved = false;
        const hd = handle(svg, {
          x: pl.sx(day), y: pl.sy(1), color: 'orange', r: 9,
          label: 'Review day. Arrow keys move it, Delete removes it.',
          keyStep: pl.kx,
          onMove: (px) => {
            if (readOnly) return;
            const d = clamp(Math.round(pl.ux(px)), 1, days - 1);
            if (d === current || reviews.includes(d)) return;
            reviews = reviews.map((v) => (v === current ? d : v)).sort((a, b) => a - b);
            current = d;
            moved = true;
            hd.set(pl.sx(d), pl.sy(1));
            hd.setLabel(`day ${d}`);
            draw();
            env.onChange(getState());
          },
          onEnd: () => { if (moved) rebuild(); },
        });
        hd.el.addEventListener('click', () => { if (!moved) removeAt(current); moved = false; });
        hd.el.addEventListener('keydown', (ev) => { if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); removeAt(current); } });
        hd.setLabel(`day ${day}`);
        gHandles.appendChild(hd.el);
        handles.push(hd);
      });
    }
    draw();
  }

  function draw() {
    const sim = simulate(reviews, days, strength);
    let d = '';
    for (const p of sim.pts) d += `${p.start ? 'M' : 'L'}${pl.sx(p.t).toFixed(1)} ${pl.sy(p.r).toFixed(1)}`;
    curve.setAttribute('d', d);
    let a = `M${pl.sx(0)} ${pl.sy(0)}`;
    for (const p of sim.pts) a += `L${pl.sx(p.t).toFixed(1)} ${pl.sy(p.r).toFixed(1)}`;
    area.setAttribute('d', `${a}L${pl.sx(days)} ${pl.sy(0)}Z`);
    while (jumps.firstChild) jumps.removeChild(jumps.firstChild);
    for (let i = 1; i < sim.segments.length; i++) {
      const seg = sim.segments[i];
      const prev = sim.segments[i - 1];
      const before = recall(prev.to - prev.from, prev.S);
      jumps.appendChild(s('line', { x1: pl.sx(seg.from), x2: pl.sx(seg.from), y1: pl.sy(before), y2: pl.sy(1), stroke: hue('orange'), 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
      if (!editable) jumps.appendChild(s('circle', { cx: pl.sx(seg.from), cy: pl.sy(1), r: 6, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
    }
    roLowest.set(Math.round(sim.lowest * 100));
    roFinal.set(Math.round(sim.final * 100));
    roCount.set(Number.isFinite(budget) ? `${reviews.length} of ${budget}` : reviews.length);
    if (zone) curve.setAttribute('stroke', threshold != null && sim.lowest < threshold ? hue('red') : hue('blue'));
  }

  function getState() {
    const sim = simulate(reviews, days, strength);
    return {
      reviews: reviews.slice(),
      lowest: tidy(sim.lowest, 4),
      final: tidy(sim.final, 4),
      ok: threshold == null ? true : sim.lowest >= threshold,
    };
  }

  if (editable) {
    fr.buttons.append(
      button('Add a review', () => {
        // drop it in the middle of the longest unreviewed stretch
        const marks = [0, ...reviews, days];
        let best = 1;
        let gap = -1;
        for (let i = 1; i < marks.length; i++) if (marks[i] - marks[i - 1] > gap) { gap = marks[i] - marks[i - 1]; best = Math.round((marks[i] + marks[i - 1]) / 2); }
        tryAdd(best);
      }, { icon: 'plus' }),
      button('Clear', () => { if (readOnly) return; reviews = []; rebuild(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' }),
    );
    fr.el.appendChild(h('p.w-hint', 'Tap the chart to add a review. Drag a dot to move it; tap it to remove.'));
  }

  rebuild();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.reviews)) return;
      reviews = next.reviews.slice().sort((a, b) => a - b);
      rebuild();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); handles.forEach((hd) => hd.setEnabled(!readOnly)); },
    destroy() { handles.forEach((hd) => hd.destroy()); },
  };
}
