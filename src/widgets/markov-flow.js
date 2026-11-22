/**
 * markov-flow — a Markov chain followed as a crowd. Every state is a tank.
 * A crowd (1000 towns, customers, gamblers…) is shared out among the tanks,
 * and at every step a fixed percentage of each tank flows along each arrow.
 * The numbers are expected counts, so nothing here is random: the same start
 * always gives the same picture, and checks may use every number in the state.
 *
 * {
 *   type: 'markov-flow',
 *   states: [{ name: 'Sunny', color: 'yellow' }, { name: 'Rainy', color: 'blue' }],
 *   P: [[0.9, 0.1], [0.5, 0.5]],     // P[i][j]: chance of going from state i to state j in one step (each row adds up to 1)
 *   start: [1000, 0],                // the crowd at step 0; its sum is the size of the crowd
 *   starts: [{ label: 'All sunny', counts: [1000, 0] }, { label: 'All rainy', counts: [0, 1000] }],   // optional start buttons
 *   mode: 'step',                    // 'step': buttons move the crowd on · 'place': a slider shares the crowd between two states
 *   placeStep: 10,                   // place mode: step of the slider
 *   buttons: [1, 10],                // step mode: steps per button
 *   flows: false,                    // write on every arrow how many will move at the next step
 *   chart: true,                     // step mode: a line chart of each state's share over time
 *   chartStates: [0, 1],             // which states get a line (default: all)
 *   ghost: [1000, 0],                // optional: also draw, as dotted grey lines, the run that starts from this crowd
 *   words: { step: 'day', steps: 'days', unit: 'towns' },
 *   maxSteps: 60,
 *   static: false,
 * }
 *
 * The tanks stand in a row, and arrows are drawn between neighbours only: use it for two states, or for
 * longer chains whose moves are between neighbouring states (a random walk, a board-game track). Up to 6 states.
 *
 * State: { step, counts, shown, start, total, flows, net, still, settled, balanced, moving }
 *   counts   — exact expected count in each state · shown — the whole numbers on display (each count rounded)
 *   flows    — flows[i][j]: how many would move from state i to state j at the next step (exact)
 *   net      — per state, what the next step would add (+) or take away (−)
 *   still    — at least one step has been taken, and the last one left every number on display unchanged
 *   settled  — at least one step has been taken, and the numbers on display will never change again
 *              (a number can hold still for a step and then creep on by one; `settled` waits for the end of that)
 *   balanced — the next step would not change any state's count: the crowd is in a steady state
 *   moving   — how many are in states that can still be left (0 once everyone sits in an absorbing state)
 *
 * setState accepts { start: [..], steps: 12 } (step mode: restart from that crowd and take that many steps)
 * and { counts: [..] } (place mode).
 */
import { frame, button, readout, sliderRow, arrowMarker, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('markov-flow', `
  .widget-markov-flow .mf-starts { display: flex; justify-content: center; }
`);

const PALETTE = ['yellow', 'blue', 'green', 'orange', 'violet', 'teal'];
const fmtPct = (v) => `${Math.round(v * 1000) / 10}%`;
const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * The whole numbers put on display: each exact count rounded to the nearest one. (They can add up to one
 * more or less than the crowd. Forcing the sum would make a tank that only ever fills appear to lose someone.)
 */
export function roundCounts(counts) {
  return counts.map((c) => Math.round(c + 1e-9));
}

/** One step of the chain: the new expected counts. */
export function stepCounts(counts, P) {
  const out = new Array(counts.length).fill(0);
  for (let i = 0; i < counts.length; i++) for (let j = 0; j < counts.length; j++) out[j] += counts[i] * P[i][j];
  return out;
}

export default function create(spec, env) {
  const states = (Array.isArray(spec.states) && spec.states.length >= 2 ? spec.states : [{ name: 'A' }, { name: 'B' }]).slice(0, 6)
    .map((st, i) => ({ name: String(st.name != null ? st.name : i), color: st.color || PALETTE[i % PALETTE.length] }));
  const N = states.length;
  const P = Array.from({ length: N }, (_, i) => {
    const row = Array.from({ length: N }, (_, j) => Math.max(0, Number(spec.P && spec.P[i] && spec.P[i][j]) || 0));
    const sum = row.reduce((a, b) => a + b, 0);
    return sum > 0 ? row.map((v) => v / sum) : row.map((_, j) => (j === i ? 1 : 0));
  });
  const place = spec.mode === 'place' && N === 2;
  const isStatic = !!spec.static || env.compact;
  const showFlows = !!spec.flows || place;
  const showChart = !place && spec.chart !== false && !env.compact;
  const chartStates = Array.isArray(spec.chartStates) ? spec.chartStates.filter((i) => i >= 0 && i < N) : states.map((_, i) => i);
  const maxSteps = clamp(Math.round(spec.maxSteps || 60), 5, 400);
  const words = { step: 'step', steps: 'steps', unit: 'people', ...(spec.words || {}) };
  const starts = Array.isArray(spec.starts) ? spec.starts.filter((o) => o && Array.isArray(o.counts) && o.counts.length === N) : [];
  const fit = (arr) => Array.from({ length: N }, (_, i) => Math.max(0, Number(arr && arr[i]) || 0));
  let start = fit(Array.isArray(spec.start) ? spec.start : (starts.length ? starts[0].counts : [1000]));
  const total = start.reduce((a, b) => a + b, 0) || 1000;
  if (!start.some((v) => v > 0)) start[0] = total;
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  let counts = start.slice();
  let step = 0;
  let history = [counts.slice()];   // counts after 0, 1, 2 … steps
  let lastShown = null;             // numbers on display before the latest step
  let ghosts = [];                  // histories of earlier runs

  // a reference run, drawn dotted in the chart for comparison
  let refHist = null;
  if (Array.isArray(spec.ghost) && spec.ghost.length === N) {
    let c = fit(spec.ghost);
    refHist = [c];
    for (let t = 0; t < maxSteps; t++) { c = stepCounts(c, P); refHist.push(c); }
  }

  const absorbing = (i) => P[i][i] > 1 - 1e-12;
  const flowsNow = () => P.map((row, i) => row.map((v) => counts[i] * v));
  function getState() {
    const next = stepCounts(counts, P);
    const net = next.map((v, i) => Math.round((v - counts[i]) * 1e6) / 1e6);
    const shown = roundCounts(counts);
    return {
      step, counts: counts.map((v) => Math.round(v * 1e6) / 1e6), shown, start: start.slice(), total,
      flows: flowsNow().map((row) => row.map((v) => Math.round(v * 1e6) / 1e6)), net,
      still: step > 0 && !!lastShown && shown.every((v, i) => v === lastShown[i]),
      settled: step > 0 && settledAt(counts, shown),
      balanced: net.every((v) => Math.abs(v) <= total * 1e-6),
      moving: Math.round(counts.reduce((t, v, i) => (absorbing(i) ? t : t + v), 0) * 1e6) / 1e6,
    };
  }
  /** Would the numbers on display stay as they are for good? (Looks far enough ahead for any chain that converges.) */
  function settledAt(from, shown) {
    let c = from;
    for (let t = 0; t < 400; t++) {
      c = stepCounts(c, P);
      const r = roundCounts(c);
      if (r.some((v, i) => v !== shown[i])) return false;
    }
    return true;
  }
  function advance(k) {
    for (let i = 0; i < k && step < maxSteps; i++) {
      lastShown = roundCounts(counts);
      counts = stepCounts(counts, P);
      step += 1;
      history.push(counts.slice());
    }
  }
  function reset(keepGhost) {
    if (keepGhost && step > 0) { ghosts.push(history); ghosts = ghosts.slice(-2); }
    counts = start.slice();
    step = 0;
    history = [counts.slice()];
    lastShown = null;
  }

  /* --------------------------------------------------------------- layout */
  const W = 560;
  const T0 = 44;
  const T1 = 152;
  const CH = { l: 48, r: W - 92, t: 214, b: 316 };
  const H = showChart ? 356 : 186;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A chain of states with a crowd shared out among them' });
  const { svg } = fr;
  const pitch = (W - 20) / N;
  const tw = N === 2 ? 124 : N === 3 ? 104 : Math.max(44, Math.min(60, pitch - 46));
  const cxOf = (i) => (N === 2 ? (i === 0 ? 132 : W - 132) : 10 + pitch * (i + 0.5));
  const marker = arrowMarker(svg, 'ink', 6);
  const gStatic = s('g');
  const gLive = s('g');
  const gChart = s('g');
  svg.append(gStatic, gLive, gChart);

  // names, arrows and "stay" labels never change
  states.forEach((st, i) => {
    const x = cxOf(i);
    gStatic.appendChild(s('text.fig-label', { x, y: T0 - 12, 'text-anchor': 'middle' }, st.name));
    const stay = P[i][i];
    // narrow tanks (longer chains) only have room for the short forms
    const stayText = absorbing(i) ? (N > 3 ? 'stays' : 'stays for good') : stay > 0 ? `${fmtPct(stay)} stay` : (N > 3 ? '' : 'nobody stays');
    if (stayText) gStatic.appendChild(s('text.tick-label', { x, y: T1 + 18, 'text-anchor': 'middle', style: 'font-weight:700;fill:var(--ink-2)' }, stayText));
  });
  const arrows = [];
  for (let i = 0; i < N - 1; i++) {
    const a = cxOf(i) + tw / 2 + 5;
    const b = cxOf(i + 1) - tw / 2 - 5;
    for (const [from, to, y, x1, x2, up] of [[i, i + 1, T0 + 30, a, b, true], [i + 1, i, T1 - 30, b, a, false]]) {
      if (!(P[from][to] > 0)) continue;
      gStatic.appendChild(s('line', { x1, x2: x2 + (x2 > x1 ? -3 : 3), y1: y, y2: y, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'marker-end': marker }));
      const label = s('text', { class: N === 2 ? 'fig-label' : 'tick-label', x: (a + b) / 2, y: up ? y - 9 : y + 20, 'text-anchor': 'middle', style: N === 2 ? '' : 'font-weight:800;fill:var(--ink)' });
      const sub = s('text', { class: 'tick-label', x: (a + b) / 2, y: up ? y - 25 : y + 36, 'text-anchor': 'middle', style: 'font-weight:700;fill:var(--ink-2)' });
      gStatic.append(label, sub);
      arrows.push({ from, to, label, sub });
    }
  }

  const tanks = states.map((st, i) => {
    const x = cxOf(i) - tw / 2;
    const fill = s('rect', { x: x + 2, width: tw - 4, rx: 5, fill: hue(st.color, 'soft') });
    const edge = s('line', { x1: x + 3, x2: x + tw - 3, stroke: hue(st.color), 'stroke-width': 4, 'stroke-linecap': 'round' });
    const wall = s('rect', { x, y: T0, width: tw, height: T1 - T0, rx: 9, fill: 'none', stroke: 'var(--ink)', 'stroke-width': absorbing(i) ? 4 : 2.5 });
    // a halo keeps the number readable when the water line runs through it
    const num = s('text', { class: N > 3 ? 'fig-label' : 'fig-label-lg', x: cxOf(i), y: (T0 + T1) / 2 + 6, 'text-anchor': 'middle', style: 'paint-order:stroke;stroke:var(--surface);stroke-width:6px;stroke-linejoin:round' });
    gLive.append(fill, edge, wall, num);
    return { fill, edge, num };
  });

  /* --------------------------------------------------------------- chrome */
  const roStep = readout(words.step, { digits: 0 });
  const roNet = readout(`change in ${states[0].name} next ${words.step}`);
  let stepButtons = [];
  let resetBtn = null;
  let slider = null;
  const startBtns = [];
  if (!isStatic) {
    if (place) {
      fr.readouts.appendChild(roNet.el);
      slider = sliderRow({
        label: `${words.unit} in ${states[0].name}`, min: 0, max: total, step: spec.placeStep || 10, value: counts[0], color: 'blue', digits: 0,
        onInput: (v) => { if (readOnly) return; counts = [v, total - v]; play('tap'); draw(); env.onChange(getState()); },
      });
      fr.controls.appendChild(slider.el);
    } else {
      fr.readouts.appendChild(roStep.el);
      if (starts.length > 1) {
        const seg = h('div.segmented', { role: 'group', 'aria-label': 'Where the crowd starts' });
        starts.forEach((o) => {
          const b = h('button', { type: 'button' }, o.label);
          b.addEventListener('click', () => {
            if (readOnly) return;
            start = fit(o.counts);
            reset(true);
            play('select');
            draw();
            env.onChange(getState());
          });
          startBtns.push({ b, counts: fit(o.counts) });
          seg.appendChild(b);
        });
        fr.controls.appendChild(h('div.mf-starts', seg));
      }
      const sizes = (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10]).filter((k) => k > 0);
      stepButtons = sizes.map((k, i) => button(k === 1 ? `Next ${words.step}` : `${k} ${words.steps}`, () => go(k), { icon: i === 0 ? 'play' : null, variant: i === 0 ? 'primary' : '' }));
      resetBtn = button('Start again', () => { if (readOnly || !step) return; reset(true); play('pop'); draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.append(...stepButtons, resetBtn);
    }
  }

  function go(k) {
    if (readOnly || step >= maxSteps) return;
    advance(k);
    play(k === 1 ? 'tap' : 'tick');
    draw();
    const shown = roundCounts(counts);
    env.announce(`${words.step} ${step}: ${states.map((st, i) => `${st.name} ${shown[i]}`).join(', ')}.`);
    env.onChange(getState());
  }

  /* ----------------------------------------------------------------- draw */
  function linePath(hist, i, sx, sy) {
    let d = '';
    hist.forEach((c, t) => { d += `${t ? 'L' : 'M'}${sx(t).toFixed(1)} ${sy(c[i] / total).toFixed(1)}`; });
    return d;
  }

  function draw() {
    const shown = roundCounts(counts);
    const flows = flowsNow();
    tanks.forEach((tank, i) => {
      const level = clamp(counts[i] / total, 0, 1) * (T1 - T0 - 4);
      tank.fill.setAttribute('y', T1 - 2 - level);
      tank.fill.setAttribute('height', Math.max(0, level));
      tank.edge.setAttribute('y1', T1 - 2 - level);
      tank.edge.setAttribute('y2', T1 - 2 - level);
      tank.edge.setAttribute('visibility', level > 2 ? 'visible' : 'hidden');
      tank.num.textContent = N > 3 ? String(shown[i]) : fmtInt(shown[i]);   // narrow tanks have no room for a thousands comma
    });
    for (const a of arrows) {
      const pct = fmtPct(P[a.from][a.to]);
      const moved = Math.round(flows[a.from][a.to]);
      if (showFlows && N === 2) {
        a.label.textContent = `${fmtInt(moved)} move`;
        a.sub.textContent = `${pct} of ${fmtInt(shown[a.from])}`;
      } else {
        a.label.textContent = pct;
        a.sub.textContent = showFlows ? fmtInt(moved) : '';   // narrow gaps: the bare number of movers
      }
    }

    if (showChart) {
      gChart.replaceChildren();
      const span = Math.max(10, Math.ceil(step / 5) * 5, ...ghosts.map((g) => Math.ceil((g.length - 1) / 5) * 5));
      const sx = (t) => CH.l + (t / span) * (CH.r - CH.l);
      const sy = (v) => CH.b - clamp(v, 0, 1) * (CH.b - CH.t);
      for (const v of [0, 0.5, 1]) {
        gChart.appendChild(s('line.grid-line', { x1: CH.l, x2: CH.r, y1: sy(v), y2: sy(v) }));
        gChart.appendChild(s('text.tick-label', { x: CH.l - 6, y: sy(v) + 4, 'text-anchor': 'end' }, `${v * 100}%`));
      }
      const tickEvery = span <= 20 ? 5 : span <= 60 ? 10 : 50;
      for (let t = 0; t <= span; t += tickEvery) gChart.appendChild(s('text.tick-label', { x: sx(t), y: CH.b + 17, 'text-anchor': 'middle' }, String(t)));
      gChart.appendChild(s('text.axis-label', { x: (CH.l + CH.r) / 2, y: H - 6, 'text-anchor': 'middle' }, `${words.steps} (share of the crowd in each state)`));
      gChart.appendChild(s('line.axis-line', { x1: CH.l, x2: CH.r, y1: CH.b, y2: CH.b }));
      gChart.appendChild(s('line.axis-line', { x1: CH.l, x2: CH.l, y1: CH.t, y2: CH.b }));
      for (const hist of [...(refHist ? [refHist.slice(0, span + 1)] : []), ...ghosts]) {
        for (const i of chartStates) gChart.appendChild(s('path', { d: linePath(hist, i, sx, sy), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', opacity: 0.8 }));
      }
      const ends = [];
      for (const i of chartStates) {
        gChart.appendChild(s('path', { d: linePath(history, i, sx, sy), fill: 'none', stroke: hue(states[i].color), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        gChart.appendChild(s('circle', { cx: sx(step), cy: sy(counts[i] / total), r: 5, fill: hue(states[i].color), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
        ends.push({ i, y: sy(counts[i] / total) + 4 });
      }
      // name each line at its end, nudging labels apart when the lines are close
      ends.sort((a, b) => a.y - b.y);
      for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
      for (const e of ends) gChart.appendChild(s('text.fig-label-sm', { x: Math.min(sx(step) + 10, CH.r + 8), y: e.y, class: `text-${states[e.i].color}` }, states[e.i].name));
    }

    roStep.set(String(step));
    const st = getState();
    roNet.set(st.net[0] === 0 ? '0' : `${st.net[0] > 0 ? '+' : '−'}${fmtInt(Math.abs(st.net[0]))}`);
    for (const b of stepButtons) b.disabled = readOnly || step >= maxSteps;
    if (resetBtn) resetBtn.disabled = readOnly || step === 0;
    for (const { b, counts: c } of startBtns) { b.setAttribute('aria-pressed', String(c.every((v, i) => v === start[i]))); b.disabled = readOnly; }
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${place ? '' : `After ${step} ${step === 1 ? words.step : words.steps}: `}${states.map((s2, i) => `${s2.name} ${shown[i]}`).join(', ')} ${words.unit}.`);
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (place) {
        if (Array.isArray(next.counts)) { const a = clamp(Number(next.counts[0]) || 0, 0, total); counts = [a, total - a]; if (slider) slider.set(a); }
        draw();
        return;
      }
      if (Array.isArray(next.start)) start = fit(next.start);
      ghosts = [];
      reset(false);
      if (next.steps > 0) advance(Math.round(next.steps));
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      draw();
    },
  };
}

export const examples = [
  { title: 'markov-flow — sunny and rainy towns settle down', spec: { type: 'markov-flow', states: [{ name: 'Sunny', color: 'yellow' }, { name: 'Rainy', color: 'blue' }], P: [[0.9, 0.1], [0.5, 0.5]], starts: [{ label: 'All sunny', counts: [1000, 0] }, { label: 'All rainy', counts: [0, 1000] }], words: { step: 'day', steps: 'days', unit: 'towns' } } },
  { title: 'markov-flow — place the crowd so that the flows balance', spec: { type: 'markov-flow', mode: 'place', states: [{ name: 'Brand A', color: 'orange' }, { name: 'Brand B', color: 'teal' }], P: [[0.8, 0.2], [0.3, 0.7]], start: [500, 500], words: { step: 'week', steps: 'weeks', unit: 'customers' } } },
  { title: "markov-flow — gambler's ruin: a walk with two ends that keep you", spec: { type: 'markov-flow', states: [{ name: '0' }, { name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }].map((st, i) => ({ ...st, color: i === 0 ? 'red' : i === 4 ? 'green' : 'blue' })), P: [[1, 0, 0, 0, 0], [0.5, 0, 0.5, 0, 0], [0, 0.5, 0, 0.5, 0], [0, 0, 0.5, 0, 0.5], [0, 0, 0, 0, 1]], start: [0, 1000, 0, 0, 0], chart: false, flows: true, words: { step: 'round', steps: 'rounds', unit: 'gamblers' } } },
];
