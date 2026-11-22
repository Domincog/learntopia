/**
 * `choice` (pick one) and `multi` (pick all that apply).
 * Each option may carry `why` — feedback shown when that option is chosen —
 * and an optional small `figure`.
 */
import { h, cx } from '../../core/dom.js';
import { icon } from '../../ui/icon.js';
import { mdSpan, LETTERS } from '../ui.js';
import { mdText } from '../../core/markdown.js';
import { play } from '../../core/audio.js';
import { createWidget } from '../../widgets/index.js';

const plainLength = (text) => text.replace(/\\[a-zA-Z]+/g, 'x').replace(/[${}*_`\\]/g, '').length;

export default function choice(step, env) {
  const multi = step.type === 'multi';
  /** No correct option at all: an opinion poll ("how well do you understand…?"). */
  const poll = !multi && !step.options.some((o) => o.correct);
  const n = step.options.length;
  const identity = Array.from({ length: n }, (_, i) => i);
  const order = step.shuffle ? env.rng.shuffle(identity) : identity;
  const selected = new Set();
  const eliminated = new Set();
  const widgets = [];
  let locked = false;

  const hasFigures = step.options.some((o) => o.figure);
  /** Photographs as options: the picture fills the card, and the credits are listed under the grid. */
  const hasPhotos = step.options.some((o) => o.figure && o.figure.type === 'photo');
  const allShort = step.options.every((o) => plainLength(o.text) <= 16);
  const allTiny = step.options.every((o) => plainLength(o.text) <= 7);
  const cols = step.columns || (hasFigures ? 2 : allShort && n <= 8 ? 2 : 1);

  const buttons = new Map();
  const list = h('div', {
    class: cx('options', multi && 'is-multi', cols > 1 && 'is-grid', hasFigures && 'has-figures', hasPhotos && 'has-photos', allTiny && 'is-tiny'),
    role: multi ? 'group' : 'radiogroup',
    'aria-label': multi ? 'Select all that apply' : 'Choose one answer',
    style: { '--cols': cols, '--n': n },
  });

  function refresh() {
    for (const [idx, btn] of buttons) {
      btn.setAttribute('aria-checked', String(selected.has(idx)));
    }
    env.onReady(selected.size > 0);
  }

  function toggle(idx) {
    if (locked || eliminated.has(idx)) return;
    if (multi) {
      if (selected.has(idx)) selected.delete(idx); else selected.add(idx);
    } else {
      selected.clear();
      selected.add(idx);
    }
    for (const btn of buttons.values()) btn.classList.remove('is-wrong-pick');
    play('select');
    refresh();
  }

  order.forEach((idx, pos) => {
    const opt = step.options[idx];
    let figBox = null;
    if (opt.figure) {
      figBox = h('span.option-figure');
      createWidget(opt.figure, { rng: env.rng, readOnly: true, compact: true }).then((w) => {
        widgets.push(w);
        figBox.appendChild(w.el);
      });
    }
    const btn = h('button.option', {
      type: 'button',
      role: multi ? 'checkbox' : 'radio',
      'aria-checked': 'false',
      // Math is typeset with markup screen readers handle unevenly, so give a spoken name.
      'aria-label': /\$/.test(opt.text) || !opt.text ? (mdText(opt.text) || (opt.figure && opt.figure.alt) || `Option ${LETTERS[pos]}`) : null,
      onclick: () => toggle(idx),
    },
      h('span.option-key', { 'aria-hidden': 'true' }, LETTERS[pos] || String(pos + 1)),
      h('span.option-body', figBox, opt.text ? mdSpan(opt.text) : null),
      h('span.option-mark', { 'aria-hidden': 'true' }),
    );
    // arrow keys move between options, as expected of a radio group
    btn.addEventListener('keydown', (ev) => {
      const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
      if (!dir) return;
      ev.preventDefault();
      const all = Array.from(list.children);
      const next = all[(all.indexOf(btn) + dir + all.length) % all.length];
      if (next) next.focus();
    });
    buttons.set(idx, btn);
    list.appendChild(btn);
  });

  function mark(idx, kind) {
    const btn = buttons.get(idx);
    btn.classList.remove('is-correct', 'is-wrong');
    btn.classList.add(kind === 'correct' ? 'is-correct' : 'is-wrong');
    const slot = btn.querySelector('.option-mark');
    slot.textContent = '';
    slot.appendChild(icon(kind === 'correct' ? 'check' : 'x', { size: 20, stroke: 3 }));
  }

  // A photo's source page usually names what it shows, so the credits only become links once the step is answered.
  let credits = null;
  const linkCredits = () => {
    if (!credits) return;
    for (const span of credits.querySelectorAll('span[data-href]')) {
      span.replaceChildren(h('a', { href: span.dataset.href, target: '_blank', rel: 'noopener noreferrer' }, span.textContent));
      span.removeAttribute('data-href');
    }
  };
  if (hasPhotos) {
    credits = h('details.option-credits', h('summary', 'Picture credits'));
    import('../../widgets/photo.js').then(({ creditLine }) => {
      const rows = order.map((idx, pos) => [LETTERS[pos] || String(pos + 1), step.options[idx].figure])
        .filter(([, fig]) => fig && fig.type === 'photo' && creditLine(fig));
      credits.appendChild(h('ul', rows.map(([letter, fig]) => h('li', h('b', `${letter} `), h('span', { dataset: { href: fig.sourceUrl || null } }, creditLine(fig))))));
      if (locked) linkCredits();
    }).catch(() => {});
  }

  const el = h('div', multi ? h('p.step-instruction', 'Select all that apply') : null, list, credits);

  return {
    el,
    check() {
      if (!multi) {
        const idx = Array.from(selected)[0];
        const opt = step.options[idx];
        // An opinion poll has no right answer: the pick simply stays highlighted.
        if (poll) return { correct: true, message: opt.why };
        if (opt.correct) { mark(idx, 'correct'); return { correct: true, message: opt.why }; }
        mark(idx, 'wrong');
        eliminated.add(idx);
        return { correct: false, message: opt.why };
      }
      const wrongPicks = Array.from(selected).filter((i) => !step.options[i].correct);
      const missed = step.options.map((o, i) => i).filter((i) => step.options[i].correct && !selected.has(i));
      if (!wrongPicks.length && !missed.length) {
        for (const i of selected) mark(i, 'correct');
        return { correct: true };
      }
      for (const i of wrongPicks) { mark(i, 'wrong'); eliminated.add(i); }
      const why = wrongPicks.map((i) => step.options[i].why).find(Boolean);
      const right = selected.size - wrongPicks.length;
      let message = why;
      if (!message) {
        if (wrongPicks.length && missed.length) message = `${right} of your picks ${right === 1 ? 'is' : 'are'} right, but something is off and something is missing.`;
        else if (wrongPicks.length) message = `One of your picks does not belong.`;
        else message = `Everything you picked is right — but there ${missed.length === 1 ? 'is one more' : 'are more'}.`;
      }
      return { correct: false, message };
    },
    retry() {
      for (const idx of eliminated) {
        selected.delete(idx);
        const btn = buttons.get(idx);
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }
      if (!multi) selected.clear();
      refresh();
    },
    reveal() {
      if (poll) return;
      step.options.forEach((opt, idx) => {
        const btn = buttons.get(idx);
        if (opt.correct) mark(idx, 'correct');
        else if (!btn.classList.contains('is-wrong')) btn.classList.add('is-dim');
      });
    },
    lock() {
      locked = true;
      for (const btn of buttons.values()) btn.classList.add('is-locked');
      list.setAttribute('aria-disabled', 'true');
      linkCredits();
    },
    onKey(ev) {
      if (locked || ev.ctrlKey || ev.metaKey || ev.altKey) return false;
      let pos = -1;
      if (/^[1-9]$/.test(ev.key)) pos = Number(ev.key) - 1;
      else if (/^[a-z]$/i.test(ev.key)) pos = LETTERS.indexOf(ev.key.toUpperCase());
      if (pos < 0 || pos >= n) return false;
      toggle(order[pos]);
      return true;
    },
    picked: () => Array.from(selected),
    solve() { // used by automated tests
      selected.clear();
      step.options.forEach((o, i) => { if (o.correct) selected.add(i); });
      if (!selected.size) selected.add(0);
      refresh();
    },
    destroy() { widgets.forEach((w) => w.destroy()); },
  };
}
