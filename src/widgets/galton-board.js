/**
 * galton-board — balls fall through rows of pegs. At every peg a ball bounces
 * right with chance p and left otherwise, so the bin it lands in counts its
 * bounces to the right: a binomial experiment you can watch. Two modes:
 *
 *   'drop'   balls fall at random and pile up in the bins
 *   'steer'  the learner chooses left or right at each peg, and the board
 *            collects every different route found into each bin
 *
 * {
 *   type: 'galton-board',
 *   mode: 'drop',            // or 'steer'
 *   rows: 6,                 // rows of pegs = left/right decisions per ball (1 to 12; steer mode: 1 to 6)
 *   p: 0.5,                  // chance of bouncing RIGHT at each peg
 *   rowsRange: [2, 12],      // drop mode: adds a slider for the number of rows
 *   pRange: [0.1, 0.9],      // drop mode: adds a slider for p (steps of 0.05)
 *   exact: false,            // drop mode: outline the exact binomial shape behind the piles
 *   buttons: [1, 10, 100],   // drop mode: balls per button
 *   max: 2000,               // drop mode: most balls the board holds
 *   target: 2,               // steer mode: the bin whose routes are being collected (highlighted); optional
 *   routes: ['RRLL'],        // steer mode: routes that are already found at the start (for pictures); optional
 *   show: 'RLRR',            // steer mode: a route drawn on the board at the start (for pictures); optional
 *   static: false,           // true: a picture without controls
 * }
 *
 * State: { mode, rows, p, balls, counts, peak, mean, top, routes, byBin, target, found, needed, path }
 *   balls, counts — drop mode: balls dropped so far, and how many sit in each bin (bin k = k bounces to the right)
 *   peak   — the most likely bin according to the binomial distribution (the lower one if two tie); mean = rows × p
 *   top    — the fullest bin so far (null before the first ball). Random: never check it.
 *   routes — steer mode: every different route completed so far, as sorted strings such as 'LRRL'
 *   byBin  — steer mode: how many different routes have been found into each bin
 *   found, needed — steer mode with a target: routes found into the target bin, and how many exist
 *   path   — steer mode: the choices made for the ball that is on its way ('' when none is)
 *
 * setState({ rows, p, balls }) clears the board and drops that many balls; setState({ routes: ['LLRR', …] })
 * sets the routes found in steer mode. Dropped balls are random (env.rng): write checks about `balls`, `rows`,
 * `p` and `peak`, never about `counts`.
 */
import { frame, button, readout, sliderRow, loop, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('galton-board', `
  .widget-galton-board .gb-found { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; min-height: 34px; font-size: var(--fs-sm); font-weight: 700; }
  .widget-galton-board .gb-chip { padding: 2px 8px; border: var(--bw) solid var(--edge); border-radius: 8px; background: var(--yellow-soft); font-family: var(--font-mono); letter-spacing: 0.08em; }
  .widget-galton-board .gb-chip.is-new { background: var(--yellow); color: #1D1B26; border-color: var(--edge-strong); }
  .widget-galton-board .gb-note { color: var(--ink-2); font-weight: 600; }
`);

const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** n choose k (exact for the sizes used here). */
function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let out = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) out = (out * (n - i + 1)) / i;
  return Math.round(out);
}
/** The binomial probabilities P(0), …, P(n). */
export function binomial(n, p) {
  return Array.from({ length: n + 1 }, (_, k) => choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k));
}

export default function create(spec, env) {
  const steer = spec.mode === 'steer';
  const isStatic = !!spec.static || env.compact;
  const rowsLim = steer ? [1, 6] : (Array.isArray(spec.rowsRange) ? [clamp(Math.round(spec.rowsRange[0]), 1, 12), clamp(Math.round(spec.rowsRange[1]), 1, 12)] : [1, 12]);
  const pLim = Array.isArray(spec.pRange) ? spec.pRange : [0.05, 0.95];
  let rows = clamp(Math.round(spec.rows || 6), rowsLim[0], rowsLim[1]);
  let p = clamp(spec.p != null ? Number(spec.p) : 0.5, 0, 1);
  const max = clamp(Math.round(spec.max || 2000), 10, 20000);
  const showExact = !!spec.exact;
  const target = steer && Number.isInteger(spec.target) ? spec.target : null;
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  let counts = new Array(rows + 1).fill(0);
  let balls = 0;
  let lastPath = null;          // the most recent ball's route (drawn on the board)
  let lastNew = false;          // steer mode: did that ball find a new route?
  let path = '';                // steer mode: choices so far for the ball on its way
  let routes = new Set();       // steer mode: distinct routes found
  let note = '';

  const rightsOf = (route) => route.split('').filter((c) => c === 'R').length;
  const validRoute = (route) => route.length === rows && /^[LR]+$/.test(route);
  if (steer && Array.isArray(spec.routes)) routes = new Set(spec.routes.map((route) => String(route).toUpperCase()).filter(validRoute));
  if (steer && typeof spec.show === 'string' && validRoute(spec.show.toUpperCase())) lastPath = spec.show.toUpperCase();

  /* --------------------------------------------------------------- layout */
  const W = 560;
  const H = 400;
  const BINS_TOP = 222;
  const BIN_H = 122;
  const BASE = BINS_TOP + BIN_H + 8;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A board of pegs with bins underneath' });
  const { svg } = fr;
  const gBoard = s('g');
  const gBars = s('g');
  const gPath = s('g');
  const ball = s('circle', { r: 9, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5, visibility: 'hidden' });
  svg.append(gBoard, gBars, gPath, ball);

  let geo = null;
  function layout() {
    const dx = Math.min(72, (W - 40) / (rows + 1));
    const dy = Math.min(44, 186 / rows);
    const pegTop = BINS_TOP - 8 - rows * dy;
    geo = {
      dx, dy, pegTop,
      peg: (r, i) => ({ x: W / 2 + (i - r / 2) * dx, y: pegTop + r * dy }),
      binX: (k) => W / 2 + (k - rows / 2) * dx,
      pegR: Math.max(3.5, Math.min(7, dy * 0.2)),
      ballR: Math.max(5, Math.min(10, dy * 0.3, dx * 0.2)),
    };
  }

  /** Where a ball is after each of its bounces: above the top peg, beside each peg it has hit, then in its bin. */
  function waypoints(route) {
    const pts = [{ x: W / 2, y: geo.pegTop - geo.dy * 0.55 - 6 }];
    let k = 0;
    for (let r = 0; r < route.length; r++) {
      if (route[r] === 'R') k++;
      const y = r + 1 < rows ? geo.pegTop + (r + 1) * geo.dy - geo.pegR - geo.ballR - 1 : BINS_TOP + 6;
      pts.push({ x: W / 2 + (k - (r + 1) / 2) * geo.dx, y });
    }
    return pts;
  }

  function drawBoard() {
    gBoard.replaceChildren();
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i <= r; i++) {
        const q = geo.peg(r, i);
        gBoard.appendChild(s('circle', { cx: q.x, cy: q.y, r: geo.pegR, fill: 'var(--ink)' }));
      }
    }
    // bins: walls, a tint for the target, labels
    for (let k = 0; k <= rows; k++) {
      const x = geo.binX(k);
      if (k === target) gBoard.appendChild(s('rect', { x: x - geo.dx / 2 + 2, y: BINS_TOP, width: geo.dx - 4, height: BASE - BINS_TOP, rx: 4, fill: hue('yellow', 'soft') }));
      gBoard.appendChild(s('text.tick-label', { x, y: BASE + 17, 'text-anchor': 'middle', style: k === target ? 'font-weight:800;fill:var(--ink)' : 'font-weight:700' }, String(k)));
    }
    for (let k = 0; k <= rows + 1; k++) {
      const x = W / 2 + (k - (rows + 1) / 2) * geo.dx;
      gBoard.appendChild(s('line', { x1: x, x2: x, y1: BINS_TOP + 4, y2: BASE, stroke: 'var(--hair)', 'stroke-width': 2 }));
    }
    gBoard.appendChild(s('line.axis-line', { x1: W / 2 - ((rows + 1) / 2) * geo.dx - 4, x2: W / 2 + ((rows + 1) / 2) * geo.dx + 4, y1: BASE, y2: BASE }));
    gBoard.appendChild(s('text.axis-label', { x: W / 2, y: BASE + 36, 'text-anchor': 'middle' }, 'bin = number of bounces to the right'));
    if (!steer && !env.compact) {
      const pct = (v) => `${Math.round(v * 100)}%`;
      gBoard.appendChild(s('text.fig-label-sm', { x: 12, y: 20 }, `left ${pct(1 - p)}`));
      gBoard.appendChild(s('text.fig-label-sm', { x: W - 12, y: 20, 'text-anchor': 'end' }, `right ${pct(p)}`));
    }
  }

  function drawBars() {
    gBars.replaceChildren();
    const slot = geo.dx - 8;
    if (steer) {
      const byBin = binCounts();
      const most = Math.max(1, ...Array.from({ length: rows + 1 }, (_, k) => choose(rows, k)));
      // the top of each bin is kept free for the ball that has just landed; the count sits on top of its stack
      const r = Math.min(geo.ballR, (BIN_H - 46) / (2 * most));
      for (let k = 0; k <= rows; k++) {
        const x = geo.binX(k);
        for (let i = 0; i < byBin[k]; i++) {
          gBars.appendChild(s('circle', { cx: x, cy: BASE - 2 - r - i * 2 * r, r: r - 0.5, fill: hue(k === target ? 'orange' : 'blue'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 }));
        }
        gBars.appendChild(s('text.fig-label', { x, y: BASE - 2 - byBin[k] * 2 * r - 6, 'text-anchor': 'middle' }, String(byBin[k])));
      }
      return;
    }
    const probs = binomial(rows, p);
    const pMax = Math.max(...probs);
    const top = Math.max(...counts);
    const unit = BIN_H / Math.max(10, top, balls * pMax * 1.1);
    for (let k = 0; k <= rows; k++) {
      const x = geo.binX(k);
      if (showExact) {
        const hh = balls ? Math.min(BIN_H, balls * probs[k] * unit) : (probs[k] / pMax) * BIN_H * 0.85;
        if (hh > 0.5) gBars.appendChild(s('rect', { x: x - slot / 2, y: BASE - hh, width: slot, height: hh, rx: 2, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
      }
      const bh = counts[k] * unit;
      if (counts[k]) {
        gBars.appendChild(s('rect', { x: x - slot / 2 + 2, y: BASE - bh, width: slot - 4, height: Math.max(1.5, bh), rx: 2, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': rows > 9 ? 1.5 : 2.5 }));
        gBars.appendChild(s('text.tick-label', { x, y: Math.max(BINS_TOP + 12, BASE - bh - 5), 'text-anchor': 'middle', style: 'font-weight:800;fill:var(--ink)' }, String(counts[k])));
      }
    }
  }

  function drawPath(route, upTo = null) {
    gPath.replaceChildren();
    if (!route && (!steer || isStatic)) { ball.setAttribute('visibility', 'hidden'); return; }
    const pts = waypoints(route || '').slice(0, (upTo == null ? (route || '').length : upTo) + 1);
    if (pts.length > 1) {
      gPath.appendChild(s('polyline', { points: pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' '), fill: 'none', stroke: hue('orange'), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.85 }));
    }
    const end = pts[pts.length - 1];
    ball.setAttribute('r', geo.ballR);
    ball.setAttribute('cx', end.x);
    ball.setAttribute('cy', end.y);
    ball.setAttribute('visibility', 'visible');
  }

  /* --------------------------------------------------------------- chrome */
  const roBalls = readout('balls', { digits: 0 });
  const roMean = readout('rows × chance of right', { digits: 2 });
  const found = h('div.gb-found', { 'aria-live': 'polite' });
  let rowsRow = null;
  let pRow = null;
  let dropButtons = [];
  let resetBtn = null;
  let leftBtn = null;
  let rightBtn = null;

  if (!isStatic) {
    if (steer) {
      fr.el.insertBefore(found, fr.readouts);
      leftBtn = button('Left', () => choice('L'), { icon: 'arrow-left' });
      rightBtn = button('Right', () => choice('R'), { icon: 'arrow-right' });
      resetBtn = button('Clear', () => clear(), { icon: 'reset', variant: 'ghost' });
      for (const b of [leftBtn, rightBtn]) {
        b.dataset.keys = 'own';
        b.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowLeft') { ev.preventDefault(); choice('L'); } else if (ev.key === 'ArrowRight') { ev.preventDefault(); choice('R'); }
        });
      }
      fr.buttons.append(leftBtn, rightBtn, resetBtn);
    } else {
      fr.readouts.appendChild(roBalls.el);
      if (showExact) fr.readouts.appendChild(roMean.el);
      if (Array.isArray(spec.rowsRange) && rowsLim[1] > rowsLim[0]) {
        rowsRow = sliderRow({ label: 'rows of pegs', min: rowsLim[0], max: rowsLim[1], step: 1, value: rows, color: 'blue', onInput: (v) => { if (readOnly) return; rows = v; rebuild(true); } });
        fr.controls.appendChild(rowsRow.el);
      }
      if (Array.isArray(spec.pRange)) {
        pRow = sliderRow({ label: 'chance of right', min: pLim[0], max: pLim[1], step: 0.05, value: p, color: 'orange', digits: 2, onInput: (v) => { if (readOnly) return; p = v; rebuild(true); } });
        fr.controls.appendChild(pRow.el);
      }
      const sizes = (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10, 100]).filter((k) => k > 0 && k <= max);
      dropButtons = sizes.map((k, i) => button(`Drop ${fmtInt(k)}`, () => drop(k), { icon: i === 0 ? 'arrow-down' : null, variant: i === sizes.length - 1 ? 'primary' : '' }));
      resetBtn = button('Empty', () => empty(), { icon: 'reset', variant: 'ghost' });
      fr.buttons.append(...dropButtons, resetBtn);
    }
  }

  /* ---------------------------------------------------------------- state */
  function binCounts() {
    const out = new Array(rows + 1).fill(0);
    for (const route of routes) out[rightsOf(route)] += 1;
    return out;
  }
  function peakBin() {
    const probs = binomial(rows, p);
    let best = 0;
    for (let k = 1; k <= rows; k++) if (probs[k] > probs[best] + 1e-12) best = k;
    return best;
  }
  function getState() {
    let top = null;
    if (balls) { top = 0; for (let k = 1; k <= rows; k++) if (counts[k] > counts[top]) top = k; }
    const state = { mode: steer ? 'steer' : 'drop', rows, p, balls, counts: counts.slice(), peak: peakBin(), mean: Math.round(rows * p * 1e6) / 1e6, top };
    if (steer) {
      const byBin = binCounts();
      Object.assign(state, {
        routes: Array.from(routes).sort(), byBin, target, path,
        found: target == null ? routes.size : byBin[target],
        needed: target == null ? Math.pow(2, rows) : choose(rows, target),
      });
    }
    return state;
  }

  function sync() {
    const full = balls >= max;
    for (const b of dropButtons) b.disabled = readOnly || full;
    if (resetBtn) resetBtn.disabled = readOnly || (steer ? routes.size === 0 && !path : balls === 0);
    if (leftBtn) leftBtn.disabled = readOnly;
    if (rightBtn) rightBtn.disabled = readOnly;
    roBalls.set(fmtInt(balls));
    roMean.set(rows * p);
    if (steer) {
      const list = Array.from(routes).filter((route) => target == null || rightsOf(route) === target).sort().reverse();
      const kids = [];
      if (target != null) kids.push(h('span', `Routes into bin ${target}: ${list.length ? '' : 'none yet'}`));
      else if (!list.length) kids.push(h('span', 'Routes found: none yet'));
      for (const route of list) kids.push(h('span', { class: `gb-chip${route === lastPath && lastNew ? ' is-new' : ''}` }, route));
      if (note) kids.push(h('span.gb-note', note));
      found.replaceChildren(...kids);
    }
    const st = getState();
    svg.setAttribute('aria-label', steer
      ? `A board with ${rows} rows of pegs. Different routes found into bins 0 to ${rows}: ${st.byBin.join(', ')}.${path ? ` The ball has gone ${path.split('').map((c) => (c === 'L' ? 'left' : 'right')).join(', ')}.` : ''}`
      : `A board with ${rows} rows of pegs; each bounce goes right with chance ${Math.round(p * 100)}%. ${balls ? `${fmtInt(balls)} balls dropped. Balls in bins 0 to ${rows}: ${counts.join(', ')}.` : 'No balls dropped yet.'}`);
  }

  const anim = loop((dt, t) => {
    if (!lastPath) { anim.stop(); return; }
    const pts = waypoints(lastPath);
    const at = t / 0.085;                   // waypoints passed
    if (at >= pts.length - 1) { anim.stop(); drawPath(lastPath); drawBars(); return; }
    const i = Math.floor(at);
    const f = at - i;
    drawPath(lastPath, i);
    ball.setAttribute('cx', pts[i].x + (pts[i + 1].x - pts[i].x) * f);
    ball.setAttribute('cy', pts[i].y + (pts[i + 1].y - pts[i].y) * f);
  });

  function render() {
    anim.stop();
    drawBars();
    drawPath(steer ? (path || lastPath || '') : lastPath);
    sync();
  }

  function rebuild(byLearner) {
    anim.stop();
    counts = new Array(rows + 1).fill(0);
    balls = 0;
    lastPath = null;
    layout();
    drawBoard();
    render();
    if (byLearner) { play('tap'); env.onChange(getState()); }
  }

  function simulate(k) {
    for (let i = 0; i < k && balls < max; i++) {
      let route = '';
      let bin = 0;
      for (let r = 0; r < rows; r++) { if (env.rng.next() < p) { route += 'R'; bin++; } else route += 'L'; }
      counts[bin] += 1;
      balls += 1;
      lastPath = route;
    }
  }

  function drop(k) {
    if (readOnly || balls >= max) return;
    const before = balls;
    simulate(k);
    play(k === 1 ? 'drop' : 'tick');
    if (balls - before === 1 && !reducedMotion()) {
      // show the pile without the newest ball, let it fall, then add it
      const bin = rightsOf(lastPath);
      counts[bin] -= 1; drawBars(); counts[bin] += 1;
      sync();
      anim.stop(); anim.reset(); anim.start();
    } else {
      if (balls - before > 1) lastPath = null;    // a single ball shows its route; a shower of balls does not
      render();
    }
    env.announce(lastPath ? `The ball lands in bin ${rightsOf(lastPath)}.` : `${fmtInt(balls)} balls dropped.`);
    env.onChange(getState());
  }

  function empty() {
    if (readOnly || !balls) return;
    rebuild(false);
    play('pop');
    env.onChange(getState());
  }

  function choice(c) {
    if (readOnly) return;
    note = '';
    if (!path) lastPath = null;
    path += c;
    if (path.length >= rows) {
      lastNew = !routes.has(path);
      if (lastNew) routes.add(path); else note = `You already have ${path}.`;
      lastPath = path;
      path = '';
      play(lastNew ? 'drop' : 'tap');
      env.announce(`The ball lands in bin ${rightsOf(lastPath)}. ${lastNew ? 'A new route.' : 'You already had this route.'}`);
    } else {
      play('tap');
    }
    render();
    env.onChange(getState());
  }

  function clear() {
    if (readOnly) return;
    routes = new Set();
    path = '';
    lastPath = null;
    note = '';
    play('pop');
    render();
    env.onChange(getState());
  }

  layout();
  drawBoard();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (steer) {
        if (Array.isArray(next.routes)) {
          routes = new Set(next.routes.map((route) => String(route).toUpperCase()).filter((route) => route.length === rows && /^[LR]+$/.test(route)));
          path = '';
          lastPath = null;
          note = '';
        }
        render();
        return;
      }
      if (next.rows != null) { rows = clamp(Math.round(next.rows), rowsLim[0], rowsLim[1]); if (rowsRow) rowsRow.set(rows); }
      if (next.p != null) { p = clamp(Number(next.p), 0, 1); if (pRow) pRow.set(p); }
      rebuild(false);
      if (next.balls > 0) { simulate(Math.min(max, Math.round(next.balls))); lastPath = null; render(); }
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (rowsRow) rowsRow.setDisabled(readOnly);
      if (pRow) pRow.setDisabled(readOnly);
      sync();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'galton-board — drop balls and watch the pile', spec: { type: 'galton-board', rows: 8, rowsRange: [2, 12], pRange: [0.1, 0.9], exact: true } },
  { title: 'galton-board — steer: find every route into bin 2', spec: { type: 'galton-board', mode: 'steer', rows: 4, target: 2 } },
  { title: 'galton-board — a lopsided board', spec: { type: 'galton-board', rows: 10, p: 0.2, buttons: [10, 100, 1000] } },
];
