/**
 * Code Breaker. Deduce a hidden sequence of symbols. After each guess you
 * learn how many symbols are exactly right, and how many are right but in
 * the wrong place. Pure deduction: every clue cuts down the possibilities.
 *
 * Each symbol has a colour AND a shape, so the game does not depend on
 * colour vision.
 */
import { h, s, cx, mount } from '../core/dom.js';
import { play } from '../core/audio.js';

const SYMBOLS = [
  { hue: 'red', name: 'red circle', path: '<circle cx="12" cy="12" r="7"/>' },
  { hue: 'blue', name: 'blue square', path: '<rect x="5.5" y="5.5" width="13" height="13" rx="2"/>' },
  { hue: 'green', name: 'green triangle', path: '<path d="M12 4.5 L20 18.5 H4 Z"/>' },
  { hue: 'yellow', name: 'yellow star', path: '<path d="M12 3.5l2.5 5.4 5.9.7-4.4 4 1.2 5.9-5.2-3-5.2 3 1.2-5.9-4.4-4 5.9-.7z"/>' },
  { hue: 'violet', name: 'violet diamond', path: '<path d="M12 3.5 L20.5 12 L12 20.5 L3.5 12 Z"/>' },
  { hue: 'teal', name: 'teal cross', path: '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z"/>' },
];

const LEVELS = {
  easy: { length: 3, symbols: 4, repeats: false, tries: 8 },
  medium: { length: 4, symbols: 6, repeats: false, tries: 9 },
  hard: { length: 4, symbols: 6, repeats: true, tries: 10 },
};

function peg(index, size = 34) {
  const sym = SYMBOLS[index];
  const el = h('span', { class: cx('pz-peg', `hue-${sym.hue}`), style: { width: `${size}px`, height: `${size}px` }, role: 'img', 'aria-label': sym.name });
  el.innerHTML = `<svg viewBox="0 0 24 24" width="${size - 10}" height="${size - 10}" aria-hidden="true" fill="currentColor" stroke="var(--edge-strong)" stroke-width="1.6" stroke-linejoin="round">${sym.path}</svg>`;
  return el;
}

/** { exact, near } feedback for a guess against the code. */
export function score(code, guess) {
  let exact = 0;
  const restCode = [];
  const restGuess = [];
  code.forEach((c, i) => { if (guess[i] === c) exact++; else { restCode.push(c); restGuess.push(guess[i]); } });
  let near = 0;
  for (const g of restGuess) {
    const j = restCode.indexOf(g);
    if (j >= 0) { near++; restCode.splice(j, 1); }
  }
  return { exact, near };
}

export default {
  id: 'codebreaker',
  howTo: [
    'A hidden code is made of symbols. Build a guess and submit it.',
    'A filled dot means a symbol is right and in the right place. A hollow dot means a symbol is in the code but in a different place.',
    'The dots do not tell you which symbols they refer to. That is the puzzle.',
  ],
  levels: [{ id: 'easy', label: '3 symbols' }, { id: 'medium', label: '4 symbols' }, { id: 'hard', label: '4, repeats allowed' }],

  create({ rng, level = 'medium', onChange, onSolved }) {
    const cfg = LEVELS[level] || LEVELS.medium;
    const pool = Array.from({ length: cfg.symbols }, (_, i) => i);
    const code = cfg.repeats ? Array.from({ length: cfg.length }, () => rng.pick(pool)) : rng.sample(pool, cfg.length);
    let guesses;
    let current;
    let done;
    const el = h('div.pz-code');
    const reset = () => { guesses = []; current = new Array(cfg.length).fill(null); done = false; };

    function submit() {
      if (done || current.includes(null)) return;
      const result = score(code, current);
      guesses.push({ guess: current.slice(), ...result });
      current = new Array(cfg.length).fill(null);
      if (result.exact === cfg.length) { done = true; play('correct'); onSolved({ moves: guesses.length }); }
      else if (guesses.length >= cfg.tries) { done = true; play('wrong'); }
      else play('drop');
      draw();
      onChange();
    }

    function draw() {
      const won = done && guesses.length && guesses[guesses.length - 1].exact === cfg.length;
      const rows = guesses.map((g, i) => h('div.pz-code-row', { role: 'listitem', 'aria-label': `Guess ${i + 1}: ${g.guess.map((x) => SYMBOLS[x].name).join(', ')}. ${g.exact} exactly right, ${g.near} in the wrong place.` },
        h('span.pz-code-n', String(i + 1)),
        h('div.pz-code-pegs', g.guess.map((x) => peg(x))),
        h('div.pz-code-dots', { 'aria-hidden': 'true' },
          Array.from({ length: cfg.length }, (_, k) => h('i', { class: cx('pz-dot', k < g.exact ? 'is-exact' : k < g.exact + g.near ? 'is-near' : '') }))),
      ));

      const slots = current.map((x, i) => {
        const btn = h('button', { type: 'button', class: cx('pz-slot', x !== null && 'is-filled'), 'aria-label': x === null ? `Slot ${i + 1}, empty` : `Slot ${i + 1}: ${SYMBOLS[x].name}. Tap to clear.` }, x !== null ? peg(x) : null);
        btn.addEventListener('click', () => { if (done) return; current[i] = null; play('pop'); draw(); });
        return btn;
      });
      const palette = pool.map((x) => {
        const used = !cfg.repeats && current.includes(x);
        const btn = h('button', { type: 'button', class: 'pz-pick', disabled: done || used || !current.includes(null), 'aria-label': `Add ${SYMBOLS[x].name}` }, peg(x, 40));
        btn.addEventListener('click', () => {
          const slot = current.indexOf(null);
          if (slot < 0) return;
          current[slot] = x;
          play('select');
          draw();
        });
        return btn;
      });
      const submitBtn = h('button.btn.btn-primary', { type: 'button', disabled: done || current.includes(null) }, 'Submit guess');
      submitBtn.addEventListener('click', submit);

      mount(el,
        h('div.pz-code-board', { role: 'list', 'aria-label': 'Your guesses' }, rows,
          !done ? h('div.pz-code-row.is-current', { role: 'listitem', 'aria-label': 'Your next guess' }, h('span.pz-code-n', String(guesses.length + 1)), h('div.pz-code-pegs', slots), h('div.pz-code-dots')) : null),
        done ? h('div.pz-code-reveal', h('span.small.muted', won ? 'You cracked it:' : 'The code was:'), h('div.pz-code-pegs', code.map((x) => peg(x)))) : null,
        !done ? h('div.pz-code-palette', palette) : null,
        !done ? h('div.center', submitBtn) : null,
        h('div.pz-code-legend.small.muted',
          h('span', h('i.pz-dot.is-exact'), ' right symbol, right place'),
          h('span', h('i.pz-dot.is-near'), ' right symbol, wrong place')),
        !done ? h('p.small.muted.center', `${cfg.tries - guesses.length} guess${cfg.tries - guesses.length === 1 ? '' : 'es'} left${cfg.repeats ? ' · symbols may repeat' : ' · no symbol repeats'}`) : null,
        done && !won ? h('p.center', 'Out of guesses. Every clue was a constraint; try combining them more aggressively next time.') : null,
      );
    }

    reset();
    draw();
    void s;

    return {
      el,
      restart() { reset(); draw(); onChange(); },
      status: () => `${guesses.length} of ${cfg.tries} guesses used`,
      share: () => `Code Breaker: cracked in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}\n${guesses.map((g) => '●'.repeat(g.exact) + '○'.repeat(g.near) + '·'.repeat(cfg.length - g.exact - g.near)).join('\n')}`,
      destroy() {},
    };
  },
};
