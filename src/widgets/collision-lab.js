/**
 * collision-lab — two carts on a frictionless track. Set their masses and
 * velocities, choose whether they stick or bounce, run the collision and
 * compare the momentum bars before and after. The totals always match.
 *
 * {
 *   type: 'collision-lab',
 *   m1: 3, v1: 4,                  // cart A (on the left): mass in kg, velocity in m/s (+ is to the right)
 *   m2: 1, v2: 0,                  // cart B (on the right)
 *   mode: 'sticky',                // 'sticky': they lock together · 'bouncy': a perfectly elastic bounce
 *   m1Range: [1, 6, 1],            // optional sliders: [min, max, step]
 *   v1Range: [0, 6, 1],
 *   m2Range: [1, 6, 1],
 *   v2Range: [-6, 0, 1],
 *   modeToggle: false,             // let the learner switch between sticky and bouncy
 *   bars: true,                    // momentum bars for A, B and the total, before and after
 *   energy: false,                 // add a row for the total kinetic energy
 *   track: 30,                     // metres of track in view
 *   static: false,                 // true: picture without controls…
 *   show: 'start',                 // …before the run ('start') or after it ('end')
 * }
 *
 * State: { m1, v1, m2, v2, mode, ran, collides, u1, u2, together, p1, p2, q1, q2, pBefore, pAfter, keBefore, keAfter, history }
 *   ran          — the current settings have been run
 *   collides     — the carts meet at all (A must be catching up with B)
 *   u1, u2       — velocities after the collision (m/s)
 *   together     — they move off as one
 *   p1, p2       — momentum of each cart before (kg·m/s);  q1, q2 — after
 *   pBefore, pAfter — total momentum before and after (always equal)
 *   keBefore, keAfter — total kinetic energy before and after (J)
 *   history      — every run so far: [{ m1, v1, m2, v2, mode }]
 * These facts always describe the *current* settings; they do not wait for the animation.
 *
 * setState({ m1, v1, m2, v2, mode, history }) sets the controls and shows the finished run.
 * The carts move at constant velocity before and after the instant of
 * collision, so every position is an exact formula of time.
 */
import { frame, sliderRow, button, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 122;
const RAIL = 88;
const T_HIT = 2;          // the carts are placed so that they always meet after 2 s
const AFTER = 2.2;        // seconds shown after the collision

addStyles('collision-lab', `
  .widget-collision-lab .cl-table { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr); gap: 4px var(--s3); align-items: center; font-size: var(--fs-sm); font-weight: 700; }
  .widget-collision-lab .cl-head { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); text-align: center; }
  .widget-collision-lab .cl-cell { display: grid; grid-template-columns: minmax(0, 1fr) 3.3em; align-items: center; gap: 6px; }
  .widget-collision-lab .cl-cell > span { font-family: var(--font-mono); text-align: right; font-variant-numeric: tabular-nums; }
  .widget-collision-lab .cl-bar { position: relative; height: 15px; border: var(--bw) solid var(--edge); border-radius: 6px; background: var(--sunken); overflow: hidden; }
  .widget-collision-lab .cl-bar::after { content: ''; position: absolute; top: 0; bottom: 0; left: calc(50% - 1px); width: 2px; background: var(--ink); }
  .widget-collision-lab .cl-bar.is-oneway::after { display: none; }
  .widget-collision-lab .cl-bar i { position: absolute; top: 0; bottom: 0; }
  .widget-collision-lab .cl-key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; border: 1.5px solid var(--edge-strong); margin-right: 5px; }
  .widget-collision-lab .cl-unit { grid-column: 1 / -1; text-align: center; font-size: var(--fs-xs); color: var(--ink-3); font-weight: 700; }
  .widget-collision-lab .w-buttons { align-items: center; }
  .widget-collision-lab .cl-letter { font-family: var(--font-body); font-weight: 800; font-size: 15px; fill: #1D1B26; }
  .widget-collision-lab .cl-vel { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) {
    .widget-collision-lab .cl-letter { font-size: 19px; }
    .widget-collision-lab .cl-vel { font-size: 17px; }
    .widget-collision-lab .cl-cell { grid-template-columns: minmax(0, 1fr) 2.7em; gap: 4px; }
  }
`);

const signed = (val, digits = 1) => (val > 0 ? `+${formatNumber(val, digits)}` : formatNumber(val, digits));

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const trackLen = spec.track || 30;
  const showBars = spec.bars !== false && !env.compact;
  const modeToggle = !!spec.modeToggle && !isStatic;
  const ranges = isStatic ? {} : { m1: spec.m1Range, v1: spec.v1Range, m2: spec.m2Range, v2: spec.v2Range };
  const initial = {
    m1: spec.m1 || 2, v1: spec.v1 != null ? spec.v1 : 4, m2: spec.m2 || 2, v2: spec.v2 || 0,
    mode: spec.mode === 'bouncy' ? 'bouncy' : 'sticky',
  };

  let cfg = { ...initial };
  let ran = isStatic && spec.show === 'end';
  let t = 0;
  let history = [];
  let readOnly = !!env.readOnly;

  /* ----------------------------------------------------------- the model */
  function outcome(c = cfg) {
    const { m1, v1, m2, v2, mode } = c;
    const collides = v1 - v2 > 1e-9;
    let u1 = v1;
    let u2 = v2;
    if (collides) {
      if (mode === 'sticky') { u1 = (m1 * v1 + m2 * v2) / (m1 + m2); u2 = u1; }
      else {
        u1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        u2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
      }
    }
    u1 = tidy(u1, 4); u2 = tidy(u2, 4);
    const ke = (m, v) => 0.5 * m * v * v;
    return {
      collides, u1, u2,
      together: collides && mode === 'sticky',
      p1: tidy(m1 * v1, 4), p2: tidy(m2 * v2, 4),
      q1: tidy(m1 * u1, 4), q2: tidy(m2 * u2, 4),
      pBefore: tidy(m1 * v1 + m2 * v2, 4),
      pAfter: tidy(m1 * u1 + m2 * u2, 4),
      keBefore: tidy(ke(m1, v1) + ke(m2, v2), 3),
      keAfter: tidy(ke(m1, u1) + ke(m2, u2), 3),
    };
  }

  /* ------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Two carts on a track' });
  const { svg } = fr;
  const k = (W - 60) / trackLen;                       // px per metre
  const X = (m) => 30 + m * k;
  const cartW = (m) => 36 + 6 * Math.min(m, 6);

  svg.appendChild(s('line', { x1: 12, x2: W - 12, y1: RAIL, y2: RAIL, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: 12, x2: 12, y1: RAIL - 12, y2: RAIL, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: W - 12, x2: W - 12, y1: RAIL - 12, y2: RAIL, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));

  function makeCart(letter, color) {
    const bodyEl = s('rect', { y: -34, height: 24, rx: 7, fill: hue(color), stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const w1 = s('circle', { cy: -7, r: 6, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const w2 = s('circle', { cy: -7, r: 6, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const label = s('text.cl-letter', { y: -17, 'text-anchor': 'middle' }, letter);
    const massTag = s('text.tick-label', { y: 22, 'text-anchor': 'middle' });
    const g = s('g', bodyEl, w1, w2, label, massTag);
    const shaft = s('line', { stroke: hue(color), 'stroke-width': 5, 'stroke-linecap': 'round' });
    const head = s('path', { fill: hue(color), stroke: hue(color), 'stroke-width': 2, 'stroke-linejoin': 'round' });
    const tag = s('text.cl-vel', { 'text-anchor': 'middle', style: `fill:${hue(color, 'text')}` });
    const arrow = s('g', shaft, head, tag);
    svg.append(g, arrow);
    return {
      place(xm, mass) {
        const w = cartW(mass);
        bodyEl.setAttribute('x', -w / 2); bodyEl.setAttribute('width', w);
        w1.setAttribute('cx', -w / 2 + 11); w2.setAttribute('cx', w / 2 - 11);
        massTag.textContent = `${formatNumber(mass, 1)} kg`;
        g.setAttribute('transform', `translate(${X(xm).toFixed(1)} ${RAIL - 1.5})`);
      },
      /** Velocity arrow with its value, centred above position xm. */
      arrow(xm, v) {
        const px = X(xm);
        const y = 36;
        const len = Math.abs(v) < 1e-9 ? 0 : Math.max(16, Math.abs(v) * 8);
        const dir = Math.sign(v);
        shaft.setAttribute('visibility', len ? 'visible' : 'hidden');
        head.setAttribute('visibility', len ? 'visible' : 'hidden');
        if (len) {
          shaft.setAttribute('x1', px - (dir * len) / 2); shaft.setAttribute('x2', px + (dir * len) / 2 - dir * 8);
          shaft.setAttribute('y1', y); shaft.setAttribute('y2', y);
          const tip = px + (dir * len) / 2;
          head.setAttribute('d', `M${tip} ${y}L${tip - dir * 11} ${y - 7}L${tip - dir * 11} ${y + 7}Z`);
        }
        tag.textContent = `${signed(v, 2)} m/s`;
        tag.setAttribute('x', clamp(px, 40, W - 40));
        tag.setAttribute('y', y - 12);
      },
      hideArrow() { arrow.setAttribute('visibility', 'hidden'); },
      showArrow() { arrow.setAttribute('visibility', 'visible'); },
    };
  }
  const cartA = makeCart('A', 'orange');
  const cartB = makeCart('B', 'teal');

  /* ---------------------------------------------------------------- bars */
  const cells = {};
  if (showBars) {
    const table = h('div.cl-table', { role: 'group', 'aria-label': 'Momentum before and after' });
    table.append(h('span'), h('div.cl-head', 'Before'), h('div.cl-head', 'After'));
    const row = (key, label, color, oneWay = false) => {
      const make = () => {
        const fill = h('i');
        fill.style.background = color;
        const value = h('span');
        const cell = h('div.cl-cell', h('div', { class: `cl-bar${oneWay ? ' is-oneway' : ''}` }, fill), value);
        return { cell, fill, value };
      };
      const before = make();
      const after = make();
      table.append(h('span', color && key !== 'total' && key !== 'ke' ? h('span.cl-key', { style: { background: color } }) : null, label), before.cell, after.cell);
      cells[key] = { before, after, oneWay };
    };
    row('a', 'A', hue('orange'));
    row('b', 'B', hue('teal'));
    row('total', 'Total', hue('violet'));
    table.appendChild(h('div.cl-unit', 'momentum in kg·m/s (+ is to the right)'));
    if (spec.energy) {
      row('ke', 'Energy', hue('green'), true);
      table.appendChild(h('div.cl-unit', 'total kinetic energy in J'));
    }
    fr.el.insertBefore(table, fr.controls);
  }

  /* ------------------------------------------------------------ controls */
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  const modeBtns = [];
  let goBtn = null;
  let resetBtn = null;
  const changed = () => { anim.stop(); ran = false; t = 0; note.textContent = ''; render(); };
  if (!isStatic) {
    const defs = [
      ['m1', 'mass of A', 'orange', 'kg'], ['v1', 'velocity of A', 'orange', 'm/s'],
      ['m2', 'mass of B', 'teal', 'kg'], ['v2', 'velocity of B', 'teal', 'm/s'],
    ];
    for (const [key, label, color, unit] of defs) {
      const range = ranges[key];
      if (!Array.isArray(range)) continue;
      sliders[key] = sliderRow({ label, min: range[0], max: range[1], step: range[2] || 1, value: cfg[key], color, unit, onInput: (val) => { cfg[key] = val; changed(); } });
      fr.controls.appendChild(sliders[key].el);
    }
    if (modeToggle) {
      const segEl = h('div.segmented', { role: 'group', 'aria-label': 'Kind of collision' });
      [['Sticky', 'sticky'], ['Bouncy', 'bouncy']].forEach(([text, value]) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(cfg.mode === value) }, text);
        b.addEventListener('click', () => { if (readOnly || cfg.mode === value) return; cfg.mode = value; play('select'); changed(); });
        modeBtns.push({ b, value });
        segEl.appendChild(b);
      });
      fr.buttons.appendChild(segEl);
    }
    goBtn = button('Go', () => go(true), { icon: 'play', variant: 'primary' });
    resetBtn = button('Reset', () => {
      if (readOnly) return;
      cfg = { ...initial };
      for (const key in sliders) sliders[key].set(cfg[key]);
      changed();
    }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(goBtn, resetBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  let banged = false;
  const runLength = () => (outcome().collides ? T_HIT + AFTER : 4);
  const anim = loop((dt) => {
    const end = runLength();
    const before = t;
    t = Math.min(end, t + dt);
    if (!banged && outcome().collides && before < T_HIT && t >= T_HIT) { banged = true; play('drop'); }
    if (t >= end - 1e-9) { anim.stop(); finish(notifyAtEnd); return; }
    render();
  });

  function describe() {
    const o = outcome();
    if (!o.collides) return 'The carts never meet: A is not catching up with B.';
    if (o.together) return Math.abs(o.u1) < 1e-9 ? 'They stick together and stop dead.' : `They stick together and move ${o.u1 > 0 ? 'right' : 'left'} at ${formatNumber(Math.abs(o.u1), 2)} m/s.`;
    const say = (name, u) => (Math.abs(u) < 1e-9 ? `${name} stops` : `${name} moves ${u > 0 ? 'right' : 'left'} at ${formatNumber(Math.abs(u), 2)} m/s`);
    return `${say('A', o.u1)}; ${say('B', o.u2)}.`;
  }

  function finish(notify) {
    ran = true;
    t = runLength();
    render();
    note.textContent = describe();
    if (notify) {
      play('tick');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function go(count) {
    anim.stop();
    t = 0;
    banged = false;
    ran = true;
    note.textContent = '';
    if (count && !readOnly) history.push({ ...cfg });
    if (reducedMotion()) { finish(count && !readOnly); return; }
    notifyAtEnd = count && !readOnly;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  function setBar(cell, value, scale, oneWay) {
    const frac = clamp(Math.abs(value) / scale, 0, 1);
    if (oneWay) {
      cell.fill.style.left = '0';
      cell.fill.style.width = `${(frac * 100).toFixed(2)}%`;
    } else {
      cell.fill.style.width = `${(frac * 50).toFixed(2)}%`;
      cell.fill.style.left = value >= 0 ? '50%' : `${(50 - frac * 50).toFixed(2)}%`;
    }
  }

  function render() {
    const o = outcome();
    const { m1, v1, m2, v2 } = cfg;
    const active = anim.running || ran;
    const now = active ? t : 0;
    const centre = trackLen / 2;
    const contact = (cartW(m1) + cartW(m2)) / 2 / k;     // centre-to-centre distance at contact (m)
    let xa;
    let xb;
    let va = v1;
    let vb = v2;
    if (o.collides) {
      const dt = now - T_HIT;
      if (dt < 0) { xa = centre - contact / 2 + v1 * dt; xb = centre + contact / 2 + v2 * dt; }
      else { xa = centre - contact / 2 + o.u1 * dt; xb = centre + contact / 2 + o.u2 * dt; va = o.u1; vb = o.u2; }
    } else {
      xa = centre - 5 - contact / 2 + v1 * now;
      xb = centre + 5 + contact / 2 + v2 * now;
    }
    cartA.place(xa, m1);
    cartB.place(xb, m2);
    const hit = o.collides && now >= T_HIT;
    if (hit && o.together) {
      cartA.arrow((xa + xb) / 2, va);
      cartB.hideArrow();
    } else {
      cartB.showArrow();
      // when the carts are close, push the two labels apart so they do not overlap
      const spread = Math.max(0, 100 - (X(xb) - X(xa))) / 2 / k;
      cartA.arrow(xa - spread, va);
      cartB.arrow(xb + spread, vb);
    }

    if (showBars) {
      const done = ran && !anim.running;
      const afterKnown = done || (anim.running && hit);
      const biggest = Math.max(Math.abs(o.p1), Math.abs(o.p2), Math.abs(o.q1), Math.abs(o.q2), Math.abs(o.pBefore), 1);
      const scale = [5, 10, 20, 30, 40, 60, 80, 120, 200].find((c) => c >= biggest) || biggest;
      const put = (key, before, after) => {
        const c = cells[key];
        setBar(c.before, before, scale, false);
        c.before.value.textContent = signed(before, 1);
        setBar(c.after, afterKnown ? after : 0, scale, false);
        c.after.value.textContent = afterKnown ? signed(after, 1) : '?';
      };
      put('a', o.p1, o.q1);
      put('b', o.p2, o.q2);
      put('total', o.pBefore, o.pAfter);
      if (cells.ke) {
        const top = Math.max(o.keBefore, 1);
        setBar(cells.ke.before, o.keBefore, top, true);
        cells.ke.before.value.textContent = formatNumber(o.keBefore, 1);
        setBar(cells.ke.after, afterKnown ? o.keAfter : 0, top, true);
        cells.ke.after.value.textContent = afterKnown ? formatNumber(o.keAfter, 1) : '?';
      }
    }
    for (const { b, value } of modeBtns) { b.setAttribute('aria-pressed', String(cfg.mode === value)); b.disabled = readOnly; }
    if (goBtn) goBtn.lastChild.textContent = ran && !anim.running ? 'Go again' : 'Go';
    if (resetBtn) resetBtn.disabled = readOnly;
    if (!isStatic) {
      svg.setAttribute('aria-label', `${spec.alt || 'Two carts on a track'}. Cart A: ${formatNumber(m1, 1)} kilograms at ${formatNumber(v1, 1)} metres per second. Cart B: ${formatNumber(m2, 1)} kilograms at ${formatNumber(v2, 1)} metres per second. ${cfg.mode === 'sticky' ? 'Sticky' : 'Bouncy'} collision.${ran && !anim.running ? ` ${describe()}` : ''}`);
    }
  }

  function getState() {
    const o = outcome();
    return { ...cfg, ran, ...o, history: history.map((run) => ({ ...run })) };
  }

  if (ran) t = runLength();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      for (const key of ['m1', 'v1', 'm2', 'v2']) {
        if (typeof next[key] !== 'number') continue;
        const range = ranges[key];
        cfg[key] = Array.isArray(range) ? clamp(next[key], range[0], range[1]) : next[key];
        if (sliders[key]) sliders[key].set(cfg[key]);
      }
      if (next.mode === 'sticky' || next.mode === 'bouncy') cfg.mode = next.mode;
      if (Array.isArray(next.history)) history = next.history.map((run) => ({ ...cfg, ...run }));
      if (next.ran === false) { ran = false; t = 0; render(); return; }
      if (isStatic) { render(); return; }
      const last = history[history.length - 1];
      if (!last || ['m1', 'v1', 'm2', 'v2', 'mode'].some((key) => last[key] !== cfg[key])) history.push({ ...cfg });
      finish(false);
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'collision-lab — sticky or bouncy', spec: { type: 'collision-lab', m1: 3, v1: 4, m2: 1, v2: 0, m1Range: [1, 6, 1], v1Range: [0, 6, 1], m2Range: [1, 6, 1], v2Range: [-6, 0, 1], modeToggle: true, energy: true } },
];
