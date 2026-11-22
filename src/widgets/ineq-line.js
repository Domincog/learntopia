/**
 * ineq-line — inequalities on a number line. Three jobs, chosen with `mode`:
 *
 *   'probe'    test numbers. The learner drags a probe along the line; every
 *              number it visits is tried in a statement such as −2x < 6 and
 *              marked with a tick (true) or a cross (false). The marks stay,
 *              so the shape of the solution set appears by itself.
 *   'ray'      draw a one-sided answer such as x > −3: drag the end, choose
 *              the direction, and make the end hollow (not included) or
 *              filled (included).
 *   'segment'  draw a two-sided answer such as 2 < x ≤ 5: two ends, each
 *              hollow or filled.
 *
 * {
 *   type: 'ineq-line',
 *   mode: 'probe',
 *   min: -8, max: 8, step: 1,
 *   // probe
 *   test: { lhs: '-2x', op: '<', rhs: '6', lhsTex: '-2x', rhsTex: '6' },   // op: '<' '<=' '>' '>=' ; expressions in x
 *   x: 0,                    // where the probe starts (that number counts as tested)
 *   // ray
 *   at: 0, dir: 'right', closed: false,
 *   // segment
 *   from: -2, to: 2, closedFrom: false, closedTo: false,
 *   symbols: false,          // ray / segment: also show the set in symbols under the line (x > −3)
 *   static: false,           // true: picture only
 * }
 *
 * State, probe:    { x, value, trueAt, falseAt, tested }
 *   value    is the statement true at the probe?
 *   trueAt   every visited number that makes the statement true (sorted); falseAt likewise
 *   tested   how many numbers have been visited
 * State, ray:      { at, dir, closed }             dir: 'left' | 'right'
 * State, segment:  { from, to, closedFrom, closedTo }   (from < to always)
 *
 * setState accepts { x, visited: [numbers] } for a probe (trueAt / falseAt are
 * read as visited numbers too), and the plain state for the other two modes.
 */
import { frame, handle, button, hue, s, h, clamp, snapTo, tidy, ticks, niceStep, formatNumber, mdInline, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';
import { play } from '../core/audio.js';

addStyles('ineq-line', `
  .widget-ineq-line .il-line { text-align: center; min-height: 1.9em; font-size: var(--fs-md); display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 0.2em 0.7em; }
  .widget-ineq-line .il-verdict { font-weight: 800; white-space: nowrap; }
  .widget-ineq-line .il-verdict.is-true { color: var(--green-text); }
  .widget-ineq-line .il-verdict.is-false { color: var(--red-text); }
  .widget-ineq-line .il-toggle { min-height: 40px; font-variant-numeric: tabular-nums; }
`);

const W = 500;
const PAD = 36;
const OPS = {
  '<': { tex: '<', test: (a, b) => a < b - 1e-9 },
  '<=': { tex: '\\le', test: (a, b) => a <= b + 1e-9 },
  '>': { tex: '>', test: (a, b) => a > b + 1e-9 },
  '>=': { tex: '\\ge', test: (a, b) => a >= b - 1e-9 },
};
const texNum = (v) => formatNumber(v, 3).replace('−', '-');

export default function create(spec, env) {
  const mode = ['probe', 'ray', 'segment'].includes(spec.mode) ? spec.mode : 'ray';
  const min = spec.min != null ? spec.min : -8;
  const max = spec.max != null ? spec.max : 8;
  const step = spec.step || 1;
  const interactive = !spec.static && !env.compact;
  let readOnly = !!env.readOnly;

  const H = mode === 'probe' ? 128 : 100;
  const y0 = mode === 'probe' ? 78 : 44;
  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'A number line' });
  const { svg } = fr;
  const sx = (v) => PAD + ((v - min) / (max - min)) * (W - 2 * PAD);
  const ux = (px) => min + ((px - PAD) / (W - 2 * PAD)) * (max - min);
  const snap = (v) => tidy(clamp(snapTo(v, step), min, max));

  /* ------------------------------------------------------- the line itself */
  const gSet = s('g');
  svg.appendChild(gSet);
  svg.appendChild(s('line.axis-line', { x1: PAD - 20, x2: W - PAD + 20, y1: y0, y2: y0, 'stroke-width': 3, 'stroke-linecap': 'round' }));
  svg.appendChild(s('path', { d: `M${PAD - 20} ${y0} l8 -6 M${PAD - 20} ${y0} l8 6 M${W - PAD + 20} ${y0} l-8 -6 M${W - PAD + 20} ${y0} l-8 6`, class: 'axis-line', fill: 'none', 'stroke-linecap': 'round' }));
  const span = max - min;
  const labelEvery = span <= 16 ? 1 : niceStep(span, 10);
  if (span <= 40) for (const v of ticks(min, max, 1)) svg.appendChild(s('line.axis-line', { x1: sx(v), x2: sx(v), y1: y0 - 7, y2: y0 + 7, 'stroke-width': 1.5 }));
  for (const v of ticks(min, max, labelEvery)) {
    svg.appendChild(s('line.axis-line', { x1: sx(v), x2: sx(v), y1: y0 - 10, y2: y0 + 10 }));
    svg.appendChild(s('text.tick-label', { x: sx(v), y: y0 + 30, 'text-anchor': 'middle' }, formatNumber(v, 3)));
  }
  const gMarks = s('g');
  const gHandles = s('g');
  svg.append(gMarks, gHandles);

  const line = h('div.il-line', { 'aria-live': 'polite' });
  const showLine = !env.compact && (mode === 'probe' || spec.symbols);
  if (showLine) fr.el.insertBefore(line, fr.readouts);

  /* ------------------------------------------------------------------ probe */
  const test = spec.test || { lhs: 'x', op: '<', rhs: '0' };
  const op = OPS[test.op] || OPS['<'];
  let lhs = () => NaN;
  let rhs = () => NaN;
  if (mode === 'probe') {
    const l = compile(String(test.lhs), { vars: ['x'] });
    const rr = compile(String(test.rhs), { vars: ['x'] });
    lhs = (x) => tidy(l({ x }));
    rhs = (x) => tidy(rr({ x }));
  }
  const rhsConstant = mode === 'probe' && rhs(min) === rhs(max) && rhs(min) === rhs((min + max) / 2 + 0.37);
  const truth = (x) => op.test(lhs(x), rhs(x));
  let x = snap(spec.x != null ? spec.x : 0);
  const visited = new Set(mode === 'probe' ? [x] : []);

  /* ----------------------------------------------------------- ray, segment */
  let at = snap(spec.at != null ? spec.at : 0);
  let dir = spec.dir === 'left' ? 'left' : 'right';
  let closed = !!spec.closed;
  let from = snap(spec.from != null ? spec.from : -2);
  let to = snap(spec.to != null ? spec.to : 2);
  if (to <= from) to = snap(from + step);
  let closedFrom = !!spec.closedFrom;
  let closedTo = !!spec.closedTo;

  function getState() {
    if (mode === 'probe') {
      const all = Array.from(visited).sort((a, b) => a - b);
      return { x, value: truth(x), trueAt: all.filter(truth), falseAt: all.filter((v) => !truth(v)), tested: all.length };
    }
    if (mode === 'ray') return { at, dir, closed };
    return { from, to, closedFrom, closedTo };
  }

  /* --------------------------------------------------------------- handles */
  const handles = {};
  const changed = () => { render(); env.onChange(getState()); };
  const makeHandle = (name, color, label, onTo) => {
    const hd = handle(svg, {
      color, r: 11, label,
      keyStep: Math.max(3, step * ((W - 2 * PAD) / (max - min))),
      onMove: (px) => { if (!readOnly && onTo(snap(ux(px)))) changed(); },
    });
    handles[name] = hd;
    gHandles.appendChild(hd.el);
    return hd;
  };
  if (interactive) {
    if (mode === 'probe') {
      makeHandle('x', 'orange', 'The number being tested', (v) => {
        if (v === x) return false;
        x = v;
        if (!visited.has(v)) { visited.add(v); play('tick'); }
        return true;
      });
    } else if (mode === 'ray') {
      makeHandle('at', 'blue', 'End of the shaded part', (v) => { if (v === at) return false; at = v; return true; });
    } else {
      makeHandle('from', 'blue', 'Left end', (v) => { const nv = Math.min(v, tidy(to - step)); if (nv === from) return false; from = nv; return true; });
      makeHandle('to', 'blue', 'Right end', (v) => { const nv = Math.max(v, tidy(from + step)); if (nv === to) return false; to = nv; return true; });
    }
  }

  /* --------------------------------------------------------------- buttons */
  const toggles = [];
  const toggle = (get, flip, text, aria) => {
    const btn = button('', () => { if (readOnly) return; flip(); play('tap'); changed(); });
    btn.classList.add('il-toggle');
    toggles.push({ btn, paint: () => { btn.textContent = text(get()); btn.setAttribute('aria-label', aria(get())); } });
    fr.buttons.appendChild(btn);
  };
  const endText = (name) => (isClosed) => `${name}: ${isClosed ? '● filled' : '○ hollow'}`;
  const endAria = (name) => (isClosed) => `${name} is ${isClosed ? 'filled: the number is included' : 'hollow: the number is not included'}. Press to change.`;
  if (interactive && mode === 'ray') {
    toggle(() => dir, () => { dir = dir === 'right' ? 'left' : 'right'; }, (d) => (d === 'right' ? 'Shade: to the right ▶' : 'Shade: ◀ to the left'), (d) => `The shading goes to the ${d}. Press to turn it round.`);
    toggle(() => closed, () => { closed = !closed; }, endText('End'), endAria('The end'));
  }
  if (interactive && mode === 'segment') {
    toggle(() => closedFrom, () => { closedFrom = !closedFrom; }, endText('Left end'), endAria('The left end'));
    toggle(() => closedTo, () => { closedTo = !closedTo; }, endText('Right end'), endAria('The right end'));
  }

  /* ---------------------------------------------------------------- render */
  const band = (x1, x2) => s('line', { x1, x2, y1: y0, y2: y0, stroke: hue('blue'), 'stroke-width': 10, 'stroke-linecap': 'butt', opacity: 0.6 });
  /** The end of a shaded part: a filled or a hollow circle. Drawn under the handle, and on its own in pictures. */
  const endDot = (v, isClosed) => s('circle', { cx: sx(v), cy: y0, r: 9, fill: isClosed ? hue('blue') : 'var(--surface)', stroke: isClosed ? 'var(--edge-strong)' : hue('blue'), 'stroke-width': isClosed ? 2.5 : 3.5 });
  const mark = (v, ok) => {
    const cx = sx(v);
    const cy = y0 - 32;
    const g = s('g');
    g.appendChild(s('circle', { cx, cy, r: 10, fill: hue(ok ? 'green' : 'red'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
    g.appendChild(s('path', {
      d: ok ? `M${cx - 4.6} ${cy + 0.4} l3.2 3.3 l6 -6.8` : `M${cx - 3.9} ${cy - 3.9} l7.8 7.8 M${cx + 3.9} ${cy - 3.9} l-7.8 7.8`,
      fill: 'none', stroke: '#1D1B26', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }));
    return g;
  };
  const setHandle = (name, v, isClosed, label) => {
    const hd = handles[name];
    if (!hd) return;
    hd.set(sx(v), y0);
    if (isClosed != null) {
      // a filled end is a blue disc; a hollow end is a blue ring around the background colour
      hd.setColor(isClosed ? 'blue' : 'surface');
      const dot = hd.el.querySelector('.w-handle-dot');
      if (dot) { dot.setAttribute('stroke', isClosed ? 'var(--edge-strong)' : hue('blue')); dot.setAttribute('stroke-width', isClosed ? 2.5 : 4.5); }
    }
    hd.setLabel(label);
  };

  function render() {
    gSet.replaceChildren();
    gMarks.replaceChildren();
    if (mode === 'probe') {
      const all = Array.from(visited).sort((a, b) => a - b);
      for (const v of all) gMarks.appendChild(mark(v, truth(v)));
      if (!interactive) gMarks.appendChild(s('circle', { cx: sx(x), cy: y0, r: 9, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
      const ok = truth(x);
      const l = lhs(x);
      const rv = rhs(x);
      const sides = rhsConstant
        ? `$x = ${texNum(x)}$ gives $\\;${test.lhsTex || test.lhs} = ${texNum(l)}$.`
        : `$x = ${texNum(x)}$ gives $\\;${test.lhsTex || test.lhs} = ${texNum(l)}\\;$ and $\\;${test.rhsTex || test.rhs} = ${texNum(rv)}$.`;
      line.replaceChildren(
        h('span', { html: mdInline(sides) }),
        h('span', { class: `il-verdict ${ok ? 'is-true' : 'is-false'}`, html: mdInline(`$${texNum(l)} ${op.tex} ${texNum(rv)}$ is ${ok ? 'true ✓' : 'false ✗'}`) }),
      );
      setHandle('x', x, null, `x = ${formatNumber(x, 3)}: the statement is ${ok ? 'true' : 'false'}`);
      const st = getState();
      svg.setAttribute('aria-label', `A number line from ${formatNumber(min)} to ${formatNumber(max)} for testing numbers. True at: ${st.trueAt.map((v) => formatNumber(v)).join(', ') || 'none yet'}. False at: ${st.falseAt.map((v) => formatNumber(v)).join(', ') || 'none yet'}.`);
    } else if (mode === 'ray') {
      const edge = dir === 'right' ? W - PAD + 20 : PAD - 20;
      const d = dir === 'right' ? 1 : -1;
      gSet.appendChild(band(sx(at), edge - d * 4));
      gSet.appendChild(s('path', { d: `M${edge - d * 13} ${y0 - 11} L${edge + d * 3} ${y0} L${edge - d * 13} ${y0 + 11} Z`, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      if (!interactive) gMarks.appendChild(endDot(at, closed));
      const sign = dir === 'right' ? (closed ? '\\ge' : '>') : (closed ? '\\le' : '<');
      if (spec.symbols) line.replaceChildren(h('span', { html: mdInline(`$x ${sign} ${texNum(at)}$`) }));
      const words = `every number ${dir === 'right' ? 'greater' : 'less'} than ${formatNumber(at)}, ${closed ? `and ${formatNumber(at)} itself (filled end)` : `but not ${formatNumber(at)} itself (hollow end)`}`;
      setHandle('at', at, closed, `end at ${formatNumber(at)}, ${closed ? 'filled' : 'hollow'}, shading to the ${dir}`);
      svg.setAttribute('aria-label', `A number line from ${formatNumber(min)} to ${formatNumber(max)}. Shaded: ${words}.`);
    } else {
      gSet.appendChild(band(sx(from), sx(to)));
      if (!interactive) { gMarks.appendChild(endDot(from, closedFrom)); gMarks.appendChild(endDot(to, closedTo)); }
      if (spec.symbols) line.replaceChildren(h('span', { html: mdInline(`$${texNum(from)} ${closedFrom ? '\\le' : '<'} x ${closedTo ? '\\le' : '<'} ${texNum(to)}$`) }));
      setHandle('from', from, closedFrom, `left end at ${formatNumber(from)}, ${closedFrom ? 'filled' : 'hollow'}`);
      setHandle('to', to, closedTo, `right end at ${formatNumber(to)}, ${closedTo ? 'filled' : 'hollow'}`);
      svg.setAttribute('aria-label', `A number line from ${formatNumber(min)} to ${formatNumber(max)}. Shaded: from ${formatNumber(from)} (${closedFrom ? 'included' : 'not included'}) to ${formatNumber(to)} (${closedTo ? 'included' : 'not included'}).`);
    }
    for (const t of toggles) t.paint();
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'probe') {
        const list = [...(next.visited || []), ...(next.trueAt || []), ...(next.falseAt || [])];
        for (const v of list) if (typeof v === 'number') visited.add(snap(v));
        if (typeof next.x === 'number') { x = snap(next.x); visited.add(x); }
      } else if (mode === 'ray') {
        if (typeof next.at === 'number') at = snap(next.at);
        if (next.dir === 'left' || next.dir === 'right') dir = next.dir;
        if (next.closed != null) closed = !!next.closed;
      } else {
        if (typeof next.from === 'number') from = snap(next.from);
        if (typeof next.to === 'number') to = snap(next.to);
        if (to <= from) to = snap(from + step);
        if (next.closedFrom != null) closedFrom = !!next.closedFrom;
        if (next.closedTo != null) closedTo = !!next.closedTo;
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const name in handles) handles[name].setEnabled(!readOnly);
      for (const t of toggles) t.btn.disabled = readOnly;
    },
    destroy() { for (const name in handles) handles[name].destroy(); },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'ineq-line — test numbers in −2x < 6', spec: { type: 'ineq-line', mode: 'probe', test: { lhs: '-2x', op: '<', rhs: '6' }, x: 0 } },
  { title: 'ineq-line — draw a one-sided answer', spec: { type: 'ineq-line', mode: 'ray', at: 0, symbols: true } },
  { title: 'ineq-line — draw a two-sided answer', spec: { type: 'ineq-line', mode: 'segment', from: -2, to: 2 } },
  { title: 'ineq-line — a finished picture', spec: { type: 'ineq-line', mode: 'ray', at: -3, dir: 'left', closed: true, static: true } },
];
