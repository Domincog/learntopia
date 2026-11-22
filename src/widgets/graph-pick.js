/**
 * graph-pick — "which graph goes with this one?" A given graph on top and up
 * to four candidate graphs below it, all on the same axes. The learner taps
 * a candidate to choose it. Everything stays in view at once, even on a
 * phone, which makes it a good fit for matching a function to its derivative.
 *
 * {
 *   type: 'graph-pick',
 *   x: [-3, 3], y: [-4, 4],                 // window shared by every panel
 *   xStep: 1, yStep: 2,                     // grid spacing (automatic if omitted)
 *   given: { expr: 'x^2/2 - 2', color: 'blue', label: 'f' },   // the graph on top (omit for none)
 *   options: [                              // 2–4 candidates, lettered A–D in this order
 *     { expr: 'x', alt: 'a line rising through the origin' },
 *     { expr: '-x', alt: 'a line falling through the origin' },
 *   ],
 *   optionColor: 'orange',                  // colour of the candidate curves
 *   optionLabel: 'f′',                      // optional tag drawn on every candidate
 *   picked: null,                           // index selected at the start
 * }
 *
 * State: { picked }      — index of the chosen candidate (0 = A), or null
 */
import { frame, plane, drawAxes, fnPath, hue, s, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';
import { play } from '../core/audio.js';

addStyles('graph-pick', `
  .widget-graph-pick .gp-option { cursor: pointer; outline: none; }
  .widget-graph-pick .gp-box { fill: var(--surface); stroke: var(--edge); stroke-width: 2.5; transition: fill 0.15s ease, stroke 0.15s ease; }
  .widget-graph-pick .gp-option:hover .gp-box { fill: var(--sunken); }
  .widget-graph-pick .gp-option[aria-checked='true'] .gp-box { fill: var(--blue-soft); stroke: var(--blue); stroke-width: 4.5; }
  .widget-graph-pick .gp-option:focus-visible .gp-box { stroke: var(--focus); stroke-width: 4.5; }
  .widget-graph-pick .gp-badge { fill: var(--surface); stroke: var(--hair); stroke-width: 2.5; }
  .widget-graph-pick .w-canvas text.gp-letter { fill: var(--ink-2); font-weight: 800; stroke: none; }
  .widget-graph-pick .gp-option[aria-checked='true'] .gp-badge { fill: var(--blue); stroke: var(--blue); }
  .widget-graph-pick .w-canvas .gp-option[aria-checked='true'] text.gp-letter { fill: #1D1B26; }
  .widget-graph-pick.is-readonly .gp-option { cursor: default; pointer-events: none; }
`);

const W = 560;
const GAP = 14;
const GIVEN_H = 204;
const PANEL_H = 156;
const LETTERS = 'ABCD';
let clipSeq = 0;

export default function create(spec, env) {
  const xr = spec.x || [-3, 3];
  const yr = spec.y || [-4, 4];
  const options = (spec.options || []).slice(0, 4);
  const rows = Math.ceil(options.length / 2);
  const top0 = spec.given ? GIVEN_H + GAP : 0;
  const H = top0 + rows * PANEL_H + (rows - 1) * GAP + 4;
  const panelW = (W - GAP) / 2;
  let readOnly = !!env.readOnly;
  let picked = Number.isInteger(spec.picked) ? spec.picked : null;

  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'A graph and several candidate graphs to choose from' });
  const { svg } = fr;
  const curveOf = (expr) => {
    const f = compile(expr, { vars: ['x'] });
    return (x) => { try { return f({ x }); } catch { return NaN; } };
  };

  /** Axes + curve inside the box (bx, by, bw, bh). */
  function drawPanel(parent, bx, by, bw, bh, expr, color, withLabels) {
    const pad = withLabels ? { l: 34, r: 14, t: 14, b: 14 } : { l: 12, r: 12, t: 12, b: 12 };
    const pl = plane({ x: xr, y: yr, width: W, height: H, pad: { l: bx + pad.l, r: W - (bx + bw) + pad.r, t: by + pad.t, b: H - (by + bh) + pad.b } });
    const id = `gp-clip-${++clipSeq}`;
    let defs = svg.querySelector('defs');
    if (!defs) { defs = s('defs'); svg.insertBefore(defs, svg.firstChild); }
    defs.appendChild(s('clipPath', { id }, s('rect', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih })));
    parent.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep, labels: withLabels }));
    parent.appendChild(s('path', {
      d: fnPath(curveOf(expr), pl), fill: 'none', stroke: hue(color), 'stroke-width': withLabels ? 3.5 : 4.5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'clip-path': `url(#${id})`,
    }));
    return pl;
  }

  if (spec.given) {
    const g = s('g');
    g.appendChild(s('rect', { x: 1.5, y: 1.5, width: W - 3, height: GIVEN_H - 3, rx: 16, fill: 'var(--surface)', stroke: 'var(--edge)', 'stroke-width': 2.5 }));
    const pl = drawPanel(g, 0, 0, W, GIVEN_H, spec.given.expr, spec.given.color || 'blue', true);
    if (spec.given.label) g.appendChild(s('text.fig-label-lg', { x: pl.left + 10, y: pl.top + 20, style: `fill:${hue(spec.given.color || 'blue', 'text')}` }, spec.given.label));
    svg.appendChild(g);
  }

  const group = s('g', { role: 'radiogroup', 'aria-label': 'Candidate graphs' });
  svg.appendChild(group);
  const panels = options.map((opt, i) => {
    const bx = (i % 2) * (panelW + GAP);
    const by = top0 + Math.floor(i / 2) * (PANEL_H + GAP);
    const g = s('g.gp-option', { role: 'radio', tabindex: readOnly ? '-1' : '0', 'aria-checked': 'false', 'aria-label': `Graph ${LETTERS[i]}${opt.alt ? ': ' + opt.alt : ''}` });
    g.dataset.keys = 'own';
    g.appendChild(s('rect.gp-box', { x: bx + 2.5, y: by + 2.5, width: panelW - 5, height: PANEL_H - 5, rx: 14 }));
    drawPanel(g, bx, by, panelW, PANEL_H, opt.expr, opt.color || spec.optionColor || 'orange', false);
    g.appendChild(s('circle.gp-badge', { cx: bx + 26, cy: by + 26, r: 15 }));
    g.appendChild(s('text.fig-label.gp-letter', { x: bx + 26, y: by + 31.5, 'text-anchor': 'middle' }, LETTERS[i]));
    if (spec.optionLabel) g.appendChild(s('text.fig-label-sm', { x: bx + panelW - 14, y: by + 24, 'text-anchor': 'end', style: `fill:${hue(opt.color || spec.optionColor || 'orange', 'text')}` }, spec.optionLabel));
    const choose = () => {
      if (readOnly || picked === i) return;
      picked = i;
      play('select');
      render();
      env.announce(`Graph ${LETTERS[i]} selected`);
      env.onChange(getState());
    };
    g.addEventListener('click', choose);
    g.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); choose(); }
    });
    group.appendChild(g);
    return g;
  });

  function render() {
    panels.forEach((g, i) => g.setAttribute('aria-checked', String(i === picked)));
  }
  const getState = () => ({ picked });

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      picked = Number.isInteger(next.picked) && next.picked >= 0 && next.picked < options.length ? next.picked : null;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const g of panels) g.setAttribute('tabindex', readOnly ? '-1' : '0');
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  {
    title: 'graph-pick — which graph is the derivative?',
    spec: {
      type: 'graph-pick', x: [-3, 3], y: [-4, 4], yStep: 2,
      given: { expr: 'x^3/3 - x', label: 'f' },
      options: [{ expr: 'x^2 - 1' }, { expr: '1 - x^2' }, { expr: 'x' }, { expr: 'x^3/3 - x' }],
    },
  },
];
