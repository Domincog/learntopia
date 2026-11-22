/**
 * change-spot — change blindness by the "flicker" method (Rensink, O'Regan &
 * Clark 1997). Two pictures of twelve objects alternate, with a brief blank
 * between them. They differ in ONE object, which changes shape or vanishes.
 * The learner looks for the change and taps the object. It usually takes many
 * alternations, although the change is large and in plain view. Once it has
 * been found (or shown with "Show me"), the same two pictures alternate with
 * no blank between them, and the change is seen at once.
 *
 * {
 *   type: 'change-spot',
 *   show: 650,          // milliseconds each picture stays up
 *   blank: 140,         // milliseconds of blank between pictures
 * }
 *
 * The scene and the change are drawn with env.rng. The change is always one of
 * shape or presence, never of colour alone. With "reduce motion" switched on
 * in the system settings nothing alternates by itself: a button switches the
 * picture, with the same blank in between.
 *
 * State: { started, found, revealed, done, cycles, misses, seconds }
 *   found     the learner tapped the changing object · revealed: "Show me" was pressed
 *   done      found or revealed
 *   cycles    how many times the picture had switched when the search ended
 *   misses    taps on objects that do not change · seconds: time from "Start" to the end of the search
 * Use `check: (s) => s.done`. setState accepts { found: true } or { revealed: true }.
 */
import { frame, button, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('change-spot', `
  .widget-change-spot .cs-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 2.6em; text-wrap: balance; }
  .widget-change-spot .cs-note b { color: var(--ink); }
  .widget-change-spot .cs-hit { cursor: pointer; outline: none; }
  .widget-change-spot .cs-hit:focus-visible rect { stroke: var(--focus); stroke-width: 3; }
  .widget-change-spot.is-readonly .cs-hit { cursor: default; }
`);

const W = 520;
const H = 312;
const COLS = 4;
const ROWS = 3;
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'plus', 'ring', 'star', 'bar'];
const HUES = ['blue', 'orange', 'green', 'violet', 'teal', 'pink', 'yellow', 'red'];
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function shapeNode(shape, r, color) {
  const fill = hue(color);
  const st = { fill, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' };
  const poly = (pts) => s('polygon', { points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '), ...st });
  switch (shape) {
    case 'square': return s('rect', { x: -r * 0.85, y: -r * 0.85, width: r * 1.7, height: r * 1.7, rx: 4, ...st });
    case 'triangle': return poly([[0, -r], [r, r * 0.8], [-r, r * 0.8]]);
    case 'diamond': return poly([[0, -r], [r * 0.8, 0], [0, r], [-r * 0.8, 0]]);
    case 'plus': { const a = r * 0.36; return poly([[-a, -r], [a, -r], [a, -a], [r, -a], [r, a], [a, a], [a, r], [-a, r], [-a, a], [-r, a], [-r, -a], [-a, -a]]); }
    case 'ring': return s('circle', { r: r * 0.72, fill: 'none', stroke: fill, 'stroke-width': r * 0.42 });
    case 'star': { const pts = []; for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const a = (Math.PI / 5) * i - Math.PI / 2; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); } return poly(pts); }
    case 'bar': return s('rect', { x: -r, y: -r * 0.4, width: 2 * r, height: r * 0.8, rx: 5, ...st });
    default: return s('circle', { r: r * 0.9, ...st });
  }
}

export default function create(spec, env) {
  const showMs = Math.max(300, spec.show || 650);
  const blankMs = Math.max(80, spec.blank || 140);
  const still = reducedMotion();
  let readOnly = !!env.readOnly;

  // the scene
  const cellW = W / COLS;
  const cellH = H / ROWS;
  const objects = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    objects.push({
      shape: env.rng.pick(SHAPES), color: env.rng.pick(HUES), r: env.rng.int(22, 30), rot: env.rng.int(-20, 20),
      x: (i % COLS + 0.5) * cellW + env.rng.int(-18, 18), y: (Math.floor(i / COLS) + 0.5) * cellH + env.rng.int(-12, 12),
    });
  }
  const target = env.rng.int(0, objects.length - 1);
  const gone = env.rng.bool(0.4);
  const other = env.rng.pick(SHAPES.filter((x) => x !== objects[target].shape));

  let started = false;
  let found = false;
  let revealed = false;
  let cycles = 0;
  let misses = 0;
  let seconds = null;
  let startedAt = 0;
  let face = 0; // which picture is up: 0 or 1
  let timer = 0;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Twelve coloured shapes' });
  const { svg } = fr;
  const pictures = [s('g'), s('g')];
  const mark = s('g');
  const hits = s('g');
  svg.append(s('rect', { x: 0, y: 0, width: W, height: H, fill: 'var(--sunken)' }), pictures[0], pictures[1], mark, hits);
  const note = h('p.cs-note', { 'aria-live': 'polite' });
  fr.el.insertBefore(note, fr.readouts);

  objects.forEach((o, i) => {
    for (const k of [0, 1]) {
      if (k === 1 && i === target && gone) continue;
      const node = shapeNode(k === 1 && i === target ? other : o.shape, o.r, o.color);
      node.setAttribute('transform', `translate(${o.x} ${o.y}) rotate(${o.rot})`);
      pictures[k].appendChild(node);
    }
  });

  const done = () => found || revealed;
  const getState = () => ({ started, found, revealed, done: done(), cycles, misses, seconds });
  const paint = (blank = false) => {
    pictures[0].style.display = !blank && face === 0 ? '' : 'none';
    pictures[1].style.display = !blank && face === 1 ? '' : 'none';
  };
  const stop = () => { clearTimeout(timer); timer = 0; };

  /** One switch: (blank,) other picture, and again after a while unless nothing moves by itself. */
  function flip(withBlank, auto) {
    stop();
    const swap = () => { face = 1 - face; if (!done()) cycles++; paint(); if (auto) timer = setTimeout(() => flip(withBlank, auto), showMs); };
    if (withBlank) { paint(true); timer = setTimeout(swap, blankMs); } else swap();
  }

  function finish(how) {
    if (done()) return;
    if (how === 'found') found = true; else revealed = true;
    seconds = started ? Math.round((now() - startedAt) / 100) / 10 : 0;
    showEnd();
    play(found ? 'correct' : 'pop');
    env.announce(note.textContent);
    env.onChange(getState());
  }

  function showEnd() {
    stop();
    const o = objects[target];
    mark.replaceChildren(s('circle', { cx: o.x, cy: o.y, r: o.r + 14, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '7 6' }));
    const what = gone ? 'is there in one picture and missing in the other' : 'has a different shape in the two pictures';
    note.replaceChildren();
    if (found) note.append(h('b', `Found after ${cycles} switch${cycles === 1 ? '' : 'es'}.`), ` The ringed object ${what}. `);
    else note.append(`The ringed object ${what}. `);
    note.append(still ? 'Switch the picture now: with no blank in between, the change is plain.' : 'Now the same two pictures alternate with no blank in between, and the change jumps out.');
    startBtn.hidden = true;
    showBtn.hidden = true;
    stepBtn.hidden = !still;
    if (still) { face = 0; paint(); } else { face = 0; paint(); timer = setTimeout(() => flip(false, true), showMs); }
  }

  const startBtn = button('Start', () => {
    if (readOnly || started) return;
    started = true;
    startedAt = now();
    startBtn.hidden = true;
    showBtn.hidden = false;
    stepBtn.hidden = !still;
    note.textContent = still ? 'Switch the picture as often as you like. Tap the object that changes.' : 'One object keeps changing. Tap it when you find it. Take as long as you like.';
    if (!still) timer = setTimeout(() => flip(true, true), showMs);
    env.onChange(getState());
  }, { icon: 'play', variant: 'primary' });
  const showBtn = button('Show me', () => { if (!readOnly) finish('revealed'); });
  const stepBtn = button('Switch picture', () => { if (!readOnly || done()) flip(!done(), false); });
  showBtn.hidden = true;
  stepBtn.hidden = true;
  fr.buttons.append(startBtn, stepBtn, showBtn);
  note.textContent = 'Two pictures of these twelve objects will alternate. They differ in one object.';

  objects.forEach((o, i) => {
    const hit = s('g.cs-hit', { tabindex: 0, role: 'button', 'aria-label': `Object in row ${Math.floor(i / COLS) + 1}, column ${(i % COLS) + 1}` },
      s('rect', { x: (i % COLS) * cellW + 3, y: Math.floor(i / COLS) * cellH + 3, width: cellW - 6, height: cellH - 6, rx: 8, fill: 'transparent', stroke: 'transparent' }));
    const choose = () => {
      if (readOnly || !started || done()) return;
      if (i === target) { finish('found'); return; }
      misses++;
      play('wrong');
      note.textContent = 'Not that one: it is the same in both pictures. Keep looking.';
      env.onChange(getState());
    };
    hit.addEventListener('click', choose);
    hit.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(); } });
    hit.dataset.keys = 'own';
    hits.appendChild(hit);
  });
  paint();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || done()) return;
      if (next.found) { found = true; cycles = next.cycles || cycles; } else if (next.revealed) revealed = true; else return;
      started = true;
      seconds = seconds == null ? 0 : seconds;
      showEnd();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
    destroy() { stop(); },
  };
}

export const examples = [
  { title: 'change-spot — find the change', spec: { type: 'change-spot' } },
];
