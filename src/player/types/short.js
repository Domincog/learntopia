/** `short` — a word or short phrase, compared forgivingly (case, spacing, punctuation). */
import { h } from '../../core/dom.js';
import { mdSpan, matchesAny } from '../ui.js';

export default function short(step, env) {
  const longest = step.answers.reduce((n, a) => Math.max(n, a instanceof RegExp ? 8 : String(a).length), 6);
  const input = h('input.answer-input.is-text', {
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: false,
    enterkeyhint: 'done',
    placeholder: step.placeholder || 'Type your answer',
    'aria-label': step.label || 'Your answer',
    size: Math.min(28, longest + 4),
  });
  const row = h('div.answer-row',
    step.prefix ? mdSpan(step.prefix, 'answer-affix') : null,
    h('div.answer-box', input),
    step.unit ? mdSpan(step.unit, 'answer-affix') : null,
  );
  input.addEventListener('input', () => {
    row.classList.remove('is-wrong', 'is-right');
    env.onReady(input.value.trim() !== '');
  });

  const firstText = step.answers.find((a) => typeof a === 'string');

  return {
    el: row,
    check() {
      if (matchesAny(input.value, step.answers, step.caseSensitive)) {
        row.classList.add('is-right');
        return { correct: true };
      }
      let message = null;
      for (const [wrongValue, text] of step.wrong) {
        if (matchesAny(input.value, [wrongValue], step.caseSensitive)) { message = text; break; }
      }
      if (!message && typeof step.feedback === 'function') message = step.feedback(input.value) || null;
      row.classList.add('is-wrong');
      return { correct: false, message };
    },
    retry() { row.classList.remove('is-wrong'); input.focus({ preventScroll: true }); input.select(); },
    reveal() {
      input.value = step.display != null ? String(step.display) : (firstText != null ? firstText : '');
      row.classList.remove('is-wrong');
      row.classList.add('is-revealed');
    },
    lock() { input.readOnly = true; },
    focus() { input.focus({ preventScroll: true }); },
    solve() { input.value = step.solveWith != null ? step.solveWith : (firstText != null ? firstText : ''); env.onReady(true); },
  };
}
