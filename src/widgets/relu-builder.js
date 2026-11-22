/**
 * relu-builder — build a curve out of ReLU "hinges". A hidden unit takes the
 * input x, subtracts its kink position and passes the result through
 * ReLU: max(0, x − kink). It is flat (0) up to its kink and rises with slope 1
 * after it. The output neuron multiplies every unit by a weight, adds them up
 * and adds a bias:
 *
 *     y = bias + w1 · ReLU(x − k1) + w2 · ReLU(x − k2) + …
 *
 * The learner sets the weights with sliders and tries to match a dashed
 * target curve. With `bend: false` the units pass x − kink straight through
 * (no ReLU): whatever the weights, the sum is then one straight line.
 *
 * {
 *   type: 'relu-builder',
 *   x: [0, 6], y: [-1, 5],          // window (xStep / yStep for the grid are optional)
 *   bend: true,                     // false: units without the ReLU bend
 *   bias: 3,                        // the output neuron's bias; a number, or a slider { min, max, step, value }
 *   hinges: [                       // at most four; keep the number of sliders to three
 *     { at: 0, weight: { min: -3, max: 3, step: 0.5, value: 0 } },   // weight with a slider
 *     { at: 3, weight: 2 },                                          // fixed weight, no slider
 *   ],
 *   target: 'abs(x - 3)',           // the dashed curve to match (an expression in x); optional
 *   tolerance: 0.05,                // `match` is true when the largest gap is at most this
 *   parts: true,                    // also draw each unit's own contribution, thin
 *   formula: true,                  // show the live formula under the picture
 *   auto: { min: 1, max: 12, value: 2 },   // instead of `hinges`: ONE slider for the number of hinges. The widget
 *                                   // then places that many hinges at equal spacing and sets their weights so that
 *                                   // the sum passes through the target at every kink (and at the right-hand edge).
 *   static: false,                  // true: a picture without sliders
 * }
 *
 * State: { weights, bias, pieces, straight, slope, gap, match, tried, n }
 *   weights   the output weight of every unit, in order
 *   pieces    the slope of the sum on each stretch between kinks: [{ from, to, slope }]
 *   straight  the sum is one straight line across the whole window
 *   slope     its slope when it is straight (otherwise null)
 *   gap       the largest vertical distance between the sum and the target inside the window (null without a target)
 *   match     gap <= tolerance
 *   tried     how many different settings the learner has looked at so far
 *   n         the number of hinges (in auto mode this is the slider)
 *
 * setState accepts { weights: [...], bias, n, tried }.
 */
import { frame, plane, drawAxes, sliderRow, readout, hue, s, h, clamp, tidy, clipTo, mdInline, addStyles, formatNumber } from './kit.js';
import { compile } from '../core/mathexpr.js';
import { play } from '../core/audio.js';

addStyles('relu-builder', `
  .widget-relu-builder .rb-line { text-align: center; min-height: 2.1em; display: grid; align-content: center; font-size: var(--fs-md); overflow-wrap: anywhere; }
  .widget-relu-builder .rb-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 600; }
`);

const W = 560;
const H = 340;
const COLORS = ['blue', 'orange', 'teal', 'pink'];

/** The sum of hinges at x. units: [{ at, weight }]. */
export function hingeSum(units, bias, x, bend = true) {
  let y = bias;
  for (const u of units) {
    const z = x - u.at;
    y += u.weight * (bend ? Math.max(0, z) : z);
  }
  return y;
}

/**
 * n hinges at equal spacing across [x0, x1] whose sum passes through f at every kink and at x1.
 * Returns { bias, units }.
 */
export function fitHinges(f, x0, x1, n) {
  const step = (x1 - x0) / n;
  const units = [];
  let before = 0;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * step;
    const slope = (f(a + step) - f(a)) / step;
    units.push({ at: a, weight: slope - before });
    before = slope;
  }
  return { bias: f(x0), units };
}

/** Largest |a(x) − b(x)| on a fine grid over [x0, x1] that includes every point in `extra`. */
export function largestGap(a, b, x0, x1, extra = []) {
  let worst = 0;
  const probe = (x) => { const d = Math.abs(a(x) - b(x)); if (d > worst) worst = d; };
  const N = 600;
  for (let i = 0; i <= N; i++) probe(x0 + ((x1 - x0) * i) / N);
  for (const x of extra) if (x >= x0 && x <= x1) probe(x);
  return worst;
}

export default function create(spec, env) {
  const xr = spec.x || [0, 6];
  const yr = spec.y || [-1, 5];
  const bend = spec.bend !== false;
  const autoDef = spec.auto && typeof spec.auto === 'object' ? { min: 1, max: 12, value: 2, ...spec.auto } : null;
  const isStatic = !!spec.static || !!env.compact;
  const tolerance = spec.tolerance != null ? Number(spec.tolerance) : 0.05;
  let readOnly = !!env.readOnly;

  let targetFn = null;
  if (spec.target) {
    const compiled = compile(String(spec.target), { vars: ['x'] });
    targetFn = (x) => compiled({ x });
  }

  // the units and the bias, each either fixed or on a slider
  const defs = autoDef ? [] : (spec.hinges || [{ at: 0, weight: { min: -3, max: 3, step: 0.5, value: 1 } }]).slice(0, 4);
  const units = defs.map((d) => ({ at: Number(d.at) || 0, weight: typeof d.weight === 'object' && d.weight ? Number(d.weight.value) || 0 : Number(d.weight) || 0 }));
  const biasDef = spec.bias && typeof spec.bias === 'object' ? spec.bias : null;
  let bias = biasDef ? Number(biasDef.value) || 0 : Number(spec.bias) || 0;
  let n = autoDef ? clamp(Math.round(autoDef.value), autoDef.min, autoDef.max) : units.length;
  const seen = new Set();

  const current = () => (autoDef && targetFn ? fitHinges(targetFn, xr[0], xr[1], n) : { bias, units });
  const sumAt = (x) => { const c = current(); return hingeSum(c.units, c.bias, x, bend); };

  function pieces() {
    const c = current();
    const inside = c.units.map((u) => u.at).filter((a) => a > xr[0] + 1e-9 && a < xr[1] - 1e-9);
    const cuts = Array.from(new Set([xr[0], ...inside, xr[1]])).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const mid = (cuts[i] + cuts[i + 1]) / 2;
      const slope = c.units.reduce((t, u) => t + (!bend || mid > u.at ? u.weight : 0), 0);
      out.push({ from: cuts[i], to: cuts[i + 1], slope: tidy(slope, 4) });
    }
    return out;
  }

  const getState = () => {
    const c = current();
    const ps = pieces();
    const straight = ps.every((p) => Math.abs(p.slope - ps[0].slope) < 1e-9);
    const gap = targetFn ? tidy(largestGap(sumAt, targetFn, xr[0], xr[1], c.units.map((u) => u.at)), 3) : null;
    return {
      weights: c.units.map((u) => tidy(u.weight, 4)),
      bias: tidy(c.bias, 4),
      pieces: ps,
      straight,
      slope: straight ? ps[0].slope : null,
      gap,
      match: gap != null && gap <= tolerance + 1e-9,
      tried: seen.size,
      n: autoDef ? n : units.length,
    };
  };
  const remember = () => { seen.add(autoDef ? String(n) : JSON.stringify([units.map((u) => u.weight), bias])); };

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A curve built from ReLU hinges' });
  const { svg } = fr;
  const pl = plane({ x: xr, y: yr, width: W, height: H, pad: { l: 34, r: 14, t: 14, b: 30 } });
  svg.appendChild(drawAxes(pl, { xStep: spec.xStep || 1, yStep: spec.yStep || 1, xLabel: 'input x', yLabel: 'output y' }));
  const clip = clipTo(svg, pl);
  const gPlot = s('g', { 'clip-path': clip });
  svg.appendChild(gPlot);
  const gMarks = s('g');
  svg.appendChild(gMarks);

  const line = h('div.rb-line');
  if (!env.compact && spec.formula !== false) fr.el.insertBefore(line, fr.readouts);
  const roGap = readout('largest gap', { digits: 2, color: 'violet' });
  const roSlope = readout('slope of the sum', { digits: 2 });
  if (!env.compact) {
    if (!bend) fr.readouts.appendChild(roSlope.el);
    if (targetFn) fr.readouts.appendChild(roGap.el);
  }

  /** Polyline through the kinks: exact, however sharp the corners. */
  function pathOf(f, kinks) {
    const xs = Array.from(new Set([xr[0], ...kinks.filter((k) => k > xr[0] && k < xr[1]), xr[1]])).sort((a, b) => a - b);
    return xs.map((x, i) => `${i ? 'L' : 'M'}${pl.sx(x).toFixed(2)} ${pl.sy(clamp(f(x), yr[0] - 50, yr[1] + 50)).toFixed(2)}`).join('');
  }
  function smoothPath(f) {
    let d = '';
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const x = xr[0] + ((xr[1] - xr[0]) * i) / N;
      d += `${i ? 'L' : 'M'}${pl.sx(x).toFixed(2)} ${pl.sy(clamp(f(x), yr[0] - 50, yr[1] + 50)).toFixed(2)}`;
    }
    return d;
  }

  const num = (v) => formatNumber(tidy(v, 3), 2).replace('−', '-');
  const signed = (v) => (v < 0 ? `- ${num(-v)}` : `+ ${num(v)}`);

  function formulaTex() {
    const c = current();
    const act = (u) => {
      const inner = u.at === 0 ? 'x' : `x ${signed(-u.at)}`;
      return bend ? `\\text{ReLU}(${inner})` : `(${inner})`;
    };
    // every weight is written out, even 0 and 1: they are the slider settings. A bias of 0 is left out.
    const lead = c.bias === 0;
    const terms = c.units.map((u, i) => {
      const coef = lead && i === 0 ? (u.weight < 0 ? `-${num(-u.weight)}` : num(u.weight)) : signed(u.weight);
      return `\\${COLORS[i % COLORS.length]}{${coef}}\\,${act(u)}`;
    }).join(' ');
    return `y = ${lead ? '' : `${num(c.bias)} `}${terms}`;
  }

  function draw() {
    const c = current();
    const kinks = c.units.map((u) => u.at);
    gPlot.replaceChildren();
    gMarks.replaceChildren();
    // where each kink is: a faint upright line
    if (bend) {
      for (const [i, u] of c.units.entries()) {
        if (u.at < xr[0] - 1e-9 || u.at > xr[1] + 1e-9) continue;
        if (!autoDef) gPlot.appendChild(s('line', { x1: pl.sx(u.at), x2: pl.sx(u.at), y1: pl.top, y2: pl.bottom, stroke: hue(COLORS[i % COLORS.length]), 'stroke-width': 1.5, 'stroke-dasharray': '3 5', opacity: 0.7 }));
      }
    }
    if (spec.parts !== false && !autoDef) {
      c.units.forEach((u, i) => {
        const part = (x) => u.weight * (bend ? Math.max(0, x - u.at) : x - u.at);
        gPlot.appendChild(s('path', { d: pathOf(part, [u.at]), fill: 'none', stroke: hue(COLORS[i % COLORS.length]), 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85 }));
      });
    }
    gPlot.appendChild(s('path', { d: pathOf(sumAt, kinks), fill: 'none', stroke: hue('violet'), 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    // the target goes on top, thin and dashed, so that it still shows where the sum already covers it
    if (targetFn) {
      gPlot.appendChild(s('path', { d: smoothPath(targetFn), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '6 7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    // the kinks themselves, as dots on the sum
    if (bend) {
      c.units.forEach((u, i) => {
        if (u.at < xr[0] - 1e-9 || u.at > xr[1] + 1e-9) return;
        const y = sumAt(u.at);
        if (y < yr[0] - 1e-9 || y > yr[1] + 1e-9) return;
        gMarks.appendChild(s('circle', { cx: pl.sx(u.at), cy: pl.sy(y), r: autoDef ? 4.5 : 6.5, fill: autoDef ? hue('violet') : hue(COLORS[i % COLORS.length]), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
      });
    }
    const st = getState();
    if (autoDef) {
      line.replaceChildren(h('span', { html: mdInline(`**${n}** ${n === 1 ? 'hinge' : 'hinges'}: the sum has ${n} straight ${n === 1 ? 'piece' : 'pieces'}`) }));
    } else if (bend) {
      line.replaceChildren(h('span', { html: mdInline(`$${formulaTex()}$`) }));
    } else {
      const m = st.slope;
      const b0 = sumAt(0);
      const lineTex = `${m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '-x' : `${num(m)}x`}${m === 0 ? num(b0) : b0 === 0 ? '' : ` ${signed(b0)}`}`;
      line.replaceChildren(h('span', { html: mdInline(`$${formulaTex()}$`) }), h('small', { html: mdInline(`which is the straight line $y = ${lineTex}$`) }));
    }
    if (st.gap != null) roGap.set(st.gap);
    if (!bend) roSlope.set(st.slope);
    const shape = st.straight ? `one straight line with slope ${num(st.slope)}` : `${st.pieces.length} straight pieces with slopes ${st.pieces.map((p) => num(p.slope)).join(', ')}`;
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}The sum is ${shape}.${st.gap != null ? ` Largest gap to the dashed target: ${num(st.gap)}.` : ''}`);
  }

  /* ------------------------------------------------------------- controls */
  const rows = [];
  let biasRow = null;
  let nRow = null;
  const changed = () => { remember(); play('tap'); draw(); env.onChange(getState()); };
  if (!isStatic) {
    if (autoDef) {
      nRow = sliderRow({
        label: 'number of hinges', min: autoDef.min, max: autoDef.max, step: 1, value: n, color: 'violet',
        onInput: (v) => { if (readOnly) return; n = v; changed(); },
      });
      fr.controls.appendChild(nRow.el);
    } else {
      defs.forEach((d, i) => {
        if (!(typeof d.weight === 'object' && d.weight)) { rows.push(null); return; }
        const row = sliderRow({
          label: d.label || (bend ? `weight of the hinge at ${num(d.at)}` : `weight of unit ${i + 1}`),
          min: d.weight.min != null ? d.weight.min : -3, max: d.weight.max != null ? d.weight.max : 3, step: d.weight.step || 0.5,
          value: units[i].weight, color: COLORS[i % COLORS.length],
          onInput: (v) => { if (readOnly) return; units[i].weight = v; changed(); },
        });
        rows.push(row);
        fr.controls.appendChild(row.el);
      });
      if (biasDef) {
        biasRow = sliderRow({
          label: 'bias', min: biasDef.min != null ? biasDef.min : -3, max: biasDef.max != null ? biasDef.max : 3, step: biasDef.step || 0.5, value: bias, color: 'violet',
          onInput: (v) => { if (readOnly) return; bias = v; changed(); },
        });
        fr.controls.appendChild(biasRow.el);
      }
    }
  }

  remember();
  draw();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (autoDef && next.n != null) { n = clamp(Math.round(next.n), autoDef.min, autoDef.max); if (nRow) nRow.set(n); }
      if (!autoDef && Array.isArray(next.weights)) {
        next.weights.forEach((w, i) => {
          if (i >= units.length || typeof w !== 'number') return;
          units[i].weight = w;
          if (rows[i]) rows[i].set(w);
        });
      }
      if (!autoDef && typeof next.bias === 'number') { bias = next.bias; if (biasRow) biasRow.set(bias); }
      // a solution may say how many settings have been looked at, without listing them
      if (typeof next.tried === 'number') for (let i = 0; seen.size < next.tried && i < 500; i++) seen.add(`given ${i}`);
      remember();
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [...rows, biasRow, nRow]) if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  {
    title: 'relu-builder — two hinges make a V',
    spec: {
      type: 'relu-builder', x: [0, 6], y: [-1, 5], bias: 3, target: 'abs(x - 3)',
      hinges: [{ at: 0, weight: { min: -3, max: 3, step: 0.5, value: 0 } }, { at: 3, weight: { min: -3, max: 3, step: 0.5, value: 0 } }],
    },
  },
  {
    title: 'relu-builder — no bend, no shape',
    spec: {
      type: 'relu-builder', x: [0, 6], y: [-1, 5], bias: 3, bend: false, target: 'abs(x - 3)',
      hinges: [{ at: 0, weight: { min: -3, max: 3, step: 0.5, value: -1 } }, { at: 3, weight: { min: -3, max: 3, step: 0.5, value: 1 } }],
    },
  },
  {
    title: 'relu-builder — more hinges, closer fit',
    spec: { type: 'relu-builder', x: [0, 6], y: [-1, 5], target: '2 + 2*sin(x)', auto: { min: 1, max: 12, value: 3 } },
  },
];
