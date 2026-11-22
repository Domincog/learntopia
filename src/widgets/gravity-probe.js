/**
 * gravity-probe — carry a one-kilogram mass away from the Earth and watch its
 * weight shrink. Distances are counted from the centre of the planet, in
 * Earth radii; an arrow and a readout show the pull. Every distance the probe
 * has visited keeps a small marker with the pull measured there, so the
 * pattern 10, 2.5, 1.11, 0.625 … (the inverse-square law) builds up.
 *
 * {
 *   type: 'gravity-probe',
 *   distance: 1,          // where the probe starts (Earth radii from the centre; 1 is the ground)
 *   max: 6,               // furthest distance on the scale
 *   step: 0.5,            // the probe snaps to multiples of this
 *   g: 10,                // pull on each kilogram at the ground (N)
 *   mass: 1,              // mass carried (kg)
 *   radius: 6400,         // radius of the planet (km), used for the readout in kilometres
 *   static: false,
 * }
 *
 * State: { distance, pull, weaker, visited }
 *   distance — Earth radii from the centre
 *   pull     — force on the mass there, g·mass ÷ distance² (N)
 *   weaker   — how many times weaker that is than at the ground: distance²
 *   visited  — every distance the probe has been at so far (sorted)
 *
 * setState({ distance, visited }).
 */
import { frame, sliderRow, readout, handle, hue, s, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 250;
const CX = 62;          // centre of the planet
const CY = 112;
const AXIS = 196;

addStyles('gravity-probe', `
  .widget-gravity-probe .gp-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-gravity-probe .gp-planet { font-family: var(--font-body); font-weight: 800; font-size: 14px; fill: var(--blue-text); }
  @media (max-width: 520px) { .widget-gravity-probe .gp-tag { font-size: 17px; } .widget-gravity-probe .gp-planet { font-size: 18px; } }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const max = spec.max || 6;
  const step = spec.step || 0.5;
  const g = spec.g || 10;
  const mass = spec.mass || 1;
  const radius = spec.radius || 6400;
  const k = (W - CX - 34) / max;                 // px per Earth radius
  let distance = clamp(spec.distance != null ? spec.distance : 1, 1, max);
  let visited = [distance];
  let readOnly = !!env.readOnly;

  const X = (d) => CX + d * k;
  const pullAt = (d) => (g * mass) / (d * d);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A probe at a distance from the Earth' });
  const { svg } = fr;
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: k, fill: hue('blue', 'soft'), stroke: 'var(--ink)', 'stroke-width': 3 }));
  svg.appendChild(s('text.gp-planet', { x: CX + 6, y: CY - 14, 'text-anchor': 'middle' }, 'Earth'));
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: 3, fill: 'var(--ink)' }));
  // the scale: Earth radii from the centre
  svg.appendChild(s('line', { x1: CX, x2: X(max) + 8, y1: AXIS, y2: AXIS, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  for (let d = 0; d <= max; d++) {
    svg.appendChild(s('line', { x1: X(d), x2: X(d), y1: AXIS, y2: AXIS + 8, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    svg.appendChild(s('text.tick-label', { x: X(d), y: AXIS + 24, 'text-anchor': 'middle' }, String(d)));
    if (d >= 1) svg.appendChild(s('line.grid-line', { x1: X(d), x2: X(d), y1: 20, y2: AXIS }));
  }
  svg.appendChild(s('text.axis-label', { x: X(max) + 8, y: AXIS + 44, 'text-anchor': 'end' }, 'distance from the centre, in Earth radii'));
  const gMarks = s('g');
  const gArrow = s('g');
  const probe = s('g',
    s('rect', { x: -13, y: -13, width: 26, height: 26, rx: 6, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    s('text', { class: 'fig-label-sm', x: 0, y: 4, 'text-anchor': 'middle', style: 'fill:#1D1B26; stroke:none' }, `${formatNumber(mass, 1)} kg`));
  svg.append(gMarks, gArrow, probe);

  const roDist = readout('distance', {});
  const roPull = readout(`pull on ${formatNumber(mass, 1)} kg`, { color: 'red' });
  const roWeaker = readout('compared with the ground', {});
  let slider = null;
  let grip = null;

  const getState = () => ({ distance, pull: tidy(pullAt(distance), 4), weaker: tidy(distance * distance, 4), visited: visited.slice() });
  const move = (d, notify) => {
    const next = clamp(Math.round(d / step) * step, 1, max);
    if (next === distance) { render(); return; }
    distance = tidy(next, 4);
    if (!visited.includes(distance)) { visited.push(distance); visited.sort((a, b) => a - b); }
    if (slider) slider.set(distance);
    render();
    if (notify) { play('tap'); env.onChange(getState()); }
  };

  if (!isStatic) {
    fr.readouts.append(roDist.el, roPull.el, roWeaker.el);
    slider = sliderRow({ label: 'distance', min: 1, max, step, value: distance, color: 'orange', format: (v) => `${formatNumber(v, 1)} Earth ${v === 1 ? 'radius' : 'radii'}`, onInput: (v) => { if (readOnly) return; move(v, true); } });
    fr.controls.appendChild(slider.el);
    grip = handle(svg, {
      x: X(distance), y: CY, color: 'orange', label: 'Probe', shape: 'square', r: 13, keyStep: k * step,
      onMove(px) { if (readOnly) return; move((px - CX) / k, true); },
    });
    grip.el.querySelector('.w-handle-dot').setAttribute('opacity', 0);     // the probe drawn above is the visible part
    svg.appendChild(grip.el);
  }

  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const newtons = (v) => `${formatNumber(v, v < 1 ? 3 : 2)} N`;

  function render() {
    clear(gMarks); clear(gArrow);
    for (const d of visited) {
      if (d === distance) continue;
      gMarks.appendChild(s('circle', { cx: X(d), cy: CY, r: 5, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2 }));
      // labels of neighbouring markers take turns on two lines, so that they do not run into each other
      const row = Math.round(d / step) % 2 === 0 ? 30 : 48;
      gMarks.appendChild(s('text.gp-tag', { x: X(d), y: CY + row, 'text-anchor': 'middle', style: `fill:${hue('gray', 'text')}` }, newtons(pullAt(d))));
    }
    const px = X(distance);
    probe.setAttribute('transform', `translate(${px} ${CY})`);
    // the pull: an arrow towards the Earth whose length follows the force
    const len = Math.max(7, (pullAt(distance) / (g * mass)) * (k - 22));
    const x0 = px - 18;
    const x1 = x0 - len;
    const head = Math.min(10, Math.max(5, len * 0.5));
    gArrow.appendChild(s('line', { x1: x0, x2: x1 + head, y1: CY, y2: CY, stroke: hue('red'), 'stroke-width': 5, 'stroke-linecap': 'round' }));
    gArrow.appendChild(s('path', { d: `M${x1} ${CY}L${x1 + head} ${CY - head * 0.7}L${x1 + head} ${CY + head * 0.7}Z`, fill: hue('red'), stroke: hue('red'), 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    gArrow.appendChild(s('text.gp-tag', { x: clamp(px, 60, W - 40), y: CY - 24, 'text-anchor': 'middle', style: `fill:${hue('red', 'text')}` }, newtons(pullAt(distance))));

    const radii = `${formatNumber(distance, 1)} Earth ${distance === 1 ? 'radius' : 'radii'}`;
    roDist.set(`${radii} (${formatNumber(distance * radius, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} km)`);
    roPull.set(newtons(pullAt(distance)));
    roWeaker.set(distance === 1 ? 'the same' : `${formatNumber(distance * distance, 2)} times weaker`);
    if (grip) { grip.set(px, CY); grip.setLabel(`${radii} from the centre; pull ${newtons(pullAt(distance))}`); grip.setEnabled(!readOnly); }
    if (!isStatic) svg.setAttribute('aria-label', `${spec.alt || 'A probe at a distance from the Earth'}. The probe is ${radii} from the centre of the Earth. The pull on ${formatNumber(mass, 1)} kilogram there is ${newtons(pullAt(distance))}.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.visited)) visited = next.visited.filter((d) => d >= 1 && d <= max).sort((a, b) => a - b);
      if (typeof next.distance === 'number') distance = clamp(next.distance, 1, max);
      if (!visited.includes(distance)) { visited.push(distance); visited.sort((a, b) => a - b); }
      if (slider) slider.set(distance);
      render();
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      render();
    },
    destroy() { if (grip) grip.destroy(); },
  };
}

export const examples = [
  { title: 'gravity-probe — the pull of the Earth fades with distance', spec: { type: 'gravity-probe', distance: 1, max: 6 } },
];
