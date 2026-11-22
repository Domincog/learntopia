/**
 * ev-game — a game of chance the learner plays for coins. Spin the wheel
 * once, or 10 or 100 times, and watch the average result per game settle
 * toward the game's expected value. An optional slider sets the price of a
 * game, so the learner can hunt for the price that makes the game fair: the
 * whole curve slides up and down as the price changes.
 *
 * {
 *   type: 'ev-game',
 *   outcomes: [                         // the sections of the wheel
 *     { label: 'Gold', p: 1, prize: 12, color: 'yellow' },    // p is a weight: the chance is p / (sum of all p)
 *     { label: 'Blank', p: 5, prize: 0, color: 'gray' },
 *   ],
 *   slices: 6,                          // optional: draw the wheel as this many equal slices (weights should add up to it)
 *   price: 3,                           // cost of one game
 *   priceEdit: { min: 0, max: 6, step: 0.5 },   // optional: a slider for the price
 *   unit: 'coins',
 *   buttons: [1, 10, 100],              // games per button
 *   max: 10000,                         // cap on games, and the right-hand end of the chart
 *   showEV: false,                      // draw the expected value as a dashed line
 *   yRange: 5,                          // chart shows averages from −yRange to +yRange (chosen automatically if omitted)
 *   static: false,                      // true: a picture of the wheel only, with no chart and no buttons
 * }
 *
 * State: { plays, prizes, net, average, price, payout, ev, fair, counts: [one per outcome] }
 *   prizes  — coins won so far, before paying for the games; net = prizes − plays · price
 *   average — net / plays, the average result per game so far (0 before the first game)
 *   payout  — expected prize per game (sum of prize × chance); ev = payout − price; fair = (ev is zero)
 *
 * setState({ price: 2, plays: 300 }) sets the price and re-plays that many games, so a lesson's `solution`
 * needs no results. Results are random: write checks about `plays`, `price` and `fair`, never about `net`.
 */
import { frame, button, readout, sliderRow, loop, hue, s, h, cx, clamp, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('ev-game', `
  .widget-ev-game .ev-tape { display: flex; justify-content: flex-end; align-items: center; gap: 4px; min-height: 34px; min-width: 0; overflow: hidden; }
  .widget-ev-game .ev-chip {
    flex: none; display: grid; place-items: center;
    min-width: 34px; height: 30px; padding: 0 6px;
    border: var(--bw) solid var(--hair); border-radius: 8px;
    background: var(--accent-soft); color: var(--accent-text);
    font-weight: 800; font-size: var(--fs-sm); font-variant-numeric: tabular-nums;
  }
  .widget-ev-game .ev-chip.is-last { border-color: var(--edge-strong); background: var(--accent); color: #1D1B26; }
  .widget-ev-game .ev-empty { flex: 1; text-align: center; color: var(--ink-3); font-size: var(--fs-sm); }
  .widget-ev-game.is-readonly .w-buttons { opacity: 0.5; pointer-events: none; }
`);

const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const signed = (v, digits = 2) => (v > 0 ? '+' : '') + formatNumber(v, digits);
const niceCeil = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };

export default function create(spec, env) {
  const raw = (spec.outcomes || [{ label: 'Win', p: 1, prize: 2, color: 'green' }, { label: 'Lose', p: 1, prize: 0, color: 'gray' }]).filter((o) => o && o.p > 0);
  const weight = raw.reduce((t, o) => t + o.p, 0);
  const outcomes = raw.map((o, i) => ({ label: String(o.label), p: o.p / weight, w: o.p, prize: Number(o.prize) || 0, color: o.color || ['blue', 'orange', 'green', 'violet'][i % 4] }));
  const n = outcomes.length;
  const payout = outcomes.reduce((t, o) => t + o.p * o.prize, 0);
  const unit = spec.unit || 'coins';
  const max = clamp(Math.round(spec.max || 10000), 10, 100000);
  const edit = spec.priceEdit || null;
  let price = Number(spec.price) || 0;
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  const results = new Uint8Array(max);
  const cum = new Float64Array(max + 1);   // prize money after the first i games
  let counts = new Array(n).fill(0);
  let plays = 0;
  let shown = 0;                           // games already revealed (the latest spin may still be turning)

  function simulate(k) {
    for (let i = 0; i < k && plays < max; i++) {
      let u = env.rng.next();
      let o = n - 1;
      for (let j = 0; j < n; j++) { u -= outcomes[j].p; if (u < 0) { o = j; break; } }
      results[plays] = o;
      counts[o] += 1;
      plays += 1;
      cum[plays] = cum[plays - 1] + outcomes[o].prize;
    }
  }

  /* ---------------------------------------------------------------- wheel */
  const pictureOnly = !!spec.static || env.compact;   // just the wheel: no chart, no buttons
  const W = pictureOnly ? 208 : 560;
  const H = pictureOnly ? 240 : 268;
  const fr = frame({ width: W, height: H, compact: env.compact, plain: pictureOnly, maxWidth: pictureOnly ? 230 : null, label: spec.alt || 'Game of chance' });
  const { svg } = fr;
  const C = { x: 104, y: 138, r: 86 };
  const gWheel = s('g');
  const slices = [];                       // { from, to, outcome } in degrees clockwise from the top
  const total = Number.isInteger(spec.slices) && spec.slices > 0 && Math.abs(weight - spec.slices) < 1e-9 ? spec.slices : 0;
  let at = 0;
  outcomes.forEach((o, i) => {
    const parts = total ? Math.round(o.w) : 1;
    const sweep = (o.p * 360) / parts;
    for (let k = 0; k < parts; k++) { slices.push({ from: at, to: at + sweep, outcome: i }); at += sweep; }
  });
  const polar = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [C.x + r * Math.cos(a), C.y + r * Math.sin(a)]; };
  const prizeLabels = [];                  // turned back as the wheel turns, so the numbers stay upright
  for (const sl of slices) {
    const o = outcomes[sl.outcome];
    const [x1, y1] = polar(sl.from, C.r);
    const [x2, y2] = polar(sl.to, C.r);
    const whole = sl.to - sl.from >= 359.99;
    const d = whole
      ? `M${C.x - C.r} ${C.y} a${C.r} ${C.r} 0 1 0 ${2 * C.r} 0 a${C.r} ${C.r} 0 1 0 ${-2 * C.r} 0`
      : `M${C.x} ${C.y} L${x1.toFixed(2)} ${y1.toFixed(2)} A${C.r} ${C.r} 0 ${sl.to - sl.from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    gWheel.appendChild(s('path', { d, fill: hue(o.color, o.prize > 0 ? '' : 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    if (sl.to - sl.from >= 20) {
      const [tx, ty] = polar((sl.from + sl.to) / 2, C.r * 0.64);
      const text = s('text.fig-label', { x: tx, y: ty + 6, 'text-anchor': 'middle', style: o.prize > 0 ? 'fill:#1D1B26;stroke:none' : 'stroke:none' }, formatNumber(o.prize, 2));
      prizeLabels.push({ text, x: tx, y: ty });
      gWheel.appendChild(text);
    }
  }
  gWheel.appendChild(s('circle', { cx: C.x, cy: C.y, r: 9, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  svg.appendChild(gWheel);
  svg.appendChild(s('path', { d: `M${C.x - 13} ${C.y - C.r - 20} H${C.x + 13} L${C.x} ${C.y - C.r + 6} Z`, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));

  let rot = 0;        // current rotation of the wheel, degrees
  let rotTo = 0;
  let rotFrom = 0;
  let spinT = 1;      // 0 → 1 progress of the current spin
  const setRot = (deg) => {
    rot = deg;
    gWheel.setAttribute('transform', `rotate(${deg.toFixed(2)} ${C.x} ${C.y})`);
    for (const l of prizeLabels) l.text.setAttribute('transform', `rotate(${(-deg).toFixed(2)} ${l.x.toFixed(2)} ${l.y.toFixed(2)})`);
  };

  /** Where the wheel must stop so that the pointer rests on a slice of this outcome. */
  function restFor(outcome) {
    const mine = slices.filter((sl) => sl.outcome === outcome);
    const sl = mine[env.rng.int(0, mine.length - 1)];
    const inside = sl.from + (sl.to - sl.from) * env.rng.float(0.15, 0.85);
    return -inside;
  }

  /* ---------------------------------------------------------------- chart */
  const gChart = s('g');
  if (!pictureOnly) svg.appendChild(gChart);
  const box = { l: 272, r: 560 - 58, t: 44, b: 196 };
  const top = spec.yRange > 0 ? spec.yRange : niceCeil(1.25 * Math.max(payout, edit ? edit.max : price, 1));
  const decades = Math.log10(max);
  const lx = (i) => box.l + (Math.log10(Math.max(1, i)) / decades) * (box.r - box.l);
  const ly = (v) => box.b - ((clamp(v, -top, top) + top) / (2 * top)) * (box.b - box.t);
  for (const v of [-top, -top / 2, 0, top / 2, top]) {
    if (v !== 0) gChart.appendChild(s('line.grid-line', { x1: box.l, x2: box.r, y1: ly(v), y2: ly(v) }));
    if (Math.abs(v) !== top / 2) gChart.appendChild(s('text.tick-label', { x: box.l - 7, y: ly(v) + 4, 'text-anchor': 'end' }, signed(v, 2).replace('-', '−')));
  }
  for (let k = 0; k <= Math.floor(decades + 1e-9); k++) {
    const x = lx(Math.pow(10, k));
    gChart.appendChild(s('line.grid-line', { x1: x, x2: x, y1: box.t, y2: box.b }));
    gChart.appendChild(s('text.tick-label', { x, y: box.b + 19, 'text-anchor': 'middle' }, k >= 3 ? `${Math.pow(10, k - 3)}k` : String(Math.pow(10, k))));
  }
  gChart.appendChild(s('text.axis-label', { x: box.l - 34, y: box.t - 16 }, `Average result per game (${unit})`));
  gChart.appendChild(s('text.axis-label', { x: (box.l + box.r) / 2, y: box.b + 43, 'text-anchor': 'middle' }, 'number of games (k = thousand)'));
  gChart.appendChild(s('line.axis-line', { x1: box.l, x2: box.l, y1: box.t, y2: box.b }));
  gChart.appendChild(s('line.axis-line', { x1: box.l, x2: box.r + 4, y1: ly(0), y2: ly(0) }));
  const evenLabel = s('g',
    s('text.tick-label', { x: box.r + 8, y: ly(0) - 3, style: 'font-weight:800;fill:var(--ink)' }, 'break'),
    s('text.tick-label', { x: box.r + 8, y: ly(0) + 12, style: 'font-weight:800;fill:var(--ink)' }, 'even'));
  const evLine = s('line', { x1: box.l, x2: box.r + 4, stroke: hue('violet'), 'stroke-width': 2, 'stroke-dasharray': '6 5' });
  const evLabel = s('text.tick-label', { x: box.r + 8, style: `font-weight:800;fill:${hue('violet', 'text')}` });
  const path = s('path', { fill: 'none', stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  const dot = s('circle', { r: 6, fill: hue('violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5, visibility: 'hidden' });
  gChart.appendChild(evenLabel);
  if (spec.showEV) gChart.append(evLine, evLabel);
  gChart.append(path, dot);

  const next = (i) => (i < 300 ? i + 1 : Math.ceil(i * 1.012));
  function pathTo(m) {
    let d = '';
    let last = 0;
    for (let i = 1; i <= m; i = next(i)) { d += `${d ? 'L' : 'M'}${lx(i).toFixed(1)} ${ly(cum[i] / i - price).toFixed(1)}`; last = i; }
    if (m > 0 && last !== m) d += `L${lx(m).toFixed(1)} ${ly(cum[m] / m - price).toFixed(1)}`;
    return d;
  }

  /* --------------------------------------------------------------- chrome */
  const tape = h('div.ev-tape', { 'aria-hidden': 'true' });
  if (!pictureOnly) fr.el.insertBefore(tape, fr.canvas);
  const roPlays = readout('games', { digits: 0 });
  const roNet = readout(`total (${unit})`);
  const roAvg = readout('average per game');
  if (!pictureOnly) fr.readouts.append(roPlays.el, roNet.el, roAvg.el);

  let slider = null;
  if (edit && !pictureOnly) {
    slider = sliderRow({
      label: 'price of one game', min: edit.min, max: edit.max, step: edit.step || 1, value: price, unit, color: 'violet',
      onInput: (v) => { if (readOnly) return; price = v; draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(slider.el);
  }

  const sizes = (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10, 100]).filter((k) => k > 0 && k <= max);
  const runButtons = sizes.map((k, i) => button(k === 1 ? 'Play once' : `Play ${fmtInt(k)}`, () => run(k), { icon: i === 0 ? 'play' : null, variant: i === sizes.length - 1 ? 'primary' : '' }));
  const resetBtn = button('Start again', () => restart(), { icon: 'reset', variant: 'ghost' });
  const note = h('p.w-hint');
  if (!pictureOnly) {
    fr.buttons.append(...runButtons, resetBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------------- draw */
  function sync() {
    const full = plays >= max;
    for (const b of runButtons) b.disabled = readOnly || full;
    resetBtn.disabled = readOnly || plays === 0;
    note.textContent = full ? 'That is as many games as this table can hold. Start again for a fresh run.' : '';
  }

  function draw() {
    const net = cum[shown] - shown * price;
    path.setAttribute('d', pathTo(shown));
    dot.setAttribute('visibility', shown ? 'visible' : 'hidden');
    if (shown) { dot.setAttribute('cx', lx(shown)); dot.setAttribute('cy', ly(net / shown)); }
    const ev = payout - price;
    evLine.setAttribute('y1', ly(ev));
    evLine.setAttribute('y2', ly(ev));
    evLabel.setAttribute('y', ly(ev) + 4);
    evLabel.textContent = signed(ev, 2).replace('-', '−');
    evenLabel.setAttribute('visibility', spec.showEV && Math.abs(ly(ev) - ly(0)) < 30 ? 'hidden' : 'visible');

    roPlays.set(fmtInt(shown));
    roNet.set(signed(net, 2));
    roAvg.set(shown ? signed(net / shown, 2) : '—');

    tape.replaceChildren();
    if (!shown) tape.appendChild(h('div.ev-empty', 'Your results appear here, game by game.'));
    for (let i = Math.max(0, shown - 12); i < shown; i++) {
      const gain = outcomes[results[i]].prize - price;
      tape.appendChild(h('span', { class: cx('ev-chip', gain > 0 ? 'hue-green' : gain < 0 ? 'hue-red' : 'hue-gray', i === shown - 1 && 'is-last') }, signed(gain, 2)));
    }
    sync();
    svg.setAttribute('aria-label', shown
      ? `${fmtInt(shown)} games played. Total ${signed(net, 2)} ${unit}, average ${signed(net / shown, 2)} per game.`
      : `${spec.alt || 'Game of chance'}. No games played yet.`);
  }

  const spin = loop((dt) => {
    spinT = Math.min(1, spinT + dt / 1.1);
    const ease = 1 - Math.pow(1 - spinT, 3);
    setRot(rotFrom + (rotTo - rotFrom) * ease);
    if (spinT >= 1) { spin.stop(); shown = plays; draw(); }
  });
  /** Jump straight to the end of a spin that is still turning. */
  function settle() {
    if (spin.running) { spin.stop(); spinT = 1; setRot(rotTo); }
    shown = plays;
  }

  /* -------------------------------------------------------------- actions */
  function run(k) {
    if (readOnly || plays >= max) return;
    settle();
    const before = plays;
    simulate(k);
    const rest = restFor(results[plays - 1]);
    // always turn clockwise, at least two full turns, and stop on the winning slice
    rotFrom = rot;
    rotTo = rot + 720 + ((((rest - rot) % 360) + 360) % 360);
    if (plays - before === 1 && !reducedMotion()) {
      play('tick');
      spinT = 0;
      sync();
      spin.start();
    } else {
      play(k === 1 ? 'tap' : 'tick');
      setRot(rotTo % 360);
      rotTo = rot;
      shown = plays;
      draw();
    }
    const last = outcomes[results[plays - 1]];
    env.announce(plays - before === 1
      ? `${last.label}: ${signed(last.prize - price, 2)} ${unit}.`
      : `${fmtInt(plays)} games. Average ${signed((cum[plays] - plays * price) / plays, 2)} ${unit} per game.`);
    env.onChange(getState());
  }

  function wipe() {
    counts = new Array(n).fill(0);
    plays = 0;
    shown = 0;
  }
  function restart() {
    if (readOnly || !plays) return;
    settle();
    wipe();
    play('pop');
    draw();
    env.onChange(getState());
  }

  function getState() {
    const net = cum[plays] - plays * price;
    const ev = payout - price;
    return {
      plays,
      prizes: cum[plays],
      net: Math.round(net * 1e6) / 1e6,
      average: plays ? Math.round((net / plays) * 1e6) / 1e6 : 0,
      price,
      payout: Math.round(payout * 1e9) / 1e9,
      ev: Math.round(ev * 1e9) / 1e9,
      fair: Math.abs(ev) < 1e-9,
      counts: counts.slice(),
    };
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(to) {
      if (!to) return;
      settle();
      if (typeof to.price === 'number') { price = to.price; if (slider) slider.set(price); }
      if (to.plays >= 0) {
        wipe();
        simulate(Math.min(max, Math.round(to.plays)));
        shown = plays;
        if (plays) setRot((((restFor(results[plays - 1])) % 360) + 360) % 360);
        rotTo = rot;
      }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      sync();
    },
    destroy() { spin.stop(); },
  };
}

export const examples = [
  {
    title: 'ev-game — one gold slice in six pays 12 coins; a game costs 3',
    spec: { type: 'ev-game', slices: 6, price: 3, outcomes: [{ label: 'Gold', p: 1, prize: 12, color: 'yellow' }, { label: 'Blank', p: 5, prize: 0, color: 'gray' }] },
  },
  {
    title: 'ev-game — find the fair price',
    spec: {
      type: 'ev-game', price: 5, priceEdit: { min: 0, max: 8, step: 0.5 }, showEV: true, buttons: [1, 10, 100, 1000],
      outcomes: [{ label: 'Red', p: 2, prize: 0, color: 'red' }, { label: 'Blue', p: 1, prize: 4, color: 'blue' }, { label: 'Green', p: 1, prize: 12, color: 'green' }],
    },
  },
  {
    title: 'ev-game — static picture of a wheel',
    spec: { type: 'ev-game', static: true, slices: 6, price: 3, outcomes: [{ label: 'Gold', p: 1, prize: 12, color: 'yellow' }, { label: 'Blank', p: 5, prize: 0, color: 'gray' }], alt: 'A wheel with six equal slices. One is gold and marked 12; the other five are marked 0.' },
  },
];
