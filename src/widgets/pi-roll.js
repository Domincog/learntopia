/**
 * pi-roll — roll a wheel one full turn along a ruler and see how far it gets.
 * The rim "unrolls" onto the ground as an orange trail, and sticks as long as
 * the wheel's diameter are laid next to it: the trail is always three
 * diameters and a bit (π ≈ 3.14), whatever the size of the wheel.
 *
 * {
 *   type: 'pi-roll',
 *   d: 1,                    // diameter of the wheel (ruler units)
 *   min: 1, max: 3, step: 0.5,   // range of the diameter slider
 *   turns: 0,                // how far the wheel has rolled: 0 … 1 full turn
 *   sizeSlider: true,        // show the diameter slider
 *   bars: true,              // show the "diameters laid end to end" under the ruler
 *   sizes: [],               // diameters that already count as "rolled a full turn" (for restoring state)
 * }
 *
 * State: { d, turns, distance, rolled, ratio, sizes }
 *   turns    — fraction of a full turn rolled so far (0–1)
 *   distance — distance rolled so far, in ruler units (π × d × turns)
 *   rolled   — true when the current wheel has made its full turn
 *   ratio    — distance ÷ diameter once the turn is complete (≈ 3.14), otherwise null
 *   sizes    — every diameter that has been rolled a full turn so far, sorted
 *
 * A solution only needs e.g. { d: 2, turns: 1, sizes: [1, 2] }.
 * Drag the hub, use the slider, or focus the hub and press the arrow keys.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, tidy, snapTo, formatNumber, addStyles } from './kit.js';

addStyles('pi-roll', `
  .widget-pi-roll .w-slider + .w-slider { margin-top: 2px; }
`);

const W = 560;
const TOP = 16;

export default function create(spec, env) {
  const interactive = !env.compact;
  const min = spec.min != null ? Number(spec.min) : 1;
  const max = Math.max(min, spec.max != null ? Number(spec.max) : 3);
  const step = spec.step || 0.5;
  const showBars = spec.bars !== false;
  const U = Math.floor((W - 30) / (max * (Math.PI + 1)));   // pixels per ruler unit
  const X0 = 15 + (max / 2) * U;                             // where the wheel touches the ground at the start
  const G = TOP + max * U + 6;                               // ground level
  const H = G + (showBars ? 104 : 40);

  let d = clamp(Number(spec.d) || min, min, max);
  let turns = clamp(Number(spec.turns) || 0, 0, 1);
  let readOnly = !!env.readOnly;
  const done = new Set((Array.isArray(spec.sizes) ? spec.sizes : []).map(Number));
  if (turns >= 0.995) done.add(d);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A wheel that rolls along a ruler' });
  const { svg } = fr;

  /* ------------------------------------------------------------- static */
  svg.appendChild(s('line', { x1: 8, x2: W - 8, y1: G, y2: G, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  for (let i = 0; X0 + i * U <= W - 12; i++) {
    const x = X0 + i * U;
    svg.appendChild(s('line', { x1: x, x2: x, y1: G, y2: G + 8, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x, y: G + 23, 'text-anchor': 'middle' }, String(i)));
  }

  const gBars = s('g');
  const bars = [0, 1, 2].map(() => ({
    rect: s('rect', { y: G + 36, height: 20, rx: 4, stroke: hue('teal'), 'stroke-width': 2.5 }),
    label: s('text.fig-label-sm', { y: G + 47, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }),
  }));
  const extra = s('rect', { y: G + 36, height: 20, rx: 2, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 });
  const extraLabel = s('text.fig-label-sm', { y: G + 47, 'text-anchor': 'start', 'dominant-baseline': 'middle', style: `fill:${hue('orange', 'text')}` }, 'and a bit');
  const caption = s('text.tick-label', { x: X0, y: G + 76, 'text-anchor': 'start' }, 'diameters, laid end to end');
  if (showBars) {
    for (const bar of bars) gBars.append(bar.rect, bar.label);
    gBars.append(extra, extraLabel, caption);
    svg.appendChild(gBars);
  }

  const trail = s('line', { y1: G, y2: G, x1: X0, stroke: hue('orange'), 'stroke-width': 6, 'stroke-linecap': 'round' });
  const startMark = s('circle', { cx: X0, cy: G, r: 5, fill: 'var(--ink)' });
  const disc = s('circle', { fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const across = s('line', { stroke: hue('teal'), 'stroke-width': 4, 'stroke-linecap': 'round' });
  const rimFull = s('circle', { fill: 'none', stroke: hue('orange'), 'stroke-width': 6 });
  const rimArc = s('path', { fill: 'none', stroke: hue('orange'), 'stroke-width': 6, 'stroke-linecap': 'round' });
  const paint = s('circle', { r: 6, fill: 'var(--ink)', stroke: 'var(--surface)', 'stroke-width': 2 });
  svg.append(trail, startMark, disc, across, rimFull, rimArc, paint);

  const track = () => Math.PI * d * U; // pixels covered by one full turn

  const setTurns = (v, notify) => {
    let next = clamp(v, 0, 1);
    if (next > 0.985) next = 1;
    if (next < 0.015) next = 0;
    rollRow.set(next); // keep the slider in step when the value snaps to an end or comes from the hub
    if (next === turns) { render(); return; }
    const was = turns >= 0.995;
    turns = next;
    if (turns >= 0.995) {
      done.add(d);
      if (!was) env.announce(`One full turn. The wheel rolled ${formatNumber(Math.PI * d, 2)} units: ${formatNumber(Math.PI, 2)} times its diameter of ${formatNumber(d, 2)}.`);
    }
    render();
    if (notify) env.onChange(getState());
  };

  const hub = interactive ? handle(svg, {
    color: 'orange', r: 8, label: 'Wheel. Drag or use the arrow keys to roll it.', keyStep: 1,
    onMove: (hx, hy, ev) => {
      if (readOnly) return;
      // arrow keys ask for a 1 px nudge: turn that into a twentieth of a turn
      if (ev && ev.type === 'keydown') {
        const dir = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : -1;
        setTurns(Math.round((turns + dir * 0.05 * (ev.shiftKey ? 2 : 1)) * 100) / 100, true);
        return;
      }
      setTurns((hx - X0) / track(), true);
    },
  }) : null;
  if (hub) svg.appendChild(hub.el);

  /* ----------------------------------------------------------- controls */
  const roD = readout('diameter', { digits: 2, color: 'teal' });
  const roDist = readout('rolled', { digits: 2, color: 'orange' });
  const roRatio = readout('rolled ÷ diameter', { digits: 2 });
  if (interactive) fr.readouts.append(roD.el, roDist.el, roRatio.el);

  const sizeRow = spec.sizeSlider !== false && interactive && max > min ? sliderRow({
    label: 'Diameter', min, max, step, value: d, color: 'teal',
    onInput: (v) => {
      if (readOnly) return;
      d = clamp(v, min, max);
      turns = 0; // a new wheel starts back at the start line
      rollRow.set(0);
      render();
      env.onChange(getState());
    },
  }) : null;
  const rollRow = interactive ? sliderRow({
    label: 'Roll', min: 0, max: 1, step: 0.01, value: turns, color: 'orange',
    format: (v) => (v >= 0.995 ? '1 turn' : `${formatNumber(v, 2)} turn`),
    onInput: (v) => { if (!readOnly) setTurns(v, true); },
  }) : { set() {}, setDisabled() {} };
  if (sizeRow) fr.controls.appendChild(sizeRow.el);
  if (rollRow.el) fr.controls.appendChild(rollRow.el);

  /* ------------------------------------------------------------- render */
  function render() {
    const R = (d / 2) * U;
    const theta = 2 * Math.PI * turns;
    const cx = X0 + track() * turns;
    const cy = G - R;
    // the paint mark: the point of the rim that started on the ground
    const mx = cx - R * Math.sin(theta);
    const my = cy + R * Math.cos(theta);
    disc.setAttribute('cx', cx); disc.setAttribute('cy', cy); disc.setAttribute('r', R);
    across.setAttribute('x1', mx); across.setAttribute('y1', my);
    across.setAttribute('x2', 2 * cx - mx); across.setAttribute('y2', 2 * cy - my);
    paint.setAttribute('cx', mx); paint.setAttribute('cy', my);
    // the part of the rim that has not touched the ground yet (from the ground, anticlockwise, up to the paint mark)
    rimFull.setAttribute('cx', cx); rimFull.setAttribute('cy', cy); rimFull.setAttribute('r', R);
    rimFull.setAttribute('visibility', turns <= 0 ? 'visible' : 'hidden');
    if (turns > 0 && turns < 1) {
      rimArc.setAttribute('visibility', 'visible');
      rimArc.setAttribute('d', `M${cx.toFixed(2)} ${(cy + R).toFixed(2)} A${R} ${R} 0 ${2 * Math.PI - theta > Math.PI ? 1 : 0} 0 ${mx.toFixed(2)} ${my.toFixed(2)}`);
    } else rimArc.setAttribute('visibility', 'hidden');
    trail.setAttribute('x2', cx);
    trail.setAttribute('visibility', turns > 0 ? 'visible' : 'hidden');
    if (hub) { hub.set(cx, cy); hub.setLabel(`${formatNumber(turns, 2)} of a turn, ${formatNumber(Math.PI * d * turns, 2)} units from the start`); }

    const dist = Math.PI * d * turns;
    bars.forEach((bar, j) => {
      const reached = dist >= (j + 1) * d - 1e-9;
      bar.rect.setAttribute('x', X0 + j * d * U); bar.rect.setAttribute('width', d * U);
      bar.rect.setAttribute('fill', reached ? hue('teal') : hue('teal', 'soft'));
      bar.label.setAttribute('x', X0 + (j + 0.5) * d * U);
      bar.label.textContent = String(j + 1);
      bar.label.style.fill = reached ? '#1D1B26' : '';
      bar.label.style.stroke = reached ? 'none' : '';
    });
    const rolled = turns >= 0.995;
    extra.setAttribute('x', X0 + 3 * d * U); extra.setAttribute('width', (Math.PI - 3) * d * U);
    extra.setAttribute('visibility', rolled ? 'visible' : 'hidden');
    extraLabel.setAttribute('x', X0 + Math.PI * d * U + 7);
    extraLabel.setAttribute('visibility', rolled ? 'visible' : 'hidden');

    roD.set(d);
    roDist.set(dist);
    roRatio.set(rolled ? Math.PI : '?');
    svg.setAttribute('aria-label', `A wheel of diameter ${formatNumber(d, 2)} on a ruler. It has rolled ${formatNumber(turns, 2)} of a turn and travelled ${formatNumber(dist, 2)} units.` +
      (rolled ? ` That is ${formatNumber(Math.PI, 2)} times its diameter.` : ''));
  }

  function getState() {
    const rolled = turns >= 0.995;
    return {
      d: tidy(d, 3),
      turns: tidy(turns, 3),
      distance: tidy(Math.PI * d * turns, 3),
      rolled,
      ratio: rolled ? tidy(Math.PI, 3) : null,
      sizes: Array.from(done).sort((p, q) => p - q),
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.sizes)) { done.clear(); for (const v of next.sizes) if (Number.isFinite(Number(v))) done.add(Number(v)); }
      if (Number.isFinite(next.d)) { d = clamp(snapTo(next.d, step), min, max); if (sizeRow) sizeRow.set(d); }
      if (typeof next.turns === 'number') turns = clamp(next.turns, 0, 1);
      else if (next.rolled === true) turns = 1;
      if (turns >= 0.995) done.add(d);
      rollRow.set(turns);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hub) hub.setEnabled(!readOnly);
      if (sizeRow) sizeRow.setDisabled(readOnly);
      rollRow.setDisabled(readOnly);
    },
    destroy() { if (hub) hub.destroy(); },
  };
}

export const examples = [
  { title: 'pi-roll — roll one full turn, then try another size', spec: { type: 'pi-roll', d: 2 } },
  { title: 'pi-roll — a fixed wheel, already rolled', spec: { type: 'pi-roll', d: 1.5, turns: 1, sizeSlider: false } },
];
