/**
 * robot-grid — program a robot with three commands and watch it do exactly
 * what the program says. The learner builds a list of commands (forward,
 * turn left, turn right), presses Run, and the robot carries them out one by
 * one on a small grid. Nothing is interpreted, nothing is forgiven: drive
 * into a wall and the run stops there.
 *
 * {
 *   type: 'robot-grid',
 *   cols: 5, rows: 4,                    // grid size (up to 8 × 6)
 *   start: { x: 0, y: 3, dir: 'N' },     // x: column from the left, y: row from the top (both from 0); dir: N E S W
 *   goal: { x: 3, y: 1 },                // the flag (omit for no flag)
 *   walls: [[2, 2], [2, 3]],             // blocked squares as [x, y]
 *   program: ['F', 'F', 'R', 'F'],       // commands already in the program: F forward, L turn left, R turn right
 *   max: 12,                             // longest program allowed
 *   marks: { A: [3, 0], B: [4, 1] },     // letters drawn on squares ("on which square does it stop?")
 *   static: false,                       // true: picture and program listing only, nothing to press
 *   editable: true,                      // false: the program is fixed; the learner can only run it
 * }
 *
 * State: { program, length, ran, reached, crashed, crashAt, passedGoal, x, y, dir, moves, turns }
 *   The outcome fields describe what the *current program* does when run from
 *   the start square. They are computed, not read off the animation.
 *     reached     the robot ends exactly on the flag (and did not crash)
 *     crashed     it drove into a wall or off the grid; crashAt is the number (from 1) of that command
 *     passedGoal  it was on the flag at some moment
 *     x, y, dir   where it ends up
 *     moves/turns how many forward moves and turns it carried out
 *     ran         the learner pressed Run for exactly this program and the run has finished
 *   setState({ program: [...] }) loads a program and shows its outcome (ran: true).
 *
 * Keyboard: with the focus anywhere in the widget, ↑ adds Forward, ← Left,
 * → Right and Backspace deletes.
 */
import { frame, hue, s, h, cx, clamp, icon, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const PAD = 14;
const DIRS = ['N', 'E', 'S', 'W'];
const STEP = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const FACING = { N: 'up', E: 'right', S: 'down', W: 'left' };
const NAMES = { F: 'Forward', L: 'Turn left', R: 'Turn right' };
const SHORT = { F: 'Forward', L: 'Turn left', R: 'Turn right' };
// Lucide outlines (ISC): arrow-up, corner-up-left, corner-up-right.
const GLYPH = {
  F: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  L: '<path d="M20 20v-7a4 4 0 0 0-4-4H4"/><path d="M9 14 4 9l5-5"/>',
  R: '<path d="m15 14 5-5-5-5"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>',
};

addStyles('robot-grid', `
  .widget-robot-grid .w-canvas svg { touch-action: manipulation; }
  .widget-robot-grid .rg-robot { transition: transform 0.26s var(--ease-out); }
  .widget-robot-grid .rg-wrap.is-bump { animation: shake 0.4s ease; }
  .widget-robot-grid .rg-strip {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px;
    min-height: 60px; padding: var(--s2);
    border: var(--bw) dashed var(--hair); border-radius: var(--r);
  }
  .widget-robot-grid .rg-empty { color: var(--ink-3); font-size: var(--fs-sm); font-weight: 600; }
  .widget-robot-grid .rg-tok {
    position: relative; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
    min-width: 42px; min-height: 44px; padding: 9px 5px 3px;
    border: var(--bw) solid var(--edge); border-radius: 10px;
    background: var(--surface); color: var(--ink);
    font-size: 0.7rem; font-weight: 700; line-height: 1.1;
    -webkit-tap-highlight-color: transparent;
  }
  .widget-robot-grid .rg-tok.has-label { min-width: 62px; padding-bottom: 5px; }
  .widget-robot-grid button.rg-tok { cursor: pointer; transition: transform 0.1s ease, background-color 0.15s ease; }
  .widget-robot-grid button.rg-tok:active { transform: scale(0.94); }
  .widget-robot-grid .rg-tok-num { position: absolute; top: 1px; left: 5px; font-size: 0.62rem; font-weight: 800; color: var(--ink-3); }
  .widget-robot-grid .rg-tok.is-done { background: var(--green-soft); border-color: var(--green); }
  .widget-robot-grid .rg-tok.is-current { background: var(--yellow-soft); border-color: var(--yellow); box-shadow: 0 0 0 2px var(--yellow); }
  .widget-robot-grid .rg-tok.is-crash { background: var(--red-soft); border-color: var(--red); box-shadow: 0 0 0 2px var(--red); }
  .widget-robot-grid .rg-tok.is-skipped { opacity: 0.45; }
  .widget-robot-grid .rg-tok.is-selected { background: var(--blue-soft); border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue); }
  .widget-robot-grid .rg-pad { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s2); }
  .widget-robot-grid .rg-pad .btn { min-height: 46px; padding-left: 0.3rem; padding-right: 0.3rem; gap: 0.35rem; }
  /* beside the grid there is less width: let the command buttons wrap instead of overlapping */
  .widget-robot-grid.is-row .rg-pad { grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); }
  .widget-robot-grid .btn-ghost { box-shadow: none; }
  .widget-robot-grid .rg-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); }
  .widget-robot-grid .rg-actions .btn-primary { min-width: 120px; min-height: 44px; }
  .widget-robot-grid .rg-status { min-height: 1.5em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-robot-grid .rg-status.is-good { color: var(--green-text); }
  .widget-robot-grid .rg-status.is-bad { color: var(--red-text); }
  .widget-robot-grid.is-readonly .rg-tok { pointer-events: none; }
`);

/**
 * Run `program` in `world` ({ cols, rows, start, goal, walls }). Pure.
 * Returns the robot's pose after each command that could be carried out
 * (poses[0] is the start) and what became of the run.
 */
export function simulate(world, program) {
  const blocked = new Set((world.walls || []).map(([x, y]) => `${x},${y}`));
  const goal = world.goal || null;
  let x = world.start.x;
  let y = world.start.y;
  let d = Math.max(0, DIRS.indexOf(world.start.dir || 'N'));
  let angle = d * 90; // cumulative, so the drawing always turns the short way
  const poses = [{ x, y, dir: DIRS[d], angle }];
  let crashAt = null;
  let moves = 0;
  let turns = 0;
  let passedGoal = !!goal && goal.x === x && goal.y === y;
  for (let i = 0; i < program.length; i++) {
    const c = program[i];
    if (c === 'L') { d = (d + 3) % 4; angle -= 90; turns++; }
    else if (c === 'R') { d = (d + 1) % 4; angle += 90; turns++; }
    else {
      const nx = x + STEP[DIRS[d]][0];
      const ny = y + STEP[DIRS[d]][1];
      if (nx < 0 || ny < 0 || nx >= world.cols || ny >= world.rows || blocked.has(`${nx},${ny}`)) { crashAt = i + 1; break; }
      x = nx; y = ny; moves++;
      if (goal && goal.x === x && goal.y === y) passedGoal = true;
    }
    poses.push({ x, y, dir: DIRS[d], angle });
  }
  const crashed = crashAt != null;
  return {
    poses, crashAt, crashed, moves, turns, passedGoal,
    final: poses[poses.length - 1],
    reached: !crashed && !!goal && goal.x === x && goal.y === y,
  };
}

function glyph(cmd, size = 20) {
  const el = s('svg', { class: 'icon', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' });
  el.innerHTML = GLYPH[cmd];
  return el;
}

export default function create(spec, env) {
  const cols = clamp(Math.round(spec.cols || 5), 2, 8);
  const rows = clamp(Math.round(spec.rows || 4), 2, 6);
  const start = { x: 0, y: rows - 1, dir: 'N', ...(spec.start || {}) };
  const goal = spec.goal ? { x: spec.goal.x, y: spec.goal.y } : null;
  const walls = (spec.walls || []).map(([x, y]) => [x, y]);
  const world = { cols, rows, start, goal, walls };
  const isStatic = !!spec.static || env.compact;
  const editable = spec.editable !== false && !isStatic;
  const clean = (list) => (Array.isArray(list) ? list.filter((c) => NAMES[c]) : []);
  const initial = clean(spec.program);
  const max = Math.max(spec.max || 12, initial.length);

  let program = initial.slice();
  let selected = -1; // token being edited
  let ran = false;   // the current program has been run to its end
  let running = false;
  let shown = 0;     // how many commands the robot on screen has carried out
  let timer = 0;
  let readOnly = !!env.readOnly;

  /* --------------------------------------------------------------- scene */
  const cell = Math.min(88, Math.floor((W - 2 * PAD) / cols), Math.floor(372 / rows));
  const H = rows * cell + 2 * PAD;
  const ox = (W - cols * cell) / 2;
  const oy = PAD;
  const px = (x) => ox + (x + 0.5) * cell;
  const py = (y) => oy + (y + 0.5) * cell;
  const u = cell / 100;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Robot on a grid' });
  const { svg } = fr;
  const wallSet = new Set(walls.map(([x, y]) => `${x},${y}`));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isWall = wallSet.has(`${x},${y}`);
      const isGoal = goal && goal.x === x && goal.y === y;
      svg.appendChild(s('rect', {
        x: ox + x * cell + 3, y: oy + y * cell + 3, width: cell - 6, height: cell - 6, rx: 9 * u + 3,
        fill: isWall ? hue('gray') : isGoal ? hue('green', 'soft') : 'var(--sunken)',
        stroke: isWall ? 'var(--ink)' : isGoal ? hue('green') : 'var(--hair)',
        'stroke-width': isWall ? 2.5 : 2,
      }));
      if (isWall) {
        // a few "brick" lines so a wall does not rely on colour alone
        const x0 = ox + x * cell + 3;
        const y0 = oy + y * cell + 3;
        const w = cell - 6;
        svg.appendChild(s('path', {
          d: `M${x0} ${y0 + w / 3} h${w} M${x0} ${y0 + (2 * w) / 3} h${w} M${x0 + w / 2} ${y0} v${w / 3} M${x0 + w / 4} ${y0 + w / 3} v${w / 3} M${x0 + (3 * w) / 4} ${y0 + w / 3} v${w / 3} M${x0 + w / 2} ${y0 + (2 * w) / 3} v${w / 3}`,
          stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none', opacity: 0.55,
        }));
      }
    }
  }
  // where the robot starts (still visible after it has driven off)
  svg.appendChild(s('rect', {
    x: ox + start.x * cell + 9, y: oy + start.y * cell + 9, width: cell - 18, height: cell - 18, rx: 9 * u,
    fill: 'none', stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-dasharray': '5 6', 'stroke-linecap': 'round',
  }));
  if (goal) {
    const gx = px(goal.x);
    const gy = py(goal.y);
    svg.appendChild(s('g', { transform: `translate(${gx} ${gy})` },
      s('path', { d: `M${-14 * u} ${-30 * u} L${22 * u} ${-16 * u} L${-14 * u} ${-2 * u} Z`, fill: hue('green'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
      s('path', { d: `M${-14 * u} ${-32 * u} V${30 * u}`, stroke: 'var(--ink)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }),
    ));
  }
  const marks = spec.marks || {};
  for (const key of Object.keys(marks)) {
    const [mx, my] = marks[key];
    svg.appendChild(s('circle', { cx: px(mx), cy: py(my), r: 24 * u + 4, fill: hue('violet', 'soft'), stroke: hue('violet'), 'stroke-width': 2.5 }));
    svg.appendChild(s('text.fig-label-lg', { x: px(mx), y: py(my) + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, key));
  }
  const trail = s('polyline', { fill: 'none', stroke: hue('orange'), 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.5 });
  svg.appendChild(trail);

  // the robot, drawn facing up around its own origin
  const robot = s('g.rg-robot',
    s('rect', { x: -37 * u, y: -22 * u, width: 12 * u, height: 44 * u, rx: 5 * u, fill: 'var(--ink-2)' }),
    s('rect', { x: 25 * u, y: -22 * u, width: 12 * u, height: 44 * u, rx: 5 * u, fill: 'var(--ink-2)' }),
    s('rect', { x: -28 * u, y: -30 * u, width: 56 * u, height: 60 * u, rx: 14 * u, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 3 }),
    s('path', { d: `M0 ${-19 * u} L${15 * u} ${5 * u} H${-15 * u} Z`, fill: '#1D1B26', stroke: '#1D1B26', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    s('rect', { x: -5 * u, y: 5 * u, width: 10 * u, height: 14 * u, rx: 2, fill: '#1D1B26' }),
  );
  const robotWrap = s('g.rg-wrap', robot); // the wrapper carries the bump animation
  svg.appendChild(robotWrap);

  function placeRobot(sim, k) {
    const pose = sim.poses[Math.min(k, sim.poses.length - 1)];
    robot.style.transform = `translate(${px(pose.x)}px, ${py(pose.y)}px) rotate(${pose.angle}deg)`;
    const pts = sim.poses.slice(0, Math.min(k, sim.poses.length - 1) + 1).map((p) => `${px(p.x)},${py(p.y)}`);
    trail.setAttribute('points', pts.length > 1 ? pts.join(' ') : '');
    svg.setAttribute('aria-label',
      `${spec.alt ? spec.alt + ' ' : ''}Grid of ${cols} columns and ${rows} rows. Robot in column ${pose.x + 1}, row ${pose.y + 1}, facing ${FACING[pose.dir]}.` +
      (goal ? ` Flag in column ${goal.x + 1}, row ${goal.y + 1}.` : ''));
  }

  /* ------------------------------------------------------------- program */
  const strip = h('div.rg-strip', { role: 'group', 'aria-label': 'Program' });
  const status = h('div.rg-status');
  const count = h('span.w-readout', h('span', 'Commands'), h('b'));
  const pad = h('div.rg-pad');
  const actions = h('div.rg-actions');
  fr.el.insertBefore(strip, fr.readouts);

  const setStatus = (text, tone = '') => {
    status.textContent = text;
    status.className = cx('rg-status', tone && `is-${tone}`);
  };

  function renderStrip(sim) {
    strip.replaceChildren();
    if (!program.length) {
      strip.appendChild(h('span.rg-empty', editable ? 'Your program is empty. Add commands below.' : 'No commands.'));
      return;
    }
    program.forEach((c, i) => {
      const done = (ran || running) && i < shown;
      const crash = ran && sim.crashAt === i + 1;
      const cls = cx('rg-tok', isStatic && 'has-label',
        done && 'is-done', running && i === shown && 'is-current', crash && 'is-crash',
        ran && sim.crashed && i + 1 > sim.crashAt && 'is-skipped', i === selected && 'is-selected');
      const kids = [h('span.rg-tok-num', { 'aria-hidden': 'true' }, String(i + 1)), glyph(c, isStatic ? 20 : 22), isStatic ? h('span', SHORT[c]) : null];
      const label = `Command ${i + 1}: ${NAMES[c]}${crash ? ' (crash)' : ''}`;
      if (editable) {
        const btn = h('button', { type: 'button', class: cls, 'aria-label': `${label}. Tap to change it.`, 'aria-pressed': String(i === selected) }, kids);
        btn.addEventListener('click', () => {
          if (readOnly || running) return;
          selected = selected === i ? -1 : i;
          play('select');
          render();
        });
        strip.appendChild(btn);
      } else {
        strip.appendChild(h('span', { class: cls, role: 'img', 'aria-label': label }, kids));
      }
    });
  }

  function describe(sim) {
    const n = program.length;
    if (sim.crashed) {
      const pose = sim.final;
      const nx = pose.x + STEP[pose.dir][0];
      const ny = pose.y + STEP[pose.dir][1];
      const off = nx < 0 || ny < 0 || nx >= cols || ny >= rows;
      return [`Bump! Command ${sim.crashAt} drove the robot ${off ? 'off the grid' : 'into a wall'}, so it stopped.`, 'bad'];
    }
    if (sim.reached) return [`The robot stopped on the flag after ${n} command${n === 1 ? '' : 's'}.`, 'good'];
    if (!goal) return [`Done: ${n} command${n === 1 ? '' : 's'} carried out.`, ''];
    if (sim.passedGoal) return ['The robot drove over the flag and kept going, exactly as the program says.', 'bad'];
    return ['The program has ended, and the robot is not on the flag.', 'bad'];
  }

  function render() {
    const sim = simulate(world, program);
    renderStrip(sim);
    count.lastChild.textContent = `${program.length} of ${max}`;
    const idle = !running && !readOnly;
    for (const btn of pad.children) btn.disabled = !idle || (selected < 0 && program.length >= max);
    undoBtn.disabled = !idle || !program.length;
    clearBtn.disabled = !idle || !program.length;
    runBtn.disabled = !idle || !program.length;
    undoBtn.lastChild.textContent = selected >= 0 ? 'Delete' : 'Undo';
    return sim;
  }

  function stopTimer() { clearTimeout(timer); timer = 0; }

  function showStart() {
    stopTimer();
    running = false;
    ran = false;
    shown = 0;
    robotWrap.classList.remove('is-bump');
    placeRobot(simulate(world, []), 0);
  }

  function edited(message = '') {
    showStart();
    render();
    setStatus(message || (selected >= 0 ? `Command ${selected + 1} is selected: pick its replacement, or delete it.` : ''));
    env.onChange(getState());
  }

  function add(c) {
    if (readOnly || running || !editable) return;
    if (selected >= 0) { program[selected] = c; selected = -1; }
    else if (program.length < max) program.push(c);
    else { setStatus(`A program can hold at most ${max} commands.`, 'bad'); return; }
    play('tap');
    edited();
  }

  function remove() {
    if (readOnly || running || !editable || !program.length) return;
    if (selected >= 0) { program.splice(selected, 1); selected = -1; } else program.pop();
    play('pop');
    edited();
  }

  function finish(sim) {
    stopTimer();
    running = false;
    ran = true;
    shown = sim.poses.length - 1;
    placeRobot(sim, shown);
    if (sim.crashed) {
      robotWrap.classList.remove('is-bump');
      void robotWrap.getBoundingClientRect();
      robotWrap.classList.add('is-bump');
      play('drop');
    }
    render();
    const [text, tone] = describe(sim);
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function run() {
    if (readOnly || running || !program.length) return;
    showStart();
    selected = -1;
    const sim = simulate(world, program);
    running = true;
    render();
    setStatus('Running…');
    if (reducedMotion()) { finish(sim); return; }
    const delay = clamp(2600 / program.length, 170, 420);
    const tick = () => {
      if (shown < sim.poses.length - 1) {
        shown += 1;
        placeRobot(sim, shown);
        renderStrip(sim);
        play('tick');
        timer = setTimeout(tick, delay);
      } else finish(sim);
    };
    timer = setTimeout(tick, delay * 0.6);
  }

  const padButton = (c) => {
    const btn = h('button.btn.btn-sm', { type: 'button', 'aria-label': NAMES[c] }, glyph(c, 18), SHORT[c]);
    btn.addEventListener('click', () => add(c));
    return btn;
  };
  const smallButton = (text, name, onClick, variant = 'ghost') => {
    const btn = h('button', { type: 'button', class: `btn btn-sm btn-${variant}` }, icon(name, 16), text);
    btn.addEventListener('click', onClick);
    return btn;
  };
  const undoBtn = smallButton('Undo', 'undo', remove);
  const clearBtn = smallButton('Clear', 'trash', () => {
    if (readOnly || running || !program.length) return;
    program = [];
    selected = -1;
    play('pop');
    edited();
  });
  const runBtn = smallButton('Run', 'play', run, 'primary');

  if (!isStatic) {
    if (editable) {
      for (const c of ['F', 'L', 'R']) pad.appendChild(padButton(c));
      fr.readouts.appendChild(count);
      fr.el.insertBefore(pad, fr.buttons);
      actions.append(undoBtn, clearBtn);
    }
    actions.appendChild(runBtn);
    fr.buttons.replaceWith(actions);
    fr.el.appendChild(status);
    fr.el.dataset.keys = 'own';
    fr.el.addEventListener('keydown', (ev) => {
      if (!editable || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === 'ArrowUp') add('F');
      else if (ev.key === 'ArrowLeft') add('L');
      else if (ev.key === 'ArrowRight') add('R');
      else if (ev.key === 'Backspace' || ev.key === 'Delete') remove();
      else return;
      ev.preventDefault();
    });
  }

  function getState() {
    const sim = simulate(world, program);
    return {
      program: program.slice(), length: program.length, ran,
      reached: sim.reached, crashed: sim.crashed, crashAt: sim.crashAt, passedGoal: sim.passedGoal,
      x: sim.final.x, y: sim.final.y, dir: sim.final.dir, moves: sim.moves, turns: sim.turns,
    };
  }

  showStart();
  render();
  if (!isStatic && editable && program.length) setStatus('Press Run to see what this program does.');
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.program)) return;
      stopTimer();
      program = clean(next.program).slice(0, Math.max(max, next.program.length));
      selected = -1;
      running = false;
      const sim = simulate(world, program);
      ran = next.ran !== false && program.length > 0;
      shown = ran ? sim.poses.length - 1 : 0;
      robotWrap.classList.remove('is-bump');
      placeRobot(sim, shown);
      render();
      if (ran) { const [text, tone] = describe(sim); setStatus(text, tone); } else setStatus('');
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (running) finish(simulate(world, program)); else render();
    },
    destroy() { stopTimer(); },
  };
}

export const examples = [
  {
    title: 'robot-grid — build a program, then run it',
    spec: { type: 'robot-grid', cols: 5, rows: 4, start: { x: 0, y: 3, dir: 'N' }, goal: { x: 3, y: 1 }, walls: [[1, 1]], max: 10 },
  },
  {
    title: 'robot-grid — static picture with lettered squares',
    spec: { type: 'robot-grid', static: true, cols: 6, rows: 4, start: { x: 2, y: 3, dir: 'N' }, program: ['F', 'F', 'R', 'F', 'F'], marks: { A: [0, 1], B: [3, 1], C: [4, 1], D: [5, 1] } },
  },
];
