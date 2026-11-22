/**
 * `numeric` — type a number. Accepts decimals, fractions, mixed numbers and
 * simple arithmetic ("3/4", "1 1/2", "2^5").
 *
 * `plain: true` accepts only a finished number (a decimal, a fraction or a
 * mixed number). Use it when the question IS the arithmetic ("What is 2⁻³?"),
 * so that typing the question back is not an answer.
 */
import { h } from '../../core/dom.js';
import { parseNumber, formatNumber } from '../../core/mathexpr.js';
import { mdText } from '../../core/markdown.js';
import { mdSpan, numbersMatch, commaAlternative, dotThousandsAlternative, isPlainNumber } from '../ui.js';

export default function numeric(step, env) {
  const needsFullKeyboard = step.answer < 0 || !Number.isInteger(step.answer) || step.keyboard === 'full';
  const input = h('input.answer-input', {
    type: 'text',
    inputmode: needsFullKeyboard ? 'text' : 'numeric',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: false,
    enterkeyhint: 'done',
    placeholder: step.placeholder || '?',
    'aria-label': step.label || 'Your answer',
    size: Math.max(4, String(step.display || formatNumber(step.answer, 6)).length + 2),
  });
  const row = h('div.answer-row',
    step.prefix ? mdSpan(step.prefix, 'answer-affix') : null,
    h('div.answer-box', input),
    step.unit ? mdSpan(step.unit, 'answer-affix') : null,
  );
  const plainUnit = step.unit ? mdText(step.unit) : '';

  input.addEventListener('input', () => {
    row.classList.remove('is-wrong', 'is-right');
    env.onReady(input.value.trim() !== '');
  });

  const read = () => parseNumber(input.value, { unit: plainUnit, percentAsNumber: plainUnit === '%' });
  const matches = (v, target) => numbersMatch(v, target, step.tolerance);

  return {
    el: row,
    check() {
      const v = read();
      if (!Number.isFinite(v)) {
        return { invalid: true, message: 'That does not look like a number yet. Try something like `12`, `0.5` or `3/4`.' };
      }
      if (step.plain) {
        let typed = input.value.trim().replace(/[−–—]/g, '-');
        if (plainUnit && typed.toLowerCase().endsWith(plainUnit.toLowerCase())) typed = typed.slice(0, -plainUnit.length).trim();
        if (!isPlainNumber(typed)) {
          return { invalid: true, title: 'One more step', message: 'Work it out and type the result as a single number, such as `8`, `0.125` or `1/8`.' };
        }
      }
      // "3,301" may be three thousand or a decimal comma: either reading that is right counts.
      const alt = commaAlternative(input.value);
      const dotted = dotThousandsAlternative(input.value); // "40.000" meant as forty thousand
      const right = (x) => matches(x, step.answer) || step.accept.some((a) => matches(x, a));
      if (right(v) || right(alt) || right(dotted)) {
        row.classList.add('is-right');
        return { correct: true };
      }
      let message = null;
      for (const [wrongValue, text] of step.wrong) if (matches(v, wrongValue)) { message = text; break; }
      if (!message && typeof step.feedback === 'function') message = step.feedback(v) || null;
      row.classList.add('is-wrong');
      return { correct: false, message };
    },
    retry() {
      row.classList.remove('is-wrong');
      input.focus({ preventScroll: true });
      input.select();
    },
    reveal() {
      input.value = step.display != null ? String(step.display) : formatNumber(step.answer, 6).replace('−', '-');
      row.classList.remove('is-wrong');
      row.classList.add('is-revealed');
    },
    lock() { input.readOnly = true; input.setAttribute('aria-readonly', 'true'); },
    focus() { input.focus({ preventScroll: true }); },
    solve() { input.value = String(step.answer); env.onReady(true); },
  };
}
