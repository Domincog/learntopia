/**
 * Target Number. Combine number tiles with + − × ÷ to make the target.
 * Pick a tile, an operation, then another tile: the two merge into their
 * result. Every intermediate result must be a positive whole number.
 * The target is built from the tiles by the generator, so it is always reachable.
 */
import { h, cx, mount } from '../core/dom.js';
import { play } from '../core/audio.js';

const OPS = [
  { key: '+', label: '+', fn: (a, b) => a + b },
  { key: '-', label: '−', fn: (a, b) => a - b },
  { key: '*', label: '×', fn: (a, b) => a * b },
  { key: '/', label: '÷', fn: (a, b) => (b !== 0 && a % b === 0 ? a / b : NaN) },
];

const LEVELS = {
  easy: { count: 4, pool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], big: [], steps: 2, range: [12, 60] },
  medium: { count: 5, pool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], big: [25, 50], steps: 3, range: [60, 300] },
  hard: { count: 6, pool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], big: [25, 50, 75, 100], steps: 4, range: [200, 999] },
};

function generate(rng, cfg) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const numbers = [];
    if (cfg.big.length) numbers.push(rng.pick(cfg.big));
    while (numbers.length < cfg.count) numbers.push(rng.pick(cfg.pool));
    // Build the target by really combining tiles in a chain, so a solution certainly exists.
    const order = rng.shuffle(numbers);
    const recipe = [];
    let running = order[0];
    let ok = true;
    for (let s = 1; s <= cfg.steps && s < order.length; s++) {
      const hi = Math.max(running, order[s]);
      const lo = Math.min(running, order[s]);
      const choices = OPS.map((op) => ({ op, v: op.fn(hi, lo) }))
        .filter((c) => Number.isInteger(c.v) && c.v > 0 && c.v !== hi && c.v !== lo && c.v < 2000);
      if (!choices.length) { ok = false; break; }
      const pick = rng.pick(choices);
      recipe.push(`${hi} ${pick.op.label} ${lo} = ${pick.v}`);
      running = pick.v;
    }
    const target = running;
    if (!ok || target < cfg.range[0] || target > cfg.range[1] || numbers.includes(target)) continue;
    return { numbers: rng.shuffle(numbers), target, recipe };
  }
  return { numbers: [2, 3, 5, 7], target: 31, recipe: ['3 × 7 = 21', '2 × 5 = 10', '21 + 10 = 31'] };
}

export default {
  id: 'target',
  howTo: [
    'Make the target number exactly.',
    'Tap a tile, then an operation, then a second tile. The two tiles merge into the result.',
    'You do not have to use every tile. Results must be positive whole numbers.',
  ],
  levels: [{ id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }],

  create({ rng, level = 'medium', onChange, onSolved }) {
    const cfg = LEVELS[level] || LEVELS.medium;
    const puzzle = generate(rng, cfg);
    let tiles;
    let history;
    let first;
    let op;
    let solved;
    let message;
    let uid = 0;

    const el = h('div.pz-target');
    const reset = () => {
      tiles = puzzle.numbers.map((v) => ({ id: uid++, v }));
      history = [];
      first = null;
      op = null;
      solved = false;
      message = '';
    };

    function combine(second) {
      const a = tiles.find((t) => t.id === first);
      const b = tiles.find((t) => t.id === second);
      const v = op.fn(a.v, b.v);
      if (!Number.isInteger(v) || v <= 0) {
        message = op.key === '/' ? `${a.v} ÷ ${b.v} is not a whole number.` : `${a.v} − ${b.v} is not positive. Try the other order.`;
        play('wrong');
        op = null;
        draw();
        return;
      }
      history.push({ tiles: tiles.slice(), line: `${a.v} ${op.label} ${b.v} = ${v}` });
      const merged = { id: uid++, v };
      tiles = tiles.filter((t) => t !== a && t !== b).concat(merged);
      first = merged.id;
      op = null;
      message = '';
      play('drop');
      if (v === puzzle.target) { solved = true; first = null; onSolved({ moves: history.length }); }
      draw();
      onChange();
    }

    function draw() {
      const closest = tiles.reduce((best, t) => (Math.abs(t.v - puzzle.target) < Math.abs(best - puzzle.target) ? t.v : best), tiles[0].v);
      mount(el,
        h('div.pz-target-goal', h('span.eyebrow', 'Target'), h('strong', String(puzzle.target))),
        h('div.pz-target-tiles', tiles.map((t) => {
          const btn = h('button', {
            type: 'button',
            class: cx('pz-tile', t.id === first && 'is-picked', t.v === puzzle.target && 'is-goal'),
            'aria-pressed': String(t.id === first),
            'aria-label': `Number ${t.v}`,
          }, String(t.v));
          btn.addEventListener('click', () => {
            if (solved) return;
            if (first !== null && op && t.id !== first) { combine(t.id); return; }
            first = first === t.id ? null : t.id;
            message = '';
            play('select');
            draw();
          });
          return btn;
        })),
        h('div.pz-target-ops', OPS.map((o) => {
          const btn = h('button', { type: 'button', class: cx('pz-op', op === o && 'is-picked'), disabled: first === null || solved, 'aria-label': { '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by' }[o.key], 'aria-pressed': String(op === o) }, o.label);
          btn.addEventListener('click', () => { op = op === o ? null : o; message = ''; play('select'); draw(); });
          return btn;
        })),
        h('div.pz-target-msg', { role: 'status' }, message || (solved ? 'Exactly right!' : first === null ? 'Pick a number to start.' : op ? 'Now pick the second number.' : 'Pick an operation.')),
        history.length ? h('ol.pz-target-log', history.map((s) => h('li', s.line))) : null,
        !solved && tiles.length === 1 ? h('p.small.muted.center', `Out of tiles. Closest was ${closest}. Undo or restart.`) : null,
      );
    }

    reset();
    draw();

    return {
      el,
      restart() { reset(); draw(); onChange(); },
      undo() {
        if (!history.length || solved) return;
        tiles = history.pop().tiles;
        first = null;
        op = null;
        message = '';
        draw();
        onChange();
      },
      hint() {
        if (solved) return;
        message = `One way starts with: ${puzzle.recipe[0].split(' = ')[0]}`;
        draw();
      },
      status: () => `${history.length} step${history.length === 1 ? '' : 's'}`,
      share: () => `Target Number: made ${puzzle.target} in ${history.length} steps`,
      destroy() {},
    };
  },
};
