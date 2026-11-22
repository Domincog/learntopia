/**
 * `expr` — type an algebraic expression. Any equivalent form is accepted
 * ("2(x+3)" for "2x+6"); equivalence is checked numerically. A typeset
 * preview shows the learner how their input is being read.
 *
 * `expanded: true` asks for an answer without brackets: one that still has
 * them is sent back with a note (or with the string given), at no cost.
 */
import { h } from '../../core/dom.js';
import { parse, equivalent } from '../../core/mathexpr.js';
import { exprToTex } from '../../core/mathtex.js';
import { renderMath } from '../../core/markdown.js';
import { mdSpan } from '../ui.js';

export default function expr(step, env) {
  const vars = step.vars;
  const input = h('input.answer-input.is-text.is-math', {
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: false,
    enterkeyhint: 'done',
    placeholder: step.placeholder || `expression in ${vars.join(', ')}`,
    'aria-label': step.label || 'Your expression',
    size: Math.min(30, Math.max(12, step.answer.length + 6)),
  });
  const preview = h('div.expr-preview', { 'aria-live': 'polite' });
  const row = h('div.answer-row',
    step.prefix ? mdSpan(step.prefix, 'answer-affix') : null,
    h('div.answer-box', input),
  );

  function updatePreview() {
    const raw = input.value.trim();
    if (!raw) { preview.textContent = ''; preview.classList.remove('is-bad'); return; }
    const tex = exprToTex(raw, { vars });
    if (tex == null) {
      preview.classList.add('is-bad');
      preview.textContent = '…';
    } else {
      preview.classList.remove('is-bad');
      preview.innerHTML = renderMath(tex, false);
    }
  }

  input.addEventListener('input', () => {
    row.classList.remove('is-wrong', 'is-right');
    updatePreview();
    env.onReady(input.value.trim() !== '');
  });

  return {
    el: h('div', row, preview, h('p.step-instruction', 'Use ', h('code', '^'), ' for powers and ', h('code', '/'), ' for fractions, e.g. ', h('code', '3x^2/4'))),
    check() {
      const raw = input.value.trim();
      try {
        parse(raw, { vars });
      } catch (err) {
        return { invalid: true, message: `I could not read that expression: ${err.message}. Use only ${vars.map((v) => `\`${v}\``).join(', ')} and numbers.` };
      }
      // "Expand (x + 2)(x + 5)" must not be answered by typing the question back.
      if (step.expanded && /[()]/.test(raw)) {
        return { invalid: true, title: 'One more step', message: typeof step.expanded === 'string' ? step.expanded : 'That still has brackets in it. Multiply them out and collect the terms.' };
      }
      if (equivalent(raw, step.answer, vars)) {
        row.classList.add('is-right');
        return { correct: true };
      }
      // "e^2x" is read as e²·x. If the learner plainly meant e^(2x), and that would be right,
      // say how to type it instead of marking a correct idea wrong.
      const bracketed = raw.replace(/\^(-?\d*\.?\d+)([a-zA-Z](?:\^\d+)?)/g, '^($1$2)');
      if (bracketed !== raw) {
        let meant = false;
        try { meant = equivalent(bracketed, step.answer, vars); } catch { meant = false; }
        if (meant) {
          return { invalid: true, title: 'Check the exponent', message: 'An exponent that is more than a single number needs brackets. Type it like `e^(2x)`, not `e^2x`, which is read as $e^2 \\cdot x$.' };
        }
      }
      let message = null;
      for (const [wrongExpr, text] of step.wrong) {
        if (equivalent(raw, String(wrongExpr), vars)) { message = text; break; }
      }
      row.classList.add('is-wrong');
      return { correct: false, message };
    },
    retry() { row.classList.remove('is-wrong'); input.focus({ preventScroll: true }); input.select(); },
    reveal() {
      input.value = step.display || step.answer;
      row.classList.remove('is-wrong');
      row.classList.add('is-revealed');
      updatePreview();
    },
    lock() { input.readOnly = true; },
    focus() { input.focus({ preventScroll: true }); },
    solve() { input.value = step.answer; updatePreview(); env.onReady(true); },
  };
}
